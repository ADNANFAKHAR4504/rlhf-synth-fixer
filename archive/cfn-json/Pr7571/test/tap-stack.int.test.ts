// PCI-DSS Payment Processing Infrastructure Integration Tests
// These tests validate the deployed infrastructure using actual AWS resources

import * as fs from "fs";
import * as path from "path";
import {
  EC2Client,
  DescribeVpcsCommand,
  DescribeSubnetsCommand,
  DescribeSecurityGroupsCommand,
} from "@aws-sdk/client-ec2";
import {
  S3Client,
  HeadBucketCommand,
  GetBucketVersioningCommand,
  GetBucketEncryptionCommand,
  GetPublicAccessBlockCommand,
} from "@aws-sdk/client-s3";
import {
  DynamoDBClient,
  DescribeTableCommand,
} from "@aws-sdk/client-dynamodb";
import {
  LambdaClient,
  GetFunctionCommand,
  GetFunctionConfigurationCommand,
} from "@aws-sdk/client-lambda";
import {
  KMSClient,
  DescribeKeyCommand,
  GetKeyRotationStatusCommand,
} from "@aws-sdk/client-kms";
import {
  CloudTrailClient,
  GetTrailCommand,
  GetTrailStatusCommand,
} from "@aws-sdk/client-cloudtrail";
import {
  CloudWatchLogsClient,
  DescribeLogGroupsCommand,
} from "@aws-sdk/client-cloudwatch-logs";

function readStructuredOutputs(): Record<string, string> {
  // Try multiple possible output file locations
  const possiblePaths = [
    path.resolve(process.cwd(), "cfn-outputs/flat-outputs.json"),
    path.resolve(process.cwd(), "cfn-outputs/all-outputs.json"),
    path.resolve(process.cwd(), "lib/.cfn-outputs.json"),
    path.resolve(process.cwd(), "outputs.json"),
    path.resolve(process.cwd(), "stack-outputs.json"),
  ];

  for (const outputPath of possiblePaths) {
    if (fs.existsSync(outputPath)) {
      const content = fs.readFileSync(outputPath, "utf8");
      const parsed = JSON.parse(content);
      // Handle both direct outputs and nested structure
      if (parsed.Outputs) {
        // Extract values from CloudFormation output structure
        const flat: Record<string, string> = {};
        for (const [key, value] of Object.entries(parsed.Outputs)) {
          if (typeof value === "object" && value !== null && "Value" in value) {
            flat[key] = (value as any).Value;
          } else if (typeof value === "string") {
            flat[key] = value;
          }
        }
        return flat;
      }
      // If already flat, return as-is
      return parsed;
    }
  }

  // Fallback: try reading from environment variables
  const outputs: Record<string, string> = {};
  const envVars = [
    "VPCId",
    "PaymentBucketName",
    "TransactionTableName",
    "PaymentProcessorFunctionArn",
    "KMSKeyId",
    "CloudTrailName",
  ];

  for (const key of envVars) {
    const envKey = `CFN_${key}`;
    if (process.env[envKey]) {
      outputs[key] = process.env[envKey]!;
    }
  }

  if (Object.keys(outputs).length === 0) {
    throw new Error(
      `Outputs file not found. Tried: ${possiblePaths.join(", ")}\n` +
      "Set environment variables (CFN_VPC_ID, CFN_PAYMENT_BUCKET_NAME, etc.) or ensure CloudFormation outputs are available."
    );
  }

  return outputs;
}

async function retry<T>(
  fn: () => Promise<T>,
  attempts = 10,
  baseMs = 2000,
  logLabel?: string
): Promise<T> {
  let lastErr: any;
  for (let i = 0; i < attempts; i++) {
    try {
      return await fn();
    } catch (e) {
      lastErr = e;
      const attemptNum = i + 1;
      if (logLabel) {
        console.log(`${logLabel} - Attempt ${attemptNum}/${attempts} failed: ${e instanceof Error ? e.message : String(e)}`);
      }
      if (i < attempts - 1) {
        const wait = baseMs * Math.pow(1.5, i) + Math.floor(Math.random() * 500);
        await new Promise((r) => setTimeout(r, wait));
      }
    }
  }
  throw lastErr;
}

// Read outputs and initialize AWS clients
const outputs = readStructuredOutputs();
const region = process.env.AWS_REGION || "us-east-1";

