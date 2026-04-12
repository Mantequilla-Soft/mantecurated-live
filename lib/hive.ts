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
 * Fetches enough operations to ensure we get votes spanning at least 7 days
 * Only includes votes cast BY the specified user (not votes received)
 */
export async function getVoteHistory(username: string, targetDays: number = 7) {
  const client = getHiveClient();

  try {
    const allVotes: any[] = [];
    const sevenDaysAgo = new Date(Date.now() - targetDays * 24 * 60 * 60 * 1000);
    let batchSize = 1000;
    let start = -1;
    let hasEnoughHistory = false;
    let iterations = 0;
    const maxIterations = 20; // Safety limit to prevent infinite loops

    while (!hasEnoughHistory && iterations < maxIterations) {
      iterations++;

      // Fetch a batch of operations
      const history: any[] = await client.database.getAccountHistory(username, start, batchSize);

      if (history.length === 0) {
        break; // No more history available
      }

      // Filter for vote operations cast BY this user (not votes received)
      const votesInBatch = history.filter(([, transaction]: any[]) => {
        if (!transaction.op || transaction.op[0] !== 'vote') return false;
        // Only include votes where this user is the voter
        return transaction.op[1].voter === username;
      });

      // Add votes to our collection
      allVotes.push(...votesInBatch);

      // Check if we have votes old enough (at least 7 days back)
      if (votesInBatch.length > 0) {
        const oldestVote = votesInBatch[votesInBatch.length - 1];
        const oldestTimestamp = new Date(oldestVote[1].timestamp);

        if (oldestTimestamp <= sevenDaysAgo) {
          hasEnoughHistory = true;
        }
      }

      // If we got less than requested, we've hit the end of history
      if (history.length < batchSize) {
        break;
      }

      // Update start for next batch (get the ID of the oldest operation)
      start = history[0][0] - 1;

      // Safety check: if start becomes invalid, break
      if (start < 0) {
        break;
      }
    }

    console.log(`Fetched ${allVotes.length} total votes across ${iterations} batches`);

    // Sort votes by timestamp (newest first) to ensure proper chronological order
    // This is necessary because batches may be out of order
    allVotes.sort((a, b) => {
      const timeA = new Date(a[1].timestamp).getTime();
      const timeB = new Date(b[1].timestamp).getTime();
      return timeB - timeA; // Descending order (newest first)
    });

    return allVotes;
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
