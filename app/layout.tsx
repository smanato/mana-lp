import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "まな式AIマネタイズ完全攻略プログラム | 会員サイト",
  description:
    "セミナー・レビュー・教材を会員専用で管理する会員サイトです。",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ja">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=Noto+Sans+JP:wght@400;500;600;700;800;900&display=swap"
          rel="stylesheet"
        />
        <link rel="icon" href="/robot-icon.svg" type="image/svg+xml" />
      </head>
      <body>
        <main className="shell">{children}</main>
      </body>
    </html>
  );
}
