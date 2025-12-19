import {
  APIGatewayClient as ApiGatewayClient,
  GetRestApiCommand
} from '@aws-sdk/client-api-gateway';
import {
  CloudFormationClient,
  DescribeStackResourcesCommand
} from '@aws-sdk/client-cloudformation';
import {
  CodePipelineClient,
  GetPipelineCommand
} from '@aws-sdk/client-codepipeline';
import {
  DeleteItemCommand,
  DescribeTableCommand,
  DynamoDBClient,
  GetItemCommand,
  PutItemCommand
} from '@aws-sdk/client-dynamodb';
import {
  DescribeListenersCommand,
  DescribeLoadBalancersCommand,
  ElasticLoadBalancingV2Client
} from '@aws-sdk/client-elastic-load-balancing-v2';
import {
  GetFunctionCommand,
  InvokeCommand,
  LambdaClient
} from '@aws-sdk/client-lambda';
import {
  GetBucketTaggingCommand,
  GetBucketVersioningCommand,
  S3Client
} from '@aws-sdk/client-s3';
import { randomUUID } from 'crypto';

const STACK_NAME = process.env.STACK_NAME || 'TapStack-dev'; // Your CloudFormation stack name
const REGION = 'us-east-1';    // Your AWS region

// Initialize AWS clients
const cfnClient = new CloudFormationClient({ region: REGION });
const s3Client = new S3Client({ region: REGION });
const apiClient = new ApiGatewayClient({ region: REGION });
const lambdaClient = new LambdaClient({ region: REGION });
const dynamoClient = new DynamoDBClient({ region: REGION });
const elbv2Client = new ElasticLoadBalancingV2Client({ region: REGION });
const pipelineClient = new CodePipelineClient({ region: REGION });

// Helper function to get physical resource ID
async function getResourceId(logicalId: string): Promise<string> {
  const command = new DescribeStackResourcesCommand({
    StackName: 'TapStackpr2879'
  });
  const response = await cfnClient.send(command);
  const resource = response.StackResources?.find(r => r.LogicalResourceId === logicalId);
  if (!resource?.PhysicalResourceId) {
    throw new Error(`Resource ${logicalId} not found`);
  }
  return resource.PhysicalResourceId;
}

describe('TapStack Infrastructure Integration Tests', () => {
  jest.setTimeout(30000); // Increased timeout for AWS API calls

  describe('S3 Artifact Bucket', () => {
    let bucketName: string;

    beforeAll(async () => {
      bucketName = await getResourceId('ArtifactBucket');
    });

    test('should have versioning enabled', async () => {
      const command = new GetBucketVersioningCommand({ Bucket: bucketName });
      const response = await s3Client.send(command);
      expect(response.Status).toBe('Enabled');
    });

    test('should have Production environment tag', async () => {
      const command = new GetBucketTaggingCommand({ Bucket: bucketName });
      const response = await s3Client.send(command);
      const envTag = response.TagSet?.find(tag => tag.Key === 'Environment');
      expect(envTag?.Value).toBe('Production');
    });
  });

  describe('API Gateway', () => {
    let apiId: string;

    beforeAll(async () => {
      apiId = await getResourceId('ApiGateway');
    });

    test('should have correct configuration', async () => {
      const command = new GetRestApiCommand({ restApiId: apiId });
      const response = await apiClient.send(command);
      expect(response.name).toBe('MicroservicesAPI');
      expect(response.endpointConfiguration?.types).toContain('REGIONAL');
    });
  });

  describe('Lambda Function', () => {
    let functionName: string;

    beforeAll(async () => {
      functionName = await getResourceId('MicroserviceLambda');
    });

    test('should have correct configuration', async () => {
      const command = new GetFunctionCommand({ FunctionName: functionName });
      const response = await lambdaClient.send(command);
      expect(response.Configuration?.Runtime).toBe('nodejs22.x');
      expect(response.Configuration?.Handler).toBe('index.handler');
    });

    test('should execute successfully', async () => {
      const command = new InvokeCommand({
        FunctionName: functionName,
        Payload: Buffer.from(JSON.stringify({ test: true }))
      });
      const response = await lambdaClient.send(command);
      const payload = JSON.parse(new TextDecoder().decode(response.Payload));
      expect(payload.statusCode).toBe(200);
    });
  });

  describe('DynamoDB Table', () => {
    let tableName: string;
    const testId = randomUUID();

    beforeAll(async () => {
      tableName = await getResourceId('DynamoDBTable');
    });

    test('should have correct configuration', async () => {
      const command = new DescribeTableCommand({ TableName: tableName });
      const response = await dynamoClient.send(command);
      const table = response.Table;
      expect(table).toBeDefined();

      // Verify the table exists and has correct key schema
      expect(table?.KeySchema).toEqual([
        {
          AttributeName: 'id',
          KeyType: 'HASH'
        }
      ]);

      // Check attribute definitions
      expect(table?.AttributeDefinitions).toEqual([
        {
          AttributeName: 'id',
          AttributeType: 'S'
        }
      ]);

      // Check billing mode summary
      expect(table?.BillingModeSummary?.BillingMode).toBe('PAY_PER_REQUEST');
    });

    test('should perform CRUD operations', async () => {
      // Create
      const item = {
        id: { S: testId },
        testData: { S: 'integration-test' }
      };

      await dynamoClient.send(new PutItemCommand({
        TableName: tableName,
        Item: item
      }));

      // Read
      const getResponse = await dynamoClient.send(new GetItemCommand({
        TableName: tableName,
        Key: { id: { S: testId } }
      }));
      expect(getResponse.Item).toEqual(item);

      // Delete (cleanup)
      await dynamoClient.send(new DeleteItemCommand({
        TableName: tableName,
        Key: { id: { S: testId } }
      }));
    });
  });

  describe('Application Load Balancer', () => {
    let albArn: string;

    beforeAll(async () => {
      albArn = await getResourceId('ApplicationLoadBalancer');
    });

    test('should have correct configuration', async () => {
      const command = new DescribeLoadBalancersCommand({
        LoadBalancerArns: [albArn]
      });
      const response = await elbv2Client.send(command);
      const alb = response.LoadBalancers?.[0];
      expect(alb?.Scheme).toBe('internet-facing');

      const listenersCommand = new DescribeListenersCommand({
        LoadBalancerArn: albArn
      });
      const listenersResponse = await elbv2Client.send(listenersCommand);
      const httpsListener = listenersResponse.Listeners?.find(l => l.Port === 443);
      // HTTPS listener is optional based on EnableHttps parameter
      const httpListener = listenersResponse.Listeners?.find(l => l.Port === 80);
      expect(httpListener?.Protocol).toBe('HTTP');
    });
  });

  describe('CodePipeline', () => {
    let pipelineName: string;

    beforeAll(async () => {
      pipelineName = await getResourceId('CodePipeline');
    });

    test('should have correct pipeline configuration', async () => {
      const command = new GetPipelineCommand({ name: pipelineName });
      const response = await pipelineClient.send(command);

      const stages = response.pipeline?.stages || [];
      expect(stages.map(s => s.name)).toEqual(['Source', 'Build', 'Deploy']);

      const sourceStage = stages.find(s => s.name === 'Source');
      expect(sourceStage?.actions?.[0].actionTypeId?.provider).toBe('CodeCommit');

      const buildStage = stages.find(s => s.name === 'Build');
      expect(buildStage?.actions?.[0].actionTypeId?.provider).toBe('CodeBuild');

      const deployStage = stages.find(s => s.name === 'Deploy');
      expect(deployStage?.actions?.[0].actionTypeId?.provider).toBe('CodeDeploy');
    });
  });
});

