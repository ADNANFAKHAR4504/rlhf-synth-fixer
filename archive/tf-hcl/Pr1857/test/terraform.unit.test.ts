// tap-stack-unit.ts
// Jest-based static unit tests for TAP Stack Terraform HCL (no provider downloads; no AWS calls)

import * as fs from "fs";
import * as path from "path";

// Prefer env var; else resolve ../lib/tap_stack.tf relative to this test file
const TF_PATH = process.env.TF_MAIN_PATH
  ? path.resolve(process.env.TF_MAIN_PATH)
  : path.resolve(__dirname, "../lib/tap_stack.tf");

// Also check vars.tf for variable definitions
const VARS_PATH = process.env.TF_VARS_PATH
  ? path.resolve(process.env.TF_VARS_PATH)
  : path.resolve(__dirname, "../lib/vars.tf");

// Helper function to extract locals block content properly handling nested braces
function extractLocalsBlock(hcl: string): string | null {
  const localsMatch = hcl.match(/locals\s*{/);
  if (!localsMatch) return null;
  
  const localsStart = localsMatch.index!;
  const openBraceIndex = hcl.indexOf('{', localsStart);
  if (openBraceIndex === -1) return null;
  
  let braceCount = 1;
  let currentIndex = openBraceIndex + 1;
  
  while (currentIndex < hcl.length && braceCount > 0) {
    const char = hcl[currentIndex];
    if (char === '{') {
      braceCount++;
    } else if (char === '}') {
      braceCount--;
    }
    currentIndex++;
  }
  
  if (braceCount === 0) {
    return hcl.substring(openBraceIndex + 1, currentIndex - 1);
  }
  
  return null;
}

describe("TAP Stack Multi-Account Infrastructure (static checks)", () => {
  let hcl: string;
  let varsHcl: string;

  beforeAll(() => {
    const exists = fs.existsSync(TF_PATH);
    if (!exists) {
      throw new Error(`Terraform file not found at ${TF_PATH}`);
    }
    hcl = fs.readFileSync(TF_PATH, "utf8");

    // Read vars.tf if it exists
    if (fs.existsSync(VARS_PATH)) {
      varsHcl = fs.readFileSync(VARS_PATH, "utf8");
    } else {
      varsHcl = "";
    }
  });

  test("validates common_tags local with required tags", () => {
    const localsBlock = extractLocalsBlock(varsHcl);
    
    expect(localsBlock).toBeTruthy();
    
    // Check for required tag fields
    expect(localsBlock!).toMatch(/common_tags\s*=\s*{[\s\S]*?}/);
    expect(localsBlock!).toMatch(/Project\s*=\s*"multi-account-awsprofile-infrastructure"/);
    expect(localsBlock!).toMatch(/ManagedBy\s*=\s*"terraform"/);
    expect(localsBlock!).toMatch(/CostCenter\s*=\s*"engineering"/);
    expect(localsBlock!).toMatch(/Owner\s*=\s*"platform-team"/);
  });

  test("validates aws_profile local with environment mappings", () => {
    const localsBlock = extractLocalsBlock(varsHcl);
    
    expect(localsBlock).toBeTruthy();
    
    // Check for aws_profile mappings
    expect(localsBlock!).toMatch(/aws_profile\s*=\s*{[\s\S]*?}/);
    expect(localsBlock!).toMatch(/default\s*=\s*"default"/);
    expect(localsBlock!).toMatch(/staging\s*=\s*"staging"/);
    expect(localsBlock!).toMatch(/production\s*=\s*"prod"/);
  });

  test("validates terraform workspace reference", () => {
    const localsBlock = extractLocalsBlock(varsHcl);
    
    expect(localsBlock).toBeTruthy();
    expect(localsBlock!).toMatch(/env\s*=\s*terraform\.workspace/);
  });

  test("defines networking_module with correct source and inputs", () => {
    const networkingModule = hcl.match(
      new RegExp(
        String.raw`module\s+"networking_module"\s*{([\s\S]*?)}`,
        "m"
      )
    )?.[0];

    expect(networkingModule).toBeTruthy();
    
    // Check source path
    expect(networkingModule!).toMatch(
      new RegExp(String.raw`source\s*=\s*"\.\/modules\/networking_module"`, "m")
    );

    // Check required inputs
    expect(networkingModule!).toMatch(/environment\s*=\s*var\.environment/);
    expect(networkingModule!).toMatch(/vpc_cidr\s*=\s*var\.vpc_cidr/);
    expect(networkingModule!).toMatch(/public_subnet_cidrs\s*=\s*var\.public_subnet_cidrs/);
    expect(networkingModule!).toMatch(/private_subnet_cidrs\s*=\s*var\.private_subnet_cidrs/);
    expect(networkingModule!).toMatch(/tags\s*=\s*local\.common_tags/);
  });

  test("defines security_module with correct inputs and dependencies", () => {
    const securityModule = hcl.match(
      new RegExp(
        String.raw`module\s+"security_module"\s*{([\s\S]*?)}`,
        "m"
      )
    )?.[0];

    expect(securityModule).toBeTruthy();
    
    // Check source path
    expect(securityModule!).toMatch(
      new RegExp(String.raw`source\s*=\s*"\.\/modules\/security_module"`, "m")
    );

    // Check inputs
    expect(securityModule!).toMatch(/environment\s*=\s*var\.environment/);
    expect(securityModule!).toMatch(/vpc_id\s*=\s*module\.networking_module\.vpc_id/);
    expect(securityModule!).toMatch(/vpc_cidr_block\s*=\s*var\.vpc_cidr/);
    expect(securityModule!).toMatch(/tags\s*=\s*local\.common_tags/);

    // Check explicit dependency
    expect(securityModule!).toMatch(
      new RegExp(String.raw`depends_on\s*=\s*\[\s*module\.networking_module\s*\]`, "m")
    );
  });

  test("defines compute_module with correct inputs and dependencies", () => {
    const computeModule = hcl.match(
      new RegExp(
        String.raw`module\s+"compute_module"\s*{([\s\S]*?)}`,
        "m"
      )
    )?.[0];

    expect(computeModule).toBeTruthy();
    
    // Check source path
    expect(computeModule!).toMatch(
      new RegExp(String.raw`source\s*=\s*"\.\/modules\/compute_module"`, "m")
    );

    // Check inputs from variables
    expect(computeModule!).toMatch(/environment\s*=\s*var\.environment/);
    expect(computeModule!).toMatch(/instance_type\s*=\s*var\.instance_type/);
    expect(computeModule!).toMatch(/min_size\s*=\s*var\.min_size/);
    expect(computeModule!).toMatch(/max_size\s*=\s*var\.max_size/);
    expect(computeModule!).toMatch(/desired_capacity\s*=\s*var\.desired_capacity/);
    expect(computeModule!).toMatch(/tags\s*=\s*local\.common_tags/);

    // Check inputs from networking module
    expect(computeModule!).toMatch(/private_subnet_ids\s*=\s*module\.networking_module\.private_subnet_ids/);
    expect(computeModule!).toMatch(/public_subnet_ids\s*=\s*module\.networking_module\.public_subnet_ids/);
    expect(computeModule!).toMatch(/vpc_id\s*=\s*module\.networking_module\.vpc_id/);

    // Check inputs from security module
    expect(computeModule!).toMatch(/security_group_id\s*=\s*module\.security_module\.uniform_security_group_id/);
    expect(computeModule!).toMatch(/instance_profile_name\s*=\s*module\.security_module\.ec2_instance_profile_name/);
    expect(computeModule!).toMatch(/kms_key_id\s*=\s*module\.security_module\.kms_key_id/);
    expect(computeModule!).toMatch(/alb_security_group_id\s*=\s*module\.security_module\.alb_security_group_id/);

    // Check explicit dependencies
    expect(computeModule!).toMatch(
      new RegExp(String.raw`depends_on\s*=\s*\[\s*module\.networking_module,\s*module\.security_module\s*\]`, "m")
    );
  });

  test("defines all required outputs", () => {
    // Check load balancer domain output
    const lbDomainOutput = hcl.match(
      new RegExp(
        String.raw`output\s+"lb_domain_name"\s*{[\s\S]*?}`,
        "m"
      )
    )?.[0];

    expect(lbDomainOutput).toBeTruthy();
    expect(lbDomainOutput!).toMatch(/value\s*=\s*module\.compute_module\.lb_domain_name/);

    // Check S3 policy ARN output
    const s3PolicyOutput = hcl.match(
      new RegExp(
        String.raw`output\s+"s3_policy_arn"\s*{[\s\S]*?}`,
        "m"
      )
    )?.[0];

    expect(s3PolicyOutput).toBeTruthy();
    expect(s3PolicyOutput!).toMatch(/description\s*=\s*"ARN of the S3 limited access policy"/);
    expect(s3PolicyOutput!).toMatch(/value\s*=\s*module\.security_module\.s3_policy_arn/);

    // Check KMS policy ARN output
    const kmsPolicyOutput = hcl.match(
      new RegExp(
        String.raw`output\s+"kms_policy_arn"\s*{[\s\S]*?}`,
        "m"
      )
    )?.[0];

    expect(kmsPolicyOutput).toBeTruthy();
    expect(kmsPolicyOutput!).toMatch(/description\s*=\s*"ARN of the KMS limited access policy"/);
    expect(kmsPolicyOutput!).toMatch(/value\s*=\s*module\.security_module\.kms_policy_arn/);

    // Check uniform security group output
    const sgOutput = hcl.match(
      new RegExp(
        String.raw`output\s+"uniform_security_group_id"\s*{[\s\S]*?}`,
        "m"
      )
    )?.[0];

    expect(sgOutput).toBeTruthy();
    expect(sgOutput!).toMatch(/description\s*=\s*"ID of the uniform security group for EC2 instances"/);
    expect(sgOutput!).toMatch(/value\s*=\s*module\.security_module\.uniform_security_group_id/);
  });

  test("validates proper dependency chain order", () => {
    // Find positions of each module in the file
    const networkingModulePos = hcl.search(/module\s+"networking_module"/);
    const securityModulePos = hcl.search(/module\s+"security_module"/);
    const computeModulePos = hcl.search(/module\s+"compute_module"/);

    // Verify modules are defined in dependency order
    expect(networkingModulePos).toBeLessThan(securityModulePos);
    expect(securityModulePos).toBeLessThan(computeModulePos);
  });

  test("validates all modules use relative path sources", () => {
    const moduleBlocks = hcl.match(/module\s+"[^"]+"\s*{[^}]+}/g) || [];
    
    expect(moduleBlocks).toHaveLength(3); // networking_module, security_module, compute_module
    
    moduleBlocks.forEach(moduleBlock => {
      expect(moduleBlock).toMatch(/source\s*=\s*"\.\/modules\/[^"]+"/);
      // Ensure no absolute paths or external sources
      expect(moduleBlock).not.toMatch(/source\s*=\s*"(?!\.\/)/);
    });
  });

  test("validates module naming consistency", () => {
    const expectedModules = [
      "networking_module",
      "security_module", 
      "compute_module"
    ];

    expectedModules.forEach(moduleName => {
      expect(hcl).toMatch(
        new RegExp(String.raw`module\s+"${moduleName}"\s*{`, "m")
      );
    });
  });

  test("ensures proper variable usage in modules", () => {
    // Check that variables are properly referenced
    const expectedVarRefs = [
      "var.environment",
      "var.vpc_cidr",
      "var.public_subnet_cidrs",
      "var.private_subnet_cidrs",
      "var.instance_type",
      "var.min_size",
      "var.max_size",
      "var.desired_capacity"
    ];

    expectedVarRefs.forEach(varRef => {
      expect(hcl).toMatch(new RegExp(varRef.replace(/\./g, "\\.")));
    });
  });

  test("validates local value references", () => {
    // Check that local values are properly referenced
    const expectedLocalRefs = [
      "local.common_tags"
    ];

    expectedLocalRefs.forEach(localRef => {
      expect(hcl).toMatch(new RegExp(localRef.replace(/\./g, "\\.")));
    });
  });

  test("ensures proper module output references", () => {
    // Check that modules reference expected outputs from other modules
    const expectedOutputRefs = [
      "module.networking_module.vpc_id",
      "module.networking_module.private_subnet_ids",
      "module.networking_module.public_subnet_ids",
      "module.security_module.uniform_security_group_id",
      "module.security_module.ec2_instance_profile_name",
      "module.security_module.kms_key_id",
      "module.security_module.alb_security_group_id",
      "module.security_module.s3_policy_arn",
      "module.security_module.kms_policy_arn",
      "module.compute_module.lb_domain_name"
    ];

    expectedOutputRefs.forEach(outputRef => {
      expect(hcl).toMatch(new RegExp(outputRef.replace(/\./g, "\\.")));
    });
  });

  test("validates explicit dependencies are correctly defined", () => {
    // Check that each module has correct depends_on declarations
    const securityModule = hcl.match(/module\s+"security_module"\s*{[\s\S]*?}/m)?.[0];
    const computeModule = hcl.match(/module\s+"compute_module"\s*{[\s\S]*?}/m)?.[0];

    expect(securityModule).toMatch(/depends_on\s*=\s*\[\s*module\.networking_module\s*\]/);
    expect(computeModule).toMatch(/depends_on\s*=\s*\[\s*module\.networking_module,\s*module\.security_module\s*\]/);
  });

  test("validates variable definitions in vars.tf", () => {
    // Check for required variables
    const expectedVariables = [
      "aws_region",
      "environment",
      "min_size",
      "vpc_cidr",
      "public_subnet_cidrs",
      "private_subnet_cidrs",
      "instance_type",
      "max_size",
      "desired_capacity"
    ];

    expectedVariables.forEach(varName => {
      expect(varsHcl).toMatch(
        new RegExp(String.raw`variable\s+"${varName}"\s*{`, "m")
      );
    });
  });

  test("validates variable default values", () => {
    // Check specific default values
    expect(varsHcl).toMatch(/aws_region[^}]*default\s*=\s*"us-east-1"/);
    expect(varsHcl).toMatch(/environment[^}]*default\s*=\s*"default"/);
    expect(varsHcl).toMatch(/min_size[^}]*default\s*=\s*1/);
    expect(varsHcl).toMatch(/vpc_cidr[^}]*default\s*=\s*"10\.0\.0\.0\/16"/);
    expect(varsHcl).toMatch(/instance_type[^}]*default\s*=\s*"t3\.micro"/);
    expect(varsHcl).toMatch(/max_size[^}]*default\s*=\s*2/);
    expect(varsHcl).toMatch(/desired_capacity[^}]*default\s*=\s*1/);
  });

  test("validates subnet CIDR defaults", () => {
    // Check public subnet CIDRs
    expect(varsHcl).toMatch(/public_subnet_cidrs[^}]*default\s*=\s*\[\s*"10\.0\.1\.0\/24",\s*"10\.0\.2\.0\/24"\s*\]/);
    
    // Check private subnet CIDRs
    expect(varsHcl).toMatch(/private_subnet_cidrs[^}]*default\s*=\s*\[\s*"10\.0\.10\.0\/24",\s*"10\.0\.20\.0\/24"\s*\]/);
  });

  test("validates variable types", () => {
    // Check that numeric variables have proper type declarations
    expect(varsHcl).toMatch(/min_size[^}]*type\s*=\s*number/);
    expect(varsHcl).toMatch(/max_size[^}]*type\s*=\s*number/);
    expect(varsHcl).toMatch(/desired_capacity[^}]*type\s*=\s*number/);
    
    // Check that string variables have proper type declarations
    expect(varsHcl).toMatch(/aws_region[^}]*type\s*=\s*string/);
    expect(varsHcl).toMatch(/vpc_cidr[^}]*type\s*=\s*string/);
    
    // Check that list variables have proper type declarations
    expect(varsHcl).toMatch(/public_subnet_cidrs[^}]*type\s*=\s*list\(string\)/);
    expect(varsHcl).toMatch(/private_subnet_cidrs[^}]*type\s*=\s*list\(string\)/);
  });

  test("ensures all outputs have descriptions", () => {
    const outputsWithDescriptions = [
      "s3_policy_arn",
      "kms_policy_arn", 
      "uniform_security_group_id"
    ];

    outputsWithDescriptions.forEach(outputName => {
      const outputBlock = hcl.match(
        new RegExp(String.raw`output\s+"${outputName}"\s*{[\s\S]*?}`, "m")
      )?.[0];
      
      expect(outputBlock).toBeTruthy();
      expect(outputBlock!).toMatch(/description\s*=\s*"[^"]+"/);
    });
  });

  test("validates scaling configuration consistency", () => {
    // Ensure min_size <= desired_capacity <= max_size in defaults
    const minSizeMatch = varsHcl.match(/min_size[^}]*default\s*=\s*(\d+)/);
    const maxSizeMatch = varsHcl.match(/max_size[^}]*default\s*=\s*(\d+)/);
    const desiredCapacityMatch = varsHcl.match(/desired_capacity[^}]*default\s*=\s*(\d+)/);

    if (minSizeMatch && maxSizeMatch && desiredCapacityMatch) {
      const minSize = parseInt(minSizeMatch[1]);
      const maxSize = parseInt(maxSizeMatch[1]);
      const desiredCapacity = parseInt(desiredCapacityMatch[1]);

      expect(minSize).toBeLessThanOrEqual(desiredCapacity);
      expect(desiredCapacity).toBeLessThanOrEqual(maxSize);
    }
  });

  // NOTE: If the endpoint is reachable in production, this validates that the following 
  // infrastructure components are properly configured and working together:
  // - Networking Module: VPC, subnets, internet gateway, NAT gateways, route tables
  // - Security Module: Security groups, IAM roles/policies, KMS encryption, S3 bucket policies  
  // - Compute Module: Auto Scaling Groups, Launch Templates, Application Load Balancer, Target Groups
  // A successful endpoint response indicates end-to-end infrastructure connectivity and security
});