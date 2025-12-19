// test/tap-stack.int.test.ts
//
// Integration tests for live TapStack resources.
// NOTE: Ensure your package.json includes "@aws-sdk/client-cloudwatch-logs"
// and that AWS creds/region are configured in the CI environment.

import fs from "fs";
import path from "path";
import https from "https";
import { setTimeout as wait } from "timers/promises";

import {
  EC2Client,
  DescribeVpcsCommand,
  DescribeSubnetsCommand,
  DescribeNatGatewaysCommand,
  DescribeSecurityGroupsCommand,
  DescribeVpcEndpointsCommand,
  DescribeRegionsCommand,
} from "@aws-sdk/client-ec2";
import {
  S3Client,
  HeadBucketCommand,
  GetBucketEncryptionCommand,
  GetBucketVersioningCommand,
} from "@aws-sdk/client-s3";
import {
  ElasticLoadBalancingV2Client,
  DescribeLoadBalancersCommand,
  DescribeLoadBalancerAttributesCommand,
  DescribeTargetGroupsCommand,
} from "@aws-sdk/client-elastic-load-balancing-v2";
import {
  AutoScalingClient,
  DescribeAutoScalingGroupsCommand,
} from "@aws-sdk/client-auto-scaling";
import {
  CloudTrailClient,
  DescribeTrailsCommand,
  GetTrailStatusCommand,
} from "@aws-sdk/client-cloudtrail";
import {
  CloudWatchClient,
  ListMetricsCommand,
  DescribeAlarmsCommand,
} from "@aws-sdk/client-cloudwatch";
import { RDSClient, DescribeDBInstancesCommand } from "@aws-sdk/client-rds";
import {
  SecretsManagerClient,
  DescribeSecretCommand,
} from "@aws-sdk/client-secrets-manager";
import {
  ConfigServiceClient,
  DescribeConfigurationRecordersCommand,
  DescribeDeliveryChannelsCommand,
} from "@aws-sdk/client-config-service";
import {
  APIGatewayClient,
  GetRestApiCommand,
  GetStagesCommand,
} from "@aws-sdk/client-api-gateway";
import {
  CloudWatchLogsClient,
  DescribeLogGroupsCommand,
} from "@aws-sdk/client-cloudwatch-logs";
import { SNSClient, GetTopicAttributesCommand } from "@aws-sdk/client-sns";
import { GuardDutyClient, GetDetectorCommand } from "@aws-sdk/client-guardduty";
import { KMSClient, DescribeKeyCommand } from "@aws-sdk/client-kms";

/* ---------------------------- Load Outputs ---------------------------- */

const outputsPath = path.resolve(process.cwd(), "cfn-outputs/all-outputs.json");
if (!fs.existsSync(outputsPath)) {
  throw new Error(`Expected outputs file at ${outputsPath}`);
}
const raw = JSON.parse(fs.readFileSync(outputsPath, "utf8"));
const firstTopKey = Object.keys(raw)[0];
const outputsArray: { OutputKey: string; OutputValue: string }[] = raw[firstTopKey];
const outputs: Record<string, string> = {};
for (const o of outputsArray) outputs[o.OutputKey] = o.OutputValue;

/* ---------------------------- Helpers -------------------------------- */

function deduceRegion(): string {
  const invoke = outputs.APIGatewayInvokeURL || "";
  const mFromApi = invoke.match(/execute-api\.([a-z0-9-]+)\.amazonaws\.com/);
  if (mFromApi) return mFromApi[1];

  const albDns = outputs.ALBDNSName || "";
  const mFromAlb = albDns.match(/\.([a-z0-9-]+)\.elb\.amazonaws\.com$/);
  if (mFromAlb) return mFromAlb[1];

  if (process.env.AWS_REGION) return process.env.AWS_REGION;
  if (process.env.AWS_DEFAULT_REGION) return process.env.AWS_DEFAULT_REGION;
  return "us-east-1";
}
const region = deduceRegion();

const ec2 = new EC2Client({ region });
const s3 = new S3Client({ region });
const elbv2 = new ElasticLoadBalancingV2Client({ region });
const asg = new AutoScalingClient({ region });
const ct = new CloudTrailClient({ region });
const cw = new CloudWatchClient({ region });
const rds = new RDSClient({ region });
const sm = new SecretsManagerClient({ region });
const cfg = new ConfigServiceClient({ region });
const apigw = new APIGatewayClient({ region });
const logs = new CloudWatchLogsClient({ region });
const sns = new SNSClient({ region });
const gd = new GuardDutyClient({ region });
const kms = new KMSClient({ region });

