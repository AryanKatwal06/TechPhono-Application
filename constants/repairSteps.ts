export const STATUS_ORDER = [
  'Received',
  'Diagnosing',
  'Repairing',
  'Repaired',
  'Completed',
] as const;
export const REPAIR_STEPS = [
  {
    key: 'Received',
    title: 'Received',
    description: 'We received your device',
    icon: 'cube-outline',
  },
  {
    key: 'Diagnosing',
    title: 'Diagnosing',
    description: 'Checking the issue',
    icon: 'time-outline',
  },
  {
    key: 'Repairing',
    title: 'Repairing',
    description: 'Fixing your device',
    icon: 'construct-outline',
  },
  {
    key: 'Repaired',
    title: 'Repaired',
    description: 'Ready for pickup',
    icon: 'checkmark-done-outline',
  },
  {
    key: 'Completed',
    title: 'Completed',
    description: 'Job completed successfully',
    icon: 'checkmark-circle-outline',
  },
] as const;
export const FINAL_STATUSES = ['Completed', 'Cancelled'] as const;
export type RepairStepKey = typeof STATUS_ORDER[number];