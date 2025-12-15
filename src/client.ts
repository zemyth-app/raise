/**
 * Raise Client
 *
 * Main client class for interacting with the Raise program.
 * Provides a high-level API that wraps the instruction and account modules.
 */

import { Program, AnchorProvider, BN } from '@coral-xyz/anchor';
import { Connection, PublicKey, Keypair } from '@solana/web3.js';

// Import all modules
import * as pdas from './pdas/index.js';
import * as accounts from './accounts/index.js';
import * as instructions from './instructions/index.js';
import type { TierConfig } from './types/index.js';

/**
 * Wallet interface required by the client
 */
export interface Wallet {
  publicKey: PublicKey;
  signTransaction: <T>(tx: T) => Promise<T>;
  signAllTransactions: <T>(txs: T[]) => Promise<T[]>;
}

/**
 * Main client for interacting with the Raise program
 *
 * @example
 * ```typescript
 * import { RaiseClient } from '@raise/sdk';
 *
 * const client = RaiseClient.load(connection, wallet);
 *
 * // Create a project
 * const tx = await client.initializeProject({
 *   projectId: new BN(1),
 *   fundingGoal: new BN(100000000000), // 100,000 USDC
 *   metadataUri: 'https://example.com/project.json',
 * });
 *
 * // Fetch project data
 * const project = await client.fetchProject(new BN(1));
 * ```
 */
export class RaiseClient {
  /**
   * Create a new RaiseClient
   *
   * @param program - Anchor program instance
   * @param provider - Anchor provider
   */
  constructor(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    public readonly program: Program<any>,
    public readonly provider: AnchorProvider
  ) {}

  /**
   * Load a new RaiseClient instance
   *
   * @param connection - Solana connection
   * @param wallet - Wallet instance
   * @param programId - Optional program ID override
   * @returns Initialized RaiseClient
   *
   * @example
   * ```typescript
   * const client = RaiseClient.load(connection, wallet);
   * ```
   */
  static load(
    _connection: Connection,
    _wallet: Wallet,
    _programId?: PublicKey
  ): RaiseClient {
    // Note: In production, you would import the IDL from a generated file
    // For now, we'll need the IDL to be provided or loaded separately
    // This is a placeholder that assumes IDL is available
    throw new Error(
      'RaiseClient.load requires IDL. Use RaiseClient.fromProgram instead, ' +
      'or ensure the IDL is bundled with your application.'
    );
  }

  /**
   * Create client from an existing program instance
   *
   * @param program - Anchor program instance
   * @returns Initialized RaiseClient
   *
   * @example
   * ```typescript
   * import idl from './idl/raise.json';
   *
   * const provider = new AnchorProvider(connection, wallet, {});
   * const program = new Program(idl, provider);
   * const client = RaiseClient.fromProgram(program);
   * ```
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  static fromProgram(program: Program<any>): RaiseClient {
    const provider = program.provider as AnchorProvider;
    return new RaiseClient(program, provider);
  }

  /**
   * Get the program ID
   */
  get programId(): PublicKey {
    return this.program.programId;
  }

  /**
   * Get the connected wallet public key
   */
  get walletPublicKey(): PublicKey {
    return this.provider.wallet.publicKey;
  }

  // ===========================================================================
  // PDA Helpers
  // ===========================================================================

  getProjectPDA(projectId: BN): PublicKey {
    return pdas.getProjectPDA(projectId, this.programId);
  }

  getEscrowPDA(projectId: BN): PublicKey {
    return pdas.getEscrowPDA(projectId, this.programId);
  }

  getMilestonePDA(projectPda: PublicKey, milestoneIndex: number): PublicKey {
    return pdas.getMilestonePDA(projectPda, milestoneIndex, this.programId);
  }

  getInvestmentPDA(projectPda: PublicKey, nftMint: PublicKey): PublicKey {
    return pdas.getInvestmentPDA(projectPda, nftMint, this.programId);
  }

  getVotePDA(milestonePda: PublicKey, voterKey: PublicKey, votingRound: number): PublicKey {
    return pdas.getVotePDA(milestonePda, voterKey, votingRound, this.programId);
  }

  getPivotProposalPDA(projectPda: PublicKey, pivotCount: number): PublicKey {
    return pdas.getPivotProposalPDA(projectPda, pivotCount, this.programId);
  }

  getTgeEscrowPDA(projectPda: PublicKey): PublicKey {
    return pdas.getTgeEscrowPDA(projectPda, this.programId);
  }

  getTgeEscrowVaultPDA(projectPda: PublicKey): PublicKey {
    return pdas.getTgeEscrowVaultPDA(projectPda, this.programId);
  }

  getAdminConfigPDA(): PublicKey {
    return pdas.getAdminConfigPDA(this.programId);
  }

  // ===========================================================================
  // Account Fetchers
  // ===========================================================================

