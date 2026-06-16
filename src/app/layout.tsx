import type { Metadata } from "next";
import { Inter, Baloo_2 } from "next/font/google";
import { ThemeProvider } from "@/components/theme-provider";
import "./globals.css";

// Set the theme class before hydration to prevent a flash of the wrong theme.
const themeInitScript = `
(function(){try{
  var t = localStorage.getItem('cbk-theme');
  if(!t){t = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';}
  if(t==='dark'){document.documentElement.classList.add('dark');}
}catch(e){}})();
`;

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const baloo = Baloo_2({
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  variable: "--font-baloo",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Cheshire Bookkeeping CRM",
  description: "Client and prospect management for Cheshire Bookkeeping.",
  icons: {
    icon: [
      { url: "/favicon-16x16.png", sizes: "16x16", type: "image/png" },
      { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
    ],
    apple: "/apple-touch-icon.png",
  },
  manifest: "/site.webmanifest",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body className={`${inter.variable} ${baloo.variable} font-sans antialiased`}>
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  );
}