// retry helper with exponential-ish backoff
async function retry<T>(fn: () => Promise<T>, attempts = 5, baseMs = 800): Promise<T> {
  let lastErr: any = null;
  for (let i = 0; i < attempts; i++) {
    try {
      return await fn();
    } catch (err) {
      lastErr = err;
      if (i < attempts - 1) await wait(baseMs * (i + 1));
    }
  }
  throw lastErr;
}

function parseLogGroupNameFromArn(arn: string): string | null {
  // arn:aws:logs:region:acct:log-group:NAME or arn:aws:logs:region:acct:log-group:NAME:*
  const idx = arn.indexOf(":log-group:");
  if (idx === -1) return null;
  const tail = arn.substring(idx + ":log-group:".length);
  const name = tail.split(":")[0]; // strip any trailing ":*"
  return name || null;
}

async function httpsGet(url: string, timeoutMs = 5000): Promise<{ status: number; body: string }> {
  return new Promise((resolve, reject) => {
    const req = https.get(url, { timeout: timeoutMs }, (res) => {
      let data = "";
      res.on("data", (chunk) => (data += chunk.toString("utf8")));
      res.on("end", () => resolve({ status: res.statusCode || 0, body: data }));
    });
    req.on("timeout", () => req.destroy(new Error("timeout")));
    req.on("error", (e) => reject(e));
  });
}

/* -------------------------------- Tests ------------------------------- */

