/**
 * Raise Instruction Builders
 *
 * All instruction builder functions for the Raise program.
 * These return transaction signatures when called with RPC.
 */

import { Program, BN } from '@coral-xyz/anchor';
import { PublicKey, Keypair, SYSVAR_INSTRUCTIONS_PUBKEY, SYSVAR_RENT_PUBKEY, SYSVAR_CLOCK_PUBKEY, SystemProgram, ComputeBudgetProgram } from '@solana/web3.js';
import {
  getProjectPDA,
  getEscrowPDA,
  getMilestonePDA,
  getInvestmentPDA,
  getVotePDA,
  getPivotProposalPDA,
  getTgeEscrowPDA,
  getTokenVaultPDA,
  getNftMintPDA,
  getProgramAuthorityPDA,
  getAdminConfigPDA,
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
} from '../pdas/index.js';
import { getAssociatedTokenAddressSync, TOKEN_PROGRAM_ID, ASSOCIATED_TOKEN_PROGRAM_ID } from '@solana/spl-token';

// Metaplex Token Metadata Program ID
const TOKEN_METADATA_PROGRAM_ID = new PublicKey('metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s');

/**
 * Ensure value is a proper PublicKey instance.
 * Handles cases where PublicKey objects lose their prototype chain
 * (e.g., when passing through React state or JSON serialization).
 */
function ensurePublicKey(value: PublicKey | string | { toString(): string }): PublicKey {
  if (value instanceof PublicKey) {
    return value;
  }
  // Handle string or object with toString method
  return new PublicKey(String(value));
}

// Generic type for any Anchor program
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyProgram = Program<any>;

// Helper to get methods namespace - bypasses deep type instantiation
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function getMethods(program: AnyProgram): any {
  return program.methods;
}

// Helper to get account namespace for fetching accounts
// Used by voteOnMilestone to fetch milestone.voting_round for vote PDA
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function getAccountNamespace(program: AnyProgram): any {
  return program.account;
}

// =============================================================================
// Admin Instructions
// =============================================================================

/**
 * Initialize admin config (deploy-time only)
 */
export async function initializeAdmin(
  program: AnyProgram,
  admin: PublicKey,
  payer: PublicKey
): Promise<string> {
  return getMethods(program)
    .initializeAdmin()
    .accounts({
      admin,
      payer,
    })
    .rpc();
}

/**
 * Propose admin transfer to new admin
 */
export async function transferAdmin(
  program: AnyProgram,
  adminKeypair: Keypair,
  newAdmin: PublicKey
): Promise<string> {
  return getMethods(program)
    .transferAdmin()
    .accounts({
      authority: adminKeypair.publicKey,
      newAdmin,
    })
    .signers([adminKeypair])
    .rpc();
}

/**
 * Accept admin transfer
 */
export async function acceptAdmin(
  program: AnyProgram,
  newAuthority: PublicKey
): Promise<string> {
  return getMethods(program)
    .acceptAdmin()
    .accounts({
      newAuthority,
    })
    .rpc();
}

// =============================================================================
// Project Instructions
// =============================================================================

/**
 * TierConfig input type for initializeProject
 * Matches the on-chain TierConfig struct
 */
interface TierConfigInput {
  /** USDC amount per lot */
  amount: BN;
  /** Maximum lots available */
  maxLots: number;
  /** Token allocation per $1 invested */
  tokenRatio: BN;
  /** Vote weight multiplier (basis points, 100 = 1.0x) */
  voteMultiplier: number;
}

/**
 * TokenomicsArgs input type for initializeProject (ZTM v2.0)
 * Matches the on-chain TokenomicsArgs struct
 */
export interface TokenomicsInput {
  /** Token symbol as 8-byte array (2-8 chars uppercase, padded with 0s) */
  tokenSymbol: number[];
  /** Total token supply */
  totalSupply: BN;
  /** Investor allocation in basis points (e.g., 4000 = 40%) */
  investorAllocationBps: number;
  /** LP token allocation in basis points */
  lpTokenAllocationBps: number;
  /** LP USDC allocation in basis points (min 500 = 5% of raised USDC) */
  lpUsdcAllocationBps: number;
  /** Founder allocation in basis points (optional) */
  founderAllocationBps?: number | null;
  /** Treasury allocation in basis points (optional) */
  treasuryAllocationBps?: number | null;
  /** Founder wallet for vesting (required if founder_allocation_bps > 0) */
  founderWallet?: PublicKey | null;
  /** Vesting duration in months (required if founder_allocation_bps > 0) */
  vestingDurationMonths?: number | null;
  /** Cliff period in months (optional) */
  cliffMonths?: number | null;
}

/**
 * Helper to convert string symbol to 8-byte array
 */
export function symbolToBytes(symbol: string): number[] {
  const bytes = new Array(8).fill(0);
  const chars = symbol.toUpperCase().slice(0, 8);
  for (let i = 0; i < chars.length; i++) {
    bytes[i] = chars.charCodeAt(i);
  }
  return bytes;
}

// =============================================================================
// Deadline Constants and Helpers
// =============================================================================

/** Minimum deadline duration from current time (7 days in production, 60s in dev) */
export const MIN_DEADLINE_DURATION_SECONDS_PROD = 604_800; // 7 days
export const MIN_DEADLINE_DURATION_SECONDS_DEV = 60; // 60 seconds

/** Maximum deadline duration from current time (1 year) */
export const MAX_DEADLINE_DURATION_SECONDS = 31_536_000; // 365 days

/**
 * Calculate a valid milestone deadline
 *
 * @param daysFromNow - Number of days from now to set deadline
 * @param isDev - Use dev mode (60s min) or production mode (7 days min)
 * @returns BN timestamp for the deadline
 */
export function calculateDeadline(daysFromNow: number, isDev: boolean = false): BN {
  const nowSeconds = Math.floor(Date.now() / 1000);
  const minDuration = isDev ? MIN_DEADLINE_DURATION_SECONDS_DEV : MIN_DEADLINE_DURATION_SECONDS_PROD;
  const daysInSeconds = daysFromNow * 24 * 60 * 60;

  // Ensure deadline is at least minimum duration from now
  const deadlineSeconds = nowSeconds + Math.max(daysInSeconds, minDuration);

  // Cap at maximum duration
  const maxDeadline = nowSeconds + MAX_DEADLINE_DURATION_SECONDS;
  return new BN(Math.min(deadlineSeconds, maxDeadline));
}

