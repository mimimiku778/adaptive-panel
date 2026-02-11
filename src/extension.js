import {Extension} from 'resource:///org/gnome/shell/extensions/extension.js';
import * as Main from 'resource:///org/gnome/shell/ui/main.js';
import Shell from 'gi://Shell';
import Meta from 'gi://Meta';
import Gio from 'gi://Gio';
import GLib from 'gi://GLib';

export default class AdaptivePanelExtension extends Extension {
    enable() {
        Gio._promisify(Shell.Screenshot.prototype,
            'pick_color', 'pick_color_finish');

        this._signals = [];
        this._windowSignals = new Map();
        this._debounceId = 0;
        this._followUpId = 0;
        this._followUpId2 = 0;
        this._settleId = 0;
        this._generation = 0;
        this._pollId = 0;
        this._overviewClosing = false;
        this._settling = false;
        this._lastWindowColor = null;
        this._currentBg = null;
        this._applyingStyle = false;

        this._ifaceSettings = new Gio.Settings({
            schema_id: 'org.gnome.desktop.interface',
        });

        this._connectTo(this._ifaceSettings, 'changed::color-scheme',
            () => this._scheduleUpdate());
        this._connectTo(global.display, 'notify::focus-window',
            () => this._onFocusChanged());
        this._connectTo(global.display, 'window-created',
            (_d, w) => this._trackWindow(w));
        this._connectTo(global.display, 'restacked',
            () => this._scheduleUpdate());
        this._connectTo(global.workspace_manager, 'active-workspace-changed',
            () => this._scheduleUpdate());
        this._connectTo(Main.overview, 'showing',
            () => this._applyThemeColor());
        this._connectTo(Main.overview, 'hiding', () => {
            this._overviewClosing = true;
            this._applyThemeColor();
        });

        // Re-apply panel color when overview.js clears Main.panel.style
        // after emitting 'hidden', preventing the theme default from showing.
        this._styleWatchId = Main.panel.connect('notify::style', () => {
            if (this._applyingStyle || !this._currentBg)
                return;
            const s = Main.panel.style;
            if (!s || !s.includes('background-color')) {
                const {r, g, b} = this._currentBg;
                this._applyColor(r, g, b, true);
            }
        });

        this._connectTo(Main.overview, 'hidden', () => {
            this._overviewClosing = false;
            const maxWin = this._findMaximizedWindow();
            if (maxWin && this._lastWindowColor) {
                const {r, g, b} = this._lastWindowColor;
                this._applyColor(r, g, b);
            } else {
                this._applyThemeColor();
            }
            // Let rendering settle before color-picking again
            this._settling = true;
            this._clearSource('_settleId');
            this._settleId = GLib.timeout_add(GLib.PRIORITY_DEFAULT, 500, () => {
                this._settleId = 0;
                this._settling = false;
                this._updatePanel();
                return GLib.SOURCE_REMOVE;
            });
        });

        for (const a of global.get_window_actors())
            this._trackWindow(a.meta_window);

        this._scheduleUpdate();

        // Poll every 5 s to catch late header bar repaints (e.g. Electron apps)
        this._pollId = GLib.timeout_add(GLib.PRIORITY_DEFAULT_IDLE, 5000, () => {
            if (!this._settling && !Main.overview.visible &&
                !this._overviewClosing && this._findMaximizedWindow())
                this._updatePanel();
            return GLib.SOURCE_CONTINUE;
        });
    }

    disable() {
        if (this._styleWatchId) {
            Main.panel.disconnect(this._styleWatchId);
            this._styleWatchId = 0;
        }
        this._currentBg = null;

        this._clearSource('_debounceId');
        this._clearSource('_followUpId');
        this._clearSource('_followUpId2');
        this._clearSource('_settleId');
        this._clearSource('_pollId');

        this._resetStyle();

        for (const {obj, id} of this._signals)
            obj.disconnect(id);
        this._signals = [];

        for (const [w, ids] of this._windowSignals) {
            for (const id of ids) {
                try {
                    w.disconnect(id);
                } catch (_e) {
                    // Window already destroyed
                }
            }
        }
        this._windowSignals.clear();

        if (this._ifaceSettings) {
            this._ifaceSettings.run_dispose();
            this._ifaceSettings = null;
        }
    }

    _connectTo(obj, signal, handler) {
        const id = obj.connect(signal, handler);
        this._signals.push({obj, id});
    }

    _clearSource(prop) {
        if (this[prop]) {
            GLib.source_remove(this[prop]);
            this[prop] = 0;
        }
    }

    _trackWindow(window) {
        if (this._windowSignals.has(window))
            return;
        const ids = [
            window.connect('notify::maximized-horizontally',
                () => this._scheduleUpdateWithFollowUp()),
            window.connect('notify::maximized-vertically',
                () => this._scheduleUpdateWithFollowUp()),
            window.connect('size-changed',
                () => this._scheduleUpdate()),
            window.connect('unmanaging', () => {
                this._untrackWindow(window);
                this._scheduleUpdate();
            }),
        ];
        this._windowSignals.set(window, ids);
    }

    _untrackWindow(window) {
        const ids = this._windowSignals.get(window);
        if (!ids)
            return;
        for (const id of ids)
            window.disconnect(id);
        this._windowSignals.delete(window);
    }