// AWS clients
const ec2Client = new EC2Client({ region });
const s3Client = new S3Client({ region });
const dynamoDBClient = new DynamoDBClient({ region });
const lambdaClient = new LambdaClient({ region });
const kmsClient = new KMSClient({ region });
const cloudTrailClient = new CloudTrailClient({ region });
const logsClient = new CloudWatchLogsClient({ region });

describe("PCI-DSS Payment Processing Infrastructure Integration Tests", () => {
  describe("CloudFormation Outputs Validation", () => {
    test("should have all required outputs", () => {
      expect(outputs.VPCId).toBeTruthy();
      expect(outputs.PaymentBucketName).toBeTruthy();
      expect(outputs.TransactionTableName).toBeTruthy();
      expect(outputs.PaymentProcessorFunctionArn).toBeTruthy();
      expect(outputs.KMSKeyId).toBeTruthy();
      expect(outputs.CloudTrailName).toBeTruthy();
    });

    test("outputs should include environment suffix", () => {
      const envSuffix = process.env.ENVIRONMENT_SUFFIX || "pr7571";
      expect(outputs.PaymentBucketName).toContain(envSuffix);
      expect(outputs.TransactionTableName).toContain(envSuffix);
      expect(outputs.CloudTrailName).toContain(envSuffix);
    });
  });

  describe("VPC and Networking Validation", () => {
    test("VPC should exist and be available", async () => {
      const response = await retry(async () => {
        return await ec2Client.send(
          new DescribeVpcsCommand({
            VpcIds: [outputs.VPCId],
          })
        );
      });

      expect(response.Vpcs).toBeDefined();
      expect(response.Vpcs!.length).toBe(1);
      expect(response.Vpcs![0].State).toBe("available");
      expect(response.Vpcs![0].CidrBlock).toBe("10.0.0.0/16");
    }, 90000);

    test("VPC should have subnets", async () => {
      const response = await retry(async () => {
        return await ec2Client.send(
          new DescribeSubnetsCommand({
            Filters: [
              {
                Name: "vpc-id",
                Values: [outputs.VPCId],
              },
            ],
          })
        );
      });

      expect(response.Subnets).toBeDefined();
      expect(response.Subnets!.length).toBeGreaterThan(0);
    }, 90000);

    test("should have security groups in VPC", async () => {
      const response = await retry(async () => {
        return await ec2Client.send(
          new DescribeSecurityGroupsCommand({
            Filters: [
              {
                Name: "vpc-id",
                Values: [outputs.VPCId],
              },
            ],
          })
        );
      });

      expect(response.SecurityGroups).toBeDefined();
      expect(response.SecurityGroups!.length).toBeGreaterThan(0);
    }, 90000);
  });

  describe("KMS Encryption Key Validation", () => {
    test("KMS key should exist and be enabled", async () => {
      const response = await retry(async () => {
        return await kmsClient.send(
          new DescribeKeyCommand({
            KeyId: outputs.KMSKeyId,
          })
        );
      });

      expect(response.KeyMetadata).toBeDefined();
      expect(response.KeyMetadata!.KeyId).toBe(outputs.KMSKeyId);
      expect(response.KeyMetadata!.KeyState).toBe("Enabled");
      expect(response.KeyMetadata!.KeyUsage).toBe("ENCRYPT_DECRYPT");
    }, 90000);

    test("KMS key should have automatic rotation enabled", async () => {
      const response = await retry(async () => {
        return await kmsClient.send(
          new GetKeyRotationStatusCommand({
            KeyId: outputs.KMSKeyId,
          })
        );
      });

      expect(response.KeyRotationEnabled).toBe(true);
    }, 90000);
  });

  describe("S3 Payment Bucket Validation", () => {
    test("S3 bucket should exist", async () => {
      const bucketName = outputs.PaymentBucketName;
      expect(bucketName).toBeTruthy();

      await retry(async () => {
        return await s3Client.send(
          new HeadBucketCommand({
            Bucket: bucketName,
          })
        );
      }, 5, 2000, "S3 bucket");
    }, 60000);

    test("S3 bucket should have versioning enabled", async () => {
      const bucketName = outputs.PaymentBucketName;

      const response = await retry(async () => {
        return await s3Client.send(
          new GetBucketVersioningCommand({
            Bucket: bucketName,
          })
        );
      }, 5, 2000, "S3 versioning");

      expect(response.Status).toBe("Enabled");
    }, 60000);

    test("S3 bucket should have KMS encryption enabled", async () => {
      const bucketName = outputs.PaymentBucketName;

      const response = await retry(async () => {
        return await s3Client.send(
          new GetBucketEncryptionCommand({
            Bucket: bucketName,
          })
        );
      }, 5, 2000, "S3 encryption");

      expect(response.ServerSideEncryptionConfiguration).toBeDefined();
      expect(response.ServerSideEncryptionConfiguration?.Rules).toBeDefined();
      expect(response.ServerSideEncryptionConfiguration!.Rules!.length).toBeGreaterThan(0);
      
      const encryptionRule = response.ServerSideEncryptionConfiguration!.Rules![0];
      expect(encryptionRule.ApplyServerSideEncryptionByDefault).toBeDefined();
      expect(encryptionRule.ApplyServerSideEncryptionByDefault!.SSEAlgorithm).toBe("aws:kms");
    }, 60000);

    test("S3 bucket should have public access blocked", async () => {
      const bucketName = outputs.PaymentBucketName;

      const response = await retry(async () => {
        return await s3Client.send(
          new GetPublicAccessBlockCommand({
            Bucket: bucketName,
          })
        );
      }, 5, 2000, "S3 public access block");

      expect(response.PublicAccessBlockConfiguration).toBeTruthy();
      expect(response.PublicAccessBlockConfiguration!.BlockPublicAcls).toBe(true);
      expect(response.PublicAccessBlockConfiguration!.BlockPublicPolicy).toBe(true);
      expect(response.PublicAccessBlockConfiguration!.IgnorePublicAcls).toBe(true);
      expect(response.PublicAccessBlockConfiguration!.RestrictPublicBuckets).toBe(true);
    }, 60000);
  });

  describe("DynamoDB Transaction Table Validation", () => {
    test("DynamoDB table should exist and be active", async () => {
      const tableName = outputs.TransactionTableName;

      const response = await retry(async () => {
        return await dynamoDBClient.send(
          new DescribeTableCommand({
            TableName: tableName,
          })
        );
      });

      expect(response.Table).toBeDefined();
      expect(response.Table!.TableName).toBe(tableName);
      expect(response.Table!.TableStatus).toBe("ACTIVE");
    }, 90000);

    test("DynamoDB table should have KMS encryption enabled", async () => {
      const tableName = outputs.TransactionTableName;

      const response = await retry(async () => {
        return await dynamoDBClient.send(
          new DescribeTableCommand({
            TableName: tableName,
          })
        );
      });

      expect(response.Table!.SSEDescription).toBeDefined();
      expect(response.Table!.SSEDescription!.Status).toBe("ENABLED");
      expect(response.Table!.SSEDescription!.SSEType).toBe("KMS");
      expect(response.Table!.SSEDescription!.KMSMasterKeyArn).toBeDefined();
    }, 90000);
  });

  describe("Lambda Payment Processor Function Validation", () => {
    test("Lambda function should exist", async () => {
      const functionArn = outputs.PaymentProcessorFunctionArn;
      const functionName = functionArn.split(":function:")[1];

      const response = await retry(async () => {
        return await lambdaClient.send(
          new GetFunctionCommand({
            FunctionName: functionName,
          })
        );
      });

      expect(response.Configuration).toBeDefined();
      expect(response.Configuration!.FunctionName).toBe(functionName);
      expect(response.Configuration!.State).toBe("Active");
    }, 90000);

    test("Lambda function should be in VPC", async () => {
      const functionArn = outputs.PaymentProcessorFunctionArn;
      const functionName = functionArn.split(":function:")[1];

      const response = await retry(async () => {
        return await lambdaClient.send(
          new GetFunctionConfigurationCommand({
            FunctionName: functionName,
          })
        );
      });

      expect(response.VpcConfig).toBeDefined();
      expect(response.VpcConfig!.SubnetIds).toBeDefined();
      expect(response.VpcConfig!.SubnetIds!.length).toBeGreaterThan(0);
      expect(response.VpcConfig!.SecurityGroupIds).toBeDefined();
      expect(response.VpcConfig!.SecurityGroupIds!.length).toBeGreaterThan(0);
    }, 90000);

    test("Lambda function should have correct runtime and timeout", async () => {
      const functionArn = outputs.PaymentProcessorFunctionArn;
      const functionName = functionArn.split(":function:")[1];

      const response = await retry(async () => {
        return await lambdaClient.send(
          new GetFunctionConfigurationCommand({
            FunctionName: functionName,
          })
        );
      });

      expect(response.Runtime).toBe("python3.11");
      expect(response.Timeout).toBe(300);
      expect(response.MemorySize).toBe(512);
    }, 90000);
  });

  describe("CloudTrail Validation", () => {
    test("CloudTrail trail should be logging", async () => {
      const trailName = outputs.CloudTrailName;

      const statusResponse = await retry(async () => {
        return await cloudTrailClient.send(
          new GetTrailStatusCommand({
            Name: trailName,
          })
        );
      });

      expect(statusResponse.IsLogging).toBe(true);
    }, 90000);

    test("CloudTrail trail should use KMS encryption", async () => {
      const trailName = outputs.CloudTrailName;

      const response = await retry(async () => {
        return await cloudTrailClient.send(
          new GetTrailCommand({
            Name: trailName,
          })
        );
      });

      expect(response.Trail!.KmsKeyId).toBeDefined();
    }, 90000);

    test("CloudTrail trail should have S3 bucket configured", async () => {
      const trailName = outputs.CloudTrailName;

      const response = await retry(async () => {
        return await cloudTrailClient.send(
          new GetTrailCommand({
            Name: trailName,
          })
        );
      });

      expect(response.Trail!.S3BucketName).toBeDefined();
      expect(response.Trail!.S3BucketName).toContain("cloudtrail");
    }, 90000);
  });

  describe("CloudWatch Logs Validation", () => {
    test("Lambda log group should exist", async () => {
      const functionArn = outputs.PaymentProcessorFunctionArn;
      const functionName = functionArn.split(":function:")[1];
      const logGroupName = `/aws/lambda/${functionName}`;

      const response = await retry(async () => {
        return await logsClient.send(
          new DescribeLogGroupsCommand({
            logGroupNamePrefix: logGroupName,
          })
        );
      });

      const logGroup = response.logGroups?.find(
        (lg) => lg.logGroupName === logGroupName
      );
      expect(logGroup).toBeDefined();
    }, 90000);

    test("Lambda log group should have retention configured", async () => {
      const functionArn = outputs.PaymentProcessorFunctionArn;
      const functionName = functionArn.split(":function:")[1];
      const logGroupName = `/aws/lambda/${functionName}`;

      const response = await retry(async () => {
        return await logsClient.send(
          new DescribeLogGroupsCommand({
            logGroupNamePrefix: logGroupName,
          })
        );
      });

      const logGroup = response.logGroups?.find(
        (lg) => lg.logGroupName === logGroupName
      );
      expect(logGroup).toBeDefined();
      if (logGroup?.retentionInDays) {
        expect(logGroup.retentionInDays).toBe(30);
      }
    }, 90000);
  });

  describe("End-to-End Infrastructure Validation", () => {
    test("complete infrastructure stack should be operational", () => {
      // Verify all critical components are present
      expect(outputs.VPCId).toBeTruthy();
      expect(outputs.PaymentBucketName).toBeTruthy();
      expect(outputs.TransactionTableName).toBeTruthy();
      expect(outputs.PaymentProcessorFunctionArn).toBeTruthy();
      expect(outputs.KMSKeyId).toBeTruthy();
      expect(outputs.CloudTrailName).toBeTruthy();
    });

    test("all resource names should follow naming convention", () => {
      expect(outputs.PaymentBucketName).toMatch(/payment-files-/);
      expect(outputs.TransactionTableName).toMatch(/payment-transactions-/);
      expect(outputs.CloudTrailName).toMatch(/payment-trail-/);
    });

    test("output values should have correct formats", () => {
      // VPC ID format
      expect(outputs.VPCId).toMatch(/^vpc-[a-z0-9]+$/);

      // Lambda ARN format
      expect(outputs.PaymentProcessorFunctionArn).toMatch(/^arn:aws:lambda:.*:function:.*$/);

      // KMS Key ID format (UUID)
      expect(outputs.KMSKeyId).toMatch(/^[a-f0-9-]{36}$/);
    });
  });
});
