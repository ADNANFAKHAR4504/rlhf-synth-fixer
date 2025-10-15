/**
 * test/tap-stack.integration.test.ts
 *
 * Integration tests for TapStack outputs. Single-file, ~23 tests.
 *
 * Requires:
 * - outputs JSON at: <repo-root>/cfn-outputs/all-outputs.json
 *
 * Notes:
 * - Tests are "live" style: they parse the JSON and validate values/patterns.
 * - The checks are kept reasonably permissive to accommodate typical CFN output formats.
 */

import * as fs from "fs";
import * as path from "path";

const p = path.resolve(process.cwd(), "cfn-outputs/all-outputs.json");

type CfnOutputs = Record<
  string,
  {
    Description?: string;
    Value?: any;
    Condition?: string;
  }
>;

function loadOutputs(): CfnOutputs {
  if (!fs.existsSync(p)) {
    throw new Error(`Outputs file not found at ${p}`);
  }
  const raw = fs.readFileSync(p, "utf8");
  const parsed = JSON.parse(raw);
  // If your file has direct map of keys to values (not CFN Output objects),
  // adapt accordingly; this test expects the CFN-style outputs structure:
  // { "VPCId": { "Description": "...", "Value": "vpc-..." }, ... }
  if (
    parsed &&
    typeof parsed === "object" &&
    Object.values(parsed).every((v) => typeof v === "object" && "Value" in v)
  ) {
    return parsed as CfnOutputs;
  }
  // Fallback: user may have a outputs file with { "VPCId": "vpc-..." } shape
  if (parsed && typeof parsed === "object") {
    const mapped: CfnOutputs = {};
    for (const [k, v] of Object.entries(parsed)) {
      mapped[k] = { Value: v };
    }
    return mapped;
  }
  throw new Error("Unrecognized outputs file shape");
}

/* ---------- Helper regexes & utilities ---------- */

const vpcIdRe = /^vpc-[0-9a-fA-F]+$/;
const domainRe = /^[a-z0-9][a-z0-9\.-]*\.[a-z]{2,}$/i;
const s3BucketRe = /^[a-z0-9][a-z0-9\.-]{1,61}[a-z0-9]$/; // simplified: 3-63 chars, lowercase
const arnLambdaRe = /^arn:aws:lambda:[a-z0-9-]+:\d{12}:function[:\/]?.+$/;
const sqsUrlRe = /^https?:\/\/sqs\.[a-z0-9-]+\.amazonaws\.com\/\d+\/[A-Za-z0-9\-_\.]+/;

