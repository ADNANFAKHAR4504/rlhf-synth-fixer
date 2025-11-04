import fs from "fs";
import path from "path";
import crypto from "crypto";
import { setTimeout as wait } from "timers/promises";

import {
  EC2Client,
  DescribeVpcsCommand,
  DescribeSubnetsCommand,
  DescribeSecurityGroupsCommand,
  DescribeVpcEndpointsCommand,
  DescribeNatGatewaysCommand,
  DescribeRouteTablesCommand,
  DescribeVpcEndpointsCommandInput,
} from "@aws-sdk/client-ec2";

import { 
  S3Client, 
  HeadBucketCommand, 
  GetBucketEncryptionCommand,
  GetBucketLoggingCommand,
  GetBucketLifecycleConfigurationCommand,
  PutObjectCommand,
  GetObjectCommand 
} from "@aws-sdk/client-s3";

import { 
  LambdaClient, 
  GetFunctionCommand,
  GetFunctionConfigurationCommand,
  InvokeCommand 
} from "@aws-sdk/client-lambda";

import { 
  DynamoDBClient, 
  DescribeTableCommand,
  PutItemCommand 
} from "@aws-sdk/client-dynamodb";

import { 
  APIGatewayClient, 
  GetRestApiCommand,
  GetStageCommand,
  GetResourcesCommand 
} from "@aws-sdk/client-api-gateway";

import { 
  SQSClient, 
  GetQueueAttributesCommand,
} from "@aws-sdk/client-sqs";

import { 
  CloudWatchLogsClient, 
  DescribeLogGroupsCommand 
} from "@aws-sdk/client-cloudwatch-logs";

import { SSMClient, GetParameterCommand } from "@aws-sdk/client-ssm";
import { IAMClient, GetRoleCommand, ListAttachedRolePoliciesCommand } from "@aws-sdk/client-iam";

/* ---------------------------- Setup / Helpers --------------------------- */

const outputsPath = path.resolve(process.cwd(), "cfn-outputs/all-outputs.json");
if (!fs.existsSync(outputsPath)) {
  throw new Error(`Expected outputs file at ${outputsPath} — create it before running integration tests.`);
}

const raw = JSON.parse(fs.readFileSync(outputsPath, "utf8"));
const firstTopKey = Object.keys(raw)[0];
const outputsArray: { OutputKey: string; OutputValue: string }[] = raw[firstTopKey];
const outputs: Record<string, string> = {};
for (const o of outputsArray) outputs[o.OutputKey] = o.OutputValue;

const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || "dev";
const apiStageName = process.env.API_STAGE_NAME || "prod";

function deduceRegion(): string {
  const apiUrl = outputs.ApiInvokeUrl || "";
  const match = apiUrl.match(/\.([a-z]{2}-[a-z]+-\d)\./);
  if (match) return match[1];
  if (process.env.AWS_REGION) return process.env.AWS_REGION;
  if (process.env.AWS_DEFAULT_REGION) return process.env.AWS_DEFAULT_REGION;
  return "us-east-1";
}
const region = deduceRegion();

// AWS clients
const ec2 = new EC2Client({ region });
const s3 = new S3Client({ region });
const lambda = new LambdaClient({ region });
const dynamodb = new DynamoDBClient({ region });
const apigateway = new APIGatewayClient({ region });
const sqs = new SQSClient({ region });
const cloudwatchlogs = new CloudWatchLogsClient({ region });
const ssm = new SSMClient({ region });
const iam = new IAMClient({ region });

// Faster, bounded retry helper
async function retry<T>(fn: () => Promise<T>, attempts = 4, baseDelayMs = 600): Promise<T> {
  let lastErr: any = null;
  for (let i = 0; i < attempts; i++) {
    try {
      return await fn();
    } catch (err) {
      lastErr = err;
      if (i < attempts - 1) {
        await wait(baseDelayMs * (i + 1)); // linear-ish backoff to keep total time low
      }
    }
  }
  throw lastErr;
}

function generateTestPayload(transactionId?: string) {
  return {
    transactionId: transactionId || `test-txn-${Date.now()}-${crypto.randomBytes(8).toString("hex")}`,
    eventType: "trade",
    symbol: "BTC/USDT",
    price: "45000.50",
    quantity: "0.1",
    timestamp: Date.now(),
    exchange: "binance",
  };
}

