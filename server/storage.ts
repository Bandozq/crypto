import { users, opportunities, type User, type InsertUser, type Opportunity, type InsertOpportunity } from "@shared/schema";
import { db } from "./db";
import { eq, desc, like, and, gte, notLike } from "drizzle-orm";

export interface IStorage {
  // User methods
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Opportunity methods
  getAllOpportunities(): Promise<Opportunity[]>;
  getOpportunity(id: number): Promise<Opportunity | undefined>;
  createOpportunity(opportunity: InsertOpportunity): Promise<Opportunity>;
  updateOpportunity(id: number, updates: Partial<InsertOpportunity>): Promise<Opportunity | undefined>;
  deleteOpportunity(id: number): Promise<boolean>;
  getOpportunitiesByCategory(category: string): Promise<Opportunity[]>;
  getOpportunitiesByTimeFrame(hours: number): Promise<Opportunity[]>;
  searchOpportunities(query: string): Promise<Opportunity[]>;
  getHotOpportunities(limit: number): Promise<Opportunity[]>;
}

export class DatabaseStorage implements IStorage {
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(insertUser)
      .returning();
    return user;
  }

  async getAllOpportunities(): Promise<Opportunity[]> {
    return await db.select().from(opportunities)
    .where(
      and(
        notLike(opportunities.name, '%bitcoin%'),
        notLike(opportunities.name, '%ethereum%'),
        notLike(opportunities.name, '%btc%'),
        notLike(opportunities.name, '%eth%')
      )
    )
    .orderBy(desc(opportunities.hotnessScore));
  }

  async getOpportunity(id: number): Promise<Opportunity | undefined> {
    const [opportunity] = await db.select().from(opportunities).where(eq(opportunities.id, id));
    return opportunity || undefined;
  }

  async createOpportunity(insertOpportunity: InsertOpportunity): Promise<Opportunity> {
    const [opportunity] = await db
      .insert(opportunities)
      .values(insertOpportunity)
      .returning();
    return opportunity;
  }

  async updateOpportunity(id: number, updates: Partial<InsertOpportunity>): Promise<Opportunity | undefined> {
    const [opportunity] = await db
      .update(opportunities)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(opportunities.id, id))
      .returning();
    return opportunity || undefined;
  }

  async deleteOpportunity(id: number): Promise<boolean> {
    const result = await db.delete(opportunities).where(eq(opportunities.id, id));
    return result.rowCount! > 0;
  }

  async getOpportunitiesByCategory(category: string): Promise<Opportunity[]> {
    return await db
      .select()
      .from(opportunities)
      .where(eq(opportunities.category, category))
      .orderBy(desc(opportunities.hotnessScore));
  }

  async getOpportunitiesByTimeFrame(hours: number): Promise<Opportunity[]> {
    const cutoffTime = new Date(Date.now() - hours * 60 * 60 * 1000);
    return await db
      .select()
      .from(opportunities)
      .where(gte(opportunities.createdAt, cutoffTime))
      .orderBy(desc(opportunities.hotnessScore));
  }

  async searchOpportunities(query: string): Promise<Opportunity[]> {
    const searchTerm = `%${query}%`;
    return await db
      .select()
      .from(opportunities)
      .where(
        and(
          eq(opportunities.isActive, true),
          like(opportunities.name, searchTerm)
        )
      )
      .orderBy(desc(opportunities.hotnessScore));
  }

  async getHotOpportunities(limit: number): Promise<Opportunity[]> {
    return await db
      .select()
      .from(opportunities)
      .where(
        and(
          eq(opportunities.isActive, true),
          notLike(opportunities.name, '%bitcoin%'),
          notLike(opportunities.name, '%ethereum%'),
          notLike(opportunities.name, '%btc%'),
          notLike(opportunities.name, '%eth%')
        )
      )
      .orderBy(desc(opportunities.hotnessScore))
      .limit(limit);
  }
}

export const storage = new DatabaseStorage();