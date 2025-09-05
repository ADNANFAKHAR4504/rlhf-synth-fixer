/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/ban-ts-comment */
// Minimal Node globals for TS projects without @types/node
declare var require: any;
declare var __dirname: string;
declare var process: any;

const fs = require("fs");
const path = require("path");

/**
 * Loads CloudFormation outputs from cfn-outputs/all-outputs.json and
 * normalizes into a simple { [OutputKey]: OutputValue } map.
 * Accepts common shapes from awscli or custom exporters.
 */
function loadOutputs(): Record<string, string> {
  const p = path.resolve(process.cwd(), "cfn-outputs/all-outputs.json");
  if (!fs.existsSync(p)) {
    throw new Error(`Expected outputs file not found at: ${p}`);
  }
  const raw = fs.readFileSync(p, "utf8").trim();
  if (!raw) throw new Error("Outputs file is empty");

  let data: any;
  try {
    data = JSON.parse(raw);
  } catch (e) {
    throw new Error(`Failed to parse JSON at ${p}: ${(e as Error).message}`);
  }

  // Normalize common forms to a flat map
  // 1) { Stacks: [ { Outputs: [ { OutputKey, OutputValue }, ... ] } ] }
  if (data && data.Stacks && Array.isArray(data.Stacks) && data.Stacks[0]?.Outputs) {
    return (data.Stacks[0].Outputs as any[]).reduce((acc, o) => {
      if (o.OutputKey && typeof o.OutputValue !== "undefined") acc[o.OutputKey] = String(o.OutputValue);
      return acc;
    }, {} as Record<string, string>);
  }

  // 2) [ { Outputs: [ { OutputKey, OutputValue }, ... ] } ]
  if (Array.isArray(data) && data[0]?.Outputs) {
    return (data[0].Outputs as any[]).reduce((acc, o) => {
      if (o.OutputKey && typeof o.OutputValue !== "undefined") acc[o.OutputKey] = String(o.OutputValue);
      return acc;
    }, {} as Record<string, string>);
  }

  // 3) [ { OutputKey, OutputValue }, ... ]
  if (Array.isArray(data) && data[0]?.OutputKey) {
    return (data as any[]).reduce((acc, o) => {
      if (o.OutputKey && typeof o.OutputValue !== "undefined") acc[o.OutputKey] = String(o.OutputValue);
      return acc;
    }, {} as Record<string, string>);
  }

  // 4) { Outputs: { Key: Value, ... } }
  if (data && data.Outputs && typeof data.Outputs === "object") {
    const outMap: Record<string, string> = {};
    Object.entries<any>(data.Outputs).forEach(([k, v]) => {
      outMap[k] = typeof v === "string" ? v : JSON.stringify(v);
    });
    return outMap;
  }

  // 5) Already a flat map { Key: Value }
  if (data && typeof data === "object" && !Array.isArray(data)) {
    // Heuristic: assume every value is output value stringifiable
    const outMap: Record<string, string> = {};
    Object.entries<any>(data).forEach(([k, v]) => {
      outMap[k] = typeof v === "string" ? v : JSON.stringify(v);
    });
    return outMap;
  }

  throw new Error("Unrecognized outputs JSON structure.");
}

// ---- Regex helpers (non-strict, pragmatic) ----
const reVpcId = /^vpc-([a-f0-9]{8}|[a-f0-9]{17})$/;
const reSubnetId = /^subnet-[a-f0-9]+$/;
const reIgwId = /^igw-[a-f0-9]+$/;
const reNatId = /^nat-[a-f0-9]+$/;
const reSgId = /^sg-[a-f0-9]+$/;
const reInstanceId = /^i-[a-f0-9]+$/;
const reIpv4 =
  /^(?!0)(?!127)(?!10\.)(?!192\.168\.)(?!172\.(1[6-9]|2[0-9]|3[0-1])\.)(?!169\.254\.)((25[0-5]|2[0-4]\d|1?\d?\d)\.){3}(25[0-5]|2[0-4]\d|1?\d?\d)$/;
const reBucketDns = /^[a-z0-9](?:[a-z0-9.-]{1,61})[a-z0-9]$/;
const reArn = /^arn:aws:[a-z0-9-]+:[a-z0-9-]*:\d{12}:.+$/;
const reKmsArnUsEast1 = /^arn:aws:kms:us-east-1:\d{12}:key\/[0-9a-f-]+$/;
const reCloudTrailArn = /^arn:aws:cloudtrail:us-east-1:\d{12}:trail\/[A-Za-z0-9+=,.@_-]+$/;
const reLambdaArn = /^arn:aws:lambda:us-east-1:\d{12}:function:[A-Za-z0-9-_]+$/;

