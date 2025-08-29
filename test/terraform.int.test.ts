import * as fs from "fs";
import * as path from "path";

const outputPath = path.resolve(process.cwd(), "cfn-outputs/flat-outputs.json");

// Validator helpers
const isNonEmptyString = (val: any): boolean =>
  typeof val === "string" && val.trim().length > 0;

const isValidArn = (val: any): boolean => {
  if (typeof val !== "string" || val.trim().length === 0) return false;
  // Basic ARN pattern (simplified)
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

// Validate an array of elements using a validator function
const isValidArrayOfType = (val: any, validator: (v: any) => boolean): boolean =>
  Array.isArray(val) && val.every(validator);

// Parse JSON strings in outputs if any
const parseJsonIfNeeded = (val: any): any => {
  if (typeof val === "string") {
    try {
      return JSON.parse(val);
    } catch {
      return val;
    }
  }
  return val;
};

describe("tap_stack.tf Integration Tests (flat outputs)", () => {
  let outputsRaw: Record<string, any> = {};
  let outputs: Record<string, any> = {};

  beforeAll(() => {
    outputsRaw = JSON.parse(fs.readFileSync(outputPath, "utf-8"));
    outputs = {};
    for (const [key, val] of Object.entries(outputsRaw)) {
      outputs[key] = parseJsonIfNeeded(val);
    }
  });

  const expectedKeys = [
    "cloudfront_distribution_arn",
    "cloudfront_distribution_domain_name",
    "cloudfront_distribution_hosted_zone_id",
    "cloudfront_distribution_id",
    "common_tags",
    "ec2_iam_role_arn",
    "ec2_instance_profile_name",
    "environment",
    "primary_alb_arn",
    "primary_alb_dns_name",
    "primary_alb_zone_id",
    "primary_ami_id",
    "primary_ami_name",
    "primary_asg_arn",
    "primary_asg_name",
    "primary_availability_zones",
    "primary_cpu_high_alarm_name",
    "primary_ec2_security_group_id",
    "primary_elb_security_group_id",
    "primary_internet_gateway_id",
    "primary_launch_template_id",
    "primary_launch_template_latest_version",
    "primary_log_group_name",
    "primary_nat_gateway_id",
    "primary_private_route_table_id",
    "primary_private_subnet_id",
    "primary_public_route_table_id",
    "primary_public_subnet_id",
    "primary_rds_endpoint",
    "primary_rds_instance_id",
    "primary_rds_port",
    "primary_rds_security_group_id",
    "primary_region",
    "primary_scale_down_policy_arn",
    "primary_scale_up_policy_arn",
    "primary_target_group_arn",
    "primary_vpc_cidr",
    "primary_vpc_id",
    "rds_database_name",
    "rds_monitoring_role_arn",
    "rds_username",
    "s3_bucket_arn",
    "s3_bucket_domain_name",
    "s3_bucket_name",
    "s3_bucket_regional_domain_name",
    "secondary_alb_arn",
    "secondary_alb_dns_name",
    "secondary_alb_zone_id",
    "secondary_ami_id",
    "secondary_ami_name",
    "secondary_asg_arn",
    "secondary_asg_name",
    "secondary_availability_zones",
    "secondary_cpu_high_alarm_name",
    "secondary_ec2_security_group_id",
    "secondary_elb_security_group_id",
    "secondary_internet_gateway_id",
    "secondary_launch_template_id",
    "secondary_launch_template_latest_version",
    "secondary_log_group_name",
    "secondary_nat_gateway_id",
    "secondary_private_route_table_id",
    "secondary_private_subnet_id",
    "secondary_public_route_table_id",
    "secondary_public_subnet_id",
    "secondary_rds_security_group_id",
    "secondary_region",
    "secondary_scale_down_policy_arn",
    "secondary_scale_up_policy_arn",
    "secondary_target_group_arn",
    "secondary_vpc_cidr",
    "secondary_vpc_id"
  ];

  it("should have all expected outputs present", () => {
    expectedKeys.forEach(key => {
      expect(outputs).toHaveProperty(key);
    });
  });

  it("should have valid ARNs for *_arn keys", () => {
    expectedKeys.filter(k => k.endsWith("_arn")).forEach(key => {
      expect(isValidArn(outputs[key])).toBe(true);
    });
  });

  it("should have valid VPC IDs", () => {
    ["primary_vpc_id", "secondary_vpc_id"].forEach(key => {
      expect(isValidVpcId(outputs[key])).toBe(true);
    });
  });

  it("should have valid subnet IDs", () => {
    ["primary_public_subnet_id", "primary_private_subnet_id", "secondary_public_subnet_id", "secondary_private_subnet_id"].forEach(key => {
      expect(isValidSubnetId(outputs[key])).toBe(true);
    });
  });

  it("should have valid security group IDs", () => {
    [
      "primary_ec2_security_group_id",
      "primary_elb_security_group_id",
      "primary_rds_security_group_id",
      "secondary_ec2_security_group_id",
      "secondary_elb_security_group_id",
      "secondary_rds_security_group_id"
    ].forEach(key => {
      expect(isValidSecurityGroupId(outputs[key])).toBe(true);
    });
  });

  it("should have valid internet gateway IDs", () => {
    ["primary_internet_gateway_id", "secondary_internet_gateway_id"].forEach(key => {
      expect(isValidInternetGatewayId(outputs[key])).toBe(true);
    });
  });

  it("should have valid NAT gateway IDs", () => {
    ["primary_nat_gateway_id", "secondary_nat_gateway_id"].forEach(key => {
      expect(isValidNatGatewayId(outputs[key])).toBe(true);
    });
  });

  it("should have valid route table IDs", () => {
    ["primary_public_route_table_id", "primary_private_route_table_id", "secondary_public_route_table_id", "secondary_private_route_table_id"].forEach(key => {
      expect(isValidRouteTableId(outputs[key])).toBe(true);
    });
  });

  it("should have non-empty strings for key string values", () => {
    const stringKeys = [
      "cloudfront_distribution_domain_name",
      "cloudfront_distribution_hosted_zone_id",
      "cloudfront_distribution_id",
      "common_tags",
      "ec2_instance_profile_name",
      "environment",
      "primary_alb_dns_name",
      "primary_alb_zone_id",
      "primary_ami_id",
      "primary_ami_name",
      "primary_asg_name",
      "primary_cpu_high_alarm_name",
      "primary_log_group_name",
      "primary_rds_endpoint",
      "primary_rds_instance_id",
      "primary_rds_port",
      "primary_region",
      "primary_target_group_arn",
      "primary_vpc_cidr",
      "rds_database_name",
      "rds_monitoring_role_arn",
      "rds_username",
      "s3_bucket_domain_name",
      "s3_bucket_name",
      "s3_bucket_regional_domain_name",
      "secondary_alb_dns_name",
      "secondary_alb_zone_id",
      "secondary_ami_id",
      "secondary_ami_name",
      "secondary_asg_name",
      "secondary_availability_zones",
      "secondary_cpu_high_alarm_name",
      "secondary_log_group_name",
      "secondary_rds_security_group_id",
      "secondary_region",
      "secondary_target_group_arn",
      "secondary_vpc_cidr"
    ];
    stringKeys.forEach(key => {
      expect(typeof outputs[key]).toBe("string");
      expect(outputs[key].trim().length).toBeGreaterThan(0);
    });
  });

  it("should have primary_availability_zones and secondary_availability_zones as non-empty string arrays", () => {
    ["primary_availability_zones", "secondary_availability_zones"].forEach(key => {
      expect(Array.isArray(outputs[key])).toBe(true);
      expect(outputs[key].length).toBeGreaterThan(0);
      outputs[key].forEach((zone: any) => {
        expect(typeof zone).toBe("string");
        expect(zone.trim().length).toBeGreaterThan(0);
      });
    });
  });

  it("launch template latest versions should be parseable as positive integers", () => {
    ["primary_launch_template_latest_version", "secondary_launch_template_latest_version"].forEach(key => {
      const val = outputs[key];
      const parsed = Number(val);
      expect(!isNaN(parsed) && parsed > 0 && Number.isInteger(parsed)).toBe(true);
    });
  });

  it("should have scale up/down policy ARNs valid", () => {
    [
      "primary_scale_up_policy_arn",
      "primary_scale_down_policy_arn",
      "secondary_scale_up_policy_arn",
      "secondary_scale_down_policy_arn"
    ].forEach(key => {
      expect(isValidArn(outputs[key])).toBe(true);
    });
  });

});
