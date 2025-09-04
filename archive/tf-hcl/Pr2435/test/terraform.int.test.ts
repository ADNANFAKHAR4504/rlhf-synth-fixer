import * as fs from "fs";
import * as path from "path";

const outputPath = path.resolve(process.cwd(), "cfn-outputs/flat-outputs.json");

// Validator helper functions
const isNonEmptyString = (val: any): boolean =>
  typeof val === "string" && val.trim().length > 0;

const isValidArn = (val: any): boolean => {
  if (typeof val !== "string" || val.trim().length === 0) return false;
  // Simplified ARN pattern (IAM and generic)
  const iamRoleArnPattern = /^arn:aws:iam::\d{12}:role\/[\w+=,.@\-_/]+$/;
  const genericArnPattern = /^arn:aws:[^:]+:[^:]*:\d{12}:[^ ]+$/;
  return iamRoleArnPattern.test(val) || genericArnPattern.test(val);
};

const isValidVpcId = (val: any): boolean =>
  isNonEmptyString(val) && val.startsWith("vpc-");

const isValidSubnetId = (val: any): boolean =>
  isNonEmptyString(val) && val.startsWith("subnet-");

const isValidSecurityGroupId = (val: any): boolean =>
  isNonEmptyString(val) && val.startsWith("sg-");

const isValidInternetGatewayId = (val: any): boolean =>
  isNonEmptyString(val) && val.startsWith("igw-");

const isValidNatGatewayId = (val: any): boolean =>
  isNonEmptyString(val) && val.startsWith("nat-");

const isValidRouteTableId = (val: any): boolean =>
  isNonEmptyString(val) && val.startsWith("rtb-");

// To validate array of items with given validator
const isValidArrayOfType = (val: any, validator: (v: any) => boolean): boolean =>
  Array.isArray(val) && val.every(validator);

