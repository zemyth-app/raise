/**
 * Raise Event Parsing
 *
 * Helpers for parsing program events from transaction logs.
 */

import { BN } from '@coral-xyz/anchor';
import { PublicKey } from '@solana/web3.js';

// =============================================================================
// Event Types
// =============================================================================

export interface ProjectCreatedEvent {
  name: 'ProjectCreated';
  data: {
    projectId: BN;
    founder: PublicKey;
    fundingGoal: BN;
    metadataUri: string;
  };
}

export interface ProjectApprovedEvent {
  name: 'ProjectApproved';
  data: {
    projectId: BN;
  };
}

export interface ProjectFundedEvent {
  name: 'ProjectFunded';
  data: {
    projectId: BN;
    amountRaised: BN;
  };
}

export interface InvestmentMadeEvent {
  name: 'InvestmentMade';
  data: {
    projectId: BN;
    investor: PublicKey;
    amount: BN;
    nftMint: PublicKey;
    tier: number;
    voteWeight: BN;
  };
}

export interface InvestmentCancelledEvent {
  name: 'InvestmentCancelled';
  data: {
    projectId: BN;
    investor: PublicKey;
    amount: BN;
    nftMint: PublicKey;
  };
}

export interface MilestoneCreatedEvent {
  name: 'MilestoneCreated';
  data: {
    projectId: BN;
    milestoneIndex: number;
    percentage: number;
    description: string;
  };
}

export interface MilestoneSubmittedEvent {
  name: 'MilestoneSubmitted';
  data: {
    projectId: BN;
    milestoneIndex: number;
    votingEndsAt: BN;
  };
}

export interface VoteCastEvent {
  name: 'VoteCast';
  data: {
    projectId: BN;
    milestoneIndex: number;
    voter: PublicKey;
    choice: { good: object } | { bad: object };
    weight: BN;
  };
}

export interface MilestoneVoteFinalizedEvent {
  name: 'MilestoneVoteFinalized';
  data: {
    projectId: BN;
    milestoneIndex: number;
    passed: boolean;
    yesVotes: BN;
    noVotes: BN;
  };
}

export interface FundsUnlockedEvent {
  name: 'FundsUnlocked';
  data: {
    projectId: BN;
    milestoneIndex: number;
    amount: BN;
  };
}

export interface TgeDateSetEvent {
  name: 'TgeDateSet';
  data: {
    projectId: BN;
    tgeDate: BN;
    tokenMint: PublicKey;
  };
}

export interface TokensDepositedEvent {
  name: 'TokensDeposited';
  data: {
    projectId: BN;
    amount: BN;
  };
}

export interface TokensClaimedEvent {
  name: 'TokensClaimed';
  data: {
    projectId: BN;
    investor: PublicKey;
    amount: BN;
  };
}

export interface RefundClaimedEvent {
  name: 'RefundClaimed';
  data: {
    projectId: BN;
    investor: PublicKey;
    amount: BN;
  };
}

export interface PivotProposedEvent {
  name: 'PivotProposed';
  data: {
    projectId: BN;
    newMetadataUri: string;
  };
}

export interface PivotApprovedEvent {
  name: 'PivotApproved';
  data: {
    projectId: BN;
    withdrawalWindowEndsAt: BN;
  };
}

export interface PivotFinalizedEvent {
  name: 'PivotFinalized';
  data: {
    projectId: BN;
    withdrawnAmount: BN;
    withdrawnCount: number;
  };
}

export interface MilestoneReworkedEvent {
  name: 'MilestoneReworked';
  data: {
    projectId: BN;
    milestoneIndex: number;
    milestoneKey: PublicKey;
    consecutiveFailures: number;
    reworkedAt: BN;
  };
}

export type RaiseEvent =
  | ProjectCreatedEvent
  | ProjectApprovedEvent
  | ProjectFundedEvent
  | InvestmentMadeEvent
  | InvestmentCancelledEvent
  | MilestoneCreatedEvent
  | MilestoneSubmittedEvent
  | VoteCastEvent
  | MilestoneVoteFinalizedEvent
  | FundsUnlockedEvent
  | TgeDateSetEvent
  | TokensDepositedEvent
  | TokensClaimedEvent
  | RefundClaimedEvent
  | PivotProposedEvent
  | PivotApprovedEvent
  | PivotFinalizedEvent
  | MilestoneReworkedEvent;

// =============================================================================
// Event Parsing
// =============================================================================

/**
 * Event name constants
 */
export const EVENT_NAMES = {
  ProjectCreated: 'ProjectCreated',
  ProjectApproved: 'ProjectApproved',
  ProjectFunded: 'ProjectFunded',
  InvestmentMade: 'InvestmentMade',
  InvestmentCancelled: 'InvestmentCancelled',
  MilestoneCreated: 'MilestoneCreated',
  MilestoneSubmitted: 'MilestoneSubmitted',
  VoteCast: 'VoteCast',
  MilestoneVoteFinalized: 'MilestoneVoteFinalized',
  FundsUnlocked: 'FundsUnlocked',
  TgeDateSet: 'TgeDateSet',
  TokensDeposited: 'TokensDeposited',
  TokensClaimed: 'TokensClaimed',
  RefundClaimed: 'RefundClaimed',
  PivotProposed: 'PivotProposed',
  PivotApproved: 'PivotApproved',
  PivotFinalized: 'PivotFinalized',
  MilestoneReworked: 'MilestoneReworked',
} as const;

/**
 * Filter events by name
 *
 * @param events - Array of events
 * @param name - Event name to filter
 * @returns Filtered events
 */
export function filterEventsByName<T extends RaiseEvent>(
  events: RaiseEvent[],
  name: T['name']
): T[] {
  return events.filter((e) => e.name === name) as T[];
}

/**
 * Get the first event of a specific type
 *
 * @param events - Array of events
 * @param name - Event name to find
 * @returns First matching event or undefined
 */
export function findEvent<T extends RaiseEvent>(
  events: RaiseEvent[],
  name: T['name']
): T | undefined {
  return events.find((e) => e.name === name) as T | undefined;
}
