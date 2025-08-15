// terraform-modular-unit.ts
// Jest-based static unit tests for modular Terraform HCL (no provider downloads; no AWS calls)

import * as fs from "fs";
import * as path from "path";

// Prefer env var; else resolve ../lib/main.tf relative to this test file
const TF_PATH = process.env.TF_MAIN_PATH
  ? path.resolve(process.env.TF_MAIN_PATH)
  : path.resolve(__dirname, "../lib/main.tf");

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
        String.raw`variable\s+"aws_region"\s*{[\s\S]*?description\s*=\s*"AWS provider region"[\s\S]*?type\s*=\s*string[\s\S]*?default\s*=\s*"us-east-1"[\s\S]*?}`,
        "m"
      )
    );
  });

  test("defines env_module with correct source", () => {
    const envModule = hcl.match(
      new RegExp(
        String.raw`module\s+"env_module"\s*{[\s\S]*?source\s*=\s*"\.\/modules\/env_module"[\s\S]*?}`,
        "m"
      )
    )?.[0];

    expect(envModule).toBeTruthy();
    // Should have no input parameters (takes no variables)
    const moduleContent = envModule!.match(/module\s+"env_module"\s*{([\s\S]*?)}/)?.[1] || "";
    const nonSourceLines = moduleContent.split('\n')
      .filter(line => line.trim() && !line.includes('source'))
      .filter(line => !line.trim().startsWith('//') && !line.trim().startsWith('#'));
    expect(nonSourceLines).toHaveLength(0);
  });

  test("defines vpc_module with required inputs from env_module", () => {
    const vpcModule = hcl.match(
      new RegExp(
        String.raw`module\s+"vpc_module"\s*{([\s\S]*?)}`,
        "m"
      )
    )?.[0];

    expect(vpcModule).toBeTruthy();
    
    // Check source path
    expect(vpcModule!).toMatch(
      new RegExp(String.raw`source\s*=\s*"\.\/modules\/vpc_module"`, "m")
    );

    // Check all required inputs from env_module
    expect(vpcModule!).toMatch(
      new RegExp(String.raw`environment\s*=\s*module\.env_module\.environment`, "m")
    );
    expect(vpcModule!).toMatch(
      new RegExp(String.raw`vpc_cidr\s*=\s*module\.env_module\.vpc_cidr`, "m")
    );
    expect(vpcModule!).toMatch(
      new RegExp(String.raw`availability_zones\s*=\s*module\.env_module\.availability_zones`, "m")
    );
    expect(vpcModule!).toMatch(
      new RegExp(String.raw`common_tags\s*=\s*module\.env_module\.common_tags`, "m")
    );
    expect(vpcModule!).toMatch(
      new RegExp(String.raw`project_name\s*=\s*module\.env_module\.project_name`, "m")
    );
  });

  test("defines security_group_module with correct inputs and dependencies", () => {
    const sgModule = hcl.match(
      new RegExp(
        String.raw`module\s+"security_group_module"\s*{([\s\S]*?)}`,
        "m"
      )
    )?.[0];

    expect(sgModule).toBeTruthy();
    
    // Check source path
    expect(sgModule!).toMatch(
      new RegExp(String.raw`source\s*=\s*"\.\/modules\/securitygroup_module"`, "m")
    );

    // Check inputs from env_module
    expect(sgModule!).toMatch(
      new RegExp(String.raw`environment\s*=\s*module\.env_module\.environment`, "m")
    );
    expect(sgModule!).toMatch(
      new RegExp(String.raw`project_name\s*=\s*module\.env_module\.project_name`, "m")
    );
    expect(sgModule!).toMatch(
      new RegExp(String.raw`vpc_cidr_block\s*=\s*module\.env_module\.vpc_cidr`, "m")
    );
    expect(sgModule!).toMatch(
      new RegExp(String.raw`common_tags\s*=\s*module\.env_module\.common_tags`, "m")
    );

    // Check input from vpc_module (dependency)
    expect(sgModule!).toMatch(
      new RegExp(String.raw`vpc_id\s*=\s*module\.vpc_module\.vpc_id`, "m")
    );

    // Check explicit dependency
    expect(sgModule!).toMatch(
      new RegExp(String.raw`depends_on\s*=\s*\[\s*module\.vpc_module\s*\]`, "m")
    );
  });

  test("defines lb_module with correct inputs and dependencies", () => {
    const lbModule = hcl.match(
      new RegExp(
        String.raw`module\s+"lb_module"\s*{([\s\S]*?)}`,
        "m"
      )
    )?.[0];

    expect(lbModule).toBeTruthy();
    
    // Check source path
    expect(lbModule!).toMatch(
      new RegExp(String.raw`source\s*=\s*"\.\/modules\/lb_module"`, "m")
    );

    // Check inputs from env_module
    expect(lbModule!).toMatch(
      new RegExp(String.raw`environment\s*=\s*module\.env_module\.environment`, "m")
    );
    expect(lbModule!).toMatch(
      new RegExp(String.raw`project_name\s*=\s*module\.env_module\.project_name`, "m")
    );
    expect(lbModule!).toMatch(
      new RegExp(String.raw`common_tags\s*=\s*module\.env_module\.common_tags`, "m")
    );

    // Check inputs from vpc_module
    expect(lbModule!).toMatch(
      new RegExp(String.raw`vpc_id\s*=\s*module\.vpc_module\.vpc_id`, "m")
    );
    expect(lbModule!).toMatch(
      new RegExp(String.raw`public_subnet_ids\s*=\s*module\.vpc_module\.public_subnet_ids`, "m")
    );

    // Check input from security_group_module
    expect(lbModule!).toMatch(
      new RegExp(String.raw`security_group_id\s*=\s*module\.security_group_module\.alb_security_group_id`, "m")
    );

    // Check explicit dependency
    expect(lbModule!).toMatch(
      new RegExp(String.raw`depends_on\s*=\s*\[\s*module\.security_group_module\s*\]`, "m")
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

    // Check inputs from env_module
    expect(ec2Module!).toMatch(
      new RegExp(String.raw`environment\s*=\s*module\.env_module\.environment`, "m")
    );
    expect(ec2Module!).toMatch(
      new RegExp(String.raw`project_name\s*=\s*module\.env_module\.project_name`, "m")
    );
    expect(ec2Module!).toMatch(
      new RegExp(String.raw`common_tags\s*=\s*module\.env_module\.common_tags`, "m")
    );
    expect(ec2Module!).toMatch(
      new RegExp(String.raw`instance_type\s*=\s*module\.env_module\.instance_type`, "m")
    );
    expect(ec2Module!).toMatch(
      new RegExp(String.raw`min_size\s*=\s*module\.env_module\.as_group_min`, "m")
    );
    expect(ec2Module!).toMatch(
      new RegExp(String.raw`max_size\s*=\s*module\.env_module\.as_group_max`, "m")
    );
    expect(ec2Module!).toMatch(
      new RegExp(String.raw`desired_capacity\s*=\s*module\.env_module\.as_group_desired`, "m")
    );

    // Check input from vpc_module
    expect(ec2Module!).toMatch(
      new RegExp(String.raw`private_subnet_ids\s*=\s*module\.vpc_module\.private_subnet_ids`, "m")
    );

    // Check inputs from security_group_module
    expect(ec2Module!).toMatch(
      new RegExp(String.raw`security_group_id\s*=\s*module\.security_group_module\.ec2_security_group_id`, "m")
    );
    expect(ec2Module!).toMatch(
      new RegExp(String.raw`instance_profile_name\s*=\s*module\.security_group_module\.ec2_instance_profile_name`, "m")
    );

    // Check input from lb_module
    expect(ec2Module!).toMatch(
      new RegExp(String.raw`target_group_arn\s*=\s*module\.lb_module\.target_group_arn`, "m")
    );

    // Check explicit dependency
    expect(ec2Module!).toMatch(
      new RegExp(String.raw`depends_on\s*=\s*\[\s*module\.lb_module\s*\]`, "m")
    );
  });

  test("validates proper dependency chain order", () => {
    // Find positions of each module in the file
    const envModulePos = hcl.search(/module\s+"env_module"/);
    const vpcModulePos = hcl.search(/module\s+"vpc_module"/);
    const sgModulePos = hcl.search(/module\s+"security_group_module"/);
    const lbModulePos = hcl.search(/module\s+"lb_module"/);
    const ec2ModulePos = hcl.search(/module\s+"ec2_module"/);

    // Verify modules are defined in dependency order
    expect(envModulePos).toBeLessThan(vpcModulePos);
    expect(vpcModulePos).toBeLessThan(sgModulePos);
    expect(sgModulePos).toBeLessThan(lbModulePos);
    expect(lbModulePos).toBeLessThan(ec2ModulePos);
  });

  test("validates all modules use relative path sources", () => {
    const moduleBlocks = hcl.match(/module\s+"[^"]+"\s*{[^}]+}/g) || [];
    
    expect(moduleBlocks).toHaveLength(5); // env, vpc, security_group, lb, ec2
    
    moduleBlocks.forEach(moduleBlock => {
      expect(moduleBlock).toMatch(/source\s*=\s*"\.\/modules\/[^"]+"/);
      // Ensure no absolute paths or external sources
      expect(moduleBlock).not.toMatch(/source\s*=\s*"(?!\.\/)/);
    });
  });

  test("validates module naming consistency", () => {
    const expectedModules = [
      "env_module",
      "vpc_module", 
      "security_group_module",
      "lb_module",
      "ec2_module"
    ];

    expectedModules.forEach(moduleName => {
      expect(hcl).toMatch(
        new RegExp(String.raw`module\s+"${moduleName}"\s*{`, "m")
      );
    });
  });

  test("ensures no hardcoded values in module inputs", () => {
    // Extract only module blocks (not variable blocks)
    const moduleBlocks = hcl.match(/module\s+"[^"]+"\s*{[^}]*}/g) || [];
    const moduleContent = moduleBlocks.join('\n');
    
    // Look for hardcoded string assignments in module blocks only
    const moduleInputPattern = /(\w+)\s*=\s*"[^"]*"/g;
    const matches = [...moduleContent.matchAll(moduleInputPattern)];
    
    // Filter out 'source' assignments which should be hardcoded paths
    const nonSourceMatches = matches.filter(match => match[1] !== 'source');
    
    // Should have no hardcoded string values in module inputs except for source paths
    expect(nonSourceMatches).toHaveLength(0);
  });

  test("validates that aws_region variable is defined but unused", () => {
    // Variable should exist in either main.tf or vars.tf
    const combinedHcl = hcl + "\n" + varsHcl;
    expect(combinedHcl).toMatch(/variable\s+"aws_region"/);
    
    // But should not be referenced in any module (potential dead code)
    expect(hcl).not.toMatch(/var\.aws_region/);
  });

  test("ensures proper module output references", () => {
    // Check that modules reference expected outputs from other modules
    const expectedOutputRefs = [
      "module.env_module.environment",
      "module.env_module.vpc_cidr", 
      "module.env_module.availability_zones",
      "module.env_module.common_tags",
      "module.env_module.project_name",
      "module.env_module.instance_type",
      "module.env_module.as_group_min",
      "module.env_module.as_group_max", 
      "module.env_module.as_group_desired",
      "module.vpc_module.vpc_id",
      "module.vpc_module.public_subnet_ids",
      "module.vpc_module.private_subnet_ids",
      "module.security_group_module.alb_security_group_id",
      "module.security_group_module.ec2_security_group_id",
      "module.security_group_module.ec2_instance_profile_name",
      "module.lb_module.target_group_arn"
    ];

    expectedOutputRefs.forEach(outputRef => {
      expect(hcl).toMatch(new RegExp(outputRef.replace(/\./g, "\\.")));
    });
  });
});
