import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { SiteHeader } from "@/components/site-header";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: { default: "Agent Trio", template: "%s | Agent Trio" },
  description: "Equipo de tres agentes de IA que planifica, desarrolla y prueba cambios en una web.",
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f6f6f3" },
    { media: "(prefers-color-scheme: dark)", color: "#111215" },
  ],
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="es" className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col">
        <a
          href="#main"
          className="btn btn-primary absolute left-4 top-2 z-10 -translate-y-20 focus:translate-y-0"
        >
          Saltar al contenido
        </a>
        <SiteHeader />
        <main id="main" tabIndex={-1} className="mx-auto w-full max-w-7xl flex-1 px-4 py-6 sm:px-6 lg:py-10">
          {children}
        </main>
        <footer className="border-t border-border px-4 py-5 text-center text-sm text-muted">
          Prueba técnica. Los agentes trabajan sobre una web ficticia.
        </footer>
      </body>
    </html>
  );
}
