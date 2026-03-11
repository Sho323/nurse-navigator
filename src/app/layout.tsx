import "./globals.css";

export const metadata = {
  title: "Nurse Navigator",
  description: "AI経営・加算ナビゲーションシステム",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ja">
      <body className="min-h-screen font-sans">
        {children}
      </body>
    </html>
  );
}
