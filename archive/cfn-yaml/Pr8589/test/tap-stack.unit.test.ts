import * as fs from "fs";
import * as path from "path";

type OutputEntry = {
  Description?: string;
  Value: any; // can be string or CFN intrinsic object
  Export?: { Name: string };
};

type StackTemplate = {
  AWSTemplateFormatVersion?: string;
  Resources?: Record<string, unknown>;
  Outputs?: Record<string, OutputEntry>;
};

function loadOutputs(): Record<string, OutputEntry> {
  const p = path.resolve(__dirname, "../lib/TapStack.json");
  if (!fs.existsSync(p)) throw new Error(`TapStack.json not found at ${p}`);

  const raw = JSON.parse(fs.readFileSync(p, "utf8")) as StackTemplate;
  if (!raw.Outputs) throw new Error("TapStack.json missing Outputs section");

  return raw.Outputs;
}

function isIntrinsic(val: unknown): boolean {
  return typeof val === "object" && val !== null;
}

describe("TapStack.json unit tests", () => {
  const outputs = loadOutputs();

  it("should contain outputs", () => {
    expect(Object.keys(outputs).length).toBeGreaterThan(0);
  });

  it("every output should have a Value", () => {
    Object.values(outputs).forEach(out => {
      expect(out.Value).toBeDefined();
    });
  });

  it("Descriptions should exist and be non-empty strings", () => {
    Object.values(outputs).forEach(out => {
      expect(out.Description).toBeDefined();
      expect(typeof out.Description).toBe("string");
      expect(out.Description!.trim()).not.toEqual("");
    });
  });

  it("Output keys should be unique", () => {
    const keys = Object.keys(outputs);
    const unique = new Set(keys);
    expect(unique.size).toEqual(keys.length);
  });

  it("VPCId should look like a VPC ID when concrete", () => {
    const vpc = outputs["VPCId"];
    if (vpc && !isIntrinsic(vpc.Value)) {
      expect(vpc.Value).toMatch(/^vpc-[0-9a-f]{8,17}$/);
    }
  });

  it("Subnet IDs (if present) should be comma-separated subnet IDs when concrete", () => {
    const priv = outputs["PrivateSubnetIds"];
    const pub = outputs["PublicSubnetIds"];
    [priv, pub].forEach(r => {
      if (r && !isIntrinsic(r.Value)) {
        r.Value.split(",").forEach((id: string) =>
          expect(id.trim()).toMatch(/^subnet-[0-9a-f]{8,17}$/)
        );
      }
    });
  });

  it("SecurityGroupIds (if present) should be valid when concrete", () => {
    const sg = outputs["SecurityGroupIds"];
    if (sg && !isIntrinsic(sg.Value)) {
      sg.Value.split(",").forEach((id: string) =>
        expect(id.trim()).toMatch(/^sg-[0-9a-f]{8,17}$/)
      );
    }
  });

  it("AlbDNSName (if present) should be a valid ELB DNS when concrete", () => {
    const alb = outputs["AlbDNSName"];
    if (alb && !isIntrinsic(alb.Value)) {
      expect(alb.Value).toMatch(/^[a-zA-Z0-9.-]+\.elb\.amazonaws\.com$/);
    }
  });

  it("BastionPublicIP (if present) should be 'none' or a valid IPv4 when concrete", () => {
    const bastion = outputs["BastionPublicIP"];
    if (bastion && !isIntrinsic(bastion.Value)) {
      const val = bastion.Value;
      if (val !== "none") {
        expect(val).toMatch(
          /^(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)(\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)){3}$/
        );
      }
    }
  });
});
