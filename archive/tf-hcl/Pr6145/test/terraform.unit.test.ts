// tests/unit/terraform.unit.test.ts
// Comprehensive unit tests for ../lib/tap_stack.tf
// Tests validate the Terraform configuration without executing terraform commands

import fs from "fs";
import path from "path";

const STACK_FILE = "../lib/tap_stack.tf";
const PROVIDER_FILE = "../lib/provider.tf";
const stackPath = path.resolve(__dirname, STACK_FILE);
const providerPath = path.resolve(__dirname, PROVIDER_FILE);

describe("Terraform Infrastructure - File Structure", () => {
  let stackContent: string;
  let providerContent: string;

  beforeAll(() => {
    stackContent = fs.existsSync(stackPath) ? fs.readFileSync(stackPath, "utf8") : "";
    providerContent = fs.existsSync(providerPath) ? fs.readFileSync(providerPath, "utf8") : "";
  });

  test("tap_stack.tf file exists", () => {
    expect(fs.existsSync(stackPath)).toBe(true);
  });

  test("provider.tf file exists", () => {
    expect(fs.existsSync(providerPath)).toBe(true);
  });

  test("tap_stack.tf is not empty", () => {
    expect(stackContent.length).toBeGreaterThan(0);
  });

  test("provider configuration is NOT duplicated in tap_stack.tf", () => {
    expect(stackContent).not.toMatch(/\bprovider\s+"aws"\s*{/);
  });

  test("provider.tf contains AWS provider configuration", () => {
    expect(providerContent).toMatch(/provider\s+"aws"\s*{/);
  });
});

describe("Terraform Infrastructure - Variables", () => {
  let stackContent: string;

  beforeAll(() => {
    stackContent = fs.readFileSync(stackPath, "utf8");
  });

  test("declares aws_region variable", () => {
    expect(stackContent).toMatch(/variable\s+"aws_region"\s*{/);
  });

  test("declares trusted_ssh_cidr variable", () => {
    expect(stackContent).toMatch(/variable\s+"trusted_ssh_cidr"\s*{/);
  });

  test("declares environment variable", () => {
    expect(stackContent).toMatch(/variable\s+"environment"\s*{/);
  });

  test("declares project_name variable", () => {
    expect(stackContent).toMatch(/variable\s+"project_name"\s*{/);
  });

  test("declares rds_username variable as sensitive", () => {
    const rdsUserMatch = stackContent.match(/variable\s+"rds_username"\s*{[^}]*}/s);
    expect(rdsUserMatch).toBeTruthy();
    expect(rdsUserMatch![0]).toMatch(/sensitive\s*=\s*true/);
  });

  test("uses random password resource for RDS", () => {
    expect(stackContent).toMatch(/resource\s+"random_password"\s+"rds_password"/);
    const randomPassMatch = stackContent.match(/resource\s+"random_password"\s+"rds_password"\s*{[^}]*}/s);
    expect(randomPassMatch).toBeTruthy();
    expect(randomPassMatch![0]).toMatch(/length\s*=\s*32/);
  });

  test("uses AWS Secrets Manager for RDS password", () => {
    expect(stackContent).toMatch(/resource\s+"aws_secretsmanager_secret"\s+"rds_password"/);
    expect(stackContent).toMatch(/resource\s+"aws_secretsmanager_secret_version"\s+"rds_password"/);
  });
});

describe("Terraform Infrastructure - Data Sources", () => {
  let stackContent: string;

  beforeAll(() => {
    stackContent = fs.readFileSync(stackPath, "utf8");
  });

  test("uses aws_caller_identity data source", () => {
    expect(stackContent).toMatch(/data\s+"aws_caller_identity"\s+"current"/);
  });

  test("uses aws_region data source", () => {
    expect(stackContent).toMatch(/data\s+"aws_region"\s+"current"/);
  });

  test("uses aws_availability_zones data source", () => {
    expect(stackContent).toMatch(/data\s+"aws_availability_zones"\s+"available"/);
  });
});

describe("Terraform Infrastructure - KMS Encryption", () => {
  let stackContent: string;

  beforeAll(() => {
    stackContent = fs.readFileSync(stackPath, "utf8");
  });

  test("creates KMS key resource", () => {
    expect(stackContent).toMatch(/resource\s+"aws_kms_key"\s+"main_encryption_key"/);
  });

  test("KMS key has key rotation enabled", () => {
    const kmsKeyMatch = stackContent.match(/resource\s+"aws_kms_key"\s+"main_encryption_key"\s*{[^}]*enable_key_rotation\s*=\s*true/s);
    expect(kmsKeyMatch).toBeTruthy();
  });

  test("creates KMS alias for the encryption key", () => {
    expect(stackContent).toMatch(/resource\s+"aws_kms_alias"\s+"main_encryption_key_alias"/);
  });

  test("KMS alias references the main encryption key", () => {
    // Match more flexibly across lines
    const aliasBlock = stackContent.match(/resource\s+"aws_kms_alias"\s+"main_encryption_key_alias"\s*\{[\s\S]*?\n\}/);
    expect(aliasBlock).toBeTruthy();
    expect(aliasBlock![0]).toMatch(/target_key_id\s*=\s*aws_kms_key\.main_encryption_key\.key_id/);
  });
});

describe("Terraform Infrastructure - S3 Buckets", () => {
  let stackContent: string;

  beforeAll(() => {
    stackContent = fs.readFileSync(stackPath, "utf8");
  });

  test("creates CloudTrail logs S3 bucket", () => {
    expect(stackContent).toMatch(/resource\s+"aws_s3_bucket"\s+"cloudtrail_logs"/);
  });

  test("creates application data S3 bucket", () => {
    expect(stackContent).toMatch(/resource\s+"aws_s3_bucket"\s+"application_data"/);
  });

  test("creates AWS Config S3 bucket", () => {
    expect(stackContent).toMatch(/resource\s+"aws_s3_bucket"\s+"config"/);
  });

  test("CloudTrail bucket has versioning enabled", () => {
    expect(stackContent).toMatch(/resource\s+"aws_s3_bucket_versioning"\s+"cloudtrail_logs_versioning"/);
  });

  test("application data bucket has versioning enabled", () => {
    expect(stackContent).toMatch(/resource\s+"aws_s3_bucket_versioning"\s+"application_data_versioning"/);
  });

  test("Config bucket has versioning enabled", () => {
    expect(stackContent).toMatch(/resource\s+"aws_s3_bucket_versioning"\s+"config_versioning"/);
  });

  test("CloudTrail bucket has KMS encryption", () => {
    expect(stackContent).toMatch(/resource\s+"aws_s3_bucket_server_side_encryption_configuration"\s+"cloudtrail_logs_encryption"/);
    const encryptionMatch = stackContent.match(/resource\s+"aws_s3_bucket_server_side_encryption_configuration"\s+"cloudtrail_logs_encryption"\s*{[^}]*sse_algorithm\s*=\s*"aws:kms"/s);
    expect(encryptionMatch).toBeTruthy();
  });

  test("application data bucket has KMS encryption", () => {
    expect(stackContent).toMatch(/resource\s+"aws_s3_bucket_server_side_encryption_configuration"\s+"application_data_encryption"/);
    const encryptionMatch = stackContent.match(/resource\s+"aws_s3_bucket_server_side_encryption_configuration"\s+"application_data_encryption"\s*{[^}]*sse_algorithm\s*=\s*"aws:kms"/s);
    expect(encryptionMatch).toBeTruthy();
  });

  test("Config bucket has KMS encryption", () => {
    expect(stackContent).toMatch(/resource\s+"aws_s3_bucket_server_side_encryption_configuration"\s+"config_encryption"/);
    const encryptionMatch = stackContent.match(/resource\s+"aws_s3_bucket_server_side_encryption_configuration"\s+"config_encryption"\s*{[^}]*sse_algorithm\s*=\s*"aws:kms"/s);
    expect(encryptionMatch).toBeTruthy();
  });

  test("all S3 buckets block public access", () => {
    expect(stackContent).toMatch(/resource\s+"aws_s3_bucket_public_access_block"\s+"cloudtrail_logs_pab"/);
    expect(stackContent).toMatch(/resource\s+"aws_s3_bucket_public_access_block"\s+"application_data_pab"/);
    expect(stackContent).toMatch(/resource\s+"aws_s3_bucket_public_access_block"\s+"config_pab"/);
  });

  test("public access block has all protections enabled", () => {
    const pabMatches = stackContent.matchAll(/resource\s+"aws_s3_bucket_public_access_block"[^}]*{([^}]*)}/gs);
    for (const match of pabMatches) {
      expect(match[1]).toMatch(/block_public_acls\s*=\s*true/);
      expect(match[1]).toMatch(/block_public_policy\s*=\s*true/);
      expect(match[1]).toMatch(/ignore_public_acls\s*=\s*true/);
      expect(match[1]).toMatch(/restrict_public_buckets\s*=\s*true/);
    }
  });

  test("CloudTrail bucket has proper bucket policy", () => {
    expect(stackContent).toMatch(/resource\s+"aws_s3_bucket_policy"\s+"cloudtrail_logs_policy"/);
  });

  test("Config bucket has proper bucket policy", () => {
    expect(stackContent).toMatch(/resource\s+"aws_s3_bucket_policy"\s+"config_bucket_policy"/);
  });

  test("S3 buckets do not have deletion protection", () => {
    // Check that S3 buckets have force_destroy = true
    const cloudtrailBucket = stackContent.match(/resource\s+"aws_s3_bucket"\s+"cloudtrail_logs"\s*\{[\s\S]*?\n\}/);
    const appDataBucket = stackContent.match(/resource\s+"aws_s3_bucket"\s+"application_data"\s*\{[\s\S]*?\n\}/);
    const configBucket = stackContent.match(/resource\s+"aws_s3_bucket"\s+"config"\s*\{[\s\S]*?\n\}/);
    
    expect(cloudtrailBucket![0]).toMatch(/force_destroy\s*=\s*true/);
    expect(appDataBucket![0]).toMatch(/force_destroy\s*=\s*true/);
    expect(configBucket![0]).toMatch(/force_destroy\s*=\s*true/);
  });
});

describe("Terraform Infrastructure - CloudTrail", () => {
  let stackContent: string;

  beforeAll(() => {
    stackContent = fs.readFileSync(stackPath, "utf8");
  });

  test("creates CloudTrail resource", () => {
    expect(stackContent).toMatch(/resource\s+"aws_cloudtrail"\s+"main"/);
  });

  test("CloudTrail is multi-region", () => {
    const cloudtrailBlock = stackContent.match(/resource\s+"aws_cloudtrail"\s+"main"\s*\{[\s\S]*?(?=\n\s*depends_on|\n\})/);
    expect(cloudtrailBlock).toBeTruthy();
    expect(cloudtrailBlock![0]).toMatch(/is_multi_region_trail\s*=\s*true/);
  });

  test("CloudTrail has log file validation enabled", () => {
    const cloudtrailBlock = stackContent.match(/resource\s+"aws_cloudtrail"\s+"main"\s*\{[\s\S]*?(?=\n\s*depends_on|\n\})/);
    expect(cloudtrailBlock).toBeTruthy();
    expect(cloudtrailBlock![0]).toMatch(/enable_log_file_validation\s*=\s*true/);
  });

  test("CloudTrail includes global service events", () => {
    const cloudtrailBlock = stackContent.match(/resource\s+"aws_cloudtrail"\s+"main"\s*\{[\s\S]*?(?=\n\s*depends_on|\n\})/);
    expect(cloudtrailBlock).toBeTruthy();
    expect(cloudtrailBlock![0]).toMatch(/include_global_service_events\s*=\s*true/);
  });

  test("CloudTrail uses KMS encryption", () => {
    const cloudtrailBlock = stackContent.match(/resource\s+"aws_cloudtrail"\s+"main"\s*\{[\s\S]*?(?=\n\s*depends_on|\n\})/);
    expect(cloudtrailBlock).toBeTruthy();
    expect(cloudtrailBlock![0]).toMatch(/kms_key_id\s*=\s*aws_kms_key\.main_encryption_key\.arn/);
  });
});

describe("Terraform Infrastructure - VPC and Networking", () => {
  let stackContent: string;

  beforeAll(() => {
    stackContent = fs.readFileSync(stackPath, "utf8");
  });

  test("creates VPC resource", () => {
    expect(stackContent).toMatch(/resource\s+"aws_vpc"\s+"main"/);
  });

  test("VPC has DNS support enabled", () => {
    const vpcMatch = stackContent.match(/resource\s+"aws_vpc"\s+"main"\s*{[^}]*enable_dns_support\s*=\s*true/s);
    expect(vpcMatch).toBeTruthy();
  });

  test("VPC has DNS hostnames enabled", () => {
    const vpcMatch = stackContent.match(/resource\s+"aws_vpc"\s+"main"\s*{[^}]*enable_dns_hostnames\s*=\s*true/s);
    expect(vpcMatch).toBeTruthy();
  });

  test("creates Internet Gateway", () => {
    expect(stackContent).toMatch(/resource\s+"aws_internet_gateway"\s+"main"/);
  });

  test("creates public subnet", () => {
    expect(stackContent).toMatch(/resource\s+"aws_subnet"\s+"public"/);
  });

  test("creates private subnets for RDS", () => {
    expect(stackContent).toMatch(/resource\s+"aws_subnet"\s+"private_1"/);
    expect(stackContent).toMatch(/resource\s+"aws_subnet"\s+"private_2"/);
  });

  test("creates route table for public subnet", () => {
    expect(stackContent).toMatch(/resource\s+"aws_route_table"\s+"public"/);
  });

  test("creates route table association", () => {
    expect(stackContent).toMatch(/resource\s+"aws_route_table_association"\s+"public"/);
  });
});

describe("Terraform Infrastructure - Security Groups", () => {
  let stackContent: string;

  beforeAll(() => {
    stackContent = fs.readFileSync(stackPath, "utf8");
  });

  test("creates EC2 security group", () => {
    expect(stackContent).toMatch(/resource\s+"aws_security_group"\s+"ec2_instance"/);
  });

  test("creates RDS security group", () => {
    expect(stackContent).toMatch(/resource\s+"aws_security_group"\s+"rds"/);
  });

  test("EC2 security group restricts SSH to trusted CIDR", () => {
    const sgMatch = stackContent.match(/resource\s+"aws_security_group"\s+"ec2_instance"\s*{.*?ingress\s*{[^}]*from_port\s*=\s*22[^}]*cidr_blocks\s*=\s*\[var\.trusted_ssh_cidr\]/s);
    expect(sgMatch).toBeTruthy();
  });

  test("EC2 security group does not allow SSH from 0.0.0.0/0", () => {
    const sgMatch = stackContent.match(/resource\s+"aws_security_group"\s+"ec2_instance"[^}]*/s);
    if (sgMatch) {
      const sshRules = sgMatch[0].match(/from_port\s*=\s*22.*?cidr_blocks\s*=\s*\["0\.0\.0\.0\/0"\]/s);
      expect(sshRules).toBeNull();
    }
  });

  test("RDS security group allows access only from EC2 security group", () => {
    const rdsMatch = stackContent.match(/resource\s+"aws_security_group"\s+"rds"\s*{.*?security_groups\s*=\s*\[aws_security_group\.ec2_instance\.id\]/s);
    expect(rdsMatch).toBeTruthy();
  });
});

describe("Terraform Infrastructure - IAM Roles and Policies", () => {
  let stackContent: string;

  beforeAll(() => {
    stackContent = fs.readFileSync(stackPath, "utf8");
  });

  test("creates IAM role for EC2 instances", () => {
    expect(stackContent).toMatch(/resource\s+"aws_iam_role"\s+"ec2_instance"/);
  });

  test("creates IAM policy for EC2 instances", () => {
    expect(stackContent).toMatch(/resource\s+"aws_iam_policy"\s+"ec2_instance"/);
  });

  test("creates IAM instance profile for EC2", () => {
    expect(stackContent).toMatch(/resource\s+"aws_iam_instance_profile"\s+"ec2_instance"/);
  });

  test("attaches policy to EC2 role", () => {
    expect(stackContent).toMatch(/resource\s+"aws_iam_role_policy_attachment"\s+"ec2_instance"/);
  });

  test("creates IAM account password policy", () => {
    expect(stackContent).toMatch(/resource\s+"aws_iam_account_password_policy"\s+"strict"/);
  });

  test("password policy requires minimum length of 14 characters", () => {
    const policyMatch = stackContent.match(/resource\s+"aws_iam_account_password_policy"\s+"strict"\s*{[^}]*minimum_password_length\s*=\s*14/s);
    expect(policyMatch).toBeTruthy();
  });

  test("password policy requires uppercase characters", () => {
    const policyMatch = stackContent.match(/resource\s+"aws_iam_account_password_policy"\s+"strict"\s*{[^}]*require_uppercase_characters\s*=\s*true/s);
    expect(policyMatch).toBeTruthy();
  });

  test("password policy requires lowercase characters", () => {
    const policyMatch = stackContent.match(/resource\s+"aws_iam_account_password_policy"\s+"strict"\s*{[^}]*require_lowercase_characters\s*=\s*true/s);
    expect(policyMatch).toBeTruthy();
  });

  test("password policy requires numbers", () => {
    const policyMatch = stackContent.match(/resource\s+"aws_iam_account_password_policy"\s+"strict"\s*{[^}]*require_numbers\s*=\s*true/s);
    expect(policyMatch).toBeTruthy();
  });

  test("password policy requires symbols", () => {
    const policyMatch = stackContent.match(/resource\s+"aws_iam_account_password_policy"\s+"strict"\s*{[^}]*require_symbols\s*=\s*true/s);
    expect(policyMatch).toBeTruthy();
  });

  test("password policy prevents password reuse", () => {
    const policyMatch = stackContent.match(/resource\s+"aws_iam_account_password_policy"\s+"strict"\s*{[^}]*password_reuse_prevention\s*=\s*\d+/s);
    expect(policyMatch).toBeTruthy();
  });

  test("creates MFA requirement policy", () => {
    expect(stackContent).toMatch(/resource\s+"aws_iam_policy"\s+"require_mfa"/);
  });

  test("creates IAM role for AWS Config", () => {
    expect(stackContent).toMatch(/resource\s+"aws_iam_role"\s+"config"/);
  });

  test("creates IAM policy for AWS Config", () => {
    expect(stackContent).toMatch(/resource\s+"aws_iam_policy"\s+"config"/);
  });
});

describe("Terraform Infrastructure - RDS Database", () => {
  let stackContent: string;

  beforeAll(() => {
    stackContent = fs.readFileSync(stackPath, "utf8");
  });

  test("creates RDS subnet group", () => {
    expect(stackContent).toMatch(/resource\s+"aws_db_subnet_group"\s+"main"/);
  });

  test("creates RDS instance", () => {
    expect(stackContent).toMatch(/resource\s+"aws_db_instance"\s+"main"/);
  });

  test("RDS instance has storage encryption enabled", () => {
    const rdsBlock = stackContent.match(/resource\s+"aws_db_instance"\s+"main"\s*\{[\s\S]*?(?=\n\})/);
    expect(rdsBlock).toBeTruthy();
    expect(rdsBlock![0]).toMatch(/storage_encrypted\s*=\s*true/);
  });

  test("RDS instance uses KMS encryption", () => {
    const rdsBlock = stackContent.match(/resource\s+"aws_db_instance"\s+"main"\s*\{[\s\S]*?(?=\n\})/);
    expect(rdsBlock).toBeTruthy();
    expect(rdsBlock![0]).toMatch(/kms_key_id\s*=\s*aws_kms_key\.main_encryption_key\.arn/);
  });

  test("RDS instance is not publicly accessible", () => {
    const rdsBlock = stackContent.match(/resource\s+"aws_db_instance"\s+"main"\s*\{[\s\S]*?(?=\n\})/);
    expect(rdsBlock).toBeTruthy();
    expect(rdsBlock![0]).toMatch(/publicly_accessible\s*=\s*false/);
  });

  test("RDS instance has automated backups configured", () => {
    const rdsBlock = stackContent.match(/resource\s+"aws_db_instance"\s+"main"\s*\{[\s\S]*?(?=\n\})/);
    expect(rdsBlock).toBeTruthy();
    expect(rdsBlock![0]).toMatch(/backup_retention_period\s*=\s*\d+/);
  });

  test("RDS instance does NOT have deletion protection enabled", () => {
    const rdsBlock = stackContent.match(/resource\s+"aws_db_instance"\s+"main"\s*\{[\s\S]*?(?=\n\})/);
    expect(rdsBlock).toBeTruthy();
    expect(rdsBlock![0]).toMatch(/deletion_protection\s*=\s*false/);
  });

  test("RDS instance has skip_final_snapshot enabled for testing", () => {
    const rdsBlock = stackContent.match(/resource\s+"aws_db_instance"\s+"main"\s*\{[\s\S]*?(?=\n\})/);
    expect(rdsBlock).toBeTruthy();
    expect(rdsBlock![0]).toMatch(/skip_final_snapshot\s*=\s*true/);
  });

  test("RDS instance has Performance Insights enabled", () => {
    const rdsBlock = stackContent.match(/resource\s+"aws_db_instance"\s+"main"\s*\{[\s\S]*?(?=\n\})/);
    expect(rdsBlock).toBeTruthy();
    expect(rdsBlock![0]).toMatch(/performance_insights_enabled\s*=\s*true/);
  });
});

describe("Terraform Infrastructure - AWS Config", () => {
  let stackContent: string;

  beforeAll(() => {
    stackContent = fs.readFileSync(stackPath, "utf8");
  });

  test("creates AWS Config configuration recorder", () => {
    expect(stackContent).toMatch(/resource\s+"aws_config_configuration_recorder"\s+"main"/);
  });

  test("creates AWS Config delivery channel", () => {
    expect(stackContent).toMatch(/resource\s+"aws_config_delivery_channel"\s+"main"/);
  });

  test("creates AWS Config recorder status", () => {
    expect(stackContent).toMatch(/resource\s+"aws_config_configuration_recorder_status"\s+"main"/);
  });

  test("Config recorder is enabled", () => {
    const recorderMatch = stackContent.match(/resource\s+"aws_config_configuration_recorder_status"\s+"main"\s*{[^}]*is_enabled\s*=\s*true/s);
    expect(recorderMatch).toBeTruthy();
  });

  test("creates Config rule for S3 bucket encryption", () => {
    expect(stackContent).toMatch(/resource\s+"aws_config_config_rule"\s+"s3_bucket_encryption"/);
  });

  test("S3 encryption rule uses AWS managed rule", () => {
    const ruleBlock = stackContent.match(/resource\s+"aws_config_config_rule"\s+"s3_bucket_encryption"\s*\{[\s\S]*?(?=\n\s*depends_on)/);
    expect(ruleBlock).toBeTruthy();
    expect(ruleBlock![0]).toMatch(/source_identifier\s*=\s*"S3_BUCKET_SERVER_SIDE_ENCRYPTION_ENABLED"/);
  });

  test("creates Config rule for IAM user MFA", () => {
    expect(stackContent).toMatch(/resource\s+"aws_config_config_rule"\s+"iam_user_mfa_enabled"/);
  });

  test("creates Config rule for CloudTrail enabled", () => {
    expect(stackContent).toMatch(/resource\s+"aws_config_config_rule"\s+"cloudtrail_enabled"/);
  });

  test("creates Config rule for restricted SSH", () => {
    expect(stackContent).toMatch(/resource\s+"aws_config_config_rule"\s+"restricted_ssh"/);
  });

  test("creates Config rule for S3 public read prohibited", () => {
    expect(stackContent).toMatch(/resource\s+"aws_config_config_rule"\s+"s3_bucket_public_read_prohibited"/);
  });

  test("creates Config rule for S3 public write prohibited", () => {
    expect(stackContent).toMatch(/resource\s+"aws_config_config_rule"\s+"s3_bucket_public_write_prohibited"/);
  });

  test("creates Config rule for RDS encryption", () => {
    expect(stackContent).toMatch(/resource\s+"aws_config_config_rule"\s+"rds_encryption_enabled"/);
  });

  test("creates Config rule for IAM password policy", () => {
    expect(stackContent).toMatch(/resource\s+"aws_config_config_rule"\s+"iam_password_policy"/);
  });

  test("IAM password policy rule has proper parameters", () => {
    const ruleBlock = stackContent.match(/resource\s+"aws_config_config_rule"\s+"iam_password_policy"\s*\{[\s\S]*?(?=\n\s*depends_on)/);
    expect(ruleBlock).toBeTruthy();
    expect(ruleBlock![0]).toMatch(/input_parameters\s*=\s*jsonencode\s*\(/);
  });
});

describe("Terraform Infrastructure - Outputs", () => {
  let stackContent: string;

  beforeAll(() => {
    stackContent = fs.readFileSync(stackPath, "utf8");
  });

  test("defines output for CloudTrail name", () => {
    expect(stackContent).toMatch(/output\s+"cloudtrail_name"/);
  });

  test("defines output for CloudTrail S3 bucket", () => {
    expect(stackContent).toMatch(/output\s+"cloudtrail_s3_bucket"/);
  });

  test("defines output for application S3 bucket", () => {
    expect(stackContent).toMatch(/output\s+"application_s3_bucket"/);
  });

  test("defines output for Config recorder name", () => {
    expect(stackContent).toMatch(/output\s+"config_recorder_name"/);
  });

  test("defines output for RDS endpoint", () => {
    expect(stackContent).toMatch(/output\s+"rds_endpoint"/);
  });

  test("RDS endpoint output is marked as sensitive", () => {
    const outputMatch = stackContent.match(/output\s+"rds_endpoint"\s*{[^}]*sensitive\s*=\s*true/s);
    expect(outputMatch).toBeTruthy();
  });

  test("defines output for KMS key ID", () => {
    expect(stackContent).toMatch(/output\s+"kms_key_id"/);
  });

  test("defines output for VPC ID", () => {
    expect(stackContent).toMatch(/output\s+"vpc_id"/);
  });

  test("defines output for EC2 role name", () => {
    expect(stackContent).toMatch(/output\s+"ec2_role_name"/);
  });
});

describe("Terraform Infrastructure - Security Best Practices", () => {
  let stackContent: string;

  beforeAll(() => {
    stackContent = fs.readFileSync(stackPath, "utf8");
  });

  test("all resources use common tags via locals", () => {
    expect(stackContent).toMatch(/locals\s*{[^}]*common_tags/s);
  });

  test("common tags include Environment", () => {
    const localsMatch = stackContent.match(/locals\s*{[^}]*common_tags\s*=\s*{[^}]*Environment/s);
    expect(localsMatch).toBeTruthy();
  });

  test("common tags include Project", () => {
    const localsMatch = stackContent.match(/locals\s*{[^}]*common_tags\s*=\s*{[^}]*Project/s);
    expect(localsMatch).toBeTruthy();
  });

  test("common tags include ManagedBy", () => {
    const localsMatch = stackContent.match(/locals\s*{[^}]*common_tags\s*=\s*{[^}]*ManagedBy/s);
    expect(localsMatch).toBeTruthy();
  });

  test("no hardcoded AWS account IDs except in dynamic references", () => {
    const hardcodedAccounts = stackContent.match(/\b\d{12}\b/g);
    // Should only appear in data source references like data.aws_caller_identity.current.account_id
    if (hardcodedAccounts) {
      hardcodedAccounts.forEach(account => {
        const context = stackContent.substring(
          Math.max(0, stackContent.indexOf(account) - 50),
          Math.min(stackContent.length, stackContent.indexOf(account) + 50)
        );
        // Allow account IDs only in comments or variable defaults, not in actual resource definitions
        expect(context).toMatch(/(?:data\.aws_caller_identity|account_id|#|\/\/)/);
      });
    }
  });

  test("sensitive variables are properly marked", () => {
    // Only rds_username is a variable now; rds_password is generated via random_password
    const sensitiveVars = ["rds_username"];
    sensitiveVars.forEach(varName => {
      const varMatch = stackContent.match(new RegExp(`variable\\s+"${varName}"\\s*{[^}]*}`, 's'));
      expect(varMatch).toBeTruthy();
      expect(varMatch![0]).toMatch(/sensitive\s*=\s*true/);
    });
    
    // Verify random password resource exists for security
    expect(stackContent).toMatch(/resource\s+"random_password"\s+"rds_password"/);
  });

  test("no retention policies are set (deletion protection disabled)", () => {
    expect(stackContent).not.toMatch(/deletion_protection\s*=\s*true/);
    expect(stackContent).not.toMatch(/prevent_destroy\s*=\s*true/);
  });

  test("all encryption uses KMS CMK, not AWS managed keys", () => {
    const encryptionConfigs = stackContent.matchAll(/sse_algorithm\s*=\s*"aws:kms"/g);
    const kmsReferences = stackContent.matchAll(/kms_key_id\s*=\s*aws_kms_key\.main_encryption_key/g);
    
    // Ensure that when KMS encryption is used, it references the custom key
    expect(Array.from(encryptionConfigs).length).toBeGreaterThan(0);
    expect(Array.from(kmsReferences).length).toBeGreaterThan(0);
  });

  test("no default VPC is used", () => {
    expect(stackContent).toMatch(/resource\s+"aws_vpc"\s+"main"/);
    expect(stackContent).not.toMatch(/default\s*=\s*true/);
  });
});

describe("Terraform Infrastructure - Compliance Requirements", () => {
  let stackContent: string;

  beforeAll(() => {
    stackContent = fs.readFileSync(stackPath, "utf8");
  });

  test("implements CloudTrail for API logging", () => {
    expect(stackContent).toMatch(/resource\s+"aws_cloudtrail"\s+"main"/);
  });

  test("implements S3 bucket encryption", () => {
    const s3Buckets = stackContent.match(/resource\s+"aws_s3_bucket"\s+"/g);
    const encryptionConfigs = stackContent.match(/resource\s+"aws_s3_bucket_server_side_encryption_configuration"\s+"/g);
    
    expect(s3Buckets).toBeTruthy();
    expect(encryptionConfigs).toBeTruthy();
    expect(encryptionConfigs!.length).toBeGreaterThanOrEqual(3); // At least 3 buckets encrypted
  });

  test("implements S3 bucket versioning", () => {
    const versioningConfigs = stackContent.match(/resource\s+"aws_s3_bucket_versioning"\s+"/g);
    expect(versioningConfigs).toBeTruthy();
    expect(versioningConfigs!.length).toBeGreaterThanOrEqual(3);
  });

  test("implements security group restrictions", () => {
    expect(stackContent).toMatch(/resource\s+"aws_security_group"/);
    expect(stackContent).toMatch(/var\.trusted_ssh_cidr/);
  });

  test("implements IAM roles instead of users for EC2", () => {
    expect(stackContent).toMatch(/resource\s+"aws_iam_role"\s+"ec2_instance"/);
    expect(stackContent).toMatch(/resource\s+"aws_iam_instance_profile"/);
  });

  test("implements strong IAM password policy", () => {
    expect(stackContent).toMatch(/resource\s+"aws_iam_account_password_policy"/);
  });

  test("implements MFA enforcement policy", () => {
    expect(stackContent).toMatch(/resource\s+"aws_iam_policy"\s+"require_mfa"/);
  });

  test("implements RDS encryption at rest", () => {
    const rdsBlock = stackContent.match(/resource\s+"aws_db_instance"\s+"main"\s*\{[\s\S]*?(?=\n\})/);
    expect(rdsBlock).toBeTruthy();
    expect(rdsBlock![0]).toMatch(/storage_encrypted\s*=\s*true/);
  });

  test("implements AWS Config monitoring", () => {
    expect(stackContent).toMatch(/resource\s+"aws_config_configuration_recorder"/);
    expect(stackContent).toMatch(/resource\s+"aws_config_delivery_channel"/);
  });

  test("implements AWS Config compliance rules", () => {
    const configRules = stackContent.match(/resource\s+"aws_config_config_rule"/g);
    expect(configRules).toBeTruthy();
    expect(configRules!.length).toBeGreaterThanOrEqual(8); // At least 8 compliance rules
  });
});

describe("Terraform Infrastructure - Advanced S3 Security", () => {
  let stackContent: string;

  beforeAll(() => {
    stackContent = fs.readFileSync(stackPath, "utf8");
  });

  test("CloudTrail bucket policy allows CloudTrail service", () => {
    const policyBlock = stackContent.match(/resource\s+"aws_s3_bucket_policy"\s+"cloudtrail_logs_policy"\s*\{[\s\S]*?(?=\n\s*depends_on)/);
    expect(policyBlock).toBeTruthy();
    expect(policyBlock![0]).toMatch(/cloudtrail\.amazonaws\.com/);
  });

  test("CloudTrail bucket policy enforces encryption", () => {
    const policyBlock = stackContent.match(/resource\s+"aws_s3_bucket_policy"\s+"cloudtrail_logs_policy"\s*\{[\s\S]*?(?=\n\s*depends_on)/);
    expect(policyBlock).toBeTruthy();
    expect(policyBlock![0]).toMatch(/DenyUnencryptedObjectUploads/);
  });

  test("Config bucket policy allows AWS Config service", () => {
    const policyBlock = stackContent.match(/resource\s+"aws_s3_bucket_policy"\s+"config_bucket_policy"\s*\{[\s\S]*?(?=\n\s*depends_on)/);
    expect(policyBlock).toBeTruthy();
    expect(policyBlock![0]).toMatch(/config\.amazonaws\.com/);
  });

  test("all S3 bucket encryption uses same KMS key", () => {
    const encryptionBlocks = stackContent.match(/resource\s+"aws_s3_bucket_server_side_encryption_configuration"[\s\S]*?kms_master_key_id\s*=\s*aws_kms_key\.main_encryption_key\.arn/g);
    expect(encryptionBlocks).toBeTruthy();
    expect(encryptionBlocks!.length).toBe(3);
  });

  test("S3 versioning status is Enabled, not Suspended", () => {
    const versioningBlocks = stackContent.match(/resource\s+"aws_s3_bucket_versioning"[\s\S]*?status\s*=\s*"Enabled"/g);
    expect(versioningBlocks).toBeTruthy();
    expect(versioningBlocks!.length).toBeGreaterThanOrEqual(3);
  });
});

describe("Terraform Infrastructure - KMS Key Security", () => {
  let stackContent: string;

  beforeAll(() => {
    stackContent = fs.readFileSync(stackPath, "utf8");
  });

  test("KMS key has deletion window configured", () => {
    const kmsBlock = stackContent.match(/resource\s+"aws_kms_key"\s+"main_encryption_key"\s*\{[\s\S]*?(?=\n\})/);
    expect(kmsBlock).toBeTruthy();
    expect(kmsBlock![0]).toMatch(/deletion_window_in_days\s*=\s*\d+/);
  });

  test("KMS key is used by CloudTrail", () => {
    const cloudtrailBlock = stackContent.match(/resource\s+"aws_cloudtrail"\s+"main"\s*\{[\s\S]*?(?=\n\s*depends_on)/);
    expect(cloudtrailBlock![0]).toMatch(/kms_key_id\s*=\s*aws_kms_key\.main_encryption_key\.arn/);
  });

  test("KMS key is used by RDS", () => {
    const rdsBlock = stackContent.match(/resource\s+"aws_db_instance"\s+"main"\s*\{[\s\S]*?(?=\n\})/);
    expect(rdsBlock![0]).toMatch(/kms_key_id\s*=\s*aws_kms_key\.main_encryption_key\.arn/);
  });

  test("KMS key is used for RDS Performance Insights", () => {
    const rdsBlock = stackContent.match(/resource\s+"aws_db_instance"\s+"main"\s*\{[\s\S]*?(?=\n\})/);
    expect(rdsBlock![0]).toMatch(/performance_insights_kms_key_id\s*=\s*aws_kms_key\.main_encryption_key\.arn/);
  });

  test("KMS alias uses correct naming convention", () => {
    const aliasBlock = stackContent.match(/resource\s+"aws_kms_alias"\s+"main_encryption_key_alias"\s*\{[\s\S]*?\n\}/);
    expect(aliasBlock![0]).toMatch(/name\s*=\s*"alias\/\$\{var\.project_name\}/);
  });
});

describe("Terraform Infrastructure - IAM Security Details", () => {
  let stackContent: string;

  beforeAll(() => {
    stackContent = fs.readFileSync(stackPath, "utf8");
  });

  test("EC2 IAM role has proper assume role policy", () => {
    const roleBlock = stackContent.match(/resource\s+"aws_iam_role"\s+"ec2_instance"\s*\{[\s\S]*?(?=\n\s*tags)/);
    expect(roleBlock).toBeTruthy();
    expect(roleBlock![0]).toMatch(/ec2\.amazonaws\.com/);
  });

  test("EC2 IAM policy follows least privilege", () => {
    const policyBlock = stackContent.match(/resource\s+"aws_iam_policy"\s+"ec2_instance"\s*\{[\s\S]*?(?=\n\})/);
    expect(policyBlock).toBeTruthy();
    expect(policyBlock![0]).toMatch(/s3:GetObject/);
    expect(policyBlock![0]).toMatch(/logs:PutLogEvents/);
  });

  test("Config IAM role has proper assume role policy", () => {
    const roleBlock = stackContent.match(/resource\s+"aws_iam_role"\s+"config"\s*\{[\s\S]*?(?=\n\s*tags)/);
    expect(roleBlock).toBeTruthy();
    expect(roleBlock![0]).toMatch(/config\.amazonaws\.com/);
  });

  test("IAM password policy has max password age", () => {
    const policyBlock = stackContent.match(/resource\s+"aws_iam_account_password_policy"\s+"strict"\s*\{[\s\S]*?(?=\n\})/);
    expect(policyBlock).toBeTruthy();
    expect(policyBlock![0]).toMatch(/max_password_age\s*=\s*\d+/);
  });

  test("IAM password policy allows users to change password", () => {
    const policyBlock = stackContent.match(/resource\s+"aws_iam_account_password_policy"\s+"strict"\s*\{[\s\S]*?(?=\n\})/);
    expect(policyBlock).toBeTruthy();
    expect(policyBlock![0]).toMatch(/allow_users_to_change_password\s*=\s*true/);
  });

  test("MFA policy denies actions without MFA", () => {
    const mfaPolicyBlock = stackContent.match(/resource\s+"aws_iam_policy"\s+"require_mfa"\s*\{[\s\S]*?(?=\n\})/);
    expect(mfaPolicyBlock).toBeTruthy();
    expect(mfaPolicyBlock![0]).toMatch(/DenyAllExceptListedIfNoMFA/);
    expect(mfaPolicyBlock![0]).toMatch(/aws:MultiFactorAuthPresent/);
  });
});

describe("Terraform Infrastructure - Network Security", () => {
  let stackContent: string;

  beforeAll(() => {
    stackContent = fs.readFileSync(stackPath, "utf8");
  });

  test("VPC uses proper CIDR block", () => {
    const vpcBlock = stackContent.match(/resource\s+"aws_vpc"\s+"main"\s*\{[\s\S]*?(?=\n\s*tags)/);
    expect(vpcBlock).toBeTruthy();
    expect(vpcBlock![0]).toMatch(/cidr_block\s*=\s*"10\.0\.0\.0\/16"/);
  });

  test("public subnet is in first AZ", () => {
    const subnetBlock = stackContent.match(/resource\s+"aws_subnet"\s+"public"\s*\{[\s\S]*?(?=\n\s*tags)/);
    expect(subnetBlock).toBeTruthy();
    expect(subnetBlock![0]).toMatch(/availability_zone\s*=\s*data\.aws_availability_zones\.available\.names\[0\]/);
  });

  test("private subnets are in different AZs", () => {
    const private1Block = stackContent.match(/resource\s+"aws_subnet"\s+"private_1"\s*\{[\s\S]*?(?=\n\s*tags)/);
    const private2Block = stackContent.match(/resource\s+"aws_subnet"\s+"private_2"\s*\{[\s\S]*?(?=\n\s*tags)/);
    
    expect(private1Block![0]).toMatch(/availability_zone\s*=\s*data\.aws_availability_zones\.available\.names\[0\]/);
    expect(private2Block![0]).toMatch(/availability_zone\s*=\s*data\.aws_availability_zones\.available\.names\[1\]/);
  });

  test("public route table has internet gateway route", () => {
    const rtBlock = stackContent.match(/resource\s+"aws_route_table"\s+"public"\s*\{[\s\S]*?(?=\n\s*tags)/);
    expect(rtBlock).toBeTruthy();
    expect(rtBlock![0]).toMatch(/cidr_block\s*=\s*"0\.0\.0\.0\/0"/);
    expect(rtBlock![0]).toMatch(/gateway_id\s*=\s*aws_internet_gateway\.main\.id/);
  });

  test("EC2 security group allows HTTPS inbound", () => {
    const sgBlock = stackContent.match(/resource\s+"aws_security_group"\s+"ec2_instance"\s*\{[\s\S]*?(?=\n\s*tags)/);
    expect(sgBlock).toBeTruthy();
    expect(sgBlock![0]).toMatch(/from_port\s*=\s*443/);
  });

  test("EC2 security group has all outbound allowed", () => {
    const sgBlock = stackContent.match(/resource\s+"aws_security_group"\s+"ec2_instance"\s*\{[\s\S]*?(?=\n\s*tags)/);
    expect(sgBlock).toBeTruthy();
    expect(sgBlock![0]).toMatch(/egress[\s\S]*?from_port\s*=\s*0/);
    expect(sgBlock![0]).toMatch(/egress[\s\S]*?to_port\s*=\s*0/);
  });

  test("RDS security group allows MySQL port", () => {
    const sgBlock = stackContent.match(/resource\s+"aws_security_group"\s+"rds"\s*\{[\s\S]*?(?=\n\s*tags)/);
    expect(sgBlock).toBeTruthy();
    expect(sgBlock![0]).toMatch(/from_port\s*=\s*3306/);
  });
});

describe("Terraform Infrastructure - RDS Configuration Details", () => {
  let stackContent: string;

  beforeAll(() => {
    stackContent = fs.readFileSync(stackPath, "utf8");
  });

  test("RDS uses MySQL engine", () => {
    const rdsBlock = stackContent.match(/resource\s+"aws_db_instance"\s+"main"\s*\{[\s\S]*?(?=\n\})/);
    expect(rdsBlock).toBeTruthy();
    expect(rdsBlock![0]).toMatch(/engine\s*=\s*"mysql"/);
  });

  test("RDS has proper instance class", () => {
    const rdsBlock = stackContent.match(/resource\s+"aws_db_instance"\s+"main"\s*\{[\s\S]*?(?=\n\})/);
    expect(rdsBlock![0]).toMatch(/instance_class\s*=\s*"db\.t3\.micro"/);
  });

  test("RDS has storage autoscaling enabled", () => {
    const rdsBlock = stackContent.match(/resource\s+"aws_db_instance"\s+"main"\s*\{[\s\S]*?(?=\n\})/);
    expect(rdsBlock![0]).toMatch(/max_allocated_storage\s*=\s*\d+/);
  });

  test("RDS uses gp3 storage type", () => {
    const rdsBlock = stackContent.match(/resource\s+"aws_db_instance"\s+"main"\s*\{[\s\S]*?(?=\n\})/);
    expect(rdsBlock![0]).toMatch(/storage_type\s*=\s*"gp3"/);
  });

  test("RDS has CloudWatch logs enabled", () => {
    const rdsBlock = stackContent.match(/resource\s+"aws_db_instance"\s+"main"\s*\{[\s\S]*?(?=\n\})/);
    expect(rdsBlock![0]).toMatch(/enabled_cloudwatch_logs_exports/);
    expect(rdsBlock![0]).toMatch(/error/);
    expect(rdsBlock![0]).toMatch(/general/);
  });

  test("RDS has maintenance window configured", () => {
    const rdsBlock = stackContent.match(/resource\s+"aws_db_instance"\s+"main"\s*\{[\s\S]*?(?=\n\})/);
    expect(rdsBlock![0]).toMatch(/maintenance_window\s*=\s*"sun:04:00-sun:05:00"/);
  });

  test("RDS has backup window configured", () => {
    const rdsBlock = stackContent.match(/resource\s+"aws_db_instance"\s+"main"\s*\{[\s\S]*?(?=\n\})/);
    expect(rdsBlock![0]).toMatch(/backup_window\s*=\s*"03:00-04:00"/);
  });

  test("RDS subnet group uses both private subnets", () => {
    const subnetGroupBlock = stackContent.match(/resource\s+"aws_db_subnet_group"\s+"main"\s*\{[\s\S]*?(?=\n\s*tags)/);
    expect(subnetGroupBlock).toBeTruthy();
    expect(subnetGroupBlock![0]).toMatch(/subnet_ids\s*=\s*\[aws_subnet\.private_1\.id,\s*aws_subnet\.private_2\.id\]/);
  });
});

describe("Terraform Infrastructure - CloudTrail Advanced Config", () => {
  let stackContent: string;

  beforeAll(() => {
    stackContent = fs.readFileSync(stackPath, "utf8");
  });

  test("CloudTrail has logging enabled", () => {
    const cloudtrailBlock = stackContent.match(/resource\s+"aws_cloudtrail"\s+"main"\s*\{[\s\S]*?(?=\n\s*depends_on)/);
    expect(cloudtrailBlock![0]).toMatch(/enable_logging\s*=\s*true/);
  });

  test("CloudTrail has event selector for S3 data events", () => {
    const cloudtrailBlock = stackContent.match(/resource\s+"aws_cloudtrail"\s+"main"\s*\{[\s\S]*?(?=\n\s*depends_on)/);
    expect(cloudtrailBlock![0]).toMatch(/event_selector/);
    expect(cloudtrailBlock![0]).toMatch(/AWS::S3::Object/);
  });

  test("CloudTrail captures all read and write events", () => {
    const cloudtrailBlock = stackContent.match(/resource\s+"aws_cloudtrail"\s+"main"\s*\{[\s\S]*?(?=\n\s*depends_on)/);
    expect(cloudtrailBlock![0]).toMatch(/read_write_type\s*=\s*"All"/);
  });

  test("CloudTrail includes management events", () => {
    const cloudtrailBlock = stackContent.match(/resource\s+"aws_cloudtrail"\s+"main"\s*\{[\s\S]*?(?=\n\s*depends_on)/);
    expect(cloudtrailBlock![0]).toMatch(/include_management_events\s*=\s*true/);
  });
});

describe("Terraform Infrastructure - Tagging Strategy", () => {
  let stackContent: string;

  beforeAll(() => {
    stackContent = fs.readFileSync(stackPath, "utf8");
  });

  test("locals block defines common_tags", () => {
    expect(stackContent).toMatch(/locals\s*\{[\s\S]*?common_tags\s*=/);
  });

  test("tags use merge function with common_tags", () => {
    const tagUsages = stackContent.match(/tags\s*=\s*merge\(local\.common_tags,/g);
    expect(tagUsages).toBeTruthy();
    expect(tagUsages!.length).toBeGreaterThan(10);
  });

  test("KMS key has proper tags", () => {
    const kmsBlock = stackContent.match(/resource\s+"aws_kms_key"\s+"main_encryption_key"\s*\{[\s\S]*?(?=\n\})/);
    expect(kmsBlock![0]).toMatch(/tags\s*=\s*merge\(local\.common_tags/);
  });

  test("VPC has proper tags", () => {
    const vpcBlock = stackContent.match(/resource\s+"aws_vpc"\s+"main"\s*\{[\s\S]*?(?=\n\})/);
    expect(vpcBlock![0]).toMatch(/tags\s*=\s*merge\(local\.common_tags/);
  });

  test("CloudTrail has proper tags", () => {
    const cloudtrailBlock = stackContent.match(/resource\s+"aws_cloudtrail"\s+"main"\s*\{[\s\S]*?(?=\n\s*depends_on)/);
    expect(cloudtrailBlock![0]).toMatch(/tags\s*=\s*merge\(local\.common_tags/);
  });
});

describe("Terraform Infrastructure - AWS Config Rules Details", () => {
  let stackContent: string;

  beforeAll(() => {
    stackContent = fs.readFileSync(stackPath, "utf8");
  });

  test("all Config rules depend on configuration recorder", () => {
    const configRules = stackContent.matchAll(/resource\s+"aws_config_config_rule"[\s\S]*?depends_on\s*=\s*\[aws_config_configuration_recorder\.main\]/g);
    expect(Array.from(configRules).length).toBeGreaterThanOrEqual(8);
  });

  test("Config delivery channel has snapshot frequency", () => {
    const deliveryBlock = stackContent.match(/resource\s+"aws_config_delivery_channel"\s+"main"\s*\{[\s\S]*?(?=\n\s*depends_on)/);
    expect(deliveryBlock).toBeTruthy();
    expect(deliveryBlock![0]).toMatch(/delivery_frequency\s*=\s*"TwentyFour_Hours"/);
  });

  test("Config recorder records all supported resources", () => {
    const recorderBlock = stackContent.match(/resource\s+"aws_config_configuration_recorder"\s+"main"\s*\{[\s\S]*?(?=\n\s*depends_on)/);
    expect(recorderBlock).toBeTruthy();
    expect(recorderBlock![0]).toMatch(/all_supported\s*=\s*true/);
  });

  test("Config rules use AWS managed rules", () => {
    const configRules = stackContent.matchAll(/resource\s+"aws_config_config_rule"[\s\S]*?owner\s*=\s*"AWS"/g);
    expect(Array.from(configRules).length).toBeGreaterThanOrEqual(8);
  });
});
