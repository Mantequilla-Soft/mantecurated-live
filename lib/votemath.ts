/**
 * Hive Voting Power and Vote Value Calculations
 * Based on patterns from hive-master-skill
 */

const HIVE_VOTING_MANA_REGENERATION_SECONDS = 432000; // 5 days (20% per day)
const HIVE_100_PERCENT = 10000;

interface VotingManabar {
  current_mana: string | number;
  last_update_time: number;
}

interface Account {
  voting_manabar?: VotingManabar;
  vesting_shares: string | any;
  received_vesting_shares: string | any;
  delegated_vesting_shares: string | any;
  last_vote_time?: string;
  reputation?: string | number;
  rc_manabar?: VotingManabar;
  [key: string]: any;
}

interface GlobalProps {
  total_vesting_fund_hive: string | any;
  total_vesting_shares: string | any;
  [key: string]: any;
}

interface RewardFund {
  recent_claims: string | any;
  reward_balance: string | any;
  [key: string]: any;
}

interface MedianPrice {
  base: string | any;
  quote: string | any;
  [key: string]: any;
}

/**
 * Helper to convert Asset or string to number
 */
export function toNumber(value: any): number {
  if (typeof value === 'string') {
    return parseFloat(value.split(' ')[0]);
  }
  if (value && typeof value === 'object' && 'amount' in value) {
    return parseFloat(value.amount);
  }
  if (typeof value === 'number') {
    return value;
  }
  return parseFloat(String(value));
}

/**
 * Calculate effective vesting shares (vests)
 * effective_vests = vesting_shares + received_vesting_shares - delegated_vesting_shares
 */
export function getEffectiveVests(account: Account): number {
  const vestingShares = toNumber(account.vesting_shares);
  const receivedVestingShares = toNumber(account.received_vesting_shares);
  const delegatedVestingShares = toNumber(account.delegated_vesting_shares);

  return vestingShares + receivedVestingShares - delegatedVestingShares;
}

/**
 * Calculate current voting power percentage (0-100)
 * VP regenerates 20% per day, full regeneration in 5 days
 */
export function calculateVotingPower(account: Account): number {
  if (!account.voting_manabar) {
    return 100; // Default to full power if data unavailable
  }

  const { current_mana, last_update_time } = account.voting_manabar;
  const currentMana = typeof current_mana === 'string' ? parseInt(current_mana) : current_mana;

  // max_mana = effective vesting shares
  const effectiveVests = getEffectiveVests(account);
  const maxMana = effectiveVests * 1e6;

  // Calculate regenerated mana: elapsed_seconds × max_mana ÷ 432000
  const now = Math.floor(Date.now() / 1000);
  const elapsedSeconds = now - last_update_time;
  const regeneratedMana = (elapsedSeconds * maxMana) / HIVE_VOTING_MANA_REGENERATION_SECONDS;

  // Current voting mana
  const currentVotingMana = Math.min(currentMana + regeneratedMana, maxMana);
  const votingPowerPercent = (currentVotingMana / maxMana) * 100;

  return Math.min(votingPowerPercent, 100);
}

/**
 * Calculate VP at a specific timestamp (for historical vote analysis)
 */
export function calculateVotingPowerAtTime(
  account: Account,
  timestamp: number
): number {
  if (!account.voting_manabar) {
    return 100;
  }

  const { current_mana, last_update_time } = account.voting_manabar;
  const currentMana = typeof current_mana === 'string' ? parseInt(current_mana) : current_mana;

  const effectiveVests = getEffectiveVests(account);
  const maxMana = effectiveVests * 1e6;

  const elapsedSeconds = timestamp - last_update_time;
  const regeneratedMana = (elapsedSeconds * maxMana) / HIVE_VOTING_MANA_REGENERATION_SECONDS;

  const votingManaAtTime = Math.min(currentMana + regeneratedMana, maxMana);
  const votingPowerPercent = (votingManaAtTime / maxMana) * 100;

  return Math.min(votingPowerPercent, 100);
}

/**
 * Calculate Hive Power from vesting shares
 */
export function vestsToHivePower(
  vests: number,
  globalProps: GlobalProps
): number {
  const totalVestingFund = toNumber(globalProps.total_vesting_fund_hive);
  const totalVestingShares = toNumber(globalProps.total_vesting_shares);

  return (vests * totalVestingFund) / totalVestingShares;
}

/**
 * Get effective Hive Power (including delegations)
 */
