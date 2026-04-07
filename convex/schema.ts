import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  // ── USERS ──────────────────────────────────────────────────
  users: defineTable({
    clerkId:   v.string(),
    email:     v.string(),
    name:      v.string(),
    credits:   v.number(),
    createdAt: v.number(),
    farmSize:  v.optional(v.number()),  // acres
  }).index("by_clerk", ["clerkId"]),

  // ── REPORTS ────────────────────────────────────────────────
  reports: defineTable({
    reportId:        v.string(),                      // ARCORA-2026-KA-XXXXXX
    userId:          v.string(),                      // clerkId
    crop:            v.string(),
    location:        v.optional(v.string()),          // e.g. "Chitradurga, Karnataka"
    soilType:        v.optional(v.string()),          // e.g. "Red / Laterite"
    imageUrl:        v.string(),
    diagnosis:       v.any(),                         // DiagnosisResult JSON
    createdAt:       v.number(),
    // ── Extended fields (Priority 3) ──
    plantParts:      v.optional(v.array(v.string())), // ["Leaf","Stem","Fruit"...]
    growthStage:     v.optional(v.string()),
    symptomDuration: v.optional(v.string()),
    spreadExtent:    v.optional(v.string()),
    recentActivity:  v.optional(v.array(v.string())),
  })
    .index("by_user",     ["userId"])
    .index("by_reportId", ["reportId"]),

  // ── PAYMENTS ───────────────────────────────────────────────
  payments: defineTable({
    userId:    v.string(),
    orderId:   v.string(),   // Razorpay order ID
    paymentId: v.optional(v.string()),
    packId:    v.string(),
    amount:    v.number(),
    credits:   v.number(),
    status:    v.union(
      v.literal("pending"),
      v.literal("paid"),
      v.literal("failed")
    ),
    createdAt: v.number(),
  })
    .index("by_user",    ["userId"])
    .index("by_orderId", ["orderId"]),
});
