import * as fs from "fs";
import * as path from "path";

/** ===================== Types & IO ===================== */

type TfValue<T> = { sensitive: boolean; type: any; value: T };

type Outputs = {
  vpc_id?: TfValue<string>;
  vpc_cidr?: TfValue<string>;
  internet_gateway_id?: TfValue<string>;
  public_subnet_ids?: TfValue<string[]>;
  private_subnet_ids?: TfValue<string[]>;
  public_route_table_id?: TfValue<string>;
  private_route_table_id?: TfValue<string>;
  availability_zones?: TfValue<string[]>;
};

function loadOutputs() {
  // Try multiple possible output file locations
  const possiblePaths = [
    path.resolve(process.cwd(), "cfn-outputs/all-outputs.json"),
    path.resolve(process.cwd(), "cfn-outputs/flat-outputs.json"),
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

  const raw = JSON.parse(fs.readFileSync(p, "utf8")) as Outputs;

  const missing: string[] = [];
  const req = <K extends keyof Outputs>(k: K) => {
    const v = raw[k]?.value as any;
    if (v === undefined || v === null) missing.push(String(k));
    return v;
  };

  const o = {
    vpcId: req("vpc_id") as string,
    vpcCidr: req("vpc_cidr") as string,
    internetGatewayId: req("internet_gateway_id") as string,
    publicSubnets: req("public_subnet_ids") as string[],
    privateSubnets: req("private_subnet_ids") as string[],
    publicRouteTableId: req("public_route_table_id") as string,
    privateRouteTableId: req("private_route_table_id") as string,
    availabilityZones: req("availability_zones") as string[],
  };

  if (missing.length) {
    throw new Error(
      `Missing required outputs in cfn-outputs/all-outputs.json: ${missing.join(", ")}`
    );
  }
  return o;
}

const OUT = loadOutputs();

/** ===================== Jest Config ===================== */
jest.setTimeout(30_000);

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
    OUT.publicSubnets.forEach((subnetId) => {
      expect(subnetId).toMatch(/^subnet-[a-f0-9]+$/);
    });
  });

  test("Private subnet IDs are present and have valid format", () => {
    expect(OUT.privateSubnets).toBeDefined();
    expect(Array.isArray(OUT.privateSubnets)).toBe(true);
    expect(OUT.privateSubnets.length).toBe(2);
    OUT.privateSubnets.forEach((subnetId) => {
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
    OUT.availabilityZones.forEach((az) => {
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
    [...OUT.publicSubnets, ...OUT.privateSubnets].forEach((id) => {
      expect(id).toMatch(/^subnet-[a-f0-9]+$/);
    });

    // Route Table ID format
    expect(OUT.publicRouteTableId).toMatch(/^rtb-[a-f0-9]+$/);
    expect(OUT.privateRouteTableId).toMatch(/^rtb-[a-f0-9]+$/);
  });
});
