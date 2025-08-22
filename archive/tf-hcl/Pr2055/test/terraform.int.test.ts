import * as fs from "fs";
import * as path from "path";

const outputPath = path.resolve(process.cwd(), "cfn-outputs/flat-outputs.json");

const isNonEmptyString = (val: any): boolean =>
  typeof val === "string" && val.trim().length > 0;

const isValidArn = (val: any): boolean => {
  if (!isNonEmptyString(val)) return false;
  return /^arn:aws:[\w-]+:[\w-]*:\d{12}:[\w\-\/:.]+$/.test(val) ||
         /^arn:aws:s3:::[\w\.\-]+$/.test(val);
};

const isValidVpcId = (val: any): boolean =>
  isNonEmptyString(val) && /^vpc-[a-z0-9]+$/.test(val);

const isValidSubnetId = (val: any): boolean =>
  isNonEmptyString(val) && /^subnet-[a-z0-9]+$/.test(val);

const isValidSecurityGroupId = (val: any): boolean =>
  isNonEmptyString(val) && /^sg-[a-z0-9]+$/.test(val);

const isValidInternetGatewayId = (val: any): boolean =>
  isNonEmptyString(val) && /^igw-[a-z0-9]+$/.test(val);

const isValidNatGatewayId = (val: any): boolean =>
  isNonEmptyString(val) && /^nat-[a-z0-9]+$/.test(val);

const isValidAmiId = (val: any): boolean =>
  isNonEmptyString(val) && /^ami-[a-z0-9]+$/.test(val);

const isValidIp = (val: string): boolean =>
  typeof val === "string" && /^(\d{1,3}\.){3}\d{1,3}$/.test(val);

const isValidBucketName = (val: any): boolean =>
  isNonEmptyString(val) && /^[a-z0-9\-\.]+$/.test(val);

const isValidJsonArrayString = (val: any): boolean => {
  if (!isNonEmptyString(val)) return false;
  try {
    const arr = JSON.parse(val);
    return Array.isArray(arr);
  } catch {
    return false;
  }
};

const parseArray = (val: any): string[] => {
  if (!val) return [];
  if (Array.isArray(val)) return val;
  if (typeof val === "string") {
    try { return JSON.parse(val); }
    catch { return []; }
  }
  return [];
};

