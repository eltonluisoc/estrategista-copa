import type { Metadata } from "next";
import { Outfit, Space_Grotesk } from "next/font/google";
import "./globals.css";
import Providers from "./providers";

const outfit = Outfit({
  variable: "--font-outfit",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
});

const spaceGrotesk = Space_Grotesk({
  variable: "--font-space",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "Estrategista da Copa 2026",
  description: "O bolão mais estratégico da Copa do Mundo. 1 erro e você está fora!",
  manifest: "/manifest.json",
  openGraph: {
    title: "Estrategista da Copa 2026",
    description: "Participe do bolão mais estratégico da Copa do Mundo! 1 erro = eliminação. Teste sua sorte e ganhe prêmios!",
    url: "https://estrategistadacopa.com.br",
    siteName: "Estrategista da Copa",
    images: [
      {
        url: "https://estrategistadacopa.com.br/icon-512.png",
        width: 512,
        height: 512,
        alt: "Logo Estrategista da Copa 2026",
      },
    ],
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Estrategista da Copa 2026",
    description: "O bolão mais estratégico da Copa do Mundo. 1 erro e você está fora!",
    images: ["https://estrategistadacopa.com.br/icon-512.png"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <head>
        <link rel="manifest" href="/manifest.json" />
        <link rel="apple-touch-icon" href="/apple-icon.png" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black" />
        <meta name="apple-mobile-web-app-title" content="Estrategista" />
        <meta name="theme-color" content="#000000" />
        <link rel="icon" href="/favicon.ico" sizes="32x32" />
        <link rel="shortcut icon" href="/favicon.ico" />
      </head>
      <body
        className={`${outfit.variable} ${spaceGrotesk.variable} font-sans antialiased`}
      >
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}