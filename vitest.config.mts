import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    alias: {
      "@": import.meta.dirname,
      // "server-only" throws outside Next's server build; tests import server modules directly.
      "server-only": `${import.meta.dirname}/tests/server-only-stub.ts`,
    },
  },
  test: { include: ["tests/**/*.test.ts"], environment: "node" },
});