  async fetchProject(projectId: BN) {
    return accounts.fetchProject(this.program, projectId);
  }

  async fetchMilestone(projectId: BN, milestoneIndex: number) {
    return accounts.fetchMilestone(this.program, projectId, milestoneIndex);
  }

  async fetchAllMilestones(projectId: BN) {
    return accounts.fetchAllMilestones(this.program, projectId);
  }

  async fetchInvestment(projectId: BN, nftMint: PublicKey) {
    return accounts.fetchInvestment(this.program, projectId, nftMint);
  }

  async fetchAllInvestments(projectId: BN) {
    return accounts.fetchAllInvestments(this.program, projectId);
  }

  async fetchVote(projectId: BN, milestoneIndex: number, voterKey: PublicKey, votingRound: number) {
    return accounts.fetchVote(this.program, projectId, milestoneIndex, voterKey, votingRound);
  }

  async fetchAllVotes(projectId: BN, milestoneIndex: number) {
    return accounts.fetchAllVotes(this.program, projectId, milestoneIndex);
  }

  async fetchPivotProposal(projectId: BN) {
    return accounts.fetchPivotProposal(this.program, projectId);
  }

  async fetchTgeEscrow(projectId: BN) {
    return accounts.fetchTgeEscrow(this.program, projectId);
  }

  async fetchAdminConfig() {
    return accounts.fetchAdminConfig(this.program);
  }

  // ===========================================================================
  // Admin Instructions
  // ===========================================================================

  async initializeAdmin(admin: PublicKey): Promise<string> {
    return instructions.initializeAdmin(
      this.program,
      admin,
      this.walletPublicKey
    );
  }

  async transferAdmin(newAdmin: PublicKey, adminKeypair: Keypair): Promise<string> {
    return instructions.transferAdmin(
      this.program,
      adminKeypair,
      newAdmin
    );
  }

  async acceptAdmin(): Promise<string> {
    return instructions.acceptAdmin(
      this.program,
      this.walletPublicKey
    );
  }

  // ===========================================================================
  // Project Instructions
  // ===========================================================================

  async initializeProject(args: {
    projectId: BN;
    fundingGoal: BN;
    metadataUri: string;
    tiers: TierConfig[];
    /** ZTM v2.0: Tokenomics configuration */
    tokenomics: instructions.TokenomicsInput;
    /** Milestone 1 deadline - Unix timestamp (required) */
    milestone1Deadline: BN;
  }): Promise<string> {
    return instructions.initializeProject(
      this.program,
      args,
      this.walletPublicKey
    );
  }

  async submitForApproval(projectId: BN): Promise<string> {
    return instructions.submitForApproval(
      this.program,
      projectId,
      this.walletPublicKey
    );
  }

  async approveProject(
    args: { projectId: BN; usdcMint: PublicKey },
    adminKeypair: Keypair
  ): Promise<string> {
    return instructions.approveProject(
      this.program,
      args,
      adminKeypair
    );
  }

  // ===========================================================================
  // Milestone Instructions
  // ===========================================================================

  async createMilestone(args: {
    projectId: BN;
    milestoneIndex: number;
    percentage: number;
    description: string;
  }): Promise<string> {
    return instructions.createMilestone(
      this.program,
      args,
      this.walletPublicKey
    );
  }

  async submitMilestone(projectId: BN, milestoneIndex: number): Promise<string> {
    return instructions.submitMilestone(
      this.program,
      projectId,
      milestoneIndex,
      this.walletPublicKey
    );
  }

  async voteOnMilestone(args: {
    projectId: BN;
    milestoneIndex: number;
    nftMint: PublicKey | string;
    choice: { good: object } | { bad: object };
  }): Promise<string> {
    return instructions.voteOnMilestone(
      this.program,
      args,
      this.walletPublicKey
    );
  }

  async finalizeVoting(projectId: BN, milestoneIndex: number): Promise<string> {
    return instructions.finalizeVoting(
      this.program,
      projectId,
      milestoneIndex
    );
  }

  /**
   * Claim milestone funds (ZTM v2.0)
   * - Regular milestones: Full payout to founder
   * - Final milestone: LP USDC reserved for PCL, triggers MAE
   *
   * @param nextMilestoneDeadline - Deadline for next milestone (required for non-final milestones)
   *   Set to BN(0) for final milestone claims (no next milestone exists)
   */
  async claimMilestoneFunds(args: {
    projectId: BN;
    milestoneIndex: number;
    founderUsdcAccount: PublicKey;
    escrowTokenAccount: PublicKey;
    /** Deadline for next milestone - required for non-final milestones, use BN(0) for final */
    nextMilestoneDeadline: BN;
    /** Next milestone PDA - optional, auto-derived if not provided */
    nextMilestonePda?: PublicKey;
  }): Promise<string> {
    return instructions.claimMilestoneFunds(
      this.program,
      args,
      this.walletPublicKey
    );
  }

