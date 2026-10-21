import type { CSSProperties } from "react";
import { site } from "@/site.config";

/** The colour tokens from site.config.ts as CSS variables, set on <html>. */
export const themeStyle = {
  "--paper": site.colors.paper,
  "--card": site.colors.card,
  "--ink": site.colors.ink,
  "--ink-soft": site.colors.inkSoft,
  "--body": site.colors.body,
  "--muted-dark": site.colors.mutedOnDark,
  "--accent": site.colors.accent,
  "--moss": site.colors.moss,
  "--sage": site.colors.sage,
  "--warn": site.colors.warn,
} as CSSProperties;
