import * as fs from "fs";
import * as path from "path";

const outputPath = path.resolve(process.cwd(), "cfn-outputs/flat-outputs.json");

// Safe JSON parse function
function safeJsonParse(input: any): any {
  try {
    return JSON.parse(input);
  } catch (error) {
    throw new Error("Invalid JSON format");
  }
}

// Helper functions
const isNonEmptyString = (val: any): boolean =>
  typeof val === "string" && val.trim().length > 0;

const isArrayOfNonEmptyStrings = (val: any): boolean =>
  Array.isArray(val) && val.every((v: string) => isNonEmptyString(v));

const isValidIPv4 = (ip: any): boolean => {
  if (typeof ip !== "string") return false;
  const regex =
    /^(25[0-5]|2[0-4]\d|1\d{2}|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d{2}|[1-9]?\d)){3}$/;
  return regex.test(ip);
};

const isValidIamRoleArn = (arn: any): boolean => {
  if (typeof arn !== "string") return false;
  // IAM Role ARN pattern: arn:aws:iam::account-id:role/role-name (role-name can have paths)
  const regex = /^arn:aws:iam::\d{12}:role\/[\w+=,.@\-]+(\/[\w+=,.@\-]+)*$/;
  return regex.test(arn);
};

describe("Terraform Full Stack Integration Tests with Error Handling & Complete Outputs", () => {
  let outputsRaw: Record<string, any>;
  let outputs: Record<string, any> = {};

  beforeAll(() => {
    outputsRaw = JSON.parse(fs.readFileSync(outputPath, "utf-8"));
    for (const [key, val] of Object.entries(outputsRaw)) {
      try {
        // Parse only values that start with array or object JSON notation
        if (typeof val === "string" && (val.startsWith("[") || val.startsWith("{"))) {
          outputs[key] = safeJsonParse(val);
        } else {
          outputs[key] = val;
        }
      } catch (e) {
        outputs[key] = e;
      }
    }
  });

  // Required keys validation
  it("outputs JSON must have all expected keys", () => {
    const expectedKeys = [
      "ec2_iam_instance_profile_name",
      "ec2_iam_role_name",
      "primary_ec2_instance",
      "primary_ec2_security_group_id",
      "primary_ec2_security_group_rule_count",
      "primary_internet_gateway_id",
      "primary_kms_key_arn",
      "primary_nat_gateway_ids",
      "primary_private_route_table_ids",
      "primary_private_subnet_count",
      "primary_public_route_table_id",
      "primary_public_subnet_count",
      "primary_route53_zone_id",
      "primary_s3_bucket_name",
      "primary_subnet_ids",
      "primary_to_secondary_peering_routes",
      "primary_vpc_id",
      "route53_record",
      "s3_replication_role_arn",
      "secondary_ec2_instance",
      "secondary_ec2_security_group_id",
      "secondary_ec2_security_group_rule_count",
      "secondary_internet_gateway_id",
      "secondary_kms_key_arn",
      "secondary_nat_gateway_ids",
      "secondary_private_route_table_ids",
      "secondary_private_subnet_count",
      "secondary_public_route_table_id",
      "secondary_public_subnet_count",
      "secondary_route53_zone_id",
      "secondary_s3_bucket_name",
      "secondary_subnet_ids",
      "secondary_to_primary_peering_routes",
      "secondary_vpc_id",
      "vpc_cidr_overlap_warning",
      "vpc_peering_id"
    ];
    expectedKeys.forEach((key: string) => {
      expect(Object.keys(outputs)).toContain(key);
    });
  });

  // EC2 Instances validation
  ["primary_ec2_instance", "secondary_ec2_instance"].forEach((key) => {
    it(`validate ${key} structure and IPs`, () => {
      const ec2 = outputs[key];
      expect(ec2).toHaveProperty("id");
      expect(isNonEmptyString(ec2.id)).toBe(true);
      expect(ec2).toHaveProperty("eip_id");
      expect(isNonEmptyString(ec2.eip_id)).toBe(true);
      expect(ec2).toHaveProperty("private_ip");
      expect(isValidIPv4(ec2.private_ip)).toBe(true);
      expect(ec2).toHaveProperty("public_ip");
      expect(isValidIPv4(ec2.public_ip)).toBe(true);
    });
  });

  // Internet gateways
  it("Internet Gateway IDs are valid", () => {
    expect(isNonEmptyString(outputs.primary_internet_gateway_id)).toBe(true);
    expect(outputs.primary_internet_gateway_id.startsWith("igw-")).toBe(true);

    expect(isNonEmptyString(outputs.secondary_internet_gateway_id)).toBe(true);
    expect(outputs.secondary_internet_gateway_id.startsWith("igw-")).toBe(true);
  });

  // NAT Gateway IDs
  it("NAT Gateway IDs arrays length 2 with valid format", () => {
    expect(Array.isArray(outputs.primary_nat_gateway_ids)).toBe(true);
    expect(outputs.primary_nat_gateway_ids.length).toBe(2);
    outputs.primary_nat_gateway_ids.forEach((id: string) => expect(id.startsWith("nat-")).toBe(true));

    expect(Array.isArray(outputs.secondary_nat_gateway_ids)).toBe(true);
    expect(outputs.secondary_nat_gateway_ids.length).toBe(2);
    outputs.secondary_nat_gateway_ids.forEach((id: string) => expect(id.startsWith("nat-")).toBe(true));
  });

  // Route tables
  it("Route Tables IDs exist and valid", () => {
    expect(isNonEmptyString(outputs.primary_public_route_table_id)).toBe(true);
    expect(outputs.primary_public_route_table_id.startsWith("rtb-")).toBe(true);

    expect(isNonEmptyString(outputs.secondary_public_route_table_id)).toBe(true);
    expect(outputs.secondary_public_route_table_id.startsWith("rtb-")).toBe(true);

    expect(Array.isArray(outputs.primary_private_route_table_ids)).toBe(true);
    outputs.primary_private_route_table_ids.forEach((id: string) => expect(id.startsWith("rtb-")).toBe(true));

    expect(Array.isArray(outputs.secondary_private_route_table_ids)).toBe(true);
    outputs.secondary_private_route_table_ids.forEach((id: string) => expect(id.startsWith("rtb-")).toBe(true));
  });

  // Peering routes
  it("Peering routes defined non-empty arrays", () => {
    expect(Array.isArray(outputs.primary_to_secondary_peering_routes)).toBe(true);
    expect(outputs.primary_to_secondary_peering_routes.length).toBeGreaterThan(0);

    expect(Array.isArray(outputs.secondary_to_primary_peering_routes)).toBe(true);
    expect(outputs.secondary_to_primary_peering_routes.length).toBeGreaterThan(0);
  });

  // Security groups and rule counts
  it("Security groups IDs and rule counts", () => {
    expect(isNonEmptyString(outputs.primary_ec2_security_group_id)).toBe(true);
    expect(isNonEmptyString(outputs.secondary_ec2_security_group_id)).toBe(true);

    expect(Number(outputs.primary_ec2_security_group_rule_count)).toBeGreaterThan(0);
    expect(Number(outputs.secondary_ec2_security_group_rule_count)).toBeGreaterThan(0);
  });

  // VPC IDs and peering
  it("VPC IDs are valid and distinct", () => {
    expect(isNonEmptyString(outputs.primary_vpc_id)).toBe(true);
    expect(isNonEmptyString(outputs.secondary_vpc_id)).toBe(true);
    expect(outputs.primary_vpc_id).not.toEqual(outputs.secondary_vpc_id);
  });

  it("VPC peering ID is valid", () => {
    expect(isNonEmptyString(outputs.vpc_peering_id)).toBe(true);
    expect(outputs.vpc_peering_id.startsWith("pcx-")).toBe(true);
  });

  it("CIDR overlap warning valid", () => {
    expect(["No CIDR overlap detected", "Warning: VPC CIDRs overlap!"]).toContain(
      outputs.vpc_cidr_overlap_warning
    );
  });

  // Subnet counts
  it("Subnet counts per VPC are 2 public and 2 private", () => {
    expect(Number(outputs.primary_public_subnet_count)).toBe(2);
    expect(Number(outputs.primary_private_subnet_count)).toBe(2);
    expect(Number(outputs.secondary_public_subnet_count)).toBe(2);
    expect(Number(outputs.secondary_private_subnet_count)).toBe(2);
  });

  // Subnet IDs uniqueness and validity
  it("Subnet IDs arrays valid and unique across regions", () => {
    expect(Array.isArray(outputs.primary_subnet_ids)).toBe(true);
    expect(Array.isArray(outputs.secondary_subnet_ids)).toBe(true);

    outputs.primary_subnet_ids.forEach((id: string) => expect(id.startsWith("subnet-")).toBe(true));
    outputs.secondary_subnet_ids.forEach((id: string) => expect(id.startsWith("subnet-")).toBe(true));

    const allSubs = [...outputs.primary_subnet_ids, ...outputs.secondary_subnet_ids];
    expect(new Set(allSubs).size).toBe(allSubs.length);
  });

  // S3 and KMS outputs validity
  it("S3 bucket names exist and KMS ARNs valid", () => {
    expect(isNonEmptyString(outputs.primary_s3_bucket_name)).toBe(true);
    expect(isNonEmptyString(outputs.secondary_s3_bucket_name)).toBe(true);

    expect(isValidIamRoleArn(outputs.primary_kms_key_arn)).toBe(false); // KMS keys not IAM roles
    expect(isNonEmptyString(outputs.primary_kms_key_arn)).toBe(true);

    expect(isValidIamRoleArn(outputs.secondary_kms_key_arn)).toBe(false);
    expect(isNonEmptyString(outputs.secondary_kms_key_arn)).toBe(true);
  });

  it("S3 replication role ARN is valid", () => {
    expect(isValidIamRoleArn(outputs.s3_replication_role_arn)).toBe(true);
    expect(outputs.s3_replication_role_arn.includes("role")).toBe(true);
  });

  // IAM wiring names validation
  it("EC2 IAM instance profile and role names formatted", () => {
    expect(isNonEmptyString(outputs.ec2_iam_instance_profile_name)).toBe(true);
    expect(outputs.ec2_iam_instance_profile_name).toMatch(/ec2-profile/);

    expect(isNonEmptyString(outputs.ec2_iam_role_name)).toBe(true);
    expect(outputs.ec2_iam_role_name).toMatch(/ec2-role/);
  });

  // Route53 zone IDs and record
  it("Route53 zone IDs present and record is valid DNS hostname", () => {
    expect(isNonEmptyString(outputs.primary_route53_zone_id)).toBe(true);
    expect(isNonEmptyString(outputs.secondary_route53_zone_id)).toBe(true);

    expect(isNonEmptyString(outputs.route53_record)).toBe(true);
    expect(/^([a-z0-9]+(-[a-z0-9]+)*\.)+[a-z]{2,}$/i.test(outputs.route53_record)).toBe(true);
  });

  // EC2 instance IP ranges check
  it("EC2 private IPs are in designated CIDR blocks", () => {
    expect(outputs.primary_ec2_instance.private_ip.startsWith("10.0.")).toBe(true);
    expect(outputs.secondary_ec2_instance.private_ip.startsWith("10.1.")).toBe(true);
  });
});
