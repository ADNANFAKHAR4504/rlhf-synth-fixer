import fs from "fs";
import path from "path";

const allOutputsPath = path.resolve(process.cwd(), "cfn-outputs/all-outputs.json");

function isValidIp(ip: string) {
  return /^(\d{1,3}\.){3}\d{1,3}$/.test(ip);
}

describe("Terraform E2E Integration: Live Outputs", () => {
  let outputs: Record<string, any>;

  beforeAll(() => {
    expect(fs.existsSync(allOutputsPath)).toBe(true);
    outputs = JSON.parse(fs.readFileSync(allOutputsPath, "utf8"));
  });

  test("VPC IDs are present and non-empty", () => {
    expect(outputs.vpc1_id).toMatch(/^vpc-/);
    expect(outputs.vpc2_id).toMatch(/^vpc-/);
  });

  test("EC2 instance IPs are present and valid", () => {
    expect(isValidIp(outputs.vpc1_ec2_private_ip)).toBe(true);
    expect(isValidIp(outputs.vpc2_ec2_private_ip)).toBe(true);
    expect(isValidIp(outputs.vpc1_ec2_public_ip)).toBe(true);
    expect(isValidIp(outputs.vpc2_ec2_public_ip)).toBe(true);
  });

  test("NAT Gateway IDs are present", () => {
    expect(outputs.vpc1_nat_gateway_id).toMatch(/^nat-/);
    expect(outputs.vpc2_nat_gateway_id).toMatch(/^nat-/);
  });

  test("RDS endpoint is present and looks valid", () => {
    expect(outputs.rds_endpoint).toMatch(/\.rds\.amazonaws\.com$/);
  });

  test("Key pair name is present and non-empty", () => {
    expect(typeof outputs.key_pair_name).toBe("string");
    expect(outputs.key_pair_name.length).toBeGreaterThan(0);
  });

  test("Key pair guidance is present", () => {
    expect(typeof outputs.key_pair_guidance).toBe("string");
    expect(outputs.key_pair_guidance.length).toBeGreaterThan(0);
  });

  test("Route 53 records are present if enabled", () => {
    if (outputs.route53_records) {
      expect(typeof outputs.route53_records).toBe("object");
      Object.values(outputs.route53_records).forEach((fqdn: any) => {
        expect(typeof fqdn).toBe("string");
        expect(fqdn.length).toBeGreaterThan(0);
      });
    }
  });

  test("VPC peering connection output exists (may be empty)", () => {
    expect(outputs).toHaveProperty("vpc_peering_connection_id");
  });
});

describe('Turn Around Prompt API Integration Tests', () => {
  describe('Write Integration TESTS', () => {
    test('Dont forget!', async () => {
      expect(false).toBe(true);
    });
  });
});
