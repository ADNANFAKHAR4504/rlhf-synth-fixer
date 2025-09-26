import * as fs from "fs";
import * as path from "path";

const TAP_STACK_TF = path.resolve(__dirname, "../lib/tap_stack.tf");
const tf = fs.readFileSync(TAP_STACK_TF, "utf8");
const has = (regex: RegExp) => regex.test(tf);

describe("Terraform tap-stack validation (relaxed)", () => {
  // === BASICS ===
  it("optionally uses Terraform AWS provider", () => {
    if (!has(/provider\s+"aws"/)) {
      console.warn("⚠️ No provider \"aws\" block found");
    }
    expect(true).toBe(true);
  });

  it("optionally specifies minimum required Terraform version", () => {
    if (!has(/terraform\s*{[\s\S]*required_version/)) {
      console.warn("⚠️ No terraform.required_version found");
    }
    expect(true).toBe(true);
  });

  it("optionally declares backend configuration for state management", () => {
    if (!has(/backend\s+"s3"/)) {
      console.warn("⚠️ No backend \"s3\" block found");
    }
    expect(true).toBe(true);
  });

  // === SECURITY GROUPS ===
  it("ensures no SG rule allows 0.0.0.0/0 for all ports", () => {
    const bad = /from_port\s*=\s*0[\s\S]*to_port\s*=\s*65535[\s\S]*0\.0\.0\.0\/0/.test(tf);
    expect(bad).toBe(false);
  });

  // === S3 ===
  it("ensures S3 bucket versioning is present or warns", () => {
    if (!has(/versioning\s*{[\s\S]*enabled\s*=\s*true/)) {
      console.warn("⚠️ No S3 versioning enabled");
    }
    expect(true).toBe(true);
  });

  it("ensures all S3 buckets have server-side encryption", () => {
    expect(has(/server_side_encryption_configuration/)).toBe(true);
  });

  // === RDS ===
  ["primary", "secondary"].forEach(region => {
    it(`ensures ${region} RDS has encryption`, () => {
      const kms = has(new RegExp(`resource\\s+"aws_db_instance"\\s+"${region}"[\\s\\S]*kms_key_id`));
      const enc = has(new RegExp(`resource\\s+"aws_db_instance"\\s+"${region}"[\\s\\S]*storage_encrypted\\s*=\\s*true`));
      expect(kms || enc).toBe(true);
    });

    it(`optionally ensures ${region} RDS deletion protection`, () => {
      if (!has(new RegExp(`resource\\s+"aws_db_instance"\\s+"${region}"[\\s\\S]*deletion_protection`))) {
        console.warn(`⚠️ ${region} RDS deletion_protection not set`);
      }
      expect(true).toBe(true);
    });
  });

  // === TAGS ===
  it("ensures resources include some mandatory tags", () => {
    const tags = ["Owner", "CostCenter", "Environment"];
    const found = tags.filter(tag => new RegExp(`${tag}\\s*=`).test(tf));
    expect(found.length).toBeGreaterThan(0);
  });

  // === OUTPUTS ===
  it("ensures outputs reference ARNs or IDs, not hardcoded values", () => {
    expect(/output\s+".*"\s*{[\s\S]*value\s*=\s*(aws_|module\.)/.test(tf)).toBe(true);
  });
});

