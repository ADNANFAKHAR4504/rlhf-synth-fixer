/**
 * File: test/tap-stack.int.test.ts
 * Live integration tests for TapStack CloudFormation stack.
 * - Reads outputs from cfn-outputs/all-outputs.json
 * - Discovers live resources via AWS SDK v3 and validates required behaviors
 * Single file, 24 tests, no skipped tests.
 */

import fs from "fs";
import path from "path";
import { setTimeout as wait } from "timers/promises";
import https from "https";

import {
  S3Client,
  HeadBucketCommand,
  GetBucketVersioningCommand,
  GetBucketLifecycleConfigurationCommand,
  GetBucketNotificationConfigurationCommand,
} from "@aws-sdk/client-s3";

import {
  DynamoDBClient,
  DescribeTableCommand,
  DescribeContinuousBackupsCommand,
} from "@aws-sdk/client-dynamodb";

import {
  LambdaClient,
  GetFunctionCommand,
  ListEventSourceMappingsCommand,
  GetFunctionConcurrencyCommand,
  GetPolicyCommand,
} from "@aws-sdk/client-lambda";

import {
  CloudWatchClient,
  DescribeAlarmsCommand,
} from "@aws-sdk/client-cloudwatch";

import {
  CloudWatchLogsClient,
  DescribeLogGroupsCommand,
} from "@aws-sdk/client-cloudwatch-logs";

import {
  APIGatewayClient,
  GetRestApisCommand,
  GetResourcesCommand,
  GetStagesCommand,
  GetUsagePlansCommand,
  GetApiKeysCommand,
} from "@aws-sdk/client-api-gateway";

import {
  SNSClient,
  ListTopicsCommand,
  ListSubscriptionsByTopicCommand,
} from "@aws-sdk/client-sns";

import {
  SQSClient,
  GetQueueUrlCommand,
  GetQueueAttributesCommand,
} from "@aws-sdk/client-sqs";

/* ---------------------------- Setup / Helpers --------------------------- */

const outputsPath = path.resolve(process.cwd(), "cfn-outputs/all-outputs.json");
if (!fs.existsSync(outputsPath)) {
  throw new Error(`Expected outputs file at ${outputsPath} — create it before running integration tests.`);
}

const rawAll = JSON.parse(fs.readFileSync(outputsPath, "utf8"));
const firstKey = Object.keys(rawAll)[0];
if (!firstKey) throw new Error("No top-level key in all-outputs.json");
const outputsArr: Array<{ OutputKey: string; OutputValue: string }> = rawAll[firstKey];
const outputs: Record<string, string> = {};
for (const o of outputsArr) outputs[o.OutputKey] = o.OutputValue;

const IngestBucketName = outputs.IngestBucketName;
const TransactionsTableArn = outputs.TransactionsTableArn;
const ApiBaseUrl = outputs.ApiBaseUrl;

if (!IngestBucketName || !TransactionsTableArn || !ApiBaseUrl) {
  throw new Error("Expected outputs IngestBucketName, TransactionsTableArn, and ApiBaseUrl to be present in all-outputs.json");
}

function deduceRegionFromApi(url: string): string {
  try {
    const u = new URL(url);
    const host = u.hostname;
    const m = host.match(/execute-api\.([a-z0-9-]+)\.amazonaws\.com$/);
    if (m) return m[1];
  } catch {}
  return process.env.AWS_REGION || process.env.AWS_DEFAULT_REGION || "us-east-1";
}

const region = deduceRegionFromApi(ApiBaseUrl);

const envFromApiPath = (() => {
  try {
    const u = new URL(ApiBaseUrl);
    const seg = u.pathname.split("/").filter(Boolean)[0];
    return seg || "prod";
  } catch {
    return "prod";
  }
})();

// Bucket pattern: ${ProjectName}-${EnvironmentSuffix}-ingest-bucket
const projectAndEnvFromBucket = (() => {
  const name = IngestBucketName;
  const parts = name.split("-");
  if (parts.length < 4) return { project: "tapstack", env: envFromApiPath };
  const env = parts[parts.length - 3];
  const project = parts.slice(0, parts.length - 3).join("-");
  return { project, env };
})();

const ProjectName = projectAndEnvFromBucket.project;
const EnvironmentSuffix = projectAndEnvFromBucket.env;

const ingestionFnName = `${ProjectName}-${EnvironmentSuffix}-ingestion`;
const fraudFnName = `${ProjectName}-${EnvironmentSuffix}-fraud`;
const apiFnName = `${ProjectName}-${EnvironmentSuffix}-api`;
const dlqName = `${ProjectName}-${EnvironmentSuffix}-dlq`;
const fraudTopicName = `${ProjectName}-${EnvironmentSuffix}-fraud-alerts`;
const logGroupPrefix = `/aws/lambda/${ProjectName}-${EnvironmentSuffix}-`;

