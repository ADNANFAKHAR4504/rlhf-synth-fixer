import * as fs from "fs";
import * as path from "path";

interface IngressRule {
  protocol: string;
  from_port: number;
  to_port: number;
  cidr_v4?: string;
  cidr_v6?: string;
}

describe("Terraform Security Group Integration Test (Offline JSON)", () => {
  const outputsPath = path.resolve(process.cwd(), "cfn-outputs/all-outputs.json");
  let outputs: any;

  beforeAll(() => {
    if (!fs.existsSync(outputsPath)) {
      throw new Error(`Outputs JSON not found at: ${outputsPath}`);
    }
    outputs = JSON.parse(fs.readFileSync(outputsPath, "utf-8"));
  });

  it("should contain expected AWS Security Group output", () => {
    expect(outputs).toBeDefined();
    expect(outputs.SecurityGroupId).toBeDefined();
    expect(typeof outputs.SecurityGroupId).toBe("string");
    expect(outputs.SecurityGroupId).toMatch(/^sg-[0-9a-f]{8,}$/);
  });

  it("should allow only HTTP and HTTPS ingress from allowed CIDRs", () => {
    // Assuming `outputs.SecurityGroupRules` is your exported ingress array
    const ingressRules: IngressRule[] = outputs.SecurityGroupRules || [];
    expect(Array.isArray(ingressRules)).toBe(true);
    expect(ingressRules.length).toBeGreaterThan(0);

    ingressRules.forEach((rule) => {
      expect(["tcp", "6"]).toContain(rule.protocol);
      expect([80, 443]).toContain(rule.from_port);
      expect([80, 443]).toContain(rule.to_port);
      expect(rule.cidr_v4 || rule.cidr_v6).toBeDefined();

      if (rule.cidr_v4) {
        expect(rule.cidr_v4).toMatch(/^(\d{1,3}\.){3}\d{1,3}\/\d{1,2}$/);
      }
      if (rule.cidr_v6) {
        expect(rule.cidr_v6).toMatch(/^[0-9a-f:]+\/\d{1,3}$/i);
      }
    });
  });

  it("should meet tagging and naming standards", () => {
    // Example: enforce AWS tag standards
    const tags = outputs.Tags || {};
    expect(tags).toHaveProperty("Environment");
    expect(tags.Environment).toMatch(/^(dev|staging|prod)$/);
    expect(tags).toHaveProperty("Owner");
    expect(typeof tags.Owner).toBe("string");
  });

  it("should have valid VPC and subnet outputs", () => {
    expect(outputs.VpcId).toMatch(/^vpc-[0-9a-f]{8,}$/);
    expect(outputs.SubnetIds).toBeInstanceOf(Array);
    outputs.SubnetIds.forEach((id: string) =>
      expect(id).toMatch(/^subnet-[0-9a-f]{8,}$/)
    );
  });

  it("should handle edge cases (empty or missing values)", () => {
    // Defensive check — ensures the stack does not produce empty strings for critical outputs
    const criticalKeys = ["VpcId", "SubnetIds", "SecurityGroupId"];
    criticalKeys.forEach((key) => {
      expect(outputs[key]).toBeTruthy();
    });
  });
});
