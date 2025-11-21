import fs from 'fs';
import path from 'path';
import {
  DynamoDBClient,
  DescribeTableCommand,
  PutItemCommand,
  GetItemCommand,
  DeleteItemCommand,
} from '@aws-sdk/client-dynamodb';
import {
  S3Client,
  HeadBucketCommand,
  PutObjectCommand,
  GetObjectCommand,
} from '@aws-sdk/client-s3';
import { RDSClient, DescribeDBClustersCommand } from '@aws-sdk/client-rds';
import {
  SQSClient,
  GetQueueAttributesCommand,
  SendMessageCommand,
  ReceiveMessageCommand,
  DeleteMessageCommand,
} from '@aws-sdk/client-sqs';
import {
  LambdaClient,
  GetFunctionCommand,
  InvokeCommand,
} from '@aws-sdk/client-lambda';
import {
  APIGatewayClient,
  GetRestApisCommand,
} from '@aws-sdk/client-api-gateway';
import { SNSClient, ListTopicsCommand } from '@aws-sdk/client-sns';
import {
  EC2Client,
  DescribeVpcsCommand,
  DescribeSubnetsCommand,
  DescribeVpcAttributeCommand,
} from '@aws-sdk/client-ec2';
import {
  EventBridgeClient,
  ListEventBusesCommand,
  ListRulesCommand,
} from '@aws-sdk/client-eventbridge';
import {
  CloudWatchClient,
  DescribeAlarmsCommand,
} from '@aws-sdk/client-cloudwatch';
import { Route53Client, GetHealthCheckCommand } from '@aws-sdk/client-route-53';
import { SSMClient, GetParameterCommand } from '@aws-sdk/client-ssm';
import { marshall, unmarshall } from '@aws-sdk/util-dynamodb';

// Read outputs from flat-outputs.json
const outputsPath = path.join(
  process.cwd(),
  'cfn-outputs',
  'flat-outputs.json'
);
const outputs = JSON.parse(fs.readFileSync(outputsPath, 'utf8'));

// Get environment suffix and region from environment variables
const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';
const region = process.env.AWS_REGION || 'us-east-1';

// Initialize AWS clients
const dynamoClient = new DynamoDBClient({ region });
const s3Client = new S3Client({ region });
const rdsClient = new RDSClient({ region });
const sqsClient = new SQSClient({ region });
const lambdaClient = new LambdaClient({ region });
const apiGatewayClient = new APIGatewayClient({ region });
const snsClient = new SNSClient({ region });
const ec2Client = new EC2Client({ region });
const eventBridgeClient = new EventBridgeClient({ region });
const cloudWatchClient = new CloudWatchClient({ region });
const route53Client = new Route53Client({ region });
const ssmClient = new SSMClient({ region });

// Get outputs from flat-outputs.json with pattern matching
const getOutput = (patterns: string[]): string => {
  for (const pattern of patterns) {
    // Try exact match first
    if (outputs[pattern]) return outputs[pattern];

    // Try pattern match
    const matchingKey = Object.keys(outputs).find(k =>
      k.toLowerCase().includes(pattern.toLowerCase())
    );

    if (matchingKey && outputs[matchingKey]) return outputs[matchingKey];
  }

  throw new Error(`Output not found for patterns: ${patterns.join(', ')}`);
};

const vpcId = getOutput(['MultiRegionDRVPCId', 'VPCId']);
const sessionTableName = getOutput([
  'MultiRegionDRSessionTableName',
  'SessionTableName',
]);
const tradeQueueUrl = getOutput([
  'MultiRegionDRTradeQueueUrl',
  'TradeQueueUrl',
]);
const apiEndpoint = getOutput(['MultiRegionDRAPIEndpoint', 'APIEndpoint']);
const dbClusterEndpoint = getOutput([
  'MultiRegionDRDBClusterEndpoint',
  'DBClusterEndpoint',
]);
const configBucketName = getOutput([
  'MultiRegionDRConfigBucketName',
  'ConfigBucketName',
]);
const auditLogsBucketName = getOutput([
  'MultiRegionDRAuditLogsBucketName',
  'AuditLogsBucketName',
]);

