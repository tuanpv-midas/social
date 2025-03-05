import { waitlist, type Waitlist, type InsertWaitlist } from "@shared/schema";
import { drizzle } from "drizzle-orm/postgres-js";
import { users, type User, type InsertUser } from "@shared/schema";
import postgres from "postgres";
import { eq } from "drizzle-orm";

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL is not set");
}

const client = postgres(process.env.DATABASE_URL);
const db = drizzle(client);

export interface IStorage {
  addToWaitlist(entry: InsertWaitlist): Promise<Waitlist>;
  getWaitlistCount(): Promise<number>;
  createUser(user: InsertUser): Promise<User>;
  getUserByEmail(email: string): Promise<User | undefined>;
  updateUser(id: number, data: Partial<User>): Promise<User>;
  getUserById(id: number): Promise<User | undefined>;
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

  //Dummy implementations for user methods -  DbStorage handles these.
  async createUser(user: InsertUser): Promise<User> { throw new Error("Method not implemented."); }
  async getUserByEmail(email: string): Promise<User | undefined> { throw new Error("Method not implemented."); }
  async updateUser(id: number, data: Partial<User>): Promise<User> { throw new Error("Method not implemented."); }
  async getUserById(id: number): Promise<User | undefined> { throw new Error("Method not implemented."); }
}

export class DbStorage implements IStorage {
  async createUser(data: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(data).returning();
    return user;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user;
  }

  async updateUser(id: number, data: Partial<User>): Promise<User> {
    const [user] = await db
      .update(users)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(users.id, id))
      .returning();
    return user;
  }

  async getUserById(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  //Dummy implementations for waitlist methods - MemStorage handles these.
  async addToWaitlist(entry: InsertWaitlist): Promise<Waitlist> { throw new Error("Method not implemented."); }
  async getWaitlistCount(): Promise<number> { throw new Error("Method not implemented."); }
}

export const storage = {
    ...new MemStorage(),
    ...new DbStorage()
};