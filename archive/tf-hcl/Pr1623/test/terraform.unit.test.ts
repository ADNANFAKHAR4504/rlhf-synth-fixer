// tap-stack-unit-test.ts
// Jest-based static unit tests for multi-region Terraform HCL (no provider downloads; no AWS calls)

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

// Helper function to extract data source blocks with proper brace matching
function extractDataSources(hcl: string): string[] {
  const results: string[] = [];
  const lines = hcl.split('\n');
  let i = 0;
  
  while (i < lines.length) {
    const line = lines[i].trim();
    
    // Look for data block start
    const dataMatch = line.match(/^data\s+"([^"]+)"\s+"([^"]+)"\s*\{/);
    if (dataMatch) {
      let block = lines[i];
      let braceCount = (line.match(/\{/g) || []).length - (line.match(/\}/g) || []).length;
      i++;
      
      // Continue reading until braces are balanced
      while (i < lines.length && braceCount > 0) {
        block += '\n' + lines[i];
        braceCount += (lines[i].match(/\{/g) || []).length - (lines[i].match(/\}/g) || []).length;
        i++;
      }
      
      if (braceCount === 0) {
        results.push(block);
      }
      continue;
    }
    i++;
  }
  
  return results;
}

// Helper function to extract module blocks with proper brace matching
function extractModuleBlocks(hcl: string): { [key: string]: string } {
  const modules: { [key: string]: string } = {};
  const lines = hcl.split('\n');
  let i = 0;
  
  while (i < lines.length) {
    const line = lines[i].trim();
    
    // Skip commented lines
    if (line.startsWith('#')) {
      i++;
      continue;
    }
    
    // Look for module block start
    const moduleMatch = line.match(/^module\s+"([^"]+)"\s*\{/);
    if (moduleMatch) {
      const moduleName = moduleMatch[1];
      let block = lines[i];
      let braceCount = (line.match(/\{/g) || []).length - (line.match(/\}/g) || []).length;
      i++;
      
      // Continue reading until braces are balanced
      while (i < lines.length && braceCount > 0) {
        block += '\n' + lines[i];
        braceCount += (lines[i].match(/\{/g) || []).length - (lines[i].match(/\}/g) || []).length;
        i++;
      }
      
      if (braceCount === 0) {
        modules[moduleName] = block;
      }
      continue;
    }
    i++;
  }
  
  return modules;
}

