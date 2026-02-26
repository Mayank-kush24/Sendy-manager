import type { Metadata } from "next";
import "./globals.css";
import { SendyProvider } from "@/context/SendyContext";
import MainLayout from "@/components/layout/MainLayout";
import { Toaster } from "@/components/ui/sonner";

export const metadata: Metadata = {
  title: "Sendy Manager",
  description: "Premium Web Interface for Sendy API",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="antialiased" suppressHydrationWarning>
        <SendyProvider>
          <MainLayout>
            {children}
          </MainLayout>
          <Toaster />
        </SendyProvider>
      </body>
    </html>
  );
}
