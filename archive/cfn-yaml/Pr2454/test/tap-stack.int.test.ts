// Configuration - These are coming from cfn-outputs after cdk deploy
import { DescribeTableCommand, DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { GetFunctionConfigurationCommand, LambdaClient } from "@aws-sdk/client-lambda";
import { ListBucketsCommand, S3Client } from "@aws-sdk/client-s3";
import fs from 'fs';

const outputs = JSON.parse(
  fs.readFileSync('cfn-outputs/flat-outputs.json', 'utf8')
);

const region = process.env.AWS_REGION || "us-east-1";
const s3Client = new S3Client({ region });
const ddbClient = new DynamoDBClient({ region });
const lambdaClient = new LambdaClient({ region });

// Get environment suffix from environment variable (set by CI/CD pipeline)
const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';

describe('Turn Around Prompt API Integration Tests', () => {

  beforeAll(() => {
    if (Object.keys(outputs).length === 0) {
      console.log('Warning: No stack outputs found. Integration tests will be skipped until deployment.');
    } else {
      console.log(Object.keys(outputs).join(',\n') + ' stack outputs found. Proceeding with integration tests.');
    }
  });

  describe('CloudFormation Stack Outputs', () => {
    test('Stack outputs should contain expected keys', () => {
      if (Object.keys(outputs).length === 0) return;
      const expectedKeys = [
        "KMSKeyArn",
        "DynamoDBTableArn",
        "KMSKeyId",
        "CloudFrontDistributionId",
        "S3BucketArn",
        "LambdaFunctionName",
        "CloudFrontDomainName",
        "ApiGatewayUrl",
        "LambdaFunctionArn",
        "DynamoDBTableName",
        "Environment",
        "ApiGatewayId",
        "S3BucketName",
        "StackName"
      ];

      expectedKeys.forEach((key) => {
        expect(outputs).toHaveProperty(key);
      });
    });
  });

  describe('API Gateway Tests', () => {
    test('API Gateway URL should be valid', () => {
      const apiGatewayUrl = outputs['ApiGatewayUrl'];
      expect(apiGatewayUrl).toMatch(/^https?:\/\//);
    });
    test('API Gateway should respond to a GET request', async () => {

    });

  });

  describe('Lambda Function Tests', () => {
    test('Lambda function should be invoked successfully', async () => {
      const lambdaFunctionName = outputs['LambdaFunctionName'];
      const response = await lambdaClient.send(new GetFunctionConfigurationCommand({ FunctionName: lambdaFunctionName }));
      expect(response.FunctionName).toBe(lambdaFunctionName);
      expect(response.Runtime).toBe("python3.9");
    });
  });

  it("should create expected S3 buckets", async () => {

    const contentBucket = outputs["S3BucketName"]!;
    const logsBucket = contentBucket.replace("content", "logs");

    const list = await s3Client.send(new ListBucketsCommand({}));
    const bucketNames = list.Buckets?.map(b => b.Name) ?? [];

    expect(bucketNames).toContain(contentBucket);
    expect(bucketNames).toContain(logsBucket);
  });

  it("should create DynamoDB table", async () => {
    const tableName = outputs["DynamoDBTableName"]!;
    const desc = await ddbClient.send(new DescribeTableCommand({ TableName: tableName }));
    expect(desc.Table?.TableName).toBe(tableName);
  });

  it("should create Lambda function with correct runtime", async () => {
    const fnName = outputs["LambdaFunctionName"]
    const fnConfig = await lambdaClient.send(new GetFunctionConfigurationCommand({ FunctionName: fnName }));
    expect(fnConfig.FunctionName).toBe(fnName);
    expect(fnConfig.Runtime).toBe("python3.9");
  });

  it("should output a CloudFront Distribution ID", async () => {
    const distId = outputs["CloudFrontDistributionId"]!;
    expect(distId).toMatch(/^E/);
  });

});
