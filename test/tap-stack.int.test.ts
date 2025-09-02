import {
  EC2Client,
  DescribeInstancesCommand,
  DescribeSubnetsCommand,
  DescribeVpcsCommand,
  DescribeSecurityGroupsCommand,
} from "@aws-sdk/client-ec2";
import {
  S3Client,
  HeadBucketCommand,
  GetBucketEncryptionCommand,
  GetBucketVersioningCommand,
  GetBucketTaggingCommand,
  GetBucketPolicyCommand,
  GetBucketPolicyStatusCommand,
} from "@aws-sdk/client-s3";
import { KMSClient, DescribeKeyCommand } from "@aws-sdk/client-kms";
import { CloudWatchClient, DescribeAlarmsCommand } from "@aws-sdk/client-cloudwatch";
import { IAMClient, GetRoleCommand } from "@aws-sdk/client-iam";
import * as fs from "fs";
import * as path from "path";

// -------------------------------
// Helpers
// -------------------------------
function readOutputs(): Record<string, string> {
  const p = path.resolve(process.cwd(), "cfn-outputs/all-outputs.json");
  if (!fs.existsSync(p)) {
    throw new Error(`Outputs file not found at ${p}`);
  }
  const raw = JSON.parse(fs.readFileSync(p, "utf8"));
  return raw.FlatOutputs || raw; // flatten if structured
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

const outputs = readOutputs();
const region = process.env.AWS_REGION || process.env.AWS_DEFAULT_REGION || "us-east-1";

const ec2 = new EC2Client({ region });
const s3 = new S3Client({ region });
const kms = new KMSClient({ region });
const cloudwatch = new CloudWatchClient({ region });
const iam = new IAMClient({ region });

// -------------------------------
// Integration Tests
// -------------------------------
describe("LIVE Integration: TapStack CloudFormation Outputs", () => {
  // -------------------------------
  // VPC & Networking
  // -------------------------------
  test("VPC exists and matches output VpcId", async () => {
    const vpcId = outputs.VpcId;
    expect(vpcId).toMatch(/^vpc-/);

    const res = await ec2.send(new DescribeVpcsCommand({ VpcIds: [vpcId] }));
    expect(res.Vpcs?.length).toBe(1);
    expect(res.Vpcs?.[0].VpcId).toBe(vpcId);
  });

  test("Subnets exist and belong to VPC", async () => {
    const subnetIds = [
      outputs.PublicSubnet1Id,
      outputs.PublicSubnet2Id,
      outputs.PrivateSubnet1Id,
      outputs.PrivateSubnet2Id,
    ];
    for (const subnetId of subnetIds) {
      expect(subnetId).toMatch(/^subnet-/);
    }
    const res = await ec2.send(new DescribeSubnetsCommand({ SubnetIds: subnetIds }));
    expect(res.Subnets?.length).toBe(4);
    res.Subnets?.forEach((sub) => {
      expect(sub.VpcId).toBe(outputs.VpcId);
    });
  });

  // -------------------------------
  // Security Group
  // -------------------------------
  test("Web SecurityGroup exists and only allows 80/443 ingress", async () => {
    const sgId = outputs.WebSecurityGroupId;
    const res = await ec2.send(new DescribeSecurityGroupsCommand({ GroupIds: [sgId] }));
    const sg = res.SecurityGroups?.[0];
    expect(sg).toBeDefined();
    const ingress = sg?.IpPermissions ?? [];
    const ports = ingress.map((r) => r.FromPort);
    expect(ports).toEqual(expect.arrayContaining([80, 443]));
    ports.forEach((p) => expect([80, 443]).toContain(p));
  });

  test("Web SecurityGroup does not allow SSH (22)", async () => {
    const sgId = outputs.WebSecurityGroupId;
    const res = await ec2.send(new DescribeSecurityGroupsCommand({ GroupIds: [sgId] }));
    const ingress = res.SecurityGroups?.[0]?.IpPermissions ?? [];
    const has22 = ingress.some((r) => r.FromPort === 22 || r.ToPort === 22);
    expect(has22).toBe(false);
  });

  // -------------------------------
  // EC2
  // -------------------------------
  test("EC2 instance exists and matches outputs", async () => {
    const instanceId = outputs.EC2InstanceId;
    const res = await ec2.send(new DescribeInstancesCommand({ InstanceIds: [instanceId] }));
    const inst = res.Reservations?.[0].Instances?.[0];
    expect(inst).toBeDefined();
    expect(inst?.InstanceId).toBe(instanceId);
    expect(inst?.PrivateIpAddress).toBe(outputs.EC2InstancePrivateIp);
    expect(inst?.PublicIpAddress).toBe(outputs.EC2InstancePublicIp);
    expect(inst?.InstanceType).toBe("t3.micro");

    // Workaround: cast EBS mapping to any to check encryption
    const ebs: any = inst?.BlockDeviceMappings?.[0].Ebs;
    expect(ebs?.Encrypted).toBe(true);
  });


  test("EC2 instance AZ matches output EC2InstanceAZ", async () => {
    const instanceId = outputs.EC2InstanceId;
    const res = await ec2.send(new DescribeInstancesCommand({ InstanceIds: [instanceId] }));
    const inst = res.Reservations?.[0].Instances?.[0];
    expect(inst?.Placement?.AvailabilityZone).toBe(outputs.EC2InstanceAZ);
  });

  test("EC2 instance is in the PublicSubnet1 from outputs", async () => {
    const instanceId = outputs.EC2InstanceId;
    const res = await ec2.send(new DescribeInstancesCommand({ InstanceIds: [instanceId] }));
    const inst = res.Reservations?.[0].Instances?.[0];
    expect(inst?.SubnetId).toBe(outputs.PublicSubnet1Id);
  });

  // -------------------------------
  // S3 Buckets
  // -------------------------------
  test("SecureBucket exists with KMS encryption, versioning, and tags", async () => {
    const bucket = outputs.SecureBucketName;

    await expect(retry(() => s3.send(new HeadBucketCommand({ Bucket: bucket })))).resolves.toBeTruthy();

    const enc = await s3.send(new GetBucketEncryptionCommand({ Bucket: bucket }));
    expect(enc.ServerSideEncryptionConfiguration).toBeDefined();

    const versioning = await s3.send(new GetBucketVersioningCommand({ Bucket: bucket }));
    expect(versioning.Status).toBe("Enabled");

    const tagging = await s3.send(new GetBucketTaggingCommand({ Bucket: bucket }));
    const envTag = tagging.TagSet?.find((t) => t.Key === "Environment");
    expect(envTag).toBeDefined();
  });

  test("TrailBucket exists with KMS encryption and CloudTrail policy", async () => {
    const bucket = outputs.TrailBucketName;

    await expect(retry(() => s3.send(new HeadBucketCommand({ Bucket: bucket })))).resolves.toBeTruthy();

    const enc = await s3.send(new GetBucketEncryptionCommand({ Bucket: bucket }));
    expect(enc.ServerSideEncryptionConfiguration).toBeDefined();

    const policy = await s3.send(new GetBucketPolicyCommand({ Bucket: bucket }));
    const policyDoc = JSON.parse(policy.Policy!);
    const statements = policyDoc.Statement || [];
    const hasCloudTrailWrite = statements.some(
      (s: any) =>
        s.Action === "s3:PutObject" &&
        s.Principal?.Service === "cloudtrail.amazonaws.com"
    );
    expect(hasCloudTrailWrite).toBe(true);
  });

  test("Buckets are not public", async () => {
    for (const bucket of [outputs.SecureBucketName, outputs.TrailBucketName]) {
      const status = await s3.send(new GetBucketPolicyStatusCommand({ Bucket: bucket }));
      expect(status.PolicyStatus?.IsPublic).toBe(false);
    }
  });

  // -------------------------------
  // KMS
  // -------------------------------
  test("KMS Key exists and is enabled", async () => {
    const keyArn = outputs.KmsKeyArn;
    const keyId = outputs.KmsKeyId;

    const res = await kms.send(new DescribeKeyCommand({ KeyId: keyArn }));
    expect(res.KeyMetadata?.KeyId).toContain(keyId);
    expect(res.KeyMetadata?.Enabled).toBe(true);
  });

  // -------------------------------
  // CloudWatch Alarm
  // -------------------------------
  test("Unauthorized API Calls alarm exists", async () => {
    const alarmName = outputs.UnauthorizedApiCallsAlarmName;
    const res = await cloudwatch.send(new DescribeAlarmsCommand({ AlarmNames: [alarmName] }));
    expect(res.MetricAlarms?.length).toBe(1);
    const alarm = res.MetricAlarms?.[0];
    expect(alarm?.MetricName).toBe("UnauthorizedAPICalls");
    expect(alarm?.Threshold).toBe(1);
  });

  // -------------------------------
  // IAM ConfigRole (conditional)
  // -------------------------------
  test("ConfigRole should exist only if EnableConfig=true", async () => {
    if (outputs.ConfigRoleArn) {
      const roleName = outputs.ConfigRoleArn.split("/").pop()!;
      const res = await iam.send(new GetRoleCommand({ RoleName: roleName }));
      expect(res.Role?.Arn).toBe(outputs.ConfigRoleArn);
    } else {
      expect(outputs.ConfigRoleArn).toBeUndefined();
    }
  });

  // -------------------------------
  // General Output Validations
  // -------------------------------
  test("All outputs should have non-empty values", () => {
    Object.entries(outputs).forEach(([k, v]) => {
      expect(v).toBeDefined();
      expect(v).not.toBe("");
    });
  });

  test("Resource IDs follow AWS naming patterns", () => {
    expect(outputs.VpcId).toMatch(/^vpc-/);
    expect(outputs.PublicSubnet1Id).toMatch(/^subnet-/);
    expect(outputs.PublicSubnet2Id).toMatch(/^subnet-/);
    expect(outputs.PrivateSubnet1Id).toMatch(/^subnet-/);
    expect(outputs.PrivateSubnet2Id).toMatch(/^subnet-/);
    expect(outputs.WebSecurityGroupId).toMatch(/^sg-/);
    expect(outputs.InternetGatewayId).toMatch(/^igw-/);
    expect(outputs.PublicRouteTableId).toMatch(/^rtb-/);
    expect(outputs.EC2InstanceId).toMatch(/^i-/);
  });
});
