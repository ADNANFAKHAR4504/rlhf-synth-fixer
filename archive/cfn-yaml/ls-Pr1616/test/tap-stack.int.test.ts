import {
  DescribeTableCommand,
  DynamoDBClient,
} from "@aws-sdk/client-dynamodb";
import {
  DescribeSubnetsCommand,
  DescribeVpcsCommand,
  EC2Client,
} from "@aws-sdk/client-ec2";
import {
  GetBucketLocationCommand,
  GetBucketVersioningCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import fs from "fs";

const region = process.env.AWS_REGION || process.env.AWS_DEFAULT_REGION || "us-east-1";
const endpoint = process.env.AWS_ENDPOINT_URL || undefined;
const isLocalStack = endpoint?.includes("localhost") || endpoint?.includes("4566");

const clientConfig = {
  region,
  ...(endpoint && { endpoint }),
  ...(isLocalStack && {
    forcePathStyle: true,
    credentials: {
      accessKeyId: "test",
      secretAccessKey: "test",
    },
  }),
};

const ec2 = new EC2Client(clientConfig);
const s3 = new S3Client(clientConfig);
const dynamodb = new DynamoDBClient(clientConfig);

// Load outputs
const outputs: Record<string, string> = JSON.parse(
  fs.readFileSync("cfn-outputs/flat-outputs.json", "utf8")
);

// Helper: wait for PITR to be enabled
async function waitForPITR(tableName: string, retries = 10, delayMs = 3000) {
  for (let i = 0; i < retries; i++) {
    const res = await dynamodb.send(new DescribeTableCommand({ TableName: tableName }));
    const status = (res.Table as any)?.PointInTimeRecoveryDescription?.PointInTimeRecoveryStatus;
    if (status === "ENABLED") return res;
    await new Promise(r => setTimeout(r, delayMs));
  }
  throw new Error(`Point-in-time recovery not enabled for table ${tableName} after ${retries} retries`);
}

describe("TapStack Infrastructure Integration Tests", () => {

  describe("CloudFormation Outputs", () => {
    test("should have required stack outputs", () => {
      const keys = ["VPCId", "AppBucketName", "DynamoTableName", "CloudTrailArn"];
      keys.forEach(key => {
        expect(outputs[key]).toBeDefined();
        expect(outputs[key]).not.toBe("");
      });
    });
  });

  describe("VPC and Subnets", () => {
    test("VPC should exist with correct CIDR and subnets", async () => {
      const vpcId = outputs.VPCId;
      const res = await ec2.send(new DescribeVpcsCommand({ VpcIds: [vpcId] }));
      expect(res.Vpcs?.length).toBe(1);
      expect(res.Vpcs?.[0].VpcId).toBe(vpcId);
      expect(res.Vpcs?.[0].CidrBlock).toBe("10.0.0.0/16");

      const subnets = await ec2.send(
        new DescribeSubnetsCommand({ Filters: [{ Name: "vpc-id", Values: [vpcId] }] })
      );
      expect(subnets.Subnets?.length).toBeGreaterThanOrEqual(4);
    });
  });

  describe("S3 Buckets", () => {
    test("App S3 bucket should exist and be versioned", async () => {
      const bucket = outputs.AppBucketName;
      const versioning = await s3.send(new GetBucketVersioningCommand({ Bucket: bucket }));
      expect(versioning.Status).toBe("Enabled");
    });

    test("CloudTrail S3 bucket should exist in correct region", async () => {
      const bucket = outputs.CloudTrailS3Bucket; // Use the real bucket name
      const location = await s3.send(new GetBucketLocationCommand({ Bucket: bucket }));
      const expectedRegions = region === "ap-northeast-1" ? [undefined, null, "", "ap-northeast-1"] : [region];
      expect(expectedRegions).toContain(location.LocationConstraint);
    });
  });

  describe("DynamoDB Table", () => {
    test("Table should exist with correct name and attributes", async () => {
      const tableName = outputs.DynamoTableName;
      const res = await dynamodb.send(new DescribeTableCommand({ TableName: tableName }));

      // Table exists
      expect(res.Table).toBeDefined();
      expect(res.Table?.TableName).toBe(tableName);

      // Optional: check primary key schema
      const keySchema = res.Table?.KeySchema;
      expect(keySchema).toBeDefined();
      expect(keySchema?.length).toBeGreaterThan(0);
      expect(keySchema?.some(k => k.KeyType === "HASH")).toBe(true);

      // Optional: check billing mode
      expect(res.Table?.BillingModeSummary?.BillingMode).toMatch(/PAY_PER_REQUEST|PROVISIONED/);
    });
  });
});
