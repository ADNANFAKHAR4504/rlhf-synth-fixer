// terraform-main-unit.ts
// Jest-based static unit tests for modular Terraform HCL (no provider downloads; no AWS calls)

import * as fs from "fs";
import * as path from "path";

// Prefer env var; else resolve ../tap_stack.tf relative to this test file
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

describe("Terraform Web Application Infrastructure (static checks)", () => {
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

  test("defines required data sources for AWS resources", () => {
    // Check for AWS caller identity data source
    expect(hcl).toMatch(/data\s+"aws_caller_identity"\s+"current"\s*{/);
    
    // Check for AWS region data source
    expect(hcl).toMatch(/data\s+"aws_region"\s+"current"\s*{/);
    
    // Check for Amazon Linux AMI data source
    const amiDataSource = hcl.match(
      new RegExp(
        String.raw`data\s+"aws_ami"\s+"amazon_linux"\s*{[\s\S]*?}`,
        "m"
      )
    )?.[0];

    expect(amiDataSource).toBeTruthy();
    expect(amiDataSource!).toMatch(/most_recent\s*=\s*true/);
    expect(amiDataSource!).toMatch(/owners\s*=\s*\[\s*"amazon"\s*\]/);
    expect(amiDataSource!).toMatch(/name\s*=\s*"name"/);
    expect(amiDataSource!).toMatch(/values\s*=\s*\[\s*"amzn2-ami-hvm-\*-x86_64-gp2"\s*\]/);
  });

  test("defines common_tags local with required project tags", () => {
    const localsBlock = extractLocalsBlock(varsHcl);

    expect(localsBlock).toBeTruthy();
    
    // Check for required tag fields in vars.tf locals
    expect(localsBlock!).toMatch(/Department\s*=\s*var\.department/);
    expect(localsBlock!).toMatch(/Project\s*=\s*var\.project/);
    expect(localsBlock!).toMatch(/Environment\s*=\s*var\.environment/);
    expect(localsBlock!).toMatch(/ManagedBy\s*=\s*"Terraform"/);
    expect(localsBlock!).toMatch(/Region\s*=\s*var\.region/);
    expect(localsBlock!).toMatch(/CreatedDate\s*=\s*formatdate\("YYYY-MM-DD",\s*timestamp\(\)\)/);
  });

  test("defines environment-specific configurations in locals", () => {
    const localsBlock = extractLocalsBlock(varsHcl);

    expect(localsBlock).toBeTruthy();
    
    // Check instance configurations
    expect(localsBlock!).toMatch(/instance_configs\s*=\s*{/);
    expect(localsBlock!).toMatch(/staging\s*=\s*{[\s\S]*?instance_type\s*=\s*"t3\.micro"/);
    expect(localsBlock!).toMatch(/production\s*=\s*{[\s\S]*?instance_type\s*=\s*"t3\.medium"/);
    
    // Check database configurations
    expect(localsBlock!).toMatch(/db_configs\s*=\s*{/);
    expect(localsBlock!).toMatch(/staging\s*=\s*{[\s\S]*?instance_class\s*=\s*"db\.t3\.micro"/);
    expect(localsBlock!).toMatch(/production\s*=\s*{[\s\S]*?instance_class\s*=\s*"db\.t3\.medium"/);
    
    // Check network configurations
    expect(localsBlock!).toMatch(/network_configs\s*=\s*{/);
    expect(localsBlock!).toMatch(/staging\s*=\s*{[\s\S]*?vpc_cidr\s*=\s*"10\.0\.0\.0\/16"/);
    expect(localsBlock!).toMatch(/production\s*=\s*{[\s\S]*?vpc_cidr\s*=\s*"10\.1\.0\.0\/16"/);
  });

  test("defines current environment lookups with fallbacks", () => {
    const localsBlock = extractLocalsBlock(varsHcl);

    expect(localsBlock).toBeTruthy();
    
    // Check lookup functions with staging fallback
    expect(localsBlock!).toMatch(/current_instance_config\s*=\s*lookup\(local\.instance_configs,\s*var\.environment,\s*local\.instance_configs\["staging"\]\)/);
    expect(localsBlock!).toMatch(/current_db_config\s*=\s*lookup\(local\.db_configs,\s*var\.environment,\s*local\.db_configs\["staging"\]\)/);
    expect(localsBlock!).toMatch(/current_network_config\s*=\s*lookup\(local\.network_configs,\s*var\.environment,\s*local\.network_configs\["staging"\]\)/);
  });

  test("defines iam module with correct source and inputs", () => {
    const iamModule = hcl.match(
      new RegExp(
        String.raw`module\s+"iam"\s*{([\s\S]*?)}`,
        "m"
      )
    )?.[0];

    expect(iamModule).toBeTruthy();
    
    // Check source path
    expect(iamModule!).toMatch(
      new RegExp(String.raw`source\s*=\s*"\.\/modules\/iam_module"`, "m")
    );

    // Check required inputs
    expect(iamModule!).toMatch(/name_prefix\s*=\s*local\.name_prefix/);
    expect(iamModule!).toMatch(/tags\s*=\s*local\.common_tags/);
  });

  test("defines networking module with correct inputs", () => {
    const networkingModule = hcl.match(
      new RegExp(
        String.raw`module\s+"networking"\s*{([\s\S]*?)}`,
        "m"
      )
    )?.[0];

    expect(networkingModule).toBeTruthy();
    
    // Check source path
    expect(networkingModule!).toMatch(
      new RegExp(String.raw`source\s*=\s*"\.\/modules\/networking_module"`, "m")
    );

    // Check required inputs
    expect(networkingModule!).toMatch(/name_prefix\s*=\s*local\.name_prefix/);
    expect(networkingModule!).toMatch(/vpc_cidr\s*=\s*local\.current_network_config\.vpc_cidr/);
    expect(networkingModule!).toMatch(/availability_zones\s*=\s*local\.effective_azs/);
    expect(networkingModule!).toMatch(/public_subnets\s*=\s*local\.current_network_config\.public_subnets/);
    expect(networkingModule!).toMatch(/private_subnets\s*=\s*local\.current_network_config\.private_subnets/);
    expect(networkingModule!).toMatch(/database_subnets\s*=\s*local\.current_network_config\.database_subnets/);
    expect(networkingModule!).toMatch(/tags\s*=\s*local\.common_tags/);
  });

  test("defines database module with correct inputs and dependencies", () => {
    const databaseModule = hcl.match(
      new RegExp(
        String.raw`module\s+"database"\s*{([\s\S]*?)}`,
        "m"
      )
    )?.[0];

    expect(databaseModule).toBeTruthy();
    
    // Check source path
    expect(databaseModule!).toMatch(
      new RegExp(String.raw`source\s*=\s*"\.\/modules\/database_module"`, "m")
    );

    // Check inputs from networking module
    expect(databaseModule!).toMatch(/db_subnet_group_name\s*=\s*module\.networking\.db_subnet_group_name/);
    expect(databaseModule!).toMatch(/vpc_security_group_ids\s*=\s*\[module\.networking\.database_security_group_id\]/);
    
    // Check configuration inputs
    expect(databaseModule!).toMatch(/instance_class\s*=\s*local\.current_db_config\.instance_class/);
    expect(databaseModule!).toMatch(/allocated_storage\s*=\s*local\.current_db_config\.allocated_storage/);
    expect(databaseModule!).toMatch(/backup_retention\s*=\s*local\.current_db_config\.backup_retention/);
    expect(databaseModule!).toMatch(/multi_az\s*=\s*local\.current_db_config\.multi_az/);
    expect(databaseModule!).toMatch(/deletion_protection\s*=\s*local\.current_db_config\.deletion_protection/);
    expect(databaseModule!).toMatch(/auto_minor_version_upgrade\s*=\s*local\.current_db_config\.auto_minor_version_upgrade/);
    expect(databaseModule!).toMatch(/engine_version\s*=\s*local\.current_db_config\.engine_version/);
    
    // Check sensitive variables
    expect(databaseModule!).toMatch(/db_username\s*=\s*var\.db_username/);
    expect(databaseModule!).toMatch(/db_password\s*=\s*var\.db_password/);
    
    // Check common inputs
    expect(databaseModule!).toMatch(/name_prefix\s*=\s*local\.name_prefix/);
    expect(databaseModule!).toMatch(/tags\s*=\s*local\.common_tags/);
  });

  test("defines compute module with correct inputs and dependencies", () => {
    const computeModule = hcl.match(
      new RegExp(
        String.raw`module\s+"compute"\s*{([\s\S]*?)}`,
        "m"
      )
    )?.[0];

    expect(computeModule).toBeTruthy();
    
    // Check source path
    expect(computeModule!).toMatch(
      new RegExp(String.raw`source\s*=\s*"\.\/modules\/compute_module"`, "m")
    );

    // Check networking inputs
    expect(computeModule!).toMatch(/vpc_id\s*=\s*module\.networking\.vpc_id/);
    expect(computeModule!).toMatch(/public_subnet_ids\s*=\s*module\.networking\.public_subnet_ids/);
    expect(computeModule!).toMatch(/private_subnet_ids\s*=\s*module\.networking\.private_subnet_ids/);
    expect(computeModule!).toMatch(/alb_security_group_id\s*=\s*module\.networking\.alb_security_group_id/);
    expect(computeModule!).toMatch(/instance_security_group_id\s*=\s*module\.networking\.instance_security_group_id/);
    
    // Check instance configuration
    expect(computeModule!).toMatch(/ami_id\s*=\s*data\.aws_ami\.amazon_linux\.id/);
    expect(computeModule!).toMatch(/instance_type\s*=\s*local\.current_instance_config\.instance_type/);
    expect(computeModule!).toMatch(/min_size\s*=\s*local\.current_instance_config\.min_size/);
    expect(computeModule!).toMatch(/max_size\s*=\s*local\.current_instance_config\.max_size/);
    expect(computeModule!).toMatch(/desired_capacity\s*=\s*local\.current_instance_config\.desired_capacity/);
    expect(computeModule!).toMatch(/volume_size\s*=\s*local\.current_instance_config\.volume_size/);
    
    // Check IAM and database dependencies
    expect(computeModule!).toMatch(/instance_profile_name\s*=\s*module\.iam\.instance_profile_name/);
    expect(computeModule!).toMatch(/db_endpoint\s*=\s*module\.database\.db_endpoint/);
    
    // Check common inputs
    expect(computeModule!).toMatch(/name_prefix\s*=\s*local\.name_prefix/);
    expect(computeModule!).toMatch(/tags\s*=\s*local\.common_tags/);
  });

  test("defines required output values", () => {
    // Check load balancer domain output
    const lbDomainOutput = hcl.match(
      new RegExp(
        String.raw`output\s+"lb_domain"\s*{[\s\S]*?}`,
        "m"
      )
    )?.[0];

    expect(lbDomainOutput).toBeTruthy();
    expect(lbDomainOutput!).toMatch(/value\s*=\s*module\.compute\.alb_dns_name/);

    // Check target group ARN output
    const targetGroupOutput = hcl.match(
      new RegExp(
        String.raw`output\s+"target_group_arn"\s*{[\s\S]*?}`,
        "m"
      )
    )?.[0];

    expect(targetGroupOutput).toBeTruthy();
    expect(targetGroupOutput!).toMatch(/value\s*=\s*module\.compute\.target_group_arn/);

    // Check RDS endpoint output
    const rdsEndpointOutput = hcl.match(
      new RegExp(
        String.raw`output\s+"rds_endpoint"\s*{[\s\S]*?}`,
        "m"
      )
    )?.[0];

    expect(rdsEndpointOutput).toBeTruthy();
    expect(rdsEndpointOutput!).toMatch(/value\s*=\s*module\.database\.db_endpoint/);
  });

  test("validates proper dependency chain order", () => {
    // Find positions of each module in the file
    const iamModulePos = hcl.search(/module\s+"iam"/);
    const networkingModulePos = hcl.search(/module\s+"networking"/);
    const databaseModulePos = hcl.search(/module\s+"database"/);
    const computeModulePos = hcl.search(/module\s+"compute"/);

    // Verify modules are defined in logical dependency order
    // IAM and networking can be parallel, but both should come before database and compute
    expect(iamModulePos).toBeGreaterThan(0);
    expect(networkingModulePos).toBeGreaterThan(0);
    expect(databaseModulePos).toBeGreaterThan(Math.max(networkingModulePos));
    expect(computeModulePos).toBeGreaterThan(Math.max(iamModulePos, networkingModulePos, databaseModulePos));
  });

  test("validates all modules use relative path sources", () => {
    const moduleBlocks = hcl.match(/module\s+"[^"]+"\s*{[^}]+}/g) || [];
    
    expect(moduleBlocks).toHaveLength(4); // iam, networking, database, compute
    
    moduleBlocks.forEach(moduleBlock => {
      expect(moduleBlock).toMatch(/source\s*=\s*"\.\/modules\/[^"]+"/);
      // Ensure no absolute paths or external sources
      expect(moduleBlock).not.toMatch(/source\s*=\s*"(?!\.\/)/);
    });
  });

  test("validates module naming consistency", () => {
    const expectedModules = [
      "iam",
      "networking", 
      "database",
      "compute"
    ];

    expectedModules.forEach(moduleName => {
      expect(hcl).toMatch(
        new RegExp(String.raw`module\s+"${moduleName}"\s*{`, "m")
      );
    });
  });

  test("validates environment variable constraints", () => {
    // Check environment variable validation
    const environmentVar = varsHcl.match(
      new RegExp(
        String.raw`variable\s+"environment"\s*{[\s\S]*?}`,
        "m"
      )
    )?.[0];

    expect(environmentVar).toBeTruthy();
    expect(environmentVar!).toMatch(/validation\s*{/);
    expect(environmentVar!).toMatch(/condition\s*=\s*contains\(\["staging",\s*"production"\],\s*var\.environment\)/);
    expect(environmentVar!).toMatch(/error_message\s*=\s*"Environment must be either 'staging' or 'production'\."/);
    // Note: The environment variable doesn't have a default value, which is intentional for explicit environment selection
  });

  test("validates sensitive variable declarations", () => {
    // Check db_username is marked as sensitive
    const dbUsernameVar = varsHcl.match(
      new RegExp(
        String.raw`variable\s+"db_username"\s*{[\s\S]*?}`,
        "m"
      )
    )?.[0];

    expect(dbUsernameVar).toBeTruthy();
    expect(dbUsernameVar!).toMatch(/sensitive\s*=\s*true/);

    // Check db_password is marked as sensitive
    const dbPasswordVar = varsHcl.match(
      new RegExp(
        String.raw`variable\s+"db_password"\s*{[\s\S]*?}`,
        "m"
      )
    )?.[0];

    expect(dbPasswordVar).toBeTruthy();
    expect(dbPasswordVar!).toMatch(/sensitive\s*=\s*true/);
  });

  test("validates region-specific availability zone configurations", () => {
    const localsBlock = extractLocalsBlock(varsHcl);

    expect(localsBlock).toBeTruthy();
    
    // Check region_azs configuration
    expect(localsBlock!).toMatch(/"us-east-1"\s*=\s*\[\s*"us-east-1a",\s*"us-east-1b",\s*"us-east-1c"\s*\]/);
    expect(localsBlock!).toMatch(/"us-west-2"\s*=\s*\[\s*"us-west-2a",\s*"us-west-2b",\s*"us-west-2c"\s*\]/);
    
    // Check effective_azs logic
    expect(localsBlock!).toMatch(/effective_azs\s*=\s*length\(var\.availability_zones\)\s*>\s*0\s*\?\s*var\.availability_zones\s*:\s*local\.region_azs\[var\.region\]/);
  });

  test("validates MySQL 8.0.42 engine version configuration", () => {
    const localsBlock = extractLocalsBlock(varsHcl);

    expect(localsBlock).toBeTruthy();
    
    // Check that both staging and production use MySQL 8.0.42
    const stagingDbConfig = localsBlock!.match(/staging\s*=\s*{[\s\S]*?engine_version\s*=\s*"8\.0\.42"[\s\S]*?}/);
    const productionDbConfig = localsBlock!.match(/production\s*=\s*{[\s\S]*?engine_version\s*=\s*"8\.0\.42"[\s\S]*?}/);
    
    expect(stagingDbConfig).toBeTruthy();
    expect(productionDbConfig).toBeTruthy();
  });

  test("validates network CIDR segregation between environments", () => {
    const localsBlock = extractLocalsBlock(varsHcl);

    expect(localsBlock).toBeTruthy();
    
    // Staging uses 10.0.x.x network
    expect(localsBlock!).toMatch(/staging\s*=\s*{[\s\S]*?vpc_cidr\s*=\s*"10\.0\.0\.0\/16"/);
    expect(localsBlock!).toMatch(/"10\.0\.1\.0\/24"/); // staging public subnets
    expect(localsBlock!).toMatch(/"10\.0\.10\.0\/24"/); // staging private subnets
    expect(localsBlock!).toMatch(/"10\.0\.30\.0\/24"/); // staging database subnets
    
    // Production uses 10.1.x.x network
    expect(localsBlock!).toMatch(/production\s*=\s*{[\s\S]*?vpc_cidr\s*=\s*"10\.1\.0\.0\/16"/);
    expect(localsBlock!).toMatch(/"10\.1\.1\.0\/24"/); // production public subnets
    expect(localsBlock!).toMatch(/"10\.1\.10\.0\/24"/); // production private subnets
    expect(localsBlock!).toMatch(/"10\.1\.40\.0\/24"/); // production database subnets
  });

  test("validates production has higher resource allocations than staging", () => {
    const localsBlock = extractLocalsBlock(varsHcl);

    expect(localsBlock).toBeTruthy();
    
    // Instance configurations - production should have larger instances and more capacity
    expect(localsBlock!).toMatch(/staging\s*=\s*{[\s\S]*?instance_type\s*=\s*"t3\.micro"/);
    expect(localsBlock!).toMatch(/staging\s*=\s*{[\s\S]*?min_size\s*=\s*1/);
    expect(localsBlock!).toMatch(/staging\s*=\s*{[\s\S]*?max_size\s*=\s*2/);
    expect(localsBlock!).toMatch(/production\s*=\s*{[\s\S]*?instance_type\s*=\s*"t3\.medium"/);
    expect(localsBlock!).toMatch(/production\s*=\s*{[\s\S]*?min_size\s*=\s*2/);
    expect(localsBlock!).toMatch(/production\s*=\s*{[\s\S]*?max_size\s*=\s*6/);
    
    // Database configurations - production should have larger instance class and storage
    expect(localsBlock!).toMatch(/staging\s*=\s*{[\s\S]*?instance_class\s*=\s*"db\.t3\.micro"/);
    expect(localsBlock!).toMatch(/staging\s*=\s*{[\s\S]*?allocated_storage\s*=\s*20/);
    expect(localsBlock!).toMatch(/production\s*=\s*{[\s\S]*?instance_class\s*=\s*"db\.t3\.medium"/);
    expect(localsBlock!).toMatch(/production\s*=\s*{[\s\S]*?allocated_storage\s*=\s*100/);
    
    // Production should have multi-AZ and longer backup retention
    expect(localsBlock!).toMatch(/staging\s*=\s*{[\s\S]*?multi_az\s*=\s*false/);
    expect(localsBlock!).toMatch(/staging\s*=\s*{[\s\S]*?backup_retention\s*=\s*7/);
    expect(localsBlock!).toMatch(/production\s*=\s*{[\s\S]*?multi_az\s*=\s*true/);
    expect(localsBlock!).toMatch(/production\s*=\s*{[\s\S]*?backup_retention\s*=\s*30/);
  });

  test("validates production has enhanced security settings", () => {
    const localsBlock = extractLocalsBlock(varsHcl);

    expect(localsBlock).toBeTruthy();
    
    // Production should have deletion protection enabled
    expect(localsBlock!).toMatch(/staging\s*=\s*{[\s\S]*?deletion_protection\s*=\s*false/);
    expect(localsBlock!).toMatch(/production\s*=\s*{[\s\S]*?deletion_protection\s*=\s*true/);
    
    // Production should disable auto minor version upgrades for stability
    expect(localsBlock!).toMatch(/staging\s*=\s*{[\s\S]*?auto_minor_version_upgrade\s*=\s*true/);
    expect(localsBlock!).toMatch(/production\s*=\s*{[\s\S]*?auto_minor_version_upgrade\s*=\s*false/);
  });

  test("validates name_prefix construction", () => {
    const localsBlock = extractLocalsBlock(varsHcl);

    expect(localsBlock).toBeTruthy();
    
    // Check name_prefix uses project and environment
    expect(localsBlock!).toMatch(/name_prefix\s*=\s*"\$\{var\.project\}-\$\{var\.environment\}"/);
  });

  // NOTE: If the load balancer endpoint is reachable in production, this validates that the following 
  // infrastructure components are properly configured and working together:
  // - VPC: Network infrastructure with proper CIDR segregation and subnet allocation
  // - Security Groups: Proper ingress/egress rules for ALB, instances, and RDS
  // - IAM: Correct roles and policies for EC2 instances to access required AWS services
  // - Auto Scaling Group: Instance health checks, scaling policies, and load balancer integration
  // - RDS: Database connectivity and security group rules allowing application access
  // - Multi-AZ setup in production for high availability
  // A successful endpoint response indicates end-to-end infrastructure connectivity, security, and database integration
});