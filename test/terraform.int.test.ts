/**
 * Integration tests (read-only) for the secure infra stack.
 *
 * Requirements:
 * - Do NOT run terraform commands
 * - Read outputs from cfn-outputs/all-outputs.json
 * - Use AWS SDK v3 to verify live AWS resources
 * - Check encryption, monitoring, alerting, least-privilege indicators, region lock, tagging (when feasible via APIs)
 */

import * as fs from "fs";
import * as path from "path";

// AWS SDK v3 clients
import {
  CloudTrailClient,
  DescribeTrailsCommand,
  GetTrailStatusCommand
} from "@aws-sdk/client-cloudtrail";
import {
  CloudWatchClient,
  DescribeAlarmsCommand
} from "@aws-sdk/client-cloudwatch";
import {
  CloudWatchLogsClient,
  DescribeLogGroupsCommand
} from "@aws-sdk/client-cloudwatch-logs";
import {
  DescribeKeyCommand,
  GetKeyRotationStatusCommand,
  KMSClient,
  ListResourceTagsCommand as KmsListResourceTagsCommand
} from "@aws-sdk/client-kms";
import {
  GetBucketEncryptionCommand,
  GetBucketTaggingCommand,
  GetBucketVersioningCommand,
  GetPublicAccessBlockCommand,
  HeadBucketCommand,
  S3Client
} from "@aws-sdk/client-s3";
import {
  GetTopicAttributesCommand,
  SNSClient
} from "@aws-sdk/client-sns";

// --- Helper to read the CI/CD outputs file --- 
// Support multiple output locations for different CI environments (LocalStack vs AWS)
const outputPaths = [
  path.resolve(process.cwd(), "cfn-outputs/all-outputs.json"),
  path.resolve(process.cwd(), "cdk-outputs/flat-outputs.json"),
  path.resolve(process.cwd(), "cfn-outputs/flat-outputs.json"),
];
type TfOutput<T = unknown> = { sensitive: boolean; type: unknown; value: T };

// Wrapper type for flat outputs (simple key-value) vs structured outputs (TfOutput format)
type OutputValue = TfOutput | string;

function findOutputsFile(): string | null {
  for (const p of outputPaths) {
    if (fs.existsSync(p)) {
      return p;
    }
  }
  return null;
}

function readOutputs(): Record<string, TfOutput> {
  const foundPath = findOutputsFile();
  if (!foundPath) {
    throw new Error(
      `Expected outputs JSON at one of: ${outputPaths.join(", ")} (created by CI step "Get Deployment Outputs").`
    );
  }
  const raw = fs.readFileSync(foundPath, "utf-8");
  const parsed = JSON.parse(raw);
  if (!parsed || typeof parsed !== "object") {
    throw new Error("Outputs JSON is invalid or empty.");
  }
  // Normalize flat outputs (string values) to TfOutput format
  const normalized: Record<string, TfOutput> = {};
  for (const [key, value] of Object.entries(parsed)) {
    if (typeof value === "string") {
      // Flat output format: convert to TfOutput structure
      normalized[key] = { sensitive: false, type: "string", value };
    } else if (value && typeof value === "object" && "value" in (value as object)) {
      // Already in TfOutput format
      normalized[key] = value as TfOutput;
    } else {
      // Unknown format, wrap as-is
      normalized[key] = { sensitive: false, type: typeof value, value };
    }
  }
  return normalized;
}

function val<T = string>(obj: Record<string, TfOutput>, key: string): T {
  if (!obj[key]) {
    throw new Error(`Missing expected output key: ${key}`);
  }
  return obj[key].value as T;
}

function valOptional<T = string>(obj: Record<string, TfOutput>, key: string): T {
  if (!obj[key]) {
    throw new Error(`Missing expected output key: ${key}`);
  }
  return obj[key].value as T;
}

// --- Globals set in beforeAll ---
let region = "us-west-2";
let appBucket = "";
let trailBucket = "";
let kmsKeyArn = "";
let cloudTrailArn = "";
let cloudTrailLogGroupName = "";
let snsTopicArn = "";

