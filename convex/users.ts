import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// Create or retrieve user on first login
export const upsertUser = mutation({
  args: {
    clerkId: v.string(),
    email:   v.string(),
    name:    v.string(),
  },
  handler: async (ctx, { clerkId, email, name }) => {
    const existing = await ctx.db
      .query("users")
      .withIndex("by_clerk", (q) => q.eq("clerkId", clerkId))
      .unique();

    if (existing) {
      if (existing.email !== email || existing.name !== name) {
        await ctx.db.patch(existing._id, { email, name });
      }
      return existing._id;
    }

    return await ctx.db.insert("users", {
      clerkId,
      email,
      name,
      credits:   0,
      createdAt: Date.now(),
    });
  },
});

// Get current user
export const getUser = query({
  args: { clerkId: v.string() },
  handler: async (ctx, { clerkId }) => {
    return await ctx.db
      .query("users")
      .withIndex("by_clerk", (q) => q.eq("clerkId", clerkId))
      .unique();
  },
});

// Get credit balance
export const getCredits = query({
  args: { clerkId: v.string() },
  handler: async (ctx, { clerkId }) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk", (q) => q.eq("clerkId", clerkId))
      .unique();
    return user?.credits ?? 0;
  },
});

// Add credits after successful payment
export const addCredits = mutation({
  args: {
    clerkId: v.string(),
    credits: v.number(),
    orderId: v.string(),
  },
  handler: async (ctx, { clerkId, credits, orderId }) => {
    // Verify payment exists and is paid
    const payment = await ctx.db
      .query("payments")
      .withIndex("by_orderId", (q) => q.eq("orderId", orderId))
      .unique();

    if (!payment || payment.status !== "paid") {
      throw new Error("Payment not confirmed");
    }

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk", (q) => q.eq("clerkId", clerkId))
      .unique();

    if (!user) throw new Error("User not found");

    await ctx.db.patch(user._id, {
      credits: user.credits + credits,
    });

    return { success: true, newBalance: user.credits + credits };
  },
});

// Deduct 1 credit before diagnosis (atomic check)
export const deductCredit = mutation({
  args: { clerkId: v.string() },
  handler: async (ctx, { clerkId }) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk", (q) => q.eq("clerkId", clerkId))
      .unique();

    if (!user) throw new Error("User not found");
    if (user.credits < 1) throw new Error("Insufficient credits");

    await ctx.db.patch(user._id, {
      credits: user.credits - 1,
    });

    return { success: true, remaining: user.credits - 1 };
  },
});

export const refundCredit = mutation({
  args: { clerkId: v.string() },
  handler: async (ctx, { clerkId }) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk", (q) => q.eq("clerkId", clerkId))
      .unique();

    if (!user) throw new Error("User not found");

    await ctx.db.patch(user._id, {
      credits: user.credits + 1,
    });

    return { success: true, restored: user.credits + 1 };
  },
});
