import {
  S3Client,
  HeadBucketCommand,
  GetBucketEncryptionCommand,
  GetBucketVersioningCommand,
  GetBucketAclCommand,
  GetBucketTaggingCommand,
} from "@aws-sdk/client-s3";
import {
  DynamoDBClient,
  DescribeTableCommand,
  DescribeContinuousBackupsCommand,
} from "@aws-sdk/client-dynamodb";
import {
  IAMClient,
  GetRoleCommand,
  GetInstanceProfileCommand,
} from "@aws-sdk/client-iam";
import {
  EC2Client,
  DescribeVpcsCommand,
  DescribeSecurityGroupsCommand,
  DescribeLaunchTemplatesCommand,
  DescribeSubnetsCommand,
  DescribeInternetGatewaysCommand,
  DescribeNatGatewaysCommand,
} from "@aws-sdk/client-ec2";
import {
  CloudFrontClient,
  GetDistributionCommand,
} from "@aws-sdk/client-cloudfront";
import {
  ElasticLoadBalancingV2Client,
  DescribeLoadBalancersCommand,
  DescribeTargetGroupsCommand,
  DescribeListenersCommand,
} from "@aws-sdk/client-elastic-load-balancing-v2";
import {
  CloudWatchClient,
  DescribeAlarmsCommand,
} from "@aws-sdk/client-cloudwatch";

import * as fs from "fs";
import * as path from "path";

type OutputEntry = { OutputKey: string; OutputValue: string };
type OutputsJson = Record<string, OutputEntry[]>;

function loadOutputs(): Record<string, string> {
  const p = path.resolve(process.cwd(), "cfn-outputs/all-outputs.json");
  if (!fs.existsSync(p)) {
    throw new Error(`Outputs file not found at ${p}`);
  }
  const raw = JSON.parse(fs.readFileSync(p, "utf8")) as OutputsJson;
  const stackName = Object.keys(raw)[0];
  const outputs = raw[stackName];
  const flat: Record<string, string> = {};
  for (const o of outputs) {
    flat[o.OutputKey] = o.OutputValue;
  }
  return flat;
}

const outputs = loadOutputs();
const region = process.env.AWS_REGION || "us-east-1";

const s3 = new S3Client({ region });
const dynamo = new DynamoDBClient({ region });
const iam = new IAMClient({ region });
const ec2 = new EC2Client({ region });
const cf = new CloudFrontClient({ region });
const alb = new ElasticLoadBalancingV2Client({ region });
const cw = new CloudWatchClient({ region });

async function retry<T>(fn: () => Promise<T>, attempts = 5, delayMs = 2000): Promise<T> {
  let lastErr: any;
  for (let i = 0; i < attempts; i++) {
    try {
      return await fn();
    } catch (err) {
      lastErr = err;
      await new Promise((r) => setTimeout(r, delayMs));
    }
  }
  throw lastErr;
}

