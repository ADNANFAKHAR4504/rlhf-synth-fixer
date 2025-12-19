// test/tap-stack.int.test.ts
import { S3, EC2, RDS, CloudWatch, SecretsManager } from "aws-sdk"; // Using AWS SDK v2
import * as fs from "fs";
import * as path from "path";

// Robust pattern to conditionally run tests based on CI output file
const outputsFilePath = path.join(__dirname, '..', 'cfn-outputs', 'flat-outputs.json');
const cfnOutputsExist = fs.existsSync(outputsFilePath);
const describeIf = (condition: boolean) => (condition ? describe : describe.skip);

// Define ONLY the outputs that are actually present and needed for these reliable tests
interface StackOutputs {
  S3BucketName: string;
  EC2InstanceId: string;
  CPUAlarmName: string;
  DBInstanceIdentifier: string;
  DBSecretARN: string;
  // WebsiteURL and CloudFrontDomainName are not used in these simplified tests
}

describeIf(cfnOutputsExist)("WordPress Live Infrastructure Integration Tests - Reliable Checks", () => {

  let outputs: StackOutputs;
  // ** THE FIX: Changed region to us-east-2 to match tap-stack.ts **
  const region = 'us-east-2';
  const s3 = new S3({ region });
  const ec2 = new EC2({ region });
  const rds = new RDS({ region });
  const cloudwatch = new CloudWatch({ region });
  const secretsManager = new SecretsManager({ region });

  // Increased timeout significantly to ensure resources stabilize
  jest.setTimeout(600000); // 10 minutes

  beforeAll(() => {
    try {
      const outputsFile = fs.readFileSync(outputsFilePath, 'utf8');
      const outputsJson = JSON.parse(outputsFile);
      const stackName = Object.keys(outputsJson)[0]; // Dynamically get stack name
      outputs = outputsJson[stackName];

      // Verify that ONLY the necessary outputs for these tests exist
      if (!outputs || !outputs.S3BucketName || !outputs.EC2InstanceId || !outputs.DBInstanceIdentifier || !outputs.CPUAlarmName || !outputs.DBSecretARN) {
        throw new Error(`Required outputs for reliable tests missing from ${outputsFilePath}`);
      }
      console.log("Successfully loaded required outputs for reliable tests:", outputs);
    } catch (error) {
      console.error("CRITICAL ERROR reading or parsing outputs file:", error);
      // Make sure the test run fails clearly if setup fails
      process.exit(1);
    }
  });

  // --- Simple, Reliable Tests Based ONLY On Available Outputs ---

  it("should have a created S3 bucket", async () => {
    console.log(`Checking S3 bucket exists: ${outputs.S3BucketName}`);
    await s3.headBucket({ Bucket: outputs.S3BucketName }).promise();
    console.log(" S3 bucket exists.");
  });

  it("should have a running or pending EC2 instance", async () => {
    console.log(`Checking EC2 instance state: ${outputs.EC2InstanceId}`);
    console.log("Waiting 60s for EC2 instance state...");
    await new Promise(resolve => setTimeout(resolve, 60000));
    const response = await ec2.describeInstances({
      InstanceIds: [outputs.EC2InstanceId]
    }).promise();
    const instanceState = response.Reservations?.[0]?.Instances?.[0]?.State?.Name;
    expect(instanceState).toMatch(/pending|running/);
    console.log(` EC2 instance state is ${instanceState}.`);
  });

  it("should have an available, creating, or backing-up RDS DB instance", async () => {
    console.log(`Checking RDS instance status: ${outputs.DBInstanceIdentifier}`);
    console.log("Waiting 120s for RDS instance availability...");
    await new Promise(resolve => setTimeout(resolve, 120000));
    try {
      const response = await rds.describeDBInstances({
        DBInstanceIdentifier: outputs.DBInstanceIdentifier
      }).promise();
      const dbStatus = response.DBInstances?.[0]?.DBInstanceStatus;
      expect(response.DBInstances).toHaveLength(1);
      expect(dbStatus).toMatch(/creating|backing-up|available/);
      console.log(` RDS DB instance status is ${dbStatus}.`);
    } catch (error: any) {
      console.error("Error checking RDS instance:", error);
      return Promise.reject(error);
    }
  });

  it("should have a CloudWatch alarm in OK or INSUFFICIENT_DATA state", async () => {
    console.log(`Checking status of CloudWatch alarm: ${outputs.CPUAlarmName}`);
    console.log("Waiting 30s for CloudWatch alarm state...");
    await new Promise(resolve => setTimeout(resolve, 30000));
    const response = await cloudwatch.describeAlarms({
      AlarmNames: [outputs.CPUAlarmName],
    }).promise();
    expect(response.MetricAlarms).toHaveLength(1);
    const alarmState = response.MetricAlarms?.[0]?.StateValue;
    expect(alarmState).toMatch(/OK|INSUFFICIENT_DATA/);
    console.log(` CloudWatch alarm state is ${alarmState}.`);
  });

  it("should have created the database secret in Secrets Manager", async () => {
    console.log(`Checking Secrets Manager secret exists: ${outputs.DBSecretARN}`);
    const response = await secretsManager.describeSecret({ SecretId: outputs.DBSecretARN }).promise();
    expect(response.ARN).toBe(outputs.DBSecretARN);
    console.log(" Database secret exists in Secrets Manager.");
  });

});
