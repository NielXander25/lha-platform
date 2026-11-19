// Vercel rejects request bodies over 4.5 MB before they reach the app, so uploads stay under 4 MB.
export const MAX_UPLOAD_BYTES = 4 * 1024 * 1024;
