import { waitlist, type Waitlist, type InsertWaitlist } from "@shared/schema";

export interface IStorage {
  addToWaitlist(entry: InsertWaitlist): Promise<Waitlist>;
  getWaitlistCount(): Promise<number>;
}

export class MemStorage implements IStorage {
  private waitlist: Map<number, Waitlist>;
  private currentId: number;

  constructor() {
    this.waitlist = new Map();
    this.currentId = 1;
  }

  async addToWaitlist(entry: InsertWaitlist): Promise<Waitlist> {
    const id = this.currentId++;
    const waitlistEntry: Waitlist = {
      ...entry,
      id,
      createdAt: new Date(),
    };
    this.waitlist.set(id, waitlistEntry);
    return waitlistEntry;
  }

  async getWaitlistCount(): Promise<number> {
    return this.waitlist.size;
  }
}

export const storage = new MemStorage();
