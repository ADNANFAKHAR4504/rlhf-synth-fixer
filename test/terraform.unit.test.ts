// Unit tests for Terraform infrastructure
// Tests the structure, presence, and configuration of Terraform files

import fs from "fs";
import path from "path";
import * as HCL from "hcl2-parser";

const libPath = path.resolve(__dirname, "../lib");
const modulesPath = path.join(libPath, "modules");

// Helper function to read and parse HCL files
function readHCLFile(filePath: string): any {
  try {
    const content = fs.readFileSync(filePath, "utf8");
    return HCL.parseToObject(content);
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

// Helper to check module definitions
function getModuleNames(hclObject: any): string[] {
  const names: string[] = [];
  if (hclObject && hclObject[0] && hclObject[0].module) {
    const modules = hclObject[0].module;
    for (const mod of modules) {
      names.push(...Object.keys(mod));
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

    test("main.tf exists and defines core infrastructure", () => {
      const mainPath = path.join(libPath, "main.tf");
      expect(fileExists(mainPath)).toBe(true);
      
      const hcl = readHCLFile(mainPath);
      expect(hcl).not.toBeNull();
      
      const content = fs.readFileSync(mainPath, "utf8");
      // Check for KMS key
      expect(content).toMatch(/resource\s+"aws_kms_key"\s+"main"/);
      expect(content).toMatch(/resource\s+"aws_kms_alias"\s+"main"/);
      
      // Check for module calls
      expect(content).toMatch(/module\s+"networking"/);
      expect(content).toMatch(/module\s+"security"/);
      expect(content).toMatch(/module\s+"storage"/);
      expect(content).toMatch(/module\s+"iam"/);
    });

    test("variables.tf exists and defines required variables", () => {
      const varsPath = path.join(libPath, "variables.tf");
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

    test("outputs.tf exists and exports infrastructure values", () => {
      const outputsPath = path.join(libPath, "outputs.tf");
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
      const mainPath = path.join(libPath, "main.tf");
      const content = fs.readFileSync(mainPath, "utf8");
      
      // Check for local variable using environment suffix
      expect(content).toMatch(/name_prefix\s*=.*environment_suffix/);
      expect(content).toMatch(/\$\{local\.name_prefix\}/);
    });
  });

  describe("Networking Module", () => {
    const networkingPath = path.join(modulesPath, "networking");

    test("networking module structure is complete", () => {
      expect(fileExists(path.join(networkingPath, "main.tf"))).toBe(true);
      expect(fileExists(path.join(networkingPath, "variables.tf"))).toBe(true);
      expect(fileExists(path.join(networkingPath, "outputs.tf"))).toBe(true);
    });

    test("networking main.tf creates VPC resources", () => {
      const mainPath = path.join(networkingPath, "main.tf");
      const content = fs.readFileSync(mainPath, "utf8");
      
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

    test("networking outputs expose required values", () => {
      const outputsPath = path.join(networkingPath, "outputs.tf");
      const content = fs.readFileSync(outputsPath, "utf8");
      
      expect(content).toMatch(/output\s+"vpc_id"/);
      expect(content).toMatch(/output\s+"public_subnet_ids"/);
      expect(content).toMatch(/output\s+"private_subnet_ids"/);
      expect(content).toMatch(/output\s+"nat_gateway_id"/);
      expect(content).toMatch(/output\s+"nat_gateway_public_ip"/);
    });

    test("networking module uses proper tagging", () => {
      const mainPath = path.join(networkingPath, "main.tf");
      const content = fs.readFileSync(mainPath, "utf8");
      
      // Check for tag merging with common tags
      expect(content).toMatch(/tags\s*=\s*merge/);
      expect(content).toMatch(/var\.common_tags/);
    });
  });

  describe("Security Module", () => {
    const securityPath = path.join(modulesPath, "security");

    test("security module structure is complete", () => {
      expect(fileExists(path.join(securityPath, "main.tf"))).toBe(true);
      expect(fileExists(path.join(securityPath, "variables.tf"))).toBe(true);
      expect(fileExists(path.join(securityPath, "outputs.tf"))).toBe(true);
    });

    test("security main.tf creates security groups", () => {
      const mainPath = path.join(securityPath, "main.tf");
      const content = fs.readFileSync(mainPath, "utf8");
      
      // Check for security groups
      expect(content).toMatch(/resource\s+"aws_security_group"\s+"web"/);
      expect(content).toMatch(/resource\s+"aws_security_group"\s+"database"/);
      expect(content).toMatch(/resource\s+"aws_security_group"\s+"alb"/);
      expect(content).toMatch(/resource\s+"aws_security_group"\s+"private"/);
      
      // Check for lifecycle management
      expect(content).toMatch(/lifecycle\s*\{[\s\S]*create_before_destroy\s*=\s*true/);
    });

    test("security groups implement least privilege", () => {
      const mainPath = path.join(securityPath, "main.tf");
      const content = fs.readFileSync(mainPath, "utf8");
      
      // SSH should only be from trusted IP range
      expect(content).toMatch(/ingress[\s\S]*description\s*=\s*"SSH"[\s\S]*cidr_blocks\s*=\s*\[var\.trusted_ip_range\]/);
      
      // Database should only accept from web security group
      expect(content).toMatch(/security_groups\s*=\s*\[aws_security_group\.web\.id\]/);
    });

    test("security outputs expose security group IDs", () => {
      const outputsPath = path.join(securityPath, "outputs.tf");
      const content = fs.readFileSync(outputsPath, "utf8");
      
      expect(content).toMatch(/output\s+"security_group_ids"/);
      expect(content).toMatch(/output\s+"web_security_group_id"/);
      expect(content).toMatch(/output\s+"database_security_group_id"/);
      expect(content).toMatch(/output\s+"alb_security_group_id"/);
    });
  });

  describe("Storage Module", () => {
    const storagePath = path.join(modulesPath, "storage");

    test("storage module structure is complete", () => {
      expect(fileExists(path.join(storagePath, "main.tf"))).toBe(true);
      expect(fileExists(path.join(storagePath, "variables.tf"))).toBe(true);
      expect(fileExists(path.join(storagePath, "outputs.tf"))).toBe(true);
    });

    test("storage main.tf creates S3 buckets with encryption", () => {
      const mainPath = path.join(storagePath, "main.tf");
      const content = fs.readFileSync(mainPath, "utf8");
      
      // Check for S3 buckets
      expect(content).toMatch(/resource\s+"aws_s3_bucket"\s+"app_data"/);
      expect(content).toMatch(/resource\s+"aws_s3_bucket"\s+"logs"/);
      expect(content).toMatch(/resource\s+"aws_s3_bucket"\s+"backups"/);
      
      // Check for encryption
      expect(content).toMatch(/resource\s+"aws_s3_bucket_server_side_encryption_configuration"\s+"app_data"/);
      expect(content).toMatch(/resource\s+"aws_s3_bucket_server_side_encryption_configuration"\s+"logs"/);
      expect(content).toMatch(/resource\s+"aws_s3_bucket_server_side_encryption_configuration"\s+"backups"/);
      expect(content).toMatch(/sse_algorithm\s*=\s*"aws:kms"/);
      
      // Check for versioning
      expect(content).toMatch(/resource\s+"aws_s3_bucket_versioning"\s+"app_data"/);
      expect(content).toMatch(/resource\s+"aws_s3_bucket_versioning"\s+"logs"/);
      expect(content).toMatch(/resource\s+"aws_s3_bucket_versioning"\s+"backups"/);
    });

    test("S3 buckets block public access", () => {
      const mainPath = path.join(storagePath, "main.tf");
      const content = fs.readFileSync(mainPath, "utf8");
      
      // Check for public access blocks
      expect(content).toMatch(/resource\s+"aws_s3_bucket_public_access_block"\s+"app_data"/);
      expect(content).toMatch(/resource\s+"aws_s3_bucket_public_access_block"\s+"logs"/);
      expect(content).toMatch(/resource\s+"aws_s3_bucket_public_access_block"\s+"backups"/);
      
      // Verify all public access is blocked
      expect(content).toMatch(/block_public_acls\s*=\s*true/);
      expect(content).toMatch(/block_public_policy\s*=\s*true/);
      expect(content).toMatch(/ignore_public_acls\s*=\s*true/);
      expect(content).toMatch(/restrict_public_buckets\s*=\s*true/);
    });

    test("S3 buckets have lifecycle policies", () => {
      const mainPath = path.join(storagePath, "main.tf");
      const content = fs.readFileSync(mainPath, "utf8");
      
      // Check for lifecycle configurations
      expect(content).toMatch(/resource\s+"aws_s3_bucket_lifecycle_configuration"\s+"logs"/);
      expect(content).toMatch(/resource\s+"aws_s3_bucket_lifecycle_configuration"\s+"backups"/);
      
      // Check for transitions to cheaper storage
      expect(content).toMatch(/storage_class\s*=\s*"STANDARD_IA"/);
      expect(content).toMatch(/storage_class\s*=\s*"GLACIER"/);
    });

    test("storage outputs expose bucket information", () => {
      const outputsPath = path.join(storagePath, "outputs.tf");
      const content = fs.readFileSync(outputsPath, "utf8");
      
      expect(content).toMatch(/output\s+"bucket_names"/);
      expect(content).toMatch(/output\s+"bucket_arns"/);
      expect(content).toMatch(/output\s+"app_data_bucket_name"/);
      expect(content).toMatch(/output\s+"logs_bucket_name"/);
      expect(content).toMatch(/output\s+"backups_bucket_name"/);
    });
  });

  describe("IAM Module", () => {
    const iamPath = path.join(modulesPath, "iam");

    test("iam module structure is complete", () => {
      expect(fileExists(path.join(iamPath, "main.tf"))).toBe(true);
      expect(fileExists(path.join(iamPath, "variables.tf"))).toBe(true);
      expect(fileExists(path.join(iamPath, "outputs.tf"))).toBe(true);
    });

    test("iam main.tf creates IAM roles and policies", () => {
      const mainPath = path.join(iamPath, "main.tf");
      const content = fs.readFileSync(mainPath, "utf8");
      
      // Check for IAM roles
      expect(content).toMatch(/resource\s+"aws_iam_role"\s+"ec2_role"/);
      expect(content).toMatch(/resource\s+"aws_iam_role"\s+"lambda_role"/);
      
      // Check for IAM policies
      expect(content).toMatch(/resource\s+"aws_iam_policy"\s+"s3_access"/);
      expect(content).toMatch(/resource\s+"aws_iam_policy"\s+"cloudwatch_logs"/);
      expect(content).toMatch(/resource\s+"aws_iam_policy"\s+"ssm_access"/);
      
      // Check for instance profile
      expect(content).toMatch(/resource\s+"aws_iam_instance_profile"\s+"ec2_profile"/);
    });

    test("IAM policies follow least privilege principle", () => {
      const mainPath = path.join(iamPath, "main.tf");
      const content = fs.readFileSync(mainPath, "utf8");
      
      // S3 policy should only allow specific actions
      expect(content).toMatch(/"s3:GetObject"/);
      expect(content).toMatch(/"s3:PutObject"/);
      expect(content).toMatch(/"s3:DeleteObject"/);
      expect(content).toMatch(/"s3:ListBucket"/);
      
      // KMS policy should only allow decrypt and generate data key
      expect(content).toMatch(/"kms:Decrypt"/);
      expect(content).toMatch(/"kms:GenerateDataKey"/);
      
      // Policies should reference specific resources, not wildcards
      expect(content).toMatch(/Resource\s*=\s*var\.s3_bucket_arns/);
      expect(content).toMatch(/Resource\s*=\s*\[var\.kms_key_arn\]/);
    });

    test("iam outputs expose role information", () => {
      const outputsPath = path.join(iamPath, "outputs.tf");
      const content = fs.readFileSync(outputsPath, "utf8");
      
      expect(content).toMatch(/output\s+"role_arns"/);
      expect(content).toMatch(/output\s+"ec2_role_arn"/);
      expect(content).toMatch(/output\s+"lambda_role_arn"/);
      expect(content).toMatch(/output\s+"ec2_instance_profile_name"/);
    });
  });

  describe("Terraform Best Practices", () => {
    test("all modules use consistent variable naming", () => {
      const modules = ["networking", "security", "storage", "iam"];
      
      for (const module of modules) {
        const varsPath = path.join(modulesPath, module, "variables.tf");
        const content = fs.readFileSync(varsPath, "utf8");
        
        // Check for common variables
        expect(content).toMatch(/variable\s+"project_name"/);
        expect(content).toMatch(/variable\s+"environment"/);
        expect(content).toMatch(/variable\s+"common_tags"/);
      }
    });

    test("all resources are properly tagged", () => {
      const mainFiles = [
        path.join(libPath, "main.tf"),
        path.join(modulesPath, "networking", "main.tf"),
        path.join(modulesPath, "security", "main.tf"),
        path.join(modulesPath, "storage", "main.tf"),
        path.join(modulesPath, "iam", "main.tf"),
      ];
      
      for (const filePath of mainFiles) {
        const content = fs.readFileSync(filePath, "utf8");
        // Check that resources use tags
        expect(content).toMatch(/tags\s*=/);
      }
    });

    test("no hardcoded AWS account IDs", () => {
      const allTfFiles = [
        path.join(libPath, "main.tf"),
        path.join(libPath, "provider.tf"),
        path.join(modulesPath, "networking", "main.tf"),
        path.join(modulesPath, "security", "main.tf"),
        path.join(modulesPath, "storage", "main.tf"),
        path.join(modulesPath, "iam", "main.tf"),
      ];
      
      for (const filePath of allTfFiles) {
        const content = fs.readFileSync(filePath, "utf8");
        // Check for hardcoded AWS account IDs (12-digit numbers)
        expect(content).not.toMatch(/\b\d{12}\b/);
      }
    });

    test("uses data sources for dynamic values", () => {
      const mainPath = path.join(libPath, "main.tf");
      const content = fs.readFileSync(mainPath, "utf8");
      
      // Check for data sources
      expect(content).toMatch(/data\s+"aws_availability_zones"\s+"available"/);
      expect(content).toMatch(/data\s+"aws_caller_identity"\s+"current"/);
    });

    test("modules have clear dependency management", () => {
      const mainPath = path.join(libPath, "main.tf");
      const content = fs.readFileSync(mainPath, "utf8");
      
      // Storage module depends on KMS key
      expect(content).toMatch(/module\s+"storage"[\s\S]*depends_on\s*=\s*\[aws_kms_key\.main\]/);
      
      // IAM module receives outputs from storage
      expect(content).toMatch(/s3_bucket_arns\s*=\s*module\.storage\.bucket_arns/);
      
      // Security module receives VPC ID from networking
      expect(content).toMatch(/vpc_id\s*=\s*module\.networking\.vpc_id/);
    });
  });

  describe("Security Best Practices", () => {
    test("KMS key has rotation enabled", () => {
      const mainPath = path.join(libPath, "main.tf");
      const content = fs.readFileSync(mainPath, "utf8");
      
      expect(content).toMatch(/enable_key_rotation\s*=\s*true/);
    });

    test("S3 buckets use KMS encryption", () => {
      const storagePath = path.join(modulesPath, "storage", "main.tf");
      const content = fs.readFileSync(storagePath, "utf8");
      
      expect(content).toMatch(/kms_master_key_id\s*=\s*var\.kms_key_id/);
      expect(content).toMatch(/sse_algorithm\s*=\s*"aws:kms"/);
    });

    test("VPC flow logs are enabled", () => {
      const networkingPath = path.join(modulesPath, "networking", "main.tf");
      const content = fs.readFileSync(networkingPath, "utf8");
      
      expect(content).toMatch(/resource\s+"aws_flow_log"\s+"vpc"/);
      expect(content).toMatch(/traffic_type\s*=\s*"ALL"/);
    });

    test("security groups use specific CIDR blocks, not 0.0.0.0/0 for SSH", () => {
      const securityPath = path.join(modulesPath, "security", "main.tf");
      const content = fs.readFileSync(securityPath, "utf8");
      
      // Extract only SSH ingress rules (more precise regex)
      const sshPattern = /ingress\s*\{[^}]*description\s*=\s*"SSH"[^}]*cidr_blocks\s*=\s*\[[^\]]*\]/g;
      const sshBlocks = content.match(sshPattern);
      
      if (sshBlocks) {
        for (const block of sshBlocks) {
          // SSH should not be open to the world
          expect(block).not.toMatch(/cidr_blocks\s*=\s*\[\s*"0\.0\.0\.0\/0"/);
          // SSH should use trusted IP range variable
          expect(block).toMatch(/var\.trusted_ip_range/);
        }
      } else {
        // If no SSH rules found, fail the test
        expect(sshBlocks).not.toBeNull();
      }
    });

    test("database security groups restrict access to web tier only", () => {
      const securityPath = path.join(modulesPath, "security", "main.tf");
      const content = fs.readFileSync(securityPath, "utf8");
      
      // Database should only accept from web security group
      expect(content).toMatch(/resource\s+"aws_security_group"\s+"database"[\s\S]*security_groups\s*=\s*\[aws_security_group\.web\.id\]/);
    });
  });

  describe("Module Integration", () => {
    test("all required module outputs are consumed", () => {
      const mainPath = path.join(libPath, "main.tf");
      const outputsPath = path.join(libPath, "outputs.tf");
      const mainContent = fs.readFileSync(mainPath, "utf8");
      const outputsContent = fs.readFileSync(outputsPath, "utf8");
      
      // Check that module outputs are used in root outputs
      expect(outputsContent).toMatch(/module\.networking\.vpc_id/);
      expect(outputsContent).toMatch(/module\.networking\.public_subnet_ids/);
      expect(outputsContent).toMatch(/module\.networking\.private_subnet_ids/);
      expect(outputsContent).toMatch(/module\.storage\.bucket_names/);
      expect(outputsContent).toMatch(/module\.security\.security_group_ids/);
      expect(outputsContent).toMatch(/module\.iam\.role_arns/);
    });

    test("modules receive required inputs from other modules", () => {
      const mainPath = path.join(libPath, "main.tf");
      const content = fs.readFileSync(mainPath, "utf8");
      
      // Security module receives VPC ID from networking
      expect(content).toMatch(/module\s+"security"[\s\S]*vpc_id\s*=\s*module\.networking\.vpc_id/);
      
      // IAM module receives bucket ARNs from storage
      expect(content).toMatch(/module\s+"iam"[\s\S]*s3_bucket_arns\s*=\s*module\.storage\.bucket_arns/);
      
      // IAM module receives KMS key ARN
      expect(content).toMatch(/module\s+"iam"[\s\S]*kms_key_arn\s*=\s*aws_kms_key\.main\.arn/);
    });
  });

  describe("Configuration Validation", () => {
    test("AWS region is set to us-west-2 as per requirements", () => {
      const varsPath = path.join(libPath, "variables.tf");
      const content = fs.readFileSync(varsPath, "utf8");
      
      expect(content).toMatch(/variable\s+"aws_region"[\s\S]*default\s*=\s*"us-west-2"/);
    });

    test("VPC CIDR is properly configured", () => {
      const varsPath = path.join(libPath, "variables.tf");
      const content = fs.readFileSync(varsPath, "utf8");
      
      expect(content).toMatch(/variable\s+"vpc_cidr"[\s\S]*default\s*=\s*"10\.0\.0\.0\/16"/);
    });

    test("subnet CIDRs are within VPC CIDR range", () => {
      const varsPath = path.join(libPath, "variables.tf");
      const content = fs.readFileSync(varsPath, "utf8");
      
      // Public subnets
      expect(content).toMatch(/\["10\.0\.1\.0\/24",\s*"10\.0\.2\.0\/24"\]/);
      
      // Private subnets
      expect(content).toMatch(/\["10\.0\.10\.0\/24",\s*"10\.0\.20\.0\/24"\]/);
    });
  });
});