/**
 * Create a deadline that's the minimum allowed duration from now
 *
 * @param isDev - Use dev mode (60s min) or production mode (7 days min)
 * @returns BN timestamp for the minimum valid deadline
 */
export function minDeadline(isDev: boolean = false): BN {
  const nowSeconds = Math.floor(Date.now() / 1000);
  const minDuration = isDev ? MIN_DEADLINE_DURATION_SECONDS_DEV : MIN_DEADLINE_DURATION_SECONDS_PROD;
  return new BN(nowSeconds + minDuration + 1); // +1 for safety margin
}

/**
 * Validate a deadline is within allowed bounds
 *
 * @param deadline - BN timestamp to validate
 * @param isDev - Use dev mode (60s min) or production mode (7 days min)
 * @returns { valid: boolean, error?: string }
 */
export function validateDeadline(
  deadline: BN,
  isDev: boolean = false
): { valid: boolean; error?: string } {
  const nowSeconds = Math.floor(Date.now() / 1000);
  const deadlineSeconds = deadline.toNumber();
  const minDuration = isDev ? MIN_DEADLINE_DURATION_SECONDS_DEV : MIN_DEADLINE_DURATION_SECONDS_PROD;

  const minDeadline = nowSeconds + minDuration;
  const maxDeadline = nowSeconds + MAX_DEADLINE_DURATION_SECONDS;

  if (deadlineSeconds < minDeadline) {
    const minDays = isDev ? '60 seconds' : '7 days';
    return {
      valid: false,
      error: `Deadline must be at least ${minDays} from now`,
    };
  }

  if (deadlineSeconds > maxDeadline) {
    return {
      valid: false,
      error: 'Deadline must be within 1 year from now',
    };
  }

  return { valid: true };
}

/**
 * Initialize a new project with founder-configured tiers and tokenomics (ZTM v2.0)
 *
 * @param milestone1Deadline - Unix timestamp for M1 deadline (required)
 *   Must be >= current_time + MIN_DEADLINE_DURATION_SECONDS (7 days prod, 60s dev)
 *   Must be <= current_time + MAX_DEADLINE_DURATION_SECONDS (1 year)
 */
export async function initializeProject(
  program: AnyProgram,
  args: {
    projectId: BN;
    fundingGoal: BN;
    metadataUri: string;
    /** Founder-configured tiers (1-10 tiers, sorted ascending by amount) */
    tiers: TierConfigInput[];
    /** ZTM v2.0: Tokenomics configuration */
    tokenomics: TokenomicsInput;
    /** Milestone 1 deadline - Unix timestamp (required) */
    milestone1Deadline: BN;
  },
  founder: PublicKey
): Promise<string> {
  return getMethods(program)
    .initializeProject({
      projectId: args.projectId,
      fundingGoal: args.fundingGoal,
      metadataUri: args.metadataUri,
      tiers: args.tiers,
      tokenomics: {
        tokenSymbol: args.tokenomics.tokenSymbol,
        totalSupply: args.tokenomics.totalSupply,
        investorAllocationBps: args.tokenomics.investorAllocationBps,
        lpTokenAllocationBps: args.tokenomics.lpTokenAllocationBps,
        lpUsdcAllocationBps: args.tokenomics.lpUsdcAllocationBps,
        founderAllocationBps: args.tokenomics.founderAllocationBps ?? null,
        treasuryAllocationBps: args.tokenomics.treasuryAllocationBps ?? null,
        founderWallet: args.tokenomics.founderWallet ?? null,
        vestingDurationMonths: args.tokenomics.vestingDurationMonths ?? null,
        cliffMonths: args.tokenomics.cliffMonths ?? null,
      },
      milestone1Deadline: args.milestone1Deadline,
    })
    .accounts({
      founder,
    })
    .rpc();
}

/**
 * Submit project for approval
 */
export async function submitForApproval(
  program: AnyProgram,
  projectId: BN,
  founder: PublicKey
): Promise<string> {
  const projectPda = getProjectPDA(projectId, program.programId);

  return getMethods(program)
    .submitForApproval()
    .accounts({
      project: projectPda,
      founder,
    })
    .rpc();
}

/**
 * Approve project (admin only)
 * ZTM v2.0: This now deploys the token and creates all vaults
 */
export async function approveProject(
  program: AnyProgram,
  args: {
    projectId: BN;
    /** USDC mint address (for creating lp_usdc_vault) */
    usdcMint: PublicKey;
  },
  adminKeypair: Keypair
): Promise<string> {
  const projectPda = getProjectPDA(args.projectId, program.programId);
  const tokenomicsPda = getTokenomicsPDA(projectPda, program.programId);
  const tokenVaultPda = getTokenVaultPDA(projectPda, program.programId);
  const tokenMintPda = getTokenMintPDA(projectPda, program.programId);
  const vaultAuthorityPda = getVaultAuthorityPDA(projectPda, program.programId);
  const investorVaultPda = getInvestorVaultPDA(projectPda, program.programId);
  const founderVaultPda = getFounderVaultPDA(projectPda, program.programId);
  const lpTokenVaultPda = getLpTokenVaultPDA(projectPda, program.programId);
  const treasuryVaultPda = getTreasuryVaultPDA(projectPda, program.programId);
  const lpUsdcVaultPda = getLpUsdcVaultPDA(projectPda, program.programId);

  return getMethods(program)
    .approveProject()
    .accounts({
      project: projectPda,
      tokenomics: tokenomicsPda,
      tokenVault: tokenVaultPda,
      tokenMint: tokenMintPda,
      vaultAuthority: vaultAuthorityPda,
      investorVault: investorVaultPda,
      founderVault: founderVaultPda,
      lpTokenVault: lpTokenVaultPda,
      treasuryVault: treasuryVaultPda,
      lpUsdcVault: lpUsdcVaultPda,
      usdcMint: args.usdcMint,
      authority: adminKeypair.publicKey,
      payer: adminKeypair.publicKey,
    })
    .signers([adminKeypair])
    .rpc();
}

