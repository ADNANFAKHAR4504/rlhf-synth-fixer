// test/tap-stack.int.test.ts

import * as fs from "fs";
import * as path from "path";
import {
  EC2Client,
  DescribeInstancesCommand,
  DescribeVpcsCommand,
  DescribeSubnetsCommand,
  DescribeVolumesCommand,
} from "@aws-sdk/client-ec2";
import {
  S3Client,
  HeadBucketCommand,
  GetBucketEncryptionCommand,
  GetBucketPolicyStatusCommand,
  GetBucketAclCommand,
} from "@aws-sdk/client-s3";
import {
  LambdaClient,
  GetFunctionCommand,
} from "@aws-sdk/client-lambda";
import {
  CloudTrailClient,
  DescribeTrailsCommand,
} from "@aws-sdk/client-cloudtrail";
import {
  SecretsManagerClient,
  DescribeSecretCommand,
} from "@aws-sdk/client-secrets-manager";
import {
  RDSClient,
  DescribeDBInstancesCommand,
} from "@aws-sdk/client-rds";

// ------------------------------
// Utility functions
// ------------------------------
function readOutputs() {
  const p = path.resolve(process.cwd(), "cfn-outputs/all-outputs.json");
  if (!fs.existsSync(p)) {
    throw new Error(`Outputs file not found at ${p}`);
  }
  const raw = JSON.parse(fs.readFileSync(p, "utf8"));
  const flat: Record<string, string> = {};
  for (const stackName of Object.keys(raw)) {
    for (const out of raw[stackName]) {
      flat[out.OutputKey] = out.OutputValue;
    }
  }
  return flat;
}

