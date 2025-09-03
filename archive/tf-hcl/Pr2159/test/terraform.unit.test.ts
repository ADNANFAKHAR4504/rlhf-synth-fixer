import * as fs from "fs";
import * as path from "path";

const LIB_DIR = path.resolve(__dirname, "../lib");
const TAP_STACK_TF = path.join(LIB_DIR, "tap_stack.tf");
const tf = fs.readFileSync(TAP_STACK_TF, "utf8");
const has = (regex: RegExp) => regex.test(tf);

describe("tap_stack.tf static verification", () => {

  // 1. File existence and size
  it("exists and is a non-trivial config file", () => {
    expect(fs.existsSync(TAP_STACK_TF)).toBe(true);
    expect(tf.length).toBeGreaterThan(1000);
  });

  // 2. Variables as per your file
  it("declares required input variables", () => {
    [
      "aws_region",
      "environment",
      "project_name"
    ].forEach(variable => {
      expect(has(new RegExp(`variable\\s+"${variable}"`))).toBe(true);
    });
  });

  // 3. Locals as per your current file
  it("defines expected locals", () => {
    [
      "common_tags",
      "primary_region",
      "secondary_region",
      "primary_vpc_cidr",
      "secondary_vpc_cidr",
      "primary_public_subnet_cidrs",
      "primary_private_subnet_cidrs",
      "secondary_public_subnet_cidrs",
      "secondary_private_subnet_cidrs"
    ].forEach(local => {
      expect(has(new RegExp(local))).toBe(true);
    });
  });

  // 4. Data sources AMI
  it("declares AMI data sources", () => {
    [
      /data\s+"aws_ami"\s+"amazon_linux_primary"/,
      /data\s+"aws_ami"\s+"amazon_linux_secondary"/
    ].forEach(rx => {
      expect(has(rx)).toBe(true);
    });
  });

  // 5. Random resources as per your file
  it("defines random_string and random_password resources", () => {
    [
      /resource\s+"random_password"\s+"rds_master_password"/,
      /resource\s+"random_string"\s+"rds_master_username"/,
      /resource\s+"random_string"\s+"bucket_suffix"/
    ].forEach(rx => {
      expect(has(rx)).toBe(true);
    });
  });

  // 6. KMS keys and aliases as per your file
  it("defines kms keys and aliases", () => {
    [
      /resource\s+"aws_kms_key"\s+"s3_primary"/,
      /resource\s+"aws_kms_alias"\s+"s3_primary"/,
      /resource\s+"aws_kms_key"\s+"s3_secondary"/,
      /resource\s+"aws_kms_alias"\s+"s3_secondary"/,
      /resource\s+"aws_kms_key"\s+"rds_secondary"/,
      /resource\s+"aws_kms_alias"\s+"rds_secondary"/
    ].forEach(rx => {
      expect(has(rx)).toBe(true);
    });
  });

  // 7. Networking resources
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

  // 8. Security groups as per your file naming
  it("defines security groups for primary and secondary components", () => {
    [
      /resource\s+"aws_security_group"\s+"alb_primary"/,
      /resource\s+"aws_security_group"\s+"ec2_primary"/,
      /resource\s+"aws_security_group"\s+"rds_primary"/,
      /resource\s+"aws_security_group"\s+"alb_secondary"/,
      /resource\s+"aws_security_group"\s+"ec2_secondary"/,
      /resource\s+"aws_security_group"\s+"rds_secondary"/
    ].forEach(rx => {
      expect(has(rx)).toBe(true);
    });
  });

  // 9. IAM roles, policies and instance profiles
  it("defines IAM roles, policies, attachments, and profiles", () => {
    [
      /resource\s+"aws_iam_role"\s+"ec2_role"/,
      /resource\s+"aws_iam_role_policy"\s+"ec2_policy"/,
      /resource\s+"aws_iam_instance_profile"\s+"ec2_profile"/
    ].forEach(rx => {
      expect(has(rx)).toBe(true);
    });
  });

  // 10. CloudWatch logs (log groups are present; metric alarms aren't in your file)
  it("defines cloudwatch log groups", () => {
    [
      /resource\s+"aws_cloudwatch_log_group"\s+"primary"/,
      /resource\s+"aws_cloudwatch_log_group"\s+"secondary"/,
      /resource\s+"aws_cloudwatch_log_group"\s+"rds"/
    ].forEach(rx => {
      expect(has(rx)).toBe(true);
    });
  });

  // 11. Launch Templates and Auto Scaling Groups
  it("defines launch templates and autoscaling groups", () => {
    [
      /resource\s+"aws_launch_template"\s+"primary"/,
      /resource\s+"aws_launch_template"\s+"secondary"/,
      /resource\s+"aws_autoscaling_group"\s+"primary"/,
      /resource\s+"aws_autoscaling_group"\s+"secondary"/
    ].forEach(rx => {
      expect(has(rx)).toBe(true);
    });
  });

  // 12. Load Balancers, Target Groups and Listeners
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

  // 13. RDS subnet groups and instances
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

  // 14. S3 bucket, configs, policies, and CloudFront distribution
  it("defines s3 bucket, configs, policy and cloudfront distribution", () => {
    [
      /resource\s+"aws_s3_bucket"\s+"primary"/,
      /resource\s+"aws_s3_bucket_versioning"\s+"primary"/,
      /resource\s+"aws_s3_bucket_server_side_encryption_configuration"\s+"primary"/,
      /resource\s+"aws_s3_bucket_public_access_block"\s+"primary"/,
      /resource\s+"aws_s3_bucket_policy"\s+"primary_cloudfront"/,
      /resource\s+"aws_cloudfront_origin_access_control"\s+"primary"/,
      /resource\s+"aws_cloudfront_distribution"\s+"main"/
    ].forEach(rx => {
      expect(has(rx)).toBe(true);
    });
  });

  // 15. Outputs present in your file
  it("declares expected outputs", () => {
    [
      // VPC IDs
      "vpc_ids",
      // Subnet IDs
      "subnet_ids",
      // VPC Peering
      "vpc_peering_connection_id",
      // Load Balancers
      "load_balancer_dns_names",
      "load_balancer_zone_ids",
      // Autoscaling
      "autoscaling_group_names",
      // Launch Templates
      "launch_template_ids",
      // AMIs
      "ami_ids",
      // Security Groups
      "security_group_ids",
      // S3 Buckets
      "s3_bucket_names",
      "s3_bucket_arns",
      // CloudFront
      "cloudfront_distribution_id",
      "cloudfront_distribution_domain_name",
      // RDS
      "rds_instance_endpoints",
      "rds_instance_identifiers",
      "rds_master_username",
      // IAM
      "iam_role_arn",
      "iam_instance_profile_name",
      // KMS Keys
      "kms_key_ids",
      "kms_key_arns",
      // CloudWatch
      "cloudwatch_log_group_names",
      // Route53
      "route53_zone_id",
      "route53_zone_name",
      "route53_health_check_ids",
      // NAT Gateway & EIP
      "nat_gateway_ids",
      "elastic_ip_addresses",
      "internet_gateway_ids",
      // Target groups
      "target_group_arns",
      // Application URL
      "application_url"
    ].forEach(output => {
      expect(has(new RegExp(`output\\s+"${output}"`))).toBe(true);
    });
  });

  // 16. Ensure no sensitive outputs
  it("does not output sensitive information", () => {
    expect(has(/output\s+.*(secret|password|access_key|secret_key)/i)).toBe(false);
  });

});
