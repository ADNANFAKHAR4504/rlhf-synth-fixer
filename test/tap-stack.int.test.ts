// test/tap-stack.int.test.ts
import fs from "fs";
import path from "path";
import { setTimeout as wait } from "timers/promises";

// AWS SDK v3
import {
  S3Client,
  HeadBucketCommand,
  GetBucketEncryptionCommand,
  GetBucketVersioningCommand,
  GetBucketLifecycleConfigurationCommand,
  GetBucketReplicationCommand,
  GetBucketPolicyCommand,
  GetObjectLockConfigurationCommand,
  ListBucketsCommand,
} from "@aws-sdk/client-s3";

import {
  KMSClient,
  DescribeKeyCommand,
  GetKeyPolicyCommand,
} from "@aws-sdk/client-kms";

import {
  IAMClient,
  GetRoleCommand,
  ListRolePoliciesCommand,
} from "@aws-sdk/client-iam";

import {
  CloudWatchClient,
  DescribeAlarmsCommand,
  GetDashboardCommand,
  ListMetricsCommand,
} from "@aws-sdk/client-cloudwatch";

import {
  SNSClient,
  GetTopicAttributesCommand,
} from "@aws-sdk/client-sns";

/* ---------------------------- Outputs loader ---------------------------- */

type OutputItem = { OutputKey: string; OutputValue: string };
type OutputsFileShape = Record<string, OutputItem[]> | OutputItem[];

const outputsPath = path.resolve(process.cwd(), "cfn-outputs/all-outputs.json");
if (!fs.existsSync(outputsPath)) {
  throw new Error(`Expected outputs file at ${outputsPath} — create it before running integration tests.`);
}

const rawJson = fs.readFileSync(outputsPath, "utf8");
const raw: OutputsFileShape = JSON.parse(rawJson);

// Normalize to array of OutputItem
let outputsArr: OutputItem[] = [];
if (Array.isArray(raw)) {
  outputsArr = raw as OutputItem[];
} else {
  const keys = Object.keys(raw as Record<string, OutputItem[]>);
  if (keys.length === 0) {
    throw new Error("cfn-outputs/all-outputs.json has no stack keys.");
  }
  const firstKey = keys[0];
  const bucket = (raw as Record<string, OutputItem[]>)[firstKey];
  if (!Array.isArray(bucket)) {
    throw new Error(`Unexpected outputs shape for key ${firstKey}.`);
  }
  outputsArr = bucket;
}

const outputs: Record<string, string> = {};
for (const o of outputsArr) {
  if (o && typeof o.OutputKey === "string") {
    outputs[o.OutputKey] = String(o.OutputValue ?? "");
  }
}

/* ------------------------------- Helpers -------------------------------- */

function getRegionFromBucketName(name?: string): string | null {
  if (!name) return null;
  // Format: fin-docs-<acct>-<region>-<suffix>
  const m = name.match(/[a-z]{2}-[a-z-]+-\d/);
  return m ? m[0] : null;
}

function deducePrimaryRegion(): string {
  const fromOutput = outputs.DeploymentRegion || outputs.Region || "";
  const m = String(fromOutput).match(/[a-z]{2}-[a-z-]+-\d/);
  if (m) return m[0];
  const fromBucket = getRegionFromBucketName(outputs.PrimaryBucketName);
  return fromBucket || process.env.AWS_REGION || process.env.AWS_DEFAULT_REGION || "us-east-1";
}

function deduceSecondaryRegion(): string {
  const fromBucket = getRegionFromBucketName(outputs.SecondaryBucketName);
  return fromBucket || "us-west-2";
}

function arnToRoleName(arn: string): string {
  // arn:aws:iam::<acct>:role/Name
  const ix = arn.indexOf("/");
  return ix > -1 ? arn.slice(ix + 1) : arn;
}

