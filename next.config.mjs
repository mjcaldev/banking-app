import {withSentryConfig} from '@sentry/nextjs';

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Removed ignoreBuildErrors and ignoreDuringBuilds to catch errors during build
  // Fix actual TypeScript and ESLint errors instead of ignoring them
};

// CRITICAL: Make Sentry non-blocking to prevent monitoring from blocking production releases
// This follows the principle: "Observability must never block delivery"
// AWS, Stripe, Plaid, and other production-grade services follow this rule strictly
// 
// Strategy: Skip Sentry uploads during CI/builds to prevent any possibility of blocking
const isCI = process.env.VERCEL === "1" || process.env.CI === "true" || process.env.SENTRY_SKIP_UPLOAD === "true";

// Wrap Sentry config in try-catch to ensure it never blocks the build
let sentryConfig;
try {
  sentryConfig = withSentryConfig(nextConfig, {
    // For all available options, see:
    // https://github.com/getsentry/sentry-webpack-plugin#options

    org: "doubletriple-dev",
    project: "javascript-nextjs",

    // Suppress CLI output to reduce noise
    silent: true,

    // CRITICAL: Skip Sentry upload in CI/build environments to prevent blocking
    // This ensures builds never fail due to Sentry upload issues
    // When dryRun is true, Sentry will validate config but not upload source maps
    dryRun: isCI,

    // For all available options, see:
    // https://docs.sentry.io/platforms/javascript/guides/nextjs/manual-setup/

    // Upload a larger set of source maps for prettier stack traces (increases build time)
    widenClientFileUpload: true,

    // Automatically annotate React components to show their full name in breadcrumbs and session replay
    reactComponentAnnotation: {
      enabled: true,
    },

    // Route browser requests to Sentry through a Next.js rewrite to circumvent ad-blockers.
    // This can increase your server load as well as your hosting bill.
    // Note: Check that the configured route will not match with your Next.js middleware, otherwise reporting of client-
    // side errors will fail.
    tunnelRoute: "/monitoring",

    // Hides source maps from generated client bundles
    hideSourceMaps: true,

    // Automatically tree-shake Sentry logger statements to reduce bundle size
    disableLogger: true,

    // Enables automatic instrumentation of Vercel Cron Monitors. (Does not yet work with App Router route handlers.)
    // See the following for more information:
    // https://docs.sentry.io/product/crons/
    // https://vercel.com/docs/cron-jobs
    automaticVercelMonitors: true,
  });
} catch (error) {
  // If Sentry config fails for any reason, fall back to base config
  // This ensures the build never fails due to Sentry issues
  console.warn("⚠️  Sentry configuration failed (non-blocking):", error?.message || error);
  console.warn("   Build will continue without Sentry - observability should never block delivery");
  sentryConfig = nextConfig;
}

export default sentryConfig;
