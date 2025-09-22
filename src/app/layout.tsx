import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from "./contexts/AuthContext";
import { ActivityProvider } from "./contexts/ActivityContext";
import ActivityBar from "./components/ActivityBar";
import ActivityPlannerFAB from "../components/ui/ActivityPlannerFAB";
import React from "react";
import DevIndexesApplier from "@/app/DevIndexesApplier";

export const metadata: Metadata = {
  title: "Social App - Authentication",
  description: "A social app with Firebase authentication",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning={true}>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no" />
      </head>
      <body className="font-system antialiased has-mesh-gradient">
        <AuthProvider>
          <ActivityProvider>
            {/* Dev-only no-op element that runs a client-side effect */}
            <DevIndexesApplier />
            {children}
            <ActivityPlannerFAB />
            <ActivityBar />
          </ActivityProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