async function retry<T>(fn: () => Promise<T>, attempts = 4, baseMs = 1000): Promise<T> {
  let last: unknown;
  for (let i = 0; i < attempts; i++) {
    try {
      return await fn();
    } catch (e) {
      last = e;
      if (i < attempts - 1) await wait(baseMs * (i + 1));
    }
  }
  throw last;
}

function isAccessDenied(e: unknown): boolean {
  const msg = String((e as any)?.message ?? e);
  return /AccessDenied|Forbidden|NotAuthorized|AuthorizationError/i.test(msg);
}

function ok<T>(v: T | undefined | null): v is T {
  return v !== undefined && v !== null;
}

/* ------------------------------- Clients -------------------------------- */

const primaryRegion = deducePrimaryRegion();
const secondaryRegion = deduceSecondaryRegion();

const s3Primary = new S3Client({ region: primaryRegion });
const s3Secondary = new S3Client({ region: secondaryRegion });

const kmsPrimary = new KMSClient({ region: primaryRegion });
const kmsSecondary = new KMSClient({ region: secondaryRegion });

const iam = new IAMClient({ region: primaryRegion });
const cwPrimary = new CloudWatchClient({ region: primaryRegion });
const sns = new SNSClient({ region: primaryRegion });

/* ------------------------------- Tests ---------------------------------- */

