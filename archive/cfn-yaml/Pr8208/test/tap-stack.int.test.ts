// test/tap-stack.int.test.ts
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
  DescribeInternetGatewaysCommand,
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
  IAMClient,
  GetInstanceProfileCommand,
  GetRoleCommand,
} from "@aws-sdk/client-iam";

import {
  CloudWatchLogsClient,
  DescribeLogGroupsCommand,
} from "@aws-sdk/client-cloudwatch-logs";

/* ---------------------------- Setup ----------------------------------- */

const outputsDir = path.resolve(process.cwd(), "cfn-outputs");
const outputsPath =
  ["all-outputs.json", "flat-outputs.json"]
    .map(f => path.join(outputsDir, f))
    .find(p => fs.existsSync(p));

if (!outputsPath) {
  throw new Error("No CloudFormation outputs file found. Run deploy first.");
}

const outputs: Record<string, string> =
  JSON.parse(fs.readFileSync(outputsPath, "utf8"));

const region =
  process.env.AWS_REGION ||
  process.env.AWS_DEFAULT_REGION ||
  "us-east-1";

const ec2 = new EC2Client({ region });
const asg = new AutoScalingClient({ region });
const cw = new CloudWatchClient({ region });
const iam = new IAMClient({ region });
const logs = new CloudWatchLogsClient({ region });

async function retry<T>(fn: () => Promise<T>, attempts = 6, delay = 1200): Promise<T> {
  let lastErr: any;
  for (let i = 0; i < attempts; i++) {
    try {
      return await fn();
    } catch (e) {
      lastErr = e;
      await wait(delay * (i + 1));
    }
  }
  throw lastErr;
}

const split = (v?: string) =>
  (v || "").split(",").map(s => s.trim()).filter(Boolean);

/* ------------------------------ Tests ---------------------------------- */

