import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Sidebar from "@/components/Sidebar";

const inter = Inter({ subsets: ["latin"], display: "swap" });

export const metadata: Metadata = {
  title: "GCR Dashboard — Gestão de Casos VBG",
  description: "Sistema de Gestão de Casos de Violência Baseada no Género",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt">
      <body className={`${inter.className} bg-background text-text-primary antialiased`}>
        <div className="flex min-h-screen">
          <Sidebar />
          <main className="flex-1 p-6 md:p-8 overflow-auto min-w-0">
            {children}
          </main>
        </div>
      </body>
    </html>
  );
}
