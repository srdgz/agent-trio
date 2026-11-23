import type { Metadata, Viewport } from "next";
import { IBM_Plex_Mono, IBM_Plex_Sans } from "next/font/google";
import "./globals.css";

const body = IBM_Plex_Sans({
  variable: "--font-body",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const code = IBM_Plex_Mono({
  variable: "--font-code",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
});

export const metadata: Metadata = {
  title: { default: "Agent Trio", template: "%s | Agent Trio" },
  description: "Consola interna para gestionar proyectos de clientes con agentes de IA en paralelo.",
  robots: { index: false, follow: false },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f3f4f6" },
    { media: "(prefers-color-scheme: dark)", color: "#0f1217" },
  ],
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="es" className={`${body.variable} ${code.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col">
        <a href="#main" className="btn btn-primary absolute left-3 top-2 z-20 -translate-y-20 focus:translate-y-0">
          Saltar al contenido
        </a>
        {children}
      </body>
    </html>
  );
}
