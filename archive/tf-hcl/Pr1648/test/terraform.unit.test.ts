// tests/unit/terraform.unit.test.ts
// Comprehensive unit tests for Terraform infrastructure
// Tests resource configurations, security policies, and infrastructure patterns

import fs from "fs";
import path from "path";

const LIB_DIR = "../lib";
const STACK_FILE = "tap_stack.tf";
const PROVIDER_FILE = "provider.tf";
const VARIABLES_FILE = "variables.tf";

const stackPath = path.resolve(__dirname, LIB_DIR, STACK_FILE);
const providerPath = path.resolve(__dirname, LIB_DIR, PROVIDER_FILE);
const variablesPath = path.resolve(__dirname, LIB_DIR, VARIABLES_FILE);

describe("Terraform Infrastructure Unit Tests", () => {
  
  // File Structure Tests
  describe("File Structure", () => {
  test("tap_stack.tf exists", () => {
      expect(fs.existsSync(stackPath)).toBe(true);
    });

    test("provider.tf exists", () => {
      expect(fs.existsSync(providerPath)).toBe(true);
    });

    test("variables.tf exists", () => {
      expect(fs.existsSync(variablesPath)).toBe(true);
    });
  });

  // Variables Configuration Tests
  describe("Variables Configuration", () => {
    let variablesContent: string;

    beforeAll(() => {
      variablesContent = fs.readFileSync(variablesPath, "utf8");
    });

    test("defines primary_region variable", () => {
      expect(variablesContent).toMatch(/variable\s+"primary_region"\s*{/);
      expect(variablesContent).toMatch(/default\s*=\s*"us-east-1"/);
    });

    test("defines secondary_region variable", () => {
      expect(variablesContent).toMatch(/variable\s+"secondary_region"\s*{/);
      expect(variablesContent).toMatch(/default\s*=\s*"us-west-2"/);
    });

    test("defines project_name variable", () => {
      expect(variablesContent).toMatch(/variable\s+"project_name"\s*{/);
      expect(variablesContent).toMatch(/default\s*=\s*"webapp"/);
    });

    test("defines environment variable", () => {
      expect(variablesContent).toMatch(/variable\s+"environment"\s*{/);
      expect(variablesContent).toMatch(/default\s*=\s*"dev"/);
    });

    test("defines corporate_cidrs variable with proper defaults", () => {
      expect(variablesContent).toMatch(/variable\s+"corporate_cidrs"\s*{/);
      expect(variablesContent).toMatch(/type\s*=\s*list\(string\)/);
      expect(variablesContent).toMatch(/"10\.0\.0\.0\/8"/);
      expect(variablesContent).toMatch(/"172\.16\.0\.0\/12"/);
      expect(variablesContent).toMatch(/"192\.168\.0\.0\/16"/);
    });

    test("defines lambda configuration variables", () => {
      expect(variablesContent).toMatch(/variable\s+"lambda_timeout"\s*{/);
      expect(variablesContent).toMatch(/variable\s+"lambda_memory"\s*{/);
      expect(variablesContent).toMatch(/default\s*=\s*30/);
      expect(variablesContent).toMatch(/default\s*=\s*256/);
    });

    test("does NOT define ec2_public_key variable (Session Manager approach)", () => {
      expect(variablesContent).not.toMatch(/variable\s+"ec2_public_key"/);
    });

    test("includes Session Manager comment", () => {
      expect(variablesContent).toMatch(/Systems Manager Session Manager/);
    });
  });

  // Provider Configuration Tests
  describe("Provider Configuration", () => {
    let providerContent: string;

    beforeAll(() => {
      providerContent = fs.readFileSync(providerPath, "utf8");
    });

    test("specifies correct Terraform version constraint", () => {
      expect(providerContent).toMatch(/required_version\s*=\s*">=\s*1\.4\.0"/);
    });

    test("specifies AWS provider version constraint", () => {
      expect(providerContent).toMatch(/version\s*=\s*"~>\s*5\.0"/);
    });

    test("configures primary AWS provider", () => {
      expect(providerContent).toMatch(/provider\s+"aws"\s*{[^}]*region\s*=\s*var\.primary_region/s);
    });

    test("configures secondary AWS provider with alias", () => {
      expect(providerContent).toMatch(/provider\s+"aws"\s*{[^}]*alias\s*=\s*"secondary"/s);
      expect(providerContent).toMatch(/region\s*=\s*var\.secondary_region/);
    });

    test("includes default tags configuration", () => {
      expect(providerContent).toMatch(/default_tags\s*{[^}]*tags\s*=\s*local\.common_tags/s);
    });
  });

  // Infrastructure Configuration Tests
  describe("Infrastructure Configuration", () => {
    let stackContent: string;

    beforeAll(() => {
      stackContent = fs.readFileSync(stackPath, "utf8");
    });

    test("does NOT declare provider in main stack file", () => {
      expect(stackContent).not.toMatch(/provider\s+"aws"\s*{/);
    });

    test("includes random_id resource for bucket naming", () => {
      expect(stackContent).toMatch(/resource\s+"random_id"\s+"unique_suffix"/);
      expect(stackContent).toMatch(/byte_length\s*=\s*8/);
    });

    test("configures common_tags local value", () => {
      expect(stackContent).toMatch(/common_tags\s*=\s*merge\(var\.tags/);
      expect(stackContent).toMatch(/ManagedBy\s*=\s*"Terraform"/);
    });
  });

  // VPC and Networking Tests
  describe("VPC and Networking", () => {
    let stackContent: string;

    beforeAll(() => {
      stackContent = fs.readFileSync(stackPath, "utf8");
    });

    test("creates VPC with DNS support", () => {
      expect(stackContent).toMatch(/resource\s+"aws_vpc"\s+"main"/);
      expect(stackContent).toMatch(/enable_dns_hostnames\s*=\s*true/);
      expect(stackContent).toMatch(/enable_dns_support\s*=\s*true/);
    });

    test("creates public and private subnets", () => {
      expect(stackContent).toMatch(/resource\s+"aws_subnet"\s+"public"/);
      expect(stackContent).toMatch(/resource\s+"aws_subnet"\s+"private"/);
      expect(stackContent).toMatch(/count\s*=\s*2/);
    });

    test("creates NAT gateways for high availability", () => {
      expect(stackContent).toMatch(/resource\s+"aws_nat_gateway"\s+"main"/);
      expect(stackContent).toMatch(/count\s*=\s*2/);
    });

    test("creates internet gateway", () => {
      expect(stackContent).toMatch(/resource\s+"aws_internet_gateway"\s+"main"/);
    });

    test("configures route tables properly", () => {
      expect(stackContent).toMatch(/resource\s+"aws_route_table"\s+"public"/);
      expect(stackContent).toMatch(/resource\s+"aws_route_table"\s+"private"/);
      expect(stackContent).toMatch(/gateway_id\s*=\s*aws_internet_gateway\.main\.id/);
      expect(stackContent).toMatch(/nat_gateway_id/);
    });
  });

  // Security Groups Tests
  describe("Security Groups", () => {
    let stackContent: string;

    beforeAll(() => {
      stackContent = fs.readFileSync(stackPath, "utf8");
    });

    test("creates bastion security group without SSH", () => {
      expect(stackContent).toMatch(/resource\s+"aws_security_group"\s+"bastion"/);
      expect(stackContent).toMatch(/Session Manager/);
      expect(stackContent).not.toMatch(/from_port\s*=\s*22/);
    });

    test("creates application security group without SSH", () => {
      expect(stackContent).toMatch(/resource\s+"aws_security_group"\s+"app"/);
      expect(stackContent).toMatch(/Session Manager/);
      // Should have HTTP/HTTPS but not SSH
      expect(stackContent).toMatch(/from_port\s*=\s*80/);
      expect(stackContent).toMatch(/from_port\s*=\s*443/);
    });

    test("creates ALB security group with corporate CIDR access", () => {
      expect(stackContent).toMatch(/resource\s+"aws_security_group"\s+"alb"/);
      expect(stackContent).toMatch(/cidr_blocks\s*=\s*var\.corporate_cidrs/);
    });

    test("security groups use corporate_cidrs variable", () => {
      expect(stackContent).toMatch(/var\.corporate_cidrs/);
    });
  });

  // KMS Encryption Tests
  describe("KMS Encryption", () => {
    let stackContent: string;

    beforeAll(() => {
      stackContent = fs.readFileSync(stackPath, "utf8");
    });

    test("creates primary region KMS key", () => {
      expect(stackContent).toMatch(/resource\s+"aws_kms_key"\s+"main"/);
      expect(stackContent).toMatch(/enable_key_rotation\s*=\s*true/);
      expect(stackContent).toMatch(/deletion_window_in_days\s*=\s*7/);
    });

    test("creates secondary region KMS key", () => {
      expect(stackContent).toMatch(/resource\s+"aws_kms_key"\s+"secondary"/);
      expect(stackContent).toMatch(/provider\s*=\s*aws\.secondary/);
    });

    test("configures KMS key policy for multi-service access", () => {
      expect(stackContent).toMatch(/kms_key_policy\s*=\s*jsonencode/);
      expect(stackContent).toMatch(/logs\..*\.amazonaws\.com/);
      expect(stackContent).toMatch(/cloudtrail\.amazonaws\.com/);
    });

    test("creates KMS aliases", () => {
      expect(stackContent).toMatch(/resource\s+"aws_kms_alias"\s+"main"/);
      expect(stackContent).toMatch(/resource\s+"aws_kms_alias"\s+"secondary"/);
    });
  });

  // S3 Security Tests
  describe("S3 Security", () => {
    let stackContent: string;

    beforeAll(() => {
      stackContent = fs.readFileSync(stackPath, "utf8");
    });

    test("creates main S3 bucket with random suffix", () => {
      expect(stackContent).toMatch(/resource\s+"aws_s3_bucket"\s+"main"/);
      expect(stackContent).toMatch(/random_id\.unique_suffix\.hex/);
    });

    test("creates CloudTrail S3 bucket", () => {
      expect(stackContent).toMatch(/resource\s+"aws_s3_bucket"\s+"cloudtrail"/);
    });

    test("enables S3 bucket versioning", () => {
      expect(stackContent).toMatch(/resource\s+"aws_s3_bucket_versioning"/);
      expect(stackContent).toMatch(/status\s*=\s*"Enabled"/);
    });

    test("configures S3 server-side encryption with KMS", () => {
      expect(stackContent).toMatch(/aws_s3_bucket_server_side_encryption_configuration/);
      expect(stackContent).toMatch(/sse_algorithm\s*=\s*"aws:kms"/);
      expect(stackContent).toMatch(/kms_master_key_id\s*=\s*aws_kms_key\.main\.arn/);
    });

    test("blocks all public access", () => {
      expect(stackContent).toMatch(/aws_s3_bucket_public_access_block/);
      expect(stackContent).toMatch(/block_public_acls\s*=\s*true/);
      expect(stackContent).toMatch(/block_public_policy\s*=\s*true/);
      expect(stackContent).toMatch(/ignore_public_acls\s*=\s*true/);
      expect(stackContent).toMatch(/restrict_public_buckets\s*=\s*true/);
    });

    test("enforces TLS connections", () => {
      expect(stackContent).toMatch(/DenyInsecureConnections/);
      expect(stackContent).toMatch(/aws:SecureTransport.*false/);
    });
  });

  // IAM Security Tests
  describe("IAM Security", () => {
    let stackContent: string;

    beforeAll(() => {
      stackContent = fs.readFileSync(stackPath, "utf8");
    });

    test("creates EC2 IAM role with minimal permissions", () => {
      expect(stackContent).toMatch(/resource\s+"aws_iam_role"\s+"ec2_role"/);
      expect(stackContent).toMatch(/ec2\.amazonaws\.com/);
    });

    test("creates Lambda IAM role", () => {
      expect(stackContent).toMatch(/resource\s+"aws_iam_role"\s+"lambda_role"/);
      expect(stackContent).toMatch(/lambda\.amazonaws\.com/);
    });

    test("EC2 role includes Session Manager permissions", () => {
      expect(stackContent).toMatch(/ssmmessages:CreateControlChannel/);
      expect(stackContent).toMatch(/ssmmessages:CreateDataChannel/);
      expect(stackContent).toMatch(/ssmmessages:OpenControlChannel/);
      expect(stackContent).toMatch(/ssmmessages:OpenDataChannel/);
      expect(stackContent).toMatch(/ssm:UpdateInstanceInformation/);
    });

    test("IAM policies use least privilege with resource scoping", () => {
      expect(stackContent).toMatch(/\$\{var\.project_name\}\/\$\{var\.environment\}/);
      expect(stackContent).toMatch(/\$\{data\.aws_region\.current\.name\}/);
      expect(stackContent).toMatch(/\$\{data\.aws_caller_identity\.current\.account_id\}/);
    });

    test("Lambda role includes SQS permissions for DLQ", () => {
      expect(stackContent).toMatch(/sqs:SendMessage/);
      expect(stackContent).toMatch(/aws_sqs_queue\.dlq\.arn/);
    });
  });

  // Lambda Configuration Tests
  describe("Lambda Configuration", () => {
    let stackContent: string;

    beforeAll(() => {
      stackContent = fs.readFileSync(stackPath, "utf8");
    });

    test("creates SQS dead letter queue", () => {
      expect(stackContent).toMatch(/resource\s+"aws_sqs_queue"\s+"dlq"/);
      expect(stackContent).toMatch(/kms_master_key_id\s*=\s*aws_kms_key\.main\.arn/);
    });

    test("creates Lambda function with proper configuration", () => {
      expect(stackContent).toMatch(/resource\s+"aws_lambda_function"\s+"main"/);
      expect(stackContent).toMatch(/timeout\s*=\s*var\.lambda_timeout/);
      expect(stackContent).toMatch(/memory_size\s*=\s*var\.lambda_memory/);
    });

    test("Lambda function uses environment variables", () => {
      expect(stackContent).toMatch(/environment\s*{[^}]*variables/s);
      expect(stackContent).toMatch(/PROJECT_NAME\s*=\s*var\.project_name/);
      expect(stackContent).toMatch(/ENVIRONMENT\s*=\s*var\.environment/);
    });

    test("Lambda function has dead letter queue configuration", () => {
      expect(stackContent).toMatch(/dead_letter_config\s*{[^}]*target_arn\s*=\s*aws_sqs_queue\.dlq\.arn/s);
    });

    test("Lambda function is encrypted with KMS", () => {
      expect(stackContent).toMatch(/kms_key_arn\s*=\s*aws_kms_key\.main\.arn/);
    });

    test("creates S3 bucket notification for Lambda trigger", () => {
      expect(stackContent).toMatch(/aws_s3_bucket_notification/);
      expect(stackContent).toMatch(/s3:ObjectCreated:\*/);
    });
  });

  // EC2 Configuration Tests
  describe("EC2 Configuration", () => {
    let stackContent: string;

    beforeAll(() => {
      stackContent = fs.readFileSync(stackPath, "utf8");
    });

    test("does NOT create key pairs", () => {
      expect(stackContent).not.toMatch(/resource\s+"aws_key_pair"/);
    });

    test("creates bastion instance without key", () => {
      expect(stackContent).toMatch(/resource\s+"aws_instance"\s+"bastion"/);
      expect(stackContent).not.toMatch(/key_name\s*=/);
    });

    test("creates application instances without keys", () => {
      expect(stackContent).toMatch(/resource\s+"aws_instance"\s+"app"/);
      expect(stackContent).toMatch(/count\s*=\s*2/);
      expect(stackContent).not.toMatch(/key_name\s*=/);
    });

    test("EC2 instances use encrypted EBS volumes", () => {
      expect(stackContent).toMatch(/encrypted\s*=\s*true/);
      expect(stackContent).toMatch(/kms_key_id\s*=\s*aws_kms_key\.main\.arn/);
    });

    test("EC2 instances enforce IMDSv2", () => {
      expect(stackContent).toMatch(/metadata_options\s*{[^}]*http_tokens\s*=\s*"required"/s);
    });

    test("EC2 instances use IAM instance profiles", () => {
      expect(stackContent).toMatch(/iam_instance_profile\s*=\s*aws_iam_instance_profile\.ec2_profile\.name/);
    });
  });

  // CloudWatch and Monitoring Tests
  describe("CloudWatch and Monitoring", () => {
    let stackContent: string;

    beforeAll(() => {
      stackContent = fs.readFileSync(stackPath, "utf8");
    });

    test("creates encrypted CloudWatch log group for Lambda", () => {
      expect(stackContent).toMatch(/resource\s+"aws_cloudwatch_log_group"\s+"lambda"/);
      expect(stackContent).toMatch(/kms_key_id\s*=\s*aws_kms_key\.main\.arn/);
    });

    test("sets appropriate log retention", () => {
      expect(stackContent).toMatch(/retention_in_days\s*=\s*14/);
    });

    test("includes CloudWatch agent configuration in user data", () => {
      expect(stackContent).toMatch(/amazon-cloudwatch-agent/);
      expect(stackContent).toMatch(/log_group_name/);
    });
  });

  // Resource Naming and Tagging Tests
  describe("Resource Naming and Tagging", () => {
    let stackContent: string;

    beforeAll(() => {
      stackContent = fs.readFileSync(stackPath, "utf8");
    });

    test("uses consistent naming pattern", () => {
      expect(stackContent).toMatch(/\$\{var\.project_name\}-\$\{var\.environment\}/);
    });

    test("applies common tags to resources", () => {
      expect(stackContent).toMatch(/tags\s*=\s*merge\(local\.common_tags/);
      expect(stackContent).toMatch(/tags\s*=\s*local\.common_tags/);
    });

    test("includes resource-specific Name tags", () => {
      expect(stackContent).toMatch(/Name\s*=\s*.*vpc/);
      expect(stackContent).toMatch(/Name\s*=\s*.*subnet/);
      expect(stackContent).toMatch(/Name\s*=\s*.*lambda/);
    });
  });

  // Dependency Management Tests
  describe("Dependency Management", () => {
    let stackContent: string;

    beforeAll(() => {
      stackContent = fs.readFileSync(stackPath, "utf8");
    });

    test("Lambda function has proper dependencies", () => {
      expect(stackContent).toMatch(/depends_on\s*=\s*\[[^\]]*aws_cloudwatch_log_group\.lambda/s);
      expect(stackContent).toMatch(/depends_on\s*=\s*\[[^\]]*aws_iam_role_policy\.lambda_policy/s);
      expect(stackContent).toMatch(/depends_on\s*=\s*\[[^\]]*aws_sqs_queue\.dlq/s);
    });

    test("NAT gateways depend on internet gateway", () => {
      expect(stackContent).toMatch(/depends_on\s*=\s*\[aws_internet_gateway\.main\]/);
    });
  });
});
