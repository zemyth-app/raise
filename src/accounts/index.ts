/**
 * Raise Account Fetchers
 *
 * Functions to fetch and decode program accounts.
 */

import { Program, BN } from '@coral-xyz/anchor';
import { PublicKey } from '@solana/web3.js';
import {
  getProjectPDA,
  getMilestonePDA,
  getInvestmentPDA,
  getVotePDA,
  getPivotProposalPDA,
  getTgeEscrowPDA,
  getAdminConfigPDA,
} from '../pdas/index.js';
import type { InvestmentWithKey, MilestoneWithKey, VoteWithKey } from '../types/index.js';

// Generic type for any Anchor program
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyProgram = Program<any>;

// Helper to access account namespace dynamically
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function getAccountNamespace(program: AnyProgram): any {
  return program.account;
}

/**
 * Fetch project account data
 *
 * @param program - Anchor program instance
 * @param projectId - Project identifier
 * @returns Project account data or null if not found
 */
export async function fetchProject(
  program: AnyProgram,
  projectId: BN
) {
  try {
    const projectPda = getProjectPDA(projectId, program.programId);
    return await getAccountNamespace(program).project.fetch(projectPda);
  } catch (error) {
    if (error instanceof Error && error.message?.includes('Account does not exist')) {
      return null;
    }
    throw error;
  }
}

/**
 * Fetch project account by PDA
 *
 * @param program - Anchor program instance
 * @param projectPda - Project account PDA
 * @returns Project account data or null if not found
 */
export async function fetchProjectByPda(
  program: AnyProgram,
  projectPda: PublicKey
) {
  try {
    return await getAccountNamespace(program).project.fetch(projectPda);
  } catch (error) {
    if (error instanceof Error && error.message?.includes('Account does not exist')) {
      return null;
    }
    throw error;
  }
}

/**
 * Fetch milestone account data
 *
 * @param program - Anchor program instance
 * @param projectId - Project identifier
 * @param milestoneIndex - Milestone index
 * @returns Milestone account data or null if not found
 */
export async function fetchMilestone(
  program: AnyProgram,
  projectId: BN,
  milestoneIndex: number
) {
  try {
    const projectPda = getProjectPDA(projectId, program.programId);
    const milestonePda = getMilestonePDA(projectPda, milestoneIndex, program.programId);
    return await getAccountNamespace(program).milestone.fetch(milestonePda);
  } catch (error) {
    if (error instanceof Error && error.message?.includes('Account does not exist')) {
      return null;
    }
    throw error;
  }
}

/**
 * Fetch all milestones for a project
 *
 * @param program - Anchor program instance
 * @param projectId - Project identifier
 * @returns Array of milestone accounts with their public keys
 */
export async function fetchAllMilestones(
  program: AnyProgram,
  projectId: BN
): Promise<MilestoneWithKey[]> {
  const projectPda = getProjectPDA(projectId, program.programId);

  const milestones = await getAccountNamespace(program).milestone.all([
    {
      memcmp: {
        offset: 8, // Skip discriminator
        bytes: projectPda.toBase58(),
      },
    },
  ]);

  return milestones.map((m: { publicKey: PublicKey; account: unknown }) => ({
    publicKey: m.publicKey,
    account: m.account,
  })) as MilestoneWithKey[];
}

/**
 * Fetch investment account data
 *
 * @param program - Anchor program instance
 * @param projectId - Project identifier
 * @param nftMint - Investment NFT mint address
 * @returns Investment account data or null if not found
 */
export async function fetchInvestment(
  program: AnyProgram,
  projectId: BN,
  nftMint: PublicKey
) {
  try {
    const projectPda = getProjectPDA(projectId, program.programId);
    const investmentPda = getInvestmentPDA(projectPda, nftMint, program.programId);
    return await getAccountNamespace(program).investment.fetch(investmentPda);
  } catch (error) {
    if (error instanceof Error && error.message?.includes('Account does not exist')) {
      return null;
    }
    throw error;
  }
}

/**
 * Fetch all investments for a project
 *
 * @param program - Anchor program instance
 * @param projectId - Project identifier
 * @returns Array of investment accounts with their public keys
 */
export async function fetchAllInvestments(
  program: AnyProgram,
  projectId: BN
): Promise<InvestmentWithKey[]> {
  const projectPda = getProjectPDA(projectId, program.programId);

  const investments = await getAccountNamespace(program).investment.all([
    {
      memcmp: {
        offset: 8, // Skip discriminator
        bytes: projectPda.toBase58(),
      },
    },
  ]);

  return investments.map((inv: { publicKey: PublicKey; account: unknown }) => ({
    publicKey: inv.publicKey,
    account: inv.account,
  })) as InvestmentWithKey[];
}

