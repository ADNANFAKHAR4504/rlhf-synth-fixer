import * as fs from "fs";
import * as path from "path";

const TAP_STACK_TF = path.resolve(__dirname, "../lib/tap_stack.tf");
const tf = fs.readFileSync(TAP_STACK_TF, "utf8");

const has = (regex: RegExp) => regex.test(tf);

const resourceBlockHas = (resourceType: string, resourceName: string, field: string) =>
  new RegExp(`resource\\s+"${resourceType}"\\s+"${resourceName}"[\\s\\S]*${field}\\s*=`).test(tf);

describe("tap_stack.tf Static Validation", () => {
  // GENERAL FILE CHECKS
  it("file exists and is large enough", () => {
    expect(fs.existsSync(TAP_STACK_TF)).toBe(true);
    expect(tf.length).toBeGreaterThan(60000); // matches large config attached
  });

  // VARIABLE VALIDATION
  const requiredVariables = [
    "primary_region",
    "secondary_region",
    "environment",
    "project_name",
    "owner",
    "cost_center"
  ];
  it("declares all required input variables", () => {
    requiredVariables.forEach(v =>
      expect(has(new RegExp(`variable\\s+"${v}"`))).toBe(true)
    );
  });

  // LOCALS VALIDATION
  it("declares required locals including common_tags, prefixes, and CIDRs", () => {
    expect(has(/locals\s*{[\s\S]*common_tags/)).toBe(true);
    expect(has(/primary_prefix\s*=\s*"\${var.project_name}-\${var.environment}-primary"/)).toBe(true);
    expect(has(/secondary_prefix\s*=\s*"\${var.project_name}-\${var.environment}-secondary"/)).toBe(true);
    expect(has(/primary_vpc_cidr\s*=\s*"10\.0\.0\.0\/16"/)).toBe(true);
    expect(has(/secondary_vpc_cidr\s*=\s*"10\.1\.0\.0\/16"/)).toBe(true);
  });

  // DATA SOURCES VALIDATION
  it("declares Amazon Linux AMI data sources by region", () => {
    expect(has(/data\s+"aws_ami"\s+"amazon_linux_primary"/)).toBe(true);
    expect(has(/data\s+"aws_ami"\s+"amazon_linux_secondary"/)).toBe(true);
  });

  it("declares AWS Caller Identity for both regions", () => {
    expect(has(/data\s+"aws_caller_identity"\s+"current"/)).toBe(true);
    expect(has(/data\s+"aws_caller_identity"\s+"secondary"/)).toBe(true);
  });

  // NETWORKING RESOURCES
  ["primary", "secondary"].forEach(region => {
    it(`declares all essential networking resources for ${region}`, () => {
      [
        "vpc",
        "internet_gateway",
        "eip",
        "nat_gateway",
        "subnet",
        "route_table",
        "route_table_association"
      ].forEach(resourceType => {
        expect(has(new RegExp(`resource\\s+"aws_${resourceType}"\\s+"${region}`))).toBe(true);
      });
    });
  });

  // SECURITY GROUPS
  [`${"primary_lambda"}`, `${"primary_rds"}`, `${"primary_bastion"}`, `${"secondary_lambda"}`, `${"secondary_rds"}`, `${"secondary_bastion"}`].forEach(sg => {
    it(`has security group '${sg}' defined`, () => {
      expect(has(new RegExp(`resource\\s+"aws_security_group"\\s+"${sg}_sg"`))).toBe(true);
    });
  });

  // SECRETS MANAGER
  ["primary_rds_secret", "secondary_rds_secret"].forEach(secret => {
    it(`declares Secrets Manager secret ${secret}`, () => {
      expect(has(new RegExp(`resource\\s+"aws_secretsmanager_secret"\\s+"${secret}"`))).toBe(true);
      expect(has(new RegExp(`resource\\s+"aws_secretsmanager_secret_version"\\s+"${secret}_version"`))).toBe(true);
    });
  });

  // RDS INSTANCES/RESILIENCE/SECURITY
  ["primary", "secondary"].forEach(region => {
    it(`validates RDS instance in ${region} for encryption, multi-AZ, and private accessibility`, () => {
      expect(has(new RegExp(`resource\\s+"aws_db_instance"\\s+"${region}_rds"`))).toBe(true);
      expect(resourceBlockHas("aws_db_instance", `${region}_rds`, "storage_encrypted")).toBe(true);
      expect(resourceBlockHas("aws_db_instance", `${region}_rds`, "multi_az")).toBe(true);
      expect(resourceBlockHas("aws_db_instance", `${region}_rds`, "publicly_accessible")).toBe(true);
      expect(tf.match(new RegExp(`resource\\s+"aws_db_instance"\\s+"${region}_rds"[\\s\\S]*storage_encrypted\\s*=\\s*true`))).not.toBeNull();
      expect(tf.match(new RegExp(`resource\\s+"aws_db_instance"\\s+"${region}_rds"[\\s\\S]*multi_az\\s*=\\s*true`))).not.toBeNull();
      expect(tf.match(new RegExp(`resource\\s+"aws_db_instance"\\s+"${region}_rds"[\\s\\S]*publicly_accessible\\s*=\\s*false`))).not.toBeNull();
    });
    it(`declares RDS subnet group for ${region}`, () => {
      expect(has(new RegExp(`resource\\s+"aws_db_subnet_group"\\s+"${region}_rds_subnet_group"`))).toBe(true);
    });
  });

  // IAM ROLES & POLICIES
  [
    ["lambda_execution_role", "aws_iam_role"],
    ["lambda_execution_policy", "aws_iam_role_policy"],
    ["bastion_role", "aws_iam_role"],
    ["cloudtrail_role", "aws_iam_role"],
    ["config_role", "aws_iam_role"]
  ].forEach(([name, type]) => {
    it(`declares IAM role/policy '${name}'`, () => {
      expect(has(new RegExp(`resource\\s+"${type}"\\s+"${name}"`))).toBe(true);
    });
  });

  it("declares IAM instance profile for Bastion", () => {
    expect(has(/resource\s+"aws_iam_instance_profile"\s+"bastion_profile"/)).toBe(true);
    expect(has(/resource\s+"aws_iam_instance_profile"\s+"bastion_profile_secondary"/)).toBe(true);
  });

  // EC2 BASTION HOSTS
  ["primary_bastion", "secondary_bastion"].forEach(name => {
    it(`declares Bastion EC2 instance for ${name}`, () => {
      expect(has(new RegExp(`resource\\s+"aws_instance"\\s+"${name}"`))).toBe(true);
      expect(has(/user_data\s*=/)).toBe(true);
    });
  });

  // API GATEWAY & LAMBDA
  it("declares API Gateway, Lambda function, log group, and deployment resources", () => {
    ["aws_api_gateway_rest_api", "aws_lambda_function", "aws_cloudwatch_log_group", "aws_api_gateway_deployment", "aws_api_gateway_stage"].forEach(r => {
      expect(has(new RegExp(`resource\\s+"${r}"\\s+`))).toBe(true);
    });
  });

  // WAF
  it("declares WAF Web ACL and association with API Gateway", () => {
    expect(has(/resource\s+"aws_wafv2_web_acl"\s+"app_waf"/)).toBe(true);
    expect(has(/resource\s+"aws_wafv2_web_acl_association"\s+"app_waf_association"/)).toBe(true);
  });

  // CLOUDTRAIL
  it("declares CloudTrail and bucket policy", () => {
    expect(has(/resource\s+"aws_cloudtrail"\s+"app_cloudtrail"/)).toBe(true);
    expect(has(/resource\s+"aws_s3_bucket_policy"\s+"cloudtrail_bucket_policy"/)).toBe(true);
  });

  // CONFIG
  it("declares Config resources", () => {
    ["aws_config_delivery_channel", "aws_config_configuration_recorder", "aws_config_configuration_recorder_status"].forEach(resource => {
      expect(has(new RegExp(`resource\\s+"${resource}"`))).toBe(true);
    });
  });

  // CLOUDWATCH DASHBOARD & ALARMS
  it("declares CloudWatch dashboard and alarms", () => {
    expect(has(/resource\s+"aws_cloudwatch_dashboard"\s+"app_dashboard"/)).toBe(true);
    expect(has(/resource\s+"aws_cloudwatch_metric_alarm"\s+"lambda_error_alarm"/)).toBe(true);
  });

  it("declares SNS topic for alerts", () => {
    expect(has(/resource\s+"aws_sns_topic"\s+"alerts"/)).toBe(true);
  });

  // OUTPUTS
  [
    "primary_vpc_id",
    "primary_vpc_cidr_block",
    "primary_internet_gateway_id",
    "primary_public_subnet_ids",
    "primary_private_subnet_ids",
    "primary_nat_gateway_ids",
    "primary_nat_gateway_eips",
    "primary_public_route_table_id",
    "primary_private_route_table_ids",
    "secondary_vpc_id",
    "secondary_vpc_cidr_block",
    "secondary_internet_gateway_id",
    "secondary_public_subnet_ids",
    "secondary_private_subnet_ids",
    "secondary_nat_gateway_ids",
    "secondary_nat_gateway_eips",
    "secondary_public_route_table_id",
    "secondary_private_route_table_ids",
    "primary_lambda_security_group_id",
    "primary_rds_security_group_id",
    "primary_bastion_security_group_id",
    "secondary_lambda_security_group_id",
    "secondary_rds_security_group_id",
    "secondary_bastion_security_group_id",
    "primary_kms_key_id",
    "primary_kms_key_arn",
    "primary_kms_alias_name",
    "secondary_kms_key_id",
    "secondary_kms_key_arn",
    "secondary_kms_alias_name",
    "lambda_execution_role_arn",
    "lambda_execution_role_name",
    "cloudtrail_role_arn",
    "config_role_arn",
    "primary_bastion_role_arn",
    "primary_bastion_instance_profile_arn",
    "secondary_bastion_role_arn",
    "secondary_bastion_instance_profile_arn",
    "app_bucket_id",
    "app_bucket_arn",
    "app_bucket_domain_name",
    "cloudtrail_bucket_id",
    "cloudtrail_bucket_arn",
    "config_bucket_id",
    "config_bucket_arn",
    "primary_rds_endpoint",
    "primary_rds_instance_id",
    "primary_rds_instance_arn",
    "primary_rds_port",
    "primary_rds_database_name",
    "primary_rds_subnet_group_name",
    "secondary_rds_endpoint",
    "secondary_rds_instance_id",
    "secondary_rds_instance_arn",
    "secondary_rds_port",
    "secondary_rds_database_name",
    "secondary_rds_subnet_group_name",
    "primary_rds_secret_arn",
    "primary_rds_secret_name",
    "secondary_rds_secret_arn",
    "secondary_rds_secret_name",
    "lambda_function_arn",
    "lambda_function_name",
    "lambda_function_invoke_arn",
    "lambda_log_group_name",
    "lambda_log_group_arn",
    "api_gateway_id",
    "api_gateway_arn",
    "api_gateway_execution_arn",
    "api_gateway_invoke_url",
    "api_gateway_stage_name",
    "api_gateway_stage_arn",
    "api_gateway_resource_id",
    "api_gateway_deployment_id",
    "waf_web_acl_id",
    "waf_web_acl_arn",
    "waf_web_acl_name",
    "cloudtrail_arn",
    "cloudtrail_name",
    "cloudtrail_home_region",
    "cloudwatch_dashboard_arn",
    "cloudwatch_dashboard_name",
    "lambda_error_alarm_arn",
    "lambda_error_alarm_name",
    "sns_topic_arn",
    "sns_topic_name",
    "config_delivery_channel_name",
    "config_recorder_name",
    "config_recorder_role_arn",
    "primary_bastion_instance_id",
    "primary_bastion_public_ip",
    "primary_bastion_private_ip",
    "primary_bastion_public_dns",
    "secondary_bastion_instance_id",
    "secondary_bastion_public_ip",
    "secondary_bastion_private_ip",
    "secondary_bastion_public_dns",
    "primary_ami_id",
    "primary_ami_name",
    "secondary_ami_id",
    "secondary_ami_name",
    "primary_db_username",
    "secondary_db_username",
    "bucket_suffix",
    "current_account_id",
    "current_user_id",
    "current_arn",
    "primary_region",
    "secondary_region",
    "environment",
    "project_name",
    "availability_zones_primary",
    "availability_zones_secondary",
  ].forEach(output => {
    it(`exports output '${output}'`, () => {
      expect(has(new RegExp(`output\\s+"${output}"`))).toBe(true);
    });
  });

  // SENSITIVE DATA SECURITY
  it("does not expose sensitive outputs (password, secret_string, secret_value)", () => {
    const disallowedPatterns = [
      /output\s+.*password/i,
      /output\s+.*secret_value/i,
      /output\s+.*secret_string/i,
    ];
    const hasSensitive = disallowedPatterns.some(pattern => pattern.test(tf));
    expect(hasSensitive).toBe(false);
  });

  // TAGGING STANDARDS
  it("applies common tags to resources", () => {
      expect(has(/tags\s+=\s+merge\(local\.common_tags,/)).toBe(true);
      expect(has(/ManagedBy\s+=\s+"Terraform"/)).toBe(true);
      expect(has(/Project\s+=\s*var\.project_name/)).toBe(true);
  });
});
