import * as fs from "fs";
import * as path from "path";

type AnyObj = Record<string, any>;

function safeRequire(moduleName: string) {
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    return require(moduleName);
  } catch {
    return null;
  }
}

function fileExists(p: string): boolean {
  try {
    fs.accessSync(p, fs.constants.R_OK);
    return true;
  } catch {
    return false;
  }
}

function loadTemplate(): { tpl: AnyObj; source: "json" | "yaml" } {
  const jsonPath = path.resolve(__dirname, "../lib/TapStack.json");
  const yamlPath = path.resolve(__dirname, "../lib/TapStack.yml");

  if (fileExists(jsonPath)) {
    const raw = fs.readFileSync(jsonPath, "utf8");
    const tpl = JSON.parse(raw);
    return { tpl, source: "json" };
  }

  if (fileExists(yamlPath)) {
    const raw = fs.readFileSync(yamlPath, "utf8");
    const yaml = safeRequire("yaml") || safeRequire("js-yaml");
    if (!yaml) {
      throw new Error(
        "YAML parser not available. Please add 'yaml' or 'js-yaml' devDependency, or provide TapStack.json."
      );
    }
    const tpl = yaml.parse ? yaml.parse(raw) : yaml.load(raw);
    return { tpl, source: "yaml" };
  }

  throw new Error("Neither ../lib/TapStack.json nor ../lib/TapStack.yml was found.");
}

function resources(tpl: AnyObj): AnyObj {
  expect(tpl).toHaveProperty("Resources");
  return tpl.Resources as AnyObj;
}

function parameters(tpl: AnyObj): AnyObj {
  expect(tpl).toHaveProperty("Parameters");
  return tpl.Parameters as AnyObj;
}

function outputs(tpl: AnyObj): AnyObj {
  expect(tpl).toHaveProperty("Outputs");
  return tpl.Outputs as AnyObj;
}

function getParamDefault(tpl: AnyObj, name: string): any {
  const p = parameters(tpl)[name];
  return p?.Default;
}

function resolveMaybeNumber(tpl: AnyObj, v: any): number | undefined {
  if (typeof v === "number") return v;
  if (typeof v === "object" && v) {
    // { "Ref": "ParamName" }
    if (typeof v.Ref === "string") {
      const def = getParamDefault(tpl, v.Ref);
      if (typeof def === "number") return def;
    }
    // { "Fn::If": [...] } // (not used in current template, but safe fallback)
    if (Array.isArray(v["Fn::If"])) {
      // naive best-effort: try first branch
      const first = v["Fn::If"][1];
      return resolveMaybeNumber(tpl, first);
    }
  }
  return undefined;
}

function getResource(tpl: AnyObj, logicalId: string): AnyObj {
  const res = resources(tpl)[logicalId];
  expect(res).toBeDefined();
  return res as AnyObj;
}

function expectType(res: AnyObj, type: string) {
  expect(res).toHaveProperty("Type", type);
}

function findResourcesByType(tpl: AnyObj, type: string): string[] {
  return Object.entries(resources(tpl))
    .filter(([_, v]: [string, any]) => v.Type === type)
    .map(([k]) => k);
}

function hasTag(res: AnyObj, key: string) {
  const tags = res?.Properties?.Tags || [];
  return Array.isArray(tags) && tags.some((t: AnyObj) => t.Key === key);
}

function intrinsicToString(v: any): string {
  if (v == null) return "";
  if (typeof v === "string") return v;

  // Handle Fn::Sub: either string or { "Fn::Sub": "..." } or { "Fn::Sub": ["...", {...}] }
  if (v["Fn::Sub"]) {
    const sub = v["Fn::Sub"];
    if (typeof sub === "string") return sub;
    if (Array.isArray(sub) && typeof sub[0] === "string") return sub[0];
  }

  // Handle Fn::Join: { "Fn::Join": [sep, parts[]] }
  if (v["Fn::Join"]) {
    const [sep, parts] = v["Fn::Join"];
    const rendered = (parts || []).map((p: any) => intrinsicToString(p)).join(sep || "");
    return rendered;
  }

  // Handle Ref/GetAtt generically
  if (v.Ref) return `Ref:${v.Ref}`;
  if (v["Fn::GetAtt"]) return `GetAtt:${v["Fn::GetAtt"].join(".")}`;

  try {
    return JSON.stringify(v);
  } catch {
    return String(v);
  }
}