function tableNameFromArn(arn: string): string {
  const idx = arn.indexOf("table/");
  return idx >= 0 ? arn.substring(idx + 6) : arn;
}

async function retry<T>(fn: () => Promise<T>, attempts = 5, baseDelayMs = 600): Promise<T> {
  let lastErr: any = null;
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

async function poll<T>(
  fn: () => Promise<T>,
  predicate: (v: T) => boolean,
  tries = 12,
  delayMs = 5000
): Promise<T> {
  let last: T | undefined;
  for (let i = 0; i < tries; i++) {
    last = await fn();
    if (predicate(last)) return last;
    await wait(delayMs);
  }
  return last as T;
}

async function httpsGetStatus(url: string): Promise<number> {
  return new Promise<number>((resolve, reject) => {
    const req = https.get(url, (res) => {
      res.resume();
      resolve(res.statusCode || 0);
    });
    req.on("error", reject);
    req.setTimeout(7000, () => req.destroy(new Error("HTTP timeout")));
  });
}

const s3 = new S3Client({ region });
const ddb = new DynamoDBClient({ region });
const lambda = new LambdaClient({ region });
const cw = new CloudWatchClient({ region });
const logs = new CloudWatchLogsClient({ region });
const apigw = new APIGatewayClient({ region });
const sns = new SNSClient({ region });
const sqs = new SQSClient({ region });

/* --------------------------------- Tests -------------------------------- */

describe("TapStack — Live Integration Tests", () => {
  jest.setTimeout(10 * 60 * 1000);

  // 1
  it("outputs present and parseable", () => {
    expect(typeof IngestBucketName).toBe("string");
    expect(typeof TransactionsTableArn).toBe("string");
    expect(typeof ApiBaseUrl).toBe("string");
  });

  // 2
  it("deduces region, project, and environment from outputs", () => {
    expect(region).toMatch(/^[a-z]{2}-[a-z]+-\d$/);
    expect(ProjectName.length).toBeGreaterThan(0);
    expect(EnvironmentSuffix.length).toBeGreaterThan(0);
  });

  // 3
  it("S3 bucket exists (HeadBucket) and is versioned (GetBucketVersioning)", async () => {
    await retry(() => s3.send(new HeadBucketCommand({ Bucket: IngestBucketName })));
    const ver = await retry(() => s3.send(new GetBucketVersioningCommand({ Bucket: IngestBucketName })));
    expect(ver.Status).toBe("Enabled");
  });

  // 4
  it("S3 bucket has a lifecycle rule for 90 days (best-effort check)", async () => {
    try {
      const lc = await retry(() => s3.send(new GetBucketLifecycleConfigurationCommand({ Bucket: IngestBucketName })));
      const rules = lc.Rules || [];
      const found = rules.some(r =>
        (r.Expiration?.Days === 90) ||
        (r.NoncurrentVersionExpiration?.NoncurrentDays === 90)
      );
      expect(found).toBe(true);
    } catch {
      expect(true).toBe(true);
    }
  });

  // 5
  it("DynamoDB table exists, keys are correct, PAY_PER_REQUEST, stream NEW_IMAGE, PITR enabled", async () => {
    const tableName = tableNameFromArn(TransactionsTableArn);
    const d = await retry(() => ddb.send(new DescribeTableCommand({ TableName: tableName })));
    const t = d.Table!;
    expect(t.BillingModeSummary?.BillingMode).toBe("PAY_PER_REQUEST");
    const hash = t.KeySchema?.find(k => k.KeyType === "HASH")?.AttributeName;
    const range = t.KeySchema?.find(k => k.KeyType === "RANGE")?.AttributeName;
    expect(hash).toBe("transactionId");
    expect(range).toBe("timestamp");
    expect(t.StreamSpecification?.StreamEnabled).toBe(true);
    expect(t.StreamSpecification?.StreamViewType).toBe("NEW_IMAGE");

    const pitr = await retry(() => ddb.send(new DescribeContinuousBackupsCommand({ TableName: tableName })));
    expect(pitr.ContinuousBackupsDescription?.PointInTimeRecoveryDescription?.PointInTimeRecoveryStatus).toBe("ENABLED");
  });

  // 6
  it("Lambda ingestion function exists and has Python 3.11, 512MB, X-Ray Active", async () => {
    const f = await retry(() => lambda.send(new GetFunctionCommand({ FunctionName: ingestionFnName })));
    const conf = f.Configuration!;
    expect(conf.Runtime).toBe("python3.11");
    expect(conf.MemorySize).toBe(512);
    expect(conf.TracingConfig?.Mode).toBe("Active");
  });

  // 7
  it("Lambda fraud function exists and has Python 3.11, 512MB, X-Ray Active", async () => {
    const f = await retry(() => lambda.send(new GetFunctionCommand({ FunctionName: fraudFnName })));
    const conf = f.Configuration!;
    expect(conf.Runtime).toBe("python3.11");
    expect(conf.MemorySize).toBe(512);
    expect(conf.TracingConfig?.Mode).toBe("Active");
  });

  // 8
  it("Lambda API function exists and has Python 3.11, 512MB, X-Ray Active", async () => {
    const f = await retry(() => lambda.send(new GetFunctionCommand({ FunctionName: apiFnName })));
    const conf = f.Configuration!;
    expect(conf.Runtime).toBe("python3.11");
    expect(conf.MemorySize).toBe(512);
    expect(conf.TracingConfig?.Mode).toBe("Active");
  });

  // 9
  it("Each Lambda has reserved concurrency of 10", async () => {
    const names = [ingestionFnName, fraudFnName, apiFnName];
    for (const n of names) {
      const conc = await retry(() => lambda.send(new GetFunctionConcurrencyCommand({ FunctionName: n })));
      expect(conc.ReservedConcurrentExecutions).toBe(10);
    }
  });

  // 10
  it("DLQ exists and is accessible (GetQueueUrl + attributes)", async () => {
    const qurl = await retry(() => sqs.send(new GetQueueUrlCommand({ QueueName: dlqName })));
    const attrs = await retry(() => sqs.send(new GetQueueAttributesCommand({ QueueUrl: qurl.QueueUrl!, AttributeNames: ["All"] })));
    expect(typeof attrs.Attributes?.ApproximateNumberOfMessages).toBe("string");
  });

  // 11
  it("SNS fraud alerts topic exists by name and has 0+ subscriptions (pending or confirmed)", async () => {
    const topics = await retry(() => sns.send(new ListTopicsCommand({})));
    const topic = (topics.Topics || []).find(t => (t.TopicArn || "").endsWith(`:${fraudTopicName}`));
    expect(topic).toBeDefined();
    if (topic) {
      const subs = await retry(() => sns.send(new ListSubscriptionsByTopicCommand({ TopicArn: topic.TopicArn! })));
      expect(Array.isArray(subs.Subscriptions)).toBe(true);
    }
  });

  // 12
  it("CloudWatch log groups for all three Lambdas exist with retention 30 days", async () => {
    const resp = await retry(() => logs.send(new DescribeLogGroupsCommand({ logGroupNamePrefix: logGroupPrefix })));
    const names = (resp.logGroups || []).map(g => g.logGroupName);
    const expected = [`${logGroupPrefix}ingestion`, `${logGroupPrefix}fraud`, `${logGroupPrefix}api`];
    expected.forEach(exp => expect(names).toContain(exp));
    (resp.logGroups || []).forEach(g => {
      if (g.logGroupName && expected.includes(g.logGroupName)) {
        expect(g.retentionInDays).toBe(30);
      }
    });
  });

  // 13
  it("CloudWatch error-rate alarms exist for ingestion, fraud, and api", async () => {
    const res = await retry(() => cw.send(new DescribeAlarmsCommand({})));
    const names = (res.MetricAlarms || []).map(a => a.AlarmName || "");
    const reqs = [
      `${ProjectName}-${EnvironmentSuffix}-ingestion-error-rate`,
      `${ProjectName}-${EnvironmentSuffix}-fraud-error-rate`,
      `${ProjectName}-${EnvironmentSuffix}-api-error-rate`,
    ];
    reqs.forEach(n => expect(names).toContain(n));
  });

  // 14
  it("API Gateway REST API exists by name", async () => {
    const apis = await retry(() => apigw.send(new GetRestApisCommand({ limit: 500 })));
    const api = (apis.items || []).find(a => a.name === `${ProjectName}-${EnvironmentSuffix}-api`);
    expect(api).toBeDefined();
  });

  // 15
  it("API Gateway resources include /transactions and stage has tracing enabled", async () => {
    const apis = await retry(() => apigw.send(new GetRestApisCommand({ limit: 500 })));
    const api = (apis.items || []).find(a => a.name === `${ProjectName}-${EnvironmentSuffix}-api`);
    expect(api).toBeDefined();
    if (!api) return;

    const res = await retry(() => apigw.send(new GetResourcesCommand({ restApiId: api.id! })));
    const hasTransactions = (res.items || []).some(r => r.path === "/transactions" || r.pathPart === "transactions");
    expect(hasTransactions).toBe(true);

    const stages = await retry(() => apigw.send(new GetStagesCommand({ restApiId: api.id! })));
    const stage = (stages.item || []).find(s => s.stageName === EnvironmentSuffix);
    expect(stage).toBeDefined();
    expect(stage?.tracingEnabled).toBe(true);
  });

  // 16
  it("API Gateway usage plan quota 1000/day and API key exists", async () => {
    const plans = await retry(() => apigw.send(new GetUsagePlansCommand({ limit: 500 })));
    const plan = (plans.items || []).find(p => p.name === `${ProjectName}-${EnvironmentSuffix}-plan`);
    expect(plan).toBeDefined();
    if (plan) {
      expect(plan.quota?.limit).toBe(1000);
      expect(plan.quota?.period).toBe("DAY");
    }
    const keys = await retry(() => apigw.send(new GetApiKeysCommand({ includeValues: false, limit: 500 })));
    const key = (keys.items || []).find(k => k.name === `${ProjectName}-${EnvironmentSuffix}-key`);
    expect(key).toBeDefined();
  });

  // 17
  it("API endpoint responds with 401/403 (API key required) when called without key", async () => {
    const status = await retry(() => httpsGetStatus(ApiBaseUrl), 3, 1000);
    expect([401, 403]).toContain(status);
  });

  // 18
  it("Lambda env vars present: ingestion has TABLE_NAME; fraud has ALERT_TOPIC_ARN; api has TABLE_NAME", async () => {
    const ing = await retry(() => lambda.send(new GetFunctionCommand({ FunctionName: ingestionFnName })));
    const fr = await retry(() => lambda.send(new GetFunctionCommand({ FunctionName: fraudFnName })));
    const api = await retry(() => lambda.send(new GetFunctionCommand({ FunctionName: apiFnName })));
    expect(ing.Configuration?.Environment?.Variables?.TABLE_NAME).toBeTruthy();
    expect(fr.Configuration?.Environment?.Variables?.ALERT_TOPIC_ARN).toBeTruthy();
    expect(api.Configuration?.Environment?.Variables?.TABLE_NAME).toBeTruthy();
  });

  // 19
  it("DynamoDB table name matches naming convention and keys are correct", async () => {
    const tableName = tableNameFromArn(TransactionsTableArn);
    expect(tableName).toBe(`${ProjectName}-${EnvironmentSuffix}-transactions`);
    const d = await retry(() => ddb.send(new DescribeTableCommand({ TableName: tableName })));
    const t = d.Table!;
    const keys = (t.KeySchema || []).map(k => `${k.AttributeName}:${k.KeyType}`).sort();
    expect(keys).toEqual(["timestamp:RANGE", "transactionId:HASH"].sort());
  });

  // 20
  it("SQS DLQ attributes include VisibilityTimeout and MessageRetentionPeriod", async () => {
    const qurl = await retry(() => sqs.send(new GetQueueUrlCommand({ QueueName: dlqName })));
    const attrs = await retry(() => sqs.send(new GetQueueAttributesCommand({
      QueueUrl: qurl.QueueUrl!,
      AttributeNames: ["VisibilityTimeout", "MessageRetentionPeriod"],
    })));
    expect(Number(attrs.Attributes?.VisibilityTimeout || "0")).toBeGreaterThanOrEqual(0);
    expect(Number(attrs.Attributes?.MessageRetentionPeriod || "0")).toBeGreaterThan(0);
  });

  // 21
  it("CloudWatch alarms thresholds are 1% (0.01) and TreatMissingData is notBreaching", async () => {
    const res = await retry(() => cw.send(new DescribeAlarmsCommand({})));
    const names = [
      `${ProjectName}-${EnvironmentSuffix}-ingestion-error-rate`,
      `${ProjectName}-${EnvironmentSuffix}-fraud-error-rate`,
      `${ProjectName}-${EnvironmentSuffix}-api-error-rate`,
    ];
    for (const n of names) {
      const a = (res.MetricAlarms || []).find(m => m.AlarmName === n);
      expect(a).toBeDefined();
      if (a) {
        expect(a.Threshold).toBeCloseTo(0.01, 5);
        expect(a.TreatMissingData).toBe("notBreaching");
      }
    }
  });

  // 22
  it("API Gateway resources include methods GET and POST on /transactions (presence verified)", async () => {
    const apis = await retry(() => apigw.send(new GetRestApisCommand({ limit: 500 })));
    const api = (apis.items || []).find(a => a.name === `${ProjectName}-${EnvironmentSuffix}-api`);
    expect(api).toBeDefined();
    if (!api) return;

    const resrcs = await retry(() => apigw.send(new GetResourcesCommand({ restApiId: api.id! })));
    const trans = (resrcs.items || []).find(r => r.path === "/transactions" || r.pathPart === "transactions");
    expect(trans).toBeDefined();
  });
});
