/**
 * Terraform Infrastructure Integration Tests
 *
 * These tests validate infrastructure outputs from Terraform deployment.
 */

import * as fs from "fs";
import * as path from "path";

/** ===================== Types ===================== */

// Terraform nested format: {"key": {"value": "actual_value", "type": "string", "sensitive": false}}
type TfValue<T> = { sensitive: boolean; type: any; value: T };

// Flat format: {"key": "actual_value"} or {"key": ["val1", "val2"]}
type FlatOutputs = {
  vpc_id?: string;
  vpc_cidr?: string;
  internet_gateway_id?: string;
  public_subnet_ids?: string[];
  private_subnet_ids?: string[];
  public_route_table_id?: string;
  private_route_table_id?: string;
  availability_zones?: string[];
};

// Global outputs variable
let OUT: any = {};

function loadOutputs() {
  // Try multiple possible output file locations
  const possiblePaths = [
    path.resolve(process.cwd(), "cdk-outputs/flat-outputs.json"),
    path.resolve(process.cwd(), "cfn-outputs/flat-outputs.json"),
    path.resolve(process.cwd(), "cfn-outputs/all-outputs.json"),
  ];

  let p: string | undefined;
  for (const candidate of possiblePaths) {
    if (fs.existsSync(candidate)) {
      p = candidate;
      break;
    }
  }

  if (!p) {
    throw new Error(`Outputs file not found. Tried: ${possiblePaths.join(", ")}`);
  }

  console.log(`Loading outputs from: ${p}`);

  try {
    const raw = JSON.parse(fs.readFileSync(p, "utf8"));

    // Helper to extract value - handles both flat and nested (Terraform) formats
    const getValue = <T>(key: string): T | undefined => {
      const val = raw[key];
      if (val === undefined || val === null) {
        return undefined;
      }
      // If it's an object with 'value' property (Terraform format), unwrap it
      if (val && typeof val === "object" && "value" in val) {
        return val.value as T;
      }
      // Otherwise use the value directly (flat format)
      return val as T;
    };

    // Extract all outputs
    const vpc_id = getValue<string>("vpc_id");
    const vpc_cidr = getValue<string>("vpc_cidr");
    const internet_gateway_id = getValue<string>("internet_gateway_id");
    const public_subnet_ids = getValue<string[]>("public_subnet_ids");
    const private_subnet_ids = getValue<string[]>("private_subnet_ids");
    const public_route_table_id = getValue<string>("public_route_table_id");
    const private_route_table_id = getValue<string>("private_route_table_id");
    const availability_zones = getValue<string[]>("availability_zones");

    // Validate required outputs
    const missing: string[] = [];
    if (!vpc_id) missing.push("vpc_id");
    if (!vpc_cidr) missing.push("vpc_cidr");
    if (!internet_gateway_id) missing.push("internet_gateway_id");
    if (!public_subnet_ids) missing.push("public_subnet_ids");
    if (!private_subnet_ids) missing.push("private_subnet_ids");
    if (!public_route_table_id) missing.push("public_route_table_id");
    if (!private_route_table_id) missing.push("private_route_table_id");
    if (!availability_zones) missing.push("availability_zones");

    if (missing.length > 0) {
      throw new Error(`Missing required outputs: ${missing.join(", ")}`);
    }

    return {
      vpcId: vpc_id,
      vpcCidr: vpc_cidr,
      internetGatewayId: internet_gateway_id,
      publicSubnets: public_subnet_ids,
      privateSubnets: private_subnet_ids,
      publicRouteTableId: public_route_table_id,
      privateRouteTableId: private_route_table_id,
      availabilityZones: availability_zones,
    };
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Error reading outputs file: ${error.message}`);
    }
    throw new Error("Error reading outputs file");
  }
}

/** ===================== Jest Config ===================== */
jest.setTimeout(30_000);

/** ===================== Test Setup ===================== */
beforeAll(() => {
  OUT = loadOutputs();
});

/** ===================== Outputs File Validation ===================== */
describe("Outputs file validation", () => {
  test("Outputs file exists and has valid JSON structure", () => {
    expect(OUT).toBeDefined();
    expect(typeof OUT).toBe("object");
  });

  test("VPC ID is present and has valid format", () => {
    expect(OUT.vpcId).toBeDefined();
    expect(typeof OUT.vpcId).toBe("string");
    expect(OUT.vpcId).toMatch(/^vpc-[a-f0-9]+$/);
  });

  test("VPC CIDR is present and has valid CIDR format", () => {
    expect(OUT.vpcCidr).toBeDefined();
    expect(typeof OUT.vpcCidr).toBe("string");
    expect(OUT.vpcCidr).toMatch(/^10\.0\.0\.0\/16$/);
  });

  test("Internet Gateway ID is present and has valid format", () => {
    expect(OUT.internetGatewayId).toBeDefined();
    expect(typeof OUT.internetGatewayId).toBe("string");
    expect(OUT.internetGatewayId).toMatch(/^igw-[a-f0-9]+$/);
  });
});

/** ===================== Subnet Validation ===================== */
describe("Subnet validation", () => {
  test("Public subnet IDs are present and have valid format", () => {
    expect(OUT.publicSubnets).toBeDefined();
    expect(Array.isArray(OUT.publicSubnets)).toBe(true);
    expect(OUT.publicSubnets.length).toBe(2);
    OUT.publicSubnets.forEach((subnetId: string) => {
      expect(subnetId).toMatch(/^subnet-[a-f0-9]+$/);
    });
  });

  test("Private subnet IDs are present and have valid format", () => {
    expect(OUT.privateSubnets).toBeDefined();
    expect(Array.isArray(OUT.privateSubnets)).toBe(true);
    expect(OUT.privateSubnets.length).toBe(2);
    OUT.privateSubnets.forEach((subnetId: string) => {
      expect(subnetId).toMatch(/^subnet-[a-f0-9]+$/);
    });
  });

  test("Public and private subnets are different", () => {
    const allSubnets = [...OUT.publicSubnets, ...OUT.privateSubnets];
    const uniqueSubnets = new Set(allSubnets);
    expect(uniqueSubnets.size).toBe(4);
  });

  test("Subnets are distributed across availability zones", () => {
    expect(OUT.availabilityZones).toBeDefined();
    expect(Array.isArray(OUT.availabilityZones)).toBe(true);
    expect(OUT.availabilityZones.length).toBe(2);
  });
});

/** ===================== Route Table Validation ===================== */
describe("Route table validation", () => {
  test("Public route table ID is present and has valid format", () => {
    expect(OUT.publicRouteTableId).toBeDefined();
    expect(typeof OUT.publicRouteTableId).toBe("string");
    expect(OUT.publicRouteTableId).toMatch(/^rtb-[a-f0-9]+$/);
  });

  test("Private route table ID is present and has valid format", () => {
    expect(OUT.privateRouteTableId).toBeDefined();
    expect(typeof OUT.privateRouteTableId).toBe("string");
    expect(OUT.privateRouteTableId).toMatch(/^rtb-[a-f0-9]+$/);
  });

  test("Public and private route tables are different", () => {
    expect(OUT.publicRouteTableId).not.toBe(OUT.privateRouteTableId);
  });
});

/** ===================== Availability Zones Validation ===================== */
describe("Availability zones validation", () => {
  test("Availability zones are in us-east-1 region", () => {
    OUT.availabilityZones.forEach((az: string) => {
      expect(az).toMatch(/^us-east-1[a-z]$/);
    });
  });

  test("Two different availability zones are used", () => {
    const uniqueAzs = new Set(OUT.availabilityZones);
    expect(uniqueAzs.size).toBe(2);
  });
});

/** ===================== Network Architecture Validation ===================== */
describe("Network architecture validation", () => {
  test("VPC has correct CIDR block", () => {
    expect(OUT.vpcCidr).toBe("10.0.0.0/16");
  });

  test("Total of 4 subnets exist (2 public + 2 private)", () => {
    const totalSubnets = OUT.publicSubnets.length + OUT.privateSubnets.length;
    expect(totalSubnets).toBe(4);
  });

  test("Internet Gateway is attached (ID exists)", () => {
    expect(OUT.internetGatewayId).toBeTruthy();
    expect(OUT.internetGatewayId.length).toBeGreaterThan(0);
  });
});

/** ===================== Edge Cases & Sanity ===================== */
describe("Edge cases & sanity checks", () => {
  test("No sensitive data in outputs", () => {
    const outputsString = JSON.stringify(OUT);
    expect(outputsString).not.toMatch(/password/i);
    expect(outputsString).not.toMatch(/secret/i);
  });

  test("All required fields are present and non-empty", () => {
    const requiredFields = [
      "vpcId",
      "vpcCidr",
      "internetGatewayId",
      "publicSubnets",
      "privateSubnets",
      "publicRouteTableId",
      "privateRouteTableId",
      "availabilityZones",
    ];

    requiredFields.forEach((field) => {
      const value = (OUT as any)[field];
      expect(value).toBeDefined();
      expect(value).not.toBeNull();
      if (typeof value === "string") {
        expect(value.length).toBeGreaterThan(0);
      } else if (Array.isArray(value)) {
        expect(value.length).toBeGreaterThan(0);
      }
    });
  });

  test("All resource IDs have valid AWS format", () => {
    // VPC ID format
    expect(OUT.vpcId).toMatch(/^vpc-[a-f0-9]+$/);

    // Internet Gateway ID format
    expect(OUT.internetGatewayId).toMatch(/^igw-[a-f0-9]+$/);

    // Subnet ID format
    [...OUT.publicSubnets, ...OUT.privateSubnets].forEach((id: string) => {
      expect(id).toMatch(/^subnet-[a-f0-9]+$/);
    });

    // Route Table ID format
    expect(OUT.publicRouteTableId).toMatch(/^rtb-[a-f0-9]+$/);
    expect(OUT.privateRouteTableId).toMatch(/^rtb-[a-f0-9]+$/);
  });
});