export function getEffectiveHivePower(
  account: Account,
  globalProps: GlobalProps
): number {
  const effectiveVests = getEffectiveVests(account);
  return vestsToHivePower(effectiveVests, globalProps);
}

/**
 * Calculate rshares for a vote at 100% weight
 * Based on vote-aliento-blog formula with linear reward curve (/50)
 * Formula: rshares = (power × finalVest) / 10000
 * where power = (votePowerFactor × 10000) / 50
 */
export function calculateRshares(
  account: Account,
  votingPower: number = 100,
  weight: number = HIVE_100_PERCENT
): number {
  const effectiveVests = getEffectiveVests(account);
  const finalVest = effectiveVests * 1e6;

  // Vote power factor (normalized to 0-1)
  const votePowerFactor = (votingPower / 100) * (weight / HIVE_100_PERCENT);

  // Linear reward curve: divide by 50
  const power = (votePowerFactor * HIVE_100_PERCENT) / 50;

  const rshares = (power * finalVest) / HIVE_100_PERCENT;

  return rshares;
}

/**
 * Estimate vote value in USD
 * Based on vote-aliento-blog formula
 * Formula: voteValueHive = (rshares / recentClaims) × rewardBalance
 *          voteValueUsd = voteValueHive × hivePrice
 */
export function estimateVoteValue(
  rshares: number,
  rewardFund: RewardFund,
  hivePriceUsd: number
): number {
  const recentClaims = toNumber(rewardFund.recent_claims);
  const rewardBalance = toNumber(rewardFund.reward_balance);

  if (recentClaims === 0) return 0;

  // Calculate value in HIVE first
  const voteValueHive = (rshares / recentClaims) * rewardBalance;

  // Convert to USD
  const voteValueUsd = voteValueHive * hivePriceUsd;

  return voteValueUsd;
}

/**
 * Calculate full vote value for an account at current VP
 */
export function calculateFullVoteValue(
  account: Account,
  rewardFund: RewardFund,
  hivePriceUsd: number,
  weight: number = HIVE_100_PERCENT
): number {
  const votingPower = calculateVotingPower(account);
  const rshares = calculateRshares(account, votingPower, weight);
  return estimateVoteValue(rshares, rewardFund, hivePriceUsd);
}

/**
 * Calculate vote value at 100% VP (max vote value)
 */
export function calculateMaxVoteValue(
  account: Account,
  rewardFund: RewardFund,
  hivePriceUsd: number,
  weight: number = HIVE_100_PERCENT
): number {
  const rshares = calculateRshares(account, 100, weight);
  return estimateVoteValue(rshares, rewardFund, hivePriceUsd);
}

/**
 * Parse reputation score to human-readable format
 */
export function parseReputation(rawReputation: string | number): number {
  const reputation = typeof rawReputation === 'string' ? parseInt(rawReputation) : rawReputation;

  if (reputation === 0) return 25;

  const neg = reputation < 0;
  let reputationLevel = Math.log10(Math.abs(reputation));
  reputationLevel = Math.max(reputationLevel - 9, 0);
  reputationLevel *= neg ? -9 : 9;
  reputationLevel += 25;

  return Math.floor(reputationLevel * 100) / 100;
}

/**
 * Calculate Resource Credits percentage
 * RC regenerates at same rate as VP (20% per day, 5 days full)
 */
export function calculateResourceCredits(account: Account): number {
  if (!account.rc_manabar) {
    return 100;
  }

  const { current_mana, last_update_time } = account.rc_manabar;
  const currentMana = typeof current_mana === 'string' ? parseInt(current_mana) : current_mana;

  const effectiveVests = getEffectiveVests(account);
  const maxRc = effectiveVests * 1e6;

  const now = Math.floor(Date.now() / 1000);
  const elapsedSeconds = now - last_update_time;
  const regeneratedRc = (elapsedSeconds * maxRc) / HIVE_VOTING_MANA_REGENERATION_SECONDS;

  const currentRc = Math.min(currentMana + regeneratedRc, maxRc);
  const rcPercent = (currentRc / maxRc) * 100;

  return Math.min(rcPercent, 100);
}

/**
 * Estimate vote value from vote weight percentage and current VP
 */
export function estimateVoteValueFromWeight(
  account: Account,
  weightPercent: number,
  rewardFund: RewardFund,
  hivePriceUsd: number
): number {
  const votingPower = calculateVotingPower(account);
  const weight = (weightPercent / 100) * HIVE_100_PERCENT;
  const rshares = calculateRshares(account, votingPower, weight);
  return estimateVoteValue(rshares, rewardFund, hivePriceUsd);
}
