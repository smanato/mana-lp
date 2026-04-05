# Design System — まな式AIマネタイズ完全攻略プログラム

## Brand Identity

- **Product**: まな式AIマネタイズ完全攻略プログラム（会員サイト）
- **Audience**: AI×note収益化を学ぶ日本語話者
- **Tone**: クリーン・プロフェッショナル・信頼感のある白基調UI
- **Visual Direction**: 白を基調にした明るく清潔感のあるデザイン。ブランドカラー（赤×金）はアクセントとして使用

## Colors

### Gray Scale

| Token         | Value     | Usage                   |
| ------------- | --------- | ----------------------- |
| `--gray-50`   | `#F9FAFB` | ページ背景              |
| `--gray-100`  | `#F3F4F6` | サブ背景・ホバー状態    |
| `--gray-200`  | `#E5E7EB` | ボーダー                |
| `--gray-300`  | `#D1D5DB` | ボーダー（ホバー・入力）|
| `--gray-400`  | `#9CA3AF` | プレースホルダー        |
| `--gray-500`  | `#6B7280` | セカンダリテキスト      |
| `--gray-600`  | `#4B5563` | サブテキスト            |
| `--gray-700`  | `#374151` | ラベル・強調テキスト    |
| `--gray-800`  | `#1F2937` | ヘッダーテキスト        |
| `--gray-900`  | `#111827` | プライマリテキスト      |

### Brand Accent

| Token          | Value     | Usage                              |
| -------------- | --------- | ---------------------------------- |
| `--red-600`    | `#DC2626` | プライマリアクセント（CTA・ブランド）|
| `--amber-600`  | `#D97706` | セカンダリアクセント（金）           |
| `--blue-600`   | `#2563EB` | 情報・セカンダリボタン・フォーカス   |
| `--green-600`  | `#059669` | 成功状態・完了マイルストーン         |

### Semantic Tints

| Context  | Background   | Border       | Text         |
| -------- | ------------ | ------------ | ------------ |
| Error    | `--red-50`   | `--red-100`  | `--red-600`  |
| Info     | `--blue-50`  | `--blue-100` | `--blue-600` |
| Success  | `--green-50` | `--green-100`| `--green-600`|
| Warning  | `--amber-50` | `--amber-100`| `--amber-600`|

## Typography

- **Font Family**: `"Noto Sans JP", -apple-system, BlinkMacSystemFont, sans-serif`
- **Weights**: 400 (body), 500 (label), 600 (heading/button), 700 (title), 800 (hero)
- **Line Height**: 1.7 (body), 1.35–1.4 (heading)
- **Antialiasing**: `-webkit-font-smoothing: antialiased`

### Scale

| Element         | Size                      |
| --------------- | ------------------------- |
| Hero Title      | `clamp(22px, 2.8vw, 30px)` |
| Panel Title     | `18px` (font-weight: 700)  |
| Card Heading    | `14–15px`                  |
| Body            | `14px`                     |
| Caption / Badge | `11–13px`                  |

## Spacing & Layout

- **Max Width**: `1120px` (`.shell`)
- **Page Padding**: `0 24px 80px`（mobile: `0 16px 48px`）
- **Panel Padding**: `28px`（hero: `32px`）
- **Content Gap**: `24px`（`.content-stack`）
- **Card Gap**: `12–16px`（グリッド内）
- **Topbar Height**: `64px`

## Border Radius

| Token          | Value   | Usage                    |
| -------------- | ------- | ------------------------ |
| `--radius-sm`  | `8px`   | ボタン・入力欄・バッジ   |
| `--radius`     | `12px`  | カード・パネル・モジュール|
| `--radius-lg`  | `16px`  | パネル（大）             |
| `--radius-xl`  | `24px`  | 認証カード               |
| Pill           | `999px` | バッジ・プログレスバー   |

## Elevation (Shadows)

| Token         | Value                                                         | Usage            |
| ------------- | ------------------------------------------------------------- | ---------------- |
| `--shadow-xs` | `0 1px 2px rgba(0,0,0,0.04)`                                 | カード（静止）   |
| `--shadow-sm` | `0 1px 3px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04)`    | ホバー（小）     |
| `--shadow`    | `0 4px 6px -1px rgba(0,0,0,0.07), 0 2px 4px -2px rgba(0,0,0,0.05)` | ホバー（大） |
| `--shadow-md` | `0 10px 15px -3px rgba(0,0,0,0.08), 0 4px 6px -4px rgba(0,0,0,0.04)` | フローティング |
| `--shadow-lg` | `0 20px 40px -8px rgba(0,0,0,0.12)`                          | 認証カード       |

## Components

### Button Variants

| Class             | Background        | Text           | Border          |
| ----------------- | ----------------- | -------------- | --------------- |
| `.btn--primary`   | `--red-600`       | `white`        | —               |
| `.btn--ghost`     | `transparent`     | `--gray-600`   | `--gray-300`    |
| `.btn--secondary` | `--blue-50`       | `--blue-600`   | —               |
| `.btn--danger`    | `--red-50`        | `--red-600`    | —               |
| `.btn--zoom`      | `--blue-600`      | `white`        | —               |

### Panel

- 白背景 + subtle border + `--shadow-xs`
- Panel title: 左に4px幅のグラデーションインジケーター（赤→金）

### Badge

- Pill shape（999px radius）
- Seminar: 赤50/赤600
- QA: 青50/青600
- Review: 金50/金600
- 各バッジに1px border付き

### Topbar

- Sticky with `backdrop-filter: blur(12px)`
- 半透明白背景 `rgba(255,255,255,0.92)`
- 下部に1px border

## Responsive Breakpoints

| Breakpoint | Changes                                               |
| ---------- | ----------------------------------------------------- |
| `≤980px`   | トップバーwrap、ヒーロー1列、グリッド2列→1列          |
| `≤640px`   | padding縮小、全グリッド1列化、テーブルフォント縮小     |

## Design Principles

1. **Clean White Foundation**: 白背景に最小限のボーダーとシャドウで奥行きを表現
2. **Brand Accent as Highlight**: 赤×金のグラデーションはCTA・プログレス・セクション見出しのみに使用
3. **Semantic Color Tints**: 各状態を50/100番台の薄い色でソフトに表現
4. **Generous Whitespace**: セクション間24px、パネル内28px、読みやすさ重視
5. **Subtle Interaction**: hover時にshadow追加+1px translateYで控えめな浮遊感
6. **Accessibility First**: focus-visible ringの統一、十分なコントラスト比
