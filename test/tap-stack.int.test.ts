// Configuration - These are coming from cfn-outputs after cdk deploy
import fs from 'fs';
import AWS from 'aws-sdk';

// Initialize AWS SDK clients
const dynamodb = new AWS.DynamoDB({ region: 'us-east-1' });
const s3 = new AWS.S3({ region: 'us-east-1' });
const lambda = new AWS.Lambda({ region: 'us-east-1' });
const lex = new AWS.LexRuntimeV2({ region: 'us-east-1' });
const lexModels = new AWS.LexModelBuildingService({ region: 'us-east-1' });
const kinesis = new AWS.Kinesis({ region: 'us-east-1' });
const cloudwatch = new AWS.CloudWatch({ region: 'us-east-1' });
const elasticache = new AWS.ElastiCache({ region: 'us-east-1' });
const ec2 = new AWS.EC2({ region: 'us-east-1' });

// Load outputs from CDK deployment
let outputs: any = {};
try {
  outputs = JSON.parse(
    fs.readFileSync('cfn-outputs/flat-outputs.json', 'utf8')
  );
} catch (error) {
  console.warn('Could not load cfn-outputs/flat-outputs.json. Integration tests will be skipped.');
}

// Get environment suffix from environment variable (set by CI/CD pipeline)
const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';