// AWS clients (initialized after region known)
let s3: S3Client;
let kms: KMSClient;
let logs: CloudWatchLogsClient;
let trail: CloudTrailClient;
let cw: CloudWatchClient;
let sns: SNSClient;

beforeAll(() => {
  const outputs = readOutputs();

  // Region must be us-west-2 (prompt requirement)
  region = val<string>(outputs, "aws_region");
  if (region !== "us-west-2") {
    throw new Error(
      `Region lock failed: expected us-west-2, got ${region}. Ensure variable validation enforces this.`
    );
  }

  // Required outputs from main.tf
  appBucket = val<string>(outputs, "app_bucket_name");
  trailBucket = val<string>(outputs, "cloudtrail_bucket_name");
  kmsKeyArn = val<string>(outputs, "kms_key_arn");
  cloudTrailArn = valOptional<string>(outputs, "cloudtrail_arn");
  cloudTrailLogGroupName = valOptional<string>(outputs, "cloudtrail_log_group");
  snsTopicArn = val<string>(outputs, "security_alerts_topic_arn");

  // Initialize region-scoped AWS clients
  s3 = new S3Client({ region });
  kms = new KMSClient({ region });
  logs = new CloudWatchLogsClient({ region });
  trail = new CloudTrailClient({ region });
  cw = new CloudWatchClient({ region });
  sns = new SNSClient({ region });
});

describe("Integration: Region Enforcement", () => {
  it("outputs file must declare us-west-2", () => {
    expect(region).toBe("us-west-2");
  });
});

describe("Integration: KMS (CMK) configuration", () => {
  it("KMS key exists and is enabled", async () => {
    const { KeyMetadata } = await kms.send(new DescribeKeyCommand({ KeyId: kmsKeyArn }));
    expect(KeyMetadata?.Arn).toBe(kmsKeyArn);
    expect(KeyMetadata?.Enabled).toBe(true);
  });

  it("KMS key rotation is enabled", async () => {
    const { KeyRotationEnabled } = await kms.send(
      new GetKeyRotationStatusCommand({ KeyId: kmsKeyArn })
    );
    expect(KeyRotationEnabled).toBe(true);
  });

  it("KMS key has tagging (non-empty or specific expected tags)", async () => {
    const tags = await kms.send(new KmsListResourceTagsCommand({ KeyId: kmsKeyArn }));
    expect(tags?.Tags).toBeDefined();
    expect((tags?.Tags ?? []).length).toBeGreaterThan(0);
  });
});

describe("Integration: S3 (application bucket)", () => {
  it("application bucket exists", async () => {
    await s3.send(new HeadBucketCommand({ Bucket: appBucket }));
  });

  it("application bucket has KMS encryption enabled", async () => {
    const enc = await s3.send(new GetBucketEncryptionCommand({ Bucket: appBucket }));
    const rules = enc.ServerSideEncryptionConfiguration?.Rules ?? [];
    const hasKms = rules.some(
      r => r.ApplyServerSideEncryptionByDefault?.SSEAlgorithm === "aws:kms"
    );
    expect(hasKms).toBe(true);
    // Verify it uses our specific KMS key
    const kmsRule = rules.find(r => r.ApplyServerSideEncryptionByDefault?.SSEAlgorithm === "aws:kms");
    expect(kmsRule?.ApplyServerSideEncryptionByDefault?.KMSMasterKeyID).toBe(kmsKeyArn);
  });

  it("application bucket has versioning enabled", async () => {
    const ver = await s3.send(new GetBucketVersioningCommand({ Bucket: appBucket }));
    expect(ver.Status).toBe("Enabled");
  });

  it("application bucket blocks all public access", async () => {
    const pab = await s3.send(new GetPublicAccessBlockCommand({ Bucket: appBucket }));
    expect(pab.PublicAccessBlockConfiguration?.BlockPublicAcls).toBe(true);
    expect(pab.PublicAccessBlockConfiguration?.BlockPublicPolicy).toBe(true);
    expect(pab.PublicAccessBlockConfiguration?.IgnorePublicAcls).toBe(true);
    expect(pab.PublicAccessBlockConfiguration?.RestrictPublicBuckets).toBe(true);
  });

  it("application bucket has tags applied", async () => {
    const out = await s3.send(new GetBucketTaggingCommand({ Bucket: appBucket }));
    expect(out.TagSet?.length).toBeGreaterThan(0);
    // Optional stricter checks:
    const keys = (out.TagSet ?? []).map(t => t.Key);
    expect(keys).toEqual(expect.arrayContaining(["Environment", "Project", "Owner", "ManagedBy"]));
  });
});

