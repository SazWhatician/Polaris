"use client";

import { ThemeProvider as NextThemesProvider } from "next-themes";
import type { ComponentProps } from "react";

export function ThemeProvider({ children, ...props }: ComponentProps<typeof NextThemesProvider>) {
  return (
    <NextThemesProvider
      {...props}
      themes={["dark", "light", "theme-gold", "theme-emerald", "theme-sapphire", "theme-crimson"]}
    >
      {children}
    </NextThemesProvider>
  );
}
