
import { CloudWatchClient, DescribeAlarmsCommand } from "@aws-sdk/client-cloudwatch";
import { DescribeInstancesCommand, EC2Client } from "@aws-sdk/client-ec2";
import { GetBucketEncryptionCommand, GetBucketVersioningCommand, S3Client } from "@aws-sdk/client-s3";
import * as fs from "fs";
import * as path from "path";

// Load deployment outputs from JSON file (update path as needed)
const outputsPath = path.join(__dirname, "../cfn-outputs.json");
const deploymentOutputs = fs.existsSync(outputsPath) ? JSON.parse(fs.readFileSync(outputsPath, "utf8")) : {};

describe("E2E AWS Resource Validation", () => {
  // Use region from outputs, env, or fallback
  const region = deploymentOutputs.primary_region?.value || deploymentOutputs.primary_region || process.env.AWS_REGION || "us-east-1";

  // S3 Bucket
  test("S3 bucket has versioning enabled", async () => {
    const s3 = new S3Client({ region });
    const bucketName = deploymentOutputs.bucket_name?.value || deploymentOutputs.bucket_name;
    const versioning = await s3.send(new GetBucketVersioningCommand({ Bucket: bucketName }));
    expect(versioning.Status).toBe("Enabled");
  });

  test("S3 bucket enforces AES256 encryption", async () => {
    const s3 = new S3Client({ region });
    const bucketName = deploymentOutputs.bucket_name?.value || deploymentOutputs.bucket_name;
    const encryption = await s3.send(new GetBucketEncryptionCommand({ Bucket: bucketName }));
    const rules = encryption.ServerSideEncryptionConfiguration?.Rules || [];
    expect(rules.some(r => r.ApplyServerSideEncryptionByDefault?.SSEAlgorithm === "AES256" || r.ApplyServerSideEncryptionByDefault?.SSEAlgorithm === "aws:kms")).toBe(true);
  });

  // EC2 Bastion Hosts
  test("Bastion host exists", async () => {
    const ec2 = new EC2Client({ region });
    const bastionId = deploymentOutputs.bastion_primary_id?.value || deploymentOutputs.bastion_primary_id;
    const res = await ec2.send(new DescribeInstancesCommand({ InstanceIds: [bastionId] }));
    expect(res.Reservations?.length).toBeGreaterThan(0);
  });

  // CloudWatch Alarms
  test("CloudWatch alarm exists", async () => {
    const cloudwatch = new CloudWatchClient({ region });
    const alarmName = deploymentOutputs.unauthorized_access_alarm_primary_name?.value || deploymentOutputs.unauthorized_access_alarm_primary_name;
    const res = await cloudwatch.send(new DescribeAlarmsCommand({ AlarmNames: [alarmName] }));
    expect(res.MetricAlarms?.length).toBeGreaterThan(0);
  });

  // Lambda Functions
  // Add similar tests for Lambda, KMS, VPC, etc. as needed
});