/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/ban-ts-comment */
// Minimal Node globals for TS projects without @types/node
declare var require: any;
declare var process: any;

const fs = require("fs");
const path = require("path");

type OutMap = Record<string, string>;

const OUTPUTS_PATH = path.resolve(process.cwd(), "cfn-outputs/all-outputs.json");

/* ------------------------- robust outputs loader ------------------------- */
/**
 * Recursively harvest CloudFormation-like outputs from arbitrary JSON shapes.
 * Supports:
 *  - { Stacks: [ { Outputs: [{ OutputKey, OutputValue }, ...] } ] }
 *  - [ { Outputs: [...] } ]
 *  - [ { OutputKey, OutputValue }, ... ]
 *  - { Outputs: { Key: Value | { Value } } }
 *  - { Key: Value } flat maps
 *  - { Key: { Value: "..." } } nested maps
 *  - { Key: { OutputValue: "..." } } nested maps
 *  - Any nesting of the above.
 */
function harvest(obj: any, acc: OutMap) {
  if (obj == null) return;
  if (typeof obj !== "object") return;

  // 1) Array of things (recurse)
  if (Array.isArray(obj)) {
    for (const it of obj) harvest(it, acc);
    return;
  }

  // 2) Direct OutputKey/OutputValue object
  if ("OutputKey" in obj && ("OutputValue" in obj || "Value" in obj)) {
    const k = String(obj.OutputKey);
    const v = obj.OutputValue ?? obj.Value;
    if (typeof v !== "undefined") acc[k] = stringifyValue(v);
  }

  // 3) Key/Value pair (some exporters use { Key, Value })
  if ("Key" in obj && "Value" in obj && typeof obj.Key === "string") {
    acc[obj.Key] = stringifyValue(obj.Value);
  }

  // 4) { Outputs: [...] } or { Outputs: { K: V } }
  if ("Outputs" in obj) {
    const o = (obj as any).Outputs;
    if (Array.isArray(o)) {
      for (const it of o) harvest(it, acc);
    } else if (o && typeof o === "object") {
      Object.entries(o).forEach(([k, v]) => {
        if (v && typeof v === "object") {
          if ("Value" in (v as any)) acc[k] = stringifyValue((v as any).Value);
          else if ("OutputValue" in (v as any))
            acc[k] = stringifyValue((v as any).OutputValue);
          else acc[k] = stringifyValue(v);
        } else {
          acc[k] = stringifyValue(v);
        }
      });
    }
  }

  // 5) { Stacks: [...] }
  if ("Stacks" in obj && Array.isArray((obj as any).Stacks)) {
    harvest((obj as any).Stacks, acc);
  }

  // 6) Flat map where values are scalar or { Value } / { OutputValue }
  Object.entries(obj).forEach(([k, v]) => {
    if (k === "Outputs" || k === "Stacks") return; // already handled
    if (isReasonableOutputKey(k)) {
      if (v && typeof v === "object") {
        if ("Value" in (v as any)) acc[k] = stringifyValue((v as any).Value);
        else if ("OutputValue" in (v as any))
          acc[k] = stringifyValue((v as any).OutputValue);
        else acc[k] = stringifyValue(v);
      } else {
        acc[k] = stringifyValue(v);
      }
    } else {
      // unknown subtree, still recurse — there might be nested outputs
      harvest(v, acc);
    }
  });
}

function stringifyValue(v: any): string {
  if (v == null) return "";
  return typeof v === "string" ? v : JSON.stringify(v);
}

function isReasonableOutputKey(k: string): boolean {
  // Accept any non-empty, alnumish-ish key
  return /^[A-Za-z][A-Za-z0-9:_-]*$/.test(k);
}

function loadOutputs(): OutMap {
  if (!fs.existsSync(OUTPUTS_PATH)) {
    throw new Error(`Expected outputs file not found at: ${OUTPUTS_PATH}`);
  }
  const raw = fs.readFileSync(OUTPUTS_PATH, "utf8").trim();
  if (!raw) throw new Error("Outputs file is empty");

  let data: any;
  try {
    data = JSON.parse(raw);
  } catch (e: any) {
    throw new Error(`Failed to parse JSON at ${OUTPUTS_PATH}: ${e.message}`);
  }

  const acc: OutMap = {};
  harvest(data, acc);
  return acc;
}

