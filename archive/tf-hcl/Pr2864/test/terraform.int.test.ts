import * as fs from "fs";
import * as path from "path";

// Load the actual flat outputs JSON from deployment result
const outputsRaw: { [key: string]: any } = JSON.parse(
  fs.readFileSync(path.resolve(__dirname, "../cfn-outputs/flat-outputs.json"), "utf8")
);

// Helper to parse stringified arrays if they exist
function asArray(val: any): string[] {
  if (Array.isArray(val)) return val;
  try {
    return JSON.parse(val);
  } catch {
    // If it's not a valid JSON array, return as single entry array
    return [val];
  }
}

function isNonEmptyString(value: any): boolean {
  return typeof value === "string" && value.trim().length > 0;
}

describe("Flat Outputs Integration Tests", () => {

  // Ensure all expected keys from flat output exist
  const expectedKeys = [
    "alb_security_group_id",
    "ami_creation_date",
    "ami_description",
    "ami_id",
    "ami_name",
    "ami_owner_id",
    "autoscaling_group_desired_capacity",
    "autoscaling_group_max_size",
    "autoscaling_group_min_size",
    "autoscaling_group_name",
    "availability_zones",
    "aws_account_id",
    "aws_caller_arn",
    "aws_caller_user_id",
    "backup_plan_arn",
    "backup_plan_id",
    "backup_plan_version",
    "backup_role_arn",
    "backup_role_name",
    "backup_vault_arn",
    "backup_vault_name",
    "backup_vault_recovery_points",
    "cloudtrail_arn",
    "cloudtrail_bucket_arn",
    "cloudtrail_bucket_name",
    "cloudtrail_home_region",
    "cloudtrail_name",
    "common_tags",
    "database_subnet_ids",
    "db_subnet_group_name",
    "domain_name",
    "ec2_backup_selection_id",
    "ec2_instance_profile_name",
    "ec2_role_name",
    "ec2_security_group_id",
    "elastic_ip_addresses",
    "environment",
    "flow_log_cloudwatch_log_group",
    "flow_log_role_arn",
    "high_cpu_alarm_name",
    "internet_gateway_id",
    "kms_key_alias",
    "kms_key_arn",
    "kms_key_id",
    "low_cpu_alarm_name",
    "maintenance_window_duration",
    "maintenance_window_id",
    "maintenance_window_name",
    "maintenance_window_schedule",
    "maintenance_window_target_id",
    "maintenance_window_task_id",
    "nat_gateway_ids",
    "private_route_table_ids",
    "private_subnet_ids",
    "project_name",
    "public_route_table_id",
    "public_subnet_ids",
    "rds_allocated_storage",
    "rds_backup_retention_period",
    "rds_backup_window",
    "rds_cpu_alarm_name",
    "rds_database_name",
    "rds_engine_version",
    "rds_instance_class",
    "rds_maintenance_window",
    "rds_monitoring_role_arn",
    "rds_multi_az",
    "rds_security_group_id",
    "region",
    "route53_main_record_name",
    "route53_name_servers",
    "route53_www_record_name",
    "route53_zone_arn",
    "route53_zone_id",
    "route53_zone_name",
    "s3_bucket_arn",
    "s3_bucket_domain_name",
    "s3_bucket_name",
    "s3_bucket_regional_domain_name",
    "secrets_manager_secret_arn",
    "secrets_manager_secret_name",
    "sns_topic_name",
    "ssm_document_arn",
    "ssm_document_description",
    "ssm_document_name",
    "target_group_name",
    "total_cloudwatch_alarms_created",
    "total_iam_roles_created",
    "total_s3_buckets_created",
    "total_security_groups_created",
    "total_subnets_created",
    "vpc_cidr",
    "vpc_id"
  ];

  it("should contain all expected output keys", () => {
    expectedKeys.forEach(key => {
      expect(outputsRaw).toHaveProperty(key);
    });
  });

  it("should have non-empty strings for all expected outputs", () => {
    expectedKeys.forEach(key => {
      expect(isNonEmptyString(outputsRaw[key])).toBe(true);
    });
  });

  it("availability_zones should be an array of valid AZ names", () => {
    const azs = asArray(outputsRaw.availability_zones);
    expect(Array.isArray(azs)).toBe(true);
    azs.forEach(az => expect(/^us-east-2[a-c]$/.test(az)).toBe(true));
  });

  it("database_subnet_ids and elastic_ip_addresses should have 2 entries each", () => {
    expect(asArray(outputsRaw.database_subnet_ids).length).toBe(2);
    expect(asArray(outputsRaw.elastic_ip_addresses).length).toBe(2);
  });

  it("nat_gateway_ids, private_subnet_ids, public_subnet_ids should have 2 entries each", () => {
    expect(asArray(outputsRaw.nat_gateway_ids).length).toBe(2);
    expect(asArray(outputsRaw.private_subnet_ids).length).toBe(2);
    expect(asArray(outputsRaw.public_subnet_ids).length).toBe(2);
  });

  it("route53_name_servers should have at least 4 entries and correct format", () => {
    const ns = asArray(outputsRaw.route53_name_servers);
    expect(ns.length).toBeGreaterThanOrEqual(4);
    ns.forEach(server => expect(/^ns-\d+\.awsdns-\d+\.(org|co\.uk|com|net)$/.test(server)).toBe(true));
  });

  it("Validate AMI ID, name and creation date formats", () => {
    expect(/^ami-[a-z0-9]+$/.test(outputsRaw.ami_id)).toBe(true);
    expect(outputsRaw.ami_name.startsWith("amzn2-ami-hvm")).toBe(true);
    expect(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.000Z$/.test(outputsRaw.ami_creation_date)).toBe(true);
  });

  it("Validate VPC CIDR block and domain name", () => {
    expect(outputsRaw.vpc_cidr).toBe("10.0.0.0/16");
    expect(outputsRaw.domain_name).toBe("NewTestlive.com");
  });

  it("Validate cloudtrail_bucket_arn and s3_bucket_arn formats", () => {
    expect(outputsRaw.cloudtrail_bucket_arn).toMatch(/^arn:aws:s3:::[\w\-.]+$/);
    expect(outputsRaw.s3_bucket_arn).toMatch(/^arn:aws:s3:::[\w\-.]+$/);
  });

  it("Validate load balancer DNS name and ARN formats", () => {
    if (outputsRaw.load_balancer_dns_name) {
      expect(outputsRaw.load_balancer_dns_name).toMatch(/^tap-stack-alb-[a-z0-9\-]+\.us-east-2\.elb\.amazonaws\.com$/);
    }
    if (outputsRaw.load_balancer_arn) {
      expect(outputsRaw.load_balancer_arn).toMatch(/^arn:aws:elasticloadbalancing:us-east-2:[^:]+:loadbalancer\/app\/tap-stack-alb\/.+$/);
    }
  });

  it("Validate CloudWatch log group name", () => {
    expect(outputsRaw.flow_log_cloudwatch_log_group).toBe("/aws/vpc/flowlogs");
  });

  it("Maintenance window properties are correct", () => {
    expect(outputsRaw.maintenance_window_name.startsWith("tap-stack-maintenance-window")).toBe(true);
    expect(outputsRaw.maintenance_window_duration).toBe("2");
    expect(outputsRaw.maintenance_window_schedule).toBe("cron(0 2 ? * SUN *)");
  });

  it("RDS Multi-AZ should be 'true'", () => {
    expect(outputsRaw.rds_multi_az).toBe("true");
  });

  it("Total resource counts match expected numbers", () => {
    expect(outputsRaw.total_s3_buckets_created).toBe("2");
    expect(outputsRaw.total_security_groups_created).toBe("3");
    expect(outputsRaw.total_iam_roles_created).toBe("4");
    expect(outputsRaw.total_cloudwatch_alarms_created).toBe("3");
    expect(outputsRaw.total_subnets_created).toBe("6");
  });

  it("All major resource IDs are unique", () => {
    const ids = [
      outputsRaw.vpc_id,
      outputsRaw.internet_gateway_id,
      ...(asArray(outputsRaw.nat_gateway_ids)),
      ...(asArray(outputsRaw.public_subnet_ids)),
      ...(asArray(outputsRaw.private_subnet_ids)),
      ...(asArray(outputsRaw.database_subnet_ids))
    ];
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("RDS monitoring role ARN and backup role ARN are valid", () => {
    expect(outputsRaw.rds_monitoring_role_arn).toMatch(/^arn:aws:iam::[^:]+:role\/.+$/);
    expect(outputsRaw.backup_role_arn).toMatch(/^arn:aws:iam::[^:]+:role\/.+$/);
  });

  it("Target group name and alarms match expected naming", () => {
    expect(outputsRaw.target_group_name).toBe("tap-stack-tg");
    expect(outputsRaw.high_cpu_alarm_name).toBe("tap-stack-high-cpu");
    expect(outputsRaw.low_cpu_alarm_name).toBe("tap-stack-low-cpu");
    expect(outputsRaw.rds_cpu_alarm_name).toBe("tap-stack-rds-high-cpu");
  });
});
