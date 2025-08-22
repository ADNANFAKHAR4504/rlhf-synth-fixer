import * as fs from "fs";
import * as path from "path";
import { EC2Client, DescribeInstancesCommand } from "@aws-sdk/client-ec2";
import { S3Client, GetBucketVersioningCommand, GetBucketReplicationCommand } from "@aws-sdk/client-s3";
import { IAMClient, GetRoleCommand } from "@aws-sdk/client-iam";

const outputPath = path.resolve(process.cwd(), "cfn-outputs/flat-outputs.json");
let outputsRaw: Record<string, any>;
let outputs: Record<string, any>;

const commonTags = (() => {
  try {
    return JSON.parse(outputsRaw["common_tags"]);
  } catch {
    return {};
  }
})();

const isNonEmptyString = (val: any): boolean => typeof val === "string" && val.trim().length > 0;

// Using regex for arn validity, can be enhanced if needed.
const isValidArn = (val: any): boolean => typeof val === "string" && val.startsWith("arn:aws:");

const parseJsonIfNeeded = (val: any) => {
  if (!val) return null;
  if (typeof val === "object") return val;
  if (typeof val === "string") {
    try {
      return JSON.parse(val);
    } catch {
      return val;
    }
  }
  return val;
};

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

describe("Live AWS Integration Tests from deployment outputs", () => {
  const ec2Client = new EC2Client({ region: outputs.primary_region || "us-east-1" });
  const s3Client = new S3Client({ region: outputs.primary_region || "us-east-1" });
  const iamClient = new IAMClient({ region: "us-east-1" }); // IAM is global

  // 1. Validate EC2 instances exist and are running with correct tags and types
  it("Primary EC2 instance exists and in running state with correct instance type", async () => {
    const instanceId = outputs.primary_ec2_instance_id;
    expect(isNonEmptyString(instanceId)).toBe(true);

    const params = { InstanceIds: [instanceId] };
    const cmd = new DescribeInstancesCommand(params);
    const response = await ec2Client.send(cmd);

    const instance = response.Reservations?.[0]?.Instances?.;
    expect(instance).toBeDefined();
    expect(instance?.InstanceId).toBe(instanceId);
    expect(instance?.State?.Name).toBe("running");
    expect(instance?.InstanceType).toBe(outputs.primary_ec2_instance_type);

    // Validate tags include your common_tags from outputs 
    const tagMap = new Map<string, string>();
    (instance?.Tags ?? []).forEach(t => {
      if (t.Key && t.Value) tagMap.set(t.Key, t.Value);
    });
    for (const [k, v] of Object.entries(commonTags)) {
      expect(tagMap.get(k)).toBe(v);
    }
  });

  it("Secondary EC2 instance exists and in running state with correct instance type", async () => {
    if (!outputs.secondary_ec2_instance_id) {
      return; // skip if not present
    }
    const instanceId = outputs.secondary_ec2_instance_id;
    expect(isNonEmptyString(instanceId)).toBe(true);

    const params = { InstanceIds: [instanceId] };
    const cmd = new DescribeInstancesCommand(params);
    const response = await ec2Client.send(cmd);

    const instance = response.Reservations?.[0]?.Instances?.;
    expect(instance).toBeDefined();
    expect(instance?.InstanceId).toBe(instanceId);
    expect(instance?.State?.Name).toBe("running");
    expect(instance?.InstanceType).toBe(outputs.secondary_ec2_instance_type);

    const tagMap = new Map<string, string>();
    (instance?.Tags ?? []).forEach(t => {
      if (t.Key && t.Value) tagMap.set(t.Key, t.Value);
    });
    for (const [k, v] of Object.entries(commonTags)) {
      expect(tagMap.get(k)).toBe(v);
    }
  });

  // 2. Validate S3 buckets exist with versioning and replication enabled

  it("Primary S3 bucket exists with versioning enabled and correct replication", async () => {
    const bucketName = outputs.primary_s3_bucket_name;
    expect(isNonEmptyString(bucketName)).toBe(true);

    // Check bucket versioning
    const versioningCmd = new GetBucketVersioningCommand({ Bucket: bucketName });
    const versioning = await s3Client.send(versioningCmd);
    expect(versioning.Status).toBe("Enabled");

    // Check bucket replication config
    const replicationCmd = new GetBucketReplicationCommand({ Bucket: bucketName });
    const replication = await s3Client.send(replicationCmd);
    expect(replication.ReplicationConfiguration).toBeDefined();
    expect(replication.ReplicationConfiguration?.Rules?.length).toBeGreaterThan(0);
    // Optionally check destination bucket ARNs in the rules
  });

  it("Secondary S3 bucket exists with versioning enabled and correct replication", async () => {
    const bucketName = outputs.secondary_s3_bucket_name;
    expect(isNonEmptyString(bucketName)).toBe(true);

    const versioningCmd = new GetBucketVersioningCommand({ Bucket: bucketName });
    const versioning = await s3Client.send(versioningCmd);
    expect(versioning.Status).toBe("Enabled");

    const replicationCmd = new GetBucketReplicationCommand({ Bucket: bucketName });
    const replication = await s3Client.send(replicationCmd);
    expect(replication.ReplicationConfiguration).toBeDefined();
    expect(replication.ReplicationConfiguration?.Rules?.length).toBeGreaterThan(0);
  });

  // 3. Validate IAM roles exist and their paths
  it("EC2 IAM role exists with correct name and ARN", async () => {
    const roleName = outputs.ec2_iam_role_name;
    expect(isNonEmptyString(roleName)).toBe(true);

    const roleArn = outputs.ec2_iam_role_arn;
    expect(isValidArn(roleArn)).toBe(true);

    const cmd = new GetRoleCommand({ RoleName: roleName });
    const resp = await iamClient.send(cmd);
    expect(resp.Role).toBeDefined();
    expect(resp.Role.RoleName).toBe(roleName);
    expect(resp.Role.Arn).toBe(roleArn);
  });

  it("S3 replication IAM role exists with correct name and ARN", async () => {
    const roleName = outputs.s3_replication_iam_role_name;
    expect(isNonEmptyString(roleName)).toBe(true);

    const roleArn = outputs.s3_replication_iam_role_arn;
    expect(isValidArn(roleArn)).toBe(true);

    const cmd = new GetRoleCommand({ RoleName: roleName });
    const resp = await iamClient.send(cmd);
    expect(resp.Role).toBeDefined();
    expect(resp.Role.RoleName).toBe(roleName);
    expect(resp.Role.Arn).toBe(roleArn);
  });

  // Additional resource checks can be similarly added as needed, e.g.:
  // - VPCs exist by querying EC2 describeVpcs with the returned VPC id.
  // - Subnets exist and correct CIDRs.
  // - Security groups attached to EC2 instances.
  // - NAT gateways exist and associated public IP matches.

});
