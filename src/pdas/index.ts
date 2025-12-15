/**
 * Raise PDA Derivation Helpers
 *
 * All PDA derivation functions for the Raise program.
 * PDAs are deterministic addresses derived from seeds and program ID.
 */

import { PublicKey } from '@solana/web3.js';
import { BN } from '@coral-xyz/anchor';
import { SEEDS } from '../constants/index.js';

/**
 * Ensure value is a proper BN instance
 * This handles cases where BN objects lose their prototype chain
 * (e.g., when passing through React state or JSON serialization)
 *
 * Uses duck typing instead of instanceof to handle different BN module instances
 */
function ensureBN(value: BN | number | string | { toString(): string }): BN {
  // Duck typing: if it has toArrayLike, it's BN-like and we can use it
  if (value && typeof (value as BN).toArrayLike === 'function') {
    return value as BN;
  }
  // Always create a fresh BN from the SDK's imported BN class
  return new BN(String(value));
}

/**
 * Derive Project PDA from project ID
 *
 * @param projectId - Unique project identifier
 * @param programId - Raise program ID
 * @returns Project account PDA
 */
export function getProjectPDA(projectId: BN | number | string, programId: PublicKey): PublicKey {
  const projectIdBN = ensureBN(projectId);
  const [pda] = PublicKey.findProgramAddressSync(
    [Buffer.from(SEEDS.PROJECT), projectIdBN.toArrayLike(Buffer, 'le', 8)],
    programId
  );
  return pda;
}

/**
 * Derive Escrow PDA from project ID
 *
 * @param projectId - Project identifier
 * @param programId - Raise program ID
 * @returns Escrow account PDA
 */
export function getEscrowPDA(projectId: BN | number | string, programId: PublicKey): PublicKey {
  const projectIdBN = ensureBN(projectId);
  const [pda] = PublicKey.findProgramAddressSync(
    [Buffer.from(SEEDS.ESCROW), projectIdBN.toArrayLike(Buffer, 'le', 8)],
    programId
  );
  return pda;
}

/**
 * Derive Milestone PDA from project PDA and milestone index
 *
 * @param projectPda - Project account PDA
 * @param milestoneIndex - Milestone index (0-based)
 * @param programId - Raise program ID
 * @returns Milestone account PDA
 */
export function getMilestonePDA(
  projectPda: PublicKey,
  milestoneIndex: number,
  programId: PublicKey
): PublicKey {
  const [pda] = PublicKey.findProgramAddressSync(
    [
      Buffer.from(SEEDS.MILESTONE),
      projectPda.toBuffer(),
      Buffer.from([milestoneIndex]),
    ],
    programId
  );
  return pda;
}

/**
 * Derive Investment PDA from project PDA and NFT mint
 *
 * @param projectPda - Project account PDA
 * @param nftMint - Investment NFT mint address
 * @param programId - Raise program ID
 * @returns Investment account PDA
 */
export function getInvestmentPDA(
  projectPda: PublicKey,
  nftMint: PublicKey,
  programId: PublicKey
): PublicKey {
  const [pda] = PublicKey.findProgramAddressSync(
    [
      Buffer.from(SEEDS.INVESTMENT),
      projectPda.toBuffer(),
      nftMint.toBuffer(),
    ],
    programId
  );
  return pda;
}

/**
 * Derive Vote PDA from milestone PDA, voter key, and voting round
 *
 * @param milestonePda - Milestone account PDA
 * @param voterKey - Voter's public key
 * @param votingRound - Current voting round (0 initially, incremented on resubmit)
 * @param programId - Raise program ID
 * @returns Vote account PDA
 */
export function getVotePDA(
  milestonePda: PublicKey,
  voterKey: PublicKey,
  votingRound: number,
  programId: PublicKey
): PublicKey {
  const [pda] = PublicKey.findProgramAddressSync(
    [Buffer.from(SEEDS.VOTE), milestonePda.toBuffer(), voterKey.toBuffer(), Buffer.from([votingRound])],
    programId
  );
  return pda;
}

