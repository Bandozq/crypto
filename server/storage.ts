import { users, opportunities, type User, type InsertUser, type Opportunity, type InsertOpportunity } from "@shared/schema";

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

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private opportunities: Map<number, Opportunity>;
  private currentUserId: number;
  private currentOpportunityId: number;

  constructor() {
    this.users = new Map();
    this.opportunities = new Map();
    this.currentUserId = 1;
    this.currentOpportunityId = 1;
  }

  // User methods
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentUserId++;
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }

  // Opportunity methods
  async getAllOpportunities(): Promise<Opportunity[]> {
    return Array.from(this.opportunities.values())
      .filter(opp => opp.isActive)
      .sort((a, b) => (b.hotnessScore || 0) - (a.hotnessScore || 0));
  }

  async getOpportunity(id: number): Promise<Opportunity | undefined> {
    return this.opportunities.get(id);
  }

  async createOpportunity(insertOpportunity: InsertOpportunity): Promise<Opportunity> {
    const id = this.currentOpportunityId++;
    const now = new Date();
    const opportunity: Opportunity = {
      ...insertOpportunity,
      id,
      createdAt: now,
      updatedAt: now,
      imageUrl: insertOpportunity.imageUrl || null,
      websiteUrl: insertOpportunity.websiteUrl || null,
      discordUrl: insertOpportunity.discordUrl || null,
      twitterUrl: insertOpportunity.twitterUrl || null,
      estimatedValue: insertOpportunity.estimatedValue || null,
      timeRemaining: insertOpportunity.timeRemaining || null,
      deadline: insertOpportunity.deadline || null,
      participants: insertOpportunity.participants || null,
      hotnessScore: insertOpportunity.hotnessScore || 0,
      twitterFollowers: insertOpportunity.twitterFollowers || 0,
      discordMembers: insertOpportunity.discordMembers || 0,
      tradingVolume: insertOpportunity.tradingVolume || 0,
      marketCap: insertOpportunity.marketCap || 0,
      isActive: insertOpportunity.isActive !== undefined ? insertOpportunity.isActive : true,
    };
    this.opportunities.set(id, opportunity);
    return opportunity;
  }

  async updateOpportunity(id: number, updates: Partial<InsertOpportunity>): Promise<Opportunity | undefined> {
    const existing = this.opportunities.get(id);
    if (!existing) return undefined;

    const updated: Opportunity = {
      ...existing,
      ...updates,
      updatedAt: new Date(),
    };
    this.opportunities.set(id, updated);
    return updated;
  }

  async deleteOpportunity(id: number): Promise<boolean> {
    return this.opportunities.delete(id);
  }

  async getOpportunitiesByCategory(category: string): Promise<Opportunity[]> {
    return Array.from(this.opportunities.values())
      .filter(opp => opp.isActive && opp.category.toLowerCase() === category.toLowerCase())
      .sort((a, b) => (b.hotnessScore || 0) - (a.hotnessScore || 0));
  }

  async getOpportunitiesByTimeFrame(hours: number): Promise<Opportunity[]> {
    const cutoffTime = new Date(Date.now() - hours * 60 * 60 * 1000);
    return Array.from(this.opportunities.values())
      .filter(opp => opp.isActive && opp.createdAt >= cutoffTime)
      .sort((a, b) => (b.hotnessScore || 0) - (a.hotnessScore || 0));
  }

  async searchOpportunities(query: string): Promise<Opportunity[]> {
    const searchTerm = query.toLowerCase();
    return Array.from(this.opportunities.values())
      .filter(opp => 
        opp.isActive && (
          opp.name.toLowerCase().includes(searchTerm) ||
          opp.description.toLowerCase().includes(searchTerm) ||
          opp.category.toLowerCase().includes(searchTerm)
        )
      )
      .sort((a, b) => (b.hotnessScore || 0) - (a.hotnessScore || 0));
  }

  async getHotOpportunities(limit: number): Promise<Opportunity[]> {
    return Array.from(this.opportunities.values())
      .filter(opp => opp.isActive)
      .sort((a, b) => (b.hotnessScore || 0) - (a.hotnessScore || 0))
      .slice(0, limit);
  }
}

export const storage = new MemStorage();
