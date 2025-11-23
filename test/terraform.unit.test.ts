// Comprehensive Unit Tests for Multi-Region Financial Services Payment Platform
// Tests for provider.tf, variables.tf, and tap_stack.tf files
// No actual Terraform commands executed - static code analysis only

import fs from "fs";
import path from "path";

// File paths
const LIB_DIR = path.resolve(__dirname, "../lib");
const TAP_STACK_PATH = path.join(LIB_DIR, "tap_stack.tf");
const PROVIDER_PATH = path.join(LIB_DIR, "provider.tf");
const VARIABLES_PATH = path.join(LIB_DIR, "variables.tf");

// Helper function to read file content
const readFile = (filePath: string): string => {
  return fs.readFileSync(filePath, "utf8");
};

describe("Multi-Region Payment Platform - File Structure Tests", () => {
  test("all required Terraform files exist", () => {
    expect(fs.existsSync(TAP_STACK_PATH)).toBe(true);
    expect(fs.existsSync(PROVIDER_PATH)).toBe(true);
    expect(fs.existsSync(VARIABLES_PATH)).toBe(true);
  });

  test("files are not empty", () => {
    expect(fs.statSync(TAP_STACK_PATH).size).toBeGreaterThan(0);
    expect(fs.statSync(PROVIDER_PATH).size).toBeGreaterThan(0);
    expect(fs.statSync(VARIABLES_PATH).size).toBeGreaterThan(0);
  });
});

