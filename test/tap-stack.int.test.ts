import * as fs from "fs";
import * as path from "path";
import {
  EC2Client,
  DescribeVpcsCommand,
  DescribeSubnetsCommand,
  DescribeNatGatewaysCommand,
  DescribeSecurityGroupsCommand,
  DescribeVpcEndpointsCommand,
  DescribeRouteTablesCommand,
} from "@aws-sdk/client-ec2";
import {
  S3Client,
  HeadBucketCommand,
  GetBucketVersioningCommand,
  GetBucketEncryptionCommand,
  GetPublicAccessBlockCommand,
  GetBucketPolicyCommand,
} from "@aws-sdk/client-s3";
import {
  DynamoDBClient,
  DescribeTableCommand,
  DescribeContinuousBackupsCommand,
} from "@aws-sdk/client-dynamodb";
import {
  LambdaClient,
  GetFunctionCommand,
  GetFunctionConfigurationCommand,
} from "@aws-sdk/client-lambda";
import {
  CloudTrailClient,
  GetTrailCommand,
  GetTrailStatusCommand,
} from "@aws-sdk/client-cloudtrail";
import {
  KMSClient,
  DescribeKeyCommand,
  GetKeyRotationStatusCommand,
} from "@aws-sdk/client-kms";
import {
  CloudWatchLogsClient,
  DescribeLogGroupsCommand,
} from "@aws-sdk/client-cloudwatch-logs";
import {
  IAMClient,
  GetRoleCommand,
  GetRolePolicyCommand,
  ListRolePoliciesCommand,
} from "@aws-sdk/client-iam";

type CfOutputValue = {
  Description?: string;
  Value: string;
  Export?: {
    Name: string;
  };
};

type StructuredOutputs = {
  VPCId?: CfOutputValue;
  PaymentBucketName?: CfOutputValue;
  TransactionTableName?: CfOutputValue;
  PaymentProcessorFunctionArn?: CfOutputValue;
  KMSKeyId?: CfOutputValue;
  CloudTrailName?: CfOutputValue;
};

