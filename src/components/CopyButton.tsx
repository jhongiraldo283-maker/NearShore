"use client";

import { useState } from "react";

export function CopyButton({ text, label = "Copy" }: { text: string; label?: string }) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard API unavailable — nothing sensible to fall back to.
    }
  }

  return (
    <button
      type="button"
      onClick={handleCopy}
      className={`rounded-lg border px-3 py-1.5 text-xs font-semibold transition hover:scale-[1.03] active:scale-[0.97] ${
        copied
          ? "animate-pop-in border-emerald-300 bg-emerald-50 text-emerald-700"
          : "border-slate-300 bg-surface text-slate-700 hover:border-action"
      }`}
    >
      {copied ? "Copied!" : label}
    </button>
  );
}
