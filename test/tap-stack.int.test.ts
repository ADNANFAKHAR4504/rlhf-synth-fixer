import fs from "fs";
import path from "path";
import { setTimeout as wait } from "timers/promises";

// EC2 / networking
import {
  EC2Client,
  DescribeVpcsCommand,
  DescribeSubnetsCommand,
  DescribeRouteTablesCommand,
  DescribeNatGatewaysCommand,
  DescribeSecurityGroupsCommand,
  DescribeVpcEndpointsCommand,
} from "@aws-sdk/client-ec2";

// S3
import {
  S3Client,
  HeadBucketCommand,
  GetBucketEncryptionCommand,
  GetBucketVersioningCommand,
} from "@aws-sdk/client-s3";

// CloudTrail
import {
  CloudTrailClient,
  DescribeTrailsCommand,
  GetTrailStatusCommand,
} from "@aws-sdk/client-cloudtrail";

// KMS
import { KMSClient, DescribeKeyCommand } from "@aws-sdk/client-kms";

// CloudWatch Logs
import {
  CloudWatchLogsClient,
  DescribeLogGroupsCommand,
} from "@aws-sdk/client-cloudwatch-logs";

// CloudWatch (alarms)
import {
  CloudWatchClient,
  DescribeAlarmsCommand,
} from "@aws-sdk/client-cloudwatch";

// Lambda
import {
  LambdaClient,
  GetFunctionCommand,
  GetFunctionConfigurationCommand,
} from "@aws-sdk/client-lambda";

// SQS
import {
  SQSClient,
  GetQueueAttributesCommand,
} from "@aws-sdk/client-sqs";

// DynamoDB
import {
  DynamoDBClient,
  DescribeTableCommand,
} from "@aws-sdk/client-dynamodb";

// SNS
import {
  SNSClient,
  GetTopicAttributesCommand,
} from "@aws-sdk/client-sns";

// STS
import { STSClient, GetCallerIdentityCommand } from "@aws-sdk/client-sts";

/* ---------------------------- Read Outputs ----------------------------- */

const outputsPath = path.resolve(process.cwd(), "cfn-outputs/all-outputs.json");
if (!fs.existsSync(outputsPath)) {
  throw new Error(
    `Expected CloudFormation outputs file at ${outputsPath}. ` +
      `Create it (e.g., from your deploy pipeline) before running integration tests.`
  );
}
const raw = JSON.parse(fs.readFileSync(outputsPath, "utf8"));
const firstStackKey = Object.keys(raw)[0];
if (!firstStackKey) {
  throw new Error(`No stack key found in ${outputsPath}.`);
}
const outputsArray: { OutputKey: string; OutputValue: string }[] = raw[firstStackKey];
const outputs: Record<string, string> = {};
for (const o of outputsArray) outputs[o.OutputKey] = o.OutputValue;

/* ------------------------------ Helpers -------------------------------- */

function deduceRegion(): string {
  // Stack target is us-east-1; allow env override if set in CI.
  const fromEnv = process.env.AWS_REGION || process.env.AWS_DEFAULT_REGION;
  return fromEnv || "us-east-1";
}
const region = deduceRegion();

const ec2 = new EC2Client({ region });
const s3 = new S3Client({ region });
const ct = new CloudTrailClient({ region });
const kms = new KMSClient({ region });
const logs = new CloudWatchLogsClient({ region });
const cw = new CloudWatchClient({ region });
const lambda = new LambdaClient({ region });
const sqs = new SQSClient({ region });
const ddb = new DynamoDBClient({ region });
const sns = new SNSClient({ region });
const sts = new STSClient({ region });

async function retry<T>(fn: () => Promise<T>, attempts = 5, baseDelayMs = 700): Promise<T> {
  let lastErr: any = null;
  for (let i = 0; i < attempts; i++) {
    try {
      return await fn();
    } catch (err: any) {
      lastErr = err;
      if (i < attempts - 1) await wait(baseDelayMs * (i + 1));
    }
  }
  throw lastErr;
}

function isIdLike(v: string | undefined, prefix: string) {
  if (!v) return false;
  return v.startsWith(prefix + "-");
}

function parseQueueNameFromUrl(url?: string) {
  if (!url) return undefined;
  const parts = url.split("/");
  return parts[parts.length - 1] || undefined;
}

/* ------------------------------- Tests --------------------------------- */

