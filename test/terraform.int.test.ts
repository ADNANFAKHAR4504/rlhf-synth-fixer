import * as fs from "fs";
import * as path from "path";
import { EC2Client, DescribeInstancesCommand, Instance } from "@aws-sdk/client-ec2";
import {
  S3Client,
  GetBucketVersioningCommand,
  GetBucketReplicationCommand,
  ReplicationConfiguration,
} from "@aws-sdk/client-s3";
import { IAMClient, GetRoleCommand, Role } from "@aws-sdk/client-iam";

const outputPath = path.resolve(process.cwd(), "cfn-outputs/flat-outputs.json");

let outputsRaw: Record<string, any>;
let outputs: Record<string, any>;

const isNonEmptyString = (val: any): boolean =>
  typeof val === "string" && val.trim().length > 0;
const isValidArn = (val: any): boolean =>
  typeof val === "string" && val.startsWith("arn:aws:");

beforeAll(() => {
  outputsRaw = JSON.parse(fs.readFileSync(outputPath, "utf-8"));
  outputs = {};
  for (const [key, val] of Object.entries(outputsRaw)) {
    if (
      typeof val === "string" &&
      (val.trim().startsWith("[") || val.trim().startsWith("{"))
    ) {
      try {
        outputs[key] = JSON.parse(val);
      } catch {
        outputs[key] = val;
      }
    } else {
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

  it("Primary EC2 instance exists, running, correct type with tags", async () => {
    const instanceId = outputs.primary_ec2_instance_id;
    expect(isNonEmptyString(instanceId)).toBe(true);

    const response = await ec2ClientPrimary.send(
      new DescribeInstancesCommand({ InstanceIds: [instanceId] })
    );

    const instance: Instance | undefined = response.Reservations?.[0]?.Instances?.;
    expect(instance).toBeDefined();
    expect(instance?.InstanceId).toBe(instanceId);
    expect(instance?.State?.Name).toBe("running");
    expect(instance?.InstanceType).toBe(outputs.primary_ec2_instance_type);

    const commonTags = JSON.parse(outputs.common_tags);
    const tagMap = new Map<string, string>();
    (instance?.Tags ?? []).forEach((t: { Key?: string; Value?: string }) => {
      if (t.Key && t.Value) tagMap.set(t.Key, t.Value);
    });

    for (const [key, value] of Object.entries(commonTags)) {
      expect(tagMap.get(key)).toBe(value);
    }
  });

  it("Secondary EC2 instance exists, running, correct type with tags", async () => {
    if (!outputs.secondary_ec2_instance_id) {
      return; // Skip if missing
    }

    const instanceId = outputs.secondary_ec2_instance_id;
    expect(isNonEmptyString(instanceId)).toBe(true);

    const response = await ec2ClientSecondary.send(
      new DescribeInstancesCommand({ InstanceIds: [instanceId] })
    );

    const instance: Instance | undefined = response.Reservations?.[0]?.Instances?.;
    expect(instance).toBeDefined();
    expect(instance?.InstanceId).toBe(instanceId);
    expect(instance?.State?.Name).toBe("running");
    expect(instance?.InstanceType).toBe(outputs.secondary_ec2_instance_type);

    const commonTags = JSON.parse(outputs.common_tags);
    const tagMap = new Map<string, string>();
    (instance?.Tags ?? []).forEach((t: { Key?: string; Value?: string }) => {
      if (t.Key && t.Value) tagMap.set(t.Key, t.Value);
    });

    for (const [key, value] of Object.entries(commonTags)) {
      expect(tagMap.get(key)).toBe(value);
    }
  });

  it("Primary S3 bucket versioning and replication", async () => {
    const bucketName = outputs.primary_s3_bucket_name;
    expect(isNonEmptyString(bucketName)).toBe(true);

    const versioning = await s3ClientPrimary.send(
      new GetBucketVersioningCommand({ Bucket: bucketName })
    );
    expect(versioning.Status).toBe("Enabled");

    const replication = await s3ClientPrimary.send(
      new GetBucketReplicationCommand({ Bucket: bucketName })
    );
    expect(replication.ReplicationConfiguration).toBeDefined();

    const repConfig: ReplicationConfiguration | undefined = replication.ReplicationConfiguration;
    expect(repConfig?.Rules).toBeDefined();
    expect(Array.isArray(repConfig?.Rules)).toBe(true);
    expect(repConfig?.Rules.length).toBeGreaterThan(0);
  });

  it("Secondary S3 bucket versioning and replication", async () => {
    const bucketName = outputs.secondary_s3_bucket_name;
    expect(isNonEmptyString(bucketName)).toBe(true);

    const versioning = await s3ClientSecondary.send(
      new GetBucketVersioningCommand({ Bucket: bucketName })
    );
    expect(versioning.Status).toBe("Enabled");

    const replication = await s3ClientSecondary.send(
      new GetBucketReplicationCommand({ Bucket: bucketName })
    );
    expect(replication.ReplicationConfiguration).toBeDefined();

    const repConfig: ReplicationConfiguration | undefined = replication.ReplicationConfiguration;
    expect(repConfig?.Rules).toBeDefined();
    expect(Array.isArray(repConfig?.Rules)).toBe(true);
    expect(repConfig?.Rules.length).toBeGreaterThan(0);
  });

  it("EC2 IAM Role exists and matches ARN and name", async () => {
    const roleName = outputs.ec2_iam_role_name;
    const roleArn = outputs.ec2_iam_role_arn;

    expect(isNonEmptyString(roleName)).toBe(true);
    expect(isValidArn(roleArn)).toBe(true);

    const response = await iamClient.send(new GetRoleCommand({ RoleName: roleName }));
    expect(response.Role).toBeDefined();

    const role: Role | undefined = response.Role;
    expect(role?.Arn).toBe(roleArn);
    expect(role?.RoleName).toBe(roleName);
  });

  it("S3 replication IAM Role exists and matches ARN and name", async () => {
    const roleName = outputs.s3_replication_iam_role_name;
    const roleArn = outputs.s3_replication_iam_role_arn;

    expect(isNonEmptyString(roleName)).toBe(true);
    expect(isValidArn(roleArn)).toBe(true);

    const response = await iamClient.send(new GetRoleCommand({ RoleName: roleName }));
    expect(response.Role).toBeDefined();

    const role: Role | undefined = response.Role;
    expect(role?.Arn).toBe(roleArn);
    expect(role?.RoleName).toBe(roleName);
  });
});
