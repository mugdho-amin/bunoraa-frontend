"use client";

import * as React from "react";

export function HtmlLangSetter() {
  React.useEffect(() => {
    try {
      const match = document.cookie.match(/(?:^|;\s*)language=([^;]*)/);
      const lang = match ? match[1] : "en";
      document.documentElement.lang = lang;
    } catch {
      // Ignore cookie read failures
    }
  }, []);

  return null;
}
