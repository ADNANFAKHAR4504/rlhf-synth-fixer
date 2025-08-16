// Unit tests for Terraform infrastructure
// No Terraform or AWS API calls - static analysis only

import fs from "fs";
import path from "path";

const STACK_PATH = path.resolve(__dirname, "../lib/tap_stack.tf");

describe("Terraform Financial Services Infrastructure - Unit Tests", () => {
  let stackContent: string;

  beforeAll(() => {
    if (!fs.existsSync(STACK_PATH)) {
      throw new Error(`Stack file not found at: ${STACK_PATH}`);
    }
    stackContent = fs.readFileSync(STACK_PATH, "utf8");
  });

  describe("File Structure and Organization", () => {
    test("unit-file-exists: tap_stack.tf exists", () => {
      expect(fs.existsSync(STACK_PATH)).toBe(true);
    });

    test("unit-no-provider: does not declare AWS provider (handled by provider.tf)", () => {
      expect(stackContent).not.toMatch(/\bprovider\s+"aws"\s*{/);
    });

    test("unit-variable-declarations: declares required variables", () => {
      expect(stackContent).toMatch(/variable\s+"primary_region"\s*{/);
      expect(stackContent).toMatch(/variable\s+"secondary_region"\s*{/);
      expect(stackContent).toMatch(/variable\s+"environment_suffix"\s*{/);
      expect(stackContent).toMatch(/variable\s+"company_name"\s*{/);
      expect(stackContent).toMatch(/variable\s+"vpc_cidr"\s*{/);
    });

    test("unit-local-values: defines local values for naming and tagging", () => {
      expect(stackContent).toMatch(/locals\s*{/);
      expect(stackContent).toMatch(/name_prefix\s*=/);
      expect(stackContent).toMatch(/common_tags\s*=/);
    });
  });

  describe("Multi-Region Configuration", () => {
    test("unit-multi-region-config: supports primary and secondary regions", () => {
      expect(stackContent).toMatch(/variable\s+"primary_region"/);
      expect(stackContent).toMatch(/variable\s+"secondary_region"/);
      expect(stackContent).toMatch(/default\s*=\s*"us-east-1"/);
      expect(stackContent).toMatch(/default\s*=\s*"us-west-2"/);
    });

    test("unit-az-data-source: uses availability zones data source", () => {
      expect(stackContent).toMatch(/data\s+"aws_availability_zones"\s+"available"/);
    });
  });

  describe("KMS Encryption Configuration", () => {
    test("unit-kms-encryption-policy: defines KMS key with comprehensive policy", () => {
      expect(stackContent).toMatch(/resource\s+"aws_kms_key"\s+"main"/);
      expect(stackContent).toMatch(/enable_key_rotation\s*=\s*true/);
      expect(stackContent).toMatch(/policy\s*=\s*jsonencode/);
    });

    test("unit-kms-service-permissions: grants permissions to AWS services", () => {
      expect(stackContent).toMatch(/Allow CloudWatch Logs/);
      expect(stackContent).toMatch(/Allow S3 Service/);
      expect(stackContent).toMatch(/Allow CloudTrail/);
    });

    test("unit-kms-alias: creates KMS alias", () => {
      expect(stackContent).toMatch(/resource\s+"aws_kms_alias"\s+"main"/);
    });
  });

  describe("VPC Architecture", () => {
    test("unit-vpc-architecture: creates VPC with proper configuration", () => {
      expect(stackContent).toMatch(/resource\s+"aws_vpc"\s+"main"/);
      expect(stackContent).toMatch(/enable_dns_hostnames\s*=\s*true/);
      expect(stackContent).toMatch(/enable_dns_support\s*=\s*true/);
    });

    test("unit-subnet-tiers: creates public, private, and isolated subnets", () => {
      expect(stackContent).toMatch(/resource\s+"aws_subnet"\s+"public"/);
      expect(stackContent).toMatch(/resource\s+"aws_subnet"\s+"private"/);
      expect(stackContent).toMatch(/resource\s+"aws_subnet"\s+"isolated"/);
      expect(stackContent).toMatch(/count\s*=\s*3/g);
    });

    test("unit-nat-gateways: creates NAT gateways for private subnet internet access", () => {
      expect(stackContent).toMatch(/resource\s+"aws_nat_gateway"\s+"main"/);
      expect(stackContent).toMatch(/resource\s+"aws_eip"\s+"nat"/);
      expect(stackContent).toMatch(/count\s*=\s*3/);
    });

    test("unit-route-tables: creates appropriate route tables", () => {
      expect(stackContent).toMatch(/resource\s+"aws_route_table"\s+"public"/);
      expect(stackContent).toMatch(/resource\s+"aws_route_table"\s+"private"/);
      expect(stackContent).toMatch(/resource\s+"aws_route_table"\s+"isolated"/);
    });

    test("unit-vpc-flow-logs: enables VPC flow logs", () => {
      expect(stackContent).toMatch(/resource\s+"aws_vpc_flow_logs"\s+"main"/);
      expect(stackContent).toMatch(/traffic_type\s*=\s*"ALL"/);
    });
  });

  describe("IAM Least Privilege", () => {
    test("unit-iam-least-privilege: creates specific IAM roles with limited permissions", () => {
      expect(stackContent).toMatch(/resource\s+"aws_iam_role"\s+"s3_access"/);
      expect(stackContent).toMatch(/resource\s+"aws_iam_role"\s+"cloudwatch_logs"/);
      expect(stackContent).toMatch(/resource\s+"aws_iam_role"\s+"flow_logs"/);
    });

    test("unit-iam-policies: defines restrictive IAM policies", () => {
      expect(stackContent).toMatch(/resource\s+"aws_iam_policy"\s+"s3_access"/);
      expect(stackContent).toMatch(/resource\s+"aws_iam_policy"\s+"flow_logs"/);
      // Ensure no wildcard permissions in critical policies
      const policyMatches = stackContent.match(/"Action"\s*:\s*\[[\s\S]*?\]/g) || [];
      policyMatches.forEach(policy => {
        // Allow wildcard only in flow logs policy for CloudWatch
        if (!policy.includes('flow_logs')) {
          expect(policy).not.toMatch(/"\*"/);
        }
      });
    });

    test("unit-iam-conditions: uses condition statements for enhanced security", () => {
      expect(stackContent).toMatch(/Condition\s*=\s*{/);
      expect(stackContent).toMatch(/StringEquals/);
      expect(stackContent).toMatch(/kms:ViaService/);
    });
  });

  describe("Security Groups", () => {
    test("unit-security-groups: creates tiered security groups", () => {
      expect(stackContent).toMatch(/resource\s+"aws_security_group"\s+"web_tier"/);
      expect(stackContent).toMatch(/resource\s+"aws_security_group"\s+"app_tier"/);
      expect(stackContent).toMatch(/resource\s+"aws_security_group"\s+"db_tier"/);
    });

    test("unit-sg-restrictive-rules: implements restrictive ingress rules", () => {
      // Web tier should only allow HTTP/HTTPS
      expect(stackContent).toMatch(/from_port\s*=\s*80/);
      expect(stackContent).toMatch(/from_port\s*=\s*443/);
      
      // App tier should only allow traffic from web tier
      expect(stackContent).toMatch(/security_groups\s*=\s*\[aws_security_group\.web_tier\.id\]/);
      
      // DB tier should only allow traffic from app tier
      expect(stackContent).toMatch(/security_groups\s*=\s*\[aws_security_group\.app_tier\.id\]/);
    });
  });

  describe("S3 Storage Configuration", () => {
    test("unit-s3-buckets: creates primary and logs buckets", () => {
      expect(stackContent).toMatch(/resource\s+"aws_s3_bucket"\s+"primary"/);
      expect(stackContent).toMatch(/resource\s+"aws_s3_bucket"\s+"logs"/);
    });

    test("unit-s3-encryption: enables server-side encryption with KMS", () => {
      expect(stackContent).toMatch(/aws_s3_bucket_server_side_encryption_configuration/);
      expect(stackContent).toMatch(/kms_master_key_id\s*=\s*aws_kms_key\.main\.arn/);
      expect(stackContent).toMatch(/sse_algorithm\s*=\s*"aws:kms"/);
    });

    test("unit-s3-versioning: enables versioning on all buckets", () => {
      expect(stackContent).toMatch(/aws_s3_bucket_versioning.*primary/);
      expect(stackContent).toMatch(/aws_s3_bucket_versioning.*logs/);
      expect(stackContent).toMatch(/status\s*=\s*"Enabled"/g);
    });

    test("unit-s3-public-access-block: blocks public access", () => {
      expect(stackContent).toMatch(/aws_s3_bucket_public_access_block.*primary/);
      expect(stackContent).toMatch(/aws_s3_bucket_public_access_block.*logs/);
      expect(stackContent).toMatch(/block_public_acls\s*=\s*true/g);
      expect(stackContent).toMatch(/restrict_public_buckets\s*=\s*true/g);
    });

    test("unit-s3-lifecycle: configures lifecycle policies", () => {
      expect(stackContent).toMatch(/aws_s3_bucket_lifecycle_configuration/);
      expect(stackContent).toMatch(/STANDARD_IA/);
      expect(stackContent).toMatch(/GLACIER/);
      expect(stackContent).toMatch(/DEEP_ARCHIVE/);
    });
  });

  describe("Monitoring Configuration", () => {
    test("unit-monitoring-config: creates CloudWatch log groups", () => {
      expect(stackContent).toMatch(/resource\s+"aws_cloudwatch_log_group"\s+"main"/);
      expect(stackContent).toMatch(/resource\s+"aws_cloudwatch_log_group"\s+"vpc_flow_logs"/);
      expect(stackContent).toMatch(/resource\s+"aws_cloudwatch_log_group"\s+"cloudtrail"/);
    });

    test("unit-log-retention: sets appropriate retention periods", () => {
      expect(stackContent).toMatch(/retention_in_days\s*=\s*30/);
      expect(stackContent).toMatch(/retention_in_days\s*=\s*14/);
      expect(stackContent).toMatch(/retention_in_days\s*=\s*90/);
    });

    test("unit-log-encryption: encrypts CloudWatch logs with KMS", () => {
      expect(stackContent).toMatch(/kms_key_id\s*=\s*aws_kms_key\.main\.arn/g);
    });
  });

  describe("CloudTrail Configuration", () => {
    test("unit-cloudtrail: creates CloudTrail with proper configuration", () => {
      expect(stackContent).toMatch(/resource\s+"aws_cloudtrail"\s+"main"/);
      expect(stackContent).toMatch(/is_multi_region_trail\s*=\s*true/);
      expect(stackContent).toMatch(/enable_log_file_validation\s*=\s*true/);
      expect(stackContent).toMatch(/include_global_service_events\s*=\s*true/);
    });

    test("unit-cloudtrail-encryption: encrypts CloudTrail logs", () => {
      expect(stackContent).toMatch(/kms_key_id\s*=\s*aws_kms_key\.main\.arn/);
    });

    test("unit-cloudtrail-s3-policy: creates S3 bucket policy for CloudTrail", () => {
      expect(stackContent).toMatch(/resource\s+"aws_s3_bucket_policy"\s+"cloudtrail_logs"/);
      expect(stackContent).toMatch(/AWSCloudTrailAclCheck/);
      expect(stackContent).toMatch(/AWSCloudTrailWrite/);
    });
  });

  describe("Naming Standards", () => {
    test("unit-naming-standards: uses consistent naming pattern", () => {
      // Check for name_prefix usage
      expect(stackContent).toMatch(/name_prefix\s*=\s*"\$\{var\.company_name\}-\$\{var\.environment_suffix\}"/);
      
      // Check for consistent resource naming
      const resourceNames = [
        'Name = "${local.name_prefix}',
        'name = "${local.name_prefix}',
        'bucket = "${local.name_prefix}'
      ];
      
      resourceNames.forEach(pattern => {
        expect(stackContent).toMatch(new RegExp(pattern.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
      });
    });

    test("unit-environment-suffix: supports environment suffix for naming conflicts", () => {
      expect(stackContent).toMatch(/variable\s+"environment_suffix"/);
      expect(stackContent).toMatch(/default\s*=\s*"dev"/);
    });
  });

  describe("Resource Tagging", () => {
    test("unit-tagging-strategy: implements comprehensive tagging", () => {
      expect(stackContent).toMatch(/common_tags\s*=\s*{/);
      expect(stackContent).toMatch(/Environment\s*=/);
      expect(stackContent).toMatch(/Project\s*=/);
      expect(stackContent).toMatch(/Company\s*=/);
      expect(stackContent).toMatch(/ManagedBy\s*=\s*"terraform"/);
      expect(stackContent).toMatch(/CostCenter\s*=/);
      expect(stackContent).toMatch(/Compliance\s*=\s*"financial-services"/);
      expect(stackContent).toMatch(/BackupRequired\s*=/);
    });

    test("unit-tag-merging: uses merge function for consistent tagging", () => {
      expect(stackContent).toMatch(/tags\s*=\s*merge\(local\.common_tags/g);
    });
  });

  describe("High Availability", () => {
    test("unit-ha-configuration: implements multi-AZ deployment", () => {
      // Verify 3 AZ deployment
      expect(stackContent).toMatch(/count\s*=\s*3/g);
      expect(stackContent).toMatch(/availability_zone\s*=\s*local\.azs\[count\.index\]/g);
    });

    test("unit-random-suffix: uses random suffix to avoid naming conflicts", () => {
      expect(stackContent).toMatch(/resource\s+"random_id"\s+"bucket_suffix"/);
      expect(stackContent).toMatch(/byte_length\s*=\s*8/);
    });
  });

  describe("Output Definitions", () => {
    test("unit-outputs-exist: defines all required outputs", () => {
      const requiredOutputs = [
        'vpc_id', 'vpc_cidr', 'public_subnet_ids', 'private_subnet_ids', 'isolated_subnet_ids',
        'web_security_group_id', 'app_security_group_id', 'db_security_group_id',
        'primary_s3_bucket_name', 'primary_s3_bucket_arn', 'logs_s3_bucket_name', 'logs_s3_bucket_arn',
        'kms_key_id', 'kms_key_arn', 's3_access_role_arn', 'cloudwatch_logs_role_arn',
        'main_log_group_name', 'vpc_flow_logs_group_name', 'cloudtrail_log_group_name',
        'cloudtrail_arn', 'environment_suffix'
      ];

      requiredOutputs.forEach(output => {
        expect(stackContent).toMatch(new RegExp(`output\\s+"${output}"\\s*{`));
      });
    });

    test("unit-output-descriptions: outputs have descriptions", () => {
      const outputCount = (stackContent.match(/output\s+"/g) || []).length;
      const descriptionCount = (stackContent.match(/description\s*=\s*"/g) || []).length;
      expect(descriptionCount).toBeGreaterThanOrEqual(outputCount);
    });
  });
});
