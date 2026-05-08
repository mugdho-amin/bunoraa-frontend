"use client";

import { useReportWebVitals } from 'next/web-vitals';

export function WebVitalsReporter() {
  useReportWebVitals((metric) => {
    // Log in development
    if (process.env.NODE_ENV === 'development') {
      console.debug(`[Web Vitals] ${metric.name}: ${metric.value.toFixed(2)}ms`);
    }

    // Capture critical metrics for performance analysis
    const { name, value, id, attribution } = metric;
    
    // Logic to send to analytics or monitoring service could go here
    // e.g. sendToAnalytics({ name, value, id, attribution });
  });

  return null;
}
