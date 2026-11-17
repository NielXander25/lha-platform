export const SITE = {
  name: "Learning Hub Africa",
  tagline: "Forging Leaders, Igniting Excellence, Transforming Futures",
  school: "Air Force Institute of Technology",
  schoolShort: "AFIT",
  email: "hello@learninghubafrica.com",
  phone: "+234 800 000 0000",
  // WhatsApp number in international format, digits only (used for wa.me links).
  whatsapp: "2348000000000",
};

export function whatsappLink(message?: string) {
  const text = message ? `?text=${encodeURIComponent(message)}` : "";
  return `https://wa.me/${SITE.whatsapp}${text}`;
}

// What package prices are charged for.
export const PRICE_UNIT = "per month";

// Account students pay into by bank transfer. PLACEHOLDER: replace with the real account.
export const BANK = {
  bankName: "Bank name (to be confirmed)",
  accountName: "Learning Hub Africa",
  accountNumber: "0000000000",
};

export const LEVELS = ["100 Level", "200 Level", "300 Level", "400 Level", "500 Level"] as const;

// "Mechatronics Engineering" -> "Mechatronics" for compact labels.
export function shortDepartment(name: string) {
  return name.replace(/\s+Engineering$/i, "");
}