async function retry<T>(fn: () => Promise<T>, attempts = 8, baseMs = 800): Promise<T> {
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

// ------------------------------
// Load outputs & AWS clients
// ------------------------------
const outputs = readOutputs();

const region = process.env.AWS_REGION || process.env.AWS_DEFAULT_REGION || "us-east-1";

const ec2 = new EC2Client({ region });
const s3 = new S3Client({ region });
const lambda = new LambdaClient({ region });
const cloudtrail = new CloudTrailClient({ region });
const secrets = new SecretsManagerClient({ region });
const rds = new RDSClient({ region });

// ------------------------------
// Test suite
// ------------------------------
describe("TapStack Integration Tests", () => {
  // ------------------------------
  // Basic outputs presence
  // ------------------------------
  test("all required outputs are present", () => {
    const required = [
      "RDS",
      "PrivateSubnet1",
      "PrivateSubnet2",
      "EC2Instance",
      "S3Bucket",
      "DBSecret",
      "VPC",
      "Lambda",
      "CloudTrail",
      "PublicSubnet1",
    ];
    for (const key of required) {
      expect(outputs[key]).toBeDefined();
      expect(typeof outputs[key]).toBe("string");
    }
  });

  // ------------------------------
  // VPC & Subnets
  // ------------------------------
  test("VPC exists and is valid", async () => {
    const vpcId = outputs["VPC"];
    const res = await ec2.send(new DescribeVpcsCommand({ VpcIds: [vpcId] }));
    expect(res.Vpcs?.[0]).toBeDefined();
    expect(res.Vpcs?.[0].VpcId).toBe(vpcId);
    expect(res.Vpcs?.[0].CidrBlock).toBe("10.0.0.0/16");
  });

  test("subnets exist in VPC", async () => {
    const vpcId = outputs["VPC"];
    const subnets = [
      outputs["PrivateSubnet1"],
      outputs["PrivateSubnet2"],
      outputs["PublicSubnet1"],
    ];
    const res = await ec2.send(new DescribeSubnetsCommand({ SubnetIds: subnets }));
    expect(res.Subnets?.length).toBe(3);
    for (const sn of res.Subnets ?? []) {
      expect(sn.VpcId).toBe(vpcId);
    }
  });

  // ------------------------------
  // EC2 Instance
  // ------------------------------
  test("EC2 instance exists and volume is encrypted", async () => {
    const instanceId = outputs["EC2Instance"];
    const res = await ec2.send(new DescribeInstancesCommand({ InstanceIds: [instanceId] }));
    const inst = res.Reservations?.[0]?.Instances?.[0];
    expect(inst).toBeDefined();
    expect(inst?.InstanceId).toBe(instanceId);
    expect(inst?.SecurityGroups?.[0].GroupName).toMatch(/-sg$/);

    // Check root volume encryption via DescribeVolumes
    const volumeId = inst?.BlockDeviceMappings?.[0].Ebs?.VolumeId;
    expect(volumeId).toBeDefined();

    const volRes = await ec2.send(new DescribeVolumesCommand({ VolumeIds: [volumeId!] }));
    const vol = volRes.Volumes?.[0];
    expect(vol).toBeDefined();
    expect(vol?.Encrypted).toBe(true);
  });

  // ------------------------------
  // S3 Bucket
  // ------------------------------
  test("S3 bucket exists and has encryption + block public access", async () => {
    const bucket = outputs["S3Bucket"];

    // Bucket exists
    await expect(retry(() => s3.send(new HeadBucketCommand({ Bucket: bucket })))).resolves.toBeTruthy();

    // SSE enabled
    const enc = await s3.send(new GetBucketEncryptionCommand({ Bucket: bucket }));
    expect(enc.ServerSideEncryptionConfiguration).toBeDefined();

    // Public access blocked
    const pol = await s3.send(new GetBucketPolicyStatusCommand({ Bucket: bucket }));
    expect(pol.PolicyStatus?.IsPublic).toBe(false);

    // CloudTrail ACL check
    const acl = await s3.send(new GetBucketAclCommand({ Bucket: bucket }));
    expect(acl.Grants).toBeDefined();
  });

  // ------------------------------
  // Lambda
  // ------------------------------
  test("Lambda function exists and has >=128MB memory", async () => {
    const fnName = outputs["Lambda"];
    const res = await lambda.send(new GetFunctionCommand({ FunctionName: fnName }));
    expect(res.Configuration?.MemorySize).toBeGreaterThanOrEqual(128);
    expect(res.Configuration?.Runtime).toMatch(/^python3/);
  });

  // ------------------------------
  // CloudTrail
  // ------------------------------
  test("CloudTrail exists and is logging to S3", async () => {
    const expectedName = outputs["CloudTrail"];
    const res = await cloudtrail.send(new DescribeTrailsCommand({}));

    expect(res.trailList?.length).toBeGreaterThan(0);

    // Match either by Name or ARN containing the expected name
    const found = res.trailList?.find(
      (t) =>
        t.Name === expectedName ||
        t.TrailARN === expectedName ||
        t.Name?.includes(expectedName) ||
        t.TrailARN?.includes(expectedName)
    );

    expect(found).toBeDefined();
    expect(found?.S3BucketName).toBe(outputs["S3Bucket"]);
  });

  // ------------------------------
  // Secrets Manager
  // ------------------------------
  test("DB Secret exists in Secrets Manager", async () => {
    const arn = outputs["DBSecret"];
    const res = await secrets.send(new DescribeSecretCommand({ SecretId: arn }));
    expect(res.ARN).toBeDefined();
    expect(res.Name).toContain("DBSecret");
  });

  // ------------------------------
  // RDS
  // ------------------------------
  test("RDS instance exists and is encrypted", async () => {
    const endpoint = outputs["RDS"];
    const identifier = endpoint.split(".")[0]; // extract DB identifier
    const res = await rds.send(new DescribeDBInstancesCommand({ DBInstanceIdentifier: identifier }));
    const db = res.DBInstances?.[0];
    expect(db).toBeDefined();
    expect(db?.StorageEncrypted).toBe(true);
    expect(db?.Engine).toBe("mysql");
    expect(db?.DBSubnetGroup?.Subnets?.length).toBeGreaterThanOrEqual(2);
  });
});
