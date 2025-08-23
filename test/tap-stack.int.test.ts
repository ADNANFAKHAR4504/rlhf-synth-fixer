// tap-stack.int.test.ts

import {
  S3Client,
  GetBucketEncryptionCommand,
  GetBucketTaggingCommand,
  GetPublicAccessBlockCommand,
  HeadBucketCommand,
} from "@aws-sdk/client-s3";
import {
  EC2Client,
  DescribeInstancesCommand,
  DescribeTagsCommand,
} from "@aws-sdk/client-ec2";
import {
  RDSClient,
  DescribeDBInstancesCommand,
} from "@aws-sdk/client-rds";
import {
  LambdaClient,
  GetFunctionConfigurationCommand,
} from "@aws-sdk/client-lambda";
import {
  CloudTrailClient,
  DescribeTrailsCommand,
} from "@aws-sdk/client-cloudtrail";
import * as fs from "fs";
import * as path from "path";

// Utility to read outputs from consolidated JSON file
function readFlatOutputs() {
  const p = path.resolve(process.cwd(), "cfn-outputs/all-outputs.json");
  if (!fs.existsSync(p)) {
    throw new Error(`Outputs file not found at ${p}`);
  }
  const out = JSON.parse(fs.readFileSync(p, "utf8"));
  return out;
}

