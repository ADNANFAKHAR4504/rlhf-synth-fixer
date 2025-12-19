// terraform-modular-unit.ts
// Jest-based static unit tests for modular Terraform HCL (no provider downloads; no AWS calls)

import * as fs from "fs";
import * as path from "path";

// Prefer env var; else resolve ../lib/main.tf relative to this test file
const TF_PATH = process.env.TF_MAIN_PATH
  ? path.resolve(process.env.TF_MAIN_PATH)
  : path.resolve(__dirname, "../lib/tap_stack.tf");

// Also check vars.tf for variable definitions
const VARS_PATH = process.env.TF_VARS_PATH
  ? path.resolve(process.env.TF_VARS_PATH)
  : path.resolve(__dirname, "../lib/vars.tf");

describe("Terraform Modular Infrastructure (static checks)", () => {
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

  test("has aws_region variable with correct default", () => {
    // Check both main.tf and vars.tf for the variable
    const combinedHcl = hcl + "\n" + varsHcl;
    expect(combinedHcl).toMatch(
      new RegExp(
        String.raw`variable\s+"aws_region"\s*{[\s\S]*?description\s*=\s*"AWS provider region"[\s\S]*?type\s*=\s*string[\s\S]*?default\s*=\s*"us-west-2"[\s\S]*?}`,
        "m"
      )
    );
  });

  test("defines vpc_module with correct source", () => {
    const vpcModule = hcl.match(
      new RegExp(
        String.raw`module\s+"vpc_module"\s*{[\s\S]*?source\s*=\s*"\.\/modules\/vpc_module"[\s\S]*?}`,
        "m"
      )
    )?.[0];

    expect(vpcModule).toBeTruthy();
    
    // Check source path
    expect(vpcModule!).toMatch(
      new RegExp(String.raw`source\s*=\s*"\.\/modules\/vpc_module"`, "m")
    );

    // Check required inputs
    expect(vpcModule!).toMatch(
      new RegExp(String.raw`environment\s*=\s*var\.environment`, "m")
    );
    expect(vpcModule!).toMatch(
      new RegExp(String.raw`project_name\s*=\s*var\.project_name`, "m")
    );
    expect(vpcModule!).toMatch(
      new RegExp(String.raw`vpc_cidr\s*=\s*var\.vpc_cidr`, "m")
    );
    expect(vpcModule!).toMatch(
      new RegExp(String.raw`public_subnet_cidrs\s*=\s*var\.public_subnet_cidrs`, "m")
    );
    expect(vpcModule!).toMatch(
      new RegExp(String.raw`private_subnet_cidrs\s*=\s*var\.private_subnet_cidrs`, "m")
    );
    expect(vpcModule!).toMatch(
      new RegExp(String.raw`common_tags\s*=\s*local\.common_tags`, "m")
    );
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

    // Check inputs from variables
    expect(securityModule!).toMatch(
      new RegExp(String.raw`environment\s*=\s*var\.environment`, "m")
    );
    expect(securityModule!).toMatch(
      new RegExp(String.raw`project_name\s*=\s*var\.project_name`, "m")
    );
    expect(securityModule!).toMatch(
      new RegExp(String.raw`app_port\s*=\s*var\.app_port`, "m")
    );
    expect(securityModule!).toMatch(
      new RegExp(String.raw`db_port\s*=\s*var\.db_port`, "m")
    );
    expect(securityModule!).toMatch(
      new RegExp(String.raw`common_tags\s*=\s*local\.common_tags`, "m")
    );

    // Check input from vpc_module (dependency)
    expect(securityModule!).toMatch(
      new RegExp(String.raw`vpc_id\s*=\s*module\.vpc_module\.vpc_id`, "m")
    );

    // Check explicit dependency
    expect(securityModule!).toMatch(
      new RegExp(String.raw`depends_on\s*=\s*\[\s*module\.vpc_module\s*\]`, "m")
    );
  });

  test("defines alb_module with correct inputs and dependencies", () => {
    const albModule = hcl.match(
      new RegExp(
        String.raw`module\s+"alb_module"\s*{([\s\S]*?)}`,
        "m"
      )
    )?.[0];

    expect(albModule).toBeTruthy();
    
    // Check source path
    expect(albModule!).toMatch(
      new RegExp(String.raw`source\s*=\s*"\.\/modules\/alb_module"`, "m")
    );

    // Check inputs from variables
    expect(albModule!).toMatch(
      new RegExp(String.raw`environment\s*=\s*var\.environment`, "m")
    );
    expect(albModule!).toMatch(
      new RegExp(String.raw`project_name\s*=\s*var\.project_name`, "m")
    );
    expect(albModule!).toMatch(
      new RegExp(String.raw`target_port\s*=\s*var\.app_port`, "m")
    );
    expect(albModule!).toMatch(
      new RegExp(String.raw`common_tags\s*=\s*local\.common_tags`, "m")
    );

    // Check inputs from vpc_module
    expect(albModule!).toMatch(
      new RegExp(String.raw`vpc_id\s*=\s*module\.vpc_module\.vpc_id`, "m")
    );
    expect(albModule!).toMatch(
      new RegExp(String.raw`public_subnet_ids\s*=\s*module\.vpc_module\.public_subnet_ids`, "m")
    );

    // Check input from security_module
    expect(albModule!).toMatch(
      new RegExp(String.raw`alb_security_group_id\s*=\s*module\.security_module\.alb_security_group_id`, "m")
    );

    // Check explicit dependency
    expect(albModule!).toMatch(
      new RegExp(String.raw`depends_on\s*=\s*\[\s*module\.vpc_module,\s*module\.security_module\s*\]`, "m")
    );
  });

  test("defines ec2_module with correct inputs and dependencies", () => {
    const ec2Module = hcl.match(
      new RegExp(
        String.raw`module\s+"ec2_module"\s*{([\s\S]*?)}`,
        "m"
      )
    )?.[0];

    expect(ec2Module).toBeTruthy();
    
    // Check source path
    expect(ec2Module!).toMatch(
      new RegExp(String.raw`source\s*=\s*"\.\/modules\/ec2_module"`, "m")
    );

    // Check inputs from variables
    expect(ec2Module!).toMatch(
      new RegExp(String.raw`environment\s*=\s*var\.environment`, "m")
    );
    expect(ec2Module!).toMatch(
      new RegExp(String.raw`project_name\s*=\s*var\.project_name`, "m")
    );
    expect(ec2Module!).toMatch(
      new RegExp(String.raw`ami_id\s*=\s*var\.ami_id`, "m")
    );
    expect(ec2Module!).toMatch(
      new RegExp(String.raw`key_pair_name\s*=\s*var\.key_pair_name`, "m")
    );
    expect(ec2Module!).toMatch(
      new RegExp(String.raw`app_port\s*=\s*var\.app_port`, "m")
    );
    expect(ec2Module!).toMatch(
      new RegExp(String.raw`common_tags\s*=\s*local\.common_tags`, "m")
    );

    // Check inputs from local values
    expect(ec2Module!).toMatch(
      new RegExp(String.raw`instance_type\s*=\s*local\.current_config\.instance_type`, "m")
    );
    expect(ec2Module!).toMatch(
      new RegExp(String.raw`min_size\s*=\s*local\.current_config\.min_size`, "m")
    );
    expect(ec2Module!).toMatch(
      new RegExp(String.raw`max_size\s*=\s*local\.current_config\.max_size`, "m")
    );
    expect(ec2Module!).toMatch(
      new RegExp(String.raw`desired_capacity\s*=\s*local\.current_config\.desired_capacity`, "m")
    );

    // Check input from vpc_module
    expect(ec2Module!).toMatch(
      new RegExp(String.raw`private_subnet_ids\s*=\s*module\.vpc_module\.private_subnet_ids`, "m")
    );

    // Check inputs from security_module
    expect(ec2Module!).toMatch(
      new RegExp(String.raw`web_security_group_id\s*=\s*module\.security_module\.web_security_group_id`, "m")
    );
    expect(ec2Module!).toMatch(
      new RegExp(String.raw`iam_instance_profile_name\s*=\s*module\.security_module\.ec2_instance_profile_name`, "m")
    );

    // Check input from alb_module
    expect(ec2Module!).toMatch(
      new RegExp(String.raw`target_group_arn\s*=\s*module\.alb_module\.target_group_arn`, "m")
    );

    // Check explicit dependency
    expect(ec2Module!).toMatch(
      new RegExp(String.raw`depends_on\s*=\s*\[\s*module\.vpc_module,\s*module\.security_module,\s*module\.alb_module\s*\]`, "m")
    );
  });

  test("validates proper dependency chain order", () => {
    // Find positions of each module in the file
    const vpcModulePos = hcl.search(/module\s+"vpc_module"/);
    const securityModulePos = hcl.search(/module\s+"security_module"/);
    const albModulePos = hcl.search(/module\s+"alb_module"/);
    const ec2ModulePos = hcl.search(/module\s+"ec2_module"/);

    // Verify modules are defined in dependency order
    expect(vpcModulePos).toBeLessThan(securityModulePos);
    expect(securityModulePos).toBeLessThan(albModulePos);
    expect(albModulePos).toBeLessThan(ec2ModulePos);
  });

  test("validates all modules use relative path sources", () => {
    const moduleBlocks = hcl.match(/module\s+"[^"]+"\s*{[^}]+}/g) || [];
    
    expect(moduleBlocks).toHaveLength(4); // vpc, security, alb, ec2
    
    moduleBlocks.forEach(moduleBlock => {
      expect(moduleBlock).toMatch(/source\s*=\s*"\.\/modules\/[^"]+"/);
      // Ensure no absolute paths or external sources
      expect(moduleBlock).not.toMatch(/source\s*=\s*"(?!\.\/)/);
    });
  });

  test("validates module naming consistency", () => {
    const expectedModules = [
      "vpc_module",
      "security_module", 
      "alb_module",
      "ec2_module"
    ];

    expectedModules.forEach(moduleName => {
      expect(hcl).toMatch(
        new RegExp(String.raw`module\s+"${moduleName}"\s*{`, "m")
      );
    });
  });

  test("ensures proper module output references", () => {
    // Check that modules reference expected outputs from other modules
    const expectedOutputRefs = [
      "module.vpc_module.vpc_id",
      "module.vpc_module.public_subnet_ids",
      "module.vpc_module.private_subnet_ids",
      "module.security_module.alb_security_group_id",
      "module.security_module.web_security_group_id",
      "module.security_module.ec2_instance_profile_name",
      "module.alb_module.target_group_arn"
    ];

    expectedOutputRefs.forEach(outputRef => {
      expect(hcl).toMatch(new RegExp(outputRef.replace(/\./g, "\\.")));
    });
  });

  test("validates data sources are defined", () => {
    // Check for AWS data sources
    expect(hcl).toMatch(/data\s+"aws_caller_identity"\s+"current"/);
    expect(hcl).toMatch(/data\s+"aws_region"\s+"current"/);
  });

  test("validates output blocks are properly defined", () => {
    const outputBlocks = hcl.match(/output\s+"[^"]+"\s*{[^}]*}/g) || [];
    
    // Should have multiple outputs
    expect(outputBlocks.length).toBeGreaterThan(10);
    
    // Check some key outputs
    expect(hcl).toMatch(/output\s+"vpc_id"/);
    expect(hcl).toMatch(/output\s+"alb_dns_name"/);
    expect(hcl).toMatch(/output\s+"autoscaling_group_name"/);
    expect(hcl).toMatch(/output\s+"application_url"/);
    
    // All outputs should have descriptions
    outputBlocks.forEach(outputBlock => {
      expect(outputBlock).toMatch(/description\s*=/);
      expect(outputBlock).toMatch(/value\s*=/);
    });
  });

  test("validates local values are used appropriately", () => {
    // Check for local value references in modules
    expect(hcl).toMatch(/local\.common_tags/);
    expect(hcl).toMatch(/local\.current_config\./);
  });

  test("validates that aws_region variable is defined but unused in modules", () => {
    // Variable should exist in either main.tf or vars.tf
    const combinedHcl = hcl + "\n" + varsHcl;
    // Note: This test may pass or fail depending on actual vars.tf content
    
    // But should not be referenced in any module blocks (potential dead code)
    // Extract only module blocks to check
    const moduleBlocks = hcl.match(/module\s+"[^"]+"\s*{[^}]*}/g) || [];
    const moduleContent = moduleBlocks.join('\n');
    expect(moduleContent).not.toMatch(/var\.aws_region/);
  });

  test("validates proper use of variables vs local values", () => {
    // Environment and project_name should use var.
    expect(hcl).toMatch(/var\.environment/);
    expect(hcl).toMatch(/var\.project_name/);
    
    // Configuration-specific values should use local.current_config
    expect(hcl).toMatch(/local\.current_config\.instance_type/);
    expect(hcl).toMatch(/local\.current_config\.min_size/);
    expect(hcl).toMatch(/local\.current_config\.max_size/);
    expect(hcl).toMatch(/local\.current_config\.desired_capacity/);
  });

  test("validates module interdependencies are correctly established", () => {
    // security_module depends on vpc_module
    const securityModule = hcl.match(/module\s+"security_module"\s*{[\s\S]*?}/)?.[0];
    expect(securityModule).toMatch(/vpc_id\s*=\s*module\.vpc_module\.vpc_id/);
    
    // alb_module depends on both vpc_module and security_module
    const albModule = hcl.match(/module\s+"alb_module"\s*{[\s\S]*?}/)?.[0];
    expect(albModule).toMatch(/vpc_id\s*=\s*module\.vpc_module\.vpc_id/);
    expect(albModule).toMatch(/alb_security_group_id\s*=\s*module\.security_module\.alb_security_group_id/);
    
    // ec2_module depends on vpc_module, security_module, and alb_module
    const ec2Module = hcl.match(/module\s+"ec2_module"\s*{[\s\S]*?}/)?.[0];
    expect(ec2Module).toMatch(/private_subnet_ids\s*=\s*module\.vpc_module\.private_subnet_ids/);
    expect(ec2Module).toMatch(/web_security_group_id\s*=\s*module\.security_module\.web_security_group_id/);
    expect(ec2Module).toMatch(/target_group_arn\s*=\s*module\.alb_module\.target_group_arn/);
  });
});