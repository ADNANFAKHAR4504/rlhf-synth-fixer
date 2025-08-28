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

describe("Terraform Integration Tests (flat outputs)", () => {
  let outputs: Record<string, any>;
  beforeAll(() => {
    outputs = JSON.parse(fs.readFileSync(outputPath, "utf-8"));
  });

  it("should contain required keys in flat outputs", () => {
    const requiredKeys = [
      "vpc_id",
      "vpc_cidr_block",
      "vpc_arn",
      "public_subnet_ids",
      "public_subnet_cidrs",
      "private_subnet_ids",
      "private_subnet_cidrs",
      "internet_gateway_id",
      "nat_gateway_ids",
      "elastic_ip_addresses",
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
      "target_group_arn",
      "logs_bucket_id",
      "logs_bucket_arn",
      "kms_key_arn"
    ];
    requiredKeys.forEach(k => 
      expect(Object.keys(outputs)).toContain(k)
    );
  });

  it("VPC validations", () => {
    expect(isValidVpcId(outputs.vpc_id)).toBe(true);
    expect(outputs.vpc_cidr_block).toMatch(/^\d{1,3}(\.\d{1,3}){3}\/\d{1,2}$/);
    expect(isValidArn(outputs.vpc_arn)).toBe(true);
  });

  it("Subnets should be valid", () => {
    parseArray(outputs.public_subnet_ids).forEach(id =>{
      expect(isValidSubnetId(id)).toBe(true);
    });
    parseArray(outputs.private_subnet_ids).forEach(id =>{
      expect(isValidSubnetId(id)).toBe(true);
    });
  });

  it("Internet/NAT Gateways should be valid", () => {
    expect(isValidInternetGatewayId(outputs.internet_gateway_id)).toBe(true);
    parseArray(outputs.nat_gateway_ids).forEach(id =>
      expect(isValidNatGatewayId(id)).toBe(true)
    );
  });

  it("Elastic IPs should be valid IPv4s", () => {
    parseArray(outputs.elastic_ip_addresses).forEach(ip =>
      expect(isValidIp(ip)).toBe(true)
    );
  });

  it("AMI details should be valid", () => {
    expect(isValidAmiId(outputs.ami_id)).toBe(true);
    expect(outputs.ami_name).toMatch(/^amzn2-ami-hvm-/);
  });

  it("Security groups should be valid IDs", () => {
    expect(isValidSecurityGroupId(outputs.alb_security_group_id)).toBe(true);
    expect(isValidSecurityGroupId(outputs.ec2_security_group_id)).toBe(true);
  });

  it("Standalone instance outputs should be valid", () => {
    expect(outputs.standalone_instance_id).toMatch(/^i-[a-z0-9]+$/);
    expect(isValidIp(outputs.standalone_instance_private_ip)).toBe(true);
    expect(isValidArn(outputs.standalone_instance_arn)).toBe(true);
  });

  it("Launch template and ASG should be valid", () => {
    expect(outputs.launch_template_id).toMatch(/^lt-[a-z0-9]+$/);
    expect(isNonEmptyString(outputs.launch_template_latest_version)).toBe(true);
    expect(isNonEmptyString(outputs.autoscaling_group_name)).toBe(true);
  });

  it("Target group ARN should be valid", () => {
    expect(isValidArn(outputs.target_group_arn)).toBe(true);
  });

  it("KMS Key should be valid ARN", () => {
    expect(isValidArn(outputs.kms_key_arn)).toBe(true);
  });
});
