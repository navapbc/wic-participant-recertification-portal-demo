import type { JestConfigWithTsJest } from "ts-jest";

const jestConfig: JestConfigWithTsJest = {
  // [...]
  moduleNameMapper: {
    "^~/(.*)$": "<rootDir>/app/$1",
    "^app/(.*)$": "<rootDir>/app/$1",
    "^batch/(.*)$": "<rootDir>/batch/$1",
    "^tests/(.*)$": "<rootDir>/tests/$1",
    "^public/(.*)$": "<rootDir>/public/$1",
    "^file-type$": require.resolve("./tests/helpers/mockFileType.ts"),
    "^uuid$": require.resolve("uuid"),
    "^@remix-run/node$": require.resolve("./tests/helpers/remixRunNode.ts"),
  },
  preset: "ts-jest",
  testEnvironment: "jsdom",
  setupFilesAfterEnv: [
    "<rootDir>/tests/helpers/prismaMock.ts",
    "<rootDir>/tests/helpers/s3ConnectionMock.ts",
  ],
  testMatch: ["**/tests/**/*.test.(ts|tsx|js)"],
};

export default jestConfig;
