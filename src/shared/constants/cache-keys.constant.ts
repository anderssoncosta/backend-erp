export const CACHE_KEYS = {
  TENANT: (tenantId: string) => `tenant:${tenantId}`,
  TENANT_SETTINGS: (tenantId: string) => `tenant:${tenantId}:settings`,
  USER: (userId: string) => `user:${userId}`,
  USER_PERMISSIONS: (userId: string) => `user:${userId}:permissions`,
  PERMISSIONS: (tenantId: string) => `tenant:${tenantId}:permissions`,
  SERVICE_ORDER: (orderId: string) => `so:${orderId}`,
  STOCK_ITEM: (tenantId: string, branchId: string, materialId: string) =>
    `stock:${tenantId}:${branchId}:${materialId}`,
  MATERIAL_LIST: (tenantId: string) => `materials:${tenantId}`,
  COST_CENTER_LIST: (tenantId: string) => `cost-centers:${tenantId}`,
} as const;

export const CACHE_TTL = {
  SHORT: 60,
  MEDIUM: 300,
  LONG: 3600,
  VERY_LONG: 86400,
} as const;
