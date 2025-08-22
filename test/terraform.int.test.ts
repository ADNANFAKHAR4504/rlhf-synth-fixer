import * as fs from "fs";
import * as path from "path";
import { EC2Client, DescribeInstancesCommand } from "@aws-sdk/client-ec2";
import { S3Client, GetBucketVersioningCommand, GetBucketReplicationCommand } from "@aws-sdk/client-s3";
import { IAMClient, GetRoleCommand } from "@aws-sdk/client-iam";

const outputPath = path.resolve(process.cwd(), "cfn-outputs/flat-outputs.json");

let outputsRaw: Record<string, any>;
let outputs: Record<string, any>;

// Utility functions
const isNonEmptyString = (val: any): boolean => typeof val === "string" && val.trim().length > 0;
const isValidArn = (val: any): boolean => typeof val === "string" && val.startsWith("arn:aws:");

beforeAll(() => {
  outputsRaw = JSON.parse(fs.readFileSync(outputPath, "utf-8"));
  outputs = {};
  for (const [key, val] of Object.entries(outputsRaw)) {
    try {
      if (typeof val === "string" && (val.startsWith("[") || val.startsWith("{"))) {
        outputs[key] = JSON.parse(val);
      } else {
        outputs[key] = val;
      }
    } catch {
      outputs[key] = val;
    }
  }
});

describe("Live AWS Integration Tests from Deployment Outputs", () => {
  const primaryRegion = "us-east-1";
  const secondaryRegion = "us-west-2";

  const ec2ClientPrimary = new EC2Client({ region: primaryRegion });
  const ec2ClientSecondary = new EC2Client({ region: secondaryRegion });
  const s3ClientPrimary = new S3Client({ region: primaryRegion });
  const s3ClientSecondary = new S3Client({ region: secondaryRegion });
  const iamClient = new IAMClient({ region: "us-east-1" }); // IAM is global

  // 1. EC2 Instance Checks
  it("Primary EC2 instance exists and is running with correct instance type and tags", async () => {
    const instanceId = outputs.primary_ec2_instance_id;
    expect(isNonEmptyString(instanceId)).toBe(true);

    const response = await ec2ClientPrimary.send(new DescribeInstancesCommand({ InstanceIds: [instanceId] }));
    const instance = response.Reservations?.[0]?.Instances?.;
    expect(instance).toBeDefined();
    expect(instance?.InstanceId).toEqual(instanceId);
    expect(instance?.State?.Name).toBe("running");
    expect(instance?.InstanceType).toBe(outputs.primary_ec2_instance_type);

    // Validate tags contain expected common tags
    const commonTags = JSON.parse(outputs.common_tags);
    const tagMap = new Map<string, string>();
    (instance?.Tags ?? []).forEach(t => {
      if (t.Key && t.Value) tagMap.set(t.Key, t.Value);
    });
    for (const [k, v] of Object.entries(commonTags)) {
      expect(tagMap.get(k)).toBe(v);
    }
  });

  it("Secondary EC2 instance exists and is running with correct instance type and tags", async () => {
    if (!outputs.secondary_ec2_instance_id) {
      return; // Skip if not present
    }

    const instanceId = outputs.secondary_ec2_instance_id;
    expect(isNonEmptyString(instanceId)).toBe(true);

    const response = await ec2ClientSecondary.send(new DescribeInstancesCommand({ InstanceIds: [instanceId] }));
    const instance = response.Reservations?.[0]?.Instances?.;
    expect(instance).toBeDefined();
    expect(instance?.InstanceId).toEqual(instanceId);
    expect(instance?.State?.Name).toBe("running");
    expect(instance?.InstanceType).toBe(outputs.secondary_ec2_instance_type);

    const commonTags = JSON.parse(outputs.common_tags);
    const tagMap = new Map<string, string>();
    (instance?.Tags ?? []).forEach(t => {
      if (t.Key && t.Value) tagMap.set(t.Key, t.Value);
    });
    for (const [k, v] of Object.entries(commonTags)) {
      expect(tagMap.get(k)).toBe(v);
    }
  });

  // 2. S3 Bucket Checks - Versioning and Replication
  it("Primary S3 bucket has versioning enabled and replication configuration", async () => {
    const bucketName = outputs.primary_s3_bucket_name;
    expect(isNonEmptyString(bucketName)).toBe(true);

    const versioning = await s3ClientPrimary.send(new GetBucketVersioningCommand({ Bucket: bucketName }));
    expect(versioning.Status).toBe("Enabled");

    const replication = await s3ClientPrimary.send(new GetBucketReplicationCommand({ Bucket: bucketName }));
    expect(replication.ReplicationConfiguration).toBeDefined();
    expect(replication.ReplicationConfiguration?.Rules?.length).toBeGreaterThan(0);
  });

  it("Secondary S3 bucket has versioning enabled and replication configuration", async () => {
    const bucketName = outputs.secondary_s3_bucket_name;
    expect(isNonEmptyString(bucketName)).toBe(true);

    const versioning = await s3ClientSecondary.send(new GetBucketVersioningCommand({ Bucket: bucketName }));
    expect(versioning.Status).toBe("Enabled");

    const replication = await s3ClientSecondary.send(new GetBucketReplicationCommand({ Bucket: bucketName }));
    expect(replication.ReplicationConfiguration).toBeDefined();
    expect(replication.ReplicationConfiguration?.Rules?.length).toBeGreaterThan(0);
  });

  // 3. IAM Role Checks
  it("EC2 IAM role exists and matches ARN and name", async () => {
    const roleName = outputs.ec2_iam_role_name;
    const roleArn = outputs.ec2_iam_role_arn;

    expect(isNonEmptyString(roleName)).toBe(true);
    expect(isValidArn(roleArn)).toBe(true);

    const response = await iamClient.send(new GetRoleCommand({ RoleName: roleName }));
    expect(response.Role).toBeDefined();
    expect(response.Role.Arn).toBe(roleArn);
    expect(response.Role.RoleName).toBe(roleName);
  });

  it("S3 replication IAM role exists and matches ARN and name", async () => {
    const roleName = outputs.s3_replication_iam_role_name;
    const roleArn = outputs.s3_replication_iam_role_arn;

    expect(isNonEmptyString(roleName)).toBe(true);
    expect(isValidArn(roleArn)).toBe(true);

    const response = await iamClient.send(new GetRoleCommand({ RoleName: roleName }));
    expect(response.Role).toBeDefined();
    expect(response.Role.Arn).toBe(roleArn);
    expect(response.Role.RoleName).toBe(roleName);
  });

  // Additional tests can be added for VPCs, Subnets, NAT Gateway, Security Groups, etc.   
});
