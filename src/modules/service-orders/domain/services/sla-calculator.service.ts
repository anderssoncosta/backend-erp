import { Injectable } from '@nestjs/common';
import { PriorityLevel, DEFAULT_SLA_HOURS } from '../value-objects/priority-level.vo';

@Injectable()
export class SlaCalculatorService {
  calculateDeadline(priority: PriorityLevel, contractSlaHours?: number): Date {
    const hours = contractSlaHours ?? DEFAULT_SLA_HOURS[priority];
    const deadline = new Date();
    deadline.setTime(deadline.getTime() + hours * 60 * 60 * 1000);
    return deadline;
  }

  isBreached(slaDeadline: Date): boolean {
    return new Date() > slaDeadline;
  }

  getRemainingMinutes(slaDeadline: Date): number {
    return Math.floor((slaDeadline.getTime() - Date.now()) / 60000);
  }

  getBreachPercentage(createdAt: Date, slaDeadline: Date): number {
    const total = slaDeadline.getTime() - createdAt.getTime();
    const elapsed = Date.now() - createdAt.getTime();
    return Math.min(100, Math.floor((elapsed / total) * 100));
  }
}
