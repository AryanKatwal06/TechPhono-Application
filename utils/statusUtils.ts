/**
 * Status utility functions for handling case-insensitive status comparisons
 * and data normalization
 */

export const REPAIR_STATUSES = {
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
  if (!status) return null;
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
  REPAIR_STATUSES.RECEIVED,
  REPAIR_STATUSES.DIAGNOSING,
  REPAIR_STATUSES.REPAIRING,
  REPAIR_STATUSES.REPAIRED
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
 * Formats status for display (capitalizes first letter)
 */
export const formatStatusForDisplay = (status: string | null): string => {
  if (!status) return 'Unknown';
  return status.charAt(0).toUpperCase() + status.slice(1).toLowerCase();
};

/**
 * Creates a case-insensitive status filter for Supabase queries
 */
export const createStatusFilter = (statuses: RepairStatusType[]) => {
  // Return both lowercase and common capitalized variants for maximum compatibility
  const allVariants = statuses.flatMap(status => [
    status,
    status.charAt(0).toUpperCase() + status.slice(1)
  ]);
  
  return allVariants;
};