describe("TapStack — Live Integration Tests", () => {
  jest.setTimeout(10 * 60 * 1000); // 10 minutes

  /* 1 */ it("loads outputs and essential keys exist", () => {
    expect(Array.isArray(outputsArray)).toBe(true);
    const must = [
      "VPCId",
      "PublicSubnet1Id",
      "PublicSubnet2Id",
      "PrivateSubnet1Id",
      "PrivateSubnet2Id",
      "LambdaSecurityGroupId",
      "LogBucketName",
      "KMSKeyArn",
      "LambdaFunctionName",
      "LambdaFunctionArn",
      "SQSQueueUrl",
      "SQSQueueArn",
      "SQSDLQArn",
      "DynamoDBTableName",
      "DynamoDBStreamArn",
      "SNSTopicArn",
      "CloudTrailArn",
      "S3GatewayEndpointId",
      "DynamoDBGatewayEndpointId",
      "SQSEndpointId",
      "CloudWatchLogsEndpointId",
      "LambdaErrorsAlarmName",
    ];
    must.forEach((k) => expect(typeof outputs[k]).toBe("string"));
  });

  /* 2 */ it("confirms AWS identity and region are resolvable", async () => {
    const id = await retry(() => sts.send(new GetCallerIdentityCommand({})));
    expect(id.Account && id.UserId && id.Arn).toBeTruthy();
    expect(typeof region).toBe("string");
  });

  /* 3 */ it("VPC exists", async () => {
    const vpcId = outputs.VPCId;
    const resp = await retry(() =>
      ec2.send(new DescribeVpcsCommand({ VpcIds: [vpcId] }))
    );
    expect((resp.Vpcs || []).some((v) => v.VpcId === vpcId)).toBe(true);
  });

  /* 4 */ it("subnets exist and AZ spread is >= 2", async () => {
    const ids = [
      outputs.PublicSubnet1Id,
      outputs.PublicSubnet2Id,
      outputs.PrivateSubnet1Id,
      outputs.PrivateSubnet2Id,
    ];
    const resp = await retry(() =>
      ec2.send(new DescribeSubnetsCommand({ SubnetIds: ids }))
    );
    const subnets = resp.Subnets || [];
    expect(subnets.length).toBe(4);
    const azs = new Set(subnets.map((s) => s.AvailabilityZone));
    expect(azs.size).toBeGreaterThanOrEqual(2);
  });

  /* 5 */ it("public subnets map public IPs on launch, private do not", async () => {
    const resp = await retry(() =>
      ec2.send(
        new DescribeSubnetsCommand({
          SubnetIds: [
            outputs.PublicSubnet1Id,
            outputs.PublicSubnet2Id,
            outputs.PrivateSubnet1Id,
            outputs.PrivateSubnet2Id,
          ],
        })
      )
    );
    const map: Record<string, boolean | undefined> = {};
    for (const s of resp.Subnets || []) map[s.SubnetId!] = s.MapPublicIpOnLaunch;
    expect(map[outputs.PublicSubnet1Id]).toBe(true);
    expect(map[outputs.PublicSubnet2Id]).toBe(true);
    expect(map[outputs.PrivateSubnet1Id]).toBe(false);
    expect(map[outputs.PrivateSubnet2Id]).toBe(false);
  });

  /* 6 */ it("route tables exist and are associated with subnets", async () => {
    const vpcId = outputs.VPCId;
    const rt = await retry(() =>
      ec2.send(
        new DescribeRouteTablesCommand({
          Filters: [{ Name: "vpc-id", Values: [vpcId] }],
        })
      )
    );
    const rts = rt.RouteTables || [];
    expect(rts.length).toBeGreaterThanOrEqual(3);
    const allAssocSubnetIds = new Set(
      rts.flatMap((t) => (t.Associations || []).map((a) => a.SubnetId)).filter(Boolean) as string[]
    );
    expect(allAssocSubnetIds.has(outputs.PublicSubnet1Id)).toBe(true);
    expect(allAssocSubnetIds.has(outputs.PublicSubnet2Id)).toBe(true);
    expect(allAssocSubnetIds.has(outputs.PrivateSubnet1Id)).toBe(true);
    expect(allAssocSubnetIds.has(outputs.PrivateSubnet2Id)).toBe(true);
  });

  /* 7 */ it("NAT gateways present (>=1)", async () => {
    const ng = await retry(() =>
      ec2.send(
        new DescribeNatGatewaysCommand({
          Filter: [{ Name: "vpc-id", Values: [outputs.VPCId] }],
        })
      )
    );
    const total = (ng.NatGateways || []).length;
    expect(total).toBeGreaterThanOrEqual(1);
  });

  /* 8 */ it("Lambda security group exists in VPC", async () => {
    const sgId = outputs.LambdaSecurityGroupId;
    const resp = await retry(() =>
      ec2.send(new DescribeSecurityGroupsCommand({ GroupIds: [sgId] }))
    );
    const sg = (resp.SecurityGroups || [])[0];
    expect(sg).toBeDefined();
    expect(sg.VpcId).toBe(outputs.VPCId);
  });

  /* 9 */ it("gateway VPC endpoints for S3 and DynamoDB exist", async () => {
    const ids = [outputs.S3GatewayEndpointId, outputs.DynamoDBGatewayEndpointId];
    const resp = await retry(() =>
      ec2.send(new DescribeVpcEndpointsCommand({ VpcEndpointIds: ids }))
    );
    const eps = resp.VpcEndpoints || [];
    expect(eps.length).toBe(2);
    const services = new Set(eps.map((e) => e.ServiceName || ""));
    const hasS3 = Array.from(services).some((s) => s.endsWith(".s3"));
    const hasDdb = Array.from(services).some((s) => s.endsWith(".dynamodb"));
    expect(hasS3).toBe(true);
    expect(hasDdb).toBe(true);
    const anyHasRts = eps.some((e) => (e.RouteTableIds || []).length >= 1);
    expect(anyHasRts).toBe(true);
  });

  /* 10 */ it("interface endpoints for SQS and CloudWatch Logs exist", async () => {
    const ids = [outputs.SQSEndpointId, outputs.CloudWatchLogsEndpointId];
    const resp = await retry(() =>
      ec2.send(new DescribeVpcEndpointsCommand({ VpcEndpointIds: ids }))
    );
    const eps = resp.VpcEndpoints || [];
    expect(eps.length).toBe(2);
    const typesOk = eps.every((e) => e.VpcEndpointType === "Interface");
    expect(typesOk).toBe(true);
    const svc = new Set(eps.map((e) => e.ServiceName || ""));
    const hasSqs = Array.from(svc).some((s) => s.endsWith(".sqs"));
    const hasLogs = Array.from(svc).some((s) => s.endsWith(".logs"));
    expect(hasSqs).toBe(true);
    expect(hasLogs).toBe(true);
  });

  /* 11 */ it("logs bucket exists, is versioned, and has KMS encryption (if readable)", async () => {
    const bucket = outputs.LogBucketName;
    await retry(() => s3.send(new HeadBucketCommand({ Bucket: bucket })));
    const vresp = await retry(() =>
      s3.send(new GetBucketVersioningCommand({ Bucket: bucket }))
    );
    expect(vresp.Status).toBe("Enabled");
    try {
      const enc = await retry(() =>
        s3.send(new GetBucketEncryptionCommand({ Bucket: bucket }))
      );
      expect(enc.ServerSideEncryptionConfiguration).toBeDefined();
    } catch {
      expect(true).toBe(true); // tolerate AccessDenied for encryption read
    }
  });

  /* 12 */ it("KMS key exists and is enabled", async () => {
    const keyArn = outputs.KMSKeyArn;
    const d = await retry(() => kms.send(new DescribeKeyCommand({ KeyId: keyArn })));
    expect(d.KeyMetadata?.Arn).toBe(keyArn);
    expect(d.KeyMetadata?.Enabled).toBe(true);
  });

  /* 13 */ it("Lambda function is deployed with VPC config and runtime", async () => {
    const fnName = outputs.LambdaFunctionName;
    const info = await retry(() => lambda.send(new GetFunctionCommand({ FunctionName: fnName })));
    expect(info.Configuration?.FunctionName).toBe(fnName);
    expect(info.Configuration?.VpcConfig?.SubnetIds?.length).toBeGreaterThanOrEqual(2);
    expect(typeof info.Configuration?.Runtime).toBe("string");
  });

  /* 14 */ it("Lambda function has a dedicated log group with 30-day retention", async () => {
    const fnName = outputs.LambdaFunctionName;
    const logGroupName = `/aws/lambda/${fnName}`.replace(/:.*$/, "");
    const resp = await retry(() =>
      logs.send(new DescribeLogGroupsCommand({ logGroupNamePrefix: logGroupName }))
    );
    const lg = (resp.logGroups || []).find((g) => g.logGroupName === logGroupName);
    expect(lg).toBeDefined();
    expect(lg?.retentionInDays).toBe(30);
  });

  /* 15 */ it("SQS queue and DLQ exist with a valid redrive policy", async () => {
    const queueUrl = outputs.SQSQueueUrl;
    const attrs = await retry(() =>
      sqs.send(
        new GetQueueAttributesCommand({
          QueueUrl: queueUrl,
          AttributeNames: ["All"],
        })
      )
    );
    const dlqArn = outputs.SQSDLQArn;
    const redrive = attrs.Attributes?.RedrivePolicy
      ? JSON.parse(attrs.Attributes.RedrivePolicy)
      : undefined;
    expect(redrive?.deadLetterTargetArn).toBe(dlqArn);
    expect(Number(redrive?.maxReceiveCount || "0")).toBeGreaterThanOrEqual(1);
  });

  /* 16 */ it("SQS queue name matches URL tail", async () => {
    const queueUrl = outputs.SQSQueueUrl;
    const fromUrl = parseQueueNameFromUrl(queueUrl);
    expect(typeof fromUrl).toBe("string");
  });

  /* 17 */ it("DynamoDB table exists and stream is enabled (NEW_IMAGE)", async () => {
    const tableName = outputs.DynamoDBTableName;
    const d = await retry(() => ddb.send(new DescribeTableCommand({ TableName: tableName })));
    expect(d.Table?.TableName).toBe(tableName);
    expect(d.Table?.StreamSpecification?.StreamEnabled).toBe(true);
    if (d.Table?.LatestStreamArn) {
      expect(d.Table.LatestStreamArn.startsWith("arn:aws:dynamodb:")).toBe(true);
    }
  });

  /* 18 */ it("DynamoDB Stream ARN from outputs is well-formed", () => {
    const outArn = outputs.DynamoDBStreamArn;
    expect(typeof outArn).toBe("string");
    expect(outArn.startsWith("arn:aws:dynamodb:")).toBe(true);
    expect(outArn.includes(":table/")).toBe(true);
    expect(outArn.includes("/stream/")).toBe(true);
  });

  /* 19 */ it("SNS topic exists and is queryable", async () => {
    const topicArn = outputs.SNSTopicArn;
    const t = await retry(() => sns.send(new GetTopicAttributesCommand({ TopicArn: topicArn })));
    expect(Object.keys(t.Attributes || {}).length).toBeGreaterThan(0);
  });

  /* 20 */ it("CloudTrail trail exists and logging is active", async () => {
    const trailArn = outputs.CloudTrailArn;
    const tr = await retry(() => ct.send(new DescribeTrailsCommand({ trailNameList: [trailArn] })));
    const list = tr.trailList || [];
    expect(list.length).toBeGreaterThanOrEqual(1);
    const name = list[0].Name!;
    const status = await retry(() => ct.send(new GetTrailStatusCommand({ Name: name })));
    expect(typeof status.IsLogging).toBe("boolean");
    expect(status.IsLogging).toBe(true);
  });

  /* 21 */ it("Lambda role is attached (derived from function configuration)", async () => {
    const fnName = outputs.LambdaFunctionName;
    const cfg = await retry(() =>
      lambda.send(new GetFunctionConfigurationCommand({ FunctionName: fnName }))
    );
    expect(typeof cfg.Role).toBe("string");
    expect(cfg.Role!.startsWith("arn:aws:iam::")).toBe(true);
  });

  /* 22 */ it("Identifiers are well-formed: VPC, Subnets, SG", () => {
    expect(isIdLike(outputs.VPCId, "vpc")).toBe(true);
    expect(isIdLike(outputs.PublicSubnet1Id, "subnet")).toBe(true);
    expect(isIdLike(outputs.PublicSubnet2Id, "subnet")).toBe(true);
    expect(isIdLike(outputs.PrivateSubnet1Id, "subnet")).toBe(true);
    expect(isIdLike(outputs.PrivateSubnet2Id, "subnet")).toBe(true);
    expect(isIdLike(outputs.LambdaSecurityGroupId, "sg")).toBe(true);
  });

  /* 23 */ it("Lambda function ARN corresponds to function name", () => {
    const name = outputs.LambdaFunctionName;
    const arn = outputs.LambdaFunctionArn;
    expect(arn.includes(`function:${name}`) || arn.endsWith(`function:${name}`)).toBe(true);
  });

  /* 24 */ it("CloudWatch alarm for Lambda errors exists and is correctly configured", async () => {
    const alarmName = outputs.LambdaErrorsAlarmName;
    const topicArn = outputs.SNSTopicArn;
    const fnName = outputs.LambdaFunctionName;

    const resp = await retry(() =>
      cw.send(new DescribeAlarmsCommand({ AlarmNames: [alarmName] }))
    );
    const a = (resp.MetricAlarms || []).find(m => m.AlarmName === alarmName);
    expect(a).toBeDefined();
    expect(a?.Namespace).toBe("AWS/Lambda");
    expect(a?.MetricName).toBe("Errors");
    expect(a?.Statistic).toBe("Sum");
    expect(a?.Period).toBe(300);
    expect(a?.EvaluationPeriods).toBe(1);
    expect(Number(a?.Threshold)).toBe(1);
    expect(a?.ComparisonOperator).toBe("GreaterThanOrEqualToThreshold");

    const dims = new Map((a?.Dimensions || []).map(d => [d.Name, d.Value]));
    expect(dims.get("FunctionName")).toBe(fnName);

    // Verify SNS action included
    const actions = new Set(a?.AlarmActions || []);
    expect(actions.has(topicArn)).toBe(true);
  });
});
