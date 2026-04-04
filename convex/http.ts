import { httpRouter } from "convex/server";
import { httpAction } from "./_generated/server";

const http = httpRouter();

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

const PACK_AMOUNTS: Record<string, number> = {
  starter: 199,
  farm: 599,
  agro: 1299,
};

export const createOrder = httpAction(async (_ctx, request) => {
  if (request.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: CORS_HEADERS,
    });
  }

  if (request.method !== "POST") {
    return Response.json(
      { error: "Method not allowed" },
      { status: 405, headers: CORS_HEADERS }
    );
  }

  const body = await request.json();
  const packId = typeof body.packId === "string" ? body.packId : "";
  const amount = typeof body.amount === "number" ? body.amount : Number(body.amount);

  const razorpayKeyId = process.env.RAZORPAY_KEY_ID?.trim();
  const razorpayKeySecret = process.env.RAZORPAY_KEY_SECRET?.trim();

  if (!razorpayKeyId || !razorpayKeySecret) {
    return Response.json(
      { error: "Razorpay credentials are not configured" },
      { status: 500, headers: CORS_HEADERS }
    );
  }

  if (!packId || !Number.isFinite(amount) || amount <= 0) {
    return Response.json(
      { error: "Invalid packId or amount" },
      { status: 400, headers: CORS_HEADERS }
    );
  }

  if (PACK_AMOUNTS[packId] !== amount) {
    return Response.json(
      { error: "Amount does not match selected pack" },
      { status: 400, headers: CORS_HEADERS }
    );
  }

  try {
    const response = await fetch("https://api.razorpay.com/v1/orders", {
      method: "POST",
      headers: {
        Authorization: `Basic ${btoa(`${razorpayKeyId}:${razorpayKeySecret}`)}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        amount: Math.round(amount * 100),
        currency: "INR",
        receipt: `tls_${packId}_${Date.now()}`,
      }),
    });

    if (!response.ok) {
      const details = await response.text();
      return Response.json(
        { error: "Failed to create Razorpay order", details },
        { status: 502, headers: CORS_HEADERS }
      );
    }

    const order = await response.json();
    return Response.json(
      { orderId: order.id },
      { status: 200, headers: CORS_HEADERS }
    );
  } catch (error) {
    return Response.json(
      {
        error: "Failed to create Razorpay order",
        details: error instanceof Error ? error.message : "Unknown Razorpay error",
      },
      { status: 502, headers: CORS_HEADERS }
    );
  }
});

http.route({
  path: "/api/create-order",
  method: "POST",
  handler: createOrder,
});

http.route({
  path: "/api/create-order",
  method: "OPTIONS",
  handler: createOrder,
});

export default http;
