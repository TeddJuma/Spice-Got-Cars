const RESEND_API_KEY = import.meta.env.VITE_RESEND_API_KEY;
const OWNER_EMAIL = import.meta.env.VITE_OWNER_EMAIL || "info@spicegotcars.co.ke";

export async function sendNewSubmissionEmail(data: {
  make: string;
  model: string;
  year: number;
  askingPrice: number;
  sellerName: string;
  sellerPhone: string;
  submissionId: string;
  engineCapacityCc?: number;
}): Promise<boolean> {
  if (!RESEND_API_KEY) {
    console.warn("VITE_RESEND_API_KEY is not configured. Email notification skipped.");
    return false;
  }

  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "Spice Got Cars <noreply@spicegotcars.co.ke>",
        to: [OWNER_EMAIL],
        subject: `New Sell Submission: ${data.year} ${data.make} ${data.model}`,
        html: `
          <h2>New Car Sell Submission</h2>
          <p><strong>Vehicle:</strong> ${data.year} ${data.make} ${data.model}</p>
          <p><strong>Asking Price:</strong> KES ${data.askingPrice.toLocaleString()}</p>
          ${data.engineCapacityCc != null ? `<p><strong>Engine capacity:</strong> ${data.engineCapacityCc.toLocaleString()} cc</p>` : ""}
          <p><strong>Seller:</strong> ${data.sellerName}</p>
          <p><strong>Phone:</strong> ${data.sellerPhone}</p>
          <p><strong>Submission ID:</strong> ${data.submissionId}</p>
          <p><a href="${window.location.origin}/admin">Go to Admin Dashboard</a></p>
        `,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Resend email failed:", response.status, errorText);
      return false;
    }

    return true;
  } catch (err) {
    console.error("Failed to send email notification:", err);
    return false;
  }
}
