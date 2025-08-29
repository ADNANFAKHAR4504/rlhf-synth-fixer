import * as fs from "fs";
import * as path from "path";

const LIB_DIR = path.resolve(__dirname, "../lib");
const TAP_STACK_TF = path.join(LIB_DIR, "tap_stack.tf");
const tf = fs.readFileSync(TAP_STACK_TF, "utf8");
const has = (regex: RegExp) => regex.test(tf);

describe("tap_stack.tf comprehensive static validation", () => {

  // 1. File presence and basic content length
  it("exists and has sufficient config content", () => {
    expect(fs.existsSync(TAP_STACK_TF)).toBe(true);
    expect(tf.length).toBeGreaterThan(50000); // Adjusted for full stack length
  });

  // 2. Validate required input variables based on current stack
  it("declares required input variables", () => {
    [
      "environment",
      "project_name",
      "primary_region",
      "secondary_region",
      "primary_vpc_cidr",
      "secondary_vpc_cidr",
      "instance_type",
      "db_instance_class",
      "domain_name"
    ].forEach(variableName => {
      expect(has(new RegExp(`variable\\s+"${variableName}"`))).toBe(true);
    });
  });

  // 3. Validate locals definitions for tags, prefixes, and subnets
  it("defines all expected locals", () => {
    [
      "common_tags",
      "primary_prefix",
      "secondary_prefix",
      "primary_public_subnet_1",
      "primary_public_subnet_2",
      "primary_private_subnet_1",
      "primary_private_subnet_2",
      "secondary_public_subnet_1",
      "secondary_public_subnet_2",
      "secondary_private_subnet_1",
      "secondary_private_subnet_2"
    ].forEach(localName => {
      expect(has(new RegExp(`local\\.${localName}`))).toBe(true);
    });
  });

  // 4. Validate data sources for AMI and availability zones in both regions
  it("declares AWS data sources needed for AMI and AZs", () => {
    [
      /data\s+"aws_ami"\s+"amazon_linux_primary"/,
      /data\s+"aws_ami"\s+"amazon_linux_secondary"/,
      /data\s+"aws_availability_zones"\s+"primary"/,
      /data\s+"aws_availability_zones"\s+"secondary"/
    ].forEach(rx => {
      expect(has(rx)).toBe(true);
    });
  });

  // 5. Validate primary and secondary VPC and subnet resources
  it("creates VPCs and subnets in both primary and secondary regions", () => {
    [
      "aws_vpc.primary",
      "aws_vpc.secondary",
      "aws_subnet.primary_public_1",
      "aws_subnet.primary_public_2",
      "aws_subnet.primary_private_1",
      "aws_subnet.primary_private_2",
      "aws_subnet.secondary_public_1",
      "aws_subnet.secondary_public_2",
      "aws_subnet.secondary_private_1",
      "aws_subnet.secondary_private_2"
    ].forEach(resourceName => {
      expect(has(new RegExp(`resource\\s+"aws_subnet"\\s+"${resourceName.split('.').pop()}"`))
           || has(new RegExp(`resource\\s+"aws_vpc"\\s+"${resourceName.split('.').pop()}"`))).toBe(true);
    });
  });

  // 6. Validate NAT Gateways and EIPs for both regions
  it("declares NAT gateways and elastic IPs", () => {
    [
      /resource\s+"aws_nat_gateway"\s+"primary_1"/,
      /resource\s+"aws_nat_gateway"\s+"primary_2"/,
      /resource\s+"aws_nat_gateway"\s+"secondary_1"/,
      /resource\s+"aws_nat_gateway"\s+"secondary_2"/,
      /resource\s+"aws_eip"\s+"primary_nat_1"/,
      /resource\s+"aws_eip"\s+"primary_nat_2"/,
      /resource\s+"aws_eip"\s+"secondary_nat_1"/,
      /resource\s+"aws_eip"\s+"secondary_nat_2"/
    ].forEach(rx => {
      expect(has(rx)).toBe(true);
    });
  });

  // 7. Validate security groups for ALB, EC2, and RDS in both regions
  it("creates security groups for ALB, EC2, and RDS in both regions", () => {
    [
      "primary_alb", "primary_ec2", "primary_rds",
      "secondary_alb", "secondary_ec2", "secondary_rds"
    ].forEach(sg => {
      expect(has(new RegExp(`resource\\s+"aws_security_group"\\s+"${sg}"`))).toBe(true);
    });
  });

  // 8. Validate IAM roles, policies, and instance profile for EC2 and CloudWatch
  it("defines IAM roles, policies, and instance profiles as expected", () => {
    [
      /resource\s+"aws_iam_role"\s+"ec2_role"/,
      /resource\s+"aws_iam_policy"\s+"s3_access"/,
      /resource\s+"aws_iam_policy"\s+"cloudwatch_access"/,
      /resource\s+"aws_iam_role_policy_attachment"\s+"s3_access"/,
      /resource\s+"aws_iam_role_policy_attachment"\s+"cloudwatch_access"/,
      /resource\s+"aws_iam_role_policy_attachment"\s+"ssm_managed_instance_core"/,
      /resource\s+"aws_iam_instance_profile"\s+"ec2_profile"/
    ].forEach(rx => {
      expect(has(rx)).toBe(true);
    });
  });

  // 9. Validate S3 bucket and related configurations
  it("manages S3 buckets with versioning, encryption, lifecycle, and public access block", () => {
    [
      /resource\s+"aws_s3_bucket"\s+"logs"/,
      /resource\s+"aws_s3_bucket_versioning"\s+"logs"/,
      /resource\s+"aws_s3_bucket_server_side_encryption_configuration"\s+"logs"/,
      /resource\s+"aws_s3_bucket_public_access_block"\s+"logs"/,
      /resource\s+"aws_s3_bucket_lifecycle_configuration"\s+"logs"/,
      /resource\s+"random_string"\s+"bucket_suffix"/
    ].forEach(rx => {
      expect(has(rx)).toBe(true);
    });
  });

  // 10. Validate Launch Templates with correct user data and IAM profile in both regions
  it("defines launch templates for EC2 in both primary and secondary regions", () => {
    [
      /resource\s+"aws_launch_template"\s+"primary"/,
      /resource\s+"aws_launch_template"\s+"secondary"/,
      /user_data = local.user_data/
    ].forEach(rx => expect(has(rx)).toBe(true));
  });

  // 11. Validate Application Load Balancers, target groups and listeners
  it("creates ALBs, target groups and listeners in both regions", () => {
    [
      /resource\s+"aws_lb"\s+"primary"/,
      /resource\s+"aws_lb_target_group"\s+"primary"/,
      /resource\s+"aws_lb_listener"\s+"primary"/,
      /resource\s+"aws_lb"\s+"secondary"/,
      /resource\s+"aws_lb_target_group"\s+"secondary"/,
      /resource\s+"aws_lb_listener"\s+"secondary"/
    ].forEach(rx => expect(has(rx)).toBe(true));
  });

  // 12. Validate Auto Scaling Groups and policies in both regions with scaling alarms
  it("creates ASGs and autoscaling policies for both primary and secondary regions", () => {
    [
      /resource\s+"aws_autoscaling_group"\s+"primary"/,
      /resource\s+"aws_autoscaling_group"\s+"secondary"/,
      /resource\s+"aws_autoscaling_policy"\s+"primary_scale_up"/,
      /resource\s+"aws_autoscaling_policy"\s+"primary_scale_down"/,
      /resource\s+"aws_autoscaling_policy"\s+"secondary_scale_up"/,
      /resource\s+"aws_autoscaling_policy"\s+"secondary_scale_down"/,
      /resource\s+"aws_cloudwatch_metric_alarm"\s+"primary_cpu_high"/,
      /resource\s+"aws_cloudwatch_metric_alarm"\s+"primary_cpu_low"/,
      /resource\s+"aws_cloudwatch_metric_alarm"\s+"secondary_cpu_high"/,
      /resource\s+"aws_cloudwatch_metric_alarm"\s+"secondary_cpu_low"/
    ].forEach(rx => expect(has(rx)).toBe(true));
  });

  // 13. Validate RDS resources: subnet groups, primary instance, secondary replication with encryption enabled
  it("creates RDS subnet groups and instances with encrypted primary and encrypted cross-region replica", () => {
    expect(has(/resource\s+"aws_db_subnet_group"\s+"primary"/)).toBe(true);
    expect(has(/resource\s+"aws_db_subnet_group"\s+"secondary"/)).toBe(true);
    expect(has(/resource\s+"aws_db_instance"\s+"primary"/)).toBe(true);
    expect(has(/resource\s+"aws_db_instance"\s+"secondary_replica"/)).toBe(true);

    // Validate primary storage encryption
    expect(has(/storage_encrypted\s*=\s*true/)).toBe(true);

    // Validate secondary read replica includes storage_encrypted = true
    const replicaRegex = /resource\s+"aws_db_instance"\s+"secondary_replica"[\s\S]*?storage_encrypted\s*=\s*true/;
    expect(replicaRegex.test(tf)).toBe(true);
  });

  // 14. Validate Route53 hosted zone, health checks and weighted records
  it("declares Route53 hosted zone, health checks and weighted routing records", () => {
    expect(has(/resource\s+"aws_route53_zone"\s+"main"/)).toBe(true);
    expect(has(/resource\s+"aws_route53_health_check"\s+"primary_alb"/)).toBe(true);
    expect(has(/resource\s+"aws_route53_health_check"\s+"secondary_alb"/)).toBe(true);
    expect(has(/resource\s+"aws_route53_record"\s+"primary"/)).toBe(true);
    expect(has(/resource\s+"aws_route53_record"\s+"secondary"/)).toBe(true);

    // Ensure health check of type HTTP, no insufficient_data_health_status since it's invalid for HTTP (fix if present)
    expect(!has(/insufficient_data_health_status/)).toBe(true);
  });

  // 15. Validate CloudWatch log group and alarms for ALB & RDS
  it("creates CloudWatch log groups and alarms in both regions for ALB and RDS", () => {
    [
      /resource\s+"aws_cloudwatch_log_group"\s+"app_logs"/,
      /resource\s+"aws_cloudwatch_metric_alarm"\s+"primary_alb_health"/,
      /resource\s+"aws_cloudwatch_metric_alarm"\s+"secondary_alb_health"/,
      /resource\s+"aws_cloudwatch_metric_alarm"\s+"primary_rds_cpu"/
    ].forEach(rx => expect(has(rx)).toBe(true));
  });

  // 16. Validate outputs covering VPC, subnets, load balancers, asgs, launch templates, RDS, S3 bucket, IAM and Route53
  it("defines expected outputs without sensitive info", () => {
    [
      "primary_vpc_id",
      "secondary_vpc_id",
      "primary_public_subnet_ids",
      "primary_private_subnet_ids",
      "secondary_public_subnet_ids",
      "secondary_private_subnet_ids",
      "primary_alb_dns_name",
      "secondary_alb_dns_name",
      "primary_asg_name",
      "secondary_asg_name",
      "primary_launch_template_id",
      "secondary_launch_template_id",
      "primary_rds_endpoint",
      "secondary_rds_endpoint",
      "s3_bucket_name",
      "ec2_iam_role_name",
      "route53_zone_id",
    ].forEach(outputName => {
      expect(has(new RegExp(`output\\s+"${outputName}"`))).toBe(true);
    });

    // Ensure no sensitive keys like password, secret included in outputs
    expect(has(/output\s+.*(password|secret|access_key|secret_key)/i)).toBe(false);
  });

});
