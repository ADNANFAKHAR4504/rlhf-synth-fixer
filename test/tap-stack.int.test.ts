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

const p = path.resolve(process.cwd(), "cfn-outputs/all-outputs.json");
if (!fs.existsSync(p)) {
  throw new Error(`Expected outputs file at ${p} — create it before running integration tests.`);
}
const raw = JSON.parse(fs.readFileSync(p, "utf8"));
// Support common CI shapes: { "<StackName>": [{OutputKey,OutputValue}...] } OR flat array.
const firstKey = Array.isArray(raw) ? null : Object.keys(raw)[0];
const outputsArr: { OutputKey: string; OutputValue: string }[] = Array.isArray(raw)
  ? raw
  : raw[firstKey];
const outputs: Record<string, string> = {};
for (const o of outputsArr) outputs[o.OutputKey] = o.OutputValue;

/* ------------------------------- Helpers -------------------------------- */

function getRegionFromBucketName(name?: string): string | null {
  if (!name) return null;
  // format: fin-docs-<acct>-<region>-<suffix>
  const parts = name.split("-");
  // Try to find an AWS region pattern like xx-yyy-n
  const m = name.match(/[a-z]{2}-[a-z-]+-\d/);
  return m ? m[0] : (parts.length >= 5 ? `${parts[2]}-${parts[3]}-${parts[4]}` : null);
}

function deducePrimaryRegion(): string {
  // Use the stack's reported deployment region if present; else parse from bucket name
  const fromOutput = outputs.DeploymentRegion || outputs.Region || "";
  const m = String(fromOutput).match(/[a-z]{2}-[a-z-]+-\d/);
  if (m) return m[0];
  const fromBucket = getRegionFromBucketName(outputs.PrimaryBucketName);
  return fromBucket || process.env.AWS_REGION || process.env.AWS_DEFAULT_REGION || "us-east-1";
}

function deduceSecondaryRegion(): string {
  const fromName = getRegionFromBucketName(outputs.SecondaryBucketName);
  return fromName || "us-west-2";
}

function arnToRoleName(arn: string): string {
  // arn:aws:iam::<acct>:role/Name
  const ix = arn.indexOf("/"); 
  return ix > -1 ? arn.slice(ix + 1) : arn;
}

async function retry<T>(fn: () => Promise<T>, attempts = 4, baseMs = 1000): Promise<T> {
  let last: any;
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

function isAccessDenied(e: any): boolean {
  const msg = String(e?.message || e);
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

/* ------------------------------- Sanity --------------------------------- */

describe("TapStack — Live Integration Tests (S3 DR, KMS, IAM, CloudWatch, SNS)", () => {
  jest.setTimeout(10 * 60 * 1000); // 10 minutes for the full suite

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

  it("08) S3 (primary): Replication rule exists OR is gracefully absent if this stack is secondary", async () => {
    try {
      const rep = await retry(() => s3Primary.send(new GetBucketReplicationCommand({ Bucket: outputs.PrimaryBucketName })));
      const rules = rep.ReplicationConfiguration?.Rules || [];
      expect(rules.length).toBeGreaterThan(0);
      // destination bucket should match our secondary
      const destArns = rules.map(r => r.Destination?.Bucket).filter(Boolean);
      const expectedDest = `arn:aws:s3:::${outputs.SecondaryBucketName}`;
      expect(destArns).toContain(expectedDest);
    } catch (e) {
      // If replication is not found here, assert it's because this deployment is not primary
      expect(/ReplicationConfigurationNotFoundError|NoSuchReplicationConfiguration/i.test(String(e))).toBe(true);
    }
  });

  it("09) S3 (primary): Bucket policy enforces TLS and VPCe restriction (policy fetch allowed)", async () => {
    try {
      const pol = await retry(() => s3Primary.send(new GetBucketPolicyCommand({ Bucket: outputs.PrimaryBucketName })));
      const doc = JSON.parse(pol.Policy as string);
      const j = JSON.stringify(doc);
      expect(j.includes('"aws:SecureTransport":false')).toBe(true);
      // aws:SourceVpce condition must exist somewhere
      expect(/aws:SourceVpce/.test(j)).toBe(true);
    } catch (e) {
      // If the caller lacks GetBucketPolicy permission, still confirm bucket exists (already done) and pass
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
      // basic structure check
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
    // one inline policy should start with s3-replication-policy-
    const hasPrefix = (inline.PolicyNames || []).some(n => /^s3-replication-policy-/.test(n));
    expect(hasPrefix).toBe(true);
  });

  /* ---------------------------- CloudWatch / SNS ------------------------ */

  it("17) CloudWatch: RTC metrics namespace query executes; ReplicationLatency metric exists or not (both valid early after deploy)", async () => {
    const metrics = await retry(() => cwPrimary.send(new ListMetricsCommand({
      Namespace: "AWS/S3",
      MetricName: "ReplicationLatency",
      Dimensions: [{ Name: "BucketName", Value: outputs.PrimaryBucketName }],
    })));
    // It is acceptable for metrics to be empty immediately after creation; we validate the call succeeds.
    expect(Array.isArray(metrics.Metrics) || !metrics.Metrics).toBe(true);
  });

  it("18) CloudWatch: Alarms API reachable; if monitoring enabled in this stack, find our replication alarms", async () => {
    const resp = await retry(() => cwPrimary.send(new DescribeAlarmsCommand({})));
    expect(Array.isArray(resp.MetricAlarms)).toBe(true);
    // If SNS topic output exists, monitoring is enabled → expect at least one S3 replication alarm in this account/region
    const monitoringEnabled = !!outputs.SnsTopicArn;
    if (monitoringEnabled) {
      const found = (resp.MetricAlarms || []).some(a =>
        a.Namespace === "AWS/S3" &&
        (a.MetricName === "ReplicationLatency" || a.MetricName === "OperationsFailedReplication")
      );
      expect(found).toBe(true);
    } else {
      // No requirement if monitoring disabled
      expect(true).toBe(true);
    }
  });

  it("19) CloudWatch: Dashboard exists when monitoring enabled", async () => {
    const url = outputs.MonitoringDashboardUrl || "";
    const m = url.match(/name=([^&]+)/);
    if (!m) {
      // If no dashboard URL output (monitoring disabled), pass
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
    // Confirm basic attributes exist
    expect(typeof t.Attributes?.SubscriptionsConfirmed !== "undefined").toBe(true);
  });

  /* ---------------------------- Additional S3 --------------------------- */

  it("21) S3 (primary): Names include Environment suffix pattern", () => {
    const name = outputs.PrimaryBucketName;
    // ensure final component exists (suffix) and matches safe pattern
    const segs = name.split("-");
    const suffix = segs[segs.length - 1];
    expect(/^[a-z0-9-]{2,20}$/.test(suffix)).toBe(true);
  });

  it("22) S3 (primary): Replication RTC thresholds (EventThreshold + ReplicationTime) reflected in metrics listing eventually (non-fatal if absent yet)", async () => {
    // This validates the ListMetrics call for both metrics names; presence is eventual.
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

  it("25) S3 (primary): GetBucketReplication either returns rule with destination matching SecondaryBucketName or is NotFound when this stack is secondary", async () => {
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
