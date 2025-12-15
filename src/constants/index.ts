/**
 * Raise Constants
 *
 * Mirrors the on-chain program constants for client-side validation
 * and display purposes.
 */

// =============================================================================
// PDA Seeds
// =============================================================================

export const SEEDS = {
  PROJECT: 'project',
  MILESTONE: 'milestone',
  INVESTMENT: 'investment',
  VOTE: 'vote',
  ESCROW: 'escrow',
  PIVOT: 'pivot',
  PIVOT_PROPOSAL: 'pivot_proposal',
  TGE_ESCROW: 'tge_escrow',
  TGE_ESCROW_VAULT: 'tge_escrow_vault',
  SCAM_REPORT: 'scam_report',
  ADMIN_CONFIG: 'admin-config',
  NFT_MINT: 'nft_mint',
  AUTHORITY: 'authority',
} as const;

// =============================================================================
// Validation Constants
// =============================================================================

export const VALIDATION = {
  /** Minimum number of milestones per project */
  MIN_MILESTONES: 2,
  /** Maximum number of milestones per project */
  MAX_MILESTONES: 10,
  /** Milestone percentages must sum to this value */
  MILESTONE_PERCENTAGE_SUM: 100,
  /** Maximum funding buffer (110% of goal) */
  MAX_FUNDING_BUFFER_PERCENT: 110,
  /** Maximum metadata URI length */
  MAX_METADATA_URI_LENGTH: 200,
  /** Maximum pivot description length */
  MAX_PIVOT_DESCRIPTION_LEN: 256,
  /** Maximum pivot vision length */
  MAX_PIVOT_VISION_LEN: 512,
  /** Maximum pivot justification length */
  MAX_PIVOT_JUSTIFICATION_LEN: 512,
} as const;

// =============================================================================
// Timing Constants (in seconds)
// =============================================================================

export const TIMING = {
  /** Production voting period (14 days) */
  VOTING_PERIOD_SECONDS: 1_209_600,
  /** Production hold period (7 days) */
  HOLD_PERIOD_SECONDS: 604_800,
  /** Inactivity timeout (90 days) */
  INACTIVITY_TIMEOUT_SECONDS: 7_776_000,
  /** Abandonment timeout (90 days) */
  ABANDONMENT_TIMEOUT_SECONDS: 7_776_000,
  /** Refund window (14 days) */
  REFUND_WINDOW_SECONDS: 1_209_600,
  /** Pivot withdrawal window (7 days) */
  PIVOT_WITHDRAWAL_WINDOW_SECONDS: 604_800,
  /** Minimum TGE date (15 days from now) */
  TGE_MIN_DAYS: 1_296_000,
  /** Maximum TGE date (90 days from now) */
  TGE_MAX_DAYS: 7_776_000,
  /** Post-TGE holdback period (30 days) */
  POST_TGE_HOLDBACK_DAYS: 2_592_000,
} as const;

// =============================================================================
// Tier Configuration Constraints
// =============================================================================

export const TIER_CONSTRAINTS = {
  /** Minimum number of tiers */
  MIN_TIERS: 1,
  /** Maximum number of tiers */
  MAX_TIERS: 10,
  /** Minimum tier amount (10 USDC in lamports) */
  MIN_TIER_AMOUNT: 10_000_000n,
  /** Minimum max_lots per tier */
  MIN_TIER_MAX_LOTS: 1,
  /** Minimum token ratio */
  MIN_TIER_TOKEN_RATIO: 1n,
  /** Minimum vote multiplier (100 = 1.0x) */
  MIN_TIER_VOTE_MULTIPLIER: 100,
} as const;

// =============================================================================
// Investment Tiers (Legacy - kept for backwards compatibility)
// =============================================================================

export enum InvestmentTier {
  Bronze = 'Bronze',
  Silver = 'Silver',
  Gold = 'Gold',
  Platinum = 'Platinum',
  Diamond = 'Diamond',
}

