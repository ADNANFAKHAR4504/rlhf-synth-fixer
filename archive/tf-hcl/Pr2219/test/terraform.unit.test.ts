import fs from "fs";
import path from "path";

const STACK_REL = "../lib/tap_stack.tf";
const VARS_REL = "../lib/variables.tf";

const stackPath = path.resolve(__dirname, STACK_REL);
const varsPath = path.resolve(__dirname, VARS_REL);

describe("Terraform modularized stack: stack.tf", () => {
  test("stack.tf exists", () => {
    const exists = fs.existsSync(stackPath);
    if (!exists) {
      console.error(`[unit] Expected stack at: ${stackPath}`);
    }
    expect(exists).toBe(true);
  });

  const content = fs.readFileSync(stackPath, "utf8");

  test("does NOT declare provider in stack.tf (provider.tf owns providers)", () => {
    expect(content).not.toMatch(/\bprovider\s+"aws"\s*{/);
  });

  // --- Module calls ---
  test("calls KMS module", () => {
    expect(content).toMatch(/module\s+"kms"\s*{/);
  });

  test("calls VPC module", () => {
    expect(content).toMatch(/module\s+"vpc"\s*{/);
  });

  test("calls Security Group module", () => {
    expect(content).toMatch(/module\s+"sg"\s*{/);
  });

  test("calls S3 secure bucket module", () => {
    expect(content).toMatch(/module\s+"s3_secure_bucket"\s*{/);
  });

  test("calls S3 cloudtrail bucket module", () => {
    expect(content).toMatch(/module\s+"s3_cloudtrail_bucket"\s*{/);
  });

  test("calls S3 config bucket module", () => {
    expect(content).toMatch(/module\s+"s3_config_bucket"\s*{/);
  });

  test("calls SNS module", () => {
    expect(content).toMatch(/module\s+"sns"\s*{/);
  });

  test("calls CloudWatch security logs module", () => {
    expect(content).toMatch(/module\s+"cloudwatch_security"\s*{/);
  });

  test("calls CloudWatch cloudtrail logs module", () => {
    expect(content).toMatch(/module\s+"cloudwatch_cloudtrail"\s*{/);
  });

  test("calls IAM CloudTrail role module", () => {
    expect(content).toMatch(/module\s+"iam_cloudtrail"\s*{/);
  });

  test("calls IAM Config role module", () => {
    expect(content).toMatch(/module\s+"iam_config"\s*{/);
  });

  test("calls IAM MFA role module", () => {
    expect(content).toMatch(/module\s+"iam_mfa_role"\s*{/);
  });

  test("calls Config service module", () => {
    expect(content).toMatch(/module\s+"config"\s*{/);
  });
});

describe("Terraform variables file: vars.tf", () => {
  test("vars.tf exists", () => {
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

  test("declares secondary_region variable", () => {
    expect(varsContent).toMatch(/variable\s+"secondary_region"\s*{/);
  });

  test("declares vpc_cidr variable", () => {
    expect(varsContent).toMatch(/variable\s+"vpc_cidr"\s*{/);
  });

  test("declares allowed_ssh_cidr variable", () => {
    expect(varsContent).toMatch(/variable\s+"allowed_ssh_cidr"\s*{/);
  });

  test("declares project_name variable", () => {
    expect(varsContent).toMatch(/variable\s+"project_name"\s*{/);
  });

  test("declares enable_guardduty variable", () => {
    expect(varsContent).toMatch(/variable\s+"enable_guardduty"\s*{/);
  });

  test("declares project variable", () => {
    expect(varsContent).toMatch(/variable\s+"project"\s*{/);
  });

  test("declares environment variable", () => {
    expect(varsContent).toMatch(/variable\s+"environment"\s*{/);
  });

  test("declares public_subnet_cidrs variable", () => {
    expect(varsContent).toMatch(/variable\s+"public_subnet_cidrs"\s*{/);
  });

  test("declares private_subnet_cidrs variable", () => {
    expect(varsContent).toMatch(/variable\s+"private_subnet_cidrs"\s*{/);
  });
});
