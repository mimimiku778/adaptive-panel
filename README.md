# Adaptive Panel

A GNOME Shell extension that dynamically adapts the top panel color to match your desktop environment -- designed to protect OLED displays from burn-in.

## Features

- **Dark/Light mode aware** -- Panel automatically switches between dark and light backgrounds based on your system color scheme
- **Header bar sync** -- When a window is maximized, the panel color smoothly transitions to match the window's header bar
- **Smart text contrast** -- Text and icon colors automatically adjust for readability against any background
- **Smooth transitions** -- All color changes animate with a 350ms transition
- **OLED friendly** -- Prevents static bright/dark regions that cause burn-in on OLED panels

## How It Works

The extension picks the color of the area just below the panel (inside the header bar of a maximized window) at three horizontal points, then uses the median luminance sample to set the panel background. When no window is maximized or the overview is open, it falls back to theme-appropriate colors.

## Requirements

- GNOME Shell 49+
- Wayland or X11

## Installation

```bash
git clone https://github.com/mimimiku778/adaptive-panel.git
cd adaptive-panel
bash install.sh
```

Then restart GNOME Shell:
- **Wayland**: Log out and log back in

## Uninstall

```bash
bash install.sh --uninstall
```

Then restart GNOME Shell.

## License

[MIT](LICENSE)

---

# Adaptive Panel (日本語)

GNOME Shell のトップパネルの色をデスクトップ環境に合わせて動的に変更する拡張機能です。OLED ディスプレイの焼付き防止を目的としています。

## 機能

- **ダーク/ライトモード対応** -- システムのカラースキームに合わせてパネルの背景色を自動切替
- **ヘッダーバー同期** -- ウィンドウが最大化されると、パネルの色がウィンドウのヘッダーバーの色にスムーズに変化
- **スマートテキストコントラスト** -- 背景色に応じてテキストとアイコンの色を自動調整
- **スムーズなトランジション** -- すべての色変更は 350ms のアニメーション付き
- **OLED フレンドリー** -- パネルの固定的な明暗領域を防ぎ、焼付きを軽減

## 仕組み

パネル直下（最大化ウィンドウのヘッダーバー内）の色を水平方向 3 点でサンプリングし、輝度の中央値を使ってパネルの背景色を決定します。最大化ウィンドウがない場合やオーバービュー表示中は、テーマに適した色にフォールバックします。

## 必要条件

- GNOME Shell 49 以上
- Wayland または X11

## インストール

```bash
git clone https://github.com/mimimiku778/adaptive-panel.git
cd adaptive-panel
bash install.sh
```

GNOME Shell を再起動してください:
- **Wayland**: ログアウト → ログイン

## アンインストール

```bash
bash install.sh --uninstall
```

その後 GNOME Shell を再起動してください。

## ライセンス

[MIT](LICENSE)
