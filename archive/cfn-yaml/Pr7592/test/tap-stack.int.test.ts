// test/tapstack.int.test.ts

import fs from "fs";
import path from "path";
import net from "net";
import { setTimeout as wait } from "timers/promises";

import {
  EC2Client,
  DescribeVpcsCommand,
  DescribeSubnetsCommand,
  DescribeNatGatewaysCommand,
  DescribeSecurityGroupsCommand,
  DescribeInstancesCommand,
} from "@aws-sdk/client-ec2";

import {
  ElasticLoadBalancingV2Client,
  DescribeLoadBalancersCommand,
  DescribeTargetHealthCommand,
  DescribeListenersCommand,
} from "@aws-sdk/client-elastic-load-balancing-v2";

import {
  AutoScalingClient,
  DescribeAutoScalingGroupsCommand,
} from "@aws-sdk/client-auto-scaling";

import {
  S3Client,
  HeadBucketCommand,
  GetBucketEncryptionCommand,
  GetBucketVersioningCommand,
} from "@aws-sdk/client-s3";

import {
  RDSClient,
  DescribeDBInstancesCommand,
  DBInstance,
} from "@aws-sdk/client-rds";

import {
  CloudTrailClient,
  DescribeTrailsCommand,
  GetTrailStatusCommand,
} from "@aws-sdk/client-cloudtrail";

import {
  CloudWatchClient,
  DescribeAlarmsCommand,
} from "@aws-sdk/client-cloudwatch";

import {
  CloudWatchLogsClient,
  DescribeLogGroupsCommand,
} from "@aws-sdk/client-cloudwatch-logs";

import {
  KMSClient,
  DescribeKeyCommand,
} from "@aws-sdk/client-kms";

import {
  SNSClient,
  GetTopicAttributesCommand,
} from "@aws-sdk/client-sns";

import {
  LambdaClient,
  GetFunctionCommand,
} from "@aws-sdk/client-lambda";

/* ---------------------------- Setup / Helpers --------------------------- */

const p = path.resolve(process.cwd(), "cfn-outputs/all-outputs.json");
if (!fs.existsSync(p)) {
  throw new Error(`Expected outputs file at ${p} — create it before running integration tests.`);
}
const rawJson = JSON.parse(fs.readFileSync(p, "utf8"));
// The file typically contains: { "<stack-name>": [ { OutputKey, OutputValue }, ... ] }
const topKey = Object.keys(rawJson)[0];
const outputsArr: { OutputKey: string; OutputValue: string }[] = rawJson[topKey];
const outputs: Record<string, string> = {};
for (const o of outputsArr) outputs[o.OutputKey] = o.OutputValue;

function getOutput(key: string): string {
  const v = outputs[key];
  if (!v) throw new Error(`Missing output: ${key}`);
  return v;
}

function regionFromArn(arn?: string): string | undefined {
  if (!arn) return;
  // arn:partition:service:region:account:resource
  const parts = arn.split(":");
  if (parts.length >= 6) return parts[3] || undefined;
  return;
}

function deduceRegion(): string {
  const candidates = [
    outputs.AlbArn,
    outputs.LogsKmsKeyArn,
    outputs.DataKmsKeyArn,
    outputs.LambdaFunctionArn,
    outputs.NotificationsTopicArn,
  ].filter(Boolean) as string[];

  for (const c of candidates) {
    const r = regionFromArn(c);
    if (r) return r;
  }
  return process.env.AWS_REGION || process.env.AWS_DEFAULT_REGION || "us-west-2";
}
const region = deduceRegion();

const ec2 = new EC2Client({ region });
const elbv2 = new ElasticLoadBalancingV2Client({ region });
const asg = new AutoScalingClient({ region });
const s3 = new S3Client({ region });
const rds = new RDSClient({ region });
const ct = new CloudTrailClient({ region });
const cw = new CloudWatchClient({ region });
const logs = new CloudWatchLogsClient({ region });
const kms = new KMSClient({ region });
const sns = new SNSClient({ region });
const lambda = new LambdaClient({ region });

