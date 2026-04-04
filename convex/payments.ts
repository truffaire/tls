import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

async function createSignature(secret: string, payload: string) {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );

  const signature = await crypto.subtle.sign(
    "HMAC",
    key,
    new TextEncoder().encode(payload)
  );

  return Array.from(new Uint8Array(signature))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

// Create a pending payment record
export const createPaymentRecord = mutation({
  args: {
    userId:  v.string(),
    orderId: v.string(),
    packId:  v.string(),
    amount:  v.number(),
    credits: v.number(),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("payments")
      .withIndex("by_orderId", (q) => q.eq("orderId", args.orderId))
      .unique();

    if (existing) {
      if (
        existing.userId !== args.userId ||
        existing.packId !== args.packId ||
        existing.amount !== args.amount ||
        existing.credits !== args.credits
      ) {
        throw new Error("Order already exists with different payment details");
      }

      return existing._id;
    }

    return await ctx.db.insert("payments", {
      ...args,
      status: "pending",
      createdAt: Date.now(),
    });
  },
});

// Mark payment as paid after Razorpay signature verification
export const confirmPayment = mutation({
  args: {
    orderId: v.string(),
    paymentId: v.string(),
    clerkId: v.string(),
    signature: v.string(),
  },
  handler: async (ctx, { orderId, paymentId, clerkId, signature }) => {
    const payment = await ctx.db
      .query("payments")
      .withIndex("by_orderId", (q) => q.eq("orderId", orderId))
      .unique();

    if (!payment) throw new Error("Payment record not found");
    if (payment.userId !== clerkId) throw new Error("User mismatch");

    if (payment.status === "paid") {
      const existingUser = await ctx.db
        .query("users")
        .withIndex("by_clerk", (q) => q.eq("clerkId", clerkId))
        .unique();

      return {
        success: true,
        credits: payment.credits,
        newBalance: existingUser?.credits ?? 0,
      };
    }

    const secret = process.env.RAZORPAY_KEY_SECRET;
    if (!secret) throw new Error("Missing Razorpay secret");

    const expectedSignature = await createSignature(
      secret,
      `${orderId}|${paymentId}`
    );

    if (expectedSignature !== signature) {
      await ctx.db.patch(payment._id, {
        status: "failed",
      });
      throw new Error("Invalid payment signature");
    }

    await ctx.db.patch(payment._id, {
      status: "paid",
      paymentId,
    });

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk", (q) => q.eq("clerkId", clerkId))
      .unique();

    if (!user) throw new Error("User not found");

    await ctx.db.patch(user._id, {
      credits: user.credits + payment.credits,
    });

    return {
      success: true,
      credits: payment.credits,
      newBalance: user.credits + payment.credits,
    };
  },
});

// Get payment history for user
export const getUserPayments = query({
  args: { clerkId: v.string() },
  handler: async (ctx, { clerkId }) => {
    return await ctx.db
      .query("payments")
      .withIndex("by_user", (q) => q.eq("userId", clerkId))
      .order("desc")
      .collect();
  },
});
