export const QUEUE_NAMES = {
  SERVICE_ORDERS: 'service-orders',
  INVENTORY: 'inventory',
  FINANCIAL: 'financial',
  NOTIFICATIONS: 'notifications',
  AUDIT: 'audit',
  REPORTS: 'reports',
  MAIL: 'mail',
  PUSH: 'push',
  SYNC: 'mobile-sync',
} as const;

export type QueueName = (typeof QUEUE_NAMES)[keyof typeof QUEUE_NAMES];
