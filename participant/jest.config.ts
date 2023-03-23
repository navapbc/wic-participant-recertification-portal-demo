import type { JestConfigWithTsJest } from "ts-jest";

const jestConfig: JestConfigWithTsJest = {
  // [...]
  moduleNameMapper: {
    "^~/(.*)$": "<rootDir>/app/$1",
    "^app/(.*)$": "<rootDir>/app/$1",
    "^tests/(.*)$": "<rootDir>/tests/$1",
    "^public/(.*)$": "<rootDir>/public/$1",
    "remix-validated-form": require.resolve(
      "./.storybook/mockModules/remix-validated-form.tsx"
    ), // This uses the same mock Storybook does..
  },
  preset: "ts-jest",
  testEnvironment: "jsdom",
  setupFilesAfterEnv: ["<rootDir>/tests/helpers/prismaMock.ts"],
  testMatch: ["**/tests/**/*.test.(ts|tsx|js)"],
};

export default jestConfig;