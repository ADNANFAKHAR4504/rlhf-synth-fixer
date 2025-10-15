// Configuration - These are coming from cfn-outputs after cdk deploy
import { DescribeTableCommand, DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DescribeVpcsCommand, EC2Client } from "@aws-sdk/client-ec2";
import { DescribeStreamCommand, KinesisClient } from "@aws-sdk/client-kinesis";
import { GetFunctionCommand, LambdaClient } from "@aws-sdk/client-lambda";
import { HeadBucketCommand, S3Client } from "@aws-sdk/client-s3";
import { GetQueueAttributesCommand, SQSClient } from "@aws-sdk/client-sqs";
import fs from 'fs';

const outputs = JSON.parse(
  fs.readFileSync('cfn-outputs/flat-outputs.json', 'utf8')
);

const region = process.env.AWS_REGION || "us-east-1";

const ec2Client = new EC2Client({ region });
const kinesisClient = new KinesisClient({ region });
const dynamoClient = new DynamoDBClient({ region });
const s3Client = new S3Client({ region });
const lambdaClient = new LambdaClient({ region });
const sqsClient = new SQSClient({ region });

describe("TapStack Live Environment Integration Tests", () => {
  // Helper delay for eventual consistency
  const wait = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));


  test("VPC is available with correct VPC ID", async () => {
    const vpcId = outputs.VPCId;
    expect(vpcId).toBeDefined();

    const command = new DescribeVpcsCommand({ VpcIds: [vpcId] });
    const response = await ec2Client.send(command);
    expect(response.Vpcs).toBeDefined();
    expect(response.Vpcs?.length).toBe(1);
    expect(response.Vpcs![0].VpcId).toBe(vpcId);
    expect(response.Vpcs![0].IsDefault).toBeFalsy();
  });

  test("Kinesis Data Stream is ACTIVE and has expected shard count", async () => {
    const streamArn = outputs.KinesisStreamArn;
    expect(streamArn).toBeDefined();

    // Extract stream name from ARN
    const streamName = streamArn.split("/").pop()!;
    const command = new DescribeStreamCommand({ StreamName: streamName });
    const response = await kinesisClient.send(command);
    expect(response.StreamDescription).toBeDefined();
    expect(response.StreamDescription!.StreamStatus).toBe("ACTIVE");
    expect(response.StreamDescription!.Shards!.length).toBeGreaterThanOrEqual(1);
  });

  test("DynamoDB table exists and is ACTIVE", async () => {
    const tableName = outputs.DynamoDBTableName;
    expect(tableName).toBeDefined();

    const command = new DescribeTableCommand({ TableName: tableName });
    const response = await dynamoClient.send(command);
    expect(response.Table).toBeDefined();
    expect(response.Table!.TableStatus).toBe("ACTIVE");
  });

  test("S3 bucket exists and is accessible", async () => {
    const bucketName = outputs.S3BucketName;
    expect(bucketName).toBeDefined();

    const command = new HeadBucketCommand({ Bucket: bucketName });
    await expect(s3Client.send(command)).resolves.not.toThrow();
  });

  test("Lambda function exists and has active state", async () => {
    const functionArn = outputs.LambdaFunctionArn;
    expect(functionArn).toBeDefined();

    // Extract function name from ARN
    const functionName = functionArn.split(":").pop()!;
    const command = new GetFunctionCommand({ FunctionName: functionName });
    const response = await lambdaClient.send(command);
    expect(response.Configuration).toBeDefined();
    expect(response.Configuration!.State).toBe("Active");
  });

  test("Dead Letter Queue exists and attributes are retrievable", async () => {
    const queueUrl = outputs.DLQUrl;
    expect(queueUrl).toBeDefined();

    const command = new GetQueueAttributesCommand({
      QueueUrl: queueUrl,
      AttributeNames: ["ApproximateNumberOfMessages", "VisibilityTimeout"],
    });
    const response = await sqsClient.send(command);
    expect(response.Attributes).toBeDefined();
  });
});

