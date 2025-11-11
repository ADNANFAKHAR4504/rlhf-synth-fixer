/**
 * File: test/tap-stack.unit.test.ts
 *
 * Jest unit tests for TapStack CloudFormation stack.
 * - Prefers ../lib/TapStack.json
 * - Falls back to ../lib/TapStack.yml (using 'yaml' or 'js-yaml' if available)
 * - If both exist, JSON is used as the source of truth.
 *
 * Requirements covered:
 *  - Validates Parameters, Resources, and Outputs
 *  - Ensures serverless best practices per prompt (runtime, memory, RC, X-Ray, DLQ, alarms)
 *  - Verifies S3->Lambda, DynamoDB with Streams & PITR, SNS, SQS DLQ, API Gateway, IAM least-privilege shape
 *  - 25 total test cases
 */

import * as fs from "fs";
import * as path from "path";

// ---------- Helpers: Load template (JSON preferred; YAML fallback) ----------
type CfnTemplate = {
  AWSTemplateFormatVersion?: string;
  Description?: string;
  Parameters?: Record<string, any>;
  Resources?: Record<string, any>;
  Outputs?: Record<string, any>;
  [k: string]: any;
};

function tryRequire(mod: string): any | null {
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    return require(mod);
  } catch {
    return null;
  }
}

function loadTemplate(): CfnTemplate {
  const jsonPath = path.resolve(__dirname, "../lib/TapStack.json");
  const ymlPath = path.resolve(__dirname, "../lib/TapStack.yml");
  const yamlPath = ymlPath; // alias

  // Prefer JSON if available
  if (fs.existsSync(jsonPath)) {
    const raw = fs.readFileSync(jsonPath, "utf8");
    return JSON.parse(raw);
  }

  // Fallback to YAML if JSON missing
  if (fs.existsSync(yamlPath)) {
    const YAML = tryRequire("yaml") || tryRequire("js-yaml");
    const raw = fs.readFileSync(yamlPath, "utf8");
    if (YAML && typeof YAML.parse === "function") {
      return YAML.parse(raw) as CfnTemplate;
    }
    if (YAML && typeof YAML.load === "function") {
      return YAML.load(raw) as CfnTemplate;
    }

    // Ultra-minimal fallback: since the template is valid YAML,
    // attempt a best-effort parse of top-level blocks (Resources/Parameters/Outputs).
    // This is not a full YAML parser but prevents build-time errors if YAML libs are unavailable.
    const minimal: CfnTemplate = {};
    // Very naive extraction (non-fatal); tests depending on deep structure may fail if libs absent.
    minimal.Resources = {};
    minimal.Parameters = {};
    minimal.Outputs = {};
    return minimal;
  }

  throw new Error("Neither ../lib/TapStack.json nor ../lib/TapStack.yml found.");
}

const tpl = loadTemplate();

// ---------- Convenience getters ----------
const Resources = tpl.Resources || {};
const Parameters = tpl.Parameters || {};
const Outputs = tpl.Outputs || {};

function byLogicalId(id: string) {
  const r = Resources[id];
  expect(r).toBeTruthy();
  return r;
}

function ofType(id: string, type: string) {
  const r = byLogicalId(id);
  expect(r.Type).toBe(type);
  return r;
}

function findResourcesByType(type: string): Array<{ id: string; res: any }> {
  return Object.entries(Resources)
    .filter(([, v]) => (v as any).Type === type)
    .map(([id, res]) => ({ id, res }));
}