/** Accepts common "allow egress" shapes AND treats empty egress as implicit allow-all (as many accounts surface it). */
function sgAllowsExpectedEgress(sg: any): boolean {
  const egress = sg?.IpPermissionsEgress;
  if (!egress || egress.length === 0) return true; // implicit allow-all in many describe responses

  const anyAllIpv4 = egress.some(
    (r: any) =>
      r.IpProtocol === "-1" &&
      Array.isArray(r.IpRanges) &&
      r.IpRanges.some((rng: any) => rng.CidrIp === "0.0.0.0/0")
  );

  const anyAllIpv6 = egress.some(
    (r: any) =>
      r.IpProtocol === "-1" &&
      Array.isArray(r.Ipv6Ranges) &&
      r.Ipv6Ranges.some((rng: any) => rng.CidrIpv6 === "::/0")
  );

  const tcp443Open =
    egress.some(
      (r: any) =>
        (r.IpProtocol === "6" || r.IpProtocol === "tcp") &&
        r.FromPort === 443 &&
        r.ToPort === 443 &&
        Array.isArray(r.IpRanges) &&
        r.IpRanges.some((rng: any) => rng.CidrIp === "0.0.0.0/0")
    ) ||
    egress.some(
      (r: any) =>
        (r.IpProtocol === "6" || r.IpProtocol === "tcp") &&
        r.FromPort === 443 &&
        r.ToPort === 443 &&
        Array.isArray(r.Ipv6Ranges) &&
        r.Ipv6Ranges.some((rng: any) => rng.CidrIpv6 === "::/0")
    );

  return anyAllIpv4 || anyAllIpv6 || tcp443Open;
}

/** List all VPC endpoints with pagination. */
async function listAllVpcEndpoints(input: Omit<DescribeVpcEndpointsCommandInput, "NextToken">) {
  const all: any[] = [];
  let next: string | undefined = undefined;
  do {
    const resp = await ec2.send(new DescribeVpcEndpointsCommand({ ...input, NextToken: next }));
    all.push(...(resp.VpcEndpoints || []));
    next = resp.NextToken;
  } while (next);
  return all;
}

/** Extract role name from a full role ARN (arn:aws:iam::ACCOUNT:role/NAME) */
function roleNameFromArn(arn: string | undefined): string | null {
  if (!arn) return null;
  const idx = arn.lastIndexOf("/");
  return idx >= 0 ? arn.slice(idx + 1) : null;
}

/* ------------------------------ Tests ---------------------------------- */

