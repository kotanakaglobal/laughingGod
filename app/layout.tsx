import "./globals.css";
import Link from "next/link";

export const metadata = {
  title: "Laughing God MVP",
  description: "Session based funny moments voting",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ja">
      <body>
        <header className="header">
          <h1>Laughing God</h1>
          <nav>
            <Link href="/">Sessions</Link>
            <Link href={`/archive/${new Date().toISOString().slice(0, 7)}`}>Archive</Link>
          </nav>
        </header>
        <main className="container">{children}</main>
      </body>
    </html>
  );
}
