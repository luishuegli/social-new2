"use client";

import { useEffect } from "react";

export default function DevIndexesApplier(): null {
  useEffect(() => {
    if (process.env.NODE_ENV !== "development") return;
    // Best-effort only; ignore failures
    fetch("/api/apply-indexes").catch(() => {});
  }, []);

  return null;
}

