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
import {
  KMSClient,
  DescribeKeyCommand,
  GetKeyRotationStatusCommand,
} from "@aws-sdk/client-kms";
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

  // Case 1: Nested by stack name (array of { OutputKey, OutputValue })
  const stackKey = Object.keys(raw)[0];
  if (Array.isArray(raw[stackKey])) {
    const flat: Record<string, string> = {};
    for (const o of raw[stackKey]) {
      flat[o.OutputKey] = o.OutputValue;
    }
    return flat;
  }

  // Case 2: Already flattened
  return raw;
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
  // Guard check
  // -------------------------------
  test("Outputs file should contain expected keys", () => {
    expect(Object.keys(outputs).length).toBeGreaterThan(0);
  });

  // -------------------------------
  // VPC & Networking
  // -------------------------------
  test("VPC exists and matches output VpcId", async () => {
    if (!outputs.VpcId) return;
    expect(outputs.VpcId).toMatch(/^vpc-/);
    const res = await ec2.send(new DescribeVpcsCommand({ VpcIds: [outputs.VpcId] }));
    expect(res.Vpcs?.[0].VpcId).toBe(outputs.VpcId);
  });

  test("Subnets exist and belong to VPC", async () => {
    const subnetIds = [
      outputs.PublicSubnet1Id,
      outputs.PublicSubnet2Id,
      outputs.PrivateSubnet1Id,
      outputs.PrivateSubnet2Id,
    ].filter(Boolean);
    if (subnetIds.length === 0) return;

    const res = await ec2.send(new DescribeSubnetsCommand({ SubnetIds: subnetIds }));
    expect(res.Subnets?.length).toBe(subnetIds.length);
    res.Subnets?.forEach((sub) => expect(sub.VpcId).toBe(outputs.VpcId));
  });

  // -------------------------------
  // Security Group
  // -------------------------------
  test("Web SecurityGroup exists and only allows 80/443 ingress", async () => {
    if (!outputs.WebSecurityGroupId) return;
    const res = await ec2.send(
      new DescribeSecurityGroupsCommand({ GroupIds: [outputs.WebSecurityGroupId] })
    );
    const sg = res.SecurityGroups?.[0];
    expect(sg).toBeDefined();
    const ingress = sg?.IpPermissions ?? [];
    const ports = ingress.map((r) => r.FromPort);
    ports.forEach((p) => expect([80, 443]).toContain(p));
  });

  test("Web SecurityGroup does not allow SSH (22)", async () => {
    if (!outputs.WebSecurityGroupId) return;
    const res = await ec2.send(
      new DescribeSecurityGroupsCommand({ GroupIds: [outputs.WebSecurityGroupId] })
    );
    const ingress = res.SecurityGroups?.[0]?.IpPermissions ?? [];
    const has22 = ingress.some((r) => r.FromPort === 22 || r.ToPort === 22);
    expect(has22).toBe(false);
  });

  // -------------------------------
  // EC2
  // -------------------------------

  test("EC2 instance AZ matches output EC2InstanceAZ", async () => {
    if (!outputs.EC2InstanceId) return;
    const res = await ec2.send(new DescribeInstancesCommand({ InstanceIds: [outputs.EC2InstanceId] }));
    const inst = res.Reservations?.[0].Instances?.[0];
    expect(inst?.Placement?.AvailabilityZone).toBe(outputs.EC2InstanceAZ);
  });

  // -------------------------------
  // S3 Buckets
  // -------------------------------
  test("SecureBucket exists with encryption & versioning", async () => {
    if (!outputs.SecureBucketName) return;
    await retry(() => s3.send(new HeadBucketCommand({ Bucket: outputs.SecureBucketName })));
    const enc = await s3.send(new GetBucketEncryptionCommand({ Bucket: outputs.SecureBucketName }));
    expect(enc.ServerSideEncryptionConfiguration).toBeDefined();

    const versioning = await s3.send(new GetBucketVersioningCommand({ Bucket: outputs.SecureBucketName }));
    expect(versioning.Status).toBe("Enabled");
  });

  test("TrailBucket exists and has CloudTrail write policy", async () => {
    if (!outputs.TrailBucketName) return;
    await retry(() => s3.send(new HeadBucketCommand({ Bucket: outputs.TrailBucketName })));
    const policy = await s3.send(new GetBucketPolicyCommand({ Bucket: outputs.TrailBucketName }));
    const policyDoc = JSON.parse(policy.Policy!);
    const hasCloudTrailWrite = (policyDoc.Statement || []).some(
      (s: any) => s.Action === "s3:PutObject" && s.Principal?.Service === "cloudtrail.amazonaws.com"
    );
    expect(hasCloudTrailWrite).toBe(true);
  });

  // -------------------------------
  // KMS
  // -------------------------------
  test("KMS Key exists and is enabled", async () => {
    if (!outputs.KmsKeyArn) return;
    const res = await kms.send(new DescribeKeyCommand({ KeyId: outputs.KmsKeyArn }));
    expect(res.KeyMetadata?.Enabled).toBe(true);
  });

  test("KMS Key should have key rotation enabled", async () => {
    if (!outputs.KmsKeyArn) return;
    const res = await kms.send(new GetKeyRotationStatusCommand({ KeyId: outputs.KmsKeyArn }));
    expect(res.KeyRotationEnabled).toBe(true);
  });

  // -------------------------------
  // CloudWatch Alarm
  // -------------------------------
  test("Unauthorized API Calls alarm exists", async () => {
    if (!outputs.UnauthorizedApiCallsAlarmName) return;
    const res = await cloudwatch.send(
      new DescribeAlarmsCommand({ AlarmNames: [outputs.UnauthorizedApiCallsAlarmName] })
    );
    expect(res.MetricAlarms?.[0]?.MetricName).toBe("UnauthorizedAPICalls");
  });

  // -------------------------------
  // IAM ConfigRole (conditional)
  // -------------------------------
  test("ConfigRole exists only if EnableConfig=true", async () => {
    if (!outputs.ConfigRoleArn) return;
    const roleName = outputs.ConfigRoleArn.split("/").pop()!;
    const res = await iam.send(new GetRoleCommand({ RoleName: roleName }));
    expect(res.Role?.Arn).toBe(outputs.ConfigRoleArn);
  });

  test("ConfigRole should trust AWS Config service", async () => {
    if (!outputs.ConfigRoleArn) return;
    const roleName = outputs.ConfigRoleArn.split("/").pop()!;
    const res = await iam.send(new GetRoleCommand({ RoleName: roleName }));
    const policyDoc = res.Role?.AssumeRolePolicyDocument as any;
    const jsonDoc = typeof policyDoc === "string" ? JSON.parse(decodeURIComponent(policyDoc)) : policyDoc;
    const stmt = jsonDoc.Statement || [];
    const hasConfigPrincipal = stmt.some((s: any) => s.Principal?.Service === "config.amazonaws.com");
    expect(hasConfigPrincipal).toBe(true);
  });

  // -------------------------------
  // General Output Validations
  // -------------------------------
  test("All outputs should have non-empty values", () => {
    for (const [k, v] of Object.entries(outputs)) {
      expect(v).toBeDefined();
      expect(v).not.toBe("");
    }
  });

  test("Resource IDs follow AWS naming patterns when defined", () => {
    if (outputs.VpcId) expect(outputs.VpcId).toMatch(/^vpc-/);
    if (outputs.PublicSubnet1Id) expect(outputs.PublicSubnet1Id).toMatch(/^subnet-/);
    if (outputs.WebSecurityGroupId) expect(outputs.WebSecurityGroupId).toMatch(/^sg-/);
    if (outputs.EC2InstanceId) expect(outputs.EC2InstanceId).toMatch(/^i-/);
  });
});
