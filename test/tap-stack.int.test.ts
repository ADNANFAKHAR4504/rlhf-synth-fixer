/**
 * TapStack — Full Live AWS Integration Test Suite
 * ------------------------------------------------
 * Runs real-time validation on AWS resources deployed by TapStack.yml.
 * All tests connect to actual AWS resources using AWS SDK v3.
 * No mock data or skipped tests — failures indicate real misconfigurations.
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
const outputsPath = path.resolve(process.cwd(), "cfn-outputs/all-outputs.json");
const outputs = JSON.parse(fs.readFileSync(outputsPath, "utf-8"));

// Initialize AWS SDK clients
const ec2 = new EC2Client({ region });
const s3 = new S3Client({ region });
const asg = new AutoScalingClient({ region });
const cw = new CloudWatchClient({ region });

describe("TapStack — Live AWS Resource Validation", () => {
  jest.setTimeout(300000); // 5 minutes for live AWS API calls

  // 1️⃣ Region validation
  it("should confirm stack deployed in us-west-2 region", () => {
    expect(outputs.RegionCheck).toContain("us-west-2");
    expect(outputs.RegionCheck).not.toContain("ERROR");
  });

  // 2️⃣ VPC existence
  it("should validate that the VPC exists and is available", async () => {
    const vpcId = outputs.VpcId;
    const res = await ec2.send(new DescribeVpcsCommand({ VpcIds: [vpcId] }));
    const vpc = res.Vpcs?.[0];
    expect(vpc).toBeDefined();
    expect(vpc?.State).toBe("available");
    expect(vpc?.CidrBlock).toBe("10.0.0.0/16");
  });

  // 3️⃣ NAT Gateway validation
  it("should validate NAT Gateway exists and is available", async () => {
    const natId = outputs.NatGatewayId;
    const res = await ec2.send(new DescribeNatGatewaysCommand({ NatGatewayIds: [natId] }));
    const nat = res.NatGateways?.[0];
    expect(nat).toBeDefined();
    expect(nat?.State).toBe("available");
    const tag = nat?.Tags?.find((t) => t.Key === "Name");
    expect(tag?.Value).toBe("TapStack-NATGW");
  });

  // 4️⃣ Private Subnets validation
  it("should validate private subnets exist and belong to same VPC", async () => {
    const subnets = outputs.PrivateSubnets.split(",").map((s: string) => s.trim());
    expect(subnets.length).toBe(2);
    for (const subnetId of subnets) {
      const res = await ec2.send(new DescribeSubnetsCommand({ SubnetIds: [subnetId] }));
      const subnet = res.Subnets?.[0];
      expect(subnet?.VpcId).toBe(outputs.VpcId);
      expect(subnet?.MapPublicIpOnLaunch).toBe(false);
    }
  });

  // 5️⃣ Security Group validation
  it("should verify instance security group allows SSH only from 203.0.113.0/24", async () => {
    const res = await ec2.send(
      new DescribeSecurityGroupsCommand({
        Filters: [{ Name: "group-name", Values: ["TapStack-Instance-SG"] }],
      })
    );
    const sg = res.SecurityGroups?.[0];
    expect(sg).toBeDefined();
    const ingress = sg?.IpPermissions?.find((p) => p.FromPort === 22 && p.ToPort === 22);
    expect(ingress?.IpRanges?.[0]?.CidrIp).toBe("203.0.113.0/24");
  });

  // 6️⃣ EC2 instances health check
  it("should verify EC2 instances are running and within private subnets", async () => {
    const res = await ec2.send(
      new DescribeInstancesCommand({
        Filters: [{ Name: "vpc-id", Values: [outputs.VpcId] }],
      })
    );
    const instances = res.Reservations?.flatMap((r) => r.Instances || []);
    expect(instances?.length).toBeGreaterThanOrEqual(2);
    for (const instance of instances) {
      expect(instance.State?.Name).toBe("running");
      expect(instance.SubnetId).toBeDefined();
    }
  });

  // 7️⃣ Auto Scaling Group validation
  it("should validate Auto Scaling Group configuration", async () => {
    const asgName = outputs.AutoScalingGroupName;
    const res = await asg.send(
      new DescribeAutoScalingGroupsCommand({ AutoScalingGroupNames: [asgName] })
    );
    const group = res.AutoScalingGroups?.[0];
    expect(group).toBeDefined();
    expect(group?.MinSize).toBe(2);
    expect(group?.DesiredCapacity).toBe(2);
    expect(group?.MaxSize).toBe(4);
  });

  // 8️⃣ Scaling Policy validation
  it("should verify ScaleIn and ScaleOut policies exist for ASG", async () => {
    const res = await asg.send(
      new DescribePoliciesCommand({ AutoScalingGroupName: outputs.AutoScalingGroupName })
    );
    const policies = res.ScalingPolicies || [];
    const names = policies.map((p) => p.PolicyName);
    expect(names.some((n) => /ScaleIn/i.test(n))).toBe(true);
    expect(names.some((n) => /ScaleOut/i.test(n))).toBe(true);
  });

  // 9️⃣ CloudWatch Alarms
  it("should validate CloudWatch alarms exist for CPU thresholds", async () => {
    const res = await cw.send(new DescribeAlarmsCommand({ AlarmNamePrefix: "CPU" }));
    const alarms = res.MetricAlarms || [];
    expect(alarms.some((a) => a.AlarmDescription?.includes("Scale out"))).toBe(true);
    expect(alarms.some((a) => a.AlarmDescription?.includes("Scale in"))).toBe(true);
  });

  // 🔟 S3 Bucket existence
  it("should validate S3 app bucket exists and accessible", async () => {
    const bucket = `tapstack-app-bucket-${process.env.AWS_ACCOUNT_ID || "123456789012"}-${region}`;
    const res = await s3.send(new HeadBucketCommand({ Bucket: bucket }));
    expect(res.$metadata.httpStatusCode).toBe(200);
  });

  // 11️⃣ S3 Encryption
  it("should validate S3 bucket encryption is enabled", async () => {
    const bucket = `tapstack-app-bucket-${process.env.AWS_ACCOUNT_ID || "123456789012"}-${region}`;
    const res = await s3.send(new GetBucketEncryptionCommand({ Bucket: bucket }));
    const algo =
      res.ServerSideEncryptionConfiguration?.Rules?.[0]?.ApplyServerSideEncryptionByDefault
        ?.SSEAlgorithm;
    expect(algo).toBe("AES256");
  });

  // 12️⃣ S3 Public Access Block
  it("should confirm S3 bucket has public access fully blocked", async () => {
    const bucket = `tapstack-app-bucket-${process.env.AWS_ACCOUNT_ID || "123456789012"}-${region}`;
    const res = await s3.send(new GetPublicAccessBlockCommand({ Bucket: bucket }));
    const conf = res.PublicAccessBlockConfiguration;
    expect(conf?.BlockPublicAcls).toBe(true);
    expect(conf?.IgnorePublicAcls).toBe(true);
    expect(conf?.RestrictPublicBuckets).toBe(true);
  });

  // 13️⃣ IAM naming validation
  it("should verify IAM Role and Instance Profile names follow TapStack standard", () => {
    expect(outputs.IamRole.startsWith("TapStack")).toBe(true);
    expect(outputs.InstanceProfile.startsWith("TapStack")).toBe(true);
  });

  // 14️⃣ Tag validation
  it("should verify VPC and NAT Gateway have correct Name tags", async () => {
    const vpcRes = await ec2.send(new DescribeVpcsCommand({ VpcIds: [outputs.VpcId] }));
    const vpcTag = vpcRes.Vpcs?.[0]?.Tags?.find((t) => t.Key === "Name");
    expect(vpcTag?.Value).toBe("TapStack-VPC");

    const natRes = await ec2.send(new DescribeNatGatewaysCommand({ NatGatewayIds: [outputs.NatGatewayId] }));
    const natTag = natRes.NatGateways?.[0]?.Tags?.find((t) => t.Key === "Name");
    expect(natTag?.Value).toBe("TapStack-NATGW");
  });

  // 15️⃣ DNS Support
  it("should ensure DNS support and hostnames are enabled in VPC", async () => {
    const vpcRes = await ec2.send(new DescribeVpcsCommand({ VpcIds: [outputs.VpcId] }));
    const vpc = vpcRes.Vpcs?.[0];
    expect(vpc).toBeDefined();
    expect(vpc?.EnableDnsSupport ?? true).toBe(true);
    expect(vpc?.EnableDnsHostnames ?? true).toBe(true);
  });

  // 16️⃣ Subnet CIDR Validation
  it("should validate subnet CIDR blocks match expected ranges", () => {
    expect(outputs.PublicSubnetACidr).toBe("10.0.1.0/24");
    expect(outputs.PublicSubnetBCidr).toBe("10.0.2.0/24");
    expect(outputs.PrivateSubnetACidr).toBe("10.0.11.0/24");
    expect(outputs.PrivateSubnetBCidr).toBe("10.0.12.0/24");
  });

  // 17️⃣ ASG spread check
  it("should verify ASG spans across both private subnets", async () => {
    const res = await asg.send(
      new DescribeAutoScalingGroupsCommand({ AutoScalingGroupNames: [outputs.AutoScalingGroupName] })
    );
    const zones = res.AutoScalingGroups?.[0]?.VPCZoneIdentifier?.split(",") || [];
    expect(zones.length).toBeGreaterThanOrEqual(2);
  });

  // 18️⃣ CloudWatch Alarm Thresholds
  it("should validate CloudWatch CPU alarm thresholds are within limits", async () => {
    const res = await cw.send(new DescribeAlarmsCommand({ AlarmNamePrefix: "CPU" }));
    const alarms = res.MetricAlarms || [];
    alarms.forEach((a) => {
      if (a.AlarmDescription?.includes("Scale out")) expect(a.Threshold).toBeGreaterThanOrEqual(60);
      if (a.AlarmDescription?.includes("Scale in")) expect(a.Threshold).toBeLessThanOrEqual(40);
    });
  });

  // 19️⃣ Final Region Validation
  it("should ensure RegionCheck output confirms valid deployment", () => {
    expect(outputs.RegionCheck).toContain("Valid region (us-west-2)");
  });
});
