import type { NextConfig } from "next"
import { withSentryConfig } from "@sentry/nextjs"

/**
 * Next.js configuration file.
 *
 * Two additions to the original config:
 *
 * 1. SECURITY HEADERS — sent with every HTTP response.
 *    These tell the browser: "enforce these security rules."
 *    The browser obeys because it trusts the server.
 *
 * 2. withSentryConfig() wrapper — modifies the build process so that:
 *    - Source maps are uploaded to Sentry (readable stack traces)
 *    - Sentry's webpack plugin instruments the code (auto-captures errors)
 */
const nextConfig: NextConfig = {
  // headers() returns an array of header rules.
  // Each rule has a "source" (which URLs it applies to) and "headers" (what to add).
  headers: async () => [
    {
      // "/(.*)" means: apply to ALL routes (every page, every API call)
      source: "/(.*)",
      headers: [
        // ── X-Frame-Options: DENY ──────────────────────────────────
        // Prevents your site from being embedded inside an <iframe>.
        // WHY: An attacker could embed your site in a hidden iframe on their page
        // and trick users into clicking buttons they can't see ("clickjacking").
        // DENY = never allow iframes. Nobody should embed our medical app.
        { key: "X-Frame-Options", value: "DENY" },

        // ── X-Content-Type-Options: nosniff ────────────────────────
        // Tells the browser: "trust the Content-Type header, don't guess."
        // WHY: Without this, a browser might "sniff" a file and decide
        // "this looks like JavaScript" even if the server said it's text.
        // An attacker could upload a .txt file that's actually JS and the
        // browser would execute it. "nosniff" prevents this.
        { key: "X-Content-Type-Options", value: "nosniff" },

        // ── Referrer-Policy: strict-origin-when-cross-origin ───────
        // Controls what info is sent in the "Referer" header when navigating.
        // When a user clicks a link FROM your site TO an external site,
        // the browser sends a "Referer" header saying where they came from.
        // "strict-origin-when-cross-origin" means:
        //   - Same site: send full URL (helps with analytics)
        //   - External site: send only the domain (https://turnera.com, not the full path)
        //   - HTTP→HTTPS downgrade: send nothing
        // WHY: Prevents leaking patient-related URLs to external sites.
        { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },

        // ── Permissions-Policy ─────────────────────────────────────
        // Disables browser features we don't use.
        // camera=(), microphone=(), geolocation=() means: NO page on our
        // site can access the camera, mic, or GPS — not even if JavaScript asks.
        // WHY: If an attacker injects malicious JS (XSS), they can't spy on
        // the user because these APIs are completely disabled.
        {
          key: "Permissions-Policy",
          value: "camera=(), microphone=(), geolocation=()",
        },

        // ── Strict-Transport-Security (HSTS) ───────────────────────
        // Tells the browser: "ALWAYS use HTTPS for this site. Never HTTP."
        // max-age=63072000 = 2 years (in seconds).
        // After the browser sees this header ONCE, it will refuse to connect
        // via HTTP for the next 2 years — even if the user types http://
        // includeSubDomains = applies to all subdomains too.
        // preload = allows the site to be added to Chrome's built-in HSTS list.
        // WHY: Prevents "downgrade attacks" where someone intercepts the
        // connection and forces HTTP (unencrypted) instead of HTTPS.
        {
          key: "Strict-Transport-Security",
          value: "max-age=63072000; includeSubDomains; preload",
        },
      ],
    },
  ],
}

// withSentryConfig wraps the Next.js config to add Sentry's build plugins.
// What it does at BUILD TIME (not runtime):
// 1. Generates source maps (mapping between minified code and your TypeScript)
// 2. Uploads those source maps to Sentry (so error stack traces show real code)
// 3. Injects Sentry's error boundary and performance monitoring code
//
// Source maps are hidden from end users by default — only Sentry can read them.
// The second argument configures the upload:
export default withSentryConfig(nextConfig, {
  // silent: don't spam the build output with upload progress logs
  silent: true,

  // org + project: where to upload source maps on sentry.io
  // These must match your Sentry account (create at sentry.io if needed)
  org: "althem",
  project: "turnera",

  // authToken: Sentry auth token for uploading source maps.
  // Set SENTRY_AUTH_TOKEN in environment variables (Vercel dashboard for production,
  // .env.local for local — but don't commit it to git, it's a secret).
  // Without it, source maps won't upload but the app still works.
  authToken: process.env.SENTRY_AUTH_TOKEN,
})