/**
 * Fetch vote account data
 *
 * @param program - Anchor program instance
 * @param projectId - Project identifier
 * @param milestoneIndex - Milestone index
 * @param voterKey - Voter's public key
 * @param votingRound - Current voting round (0 initially, incremented on resubmit)
 * @returns Vote account data or null if not found
 */
export async function fetchVote(
  program: AnyProgram,
  projectId: BN,
  milestoneIndex: number,
  voterKey: PublicKey,
  votingRound: number
) {
  try {
    const projectPda = getProjectPDA(projectId, program.programId);
    const milestonePda = getMilestonePDA(projectPda, milestoneIndex, program.programId);
    const votePda = getVotePDA(milestonePda, voterKey, votingRound, program.programId);
    return await getAccountNamespace(program).vote.fetch(votePda);
  } catch (error) {
    if (error instanceof Error && error.message?.includes('Account does not exist')) {
      return null;
    }
    throw error;
  }
}

/**
 * Fetch all votes for a milestone
 *
 * @param program - Anchor program instance
 * @param projectId - Project identifier
 * @param milestoneIndex - Milestone index
 * @returns Array of vote accounts with their public keys
 */
export async function fetchAllVotes(
  program: AnyProgram,
  projectId: BN,
  milestoneIndex: number
): Promise<VoteWithKey[]> {
  const projectPda = getProjectPDA(projectId, program.programId);
  const milestonePda = getMilestonePDA(projectPda, milestoneIndex, program.programId);

  const votes = await getAccountNamespace(program).vote.all([
    {
      memcmp: {
        offset: 8, // Skip discriminator
        bytes: milestonePda.toBase58(),
      },
    },
  ]);

  return votes.map((v: { publicKey: PublicKey; account: unknown }) => ({
    publicKey: v.publicKey,
    account: v.account,
  })) as VoteWithKey[];
}

/**
 * Fetch pivot proposal account data
 *
 * @param program - Anchor program instance
 * @param projectId - Project identifier
 * @returns PivotProposal account data or null if not found
 */
export async function fetchPivotProposal(
  program: AnyProgram,
  projectId: BN
) {
  try {
    const projectPda = getProjectPDA(projectId, program.programId);

    // First fetch the project to get the active pivot or pivot_count
    const projectAccount = await getAccountNamespace(program).project.fetch(projectPda);

    // Use active_pivot if available, otherwise derive from pivot_count
    let pivotPda;
    if (projectAccount.activePivot) {
      pivotPda = projectAccount.activePivot;
    } else {
      const pivotCount = projectAccount.pivotCount || 0;
      pivotPda = getPivotProposalPDA(projectPda, pivotCount, program.programId);
    }

    return await getAccountNamespace(program).pivotProposal.fetch(pivotPda);
  } catch (error) {
    if (error instanceof Error && error.message?.includes('Account does not exist')) {
      return null;
    }
    throw error;
  }
}

/**
 * Fetch TGE escrow account data
 *
 * @param program - Anchor program instance
 * @param projectId - Project identifier
 * @returns TgeEscrow account data or null if not found
 */
export async function fetchTgeEscrow(
  program: AnyProgram,
  projectId: BN
) {
  try {
    const projectPda = getProjectPDA(projectId, program.programId);
    const tgeEscrowPda = getTgeEscrowPDA(projectPda, program.programId);
    return await getAccountNamespace(program).tgeEscrow.fetch(tgeEscrowPda);
  } catch (error) {
    if (error instanceof Error && error.message?.includes('Account does not exist')) {
      return null;
    }
    throw error;
  }
}

/**
 * Fetch admin config account data
 *
 * @param program - Anchor program instance
 * @returns AdminConfig account data
 */
export async function fetchAdminConfig(program: AnyProgram) {
  const adminConfigPda = getAdminConfigPDA(program.programId);
  return await getAccountNamespace(program).adminConfig.fetch(adminConfigPda);
}

/**
 * Check if an account exists
 *
 * @param program - Anchor program instance
 * @param accountType - Account type name
 * @param pda - Account PDA
 * @returns True if account exists
 */
export async function accountExists(
  program: AnyProgram,
  accountType: string,
  pda: PublicKey
): Promise<boolean> {
  try {
    // @ts-expect-error - dynamic account access
    await program.account[accountType].fetch(pda);
    return true;
  } catch {
    return false;
  }
}
