import * as fs from "fs";
import * as path from "path";

const outputPath = path.resolve(process.cwd(), "cfn-outputs/flat-outputs.json");
const rawOutputs = JSON.parse(fs.readFileSync(outputPath, "utf-8"));

// Parse JSON-string fields from outputs (like EC2 instances and lists)
const outputs: Record<string, any> = {};
for (const [key, val] of Object.entries(rawOutputs)) {
  try {
    outputs[key] = JSON.parse(val as string);
  } catch {
    outputs[key] = val;
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

const isValidArn = (arn: any): boolean =>
  typeof arn === "string" && /^arn:aws:[a-z\-]+:[a-z0-9\-]+:\d{12}:/.test(arn);

describe("Terraform Full Stack Integration Tests", () => {
  // Existing core tests

  it("outputs JSON must have all expected keys", () => {
    const baseKeys = [
      "primary_ec2_instance",
      "secondary_ec2_instance",
      "primary_route53_zone_id",
      "secondary_route53_zone_id",
      "primary_subnet_ids",
      "secondary_subnet_ids",
      "primary_vpc_id",
      "secondary_vpc_id",
      "vpc_peering_id",
      "route53_record",
    ];
    baseKeys.forEach((key: string) => {
      expect(Object.keys(outputs)).toContain(key);
    });
  });

  it("validate primary_ec2_instance structure and IPs", () => {
    const ec2 = outputs.primary_ec2_instance;
    expect(ec2).toHaveProperty("id");
    expect(isNonEmptyString(ec2.id)).toBe(true);
    expect(ec2).toHaveProperty("eip_id");
    expect(isNonEmptyString(ec2.eip_id)).toBe(true);
    expect(ec2).toHaveProperty("private_ip");
    expect(isValidIPv4(ec2.private_ip)).toBe(true);
    expect(ec2).toHaveProperty("public_ip");
    expect(isValidIPv4(ec2.public_ip)).toBe(true);
  });

  it("validate secondary_ec2_instance structure and IPs", () => {
    const ec2 = outputs.secondary_ec2_instance;
    expect(ec2).toHaveProperty("id");
    expect(isNonEmptyString(ec2.id)).toBe(true);
    expect(ec2).toHaveProperty("eip_id");
    expect(isNonEmptyString(ec2.eip_id)).toBe(true);
    expect(ec2).toHaveProperty("private_ip");
    expect(isValidIPv4(ec2.private_ip)).toBe(true);
    expect(ec2).toHaveProperty("public_ip");
    expect(isValidIPv4(ec2.public_ip)).toBe(true);
  });

  it("should have valid Route53 Hosted Zone IDs", () => {
    expect(isNonEmptyString(outputs.primary_route53_zone_id)).toBe(true);
    expect(isNonEmptyString(outputs.secondary_route53_zone_id)).toBe(true);
  });

  it("should have valid VPC IDs in both regions", () => {
    expect(isNonEmptyString(outputs.primary_vpc_id)).toBe(true);
    expect(isNonEmptyString(outputs.secondary_vpc_id)).toBe(true);
  });

  it("should have exactly 4 subnet IDs for primary and secondary", () => {
    expect(isArrayOfNonEmptyStrings(outputs.primary_subnet_ids)).toBe(true);
    expect(outputs.primary_subnet_ids.length).toBe(4);

    expect(isArrayOfNonEmptyStrings(outputs.secondary_subnet_ids)).toBe(true);
    expect(outputs.secondary_subnet_ids.length).toBe(4);
  });

  it("should have a valid VPC peering ID", () => {
    expect(isNonEmptyString(outputs.vpc_peering_id)).toBe(true);
    expect(outputs.vpc_peering_id.startsWith("pcx-")).toBe(true);
  });

  it("route53_record must be a valid hostname with subdomain", () => {
    expect(isNonEmptyString(outputs.route53_record)).toBe(true);
    expect(outputs.route53_record).toMatch(/^([a-z0-9]+(-[a-z0-9]+)*\.)+[a-z]{2,}$/i);
    expect(
      outputs.route53_record.startsWith(outputs.route53_record.split(".").slice(1).join("."))
    ).toBe(false);
  });

  // Additional enhanced outputs coverage

  describe("Networking plumbing", () => {
    it("Internet Gateway IDs valid", () => {
      expect(isNonEmptyString(outputs.primary_internet_gateway_id)).toBe(true);
      expect(outputs.primary_internet_gateway_id.startsWith("igw-")).toBe(true);

      expect(isNonEmptyString(outputs.secondary_internet_gateway_id)).toBe(true);
      expect(outputs.secondary_internet_gateway_id.startsWith("igw-")).toBe(true);
    });

    it("NAT Gateway IDs are arrays of length 2 with valid format", () => {
      const primaryNATs: string[] = JSON.parse(outputs.primary_nat_gateway_ids);
      const secondaryNATs: string[] = JSON.parse(outputs.secondary_nat_gateway_ids);

      expect(Array.isArray(primaryNATs)).toBe(true);
      expect(primaryNATs.length).toBe(2);
      primaryNATs.forEach((id: string) => expect(id.startsWith("nat-")).toBe(true));

      expect(Array.isArray(secondaryNATs)).toBe(true);
      expect(secondaryNATs.length).toBe(2);
      secondaryNATs.forEach((id: string) => expect(id.startsWith("nat-")).toBe(true));
    });

    it("Route table IDs exist and valid", () => {
      expect(isNonEmptyString(outputs.primary_public_route_table_id)).toBe(true);
      expect(outputs.primary_public_route_table_id.startsWith("rtb-")).toBe(true);

      expect(isNonEmptyString(outputs.secondary_public_route_table_id)).toBe(true);
      expect(outputs.secondary_public_route_table_id.startsWith("rtb-")).toBe(true);

      const primaryPrivateRTs: string[] = JSON.parse(outputs.primary_private_route_table_ids);
      const secondaryPrivateRTs: string[] = JSON.parse(outputs.secondary_private_route_table_ids);

      expect(Array.isArray(primaryPrivateRTs)).toBe(true);
      expect(Array.isArray(secondaryPrivateRTs)).toBe(true);

      primaryPrivateRTs.forEach((id: string) => expect(id.startsWith("rtb-")).toBe(true));
      secondaryPrivateRTs.forEach((id: string) => expect(id.startsWith("rtb-")).toBe(true));
    });

    it("Peering routes defined and non-empty", () => {
      const p2sRoutes: any[] = JSON.parse(outputs.primary_to_secondary_peering_routes);
      const s2pRoutes: any[] = JSON.parse(outputs.secondary_to_primary_peering_routes);
      expect(Array.isArray(p2sRoutes)).toBe(true);
      expect(Array.isArray(s2pRoutes)).toBe(true);
      expect(p2sRoutes.length).toBeGreaterThan(0);
      expect(s2pRoutes.length).toBeGreaterThan(0);
    });
  });

  describe("Security groups and CIDR overlap", () => {
    it("EC2 Security Groups IDs and rule counts", () => {
      expect(isNonEmptyString(outputs.primary_ec2_security_group_id)).toBe(true);
      expect(isNonEmptyString(outputs.secondary_ec2_security_group_id)).toBe(true);

      expect(Number(outputs.primary_ec2_security_group_rule_count)).toBeGreaterThan(0);
      expect(Number(outputs.secondary_ec2_security_group_rule_count)).toBeGreaterThan(0);
    });

    it("VPC CIDR overlap warning is valid", () => {
      expect(["No CIDR overlap detected", "Warning: VPC CIDRs overlap!"]).toContain(
        outputs.vpc_cidr_overlap_warning
      );
    });
  });

  describe("S3 / KMS / Replication role", () => {
    it("S3 bucket names present and valid", () => {
      expect(isNonEmptyString(outputs.primary_s3_bucket_name)).toBe(true);
      expect(isNonEmptyString(outputs.secondary_s3_bucket_name)).toBe(true);
    });

    it("KMS ARNs valid format and correct regions", () => {
      expect(isValidArn(outputs.primary_kms_key_arn)).toBe(true);
      expect(outputs.primary_kms_key_arn.includes("us-east-2")).toBe(true);

      expect(isValidArn(outputs.secondary_kms_key_arn)).toBe(true);
      expect(outputs.secondary_kms_key_arn.includes("us-west-1")).toBe(true);
    });

    it("Replication role ARN is valid", () => {
      expect(isValidArn(outputs.s3_replication_role_arn)).toBe(true);
      expect(outputs.s3_replication_role_arn.includes("role")).toBe(true);
    });
  });

  describe("IAM wiring", () => {
    it("IAM instance profile and role names have expected format", () => {
      expect(isNonEmptyString(outputs.ec2_iam_instance_profile_name)).toBe(true);
      expect(outputs.ec2_iam_instance_profile_name).toMatch(/ec2-profile/);

      expect(isNonEmptyString(outputs.ec2_iam_role_name)).toBe(true);
      expect(outputs.ec2_iam_role_name).toMatch(/ec2-role/);
    });
  });

  describe("Subnet counts", () => {
    it("Has expected count of public and private subnets per VPC", () => {
      expect(Number(outputs.primary_public_subnet_count)).toBe(2);
      expect(Number(outputs.primary_private_subnet_count)).toBe(2);

      expect(Number(outputs.secondary_public_subnet_count)).toBe(2);
      expect(Number(outputs.secondary_private_subnet_count)).toBe(2);
    });
  });

  describe("Route53 validations", () => {
    it("Route53 zone IDs and record format", () => {
      expect(isNonEmptyString(outputs.primary_route53_zone_id)).toBe(true);
      expect(isNonEmptyString(outputs.secondary_route53_zone_id)).toBe(true);

      expect(isNonEmptyString(outputs.route53_record)).toBe(true);
      expect(/^([a-z0-9]+(-[a-z0-9]+)*\.)+[a-z]{2,}$/i.test(outputs.route53_record)).toBe(true);
    });
  });

  describe("Subnet IDs format and uniqueness", () => {
    it("Subnets must be arrays and unique across both regions", () => {
      const primarySubs: string[] = JSON.parse(outputs.primary_subnet_ids);
      const secondarySubs: string[] = JSON.parse(outputs.secondary_subnet_ids);

      expect(isArrayOfNonEmptyStrings(primarySubs)).toBe(true);
      expect(isArrayOfNonEmptyStrings(secondarySubs)).toBe(true);

      const allSubs = [...primarySubs, ...secondarySubs];
      expect(new Set(allSubs).size).toBe(allSubs.length);

      allSubs.forEach((subnetId: string) => expect(subnetId.startsWith("subnet-")).toBe(true));
    });
  });

  describe("EC2 Instances consistency and IP range", () => {
    it("EC2 instance IDs are unique and IPs are in correct CIDRs", () => {
      const primaryEC2 = outputs.primary_ec2_instance;
      const secondaryEC2 = outputs.secondary_ec2_instance;

      expect(primaryEC2.id).not.toEqual(secondaryEC2.id);
      expect(isValidIPv4(primaryEC2.private_ip)).toBe(true);
      expect(isValidIPv4(primaryEC2.public_ip)).toBe(true);
      expect(isValidIPv4(secondaryEC2.private_ip)).toBe(true);
      expect(isValidIPv4(secondaryEC2.public_ip)).toBe(true);

      expect(primaryEC2.private_ip.startsWith("10.0.")).toBe(true);
      expect(secondaryEC2.private_ip.startsWith("10.1.")).toBe(true);
    });
  });

  describe("NAT Gateway and Route Table counts and format", () => {
    it("NAT Gateway IDs and private route table IDs arrays have length 2 and valid format", () => {
      const natPrimary: string[] = JSON.parse(outputs.primary_nat_gateway_ids);
      const natSecondary: string[] = JSON.parse(outputs.secondary_nat_gateway_ids);
      expect(natPrimary.length).toBe(2);
      expect(natSecondary.length).toBe(2);
      natPrimary.forEach((id: string) => expect(id.startsWith("nat-")).toBe(true));
      natSecondary.forEach((id: string) => expect(id.startsWith("nat-")).toBe(true));

      const rtbPrimaryPrivate: string[] = JSON.parse(outputs.primary_private_route_table_ids);
      const rtbSecondaryPrivate: string[] = JSON.parse(outputs.secondary_private_route_table_ids);
      expect(rtbPrimaryPrivate.length).toBe(2);
      expect(rtbSecondaryPrivate.length).toBe(2);
      rtbPrimaryPrivate.forEach((id: string) => expect(id.startsWith("rtb-")).toBe(true));
      rtbSecondaryPrivate.forEach((id: string) => expect(id.startsWith("rtb-")).toBe(true));
    });
  });
});