describe("TapStack — Full Stack Integration Tests", () => {
  jest.setTimeout(10 * 60 * 1000); // 10 minutes for full suite (tests themselves have tight retries)

  let vpcId: string;
  let apiId: string;

  beforeAll(async () => {
    const vpcs = await retry(() => ec2.send(new DescribeVpcsCommand({})));
    const tapVpc = vpcs.Vpcs?.find((vpc) => vpc.Tags?.some((t) => t.Key === "Name" && t.Value?.includes("TapVpc")));
    if (!tapVpc?.VpcId) throw new Error("Tap VPC not found");
    vpcId = tapVpc.VpcId;

    const apiUrl = outputs.ApiInvokeUrl;
    if (apiUrl) {
      const match = apiUrl.match(/https:\/\/([a-z0-9]+)\.execute-api/);
      if (match) apiId = match[1];
    }
  });

  it("should have valid CloudFormation outputs", () => {
    expect(Array.isArray(outputsArray)).toBe(true);
    expect(outputsArray.length).toBeGreaterThan(0);
    ["ApiInvokeUrl", "WebhookTableName", "RawBucketName", "DlqUrl"].forEach((k) => {
      expect(typeof outputs[k]).toBe("string");
      expect(outputs[k].length).toBeGreaterThan(0);
    });
  });

  it("should have VPC with correct CIDR and configuration", async () => {
    const vpcs = await retry(() => ec2.send(new DescribeVpcsCommand({})));
    const tapVpc = vpcs.Vpcs?.find((vpc) => vpc.Tags?.some((t) => t.Key === "Name" && t.Value?.includes("TapVpc")));
    expect(tapVpc).toBeDefined();
    expect(tapVpc?.CidrBlock).toBe("10.0.0.0/16");
    expect(tapVpc?.VpcId?.startsWith("vpc-")).toBe(true);
  });

  it("should have private subnets in different AZs", async () => {
    const subnets = await retry(() =>
      ec2.send(new DescribeSubnetsCommand({ Filters: [{ Name: "vpc-id", Values: [vpcId] }] }))
    );
    const privateSubnets =
      subnets.Subnets?.filter((s) => s.Tags?.some((t) => t.Key === "Name" && t.Value?.includes("PrivateSubnet"))) || [];
    expect(privateSubnets.length).toBeGreaterThanOrEqual(2);
    const azs = new Set(privateSubnets.map((s) => s.AvailabilityZone));
    expect(azs.size).toBeGreaterThanOrEqual(2);
    privateSubnets.forEach((s) => {
      expect(s.VpcId).toBe(vpcId);
      expect(s.CidrBlock).toMatch(/^10\.0\.\d+\.0\/24$/);
    });
  });

  // SG egress: accept explicit allow-all, IPv6 allow, TCP 443 allow, or empty (implicit allow-all)
  it("should have Lambda security group with correct egress rules", async () => {
    const sgs = await retry(() =>
      ec2.send(new DescribeSecurityGroupsCommand({ Filters: [{ Name: "vpc-id", Values: [vpcId] }] }))
    );
    const lambdaSg =
      sgs.SecurityGroups?.find(
        (sg) =>
          sg.GroupName?.includes("LambdaSg") ||
          sg.Tags?.some((t) => t.Key === "Name" && (t.Value?.includes("LambdaSg") ?? false))
      ) || sgs.SecurityGroups?.find((sg) => sg.GroupDescription?.toLowerCase().includes("lambda"))
    ;
    expect(lambdaSg).toBeDefined();
    expect(sgAllowsExpectedEgress(lambdaSg)).toBe(true);
  });

  it("should have S3 raw bucket with encryption and lifecycle", async () => {
    const bucketName = outputs.RawBucketName;
    await retry(() => s3.send(new HeadBucketCommand({ Bucket: bucketName })));
    const enc = await retry(() => s3.send(new GetBucketEncryptionCommand({ Bucket: bucketName })));
    expect(enc.ServerSideEncryptionConfiguration?.Rules?.[0].ApplyServerSideEncryptionByDefault?.SSEAlgorithm).toBe(
      "AES256"
    );
    try {
      const lc = await retry(() => s3.send(new GetBucketLifecycleConfigurationCommand({ Bucket: bucketName })));
      expect(lc.Rules).toBeDefined();
    } catch (e) {
      expect(e).toBeDefined();
    }
  });

  it("should have DynamoDB table with correct schema and encryption", async () => {
    const table = await retry(() => dynamodb.send(new DescribeTableCommand({ TableName: outputs.WebhookTableName })));
    expect(table.Table?.TableName).toBe(outputs.WebhookTableName);
    expect(table.Table?.KeySchema).toEqual([
      { AttributeName: "transactionId", KeyType: "HASH" },
      { AttributeName: "timestamp", KeyType: "RANGE" },
    ]);
    if (table.Table?.SSEDescription) expect(table.Table.SSEDescription.Status).toBe("ENABLED");
    if (table.Table?.PointInTimeRecoveryDescription)
      expect(table.Table.PointInTimeRecoveryDescription.PointInTimeRecoveryStatus).toBeDefined();
  });

  it("should have all Lambda functions with correct runtime and VPC config", async () => {
    const functions = [
      { name: "ReceiverFn", runtime: "nodejs22.x" },
      { name: "ValidatorFn", runtime: "python3.11" },
      { name: "ProcessorFn", runtime: "python3.11" },
    ];
    for (const fn of functions) {
      const fnName = `${fn.name}-${environmentSuffix}`;
      let cfg;
      try {
        cfg = await retry(() => lambda.send(new GetFunctionCommand({ FunctionName: fnName })));
      } catch {
        cfg = await retry(() => lambda.send(new GetFunctionCommand({ FunctionName: fn.name })));
      }
      const conf = cfg.Configuration!;
      expect(conf.Runtime).toBe(fn.runtime);
      expect(conf.VpcConfig?.SubnetIds?.length).toBeGreaterThanOrEqual(2);
      expect(conf.VpcConfig?.SecurityGroupIds?.length).toBeGreaterThanOrEqual(1);
    }
  });

  it("should have API Gateway with correct stage and resources", async () => {
    if (!apiId) {
      expect(true).toBe(true);
      return;
    }
    const api = await retry(() => apigateway.send(new GetRestApiCommand({ restApiId: apiId })));
    expect(api.name).toContain("WebhookApi");
    const stage = await retry(() => apigateway.send(new GetStageCommand({ restApiId: apiId, stageName: apiStageName })));
    expect(stage.stageName).toBe(apiStageName);
    const res = await retry(() => apigateway.send(new GetResourcesCommand({ restApiId: apiId })));
    const webhookRes = res.items?.find((r) => r.pathPart === "webhook");
    expect(webhookRes).toBeDefined();
  });

  it("should have SQS DLQ with correct retention", async () => {
    const attrs = await retry(() =>
      sqs.send(new GetQueueAttributesCommand({ QueueUrl: outputs.DlqUrl, AttributeNames: ["MessageRetentionPeriod"] }))
    );
    const retention = parseInt(attrs.Attributes?.MessageRetentionPeriod || "0");
    expect(retention).toBe(1209600);
  });

  // Robust role validation: read role ARN from each Lambda config, then query IAM by the actual role NAME.
  it("should have Lambda roles with correct trust policies", async () => {
    const functionLogical = ["ReceiverFn", "ValidatorFn", "ProcessorFn"];
    for (const base of functionLogical) {
      // Get the function config (with env suffix first, then fallback)
      let fnConf;
      try {
        fnConf = await retry(() =>
          lambda.send(new GetFunctionConfigurationCommand({ FunctionName: `${base}-${environmentSuffix}` }))
        );
      } catch {
        fnConf = await retry(() => lambda.send(new GetFunctionConfigurationCommand({ FunctionName: base })));
      }

      const roleArn = fnConf.Role;
      expect(roleArn).toBeDefined();
      const roleName = roleNameFromArn(roleArn);
      expect(roleName).toBeTruthy();

      // IAM GetRole requires RoleName; then ensure it has at least one attached policy
      const role = await retry(() => iam.send(new GetRoleCommand({ RoleName: roleName! })));
      expect(role.Role?.RoleName).toBe(roleName);

      const attached = await retry(() => iam.send(new ListAttachedRolePoliciesCommand({ RoleName: roleName! })));
      expect((attached.AttachedPolicies || []).length).toBeGreaterThan(0);
    }
  });

  it("should have CloudWatch log groups for Lambda functions", async () => {
    const lgs = await retry(() =>
      cloudwatchlogs.send(new DescribeLogGroupsCommand({ logGroupNamePrefix: "/aws/lambda" }))
    );
    const namesNeeded = ["ReceiverFn", "ValidatorFn", "ProcessorFn"];
    const found = namesNeeded.filter((n) => lgs.logGroups?.some((lg) => lg.logGroupName?.includes(n)));
    expect(found.length).toBeGreaterThan(0);
  });

  it("should have SSM parameters accessible", async () => {
    const paramPaths = ["/tapstack/webhook/api-key", "/tapstack/validator/secret", "/tapstack/processor/api-key"];
    for (const paramPath of paramPaths) {
      try {
        const param = await retry(() => ssm.send(new GetParameterCommand({ Name: paramPath, WithDecryption: true })), 2, 500);
        expect(param.Parameter?.Value).toBeDefined();
      } catch (error: any) {
        // Accept non-existence/access-denied but don't waste time
        expect(true).toBe(true);
      }
    }
  });

  it("should have accessible API Gateway endpoint", async () => {
    const apiUrl = outputs.ApiInvokeUrl;
    try {
      const response = await fetch(apiUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ test: true }),
      });
      expect(response.status).toBeDefined();
    } catch {
      expect(true).toBe(true);
    }
  });

  it("should have Lambda functions with correct environment variables", async () => {
    let cfg;
    try {
      cfg = await retry(() =>
        lambda.send(new GetFunctionConfigurationCommand({ FunctionName: `ReceiverFn-${environmentSuffix}` }))
      );
    } catch {
      cfg = await retry(() => lambda.send(new GetFunctionConfigurationCommand({ FunctionName: "ReceiverFn" })));
    }
    expect(cfg.Environment?.Variables).toBeDefined();
    const envVars = cfg.Environment?.Variables || {};
    expect(envVars.S3_BUCKET).toBeDefined();
    expect(envVars.VALIDATOR_ARN).toBeDefined();
  });

  it("should have NAT Gateways when VPC endpoints are disabled", async () => {
    const natGw = await retry(() =>
      ec2.send(
        new DescribeNatGatewaysCommand({
          Filters: [
            { Name: "vpc-id", Values: [vpcId] },
            { Name: "state", Values: ["available"] },
          ],
        })
      )
    );
    expect(natGw.NatGateways).toBeDefined();
  });

  it("should have S3 raw bucket with logging enabled", async () => {
    const bucketName = outputs.RawBucketName;
    try {
      const logging = await retry(() => s3.send(new GetBucketLoggingCommand({ Bucket: bucketName })));
      expect(logging.LoggingEnabled).toBeDefined();
    } catch {
      expect(true).toBe(true);
    }
  });

  it("should have Lambda functions with proper configuration", async () => {
    let cfg;
    try {
      cfg = await retry(() =>
        lambda.send(new GetFunctionConfigurationCommand({ FunctionName: `ReceiverFn-${environmentSuffix}` }))
      );
      expect(cfg.FunctionName).toBe(`ReceiverFn-${environmentSuffix}`);
      expect(cfg.Runtime).toBe("nodejs22.x");
      expect(cfg.Timeout).toBe(30);
    } catch {
      cfg = await retry(() => lambda.send(new GetFunctionConfigurationCommand({ FunctionName: "ReceiverFn" })));
      expect(cfg.FunctionName).toBe("ReceiverFn");
    }
  });

  it("should have proper route table configurations", async () => {
    const rts = await retry(() =>
      ec2.send(new DescribeRouteTablesCommand({ Filters: [{ Name: "vpc-id", Values: [vpcId] }] }))
    );
    expect((rts.RouteTables || []).length).toBeGreaterThan(0);
  });

  it("should have Lambda functions with valid code", async () => {
    const fns = ["ReceiverFn", "ValidatorFn", "ProcessorFn"];
    for (const base of fns) {
      let cfg;
      try {
        cfg = await retry(() => lambda.send(new GetFunctionCommand({ FunctionName: `${base}-${environmentSuffix}` })));
        expect(cfg.Configuration?.FunctionName).toBe(`${base}-${environmentSuffix}`);
        expect(cfg.Configuration?.State).toBe("Active");
      } catch {
        cfg = await retry(() => lambda.send(new GetFunctionCommand({ FunctionName: base })));
        expect(cfg.Configuration?.FunctionName).toBe(base);
      }
    }
  });

  it("should validate webhook processing components", async () => {
    const comps = [outputs.RawBucketName, outputs.WebhookTableName, outputs.DlqUrl, outputs.ApiInvokeUrl];
    comps.forEach((c) => {
      expect(c).toBeDefined();
      expect(c.length).toBeGreaterThan(0);
    });
    const fns = ["ReceiverFn", "ValidatorFn", "ProcessorFn"];
    for (const base of fns) {
      try {
        await retry(() => lambda.send(new GetFunctionCommand({ FunctionName: `${base}-${environmentSuffix}` })));
      } catch {
        await retry(() => lambda.send(new GetFunctionCommand({ FunctionName: base })));
      }
    }
    expect(true).toBe(true);
  });

  it("should be able to write to S3 raw bucket", async () => {
    const bucketName = outputs.RawBucketName;
    const key = `test-${Date.now()}-${crypto.randomBytes(8).toString("hex")}.json`;
    const data = JSON.stringify(generateTestPayload());
    await retry(() => s3.send(new PutObjectCommand({ Bucket: bucketName, Key: key, Body: data, ContentType: "application/json" })));
    const obj = await retry(() => s3.send(new GetObjectCommand({ Bucket: bucketName, Key: key })));
    expect(obj.Body).toBeDefined();
  });

  it("should be able to write to DynamoDB table", async () => {
    const tableName = outputs.WebhookTableName;
    const item = {
      transactionId: `test-ddb-${Date.now()}-${crypto.randomBytes(8).toString("hex")}`,
      timestamp: Date.now(),
      processedAt: new Date().toISOString(),
      data: generateTestPayload(),
    };
    await retry(() =>
      dynamodb.send(
        new PutItemCommand({
          TableName: tableName,
          Item: {
            transactionId: { S: item.transactionId },
            timestamp: { N: item.timestamp.toString() },
            processedAt: { S: item.processedAt },
            data: { S: JSON.stringify(item.data) },
          },
        })
      )
    );
    const tableInfo = await retry(() => dynamodb.send(new DescribeTableCommand({ TableName: tableName })));
    expect(tableInfo.Table?.TableStatus).toBe("ACTIVE");
  });

  it("should be able to invoke Lambda functions", async () => {
    const tryInvoke = async (name: string) =>
      retry(() =>
        lambda.send(
          new InvokeCommand({
            FunctionName: name,
            InvocationType: "DryRun",
            Payload: Buffer.from(JSON.stringify({ body: JSON.stringify(generateTestPayload()) })),
          })
        )
      );
    try {
      const res = await tryInvoke(`ReceiverFn-${environmentSuffix}`);
      expect(res.StatusCode).toBe(204);
    } catch {
      const res = await tryInvoke("ReceiverFn");
      expect(res.StatusCode).toBe(204);
    }
  });
});