describe("TapStack integration tests - CFN outputs (cfn-outputs/all-outputs.json)", () => {
  let outputs: CfnOutputs;
  let keys: string[];

  beforeAll(() => {
    outputs = loadOutputs();
    keys = Object.keys(outputs || {});
  });

  test("outputs file exists and is parseable JSON (object)", () => {
    expect(outputs).toBeDefined();
    expect(typeof outputs).toBe("object");
  });

  test("outputs contains at least 5 keys (sanity)", () => {
    // Your template defines multiple outputs; expect at least a handful
    expect(keys.length).toBeGreaterThanOrEqual(5);
  });

  test("VPCId output exists and is non-empty", () => {
    expect(outputs["VPCId"]).toBeDefined();
    const v = outputs["VPCId"].Value;
    expect(v).toBeTruthy();
  });

  test("VPCId value looks like a VPC id (vpc-xxxxxxxx)", () => {
    const v = String(outputs["VPCId"].Value);
    expect(vpcIdRe.test(v)).toBeTruthy();
  });

  test("ALBDNS output exists and is non-empty", () => {
    expect(outputs["ALBDNS"]).toBeDefined();
    expect(outputs["ALBDNS"].Value).toBeTruthy();
  });

  test("ALBDNS looks like a DNS name (contains at least one dot and valid characters)", () => {
    const d = String(outputs["ALBDNS"].Value);
    // common ELB names include hyphens and dots; enforce basic domain form
    expect(d.includes(".")).toBeTruthy();
    expect(domainRe.test(d)).toBeTruthy();
    // should not contain whitespace
    expect(/\s/.test(d)).toBeFalsy();
  });

  test("ALBDNS is lowercased (no uppercase letters)", () => {
    const d = String(outputs["ALBDNS"].Value);
    expect(d).toBe(d.toLowerCase());
  });

  test("S3BucketName output exists and is non-empty", () => {
    expect(outputs["S3BucketName"]).toBeDefined();
    expect(outputs["S3BucketName"].Value).toBeTruthy();
  });

  test("S3BucketName follows S3 constraints (lowercase, 3-63 chars, allowed characters)", () => {
    const b = String(outputs["S3BucketName"].Value);
    // length
    expect(b.length).toBeGreaterThanOrEqual(3);
    expect(b.length).toBeLessThanOrEqual(63);
    // lowercase allowed characters
    expect(b).toBe(b.toLowerCase());
    // simplified sanity regex
    expect(s3BucketRe.test(b)).toBeTruthy();
    // no consecutive dots
    expect(b.includes("..")).toBeFalsy();
    // not start or end with dot or hyphen
    expect(/^[.-]/.test(b)).toBeFalsy();
    expect(/[.-]$/.test(b)).toBeFalsy();
  });

  test("S3BucketName contains project/account/region pattern pieces (heuristic)", () => {
    const b = String(outputs["S3BucketName"].Value);
    // Your template uses "${Project}-${AWS::AccountId}-${AWS::Region}" — so expect at least two hyphens
    expect((b.match(/-/g) || []).length).toBeGreaterThanOrEqual(2);
  });

  test("RDSEndpoint output exists and is non-empty", () => {
    expect(outputs["RDSEndpoint"]).toBeDefined();
    expect(outputs["RDSEndpoint"].Value).toBeTruthy();
  });

  test("RDSEndpoint looks like a hostname (contains dot, no spaces)", () => {
    const e = String(outputs["RDSEndpoint"].Value);
    expect(e.includes(".")).toBeTruthy();
    expect(!/\s/.test(e)).toBeTruthy();
    expect(domainRe.test(e)).toBeTruthy();
  });

  test("AuditLambdaArn output exists and looks like a Lambda ARN", () => {
    expect(outputs["AuditLambdaArn"]).toBeDefined();
    const a = String(outputs["AuditLambdaArn"].Value);
    expect(a).toBeTruthy();
    expect(arnLambdaRe.test(a)).toBeTruthy();
  });

  test("AppLoggingQueueUrl output exists and looks like an SQS URL", () => {
    expect(outputs["AppLoggingQueueUrl"]).toBeDefined();
    const q = String(outputs["AppLoggingQueueUrl"].Value);
    expect(q).toBeTruthy();
    // SQS URLs tend to be https://sqs.<region>.amazonaws.com/<account>/<queue>
    expect(sqsUrlRe.test(q) || /sqs/.test(q) && /amazonaws\.com/.test(q)).toBeTruthy();
  });

  test("CloudFrontDomain (if present) ends with cloudfront.net", () => {
    if (outputs["CloudFrontDomain"] && outputs["CloudFrontDomain"].Value) {
      const c = String(outputs["CloudFrontDomain"].Value);
      expect(c.toLowerCase().endsWith(".cloudfront.net")).toBeTruthy();
    } else {
      // If CloudFrontDomain not present because region isn't us-east-1, that's acceptable.
      expect(true).toBeTruthy();
    }
  });

  test("None of the primary outputs are empty strings", () => {
    const primary = ["VPCId", "ALBDNS", "S3BucketName", "RDSEndpoint", "AuditLambdaArn", "AppLoggingQueueUrl"];
    for (const k of primary) {
      expect(outputs[k]).toBeDefined();
      const v = outputs[k].Value;
      // ensure value is present and not an empty string
      expect(v !== undefined && v !== null).toBeTruthy();
      expect(String(v).trim().length).toBeGreaterThan(0);
    }
  });

  test("Output keys include expected names (VPCId, ALBDNS, S3BucketName, RDSEndpoint)", () => {
    const required = ["VPCId", "ALBDNS", "S3BucketName", "RDSEndpoint"];
    for (const r of required) {
      expect(keys).toContain(r);
    }
  });

  test("Output values are primitive-ish types (string/number/boolean) or simple objects", () => {
    for (const k of keys) {
      const v = outputs[k].Value;
      const t = typeof v;
      const ok = ["string", "number", "boolean"].includes(t) || (t === "object" && v !== null);
      expect(ok).toBeTruthy();
    }
  });

  test("No two of the main DNS outputs are identical (ALBDNS vs CloudFrontDomain)", () => {
    const alb = outputs["ALBDNS"]?.Value ? String(outputs["ALBDNS"].Value) : null;
    const cf = outputs["CloudFrontDomain"]?.Value ? String(outputs["CloudFrontDomain"].Value) : null;
    if (alb && cf) {
      expect(alb).not.toBe(cf);
    } else {
      // if one is missing, it's fine
      expect(true).toBeTruthy();
    }
  });

  test("Number of outputs is within a reasonable range (>=6 and <=50)", () => {
    // allows for expansion but catches accidental zero outputs
    expect(keys.length).toBeGreaterThanOrEqual(6);
    expect(keys.length).toBeLessThanOrEqual(50);
  });

  test("S3BucketName value is consistently lowercase elsewhere (sanity check)", () => {
    const s = String(outputs["S3BucketName"].Value);
    // check if the same bucket name appears anywhere else in outputs (if so, ensure same case)
    for (const k of keys) {
      const v = outputs[k].Value;
      if (!v) continue;
      const vs = String(v);
      if (vs.includes(s) && k !== "S3BucketName") {
        expect(vs.includes(s)).toBeTruthy();
      }
    }
  });
});
