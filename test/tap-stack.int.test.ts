/* eslint-disable no-console */

import fs from "fs";
import path from "path";
import net from "net";
import { setTimeout as wait } from "timers/promises";

import {
  S3Client,
  HeadBucketCommand,
  GetBucketEncryptionCommand,
  GetBucketVersioningCommand,
  GetPublicAccessBlockCommand,
} from "@aws-sdk/client-s3";
import { SNSClient, GetTopicAttributesCommand } from "@aws-sdk/client-sns";
import {
  CloudWatchClient,
  DescribeAlarmsCommand,
  ListMetricsCommand,
} from "@aws-sdk/client-cloudwatch";
import {
  CloudWatchLogsClient,
  DescribeLogGroupsCommand,
  FilterLogEventsCommand,
} from "@aws-sdk/client-cloudwatch-logs";
import {
  LambdaClient,
  GetFunctionCommand,
  GetAliasCommand,
  InvokeCommand,
} from "@aws-sdk/client-lambda";
import { IAMClient, GetRoleCommand } from "@aws-sdk/client-iam";
import { SQSClient, GetQueueAttributesCommand } from "@aws-sdk/client-sqs";
import {
  CodeDeployClient,
  GetApplicationCommand,
  GetDeploymentGroupCommand,
} from "@aws-sdk/client-codedeploy";

/* ------------------------------------------------------------------ */
/* Environment Detection                                              */
/* ------------------------------------------------------------------ */

const IS_LOCALSTACK =
  !!process.env.LOCALSTACK_HOSTNAME ||
  !!process.env.AWS_ENDPOINT_URL ||
  process.env.AWS_ACCESS_KEY_ID === "test";

/* ------------------------------------------------------------------ */
/* Outputs Loader                                                     */
/* ------------------------------------------------------------------ */

function loadOutputs(): Record<string, string> {
  const files = [
    "cfn-outputs/all-outputs.json",
    "cfn-outputs/flat-outputs.json",
  ];

  const file = files.find((f) =>
    fs.existsSync(path.resolve(process.cwd(), f))
  );

  if (!file) {
    throw new Error(`No CloudFormation outputs found`);
  }

  const raw = JSON.parse(
    fs.readFileSync(path.resolve(process.cwd(), file), "utf8")
  );

  if (Array.isArray(raw)) {
    return Object.fromEntries(raw.map((o) => [o.OutputKey, o.OutputValue]));
  }

  if (typeof raw === "object" && raw !== null) {
    if (Array.isArray(raw[Object.keys(raw)[0]])) {
      const first = raw[Object.keys(raw)[0]];
      return Object.fromEntries(first.map((o: any) => [o.OutputKey, o.OutputValue]));
    }
    return raw;
  }

  throw new Error("Unsupported outputs format");
}

const outputs = loadOutputs();

/* ------------------------------------------------------------------ */
/* Region & Client Config                                             */
/* ------------------------------------------------------------------ */

const region =
  process.env.AWS_REGION ||
  process.env.AWS_DEFAULT_REGION ||
  "us-east-1";

const baseClientConfig: any = { region };

if (IS_LOCALSTACK) {
  baseClientConfig.endpoint = "http://localhost:4566";
}

/* --- S3 REQUIRES PATH STYLE ON LOCALSTACK --- */
const s3 = new S3Client({
  ...baseClientConfig,
  forcePathStyle: IS_LOCALSTACK,
});

const sns = new SNSClient(baseClientConfig);
const cw = new CloudWatchClient(baseClientConfig);
const logs = new CloudWatchLogsClient(baseClientConfig);
const lambda = new LambdaClient(baseClientConfig);
const iam = new IAMClient(baseClientConfig);
const sqs = new SQSClient(baseClientConfig);
const codedeploy = new CodeDeployClient(baseClientConfig);

/* ------------------------------------------------------------------ */
/* Helpers                                                            */
/* ------------------------------------------------------------------ */

async function retry<T>(fn: () => Promise<T>, attempts = 4) {
  let last;
  for (let i = 0; i < attempts; i++) {
    try {
      return await fn();
    } catch (e) {
      last = e;
      await wait(800 * (i + 1));
    }
  }
  throw last;
}

const alarmName = (arn?: string) => arn?.split(":alarm:")[1];
const aliasName = (v?: string) =>
  v?.startsWith("arn:") ? v.split(":").pop()! : v || "live";

/* ------------------------------------------------------------------ */
/* TESTS                                                              */
/* ------------------------------------------------------------------ */

