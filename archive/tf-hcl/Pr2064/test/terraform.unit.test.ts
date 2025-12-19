/**
 * SecureCorp AWS Infrastructure - Unit Tests
 * 
 * These tests validate the Terraform configuration structure and syntax
 * without executing any Terraform commands or creating AWS resources.
 */

import fs from "fs";
import path from "path";

const STACK_REL = "../lib/tap_stack.tf";
const PROVIDER_REL = "../lib/provider.tf";
const stackPath = path.resolve(__dirname, STACK_REL);
const providerPath = path.resolve(__dirname, PROVIDER_REL);

describe("SecureCorp AWS Infrastructure - Unit Tests", () => {
  let stackContent: string;
  let providerContent: string;
  let combinedContent: string;

  beforeAll(() => {
    stackContent = fs.readFileSync(stackPath, "utf8");
    providerContent = fs.readFileSync(providerPath, "utf8");
    combinedContent = providerContent + "\n" + stackContent;
  });

  describe("File Structure and Syntax", () => {
    test("tap_stack.tf exists and is readable", () => {
      const exists = fs.existsSync(stackPath);
      expect(exists).toBe(true);
      expect(stackContent.length).toBeGreaterThan(0);
    });

    test("provider.tf exists and is readable", () => {
      const exists = fs.existsSync(providerPath);
      expect(exists).toBe(true);
      expect(providerContent.length).toBeGreaterThan(0);
    });

    test("has valid Terraform syntax structure", () => {
      expect(providerContent).toMatch(/terraform\s*{/);
      expect(providerContent).toMatch(/provider\s+"aws"/);
      expect(stackContent).toMatch(/variable\s+"aws_region"/);
      expect(stackContent).toMatch(/output\s+"vpc_id"/);
    });

    test("uses data sources for availability zones and caller identity", () => {
      expect(stackContent).toMatch(/data\s+"aws_caller_identity"\s+"current"/);
      expect(stackContent).toMatch(/data\s+"aws_availability_zones"\s+"available"/);
      expect(stackContent).toMatch(/data\s+"aws_iam_policy_document"\s+"kms_policy"/);
    });

    test("does NOT declare provider in tap_stack.tf (provider.tf owns providers)", () => {
      expect(stackContent).not.toMatch(/\bprovider\s+"aws"\s*{/);
    });
  });

  describe("Variable Definitions", () => {
    test("declares environment variable", () => {
      expect(stackContent).toMatch(/variable\s+"environment"\s*{/);
      expect(stackContent).toMatch(/default\s*=\s*"dev"/);
    });

    test("declares aws_region variable", () => {
      expect(stackContent).toMatch(/variable\s+"aws_region"\s*{/);
      expect(stackContent).toMatch(/default\s*=\s*"us-east-1"/);
    });

    test("declares project_name variable", () => {
      expect(stackContent).toMatch(/variable\s+"project_name"\s*{/);
      expect(stackContent).toMatch(/default\s*=\s*"securecorp"/);
    });

    test("declares vpc_cidr variable", () => {
      expect(stackContent).toMatch(/variable\s+"vpc_cidr"\s*{/);
      expect(stackContent).toMatch(/default\s*=\s*"10\.0\.0\.0\/16"/);
    });

    test("declares common_tags variable", () => {
      expect(stackContent).toMatch(/variable\s+"common_tags"\s*{/);
      expect(stackContent).toMatch(/type\s*=\s*map\(string\)/);
    });
  });

  describe("VPC and Networking Resources", () => {
    test("creates VPC with proper CIDR", () => {
      expect(stackContent).toMatch(/resource\s+"aws_vpc"\s+"main"\s*{/);
      expect(stackContent).toMatch(/cidr_block\s*=\s*var\.vpc_cidr/);
      expect(stackContent).toMatch(/enable_dns_hostnames\s*=\s*true/);
      expect(stackContent).toMatch(/enable_dns_support\s*=\s*true/);
    });

    test("creates internet gateway", () => {
      expect(stackContent).toMatch(/resource\s+"aws_internet_gateway"\s+"main"\s*{/);
    });

    test("creates public and private subnets", () => {
      expect(stackContent).toMatch(/resource\s+"aws_subnet"\s+"public"\s*{/);
      expect(stackContent).toMatch(/resource\s+"aws_subnet"\s+"private"\s*{/);
      expect(stackContent).toMatch(/count\s*=\s*2/);
    });

    test("creates NAT gateways for private subnets", () => {
      expect(stackContent).toMatch(/resource\s+"aws_nat_gateway"\s+"main"\s*{/);
      expect(stackContent).toMatch(/resource\s+"aws_eip"\s+"nat"\s*{/);
    });

    test("creates route tables and associations", () => {
      expect(stackContent).toMatch(/resource\s+"aws_route_table"\s+"public"\s*{/);
      expect(stackContent).toMatch(/resource\s+"aws_route_table"\s+"private"\s*{/);
      expect(stackContent).toMatch(/resource\s+"aws_route_table_association"\s+"public"\s*{/);
      expect(stackContent).toMatch(/resource\s+"aws_route_table_association"\s+"private"\s*{/);
    });
  });

  describe("Security Groups", () => {
    test("creates VPC endpoints security group", () => {
      expect(stackContent).toMatch(/resource\s+"aws_security_group"\s+"vpc_endpoints"\s*{/);
      expect(stackContent).toMatch(/name\s*=\s*"\$\{var\.project_name\}-\$\{var\.environment\}-vpc-endpoints-sg"/);
    });

    test("creates private subnet security group", () => {
      expect(stackContent).toMatch(/resource\s+"aws_security_group"\s+"private"\s*{/);
      expect(stackContent).toMatch(/name\s*=\s*"\$\{var\.project_name\}-\$\{var\.environment\}-private-sg"/);
    });

    test("security groups have proper ingress and egress rules", () => {
      expect(stackContent).toMatch(/ingress\s*{/);
      expect(stackContent).toMatch(/egress\s*{/);
      expect(stackContent).toMatch(/from_port\s*=\s*443/);
      expect(stackContent).toMatch(/protocol\s*=\s*"tcp"/);
    });

    test("security groups follow least privilege principle", () => {
      expect(stackContent).toMatch(/cidr_blocks\s*=\s*\[var\.vpc_cidr\]/);
      expect(stackContent).toMatch(/description\s*=\s*"HTTPS from VPC"/);
    });
  });

  describe("VPC Endpoints", () => {
    test("creates S3 gateway endpoint", () => {
      expect(stackContent).toMatch(/resource\s+"aws_vpc_endpoint"\s+"s3"\s*{/);
      expect(stackContent).toMatch(/service_name\s*=\s*"com\.amazonaws\.\$\{var\.aws_region\}\.s3"/);
      expect(stackContent).toMatch(/vpc_endpoint_type\s*=\s*"Gateway"/);
    });

    test("creates KMS interface endpoint", () => {
      expect(stackContent).toMatch(/resource\s+"aws_vpc_endpoint"\s+"kms"\s*{/);
      expect(stackContent).toMatch(/service_name\s*=\s*"com\.amazonaws\.\$\{var\.aws_region\}\.kms"/);
      expect(stackContent).toMatch(/vpc_endpoint_type\s*=\s*"Interface"/);
    });

    test("creates CloudTrail interface endpoint", () => {
      expect(stackContent).toMatch(/resource\s+"aws_vpc_endpoint"\s+"cloudtrail"\s*{/);
      expect(stackContent).toMatch(/private_dns_enabled\s*=\s*true/);
    });

    test("creates CloudWatch Logs interface endpoint", () => {
      expect(stackContent).toMatch(/resource\s+"aws_vpc_endpoint"\s+"logs"\s*{/);
    });
  });

  describe("KMS Encryption", () => {
    test("creates customer-managed KMS key", () => {
      expect(stackContent).toMatch(/resource\s+"aws_kms_key"\s+"main"\s*{/);
      expect(stackContent).toMatch(/deletion_window_in_days\s*=\s*7/);
      expect(stackContent).toMatch(/policy\s*=\s*data\.aws_iam_policy_document\.kms_policy\.json/);
    });

    test("creates KMS alias", () => {
      expect(stackContent).toMatch(/resource\s+"aws_kms_alias"\s+"main"\s*{/);
      expect(stackContent).toMatch(/name\s*=\s*"alias\/\$\{var\.project_name\}-\$\{var\.environment\}-key"/);
    });

    test("KMS policy allows CloudTrail access", () => {
      expect(stackContent).toMatch(/principals\s*{[^}]*type\s*=\s*"Service"[^}]*identifiers\s*=\s*\["cloudtrail\.amazonaws\.com"\]/);
      expect(stackContent).toMatch(/"kms:GenerateDataKey\*"/);
      expect(stackContent).toMatch(/"kms:DescribeKey"/);
    });
  });

  describe("S3 Buckets and Security", () => {
    test("creates CloudTrail logs bucket", () => {
      expect(stackContent).toMatch(/resource\s+"aws_s3_bucket"\s+"cloudtrail_logs"\s*{/);
      expect(stackContent).toMatch(/bucket\s*=\s*"\$\{var\.project_name\}-\$\{var\.environment\}-cloudtrail-logs-\$\{random_string\.suffix\.result\}"/);
    });

    test("creates application data bucket", () => {
      expect(stackContent).toMatch(/resource\s+"aws_s3_bucket"\s+"app_data"\s*{/);
      expect(stackContent).toMatch(/bucket\s*=\s*"\$\{var\.project_name\}-\$\{var\.environment\}-app-data-\$\{random_string\.suffix\.result\}"/);
    });

    test("enables S3 encryption with KMS", () => {
      expect(stackContent).toMatch(/resource\s+"aws_s3_bucket_server_side_encryption_configuration"/);
      expect(stackContent).toMatch(/kms_master_key_id\s*=\s*aws_kms_key\.main\.arn/);
      expect(stackContent).toMatch(/sse_algorithm\s*=\s*"aws:kms"/);
    });

    test("blocks public access on S3 buckets", () => {
      expect(stackContent).toMatch(/resource\s+"aws_s3_bucket_public_access_block"/);
      expect(stackContent).toMatch(/block_public_acls\s*=\s*true/);
      expect(stackContent).toMatch(/block_public_policy\s*=\s*true/);
      expect(stackContent).toMatch(/ignore_public_acls\s*=\s*true/);
      expect(stackContent).toMatch(/restrict_public_buckets\s*=\s*true/);
    });

    test("enables S3 versioning", () => {
      expect(stackContent).toMatch(/resource\s+"aws_s3_bucket_versioning"/);
      expect(stackContent).toMatch(/status\s*=\s*"Enabled"/);
    });

    test("configures lifecycle policies for compliance", () => {
      expect(stackContent).toMatch(/resource\s+"aws_s3_bucket_lifecycle_configuration"/);
      expect(stackContent).toMatch(/days\s*=\s*2557/); // 7 years
      expect(stackContent).toMatch(/storage_class\s*=\s*"STANDARD_IA"/);
      expect(stackContent).toMatch(/storage_class\s*=\s*"GLACIER"/);
      expect(stackContent).toMatch(/storage_class\s*=\s*"DEEP_ARCHIVE"/);
    });
  });

  describe("IAM Roles and Policies", () => {
    test("creates CloudTrail IAM role", () => {
      expect(stackContent).toMatch(/resource\s+"aws_iam_role"\s+"cloudtrail"\s*{/);
      expect(stackContent).toMatch(/Service.*cloudtrail\.amazonaws\.com/);
    });

    test("creates developer IAM role", () => {
      expect(stackContent).toMatch(/resource\s+"aws_iam_role"\s+"developer"\s*{/);
      expect(stackContent).toMatch(/name\s*=\s*"\$\{var\.project_name\}-\$\{var\.environment\}-developer-role"/);
    });

    test("creates devops IAM role", () => {
      expect(stackContent).toMatch(/resource\s+"aws_iam_role"\s+"devops"\s*{/);
      expect(stackContent).toMatch(/name\s*=\s*"\$\{var\.project_name\}-\$\{var\.environment\}-devops-role"/);
    });

    test("creates security IAM role", () => {
      expect(stackContent).toMatch(/resource\s+"aws_iam_role"\s+"security"\s*{/);
      expect(stackContent).toMatch(/name\s*=\s*"\$\{var\.project_name\}-\$\{var\.environment\}-security-role"/);
    });

    test("creates business IAM role", () => {
      expect(stackContent).toMatch(/resource\s+"aws_iam_role"\s+"business"\s*{/);
      expect(stackContent).toMatch(/name\s*=\s*"\$\{var\.project_name\}-\$\{var\.environment\}-business-role"/);
    });

    test("IAM policies follow least privilege principle", () => {
      expect(stackContent).toMatch(/resource\s+"aws_iam_role_policy"\s+"developer"/);
      expect(stackContent).toMatch(/"s3:GetObject"/);
      expect(stackContent).toMatch(/"s3:PutObject"/);
      expect(stackContent).toMatch(/"s3:ListBucket"/);
      expect(stackContent).not.toMatch(/"s3:\*"/); // Should not have wildcard permissions
    });

    test("uses managed policies for standard access", () => {
      expect(stackContent).toMatch(/resource\s+"aws_iam_role_policy_attachment"/);
      expect(stackContent).toMatch(/policy_arn\s*=\s*"arn:aws:iam::aws:policy\/ReadOnlyAccess"/);
      expect(stackContent).toMatch(/policy_arn\s*=\s*"arn:aws:iam::aws:policy\/CloudWatchLogsReadOnlyAccess"/);
      expect(stackContent).toMatch(/policy_arn\s*=\s*"arn:aws:iam::aws:policy\/job-function\/Billing"/);
    });
  });

  describe("CloudWatch and Monitoring", () => {
    test("creates CloudWatch log groups", () => {
      expect(stackContent).toMatch(/resource\s+"aws_cloudwatch_log_group"\s+"cloudtrail"\s*{/);
      expect(stackContent).toMatch(/resource\s+"aws_cloudwatch_log_group"\s+"application"\s*{/);
    });

    test("configures log retention policies", () => {
      expect(stackContent).toMatch(/retention_in_days\s*=\s*2557/); // 7 years for CloudTrail
      expect(stackContent).toMatch(/retention_in_days\s*=\s*90/); // 90 days for application logs
    });

    test("CloudWatch logs are configured", () => {
      expect(stackContent).toMatch(/retention_in_days\s*=\s*2557/); // 7 years for CloudTrail
      expect(stackContent).toMatch(/retention_in_days\s*=\s*90/); // 90 days for application logs
    });
  });

  describe("CloudTrail Configuration", () => {
    test("uses existing CloudTrail trail", () => {
      expect(stackContent).toMatch(/locals\s*{/);
      expect(stackContent).toMatch(/existing_cloudtrail_name\s*=\s*"prod-dev-trail"/);
    });

    test("CloudTrail bucket policy allows CloudTrail service access", () => {
      expect(stackContent).toMatch(/data\s+"aws_iam_policy_document"\s+"cloudtrail_bucket_policy"/);
      expect(stackContent).toMatch(/cloudtrail\.amazonaws\.com/);
      expect(stackContent).toMatch(/s3:GetBucketAcl/);
      expect(stackContent).toMatch(/s3:PutObject/);
    });
  });

  describe("Resource Naming and Tagging", () => {
    test("follows consistent naming convention", () => {
      expect(stackContent).toMatch(/name\s*=\s*"\$\{var\.project_name\}-\$\{var\.environment\}-/);
      expect(stackContent).toMatch(/Name\s*=\s*"\$\{var\.project_name\}-\$\{var\.environment\}-/);
    });

    test("applies common tags to all resources", () => {
      expect(stackContent).toMatch(/tags\s*=\s*merge\(var\.common_tags,/);
      expect(stackContent).toMatch(/Environment\s*=\s*"dev"/);
      expect(stackContent).toMatch(/Project\s*=\s*"SecureCorp"/);
      expect(stackContent).toMatch(/ManagedBy\s*=\s*"terraform"/);
    });

    test("uses random string for unique resource naming", () => {
      expect(stackContent).toMatch(/resource\s+"random_string"\s+"suffix"\s*{/);
      expect(stackContent).toMatch(/length\s*=\s*8/);
      expect(stackContent).toMatch(/special\s*=\s*false/);
      expect(stackContent).toMatch(/upper\s*=\s*false/);
    });
  });

  describe("Outputs", () => {
    test("outputs VPC information", () => {
      expect(stackContent).toMatch(/output\s+"vpc_id"\s*{/);
      expect(stackContent).toMatch(/value\s*=\s*aws_vpc\.main\.id/);
    });

    test("outputs subnet information", () => {
      expect(stackContent).toMatch(/output\s+"private_subnet_ids"\s*{/);
      expect(stackContent).toMatch(/output\s+"public_subnet_ids"\s*{/);
      expect(stackContent).toMatch(/value\s*=\s*aws_subnet\.private\[\*\]\.id/);
    });

    test("outputs KMS key information", () => {
      expect(stackContent).toMatch(/output\s+"kms_key_id"\s*{/);
      expect(stackContent).toMatch(/output\s+"kms_key_arn"\s*{/);
    });

    test("outputs S3 bucket information", () => {
      expect(stackContent).toMatch(/output\s+"cloudtrail_logs_bucket"\s*{/);
      expect(stackContent).toMatch(/output\s+"app_data_bucket"\s*{/);
    });

    test("outputs IAM role information", () => {
      expect(stackContent).toMatch(/output\s+"iam_roles"\s*{/);
      expect(stackContent).toMatch(/developer\s*=\s*aws_iam_role\.developer\.arn/);
      expect(stackContent).toMatch(/devops\s*=\s*aws_iam_role\.devops\.arn/);
      expect(stackContent).toMatch(/security\s*=\s*aws_iam_role\.security\.arn/);
      expect(stackContent).toMatch(/business\s*=\s*aws_iam_role\.business\.arn/);
    });

    test("outputs VPC endpoint information", () => {
      expect(stackContent).toMatch(/output\s+"vpc_endpoints"\s*{/);
      expect(stackContent).toMatch(/s3\s*=\s*aws_vpc_endpoint\.s3\.id/);
      expect(stackContent).toMatch(/kms\s*=\s*aws_vpc_endpoint\.kms\.id/);
    });

    test("outputs CloudTrail information", () => {
      expect(stackContent).toMatch(/output\s+"cloudtrail_arn"\s*{/);
      expect(stackContent).toMatch(/value\s*=\s*"arn:aws:cloudtrail:\$\{var\.aws_region\}:\$\{data\.aws_caller_identity\.current\.account_id\}:trail\/\$\{local\.existing_cloudtrail_name\}"/);
    });
  });

  describe("Security Best Practices", () => {
    test("no hardcoded sensitive values", () => {
      expect(stackContent).not.toMatch(/password\s*=\s*"[^"]+"/);
      expect(stackContent).not.toMatch(/secret\s*=\s*"[^"]+"/);
      expect(stackContent).not.toMatch(/key\s*=\s*"[^"]+"/);
    });

    test("uses variables for configurable values", () => {
      expect(stackContent).toMatch(/var\.aws_region/);
      expect(stackContent).toMatch(/var\.environment/);
      expect(stackContent).toMatch(/var\.project_name/);
      expect(stackContent).toMatch(/var\.vpc_cidr/);
    });

    test("no resources allow public access by default", () => {
      // Allow 0.0.0.0/0 only in egress rules (outbound traffic)
      const ingressRules = stackContent.match(/ingress\s*{[^}]*cidr_blocks\s*=\s*\["0\.0\.0\.0\/0"\][^}]*}/g);
      expect(ingressRules).toBeNull();
      expect(stackContent).toMatch(/block_public_acls\s*=\s*true/);
    });

    test("encryption is enabled for all storage", () => {
      expect(stackContent).toMatch(/server_side_encryption_configuration/);
      expect(stackContent).toMatch(/kms_key_id/);
      // S3 encryption is handled by server_side_encryption_configuration
      // CloudWatch logs encryption is handled by kms_key_id
    });
  });
});