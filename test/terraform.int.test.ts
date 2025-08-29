import * as fs from "fs";
import * as path from "path";

const outputPath = path.resolve(process.cwd(), "cfn-outputs/flat-outputs.json");

const isNonEmptyString = (val: any): boolean =>
  typeof val === "string" && val.trim().length > 0;

const isValidArn = (val: any): boolean => {
  if (typeof val !== "string" || val.trim().length === 0) return false;
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

const parseMaybeJsonArray = (val: any): any[] | null => {
  if (!val) return null;
  if (Array.isArray(val)) return val;
  if (typeof val === "string") {
    try {
      const parsed = JSON.parse(val);
      if (Array.isArray(parsed)) return parsed;
    } catch {
      return null;
    }
  }
  return null;
};

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
      "s3_bucket_arn",
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

  [
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
    "s3_bucket_arn",
    "secondary_alb_arn",
    "secondary_asg_arn",
    "secondary_db_subnet_group_arn",
    "secondary_ec2_security_group_id",
    "secondary_launch_template_arn",
    "secondary_rds_security_group_id",
    "secondary_scale_down_policy_arn",
    "secondary_scale_up_policy_arn",
    "secondary_sns_topic_arn",
    "secondary_target_group_arn"
  ].forEach(key => {
    it(`${key} should be a valid AWS ARN`, () => {
      expect(isValidArn(outputs[key])).toBe(true);
    });
  });

  [
    ["primary_vpc_id", isValidVpcId],
    ["secondary_vpc_id", isValidVpcId],
    ["primary_alb_security_group_id", isValidSecurityGroupId],
    ["primary_ec2_security_group_id", isValidSecurityGroupId],
    ["primary_rds_security_group_id", isValidSecurityGroupId],
    ["secondary_alb_security_group_id", isValidSecurityGroupId],
    ["secondary_ec2_security_group_id", isValidSecurityGroupId],
    ["secondary_rds_security_group_id", isValidSecurityGroupId],
    ["primary_internet_gateway_id", isValidInternetGatewayId],
    ["secondary_internet_gateway_id", isValidInternetGatewayId]
  ].forEach(([key, validator]) => {
    it(`${key} should be a valid AWS ID`, () => {
      expect(validator(outputs[key])).toBe(true);
    });
  });

  it("primary_nat_gateway_ids should be array of valid NAT Gateway IDs", () => {
    const arr = parseMaybeJsonArray(outputs.primary_nat_gateway_ids);
    expect(arr).not.toBeNull();
    arr!.forEach(id => {
      expect(isValidNatGatewayId(id)).toBe(true);
    });
  });

  it("secondary_nat_gateway_ids should be array of valid NAT Gateway IDs", () => {
    const arr = parseMaybeJsonArray(outputs.secondary_nat_gateway_ids);
    expect(arr).not.toBeNull();
    arr!.forEach(id => {
      expect(isValidNatGatewayId(id)).toBe(true);
    });
  });

  ["primary_private_subnet_ids", "primary_public_subnet_ids", "secondary_private_subnet_ids", "secondary_public_subnet_ids"].forEach(key => {
    it(`${key} should be an array of valid Subnet IDs`, () => {
      const arr = parseMaybeJsonArray(outputs[key]);
      expect(arr).not.toBeNull();
      arr!.forEach(id => expect(isValidSubnetId(id)).toBe(true));
    });
  });

  ["primary_private_route_table_ids", "secondary_private_route_table_ids"].forEach(key => {
    it(`${key} should be an array of route table IDs`, () => {
      const arr = parseMaybeJsonArray(outputs[key]);
      expect(arr).not.toBeNull();
      arr!.forEach(id => {
        expect(typeof id).toBe("string");
        expect(id.startsWith("rtb-")).toBe(true);
      });
    });
  });

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
    it(`${key} should be a valid CIDR block string`, () => {
      expect(typeof outputs[key]).toBe("string");
      expect(outputs[key]).toMatch(/^\d{1,3}(\.\d{1,3}){3}\/\d{1,2}$/);
    });
  });

  ["primary_availability_zones", "secondary_availability_zones"].forEach(key => {
    it(`${key} should be an array of availability zones strings`, () => {
      const azs = parseMaybeJsonArray(outputs[key]);
      expect(azs).not.toBeNull();
      azs!.forEach((az: any) => expect(typeof az === "string" && az.length > 0).toBe(true));
    });
  });

  ["cloudwatch_log_group_arn", "cloudwatch_log_group_name"].forEach(key => {
    it(`${key} should be a non-empty string`, () => {
      expect(isNonEmptyString(outputs[key])).toBe(true);
    });
  });

  it("rds_backup_retention_period should be a string representing a positive integer", () => {
    expect(/^\d+$/.test(String(outputs.rds_backup_retention_period))).toBe(true);
    expect(Number(outputs.rds_backup_retention_period)).toBeGreaterThan(0);
  });

  it("ec2_instance_type and rds_instance_class should be non-empty strings", () => {
    expect(isNonEmptyString(outputs.ec2_instance_type)).toBe(true);
    expect(isNonEmptyString(outputs.rds_instance_class)).toBe(true);
  });

  it("rds_engine should be mysql and rds_engine_version should be 8.0", () => {
    expect(outputs.rds_engine).toBe("mysql");
    expect(outputs.rds_engine_version).toBe("8.0");
  });

  it("rds_storage_encrypted should be true (string or boolean)", () => {
    const val = outputs.rds_storage_encrypted;
    expect(val === "true" || val === true).toBe(true);
  });

  it("rds_username should start with 'a' and end with db_username_suffix", () => {
    expect(typeof outputs.rds_username).toBe("string");
    expect(outputs.rds_username.startsWith("a")).toBe(true);
    expect(outputs.rds_username.endsWith(outputs.db_username_suffix)).toBe(true);
  });

  ["s3_bucket_name", "s3_bucket_arn", "s3_bucket_domain_name", "s3_bucket_regional_domain_name"].forEach(key => {
    it(`${key} should be non-empty string`, () => {
      expect(isNonEmptyString(outputs[key])).toBe(true);
    });
  });

  it("route53_name_servers should be array of valid name servers", () => {
    const servers = parseMaybeJsonArray(outputs.route53_name_servers);
    expect(servers).not.toBeNull();
    servers!.forEach((server: any) => {
      expect(typeof server).toBe("string");
      expect(server.includes("awsdns")).toBe(true);
    });
  });
});
