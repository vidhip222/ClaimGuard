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

  s3key: s.text("s3key").notNull(),
  fraudScore: s.real("fraud_score").notNull(),
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