describe("Integration: S3 (CloudTrail logs bucket)", () => {
  it("trail bucket exists", async () => {
    await s3.send(new HeadBucketCommand({ Bucket: trailBucket }));
  });

  it("trail bucket has KMS encryption enabled", async () => {
    const enc = await s3.send(new GetBucketEncryptionCommand({ Bucket: trailBucket }));
    const rules = enc.ServerSideEncryptionConfiguration?.Rules ?? [];
    const hasKms = rules.some(
      r => r.ApplyServerSideEncryptionByDefault?.SSEAlgorithm === "aws:kms"
    );
    expect(hasKms).toBe(true);
    // Verify it uses our specific KMS key
    const kmsRule = rules.find(r => r.ApplyServerSideEncryptionByDefault?.SSEAlgorithm === "aws:kms");
    expect(kmsRule?.ApplyServerSideEncryptionByDefault?.KMSMasterKeyID).toBe(kmsKeyArn);
  });

  it("trail bucket has versioning enabled", async () => {
    const ver = await s3.send(new GetBucketVersioningCommand({ Bucket: trailBucket }));
    expect(ver.Status).toBe("Enabled");
  });

  it("trail bucket blocks all public access", async () => {
    const pab = await s3.send(new GetPublicAccessBlockCommand({ Bucket: trailBucket }));
    expect(pab.PublicAccessBlockConfiguration?.BlockPublicAcls).toBe(true);
    expect(pab.PublicAccessBlockConfiguration?.BlockPublicPolicy).toBe(true);
    expect(pab.PublicAccessBlockConfiguration?.IgnorePublicAcls).toBe(true);
    expect(pab.PublicAccessBlockConfiguration?.RestrictPublicBuckets).toBe(true);
  });

  it("trail bucket has tags applied", async () => {
    const out = await s3.send(new GetBucketTaggingCommand({ Bucket: trailBucket }));
    expect(out.TagSet?.length).toBeGreaterThan(0);
    const keys = (out.TagSet ?? []).map(t => t.Key);
    expect(keys).toEqual(expect.arrayContaining(["Environment", "Project", "Owner", "ManagedBy"]));
  });
});

describe("Integration: CloudWatch Logs (CloudTrail log group)", () => {
  it("log group exists and is KMS-encrypted", async () => {
    if (!cloudTrailLogGroupName || cloudTrailLogGroupName === "") {
      console.log("Skipping CloudWatch log group test - create_cloudtrail is false");
      return;
    }
    const res = await logs.send(
      new DescribeLogGroupsCommand({
        logGroupNamePrefix: cloudTrailLogGroupName
      })
    );
    const lg = (res.logGroups ?? []).find(l => l.logGroupName === cloudTrailLogGroupName);
    expect(lg).toBeDefined();
    expect(lg?.kmsKeyId).toBeDefined();
    expect(lg?.kmsKeyId).toBe(kmsKeyArn);
  });

  it("log group has appropriate retention period", async () => {
    if (!cloudTrailLogGroupName || cloudTrailLogGroupName === "") {
      console.log("Skipping CloudWatch log group retention test - create_cloudtrail is false");
      return;
    }
    const res = await logs.send(
      new DescribeLogGroupsCommand({
        logGroupNamePrefix: cloudTrailLogGroupName
      })
    );
    const lg = (res.logGroups ?? []).find(l => l.logGroupName === cloudTrailLogGroupName);
    expect(lg?.retentionInDays).toBe(90);
  });
});