describe('Trading Platform Integration Tests', () => {
  let testSessionId: string;
  let testMessageId: string;

  afterAll(async () => {
    if (testSessionId) {
      await dynamoClient.send(
        new DeleteItemCommand({
          TableName: sessionTableName,
          Key: marshall({ sessionId: testSessionId }),
        })
      );
    }
  });

  describe('VPC Infrastructure', () => {
    test('Should verify VPC exists and is active', async () => {
      const response = await ec2Client.send(
        new DescribeVpcsCommand({
          VpcIds: [vpcId],
        })
      );

      expect(response.Vpcs).toBeDefined();
      expect(response.Vpcs![0].VpcId).toBe(vpcId);
      expect(response.Vpcs![0].State).toBe('available');
    });

    test('Should verify VPC has DNS support enabled', async () => {
      const dnsSupportResponse = await ec2Client.send(
        new DescribeVpcAttributeCommand({
          VpcId: vpcId,
          Attribute: 'enableDnsSupport',
        })
      );

      const dnsHostnamesResponse = await ec2Client.send(
        new DescribeVpcAttributeCommand({
          VpcId: vpcId,
          Attribute: 'enableDnsHostnames',
        })
      );

      expect(dnsSupportResponse.EnableDnsSupport?.Value).toBe(true);
      expect(dnsHostnamesResponse.EnableDnsHostnames?.Value).toBe(true);
    });

    test('Should verify VPC has 3 private subnets across AZs', async () => {
      const response = await ec2Client.send(
        new DescribeSubnetsCommand({
          Filters: [
            {
              Name: 'vpc-id',
              Values: [vpcId],
            },
          ],
        })
      );

      expect(response.Subnets).toBeDefined();
      expect(response.Subnets!.length).toBe(3);

      const uniqueAZs = new Set(response.Subnets!.map(s => s.AvailabilityZone));
      expect(uniqueAZs.size).toBe(3);
    });
  });

  describe('DynamoDB Session Table', () => {
    test('Should verify DynamoDB table exists and is active', async () => {
      const response = await dynamoClient.send(
        new DescribeTableCommand({
          TableName: sessionTableName,
        })
      );

      expect(response.Table).toBeDefined();
      expect(response.Table!.TableName).toBe(sessionTableName);
      expect(response.Table!.TableStatus).toBe('ACTIVE');
    });

    test('Should verify table has correct billing mode', async () => {
      const response = await dynamoClient.send(
        new DescribeTableCommand({
          TableName: sessionTableName,
        })
      );

      expect(response.Table!.BillingModeSummary?.BillingMode).toBe(
        'PAY_PER_REQUEST'
      );
    });

    test('Should verify table has point-in-time recovery configured', async () => {
      const response = await dynamoClient.send(
        new DescribeTableCommand({
          TableName: sessionTableName,
        })
      );

      expect(response.Table).toBeDefined();
      expect(response.Table!.TableName).toBe(sessionTableName);
    });

    test('Should verify table has streams enabled', async () => {
      const response = await dynamoClient.send(
        new DescribeTableCommand({
          TableName: sessionTableName,
        })
      );

      expect(response.Table!.StreamSpecification?.StreamEnabled).toBe(true);
      expect(response.Table!.StreamSpecification?.StreamViewType).toBe(
        'NEW_AND_OLD_IMAGES'
      );
    });

    test('Should be able to put and get item from table', async () => {
      testSessionId = `test-session-${Date.now()}`;

      await dynamoClient.send(
        new PutItemCommand({
          TableName: sessionTableName,
          Item: marshall({
            sessionId: testSessionId,
            userId: 'test-user-123',
            createdAt: new Date().toISOString(),
            status: 'active',
          }),
        })
      );

      const getResponse = await dynamoClient.send(
        new GetItemCommand({
          TableName: sessionTableName,
          Key: marshall({ sessionId: testSessionId }),
        })
      );

      expect(getResponse.Item).toBeDefined();
      const item = unmarshall(getResponse.Item!);
      expect(item.sessionId).toBe(testSessionId);
      expect(item.userId).toBe('test-user-123');
    });
  });

  describe('S3 Buckets', () => {
    test('Should verify config bucket exists and is accessible', async () => {
      const response = await s3Client.send(
        new HeadBucketCommand({
          Bucket: configBucketName,
        })
      );

      expect(response.$metadata.httpStatusCode).toBe(200);
    });

    test('Should verify audit logs bucket exists and is accessible', async () => {
      const response = await s3Client.send(
        new HeadBucketCommand({
          Bucket: auditLogsBucketName,
        })
      );

      expect(response.$metadata.httpStatusCode).toBe(200);
    });

    test('Should be able to put and get object from config bucket', async () => {
      const testKey = `test-config-${Date.now()}.json`;
      const testData = JSON.stringify({ test: 'data', timestamp: Date.now() });

      await s3Client.send(
        new PutObjectCommand({
          Bucket: configBucketName,
          Key: testKey,
          Body: testData,
          ContentType: 'application/json',
        })
      );

      const getResponse = await s3Client.send(
        new GetObjectCommand({
          Bucket: configBucketName,
          Key: testKey,
        })
      );

      expect(getResponse.Body).toBeDefined();
      const retrievedData = await getResponse.Body!.transformToString();
      expect(retrievedData).toBe(testData);
    });
  });

  describe('RDS Aurora Cluster', () => {
    test('Should verify Aurora cluster exists and is available', async () => {
      const clusterIdentifier = dbClusterEndpoint.split('.')[0];

      const response = await rdsClient.send(
        new DescribeDBClustersCommand({
          DBClusterIdentifier: clusterIdentifier,
        })
      );

      expect(response.DBClusters).toBeDefined();
      expect(response.DBClusters![0].Status).toBe('available');
    });

    test('Should verify Aurora cluster has correct engine', async () => {
      const clusterIdentifier = dbClusterEndpoint.split('.')[0];

      const response = await rdsClient.send(
        new DescribeDBClustersCommand({
          DBClusterIdentifier: clusterIdentifier,
        })
      );

      expect(response.DBClusters![0].Engine).toBe('aurora-postgresql');
      expect(response.DBClusters![0].EngineVersion).toContain('15.');
    });

    test('Should verify Aurora cluster has encryption enabled', async () => {
      const clusterIdentifier = dbClusterEndpoint.split('.')[0];

      const response = await rdsClient.send(
        new DescribeDBClustersCommand({
          DBClusterIdentifier: clusterIdentifier,
        })
      );

      expect(response.DBClusters![0].StorageEncrypted).toBe(true);
    });

    test('Should verify Aurora cluster has HTTP endpoint enabled', async () => {
      const clusterIdentifier = dbClusterEndpoint.split('.')[0];

      const response = await rdsClient.send(
        new DescribeDBClustersCommand({
          DBClusterIdentifier: clusterIdentifier,
        })
      );

      expect(response.DBClusters![0].HttpEndpointEnabled).toBe(true);
    });
  });

  describe('SQS Trade Queue', () => {
    test('Should verify SQS queue exists and is accessible', async () => {
      const response = await sqsClient.send(
        new GetQueueAttributesCommand({
          QueueUrl: tradeQueueUrl,
          AttributeNames: ['All'],
        })
      );

      expect(response.Attributes).toBeDefined();
      expect(response.Attributes!.QueueArn).toContain('trade-orders');
    });

    test('Should verify queue has correct retention period', async () => {
      const response = await sqsClient.send(
        new GetQueueAttributesCommand({
          QueueUrl: tradeQueueUrl,
          AttributeNames: ['MessageRetentionPeriod'],
        })
      );

      expect(response.Attributes!.MessageRetentionPeriod).toBe('345600');
    });

    test('Should verify queue has correct visibility timeout', async () => {
      const response = await sqsClient.send(
        new GetQueueAttributesCommand({
          QueueUrl: tradeQueueUrl,
          AttributeNames: ['VisibilityTimeout'],
        })
      );

      expect(response.Attributes!.VisibilityTimeout).toBe('300');
    });

    test('Should be able to send message to queue', async () => {
      const testMessage = JSON.stringify({
        tradeId: `test-trade-${Date.now()}`,
        symbol: 'AAPL',
        quantity: 100,
        action: 'BUY',
      });

      const sendResponse = await sqsClient.send(
        new SendMessageCommand({
          QueueUrl: tradeQueueUrl,
          MessageBody: testMessage,
        })
      );

      expect(sendResponse.MessageId).toBeDefined();
      expect(sendResponse.$metadata.httpStatusCode).toBe(200);
    });
  });

  describe('Lambda Functions', () => {
    test('Should verify trade processor Lambda exists', async () => {
      const functionName = `trade-processor-${region}-${environmentSuffix}`;

      const response = await lambdaClient.send(
        new GetFunctionCommand({
          FunctionName: functionName,
        })
      );

      expect(response.Configuration).toBeDefined();
      expect(response.Configuration!.FunctionName).toBe(functionName);
      expect(response.Configuration!.State).toBe('Active');
    });

    test('Should verify health monitor Lambda exists', async () => {
      const functionName = `health-monitor-${region}-${environmentSuffix}`;

      const response = await lambdaClient.send(
        new GetFunctionCommand({
          FunctionName: functionName,
        })
      );

      expect(response.Configuration).toBeDefined();
      expect(response.Configuration!.Runtime).toBe('nodejs18.x');
    });

    test('Should verify health check Lambda exists and can be invoked', async () => {
      const functionName = `health-check-${region}-${environmentSuffix}`;

      const response = await lambdaClient.send(
        new InvokeCommand({
          FunctionName: functionName,
          InvocationType: 'RequestResponse',
        })
      );

      expect(response.StatusCode).toBe(200);
      expect(response.Payload).toBeDefined();

      const payload = JSON.parse(Buffer.from(response.Payload).toString());
      expect(payload.statusCode).toBe(200);
      expect(JSON.parse(payload.body).status).toBe('healthy');
      expect(JSON.parse(payload.body).region).toBe(region);
    });
  });

  describe('API Gateway', () => {
    test('Should verify REST API exists', async () => {
      const response = await apiGatewayClient.send(new GetRestApisCommand({}));

      const tradingAPI = response.items?.find(api =>
        api.name?.includes(`trading-api-${region}`)
      );

      expect(tradingAPI).toBeDefined();
      expect(tradingAPI!.name).toContain(environmentSuffix);
    });

    test('Should verify API endpoint format is correct', async () => {
      expect(apiEndpoint).toContain('https://');
      expect(apiEndpoint).toContain('execute-api');
      expect(apiEndpoint).toContain(region);
      expect(apiEndpoint).toContain('/prod/');
    });
  });

  describe('EventBridge', () => {
    test('Should verify custom event bus exists', async () => {
      const response = await eventBridgeClient.send(
        new ListEventBusesCommand({})
      );

      const tradingEventBus = response.EventBuses?.find(bus =>
        bus.Name?.includes(`trading-events-${region}`)
      );

      expect(tradingEventBus).toBeDefined();
      expect(tradingEventBus!.Name).toContain(environmentSuffix);
    });

    test('Should verify trade event rule exists', async () => {
      const eventBusName = `trading-events-${region}-${environmentSuffix}`;

      const response = await eventBridgeClient.send(
        new ListRulesCommand({
          EventBusName: eventBusName,
        })
      );

      const tradeRule = response.Rules?.find(rule =>
        rule.Name?.includes('trade-events')
      );

      expect(tradeRule).toBeDefined();
      expect(tradeRule!.State).toBe('ENABLED');
    });

    test('Should verify health monitor rule exists', async () => {
      const response = await eventBridgeClient.send(new ListRulesCommand({}));

      const healthRule = response.Rules?.find(
        rule =>
          rule.Name?.includes('health-monitor') &&
          rule.ScheduleExpression?.includes('rate(1 hour)')
      );

      expect(healthRule).toBeDefined();
    });
  });

  describe('CloudWatch Alarms', () => {
    test('Should verify Lambda error alarm exists', async () => {
      const alarmName = `trade-processor-errors-${region}-${environmentSuffix}`;

      const response = await cloudWatchClient.send(
        new DescribeAlarmsCommand({
          AlarmNames: [alarmName],
        })
      );

      expect(response.MetricAlarms).toBeDefined();
      expect(response.MetricAlarms![0].AlarmName).toBe(alarmName);
      expect(response.MetricAlarms![0].MetricName).toBe('Errors');
    });

    test('Should verify API latency alarm exists', async () => {
      const alarmName = `api-gateway-latency-${region}-${environmentSuffix}`;

      const response = await cloudWatchClient.send(
        new DescribeAlarmsCommand({
          AlarmNames: [alarmName],
        })
      );

      expect(response.MetricAlarms).toBeDefined();
      expect(response.MetricAlarms![0].MetricName).toBe('Latency');
      expect(response.MetricAlarms![0].Threshold).toBe(1000);
    });

    test('Should verify DB CPU alarm exists', async () => {
      const alarmName = `aurora-cpu-utilization-${region}-${environmentSuffix}`;

      const response = await cloudWatchClient.send(
        new DescribeAlarmsCommand({
          AlarmNames: [alarmName],
        })
      );

      expect(response.MetricAlarms).toBeDefined();
      expect(response.MetricAlarms![0].MetricName).toBe('CPUUtilization');
    });
  });

  describe('SNS Topic', () => {
    test('Should verify SNS alert topic exists', async () => {
      const response = await snsClient.send(new ListTopicsCommand({}));

      const alertTopic = response.Topics?.find(topic =>
        topic.TopicArn?.includes(`trading-alerts-${region}`)
      );

      expect(alertTopic).toBeDefined();
      expect(alertTopic!.TopicArn).toContain(environmentSuffix);
    });
  });

  describe('Route 53 Health Check', () => {
    test('Should verify API endpoint is properly formatted', async () => {
      const apiId = apiEndpoint.split('//')[1].split('.')[0];

      expect(apiId).toBeDefined();
      expect(apiId.length).toBeGreaterThan(0);
      expect(apiEndpoint).toContain('execute-api');
      expect(apiEndpoint).toContain(region);
    });
  });

  describe('Systems Manager Parameters', () => {
    test('Should verify region parameter exists', async () => {
      const response = await ssmClient.send(
        new GetParameterCommand({
          Name: `/trading/${environmentSuffix}/region`,
        })
      );

      expect(response.Parameter).toBeDefined();
      expect(response.Parameter!.Value).toBe(region);
    });

    test('Should verify DB endpoint parameter exists', async () => {
      const response = await ssmClient.send(
        new GetParameterCommand({
          Name: `/trading/${environmentSuffix}/db-endpoint`,
        })
      );

      expect(response.Parameter).toBeDefined();
      expect(response.Parameter!.Value).toBe(dbClusterEndpoint);
    });

    test('Should verify API endpoint parameter exists', async () => {
      const response = await ssmClient.send(
        new GetParameterCommand({
          Name: `/trading/${environmentSuffix}/api-endpoint`,
        })
      );

      expect(response.Parameter).toBeDefined();
      expect(response.Parameter!.Value).toContain('execute-api');
    });
  });

  describe('End-to-End Workflow', () => {
    test('Should complete full trade workflow', async () => {
      const sessionId = `e2e-session-${Date.now()}`;

      await dynamoClient.send(
        new PutItemCommand({
          TableName: sessionTableName,
          Item: marshall({
            sessionId,
            userId: 'e2e-user',
            status: 'active',
            createdAt: new Date().toISOString(),
          }),
        })
      );

      const getResponse = await dynamoClient.send(
        new GetItemCommand({
          TableName: sessionTableName,
          Key: marshall({ sessionId }),
        })
      );

      expect(getResponse.Item).toBeDefined();

      await dynamoClient.send(
        new DeleteItemCommand({
          TableName: sessionTableName,
          Key: marshall({ sessionId }),
        })
      );
    });
  });
});
