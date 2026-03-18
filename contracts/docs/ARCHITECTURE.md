# Agentro Soroban Architecture

## Contract Map

- `agent-token`: legacy custom token contract kept in the workspace for reference and tests.
- `payment`: subscription and analysis payment rail. Pulls approved XLM from users into the treasury and tracks subscription expiry on-chain.
- `agent-manager`: creates AI agent records and emits usage events. Uses the payment contract for paid agent usage.
- `bounty`: locks XLM in escrow, completes bounties, and releases rewards on-chain.
- `leaderboard`: stores canonical per-user earnings and completion counts. Supports top-user reads for smaller datasets and emits update events.

## Storage Strategy

- Instance storage is used for immutable or singleton configuration.
- Persistent storage is used for balances, agents, bounties, subscriptions, and leaderboard entries.
- Vector-backed indexes are used only where queryability is required.

## Auth Model

- Wallet address is the user identity.
- User-owned state changes require `require_auth`.
- Payment and bounty custody rely on token allowances via `transfer_from`.
- Contract-held balances are released from the contract itself using `transfer`.

## Event Strategy

- `agt_crtd` -> `agent_created`
- `agt_used` -> `agent_used`
- `payment` -> `payment_processed`
- `bnty_crt` -> `bounty_created`
- `bnt_fund` -> `bounty_funded`
- `bnt_done` -> `bounty_completed`
- `lb_update` -> leaderboard state delta

## Leaderboard Recommendation

Use a hybrid strategy in production:

- Keep canonical per-user totals on-chain for trust.
- Build ranked pages and activity feeds from indexed events for scale.
- Use `get_top_users(limit)` for small datasets, demos, and trusted spot checks.

## Wallet Migration

Replace Clerk and all email/password flows with wallet-based identity:

1. User clicks `Connect Wallet`.
2. Freighter or Albedo returns the public key.
3. The frontend builds Soroban transactions with that address as the signing identity.
4. The wallet signs and submits.
5. The UI refreshes from contract reads plus indexed events.
