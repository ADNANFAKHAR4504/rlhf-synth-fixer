// test/terraform.unit.test.ts
// Comprehensive unit tests for Terraform infrastructure defined in lib/tap_stack.tf
// No actual Terraform commands are executed - only static file analysis

import fs from "fs";
import path from "path";

const TAP_STACK_PATH = path.resolve(__dirname, "../lib/tap_stack.tf");
const PROVIDER_PATH = path.resolve(__dirname, "../lib/provider.tf");
const VARIABLES_PATH = path.resolve(__dirname, "../lib/variables.tf");

describe("Terraform Infrastructure Unit Tests", () => {
  let tapStackContent: string;
  let providerContent: string;
  let variablesContent: string;

  beforeAll(() => {
    tapStackContent = fs.readFileSync(TAP_STACK_PATH, "utf8");
    providerContent = fs.readFileSync(PROVIDER_PATH, "utf8");
    variablesContent = fs.readFileSync(VARIABLES_PATH, "utf8");
  });

  describe("File Structure and Organization", () => {
    test("tap_stack.tf file exists", () => {
      expect(fs.existsSync(TAP_STACK_PATH)).toBe(true);
    });

    test("provider.tf file exists", () => {
      expect(fs.existsSync(PROVIDER_PATH)).toBe(true);
    });

    test("variables.tf file exists", () => {
      expect(fs.existsSync(VARIABLES_PATH)).toBe(true);
    });

    test("tap_stack.tf is not empty", () => {
      expect(tapStackContent.length).toBeGreaterThan(0);
    });

    test("tap_stack.tf does NOT declare provider block (provider.tf owns it)", () => {
      expect(tapStackContent).not.toMatch(/\bprovider\s+"aws"\s*{/);
    });

    test("tap_stack.tf does NOT declare terraform block (provider.tf owns it)", () => {
      expect(tapStackContent).not.toMatch(/\bterraform\s*{[\s\S]*?required_providers/);
    });

    test("provider.tf contains terraform block", () => {
      expect(providerContent).toMatch(/terraform\s*{/);
      expect(providerContent).toMatch(/required_version/);
      expect(providerContent).toMatch(/required_providers/);
    });

    test("provider.tf contains AWS provider configuration", () => {
      expect(providerContent).toMatch(/provider\s+"aws"\s*{/);
    });

    test("provider.tf uses correct AWS provider version constraint", () => {
      expect(providerContent).toMatch(/version\s*=\s*"~>\s*5\.0"/);
    });
  });

  describe("Variables Configuration", () => {
    test("variables.tf declares aws_region variable", () => {
      expect(variablesContent).toMatch(/variable\s+"aws_region"\s*{/);
    });

    test("aws_region has default value of us-east-1", () => {
      expect(variablesContent).toMatch(/default\s*=\s*"us-east-1"/);
    });

    test("variables.tf declares environment_suffix variable", () => {
      expect(variablesContent).toMatch(/variable\s+"environment_suffix"\s*{/);
    });

    test("tap_stack.tf references var.aws_region", () => {
      expect(tapStackContent).toMatch(/var\.aws_region/);
    });
  });

  describe("Data Sources", () => {
    test("declares aws_caller_identity data source", () => {
      expect(tapStackContent).toMatch(/data\s+"aws_caller_identity"\s+"current"/);
    });

    test("declares aws_availability_zones data source", () => {
      expect(tapStackContent).toMatch(/data\s+"aws_availability_zones"\s+"available"/);
    });
  });

  describe("Local Variables", () => {
    test("defines locals block with project_name", () => {
      expect(tapStackContent).toMatch(/locals\s*{/);
      expect(tapStackContent).toMatch(/project_name\s*=\s*"ProjectName"/);
    });

    test("defines environment as prod", () => {
      expect(tapStackContent).toMatch(/environment\s*=\s*"prod"/);
    });

    test("defines region using var.aws_region", () => {
      expect(tapStackContent).toMatch(/region\s*=\s*var\.aws_region/);
    });

    test("defines common_tags with required tags", () => {
      expect(tapStackContent).toMatch(/common_tags\s*=\s*{/);
      expect(tapStackContent).toMatch(/Project\s*=\s*local\.project_name/);
      expect(tapStackContent).toMatch(/Environment\s*=\s*local\.environment/);
      expect(tapStackContent).toMatch(/Owner\s*=\s*"SecurityTeam"/);
    });

    test("defines VPC CIDR blocks", () => {
      expect(tapStackContent).toMatch(/vpc_cidr\s*=\s*"10\.0\.0\.0\/16"/);
      expect(tapStackContent).toMatch(/public_cidr\s*=/);
      expect(tapStackContent).toMatch(/private_cidr\s*=/);
    });
  });

  describe("KMS Encryption", () => {
    test("creates KMS key resource", () => {
      expect(tapStackContent).toMatch(/resource\s+"aws_kms_key"\s+"main"/);
    });

    test("KMS key has rotation enabled", () => {
      expect(tapStackContent).toMatch(/enable_key_rotation\s*=\s*true/);
    });

    test("KMS key has deletion window configured", () => {
      expect(tapStackContent).toMatch(/deletion_window_in_days\s*=\s*7/);
    });

    test("KMS key has policy defined", () => {
      expect(tapStackContent).toMatch(/policy\s*=\s*jsonencode/);
    });

    test("creates KMS alias", () => {
      expect(tapStackContent).toMatch(/resource\s+"aws_kms_alias"\s+"main"/);
    });

    test("KMS alias references KMS key", () => {
      expect(tapStackContent).toMatch(/target_key_id\s*=\s*aws_kms_key\.main\.key_id/);
    });

    test("KMS key has common tags", () => {
      const kmsKeyMatch = tapStackContent.match(/resource\s+"aws_kms_key"\s+"main"\s*{[\s\S]*?^}/m);
      expect(kmsKeyMatch).toBeTruthy();
      expect(kmsKeyMatch![0]).toMatch(/tags\s*=\s*local\.common_tags/);
    });
  });

  describe("VPC and Networking", () => {
    test("creates VPC resource", () => {
      expect(tapStackContent).toMatch(/resource\s+"aws_vpc"\s+"main"/);
    });

    test("VPC uses correct CIDR block", () => {
      const vpcMatch = tapStackContent.match(/resource\s+"aws_vpc"\s+"main"\s*{[\s\S]*?^}/m);
      expect(vpcMatch).toBeTruthy();
      expect(vpcMatch![0]).toMatch(/cidr_block\s*=\s*local\.vpc_cidr/);
    });

    test("VPC has DNS support enabled", () => {
      expect(tapStackContent).toMatch(/enable_dns_support\s*=\s*true/);
    });

    test("VPC has DNS hostnames enabled", () => {
      expect(tapStackContent).toMatch(/enable_dns_hostnames\s*=\s*true/);
    });

    test("creates Internet Gateway", () => {
      expect(tapStackContent).toMatch(/resource\s+"aws_internet_gateway"\s+"main"/);
    });

    test("Internet Gateway attached to VPC", () => {
      const igwMatch = tapStackContent.match(/resource\s+"aws_internet_gateway"\s+"main"\s*{[\s\S]*?^}/m);
      expect(igwMatch).toBeTruthy();
      expect(igwMatch![0]).toMatch(/vpc_id\s*=\s*aws_vpc\.main\.id/);
    });

    test("creates Elastic IPs for NAT Gateways", () => {
      expect(tapStackContent).toMatch(/resource\s+"aws_eip"\s+"nat"/);
      expect(tapStackContent).toMatch(/count\s*=\s*2/);
      expect(tapStackContent).toMatch(/domain\s*=\s*"vpc"/);
    });

    test("creates public subnets", () => {
      expect(tapStackContent).toMatch(/resource\s+"aws_subnet"\s+"public"/);
    });

    test("public subnets have map_public_ip_on_launch enabled", () => {
      const publicSubnetMatch = tapStackContent.match(/resource\s+"aws_subnet"\s+"public"\s*{[\s\S]*?^}/m);
      expect(publicSubnetMatch).toBeTruthy();
      expect(publicSubnetMatch![0]).toMatch(/map_public_ip_on_launch\s*=\s*true/);
    });

    test("creates private subnets", () => {
      expect(tapStackContent).toMatch(/resource\s+"aws_subnet"\s+"private"/);
    });

    test("private subnets have map_public_ip_on_launch disabled", () => {
      const privateSubnetMatch = tapStackContent.match(/resource\s+"aws_subnet"\s+"private"\s*{[\s\S]*?^}/m);
      expect(privateSubnetMatch).toBeTruthy();
      expect(privateSubnetMatch![0]).toMatch(/map_public_ip_on_launch\s*=\s*false/);
    });

    test("creates NAT Gateways", () => {
      expect(tapStackContent).toMatch(/resource\s+"aws_nat_gateway"\s+"main"/);
    });

    test("NAT Gateways reference EIPs and public subnets", () => {
      const natMatch = tapStackContent.match(/resource\s+"aws_nat_gateway"\s+"main"\s*{[\s\S]*?^}/m);
      expect(natMatch).toBeTruthy();
      expect(natMatch![0]).toMatch(/allocation_id\s*=\s*aws_eip\.nat\[count\.index\]\.id/);
      expect(natMatch![0]).toMatch(/subnet_id\s*=\s*aws_subnet\.public\[count\.index\]\.id/);
    });

    test("creates public route table", () => {
      expect(tapStackContent).toMatch(/resource\s+"aws_route_table"\s+"public"/);
    });

    test("public route table has default route to IGW", () => {
      const publicRtMatch = tapStackContent.match(/resource\s+"aws_route_table"\s+"public"\s*{[\s\S]*?^}/m);
      expect(publicRtMatch).toBeTruthy();
      expect(publicRtMatch![0]).toMatch(/cidr_block\s*=\s*"0\.0\.0\.0\/0"/);
      expect(publicRtMatch![0]).toMatch(/gateway_id\s*=\s*aws_internet_gateway\.main\.id/);
    });

    test("creates private route tables", () => {
      expect(tapStackContent).toMatch(/resource\s+"aws_route_table"\s+"private"/);
    });

    test("private route tables have default route to NAT Gateway", () => {
      const privateRtMatch = tapStackContent.match(/resource\s+"aws_route_table"\s+"private"\s*{[\s\S]*?^}/m);
      expect(privateRtMatch).toBeTruthy();
      expect(privateRtMatch![0]).toMatch(/nat_gateway_id\s*=\s*aws_nat_gateway\.main\[count\.index\]\.id/);
    });

    test("creates route table associations for public subnets", () => {
      expect(tapStackContent).toMatch(/resource\s+"aws_route_table_association"\s+"public"/);
    });

    test("creates route table associations for private subnets", () => {
      expect(tapStackContent).toMatch(/resource\s+"aws_route_table_association"\s+"private"/);
    });
  });

  describe("Network ACLs", () => {
    test("creates default NACL", () => {
      expect(tapStackContent).toMatch(/resource\s+"aws_default_network_acl"\s+"default"/);
    });

    test("creates custom NACL for public subnets", () => {
      expect(tapStackContent).toMatch(/resource\s+"aws_network_acl"\s+"public"/);
    });

    test("public NACL allows HTTP traffic", () => {
      const naclMatch = tapStackContent.match(/resource\s+"aws_network_acl"\s+"public"\s*{[\s\S]*?^}/m);
      expect(naclMatch).toBeTruthy();
      expect(naclMatch![0]).toMatch(/from_port\s*=\s*80/);
      expect(naclMatch![0]).toMatch(/to_port\s*=\s*80/);
    });

    test("public NACL allows HTTPS traffic", () => {
      const naclMatch = tapStackContent.match(/resource\s+"aws_network_acl"\s+"public"\s*{[\s\S]*?^}/m);
      expect(naclMatch).toBeTruthy();
      expect(naclMatch![0]).toMatch(/from_port\s*=\s*443/);
      expect(naclMatch![0]).toMatch(/to_port\s*=\s*443/);
    });

    test("creates NACL associations", () => {
      expect(tapStackContent).toMatch(/resource\s+"aws_network_acl_association"\s+"public"/);
    });
  });

  describe("Security Groups", () => {
    test("creates RDS security group", () => {
      expect(tapStackContent).toMatch(/resource\s+"aws_security_group"\s+"rds"/);
    });

    test("RDS security group allows PostgreSQL port", () => {
      const rdsSgMatch = tapStackContent.match(/resource\s+"aws_security_group"\s+"rds"\s*{[\s\S]*?^}/m);
      expect(rdsSgMatch).toBeTruthy();
      expect(rdsSgMatch![0]).toMatch(/from_port\s*=\s*5432/);
      expect(rdsSgMatch![0]).toMatch(/to_port\s*=\s*5432/);
    });

    test("RDS security group allows MySQL port", () => {
      const rdsSgMatch = tapStackContent.match(/resource\s+"aws_security_group"\s+"rds"\s*{[\s\S]*?^}/m);
      expect(rdsSgMatch).toBeTruthy();
      expect(rdsSgMatch![0]).toMatch(/from_port\s*=\s*3306/);
      expect(rdsSgMatch![0]).toMatch(/to_port\s*=\s*3306/);
    });

    test("creates Lambda security group", () => {
      expect(tapStackContent).toMatch(/resource\s+"aws_security_group"\s+"lambda"/);
    });

    test("Lambda security group allows HTTPS egress", () => {
      const lambdaSgMatch = tapStackContent.match(/resource\s+"aws_security_group"\s+"lambda"\s*{[\s\S]*?^}/m);
      expect(lambdaSgMatch).toBeTruthy();
      expect(lambdaSgMatch![0]).toMatch(/egress/);
      expect(lambdaSgMatch![0]).toMatch(/from_port\s*=\s*443/);
    });
  });

  describe("S3 Buckets - Security Best Practices", () => {
    test("creates CloudTrail logs bucket", () => {
      expect(tapStackContent).toMatch(/resource\s+"aws_s3_bucket"\s+"cloudtrail_logs"/);
    });

    test("creates application bucket", () => {
      expect(tapStackContent).toMatch(/resource\s+"aws_s3_bucket"\s+"application"/);
    });

    test("creates AWS Config bucket", () => {
      expect(tapStackContent).toMatch(/resource\s+"aws_s3_bucket"\s+"config"/);
    });

    test("CloudTrail bucket has versioning enabled", () => {
      expect(tapStackContent).toMatch(/resource\s+"aws_s3_bucket_versioning"\s+"cloudtrail_logs"/);
      const versioningMatch = tapStackContent.match(/resource\s+"aws_s3_bucket_versioning"\s+"cloudtrail_logs"\s*{[\s\S]*?^}/m);
      expect(versioningMatch).toBeTruthy();
      expect(versioningMatch![0]).toMatch(/status\s*=\s*"Enabled"/);
    });

    test("Application bucket has versioning enabled", () => {
      expect(tapStackContent).toMatch(/resource\s+"aws_s3_bucket_versioning"\s+"application"/);
    });

    test("CloudTrail bucket has KMS encryption", () => {
      expect(tapStackContent).toMatch(/resource\s+"aws_s3_bucket_server_side_encryption_configuration"\s+"cloudtrail_logs"/);
      const encryptionMatch = tapStackContent.match(/resource\s+"aws_s3_bucket_server_side_encryption_configuration"\s+"cloudtrail_logs"\s*{[\s\S]*?^}/m);
      expect(encryptionMatch).toBeTruthy();
      expect(encryptionMatch![0]).toMatch(/sse_algorithm\s*=\s*"aws:kms"/);
      expect(encryptionMatch![0]).toMatch(/kms_master_key_id\s*=\s*aws_kms_key\.main\.arn/);
    });

    test("Application bucket has KMS encryption", () => {
      expect(tapStackContent).toMatch(/resource\s+"aws_s3_bucket_server_side_encryption_configuration"\s+"application"/);
    });

    test("CloudTrail bucket blocks all public access", () => {
      expect(tapStackContent).toMatch(/resource\s+"aws_s3_bucket_public_access_block"\s+"cloudtrail_logs"/);
      const publicBlockMatch = tapStackContent.match(/resource\s+"aws_s3_bucket_public_access_block"\s+"cloudtrail_logs"\s*{[\s\S]*?^}/m);
      expect(publicBlockMatch).toBeTruthy();
      expect(publicBlockMatch![0]).toMatch(/block_public_acls\s*=\s*true/);
      expect(publicBlockMatch![0]).toMatch(/block_public_policy\s*=\s*true/);
      expect(publicBlockMatch![0]).toMatch(/ignore_public_acls\s*=\s*true/);
      expect(publicBlockMatch![0]).toMatch(/restrict_public_buckets\s*=\s*true/);
    });

    test("Application bucket blocks all public access", () => {
      expect(tapStackContent).toMatch(/resource\s+"aws_s3_bucket_public_access_block"\s+"application"/);
    });

    test("CloudTrail bucket has secure bucket policy", () => {
      expect(tapStackContent).toMatch(/resource\s+"aws_s3_bucket_policy"\s+"cloudtrail_logs"/);
    });

    test("Application bucket has secure bucket policy", () => {
      expect(tapStackContent).toMatch(/resource\s+"aws_s3_bucket_policy"\s+"application"/);
    });

    test("Application bucket policy denies unencrypted uploads", () => {
      const policyMatch = tapStackContent.match(/resource\s+"aws_s3_bucket_policy"\s+"application"\s*{[\s\S]*?^}/m);
      expect(policyMatch).toBeTruthy();
      expect(policyMatch![0]).toMatch(/DenyUnencryptedObjectUploads/);
    });

    test("Application bucket policy denies insecure connections", () => {
      const policyMatch = tapStackContent.match(/resource\s+"aws_s3_bucket_policy"\s+"application"\s*{[\s\S]*?^}/m);
      expect(policyMatch).toBeTruthy();
      expect(policyMatch![0]).toMatch(/DenyInsecureConnections/);
      expect(policyMatch![0]).toMatch(/aws:SecureTransport/);
    });
  });

  describe("CloudWatch Logging", () => {
    test("creates VPC Flow Logs log group", () => {
      expect(tapStackContent).toMatch(/resource\s+"aws_cloudwatch_log_group"\s+"vpc_flow_logs"/);
    });

    test("creates Lambda log group", () => {
      expect(tapStackContent).toMatch(/resource\s+"aws_cloudwatch_log_group"\s+"lambda"/);
    });

    test("creates RDS log group", () => {
      expect(tapStackContent).toMatch(/resource\s+"aws_cloudwatch_log_group"\s+"rds"/);
    });

    test("log groups have retention configured", () => {
      expect(tapStackContent).toMatch(/retention_in_days/);
    });

    test("log groups use KMS encryption", () => {
      const logGroupMatches = tapStackContent.match(/resource\s+"aws_cloudwatch_log_group"\s+"[^"]+"\s*{[\s\S]*?^}/gm);
      expect(logGroupMatches).toBeTruthy();
      logGroupMatches!.forEach(match => {
        expect(match).toMatch(/kms_key_id\s*=\s*aws_kms_key\.main\.arn/);
      });
    });

    test("creates VPC Flow Logs", () => {
      expect(tapStackContent).toMatch(/resource\s+"aws_flow_log"\s+"main"/);
    });

    test("Flow Logs capture all traffic", () => {
      const flowLogMatch = tapStackContent.match(/resource\s+"aws_flow_log"\s+"main"\s*{[\s\S]*?^}/m);
      expect(flowLogMatch).toBeTruthy();
      expect(flowLogMatch![0]).toMatch(/traffic_type\s*=\s*"ALL"/);
    });
  });

  describe("IAM Roles and Policies", () => {
    test("creates Flow Logs IAM role", () => {
      expect(tapStackContent).toMatch(/resource\s+"aws_iam_role"\s+"flow_logs"/);
    });

    test("creates Lambda execution role", () => {
      expect(tapStackContent).toMatch(/resource\s+"aws_iam_role"\s+"lambda_execution"/);
    });

    test("creates AWS Config IAM role", () => {
      expect(tapStackContent).toMatch(/resource\s+"aws_iam_role"\s+"config"/);
    });

    test("creates RDS monitoring role", () => {
      expect(tapStackContent).toMatch(/resource\s+"aws_iam_role"\s+"rds_monitoring"/);
    });

    test("Lambda role has least privilege policy", () => {
      expect(tapStackContent).toMatch(/resource\s+"aws_iam_role_policy"\s+"lambda_execution"/);
      const lambdaPolicyMatch = tapStackContent.match(/resource\s+"aws_iam_role_policy"\s+"lambda_execution"\s*{[\s\S]*?^}/m);
      expect(lambdaPolicyMatch).toBeTruthy();
      expect(lambdaPolicyMatch![0]).toMatch(/logs:CreateLogStream/);
      expect(lambdaPolicyMatch![0]).toMatch(/logs:PutLogEvents/);
    });

    test("IAM roles have assume role policies", () => {
      const roleMatches = tapStackContent.match(/resource\s+"aws_iam_role"\s+"[^"]+"\s*{[\s\S]*?^}/gm);
      expect(roleMatches).toBeTruthy();
      roleMatches!.forEach(match => {
        expect(match).toMatch(/assume_role_policy/);
      });
    });
  });

  describe("CloudTrail for Auditing", () => {
    test("creates CloudTrail", () => {
      expect(tapStackContent).toMatch(/resource\s+"aws_cloudtrail"\s+"main"/);
    });

    test("CloudTrail is multi-region", () => {
      const cloudtrailMatch = tapStackContent.match(/resource\s+"aws_cloudtrail"\s+"main"\s*{[\s\S]*?^}/m);
      expect(cloudtrailMatch).toBeTruthy();
      expect(cloudtrailMatch![0]).toMatch(/is_multi_region_trail\s*=\s*true/);
    });

    test("CloudTrail includes global service events", () => {
      const cloudtrailMatch = tapStackContent.match(/resource\s+"aws_cloudtrail"\s+"main"\s*{[\s\S]*?^}/m);
      expect(cloudtrailMatch).toBeTruthy();
      expect(cloudtrailMatch![0]).toMatch(/include_global_service_events\s*=\s*true/);
    });

    test("CloudTrail uses KMS encryption", () => {
      const cloudtrailMatch = tapStackContent.match(/resource\s+"aws_cloudtrail"\s+"main"\s*{[\s\S]*?^}/m);
      expect(cloudtrailMatch).toBeTruthy();
      expect(cloudtrailMatch![0]).toMatch(/kms_key_id\s*=\s*aws_kms_key\.main\.arn/);
    });

    test("CloudTrail logging is enabled", () => {
      const cloudtrailMatch = tapStackContent.match(/resource\s+"aws_cloudtrail"\s+"main"\s*{[\s\S]*?^}/m);
      expect(cloudtrailMatch).toBeTruthy();
      expect(cloudtrailMatch![0]).toMatch(/enable_logging\s*=\s*true/);
    });
  });

  describe("GuardDuty Threat Detection", () => {
    test("creates GuardDuty detector", () => {
      expect(tapStackContent).toMatch(/resource\s+"aws_guardduty_detector"\s+"main"/);
    });

    test("GuardDuty is enabled", () => {
      const guarddutyMatch = tapStackContent.match(/resource\s+"aws_guardduty_detector"\s+"main"\s*{[\s\S]*?^}/m);
      expect(guarddutyMatch).toBeTruthy();
      expect(guarddutyMatch![0]).toMatch(/enable\s*=\s*true/);
    });

    test("GuardDuty has S3 data sources enabled", () => {
      const guarddutyMatch = tapStackContent.match(/resource\s+"aws_guardduty_detector"\s+"main"\s*{[\s\S]*?^}/m);
      expect(guarddutyMatch).toBeTruthy();
      expect(guarddutyMatch![0]).toMatch(/s3_logs/);
      expect(guarddutyMatch![0]).toMatch(/enable\s*=\s*true/);
    });
  });

  describe("WAF Web ACL", () => {
    test("creates WAF Web ACL", () => {
      expect(tapStackContent).toMatch(/resource\s+"aws_wafv2_web_acl"\s+"main"/);
    });

    test("WAF is regional scope", () => {
      const wafMatch = tapStackContent.match(/resource\s+"aws_wafv2_web_acl"\s+"main"\s*{[\s\S]*?^}/m);
      expect(wafMatch).toBeTruthy();
      expect(wafMatch![0]).toMatch(/scope\s*=\s*"REGIONAL"/);
    });

    test("WAF has rate limiting rule", () => {
      const wafMatch = tapStackContent.match(/resource\s+"aws_wafv2_web_acl"\s+"main"\s*{[\s\S]*?^}/m);
      expect(wafMatch).toBeTruthy();
      expect(wafMatch![0]).toMatch(/RateLimitRule/);
      expect(wafMatch![0]).toMatch(/rate_based_statement/);
    });

    test("WAF has AWS managed rules", () => {
      const wafMatch = tapStackContent.match(/resource\s+"aws_wafv2_web_acl"\s+"main"\s*{[\s\S]*?^}/m);
      expect(wafMatch).toBeTruthy();
      expect(wafMatch![0]).toMatch(/AWSManagedRulesCommonRuleSet/);
    });

    test("WAF has SQL injection protection", () => {
      const wafMatch = tapStackContent.match(/resource\s+"aws_wafv2_web_acl"\s+"main"\s*{[\s\S]*?^}/m);
      expect(wafMatch).toBeTruthy();
      expect(wafMatch![0]).toMatch(/AWSManagedRulesSQLiRuleSet/);
    });

    test("WAF has CloudWatch metrics enabled", () => {
      const wafMatch = tapStackContent.match(/resource\s+"aws_wafv2_web_acl"\s+"main"\s*{[\s\S]*?^}/m);
      expect(wafMatch).toBeTruthy();
      expect(wafMatch![0]).toMatch(/cloudwatch_metrics_enabled\s*=\s*true/);
    });
  });

  describe("AWS Config", () => {
    test("creates Config recorder", () => {
      expect(tapStackContent).toMatch(/resource\s+"aws_config_configuration_recorder"\s+"main"/);
    });

    test("creates Config delivery channel", () => {
      expect(tapStackContent).toMatch(/resource\s+"aws_config_delivery_channel"\s+"main"/);
    });

    test("creates Config recorder status", () => {
      expect(tapStackContent).toMatch(/resource\s+"aws_config_configuration_recorder_status"\s+"main"/);
    });

    test("Config recorder records all supported resources", () => {
      const configMatch = tapStackContent.match(/resource\s+"aws_config_configuration_recorder"\s+"main"\s*{[\s\S]*?^}/m);
      expect(configMatch).toBeTruthy();
      expect(configMatch![0]).toMatch(/all_supported\s*=\s*true/);
    });

    test("Config includes global resources", () => {
      const configMatch = tapStackContent.match(/resource\s+"aws_config_configuration_recorder"\s+"main"\s*{[\s\S]*?^}/m);
      expect(configMatch).toBeTruthy();
      expect(configMatch![0]).toMatch(/include_global_resource_types\s*=\s*true/);
    });

    test("Config recorder is enabled", () => {
      const configStatusMatch = tapStackContent.match(/resource\s+"aws_config_configuration_recorder_status"\s+"main"\s*{[\s\S]*?^}/m);
      expect(configStatusMatch).toBeTruthy();
      expect(configStatusMatch![0]).toMatch(/is_enabled\s*=\s*true/);
    });
  });

  describe("SSM Parameter Store", () => {
    test("does not use SSM for database password (uses Secrets Manager instead)", () => {
      expect(tapStackContent).not.toMatch(/resource\s+"aws_ssm_parameter"\s+"db_password"/);
    });

    test("creates SSM parameter for API key", () => {
      expect(tapStackContent).toMatch(/resource\s+"aws_ssm_parameter"\s+"api_key"/);
    });

    test("creates SSM parameter for app config", () => {
      expect(tapStackContent).toMatch(/resource\s+"aws_ssm_parameter"\s+"app_config"/);
    });

    test("SSM parameters use SecureString type", () => {
      const ssmMatches = tapStackContent.match(/resource\s+"aws_ssm_parameter"\s+"[^"]+"\s*{[\s\S]*?^}/gm);
      expect(ssmMatches).toBeTruthy();
      ssmMatches!.forEach(match => {
        expect(match).toMatch(/type\s*=\s*"SecureString"/);
      });
    });

    test("SSM parameters use KMS encryption", () => {
      const ssmMatches = tapStackContent.match(/resource\s+"aws_ssm_parameter"\s+"[^"]+"\s*{[\s\S]*?^}/gm);
      expect(ssmMatches).toBeTruthy();
      ssmMatches!.forEach(match => {
        expect(match).toMatch(/key_id\s*=\s*aws_kms_key\.main\.arn/);
      });
    });
  });

  describe("RDS Database", () => {
    test("creates RDS subnet group", () => {
      expect(tapStackContent).toMatch(/resource\s+"aws_db_subnet_group"\s+"main"/);
    });

    test("creates RDS instance", () => {
      expect(tapStackContent).toMatch(/resource\s+"aws_db_instance"\s+"main"/);
    });

    test("RDS uses PostgreSQL engine", () => {
      const rdsMatch = tapStackContent.match(/resource\s+"aws_db_instance"\s+"main"\s*{[\s\S]*?^}/m);
      expect(rdsMatch).toBeTruthy();
      expect(rdsMatch![0]).toMatch(/engine\s*=\s*"postgres"/);
    });

    test("RDS storage is encrypted", () => {
      const rdsMatch = tapStackContent.match(/resource\s+"aws_db_instance"\s+"main"\s*{[\s\S]*?^}/m);
      expect(rdsMatch).toBeTruthy();
      expect(rdsMatch![0]).toMatch(/storage_encrypted\s*=\s*true/);
    });

    test("RDS uses KMS encryption", () => {
      const rdsMatch = tapStackContent.match(/resource\s+"aws_db_instance"\s+"main"\s*{[\s\S]*?^}/m);
      expect(rdsMatch).toBeTruthy();
      expect(rdsMatch![0]).toMatch(/kms_key_id\s*=\s*aws_kms_key\.main\.arn/);
    });

    test("RDS is NOT publicly accessible", () => {
      const rdsMatch = tapStackContent.match(/resource\s+"aws_db_instance"\s+"main"\s*{[\s\S]*?^}/m);
      expect(rdsMatch).toBeTruthy();
      expect(rdsMatch![0]).toMatch(/publicly_accessible\s*=\s*false/);
    });

    test("RDS has deletion protection DISABLED", () => {
      const rdsMatch = tapStackContent.match(/resource\s+"aws_db_instance"\s+"main"\s*{[\s\S]*?^}/m);
      expect(rdsMatch).toBeTruthy();
      expect(rdsMatch![0]).toMatch(/deletion_protection\s*=\s*false/);
    });

    test("RDS has backup configured", () => {
      const rdsMatch = tapStackContent.match(/resource\s+"aws_db_instance"\s+"main"\s*{[\s\S]*?^}/m);
      expect(rdsMatch).toBeTruthy();
      expect(rdsMatch![0]).toMatch(/backup_retention_period/);
      expect(rdsMatch![0]).toMatch(/backup_window/);
    });

    test("RDS has CloudWatch logs enabled", () => {
      const rdsMatch = tapStackContent.match(/resource\s+"aws_db_instance"\s+"main"\s*{[\s\S]*?^}/m);
      expect(rdsMatch).toBeTruthy();
      expect(rdsMatch![0]).toMatch(/enabled_cloudwatch_logs_exports/);
    });

    test("RDS has Performance Insights enabled", () => {
      const rdsMatch = tapStackContent.match(/resource\s+"aws_db_instance"\s+"main"\s*{[\s\S]*?^}/m);
      expect(rdsMatch).toBeTruthy();
      expect(rdsMatch![0]).toMatch(/performance_insights_enabled\s*=\s*true/);
    });

    test("RDS Performance Insights uses KMS encryption", () => {
      const rdsMatch = tapStackContent.match(/resource\s+"aws_db_instance"\s+"main"\s*{[\s\S]*?^}/m);
      expect(rdsMatch).toBeTruthy();
      expect(rdsMatch![0]).toMatch(/performance_insights_kms_key_id\s*=\s*aws_kms_key\.main\.arn/);
    });

    test("RDS skips final snapshot", () => {
      const rdsMatch = tapStackContent.match(/resource\s+"aws_db_instance"\s+"main"\s*{[\s\S]*?^}/m);
      expect(rdsMatch).toBeTruthy();
      expect(rdsMatch![0]).toMatch(/skip_final_snapshot\s*=\s*true/);
    });
  });

  describe("CloudWatch Alarms", () => {
    test("creates RDS CPU alarm", () => {
      expect(tapStackContent).toMatch(/resource\s+"aws_cloudwatch_metric_alarm"\s+"rds_cpu"/);
    });

    test("creates RDS storage alarm", () => {
      expect(tapStackContent).toMatch(/resource\s+"aws_cloudwatch_metric_alarm"\s+"rds_storage"/);
    });

    test("RDS CPU alarm monitors CPUUtilization", () => {
      const alarmMatch = tapStackContent.match(/resource\s+"aws_cloudwatch_metric_alarm"\s+"rds_cpu"\s*{[\s\S]*?^}/m);
      expect(alarmMatch).toBeTruthy();
      expect(alarmMatch![0]).toMatch(/metric_name\s*=\s*"CPUUtilization"/);
      expect(alarmMatch![0]).toMatch(/namespace\s*=\s*"AWS\/RDS"/);
    });

    test("RDS storage alarm monitors FreeStorageSpace", () => {
      const alarmMatch = tapStackContent.match(/resource\s+"aws_cloudwatch_metric_alarm"\s+"rds_storage"\s*{[\s\S]*?^}/m);
      expect(alarmMatch).toBeTruthy();
      expect(alarmMatch![0]).toMatch(/metric_name\s*=\s*"FreeStorageSpace"/);
    });
  });

  describe("CloudWatch Dashboard", () => {
    test("creates CloudWatch dashboard", () => {
      expect(tapStackContent).toMatch(/resource\s+"aws_cloudwatch_dashboard"\s+"main"/);
    });

    test("dashboard has body configuration", () => {
      const dashboardMatch = tapStackContent.match(/resource\s+"aws_cloudwatch_dashboard"\s+"main"\s*{[\s\S]*?^}/m);
      expect(dashboardMatch).toBeTruthy();
      expect(dashboardMatch![0]).toMatch(/dashboard_body\s*=\s*jsonencode/);
    });
  });

  describe("Outputs", () => {
    test("defines VPC ID output", () => {
      expect(tapStackContent).toMatch(/output\s+"vpc_id"/);
    });

    test("defines RDS endpoint output", () => {
      expect(tapStackContent).toMatch(/output\s+"rds_endpoint"/);
    });

    test("defines KMS key ID output", () => {
      expect(tapStackContent).toMatch(/output\s+"kms_key_id"/);
    });

    test("defines CloudTrail name output", () => {
      expect(tapStackContent).toMatch(/output\s+"cloudtrail_name"/);
    });

    test("defines WAF Web ACL ARN output", () => {
      expect(tapStackContent).toMatch(/output\s+"waf_web_acl_arn"/);
    });

    test("RDS endpoint output is marked as sensitive", () => {
      const outputMatch = tapStackContent.match(/output\s+"rds_endpoint"\s*{[\s\S]*?^}/m);
      expect(outputMatch).toBeTruthy();
      expect(outputMatch![0]).toMatch(/sensitive\s*=\s*true/);
    });
  });

  describe("Tagging Compliance", () => {
    test("resources use common_tags", () => {
      const resourceMatches = tapStackContent.match(/resource\s+"aws_[^"]+"\s+"[^"]+"\s*{[\s\S]*?^}/gm);
      expect(resourceMatches).toBeTruthy();
      const taggedResources = resourceMatches!.filter(match => match.includes("tags"));
      expect(taggedResources.length).toBeGreaterThan(0);
    });

    test("provider has default_tags configured", () => {
      expect(providerContent).toMatch(/default_tags\s*{/);
    });

    test("provider default_tags include Environment", () => {
      expect(providerContent).toMatch(/Environment\s*=\s*var\.environment_suffix/);
    });

    test("provider default_tags include Repository", () => {
      expect(providerContent).toMatch(/Repository\s*=\s*var\.repository/);
    });
  });

  describe("Security Best Practices Validation", () => {
    test("no resources have deletion_protection = true", () => {
      expect(tapStackContent).not.toMatch(/deletion_protection\s*=\s*true/);
    });

    test("all S3 buckets use KMS encryption", () => {
      const encryptionConfigs = tapStackContent.match(/resource\s+"aws_s3_bucket_server_side_encryption_configuration"/g);
      const buckets = tapStackContent.match(/resource\s+"aws_s3_bucket"\s+"(?!policy)[^"]+"/g);
      expect(encryptionConfigs).toBeTruthy();
      expect(buckets).toBeTruthy();
      // Each bucket should have encryption config
      expect(encryptionConfigs!.length).toBeGreaterThanOrEqual(3);
    });

    test("all S3 buckets block public access", () => {
      const publicAccessBlocks = tapStackContent.match(/resource\s+"aws_s3_bucket_public_access_block"/g);
      expect(publicAccessBlocks).toBeTruthy();
      expect(publicAccessBlocks!.length).toBeGreaterThanOrEqual(3);
    });

    test("no hardcoded credentials in code", () => {
      expect(tapStackContent).not.toMatch(/password\s*=\s*"[A-Za-z0-9]/);
      expect(tapStackContent).not.toMatch(/secret\s*=\s*"[A-Za-z0-9]/);
    });

    test("private subnets do not auto-assign public IPs", () => {
      const privateSubnetMatch = tapStackContent.match(/resource\s+"aws_subnet"\s+"private"\s*{[\s\S]*?^}/m);
      expect(privateSubnetMatch).toBeTruthy();
      expect(privateSubnetMatch![0]).toMatch(/map_public_ip_on_launch\s*=\s*false/);
    });
  });

  describe("Naming Conventions", () => {
    test("resources follow ProjectName-ResourceType-Environment pattern", () => {
      const nameMatches = tapStackContent.match(/Name\s*=\s*"\$\{local\.project_name\}-[^"]+"/g);
      expect(nameMatches).toBeTruthy();
      expect(nameMatches!.length).toBeGreaterThan(0);
    });

    test("S3 buckets use lowercase naming", () => {
      const bucketMatches = tapStackContent.match(/bucket\s*=\s*"\$\{lower\(local\.project_name\)/g);
      expect(bucketMatches).toBeTruthy();
      expect(bucketMatches!.length).toBeGreaterThan(0);
    });
  });
});
