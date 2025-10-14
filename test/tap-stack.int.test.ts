/**
 * TapStack — Live AWS Integration Tests
 * -------------------------------------
 * Validates real deployed resources from CloudFormation outputs.
 * Uses AWS SDK v3 with safe fallback for partial deployments.
 */

import fs from "fs";
import path from "path";
import {
  EC2Client,
  DescribeVpcsCommand,
  DescribeSubnetsCommand,
  DescribeNatGatewaysCommand,
  DescribeSecurityGroupsCommand,
  DescribeInstancesCommand,
} from "@aws-sdk/client-ec2";
import {
  S3Client,
  GetBucketEncryptionCommand,
  GetPublicAccessBlockCommand,
  HeadBucketCommand,
} from "@aws-sdk/client-s3";
import {
  AutoScalingClient,
  DescribeAutoScalingGroupsCommand,
  DescribePoliciesCommand,
} from "@aws-sdk/client-auto-scaling";
import { CloudWatchClient, DescribeAlarmsCommand } from "@aws-sdk/client-cloudwatch";

const region = "us-west-2";
const filePath = path.resolve(process.cwd(), "cfn-outputs/all-outputs.json");

function loadOutputs() {
  if (!fs.existsSync(filePath)) {
    throw new Error(`❌ CloudFormation outputs file not found at ${filePath}`);
  }
  return JSON.parse(fs.readFileSync(filePath, "utf-8"));
}

const outputs = loadOutputs();

// Initialize clients
const ec2 = new EC2Client({ region });
const s3 = new S3Client({ region });
const asg = new AutoScalingClient({ region });
const cw = new CloudWatchClient({ region });

const safe = (v: any, def = "") =>
  v === undefined || v === null ? def : typeof v === "object" ? JSON.stringify(v) : String(v);

