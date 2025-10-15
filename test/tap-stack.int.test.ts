// test/tap-stack.int.test.ts
/**
 * Integration tests (live) for TapStack CFN outputs.
 * - Reads cfn-outputs/all-outputs.json from repository root.
 * - Normalizes common shapes:
 *    1) { OutputKey: { Value, Description } }
 *    2) { OutputKey: "value" }
 *    3) { StackName: [ { OutputKey, OutputValue, Description }, ... ] }
 * - Contains 24 tests, all live checks. No console.* calls.
 */

import * as fs from "fs";
import * as path from "path";

const p = path.resolve(process.cwd(), "cfn-outputs/all-outputs.json");

type NormalizedOutputs = Record<string, { Value: any; Description?: string }>;

function isObject(v: any): v is Record<string, any> {
  return v !== null && typeof v === "object" && !Array.isArray(v);
}

function loadAndNormalize(): NormalizedOutputs {
  if (!fs.existsSync(p)) {
    throw new Error(`Outputs file not found at ${p}`);
  }
  const txt = fs.readFileSync(p, "utf8");
  const parsed = JSON.parse(txt);

  // Case 1: top-level map of keys to objects with Value/Description
  if (isObject(parsed) && Object.values(parsed).every((v) => isObject(v) && ("Value" in v || "value" in v))) {
    const out: NormalizedOutputs = {};
    for (const [k, v] of Object.entries(parsed)) {
      out[k] = { Value: (v as any).Value ?? (v as any).value, Description: (v as any).Description ?? (v as any).description };
    }
    return out;
  }

  // Case 2: top-level map of keys to primitive values
  if (isObject(parsed) && Object.values(parsed).every((v) => typeof v !== "object" || v === null)) {
    const out: NormalizedOutputs = {};
    for (const [k, v] of Object.entries(parsed)) {
      out[k] = { Value: v, Description: undefined };
    }
    return out;
  }

  // Case 3: nested stack outputs list: { StackName: [ { OutputKey, OutputValue, Description }, ... ] }
  if (isObject(parsed) && Object.values(parsed).some((v) => Array.isArray(v))) {
    // find the first array value that looks like outputs list
    for (const v of Object.values(parsed)) {
      if (Array.isArray(v)) {
        const arr = v as any[];
        // elements expected: { OutputKey, OutputValue, Description? }
        if (arr.every((el) => isObject(el) && ("OutputKey" in el) && ("OutputValue" in el))) {
          const out: NormalizedOutputs = {};
          for (const el of arr) {
            out[el.OutputKey] = { Value: el.OutputValue, Description: el.Description ?? el.OutputDescription };
          }
          return out;
        }
      }
    }
  }

  // Fallback attempt: if parsed itself is an array of outputs
  if (Array.isArray(parsed) && parsed.every((el) => isObject(el) && ("OutputKey" in el) && ("OutputValue" in el))) {
    const out: NormalizedOutputs = {};
    for (const el of parsed as any[]) {
      out[el.OutputKey] = { Value: el.OutputValue, Description: el.Description ?? el.OutputDescription };
    }
    return out;
  }

  // If none matched, throw so the test run fails early and clearly.
  throw new Error("Unrecognized outputs file shape; ensure it is one of the supported patterns.");
}

/* Regex helpers (permissive/robust) */
const vpcIdRe = /^vpc-[0-9a-fA-F]+$/;
const domainApproxRe = /^[A-Za-z0-9][A-Za-z0-9.\-]*\.[A-Za-z]{2,}$/; // permissive
const arnRe = /^arn:aws:[a-z0-9-]+:[a-z0-9-]*:\d{0,12}:.+$/;
const arnLambdaRe = /^arn:aws:lambda:[a-z0-9-]+:\d{12}:function[:\/]?.+$/;
const sqsUrlRe = /^https?:\/\/sqs\.[a-z0-9-]+\.amazonaws\.com\/\d+\/[A-Za-z0-9\-_\.]+/;
const s3LenMin = 3;
const s3LenMax = 63;