describe("Expanded Integration Tests for tap_stack.tf Terraform Outputs", () => {
  let outputs: Record<string, any>;

  beforeAll(() => {
    outputs = JSON.parse(fs.readFileSync(outputPath, "utf-8"));
  });

  // Core Networking
  it("VPC id and CIDR block should be valid", () => {
    expect(isValidVpcId(outputs.vpc_id)).toBe(true);
    expect(outputs.vpc_cidr_block).toMatch(/^\d{1,3}(\.\d{1,3}){3}\/\d{1,2}$/);
    expect(outputs.vpc_cidr).toEqual(outputs.vpc_cidr_block);
  });

  it("Internet Gateway ID should be valid", () => {
    expect(isValidInternetGatewayId(outputs.internet_gateway_id)).toBe(true);
  });

  it("NAT Gateway IDs and Elastic IPs should be valid and consistent", () => {
    const natGWIds = parseArray(outputs.nat_gateway_ids);
    natGWIds.forEach(id => expect(isValidNatGatewayId(id)).toBe(true));

    const natEipIds = parseArray(outputs.nat_eip_ids);
    natEipIds.forEach(id => expect(isNonEmptyString(id)).toBe(true));

    const natEipPublicIps = parseArray(outputs.nat_eip_public_ips);
    natEipPublicIps.forEach(ip => expect(isValidIp(ip)).toBe(true));

    const natGwPubIps = parseArray(outputs.nat_gateway_public_ips);
    natGwPubIps.forEach(ip => expect(isValidIp(ip)).toBe(true));

    // Counts should match
    expect(natGWIds.length).toEqual(natEipIds.length);
    expect(natEipIds.length).toEqual(natEipPublicIps.length);
  });

  // Subnets
  it("Subnet IDs and CIDRs for public and private should be valid", () => {
    const pubSubnets = parseArray(outputs.public_subnet_ids);
    const privSubnets = parseArray(outputs.private_subnet_ids);
    expect(pubSubnets.length).toBeGreaterThan(0);
    expect(privSubnets.length).toBeGreaterThan(0);
    pubSubnets.forEach(id => expect(isValidSubnetId(id)).toBe(true));
    privSubnets.forEach(id => expect(isValidSubnetId(id)).toBe(true));

    const pubCidrs = parseArray(outputs.public_subnet_cidrs);
    const privCidrs = parseArray(outputs.private_subnet_cidrs);
    expect(pubCidrs.length).toEqual(pubSubnets.length);
    expect(privCidrs.length).toEqual(privSubnets.length);
    
    pubCidrs.forEach(cidr => expect(cidr).toMatch(/^\d{1,3}(\.\d{1,3}){3}\/\d{1,2}$/));
    privCidrs.forEach(cidr => expect(cidr).toMatch(/^\d{1,3}(\.\d{1,3}){3}\/\d{1,2}$/));
  });

  // EC2 Instance Details
  it("EC2 instance core details should be valid", () => {
    expect(isNonEmptyString(outputs.ec2_instance_id)).toBe(true);
    expect(outputs.ec2_instance_id).toMatch(/^i-[a-z0-9]+$/);
    expect(isValidSecurityGroupId(outputs.ec2_security_group_id)).toBe(true);
    expect(isValidIp(outputs.ec2_private_ip)).toBe(true);
    if (outputs.ec2_public_ip) {
      expect(isValidIp(outputs.ec2_public_ip)).toBe(true);
    }
    expect(isNonEmptyString(outputs.ec2_instance_profile_name)).toBe(true);
  });

  it("EC2 instance additional attributes", () => {
    expect(typeof outputs.ec2_instance_monitoring === "string").toBe(true);
    expect(outputs.ec2_instance_monitoring === "true" || outputs.ec2_instance_monitoring === "false").toBe(true);
    expect(isNonEmptyString(outputs.ec2_instance_type)).toBe(true);
    expect(typeof outputs.ec2_instance_key_name === "string").toBe(true);
    expect(parseArray(outputs.ec2_instance_vpc_security_group_ids).length).toBeGreaterThan(0);
  });

  it("EC2 root block device encryption and size", () => {
    expect(isNonEmptyString(outputs.ec2_root_block_device)).toBe(true);
    
    const devices = JSON.parse(outputs.ec2_root_block_device);
    expect(devices.length).toBeGreaterThan(0);
    devices.forEach((dev: any) => {
      expect(typeof dev.encrypted).toBe("boolean");
      expect(dev.volume_size).toBeGreaterThan(0);
    });
  });

  // S3 Bucket Details
  it("S3 bucket ARNs, names and encryption configs should be valid", () => {
    expect(isValidArn(outputs.s3_bucket_arn)).toBe(true);
    if (outputs.s3_bucket_name) expect(isValidBucketName(outputs.s3_bucket_name)).toBe(true);
    
    expect(isNonEmptyString(outputs.s3_bucket_domain_name)).toBe(true);
    expect(isNonEmptyString(outputs.s3_bucket_hosted_zone_id)).toBe(true);
    expect(isNonEmptyString(outputs.s3_bucket_region)).toBe(true);

    expect(outputs.s3_bucket_versioning_status).toMatch(/Enabled|Suspended/);

    // Encryption config is a JSON array string
    expect(isValidJsonArrayString(outputs.s3_bucket_encryption_configuration)).toBe(true);
  });

  // CloudTrail Details
  it("CloudTrail properties should be valid", () => {
    expect(isValidArn(outputs.cloudtrail_arn)).toBe(true);
    expect(isNonEmptyString(outputs.cloudtrail_s3_bucket_name)).toBe(true);
    expect(isValidBucketName(outputs.cloudtrail_s3_bucket_name)).toBe(true);

    expect(outputs.cloudtrail_enable_log_file_validation).toMatch(/true|false/);
    expect(outputs.cloudtrail_is_multi_region_trail).toMatch(/true|false/);
    expect(outputs.cloudtrail_include_global_service_events).toMatch(/true|false/);

    expect(isValidArn(outputs.cloudtrail_kms_key_id)).toBe(true);
  });

  // IAM Roles and Policies
  it("IAM role and policy ARNs and names should be valid", () => {
    expect(isValidArn(outputs.ec2_iam_role_arn)).toBe(true);
    expect(isNonEmptyString(outputs.ec2_iam_role_name)).toBe(true);

    expect(isValidArn(outputs.ec2_instance_profile_arn)).toBe(true);
    expect(isNonEmptyString(outputs.ec2_instance_profile_name)).toBe(true);

    if (outputs.mfa_group_arn) expect(isValidArn(outputs.mfa_group_arn)).toBe(true);
    if (outputs.mfa_policy_arn) expect(isValidArn(outputs.mfa_policy_arn)).toBe(true);
  });

  // Security Group Checks
  it("Security group details should be valid", () => {
    expect(isValidArn(outputs.ec2_security_group_arn)).toBe(true);
    expect(isNonEmptyString(outputs.ec2_security_group_name)).toBe(true);
    expect(isNonEmptyString(outputs.ec2_security_group_description)).toBe(true);

    // ingress and egress rules are JSON strings
    expect(isNonEmptyString(outputs.ec2_security_group_ingress_rules)).toBe(true);
    expect(isNonEmptyString(outputs.ec2_security_group_egress_rules)).toBe(true);

    const ingressRules = JSON.parse(outputs.ec2_security_group_ingress_rules);
    expect(ingressRules.length).toBeGreaterThan(0);
    ingressRules.forEach((r: any) => {
      expect(typeof r.from_port).toBe("number");
      expect(typeof r.to_port).toBe("number");
      expect(typeof r.protocol).toBe("string");
    });

    const egressRules = JSON.parse(outputs.ec2_security_group_egress_rules);
    expect(egressRules.length).toBeGreaterThan(0);
    egressRules.forEach((r: any) => {
      expect(typeof r.from_port).toBe("number");
      expect(typeof r.to_port).toBe("number");
      expect(typeof r.protocol).toBe("string");
    });
  });

  // Data sources - Amazon Linux AMI details
  it("Amazon Linux AMI data source outputs should be valid", () => {
    expect(isNonEmptyString(outputs.amazon_linux_ami_name)).toBe(true);
    expect(isNonEmptyString(outputs.amazon_linux_ami_description)).toBe(true);
    expect(isValidArn(outputs.amazon_linux_ami_owner_id) || /^[0-9]+$/.test(outputs.amazon_linux_ami_owner_id)).toBe(true);
    expect(isNonEmptyString(outputs.amazon_linux_ami_creation_date)).toBe(true);
  });

  // Local values validations
  it("Local value outputs should be present and non-empty", () => {
    expect(isNonEmptyString(outputs.name_prefix)).toBe(true);

    // common_tags is a JSON object string
    expect(isNonEmptyString(outputs.common_tags)).toBe(true);
    try {
      const tags = JSON.parse(outputs.common_tags);
      expect(Object.keys(tags).length).toBeGreaterThan(0);
    } catch {
      fail("common_tags output is not valid JSON");
    }

    expect(isNonEmptyString(outputs.vpc_cidr)).toBe(true);
    expect(outputs.vpc_cidr).toEqual(outputs.vpc_cidr_block);
  });

  // Resource counts validation
  it("Resource count outputs should be numeric and consistent", () => {
    ["public_subnets_count", "private_subnets_count", "nat_gateways_count", "elastic_ips_count"].forEach(key => {
      expect(isNonEmptyString(outputs[key])).toBe(true);
      expect(!isNaN(Number(outputs[key]))).toBe(true);
    });
  });
});
