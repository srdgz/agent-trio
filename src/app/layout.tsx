import type { Metadata, Viewport } from "next";
import { DM_Sans, JetBrains_Mono, Outfit } from "next/font/google";
import { SiteHeader } from "@/components/site-header";
import "./globals.css";

const heading = Outfit({
  variable: "--font-heading",
  subsets: ["latin"],
});

const body = DM_Sans({
  variable: "--font-body",
  subsets: ["latin"],
});

const code = JetBrains_Mono({
  variable: "--font-code",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: { default: "Agent Trio", template: "%s | Agent Trio" },
  description: "Equipo de tres agentes de IA que planifica, desarrolla y prueba cambios en una app Next.js.",
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#e8edf5" },
    { media: "(prefers-color-scheme: dark)", color: "#0d1220" },
  ],
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="es" className={`${heading.variable} ${body.variable} ${code.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col">
        <a
          href="#main"
          className="btn btn-primary absolute left-4 top-2 z-20 -translate-y-20 focus:translate-y-0"
        >
          Saltar al contenido
        </a>
        <SiteHeader />
        <main id="main" tabIndex={-1} className="mx-auto w-full max-w-7xl flex-1 px-4 py-6 sm:px-6 lg:py-10">
          {children}
        </main>
        <footer className="px-4 py-6 text-center text-sm text-muted">
          Prueba técnica. Los agentes trabajan sobre una app Next.js ficticia.
        </footer>
      </body>
    </html>
  );
}
