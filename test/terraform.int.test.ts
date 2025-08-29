import * as fs from "fs";
import * as path from "path";

const outputPath = path.resolve(process.cwd(), "cfn-outputs/flat-outputs.json");

/**
 * Validators
 */
const isNonEmptyString = (val: any): boolean =>
  typeof val === "string" && val.trim().length > 0;

// Extended ARN validator to support:
// - IAM role ARNs with slashes
// - S3 bucket ARNs
// - Generic AWS resource ARNs including CloudWatch alarms, ALB etc.
const isValidArn = (val: any): boolean => {
  if (typeof val !== "string" || val.trim() === "") return false;

  const iamRoleArnPattern = /^arn:aws:iam::\d{12}:role[\/\w+=,.@-]+$/;
  const s3BucketArnPattern = /^arn:aws:s3:::[a-zA-Z0-9.\-_]{3,63}$/;
  const genericArnPattern = /^arn:aws:[^:]+:[^:]*:\d{12}:.*$/;

  return iamRoleArnPattern.test(val) || s3BucketArnPattern.test(val) || genericArnPattern.test(val);
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

const isValidAmiId = (val: any): boolean =>
  isNonEmptyString(val) && val.startsWith("ami-");

const isValidInstanceId = (val: any): boolean =>
  isNonEmptyString(val) && val.startsWith("i-");

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
      "vpc_id",
      "vpc_cidr_block",
      "vpc_arn",
      "public_subnet_ids",
      "private_subnet_ids",
      "public_subnet_cidrs",
      "private_subnet_cidrs",
      "internet_gateway_id",
      "nat_gateway_ids",
      "elastic_ip_addresses",
      "public_route_table_id",
      "private_route_table_ids",
      "alb_security_group_id",
      "ec2_security_group_id",
      "ami_id",
      "ami_name",
      "standalone_instance_id",
      "standalone_instance_private_ip",
      "standalone_instance_arn",
      "launch_template_id",
      "launch_template_latest_version",
      "autoscaling_group_name",
      "target_group_id",
      "target_group_arn",
      "ec2_iam_role_arn",
      "ec2_iam_role_name",
      "ec2_instance_profile_arn",
      "ec2_instance_profile_name",
      "cloudtrail_iam_role_arn",
      "backup_iam_role_arn",
      "dlm_lifecycle_role_arn",
      "logs_bucket_id",
      "logs_bucket_arn",
      "logs_bucket_domain_name",
      "guardduty_findings_bucket_id",
      "guardduty_findings_bucket_arn",
      "kms_key_id",
      "kms_key_arn",
      "kms_alias_name",
      "kms_alias_arn",
      "cloudwatch_log_group_httpd_access_name",
      "cloudwatch_log_group_httpd_error_name",
      "cloudwatch_log_group_cloudtrail_name",
      "cloudwatch_dashboard_url",
      "guardduty_detector_id",
      "backup_vault_id",
      "backup_vault_arn",
      "backup_plan_id",
      "backup_plan_arn",
      "backup_selection_id",
      "dlm_lifecycle_policy_id",
      "dlm_lifecycle_policy_arn",
    ];
    expectedKeys.forEach((key) => {
      expect(outputs).toHaveProperty(key);
    });
  });

  /**
   * Helper to test ARNs if present, warn if missing
   */
  const testArnIfPresent = (key: string) => {
    it(`${key} should be a valid AWS ARN if present`, () => {
      const val = outputs[key];
      if (!val) {
        console.warn(`Warning: Output ${key} is missing or empty.`);
        return;
      }
      expect(isValidArn(val)).toBe(true);
    });
  };

  [
    "vpc_arn",
    "standalone_instance_arn",
    "target_group_arn",
    "ec2_iam_role_arn",
    "ec2_instance_profile_arn",
    "cloudtrail_iam_role_arn",
    "backup_iam_role_arn",
    "dlm_lifecycle_role_arn",
    "logs_bucket_arn",
    "guardduty_findings_bucket_arn",
    "kms_key_arn",
    "kms_alias_arn",
    "backup_vault_arn",
    "backup_plan_arn",
    "dlm_lifecycle_policy_arn",
  ].forEach(testArnIfPresent);

  it("vpc_id should be a valid VPC ID", () => {
    expect(isValidVpcId(outputs.vpc_id)).toBe(true);
  });

  it("internet_gateway_id should be a valid Internet Gateway ID", () => {
    expect(isValidInternetGatewayId(outputs.internet_gateway_id)).toBe(true);
  });

  ["alb_security_group_id", "ec2_security_group_id"].forEach((key) => {
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

  ["public_subnet_cidrs", "private_subnet_cidrs"].forEach((key) => {
    it(`${key} should be an array of CIDR strings`, () => {
      const arr = parseMaybeJsonArray(outputs[key]);
      expect(arr).not.toBeNull();
      arr!.forEach((cidr) => {
        expect(typeof cidr).toBe("string");
        expect(isValidCidr(cidr)).toBe(true);
      });
    });
  });

  it("nat_gateway_ids should be an array of valid NAT Gateway IDs", () => {
    const arr = parseMaybeJsonArray(outputs.nat_gateway_ids);
    expect(arr).not.toBeNull();
    arr!.forEach((id) => expect(isValidNatGatewayId(id)).toBe(true));
  });

  it("elastic_ip_addresses should be an array of valid IP addresses", () => {
    const ips = parseMaybeJsonArray(outputs.elastic_ip_addresses);
    expect(ips).not.toBeNull();
    ips!.forEach((ip) => {
      expect(isValidIp(ip)).toBe(true);
    });
  });

  it("ami_id should be a valid AMI ID", () => {
    expect(isValidAmiId(outputs.ami_id)).toBe(true);
  });

  it("standalone_instance_id should be a valid EC2 instance ID", () => {
    expect(isValidInstanceId(outputs.standalone_instance_id)).toBe(true);
  });

  it("standalone_instance_private_ip should be a valid private IP", () => {
    expect(isValidIp(outputs.standalone_instance_private_ip)).toBe(true);
  });

  it("launch_template_id should be a valid launch template ID", () => {
    expect(isValidLtId(outputs.launch_template_id)).toBe(true);
  });

  it("launch_template_latest_version should be a non-empty string and not zero", () => {
    expect(isNonEmptyString(outputs.launch_template_latest_version)).toBe(true);
    expect(outputs.launch_template_latest_version).not.toBe("0");
  });

  it("ami_name should be a non-empty string", () => {
    expect(isNonEmptyString(outputs.ami_name)).toBe(true);
  });

  it("target_group_id should be a non-empty string", () => {
    expect(isNonEmptyString(outputs.target_group_id)).toBe(true);
  });

  it("cloudwatch_dashboard_url should be a valid AWS Console URL", () => {
    expect(typeof outputs.cloudwatch_dashboard_url).toBe("string");
    expect(outputs.cloudwatch_dashboard_url.includes("console.aws.amazon.com/cloudwatch")).toBe(true);
  });
});
