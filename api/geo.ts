// Vercel Serverless Function (auto-deployed from /api at the project root --
// not part of the Vite frontend build, so it isn't type-checked by
// tsconfig.app.json and doesn't need @vercel/node as a dependency).
//
// Reads Vercel's built-in IP-geolocation header so the storefront can pick a
// sensible default market (Angola vs. Portugal pricing) on first visit,
// without sending the visitor's IP to any third-party geo-IP service. See
// src/state/AppContext.tsx's useEffect for the client-side consumer -- it
// only calls this when there's no stored market preference yet, and any
// explicit choice the user makes afterwards overrides this permanently via
// localStorage.
//
// Locally (vercel dev / vite dev) this header is absent, so `country` comes
// back null and the client just falls back to its env-based default.
type GeoRequest = { headers: Record<string, string | string[] | undefined> };
type GeoResponse = {
  setHeader: (name: string, value: string) => void;
  status: (code: number) => { json: (body: { country: string | string[] | null }) => void };
};

export default function handler(req: GeoRequest, res: GeoResponse) {
  const country = req.headers['x-vercel-ip-country'] ?? null;
  res.setHeader('Cache-Control', 'no-store');
  res.status(200).json({ country });
}
