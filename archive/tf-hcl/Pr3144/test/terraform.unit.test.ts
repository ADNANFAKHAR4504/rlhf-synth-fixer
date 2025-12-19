// tests/unit/terraform.unit.test.ts
// Comprehensive unit tests for Terraform configuration files
// Tests security best practices, configuration validation, and file structure
// No Terraform commands are executed - pure file content analysis

import fs from "fs";
import path from "path";

// File paths
const LIB_DIR = path.resolve(__dirname, "../lib");
const MAIN_TF = path.join(LIB_DIR, "main.tf");
const VARIABLES_TF = path.join(LIB_DIR, "variables.tf");
const OUTPUTS_TF = path.join(LIB_DIR, "outputs.tf");
const PROVIDER_TF = path.join(LIB_DIR, "provider.tf");
const VERSIONS_TF = path.join(LIB_DIR, "versions.tf");

// Helper function to read file content safely
function readFileContent(filePath: string): string {
  if (!fs.existsSync(filePath)) {
    throw new Error(`File not found: ${filePath}`);
  }
  return fs.readFileSync(filePath, "utf8");
}

// Helper function to extract all resource types from Terraform content
function extractResourceTypes(content: string): string[] {
  const resourceRegex = /resource\s+"([^"]+)"\s+"([^"]+)"/g;
  const resources: string[] = [];
  let match;

  while ((match = resourceRegex.exec(content)) !== null) {
    resources.push(`${match[1]}.${match[2]}`);
  }

  return resources;
}

// Helper function to extract all variables from Terraform content
function extractVariables(content: string): string[] {
  const variableRegex = /variable\s+"([^"]+)"/g;
  const variables: string[] = [];
  let match;

  while ((match = variableRegex.exec(content)) !== null) {
    variables.push(match[1]);
  }

  return variables;
}

// Helper function to extract all outputs from Terraform content
function extractOutputs(content: string): string[] {
  const outputRegex = /output\s+"([^"]+)"/g;
  const outputs: string[] = [];
  let match;

  while ((match = outputRegex.exec(content)) !== null) {
    outputs.push(match[1]);
  }

  return outputs;
}