/**
 * Derive PivotProposal PDA from project PDA and pivot count
 *
 * @param projectPda - Project account PDA
 * @param pivotCount - Current pivot count from project account
 * @param programId - Raise program ID
 * @returns PivotProposal account PDA
 */
export function getPivotProposalPDA(
  projectPda: PublicKey,
  pivotCount: number,
  programId: PublicKey
): PublicKey {
  const [pda] = PublicKey.findProgramAddressSync(
    [
      Buffer.from(SEEDS.PIVOT), // Use PIVOT seed, not PIVOT_PROPOSAL
      projectPda.toBuffer(),
      Buffer.from([pivotCount]), // pivot_count is u8 (1 byte) on-chain
    ],
    programId
  );
  return pda;
}

/**
 * Derive TgeEscrow PDA from project PDA
 *
 * @param projectPda - Project account PDA
 * @param programId - Raise program ID
 * @returns TgeEscrow account PDA
 */
export function getTgeEscrowPDA(
  projectPda: PublicKey,
  programId: PublicKey
): PublicKey {
  const [pda] = PublicKey.findProgramAddressSync(
    [Buffer.from(SEEDS.TGE_ESCROW), projectPda.toBuffer()],
    programId
  );
  return pda;
}

/**
 * Derive TgeEscrowVault PDA from project PDA
 * Used for holding 10% USDC holdback from final milestone
 *
 * @param projectPda - Project account PDA
 * @param programId - Raise program ID
 * @returns TgeEscrowVault PDA
 */
export function getTgeEscrowVaultPDA(
  projectPda: PublicKey,
  programId: PublicKey
): PublicKey {
  const [pda] = PublicKey.findProgramAddressSync(
    [Buffer.from(SEEDS.TGE_ESCROW_VAULT), projectPda.toBuffer()],
    programId
  );
  return pda;
}

/**
 * Derive TokenVault PDA from project PDA
 * Used for holding project tokens for investor distribution
 *
 * @param projectPda - Project account PDA
 * @param programId - Raise program ID
 * @returns TokenVault PDA
 */
export function getTokenVaultPDA(
  projectPda: PublicKey,
  programId: PublicKey
): PublicKey {
  const [pda] = PublicKey.findProgramAddressSync(
    [Buffer.from('token_vault'), projectPda.toBuffer()],
    programId
  );
  return pda;
}

/**
 * Derive ScamReport PDA from project PDA and NFT mint
 *
 * @param projectPda - Project account PDA
 * @param nftMint - Reporter's NFT mint address
 * @param programId - Raise program ID
 * @returns ScamReport account PDA
 */
export function getScamReportPDA(
  projectPda: PublicKey,
  nftMint: PublicKey,
  programId: PublicKey
): PublicKey {
  const [pda] = PublicKey.findProgramAddressSync(
    [
      Buffer.from(SEEDS.SCAM_REPORT),
      projectPda.toBuffer(),
      nftMint.toBuffer(),
    ],
    programId
  );
  return pda;
}

/**
 * Derive AdminConfig PDA (global admin authority)
 *
 * @param programId - Raise program ID
 * @returns AdminConfig account PDA
 */
export function getAdminConfigPDA(programId: PublicKey): PublicKey {
  const [pda] = PublicKey.findProgramAddressSync(
    [Buffer.from(SEEDS.ADMIN_CONFIG)],
    programId
  );
  return pda;
}

/**
 * Derive NFT Mint PDA
 *
 * @param projectId - Project identifier
 * @param investor - Investor's public key
 * @param investmentCount - Investment count (u64 in Rust, 8 bytes LE)
 * @param programId - Raise program ID
 * @returns NFT Mint PDA and bump
 */
export function getNftMintPDA(
  projectId: BN | number | string,
  investor: PublicKey,
  investmentCount: BN | number,
  programId: PublicKey
): [PublicKey, number] {
  // Ensure both values are proper BN instances (handles prototype chain issues)
  const projectIdBN = ensureBN(projectId);
  const countBN = ensureBN(investmentCount);
  return PublicKey.findProgramAddressSync(
    [
      Buffer.from(SEEDS.NFT_MINT),
      projectIdBN.toArrayLike(Buffer, 'le', 8),
      investor.toBuffer(),
      countBN.toArrayLike(Buffer, 'le', 8), // u64 is 8 bytes LE
    ],
    programId
  );
}

