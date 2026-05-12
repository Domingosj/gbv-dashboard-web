import type { Metadata } from "next";
import "./globals.css";
import Sidebar from "@/components/Sidebar";

export const metadata: Metadata = {
  title: "GBV Dashboard — Gestão de Casos VBG",
  description: "Dashboard para gestão de casos de Violência Baseada no Género",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt">
      <body className="bg-background text-text-primary font-body antialiased">
        <div className="flex min-h-screen">
          <Sidebar />
          <main className="flex-1 p-8base overflow-auto">
            {children}
          </main>
        </div>
      </body>
    </html>
  );
}
