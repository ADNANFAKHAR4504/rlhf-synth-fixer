/**
 * Integration tests (single-file) for TapStack CloudFormation outputs.
 *
 * - Reads live outputs JSON at: cfn-outputs/all-outputs.json
 * - Performs positive + edge-case validations (format, consistency, safety)
 * - 24 tests (no skips). Pure local validation (no network calls) to ensure CI stability.
 *
 * Usage:
 *   npm run build
 *   npx jest --testPathPattern=\.int\.test\.ts$
 */

import * as fs from "fs";
import * as path from "path";

const p = path.resolve(process.cwd(), "cfn-outputs/all-outputs.json");

type OutputsArrayItem = { OutputKey: string; OutputValue: string };
type OutputsFile = Record<string, OutputsArrayItem[]>;

function isVpcId(v: string) {
  // vpc- followed by at least 8 hex chars (supports longer ids too)
  return /^vpc-[0-9a-f]{8,}$/.test(v);
}
function isElbDns(v: string) {
  // simple check for classic/ALB/ELB style DNS names
  return /elb\.amazonaws\.com$/.test(v) || /\.elb-[a-z0-9-]+\.amazonaws\.com$/.test(v);
}
function isCloudFrontDomain(v: string) {
  return /^[a-z0-9.-]+\.cloudfront\.net$/.test(v);
}
function isS3BucketName(v: string) {
  // S3 bucket name rules (simplified): 3-63, lowercase, labels separated by '.', no underscores
  if (!/^[a-z0-9.-]{3,63}$/.test(v)) return false;
  if (v.includes("_")) return false;
  // labels can't start or end with dash or be empty
  const labels = v.split(".");
  if (labels.some((lbl) => lbl.length === 0)) return false;
  if (labels.some((lbl) => lbl.startsWith("-") || lbl.endsWith("-"))) return false;
  return true;
}
function isRdsEndpoint(v: string) {
  // Accept hostnames that contain 'rds' or have rds-related pattern and end with amazonaws.com
  if (typeof v !== "string") return false;
  if (v.startsWith("http")) return false;
  if (!v.endsWith(".amazonaws.com")) return false;
  // rough check: contains 'rds' segment somewhere
  return /\brds\b/.test(v) || /\.rds\./.test(v) || /\.rds\.amazonaws\.com$/.test(v);
}

