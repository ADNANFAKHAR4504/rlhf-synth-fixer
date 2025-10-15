import { S3, EC2, RDS, CloudWatch, SSM } from "aws-sdk";
import axios from "axios";
import * as fs from "fs";
import * as path from "path";
import { v4 as uuidv4 } from 'uuid';

jest.setTimeout(480000); // 8-minute timeout for all tests

interface StackOutputs {
  WebsiteURL: { value: string };
  S3BucketName: { value: string };
  CloudFrontDomainName: { value: string };
  EC2InstanceId: { value: string };
  CPUAlarmName: { value: string };
}

const getStackOutputs = (): StackOutputs | null => {
  try {
    const outputPath = path.join(__dirname, "../cdktf.out/stacks/WordpressStack/outputs.json");
    if (fs.existsSync(outputPath)) {
      const outputs = JSON.parse(fs.readFileSync(outputPath, "utf8"));
      if (outputs.WebsiteURL && outputs.S3BucketName && outputs.CloudFrontDomainName && outputs.EC2InstanceId && outputs.CPUAlarmName) {
        return outputs;
      }
    }
    return null;
  } catch (error) {
    console.warn("Could not read CDKTF output file.", error);
    return null;
  }
};

const outputs = getStackOutputs();

if (outputs) {
  describe("WordPress Live Infrastructure Integration Tests", () => {

    const region = 'us-west-2';
    const s3 = new S3({ region });
    const cloudwatch = new CloudWatch({ region });
    const ssm = new SSM({ region });
    const ec2InstanceId = outputs.EC2InstanceId.value;

    it("should have a reachable WordPress website URL", async () => {
      console.log(`Testing website URL: ${outputs.WebsiteURL.value}`);
      const response = await axios.get(outputs.WebsiteURL.value, { timeout: 60000 });
      expect(response.status).toBe(200);
      console.log(" Website is online.");
    });

    it("should have a working S3 to CloudFront media pipeline", async () => {
      const bucketName = outputs.S3BucketName.value;
      const cloudfrontDomain = outputs.CloudFrontDomainName.value;
      const testFileName = `test-image-${uuidv4()}.txt`;
      const testFileContent = 'Hello, CloudFront!';

      console.log(`Testing S3-CloudFront pipeline for bucket: ${bucketName}`);

      await s3.putObject({
        Bucket: bucketName,
        Key: testFileName,
        Body: testFileContent,
        ContentType: 'text/plain',
      }).promise();

      // Wait a moment for CloudFront to see the new object
      await new Promise(resolve => setTimeout(resolve, 15000));

      const cloudfrontUrl = `https://${cloudfrontDomain}/${testFileName}`;
      const response = await axios.get(cloudfrontUrl, { timeout: 30000 });

      expect(response.status).toBe(200);
      expect(response.data).toBe(testFileContent);
      console.log(" S3-CloudFront pipeline is working correctly.");

      await s3.deleteObject({
        Bucket: bucketName,
        Key: testFileName,
      }).promise();
    });

    // New Test: Verify EC2 to RDS connectivity by checking wp-config.php
    it("should demonstrate EC2 to RDS connectivity", async () => {
      console.log(`Checking for successful DB connection on instance ${ec2InstanceId}`);
      // This test uses AWS SSM to run a command on the EC2 instance.
      // It checks if WordPress could establish a database connection, which is logged during setup.
      // A more direct test would require network access and credentials, which is less secure.
      const command = 'grep "Connection Established" /var/log/cloud-init-output.log';

      // Allow time for cloud-init to finish
      await new Promise(resolve => setTimeout(resolve, 60000));

      const params = {
        DocumentName: 'AWS-RunShellScript',
        InstanceIds: [ec2InstanceId],
        Parameters: { commands: [command] },
      };
      const result = await ssm.sendCommand(params).promise();

      // Wait for the command to execute
      await new Promise(resolve => setTimeout(resolve, 5000));

      const commandId = result.Command?.CommandId || '';
      const output = await ssm.getCommandInvocation({ CommandId: commandId, InstanceId: ec2InstanceId }).promise();

      // If the grep command found the success message, its status will be 'Success'
      expect(output.Status).toBe('Success');
      console.log(" EC2 instance successfully connected to the RDS database.");
    });

    // New Test: Verify IAM permissions for S3
    it("should verify EC2 instance can access the S3 bucket", async () => {
      console.log(`Verifying S3 access from instance ${ec2InstanceId}`);
      const testFileName = `iam-test-${uuidv4()}.txt`;
      const bucketName = outputs.S3BucketName.value;

      // Use SSM to command the EC2 instance to write a file to the S3 bucket using its IAM role
      const command = `echo "IAM test" > /tmp/${testFileName} && aws s3 cp /tmp/${testFileName} s3://${bucketName}/`;

      const sendParams = {
        DocumentName: 'AWS-RunShellScript',
        InstanceIds: [ec2InstanceId],
        Parameters: { commands: [command] },
      };
      const result = await ssm.sendCommand(sendParams).promise();

      // Wait for the command to execute
      await new Promise(resolve => setTimeout(resolve, 10000));

      const commandId = result.Command?.CommandId || '';
      const output = await ssm.getCommandInvocation({ CommandId: commandId, InstanceId: ec2InstanceId }).promise();

      // If the 'aws s3 cp' command was successful, the SSM command status will be 'Success'
      expect(output.Status).toBe('Success');
      console.log(" EC2 instance successfully accessed the S3 bucket via its IAM role.");

      // Cleanup the test file from S3
      await s3.deleteObject({ Bucket: bucketName, Key: testFileName }).promise();
    });

    // New Test: Verify CloudWatch alarm state
    it("should have a CloudWatch alarm in a healthy state", async () => {
      console.log(`Checking status of CloudWatch alarm: ${outputs.CPUAlarmName.value}`);
      const response = await cloudwatch.describeAlarms({
        AlarmNames: [outputs.CPUAlarmName.value],
      }).promise();

      expect(response.MetricAlarms).toHaveLength(1);
      const alarm = response.MetricAlarms?.[0];

      // A healthy alarm is in the 'OK' state. 'INSUFFICIENT_DATA' is also acceptable initially.
      expect(alarm?.StateValue).toMatch(/OK|INSUFFICIENT_DATA/);
      console.log(` CloudWatch alarm is in a healthy state (${alarm?.StateValue}).`);
    });
  });
} else {
  describe("Integration Tests Skipped", () => {
    it("logs a warning because CDKTF output file was not found", () => {
      console.warn("\n WARNING: CDKTF output file not found. Skipping live integration tests.\n");
    });
  });
}
