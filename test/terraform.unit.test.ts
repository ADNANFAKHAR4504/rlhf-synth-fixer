import fs from "fs";
import path from "path";

describe("TapStack Terraform Unit Tests (accurate and fixed)", () => {
  let tfContent: string;

  beforeAll(() => {
    const tfPath = path.join(__dirname, "../lib/tap_stack.tf");
    tfContent = fs.readFileSync(tfPath, "utf8");
  });

  function countMatches(regex: RegExp) {
    const matches = tfContent.match(regex);
    return matches ? matches.length : 0;
  }

  // Variables & Data Sources Tests
  describe("Variables & Data Sources", () => {
    test("contains expected variables", () => {
      expect(tfContent).toMatch(/variable\s+"primary_region"/);
      expect(tfContent).toMatch(/variable\s+"secondary_region"/);
      expect(tfContent).toMatch(/variable\s+"domain_name"/);
      expect(tfContent).toMatch(/variable\s+"environment"/);
    });

    test("contains data sources for availability zones and AMIs", () => {
      expect(tfContent).toMatch(/data\s+"aws_availability_zones"\s+"primary_azs"/);
      expect(tfContent).toMatch(/data\s+"aws_availability_zones"\s+"secondary_azs"/);
      expect(tfContent).toMatch(/data\s+"aws_ami"\s+"primary_amazon_linux"/);
      expect(tfContent).toMatch(/data\s+"aws_ami"\s+"secondary_amazon_linux"/);
    });
  });

  // Locals Tests
  describe("Locals", () => {
    test("defines locals resource_suffix and primary_vpc_name", () => {
      expect(tfContent).toMatch(/locals\s*{/);
      expect(tfContent).toMatch(/resource_suffix/);
      expect(tfContent).toMatch(/primary_vpc_name/);
    });
  });

  // Random & Secrets Tests
  describe("Random & Secrets", () => {
    test("creates random strings and passwords", () => {
      expect(tfContent).toMatch(/resource\s+"random_string"\s+"suffix"/);
      expect(tfContent).toMatch(/resource\s+"random_string"\s+"rds_username_primary"/);
      expect(tfContent).toMatch(/resource\s+"random_password"\s+"rds_password_primary"/);
      expect(tfContent).toMatch(/resource\s+"random_string"\s+"rds_username_secondary"/);
      expect(tfContent).toMatch(/resource\s+"random_password"\s+"rds_password_secondary"/);
    });
  });

  // VPC & Networking Tests
  describe("VPC and Networking", () => {
    test("defines VPCs and internet gateways", () => {
      expect(tfContent).toMatch(/resource\s+"aws_vpc"\s+"primary_vpc"/);
      expect(tfContent).toMatch(/resource\s+"aws_vpc"\s+"secondary_vpc"/);
      expect(tfContent).toMatch(/resource\s+"aws_internet_gateway"\s+"primary_igw"/);
      expect(tfContent).toMatch(/resource\s+"aws_internet_gateway"\s+"secondary_igw"/);
    });

    test("creates public and private subnets", () => {
      expect(countMatches(/resource\s+"aws_subnet"\s+"primary_public_subnet_\d"/g)).toBeGreaterThanOrEqual(1);
      expect(countMatches(/resource\s+"aws_subnet"\s+"primary_private_subnet_\d"/g)).toBeGreaterThanOrEqual(1);
      expect(countMatches(/resource\s+"aws_subnet"\s+"secondary_public_subnet_\d"/g)).toBeGreaterThanOrEqual(1);
      expect(countMatches(/resource\s+"aws_subnet"\s+"secondary_private_subnet_\d"/g)).toBeGreaterThanOrEqual(1);
    });

    test("creates NAT gateways and Elastic IPs", () => {
      expect(countMatches(/resource\s+"aws_nat_gateway"\s+"primary_nat_gw_\d"/g)).toBeGreaterThanOrEqual(1);
      expect(countMatches(/resource\s+"aws_nat_gateway"\s+"secondary_nat_gw_\d"/g)).toBeGreaterThanOrEqual(1);
      expect(countMatches(/resource\s+"aws_eip"\s+"primary_nat_eip_\d"/g)).toBeGreaterThanOrEqual(1);
      expect(countMatches(/resource\s+"aws_eip"\s+"secondary_nat_eip_\d"/g)).toBeGreaterThanOrEqual(1);
    });

    test("route tables and associations exist", () => {
      expect(tfContent).toMatch(/resource\s+"aws_route_table"\s+"primary_public_rt"/);
      expect(tfContent).toMatch(/resource\s+"aws_route_table"\s+"primary_private_rt_\d"/);
      expect(tfContent).toMatch(/resource\s+"aws_route_table_association"\s+"primary_public_rta_\d"/);
      expect(tfContent).toMatch(/resource\s+"aws_route_table_association"\s+"primary_private_rta_\d"/);
      expect(tfContent).toMatch(/resource\s+"aws_route_table"\s+"secondary_public_rt"/);
      expect(tfContent).toMatch(/resource\s+"aws_route_table"\s+"secondary_private_rt_\d"/);
      expect(tfContent).toMatch(/resource\s+"aws_route_table_association"\s+"secondary_public_rta_\d"/);
      expect(tfContent).toMatch(/resource\s+"aws_route_table_association"\s+"secondary_private_rta_\d"/);
    });
  });

  // Security Groups Tests
  describe("Security Groups", () => {
    test("defines security groups for ALB, EC2, and RDS", () => {
      expect(tfContent).toMatch(/resource\s+"aws_security_group"\s+"primary_alb_sg"/);
      expect(tfContent).toMatch(/resource\s+"aws_security_group"\s+"secondary_alb_sg"/);
      expect(tfContent).toMatch(/resource\s+"aws_security_group"\s+"primary_ec2_sg"/);
      expect(tfContent).toMatch(/resource\s+"aws_security_group"\s+"secondary_ec2_sg"/);
      expect(tfContent).toMatch(/resource\s+"aws_security_group"\s+"primary_rds_sg"/);
      expect(tfContent).toMatch(/resource\s+"aws_security_group"\s+"secondary_rds_sg"/);
    });
  });

  // IAM Roles & Policies Tests
  describe("IAM Roles & Policies", () => {
    test("defines ec2 role, instance profile, and policies", () => {
      expect(tfContent).toMatch(/resource\s+"aws_iam_role"\s+"ec2_role"/);
      expect(tfContent).toMatch(/resource\s+"aws_iam_instance_profile"\s+"ec2_profile"/);
      expect(tfContent).toMatch(/resource\s+"aws_iam_policy"\s+"s3_access_policy"/);
      expect(tfContent).toMatch(/resource\s+"aws_iam_role_policy_attachment"\s+"ec2_s3_attachment"/);
      expect(tfContent).toMatch(/resource\s+"aws_iam_policy"\s+"cloudwatch_policy"/);
      expect(tfContent).toMatch(/resource\s+"aws_iam_role_policy_attachment"\s+"ec2_cloudwatch_attachment"/);
      expect(tfContent).toMatch(/resource\s+"aws_iam_policy"\s+"ssm_policy"/);
      expect(tfContent).toMatch(/resource\s+"aws_iam_role_policy_attachment"\s+"ec2_ssm_attachment"/);
    });
  });

  // S3 Bucket Tests
  describe("S3 Buckets", () => {
    test("creates S3 buckets with versioning, encryption, and public access blocks", () => {
      expect(tfContent).toMatch(/resource\s+"aws_s3_bucket"\s+"primary_bucket"/);
      expect(tfContent).toMatch(/resource\s+"aws_s3_bucket_versioning"\s+"primary_bucket_versioning"/);
      expect(tfContent).toMatch(/resource\s+"aws_s3_bucket_server_side_encryption_configuration"\s+"primary_bucket_encryption"/);
      expect(tfContent).toMatch(/resource\s+"aws_s3_bucket_public_access_block"\s+"primary_bucket_pab"/);

      expect(tfContent).toMatch(/resource\s+"aws_s3_bucket"\s+"secondary_bucket"/);
      expect(tfContent).toMatch(/resource\s+"aws_s3_bucket_versioning"\s+"secondary_bucket_versioning"/);
      expect(tfContent).toMatch(/resource\s+"aws_s3_bucket_server_side_encryption_configuration"\s+"secondary_bucket_encryption"/);
      expect(tfContent).toMatch(/resource\s+"aws_s3_bucket_public_access_block"\s+"secondary_bucket_pab"/);
    });
  });

  // ACM & Load Balancer Tests
  describe("ACM and Load Balancer", () => {
    test("ACM certificate", () => {
      expect(tfContent).toMatch(/resource\s+"aws_acm_certificate"\s+"cloudfront_cert"/);
    });

    test("ALB, target groups, listeners", () => {
      expect(tfContent).toMatch(/resource\s+"aws_lb"\s+"primary_alb"/);
      expect(tfContent).toMatch(/resource\s+"aws_lb_target_group"\s+"primary_tg"/);
      expect(tfContent).toMatch(/resource\s+"aws_lb_listener"\s+"primary_listener"/);

      expect(tfContent).toMatch(/resource\s+"aws_lb"\s+"secondary_alb"/);
      expect(tfContent).toMatch(/resource\s+"aws_lb_target_group"\s+"secondary_tg"/);
      expect(tfContent).toMatch(/resource\s+"aws_lb_listener"\s+"secondary_listener"/);
    });
  });

  // Launch Templates & Auto Scaling Group Tests
  describe("Launch Templates & Auto Scaling Groups", () => {
    test("launch templates and autoscaling groups", () => {
      expect(tfContent).toMatch(/resource\s+"aws_launch_template"\s+"primary_lt"/);
      expect(tfContent).toMatch(/resource\s+"aws_launch_template"\s+"secondary_lt"/);
      expect(tfContent).toMatch(/resource\s+"aws_autoscaling_group"\s+"primary_asg"/);
      expect(tfContent).toMatch(/resource\s+"aws_autoscaling_group"\s+"secondary_asg"/);
    });

    test("autoscaling policies", () => {
      expect(tfContent).toMatch(/resource\s+"aws_autoscaling_policy"\s+"primary_scaling_policy"/);
      expect(tfContent).toMatch(/resource\s+"aws_autoscaling_policy"\s+"secondary_scaling_policy"/);
    });
  });

  // RDS and DB Subnet Groups Tests
  describe("RDS and DB Subnet Groups", () => {
    test("primary and secondary RDS instances and subnet groups", () => {
      expect(tfContent).toMatch(/resource\s+"aws_db_subnet_group"\s+"primary_db_subnet_group"/);
      expect(tfContent).toMatch(/resource\s+"aws_db_instance"\s+"primary_rds"/);
      expect(tfContent).toMatch(/resource\s+"aws_db_subnet_group"\s+"secondary_db_subnet_group"/);
      expect(tfContent).toMatch(/resource\s+"aws_db_instance"\s+"secondary_rds"/);
    });
  });

  // Secrets Manager and SSM Parameters Tests
  describe("Secrets Manager & SSM Parameters", () => {
    test("Secrets manager secrets and versions", () => {
      expect(tfContent).toMatch(/resource\s+"aws_secretsmanager_secret"\s+"primary_rds_secret"/);
      expect(tfContent).toMatch(/resource\s+"aws_secretsmanager_secret_version"\s+"primary_rds_secret_version"/);
      expect(tfContent).toMatch(/resource\s+"aws_secretsmanager_secret"\s+"secondary_rds_secret"/);
      expect(tfContent).toMatch(/resource\s+"aws_secretsmanager_secret_version"\s+"secondary_rds_secret_version"/);
    });

    test("SSM parameters for DB credentials", () => {
      expect(tfContent).toMatch(/resource\s+"aws_ssm_parameter"\s+"primary_db_host"/);
      expect(tfContent).toMatch(/resource\s+"aws_ssm_parameter"\s+"primary_db_username"/);
      expect(tfContent).toMatch(/resource\s+"aws_ssm_parameter"\s+"primary_db_password"/);
      expect(tfContent).toMatch(/resource\s+"aws_ssm_parameter"\s+"secondary_db_host"/);
      expect(tfContent).toMatch(/resource\s+"aws_ssm_parameter"\s+"secondary_db_username"/);
      expect(tfContent).toMatch(/resource\s+"aws_ssm_parameter"\s+"secondary_db_password"/);
    });
  });

  // CloudWatch and Alarms Tests
  describe("CloudWatch & Alarms", () => {
    test("cloudwatch metric alarms", () => {
      expect(tfContent).toMatch(/resource\s+"aws_cloudwatch_metric_alarm"\s+"primary_cpu_alarm"/);
      expect(tfContent).toMatch(/resource\s+"aws_cloudwatch_metric_alarm"\s+"secondary_cpu_alarm"/);
    });
  });

  // Outputs Tests
  describe("Outputs", () => {
    test("exports all expected outputs", () => {
      [
        "primary_vpc_id", "secondary_vpc_id",
        "primary_vpc_cidr", "secondary_vpc_cidr",
        "primary_public_subnet_1_id", "primary_public_subnet_2_id",
        "primary_private_subnet_1_id", "primary_private_subnet_2_id",
        "secondary_public_subnet_1_id", "secondary_public_subnet_2_id",
        "secondary_private_subnet_1_id", "secondary_private_subnet_2_id",
        "primary_igw_id", "secondary_igw_id",
        "primary_nat_gateway_1_id", "primary_nat_gateway_2_id",
        "secondary_nat_gateway_1_id", "secondary_nat_gateway_2_id",
        "primary_nat_eip_1", "primary_nat_eip_2",
        "secondary_nat_eip_1", "secondary_nat_eip_2",
        "primary_alb_sg_id", "secondary_alb_sg_id",
        "primary_ec2_sg_id", "secondary_ec2_sg_id",
        "primary_rds_sg_id", "secondary_rds_sg_id",
        "primary_s3_bucket_id", "primary_s3_bucket_arn", "primary_s3_bucket_domain",
        "secondary_s3_bucket_id", "secondary_s3_bucket_arn", "secondary_s3_bucket_domain",
        "primary_rds_endpoint", "primary_rds_address", "primary_rds_arn", "primary_rds_id",
        "secondary_rds_endpoint", "secondary_rds_address", "secondary_rds_arn", "secondary_rds_id",
        "primary_rds_secret_arn", "primary_rds_secret_id",
        "secondary_rds_secret_arn", "secondary_rds_secret_id",
        "primary_db_host_parameter", "primary_db_username_parameter",
        "secondary_db_host_parameter", "secondary_db_username_parameter",
        "ec2_role_arn", "ec2_role_name", "ec2_instance_profile_arn", "ec2_instance_profile_name",
        "s3_access_policy_arn", "cloudwatch_policy_arn", "ssm_policy_arn",
        "primary_alb_dns", "primary_alb_arn", "primary_alb_zone_id",
        "secondary_alb_dns", "secondary_alb_arn", "secondary_alb_zone_id",
        "primary_target_group_arn", "primary_target_group_name",
        "secondary_target_group_arn", "secondary_target_group_name",
        "primary_asg_id", "primary_asg_arn", "primary_asg_name",
        "secondary_asg_id", "secondary_asg_arn", "secondary_asg_name",
        "primary_launch_template_id", "primary_launch_template_arn",
        "secondary_launch_template_id", "secondary_launch_template_arn",
        "primary_ami_id", "primary_ami_name", "secondary_ami_id", "secondary_ami_name",
        "route53_zone_id", "route53_zone_name", "route53_name_servers",
        "primary_health_check_id", "secondary_health_check_id",
        "cloudfront_distribution_id", "cloudfront_distribution_arn", "cloudfront_distribution_domain", "cloudfront_distribution_hosted_zone_id",
        "cloudfront_oai_id", "cloudfront_oai_path",
        "waf_web_acl_id", "waf_web_acl_arn",
        "acm_certificate_arn", "acm_certificate_domain",
        "primary_cpu_alarm_arn", "secondary_cpu_alarm_arn",
        "primary_public_route_table_id", "primary_private_route_table_1_id", "primary_private_route_table_2_id",
        "secondary_public_route_table_id", "secondary_private_route_table_1_id", "secondary_private_route_table_2_id",
        "primary_db_subnet_group_name", "primary_db_subnet_group_arn", "secondary_db_subnet_group_name", "secondary_db_subnet_group_arn",
        "resource_suffix", "environment", "primary_region", "secondary_region", "domain_name"
      ].forEach((outputName) => {
        expect(tfContent).toMatch(new RegExp(`output\\s+"${outputName}"`));
      });
    });
  });
});
