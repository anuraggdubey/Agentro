"use client";

import { useContext } from "react";
import { WalletContext } from "@/context/WalletContext";

export function useWallet() {
  const value = useContext(WalletContext);
  if (!value) {
    throw new Error("useWallet must be used within a WalletProvider");
  }
  return value;
}
