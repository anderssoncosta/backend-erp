export enum MovementType {
  ENTRY = 'ENTRY',
  EXIT = 'EXIT',
  TRANSFER_IN = 'TRANSFER_IN',
  TRANSFER_OUT = 'TRANSFER_OUT',
  ADJUSTMENT_IN = 'ADJUSTMENT_IN',
  ADJUSTMENT_OUT = 'ADJUSTMENT_OUT',
  LOSS = 'LOSS',
  CONSUMPTION = 'CONSUMPTION',
}

export const ENTRY_TYPES = [
  MovementType.ENTRY,
  MovementType.TRANSFER_IN,
  MovementType.ADJUSTMENT_IN,
];

export const EXIT_TYPES = [
  MovementType.EXIT,
  MovementType.TRANSFER_OUT,
  MovementType.ADJUSTMENT_OUT,
  MovementType.LOSS,
  MovementType.CONSUMPTION,
];
