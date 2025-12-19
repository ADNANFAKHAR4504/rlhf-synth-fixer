import * as fs from "fs";
import * as path from "path";
import {
  S3Client,
  HeadBucketCommand,
  GetBucketVersioningCommand,
  GetBucketPolicyCommand,
} from "@aws-sdk/client-s3";
import {
  RDSClient,
  DescribeDBInstancesCommand,
  DescribeDBSubnetGroupsCommand,
} from "@aws-sdk/client-rds";
import {
  EC2Client,
  DescribeVpcsCommand,
  DescribeInstancesCommand,
  DescribeSubnetsCommand,
  DescribeSecurityGroupsCommand,
  DescribeNatGatewaysCommand,
  DescribeTagsCommand,
} from "@aws-sdk/client-ec2";
import {
  ElasticLoadBalancingV2Client,
  DescribeLoadBalancersCommand,
  DescribeListenersCommand,
  DescribeTargetGroupsCommand,
} from "@aws-sdk/client-elastic-load-balancing-v2";
import {
  AutoScalingClient,
  DescribeAutoScalingGroupsCommand,
} from "@aws-sdk/client-auto-scaling";
import {
  IAMClient,
  GetRoleCommand,
  ListRolePoliciesCommand,
} from "@aws-sdk/client-iam";
import { CloudTrailClient, DescribeTrailsCommand } from "@aws-sdk/client-cloudtrail";

/**
 * Load outputs from cfn-outputs/all-outputs.json
 */
type OutputEntry = { OutputKey: string; OutputValue: string };
type OutputsFile = Record<string, OutputEntry[]>;

function readOutputs(): Record<string, string> {
  const p = path.resolve(process.cwd(), "cfn-outputs/all-outputs.json");
  if (!fs.existsSync(p)) throw new Error(`Outputs file not found at ${p}`);
  const raw = JSON.parse(fs.readFileSync(p, "utf8")) as OutputsFile;
  const firstStack = Object.values(raw)[0];
  if (!Array.isArray(firstStack)) throw new Error("Unexpected outputs structure");

  const flat: Record<string, string> = {};
  for (const o of firstStack) flat[o.OutputKey] = o.OutputValue;
  return flat;
}

const outputs = readOutputs();

const region = process.env.AWS_REGION || "us-east-1";

const s3 = new S3Client({ region });
const rds = new RDSClient({ region });
const ec2 = new EC2Client({ region });
const elbv2 = new ElasticLoadBalancingV2Client({ region });
const autoscaling = new AutoScalingClient({ region });
const iam = new IAMClient({ region });
const cloudtrail = new CloudTrailClient({ region });

/**
 * Validators
 */
const isArn = (v: string) => /^arn:aws:[a-z0-9-]+:[a-z0-9-]*:\d{12}:.+/i.test(v);
const isSubnetId = (v: string) => /^subnet-[a-z0-9]+$/i.test(v);
const isSgId = (v: string) => /^sg-[a-z0-9]+$/i.test(v);
const isVpcId = (v: string) => /^vpc-[a-z0-9]+$/i.test(v);
const isEc2InstanceId = (v: string) => /^i-[a-z0-9]+$/i.test(v);
const isLaunchTemplateId = (v: string) => /^lt-[a-z0-9]+$/i.test(v);
const isNatId = (v: string) => /^nat-[a-z0-9]+$/i.test(v);
const isDnsName = (v: string) =>
  /^[A-Za-z0-9-]+\.[A-Za-z0-9-]+\.(elb|rds)\.[a-z0-9-]+\.amazonaws\.com$/.test(v);
const isIp = (v: string) =>
  /^(25[0-5]|2[0-4]\d|1\d{2}|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d{2}|[1-9]?\d)){3}$/.test(
    v
  );

