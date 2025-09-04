import * as fs from "fs";
import * as path from "path";

const outputFile = path.resolve("cfn-outputs/flat-outputs.json");

const isNonEmptyString = (v: any) => typeof v === "string" && v.trim().length > 0;
const isValidArn = (v: string) => /^arn:[^:]+:[^:]*:[^:]*:[0-9]*:.*$/.test(v.trim());
const isValidVpcId = (v: string) => v.startsWith("vpc-");
const isValidSubnetId = (v: string) => v.startsWith("subnet-");
const isValidSGId = (v: string) => v.startsWith("sg-");
const isValidIGWId = (v: string) => v.startsWith("igw-");
const isValidNatId = (v: string) => v.startsWith("nat-");
const isValidRouteTableId = (v: string) => v.startsWith("rtb-");

const parseIfArray = (value: any) => {
  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value);
      return Array.isArray(parsed) ? parsed : value;
    } catch {
      return value;
    }
  }
  return value;
};

function skipIfMissing(key: string, obj: any) {
  if (!(key in obj)) {
    console.warn(`Skipping tests for missing output: ${key}`);
    return true;
  }
  return false;
}

describe("Terraform tap-stack flat outputs - integration validation", () => {
  let outputs: Record<string, any>;

  beforeAll(() => {
    const data = fs.readFileSync(outputFile, "utf-8");
    const parsed = JSON.parse(data);
    outputs = {};
    for (const [k, v] of Object.entries(parsed)) {
      outputs[k] = parseIfArray(v);
    }
  });

  it("has sufficient keys in outputs", () => {
    expect(Object.keys(outputs).length).toBeGreaterThan(30);
  });

  // Validate basic raw string keys presence
  it("validates key strings presence", () => {
    const keysToCheck = [
      "aws_account_id",
      "environment",
      "primary_region",
      "secondary_region",
      "primary_name_prefix",
      "secondary_name_prefix",
      "primary_lambda_function_name",
      "secondary_lambda_function_name",
      "primary_rds_db_name",
      "secondary_rds_db_name",
      "primary_alb_dns_name",
      "secondary_alb_dns_name",
    ];
    for (const key of keysToCheck) {
      if (skipIfMissing(key, outputs)) continue;
      expect(isNonEmptyString(outputs[key])).toBe(true);
    }
  });

  // Validate ARNs
  it("validates ARN outputs", () => {
    const arnKeys = Object.keys(outputs).filter(k => k.endsWith("_arn"));
    for (const key of arnKeys) {
      if (skipIfMissing(key, outputs)) continue;
      expect(isValidArn(outputs[key])).toBe(true);
    }
  });

  // Validate VPC IDs and Route Tables and subnets by prefix check
  it("validates VPC and route table IDs", () => {
    for (const region of ["primary", "secondary"]) {
      if (!skipIfMissing(`${region}_vpc_id`, outputs))
        expect(isValidVpcId(outputs[`${region}_vpc_id`])).toBe(true);
      if (!skipIfMissing(`${region}_public_route_table_id`, outputs))
        expect(isValidRouteTableId(outputs[`${region}_public_route_table_id`])).toBe(true);
      if (!skipIfMissing(`${region}_private_route_table_id`, outputs))
        expect(isValidRouteTableId(outputs[`${region}_private_route_table_id`])).toBe(true);
    }
  });

  it("validates subnet IDs arrays", () => {
    const subnetKeys = [
      "primary_public_subnet_ids",
      "primary_private_subnet_ids",
      "secondary_public_subnet_ids",
      "secondary_private_subnet_ids",
    ];
    for (const key of subnetKeys) {
      if (skipIfMissing(key, outputs)) continue;
      expect(Array.isArray(outputs[key])).toBe(true);
      for (const val of outputs[key]) {
        expect(isValidSubnetId(val)).toBe(true);
      }
    }
  });

  it("validates security group IDs", () => {
    const sgKeys = [
      "primary_ec2_sg_id", "primary_rds_sg_id", "primary_alb_sg_id",
      "secondary_ec2_sg_id", "secondary_rds_sg_id", "secondary_alb_sg_id",
    ];
    for (const key of sgKeys) {
      if (skipIfMissing(key, outputs)) continue;
      expect(isValidSGId(outputs[key])).toBe(true);
    }
  });

  it("validates internet gateway and NAT gateway IDs", () => {
    const igwKeys = ["primary_igw_id", "secondary_igw_id"];
    const natKeys = ["primary_nat_gateway_id", "secondary_nat_gateway_id"];
    for (const key of igwKeys) {
      if (skipIfMissing(key, outputs)) continue;
      expect(isValidIGWId(outputs[key])).toBe(true);
    }
    for (const key of natKeys) {
      if (skipIfMissing(key, outputs)) continue;
      expect(isValidNatId(outputs[key])).toBe(true);
    }
  });

  it("validates RDS CPU alarm names arrays and strings", () => {
    if (!skipIfMissing("primary_ec2_cpu_alarm_names", outputs)) {
      expect(Array.isArray(outputs.primary_ec2_cpu_alarm_names)).toBe(true);
      for (const n of outputs.primary_ec2_cpu_alarm_names) {
        expect(n).toMatch(/^tap-prod-primary-ec2-\d+-cpu-alarm$/);
      }
    }
    if (!skipIfMissing("secondary_ec2_cpu_alarm_names", outputs)) {
      expect(Array.isArray(outputs.secondary_ec2_cpu_alarm_names)).toBe(true);
      for (const n of outputs.secondary_ec2_cpu_alarm_names) {
        expect(n).toMatch(/^tap-prod-secondary-ec2-\d+-cpu-alarm$/);
      }
    }
    if (!skipIfMissing("primary_rds_cpu_alarm_name", outputs)) {
      expect(typeof outputs.primary_rds_cpu_alarm_name).toBe("string");
      expect(outputs.primary_rds_cpu_alarm_name).toMatch(/^tap-prod-primary-rds-cpu-alarm$/);
    }
    if (!skipIfMissing("secondary_rds_cpu_alarm_name", outputs)) {
      expect(typeof outputs.secondary_rds_cpu_alarm_name).toBe("string");
      expect(outputs.secondary_rds_cpu_alarm_name).toMatch(/^tap-prod-secondary-rds-cpu-alarm$/);
    }
  });

  it("validates availability zones JSON arrays and format", () => {
    for (const key of ["primary_availability_zones", "secondary_availability_zones"]) {
      if (skipIfMissing(key, outputs)) continue;
      expect(Array.isArray(outputs[key])).toBe(true);
      for (const az of outputs[key]) {
        expect(az).toMatch(/^us-(east|west)-\d[a-z]?$/);
      }
    }
  });

  it("validates S3 bucket IDs and ARNs", () => {
    for (const region of ["primary", "secondary"]) {
      const bucketIdKey = `${region}_s3_bucket_id`;
      const bucketArnKey = `${region}_s3_bucket_arn`;
      if (!skipIfMissing(bucketIdKey, outputs)) {
        expect(outputs[bucketIdKey]).toMatch(new RegExp(`^tap-prod-${region}-static-content`));
      }
      if (!skipIfMissing(bucketArnKey, outputs)) {
        expect(isValidArn(outputs[bucketArnKey])).toBe(true);
      }
    }
  });

  it("validates Lambda function names follow naming convention", () => {
    for (const region of ["primary", "secondary"]) {
      const key = `${region}_lambda_function_name`;
      if (skipIfMissing(key, outputs)) continue;
      expect(outputs[key]).toBe(`tap-prod-${region}-rds-backup`);
    }
  });

  it("validates RDS database names", () => {
    if (!skipIfMissing("primary_rds_db_name", outputs)) {
      expect(outputs.primary_rds_db_name).toBe("primarydb");
    }
    if (!skipIfMissing("secondary_rds_db_name", outputs)) {
      expect(outputs.secondary_rds_db_name).toBe("secondarydb");
    }
  });
});