    _onFocusChanged() {
        const w = global.display.focus_window;
        if (w)
            this._trackWindow(w);
        this._scheduleUpdateWithFollowUp();
    }

    _scheduleUpdate(delay = 150) {
        this._clearSource('_debounceId');
        this._debounceId = GLib.timeout_add(GLib.PRIORITY_DEFAULT, delay, () => {
            this._debounceId = 0;
            this._updatePanel();
            return GLib.SOURCE_REMOVE;
        });
    }

    _scheduleUpdateWithFollowUp() {
        this._scheduleUpdate();
        this._clearSource('_followUpId');
        this._clearSource('_followUpId2');
        this._followUpId = GLib.timeout_add(GLib.PRIORITY_DEFAULT, 500, () => {
            this._followUpId = 0;
            this._updatePanel();
            return GLib.SOURCE_REMOVE;
        });
        this._followUpId2 = GLib.timeout_add(GLib.PRIORITY_DEFAULT, 1500, () => {
            this._followUpId2 = 0;
            this._updatePanel();
            return GLib.SOURCE_REMOVE;
        });
    }

    async _updatePanel() {
        const gen = ++this._generation;

        if (Main.overview.visible || this._overviewClosing ||
            Main.sessionMode.currentMode === 'unlock-dialog' ||
            Main.sessionMode.currentMode === 'lock-screen') {
            this._applyThemeColor();
            return;
        }

        if (this._settling)
            return;

        const maxWin = this._findMaximizedWindow();
        if (maxWin)
            await this._pickAndApply(gen);
        else
            this._applyThemeColor();
    }

    _findMaximizedWindow() {
        const pri = Main.layoutManager.primaryIndex;
        const ws = global.workspace_manager.get_active_workspace();
        const windows = ws.list_windows().filter(w =>
            w.get_monitor() === pri &&
            !w.minimized &&
            w.window_type === Meta.WindowType.NORMAL &&
            w.maximized_horizontally && w.maximized_vertically
        );
        if (windows.length === 0)
            return null;
        return global.display.sort_windows_by_stacking(windows).at(-1);
    }

    async _pickAndApply(gen) {
        try {
            const screenshot = new Shell.Screenshot();
            const panelH = Main.panel.get_height();
            const mon = Main.layoutManager.primaryMonitor;
            const y = mon.y + panelH + 5;

            const colors = [];
            for (const frac of [0.25, 0.50, 0.75]) {
                if (gen !== this._generation)
                    return;
                const x = mon.x + Math.round(mon.width * frac);
                const [color] = await screenshot.pick_color(x, y);
                colors.push({
                    r: Math.round(color.get_red() * 255),
                    g: Math.round(color.get_green() * 255),
                    b: Math.round(color.get_blue() * 255),
                });
            }

            if (gen !== this._generation)
                return;

            // Median by luminance to ignore outliers (e.g. a button)
            colors.sort((a, b) => this._lum(a) - this._lum(b));
            const {r, g, b} = colors[1];
            this._lastWindowColor = {r, g, b};
            this._applyColor(r, g, b);
        } catch (e) {
            console.debug(`[adaptive-panel] pick_color failed: ${e.message}`);
            this._applyThemeColor();
        }
    }

    _lum({r, g, b}) {
        return 0.2126 * r + 0.7152 * g + 0.0722 * b;
    }

    _applyThemeColor() {
        const isDark =
            this._ifaceSettings.get_string('color-scheme') === 'prefer-dark';
        if (isDark)
            this._applyColor(0x13, 0x13, 0x13);
        else
            this._applyColor(0xFA, 0xFA, 0xFA);
    }

    _applyColor(r, g, b, instant = false) {
        this._currentBg = {r, g, b};
        const light = this._lum({r, g, b}) > 128;
        const fg = light ? '#3D3D3D' : '#f2f2f2';
        const dur = instant ? '0ms' : '350ms';

        this._applyingStyle = true;
        Main.panel.set_style(
            `background-color: rgb(${r},${g},${b}); ` +
            `color: ${fg}; ` +
            `transition-duration: ${dur};`
        );
        this._applyingStyle = false;

        if (light) {
            Main.panel.remove_style_class_name('adaptive-panel-dark');
            Main.panel.add_style_class_name('adaptive-panel-light');
        } else {
            Main.panel.remove_style_class_name('adaptive-panel-light');
            Main.panel.add_style_class_name('adaptive-panel-dark');
        }

        // Panel child boxes use private API (_leftBox etc.) because
        // there is no public accessor for iterating panel containers.
        for (const box of [Main.panel._leftBox, Main.panel._centerBox, Main.panel._rightBox]) {
            if (!box)
                continue;
            for (const child of box.get_children())
                child.set_style(`color: ${fg};`);
        }
    }

    _resetStyle() {
        Main.panel.set_style(null);
        Main.panel.remove_style_class_name('adaptive-panel-light');
        Main.panel.remove_style_class_name('adaptive-panel-dark');
        for (const box of [Main.panel._leftBox, Main.panel._centerBox, Main.panel._rightBox]) {
            if (!box)
                continue;
            for (const child of box.get_children())
                child.set_style(null);
        }
    }
}
