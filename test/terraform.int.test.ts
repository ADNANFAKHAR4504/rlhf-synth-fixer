import * as fs from "fs";
import * as path from "path";

/** ===================== Types & IO ===================== */

type TfValue<T> = { sensitive: boolean; type: any; value: T };

type Outputs = {
  vpc_id?: TfValue<string>;
  public_subnet_ids?: TfValue<string[]>;
  private_subnet_ids?: TfValue<string[]>;
  alb_dns_name?: TfValue<string>;
  alb_zone_id?: TfValue<string>;
  rds_endpoint?: TfValue<string>;
  rds_port?: TfValue<string>;
  asg_name?: TfValue<string>;
  cloudwatch_dashboard_url?: TfValue<string>;
  nat_gateway_id?: TfValue<string>;
  environment_info?: TfValue<{
    environment: string;
    region: string;
    project: string;
    is_production: boolean;
    features: {
      nat_gateway: boolean;
      detailed_monitoring: boolean;
      bucket_versioning: boolean;
    };
  }>;
};

function loadOutputs() {
  const p = path.resolve(process.cwd(), "cfn-outputs/all-outputs.json");
  if (!fs.existsSync(p)) throw new Error(`Outputs file not found at ${p}`);
  const raw = JSON.parse(fs.readFileSync(p, "utf8")) as Outputs;

  const missing: string[] = [];
  const req = <K extends keyof Outputs>(k: K) => {
    const v = raw[k]?.value as any;
    if (v === undefined || v === null) missing.push(String(k));
    return v;
  };

  const o = {
    vpcId: req("vpc_id") as string,
    publicSubnets: req("public_subnet_ids") as string[],
    privateSubnets: req("private_subnet_ids") as string[],
    albDnsName: req("alb_dns_name") as string,
    albZoneId: req("alb_zone_id") as string,
    rdsEndpoint: req("rds_endpoint") as string,
    rdsPort: req("rds_port") as string,
    asgName: req("asg_name") as string,
    cloudwatchDashboardUrl: req("cloudwatch_dashboard_url") as string,
    natGatewayId: (raw.nat_gateway_id?.value ?? "") as string,
    environmentInfo: req("environment_info") as {
      environment: string;
      region: string;
      project: string;
      is_production: boolean;
      features: {
        nat_gateway: boolean;
        detailed_monitoring: boolean;
        bucket_versioning: boolean;
      };
    },
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

  test("Public subnet IDs are present and have valid format", () => {
    expect(OUT.publicSubnets).toBeDefined();
    expect(Array.isArray(OUT.publicSubnets)).toBe(true);
    expect(OUT.publicSubnets.length).toBe(2);
    OUT.publicSubnets.forEach(subnetId => {
      expect(subnetId).toMatch(/^subnet-[a-f0-9]+$/);
    });
  });

  test("Private subnet IDs are present and have valid format", () => {
    expect(OUT.privateSubnets).toBeDefined();
    expect(Array.isArray(OUT.privateSubnets)).toBe(true);
    expect(OUT.privateSubnets.length).toBe(2);
    OUT.privateSubnets.forEach(subnetId => {
      expect(subnetId).toMatch(/^subnet-[a-f0-9]+$/);
    });
  });

  test("ALB DNS name is present and has valid format", () => {
    expect(OUT.albDnsName).toBeDefined();
    expect(typeof OUT.albDnsName).toBe("string");
    expect(OUT.albDnsName).toMatch(/^.*\.elb\.amazonaws\.com$/);
  });

  test("ALB Zone ID is present and has valid format", () => {
    expect(OUT.albZoneId).toBeDefined();
    expect(typeof OUT.albZoneId).toBe("string");
    expect(OUT.albZoneId).toMatch(/^[A-Z0-9]+$/);
  });

  test("RDS endpoint is present and has valid format", () => {
    expect(OUT.rdsEndpoint).toBeDefined();
    expect(typeof OUT.rdsEndpoint).toBe("string");
    expect(OUT.rdsEndpoint).toMatch(/^.*\.rds\.amazonaws\.com/);
  });

  test("RDS port is present and is a number", () => {
    expect(OUT.rdsPort).toBeDefined();
    // Convert to string if it's a number (some JSON parsers might convert "5432" to 5432)
    const rdsPortStr = String(OUT.rdsPort);
    expect(typeof rdsPortStr).toBe("string");
    expect(parseInt(rdsPortStr)).toBe(5432);
  });

  test("Auto Scaling Group name is present", () => {
    expect(OUT.asgName).toBeDefined();
    expect(typeof OUT.asgName).toBe("string");
    expect(OUT.asgName.length).toBeGreaterThan(0);
  });

  test("CloudWatch dashboard URL is present and has valid format", () => {
    expect(OUT.cloudwatchDashboardUrl).toBeDefined();
    expect(typeof OUT.cloudwatchDashboardUrl).toBe("string");
    expect(OUT.cloudwatchDashboardUrl).toMatch(/^https:\/\/.*\.console\.aws\.amazon\.com\/cloudwatch/);
  });

  test("Environment info is present and has correct structure", () => {
    expect(OUT.environmentInfo).toBeDefined();
    expect(OUT.environmentInfo.environment).toBeDefined();
    expect(OUT.environmentInfo.region).toBeDefined();
    expect(OUT.environmentInfo.project).toBeDefined();
    expect(typeof OUT.environmentInfo.is_production).toBe("boolean");
    expect(OUT.environmentInfo.features).toBeDefined();
    expect(typeof OUT.environmentInfo.features.nat_gateway).toBe("boolean");
    expect(typeof OUT.environmentInfo.features.detailed_monitoring).toBe("boolean");
    expect(typeof OUT.environmentInfo.features.bucket_versioning).toBe("boolean");
  });

  test("NAT Gateway ID is present (may be empty for test environment)", () => {
    expect(OUT.natGatewayId).toBeDefined();
    expect(typeof OUT.natGatewayId).toBe("string");
    // NAT Gateway ID may be empty in test environment
    if (OUT.natGatewayId.length > 0) {
      expect(OUT.natGatewayId).toMatch(/^nat-[a-f0-9]+$/);
    }
  });
});

