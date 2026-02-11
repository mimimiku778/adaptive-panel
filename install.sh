#!/usr/bin/env bash
#
# install.sh - Install/uninstall Adaptive Panel GNOME Shell extension
#
# Usage:
#   bash install.sh             # Install
#   bash install.sh --uninstall # Uninstall

set -euo pipefail

EXT_UUID="adaptive-panel@mimimiku778"
EXT_DIR="$HOME/.local/share/gnome-shell/extensions/$EXT_UUID"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SRC_DIR="$SCRIPT_DIR/src"

# --- Colored log ---
info()  { echo -e "\033[1;34m[INFO]\033[0m  $*"; }
ok()    { echo -e "\033[1;32m[OK]\033[0m    $*"; }
error() { echo -e "\033[1;31m[ERROR]\033[0m $*"; exit 1; }

# --- Uninstall ---
if [[ "${1:-}" == "--uninstall" ]]; then
    info "Uninstalling Adaptive Panel extension..."
    gnome-extensions disable "$EXT_UUID" 2>/dev/null || true
    rm -rf "$EXT_DIR"
    ok "Removed: $EXT_DIR"
    echo ""
    info "Restart GNOME Shell to apply:"
    info "  Wayland: Log out -> Log in"
    exit 0
fi

# --- 1. Check GNOME Shell version ---
if ! command -v gnome-shell &>/dev/null; then
    error "GNOME Shell not found. Please run this on a GNOME desktop."
fi

GNOME_VER=$(gnome-shell --version | grep -oP '[0-9]+' | head -1)
info "Detected GNOME Shell $GNOME_VER"

if (( GNOME_VER < 49 )); then
    error "GNOME Shell 49+ is required (current: $GNOME_VER)"
fi

# --- 2. Install extension ---
if [ -d "$EXT_DIR" ]; then
    info "Updating existing extension..."
else
    info "Installing extension..."
fi

mkdir -p "$EXT_DIR"

# Generate metadata.json with detected shell version
sed "s/@SHELL_VERSION@/$GNOME_VER/" "$SRC_DIR/metadata.json.in" > "$EXT_DIR/metadata.json"

# Copy extension files
cp "$SRC_DIR/extension.js" "$EXT_DIR/extension.js"
cp "$SRC_DIR/stylesheet.css" "$EXT_DIR/stylesheet.css"

ok "Installed to: $EXT_DIR"

# --- 3. Enable extension ---
gnome-extensions enable "$EXT_UUID" 2>/dev/null || true
ok "Enabled: $EXT_UUID"

echo ""
info "Restart GNOME Shell to apply:"
info "  Wayland: Log out -> Log in"
