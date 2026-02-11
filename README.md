# Adaptive Panel

A GNOME Shell extension that makes the top panel color match the maximized window's header bar.

Eliminates the visible boundary between the panel and window, creating a seamless look -- and helps prevent OLED burn-in by avoiding a static panel color.

| Light app maximized | Dark app maximized |
|---|---|
| ![light](screenshots/light.png) | ![dark](screenshots/dark.png) |

## What it does

| Problem | Solution |
|---|---|
| The panel stays one fixed color regardless of the window below it | Panel color automatically syncs to the maximized window's header bar |
| Dark panel + light app (or vice versa) creates a harsh boundary | Panel blends seamlessly with the active window |
| Static panel color can cause OLED burn-in | Panel color changes dynamically, reducing burn-in risk |
| Switching dark/light mode doesn't update the panel to match | Panel follows the system color scheme when no window is maximized |

## Installation

Tested on Ubuntu 25.10 (GNOME Shell 49).

```bash
git clone https://github.com/mimimiku778/adaptive-panel.git
cd adaptive-panel
bash install.sh
```

Then restart GNOME Shell:
- **Wayland**: Log out and log back in

### Uninstall

```bash
bash install.sh --uninstall
```

## License

[MIT](LICENSE)

---

# Adaptive Panel (日本語)

GNOME Shell のトップパネルの色を、最大化ウィンドウのヘッダーバーに合わせて動的に変更する拡張機能です。

パネルとウィンドウの境界をなくし、シームレスな見た目を実現します。パネル色が固定されないため、OLED の焼付き防止にも効果があります。

| ライトアプリ最大化時 | ダークアプリ最大化時 |
|---|---|
| ![light](screenshots/light.png) | ![dark](screenshots/dark.png) |

## 何をするか

| 問題 | 解決 |
|---|---|
| パネルの色が固定で、下のウィンドウと合わない | パネルの色が最大化ウィンドウのヘッダーバーに自動同期 |
| ダークパネル＋ライトアプリ（またはその逆）で境界が目立つ | パネルがウィンドウとシームレスに一体化 |
| パネル色が固定だと OLED の焼付きの原因になる | パネル色が動的に変わり、焼付きリスクを軽減 |
| ダーク/ライトモード切替がパネルに反映されない | 最大化ウィンドウがないときはシステムのカラースキームに追従 |

## インストール

Ubuntu 25.10 (GNOME Shell 49) で動作確認済み。

```bash
git clone https://github.com/mimimiku778/adaptive-panel.git
cd adaptive-panel
bash install.sh
```

GNOME Shell を再起動してください:
- **Wayland**: ログアウト → ログイン

### アンインストール

```bash
bash install.sh --uninstall
```

## ライセンス

[MIT](LICENSE)
