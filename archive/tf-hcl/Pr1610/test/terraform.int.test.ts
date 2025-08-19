import * as fs from "fs";
import * as path from "path";

const outputPath = path.resolve(process.cwd(), "cfn-outputs/flat-outputs.json");

const isNonEmptyString = (val: any): boolean =>
  typeof val === "string" && val.trim().length > 0;

const isValidArn = (val: any): boolean =>
  typeof val === "string" && /^arn:aws:[^:]+:[^:]*:\d{12}:[^ ]+$/.test(val);

const isValidVpcId = (val: any): boolean =>
  isNonEmptyString(val) && val.startsWith("vpc-");

const isValidSubnetId = (val: any): boolean =>
  isNonEmptyString(val) && val.startsWith("subnet-");

const isValidSecurityGroupId = (val: any): boolean =>
  isNonEmptyString(val) && val.startsWith("sg-");

const isValidNatGatewayId = (val: any): boolean =>
  isNonEmptyString(val) && val.startsWith("nat-");

const isValidInternetGatewayId = (val: any): boolean =>
  isNonEmptyString(val) && val.startsWith("igw-");

const isValidPort = (val: any): boolean =>
  !isNaN(Number(val)) && Number(val) > 0 && Number(val) < 65536;

const isArrayString = (val: any): boolean => {
  if (typeof val === "string") {
    try {
      const arr = JSON.parse(val);
      return Array.isArray(arr) && arr.every((e) => typeof e === "string" && e.length > 0);
    } catch {
      return false;
    }
  }
  return false;
};

