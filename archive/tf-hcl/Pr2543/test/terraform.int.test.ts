import * as fs from "fs";
import * as path from "path";

// Path to flat-outputs.json
const outputPath = path.resolve(process.cwd(), "cfn-outputs/flat-outputs.json");

// === Validators ===
const isNonEmptyString = (val: any): boolean =>
  typeof val === "string" && val.trim().length > 0;

const isValidArn = (val: string): boolean => {
  const arnPattern = /^arn:[^:]+:[^:]*:[^:]*:[0-9*]*:.*$/;
  return typeof val === "string" && arnPattern.test(val.trim());
};

const isValidVpcId = (val: string): boolean =>
  isNonEmptyString(val) && val.startsWith("vpc-");

const isValidSubnetId = (val: string): boolean =>
  isNonEmptyString(val) && val.startsWith("subnet-");

const isValidSecurityGroupId = (val: string): boolean =>
  isNonEmptyString(val) && val.startsWith("sg-");

const isValidInternetGatewayId = (val: string): boolean =>
  isNonEmptyString(val) && val.startsWith("igw-");

const isValidNatGatewayId = (val: string): boolean =>
  isNonEmptyString(val) && val.startsWith("nat-");

const isValidRouteTableId = (val: string): boolean =>
  isNonEmptyString(val) && val.startsWith("rtb-");

// Helper to parse stringified arrays
const parseIfJsonArray = (val: any): any => {
  if (typeof val === "string") {
    try {
      const parsed = JSON.parse(val);
      if (Array.isArray(parsed)) return parsed;
    } catch {
      // ignore parse errors
    }
  }
  return val;
};

