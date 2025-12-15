/**
 * @raise/sdk
 *
 * TypeScript SDK for the Raise Solana program.
 * A decentralized venture funding platform with milestone-based releases.
 *
 * @packageDocumentation
 */

// =============================================================================
// Main Client
// =============================================================================

export { RaiseClient } from './client.js';
export type { Wallet } from './client.js';

// =============================================================================
// Constants
// =============================================================================

export {
  SEEDS,
  VALIDATION,
  TIMING,
  TIER_CONSTRAINTS,
  InvestmentTier,
  TIER_MINIMUMS,
  TIER_VOTE_MULTIPLIERS,
  TIER_TOKEN_MULTIPLIERS,
  getTierFromAmount,
  getVoteMultiplier,
  getTokenMultiplier,
  findTierIndex,
  GOVERNANCE,
  NFT,
  USDC,
} from './constants/index.js';

// =============================================================================
// PDAs
// =============================================================================

export {
  getProjectPDA,
  getEscrowPDA,
  getMilestonePDA,
  getInvestmentPDA,
  getVotePDA,
  getPivotProposalPDA,
  getTgeEscrowPDA,
  getTokenVaultPDA,
  getScamReportPDA,
  getAdminConfigPDA,
  getNftMintPDA,
  getProgramAuthorityPDA,
  getProjectPDAs,
  // ZTM v2.0 PDAs
  getTokenomicsPDA,
  getTokenMintPDA,
  getVaultAuthorityPDA,
  getInvestorVaultPDA,
  getFounderVaultPDA,
  getLpTokenVaultPDA,
  getTreasuryVaultPDA,
  getLpUsdcVaultPDA,
  getFounderVestingPDA,
} from './pdas/index.js';

// =============================================================================
// Account Fetchers
// =============================================================================

export {
  fetchProject,
  fetchProjectByPda,
  fetchMilestone,
  fetchAllMilestones,
  fetchInvestment,
  fetchAllInvestments,
  fetchVote,
  fetchAllVotes,
  fetchPivotProposal,
  fetchTgeEscrow,
  fetchAdminConfig,
  accountExists,
} from './accounts/index.js';

// =============================================================================
// Instructions
// =============================================================================

export {
  // Admin
  initializeAdmin,
  transferAdmin,
  acceptAdmin,
  // Project
  initializeProject,
  submitForApproval,
  approveProject,
  // Milestone
  createMilestone,
  submitMilestone,
  voteOnMilestone,
  finalizeVoting,
  claimMilestoneFunds,
  resubmitMilestone,
  // Investment
  invest,
  cancelInvestment,
  // Pivot
  proposePivot,
  approvePivot,
  withdrawFromPivot,
  finalizePivot,
  // TGE (legacy)
  setTgeDate,
  depositTokens,
  claimTokens,
  reportScam,
  releaseHoldback,
  // Abandonment
  checkAbandonment,
  claimRefund,
  // Exit Window
  claimExitWindowRefund,
  // ZTM v2.0 Token Distribution
  claimInvestorTokens,
  distributeTokens,
  completeDistribution,
  // ZTM v2.0 Founder Vesting
  initializeFounderVesting,
  claimVestedTokens,
  // ZTM v2.0 Circuit Breaker
  forceCompleteDistribution,
  claimMissedUnlock,
  // ZTM v2.0 Helpers
  symbolToBytes,
  type TokenomicsInput,
  // Milestone Deadline Helpers
  setMilestoneDeadline,
  extendMilestoneDeadline,
  calculateDeadline,
  minDeadline,
  validateDeadline,
  MIN_DEADLINE_DURATION_SECONDS_PROD,
  MIN_DEADLINE_DURATION_SECONDS_DEV,
  MAX_DEADLINE_DURATION_SECONDS,
} from './instructions/index.js';

// =============================================================================
// Types
// =============================================================================

export {
  // Enums
  ProjectState,
  MilestoneState,
  VoteChoice,
  PivotState,
  // Account types
  type Tier,
  type TierConfig,
  type ProjectAccount,
  type MilestoneAccount,
  type InvestmentAccount,
  type VoteAccount,
  type AdminConfigAccount,
  type PivotProposalAccount,
  type TgeEscrowAccount,
  // Instruction args
  type InitializeProjectArgs,
  type CreateMilestoneArgs,
  type InvestArgs,
  type VoteOnMilestoneArgs,
  type SetTgeDateArgs,
  type DepositTokensArgs,
  type ProposePivotArgs,
  // Events
  type ProjectCreatedEvent,
  type InvestmentMadeEvent,
  type MilestoneVoteCastEvent,
  type MilestoneVoteFinalizedEvent,
  // Utility types
  type InvestmentWithKey,
  type MilestoneWithKey,
  type VoteWithKey,
} from './types/index.js';

// =============================================================================
// Errors
// =============================================================================

export {
  ERROR_CODES,
  ERROR_MESSAGES,
  RaiseError,
  parseError,
  isRaiseError,
  getErrorMessage,
} from './errors/index.js';

// =============================================================================
// Events
// =============================================================================

export {
  EVENT_NAMES,
  filterEventsByName,
  findEvent,
  type RaiseEvent,
  type ProjectCreatedEvent as ProjectCreatedEventType,
  type InvestmentMadeEvent as InvestmentMadeEventType,
  type MilestoneVoteFinalizedEvent as MilestoneVoteFinalizedEventType,
  type MilestoneReworkedEvent as MilestoneReworkedEventType,
} from './events/index.js';

// =============================================================================
// Utilities
// =============================================================================

export {
  // Transaction utilities
  confirmTransaction,
  getTransactionWithRetry,
  // BN utilities
  bnToNumber,
  bnToBigInt,
  bigIntToBN,
  // Time utilities
  getCurrentTimestamp,
  timestampToDate,
  hasTimestampPassed,
  timeRemaining,
  formatDuration,
  // Percentage utilities
  bpsToPercent,
  percentToBps,
  percentageOf,
  // Validation utilities
  validateMilestonePercentages,
  validateMetadataUri,
  // Account utilities
  isValidPublicKey,
  shortenPublicKey,
} from './utils/index.js';

// =============================================================================
// Re-export Anchor/Solana types for convenience
// =============================================================================

export { BN } from '@coral-xyz/anchor';
export { PublicKey, Keypair, Connection } from '@solana/web3.js';