// =============================================================================
// Milestone Instructions
// =============================================================================

/**
 * Create a milestone for a project
 */
export async function createMilestone(
  program: AnyProgram,
  args: {
    projectId: BN;
    milestoneIndex: number;
    percentage: number;
    description: string;
  },
  founder: PublicKey
): Promise<string> {
  const projectPda = getProjectPDA(args.projectId, program.programId);
  const milestonePda = getMilestonePDA(projectPda, args.milestoneIndex, program.programId);

  return getMethods(program)
    .createMilestone({
      milestoneIndex: args.milestoneIndex,
      percentage: args.percentage,
      description: args.description,
    })
    .accounts({
      project: projectPda,
      milestone: milestonePda,
      founder,
    })
    .rpc();
}

/**
 * Submit milestone for review
 */
export async function submitMilestone(
  program: AnyProgram,
  projectId: BN,
  milestoneIndex: number,
  founder: PublicKey
): Promise<string> {
  const projectPda = getProjectPDA(projectId, program.programId);
  const milestonePda = getMilestonePDA(projectPda, milestoneIndex, program.programId);

  return getMethods(program)
    .submitMilestone()
    .accounts({
      project: projectPda,
      milestone: milestonePda,
      founder,
    })
    .rpc();
}

/**
 * Vote on a milestone
 *
 * Automatically fetches the milestone to get the current voting_round
 * for proper vote PDA derivation. This supports re-voting after milestone failure.
 */
export async function voteOnMilestone(
  program: AnyProgram,
  args: {
    projectId: BN;
    milestoneIndex: number;
    nftMint: PublicKey | string;
    choice: { good: object } | { bad: object };
  },
  voter: PublicKey
): Promise<string> {
  // Ensure nftMint is a proper PublicKey (handles React state serialization)
  const nftMintPubkey = ensurePublicKey(args.nftMint);

  const projectPda = getProjectPDA(args.projectId, program.programId);
  const milestonePda = getMilestonePDA(projectPda, args.milestoneIndex, program.programId);
  const investmentPda = getInvestmentPDA(projectPda, nftMintPubkey, program.programId);

  // Fetch milestone to get current voting_round for vote PDA derivation
  // This enables re-voting after milestone failure and resubmit
  const milestone = await getAccountNamespace(program).milestone.fetch(milestonePda);
  const votingRound = milestone.votingRound ?? 0;
  const votePda = getVotePDA(milestonePda, voter, votingRound, program.programId);

  // Get voter's NFT token account (ATA)
  const voterNftAccount = getAssociatedTokenAddressSync(
    nftMintPubkey,
    voter,
    false, // allowOwnerOffCurve
    TOKEN_PROGRAM_ID
  );

  return getMethods(program)
    .voteOnMilestone({ choice: args.choice })
    .accounts({
      milestone: milestonePda,
      project: projectPda,
      investment: investmentPda,
      vote: votePda,
      nftMint: nftMintPubkey,
      voterNftAccount,
      voter,
    })
    .rpc();
}

/**
 * Finalize voting on a milestone
 */
export async function finalizeVoting(
  program: AnyProgram,
  projectId: BN,
  milestoneIndex: number
): Promise<string> {
  const projectPda = getProjectPDA(projectId, program.programId);
  const milestonePda = getMilestonePDA(projectPda, milestoneIndex, program.programId);

  return getMethods(program)
    .finalizeVoting()
    .accounts({
      project: projectPda,
      milestone: milestonePda,
    })
    .rpc();
}

/**
 * Claim milestone funds (for founders)
 *
 * ZTM v2.0: Transfers USDC from escrow to founder's account.
 * - Regular milestones: Full payout to founder (no LP deduction)
 * - Final milestone: LP USDC reserved for PCL, triggers MAE
 *
 * @param nextMilestoneDeadline - Deadline for next milestone (required for non-final milestones)
 *   Must be >= current_time + MIN_DEADLINE_DURATION_SECONDS (7 days prod, 60s dev)
 *   Must be <= current_time + MAX_DEADLINE_DURATION_SECONDS (1 year)
 *   Set to BN(0) for final milestone claims (no next milestone exists)
 */
export async function claimMilestoneFunds(
  program: AnyProgram,
  args: {
    projectId: BN;
    milestoneIndex: number;
    founderUsdcAccount: PublicKey;
    escrowTokenAccount: PublicKey;
    /** Deadline for next milestone - required for non-final milestones, use BN(0) for final */
    nextMilestoneDeadline: BN;
    /** Next milestone PDA - required for non-final milestones */
    nextMilestonePda?: PublicKey;
  },
  founder: PublicKey
): Promise<string> {
  const projectPda = getProjectPDA(args.projectId, program.programId);
  const milestonePda = getMilestonePDA(projectPda, args.milestoneIndex, program.programId);
  const escrowPda = getEscrowPDA(args.projectId, program.programId);
  const tokenVaultPda = getTokenVaultPDA(projectPda, program.programId);
  const tokenomicsPda = getTokenomicsPDA(projectPda, program.programId);
  const lpUsdcVaultPda = getLpUsdcVaultPDA(projectPda, program.programId);

  // For non-final milestones, derive next milestone PDA if not provided
  const nextMilestonePda = args.nextMilestonePda ??
    (args.nextMilestoneDeadline.gt(new BN(0))
      ? getMilestonePDA(projectPda, args.milestoneIndex + 1, program.programId)
      : null);

  return getMethods(program)
    .claimMilestoneFunds({ nextMilestoneDeadline: args.nextMilestoneDeadline })
    .accounts({
      milestone: milestonePda,
      project: projectPda,
      founder,
      projectEscrow: args.escrowTokenAccount,
      founderUsdcAccount: args.founderUsdcAccount,
      escrowPda,
      tokenVault: tokenVaultPda,
      tokenomics: tokenomicsPda,
      lpUsdcVault: lpUsdcVaultPda,
      nextMilestone: nextMilestonePda,
      systemProgram: SystemProgram.programId,
      tokenProgram: TOKEN_PROGRAM_ID,
    })
    .rpc();
}

