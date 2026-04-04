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
          href="https://fonts.googleapis.com/css2?family=Noto+Sans+JP:wght@400;500;700;900&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        <div className="backdrop backdrop--top" />
        <div className="backdrop backdrop--bottom" />
        <main className="shell">{children}</main>
      </body>
    </html>
  );
}
