# Sentry Integration Guide (Frontend)

The production audit identified missing error tracking on the frontend. To make the platform production-ready, follow these steps:

## 1. Install Dependencies
```bash
npm install @sentry/nextjs
```

## 2. Initialize Sentry
Run the wizard:
```bash
npx @sentry/wizard@latest -i nextjs
```

## 3. Environment Variables
Add these to your production environment (Netlify):
```
SENTRY_DSN=your_dsn_here
NEXT_PUBLIC_SENTRY_DSN=your_dsn_here
```

## 4. Configuration
Ensure `sentry.client.config.ts`, `sentry.server.config.ts`, and `sentry.edge.config.ts` are created in the root.

### client.config.ts Example:
```typescript
import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  tracesSampleRate: 0.1,
  replaysSessionSampleRate: 0.1,
  replaysOnErrorSampleRate: 1.0,
});
```

## 5. Error Boundary
The `app/error.tsx` has been enhanced to categorize errors. Sentry will automatically capture unhandled exceptions, but you can also manually capture errors in `error.tsx`:

```typescript
useEffect(() => {
  Sentry.captureException(error);
}, [error]);
```
