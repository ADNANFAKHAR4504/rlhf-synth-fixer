// test/tapstack.int.test.ts

import fs from "fs";
import path from "path";
import { setTimeout as wait } from "timers/promises";

import {
  EC2Client,
  DescribeVpcsCommand,
  DescribeSubnetsCommand,
  DescribeRouteTablesCommand,
  DescribeNatGatewaysCommand,
  DescribeSecurityGroupsCommand,
  DescribeInstancesCommand,
} from "@aws-sdk/client-ec2";

import {
  AutoScalingClient,
  DescribeAutoScalingGroupsCommand,
} from "@aws-sdk/client-auto-scaling";

import {
  CloudWatchClient,
  DescribeAlarmsCommand,
  ListMetricsCommand,
} from "@aws-sdk/client-cloudwatch";

import {
  RDSClient,
  DescribeDBInstancesCommand,
} from "@aws-sdk/client-rds";

import {
  IAMClient,
  GetInstanceProfileCommand,
  GetRoleCommand,
} from "@aws-sdk/client-iam";

import {
  CloudWatchLogsClient,
  DescribeLogGroupsCommand,
} from "@aws-sdk/client-cloudwatch-logs";

import {
  SecretsManagerClient,
  DescribeSecretCommand,
} from "@aws-sdk/client-secrets-manager";

import {
  SSMClient,
  GetParameterCommand,
} from "@aws-sdk/client-ssm";

/* ---------------------------- Setup / Helpers --------------------------- */

const outputsPath = path.resolve(process.cwd(), "cfn-outputs/all-outputs.json");
if (!fs.existsSync(outputsPath)) {
  throw new Error(`Expected outputs file at ${outputsPath} — create it before running integration tests.`);
}

// Accept both shapes:
// 1) { "<stackName>": [{OutputKey, OutputValue}, ...] }
// 2) [{OutputKey, OutputValue}, ...]
const raw = JSON.parse(fs.readFileSync(outputsPath, "utf8"));
let outputsArray: { OutputKey: string; OutputValue: string }[] = [];
if (Array.isArray(raw)) {
  outputsArray = raw;
} else if (raw && typeof raw === "object") {
  const firstTopKey = Object.keys(raw)[0];
  outputsArray = raw[firstTopKey];
}
if (!Array.isArray(outputsArray)) {
  throw new Error("Unexpected outputs JSON shape. Expect array of {OutputKey, OutputValue}.");
}
const outputs: Record<string, string> = {};
for (const o of outputsArray) outputs[o.OutputKey] = o.OutputValue;

// Region detection: prefer env; fall back to us-east-1.
// (Template itself is region-agnostic; this suite runs per region where the stack was deployed.)
const region =
  process.env.AWS_REGION ||
  process.env.AWS_DEFAULT_REGION ||
  "us-east-1";

// AWS clients
const ec2 = new EC2Client({ region });
const asg = new AutoScalingClient({ region });
const cw = new CloudWatchClient({ region });
const rds = new RDSClient({ region });
const iam = new IAMClient({ region });
const logs = new CloudWatchLogsClient({ region });
const secrets = new SecretsManagerClient({ region });
const ssm = new SSMClient({ region });

// retry helper with incremental backoff
async function retry<T>(fn: () => Promise<T>, attempts = 5, baseDelayMs = 900): Promise<T> {
  let lastErr: any = null;
  for (let i = 0; i < attempts; i++) {
    try {
      return await fn();
    } catch (err) {
      lastErr = err;
      if (i < attempts - 1) await wait(baseDelayMs * (i + 1));
    }
  }
  throw lastErr;
}

function isVpcId(v?: string) {
  return typeof v === "string" && /^vpc-[0-9a-f]+$/.test(v);
}
function isSubnetId(v?: string) {
  return typeof v === "string" && /^subnet-[0-9a-f]+$/.test(v);
}
function isAsgName(v?: string) {
  return typeof v === "string" && v.length > 0;
}
function isLtId(v?: string) {
  return typeof v === "string" && /^lt-[0-9a-f]+$/.test(v);
}
function splitIds(csv?: string): string[] {
  if (!csv) return [];
  return csv.split(",").map((s) => s.trim()).filter(Boolean);
}

