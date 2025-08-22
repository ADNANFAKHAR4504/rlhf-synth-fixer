import fs from "fs";
import path from "path";

const STACK_REL = "../lib/tap_stack.tf"; // adjust if your structure differs
const stackPath = path.resolve(__dirname, STACK_REL);

describe("Terraform single-file stack: tap_stack.tf", () => {
  test("tap_stack.tf exists", () => {
    const exists = fs.existsSync(stackPath);
    if (!exists) {
      console.error(`[unit] Expected stack at: ${stackPath}`);
    }
    expect(exists).toBe(true);
  });

  test("does NOT declare provider in tap_stack.tf (provider.tf owns providers)", () => {
    const content = fs.readFileSync(stackPath, "utf8");
    expect(content).not.toMatch(/\bprovider\s+"aws"\s*{/);
  });

  test("declares all required variables with correct types", () => {
    const content = fs.readFileSync(stackPath, "utf8");
    [
      { name: "aws_region", type: "string" },
      { name: "environment", type: "string" },
      { name: "project_name", type: "string" },
      { name: "vpc_cidr", type: "string" },
      { name: "availability_zones", type: "list" },
      { name: "db_engine", type: "string" },
      { name: "db_engine_version", type: "string" },
      { name: "db_instance_class", type: "string" },
      { name: "db_allocated_storage", type: "number" },
      { name: "enable_mfa", type: "bool" },
    ].forEach(v => {
      expect(content).toMatch(new RegExp(`variable\\s+"${v.name}"\\s*{`));
      expect(content).toMatch(new RegExp(`type\\s*=\\s*${v.type}`));
    });
  });

  test("environment variable validation allows only production, staging, development", () => {
    const content = fs.readFileSync(stackPath, "utf8");
    expect(content).toMatch(/validation\s*{[\s\S]*condition[\s\S]*production[\s\S]*staging[\s\S]*development/);
  });

  test("defines local values for tags and naming", () => {
    const content = fs.readFileSync(stackPath, "utf8");
    expect(content).toMatch(/locals\s*{[\s\S]*common_tags[\s\S]*name_prefix/);
  });

  test("defines KMS key and alias resources", () => {
    const content = fs.readFileSync(stackPath, "utf8");
    expect(content).toMatch(/resource\s+"aws_kms_key"\s+"main"/);
    expect(content).toMatch(/resource\s+"aws_kms_alias"\s+"main"/);
  });

  test("defines VPC, subnets, and internet gateway resources", () => {
    const content = fs.readFileSync(stackPath, "utf8");
    expect(content).toMatch(/resource\s+"aws_vpc"\s+"main"/);
    expect(content).toMatch(/resource\s+"aws_internet_gateway"\s+"main"/);
    expect(content).toMatch(/resource\s+"aws_subnet"\s+"public"/);
    expect(content).toMatch(/resource\s+"aws_subnet"\s+"private"/);
  });

  test("uses data sources for AWS identity and AZs", () => {
    const content = fs.readFileSync(stackPath, "utf8");
    expect(content).toMatch(/data\s+"aws_caller_identity"\s+"current"/);
    expect(content).toMatch(/data\s+"aws_availability_zones"\s+"available"/);
  });

  test("generates a random password for RDS", () => {
    const content = fs.readFileSync(stackPath, "utf8");
    expect(content).toMatch(/resource\s+"random_password"\s+"db_password"/);
  });

  test("applies common tags to resources", () => {
    const content = fs.readFileSync(stackPath, "utf8");
    // Check for tags block referencing local.common_tags
    expect(content).toMatch(/tags\s*=\s*(merge\()?local\.common_tags/);
  });

  test("does not reference any missing modules", () => {
    const content = fs.readFileSync(stackPath, "utf8");
    expect(content).not.toMatch(/module\s+"vpc"/);
    expect(content).not.toMatch(/source\s*=\s*"\.\/modules\/vpc"/);
  });
});