/**
 * Derive Program Authority PDA
 *
 * @param programId - Raise program ID
 * @returns Program authority PDA and bump
 */
export function getProgramAuthorityPDA(programId: PublicKey): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [Buffer.from(SEEDS.AUTHORITY)],
    programId
  );
}

/**
 * Helper to derive all PDAs for a project
 *
 * @param projectId - Project identifier
 * @param programId - Raise program ID
 * @returns Object with project and escrow PDAs
 */
export function getProjectPDAs(projectId: BN, programId: PublicKey) {
  const project = getProjectPDA(projectId, programId);
  const escrow = getEscrowPDA(projectId, programId);
  return { project, escrow };
}

// =============================================================================
// ZTM v2.0 PDAs
// =============================================================================

/**
 * Derive Tokenomics PDA from project PDA
 */
export function getTokenomicsPDA(projectPda: PublicKey, programId: PublicKey): PublicKey {
  const [pda] = PublicKey.findProgramAddressSync(
    [Buffer.from('tokenomics'), projectPda.toBuffer()],
    programId
  );
  return pda;
}

/**
 * Derive Token Mint PDA from project PDA
 */
export function getTokenMintPDA(projectPda: PublicKey, programId: PublicKey): PublicKey {
  const [pda] = PublicKey.findProgramAddressSync(
    [Buffer.from('token_mint'), projectPda.toBuffer()],
    programId
  );
  return pda;
}

/**
 * Derive Vault Authority PDA from project PDA
 */
export function getVaultAuthorityPDA(projectPda: PublicKey, programId: PublicKey): PublicKey {
  const [pda] = PublicKey.findProgramAddressSync(
    [Buffer.from('vault_authority'), projectPda.toBuffer()],
    programId
  );
  return pda;
}

/**
 * Derive Investor Vault PDA from project PDA
 */
export function getInvestorVaultPDA(projectPda: PublicKey, programId: PublicKey): PublicKey {
  const [pda] = PublicKey.findProgramAddressSync(
    [Buffer.from('investor_vault'), projectPda.toBuffer()],
    programId
  );
  return pda;
}

/**
 * Derive Founder Vault PDA from project PDA
 */
export function getFounderVaultPDA(projectPda: PublicKey, programId: PublicKey): PublicKey {
  const [pda] = PublicKey.findProgramAddressSync(
    [Buffer.from('founder_vault'), projectPda.toBuffer()],
    programId
  );
  return pda;
}

/**
 * Derive LP Token Vault PDA from project PDA
 */
export function getLpTokenVaultPDA(projectPda: PublicKey, programId: PublicKey): PublicKey {
  const [pda] = PublicKey.findProgramAddressSync(
    [Buffer.from('lp_token_vault'), projectPda.toBuffer()],
    programId
  );
  return pda;
}

/**
 * Derive Treasury Vault PDA from project PDA
 */
export function getTreasuryVaultPDA(projectPda: PublicKey, programId: PublicKey): PublicKey {
  const [pda] = PublicKey.findProgramAddressSync(
    [Buffer.from('treasury_vault'), projectPda.toBuffer()],
    programId
  );
  return pda;
}

/**
 * Derive LP USDC Vault PDA from project PDA
 */
export function getLpUsdcVaultPDA(projectPda: PublicKey, programId: PublicKey): PublicKey {
  const [pda] = PublicKey.findProgramAddressSync(
    [Buffer.from('lp_usdc_vault'), projectPda.toBuffer()],
    programId
  );
  return pda;
}

/**
 * Derive Founder Vesting PDA from project PDA
 */
export function getFounderVestingPDA(projectPda: PublicKey, programId: PublicKey): PublicKey {
  const [pda] = PublicKey.findProgramAddressSync(
    [Buffer.from('founder_vesting'), projectPda.toBuffer()],
    programId
  );
  return pda;
}