// ---------- TESTS (25) ----------
describe("TapStack CloudFormation Template", () => {
  // 1
  test("Has AWSTemplateFormatVersion and Description", () => {
    expect(tpl.AWSTemplateFormatVersion).toBeDefined();
    expect(typeof tpl.Description).toBe("string");
  });

  // 2
  test("Parameters: ProjectName, EnvironmentSuffix, AlertEmail exist with sane defaults", () => {
    expect(Parameters.ProjectName).toBeDefined();
    expect(Parameters.EnvironmentSuffix).toBeDefined();
    expect(Parameters.AlertEmail).toBeDefined();
    expect(Parameters.ProjectName.Default).toBeDefined();
    expect(["dev", "staging", "prod"]).toContain(
      Parameters.EnvironmentSuffix.Default
    );
  });

  // 3
  test("S3 bucket exists with versioning and lifecycle (90 days)", () => {
    const s3 = ofType("IngestBucket", "AWS::S3::Bucket");
    const props = s3.Properties || {};
    expect(props.VersioningConfiguration?.Status).toBe("Enabled");
    const rules = props.LifecycleConfiguration?.Rules || [];
    expect(Array.isArray(rules)).toBe(true);
    const rule = rules.find((r: any) => r.ExpirationInDays === 90);
    expect(rule).toBeTruthy();
  });

  // 4
  test("S3 bucket has ObjectCreated trigger filtered to uploads/*.csv", () => {
    const s3 = ofType("IngestBucket", "AWS::S3::Bucket");
    const conf = s3.Properties?.NotificationConfiguration;
    expect(conf).toBeDefined();
    const lambdas = conf?.LambdaConfigurations || [];
    expect(Array.isArray(lambdas) && lambdas.length >= 1).toBe(true);
    const lc = lambdas[0];
    expect(lc.Event).toBe("s3:ObjectCreated:*");
    const rules = lc.Filter?.S3Key?.Rules || [];
    const hasPrefix = rules.some((r: any) => r.Name === "prefix" && r.Value === "uploads/");
    const hasSuffix = rules.some((r: any) => r.Name === "suffix" && r.Value === ".csv");
    expect(hasPrefix).toBe(true);
    expect(hasSuffix).toBe(true);
  });

  // 5
  test("BucketPolicy denies insecure transport", () => {
    const bp = ofType("IngestBucketPolicy", "AWS::S3::BucketPolicy");
    const stmt = (bp.Properties?.PolicyDocument?.Statement || []) as any[];
    const deny = stmt.find(
      (s) => s.Effect === "Deny" && s.Sid === "DenyInsecureTransport"
    );
    expect(deny).toBeTruthy();
  });

  // 6
  test("DynamoDB TransactionsTable exists with PAY_PER_REQUEST, correct keys, Streams NEW_IMAGE, and PITR", () => {
    const ddb = ofType("TransactionsTable", "AWS::DynamoDB::Table");
    const props = ddb.Properties || {};
    expect(props.BillingMode).toBe("PAY_PER_REQUEST");
    const ks = props.KeySchema || [];
    expect(ks.find((k: any) => k.AttributeName === "transactionId" && k.KeyType === "HASH")).toBeTruthy();
    expect(ks.find((k: any) => k.AttributeName === "timestamp" && k.KeyType === "RANGE")).toBeTruthy();
    expect(props.StreamSpecification?.StreamViewType).toBe("NEW_IMAGE");
    expect(props.PointInTimeRecoverySpecification?.PointInTimeRecoveryEnabled).toBe(true);
  });

  // 7
  test("SQS DeadLetterQueue exists with retention", () => {
    const q = ofType("DeadLetterQueue", "AWS::SQS::Queue");
    expect(q.Properties?.MessageRetentionPeriod).toBeGreaterThan(0);
  });

  // 8
  test("SNS FraudAlertsTopic and email Subscription exist", () => {
    ofType("FraudAlertsTopic", "AWS::SNS::Topic");
    const sub = ofType("FraudAlertsSubscriptionEmail", "AWS::SNS::Subscription");
    expect(sub.Properties?.Protocol).toBe("email");
  });

  // 9
  test("IAM Role: IngestionLambdaRole includes X-Ray managed policy and least-privilege statements", () => {
    const role = ofType("IngestionLambdaRole", "AWS::IAM::Role");
    const mps = role.Properties?.ManagedPolicyArns || [];
    expect(mps).toContain("arn:aws:iam::aws:policy/AWSXRayDaemonWriteAccess");
    const pols = role.Properties?.Policies || [];
    const doc = pols[0]?.PolicyDocument;
    expect(JSON.stringify(doc)).toContain("s3:GetObject");
    expect(JSON.stringify(doc)).toContain("dynamodb:PutItem");
  });

  // 10
  test("IAM Role: FraudLambdaRole includes Streams read, SNS publish, DLQ send", () => {
    const role = ofType("FraudLambdaRole", "AWS::IAM::Role");
    const doc = JSON.stringify(role.Properties?.Policies || []);
    expect(doc).toContain("dynamodb:GetRecords");
    expect(doc).toContain("sns:Publish");
    expect(doc).toContain("sqs:SendMessage");
  });

  // 11
  test("IAM Role: ApiLambdaRole can Query/GetItem on table", () => {
    const role = ofType("ApiLambdaRole", "AWS::IAM::Role");
    const doc = JSON.stringify(role.Properties?.Policies || []);
    expect(doc).toContain("dynamodb:GetItem");
    expect(doc).toContain("dynamodb:Query");
  });

  // 12
  test("IngestionLambda exists with Python 3.11, 512MB, RC=10, timeout and DLQ", () => {
    const fn = ofType("IngestionLambda", "AWS::Lambda::Function");
    const p = fn.Properties || {};
    expect(p.Runtime).toBe("python3.11");
    expect(p.MemorySize).toBe(512);
    expect(p.ReservedConcurrentExecutions).toBe(10);
    expect(p.Timeout).toBeGreaterThanOrEqual(30);
    expect(p.DeadLetterConfig?.TargetArn).toBeDefined();
  });

  // 13
  test("IngestionLambda has TracingConfig Active and env TABLE_NAME", () => {
    const fn = ofType("IngestionLambda", "AWS::Lambda::Function");
    const p = fn.Properties || {};
    expect(p.TracingConfig?.Mode).toBe("Active");
    expect(p.Environment?.Variables?.TABLE_NAME).toBeDefined();
  });

  // 14
  test("FraudDetectionLambda exists with Python 3.11, 512MB, RC=10, DLQ, and ALERT_TOPIC_ARN env", () => {
    const fn = ofType("FraudDetectionLambda", "AWS::Lambda::Function");
    const p = fn.Properties || {};
    expect(p.Runtime).toBe("python3.11");
    expect(p.MemorySize).toBe(512);
    expect(p.ReservedConcurrentExecutions).toBe(10);
    expect(p.DeadLetterConfig?.TargetArn).toBeDefined();
    expect(p.Environment?.Variables?.ALERT_TOPIC_ARN).toBeDefined();
  });

  // 15
  test("FraudStreamMapping wires DynamoDB Stream to FraudDetectionLambda", () => {
    const map = ofType("FraudStreamMapping", "AWS::Lambda::EventSourceMapping");
    const p = map.Properties || {};
    expect(p.EventSourceArn).toBeDefined();
    expect(p.FunctionName).toBeDefined();
    expect(p.StartingPosition).toBe("LATEST");
    expect(p.Enabled).toBe(true);
  });

  // 16
  test("ApiLambda exists and uses Python 3.11 with env TABLE_NAME", () => {
    const fn = ofType("ApiLambda", "AWS::Lambda::Function");
    const p = fn.Properties || {};
    expect(p.Runtime).toBe("python3.11");
    expect(p.Environment?.Variables?.TABLE_NAME).toBeDefined();
  });

  // 17
  test("API Gateway RestApi + /transactions resource + GET/POST methods", () => {
    ofType("ApiGatewayRestApi", "AWS::ApiGateway::RestApi");
    ofType("ApiGatewayResourceTransactions", "AWS::ApiGateway::Resource");
    ofType("ApiGatewayMethodGetTransaction", "AWS::ApiGateway::Method");
    ofType("ApiGatewayMethodPostTransaction", "AWS::ApiGateway::Method");
  });

  // 18
  test("API methods require API key and integrate with Lambda proxy", () => {
    const getM = ofType("ApiGatewayMethodGetTransaction", "AWS::ApiGateway::Method");
    const postM = ofType("ApiGatewayMethodPostTransaction", "AWS::ApiGateway::Method");
    expect(getM.Properties?.ApiKeyRequired).toBe(true);
    expect(postM.Properties?.ApiKeyRequired).toBe(true);
    expect(getM.Properties?.Integration?.Type).toBe("AWS_PROXY");
    expect(postM.Properties?.Integration?.Type).toBe("AWS_PROXY");
  });

  // 19
  test("UsagePlan quota is 1000/day and key attached", () => {
    const up = ofType("ApiGatewayUsagePlan", "AWS::ApiGateway::UsagePlan");
    const quota = up.Properties?.Quota;
    expect(quota?.Limit).toBe(1000);
    expect(quota?.Period).toBe("DAY");
    ofType("ApiGatewayApiKey", "AWS::ApiGateway::ApiKey");
    ofType("ApiGatewayUsagePlanKey", "AWS::ApiGateway::UsagePlanKey");
  });

  // 20
  test("Log groups exist for all Lambdas with Retention 30 days", () => {
    const logs = findResourcesByType("AWS::Logs::LogGroup");
    expect(logs.length).toBeGreaterThanOrEqual(3);
    logs.forEach(({ res }) => {
      expect(res.Properties?.RetentionInDays).toBe(30);
    });
  });

  // 21
  test("CloudWatch Alarms exist for each Lambda using metric math (1 return-data metric)", () => {
    const alarms = findResourcesByType("AWS::CloudWatch::Alarm");
    // expect 3 alarms (ingestion, fraud, api)
    expect(alarms.length).toBeGreaterThanOrEqual(3);
    alarms.forEach(({ res }) => {
      const metrics = res.Properties?.Metrics || [];
      // should include an expression named 'rate' with ReturnData true
      const expr = metrics.find((m: any) => m.Expression && m.ReturnData === true);
      expect(expr).toBeTruthy();
      // raw metrics should have ReturnData false
      const raws = metrics.filter((m: any) => m.MetricStat);
      raws.forEach((m: any) => {
        expect(m.ReturnData === false || m.ReturnData === undefined).toBe(true);
      });
    });
  });

  // 22
  test("Outputs include bucket name, table ARN, and API base URL", () => {
    expect(Outputs.IngestBucketName).toBeDefined();
    expect(Outputs.TransactionsTableArn).toBeDefined();
    expect(Outputs.ApiBaseUrl).toBeDefined();
  });

  // 23
  test("All Lambda functions have ReservedConcurrentExecutions = 10", () => {
    const lambdas = findResourcesByType("AWS::Lambda::Function");
    lambdas.forEach(({ res }) => {
      expect(res.Properties?.ReservedConcurrentExecutions).toBe(10);
    });
  });

  // 24
  test("All Lambda functions have TracingConfig Mode Active", () => {
    const lambdas = findResourcesByType("AWS::Lambda::Function");
    lambdas.forEach(({ res }) => {
      expect(res.Properties?.TracingConfig?.Mode).toBe("Active");
    });
  });

  // 25
  test("Least-privilege shape: no wildcard Resource '*' in inline IAM policies (except allowed CloudWatch Logs create group)", () => {
    const roles = findResourcesByType("AWS::IAM::Role");
    roles.forEach(({ res }) => {
      const policies: any[] = (res.Properties?.Policies || []).map((p: any) => p.PolicyDocument) || [];
      const docStr = JSON.stringify(policies);
      // Allow '*' for logs:CreateLogGroup resource pattern (account-wide), but try to prevent broad '*'
      // We'll assert there is no blatant '"Resource":"*"' occurrence.
      expect(docStr.includes('"Resource":"*"')).toBe(false);
    });
  });
});
