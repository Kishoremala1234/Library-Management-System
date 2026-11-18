import type { Metadata } from "next";
import ThemeRegistry from "./components/ThemeRegistry";
import UserChatbot from "./components/UserChatbot";

import { Poppins, Geist } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";

const geist = Geist({
  subsets: ["latin"],
  variable: "--font-sans",
});

const poppins = Poppins({
  subsets: ["latin"],
  variable: "--font-poppins",
  display: "swap",
  weight: ["300", "400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "Librix",
  description: "Modern Public Library Management System",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={cn("font-sans", geist.variable)}
    >
      <body className={poppins.variable}>
        <ThemeRegistry>
          {children}

          <UserChatbot />
        </ThemeRegistry>
      </body>
    </html>
  );
}