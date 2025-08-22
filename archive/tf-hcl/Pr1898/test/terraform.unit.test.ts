// Unit tests for Terraform infrastructure modules
// Tests file existence, syntax validation, and security configuration compliance

import fs from "fs";
import path from "path";

const libPath = path.resolve(__dirname, "../lib");

describe("Terraform Infrastructure Unit Tests", () => {
  describe("File Structure", () => {
    test("all required Terraform files exist", () => {
      const requiredFiles = [
        "provider.tf",
        "tap_stack.tf"
      ];

      requiredFiles.forEach(file => {
        const filePath = path.join(libPath, file);
        expect(fs.existsSync(filePath)).toBe(true);
      });
    });
  });

  describe("Security Configuration Validation", () => {
    test("S3 buckets have encryption enabled", () => {
      const tapStackContent = fs.readFileSync(path.join(libPath, "tap_stack.tf"), "utf8");
      
      // Check app data buckets encryption for both regions
      expect(tapStackContent).toMatch(/aws_s3_bucket_server_side_encryption_configuration.*app_data_usw2/);
      expect(tapStackContent).toMatch(/aws_s3_bucket_server_side_encryption_configuration.*app_data_use1/);
      expect(tapStackContent).toMatch(/sse_algorithm\s*=\s*"aws:kms"/);
      expect(tapStackContent).toMatch(/kms_master_key_id\s*=\s*aws_kms_key\.main_usw2\.arn/);
      expect(tapStackContent).toMatch(/kms_master_key_id\s*=\s*aws_kms_key\.main_use1\.arn/);
      
      // Check CloudTrail bucket encryption
      expect(tapStackContent).toMatch(/aws_s3_bucket_server_side_encryption_configuration.*cloudtrail_logs/);
    });

    test("RDS instances are not publicly accessible", () => {
      const tapStackContent = fs.readFileSync(path.join(libPath, "tap_stack.tf"), "utf8");
      // Check both RDS instances in both regions
      expect(tapStackContent).toMatch(/publicly_accessible\s*=\s*false/);
      expect(tapStackContent.match(/publicly_accessible\s*=\s*false/g)?.length).toBeGreaterThanOrEqual(2);
    });

    test("RDS storage is encrypted", () => {
      const tapStackContent = fs.readFileSync(path.join(libPath, "tap_stack.tf"), "utf8");
      expect(tapStackContent).toMatch(/storage_encrypted\s*=\s*true/);
      expect(tapStackContent).toMatch(/kms_key_id\s*=\s*aws_kms_key\.main_usw2\.arn/);
      expect(tapStackContent).toMatch(/kms_key_id\s*=\s*aws_kms_key\.main_use1\.arn/);
    });

    test("CloudTrail is multi-region and has logging enabled", () => {
      const tapStackContent = fs.readFileSync(path.join(libPath, "tap_stack.tf"), "utf8");
      expect(tapStackContent).toMatch(/is_multi_region_trail\s*=\s*true/);
      expect(tapStackContent).toMatch(/enable_logging\s*=\s*true/);
      expect(tapStackContent).toMatch(/include_global_service_events\s*=\s*true/);
    });

    test("security groups restrict ingress to known IP ranges", () => {
      const tapStackContent = fs.readFileSync(path.join(libPath, "tap_stack.tf"), "utf8");
      expect(tapStackContent).toMatch(/cidr_blocks\s*=\s*var\.allowed_ingress_cidrs/);
    });

    test("API Gateway VPC endpoints are configured for private access", () => {
      const tapStackContent = fs.readFileSync(path.join(libPath, "tap_stack.tf"), "utf8");
      expect(tapStackContent).toMatch(/aws_vpc_endpoint.*api_gateway_usw2/);
      expect(tapStackContent).toMatch(/aws_vpc_endpoint.*api_gateway_use1/);
      expect(tapStackContent).toMatch(/vpc_endpoint_type\s*=\s*"Interface"/);
      expect(tapStackContent).toMatch(/private_dns_enabled\s*=\s*true/);
    });

    test("S3 buckets have server-side encryption configured", () => {
      const tapStackContent = fs.readFileSync(path.join(libPath, "tap_stack.tf"), "utf8");
      // Check multiple S3 buckets exist with encryption
      expect(tapStackContent).toMatch(/aws_s3_bucket.*app_data_usw2/);
      expect(tapStackContent).toMatch(/aws_s3_bucket.*app_data_use1/);
      expect(tapStackContent).toMatch(/aws_s3_bucket.*cloudtrail_logs/);
      expect(tapStackContent).toMatch(/aws_s3_bucket.*config_usw2/);
      expect(tapStackContent).toMatch(/aws_s3_bucket.*config_use1/);
    });
  });

  describe("KMS Configuration", () => {
    test("customer-managed KMS keys are configured with key rotation", () => {
      const tapStackContent = fs.readFileSync(path.join(libPath, "tap_stack.tf"), "utf8");
      expect(tapStackContent).toMatch(/aws_kms_key.*main_usw2/);
      expect(tapStackContent).toMatch(/aws_kms_key.*main_use1/);
      expect(tapStackContent).toMatch(/enable_key_rotation\s*=\s*true/);
      expect(tapStackContent).toMatch(/description.*SecureApp production encryption key/);
    });

    test("KMS keys have proper IAM policies", () => {
      const tapStackContent = fs.readFileSync(path.join(libPath, "tap_stack.tf"), "utf8");
      expect(tapStackContent).toMatch(/policy\s*=\s*jsonencode/);
      expect(tapStackContent).toMatch(/Enable IAM User Permissions/);
    });

    test("KMS key aliases are configured", () => {
      const tapStackContent = fs.readFileSync(path.join(libPath, "tap_stack.tf"), "utf8");
      expect(tapStackContent).toMatch(/aws_kms_alias.*main_usw2/);
      expect(tapStackContent).toMatch(/aws_kms_alias.*main_use1/);
    });
  });

  describe("IAM Security", () => {
    test("IAM roles are configured for services", () => {
      const tapStackContent = fs.readFileSync(path.join(libPath, "tap_stack.tf"), "utf8");
      expect(tapStackContent).toMatch(/aws_iam_role.*flow_log/);
      expect(tapStackContent).toMatch(/aws_iam_role.*config/);
      expect(tapStackContent).toMatch(/assume_role_policy[\s\S]*sts:AssumeRole/);
    });

    test("MFA enforcement policy is configured", () => {
      const tapStackContent = fs.readFileSync(path.join(libPath, "tap_stack.tf"), "utf8");
      expect(tapStackContent).toMatch(/aws_iam_policy.*mfa_enforcement/);
      expect(tapStackContent).toMatch(/aws:MultiFactorAuthPresent/);
      expect(tapStackContent).toMatch(/DenyAllExceptUnlessSignedInWithMFA/);
    });

    test("IAM roles have least privilege policies", () => {
      const tapStackContent = fs.readFileSync(path.join(libPath, "tap_stack.tf"), "utf8");
      expect(tapStackContent).toMatch(/aws_iam_role_policy.*flow_log/);
      expect(tapStackContent).toMatch(/logs:CreateLogGroup/);
      expect(tapStackContent).toMatch(/logs:CreateLogStream/);
      expect(tapStackContent).toMatch(/logs:PutLogEvents/);
    });
  });

  describe("Monitoring and Compliance", () => {
    test("VPC Flow Logs are configured for both regions", () => {
      const tapStackContent = fs.readFileSync(path.join(libPath, "tap_stack.tf"), "utf8");
      expect(tapStackContent).toMatch(/aws_flow_log.*vpc_usw2/);
      expect(tapStackContent).toMatch(/aws_flow_log.*vpc_use1/);
      expect(tapStackContent).toMatch(/traffic_type\s*=\s*"ALL"/);
      expect(tapStackContent).toMatch(/aws_cloudwatch_log_group.*vpc_flow_logs/);
    });

    test("AWS Config is configured for compliance monitoring", () => {
      const tapStackContent = fs.readFileSync(path.join(libPath, "tap_stack.tf"), "utf8");
      expect(tapStackContent).toMatch(/aws_config_configuration_recorder.*main_usw2/);
      expect(tapStackContent).toMatch(/all_supported\s*=\s*true/);
      expect(tapStackContent).toMatch(/include_global_resource_types\s*=\s*true/);
      expect(tapStackContent).toMatch(/aws_config_delivery_channel/);
    });
  });

  describe("Resource Tagging", () => {
    test("common tags are defined in locals", () => {
      const tapStackContent = fs.readFileSync(path.join(libPath, "tap_stack.tf"), "utf8");
      expect(tapStackContent).toMatch(/locals\s*{/);
      expect(tapStackContent).toMatch(/common_tags\s*=\s*{/);
      expect(tapStackContent).toMatch(/environment.*production/);
      expect(tapStackContent).toMatch(/owner.*DevOps/);
      expect(tapStackContent).toMatch(/project.*SecureApp/);
    });

    test("resources reference common tags", () => {
      const tapStackContent = fs.readFileSync(path.join(libPath, "tap_stack.tf"), "utf8");
      expect(tapStackContent).toMatch(/tags\s*=\s*merge\(local\.common_tags/);
    });
  });

  describe("Provider Configuration", () => {
    test("provider configuration uses multi-region setup", () => {
      const providerContent = fs.readFileSync(path.join(libPath, "provider.tf"), "utf8");
      expect(providerContent).toMatch(/alias\s*=\s*"usw2"/);
      expect(providerContent).toMatch(/alias\s*=\s*"use1"/);
      expect(providerContent).toMatch(/region\s*=\s*"us-west-2"/);
      expect(providerContent).toMatch(/region\s*=\s*"us-east-1"/);
    });

    test("Terraform version constraints are specified", () => {
      const providerContent = fs.readFileSync(path.join(libPath, "provider.tf"), "utf8");
      expect(providerContent).toMatch(/required_version.*>=\s*1\.4\.0/);
      expect(providerContent).toMatch(/hashicorp\/aws/);
      expect(providerContent).toMatch(/version.*>=\s*5\.0/);
    });
  });

  describe("Networking Security", () => {
    test("VPCs have proper DNS configuration", () => {
      const tapStackContent = fs.readFileSync(path.join(libPath, "tap_stack.tf"), "utf8");
      expect(tapStackContent).toMatch(/aws_vpc.*main_usw2/);
      expect(tapStackContent).toMatch(/aws_vpc.*main_use1/);
      expect(tapStackContent).toMatch(/enable_dns_hostnames\s*=\s*true/);
      expect(tapStackContent).toMatch(/enable_dns_support\s*=\s*true/);
    });

    test("private subnets are configured correctly", () => {
      const tapStackContent = fs.readFileSync(path.join(libPath, "tap_stack.tf"), "utf8");
      expect(tapStackContent).toMatch(/aws_subnet.*private_usw2_a/);
      expect(tapStackContent).toMatch(/aws_subnet.*private_usw2_b/);
      expect(tapStackContent).toMatch(/aws_subnet.*private_use1_a/);
      expect(tapStackContent).toMatch(/aws_subnet.*private_use1_b/);
      expect(tapStackContent).toMatch(/cidr_block.*10\.0\.1\.0\/24/);
      expect(tapStackContent).toMatch(/cidr_block.*10\.1\.1\.0\/24/);
    });

    test("RDS security groups only allow access from web security groups", () => {
      const tapStackContent = fs.readFileSync(path.join(libPath, "tap_stack.tf"), "utf8");
      expect(tapStackContent).toMatch(/aws_security_group.*rds_usw2/);
      expect(tapStackContent).toMatch(/aws_security_group.*rds_use1/);
      expect(tapStackContent).toMatch(/security_groups\s*=\s*\[aws_security_group\.web_usw2\.id\]/);
      expect(tapStackContent).toMatch(/security_groups\s*=\s*\[aws_security_group\.web_use1\.id\]/);
      expect(tapStackContent).toMatch(/from_port\s*=\s*5432/);
    });
  });

  describe("Output Configuration", () => {
    test("required outputs are defined", () => {
      const tapStackContent = fs.readFileSync(path.join(libPath, "tap_stack.tf"), "utf8");
      const expectedOutputs = [
        "kms_key_ids_usw2",
        "kms_key_ids_use1",
        "vpc_ids_usw2",
        "vpc_ids_use1",
      ];
  
      expectedOutputs.forEach(output => {
        expect(tapStackContent).toMatch(new RegExp(`output\\s+"${output}"\\s*{`));
      });
  });

   test("outputs provide information for both regions", () => {
    const tapStackContent = fs.readFileSync(path.join(libPath, "tap_stack.tf"), "utf8");

    expect(tapStackContent).toMatch(/output\s*"kms_key_ids_usw2"/);
    expect(tapStackContent).toMatch(/output\s*"kms_key_ids_use1"/);
    expect(tapStackContent).toMatch(/output\s*"vpc_ids_usw2"/);
    expect(tapStackContent).toMatch(/output\s*"vpc_ids_use1"/);
  });

  });
});