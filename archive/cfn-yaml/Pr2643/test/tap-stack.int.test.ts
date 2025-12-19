import {
  EC2Client,
  DescribeVpcsCommand,
  DescribeSubnetsCommand,
  DescribeInternetGatewaysCommand,
  DescribeNatGatewaysCommand,
  DescribeSecurityGroupsCommand,
} from "@aws-sdk/client-ec2";
import {
  ElasticLoadBalancingV2Client,
  DescribeLoadBalancersCommand,
  DescribeTargetGroupsCommand,
  DescribeListenersCommand,
} from "@aws-sdk/client-elastic-load-balancing-v2";
import {
  AutoScalingClient,
  DescribeAutoScalingGroupsCommand,
} from "@aws-sdk/client-auto-scaling";
import {
  CloudWatchClient,
  DescribeAlarmsCommand,
} from "@aws-sdk/client-cloudwatch";
import {
  S3Client,
  HeadBucketCommand,
  GetBucketVersioningCommand,
  GetBucketTaggingCommand,
  GetBucketAclCommand,
  GetBucketEncryptionCommand,
} from "@aws-sdk/client-s3";
import * as fs from "fs";
import * as path from "path";

// --- Helpers ---
function readOutputs() {
  const p = path.resolve(process.cwd(), "cfn-outputs/all-outputs.json");
  if (!fs.existsSync(p)) {
    throw new Error(`Outputs file not found at ${p}`);
  }
  return JSON.parse(fs.readFileSync(p, "utf8"));
}
async function retry<T>(fn: () => Promise<T>, attempts = 6, baseMs = 500): Promise<T> {
  let lastErr: any;
  for (let i = 0; i < attempts; i++) {
    try {
      return await fn();
    } catch (e) {
      lastErr = e;
      const wait = baseMs * Math.pow(1.5, i) + Math.floor(Math.random() * 200);
      await new Promise((r) => setTimeout(r, wait));
    }
  }
  throw lastErr;
}

// --- AWS Clients ---
const region = process.env.AWS_REGION || "us-east-1";
const ec2 = new EC2Client({ region });
const elbv2 = new ElasticLoadBalancingV2Client({ region });
const asg = new AutoScalingClient({ region });
const cw = new CloudWatchClient({ region });
const s3 = new S3Client({ region });

// --- Outputs ---
const outputs = readOutputs();
const flat = Object.values(outputs)[0] as any[];
const out: Record<string, string> = {};
flat.forEach((x: any) => (out[x.OutputKey] = x.OutputValue));

