import * as fs from "fs";
import * as path from "path";

const outputPath = path.resolve(process.cwd(), "cfn-outputs/flat-outputs.json");

let outputs: Record<string, any>;

const isNonEmptyString = (val: any): boolean => typeof val === "string" && val.trim().length > 0;
const isValidArn = (val: any): boolean => typeof val === "string" && val.startsWith("arn:aws:");
const isValidIp = (val: any): boolean =>
  typeof val === "string" && /^(\d{1,3}\.){3}\d{1,3}$/.test(val);
const isValidCidr = (val: any): boolean =>
  typeof val === "string" && /^\d{1,3}(\.\d{1,3}){3}\/\d{1,2}$/.test(val);
const isValidDate = (val: any): boolean => {
  if (!isNonEmptyString(val)) return false;
  const date = new Date(val);
  return !isNaN(date.getTime());
};

beforeAll(() => {
  outputs = JSON.parse(fs.readFileSync(outputPath, "utf-8"));
});

describe("Flat outputs validation", () => {

  it("bucket_suffix is non-empty string", () => {
    expect(isNonEmptyString(outputs.bucket_suffix)).toBe(true);
  });

  it("common_tags is valid JSON and contains keys", () => {
    expect(isNonEmptyString(outputs.common_tags)).toBe(true);
    const tags = JSON.parse(outputs.common_tags);
    expect(tags.Environment).toBe("Production");
    expect(tags.ManagedBy).toBe("Terraform");
    expect(tags.Project).toBe("tap-stack");
  });

  it("deployment_summary is valid JSON and has expected keys", () => {
    expect(isNonEmptyString(outputs.deployment_summary)).toBe(true);
    const summary = JSON.parse(outputs.deployment_summary);
    expect(summary.environment).toBe("Production");
    expect(isNonEmptyString(summary.instance_type)).toBe(true);
    expect(isNonEmptyString(summary.primary_region)).toBe(true);
    expect(isNonEmptyString(summary.secondary_region)).toBe(true);
    // Further nested checks can be added
  });

  it("Validates important ARNs", () => {
    [
      "ec2_iam_role_arn",
      "ec2_instance_profile_arn",
      "primary_ec2_instance_arn",
      "primary_internet_gateway_arn",
      "primary_s3_bucket_arn",
      "primary_security_group_arn",
      "primary_vpc_arn",
      "s3_replication_iam_role_arn",
      "secondary_ec2_instance_arn",
      "secondary_internet_gateway_arn",
      "secondary_s3_bucket_arn",
      "secondary_security_group_arn",
      "secondary_vpc_arn"
    ].forEach(key => {
      expect(isValidArn(outputs[key])).toBe(true);
    });
  });

  it("Validates IP addresses", () => {
    [
      "primary_nat_eip_public_ip",
      "primary_nat_gateway_private_ip",
      "primary_nat_gateway_public_ip",
      "primary_ec2_private_ip",
      "secondary_nat_eip_public_ip",
      "secondary_nat_gateway_private_ip",
      "secondary_nat_gateway_public_ip",
      "secondary_ec2_private_ip"
    ].forEach(key => {
      expect(isValidIp(outputs[key])).toBe(true);
    });
  });

  it("Validates CIDR blocks", () => {
    [
      "primary_vpc_cidr",
      "primary_private_subnet_cidr_block",
      "primary_public_subnet_cidr_block",
      "secondary_vpc_cidr",
      "secondary_private_subnet_cidr_block",
      "secondary_public_subnet_cidr_block"
    ].forEach(key => {
      expect(isValidCidr(outputs[key])).toBe(true);
    });
  });

  it("Validates dates", () => {
    [
      "primary_ami_creation_date",
      "secondary_ami_creation_date"
    ].forEach(key => {
      expect(isValidDate(outputs[key])).toBe(true);
    });
  });

  it("Validates EC2 instance states", () => {
    expect(["running", "stopped", "pending", "terminated"]).toContain(outputs.primary_ec2_instance_state);
    if (outputs.secondary_ec2_instance_state) {
      expect(["running", "stopped", "pending", "terminated"]).toContain(outputs.secondary_ec2_instance_state);
    }
  });

  it("Validates instance types", () => {
    expect(isNonEmptyString(outputs.primary_ec2_instance_type)).toBe(true);
    if (outputs.secondary_ec2_instance_type) {
      expect(isNonEmptyString(outputs.secondary_ec2_instance_type)).toBe(true);
    }
  });

  it("Validates primary and secondary region availability zones count", () => {
    expect(typeof outputs.primary_region_availability_zones_count).toBe("string");
    expect(!isNaN(parseInt(outputs.primary_region_availability_zones_count))).toBe(true);

    expect(typeof outputs.secondary_region_availability_zones_count).toBe("string");
    expect(!isNaN(parseInt(outputs.secondary_region_availability_zones_count))).toBe(true);
  });

});