/**
 * Resubmit a failed milestone for rework (Failed → InProgress)
 *
 * This allows founders to iterate on a failed milestone by transitioning it
 * back to InProgress state with cleared voting state for a fresh voting cycle.
 * The consecutive_failures counter is NOT reset (tracked at project level).
 * Unlimited rework attempts are allowed.
 */
export async function resubmitMilestone(
  program: AnyProgram,
  args: {
    projectId: BN;
    milestoneIndex: number;
  },
  founder: PublicKey
): Promise<string> {
  const projectPda = getProjectPDA(args.projectId, program.programId);
  const milestonePda = getMilestonePDA(projectPda, args.milestoneIndex, program.programId);

  return getMethods(program)
    .resubmitMilestone()
    .accounts({
      project: projectPda,
      milestone: milestonePda,
      founder,
    })
    .rpc();
}

/**
 * Set milestone deadline for founder to commit submission date
 *
 * Founders must set deadlines for milestones to provide visibility to investors.
 * Deadline must be at least 7 days from now and at most 1 year from now.
 * Can only be set on Proposed, Approved, or InProgress milestones.
 */
export async function setMilestoneDeadline(
  program: AnyProgram,
  args: {
    projectId: BN;
    milestoneIndex: number;
    /** Unix timestamp for the deadline */
    deadline: BN;
  },
  founder: PublicKey
): Promise<string> {
  const projectPda = getProjectPDA(args.projectId, program.programId);
  const milestonePda = getMilestonePDA(projectPda, args.milestoneIndex, program.programId);

  return getMethods(program)
    .setMilestoneDeadline({
      milestoneIndex: args.milestoneIndex,
      deadline: args.deadline,
    })
    .accounts({
      project: projectPda,
      milestone: milestonePda,
      founder,
    })
    .rpc();
}

/**
 * Extend milestone deadline (max 3 extensions per milestone)
 *
 * Founders can extend a deadline up to 3 times before it passes.
 * Must be called BEFORE the current deadline passes.
 * New deadline must be later than current deadline.
 */
export async function extendMilestoneDeadline(
  program: AnyProgram,
  args: {
    projectId: BN;
    milestoneIndex: number;
    /** New deadline timestamp (must be > current deadline) */
    newDeadline: BN;
  },
  founder: PublicKey
): Promise<string> {
  const projectPda = getProjectPDA(args.projectId, program.programId);
  const milestonePda = getMilestonePDA(projectPda, args.milestoneIndex, program.programId);

  return getMethods(program)
    .extendMilestoneDeadline({
      milestoneIndex: args.milestoneIndex,
      newDeadline: args.newDeadline,
    })
    .accounts({
      project: projectPda,
      milestone: milestonePda,
      founder,
    })
    .rpc();
}

// =============================================================================
// Investment Instructions
// =============================================================================

/**
 * Derive Metaplex metadata PDA
 */
function getMetadataPDA(mint: PublicKey): PublicKey {
  const [pda] = PublicKey.findProgramAddressSync(
    [
      Buffer.from('metadata'),
      TOKEN_METADATA_PROGRAM_ID.toBuffer(),
      mint.toBuffer(),
    ],
    TOKEN_METADATA_PROGRAM_ID
  );
  return pda;
}

/**
 * Derive Metaplex master edition PDA
 */
function getMasterEditionPDA(mint: PublicKey): PublicKey {
  const [pda] = PublicKey.findProgramAddressSync(
    [
      Buffer.from('metadata'),
      TOKEN_METADATA_PROGRAM_ID.toBuffer(),
      mint.toBuffer(),
      Buffer.from('edition'),
    ],
    TOKEN_METADATA_PROGRAM_ID
  );
  return pda;
}

/**
 * Invest in a project
 *
 * This creates an investment NFT and transfers USDC to the project escrow.
 * The investmentCount should be fetched from the project account before calling.
 */
export async function invest(
  program: AnyProgram,
  args: {
    projectId: BN;
    amount: BN;
    investorTokenAccount: PublicKey;
    escrowTokenAccount: PublicKey;
    investmentCount: number; // Must be fetched from project.investmentCount
  },
  investor: PublicKey
): Promise<string> {
  const projectPda = getProjectPDA(args.projectId, program.programId);

  // Derive NFT mint PDA using seeds: [NFT_MINT_SEED, project_id, investor, investment_count]
  const [nftMint] = getNftMintPDA(args.projectId, investor, args.investmentCount, program.programId);

  // Derive investment PDA using seeds: [INVESTMENT_SEED, project, nft_mint]
  const investmentPda = getInvestmentPDA(projectPda, nftMint, program.programId);

  // Derive investor's NFT token account (ATA)
  const investorNftAccount = getAssociatedTokenAddressSync(nftMint, investor);

  // Derive Metaplex metadata and master edition PDAs
  const metadataAccount = getMetadataPDA(nftMint);
  const masterEdition = getMasterEditionPDA(nftMint);

  // Derive program authority PDA
  const [programAuthority] = getProgramAuthorityPDA(program.programId);

  // BUG-1 FIX: Derive first milestone PDA (index 0) for state transition when funded
  const firstMilestonePda = getMilestonePDA(projectPda, 0, program.programId);

  // Add compute budget instruction to handle heavy NFT+metadata operations
  // Metaplex NFT minting requires significantly more than the default 200k CU
  return getMethods(program)
    .invest({ amount: args.amount })
    .accounts({
      project: projectPda,
      firstMilestone: firstMilestonePda,
      nftMint: nftMint,
      investment: investmentPda,
      investorNftAccount: investorNftAccount,
      metadataAccount: metadataAccount,
      masterEdition: masterEdition,
      escrowTokenAccount: args.escrowTokenAccount,
      investorTokenAccount: args.investorTokenAccount,
      programAuthority: programAuthority,
      investor,
      tokenProgram: TOKEN_PROGRAM_ID,
      associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
      systemProgram: SystemProgram.programId,
      rent: SYSVAR_RENT_PUBKEY,
      tokenMetadataProgram: TOKEN_METADATA_PROGRAM_ID,
      sysvarInstructions: SYSVAR_INSTRUCTIONS_PUBKEY,
    })
    .preInstructions([
      ComputeBudgetProgram.setComputeUnitLimit({ units: 400_000 }),
    ])
    .rpc();
}

