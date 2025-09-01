import {
  EC2Client,
  DescribeVpcsCommand,
  DescribeSubnetsCommand,
  DescribeRouteTablesCommand,
  DescribeInternetGatewaysCommand,
  DescribeNatGatewaysCommand,
  DescribeSecurityGroupsCommand,
} from "@aws-sdk/client-ec2";
import {
  S3Client,
  HeadBucketCommand,
  GetBucketEncryptionCommand,
  GetBucketVersioningCommand,
  GetBucketTaggingCommand,
} from "@aws-sdk/client-s3";
import {
  IAMClient,
  GetRoleCommand,
  GetInstanceProfileCommand,
} from "@aws-sdk/client-iam";
import {
  AutoScalingClient,
  DescribeAutoScalingGroupsCommand,
  DescribePoliciesCommand,
} from "@aws-sdk/client-auto-scaling";
import {
  CloudWatchClient,
  DescribeAlarmsCommand,
} from "@aws-sdk/client-cloudwatch";
import * as fs from "fs";
import * as path from "path";

// ---------- Helpers ----------
function readOutputs() {
  const p = path.resolve(process.cwd(), "cfn-outputs/all-outputs.json");
  if (!fs.existsSync(p)) {
    throw new Error(`Outputs file not found at ${p}`);
  }
  const json = JSON.parse(fs.readFileSync(p, "utf8"));
  // works for both consolidated + flat structure
  return Array.isArray(json.TapStackpr2537)
    ? Object.fromEntries(json.TapStackpr2537.map((o: any) => [o.OutputKey, o.OutputValue]))
    : json;
}

function retry<T>(fn: () => Promise<T>, attempts = 6, baseMs = 600): Promise<T> {
  let lastErr: any;
  return new Promise<T>(async (resolve, reject) => {
    for (let i = 0; i < attempts; i++) {
      try {
        return resolve(await fn());
      } catch (e) {
        lastErr = e;
        const wait = baseMs * Math.pow(1.6, i) + Math.floor(Math.random() * 150);
        await new Promise((r) => setTimeout(r, wait));
      }
    }
    reject(lastErr);
  });
}

function expectCidrFormat(cidr: string) {
  const regex = /^(\d{1,3}\.){3}\d{1,3}\/\d{1,2}$/;
  expect(regex.test(cidr)).toBeTruthy();
}

// ---------- AWS Clients ----------
const region = process.env.AWS_REGION || process.env.AWS_DEFAULT_REGION || "us-east-1";
const ec2 = new EC2Client({ region });
const s3 = new S3Client({ region });
const iam = new IAMClient({ region });
const asg = new AutoScalingClient({ region });
const cw = new CloudWatchClient({ region });

const outputs = readOutputs();

