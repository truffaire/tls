import { useEffect } from "react";
import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import Navbar from "@/components/Navbar";
import { CREDIT_PACKS } from "@/lib/constants";
import { initRazorpay } from "@/lib/razorpay";
import { useTLSUser } from "@/lib/auth";

export default function Dashboard() {
  const { user } = useTLSUser();
  const navigate = useNavigate();
  const upsertUser = useMutation(api.users.upsertUser);
  const credits = useQuery(api.users.getCredits, { clerkId: user?.id ?? "" });
  const recentReports = useQuery(api.diagnose.getUserReports, { userId: user?.id ?? "" });
  const createPayment = useMutation(api.payments.createPaymentRecord);
  const confirmPayment = useMutation(api.payments.confirmPayment);
  const orderApiUrl = `${import.meta.env.VITE_CONVEX_SITE_URL}/api/create-order`;
  const [isPayingPackId, setIsPayingPackId] = useState<string | null>(null);
  const [paymentMessage, setPaymentMessage] = useState<string | null>(null);
  const [paymentError, setPaymentError] = useState<string | null>(null);
  const displayCredits = useMemo(() => credits ?? 0, [credits]);

  useEffect(() => {
    if (user) {
      upsertUser({
        clerkId: user.id,
        email: user.emailAddresses[0]?.emailAddress ?? "",
        name: user.fullName ?? user.firstName ?? "User",
      });
    }
  }, [upsertUser, user]);

  const handleBuyCredits = async (packId: string) => {
    console.log("Step 1 - starting purchase", packId);
    console.log("Step 1b - user", user);
    console.log("Step 1c - orderApiUrl", orderApiUrl);

    if (!user || isPayingPackId) {
      console.warn("Step 1 - BLOCKED: no user or already paying", { user, isPayingPackId });
      return;
    }

    const pack = CREDIT_PACKS.find((p) => p.id === packId);
    if (!pack) {
      console.error("Step 1 - BLOCKED: pack not found", packId);
      return;
    }

    try {
      setIsPayingPackId(packId);
      setPaymentError(null);
      setPaymentMessage(`Preparing ${pack.name} checkout...`);

      console.log("Step 2 - fetching order from", orderApiUrl, { packId, amount: pack.price });
      const orderRes = await fetch(orderApiUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ packId, amount: pack.price }),
      });
      console.log("Step 2b - order response status", orderRes.status, orderRes.ok);
      const orderData = await orderRes.json();
      console.log("Step 2c - order response body", orderData);

      if (!orderRes.ok || !orderData.orderId) {
        throw new Error(orderData.error ?? "Failed to create order");
      }

      const { orderId } = orderData;
      console.log("Step 3 - got orderId", orderId);

      await createPayment({
        userId: user.id,
        orderId,
        packId,
        amount: pack.price,
        credits: pack.credits,
      });
      console.log("Step 3b - payment record created in Convex");

      setPaymentMessage("Opening Razorpay...");

      console.log("Step 4 - opening Razorpay", { orderId, amount: pack.price * 100, key: import.meta.env.VITE_RAZORPAY_KEY_ID });
      await initRazorpay({
        orderId,
        amount: pack.price * 100,
        name: "Truffaire LeafScan",
        description: `${pack.name} — ${pack.credits} credits`,
        prefill: {
          name: user.fullName ?? "",
          email: user.emailAddresses[0]?.emailAddress ?? "",
        },
        onSuccess: async (paymentId: string, razorpayOrderId: string, signature: string) => {
          console.log("Step 5 - payment success", { paymentId, razorpayOrderId, signature });
          const result = await confirmPayment({
            orderId: razorpayOrderId,
            paymentId,
            clerkId: user.id,
            signature,
          });
          console.log("Step 5b - confirmPayment result", result);
          setPaymentMessage(
            `Payment successful. ${result.credits} credits added. New balance: ${result.newBalance}.`
          );
        },
        onFailure: (reason?: string) => {
          console.error("Step 4 - Razorpay onFailure", reason);
          if (reason && reason !== "dismissed") {
            setPaymentError(`Payment failed: ${reason}. Please try again.`);
          } else {
            setPaymentError("Payment was cancelled. Please try again.");
          }
        },
      });
    } catch (err) {
      console.error("FULL ERROR:", err);
      console.error("ERROR MESSAGE:", err instanceof Error ? err.message : String(err));
      console.error("ERROR STACK:", err instanceof Error ? err.stack : "no stack");
      setPaymentError(err instanceof Error ? err.message : "Payment failed. Please try again.");
    } finally {
      setIsPayingPackId(null);
    }
  };

  const recentThree = recentReports?.slice(0, 3) ?? [];

  return (
    <div style={{ background: "#fff", minHeight: "100vh" }}>
      <Navbar />

      <div style={{ padding: "80px 28px 40px" }}>
        <div style={{ marginBottom: 32 }}>
          <div style={{ fontSize: 11, fontWeight: 500, letterSpacing: "0.1em", textTransform: "uppercase", color: "#004643", marginBottom: 8 }}>
            Dashboard
          </div>
          <h1 style={{ fontSize: "clamp(24px,6vw,36px)", fontWeight: 300, letterSpacing: "-0.025em", lineHeight: 1.1 }}>
            Welcome, <strong style={{ fontWeight: 600 }}>{user?.firstName ?? "there"}</strong>
          </h1>
        </div>

        <div style={{
          background: "#0C1618", borderRadius: 20, padding: 24, marginBottom: 12,
        }}>
          <div style={{ fontSize: 10, fontWeight: 500, textTransform: "uppercase", letterSpacing: "0.09em", color: "rgba(255,255,255,0.3)", marginBottom: 10 }}>
            Credit Balance
          </div>
          {credits === undefined ? (
            <CreditsSkeleton />
          ) : (
            <div style={{ fontSize: 52, fontWeight: 300, letterSpacing: "-0.04em", color: "white", lineHeight: 1 }}>
              {displayCredits}
            </div>
          )}
          <div style={{ fontSize: 12, color: "rgba(255,255,255,0.3)", marginTop: 5 }}>
            {credits === undefined ? "Loading balance..." : displayCredits === 1 ? "1 report remaining" : `${displayCredits} reports remaining`}
          </div>
        </div>

        {paymentMessage ? (
          <div style={{ background: "#e8f0ef", color: "#004643", borderRadius: 14, padding: "12px 14px", fontSize: 13, marginBottom: 12 }}>
            {paymentMessage}
          </div>
        ) : null}

        {paymentError ? (
          <div style={{ background: "#FEE2E2", color: "#991B1B", borderRadius: 14, padding: "12px 14px", fontSize: 13, marginBottom: 12 }}>
            {paymentError}
          </div>
        ) : null}

        <button
          onClick={() => {
            if (displayCredits > 0) {
              navigate("/scan");
            } else {
              document.getElementById("pricing")?.scrollIntoView({ behavior: "smooth" });
            }
          }}
          style={{
            width: "100%", padding: "16px", borderRadius: 14,
            background: "#004643", color: "white", border: "none",
            fontFamily: "'DM Sans', sans-serif", fontSize: 15, fontWeight: 500,
            cursor: "pointer", marginBottom: 28, letterSpacing: "0.01em",
            transition: "background 0.18s",
          }}
          onMouseEnter={e => (e.currentTarget.style.background = "#0C1618")}
          onMouseLeave={e => (e.currentTarget.style.background = "#004643")}
        >
          {displayCredits > 0 ? "New Scan" : "Buy Credits to Scan"}
        </button>

        <div id="pricing" style={{ marginBottom: 36 }}>
          <div style={{ fontSize: 11, fontWeight: 500, letterSpacing: "0.1em", textTransform: "uppercase", color: "#AAAAAA", marginBottom: 14 }}>
            Credit Packs
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {CREDIT_PACKS.map((pack) => (
              <div key={pack.id} style={{
                border: `1px solid ${pack.popular ? "#0C1618" : "#E8E8E8"}`,
                borderRadius: 16, padding: "16px 18px",
                background: pack.popular ? "#0C1618" : "white",
                display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12,
              }}>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 500, color: pack.popular ? "white" : "#0C1618" }}>
                    {pack.name}
                  </div>
                  <div style={{ fontSize: 11, color: pack.popular ? "rgba(255,255,255,0.35)" : "#AAAAAA", marginTop: 2 }}>
                    {pack.credits} reports · ₹{pack.perReport}/report
                  </div>
                </div>
                <button
                  disabled={isPayingPackId !== null}
                  onClick={() => handleBuyCredits(pack.id)}
                  style={{
                    background: pack.popular ? "white" : "#0C1618",
                    color: pack.popular ? "#0C1618" : "white",
                    border: "none", borderRadius: 100,
                    padding: "8px 18px", fontFamily: "'DM Sans', sans-serif",
                    fontSize: 13, fontWeight: 500, cursor: isPayingPackId !== null ? "wait" : "pointer",
                    whiteSpace: "nowrap", flexShrink: 0,
                    opacity: isPayingPackId !== null && isPayingPackId !== pack.id ? 0.65 : 1,
                  }}
                >
                  {isPayingPackId === pack.id ? "Processing..." : `₹${pack.price}`}
                </button>
              </div>
            ))}
          </div>
        </div>

        {recentThree.length > 0 && (
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
              <div style={{ fontSize: 11, fontWeight: 500, letterSpacing: "0.1em", textTransform: "uppercase", color: "#AAAAAA" }}>
                Recent Reports
              </div>
              <button
                onClick={() => navigate("/history")}
                style={{ fontSize: 12, color: "#004643", background: "none", border: "none", cursor: "pointer", fontFamily: "'DM Sans', sans-serif", fontWeight: 500 }}
              >
                View all
              </button>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {recentThree.map((report: any) => (
                <ReportRow key={report._id} report={report} onClick={() => navigate(`/report/${report.reportId}`)} />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function CreditsSkeleton() {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      <div
        style={{
          width: 84,
          height: 48,
          borderRadius: 12,
          background: "linear-gradient(90deg, rgba(255,255,255,0.12) 0%, rgba(255,255,255,0.22) 50%, rgba(255,255,255,0.12) 100%)",
          backgroundSize: "200% 100%",
          animation: "tls-shimmer 1.4s ease-in-out infinite",
        }}
      />
      <div
        style={{
          width: 140,
          height: 12,
          borderRadius: 999,
          background: "linear-gradient(90deg, rgba(255,255,255,0.08) 0%, rgba(255,255,255,0.18) 50%, rgba(255,255,255,0.08) 100%)",
          backgroundSize: "200% 100%",
          animation: "tls-shimmer 1.4s ease-in-out infinite",
        }}
      />
      <style>{`@keyframes tls-shimmer { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }`}</style>
    </div>
  );
}

function ReportRow({ report, onClick }: { report: any; onClick: () => void }) {
  const date = new Date(report.createdAt).toLocaleDateString("en-IN", {
    day: "numeric", month: "short", year: "numeric",
  });

  return (
    <div
      onClick={onClick}
      style={{
        background: "#FAFAFA", borderRadius: 14, padding: "14px 16px",
        cursor: "pointer", transition: "background 0.15s",
        display: "flex", justifyContent: "space-between", alignItems: "center",
      }}
      onMouseEnter={e => (e.currentTarget.style.background = "#e8f0ef")}
      onMouseLeave={e => (e.currentTarget.style.background = "#FAFAFA")}
    >
      <div>
        <div style={{ fontSize: 13, fontWeight: 500 }}>{report.diagnosis?.primary}</div>
        <div style={{ fontSize: 11, color: "#AAAAAA", marginTop: 2 }}>{report.crop} · {date}</div>
      </div>
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#AAAAAA" strokeWidth="2" strokeLinecap="round">
        <polyline points="9 18 15 12 9 6"/>
      </svg>
    </div>
  );
}