describe("tap_stack.tf Integration Tests", () => {
  let outputsRaw: Record<string, any>;
  let outputs: Record<string, any>;

  beforeAll(() => {
    outputsRaw = JSON.parse(fs.readFileSync(outputPath, "utf-8"));
    outputs = {};
    for (const [key, val] of Object.entries(outputsRaw)) {
      try {
        if (typeof val === "string" && (val.startsWith("[") || val.startsWith("{"))) {
          outputs[key] = JSON.parse(val);
        } else {
          outputs[key] = val;
        }
      } catch {
        outputs[key] = val;
      }
    }
  });

  it("should have all expected output keys", () => {
    const expectedKeys = [
      "application_url",
      "cloudwatch_access_policy_arn",
      "cloudwatch_log_group_arn",
      "cloudwatch_log_group_name",
      "common_tags",
      "db_username_suffix",
      "domain_name",
      "ec2_iam_role_arn",
      "ec2_iam_role_name",
      "ec2_instance_profile_arn",
      "ec2_instance_profile_name",
      "ec2_instance_type",
      "environment",
      "primary_alb_arn",
      "primary_alb_dns_name",
      "primary_alb_health_alarm_name",
      "primary_alb_listener_arn",
      "primary_alb_security_group_id",
      "primary_alb_zone_id",
      "primary_ami_id",
      "primary_ami_name",
      "primary_application_url",
      "primary_asg_arn",
      "primary_asg_desired_capacity",
      "primary_asg_max_size",
      "primary_asg_min_size",
      "primary_asg_name",
      "primary_availability_zones",
      "primary_cpu_high_alarm_name",
      "primary_cpu_low_alarm_name",
      "primary_db_subnet_group_arn",
      "primary_db_subnet_group_name",
      "primary_ec2_security_group_id",
      "primary_health_check_id",
      "primary_internet_gateway_id",
      "primary_launch_template_arn",
      "primary_launch_template_id",
      "primary_nat_eip_ids",
      "primary_nat_gateway_ids",
      "primary_nat_gateway_public_ips",
      "primary_private_route_table_ids",
      "primary_private_subnet_1_cidr",
      "primary_private_subnet_2_cidr",
      "primary_private_subnet_ids",
      "primary_public_route_table_id",
      "primary_public_subnet_1_cidr",
      "primary_public_subnet_2_cidr",
      "primary_public_subnet_ids",
      "primary_rds_arn",
      "primary_rds_cpu_alarm_name",
      "primary_rds_endpoint",
      "primary_rds_identifier",
      "primary_rds_security_group_id",
      "primary_region",
      "primary_resource_prefix",
      "primary_scale_down_policy_arn",
      "primary_scale_up_policy_arn",
      "primary_sns_topic_arn",
      "primary_sns_topic_name",
      "primary_target_group_arn",
      "primary_vpc_cidr",
      "primary_vpc_id",
      "project_name",
      "rds_allocated_storage",
      "rds_backup_retention_period",
      "rds_database_name",
      "rds_engine",
      "rds_engine_version",
      "rds_instance_class",
      "rds_max_allocated_storage",
      "rds_storage_encrypted",
      "rds_storage_type",
      "rds_username",
      "route53_name_servers",
      "route53_zone_id",
      "route53_zone_name",
      "s3_access_policy_arn",
      "s3_bucket_domain_name",
      "s3_bucket_name",
      "s3_bucket_regional_domain_name",
      "s3_bucket_suffix",
      "s3_lifecycle_policy",
      "secondary_alb_arn",
      "secondary_alb_dns_name",
      "secondary_alb_health_alarm_name",
      "secondary_alb_listener_arn",
      "secondary_alb_security_group_id",
      "secondary_alb_zone_id",
      "secondary_ami_id",
      "secondary_ami_name",
      "secondary_application_url",
      "secondary_asg_arn",
      "secondary_asg_desired_capacity",
      "secondary_asg_max_size",
      "secondary_asg_min_size",
      "secondary_asg_name",
      "secondary_availability_zones",
      "secondary_cpu_high_alarm_name",
      "secondary_cpu_low_alarm_name",
      "secondary_db_subnet_group_arn",
      "secondary_db_subnet_group_name",
      "secondary_ec2_security_group_id",
      "secondary_health_check_id",
      "secondary_internet_gateway_id",
      "secondary_launch_template_arn",
      "secondary_launch_template_id",
      "secondary_nat_eip_ids",
      "secondary_nat_gateway_ids",
      "secondary_nat_gateway_public_ips",
      "secondary_private_route_table_ids",
      "secondary_private_subnet_1_cidr",
      "secondary_private_subnet_2_cidr",
      "secondary_private_subnet_ids",
      "secondary_public_route_table_id",
      "secondary_public_subnet_1_cidr",
      "secondary_public_subnet_2_cidr",
      "secondary_public_subnet_ids",
      "secondary_rds_security_group_id",
      "secondary_region",
      "secondary_resource_prefix",
      "secondary_scale_down_policy_arn",
      "secondary_scale_up_policy_arn",
      "secondary_sns_topic_arn",
      "secondary_sns_topic_name",
      "secondary_target_group_arn",
      "secondary_vpc_cidr",
      "secondary_vpc_id"
    ];
    expectedKeys.forEach(key => {
      expect(outputs).toHaveProperty(key);
    });
  });

  it("application URLs and domain names should be non-empty strings starting with http", () => {
    ["application_url", "primary_application_url", "secondary_application_url", "domain_name"].forEach(key => {
      expect(isNonEmptyString(outputs[key])).toBe(true);
      if (key.includes("url") || key === "application_url") {
        expect(outputs[key]).toMatch(/^http:\/\//);
      }
    });
  });

  // ARN keys validation
  const arnKeys = [
    "cloudwatch_access_policy_arn",
    "cloudwatch_log_group_arn",
    "ec2_iam_role_arn",
    "ec2_instance_profile_arn",
    "primary_alb_arn",
    "primary_asg_arn",
    "primary_db_subnet_group_arn",
    "primary_launch_template_arn",
    "primary_rds_arn",
    "primary_scale_down_policy_arn",
    "primary_scale_up_policy_arn",
    "primary_sns_topic_arn",
    "primary_target_group_arn",
    "s3_access_policy_arn",
    "secondary_alb_arn",
    "secondary_asg_arn",
    "secondary_db_subnet_group_arn",
    "secondary_launch_template_arn",
    "secondary_scale_down_policy_arn",
    "secondary_scale_up_policy_arn",
    "secondary_sns_topic_arn",
    "secondary_target_group_arn"
  ];

  arnKeys.forEach(key => {
    it(`${key} should be a valid ARN`, () => {
      const val = outputs[key];
      if (val === undefined) return;
      expect(isValidArn(val)).toBe(true);
    });
  });

  // Validate IDs that start with certain prefixes
  const idValidators: [string, (val: any) => boolean][] = [
    ["primary_vpc_id", isValidVpcId],
    ["secondary_vpc_id", isValidVpcId],
    ["primary_alb_security_group_id", isValidSecurityGroupId],
    ["primary_ec2_security_group_id", isValidSecurityGroupId],
    ["primary_rds_security_group_id", isValidSecurityGroupId],
    ["secondary_alb_security_group_id", isValidSecurityGroupId],
    ["secondary_ec2_security_group_id", isValidSecurityGroupId],
    ["secondary_rds_security_group_id", isValidSecurityGroupId],
    ["primary_internet_gateway_id", isValidInternetGatewayId],
    ["secondary_internet_gateway_id", isValidInternetGatewayId],
    ["primary_nat_gateway_ids", (val) => isValidArrayOfType(val, isValidNatGatewayId)],
    ["secondary_nat_gateway_ids", (val) => isValidArrayOfType(val, isValidNatGatewayId)],
    ["primary_nat_eip_ids", (val) => isValidArrayOfType(val, isNonEmptyString)],
    ["secondary_nat_eip_ids", (val) => isValidArrayOfType(val, isNonEmptyString)],
    ["primary_public_subnet_ids", (val) => isValidArrayOfType(val, isValidSubnetId)],
    ["primary_private_subnet_ids", (val) => isValidArrayOfType(val, isValidSubnetId)],
    ["secondary_public_subnet_ids", (val) => isValidArrayOfType(val, isValidSubnetId)],
    ["secondary_private_subnet_ids", (val) => isValidArrayOfType(val, isValidSubnetId)],
    ["primary_private_route_table_ids", (val) => isValidArrayOfType(val, isValidRouteTableId)],
    ["secondary_private_route_table_ids", (val) => isValidArrayOfType(val, isValidRouteTableId)]
  ];

  idValidators.forEach(([key, validator]) => {
    it(`${key} should be valid and properly formatted`, () => {
      expect(outputs).toHaveProperty(key);
      expect(validator(outputs[key])).toBe(true);
    });
  });

  // CIDR block validations
  [
    "primary_public_subnet_1_cidr",
    "primary_public_subnet_2_cidr",
    "primary_private_subnet_1_cidr",
    "primary_private_subnet_2_cidr",
    "secondary_public_subnet_1_cidr",
    "secondary_public_subnet_2_cidr",
    "secondary_private_subnet_1_cidr",
    "secondary_private_subnet_2_cidr"
  ].forEach(key => {
    it(`${key} should be a valid CIDR`, () => {
      expect(typeof outputs[key]).toBe("string");
      expect(outputs[key]).toMatch(/^\d{1,3}(\.\d{1,3}){3}\/\d{1,2}$/);
    });
  });

  // Availability zones are arrays of strings
  ["primary_availability_zones", "secondary_availability_zones"].forEach(key => {
    it(`${key} should be an array of non-empty strings`, () => {
      const azList = outputs[key];
      expect(Array.isArray(azList)).toBe(true);
      azList.forEach((az: any) => expect(isNonEmptyString(az)).toBe(true));
    });
  });

  // Validate some mandatory string outputs
  [
    "cloudwatch_log_group_arn",
    "cloudwatch_log_group_name",
    "rds_username",
    "domain_name",
    "rds_database_name",
    "s3_bucket_name",
    "s3_bucket_domain_name",
    "s3_bucket_regional_domain_name"
  ].forEach(key => {
    it(`${key} should be a non-empty string`, () => {
      expect(isNonEmptyString(outputs[key])).toBe(true);
    });
  });

  it("rds_backup_retention_period should be a positive integer", () => {
    const val = outputs.rds_backup_retention_period;
    const numVal = typeof val === "string" ? parseInt(val, 10) : val;
    expect(Number.isInteger(numVal)).toBe(true);
    expect(numVal).toBeGreaterThan(0);
  });

  it("rds_storage_encrypted should be boolean true or string 'true'", () => {
    const val = outputs.rds_storage_encrypted;
    expect(val === true || val === "true").toBe(true);
  });

  it("rds_engine and version should match expected", () => {
    expect(outputs.rds_engine).toBe("mysql");
    expect(outputs.rds_engine_version).toBe("8.0");
  });

  it("rds_username should start with 'a' and end with db_username_suffix", () => {
    expect(typeof outputs.rds_username).toBe("string");
    expect(outputs.rds_username.startsWith("a")).toBe(true);
    expect(outputs.rds_username.endsWith(outputs.db_username_suffix)).toBe(true);
  });
});
