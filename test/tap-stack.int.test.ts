import {
  EC2Client,
  DescribeVpcsCommand,
  DescribeVpcAttributeCommand,
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

  test("VPC has DNS support and hostnames enabled", async () => {
    const vpcId = outputs.VpcId;
    const dnsSupport = await ec2.send(
      new DescribeVpcAttributeCommand({ VpcId: vpcId, Attribute: "enableDnsSupport" })
    );
    expect(dnsSupport.EnableDnsSupport?.Value).toBe(true);

    const dnsHostnames = await ec2.send(
      new DescribeVpcAttributeCommand({ VpcId: vpcId, Attribute: "enableDnsHostnames" })
    );
    expect(dnsHostnames.EnableDnsHostnames?.Value).toBe(true);
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
    const resp = await ec2.send(
      new DescribeSubnetsCommand({ SubnetIds: [outputs.PublicSubnet1Id, outputs.PrivateSubnet1Id] })
    );
    const pub = resp.Subnets?.find(s => s.SubnetId === outputs.PublicSubnet1Id);
    const priv = resp.Subnets?.find(s => s.SubnetId === outputs.PrivateSubnet1Id);
    expect(pub?.MapPublicIpOnLaunch).toBe(true);
    expect(priv?.MapPublicIpOnLaunch).toBe(false);
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
  test("Bucket exists, encrypted, versioned, and has public access block", async () => {
    const bucket = outputs.BucketName;
    await expect(retry(() => s3.send(new HeadBucketCommand({ Bucket: bucket })))).resolves.toBeTruthy();

    const enc = await s3.send(new GetBucketEncryptionCommand({ Bucket: bucket }));
    expect(enc.ServerSideEncryptionConfiguration).toBeDefined();

    const ver = await s3.send(new GetBucketVersioningCommand({ Bucket: bucket }));
    expect(ver.Status).toBe("Enabled");

    const pab = await s3.send(new GetPublicAccessBlockCommand({ Bucket: bucket }));
    expect(pab.PublicAccessBlockConfiguration?.BlockPublicAcls).toBe(true);
    expect(pab.PublicAccessBlockConfiguration?.IgnorePublicAcls).toBe(true);
    expect(pab.PublicAccessBlockConfiguration?.BlockPublicPolicy).toBe(true);
    expect(pab.PublicAccessBlockConfiguration?.RestrictPublicBuckets).toBe(true);

    // Tags optional
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
  test("All outputs should be non-empty strings", () => {
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

  test("Bucket ARN matches Bucket Name", () => {
    const arn = outputs.BucketArn;
    const name = outputs.BucketName;
    expect(arn.includes(name)).toBeTruthy();
  });

  test("LaunchTemplate version is numeric", () => {
    expect(Number(outputs.LaunchTemplateLatestVersion)).toBeGreaterThan(0);
  });
});
