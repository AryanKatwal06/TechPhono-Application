/**
 * Status utility functions for handling case-insensitive status comparisons
 * and data normalization
 */

export const REPAIR_STATUSES = {
  PENDING: 'pending',
  RECEIVED: 'received',
  DIAGNOSING: 'diagnosing',
  REPAIRING: 'repairing',
  REPAIRED: 'repaired',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled'
} as const;

export type RepairStatusType = typeof REPAIR_STATUSES[keyof typeof REPAIR_STATUSES];

/**
 * Normalizes status to lowercase for consistent comparison
 */
export const normalizeStatus = (status: string | null): RepairStatusType | null => {
  if (typeof status !== 'string') return null;
  const normalized = status.toLowerCase().trim();

  // Validate against known statuses
  if (Object.values(REPAIR_STATUSES).includes(normalized as RepairStatusType)) {
    return normalized as RepairStatusType;
  }

  return null;
};

/**
 * Gets active status values for database queries
 */
export const getActiveStatuses = (): RepairStatusType[] => [
  REPAIR_STATUSES.PENDING,
  REPAIR_STATUSES.RECEIVED,
  REPAIR_STATUSES.DIAGNOSING,
  REPAIR_STATUSES.REPAIRING,
  REPAIR_STATUSES.REPAIRED
];

/**
 * Statuses that represent a closed repair.
 * Repairs move here only after the final completion step.
 */
export const getClosedStatuses = (): RepairStatusType[] => [
  REPAIR_STATUSES.COMPLETED,
  REPAIR_STATUSES.CANCELLED
];

/**
 * Backward-compatible helper for the final completion state.
 */
export const getCompletedStatuses = (): RepairStatusType[] => [
  REPAIR_STATUSES.COMPLETED
];

/**
 * Gets all valid status values for validation
 */
export const getAllStatuses = (): RepairStatusType[] => Object.values(REPAIR_STATUSES);

/**
 * Case-insensitive status check for active repairs
 */
export const isActiveStatus = (status: string | null): boolean => {
  const normalized = normalizeStatus(status);
  return normalized ? getActiveStatuses().includes(normalized) : false;
};

/**
 * Case-insensitive status check for closed repairs
 */
export const isClosedStatus = (status: string | null): boolean => {
  const normalized = normalizeStatus(status);
  return normalized ? getClosedStatuses().includes(normalized) : false;
};

/**
 * Backward-compatible alias for closed repairs.
 */
export const isCompletedStatus = (status: string | null): boolean => isClosedStatus(status);

/**
 * Formats status for display (capitalizes first letter)
 */
export const formatStatusForDisplay = (status: string | null): string => {
  if (!status) return 'Unknown';
  return status.charAt(0).toUpperCase() + status.slice(1).toLowerCase();
};

/**
 * Creates a case-insensitive status filter for Firestore queries
 */
export const createStatusFilter = (statuses: RepairStatusType[]) => {
  // Return both lowercase and common capitalized variants for maximum compatibility
  const allVariants = statuses
    .filter((status): status is RepairStatusType => typeof status === 'string' && status.length > 0)
    .flatMap(status => [
      status,
      status.charAt(0).toUpperCase() + status.slice(1)
    ]);

  return allVariants;
};
