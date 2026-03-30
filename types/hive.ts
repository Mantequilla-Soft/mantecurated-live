/**
 * TypeScript interfaces for Hive blockchain data structures
 */

export interface VotingManabar {
  current_mana: string | number;
  last_update_time: number;
}

export interface HiveAccount {
  id: number;
  name: string;
  created: string;

  // Vesting (HP) - Can be string or Asset type from dhive
  vesting_shares: string | any;
  received_vesting_shares: string | any;
  delegated_vesting_shares: string | any;
  vesting_withdraw_rate: string | any;

  // Voting
  voting_manabar?: VotingManabar;
  voting_power?: number;
  last_vote_time?: string;

  // Resource Credits
  rc_manabar?: VotingManabar;

  // Balances - Can be string or Asset type from dhive
  balance: string | any;
  hbd_balance: string | any;
  savings_balance: string | any;
  savings_hbd_balance: string | any;

  // Social
  reputation: string | number;
  post_count: number;
  comment_count?: number;

  // Profile metadata
  posting_json_metadata: string;
  json_metadata: string;

  // Witness
  witness_votes?: string[];
  proxy?: string;

  // Additional fields that may be present
  [key: string]: any;
}

export interface GlobalProperties {
  head_block_number: number;
  head_block_id: string;
  time: string;
  current_witness: string;
  total_vesting_fund_hive: string | any;
  total_vesting_shares: string | any;
  total_reward_fund_hive?: string | any;
  hbd_print_rate: number;
  current_supply: string | any;
  virtual_supply: string | any;
  hbd_interest_rate: number;
  maximum_block_size: number;
  [key: string]: any;
}

export interface RewardFund {
  id: number;
  name: string;
  reward_balance: string | any;
  recent_claims: string | any;
  last_update: string;
  content_constant: string;
  percent_curation_rewards: number;
  percent_content_rewards: number;
  [key: string]: any;
}

export interface MedianPrice {
  base: string | any; // HIVE amount
  quote: string | any; // HBD amount
  [key: string]: any;
}

export interface VoteOperation {
  voter: string;
  author: string;
  permlink: string;
  weight: number;
  timestamp?: string;
}

export interface AccountHistoryEntry {
  0: number; // transaction number
  1: {
    trx_id: string;
    block: number;
    trx_in_block: number;
    op_in_trx: number;
    virtual_op: number;
    timestamp: string;
    op: [string, any]; // [operation_type, operation_data]
  };
}

export interface VoteHistoryEntry {
  transactionNumber: number;
  timestamp: string;
  voter: string;
  author: string;
  permlink: string;
  weight: number;
  estimatedValue?: number;
  votingPowerAtTime?: number;
}

export interface AccountStats {
  votingPower: number;
  hivePower: number;
  resourceCredits: number;
  reputation: number;
  hiveBalance: number;
  hbdBalance: number;
  currentVoteValue: number;
  maxVoteValue: number;
}

export interface TopAuthor {
  author: string;
  voteCount: number;
  totalValue: number;
}

export interface VotingPowerDataPoint {
  timestamp: number;
  votingPower: number;
}
