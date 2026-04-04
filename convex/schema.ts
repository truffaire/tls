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
  }).index("by_clerk", ["clerkId"]),

  // ── REPORTS ────────────────────────────────────────────────
  reports: defineTable({
    reportId:  v.string(),   // TLS-2026-KA-XXXXXX
    userId:    v.string(),   // clerkId
    crop:      v.string(),
    language:  v.string(),
    imageUrl:  v.string(),
    diagnosis: v.any(),      // DiagnosisResult JSON
    createdAt: v.number(),
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
