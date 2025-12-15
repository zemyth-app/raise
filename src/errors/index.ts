/**
 * Raise Error Handling
 *
 * Maps program error codes to SDK errors with helpful messages.
 */

import { AnchorError } from '@coral-xyz/anchor';

// =============================================================================
// Error Codes (matching Rust program)
// =============================================================================

export const ERROR_CODES = {
  // State Transition Errors (6000-6099)
  InvalidStateTransition: 6000,
  ProjectNotInOpenState: 6001,
  ProjectNotInProgress: 6002,
  MilestoneNotUnderReview: 6003,
  VotingPeriodEnded: 6004,
  VotingPeriodNotEnded: 6005,
  MilestoneNotPassed: 6006,
  MilestoneAlreadyUnlocked: 6007,
  ProjectAlreadyFunded: 6008,
  ProjectNotFunded: 6009,

  // Authorization Errors (6100-6199)
  UnauthorizedFounder: 6100,
  UnauthorizedAdmin: 6101,
  NotInvestor: 6102,
  AlreadyVoted: 6103,

  // Investment Errors (6200-6299)
  InvestmentBelowMinimum: 6200,
  FundingGoalExceeded: 6201,
  InvalidTier: 6202,
  CoolingOffPeriodActive: 6203,
  CoolingOffPeriodExpired: 6204,

  // Milestone Errors (6300-6399)
  InvalidMilestoneIndex: 6300,
  MilestonePercentageInvalid: 6301,
  TotalPercentageExceeded: 6302,
  MilestoneNotInProgress: 6303,
  MilestoneNotApproved: 6304,

  // TGE Errors (6400-6499)
  TgeDateNotSet: 6400,
  TgeDateAlreadySet: 6401,
  TgeDateTooSoon: 6402,
  TgeDateTooLate: 6403,
  TgeNotReached: 6404,
  TokensAlreadyClaimed: 6405,
  InsufficientTokensDeposited: 6406,

  // Pivot Errors (6500-6599)
  PivotAlreadyProposed: 6500,
  NoPivotProposed: 6501,
  PivotNotApproved: 6502,
  PivotWindowNotEnded: 6503,
  PivotWindowEnded: 6504,
  AlreadyWithdrawnFromPivot: 6505,

  // Refund Errors (6800-6899)
  RefundAlreadyClaimed: 6800,
  RefundNotAvailable: 6801,
  ProjectNotAbandoned: 6802,

  // Scam Errors (6900-6999)
  ScamReportPeriodEnded: 6900,
  ScamAlreadyReported: 6901,
  ScamNotConfirmed: 6902,
  HoldbackAlreadyReleased: 6903,
  HoldbackPeriodNotEnded: 6904,
} as const;

// =============================================================================
// Error Messages
// =============================================================================

