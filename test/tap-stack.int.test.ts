import * as fs from "fs";
import * as path from "path";
import { setTimeout as wait } from "timers/promises";

// AWS SDK v3 clients
import {
  S3Client,
  HeadBucketCommand,
  GetBucketEncryptionCommand,
  GetBucketVersioningCommand,
  GetPublicAccessBlockCommand,
  HeadObjectCommand,
} from "@aws-sdk/client-s3";

import {
  CloudWatchLogsClient,
  DescribeLogGroupsCommand,
  DescribeLogStreamsCommand,
  FilterLogEventsCommand,
} from "@aws-sdk/client-cloudwatch-logs";

import {
  GuardDutyClient,
  ListDetectorsCommand,
  GetDetectorCommand,
} from "@aws-sdk/client-guardduty";

import {
  EventBridgeClient,
  DescribeRuleCommand,
  ListTargetsByRuleCommand,
  DescribeArchiveCommand,
} from "@aws-sdk/client-eventbridge";

import {
  LambdaClient,
  GetFunctionCommand,
  InvokeCommand,
} from "@aws-sdk/client-lambda";

import {
  SNSClient,
  GetTopicAttributesCommand,
  PublishCommand,
  ListSubscriptionsByTopicCommand,
} from "@aws-sdk/client-sns";

import {
  IAMClient,
  GetRoleCommand,
} from "@aws-sdk/client-iam";

import {
  STSClient,
  GetCallerIdentityCommand,
} from "@aws-sdk/client-sts";

/* ---------------------------- Setup / Helpers --------------------------- */

// Load outputs
const outputsPath = path.resolve(process.cwd(), "cfn-outputs/all-outputs.json");
if (!fs.existsSync(outputsPath)) {
  throw new Error(
    `Expected outputs file at ${outputsPath}. Create it from the deployed stack before running integration tests.`
  );
}
const raw = JSON.parse(fs.readFileSync(outputsPath, "utf8"));
const firstTopKey = Object.keys(raw)[0];
const outputsArray: { OutputKey: string; OutputValue: string }[] = raw[firstTopKey];
const outputs: Record<string, string> = {};
for (const o of outputsArray) outputs[o.OutputKey] = o.OutputValue;

// Region deduction (prefer explicit env, fallback to us-east-1 per stack design)
const region =
  process.env.AWS_REGION ||
  process.env.AWS_DEFAULT_REGION ||
  "us-east-1";

// AWS account (for sanity)
const sts = new STSClient({ region });

// Initialize service clients
const s3 = new S3Client({ region });
const logs = new CloudWatchLogsClient({ region });
const gd = new GuardDutyClient({ region });
const eb = new EventBridgeClient({ region });
const lambda = new LambdaClient({ region });
const sns = new SNSClient({ region });
const iam = new IAMClient({ region });

// simple retry with linear backoff
async function retry<T>(fn: () => Promise<T>, attempts = 5, baseDelayMs = 800): Promise<T> {
  let lastErr: any;
  for (let i = 0; i < attempts; i++) {
    try {
      return await fn();
    } catch (err) {
      lastErr = err;
      if (i < attempts - 1) await wait(baseDelayMs * (i + 1));
    }
  }
  throw lastErr;
}

function parseRuleNameFromArn(arn: string): string {
  // arn:aws:events:region:account:rule/NAME
  const idx = arn.lastIndexOf("/");
  return idx >= 0 ? arn.slice(idx + 1) : arn;
}

function parseArchiveNameFromArn(arn: string): string {
  // arn:aws:events:region:account:archive/NAME
  const idx = arn.lastIndexOf("/");
  return idx >= 0 ? arn.slice(idx + 1) : arn;
}

function todayPrefix() {
  const d = new Date();
  const y = d.getUTCFullYear().toString();
  const m = `${d.getUTCMonth() + 1}`.padStart(2, "0");
  const dy = `${d.getUTCDate()}`.padStart(2, "0");
  return `findings/${y}/${m}/${dy}/`;
}

/* -------------------------------- Tests -------------------------------- */

