import * as fs from "fs";
import * as path from "path";

const p = path.resolve(process.cwd(), "cfn-outputs/all-outputs.json");

// Load outputs safely
const raw = JSON.parse(fs.readFileSync(p, "utf8"));
const stackKey = Object.keys(raw)[0];
const outputsArray = raw[stackKey];
const outputs: Record<string, string> = {};
outputsArray.forEach((item: any) => {
  outputs[item.OutputKey] = item.OutputValue;
});

// --------------------
// Helper Validators
// --------------------
const isVpcId = (val: string): boolean => /^vpc-[0-9a-f]{8,}$/.test(val);
const isDnsName = (val: string): boolean =>
  /^[a-zA-Z0-9-]+\.[a-zA-Z0-9.-]+\.elb\.amazonaws\.com$/.test(val);
const isCloudFrontDomain = (val: string): boolean =>
  /^[a-z0-9.-]+\.cloudfront\.net$/.test(val);
const isS3BucketName = (val: string): boolean =>
  /^[a-z0-9.-]{3,63}$/.test(val);
const isRdsEndpoint = (val: string): boolean =>
  /^[a-zA-Z0-9.-]+\.(rds|rds\.amazonaws)\.[a-z]{2}-[a-z]+-\d+\.amazonaws\.com$/.test(val);
const isHostname = (val: string): boolean =>
  /^[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(val);

// --------------------
// Integration Tests
// --------------------
describe("TapStack Integration Tests (Live Outputs Validation)", () => {
  // Basic structure
  test("Outputs JSON file exists and valid", () => {
    expect(fs.existsSync(p)).toBe(true);
    expect(typeof raw).toBe("object");
    expect(outputsArray.length).toBeGreaterThan(0);
  });

  test("Outputs should contain all required keys", () => {
    const expected = ["CloudFrontURL", "VPCId", "RDSAddress", "AppBucket", "ALBDNS"];
    expected.forEach((key) => expect(outputs[key]).toBeDefined());
  });

  // VPC validations
  test("VPCId should be a valid AWS VPC format", () => {
    expect(isVpcId(outputs.VPCId)).toBe(true);
  });

  test("VPCId should not contain uppercase or spaces", () => {
    expect(/[A-Z\s]/.test(outputs.VPCId)).toBe(false);
  });

  // ALB validations
  test("ALBDNS should match valid ELB DNS format", () => {
    expect(isDnsName(outputs.ALBDNS)).toBe(true);
  });

  test("ALBDNS should contain region hint like 'us-east-1'", () => {
    expect(outputs.ALBDNS.includes("us-east-1")).toBe(true);
  });

  test("ALBDNS should not contain underscores", () => {
    expect(outputs.ALBDNS.includes("_")).toBe(false);
  });

  // RDS validations
  test("RDSAddress should be a valid AWS RDS endpoint", () => {
    expect(isRdsEndpoint(outputs.RDSAddress)).toBe(true);
  });

  test("RDSAddress should contain database region pattern", () => {
    expect(outputs.RDSAddress.includes("us-east-1")).toBe(true);
  });

  test("RDSAddress should not contain http/https", () => {
    expect(outputs.RDSAddress.startsWith("http")).toBe(false);
  });

  // S3 bucket validations
  test("AppBucket name should be valid S3 naming convention", () => {
    expect(isS3BucketName(outputs.AppBucket)).toBe(true);
  });

  test("AppBucket name should be lowercase and no underscores", () => {
    expect(outputs.AppBucket).toEqual(outputs.AppBucket.toLowerCase());
    expect(outputs.AppBucket.includes("_")).toBe(false);
  });

  test("AppBucket should not start or end with a period", () => {
    const b = outputs.AppBucket;
    expect(b.startsWith(".")).toBe(false);
    expect(b.endsWith(".")).toBe(false);
  });

  // CloudFront validations
  test("CloudFrontURL should be valid CloudFront domain", () => {
    expect(isCloudFrontDomain(outputs.CloudFrontURL)).toBe(true);
  });

  test("CloudFrontURL should end with .cloudfront.net", () => {
    expect(outputs.CloudFrontURL.endsWith(".cloudfront.net")).toBe(true);
  });

  test("CloudFrontURL should not contain uppercase letters", () => {
    expect(/[A-Z]/.test(outputs.CloudFrontURL)).toBe(false);
  });

  // Cross-output validations
  test("CloudFrontURL and ALBDNS should not be identical", () => {
    expect(outputs.CloudFrontURL).not.toEqual(outputs.ALBDNS);
  });

  test("AppBucket and CloudFrontURL should represent distinct resources", () => {
    expect(outputs.AppBucket.includes(outputs.CloudFrontURL)).toBe(false);
  });

  // Standards and non-empty values
  test("All outputs should be non-empty strings", () => {
    Object.entries(outputs).forEach(([key, val]) => {
      expect(typeof val).toBe("string");
      expect(val.trim().length).toBeGreaterThan(0);
    });
  });

  test("All output values should be under 255 chars", () => {
    Object.values(outputs).forEach((val) => {
      expect((val as string).length).toBeLessThanOrEqual(255);
    });
  });

  // Edge consistency checks
  test("No output value should contain placeholders like undefined or null", () => {
    Object.values(outputs).forEach((val) => {
      const s = val.toString();
      expect(s.toLowerCase()).not.toMatch(/undefined|null/);
    });
  });

  test("Each output value should follow AWS resource naming style", () => {
    const checks = [
      isVpcId(outputs.VPCId),
      isDnsName(outputs.ALBDNS),
      isRdsEndpoint(outputs.RDSAddress),
      isS3BucketName(outputs.AppBucket),
      isCloudFrontDomain(outputs.CloudFrontURL),
    ];
    checks.forEach((res) => expect(res).toBe(true));
  });

  test("CloudFront domain should contain at least two dots", () => {
    expect(outputs.CloudFrontURL.split(".").length).toBeGreaterThanOrEqual(3);
  });

  test("RDS and ALB should be deployed in same region (us-east-1)", () => {
    const rdsRegion = outputs.RDSAddress.includes("us-east-1");
    const albRegion = outputs.ALBDNS.includes("us-east-1");
    expect(rdsRegion && albRegion).toBe(true);
  });

  test("Outputs file should not contain unexpected keys", () => {
    const allowed = ["CloudFrontURL", "VPCId", "RDSAddress", "AppBucket", "ALBDNS"];
    Object.keys(outputs).forEach((key) => expect(allowed).toContain(key));
  });
});
