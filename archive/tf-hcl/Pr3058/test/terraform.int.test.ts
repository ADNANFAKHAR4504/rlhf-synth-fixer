import * as fs from "fs";
import * as path from "path";

const outputPath = path.resolve(process.cwd(), "cfn-outputs/flat-outputs.json");

/**
 * Validators
 */
const isNonEmptyString = (val: any): boolean =>
  typeof val === "string" && val.trim().length > 0;

const isValidArn = (val: any): boolean => {
  if (typeof val !== "string" || val.trim() === "") return false;
  const arnPattern = /^arn:aws:[^:]+:[^:]*:\d{12}:.*$/;
  const s3Pattern = /^arn:aws:s3:::[a-zA-Z0-9.\-_]{3,63}$/;
  return arnPattern.test(val) || s3Pattern.test(val);
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

const isValidAmiId = (val: any): boolean =>
  isNonEmptyString(val) && val.startsWith("ami-");

const isValidLtId = (val: any): boolean =>
  isNonEmptyString(val) && val.startsWith("lt-");

const isValidIp = (val: any): boolean =>
  typeof val === "string" && /^(\d{1,3}\.){3}\d{1,3}$/.test(val);

const isValidCidr = (val: any): boolean =>
  typeof val === "string" && /^\d{1,3}(?:\.\d{1,3}){3}\/\d{1,2}$/.test(val);

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

/**
 * Load and normalize outputs
 */
describe("TAP Terraform Stack Integration Tests", () => {
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
      "alb_arn",
      "alb_dns_name",
      "alb_security_group_id",
      "alb_target_group_arn",
      "ami_id",
      "ami_name",
      "autoscaling_group_name",
      "cloudwatch_alarm_alb_unhealthy",
      "cloudwatch_alarm_high_cpu",
      "cloudwatch_alarm_low_cpu",
      "cloudwatch_alarm_rds_cpu",
      "ec2_iam_role_arn",
      "ec2_instance_profile_arn",
      "ec2_security_group_id",
      "internet_gateway_id",
      "launch_template_id",
      "nat_gateway_ids",
      "nat_gateway_public_ips",
      "private_subnet_ids",
      "public_subnet_ids",
      "rds_database_name",
      "rds_endpoint",
      "rds_secrets_arn",
      "rds_security_group_id",
      "route53_domain_name",
      "route53_name_servers",
      "route53_zone_id",
      "s3_bucket_arn",
      "s3_bucket_name",
      "vpc_cidr",
      "vpc_id",
    ];
    expectedKeys.forEach((key) => {
      expect(outputs).toHaveProperty(key);
    });
  });

  // ARN checks
  [
    "alb_arn",
    "alb_target_group_arn",
    "ec2_iam_role_arn",
    "ec2_instance_profile_arn",
    "rds_secrets_arn",
    "s3_bucket_arn",
  ].forEach((key) => {
    it(`${key} should be a valid AWS ARN`, () => {
      expect(isValidArn(outputs[key])).toBe(true);
    });
  });

  it("vpc_id should be a valid VPC ID", () => {
    expect(isValidVpcId(outputs.vpc_id)).toBe(true);
  });

  it("internet_gateway_id should be a valid Internet Gateway ID", () => {
    expect(isValidInternetGatewayId(outputs.internet_gateway_id)).toBe(true);
  });

  ["alb_security_group_id", "ec2_security_group_id", "rds_security_group_id"].forEach((key) => {
    it(`${key} should be a valid Security Group ID`, () => {
      expect(isValidSecurityGroupId(outputs[key])).toBe(true);
    });
  });

  ["public_subnet_ids", "private_subnet_ids"].forEach((key) => {
    it(`${key} should be an array of valid Subnet IDs`, () => {
      const arr = parseMaybeJsonArray(outputs[key]);
      expect(arr).not.toBeNull();
      arr!.forEach((id) => expect(isValidSubnetId(id)).toBe(true));
    });
  });

  it("nat_gateway_ids should be an array of valid NAT Gateway IDs", () => {
    const arr = parseMaybeJsonArray(outputs.nat_gateway_ids);
    expect(arr).not.toBeNull();
    arr!.forEach((id) => expect(isValidNatGatewayId(id)).toBe(true));
  });

  it("nat_gateway_public_ips should be an array of valid IP addresses", () => {
    const ips = parseMaybeJsonArray(outputs.nat_gateway_public_ips);
    expect(ips).not.toBeNull();
    ips!.forEach((ip) => expect(isValidIp(ip)).toBe(true));
  });

  it("ami_id should be a valid AMI ID", () => {
    expect(isValidAmiId(outputs.ami_id)).toBe(true);
  });

  it("ami_name should be a non-empty string", () => {
    expect(isNonEmptyString(outputs.ami_name)).toBe(true);
  });

  it("launch_template_id should be a valid launch template ID", () => {
    expect(isValidLtId(outputs.launch_template_id)).toBe(true);
  });

  it("autoscaling_group_name should be a non-empty string", () => {
    expect(isNonEmptyString(outputs.autoscaling_group_name)).toBe(true);
  });

  [
    "cloudwatch_alarm_alb_unhealthy",
    "cloudwatch_alarm_high_cpu",
    "cloudwatch_alarm_low_cpu",
    "cloudwatch_alarm_rds_cpu",
  ].forEach((key) => {
    it(`${key} should be a non-empty string`, () => {
      expect(isNonEmptyString(outputs[key])).toBe(true);
    });
  });

  it("rds_database_name should be a non-empty string", () => {
    expect(isNonEmptyString(outputs.rds_database_name)).toBe(true);
  });

  it("rds_endpoint should be a non-empty string containing :3306", () => {
    expect(isNonEmptyString(outputs.rds_endpoint)).toBe(true);
    expect(outputs.rds_endpoint).toContain(":3306");
  });

  it("route53_domain_name should be a non-empty string", () => {
    expect(isNonEmptyString(outputs.route53_domain_name)).toBe(true);
  });

  it("route53_name_servers should be an array of valid NS records", () => {
    const arr = parseMaybeJsonArray(outputs.route53_name_servers);
    expect(arr).not.toBeNull();
    arr!.forEach((ns) => {
      expect(typeof ns).toBe("string");
      expect(ns).toMatch(/^ns-\d+\./);
    });
  });

  it("s3_bucket_name should be a non-empty string", () => {
    expect(isNonEmptyString(outputs.s3_bucket_name)).toBe(true);
  });

  it("vpc_cidr should be a valid CIDR block", () => {
    expect(isValidCidr(outputs.vpc_cidr)).toBe(true);
  });
});

