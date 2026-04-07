export enum PriorityLevel {
  CRITICAL = 'CRITICAL',
  HIGH = 'HIGH',
  MEDIUM = 'MEDIUM',
  LOW = 'LOW',
}

export const PRIORITY_WEIGHT: Record<PriorityLevel, number> = {
  [PriorityLevel.CRITICAL]: 4,
  [PriorityLevel.HIGH]: 3,
  [PriorityLevel.MEDIUM]: 2,
  [PriorityLevel.LOW]: 1,
};

export const DEFAULT_SLA_HOURS: Record<PriorityLevel, number> = {
  [PriorityLevel.CRITICAL]: 4,
  [PriorityLevel.HIGH]: 8,
  [PriorityLevel.MEDIUM]: 24,
  [PriorityLevel.LOW]: 72,
};
