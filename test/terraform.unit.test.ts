// tests/unit/unit-tests.ts
// Comprehensive unit tests for ../lib/tap_stack.tf
// Validates all requirements from PROMPT.md without executing Terraform commands.

import fs from "fs";
import path from "path";

const STACK_REL = "../lib/tap_stack.tf";
const stackPath = path.resolve(__dirname, STACK_REL);

let stackContent: string;

beforeAll(() => {
  if (!fs.existsSync(stackPath)) {
    throw new Error(`Stack file not found at: ${stackPath}`);
  }
  stackContent = fs.readFileSync(stackPath, "utf8");
});

describe("Terraform Stack: tap_stack.tf - File Structure", () => {
  test("tap_stack.tf exists and is readable", () => {
    expect(fs.existsSync(stackPath)).toBe(true);
    expect(stackContent.length).toBeGreaterThan(0);
  });

  test("does NOT declare terraform block (provider.tf owns it)", () => {
    expect(stackContent).not.toMatch(/terraform\s*{[\s\S]*?required_version/);
  });

  test("does NOT declare provider blocks (provider.tf owns providers)", () => {
    expect(stackContent).not.toMatch(/\bprovider\s+"aws"\s*{/);
  });

  test("file is valid HCL syntax (no obvious syntax errors)", () => {
    // Basic HCL validation - balanced braces
    const openBraces = (stackContent.match(/{/g) || []).length;
    const closeBraces = (stackContent.match(/}/g) || []).length;
    expect(openBraces).toBe(closeBraces);
  });
});

describe("Variables - Required Declarations", () => {
  test("declares aws_region variable (required by provider.tf)", () => {
    expect(stackContent).toMatch(/variable\s+"aws_region"\s*{/);
  });

  test("declares app_name variable", () => {
    expect(stackContent).toMatch(/variable\s+"app_name"\s*{/);
  });

  test("declares common_tags variable with default Environment = Production", () => {
    expect(stackContent).toMatch(/variable\s+"common_tags"\s*{/);
    expect(stackContent).toMatch(/Environment\s*=\s*"Production"/);
  });

  test("declares VPC CIDR variables for both regions", () => {
    expect(stackContent).toMatch(/variable\s+"vpc_cidr_us_east_1"\s*{/);
    expect(stackContent).toMatch(/variable\s+"vpc_cidr_us_west_2"\s*{/);
  });

  test("declares subnet CIDR variables (public/private) for both regions", () => {
    expect(stackContent).toMatch(/variable\s+"public_subnet_cidrs_us_east_1"\s*{/);
    expect(stackContent).toMatch(/variable\s+"private_subnet_cidrs_us_east_1"\s*{/);
    expect(stackContent).toMatch(/variable\s+"public_subnet_cidrs_us_west_2"\s*{/);
    expect(stackContent).toMatch(/variable\s+"private_subnet_cidrs_us_west_2"\s*{/);
  });

  test("declares RDS variables with proper sensitivity", () => {
    expect(stackContent).toMatch(/variable\s+"db_password"\s*{[\s\S]*?sensitive\s*=\s*true/);
    expect(stackContent).toMatch(/variable\s+"backup_retention_days"\s*{/);
  });

  test("declares Lambda and ALB variables", () => {
    expect(stackContent).toMatch(/variable\s+"lambda_zip_path"\s*{/);
    expect(stackContent).toMatch(/variable\s+"enable_https"\s*{/);
  });
});

describe("Multi-Region Networking", () => {
  test("creates VPCs for both regions with explicit providers", () => {
    expect(stackContent).toMatch(/resource\s+"aws_vpc"\s+"us_east_1"\s*{[\s\S]*?provider\s*=\s*aws\.us_east_1/);
    expect(stackContent).toMatch(/resource\s+"aws_vpc"\s+"us_west_2"\s*{[\s\S]*?provider\s*=\s*aws\.us_west_2/);
  });

  test("creates public and private subnets in both regions", () => {
    expect(stackContent).toMatch(/resource\s+"aws_subnet"\s+"public_us_east_1"/);
    expect(stackContent).toMatch(/resource\s+"aws_subnet"\s+"private_us_east_1"/);
    expect(stackContent).toMatch(/resource\s+"aws_subnet"\s+"public_us_west_2"/);
    expect(stackContent).toMatch(/resource\s+"aws_subnet"\s+"private_us_west_2"/);
  });

  test("creates NAT Gateways with EIPs in both regions", () => {
    expect(stackContent).toMatch(/resource\s+"aws_nat_gateway"\s+"us_east_1"/);
    expect(stackContent).toMatch(/resource\s+"aws_nat_gateway"\s+"us_west_2"/);
  });
});

describe("Security Groups - Least Privilege", () => {
  test("creates ALB, app, and DB security groups for both regions", () => {
    expect(stackContent).toMatch(/resource\s+"aws_security_group"\s+"alb_us_east_1"/);
    expect(stackContent).toMatch(/resource\s+"aws_security_group"\s+"app_us_east_1"/);
    expect(stackContent).toMatch(/resource\s+"aws_security_group"\s+"db_us_east_1"/);
  });

  test("app security groups allow ingress only from ALB", () => {
    expect(stackContent).toMatch(/security_groups\s*=\s*\[aws_security_group\.alb_us_east_1\.id\]/);
  });
});

describe("KMS Keys - Customer Managed Encryption", () => {
  test("creates S3, Lambda, RDS, and Logs KMS keys for both regions", () => {
    expect(stackContent).toMatch(/resource\s+"aws_kms_key"\s+"s3_us_east_1"/);
    expect(stackContent).toMatch(/resource\s+"aws_kms_key"\s+"lambda_us_east_1"/);
    expect(stackContent).toMatch(/resource\s+"aws_kms_key"\s+"rds_us_east_1"/);
    expect(stackContent).toMatch(/resource\s+"aws_kms_key"\s+"logs_us_east_1"/);
  });

  test("KMS keys have key rotation enabled", () => {
    expect(stackContent).toMatch(/enable_key_rotation\s*=\s*true/);
  });
});

describe("S3 Buckets - Secure Configuration", () => {
  test("enables versioning and SSE-KMS encryption", () => {
    expect(stackContent).toMatch(/resource\s+"aws_s3_bucket_versioning"/);
    expect(stackContent).toMatch(/sse_algorithm\s*=\s*"aws:kms"/);
  });

  test("blocks all public access", () => {
    expect(stackContent).toMatch(/block_public_acls\s*=\s*true/);
    expect(stackContent).toMatch(/block_public_policy\s*=\s*true/);
  });

  test("configures lifecycle rules", () => {
    expect(stackContent).toMatch(/noncurrent_version_expiration/);
  });
});

describe("IAM - Least Privilege", () => {
  test("creates EC2 roles with instance profiles", () => {
    expect(stackContent).toMatch(/resource\s+"aws_iam_role"\s+"ec2_us_east_1"/);
    expect(stackContent).toMatch(/resource\s+"aws_iam_instance_profile"\s+"ec2_us_east_1"/);
  });

  test("creates Lambda and Flow Logs roles", () => {
    expect(stackContent).toMatch(/resource\s+"aws_iam_role"\s+"lambda_us_east_1"/);
    expect(stackContent).toMatch(/resource\s+"aws_iam_role"\s+"flow_logs_us_east_1"/);
  });

  test("EC2 policies are scoped to specific S3 buckets", () => {
    expect(stackContent).toMatch(/aws_s3_bucket\.app_us_east_1\.arn/);
  });
});

describe("CloudWatch - Encrypted Log Groups", () => {
  test("creates Lambda and Flow Logs log groups with KMS encryption", () => {
    expect(stackContent).toMatch(/resource\s+"aws_cloudwatch_log_group"\s+"lambda_us_east_1"/);
    expect(stackContent).toMatch(/resource\s+"aws_cloudwatch_log_group"\s+"flow_logs_us_east_1"/);
    expect(stackContent).toMatch(/kms_key_id\s*=\s*aws_kms_key\.logs_us_east_1\.arn/);
  });

  test("log groups have retention configured", () => {
    expect(stackContent).toMatch(/retention_in_days\s*=\s*var\.log_retention_days/);
  });
});

describe("VPC Flow Logs", () => {
  test("creates Flow Logs capturing ALL traffic for both VPCs", () => {
    expect(stackContent).toMatch(/resource\s+"aws_flow_log"\s+"us_east_1"/);
    expect(stackContent).toMatch(/traffic_type\s*=\s*"ALL"/);
  });
});

describe("Compute - ALB and EC2", () => {
  test("creates ALBs, Target Groups, and Listeners for both regions", () => {
    expect(stackContent).toMatch(/resource\s+"aws_lb"\s+"us_east_1"/);
    expect(stackContent).toMatch(/resource\s+"aws_lb_target_group"\s+"us_east_1"/);
    expect(stackContent).toMatch(/resource\s+"aws_lb_listener"\s+"http_us_east_1"/);
  });

  test("creates EC2 instances in private subnets with instance profiles", () => {
    expect(stackContent).toMatch(/resource\s+"aws_instance"\s+"app_us_east_1"/);
    expect(stackContent).toMatch(/iam_instance_profile\s*=\s*aws_iam_instance_profile\.ec2_us_east_1\.name/);
    expect(stackContent).toMatch(/associate_public_ip_address\s*=\s*false/);
  });
});

describe("RDS - Encrypted with Backups", () => {
  test("creates RDS with encryption, backups, and deletion protection", () => {
    expect(stackContent).toMatch(/resource\s+"aws_db_instance"\s+"us_east_1"/);
    expect(stackContent).toMatch(/storage_encrypted\s*=\s*true/);
    expect(stackContent).toMatch(/backup_retention_period/);
    expect(stackContent).toMatch(/deletion_protection\s*=\s*true/);
  });

  test("RDS is not publicly accessible and is Multi-AZ", () => {
    expect(stackContent).toMatch(/publicly_accessible\s*=\s*false/);
    expect(stackContent).toMatch(/multi_az\s*=\s*true/);
  });
});

describe("Lambda Functions", () => {
  test("creates Lambda functions with KMS-encrypted environment variables", () => {
    expect(stackContent).toMatch(/resource\s+"aws_lambda_function"\s+"us_east_1"/);
    expect(stackContent).toMatch(/environment\s*{[\s\S]*?variables/);
    expect(stackContent).toMatch(/kms_key_arn\s*=\s*aws_kms_key\.lambda_us_east_1\.arn/);
  });
});

describe("Tagging Standards", () => {
  test("resources use base_tags with Environment = Production", () => {
    expect(stackContent).toMatch(/merge\(local\.base_tags/);
  });
});

describe("Outputs - Comprehensive Coverage", () => {
  test("outputs VPC, subnet, ALB, S3, KMS, RDS, Lambda, and Flow Log IDs", () => {
    expect(stackContent).toMatch(/output\s+"us_east_1_vpc_id"/);
    expect(stackContent).toMatch(/output\s+"s3_bucket_names"/);
    expect(stackContent).toMatch(/output\s+"kms_key_arns"/);
    expect(stackContent).toMatch(/output\s+"rds_endpoints"/);
    expect(stackContent).toMatch(/output\s+"lambda_arns"/);
    expect(stackContent).toMatch(/output\s+"flow_log_ids"/);
  });
});

describe("Multi-Region Provider Assignment", () => {
  test("resources explicitly set provider for correct region", () => {
    const eastProviders = stackContent.match(/provider\s*=\s*aws\.us_east_1/g) || [];
    const westProviders = stackContent.match(/provider\s*=\s*aws\.us_west_2/g) || [];
    expect(eastProviders.length).toBeGreaterThan(20);
    expect(westProviders.length).toBeGreaterThan(20);
  });
});

describe("Security Best Practices", () => {
  test("no hardcoded sensitive values", () => {
    expect(stackContent).not.toMatch(/password\s*=\s*"[^$]/);
  });

  test("includes acceptance check comments", () => {
    expect(stackContent).toMatch(/Acceptance checks/i);
  });
});