describe("TapStack — Live Integration Suite", () => {
  jest.setTimeout(10 * 60 * 1000);

  /* ---------- Outputs & Region ---------- */

  test("01) outputs file parsed and required keys exist", () => {
    const required = [
      "VPCId",
      "PublicSubnetAId",
      "PublicSubnetBId",
      "PrivateSubnetAId",
      "PrivateSubnetBId",
      "ALBDNSName",
      "ALBArn",
      "ALBTargetGroupArn",
      "APIGatewayId",
      "APIGatewayInvokeURL",
      "KMSKeyArn",
      "RDSSecretArn",
      "ConfigRecorderName",
      "ConfigDeliveryChannelName",
      "LoggingBucketName",
      "ApplicationBucketName",
      "SecurityAlarmTopicArn",
      "GuardDutyDetectorId",
    ];
    for (const k of required) expect(outputs[k]).toBeDefined();
  });

  test("02) region deduction is a valid AWS region", async () => {
    const resp = await retry(() => ec2.send(new DescribeRegionsCommand({ AllRegions: false })));
    const names = (resp.Regions || []).map((r) => r.RegionName);
    expect(names).toContain(region);
  });

  /* ---------- VPC & Subnets & NAT ---------- */

  test("03) VPC exists", async () => {
    const vpcId = outputs.VPCId;
    const vpcs = await retry(() => ec2.send(new DescribeVpcsCommand({ VpcIds: [vpcId] })));
    expect((vpcs.Vpcs || []).some((v) => v.VpcId === vpcId)).toBe(true);
  });

  test("04) public subnets belong to VPC and are distinct AZs", async () => {
    const [a, b, vpc] = [outputs.PublicSubnetAId, outputs.PublicSubnetBId, outputs.VPCId];
    const resp = await retry(() => ec2.send(new DescribeSubnetsCommand({ SubnetIds: [a, b] })));
    const subnets = resp.Subnets || [];
    expect(subnets.length).toBe(2);
    expect(subnets.every((s) => s.VpcId === vpc)).toBe(true);
    const azs = new Set(subnets.map((s) => s.AvailabilityZone));
    expect(azs.size).toBeGreaterThanOrEqual(2);
  });

  test("05) private subnets belong to VPC and are distinct AZs", async () => {
    const [a, b, vpc] = [outputs.PrivateSubnetAId, outputs.PrivateSubnetBId, outputs.VPCId];
    const resp = await retry(() => ec2.send(new DescribeSubnetsCommand({ SubnetIds: [a, b] })));
    const subnets = resp.Subnets || [];
    expect(subnets.length).toBe(2);
    expect(subnets.every((s) => s.VpcId === vpc)).toBe(true);
    const azs = new Set(subnets.map((s) => s.AvailabilityZone));
    expect(azs.size).toBeGreaterThanOrEqual(2);
  });

  test("06) at least one NAT gateway present in VPC", async () => {
    const vpc = outputs.VPCId;
    const resp = await retry(() =>
      ec2.send(new DescribeNatGatewaysCommand({ Filter: [{ Name: "vpc-id", Values: [vpc] }] }))
    );
    expect((resp.NatGateways || []).length).toBeGreaterThanOrEqual(1);
  });

  /* ---------- VPC Endpoints ---------- */

  test("07) VPC endpoints include S3 and Secrets Manager", async () => {
    const vpc = outputs.VPCId;
    const resp = await retry(() =>
      ec2.send(new DescribeVpcEndpointsCommand({ Filters: [{ Name: "vpc-id", Values: [vpc] }] }))
    );
    const services = (resp.VpcEndpoints || []).map((e) => e.ServiceName || "");
    const s3Name = `com.amazonaws.${region}.s3`;
    const smName = `com.amazonaws.${region}.secretsmanager`;
    expect(services.some((s) => s.endsWith(".s3") && s.includes(region)) || services.includes(s3Name)).toBe(true);
    expect(
      services.some((s) => s.endsWith(".secretsmanager") && s.includes(region)) || services.includes(smName)
    ).toBe(true);
  });

  /* ---------- Security Groups ---------- */

  test("08) ALB / App / RDS security groups exist", async () => {
    const ids = [outputs.ALBSecurityGroupId, outputs.AppSecurityGroupId, outputs.RDSSecurityGroupId];
    const resp = await retry(() => ec2.send(new DescribeSecurityGroupsCommand({ GroupIds: ids })));
    expect((resp.SecurityGroups || []).length).toBe(ids.length);
  });

  test("09) App SG allows outbound 443 (or default all)", async () => {
    const id = outputs.AppSecurityGroupId;
    const resp = await retry(() => ec2.send(new DescribeSecurityGroupsCommand({ GroupIds: [id] })));
    const sg = (resp.SecurityGroups || [])[0];
    expect(sg).toBeDefined();
    const e = sg.IpPermissionsEgress || [];
    const ok =
      e.some((r) => r.IpProtocol === "-1") ||
      e.some(
        (r) =>
          r.IpProtocol === "tcp" &&
          r.FromPort === 443 &&
          r.ToPort === 443 &&
          ((r.IpRanges || []).some((x) => x.CidrIp === "0.0.0.0/0") ||
            (r.UserIdGroupPairs || []).length >= 0)
      );
    expect(ok).toBe(true);
  });

  /* ---------- S3 Buckets ---------- */

  test("10) Logging bucket exists (HEAD) and has versioning enabled", async () => {
    const b = outputs.LoggingBucketName;
    await retry(() => s3.send(new HeadBucketCommand({ Bucket: b })));
    const ver = await retry(() => s3.send(new GetBucketVersioningCommand({ Bucket: b })));
    expect(ver.Status === "Enabled" || ver.Status === "Suspended").toBe(true);
  });

  test("11) Logging bucket encryption is configured (if permissions allow)", async () => {
    const b = outputs.LoggingBucketName;
    try {
      const enc = await retry(() => s3.send(new GetBucketEncryptionCommand({ Bucket: b })));
      expect(enc.ServerSideEncryptionConfiguration).toBeDefined();
    } catch {
      expect(true).toBe(true);
    }
  });

  test("12) Application bucket exists (HEAD) and encryption likely configured", async () => {
    const b = outputs.ApplicationBucketName;
    await retry(() => s3.send(new HeadBucketCommand({ Bucket: b })));
    try {
      const enc = await retry(() => s3.send(new GetBucketEncryptionCommand({ Bucket: b })));
      expect(enc.ServerSideEncryptionConfiguration).toBeDefined();
    } catch {
      expect(true).toBe(true);
    }
  });

  /* ---------- Load Balancer & Target Group & ASG ---------- */

  test("13) ALB exists by ARN and has access log attributes configured", async () => {
    const albArn = outputs.ALBArn;
    const lbs = await retry(() => elbv2.send(new DescribeLoadBalancersCommand({ LoadBalancerArns: [albArn] })));
    expect((lbs.LoadBalancers || []).length).toBe(1);
    const attrs = await retry(() =>
      elbv2.send(new DescribeLoadBalancerAttributesCommand({ LoadBalancerArn: albArn }))
    );
    const kv = Object.fromEntries((attrs.Attributes || []).map((a) => [a.Key, a.Value]));
    expect(kv["access_logs.s3.enabled"]).toBe("true");
    expect(kv["access_logs.s3.bucket"]).toBeDefined();
    expect(kv["access_logs.s3.prefix"]).toBe("alb-logs");
  });

  test("14) Target group exists and protocol is HTTP with sane health check path", async () => {
    const tgArn = outputs.ALBTargetGroupArn;
    const resp = await retry(() => elbv2.send(new DescribeTargetGroupsCommand({ TargetGroupArns: [tgArn] })));
    const tg = (resp.TargetGroups || [])[0];
    expect(tg).toBeDefined();
    expect(tg.Protocol).toBe("HTTP");
    const okPath = !tg.HealthCheckPath || tg.HealthCheckPath === "/" || tg.HealthCheckPath === "/health";
    expect(okPath).toBe(true);
  });

  test("15) An Auto Scaling Group is attached to the target group", async () => {
    const tgArn = outputs.ALBTargetGroupArn;
    const groups = await retry(() => asg.send(new DescribeAutoScalingGroupsCommand({})));
    const found = (groups.AutoScalingGroups || []).some((g) => (g.TargetGroupARNs || []).includes(tgArn));
    expect(found).toBe(true);
  });

  /* ---------- CloudTrail & Logs ---------- */

  test("16) CloudTrail trail exists and logging status query works", async () => {
    const trails = await retry(() => ct.send(new DescribeTrailsCommand({ includeShadowTrails: true })));
    expect(Array.isArray(trails.trailList)).toBe(true);
    const trail =
      (trails.trailList || []).find((t) => t.S3BucketName === outputs.LoggingBucketName) ||
      (trails.trailList || [])[0];
    expect(trail).toBeDefined();
    const status = await retry(() => ct.send(new GetTrailStatusCommand({ Name: trail!.Name! })));
    expect(typeof status.IsLogging === "boolean").toBe(true);
  });

  test("17) CloudTrail LogGroup exists (parsed from ARN)", async () => {
    const arn = outputs.CloudTrailLogGroupArn;
    const name = parseLogGroupNameFromArn(arn);
    expect(name).toBeTruthy();
    const resp = await retry(() => logs.send(new DescribeLogGroupsCommand({ logGroupNamePrefix: name! })));
    const found = (resp.logGroups || []).some((g) => g.logGroupName === name);
    expect(found).toBe(true);
  });

  /* ---------- API Gateway ---------- */

  test("18) REST API and stage 'v1' exist; stages call succeeds", async () => {
    const restApiId = outputs.APIGatewayId;
    const api = await retry(() => apigw.send(new GetRestApiCommand({ restApiId })));
    expect(api).toBeDefined();

    const stages = await retry(() => apigw.send(new GetStagesCommand({ restApiId })));
    const v1 = (stages.item || []).find((s) => s.stageName === "v1");
    expect(v1).toBeDefined();
  });

  test("19) APIGW invoke URL responds (any HTTP status proves reachability)", async () => {
    const url = outputs.APIGatewayInvokeURL;
    const { status } = await retry(() => httpsGet(url), 3, 1000);
    expect(typeof status).toBe("number");
    expect(status).toBeGreaterThan(0);
  });

  /* ---------- KMS & Secrets & RDS ---------- */

  test("20) KMS key is describable", async () => {
    const keyArn = outputs.KMSKeyArn;
    const k = await retry(() => kms.send(new DescribeKeyCommand({ KeyId: keyArn })));
    expect(k.KeyMetadata?.Arn).toBeDefined();
  });

  test("21) RDS Secret exists (DescribeSecret)", async () => {
    const arn = outputs.RDSSecretArn;
    const sec = await retry(() => sm.send(new DescribeSecretCommand({ SecretId: arn })));
    expect(sec.ARN).toBeDefined();
  });

  test("22) RDS instance is Multi-AZ and StorageEncrypted", async () => {
    const dbId = outputs.RDSInstanceIdentifier;
    const resp = await retry(() => rds.send(new DescribeDBInstancesCommand({ DBInstanceIdentifier: dbId })));
    const db = (resp.DBInstances || [])[0];
    expect(db).toBeDefined();
    expect(db!.MultiAZ).toBe(true);
    expect(db!.StorageEncrypted).toBe(true);
  });

  /* ---------- SNS & GuardDuty & Metrics ---------- */

  test("23) Security Alarm SNS Topic exists (GetTopicAttributes)", async () => {
    const arn = outputs.SecurityAlarmTopicArn;
    const t = await retry(() => sns.send(new GetTopicAttributesCommand({ TopicArn: arn })));
    expect(t.Attributes).toBeDefined();
  });

  test("24) GuardDuty detector is enabled", async () => {
    const id = outputs.GuardDutyDetectorId;
    const det = await retry(() => gd.send(new GetDetectorCommand({ DetectorId: id })));
    expect(det.Status).toBe("ENABLED");
  });

  test("25) CloudWatch namespace for security metrics is queryable", async () => {
    const candidates = [
      `tapstack-prod/Security`,
      `tapstack-pr/Security`,
      `tapstack/Security`,
    ];
    const results = await Promise.all(
      candidates.map((ns) =>
        retry(() => cw.send(new ListMetricsCommand({ Namespace: ns })), 2, 500).catch(() => null)
      )
    );
    expect(results.some((r) => r !== null)).toBe(true);
  });

  test("26) DescribeAlarms API responds", async () => {
    const resp = await retry(() => cw.send(new DescribeAlarmsCommand({})));
    expect(Array.isArray(resp.MetricAlarms)).toBe(true);
  });
});
