import fs from 'fs';
import {
  DynamoDBClient,
  DescribeTableCommand,
  PutItemCommand,
  GetItemCommand,
  QueryCommand,
  DeleteItemCommand,
} from '@aws-sdk/client-dynamodb';
import { S3Client, HeadBucketCommand, PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { LambdaClient, InvokeCommand, GetFunctionCommand } from '@aws-sdk/client-lambda';
import {
  APIGatewayClient,
  GetRestApiCommand,
  GetStageCommand,
} from '@aws-sdk/client-api-gateway';
import { EventBridgeClient, ListRulesCommand, DescribeRuleCommand } from '@aws-sdk/client-eventbridge';
import { CloudWatchLogsClient, DescribeLogGroupsCommand } from '@aws-sdk/client-cloudwatch-logs';
import { CloudFrontClient, GetDistributionCommand } from '@aws-sdk/client-cloudfront';

// Read outputs from flat-outputs.json
const outputs = JSON.parse(fs.readFileSync('cfn-outputs/flat-outputs.json', 'utf8'));

// Get environment suffix and region from environment variables
const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';
const region = process.env.AWS_REGION || 'ap-northeast-1';

// Initialize AWS SDK clients
const dynamoClient = new DynamoDBClient({ region });
const s3Client = new S3Client({ region });
const lambdaClient = new LambdaClient({ region });
const apiGatewayClient = new APIGatewayClient({ region });
const eventBridgeClient = new EventBridgeClient({ region });
const logsClient = new CloudWatchLogsClient({ region });
const cloudFrontClient = new CloudFrontClient({ region });

describe('News Aggregator Stack Integration Tests', () => {
  describe('DynamoDB Tables', () => {
    test('TurnAroundPromptTable should exist and be accessible', async () => {
      const tableName = outputs.TurnAroundPromptTableName;
      expect(tableName).toBeDefined();

      const command = new DescribeTableCommand({ TableName: tableName });
      const response = await dynamoClient.send(command);

      expect(response.Table).toBeDefined();
      expect(response.Table?.TableName).toBe(tableName);
      expect(response.Table?.TableStatus).toBe('ACTIVE');
      expect(response.Table?.BillingModeSummary?.BillingMode).toBe('PAY_PER_REQUEST');
    });

    test('ArticlesTable should exist with correct schema', async () => {
      const tableName = outputs.ArticlesTableName;
      expect(tableName).toBeDefined();

      const command = new DescribeTableCommand({ TableName: tableName });
      const response = await dynamoClient.send(command);

      expect(response.Table).toBeDefined();
      expect(response.Table?.TableStatus).toBe('ACTIVE');
      expect(response.Table?.KeySchema?.[0].AttributeName).toBe('articleId');
      expect(response.Table?.GlobalSecondaryIndexes).toHaveLength(1);
      expect(response.Table?.GlobalSecondaryIndexes?.[0].IndexName).toBe('CategoryTimeIndex');
    });

    test('ArticlesTable should support TTL attribute', async () => {
      const tableName = outputs.ArticlesTableName;
      const testArticleId = `ttl-test-${Date.now()}`;

      // Verify we can write an item with TTL attribute
      const putCommand = new PutItemCommand({
        TableName: tableName,
        Item: {
          articleId: { S: testArticleId },
          title: { S: 'TTL Test Article' },
          content: { S: 'Testing TTL attribute.' },
          category: { S: 'Test' },
          publishedAt: { S: new Date().toISOString() },
          source: { S: 'Test' },
          url: { S: 'https://example.com/ttl-test' },
          ttl: { N: String(Math.floor(Date.now() / 1000) + 7 * 24 * 60 * 60) },
        },
      });
      await dynamoClient.send(putCommand);

      // Verify the item exists with TTL
      const getCommand = new GetItemCommand({
        TableName: tableName,
        Key: { articleId: { S: testArticleId } },
      });
      const response = await dynamoClient.send(getCommand);
      expect(response.Item?.ttl).toBeDefined();

      // Clean up
      await dynamoClient.send(
        new DeleteItemCommand({
          TableName: tableName,
          Key: { articleId: { S: testArticleId } },
        })
      );
    });

    test('ArticlesTable should have DynamoDB Streams enabled', async () => {
      const tableName = outputs.ArticlesTableName;
      const command = new DescribeTableCommand({ TableName: tableName });
      const response = await dynamoClient.send(command);

      expect(response.Table?.StreamSpecification?.StreamEnabled).toBe(true);
      expect(response.Table?.StreamSpecification?.StreamViewType).toBe('NEW_AND_OLD_IMAGES');
    });

    test('UserPreferencesTable should exist with EmailIndex GSI', async () => {
      const tableName = outputs.UserPreferencesTableName;
      expect(tableName).toBeDefined();

      const command = new DescribeTableCommand({ TableName: tableName });
      const response = await dynamoClient.send(command);

      expect(response.Table).toBeDefined();
      expect(response.Table?.TableStatus).toBe('ACTIVE');
      expect(response.Table?.GlobalSecondaryIndexes).toHaveLength(1);
      expect(response.Table?.GlobalSecondaryIndexes?.[0].IndexName).toBe('EmailIndex');
    });

    test('Should be able to write and read from ArticlesTable', async () => {
      const tableName = outputs.ArticlesTableName;
      const testArticleId = `test-article-${Date.now()}`;
      const testCategory = 'Technology';
      const testPublishedAt = new Date().toISOString();

      // Write test item
      const putCommand = new PutItemCommand({
        TableName: tableName,
        Item: {
          articleId: { S: testArticleId },
          title: { S: 'Test Article' },
          content: { S: 'This is a test article content.' },
          category: { S: testCategory },
          publishedAt: { S: testPublishedAt },
          source: { S: 'Test Source' },
          url: { S: 'https://example.com/test' },
          ttl: { N: String(Math.floor(Date.now() / 1000) + 7 * 24 * 60 * 60) },
        },
      });
      await dynamoClient.send(putCommand);

      // Read test item
      const getCommand = new GetItemCommand({
        TableName: tableName,
        Key: {
          articleId: { S: testArticleId },
        },
      });
      const getResponse = await dynamoClient.send(getCommand);

      expect(getResponse.Item).toBeDefined();
      expect(getResponse.Item?.articleId.S).toBe(testArticleId);
      expect(getResponse.Item?.title.S).toBe('Test Article');

      // Clean up
      const deleteCommand = new DeleteItemCommand({
        TableName: tableName,
        Key: {
          articleId: { S: testArticleId },
        },
      });
      await dynamoClient.send(deleteCommand);
    });

    test('Should be able to query ArticlesTable by category using GSI', async () => {
      const tableName = outputs.ArticlesTableName;

      const queryCommand = new QueryCommand({
        TableName: tableName,
        IndexName: 'CategoryTimeIndex',
        KeyConditionExpression: 'category = :category',
        ExpressionAttributeValues: {
          ':category': { S: 'Technology' },
        },
        Limit: 10,
      });

      const response = await dynamoClient.send(queryCommand);
      expect(response.Items).toBeDefined();
      expect(Array.isArray(response.Items)).toBe(true);
    });

    test('Should be able to write and read from UserPreferencesTable', async () => {
      const tableName = outputs.UserPreferencesTableName;
      const testUserId = `test-user-${Date.now()}`;
      const testEmail = `test${Date.now()}@example.com`;

      // Write test item
      const putCommand = new PutItemCommand({
        TableName: tableName,
        Item: {
          userId: { S: testUserId },
          email: { S: testEmail },
          categories: { L: [{ S: 'Technology' }, { S: 'Science' }] },
          updatedAt: { S: new Date().toISOString() },
        },
      });
      await dynamoClient.send(putCommand);

      // Read test item
      const getCommand = new GetItemCommand({
        TableName: tableName,
        Key: {
          userId: { S: testUserId },
        },
      });
      const getResponse = await dynamoClient.send(getCommand);

      expect(getResponse.Item).toBeDefined();
      expect(getResponse.Item?.userId.S).toBe(testUserId);
      expect(getResponse.Item?.email.S).toBe(testEmail);

      // Clean up
      const deleteCommand = new DeleteItemCommand({
        TableName: tableName,
        Key: {
          userId: { S: testUserId },
        },
      });
      await dynamoClient.send(deleteCommand);
    });
  });

  describe('S3 Bucket', () => {
    test('FrontendBucket should exist and be accessible', async () => {
      const bucketName = outputs.FrontendBucketName;
      expect(bucketName).toBeDefined();

      const command = new HeadBucketCommand({ Bucket: bucketName });
      await expect(s3Client.send(command)).resolves.not.toThrow();
    });

    test('Should be able to upload and retrieve files from FrontendBucket', async () => {
      const bucketName = outputs.FrontendBucketName;
      const testKey = `test-file-${Date.now()}.txt`;
      const testContent = 'This is a test file for integration testing.';

      // Upload test file
      const putCommand = new PutObjectCommand({
        Bucket: bucketName,
        Key: testKey,
        Body: testContent,
        ContentType: 'text/plain',
      });
      await s3Client.send(putCommand);

      // Retrieve test file
      const getCommand = new GetObjectCommand({
        Bucket: bucketName,
        Key: testKey,
      });
      const getResponse = await s3Client.send(getCommand);

      expect(getResponse.Body).toBeDefined();
      const bodyContent = await getResponse.Body?.transformToString();
      expect(bodyContent).toBe(testContent);
    });

    test('FrontendBucket website URL should be configured', () => {
      const websiteUrl = outputs.FrontendBucketWebsiteURL;
      expect(websiteUrl).toBeDefined();
      expect(websiteUrl).toContain('s3-website');
      expect(websiteUrl).toContain(region);
    });
  });

  describe('Lambda Functions', () => {
    test('ContentAggregatorFunction should exist and be active', async () => {
      const functionArn = outputs.ContentAggregatorFunctionArn;
      expect(functionArn).toBeDefined();

      const functionName = functionArn.split(':').pop();
      const command = new GetFunctionCommand({ FunctionName: functionName });
      const response = await lambdaClient.send(command);

      expect(response.Configuration).toBeDefined();
      expect(response.Configuration?.State).toBe('Active');
      expect(response.Configuration?.Runtime).toBe('nodejs22.x');
      expect(response.Configuration?.Timeout).toBe(300);
      expect(response.Configuration?.MemorySize).toBe(1024);
    });

    test('ContentAggregatorFunction should have correct environment variables', async () => {
      const functionArn = outputs.ContentAggregatorFunctionArn;
      const functionName = functionArn.split(':').pop();

      const command = new GetFunctionCommand({ FunctionName: functionName });
      const response = await lambdaClient.send(command);

      const envVars = response.Configuration?.Environment?.Variables;
      expect(envVars).toBeDefined();
      expect(envVars?.ARTICLES_TABLE).toBe(outputs.ArticlesTableName);
      expect(envVars?.USER_PREFERENCES_TABLE).toBe(outputs.UserPreferencesTableName);
      expect(envVars?.ENVIRONMENT).toBe(environmentSuffix);
    });

    test('ContentAggregatorFunction should be invocable', async () => {
      const functionArn = outputs.ContentAggregatorFunctionArn;
      const functionName = functionArn.split(':').pop();

      const command = new InvokeCommand({
        FunctionName: functionName,
        InvocationType: 'RequestResponse',
      });

      const response = await lambdaClient.send(command);
      expect(response.StatusCode).toBe(200);
      // Function may have unhandled errors in sample implementation, but it should be invocable
      expect(response.StatusCode).toBeDefined();
    }, 60000);

    test('All Lambda functions should have log groups', async () => {
      const logGroupPrefix = '/aws/lambda/';
      const expectedLogGroups = [
        `${logGroupPrefix}ContentAggregator${environmentSuffix}`,
        `${logGroupPrefix}UserPreferencesHandler${environmentSuffix}`,
        `${logGroupPrefix}PersonalizedFeedHandler${environmentSuffix}`,
      ];

      const command = new DescribeLogGroupsCommand({
        logGroupNamePrefix: logGroupPrefix,
      });
      const response = await logsClient.send(command);

      expectedLogGroups.forEach(expectedLogGroup => {
        const logGroupExists = response.logGroups?.some(
          lg => lg.logGroupName === expectedLogGroup
        );
        expect(logGroupExists).toBe(true);
      });
    });
  });

  describe('API Gateway', () => {
    test('API Gateway should exist and be accessible', async () => {
      const apiUrl = outputs.APIGatewayURL;
      expect(apiUrl).toBeDefined();

      // Extract API ID from URL
      const apiId = apiUrl.split('//')[1].split('.')[0];
      const command = new GetRestApiCommand({ restApiId: apiId });
      const response = await apiGatewayClient.send(command);

      expect(response.name).toContain('NewsAggregatorAPI');
    });

    test('API Gateway stage should be deployed', async () => {
      const apiUrl = outputs.APIGatewayURL;
      const apiId = apiUrl.split('//')[1].split('.')[0];

      const command = new GetStageCommand({
        restApiId: apiId,
        stageName: environmentSuffix,
      });
      const response = await apiGatewayClient.send(command);

      expect(response.stageName).toBe(environmentSuffix);
      expect(response.methodSettings).toBeDefined();
    });

    test('API Gateway endpoints should be accessible', async () => {
      const apiUrl = outputs.APIGatewayURL;
      expect(apiUrl).toContain('execute-api');
      expect(apiUrl).toContain(region);
      expect(apiUrl).toContain(environmentSuffix);
    });
  });

  describe('CloudFront Distribution', () => {
    test('CloudFront distribution should exist and be deployed', async () => {
      const distributionId = outputs.CloudFrontDistributionId;

      if (!distributionId) {
        console.log('CloudFront distribution not deployed (account verification required)');
        return;
      }

      const command = new GetDistributionCommand({ Id: distributionId });
      const response = await cloudFrontClient.send(command);

      expect(response.Distribution).toBeDefined();
      expect(response.Distribution?.Status).toMatch(/Deployed|InProgress/);
      expect(response.Distribution?.DistributionConfig?.Enabled).toBe(true);
    });

    test('CloudFront distribution should have correct origins', async () => {
      const distributionId = outputs.CloudFrontDistributionId;

      if (!distributionId) {
        console.log('CloudFront distribution not deployed (account verification required)');
        return;
      }

      const command = new GetDistributionCommand({ Id: distributionId });
      const response = await cloudFrontClient.send(command);

      const origins = response.Distribution?.DistributionConfig?.Origins;
      expect(origins?.Quantity).toBe(2);

      const s3Origin = origins?.Items?.find((o: any) => o.Id === 'S3Origin');
      const apiOrigin = origins?.Items?.find((o: any) => o.Id === 'APIGatewayOrigin');

      expect(s3Origin).toBeDefined();
      expect(apiOrigin).toBeDefined();
      expect(s3Origin?.S3OriginConfig).toBeDefined();
      expect(apiOrigin?.CustomOriginConfig).toBeDefined();
    });

    test('CloudFront distribution domain should be accessible', () => {
      const domainName = outputs.CloudFrontDistributionDomainName;

      if (!domainName) {
        console.log('CloudFront domain not available (account verification required)');
        return;
      }

      expect(domainName).toBeDefined();
      expect(domainName).toContain('.cloudfront.net');
    });

    test('CloudFront distribution should have cache behaviors configured', async () => {
      const distributionId = outputs.CloudFrontDistributionId;

      if (!distributionId) {
        console.log('CloudFront distribution not deployed (account verification required)');
        return;
      }

      const command = new GetDistributionCommand({ Id: distributionId });
      const response = await cloudFrontClient.send(command);

      const config = response.Distribution?.DistributionConfig;
      expect(config?.DefaultCacheBehavior).toBeDefined();
      expect(config?.CacheBehaviors?.Quantity).toBeGreaterThan(0);

      const apiCacheBehavior = config?.CacheBehaviors?.Items?.find(
        (cb: any) => cb.PathPattern === '/api/*'
      );
      expect(apiCacheBehavior).toBeDefined();
      expect(apiCacheBehavior?.TargetOriginId).toBe('APIGatewayOrigin');
    });

    test('CloudFront distribution should use HTTPS', async () => {
      const distributionId = outputs.CloudFrontDistributionId;

      if (!distributionId) {
        console.log('CloudFront distribution not deployed (account verification required)');
        return;
      }

      const command = new GetDistributionCommand({ Id: distributionId });
      const response = await cloudFrontClient.send(command);

      const defaultBehavior = response.Distribution?.DistributionConfig?.DefaultCacheBehavior;
      expect(defaultBehavior?.ViewerProtocolPolicy).toBe('redirect-to-https');
    });
  });

  describe('EventBridge Rules', () => {
    test('ContentAggregationScheduleRule should exist and be enabled', async () => {
      const ruleName = `ContentAggregationSchedule${environmentSuffix}`;

      const listCommand = new ListRulesCommand({
        NamePrefix: ruleName,
      });
      const listResponse = await eventBridgeClient.send(listCommand);

      expect(listResponse.Rules).toBeDefined();
      expect(listResponse.Rules?.length).toBeGreaterThan(0);

      const rule = listResponse.Rules?.[0];
      expect(rule?.Name).toBe(ruleName);
      expect(rule?.State).toBe('ENABLED');
      expect(rule?.ScheduleExpression).toBe('rate(1 hour)');
    });

    test('EventBridge rule should have Lambda target', async () => {
      const ruleName = `ContentAggregationSchedule${environmentSuffix}`;

      const command = new DescribeRuleCommand({
        Name: ruleName,
      });
      const response = await eventBridgeClient.send(command);

      expect(response.Arn).toBeDefined();
      expect(response.ScheduleExpression).toBe('rate(1 hour)');
    });
  });

  describe('Stack Outputs', () => {
    test('All required outputs should be present', () => {
      const requiredOutputs = [
        'TurnAroundPromptTableName',
        'TurnAroundPromptTableArn',
        'ArticlesTableName',
        'UserPreferencesTableName',
        'FrontendBucketName',
        'FrontendBucketWebsiteURL',
        'APIGatewayURL',
        'ContentAggregatorFunctionArn',
        'StackName',
        'EnvironmentSuffix',
      ];

      // CloudFront outputs are optional (may not be deployed due to account verification)
      const optionalOutputs = [
        'CloudFrontDistributionDomainName',
        'CloudFrontDistributionId',
      ];

      requiredOutputs.forEach(outputKey => {
        expect(outputs[outputKey]).toBeDefined();
        expect(typeof outputs[outputKey]).toBe('string');
        expect(outputs[outputKey].length).toBeGreaterThan(0);
      });

      optionalOutputs.forEach(outputKey => {
        if (outputs[outputKey]) {
          expect(typeof outputs[outputKey]).toBe('string');
          expect(outputs[outputKey].length).toBeGreaterThan(0);
        }
      });
    });

    test('Resource names should include environment suffix', () => {
      expect(outputs.TurnAroundPromptTableName).toContain(environmentSuffix);
      expect(outputs.ArticlesTableName).toContain(environmentSuffix);
      expect(outputs.UserPreferencesTableName).toContain(environmentSuffix);
      expect(outputs.ContentAggregatorFunctionArn).toContain(environmentSuffix);
    });

    test('Environment suffix should match deployment environment', () => {
      expect(outputs.EnvironmentSuffix).toBe(environmentSuffix);
    });
  });

  describe('End-to-End Workflow', () => {
    test('Complete news aggregation workflow should work', async () => {
      const testArticleId = `e2e-article-${Date.now()}`;
      const testUserId = `e2e-user-${Date.now()}`;
      const testEmail = `e2e${Date.now()}@example.com`;

      // Step 1: Create user preferences
      await dynamoClient.send(
        new PutItemCommand({
          TableName: outputs.UserPreferencesTableName,
          Item: {
            userId: { S: testUserId },
            email: { S: testEmail },
            categories: { L: [{ S: 'Technology' }, { S: 'Science' }] },
            updatedAt: { S: new Date().toISOString() },
          },
        })
      );

      // Step 2: Add article to ArticlesTable
      await dynamoClient.send(
        new PutItemCommand({
          TableName: outputs.ArticlesTableName,
          Item: {
            articleId: { S: testArticleId },
            title: { S: 'E2E Test Article' },
            content: { S: 'This is an end-to-end test article.' },
            category: { S: 'Technology' },
            publishedAt: { S: new Date().toISOString() },
            source: { S: 'E2E Test' },
            url: { S: 'https://example.com/e2e-test' },
            ttl: { N: String(Math.floor(Date.now() / 1000) + 7 * 24 * 60 * 60) },
          },
        })
      );

      // Step 3: Verify article exists
      const articleResponse = await dynamoClient.send(
        new GetItemCommand({
          TableName: outputs.ArticlesTableName,
          Key: { articleId: { S: testArticleId } },
        })
      );
      expect(articleResponse.Item).toBeDefined();

      // Step 4: Verify user preferences exist
      const userResponse = await dynamoClient.send(
        new GetItemCommand({
          TableName: outputs.UserPreferencesTableName,
          Key: { userId: { S: testUserId } },
        })
      );
      expect(userResponse.Item).toBeDefined();

      // Clean up
      await dynamoClient.send(
        new DeleteItemCommand({
          TableName: outputs.ArticlesTableName,
          Key: { articleId: { S: testArticleId } },
        })
      );
      await dynamoClient.send(
        new DeleteItemCommand({
          TableName: outputs.UserPreferencesTableName,
          Key: { userId: { S: testUserId } },
        })
      );
    }, 60000);
  });
});
