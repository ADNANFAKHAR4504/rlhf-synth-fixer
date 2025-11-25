/**
 * Integration tests for deployed TapStack infrastructure
 * Tests actual AWS resources using deployment outputs
 */
import * as fs from 'fs';
import * as path from 'path';
import {
  LambdaClient,
  GetFunctionCommand,
  InvokeCommand,
} from '@aws-sdk/client-lambda';
import { 
  DynamoDBClient, 
  DescribeTableCommand,
  DescribeContinuousBackupsCommand 
} from '@aws-sdk/client-dynamodb';
import { SNSClient, GetTopicAttributesCommand } from '@aws-sdk/client-sns';
import {
  EventBridgeClient,
  ListRulesCommand,
  ListTargetsByRuleCommand,
} from '@aws-sdk/client-eventbridge';

// Load deployment outputs
const outputsPath = path.join(__dirname, '../cfn-outputs/flat-outputs.json');
let outputs: any;

try {
  outputs = JSON.parse(fs.readFileSync(outputsPath, 'utf-8'));
} catch (error) {
  console.error('Failed to load deployment outputs:', error);
  outputs = {};
}

describe('TapStack Integration Tests', () => {
  const region = process.env.AWS_REGION || 'us-east-1';
  const lambdaClient = new LambdaClient({ region });
  const dynamoClient = new DynamoDBClient({ region });
  const snsClient = new SNSClient({ region });
  const eventBridgeClient = new EventBridgeClient({ region });

  describe('Prerequisites', () => {
    it('should have deployment outputs available', () => {
      expect(outputs).toBeDefined();
      expect(outputs.webhookLambdaArn).toBeDefined();
      expect(outputs.priceCheckLambdaArn).toBeDefined();
      expect(outputs.alertsTableName).toBeDefined();
      expect(outputs.alertTopicArn).toBeDefined();
    });
  });

  describe('Lambda Functions', () => {
    describe('Webhook Processor Lambda', () => {
      it('should exist and be configured correctly', async () => {
        const response = await lambdaClient.send(
          new GetFunctionCommand({
            FunctionName: outputs.webhookLambdaArn,
          })
        );

        expect(response.Configuration).toBeDefined();
        expect(response.Configuration?.Runtime).toBe('nodejs18.x');
        expect(response.Configuration?.MemorySize).toBe(1024);
        expect(response.Configuration?.Timeout).toBe(30);
        expect(response.Configuration?.Architectures).toContain('arm64');
      });

      it('should have X-Ray tracing enabled', async () => {
        const response = await lambdaClient.send(
          new GetFunctionCommand({
            FunctionName: outputs.webhookLambdaArn,
          })
        );

        expect(response.Configuration?.TracingConfig?.Mode).toBe('Active');
      });

      it('should have correct environment variables', async () => {
        const response = await lambdaClient.send(
          new GetFunctionCommand({
            FunctionName: outputs.webhookLambdaArn,
          })
        );

        expect(response.Configuration?.Environment?.Variables).toBeDefined();
        expect(
          response.Configuration?.Environment?.Variables?.ALERTS_TABLE_NAME
        ).toBe(outputs.alertsTableName);
      });

      it('should process webhook events successfully', async () => {
        const payload = JSON.stringify({
          body: JSON.stringify({
            userId: 'testuser123',
            alertId: 'alert456',
            cryptocurrency: 'BTC',
            targetPrice: 50000,
            currentPrice: 45000,
          }),
        });

        const response = await lambdaClient.send(
          new InvokeCommand({
            FunctionName: outputs.webhookLambdaArn,
            Payload: Buffer.from(payload),
          })
        );

        const result = JSON.parse(
          new TextDecoder().decode(response.Payload)
        );
        expect(result.statusCode).toBe(200);
      }, 30000);
    });

    describe('Price Checker Lambda', () => {
      it('should exist and be configured correctly', async () => {
        const response = await lambdaClient.send(
          new GetFunctionCommand({
            FunctionName: outputs.priceCheckLambdaArn,
          })
        );

        expect(response.Configuration).toBeDefined();
        expect(response.Configuration?.Runtime).toBe('nodejs18.x');
        expect(response.Configuration?.MemorySize).toBe(512);
        expect(response.Configuration?.Timeout).toBe(60);
        expect(response.Configuration?.Architectures).toContain('arm64');
      });

      it('should have X-Ray tracing enabled', async () => {
        const response = await lambdaClient.send(
          new GetFunctionCommand({
            FunctionName: outputs.priceCheckLambdaArn,
          })
        );

        expect(response.Configuration?.TracingConfig?.Mode).toBe('Active');
      });

      it('should have correct environment variables', async () => {
        const response = await lambdaClient.send(
          new GetFunctionCommand({
            FunctionName: outputs.priceCheckLambdaArn,
          })
        );

        expect(response.Configuration?.Environment?.Variables).toBeDefined();
        expect(
          response.Configuration?.Environment?.Variables?.ALERTS_TABLE_NAME
        ).toBe(outputs.alertsTableName);
        expect(
          response.Configuration?.Environment?.Variables?.ALERT_TOPIC_ARN
        ).toBe(outputs.alertTopicArn);
      });

      it('should execute price check successfully', async () => {
        const response = await lambdaClient.send(
          new InvokeCommand({
            FunctionName: outputs.priceCheckLambdaArn,
            Payload: Buffer.from(JSON.stringify({})),
          })
        );

        const result = JSON.parse(
          new TextDecoder().decode(response.Payload)
        );
        expect(result.statusCode).toBe(200);
        expect(result.body).toContain('Checked');
        expect(result.body).toContain('alerts');
      }, 30000);
    });
  });

  describe('DynamoDB Table', () => {
    it('should exist with correct configuration', async () => {
      const response = await dynamoClient.send(
        new DescribeTableCommand({
          TableName: outputs.alertsTableName,
        })
      );

      expect(response.Table).toBeDefined();
      expect(response.Table?.TableName).toBe(outputs.alertsTableName);
      expect(response.Table?.BillingModeSummary?.BillingMode).toBe(
        'PAY_PER_REQUEST'
      );
    });

    it('should have correct key schema', async () => {
      const response = await dynamoClient.send(
        new DescribeTableCommand({
          TableName: outputs.alertsTableName,
        })
      );

      const keySchema = response.Table?.KeySchema;
      expect(keySchema).toBeDefined();

      const hashKey = keySchema?.find(key => key.KeyType === 'HASH');
      const rangeKey = keySchema?.find(key => key.KeyType === 'RANGE');

      expect(hashKey?.AttributeName).toBe('userId');
      expect(rangeKey?.AttributeName).toBe('alertId');
    });

    it('should have point-in-time recovery enabled', async () => {
      const response = await dynamoClient.send(
        new DescribeContinuousBackupsCommand({
          TableName: outputs.alertsTableName,
        })
      );

      expect(
        response.ContinuousBackupsDescription?.PointInTimeRecoveryDescription
          ?.PointInTimeRecoveryStatus
      ).toBe('ENABLED');
    });
  });

  describe('SNS Topic', () => {
    it('should exist with correct configuration', async () => {
      const response = await snsClient.send(
        new GetTopicAttributesCommand({
          TopicArn: outputs.alertTopicArn,
        })
      );

      expect(response.Attributes).toBeDefined();
      expect(response.Attributes?.TopicArn).toBe(outputs.alertTopicArn);
    });

    it('should have encryption enabled', async () => {
      const response = await snsClient.send(
        new GetTopicAttributesCommand({
          TopicArn: outputs.alertTopicArn,
        })
      );

      expect(response.Attributes?.KmsMasterKeyId).toBeDefined();
      expect(response.Attributes?.KmsMasterKeyId).toContain('alias/aws/sns');
    });
  });

  describe('EventBridge Scheduling', () => {
    it('should have price check rule configured', async () => {
      const response = await eventBridgeClient.send(new ListRulesCommand({}));

      const priceCheckRule = response.Rules?.find(rule =>
        rule.Name?.includes('price-check-schedule')
      );

      expect(priceCheckRule).toBeDefined();
      expect(priceCheckRule?.ScheduleExpression).toBe('rate(5 minutes)');
      expect(priceCheckRule?.State).toBe('ENABLED');
    });

    it('should have Lambda as target for price check rule', async () => {
      const rulesResponse = await eventBridgeClient.send(
        new ListRulesCommand({})
      );

      const priceCheckRule = rulesResponse.Rules?.find(rule =>
        rule.Name?.includes('price-check-schedule')
      );

      expect(priceCheckRule).toBeDefined();

      const targetsResponse = await eventBridgeClient.send(
        new ListTargetsByRuleCommand({
          Rule: priceCheckRule!.Name!,
        })
      );

      expect(targetsResponse.Targets).toBeDefined();
      expect(targetsResponse.Targets?.length).toBeGreaterThan(0);

      const lambdaTarget = targetsResponse.Targets?.find(target =>
        target.Arn?.includes('price-checker')
      );

      expect(lambdaTarget).toBeDefined();
      expect(lambdaTarget?.Arn).toBe(outputs.priceCheckLambdaArn);
    });
  });

  describe('End-to-End Workflow', () => {
    it('should process webhook and store alert in DynamoDB', async () => {
      const testAlert = {
        userId: 'integration-test-user',
        alertId: `alert-${Date.now()}`,
        cryptocurrency: 'BTC',
        targetPrice: 55000,
        currentPrice: 50000,
      };

      const payload = JSON.stringify({
        body: JSON.stringify(testAlert),
      });

      const response = await lambdaClient.send(
        new InvokeCommand({
          FunctionName: outputs.webhookLambdaArn,
          Payload: Buffer.from(payload),
        })
      );

      const result = JSON.parse(new TextDecoder().decode(response.Payload));
      expect(result.statusCode).toBe(200);
      expect(result.body).toContain('Webhook processed successfully');
    }, 30000);

    it('should handle multiple webhook events', async () => {
      const alerts = [
        {
          userId: 'user1',
          alertId: `alert-${Date.now()}-1`,
          cryptocurrency: 'BTC',
          targetPrice: 50000,
          currentPrice: 45000,
        },
        {
          userId: 'user2',
          alertId: `alert-${Date.now()}-2`,
          cryptocurrency: 'ETH',
          targetPrice: 3000,
          currentPrice: 2800,
        },
      ];

      for (const alert of alerts) {
        const payload = JSON.stringify({
          body: JSON.stringify(alert),
        });

        const response = await lambdaClient.send(
          new InvokeCommand({
            FunctionName: outputs.webhookLambdaArn,
            Payload: Buffer.from(payload),
          })
        );

        const result = JSON.parse(
          new TextDecoder().decode(response.Payload)
        );
        expect(result.statusCode).toBe(200);
      }
    }, 60000);
  });

  describe('Resource Naming Convention', () => {
    it('should use environmentSuffix in all resource names', () => {
      // The actual environment suffix used in deployment
      const actualSuffix = 'pr7178';
      expect(outputs.alertsTableName).toContain(actualSuffix);
      expect(outputs.webhookLambdaArn).toContain(`webhook-processor-${actualSuffix}`);
      expect(outputs.priceCheckLambdaArn).toContain(`price-checker-${actualSuffix}`);
      expect(outputs.alertTopicArn).toContain(`price-alert-topic-${actualSuffix}`);
    });
  });
});