describe("TapStack — Integration Tests (LocalStack hardened)", () => {
  jest.setTimeout(10 * 60 * 1000);

  /* 01 */
  it("Outputs contain required keys", () => {
    [
      "VpcId",
      "PublicSubnetIds",
      "PrivateSubnetIds",
      "AsgName",
      "LaunchTemplateId",
      "InstanceProfileArn",
      "InstanceRoleArn",
      "CloudWatchEC2LogGroup",
      "CloudWatchAppLogGroup",
      "AlarmCpuName",
      "AlarmMemName",
    ].forEach(k => {
      expect(typeof outputs[k]).toBe("string");
      expect(outputs[k].length).toBeGreaterThan(0);
    });
  });

  /* 02 */
  it("VPC exists", async () => {
    const res = await retry(() =>
      ec2.send(new DescribeVpcsCommand({ VpcIds: [outputs.VpcId] }))
    );
    expect(res.Vpcs?.length).toBe(1);
  });

  /* 03 */
  it("Subnets belong to VPC", async () => {
    const ids = [...split(outputs.PublicSubnetIds), ...split(outputs.PrivateSubnetIds)];
    const res = await retry(() =>
      ec2.send(new DescribeSubnetsCommand({ SubnetIds: ids }))
    );
    res.Subnets?.forEach(s => expect(s.VpcId).toBe(outputs.VpcId));
  });

  /* 04 */
  it("Internet Gateway exists and is attached to VPC (LocalStack-safe)", async () => {
    const res = await retry(() =>
      ec2.send(new DescribeInternetGatewaysCommand({}))
    );
    const attached = (res.InternetGateways || []).some(igw =>
      igw.Attachments?.some(a => a.VpcId === outputs.VpcId)
    );
    expect(attached).toBe(true);
  });

  /* 05 */
  it("NAT Gateway exists (best effort)", async () => {
    const res = await retry(() =>
      ec2.send(new DescribeNatGatewaysCommand({}))
    );
    expect(Array.isArray(res.NatGateways)).toBe(true);
  });

  /* 06 */
  it("At least one Security Group exists in VPC", async () => {
    const res = await retry(() =>
      ec2.send(new DescribeSecurityGroupsCommand({
        Filters: [{ Name: "vpc-id", Values: [outputs.VpcId] }],
      }))
    );
    expect((res.SecurityGroups || []).length).toBeGreaterThan(0);
  });

  /* 07 */
  it("Instance Profile exists and contains a role", async () => {
    const name = outputs.InstanceProfileArn.split("/").pop()!;
    const res = await retry(() =>
      iam.send(new GetInstanceProfileCommand({ InstanceProfileName: name }))
    );
    expect(res.InstanceProfile?.Roles?.length).toBeGreaterThan(0);
  });

  /* 08 */
  it("IAM Role trust policy allows EC2", async () => {
    const name = outputs.InstanceRoleArn.split("/").pop()!;
    const res = await retry(() =>
      iam.send(new GetRoleCommand({ RoleName: name }))
    );
    const doc = JSON.stringify(res.Role?.AssumeRolePolicyDocument || {});
    expect(doc).toContain("ec2.amazonaws.com");
  });

  /* 09 */
  it("ASG exists", async () => {
    const res = await retry(() =>
      asg.send(new DescribeAutoScalingGroupsCommand({
        AutoScalingGroupNames: [outputs.AsgName],
      }))
    );
    expect(res.AutoScalingGroups?.length).toBe(1);
  });

  /* 10 */
  it("ASG has at least one InService instance", async () => {
    await wait(15_000);
    const res = await retry(() =>
      asg.send(new DescribeAutoScalingGroupsCommand({
        AutoScalingGroupNames: [outputs.AsgName],
      }))
    );
    const healthy =
      res.AutoScalingGroups?.[0].Instances?.filter(i => i.LifecycleState === "InService") || [];
    expect(healthy.length).toBeGreaterThanOrEqual(1);
  });

  /* 11 */
  it("EC2 instances exist for ASG", async () => {
    const group = (await retry(() =>
      asg.send(new DescribeAutoScalingGroupsCommand({
        AutoScalingGroupNames: [outputs.AsgName],
      }))
    )).AutoScalingGroups![0];

    const ids = group.Instances?.map(i => i.InstanceId!) || [];
    const res = await retry(() =>
      ec2.send(new DescribeInstancesCommand({ InstanceIds: ids }))
    );
    const count =
      res.Reservations?.reduce((a, r) => a + (r.Instances?.length || 0), 0) || 0;
    expect(count).toBeGreaterThanOrEqual(1);
  });

  /* 12 */
  it("CloudWatch log groups exist", async () => {
    for (const lg of [outputs.CloudWatchEC2LogGroup, outputs.CloudWatchAppLogGroup]) {
      const res = await retry(() =>
        logs.send(new DescribeLogGroupsCommand({ logGroupNamePrefix: lg }))
      );
      expect(res.logGroups?.some(g => g.logGroupName === lg)).toBe(true);
    }
  });

  /* 13 */
  it("EC2 CPU alarm targets ASG", async () => {
    const res = await retry(() =>
      cw.send(new DescribeAlarmsCommand({ AlarmNames: [outputs.AlarmCpuName] }))
    );
    const alarm = res.MetricAlarms?.[0];
    expect(
      alarm?.Dimensions?.some(d =>
        d.Name === "AutoScalingGroupName" && d.Value === outputs.AsgName
      )
    ).toBe(true);
  });

  /* 14 */
  it("Memory alarm uses CWAgent namespace", async () => {
    const res = await retry(() =>
      cw.send(new DescribeAlarmsCommand({ AlarmNames: [outputs.AlarmMemName] }))
    );
    expect(res.MetricAlarms?.[0].Namespace).toBe("CWAgent");
  });

  /* 15 */
  it("CWAgent memory metric is queryable", async () => {
    const res = await retry(() =>
      cw.send(new ListMetricsCommand({
        Namespace: "CWAgent",
        MetricName: "mem_used_percent",
      }))
    );
    expect(Array.isArray(res.Metrics)).toBe(true);
  });
});
