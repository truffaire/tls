import { v } from "convex/values";
import { internalMutation, query } from "./_generated/server";

export const saveReport = internalMutation({
  args: {
    reportId: v.string(),
    userId: v.string(),
    crop: v.string(),
    language: v.string(),
    location: v.optional(v.string()),
    soilType: v.optional(v.string()),
    imageUrl: v.string(),
    diagnosis: v.any(),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("reports", {
      reportId: args.reportId,
      userId: args.userId,
      crop: args.crop,
      language: args.language,
      ...(args.location ? { location: args.location } : {}),
      ...(args.soilType ? { soilType: args.soilType } : {}),
      imageUrl: args.imageUrl,
      diagnosis: args.diagnosis,
      createdAt: Date.now(),
    });
  },
});

export const getReport = query({
  args: { reportId: v.string() },
  handler: async (ctx, { reportId }) => {
    return await ctx.db
      .query("reports")
      .withIndex("by_reportId", (q) => q.eq("reportId", reportId))
      .unique();
  },
});

export const getUserReports = query({
  args: { userId: v.string() },
  handler: async (ctx, { userId }) => {
    return await ctx.db
      .query("reports")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .order("desc")
      .collect();
  },
});
