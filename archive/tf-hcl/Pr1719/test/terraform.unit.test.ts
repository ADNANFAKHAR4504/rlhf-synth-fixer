// Comprehensive unit tests for Terraform HCL infrastructure
// Tests provider configuration, main stack, and all modules

import fs from "fs";
import path from "path";

// File paths
const PROVIDER_PATH = path.resolve(__dirname, "../lib/provider.tf");
const TAP_STACK_PATH = path.resolve(__dirname, "../lib/tap_stack.tf");
const VPC_MODULE_PATH = path.resolve(__dirname, "../lib/modules/vpc");
const IAM_MODULE_PATH = path.resolve(__dirname, "../lib/modules/iam");
const COMPUTE_MODULE_PATH = path.resolve(__dirname, "../lib/modules/compute");
const DATABASE_MODULE_PATH = path.resolve(__dirname, "../lib/modules/database");
const LOGGING_MODULE_PATH = path.resolve(__dirname, "../lib/modules/logging");

describe("Terraform Infrastructure - Provider Configuration", () => {
  test("provider.tf exists", () => {
    expect(fs.existsSync(PROVIDER_PATH)).toBe(true);
  });

  test("provider.tf has correct Terraform version requirement", () => {
    const content = fs.readFileSync(PROVIDER_PATH, "utf8");
    expect(content).toMatch(/required_version\s*=\s*">=\s*1\.4\.0"/);
  });

  test("provider.tf has AWS provider configuration", () => {
    const content = fs.readFileSync(PROVIDER_PATH, "utf8");
    expect(content).toMatch(/source\s*=\s*"hashicorp\/aws"/);
    expect(content).toMatch(/version\s*=\s*">=\s*5\.0"/);
  });

  test("provider.tf has S3 backend configuration", () => {
    const content = fs.readFileSync(PROVIDER_PATH, "utf8");
    expect(content).toMatch(/backend\s+"s3"\s*\{\s*\}/);
  });
});

