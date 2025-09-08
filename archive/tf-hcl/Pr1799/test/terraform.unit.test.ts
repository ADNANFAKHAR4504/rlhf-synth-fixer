// Unit tests for Terraform infrastructure
// Tests the structure, presence, and configuration of Terraform files

import fs from "fs";
import path from "path";
// import * as HCL from "hcl2-parser";

const libPath = path.resolve(__dirname, "../lib");

// Helper function to read and parse HCL files
function readHCLFile(filePath: string): any {
  try {
    const content = fs.readFileSync(filePath, "utf8");
    return content;
  } catch (error) {
    return null;
  }
}

// Helper function to check if a file exists
function fileExists(filePath: string): boolean {
  return fs.existsSync(filePath);
}

// Helper to extract resource names from HCL
function getResourceNames(hclObject: any, resourceType: string): string[] {
  const names: string[] = [];
  if (hclObject && hclObject[0] && hclObject[0].resource) {
    const resources = hclObject[0].resource;
    for (const resource of resources) {
      if (resource[resourceType]) {
        names.push(...Object.keys(resource[resourceType]));
      }
    }
  }
  return names;
}

describe("Terraform Infrastructure Structure", () => {
  describe("Root Module Files", () => {
    test("provider.tf exists and configures AWS provider", () => {
      const providerPath = path.join(libPath, "provider.tf");
      expect(fileExists(providerPath)).toBe(true);
      
      const content = fs.readFileSync(providerPath, "utf8");
      expect(content).toMatch(/provider\s+"aws"/);
      expect(content).toMatch(/backend\s+"s3"/);
      expect(content).toMatch(/required_version\s*=\s*">=\s*1\.4\.0"/);
    });

    test("tap_stack.tf exists and defines core infrastructure", () => {
      const tapStackPath = path.join(libPath, "tap_stack.tf");
      expect(fileExists(tapStackPath)).toBe(true);
      
      const hcl = readHCLFile(tapStackPath);
      expect(hcl).not.toBeNull();
      
      const content = fs.readFileSync(tapStackPath, "utf8");
      // Check for KMS key
      expect(content).toMatch(/resource\s+"aws_kms_key"\s+"main"/);
      expect(content).toMatch(/resource\s+"aws_kms_alias"\s+"main"/);
      
      // Check for networking resources (no modules)
      expect(content).toMatch(/resource\s+"aws_vpc"\s+"main"/);
      expect(content).toMatch(/resource\s+"aws_internet_gateway"\s+"main"/);
      expect(content).toMatch(/resource\s+"aws_subnet"\s+"public"/);
      expect(content).toMatch(/resource\s+"aws_subnet"\s+"private"/);
      
      // Check for security groups
      expect(content).toMatch(/resource\s+"aws_security_group"\s+"web"/);
      expect(content).toMatch(/resource\s+"aws_security_group"\s+"database"/);
      
      // Check for S3 buckets
      expect(content).toMatch(/resource\s+"aws_s3_bucket"\s+"app_data"/);
      expect(content).toMatch(/resource\s+"aws_s3_bucket"\s+"logs"/);
      expect(content).toMatch(/resource\s+"aws_s3_bucket"\s+"backups"/);
      
      // Check for IAM resources
      expect(content).toMatch(/resource\s+"aws_iam_role"\s+"ec2_role"/);
      expect(content).toMatch(/resource\s+"aws_iam_role"\s+"lambda_role"/);
    });

    test("tap_stack.tf exists and defines required variables", () => {
      const varsPath = path.join(libPath, "tap_stack.tf");
      expect(fileExists(varsPath)).toBe(true);
      
      const content = fs.readFileSync(varsPath, "utf8");
      // Check for essential variables
      expect(content).toMatch(/variable\s+"aws_region"/);
      expect(content).toMatch(/variable\s+"environment_suffix"/);
      expect(content).toMatch(/variable\s+"project_name"/);
      expect(content).toMatch(/variable\s+"vpc_cidr"/);
      expect(content).toMatch(/variable\s+"public_subnet_cidrs"/);
      expect(content).toMatch(/variable\s+"private_subnet_cidrs"/);
      expect(content).toMatch(/variable\s+"trusted_ip_range"/);
    });

    test("tap_stack.tf exists and exports infrastructure values", () => {
      const outputsPath = path.join(libPath, "tap_stack.tf");
      expect(fileExists(outputsPath)).toBe(true);
      
      const content = fs.readFileSync(outputsPath, "utf8");
      // Check for essential outputs
      expect(content).toMatch(/output\s+"vpc_id"/);
      expect(content).toMatch(/output\s+"public_subnet_ids"/);
      expect(content).toMatch(/output\s+"private_subnet_ids"/);
      expect(content).toMatch(/output\s+"nat_gateway_id"/);
      expect(content).toMatch(/output\s+"s3_bucket_names"/);
      expect(content).toMatch(/output\s+"kms_key_id"/);
      expect(content).toMatch(/output\s+"security_group_ids"/);
      expect(content).toMatch(/output\s+"iam_role_arns"/);
    });

    test("uses environment suffix in resource naming", () => {
      const tapStackPath = path.join(libPath, "tap_stack.tf");
      const content = fs.readFileSync(tapStackPath, "utf8");
      
      // Check for local variable using environment suffix
      expect(content).toMatch(/name_prefix\s*=.*environment_suffix/);
      expect(content).toMatch(/\$\{local\.name_prefix\}/);
    });
  });

  describe("Networking Resources", () => {
    test("VPC and networking resources are properly configured", () => {
      const tapStackPath = path.join(libPath, "tap_stack.tf");
      const content = fs.readFileSync(tapStackPath, "utf8");
      
      // Check for VPC resources
      expect(content).toMatch(/resource\s+"aws_vpc"\s+"main"/);
      expect(content).toMatch(/resource\s+"aws_internet_gateway"\s+"main"/);
      expect(content).toMatch(/resource\s+"aws_subnet"\s+"public"/);
      expect(content).toMatch(/resource\s+"aws_subnet"\s+"private"/);
      expect(content).toMatch(/resource\s+"aws_nat_gateway"\s+"main"/);
      expect(content).toMatch(/resource\s+"aws_eip"\s+"nat"/);
      expect(content).toMatch(/resource\s+"aws_route_table"\s+"public"/);
      expect(content).toMatch(/resource\s+"aws_route_table"\s+"private"/);
      
      // Check for VPC flow logs
      expect(content).toMatch(/resource\s+"aws_flow_log"\s+"vpc"/);
      expect(content).toMatch(/resource\s+"aws_cloudwatch_log_group"\s+"vpc_flow_log"/);
    });

    test("networking resources expose required values in outputs", () => {
      const outputsPath = path.join(libPath, "tap_stack.tf");
      const content = fs.readFileSync(outputsPath, "utf8");
      
      // Check outputs reference direct resources not modules
      expect(content).toMatch(/value\s*=\s*aws_vpc\.main\.id/);
      expect(content).toMatch(/value\s*=\s*aws_subnet\.public\[\*\]\.id/);
      expect(content).toMatch(/value\s*=\s*aws_subnet\.private\[\*\]\.id/);
      expect(content).toMatch(/value\s*=\s*aws_nat_gateway\.main\.id/);
      expect(content).toMatch(/value\s*=\s*aws_eip\.nat\.public_ip/);
    });

    test("networking resources use proper tagging", () => {
      const tapStackPath = path.join(libPath, "tap_stack.tf");
      const content = fs.readFileSync(tapStackPath, "utf8");
      
      // Check that VPC uses common tags
      expect(content).toMatch(/tags\s*=\s*merge\(\s*local\.common_tags/);
      // Check that name prefix is used in tags
      expect(content).toMatch(/Name\s*=\s*"\$\{local\.name_prefix\}-/);
    });
  });

  describe("Security Groups", () => {
    test("security groups are properly configured", () => {
      const tapStackPath = path.join(libPath, "tap_stack.tf");
      const content = fs.readFileSync(tapStackPath, "utf8");
      
      // Check for security group resources
      expect(content).toMatch(/resource\s+"aws_security_group"\s+"web"/);
      expect(content).toMatch(/resource\s+"aws_security_group"\s+"database"/);
      expect(content).toMatch(/resource\s+"aws_security_group"\s+"alb"/);
      expect(content).toMatch(/resource\s+"aws_security_group"\s+"private"/);
    });

    test("security groups implement least privilege", () => {
      const tapStackPath = path.join(libPath, "tap_stack.tf");
      const content = fs.readFileSync(tapStackPath, "utf8");
      
      // Database security group should only accept from web security group
      expect(content).toMatch(/security_groups\s*=\s*\[aws_security_group\.web\.id\]/);
      
      // Check SSH access is restricted to trusted IP range
      expect(content).toMatch(/cidr_blocks\s*=\s*\[var\.trusted_ip_range\]/);
    });

    test("security group outputs expose security group IDs", () => {
      const outputsPath = path.join(libPath, "tap_stack.tf");
      const content = fs.readFileSync(outputsPath, "utf8");
      
      // Check outputs reference direct resources
      expect(content).toMatch(/web\s*=\s*aws_security_group\.web\.id/);
      expect(content).toMatch(/database\s*=\s*aws_security_group\.database\.id/);
      expect(content).toMatch(/alb\s*=\s*aws_security_group\.alb\.id/);
      expect(content).toMatch(/private\s*=\s*aws_security_group\.private\.id/);
    });
  });

  describe("S3 Storage", () => {
    test("S3 buckets are created with encryption", () => {
      const tapStackPath = path.join(libPath, "tap_stack.tf");
      const content = fs.readFileSync(tapStackPath, "utf8");
      
      // Check for S3 bucket resources
      expect(content).toMatch(/resource\s+"aws_s3_bucket"\s+"app_data"/);
      expect(content).toMatch(/resource\s+"aws_s3_bucket"\s+"logs"/);
      expect(content).toMatch(/resource\s+"aws_s3_bucket"\s+"backups"/);
      
      // Check for encryption configuration
      expect(content).toMatch(/resource\s+"aws_s3_bucket_server_side_encryption_configuration"/);
      expect(content).toMatch(/kms_master_key_id\s*=\s*aws_kms_key\.main\.id/);
      expect(content).toMatch(/sse_algorithm\s*=\s*"aws:kms"/);
    });

    test("S3 buckets block public access", () => {
      const tapStackPath = path.join(libPath, "tap_stack.tf");
      const content = fs.readFileSync(tapStackPath, "utf8");
      
      // Check public access blocking
      expect(content).toMatch(/resource\s+"aws_s3_bucket_public_access_block"/);
      expect(content).toMatch(/block_public_acls\s*=\s*true/);
      expect(content).toMatch(/block_public_policy\s*=\s*true/);
      expect(content).toMatch(/ignore_public_acls\s*=\s*true/);
      expect(content).toMatch(/restrict_public_buckets\s*=\s*true/);
    });

    test("S3 buckets have lifecycle policies", () => {
      const tapStackPath = path.join(libPath, "tap_stack.tf");
      const content = fs.readFileSync(tapStackPath, "utf8");
      
      // Check lifecycle configuration
      expect(content).toMatch(/resource\s+"aws_s3_bucket_lifecycle_configuration"/);
      expect(content).toMatch(/storage_class\s*=\s*"STANDARD_IA"/);
      expect(content).toMatch(/storage_class\s*=\s*"GLACIER"/);
    });

    test("storage outputs expose bucket information", () => {
      const outputsPath = path.join(libPath, "tap_stack.tf");
      const content = fs.readFileSync(outputsPath, "utf8");
      
      // Check bucket outputs reference direct resources
      expect(content).toMatch(/app_data\s*=\s*aws_s3_bucket\.app_data\.bucket/);
      expect(content).toMatch(/logs\s*=\s*aws_s3_bucket\.logs\.bucket/);
      expect(content).toMatch(/backups\s*=\s*aws_s3_bucket\.backups\.bucket/);
    });
  });

  describe("IAM Roles and Policies", () => {
    test("IAM roles and policies are created", () => {
      const tapStackPath = path.join(libPath, "tap_stack.tf");
      const content = fs.readFileSync(tapStackPath, "utf8");
      
      // Check for IAM resources
      expect(content).toMatch(/resource\s+"aws_iam_role"\s+"ec2_role"/);
      expect(content).toMatch(/resource\s+"aws_iam_role"\s+"lambda_role"/);
      expect(content).toMatch(/resource\s+"aws_iam_policy"\s+"s3_access"/);
      expect(content).toMatch(/resource\s+"aws_iam_policy"\s+"cloudwatch_logs"/);
      expect(content).toMatch(/resource\s+"aws_iam_policy"\s+"ssm_access"/);
      expect(content).toMatch(/resource\s+"aws_iam_instance_profile"\s+"ec2_profile"/);
    });

    test("IAM policies follow least privilege principle", () => {
      const tapStackPath = path.join(libPath, "tap_stack.tf");
      const content = fs.readFileSync(tapStackPath, "utf8");
      
      // Check S3 policy only allows specific actions
      expect(content).toMatch(/"s3:GetObject"/);
      expect(content).toMatch(/"s3:PutObject"/);
      expect(content).toMatch(/"s3:DeleteObject"/);
      expect(content).toMatch(/"s3:ListBucket"/);
      
      // Check KMS permissions
      expect(content).toMatch(/"kms:Decrypt"/);
      expect(content).toMatch(/"kms:GenerateDataKey"/);
    });

    test("IAM outputs expose role information", () => {
      const outputsPath = path.join(libPath, "tap_stack.tf");
      const content = fs.readFileSync(outputsPath, "utf8");
      
      // Check role outputs reference direct resources
      expect(content).toMatch(/ec2_role\s*=\s*aws_iam_role\.ec2_role\.arn/);
      expect(content).toMatch(/lambda_role\s*=\s*aws_iam_role\.lambda_role\.arn/);
    });
  });

  describe("Terraform Best Practices", () => {
    test("resources are properly tagged", () => {
      const tapStackPath = path.join(libPath, "tap_stack.tf");
      const content = fs.readFileSync(tapStackPath, "utf8");
      
      // Check common tags are defined
      expect(content).toMatch(/common_tags\s*=\s*\{/);
      expect(content).toMatch(/Environment\s*=\s*var\.environment/);
      expect(content).toMatch(/Project\s*=\s*var\.project_name/);
      expect(content).toMatch(/ManagedBy\s*=\s*"Terraform"/);
      expect(content).toMatch(/EnvironmentSuffix\s*=\s*var\.environment_suffix/);
      
      // Check tags are merged
      expect(content).toMatch(/tags\s*=\s*merge\(/);
    });

    test("no hardcoded AWS account IDs", () => {
      const tapStackPath = path.join(libPath, "tap_stack.tf");
      const content = fs.readFileSync(tapStackPath, "utf8");
      
      // Should not contain hardcoded account IDs (12-digit numbers)
      const accountIdPattern = /[0-9]{12}/;
      expect(content).not.toMatch(accountIdPattern);
    });

    test("uses data sources for dynamic values", () => {
      const tapStackPath = path.join(libPath, "tap_stack.tf");
      const content = fs.readFileSync(tapStackPath, "utf8");
      
      // Check for data sources
      expect(content).toMatch(/data\s+"aws_availability_zones"\s+"available"/);
      expect(content).toMatch(/data\s+"aws_caller_identity"\s+"current"/);
    });
  });

  describe("Security Best Practices", () => {
    test("KMS key has rotation enabled", () => {
      const tapStackPath = path.join(libPath, "tap_stack.tf");
      const content = fs.readFileSync(tapStackPath, "utf8");
      
      expect(content).toMatch(/enable_key_rotation\s*=\s*true/);
    });

    test("S3 buckets use KMS encryption", () => {
      const tapStackPath = path.join(libPath, "tap_stack.tf");
      const content = fs.readFileSync(tapStackPath, "utf8");
      
      expect(content).toMatch(/kms_master_key_id\s*=\s*aws_kms_key\.main\.id/);
      expect(content).toMatch(/sse_algorithm\s*=\s*"aws:kms"/);
    });

    test("VPC flow logs are enabled", () => {
      const tapStackPath = path.join(libPath, "tap_stack.tf");
      const content = fs.readFileSync(tapStackPath, "utf8");
      
      expect(content).toMatch(/resource\s+"aws_flow_log"\s+"vpc"/);
      expect(content).toMatch(/traffic_type\s*=\s*"ALL"/);
    });

    test("security groups use specific CIDR blocks, not 0.0.0.0/0 for SSH", () => {
      const tapStackPath = path.join(libPath, "tap_stack.tf");
      const content = fs.readFileSync(tapStackPath, "utf8");
      
      // Extract only SSH ingress rules (more precise regex)
      const sshPattern = /ingress\s*\{[^}]*description\s*=\s*"SSH"[^}]*cidr_blocks\s*=\s*\[[^\]]*\]/g;
      const sshMatches = content.match(sshPattern);
      
      if (sshMatches) {
        sshMatches.forEach(match => {
          // Should use trusted_ip_range variable, not 0.0.0.0/0
          expect(match).toMatch(/var\.trusted_ip_range/);
          expect(match).not.toMatch(/"0\.0\.0\.0\/0"/);
        });
      }
    });

    test("database security groups restrict access to web tier only", () => {
      const tapStackPath = path.join(libPath, "tap_stack.tf");
      const content = fs.readFileSync(tapStackPath, "utf8");
      
      // Database should only accept from web security group
      expect(content).toMatch(/resource\s+"aws_security_group"\s+"database"[\s\S]*security_groups\s*=\s*\[aws_security_group\.web\.id\]/);
    });
  });

  describe("Configuration Validation", () => {
    test("AWS region is set to us-west-2 as per requirements", () => {
      const varsPath = path.join(libPath, "tap_stack.tf");
      const content = fs.readFileSync(varsPath, "utf8");
      
      // Check default region
      expect(content).toMatch(/default\s*=\s*"us-west-2"/);
    });

    test("VPC CIDR is properly configured", () => {
      const varsPath = path.join(libPath, "tap_stack.tf");
      const content = fs.readFileSync(varsPath, "utf8");
      
      // Check VPC CIDR variable exists with proper default
      expect(content).toMatch(/variable\s+"vpc_cidr"/);
      expect(content).toMatch(/default\s*=\s*"10\.0\.0\.0\/16"/);
    });

    test("subnet CIDRs are within VPC CIDR range", () => {
      const varsPath = path.join(libPath, "tap_stack.tf");
      const content = fs.readFileSync(varsPath, "utf8");
      
      // Check that subnet CIDRs start with 10.0
      expect(content).toMatch(/default\s*=\s*\[\s*"10\.0\./);
    });
  });
});