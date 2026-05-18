"use client";

import { useReportWebVitals } from 'next/web-vitals';

export function WebVitalsReporter() {
  useReportWebVitals((metric) => {
    // Log in development
    if (process.env.NODE_ENV === 'development') {
      console.debug(`[Web Vitals] ${metric.name}: ${metric.value.toFixed(2)}ms`);
    }

    // Capture critical metrics for performance analysis
    // Logic to send to analytics or monitoring service could go here
    // e.g. sendToAnalytics({ name: metric.name, value: metric.value, id: metric.id });
  });

  return null;
}