  /**
   * Resubmit a failed milestone for rework (Failed → InProgress)
   *
   * Allows founders to iterate on failed milestones. Clears voting state
   * for a fresh voting cycle. consecutive_failures is NOT reset.
   */
  async resubmitMilestone(args: {
    projectId: BN;
    milestoneIndex: number;
  }): Promise<string> {
    return instructions.resubmitMilestone(
      this.program,
      args,
      this.walletPublicKey
    );
  }

  /**
   * Set milestone deadline for founder to commit submission date
   *
   * Founders must set deadlines for milestones to provide visibility to investors.
   * Deadline must be at least 7 days from now and at most 1 year from now.
   */
  async setMilestoneDeadline(args: {
    projectId: BN;
    milestoneIndex: number;
    /** Unix timestamp for the deadline */
    deadline: BN;
  }): Promise<string> {
    return instructions.setMilestoneDeadline(
      this.program,
      args,
      this.walletPublicKey
    );
  }

  /**
   * Extend milestone deadline (max 3 extensions per milestone)
   *
   * Founders can extend a deadline up to 3 times before it passes.
   * Must be called BEFORE the current deadline passes.
   */
  async extendMilestoneDeadline(args: {
    projectId: BN;
    milestoneIndex: number;
    /** New deadline timestamp (must be > current deadline) */
    newDeadline: BN;
  }): Promise<string> {
    return instructions.extendMilestoneDeadline(
      this.program,
      args,
      this.walletPublicKey
    );
  }

  // ===========================================================================
  // Investment Instructions
  // ===========================================================================

  async invest(args: {
    projectId: BN;
    amount: BN;
    investorTokenAccount: PublicKey;
    escrowTokenAccount: PublicKey;
    investmentCount: number; // Must be fetched from project.investmentCount
  }): Promise<string> {
    return instructions.invest(
      this.program,
      args,
      this.walletPublicKey
    );
  }

  async cancelInvestment(args: {
    projectId: BN;
    nftMint: PublicKey;
    investorNftAccount: PublicKey;
    investorUsdcAccount: PublicKey;
    escrowTokenAccount: PublicKey;
  }): Promise<string> {
    return instructions.cancelInvestment(
      this.program,
      args,
      this.walletPublicKey
    );
  }

  // ===========================================================================
  // Pivot Instructions
  // ===========================================================================

  async proposePivot(args: {
    projectId: BN;
    newMetadataUri: string;
    newMilestones: Array<{ percentage: number; description: string }>;
  }): Promise<string> {
    return instructions.proposePivot(
      this.program,
      args,
      this.walletPublicKey
    );
  }

  async approvePivot(projectId: BN, adminKeypair: Keypair): Promise<string> {
    return instructions.approvePivot(
      this.program,
      projectId,
      adminKeypair
    );
  }

  async withdrawFromPivot(args: {
    projectId: BN;
    pivotCount: number;
    nftMint: PublicKey;
    investorTokenAccount: PublicKey;
    escrowTokenAccount: PublicKey;
    milestoneAccounts: PublicKey[]; // All milestone PDAs for calculating unreleased funds
  }): Promise<string> {
    return instructions.withdrawFromPivot(
      this.program,
      args,
      this.walletPublicKey
    );
  }

  async finalizePivot(args: {
    projectId: BN;
    pivotCount: number;
    milestoneAccounts: PublicKey[]; // All milestone PDAs (reused when old_count == new_count)
  }): Promise<string> {
    return instructions.finalizePivot(
      this.program,
      args,
      this.walletPublicKey
    );
  }

  // ===========================================================================
  // TGE Instructions
  // ===========================================================================

  async setTgeDate(args: {
    projectId: BN;
    tgeDate: BN;
    tokenMint: PublicKey;
  }): Promise<string> {
    return instructions.setTgeDate(
      this.program,
      args,
      this.walletPublicKey
    );
  }

  async depositTokens(args: {
    projectId: BN;
    amount: BN;
    tokenMint: PublicKey;
    founderTokenAccount: PublicKey;
  }): Promise<string> {
    return instructions.depositTokens(
      this.program,
      args,
      this.walletPublicKey
    );
  }

  async claimTokens(args: {
    projectId: BN;
    nftMint: PublicKey;
    investorNftAccount: PublicKey;
    investorTokenAccount: PublicKey;
    projectTokenVault: PublicKey;
  }): Promise<string> {
    return instructions.claimTokens(
      this.program,
      args,
      this.walletPublicKey
    );
  }

  async reportScam(args: {
    projectId: BN;
    nftMint: PublicKey;
  }): Promise<string> {
    return instructions.reportScam(
      this.program,
      args,
      this.walletPublicKey
    );
  }