/**
 * Cancel investment within 24-hour cooling-off period
 */
export async function cancelInvestment(
  program: AnyProgram,
  args: {
    projectId: BN;
    nftMint: PublicKey;
    investorNftAccount: PublicKey;
    investorUsdcAccount: PublicKey;
    escrowTokenAccount: PublicKey;
  },
  investor: PublicKey
): Promise<string> {
  const nftMintPubkey = ensurePublicKey(args.nftMint);
  const projectPda = getProjectPDA(args.projectId, program.programId);
  const investmentPda = getInvestmentPDA(projectPda, nftMintPubkey, program.programId);
  const escrowPda = getEscrowPDA(args.projectId, program.programId);

  return getMethods(program)
    .cancelInvestment()
    .accounts({
      investor,
      project: projectPda,
      investment: investmentPda,
      nftMint: nftMintPubkey,
      investorNftAccount: args.investorNftAccount,
      projectEscrow: args.escrowTokenAccount,
      investorUsdcAccount: args.investorUsdcAccount,
      escrowPda,
    })
    .rpc();
}

// =============================================================================
// Pivot Instructions
// =============================================================================

/**
 * Propose a pivot
 */
export async function proposePivot(
  program: AnyProgram,
  args: {
    projectId: BN;
    newMetadataUri: string;
    newMilestones: Array<{ percentage: number; description: string }>;
  },
  founder: PublicKey
): Promise<string> {
  const projectPda = getProjectPDA(args.projectId, program.programId);

  // Fetch project to get current pivot_count
  const projectAccount = await getAccountNamespace(program).project.fetch(projectPda);
  const pivotCount = projectAccount.pivotCount || 0;

  // Derive pivot proposal PDA using pivot_count
  const pivotProposalPda = getPivotProposalPDA(projectPda, pivotCount, program.programId);

  return getMethods(program)
    .proposePivot({
      newMetadataUri: args.newMetadataUri,
      newMilestones: args.newMilestones,
    })
    .accounts({
      project: projectPda,
      founder,
      pivotProposal: pivotProposalPda,
      systemProgram: SystemProgram.programId,
      clock: SYSVAR_CLOCK_PUBKEY,
    })
    .rpc();
}

/**
 * Approve pivot proposal (admin only)
 */
export async function approvePivot(
  program: AnyProgram,
  projectId: BN,
  adminKeypair: Keypair
): Promise<string> {
  const projectPda = getProjectPDA(projectId, program.programId);

  // Fetch project to get the active pivot proposal
  // The active_pivot field contains the actual pivot proposal pubkey
  const projectAccount = await getAccountNamespace(program).project.fetch(projectPda);

  // Use the active_pivot directly if available, otherwise derive from pivot_count
  let pivotProposalPda: PublicKey;
  if (projectAccount.activePivot) {
    pivotProposalPda = projectAccount.activePivot;
  } else {
    // Fallback to deriving from pivot_count (pivot_count is NOT incremented until finalize)
    const pivotCount = projectAccount.pivotCount || 0;
    pivotProposalPda = getPivotProposalPDA(projectPda, pivotCount, program.programId);
  }

  return getMethods(program)
    .approvePivot()
    .accounts({
      moderator: adminKeypair.publicKey,
      project: projectPda,
      pivotProposal: pivotProposalPda,
    })
    .signers([adminKeypair])
    .rpc();
}

/**
 * Withdraw from pivot during 7-day window
 */
export async function withdrawFromPivot(
  program: AnyProgram,
  args: {
    projectId: BN;
    pivotCount: number; // Current pivot_count from project
    nftMint: PublicKey;
    investorTokenAccount: PublicKey;
    escrowTokenAccount: PublicKey;
    milestoneAccounts: PublicKey[]; // All milestone PDAs for calculating unreleased funds
  },
  investor: PublicKey
): Promise<string> {
  const nftMintPubkey = ensurePublicKey(args.nftMint);
  const projectPda = getProjectPDA(args.projectId, program.programId);
  const investmentPda = getInvestmentPDA(projectPda, nftMintPubkey, program.programId);
  const escrowPda = getEscrowPDA(args.projectId, program.programId);
  // Active pivot is at pivotCount (incremented only AFTER finalization)
  const pivotProposalPda = getPivotProposalPDA(projectPda, args.pivotCount, program.programId);
  // Get investor's NFT token account (ATA)
  const investorNftAccount = getAssociatedTokenAddressSync(
    nftMintPubkey,
    investor,
    false,
    TOKEN_PROGRAM_ID
  );

  // Pass milestone accounts as remaining accounts for unreleased funds calculation
  const remainingAccounts = args.milestoneAccounts.map((pubkey) => ({
    pubkey: ensurePublicKey(pubkey),
    isSigner: false,
    isWritable: false,
  }));

  return getMethods(program)
    .withdrawFromPivot()
    .accounts({
      investor,
      project: projectPda,
      pivotProposal: pivotProposalPda,
      investment: investmentPda,
      nftMint: nftMintPubkey,
      investorNftAccount,
      escrowTokenAccount: args.escrowTokenAccount,
      investorTokenAccount: args.investorTokenAccount,
      escrow: escrowPda,
    })
    .remainingAccounts(remainingAccounts)
    .rpc();
}

/**
 * Finalize pivot after 7-day window
 *
 * IMPORTANT: When old_milestone_count == new_milestone_count, the milestone PDAs are
 * the same and get reinitialized in-place. In this case, only pass the milestone
 * accounts once (not twice as old+new).
 */
