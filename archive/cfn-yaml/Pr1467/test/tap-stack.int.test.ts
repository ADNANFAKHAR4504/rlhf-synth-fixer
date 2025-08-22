import fs from "fs";
import fetch from "node-fetch";
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
const secureDataBucketName = outputs["SecureDataBucketName"];
const dbEndpoint = outputs["DatabaseEndpoint"];
const LambdaFunctionArn = outputs["LambdaFunctionArn"];
const vpcId = outputs["VPCId"];
const RestrictedSecurityGroup = outputs["RestrictedSecurityGroup"]
const LambdaSecurityGroup = outputs["LambdaSecurityGroup"]
const DatabaseSecurityGroup = outputs["DatabaseSecurityGroup"]

describe("Security Stack Integration Tests", () => {
  //
  // CloudFormation Outputs Validation
  //
  describe("CloudFormation Outputs", () => {
    test("KMS Key ID should exist", () => {
      expect(kmsKeyId).toBeDefined();
      expect(kmsKeyId).toMatch(/^[0-9a-fA-F-]{36}$/);
      });

    test("Secure Data S3 bucket name should exist", () => {
      expect(secureDataBucketName).toBeDefined();
      expect(secureDataBucketName).toMatch(/^[a-z0-9.-]+$/);
    });

    test("Database Endpoint should exist", () => {
      expect(dbEndpoint).toBeDefined();
      expect(dbEndpoint).toContain(".");
    });

    test("Lambda Function ARN should exist", () => {
      expect(LambdaFunctionArn).toBeDefined();
      expect(LambdaFunctionArn).toMatch(/^arn:aws:lambda:/);
    });

    test("VPC ID should exist", () => {
      expect(vpcId).toBeDefined();
      expect(vpcId).toMatch(/^vpc-/);
    });
    test("Restricted security group for EC2 instances", () => {
      expect(RestrictedSecurityGroup).toBeDefined();
      expect(RestrictedSecurityGroup).toMatch(/^sg-/);
    });

    test("Security group for Lambda functions", () => {
      expect(LambdaSecurityGroup).toBeDefined();
      expect(LambdaSecurityGroup).toMatch(/^sg-/);
    });

    test("Security group for RDS database", () => {
      expect(DatabaseSecurityGroup).toBeDefined();
      expect(DatabaseSecurityGroup).toMatch(/^sg-/);
    });

  });

  //
  // S3 Bucket Existence Check
  //
  describe("S3 Bucket Existence", () => {
    test(
      "Secure Data S3 bucket should exist in AWS",
      async () => {
        const s3 = new AWS.S3({ region: AWS_REGION });

        try {
          const res = await s3.headBucket({ Bucket: secureDataBucketName }).promise();
          expect(res).toBeDefined();
        } catch (err: any) {
          console.error(`S3 bucket check failed: ${err.message}`);
          throw err;
        }
      },
      15000 // 15s timeout
    );
  });

  //
  // Database Endpoint Health Check (basic DNS)
  //
  describe("Database Endpoint Availability", () => {
    test("should resolve DNS for DB endpoint", async () => {
      const records = await dns.promises.lookup(dbEndpoint);
      expect(records).toHaveProperty("address");
    });
  });

  //
  // Lambda Health Check (invocation)
  //
  describe("Lambda Function Invocation", () => {
    test(
      "should successfully invoke Lambda function",
      async () => {
        const lambda = new AWS.Lambda({ region: AWS_REGION });

        const res = await lambda
          .invoke({
            FunctionName: LambdaFunctionArn,
            Payload: JSON.stringify({ test: true })
          })
          .promise();

        expect(res.StatusCode).toBe(200);
      },
      20000 // 20s timeout
    );
  });
});
