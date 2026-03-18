import {
  Address,
  BASE_FEE,
  Contract,
  TransactionBuilder,
  xdr,
  rpc,
  scValToNative,
  nativeToScVal,
} from "@stellar/stellar-sdk";
import { StellarWalletsKit } from "@creit.tech/stellar-wallets-kit";
import {
  CONTRACT_IDS,
  STELLAR_NETWORK_PASSPHRASE,
  STELLAR_READ_ADDRESS,
  STELLAR_RPC_URL,
  friendlyError,
  formatAgtAmount,
  parseAgtAmount,
} from "@/lib/stellar";

export type BountyRecord = {
  id: number;
  creator: string;
  title: string;
  description: string;
  metadata: string;
  rewardRaw: bigint;
  reward: string;
  funded: boolean;
  completed: boolean;
  winner: string | null;
  createdAt: number;
  fundedAt: number | null;
  completedAt: number | null;
};

export type LeaderboardUser = {
  rank: number;
  user: string;
  totalEarningsRaw: bigint;
  totalEarnings: string;
  bountiesCompleted: number;
};

export type UserStats = {
  user: string;
  totalEarningsRaw: bigint;
  totalEarnings: string;
  bountiesCompleted: number;
};

export type ActivityItem = {
  id: string;
  contractId: string;
  event: string;
  ledger: number;
  creator?: string;
  winner?: string;
  amount?: string;
};

const server = new rpc.Server(STELLAR_RPC_URL);

function getViewAccount(address: string) {
  return server.getAccount(address);
}

function toAddressScVal(address: string) {
  return Address.fromString(address).toScVal();
}

function toI128(value: bigint | string | number) {
  const amount = typeof value === "bigint" ? value : BigInt(value);
  return nativeToScVal(amount, { type: "i128" });
}

function toU64(value: number) {
  return nativeToScVal(BigInt(value), { type: "u64" });
}

function fromScVal(value: unknown) {
  return scValToNative(value as Parameters<typeof scValToNative>[0]);
}

function parseMetadata(metadata: string) {
  try {
    const parsed = JSON.parse(metadata) as { title?: string; description?: string };
    return {
      title: parsed.title ?? "Untitled bounty",
      description: parsed.description ?? "No description provided.",
    };
  } catch {
    return {
      title: metadata.slice(0, 48) || "Untitled bounty",
      description: metadata,
    };
  }
}

function normalizeBounty(raw: Record<string, unknown>): BountyRecord {
  const metadata = String(raw.metadata ?? "");
  const content = parseMetadata(metadata);
  const rewardRaw = BigInt(raw.reward as bigint | number | string);

  return {
    id: Number(raw.id),
    creator: String(raw.creator ?? ""),
    title: content.title,
    description: content.description,
    metadata,
    rewardRaw,
    reward: formatAgtAmount(rewardRaw),
    funded: Boolean(raw.funded),
    completed: Boolean(raw.completed),
    winner: raw.winner ? String(raw.winner) : null,
    createdAt: Number(raw.created_at ?? 0),
    fundedAt: raw.funded_at ? Number(raw.funded_at) : null,
    completedAt: raw.completed_at ? Number(raw.completed_at) : null,
  };
}

function normalizeStats(raw: Record<string, unknown>): UserStats {
  const totalEarningsRaw = BigInt(raw.total_earnings as bigint | number | string);

  return {
    user: String(raw.user ?? ""),
    totalEarningsRaw,
    totalEarnings: formatAgtAmount(totalEarningsRaw),
    bountiesCompleted: Number(raw.bounties_completed ?? 0),
  };
}

async function simulateRead<T>(contractId: string, method: string, args: xdr.ScVal[] = []) {
  const account = await getViewAccount(STELLAR_READ_ADDRESS);
  const contract = new Contract(contractId);
  const transaction = new TransactionBuilder(account, {
    fee: BASE_FEE,
    networkPassphrase: STELLAR_NETWORK_PASSPHRASE,
  })
    .addOperation(contract.call(method, ...args))
    .setTimeout(30)
    .build();

  const simulation = await server.simulateTransaction(transaction);
  if (!("result" in simulation) || !simulation.result) {
    throw new Error("Unable to read contract state.");
  }

  return fromScVal(simulation.result.retval) as T;
}

async function submitTransaction(address: string, contractId: string, method: string, args: xdr.ScVal[]) {
  const account = await server.getAccount(address);
  const contract = new Contract(contractId);
  const transaction = new TransactionBuilder(account, {
    fee: BASE_FEE,
    networkPassphrase: STELLAR_NETWORK_PASSPHRASE,
  })
    .addOperation(contract.call(method, ...args))
    .setTimeout(60)
    .build();

  const prepared = await server.prepareTransaction(transaction);
  const signed = await StellarWalletsKit.signTransaction(prepared.toXDR(), {
    address,
    networkPassphrase: STELLAR_NETWORK_PASSPHRASE,
  });

  const signedTransaction = TransactionBuilder.fromXDR(
    signed.signedTxXdr,
    STELLAR_NETWORK_PASSPHRASE,
  );
  const sent = await server.sendTransaction(signedTransaction);

  if (!sent.hash) {
    throw new Error("Transaction submission failed.");
  }

  const result = await server.pollTransaction(sent.hash, {
    attempts: 20,
    sleepStrategy: rpc.LinearSleepStrategy,
  });

  if (result.status !== rpc.Api.GetTransactionStatus.SUCCESS) {
    throw new Error(`Transaction failed with status ${result.status}.`);
  }

  return result;
}

