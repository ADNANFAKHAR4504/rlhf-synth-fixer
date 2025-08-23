import * as fs from "fs";
import * as path from "path";

const LIB_DIR = path.resolve(__dirname, "../lib");
const TAP_STACK_TF = path.join(LIB_DIR, "tap_stack.tf");
const tf = fs.readFileSync(TAP_STACK_TF, "utf8");
const has = (regex: RegExp) => regex.test(tf);

describe("tap_stack.tf static verification", () => {

  // --------------------------------------------------------------------------
  // 1. File validity check
  // --------------------------------------------------------------------------
  it("exists and is a non-trivial config file", () => {
    expect(fs.existsSync(TAP_STACK_TF)).toBe(true);
    expect(tf.length).toBeGreaterThan(1000);
  });

  // --------------------------------------------------------------------------
  // 2. Variables
  // --------------------------------------------------------------------------
  it("declares required input variables", () => {
    [
      "aws_region",
      "allowed_cidr_blocks",
      "instance_type",
      "db_instance_class"
    ].forEach(variable => {
      expect(has(new RegExp(`variable\\s+"${variable}"`))).toBe(true);
    });
  });

  // --------------------------------------------------------------------------
  // 3. Locals
  // --------------------------------------------------------------------------
  it("defines expected locals", () => {
    [
      "common_tags",
      "name_prefix",
      "primary_region",
      "secondary_region",
      "primary_vpc_cidr",
      "secondary_vpc_cidr",
      "primary_azs",
      "secondary_azs",
      "primary_public_subnets",
      "primary_private_subnets",
      "secondary_public_subnets",
      "secondary_private_subnets"
    ].forEach(local => {
      expect(has(new RegExp(local))).toBe(true);
    });
  });

  // --------------------------------------------------------------------------
  // 4. Data Sources
  // --------------------------------------------------------------------------
  it("declares AMI data sources", () => {
    [
      /data\s+"aws_ami"\s+"amazon_linux_primary"/,
      /data\s+"aws_ami"\s+"amazon_linux_secondary"/
    ].forEach(rx => {
      expect(has(rx)).toBe(true);
    });
  });

  // --------------------------------------------------------------------------
  // 5. Random resources
  // --------------------------------------------------------------------------
  it("defines random_string and random_password resources", () => {
    [
      /resource\s+"random_string"\s+"primary_db_username"/,
      /resource\s+"random_password"\s+"primary_db_password"/,
      /resource\s+"random_string"\s+"secondary_db_username"/,
      /resource\s+"random_password"\s+"secondary_db_password"/,
      /resource\s+"random_string"\s+"bucket_suffix"/
    ].forEach(rx => {
      expect(has(rx)).toBe(true);
    });
  });

  // --------------------------------------------------------------------------
  // 6. KMS Keys
  // --------------------------------------------------------------------------
  it("defines kms keys and aliases", () => {
    [
      /resource\s+"aws_kms_key"\s+"primary_rds"/,
      /resource\s+"aws_kms_alias"\s+"primary_rds"/,
      /resource\s+"aws_kms_key"\s+"secondary_rds"/,
      /resource\s+"aws_kms_alias"\s+"secondary_rds"/
    ].forEach(rx => {
      expect(has(rx)).toBe(true);
    });
  });

  // --------------------------------------------------------------------------
  // 7. Networking
  // --------------------------------------------------------------------------
  it("defines VPCs, Subnets, IGWs, NATs and RouteTables", () => {
    [
      /resource\s+"aws_vpc"\s+"primary"/,
      /resource\s+"aws_vpc"\s+"secondary"/,
      /resource\s+"aws_subnet"\s+"primary_public"/,
      /resource\s+"aws_subnet"\s+"primary_private"/,
      /resource\s+"aws_subnet"\s+"secondary_public"/,
      /resource\s+"aws_subnet"\s+"secondary_private"/,
      /resource\s+"aws_internet_gateway"\s+"primary"/,
      /resource\s+"aws_internet_gateway"\s+"secondary"/,
      /resource\s+"aws_eip"\s+"primary_nat"/,
      /resource\s+"aws_eip"\s+"secondary_nat"/,
      /resource\s+"aws_nat_gateway"\s+"primary"/,
      /resource\s+"aws_nat_gateway"\s+"secondary"/,
      /resource\s+"aws_route_table"\s+"primary_public"/,
      /resource\s+"aws_route_table"\s+"primary_private"/,
      /resource\s+"aws_route_table"\s+"secondary_public"/,
      /resource\s+"aws_route_table"\s+"secondary_private"/,
      /resource\s+"aws_route_table_association"\s+"primary_public"/,
      /resource\s+"aws_route_table_association"\s+"primary_private"/,
      /resource\s+"aws_route_table_association"\s+"secondary_public"/,
      /resource\s+"aws_route_table_association"\s+"secondary_private"/,
    ].forEach(rx => {
      expect(has(rx)).toBe(true);
    });
  });

  // --------------------------------------------------------------------------
  // 8. Security Groups
  // --------------------------------------------------------------------------
  it("defines security groups for primary and secondary components", () => {
    [
      /resource\s+"aws_security_group"\s+"primary_alb"/,
      /resource\s+"aws_security_group"\s+"primary_ec2"/,
      /resource\s+"aws_security_group"\s+"primary_rds"/,
      /resource\s+"aws_security_group"\s+"secondary_alb"/,
      /resource\s+"aws_security_group"\s+"secondary_ec2"/,
      /resource\s+"aws_security_group"\s+"secondary_rds"/
    ].forEach(rx => {
      expect(has(rx)).toBe(true);
    });
  });

  // --------------------------------------------------------------------------
  // 9. IAM
  // --------------------------------------------------------------------------
  it("defines IAM roles, policies, attachments, and profiles", () => {
    [
      /resource\s+"aws_iam_role"\s+"ec2_role"/,
      /resource\s+"aws_iam_policy"\s+"cloudwatch_logs"/,
      /resource\s+"aws_iam_role_policy_attachment"\s+"ec2_cloudwatch"/,
      /resource\s+"aws_iam_instance_profile"\s+"ec2_profile"/,
      /resource\s+"aws_iam_role"\s+"rds_monitoring"/,
      /resource\s+"aws_iam_role_policy_attachment"\s+"rds_monitoring"/
    ].forEach(rx => {
      expect(has(rx)).toBe(true);
    });
  });

  // --------------------------------------------------------------------------
  // 10. CloudWatch
  // --------------------------------------------------------------------------
  it("defines cloudwatch log groups and metric alarms", () => {
    [
      /resource\s+"aws_cloudwatch_log_group"\s+"primary_app_logs"/,
      /resource\s+"aws_cloudwatch_log_group"\s+"secondary_app_logs"/,
      /resource\s+"aws_cloudwatch_metric_alarm"\s+"primary_high_cpu"/,
      /resource\s+"aws_cloudwatch_metric_alarm"\s+"primary_low_cpu"/,
      /resource\s+"aws_cloudwatch_metric_alarm"\s+"secondary_high_cpu"/,
      /resource\s+"aws_cloudwatch_metric_alarm"\s+"secondary_low_cpu"/
    ].forEach(rx => {
      expect(has(rx)).toBe(true);
    });
  });

  // --------------------------------------------------------------------------
  // 11. Launch Templates & ASGs
  // --------------------------------------------------------------------------
  it("defines launch templates and autoscaling groups", () => {
    [
      /resource\s+"aws_launch_template"\s+"primary"/,
      /resource\s+"aws_launch_template"\s+"secondary"/,
      /resource\s+"aws_autoscaling_group"\s+"primary"/,
      /resource\s+"aws_autoscaling_group"\s+"secondary"/,
      /resource\s+"aws_autoscaling_policy"\s+"primary_scale_up"/,
      /resource\s+"aws_autoscaling_policy"\s+"primary_scale_down"/,
      /resource\s+"aws_autoscaling_policy"\s+"secondary_scale_up"/,
      /resource\s+"aws_autoscaling_policy"\s+"secondary_scale_down"/
    ].forEach(rx => {
      expect(has(rx)).toBe(true);
    });
  });

  // --------------------------------------------------------------------------
  // 12. Load Balancers
  // --------------------------------------------------------------------------
  it("defines ALBs, target groups and listeners", () => {
    [
      /resource\s+"aws_lb"\s+"primary"/,
      /resource\s+"aws_lb"\s+"secondary"/,
      /resource\s+"aws_lb_target_group"\s+"primary"/,
      /resource\s+"aws_lb_target_group"\s+"secondary"/,
      /resource\s+"aws_lb_listener"\s+"primary"/,
      /resource\s+"aws_lb_listener"\s+"secondary"/
    ].forEach(rx => {
      expect(has(rx)).toBe(true);
    });
  });

  // --------------------------------------------------------------------------
  // 13. RDS
  // --------------------------------------------------------------------------
  it("defines RDS subnet groups and instances", () => {
    [
      /resource\s+"aws_db_subnet_group"\s+"primary"/,
      /resource\s+"aws_db_subnet_group"\s+"secondary"/,
      /resource\s+"aws_db_instance"\s+"primary"/,
      /resource\s+"aws_db_instance"\s+"secondary"/
    ].forEach(rx => {
      expect(has(rx)).toBe(true);
    });
  });

  // --------------------------------------------------------------------------
  // 14. S3 + CloudFront
  // --------------------------------------------------------------------------
  it("defines s3 bucket, configs, policy and cloudfront distribution", () => {
    [
      /resource\s+"aws_s3_bucket"\s+"static_content"/,
      /resource\s+"aws_s3_bucket_versioning"\s+"static_content"/,
      /resource\s+"aws_s3_bucket_server_side_encryption_configuration"\s+"static_content"/,
      /resource\s+"aws_s3_bucket_public_access_block"\s+"static_content"/,
      /resource\s+"aws_s3_bucket_policy"\s+"static_content"/,
      /resource\s+"aws_cloudfront_origin_access_control"\s+"static_content"/,
      /resource\s+"aws_cloudfront_distribution"\s+"static_content"/,
      /resource\s+"aws_s3_object"\s+"index_html"/
    ].forEach(rx => {
      expect(has(rx)).toBe(true);
    });
  });

  // --------------------------------------------------------------------------
  // 15. Outputs
  // --------------------------------------------------------------------------
  it("declares expected outputs", () => {
    [
      // VPC / Subnets
      "primary_vpc_id","secondary_vpc_id",
      "primary_public_subnet_ids","primary_private_subnet_ids",
      "secondary_public_subnet_ids","secondary_private_subnet_ids",

      // ALB
      "primary_alb_dns_name","secondary_alb_dns_name",
      "primary_alb_zone_id","secondary_alb_zone_id",

      // RDS
      "primary_rds_endpoint","secondary_rds_endpoint",
      "primary_rds_port","secondary_rds_port",

      // S3 & CloudFront
      "s3_bucket_name","s3_bucket_domain_name",
      "cloudfront_distribution_id","cloudfront_domain_name",

      // AMI
      "primary_ami_id","secondary_ami_id",

      // IAM
      "ec2_iam_role_arn","ec2_instance_profile_name","rds_monitoring_role_arn",

      // AutoScaling
      "primary_asg_name","secondary_asg_name",

      // Security Groups
      "primary_alb_security_group_id","primary_ec2_security_group_id","primary_rds_security_group_id",
      "secondary_alb_security_group_id","secondary_ec2_security_group_id","secondary_rds_security_group_id",

      // KMS
      "primary_kms_key_id","secondary_kms_key_id",

      // CloudWatch log groups
      "primary_log_group_name","secondary_log_group_name",

      // Launch Templates
      "primary_launch_template_id","secondary_launch_template_id",

      // NAT & EIPs
      "primary_nat_gateway_ids","secondary_nat_gateway_ids",
      "primary_eip_addresses","secondary_eip_addresses"
    ].forEach(output => {
      expect(has(new RegExp(`output\\s+"${output}"`))).toBe(true);
    });
  });

  // --------------------------------------------------------------------------
  // 16. Sensitive outputs should not exist
  // --------------------------------------------------------------------------
  it("does not output sensitive information", () => {
    expect(has(/output\s+.*(secret|password|access_key|secret_key)/i)).toBe(false);
  });

});