// ---------- Tests ----------
describe("LIVE: TapStack Integration Tests", () => {
  // ----------- VPC -----------
  test("VPC exists with correct CIDR", async () => {
    const vpcId = outputs.VpcId;
    const resp = await ec2.send(new DescribeVpcsCommand({ VpcIds: [vpcId] }));
    expect(resp.Vpcs?.[0].CidrBlock).toBe(outputs.VpcCidr);
  });

  // ----------- Subnets -----------
  test("Public and Private Subnets exist with correct CIDRs", async () => {
    const subnets = [
      { id: outputs.PublicSubnet1Id, cidr: outputs.PublicSubnet1CIDR },
      { id: outputs.PublicSubnet2Id, cidr: outputs.PublicSubnet2CIDR },
      { id: outputs.PrivateSubnet1Id, cidr: outputs.PrivateSubnet1CIDR },
      { id: outputs.PrivateSubnet2Id, cidr: outputs.PrivateSubnet2CIDR },
    ];
    const resp = await ec2.send(new DescribeSubnetsCommand({ SubnetIds: subnets.map(s => s.id) }));
    const found = resp.Subnets?.map(s => ({ id: s.SubnetId, cidr: s.CidrBlock }));
    subnets.forEach(s => {
      const match = found?.find(f => f.id === s.id);
      expect(match?.cidr).toBe(s.cidr);
      expectCidrFormat(s.cidr);
    });
  });

  // ----------- Routing -----------
  test("Route tables and IGW exist", async () => {
    const [pubRt, privRt] = [outputs.PublicRouteTableId, outputs.PrivateRouteTableId];
    const rtResp = await ec2.send(new DescribeRouteTablesCommand({ RouteTableIds: [pubRt, privRt] }));
    expect(rtResp.RouteTables?.length).toBe(2);

    const igwId = outputs.InternetGatewayId;
    const igwResp = await ec2.send(new DescribeInternetGatewaysCommand({ InternetGatewayIds: [igwId] }));
    expect(igwResp.InternetGateways?.[0].InternetGatewayId).toBe(igwId);
  });

  test("NAT Gateway and EIP exist", async () => {
    const natId = outputs.NatGatewayId;
    const resp = await ec2.send(new DescribeNatGatewaysCommand({ NatGatewayIds: [natId] }));
    expect(resp.NatGateways?.[0].NatGatewayId).toBe(natId);
    expect(outputs.NatEIPAllocationId).toContain("eipalloc-");
  });

  // ----------- Security Group -----------
  test("Instance Security Group exists", async () => {
    const sgId = outputs.InstanceSecurityGroupId;
    const resp = await ec2.send(new DescribeSecurityGroupsCommand({ GroupIds: [sgId] }));
    expect(resp.SecurityGroups?.[0].GroupId).toBe(sgId);
  });

  // ----------- IAM -----------
  test("EC2 Role and Instance Profile exist", async () => {
    const roleName = outputs.EC2RoleName;
    const roleResp = await iam.send(new GetRoleCommand({ RoleName: roleName }));
    expect(roleResp.Role?.Arn).toBe(outputs.EC2RoleArn);

    const profileName = outputs.InstanceProfileName;
    const profResp = await iam.send(new GetInstanceProfileCommand({ InstanceProfileName: profileName }));
    expect(profResp.InstanceProfile?.Arn).toBe(outputs.InstanceProfileArn);
  });

  // ----------- S3 Bucket -----------
  test("Bucket exists, encrypted, and versioned", async () => {
    const bucket = outputs.BucketName;
    await expect(retry(() => s3.send(new HeadBucketCommand({ Bucket: bucket })))).resolves.toBeTruthy();

    const enc = await s3.send(new GetBucketEncryptionCommand({ Bucket: bucket }));
    expect(enc.ServerSideEncryptionConfiguration).toBeDefined();

    const ver = await s3.send(new GetBucketVersioningCommand({ Bucket: bucket }));
    expect(ver.Status).toBe("Enabled");

    // Tags optional, edge case check
    try {
      const tags = await s3.send(new GetBucketTaggingCommand({ Bucket: bucket }));
      expect(tags.TagSet).toBeDefined();
    } catch (e: any) {
      if (e.name !== "NoSuchTagSet") throw e;
    }
  });

  // ----------- Auto Scaling -----------
  test("ASG exists with LaunchTemplate", async () => {
    const asgName = outputs.AutoScalingGroupName;
    const resp = await asg.send(new DescribeAutoScalingGroupsCommand({ AutoScalingGroupNames: [asgName] }));
    const group = resp.AutoScalingGroups?.[0];
    expect(group?.AutoScalingGroupName).toBe(asgName);
    expect(group?.LaunchTemplate?.LaunchTemplateId).toBe(outputs.LaunchTemplateId);
  });

  test("Scaling policies exist", async () => {
    const asgName = outputs.AutoScalingGroupName;
    const resp = await asg.send(new DescribePoliciesCommand({ AutoScalingGroupName: asgName }));
    const policies = resp.ScalingPolicies?.map(p => p.PolicyARN);
    expect(policies).toContain(outputs.ScaleOutPolicyArn);
    expect(policies).toContain(outputs.ScaleInPolicyArn);
  });

  // ----------- CloudWatch -----------
  test("CPU alarms exist", async () => {
    const resp = await cw.send(new DescribeAlarmsCommand({ AlarmNames: [outputs.CPUAlarmHighArn, outputs.CPUAlarmLowArn] }));
    expect(resp.MetricAlarms?.length).toBeGreaterThanOrEqual(2);
  });

  // ----------- Edge cases -----------
  test("IDs and ARNs should be non-empty strings", () => {
    Object.entries(outputs).forEach(([k, v]) => {
      expect(typeof v).toBe("string");
      expect((v as string).length).toBeGreaterThan(0);
    });
  });

  test("CIDR blocks should be valid format", () => {
    expectCidrFormat(outputs.VpcCidr);
    expectCidrFormat(outputs.PublicSubnet1CIDR);
    expectCidrFormat(outputs.PublicSubnet2CIDR);
    expectCidrFormat(outputs.PrivateSubnet1CIDR);
    expectCidrFormat(outputs.PrivateSubnet2CIDR);
  });
});
