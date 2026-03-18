"use client";

import { useEffect, useState } from "react";
import { Loader2, ScrollText, Sparkles, Trophy, Wallet } from "lucide-react";
import { ConnectWalletButton } from "@/components/ConnectWalletButton";
import { CopyAddressButton } from "@/components/CopyAddressButton";
import { useWallet } from "@/hooks/useWallet";
import {
  completeBounty,
  createAndFundBounty,
  getReadableError,
  listBounties,
  type BountyRecord,
} from "@/services/contractService";
import { shortenAddress } from "@/lib/stellar";

export default function BountiesPage() {
  const { address, isConnected } = useWallet();
  const [bounties, setBounties] = useState<BountyRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [winnerAddress, setWinnerAddress] = useState("");
  const [form, setForm] = useState({
    title: "",
    description: "",
    reward: "",
  });

  async function loadBounties() {
    try {
      setLoading(true);
      const data = await listBounties();
      setBounties(data);
    } catch (error) {
      setStatus(getReadableError(error));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadBounties();
    const interval = window.setInterval(loadBounties, 15000);
    return () => window.clearInterval(interval);
  }, []);

  async function handleCreateBounty(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!address) {
      setStatus("Connect a wallet before creating a bounty.");
      return;
    }

    try {
      setSubmitting(true);
      setStatus("Creating bounty, approving XLM, and funding escrow...");
      await createAndFundBounty({
        address,
        title: form.title,
        description: form.description,
        reward: form.reward,
      });
      setForm({ title: "", description: "", reward: "" });
      setStatus("Bounty created and funded on-chain.");
      await loadBounties();
    } catch (error) {
      setStatus(getReadableError(error));
    } finally {
      setSubmitting(false);
    }
  }

  async function handleCompleteBounty(bountyId: number) {
    if (!address) {
      setStatus("Connect a wallet before resolving a bounty.");
      return;
    }

    if (!winnerAddress) {
      setStatus("Enter the winner wallet address first.");
      return;
    }

    try {
      setSubmitting(true);
      setStatus("Completing bounty and releasing XLM reward...");
      await completeBounty({
        resolver: address,
        bountyId,
        winner: winnerAddress,
      });
      setWinnerAddress("");
      setStatus("Bounty completed successfully.");
      await loadBounties();
    } catch (error) {
      setStatus(getReadableError(error));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div>
          <h1 className="text-4xl font-black tracking-tight text-foreground uppercase">
            Bounty <span className="text-gradient">Market</span>
          </h1>
          <p className="text-muted font-medium mt-1">
            Create, fund, and settle XLM-denominated bounties directly on Stellar.
          </p>
        </div>
        <ConnectWalletButton />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[420px_1fr] gap-8">
        <section className="glass-panel rounded-2xl p-8 shadow-2xl h-fit">
          <div className="flex items-center space-x-4 mb-8">
            <div className="p-3 bg-primary/10 rounded-xl shadow-inner shadow-primary/20">
              <Sparkles className="text-primary" size={20} />
            </div>
            <div>
              <h2 className="text-xl font-black tracking-tight uppercase text-white text-xs">
                Create Bounty
              </h2>
              <p className="text-sm text-white/60 mt-1">
                This flow creates the bounty, approves XLM, and funds escrow.
              </p>
            </div>
          </div>

          {isConnected && address ? (
            <div className="rounded-2xl border border-white/10 bg-card px-4 py-3 mb-6 flex items-center justify-between gap-4">
              <div>
                <p className="text-[9px] font-black uppercase tracking-[0.25em] text-muted">
                  Creator Wallet
                </p>
                <p className="mt-2 text-sm font-black text-white">{shortenAddress(address)}</p>
              </div>
              <CopyAddressButton address={address} />
            </div>
          ) : (
            <div className="rounded-2xl border border-white/10 bg-card px-4 py-4 mb-6 text-sm text-white/65">
              Connect a Stellar wallet to create and fund bounties.
            </div>
          )}

          <form onSubmit={handleCreateBounty} className="space-y-4">
            <label className="block space-y-2">
              <span className="text-[10px] uppercase tracking-[0.25em] font-black text-muted">
                Title
              </span>
              <input
                value={form.title}
                onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))}
                className="w-full rounded-2xl border border-white/10 bg-card px-4 py-3 text-sm text-white outline-none"
                placeholder="Weekly alpha signal review"
                required
              />
            </label>

            <label className="block space-y-2">
              <span className="text-[10px] uppercase tracking-[0.25em] font-black text-muted">
                Description
              </span>
              <textarea
                value={form.description}
                onChange={(event) =>
                  setForm((current) => ({ ...current, description: event.target.value }))
                }
                className="min-h-32 w-full rounded-2xl border border-white/10 bg-card px-4 py-3 text-sm text-white outline-none"
                placeholder="Ask contributors to analyze a trend, audit a strategy, or deliver research."
                required
              />
            </label>

            <label className="block space-y-2">
              <span className="text-[10px] uppercase tracking-[0.25em] font-black text-muted">
                Reward (XLM)
              </span>
              <input
                type="number"
                min="0"
                step="0.1"
                value={form.reward}
                onChange={(event) => setForm((current) => ({ ...current, reward: event.target.value }))}
                className="w-full rounded-2xl border border-white/10 bg-card px-4 py-3 text-sm text-white outline-none"
                placeholder="30"
                required
              />
            </label>

            <button
              type="submit"
              disabled={submitting || !isConnected}
              className="btn-primary w-full py-4 text-[10px] font-black uppercase tracking-[0.25em] disabled:opacity-50"
            >
              {submitting ? <Loader2 className="animate-spin mx-auto" size={16} /> : "Create And Fund"}
            </button>
          </form>

          {status ? (
            <div className="mt-5 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white/80">
              {status}
            </div>
          ) : null}
        </section>

        <section className="glass-panel rounded-2xl p-8 shadow-2xl">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-8">
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-highlight/10 rounded-xl shadow-inner shadow-highlight/20">
                <ScrollText className="text-highlight" size={20} />
              </div>
              <div>
                <h2 className="text-xl font-black tracking-tight uppercase text-white text-xs">
                  On-Chain Bounties
                </h2>
                <p className="text-sm text-white/60 mt-1">
                  Live contract state from Soroban testnet.
                </p>
              </div>
            </div>

            <div className="rounded-2xl border border-white/10 bg-card px-4 py-3 w-full lg:w-[320px]">
              <label className="text-[9px] font-black uppercase tracking-[0.25em] text-muted block mb-2">
                Winner Address
              </label>
              <input
                value={winnerAddress}
                onChange={(event) => setWinnerAddress(event.target.value)}
                placeholder="G..."
                className="w-full bg-transparent text-sm text-white outline-none"
              />
            </div>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {[1, 2, 3, 4].map((item) => (
                <div key={item} className="h-52 rounded-2xl bg-white/5 animate-pulse" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {bounties.map((bounty) => (
                <article
                  key={bounty.id}
                  className="rounded-2xl border border-white/10 bg-white/5 p-6 shadow-xl"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-[9px] font-black uppercase tracking-[0.26em] text-muted">
                        Bounty #{bounty.id}
                      </p>
                      <h3 className="mt-3 text-xl font-black text-white leading-tight">
                        {bounty.title}
                      </h3>
                    </div>
                    <div className="rounded-xl bg-primary/10 px-3 py-2 text-[10px] font-black uppercase tracking-[0.2em] text-primary">
                      {bounty.reward} XLM
                    </div>
                  </div>

                  <p className="mt-4 text-sm leading-relaxed text-white/65">{bounty.description}</p>

                  <div className="mt-6 grid grid-cols-2 gap-3 text-[10px] font-black uppercase tracking-[0.22em]">
                    <div className="rounded-xl bg-card px-3 py-3 text-muted">
                      Creator
                      <p className="mt-2 text-white">{shortenAddress(bounty.creator)}</p>
                    </div>
                    <div className="rounded-xl bg-card px-3 py-3 text-muted">
                      Status
                      <p className="mt-2 text-white">
                        {bounty.completed ? "Completed" : bounty.funded ? "Funded" : "Pending"}
                      </p>
                    </div>
                  </div>

                  <div className="mt-6 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-muted">
                      <Trophy size={14} />
                      {bounty.winner ? shortenAddress(bounty.winner) : "No winner yet"}
                    </div>
                    <button
                      onClick={() => handleCompleteBounty(bounty.id)}
                      disabled={submitting || bounty.completed || !bounty.funded || !isConnected}
                      className="rounded-xl border border-white/10 px-4 py-3 text-[10px] font-black uppercase tracking-[0.22em] text-white transition-all hover:bg-card disabled:opacity-50"
                    >
                      {bounty.funded ? "Complete" : "Awaiting Funding"}
                    </button>
                  </div>
                </article>
              ))}
            </div>
          )}

          {!loading && bounties.length === 0 ? (
            <div className="rounded-2xl border border-white/10 bg-card px-6 py-10 text-center text-white/60 mt-6">
              No bounties exist yet. Connect a wallet and create the first one.
            </div>
          ) : null}
        </section>
      </div>

      <div className="glass-panel rounded-2xl p-6 text-sm text-white/60 flex items-start gap-3">
        <Wallet className="text-highlight shrink-0 mt-0.5" size={18} />
        Creating a bounty requires multiple wallet signatures because the contract first creates the bounty, then approves XLM spending, then locks the reward in escrow.
      </div>
    </div>
  );
}