describe("Terraform Infrastructure - Main Stack (tap_stack.tf)", () => {
  test("tap_stack.tf exists", () => {
    expect(fs.existsSync(TAP_STACK_PATH)).toBe(true);
  });

  test("tap_stack.tf declares AWS providers with aliases", () => {
    const content = fs.readFileSync(TAP_STACK_PATH, "utf8");
    expect(content).toMatch(/\bprovider\s+"aws"\s*\{/);
    expect(content).toMatch(/alias\s*=\s*"us_east_1"/);
    expect(content).toMatch(/alias\s*=\s*"eu_west_1"/);
    expect(content).toMatch(/alias\s*=\s*"ap_southeast_1"/);
  });

  test("tap_stack.tf declares locals with common tags and regions", () => {
    const content = fs.readFileSync(TAP_STACK_PATH, "utf8");
    expect(content).toMatch(/locals\s*\{/);
    expect(content).toMatch(/common_tags\s*=/);
    expect(content).toMatch(/regions\s*=/);
    expect(content).toMatch(/environment\s*=\s*"dev"/);
    expect(content).toMatch(/owner\s*=\s*"platform-team"/);
  });

  test("tap_stack.tf declares VPC module", () => {
    const content = fs.readFileSync(TAP_STACK_PATH, "utf8");
    expect(content).toMatch(/module\s+"vpc_us_east_1"\s*\{/);
    expect(content).toMatch(/source\s*=\s*"\.\/modules\/vpc"/);
    expect(content).toMatch(/vpc_cidr\s*=\s*local\.regions\.us_east_1\.cidr/);
  });

  test("tap_stack.tf declares IAM module", () => {
    const content = fs.readFileSync(TAP_STACK_PATH, "utf8");
    expect(content).toMatch(/module\s+"iam_us_east_1"\s*\{/);
    expect(content).toMatch(/source\s*=\s*"\.\/modules\/iam"/);
    expect(content).toMatch(/region\s*=\s*local\.regions\.us_east_1\.name/);
  });

  test("tap_stack.tf declares compute module", () => {
    const content = fs.readFileSync(TAP_STACK_PATH, "utf8");
    expect(content).toMatch(/module\s+"compute_us_east_1"\s*\{/);
    expect(content).toMatch(/source\s*=\s*"\.\/modules\/compute"/);
    expect(content).toMatch(/vpc_id\s*=\s*module\.vpc_us_east_1\.vpc_id/);
    expect(content).toMatch(/instance_profile_name\s*=\s*module\.iam_us_east_1\.ec2_instance_profile_name/);
  });

  test("tap_stack.tf declares database module", () => {
    const content = fs.readFileSync(TAP_STACK_PATH, "utf8");
    expect(content).toMatch(/module\s+"database_us_east_1"\s*\{/);
    expect(content).toMatch(/source\s*=\s*"\.\/modules\/database"/);
    expect(content).toMatch(/is_primary\s*=\s*true/);
    expect(content).toMatch(/private_subnet_ids\s*=\s*module\.vpc_us_east_1\.private_subnet_ids/);
  });

  test("tap_stack.tf declares logging module", () => {
    const content = fs.readFileSync(TAP_STACK_PATH, "utf8");
    expect(content).toMatch(/module\s+"logging_us_east_1"\s*\{/);
    expect(content).toMatch(/source\s*=\s*"\.\/modules\/logging"/);
  });

  test("tap_stack.tf declares EU West 1 infrastructure modules", () => {
    const content = fs.readFileSync(TAP_STACK_PATH, "utf8");
    expect(content).toMatch(/module\s+"vpc_eu_west_1"\s*\{/);
    expect(content).toMatch(/module\s+"iam_eu_west_1"\s*\{/);
    expect(content).toMatch(/module\s+"compute_eu_west_1"\s*\{/);
    expect(content).toMatch(/module\s+"database_eu_west_1"\s*\{/);
    expect(content).toMatch(/module\s+"logging_eu_west_1"\s*\{/);
  });

  test("tap_stack.tf declares AP Southeast 1 infrastructure modules", () => {
    const content = fs.readFileSync(TAP_STACK_PATH, "utf8");
    expect(content).toMatch(/module\s+"vpc_ap_southeast_1"\s*\{/);
    expect(content).toMatch(/module\s+"iam_ap_southeast_1"\s*\{/);
    expect(content).toMatch(/module\s+"compute_ap_southeast_1"\s*\{/);
    expect(content).toMatch(/module\s+"database_ap_southeast_1"\s*\{/);
    expect(content).toMatch(/module\s+"logging_ap_southeast_1"\s*\{/);
  });

  test("tap_stack.tf declares VPC peering module", () => {
    const content = fs.readFileSync(TAP_STACK_PATH, "utf8");
    expect(content).toMatch(/module\s+"vpc_peering"\s*\{/);
    expect(content).toMatch(/source\s*=\s*"\.\/modules\/vpc-peering"/);
  });

  test("tap_stack.tf declares Route 53 module", () => {
    const content = fs.readFileSync(TAP_STACK_PATH, "utf8");
    expect(content).toMatch(/module\s+"route53"\s*\{/);
    expect(content).toMatch(/source\s*=\s*"\.\/modules\/route53"/);
  });

  test("tap_stack.tf has comprehensive outputs section", () => {
    const content = fs.readFileSync(TAP_STACK_PATH, "utf8");
    expect(content).toMatch(/# =============================================================================/);
    expect(content).toMatch(/# OUTPUTS/);
    expect(content).toMatch(/# =============================================================================/);
  });

  test("tap_stack.tf has proper module dependencies", () => {
    const content = fs.readFileSync(TAP_STACK_PATH, "utf8");
    // Check that compute module references VPC and IAM outputs
    expect(content).toMatch(/vpc_id\s*=\s*module\.vpc_us_east_1\.vpc_id/);
    expect(content).toMatch(/subnet_ids\s*=\s*module\.vpc_us_east_1\.private_subnet_ids/);
    expect(content).toMatch(/instance_profile_name\s*=\s*module\.iam_us_east_1\.ec2_instance_profile_name/);
    // Check that database module references VPC outputs
    expect(content).toMatch(/private_subnet_ids\s*=\s*module\.vpc_us_east_1\.private_subnet_ids/);
    expect(content).toMatch(/database_security_group_id\s*=\s*module\.vpc_us_east_1\.database_security_group_id/);
  });
});

describe("Terraform Infrastructure - VPC Module", () => {
  test("VPC module files exist", () => {
    expect(fs.existsSync(path.join(VPC_MODULE_PATH, "main.tf"))).toBe(true);
    expect(fs.existsSync(path.join(VPC_MODULE_PATH, "variables.tf"))).toBe(true);
    expect(fs.existsSync(path.join(VPC_MODULE_PATH, "outputs.tf"))).toBe(true);
  });

  test("VPC module variables are properly defined", () => {
    const variablesContent = fs.readFileSync(path.join(VPC_MODULE_PATH, "variables.tf"), "utf8");
    expect(variablesContent).toMatch(/variable\s+"vpc_cidr"/);
    expect(variablesContent).toMatch(/variable\s+"region"/);
    expect(variablesContent).toMatch(/variable\s+"environment"/);
    expect(variablesContent).toMatch(/variable\s+"public_subnet_count"/);
    expect(variablesContent).toMatch(/variable\s+"private_subnet_count"/);
    expect(variablesContent).toMatch(/variable\s+"common_tags"/);
  });

  test("VPC module creates VPC with proper configuration", () => {
    const mainContent = fs.readFileSync(path.join(VPC_MODULE_PATH, "main.tf"), "utf8");
    expect(mainContent).toMatch(/resource\s+"aws_vpc"\s+"main"/);
    expect(mainContent).toMatch(/cidr_block\s*=\s*var\.vpc_cidr/);
    expect(mainContent).toMatch(/enable_dns_hostnames\s*=\s*true/);
    expect(mainContent).toMatch(/enable_dns_support\s*=\s*true/);
  });

  test("VPC module creates internet gateway", () => {
    const mainContent = fs.readFileSync(path.join(VPC_MODULE_PATH, "main.tf"), "utf8");
    expect(mainContent).toMatch(/resource\s+"aws_internet_gateway"\s+"main"/);
    expect(mainContent).toMatch(/vpc_id\s*=\s*aws_vpc\.main\.id/);
  });

  test("VPC module creates public and private subnets", () => {
    const mainContent = fs.readFileSync(path.join(VPC_MODULE_PATH, "main.tf"), "utf8");
    expect(mainContent).toMatch(/resource\s+"aws_subnet"\s+"public"/);
    expect(mainContent).toMatch(/resource\s+"aws_subnet"\s+"private"/);
    expect(mainContent).toMatch(/map_public_ip_on_launch\s*=\s*true/);
  });

  test("VPC module creates NAT gateways", () => {
    const mainContent = fs.readFileSync(path.join(VPC_MODULE_PATH, "main.tf"), "utf8");
    expect(mainContent).toMatch(/resource\s+"aws_nat_gateway"\s+"main"/);
    expect(mainContent).toMatch(/resource\s+"aws_eip"\s+"nat"/);
  });

  test("VPC module creates route tables", () => {
    const mainContent = fs.readFileSync(path.join(VPC_MODULE_PATH, "main.tf"), "utf8");
    expect(mainContent).toMatch(/resource\s+"aws_route_table"\s+"public"/);
    expect(mainContent).toMatch(/resource\s+"aws_route_table"\s+"private"/);
  });

  test("VPC module outputs are properly defined", () => {
    const outputsContent = fs.readFileSync(path.join(VPC_MODULE_PATH, "outputs.tf"), "utf8");
    expect(outputsContent).toMatch(/output\s+"vpc_id"/);
    expect(outputsContent).toMatch(/output\s+"public_subnet_ids"/);
    expect(outputsContent).toMatch(/output\s+"private_subnet_ids"/);
  });
});

describe("Terraform Infrastructure - IAM Module", () => {
  test("IAM module files exist", () => {
    expect(fs.existsSync(path.join(IAM_MODULE_PATH, "main.tf"))).toBe(true);
    expect(fs.existsSync(path.join(IAM_MODULE_PATH, "variables.tf"))).toBe(true);
    expect(fs.existsSync(path.join(IAM_MODULE_PATH, "outputs.tf"))).toBe(true);
  });

  test("IAM module variables are properly defined", () => {
    const variablesContent = fs.readFileSync(path.join(IAM_MODULE_PATH, "variables.tf"), "utf8");
    expect(variablesContent).toMatch(/variable\s+"region"/);
    expect(variablesContent).toMatch(/variable\s+"environment"/);
    expect(variablesContent).toMatch(/variable\s+"common_tags"/);
  });

  test("IAM module creates EC2 role with proper assume role policy", () => {
    const mainContent = fs.readFileSync(path.join(IAM_MODULE_PATH, "main.tf"), "utf8");
    expect(mainContent).toMatch(/resource\s+"aws_iam_role"\s+"ec2_role"/);
    expect(mainContent).toMatch(/Service\s*=\s*"ec2\.amazonaws\.com"/);
    expect(mainContent).toMatch(/Action\s*=\s*"sts:AssumeRole"/);
  });

  test("IAM module creates EC2 instance profile", () => {
    const mainContent = fs.readFileSync(path.join(IAM_MODULE_PATH, "main.tf"), "utf8");
    expect(mainContent).toMatch(/resource\s+"aws_iam_instance_profile"\s+"ec2_profile"/);
    expect(mainContent).toMatch(/role\s*=\s*aws_iam_role\.ec2_role\.name/);
  });

  test("IAM module creates RDS enhanced monitoring role", () => {
    const mainContent = fs.readFileSync(path.join(IAM_MODULE_PATH, "main.tf"), "utf8");
    expect(mainContent).toMatch(/resource\s+"aws_iam_role"\s+"rds_enhanced_monitoring"/);
    expect(mainContent).toMatch(/Service\s*=\s*"monitoring\.rds\.amazonaws\.com"/);
  });

  test("IAM module attaches RDS enhanced monitoring policy", () => {
    const mainContent = fs.readFileSync(path.join(IAM_MODULE_PATH, "main.tf"), "utf8");
    expect(mainContent).toMatch(/resource\s+"aws_iam_role_policy_attachment"\s+"rds_enhanced_monitoring"/);
    expect(mainContent).toMatch(/AmazonRDSEnhancedMonitoringRole/);
  });

  test("IAM module outputs are properly defined", () => {
    const outputsContent = fs.readFileSync(path.join(IAM_MODULE_PATH, "outputs.tf"), "utf8");
    expect(outputsContent).toMatch(/output\s+"ec2_instance_profile_name"/);
  });
});

describe("Terraform Infrastructure - Compute Module", () => {
  test("Compute module files exist", () => {
    expect(fs.existsSync(path.join(COMPUTE_MODULE_PATH, "main.tf"))).toBe(true);
    expect(fs.existsSync(path.join(COMPUTE_MODULE_PATH, "variables.tf"))).toBe(true);
    expect(fs.existsSync(path.join(COMPUTE_MODULE_PATH, "user_data.sh"))).toBe(true);
  });

  test("Compute module variables are properly defined", () => {
    const variablesContent = fs.readFileSync(path.join(COMPUTE_MODULE_PATH, "variables.tf"), "utf8");
    expect(variablesContent).toMatch(/variable\s+"environment"/);
    expect(variablesContent).toMatch(/variable\s+"region"/);
    expect(variablesContent).toMatch(/variable\s+"vpc_id"/);
    expect(variablesContent).toMatch(/variable\s+"subnet_ids"/);
    expect(variablesContent).toMatch(/variable\s+"security_group_id"/);
    expect(variablesContent).toMatch(/variable\s+"instance_profile_name"/);
  });

  test("Compute module creates launch template", () => {
    const mainContent = fs.readFileSync(path.join(COMPUTE_MODULE_PATH, "main.tf"), "utf8");
    expect(mainContent).toMatch(/resource\s+"aws_launch_template"\s+"main"/);
    expect(mainContent).toMatch(/data\s+"aws_ami"\s+"amazon_linux"/);
    expect(mainContent).toMatch(/vpc_security_group_ids\s*=\s*\[var\.security_group_id\]/);
    expect(mainContent).toMatch(/iam_instance_profile/);
  });

  test("Compute module creates autoscaling group", () => {
    const mainContent = fs.readFileSync(path.join(COMPUTE_MODULE_PATH, "main.tf"), "utf8");
    expect(mainContent).toMatch(/resource\s+"aws_autoscaling_group"\s+"main"/);
    expect(mainContent).toMatch(/vpc_zone_identifier\s*=\s*var\.subnet_ids/);
    expect(mainContent).toMatch(/health_check_type\s*=\s*"ELB"/);
  });

  test("Compute module creates application load balancer", () => {
    const mainContent = fs.readFileSync(path.join(COMPUTE_MODULE_PATH, "main.tf"), "utf8");
    expect(mainContent).toMatch(/resource\s+"aws_lb"\s+"main"/);
    expect(mainContent).toMatch(/load_balancer_type\s*=\s*"application"/);
    expect(mainContent).toMatch(/security_groups\s*=\s*\[var\.security_group_id\]/);
  });

  test("Compute module user data script exists", () => {
    const userDataContent = fs.readFileSync(path.join(COMPUTE_MODULE_PATH, "user_data.sh"), "utf8");
    expect(userDataContent).toMatch(/^#!\/bin\/bash/);
    expect(userDataContent).toMatch(/yum update -y/);
  });
});

describe("Terraform Infrastructure - Database Module", () => {
  test("Database module files exist", () => {
    expect(fs.existsSync(path.join(DATABASE_MODULE_PATH, "main.tf"))).toBe(true);
    expect(fs.existsSync(path.join(DATABASE_MODULE_PATH, "variables.tf"))).toBe(true);
  });

  test("Database module variables are properly defined", () => {
    const variablesContent = fs.readFileSync(path.join(DATABASE_MODULE_PATH, "variables.tf"), "utf8");
    expect(variablesContent).toMatch(/variable\s+"environment"/);
    expect(variablesContent).toMatch(/variable\s+"region"/);
    expect(variablesContent).toMatch(/variable\s+"private_subnet_ids"/);
    expect(variablesContent).toMatch(/variable\s+"database_security_group_id"/);
    expect(variablesContent).toMatch(/variable\s+"is_primary"/);
  });

  test("Database module generates secure password", () => {
    const mainContent = fs.readFileSync(path.join(DATABASE_MODULE_PATH, "main.tf"), "utf8");
    expect(mainContent).toMatch(/resource\s+"random_password"\s+"database"/);
    expect(mainContent).toMatch(/length\s*=\s*32/);
    expect(mainContent).toMatch(/special\s*=\s*false/);
  });

  test("Database module stores password in SSM Parameter Store", () => {
    const mainContent = fs.readFileSync(path.join(DATABASE_MODULE_PATH, "main.tf"), "utf8");
    expect(mainContent).toMatch(/resource\s+"aws_ssm_parameter"\s+"database_password"/);
    expect(mainContent).toMatch(/type\s*=\s*"SecureString"/);
    expect(mainContent).toMatch(/value\s*=\s*random_password\.database\.result/);
  });

  test("Database module creates subnet group", () => {
    const mainContent = fs.readFileSync(path.join(DATABASE_MODULE_PATH, "main.tf"), "utf8");
    expect(mainContent).toMatch(/resource\s+"aws_db_subnet_group"\s+"main"/);
    expect(mainContent).toMatch(/subnet_ids\s*=\s*var\.private_subnet_ids/);
  });

  test("Database module creates parameter group", () => {
    const mainContent = fs.readFileSync(path.join(DATABASE_MODULE_PATH, "main.tf"), "utf8");
    expect(mainContent).toMatch(/resource\s+"aws_db_parameter_group"\s+"main"/);
    expect(mainContent).toMatch(/family\s*=\s*"postgres15"/);
  });

  test("Database module creates primary database instance", () => {
    const mainContent = fs.readFileSync(path.join(DATABASE_MODULE_PATH, "main.tf"), "utf8");
    expect(mainContent).toMatch(/resource\s+"aws_db_instance"\s+"main"/);
    expect(mainContent).toMatch(/engine\s*=\s*"postgres"/);
    expect(mainContent).toMatch(/storage_encrypted\s*=\s*true/);
    expect(mainContent).toMatch(/backup_retention_period\s*=\s*7/);
  });

  test("Database module supports read replicas", () => {
    const mainContent = fs.readFileSync(path.join(DATABASE_MODULE_PATH, "main.tf"), "utf8");
    expect(mainContent).toMatch(/resource\s+"aws_db_instance"\s+"read_replica"/);
    expect(mainContent).toMatch(/replicate_source_db\s*=\s*var\.source_db_identifier/);
  });
});

describe("Terraform Infrastructure - Logging Module", () => {
  test("Logging module files exist", () => {
    expect(fs.existsSync(path.join(LOGGING_MODULE_PATH, "main.tf"))).toBe(true);
    expect(fs.existsSync(path.join(LOGGING_MODULE_PATH, "variables.tf"))).toBe(true);
  });

  test("Logging module variables are properly defined", () => {
    const variablesContent = fs.readFileSync(path.join(LOGGING_MODULE_PATH, "variables.tf"), "utf8");
    expect(variablesContent).toMatch(/variable\s+"environment"/);
    expect(variablesContent).toMatch(/variable\s+"region"/);
    expect(variablesContent).toMatch(/variable\s+"log_retention_days"/);
    expect(variablesContent).toMatch(/variable\s+"common_tags"/);
  });

  test("Logging module creates CloudWatch log groups", () => {
    const mainContent = fs.readFileSync(path.join(LOGGING_MODULE_PATH, "main.tf"), "utf8");
    expect(mainContent).toMatch(/resource\s+"aws_cloudwatch_log_group"\s+"application_logs"/);
    expect(mainContent).toMatch(/resource\s+"aws_cloudwatch_log_group"\s+"rds_logs"/);
    expect(mainContent).toMatch(/retention_in_days\s*=\s*var\.log_retention_days/);
  });

  test("Logging module creates CloudWatch dashboard", () => {
    const mainContent = fs.readFileSync(path.join(LOGGING_MODULE_PATH, "main.tf"), "utf8");
    expect(mainContent).toMatch(/resource\s+"aws_cloudwatch_dashboard"\s+"main"/);
    expect(mainContent).toMatch(/dashboard_body\s*=\s*jsonencode/);
  });
});

describe("Terraform Infrastructure - Security and Compliance", () => {
  test("All modules apply common tags", () => {
    const modules = [VPC_MODULE_PATH, IAM_MODULE_PATH, COMPUTE_MODULE_PATH, DATABASE_MODULE_PATH, LOGGING_MODULE_PATH];
    
    modules.forEach(modulePath => {
      const mainContent = fs.readFileSync(path.join(modulePath, "main.tf"), "utf8");
      expect(mainContent).toMatch(/merge\(var\.common_tags/);
    });
  });

  test("Database module has proper security configurations", () => {
    const mainContent = fs.readFileSync(path.join(DATABASE_MODULE_PATH, "main.tf"), "utf8");
    expect(mainContent).toMatch(/storage_encrypted\s*=\s*true/);
    expect(mainContent).toMatch(/vpc_security_group_ids/);
    expect(mainContent).toMatch(/enabled_cloudwatch_logs_exports/);
  });

  test("Compute module has proper security configurations", () => {
    const mainContent = fs.readFileSync(path.join(COMPUTE_MODULE_PATH, "main.tf"), "utf8");
    expect(mainContent).toMatch(/vpc_security_group_ids/);
    expect(mainContent).toMatch(/iam_instance_profile/);
  });

  test("VPC module has proper network security", () => {
    const mainContent = fs.readFileSync(path.join(VPC_MODULE_PATH, "main.tf"), "utf8");
    expect(mainContent).toMatch(/enable_dns_hostnames\s*=\s*true/);
    expect(mainContent).toMatch(/enable_dns_support\s*=\s*true/);
    expect(mainContent).toMatch(/map_public_ip_on_launch\s*=\s*true/);
  });
});

describe("Terraform Infrastructure - Module Dependencies", () => {
  test("Main stack has proper module dependencies", () => {
    const content = fs.readFileSync(TAP_STACK_PATH, "utf8");
    
    // VPC module should be referenced by compute and database
    expect(content).toMatch(/vpc_id\s*=\s*module\.vpc_us_east_1\.vpc_id/);
    expect(content).toMatch(/subnet_ids\s*=\s*module\.vpc_us_east_1\.private_subnet_ids/);
    expect(content).toMatch(/public_subnet_ids\s*=\s*module\.vpc_us_east_1\.public_subnet_ids/);
    
    // IAM module should be referenced by compute
    expect(content).toMatch(/instance_profile_name\s*=\s*module\.iam_us_east_1\.ec2_instance_profile_name/);
  });

  test("All modules have required outputs", () => {
    // Check VPC outputs
    const vpcOutputs = fs.readFileSync(path.join(VPC_MODULE_PATH, "outputs.tf"), "utf8");
    expect(vpcOutputs).toMatch(/output\s+"vpc_id"/);
    expect(vpcOutputs).toMatch(/output\s+"public_subnet_ids"/);
    expect(vpcOutputs).toMatch(/output\s+"private_subnet_ids"/);
    
    // Check IAM outputs
    const iamOutputs = fs.readFileSync(path.join(IAM_MODULE_PATH, "outputs.tf"), "utf8");
    expect(iamOutputs).toMatch(/output\s+"ec2_instance_profile_name"/);
    
    // Check Compute outputs
    const computeOutputs = fs.readFileSync(path.join(COMPUTE_MODULE_PATH, "outputs.tf"), "utf8");
    expect(computeOutputs).toMatch(/output\s+"launch_template_id"/);
    expect(computeOutputs).toMatch(/output\s+"load_balancer_dns_name"/);
    expect(computeOutputs).toMatch(/output\s+"autoscaling_group_name"/);
    
    // Check Database outputs
    const databaseOutputs = fs.readFileSync(path.join(DATABASE_MODULE_PATH, "outputs.tf"), "utf8");
    expect(databaseOutputs).toMatch(/output\s+"database_endpoint"/);
    expect(databaseOutputs).toMatch(/output\s+"database_instance_id"/);
    expect(databaseOutputs).toMatch(/output\s+"ssm_parameter_name"/);
    
    // Check Logging outputs
    const loggingOutputs = fs.readFileSync(path.join(LOGGING_MODULE_PATH, "outputs.tf"), "utf8");
    expect(loggingOutputs).toMatch(/output\s+"application_log_group_name"/);
    expect(loggingOutputs).toMatch(/output\s+"dashboard_name"/);
  });
});

describe("Terraform Infrastructure - Best Practices", () => {
  test("All modules use consistent naming conventions", () => {
    const modules = [VPC_MODULE_PATH, IAM_MODULE_PATH, COMPUTE_MODULE_PATH, DATABASE_MODULE_PATH, LOGGING_MODULE_PATH];
    
    modules.forEach(modulePath => {
      const mainContent = fs.readFileSync(path.join(modulePath, "main.tf"), "utf8");
      // Check for consistent naming pattern with UniqueSuffix: ${var.environment}-resource-${var.region}-${var.common_tags.UniqueSuffix}
      expect(mainContent).toMatch(/\$\{var\.environment\}-.*-\$\{var\.common_tags\.UniqueSuffix\}/);
    });
  });

  test("All modules have proper variable validation", () => {
    const modules = [VPC_MODULE_PATH, IAM_MODULE_PATH, COMPUTE_MODULE_PATH, DATABASE_MODULE_PATH, LOGGING_MODULE_PATH];
    
    modules.forEach(modulePath => {
      const variablesContent = fs.readFileSync(path.join(modulePath, "variables.tf"), "utf8");
      expect(variablesContent).toMatch(/description\s*=/);
      expect(variablesContent).toMatch(/type\s*=/);
    });
  });

  test("Main stack uses locals for configuration", () => {
    const content = fs.readFileSync(TAP_STACK_PATH, "utf8");
    expect(content).toMatch(/locals\s*\{/);
    expect(content).toMatch(/common_tags\s*=/);
    expect(content).toMatch(/regions\s*=/);
  });

  test("Main stack has comprehensive outputs", () => {
    const content = fs.readFileSync(TAP_STACK_PATH, "utf8");
    expect(content).toMatch(/output\s+"vpc_id"/);
    expect(content).toMatch(/output\s+"load_balancer_dns_name"/);
    expect(content).toMatch(/output\s+"database_endpoint"/);
    expect(content).toMatch(/output\s+"infrastructure_summary"/);
  });
});

describe("Terraform Infrastructure - VPC Peering Module", () => {
  const VPC_PEERING_MODULE_PATH = path.resolve(__dirname, "../lib/modules/vpc-peering");

  test("VPC peering module files exist", () => {
    expect(fs.existsSync(path.join(VPC_PEERING_MODULE_PATH, "main.tf"))).toBe(true);
    expect(fs.existsSync(path.join(VPC_PEERING_MODULE_PATH, "variables.tf"))).toBe(true);
    expect(fs.existsSync(path.join(VPC_PEERING_MODULE_PATH, "outputs.tf"))).toBe(true);
    expect(fs.existsSync(path.join(VPC_PEERING_MODULE_PATH, "versions.tf"))).toBe(true);
  });

  test("VPC peering module variables are properly defined", () => {
    const variablesContent = fs.readFileSync(path.join(VPC_PEERING_MODULE_PATH, "variables.tf"), "utf8");
    expect(variablesContent).toMatch(/variable\s+"vpc_us_east_1_id"/);
    expect(variablesContent).toMatch(/variable\s+"vpc_eu_west_1_id"/);
    expect(variablesContent).toMatch(/variable\s+"vpc_ap_southeast_1_id"/);
    expect(variablesContent).toMatch(/variable\s+"environment"/);
    expect(variablesContent).toMatch(/variable\s+"common_tags"/);
  });

  test("VPC peering module creates peering connections", () => {
    const mainContent = fs.readFileSync(path.join(VPC_PEERING_MODULE_PATH, "main.tf"), "utf8");
    expect(mainContent).toMatch(/resource\s+"aws_vpc_peering_connection"/);
    expect(mainContent).toMatch(/resource\s+"aws_vpc_peering_connection_accepter"/);
  });

  test("VPC peering module creates peering connections and accepters", () => {
    const mainContent = fs.readFileSync(path.join(VPC_PEERING_MODULE_PATH, "main.tf"), "utf8");
    expect(mainContent).toMatch(/resource\s+"aws_vpc_peering_connection"/);
    expect(mainContent).toMatch(/resource\s+"aws_vpc_peering_connection_accepter"/);
  });
});

describe("Terraform Infrastructure - Route 53 Module", () => {
  const ROUTE53_MODULE_PATH = path.resolve(__dirname, "../lib/modules/route53");

  test("Route 53 module files exist", () => {
    expect(fs.existsSync(path.join(ROUTE53_MODULE_PATH, "main.tf"))).toBe(true);
    expect(fs.existsSync(path.join(ROUTE53_MODULE_PATH, "variables.tf"))).toBe(true);
    expect(fs.existsSync(path.join(ROUTE53_MODULE_PATH, "outputs.tf"))).toBe(true);
    expect(fs.existsSync(path.join(ROUTE53_MODULE_PATH, "versions.tf"))).toBe(true);
  });

  test("Route 53 module variables are properly defined", () => {
    const variablesContent = fs.readFileSync(path.join(ROUTE53_MODULE_PATH, "variables.tf"), "utf8");
    expect(variablesContent).toMatch(/variable\s+"domain_name"/);
    expect(variablesContent).toMatch(/variable\s+"environment"/);
    expect(variablesContent).toMatch(/variable\s+"common_tags"/);
    expect(variablesContent).toMatch(/variable\s+"us_east_1_lb_dns"/);
    expect(variablesContent).toMatch(/variable\s+"eu_west_1_lb_dns"/);
    expect(variablesContent).toMatch(/variable\s+"ap_southeast_1_lb_dns"/);
  });

  test("Route 53 module creates hosted zone", () => {
    const mainContent = fs.readFileSync(path.join(ROUTE53_MODULE_PATH, "main.tf"), "utf8");
    expect(mainContent).toMatch(/resource\s+"aws_route53_zone"/);
  });

  test("Route 53 module creates health checks", () => {
    const mainContent = fs.readFileSync(path.join(ROUTE53_MODULE_PATH, "main.tf"), "utf8");
    expect(mainContent).toMatch(/resource\s+"aws_route53_health_check"/);
  });

  test("Route 53 module creates DNS records", () => {
    const mainContent = fs.readFileSync(path.join(ROUTE53_MODULE_PATH, "main.tf"), "utf8");
    expect(mainContent).toMatch(/resource\s+"aws_route53_record"/);
  });
});