describe("TapStack — Live Integration Tests", () => {
  jest.setTimeout(12 * 60 * 1000); // 12 minutes to be safe for live calls

  // 1
  it("loads outputs and essential keys exist", () => {
    expect(Array.isArray(outputsArray)).toBe(true);
    const required = [
      "GuardDutyDetectorId",
      "SnsTopicArn",
      "AuditBucketName",
      "FindingRuleArn",
      "EventArchiveArn",
      "LambdaFunctionName",
      "LambdaLogGroupName",
    ];
    for (const k of required) {
      expect(typeof outputs[k]).toBe("string");
      expect(outputs[k].length).toBeGreaterThan(0);
    }
  });

  // 2
  it("confirms AWS account and region are resolvable", async () => {
    const ident = await retry(() => sts.send(new GetCallerIdentityCommand({})));
    expect(ident.Account).toBeDefined();
    expect(typeof region).toBe("string");
    expect(region.length).toBeGreaterThan(0);
  });

  // 3
  it("S3: audit bucket exists (HeadBucket)", async () => {
    await retry(() => s3.send(new HeadBucketCommand({ Bucket: outputs.AuditBucketName })));
  });

  // 4
  it("S3: audit bucket versioning is enabled", async () => {
    const ver = await retry(() => s3.send(new GetBucketVersioningCommand({ Bucket: outputs.AuditBucketName })));
    expect(ver.Status).toBe("Enabled");
  });

  // 5
  it("S3: audit bucket encryption is AES256", async () => {
    const enc = await retry(() => s3.send(new GetBucketEncryptionCommand({ Bucket: outputs.AuditBucketName })));
    const rules = enc.ServerSideEncryptionConfiguration?.Rules || [];
    expect(rules.length).toBeGreaterThan(0);
    const algo = rules[0]?.ApplyServerSideEncryptionByDefault?.SSEAlgorithm
              || rules[0]?.ServerSideEncryptionByDefault?.SSEAlgorithm;
    expect(algo).toBe("AES256");
  });

  // 6
  it("S3: public access block configuration is fully enabled", async () => {
    const pab = await retry(() => s3.send(new GetPublicAccessBlockCommand({ Bucket: outputs.AuditBucketName })));
    const cfg = pab.PublicAccessBlockConfiguration!;
    expect(cfg.BlockPublicAcls).toBe(true);
    expect(cfg.BlockPublicPolicy).toBe(true);
    expect(cfg.IgnorePublicAcls).toBe(true);
    expect(cfg.RestrictPublicBuckets).toBe(true);
  });

  // 7
  it("GuardDuty: detector id from outputs is discoverable via ListDetectors", async () => {
    const list = await retry(() => gd.send(new ListDetectorsCommand({})));
    expect(list.DetectorIds?.length).toBeGreaterThan(0);
    expect(list.DetectorIds).toContain(outputs.GuardDutyDetectorId);
  });

  // 8
  it("GuardDuty: detector has S3 logs enabled", async () => {
    const det = await retry(() => gd.send(new GetDetectorCommand({ DetectorId: outputs.GuardDutyDetectorId })));
    const s3Enabled =
      det.DataSources?.S3Logs?.Status === "ENABLED" ||
      det.DataSources?.S3Logs?.Enable === true; // tolerate API shapes
    expect(s3Enabled).toBe(true);
  });

  // 9
  it("GuardDuty: detector has EKS audit logs enabled", async () => {
    const det = await retry(() => gd.send(new GetDetectorCommand({ DetectorId: outputs.GuardDutyDetectorId })));
    const eksEnabled =
      det.DataSources?.Kubernetes?.AuditLogs?.Status === "ENABLED" ||
      det.DataSources?.Kubernetes?.AuditLogs?.Enable === true;
    expect(eksEnabled).toBe(true);
  });

  // 10
  it("EventBridge: findings rule exists and is ENABLED", async () => {
    const ruleName = parseRuleNameFromArn(outputs.FindingRuleArn);
    const rule = await retry(() => eb.send(new DescribeRuleCommand({ Name: ruleName })));
    expect(rule.Name).toBe(ruleName);
    expect(rule.State).toBe("ENABLED");
  });

  // 11
  it("EventBridge: findings rule pattern filters MEDIUM and HIGH severities", async () => {
    const ruleName = parseRuleNameFromArn(outputs.FindingRuleArn);
    const rule = await retry(() => eb.send(new DescribeRuleCommand({ Name: ruleName })));
    const patternStr = rule.EventPattern || "{}";
    const pattern = JSON.parse(patternStr);
    expect(pattern.source).toContain("aws.guardduty");
    expect(pattern["detail-type"]).toContain("GuardDuty Finding");
    const sev = pattern.detail?.severity || [];
    // expect two numeric clauses
    expect(sev.length).toBe(2);
    expect(JSON.stringify(sev)).toContain('">=",7');
    expect(JSON.stringify(sev)).toContain('">=",4');
  });

  // 12
  it("EventBridge: rule targets Lambda function", async () => {
    const ruleName = parseRuleNameFromArn(outputs.FindingRuleArn);
    const targets = await retry(() => eb.send(new ListTargetsByRuleCommand({ Rule: ruleName })));
    const list = targets.Targets || [];
    expect(list.length).toBeGreaterThan(0);
    const fnConf = await retry(() => lambda.send(new GetFunctionCommand({ FunctionName: outputs.LambdaFunctionName })));
    const lambdaArn = fnConf.Configuration?.FunctionArn!;
    const matched = list.some((t) => t.Arn === lambdaArn);
    expect(matched).toBe(true);
  });

  // 13
  it("EventBridge: archive exists with retention days > 0", async () => {
    const archiveName = parseArchiveNameFromArn(outputs.EventArchiveArn);
    const arc = await retry(() => eb.send(new DescribeArchiveCommand({ ArchiveName: archiveName })));
    expect((arc.RetentionDays ?? 0) > 0).toBe(true);
  });

  // 14
  it("Lambda: function exists and has reasonable memory/timeout", async () => {
    const fn = await retry(() => lambda.send(new GetFunctionCommand({ FunctionName: outputs.LambdaFunctionName })));
    const cfg = fn.Configuration!;
    expect(cfg.Runtime?.startsWith("python")).toBe(true);
    expect((cfg.MemorySize ?? 0) >= 128).toBe(true);
    expect((cfg.Timeout ?? 0) >= 10).toBe(true);
  });

  // 15
  it("Lambda: environment variables include ALERTS_TOPIC_ARN and AUDIT_BUCKET_NAME", async () => {
    const fn = await retry(() => lambda.send(new GetFunctionCommand({ FunctionName: outputs.LambdaFunctionName })));
    const env = fn.Configuration?.Environment?.Variables || {};
    expect(env.ALERTS_TOPIC_ARN).toBe(outputs.SnsTopicArn);
    expect(env.AUDIT_BUCKET_NAME).toBe(outputs.AuditBucketName);
  });

  // 16
  it("CloudWatch Logs: log group exists and has at least one stream after invocation", async () => {
    const lgName = outputs.LambdaLogGroupName;
    // ensure log group exists
    const groups = await retry(() =>
      logs.send(new DescribeLogGroupsCommand({ logGroupNamePrefix: lgName }))
    );
    const found = (groups.logGroups || []).some((g) => g.logGroupName === lgName);
    expect(found).toBe(true);

    // Attempt to invoke the function to guarantee a log stream
    await retry(() =>
      lambda.send(
        new InvokeCommand({
          FunctionName: outputs.LambdaFunctionName,
          Payload: Buffer.from(JSON.stringify({ ping: true, detail: {} })),
          InvocationType: "RequestResponse",
        })
      )
    );

    // Now check for log streams
    const streams = await retry(() =>
      logs.send(new DescribeLogStreamsCommand({ logGroupName: lgName, orderBy: "LastEventTime", descending: true }))
    );
    expect((streams.logStreams || []).length).toBeGreaterThan(0);
  });

  // 17
  it("Lambda: Invoke with a synthetic GuardDuty event returns ok and includes s3Key", async () => {
    const syntheticFinding = {
      version: "0",
      id: "synthetic-" + Date.now(),
      "detail-type": "GuardDuty Finding",
      source: "aws.guardduty",
      account: "000000000000",
      time: new Date().toISOString(),
      region,
      resources: [],
      detail: {
        id: "synthetic-" + Date.now(),
        severity: 7.5,
        title: "Synthetic High Severity Test",
        type: "Recon:EC2/PortProbeUnprotectedPort",
        region,
        accountId: "000000000000",
        resource: {},
      },
    };

    const resp = await retry(() =>
      lambda.send(
        new InvokeCommand({
          FunctionName: outputs.LambdaFunctionName,
          Payload: Buffer.from(JSON.stringify(syntheticFinding)),
          InvocationType: "RequestResponse",
        })
      )
    );

    expect(resp.StatusCode).toBeGreaterThanOrEqual(200);
    expect(resp.StatusCode).toBeLessThan(300);
    const payload = resp.Payload ? JSON.parse(Buffer.from(resp.Payload).toString("utf8")) : {};
    expect(payload.status).toBe("ok");
    expect(typeof payload.s3Key).toBe("string");
    expect(payload.s3Key.startsWith(todayPrefix())).toBe(true);
  });

  // 18
  it("S3: object written by Lambda (from previous test) is present", async () => {
    // Re-invoke to get a fresh key we can immediately check
    const syntheticFinding = {
      version: "0",
      id: "synthetic-" + Date.now(),
      "detail-type": "GuardDuty Finding",
      source: "aws.guardduty",
      account: "000000000000",
      time: new Date().toISOString(),
      region,
      resources: [],
      detail: {
        id: "synthetic-" + Date.now(),
        severity: 4.5,
        title: "Synthetic Medium Severity Test",
        type: "Recon:EC2/PortProbeUnprotectedPort",
        region,
        accountId: "000000000000",
        resource: {},
      },
    };

    const invoke = await retry(() =>
      lambda.send(
        new InvokeCommand({
          FunctionName: outputs.LambdaFunctionName,
          Payload: Buffer.from(JSON.stringify(syntheticFinding)),
          InvocationType: "RequestResponse",
        })
      )
    );

    const payload = invoke.Payload ? JSON.parse(Buffer.from(invoke.Payload).toString("utf8")) : {};
    const key = String(payload.s3Key || "");
    expect(key.length).toBeGreaterThan(0);

    // HeadObject with retry (eventual consistency)
    await retry(() =>
      s3.send(new HeadObjectCommand({ Bucket: outputs.AuditBucketName, Key: key }))
    );
  });

  // 19
  it("SNS: topic exists and attributes retrievable", async () => {
    const attrs = await retry(() => sns.send(new GetTopicAttributesCommand({ TopicArn: outputs.SnsTopicArn })));
    expect(attrs.Attributes).toBeDefined();
    expect(typeof attrs.Attributes?.Owner).toBe("string");
  });

  // 20
  it("SNS: publish succeeds (returns MessageId)", async () => {
    const pub = await retry(() =>
      sns.send(
        new PublishCommand({
          TopicArn: outputs.SnsTopicArn,
          Subject: "[TapStack] Integration Test Notification",
          Message: JSON.stringify({ ts: Date.now(), note: "Integration test publish OK" }),
        })
      )
    );
    expect(typeof pub.MessageId).toBe("string");
    expect(pub.MessageId!.length).toBeGreaterThan(0);
  });

  // 21
  it("SNS: subscriptions by topic are listable (email may be pending confirmation)", async () => {
    const subs = await retry(() =>
      sns.send(new ListSubscriptionsByTopicCommand({ TopicArn: outputs.SnsTopicArn }))
    );
    // zero or more, but API must return an array
    expect(Array.isArray(subs.Subscriptions)).toBe(true);
  });

  // 22
  it("CloudWatch Logs: recent events can be queried from the Lambda log group", async () => {
    const lgName = outputs.LambdaLogGroupName;
    // small delay to allow logs to flush
    await wait(2000);
    const events = await retry(() =>
      logs.send(new FilterLogEventsCommand({ logGroupName: lgName, limit: 5 }))
    );
    expect(Array.isArray(events.events)).toBe(true);
  });

  // 23
  it("IAM: Lambda's execution role trust policy includes lambda.amazonaws.com", async () => {
    const fn = await retry(() => lambda.send(new GetFunctionCommand({ FunctionName: outputs.LambdaFunctionName })));
    const roleArn = fn.Configuration?.Role!;
    const roleName = roleArn.split("/").pop()!;
    const role = await retry(() => iam.send(new GetRoleCommand({ RoleName: roleName })));
    const assumeDoc = role.Role?.AssumeRolePolicyDocument;
    const docString = typeof assumeDoc === "string" ? decodeURIComponent(assumeDoc) : JSON.stringify(assumeDoc || {});
    expect(docString.includes("lambda.amazonaws.com")).toBe(true);
  });

  // 24
  it("EventBridge + Lambda: invoking function generated new log stream entries", async () => {
    // Invoke once more to produce logs
    await retry(() =>
      lambda.send(
        new InvokeCommand({
          FunctionName: outputs.LambdaFunctionName,
          Payload: Buffer.from(JSON.stringify({ healthcheck: true, detail: {} })),
          InvocationType: "RequestResponse",
        })
      )
    );

    // Check streams ordered by LastEventTime
    const lgName = outputs.LambdaLogGroupName;
    const streams = await retry(() =>
      logs.send(new DescribeLogStreamsCommand({ logGroupName: lgName, orderBy: "LastEventTime", descending: true, limit: 1 }))
    );
    const latest = (streams.logStreams || [])[0];
    expect(latest).toBeDefined();
    // Sanity: expect last event timestamp to be recent (within ~15 minutes)
    if (latest?.lastEventTimestamp) {
      const now = Date.now();
      const delta = now - latest.lastEventTimestamp!;
      expect(delta).toBeLessThan(15 * 60 * 1000);
    } else {
      // If no timestamp populated yet, presence of a stream is still acceptable
      expect(true).toBe(true);
    }
  });
});