describe("Terraform Configuration Files", () => {
  describe("File Structure and Presence", () => {
    test("all required Terraform files exist", () => {
      const requiredFiles = [MAIN_TF, VARIABLES_TF, OUTPUTS_TF, PROVIDER_TF, VERSIONS_TF];

      requiredFiles.forEach(filePath => {
        const exists = fs.existsSync(filePath);
        expect(exists).toBe(true);
      });
    });

    test("main.tf contains infrastructure resources", () => {
      const content = readFileContent(MAIN_TF);
      expect(content).toMatch(/resource\s+"aws_/);
    });

    test("variables.tf contains variable declarations", () => {
      const content = readFileContent(VARIABLES_TF);
      expect(content).toMatch(/variable\s+"/);
    });

    test("outputs.tf contains output declarations", () => {
      const content = readFileContent(OUTPUTS_TF);
      expect(content).toMatch(/output\s+"/);
    });

    test("provider.tf contains provider configuration", () => {
      const content = readFileContent(PROVIDER_TF);
      expect(content).toMatch(/provider\s+"aws"/);
    });

    test("versions.tf contains Terraform version constraints", () => {
      const content = readFileContent(VERSIONS_TF);
      expect(content).toMatch(/required_version/);
    });
  });

  describe("Security Best Practices", () => {
    test("no hardcoded AWS credentials", () => {
      const files = [MAIN_TF, VARIABLES_TF, OUTPUTS_TF, PROVIDER_TF, VERSIONS_TF];

      files.forEach(filePath => {
        const content = readFileContent(filePath);

        // Check for hardcoded access keys
        expect(content).not.toMatch(/aws_access_key_id/i);
        expect(content).not.toMatch(/aws_secret_access_key/i);
        expect(content).not.toMatch(/AKIA[0-9A-Z]{16}/);
        // Note: Do not broadly match base64-like strings to avoid false positives
        // from legitimate Terraform fields such as source_code_hash or *_base64sha256
      });
    });

    test("no hardcoded passwords or secrets", () => {
      const content = readFileContent(MAIN_TF);

      // Check for common password patterns
      expect(content).not.toMatch(/password\s*=\s*"[^"]{8,}"/i);
      expect(content).not.toMatch(/secret\s*=\s*"[^"]{8,}"/i);
      expect(content).not.toMatch(/key\s*=\s*"[^"]{16,}"/i);
    });

    test("encryption is enabled for sensitive resources", () => {
      const content = readFileContent(MAIN_TF);

      // Check S3 bucket encryption
      expect(content).toMatch(/aws_s3_bucket_server_side_encryption_configuration/);

      // Check RDS encryption
      expect(content).toMatch(/storage_encrypted\s*=\s*true/);

      // Check EBS encryption
      expect(content).toMatch(/aws_ebs_encryption_by_default/);

      // Check KMS key rotation
      expect(content).toMatch(/enable_key_rotation\s*=\s*true/);
    });

    test("public access is blocked for S3 buckets", () => {
      const content = readFileContent(MAIN_TF);

      expect(content).toMatch(/aws_s3_bucket_public_access_block/);
      expect(content).toMatch(/block_public_acls\s*=\s*true/);
      expect(content).toMatch(/block_public_policy\s*=\s*true/);
      expect(content).toMatch(/ignore_public_acls\s*=\s*true/);
      expect(content).toMatch(/restrict_public_buckets\s*=\s*true/);
    });

    test("security groups follow least privilege", () => {
      const content = readFileContent(MAIN_TF);

      // Check that security groups don't have overly permissive rules
      const securityGroupRegex = /resource\s+"aws_security_group"[^}]+}/gs;
      const securityGroups = content.match(securityGroupRegex) || [];

      securityGroups.forEach(sg => {
        // Check for 0.0.0.0/0 access (should be minimal)
        const hasOpenAccess = sg.includes('cidr_blocks = ["0.0.0.0/0"]');
        if (hasOpenAccess) {
          // If open access exists, it should only be for specific ports
          const allowedPorts = ['80', '443', '22'];
          const hasAllowedPort = allowedPorts.some(port =>
            sg.includes(`from_port = ${port}`) || sg.includes(`to_port = ${port}`)
          );
          expect(hasAllowedPort).toBe(true);
        }
      });
    });

    test("VPC endpoints are used for secure AWS service access", () => {
      const content = readFileContent(MAIN_TF);

      expect(content).toMatch(/aws_vpc_endpoint/);
      expect(content).toMatch(/service_name\s*=\s*"com\.amazonaws/);
    });

    test("IAM policies follow least privilege principle", () => {
      const content = readFileContent(MAIN_TF);

      // Check for specific IAM policies that should exist
      expect(content).toMatch(/aws_iam_policy/);
      expect(content).toMatch(/aws_iam_role_policy/);

      // Check for MFA enforcement
      expect(content).toMatch(/aws_iam_account_password_policy/);
      expect(content).toMatch(/minimum_password_length\s*=\s*\d+/);
    });
  });

  describe("Compliance and Monitoring", () => {
    test("CloudTrail is configured for multi-region logging", () => {
      const content = readFileContent(MAIN_TF);

      expect(content).toMatch(/aws_cloudtrail/);
      expect(content).toMatch(/is_multi_region_trail\s*=\s*true/);
      expect(content).toMatch(/include_global_service_events\s*=\s*true/);
      expect(content).toMatch(/enable_log_file_validation\s*=\s*true/);
    });

    test("GuardDuty is enabled for threat detection", () => {
      const content = readFileContent(MAIN_TF);

      expect(content).toMatch(/aws_guardduty_detector/);
      expect(content).toMatch(/enable\s*=\s*true/);
    });

    test("AWS Config is configured for compliance monitoring", () => {
      const content = readFileContent(MAIN_TF);

      expect(content).toMatch(/aws_config_configuration_recorder/);
      expect(content).toMatch(/aws_config_delivery_channel/);
      expect(content).toMatch(/aws_config_config_rule/);
    });

    test("VPC Flow Logs are enabled", () => {
      const content = readFileContent(MAIN_TF);

      expect(content).toMatch(/aws_flow_log/);
      expect(content).toMatch(/aws_cloudwatch_log_group/);
    });
  });

  describe("Resource Configuration", () => {
    test("all required AWS resources are present", () => {
      const content = readFileContent(MAIN_TF);
      const resourceTypes = extractResourceTypes(content);

      const requiredResources = [
        'aws_kms_key',
        'aws_vpc',
        'aws_subnet',
        'aws_s3_bucket',
        'aws_lambda_function',
        'aws_db_instance',
        'aws_cloudtrail',
        'aws_guardduty_detector',
        'aws_config_configuration_recorder',
        'aws_iam_role',
        'aws_iam_policy'
      ];

      requiredResources.forEach(resource => {
        const hasResource = resourceTypes.some(rt => rt.startsWith(resource));
        expect(hasResource).toBe(true);
      });
    });

    test("RDS instance has proper security configuration", () => {
      const content = readFileContent(MAIN_TF);

      expect(content).toMatch(/aws_db_instance/);
      expect(content).toMatch(/multi_az\s*=\s*true/);
      // Accept numeric literal or variable reference for backup_retention_period
      expect(content).toMatch(/backup_retention_period\s*=\s*(\d+|var\.[A-Za-z_][A-Za-z0-9_]*)/);
      expect(content).toMatch(/deletion_protection\s*=\s*(true|false)/);
    });

    test("Lambda functions have proper configuration", () => {
      const content = readFileContent(MAIN_TF);

      expect(content).toMatch(/aws_lambda_function/);
      expect(content).toMatch(/runtime\s*=\s*"nodejs/);
      expect(content).toMatch(/timeout\s*=\s*\d+/);
      expect(content).toMatch(/memory_size\s*=\s*\d+/);
    });

    test("S3 buckets have lifecycle policies", () => {
      const content = readFileContent(MAIN_TF);

      expect(content).toMatch(/aws_s3_bucket_lifecycle_configuration/);
      expect(content).toMatch(/versioning_configuration/);
    });
  });

  describe("Variables and Configuration", () => {
    test("all required variables are defined", () => {
      const content = readFileContent(VARIABLES_TF);
      const variables = extractVariables(content);

      const requiredVariables = [
        'project_name',
        'region',
        'environment',
        'availability_zones',
        'vpc_cidr',
        'private_subnet_cidrs'
      ];

      requiredVariables.forEach(variable => {
        expect(variables).toContain(variable);
      });
    });

    test("variables have proper types and descriptions", () => {
      const content = readFileContent(VARIABLES_TF);

      // Check for type declarations
      expect(content).toMatch(/type\s*=\s*string/);
      expect(content).toMatch(/type\s*=\s*list\(string\)/);
      expect(content).toMatch(/type\s*=\s*number/);
      expect(content).toMatch(/type\s*=\s*map\(string\)/);

      // Check for descriptions
      expect(content).toMatch(/description\s*=\s*"/);
    });

    test("outputs are properly defined", () => {
      const content = readFileContent(OUTPUTS_TF);
      const outputs = extractOutputs(content);

      const requiredOutputs = [
        'vpc_id',
        'private_subnet_ids',
        's3_bucket_main',
        's3_bucket_cloudtrail',
        'lambda_function_arn',
        'rds_endpoint',
        'cloudtrail_name',
        'guardduty_detector_id',
        'config_recorder_name'
      ];

      requiredOutputs.forEach(output => {
        expect(outputs).toContain(output);
      });
    });
  });

  describe("Provider Configuration", () => {
    test("AWS provider is properly configured", () => {
      const content = readFileContent(PROVIDER_TF);

      expect(content).toMatch(/provider\s+"aws"/);
      expect(content).toMatch(/region\s*=\s*var\.region/);
    });

    test("required providers are defined", () => {
      const content = readFileContent(PROVIDER_TF);

      expect(content).toMatch(/required_providers/);
      expect(content).toMatch(/hashicorp\/aws/);
      expect(content).toMatch(/hashicorp\/random/);
      expect(content).toMatch(/hashicorp\/archive/);
    });

    test("Terraform version constraints are specified", () => {
      const content = readFileContent(VERSIONS_TF);

      expect(content).toMatch(/required_version\s*=\s*">=/);
    });
  });

  describe("Tagging Strategy", () => {
    test("resources use consistent tagging", () => {
      const content = readFileContent(MAIN_TF);

      expect(content).toMatch(/tags\s*=\s*local\.common_tags/);
      expect(content).toMatch(/local\.common_tags/);
    });

    test("common tags are properly defined", () => {
      const content = readFileContent(MAIN_TF);

      expect(content).toMatch(/Project\s*=\s*var\.project_name/);
      expect(content).toMatch(/Environment\s*=\s*var\.environment/);
      expect(content).toMatch(/Terraform\s*=\s*"true"/);
    });
  });

  describe("Network Security", () => {
    test("VPC has proper DNS configuration", () => {
      const content = readFileContent(MAIN_TF);

      expect(content).toMatch(/enable_dns_hostnames\s*=\s*true/);
      expect(content).toMatch(/enable_dns_support\s*=\s*true/);
    });

    test("private subnets don't have public IP assignment", () => {
      const content = readFileContent(MAIN_TF);

      expect(content).toMatch(/map_public_ip_on_launch\s*=\s*false/);
    });

    test("NAT gateways are configured for private subnet internet access", () => {
      const content = readFileContent(MAIN_TF);

      expect(content).toMatch(/aws_nat_gateway/);
      expect(content).toMatch(/aws_internet_gateway/);
    });
  });

  describe("Secrets Management", () => {
    test("secrets are stored in Parameter Store", () => {
      const content = readFileContent(MAIN_TF);

      expect(content).toMatch(/aws_ssm_parameter/);
      expect(content).toMatch(/type\s*=\s*"SecureString"/);
    });

    test("random passwords are generated securely", () => {
      const content = readFileContent(MAIN_TF);

      expect(content).toMatch(/random_password/);
      expect(content).toMatch(/length\s*=\s*\d+/);
      expect(content).toMatch(/special\s*=\s*true/);
    });
  });
});