export async function finalizePivot(
  program: AnyProgram,
  args: {
    projectId: BN;
    pivotCount: number; // Current pivot_count from project (active pivot is at pivotCount)
    milestoneAccounts: PublicKey[]; // All milestone PDAs (reused when old_count == new_count)
  },
  authority: PublicKey
): Promise<string> {
  const projectPda = getProjectPDA(args.projectId, program.programId);
  // Active pivot is at pivotCount (incremented only AFTER finalization)
  const pivotProposalPda = getPivotProposalPDA(projectPda, args.pivotCount, program.programId);

  // Pass milestone accounts as remaining accounts
  // When old_count == new_count, these are reinitialized in-place
  const remainingAccounts = args.milestoneAccounts.map((pubkey) => ({
    pubkey,
    isSigner: false,
    isWritable: true,
  }));

  return getMethods(program)
    .finalizePivot()
    .accounts({
      authority,
      project: projectPda,
      pivotProposal: pivotProposalPda,
    })
    .remainingAccounts(remainingAccounts)
    .rpc();
}

// =============================================================================
// TGE Instructions
// =============================================================================

/**
 * Set TGE date and token mint
 */
export async function setTgeDate(
  program: AnyProgram,
  args: {
    projectId: BN;
    tgeDate: BN;
    tokenMint: PublicKey;
  },
  founder: PublicKey
): Promise<string> {
  const projectPda = getProjectPDA(args.projectId, program.programId);

  return getMethods(program)
    .setTgeDate({
      tgeDate: args.tgeDate,
      tokenMint: args.tokenMint,
    })
    .accounts({
      project: projectPda,
      founder,
    })
    .rpc();
}

/**
 * Deposit tokens for investor distribution
 */
export async function depositTokens(
  program: AnyProgram,
  args: {
    projectId: BN;
    amount: BN;
    tokenMint: PublicKey;
    founderTokenAccount: PublicKey;
  },
  founder: PublicKey
): Promise<string> {
  const projectPda = getProjectPDA(args.projectId, program.programId);

  return getMethods(program)
    .depositTokens({ amount: args.amount })
    .accounts({
      project: projectPda,
      tokenMint: args.tokenMint,
      founderTokenAccount: args.founderTokenAccount,
      founder,
    })
    .rpc();
}

/**
 * Claim project tokens using Investment NFT
 */
export async function claimTokens(
  program: AnyProgram,
  args: {
    projectId: BN;
    nftMint: PublicKey;
    investorNftAccount: PublicKey;
    investorTokenAccount: PublicKey;
    projectTokenVault: PublicKey;
  },
  investor: PublicKey
): Promise<string> {
  const projectPda = getProjectPDA(args.projectId, program.programId);
  const investmentPda = getInvestmentPDA(projectPda, args.nftMint, program.programId);
  const tokenVaultPda = getTokenVaultPDA(projectPda, program.programId);

  return getMethods(program)
    .claimTokens()
    .accounts({
      investor,
      project: projectPda,
      investment: investmentPda,
      investorNftAccount: args.investorNftAccount,
      projectTokenVault: args.projectTokenVault,
      investorTokenAccount: args.investorTokenAccount,
      tokenVaultPda,
      tokenProgram: TOKEN_PROGRAM_ID,
    })
    .rpc();
}

/**
 * Report scam during 30-day post-TGE window
 */
export async function reportScam(
  program: AnyProgram,
  args: {
    projectId: BN;
    nftMint: PublicKey;
  },
  reporter: PublicKey
): Promise<string> {
  const projectPda = getProjectPDA(args.projectId, program.programId);
  const tgeEscrowPda = getTgeEscrowPDA(projectPda, program.programId);
  const investmentPda = getInvestmentPDA(projectPda, args.nftMint, program.programId);

  return getMethods(program)
    .reportScam()
    .accounts({
      tgeEscrow: tgeEscrowPda,
      project: projectPda,
      investment: investmentPda,
      nftMint: args.nftMint,
      reporter,
    })
    .rpc();
}

/**
 * Release 10% holdback to founder after 30 days
 */
export async function releaseHoldback(
  program: AnyProgram,
  args: {
    projectId: BN;
    founderTokenAccount: PublicKey;
  }
): Promise<string> {
  const projectPda = getProjectPDA(args.projectId, program.programId);
  const tgeEscrowPda = getTgeEscrowPDA(projectPda, program.programId);

  return getMethods(program)
    .releaseHoldback()
    .accounts({
      tgeEscrow: tgeEscrowPda,
      project: projectPda,
      founderTokenAccount: args.founderTokenAccount,
    })
    .rpc();
}

// =============================================================================
// Abandonment Instructions
// =============================================================================

/**
 * Check for abandonment (90 days inactivity)
 */
export async function checkAbandonment(
  program: AnyProgram,
  projectId: BN,
  milestoneIndex: number = 0
): Promise<string> {
  const projectPda = getProjectPDA(projectId, program.programId);
  const milestonePda = getMilestonePDA(projectPda, milestoneIndex, program.programId);

  return getMethods(program)
    .checkAbandonment()
    .accounts({
      project: projectPda,
      milestone: milestonePda,
    })
    .rpc();
}

/**
 * Claim refund after abandonment
 *
 * @param milestoneCount - Number of milestones in the project (used to derive milestone PDAs for remainingAccounts)
 *                         The program calculates unreleased funds by iterating through milestone accounts.
 */
export async function claimRefund(
  program: AnyProgram,
  args: {
    projectId: BN;
    nftMint: PublicKey;
    investorNftAccount: PublicKey;
    investorUsdcAccount: PublicKey;
    escrowTokenAccount: PublicKey;
    milestoneCount?: number; // If not provided, defaults to 1
  },
  investor: PublicKey
): Promise<string> {
  const nftMintPubkey = ensurePublicKey(args.nftMint);
  const projectPda = getProjectPDA(args.projectId, program.programId);
  const investmentPda = getInvestmentPDA(projectPda, nftMintPubkey, program.programId);

  // Derive milestone PDAs and pass as remainingAccounts
  // The program iterates through these to calculate unreleased funds
  const milestoneCount = args.milestoneCount ?? 1;
  const remainingAccounts = [];
  for (let i = 0; i < milestoneCount; i++) {
    const milestonePda = getMilestonePDA(projectPda, i, program.programId);
    remainingAccounts.push({
      pubkey: milestonePda,
      isWritable: false,
      isSigner: false,
    });
  }

  return getMethods(program)
    .claimRefund()
    .accounts({
      project: projectPda,
      investment: investmentPda,
      nftMint: nftMintPubkey,
      investorNftAccount: args.investorNftAccount,
      investor,
      investorTokenAccount: args.investorUsdcAccount,
      escrowTokenAccount: args.escrowTokenAccount,
    })
    .remainingAccounts(remainingAccounts)
    .rpc();
}

