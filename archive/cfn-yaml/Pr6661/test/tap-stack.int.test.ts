// test/tapstack.int.test.ts
// Live integration tests for TapStack.yml stack.
// - Single file suite (26 tests).
// - Uses AWS SDK v3 only; no custom deps.
// - Reads stack outputs from cfn-outputs/all-outputs.json (shape: { "<StackName>": [{OutputKey,OutputValue}, ...] }).

import fs from "fs";
import path from "path";
import { setTimeout as wait } from "timers/promises";

// AWS SDK v3
import {
  CloudWatchClient,
  DescribeAlarmsCommand,
  GetDashboardCommand,
} from "@aws-sdk/client-cloudwatch";
import {
  CloudWatchLogsClient,
  DescribeLogGroupsCommand,
  DescribeMetricFiltersCommand,
} from "@aws-sdk/client-cloudwatch-logs";
import {
  SNSClient,
  GetTopicAttributesCommand,
  ListSubscriptionsByTopicCommand,
} from "@aws-sdk/client-sns";
import {
  SSMClient,
  GetParameterCommand,
} from "@aws-sdk/client-ssm";
import {
  LambdaClient,
  GetFunctionCommand,
  GetPolicyCommand,
} from "@aws-sdk/client-lambda";
import {
  EventBridgeClient,
  DescribeRuleCommand,
  ListTargetsByRuleCommand,
} from "@aws-sdk/client-eventbridge";

// -----------------------------------------------------------------------------
// Load outputs
// -----------------------------------------------------------------------------
const p = path.resolve(process.cwd(), "cfn-outputs/all-outputs.json");
if (!fs.existsSync(p)) {
  throw new Error(
    `Expected outputs file at ${p} — create it before running integration tests.`
  );
}
const raw = JSON.parse(fs.readFileSync(p, "utf8"));
const topKey = Object.keys(raw)[0];
if (!topKey) throw new Error("No stack key found in all-outputs.json");
const outputsArray: { OutputKey: string; OutputValue: string }[] = raw[topKey] || [];
const outputs: Record<string, string> = {};
for (const o of outputsArray) outputs[o.OutputKey] = o.OutputValue;

// Helpers
function getOutput(key: string): string {
  const v = outputs[key];
  if (!v) {
    throw new Error(`Missing output key: ${key}`);
  }
  return v;
}

function deduceRegion(): string {
  // Try DashboardUrl -> region param; else AWS_REGION env
  const dashUrl = outputs.DashboardUrl || "";
  const m = dashUrl.match(/region=([a-z]{2}-[a-z]+-\d)/);
  if (m && m[1]) return m[1];
  if (process.env.AWS_REGION) return process.env.AWS_REGION!;
  if (process.env.AWS_DEFAULT_REGION) return process.env.AWS_DEFAULT_REGION!;
  return "us-east-1";
}

const region = deduceRegion();

// Clients
const cw = new CloudWatchClient({ region });
const logs = new CloudWatchLogsClient({ region });
const sns = new SNSClient({ region });
const ssm = new SSMClient({ region });
const lambda = new LambdaClient({ region });
const events = new EventBridgeClient({ region });

// retry helper
async function retry<T>(fn: () => Promise<T>, attempts = 4, baseDelayMs = 700): Promise<T> {
  let last: any;
  for (let i = 0; i < attempts; i++) {
    try {
      return await fn();
    } catch (err) {
      last = err;
      if (i < attempts - 1) await wait(baseDelayMs * (i + 1));
    }
  }
  throw last;
}

// derive env suffix & names
const envSuffix = (() => {
  try {
    return getOutput("EnvironmentSuffix");
  } catch {
    // Fallback: parse from a log group name like /payments/app/<env>
    const lg = outputs.AppLogGroupName || "";
    const mm = lg.match(/\/payments\/app\/([a-z0-9-]{3,30})$/);
    return mm ? mm[1] : "dev";
  }
})();

const metricNamespace = "Payments/Observability";
const mfNames = {
  count: `TransactionsCount-${envSuffix}`,
  success: `TransactionsSuccess-${envSuffix}`,
  errors: `TransactionsErrors-${envSuffix}`,
  latency: `LatencyMs-${envSuffix}`,
};

const topicArns = {
  critical: getOutput("TopicCriticalArn"),
  warning: getOutput("TopicWarningArn"),
  info: getOutput("TopicInfoArn"),
};

const alarmNamesCsv = getOutput("AlarmNames"); // comma-separated
const alarmNames = alarmNamesCsv.split(",").map((s) => s.trim()).filter(Boolean);
const mustHaveAlarms = {
  errorRateCritical: `ErrorRateCritical-${envSuffix}`,
  latencyP95Critical: `LatencyP95Critical-${envSuffix}`,
  successRateCritical: `SuccessRateCritical-${envSuffix}`,
  serviceHealthCritical: `ServiceHealthCritical-${envSuffix}`,
  compositeCritical: `CompositeCritical-${envSuffix}`,
};

const ruleName = `AlarmEventsToLambda-${envSuffix}`;
const remediatorFnName = `Remediate-Alarm-${envSuffix}`;

