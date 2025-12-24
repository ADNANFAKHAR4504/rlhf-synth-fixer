import * as fs from "fs";
import * as path from "path";

type OutputEntry = {
  Description?: string;
  Value: any;
  Export?: { Name: string };
};

type StackTemplate = {
  AWSTemplateFormatVersion?: string;
  Resources?: Record<string, any>;
  Outputs?: Record<string, OutputEntry>;
};

function loadStack(): StackTemplate {
  const p = path.resolve(__dirname, "../lib/TapStack.json");
  if (!fs.existsSync(p)) throw new Error(`TapStack.json not found at ${p}`);
  return JSON.parse(fs.readFileSync(p, "utf8")) as StackTemplate;
}

function isIntrinsic(val: unknown): boolean {
  return typeof val === "object" && val !== null;
}

describe("TapStack.json Integration Tests", () => {
  const stack = loadStack();
  const outputs = stack.Outputs ?? {};

  // ---------------- POSITIVE TESTS ----------------
  it("should have AWSTemplateFormatVersion defined", () => {
    expect(stack.AWSTemplateFormatVersion).toBeDefined();
    expect(typeof stack.AWSTemplateFormatVersion).toBe("string");
  });

  it("should contain at least one Resource", () => {
    expect(stack.Resources).toBeDefined();
    expect(Object.keys(stack.Resources!).length).toBeGreaterThan(0);
  });

  it("Outputs should exist and be non-empty", () => {
    expect(Object.keys(outputs).length).toBeGreaterThan(0);
  });

  it("Each output should have Description and Value", () => {
    Object.entries(outputs).forEach(([k, v]) => {
      expect(v.Description).toBeDefined();
      expect(typeof v.Description).toBe("string");
      expect(v.Value).toBeDefined();
    });
  });

  it("VPCId should be valid when concrete", () => {
    const vpc = outputs["VPCId"];
    if (vpc && !isIntrinsic(vpc.Value)) {
      expect(vpc.Value).toMatch(/^vpc-[0-9a-f]{8,17}$/);
    }
  });

  it("Subnets should be valid comma-separated IDs when concrete", () => {
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

  it("SecurityGroupIds should be valid when concrete", () => {
    const sg = outputs["SecurityGroupIds"];
    if (sg && !isIntrinsic(sg.Value)) {
      sg.Value.split(",").forEach((id: string) =>
        expect(id.trim()).toMatch(/^sg-[0-9a-f]{8,17}$/)
      );
    }
  });

  it("ALB DNS should look valid when concrete", () => {
    const alb = outputs["AlbDNSName"];
    if (alb && !isIntrinsic(alb.Value)) {
      expect(alb.Value).toMatch(/^[a-zA-Z0-9.-]+\.elb\.amazonaws\.com$/);
    }
  });

  it("BastionPublicIP should be 'none' or valid IPv4", () => {
    const bastion = outputs["BastionPublicIP"];
    if (bastion && !isIntrinsic(bastion.Value)) {
      if (bastion.Value !== "none") {
        expect(bastion.Value).toMatch(
          /^(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)(\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)){3}$/
        );
      }
    }
  });

  // ---------------- NEGATIVE TESTS ----------------
  it("should fail if any output has empty Description", () => {
    Object.entries(outputs).forEach(([k, v]) => {
      if (typeof v.Description === "string") {
        expect(v.Description.trim()).not.toEqual("");
      }
    });
  });

  it("should fail if any output Value is null or undefined", () => {
    Object.entries(outputs).forEach(([k, v]) => {
      expect(v.Value).not.toBeNull();
      expect(v.Value).not.toBeUndefined();
    });
  });

  it("should fail if SecurityGroupIds present but malformed", () => {
    const sg = outputs["SecurityGroupIds"];
    if (sg && !isIntrinsic(sg.Value)) {
      sg.Value.split(",").forEach((id: string) => {
        expect(id.trim().startsWith("sg-")).toBeTruthy();
      });
    }
  });

  it("should fail if any subnet output does not start with subnet-", () => {
    ["PrivateSubnetIds", "PublicSubnetIds"].forEach(key => {
      const r = outputs[key];
      if (r && !isIntrinsic(r.Value)) {
        r.Value.split(",").forEach((id: string) => {
          expect(id.startsWith("subnet-")).toBeTruthy();
        });
      }
    });
  });

  it("should fail if VPCId exists but does not start with vpc-", () => {
    const vpc = outputs["VPCId"];
    if (vpc && !isIntrinsic(vpc.Value)) {
      expect(vpc.Value.startsWith("vpc-")).toBeTruthy();
    }
  });

  it("should fail if AlbDNSName exists but not containing .elb.amazonaws.com", () => {
    const alb = outputs["AlbDNSName"];
    if (alb && !isIntrinsic(alb.Value)) {
      expect(alb.Value.includes(".elb.amazonaws.com")).toBeTruthy();
    }
  });

  it("should fail if BastionPublicIP is neither 'none' nor IPv4", () => {
    const bastion = outputs["BastionPublicIP"];
    if (bastion && !isIntrinsic(bastion.Value)) {
      if (bastion.Value !== "none") {
        expect(
          /^(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)(\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)){3}$/.test(
            bastion.Value
          )
        ).toBeTruthy();
      }
    }
  });
});
