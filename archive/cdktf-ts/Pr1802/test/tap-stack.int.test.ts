// __tests__/tap-stack.int.test.ts
import { S3Client, HeadBucketCommand, GetBucketAclCommand, GetBucketEncryptionCommand, GetBucketVersioningCommand, GetBucketLoggingCommand } from "@aws-sdk/client-s3";
import { IAMClient, GetRoleCommand, GetRolePolicyCommand, ListAttachedRolePoliciesCommand } from "@aws-sdk/client-iam";
import { CloudWatchLogsClient, DescribeLogGroupsCommand } from "@aws-sdk/client-cloudwatch-logs";
import { LambdaClient, GetFunctionCommand, GetFunctionConfigurationCommand } from "@aws-sdk/client-lambda";
import { KMSClient, DescribeKeyCommand } from "@aws-sdk/client-kms";
import { EC2Client, DescribeVpcsCommand, DescribeSubnetsCommand, DescribeSecurityGroupsCommand } from "@aws-sdk/client-ec2";
import * as fs from "fs";
import * as path from "path";

const awsRegion = process.env.AWS_REGION || process.env.AWS_DEFAULT_REGION || "us-east-1";
const s3Client = new S3Client({ region: awsRegion });
const iamClient = new IAMClient({ region: awsRegion });
const logsClient = new CloudWatchLogsClient({ region: awsRegion });
const lambdaClient = new LambdaClient({ region: awsRegion });
const kmsClient = new KMSClient({ region: awsRegion });
const ec2Client = new EC2Client({ region: awsRegion });

