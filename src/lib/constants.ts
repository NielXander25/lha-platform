export const SITE = {
  name: "Learning Hub Africa",
  tagline: "Tutorials for AFIT students",
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