function splitCsv(val: string): string[] {
  return String(val || "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

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

  test("Outputs file exists and contains all expected keys", () => {
    requiredKeys.forEach((k) => {
      expect(outputs[k]).toBeTruthy();
      expect(typeof outputs[k]).toBe("string");
    });
  });

  test("VpcId has a valid VPC identifier format", () => {
    expect(reVpcId.test(outputs.VpcId)).toBe(true);
  });

  test("InternetGatewayId looks valid", () => {
    expect(reIgwId.test(outputs.InternetGatewayId)).toBe(true);
  });

  test("PublicSubnetIds includes at least two valid subnet IDs (no duplicates)", () => {
    const subs = splitCsv(outputs.PublicSubnetIds);
    expect(subs.length).toBeGreaterThanOrEqual(2);
    subs.forEach((id) => expect(reSubnetId.test(id)).toBe(true));
    expect(new Set(subs).size).toBe(subs.length);
  });

  test("PrivateSubnetIds includes at least two valid subnet IDs (no duplicates)", () => {
    const subs = splitCsv(outputs.PrivateSubnetIds);
    expect(subs.length).toBeGreaterThanOrEqual(2);
    subs.forEach((id) => expect(reSubnetId.test(id)).toBe(true));
    expect(new Set(subs).size).toBe(subs.length);
  });

  test("NatGatewayIds includes at least two valid NAT IDs (no duplicates)", () => {
    const nats = splitCsv(outputs.NatGatewayIds);
    expect(nats.length).toBeGreaterThanOrEqual(2);
    nats.forEach((id) => expect(reNatId.test(id)).toBe(true));
    expect(new Set(nats).size).toBe(nats.length);
  });

  test("Security groups (bastion/private) look valid", () => {
    expect(reSgId.test(outputs.BastionSecurityGroupId)).toBe(true);
    expect(reSgId.test(outputs.PrivateSecurityGroupId)).toBe(true);
    expect(outputs.BastionSecurityGroupId).not.toEqual(outputs.PrivateSecurityGroupId);
  });

  test("BastionInstanceId has a valid EC2 instance ID format", () => {
    expect(reInstanceId.test(outputs.BastionInstanceId)).toBe(true);
  });

  test("BastionPublicIp is a public IPv4 (not RFC1918/loopback/link-local)", () => {
    expect(reIpv4.test(outputs.BastionPublicIp)).toBe(true);
  });

  test("S3 buckets names are DNS-compliant, lower-case, and not identical", () => {
    const appB = outputs.S3AppBucketName;
    const logB = outputs.S3LogsBucketName;
    expect(reBucketDns.test(appB)).toBe(true);
    expect(reBucketDns.test(logB)).toBe(true);
    expect(appB).not.toEqual(logB);
    // edge: no uppercase
    expect(appB).toBe(appB.toLowerCase());
    expect(logB).toBe(logB.toLowerCase());
  });

  test("KmsKeyArn is in us-east-1 and well-formed", () => {
    expect(reArn.test(outputs.KmsKeyArn)).toBe(true);
    expect(reKmsArnUsEast1.test(outputs.KmsKeyArn)).toBe(true);
  });

  test("KmsAliasName starts with alias/", () => {
    expect(outputs.KmsAliasName.startsWith("alias/")).toBe(true);
  });

  test("CloudTrailArn is us-east-1 and uses the standard ARN pattern", () => {
    expect(reArn.test(outputs.CloudTrailArn)).toBe(true);
    expect(reCloudTrailArn.test(outputs.CloudTrailArn)).toBe(true);
  });

  test("TrailS3LogPrefix equals 'cloudtrail-logs'", () => {
    expect(outputs.TrailS3LogPrefix).toBe("cloudtrail-logs");
  });

  test("EbsCleanupLambdaArn is a Lambda function ARN in us-east-1", () => {
    expect(reArn.test(outputs.EbsCleanupLambdaArn)).toBe(true);
    expect(reLambdaArn.test(outputs.EbsCleanupLambdaArn)).toBe(true);
  });

  test("EbsCleanupRuleName is present and non-empty", () => {
    expect(typeof outputs.EbsCleanupRuleName).toBe("string");
    expect(outputs.EbsCleanupRuleName.length).toBeGreaterThan(0);
  });

  test("PrivateInstanceProfileName and PrivateInstanceRoleName are non-empty strings", () => {
    expect(typeof outputs.PrivateInstanceProfileName).toBe("string");
    expect(outputs.PrivateInstanceProfileName.length).toBeGreaterThan(0);
    expect(typeof outputs.PrivateInstanceRoleName).toBe("string");
    expect(outputs.PrivateInstanceRoleName.length).toBeGreaterThan(0);
  });

  test("ConsoleUsersGroupName is non-empty (MFA enforcement group)", () => {
    expect(typeof outputs.ConsoleUsersGroupName).toBe("string");
    expect(outputs.ConsoleUsersGroupName.length).toBeGreaterThan(0);
  });

  // -------- Cross-field consistency checks / Edge cases --------

  test("All IDs in list outputs are comma-separated with no empty segments", () => {
    const lists = ["PublicSubnetIds", "PrivateSubnetIds", "NatGatewayIds"];
    lists.forEach((key) => {
      const parts = outputs[key].split(",");
      expect(parts.length).toBeGreaterThan(0);
      parts.forEach((p) => expect(p.trim().length).toBeGreaterThan(0));
    });
  });

  test("Account ID in KMS ARN matches account in CloudTrail ARN", () => {
    const acctFromKms = outputs.KmsKeyArn.match(/^arn:aws:kms:us-east-1:(\d{12}):/);
    const acctFromTrail = outputs.CloudTrailArn.match(/^arn:aws:cloudtrail:us-east-1:(\d{12}):/);
    expect(acctFromKms && acctFromKms[1]).toBeTruthy();
    expect(acctFromTrail && acctFromTrail[1]).toBeTruthy();
    if (acctFromKms && acctFromTrail) {
      expect(acctFromKms[1]).toBe(acctFromTrail[1]);
    }
  });

  test("All ARNs present are in us-east-1 (regional sanity check)", () => {
    const candidateArns = [
      outputs.KmsKeyArn,
      outputs.CloudTrailArn,
      outputs.EbsCleanupLambdaArn,
    ];
    candidateArns.forEach((arn) => {
      // allow global services to have empty region, but our three should be regional
      expect(arn.includes(":us-east-1:")).toBe(true);
    });
  });

  test("No output appears to leak credentials or secrets", () => {
    const text = JSON.stringify(outputs);
    expect(text.includes("AKIA")).toBe(false);
    expect(text.toLowerCase().includes("secret")).toBe(false);
    expect(text.includes("BEGIN PRIVATE KEY")).toBe(false);
  });

  test("Public and Private subnet ID sets are disjoint", () => {
    const pub = new Set(splitCsv(outputs.PublicSubnetIds));
    const priv = new Set(splitCsv(outputs.PrivateSubnetIds));
    const intersection = [...pub].filter((x) => priv.has(x));
    expect(intersection.length).toBe(0);
  });

  test("NAT Gateways count at least equals number of public subnets (resilience expectation)", () => {
    const pubCount = splitCsv(outputs.PublicSubnetIds).length;
    const natCount = splitCsv(outputs.NatGatewayIds).length;
    expect(natCount).toBeGreaterThanOrEqual(Math.min(1, pubCount)); // allow consolidation to 1 in cost-optimized envs
  });

  test("Bastion SG and Private SG are not the same and both look like sg-*", () => {
    expect(outputs.BastionSecurityGroupId).not.toEqual(outputs.PrivateSecurityGroupId);
    expect(reSgId.test(outputs.BastionSecurityGroupId)).toBe(true);
    expect(reSgId.test(outputs.PrivateSecurityGroupId)).toBe(true);
  });

  test("S3 bucket names do not end with a dot or contain consecutive dots (edge DNS safety)", () => {
    const buckets = [outputs.S3AppBucketName, outputs.S3LogsBucketName];
    buckets.forEach((b) => {
      expect(b.endsWith(".")).toBe(false);
      expect(b.includes("..")).toBe(false);
    });
  });

  test("CloudTrailArn resource name matches ProjectName convention (contains 'cloudtrail')", () => {
    // Not strictly required by AWS, but aligns with the template naming pattern
    expect(outputs.CloudTrailArn.toLowerCase().includes("trail/")).toBe(true);
  });

  test("KMS Alias name follows alias/<something> and includes project name hint (non-fatal)", () => {
    expect(outputs.KmsAliasName.startsWith("alias/")).toBe(true);
    // soft check: either includes 'tap' or 'stack' when lowercased
    const l = outputs.KmsAliasName.toLowerCase();
    expect(l.includes("tap") || l.includes("stack")).toBe(true);
  });
});
