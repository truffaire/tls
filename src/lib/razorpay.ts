interface RazorpayOptions {
  orderId:     string;
  amount:      number;   // in paise
  name:        string;
  description: string;
  prefill:     { name: string; email: string };
  onSuccess:   (paymentId: string, orderId: string, signature: string) => void;
  onFailure:   (reason?: string) => void;
}

function loadRazorpayScript(): Promise<boolean> {
  return new Promise((resolve) => {
    if ((window as any).Razorpay) { resolve(true); return; }
    const script   = document.createElement("script");
    script.src     = "https://checkout.razorpay.com/v1/checkout.js";
    script.onload  = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}

export async function initRazorpay(opts: RazorpayOptions) {
  const key = import.meta.env.VITE_RAZORPAY_KEY_ID?.trim();
  if (!key) throw new Error("Missing VITE_RAZORPAY_KEY_ID");

  const loaded = await loadRazorpayScript();
  if (!loaded) throw new Error("Razorpay script failed to load");

  console.log("[Razorpay] Opening checkout", { key, orderId: opts.orderId, amount: opts.amount });

  return new Promise<void>((resolve, reject) => {
    // Guard: only settle the promise once
    let settled = false;
    const settle = (fn: () => void) => {
      if (settled) return;
      settled = true;
      fn();
    };

    const rzp = new (window as any).Razorpay({
      key,
      amount:      opts.amount,
      currency:    "INR",
      name:        opts.name,
      description: opts.description,
      order_id:    opts.orderId,
      prefill: {
        name:  opts.prefill.name,
        email: opts.prefill.email,
      },
      theme: { color: "#004643" },
      handler: (response: any) => {
        console.log("[Razorpay] Payment success", response);
        settle(() => {
          opts.onSuccess(
            response.razorpay_payment_id,
            response.razorpay_order_id,
            response.razorpay_signature,
          );
          resolve();
        });
      },
      modal: {
        escape: true,
        ondismiss: () => {
          console.warn("[Razorpay] Modal dismissed");
          settle(() => {
            opts.onFailure("dismissed");
            reject(new Error("Payment dismissed"));
          });
        },
      },
    });

    rzp.on("payment.failed", (response: any) => {
      console.error("[Razorpay] payment.failed", response.error);
      const desc = response.error?.description ?? response.error?.reason ?? "Payment failed";
      settle(() => {
        opts.onFailure(desc);
        reject(new Error(desc));
      });
    });

    rzp.open();
  });
}