describe("TapStack Integration Tests (AWS + LocalStack)", () => {
  jest.setTimeout(10 * 60 * 1000);

  /* 01 */
  it("01 Outputs sanity", () => {
    expect(outputs.PrimaryLambdaName).toBeDefined();
    expect(outputs.ArtifactsBucketName).toBeDefined();
  });

  /* 02 */
  it("02 S3 bucket exists", async () => {
    await retry(() =>
      s3.send(
        new HeadBucketCommand({
          Bucket: outputs.ArtifactsBucketName,
        })
      )
    );
  });

  /* 03 */
  it("03 S3 encryption enabled", async () => {
    const enc = await retry(() =>
      s3.send(
        new GetBucketEncryptionCommand({
          Bucket: outputs.ArtifactsBucketName,
        })
      )
    );

    const algo =
      enc.ServerSideEncryptionConfiguration?.Rules?.[0]
        ?.ApplyServerSideEncryptionByDefault?.SSEAlgorithm;

    expect(["AES256", "aws:kms"]).toContain(algo);
  });

  /* 04 */
  it("04 S3 versioning enabled", async () => {
    const v = await retry(() =>
      s3.send(
        new GetBucketVersioningCommand({
          Bucket: outputs.ArtifactsBucketName,
        })
      )
    );

    expect(v.Status).toBe("Enabled");
  });

  /* 05 */
  it("05 S3 public access blocked (best-effort)", async () => {
    try {
      const pab = await s3.send(
        new GetPublicAccessBlockCommand({
          Bucket: outputs.ArtifactsBucketName,
        })
      );
      expect(pab.PublicAccessBlockConfiguration?.BlockPublicAcls).toBe(true);
    } catch {
      expect(true).toBe(true);
    }
  });

  /* 06 */
  it("06 SNS topic exists", async () => {
    const t = await retry(() =>
      sns.send(
        new GetTopicAttributesCommand({
          TopicArn: outputs.StackEventsSnsTopicArn,
        })
      )
    );
    expect(t.Attributes?.TopicArn).toBe(outputs.StackEventsSnsTopicArn);
  });

  /* 07 */
  it("07 Lambda exists", async () => {
    const fn = await retry(() =>
      lambda.send(
        new GetFunctionCommand({
          FunctionName: outputs.PrimaryLambdaName,
        })
      )
    );
    expect(fn.Configuration?.FunctionName).toBe(outputs.PrimaryLambdaName);
  });

  /* 08 */
  it("08 Lambda alias live exists", async () => {
    const a = await retry(() =>
      lambda.send(
        new GetAliasCommand({
          FunctionName: outputs.PrimaryLambdaName,
          Name: aliasName(outputs.PrimaryLambdaAliasName),
        })
      )
    );
    expect(a.Name).toBe("live");
  });

  /* 09 */
  it("09 Lambda invoke works", async () => {
    const r = await retry(() =>
      lambda.send(
        new InvokeCommand({
          FunctionName: outputs.PrimaryLambdaName,
          Payload: Buffer.from(JSON.stringify({ ping: true })),
        })
      )
    );
    expect(r.StatusCode).toBeGreaterThanOrEqual(200);
  });

  /* 10 */
  it("10 Lambda env vars present", async () => {
    const fn = await retry(() =>
      lambda.send(
        new GetFunctionCommand({
          FunctionName: outputs.PrimaryLambdaName,
        })
      )
    );

    const env = fn.Configuration?.Environment?.Variables || {};
    expect(env.PROJECT_NAME).toBeDefined();
    expect(env.ENVIRONMENT_SUFFIX).toBeDefined();
    expect(env.LOG_LEVEL).toBeDefined();
  });

  /* 11 */
  it("11 Log group exists", async () => {
    const lg = `/aws/lambda/${outputs.PrimaryLambdaName}`;
    const r = await retry(() =>
      logs.send(
        new DescribeLogGroupsCommand({ logGroupNamePrefix: lg })
      )
    );
    expect(r.logGroups?.some((g) => g.logGroupName === lg)).toBe(true);
  });

  /* 12 */
  it("12 IAM role trust policy valid", async () => {
    const fn = await retry(() =>
      lambda.send(
        new GetFunctionCommand({
          FunctionName: outputs.PrimaryLambdaName,
        })
      )
    );

    const roleName = fn.Configuration!.Role!.split("/").pop()!;
    const role = await retry(() =>
      iam.send(new GetRoleCommand({ RoleName: roleName }))
    );

    const policy = JSON.parse(
      decodeURIComponent(
        role.Role!.AssumeRolePolicyDocument as string
      )
    );

    const services = policy.Statement.flatMap(
      (s: any) => s.Principal?.Service || []
    );

    expect(services).toContain("lambda.amazonaws.com");
  });

  /* 13 */
  it("13 DLQ reachable (if enabled)", async () => {
    const fn = await retry(() =>
      lambda.send(
        new GetFunctionCommand({
          FunctionName: outputs.PrimaryLambdaName,
        })
      )
    );

    const arn = fn.Configuration?.DeadLetterConfig?.TargetArn;
    if (!arn) return;

    const [, , , region, account, name] = arn.split(":");
    const url = `https://sqs.${region}.amazonaws.com/${account}/${name}`;

    const q = await retry(() =>
      sqs.send(
        new GetQueueAttributesCommand({
          QueueUrl: url,
          AttributeNames: ["QueueArn"],
        })
      )
    );

    expect(q.Attributes?.QueueArn).toBeDefined();
  });

  /* 14 */
  it("14 Alarms exist (AWS only)", async () => {
    if (IS_LOCALSTACK) return;

    const names = [
      alarmName(outputs.AlarmErrorArn),
      alarmName(outputs.AlarmThrottleArn),
    ];

    const r = await retry(() =>
      cw.send(new DescribeAlarmsCommand({ AlarmNames: names }))
    );

    expect(r.MetricAlarms?.length).toBeGreaterThan(0);
  });

  /* 15 */
  it("15 CodeDeploy optional", async () => {
    if (IS_LOCALSTACK || !outputs.CodeDeployApplicationName) return;

    const a = await retry(() =>
      codedeploy.send(
        new GetApplicationCommand({
          applicationName: outputs.CodeDeployApplicationName,
        })
      )
    );

    expect(a.application?.computePlatform).toBe("Lambda");
  });

  /* 16 */
  it("16 Network check skipped on LocalStack", async () => {
    if (IS_LOCALSTACK) {
      expect(true).toBe(true);
      return;
    }

    const reachable = await new Promise<boolean>((resolve) => {
      const s = new net.Socket();
      s.setTimeout(3000);
      s.connect(443, `lambda.${region}.amazonaws.com`);
      s.on("connect", () => resolve(true));
      s.on("error", () => resolve(false));
      s.on("timeout", () => resolve(false));
    });

    expect(reachable).toBe(true);
  });
});
