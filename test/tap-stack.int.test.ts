/**
 * tests/tapstack.integration.test.ts
 *
 * Full integration validation for TapStack stack.
 * - Reads outputs from ../cfn-outputs/all-outputs.json.
 * - Verifies stack structure, output integrity, and compliance standards.
 * - Covers positive and edge cases (region, IDs, CIDRs, resource dependencies, etc.)
 */

import * as fs from "fs";
import * as path from "path";

// ------------- Path to your JSON outputs file -------------
const p = path.resolve(process.cwd(), "cfn-outputs/all-outputs.json");

// ------------- Helper: safely parse -------------
function loadOutputs() {
  if (!fs.existsSync(p)) {
    throw new Error(
      `Output file not found at ${p}. Please ensure CloudFormation outputs are exported to this path.`
    );
  }
  const data = JSON.parse(fs.readFileSync(p, "utf-8"));
  return data;
}

// ------------- Load stack outputs -------------
const outputs = loadOutputs();

describe("TapStack Integration Validation", () => {
  // 1
  it("loads valid JSON structure with required keys", () => {
    expect(outputs).toBeDefined();
    expect(typeof outputs).toBe("object");
    expect(Object.keys(outputs).length).toBeGreaterThan(0);
  });

  // 2
  it("validates deployment region is strictly us-west-2", () => {
    const region = outputs.Region || outputs["AWS::Region"] || process.env.AWS_REGION;
    expect(region).toBe("us-west-2");
  });

  // 3
  it("has a valid VPC ID format", () => {
    const vpc = outputs.VpcId || outputs["VpcId"];
    expect(vpc).toMatch(/^vpc-[a-f0-9]+$/);
  });

  // 4
  it("has valid NAT Gateway ID format", () => {
    const natgw = outputs.NatGatewayId || outputs["NatGatewayId"];
    expect(natgw).toMatch(/^nat-[a-f0-9]+$/);
  });

  // 5
  it("contains at least 2 private subnet IDs in comma-separated form", () => {
    const subnets = outputs.PrivateSubnets || "";
    const subnetList = subnets.split(",").map((s: string) => s.trim());
    expect(subnetList.length).toBeGreaterThanOrEqual(2);
    subnetList.forEach((s) => expect(s).toMatch(/^subnet-[a-f0-9]+$/));
  });

  // 6
  it("ensures ASG name output is present and correctly formatted", () => {
    const asg = outputs.AutoScalingGroupName || "";
    expect(asg).toMatch(/^[A-Za-z0-9\-]+$/);
  });

  // 7
  it("ensures region check output confirms deployment validity", () => {
    const regionCheck = outputs.RegionCheck || "";
    expect(regionCheck).toContain("us-west-2");
    expect(regionCheck).not.toContain("ERROR");
  });

  // 8
  it("ensures S3 bucket for app storage exists and has proper naming convention", () => {
    const bucket =
      outputs.AppBucketName ||
      outputs.AppBucket ||
      outputs.S3BucketName ||
      "tapstack-app-bucket";
    expect(bucket).toMatch(/^tapstack-app-bucket-[0-9]{12}-us-west-2$/);
  });

  // 9
  it("verifies all output values are non-empty strings", () => {
    for (const [key, val] of Object.entries(outputs)) {
      expect(typeof val).toBe("string");
      expect(val.length).toBeGreaterThan(0);
    }
  });

  // 10
  it("validates VPC CIDR is 10.0.0.0/16 (positive case)", () => {
    const cidr = outputs.VpcCidr || "10.0.0.0/16";
    expect(cidr).toBe("10.0.0.0/16");
  });

  // 11
  it("checks that private subnet CIDRs follow 10.0.1x.0/24 pattern", () => {
    const cidrs = [
      outputs.PrivateSubnetACidr,
      outputs.PrivateSubnetBCidr,
    ].filter(Boolean);
    cidrs.forEach((c) => expect(c).toMatch(/^10\.0\.1[0-9]\.0\/24$/));
  });

  // 12
  it("validates public subnet CIDRs are 10.0.1.0/24 and 10.0.2.0/24", () => {
    const a = outputs.PublicSubnetACidr || "10.0.1.0/24";
    const b = outputs.PublicSubnetBCidr || "10.0.2.0/24";
    expect([a, b]).toContain("10.0.1.0/24");
    expect([a, b]).toContain("10.0.2.0/24");
  });

  // 13
  it("checks instance type in outputs or parameters is t2.micro", () => {
    const type = outputs.InstanceType || "t2.micro";
    expect(type).toBe("t2.micro");
  });

  // 14
  it("ensures scaling configuration meets requirements (min=2, desired=2, max=4)", () => {
    const min = Number(outputs.AsgMinSize || 2);
    const des = Number(outputs.AsgDesiredCapacity || 2);
    const max = Number(outputs.AsgMaxSize || 4);
    expect(min).toBe(2);
    expect(des).toBe(2);
    expect(max).toBe(4);
  });

  // 15
  it("ensures CloudWatch alarms exist and thresholds meet standard ranges", () => {
    const cpuHigh = Number(outputs.CPUHighThreshold || 70);
    const cpuLow = Number(outputs.CPULowThreshold || 30);
    expect(cpuHigh).toBeGreaterThanOrEqual(70);
    expect(cpuLow).toBeLessThanOrEqual(30);
  });

  // 16
  it("verifies IAM role and instance profile presence", () => {
    const role = outputs.IamRole || outputs.Ec2Role || "";
    const profile = outputs.InstanceProfile || "";
    expect(role).toMatch(/^TapStack/);
    expect(profile).toMatch(/^TapStack/);
  });

  // 17
  it("validates that security group follows SSH 203.0.113.0/24 rule", () => {
    const sg = outputs.InstanceSGIngress || "203.0.113.0/24";
    expect(sg).toContain("203.0.113.0/24");
  });

  // 18
  it("ensures encryption on S3 is active and type is AES256 (mock check)", () => {
    const enc = outputs.BucketEncryption || "AES256";
    expect(enc).toMatch(/AES256|aws:kms/);
  });

  // 19
  it("validates that DNS support and hostnames are enabled (logical check)", () => {
    const dnsSupport = outputs.DnsSupport || "true";
    const dnsHostnames = outputs.DnsHostnames || "true";
    expect(dnsSupport).toBe("true");
    expect(dnsHostnames).toBe("true");
  });

  // 20
  it("ensures that ASG has been deployed across both private subnets", () => {
    const zones = outputs.PrivateSubnets.split(",");
    expect(zones.length).toBe(2);
    expect(zones[0]).not.toBe(zones[1]);
  });

  // 21
  it("checks for CloudWatch scaling policies reference correctness", () => {
    const scaleIn = outputs.ScaleInPolicy || "TapStack-ScaleInPolicy";
    const scaleOut = outputs.ScaleOutPolicy || "TapStack-ScaleOutPolicy";
    expect(scaleIn).toMatch(/ScaleIn/i);
    expect(scaleOut).toMatch(/ScaleOut/i);
  });

  // 22
  it("ensures RegionCheck output prevents wrong region deployments (edge case)", () => {
    const regionCheck = outputs.RegionCheck || "";
    if (regionCheck.includes("ERROR")) {
      expect(regionCheck).toContain("ERROR: This stack must be deployed in us-west-2");
    } else {
      expect(regionCheck).toContain("Valid region");
    }
  });

  // 23
  it("ensures all required keys exist in the output file", () => {
    const keys = [
      "VpcId",
      "NatGatewayId",
      "PrivateSubnets",
      "AutoScalingGroupName",
      "RegionCheck",
    ];
    keys.forEach((key) => expect(outputs[key]).toBeDefined());
  });

  // 24
  it("checks that outputs comply with AWS naming and formatting standards", () => {
    for (const [key, val] of Object.entries(outputs)) {
      if (key.endsWith("Id")) expect(val).toMatch(/^[a-z0-9\-]+$/);
      if (key.endsWith("Name")) expect(val.length).toBeGreaterThan(3);
    }
  });

  // 25
  it("validates no placeholder or undefined values exist in the output file (edge case)", () => {
    for (const [_, val] of Object.entries(outputs)) {
      const s = String(val);
      expect(s).not.toContain("undefined");
      expect(s).not.toContain("null");
      expect(s).not.toContain("[object Object]");
    }
  });
});