describe("Integration: CloudTrail (logs to S3 + CloudWatch)", () => {
  it("trail exists and is healthy", async () => {
    if (!cloudTrailArn || cloudTrailArn === "") {
      console.log("Skipping CloudTrail test - create_cloudtrail is false");
      return;
    }
    // Name can be ARN or name; DescribeTrails accepts either in list
    const res = await trail.send(
      new DescribeTrailsCommand({ trailNameList: [cloudTrailArn], includeShadowTrails: false })
    );
    const t = (res.trailList ?? [])[0];
    expect(t).toBeDefined();
    expect(t?.TrailARN).toBe(cloudTrailArn);
    // Validate S3 + CW Logs config present
    expect(t?.S3BucketName).toBe(trailBucket);
    expect(t?.CloudWatchLogsLogGroupArn).toContain(cloudTrailLogGroupName);
    // Verify KMS encryption
    expect(t?.KmsKeyId).toBe(kmsKeyArn);
    // Verify it includes global service events
    expect(t?.IncludeGlobalServiceEvents).toBe(true);
  });

  it("trail logging is enabled", async () => {
    if (!cloudTrailArn || cloudTrailArn === "") {
      console.log("Skipping CloudTrail logging test - create_cloudtrail is false");
      return;
    }
    const status = await trail.send(new GetTrailStatusCommand({ Name: cloudTrailArn }));
    expect(status.IsLogging).toBe(true);
  });
});

describe("Integration: CloudWatch Alarm (unauthorized API requests)", () => {
  it("has an alarm based on UnauthorizedAPIRequests metric", async () => {
    if (!cloudTrailArn || cloudTrailArn === "") {
      console.log("Skipping CloudWatch alarm test - create_cloudtrail is false");
      return;
    }
    // We look for any alarm referencing metric name "UnauthorizedAPIRequests"
    const res = await cw.send(new DescribeAlarmsCommand({}));
    const alarms = res.MetricAlarms ?? [];
    const match = alarms.find(a =>
      (a.MetricName === "UnauthorizedAPIRequests") ||
      // Some SDK shapes use Metrics array for MetricMath alarms
      (Array.isArray(a.Metrics) && a.Metrics.some(m =>
        (m.MetricStat?.Metric?.MetricName === "UnauthorizedAPIRequests")
      ))
    );
    expect(match).toBeDefined();
  });
});

describe("Integration: SNS Topic (security alerts)", () => {
  it("SNS topic exists and is KMS-encrypted", async () => {
    const res = await sns.send(new GetTopicAttributesCommand({ TopicArn: snsTopicArn }));
    expect(res.Attributes).toBeDefined();
    // Confirm KMS master key ID matches our key
    const kmsKeyId = res.Attributes?.KmsMasterKeyId;
    expect(kmsKeyId).toBeDefined();
    expect(String(kmsKeyId)).toBe(kmsKeyArn);
  });

  it("SNS topic has proper policy for CloudWatch alarms", async () => {
    const res = await sns.send(new GetTopicAttributesCommand({ TopicArn: snsTopicArn }));
    const policy = res.Attributes?.Policy;
    expect(policy).toBeDefined();
    if (policy) {
      const parsedPolicy = JSON.parse(policy);
      const cloudWatchStatement = parsedPolicy.Statement.find((s: any) => 
        s.Principal?.Service === "cloudwatch.amazonaws.com"
      );
      expect(cloudWatchStatement).toBeDefined();
      expect(cloudWatchStatement?.Action).toBe("sns:Publish");
    }
  });
});

/**
 * Edge cases to harden guardrails:
 * - Missing outputs keys (handled in beforeAll via val())
 * - Region mismatch (handled in beforeAll)
 * - Buckets without required encryption/public access blocks
 * - Missing KMS rotation
 * - Trail configured but not logging
 */
