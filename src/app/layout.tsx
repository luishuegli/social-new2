import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from "./contexts/AuthContext";
import { ActivityProvider } from "./contexts/ActivityContext";
import ActivityBar from "./components/ActivityBar";
import ActivityPlannerFAB from "../components/ui/ActivityPlannerFAB";
import React from "react";
import DevIndexesApplier from "@/app/DevIndexesApplier";
import ErrorBoundary from "@/components/common/ErrorBoundary";

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
        <ErrorBoundary level="page">
          <AuthProvider>
            <ErrorBoundary level="section" componentName="ActivityProvider">
              <ActivityProvider>
                {/* Dev-only no-op element that runs a client-side effect */}
                <DevIndexesApplier />
                <ErrorBoundary level="section" componentName="MainContent">
                  {children}
                </ErrorBoundary>
                <ErrorBoundary level="component" componentName="ActivityPlannerFAB" isolate>
                  <ActivityPlannerFAB />
                </ErrorBoundary>
                <ErrorBoundary level="component" componentName="ActivityBar" isolate>
                  <ActivityBar />
                </ErrorBoundary>
              </ActivityProvider>
            </ErrorBoundary>
          </AuthProvider>
        </ErrorBoundary>
      </body>
    </html>
  );
}
