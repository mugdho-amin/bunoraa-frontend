"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

type LoadingScreenProps = {
  title?: string;
  subtitle?: string;
  fullScreen?: boolean;
  className?: string;
};

export function LoadingScreen({
  title,
  subtitle,
  fullScreen = false,
  className,
}: LoadingScreenProps) {
  return (
    <div
      role="status"
      aria-live="polite"
      aria-busy="true"
      className={cn(
        "relative flex flex-col items-center justify-center overflow-hidden bg-background transition-colors duration-500",
        fullScreen ? "fixed inset-0 z-[100] h-screen w-screen" : "h-full min-h-[400px] w-full",
        className
      )}
    >
      <div className="pointer-events-none absolute left-1/2 top-1/2 h-[500px] w-[500px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary/5 blur-[120px]" />
      <div className="pointer-events-none absolute left-1/3 top-1/3 h-[300px] w-[300px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-accent/5 blur-[100px]" />

      <div className="relative z-10 flex flex-col items-center">
        <div className="relative h-24 w-24">
          <div className="absolute inset-0 rounded-full border-[3px] border-primary/10" />

          <svg className="h-full w-full animate-[spin_3s_linear_infinite]" viewBox="0 0 100 100">
            <defs>
              <linearGradient id="spinner-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="hsl(var(--primary))" />
                <stop offset="100%" stopColor="hsl(var(--primary))" />
              </linearGradient>
            </defs>
            <circle
              cx="50"
              cy="50"
              r="46"
              fill="none"
              stroke="url(#spinner-gradient)"
              strokeWidth="4"
              strokeLinecap="round"
              strokeDasharray="180 120"
              className="animate-[spinner-dash_2s_ease-in-out_infinite] opacity-80"
            />
          </svg>

          <div className="absolute inset-0 flex items-center justify-center">
            <div className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-full bg-background shadow-inner">
              <svg
                viewBox="83 83 3135 3135"
                className="h-8 w-8"
                aria-hidden="true"
              >
                <path
                  d="M1170.6 918.643 1824.42 921.27C1971.77 929.906 2000.47 949.161 2054.72 970.459 2108.97 991.758 2128.51 1014.31 2149.92 1049.06 2171.33 1083.81 2191.32 1127.59 2183.16 1178.94 2175.01 1230.29 2154.14 1306.16 2101.01 1357.16 2047.88 1408.16 1992.68 1442.67 1864.39 1484.95ZM1197.23 660.538C955.524 660.864 722.026 663.14 617.809 662.98 756.285 702.075 764.35 739.368 968.569 902.458L1841.01 1618.82C1924.43 1657.91 1945.17 1664.88 2004.85 1689.3 2064.53 1713.72 2141.31 1731.5 2199.1 1765.35 2256.89 1799.21 2316.75 1846.87 2351.58 1892.44 2386.41 1938 2405.28 1985.4 2408.07 2038.74 2410.87 2092.08 2404.73 2162.6 2368.34 2212.48 2331.94 2262.35 2274.26 2311.9 2189.7 2337.99 2105.14 2364.08 1904.13 2370.12 1860.96 2369.04 1817.79 2367.97 1903.48 2348.61 1930.68 2331.52 1957.88 2314.42 2005.59 2295.6 2024.17 2266.47 2042.75 2237.34 2051.72 2197.43 2042.16 2156.75 2032.6 2116.06 2006.06 2068.97 1966.79 2022.37 1927.53 1975.77 1880.45 1939.12 1806.57 1877.16 1732.69 1815.2 1737.08 1814.94 1523.51 1650.61L617.855 891.947C634.538 999.902 667.525 1041.48 807.432 1181.66 947.339 1321.84 1271.41 1571.44 1457.3 1733.04 1643.19 1894.63 1866.55 2048.21 1922.78 2151.25 1979.01 2254.3 1872.78 2313.86 1794.68 2351.33 1716.58 2388.79 1560.84 2375.97 1454.18 2376.02L1069.49 2379.87C1069.49 2123.95 1069.69 1975.73 1075.25 1823.73L1633.16 2266.61C1629.29 2217.71 1620.74 2202.22 1615.23 2139.78L617.285 1308.24C625.852 1324.25 678.201 1413.84 714.637 1469.64 719.491 1527.85 737.507 2309.29 725.381 2533.89 707.823 2565.73 685.095 2591.41 628.219 2640.5L1673.29 2636.83 2005.95 2631.34C2104.47 2623.43 2185.42 2611.12 2264.36 2589.34 2343.29 2567.55 2418.16 2537.29 2479.56 2500.63 2540.96 2463.96 2586.66 2432.06 2632.78 2369.34 2678.89 2306.62 2741.97 2210.94 2756.26 2124.29 2770.54 2037.65 2760.01 1928.07 2718.51 1849.45 2677 1770.83 2578.52 1692.75 2507.23 1652.58 2435.94 1612.41 2396.7 1583.55 2304.63 1551.36 2369.64 1500.64 2408.8 1474.76 2448.02 1431.01 2487.24 1387.25 2519.04 1347.52 2539.93 1288.83 2560.82 1230.15 2555.13 1143.56 2540.07 1078.91 2525.01 1014.25 2495.83 954.316 2449.59 900.913 2403.35 847.51 2366.56 797.011 2262.62 758.491 2158.68 719.972 2100.07 685.714 1825.94 669.795 1688.87 661.836 1438.95 660.212 1197.23 660.538ZM1650.5 82.9998C2516.21 82.9998 3218 784.793 3218 1650.5 3218 2516.21 2516.21 3218 1650.5 3218 784.793 3218 82.9998 2516.21 82.9998 1650.5 82.9998 784.793 784.793 82.9998 1650.5 82.9998Z"
                  fill="#ED7D31"
                  fillRule="evenodd"
                />
              </svg>
            </div>
          </div>
        </div>

        <div className="mt-8 flex flex-col items-center gap-2">
          {title ? (
            <h2 className="font-display text-xl font-medium tracking-tight text-foreground">
              {title}
            </h2>
          ) : null}

          {subtitle && (
            <p className="max-w-[240px] text-center text-sm text-foreground/40 leading-relaxed">
              {subtitle}
            </p>
          )}
        </div>
      </div>

      <style jsx global>{`
        @keyframes spinner-dash {
          0% {
            stroke-dasharray: 1, 300;
            stroke-dashoffset: 0;
          }
          50% {
            stroke-dasharray: 150, 300;
            stroke-dashoffset: -70;
          }
          100% {
            stroke-dasharray: 150, 300;
            stroke-dashoffset: -280;
          }
        }
      `}</style>
    </div>
  );
}