describe("Terraform Multi-Region Infrastructure (static checks)", () => {
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

    // Debug output to see what we're parsing
    console.log("=== DEBUG: File content preview ===");
    console.log("File length:", hcl.length);
    console.log("First 500 chars:", hcl.substring(0, 500));
    console.log("Module matches:", hcl.match(/module\s+"[^"]+"/g));
    console.log("Data matches:", hcl.match(/data\s+"[^"]+"/g));
  });

  test("defines availability zone data sources for both regions", () => {
    const dataSources = extractDataSources(hcl);
    
    // Debug output
    console.log("=== DEBUG: Data Sources ===");
    console.log("Total data sources found:", dataSources.length);
    console.log("Data sources:", dataSources);
    
    // Should have exactly 2 data sources for availability zones
    const azDataSources = dataSources.filter(ds => 
      ds.includes('aws_availability_zones') && ds.includes('state') && ds.includes('available')
    );
    
    expect(azDataSources).toHaveLength(2);
    
    // Check primary region data source
    const primaryAzData = dataSources.find(ds => 
      ds.includes('aws_availability_zones') && ds.includes('"primary"')
    );
    expect(primaryAzData).toBeTruthy();
    expect(primaryAzData!).toMatch(/provider\s*=\s*aws\.primary/);
    
    // Check secondary region data source
    const secondaryAzData = dataSources.find(ds => 
      ds.includes('aws_availability_zones') && ds.includes('"secondary"')
    );
    expect(secondaryAzData).toBeTruthy();
    expect(secondaryAzData!).toMatch(/provider\s*=\s*aws\.secondary/);
  });

  test("defines vpc modules for both regions with correct configuration", () => {
    const modules = extractModuleBlocks(hcl);
    
    // Check primary VPC module
    const primaryVpc = modules['vpc_primary'];
    expect(primaryVpc).toBeTruthy();
    expect(primaryVpc).toMatch(/source\s*=\s*"\.\/modules\/vpc_module"/);
    expect(primaryVpc).toMatch(/providers\s*=\s*\{\s*aws\s*=\s*aws\.primary\s*\}/);
    expect(primaryVpc).toMatch(/vpc_cidr\s*=\s*var\.primary_vpc_cidr/);
    expect(primaryVpc).toMatch(/availability_zones\s*=\s*data\.aws_availability_zones\.primary\.names/);
    expect(primaryVpc).toMatch(/environment\s*=\s*var\.environment/);
    expect(primaryVpc).toMatch(/region_name\s*=\s*"primary"/);
    
    // Check secondary VPC module
    const secondaryVpc = modules['vpc_secondary'];
    expect(secondaryVpc).toBeTruthy();
    expect(secondaryVpc).toMatch(/source\s*=\s*"\.\/modules\/vpc_module"/);
    expect(secondaryVpc).toMatch(/providers\s*=\s*\{\s*aws\s*=\s*aws\.secondary\s*\}/);
    expect(secondaryVpc).toMatch(/vpc_cidr\s*=\s*var\.secondary_vpc_cidr/);
    expect(secondaryVpc).toMatch(/availability_zones\s*=\s*data\.aws_availability_zones\.secondary\.names/);
    expect(secondaryVpc).toMatch(/environment\s*=\s*var\.environment/);
    expect(secondaryVpc).toMatch(/region_name\s*=\s*"secondary"/);
  });

  test("defines load balancer modules for both regions with correct dependencies", () => {
    const modules = extractModuleBlocks(hcl);
    
    // Check primary load balancer module
    const primaryLb = modules['load_balancer_primary'];
    expect(primaryLb).toBeTruthy();
    expect(primaryLb).toMatch(/source\s*=\s*"\.\/modules\/loadbalancer_module"/);
    expect(primaryLb).toMatch(/providers\s*=\s*\{\s*aws\s*=\s*aws\.primary\s*\}/);
    expect(primaryLb).toMatch(/vpc_id\s*=\s*module\.vpc_primary\.vpc_id/);
    expect(primaryLb).toMatch(/public_subnet_ids\s*=\s*module\.vpc_primary\.public_subnet_ids/);
    expect(primaryLb).toMatch(/environment\s*=\s*var\.environment/);
    expect(primaryLb).toMatch(/region_name\s*=\s*"primary"/);
    
    // Check secondary load balancer module
    const secondaryLb = modules['load_balancer_secondary'];
    expect(secondaryLb).toBeTruthy();
    expect(secondaryLb).toMatch(/source\s*=\s*"\.\/modules\/loadbalancer_module"/);
    expect(secondaryLb).toMatch(/providers\s*=\s*\{\s*aws\s*=\s*aws\.secondary\s*\}/);
    expect(secondaryLb).toMatch(/vpc_id\s*=\s*module\.vpc_secondary\.vpc_id/);
    expect(secondaryLb).toMatch(/public_subnet_ids\s*=\s*module\.vpc_secondary\.public_subnet_ids/);
    expect(secondaryLb).toMatch(/environment\s*=\s*var\.environment/);
    expect(secondaryLb).toMatch(/region_name\s*=\s*"secondary"/);
  });

  test("defines compute modules for both regions with correct ASG configuration", () => {
    const modules = extractModuleBlocks(hcl);
    
    // Check primary compute module
    const primaryCompute = modules['compute_primary'];
    expect(primaryCompute).toBeTruthy();
    expect(primaryCompute).toMatch(/source\s*=\s*"\.\/modules\/compute_module"/);
    expect(primaryCompute).toMatch(/providers\s*=\s*\{\s*aws\s*=\s*aws\.primary\s*\}/);
    expect(primaryCompute).toMatch(/vpc_id\s*=\s*module\.vpc_primary\.vpc_id/);
    expect(primaryCompute).toMatch(/private_subnet_ids\s*=\s*module\.vpc_primary\.private_subnet_ids/);
    expect(primaryCompute).toMatch(/alb_target_group_arn\s*=\s*module\.load_balancer_primary\.target_group_arn/);
    expect(primaryCompute).toMatch(/alb_security_group_id\s*=\s*module\.load_balancer_primary\.alb_security_group_id/);
    expect(primaryCompute).toMatch(/instance_type\s*=\s*var\.instance_type/);
    expect(primaryCompute).toMatch(/min_size\s*=\s*var\.asg_min_size/);
    expect(primaryCompute).toMatch(/max_size\s*=\s*var\.asg_max_size/);
    expect(primaryCompute).toMatch(/desired_capacity\s*=\s*var\.asg_desired_capacity/);
    
    // Check secondary compute module
    const secondaryCompute = modules['compute_secondary'];
    expect(secondaryCompute).toBeTruthy();
    expect(secondaryCompute).toMatch(/source\s*=\s*"\.\/modules\/compute_module"/);
    expect(secondaryCompute).toMatch(/providers\s*=\s*\{\s*aws\s*=\s*aws\.secondary\s*\}/);
    expect(secondaryCompute).toMatch(/vpc_id\s*=\s*module\.vpc_secondary\.vpc_id/);
    expect(secondaryCompute).toMatch(/private_subnet_ids\s*=\s*module\.vpc_secondary\.private_subnet_ids/);
    expect(secondaryCompute).toMatch(/alb_target_group_arn\s*=\s*module\.load_balancer_secondary\.target_group_arn/);
    expect(secondaryCompute).toMatch(/alb_security_group_id\s*=\s*module\.load_balancer_secondary\.alb_security_group_id/);
    expect(secondaryCompute).toMatch(/instance_type\s*=\s*var\.instance_type/);
    expect(secondaryCompute).toMatch(/min_size\s*=\s*var\.asg_min_size/);
    expect(secondaryCompute).toMatch(/max_size\s*=\s*var\.asg_max_size/);
    expect(secondaryCompute).toMatch(/desired_capacity\s*=\s*var\.asg_desired_capacity/);
  });

  test("defines required outputs for ALB DNS names", () => {
    const primaryAlbOutput = hcl.match(
      /output\s+"primary_alb_dns_name"\s*{[\s\S]*?}/m
    )?.[0];
    
    const secondaryAlbOutput = hcl.match(
      /output\s+"secondary_alb_dns_name"\s*{[\s\S]*?}/m
    )?.[0];

    expect(primaryAlbOutput).toBeTruthy();
    expect(primaryAlbOutput!).toMatch(/description\s*=\s*"DNS name of the primary region ALB"/);
    expect(primaryAlbOutput!).toMatch(/value\s*=\s*module\.load_balancer_primary\.alb_dns_name/);

    expect(secondaryAlbOutput).toBeTruthy();
    expect(secondaryAlbOutput!).toMatch(/description\s*=\s*"DNS name of the secondary region ALB"/);
    expect(secondaryAlbOutput!).toMatch(/value\s*=\s*module\.load_balancer_secondary\.alb_dns_name/);
  });

  test("defines required outputs for VPC IDs", () => {
    const primaryVpcOutput = hcl.match(
      /output\s+"primary_vpc_id"\s*{[\s\S]*?}/m
    )?.[0];
    
    const secondaryVpcOutput = hcl.match(
      /output\s+"secondary_vpc_id"\s*{[\s\S]*?}/m
    )?.[0];

    expect(primaryVpcOutput).toBeTruthy();
    expect(primaryVpcOutput!).toMatch(/description\s*=\s*"ID of the primary VPC"/);
    expect(primaryVpcOutput!).toMatch(/value\s*=\s*module\.vpc_primary\.vpc_id/);

    expect(secondaryVpcOutput).toBeTruthy();
    expect(secondaryVpcOutput!).toMatch(/description\s*=\s*"ID of the secondary VPC"/);
    expect(secondaryVpcOutput!).toMatch(/value\s*=\s*module\.vpc_secondary\.vpc_id/);
  });

  test("validates proper dependency chain order in multi-region setup", () => {
    // Find positions of each module type in the file
    const vpcPrimaryPos = hcl.search(/module\s+"vpc_primary"/);
    const vpcSecondaryPos = hcl.search(/module\s+"vpc_secondary"/);
    const lbPrimaryPos = hcl.search(/module\s+"load_balancer_primary"/);
    const lbSecondaryPos = hcl.search(/module\s+"load_balancer_secondary"/);
    const computePrimaryPos = hcl.search(/module\s+"compute_primary"/);
    const computeSecondaryPos = hcl.search(/module\s+"compute_secondary"/);

    // VPC modules should come first
    expect(vpcPrimaryPos).toBeLessThan(lbPrimaryPos);
    expect(vpcSecondaryPos).toBeLessThan(lbSecondaryPos);
    
    // Load balancer modules should come before compute modules
    expect(lbPrimaryPos).toBeLessThan(computePrimaryPos);
    expect(lbSecondaryPos).toBeLessThan(computeSecondaryPos);
  });

  test("validates all modules use correct provider configuration", () => {
    const modules = extractModuleBlocks(hcl);
    
    // Primary region modules should use aws.primary provider
    const primaryModules = ['vpc_primary', 'load_balancer_primary', 'compute_primary'];
    primaryModules.forEach(moduleName => {
      expect(modules[moduleName]).toMatch(/providers\s*=\s*\{\s*aws\s*=\s*aws\.primary\s*\}/);
    });
    
    // Secondary region modules should use aws.secondary provider
    const secondaryModules = ['vpc_secondary', 'load_balancer_secondary', 'compute_secondary'];
    secondaryModules.forEach(moduleName => {
      expect(modules[moduleName]).toMatch(/providers\s*=\s*\{\s*aws\s*=\s*aws\.secondary\s*\}/);
    });
  });

  test("validates all modules use relative path sources", () => {
    const modules = extractModuleBlocks(hcl);
    const moduleNames = Object.keys(modules);
    
    // Should find 6 active modules (3 types × 2 regions, DNS is commented out)
    expect(moduleNames).toHaveLength(6);
    
    Object.values(modules).forEach(moduleContent => {
      expect(moduleContent).toMatch(/source\s*=\s*"\.\/modules\/[^"]+"/);
      // Ensure no absolute paths or external sources
      expect(moduleContent).not.toMatch(/source\s*=\s*"(?!\.\/)/);
    });
  });

  test("validates module naming consistency follows region pattern", () => {
    const expectedModules = [
      "vpc_primary",
      "vpc_secondary",
      "load_balancer_primary", 
      "load_balancer_secondary",
      "compute_primary",
      "compute_secondary"
    ];

    expectedModules.forEach(moduleName => {
      expect(hcl).toMatch(
        new RegExp(String.raw`module\s+"${moduleName}"\s*{`, "m")
      );
    });
  });

  test("ensures proper variable usage across regions", () => {
    // Check that region-specific variables are properly referenced
    const expectedVarRefs = [
      "var.primary_vpc_cidr",
      "var.secondary_vpc_cidr",
      "var.environment",
      "var.instance_type",
      "var.asg_min_size",
      "var.asg_max_size",
      "var.asg_desired_capacity"
    ];

    expectedVarRefs.forEach(varRef => {
      expect(hcl).toMatch(new RegExp(varRef.replace(/\./g, "\\.")));
    });
  });

  test("validates data source references in modules", () => {
    // Check that availability zone data sources are properly referenced
    expect(hcl).toMatch(/data\.aws_availability_zones\.primary\.names/);
    expect(hcl).toMatch(/data\.aws_availability_zones\.secondary\.names/);
  });

  test("ensures proper module output references within regions", () => {
    // Check that modules reference expected outputs from other modules in same region
    const expectedOutputRefs = [
      // Primary region references
      "module.vpc_primary.vpc_id",
      "module.vpc_primary.public_subnet_ids",
      "module.vpc_primary.private_subnet_ids",
      "module.load_balancer_primary.target_group_arn",
      "module.load_balancer_primary.alb_security_group_id",
      "module.load_balancer_primary.alb_dns_name",
      
      // Secondary region references
      "module.vpc_secondary.vpc_id",
      "module.vpc_secondary.public_subnet_ids", 
      "module.vpc_secondary.private_subnet_ids",
      "module.load_balancer_secondary.target_group_arn",
      "module.load_balancer_secondary.alb_security_group_id",
      "module.load_balancer_secondary.alb_dns_name"
    ];

    expectedOutputRefs.forEach(outputRef => {
      expect(hcl).toMatch(new RegExp(outputRef.replace(/\./g, "\\.")));
    });
  });

  test("validates region isolation - no cross-region module dependencies", () => {
    const modules = extractModuleBlocks(hcl);
    
    // Primary modules should not reference secondary modules
    const primaryModules = ['vpc_primary', 'load_balancer_primary', 'compute_primary'];
    primaryModules.forEach(moduleName => {
      expect(modules[moduleName]).not.toMatch(/module\.[^.]*secondary/);
    });
    
    // Secondary modules should not reference primary modules  
    const secondaryModules = ['vpc_secondary', 'load_balancer_secondary', 'compute_secondary'];
    secondaryModules.forEach(moduleName => {
      expect(modules[moduleName]).not.toMatch(/module\.[^.]*primary/);
    });
  });

  test("validates consistent environment and region_name parameters", () => {
    const modules = extractModuleBlocks(hcl);
    
    // All modules should have environment parameter
    Object.values(modules).forEach(moduleContent => {
      expect(moduleContent).toMatch(/environment\s*=\s*var\.environment/);
    });
    
    // Primary region modules should have region_name = "primary"
    const primaryModules = ['vpc_primary', 'load_balancer_primary', 'compute_primary'];
    primaryModules.forEach(moduleName => {
      expect(modules[moduleName]).toMatch(/region_name\s*=\s*"primary"/);
    });
    
    // Secondary region modules should have region_name = "secondary"
    const secondaryModules = ['vpc_secondary', 'load_balancer_secondary', 'compute_secondary'];
    secondaryModules.forEach(moduleName => {
      expect(modules[moduleName]).toMatch(/region_name\s*=\s*"secondary"/);
    });
  });

  test("validates ASG configuration consistency across regions", () => {
    const modules = extractModuleBlocks(hcl);
    const computeModules = ['compute_primary', 'compute_secondary'];
    
    computeModules.forEach(moduleName => {
      const moduleContent = modules[moduleName];
      expect(moduleContent).toMatch(/instance_type\s*=\s*var\.instance_type/);
      expect(moduleContent).toMatch(/min_size\s*=\s*var\.asg_min_size/);
      expect(moduleContent).toMatch(/max_size\s*=\s*var\.asg_max_size/);
      expect(moduleContent).toMatch(/desired_capacity\s*=\s*var\.asg_desired_capacity/);
    });
  });

  test("validates load balancer integration in compute modules", () => {
    const modules = extractModuleBlocks(hcl);
    
    // Primary compute should reference primary load balancer
    expect(modules['compute_primary']).toMatch(
      /alb_target_group_arn\s*=\s*module\.load_balancer_primary\.target_group_arn/
    );
    expect(modules['compute_primary']).toMatch(
      /alb_security_group_id\s*=\s*module\.load_balancer_primary\.alb_security_group_id/
    );
    
    // Secondary compute should reference secondary load balancer  
    expect(modules['compute_secondary']).toMatch(
      /alb_target_group_arn\s*=\s*module\.load_balancer_secondary\.target_group_arn/
    );
    expect(modules['compute_secondary']).toMatch(
      /alb_security_group_id\s*=\s*module\.load_balancer_secondary\.alb_security_group_id/
    );
  });

  // NOTE: If both regional endpoints are reachable in production, this validates that the following
  // multi-region infrastructure components are properly configured and working together:
  // - Multi-region VPC: Network infrastructure across availability zones in both regions
  // - Load Balancers: Properly configured ALBs with target groups in each region
  // - Auto Scaling Groups: Instance health checks and scaling policies in both regions  
  // - Cross-region failover capability and regional isolation
  // A successful response from both regions indicates proper multi-region deployment and redundancy
});