import { Client } from '@hiveio/dhive';

/**
 * Hive RPC nodes with failover support
 * Prioritized by reliability and performance
 */
const HIVE_NODES = [
  'https://api.hive.blog',
  'https://api.deathwing.me',
  'https://hive-api.arcange.eu',
  'https://api.openhive.network',
];

let clientInstance: Client | null = null;
let currentNodeIndex = 0;

/**
 * Get or create a dhive client with automatic failover
 */
export function getHiveClient(): Client {
  if (!clientInstance) {
    clientInstance = new Client(HIVE_NODES, {
      timeout: 3000,
      failoverThreshold: 4,
      consoleOnFailover: true,
    });
  }
  return clientInstance;
}

/**
 * Manually switch to next node in case of persistent issues
 */
export function switchToNextNode(): Client {
  currentNodeIndex = (currentNodeIndex + 1) % HIVE_NODES.length;
  clientInstance = new Client(HIVE_NODES[currentNodeIndex], {
    timeout: 3000,
  });
  return clientInstance;
}

/**
 * Get current node address
 */
export function getCurrentNode(): string {
  return HIVE_NODES[currentNodeIndex];
}

/**
 * Fetch account data from Hive blockchain
 */
export async function getAccount(username: string) {
  const client = getHiveClient();
  const accounts = await client.database.getAccounts([username]);
  return accounts[0] || null;
}

/**
 * Fetch global properties (needed for VP and vote value calculations)
 */
export async function getGlobalProperties() {
  const client = getHiveClient();
  return await client.database.getDynamicGlobalProperties();
}

/**
 * Fetch reward fund (needed for vote value calculations)
 */
export async function getRewardFund() {
  const client = getHiveClient();
  return await client.database.call('get_reward_fund', ['post']);
}

/**
 * Fetch account history with filtering
 */
export async function getAccountHistory(
  username: string,
  start: number = -1,
  limit: number = 1000,
  operationFilter?: number[]
) {
  const client = getHiveClient();

  // If operation filter provided, use filtered version
  if (operationFilter && operationFilter.length > 0) {
    return await client.database.call('get_account_history', [
      username,
      start,
      limit,
      ...operationFilter
    ]);
  }

  // Otherwise get all operations
  return await client.database.getAccountHistory(username, start, limit);
}

/**
 * Fetch only vote operations from account history
 * Vote operation type is typically 0
 */
export async function getVoteHistory(username: string, limit: number = 1000) {
  const client = getHiveClient();

  try {
    // Get recent history and filter for votes
    const history: any[] = await client.database.getAccountHistory(username, -1, limit);

    // Filter for vote operations
    // Structure: [txId, { op: [operation_type, operation_data], ... }]
    return history.filter(([, transaction]: any[]) => {
      return transaction.op && transaction.op[0] === 'vote';
    });
  } catch (error) {
    console.error('Error fetching vote history:', error);
    throw error;
  }
}

/**
 * Get current median history price (for HBD conversions)
 */
export async function getCurrentMedianHistoryPrice() {
  const client = getHiveClient();
  return await client.database.getCurrentMedianHistoryPrice();
}

/**
 * Get HIVE price in USD from external API
 */
export async function getHivePrice(): Promise<number> {
  try {
    // Try CoinGecko first
    const response = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=hive&vs_currencies=usd');
    const data = await response.json();
    if (data?.hive?.usd) {
      return data.hive.usd;
    }
  } catch (error) {
    console.warn('Failed to fetch from CoinGecko:', error);
  }

  // Fallback price
  return 0.30;
}
