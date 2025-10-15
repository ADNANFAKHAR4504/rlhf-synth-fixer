// tests/unit/unit-tests.ts
// Comprehensive unit tests for ../lib/tap_stack.tf
// No Terraform or CDKTF commands are executed.

import fs from "fs";
import path from "path";

const STACK_REL = "../lib/tap_stack.tf";
const VARIABLES_REL = "../lib/variables.tf";
const PROVIDER_REL = "../lib/provider.tf";

const stackPath = path.resolve(__dirname, STACK_REL);
const variablesPath = path.resolve(__dirname, VARIABLES_REL);
const providerPath = path.resolve(__dirname, PROVIDER_REL);

describe("Terraform Infrastructure Stack Validation", () => {
  let stackContent: string;
  let variablesContent: string;
  let providerContent: string;

  beforeAll(() => {
    stackContent = fs.readFileSync(stackPath, "utf8");
    variablesContent = fs.readFileSync(variablesPath, "utf8");
    providerContent = fs.readFileSync(providerPath, "utf8");
  });

  describe("File Structure and Basic Requirements", () => {
    test("tap_stack.tf exists and is readable", () => {
      expect(fs.existsSync(stackPath)).toBe(true);
    });

    test("variables.tf exists and is readable", () => {
      expect(fs.existsSync(variablesPath)).toBe(true);
    });

    test("provider.tf exists and is readable", () => {
      expect(fs.existsSync(providerPath)).toBe(true);
    });

    test("does NOT declare provider in tap_stack.tf (provider.tf owns providers)", () => {
      expect(stackContent).not.toMatch(/\bprovider\s+"aws"\s*{/);
    });
  });

  describe("Variables Validation", () => {
    test("contains aws_region variable", () => {
      expect(variablesContent).toMatch(/variable\s+"aws_region"\s*{/);
    });

    test("contains vpc_id variable", () => {
      expect(variablesContent).toMatch(/variable\s+"vpc_id"\s*{/);
    });

    test("contains private_subnet_ids variable", () => {
      expect(variablesContent).toMatch(/variable\s+"private_subnet_ids"\s*{/);
    });

    test("contains tags variable with proper structure", () => {
      expect(variablesContent).toMatch(/variable\s+"tags"\s*{/);
      expect(variablesContent).toMatch(/type\s*=\s*map\(string\)/);
    });

    test("contains database configuration variables", () => {
      expect(variablesContent).toMatch(/variable\s+"db_identifier"/);
      expect(variablesContent).toMatch(/variable\s+"db_name"/);
      expect(variablesContent).toMatch(/variable\s+"db_username"/);
      expect(variablesContent).toMatch(/variable\s+"db_password"/);
      expect(variablesContent).toMatch(/variable\s+"db_engine_version"/);
      expect(variablesContent).toMatch(/variable\s+"db_instance_class"/);
    });

    test("contains security and monitoring variables", () => {
      expect(variablesContent).toMatch(/variable\s+"multi_az"/);
      expect(variablesContent).toMatch(/variable\s+"performance_insights_enabled"/);
      expect(variablesContent).toMatch(/variable\s+"enhanced_monitoring_enabled"/);
    });

    test("contains alarm threshold variables", () => {
      expect(variablesContent).toMatch(/variable\s+"alarm_cpu_threshold"/);
      expect(variablesContent).toMatch(/variable\s+"alarm_storage_threshold"/);
      expect(variablesContent).toMatch(/variable\s+"alarm_connections_threshold"/);
    });
  });

  describe("Networking Infrastructure", () => {
    test("contains VPC resource with conditional creation", () => {
      expect(stackContent).toMatch(/resource\s+"aws_vpc"\s+"main"/);
      expect(stackContent).toMatch(/count\s*=\s*var\.vpc_id\s*==\s*""\s*\?\s*1\s*:\s*0/);
    });

    test("contains private subnets with correct CIDR blocks", () => {
      expect(stackContent).toMatch(/resource\s+"aws_subnet"\s+"private_a"/);
      expect(stackContent).toMatch(/resource\s+"aws_subnet"\s+"private_b"/);
      expect(stackContent).toMatch(/cidr_block\s*=\s*"10\.0\.10\.0\/24"/);
      expect(stackContent).toMatch(/cidr_block\s*=\s*"10\.0\.20\.0\/24"/);
    });

    test("contains RDS subnet group", () => {
      expect(stackContent).toMatch(/resource\s+"aws_db_subnet_group"\s+"main"/);
    });

    test("VPC has proper DNS configuration", () => {
      expect(stackContent).toMatch(/enable_dns_hostnames\s*=\s*true/);
      expect(stackContent).toMatch(/enable_dns_support\s*=\s*true/);
    });
  });

  describe("Security Infrastructure", () => {
    test("contains KMS key for encryption", () => {
      expect(stackContent).toMatch(/resource\s+"aws_kms_key"\s+"rds"/);
      expect(stackContent).toMatch(/enable_key_rotation\s*=\s*true/);
    });

    test("contains KMS alias", () => {
      expect(stackContent).toMatch(/resource\s+"aws_kms_alias"\s+"rds"/);
    });

    test("contains security group with proper ingress rules", () => {
      expect(stackContent).toMatch(/resource\s+"aws_security_group"\s+"rds"/);
      expect(stackContent).toMatch(/from_port\s*=\s*3306/);
      expect(stackContent).toMatch(/to_port\s*=\s*3306/);
      expect(stackContent).toMatch(/cidr_blocks\s*=\s*\["10\.0\.0\.0\/16"\]/);
    });

    test("contains DB parameter group with TLS enforcement", () => {
      expect(stackContent).toMatch(/resource\s+"aws_db_parameter_group"\s+"mysql8"/);
      expect(stackContent).toMatch(/require_secure_transport/);
      expect(stackContent).toMatch(/value\s*=\s*"ON"/);
    });
  });

  describe("Database Infrastructure", () => {
    test("contains RDS instance with proper configuration", () => {
      expect(stackContent).toMatch(/resource\s+"aws_db_instance"\s+"main"/);
      expect(stackContent).toMatch(/engine\s*=\s*"mysql"/);
      expect(stackContent).toMatch(/storage_encrypted\s*=\s*true/);
      expect(stackContent).toMatch(/publicly_accessible\s*=\s*false/);
    });

    test("RDS has IAM database authentication enabled", () => {
      expect(stackContent).toMatch(/iam_database_authentication_enabled\s*=\s*true/);
    });

    test("RDS has proper backup configuration", () => {
      expect(stackContent).toMatch(/backup_retention_period/);
      expect(stackContent).toMatch(/backup_window/);
      expect(stackContent).toMatch(/maintenance_window/);
    });

    test("RDS has deletion protection enabled", () => {
      expect(stackContent).toMatch(/deletion_protection\s*=\s*true/);
    });

    test("RDS has Performance Insights configuration", () => {
      expect(stackContent).toMatch(/performance_insights_enabled/);
      expect(stackContent).toMatch(/performance_insights_kms_key_id/);
    });
  });

  describe("S3 and Backup Infrastructure", () => {
    test("contains S3 bucket for snapshots", () => {
      expect(stackContent).toMatch(/resource\s+"aws_s3_bucket"\s+"snapshots"/);
    });

    test("contains S3 bucket public access block", () => {
      expect(stackContent).toMatch(/resource\s+"aws_s3_bucket_public_access_block"\s+"snapshots"/);
      expect(stackContent).toMatch(/block_public_acls\s*=\s*true/);
      expect(stackContent).toMatch(/block_public_policy\s*=\s*true/);
    });

    test("contains S3 bucket versioning", () => {
      expect(stackContent).toMatch(/resource\s+"aws_s3_bucket_versioning"\s+"snapshots"/);
      expect(stackContent).toMatch(/status\s*=\s*"Enabled"/);
    });

    test("contains S3 bucket encryption", () => {
      expect(stackContent).toMatch(/resource\s+"aws_s3_bucket_server_side_encryption_configuration"/);
      expect(stackContent).toMatch(/sse_algorithm\s*=\s*"aws:kms"/);
    });
  });

  describe("IAM Infrastructure", () => {
    test("contains IAM role for snapshot export", () => {
      expect(stackContent).toMatch(/resource\s+"aws_iam_role"\s+"snapshot_export"/);
    });

    test("contains IAM policy for snapshot export", () => {
      expect(stackContent).toMatch(/resource\s+"aws_iam_policy"\s+"snapshot_export"/);
    });

    test("contains IAM role for enhanced monitoring", () => {
      expect(stackContent).toMatch(/resource\s+"aws_iam_role"\s+"rds_enhanced_monitoring"/);
    });

    test("IAM policies follow least privilege principle", () => {
      expect(stackContent).toMatch(/s3:PutObject/);
      expect(stackContent).toMatch(/s3:GetObject/);
      expect(stackContent).toMatch(/kms:Decrypt/);
      expect(stackContent).toMatch(/kms:GenerateDataKey/);
    });
  });

  describe("Monitoring Infrastructure", () => {
    test("contains CloudWatch alarms for CPU", () => {
      expect(stackContent).toMatch(/resource\s+"aws_cloudwatch_metric_alarm"\s+"cpu_high"/);
      expect(stackContent).toMatch(/metric_name\s*=\s*"CPUUtilization"/);
    });

    test("contains CloudWatch alarms for storage", () => {
      expect(stackContent).toMatch(/resource\s+"aws_cloudwatch_metric_alarm"\s+"storage_low"/);
      expect(stackContent).toMatch(/metric_name\s*=\s*"FreeStorageSpace"/);
    });

    test("contains CloudWatch alarms for connections", () => {
      expect(stackContent).toMatch(/resource\s+"aws_cloudwatch_metric_alarm"\s+"connections_high"/);
      expect(stackContent).toMatch(/metric_name\s*=\s*"DatabaseConnections"/);
    });

    test("contains enhanced monitoring role (conditional)", () => {
      expect(stackContent).toMatch(/count\s*=\s*var\.enhanced_monitoring_enabled/);
    });
  });

  describe("Outputs Validation", () => {
    test("contains database endpoint output", () => {
      expect(stackContent).toMatch(/output\s+"db_endpoint"/);
    });

    test("contains database port output", () => {
      expect(stackContent).toMatch(/output\s+"db_port"/);
    });

    test("contains database name output", () => {
      expect(stackContent).toMatch(/output\s+"db_name"/);
    });

    test("contains security group ID output", () => {
      expect(stackContent).toMatch(/output\s+"db_security_group_id"/);
    });

    test("contains KMS key ARN output", () => {
      expect(stackContent).toMatch(/output\s+"kms_key_arn"/);
    });

    test("contains S3 bucket name output", () => {
      expect(stackContent).toMatch(/output\s+"s3_bucket_name"/);
    });

    test("contains CloudWatch alarm ARN outputs", () => {
      expect(stackContent).toMatch(/output\s+"cloudwatch_alarm_cpu_arn"/);
      expect(stackContent).toMatch(/output\s+"cloudwatch_alarm_storage_arn"/);
      expect(stackContent).toMatch(/output\s+"cloudwatch_alarm_connections_arn"/);
    });
  });

  describe("Security and Compliance", () => {
    test("all resources have proper tagging", () => {
      expect(stackContent).toMatch(/tags\s*=\s*var\.tags/);
      expect(stackContent).toMatch(/tags\s*=\s*merge\(var\.tags/);
    });

    test("contains HIPAA compliance tags", () => {
      expect(variablesContent).toMatch(/DataClassification\s*=\s*"PHI"/);
      expect(variablesContent).toMatch(/Compliance\s*=\s*"HIPAA-eligible"/);
    });

    test("database is not publicly accessible", () => {
      expect(stackContent).toMatch(/publicly_accessible\s*=\s*false/);
    });

    test("security group restricts access to VPC CIDR", () => {
      expect(stackContent).toMatch(/cidr_blocks\s*=\s*\["10\.0\.0\.0\/16"\]/);
    });

    test("TLS is enforced via parameter group", () => {
      expect(stackContent).toMatch(/require_secure_transport/);
    });
  });

  describe("Resource Dependencies and Relationships", () => {
    test("RDS instance depends on subnet group", () => {
      expect(stackContent).toMatch(/db_subnet_group_name\s*=\s*aws_db_subnet_group\.main\.name/);
    });

    test("RDS instance depends on security group", () => {
      expect(stackContent).toMatch(/vpc_security_group_ids\s*=\s*\[aws_security_group\.rds\.id\]/);
    });

    test("RDS instance uses KMS key for encryption", () => {
      expect(stackContent).toMatch(/kms_key_id\s*=\s*aws_kms_key\.rds\.arn/);
    });

    test("S3 bucket uses KMS key for encryption", () => {
      expect(stackContent).toMatch(/kms_master_key_id\s*=\s*aws_kms_key\.rds\.arn/);
    });

    test("CloudWatch alarms reference RDS instance", () => {
      expect(stackContent).toMatch(/DBInstanceIdentifier\s*=\s*aws_db_instance\.main\.identifier/);
    });
  });

  describe("Cost Optimization", () => {
    test("uses cost-effective instance class by default", () => {
      expect(variablesContent).toMatch(/default\s*=\s*"db\.t3\.micro"/);
    });

    test("single-AZ deployment by default", () => {
      expect(variablesContent).toMatch(/default\s*=\s*false/);
    });

    test("configurable storage with reasonable defaults", () => {
      expect(variablesContent).toMatch(/default\s*=\s*20/);
      expect(variablesContent).toMatch(/default\s*=\s*50/);
    });
  });

  describe("Code Quality and Best Practices", () => {
    test("uses locals for computed values", () => {
      expect(stackContent).toMatch(/locals\s*{/);
    });

    test("uses data sources for account information", () => {
      expect(stackContent).toMatch(/data\s+"aws_caller_identity"\s+"current"/);
      expect(stackContent).toMatch(/data\s+"aws_region"\s+"current"/);
    });

    test("uses lifecycle rules for critical resources", () => {
      expect(stackContent).toMatch(/lifecycle\s*{/);
      expect(stackContent).toMatch(/create_before_destroy\s*=\s*true/);
    });

    test("uses proper resource naming conventions", () => {
      expect(stackContent).toMatch(/name_prefix\s*=/);
    });

    test("contains descriptive comments", () => {
      expect(stackContent).toMatch(/# .*healthcare/i);
      expect(stackContent).toMatch(/# .*PHI/i);
    });
  });
});
