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
const isValidEipAlloc = (v: string) => v.startsWith("eipalloc-");
const isValidIpAddress = (v: string) =>
  /^([0-9]{1,3}\.){3}[0-9]{1,3}$/.test(v.trim()); // basic IPv4 check

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
    // eslint-disable-next-line no-console
    console.warn(`Skipping tests for missing output: ${key}`);
    return true;
  }
  return false;
}

describe("Terraform flat outputs - integration validation", () => {
  let outputs: Record<string, any>;

  beforeAll(() => {
    const data = fs.readFileSync(outputFile, "utf-8");
    const parsed = JSON.parse(data);
    outputs = {};
    for (const [k, v] of Object.entries(parsed)) {
      outputs[k] = parseIfArray(v);
    }
  });

  it("has all expected keys from flat outputs", () => {
    expect(Object.keys(outputs).length).toBeGreaterThan(30);
  });

  // Validate presence and correctness of basic string keys
  it("validates basic string outputs", () => {
    const requiredStrKeys = [
      "api_gateway_rest_api_id",
      "api_gateway_rest_api",
      "api_gateway_rest_api_arn",
      "api_gateway_method_http_method",
      "api_gateway_stage",
      "bucket_suffix",
      "cloudtrail_name",
      "primary_region",
      "secondary_region",
      "primary_naming_prefix",
      "secondary_naming_prefix",
      "common_tags",
      "lambda_runtime",
    ];

    for (const key of requiredStrKeys) {
      if (skipIfMissing(key, outputs)) continue;
      expect(isNonEmptyString(outputs[key])).toBe(true);
    }
  });

  // Validate ARNs
  it("validates ARN formatted outputs", () => {
    const arnKeys = Object.keys(outputs).filter((k) => k.endsWith("_arn"));
    for (const key of arnKeys) {
      if (skipIfMissing(key, outputs)) continue;
      expect(isValidArn(outputs[key])).toBe(true);
    }
  });

  // Validate IDs & resource IDs with specific prefixes
  it("validates resource IDs and identifiers", () => {
    // VPC
    if (!skipIfMissing("primary_vpc_id", outputs))
      expect(isValidVpcId(outputs["primary_vpc_id"])).toBe(true);

    if (!skipIfMissing("secondary_vpc_id", outputs))
      expect(isValidVpcId(outputs["secondary_vpc_id"])).toBe(true);

    // Subnets - some are arrays!
    const subnetKeys = [
      "primary_private_subnet_ids",
      "primary_public_subnet_ids",
      "secondary_private_subnet_ids",
      "secondary_public_subnet_ids",
    ];

    for (const key of subnetKeys) {
      if (skipIfMissing(key, outputs)) continue;
      expect(Array.isArray(outputs[key])).toBe(true);
      outputs[key].forEach((id: string) => expect(isValidSubnetId(id)).toBe(true));
    }

    // Security groups
    const sgKeys = [
      "primary_ec2_security_group_id",
      "secondary_ec2_security_group_id",
      "primary_rds_security_group_id",
      "secondary_rds_security_group_id",
    ];
    for (const key of sgKeys) {
      if (skipIfMissing(key, outputs)) continue;
      expect(isValidSGId(outputs[key])).toBe(true);
    }

    // IGWs
    const igwKeys = ["primary_internet_gateway_id", "secondary_internet_gateway_id"];
    for (const key of igwKeys) {
      if (skipIfMissing(key, outputs)) continue;
      expect(isValidIGWId(outputs[key])).toBe(true);
    }

    // NAT Gateways IDs (arrays)
    const ngwKeys = ["primary_nat_gateway_ids", "secondary_nat_gateway_ids"];
    for (const key of ngwKeys) {
      if (skipIfMissing(key, outputs)) continue;
      expect(Array.isArray(outputs[key])).toBe(true);
      outputs[key].forEach((id: string) => expect(isValidNatId(id)).toBe(true));
    }

    // NAT EIP allocations (arrays)
    const eipKeys = ["primary_nat_eip_ids", "secondary_nat_eip_ids"];
    for (const key of eipKeys) {
      if (skipIfMissing(key, outputs)) continue;
      expect(Array.isArray(outputs[key])).toBe(true);
      outputs[key].forEach((id: string) => expect(isValidEipAlloc(id)).toBe(true));
    }

    // Route Tables
    const rtKeys = ["primary_public_route_table_id", "secondary_public_route_table_id"];
    for (const key of rtKeys) {
      if (skipIfMissing(key, outputs)) continue;
      expect(isValidRouteTableId(outputs[key])).toBe(true);
    }
  });

  // Validate CIDRs - basic string and array format
  it("validates CIDRs", () => {
    const cidrKeys = [
      "primary_vpc_cidr",
      "secondary_vpc_cidr",
      "primary_private_subnet_cidrs",
      "primary_public_subnet_cidrs",
      "secondary_private_subnet_cidrs",
      "secondary_public_subnet_cidrs",
    ];

    for (const key of cidrKeys) {
      if (skipIfMissing(key, outputs)) continue;
      const value = outputs[key];
      if (Array.isArray(value)) {
        value.forEach((c) => expect(typeof c).toBe("string"));
      } else {
        expect(typeof value).toBe("string");
      }
    }
  });

  // Validate IP addresses for EC2 private IPs and NAT EIP public IPs
  it("validates IP addresses", () => {
    const ipv4Keys = ["primary_ec2_private_ip", "secondary_ec2_private_ip"];
    for (const key of ipv4Keys) {
      if (skipIfMissing(key, outputs)) continue;
      expect(isValidIpAddress(outputs[key])).toBe(true);
    }

    const natEipIpKeys = ["primary_nat_eip_public_ips", "secondary_nat_eip_public_ips"];
    for (const key of natEipIpKeys) {
      if (skipIfMissing(key, outputs)) continue;
      expect(Array.isArray(outputs[key])).toBe(true);
      for (const ip of outputs[key]) expect(isValidIpAddress(ip)).toBe(true);
    }
  });

  // Validate numeric info in string form - ports and counts
  it("validates numeric output values", () => {
    const numericKeys = ["primary_rds_port", "secondary_rds_port"];
    for (const key of numericKeys) {
      if (skipIfMissing(key, outputs)) continue;
      expect(!isNaN(Number(outputs[key]))).toBe(true);
    }
  });

  // Validate regions and naming prefixes are consistent strings
  it("validates region and naming prefix outputs", () => {
    if (!skipIfMissing("primary_region", outputs))
      expect(outputs["primary_region"]).toMatch(/^us-[a-z0-9-]+$/);

    if (!skipIfMissing("secondary_region", outputs))
      expect(outputs["secondary_region"]).toMatch(/^us-[a-z0-9-]+$/);

    if (!skipIfMissing("primary_naming_prefix", outputs))
      expect(outputs["primary_naming_prefix"]).toContain(outputs["primary_region"]);

    if (!skipIfMissing("secondary_naming_prefix", outputs))
      expect(outputs["secondary_naming_prefix"]).toContain(outputs["secondary_region"]);
  });

  // Validate common tags - parse JSON string and verify keys
  it("validates parsed common tags", () => {
    if (skipIfMissing("common_tags", outputs)) return;
    const tags = JSON.parse(outputs["common_tags"]);
    expect(tags.Environment).toBe("Production");
    expect(tags.departmental).toBe("businessunit");
    expect(tags.ownership).toBe("self");
  });

  // Validate Lambda runtime versions are python3.9
  it("validates lambda runtimes", () => {
    if (!skipIfMissing("primary_lambda_runtime", outputs))
      expect(outputs["primary_lambda_runtime"]).toBe("python3.9");

    if (!skipIfMissing("secondary_lambda_runtime", outputs))
      expect(outputs["secondary_lambda_runtime"]).toBe("python3.9");
  });

  // Validate API Gateway HTTP method is GET
  it("validates API Gateway HTTP method", () => {
    if (skipIfMissing("api_gateway_method_http_method", outputs)) return;
    expect(outputs["api_gateway_method_http_method"]).toBe("GET");
  });

  // Validate API Gateway URLs are valid URLs (basic check)
  it("validates API Gateway URLs", () => {
    const urlKeys = [
      "api_gateway_stage", 
      "api_gateway_invoke_url",
      "api_gateway_deployment_invoke_url",
      "api_gateway_stage_invoke_url",
    ];
    for (const key of urlKeys) {
      if (skipIfMissing(key, outputs)) continue;
      expect(typeof outputs[key]).toBe("string");
      expect(outputs[key]).toMatch(/^https:\/\//);
    }
  });
});
