// Unit tests for Terraform multi-environment infrastructure
// Tests infrastructure code structure without deployment

import fs from "fs";
import path from "path";

// Helper to read file content
const readFile = (relativePath: string): string => {
  const fullPath = path.resolve(__dirname, relativePath);
  return fs.readFileSync(fullPath, "utf8");
};

// Helper to check if file exists
const fileExists = (relativePath: string): boolean => {
  const fullPath = path.resolve(__dirname, relativePath);
  return fs.existsSync(fullPath);
};

describe("Terraform Infrastructure - Main Configuration", () => {
  test("main.tf exists", () => {
    expect(fileExists("../lib/main.tf")).toBe(true);
  });

  test("provider.tf exists and configures AWS provider", () => {
    expect(fileExists("../lib/provider.tf")).toBe(true);
    const content = readFile("../lib/provider.tf");
    expect(content).toMatch(/provider\s+"aws"/);
    expect(content).toMatch(/region\s*=\s*var\.aws_region/);
  });

  test("variables.tf defines all required variables", () => {
    expect(fileExists("../lib/variables.tf")).toBe(true);
    const content = readFile("../lib/variables.tf");
    expect(content).toMatch(/variable\s+"environment"/);
    expect(content).toMatch(/variable\s+"environment_suffix"/);
    expect(content).toMatch(/variable\s+"lambda_memory_size"/);
    expect(content).toMatch(/variable\s+"rds_instance_class"/);
  });

  test("main.tf declares all required modules", () => {
    const content = readFile("../lib/main.tf");
    expect(content).toMatch(/module\s+"vpc"/);
    expect(content).toMatch(/module\s+"security_groups"/);
    expect(content).toMatch(/module\s+"rds"/);
    expect(content).toMatch(/module\s+"lambda"/);
  });

  test("modules receive environment_suffix for uniqueness", () => {
    const content = readFile("../lib/main.tf");
    expect(content).toMatch(/environment_suffix\s*=\s*var\.environment_suffix/);
  });
});

describe("VPC Module", () => {
  test("VPC module files exist", () => {
    expect(fileExists("../lib/modules/vpc/main.tf")).toBe(true);
    expect(fileExists("../lib/modules/vpc/variables.tf")).toBe(true);
    expect(fileExists("../lib/modules/vpc/outputs.tf")).toBe(true);
  });

  test("VPC module creates required resources", () => {
    const content = readFile("../lib/modules/vpc/main.tf");
    expect(content).toMatch(/resource\s+"aws_vpc"/);
    expect(content).toMatch(/resource\s+"aws_subnet"\s+"public"/);
    expect(content).toMatch(/resource\s+"aws_subnet"\s+"private"/);
    expect(content).toMatch(/resource\s+"aws_internet_gateway"/);
  });

  test("VPC module creates cost-optimized VPC endpoints", () => {
    const content = readFile("../lib/modules/vpc/main.tf");
    expect(content).toMatch(/resource\s+"aws_vpc_endpoint"\s+"s3"/);
    expect(content).toMatch(/resource\s+"aws_vpc_endpoint"\s+"dynamodb"/);
  });
});

describe("RDS Module", () => {
  test("RDS module files exist", () => {
    expect(fileExists("../lib/modules/rds/main.tf")).toBe(true);
  });

  test("RDS uses correct PostgreSQL version", () => {
    const content = readFile("../lib/modules/rds/main.tf");
    expect(content).toMatch(/engine_version\s*=\s*"15\.15"/);
    expect(content).not.toMatch(/engine_version\s*=\s*"15\.4"/);
  });

  test("RDS password excludes problematic characters", () => {
    const content = readFile("../lib/modules/rds/main.tf");
    expect(content).toMatch(/override_special/);
  });

  test("RDS is fully destroyable", () => {
    const content = readFile("../lib/modules/rds/main.tf");
    expect(content).toMatch(/skip_final_snapshot\s*=\s*true/);
    expect(content).toMatch(/deletion_protection\s*=\s*false/);
  });

  test("RDS Multi-AZ is environment-specific", () => {
    const content = readFile("../lib/modules/rds/main.tf");
    expect(content).toMatch(/multi_az\s*=\s*var\.environment\s*==\s*"prod"/);
  });
});

describe("Lambda Module", () => {
  test("Lambda module creates all required resources", () => {
    const content = readFile("../lib/modules/lambda/main.tf");
    expect(content).toMatch(/resource\s+"aws_iam_role"/);
    expect(content).toMatch(/resource\s+"aws_lambda_function"/);
    expect(content).toMatch(/resource\s+"aws_cloudwatch_log_group"/);
  });

  test("Lambda has VPC configuration", () => {
    const content = readFile("../lib/modules/lambda/main.tf");
    expect(content).toMatch(/vpc_config/);
  });

  test("Lambda has DB environment variables", () => {
    const content = readFile("../lib/modules/lambda/main.tf");
    expect(content).toMatch(/DB_HOST/);
    expect(content).toMatch(/DB_PASSWORD/);
  });
});

describe("Security Groups Module", () => {
  test("Security groups allow Lambda to RDS connectivity", () => {
    const content = readFile("../lib/modules/security_groups/main.tf");
    expect(content).toMatch(/5432/); // PostgreSQL port
  });

  test("Dev environment has additional access rules", () => {
    const content = readFile("../lib/modules/security_groups/main.tf");
    expect(content).toMatch(/dynamic\s+"ingress"/);
    expect(content).toMatch(/var\.environment\s*==\s*"dev"/);
  });
});

describe("Environment Files", () => {
  test("dev.tfvars has correct memory and instance sizes", () => {
    const content = readFile("../lib/dev.tfvars");
    expect(content).toMatch(/lambda_memory_size\s*=\s*256/);
    expect(content).toMatch(/rds_instance_class\s*=\s*"db\.t3\.micro"/);
    expect(content).toMatch(/log_retention_days\s*=\s*7/);
  });

  test("staging.tfvars has correct memory and instance sizes", () => {
    const content = readFile("../lib/staging.tfvars");
    expect(content).toMatch(/lambda_memory_size\s*=\s*512/);
    expect(content).toMatch(/rds_instance_class\s*=\s*"db\.t3\.small"/);
    expect(content).toMatch(/log_retention_days\s*=\s*30/);
  });

  test("prod.tfvars has correct memory and instance sizes", () => {
    const content = readFile("../lib/prod.tfvars");
    expect(content).toMatch(/lambda_memory_size\s*=\s*1024/);
    expect(content).toMatch(/rds_instance_class\s*=\s*"db\.t3\.medium"/);
    expect(content).toMatch(/log_retention_days\s*=\s*90/);
  });

  test("VPC CIDRs are unique across environments", () => {
    const devContent = readFile("../lib/dev.tfvars");
    const stagingContent = readFile("../lib/staging.tfvars");
    const prodContent = readFile("../lib/prod.tfvars");

    const devCidr = devContent.match(/vpc_cidr\s*=\s*"([^"]+)"/)?.[1];
    const stagingCidr = stagingContent.match(/vpc_cidr\s*=\s*"([^"]+)"/)?.[1];
    const prodCidr = prodContent.match(/vpc_cidr\s*=\s*"([^"]+)"/)?.[1];

    expect(devCidr).not.toBe(stagingCidr);
    expect(devCidr).not.toBe(prodCidr);
    expect(stagingCidr).not.toBe(prodCidr);
  });
});