/** Investment tier minimum amounts in USDC lamports (6 decimals) - LEGACY */
export const TIER_MINIMUMS = {
  [InvestmentTier.Bronze]: 100_000_000n,    // 100 USDC
  [InvestmentTier.Silver]: 500_000_000n,    // 500 USDC
  [InvestmentTier.Gold]: 1_000_000_000n,    // 1,000 USDC
  [InvestmentTier.Platinum]: 5_000_000_000n,  // 5,000 USDC
  [InvestmentTier.Diamond]: 10_000_000_000n,  // 10,000 USDC
} as const;

/** Vote weight multipliers (scaled by 100) - LEGACY */
export const TIER_VOTE_MULTIPLIERS = {
  [InvestmentTier.Bronze]: 100,    // 1.0x
  [InvestmentTier.Silver]: 120,    // 1.2x
  [InvestmentTier.Gold]: 150,      // 1.5x
  [InvestmentTier.Platinum]: 200,  // 2.0x
  [InvestmentTier.Diamond]: 300,   // 3.0x
} as const;

/** Token allocation multipliers (same as vote multipliers) - LEGACY */
export const TIER_TOKEN_MULTIPLIERS = {
  [InvestmentTier.Bronze]: 100,
  [InvestmentTier.Silver]: 120,
  [InvestmentTier.Gold]: 150,
  [InvestmentTier.Platinum]: 200,
  [InvestmentTier.Diamond]: 300,
} as const;

/** Get tier from investment amount (in lamports) - LEGACY, use project.tiers instead */
export function getTierFromAmount(amount: bigint): InvestmentTier {
  if (amount >= TIER_MINIMUMS[InvestmentTier.Diamond]) return InvestmentTier.Diamond;
  if (amount >= TIER_MINIMUMS[InvestmentTier.Platinum]) return InvestmentTier.Platinum;
  if (amount >= TIER_MINIMUMS[InvestmentTier.Gold]) return InvestmentTier.Gold;
  if (amount >= TIER_MINIMUMS[InvestmentTier.Silver]) return InvestmentTier.Silver;
  return InvestmentTier.Bronze;
}

/** Get vote multiplier for an investment amount - LEGACY */
export function getVoteMultiplier(amount: bigint): number {
  const tier = getTierFromAmount(amount);
  return TIER_VOTE_MULTIPLIERS[tier] / 100;
}

/** Get token multiplier for an investment amount - LEGACY */
export function getTokenMultiplier(amount: bigint): number {
  const tier = getTierFromAmount(amount);
  return TIER_TOKEN_MULTIPLIERS[tier] / 100;
}

/**
 * Find matching tier index for an investment amount (threshold-based)
 * Returns the highest tier where amount >= tier.amount
 */
export function findTierIndex(tiers: Array<{ amount: bigint }>, amount: bigint): number | null {
  for (let i = tiers.length - 1; i >= 0; i--) {
    if (amount >= tiers[i].amount) {
      return i;
    }
  }
  return null;
}

// =============================================================================
// Voting and Governance
// =============================================================================

export const GOVERNANCE = {
  /** Scam report threshold (30%) */
  SCAM_THRESHOLD_PERCENT: 30,
  /** Consecutive milestone failures before exit window eligible */
  CONSECUTIVE_FAILURES_THRESHOLD: 3,
  /** Milestone approval threshold (>50% weighted approval per whitepaper voting.md:100-101) */
  MILESTONE_APPROVAL_THRESHOLD_PERCENT: 50,
} as const;

// =============================================================================
// NFT Constants
// =============================================================================

export const NFT = {
  /** NFT symbol */
  SYMBOL: 'SNI',
  /** NFT name prefix */
  NAME_PREFIX: 'Raise Investment #',
  /** Royalty basis points (2%) */
  ROYALTY_BASIS_POINTS: 200,
} as const;

// =============================================================================
// USDC Constants
// =============================================================================

export const USDC = {
  /** USDC decimals */
  DECIMALS: 6,
  /** Convert USDC to lamports */
  toAmount: (usdc: number): bigint => BigInt(Math.floor(usdc * 10 ** 6)),
  /** Convert lamports to USDC */
  fromAmount: (lamports: bigint): number => Number(lamports) / 10 ** 6,
} as const;
