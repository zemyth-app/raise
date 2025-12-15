/**
 * Raise Type Definitions
 *
 * Re-exports types from the IDL and provides additional utility types.
 */

import { PublicKey } from '@solana/web3.js';
import { BN } from '@coral-xyz/anchor';

// =============================================================================
// Project State Enums
// =============================================================================

export enum ProjectState {
  Draft = 'draft',
  PendingApproval = 'pendingApproval',
  Open = 'open',
  Funded = 'funded',
  InProgress = 'inProgress',
  Completed = 'completed',
  Abandoned = 'abandoned',
  Failed = 'failed',
  TGEFailed = 'tgeFailed',
  Cancelled = 'cancelled',
}

export enum MilestoneState {
  Proposed = 'proposed',
  Approved = 'approved',
  InProgress = 'inProgress',
  UnderReview = 'underReview',
  Passed = 'passed',
  Failed = 'failed',
  Unlocked = 'unlocked',
}

export enum VoteChoice {
  Good = 'good',
  Bad = 'bad',
}

export enum PivotState {
  PendingModeratorApproval = 'pendingModeratorApproval',
  ApprovedAwaitingInvestorWindow = 'approvedAwaitingInvestorWindow',
  Finalized = 'finalized',
}

// =============================================================================
// Account Types
// =============================================================================

/**
 * Tier configuration stored on-chain (includes filled_lots)
 */
export interface Tier {
  /** USDC amount per lot */
  amount: BN;
  /** Maximum lots available */
  maxLots: number;
  /** Currently filled lots */
  filledLots: number;
  /** Token allocation per $1 invested */
  tokenRatio: BN;
  /** Vote weight multiplier (basis points, 100 = 1.0x) */
  voteMultiplier: number;
}

/**
 * Tier configuration input for project initialization
 * Founders pass these when creating a project
 */
export interface TierConfig {
  /** USDC amount per lot (must be >= 10 USDC = 10_000_000 lamports) */
  amount: BN;
  /** Maximum lots available (must be >= 1) */
  maxLots: number;
  /** Token allocation per $1 invested (must be >= 1) */
  tokenRatio: BN;
  /** Vote weight multiplier (basis points, must be >= 100 = 1.0x) */
  voteMultiplier: number;
}

export interface ProjectAccount {
  founder: PublicKey;
  projectId: BN;
  fundingGoal: BN;
  amountRaised: BN;
  state: ProjectState;
  metadataUri: string;
  escrow: PublicKey;
  currentMilestone: number;
  totalMilestones: number;
  /** Number of active tiers (1-10) */
  tierCount: number;
  /** All tier slots (only first tierCount are active) */
  tiers: Tier[];
  tokenMint: PublicKey | null;
  tgeDate: BN | null;
  tokensDeposited: BN;
  tokenAllocationBps: number;
  totalTokenAllocation: BN;
  consecutiveFailures: number;
  investorCount: number;
  bump: number;
}

export interface MilestoneAccount {
  project: PublicKey;
  milestoneIndex: number;
  percentage: number;
  description: string;
  state: MilestoneState;
  yesVotes: BN;
  noVotes: BN;
  totalWeight: BN;
  voterCount: number;
  votingEndsAt: BN | null;
  bump: number;
}

export interface InvestmentAccount {
  project: PublicKey;
  investor: PublicKey;
  nftMint: PublicKey;
  amount: BN;
  voteWeight: BN;
  tokenAllocation: BN;
  tier: number;
  investedAt: BN;
  tokensClaimed: boolean;
  withdrawnFromPivot: boolean;
  refundClaimed: boolean;
  bump: number;
}

export interface VoteAccount {
  milestone: PublicKey;
  voter: PublicKey;
  choice: VoteChoice;
  weight: BN;
  votedAt: BN;
  bump: number;
}

export interface AdminConfigAccount {
  admin: PublicKey;
  pendingAdmin: PublicKey | null;
  bump: number;
}

export interface PivotProposalAccount {
  project: PublicKey;
  newMetadataUri: string;
  newMilestones: Array<{ percentage: number; description: string }>;
  state: PivotState;
  proposedAt: BN;
  approvedAt: BN | null;
  withdrawalWindowEndsAt: BN | null;
  withdrawnAmount: BN;
  withdrawnCount: number;
  bump: number;
}

export interface TgeEscrowAccount {
  project: PublicKey;
  holdbackAmount: BN;
  scamReports: BN;
  scamWeight: BN;
  scamConfirmed: boolean;
  holdbackReleased: boolean;
  bump: number;
}

// =============================================================================
// Instruction Arguments
// =============================================================================

export interface InitializeProjectArgs {
  projectId: BN;
  fundingGoal: BN;
  metadataUri: string;
  /** Founder-configured tiers (1-10 tiers) */
  tiers: TierConfig[];
}

export interface CreateMilestoneArgs {
  milestoneIndex: number;
  percentage: number;
  description: string;
}

export interface InvestArgs {
  amount: BN;
}

export interface VoteOnMilestoneArgs {
  choice: VoteChoice;
}

export interface SetTgeDateArgs {
  tgeDate: BN;
  tokenMint: PublicKey;
}

export interface DepositTokensArgs {
  amount: BN;
}

export interface ProposePivotArgs {
  newMetadataUri: string;
  newMilestones: Array<{ percentage: number; description: string }>;
}

// =============================================================================
// Event Types
// =============================================================================

export interface ProjectCreatedEvent {
  projectId: BN;
  founder: PublicKey;
  fundingGoal: BN;
  metadataUri: string;
}

export interface InvestmentMadeEvent {
  projectId: BN;
  investor: PublicKey;
  amount: BN;
  nftMint: PublicKey;
  tier: number;
  voteWeight: BN;
}

export interface MilestoneVoteCastEvent {
  projectId: BN;
  milestoneIndex: number;
  voter: PublicKey;
  choice: VoteChoice;
  weight: BN;
}

export interface MilestoneVoteFinalizedEvent {
  projectId: BN;
  milestoneIndex: number;
  passed: boolean;
  yesVotes: BN;
  noVotes: BN;
}

// =============================================================================
// Utility Types
// =============================================================================

export interface InvestmentWithKey {
  publicKey: PublicKey;
  account: InvestmentAccount;
}

export interface MilestoneWithKey {
  publicKey: PublicKey;
  account: MilestoneAccount;
}

export interface VoteWithKey {
  publicKey: PublicKey;
  account: VoteAccount;
}
