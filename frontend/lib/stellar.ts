import { Networks } from "@stellar/stellar-sdk";

export const STELLAR_NETWORK = process.env.NEXT_PUBLIC_STELLAR_NETWORK ?? "testnet";
export const STELLAR_RPC_URL =
  process.env.NEXT_PUBLIC_STELLAR_RPC_URL ?? "https://soroban-testnet.stellar.org";
export const STELLAR_NETWORK_PASSPHRASE =
  process.env.NEXT_PUBLIC_STELLAR_NETWORK_PASSPHRASE ?? Networks.TESTNET;
export const STELLAR_READ_ADDRESS =
  process.env.NEXT_PUBLIC_STELLAR_READ_ADDRESS ??
  "GAVRMNUYDJNYOIIFAQLXILURMRRH2XJHVSE2G3GCV2HZLXF4HKLZA365";

export const CONTRACT_IDS = {
  agentManager:
    process.env.NEXT_PUBLIC_AGENT_MANAGER_CONTRACT_ID ??
    "CBYZ4EGIIWXYXAK6N7QAFSA6MV5VIO6SZS6ZHM4WTCC3UEDCD3WJ54VS",
  bounty:
    process.env.NEXT_PUBLIC_BOUNTY_CONTRACT_ID ??
    "CALEZTBUJFWH7KQTW34LJL7JVG7X4TR7GBDPOSJZEDMOFRGIYFDRVL62",
  leaderboard:
    process.env.NEXT_PUBLIC_LEADERBOARD_CONTRACT_ID ??
    "CAGTBHWT2OU4OS6EDK3HHJ3A6DVLXFI3OE2WBUGUWTOATWY5AR3CDI4V",
  payment:
    process.env.NEXT_PUBLIC_PAYMENT_CONTRACT_ID ??
    "CCAOSNZNVNZPJRPPPOVLGRWWNCEYPFYFB6EF5NAJF4FE43KIWB5VD7VQ",
  token:
    process.env.NEXT_PUBLIC_AGT_TOKEN_CONTRACT_ID ??
    "CBHWUYJV7ST3Y2FFGIZQLAVSNAAPIAX7C54LDLDEEJG2YMNSL2DW7MJK",
} as const;

export const AGT_DECIMALS = 7;

export function shortenAddress(address?: string | null) {
  if (!address) {
    return "Not connected";
  }

  return `${address.slice(0, 4)}...${address.slice(-4)}`;
}

export function parseAgtAmount(value: string) {
  const sanitized = value.trim();
  if (!sanitized) {
    return 0n;
  }

  const [whole, fraction = ""] = sanitized.split(".");
  const paddedFraction = `${fraction}0000000`.slice(0, AGT_DECIMALS);
  return BigInt(`${whole || "0"}${paddedFraction}`);
}

export function formatAgtAmount(value: bigint | number | string | undefined | null) {
  if (value === undefined || value === null) {
    return "0";
  }

  const amount = typeof value === "bigint" ? value : BigInt(value);
  const divisor = 10n ** BigInt(AGT_DECIMALS);
  const whole = amount / divisor;
  const fraction = amount % divisor;
  const fractionText = fraction.toString().padStart(AGT_DECIMALS, "0").replace(/0+$/, "");
  return fractionText ? `${whole.toString()}.${fractionText}` : whole.toString();
}

export function friendlyError(error: unknown) {
  if (error instanceof Error) {
    return error.message;
  }

  if (typeof error === "string") {
    return error;
  }

  if (error && typeof error === "object") {
    const candidate = error as Record<string, unknown>;

    const directMessage = [
      candidate.message,
      candidate.error,
      candidate.detail,
      candidate.title,
    ].find((value): value is string => typeof value === "string" && value.trim().length > 0);

    if (directMessage) {
      return directMessage;
    }

    if (candidate.response && typeof candidate.response === "object") {
      const response = candidate.response as Record<string, unknown>;
      const responseMessage = [
        response.detail,
        response.error,
        response.message,
        response.title,
      ].find((value): value is string => typeof value === "string" && value.trim().length > 0);

      if (responseMessage) {
        return responseMessage;
      }
    }

    if (candidate.data && typeof candidate.data === "object") {
      const data = candidate.data as Record<string, unknown>;
      const dataMessage = [
        data.detail,
        data.error,
        data.message,
        data.title,
      ].find((value): value is string => typeof value === "string" && value.trim().length > 0);

      if (dataMessage) {
        return dataMessage;
      }
    }

    try {
      return JSON.stringify(error);
    } catch {
      // Fall through to the generic message below.
    }
  }

  return "Something went wrong while talking to Stellar.";
}
