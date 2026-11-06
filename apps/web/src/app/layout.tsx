import "./globals.css";
import React from "react";
import Navbar from "@/components/layout/Navbar";
import Sidebar from "@/components/layout/Sidebar";
import QueryProvider from "@/components/providers/QueryProvider";

export const metadata = {
  title: "EV Gap Analyser — Visakhapatnam",
  description: "Decision-support platform for municipal bodies, planners, and EV charging operators.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen flex flex-col bg-[#F8FAFC]">
        <QueryProvider>
          <Navbar />
          <div className="flex flex-1">
            <Sidebar />
            <main className="flex-1 overflow-x-hidden">{children}</main>
          </div>
        </QueryProvider>
      </body>
    </html>
  );
}
