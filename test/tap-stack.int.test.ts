import fs from "fs";
import path from "path";
import dns from "dns";
import AWS from "aws-sdk";

// Read AWS region from ../lib/AWS_REGION file
const awsRegionFile = path.resolve(__dirname, "../lib/AWS_REGION");
const AWS_REGION = fs.readFileSync(awsRegionFile, "utf8").trim();

// Read deployed stack outputs
const outputs = JSON.parse(
  fs.readFileSync("cfn-outputs/flat-outputs.json", "utf8")
);

const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || "dev";

// Extract CloudFormation outputs
const kmsKeyId = outputs["KMSKeyId"];
const ec2SecurityGroupId = outputs["EC2SecurityGroupId"];
const rdsSecurityGroupId = outputs["RDSSecurityGroupId"];
const vpcId = outputs["VPCId"];
const secureDataBucketName = outputs["SecureDataBucketName"];
const cloudTrailBucketName = outputs["CloudTrailBucketName"];
const loggingBucketName = outputs["LoggingBucketName"];
const rdsEndpoint = outputs["RDSEndpoint"];
const ec2InstanceId = outputs["EC2InstanceId"];
const ec2RoleArn = outputs["EC2RoleArn"];
const ec2LogGroupName = outputs["EC2LogGroupName"];
const rdsLogGroupName = outputs["RDSLogGroupName"];
const s3LogGroupName = outputs["S3LogGroupName"];
const cloudTrailLogGroupName = outputs["CloudTrailLogGroupName"];

describe("Secure Infrastructure Stack Integration Tests", () => {
  //
  // CloudFormation Outputs Validation
  //
  describe("CloudFormation Outputs", () => {
    test("KMS Key ID should exist", () => {
      expect(kmsKeyId).toBeDefined();
      expect(kmsKeyId).toMatch(/^[0-9a-fA-F-]{36}$/);
    });

    test("VPC ID should exist", () => {
      expect(vpcId).toBeDefined();
      expect(vpcId).toMatch(/^vpc-/);
    });

    test("EC2 Security Group should exist", () => {
      expect(ec2SecurityGroupId).toBeDefined();
      expect(ec2SecurityGroupId).toMatch(/^sg-/);
    });

    test("RDS Security Group should exist", () => {
      expect(rdsSecurityGroupId).toBeDefined();
      expect(rdsSecurityGroupId).toMatch(/^sg-/);
    });

    test("Secure Data S3 bucket name should exist", () => {
      expect(secureDataBucketName).toBeDefined();
      expect(secureDataBucketName).toMatch(/^[a-z0-9.-]+$/);
    });

    test("CloudTrail Bucket name should exist", () => {
      expect(cloudTrailBucketName).toBeDefined();
      expect(cloudTrailBucketName).toMatch(/^[a-z0-9.-]+$/);
    });

    test("Logging Bucket name should exist", () => {
      expect(loggingBucketName).toBeDefined();
      expect(loggingBucketName).toMatch(/^[a-z0-9.-]+$/);
    });

    test("RDS Endpoint should exist", () => {
      expect(rdsEndpoint).toBeDefined();
      expect(rdsEndpoint).toContain(".");
    });

    test("EC2 Instance ID should exist", () => {
      expect(ec2InstanceId).toBeDefined();
      expect(ec2InstanceId).toMatch(/^i-/);
    });

    test("EC2 IAM Role ARN should exist", () => {
      expect(ec2RoleArn).toBeDefined();
      expect(ec2RoleArn).toMatch(/^arn:aws:iam::/);
    });

    test("CloudWatch Log Groups should exist in outputs", () => {
      expect(ec2LogGroupName).toBeDefined();
      expect(rdsLogGroupName).toBeDefined();
      expect(s3LogGroupName).toBeDefined();
      expect(cloudTrailLogGroupName).toBeDefined();
    });
  });

  //
  // S3 Bucket Existence Check
  //
  describe("S3 Bucket Existence", () => {
    const s3 = new AWS.S3({ region: AWS_REGION });

    const checkBucket = async (bucketName: string) => {
      try {
        const res = await s3.headBucket({ Bucket: bucketName }).promise();
        expect(res).toBeDefined();
      } catch (err: any) {
        console.error(`S3 bucket check failed: ${bucketName} - ${err.message}`);
        throw err;
      }
    };

    test("Secure Data Bucket should exist", async () => {
      await checkBucket(secureDataBucketName);
    }, 15000);

    test("CloudTrail Bucket should exist", async () => {
      await checkBucket(cloudTrailBucketName);
    }, 15000);

    test("Logging Bucket should exist", async () => {
      await checkBucket(loggingBucketName);
    }, 15000);
  });

  //
  // RDS Endpoint Availability
  //
  describe("RDS Endpoint Availability", () => {
    test("should resolve DNS for RDS endpoint", async () => {
      const records = await dns.promises.lookup(rdsEndpoint);
      expect(records).toHaveProperty("address");
    });
  });
  //
  // CloudWatch Log Group Existence Check
  //
  describe("CloudWatch Log Groups Existence", () => {
    const logs = new AWS.CloudWatchLogs({ region: AWS_REGION });

    const checkLogGroup = async (logGroupName: string) => {
      const res = await logs.describeLogGroups({ logGroupNamePrefix: logGroupName }).promise();
      const found = res.logGroups?.some(lg => lg.logGroupName === logGroupName);
      expect(found).toBe(true);
    };

    test("EC2 Log Group should exist", async () => {
      await checkLogGroup(ec2LogGroupName);
    }, 15000);

    test("RDS Log Group should exist", async () => {
      await checkLogGroup(rdsLogGroupName);
    }, 15000);

    test("S3 Log Group should exist", async () => {
      await checkLogGroup(s3LogGroupName);
    }, 15000);

    test("CloudTrail Log Group should exist", async () => {
      await checkLogGroup(cloudTrailLogGroupName);
    }, 15000);
  });
});
