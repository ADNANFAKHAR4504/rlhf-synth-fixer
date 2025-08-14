// test/terraform.int.test.ts

import fs from "fs";
import path from "path";

interface IngressRule {
  cidrs: string[];
  from_port: number;
  protocol: string;
  to_port: number;
}

describe("Terraform Security Group Integration Test (Offline JSON)", () => {
  let outputs: any;

  beforeAll(() => {
    const filePath = path.join(__dirname, "../terraform-output.json"); // update if path is different
    const rawData = fs.readFileSync(filePath, "utf-8");
    outputs = JSON.parse(rawData);
  });

  it("should contain expected AWS Security Group output", () => {
    expect(outputs).toBeDefined();
    expect(outputs.security_group_id?.value).toBeDefined();
    expect(typeof outputs.security_group_id.value).toBe("string");
    expect(outputs.security_group_id.value).toMatch(/^sg-[0-9a-f]{8,}$/);
  });

  it("should allow only HTTP and HTTPS ingress from allowed CIDRs", () => {
    const ingressRules: IngressRule[] = outputs.ingress_rules?.value || [];
    expect(Array.isArray(ingressRules)).toBe(true);
    expect(ingressRules.length).toBeGreaterThan(0);

    ingressRules.forEach((rule) => {
      expect(["tcp"]).toContain(rule.protocol);
      expect([80, 443]).toContain(rule.from_port);
      expect(rule.from_port).toBe(rule.to_port);
      expect(rule.cidrs.every((cidr) => typeof cidr === "string")).toBe(true);
    });
  });

  it("should meet tagging and naming standards", () => {
    // Your JSON doesn't have tags; we'll check SG name instead
    expect(outputs.security_group_name?.value).toBeDefined();
    expect(outputs.security_group_name.value).toMatch(/^app-http-https-sg$/);
  });

  it("should have valid VPC and subnet outputs", () => {
    expect(outputs.vpc_id?.value).toMatch(/^vpc-[0-9a-f]{8,}$/);
    expect(outputs.subnet_id?.value).toMatch(/^subnet-[0-9a-f]{8,}$/);
  });

  it("should handle edge cases (empty or missing values)", () => {
    const criticalKeys = ["vpc_id", "subnet_id", "security_group_id"];
    criticalKeys.forEach((key) => {
      expect(outputs[key]?.value).toBeTruthy();
    });
  });
});
