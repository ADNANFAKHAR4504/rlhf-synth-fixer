import * as fs from "fs";
import * as path from "path";

// Load the actual flat outputs JSON from deployment result
const outputsRaw: {[key: string]: any} = JSON.parse(
  fs.readFileSync(path.resolve(__dirname, "../cfn-outputs/flat-outputs.json"), "utf8")
);

// Helper to parse stringified arrays if they exist
function asArray(val: any): string[] {
  if (Array.isArray(val)) return val;
  try {
    return JSON.parse(val);
  } catch {
    return [val];
  }
}

function isNonEmptyString(value: any): boolean {
  return typeof value === "string" && value.trim().length > 0;
}

describe("Flat Outputs Integration Tests", () => {
  // Adjusted to keys from your flat outputs JSON
  const expectedKeys = [
    "alb_security_group_id",
    "ami_id",
    "ami_name",
    "autoscaling_group_arn",
    "availability_zones",
    "cloudwatch_log_group_name",
    "domain_name",
    "ec2_iam_role_arn",
    "ec2_instance_profile_arn",
    "ec2_security_group_id",
    "internet_gateway_id",
    "launch_template_id",
    "load_balancer_arn",
    "load_balancer_dns_name",
    "load_balancer_zone_id",
    "nat_gateway_ids",
    "private_subnet_ids",
    "public_subnet_ids",
    "rds_endpoint",
    "rds_identifier",
    "rds_port",
    "rds_security_group_id",
    "route53_name_servers",
    "route53_zone_id",
    "s3_bucket_arn",
    "s3_bucket_name",
    "secrets_manager_secret_arn",
    "target_group_arn",
    "vpc_cidr_block",
    "vpc_flow_log_id",
    "vpc_id",
  ];

  it("should contain all expected output keys", () => {
    expectedKeys.forEach(key => {
      expect(outputsRaw).toHaveProperty(key);
    });
  });

  it("should have non-empty strings for all expected outputs", () => {
    expectedKeys.forEach(key => {
      expect(isNonEmptyString(outputsRaw[key])).toBe(true);
    });
  });

  it("availability_zones should be an array of valid AZ names", () => {
    const azs = asArray(outputsRaw.availability_zones);
    expect(Array.isArray(azs)).toBe(true);
    expect(azs.length).toBe(3);
    azs.forEach(az => expect(/^us-east-2[a-c]$/.test(az)).toBe(true));
  });

  it("NAT gateway IDs array should have 3 entries", () => {
    const natIds = asArray(outputsRaw.nat_gateway_ids);
    expect(natIds.length).toBe(3);
  });

  it("Public and private subnet IDs arrays should have 3 entries", () => {
    expect(asArray(outputsRaw.public_subnet_ids).length).toBe(3);
    expect(asArray(outputsRaw.private_subnet_ids).length).toBe(3);
  });

  it("Validate RDS endpoint format and port", () => {
    expect(outputsRaw.rds_endpoint).toMatch(/^tap-stack-db\..*\.rds\.amazonaws\.com:\d+$/);
    expect(outputsRaw.rds_port).toBe("3306");
  });

  it("Validate AMI ID and name formats", () => {
    expect(/^ami-[a-z0-9]+$/.test(outputsRaw.ami_id)).toBe(true);
    expect(outputsRaw.ami_name.startsWith("amzn2-ami-hvm")).toBe(true);
  });

  it("Validate VPC CIDR block and domain name", () => {
    expect(outputsRaw.vpc_cidr_block).toBe("10.0.0.0/16");
    expect(outputsRaw.domain_name).toBe("tapstacknewtest.com");
  });

  it("All major resource IDs are unique", () => {
    const ids = [
      outputsRaw.vpc_id,
      outputsRaw.internet_gateway_id,
      ...asArray(outputsRaw.nat_gateway_ids),
      ...asArray(outputsRaw.public_subnet_ids),
      ...asArray(outputsRaw.private_subnet_ids)
    ];
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("Validate Route53 name servers array", () => {
    const ns = asArray(outputsRaw.route53_name_servers);
    expect(ns.length).toBeGreaterThanOrEqual(4);
    ns.forEach(server => expect(/^ns-\d+\.awsdns-\d+\.(?:org|co\.uk|com|net)$/.test(server)).toBe(true));
  });

  it("Validate ARNs formats for IAM roles and instances", () => {
    expect(outputsRaw.ec2_iam_role_arn).toMatch(/^arn:aws:iam::\d{12}:role\/.+$/);
    expect(outputsRaw.ec2_instance_profile_arn).toMatch(/^arn:aws:iam::\d{12}:instance-profile\/.+$/);
  });

  it("Validate load balancer's DNS name and ARN formats", () => {
    expect(outputsRaw.load_balancer_dns_name).toMatch(/^tap-stack-alb-[a-z0-9]+\.us-east-2\.elb\.amazonaws\.com$/);
    expect(outputsRaw.load_balancer_arn).toMatch(/^arn:aws:elasticloadbalancing:us-east-2:\d{12}:loadbalancer\/app\/tap-stack-alb\/.+$/);
  });

  it("Validate CloudWatch log group name", () => {
    expect(outputsRaw.cloudwatch_log_group_name).toBe("/aws/vpc/flowlogs");
  });
});
