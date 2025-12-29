import {withSentryConfig} from '@sentry/nextjs';

/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true
  },
  eslint: {
    ignoreDuringBuilds: true
  }
};

// Sentry configuration with non-blocking error handling
// This ensures builds don't fail if Sentry CLI has issues (timeouts, network errors, etc.)
const sentryOptions = {
  // For all available options, see:
  // https://github.com/getsentry/sentry-webpack-plugin#options

  org: "doubletriple-dev",
  project: "javascript-nextjs",

  // Only print logs for uploading source maps in CI
  silent: !process.env.CI,

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

  // CRITICAL: Make Sentry non-blocking for production builds
  // This error handler catches Sentry CLI failures and logs them without failing the build
  // When sentry-cli fails (e.g., "releases new" exits with code 1), this prevents build failure
  errorHandler: (err, invokeErr, compilation) => {
    // Log the error for debugging but don't throw - this allows the build to continue
    console.warn('[Sentry] Source map upload failed (non-blocking):', err?.message || invokeErr?.message || 'Unknown error');
    console.warn('[Sentry] Build will continue despite Sentry upload failure');
    
    // If files were already uploaded, this is often just a release creation issue
    // which doesn't prevent source maps from working
    if (err?.message?.includes('release') || invokeErr?.message?.includes('release')) {
      console.warn('[Sentry] Note: Release creation failed, but source maps may still be uploaded');
    }
    
    // Explicitly return without throwing - this is the key to making it non-blocking
    return;
  },
};

export default withSentryConfig(nextConfig, sentryOptions);