export const ERROR_MESSAGES: Record<number, string> = {
  // State Transition Errors
  [ERROR_CODES.InvalidStateTransition]: 'Invalid project state transition',
  [ERROR_CODES.ProjectNotInOpenState]: 'Project must be in Open state to accept investments',
  [ERROR_CODES.ProjectNotInProgress]: 'Project must be InProgress to perform this action',
  [ERROR_CODES.MilestoneNotUnderReview]: 'Milestone must be under review to vote',
  [ERROR_CODES.VotingPeriodEnded]: 'Voting period has ended',
  [ERROR_CODES.VotingPeriodNotEnded]: 'Voting period has not ended yet',
  [ERROR_CODES.MilestoneNotPassed]: 'Milestone did not pass voting',
  [ERROR_CODES.MilestoneAlreadyUnlocked]: 'Milestone funds already unlocked',
  [ERROR_CODES.ProjectAlreadyFunded]: 'Project has already reached funding goal',
  [ERROR_CODES.ProjectNotFunded]: 'Project has not reached funding goal',

  // Authorization Errors
  [ERROR_CODES.UnauthorizedFounder]: 'Only the project founder can perform this action',
  [ERROR_CODES.UnauthorizedAdmin]: 'Only the admin can perform this action',
  [ERROR_CODES.NotInvestor]: 'You must be an investor to perform this action',
  [ERROR_CODES.AlreadyVoted]: 'You have already voted on this',

  // Investment Errors
  [ERROR_CODES.InvestmentBelowMinimum]: 'Investment amount below minimum tier requirement',
  [ERROR_CODES.FundingGoalExceeded]: 'Investment would exceed funding goal',
  [ERROR_CODES.InvalidTier]: 'Invalid investment tier',
  [ERROR_CODES.CoolingOffPeriodActive]: 'Investment is within 24-hour cooling-off period',
  [ERROR_CODES.CoolingOffPeriodExpired]: 'Cooling-off period has expired, cannot cancel',

  // Milestone Errors
  [ERROR_CODES.InvalidMilestoneIndex]: 'Invalid milestone index',
  [ERROR_CODES.MilestonePercentageInvalid]: 'Milestone percentage must be between 1-100',
  [ERROR_CODES.TotalPercentageExceeded]: 'Total milestone percentages exceed 100%',
  [ERROR_CODES.MilestoneNotInProgress]: 'Milestone must be in progress',
  [ERROR_CODES.MilestoneNotApproved]: 'Milestone must be approved first',

  // TGE Errors
  [ERROR_CODES.TgeDateNotSet]: 'TGE date has not been set',
  [ERROR_CODES.TgeDateAlreadySet]: 'TGE date has already been set',
  [ERROR_CODES.TgeDateTooSoon]: 'TGE date must be at least 15 days in the future',
  [ERROR_CODES.TgeDateTooLate]: 'TGE date must be within 90 days',
  [ERROR_CODES.TgeNotReached]: 'TGE date has not been reached',
  [ERROR_CODES.TokensAlreadyClaimed]: 'Tokens have already been claimed',
  [ERROR_CODES.InsufficientTokensDeposited]: 'Insufficient tokens deposited by founder',

  // Pivot Errors
  [ERROR_CODES.PivotAlreadyProposed]: 'A pivot is already pending',
  [ERROR_CODES.NoPivotProposed]: 'No pivot has been proposed',
  [ERROR_CODES.PivotNotApproved]: 'Pivot has not been approved by admin',
  [ERROR_CODES.PivotWindowNotEnded]: '7-day withdrawal window has not ended',
  [ERROR_CODES.PivotWindowEnded]: '7-day withdrawal window has ended',
  [ERROR_CODES.AlreadyWithdrawnFromPivot]: 'Already withdrawn from this pivot',

  // Refund Errors
  [ERROR_CODES.RefundAlreadyClaimed]: 'Refund has already been claimed',
  [ERROR_CODES.RefundNotAvailable]: 'Refund is not available',
  [ERROR_CODES.ProjectNotAbandoned]: 'Project has not been abandoned',

  // Scam Errors
  [ERROR_CODES.ScamReportPeriodEnded]: '30-day scam report period has ended',
  [ERROR_CODES.ScamAlreadyReported]: 'Already reported this project for scam',
  [ERROR_CODES.ScamNotConfirmed]: 'Scam has not been confirmed',
  [ERROR_CODES.HoldbackAlreadyReleased]: 'Holdback has already been released',
  [ERROR_CODES.HoldbackPeriodNotEnded]: '30-day holdback period has not ended',
};

// =============================================================================
// SDK Error Class
// =============================================================================

export class RaiseError extends Error {
  constructor(
    public readonly code: number,
    message: string,
    public readonly logs?: string[]
  ) {
    super(message);
    this.name = 'RaiseError';
  }

  /**
   * Create from an Anchor error
   */
  static fromAnchorError(error: AnchorError): RaiseError {
    const code = error.error.errorCode.number;
    const message = ERROR_MESSAGES[code] || error.error.errorMessage;
    return new RaiseError(code, message, error.logs);
  }

  /**
   * Check if this is a specific error type
   */
  is(errorCode: number): boolean {
    return this.code === errorCode;
  }
}

// =============================================================================
// Error Handling Utilities
// =============================================================================

/**
 * Parse an error and return a RaiseError if it's a program error
 */
export function parseError(error: unknown): RaiseError | Error {
  if (error instanceof AnchorError) {
    return RaiseError.fromAnchorError(error);
  }
  if (error instanceof Error) {
    return error;
  }
  return new Error(String(error));
}

/**
 * Check if an error is a specific Raise error
 */
export function isRaiseError(
  error: unknown,
  code?: number
): error is RaiseError {
  if (!(error instanceof RaiseError)) {
    return false;
  }
  if (code !== undefined) {
    return error.code === code;
  }
  return true;
}

/**
 * Get a user-friendly error message
 */
export function getErrorMessage(error: unknown): string {
  if (error instanceof RaiseError) {
    return error.message;
  }
  if (error instanceof AnchorError) {
    const code = error.error.errorCode.number;
    return ERROR_MESSAGES[code] || error.error.errorMessage;
  }
  if (error instanceof Error) {
    return error.message;
  }
  return 'An unknown error occurred';
}