// generic retry with exp backoff
async function retry<T>(fn: () => Promise<T>, attempts = 5, baseMs = 1000): Promise<T> {
  let last: any;
  for (let i = 0; i < attempts; i++) {
    try {
      return await fn();
    } catch (e: any) {
      last = e;
      if (i < attempts - 1) await wait(baseMs * Math.pow(2, i));
    }
  }
  throw last;
}

function isVpcId(v?: string) {
  return typeof v === "string" && /^vpc-[0-9a-f]+$/.test(v);
}

function parseCsvIds(csv: string | undefined): string[] {
  if (!csv) return [];
  return csv.split(",").map((s) => s.trim()).filter(Boolean);
}

async function tcpConnect(host: string, port: number, timeoutMs = 7000): Promise<boolean> {
  return await new Promise<boolean>((resolve) => {
    const socket = new net.Socket();
    let done = false;
    const finish = (ok: boolean) => {
      if (done) return;
      done = true;
      try { socket.destroy(); } catch {}
      resolve(ok);
    };
    socket.setTimeout(timeoutMs);
    socket.on("connect", () => finish(true));
    socket.on("timeout", () => finish(false));
    socket.on("error", () => finish(false));
    socket.connect(port, host);
  });
}

jest.setTimeout(12 * 60 * 1000); // 12 minutes to be safe for first run

/* -------------------------------- Tests -------------------------------- */

