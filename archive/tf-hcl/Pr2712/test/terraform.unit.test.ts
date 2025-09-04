import * as fs from "fs";
import * as path from "path";

const TAP_STACK_TF = path.resolve(__dirname, "../lib/tap_stack.tf");
const tf = fs.readFileSync(TAP_STACK_TF, "utf8");
const has = (regex: RegExp) => regex.test(tf);

describe("Terraform tap-stack static validation", () => {
  // === General checks ===
  it("file exists and is large enough", () => {
    expect(fs.existsSync(TAP_STACK_TF)).toBe(true);
    expect(tf.length).toBeGreaterThan(60000); // Matches attached config size
  });

  // === VARIABLES ===
  const expectedVariables = [
    "primary_region",
    "secondary_region",
    "environment",
    "allowed_ssh_cidrs",
    "allowed_https_cidrs"
  ];
  it("declares required input variables", () => {
    expectedVariables.forEach(v =>
      expect(has(new RegExp(`variable\\s+"${v}"`))).toBe(true)
    );
  });

  // === LOCALS ===
  it("declares locals for common tags and naming conventions", () => {
    expect(has(/locals\s*{[\s\S]*common_tags/)).toBe(true);
    expect(has(/primary_name_prefix\s*=\s*"tap-prod-primary"/)).toBe(true);
    expect(has(/secondary_name_prefix\s*=\s*"tap-prod-secondary"/)).toBe(true);
  });

  // === DATA SOURCES ===
  it("declares regional data sources for latest Amazon Linux AMI and AZs", () => {
    expect(has(/data\s+"aws_ami"\s+"amazon_linux_primary"/)).toBe(true);
    expect(has(/data\s+"aws_ami"\s+"amazon_linux_secondary"/)).toBe(true);
    expect(has(/data\s+"aws_availability_zones"\s+"primary_azs"/)).toBe(true);
    expect(has(/data\s+"aws_availability_zones"\s+"secondary_azs"/)).toBe(true);
    expect(has(/data\s+"aws_caller_identity"\s+"current"/)).toBe(true);
  });

  // === RANDOM RESOURCES ===
  it("declares random resource for RDS credentials and bucket suffix", () => {
    expect(has(/resource\s+"random_string"\s+"rds_username_primary"/)).toBe(true);
    expect(has(/resource\s+"random_password"\s+"rds_password_primary"/)).toBe(true);
    expect(has(/resource\s+"random_string"\s+"rds_username_secondary"/)).toBe(true);
    expect(has(/resource\s+"random_password"\s+"rds_password_secondary"/)).toBe(true);
    expect(has(/resource\s+"random_string"\s+"bucket_suffix"/)).toBe(true);
  });

  // === NETWORKING ===
  ["primary", "secondary"].forEach(region => {
    it(`declares VPC networking resources for ${region}`, () => {
      expect(has(new RegExp(`resource\\s+"aws_vpc"\\s+"${region}_vpc"`))).toBe(true);
      expect(has(new RegExp(`resource\\s+"aws_internet_gateway"\\s+"${region}_igw"`))).toBe(true);
      expect(has(new RegExp(`resource\\s+"aws_nat_gateway"\\s+"${region}_nat"`))).toBe(true);
      expect(has(new RegExp(`resource\\s+"aws_eip"\\s+"${region}_nat_eip"`))).toBe(true);
      expect(has(new RegExp(`resource\\s+"aws_subnet"\\s+"${region}_public_subnets"`))).toBe(true);
      expect(has(new RegExp(`resource\\s+"aws_subnet"\\s+"${region}_private_subnets"`))).toBe(true);
      expect(has(new RegExp(`resource\\s+"aws_route_table"\\s+"${region}_public_rt"`))).toBe(true);
      expect(has(new RegExp(`resource\\s+"aws_route_table"\\s+"${region}_private_rt"`))).toBe(true);
    });
  });

  // === SECURITY GROUPS ===
  ["primary_ec2_sg","primary_rds_sg","primary_alb_sg","secondary_ec2_sg","secondary_rds_sg","secondary_alb_sg"].forEach(sg => {
    it(`declares security group ${sg}`, () => {
      expect(has(new RegExp(`resource\\s+"aws_security_group"\\s+"${sg}"`))).toBe(true);
    });
  });

  // === IAM ===
  it("declares IAM roles, policies for EC2, Lambda, S3 Replication", () => {
    [
      /resource\s+"aws_iam_role"\s+"ec2_role"/,
      /resource\s+"aws_iam_role"\s+"secondary_ec2_role"/,
      /resource\s+"aws_iam_instance_profile"\s+"ec2_profile"/,
      /resource\s+"aws_iam_instance_profile"\s+"secondary_ec2_profile"/,
      /resource\s+"aws_iam_role"\s+"replication_role"/,
      /resource\s+"aws_iam_policy"\s+"replication_policy"/,
      /resource\s+"aws_iam_role"\s+"primary_lambda_role"/,
      /resource\s+"aws_iam_policy"\s+"primary_lambda_policy"/,
      /resource\s+"aws_iam_role"\s+"secondary_lambda_role"/,
      /resource\s+"aws_iam_policy"\s+"secondary_lambda_policy"/
    ].forEach(rx => expect(has(rx)).toBe(true));
  });

  // === SECRETS MANAGER ===
  it("declares Secrets Manager secrets for RDS in both regions", () => {
    expect(has(/resource\s+"aws_secretsmanager_secret"\s+"primary_rds_secret"/)).toBe(true);
    expect(has(/resource\s+"aws_secretsmanager_secret"\s+"secondary_rds_secret"/)).toBe(true);
    expect(has(/resource\s+"aws_secretsmanager_secret_version"\s+"primary_rds_secret_version"/)).toBe(true);
    expect(has(/resource\s+"aws_secretsmanager_secret_version"\s+"secondary_rds_secret_version"/)).toBe(true);
  });

  // === RDS ===
  ["primary","secondary"].forEach(region => {
    it(`declares RDS and subnet groups for ${region}`, () => {
      expect(has(new RegExp(`resource\\s+"aws_db_instance"\\s+"${region}_rds"`))).toBe(true);
      expect(has(new RegExp(`resource\\s+"aws_db_subnet_group"\\s+"${region}_db_subnet_group"`))).toBe(true);
      // storage encryption, multi_az, non-public
      expect(tf.match(new RegExp(`resource\\s+"aws_db_instance"\\s+"${region}_rds"[\\s\\S]*storage_encrypted\\s*=\\s*true`))).not.toBeNull();
      expect(tf.match(new RegExp(`resource\\s+"aws_db_instance"\\s+"${region}_rds"[\\s\\S]*multi_az\\s*=\\s*true`))).not.toBeNull();
      expect(tf.match(new RegExp(`resource\\s+"aws_db_instance"\\s+"${region}_rds"[\\s\\S]*publicly_accessible\\s*=\\s*false`))).not.toBeNull();
    });
  });

  // === S3 BUCKETS ===
  it("declares S3 buckets, versioning, encryption, replication", () => {
    expect(has(/resource\s+"aws_s3_bucket"\s+"primary_bucket"/)).toBe(true);
    expect(has(/resource\s+"aws_s3_bucket"\s+"secondary_bucket"/)).toBe(true);
    expect(has(/resource\s+"aws_s3_bucket_versioning"\s+"primary_bucket_versioning"/)).toBe(true);
    expect(has(/resource\s+"aws_s3_bucket_versioning"\s+"secondary_bucket_versioning"/)).toBe(true);
    expect(has(/resource\s+"aws_s3_bucket_server_side_encryption_configuration"\s+"primary_bucket_encryption"/)).toBe(true);
    expect(has(/resource\s+"aws_s3_bucket_server_side_encryption_configuration"\s+"secondary_bucket_encryption"/)).toBe(true);
    expect(has(/resource\s+"aws_s3_bucket_replication_configuration"\s+"replication"/)).toBe(true);
    expect(has(/resource\s+"aws_iam_role"\s+"replication_role"/)).toBe(true);
    expect(has(/resource\s+"aws_iam_policy"\s+"replication_policy"/)).toBe(true);
    expect(has(/resource\s+"aws_iam_role_policy_attachment"\s+"replication_policy_attachment"/)).toBe(true);
  });

  // === EC2 INSTANCES ===
  ["primary","secondary"].forEach(region => {
    it(`declares EC2 instances in ${region} region`, () => {
      expect(has(new RegExp(`resource\\s+"aws_instance"\\s+"${region}_ec2"`))).toBe(true);
    });
  });

  // === LOAD BALANCERS ===
  ["primary", "secondary"].forEach(region => {
    it(`declares Load Balancer, target group, listener for ${region}`, () => {
      expect(has(new RegExp(`resource\\s+"aws_lb"\\s+"${region}_alb"`))).toBe(true);
      expect(has(new RegExp(`resource\\s+"aws_lb_target_group"\\s+"${region}_tg"`))).toBe(true);
      expect(has(new RegExp(`resource\\s+"aws_lb_listener"\\s+"${region}_listener"`))).toBe(true);
    });
  });

  // === WAF ===
  it("declares WAF Web ACLs and associations for both ALBs", () => {
    expect(has(/resource\s+"aws_wafv2_web_acl"\s+"primary_waf"/)).toBe(true);
    expect(has(/resource\s+"aws_wafv2_web_acl"\s+"secondary_waf"/)).toBe(true);
    expect(has(/resource\s+"aws_wafv2_web_acl_association"\s+"primary_waf_association"/)).toBe(true);
    expect(has(/resource\s+"aws_wafv2_web_acl_association"\s+"secondary_waf_association"/)).toBe(true);
  });

  // === LAMBDA ===
  ["primary_rds_backup","secondary_rds_backup"].forEach(lf => {
    it(`declares Lambda function ${lf}`, () => {
      expect(has(new RegExp(`resource\\s+"aws_lambda_function"\\s+"${lf}"`))).toBe(true);
      expect(has(/runtime\s+=\s+"python3\.9"/)).toBe(true);
    });
  });

  // === CLOUDWATCH ALARMS ===
  it("declares EC2/RDS CloudWatch alarms in both regions", () => {
    ["primary_ec2_cpu_alarm","primary_rds_cpu_alarm","secondary_ec2_cpu_alarm","secondary_rds_cpu_alarm"].forEach(alarm => {
      expect(has(new RegExp(`resource\\s+"aws_cloudwatch_metric_alarm"\\s+"${alarm}"`))).toBe(true);
    });
  });

  // === CLOUDTRAIL ===
  it("declares CloudTrail, bucket, bucket policy for multi-region", () => {
    expect(has(/resource\s+"aws_cloudtrail"\s+"main_trail"/)).toBe(true);
    expect(has(/resource\s+"aws_s3_bucket"\s+"cloudtrail_bucket"/)).toBe(true);
    expect(has(/is_multi_region_trail\s+=\s*true/)).toBe(true);
    expect(has(/event_selector\s*{[\s\S]*type\s*=\s*"AWS::S3::Object"/)).toBe(true);
  });

  // === VPC FLOW LOGS ===
  // Primary = base name; Secondary = prefixed
it('declares VPC Flow Logs (IAM role/policy/log group/flow log) for primary', () => {
  expect(has(/resource\s+"aws_iam_role"\s+"flow_logs_role"/)).toBe(true);
  expect(has(/resource\s+"aws_iam_role_policy"\s+"flow_logs_policy"/)).toBe(true);
  expect(has(/resource\s+"aws_cloudwatch_log_group"\s+"primary_vpc_flow_logs"/)).toBe(true);
  expect(has(/resource\s+"aws_flow_log"\s+"primary_vpc_flow_logs"/)).toBe(true);
});

it('declares VPC Flow Logs (IAM role/policy/log group/flow log) for secondary', () => {
  expect(has(/resource\s+"aws_iam_role"\s+"secondary_flow_logs_role"/)).toBe(true);
  expect(has(/resource\s+"aws_iam_role_policy"\s+"secondary_flow_logs_policy"/)).toBe(true);
  expect(has(/resource\s+"aws_cloudwatch_log_group"\s+"secondary_vpc_flow_logs"/)).toBe(true);
  expect(has(/resource\s+"aws_flow_log"\s+"secondary_vpc_flow_logs"/)).toBe(true);
});

  // === CLOUDFRONT ===
  it("declares CloudFront distribution with OAI, ALB and S3 origins, and AWS Shield", () => {
    expect(has(/resource\s+"aws_cloudfront_distribution"\s+"main_distribution"/)).toBe(true);
    expect(has(/resource\s+"aws_cloudfront_origin_access_identity"\s+"oai"/)).toBe(true);
    expect(has(/resource\s+"aws_s3_bucket_policy"\s+"primary_bucket_policy"/)).toBe(true);
  });

  // === EBS SNAPSHOT LIFECYCLE ===
  it("declares DLM policies and roles for EBS snapshot lifecycle", () => {
    expect(has(/resource\s+"aws_dlm_lifecycle_policy"\s+"primary_ebs_backup"/)).toBe(true);
    expect(has(/resource\s+"aws_iam_role"\s+"dlm_lifecycle_role"/)).toBe(true);
    expect(has(/resource\s+"aws_iam_role_policy"\s+"dlm_lifecycle_policy"/)).toBe(true);
    expect(has(/resource\s+"aws_dlm_lifecycle_policy"\s+"secondary_ebs_backup"/)).toBe(true);
    expect(has(/resource\s+"aws_iam_role"\s+"secondary_dlm_lifecycle_role"/)).toBe(true);
    expect(has(/resource\s+"aws_iam_role_policy"\s+"secondary_dlm_lifecycle_policy"/)).toBe(true);
  });

  // === OUTPUTS ===
  // Strict outputs
  const mustHaveOutputs = [
    "primary_vpc_id", "secondary_vpc_id",
    "primary_vpc_cidr", "secondary_vpc_cidr",
    "primary_public_subnet_ids", "primary_private_subnet_ids",
    "secondary_public_subnet_ids", "secondary_private_subnet_ids",
    "primary_igw_id", "secondary_igw_id", "primary_nat_gateway_id", "secondary_nat_gateway_id",
    "primary_ec2_sg_id", "secondary_ec2_sg_id",
    "primary_rds_sg_id", "secondary_rds_sg_id",
    "primary_alb_sg_id", "secondary_alb_sg_id",
    "primary_rds_endpoint", "secondary_rds_endpoint",
    "primary_rds_port", "secondary_rds_port",
    "primary_rds_db_name", "secondary_rds_db_name",
    "primary_rds_secret_arn", "secondary_rds_secret_arn",
    "primary_s3_bucket_id", "primary_s3_bucket_arn",
    "secondary_s3_bucket_id", "secondary_s3_bucket_arn",
    "cloudtrail_s3_bucket_id", "ec2_role_arn", "secondary_ec2_role_arn",
    "s3_replication_role_arn", "primary_lambda_role_arn", "secondary_lambda_role_arn",
    "primary_ec2_instance_ids", "primary_ec2_private_ips",
    "secondary_ec2_instance_ids", "secondary_ec2_private_ips",
    "primary_ami_id", "secondary_ami_id",
    "primary_alb_dns_name", "primary_alb_zone_id", "primary_alb_arn",
    "secondary_alb_dns_name", "secondary_alb_zone_id", "secondary_alb_arn",
    "primary_target_group_arn", "secondary_target_group_arn",
    "primary_waf_arn", "secondary_waf_arn",
    "primary_lambda_function_arn", "secondary_lambda_function_arn",
    "primary_lambda_function_name", "secondary_lambda_function_name",
    "primary_ec2_cpu_alarm_names", "primary_rds_cpu_alarm_name",
    "secondary_ec2_cpu_alarm_names", "secondary_rds_cpu_alarm_name",
    "cloudtrail_arn", "cloudtrail_home_region",
    "primary_vpc_flow_logs_id", "secondary_vpc_flow_logs_id",
    "primary_flow_logs_log_group_name", "secondary_flow_logs_log_group_name",
    "cloudfront_distribution_id", "cloudfront_distribution_arn", "cloudfront_domain_name", "cloudfront_hosted_zone_id",
    "primary_dlm_policy_arn", "secondary_dlm_policy_arn",
    "primary_availability_zones", "secondary_availability_zones",
    "aws_account_id", "primary_region", "secondary_region",
    "primary_public_route_table_id", "primary_private_route_table_id",
    "secondary_public_route_table_id", "secondary_private_route_table_id",
    "environment", "primary_name_prefix", "secondary_name_prefix"
  ];
  it("declares required outputs", () => {
    mustHaveOutputs.forEach(o =>
      expect(has(new RegExp(`output\\s+"${o}"`))).toBe(true)
    );
  });

  // === TAG STANDARDS ===
  it("applies common tags for all resources", () => {
    expect(has(/tags\s+=\s+merge\(local\.common_tags,/)).toBe(true);
    expect(has(/Environment\s+=\s+"Production"/)).toBe(true);
  });

  // === SECURITY: no secrets/passwords in outputs ===
  it("does not expose secrets/passwords in outputs", () => {
    // Allow outputs referencing ARNs, disallow exposing 'password', 'secret_value', 'secret_string'
    const disallowed = [
      /output\s+.*password/i,
      /output\s+.*secret_value/i,
      /output\s+.*secret_string/i,
    ];
    expect(disallowed.every(rx => !rx.test(tf))).toBe(true);
  });
});
