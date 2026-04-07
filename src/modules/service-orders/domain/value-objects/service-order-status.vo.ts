export enum ServiceOrderStatus {
  OPEN = 'OPEN',
  ASSIGNED = 'ASSIGNED',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
  REOPENED = 'REOPENED',
}

export const TERMINAL_STATUSES = [
  ServiceOrderStatus.COMPLETED,
  ServiceOrderStatus.CANCELLED,
];

export const ACTIVE_STATUSES = [
  ServiceOrderStatus.OPEN,
  ServiceOrderStatus.ASSIGNED,
  ServiceOrderStatus.IN_PROGRESS,
  ServiceOrderStatus.REOPENED,
];

export const STATUS_TRANSITIONS: Record<ServiceOrderStatus, ServiceOrderStatus[]> = {
  [ServiceOrderStatus.OPEN]: [
    ServiceOrderStatus.ASSIGNED,
    ServiceOrderStatus.IN_PROGRESS,
    ServiceOrderStatus.CANCELLED,
  ],
  [ServiceOrderStatus.ASSIGNED]: [
    ServiceOrderStatus.IN_PROGRESS,
    ServiceOrderStatus.OPEN,
    ServiceOrderStatus.CANCELLED,
  ],
  [ServiceOrderStatus.IN_PROGRESS]: [
    ServiceOrderStatus.COMPLETED,
    ServiceOrderStatus.CANCELLED,
    ServiceOrderStatus.ASSIGNED,
  ],
  [ServiceOrderStatus.COMPLETED]: [ServiceOrderStatus.REOPENED],
  [ServiceOrderStatus.CANCELLED]: [ServiceOrderStatus.REOPENED],
  [ServiceOrderStatus.REOPENED]: [
    ServiceOrderStatus.ASSIGNED,
    ServiceOrderStatus.IN_PROGRESS,
    ServiceOrderStatus.CANCELLED,
  ],
};

export function canTransition(from: ServiceOrderStatus, to: ServiceOrderStatus): boolean {
  return STATUS_TRANSITIONS[from]?.includes(to) ?? false;
}
