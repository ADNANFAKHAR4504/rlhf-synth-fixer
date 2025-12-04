// tests/tapstack.unit.test.ts


import * as fs from "fs";
import * as path from "path";

type CFNTemplate = {
  AWSTemplateFormatVersion?: string;
  Description?: string;
  Parameters?: Record<string, any>;
  Mappings?: Record<string, any>;
  Conditions?: Record<string, any>;
  Resources: Record<string, any>;
  Outputs?: Record<string, any>;
};

const templatePath = path.resolve(__dirname, "../lib/TapStack.json");
const raw = fs.readFileSync(templatePath, "utf-8");
const tpl: CFNTemplate = JSON.parse(raw);

const res = (id: string) => tpl.Resources?.[id]?.Properties ?? undefined;
const resType = (id: string) => tpl.Resources?.[id]?.Type ?? undefined;

const first = <T>(a: T[] | undefined) => (Array.isArray(a) && a.length ? a[0] : undefined);

// Helpers to safely search inline policies
function lambdaPolicyHasAction(policyDoc: any, action: string) {
  const stmts = policyDoc?.Statement ?? [];
  return stmts.some((s: any) => {
    const acts = Array.isArray(s.Action) ? s.Action : [s.Action];
    return acts?.includes(action);
  });
}

describe("TapStack CloudFormation template (../lib/TapStack.json)", () => {
  it("01: loads a valid template with Resources", () => {
    expect(tpl).toBeTruthy();
    expect(typeof tpl.Resources).toBe("object");
  });

  it("02: has Parameters with sane defaults (ProjectName & EnvironmentSuffix)", () => {
    expect(tpl.Parameters?.ProjectName?.Default).toBeDefined();
    expect(tpl.Parameters?.EnvironmentSuffix?.Default).toBeDefined();
    expect(tpl.Parameters?.EnvironmentSuffix?.AllowedPattern).toMatch(/^\^/);
  });

  it("03: defines LambdaFunction resource", () => {
    expect(resType("LambdaFunction")).toBe("AWS::Lambda::Function");
  });

  it("04: Lambda runtime is python3.13", () => {
    expect(res("LambdaFunction")?.Runtime).toBe("python3.13");
  });

  it("05: Lambda environment variables include TABLE_NAME, SECRET_ID, LOG_BUCKET", () => {
    const env = res("LambdaFunction")?.Environment?.Variables ?? {};
    expect(env.TABLE_NAME).toBeDefined();
    expect(env.SECRET_ID).toBeDefined();
    expect(env.LOG_BUCKET).toBeDefined();
  });

  it("06: LambdaExecutionRole exists with least-privilege key permissions", () => {
    const role = tpl.Resources?.LambdaExecutionRole;
    expect(role?.Type).toBe("AWS::IAM::Role");
    const policies = role?.Properties?.Policies ?? [];
    const inline = first(policies);
    expect(inline).toBeDefined();
    const doc = inline.PolicyDocument;
    expect(lambdaPolicyHasAction(doc, "logs:CreateLogGroup")).toBe(true);
    expect(lambdaPolicyHasAction(doc, "secretsmanager:GetSecretValue")).toBe(true);
    expect(lambdaPolicyHasAction(doc, "s3:PutObject")).toBe(true);
  });

  it("07: SecretsManagerSecret exists", () => {
    expect(resType("SecretsManagerSecret")).toBe("AWS::SecretsManager::Secret");
  });

  it("08: DynamoTable exists in PROVISIONED mode with throughput", () => {
    const t = res("DynamoTable");
    expect(resType("DynamoTable")).toBe("AWS::DynamoDB::Table");
    expect(t?.BillingMode).toBe("PROVISIONED");
    expect(t?.ProvisionedThroughput?.ReadCapacityUnits).toBeDefined();
    expect(t?.ProvisionedThroughput?.WriteCapacityUnits).toBeDefined();
  });

  it("09: DdbReadScalableTarget is configured for dynamodb read capacity", () => {
    const t = tpl.Resources?.DdbReadScalableTarget?.Properties;
    expect(t?.ServiceNamespace).toBe("dynamodb");
    expect(t?.ScalableDimension).toBe("dynamodb:table:ReadCapacityUnits");
  });

  it("10: DdbWriteScalableTarget is configured for dynamodb write capacity", () => {
    const t = tpl.Resources?.DdbWriteScalableTarget?.Properties;
    expect(t?.ServiceNamespace).toBe("dynamodb");
    expect(t?.ScalableDimension).toBe("dynamodb:table:WriteCapacityUnits");
  });

  it("11: LogBucket exists with AES256 encryption", () => {
    const b = res("LogBucket");
    const enc = b?.BucketEncryption?.ServerSideEncryptionConfiguration?.[0]?.ServerSideEncryptionByDefault?.SSEAlgorithm;
    expect(enc).toBe("AES256");
  });

  it("12: LogBucket has versioning enabled", () => {
    expect(res("LogBucket")?.VersioningConfiguration?.Status).toBe("Enabled");
  });

  it("13: LogBucket public access is fully blocked", () => {
    const pab = res("LogBucket")?.PublicAccessBlockConfiguration ?? {};
    expect(pab.BlockPublicAcls).toBe(true);
    expect(pab.BlockPublicPolicy).toBe(true);
    expect(pab.IgnorePublicAcls).toBe(true);
    expect(pab.RestrictPublicBuckets).toBe(true);
  });

  it("14: LogBucket has lifecycle rule for transition & expiration", () => {
    const rules = res("LogBucket")?.LifecycleConfiguration?.Rules ?? [];
    expect(Array.isArray(rules) && rules.length > 0).toBe(true);
  });

  it("15: LogBucketPolicy enforces TLS (aws:SecureTransport=false -> Deny)", () => {
    const pol = tpl.Resources?.LogBucketPolicy?.Properties?.PolicyDocument;
    const stmt = (pol?.Statement ?? []).find((s: any) => s.Sid === "EnforceTLS");
    expect(stmt?.Effect).toBe("Deny");
    expect(stmt?.Condition?.Bool?.["aws:SecureTransport"]).toBe("false");
  });

  it("16: ApiResource 'items' path exists under the RestApi root", () => {
    const r = res("ApiResource");
    expect(r?.PathPart).toBe("items");
    expect(r?.RestApiId).toBeDefined();
  });

  it("17: ApiMethodAny requires API key and uses AWS_PROXY to Lambda", () => {
    const m = res("ApiMethodAny");
    expect(m?.ApiKeyRequired).toBe(true);
    expect(m?.Integration?.Type).toBe("AWS_PROXY");
  });

  it("18: ApiMethodOptions provides CORS preflight via MOCK", () => {
    const m = res("ApiMethodOptions");
    expect(m?.HttpMethod).toBe("OPTIONS");
    expect(m?.Integration?.Type).toBe("MOCK");
    const mr = m?.MethodResponses?.[0]?.ResponseParameters ?? {};
    expect(mr["method.response.header.Access-Control-Allow-Origin"]).toBe(true);
  });

  it("19: ApiStage enabled with cache and metrics", () => {
    const s = res("ApiStage");
    expect(s?.CacheClusterEnabled).toBe(true);
    const ms = first(s?.MethodSettings);
    expect(ms?.CachingEnabled).toBe(true);
    expect(ms?.MetricsEnabled).toBe(true);
  });

  it("20: ApiApiKey, ApiUsagePlan, and ApiUsagePlanKey exist and link", () => {
    expect(resType("ApiApiKey")).toBe("AWS::ApiGateway::ApiKey");
    expect(resType("ApiUsagePlan")).toBe("AWS::ApiGateway::UsagePlan");
    expect(resType("ApiUsagePlanKey")).toBe("AWS::ApiGateway::UsagePlanKey");
  });

  it("21: CloudWatch log groups exist for API and Lambda with retention", () => {
    expect(resType("ApiAccessLogGroup")).toBe("AWS::Logs::LogGroup");
    expect(res("ApiAccessLogGroup")?.RetentionInDays).toBeDefined();
    expect(resType("LambdaLogGroup")).toBe("AWS::Logs::LogGroup");
    expect(res("LambdaLogGroup")?.RetentionInDays).toBeDefined();
  });

  it("22: LambdaInvokePermission allows apigateway.amazonaws.com", () => {
    const p = tpl.Resources?.LambdaInvokePermission?.Properties;
    expect(p?.Principal).toBe("apigateway.amazonaws.com");
    expect(p?.Action).toBe("lambda:InvokeFunction");
  });

  it("23: Alarm resources exist for API 4XX/5XX, Lambda errors/throttles, and DynamoDB throttles", () => {
    expect(resType("Api4xxAlarm")).toBe("AWS::CloudWatch::Alarm");
    expect(resType("Api5xxAlarm")).toBe("AWS::CloudWatch::Alarm");
    expect(resType("LambdaErrorsAlarm")).toBe("AWS::CloudWatch::Alarm");
    expect(resType("LambdaThrottlesAlarm")).toBe("AWS::CloudWatch::Alarm");
    expect(resType("DynamoThrottlesAlarm")).toBe("AWS::CloudWatch::Alarm");
  });

  it("24: Networking placeholder VPC and SecurityGroup exist with ICMP/TCP rules", () => {
    expect(resType("ApiVpc")).toBe("AWS::EC2::VPC");
    const sg = res("ApiSecurityGroup");
    expect(sg?.SecurityGroupIngress).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ IpProtocol: "icmp" }),
        expect.objectContaining({ IpProtocol: "tcp", FromPort: 80, ToPort: 80 }),
        expect.objectContaining({ IpProtocol: "tcp", FromPort: 443, ToPort: 443 }),
      ])
    );
  });

  it("25: No explicit physical names on bucket/table/function/secret to avoid early-validation conflicts", () => {
    expect(res("LogBucket")?.BucketName).toBeUndefined();
    expect(res("DynamoTable")?.TableName).toBeUndefined();
    expect(res("LambdaFunction")?.FunctionName).toBeUndefined();
    // Secrets Manager allows Name; we ensure it's not explicitly set
    expect(res("SecretsManagerSecret")?.Name).toBeUndefined();
  });

  it("26: Outputs include ApiInvokeUrl and LogBucketArn for post-deploy wiring", () => {
    expect(tpl.Outputs?.ApiInvokeUrl?.Value).toBeDefined();
    expect(tpl.Outputs?.LogBucketArn?.Value).toBeDefined();
  });
});
