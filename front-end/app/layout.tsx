import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "PitchLens",
  description: "Message intelligence engine for high-impact messaging.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased" suppressHydrationWarning={true}>
        {children}
      </body>
    </html>
  );
}
