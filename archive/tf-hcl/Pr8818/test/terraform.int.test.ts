import {
  EC2Client,
  DescribeVpcsCommand,
  DescribeSubnetsCommand
} from "@aws-sdk/client-ec2";
import {
  DynamoDBClient,
  DescribeTableCommand
} from "@aws-sdk/client-dynamodb";
import {
  S3Client,
  HeadBucketCommand,
  GetBucketLocationCommand
} from "@aws-sdk/client-s3";
import {
  RDSClient,
  DescribeDBInstancesCommand
} from "@aws-sdk/client-rds";
import {
  LambdaClient,
  GetFunctionCommand
} from "@aws-sdk/client-lambda";
import {
  APIGatewayClient,
  GetRestApiCommand
} from "@aws-sdk/client-api-gateway";
import {
  KMSClient,
  DescribeKeyCommand
} from "@aws-sdk/client-kms";
import fs from "fs";
import path from "path";

// Define path to outputs
const OUTPUTS_PATH = path.resolve(__dirname, "../cfn-outputs/flat-outputs.json");

describe("Payment Processor Infrastructure Integration Tests", () => {
  let outputs: any;
  let region: string;

  // Clients
  let ec2Client: EC2Client;
  let dynamoClient: DynamoDBClient;
  let s3Client: S3Client;
  let rdsClient: RDSClient;
  let lambdaClient: LambdaClient;
  let apiGatewayClient: APIGatewayClient;
  let kmsClient: KMSClient;

  beforeAll(() => {
    // 1. Load Outputs
    if (!fs.existsSync(OUTPUTS_PATH)) {
      throw new Error(`Outputs file not found at ${OUTPUTS_PATH}`);
    }
    const rawOutputs = fs.readFileSync(OUTPUTS_PATH, "utf8");
    outputs = JSON.parse(rawOutputs);

    // 2. Determine Region (Default to eu-west-1 based on your logs)
    region = outputs.current_region || "eu-west-1";

    // 3. Initialize Clients
    ec2Client = new EC2Client({ region });
    dynamoClient = new DynamoDBClient({ region });
    s3Client = new S3Client({ region });
    rdsClient = new RDSClient({ region });
    lambdaClient = new LambdaClient({ region });
    apiGatewayClient = new APIGatewayClient({ region });
    kmsClient = new KMSClient({ region });

    // 4. Handle Stringified Arrays (e.g., subnet lists often come as strings in flat outputs)
    const arrayKeys = ["public_subnet_ids", "private_subnet_ids"];
    arrayKeys.forEach((key) => {
      if (outputs[key] && typeof outputs[key] === "string") {
        try {
          const parsed = JSON.parse(outputs[key]);
          if (Array.isArray(parsed)) {
            outputs[key] = parsed;
          }
        } catch (e) {
          console.warn(`Could not parse ${key} as JSON array. keeping as string.`);
        }
      }
    });

    console.log(`Tests running in region: ${region}`);
  });

  describe("VPC & Networking", () => {
    test("VPC should exist and be available", async () => {
      const command = new DescribeVpcsCommand({ VpcIds: [outputs.vpc_id] });
      const response = await ec2Client.send(command);
      expect(response.Vpcs).toBeDefined();
      expect(response.Vpcs).toHaveLength(1);
      expect(response.Vpcs![0].State).toBe("available");
      expect(response.Vpcs![0].CidrBlock).toBe(outputs.vpc_cidr);
    });

    test("Public Subnets should exist", async () => {
      // Ensure we have an array
      const subnetIds = Array.isArray(outputs.public_subnet_ids)
        ? outputs.public_subnet_ids
        : [outputs.public_subnet_ids]; // Fallback if single string

      const command = new DescribeSubnetsCommand({ SubnetIds: subnetIds });
      const response = await ec2Client.send(command);
      expect(response.Subnets).toBeDefined();
      expect(response.Subnets?.length).toBeGreaterThan(0);
    });

    test("Private Subnets should exist", async () => {
      const subnetIds = Array.isArray(outputs.private_subnet_ids)
        ? outputs.private_subnet_ids
        : [outputs.private_subnet_ids];

      const command = new DescribeSubnetsCommand({ SubnetIds: subnetIds });
      const response = await ec2Client.send(command);
      expect(response.Subnets).toBeDefined();
      expect(response.Subnets?.length).toBeGreaterThan(0);
    });
  });

  describe("DynamoDB Table", () => {
    test("Transaction Table should be active", async () => {
      const command = new DescribeTableCommand({
        TableName: outputs.dynamodb_table_name,
      });
      const response = await dynamoClient.send(command);
      expect(response.Table).toBeDefined();
      expect(response.Table?.TableStatus).toBe("ACTIVE");
      expect(response.Table?.TableArn).toBe(outputs.dynamodb_table_arn);
    });
  });

  describe("S3 Bucket", () => {
    test("Documents bucket should exist", async () => {
      // HeadBucket checks for existence and permission
      const command = new HeadBucketCommand({ Bucket: outputs.s3_bucket_name });
      await expect(s3Client.send(command)).resolves.toBeDefined();
    });

    test("Bucket should be in the correct region", async () => {
      const command = new GetBucketLocationCommand({ Bucket: outputs.s3_bucket_name });
      const response = await s3Client.send(command);
      // For eu-west-1, LocationConstraint is usually "eu-west-1"
      // Note: us-east-1 returns null/empty string sometimes, but here we are in EU.
      expect(response.LocationConstraint).toBe(region);
    });
  });

  describe("RDS Instance", () => {
    test("PostgreSQL instance should be available", async () => {
      // Since we only have the Address/Endpoint, we search for it.
      // DescribeDBInstances without filters gets all, then we find the match.
      const command = new DescribeDBInstancesCommand({});
      const response = await rdsClient.send(command);

      const instance = response.DBInstances?.find(
        (db) => db.Endpoint?.Address === outputs.rds_address
      );

      expect(instance).toBeDefined();
      expect(instance?.DBInstanceStatus).toBe("available");
      expect(instance?.Engine).toContain("postgres");
      expect(instance?.Endpoint?.Port).toBe(Number(outputs.rds_port));
    });
  });

  describe("Lambda Function", () => {
    test("Payment Processor function should exist", async () => {
      const command = new GetFunctionCommand({
        FunctionName: outputs.lambda_function_name,
      });
      const response = await lambdaClient.send(command);
      expect(response.Configuration).toBeDefined();
      expect(response.Configuration?.FunctionArn).toBe(outputs.lambda_function_arn);
      expect(response.Configuration?.State).toBe("Active");
    });
  });

  describe("API Gateway", () => {
    test("API Gateway should exist", async () => {
      const command = new GetRestApiCommand({
        restApiId: outputs.api_gateway_id,
      });
      const response = await apiGatewayClient.send(command);
      expect(response.id).toBe(outputs.api_gateway_id);
      expect(response.name).toBeDefined();
    });

    test("API Endpoint URL should be valid", () => {
      // Basic check that the URL contains the ID and Region
      expect(outputs.api_gateway_endpoint).toContain(outputs.api_gateway_id);
      expect(outputs.api_gateway_endpoint).toContain(region);
    });
  });

  describe("KMS Keys", () => {
    test("RDS KMS Key should be enabled", async () => {
      const command = new DescribeKeyCommand({ KeyId: outputs.kms_key_id_rds });
      const response = await kmsClient.send(command);
      expect(response.KeyMetadata).toBeDefined();
      expect(response.KeyMetadata?.Enabled).toBe(true);
    });

    test("S3 KMS Key should be enabled", async () => {
      const command = new DescribeKeyCommand({ KeyId: outputs.kms_key_id_s3 });
      const response = await kmsClient.send(command);
      expect(response.KeyMetadata).toBeDefined();
      expect(response.KeyMetadata?.Enabled).toBe(true);
    });
  });
});
