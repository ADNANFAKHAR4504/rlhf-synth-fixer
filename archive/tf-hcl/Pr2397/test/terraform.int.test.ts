import * as fs from "fs";
import * as path from "path";

const outputPath = path.resolve(process.cwd(), "cfn-outputs/flat-outputs.json");

const isNonEmptyString = (val: any): boolean =>
  typeof val === "string" && val.trim().length > 0;

const isValidArn = (val: any): boolean =>
  typeof val === "string" &&
  /^arn:aws:[\w-]+:[\w-]*:\d{12}:[\w\-\/:.]+$/.test(val);

const isValidVpcId = (val: any): boolean =>
  /^vpc-[a-z0-9]+$/.test(val);

const isValidSubnetId = (val: any): boolean =>
  /^subnet-[a-z0-9]+$/.test(val);

const isValidSecurityGroupId = (val: any): boolean =>
  /^sg-[a-z0-9]+$/.test(val);

const isValidInternetGatewayId = (val: any): boolean =>
  /^igw-[a-z0-9]+$/.test(val);

const isValidNatGatewayId = (val: any): boolean =>
  /^nat-[a-z0-9]+$/.test(val);

const isValidAmiId = (val: any): boolean =>
  /^ami-[a-z0-9]+$/.test(val);

const isValidIp = (val: any): boolean =>
  typeof val === "string" && /^(\d{1,3}\.){3}\d{1,3}$/.test(val);

const parseArray = (val: any): string[] => {
  if (!val) return [];
  if (Array.isArray(val)) return val;
  if (typeof val === "string") {
    try {
      return JSON.parse(val);
    } catch {
      return [];
    }
  }
  return [];
};

describe("Terraform Integration Tests (aligned with flat outputs)", () => {
  let outputs: Record<string, any>;
  beforeAll(() => {
    outputs = JSON.parse(fs.readFileSync(outputPath, "utf-8"));
  });

  it("should have all expected output keys", () => {
    const expectedKeys = [
      "alb_security_group_id",
      "amazon_linux_ami_id",
      "amazon_linux_ami_name",
      "autoscaling_group_name",
      "ec2_iam_role_arn",
      "ec2_instance_profile_name",
      "ec2_security_group_id",
      "elastic_ip_addresses",
      "internet_gateway_id",
      "launch_template_id",
      "load_balancer_dns",
      "load_balancer_zone_id",
      "nat_gateway_ids",
      "private_route_table_ids",
      "private_subnet_ids",
      "public_route_table_id",
      "public_subnet_ids",
      "standalone_instance_id",
      "standalone_instance_public_dns",
      "standalone_instance_public_ip",
      "target_group_arn",
      "vpc_cidr_block",
      "vpc_id",
    ];
    expect(Object.keys(outputs).sort()).toEqual(expectedKeys.sort());
  });

  it("vpc_id should be valid", () => {
    expect(isValidVpcId(outputs.vpc_id)).toBe(true);
  });

  it("vpc_cidr_block should be valid CIDR", () => {
    expect(outputs.vpc_cidr_block).toMatch(/^\d{1,3}(\.\d{1,3}){3}\/\d{1,2}$/);
  });

  it("internet_gateway_id should be valid", () => {
    expect(isValidInternetGatewayId(outputs.internet_gateway_id)).toBe(true);
  });

  it("nat_gateway_ids should be a valid array of NAT IDs", () => {
    const nats = parseArray(outputs.nat_gateway_ids);
    expect(nats.length).toBeGreaterThan(0);
    nats.forEach(id => expect(isValidNatGatewayId(id)).toBe(true));
  });

  it("elastic_ip_addresses should be valid IPv4s", () => {
    const eips = parseArray(outputs.elastic_ip_addresses);
    expect(eips.length).toBeGreaterThan(0);
    eips.forEach(ip => expect(isValidIp(ip)).toBe(true));
  });

  it("standalone_instance_id should be valid", () => {
    expect(outputs.standalone_instance_id).toMatch(/^i-[a-z0-9]+$/);
  });

  it("standalone_instance_public_ip should be valid IPv4", () => {
    expect(isValidIp(outputs.standalone_instance_public_ip)).toBe(true);
  });

  it("standalone_instance_public_dns should be non-empty hostname", () => {
    expect(isNonEmptyString(outputs.standalone_instance_public_dns)).toBe(true);
    expect(outputs.standalone_instance_public_dns).toMatch(/ec2-[\d-]+\.us-west-2\.compute\.amazonaws\.com/);
  });

  it("subnets should be valid IDs", () => {
    parseArray(outputs.public_subnet_ids).forEach(id =>
      expect(isValidSubnetId(id)).toBe(true)
    );
    parseArray(outputs.private_subnet_ids).forEach(id =>
      expect(isValidSubnetId(id)).toBe(true)
    );
  });

  it("security groups should be valid IDs", () => {
    expect(isValidSecurityGroupId(outputs.alb_security_group_id)).toBe(true);
    expect(isValidSecurityGroupId(outputs.ec2_security_group_id)).toBe(true);
  });

  it("IAM role and instance profile should be valid", () => {
    expect(isValidArn(outputs.ec2_iam_role_arn)).toBe(true);
    expect(isNonEmptyString(outputs.ec2_instance_profile_name)).toBe(true);
  });

  it("AMI details should be valid", () => {
    expect(isValidAmiId(outputs.amazon_linux_ami_id)).toBe(true);
    expect(outputs.amazon_linux_ami_name).toMatch(/^amzn2-ami-hvm-/);
  });

  it("Load balancer DNS and Zone ID should be valid", () => {
    expect(outputs.load_balancer_dns).toMatch(/\.elb\.amazonaws\.com$/);
    expect(isNonEmptyString(outputs.load_balancer_zone_id)).toBe(true);
  });

  it("Target group ARN should be valid", () => {
    expect(isValidArn(outputs.target_group_arn)).toBe(true);
  });

  it("ASG and launch template should be non-empty", () => {
    expect(isNonEmptyString(outputs.autoscaling_group_name)).toBe(true);
    expect(outputs.launch_template_id).toMatch(/^lt-[a-z0-9]+$/);
  });

  it("Route tables should be valid IDs", () => {
    expect(outputs.public_route_table_id).toMatch(/^rtb-[a-z0-9]+$/);
    parseArray(outputs.private_route_table_ids).forEach(id =>
      expect(id).toMatch(/^rtb-[a-z0-9]+$/)
    );
  });
});