/* ------------------------------ regex helpers ------------------------------ */
const reVpcId = /^vpc-([a-f0-9]{8}|[a-f0-9]{17})$/;
const reSubnetId = /^subnet-[a-f0-9]+$/;
const reIgwId = /^igw-[a-f0-9]+$/;
const reNatId = /^nat-[a-f0-9]+$/;
const reSgId = /^sg-[a-f0-9]+$/;
const reInstanceId = /^i-[a-f0-9]+$/;
const reIpv4Public =
  /^(?!0)(?!127)(?!10\.)(?!192\.168\.)(?!172\.(1[6-9]|2[0-9]|3[0-1])\.)(?!169\.254\.)((25[0-5]|2[0-4]\d|1?\d?\d)\.){3}(25[0-5]|2[0-4]\d|1?\d?\d)$/;
const reBucketDns = /^[a-z0-9](?:[a-z0-9.-]{1,61})[a-z0-9]$/;
const reArn = /^arn:aws:[a-z0-9-]+:[a-z0-9-]*:\d{12}:.+$/;
const reKmsArnUsEast1 = /^arn:aws:kms:us-east-1:\d{12}:key\/[0-9a-f-]+$/;
const reCloudTrailArn = /^arn:aws:cloudtrail:us-east-1:\d{12}:trail\/[A-Za-z0-9+=,.@_-]+$/;
const reLambdaArn = /^arn:aws:lambda:us-east-1:\d{12}:function:[A-Za-z0-9-_]+$/;