/** ===================== Environment-Specific Validations ===================== */
describe("Environment-specific validations", () => {
  test("Environment configuration is consistent", () => {
    const env = OUT.environmentInfo.environment;
    const isProduction = OUT.environmentInfo.is_production;
    
    expect(["test", "production"]).toContain(env);
    expect(isProduction).toBe(env === "production");
  });

  test("Feature flags are consistent with environment", () => {
    const isProduction = OUT.environmentInfo.is_production;
    const features = OUT.environmentInfo.features;
    
    if (isProduction) {
      expect(features.nat_gateway).toBe(true);
      expect(features.detailed_monitoring).toBe(true);
      expect(features.bucket_versioning).toBe(true);
    } else {
      expect(features.nat_gateway).toBe(false);
      expect(features.detailed_monitoring).toBe(false);
      expect(features.bucket_versioning).toBe(false);
    }
  });

  test("NAT Gateway presence matches environment", () => {
    const isProduction = OUT.environmentInfo.is_production;
    const hasNatGateway = OUT.natGatewayId.length > 0;
    
    expect(hasNatGateway).toBe(isProduction);
  });
});

/** ===================== Naming Convention Validation ===================== */
describe("Naming convention validation", () => {
  test("Resource names follow expected pattern", () => {
    const project = OUT.environmentInfo.project;
    const environment = OUT.environmentInfo.environment;
    // Check if names include the environment suffix (should contain pr or dev suffix)
    const prefixPattern = `${project}-${environment}-`;
    
    expect(OUT.asgName).toContain(prefixPattern);
    expect(OUT.albDnsName).toContain(prefixPattern);
    expect(OUT.rdsEndpoint).toContain(prefixPattern);
  });
});

/** ===================== Edge Cases & Sanity ===================== */
describe("Edge cases & sanity checks", () => {
  test("No sensitive data in outputs", () => {
    const outputsString = JSON.stringify(OUT);
    expect(outputsString).not.toMatch(/password/i);
    expect(outputsString).not.toMatch(/secret/i);
    expect(outputsString).not.toMatch(/key/i);
  });

  test("All required fields are present and non-empty", () => {
    const requiredFields = [
      'vpcId', 'publicSubnets', 'privateSubnets', 'albDnsName', 
      'albZoneId', 'rdsEndpoint', 'rdsPort', 'asgName', 
      'cloudwatchDashboardUrl', 'environmentInfo'
    ];
    
    requiredFields.forEach(field => {
      const value = (OUT as any)[field];
      expect(value).toBeDefined();
      expect(value).not.toBeNull();
      if (typeof value === 'string') {
        expect(value.length).toBeGreaterThan(0);
      } else if (Array.isArray(value)) {
        expect(value.length).toBeGreaterThan(0);
      }
    });
  });
}); 