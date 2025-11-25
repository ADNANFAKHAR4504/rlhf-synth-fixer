// test/terraform.unit.test.ts
// Comprehensive unit tests for Terraform infrastructure defined in lib/
// These tests validate the structure and configuration without executing Terraform
// Focus: VPC, Networking, Security, Cross-Account Compatibility, No Hardcoding

import fs from "fs";
import path from "path";

const TAP_STACK_PATH = path.resolve(__dirname, "../lib/tap_stack.tf");
const PROVIDER_PATH = path.resolve(__dirname, "../lib/provider.tf");
const VARIABLES_PATH = path.resolve(__dirname, "../lib/variables.tf");
const OUTPUTS_PATH = path.resolve(__dirname, "../lib/outputs.tf");

describe("Terraform Infrastructure Unit Tests", () => {
  let tapStackContent: string;
  let providerContent: string;
  let variablesContent: string;
  let outputsContent: string;

  beforeAll(() => {
    tapStackContent = fs.readFileSync(TAP_STACK_PATH, "utf8");
    providerContent = fs.readFileSync(PROVIDER_PATH, "utf8");
    variablesContent = fs.readFileSync(VARIABLES_PATH, "utf8");
    outputsContent = fs.readFileSync(OUTPUTS_PATH, "utf8");
  });

  describe("File Structure and Existence", () => {
    test("tap_stack.tf file exists", () => {
      expect(fs.existsSync(TAP_STACK_PATH)).toBe(true);
    });

    test("provider.tf file exists", () => {
      expect(fs.existsSync(PROVIDER_PATH)).toBe(true);
    });

    test("variables.tf file exists", () => {
      expect(fs.existsSync(VARIABLES_PATH)).toBe(true);
    });

    test("outputs.tf file exists", () => {
      expect(fs.existsSync(OUTPUTS_PATH)).toBe(true);
    });

    test("all Terraform files are not empty", () => {
      expect(tapStackContent.length).toBeGreaterThan(0);
      expect(providerContent.length).toBeGreaterThan(0);
      expect(variablesContent.length).toBeGreaterThan(0);
      expect(outputsContent.length).toBeGreaterThan(0);
    });
  });

  describe("Provider Configuration Separation", () => {
    test("provider.tf contains terraform block", () => {
      expect(providerContent).toMatch(/terraform\s*{/);
    });

    test("provider.tf contains AWS provider configuration", () => {
      expect(providerContent).toMatch(/provider\s+"aws"\s*{/);
    });

    test("provider.tf requires Terraform >= 1.4.0", () => {
      expect(providerContent).toMatch(/required_version\s*=\s*">= 1\.4\.0"/);
    });

    test("provider.tf requires AWS provider >= 5.0", () => {
      expect(providerContent).toMatch(/version\s*=\s*">= 5\.0"/);
    });

    test("tap_stack.tf does NOT contain provider block (separation of concerns)", () => {
      expect(tapStackContent).not.toMatch(/provider\s+"aws"\s*{/);
    });

    test("tap_stack.tf does NOT contain terraform block (defined in provider.tf)", () => {
      expect(tapStackContent).not.toMatch(/terraform\s*{[\s\S]*required_version/);
    });
  });

  describe("Variables Configuration", () => {
    test("variables.tf defines aws_region variable", () => {
      expect(variablesContent).toMatch(/variable\s+"aws_region"\s*{/);
    });

    test("variables.tf defines environment_suffix variable", () => {
      expect(variablesContent).toMatch(/variable\s+"environment_suffix"\s*{/);
    });

    test("variables.tf defines tagging variables", () => {
      expect(variablesContent).toMatch(/variable\s+"repository"\s*{/);
      expect(variablesContent).toMatch(/variable\s+"commit_author"\s*{/);
      expect(variablesContent).toMatch(/variable\s+"pr_number"\s*{/);
      expect(variablesContent).toMatch(/variable\s+"team"\s*{/);
    });

    test("variables.tf defines networking variables", () => {
      expect(variablesContent).toMatch(/variable\s+"admin_cidr"\s*{/);
      expect(variablesContent).toMatch(/variable\s+"enable_flow_logs"\s*{/);
    });

    test("variables.tf defines Transit Gateway variables", () => {
      expect(variablesContent).toMatch(/variable\s+"enable_transit_gateway"\s*{/);
      expect(variablesContent).toMatch(/variable\s+"transit_gateway_id"\s*{/);
    });

    test("provider uses var.aws_region for cross-account compatibility", () => {
      expect(providerContent).toMatch(/region\s*=\s*var\.aws_region/);
    });

    test("all variables have descriptions", () => {
      const variableMatches = variablesContent.match(/variable\s+"\w+"\s*{/g) || [];
      const descriptionMatches = variablesContent.match(/description\s*=/g) || [];
      expect(descriptionMatches.length).toBe(variableMatches.length);
    });

    test("all variables have proper types defined", () => {
      const variableMatches = variablesContent.match(/variable\s+"\w+"\s*{/g) || [];
      const typeMatches = variablesContent.match(/type\s*=/g) || [];
      expect(typeMatches.length).toBe(variableMatches.length);
    });

    test("critical variables have default values for CI/CD flexibility", () => {
      // Ensure variables have defaults without hardcoding 
      expect(variablesContent).toMatch(/variable\s+"aws_region"[\s\S]*?default\s*=/);
      expect(variablesContent).toMatch(/variable\s+"environment_suffix"[\s\S]*?default\s*=/);
    });

    test("boolean variables have proper default values", () => {
      // Boolean variables should have explicit defaults
      expect(variablesContent).toMatch(/variable\s+"enable_flow_logs"[\s\S]*?default\s*=\s*(true|false)/);
      expect(variablesContent).toMatch(/variable\s+"enable_transit_gateway"[\s\S]*?default\s*=\s*(true|false)/);
    });
  });

  describe("Data Sources for Cross-Account Compatibility", () => {
    test("uses data source for current AWS account ID", () => {
      expect(tapStackContent).toMatch(/data\s+"aws_caller_identity"\s+"current"/);
    });

    test("uses data source for current region", () => {
      expect(tapStackContent).toMatch(/data\s+"aws_region"\s+"current"/);
    });

    test("uses data source for availability zones", () => {
      expect(tapStackContent).toMatch(/data\s+"aws_availability_zones"\s+"available"/);
    });

    test("references account ID dynamically (no hardcoded account IDs)", () => {
      expect(tapStackContent).toMatch(/account_id\s*=\s*data\.aws_caller_identity\.current\.account_id/);
      // Ensure no hardcoded account IDs
      expect(tapStackContent).not.toMatch(/[0-9]{12}/);
    });

    test("references region dynamically (no hardcoded regions)", () => {
      expect(tapStackContent).toMatch(/region\s*=\s*data\.aws_region\.current\.id/);
    });

    test("uses dynamic availability zone selection", () => {
      expect(tapStackContent).toMatch(/slice\(data\.aws_availability_zones\.available\.names/);
    });
  });

  describe("Local Values and Naming Convention", () => {
    test("defines consistent project naming", () => {
      expect(tapStackContent).toMatch(/project_name\s*=\s*"PaymentPlatform"/);
    });

    test("uses dynamic name_prefix for consistent naming", () => {
      expect(tapStackContent).toMatch(/name_prefix\s*=\s*"\$\{lower\(local\.project_name\)\}-\$\{lower\(local\.environment\)\}"/);
    });

    test("defines VPC CIDR blocks using RFC 1918 private ranges", () => {
      expect(tapStackContent).toMatch(/vpc_cidr\s*=\s*"10\.0\.0\.0\/16"/);
      expect(tapStackContent).toMatch(/public_cidrs\s*=\s*\["10\.0\.1\.0\/24"/);
      expect(tapStackContent).toMatch(/private_cidrs\s*=\s*\["10\.0\.11\.0\/24"/);
      expect(tapStackContent).toMatch(/db_cidrs\s*=\s*\["10\.0\.21\.0\/24"/);
    });

    test("defines common tags for resource consistency", () => {
      expect(tapStackContent).toMatch(/common_tags\s*=\s*{/);
      expect(tapStackContent).toMatch(/Project\s*=\s*local\.project_name/);
      expect(tapStackContent).toMatch(/Environment\s*=\s*local\.environment/);
      expect(tapStackContent).toMatch(/ManagedBy\s*=\s*"Terraform"/);
    });
  });

  describe("KMS Configuration", () => {
    test("creates KMS key for VPC encryption", () => {
      expect(tapStackContent).toMatch(/resource\s+"aws_kms_key"\s+"vpc_encryption"/);
    });

    test("KMS key has rotation enabled for security", () => {
      expect(tapStackContent).toMatch(/enable_key_rotation\s*=\s*true/);
    });

    test("KMS key has appropriate deletion window", () => {
      expect(tapStackContent).toMatch(/deletion_window_in_days\s*=\s*30/);
    });

    test("KMS key uses dynamic naming", () => {
      expect(tapStackContent).toMatch(/description\s*=\s*"KMS key for VPC encryption - \$\{local\.name_prefix\}"/);
    });

    test("KMS key policy allows current account", () => {
      expect(tapStackContent).toMatch(/arn:aws:iam::\$\{local\.account_id\}:root/);
    });

    test("KMS key policy includes VPC Flow Logs permissions", () => {
      expect(tapStackContent).toMatch(/vpc-flow-logs\.amazonaws\.com/);
    });

    test("creates KMS alias for easier reference", () => {
      expect(tapStackContent).toMatch(/resource\s+"aws_kms_alias"\s+"vpc_encryption"/);
      expect(tapStackContent).toMatch(/name\s*=\s*"alias\/\$\{local\.name_prefix\}-vpc"/);
    });
  });

  describe("VPC and Core Networking", () => {
    test("creates VPC with proper CIDR and DNS settings", () => {
      expect(tapStackContent).toMatch(/resource\s+"aws_vpc"\s+"main"/);
      expect(tapStackContent).toMatch(/cidr_block\s*=\s*local\.vpc_cidr/);
      expect(tapStackContent).toMatch(/enable_dns_hostnames\s*=\s*true/);
      expect(tapStackContent).toMatch(/enable_dns_support\s*=\s*true/);
    });

    test("creates Internet Gateway", () => {
      expect(tapStackContent).toMatch(/resource\s+"aws_internet_gateway"\s+"main"/);
      expect(tapStackContent).toMatch(/vpc_id\s*=\s*aws_vpc\.main\.id/);
    });

    test("creates public subnets across multiple AZs", () => {
      expect(tapStackContent).toMatch(/resource\s+"aws_subnet"\s+"public"/);
      expect(tapStackContent).toMatch(/for_each\s*=\s*{\s*for idx, cidr in local\.public_cidrs/);
      expect(tapStackContent).toMatch(/map_public_ip_on_launch\s*=\s*true/);
    });

    test("creates private subnets across multiple AZs", () => {
      expect(tapStackContent).toMatch(/resource\s+"aws_subnet"\s+"private"/);
      expect(tapStackContent).toMatch(/for_each\s*=\s*{\s*for idx, cidr in local\.private_cidrs/);
    });

    test("creates database subnets across multiple AZs", () => {
      expect(tapStackContent).toMatch(/resource\s+"aws_subnet"\s+"database"/);
      expect(tapStackContent).toMatch(/for_each\s*=\s*{\s*for idx, cidr in local\.db_cidrs/);
    });

    test("uses dynamic naming for all VPC resources", () => {
      expect(tapStackContent).toMatch(/Name\s*=\s*"\$\{local\.name_prefix\}-vpc"/);
      expect(tapStackContent).toMatch(/Name\s*=\s*"\$\{local\.name_prefix\}-igw"/);
    });

    test("properly tags subnets with tier information", () => {
      expect(tapStackContent).toMatch(/Tier\s*=\s*"Public"/);
      expect(tapStackContent).toMatch(/Tier\s*=\s*"Application"/);
      expect(tapStackContent).toMatch(/Tier\s*=\s*"Data"/);
    });
  });

  describe("NAT Gateway Configuration", () => {
    test("creates Elastic IPs for NAT Gateways", () => {
      expect(tapStackContent).toMatch(/resource\s+"aws_eip"\s+"nat"/);
      expect(tapStackContent).toMatch(/for_each\s*=\s*aws_subnet\.public/);
      expect(tapStackContent).toMatch(/domain\s*=\s*"vpc"/);
    });

    test("creates NAT Gateways for high availability", () => {
      expect(tapStackContent).toMatch(/resource\s+"aws_nat_gateway"\s+"main"/);
      expect(tapStackContent).toMatch(/for_each\s*=\s*aws_subnet\.public/);
    });

    test("NAT Gateways depend on Internet Gateway", () => {
      expect(tapStackContent).toMatch(/depends_on\s*=\s*\[aws_internet_gateway\.main\]/);
    });

    test("uses dynamic naming for NAT resources", () => {
      expect(tapStackContent).toMatch(/Name\s*=\s*"\$\{local\.name_prefix\}-nat-eip-\$\{each\.value\.availability_zone\}"/);
      expect(tapStackContent).toMatch(/Name\s*=\s*"\$\{local\.name_prefix\}-nat-\$\{each\.value\.availability_zone\}"/);
    });
  });

  describe("Route Tables and Routing", () => {
    test("creates public route table", () => {
      expect(tapStackContent).toMatch(/resource\s+"aws_route_table"\s+"public"/);
    });

    test("creates private route tables per AZ", () => {
      expect(tapStackContent).toMatch(/resource\s+"aws_route_table"\s+"private"/);
      expect(tapStackContent).toMatch(/for_each\s*=\s*aws_subnet\.private/);
    });

    test("creates database route table", () => {
      expect(tapStackContent).toMatch(/resource\s+"aws_route_table"\s+"database"/);
    });

    test("configures internet route for public subnets", () => {
      expect(tapStackContent).toMatch(/resource\s+"aws_route"\s+"public_internet"/);
      expect(tapStackContent).toMatch(/destination_cidr_block\s*=\s*"0\.0\.0\.0\/0"/);
      expect(tapStackContent).toMatch(/gateway_id\s*=\s*aws_internet_gateway\.main\.id/);
    });

    test("configures NAT routes for private subnets", () => {
      expect(tapStackContent).toMatch(/resource\s+"aws_route"\s+"private_nat"/);
      expect(tapStackContent).toMatch(/nat_gateway_id\s*=\s*aws_nat_gateway\.main\[each\.key\]\.id/);
    });

    test("associates subnets with appropriate route tables", () => {
      expect(tapStackContent).toMatch(/resource\s+"aws_route_table_association"\s+"public"/);
      expect(tapStackContent).toMatch(/resource\s+"aws_route_table_association"\s+"private"/);
      expect(tapStackContent).toMatch(/resource\s+"aws_route_table_association"\s+"database"/);
    });
  });

  describe("VPC Endpoints for Cost Optimization", () => {
    test("creates S3 VPC endpoint", () => {
      expect(tapStackContent).toMatch(/resource\s+"aws_vpc_endpoint"\s+"s3"/);
      expect(tapStackContent).toMatch(/service_name\s*=\s*"com\.amazonaws\.\$\{local\.region\}\.s3"/);
    });

    test("creates DynamoDB VPC endpoint", () => {
      expect(tapStackContent).toMatch(/resource\s+"aws_vpc_endpoint"\s+"dynamodb"/);
      expect(tapStackContent).toMatch(/service_name\s*=\s*"com\.amazonaws\.\$\{local\.region\}\.dynamodb"/);
    });

    test("VPC endpoints use dynamic region reference", () => {
      expect(tapStackContent).toMatch(/\$\{local\.region\}/);
    });

    test("VPC endpoints are associated with private route tables", () => {
      expect(tapStackContent).toMatch(/route_table_ids\s*=\s*concat\(/);
    });
  });

  describe("Network Access Control Lists (NACLs)", () => {
    test("creates public NACL", () => {
      expect(tapStackContent).toMatch(/resource\s+"aws_network_acl"\s+"public"/);
      expect(tapStackContent).toMatch(/subnet_ids\s*=\s*\[for subnet in aws_subnet\.public : subnet\.id\]/);
    });

    test("creates private NACL", () => {
      expect(tapStackContent).toMatch(/resource\s+"aws_network_acl"\s+"private"/);
      expect(tapStackContent).toMatch(/subnet_ids\s*=\s*\[for subnet in aws_subnet\.private : subnet\.id\]/);
    });

    test("creates database NACL", () => {
      expect(tapStackContent).toMatch(/resource\s+"aws_network_acl"\s+"database"/);
      expect(tapStackContent).toMatch(/subnet_ids\s*=\s*\[for subnet in aws_subnet\.database : subnet\.id\]/);
    });

    test("public NACL allows HTTPS traffic", () => {
      expect(tapStackContent).toMatch(/resource\s+"aws_network_acl_rule"\s+"public_https_ingress"/);
      expect(tapStackContent).toMatch(/from_port\s*=\s*443/);
      expect(tapStackContent).toMatch(/to_port\s*=\s*443/);
    });

    test("private NACL allows internal VPC traffic", () => {
      expect(tapStackContent).toMatch(/cidr_block\s*=\s*local\.vpc_cidr/);
    });

    test("database NACL allows PostgreSQL from private subnets", () => {
      expect(tapStackContent).toMatch(/from_port\s*=\s*5432/);
      expect(tapStackContent).toMatch(/to_port\s*=\s*5432/);
    });

    test("NACL rules use variable for admin access", () => {
      expect(tapStackContent).toMatch(/cidr_block\s*=\s*var\.admin_cidr/);
    });
  });

  describe("S3 Configuration for Flow Logs", () => {
    test("creates S3 bucket for flow logs conditionally", () => {
      expect(tapStackContent).toMatch(/resource\s+"aws_s3_bucket"\s+"flow_logs"/);
      expect(tapStackContent).toMatch(/count\s*=\s*var\.enable_flow_logs \? 1 : 0/);
    });

    test("S3 bucket uses dynamic naming with account ID", () => {
      expect(tapStackContent).toMatch(/bucket\s*=\s*"\$\{local\.name_prefix\}-vpc-flow-logs-\$\{local\.account_id\}"/);
    });

    test("configures S3 encryption using KMS", () => {
      expect(tapStackContent).toMatch(/resource\s+"aws_s3_bucket_server_side_encryption_configuration"\s+"flow_logs"/);
      expect(tapStackContent).toMatch(/sse_algorithm\s*=\s*"aws:kms"/);
      expect(tapStackContent).toMatch(/kms_master_key_id\s*=\s*aws_kms_key\.vpc_encryption\.arn/);
    });

    test("blocks all public access to S3 bucket", () => {
      expect(tapStackContent).toMatch(/resource\s+"aws_s3_bucket_public_access_block"\s+"flow_logs"/);
      expect(tapStackContent).toMatch(/block_public_acls\s*=\s*true/);
      expect(tapStackContent).toMatch(/block_public_policy\s*=\s*true/);
      expect(tapStackContent).toMatch(/ignore_public_acls\s*=\s*true/);
      expect(tapStackContent).toMatch(/restrict_public_buckets\s*=\s*true/);
    });

    test("configures lifecycle policy for log retention", () => {
      expect(tapStackContent).toMatch(/resource\s+"aws_s3_bucket_lifecycle_configuration"\s+"flow_logs"/);
      expect(tapStackContent).toMatch(/filter\s*{/);
      expect(tapStackContent).toMatch(/expiration\s*{/);
      expect(tapStackContent).toMatch(/days\s*=\s*var\.flow_logs_retention_days/);
    });
  });

  describe("VPC Flow Logs", () => {
    test("creates VPC flow logs conditionally", () => {
      expect(tapStackContent).toMatch(/resource\s+"aws_flow_log"\s+"main"/);
      expect(tapStackContent).toMatch(/count\s*=\s*var\.enable_flow_logs \? 1 : 0/);
    });

    test("flow logs capture ALL traffic", () => {
      expect(tapStackContent).toMatch(/traffic_type\s*=\s*"ALL"/);
    });

    test("flow logs use S3 as destination", () => {
      expect(tapStackContent).toMatch(/log_destination_type\s*=\s*"s3"/);
    });

    test("flow logs use parquet format for efficiency", () => {
      expect(tapStackContent).toMatch(/file_format\s*=\s*"parquet"/);
    });

    test("flow logs enable hourly partitioning", () => {
      expect(tapStackContent).toMatch(/per_hour_partition\s*=\s*true/);
    });
  });

  describe("Transit Gateway Configuration", () => {
    test("creates Transit Gateway conditionally", () => {
      expect(tapStackContent).toMatch(/resource\s+"aws_ec2_transit_gateway"\s+"main"/);
      expect(tapStackContent).toMatch(/count\s*=\s*var\.enable_transit_gateway && var\.transit_gateway_id == "" \? 1 : 0/);
    });

    test("creates Transit Gateway VPC attachment", () => {
      expect(tapStackContent).toMatch(/resource\s+"aws_ec2_transit_gateway_vpc_attachment"\s+"main"/);
      expect(tapStackContent).toMatch(/count\s*=\s*var\.enable_transit_gateway \? 1 : 0/);
    });

    test("Transit Gateway attachment uses private subnets", () => {
      expect(tapStackContent).toMatch(/subnet_ids\s*=\s*\[for subnet in aws_subnet\.private : subnet\.id\]/);
    });

    test("Transit Gateway supports existing or new TGW", () => {
      expect(tapStackContent).toMatch(/transit_gateway_id\s*=\s*var\.transit_gateway_id != "" \? var\.transit_gateway_id : aws_ec2_transit_gateway\.main\[0\]\.id/);
    });

    test("configures cross-region routing", () => {
      expect(tapStackContent).toMatch(/resource\s+"aws_route"\s+"private_to_tgw"/);
      expect(tapStackContent).toMatch(/destination_cidr_block\s*=\s*"192\.168\.0\.0\/16"/);
    });

    test("Transit Gateway uses dynamic naming", () => {
      expect(tapStackContent).toMatch(/description\s*=\s*"Transit Gateway for \$\{local\.name_prefix\}"/);
    });
  });

  describe("Outputs Configuration", () => {
    test("outputs.tf defines VPC information", () => {
      expect(outputsContent).toMatch(/output\s+"vpc_id"\s*{/);
      expect(outputsContent).toMatch(/output\s+"vpc_cidr"\s*{/);
    });

    test("outputs subnet IDs with proper structure", () => {
      expect(outputsContent).toMatch(/output\s+"public_subnet_ids"\s*{/);
      expect(outputsContent).toMatch(/output\s+"private_subnet_ids"\s*{/);
      expect(outputsContent).toMatch(/output\s+"database_subnet_ids"\s*{/);
      expect(outputsContent).toMatch(/value\s*=\s*{\s*for k, v in aws_subnet\.public : k => v\.id\s*}/);
    });

    test("outputs NAT Gateway information", () => {
      expect(outputsContent).toMatch(/output\s+"nat_gateway_eips"\s*{/);
      expect(outputsContent).toMatch(/output\s+"nat_gateway_ids"\s*{/);
    });

    test("outputs KMS key information", () => {
      expect(outputsContent).toMatch(/output\s+"kms_key_id"\s*{/);
      expect(outputsContent).toMatch(/output\s+"kms_key_arn"\s*{/);
    });

    test("outputs VPC endpoints", () => {
      expect(outputsContent).toMatch(/output\s+"vpc_endpoints"\s*{/);
    });

    test("outputs conditional resources", () => {
      expect(outputsContent).toMatch(/output\s+"flow_logs_s3_bucket"\s*{/);
      expect(outputsContent).toMatch(/output\s+"transit_gateway_id"\s*{/);
      expect(outputsContent).toMatch(/var\.enable_flow_logs \? aws_s3_bucket\.flow_logs\[0\]\.id : null/);
    });

    test("all outputs have descriptions", () => {
      const outputMatches = outputsContent.match(/output\s+"\w+"\s*{/g) || [];
      const descriptionMatches = outputsContent.match(/description\s*=/g) || [];
      expect(descriptionMatches.length).toBe(outputMatches.length);
    });
  });

  describe("Security and Hardcoding Validation", () => {
    test("no hardcoded AWS account IDs", () => {
      expect(tapStackContent).not.toMatch(/[0-9]{12}/);
      expect(providerContent).not.toMatch(/[0-9]{12}/);
      expect(variablesContent).not.toMatch(/[0-9]{12}/);
    });

    test("no hardcoded AWS regions in resources", () => {
      // Resources should use dynamic region references, not hardcoded values
      expect(tapStackContent).not.toMatch(/"us-east-1"/);
      expect(tapStackContent).not.toMatch(/"us-west-2"/);
      expect(tapStackContent).not.toMatch(/"eu-west-1"/);
      expect(tapStackContent).not.toMatch(/"ap-southeast-1"/);
    });

    test("no hardcoded AWS credentials", () => {
      const allContent = tapStackContent + providerContent + variablesContent + outputsContent;
      expect(allContent).not.toMatch(/AKIA[0-9A-Z]{16}/);
      expect(allContent).not.toMatch(/aws_access_key_id/);
      expect(allContent).not.toMatch(/aws_secret_access_key/);
    });

    test("no hardcoded ARNs (except service ARNs)", () => {
      // Check for hardcoded account IDs or regions in ARNs
      // Allow service ARNs like "arn:aws:iam::aws:policy/" or action ARNs like "arn:aws:states:::"
      const hardcodedAccountArns = tapStackContent.match(/arn:aws:[^:]*::[0-9]{12}:/g) || [];
      const hardcodedRegionArns = tapStackContent.match(/arn:aws:[^:]*:us-[^:$]*:/g) || [];
      expect(hardcodedAccountArns.length).toBe(0);
      expect(hardcodedRegionArns.length).toBe(0);
    });

    test("uses variables for all configurable values", () => {
      expect(tapStackContent).toMatch(/var\.environment_suffix/);
      expect(tapStackContent).toMatch(/var\.admin_cidr/);
      expect(tapStackContent).toMatch(/var\.enable_flow_logs/);
      expect(tapStackContent).toMatch(/var\.enable_transit_gateway/);
    });

    test("provider uses variables for region and tags", () => {
      expect(providerContent).toMatch(/region\s*=\s*var\.aws_region/);
      expect(providerContent).toMatch(/Environment\s*=\s*var\.environment_suffix/);
    });
  });

  describe("Cross-Account Executability", () => {
    test("uses dynamic account references", () => {
      expect(tapStackContent).toMatch(/data\.aws_caller_identity\.current\.account_id/);
    });

    test("uses dynamic region references", () => {
      expect(tapStackContent).toMatch(/data\.aws_region\.current\.id/);
    });

    test("uses dynamic availability zone selection", () => {
      expect(tapStackContent).toMatch(/data\.aws_availability_zones\.available/);
    });

    test("bucket names include account ID for global uniqueness", () => {
      expect(tapStackContent).toMatch(/\$\{local\.account_id\}/);
    });

    test("IAM policies reference current account dynamically", () => {
      expect(tapStackContent).toMatch(/arn:aws:iam::\$\{local\.account_id\}:root/);
    });

    test("service names use dynamic region", () => {
      expect(tapStackContent).toMatch(/com\.amazonaws\.\$\{local\.region\}\./);
    });
  });

  describe("Resource Tagging Consistency", () => {
    test("uses consistent tagging strategy", () => {
      expect(tapStackContent).toMatch(/tags\s*=\s*merge\(local\.common_tags/);
    });

    test("provider applies default tags", () => {
      expect(providerContent).toMatch(/default_tags\s*{/);
      expect(providerContent).toMatch(/Environment\s*=\s*var\.environment_suffix/);
      expect(providerContent).toMatch(/Repository\s*=\s*var\.repository/);
    });

    test("common tags include required metadata", () => {
      expect(tapStackContent).toMatch(/Project\s*=\s*local\.project_name/);
      expect(tapStackContent).toMatch(/Environment\s*=\s*local\.environment/);
      expect(tapStackContent).toMatch(/ManagedBy\s*=\s*"Terraform"/);
    });
  });

  describe("Naming Convention Consistency", () => {
    test("uses consistent name_prefix throughout", () => {
      expect(tapStackContent).toMatch(/\$\{local\.name_prefix\}-vpc/);
      expect(tapStackContent).toMatch(/\$\{local\.name_prefix\}-igw/);
      expect(tapStackContent).toMatch(/\$\{local\.name_prefix\}-nat/);
    });

    test("resource names are lowercase and hyphenated", () => {
      expect(tapStackContent).toMatch(/lower\(local\.project_name\)/);
      expect(tapStackContent).toMatch(/lower\(local\.environment\)/);
    });

    test("subnet names include availability zone", () => {
      expect(tapStackContent).toMatch(/\$\{each\.value\.availability_zone\}/);
    });
  });

  describe("Integration and Cross-Service Validation", () => {
    test("VPC endpoints integrate with route tables", () => {
      expect(tapStackContent).toMatch(/route_table_ids\s*=\s*concat\(/);
      expect(tapStackContent).toMatch(/\[for rt in aws_route_table\.private : rt\.id\]/);
    });

    test("NAT Gateways integrate with EIPs", () => {
      expect(tapStackContent).toMatch(/allocation_id\s*=\s*aws_eip\.nat\[each\.key\]\.id/);
    });

    test("subnets properly distribute across AZs", () => {
      expect(tapStackContent).toMatch(/availability_zone\s*=\s*local\.azs\[idx\]/);
    });

    test("flow logs integrate with KMS and S3", () => {
      expect(tapStackContent).toMatch(/kms_master_key_id\s*=\s*aws_kms_key\.vpc_encryption\.arn/);
    });

    test("Transit Gateway routes integrate with existing routing", () => {
      expect(tapStackContent).toMatch(/depends_on\s*=\s*\[aws_ec2_transit_gateway_vpc_attachment\.main\]/);
    });
  });

  describe("Terraform Best Practices", () => {
    test("uses for_each for multiple similar resources", () => {
      expect(tapStackContent).toMatch(/for_each\s*=\s*{\s*for idx, cidr in local\.public_cidrs/);
      expect(tapStackContent).toMatch(/for_each\s*=\s*aws_subnet\.public/);
    });

    test("uses count for conditional resources", () => {
      expect(tapStackContent).toMatch(/count\s*=\s*var\.enable_flow_logs \? 1 : 0/);
      expect(tapStackContent).toMatch(/count\s*=\s*var\.enable_transit_gateway/);
    });

    test("uses depends_on for explicit dependencies", () => {
      expect(tapStackContent).toMatch(/depends_on\s*=\s*\[aws_internet_gateway\.main\]/);
    });

    test("uses lifecycle rules where appropriate", () => {
      expect(tapStackContent).toMatch(/lifecycle_configuration/);
    });
  });
});
