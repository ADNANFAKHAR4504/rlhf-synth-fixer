import * as fs from "fs";
import * as path from "path";

const outputPath = path.resolve(process.cwd(), "cfn-outputs/flat-outputs.json");
let outputs: Record<string, any>;

// ------------------------------
// Helper Validators
// ------------------------------
const isNonEmptyString = (val: any): boolean =>
  typeof val === "string" && val.trim().length > 0;

const isValidArn = (val: any): boolean =>
  typeof val === "string" && val.startsWith("arn:aws:");

const isValidIp = (val: any): boolean =>
  typeof val === "string" && /^(\d{1,3}\.){3}\d{1,3}$/.test(val);

const isArrayString = (val: any): boolean => {
  try {
    const parsed = JSON.parse(val);
    return Array.isArray(parsed);
  } catch {
    return false;
  }
};

// ------------------------------
// Load outputs before tests
// ------------------------------
beforeAll(() => {
  outputs = JSON.parse(fs.readFileSync(outputPath, "utf-8"));
});

describe("Flat outputs.json validation", () => {
  it("outputs file loaded with many keys", () => {
    expect(Object.keys(outputs).length).toBeGreaterThan(20);
  });

  // ------------------------------
  // VPC IDs
  // ------------------------------
  it("VPC IDs are non-empty strings", () => {
    expect(isNonEmptyString(outputs.primary_vpc_id)).toBe(true);
    expect(isNonEmptyString(outputs.secondary_vpc_id)).toBe(true);
  });

  // ------------------------------
  // Subnets
  // ------------------------------
  it("Subnet IDs are valid arrays", () => {
    [
      "primary_public_subnet_ids",
      "primary_private_subnet_ids",
      "secondary_public_subnet_ids",
      "secondary_private_subnet_ids",
    ].forEach((key) => expect(isArrayString(outputs[key])).toBe(true));
  });

  // ------------------------------
  // Security Groups
  // ------------------------------
  it("Security group IDs follow sg-* format", () => {
    [
      "primary_alb_security_group_id",
      "primary_ec2_security_group_id",
      "primary_rds_security_group_id",
      "secondary_alb_security_group_id",
      "secondary_ec2_security_group_id",
      "secondary_rds_security_group_id",
    ].forEach((k) => {
      expect(outputs[k]).toMatch(/^sg-/);
    });
  });

  // ------------------------------
  // ALBs
  // ------------------------------
  it("ALB DNS names look valid", () => {
    expect(outputs.primary_alb_dns_name).toContain(".elb.amazonaws.com");
    expect(outputs.secondary_alb_dns_name).toContain(".elb.amazonaws.com");
  });

  it("ALB zone IDs are non-empty", () => {
    expect(isNonEmptyString(outputs.primary_alb_zone_id)).toBe(true);
    expect(isNonEmptyString(outputs.secondary_alb_zone_id)).toBe(true);
  });

  // ------------------------------
  // RDS
  // ------------------------------
  it("RDS endpoints and ports are valid", () => {
    expect(outputs.primary_rds_endpoint).toContain(".rds.amazonaws.com");
    expect(outputs.secondary_rds_endpoint).toContain(".rds.amazonaws.com");
    expect(outputs.primary_rds_port).toBe("3306");
    expect(outputs.secondary_rds_port).toBe("3306");
  });

  // ------------------------------
  // IAM
  // ------------------------------
  it("IAM ARNs are valid", () => {
    expect(isValidArn(outputs.ec2_iam_role_arn)).toBe(true);
    expect(isNonEmptyString(outputs.ec2_instance_profile_name)).toBe(true);
    expect(isValidArn(outputs.rds_monitoring_role_arn)).toBe(true);
  });

  // ------------------------------
  // Auto Scaling Groups
  // ------------------------------
  it("Auto Scaling Group names are valid non-empty strings", () => {
    expect(isNonEmptyString(outputs.primary_asg_name)).toBe(true);
    expect(isNonEmptyString(outputs.secondary_asg_name)).toBe(true);
  });

  // ------------------------------
  // KMS
  // ------------------------------
  it("KMS keys are UUID format", () => {
    expect(outputs.primary_kms_key_id).toMatch(/^[0-9a-f-]{36}$/);
    expect(outputs.secondary_kms_key_id).toMatch(/^[0-9a-f-]{36}$/);
  });

  // ------------------------------
  // CloudWatch
  // ------------------------------
  it("Log group names start with /aws/ec2/", () => {
    expect(outputs.primary_log_group_name).toMatch(/^\/aws\/ec2\//);
    expect(outputs.secondary_log_group_name).toMatch(/^\/aws\/ec2\//);
  });

  // ------------------------------
  // Launch Templates
  // ------------------------------
  it("Launch template IDs look like lt-xxx", () => {
    expect(outputs.primary_launch_template_id).toMatch(/^lt-/);
    expect(outputs.secondary_launch_template_id).toMatch(/^lt-/);
  });

  // ------------------------------
  // NAT + EIPs
  // ------------------------------
  it("NAT Gateway IDs arrays are valid", () => {
    ["primary_nat_gateway_ids", "secondary_nat_gateway_ids"].forEach((k) =>
      expect(isArrayString(outputs[k])).toBe(true)
    );
  });

  it("EIP addresses are valid IP arrays", () => {
    ["primary_eip_addresses", "secondary_eip_addresses"].forEach((k) => {
      const ips: string[] = JSON.parse(outputs[k]);
      expect(Array.isArray(ips)).toBe(true);
      ips.forEach((ip: string) => {
        expect(isValidIp(ip)).toBe(true);
      });
    });
  });

  // ------------------------------
  // S3 + CloudFront
  // ------------------------------
  it("S3 bucket values are valid", () => {
    expect(isNonEmptyString(outputs.s3_bucket_name)).toBe(true);
    expect(outputs.s3_bucket_domain_name).toContain(".s3.amazonaws.com");
  });

  it("CloudFront distribution values are valid", () => {
    expect(isNonEmptyString(outputs.cloudfront_distribution_id)).toBe(true);
    expect(outputs.cloudfront_domain_name).toContain("cloudfront.net");
  });

  // ------------------------------
  // AMI IDs
  // ------------------------------
  it("AMI IDs look valid", () => {
    expect(outputs.primary_ami_id).toMatch(/^ami-/);
    expect(outputs.secondary_ami_id).toMatch(/^ami-/);
  });
});