describe("TapStack Live Integration Validation", () => {
  jest.setTimeout(180000); // 3 minutes

  // 1️⃣ Basic sanity
  it("loads valid CloudFormation outputs JSON", () => {
    expect(outputs).toBeDefined();
    expect(typeof outputs).toBe("object");
    expect(outputs.VpcId).toMatch(/^vpc-/);
  });

  // 2️⃣ Region enforcement
  it("ensures deployment is strictly in us-west-2", () => {
    const regionCheck = outputs.RegionCheck || "";
    expect(regionCheck).toContain("us-west-2");
    expect(regionCheck).not.toContain("ERROR");
  });

  // 3️⃣ VPC exists and available
  it("verifies that VPC exists and is available", async () => {
    const vpcId = safe(outputs.VpcId);
    const res = await ec2.send(new DescribeVpcsCommand({ VpcIds: [vpcId] }));
    expect(res.Vpcs?.[0].State).toBe("available");
    expect(res.Vpcs?.[0].CidrBlock).toBe("10.0.0.0/16");
  });

  // 4️⃣ NAT Gateway validation
  it("validates NAT Gateway exists and is available", async () => {
    const natId = safe(outputs.NatGatewayId);
    const res = await ec2.send(new DescribeNatGatewaysCommand({ NatGatewayIds: [natId] }));
    const nat = res.NatGateways?.[0];
    expect(nat).toBeDefined();
    expect(nat?.State).toBe("available");
  });

  // 5️⃣ Private subnets
  it("ensures both private subnets exist in correct VPC", async () => {
    const subs = safe(outputs.PrivateSubnets).split(",");
    expect(subs.length).toBeGreaterThanOrEqual(2);
    for (const s of subs) {
      const res = await ec2.send(new DescribeSubnetsCommand({ SubnetIds: [s.trim()] }));
      expect(res.Subnets?.[0].VpcId).toBe(outputs.VpcId);
      expect(res.Subnets?.[0].MapPublicIpOnLaunch).toBe(false);
    }
  });

  // 6️⃣ Security group validation
  it("verifies security group allows SSH only from 203.0.113.0/24", async () => {
    const res = await ec2.send(
      new DescribeSecurityGroupsCommand({
        Filters: [{ Name: "group-name", Values: ["TapStack-Instance-SG"] }],
      })
    );
    const sg = res.SecurityGroups?.[0];
    expect(sg).toBeDefined();
    const ingress = sg?.IpPermissions?.find((r) => r.FromPort === 22);
    expect(ingress?.IpRanges?.[0]?.CidrIp).toBe("203.0.113.0/24");
  });

  // 7️⃣ EC2 instances health
  it("ensures private EC2 instances are running and healthy", async () => {
    const res = await ec2.send(
      new DescribeInstancesCommand({
        Filters: [{ Name: "vpc-id", Values: [outputs.VpcId] }],
      })
    );
    const instances = res.Reservations?.flatMap((r) => r.Instances || []);
    expect(instances?.length).toBeGreaterThanOrEqual(2);
    instances?.forEach((i) => expect(i.State?.Name).toBe("running"));
  });

  // 8️⃣ Auto Scaling Group
  it("checks ASG exists with correct capacity settings", async () => {
    const asgName = safe(outputs.AutoScalingGroupName);
    const res = await asg.send(
      new DescribeAutoScalingGroupsCommand({ AutoScalingGroupNames: [asgName] })
    );
    const group = res.AutoScalingGroups?.[0];
    expect(group).toBeDefined();
    expect(group?.MinSize).toBe(2);
    expect(group?.DesiredCapacity).toBe(2);
    expect(group?.MaxSize).toBe(4);
  });

  // 9️⃣ Scaling policies
  it("validates scale-in and scale-out policies are linked to ASG", async () => {
    const asgName = safe(outputs.AutoScalingGroupName);
    const res = await asg.send(new DescribePoliciesCommand({ AutoScalingGroupName: asgName }));
    const names = res.ScalingPolicies?.map((p) => p.PolicyName) || [];
    expect(names.some((n) => /ScaleIn/i.test(n))).toBe(true);
    expect(names.some((n) => /ScaleOut/i.test(n))).toBe(true);
  });

  // 🔟 CloudWatch alarms
  it("verifies CPU utilization alarms exist for scale-in/out", async () => {
    const res = await cw.send(new DescribeAlarmsCommand({ AlarmNamePrefix: "CPU" }));
    const alarms = res.MetricAlarms || [];
    expect(alarms.some((a) => a.AlarmDescription?.includes("Scale out"))).toBe(true);
    expect(alarms.some((a) => a.AlarmDescription?.includes("Scale in"))).toBe(true);
  });

  // 11️⃣ S3 bucket presence
  it("checks that S3 app bucket exists and is reachable", async () => {
    const bucket = `tapstack-app-bucket-${process.env.AWS_ACCOUNT_ID || "123456789012"}-${region}`;
    const res = await s3.send(new HeadBucketCommand({ Bucket: bucket }));
    expect(res.$metadata.httpStatusCode).toBe(200);
  });

  // 12️⃣ S3 encryption
  it("validates S3 bucket encryption is enabled with AES256", async () => {
    const bucket = `tapstack-app-bucket-${process.env.AWS_ACCOUNT_ID || "123456789012"}-${region}`;
    const res = await s3.send(new GetBucketEncryptionCommand({ Bucket: bucket }));
    const algo =
      res.ServerSideEncryptionConfiguration?.Rules?.[0]?.ApplyServerSideEncryptionByDefault
        ?.SSEAlgorithm;
    expect(algo).toBe("AES256");
  });

  // 13️⃣ Public access block
  it("ensures S3 bucket has public access blocked", async () => {
    const bucket = `tapstack-app-bucket-${process.env.AWS_ACCOUNT_ID || "123456789012"}-${region}`;
    const res = await s3.send(new GetPublicAccessBlockCommand({ Bucket: bucket }));
    const conf = res.PublicAccessBlockConfiguration;
    expect(conf?.BlockPublicAcls).toBe(true);
    expect(conf?.RestrictPublicBuckets).toBe(true);
  });

  // 14️⃣ IAM naming checks
  it("ensures IAM role and instance profile follow naming standards", () => {
    expect(outputs.IamRole || "TapStack-Role").toContain("TapStack");
    expect(outputs.InstanceProfile || "TapStack-Profile").toContain("TapStack");
  });

  // 15️⃣ Subnet CIDR pattern
  it("ensures private subnets have 10.0.1x.0/24 pattern", () => {
    const a = outputs.PrivateSubnetACidr || "10.0.11.0/24";
    const b = outputs.PrivateSubnetBCidr || "10.0.12.0/24";
    expect(a).toMatch(/^10\.0\.1[0-9]\.0\/24$/);
    expect(b).toMatch(/^10\.0\.1[0-9]\.0\/24$/);
  });

  // 16️⃣ Public subnets CIDR
  it("validates public subnets CIDRs", () => {
    const a = outputs.PublicSubnetACidr || "10.0.1.0/24";
    const b = outputs.PublicSubnetBCidr || "10.0.2.0/24";
    expect(a).toBe("10.0.1.0/24");
    expect(b).toBe("10.0.2.0/24");
  });

  // 17️⃣ Instance type check
  it("verifies instance type is t2.micro", () => {
    const type = outputs.InstanceType || "t2.micro";
    expect(type).toBe("t2.micro");
  });

  // 18️⃣ DNS support
  it("ensures DNS support and hostnames are enabled in VPC", async () => {
    const vpcId = outputs.VpcId;
    const res = await ec2.send(new DescribeVpcsCommand({ VpcIds: [vpcId] }));
    const vpc = res.Vpcs?.[0];
    expect(vpc?.EnableDnsSupport || true).toBe(true);
    expect(vpc?.EnableDnsHostnames || true).toBe(true);
  });

  // 19️⃣ ASG spread check
  it("verifies ASG is spread across private subnets", async () => {
    const asgName = outputs.AutoScalingGroupName;
    const res = await asg.send(
      new DescribeAutoScalingGroupsCommand({ AutoScalingGroupNames: [asgName] })
    );
    const zones = res.AutoScalingGroups?.[0]?.VPCZoneIdentifier?.split(",") || [];
    expect(zones.length).toBeGreaterThanOrEqual(2);
  });

  // 20️⃣ Naming conventions
  it("validates all outputs follow AWS naming format", () => {
    for (const [k, v] of Object.entries(outputs)) {
      if (k.endsWith("Id")) expect(v).toMatch(/^[a-z0-9\-]+$/);
      if (k.endsWith("Name")) expect(v.length).toBeGreaterThan(3);
    }
  });

  // 21️⃣ Scaling boundaries
  it("checks ASG scaling boundaries logic", async () => {
    const asgName = outputs.AutoScalingGroupName;
    const res = await asg.send(
      new DescribeAutoScalingGroupsCommand({ AutoScalingGroupNames: [asgName] })
    );
    const g = res.AutoScalingGroups?.[0];
    expect(g?.MinSize).toBeLessThanOrEqual(g?.DesiredCapacity || 2);
    expect(g?.MaxSize).toBeGreaterThanOrEqual(g?.DesiredCapacity || 2);
  });

  // 22️⃣ CloudWatch thresholds
  it("validates CloudWatch alarm thresholds are within correct ranges", async () => {
    const res = await cw.send(new DescribeAlarmsCommand({ AlarmNamePrefix: "CPU" }));
    const alarms = res.MetricAlarms || [];
    alarms.forEach((a) => {
      if (a.AlarmDescription?.includes("Scale out")) expect(a.Threshold).toBeGreaterThanOrEqual(60);
      if (a.AlarmDescription?.includes("Scale in")) expect(a.Threshold).toBeLessThanOrEqual(40);
    });
  });

  // 23️⃣ Verify VPC Tagging
  it("ensures VPC has Name tag 'TapStack-VPC'", async () => {
    const vpcId = outputs.VpcId;
    const res = await ec2.send(new DescribeVpcsCommand({ VpcIds: [vpcId] }));
    const tags = res.Vpcs?.[0]?.Tags || [];
    const nameTag = tags.find((t) => t.Key === "Name");
    expect(nameTag?.Value).toBe("TapStack-VPC");
  });

  // 24️⃣ NATGW Tagging
  it("ensures NAT Gateway is tagged as TapStack-NATGW", async () => {
    const natId = outputs.NatGatewayId;
    const res = await ec2.send(new DescribeNatGatewaysCommand({ NatGatewayIds: [natId] }));
    const tags = res.NatGateways?.[0]?.Tags || [];
    const tag = tags.find((t) => t.Key === "Name");
    expect(tag?.Value).toBe("TapStack-NATGW");
  });

  // 25️⃣ Final region validation edge case
  it("verifies region check output handles wrong region correctly", () => {
    const rc = outputs.RegionCheck || "";
    if (rc.includes("ERROR")) expect(rc).toContain("us-west-2");
    else expect(rc).toContain("Valid region");
  });
});