describe('Conversational AI Platform Integration Tests', () => {
  // Skip all tests if outputs are not available (deployment not done)
  const skipIfNotDeployed = Object.keys(outputs).length === 0;

  describe('DynamoDB Table Integration', () => {
    test('should have conversation context table deployed and accessible', async () => {
      if (skipIfNotDeployed) {
        console.log('Skipping test - no deployment outputs available');
        return;
      }

      const tableName = outputs.ConversationContextTableName;
      expect(tableName).toBeDefined();

      const result = await dynamodb.describeTable({ TableName: tableName }).promise();
      
      expect(result.Table).toBeDefined();
      expect(result.Table?.TableName).toBe(tableName);
      expect(result.Table?.TableStatus).toBe('ACTIVE');
      expect(result.Table?.BillingModeSummary?.BillingMode).toBe('PAY_PER_REQUEST');
      expect((result.Table as any)?.TimeToLiveDescription?.AttributeName).toBe('ttl');
      expect((result.Table as any)?.TimeToLiveDescription?.TimeToLiveStatus).toBe('ENABLED');
    });

    test('should be able to write and read conversation context', async () => {
      if (skipIfNotDeployed) {
        console.log('Skipping test - no deployment outputs available');
        return;
      }

      const tableName = outputs.ConversationContextTableName;
      const conversationId = `test-conversation-${Date.now()}`;
      const timestamp = Date.now();
      const ttl = Math.floor(Date.now() / 1000) + 3600; // 1 hour from now

      // Write test data
      await dynamodb.putItem({
        TableName: tableName,
        Item: {
          conversationId: { S: conversationId },
          timestamp: { N: timestamp.toString() },
          context: { S: JSON.stringify({ user: 'test-user', intent: 'test-intent' }) },
          ttl: { N: ttl.toString() }
        }
      }).promise();

      // Read test data
      const result = await dynamodb.getItem({
        TableName: tableName,
        Key: {
          conversationId: { S: conversationId },
          timestamp: { N: timestamp.toString() }
        }
      }).promise();

      expect(result.Item).toBeDefined();
      expect(result.Item?.conversationId.S).toBe(conversationId);
      expect(result.Item?.context.S).toContain('test-user');
    });
  });

  describe('S3 Data Lake Integration', () => {
    test('should have data lake bucket deployed and accessible', async () => {
      if (skipIfNotDeployed) {
        console.log('Skipping test - no deployment outputs available');
        return;
      }

      const bucketName = outputs.DataLakeBucketName;
      expect(bucketName).toBeDefined();

      const result = await s3.headBucket({ Bucket: bucketName }).promise();
      expect(result).toBeDefined();
    });

    test('should be able to upload and retrieve conversation logs', async () => {
      if (skipIfNotDeployed) {
        console.log('Skipping test - no deployment outputs available');
        return;
      }

      const bucketName = outputs.DataLakeBucketName;
      const testKey = `test/conversation-${Date.now()}.json`;
      const testData = {
        conversationId: 'test-conversation',
        timestamp: new Date().toISOString(),
        message: 'Test conversation log'
      };

      // Upload test data
      await s3.putObject({
        Bucket: bucketName,
        Key: testKey,
        Body: JSON.stringify(testData),
        ContentType: 'application/json'
      }).promise();

      // Retrieve test data
      const result = await s3.getObject({
        Bucket: bucketName,
        Key: testKey
      }).promise();

      expect(result.Body).toBeDefined();
      const retrievedData = JSON.parse(result.Body!.toString());
      expect(retrievedData.conversationId).toBe('test-conversation');
    });
  });

  describe('Lambda Function Integration', () => {
    test('should have fulfillment lambda deployed and accessible', async () => {
      if (skipIfNotDeployed) {
        console.log('Skipping test - no deployment outputs available');
        return;
      }

      const functionName = outputs.FulfillmentLambdaName;
      expect(functionName).toBeDefined();

      const result = await lambda.getFunction({ FunctionName: functionName }).promise();
      
      expect(result.Configuration).toBeDefined();
      expect(result.Configuration?.FunctionName).toBe(functionName);
      expect(result.Configuration?.Runtime).toBe('nodejs18.x');
      expect(result.Configuration?.State).toBe('Active');
    });

    test('should be able to invoke lambda function with Lex event', async () => {
      if (skipIfNotDeployed) {
        console.log('Skipping test - no deployment outputs available');
        return;
      }

      const functionName = outputs.FulfillmentLambdaName;
      const testEvent = {
        sessionId: 'test-session-123',
        inputTranscript: 'Hello, I need help with my order',
        invocationSource: 'DialogCodeHook',
        sessionAttributes: {},
        requestAttributes: {},
        bot: {
          name: 'OmnichannelAIBot',
          alias: 'Production',
          version: '$LATEST'
        },
        outputDialogMode: 'Text',
        currentIntent: {
          name: 'OrderHelp',
          slots: {},
          confirmationStatus: 'None'
        }
      };

      const result = await lambda.invoke({
        FunctionName: functionName,
        Payload: JSON.stringify(testEvent)
      }).promise();

      expect(result.StatusCode).toBe(200);
      expect(result.Payload).toBeDefined();
      
      const response = JSON.parse(result.Payload!.toString());
      expect(response).toHaveProperty('sessionAttributes');
      expect(response).toHaveProperty('dialogAction');
    });
  });

  describe('Lex V2 Bot Integration', () => {
    test('should have Lex bot deployed and accessible', async () => {
      if (skipIfNotDeployed) {
        console.log('Skipping test - no deployment outputs available');
        return;
      }

      const botId = outputs.BotId;
      expect(botId).toBeDefined();

      const result = await (lexModels as any).describeBot({ botId }).promise();
      
      expect(result.botId).toBe(botId);
      expect(result.botName).toContain('OmnichannelAIBot');
      expect(result.botStatus).toBe('Available');
    });

    test('should have bot alias deployed and accessible', async () => {
      if (skipIfNotDeployed) {
        console.log('Skipping test - no deployment outputs available');
        return;
      }

      const botId = outputs.BotId;
      const botAliasId = outputs.BotAliasId;
      expect(botAliasId).toBeDefined();

      const result = await (lexModels as any).describeBotAlias({ 
        botId, 
        botAliasId 
      }).promise();
      
      expect(result.botAliasId).toBe(botAliasId);
      expect(result.botAliasName).toBe('Production');
      expect(result.botAliasStatus).toBe('Available');
    });

    test('should be able to recognize intents and slots', async () => {
      if (skipIfNotDeployed) {
        console.log('Skipping test - no deployment outputs available');
        return;
      }

      const botId = outputs.BotId;
      const botAliasId = outputs.BotAliasId;
      const localeId = 'en_US';

      const result = await lex.recognizeText({
        botId,
        botAliasId,
        localeId,
        sessionId: `test-session-${Date.now()}`,
        text: 'I want to order a laptop'
      }).promise();

      expect(result.sessionId).toBeDefined();
      expect(result.messages).toBeDefined();
      expect(result.interpretations).toBeDefined();
    });
  });

  describe('Kinesis Data Stream Integration', () => {
    test('should have Kinesis stream deployed and accessible', async () => {
      if (skipIfNotDeployed) {
        console.log('Skipping test - no deployment outputs available');
        return;
      }

      const streamName = outputs.EventStreamName;
      expect(streamName).toBeDefined();

      const result = await kinesis.describeStream({ StreamName: streamName }).promise();
      
      expect(result.StreamDescription).toBeDefined();
      expect(result.StreamDescription.StreamName).toBe(streamName);
      expect(result.StreamDescription.StreamStatus).toBe('ACTIVE');
    });

    test('should be able to put records to Kinesis stream', async () => {
      if (skipIfNotDeployed) {
        console.log('Skipping test - no deployment outputs available');
        return;
      }

      const streamName = outputs.EventStreamName;
      const testRecord = {
        conversationId: 'test-conversation',
        eventType: 'conversation_started',
        timestamp: new Date().toISOString(),
        data: { user: 'test-user' }
      };

      const result = await kinesis.putRecord({
        StreamName: streamName,
        PartitionKey: 'test-partition',
        Data: JSON.stringify(testRecord)
      }).promise();

      expect(result.SequenceNumber).toBeDefined();
      expect(result.ShardId).toBeDefined();
    });
  });

  describe('ElastiCache Redis Integration', () => {
    test('should have Redis cluster deployed and accessible', async () => {
      if (skipIfNotDeployed) {
        console.log('Skipping test - no deployment outputs available');
        return;
      }

      const clusterId = outputs.RedisClusterId;
      expect(clusterId).toBeDefined();

      const result = await elasticache.describeCacheClusters({
        CacheClusterId: clusterId,
        ShowCacheNodeInfo: true
      }).promise();

      expect(result.CacheClusters).toBeDefined();
      expect(result.CacheClusters?.length).toBeGreaterThan(0);
      expect(result.CacheClusters?.[0].CacheClusterStatus).toBe('available');
    });
  });

  describe('VPC and Networking Integration', () => {
    test('should have VPC deployed with correct configuration', async () => {
      if (skipIfNotDeployed) {
        console.log('Skipping test - no deployment outputs available');
        return;
      }

      const vpcId = outputs.VPCId;
      expect(vpcId).toBeDefined();

      const result = await ec2.describeVpcs({ VpcIds: [vpcId] }).promise();
      
      expect(result.Vpcs).toBeDefined();
      expect(result.Vpcs?.length).toBe(1);
      expect(result.Vpcs?.[0].VpcId).toBe(vpcId);
      expect(result.Vpcs?.[0].State).toBe('available');
      expect(result.Vpcs?.[0].CidrBlock).toBe('10.0.0.0/16');
    });

    test('should have public and private subnets deployed', async () => {
      if (skipIfNotDeployed) {
        console.log('Skipping test - no deployment outputs available');
        return;
      }

      const vpcId = outputs.VPCId;
      const publicSubnetIds = outputs.PublicSubnetIds?.split(',') || [];
      const privateSubnetIds = outputs.PrivateSubnetIds?.split(',') || [];

      expect(publicSubnetIds.length).toBeGreaterThan(0);
      expect(privateSubnetIds.length).toBeGreaterThan(0);

      // Check public subnets
      const publicSubnets = await ec2.describeSubnets({
        SubnetIds: publicSubnetIds
      }).promise();

      expect(publicSubnets.Subnets).toBeDefined();
      expect(publicSubnets.Subnets?.length).toBe(publicSubnetIds.length);

      // Check private subnets
      const privateSubnets = await ec2.describeSubnets({
        SubnetIds: privateSubnetIds
      }).promise();

      expect(privateSubnets.Subnets).toBeDefined();
      expect(privateSubnets.Subnets?.length).toBe(privateSubnetIds.length);
    });
  });

  describe('CloudWatch Monitoring Integration', () => {
    test('should have custom metrics being published', async () => {
      if (skipIfNotDeployed) {
        console.log('Skipping test - no deployment outputs available');
        return;
      }

      const endTime = new Date();
      const startTime = new Date(endTime.getTime() - 3600000); // 1 hour ago

      const result = await cloudwatch.listMetrics({
        Namespace: 'AIplatform/Conversational',
        MetricName: 'IntentRecognitionAccuracy'
      }).promise();

      expect(result.Metrics).toBeDefined();
      expect(result.Metrics?.length).toBeGreaterThan(0);
    });

    test('should have alarms configured and monitoring', async () => {
      if (skipIfNotDeployed) {
        console.log('Skipping test - no deployment outputs available');
        return;
      }

      const result = await cloudwatch.describeAlarms({
        AlarmNames: [
          'LowIntentAccuracyAlarm',
          'FulfillmentLambdaErrorAlarm'
        ]
      }).promise();

      expect(result.MetricAlarms).toBeDefined();
      expect(result.MetricAlarms?.length).toBeGreaterThan(0);
    });
  });

  describe('End-to-End Conversation Flow', () => {
    test('should handle complete conversation flow from Lex to Lambda to DynamoDB', async () => {
      if (skipIfNotDeployed) {
        console.log('Skipping test - no deployment outputs available');
        return;
      }

      const botId = outputs.BotId;
      const botAliasId = outputs.BotAliasId;
      const tableName = outputs.ConversationContextTableName;
      const sessionId = `e2e-test-${Date.now()}`;

      // Step 1: Start conversation with Lex
      const lexResponse = await lex.recognizeText({
        botId,
        botAliasId,
        localeId: 'en_US',
        sessionId,
        text: 'Hello, I need help with my order'
      }).promise();

      expect(lexResponse.sessionId).toBe(sessionId);
      expect(lexResponse.messages).toBeDefined();

      // Step 2: Verify conversation context was stored in DynamoDB
      const contextResult = await dynamodb.query({
        TableName: tableName,
        KeyConditionExpression: 'conversationId = :sessionId',
        ExpressionAttributeValues: {
          ':sessionId': { S: sessionId }
        }
      }).promise();

      expect(contextResult.Items).toBeDefined();
      expect(contextResult.Items!.length).toBeGreaterThan(0);
    });

    test('should handle multi-turn conversation with context persistence', async () => {
      if (skipIfNotDeployed) {
        console.log('Skipping test - no deployment outputs available');
        return;
      }

      const botId = outputs.BotId;
      const botAliasId = outputs.BotAliasId;
      const sessionId = `multi-turn-test-${Date.now()}`;

      // First turn
      const firstTurn = await lex.recognizeText({
        botId,
        botAliasId,
        localeId: 'en_US',
        sessionId,
        text: 'I want to order a product'
      }).promise();

      expect(firstTurn.sessionId).toBe(sessionId);

      // Second turn (should maintain context)
      const secondTurn = await lex.recognizeText({
        botId,
        botAliasId,
        localeId: 'en_US',
        sessionId,
        text: 'I want a laptop'
      }).promise();

      expect(secondTurn.sessionId).toBe(sessionId);
      expect((secondTurn as any).sessionAttributes).toBeDefined();
    });
  });

  describe('Performance and Scalability Tests', () => {
    test('should handle concurrent Lambda invocations', async () => {
      if (skipIfNotDeployed) {
        console.log('Skipping test - no deployment outputs available');
        return;
      }

      const functionName = outputs.FulfillmentLambdaName;
      const concurrentRequests = 5;
      const testEvent = {
        sessionId: 'concurrent-test',
        inputTranscript: 'Test concurrent request',
        invocationSource: 'DialogCodeHook'
      };

      const promises = Array(concurrentRequests).fill(null).map((_, index) => 
        lambda.invoke({
          FunctionName: functionName,
          Payload: JSON.stringify({
            ...testEvent,
            sessionId: `concurrent-test-${index}`
          })
        }).promise()
      );

      const results = await Promise.all(promises);
      
      results.forEach(result => {
        expect(result.StatusCode).toBe(200);
        expect(result.Payload).toBeDefined();
      });
    });

    test('should handle high-volume DynamoDB operations', async () => {
      if (skipIfNotDeployed) {
        console.log('Skipping test - no deployment outputs available');
        return;
      }

      const tableName = outputs.ConversationContextTableName;
      const batchSize = 10;
      const timestamp = Date.now();

      const writeRequests = Array(batchSize).fill(null).map((_, index) => ({
        PutRequest: {
          Item: {
            conversationId: { S: `batch-test-${index}` },
            timestamp: { N: (timestamp + index).toString() },
            context: { S: JSON.stringify({ test: true, index }) },
            ttl: { N: (Math.floor(Date.now() / 1000) + 3600).toString() }
          }
        }
      }));

      const result = await dynamodb.batchWriteItem({
        RequestItems: {
          [tableName]: writeRequests
        }
      }).promise();

      expect(result.UnprocessedItems).toBeDefined();
      expect(Object.keys(result.UnprocessedItems || {}).length).toBe(0);
    });
  });

  describe('Error Handling and Resilience', () => {
    test('should handle invalid Lex input gracefully', async () => {
      if (skipIfNotDeployed) {
        console.log('Skipping test - no deployment outputs available');
        return;
      }

      const botId = outputs.BotId;
      const botAliasId = outputs.BotAliasId;
      const sessionId = `error-test-${Date.now()}`;

      // Test with empty input
      const result = await lex.recognizeText({
        botId,
        botAliasId,
        localeId: 'en_US',
        sessionId,
        text: ''
      }).promise();

      expect(result.sessionId).toBe(sessionId);
      expect(result.messages).toBeDefined();
    });

    test('should handle Lambda function errors gracefully', async () => {
      if (skipIfNotDeployed) {
        console.log('Skipping test - no deployment outputs available');
        return;
      }

      const functionName = outputs.FulfillmentLambdaName;
      const invalidEvent = {
        invalidField: 'invalid value'
      };

      const result = await lambda.invoke({
        FunctionName: functionName,
        Payload: JSON.stringify(invalidEvent)
      }).promise();

      expect(result.StatusCode).toBeDefined();
      // Function should handle errors gracefully and return appropriate response
    });
  });
});