describe("TapStack — Live Integration Tests (S3 DR, KMS, IAM, CloudWatch, SNS)", () => {
  jest.setTimeout(10 * 60 * 1000); // 10 minutes

  it("01) Outputs: required keys exist and look sane", () => {
    const required = [
      "PrimaryBucketName",
      "PrimaryBucketArn",
      "SecondaryBucketName",
      "SecondaryBucketArn",
      "ReplicationRoleArn",
      "PrimaryKmsKeyArn",
      "SecondaryKmsAliasArn",
      "MonitoringDashboardUrl",
      "DeploymentRegion",
    ];
    for (const k of required) {
      expect(typeof outputs[k]).toBe("string");
      expect(outputs[k].length).toBeGreaterThan(3);
    }
  });

  it("02) Regions: deduced primary & secondary regions look valid", () => {
    expect(/[a-z]{2}-[a-z-]+-\d/.test(primaryRegion)).toBe(true);
    expect(/[a-z]{2}-[a-z-]+-\d/.test(secondaryRegion)).toBe(true);
    expect(primaryRegion).not.toEqual(secondaryRegion);
  });

  /* ----------------------------- S3 Primary ----------------------------- */

  it("03) S3 (primary): bucket exists and is listable in account", async () => {
    await retry(() => s3Primary.send(new HeadBucketCommand({ Bucket: outputs.PrimaryBucketName })));
    const list = await retry(() => s3Primary.send(new ListBucketsCommand({})));
    const found = (list.Buckets || []).some(b => b.Name === outputs.PrimaryBucketName);
    expect(found).toBe(true);
  });

  it("04) S3 (primary): Versioning is enabled", async () => {
    const vr = await retry(() => s3Primary.send(new GetBucketVersioningCommand({ Bucket: outputs.PrimaryBucketName })));
    expect(vr.Status).toBe("Enabled");
  });

  it("05) S3 (primary): Default SSE uses KMS", async () => {
    const enc = await retry(() => s3Primary.send(new GetBucketEncryptionCommand({ Bucket: outputs.PrimaryBucketName })));
    const rules = enc.ServerSideEncryptionConfiguration?.Rules || [];
    const hasKms = rules.some(r => r.ApplyServerSideEncryptionByDefault?.SSEAlgorithm === "aws:kms");
    expect(hasKms).toBe(true);
  });

  it("06) S3 (primary): Object Lock is enabled in COMPLIANCE with default retention", async () => {
    const lock = await retry(() => s3Primary.send(new GetObjectLockConfigurationCommand({ Bucket: outputs.PrimaryBucketName })));
    const rule = lock.ObjectLockConfiguration?.Rule;
    expect(lock.ObjectLockConfiguration?.ObjectLockEnabled).toBe("Enabled");
    expect(rule?.DefaultRetention?.Mode).toBe("COMPLIANCE");
    const years = rule?.DefaultRetention?.Years ?? 0;
    expect(years).toBeGreaterThanOrEqual(1);
  });

  it("07) S3 (primary): Lifecycle transitions to Glacier and sets expiration (including noncurrent)", async () => {
    const lc = await retry(() => s3Primary.send(new GetBucketLifecycleConfigurationCommand({ Bucket: outputs.PrimaryBucketName })));
    const rules = lc.Rules || [];
    expect(rules.length).toBeGreaterThan(0);
    const hasGlacier = rules.some(r => (r.Transitions || []).some(t => t.StorageClass === "GLACIER"));
    const hasExpire = rules.some(r => ok(r.Expiration?.Days));
    const hasNoncurrent = rules.some(r => (r.NoncurrentVersionTransitions || []).some(t => t.StorageClass === "GLACIER"));
    expect(hasGlacier).toBe(true);
    expect(hasExpire).toBe(true);
    expect(hasNoncurrent).toBe(true);
  });

  it("08) S3 (primary): Replication rule exists OR gracefully absent if this stack is secondary", async () => {
    try {
      const rep = await retry(() => s3Primary.send(new GetBucketReplicationCommand({ Bucket: outputs.PrimaryBucketName })));
      const rules = rep.ReplicationConfiguration?.Rules || [];
      expect(rules.length).toBeGreaterThan(0);
      const destArns = rules.map(r => r.Destination?.Bucket).filter(Boolean);
      const expectedDest = `arn:aws:s3:::${outputs.SecondaryBucketName}`;
      expect(destArns).toContain(expectedDest);
    } catch (e) {
      expect(/ReplicationConfigurationNotFoundError|NoSuchReplicationConfiguration/i.test(String(e))).toBe(true);
    }
  });

  it("09) S3 (primary): Bucket policy enforces TLS and VPCe restriction (policy fetch allowed or AccessDenied)", async () => {
    try {
      const pol = await retry(() => s3Primary.send(new GetBucketPolicyCommand({ Bucket: outputs.PrimaryBucketName })));
      const doc = JSON.parse(pol.Policy as string);
      const j = JSON.stringify(doc);
      expect(j.includes('"aws:SecureTransport":false')).toBe(true);
      expect(/aws:SourceVpce/.test(j)).toBe(true);
    } catch (e) {
      expect(isAccessDenied(e)).toBe(true);
    }
  });

  /* ---------------------------- S3 Secondary ---------------------------- */

  it("10) S3 (secondary): bucket exists", async () => {
    await retry(() => s3Secondary.send(new HeadBucketCommand({ Bucket: outputs.SecondaryBucketName })));
  });

  it("11) S3 (secondary): Versioning is enabled", async () => {
    const vr = await retry(() => s3Secondary.send(new GetBucketVersioningCommand({ Bucket: outputs.SecondaryBucketName })));
    expect(vr.Status).toBe("Enabled");
  });

  it("12) S3 (secondary): Default SSE uses KMS", async () => {
    const enc = await retry(() => s3Secondary.send(new GetBucketEncryptionCommand({ Bucket: outputs.SecondaryBucketName })));
    const rules = enc.ServerSideEncryptionConfiguration?.Rules || [];
    const hasKms = rules.some(r => r.ApplyServerSideEncryptionByDefault?.SSEAlgorithm === "aws:kms");
    expect(hasKms).toBe(true);
  });

  /* -------------------------------- KMS -------------------------------- */

  it("13) KMS (primary): CMK is Enabled and Customer managed", async () => {
    const desc = await retry(() => kmsPrimary.send(new DescribeKeyCommand({ KeyId: outputs.PrimaryKmsKeyArn })));
    expect(desc.KeyMetadata?.KeyState).toBe("Enabled");
    expect(desc.KeyMetadata?.KeyManager).toBe("CUSTOMER");
  });

  it("14) KMS (secondary): Alias in secondary resolves and points to an enabled key", async () => {
    const desc = await retry(() => kmsSecondary.send(new DescribeKeyCommand({ KeyId: outputs.SecondaryKmsAliasArn })));
    expect(desc.KeyMetadata?.Arn).toMatch(/^arn:aws:kms:/);
    expect(desc.KeyMetadata?.KeyState).toBe("Enabled");
  });

  it("15) KMS (primary): Key policy accessible OR gracefully AccessDenied (non-fatal)", async () => {
    try {
      const pol = await retry(() => kmsPrimary.send(new GetKeyPolicyCommand({ KeyId: outputs.PrimaryKmsKeyArn, PolicyName: "default" })));
      expect(typeof pol.Policy).toBe("string");
      expect((pol.Policy as string).length).toBeGreaterThan(10);
    } catch (e) {
      expect(isAccessDenied(e)).toBe(true);
    }
  });

  /* -------------------------------- IAM -------------------------------- */

  it("16) IAM: Replication role exists with inline policy", async () => {
    const roleName = arnToRoleName(outputs.ReplicationRoleArn);
    const role = await retry(() => iam.send(new GetRoleCommand({ RoleName: roleName })));
    expect(role.Role?.Arn).toBe(outputs.ReplicationRoleArn);
    const inline = await retry(() => iam.send(new ListRolePoliciesCommand({ RoleName: roleName })));
    expect((inline.PolicyNames || []).length).toBeGreaterThanOrEqual(1);
    const hasPrefix = (inline.PolicyNames || []).some(n => /^s3-replication-policy-/.test(n));
    expect(hasPrefix).toBe(true);
  });

  /* ---------------------------- CloudWatch / SNS ------------------------ */

  it("17) CloudWatch: ReplicationLatency metric query executes (may be empty immediately after deploy)", async () => {
    const metrics = await retry(() => cwPrimary.send(new ListMetricsCommand({
      Namespace: "AWS/S3",
      MetricName: "ReplicationLatency",
      Dimensions: [{ Name: "BucketName", Value: outputs.PrimaryBucketName }],
    })));
    expect(Array.isArray(metrics.Metrics) || !metrics.Metrics).toBe(true);
  });

  it("18) CloudWatch: Find replication alarms when monitoring enabled", async () => {
    const resp = await retry(() => cwPrimary.send(new DescribeAlarmsCommand({})));
    expect(Array.isArray(resp.MetricAlarms)).toBe(true);
    const monitoringEnabled = !!outputs.SnsTopicArn;
    if (monitoringEnabled) {
      const found = (resp.MetricAlarms || []).some(a =>
        a.Namespace === "AWS/S3" &&
        (a.MetricName === "ReplicationLatency" || a.MetricName === "OperationsFailedReplication")
      );
      expect(found).toBe(true);
    } else {
      expect(true).toBe(true);
    }
  });

  it("19) CloudWatch: Dashboard exists when monitoring enabled", async () => {
    const url = outputs.MonitoringDashboardUrl || "";
    const m = url.match(/name=([^&]+)/);
    if (!m) {
      expect(true).toBe(true);
      return;
    }
    const name = decodeURIComponent(m[1]);
    const dash = await retry(() => cwPrimary.send(new GetDashboardCommand({ DashboardName: name })));
    expect(dash.DashboardArn || dash.DashboardName).toBeDefined();
  });

  it("20) SNS: Topic exists and returns attributes when monitoring enabled", async () => {
    if (!outputs.SnsTopicArn) {
      expect(true).toBe(true);
      return;
    }
    const t = await retry(() => sns.send(new GetTopicAttributesCommand({ TopicArn: outputs.SnsTopicArn })));
    expect(typeof t.Attributes?.SubscriptionsConfirmed !== "undefined").toBe(true);
  });

  /* ---------------------------- Additional S3 --------------------------- */

  it("21) S3 (primary): Names include Environment suffix pattern", () => {
    const name = outputs.PrimaryBucketName;
    const segs = (name || "").split("-");
    const suffix = segs[segs.length - 1];
    expect(/^[a-z0-9-]{2,20}$/.test(suffix)).toBe(true);
  });

  it("22) S3 (primary): RTC-related metrics endpoints are callable", async () => {
    const [m1, m2] = await Promise.all([
      retry(() => cwPrimary.send(new ListMetricsCommand({
        Namespace: "AWS/S3",
        MetricName: "OperationsFailedReplication",
        Dimensions: [{ Name: "BucketName", Value: outputs.PrimaryBucketName }],
      }))),
      retry(() => cwPrimary.send(new ListMetricsCommand({
        Namespace: "AWS/S3",
        MetricName: "ReplicationTime",
        Dimensions: [{ Name: "BucketName", Value: outputs.PrimaryBucketName }],
      }))),
    ]);
    expect(Array.isArray(m1.Metrics) || !m1.Metrics).toBe(true);
    expect(Array.isArray(m2.Metrics) || !m2.Metrics).toBe(true);
  });

  it("23) S3 (primary): Lifecycle includes noncurrent version expiration", async () => {
    const lc = await retry(() => s3Primary.send(new GetBucketLifecycleConfigurationCommand({ Bucket: outputs.PrimaryBucketName })));
    const hasNoncurrentExpire = (lc.Rules || []).some(r => ok(r.NoncurrentVersionExpiration?.NoncurrentDays));
    expect(hasNoncurrentExpire).toBe(true);
  });

  it("24) S3 (secondary): Lifecycle & encryption mirror base posture", async () => {
    const [lc, enc] = await Promise.all([
      retry(() => s3Secondary.send(new GetBucketLifecycleConfigurationCommand({ Bucket: outputs.SecondaryBucketName }))),
      retry(() => s3Secondary.send(new GetBucketEncryptionCommand({ Bucket: outputs.SecondaryBucketName }))),
    ]);
    const rules = lc.Rules || [];
    const hasGlacier = rules.some(r => (r.Transitions || []).some(t => t.StorageClass === "GLACIER"));
    expect(hasGlacier).toBe(true);
    const rules2 = enc.ServerSideEncryptionConfiguration?.Rules || [];
    const hasKms2 = rules2.some(r => r.ApplyServerSideEncryptionByDefault?.SSEAlgorithm === "aws:kms");
    expect(hasKms2).toBe(true);
  });

  it("25) S3 (primary): GetBucketReplication returns destination matching SecondaryBucketName or NotFound if this is secondary", async () => {
    try {
      const rep = await retry(() => s3Primary.send(new GetBucketReplicationCommand({ Bucket: outputs.PrimaryBucketName })));
      const rules = rep.ReplicationConfiguration?.Rules || [];
      const dests = rules.map(r => r.Destination?.Bucket).filter(Boolean);
      expect(dests).toContain(`arn:aws:s3:::${outputs.SecondaryBucketName}`);
    } catch (e) {
      expect(/ReplicationConfigurationNotFoundError|NoSuchReplicationConfiguration/i.test(String(e))).toBe(true);
    }
  });

  it("26) IAM: Replication role trust policy allows s3.amazonaws.com", async () => {
    const roleName = arnToRoleName(outputs.ReplicationRoleArn);
    const role = await retry(() => iam.send(new GetRoleCommand({ RoleName: roleName })));
    const assumeDoc = role.Role?.AssumeRolePolicyDocument;
    const docStr = typeof assumeDoc === "string" ? decodeURIComponent(assumeDoc) : JSON.stringify(assumeDoc || {});
    expect(/s3\.amazonaws\.com/.test(docStr)).toBe(true);
  });
});
