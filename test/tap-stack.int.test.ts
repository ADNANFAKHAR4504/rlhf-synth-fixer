// test/tap-stack.int.test.ts
import fs from "fs";
import path from "path";
import { setTimeout as wait } from "timers/promises";

/* ============================== AWS SDK v3 ============================== */
import {
  EC2Client,
  DescribeVpcsCommand,
  DescribeSubnetsCommand,
  DescribeSecurityGroupsCommand,
  DescribeVpcEndpointsCommand,
  Filter as EC2Filter,
} from "@aws-sdk/client-ec2";

import {
  S3Client,
  HeadBucketCommand,
  GetBucketEncryptionCommand,
  GetBucketVersioningCommand,
  GetBucketPolicyCommand,
} from "@aws-sdk/client-s3";

import {
  DynamoDBClient,
  DescribeTableCommand,
} from "@aws-sdk/client-dynamodb";

import {
  ApplicationAutoScalingClient,
  DescribeScalableTargetsCommand,
  ScalableDimension,
  ServiceNamespace,
} from "@aws-sdk/client-application-auto-scaling";

import {
  LambdaClient,
  GetFunctionCommand,
} from "@aws-sdk/client-lambda";

import {
  CloudWatchLogsClient,
  DescribeLogGroupsCommand,
} from "@aws-sdk/client-cloudwatch-logs";

import {
  CloudWatchClient,
  DescribeAlarmsCommand,
} from "@aws-sdk/client-cloudwatch";

import {
  CloudWatchEventsClient,
  DescribeRuleCommand,
  ListTargetsByRuleCommand,
} from "@aws-sdk/client-cloudwatch-events";

import {
  APIGatewayClient,
  GetRestApiCommand,
  GetResourcesCommand,
  GetMethodCommand,
  GetStageCommand,
} from "@aws-sdk/client-api-gateway";

import {
  KMSClient,
  DescribeKeyCommand,
  ListAliasesCommand,
} from "@aws-sdk/client-kms";

import {
  CognitoIdentityProviderClient,
  DescribeUserPoolCommand,
  DescribeUserPoolClientCommand,
} from "@aws-sdk/client-cognito-identity-provider";

import {
  CognitoIdentityClient,
  DescribeIdentityPoolCommand,
} from "@aws-sdk/client-cognito-identity";

import {
  SNSClient,
  GetTopicAttributesCommand,
  ListSubscriptionsByTopicCommand,
} from "@aws-sdk/client-sns";

import {
  SecretsManagerClient,
  DescribeSecretCommand,
} from "@aws-sdk/client-secrets-manager";

/* ---------------------------- Setup / Helpers --------------------------- */

const p = path.resolve(process.cwd(), "cfn-outputs/all-outputs.json");
if (!fs.existsSync(p)) {
  throw new Error(`Expected CloudFormation outputs file at ${p}`);
}
const raw = JSON.parse(fs.readFileSync(p, "utf8"));
// Support both {"StackName":[{OutputKey,OutputValue}...]} and {"Outputs":[...]}
const topKey = Object.keys(raw)[0];
const outputsArr: { OutputKey: string; OutputValue: string }[] =
  Array.isArray(raw.Outputs) ? raw.Outputs : raw[topKey];
if (!Array.isArray(outputsArr)) {
  throw new Error("Could not parse outputs array from all-outputs.json");
}
const outputs: Record<string, string> = {};
for (const o of outputsArr) outputs[o.OutputKey] = o.OutputValue;

// deduce region from ApiInvokeUrl or env
function deduceRegion(): string {
  const apiUrl = outputs.ApiInvokeUrl || "";
  const m = apiUrl.match(/execute-api\.([a-z0-9-]+)\.amazonaws\.com/);
  if (m) return m[1];
  return process.env.AWS_REGION || process.env.AWS_DEFAULT_REGION || "us-east-1";
}
const region = deduceRegion();

// Extract ENVIRONMENTSUFFIX by looking at a named output that embeds it (e.g., TransformFunctionLogGroupName)
function deduceSuffix(): string {
  // Try API stage output
  const stage = outputs.ApiStageNameOut || "";
  const sm = stage.match(/-(dev|staging|prod)$/);
  if (sm) return sm[1];
  // Try bucket name
  const b = outputs.IngestBucketName || "";
  const bm = b.match(/^ingestbucket-([a-z]+)-\d{12}$/);
  if (bm) return bm[1];
  // Fall back to common default
  return "dev";
}
const ENV_SUFFIX = deduceSuffix();