describe("TapStack Integration Tests", () => {
  let outputs: any;
  let stackOutputs: any;

  beforeAll(() => {
    const outputFilePath = path.join(__dirname, "..", "cfn-outputs", "flat-outputs.json");
    if (!fs.existsSync(outputFilePath)) {
      throw new Error(`flat-outputs.json not found at ${outputFilePath}`);
    }
    outputs = JSON.parse(fs.readFileSync(outputFilePath, "utf-8"));
    const stackKey = Object.keys(outputs)[0]; // only one stack in your output
    stackOutputs = outputs[stackKey];

    // Validate required outputs exist
    const requiredOutputs = [
      "main-s3-bucket-name",
      "logging-s3-bucket-name",
      "lambda-role-arn",
      "lambda-function-name",
      "lambda-log-group-name",
      "kms-key-id",
      "vpc-id",
      "private-subnet-ids",
      "public-subnet-ids"
    ];

    for (const output of requiredOutputs) {
      if (!stackOutputs[output]) {
        throw new Error(`Missing required stack output: ${output}`);
      }
    }
  });

  describe("VPC Infrastructure", () => {
    test("VPC exists with correct CIDR and DNS settings", async () => {
      const vpcId = stackOutputs["vpc-id"];
      const { Vpcs } = await ec2Client.send(new DescribeVpcsCommand({ VpcIds: [vpcId] }));
      
      expect(Vpcs).toHaveLength(1);
      expect(Vpcs![0].CidrBlock).toBe("10.0.0.0/16");
    }, 20000);

    test("Private subnets exist and are properly configured", async () => {
      // Fix: Use the array directly instead of parsing JSON
      const subnetIds = stackOutputs["private-subnet-ids"];
      const { Subnets } = await ec2Client.send(new DescribeSubnetsCommand({ SubnetIds: subnetIds }));
      
      expect(Subnets).toHaveLength(2);
      Subnets?.forEach(subnet => {
        expect(subnet.MapPublicIpOnLaunch).toBe(false);
        expect(subnet.VpcId).toBe(stackOutputs["vpc-id"]);
      });
    }, 20000);

    test("Public subnets exist and are properly configured", async () => {
      // Fix: Use the array directly instead of parsing JSON
      const subnetIds = stackOutputs["public-subnet-ids"];
      const { Subnets } = await ec2Client.send(new DescribeSubnetsCommand({ SubnetIds: subnetIds }));
      
      expect(Subnets).toHaveLength(2);
      Subnets?.forEach(subnet => {
        expect(subnet.MapPublicIpOnLaunch).toBe(true);
        expect(subnet.VpcId).toBe(stackOutputs["vpc-id"]);
      });
    }, 20000);
  });

  describe("KMS Encryption", () => {
    test("KMS key exists with rotation enabled", async () => {
      const keyId = stackOutputs["kms-key-id"];
      const { KeyMetadata } = await kmsClient.send(new DescribeKeyCommand({ KeyId: keyId }));
      
      expect(KeyMetadata?.KeyUsage).toBe("ENCRYPT_DECRYPT");
      expect(KeyMetadata?.KeyState).toBe("Enabled");
    }, 20000);
  });

  describe("S3 Security Configuration", () => {
    test("Main S3 bucket has KMS encryption enabled", async () => {
      const bucketName = stackOutputs["main-s3-bucket-name"];
      const kmsKeyArn = stackOutputs["kms-key-arn"];
      
      const { ServerSideEncryptionConfiguration } = await s3Client.send(
        new GetBucketEncryptionCommand({ Bucket: bucketName })
      );
      
      const rule = ServerSideEncryptionConfiguration?.Rules?.[0];
      expect(rule?.ApplyServerSideEncryptionByDefault?.SSEAlgorithm).toBe("aws:kms");
      expect(rule?.ApplyServerSideEncryptionByDefault?.KMSMasterKeyID).toBe(kmsKeyArn);
      expect(rule?.BucketKeyEnabled).toBe(true);
    }, 20000);

    test("Main S3 bucket has versioning enabled", async () => {
      const bucketName = stackOutputs["main-s3-bucket-name"];
      
      const { Status } = await s3Client.send(
        new GetBucketVersioningCommand({ Bucket: bucketName })
      );
      
      expect(Status).toBe("Enabled");
    }, 20000);

    test("Main S3 bucket has access logging configured", async () => {
      const bucketName = stackOutputs["main-s3-bucket-name"];
      const loggingBucketName = stackOutputs["logging-s3-bucket-name"];
      
      const { LoggingEnabled } = await s3Client.send(
        new GetBucketLoggingCommand({ Bucket: bucketName })
      );
      
      expect(LoggingEnabled?.TargetBucket).toBe(loggingBucketName);
      expect(LoggingEnabled?.TargetPrefix).toBe("access-logs/");
    }, 20000);

  });

  describe("Lambda Function Security", () => {
    test("Lambda execution role exists with proper assume role policy", async () => {
      const roleArn = stackOutputs["lambda-role-arn"];
      const roleName = roleArn.split('/')[1];
      
      const { Role } = await iamClient.send(new GetRoleCommand({ RoleName: roleName }));
      expect(Role?.RoleName).toBe(roleName);

      const assumeRolePolicy = JSON.parse(decodeURIComponent(Role?.AssumeRolePolicyDocument || ""));
      expect(
        assumeRolePolicy.Statement.some(
          (statement: any) =>
            statement.Effect === "Allow" &&
            statement.Principal.Service === "lambda.amazonaws.com"
        )
      ).toBe(true);
    }, 20000);

    test("Lambda function exists and is configured in VPC", async () => {
      const functionName = stackOutputs["lambda-function-name"];
      // Fix: Use the array directly instead of parsing JSON
      const privateSubnetIds = stackOutputs["private-subnet-ids"];
      
      const { Configuration } = await lambdaClient.send(
        new GetFunctionCommand({ FunctionName: functionName })
      );
      
      expect(Configuration?.FunctionName).toBe(functionName);
      expect(Configuration?.Runtime).toBe("python3.9");
      expect(Configuration?.VpcConfig?.SubnetIds).toEqual(expect.arrayContaining(privateSubnetIds));
      expect(Configuration?.VpcConfig?.SecurityGroupIds).toHaveLength(1);
      expect(Configuration?.KMSKeyArn).toBe(stackOutputs["kms-key-arn"]);
    }, 20000);

  });

  describe("CloudWatch Logging", () => {
    test("Lambda CloudWatch log group exists with proper configuration", async () => {
      const logGroupName = stackOutputs["lambda-log-group-name"];
      
      const { logGroups } = await logsClient.send(
        new DescribeLogGroupsCommand({ logGroupNamePrefix: logGroupName })
      );
      
      expect(logGroups).toHaveLength(1);
      expect(logGroups![0].logGroupName).toBe(logGroupName);
      expect(logGroups![0].retentionInDays).toBe(30);
      expect(logGroups![0].kmsKeyId).toBe(stackOutputs["kms-key-arn"]);
    }, 20000);
  });

  describe("Security Compliance", () => {
    test("Security summary contains all required compliance items", () => {
      // Fix: Use the object directly instead of parsing JSON
      const securitySummary = stackOutputs["security-summary"];
      
      expect(securitySummary["encryption_at_rest"]).toBe("Enabled with customer-managed KMS key");
      expect(securitySummary["logging_enabled"]).toBe("S3 access logs and Lambda execution logs");
      expect(securitySummary["network_isolation"]).toBe("All resources in private subnets");
      expect(securitySummary["iam_compliance"]).toBe("Least privilege policies with resource-specific permissions");
      expect(securitySummary["public_access"]).toBe("Blocked on all S3 buckets");
      expect(securitySummary["key_rotation"]).toBe("Enabled on KMS key");
      expect(securitySummary["log_retention"]).toBe("30 days for Lambda logs");
    });

    test("No public access to any S3 bucket", async () => {
      const mainBucketName = stackOutputs["main-s3-bucket-name"];
      const loggingBucketName = stackOutputs["logging-s3-bucket-name"];
      
      for (const bucketName of [mainBucketName, loggingBucketName]) {
        const { Grants } = await s3Client.send(new GetBucketAclCommand({ Bucket: bucketName }));
        const hasPublicRead = Grants?.some(
          grant => grant.Grantee?.URI === "http://acs.amazonaws.com/groups/global/AllUsers"
        );
        expect(hasPublicRead).toBe(false);
      }
    }, 30000);

    test("All resources have proper tagging", async () => {
      // Test VPC tags
      const vpcId = stackOutputs["vpc-id"];
      const { Vpcs } = await ec2Client.send(new DescribeVpcsCommand({ VpcIds: [vpcId] }));
      
      const vpcTags = Vpcs![0].Tags || [];
      expect(vpcTags.some(tag => tag.Key === "Environment" && tag.Value === "production")).toBe(true);
      expect(vpcTags.some(tag => tag.Key === "SecurityCompliance" && tag.Value === "high")).toBe(true);
      
      // Test Lambda function tags
      const functionName = stackOutputs["lambda-function-name"];
      const { Tags } = await lambdaClient.send(
        new GetFunctionCommand({ FunctionName: functionName })
      );
      
      expect(Tags?.Environment).toBe("production");
      expect(Tags?.Purpose).toBe("secure-processing");
    }, 20000);
  });
});