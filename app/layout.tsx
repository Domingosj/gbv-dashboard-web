import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Sidebar from "@/components/Sidebar";
import Header from "@/components/Header";

const inter = Inter({ subsets: ["latin"], display: "swap" });

export const metadata: Metadata = {
  title: "GCR Dashboard — GBV Case Management",
  description: "Sistema de Gestão de Casos de Violência Baseada no Género",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt">
      <body className={`${inter.className} bg-background text-text-primary antialiased`}>
        <div className="flex min-h-screen">
          <Sidebar />
          <div className="flex-1 flex flex-col min-w-0">
            <Header />
            <main className="flex-1 p-6 lg:p-8 overflow-auto">
              {children}
            </main>
          </div>
        </div>
      </body>
    </html>
  );
}
