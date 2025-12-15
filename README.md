# @zemyth/raise-sdk

[![npm version](https://img.shields.io/npm/v/@zemyth/raise-sdk.svg)](https://www.npmjs.com/package/@zemyth/raise-sdk)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-blue.svg)](https://www.typescriptlang.org/)

TypeScript SDK for the **Raise** Solana program — a decentralized venture funding platform with milestone-based fund releases and investor protections.

## Features

- **Full Program Coverage** — All instructions wrapped with TypeScript types
- **PDA Helpers** — Derive all program addresses deterministically
- **Account Fetchers** — Fetch and decode all account types
- **Error Handling** — Mapped error codes with helpful messages
- **Event Parsing** — Parse and filter program events
- **Constants** — Investment tiers, timing values, governance parameters
- **Tree-shakable** — Modular exports for optimal bundle size
- **Dual Format** — ESM and CJS builds included
- **ZTM v2.0** — Full tokenomics, vesting, and distribution support

## Installation

```bash
npm install @zemyth/raise-sdk
# or
yarn add @zemyth/raise-sdk
# or
pnpm add @zemyth/raise-sdk
```

### Peer Dependencies

```bash
npm install @coral-xyz/anchor@^0.32.0 @solana/web3.js@^1.90.0
```

### Requirements

- Node.js >= 18
- TypeScript >= 5.0 (recommended)

## Quick Start

### Initialize Client

```typescript
import { Program, AnchorProvider } from '@coral-xyz/anchor';
import { Connection } from '@solana/web3.js';
import { RaiseClient, BN } from '@zemyth/raise-sdk';
import idl from './idl/raise.json';

// Setup connection and provider
const connection = new Connection('https://api.devnet.solana.com');
const provider = new AnchorProvider(connection, wallet, {});

// Create program instance
const program = new Program(idl, provider);

// Create SDK client
const client = RaiseClient.fromProgram(program);
```

### Create a Project

```typescript
import { BN, USDC } from '@zemyth/raise-sdk';

const projectId = new BN(1);

// Initialize project with custom tiers and tokenomics
const tx = await client.initializeProject({
  projectId,
  fundingGoal: new BN(USDC.toAmount(100_000)), // 100,000 USDC
  metadataUri: 'https://example.com/project.json',
  tiers: [
    { amount: new BN(USDC.toAmount(100)), maxLots: 1000, tokenRatio: new BN(100), voteMultiplier: 100 },
    { amount: new BN(USDC.toAmount(500)), maxLots: 200, tokenRatio: new BN(120), voteMultiplier: 120 },
    { amount: new BN(USDC.toAmount(1000)), maxLots: 100, tokenRatio: new BN(150), voteMultiplier: 150 },
  ],
  tokenomics: {
    totalSupply: new BN('1000000000000000'), // 1B tokens (with decimals)
    symbol: 'PROJ',
    investorAllocationBps: 2000, // 20%
    founderAllocationBps: 2000, // 20%
    lpAllocationBps: 3000, // 30%
    treasuryAllocationBps: 3000, // 30%
    cliffSeconds: new BN(15552000), // 6 months
    vestingSeconds: new BN(63072000), // 2 years
  },
  milestone1Deadline: new BN(Math.floor(Date.now() / 1000) + 90 * 24 * 60 * 60), // 90 days
});

console.log('Project created:', tx);

// Add milestones
await client.createMilestone({
  projectId,
  milestoneIndex: 0,
  percentage: 30,
  description: 'MVP Development',
});

await client.createMilestone({
  projectId,
  milestoneIndex: 1,
  percentage: 40,
  description: 'Beta Launch',
});

await client.createMilestone({
  projectId,
  milestoneIndex: 2,
  percentage: 30,
  description: 'Production Release',
});

// Submit for admin approval
await client.submitForApproval(projectId);
```

### Invest in a Project

```typescript
import { USDC, findTierIndex } from '@zemyth/raise-sdk';

// Fetch project to get tiers and investment count
const project = await client.fetchProject(projectId);
const amount = USDC.toAmount(1000); // 1,000 USDC

// Find matching tier (threshold-based)
const tierIndex = findTierIndex(
  project.tiers.slice(0, project.tierCount).map(t => ({ amount: BigInt(t.amount.toString()) })),
  amount
);

console.log(`Investing ${USDC.fromAmount(amount)} USDC (Tier ${tierIndex})`);

const tx = await client.invest({
  projectId,
  amount: new BN(amount.toString()),
  investorTokenAccount: myUsdcAccount,
  escrowTokenAccount: projectEscrow,
  investmentCount: project.investorCount, // Required for NFT mint derivation
});
```

### Vote on Milestones

```typescript
// Vote "Good" on milestone
await client.voteOnMilestone({
  projectId,
  milestoneIndex: 0,
  nftMint: myInvestmentNft,
  choice: { good: {} },
});

// Finalize voting after period ends
await client.finalizeVoting(projectId, 0);
```

### Claim Tokens (ZTM v2.0)

```typescript
// After milestone passes, claim investor tokens
await client.claimInvestorTokens({
  projectId,
  milestoneIndex: 0,
  nftMint: myInvestmentNft,
  investorTokenAccount: myProjectTokenAccount,
});
```

### Fetch Account Data

```typescript
// Fetch project
const project = await client.fetchProject(projectId);
console.log('Project state:', project?.state);
console.log('Amount raised:', USDC.fromAmount(BigInt(project.amountRaised.toString())));

// Fetch all investments
const investments = await client.fetchAllInvestments(projectId);
console.log(`Total investors: ${investments.length}`);

// Fetch all milestones
const milestones = await client.fetchAllMilestones(projectId);
milestones.forEach((m, i) => {
  console.log(`Milestone ${i}: ${m.account.description} (${m.account.percentage}%)`);
});
```

## Modular Imports

Import only what you need for smaller bundles:

```typescript
// PDAs only
import { getProjectPDA, getInvestmentPDA, getTokenomicsPDA } from '@zemyth/raise-sdk/pdas';

// Constants only
import { TIMING, GOVERNANCE, USDC, TIER_CONSTRAINTS } from '@zemyth/raise-sdk/constants';

// Account fetchers only
import { fetchProject, fetchAllInvestments } from '@zemyth/raise-sdk/accounts';

// Instructions only
import { invest, voteOnMilestone, claimInvestorTokens } from '@zemyth/raise-sdk/instructions';

// Error handling only
import { parseError, ERROR_CODES, isRaiseError } from '@zemyth/raise-sdk/errors';

// Types only
import type { ProjectAccount, MilestoneAccount, TierConfig } from '@zemyth/raise-sdk/types';
```

## Constants Reference

### Tier Configuration (v2.0)

Projects now define custom tiers with flexible configuration:

```typescript
import { TIER_CONSTRAINTS, type TierConfig } from '@zemyth/raise-sdk';

// Tier constraints
console.log(TIER_CONSTRAINTS.MIN_TIERS);         // 1
console.log(TIER_CONSTRAINTS.MAX_TIERS);         // 10
console.log(TIER_CONSTRAINTS.MIN_TIER_AMOUNT);   // 10_000_000n (10 USDC)
console.log(TIER_CONSTRAINTS.MIN_TIER_MAX_LOTS); // 1
console.log(TIER_CONSTRAINTS.MIN_TIER_VOTE_MULTIPLIER); // 100 (1.0x)

// Example tier configuration
const tiers: TierConfig[] = [
  {
    amount: new BN(100_000_000),  // 100 USDC per lot
    maxLots: 1000,                // Max 1000 lots available
    tokenRatio: new BN(100),      // 100 tokens per $1
    voteMultiplier: 100,          // 1.0x vote weight
  },
  {
    amount: new BN(1_000_000_000), // 1,000 USDC per lot
    maxLots: 100,
    tokenRatio: new BN(150),       // 150 tokens per $1 (bonus)
    voteMultiplier: 150,           // 1.5x vote weight
  },
];
```

### Timing Constants

```typescript
import { TIMING } from '@zemyth/raise-sdk';

console.log(TIMING.VOTING_PERIOD_SECONDS);          // 1,209,600 (14 days)
console.log(TIMING.HOLD_PERIOD_SECONDS);            // 604,800 (7 days)
console.log(TIMING.ABANDONMENT_TIMEOUT_SECONDS);    // 7,776,000 (90 days)
console.log(TIMING.PIVOT_WITHDRAWAL_WINDOW_SECONDS); // 604,800 (7 days)
console.log(TIMING.REFUND_WINDOW_SECONDS);          // 1,209,600 (14 days)
console.log(TIMING.TGE_MIN_DAYS);                   // 1,296,000 (15 days)
console.log(TIMING.TGE_MAX_DAYS);                   // 7,776,000 (90 days)
```

### Governance Parameters

```typescript
import { GOVERNANCE } from '@zemyth/raise-sdk';

console.log(GOVERNANCE.MILESTONE_APPROVAL_THRESHOLD_PERCENT); // 50 (>50%)
console.log(GOVERNANCE.SCAM_THRESHOLD_PERCENT);               // 30 (30%)
console.log(GOVERNANCE.CONSECUTIVE_FAILURES_THRESHOLD);       // 3
```

### Validation Constants

```typescript
import { VALIDATION } from '@zemyth/raise-sdk';

console.log(VALIDATION.MIN_MILESTONES);          // 2
console.log(VALIDATION.MAX_MILESTONES);          // 10
console.log(VALIDATION.MILESTONE_PERCENTAGE_SUM); // 100
console.log(VALIDATION.MAX_METADATA_URI_LENGTH); // 200
```

## Error Handling

```typescript
import {
  parseError,
  isRaiseError,
  getErrorMessage,
  ERROR_CODES,
  RaiseError
} from '@zemyth/raise-sdk';

try {
  await client.invest({ ... });
} catch (error) {
  const parsed = parseError(error);

  if (isRaiseError(parsed, ERROR_CODES.InvestmentBelowMinimum)) {
    console.error('Investment too small for minimum tier');
  } else if (isRaiseError(parsed, ERROR_CODES.FundingGoalExceeded)) {
    console.error('Project is fully funded');
  } else if (isRaiseError(parsed, ERROR_CODES.InvalidTier)) {
    console.error('No matching tier for investment amount');
  } else if (parsed instanceof RaiseError) {
    console.error(`Program error ${parsed.code}: ${parsed.message}`);
  } else {
    console.error(getErrorMessage(parsed));
  }
}
```

### Error Code Categories

| Range | Category |
|-------|----------|
| 6000-6099 | State Transition Errors |
| 6100-6199 | Authorization Errors |
| 6200-6299 | Investment Errors |
| 6300-6399 | Milestone Errors |
| 6400-6499 | TGE Errors |
| 6500-6599 | Pivot Errors |
| 6800-6899 | Refund Errors |
| 6900-6999 | Scam Report Errors |

## Event Parsing

```typescript
import {
  EVENT_NAMES,
  filterEventsByName,
  findEvent,
  type ProjectCreatedEvent,
  type InvestmentMadeEvent
} from '@zemyth/raise-sdk';

// Parse events from transaction logs
const tx = await connection.getTransaction(signature, {
  maxSupportedTransactionVersion: 0,
});

// Filter specific event type
const investmentEvents = filterEventsByName<InvestmentMadeEvent>(
  parsedEvents,
  EVENT_NAMES.InvestmentMade
);

// Find first matching event
const projectCreated = findEvent<ProjectCreatedEvent>(
  parsedEvents,
  EVENT_NAMES.ProjectCreated
);
```

## PDA Reference

### Core PDAs

```typescript
import {
  getProjectPDA,
  getEscrowPDA,
  getMilestonePDA,
  getInvestmentPDA,
  getVotePDA,
  getPivotProposalPDA,
  getAdminConfigPDA,
  getNftMintPDA,
  getProjectPDAs,
} from '@zemyth/raise-sdk';

// Derive project and escrow PDAs together
const { project, escrow } = getProjectPDAs(projectId, programId);

// Derive milestone PDA
const milestonePda = getMilestonePDA(projectPda, 0, programId);

// Derive investment PDA
const investmentPda = getInvestmentPDA(projectPda, nftMint, programId);

// Derive vote PDA (includes voting round for rework support)
const votePda = getVotePDA(milestonePda, voterKey, votingRound, programId);

// Derive NFT mint PDA
const [nftMint, bump] = getNftMintPDA(projectId, investor, investmentCount, programId);
```

### ZTM v2.0 PDAs

```typescript
import {
  getTokenomicsPDA,
  getTokenMintPDA,
  getVaultAuthorityPDA,
  getInvestorVaultPDA,
  getFounderVaultPDA,
  getLpTokenVaultPDA,
  getTreasuryVaultPDA,
  getLpUsdcVaultPDA,
  getFounderVestingPDA,
} from '@zemyth/raise-sdk';

// Token distribution vaults
const tokenomics = getTokenomicsPDA(projectPda, programId);
const tokenMint = getTokenMintPDA(projectPda, programId);
const investorVault = getInvestorVaultPDA(projectPda, programId);
const founderVault = getFounderVaultPDA(projectPda, programId);
const lpTokenVault = getLpTokenVaultPDA(projectPda, programId);
const treasuryVault = getTreasuryVaultPDA(projectPda, programId);
const lpUsdcVault = getLpUsdcVaultPDA(projectPda, programId);

// Founder vesting
const founderVesting = getFounderVestingPDA(projectPda, programId);
```

## Utility Functions

### Time Helpers

```typescript
import {
  timeRemaining,
  formatDuration,
  hasTimestampPassed,
  timestampToDate,
  getCurrentTimestamp
} from '@zemyth/raise-sdk';

// Check voting deadline
const milestone = await client.fetchMilestone(projectId, 0);
if (milestone?.votingEndsAt) {
  const remaining = timeRemaining(milestone.votingEndsAt);
  console.log(`Time remaining: ${formatDuration(remaining)}`);
  // Output: "Time remaining: 2d 5h 30m"

  if (hasTimestampPassed(milestone.votingEndsAt)) {
    console.log('Voting period ended');
  }

  const endDate = timestampToDate(milestone.votingEndsAt);
  console.log(`Ends at: ${endDate.toISOString()}`);
}
```

### USDC Conversions

```typescript
import { USDC } from '@zemyth/raise-sdk';

// Convert USDC to lamports (6 decimals)
const lamports = USDC.toAmount(100); // 100_000_000n

// Convert lamports to USDC
const usdc = USDC.fromAmount(100_000_000n); // 100
```

### BN Conversions

```typescript
import { bnToNumber, bnToBigInt, bigIntToBN, BN } from '@zemyth/raise-sdk';

const bn = new BN('1000000000');
const bigint = bnToBigInt(bn);  // 1000000000n
const num = bnToNumber(bn);     // 1000000000 (throws if unsafe)
const back = bigIntToBN(bigint); // BN
```

### Validation

```typescript
import {
  validateMilestonePercentages,
  validateMetadataUri,
  isValidPublicKey,
  shortenPublicKey
} from '@zemyth/raise-sdk';

// Validate milestone percentages sum to 100
validateMilestonePercentages([30, 40, 30]); // true
validateMilestonePercentages([30, 40, 20]); // false

// Validate metadata URI
validateMetadataUri('https://example.com/project.json'); // true
validateMetadataUri('not-a-url'); // false

// Public key utilities
isValidPublicKey('ABC123...'); // true/false
shortenPublicKey(pubkey, 4); // "ABC1...XYZ9"
```

### Percentage Utilities

```typescript
import { bpsToPercent, percentToBps, percentageOf } from '@zemyth/raise-sdk';

bpsToPercent(2000);        // 0.2 (20%)
percentToBps(0.2);         // 2000
percentageOf(1000n, 20);   // 200n
```

## React Integration

```typescript
import { useMemo } from 'react';
import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { Program, AnchorProvider } from '@coral-xyz/anchor';
import { RaiseClient } from '@zemyth/raise-sdk';
import idl from './idl/raise.json';

export function useRaiseClient(): RaiseClient | null {
  const { connection } = useConnection();
  const wallet = useWallet();

  return useMemo(() => {
    if (!wallet.publicKey || !wallet.signTransaction) {
      return null;
    }

    const provider = new AnchorProvider(
      connection,
      wallet as any,
      AnchorProvider.defaultOptions()
    );

    const program = new Program(idl as any, provider);
    return RaiseClient.fromProgram(program);
  }, [connection, wallet]);
}

// Usage in component
function InvestButton({ projectId }: { projectId: string }) {
  const client = useRaiseClient();
  const [loading, setLoading] = useState(false);

  const handleInvest = async () => {
    if (!client) return;
    setLoading(true);

    try {
      const tx = await client.invest({
        projectId: new BN(projectId),
        amount: new BN(100_000_000),
        investorTokenAccount: myUsdcAta,
        escrowTokenAccount: projectEscrow,
        investmentCount: project.investorCount,
      });
      console.log('Investment tx:', tx);
    } catch (error) {
      console.error(parseError(error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <button onClick={handleInvest} disabled={!client || loading}>
      {loading ? 'Investing...' : 'Invest'}
    </button>
  );
}
```

## API Reference

### RaiseClient Methods

#### Admin Operations
| Method | Description |
|--------|-------------|
| `initializeAdmin(admin)` | Initialize admin config |
| `transferAdmin(newAdmin, adminKeypair)` | Propose admin transfer |
| `acceptAdmin()` | Accept admin transfer |

#### Project Operations
| Method | Description |
|--------|-------------|
| `initializeProject(args)` | Create new project with tiers and tokenomics |
| `submitForApproval(projectId)` | Submit for admin approval |
| `approveProject(args, adminKeypair)` | Approve project (admin) |

#### Milestone Operations
| Method | Description |
|--------|-------------|
| `createMilestone(args)` | Add milestone to project |
| `submitMilestone(projectId, index)` | Submit milestone for voting |
| `voteOnMilestone(args)` | Cast vote (Good/Bad) |
| `finalizeVoting(projectId, index)` | End voting period |
| `claimMilestoneFunds(args)` | Claim funds after passing |
| `resubmitMilestone(args)` | Resubmit failed milestone for rework |
| `setMilestoneDeadline(args)` | Set milestone deadline |
| `extendMilestoneDeadline(args)` | Extend deadline (max 3x) |

#### Investment Operations
| Method | Description |
|--------|-------------|
| `invest(args)` | Invest USDC, receive NFT |
| `cancelInvestment(args)` | Cancel within 24h cooling-off |

#### Token Distribution (ZTM v2.0)
| Method | Description |
|--------|-------------|
| `claimInvestorTokens(args)` | Claim tokens after milestone passes |
| `distributeTokens(args)` | Batch distribute (deprecated) |
| `completeDistribution(args)` | Mark distribution complete |

#### Founder Vesting (ZTM v2.0)
| Method | Description |
|--------|-------------|
| `initializeFounderVesting(args)` | Initialize vesting after MAE |
| `claimVestedTokens(args)` | Claim vested tokens |

#### Circuit Breaker (ZTM v2.0)
| Method | Description |
|--------|-------------|
| `forceCompleteDistribution(args, adminKeypair)` | Force-complete stuck distribution (admin) |
| `claimMissedUnlock(args)` | Claim tokens after force-complete |

#### Pivot Operations
| Method | Description |
|--------|-------------|
| `proposePivot(args)` | Propose project pivot |
| `approvePivot(projectId, adminKeypair)` | Approve pivot (admin) |
| `withdrawFromPivot(args)` | Withdraw during 7-day window |
| `finalizePivot(args)` | Finalize after window ends |

#### TGE Operations (Legacy)
| Method | Description |
|--------|-------------|
| `setTgeDate(args)` | Set token generation date |
| `depositTokens(args)` | Deposit tokens for distribution |
| `claimTokens(args)` | Claim allocated tokens |
| `reportScam(args)` | Report potential scam |
| `releaseHoldback(args)` | Release 10% founder holdback |

#### Abandonment & Refunds
| Method | Description |
|--------|-------------|
| `checkAbandonment(projectId, milestoneIndex)` | Check for abandonment |
| `claimRefund(args)` | Claim refund from abandoned project |

#### Account Fetchers
| Method | Description |
|--------|-------------|
| `fetchProject(projectId)` | Fetch project account |
| `fetchMilestone(projectId, index)` | Fetch milestone account |
| `fetchAllMilestones(projectId)` | Fetch all milestones |
| `fetchInvestment(projectId, nftMint)` | Fetch investment account |
| `fetchAllInvestments(projectId)` | Fetch all investments |
| `fetchVote(projectId, index, voter, round)` | Fetch vote account |
| `fetchAllVotes(projectId, index)` | Fetch all votes |
| `fetchPivotProposal(projectId)` | Fetch pivot proposal |
| `fetchTgeEscrow(projectId)` | Fetch TGE escrow |
| `fetchAdminConfig()` | Fetch admin config |

## TypeScript Types

```typescript
import type {
  // Account types
  ProjectAccount,
  MilestoneAccount,
  InvestmentAccount,
  VoteAccount,
  AdminConfigAccount,
  PivotProposalAccount,
  TgeEscrowAccount,
  Tier,
  TierConfig,

  // Enums
  ProjectState,
  MilestoneState,
  VoteChoice,
  PivotState,

  // Instruction args
  InitializeProjectArgs,
  CreateMilestoneArgs,
  InvestArgs,
  VoteOnMilestoneArgs,
  ProposePivotArgs,

  // Events
  ProjectCreatedEvent,
  InvestmentMadeEvent,
  MilestoneVoteCastEvent,
  MilestoneVoteFinalizedEvent,

  // Utility types
  InvestmentWithKey,
  MilestoneWithKey,
  VoteWithKey,
} from '@zemyth/raise-sdk';
```

### Project States

```typescript
enum ProjectState {
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
```

### Milestone States

```typescript
enum MilestoneState {
  Proposed = 'proposed',
  Approved = 'approved',
  InProgress = 'inProgress',
  UnderReview = 'underReview',
  Passed = 'passed',
  Failed = 'failed',
  Unlocked = 'unlocked',
}
```

## Development

```bash
# Install dependencies
npm install

# Build
npm run build

# Type check
npm run typecheck

# Watch mode
npm run dev

# Clean build artifacts
npm run clean
```

## Links

- [GitHub Repository](https://github.com/zemyth-app/raise)
- [Issue Tracker](https://github.com/zemyth-app/raise/issues)
- [npm Package](https://www.npmjs.com/package/@zemyth/raise-sdk)

## License

MIT