describe("TapStack — Live Integration Tests (26)", () => {
  jest.setTimeout(10 * 60 * 1000);

  // 1
  it("outputs file parsed and essential keys present", () => {
    expect(Array.isArray(outputsArray)).toBe(true);
    expect(outputsArray.length).toBeGreaterThan(0);
    expect(typeof outputs.AppLogGroupName).toBe("string");
    expect(typeof outputs.VpcFlowLogGroupName).toBe("string");
    expect(typeof outputs.FunctionsLogGroupName).toBe("string");
    expect(typeof outputs.DashboardName).toBe("string");
    expect(typeof outputs.DashboardUrl).toBe("string");
    expect(typeof outputs.TopicCriticalArn).toBe("string");
  });

  // 2
  it("EnvironmentSuffix respects safe naming regex", () => {
    expect(/^[a-z0-9-]{3,30}$/.test(envSuffix)).toBe(true);
  });

  // 3
  it("CloudWatch dashboard exists and is retrievable", async () => {
    const name = getOutput("DashboardName");
    const res = await retry(() => cw.send(new GetDashboardCommand({ DashboardName: name })));
    expect(res.DashboardArn || res.DashboardBody).toBeTruthy();
  });

  // 4
  it("App log group exists with 90-day retention", async () => {
    const name = getOutput("AppLogGroupName");
    const res = await retry(() =>
      logs.send(new DescribeLogGroupsCommand({ logGroupNamePrefix: name }))
    );
    const lg = (res.logGroups || []).find((g) => g.logGroupName === name);
    expect(lg).toBeDefined();
    expect(lg?.retentionInDays).toBe(90);
  });

  // 5
  it("VPC flow log group exists with 90-day retention", async () => {
    const name = getOutput("VpcFlowLogGroupName");
    const res = await retry(() =>
      logs.send(new DescribeLogGroupsCommand({ logGroupNamePrefix: name }))
    );
    const lg = (res.logGroups || []).find((g) => g.logGroupName === name);
    expect(lg).toBeDefined();
    expect(lg?.retentionInDays).toBe(90);
  });

  // 6
  it("Functions log group exists with 90-day retention", async () => {
    const name = getOutput("FunctionsLogGroupName");
    const res = await retry(() =>
      logs.send(new DescribeLogGroupsCommand({ logGroupNamePrefix: name }))
    );
    const lg = (res.logGroups || []).find((g) => g.logGroupName === name);
    expect(lg).toBeDefined();
    expect(lg?.retentionInDays).toBe(90);
  });

  // 7
  it("Metric filter exists for TransactionsCount", async () => {
    const res = await retry(() =>
      logs.send(new DescribeMetricFiltersCommand({ metricName: mfNames.count, metricNamespace }))
    );
    expect((res.metricFilters || []).length).toBeGreaterThanOrEqual(1);
  });

  // 8
  it("Metric filter exists for TransactionsSuccess", async () => {
    const res = await retry(() =>
      logs.send(new DescribeMetricFiltersCommand({ metricName: mfNames.success, metricNamespace }))
    );
    expect((res.metricFilters || []).length).toBeGreaterThanOrEqual(1);
  });

  // 9
  it("Metric filter exists for TransactionsErrors", async () => {
    const res = await retry(() =>
      logs.send(new DescribeMetricFiltersCommand({ metricName: mfNames.errors, metricNamespace }))
    );
    expect((res.metricFilters || []).length).toBeGreaterThanOrEqual(1);
  });

  // 10
  it("Metric filter exists for LatencyMs", async () => {
    const res = await retry(() =>
      logs.send(new DescribeMetricFiltersCommand({ metricName: mfNames.latency, metricNamespace }))
    );
    expect((res.metricFilters || []).length).toBeGreaterThanOrEqual(1);
  });

  // 11
  it("SNS TopicCritical attributes retrievable", async () => {
    const r = await retry(() =>
      sns.send(new GetTopicAttributesCommand({ TopicArn: topicArns.critical }))
    );
    expect(r.Attributes).toBeDefined();
    expect(r.Attributes?.TopicArn).toBe(topicArns.critical);
  });

  // 12
  it("SNS TopicWarning attributes retrievable", async () => {
    const r = await retry(() =>
      sns.send(new GetTopicAttributesCommand({ TopicArn: topicArns.warning }))
    );
    expect(r.Attributes?.TopicArn).toBe(topicArns.warning);
  });

  // 13
  it("SNS TopicInfo attributes retrievable", async () => {
    const r = await retry(() =>
      sns.send(new GetTopicAttributesCommand({ TopicArn: topicArns.info }))
    );
    expect(r.Attributes?.TopicArn).toBe(topicArns.info);
  });

  // 14
  it("SNS subscriptions listing succeeds for all topics (may be empty if not confirmed)", async () => {
    const [c, w, i] = await Promise.all([
      retry(() => sns.send(new ListSubscriptionsByTopicCommand({ TopicArn: topicArns.critical }))),
      retry(() => sns.send(new ListSubscriptionsByTopicCommand({ TopicArn: topicArns.warning }))),
      retry(() => sns.send(new ListSubscriptionsByTopicCommand({ TopicArn: topicArns.info }))),
    ]);
    expect(Array.isArray(c.Subscriptions)).toBe(true);
    expect(Array.isArray(w.Subscriptions)).toBe(true);
    expect(Array.isArray(i.Subscriptions)).toBe(true);
  });

  // 15
  it("CloudWatch alarm ErrorRateCritical exists", async () => {
    const name = mustHaveAlarms.errorRateCritical;
    const r = await retry(() => cw.send(new DescribeAlarmsCommand({ AlarmNames: [name] })));
    const found = (r.MetricAlarms || []).find((a) => a.AlarmName === name);
    expect(found).toBeDefined();
    expect(found?.EvaluationPeriods).toBe(1);
  });

  // 16
  it("CloudWatch alarm LatencyP95Critical exists", async () => {
    const name = mustHaveAlarms.latencyP95Critical;
    const r = await retry(() => cw.send(new DescribeAlarmsCommand({ AlarmNames: [name] })));
    const found = (r.MetricAlarms || []).find((a) => a.AlarmName === name);
    expect(found).toBeDefined();
  });

  // 17
  it("CloudWatch alarm SuccessRateCritical exists", async () => {
    const name = mustHaveAlarms.successRateCritical;
    const r = await retry(() => cw.send(new DescribeAlarmsCommand({ AlarmNames: [name] })));
    const found = (r.MetricAlarms || []).find((a) => a.AlarmName === name);
    expect(found).toBeDefined();
  });

  // 18
  it("CloudWatch alarm ServiceHealthCritical exists and threshold is 70", async () => {
    const name = mustHaveAlarms.serviceHealthCritical;
    const r = await retry(() => cw.send(new DescribeAlarmsCommand({ AlarmNames: [name] })));
    const found = (r.MetricAlarms || []).find((a) => a.AlarmName === name);
    expect(found).toBeDefined();
    expect(found?.Threshold).toBe(70);
  });

  // 19
  it("EventBridge rule for alarm events exists", async () => {
    const res = await retry(() => events.send(new DescribeRuleCommand({ Name: ruleName })));
    expect(res.Arn).toBeTruthy();
    expect(res.EventPattern).toBeTruthy();
  });

  // 20
  it("EventBridge rule targets include the Remediator Lambda ARN", async () => {
    const [rule, fn] = await Promise.all([
      retry(() => events.send(new ListTargetsByRuleCommand({ Rule: ruleName }))),
      retry(() => lambda.send(new GetFunctionCommand({ FunctionName: remediatorFnName }))),
    ]);
    const fnArn = fn.Configuration?.FunctionArn || "";
    const found = (rule.Targets || []).some((t) => t.Arn === fnArn);
    expect(found).toBe(true);
  });

  // 21
  it("Lambda policy allows events.amazonaws.com to invoke", async () => {
    const res = await retry(() => lambda.send(new GetPolicyCommand({ FunctionName: remediatorFnName })));
    const policy = res.Policy || "";
    expect(policy.includes("events.amazonaws.com")).toBe(true);
  });

  // 22
  it("SSM error-rate threshold parameters exist (critical & warning)", async () => {
    const base = `/payments/${envSuffix}/thresholds/errorRate`;
    const [crit, warn] = await Promise.all([
      retry(() => ssm.send(new GetParameterCommand({ Name: `${base}/critical` }))),
      retry(() => ssm.send(new GetParameterCommand({ Name: `${base}/warning` }))),
    ]);
    expect(crit.Parameter?.Value).toBeDefined();
    expect(warn.Parameter?.Value).toBeDefined();
  });

  // 23
  it("SSM latency p95 threshold parameters exist (critical & warning)", async () => {
    const base = `/payments/${envSuffix}/thresholds/latencyP95`;
    const [crit, warn] = await Promise.all([
      retry(() => ssm.send(new GetParameterCommand({ Name: `${base}/critical` }))),
      retry(() => ssm.send(new GetParameterCommand({ Name: `${base}/warning` }))),
    ]);
    expect(crit.Parameter?.Value).toBeDefined();
    expect(warn.Parameter?.Value).toBeDefined();
  });

  // 24
  it("SSM success-rate threshold parameters exist (critical & warning)", async () => {
    const base = `/payments/${envSuffix}/thresholds/successRate`;
    const [crit, warn] = await Promise.all([
      retry(() => ssm.send(new GetParameterCommand({ Name: `${base}/critical` }))),
      retry(() => ssm.send(new GetParameterCommand({ Name: `${base}/warning` }))),
    ]);
    expect(crit.Parameter?.Value).toBeDefined();
    expect(warn.Parameter?.Value).toBeDefined();
  });

  // 25
  it("AlarmNames output includes all required alarm names", () => {
    const required = Object.values(mustHaveAlarms);
    for (const n of required) {
      expect(alarmNames.includes(n)).toBe(true);
    }
  });
});