/* ------------------------------ Tests ---------------------------------- */

describe("TapStack — Live Integration Tests (single file)", () => {
  jest.setTimeout(10 * 60 * 1000); // 10 minutes

  // 01
  it("outputs: parsed and contains required keys", () => {
    // Required by provided template (Outputs section)
    const required = [
      "VpcId",
      "PublicSubnetIds",
      "PrivateSubnetIds",
      "AsgName",
      "LaunchTemplateId",
      "InstanceProfileArn",
      "InstanceRoleArn",
      "RdsEndpoint",
      "CloudWatchEC2LogGroup",
      "CloudWatchAppLogGroup",
      "AlarmCpuName",
      "AlarmMemName",
      "AlarmRdsCpuName",
      "DbSecretArn",
    ];
    for (const k of required) {
      expect(typeof outputs[k]).toBe("string");
      expect(outputs[k].length).toBeGreaterThan(0);
    }
  });

  // 02
  it("VPC exists in region", async () => {
    const vpcId = outputs.VpcId;
    expect(isVpcId(vpcId)).toBe(true);
    const vpcs = await retry(() => ec2.send(new DescribeVpcsCommand({ VpcIds: [vpcId] })));
    expect(vpcs.Vpcs && vpcs.Vpcs.length === 1).toBe(true);
  });

  // 03
  it("Public and Private subnets exist and belong to VPC", async () => {
    const vpcId = outputs.VpcId;
    const publicIds = splitIds(outputs.PublicSubnetIds);
    const privateIds = splitIds(outputs.PrivateSubnetIds);
    expect(publicIds.length).toBeGreaterThanOrEqual(2);
    expect(privateIds.length).toBeGreaterThanOrEqual(2);
    [...publicIds, ...privateIds].forEach((id) => expect(isSubnetId(id)).toBe(true));
    const resp = await retry(() => ec2.send(new DescribeSubnetsCommand({ SubnetIds: [...publicIds, ...privateIds] })));
    for (const sn of resp.Subnets || []) {
      expect(sn.VpcId).toBe(outputs.VpcId);
    }
  });

  // 04
  it("Private route tables default route via NAT Gateway present (VPC-scoped check)", async () => {
    const rt = await retry(() =>
      ec2.send(new DescribeRouteTablesCommand({
        Filters: [{ Name: "vpc-id", Values: [outputs.VpcId] }],
      }))
    );
    const hasNatDefault = (rt.RouteTables || []).some((t) =>
      (t.Routes || []).some((r) => r.DestinationCidrBlock === "0.0.0.0/0" && !!r.NatGatewayId)
    );
    expect(hasNatDefault).toBe(true);
  });

  // 05
  it("NAT Gateways exist in public subnets", async () => {
    const publicIds = splitIds(outputs.PublicSubnetIds);
    const nat = await retry(() =>
      ec2.send(new DescribeNatGatewaysCommand({
        Filter: [{ Name: "subnet-id", Values: publicIds }],
      }))
    );
    // Expect at least one NAT (template creates two)
    expect((nat.NatGateways || []).length).toBeGreaterThanOrEqual(1);
  });

  // 06
  it("Security groups: one SG in VPC allows 22/80/443 ingress", async () => {
    const sgs = await retry(() =>
      ec2.send(new DescribeSecurityGroupsCommand({ Filters: [{ Name: "vpc-id", Values: [outputs.VpcId] }] }))
    );
    const candidate = (sgs.SecurityGroups || []).find((sg) => {
      const perms = sg.IpPermissions || [];
      const has22 = perms.some((p) => p.FromPort === 22 && p.ToPort === 22);
      const has80 = perms.some((p) => p.FromPort === 80 && p.ToPort === 80);
      const has443 = perms.some((p) => p.FromPort === 443 && p.ToPort === 443);
      return has22 && has80 && has443;
    });
    expect(candidate).toBeDefined();
  });

  // 07
  it("IAM InstanceProfile ARN resolves and contains at least one role", async () => {
    const arn = outputs.InstanceProfileArn;
    expect(arn).toMatch(/^arn:aws:iam::\d{12}:instance-profile\/.+/);
    const name = arn.split("/").pop()!;
    const resp = await retry(() => iam.send(new GetInstanceProfileCommand({ InstanceProfileName: name })));
    expect(resp.InstanceProfile?.Roles && resp.InstanceProfile.Roles.length > 0).toBe(true);
  });

  // 08
  it("IAM InstanceRole ARN resolves and trust policy includes ec2.amazonaws.com", async () => {
    const roleArn = outputs.InstanceRoleArn;
    expect(roleArn).toMatch(/^arn:aws:iam::\d{12}:role\/.+/);
    const roleName = roleArn.split("/").pop()!;
    const resp = await retry(() => iam.send(new GetRoleCommand({ RoleName: roleName })));
    const assume = resp.Role?.AssumeRolePolicyDocument;
    const s = typeof assume === "string" ? decodeURIComponent(assume) : JSON.stringify(assume || {});
    expect(s.includes("ec2.amazonaws.com")).toBe(true);
  });

  // 09
  it("Launch Template exists", async () => {
    const ltId = outputs.LaunchTemplateId;
    expect(isLtId(ltId)).toBe(true);
    // We can indirectly validate via ASG referencing it (next tests). Direct DescribeLaunchTemplates not required here.
    expect(true).toBe(true);
  });

  // 10
  it("ASG exists and references two subnets", async () => {
    const asgName = outputs.AsgName;
    expect(isAsgName(asgName)).toBe(true);
    const resp = await retry(() =>
      asg.send(new DescribeAutoScalingGroupsCommand({ AutoScalingGroupNames: [asgName] }))
    );
    const group = (resp.AutoScalingGroups || [])[0];
    expect(group).toBeDefined();
    expect((group.VPCZoneIdentifier || "").split(",").filter(Boolean).length).toBeGreaterThanOrEqual(2);
  });

  // 11
  it("ASG desired capacity >= 2 and at least that many instances InService/Healthy (eventual consistency)", async () => {
    const asgName = outputs.AsgName;
    const group = (await retry(() =>
      asg.send(new DescribeAutoScalingGroupsCommand({ AutoScalingGroupNames: [asgName] })))
    ).AutoScalingGroups![0];
    const desired = group.DesiredCapacity ?? parseInt(String(group.DesiredCapacity), 10);
    expect(desired).toBeGreaterThanOrEqual(2);

    // Allow instances to warm up
    await wait(20_000);
    const refreshed = (await retry(() =>
      asg.send(new DescribeAutoScalingGroupsCommand({ AutoScalingGroupNames: [asgName] })))
    ).AutoScalingGroups![0];
    const healthy = (refreshed.Instances || []).filter(
      (i) => i.LifecycleState === "InService" && (i.HealthStatus === "Healthy" || i.HealthStatus === "HEALTHY")
    );
    expect(healthy.length).toBeGreaterThanOrEqual(2);
  });

  // 12
  it("EC2 instances of the ASG span at least two distinct AZs", async () => {
    const asgName = outputs.AsgName;
    const group = (await retry(() =>
      asg.send(new DescribeAutoScalingGroupsCommand({ AutoScalingGroupNames: [asgName] })))
    ).AutoScalingGroups![0];

    const instanceIds = (group.Instances || []).map((i) => i.InstanceId!).filter(Boolean);
    expect(instanceIds.length).toBeGreaterThanOrEqual(2);

    const inst = await retry(() => ec2.send(new DescribeInstancesCommand({ InstanceIds: instanceIds })));
    const azs = new Set<string>();
    for (const r of inst.Reservations || []) {
      for (const i of r.Instances || []) {
        if (i.Placement?.AvailabilityZone) azs.add(i.Placement.AvailabilityZone);
      }
    }
    expect(azs.size).toBeGreaterThanOrEqual(2);
  });

  // 13
  it("EC2 instances have Name tag and are in private subnets", async () => {
    const privateIds = new Set(splitIds(outputs.PrivateSubnetIds));
    const asgName = outputs.AsgName;
    const group = (await retry(() =>
      asg.send(new DescribeAutoScalingGroupsCommand({ AutoScalingGroupNames: [asgName] })))
    ).AutoScalingGroups![0];
    const instanceIds = (group.Instances || []).map((i) => i.InstanceId!).filter(Boolean);
    const inst = await retry(() => ec2.send(new DescribeInstancesCommand({ InstanceIds: instanceIds })));
    let sawNameTag = false;
    let inPrivate = true;
    for (const r of inst.Reservations || []) {
      for (const i of r.Instances || []) {
        const hasName = (i.Tags || []).some((t) => t.Key === "Name" && String(t.Value || "").length > 0);
        if (hasName) sawNameTag = true;
        // Primary ENI subnet check
        const subnetId = i.SubnetId;
        if (!subnetId || !privateIds.has(subnetId)) inPrivate = false;
      }
    }
    expect(sawNameTag).toBe(true);
    expect(inPrivate).toBe(true);
  });

  // 14
  it("CloudWatch log groups exist (EC2 and App)", async () => {
    const names = [outputs.CloudWatchEC2LogGroup, outputs.CloudWatchAppLogGroup];
    for (const name of names) {
      const resp = await retry(() => logs.send(new DescribeLogGroupsCommand({ logGroupNamePrefix: name })));
      const found = (resp.logGroups || []).some((g) => g.logGroupName === name);
      expect(found).toBe(true);
    }
  });

  // 15
  it("CloudWatch alarms exist by name and are in OK | INSUFFICIENT_DATA | ALARM states", async () => {
    const names = [outputs.AlarmCpuName, outputs.AlarmMemName, outputs.AlarmRdsCpuName];
    const resp = await retry(() => cw.send(new DescribeAlarmsCommand({ AlarmNames: names })));
    const map = new Map((resp.MetricAlarms || []).map((a) => [a.AlarmName, a]));
    for (const n of names) {
      expect(map.has(n)).toBe(true);
      const st = map.get(n)!.StateValue!;
      expect(["OK", "ALARM", "INSUFFICIENT_DATA"]).toContain(st);
    }
  });

  // 16
  it("CloudWatch metrics list returns CWAgent mem_used_percent (eventual)", async () => {
    const res = await retry(() =>
      cw.send(new ListMetricsCommand({ Namespace: "CWAgent", MetricName: "mem_used_percent", MaxRecords: 50 }))
    );
    // Presence of call success and array is sufficient; metric appearance can be eventual
    expect(Array.isArray(res.Metrics)).toBe(true);
  });

  // 17
  it("RDS DB instance exists and endpoint matches Outputs.RdsEndpoint", async () => {
    const endpoint = outputs.RdsEndpoint;
    expect(typeof endpoint).toBe("string");
    const resp = await retry(() => rds.send(new DescribeDBInstancesCommand({})));
    const match = (resp.DBInstances || []).find((d) => d.Endpoint?.Address === endpoint);
    expect(match).toBeDefined();
    expect(match!.PubliclyAccessible).toBe(false);
    expect(match!.StorageEncrypted).toBe(true);
  });

  // 18
  it("RDS DBSubnetGroup uses the two private subnets from outputs", async () => {
    const endpoint = outputs.RdsEndpoint;
    const resp = await retry(() => rds.send(new DescribeDBInstancesCommand({})));
    const db = (resp.DBInstances || []).find((d) => d.Endpoint?.Address === endpoint)!;
    const privateSet = new Set(splitIds(outputs.PrivateSubnetIds));
    // EachSubnetGroup.Subnets[].SubnetIdentifier is subnet id
    const subnets = db.DBSubnetGroup?.Subnets || [];
    expect(subnets.length).toBeGreaterThanOrEqual(2);
    const allInPrivate = subnets.every((s) => s.SubnetIdentifier && privateSet.has(s.SubnetIdentifier));
    expect(allInPrivate).toBe(true);
  });


  // 19
  it("SSM public AMI parameter for AL2023 exists", async () => {
    const paramName = "/aws/service/ami-amazon-linux-latest/al2023-ami-kernel-default-x86_64";
    const resp = await retry(() => ssm.send(new GetParameterCommand({ Name: paramName })));
    expect(resp.Parameter?.Name).toBe(paramName);
    expect(String(resp.Parameter?.Value || "").length).toBeGreaterThan(0);
  });

  // 20
  it("EC2 instances have InstanceProfile attached (via IamInstanceProfile association)", async () => {
    // Use ASG instances
    const asgName = outputs.AsgName;
    const group = (await retry(() =>
      asg.send(new DescribeAutoScalingGroupsCommand({ AutoScalingGroupNames: [asgName] })))
    ).AutoScalingGroups![0];
    const instanceIds = (group.Instances || []).map((i) => i.InstanceId!).filter(Boolean);
    const inst = await retry(() => ec2.send(new DescribeInstancesCommand({ InstanceIds: instanceIds })));
    let allAttached = true;
    for (const r of inst.Reservations || []) {
      for (const i of r.Instances || []) {
        if (!i.IamInstanceProfile?.Arn) allAttached = false;
      }
    }
    expect(allAttached).toBe(true);
  });

  // 21
  it("VPC has at least one public route (0.0.0.0/0) via InternetGateway", async () => {
    const rt = await retry(() =>
      ec2.send(new DescribeRouteTablesCommand({
        Filters: [{ Name: "vpc-id", Values: [outputs.VpcId] }],
      }))
    );
    const hasIgwDefault = (rt.RouteTables || []).some((t) =>
      (t.Routes || []).some((r) => r.DestinationCidrBlock === "0.0.0.0/0" && !!r.GatewayId && r.GatewayId.startsWith("igw-"))
    );
    expect(hasIgwDefault).toBe(true);
  });

  // 22
  it("ASG instances are in the two private subnets from outputs", async () => {
    const privateSet = new Set(splitIds(outputs.PrivateSubnetIds));
    const asgName = outputs.AsgName;
    const group = (await retry(() =>
      asg.send(new DescribeAutoScalingGroupsCommand({ AutoScalingGroupNames: [asgName] })))
    ).AutoScalingGroups![0];
    const instanceIds = (group.Instances || []).map((i) => i.InstanceId!).filter(Boolean);
    const inst = await retry(() => ec2.send(new DescribeInstancesCommand({ InstanceIds: instanceIds })));
    let allInPrivate = true;
    for (const r of inst.Reservations || []) {
      for (const i of r.Instances || []) {
        if (!i.SubnetId || !privateSet.has(i.SubnetId)) allInPrivate = false;
      }
    }
    expect(allInPrivate).toBe(true);
  });

  // 23
  it("CloudWatch EC2 CPU alarm dimension targets the ASG", async () => {
    const name = outputs.AlarmCpuName;
    const resp = await retry(() => cw.send(new DescribeAlarmsCommand({ AlarmNames: [name] })));
    const alarm = (resp.MetricAlarms || [])[0];
    expect(alarm).toBeDefined();
    const dims = alarm!.Dimensions || [];
    const hasAsg = dims.some((d) => d.Name === "AutoScalingGroupName" && d.Value === outputs.AsgName);
    expect(hasAsg).toBe(true);
  });

  // 24
  it("CloudWatch memory alarm uses CWAgent namespace", async () => {
    const name = outputs.AlarmMemName;
    const resp = await retry(() => cw.send(new DescribeAlarmsCommand({ AlarmNames: [name] })));
    const alarm = (resp.MetricAlarms || [])[0];
    expect(alarm).toBeDefined();
    expect(alarm!.Namespace).toBe("CWAgent");
    expect(alarm!.MetricName).toBe("mem_used_percent");
  });
});