describe("Complete Terraform Stack Integration Tests", () => {
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

  // Check all expected keys
  it("should have all expected keys in outputs", () => {
    const expectedKeys = [
      "all_primary_subnets",
      "all_secondary_subnets",
      "cloudwatch_logs_policy_arn",
      "mfa_policy_arn",
      "primary_db_parameter_group_name",
      "primary_db_subnet_group_name",
      "primary_internet_gateway_id",
      "primary_nat_gateway_ids",
      "primary_private_subnet_cidrs",
      "primary_private_subnet_ids",
      "primary_public_subnet_cidrs",
      "primary_public_subnet_ids",
      "primary_rds_endpoint",
      "primary_rds_kms_key_arn",
      "primary_rds_log_group_names",
      "primary_rds_monitoring_role_arn",
      "primary_rds_port",
      "primary_rds_security_group_id",
      "primary_vpc_id",
      "secondary_db_parameter_group_name",
      "secondary_db_subnet_group_name",
      "secondary_internet_gateway_id",
      "secondary_nat_gateway_ids",
      "secondary_private_subnet_cidrs",
      "secondary_private_subnet_ids",
      "secondary_public_subnet_cidrs",
      "secondary_public_subnet_ids",
      "secondary_rds_endpoint",
      "secondary_rds_kms_key_arn",
      "secondary_rds_log_group_names",
      "secondary_rds_monitoring_role_arn",
      "secondary_rds_port",
      "secondary_rds_security_group_id",
      "secondary_vpc_id",
      "security_sns_topic",
      "tap_project_environment",
      "tap_users_group",
      "tap_users_group_arn"
    ];
    expectedKeys.forEach(key => {
      expect(Object.keys(outputs)).toContain(key);
    });
  });

  // Validate common ARN formats
  [
    "cloudwatch_logs_policy_arn",
    "mfa_policy_arn",
    "primary_rds_kms_key_arn",
    "primary_rds_monitoring_role_arn",
    "secondary_rds_kms_key_arn",
    "secondary_rds_monitoring_role_arn",
    "security_sns_topic",
    "tap_users_group_arn",
  ].forEach(key => {
    it(`${key} should be a valid AWS ARN`, () => {
      expect(isValidArn(outputs[key])).toBe(true);
    });
  });

  // Validate VPC IDs
  ["primary_vpc_id", "secondary_vpc_id"].forEach(key => {
    it(`${key} should be a valid VPC ID`, () => {
      expect(isValidVpcId(outputs[key])).toBe(true);
    });
  });

  // Validate Internet Gateway IDs
  ["primary_internet_gateway_id", "secondary_internet_gateway_id"].forEach(key => {
    it(`${key} should be a valid IGW ID`, () => {
      expect(isValidInternetGatewayId(outputs[key])).toBe(true);
    });
  });

  // Validate NAT Gateway IDs arrays
  ["primary_nat_gateway_ids", "secondary_nat_gateway_ids"].forEach(key => {
    it(`${key} should be an array of NAT Gateway IDs`, () => {
      expect(Array.isArray(outputs[key])).toBe(true);
      outputs[key].forEach((id: string) => expect(isValidNatGatewayId(id)).toBe(true));
    });
  });

  // Validate Subnet IDs and subnet CIDRs arrays
  [
    "all_primary_subnets",
    "all_secondary_subnets",
    "primary_private_subnet_ids",
    "primary_public_subnet_ids",
    "secondary_private_subnet_ids",
    "secondary_public_subnet_ids",
  ].forEach(key => {
    it(`${key} should be an array of subnet IDs`, () => {
      expect(Array.isArray(outputs[key])).toBe(true);
      outputs[key].forEach((id: string) => expect(isValidSubnetId(id)).toBe(true));
    });
  });

  [
    "primary_private_subnet_cidrs",
    "primary_public_subnet_cidrs",
    "secondary_private_subnet_cidrs",
    "secondary_public_subnet_cidrs"
  ].forEach(key => {
    it(`${key} should be an array of CIDR strings`, () => {
      expect(Array.isArray(outputs[key])).toBe(true);
      outputs[key].forEach((cidr: string) => {
        expect(typeof cidr).toBe("string");
        expect(cidr).toMatch(/^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}\/\d{1,2}$/);
      });
    });
  });

  // Validate RDS endpoint format
  ["primary_rds_endpoint", "secondary_rds_endpoint"].forEach(key => {
    it(`${key} should be a valid RDS endpoint`, () => {
      expect(isNonEmptyString(outputs[key])).toBe(true);
      expect(outputs[key]).toMatch(/\.rds\.amazonaws\.com$/);
    });
  });

  // Validate RDS port is 3306
  ["primary_rds_port", "secondary_rds_port"].forEach(key => {
    it(`${key} should be string "3306"`, () => {
      expect(outputs[key]).toBe("3306");
    });
  });

  // Validate RDS security group IDs
  ["primary_rds_security_group_id", "secondary_rds_security_group_id"].forEach(key => {
    it(`${key} should be a valid Security Group ID`, () => {
      expect(isValidSecurityGroupId(outputs[key])).toBe(true);
    });
  });

  // Validate DB subnet and parameter group names
  ["primary_db_subnet_group_name", "secondary_db_subnet_group_name",
   "primary_db_parameter_group_name", "secondary_db_parameter_group_name"].forEach(key => {
    it(`${key} should be a non-empty string`, () => {
      expect(isNonEmptyString(outputs[key])).toBe(true);
    });
  });

  // Validate RDS CloudWatch log group names array
  ["primary_rds_log_group_names", "secondary_rds_log_group_names"].forEach(key => {
    it(`${key} should be an array of log group names starting with /aws/rds/instance/`, () => {
      expect(Array.isArray(outputs[key])).toBe(true);
      outputs[key].forEach((logGroup: string) => {
        expect(typeof logGroup).toBe("string");
        expect(logGroup.startsWith("/aws/rds/instance/")).toBe(true);
      });
    });
  });

  // Environment string validation
  it("tap_project_environment should be a non-empty string", () => {
    expect(isNonEmptyString(outputs.tap_project_environment)).toBe(true);
  });

  // IAM Users group name validation
  it("tap_users_group should be a non-empty string matching prefix tap-", () => {
    expect(isNonEmptyString(outputs.tap_users_group)).toBe(true);
    expect(outputs.tap_users_group.startsWith("tap-")).toBe(true);
  });

});
