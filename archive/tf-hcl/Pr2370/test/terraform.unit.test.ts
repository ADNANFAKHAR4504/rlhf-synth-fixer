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
  test("includes aws_caller_identity data source", () => {
    expect(content).toMatch(/data\s+"aws_caller_identity"\s+"current"\s*{/);
  });

  test("includes aws_region data source", () => {
    expect(content).toMatch(/data\s+"aws_region"\s+"current"\s*{/);
  });

  // --- Module calls ---
  test("calls VPC module", () => {
    expect(content).toMatch(/module\s+"vpc"\s*{/);
  });

  test("calls IAM module", () => {
    expect(content).toMatch(/module\s+"iam"\s*{/);
  });

  test("calls Security module", () => {
    expect(content).toMatch(/module\s+"security"\s*{/);
  });

  test("calls Storage module", () => {
    expect(content).toMatch(/module\s+"storage"\s*{/);
  });

  test("calls Monitoring module", () => {
    expect(content).toMatch(/module\s+"monitoring"\s*{/);
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

  test("declares project_name variable", () => {
    expect(varsContent).toMatch(/variable\s+"project_name"\s*{/);
  });

  test("declares environment variable", () => {
    expect(varsContent).toMatch(/variable\s+"environment"\s*{/);
  });

  test("declares vpc_cidr variable", () => {
    expect(varsContent).toMatch(/variable\s+"vpc_cidr"\s*{/);
  });

  test("declares availability_zones variable", () => {
    expect(varsContent).toMatch(/variable\s+"availability_zones"\s*{/);
  });

  test("declares public_subnet_cidrs variable", () => {
    expect(varsContent).toMatch(/variable\s+"public_subnet_cidrs"\s*{/);
  });

  test("declares private_subnet_cidrs variable", () => {
    expect(varsContent).toMatch(/variable\s+"private_subnet_cidrs"\s*{/);
  });

  test("declares allowed_ssh_cidr variable", () => {
    expect(varsContent).toMatch(/variable\s+"allowed_ssh_cidr"\s*{/);
  });
});