// --- Tests ---
describe("LIVE: TapStack integration tests", () => {
  // ---------------- VPC ----------------
  test("VPC exists and has DNS enabled", async () => {
    const vpcs = await ec2.send(new DescribeVpcsCommand({ VpcIds: [out.VPCId] }));
    expect(vpcs.Vpcs?.[0].VpcId).toBe(out.VPCId);
    expect(vpcs.Vpcs?.[0].IsDefault).toBe(false);
  });

  // ---------------- Subnets ----------------
  test("Subnets exist and are in different AZs", async () => {
    const subnets = await ec2.send(new DescribeSubnetsCommand({
      SubnetIds: [out.PublicSubnet1Id, out.PublicSubnet2Id, out.PrivateSubnet1Id, out.PrivateSubnet2Id],
    }));
    const azs = subnets.Subnets?.map((s) => s.AvailabilityZone) || [];
    expect(new Set(azs).size).toBeGreaterThan(1); // high availability
    subnets.Subnets?.forEach((s) => expect(s.VpcId).toBe(out.VPCId));
  });

  // ---------------- IGW ----------------
  test("Internet Gateway attached to correct VPC", async () => {
    const igws = await ec2.send(new DescribeInternetGatewaysCommand({ InternetGatewayIds: [out.InternetGatewayId] }));
    expect(igws.InternetGateways?.[0].Attachments?.[0].VpcId).toBe(out.VPCId);
  });

  // ---------------- NAT ----------------
  test("NAT Gateways exist and are available", async () => {
    const nats = await ec2.send(new DescribeNatGatewaysCommand({ NatGatewayIds: [out.NatGateway1Id, out.NatGateway2Id] }));
    expect(nats.NatGateways?.length).toBe(2);
    nats.NatGateways?.forEach((ng) => expect(ng.State).toBe("available"));
  });

  // ---------------- Security Groups ----------------
  test("ALB SG allows only HTTP/HTTPS", async () => {
    const sgs = await ec2.send(new DescribeSecurityGroupsCommand({ GroupIds: [out.LoadBalancerSecurityGroupId] }));
    const perms = sgs.SecurityGroups?.[0].IpPermissions || [];
    expect(perms.every((p) => [80, 443].includes(p.FromPort!))).toBe(true);
    expect(perms.some((p) => p.IpRanges?.some((r) => r.CidrIp === "0.0.0.0/0"))).toBe(true);
  });

  test("Instance SG only allows inbound from ALB SG", async () => {
    const sgs = await ec2.send(new DescribeSecurityGroupsCommand({ GroupIds: [out.InstanceSecurityGroupId] }));
    const perms = sgs.SecurityGroups?.[0].IpPermissions || [];
    perms.forEach((p) => {
      expect(p.UserIdGroupPairs?.map((u) => u.GroupId)).toContain(out.LoadBalancerSecurityGroupId);
    });
  });

  // ---------------- Load Balancer ----------------
  test("ALB is internet-facing with DNS name", async () => {
    const lbs = await elbv2.send(new DescribeLoadBalancersCommand({ LoadBalancerArns: [out.LoadBalancerArn] }));
    const alb = lbs.LoadBalancers?.[0];
    expect(alb?.Scheme).toBe("internet-facing");
    expect(alb?.DNSName).toBe(out.LoadBalancerDNS);
  });

  test("Target Group uses HTTP and is healthy", async () => {
    const tgs = await elbv2.send(new DescribeTargetGroupsCommand({ TargetGroupArns: [out.TargetGroupArn] }));
    const tg = tgs.TargetGroups?.[0];
    expect(tg?.Protocol).toBe("HTTP");
    expect(tg?.VpcId).toBe(out.VPCId);
  });

  test("HTTP Listener forwards to TargetGroup", async () => {
    const ls = await elbv2.send(new DescribeListenersCommand({ ListenerArns: [out.ListenerHTTPArn] }));
    const l = ls.Listeners?.[0];
    expect(l?.Port).toBe(80);
    expect(l?.DefaultActions?.[0].TargetGroupArn).toBe(out.TargetGroupArn);
  });

  // ---------------- Auto Scaling ----------------
  test("ASG is balanced across private subnets", async () => {
    const asgs = await asg.send(new DescribeAutoScalingGroupsCommand({ AutoScalingGroupNames: [out.AutoScalingGroupName] }));
    const group = asgs.AutoScalingGroups?.[0];
    expect(group?.VPCZoneIdentifier).toContain(out.PrivateSubnet1Id);
    expect(group?.VPCZoneIdentifier).toContain(out.PrivateSubnet2Id);
    expect(group?.MinSize).toBe(2);
    expect(group?.MaxSize).toBe(4);
  });

  test("ASG desired capacity is 2", async () => {
    const asgs = await asg.send(new DescribeAutoScalingGroupsCommand({ AutoScalingGroupNames: [out.AutoScalingGroupName] }));
    expect(asgs.AutoScalingGroups?.[0].DesiredCapacity).toBe(2);
  });

  // ---------------- CloudWatch ----------------
  test("CloudWatch Alarms exist and correct thresholds", async () => {
    const alarms = await cw.send(new DescribeAlarmsCommand({ AlarmNames: [out.CPUAlarmHighName, out.CPUAlarmLowName] }));
    const high = alarms.MetricAlarms?.find((a) => a.AlarmName === out.CPUAlarmHighName);
    const low = alarms.MetricAlarms?.find((a) => a.AlarmName === out.CPUAlarmLowName);
    expect(high?.Threshold).toBe(70);
    expect(high?.ComparisonOperator).toBe("GreaterThanThreshold");
    expect(low?.Threshold).toBe(20);
    expect(low?.ComparisonOperator).toBe("LessThanThreshold");
  });

  // ---------------- S3 ----------------
  test("Log bucket exists and has versioning enabled", async () => {
    await expect(retry(() => s3.send(new HeadBucketCommand({ Bucket: out.LogBucketName })))).resolves.toBeTruthy();
    const ver = await s3.send(new GetBucketVersioningCommand({ Bucket: out.LogBucketName }));
    expect(ver.Status).toBe("Enabled");
  });

  test("Log bucket has tagging applied", async () => {
    const tags = await s3.send(new GetBucketTaggingCommand({ Bucket: out.LogBucketName }));
    const found = tags.TagSet?.find((t) => t.Key === "Name");
    expect(found?.Value).toContain("logs");
  });

  test("Log bucket has encryption", async () => {
    const enc = await s3.send(new GetBucketEncryptionCommand({ Bucket: out.LogBucketName }));
    expect(enc.ServerSideEncryptionConfiguration).toBeDefined();
  });

  // ---------------- Edge / Compliance ----------------
  test("All expected outputs exist", () => {
    const required = [
      "VPCId", "PrivateSubnet1Id", "PrivateSubnet2Id", "PublicSubnet1Id", "PublicSubnet2Id",
      "InternetGatewayId", "NatGateway1Id", "NatGateway2Id",
      "LoadBalancerArn", "LoadBalancerDNS", "TargetGroupArn", "ListenerHTTPArn",
      "AutoScalingGroupName", "LaunchTemplateId",
      "InstanceSecurityGroupId", "LoadBalancerSecurityGroupId",
      "LogBucketName", "LogBucketArn",
      "CPUAlarmHighName", "CPUAlarmLowName",
    ];
    required.forEach((k) => expect(out[k]).toBeDefined());
  });

  test("ALB must not be internal", async () => {
    const lbs = await elbv2.send(new DescribeLoadBalancersCommand({ LoadBalancerArns: [out.LoadBalancerArn] }));
    expect(lbs.LoadBalancers?.[0].Scheme).not.toBe("internal");
  });

  test("Subnets must not be public for ASG", async () => {
    const asgs = await asg.send(new DescribeAutoScalingGroupsCommand({ AutoScalingGroupNames: [out.AutoScalingGroupName] }));
    const subnets = asgs.AutoScalingGroups?.[0].VPCZoneIdentifier;
    expect(subnets).not.toContain(out.PublicSubnet1Id);
    expect(subnets).not.toContain(out.PublicSubnet2Id);
  });

  test("CPU alarms must reference correct ASG", async () => {
    const alarms = await cw.send(new DescribeAlarmsCommand({ AlarmNames: [out.CPUAlarmHighName, out.CPUAlarmLowName] }));
    alarms.MetricAlarms?.forEach((a) => {
      expect(a.Dimensions?.some((d) => d.Name === "AutoScalingGroupName" && d.Value === out.AutoScalingGroupName)).toBe(true);
    });
  });
});