// Utility for retrying AWS SDK calls
async function retry<T>(fn: () => Promise<T>, attempts = 6, baseMs = 600): Promise<T> {
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

const outputs = readFlatOutputs();
const region = process.env.AWS_REGION || process.env.AWS_DEFAULT_REGION || "us-east-1";
const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || "env";

// AWS SDK clients
const s3 = new S3Client({ region });
const ec2 = new EC2Client({ region });
const rds = new RDSClient({ region });
const lambda = new LambdaClient({ region });
const cloudtrail = new CloudTrailClient({ region });

describe("TapStack Integration Tests", () => {
  // S3 Bucket Tests
  test("S3 bucket exists and has server-side encryption enabled", async () => {
    const bucketName = outputs.S3Bucket;
    expect(bucketName).toBeDefined();
    await expect(retry(() => s3.send(new HeadBucketCommand({ Bucket: bucketName })))).resolves.toBeTruthy();

    const enc = await retry(() => s3.send(new GetBucketEncryptionCommand({ Bucket: bucketName })));
    const rules = enc.ServerSideEncryptionConfiguration?.Rules || [];
    expect(rules.some(rule =>
      rule.ApplyServerSideEncryptionByDefault?.SSEAlgorithm === "AES256"
    )).toBe(true);
  });

  test("S3 bucket blocks public access", async () => {
    const pab = await retry(() => s3.send(new GetPublicAccessBlockCommand({ Bucket: outputs.S3Bucket })));
    expect(pab.PublicAccessBlockConfiguration?.BlockPublicAcls).toBe(true);
    expect(pab.PublicAccessBlockConfiguration?.IgnorePublicAcls).toBe(true);
    expect(pab.PublicAccessBlockConfiguration?.BlockPublicPolicy).toBe(true);
    expect(pab.PublicAccessBlockConfiguration?.RestrictPublicBuckets).toBe(true);
  });

  test("S3 bucket has Environment: Production tag", async () => {
    const tags = await retry(() => s3.send(new GetBucketTaggingCommand({ Bucket: outputs.S3Bucket })));
    expect(tags.TagSet?.some(tag => tag.Key === "Environment" && tag.Value === "Production")).toBe(true);
  });

  // EC2 Instance Tests
  test("EC2 instance exists and is tagged correctly", async () => {
    const instanceId = outputs.EC2Instance;
    expect(instanceId).toMatch(/^i-/);
    const desc = await retry(() => ec2.send(new DescribeInstancesCommand({ InstanceIds: [instanceId] })));
    const instance = desc.Reservations?.[0]?.Instances?.[0];
    expect(instance).toBeDefined();
    expect(instance.Tags?.some(tag => tag.Key === "Environment" && tag.Value === "Production")).toBe(true);
    expect(instance.BlockDeviceMappings?.[0]?.Ebs?.Encrypted).toBe(true);
    expect(instance.SecurityGroups?.some(sg => sg.GroupName?.includes("sg"))).toBe(true);
  });

  test("EC2 instance is in correct subnet and VPC", async () => {
    const instanceId = outputs.EC2Instance;
    const desc = await retry(() => ec2.send(new DescribeInstancesCommand({ InstanceIds: [instanceId] })));
    const instance = desc.Reservations?.[0]?.Instances?.[0];
    expect(instance.SubnetId).toBe(outputs.PublicSubnet1);
    expect(instance.VpcId).toBe(outputs.VPC);
  });

  // RDS Instance Tests
  test("RDS instance is encrypted and not publicly accessible", async () => {
    const endpoint = outputs.RDS;
    expect(endpoint).toMatch(/\.rds\.amazonaws\.com$/);
    // Find DBInstanceIdentifier from endpoint (usually part of endpoint string)
    const dbIdMatch = endpoint.match(/^([a-zA-Z0-9\-]+)\./);
    expect(dbIdMatch).toBeTruthy();
    const dbId = dbIdMatch![1];
    const dbs = await retry(() => rds.send(new DescribeDBInstancesCommand({ DBInstanceIdentifier: dbId })));
    const instance = dbs.DBInstances?.[0];
    expect(instance.StorageEncrypted).toBe(true);
    expect(instance.PubliclyAccessible).toBe(false);
    expect(instance.DBSubnetGroup?.Subnets?.length).toBeGreaterThanOrEqual(2);
  });

  // Lambda Tests
  test("Lambda function exists and has at least 128MB memory", async () => {
    const lambdaName = outputs.Lambda;
    expect(lambdaName).toBeDefined();
    const config = await retry(() => lambda.send(new GetFunctionConfigurationCommand({ FunctionName: lambdaName })));
    expect(config.MemorySize).toBeGreaterThanOrEqual(128);
    expect(config.Tags?.Environment).toBe("Production");
  });

  // CloudTrail Tests
  test("CloudTrail is logging to encrypted S3 bucket", async () => {
    const trailName = outputs.CloudTrail;
    expect(trailName).toBeDefined();
    const trails = await retry(() => cloudtrail.send(new DescribeTrailsCommand({ trailNameList: [trailName] })));
    const trail = trails.trailList?.[0];
    expect(trail.S3BucketName).toBe(outputs.S3Bucket);
    expect(trail.LogFileValidationEnabled).toBe(true);
    expect(trail.IsMultiRegionTrail).toBe(false);
  });

  // Tagging Tests
  test("All major resources have Environment: Production tag", async () => {
    // EC2
    const instanceId = outputs.EC2Instance;
    const ec2Tags = await retry(() => ec2.send(new DescribeTagsCommand({ Filters: [{ Name: "resource-id", Values: [instanceId] }] })));
    expect(ec2Tags.Tags?.some(tag => tag.Key === "Environment" && tag.Value === "Production")).toBe(true);

    // S3
    const s3Tags = await retry(() => s3.send(new GetBucketTaggingCommand({ Bucket: outputs.S3Bucket })));
    expect(s3Tags.TagSet?.some(tag => tag.Key === "Environment" && tag.Value === "Production")).toBe(true);

    // Lambda
    const lambdaConfig = await retry(() => lambda.send(new GetFunctionConfigurationCommand({ FunctionName: outputs.Lambda })));
    expect(lambdaConfig.Tags?.Environment).toBe("Production");
  });

  // Edge Case: Missing Output Keys
  test("All required outputs are present and non-empty", () => {
    const requiredKeys = [
      "RDS",
      "PrivateSubnet1",
      "PrivateSubnet2",
      "EC2Instance",
      "S3Bucket",
      "DBSecret",
      "VPC",
      "Lambda",
      "CloudTrail",
      "PublicSubnet1"
    ];
    requiredKeys.forEach(key => {
      expect(outputs[key]).toBeDefined();
      expect(outputs[key]).not.toBe("");
      expect(outputs[key]).not.toBeNull();
    });
  });

  // Edge Case: S3 bucket name format
  test("S3 bucket name follows naming convention", () => {
    expect(outputs.S3Bucket).toMatch(/^tapstackpr\d+-secures3bucket-/);
  });

  // Edge Case: Lambda function name format
  test("Lambda function name follows naming convention", () => {
    expect(outputs.Lambda).toMatch(/^TapStackpr\d+-pr\d+-lambda$/);
  });

  // Edge Case: VPC ID format
  test("VPC ID format is valid", () => {
    expect(outputs.VPC).toMatch(/^vpc-[a-z0-9]+$/);
  });

  // Edge Case: Subnet ID format
  test("Subnet IDs are valid", () => {
    expect(outputs.PrivateSubnet1).toMatch(/^subnet-[a-z0-9]+$/);
    expect(outputs.PrivateSubnet2).toMatch(/^subnet-[a-z0-9]+$/);
    expect(outputs.PublicSubnet1).toMatch(/^subnet-[a-z0-9]+$/);
  });

  // Edge Case: DBSecret ARN format
  test("DBSecret ARN format is valid", () => {
    expect(outputs.DBSecret).toMatch(/^arn:aws:secretsmanager:[a-z\-0-9]+:\d+:secret:/);
  });
});
