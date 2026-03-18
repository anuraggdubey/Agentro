"use client";

import { useState } from "react";
import { Check, Copy } from "lucide-react";

type CopyAddressButtonProps = {
  address: string;
  className?: string;
};

export function CopyAddressButton({ address, className }: CopyAddressButtonProps) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(address);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
    } catch {
      setCopied(false);
    }
  }

  return (
    <button
      type="button"
      onClick={handleCopy}
      title={copied ? "Copied" : "Copy address"}
      className={
        className ??
        "inline-flex items-center justify-center rounded-xl border border-white/10 px-2.5 py-2 text-muted transition-all hover:bg-card hover:text-white"
      }
    >
      {copied ? <Check size={14} className="text-highlight" /> : <Copy size={14} />}
    </button>
  );
}