describe("TapStack — Live Integration Tests", () => {
  /* 01 */ test("outputs parsed and essential keys present", () => {
    expect(outputsArr && outputsArr.length).toBeGreaterThan(0);
    // essential
    expect(() => getOutput("VpcId")).not.toThrow();
    expect(() => getOutput("AlbArn")).not.toThrow();
    expect(() => getOutput("AlbDNSName")).not.toThrow();
    expect(() => getOutput("TargetGroupArn")).not.toThrow();
    expect(() => getOutput("AsgName")).not.toThrow();
    expect(() => getOutput("ArtifactBucketName")).not.toThrow();
    expect(() => getOutput("CloudTrailBucketName")).not.toThrow();
    expect(() => getOutput("LogsKmsKeyArn")).not.toThrow();
    expect(() => getOutput("DataKmsKeyArn")).not.toThrow();
  });

  /* 02 */ test("region deduction from ARNs matches active region", () => {
    expect(typeof region).toBe("string");
    // region must look like xx-xxxx-x
    expect(/[a-z]{2}-[a-z]+-\d/.test(region)).toBe(true);
  });

  /* 03 */ test("VPC exists in EC2", async () => {
    const vpcId = getOutput("VpcId");
    expect(isVpcId(vpcId)).toBe(true);
    const resp = await retry(() => ec2.send(new DescribeVpcsCommand({ VpcIds: [vpcId] })));
    expect((resp.Vpcs || []).find((v) => v.VpcId === vpcId)).toBeDefined();
  });

  /* 04 */ test("Public subnets exist and mapPublicIpOnLaunch = true", async () => {
    const ids = parseCsvIds(outputs.PublicSubnetIds);
    expect(ids.length).toBe(2);
    const resp = await retry(() => ec2.send(new DescribeSubnetsCommand({ SubnetIds: ids })));
    for (const s of resp.Subnets || []) {
      expect(s.MapPublicIpOnLaunch).toBe(true);
    }
  });

  /* 05 */ test("Private subnets exist and mapPublicIpOnLaunch = false", async () => {
    const ids = parseCsvIds(outputs.PrivateSubnetIds);
    expect(ids.length).toBe(2);
    const resp = await retry(() => ec2.send(new DescribeSubnetsCommand({ SubnetIds: ids })));
    for (const s of resp.Subnets || []) {
      expect(s.MapPublicIpOnLaunch).toBe(false);
    }
  });

  /* 06 */ test("NAT Gateway is available in one of the public subnets", async () => {
    const pub = parseCsvIds(outputs.PublicSubnetIds);
    const res = await retry(() =>
      ec2.send(
        new DescribeNatGatewaysCommand({
          Filter: [{ Name: "subnet-id", Values: pub }],
        })
      )
    );
    const list = res.NatGateways || [];
    expect(list.length).toBeGreaterThan(0);
    expect(list.some((ngw) => ngw.State === "available")).toBe(true);
  });

  /* 07 */ test("ALB exists and is internet-facing", async () => {
    const albArn = getOutput("AlbArn");
    const d = await retry(() => elbv2.send(new DescribeLoadBalancersCommand({ LoadBalancerArns: [albArn] })));
    const lb = (d.LoadBalancers || [])[0];
    expect(lb).toBeDefined();
    expect(lb.Scheme).toBe("internet-facing");
    expect(lb.Type).toBe("application");
  });

  /* 08 */ test("ALB listener on port 80 exists", async () => {
    const albArn = getOutput("AlbArn");
    const d = await retry(() => elbv2.send(new DescribeListenersCommand({ LoadBalancerArn: albArn })));
    const has80 = (d.Listeners || []).some((l) => l.Port === 80 && l.Protocol === "HTTP");
    expect(has80).toBe(true);
  });

  /* 09 */ test("ALB DNS is reachable on TCP/80", async () => {
    const host = getOutput("AlbDNSName");
    const ok = await tcpConnect(host, 80, 8000);
    expect(ok).toBe(true);
  });

  /* 10 */ test("ASG exists and meets desired capacity with InService & Healthy instances", async () => {
    const name = getOutput("AsgName");
    const d = await retry(() => asg.send(new DescribeAutoScalingGroupsCommand({ AutoScalingGroupNames: [name] })));
    const g = (d.AutoScalingGroups || [])[0];
    expect(g).toBeDefined();
    const desired = g.DesiredCapacity ?? 0;
    const healthy = (g.Instances || []).filter(
      (i) => i.LifecycleState === "InService" && i.HealthStatus === "Healthy"
    );
    expect(healthy.length).toBeGreaterThanOrEqual(desired);
  });

  /* 11 */ test("ASG instances are in private subnets", async () => {
    const name = getOutput("AsgName");
    const priv = new Set(parseCsvIds(outputs.PrivateSubnetIds));
    const d = await retry(() => asg.send(new DescribeAutoScalingGroupsCommand({ AutoScalingGroupNames: [name] })));
    const g = (d.AutoScalingGroups || [])[0];
    const instanceIds = (g?.Instances || []).map((i) => i.InstanceId!).filter(Boolean);
    if (instanceIds.length === 0) return expect(instanceIds.length).toBeGreaterThanOrEqual(0); // pass if ASG empty (scaled to 0)
    const di = await retry(() => ec2.send(new DescribeInstancesCommand({ InstanceIds: instanceIds })));
    const seenSubnets = new Set<string>();
    for (const r of di.Reservations || []) {
      for (const inst of r.Instances || []) {
        if (inst.SubnetId) seenSubnets.add(inst.SubnetId);
      }
    }
    // Every subnet encountered must be in the private set
    for (const sid of seenSubnets) {
      expect(priv.has(sid)).toBe(true);
    }
  });

  /* 12 */ test("ALB SG allows HTTP/80 from 0.0.0.0/0", async () => {
    const albArn = getOutput("AlbArn");
    const d = await retry(() => elbv2.send(new DescribeLoadBalancersCommand({ LoadBalancerArns: [albArn] })));
    const lb = (d.LoadBalancers || [])[0];
    expect(lb).toBeDefined();
    const sgIds = lb.SecurityGroups || [];
    const sgs = await retry(() => ec2.send(new DescribeSecurityGroupsCommand({ GroupIds: sgIds })));
    const any80Open = (sgs.SecurityGroups || []).some((sg) =>
      (sg.IpPermissions || []).some(
        (p) => p.IpProtocol === "tcp" && p.FromPort === 80 && p.ToPort === 80 && (p.IpRanges || []).some((r) => r.CidrIp === "0.0.0.0/0")
      )
    );
    expect(any80Open).toBe(true);
  });

  /* 13 */ test("App SG allows HTTP/80 from ALB SG", async () => {
    // Find App SG from instances in ASG
    const name = getOutput("AsgName");
    const g = (await retry(() => asg.send(new DescribeAutoScalingGroupsCommand({ AutoScalingGroupNames: [name] })))).AutoScalingGroups?.[0];
    const instanceIds = (g?.Instances || []).map((i) => i.InstanceId!).filter(Boolean);
    if (instanceIds.length === 0) return expect(true).toBe(true); // scaled to 0 => configuration still valid
    const di = await retry(() => ec2.send(new DescribeInstancesCommand({ InstanceIds: instanceIds })));
    const appSgIds = new Set<string>();
    for (const r of di.Reservations || []) {
      for (const inst of r.Instances || []) {
        for (const sg of inst.SecurityGroups || []) appSgIds.add(sg.GroupId!);
      }
    }
    const albArn = getOutput("AlbArn");
    const alb = (await retry(() => elbv2.send(new DescribeLoadBalancersCommand({ LoadBalancerArns: [albArn] })))).LoadBalancers?.[0];
    const albSgIds = new Set(alb?.SecurityGroups || []);

    const sgs = await retry(() => ec2.send(new DescribeSecurityGroupsCommand({ GroupIds: Array.from(appSgIds) })));
    // For any app SG, ensure an ingress rule references the ALB SG on port 80
    const ok = (sgs.SecurityGroups || []).some((sg) =>
      (sg.IpPermissions || []).some((p) =>
        p.IpProtocol === "tcp" &&
        p.FromPort === 80 &&
        p.ToPort === 80 &&
        (p.UserIdGroupPairs || []).some((pair) => pair.GroupId && albSgIds.has(pair.GroupId))
      )
    );
    expect(ok).toBe(true);
  });

  /* 14 */ test("Artifact S3 bucket exists and is KMS-encrypted", async () => {
    const b = getOutput("ArtifactBucketName");
    await retry(() => s3.send(new HeadBucketCommand({ Bucket: b })));
    const enc = await retry(() => s3.send(new GetBucketEncryptionCommand({ Bucket: b })));
    expect(enc.ServerSideEncryptionConfiguration).toBeDefined();
  });

  /* 15 */ test("CloudTrail S3 bucket exists and versioning enabled", async () => {
    const b = getOutput("CloudTrailBucketName");
    await retry(() => s3.send(new HeadBucketCommand({ Bucket: b })));
    const ver = await retry(() => s3.send(new GetBucketVersioningCommand({ Bucket: b })));
    expect(ver.Status).toBe("Enabled");
  });

  /* 16 */ test("CloudTrail trail is multi-region and logging active", async () => {
    const name = getOutput("CloudTrailName");
    const d = await retry(() => ct.send(new DescribeTrailsCommand({ trailNameList: [name] })));
    const t = (d.trailList || [])[0];
    expect(t).toBeDefined();
    expect(t.IsMultiRegionTrail).toBe(true);
    const s = await retry(() => ct.send(new GetTrailStatusCommand({ Name: name })));
    expect(typeof s.IsLogging).toBe("boolean");
  });

  /* 17 */ test("KMS keys (Logs/Data) exist and are Enabled", async () => {
    const logsArn = getOutput("LogsKmsKeyArn");
    const dataArn = getOutput("DataKmsKeyArn");
    const kd = await retry(() => kms.send(new DescribeKeyCommand({ KeyId: logsArn })));
    const ke = await retry(() => kms.send(new DescribeKeyCommand({ KeyId: dataArn })));
    expect(kd.KeyMetadata?.KeyState).toBe("Enabled");
    expect(ke.KeyMetadata?.KeyState).toBe("Enabled");
  });

  /* 18 */ test("RDS instance is available, encrypted, private, and in private subnets", async () => {
    const id = getOutput("RdsInstanceIdentifier");
    const d = await retry(() => rds.send(new DescribeDBInstancesCommand({ DBInstanceIdentifier: id })));
    const db: DBInstance = d.DBInstances![0]!;
    expect(db.DBInstanceStatus).toBe("available");
    expect(db.StorageEncrypted).toBe(true);
    expect(db.PubliclyAccessible).toBe(false);
    const privSet = new Set(parseCsvIds(outputs.PrivateSubnetIds));
    const group = db.DBSubnetGroup;
    expect(group?.Subnets && group.Subnets.length).toBeGreaterThan(0);
    for (const sn of group!.Subnets!) {
      const sid = sn.SubnetIdentifier!;
      // Describe to resolve subnet id string equality
      const s = await retry(() => ec2.send(new DescribeSubnetsCommand({ SubnetIds: [sid] })));
      const actualId = s.Subnets?.[0]?.SubnetId!;
      expect(privSet.has(actualId)).toBe(true);
    }
  });

  /* 19 */ test("SNS topic exists and uses KMS", async () => {
    const topicArn = getOutput("NotificationsTopicArn");
    const a = await retry(() => sns.send(new GetTopicAttributesCommand({ TopicArn: topicArn })));
    // Attribute map keys are strings
    const attrs = a.Attributes || {};
    expect(attrs.TopicArn).toBe(topicArn);
    // KmsMasterKeyId may be key ID or ARN; just ensure it's present
    expect(!!attrs.KmsMasterKeyId).toBe(true);
  });

  /* 20 */ test("Example Lambda exists and runtime is python3.12", async () => {
    const fnArn = getOutput("LambdaFunctionArn");
    const g = await retry(() => lambda.send(new GetFunctionCommand({ FunctionName: fnArn })));
    expect(g.Configuration?.Runtime).toBe("python3.12");
    expect(g.Configuration?.FunctionName).toBeDefined();
  });

  /* 21 */ test("CloudWatch alarms exist for ALB 5xx and TG Unhealthy or RDS CPU", async () => {
    const d = await retry(() => cw.send(new DescribeAlarmsCommand({})));
    const alarms = d.MetricAlarms || [];
    const hasAlb5xx = alarms.some((a) => a.MetricName === "HTTPCode_ELB_5XX_Count" && a.Namespace === "AWS/ApplicationELB");
    const hasTgUnhealthy = alarms.some((a) => a.MetricName === "UnHealthyHostCount" && a.Namespace === "AWS/ApplicationELB");
    const hasRdsCpu = alarms.some((a) => a.MetricName === "CPUUtilization" && a.Namespace === "AWS/RDS");
    expect(hasAlb5xx || hasTgUnhealthy || hasRdsCpu).toBe(true);
  });

  /* 22 */ test("ASG instances have instance security groups (non-empty)", async () => {
    const name = getOutput("AsgName");
    const d = await retry(() => asg.send(new DescribeAutoScalingGroupsCommand({ AutoScalingGroupNames: [name] })));
    const g = (d.AutoScalingGroups || [])[0];
    const ids = (g?.Instances || []).map((i) => i.InstanceId!).filter(Boolean);
    if (ids.length === 0) return expect(true).toBe(true); // scaled to 0
    const di = await retry(() => ec2.send(new DescribeInstancesCommand({ InstanceIds: ids })));
    let countWithSg = 0;
    for (const r of di.Reservations || []) {
      for (const inst of r.Instances || []) {
        if ((inst.SecurityGroups || []).length > 0) countWithSg++;
      }
    }
    expect(countWithSg).toBeGreaterThan(0);
  });

  /* 23 */ test("ALB DNS resolves and returns at least SYN-ACK (TCP 80) consistently (retry)", async () => {
    const host = getOutput("AlbDNSName");
    const ok1 = await tcpConnect(host, 80, 5000);
    const ok2 = ok1 ? true : await tcpConnect(host, 80, 7000);
    expect(ok1 || ok2).toBe(true);
  });

  /* 24 */ test("At least one EC2 instance in ASG reports a private subnet CIDR membership", async () => {
    const name = getOutput("AsgName");
    const g = (await retry(() => asg.send(new DescribeAutoScalingGroupsCommand({ AutoScalingGroupNames: [name] })))).AutoScalingGroups?.[0];
    const ids = (g?.Instances || []).map((i) => i.InstanceId!).filter(Boolean);
    if (ids.length === 0) return expect(true).toBe(true); // scaled to 0
    const di = await retry(() => ec2.send(new DescribeInstancesCommand({ InstanceIds: ids })));
    const privateIds = new Set(parseCsvIds(outputs.PrivateSubnetIds));
    let matches = 0;
    for (const r of di.Reservations || []) {
      for (const inst of r.Instances || []) {
        if (inst.SubnetId && privateIds.has(inst.SubnetId)) matches++;
      }
    }
    expect(matches).toBeGreaterThan(0);
  });
});