  async releaseHoldback(args: {
    projectId: BN;
    founderTokenAccount: PublicKey;
  }): Promise<string> {
    return instructions.releaseHoldback(
      this.program,
      args
    );
  }

  // ===========================================================================
  // ZTM v2.0 Token Distribution Instructions
  // ===========================================================================

  /**
   * Claim investor tokens from a passed milestone (whitepaper: manual claim model)
   *
   * ZTM v2.0: Per whitepaper, investors manually claim their tokens after a milestone passes.
   * This replaces the batch distribution model with investor-initiated per-NFT claims.
   */
  async claimInvestorTokens(args: {
    projectId: BN;
    milestoneIndex: number;
    nftMint: PublicKey;
    investorTokenAccount: PublicKey;
  }): Promise<string> {
    return instructions.claimInvestorTokens(
      this.program,
      args,
      this.walletPublicKey
    );
  }

  /**
   * Distribute tokens to NFT holders for a milestone
   *
   * ZTM v2.0: Called by cranker after finalize_voting sets distribution_pending = true.
   * Processes batch of investments, transferring unlocked tokens to NFT holders.
   * Max batch size: 10 investments per call.
   *
   * @deprecated Use claimInvestorTokens instead (whitepaper manual claim model)
   */
  async distributeTokens(args: {
    projectId: BN;
    milestoneIndex: number;
    investments: Array<{
      investmentPda: PublicKey;
      investorTokenAccount: PublicKey;
    }>;
  }): Promise<string> {
    return instructions.distributeTokens(
      this.program,
      args,
      this.walletPublicKey
    );
  }

  /**
   * Complete token distribution for a milestone
   *
   * ZTM v2.0: Marks distribution as complete after all batches have been processed.
   * Permissionless - anyone can call this to finalize a distribution.
   */
  async completeDistribution(args: {
    projectId: BN;
    milestoneIndex: number;
  }): Promise<string> {
    return instructions.completeDistribution(
      this.program,
      args,
      this.walletPublicKey
    );
  }

  // ===========================================================================
  // ZTM v2.0: Founder Vesting Instructions
  // ===========================================================================

  /**
   * Initialize founder vesting after MAE (Market Access Event)
   *
   * ZTM v2.0: Creates FounderVesting PDA with vesting schedule from Tokenomics.
   * Must be called after project reaches Completed state (all milestones done).
   * Permissionless - anyone can pay to initialize.
   */
  async initializeFounderVesting(args: {
    projectId: BN;
  }): Promise<string> {
    return instructions.initializeFounderVesting(
      this.program,
      args,
      this.walletPublicKey
    );
  }

  /**
   * Claim vested tokens from founder vault
   *
   * ZTM v2.0: Founder claims tokens based on linear vesting schedule.
   * Requires cliff period to pass before any tokens can be claimed.
   */
  async claimVestedTokens(args: {
    projectId: BN;
    founderTokenAccount: PublicKey;
  }): Promise<string> {
    return instructions.claimVestedTokens(
      this.program,
      args,
      this.walletPublicKey
    );
  }

  // ===========================================================================
  // ZTM v2.0: Circuit Breaker Instructions
  // ===========================================================================

  /**
   * Force complete a stuck distribution (admin only)
   *
   * ZTM v2.0: Circuit breaker for when token distribution is stuck for >7 days.
   * Marks distribution as complete so project can continue.
   * Affected investors can use claimMissedUnlock to get their tokens.
   */
  async forceCompleteDistribution(
    args: { projectId: BN },
    adminKeypair: Keypair
  ): Promise<string> {
    return instructions.forceCompleteDistribution(
      this.program,
      args,
      adminKeypair
    );
  }

  /**
   * Claim missed token unlock after force-complete distribution
   *
   * ZTM v2.0: Allows investors to claim tokens they missed during a stuck
   * distribution that was force-completed by admin.
   */
  async claimMissedUnlock(args: {
    projectId: BN;
    nftMint: PublicKey;
    milestoneIndex: number;
    claimerTokenAccount: PublicKey;
  }): Promise<string> {
    return instructions.claimMissedUnlock(
      this.program,
      args,
      this.walletPublicKey
    );
  }

  // ===========================================================================
  // Abandonment Instructions
  // ===========================================================================

  async checkAbandonment(projectId: BN, milestoneIndex: number = 0): Promise<string> {
    return instructions.checkAbandonment(
      this.program,
      projectId,
      milestoneIndex
    );
  }

  async claimRefund(args: {
    projectId: BN;
    nftMint: PublicKey;
    investorNftAccount: PublicKey;
    investorUsdcAccount: PublicKey;
    escrowTokenAccount: PublicKey;
    milestoneCount?: number;
  }): Promise<string> {
    return instructions.claimRefund(
      this.program,
      args,
      this.walletPublicKey
    );
  }
}
