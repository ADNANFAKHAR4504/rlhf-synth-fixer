// test/tap-stack.int.test.ts
import fs from "fs";
import path from "path";
import { setTimeout as wait } from "timers/promises";

import {
  SQSClient,
  GetQueueAttributesCommand,
} from "@aws-sdk/client-sqs";

import {
  LambdaClient,
  GetFunctionCommand,
  GetFunctionConcurrencyCommand,
  ListEventSourceMappingsCommand,
} from "@aws-sdk/client-lambda";

import {
  DynamoDBClient,
  DescribeTableCommand,
} from "@aws-sdk/client-dynamodb";

import {
  CloudWatchClient,
  DescribeAlarmsCommand,
  GetDashboardCommand,
} from "@aws-sdk/client-cloudwatch";

import {
  SSMClient,
  GetParameterCommand,
} from "@aws-sdk/client-ssm";

import {
  EventBridgeClient,
  DescribeRuleCommand,
} from "@aws-sdk/client-eventbridge";

/* ---------------------------- Setup / Helpers --------------------------- */

type OutputsShape =
  | Record<string, string>
  | { OutputKey: string; OutputValue: string }[];

function loadOutputs(): Record<string, string> {
  const p = path.resolve(process.cwd(), "cfn-outputs/all-outputs.json");
  if (!fs.existsSync(p)) {
    throw new Error(`Expected outputs file at ${p} — create it before running integration tests.`);
  }
  const raw = JSON.parse(fs.readFileSync(p, "utf8"));
  // Support two common shapes:
  // 1) { StackName: [ { OutputKey, OutputValue }, ... ] }
  // 2) { PrimaryQueueUrl: "...", PrimaryQueueArn: "...", ... }
  let flat: Record<string, string> = {};
  const topKeys = Object.keys(raw);
  if (topKeys.length === 0) throw new Error("Outputs JSON is empty");
  if (Array.isArray(raw[topKeys[0]])) {
    const arr: OutputsShape = raw[topKeys[0]];
    for (const o of arr as any[]) {
      if (o && o.OutputKey) flat[o.OutputKey] = o.OutputValue;
    }
  } else {
    flat = raw as Record<string, string>;
  }
  return flat;
}

const outputs = loadOutputs();

function deduceRegionFromArn(arn?: string): string | undefined {
  // arn:partition:service:region:account:resourcetype/resource
  if (!arn || typeof arn !== "string") return undefined;
  const parts = arn.split(":");
  return parts.length > 3 ? parts[3] : undefined;
}

function envFromQueueUrl(url?: string): string | undefined {
  // e.g., https://sqs.us-east-1.amazonaws.com/123456789012/orders-prod-us.fifo
  if (!url) return undefined;
  const name = url.split("/").pop() || "";
  const m = name.match(/^orders(?:-dr)?-([a-z0-9-]+)\.fifo$/);
  return m?.[1];
}

function lambdaNameFromArn(arn?: string): string | undefined {
  // arn:aws:lambda:region:acct:function:functionName[:alias]
  if (!arn) return undefined;
  const idx = arn.indexOf(":function:");
  if (idx === -1) return undefined;
  const tail = arn.slice(idx + ":function:".length);
  return tail.split(":")[0];
}

