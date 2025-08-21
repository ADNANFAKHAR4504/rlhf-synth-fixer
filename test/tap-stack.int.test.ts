import { CloudWatchClient, DescribeAlarmsCommand } from "@aws-sdk/client-cloudwatch";
import { DescribeInstancesCommand, EC2Client } from "@aws-sdk/client-ec2";
import { GetBucketEncryptionCommand, GetBucketVersioningCommand, S3Client } from "@aws-sdk/client-s3";
import * as fs from "fs";
import * as path from "path";

// Output loading logic: prefer all-outputs.json, fallback to cfn-outputs.json
const allOutputsPath = path.resolve(process.cwd(), "cfn-outputs/all-outputs.json");
const flatPath = path.resolve(process.cwd(), "cfn-outputs.json");
let deploymentOutputs: Record<string, any> = {};
let outputFormat: "flat" | "all" = "flat";

if (fs.existsSync(allOutputsPath)) {
  deploymentOutputs = JSON.parse(fs.readFileSync(allOutputsPath, "utf8"));
  outputFormat = "all";
} else if (fs.existsSync(flatPath)) {
  deploymentOutputs = JSON.parse(fs.readFileSync(flatPath, "utf8"));
  outputFormat = "flat";
} else {
  throw new Error("No outputs file found at cfn-outputs/all-outputs.json or cfn-outputs.json.");
}

// Helper to get output value regardless of format
function getOutput(key: string): any {
  if (!deploymentOutputs[key]) return undefined;
  if (outputFormat === "flat") return deploymentOutputs[key];
  if (outputFormat === "all") return deploymentOutputs[key].value ?? deploymentOutputs[key];
  return undefined;
}

// Derive region from outputs, environment, or fallback
const region =
  getOutput("primary_region") ||
  getOutput("bucket_region") ||
  process.env.AWS_REGION ||
  process.env.AWS_DEFAULT_REGION ||
  "us-east-1";

// Output keys
const bucketName = getOutput("bucket_name");
const bastionId = getOutput("bastion_primary_id");
const alarmName = getOutput("unauthorized_access_alarm_primary_name");

// Begin tests
describe("E2E AWS Resource Validation", () => {
  test("S3 bucket has versioning enabled", async () => {
    expect(bucketName).toBeDefined();
    const s3 = new S3Client({ region });
    const versioning = await s3.send(new GetBucketVersioningCommand({ Bucket: bucketName }));
    expect(versioning.Status).toBe("Enabled");
  });

  test("S3 bucket enforces AES256 encryption", async () => {
    expect(bucketName).toBeDefined();
    const s3 = new S3Client({ region });
    const encryption = await s3.send(new GetBucketEncryptionCommand({ Bucket: bucketName }));
    const rules = encryption.ServerSideEncryptionConfiguration?.Rules || [];
    expect(
      rules.some(
        r =>
          r.ApplyServerSideEncryptionByDefault?.SSEAlgorithm === "AES256" ||
          r.ApplyServerSideEncryptionByDefault?.SSEAlgorithm === "aws:kms"
      )
    ).toBe(true);
  });

  test("Bastion host exists", async () => {
    expect(bastionId).toBeDefined();
    const ec2 = new EC2Client({ region });
    let res;
    try {
      res = await ec2.send(new DescribeInstancesCommand({ InstanceIds: [bastionId] }));
    } catch (err: any) {
      throw new Error(`Bastion instance check failed: ${err.message}`);
    }
    expect(res.Reservations?.length).toBeGreaterThan(0);
  });

  test("CloudWatch alarm exists", async () => {
    expect(alarmName).toBeDefined();
    const cloudwatch = new CloudWatchClient({ region });
    const res = await cloudwatch.send(new DescribeAlarmsCommand({ AlarmNames: [alarmName] }));
    expect(res.MetricAlarms?.length).toBeGreaterThan(0);
  });
});
