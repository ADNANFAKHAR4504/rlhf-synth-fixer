import * as fs from "fs";
import * as path from "path";

const TAP_STACK_TF = path.resolve(__dirname, "../lib/tap_stack.tf");
const tf = fs.readFileSync(TAP_STACK_TF, "utf8");
const has = (regex: RegExp) => regex.test(tf);

const expectedVariables = [
  "primary_region",
  "secondary_region",
  "allowed_ssh_cidrs",
  "allowed_https_cidrs",
  "instance_type",
  "db_instance_class"
];

const expectedLocals = [
  "environment",
  "primary_vpc_cidr",
  "secondary_vpc_cidr",
  "primary_public_subnet_cidr",
  "primary_private_subnet_cidr",
  "secondary_public_subnet_cidr",
  "secondary_private_subnet_cidr",
  "common_tags",
  "primary_prefix",
  "secondary_prefix"
];

const expectedSecurityGroups = [
  "ec2_primary",
  "ec2_secondary",
  "elb_primary",
  "elb_secondary",
  "rds_primary",
  "rds_secondary"
];

describe("tap_stack.tf static content validation", () => {
  it("file exists and contains sufficient content", () => {
    expect(fs.existsSync(TAP_STACK_TF)).toBe(true);
    expect(tf.length).toBeGreaterThan(30000);
  });

  it("declares all required input variables", () => {
    expectedVariables.forEach(variable => {
      expect(has(new RegExp(`variable\\s+"${variable}"`))).toBe(true);
    });
  });

  it("defines expected locals", () => {
    expectedLocals.forEach(local => {
      expect(has(new RegExp(`local\\.${local}`))).toBe(true);
    });
  });

  it("declares VPC and subnet resources for primary and secondary regions", () => {
    ["primary", "secondary"].forEach(region => {
      expect(has(new RegExp(`resource\\s+"aws_vpc"\\s+"${region}"`))).toBe(true);
      expect(has(new RegExp(`resource\\s+"aws_subnet"\\s+"${region}_public"`))).toBe(true);
      expect(has(new RegExp(`resource\\s+"aws_subnet"\\s+"${region}_private"`))).toBe(true);
    });
  });

  it("declares NAT gateways and elastic IPs for both regions", () => {
    ["primary", "secondary"].forEach(region => {
      expect(has(new RegExp(`resource\\s+"aws_nat_gateway"\\s+"${region}"`))).toBe(true);
      expect(has(new RegExp(`resource\\s+"aws_eip"\\s+"${region}_nat"`))).toBe(true);
    });
  });

  it("creates expected security groups for both regions", () => {
    expectedSecurityGroups.forEach(sg => {
      expect(has(new RegExp(`resource\\s+"aws_security_group"\\s+"${sg}"`))).toBe(true);
    });
  });

  it("declares IAM roles and instance profiles for EC2 and RDS monitoring", () => {
    [
      "aws_iam_role.ec2_role",
      "aws_iam_instance_profile.ec2_profile",
      "aws_iam_role.rds_monitoring",
      "aws_iam_role_policy_attachment.rds_monitoring"
    ].forEach(item => {
      const name = item.split(".")[1];
      expect(has(new RegExp(`resource\\s+"aws_iam_role"\\s+"${name}"`)) || has(new RegExp(`resource\\s+"aws_iam_instance_profile"\\s+"${name}"`)) || has(new RegExp(`resource\\s+"aws_iam_role_policy_attachment"\\s+"${name}"`))).toBe(true);
    });
  });

  it("declares launch templates in both primary and secondary regions", () => {
    ["primary", "secondary"].forEach(region => {
      expect(has(new RegExp(`resource\\s+"aws_launch_template"\\s+"${region}"`))).toBe(true);
    });
  });

  it("declares auto scaling groups, policies, and scaling alarms for both regions", () => {
    ["primary", "secondary"].forEach(region => {
      expect(has(new RegExp(`resource\\s+"aws_autoscaling_group"\\s+"${region}"`))).toBe(true);
      expect(has(new RegExp(`resource\\s+"aws_autoscaling_policy"\\s+"${region}_scale_up"`))).toBe(true);
      expect(has(new RegExp(`resource\\s+"aws_autoscaling_policy"\\s+"${region}_scale_down"`))).toBe(true);
      expect(has(new RegExp(`resource\\s+"aws_cloudwatch_metric_alarm"\\s+"${region}_cpu_high"`))).toBe(true);
      expect(has(new RegExp(`resource\\s+"aws_cloudwatch_metric_alarm"\\s+"${region}_cpu_low"`))).toBe(true);
    });
  });

  it("declares primary and replica RDS instances with storage encrypted", () => {
    expect(has(/resource\s+"aws_db_instance"\s+"primary"/)).toBe(true);
    expect(has(/resource\s+"aws_db_instance"\s+"secondary"/)).toBe(true);
    expect(tf.match(/resource\s+"aws_db_instance"\s+"primary"[\s\S]*?storage_encrypted\s*=\s*true/)).not.toBeNull();
    expect(tf.match(/resource\s+"aws_db_instance"\s+"secondary"[\s\S]*?storage_encrypted\s*=\s*true/)).not.toBeNull();
  });

  it("declares S3 bucket with versioning, encryption, and public access block", () => {
    expect(has(/resource\s+"aws_s3_bucket"\s+"cloudfront_bucket"/)).toBe(true);
    expect(has(/resource\s+"aws_s3_bucket_versioning"\s+"cloudfront_bucket"/)).toBe(true);
    expect(has(/resource\s+"aws_s3_bucket_server_side_encryption_configuration"\s+"cloudfront_bucket"/)).toBe(true);
    expect(has(/resource\s+"aws_s3_bucket_public_access_block"\s+"cloudfront_bucket"/)).toBe(true);
  });

  it("declares CloudFront distribution and origin access control", () => {
    expect(has(/resource\s+"aws_cloudfront_distribution"\s+"s3_distribution"/)).toBe(true);
    expect(has(/resource\s+"aws_cloudfront_origin_access_control"\s+"s3_oac"/)).toBe(true);
  });

  it("declares CloudWatch log groups for both regions", () => {
    ["primary", "secondary"].forEach(region => {
      expect(has(new RegExp(`resource\\s+"aws_cloudwatch_log_group"\\s+"${region}_app_logs"`))).toBe(true);
    });
  });

  it("declares expected outputs without sensitive data", () => {
    const outputsToCheck = [
      "primary_vpc_id",
      "secondary_vpc_id",
      "primary_public_subnet_id",
      "primary_private_subnet_id",
      "secondary_public_subnet_id",
      "secondary_private_subnet_id",
      "primary_internet_gateway_id",
      "secondary_internet_gateway_id",
      "primary_nat_gateway_id",
      "secondary_nat_gateway_id",
      "primary_public_route_table_id",
      "primary_private_route_table_id",
      "secondary_public_route_table_id",
      "secondary_private_route_table_id",
      "primary_ec2_security_group_id",
      "secondary_ec2_security_group_id",
      "primary_elb_security_group_id",
      "secondary_elb_security_group_id",
      "primary_rds_security_group_id",
      "secondary_rds_security_group_id",
      "primary_ami_id",
      "secondary_ami_id",
      "primary_ami_name",
      "secondary_ami_name",
      "ec2_iam_role_arn",
      "ec2_instance_profile_name",
      "rds_monitoring_role_arn",
      "primary_launch_template_id",
      "secondary_launch_template_id",
      "primary_asg_name",
      "secondary_asg_name",
      "primary_alb_arn",
      "secondary_alb_arn",
      "primary_alb_dns_name",
      "secondary_alb_dns_name",
      "primary_target_group_arn",
      "secondary_target_group_arn",
      "primary_rds_endpoint",
      "secondary_rds_endpoint",
      "primary_rds_instance_id",
      "secondary_rds_instance_id",
      "primary_rds_port",
      "secondary_rds_port",
      "rds_database_name",
      "rds_username",
      "s3_bucket_name",
      "s3_bucket_arn",
      "s3_bucket_domain_name",
      "s3_bucket_regional_domain_name",
      "cloudfront_distribution_id",
      "cloudfront_distribution_arn",
      "cloudfront_distribution_domain_name",
      "cloudfront_distribution_hosted_zone_id",
      "primary_log_group_name",
      "secondary_log_group_name",
      "primary_cpu_high_alarm_name",
      "secondary_cpu_high_alarm_name",
      "primary_scale_up_policy_arn",
      "primary_scale_down_policy_arn",
      "secondary_scale_up_policy_arn",
      "secondary_scale_down_policy_arn",
      "primary_availability_zones",
      "secondary_availability_zones",
      "primary_region",
      "secondary_region",
      "environment",
      "common_tags"
    ];

    outputsToCheck.forEach(outputVar => {
      expect(has(new RegExp(`output\\s+"${outputVar}"`))).toBe(true);
    });

    // Ensure no sensitive output keys like password, secret, or keys exposed
    expect(has(/output\s+.*(password|secret|access_key|secret_key)/i)).toBe(false);
  });
});
