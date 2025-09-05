import * as fs from "fs";
import * as path from "path";

const TAP_STACK_TF = path.resolve(__dirname, "../lib/tap_stack.tf");
const tf = fs.readFileSync(TAP_STACK_TF, "utf8");

// Utility function to match regex in file content
const has = (regex: RegExp) => regex.test(tf);

// Helper: match resource blocks with fields
const resourceBlockHas = (resourceType: string, resourceName: string, field: string) =>
  new RegExp(`resource\\s+"${resourceType}"\\s+"${resourceName}"[\\s\\S]*${field}\\s*=`).test(tf);

describe("Terraform tap-stack.tf Static Validation", () => {

  // == GENERAL FILE CHECKS ==
  it("file exists and is large enough", () => {
    expect(fs.existsSync(TAP_STACK_TF)).toBe(true);
    expect(tf.length).toBeGreaterThan(60000); // matches large config attached
  });

  // == VARIABLE VALIDATION ==
  const requiredVariables = [
    "primary_region",
    "secondary_region",
    "project_name",
    "environment",
    "domain_name",
    "db_engine_version",
    "instance_type",
    "rds_instance_class"
  ];
  it("declares all required input variables", () => {
    requiredVariables.forEach(v => 
      expect(has(new RegExp(`variable\\s+"${v}"`))).toBe(true)
    );
  });

  // == LOCALS VALIDATION ==
  it("declares required locals including common_tags, prefixes, and CIDRs", () => {
    expect(has(/locals\s*{[\s\S]*common_tags/)).toBe(true);
    expect(has(/primary_prefix\s*=\s*"\${var.project_name}-\${var.environment}-primary"/)).toBe(true);
    expect(has(/secondary_prefix\s*=\s*"\${var.project_name}-\${var.environment}-secondary"/)).toBe(true);
    expect(has(/primary_vpc_cidr\s*=\s*"10\.0\.0\.0\/16"/)).toBe(true);
    expect(has(/secondary_vpc_cidr\s*=\s*"10\.1\.0\.0\/16"/)).toBe(true);
  });

  // == DATA SOURCES VALIDATION ==
  it("declares Amazon Linux AMI data sources by region", () => {
    expect(has(/data\s+"aws_ami"\s+"amazon_linux_primary"/)).toBe(true);
    expect(has(/data\s+"aws_ami"\s+"amazon_linux_secondary"/)).toBe(true);
  });

  it("declares availability zones for both regions", () => {
    expect(has(/data\s+"aws_availability_zones"\s+"primary"/)).toBe(true);
    expect(has(/data\s+"aws_availability_zones"\s+"secondary"/)).toBe(true);
  });

  // == NETWORKING RESOURCES ==
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

  // == SECURITY GROUPS ==
  ["primary_web", "secondary_web", "primary_rds", "secondary_rds", "primary_bastion", "secondary_bastion", "primary_alb", "secondary_alb"].forEach(sg => {
    it(`has security group '${sg}' defined`, () => {
      expect(has(new RegExp(`resource\\s+"aws_security_group"\\s+"${sg}"`))).toBe(true);
    });
  });

  // == SECRETS MANAGER ==
  ["primary_rds_credentials", "secondary_rds_credentials"].forEach(secret => {
    it(`declares Secrets Manager secret ${secret}`, () => {
      expect(has(new RegExp(`resource\\s+"aws_secretsmanager_secret"\\s+"${secret}"`))).toBe(true);
      expect(has(new RegExp(`resource\\s+"aws_secretsmanager_secret_version"\\s+"${secret}"`))).toBe(true);
    });
  });

  // == RDS INSTANCES/RESILIENCE/SECURITY ==
  ["primary", "secondary"].forEach(region => {
    it(`validates RDS instance in ${region} for encryption, multi-AZ, and private accessibility`, () => {
      expect(has(new RegExp(`resource\\s+"aws_db_instance"\\s+"${region}"`))).toBe(true);
      expect(resourceBlockHas("aws_db_instance", region, "storage_encrypted")).toBe(true);
      expect(resourceBlockHas("aws_db_instance", region, "multi_az")).toBe(true);
      expect(resourceBlockHas("aws_db_instance", region, "publicly_accessible")).toBe(true);
      // Should be explicitly set to true/false as required
      expect(tf.match(new RegExp(`resource\\s+"aws_db_instance"\\s+"${region}"[\\s\\S]*storage_encrypted\\s*=\\s*true`))).not.toBeNull();
      expect(tf.match(new RegExp(`resource\\s+"aws_db_instance"\\s+"${region}"[\\s\\S]*multi_az\\s*=\\s*true`))).not.toBeNull();
      expect(tf.match(new RegExp(`resource\\s+"aws_db_instance"\\s+"${region}"[\\s\\S]*publicly_accessible\\s*=\\s*false`))).not.toBeNull();
    });
    it(`declares RDS subnet group for ${region}`, () => {
      expect(has(new RegExp(`resource\\s+"aws_db_subnet_group"\\s+"${region}"`))).toBe(true);
    });
  });

  // == S3 STORAGE ==
  it("declares S3 buckets, versioning, encryption, public access block and replication", () => {
    ["primary", "secondary"].forEach(region => {
      expect(has(new RegExp(`resource\\s+"aws_s3_bucket"\\s+"${region}"`))).toBe(true);
      expect(has(new RegExp(`resource\\s+"aws_s3_bucket_versioning"\\s+"${region}"`))).toBe(true);
      expect(has(new RegExp(`resource\\s+"aws_s3_bucket_server_side_encryption_configuration"\\s+"${region}"`))).toBe(true);
      expect(has(new RegExp(`resource\\s+"aws_s3_bucket_public_access_block"\\s+"${region}"`))).toBe(true);
    });
    expect(has(/resource\s+"aws_s3_bucket_replication_configuration"\s+"primary_to_secondary"/)).toBe(true);
  });

  // == IAM ROLES & POLICIES ==
  it("declares EC2 IAM role, instance profile, and S3 replication role", () => {
    expect(has(/resource\s+"aws_iam_role"\s+"ec2_role"/)).toBe(true);
    expect(has(/resource\s+"aws_iam_instance_profile"\s+"ec2_profile"/)).toBe(true);
    expect(has(/resource\s+"aws_iam_role"\s+"s3_replication"/)).toBe(true);
    expect(has(/resource\s+"aws_iam_role_policy"\s+"s3_replication"/)).toBe(true);
    expect(has(/resource\s+"aws_iam_role_policy"\s+"ec2_policy"/)).toBe(true);
  });

  // == EC2 BASTION HOSTS ==
  ["primary_bastion", "secondary_bastion"].forEach(name => {
    it(`declares Bastion EC2 instance for ${name}`, () => {
      expect(has(new RegExp(`resource\\s+"aws_instance"\\s+"${name}"`))).toBe(true);
      expect(has(/user_data\s*=/)).toBe(true);
    });
  });

  // == LOAD BALANCERS / ASG ==
  ["primary", "secondary"].forEach(region => {
    it(`declares ALB, target groups, listeners and ASGs for ${region}`, () => {
      expect(has(new RegExp(`resource\\s+"aws_lb"\\s+"${region}"`))).toBe(true);
      expect(has(new RegExp(`resource\\s+"aws_lb_target_group"\\s+"${region}"`))).toBe(true);
      expect(has(new RegExp(`resource\\s+"aws_lb_listener"\\s+"${region}"`))).toBe(true);
      expect(has(new RegExp(`resource\\s+"aws_launch_template"\\s+"${region}"`))).toBe(true);
      expect(has(new RegExp(`resource\\s+"aws_autoscaling_group"\\s+"${region}"`))).toBe(true);
    });
    it(`declares autoscaling policies and alarms for ${region}`, () => {
      expect(has(new RegExp(`resource\\s+"aws_autoscaling_policy"\\s+"${region}_scale_up"`))).toBe(true);
      expect(has(new RegExp(`resource\\s+"aws_autoscaling_policy"\\s+"${region}_scale_down"`))).toBe(true);
      expect(has(new RegExp(`resource\\s+"aws_cloudwatch_metric_alarm"\\s+"${region}_cpu_high"`))).toBe(true);
      expect(has(new RegExp(`resource\\s+"aws_cloudwatch_metric_alarm"\\s+"${region}_cpu_low"`))).toBe(true);
    });
  });

  // == ROUTE 53 DNS ==
  it("declares hosted zone, health checks and DNS records per region", () => {
    expect(has(/resource\s+"aws_route53_zone"\s+"main"/)).toBe(true);
    ["primary", "secondary"].forEach(region => {
      expect(has(new RegExp(`resource\\s+"aws_route53_health_check"\\s+"${region}"`))).toBe(true);
      expect(has(new RegExp(`resource\\s+"aws_route53_record"\\s+"${region}"`))).toBe(true);
      expect(has(new RegExp(`resource\\s+"aws_route53_record"\\s+"www_${region}"`))).toBe(true);
    });
  });

  // == CLOUDWATCH LOGS & DASHBOARDS ==
  it("declares log groups and dashboards per region", () => {
    ["primary", "secondary"].forEach(region => {
      expect(has(new RegExp(`resource\\s+"aws_cloudwatch_log_group"\\s+"${region}"`))).toBe(true);
      expect(has(new RegExp(`resource\\s+"aws_cloudwatch_dashboard"\\s+"${region}"`))).toBe(true);
    });
  });

  // == SNS TOPICS FOR ALERTS ==
  it("declares SNS topics for alerts in both regions", () => {
    ["primary_alerts", "secondary_alerts"].forEach(topic => {
      expect(has(new RegExp(`resource\\s+"aws_sns_topic"\\s+"${topic}"`))).toBe(true);
    });
  });

  // == ADDITIONAL CLOUDWATCH ALARMS ==
  ["primary_rds_cpu", "secondary_rds_cpu", "primary_alb_unhealthy_targets", "secondary_alb_unhealthy_targets"].forEach(alarm => {
    it(`declares CloudWatch alarm ${alarm}`, () => {
      expect(has(new RegExp(`resource\\s+"aws_cloudwatch_metric_alarm"\\s+"${alarm}"`))).toBe(true);
    });
  });

  // == OUTPUTS ==
  const mustHaveOutputs = [
    "primary_vpc_id", "secondary_vpc_id",
    "primary_vpc_cidr", "secondary_vpc_cidr",
    "primary_public_subnet_ids", "secondary_public_subnet_ids",
    "primary_private_subnet_ids", "secondary_private_subnet_ids",
    "primary_internet_gateway_id", "secondary_internet_gateway_id",
    "primary_nat_gateway_ids", "secondary_nat_gateway_ids",
    "primary_web_security_group_id", "secondary_web_security_group_id",
    "primary_rds_security_group_id", "secondary_rds_security_group_id",
    "primary_bastion_security_group_id", "secondary_bastion_security_group_id",
    "primary_alb_security_group_id", "secondary_alb_security_group_id",
    "primary_rds_endpoint", "secondary_rds_endpoint",
    "primary_rds_instance_id", "secondary_rds_instance_id",
    "primary_rds_arn", "secondary_rds_arn",
    "primary_rds_port", "secondary_rds_port",
    "primary_s3_bucket_id", "secondary_s3_bucket_id",
    "primary_s3_bucket_arn", "secondary_s3_bucket_arn",
    "primary_s3_bucket_domain_name", "secondary_s3_bucket_domain_name",
    "primary_ami_id", "secondary_ami_id",
    "primary_ami_name", "secondary_ami_name",
    "ec2_iam_role_arn", "ec2_iam_role_name",
    "ec2_instance_profile_arn", "ec2_instance_profile_name",
    "s3_replication_role_arn",
    "primary_rds_secret_arn", "secondary_rds_secret_arn",
    "primary_rds_secret_name", "secondary_rds_secret_name",
    "primary_key_pair_name", "secondary_key_pair_name",
    "primary_bastion_instance_id", "secondary_bastion_instance_id",
    "primary_bastion_public_ip", "secondary_bastion_public_ip",
    "primary_bastion_private_ip", "secondary_bastion_private_ip",
    "primary_alb_arn", "secondary_alb_arn",
    "primary_alb_dns_name", "secondary_alb_dns_name",
    "primary_alb_zone_id", "secondary_alb_zone_id",
    "primary_target_group_arn", "secondary_target_group_arn",
    "primary_launch_template_id", "secondary_launch_template_id",
    "primary_launch_template_latest_version", "secondary_launch_template_latest_version",
    "primary_autoscaling_group_arn", "secondary_autoscaling_group_arn",
    "primary_autoscaling_group_name", "secondary_autoscaling_group_name",
    "primary_scale_up_policy_arn", "primary_scale_down_policy_arn",
    "secondary_scale_up_policy_arn", "secondary_scale_down_policy_arn",
    "primary_cpu_high_alarm_arn", "primary_cpu_low_alarm_arn",
    "secondary_cpu_high_alarm_arn", "secondary_cpu_low_alarm_arn",
    "primary_rds_cpu_alarm_arn", "secondary_rds_cpu_alarm_arn",
    "route53_zone_id", "route53_zone_name", "route53_name_servers",
    "primary_health_check_id", "secondary_health_check_id",
    "primary_cloudwatch_dashboard_url", "secondary_cloudwatch_dashboard_url",
    "primary_sns_alerts_topic_arn", "secondary_sns_alerts_topic_arn",
    "primary_cloudwatch_log_group_name", "secondary_cloudwatch_log_group_name",
    "primary_cloudwatch_log_group_arn", "secondary_cloudwatch_log_group_arn",
    "primary_availability_zones", "secondary_availability_zones",
    "primary_db_username", "secondary_db_username",
    "primary_application_url", "secondary_application_url",
    "main_application_url", "www_application_url"
  ];
  it("exports all required outputs for resources", () => {
    mustHaveOutputs.forEach(o => 
      expect(has(new RegExp(`output\\s+"${o}"`))).toBe(true)
    );
  });

  // == SENSITIVE DATA SECURITY ==
  it("does not expose sensitive outputs (password, secret_string, secret_value)", () => {
    const disallowedPatterns = [
      /output\s+.*password/i,
      /output\s+.*secret_value/i,
      /output\s+.*secret_string/i,
    ];
    const hasSensitive = disallowedPatterns.some(pattern => pattern.test(tf));
    expect(hasSensitive).toBe(false);
  });

  // == TAGGING STANDARDS ==
  it("applies common tags to resources", () => {
      expect(has(/tags\s+=\s+merge\(local\.common_tags,/)).toBe(true);
      expect(has(/ManagedBy\s+=\s+"Terraform"/)).toBe(true);
      expect(has(/Project\s+=\s*var\.project_name/)).toBe(true);
  });
});

