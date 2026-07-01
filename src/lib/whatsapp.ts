import type { Car } from "@/data/listings";

// Central WhatsApp Business number for Maclen Autos.
// Placeholder — replace with the real number when provided (no leading +).
export const WHATSAPP_NUMBER = "254700000000";
export const WHATSAPP_DISPLAY = "+254 700 000 000";
export const PHONE_TEL = "+254700000000";
export const CONTACT_EMAIL = "info@maclenautos.co.ke";
export const RUAKA_ADDRESS = "Limuru Road, Ruaka Town, Kiambu County, Kenya";

function formatKes(amount: number) {
  return `KES ${amount.toLocaleString("en-KE")}`;
}

export function buildWaLink(message: string) {
  return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
}

export function buildCarInquiryLink(car: Car) {
  const msg = `Hi Maclen Autos, I'm interested in the ${car.year} ${car.make} ${car.model} listed at ${formatKes(car.priceKes)} (Ref: ${car.id}). Is it still available?`;
  return buildWaLink(msg);
}

export function buildGeneralInquiryLink() {
  return buildWaLink("Hi Maclen Autos, I have a question about your vehicles.");
}