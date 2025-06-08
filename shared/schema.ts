import { pgTable, text, serial, integer, timestamp, real, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const opportunities = pgTable("opportunities", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description").notNull(),
  category: text("category").notNull(), // P2E, Airdrops, DeFi, NFT, etc.
  imageUrl: text("image_url"),
  websiteUrl: text("website_url"),
  discordUrl: text("discord_url"),
  twitterUrl: text("twitter_url"),
  estimatedValue: real("estimated_value"),
  timeRemaining: text("time_remaining"),
  deadline: timestamp("deadline"),
  participants: integer("participants"),
  hotnessScore: real("hotness_score").notNull().default(0),
  twitterFollowers: integer("twitter_followers").default(0),
  discordMembers: integer("discord_members").default(0),
  tradingVolume: real("trading_volume").default(0),
  marketCap: real("market_cap").default(0),
  isActive: boolean("is_active").notNull().default(true),
  sourceUrl: text("source_url").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertOpportunitySchema = createInsertSchema(opportunities).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertOpportunity = z.infer<typeof insertOpportunitySchema>;
export type Opportunity = typeof opportunities.$inferSelect;

// Keep the existing users table
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