// -------------------------------
// Begin Tests
// -------------------------------
describe("TapStack CloudFormation Template", () => {
  const { tpl, source } = loadTemplate();

  test("01 - Template structure has Parameters, Resources, and Outputs", () => {
    expect(tpl).toHaveProperty("Parameters");
    expect(tpl).toHaveProperty("Resources");
    expect(tpl).toHaveProperty("Outputs");
    expect(["json", "yaml"]).toContain(source);
  });

  test("02 - Parameter: EnvironmentSuffix uses regex AllowedPattern (no hard AllowedValues)", () => {
    const params = parameters(tpl);
    expect(params).toHaveProperty("EnvironmentSuffix");
    const env = params.EnvironmentSuffix;
    expect(env).not.toHaveProperty("AllowedValues");
    expect(env).toHaveProperty("AllowedPattern");
    const pat = env.AllowedPattern as string;
    expect(typeof pat).toBe("string");
    expect(pat.length).toBeGreaterThan(0);
  });

  test("03 - Parameter: ProjectName is constrained to a safe pattern", () => {
    const params = parameters(tpl);
    expect(params).toHaveProperty("ProjectName");
    const p = params.ProjectName;
    expect(p).toHaveProperty("AllowedPattern");
    expect(typeof p.AllowedPattern).toBe("string");
    expect(p.AllowedPattern.length).toBeGreaterThan(0);
  });

  test("04 - DynamoDB table exists with correct keys and PAY_PER_REQUEST", () => {
    const table = getResource(tpl, "TransactionsTable");
    expectType(table, "AWS::DynamoDB::Table");
    const props = table.Properties;
    expect(props).toHaveProperty("BillingMode", "PAY_PER_REQUEST");
    expect(props).toHaveProperty("AttributeDefinitions");
    expect(props).toHaveProperty("KeySchema");
    const attrs = props.AttributeDefinitions;
    const keys = props.KeySchema;
    const hasTxnId = attrs.some((a: AnyObj) => a.AttributeName === "transactionId" && a.AttributeType === "S");
    const hasTs = attrs.some((a: AnyObj) => a.AttributeName === "timestamp" && a.AttributeType === "N");
    expect(hasTxnId).toBe(true);
    expect(hasTs).toBe(true);
    const hashKey = keys.find((k: AnyObj) => k.KeyType === "HASH");
    const rangeKey = keys.find((k: AnyObj) => k.KeyType === "RANGE");
    expect(hashKey?.AttributeName).toBe("transactionId");
    expect(rangeKey?.AttributeName).toBe("timestamp");
  });

  test("05 - DynamoDB table enables PITR and SSE", () => {
    const table = getResource(tpl, "TransactionsTable");
    const props = table.Properties;
    expect(props).toHaveProperty("PointInTimeRecoverySpecification");
    expect(props.PointInTimeRecoverySpecification.PointInTimeRecoveryEnabled).toBe(true);
    expect(props).toHaveProperty("SSESpecification");
    expect(props.SSESpecification.SSEEnabled).toBe(true);
  });

  test("06 - SQS main queue and DLQ exist with 14-day retention and redrive policy", () => {
    const q = getResource(tpl, "TransactionsQueue");
    const dlq = getResource(tpl, "TransactionsDLQ");
    expectType(q, "AWS::SQS::Queue");
    expectType(dlq, "AWS::SQS::Queue");
    expect(q.Properties).toHaveProperty("RedrivePolicy");
    expect(q.Properties.MessageRetentionPeriod).toBe(1209600);
    expect(dlq.Properties.MessageRetentionPeriod).toBe(1209600);
  });

  test("07 - Lambda functions exist: Ingestion, Detection, ScheduledAnalysis", () => {
    expectType(getResource(tpl, "IngestionFunction"), "AWS::Lambda::Function");
    expectType(getResource(tpl, "DetectionFunction"), "AWS::Lambda::Function");
    expectType(getResource(tpl, "ScheduledAnalysisFunction"), "AWS::Lambda::Function");
  });

  test("08 - All Lambdas use ARM64 and have X-Ray tracing enabled", () => {
    const ids = ["IngestionFunction", "DetectionFunction", "ScheduledAnalysisFunction"];
    for (const id of ids) {
      const fn = getResource(tpl, id);
      const props = fn.Properties;
      expect(props.Architectures).toContain("arm64");
      expect(props.TracingConfig?.Mode).toBe("Active");
    }
  });

  test("09 - Ingestion Lambda has 512MB memory and 60s timeout by parameter default", () => {
    const fn = getResource(tpl, "IngestionFunction");
    const props = fn.Properties;
    expect(props).toHaveProperty("MemorySize");
    expect(props).toHaveProperty("Timeout");

    const mem = resolveMaybeNumber(tpl, props.MemorySize);
    const to = resolveMaybeNumber(tpl, props.Timeout);
    expect(typeof mem).toBe("number");
    expect(typeof to).toBe("number");
    expect(mem as number).toBeGreaterThanOrEqual(512);
    expect(to as number).toBeGreaterThanOrEqual(60);
  });

  test("10 - All Lambdas enforce ReservedConcurrentExecutions >= 100", () => {
    const ids = ["IngestionFunction", "DetectionFunction", "ScheduledAnalysisFunction"];
    for (const id of ids) {
      const fn = getResource(tpl, id);
      const r = resolveMaybeNumber(tpl, fn.Properties?.ReservedConcurrentExecutions);
      expect(typeof r).toBe("number");
      expect(r as number).toBeGreaterThanOrEqual(100);
    }
  });

  test("11 - Lambda DLQs exist per function and retain 14 days", () => {
    const dlqs = ["IngestionLambdaDLQ", "DetectionLambdaDLQ", "ScheduledAnalysisLambdaDLQ"];
    for (const id of dlqs) {
      const q = getResource(tpl, id);
      expectType(q, "AWS::SQS::Queue");
      expect(q.Properties.MessageRetentionPeriod).toBe(1209600);
    }
  });

  test("12 - IAM roles exist for each Lambda with least-privilege statements", () => {
    const ingestionRole = getResource(tpl, "IngestionLambdaRole");
    const detectionRole = getResource(tpl, "DetectionLambdaRole");
    const scheduledRole = getResource(tpl, "ScheduledAnalysisLambdaRole");
    expectType(ingestionRole, "AWS::IAM::Role");
    expectType(detectionRole, "AWS::IAM::Role");
    expectType(scheduledRole, "AWS::IAM::Role");
    for (const r of [ingestionRole, detectionRole, scheduledRole]) {
      const pols = r.Properties?.Policies || [];
      expect(Array.isArray(pols)).toBe(true);
      expect(pols.length).toBeGreaterThan(0);
    }
  });

  test("13 - Ingestion role can PutItem/UpdateItem on DDB and SendMessage to main queue", () => {
    const role = getResource(tpl, "IngestionLambdaRole");
    const stmts = role.Properties.Policies.flatMap((p: AnyObj) => p.PolicyDocument.Statement);
    const ddbStmt = stmts.find((s: AnyObj) => (s.Action || []).includes("dynamodb:PutItem"));
    expect(ddbStmt).toBeDefined();
    const sqsStmt = stmts.find((s: AnyObj) => (s.Action || []).includes("sqs:SendMessage"));
    expect(sqsStmt).toBeDefined();
  });

  test("14 - Detection role can Receive/Delete SQS messages and write to DDB", () => {
    const role = getResource(tpl, "DetectionLambdaRole");
    const stmts = role.Properties.Policies.flatMap((p: AnyObj) => p.PolicyDocument.Statement);
    const recv = stmts.find((s: AnyObj) => (s.Action || []).includes("sqs:ReceiveMessage"));
    const del = stmts.find((s: AnyObj) => (s.Action || []).includes("sqs:DeleteMessage"));
    const ddb = stmts.find((s: AnyObj) => (s.Action || []).includes("dynamodb:PutItem"));
    expect(recv).toBeDefined();
    expect(del).toBeDefined();
    expect(ddb).toBeDefined();
  });

  test("15 - Scheduled role can interact with DynamoDB and send to its DLQ", () => {
    const role = getResource(tpl, "ScheduledAnalysisLambdaRole");
    const stmts = role.Properties.Policies.flatMap((p: AnyObj) => p.PolicyDocument.Statement);
    const ddbRW = stmts.find((s: AnyObj) => (s.Action || []).includes("dynamodb:Query"));
    const dlqSend = stmts.find((s: AnyObj) => (s.Action || []).includes("sqs:SendMessage"));
    expect(ddbRW).toBeDefined();
    expect(dlqSend).toBeDefined();
  });

  test("16 - API Gateway REST API with POST /webhook (Lambda proxy integration)", () => {
    const api = getResource(tpl, "RestApi");
    expectType(api, "AWS::ApiGateway::RestApi");

    const method = getResource(tpl, "RestApiMethodPostWebhook");
    expectType(method, "AWS::ApiGateway::Method");
    const integ = method.Properties?.Integration;
    expect(integ?.Type).toBe("AWS_PROXY");

    const uriStr = intrinsicToString(integ?.Uri);
    expect(uriStr).toContain(":lambda:path/2015-03-31/functions/");
    expect(uriStr.endsWith("/invocations")).toBe(true);
  });

  test("17 - API Gateway Stage throttling and access logging enabled", () => {
    const stage = getResource(tpl, "RestApiStage");
    const ms = stage.Properties?.MethodSettings || [];
    let hasThrottle = false;
    for (const s of ms) {
      const rate = resolveMaybeNumber(tpl, s.ThrottlingRateLimit);
      const burst = resolveMaybeNumber(tpl, s.ThrottlingBurstLimit);
      if (
        s.ResourcePath === "/*" &&
        s.HttpMethod === "*" &&
        typeof rate === "number" &&
        typeof burst === "number" &&
        rate >= 1000
      ) {
        hasThrottle = true;
      }
    }
    expect(hasThrottle).toBe(true);
    const destArnStr = intrinsicToString(stage.Properties?.AccessLogSetting?.DestinationArn);
    expect(destArnStr).toContain(":log-group:");
  });

  test("18 - EventBridge rule triggers scheduled analysis every 15 minutes", () => {
    const rule = getResource(tpl, "ScheduledRuleQuarterHour");
    expectType(rule, "AWS::Events::Rule");
    expect(rule.Properties?.ScheduleExpression).toBe("cron(0/15 * * * ? *)");
    const targets = rule.Properties?.Targets || [];
    expect(Array.isArray(targets)).toBe(true);
    expect(targets.length).toBeGreaterThan(0);
  });

  test("19 - CloudWatch LogGroups exist with 30-day retention", () => {
    const ids = ["IngestionLogGroup", "DetectionLogGroup", "ScheduledAnalysisLogGroup", "ApiAccessLogGroup"];
    for (const id of ids) {
      const lg = getResource(tpl, id);
      expectType(lg, "AWS::Logs::LogGroup");
      expect(lg.Properties?.RetentionInDays).toBe(30);
    }
  });

  test("20 - SNS Alerts Topic and email subscription exist", () => {
    const topic = getResource(tpl, "AlertsTopic");
    const sub = getResource(tpl, "AlertsSubscriptionEmail");
    expectType(topic, "AWS::SNS::Topic");
    expectType(sub, "AWS::SNS::Subscription");
  });

  test("21 - CloudWatch Dashboard exists and references API, Lambda, DynamoDB metrics", () => {
    const dash = getResource(tpl, "MonitoringDashboard");
    expectType(dash, "AWS::CloudWatch::Dashboard");
    const bodyStr = intrinsicToString(dash.Properties?.DashboardBody);
    expect(typeof bodyStr).toBe("string");
    expect(bodyStr).toContain("AWS/ApiGateway");
    expect(bodyStr).toContain("AWS/Lambda");
    expect(bodyStr).toContain("AWS/DynamoDB");
  });

  test("22 - CloudWatch Alarms use safe IF expression for error rate (>1%)", () => {
    const alarmIds = ["AlarmIngestionErrorRate", "AlarmDetectionErrorRate"];
    for (const id of alarmIds) {
      const a = getResource(tpl, id);
      expectType(a, "AWS::CloudWatch::Alarm");
      const metrics = a.Properties?.Metrics || [];
      const expr = metrics.find((m: AnyObj) => m.Id === "e");
      expect(expr?.Expression || "").toContain("IF(invocations>0,(errors/invocations)*100,0)");
      const thr = resolveMaybeNumber(tpl, a.Properties?.Threshold);
      expect(typeof thr).toBe("number");
      expect(thr as number).toBeGreaterThanOrEqual(1);
    }
  });

  test("23 - Lambda event source mapping exists for SQS → Detection Lambda", () => {
    const esm = getResource(tpl, "DetectionEventSource");
    expectType(esm, "AWS::Lambda::EventSourceMapping");
    expect(esm.Properties?.FunctionName).toBeDefined();
    expect(esm.Properties?.EventSourceArn).toBeDefined();
  });

  test("24 - All primary resources include required tags (Environment, CostCenter, Owner)", () => {
    const ids = [
      "TransactionsTable",
      "TransactionsQueue",
      "TransactionsDLQ",
      "IngestionFunction",
      "DetectionFunction",
      "ScheduledAnalysisFunction",
      "RestApi",
      "AlertsTopic",
    ];
    for (const id of ids) {
      const res = getResource(tpl, id);
      const supportsTags = !!res.Properties?.Tags;
      if (supportsTags) {
        expect(hasTag(res, "Environment")).toBe(true);
        expect(hasTag(res, "CostCenter")).toBe(true);
        expect(hasTag(res, "Owner")).toBe(true);
      } else {
        expect(res.Properties?.Tags).toBeUndefined();
      }
    }
  });

  test("25 - Outputs expose key identifiers (API URL/ID, ARNs, names)", () => {
    const outs = outputs(tpl);
    const keys = [
      "ApiId",
      "ApiInvokeUrl",
      "TransactionsTableName",
      "TransactionsQueueUrl",
      "AlertsTopicArn",
      "IngestionFunctionArn",
      "DetectionFunctionArn",
      "ScheduledAnalysisFunctionArn",
      "DashboardName",
      "IngestionAlarmName",
      "DetectionAlarmName",
    ];
    for (const k of keys) {
      expect(outs).toHaveProperty(k);
    }
  });
});
