import fs from "fs";
import path from "path";

const STACK_REL = "../lib/tap_stack.tf";
const VARS_REL = "../lib/variables.tf";

const stackPath = path.resolve(__dirname, STACK_REL);
const varsPath = path.resolve(__dirname, VARS_REL);

describe("Terraform modularized stack: tap_stack.tf", () => {
  test("tap_stack.tf exists", () => {
    const exists = fs.existsSync(stackPath);
    if (!exists) {
      console.error(`[unit] Expected stack at: ${stackPath}`);
    }
    expect(exists).toBe(true);
  });

  const content = fs.readFileSync(stackPath, "utf8");

  test("does NOT declare provider in tap_stack.tf (provider.tf owns providers)", () => {
    expect(content).not.toMatch(/\bprovider\s+"aws"\s*{/);
  });

  // --- Data sources ---
  test("includes aws_availability_zones data source", () => {
    expect(content).toMatch(/data\s+"aws_availability_zones"\s+"available"\s*{/);
  });

  // --- Module calls ---
  test("calls VPC module", () => {
    expect(content).toMatch(/module\s+"vpc"\s*{/);
  });

  test("calls Secrets Manager module", () => {
    expect(content).toMatch(/module\s+"secrets"\s*{/);
  });

  test("calls IAM module", () => {
    expect(content).toMatch(/module\s+"iam"\s*{/);
  });

  test("calls Monitoring module", () => {
    expect(content).toMatch(/module\s+"monitoring"\s*{/);
  });

  test("calls EC2 module", () => {
    expect(content).toMatch(/module\s+"ec2"\s*{/);
  });
});

describe("Terraform variables file: variables.tf", () => {
  test("variables.tf exists", () => {
    const exists = fs.existsSync(varsPath);
    if (!exists) {
      console.error(`[unit] Expected vars at: ${varsPath}`);
    }
    expect(exists).toBe(true);
  });

  const varsContent = fs.readFileSync(varsPath, "utf8");

  // --- Variable existence tests ---
  test("declares aws_region variable", () => {
    expect(varsContent).toMatch(/variable\s+"aws_region"\s*{/);
  });

  test("declares instance_type variable", () => {
    expect(varsContent).toMatch(/variable\s+"instance_type"\s*{/);
  });

  test("declares vpc_cidr variable", () => {
    expect(varsContent).toMatch(/variable\s+"vpc_cidr"\s*{/);
  });

  test("declares public_subnet_cidrs variable", () => {
    expect(varsContent).toMatch(/variable\s+"public_subnet_cidrs"\s*{/);
  });

  test("declares private_subnet_cidrs variable", () => {
    expect(varsContent).toMatch(/variable\s+"private_subnet_cidrs"\s*{/);
  });

  test("declares log_retention_days variable", () => {
    expect(varsContent).toMatch(/variable\s+"log_retention_days"\s*{/);
  });

  test("declares common_tags variable", () => {
    expect(varsContent).toMatch(/variable\s+"common_tags"\s*{/);
  });

  test("declares secrets_config variable", () => {
    expect(varsContent).toMatch(/variable\s+"secrets_config"\s*{/);
  });
});
