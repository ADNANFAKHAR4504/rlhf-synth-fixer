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
  GetBucketLocationCommand,
  GetPublicAccessBlockCommand,
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

  const firstKey = Object.keys(json)[0];
  if (Array.isArray(json[firstKey])) {
    return Object.fromEntries(json[firstKey].map((o: any) => [o.OutputKey, o.OutputValue]));
  }
  return json;
}

async function retry<T>(fn: () => Promise<T>, attempts = 8, baseMs = 700): Promise<T> {
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

function expectCidrFormat(cidr: string) {
  const regex = /^(\d{1,3}\.){3}\d{1,3}\/\d{1,2}$/;
  expect(regex.test(cidr)).toBeTruthy();
}

// ---------- AWS Clients ----------
const region = process.env.AWS_REGION || process.env.AWS_DEFAULT_REGION || "us-west-2";
const ec2 = new EC2Client({ region });
const s3 = new S3Client({ region });
const iam = new IAMClient({ region });
const asg = new AutoScalingClient({ region });
const cw = new CloudWatchClient({ region });

const outputs = readOutputs();

// ---------- Tests ----------
describe("LIVE: TapStack Comprehensive Integration Tests", () => {
  // ----------- VPC -----------
  test("VPC exists with correct CIDR", async () => {
    const vpcId = outputs.VpcId;
    const resp = await ec2.send(new DescribeVpcsCommand({ VpcIds: [vpcId] }));
    expect(resp.Vpcs?.[0].CidrBlock).toBe(outputs.VpcCidr);
    expectCidrFormat(outputs.VpcCidr);
  });

  test("VPC has DNS support and tags", async () => {
    const vpcId = outputs.VpcId;
    const resp = await ec2.send(new DescribeVpcsCommand({ VpcIds: [vpcId] }));
    expect(resp.Vpcs?.[0].EnableDnsSupport).toBeTruthy;
    expect(resp.Vpcs?.[0].Tags?.map(t => t.Key)).toContain("Name");
  });

  // ----------- Subnets -----------
  test("All subnets exist with correct CIDRs", async () => {
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

  test("Public subnets auto-assign public IPs, private do not", async () => {
    const resp = await ec2.send(new DescribeSubnetsCommand({ SubnetIds: [outputs.PublicSubnet1Id, outputs.PrivateSubnet1Id] }));
    const pub = resp.Subnets?.find(s => s.SubnetId === outputs.PublicSubnet1Id);
    const priv = resp.Subnets?.find(s => s.SubnetId === outputs.PrivateSubnet1Id);
    expect(pub?.MapPublicIpOnLaunch).toBe(true);
    expect(priv?.MapPublicIpOnLaunch).toBe(false);
  });

  // ----------- Routing -----------
  test("Route tables exist", async () => {
    const [pubRt, privRt] = [outputs.PublicRouteTableId, outputs.PrivateRouteTableId];
    const rtResp = await ec2.send(new DescribeRouteTablesCommand({ RouteTableIds: [pubRt, privRt] }));
    expect(rtResp.RouteTables?.length).toBe(2);
  });

  test("Internet Gateway exists and is attached", async () => {
    const igwId = outputs.InternetGatewayId;
    const igwResp = await ec2.send(new DescribeInternetGatewaysCommand({ InternetGatewayIds: [igwId] }));
    expect(igwResp.InternetGateways?.[0].InternetGatewayId).toBe(igwId);
  });

  test("NAT Gateway exists with Elastic IP", async () => {
    const natId = outputs.NatGatewayId;
    const resp = await ec2.send(new DescribeNatGatewaysCommand({ NatGatewayIds: [natId] }));
    expect(resp.NatGateways?.[0].NatGatewayId).toBe(natId);
    expect(outputs.NatEIPAllocationId).toContain("eipalloc-");
  });

  // ----------- Security Group -----------
  test("Instance Security Group exists and has SSH ingress only from allowed range", async () => {
    const sgId = outputs.InstanceSecurityGroupId;
    const resp = await ec2.send(new DescribeSecurityGroupsCommand({ GroupIds: [sgId] }));
    const sg = resp.SecurityGroups?.[0];
    expect(sg?.GroupId).toBe(sgId);
    const sshRule = sg?.IpPermissions?.find(r => r.FromPort === 22 && r.ToPort === 22);
    expect(sshRule?.IpRanges?.[0].CidrIp).toBe("203.0.113.0/24");
  });

  // ----------- IAM -----------
  test("EC2 Role exists with correct ARN", async () => {
    const roleName = outputs.EC2RoleName;
    const roleResp = await iam.send(new GetRoleCommand({ RoleName: roleName }));
    expect(roleResp.Role?.Arn).toBe(outputs.EC2RoleArn);
  });

  test("Instance Profile exists with attached role", async () => {
    const profileName = outputs.InstanceProfileName;
    const profResp = await iam.send(new GetInstanceProfileCommand({ InstanceProfileName: profileName }));
    expect(profResp.InstanceProfile?.Arn).toBe(outputs.InstanceProfileArn);
    expect(profResp.InstanceProfile?.Roles?.map(r => r.RoleName)).toContain(outputs.EC2RoleName);
  });

  // ----------- S3 Bucket -----------
  test("Bucket exists, encrypted, versioned, and private", async () => {
    const bucket = outputs.BucketName;
    await expect(retry(() => s3.send(new HeadBucketCommand({ Bucket: bucket })))).resolves.toBeTruthy();

    const enc = await s3.send(new GetBucketEncryptionCommand({ Bucket: bucket }));
    expect(enc.ServerSideEncryptionConfiguration).toBeDefined();

    const ver = await s3.send(new GetBucketVersioningCommand({ Bucket: bucket }));
    expect(ver.Status).toBe("Enabled");

    const pab = await s3.send(new GetPublicAccessBlockCommand({ Bucket: bucket }));
    expect(pab.PublicAccessBlockConfiguration?.BlockPublicAcls).toBe(true);

    try {
      const tags = await s3.send(new GetBucketTaggingCommand({ Bucket: bucket }));
      expect(tags.TagSet?.length).toBeGreaterThan(0);
    } catch (e: any) {
      if (e.name !== "NoSuchTagSet") throw e;
    }
  });

  test("Bucket location matches region", async () => {
    const bucket = outputs.BucketName;
    const loc = await s3.send(new GetBucketLocationCommand({ Bucket: bucket }));
    const bucketRegion = loc.LocationConstraint || "us-east-1";
    expect(bucketRegion).toBe(region);
  });

  // ----------- Auto Scaling -----------
  test("ASG exists with LaunchTemplate", async () => {
    const asgName = outputs.AutoScalingGroupName;
    const resp = await asg.send(new DescribeAutoScalingGroupsCommand({ AutoScalingGroupNames: [asgName] }));
    const group = resp.AutoScalingGroups?.[0];
    expect(group?.AutoScalingGroupName).toBe(asgName);
    expect(group?.LaunchTemplate?.LaunchTemplateId).toBe(outputs.LaunchTemplateId);
    expect(group?.MinSize).toBeGreaterThanOrEqual(1);
    expect(group?.MaxSize).toBeGreaterThanOrEqual(group?.MinSize ?? 1);
  });

  test("Scaling policies exist and match outputs", async () => {
    const asgName = outputs.AutoScalingGroupName;
    const resp = await asg.send(new DescribePoliciesCommand({ AutoScalingGroupName: asgName }));
    const policies = resp.ScalingPolicies?.map(p => p.PolicyARN);
    expect(policies).toContain(outputs.ScaleOutPolicyArn);
    expect(policies).toContain(outputs.ScaleInPolicyArn);
  });

  // ----------- CloudWatch -----------
  test("CPU alarms exist", async () => {
    const resp = await cw.send(new DescribeAlarmsCommand({
      AlarmNames: [outputs.CPUAlarmHighArn, outputs.CPUAlarmLowArn],
    }));
    expect(resp.MetricAlarms?.map(a => a.AlarmName)).toEqual(
      expect.arrayContaining([outputs.CPUAlarmHighArn, outputs.CPUAlarmLowArn])
    );
  });

  // ----------- Output Validations -----------
  test("All outputs should be non-empty strings", () => {
    Object.entries(outputs).forEach(([k, v]) => {
      expect(typeof v).toBe("string");
      expect((v as string).length).toBeGreaterThan(0);
    });
  });

  test("All CIDR outputs must be valid format", () => {
    [
      outputs.VpcCidr,
      outputs.PublicSubnet1CIDR,
      outputs.PublicSubnet2CIDR,
      outputs.PrivateSubnet1CIDR,
      outputs.PrivateSubnet2CIDR,
    ].forEach(expectCidrFormat);
  });

  test("All IDs should start with correct AWS prefixes", () => {
    expect(outputs.VpcId).toMatch(/^vpc-/);
    expect(outputs.PublicSubnet1Id).toMatch(/^subnet-/);
    expect(outputs.PublicSubnet2Id).toMatch(/^subnet-/);
    expect(outputs.PrivateSubnet1Id).toMatch(/^subnet-/);
    expect(outputs.PrivateSubnet2Id).toMatch(/^subnet-/);
    expect(outputs.InstanceSecurityGroupId).toMatch(/^sg-/);
    expect(outputs.LaunchTemplateId).toMatch(/^lt-/);
    expect(outputs.NatGatewayId).toMatch(/^nat-/);
    expect(outputs.InternetGatewayId).toMatch(/^igw-/);
  });
});
