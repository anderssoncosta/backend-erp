export enum ContractStatus {
  DRAFT = 'DRAFT', ACTIVE = 'ACTIVE', SUSPENDED = 'SUSPENDED', EXPIRED = 'EXPIRED', CANCELLED = 'CANCELLED',
}
export const CONTRACT_STATUS_TRANSITIONS: Record<ContractStatus, ContractStatus[]> = {
  [ContractStatus.DRAFT]: [ContractStatus.ACTIVE, ContractStatus.CANCELLED],
  [ContractStatus.ACTIVE]: [ContractStatus.SUSPENDED, ContractStatus.EXPIRED, ContractStatus.CANCELLED],
  [ContractStatus.SUSPENDED]: [ContractStatus.ACTIVE, ContractStatus.CANCELLED],
  [ContractStatus.EXPIRED]: [ContractStatus.ACTIVE],
  [ContractStatus.CANCELLED]: [],
};
export function canTransitionContract(from: ContractStatus, to: ContractStatus): boolean {
  return CONTRACT_STATUS_TRANSITIONS[from]?.includes(to) ?? false;
}