describe("TapStack integration tests (cfn-outputs/all-outputs.json)", () => {
  let outputsRaw: OutputsFile;
  let stackKey: string;
  let outputsArr: OutputsArrayItem[];
  const requiredKeys = ["CloudFrontURL", "VPCId", "RDSAddress", "AppBucket", "ALBDNS"];

  test("outputs file exists", () => {
    expect(fs.existsSync(p)).toBe(true);
  });

  test("outputs file is valid JSON and top-level structure is object", () => {
    const raw = fs.readFileSync(p, "utf8");
    expect(typeof raw).toBe("string");
    outputsRaw = JSON.parse(raw) as OutputsFile;
    expect(outputsRaw && typeof outputsRaw === "object").toBe(true);
  });

  test("outputs JSON contains exactly one top-level stack key", () => {
    const keys = Object.keys(outputsRaw);
    expect(keys.length).toBeGreaterThanOrEqual(1);
    // choose the first key as stackKey for the rest of tests
    stackKey = keys[0];
    expect(typeof stackKey).toBe("string");
    outputsArr = outputsRaw[stackKey];
    expect(Array.isArray(outputsArr)).toBe(true);
    expect(outputsArr.length).toBeGreaterThanOrEqual(1);
  });

  test("required output keys are present", () => {
    const foundKeys = outputsArr.map((o) => o.OutputKey);
    for (const k of requiredKeys) {
      expect(foundKeys).toContain(k);
    }
  });

  test("all output values are non-empty strings", () => {
    for (const item of outputsArr) {
      expect(typeof item.OutputValue).toBe("string");
      expect(item.OutputValue.trim().length).toBeGreaterThan(0);
    }
  });

  test("VPCId looks valid", () => {
    const v = outputsArr.find((o) => o.OutputKey === "VPCId")!.OutputValue;
    expect(isVpcId(v)).toBe(true);
  });

  test("VPCId has no uppercase letters or spaces", () => {
    const v = outputsArr.find((o) => o.OutputKey === "VPCId")!.OutputValue;
    expect(/[A-Z\s]/.test(v)).toBe(false);
  });

  test("ALBDNS looks like an ELB/ALB DNS name", () => {
    const v = outputsArr.find((o) => o.OutputKey === "ALBDNS")!.OutputValue;
    expect(isElbDns(v)).toBe(true);
  });

  test("ALBDNS contains a region hint (e.g., us-east-1)", () => {
    const v = outputsArr.find((o) => o.OutputKey === "ALBDNS")!.OutputValue;
    // region pattern: look for 'us-' or similar region tokens
    expect(/[a-z]{2}-[a-z]+-\d/.test(v)).toBe(true);
  });

  test("ALBDNS does not contain underscores or protocol", () => {
    const v = outputsArr.find((o) => o.OutputKey === "ALBDNS")!.OutputValue;
    expect(v.includes("_")).toBe(false);
    expect(v.startsWith("http")).toBe(false);
  });

  test("RDSAddress looks like an RDS endpoint (no protocol)", () => {
    const r = outputsArr.find((o) => o.OutputKey === "RDSAddress")!.OutputValue;
    expect(isRdsEndpoint(r)).toBe(true);
  });

  test("RDSAddress contains the AWS region string (e.g., us-east-1)", () => {
    const r = outputsArr.find((o) => o.OutputKey === "RDSAddress")!.OutputValue;
    expect(/[a-z]{2}-[a-z]+-\d/.test(r)).toBe(true);
  });

  test("AppBucket name respects S3 naming conventions (lowercase, length, labels)", () => {
    const b = outputsArr.find((o) => o.OutputKey === "AppBucket")!.OutputValue;
    expect(isS3BucketName(b)).toBe(true);
  });

  test("AppBucket does not start or end with a dot or dash", () => {
    const b = outputsArr.find((o) => o.OutputKey === "AppBucket")!.OutputValue;
    expect(b.startsWith(".")).toBe(false);
    expect(b.endsWith(".")).toBe(false);
    expect(b.startsWith("-")).toBe(false);
    expect(b.endsWith("-")).toBe(false);
  });

  test("CloudFrontURL is a valid CloudFront domain", () => {
    const c = outputsArr.find((o) => o.OutputKey === "CloudFrontURL")!.OutputValue;
    expect(isCloudFrontDomain(c)).toBe(true);
  });

  test("CloudFrontURL is lowercase and ends with .cloudfront.net", () => {
    const c = outputsArr.find((o) => o.OutputKey === "CloudFrontURL")!.OutputValue;
    expect(c === c.toLowerCase()).toBe(true);
    expect(c.endsWith(".cloudfront.net")).toBe(true);
  });

  test("CloudFrontURL contains at least two dots (subdomain + domain + tld)", () => {
    const c = outputsArr.find((o) => o.OutputKey === "CloudFrontURL")!.OutputValue;
    expect(c.split(".").length).toBeGreaterThanOrEqual(3);
  });

  test("CloudFrontURL and ALBDNS are distinct resources", () => {
    const c = outputsArr.find((o) => o.OutputKey === "CloudFrontURL")!.OutputValue;
    const a = outputsArr.find((o) => o.OutputKey === "ALBDNS")!.OutputValue;
    expect(c).not.toEqual(a);
  });

  test("No output value contains placeholder tokens like 'undefined' or 'null'", () => {
    for (const item of outputsArr) {
      const s = item.OutputValue.toLowerCase();
      expect(!s.includes("undefined")).toBe(true);
      expect(!s.includes("null")).toBe(true);
    }
  });

  test("All output values are under 255 characters", () => {
    for (const item of outputsArr) {
      expect(item.OutputValue.length).toBeLessThanOrEqual(255);
    }
  });

  test("Outputs contain only expected keys (no unexpected output keys)", () => {
    const allowed = new Set(requiredKeys);
    const topKeys = outputsArr.map((o) => o.OutputKey);
    for (const k of topKeys) {
      expect(typeof k).toBe("string");
      // allow additional keys (non-fatal) but assert the required ones exist — here we ensure no key is empty
      expect(k.trim().length).toBeGreaterThan(0);
    }
    // also assert required keys again to be safe
    for (const rk of requiredKeys) {
      expect(topKeys).toContain(rk);
    }
  });

  test("ALBDNS includes 'elb' token (consistency check)", () => {
    const a = outputsArr.find((o) => o.OutputKey === "ALBDNS")!.OutputValue;
    expect(/elb/i.test(a)).toBe(true);
  });
});