// =============================================================================
// ZTM v2.0 Token Distribution Instructions
// =============================================================================

/**
 * Claim investor tokens from a passed milestone (whitepaper: manual claim model)
 *
 * ZTM v2.0: Per whitepaper, investors manually claim their tokens after a milestone passes.
 * This replaces the batch distribution model with investor-initiated per-NFT claims.
 *
 * @param milestoneIndex - The milestone index to claim tokens from
 * @param nftMint - The NFT mint that proves investment ownership
 * @param investorTokenAccount - Investor's token account to receive claimed tokens
 */
export async function claimInvestorTokens(
  program: AnyProgram,
  args: {
    projectId: BN;
    /** Milestone index to claim tokens from */
    milestoneIndex: number;
    /** NFT mint that proves investment ownership */
    nftMint: PublicKey;
    /** Investor's token account to receive claimed tokens */
    investorTokenAccount: PublicKey;
  },
  investor: PublicKey
): Promise<string> {
  const nftMintPubkey = ensurePublicKey(args.nftMint);
  const projectPda = getProjectPDA(args.projectId, program.programId);
  const tokenVaultPda = getTokenVaultPDA(projectPda, program.programId);
  const investmentPda = getInvestmentPDA(projectPda, nftMintPubkey, program.programId);
  const investorVaultPda = getInvestorVaultPDA(projectPda, program.programId);
  const vaultAuthorityPda = getVaultAuthorityPDA(projectPda, program.programId);

  // Get investor's NFT token account (ATA)
  const investorNftAccount = getAssociatedTokenAddressSync(
    nftMintPubkey,
    investor,
    false,
    TOKEN_PROGRAM_ID
  );

  return getMethods(program)
    .claimInvestorTokens({ milestoneIndex: args.milestoneIndex })
    .accounts({
      investor,
      project: projectPda,
      tokenVault: tokenVaultPda,
      investment: investmentPda,
      nftMint: nftMintPubkey,
      investorNftAccount,
      investorVault: investorVaultPda,
      investorTokenAccount: args.investorTokenAccount,
      vaultAuthority: vaultAuthorityPda,
      tokenProgram: TOKEN_PROGRAM_ID,
    })
    .rpc();
}

/**
 * Distribute tokens to NFT holders for a milestone
 *
 * ZTM v2.0: Called by cranker after finalize_voting sets distribution_pending = true.
 * Processes batch of investments, transferring unlocked tokens to NFT holders.
 *
 * @deprecated Use claimInvestorTokens instead (whitepaper manual claim model)
 *
 * @param investments - Array of { investmentPda, investorTokenAccount } pairs
 *   Each pair represents an investor's investment and their token account to receive tokens.
 *   Max batch size: 10 investments per call.
 */
export async function distributeTokens(
  program: AnyProgram,
  args: {
    projectId: BN;
    milestoneIndex: number;
    /** Investment and token account pairs to process */
    investments: Array<{
      investmentPda: PublicKey;
      investorTokenAccount: PublicKey;
    }>;
  },
  payer: PublicKey
): Promise<string> {
  const projectPda = getProjectPDA(args.projectId, program.programId);
  const tokenVaultPda = getTokenVaultPDA(projectPda, program.programId);
  const investorVaultPda = getInvestorVaultPDA(projectPda, program.programId);
  const vaultAuthorityPda = getVaultAuthorityPDA(projectPda, program.programId);

  // Build remaining accounts: (Investment, TokenAccount) pairs
  const remainingAccounts = args.investments.flatMap((inv) => [
    { pubkey: inv.investmentPda, isSigner: false, isWritable: true },
    { pubkey: inv.investorTokenAccount, isSigner: false, isWritable: true },
  ]);

  return getMethods(program)
    .distributeTokens({ milestoneIndex: args.milestoneIndex })
    .accounts({
      project: projectPda,
      tokenVault: tokenVaultPda,
      investorVault: investorVaultPda,
      vaultAuthority: vaultAuthorityPda,
      payer,
      tokenProgram: TOKEN_PROGRAM_ID,
    })
    .remainingAccounts(remainingAccounts)
    .rpc();
}

/**
 * Complete token distribution for a milestone
 *
 * ZTM v2.0: Marks distribution as complete after all batches have been processed.
 * Permissionless - anyone can call this to finalize a distribution.
 */
export async function completeDistribution(
  program: AnyProgram,
  args: {
    projectId: BN;
    milestoneIndex: number;
  },
  payer: PublicKey
): Promise<string> {
  const projectPda = getProjectPDA(args.projectId, program.programId);
  const tokenVaultPda = getTokenVaultPDA(projectPda, program.programId);

  return getMethods(program)
    .completeDistribution({ milestoneIndex: args.milestoneIndex })
    .accounts({
      project: projectPda,
      tokenVault: tokenVaultPda,
      payer,
    })
    .rpc();
}

// =============================================================================
// Exit Window Instructions
// =============================================================================

/**
 * Claim exit window refund during 3-failure voluntary exit window
 * Per whitepaper: 3 consecutive failures trigger 7-day voluntary exit window
 * Investors can claim proportional share of unreleased USDC escrow funds
 */