describe("LIVE Integration Tests - TapStack", () => {
  // -------- VPC --------
  test("VPC exists in AWS", async () => {
    expect(isVpcId(outputs.VpcId)).toBe(true);
    const resp = await ec2.send(new DescribeVpcsCommand({ VpcIds: [outputs.VpcId] }));
    expect(resp.Vpcs?.[0]).toBeDefined();
  });

  // -------- Subnets --------
  test("Subnets exist and are unique", async () => {
    const subnets = [
      outputs.PublicSubnet1Id,
      outputs.PublicSubnet2Id,
      outputs.PrivateSubnet1Id,
      outputs.PrivateSubnet2Id,
    ];
    subnets.forEach((s) => expect(isSubnetId(s)).toBe(true));
    expect(new Set(subnets).size).toBe(subnets.length);

    const resp = await ec2.send(new DescribeSubnetsCommand({ SubnetIds: subnets }));
    expect(resp.Subnets?.length).toBe(4);
  });

  // -------- Security Groups --------
  test("Security Groups exist (deduplicated)", async () => {
    const sgs = Array.from(
      new Set([
        outputs.BastionSGId,
        outputs.InstanceSGId,
        outputs.ALBSGId,
        outputs.RDSInstanceSG,
      ])
    );
    sgs.forEach((s) => expect(isSgId(s)).toBe(true));

    const resp = await ec2.send(new DescribeSecurityGroupsCommand({ GroupIds: sgs }));
    expect(resp.SecurityGroups?.length).toBe(sgs.length);
  });

  // -------- Bastion Host --------
  test("Bastion Host EC2 instance exists", async () => {
    expect(isEc2InstanceId(outputs.BastionHostId)).toBe(true);
    const resp = await ec2.send(
      new DescribeInstancesCommand({ InstanceIds: [outputs.BastionHostId] })
    );
    expect(resp.Reservations?.[0]?.Instances?.[0]).toBeDefined();
  });

  // -------- ALB --------
  test("ALB Listener exists", async () => {
    expect(isArn(outputs.ALBListenerArn)).toBe(true);
    const resp = await elbv2.send(
      new DescribeListenersCommand({ ListenerArns: [outputs.ALBListenerArn] })
    );
    expect(resp.Listeners?.[0]).toBeDefined();
  });

  test("ALB Target Group exists", async () => {
    expect(isArn(outputs.ALBTargetGroupArn)).toBe(true);
    const resp = await elbv2.send(
      new DescribeTargetGroupsCommand({ TargetGroupArns: [outputs.ALBTargetGroupArn] })
    );
    expect(resp.TargetGroups?.[0]).toBeDefined();
  });

  // -------- Auto Scaling --------
  test("AutoScaling Group exists and capacities are valid", async () => {
    const resp = await autoscaling.send(
      new DescribeAutoScalingGroupsCommand({
        AutoScalingGroupNames: [outputs.AutoScalingGroupName],
      })
    );
    const asg = resp.AutoScalingGroups?.[0];
    expect(asg).toBeDefined();
    if (!asg) throw new Error("AutoScalingGroup not found");

    const min = asg.MinSize ?? 0;
    const desired = asg.DesiredCapacity ?? 0;
    const max = asg.MaxSize ?? 0;

    expect(min).toBeGreaterThan(0);
    expect(desired).toBeGreaterThanOrEqual(min);
    expect(max).toBeGreaterThanOrEqual(desired);
  });

  // -------- RDS --------
  test("RDS Instance exists and port matches outputs", async () => {
    const resp = await rds.send(
      new DescribeDBInstancesCommand({ DBInstanceIdentifier: outputs.RDSInstanceId })
    );
    const db = resp.DBInstances?.[0];
    expect(db).toBeDefined();
    if (!db) throw new Error("RDS Instance not found");

    expect(db.Endpoint?.Address).toBe(outputs.RDSEndpoint);
    expect(db.Endpoint?.Port?.toString()).toBe(outputs.RDSPort);
  });

  test("RDS SubnetGroup exists", async () => {
    const resp = await rds.send(
      new DescribeDBSubnetGroupsCommand({ DBSubnetGroupName: outputs.RDSSubnetGroup })
    );
    expect(resp.DBSubnetGroups?.[0]).toBeDefined();
  });

  // -------- S3 --------
  test("Logging bucket exists and is versioned", async () => {
    const bucket = outputs.LoggingBucketName;
    await s3.send(new HeadBucketCommand({ Bucket: bucket }));

    const ver = await s3.send(new GetBucketVersioningCommand({ Bucket: bucket }));
    expect(ver.Status).toBe("Enabled");
  });

  test("Logging bucket has a policy attached", async () => {
    const bucket = outputs.LoggingBucketName;
    const resp = await s3.send(new GetBucketPolicyCommand({ Bucket: bucket }));
    expect(resp.Policy).toBeDefined();
  });

  // -------- IAM --------
  test("IAM ConfigRole exists and has inline policies", async () => {
    const roleName = outputs.ConfigRoleArn.split("/").pop();
    expect(roleName).toBeDefined();

    const resp = await iam.send(new GetRoleCommand({ RoleName: roleName! }));
    expect(resp.Role).toBeDefined();

    const pol = await iam.send(new ListRolePoliciesCommand({ RoleName: roleName! }));
    expect(pol.PolicyNames?.length).toBeGreaterThan(0);
  });

  // -------- NAT --------
  test("NAT Gateway exists and has correct EIP", async () => {
    expect(isNatId(outputs.NatGatewayId)).toBe(true);
    expect(isIp(outputs.NatEIP)).toBe(true);

    const resp = await ec2.send(
      new DescribeNatGatewaysCommand({ NatGatewayIds: [outputs.NatGatewayId] })
    );
    const gw = resp.NatGateways?.[0];
    expect(gw).toBeDefined();
    expect(gw?.NatGatewayAddresses?.[0]?.PublicIp).toBe(outputs.NatEIP);
  });

  // -------- Bastion Tags --------
  test("Bastion Host has Name tag", async () => {
    const resp = await ec2.send(new DescribeTagsCommand({ Filters: [{ Name: "resource-id", Values: [outputs.BastionHostId] }] }));
    const tags = resp.Tags || [];
    const nameTag = tags.find((t) => t.Key === "Name");
    expect(nameTag?.Value).toMatch(/bastion/);
  });

  // -------- General --------
  test("All outputs are non-empty strings", () => {
    Object.entries(outputs).forEach(([k, v]) => {
      expect(typeof v).toBe("string");
      expect(v.trim().length).toBeGreaterThan(0);
    });
  });

  test("All ARNs belong to the same account", () => {
    const arns = Object.entries(outputs)
      .filter(([k]) => k.toLowerCase().includes("arn"))
      .map(([, v]) => v);
    const accountIds = arns
      .map((arn) => {
        const parts = arn.split(":");
        return parts.length > 4 ? parts[4] : null;
      })
      .filter(Boolean);
    const unique = new Set(accountIds);
    if (unique.size > 0) {
      expect(unique.size).toBe(1);
    }
  });
});
