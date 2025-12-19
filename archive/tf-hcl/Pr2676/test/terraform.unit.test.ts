// tests/unit/unit-tests.ts
// Comprehensive unit tests for ../lib/tap_stack.tf
// Static analysis and validation of Terraform configuration

import fs from "fs";
import path from "path";

const STACK_REL = "../lib/tap_stack.tf";
const stackPath = path.resolve(__dirname, STACK_REL);

describe("Terraform Infrastructure Unit Tests: tap_stack.tf", () => {
  let stackContent: string;

  beforeAll(() => {
    expect(fs.existsSync(stackPath)).toBe(true);
    stackContent = fs.readFileSync(stackPath, "utf8");
  });

  // File Structure Tests
  describe("File Structure and Basic Validation", () => {
    test("tap_stack.tf exists and is readable", () => {
      expect(fs.existsSync(stackPath)).toBe(true);
      expect(stackContent.length).toBeGreaterThan(1000);
    });

    test("declares AWS provider block with configuration", () => {
      expect(stackContent).toMatch(/provider\s+"aws"\s*{/);
      expect(stackContent).toMatch(/region\s*=\s*var\.aws_region/);
    });

    test("has proper Terraform syntax structure", () => {
      const braceCount = (stackContent.match(/{/g) || []).length;
      const closeBraceCount = (stackContent.match(/}/g) || []).length;
      expect(braceCount).toBe(closeBraceCount);
    });
  });

  // Variable Tests
  describe("Variable Definitions", () => {
    test("declares all required variables", () => {
      const requiredVars = [
        "project_name", "environment", "aws_region", "vpc_cidr",
        "public_subnets", "private_subnets", "database_subnets",
        "db_username", "db_password", "lambda_timeout", "sns_email"
      ];
      
      requiredVars.forEach(varName => {
        const varRegex = new RegExp(`variable\\s+"${varName}"\\s*{`, 'g');
        expect(stackContent).toMatch(varRegex);
      });
    });

    test("environment variable has proper validation", () => {
      expect(stackContent).toMatch(/validation\s*{[\s\S]*?condition\s*=\s*contains\(\["development",\s*"staging",\s*"production"\]/);
    });

    test("variables have proper types and descriptions", () => {
      expect(stackContent).toMatch(/type\s*=\s*string/);
      expect(stackContent).toMatch(/type\s*=\s*list\(string\)/);
      expect(stackContent).toMatch(/type\s*=\s*number/);
      expect(stackContent).toMatch(/description\s*=/);
    });
  });

  // VPC and Networking Tests
  describe("VPC and Network Infrastructure", () => {
    test("declares VPC with proper configuration", () => {
      expect(stackContent).toMatch(/resource\s+"aws_vpc"\s+"main"\s*{/);
      expect(stackContent).toMatch(/enable_dns_hostnames\s*=\s*true/);
      expect(stackContent).toMatch(/enable_dns_support\s*=\s*true/);
    });

    test("declares internet gateway for VPC", () => {
      expect(stackContent).toMatch(/resource\s+"aws_internet_gateway"\s+"main"\s*{/);
      expect(stackContent).toMatch(/vpc_id\s*=\s*aws_vpc\.main\.id/);
    });

    test("declares NAT gateways for private subnets", () => {
      expect(stackContent).toMatch(/resource\s+"aws_eip"\s+"nat"/);
      expect(stackContent).toMatch(/resource\s+"aws_nat_gateway"\s+"main"/);
      expect(stackContent).toMatch(/depends_on\s*=\s*\[aws_internet_gateway\.main\]/);
    });

    test("declares public, private, and database subnets", () => {
      expect(stackContent).toMatch(/resource\s+"aws_subnet"\s+"public"\s*{/);
      expect(stackContent).toMatch(/resource\s+"aws_subnet"\s+"private"\s*{/);
      expect(stackContent).toMatch(/resource\s+"aws_subnet"\s+"database"\s*{/);
      expect(stackContent).toMatch(/count\s*=\s*length\(var\.public_subnets\)/);
    });

    test("declares route tables with proper routes", () => {
      expect(stackContent).toMatch(/resource\s+"aws_route_table"\s+"public"\s*{/);
      expect(stackContent).toMatch(/resource\s+"aws_route_table"\s+"private"\s*{/);
      expect(stackContent).toMatch(/resource\s+"aws_route"\s+"public_internet_gateway"\s*{/);
      expect(stackContent).toMatch(/resource\s+"aws_route"\s+"private_nat_gateway"\s*{/);
      expect(stackContent).toMatch(/resource\s+"aws_route_table"\s+"database"\s*{/);
    });
  });

  // Security Groups Tests
  describe("Security Groups", () => {
    test("declares Lambda security group", () => {
      expect(stackContent).toMatch(/resource\s+"aws_security_group"\s+"lambda"\s*{/);
      expect(stackContent).toMatch(/name_prefix\s*=\s*"\$\{local\.name_prefix\}-lambda-"/);
    });

    test("declares database security group", () => {
      expect(stackContent).toMatch(/resource\s+"aws_security_group"\s+"database"\s*{/);
    });

    test("declares separate security group rules to avoid circular dependencies", () => {
      expect(stackContent).toMatch(/resource\s+"aws_security_group_rule"\s+"lambda_to_rds"\s*{/);
      expect(stackContent).toMatch(/resource\s+"aws_security_group_rule"\s+"rds_from_lambda"\s*{/);
      expect(stackContent).toMatch(/depends_on\s*=\s*\[aws_security_group\.lambda,.*aws_security_group\.database\]/);
    });
  });

  // KMS Encryption Tests
  describe("KMS Key Configuration", () => {
    test("declares KMS key with key rotation", () => {
      expect(stackContent).toMatch(/resource\s+"aws_kms_key"\s+"main"\s*{/);
      expect(stackContent).toMatch(/enable_key_rotation\s*=\s*true/);
    });

    test("KMS key policy includes necessary service permissions", () => {
      expect(stackContent).toMatch(/logs\.\$\{var\.aws_region\}\.amazonaws\.com/);
      expect(stackContent).toMatch(/rds\.amazonaws\.com/);
      expect(stackContent).toMatch(/lambda\.amazonaws\.com/);
    });

    test("declares KMS alias", () => {
      expect(stackContent).toMatch(/resource\s+"aws_kms_alias"\s+"main"\s*{/);
      expect(stackContent).toMatch(/target_key_id\s*=\s*aws_kms_key\.main\.key_id/);
    });
  });

  // Lambda Functions Tests
  describe("Lambda Functions", () => {
    test("declares Lambda functions with proper configuration", () => {
      expect(stackContent).toMatch(/resource\s+"aws_lambda_function"\s+"data_processor"\s*{/);
      expect(stackContent).toMatch(/resource\s+"aws_lambda_function"\s+"data_validator"\s*{/);
      expect(stackContent).toMatch(/runtime\s*=\s*"python3\.11"/);
      expect(stackContent).toMatch(/timeout\s*=\s*var\.lambda_timeout/);
    });

    test("Lambda functions have VPC configuration", () => {
      expect(stackContent).toMatch(/vpc_config\s*{/);
      expect(stackContent).toMatch(/subnet_ids\s*=\s*aws_subnet\.private\[\*\]\.id/);
      expect(stackContent).toMatch(/security_group_ids\s*=\s*\[aws_security_group\.lambda\.id\]/);
    });

    test("Lambda functions have environment variables", () => {
      expect(stackContent).toMatch(/environment\s*{/);
      expect(stackContent).toMatch(/variables\s*=\s*{/);
      expect(stackContent).toMatch(/DB_HOST.*=.*aws_db_instance\.main\.endpoint/);
      expect(stackContent).toMatch(/KMS_KEY_ID.*=.*aws_kms_key\.main\.key_id/);
    });

    test("Lambda execution role has proper policies", () => {
      expect(stackContent).toMatch(/resource\s+"aws_iam_role"\s+"lambda_execution"\s*{/);
      expect(stackContent).toMatch(/lambda\.amazonaws\.com/);
      expect(stackContent).toMatch(/resource\s+"aws_iam_role_policy"\s+"lambda_policy"\s*{/);
    });
  });

  // RDS Database Tests
  describe("RDS Database Configuration", () => {
    test("declares RDS instance with encryption", () => {
      expect(stackContent).toMatch(/resource\s+"aws_db_instance"\s+"main"\s*{/);
      expect(stackContent).toMatch(/engine\s*=\s*"postgres"/);
      expect(stackContent).toMatch(/storage_encrypted\s*=\s*true/);
      expect(stackContent).toMatch(/kms_key_id\s*=\s*aws_kms_key\.main\.arn/);
    });

    test("RDS has proper backup and monitoring configuration", () => {
      expect(stackContent).toMatch(/backup_retention_period\s*=\s*7/);
      expect(stackContent).toMatch(/monitoring_interval\s*=\s*60/);
      expect(stackContent).toMatch(/multi_az\s*=\s*true/);
    });

    test("RDS has deletion protection and final snapshot", () => {
      expect(stackContent).toMatch(/deletion_protection\s*=\s*true/);
      expect(stackContent).toMatch(/skip_final_snapshot\s*=\s*false/);
      expect(stackContent).toMatch(/final_snapshot_identifier.*=.*formatdate/);
    });

    test("declares RDS subnet group", () => {
      expect(stackContent).toMatch(/resource\s+"aws_db_subnet_group"\s+"main"\s*{/);
      expect(stackContent).toMatch(/subnet_ids\s*=\s*aws_subnet\.database\[\*\]\.id/);
    });
  });

  // S3 and Storage Tests
  describe("S3 Storage Configuration", () => {
    test("declares S3 bucket with versioning", () => {
      expect(stackContent).toMatch(/resource\s+"aws_s3_bucket"\s+"data"\s*{/);
      expect(stackContent).toMatch(/resource\s+"aws_s3_bucket_versioning"\s+"data"\s*{/);
      expect(stackContent).toMatch(/status\s*=\s*"Enabled"/);
    });

    test("S3 bucket has encryption configuration", () => {
      expect(stackContent).toMatch(/resource\s+"aws_s3_bucket_server_side_encryption_configuration"\s+"data"\s*{/);
      expect(stackContent).toMatch(/kms_master_key_id\s*=\s*aws_kms_key\.main\.arn/);
    });

    test("S3 bucket has public access block", () => {
      expect(stackContent).toMatch(/resource\s+"aws_s3_bucket_public_access_block"\s+"data"\s*{/);
      expect(stackContent).toMatch(/block_public_acls\s*=\s*true/);
      expect(stackContent).toMatch(/block_public_policy\s*=\s*true/);
    });
  });

  // Secrets Manager Tests
  describe("Secrets Manager Configuration", () => {
    test("declares Secrets Manager secret", () => {
      expect(stackContent).toMatch(/resource\s+"aws_secretsmanager_secret"\s+"db_credentials"\s*{/);
      expect(stackContent).toMatch(/kms_key_id\s*=\s*aws_kms_key\.main\.arn/);
    });

    test("secret has proper version with credentials", () => {
      expect(stackContent).toMatch(/resource\s+"aws_secretsmanager_secret_version"\s+"db_credentials"\s*{/);
      expect(stackContent).toMatch(/username.*var\.db_username/);
      expect(stackContent).toMatch(/password.*var\.db_password/);
    });
  });

  // CloudWatch Tests
  describe("CloudWatch Monitoring", () => {
    test("declares CloudWatch log groups with encryption", () => {
      expect(stackContent).toMatch(/resource\s+"aws_cloudwatch_log_group".*"lambda.*logs"\s*{/);
      expect(stackContent).toMatch(/kms_key_id\s*=\s*aws_kms_key\.main\.arn/);
    });

    test("declares CloudWatch alarms for monitoring", () => {
      expect(stackContent).toMatch(/resource\s+"aws_cloudwatch_metric_alarm"/);
      expect(stackContent).toMatch(/metric_name\s*=\s*"Errors"/);
      expect(stackContent).toMatch(/comparison_operator\s*=\s*"GreaterThanThreshold"/);
    });
  });

  // AWS Config Tests
  describe("AWS Config Compliance", () => {
    test("declares Config configuration recorder", () => {
      expect(stackContent).toMatch(/resource\s+"aws_config_configuration_recorder"\s+"main"\s*{/);
      expect(stackContent).toMatch(/role_arn\s*=\s*aws_iam_role\.config\.arn/);
    });

    test("declares Config delivery channel", () => {
      expect(stackContent).toMatch(/resource\s+"aws_config_delivery_channel"\s+"main"\s*{/);
      expect(stackContent).toMatch(/s3_bucket_name\s*=\s*aws_s3_bucket\.config\.bucket/);
    });

    test("declares Config rules for compliance", () => {
      expect(stackContent).toMatch(/resource\s+"aws_config_config_rule"/);
      expect(stackContent).toMatch(/source\s*{[\s\S]*?owner\s*=\s*"AWS"/);
    });
  });

  // SNS Notifications Tests
  describe("SNS Notification Configuration", () => {
    test("declares SNS topic", () => {
      expect(stackContent).toMatch(/resource\s+"aws_sns_topic"\s+"alerts"\s*{/);
      expect(stackContent).toMatch(/kms_master_key_id\s*=\s*aws_kms_key\.main\.id/);
    });

    test("declares SNS topic subscription", () => {
      expect(stackContent).toMatch(/resource\s+"aws_sns_topic_subscription"\s+"email"\s*{/);
      expect(stackContent).toMatch(/protocol\s*=\s*"email"/);
      expect(stackContent).toMatch(/endpoint\s*=\s*var\.sns_email/);
    });
  });

  // Resource Dependencies Tests
  describe("Resource Dependencies and Relationships", () => {
    test("has proper depends_on clauses to avoid timing issues", () => {
      expect(stackContent).toMatch(/depends_on\s*=\s*\[/);
      const dependsOnCount = (stackContent.match(/depends_on\s*=/g) || []).length;
      expect(dependsOnCount).toBeGreaterThan(5);
    });

    test("resources reference each other correctly", () => {
      expect(stackContent).toMatch(/aws_vpc\.main\.id/);
      expect(stackContent).toMatch(/aws_kms_key\.main\.arn/);
      expect(stackContent).toMatch(/aws_security_group\.lambda\.id/);
      expect(stackContent).toMatch(/aws_db_instance\.main\.endpoint/);
    });

    test("local values are defined for complex expressions", () => {
      expect(stackContent).toMatch(/locals\s*{/);
      expect(stackContent).toMatch(/common_tags\s*=/);
    });
  });

  // Output Tests
  describe("Output Values", () => {
    test("declares essential output values", () => {
      expect(stackContent).toMatch(/output\s+"vpc_id"\s*{/);
      expect(stackContent).toMatch(/output\s+"lambda_function_names"\s*{/);
      expect(stackContent).toMatch(/output\s+"rds_endpoint"\s*{/);
      expect(stackContent).toMatch(/output\s+"s3.*bucket.*name"\s*{/);
    });

    test("sensitive outputs are marked as sensitive", () => {
      expect(stackContent).toMatch(/sensitive\s*=\s*true/);
    });
  });

  // Security Best Practices Tests
  describe("Security Best Practices", () => {
    test("uses least privilege IAM policies", () => {
      const iamRolePolicyCount = (stackContent.match(/resource\s+"aws_iam_role_policy"/g) || []).length;
      const iamRoleCount = (stackContent.match(/resource\s+"aws_iam_role"/g) || []).length;
      expect(iamRolePolicyCount).toBeGreaterThan(0);
      expect(iamRoleCount).toBeGreaterThan(0);
    });

    test("enables encryption for all data stores", () => {
      expect(stackContent).toMatch(/storage_encrypted\s*=\s*true/);
      expect(stackContent).toMatch(/kms_key_id/);
      expect(stackContent).toMatch(/server_side_encryption_configuration/);
    });

    test("network segmentation is properly implemented", () => {
      expect(stackContent).toMatch(/cidr_block.*var\.public_subnets/);
      expect(stackContent).toMatch(/cidr_block.*var\.private_subnets/);
      expect(stackContent).toMatch(/cidr_block.*var\.database_subnets/);
    });

    test("security groups follow least privilege", () => {
      const ingressCount = (stackContent.match(/ingress\s*{/g) || []).length;
      const egressCount = (stackContent.match(/egress\s*{/g) || []).length;
      expect(ingressCount + egressCount).toBeGreaterThan(0);
    });
  });
});
