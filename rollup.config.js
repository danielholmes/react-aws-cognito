import typescript from "@rollup/plugin-typescript";
// Doesn't work node 22 yet
// import packageJson from "./package.json" assert { type: "json" };

export default [
  {
    input: "src/index.ts",
    output: [
      {
        file: "./dist/index.mjs",
        format: "es",
        sourcemap: false,
      }
    ],
    plugins: [
      typescript({
        tsconfig: "tsconfig.esm.json",
        sourceMap: false,
      }),
    ],
  },
];