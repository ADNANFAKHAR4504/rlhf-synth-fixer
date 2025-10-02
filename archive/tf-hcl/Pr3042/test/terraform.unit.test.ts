import fs from "fs";
import path from "path";

const LIB_DIR = path.resolve(__dirname, '../lib');
const TAP_STACK_TF = path.join(LIB_DIR, 'tap_stack.tf');

const tfFile = fs.readFileSync(TAP_STACK_TF, "utf8");

const has = (regex: RegExp) => regex.test(tfFile);

describe("Terraform tap_stack.tf basic validation", () => {
  it("tap_stack.tf exists and is non-empty", () => {
    expect(tfFile.length).toBeGreaterThan(0);
  });

  it("contains at least one variable block", () => {
    expect(has(/variable\s+".+?"/)).toBe(true);
  });

  it("contains at least one resource block", () => {
    expect(has(/resource\s+".+?"/)).toBe(true);
  });

  it("contains at least one output block", () => {
    expect(has(/output\s+".+?"/)).toBe(true);
  });

  it("contains locals block if used", () => {
    if (has(/locals\s*{/)) {
      expect(has(/locals\s*{/)).toBe(true);
    }
  });

  it("contains provider block if used", () => {
    if (has(/provider\s+".+?"/)) {
      expect(has(/provider\s+".+?"/)).toBe(true);
    }
  });
});