export async function getTokenBalance(address: string) {
  const raw = await simulateRead<bigint | string | number>(CONTRACT_IDS.token, "balance", [
    toAddressScVal(address),
  ]);
  return formatAgtAmount(BigInt(raw));
}

export async function listBounties() {
  const raw = await simulateRead<Record<string, unknown>[]>(CONTRACT_IDS.bounty, "list_bounties");
  return raw.map(normalizeBounty).sort((left, right) => right.id - left.id);
}

export async function getUserStats(user: string) {
  const raw = await simulateRead<Record<string, unknown>>(CONTRACT_IDS.leaderboard, "get_user_stats", [
    toAddressScVal(user),
  ]);
  return normalizeStats(raw);
}

export async function getTopUsers(limit = 10) {
  const raw = await simulateRead<Record<string, unknown>[]>(CONTRACT_IDS.leaderboard, "get_top_users", [
    nativeToScVal(limit, { type: "u32" }),
  ]);

  return raw.map(normalizeStats).map((entry, index) => ({
    rank: index + 1,
    ...entry,
  })) satisfies LeaderboardUser[];
}

export async function getUserAgents(address: string) {
  const ids = await simulateRead<(bigint | number)[]>(CONTRACT_IDS.agentManager, "list_user_agents", [
    toAddressScVal(address),
  ]);

  const agents = await Promise.all(
    ids.map(async (id) => {
      const raw = await simulateRead<Record<string, unknown>>(CONTRACT_IDS.agentManager, "get_agent", [
        toU64(Number(id)),
      ]);
      return {
        id: Number(raw.id ?? id),
        metadata: String(raw.metadata ?? ""),
        createdAt: Number(raw.created_at ?? 0),
      };
    }),
  );

  return agents.sort((left, right) => right.id - left.id);
}

export async function getRecentActivity(limit = 8) {
  const latest = await server.getLatestLedger();
  const startLedger = Math.max(1, latest.sequence - 400);
  const response = await server.getEvents({
    startLedger,
    filters: [
      {
        type: "contract",
        contractIds: [
          CONTRACT_IDS.agentManager,
          CONTRACT_IDS.bounty,
          CONTRACT_IDS.payment,
          CONTRACT_IDS.leaderboard,
        ],
      },
    ],
    limit,
  });

  return response.events
    .map((event) => {
      const topic = event.topic?.map((item) => scValToNative(item)) ?? [];
      const value = event.value ? scValToNative(event.value) : null;
      return {
        id: event.id,
        contractId: String(event.contractId),
        event: String(topic[0] ?? "activity"),
        ledger: event.ledger,
        creator: topic[1] ? String(topic[1]) : undefined,
        winner: topic[2] ? String(topic[2]) : undefined,
        amount: Array.isArray(value) && value[1] ? formatAgtAmount(BigInt(value[1])) : undefined,
      } satisfies ActivityItem;
    })
    .sort((left, right) => right.ledger - left.ledger);
}

export async function approveToken(address: string, spender: string, amount: string) {
  const reward = parseAgtAmount(amount);
  return submitTransaction(address, CONTRACT_IDS.token, "approve", [
    toAddressScVal(address),
    toAddressScVal(spender),
    toI128(reward),
  ]);
}

export async function createBounty(params: {
  address: string;
  title: string;
  description: string;
  reward: string;
}) {
  const metadata = JSON.stringify({
    title: params.title,
    description: params.description,
  });
  const rewardRaw = parseAgtAmount(params.reward);

  await submitTransaction(params.address, CONTRACT_IDS.bounty, "create_bounty", [
    toAddressScVal(params.address),
    nativeToScVal(metadata),
    toI128(rewardRaw),
  ]);

  const created = await listBounties();
  const latest = created.find(
    (entry) => entry.creator === params.address && entry.metadata === metadata && entry.rewardRaw === rewardRaw,
  );

  if (!latest) {
    throw new Error("Bounty created, but the new bounty could not be located yet.");
  }

  return latest;
}

export async function fundBounty(address: string, bountyId: number) {
  await submitTransaction(address, CONTRACT_IDS.bounty, "fund_bounty", [toU64(bountyId)]);
}

export async function createAndFundBounty(params: {
  address: string;
  title: string;
  description: string;
  reward: string;
}) {
  const created = await createBounty(params);
  await approveToken(params.address, CONTRACT_IDS.bounty, params.reward);
  await fundBounty(params.address, created.id);
  return created.id;
}

export async function completeBounty(params: { resolver: string; bountyId: number; winner: string }) {
  await submitTransaction(params.resolver, CONTRACT_IDS.bounty, "complete_bounty", [
    toAddressScVal(params.resolver),
    toU64(params.bountyId),
    toAddressScVal(params.winner),
  ]);
}

export async function createAgent(address: string, metadata: string) {
  await submitTransaction(address, CONTRACT_IDS.agentManager, "create_agent", [
    toAddressScVal(address),
    nativeToScVal(metadata),
  ]);
}

export function getReadableError(error: unknown) {
  return friendlyError(error);
}