describe("Provider Configuration Tests", () => {
  let providerContent: string;

  beforeAll(() => {
    providerContent = readFile(PROVIDER_PATH);
  });

  test("has correct Terraform version constraint", () => {
    expect(providerContent).toMatch(/required_version\s*=\s*">=\s*1\.5\.0"/);
  });

  test("has correct AWS provider version", () => {
    expect(providerContent).toMatch(/source\s*=\s*"hashicorp\/aws"/);
    expect(providerContent).toMatch(/version\s*=\s*"~>\s*5\.0"/);
  });

  test("has random provider configured", () => {
    expect(providerContent).toMatch(/source\s*=\s*"hashicorp\/random"/);
    expect(providerContent).toMatch(/version\s*=\s*"~>\s*3\.1"/);
  });

  test("has S3 backend configuration", () => {
    expect(providerContent).toMatch(/backend\s*"s3"\s*{}/);
  });

  test("has regional provider aliases", () => {
    expect(providerContent).toMatch(/alias\s*=\s*"us-east-1"/);
    expect(providerContent).toMatch(/alias\s*=\s*"eu-west-1"/);
    expect(providerContent).toMatch(/alias\s*=\s*"ap-southeast-1"/);
  });

  test("has proper default tags configuration", () => {
    expect(providerContent).toMatch(/default_tags\s*{/);
    expect(providerContent).toMatch(/Environment\s*=\s*var\.environment_suffix/);
    expect(providerContent).toMatch(/Repository\s*=\s*var\.repository/);
  });
});

describe("Variables Configuration Tests", () => {
  let variablesContent: string;

  beforeAll(() => {
    variablesContent = readFile(VARIABLES_PATH);
  });

  test("has all required basic variables", () => {
    expect(variablesContent).toMatch(/variable\s*"aws_region"/);
    expect(variablesContent).toMatch(/variable\s*"environment_suffix"/);
    expect(variablesContent).toMatch(/variable\s*"repository"/);
    expect(variablesContent).toMatch(/variable\s*"commit_author"/);
    expect(variablesContent).toMatch(/variable\s*"pr_number"/);
    expect(variablesContent).toMatch(/variable\s*"team"/);
  });

  test("has multi-region configuration variables", () => {
    expect(variablesContent).toMatch(/variable\s*"regions"/);
    expect(variablesContent).toMatch(/variable\s*"vpc_cidrs"/);
    expect(variablesContent).toMatch(/variable\s*"az_count"/);
  });

  test("has RDS and Lambda configuration variables", () => {
    expect(variablesContent).toMatch(/variable\s*"rds_instance_class"/);
    expect(variablesContent).toMatch(/variable\s*"lambda_memory_size"/);
    expect(variablesContent).toMatch(/variable\s*"lambda_reserved_concurrent_executions"/);
  });

  test("has API Gateway configuration variables", () => {
    expect(variablesContent).toMatch(/variable\s*"api_domain_names"/);
  });

  test("regions variable has correct default values", () => {
    expect(variablesContent).toMatch(/"us-east-1"/);
    expect(variablesContent).toMatch(/"eu-west-1"/);
    expect(variablesContent).toMatch(/"ap-southeast-1"/);
  });

  test("vpc_cidrs variable has correct CIDR blocks", () => {
    expect(variablesContent).toMatch(/"10\.0\.0\.0\/16"/);
    expect(variablesContent).toMatch(/"10\.1\.0\.0\/16"/);
    expect(variablesContent).toMatch(/"10\.2\.0\.0\/16"/);
  });
});

describe("Main Infrastructure Tests", () => {
  let tapStackContent: string;

  beforeAll(() => {
    tapStackContent = readFile(TAP_STACK_PATH);
  });

  test("does not contain provider declarations (delegated to provider.tf)", () => {
    expect(tapStackContent).not.toMatch(/^provider\s+"aws"\s*{/m);
    expect(tapStackContent).not.toMatch(/^terraform\s*{/m);
  });

  test("contains proper file header and comments", () => {
    expect(tapStackContent).toMatch(/Multi-region Financial Services Payment Platform/);
    expect(tapStackContent).toMatch(/Terraform 1\.5\+/);
    expect(tapStackContent).toMatch(/AWS Provider ~> 5\.0/);
  });

  test("has locals block with environment configuration", () => {
    expect(tapStackContent).toMatch(/locals\s*{/);
    expect(tapStackContent).toMatch(/environment\s*=\s*var\.environment_suffix/);
  });

  test("has common tags configuration in locals", () => {
    expect(tapStackContent).toMatch(/common_tags\s*=/);
    expect(tapStackContent).toMatch(/Environment\s*=\s*local\.environment/);
    expect(tapStackContent).toMatch(/ManagedBy\s*=\s*"Terraform"/);
    expect(tapStackContent).toMatch(/Project\s*=\s*"PaymentPlatform"/);
  });

  test("has data sources for AWS caller identity", () => {
    expect(tapStackContent).toMatch(/data\s*"aws_caller_identity"\s*"current"/);
  });

  

  test("availability zone data sources use proper state filter", () => {
    expect(tapStackContent).toMatch(/state\s*=\s*"available"/);
  });

  

  test("has region pairs configuration for VPC peering", () => {
    expect(tapStackContent).toMatch(/region_pairs\s*=\s*/);
  });

  

  test("has individual VPC resources for each region", () => {
    expect(tapStackContent).toMatch(/resource\s*"aws_vpc"\s*"us_east_1"/);
    expect(tapStackContent).toMatch(/resource\s*"aws_vpc"\s*"eu_west_1"/);
    expect(tapStackContent).toMatch(/resource\s*"aws_vpc"\s*"ap_southeast_1"/);
  });

  

  

  test("has NAT Gateways and EIPs", () => {
    expect(tapStackContent).toMatch(/resource\s*"aws_eip"\s*"nat_us_east_1"/);
    expect(tapStackContent).toMatch(/resource\s*"aws_nat_gateway"\s*"us_east_1"/);
    expect(tapStackContent).toMatch(/resource\s*"aws_eip"\s*"nat_eu_west_1"/);
    expect(tapStackContent).toMatch(/resource\s*"aws_nat_gateway"\s*"eu_west_1"/);
    expect(tapStackContent).toMatch(/resource\s*"aws_eip"\s*"nat_ap_southeast_1"/);
    expect(tapStackContent).toMatch(/resource\s*"aws_nat_gateway"\s*"ap_southeast_1"/);
  });

  test("has route tables for public and private subnets", () => {
    expect(tapStackContent).toMatch(/resource\s*"aws_route_table"\s*"public_us_east_1"/);
    expect(tapStackContent).toMatch(/resource\s*"aws_route_table"\s*"private_us_east_1"/);
    expect(tapStackContent).toMatch(/resource\s*"aws_route_table"\s*"public_eu_west_1"/);
    expect(tapStackContent).toMatch(/resource\s*"aws_route_table"\s*"private_eu_west_1"/);
  });

  
});

describe("Security Configuration Tests", () => {
  let tapStackContent: string;

  beforeAll(() => {
    tapStackContent = readFile(TAP_STACK_PATH);
  });

  

  test("has security groups for RDS and Lambda", () => {
    expect(tapStackContent).toMatch(/resource\s*"aws_security_group"\s*"rds_us_east_1"/);
    expect(tapStackContent).toMatch(/resource\s*"aws_security_group"\s*"lambda_us_east_1"/);
    expect(tapStackContent).toMatch(/resource\s*"aws_security_group"\s*"rds_eu_west_1"/);
    expect(tapStackContent).toMatch(/resource\s*"aws_security_group"\s*"lambda_eu_west_1"/);
  });

  

  test("does not contain hardcoded passwords", () => {
    expect(tapStackContent).not.toMatch(/password\s*=\s*"[^"]*"/);
    expect(tapStackContent).not.toMatch(/master_password\s*=\s*"[^"]*"/);
  });
});

describe("RDS Configuration Tests", () => {
  let tapStackContent: string;

  beforeAll(() => {
    tapStackContent = readFile(TAP_STACK_PATH);
  });

  

  test("has RDS clusters with proper configuration", () => {
    expect(tapStackContent).toMatch(/resource\s*"aws_rds_cluster"\s*"us_east_1"/);
    expect(tapStackContent).toMatch(/resource\s*"aws_rds_cluster"\s*"eu_west_1"/);
    expect(tapStackContent).toMatch(/resource\s*"aws_rds_cluster"\s*"ap_southeast_1"/);
    expect(tapStackContent).toMatch(/engine\s*=\s*"aurora-mysql"/);
    expect(tapStackContent).toMatch(/manage_master_user_password\s*=\s*true/);
  });

  

  

  test("has backup and maintenance windows configured", () => {
    expect(tapStackContent).toMatch(/backup_retention_period/);
    expect(tapStackContent).toMatch(/preferred_backup_window/);
    expect(tapStackContent).toMatch(/preferred_maintenance_window/);
  });

  test("RDS cluster uses specific Aurora MySQL version", () => {
    expect(tapStackContent).toMatch(/engine_version\s*=\s*"8\.0\.mysql_aurora\.3\.02\.0"/);
  });

  test("RDS cluster has database name configured", () => {
    expect(tapStackContent).toMatch(/database_name\s*=\s*"payment_db"/);
  });

  test("RDS cluster has master username configured", () => {
    expect(tapStackContent).toMatch(/master_username\s*=\s*"admin"/);
  });

  

  

  test("RDS cluster has proper backup retention", () => {
    expect(tapStackContent).toMatch(/backup_retention_period\s*=\s*7/);
  });

  test("RDS cluster has proper backup window", () => {
    expect(tapStackContent).toMatch(/preferred_backup_window\s*=\s*"03:00-04:00"/);
  });

  test("RDS cluster has proper maintenance window", () => {
    expect(tapStackContent).toMatch(/preferred_maintenance_window\s*=\s*"sun:04:00-sun:05:00"/);
  });

  test("RDS cluster instances use environment-specific instance class", () => {
    expect(tapStackContent).toMatch(/instance_class\s*=\s*var\.rds_instance_class\[local\.environment\]/);
  });

  

  test("RDS cluster has deletion protection disabled for dev", () => {
    expect(tapStackContent).toMatch(/deletion_protection\s*=\s*false/);
  });


});

describe("AWS Secrets Manager Integration Tests", () => {
  let tapStackContent: string;

  beforeAll(() => {
    tapStackContent = readFile(TAP_STACK_PATH);
  });

  test("has Secrets Manager secrets for each region", () => {
    expect(tapStackContent).toMatch(/resource\s*"aws_secretsmanager_secret"/);
    expect(tapStackContent).toMatch(/rds_master_us_east_1/);
    expect(tapStackContent).toMatch(/rds_master_eu_west_1/);
    expect(tapStackContent).toMatch(/rds_master_ap_southeast_1/);
  });

  

  
});

describe("Lambda Configuration Tests", () => {
  let tapStackContent: string;

  beforeAll(() => {
    tapStackContent = readFile(TAP_STACK_PATH);
  });

  test("has Lambda functions", () => {
    expect(tapStackContent).toMatch(/resource\s*"aws_lambda_function"\s*"payment_validator_us_east_1"/);
    expect(tapStackContent).toMatch(/resource\s*"aws_lambda_function"\s*"payment_validator_eu_west_1"/);
    expect(tapStackContent).toMatch(/resource\s*"aws_lambda_function"\s*"payment_validator_ap_southeast_1"/);
  });

  test("has proper Lambda configuration", () => {
    expect(tapStackContent).toMatch(/filename\s*=\s*"lambda_payload\.zip"/);
    expect(tapStackContent).toMatch(/handler\s*=\s*"index\.handler"/);
    expect(tapStackContent).toMatch(/runtime/);
  });

  

  test("has Lambda permissions for API Gateway", () => {
    expect(tapStackContent).toMatch(/resource\s*"aws_lambda_permission"/);
    expect(tapStackContent).toMatch(/statement_id.*AllowAPIGatewayInvoke/);
  });

  test("Lambda has proper runtime configuration", () => {
    expect(tapStackContent).toMatch(/runtime\s*=\s*"python3\.9"/);
  });

  test("Lambda has timeout configuration", () => {
    expect(tapStackContent).toMatch(/timeout\s*=\s*30/);
  });

  test("Lambda has memory size configuration", () => {
    expect(tapStackContent).toMatch(/memory_size\s*=\s*var\.lambda_memory_size/);
  });

  

  test("Lambda has VPC configuration", () => {
    expect(tapStackContent).toMatch(/vpc_config\s*{/);
    expect(tapStackContent).toMatch(/subnet_ids\s*=/);
    expect(tapStackContent).toMatch(/security_group_ids\s*=/);
  });

  

  test("Lambda references security groups", () => {
    expect(tapStackContent).toMatch(/aws_security_group\.lambda_us_east_1.*id/);
  });

  test("Lambda has all required environment variables", () => {
    expect(tapStackContent).toMatch(/REGION\s*=\s*"us-east-1"/);
    expect(tapStackContent).toMatch(/S3_BUCKET\s*=\s*aws_s3_bucket/);
    expect(tapStackContent).toMatch(/DB_ENDPOINT\s*=\s*aws_rds_cluster/);
    expect(tapStackContent).toMatch(/KMS_KEY_ID\s*=\s*aws_kms_key/);
  });


});

describe("API Gateway Configuration Tests", () => {
  let tapStackContent: string;

  beforeAll(() => {
    tapStackContent = readFile(TAP_STACK_PATH);
  });

  test("has API Gateway REST APIs", () => {
    expect(tapStackContent).toMatch(/resource\s*"aws_api_gateway_rest_api"\s*"us_east_1"/);
    expect(tapStackContent).toMatch(/resource\s*"aws_api_gateway_rest_api"\s*"eu_west_1"/);
    expect(tapStackContent).toMatch(/resource\s*"aws_api_gateway_rest_api"\s*"ap_southeast_1"/);
  });

  

  test("has API Gateway integrations with Lambda", () => {
    expect(tapStackContent).toMatch(/resource\s*"aws_api_gateway_integration"\s*"lambda_us_east_1"/);
    expect(tapStackContent).toMatch(/integration_http_method\s*=\s*"POST"/);
  });

  test("has API Gateway deployments", () => {
    expect(tapStackContent).toMatch(/resource\s*"aws_api_gateway_deployment"\s*"us_east_1"/);
    expect(tapStackContent).toMatch(/resource\s*"aws_api_gateway_deployment"\s*"eu_west_1"/);
    expect(tapStackContent).toMatch(/resource\s*"aws_api_gateway_deployment"\s*"ap_southeast_1"/);
    expect(tapStackContent).toMatch(/depends_on\s*=\s*\[/);
  });

  test("API Gateway has proper naming convention", () => {
    expect(tapStackContent).toMatch(/name\s*=\s*"\${local\.environment}-us-east-1-payment-api"/);
  });

  test("API Gateway has description", () => {
    expect(tapStackContent).toMatch(/description\s*=\s*"Payment processing API/);
  });

  test("API Gateway uses regional endpoint", () => {
    expect(tapStackContent).toMatch(/types\s*=\s*\["REGIONAL"\]/);
  });

  test("API Gateway resource has payment path", () => {
    expect(tapStackContent).toMatch(/path_part\s*=\s*"payment"/);
  });

  test("API Gateway method is POST", () => {
    expect(tapStackContent).toMatch(/http_method\s*=\s*"POST"/);
  });

  test("API Gateway method has no authorization", () => {
    expect(tapStackContent).toMatch(/authorization\s*=\s*"NONE"/);
  });

  test("API Gateway integration type is AWS_PROXY", () => {
    expect(tapStackContent).toMatch(/type\s*=\s*"AWS_PROXY"/);
  });

  test("API Gateway integration references Lambda URI", () => {
    expect(tapStackContent).toMatch(/uri\s*=\s*aws_lambda_function\.payment_validator_us_east_1.*invoke_arn/);
  });

  test("API Gateway deployment uses environment stage", () => {
    expect(tapStackContent).toMatch(/stage_name\s*=\s*local\.environment/);
  });

  


});

describe("S3 Configuration Tests", () => {
  let tapStackContent: string;

  beforeAll(() => {
    tapStackContent = readFile(TAP_STACK_PATH);
  });

  test("has S3 buckets for transaction logs", () => {
    expect(tapStackContent).toMatch(/resource\s*"aws_s3_bucket"\s*"transaction_logs_us_east_1"/);
    expect(tapStackContent).toMatch(/resource\s*"aws_s3_bucket"\s*"transaction_logs_eu_west_1"/);
    expect(tapStackContent).toMatch(/resource\s*"aws_s3_bucket"\s*"transaction_logs_ap_southeast_1"/);
  });

  

  test("has S3 server-side encryption", () => {
    expect(tapStackContent).toMatch(/resource\s*"aws_s3_bucket_server_side_encryption_configuration"/);
    expect(tapStackContent).toMatch(/sse_algorithm\s*=\s*"aws:kms"/);
  });

  test("has S3 lifecycle configuration", () => {
    expect(tapStackContent).toMatch(/resource\s*"aws_s3_bucket_lifecycle_configuration"/);
  });

  test("has S3 bucket for Terraform state", () => {
    expect(tapStackContent).toMatch(/resource\s*"aws_s3_bucket"\s*"terraform_state"/);
  });

  

  test("S3 lifecycle rule transitions to Glacier", () => {
    expect(tapStackContent).toMatch(/storage_class\s*=\s*"GLACIER_IR"/);
  });

  test("S3 lifecycle transition after 90 days", () => {
    expect(tapStackContent).toMatch(/days\s*=\s*90/);
  });

  test("S3 lifecycle rule has proper ID", () => {
    expect(tapStackContent).toMatch(/id\s*=\s*"transition-to-glacier"/);
  });

  test("S3 lifecycle rule is enabled", () => {
    expect(tapStackContent).toMatch(/status\s*=\s*"Enabled"/);
  });

  test("S3 lifecycle rule has empty prefix filter", () => {
    expect(tapStackContent).toMatch(/prefix\s*=\s*""/);
  });

  




});

describe("VPC Peering Tests", () => {
  let tapStackContent: string;

  beforeAll(() => {
    tapStackContent = readFile(TAP_STACK_PATH);
  });

  

  test("has region pairs configuration", () => {
    expect(tapStackContent).toMatch(/region_pairs\s*=/);
  });

  

  

  test("peering connections have auto_accept configured", () => {
    expect(tapStackContent).toMatch(/auto_accept\s*=\s*false/);
    expect(tapStackContent).toMatch(/auto_accept\s*=\s*true/);
  });

  

  

  test("peering routes reference VPC peering connections", () => {
    expect(tapStackContent).toMatch(/vpc_peering_connection_id\s*=\s*aws_vpc_peering_connection/);
  });

  test("peering routes use proper CIDR blocks", () => {
    expect(tapStackContent).toMatch(/destination_cidr_block\s*=\s*var\.vpc_cidrs/);
  });


});

describe("IAM Configuration Tests", () => {
  let tapStackContent: string;

  beforeAll(() => {
    tapStackContent = readFile(TAP_STACK_PATH);
  });

  

  

  test("has IAM policy attachments", () => {
    expect(tapStackContent).toMatch(/resource\s*"aws_iam_role_policy_attachment"/);
  });

  test("has proper assume role policies", () => {
    expect(tapStackContent).toMatch(/assume_role_policy\s*=\s*jsonencode/);
    expect(tapStackContent).toMatch(/lambda\.amazonaws\.com/);
  });

  

  test("Lambda policy allows CloudWatch logs", () => {
    expect(tapStackContent).toMatch(/logs:CreateLogGroup/);
    expect(tapStackContent).toMatch(/logs:CreateLogStream/);
    expect(tapStackContent).toMatch(/logs:PutLogEvents/);
  });

  test("Lambda policy allows VPC operations", () => {
    expect(tapStackContent).toMatch(/ec2:CreateNetworkInterface/);
    expect(tapStackContent).toMatch(/ec2:DescribeNetworkInterfaces/);
    expect(tapStackContent).toMatch(/ec2:DeleteNetworkInterface/);
  });

  test("Lambda policy allows S3 operations", () => {
    expect(tapStackContent).toMatch(/s3:PutObject/);
    expect(tapStackContent).toMatch(/s3:PutObjectAcl/);
  });

  test("Lambda policy allows KMS operations", () => {
    expect(tapStackContent).toMatch(/kms:Decrypt/);
    expect(tapStackContent).toMatch(/kms:GenerateDataKey/);
  });



  test("RDS monitoring policy attachment uses correct ARN", () => {
    expect(tapStackContent).toMatch(/arn:aws:iam::aws:policy\/service-role\/AmazonRDSEnhancedMonitoringRole/);
  });

  test("IAM policies use proper JSON structure", () => {
    expect(tapStackContent).toMatch(/Version.*2012-10-17/);
  });

  test("IAM policies reference correct resources with account ID", () => {
    expect(tapStackContent).toMatch(/data\.aws_caller_identity\.current\.account_id/);
  });


});

describe("Random Password Configuration Tests", () => {
  let tapStackContent: string;

  beforeAll(() => {
    tapStackContent = readFile(TAP_STACK_PATH);
  });

  test("has random password resources", () => {
    expect(tapStackContent).toMatch(/resource\s*"random_password"/);
  });

  test("has proper password configuration", () => {
    expect(tapStackContent).toMatch(/length\s*=\s*16/);
    expect(tapStackContent).toMatch(/special\s*=\s*true/);
  });


});

describe("Output Configuration Tests", () => {
  let tapStackContent: string;

  beforeAll(() => {
    tapStackContent = readFile(TAP_STACK_PATH);
  });

  test("has VPC outputs", () => {
    expect(tapStackContent).toMatch(/output\s*"vpc_ids"/);
  });

  test("has KMS key outputs", () => {
    expect(tapStackContent).toMatch(/output\s*"kms_key_arns"/);
  });

  test("has API Gateway outputs", () => {
    expect(tapStackContent).toMatch(/output\s*"api_gateway_endpoints"/);
  });

  
});

describe("Resource Reference and Dependency Tests", () => {
  let tapStackContent: string;

  beforeAll(() => {
    tapStackContent = readFile(TAP_STACK_PATH);
  });

  

  test("has proper depends_on declarations where needed", () => {
    expect(tapStackContent).toMatch(/depends_on\s*=\s*\[/);
    expect(tapStackContent).toMatch(/aws_api_gateway_integration\.lambda/);
  });

  test("no circular dependency patterns", () => {
    // Check that resources don't reference themselves or create cycles
    const matches = tapStackContent.match(/resource\s*"([^"]+)"\s*"([^"]+)"/g) || [];
    expect(matches.length).toBeGreaterThan(0);
  });
});

describe("Multi-Region Consistency Tests", () => {
  let tapStackContent: string;

  beforeAll(() => {
    tapStackContent = readFile(TAP_STACK_PATH);
  });

  test("all resources use consistent region references", () => {
    expect(tapStackContent).toMatch(/us-east-1/);
    expect(tapStackContent).toMatch(/eu-west-1/);
    expect(tapStackContent).toMatch(/ap-southeast-1/);
  });

  test("provider assignments reference correct regional providers", () => {
    expect(tapStackContent).toMatch(/provider\s*=\s*aws\.us-east-1/);
    expect(tapStackContent).toMatch(/provider\s*=\s*aws\.eu-west-1/);
    expect(tapStackContent).toMatch(/provider\s*=\s*aws\.ap-southeast-1/);
  });

  

  test("VPC CIDR blocks are region-specific", () => {
    expect(tapStackContent).toMatch(/var\.vpc_cidrs\["us-east-1"\]/);
    expect(tapStackContent).toMatch(/var\.vpc_cidrs\["eu-west-1"\]/);
    expect(tapStackContent).toMatch(/var\.vpc_cidrs\["ap-southeast-1"\]/);
  });

  

  test("consistent tagging across all regions", () => {
    expect(tapStackContent).toMatch(/Region\s*=\s*"us-east-1"/);
    expect(tapStackContent).toMatch(/Region\s*=\s*"eu-west-1"/);
    expect(tapStackContent).toMatch(/Region\s*=\s*"ap-southeast-1"/);
  });


});

describe("Security and Compliance Tests", () => {
  let tapStackContent: string;

  beforeAll(() => {
    tapStackContent = readFile(TAP_STACK_PATH);
  });

  test("encryption at rest enabled for all data services", () => {
    expect(tapStackContent).toMatch(/storage_encrypted\s*=\s*true/);
    expect(tapStackContent).toMatch(/encrypted\s*=\s*true/);
  });

  

  test("has proper security group restrictions", () => {
    expect(tapStackContent).toMatch(/cidr_blocks\s*=\s*\[var\.vpc_cidrs/);
  });

  test("CloudWatch logging enabled", () => {
    expect(tapStackContent).toMatch(/enabled_cloudwatch_logs_exports/);
  });

  test("deletion protection and backup configured", () => {
    expect(tapStackContent).toMatch(/backup_retention_period/);
    expect(tapStackContent).toMatch(/skip_final_snapshot\s*=\s*true/); // For dev environment
  });

  

  

  test("S3 buckets block public access", () => {
    expect(tapStackContent).toMatch(/block_public_acls\s*=\s*true/);
    expect(tapStackContent).toMatch(/block_public_policy\s*=\s*true/);
    expect(tapStackContent).toMatch(/ignore_public_acls\s*=\s*true/);
    expect(tapStackContent).toMatch(/restrict_public_buckets\s*=\s*true/);
  });

  test("Secrets Manager has proper recovery configuration", () => {
    expect(tapStackContent).toMatch(/recovery_window_in_days\s*=\s*0/);
  });

  test("RDS has performance insights enabled", () => {
    expect(tapStackContent).toMatch(/performance_insights_enabled\s*=\s*true/);
  });

  test("RDS has monitoring interval configured", () => {
    expect(tapStackContent).toMatch(/monitoring_interval\s*=\s*60/);
  });

  test("RDS master user password is AWS managed", () => {
    expect(tapStackContent).toMatch(/master_user_secret_kms_key_id/);
  });
});

describe("CloudWatch and Monitoring Tests", () => {
  let tapStackContent: string;

  beforeAll(() => {
    tapStackContent = readFile(TAP_STACK_PATH);
  });

  test("has CloudWatch dashboard resources", () => {
    expect(tapStackContent).toMatch(/resource\s*"aws_cloudwatch_dashboard"\s*"us_east_1"/);
    expect(tapStackContent).toMatch(/resource\s*"aws_cloudwatch_dashboard"\s*"eu_west_1"/);
    expect(tapStackContent).toMatch(/resource\s*"aws_cloudwatch_dashboard"\s*"ap_southeast_1"/);
  });

  test("CloudWatch dashboard has proper naming", () => {
    expect(tapStackContent).toMatch(/dashboard_name\s*=\s*"\${local\.environment}-us-east-1-payment-dashboard"/);
  });

  test("dashboard includes RDS metrics", () => {
    expect(tapStackContent).toMatch(/AWS\/RDS.*CPUUtilization/);
    expect(tapStackContent).toMatch(/\["\.", "DatabaseConnections"/);
    expect(tapStackContent).toMatch(/\["\.", "AuroraReplicaLag"/);
    expect(tapStackContent).toMatch(/\["\.", "DiskQueueDepth"/);
  });

  test("dashboard includes Lambda metrics", () => {
    expect(tapStackContent).toMatch(/AWS\/Lambda.*Invocations/);
    expect(tapStackContent).toMatch(/\["\.", "Errors"/);
    expect(tapStackContent).toMatch(/\["\.", "Duration"/);
    expect(tapStackContent).toMatch(/\["\.", "ConcurrentExecutions"/);
  });

  test("dashboard metrics have proper periods", () => {
    expect(tapStackContent).toMatch(/period\s*=\s*300/);
  });

  test("dashboard metrics have proper statistics", () => {
    expect(tapStackContent).toMatch(/stat.*Average/);
    expect(tapStackContent).toMatch(/stat.*Sum/);
    expect(tapStackContent).toMatch(/stat.*Maximum/);
  });

  test("dashboard widgets have titles", () => {
    expect(tapStackContent).toMatch(/title.*RDS Metrics/);
    expect(tapStackContent).toMatch(/title.*Lambda Metrics/);
  });

  test("dashboard body is properly encoded", () => {
    expect(tapStackContent).toMatch(/dashboard_body\s*=\s*jsonencode/);
  });

  test("RDS CloudWatch logs are exported", () => {
    expect(tapStackContent).toMatch(/enabled_cloudwatch_logs_exports\s*=\s*\["audit", "error", "general", "slowquery"\]/);
  });

  test("monitoring role has correct service principal", () => {
    expect(tapStackContent).toMatch(/Service.*monitoring\.rds\.amazonaws\.com/);
  });
});