export async function claimExitWindowRefund(
  program: AnyProgram,
  args: {
    projectId: BN;
    nftMint: PublicKey;
    investorNftAccount: PublicKey;
    escrowTokenAccount: PublicKey;
    investorTokenAccount: PublicKey;
    milestoneAccounts?: PublicKey[];
  },
  investor: PublicKey
): Promise<string> {
  const projectPda = getProjectPDA(args.projectId, program.programId);
  const investmentPda = getInvestmentPDA(projectPda, args.nftMint, program.programId);
  const escrowPda = getEscrowPDA(args.projectId, program.programId);

  const remainingAccounts = (args.milestoneAccounts || []).map((pubkey) => ({
    pubkey,
    isSigner: false,
    isWritable: false,
  }));

  return getMethods(program)
    .claimExitWindowRefund()
    .accountsPartial({
      project: projectPda,
      investment: investmentPda,
      nftMint: args.nftMint,
      investorNftAccount: args.investorNftAccount,
      escrowTokenAccount: args.escrowTokenAccount,
      investorTokenAccount: args.investorTokenAccount,
      escrowPda,
      investor,
    })
    .remainingAccounts(remainingAccounts)
    .rpc();
}

// =============================================================================
// ZTM v2.0 Founder Vesting Instructions
// =============================================================================

/**
 * Initialize founder vesting after MAE (Market Access Event)
 *
 * ZTM v2.0: Creates FounderVesting PDA with vesting schedule from Tokenomics.
 * Must be called after project reaches Completed state (all milestones done).
 * Permissionless - anyone can pay to initialize.
 */
export async function initializeFounderVesting(
  program: AnyProgram,
  args: {
    projectId: BN;
  },
  payer: PublicKey
): Promise<string> {
  const projectPda = getProjectPDA(args.projectId, program.programId);
  const tokenomicsPda = getTokenomicsPDA(projectPda, program.programId);
  const tokenVaultPda = getTokenVaultPDA(projectPda, program.programId);
  const founderVestingPda = getFounderVestingPDA(projectPda, program.programId);

  return getMethods(program)
    .initializeFounderVesting()
    .accounts({
      project: projectPda,
      tokenomics: tokenomicsPda,
      tokenVault: tokenVaultPda,
      founderVesting: founderVestingPda,
      payer,
      systemProgram: SystemProgram.programId,
    })
    .rpc();
}

/**
 * Claim vested tokens from founder vault
 *
 * ZTM v2.0: Founder claims tokens based on linear vesting schedule.
 * Requires cliff period to pass before any tokens can be claimed.
 */
export async function claimVestedTokens(
  program: AnyProgram,
  args: {
    projectId: BN;
    /** Founder's token account to receive vested tokens */
    founderTokenAccount: PublicKey;
  },
  founder: PublicKey
): Promise<string> {
  const projectPda = getProjectPDA(args.projectId, program.programId);
  const tokenVaultPda = getTokenVaultPDA(projectPda, program.programId);
  const founderVestingPda = getFounderVestingPDA(projectPda, program.programId);
  const founderVaultPda = getFounderVaultPDA(projectPda, program.programId);
  const vaultAuthorityPda = getVaultAuthorityPDA(projectPda, program.programId);

  return getMethods(program)
    .claimVestedTokens()
    .accounts({
      project: projectPda,
      tokenVault: tokenVaultPda,
      founderVesting: founderVestingPda,
      founderVault: founderVaultPda,
      vaultAuthority: vaultAuthorityPda,
      founderTokenAccount: args.founderTokenAccount,
      founder,
      tokenProgram: TOKEN_PROGRAM_ID,
    })
    .rpc();
}

// =============================================================================
// ZTM v2.0 Circuit Breaker Instructions
// =============================================================================

/**
 * Force complete a stuck distribution (admin only)
 *
 * ZTM v2.0: Circuit breaker for when token distribution is stuck for >7 days.
 * Marks distribution as complete so project can continue.
 * Affected investors can use claimMissedUnlock to get their tokens.
 */
export async function forceCompleteDistribution(
  program: AnyProgram,
  args: {
    projectId: BN;
  },
  adminKeypair: Keypair
): Promise<string> {
  const projectPda = getProjectPDA(args.projectId, program.programId);
  const tokenVaultPda = getTokenVaultPDA(projectPda, program.programId);
  const adminConfigPda = getAdminConfigPDA(program.programId);

  return getMethods(program)
    .forceCompleteDistribution()
    .accounts({
      admin: adminKeypair.publicKey,
      adminConfig: adminConfigPda,
      project: projectPda,
      tokenVault: tokenVaultPda,
    })
    .signers([adminKeypair])
    .rpc();
}

/**
 * Claim missed token unlock after force-complete distribution
 *
 * ZTM v2.0: Allows investors to claim tokens they missed during a stuck
 * distribution that was force-completed by admin.
 */
export async function claimMissedUnlock(
  program: AnyProgram,
  args: {
    projectId: BN;
    nftMint: PublicKey;
    /** Milestone index to claim for */
    milestoneIndex: number;
    /** Claimer's token account to receive tokens */
    claimerTokenAccount: PublicKey;
  },
  claimer: PublicKey
): Promise<string> {
  const nftMintPubkey = ensurePublicKey(args.nftMint);
  const projectPda = getProjectPDA(args.projectId, program.programId);
  const tokenVaultPda = getTokenVaultPDA(projectPda, program.programId);
  const investmentPda = getInvestmentPDA(projectPda, nftMintPubkey, program.programId);
  const investorVaultPda = getInvestorVaultPDA(projectPda, program.programId);
  const vaultAuthorityPda = getVaultAuthorityPDA(projectPda, program.programId);

  // Get claimer's NFT token account (ATA)
  const claimerNftAccount = getAssociatedTokenAddressSync(
    nftMintPubkey,
    claimer,
    false,
    TOKEN_PROGRAM_ID
  );

  return getMethods(program)
    .claimMissedUnlock({ milestoneIndex: args.milestoneIndex })
    .accounts({
      claimer,
      project: projectPda,
      tokenVault: tokenVaultPda,
      investment: investmentPda,
      nftMint: nftMintPubkey,
      claimerNftAccount,
      investorVault: investorVaultPda,
      claimerTokenAccount: args.claimerTokenAccount,
      vaultAuthority: vaultAuthorityPda,
      tokenProgram: TOKEN_PROGRAM_ID,
    })
    .rpc();
}
