import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { ThemeProvider } from "@/components/ThemeContext";
import { AppShell } from "@/components/AppShell";
import { WalletProvider } from "@/context/WalletContext";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Agentro | AI Content Strategy Engine",
  description: "AI-powered trend intelligence for creators.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${inter.className} bg-background text-foreground antialiased custom-scrollbar`}
      >
        <WalletProvider>
          <ThemeProvider>
            <div className="aurora-bg">
              <div className="aurora-blob blob-1" />
              <div className="aurora-blob blob-2" />
              <div className="aurora-blob blob-3" />
            </div>

            <AppShell>{children}</AppShell>
          </ThemeProvider>
        </WalletProvider>
      </body>
    </html>
  );
}
