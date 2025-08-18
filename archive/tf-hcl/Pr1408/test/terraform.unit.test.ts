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
      expect(stackContent).toMatch(/variable\s+"company"\s*{/);
      expect(stackContent).toMatch(/variable\s+"environment"\s*{/);
      expect(stackContent).toMatch(/variable\s+"primary_region"\s*{/);
      expect(stackContent).toMatch(/variable\s+"secondary_region"\s*{/);
      expect(stackContent).toMatch(/variable\s+"vpc_cidr_primary"\s*{/);
      expect(stackContent).toMatch(/variable\s+"vpc_cidr_secondary"\s*{/);
      expect(stackContent).toMatch(/variable\s+"tags"\s*{/);
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
      expect(stackContent).toMatch(/data\s+"aws_availability_zones"\s+"primary"/);
      expect(stackContent).toMatch(/data\s+"aws_availability_zones"\s+"secondary"/);
    });
  });

  describe("KMS Encryption Configuration", () => {
    test("unit-kms-encryption-policy: defines KMS keys with comprehensive policies", () => {
      expect(stackContent).toMatch(/resource\s+"aws_kms_key"\s+"logs_primary"/);
      expect(stackContent).toMatch(/resource\s+"aws_kms_key"\s+"logs_secondary"/);
      expect(stackContent).toMatch(/enable_key_rotation\s*=\s*true/g);
      expect(stackContent).toMatch(/policy\s*=\s*jsonencode/g);
    });

    test("unit-kms-service-permissions: grants permissions to AWS services", () => {
      expect(stackContent).toMatch(/AllowRootAccountAdmin/);
      expect(stackContent).toMatch(/AllowCWLogsUse/);
      expect(stackContent).toMatch(/logs\.\${var\.primary_region}\.amazonaws\.com/);
      expect(stackContent).toMatch(/logs\.\${var\.secondary_region}\.amazonaws\.com/);
    });

    test("unit-kms-alias: creates KMS aliases", () => {
      expect(stackContent).toMatch(/resource\s+"aws_kms_alias"\s+"logs_primary"/);
      expect(stackContent).toMatch(/resource\s+"aws_kms_alias"\s+"logs_secondary"/);
    });
  });

  describe("VPC Architecture", () => {
    test("unit-vpc-architecture: creates VPCs with proper configuration", () => {
      expect(stackContent).toMatch(/resource\s+"aws_vpc"\s+"primary"/);
      expect(stackContent).toMatch(/resource\s+"aws_vpc"\s+"secondary"/);
      expect(stackContent).toMatch(/enable_dns_hostnames\s*=\s*true/g);
      expect(stackContent).toMatch(/enable_dns_support\s*=\s*true/g);
    });

    test("unit-subnet-tiers: creates public and private subnets", () => {
      expect(stackContent).toMatch(/resource\s+"aws_subnet"\s+"public_primary"/);
      expect(stackContent).toMatch(/resource\s+"aws_subnet"\s+"private_primary"/);
      expect(stackContent).toMatch(/resource\s+"aws_subnet"\s+"public_secondary"/);
      expect(stackContent).toMatch(/resource\s+"aws_subnet"\s+"private_secondary"/);
      expect(stackContent).toMatch(/count\s*=\s*3/g);
    });

    test("unit-nat-gateways: creates NAT gateways for private subnet internet access", () => {
      expect(stackContent).toMatch(/resource\s+"aws_nat_gateway"\s+"primary"/);
      expect(stackContent).toMatch(/resource\s+"aws_nat_gateway"\s+"secondary"/);
      expect(stackContent).toMatch(/resource\s+"aws_eip"\s+"nat_primary"/);
      expect(stackContent).toMatch(/resource\s+"aws_eip"\s+"nat_secondary"/);
    });

    test("unit-route-tables: creates appropriate route tables", () => {
      expect(stackContent).toMatch(/resource\s+"aws_route_table"\s+"public_primary"/);
      expect(stackContent).toMatch(/resource\s+"aws_route_table"\s+"private_primary"/);
      expect(stackContent).toMatch(/resource\s+"aws_route_table"\s+"public_secondary"/);
      expect(stackContent).toMatch(/resource\s+"aws_route_table"\s+"private_secondary"/);
    });

    test("unit-vpc-flow-logs: enables VPC flow logs", () => {
      expect(stackContent).toMatch(/resource\s+"aws_flow_log"\s+"primary"/);
      expect(stackContent).toMatch(/resource\s+"aws_flow_log"\s+"secondary"/);
      expect(stackContent).toMatch(/traffic_type\s*=\s*"ALL"/g);
    });
  });

  describe("IAM Least Privilege", () => {
    test("unit-iam-least-privilege: creates specific IAM roles with limited permissions", () => {
      expect(stackContent).toMatch(/resource\s+"aws_iam_role"\s+"vpc_flowlogs_primary"/);
      expect(stackContent).toMatch(/resource\s+"aws_iam_role"\s+"vpc_flowlogs_secondary"/);
    });

    test("unit-iam-policies: defines restrictive IAM policies for flow logs", () => {
      expect(stackContent).toMatch(/resource\s+"aws_iam_policy"\s+"vpc_flowlogs_primary"/);
      expect(stackContent).toMatch(/resource\s+"aws_iam_policy"\s+"vpc_flowlogs_secondary"/);
      expect(stackContent).toMatch(/logs:CreateLogStream/g);
      expect(stackContent).toMatch(/logs:PutLogEvents/g);
    });

    test("unit-iam-trust-policy: uses proper trust policies", () => {
      expect(stackContent).toMatch(/vpc-flow-logs\.amazonaws\.com/);
    });
  });

  describe("Security Groups", () => {
    test("unit-security-groups: creates minimal security groups", () => {
      expect(stackContent).toMatch(/resource\s+"aws_security_group"\s+"app_primary"/);
      expect(stackContent).toMatch(/resource\s+"aws_security_group"\s+"app_secondary"/);
    });

    test("unit-sg-restrictive-default: security groups are restrictive by default", () => {
      // Should not have any ingress rules defined (restrictive by default)
      expect(stackContent).not.toMatch(/ingress\s*{/);
    });
  });

  describe("S3 Storage Configuration", () => {
    test("unit-s3-buckets: creates data buckets in both regions", () => {
      expect(stackContent).toMatch(/resource\s+"aws_s3_bucket"\s+"data_primary"/);
      expect(stackContent).toMatch(/resource\s+"aws_s3_bucket"\s+"data_secondary"/);
    });

    test("unit-s3-encryption: enables server-side encryption with KMS", () => {
      expect(stackContent).toMatch(/aws_s3_bucket_server_side_encryption_configuration.*data_primary/);
      expect(stackContent).toMatch(/aws_s3_bucket_server_side_encryption_configuration.*data_secondary/);
      expect(stackContent).toMatch(/kms_master_key_id\s*=\s*aws_kms_key\.logs_primary\.arn/);
      expect(stackContent).toMatch(/kms_master_key_id\s*=\s*aws_kms_key\.logs_secondary\.arn/);
      expect(stackContent).toMatch(/sse_algorithm\s*=\s*"aws:kms"/g);
    });

    test("unit-s3-force-destroy: buckets have force_destroy set to false for safety", () => {
      expect(stackContent).toMatch(/force_destroy\s*=\s*false/g);
    });
  });

  describe("Monitoring Configuration", () => {
    test("unit-monitoring-config: creates CloudWatch log groups", () => {
      expect(stackContent).toMatch(/resource\s+"aws_cloudwatch_log_group"\s+"platform_primary"/);
      expect(stackContent).toMatch(/resource\s+"aws_cloudwatch_log_group"\s+"platform_secondary"/);
    });

    test("unit-log-retention: sets 90-day retention period", () => {
      expect(stackContent).toMatch(/retention_in_days\s*=\s*90/g);
    });

    test("unit-log-encryption: encrypts CloudWatch logs with KMS", () => {
      expect(stackContent).toMatch(/kms_key_id\s*=\s*aws_kms_key\.logs_primary\.arn/);
      expect(stackContent).toMatch(/kms_key_id\s*=\s*aws_kms_key\.logs_secondary\.arn/);
    });
  });

  describe("Resource Tagging", () => {
    test("unit-tagging-strategy: implements comprehensive tagging", () => {
      expect(stackContent).toMatch(/common_tags\s*=\s*merge\(var\.tags,\s*{/);
      expect(stackContent).toMatch(/Company\s*=\s*var\.company/);
      expect(stackContent).toMatch(/Environment\s*=\s*var\.environment/);
    });

    test("unit-tag-merging: uses merge function for consistent tagging", () => {
      expect(stackContent).toMatch(/tags\s*=\s*merge\(local\.common_tags/g);
      expect(stackContent).toMatch(/tags\s*=\s*local\.common_tags/g);
    });
  });

  describe("High Availability", () => {
    test("unit-ha-configuration: implements multi-AZ deployment", () => {
      // Verify 3 AZ deployment
      expect(stackContent).toMatch(/count\s*=\s*3/g);
      expect(stackContent).toMatch(/data\.aws_availability_zones\.primary\.names\[count\.index\]/);
      expect(stackContent).toMatch(/data\.aws_availability_zones\.secondary\.names\[count\.index\]/);
    });

    test("unit-subnet-cidr-calculation: uses cidrsubnet for proper IP allocation", () => {
      expect(stackContent).toMatch(/cidrsubnet\(var\.vpc_cidr_primary,\s*4,\s*count\.index\)/);
      expect(stackContent).toMatch(/cidrsubnet\(var\.vpc_cidr_primary,\s*4,\s*count\.index\s*\+\s*8\)/);
      expect(stackContent).toMatch(/cidrsubnet\(var\.vpc_cidr_secondary,\s*4,\s*count\.index\)/);
      expect(stackContent).toMatch(/cidrsubnet\(var\.vpc_cidr_secondary,\s*4,\s*count\.index\s*\+\s*8\)/);
    });
  });

  describe("Output Definitions", () => {
    test("unit-outputs-exist: defines all required outputs", () => {
      const requiredOutputs = [
        'primary_vpc_id',
        'secondary_vpc_id', 
        'primary_public_subnet_ids',
        'primary_private_subnet_ids',
        'secondary_public_subnet_ids',
        'secondary_private_subnet_ids',
        'kms_logs_primary_arn',
        'kms_logs_secondary_arn',
        'cw_log_group_primary'
      ];

      requiredOutputs.forEach(output => {
        expect(stackContent).toMatch(new RegExp(`output\\s+"${output}"\\s*{`));
      });
    });

    test("unit-output-values: outputs reference correct resources", () => {
      expect(stackContent).toMatch(/value\s*=\s*aws_vpc\.primary\.id/);
      expect(stackContent).toMatch(/value\s*=\s*aws_vpc\.secondary\.id/);
      expect(stackContent).toMatch(/value\s*=\s*aws_subnet\.public_primary\[\*\]\.id/);
      expect(stackContent).toMatch(/value\s*=\s*aws_subnet\.private_primary\[\*\]\.id/);
    });
  });

  describe("Provider Configuration", () => {
    test("unit-provider-aliases: uses secondary provider alias", () => {
      expect(stackContent).toMatch(/provider\s*=\s*aws\.secondary/g);
    });

    test("unit-data-sources: defines required data sources", () => {
      expect(stackContent).toMatch(/data\s+"aws_caller_identity"\s+"current"/);
      expect(stackContent).toMatch(/data\s+"aws_partition"\s+"current"/);
    });
  });

  describe("Security Best Practices", () => {
    test("unit-kms-deletion-window: sets appropriate KMS key deletion window", () => {
      expect(stackContent).toMatch(/deletion_window_in_days\s*=\s*30/g);
    });

    test("unit-public-ip-mapping: only public subnets map public IPs", () => {
      expect(stackContent).toMatch(/map_public_ip_on_launch\s*=\s*true/);
      expect(stackContent).toMatch(/map_public_ip_on_launch\s*=\s*false/);
    });

    test("unit-flow-log-destination: flow logs go to CloudWatch", () => {
      expect(stackContent).toMatch(/log_destination_type\s*=\s*"cloud-watch-logs"/g);
    });
  });
});