async function retry<T>(fn: () => Promise<T>, attempts = 4, baseDelayMs = 600): Promise<T> {
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

const primaryQueueUrl = outputs.PrimaryQueueUrl;
const primaryQueueArn = outputs.PrimaryQueueArn;
const primaryDlqUrl = outputs.PrimaryDlqUrl;
const primaryDlqArn = outputs.PrimaryDlqArn;
const drQueueUrl = outputs.DrQueueUrl;
const drQueueArn = outputs.DrQueueArn;
const primaryFnArn = outputs.PrimaryProcessorLambdaArn;
const replFnArn = outputs.ReplicationLambdaArn;
const tableName = outputs.MessageStateTableName;
const dashboardName = outputs.ProcessingDashboardName;

// Region: prefer from a known ARN; fallback env; default us-east-1.
const region =
  deduceRegionFromArn(primaryQueueArn) ||
  process.env.AWS_REGION ||
  process.env.AWS_DEFAULT_REGION ||
  "us-east-1";

const sqs = new SQSClient({ region });
const lambda = new LambdaClient({ region });
const ddb = new DynamoDBClient({ region });
const cw = new CloudWatchClient({ region });
const ssm = new SSMClient({ region });
const events = new EventBridgeClient({ region });

// Derive EnvironmentSuffix from queue URL
const environmentSuffix =
  envFromQueueUrl(primaryQueueUrl) ||
  envFromQueueUrl(drQueueUrl) ||
  "prod-us";

// Names derived from template
const alarmPrimaryDepth = `primary-queue-depth-${environmentSuffix}`;
const alarmPrimaryDlqDepth = `primary-dlq-depth-${environmentSuffix}`;
const alarmReplErrors = `replication-lambda-errors-${environmentSuffix}`;
const ruleDlqAlarmState = `dlq-state-change-${environmentSuffix}`;
// Purge scheduling is enabled by default in the provided template (IsProduction=false, EnableAutoPurgeNonProd=true)
const rulePurge = `queue-purge-schedule-${environmentSuffix}`;

/* -------------------------------- Tests -------------------------------- */

describe("TapStack — Live Integration Tests (SQS/Lambda/DynamoDB/EventBridge/CloudWatch/SSM)", () => {
  jest.setTimeout(10 * 60 * 1000); // 10 minutes

  it("01) outputs include essential URLs/ARNs and names", () => {
    expect(typeof primaryQueueUrl).toBe("string");
    expect(typeof primaryQueueArn).toBe("string");
    expect(typeof primaryDlqUrl).toBe("string");
    expect(typeof primaryDlqArn).toBe("string");
    expect(typeof drQueueUrl).toBe("string");
    expect(typeof drQueueArn).toBe("string");
    expect(typeof primaryFnArn).toBe("string");
    expect(typeof replFnArn).toBe("string");
    expect(typeof tableName).toBe("string");
    expect(typeof dashboardName).toBe("string");
  });

  it("02) region deduction from queue ARN is consistent", () => {
    const r1 = deduceRegionFromArn(primaryQueueArn);
    expect(r1).toBeDefined();
    expect(region).toBe(r1);
  });

  it("03) SQS: Primary queue attributes can be retrieved", async () => {
    const resp = await retry(() =>
      sqs.send(new GetQueueAttributesCommand({
        QueueUrl: primaryQueueUrl!,
        AttributeNames: ["All"],
      }))
    );
    expect(resp.Attributes).toBeDefined();
  });

  it("04) SQS: Primary queue is FIFO with content-based dedup", async () => {
    const { Attributes } = await retry(() =>
      sqs.send(new GetQueueAttributesCommand({
        QueueUrl: primaryQueueUrl!,
        AttributeNames: ["FifoQueue", "ContentBasedDeduplication"],
      }))
    );
    expect(Attributes?.FifoQueue).toBe("true");
    expect(Attributes?.ContentBasedDeduplication).toBe("true");
  });

  it("05) SQS: Primary queue has a redrive policy to its DLQ with maxReceiveCount=3", async () => {
    const { Attributes } = await retry(() =>
      sqs.send(new GetQueueAttributesCommand({
        QueueUrl: primaryQueueUrl!,
        AttributeNames: ["RedrivePolicy"],
      }))
    );
    expect(Attributes?.RedrivePolicy).toBeDefined();
    const rp = JSON.parse(Attributes!.RedrivePolicy!);
    // RedrivePolicy can contain deadLetterTargetArn or deadLetterTargetArn + maxReceiveCount
    expect(String(rp.deadLetterTargetArn)).toContain(primaryDlqArn!);
    expect(Number(rp.maxReceiveCount)).toBe(3);
  });

  it("06) SQS: DLQ attributes show FIFO and dedup true", async () => {
    const { Attributes } = await retry(() =>
      sqs.send(new GetQueueAttributesCommand({
        QueueUrl: primaryDlqUrl!,
        AttributeNames: ["FifoQueue", "ContentBasedDeduplication"],
      }))
    );
    expect(Attributes?.FifoQueue).toBe("true");
    expect(Attributes?.ContentBasedDeduplication).toBe("true");
  });

  it("07) SQS: DR queue attributes retrievable and FIFO/dedup true", async () => {
    const { Attributes } = await retry(() =>
      sqs.send(new GetQueueAttributesCommand({
        QueueUrl: drQueueUrl!,
        AttributeNames: ["FifoQueue", "ContentBasedDeduplication"],
      }))
    );
    expect(Attributes?.FifoQueue).toBe("true");
    expect(Attributes?.ContentBasedDeduplication).toBe("true");
  });

  it("08) Lambda: Primary function exists", async () => {
    const fnName = lambdaNameFromArn(primaryFnArn);
    expect(fnName).toBeDefined();
    const resp = await retry(() => lambda.send(new GetFunctionCommand({ FunctionName: fnName! })));
    expect(resp.Configuration?.FunctionName).toBe(fnName);
  });

  it("09) Lambda: Primary function reserved concurrency is set >= 1", async () => {
    const fnName = lambdaNameFromArn(primaryFnArn)!;
    const conc = await retry(() => lambda.send(new GetFunctionConcurrencyCommand({ FunctionName: fnName })));
    // If not explicitly set, ReservedConcurrentExecutions may be undefined; template sets it, so expect number >= 1.
    expect(typeof conc.ReservedConcurrentExecutions === "number" && conc.ReservedConcurrentExecutions! >= 1).toBe(true);
  });

  it("10) Lambda: Replication function exists", async () => {
    const fnName = lambdaNameFromArn(replFnArn);
    expect(fnName).toBeDefined();
    const resp = await retry(() => lambda.send(new GetFunctionCommand({ FunctionName: fnName! })));
    expect(resp.Configuration?.FunctionName).toBe(fnName);
  });

  it("11) Lambda: Replication function reserved concurrency is set >= 1", async () => {
    const fnName = lambdaNameFromArn(replFnArn)!;
    const conc = await retry(() => lambda.send(new GetFunctionConcurrencyCommand({ FunctionName: fnName })));
    expect(typeof conc.ReservedConcurrentExecutions === "number" && conc.ReservedConcurrentExecutions! >= 1).toBe(true);
  });

  it("12) Lambda: Event source mapping for PrimaryProcessor exists from Primary queue", async () => {
    const fnName = lambdaNameFromArn(primaryFnArn)!;
    const list = await retry(() => lambda.send(new ListEventSourceMappingsCommand({ FunctionName: fnName })));
    expect(Array.isArray(list.EventSourceMappings)).toBe(true);
    const found = (list.EventSourceMappings || []).some((m) => (m.EventSourceArn || "").includes(primaryQueueArn!));
    expect(found).toBe(true);
  });

  it("13) Lambda: Event source mapping for Replication exists from Primary queue", async () => {
    const fnName = lambdaNameFromArn(replFnArn)!;
    const list = await retry(() => lambda.send(new ListEventSourceMappingsCommand({ FunctionName: fnName })));
    const found = (list.EventSourceMappings || []).some((m) => (m.EventSourceArn || "").includes(primaryQueueArn!));
    expect(found).toBe(true);
  });

  it("14) DynamoDB: MessageStateTable exists", async () => {
    const resp = await retry(() => ddb.send(new DescribeTableCommand({ TableName: tableName! })));
    expect(resp.Table?.TableName).toBe(tableName);
  });

  it("15) DynamoDB: BillingMode is PAY_PER_REQUEST", async () => {
    const resp = await retry(() => ddb.send(new DescribeTableCommand({ TableName: tableName! })));
    expect(resp.Table?.BillingModeSummary?.BillingMode || resp.Table?.BillingModeSummary?.BillingMode).toBe("PAY_PER_REQUEST");
  });

  it("16) DynamoDB: GSI ProcessingKeyIndex exists", async () => {
    const resp = await retry(() => ddb.send(new DescribeTableCommand({ TableName: tableName! })));
    const hasGsi = (resp.Table?.GlobalSecondaryIndexes || []).some((g) => g.IndexName === "ProcessingKeyIndex");
    expect(hasGsi).toBe(true);
  });

  it("17) CloudWatch: Primary queue depth alarm exists", async () => {
    const resp = await retry(() => cw.send(new DescribeAlarmsCommand({ AlarmNames: [alarmPrimaryDepth] })));
    expect((resp.MetricAlarms || []).length).toBeGreaterThanOrEqual(1);
  });

  it("18) CloudWatch: Primary DLQ depth alarm exists", async () => {
    const resp = await retry(() => cw.send(new DescribeAlarmsCommand({ AlarmNames: [alarmPrimaryDlqDepth] })));
    expect((resp.MetricAlarms || []).length).toBeGreaterThanOrEqual(1);
  });

  it("19) CloudWatch: Replication Lambda error alarm exists", async () => {
    const resp = await retry(() => cw.send(new DescribeAlarmsCommand({ AlarmNames: [alarmReplErrors] })));
    expect((resp.MetricAlarms || []).length).toBeGreaterThanOrEqual(1);
  });

  it("20) CloudWatch: Dashboard is retrievable", async () => {
    const resp = await retry(() => cw.send(new GetDashboardCommand({ DashboardName: dashboardName! })));
    expect(typeof resp.DashboardBody).toBe("string");
    expect((resp.DashboardArn || "").includes(":dashboard/")).toBe(true);
  });

  it("21) SSM: primary queue URL parameter exists and matches outputs", async () => {
    const name = `/async/${environmentSuffix}/primary-queue-url`;
    const resp = await retry(() => ssm.send(new GetParameterCommand({ Name: name })));
    expect(resp.Parameter?.Value).toBe(primaryQueueUrl);
  });

  it("22) SSM: DR queue URL parameter exists and matches outputs", async () => {
    const name = `/async/${environmentSuffix}/dr-queue-url`;
    const resp = await retry(() => ssm.send(new GetParameterCommand({ Name: name })));
    expect(resp.Parameter?.Value).toBe(drQueueUrl);
  });

  it("23) SSM: visibility-timeout parameter exists and equals template default '60'", async () => {
    const name = `/async/${environmentSuffix}/visibility-timeout-seconds`;
    const resp = await retry(() => ssm.send(new GetParameterCommand({ Name: name })));
    expect(resp.Parameter?.Value).toBe("60");
  });

  it("24) EventBridge: DLQ alarm state change rule exists and is ENABLED", async () => {
    const resp = await retry(() => events.send(new DescribeRuleCommand({ Name: ruleDlqAlarmState })));
    expect(resp.Name).toBe(ruleDlqAlarmState);
    expect(resp.State).toBe("ENABLED");
  });

  it("25) EventBridge: Queue purge schedule rule exists (non-prod default) and is ENABLED", async () => {
    const resp = await retry(() => events.send(new DescribeRuleCommand({ Name: rulePurge })));
    // If your prod stack disables this, ensure IsProduction=false for tests.
    expect(resp.Name).toBe(rulePurge);
    expect(resp.State).toBe("ENABLED");
  });

  it("26) SQS: DR queue ContentBasedDeduplication is true (edge check)", async () => {
    const { Attributes } = await retry(() =>
      sqs.send(new GetQueueAttributesCommand({
        QueueUrl: drQueueUrl!,
        AttributeNames: ["ContentBasedDeduplication"],
      }))
    );
    expect(Attributes?.ContentBasedDeduplication).toBe("true");
  });
});