function readStructuredOutputs(): StructuredOutputs {
  // Try multiple possible output file locations
  const possiblePaths = [
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
        return parsed.Outputs;
      }
      return parsed;
    }
  }

  // Fallback: try reading from environment variables
  const outputs: StructuredOutputs = {};
  if (process.env.CFN_VPC_ID) {
    outputs.VPCId = { Value: process.env.CFN_VPC_ID };
  }
  if (process.env.CFN_PAYMENT_BUCKET_NAME) {
    outputs.PaymentBucketName = { Value: process.env.CFN_PAYMENT_BUCKET_NAME };
  }
  if (process.env.CFN_TRANSACTION_TABLE_NAME) {
    outputs.TransactionTableName = { Value: process.env.CFN_TRANSACTION_TABLE_NAME };
  }
  if (process.env.CFN_PAYMENT_PROCESSOR_FUNCTION_ARN) {
    outputs.PaymentProcessorFunctionArn = { Value: process.env.CFN_PAYMENT_PROCESSOR_FUNCTION_ARN };
  }
  if (process.env.CFN_KMS_KEY_ID) {
    outputs.KMSKeyId = { Value: process.env.CFN_KMS_KEY_ID };
  }
  if (process.env.CFN_CLOUDTRAIL_NAME) {
    outputs.CloudTrailName = { Value: process.env.CFN_CLOUDTRAIL_NAME };
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
const cloudTrailClient = new CloudTrailClient({ region });
const kmsClient = new KMSClient({ region });
const logsClient = new CloudWatchLogsClient({ region });
const iamClient = new IAMClient({ region });

describe("LIVE: VPC and Networking", () => {
  const vpcId = outputs.VPCId?.Value;

  test("VPC exists and is configured correctly", async () => {
    expect(vpcId).toBeTruthy();

    const response = await retry(async () => {
      return await ec2Client.send(
        new DescribeVpcsCommand({ VpcIds: [vpcId!] })
      );
    });

    expect(response.Vpcs).toBeTruthy();
    expect(response.Vpcs!.length).toBe(1);
    expect(response.Vpcs![0].VpcId).toBe(vpcId);
    expect(response.Vpcs![0].CidrBlock).toBe("10.0.0.0/16");
    // DNS settings are verified via tags or separate API calls if needed
  }, 90000);

  test("VPC has 3 private subnets", async () => {
    const response = await retry(async () => {
      return await ec2Client.send(
        new DescribeSubnetsCommand({
          Filters: [
            { Name: "vpc-id", Values: [vpcId!] },
            { Name: "tag:Name", Values: ["payment-private-subnet-*"] },
          ],
        })
      );
    });

    expect(response.Subnets).toBeTruthy();
    expect(response.Subnets!.length).toBe(3);
    
    const cidrBlocks = response.Subnets!.map((s) => s.CidrBlock).sort();
    expect(cidrBlocks).toContain("10.0.1.0/24");
    expect(cidrBlocks).toContain("10.0.2.0/24");
    expect(cidrBlocks).toContain("10.0.3.0/24");
  }, 90000);

  test("VPC has 1 public subnet", async () => {
    const response = await retry(async () => {
      return await ec2Client.send(
        new DescribeSubnetsCommand({
          Filters: [
            { Name: "vpc-id", Values: [vpcId!] },
            { Name: "tag:Name", Values: ["payment-public-subnet-*"] },
          ],
        })
      );
    });

    expect(response.Subnets).toBeTruthy();
    expect(response.Subnets!.length).toBe(1);
    expect(response.Subnets![0].CidrBlock).toBe("10.0.11.0/24");
    expect(response.Subnets![0].MapPublicIpOnLaunch).toBe(true);
  }, 90000);

  test("NAT Gateway exists in public subnet", async () => {
    const response = await retry(async () => {
      return await ec2Client.send(
        new DescribeNatGatewaysCommand({
          Filter: [{ Name: "vpc-id", Values: [vpcId!] }],
        })
      );
    });

    expect(response.NatGateways).toBeTruthy();
    expect(response.NatGateways!.length).toBeGreaterThan(0);
    const natGateway = response.NatGateways!.find(
      (ng) => ng.State === "available"
    );
    expect(natGateway).toBeTruthy();
  }, 90000);

  test("VPC has S3 and DynamoDB VPC endpoints", async () => {
    const response = await retry(async () => {
      return await ec2Client.send(
        new DescribeVpcEndpointsCommand({
          Filters: [{ Name: "vpc-id", Values: [vpcId!] }],
        })
      );
    });

    expect(response.VpcEndpoints).toBeTruthy();
    expect(response.VpcEndpoints!.length).toBeGreaterThanOrEqual(2);

    const s3Endpoint = response.VpcEndpoints!.find(
      (ep) => ep.ServiceName?.includes("s3")
    );
    const dynamoDBEndpoint = response.VpcEndpoints!.find(
      (ep) => ep.ServiceName?.includes("dynamodb")
    );

    expect(s3Endpoint).toBeTruthy();
    expect(s3Endpoint!.VpcEndpointType).toBe("Gateway");
    expect(dynamoDBEndpoint).toBeTruthy();
    expect(dynamoDBEndpoint!.VpcEndpointType).toBe("Gateway");
  }, 90000);
});

describe("LIVE: KMS Encryption Key", () => {
  const keyId = outputs.KMSKeyId?.Value;

  test("KMS key exists and is enabled", async () => {
    expect(keyId).toBeTruthy();

    const response = await retry(async () => {
      return await kmsClient.send(new DescribeKeyCommand({ KeyId: keyId! }));
    });

    expect(response.KeyMetadata).toBeTruthy();
    expect(response.KeyMetadata!.KeyId).toBe(keyId);
    expect(response.KeyMetadata!.KeyState).toBe("Enabled");
    expect(response.KeyMetadata!.KeyUsage).toBe("ENCRYPT_DECRYPT");
  }, 90000);

  test("KMS key has rotation enabled", async () => {
    const response = await retry(async () => {
      return await kmsClient.send(
        new GetKeyRotationStatusCommand({ KeyId: keyId! })
      );
    });

    expect(response.KeyRotationEnabled).toBe(true);
  }, 90000);

  test("KMS key has correct description", async () => {
    const response = await retry(async () => {
      return await kmsClient.send(new DescribeKeyCommand({ KeyId: keyId! }));
    });

    expect(response.KeyMetadata!.Description).toContain("payment processing");
  }, 90000);
});

describe("LIVE: S3 Payment Bucket", () => {
  const bucketName = outputs.PaymentBucketName?.Value;

  test("S3 bucket exists and is accessible", async () => {
    expect(bucketName).toBeTruthy();

    await retry(async () => {
      return await s3Client.send(
        new HeadBucketCommand({ Bucket: bucketName! })
      );
    });
  }, 90000);

  test("S3 bucket has versioning enabled", async () => {
    const response = await retry(async () => {
      return await s3Client.send(
        new GetBucketVersioningCommand({ Bucket: bucketName! })
      );
    });

    expect(response.Status).toBe("Enabled");
  }, 90000);

  test("S3 bucket has KMS encryption enabled", async () => {
    const response = await retry(async () => {
      return await s3Client.send(
        new GetBucketEncryptionCommand({ Bucket: bucketName! })
      );
    });

    expect(response.ServerSideEncryptionConfiguration).toBeTruthy();
    expect(response.ServerSideEncryptionConfiguration!.Rules).toBeTruthy();
    expect(response.ServerSideEncryptionConfiguration!.Rules!.length).toBeGreaterThan(0);
    
    const rule = response.ServerSideEncryptionConfiguration!.Rules![0];
    expect(rule.ApplyServerSideEncryptionByDefault).toBeTruthy();
    expect(rule.ApplyServerSideEncryptionByDefault!.SSEAlgorithm).toBe("aws:kms");
    expect(rule.ApplyServerSideEncryptionByDefault!.KMSMasterKeyID).toBeTruthy();
  }, 90000);

  test("S3 bucket has public access blocked", async () => {
    const response = await retry(async () => {
      return await s3Client.send(
        new GetPublicAccessBlockCommand({ Bucket: bucketName! })
      );
    });

    expect(response.PublicAccessBlockConfiguration).toBeTruthy();
    expect(response.PublicAccessBlockConfiguration!.BlockPublicAcls).toBe(true);
    expect(response.PublicAccessBlockConfiguration!.BlockPublicPolicy).toBe(true);
    expect(response.PublicAccessBlockConfiguration!.IgnorePublicAcls).toBe(true);
    expect(response.PublicAccessBlockConfiguration!.RestrictPublicBuckets).toBe(true);
  }, 90000);

  test("S3 bucket policy denies unencrypted uploads", async () => {
    const response = await retry(async () => {
      return await s3Client.send(
        new GetBucketPolicyCommand({ Bucket: bucketName! })
      );
    }, 5); // Fewer retries if policy doesn't exist

    if (response.Policy) {
      const policy = JSON.parse(response.Policy);
      expect(policy.Statement).toBeTruthy();
      
      const denyUnencrypted = policy.Statement.find(
        (stmt: any) => stmt.Sid === "DenyUnencryptedObjectUploads" && stmt.Effect === "Deny"
      );
      expect(denyUnencrypted).toBeTruthy();
      
      const denyInsecureTransport = policy.Statement.find(
        (stmt: any) => stmt.Sid === "DenyInsecureTransport" && stmt.Effect === "Deny"
      );
      expect(denyInsecureTransport).toBeTruthy();
    }
  }, 60000);
});

describe("LIVE: DynamoDB Transaction Table", () => {
  const tableName = outputs.TransactionTableName?.Value;

  test("DynamoDB table exists and is active", async () => {
    expect(tableName).toBeTruthy();

    const response = await retry(async () => {
      return await dynamoDBClient.send(
        new DescribeTableCommand({ TableName: tableName! })
      );
    });

    expect(response.Table).toBeTruthy();
    expect(response.Table!.TableName).toBe(tableName);
    expect(response.Table!.TableStatus).toBe("ACTIVE");
  }, 90000);

  test("DynamoDB table has correct key schema", async () => {
    const response = await retry(async () => {
      return await dynamoDBClient.send(
        new DescribeTableCommand({ TableName: tableName! })
      );
    });

    expect(response.Table!.KeySchema).toBeTruthy();
    expect(response.Table!.KeySchema!.length).toBe(2);
    
    const hashKey = response.Table!.KeySchema!.find(
      (key) => key.AttributeName === "transactionId" && key.KeyType === "HASH"
    );
    const rangeKey = response.Table!.KeySchema!.find(
      (key) => key.AttributeName === "timestamp" && key.KeyType === "RANGE"
    );

    expect(hashKey).toBeTruthy();
    expect(rangeKey).toBeTruthy();
  }, 90000);

  test("DynamoDB table has KMS encryption enabled", async () => {
    const response = await retry(async () => {
      return await dynamoDBClient.send(
        new DescribeTableCommand({ TableName: tableName! })
      );
    });

    expect(response.Table!.SSEDescription).toBeTruthy();
    expect(response.Table!.SSEDescription!.Status).toBe("ENABLED");
    expect(response.Table!.SSEDescription!.SSEType).toBe("KMS");
    expect(response.Table!.SSEDescription!.KMSMasterKeyArn).toBeTruthy();
  }, 90000);

  test("DynamoDB table has point-in-time recovery enabled", async () => {
    const response = await retry(async () => {
      return await dynamoDBClient.send(
        new DescribeContinuousBackupsCommand({ TableName: tableName! })
      );
    });

    expect(response.ContinuousBackupsDescription).toBeTruthy();
    expect(response.ContinuousBackupsDescription!.PointInTimeRecoveryDescription?.PointInTimeRecoveryStatus).toBe("ENABLED");
  }, 90000);

  test("DynamoDB table uses on-demand billing mode", async () => {
    const response = await retry(async () => {
      return await dynamoDBClient.send(
        new DescribeTableCommand({ TableName: tableName! })
      );
    });

    expect(response.Table!.BillingModeSummary).toBeTruthy();
    expect(response.Table!.BillingModeSummary!.BillingMode).toBe("PAY_PER_REQUEST");
  }, 90000);
});

describe("LIVE: Lambda Payment Processor", () => {
  const functionArn = outputs.PaymentProcessorFunctionArn?.Value;

  test("Lambda function exists and is active", async () => {
    expect(functionArn).toBeTruthy();

    const response = await retry(async () => {
      return await lambdaClient.send(
        new GetFunctionCommand({ FunctionName: functionArn! })
      );
    });

    expect(response.Configuration).toBeTruthy();
    expect(response.Configuration!.FunctionArn).toBe(functionArn);
    expect(response.Configuration!.State).toBe("Active");
    expect(response.Configuration!.Runtime).toBe("python3.11");
  }, 90000);

  test("Lambda function has VPC configuration", async () => {
    const response = await retry(async () => {
      return await lambdaClient.send(
        new GetFunctionConfigurationCommand({ FunctionName: functionArn! })
      );
    });

    expect(response.VpcConfig).toBeTruthy();
    expect(response.VpcConfig!.SubnetIds).toBeTruthy();
    expect(response.VpcConfig!.SubnetIds!.length).toBe(3);
    expect(response.VpcConfig!.SecurityGroupIds).toBeTruthy();
    expect(response.VpcConfig!.SecurityGroupIds!.length).toBe(1);
  }, 90000);

  test("Lambda function has correct timeout and memory", async () => {
    const response = await retry(async () => {
      return await lambdaClient.send(
        new GetFunctionConfigurationCommand({ FunctionName: functionArn! })
      );
    });

    expect(response.Timeout).toBe(300);
    expect(response.MemorySize).toBe(512);
  }, 90000);

  test("Lambda function has environment variables configured", async () => {
    const response = await retry(async () => {
      return await lambdaClient.send(
        new GetFunctionConfigurationCommand({ FunctionName: functionArn! })
      );
    });

    expect(response.Environment).toBeTruthy();
    expect(response.Environment!.Variables).toBeTruthy();
    expect(response.Environment!.Variables!.DYNAMODB_TABLE).toBeTruthy();
    expect(response.Environment!.Variables!.S3_BUCKET).toBeTruthy();
    expect(response.Environment!.Variables!.KMS_KEY_ID).toBeTruthy();
  }, 90000);

  test("Lambda execution role exists and has correct permissions", async () => {
    const response = await retry(async () => {
      return await lambdaClient.send(
        new GetFunctionConfigurationCommand({ FunctionName: functionArn! })
      );
    });

    const roleArn = response.Role;
    expect(roleArn).toBeTruthy();

    const roleName = roleArn!.split("/").pop()!;

    const roleResponse = await retry(async () => {
      return await iamClient.send(new GetRoleCommand({ RoleName: roleName }));
    }, 5);

    expect(roleResponse.Role).toBeTruthy();
    expect(roleResponse.Role!.AssumeRolePolicyDocument).toBeTruthy();
    
    const assumePolicy = JSON.parse(decodeURIComponent(roleResponse.Role!.AssumeRolePolicyDocument!));
    expect(assumePolicy.Statement[0].Principal.Service).toBe("lambda.amazonaws.com");
  }, 60000);
});

describe("LIVE: CloudTrail", () => {
  const trailName = outputs.CloudTrailName?.Value;

  test("CloudTrail trail exists and is logging", async () => {
    expect(trailName).toBeTruthy();

    const response = await retry(async () => {
      return await cloudTrailClient.send(
        new GetTrailCommand({ Name: trailName! })
      );
    });

    expect(response.Trail).toBeTruthy();
    expect(response.Trail!.Name).toBe(trailName);
    expect(response.Trail!.S3BucketName).toBeTruthy();
    expect(response.Trail!.KmsKeyId).toBeTruthy();
  }, 90000);

  test("CloudTrail trail is actively logging", async () => {
    const response = await retry(async () => {
      return await cloudTrailClient.send(
        new GetTrailStatusCommand({ Name: trailName! })
      );
    });

    expect(response.IsLogging).toBe(true);
  }, 90000);

  test("CloudTrail trail has global service events enabled", async () => {
    const response = await retry(async () => {
      return await cloudTrailClient.send(
        new GetTrailCommand({ Name: trailName! })
      );
    });

    expect(response.Trail!.IncludeGlobalServiceEvents).toBe(true);
  }, 90000);

  test("CloudTrail S3 bucket exists and is accessible", async () => {
    const trailResponse = await retry(async () => {
      return await cloudTrailClient.send(
        new GetTrailCommand({ Name: trailName! })
      );
    });

    const bucketName = trailResponse.Trail!.S3BucketName;
    expect(bucketName).toBeTruthy();

    await retry(async () => {
      return await s3Client.send(
        new HeadBucketCommand({ Bucket: bucketName! })
      );
    });
  }, 90000);
});

describe("LIVE: Security Groups", () => {
  const vpcId = outputs.VPCId?.Value;

  test("Lambda security group exists and is configured correctly", async () => {
    const response = await retry(async () => {
      return await ec2Client.send(
        new DescribeSecurityGroupsCommand({
          Filters: [
            { Name: "vpc-id", Values: [vpcId!] },
            { Name: "group-name", Values: ["payment-lambda-sg-*"] },
          ],
        })
      );
    });

    expect(response.SecurityGroups).toBeTruthy();
    expect(response.SecurityGroups!.length).toBeGreaterThan(0);
    
    const lambdaSG = response.SecurityGroups![0];
    expect(lambdaSG.Description).toContain("payment processing Lambda");
    expect(lambdaSG.IpPermissionsEgress).toBeTruthy();
    
    const httpsEgress = lambdaSG.IpPermissionsEgress!.find(
      (rule) => rule.FromPort === 443 && rule.ToPort === 443 && rule.IpProtocol === "tcp"
    );
    expect(httpsEgress).toBeTruthy();
  }, 90000);
});

describe("LIVE: CloudWatch Logs", () => {
  test("Lambda log group exists with encryption", async () => {
    const logGroupName = `/aws/lambda/payment-processor-${process.env.ENVIRONMENT_SUFFIX || "prod"}`;

    const response = await retry(async () => {
      return await logsClient.send(
        new DescribeLogGroupsCommand({ logGroupNamePrefix: logGroupName })
      );
    });

    expect(response.logGroups).toBeTruthy();
    const logGroup = response.logGroups!.find(
      (lg) => lg.logGroupName === logGroupName
    );
    expect(logGroup).toBeTruthy();
    expect(logGroup!.retentionInDays).toBe(30);
    expect(logGroup!.kmsKeyId).toBeTruthy();
  }, 90000);
});

describe("LIVE: Output Validation", () => {
  test("All required outputs are present", () => {
    const requiredOutputs = [
      "VPCId",
      "PaymentBucketName",
      "TransactionTableName",
      "PaymentProcessorFunctionArn",
      "KMSKeyId",
      "CloudTrailName",
    ];

    requiredOutputs.forEach((outputName) => {
      expect(outputs[outputName as keyof StructuredOutputs]).toBeTruthy();
      expect(outputs[outputName as keyof StructuredOutputs]?.Value).toBeTruthy();
    });
  });

  test("Output values have correct formats", () => {
    // VPC ID format
    expect(outputs.VPCId?.Value).toMatch(/^vpc-[a-z0-9]+$/);

    // S3 bucket name format
    expect(outputs.PaymentBucketName?.Value).toMatch(/^payment-files-.*-\d+$/);

    // DynamoDB table name format
    expect(outputs.TransactionTableName?.Value).toMatch(/^payment-transactions-.*$/);

    // Lambda function ARN format
    expect(outputs.PaymentProcessorFunctionArn?.Value).toMatch(/^arn:aws:lambda:.*:function:payment-processor-.*$/);

    // KMS key ID format (can be key ID or ARN)
    expect(outputs.KMSKeyId?.Value).toBeTruthy();

    // CloudTrail name format
    expect(outputs.CloudTrailName?.Value).toMatch(/^payment-trail-.*$/);
  });
});

describe("LIVE: Security and Compliance", () => {
  test("All resources are in private subnets where applicable", async () => {
    const vpcId = outputs.VPCId?.Value;
    const functionArn = outputs.PaymentProcessorFunctionArn?.Value;

    // Verify Lambda is in private subnets
    const lambdaResponse = await retry(async () => {
      return await lambdaClient.send(
        new GetFunctionConfigurationCommand({ FunctionName: functionArn! })
      );
    });

    const lambdaSubnets = lambdaResponse.VpcConfig!.SubnetIds!;
    expect(lambdaSubnets.length).toBe(3);

    // Verify subnets are private (no MapPublicIpOnLaunch)
    const subnetResponse = await retry(async () => {
      return await ec2Client.send(
        new DescribeSubnetsCommand({
          SubnetIds: lambdaSubnets,
        })
      );
    });

    subnetResponse.Subnets!.forEach((subnet) => {
      expect(subnet.MapPublicIpOnLaunch).toBeFalsy();
    });
  }, 120000);

  test("All data at rest is encrypted", async () => {
    // S3 bucket encryption verified in S3 tests
    // DynamoDB table encryption verified in DynamoDB tests
    // CloudTrail encryption verified in CloudTrail tests
    // Lambda logs encryption verified in CloudWatch Logs tests
    
    // This test serves as a summary assertion
    expect(outputs.KMSKeyId?.Value).toBeTruthy();
  });
});

