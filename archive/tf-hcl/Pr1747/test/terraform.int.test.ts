import * as fs from "fs";
import * as path from "path";

const outputPath = path.resolve(process.cwd(), "cfn-outputs/flat-outputs.json");

const isNonEmptyString = (val: any): boolean =>
  typeof val === "string" && val.trim().length > 0;

// Improved ARN validation to handle IAM role ARNs with slashes
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

const isValidIp = (val: string): boolean =>
  typeof val === "string" &&
  /^(\d{1,3}\.){3}\d{1,3}$/.test(val);

describe("Selective Terraform Stack Integration Tests (No Secondary RDS)", () => {
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

  it("should have all expected keys", () => {
    const expectedKeys = [
      "ec2_instance_role_arn",
      "kms_primary_key_arn",
      "kms_secondary_key_arn",
      "primary_app_sg_arn",
      "primary_db_sg_arn",
      "primary_iam_instance_profile",
      "primary_igw_id",
      "primary_nat_gateway_ids",
      "primary_private_subnet_cidrs",
      "primary_private_subnet_ids",
      "primary_public_subnet_cidrs",
      "primary_public_subnet_ids",
      "primary_rds_endpoint",
      "primary_s3_logs_bucket",
      "primary_vpc_arn",
      "primary_vpc_id",
      "primary_web_instance_public_ips",
      "primary_web_sg_arn",
      "secondary_app_sg_arn",
      "secondary_igw_id",
      "secondary_private_subnet_cidrs",
      "secondary_private_subnet_ids",
      "secondary_public_subnet_cidrs",
      "secondary_public_subnet_ids",
      "secondary_s3_logs_bucket",
      "secondary_vpc_arn",
      "secondary_vpc_id",
      "secondary_web_sg_arn"
    ];
    expectedKeys.forEach(key => {
      expect(outputs).toHaveProperty(key);
    });
  });

  [
    "ec2_instance_role_arn",
    "kms_primary_key_arn",
    "kms_secondary_key_arn",
    "primary_app_sg_arn",
    "primary_db_sg_arn",
    "primary_web_sg_arn",
    "secondary_app_sg_arn",
    "secondary_web_sg_arn",
  ].forEach(key => {
    it(`${key} should be a valid AWS ARN`, () => {
      expect(isValidArn(outputs[key])).toBe(true);
    });
  });

  ["primary_vpc_id", "secondary_vpc_id"].forEach(key => {
    it(`${key} should be a valid VPC ID`, () => {
      expect(isValidVpcId(outputs[key])).toBe(true);
    });
  });

  ["primary_igw_id", "secondary_igw_id"].forEach(key => {
    it(`${key} should be a valid Internet Gateway ID`, () => {
      expect(isValidInternetGatewayId(outputs[key])).toBe(true);
    });
  });

  it("primary_nat_gateway_ids should be an array of valid NAT Gateway IDs", () => {
    const arr = parseMaybeJsonArray(outputs.primary_nat_gateway_ids);
    expect(arr).not.toBeNull();
    arr!.forEach(id => expect(isValidNatGatewayId(id)).toBe(true));
  });

  ["primary_private_subnet_ids", "primary_public_subnet_ids", "secondary_private_subnet_ids", "secondary_public_subnet_ids"].forEach(key => {
    it(`${key} should be an array of valid Subnet IDs`, () => {
      const arr = parseMaybeJsonArray(outputs[key]);
      expect(arr).not.toBeNull();
      arr!.forEach(id => expect(isValidSubnetId(id)).toBe(true));
    });
  });

  ["primary_private_subnet_cidrs", "primary_public_subnet_cidrs", "secondary_private_subnet_cidrs", "secondary_public_subnet_cidrs"].forEach(key => {
    it(`${key} should be an array of CIDR strings`, () => {
      const arr = parseMaybeJsonArray(outputs[key]);
      expect(arr).not.toBeNull();
      arr!.forEach(cidr => {
        expect(typeof cidr).toBe("string");
        expect(cidr).toMatch(/^\d{1,3}(\.\d{1,3}){3}\/\d{1,2}$/);
      });
    });
  });

  it("primary_rds_endpoint should be a valid RDS endpoint string", () => {
    expect(isNonEmptyString(outputs.primary_rds_endpoint)).toBe(true);
    expect(outputs.primary_rds_endpoint).toMatch(/\.rds\.amazonaws\.com$/);
  });

  // No secondary RDS, so no test for secondary_rds_endpoint

  it("primary_web_instance_public_ips should be an array of valid IP addresses", () => {
    const ips = parseMaybeJsonArray(outputs.primary_web_instance_public_ips);
    expect(ips).not.toBeNull();
    ips!.forEach(ip => {
      expect(typeof ip).toBe("string");
      expect(/^\d{1,3}(\.\d{1,3}){3}$/.test(ip)).toBe(true);
    });
  });

  it("primary_iam_instance_profile should be non-empty string", () => {
    expect(isNonEmptyString(outputs.primary_iam_instance_profile)).toBe(true);
  });

  it("primary_s3_logs_bucket and secondary_s3_logs_bucket should be non-empty strings", () => {
    expect(isNonEmptyString(outputs.primary_s3_logs_bucket)).toBe(true);
    expect(isNonEmptyString(outputs.secondary_s3_logs_bucket)).toBe(true);
  });

});
