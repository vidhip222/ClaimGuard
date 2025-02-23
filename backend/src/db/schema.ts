import { relations } from "drizzle-orm";
import * as s from "drizzle-orm/sqlite-core";

export const claims = s.sqliteTable("claims", {
  id: s.text("id").primaryKey().notNull(),
  recomendedPayment: s.real("recomended_payment"),
});

export const images = s.sqliteTable("images", {
  id: s.text("id").primaryKey().notNull(),
  claimId: s
    .text("claim_id")
    .notNull()
    .references(() => claims.id),
  type: s.text("type").notNull().$type<"image" | "video" | "audio" | "text">(),

  fraudScore: s.real("fraud_score").notNull().default(0),
  count: s.integer("count").notNull().default(1),
  processed: s.integer("processed").notNull().default(0),
  cost: s.real("cost"),
});

export const claimsRelations = relations(claims, ({ many }) => ({
  images: many(images),
}));

export const imagesRelations = relations(images, ({ one }) => ({
  claims: one(claims, {
    fields: [images.claimId],
    references: [claims.id],
  }),
}));
