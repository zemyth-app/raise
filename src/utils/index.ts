/**
 * Raise Utilities
 *
 * Helper functions for common operations.
 */

import { BN } from '@coral-xyz/anchor';
import { PublicKey, Connection, TransactionSignature } from '@solana/web3.js';

// =============================================================================
// Transaction Utilities
// =============================================================================

/**
 * Wait for transaction confirmation
 *
 * @param connection - Solana connection
 * @param signature - Transaction signature
 * @param commitment - Confirmation commitment level
 * @returns Confirmation result
 */
export async function confirmTransaction(
  connection: Connection,
  signature: TransactionSignature,
  commitment: 'confirmed' | 'finalized' = 'confirmed'
) {
  const latestBlockhash = await connection.getLatestBlockhash();

  return connection.confirmTransaction(
    {
      signature,
      blockhash: latestBlockhash.blockhash,
      lastValidBlockHeight: latestBlockhash.lastValidBlockHeight,
    },
    commitment
  );
}

/**
 * Get transaction details with retry
 *
 * @param connection - Solana connection
 * @param signature - Transaction signature
 * @param maxRetries - Maximum number of retries
 * @returns Transaction details
 */
export async function getTransactionWithRetry(
  connection: Connection,
  signature: TransactionSignature,
  maxRetries: number = 3
) {
  for (let i = 0; i < maxRetries; i++) {
    const tx = await connection.getTransaction(signature, {
      maxSupportedTransactionVersion: 0,
    });

    if (tx) {
      return tx;
    }

    // Wait before retrying
    await new Promise((resolve) => setTimeout(resolve, 1000 * (i + 1)));
  }

  throw new Error(`Transaction ${signature} not found after ${maxRetries} retries`);
}

// =============================================================================
// BN Utilities
// =============================================================================

/**
 * Convert BN to number safely
 *
 * @param bn - BN value
 * @returns Number value
 * @throws If value is too large for safe integer
 */
export function bnToNumber(bn: BN): number {
  const num = bn.toNumber();
  if (!Number.isSafeInteger(num)) {
    throw new Error(`BN value ${bn.toString()} is too large to convert to number`);
  }
  return num;
}

/**
 * Convert BN to bigint
 *
 * @param bn - BN value
 * @returns BigInt value
 */
export function bnToBigInt(bn: BN): bigint {
  return BigInt(bn.toString());
}

/**
 * Convert bigint to BN
 *
 * @param value - BigInt value
 * @returns BN value
 */
export function bigIntToBN(value: bigint): BN {
  return new BN(value.toString());
}

// =============================================================================
// Time Utilities
// =============================================================================

/**
 * Get current Unix timestamp in seconds
 *
 * @returns Current timestamp
 */
export function getCurrentTimestamp(): number {
  return Math.floor(Date.now() / 1000);
}

/**
 * Convert Unix timestamp to Date
 *
 * @param timestamp - Unix timestamp in seconds
 * @returns Date object
 */
export function timestampToDate(timestamp: number | BN): Date {
  const ts = typeof timestamp === 'number' ? timestamp : timestamp.toNumber();
  return new Date(ts * 1000);
}

/**
 * Check if a timestamp has passed
 *
 * @param timestamp - Unix timestamp in seconds
 * @returns True if timestamp has passed
 */
export function hasTimestampPassed(timestamp: number | BN): boolean {
  const ts = typeof timestamp === 'number' ? timestamp : timestamp.toNumber();
  return getCurrentTimestamp() > ts;
}

/**
 * Calculate time remaining until timestamp
 *
 * @param timestamp - Unix timestamp in seconds
 * @returns Seconds remaining (0 if passed)
 */
export function timeRemaining(timestamp: number | BN): number {
  const ts = typeof timestamp === 'number' ? timestamp : timestamp.toNumber();
  const remaining = ts - getCurrentTimestamp();
  return remaining > 0 ? remaining : 0;
}

/**
 * Format duration in human-readable format
 *
 * @param seconds - Duration in seconds
 * @returns Formatted string (e.g., "2d 5h 30m")
 */
export function formatDuration(seconds: number): string {
  if (seconds <= 0) return '0s';

  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;

  const parts: string[] = [];
  if (days > 0) parts.push(`${days}d`);
  if (hours > 0) parts.push(`${hours}h`);
  if (minutes > 0) parts.push(`${minutes}m`);
  if (secs > 0 && days === 0) parts.push(`${secs}s`);

  return parts.join(' ') || '0s';
}

// =============================================================================
// Percentage Utilities
// =============================================================================

/**
 * Calculate percentage from basis points
 *
 * @param bps - Basis points (1% = 100 bps)
 * @returns Percentage as decimal
 */
export function bpsToPercent(bps: number): number {
  return bps / 10000;
}

/**
 * Calculate basis points from percentage
 *
 * @param percent - Percentage as decimal
 * @returns Basis points
 */
export function percentToBps(percent: number): number {
  return Math.floor(percent * 10000);
}

/**
 * Calculate percentage of amount
 *
 * @param amount - Total amount
 * @param percentage - Percentage (0-100)
 * @returns Calculated amount
 */
export function percentageOf(amount: bigint, percentage: number): bigint {
  return (amount * BigInt(Math.floor(percentage * 100))) / 10000n;
}

// =============================================================================
// Validation Utilities
// =============================================================================

/**
 * Validate milestone percentages sum to 100
 *
 * @param percentages - Array of percentage values
 * @returns True if valid
 */
export function validateMilestonePercentages(percentages: number[]): boolean {
  const sum = percentages.reduce((acc, p) => acc + p, 0);
  return sum === 100;
}

/**
 * Validate metadata URI format
 *
 * @param uri - URI string
 * @param maxLength - Maximum allowed length
 * @returns True if valid
 */
export function validateMetadataUri(uri: string, maxLength: number = 200): boolean {
  if (uri.length > maxLength) return false;

  try {
    new URL(uri);
    return true;
  } catch {
    return false;
  }
}

// =============================================================================
// Account Utilities
// =============================================================================

/**
 * Check if a public key is valid
 *
 * @param pubkey - String or PublicKey
 * @returns True if valid
 */
export function isValidPublicKey(pubkey: string | PublicKey): boolean {
  try {
    if (typeof pubkey === 'string') {
      new PublicKey(pubkey);
    }
    return true;
  } catch {
    return false;
  }
}

/**
 * Shorten a public key for display
 *
 * @param pubkey - Public key
 * @param chars - Number of characters to show on each end
 * @returns Shortened string (e.g., "ABC...XYZ")
 */
export function shortenPublicKey(pubkey: PublicKey | string, chars: number = 4): string {
  const str = pubkey.toString();
  if (str.length <= chars * 2 + 3) return str;
  return `${str.slice(0, chars)}...${str.slice(-chars)}`;
}