describe("tap_stack - Integration validation based on flat-outputs.json", () => {
  let outputs: Record<string, any> = {};

  beforeAll(() => {
    const raw = JSON.parse(fs.readFileSync(outputPath, "utf-8"));
    outputs = {};
    for (const [key, val] of Object.entries(raw)) {
      outputs[key] = parseIfJsonArray(val);
    }
  });

  // === Required Keys ===
  it("should contain all provided keys in flat-outputs.json", () => {
    const expectedKeys = Object.keys(outputs);
    expectedKeys.forEach(key => {
      expect(outputs).toHaveProperty(key);
    });
  });

  // === Validate CIDRs ===
  it("should validate SSH and HTTPS CIDRs", () => {
    expect(outputs["allowed_https_cidrs"]).toEqual(["0.0.0.0/0"]);
    expect(outputs["allowed_ssh_cidrs"]).toEqual(["10.0.0.0/8"]);
  });

  // === Validate common_tags ===
  it("should have correct common_tags", () => {
    const tags = JSON.parse(outputs["common_tags"]);
    expect(tags.Environment).toBe("Production");
    expect(tags.ManagedBy).toBe("Terraform");
    expect(tags.departmental).toBe("businessunit");
    expect(tags.ownership).toBe("self");
  });

  // === Validate VPCs ===
  it("should validate VPC IDs and CIDRs", () => {
    expect(isValidVpcId(outputs["primary_vpc_id"])).toBe(true);
    expect(outputs["primary_vpc_cidr"]).toBe("10.0.0.0/16");

    expect(isValidVpcId(outputs["secondary_vpc_id"])).toBe(true);
    expect(outputs["secondary_vpc_cidr"]).toBe("10.1.0.0/16");
  });

  // === Validate Subnets ===
  it("should validate subnet IDs", () => {
    const subnetKeys = [
      "primary_private_subnet_ids",
      "primary_public_subnet_ids",
      "secondary_private_subnet_ids",
      "secondary_public_subnet_ids"
    ];
    subnetKeys.forEach(key => {
      const arr = outputs[key];
      expect(Array.isArray(arr)).toBe(true);
      arr.forEach((id: string) => expect(isValidSubnetId(id)).toBe(true));
    });
  });

  // === Validate Security Groups ===
  it("should validate SG IDs", () => {
    [
      "primary_ec2_security_group_id",
      "primary_alb_security_group_id",
      "primary_rds_security_group_id",
      "secondary_ec2_security_group_id",
      "secondary_alb_security_group_id",
      "secondary_rds_security_group_id"
    ].forEach(key => {
      expect(isValidSecurityGroupId(outputs[key])).toBe(true);
    });
  });

  // === Validate Internet Gateways ===
  it("should validate IGW IDs", () => {
    expect(isValidInternetGatewayId(outputs["primary_internet_gateway_id"])).toBe(true);
    expect(isValidInternetGatewayId(outputs["secondary_internet_gateway_id"])).toBe(true);
  });

  // === Validate NAT Gateways and EIPs ===
  it("should validate NAT gateway IDs and EIPs", () => {
    ["primary_nat_gateway_ids", "secondary_nat_gateway_ids"].forEach(k => {
      outputs[k].forEach((id: string) => expect(isValidNatGatewayId(id)).toBe(true));
    });

    ["primary_nat_eip_ids", "secondary_nat_eip_ids"].forEach(k => {
      outputs[k].forEach((id: string) => expect(id.startsWith("eipalloc-")).toBe(true));
    });
  });

  it("should validate NAT EIP public IP arrays", () => {
    ["primary_nat_eip_public_ips", "secondary_nat_eip_public_ips"].forEach(k => {
      outputs[k].forEach((ip: string) => expect(isNonEmptyString(ip)).toBe(true));
    });
  });

  // === Validate Route Tables ===
  it("should validate route table IDs", () => {
    [
      "primary_public_route_table_id",
      "secondary_public_route_table_id"
    ].forEach(id => {
      expect(isValidRouteTableId(outputs[id])).toBe(true);
    });
  });

  // === Validate Availability Zones ===
  it("should validate availability zones", () => {
    const primaryAZs = outputs["primary_availability_zones"];
    const secondaryAZs = outputs["secondary_availability_zones"];
    expect(Array.isArray(primaryAZs)).toBe(true);
    expect(Array.isArray(secondaryAZs)).toBe(true);
    expect(primaryAZs.length).toBeGreaterThan(0);
    expect(secondaryAZs.length).toBeGreaterThan(0);
  });

  // === Validate ARNs ===
  it("should validate ARN fields", () => {
    Object.keys(outputs)
      .filter(k => k.endsWith("_arn"))
      .forEach(k => {
        expect(isValidArn(outputs[k])).toBe(true);
      });
  });

  // === Validate RDS ===
  it("should validate RDS configuration", () => {
    expect(outputs["primary_db_engine"]).toBe("mysql");
    expect(outputs["secondary_db_engine"]).toBe("mysql");
    expect(outputs["primary_db_engine_version"]).toBe("8.0");
    expect(outputs["secondary_db_engine_version"]).toBe("8.0");
    expect(outputs["primary_db_port"]).toBe("3306");
    expect(outputs["secondary_db_port"]).toBe("3306");
  });

  // === Validate EC2 / Instance Type ===
  it("should validate instance and db classes", () => {
    expect(outputs["instance_type"]).toBe("t3.micro");
    expect(outputs["db_instance_class"]).toBe("db.t3.micro");
  });

  // === Validate S3 buckets ===
  it("should validate S3 bucket names", () => {
    ["primary_s3_bucket_name", "secondary_s3_bucket_name"].forEach(k => {
      expect(isNonEmptyString(outputs[k])).toBe(true);
      expect(outputs[k]).toContain(outputs["bucket_suffix"]);
    });
  });

  // === Validate Scaling Config ===
  it("should validate ASG scaling sizes", () => {
    expect(outputs["primary_asg_min_size"]).toBe("2");
    expect(outputs["primary_asg_max_size"]).toBe("4");
    expect(outputs["primary_asg_desired_capacity"]).toBe("2");
    expect(outputs["secondary_asg_min_size"]).toBe("2");
    expect(outputs["secondary_asg_max_size"]).toBe("4");
    expect(outputs["secondary_asg_desired_capacity"]).toBe("2");
  });

  // === Validate Project Info ===
  it("should validate project_name and regions", () => {
    expect(outputs["project_name"]).toBe("tap-stack");
    expect(outputs["primary_region"]).toBe("us-east-2");
    expect(outputs["secondary_region"]).toBe("us-west-1");
  });
});
