import { defineConfig } from "vitest/config";
import { readFileSync } from "fs";

function loadDotEnv(): Record<string, string> {
  try {
    const content = readFileSync(".env", "utf-8");
    return Object.fromEntries(
      content
        .split("\n")
        .filter((line) => line && !line.startsWith("#"))
        .map((line) => {
          const [key, ...rest] = line.split("=");
          return [
            key.trim(),
            rest
              .join("=")
              .trim()
              .replace(/^["']|["']$/g, ""),
          ];
        }),
    );
  } catch {
    return {};
  }
}

export default defineConfig({
  test: {
    projects: [
      {
        test: {
          name: "unitary",
          include: ["src/**/*.spec.ts"],
          environment: "node",
          testTimeout: 5000,
          env: loadDotEnv(),
        },
      },
      {
        test: {
          name: "integration",
          include: ["src/**/*.test.ts"],
          exclude: ["**/*.e2e.test.ts"],
          environment: "node",
          testTimeout: 30000,
          env: loadDotEnv(),
        },
      },
      {
        test: {
          name: "e2e",
          include: ["**/*.e2e.test.ts"],
          environment: "node",
          testTimeout: 60000,
          env: loadDotEnv(),
        },
      },
    ],
  },
});
