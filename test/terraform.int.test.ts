import * as fs from "fs";
import * as path from "path";

// Path to the flat outputs JSON file
const outputPath = path.resolve(__dirname, "../cfn-outputs/flat-outputs.json");

let outputsRaw: any;
try {
  outputsRaw = JSON.parse(fs.readFileSync(outputPath, "utf-8"));
} catch (error) {
  throw new Error("Cannot load flattened outputs JSON");
}

// Helper: If a value is an encoded array-like string, convert it
function decode(val: any) {
  if (typeof val === "string" && val.startsWith("[") && val.endsWith("]")) {
    try { return JSON.parse(val); } catch { return val; }
  }
  return val;
}

// Decode array values from output
const outputs: Record<string, any> = {};
for (const [key, val] of Object.entries(outputsRaw)) {
  outputs[key] = decode(val);
}

// Helper for basic checks
function isNonEmptyString(v: any): boolean {
  return typeof v === "string" && v.trim().length > 0;
}
function isArn(str: string): boolean {
  return /^arn:aws:[\w\-]+:[\w\-]+:.*$/.test(str);
}
function isCidr(str: string): boolean {
  return /^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}\/\d{1,2}$/.test(str);
}

describe("flat-outputs.json integration output validation", () => {
  // 1. Validate presence and format of all required outputs
  const requiredKeys = [
    "amazon_linux_2_ami_id",
    "amazon_linux_2_ami_name",
    "availability_zones",
    "deployment_region",
    "ec2_iam_role_arn",
    "ec2_iam_role_name",
    "ec2_instance_availability_zones",
    "ec2_instance_ids",
    "ec2_instance_private_ips",
    "ec2_instance_profile_name",
    "ec2_security_group_id",
    "internet_gateway_id",
    "nat_gateway_eip_addresses",
    "nat_gateway_ids",
    "private_route_table_ids",
    "private_subnet_cidrs",
    "private_subnet_ids",
    "public_route_table_id",
    "public_subnet_cidrs",
    "public_subnet_ids",
    "s3_bucket_arn",
    "s3_bucket_domain_name",
    "s3_bucket_id",
    "vpc_cidr_block",
    "vpc_id"
  ];

  it("should have all required output keys and valid values", () => {
    requiredKeys.forEach((key) => {
      expect(outputs).toHaveProperty(key);
      // Check array outputs are non-empty arrays, string outputs are non-empty
      const val = outputs[key];
      if (Array.isArray(val)) {
        expect(val.length).toBeGreaterThan(0);
        val.forEach((item) => expect(isNonEmptyString(item)).toBe(true));
      } else {
        expect(isNonEmptyString(val)).toBe(true);
      }
    });
  });

  // 2. Individual output format checks (IDs, ARNs, IPs, names)
  it("should have valid instance IDs (i-...)", () => {
    const instanceIds = outputs.ec2_instance_ids;
    expect(Array.isArray(instanceIds)).toBe(true);
    instanceIds.forEach(id => {
      expect(id.startsWith("i-")).toBe(true);
      expect(id.length).toBeGreaterThan(8);
    });
  });

  it("should have availability zones as AWS formatted string", () => {
    const azs = outputs.availability_zones;
    expect(Array.isArray(azs)).toBe(true);
    azs.forEach(z => expect(/^us-east-2[ab]$/.test(z)).toBe(true));
  });

  it("should have valid CIDR blocks for public/private subnets and VPC", () => {
    [...outputs.public_subnet_cidrs, ...outputs.private_subnet_cidrs, outputs.vpc_cidr_block].forEach(cidr => {
      expect(isCidr(cidr)).toBe(true);
    });
  });

  it("should have valid IPv4 private IPs for instances", () => {
    outputs.ec2_instance_private_ips.forEach(ip => {
      expect(/^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(ip)).toBe(true);
    });
  });

  it("should have correctly formatted ARNs for S3 bucket and IAM role", () => {
    expect(isArn(outputs.s3_bucket_arn)).toBe(true);
    expect(isArn(outputs.ec2_iam_role_arn)).toBe(true);
  });

  // 3. Edge cases and logical validations
  it("instance AZs should correspond to availability zones", () => {
    const azSet = new Set(outputs.availability_zones);
    outputs.ec2_instance_availability_zones.forEach(az => {
      expect(azSet.has(az)).toBe(true);
    });
  });

  it("subnet IDs and NAT gateways should be unique", () => {
    function isUnique(arr: any[]) { return new Set(arr).size === arr.length; }
    expect(isUnique(outputs.public_subnet_ids)).toBe(true);
    expect(isUnique(outputs.private_subnet_ids)).toBe(true);
    expect(isUnique(outputs.nat_gateway_ids)).toBe(true);
    expect(isUnique(outputs.nat_gateway_eip_addresses)).toBe(true);
  });

  it("should have exactly 2 public and 2 private subnets", () => {
    expect(outputs.public_subnet_ids.length).toBe(2);
    expect(outputs.private_subnet_ids.length).toBe(2);
    expect(outputs.public_subnet_cidrs.length).toBe(2);
    expect(outputs.private_subnet_cidrs.length).toBe(2);
  });

  it("should have the expected count of EC2 instances and instance properties", () => {
    expect(outputs.ec2_instance_ids.length).toBe(4);
    expect(outputs.ec2_instance_private_ips.length).toBe(4);
    expect(outputs.ec2_instance_availability_zones.length).toBe(4);
  });

  it("should use correct profile/role names and IDs", () => {
    expect(isNonEmptyString(outputs.ec2_iam_role_name)).toBe(true);
    expect(isNonEmptyString(outputs.ec2_instance_profile_name)).toBe(true);
  });

  // 4. Negative/Edge: Uniqueness and no invalid data
  it("should not have empty, duplicate, or invalid IDs", () => {
    [...outputs.public_subnet_ids, ...outputs.private_subnet_ids,
     ...outputs.ec2_instance_ids, outputs.ec2_security_group_id, outputs.vpc_id,
     outputs.internet_gateway_id, outputs.public_route_table_id, ...outputs.private_route_table_ids,
     ...outputs.nat_gateway_ids, outputs.s3_bucket_id].forEach(id => {
      expect(isNonEmptyString(id)).toBe(true);
      expect(id).not.toContain(" "); // No spaces
      expect(id).not.toContain("null"); // Not string "null"
      expect(id).not.toContain("undefined"); // Not string "undefined"
    });
  });

  it("should have matching region in all zone names and deployment_region output", () => {
    expect(outputs.deployment_region).toBe("us-east-2");
    outputs.availability_zones.forEach(z => {
      expect(z.startsWith("us-east-2")).toBe(true);
    });
    outputs.ec2_instance_availability_zones.forEach(z => {
      expect(z.startsWith("us-east-2")).toBe(true);
    });
  });

  it("should have valid domain name for S3 bucket", () => {
    expect(outputs.s3_bucket_domain_name.endsWith(".s3.amazonaws.com")).toBe(true);
    expect(outputs.s3_bucket_domain_name.startsWith(outputs.s3_bucket_id)).toBe(true);
  });
});
