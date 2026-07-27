import type { Car } from "@/data/listings";

// Contact numbers ranked by importance. All support calls and WhatsApp.
export const WHATSAPP_NUMBER = "254790555421";
export const WHATSAPP_DISPLAY = "+254 790 555 421";
export const PHONE_PRIMARY_DISPLAY = "0790 555 421";
export const PHONE_PRIMARY_TEL = "+254790555421";
export const PHONE_TEL = PHONE_PRIMARY_TEL;
export const CONTACT_EMAIL = "spicegotcars@gmail.com";
export const RUAKA_ADDRESS = "Kahawa west Kamiti Road, Nairobi, Kenya";

function formatKes(amount: number) {
  return `KES ${amount.toLocaleString("en-KE")}`;
}

export function buildWaLink(message: string) {
  return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
}

export function buildCarInquiryLink(car: Car) {
  const msg = `Hi Spice Got Cars, I'm interested in the ${car.year} ${car.make} ${car.model} listed at ${formatKes(car.priceKes)} (Ref: ${car.id}). Is it still available?`;
  return buildWaLink(msg);
}

export function buildGeneralInquiryLink() {
  return buildWaLink("Hi Spice Got Cars, I have a question about your vehicles.");
}