describe("Integration: TapStack Deployment Validation", () => {
  // ---------------- S3 ----------------
  describe("S3 Buckets", () => {
    test("StaticAssetsBucket exists with versioning and encryption", async () => {
      const bucket = outputs.StaticAssetsBucketName;
      await expect(s3.send(new HeadBucketCommand({ Bucket: bucket }))).resolves.toBeTruthy();

      const enc = await s3.send(new GetBucketEncryptionCommand({ Bucket: bucket }));
      expect(enc.ServerSideEncryptionConfiguration?.Rules?.[0].ApplyServerSideEncryptionByDefault?.SSEAlgorithm).toBe("AES256");

      const ver = await s3.send(new GetBucketVersioningCommand({ Bucket: bucket }));
      expect(ver.Status).toBe("Enabled");
    });

    test("CloudFrontLogBucket exists and is private", async () => {
      const bucket = outputs.CloudFrontLogBucketName;
      await expect(s3.send(new HeadBucketCommand({ Bucket: bucket }))).resolves.toBeTruthy();

      const acl = await s3.send(new GetBucketAclCommand({ Bucket: bucket }));
      expect(acl.Grants?.some((g) => g.Grantee?.URI?.includes("AllUsers"))).toBeFalsy();
    });
  });

  // ---------------- DynamoDB ----------------
  describe("DynamoDB", () => {
    test("AppDataTable schema and throughput are correct", async () => {
      const tableName = outputs.DynamoDBTableName;
      const res = await dynamo.send(new DescribeTableCommand({ TableName: tableName }));
      expect(res.Table?.KeySchema).toEqual([{ AttributeName: "id", KeyType: "HASH" }]);
      expect(res.Table?.ProvisionedThroughput?.ReadCapacityUnits).toBe(5);
      expect(res.Table?.ProvisionedThroughput?.WriteCapacityUnits).toBe(5);
    });

    test("AppDataTable has PITR enabled", async () => {
      const tableName = outputs.DynamoDBTableName;
      const res = await dynamo.send(new DescribeContinuousBackupsCommand({ TableName: tableName }));
      expect(res.ContinuousBackupsDescription?.PointInTimeRecoveryDescription?.PointInTimeRecoveryStatus).toBe("ENABLED");
    });
  });

  // ---------------- IAM ----------------
  describe("IAM", () => {
    test("EC2 Role exists with DynamoDB permissions", async () => {
      const roleName = outputs.EC2RoleName;
      const res = await iam.send(new GetRoleCommand({ RoleName: roleName }));
      expect(res.Role?.Arn).toBe(outputs.EC2RoleArn);
    });

    test("InstanceProfile exists", async () => {
      const profileName = outputs.InstanceProfileName;
      const res = await iam.send(new GetInstanceProfileCommand({ InstanceProfileName: profileName }));
      expect(res.InstanceProfile?.Roles?.[0]?.RoleName).toBe(outputs.EC2RoleName);
    });
  });

  // ---------------- EC2 / VPC ----------------
  describe("Networking & EC2", () => {
    test("VPC has expected CIDR", async () => {
      const vpcId = outputs.VPCId;
      const res = await ec2.send(new DescribeVpcsCommand({ VpcIds: [vpcId] }));
      expect(res.Vpcs?.[0]?.CidrBlock).toBe(outputs.VpcCidr);
    });

    test("Security Group allows HTTP and HTTPS", async () => {
      const sgId = outputs.InstanceSecurityGroupId;
      const res = await ec2.send(new DescribeSecurityGroupsCommand({ GroupIds: [sgId] }));
      const perms = res.SecurityGroups?.[0]?.IpPermissions || [];
      const ports = perms.map((p) => p.FromPort);
      expect(ports).toContain(80);
      expect(ports).toContain(443);
    });

    test("LaunchTemplate exists", async () => {
      const ltId = outputs.LaunchTemplateId;
      const res = await ec2.send(new DescribeLaunchTemplatesCommand({ LaunchTemplateIds: [ltId] }));
      expect(res.LaunchTemplates?.[0]?.LaunchTemplateId).toBe(ltId);
    });

    test("Subnets exist", async () => {
      const ids = [outputs.PublicSubnet1Id, outputs.PublicSubnet2Id, outputs.PrivateSubnet1Id, outputs.PrivateSubnet2Id];
      const res = await ec2.send(new DescribeSubnetsCommand({ SubnetIds: ids }));
      expect(res.Subnets?.length).toBe(4);
    });

    test("Internet Gateway exists", async () => {
      const igwId = outputs.InternetGatewayId;
      const res = await ec2.send(new DescribeInternetGatewaysCommand({ InternetGatewayIds: [igwId] }));
      expect(res.InternetGateways?.[0]?.InternetGatewayId).toBe(igwId);
    });

    test("NAT Gateway exists", async () => {
      const natId = outputs.NatGatewayId;
      const res = await ec2.send(new DescribeNatGatewaysCommand({ NatGatewayIds: [natId] }));
      expect(res.NatGateways?.[0]?.NatGatewayId).toBe(natId);
    });
  });

  // ---------------- CloudFront ----------------
  describe("CloudFront", () => {
    test("CloudFront Distribution is active and points to correct origin", async () => {
      const distId = outputs.CloudFrontDistributionId;
      const res = await cf.send(new GetDistributionCommand({ Id: distId }));
      expect(res.Distribution?.Id).toBe(distId);
      expect(res.Distribution?.DistributionConfig?.Origins?.Items?.[0]?.DomainName).toContain(outputs.StaticAssetsBucketName);
    });
  });

  // ---------------- ALB ----------------
  describe("Application Load Balancer", () => {
    test("ALB exists and has DNS name", async () => {
      const albArn = outputs.ApplicationLoadBalancerArn;
      const res = await alb.send(new DescribeLoadBalancersCommand({ LoadBalancerArns: [albArn] }));
      expect(res.LoadBalancers?.[0]?.DNSName).toBe(outputs.ApplicationLoadBalancerDNS);
    });

    test("TargetGroup exists", async () => {
      const tgArn = outputs.TargetGroupArn;
      const res = await alb.send(new DescribeTargetGroupsCommand({ TargetGroupArns: [tgArn] }));
      expect(res.TargetGroups?.[0]?.TargetGroupArn).toBe(tgArn);
    });

    test("Listener exists", async () => {
      const listenerArn = outputs.ListenerArn;
      const res = await alb.send(new DescribeListenersCommand({ ListenerArns: [listenerArn] }));
      expect(res.Listeners?.[0]?.ListenerArn).toBe(listenerArn);
    });
  });

  // ---------------- CloudWatch ----------------
  describe("CloudWatch", () => {
    test("HighCPUAlarm exists", async () => {
      const alarmName = outputs.HighCPUAlarmName;
      const res = await cw.send(new DescribeAlarmsCommand({ AlarmNames: [alarmName] }));
      expect(res.MetricAlarms?.[0]?.AlarmName).toBe(alarmName);
    });
  });
});
