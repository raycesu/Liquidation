import { readFileSync } from "node:fs"
import { join } from "node:path"

const engineDir = join(process.cwd(), "lib", "trading-engine")

const engineFiles = [
  "run-order-engine.ts",
  "liquidate.ts",
  "run-trading-engine.ts",
  "types.ts",
]

describe("trading-engine module", () => {
  it.each(engineFiles)("does not use use server in %s", (fileName) => {
    const source = readFileSync(join(engineDir, fileName), "utf8")
    expect(source).not.toMatch(/["']use server["']/)
  })
})