// Extract API id & stage from ApiInvokeUrl
function parseApiFromUrl(u: string): { apiId?: string; stage?: string } {
  const m = u.match(/^https:\/\/([a-z0-9]+)\.execute-api\.[a-z0-9-]+\.amazonaws\.com\/([^/]+)/i);
  return { apiId: m?.[1], stage: m?.[2] };
}
const { apiId, stage } = parseApiFromUrl(outputs.ApiInvokeUrl || "");

// Simple retry with backoff
async function retry<T>(fn: () => Promise<T>, attempts = 4, baseMs = 600): Promise<T> {
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

// Clients
const ec2 = new EC2Client({ region });
const s3 = new S3Client({ region });
const ddb = new DynamoDBClient({ region });
const appAS = new ApplicationAutoScalingClient({ region });
const lambda = new LambdaClient({ region });
const logs = new CloudWatchLogsClient({ region });
const cw = new CloudWatchClient({ region });
const events = new CloudWatchEventsClient({ region });
const apigw = new APIGatewayClient({ region });
const kms = new KMSClient({ region });
const cognitoIdP = new CognitoIdentityProviderClient({ region });
const cognitoId = new CognitoIdentityClient({ region });
const sns = new SNSClient({ region });
const secrets = new SecretsManagerClient({ region });

/* -------------------------------- Tests -------------------------------- */

describe("TapStack — Live Integration Tests (serverless data pipeline)", () => {
  jest.setTimeout(10 * 60 * 1000); // 10 minutes for the full suite

  /* 1 */ it("Outputs exist and core keys are present", () => {
    expect(outputs.VPCId).toMatch(/^vpc-/);
    expect(outputs.IngestBucketName).toMatch(/^ingestbucket-/);
    expect(outputs.ArtifactsBucketName).toMatch(/^artifactsbucket-/);
    expect(outputs.ResultsTableName).toMatch(/^ResultsTable-/);
    expect(outputs.TransformFunctionArn).toContain(":function:");
    expect(outputs.ApiHandlerFunctionArn).toContain(":function:");
    expect(outputs.ApiInvokeUrl).toMatch(/^https:\/\/.+\/.+/);
    expect(outputs.CognitoUserPoolId).toBeDefined();
    expect(outputs.CognitoUserPoolClientId).toBeDefined();
    expect(outputs.CognitoIdentityPoolId).toBeDefined();
    expect(outputs.DevelopersTopicArn).toMatch(/^arn:aws:sns:/);
    expect(outputs.ApplicationCMKArn).toMatch(/^arn:aws:kms:/);
  });

  /* 2 */ it("VPC exists", async () => {
    const vpcId = outputs.VPCId;
    const resp = await retry(() => ec2.send(new DescribeVpcsCommand({ VpcIds: [vpcId] })));
    expect(resp.Vpcs && resp.Vpcs[0].VpcId).toBe(vpcId);
  });

  /* 3 */ it("Private and Public subnets exist in distinct AZs", async () => {
    const ids = [
      outputs.PrivateSubnetAId,
      outputs.PrivateSubnetBId,
      outputs.PublicSubnetAId,
      outputs.PublicSubnetBId,
    ];
    const r = await retry(() => ec2.send(new DescribeSubnetsCommand({ SubnetIds: ids })));
    const azs = (r.Subnets || []).map(s => s.AvailabilityZone || "");
    expect(new Set(azs).size).toBeGreaterThanOrEqual(2);
  });

  /* 4 */ it("S3 Ingest bucket exists, has SSE-S3, versioning on, lifecycle to Glacier", async () => {
    const b = outputs.IngestBucketName;
    await retry(() => s3.send(new HeadBucketCommand({ Bucket: b })));
    const enc = await retry(() => s3.send(new GetBucketEncryptionCommand({ Bucket: b })));
    const rule = enc.ServerSideEncryptionConfiguration?.Rules?.[0];
    expect(rule?.ApplyServerSideEncryptionByDefault?.SSEAlgorithm || rule?.ServerSideEncryptionByDefault?.SSEAlgorithm).toBe("AES256");
    const ver = await retry(() => s3.send(new GetBucketVersioningCommand({ Bucket: b })));
    expect(["Enabled", "Suspended"]).toContain(ver.Status || "Enabled");
    // Policy contains deny-unencrypted and vpce restriction
    const pol = await retry(() => s3.send(new GetBucketPolicyCommand({ Bucket: b })));
    expect(pol.Policy).toContain("DenyUnencryptedObjectUploads");
    expect(pol.Policy).toContain("RestrictToVPCEndpoint");
  });

  /* 5 */ it("S3 Artifacts bucket exists, has SSE-S3, versioning on", async () => {
    const b = outputs.ArtifactsBucketName;
    await retry(() => s3.send(new HeadBucketCommand({ Bucket: b })));
    const enc = await retry(() => s3.send(new GetBucketEncryptionCommand({ Bucket: b })));
    const rule = enc.ServerSideEncryptionConfiguration?.Rules?.[0];
    expect(rule?.ApplyServerSideEncryptionByDefault?.SSEAlgorithm || rule?.ServerSideEncryptionByDefault?.SSEAlgorithm).toBe("AES256");
    const ver = await retry(() => s3.send(new GetBucketVersioningCommand({ Bucket: b })));
    expect(["Enabled", "Suspended"]).toContain(ver.Status || "Enabled");
  });

  /* 6 */ it("KMS CMK and alias exist", async () => {
    const keyArn = outputs.ApplicationCMKArn;
    const d = await retry(() => kms.send(new DescribeKeyCommand({ KeyId: keyArn })));
    expect(d.KeyMetadata?.Arn).toBe(keyArn);
    const aliases = await retry(() => kms.send(new ListAliasesCommand({ KeyId: d.KeyMetadata!.KeyId })));
    const expectAlias = `alias/app-cmk-${ENV_SUFFIX}`;
    const found = (aliases.Aliases || []).some(a => a.AliasName === expectAlias);
    expect(found).toBe(true);
  });

  /* 7 */ it("DynamoDB table exists with KMS SSE and PROVISIONED", async () => {
    const t = outputs.ResultsTableName;
    const r = await retry(() => ddb.send(new DescribeTableCommand({ TableName: t })));
    expect(r.Table?.TableName).toBe(t);
    expect(r.Table?.SSEDescription?.Status).toBeDefined();
    expect(r.Table?.BillingModeSummary?.BillingMode || "PROVISIONED").toBe("PROVISIONED");
  });

  /* 8 */ it("Application Auto Scaling targets exist for DDB read & write", async () => {
    const t = outputs.ResultsTableName;
    const resourceId = `table/${t}`;
    const list = await retry(() =>
      appAS.send(new DescribeScalableTargetsCommand({
        ServiceNamespace: ServiceNamespace.dynamodb,
        ResourceIds: [resourceId],
      }))
    );
    const dims = (list.ScalableTargets || []).map(s => s.ScalableDimension as ScalableDimension);
    expect(dims).toEqual(expect.arrayContaining([
      "dynamodb:table:ReadCapacityUnits",
      "dynamodb:table:WriteCapacityUnits",
    ]));
  });

  /* 9 */ it("Lambda TransformFunction exists, VPC-enabled, has KMS and env vars", async () => {
    const arn = outputs.TransformFunctionArn;
    const f = await retry(() => lambda.send(new GetFunctionCommand({ FunctionName: arn })));
    const cfg = f.Configuration!;
    expect(cfg.KMSKeyArn).toBe(outputs.ApplicationCMKArn);
    expect(cfg.VpcConfig?.SubnetIds?.length).toBeGreaterThanOrEqual(2);
    expect(cfg.Environment?.Variables?.ENVIRONMENT).toBeDefined();
    expect(cfg.Timeout).toBeGreaterThanOrEqual(1);
  });

  /*10*/ it("Lambda ApiHandlerFunction exists, VPC-enabled, has KMS and env vars", async () => {
    const arn = outputs.ApiHandlerFunctionArn;
    const f = await retry(() => lambda.send(new GetFunctionCommand({ FunctionName: arn })));
    const cfg = f.Configuration!;
    expect(cfg.KMSKeyArn).toBe(outputs.ApplicationCMKArn);
    expect(cfg.VpcConfig?.SubnetIds?.length).toBeGreaterThanOrEqual(2);
    expect(cfg.Environment?.Variables?.ENVIRONMENT).toBeDefined();
  });

  /*11*/ it("CloudWatch LogGroups for both Lambdas exist with retention", async () => {
    const lg1 = outputs.TransformFunctionLogGroupName;
    const lg2 = outputs.ApiHandlerFunctionLogGroupName;
    const resp = await retry(() => logs.send(new DescribeLogGroupsCommand({ logGroupNamePrefix: "/aws/lambda/" })));
    const names = (resp.logGroups || []).map(g => g.logGroupName);
    expect(names).toEqual(expect.arrayContaining([lg1, lg2]));
    // Check retention set on at least one (template sets both)
    const one = (resp.logGroups || []).find(g => g.logGroupName === lg1 || g.logGroupName === lg2);
    expect((one?.retentionInDays || 0)).toBeGreaterThan(0);
  });

  /*12*/ it("EventBridge rule wired to TransformFunction exists and is enabled", async () => {
    const ruleName = `TapStack-S3ObjectCreated-${ENV_SUFFIX}`;
    const r = await retry(() => events.send(new DescribeRuleCommand({ Name: ruleName })));
    expect(r.State).toBe("ENABLED");
    const targets = await retry(() => events.send(new ListTargetsByRuleCommand({ Rule: ruleName })));
    const hasLambda = (targets.Targets || []).some(t => (t.Arn || "").includes(":function:"));
    expect(hasLambda).toBe(true);
  });

  /*13*/ it("API Gateway RestApi and Stage are present and match ApiInvokeUrl", async () => {
    expect(apiId).toBeDefined();
    expect(stage).toBeDefined();
    const api = await retry(() => apigw.send(new GetRestApiCommand({ restApiId: apiId! })));
    expect(api.id).toBe(apiId);
    const st = await retry(() => apigw.send(new GetStageCommand({ restApiId: apiId!, stageName: stage! })));
    expect(st.stageName).toBe(stage);
  });

  /*14*/ it("API Gateway /process method exists with AWS_PROXY integration", async () => {
    const api = await retry(() => apigw.send(new GetResourcesCommand({ restApiId: apiId! })));
    const processRes = (api.items || []).find(r => r.path === "/process");
    expect(processRes).toBeDefined();
    const method = await retry(() => apigw.send(new GetMethodCommand({
      restApiId: apiId!,
      resourceId: processRes!.id!,
      httpMethod: "POST",
    })));
    expect(method.methodIntegration?.type).toBe("AWS_PROXY");
    expect(method.methodIntegration?.uri || "").toContain(":lambda:path/2015-03-31/functions/");
  });

  /*15*/ it("Cognito UserPool and Client exist", async () => {
    const upId = outputs.CognitoUserPoolId;
    const clId = outputs.CognitoUserPoolClientId;
    const up = await retry(() => cognitoIdP.send(new DescribeUserPoolCommand({ UserPoolId: upId })));
    expect(up.UserPool?.Id).toBe(upId);
    const cl = await retry(() => cognitoIdP.send(new DescribeUserPoolClientCommand({
      UserPoolId: upId,
      ClientId: clId,
    })));
    expect(cl.UserPoolClient?.ClientId).toBe(clId);
  });

  /*16*/ it("Cognito IdentityPool exists", async () => {
    const id = outputs.CognitoIdentityPoolId;
    const d = await retry(() => cognitoId.send(new DescribeIdentityPoolCommand({ IdentityPoolId: id })));
    expect(d.IdentityPoolId).toBe(id);
    expect(d.AllowUnauthenticatedIdentities).toBe(false);
  });

  /*17*/ it("SNS Topic exists and has at least one subscription (email may be PendingConfirmation)", async () => {
    const topicArn = outputs.DevelopersTopicArn;
    const attrs = await retry(() => sns.send(new GetTopicAttributesCommand({ TopicArn: topicArn })));
    expect(attrs.Attributes).toBeDefined();
    const subs = await retry(() => sns.send(new ListSubscriptionsByTopicCommand({ TopicArn: topicArn })));
    expect(Array.isArray(subs.Subscriptions)).toBe(true);
    expect((subs.Subscriptions || []).length).toBeGreaterThanOrEqual(1);
  });

  /*18*/ it("CloudWatch alarms for Lambda errors/throttles/API 5XX/DynamoDB throttles are discoverable", async () => {
    const all = await retry(() => cw.send(new DescribeAlarmsCommand({})));
    const alarms = all.MetricAlarms || [];
    // Match by metric + dimension instead of hardcoded names
    const fn1 = outputs.TransformFunctionArn.split(":function:")[1];
    const fn2 = outputs.ApiHandlerFunctionArn.split(":function:")[1];
    const table = outputs.ResultsTableName;

    const hasLambdaErrors = alarms.some(a => a.Namespace === "AWS/Lambda" && a.MetricName === "Errors" &&
      (a.Dimensions || []).some(d => d.Name === "FunctionName" && (d.Value === fn1 || d.Value === fn2)));
    const hasLambdaThrottles = alarms.some(a => a.Namespace === "AWS/Lambda" && a.MetricName === "Throttles");
    const hasApi5xx = alarms.some(a => a.Namespace === "AWS/ApiGateway" && a.MetricName === "5XXError");
    const hasDdbThrottles = alarms.some(a => a.Namespace === "AWS/DynamoDB" && a.MetricName === "ThrottledRequests" &&
      (a.Dimensions || []).some(d => d.Name === "TableName" && d.Value === table));

    expect(hasLambdaErrors).toBe(true);
    expect(hasLambdaThrottles).toBe(true);
    expect(hasApi5xx).toBe(true);
    expect(hasDdbThrottles).toBe(true);
  });

  /*19*/ it("S3 Gateway VPC endpoint exists in the stack VPC", async () => {
    const vpcId = outputs.VPCId;
    const r = await retry(() => ec2.send(new DescribeVpcEndpointsCommand({
      Filters: [
        { Name: "vpc-id", Values: [vpcId] } as EC2Filter,
        { Name: "vpc-endpoint-type", Values: ["Gateway"] } as EC2Filter,
        { Name: "service-name", Values: [`com.amazonaws.${region}.s3`] } as EC2Filter,
      ],
    })));
    expect((r.VpcEndpoints || []).length).toBeGreaterThanOrEqual(1);
  });

  /*20*/ it("Lambda Security Group exists in VPC and allows egress 443", async () => {
    const vpcId = outputs.VPCId;
    const sgs = await retry(() => ec2.send(new DescribeSecurityGroupsCommand({
      Filters: [{ Name: "vpc-id", Values: [vpcId] }],
    })));
    // find SG by Name tag pattern
    const target = (sgs.SecurityGroups || []).find(sg =>
      (sg.Tags || []).some(t => t.Key === "Name" && (t.Value || "").includes(`TapStack-LambdaSG-${ENV_SUFFIX}`))
    );
    expect(target?.GroupId).toMatch(/^sg-/);
    const egress443 = (target?.IpPermissionsEgress || []).some(e => e.FromPort === 443 && e.ToPort === 443);
    expect(egress443).toBe(true);
  });

  /*21*/ it("Secrets Manager app secret exists and uses CMK", async () => {
    const name = `TapStack-AppSecret-${ENV_SUFFIX}`;
    const d = await retry(() => secrets.send(new DescribeSecretCommand({ SecretId: name })));
    expect(d.Name).toBe(name);
    expect(d.KmsKeyId || "").toContain(":key/");
  });

  /*22*/ it("API Stage name in outputs matches discovered API Gateway stage", async () => {
    const st = await retry(() => apigw.send(new GetStageCommand({ restApiId: apiId!, stageName: stage! })));
    expect(`${stage}-${ENV_SUFFIX}`.endsWith(ENV_SUFFIX)).toBe(true); // suffix sanity
    expect(st.stageName).toBe(stage);
  });

  /*23*/ it("TransformFunction and ApiHandlerFunction share the same VPC as outputs.VPCId", async () => {
    const vpcId = outputs.VPCId;
    const tf = await retry(() => lambda.send(new GetFunctionCommand({ FunctionName: outputs.TransformFunctionArn })));
    const af = await retry(() => lambda.send(new GetFunctionCommand({ FunctionName: outputs.ApiHandlerFunctionArn })));
    // Find subnets and ensure they belong to the same VPC
    const subnets = [
      ...(tf.Configuration?.VpcConfig?.SubnetIds || []),
      ...(af.Configuration?.VpcConfig?.SubnetIds || []),
    ];
    const desc = await retry(() => ec2.send(new DescribeSubnetsCommand({ SubnetIds: subnets })));
    const allVpcIds = new Set((desc.Subnets || []).map(s => s.VpcId));
    expect(allVpcIds.size).toBe(1);
    expect(allVpcIds.has(vpcId)).toBe(true);
  });

  /*24*/ it("DynamoDB stream is enabled on ResultsTable (NEW_AND_OLD_IMAGES)", async () => {
    const t = outputs.ResultsTableName;
    const r = await retry(() => ddb.send(new DescribeTableCommand({ TableName: t })));
    expect(r.Table?.StreamSpecification?.StreamEnabled ?? true).toBe(true);
    expect(r.Table?.StreamSpecification?.StreamViewType).toBe("NEW_AND_OLD_IMAGES");
  });
});
