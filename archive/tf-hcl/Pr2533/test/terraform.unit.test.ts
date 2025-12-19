import * as fs from "fs";
import * as path from "path";

const TAP_STACK_TF = path.resolve(__dirname, "../lib/tap_stack.tf");
const tf = fs.readFileSync(TAP_STACK_TF, "utf8");
const has = (regex: RegExp) => regex.test(tf);

describe("Terraform stack static validation", () => {
  // General structure and standards
  it("file exists with sufficient content", () => {
    expect(fs.existsSync(TAP_STACK_TF)).toBe(true);
    expect(tf.length).toBeGreaterThan(30000);
  });

  // ==== Variables ====
  const expectedVariables = [
    "primary_region",
    "secondary_region",
    "allowed_ssh_cidrs",
    "allowed_https_cidrs",
    "domain_name",
    "notification_email"
  ];
  it("declares required input variables", () => {
    expectedVariables.forEach(variable => 
      expect(has(new RegExp(`variable\\s+"${variable}"`))).toBe(true));
  });

  // ==== Locals ====
  const expectedLocals = [
    "name_prefix",
    "common_tags",
    "primary_vpc_cidr",
    "secondary_vpc_cidr",
    "primary_public_subnets",
    "primary_private_subnets",
    "secondary_public_subnets",
    "secondary_private_subnets",
    "instance_type",
    "min_size",
    "max_size",
    "desired_size"
  ];
  it("declares all key locals", () => {
    expectedLocals.forEach(local => 
      expect(has(new RegExp(`locals?\\s*\\{[\\s\\S]*${local}`))).toBe(true));
  });

  // ==== Data Sources ====
  it("declares AWS AMI data sources per region", () => {
    expect(has(/data\s+"aws_ami"\s+"amazon_linux_primary"/)).toBe(true);
    expect(has(/data\s+"aws_ami"\s+"amazon_linux_secondary"/)).toBe(true);
  });
  it("declares AWS availability zone data sources per region", () => {
    expect(has(/data\s+"aws_availability_zones"\s+"primary"/)).toBe(true);
    expect(has(/data\s+"aws_availability_zones"\s+"secondary"/)).toBe(true);
  });

  // ==== VPC Networking ====
  ["primary", "secondary"].forEach(region => {
    it(`declares VPC, subnets, gateway, NAT, and route tables for ${region}`, () => {
      expect(has(new RegExp(`resource\\s+"aws_vpc"\\s+"${region}"`))).toBe(true);
      expect(has(new RegExp(`resource\\s+"aws_subnet"\\s+"${region}_public"`))).toBe(true);
      expect(has(new RegExp(`resource\\s+"aws_subnet"\\s+"${region}_private"`))).toBe(true);
      expect(has(new RegExp(`resource\\s+"aws_internet_gateway"\\s+"${region}"`))).toBe(true);
      expect(has(new RegExp(`resource\\s+"aws_nat_gateway"\\s+"${region}"`))).toBe(true);
      expect(has(new RegExp(`resource\\s+"aws_eip"\\s+"${region}_nat"`))).toBe(true);
      expect(has(new RegExp(`resource\\s+"aws_route_table"\\s+"${region}_public"`))).toBe(true);
      expect(has(new RegExp(`resource\\s+"aws_route_table"\\s+"${region}_private"`))).toBe(true);
    });
  });

  // ==== Security Groups ====
  const sgs = [
    "primary_ec2", "secondary_ec2",
    "primary_alb", "secondary_alb",
    "primary_rds", "secondary_rds"
  ];
  it("declares security groups for EC2, ALB, and RDS per region", () => {
    sgs.forEach(sg =>
      expect(has(new RegExp(`resource\\s+"aws_security_group"\\s+"${sg}"`))).toBe(true)
    );
  });

  // ==== IAM Roles and Policies ====
  it("declares IAM role for ec2_role", () => {
  expect(has(/resource\s+"aws_iam_role"\s+"ec2_role"/)).toBe(true);
});

it("declares IAM role policy for ec2_policy", () => {
  expect(has(/resource\s+"aws_iam_role_policy"\s+"ec2_policy"/)).toBe(true);
});

it("declares IAM role for lambda_role", () => {
  expect(has(/resource\s+"aws_iam_role"\s+"lambda_role"/)).toBe(true);
});

it("declares IAM role policy for lambda_policy", () => {
  expect(has(/resource\s+"aws_iam_role_policy"\s+"lambda_policy"/)).toBe(true);
});

it("declares IAM role for s3_replication", () => {
  expect(has(/resource\s+"aws_iam_role"\s+"s3_replication"/)).toBe(true);
});

it("declares IAM role policy for s3_replication", () => {
  expect(has(/resource\s+"aws_iam_role_policy"\s+"s3_replication"/)).toBe(true);
});

  // ==== S3 Buckets and Replication ====
  it("declares S3 buckets, versioning and replication config", () => {
    expect(has(/resource\s+"aws_s3_bucket"\s+"primary"/)).toBe(true);
    expect(has(/resource\s+"aws_s3_bucket"\s+"secondary"/)).toBe(true);
    expect(has(/resource\s+"aws_s3_bucket_versioning"\s+"primary"/)).toBe(true);
    expect(has(/resource\s+"aws_s3_bucket_versioning"\s+"secondary"/)).toBe(true);
    expect(has(/resource\s+"aws_s3_bucket_replication_configuration"\s+"primary_to_secondary"/)).toBe(true);
  });

  // ==== Launch Templates ====
  ["primary", "secondary"].forEach(region => {
    it(`declares launch template for ${region}`, () => {
      expect(has(new RegExp(`resource\\s+"aws_launch_template"\\s+"${region}"`))).toBe(true)
    });
  });

  // ==== Load Balancer and Target Groups ====
  ["primary", "secondary"].forEach(region => {
    it(`declares ALB, target group, and listener for ${region}`, () => {
      expect(has(new RegExp(`resource\\s+"aws_lb"\\s+"${region}"`))).toBe(true);
      expect(has(new RegExp(`resource\\s+"aws_lb_target_group"\\s+"${region}"`))).toBe(true);
      expect(has(new RegExp(`resource\\s+"aws_lb_listener"\\s+"${region}"`))).toBe(true);
    });
  });

  // ==== Auto Scaling Groups ====
  ["primary", "secondary"].forEach(region => {
    it(`declares auto scaling group for ${region}`, () => {
      expect(has(new RegExp(`resource\\s+"aws_autoscaling_group"\\s+"${region}"`))).toBe(true);
    });
  });

  // ==== RDS and DB Subnet Groups ====
  ["primary", "secondary"].forEach(region => {
    it(`declares RDS DB and subnet group for ${region}`, () => {
      expect(has(new RegExp(`resource\\s+"aws_db_instance"\\s+"${region}"`))).toBe(true);
      expect(has(new RegExp(`resource\\s+"aws_db_subnet_group"\\s+"${region}"`))).toBe(true);
      expect(tf.match(new RegExp(`resource\\s+"aws_db_instance"\\s+"${region}"[\\s\\S]*?storage_encrypted\\s*=\\s*true`))).not.toBeNull();
    });
  });

  // ==== SNS, Lambda & Alerts ====
  ["alerts", "alerts_secondary"].forEach(topic => {
    it(`declares SNS topic for ${topic}`, () => {
      expect(has(new RegExp(`resource\\s+"aws_sns_topic"\\s+"${topic}"`))).toBe(true);
      expect(has(new RegExp(`resource\\s+"aws_sns_topic_subscription"\\s+"email_alerts`))).toBe(true);
    });
  });
  ["primary_backup", "secondary_backup"].forEach(lambda => {
    it(`declares Lambda backup function for ${lambda}`, () => {
      expect(has(new RegExp(`resource\\s+"aws_lambda_function"\\s+"${lambda}"`))).toBe(true);
    });
  });

  // ==== CloudWatch Alarms ====
  ["primary_cpu", "secondary_cpu", "primary_rds_cpu", "secondary_rds_cpu"].forEach(alarm => {
    it(`declares CloudWatch alarm for ${alarm}`, () => {
      expect(has(new RegExp(`resource\\s+"aws_cloudwatch_metric_alarm"\\s+"${alarm}"`))).toBe(true);
    });
  });

  // ==== Route 53 for DNS & Failover ====
  it("declares Route53 resources for DNS and health checks", () => {
    expect(has(/resource\s+"aws_route53_zone"\s+"main"/)).toBe(true);
    expect(has(/resource\s+"aws_route53_health_check"\s+"primary"/)).toBe(true);
    expect(has(/resource\s+"aws_route53_health_check"\s+"secondary"/)).toBe(true);
    expect(has(/resource\s+"aws_route53_record"\s+"primary"/)).toBe(true);
    expect(has(/resource\s+"aws_route53_record"\s+"secondary"/)).toBe(true);
  });

  // ==== Random Resources and Lambdas ====
  it("declares random string or password resources", () => {
    ["db_username", "db_password", "bucket_suffix"].forEach(rnd =>
      expect(has(new RegExp(`resource\\s+"random_(string|password)"\\s+"${rnd}"`))).toBe(true)
    );
  });

  // ==== Outputs ====
  const expectedOutputs = [
    // VPC, subnet, gateway, NAT, security groups, IAM
    "primary_vpc_id","secondary_vpc_id",
    "primary_public_subnet_ids","primary_private_subnet_ids",
    "secondary_public_subnet_ids","secondary_private_subnet_ids",
    "primary_internet_gateway_id","secondary_internet_gateway_id",
    "primary_nat_gateway_ids","secondary_nat_gateway_ids",
    "primary_ec2_security_group_id","secondary_ec2_security_group_id",
    "primary_alb_security_group_id","secondary_alb_security_group_id",
    "primary_rds_security_group_id","secondary_rds_security_group_id",
    "ec2_role_arn","ec2_role_name","lambda_role_arn","lambda_role_name",
    "ec2_instance_profile_arn","ec2_instance_profile_name",
    "s3_replication_role_arn","s3_replication_role_name",
    // S3, Launch templates
    "primary_s3_bucket_id","primary_s3_bucket_arn","primary_s3_bucket_domain_name",
    "secondary_s3_bucket_id","secondary_s3_bucket_arn","secondary_s3_bucket_domain_name",
    "primary_launch_template_id","primary_launch_template_latest_version",
    "secondary_launch_template_id","secondary_launch_template_latest_version",
    // ALB, Targets, Listeners
    "primary_alb_id","primary_alb_arn","primary_alb_dns_name","primary_alb_zone_id",
    "secondary_alb_id","secondary_alb_arn","secondary_alb_dns_name","secondary_alb_zone_id",
    "primary_target_group_id","primary_target_group_arn",
    "secondary_target_group_id","secondary_target_group_arn",
    "primary_alb_listener_id","primary_alb_listener_arn",
    "secondary_alb_listener_id","secondary_alb_listener_arn",
    // ASG, RDS, DB Subnets & instances
    "primary_asg_id","primary_asg_arn","primary_asg_name",
    "secondary_asg_id","secondary_asg_arn","secondary_asg_name",
    "primary_db_subnet_group_id","primary_db_subnet_group_name",
    "secondary_db_subnet_group_id","secondary_db_subnet_group_name",
    "primary_rds_instance_id","primary_rds_instance_arn","primary_rds_endpoint","primary_rds_port","primary_rds_database_name",
    "secondary_rds_instance_id","secondary_rds_instance_arn","secondary_rds_endpoint","secondary_rds_port","secondary_rds_database_name",
    // SNS, Lambda
    "sns_topic_id","sns_topic_arn","sns_topic_name",
    "sns_topic_secondary_id","sns_topic_secondary_arn","sns_topic_secondary_name",
    "primary_lambda_function_name","primary_lambda_function_arn","primary_lambda_invoke_arn",
    "secondary_lambda_function_name","secondary_lambda_function_arn","secondary_lambda_invoke_arn",
    // CloudWatch Alarms
    "primary_cpu_alarm_id","primary_cpu_alarm_arn",
    "secondary_cpu_alarm_id","secondary_cpu_alarm_arn",
    "primary_rds_cpu_alarm_id","primary_rds_cpu_alarm_arn",
    "secondary_rds_cpu_alarm_id","secondary_rds_cpu_alarm_arn",
    // Route53
    "route53_zone_id","route53_zone_name","route53_name_servers",
    "primary_health_check_id","secondary_health_check_id",
    "primary_route53_record_name","primary_route53_record_fqdn",
    "secondary_route53_record_name","secondary_route53_record_fqdn",
    // AMI, AZ, EIP, Route Tables
    "primary_ami_id","primary_ami_name","primary_ami_description",
    "secondary_ami_id","secondary_ami_name","secondary_ami_description",
    "primary_availability_zones","secondary_availability_zones",
    "primary_nat_eip_ids","primary_nat_eip_public_ips",
    "secondary_nat_eip_ids","secondary_nat_eip_public_ips",
    "primary_public_route_table_id","primary_private_route_table_ids",
    "secondary_public_route_table_id","secondary_private_route_table_ids"
  ];
  it("has all key outputs present", () => {
    expectedOutputs.forEach(output => {
      expect(has(new RegExp(`output\\s+"${output}"`))).toBe(true);
    });
    // Sensitive fields NOT exposed
    expect(has(/output\s+.*(password|secret|access_key|secret_key)/i)).toBe(false);
  });

  // ==== Tagging and Naming standards ====
  it("applies common tags to resources", () => {
    expect(has(/tags\s+=\s+merge\(local\.common_tags,/)).toBe(true);
  });

  // ==== DNS failover logic ====
  it("declares failover routing policy in Route53 records", () => {
    expect(has(/failover_routing_policy\s*{[\s\S]*type\s*=\s*"PRIMARY"/)).toBe(true);
    expect(has(/failover_routing_policy\s*{[\s\S]*type\s*=\s*"SECONDARY"/)).toBe(true);
  });
});