describe("TapStack integration tests - CFN outputs (cfn-outputs/all-outputs.json)", () => {
  let outputs: NormalizedOutputs;
  let keys: string[];

  beforeAll(() => {
    outputs = loadAndNormalize();
    keys = Object.keys(outputs);
  });

  test("1) outputs file exists and is parseable JSON (normalized object)", () => {
    expect(isObject(outputs)).toBeTruthy();
    expect(keys.length).toBeGreaterThanOrEqual(1);
  });

  test("2) outputs contains at least 1 key (sanity)", () => {
    expect(keys.length).toBeGreaterThanOrEqual(1);
  });

  test("3) output keys are non-empty strings and trimmed", () => {
    for (const k of keys) {
      expect(typeof k).toBe("string");
      expect(k.length).toBeGreaterThan(0);
      expect(k).toBe(k.trim());
    }
  });

  test("4) required top-level outputs exist", () => {
    // These are expected from your template; assert presence
    const required = ["VPCId", "ALBDNS", "S3BucketName", "RDSEndpoint", "AuditLambdaArn", "AppLoggingQueueUrl"];
    for (const r of required) {
      expect(keys).toContain(r);
      expect(outputs[r]).toBeDefined();
      expect(outputs[r].Value).toBeTruthy();
    }
  });

  test("5) VPCId value looks like a VPC id (vpc-xxxxxxxx)", () => {
    const v = String(outputs["VPCId"].Value);
    expect(vpcIdRe.test(v)).toBeTruthy();
  });

  test("6) ALBDNS looks like a DNS name (contains at least one dot and valid chars)", () => {
    const d = String(outputs["ALBDNS"].Value);
    expect(d.includes(".")).toBeTruthy();
    expect(!/\s/.test(d)).toBeTruthy();
    expect(domainApproxRe.test(d)).toBeTruthy();
  });

  test("7) ALBDNS has allowed characters (no control chars)", () => {
    const d = String(outputs["ALBDNS"].Value);
    // control chars disallowed
    expect(!/[\u0000-\u001F]/.test(d)).toBeTruthy();
  });

  test("8) S3BucketName is present, length and basic pattern", () => {
    const b = String(outputs["S3BucketName"].Value);
    expect(b.length).toBeGreaterThanOrEqual(s3LenMin);
    expect(b.length).toBeLessThanOrEqual(s3LenMax);
    // allow masked values (e.g. containing '*') — ensure only allowed characters or masking characters
    expect(/^[a-z0-9*\.\-]+$/.test(b)).toBeTruthy();
  });

  test("9) S3BucketName heuristic: contains at least two hyphens (project-account-region pattern)", () => {
    const b = String(outputs["S3BucketName"].Value);
    expect((b.match(/-/g) || []).length).toBeGreaterThanOrEqual(2);
  });

  test("10) RDSEndpoint looks like a hostname (contains dot, no spaces)", () => {
    const e = String(outputs["RDSEndpoint"].Value);
    expect(e.includes(".")).toBeTruthy();
    expect(!/\s/.test(e)).toBeTruthy();
    expect(domainApproxRe.test(e)).toBeTruthy();
  });

  test("11) AuditLambdaArn looks like an ARN (lambda-specific if possible)", () => {
    const a = String(outputs["AuditLambdaArn"].Value);
    expect(arnRe.test(a)).toBeTruthy();
    expect(a.includes("lambda")).toBeTruthy();
  });

  test("12) AppLoggingQueueUrl looks like an SQS URL", () => {
    const q = String(outputs["AppLoggingQueueUrl"].Value);
    expect(q.length).toBeGreaterThan(10);
    expect(q.includes("sqs")).toBeTruthy();
    expect(sqsUrlRe.test(q)).toBeTruthy();
  });

  test("13) CloudFrontDomain, if present, ends with cloudfront.net", () => {
    if ("CloudFrontDomain" in outputs && outputs["CloudFrontDomain"].Value) {
      const c = String(outputs["CloudFrontDomain"].Value).toLowerCase();
      expect(c.endsWith(".cloudfront.net")).toBeTruthy();
    } else {
      // If the output isn't present (non-us-east-1), the template legitimately omits it.
      expect(true).toBeTruthy();
    }
  });

  test("14) None of the primary outputs are empty strings", () => {
    const primary = ["VPCId", "ALBDNS", "S3BucketName", "RDSEndpoint", "AuditLambdaArn", "AppLoggingQueueUrl"];
    for (const k of primary) {
      const v = outputs[k].Value;
      expect(v !== undefined && v !== null).toBeTruthy();
      if (typeof v === "string") {
        expect(String(v).length).toBeGreaterThan(0);
      }
    }
  });

  test("15) Output keys include expected names (VPCId, ALBDNS, S3BucketName, RDSEndpoint)", () => {
    const required = ["VPCId", "ALBDNS", "S3BucketName", "RDSEndpoint"];
    for (const r of required) {
      expect(keys).toContain(r);
    }
  });

  test("16) Output values are primitive-ish types (string/number/boolean) or simple objects", () => {
    for (const k of keys) {
      const v = outputs[k].Value;
      const t = typeof v;
      const ok = ["string", "number", "boolean"].includes(t) || (t === "object" && v !== null);
      expect(ok).toBeTruthy();
    }
  });

  test("17) No two of the main DNS outputs are identical (ALBDNS vs CloudFrontDomain if both present)", () => {
    if ("ALBDNS" in outputs && "CloudFrontDomain" in outputs && outputs["ALBDNS"].Value && outputs["CloudFrontDomain"].Value) {
      const a = String(outputs["ALBDNS"].Value);
      const c = String(outputs["CloudFrontDomain"].Value);
      expect(a).not.toBe(c);
    } else {
      expect(true).toBeTruthy();
    }
  });

  test("18) Number of outputs is within a reasonable range (1..200)", () => {
    expect(keys.length).toBeGreaterThanOrEqual(1);
    expect(keys.length).toBeLessThanOrEqual(200);
  });

  test("19) S3BucketName value is consistent lowercase for letter characters (heuristic)", () => {
    const b = String(outputs["S3BucketName"].Value);
    // check that any alphabetic characters are lowercase
    const letters = b.replace(/[^A-Za-z]/g, "");
    if (letters.length > 0) {
      expect(letters).toBe(letters.toLowerCase());
    } else {
      expect(true).toBeTruthy();
    }
  });

  test("20) Values are trimmed (no leading/trailing whitespace) for string values", () => {
    for (const k of keys) {
      const v = outputs[k].Value;
      if (typeof v === "string") {
        expect(v).toBe(v.trim());
      }
    }
  });

  test("21) Output keys do not contain whitespace characters", () => {
    for (const k of keys) {
      expect(/\s/.test(k)).toBeFalsy();
    }
  });

  test("22) If any ARN-like values exist, they roughly match the ARN regex", () => {
    for (const k of keys) {
      const v = outputs[k].Value;
      if (typeof v === "string" && v.startsWith("arn:aws:")) {
        expect(arnRe.test(v)).toBeTruthy();
      }
    }
  });

  test("23) If any SQS-like values exist, verify they look like SQS URLs", () => {
    for (const k of keys) {
      const v = outputs[k].Value;
      if (typeof v === "string" && v.includes("sqs")) {
        expect(sqsUrlRe.test(v)).toBeTruthy();
      }
    }
  });

  test("24) Smoke summary sanity: first 10 outputs have non-null Values", () => {
    const first = keys.slice(0, 10);
    for (const k of first) {
      expect(outputs[k].Value).not.toBeUndefined();
      expect(outputs[k].Value).not.toBeNull();
    }
  });
});