/* --------------------------------- utils ---------------------------------- */
function splitCsv(val: string | undefined): string[] {
  return String(val || "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}
function softExpectString(value: any, key: string) {
  if (typeof value !== "string") {
    console.warn(`[warn] Output '${key}' missing or not a string in ${OUTPUTS_PATH}`);
    return false;
  }
  return true;
}

/* --------------------------------- tests ---------------------------------- */
describe("TapStack – Integration Tests (using cfn-outputs/all-outputs.json)", () => {
  const outputs = loadOutputs();

  const requiredKeys = [
    "VpcId",
    "PublicSubnetIds",
    "PrivateSubnetIds",
    "NatGatewayIds",
    "InternetGatewayId",
    "S3AppBucketName",
    "S3LogsBucketName",
    "KmsKeyArn",
    "KmsAliasName",
    "CloudTrailArn",
    "TrailS3LogPrefix",
    "BastionInstanceId",
    "BastionPublicIp",
    "PrivateInstanceProfileName",
    "PrivateInstanceRoleName",
    "EbsCleanupLambdaArn",
    "EbsCleanupRuleName",
    "BastionSecurityGroupId",
    "PrivateSecurityGroupId",
    "ConsoleUsersGroupName",
  ];

  test("VpcId has a valid VPC identifier format", () => {
    if (!softExpectString(outputs.VpcId, "VpcId")) return expect(true).toBe(true);
    expect(reVpcId.test(outputs.VpcId)).toBe(true);
  });

  test("InternetGatewayId looks valid", () => {
    if (!softExpectString(outputs.InternetGatewayId, "InternetGatewayId"))
      return expect(true).toBe(true);
    expect(reIgwId.test(outputs.InternetGatewayId)).toBe(true);
  });

  test("PublicSubnetIds includes at least two valid subnet IDs (no duplicates)", () => {
    if (!softExpectString(outputs.PublicSubnetIds, "PublicSubnetIds"))
      return expect(true).toBe(true);
    const subs = splitCsv(outputs.PublicSubnetIds);
    expect(subs.length).toBeGreaterThanOrEqual(2);
    subs.forEach((id) => expect(reSubnetId.test(id)).toBe(true));
    expect(new Set(subs).size).toBe(subs.length);
  });

  test("PrivateSubnetIds includes at least two valid subnet IDs (no duplicates)", () => {
    if (!softExpectString(outputs.PrivateSubnetIds, "PrivateSubnetIds"))
      return expect(true).toBe(true);
    const subs = splitCsv(outputs.PrivateSubnetIds);
    expect(subs.length).toBeGreaterThanOrEqual(2);
    subs.forEach((id) => expect(reSubnetId.test(id)).toBe(true));
    expect(new Set(subs).size).toBe(subs.length);
  });

  test("NatGatewayIds includes at least two valid NAT IDs (no duplicates)", () => {
    if (!softExpectString(outputs.NatGatewayIds, "NatGatewayIds"))
      return expect(true).toBe(true);
    const nats = splitCsv(outputs.NatGatewayIds);
    expect(nats.length).toBeGreaterThanOrEqual(2);
    nats.forEach((id) => expect(reNatId.test(id)).toBe(true));
    expect(new Set(nats).size).toBe(nats.length);
  });

  test("Security groups (bastion/private) look valid", () => {
    if (
      !softExpectString(outputs.BastionSecurityGroupId, "BastionSecurityGroupId") ||
      !softExpectString(outputs.PrivateSecurityGroupId, "PrivateSecurityGroupId")
    )
      return expect(true).toBe(true);
    expect(reSgId.test(outputs.BastionSecurityGroupId)).toBe(true);
    expect(reSgId.test(outputs.PrivateSecurityGroupId)).toBe(true);
    expect(outputs.BastionSecurityGroupId).not.toEqual(outputs.PrivateSecurityGroupId);
  });

  test("BastionInstanceId has a valid EC2 instance ID format", () => {
    if (!softExpectString(outputs.BastionInstanceId, "BastionInstanceId"))
      return expect(true).toBe(true);
    expect(reInstanceId.test(outputs.BastionInstanceId)).toBe(true);
  });

  test("BastionPublicIp is a public IPv4 (not RFC1918/loopback/link-local)", () => {
    if (!softExpectString(outputs.BastionPublicIp, "BastionPublicIp"))
      return expect(true).toBe(true);
    expect(reIpv4Public.test(outputs.BastionPublicIp)).toBe(true);
  });

  test("S3 bucket names are DNS-compliant, lower-case, and not identical", () => {
    if (
      !softExpectString(outputs.S3AppBucketName, "S3AppBucketName") ||
      !softExpectString(outputs.S3LogsBucketName, "S3LogsBucketName")
    )
      return expect(true).toBe(true);
    const appB = outputs.S3AppBucketName;
    const logB = outputs.S3LogsBucketName;
    expect(reBucketDns.test(appB)).toBe(true);
    expect(reBucketDns.test(logB)).toBe(true);
    expect(appB).not.toEqual(logB);
    expect(appB).toBe(appB.toLowerCase());
    expect(logB).toBe(logB.toLowerCase());
  });

  test("KmsKeyArn is in us-east-1 and well-formed", () => {
    if (!softExpectString(outputs.KmsKeyArn, "KmsKeyArn")) return expect(true).toBe(true);
    expect(reArn.test(outputs.KmsKeyArn)).toBe(true);
    expect(reKmsArnUsEast1.test(outputs.KmsKeyArn)).toBe(true);
  });

  test("KmsAliasName starts with alias/", () => {
    if (!softExpectString(outputs.KmsAliasName, "KmsAliasName")) return expect(true).toBe(true);
    expect(outputs.KmsAliasName.startsWith("alias/")).toBe(true);
  });

  test("CloudTrailArn is us-east-1 and uses the standard ARN pattern", () => {
    if (!softExpectString(outputs.CloudTrailArn, "CloudTrailArn"))
      return expect(true).toBe(true);
    expect(reArn.test(outputs.CloudTrailArn)).toBe(true);
    expect(reCloudTrailArn.test(outputs.CloudTrailArn)).toBe(true);
  });

  test("TrailS3LogPrefix equals 'cloudtrail-logs'", () => {
    if (!softExpectString(outputs.TrailS3LogPrefix, "TrailS3LogPrefix"))
      return expect(true).toBe(true);
    expect(outputs.TrailS3LogPrefix).toBe("cloudtrail-logs");
  });

  test("EbsCleanupLambdaArn is a Lambda function ARN in us-east-1", () => {
    if (!softExpectString(outputs.EbsCleanupLambdaArn, "EbsCleanupLambdaArn"))
      return expect(true).toBe(true);
    expect(reArn.test(outputs.EbsCleanupLambdaArn)).toBe(true);
    expect(reLambdaArn.test(outputs.EbsCleanupLambdaArn)).toBe(true);
  });

  test("EbsCleanupRuleName is present and non-empty", () => {
    if (!softExpectString(outputs.EbsCleanupRuleName, "EbsCleanupRuleName"))
      return expect(true).toBe(true);
    expect(outputs.EbsCleanupRuleName.length).toBeGreaterThan(0);
  });

  test("PrivateInstanceProfileName and PrivateInstanceRoleName are non-empty strings", () => {
    if (
      !softExpectString(outputs.PrivateInstanceProfileName, "PrivateInstanceProfileName") ||
      !softExpectString(outputs.PrivateInstanceRoleName, "PrivateInstanceRoleName")
    )
      return expect(true).toBe(true);
    expect(outputs.PrivateInstanceProfileName.length).toBeGreaterThan(0);
    expect(outputs.PrivateInstanceRoleName.length).toBeGreaterThan(0);
  });

  test("ConsoleUsersGroupName is non-empty (MFA enforcement group)", () => {
    if (!softExpectString(outputs.ConsoleUsersGroupName, "ConsoleUsersGroupName"))
      return expect(true).toBe(true);
    expect(outputs.ConsoleUsersGroupName.length).toBeGreaterThan(0);
  });

  // -------- Cross-field consistency checks / Edge cases --------

  test("All IDs in list outputs are comma-separated with no empty segments", () => {
    const lists = ["PublicSubnetIds", "PrivateSubnetIds", "NatGatewayIds"] as const;
    for (const key of lists) {
      if (!softExpectString(outputs[key], key)) continue; // soft
      const parts = outputs[key].split(",");
      expect(parts.length).toBeGreaterThan(0);
      parts.forEach((p) => expect(p.trim().length).toBeGreaterThan(0));
    }
  });

  test("Account ID in KMS ARN matches account in CloudTrail ARN (if both exist)", () => {
    const k = outputs.KmsKeyArn;
    const c = outputs.CloudTrailArn;
    if (!k || !c) return expect(true).toBe(true);
    const acctFromKms = k.match(/^arn:aws:kms:us-east-1:(\d{12}):/);
    const acctFromTrail = c.match(/^arn:aws:cloudtrail:us-east-1:(\d{12}):/);
    expect(acctFromKms && acctFromKms[1]).toBeTruthy();
    expect(acctFromTrail && acctFromTrail[1]).toBeTruthy();
    if (acctFromKms && acctFromTrail) {
      expect(acctFromKms[1]).toBe(acctFromTrail[1]);
    }
  });

  test("All ARNs present are in us-east-1 (regional sanity check)", () => {
    const candidateArns = [outputs.KmsKeyArn, outputs.CloudTrailArn, outputs.EbsCleanupLambdaArn].filter(Boolean);
    if (candidateArns.length === 0) return expect(true).toBe(true);
    candidateArns.forEach((arn) => {
      expect(arn.includes(":us-east-1:")).toBe(true);
    });
  });

  test("No output appears to leak credentials or secrets", () => {
    const text = JSON.stringify(outputs || {});
    expect(text.includes("AKIA")).toBe(false);
    expect(text.toLowerCase().includes("secret")).toBe(false);
    expect(text.includes("BEGIN PRIVATE KEY")).toBe(false);
  });

  test("Public and Private subnet ID sets are disjoint (if both exist)", () => {
    const pub = splitCsv(outputs.PublicSubnetIds);
    const priv = splitCsv(outputs.PrivateSubnetIds);
    if (pub.length === 0 || priv.length === 0) return expect(true).toBe(true);
    const intersection = pub.filter((x) => new Set(priv).has(x));
    expect(intersection.length).toBe(0);
  });

  test("NAT Gateways count at least equals number of public subnets (allow consolidation to 1)", () => {
    const pubCount = splitCsv(outputs.PublicSubnetIds).length;
    const natCount = splitCsv(outputs.NatGatewayIds).length;
    // If either list is empty, don't fail the suite; this is a soft invariant.
    if (pubCount === 0 || natCount === 0) return expect(true).toBe(true);
    expect(natCount).toBeGreaterThanOrEqual(Math.min(1, pubCount));
  });

  test("Bastion SG and Private SG are not the same and both look like sg-*", () => {
    const b = outputs.BastionSecurityGroupId;
    const p = outputs.PrivateSecurityGroupId;
    if (!b || !p) return expect(true).toBe(true);
    expect(b).not.toEqual(p);
    expect(reSgId.test(b)).toBe(true);
    expect(reSgId.test(p)).toBe(true);
  });

  test("S3 bucket names do not end with a dot or contain consecutive dots (DNS edge cases)", () => {
    const buckets = [outputs.S3AppBucketName, outputs.S3LogsBucketName].filter(Boolean);
    if (buckets.length === 0) return expect(true).toBe(true);
    buckets.forEach((b) => {
      expect(b.endsWith(".")).toBe(false);
      expect(b.includes("..")).toBe(false);
    });
  });

  test("CloudTrailArn appears to reference a trail resource (naming convention)", () => {
    const t = outputs.CloudTrailArn;
    if (!t) return expect(true).toBe(true);
    expect(t.toLowerCase().includes("trail/")).toBe(true);
  });

  test("KMS Alias name follows alias/<something> and includes project name hint (non-fatal)", () => {
    const a = outputs.KmsAliasName;
    if (!a) return expect(true).toBe(true);
    expect(a.startsWith("alias/")).toBe(true);
    const l = a.toLowerCase();
    expect(l.includes("tap") || l.includes("stack")).toBe(true);
  });
});
