import { v } from "convex/values";
import { internalMutation, query } from "./_generated/server";

export const saveReport = internalMutation({
  args: {
    reportId:        v.string(),
    userId:          v.string(),
    crop:            v.string(),
    location:        v.optional(v.string()),
    soilType:        v.optional(v.string()),
    imageUrl:        v.string(),
    diagnosis:       v.any(),
    plantParts:      v.optional(v.array(v.string())),
    growthStage:     v.optional(v.string()),
    symptomDuration: v.optional(v.string()),
    spreadExtent:    v.optional(v.string()),
    recentActivity:  v.optional(v.array(v.string())),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("reports", {
      reportId:  args.reportId,
      userId:    args.userId,
      crop:      args.crop,
      imageUrl:  args.imageUrl,
      diagnosis: args.diagnosis,
      createdAt: Date.now(),
      ...(args.location        ? { location:        args.location }        : {}),
      ...(args.soilType        ? { soilType:        args.soilType }        : {}),
      ...(args.plantParts      ? { plantParts:      args.plantParts }      : {}),
      ...(args.growthStage     ? { growthStage:     args.growthStage }     : {}),
      ...(args.symptomDuration ? { symptomDuration: args.symptomDuration } : {}),
      ...(args.spreadExtent    ? { spreadExtent:    args.spreadExtent }    : {}),
      ...(args.recentActivity  ? { recentActivity:  args.recentActivity }  : {}),
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

// ── District disease history (last 30 days) ─────────────────
export const getDistrictHistory = query({
  args: { district: v.string() },
  handler: async (ctx, { district }) => {
    const thirtyDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;
    const all = await ctx.db
      .query("reports")
      .filter((q) => q.gte(q.field("createdAt"), thirtyDaysAgo))
      .collect();

    const districtLower = district.toLowerCase();
    const inDistrict = all.filter((r) =>
      r.location?.toLowerCase().includes(districtLower)
    );

    // Count by primary diagnosis
    const counts: Record<string, number> = {};
    for (const r of inDistrict) {
      const primary =
        typeof r.diagnosis?.primary === "string" ? r.diagnosis.primary : null;
      if (primary && primary !== "Unknown" && primary !== "Further agronomic review required") {
        counts[primary] = (counts[primary] ?? 0) + 1;
      }
    }

    // Return top 3
    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([disease, count]) => ({ disease, count }));
  },
});
