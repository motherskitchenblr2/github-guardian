/**
 * Branch Protection Rules and Presets for GitHub Guardian.
 * Enforces Zero-Trust immutability standards on GitHub branches.
 */

export interface BranchProtectionRules {
  enforceAdmins: boolean;
  requirePullRequests: boolean;
  reviewCount: number;
  dismissStale: boolean;
  requireCodeOwner: boolean;
  requireLastPushApproval: boolean;
  requireStatusChecks: boolean;
  strictChecks: boolean;
  requiredLinearHistory: boolean;
  allowForcePushes: boolean;
  allowDeletions: boolean;
  requiredConversationResolution: boolean;
}

export const RECOMMENDED_GUARDIAN_RULES: BranchProtectionRules = {
  enforceAdmins: true,
  requirePullRequests: true,
  reviewCount: 1,
  dismissStale: true,
  requireCodeOwner: false,
  requireLastPushApproval: true,
  requireStatusChecks: false,
  strictChecks: false,
  requiredLinearHistory: true,
  allowForcePushes: false,
  allowDeletions: false,
  requiredConversationResolution: true,
};

export const STRICT_ENTERPRISE_RULES: BranchProtectionRules = {
  enforceAdmins: true,
  requirePullRequests: true,
  reviewCount: 2,
  dismissStale: true,
  requireCodeOwner: true,
  requireLastPushApproval: true,
  requireStatusChecks: true,
  strictChecks: true,
  requiredLinearHistory: true,
  allowForcePushes: false,
  allowDeletions: false,
  requiredConversationResolution: true,
};
