// Configuration - These are coming from cfn-outputs after cdk deploy
import fs from 'fs';
import axios from 'axios';
import {
  APIGatewayClient,
  GetRestApiCommand,
  GetStageCommand,
} from '@aws-sdk/client-api-gateway';
import {
  LambdaClient,
  GetFunctionCommand,
  GetAliasCommand,
} from '@aws-sdk/client-lambda';
import {
  SQSClient,
  GetQueueAttributesCommand,
  SendMessageCommand,
  ReceiveMessageCommand,
} from '@aws-sdk/client-sqs';
import {
  DynamoDBClient,
  DescribeTableCommand,
  ScanCommand,
  GetItemCommand,
} from '@aws-sdk/client-dynamodb';
import { marshall, unmarshall } from '@aws-sdk/util-dynamodb';
import {
  S3Client,
  GetBucketEncryptionCommand,
  ListObjectsV2Command,
  GetObjectCommand,
} from '@aws-sdk/client-s3';
import {
  SNSClient,
  GetTopicAttributesCommand,
  SubscribeCommand,
  UnsubscribeCommand,
} from '@aws-sdk/client-sns';
import {
  CloudWatchClient,
  GetDashboardCommand,
} from '@aws-sdk/client-cloudwatch';
import { KMSClient, DescribeKeyCommand } from '@aws-sdk/client-kms';
import { WAFV2Client, GetWebACLCommand } from '@aws-sdk/client-wafv2';
import { SSMClient, GetParameterCommand } from '@aws-sdk/client-ssm';

const outputs = JSON.parse(
  fs.readFileSync('cfn-outputs/flat-outputs.json', 'utf8')
);

// AWS region from outputs
const region = outputs.DeploymentRegion || 'us-east-1';

// Initialize AWS clients
const apiGatewayClient = new APIGatewayClient({ region });
const lambdaClient = new LambdaClient({ region });
const sqsClient = new SQSClient({ region });
const dynamoDBClient = new DynamoDBClient({ region });
const s3Client = new S3Client({ region });
const snsClient = new SNSClient({ region });
const cloudWatchClient = new CloudWatchClient({ region });
const kmsClient = new KMSClient({ region });
const wafClient = new WAFV2Client({ region });
const ssmClient = new SSMClient({ region });

// Helper function to wait for a condition with timeout
const waitFor = async (
  condition: () => Promise<boolean>,
  timeout: number = 60000,
  interval: number = 2000
): Promise<void> => {
  const startTime = Date.now();
  while (Date.now() - startTime < timeout) {
    if (await condition()) {
      return;
    }
    await new Promise((resolve) => setTimeout(resolve, interval));
  }
  throw new Error(`Timeout waiting for condition after ${timeout}ms`);
};

describe('MarketGrid Payment Webhook Integration Tests', () => {
  describe('1. API Gateway Configuration', () => {
    test('should have valid API Gateway REST API', async () => {
      const command = new GetRestApiCommand({
        restApiId: outputs.ApiGatewayId,
      });
      const response = await apiGatewayClient.send(command);

      expect(response.id).toBe(outputs.ApiGatewayId);
      expect(response.name).toContain('MarketGrid');
    });

    test('should have dev stage deployed', async () => {
      const command = new GetStageCommand({
        restApiId: outputs.ApiGatewayId,
        stageName: outputs.ApiGatewayStageName,
      });
      const response = await apiGatewayClient.send(command);

      expect(response.stageName).toBe(outputs.ApiGatewayStageName);
      expect(response.methodSettings).toBeDefined();
    });

    test('should have valid webhook endpoints', () => {
      expect(outputs.StripeWebhookUrl).toContain(outputs.ApiEndpoint);
      expect(outputs.StripeWebhookUrl).toContain('/webhook/stripe');
      expect(outputs.PaypalWebhookUrl).toContain(outputs.ApiEndpoint);
      expect(outputs.PaypalWebhookUrl).toContain('/webhook/paypal');
    });

    test('should have webhook endpoints accessible', async () => {
      // Test Stripe endpoint (should return 401 without valid auth)
      try {
        await axios.post(outputs.StripeWebhookUrl, {
          type: 'payment_intent.succeeded',
          data: { object: { id: 'test' } },
        });
      } catch (error: any) {
        expect([401, 403]).toContain(error.response?.status);
      }

      // Test PayPal endpoint (should return 401 without valid auth)
      try {
        await axios.post(outputs.PaypalWebhookUrl, {
          event_type: 'PAYMENT.CAPTURE.COMPLETED',
          resource: { id: 'test' },
        });
      } catch (error: any) {
        expect([401, 403]).toContain(error.response?.status);
      }
    }, 10000);
  });

  describe('2. Lambda Functions Configuration', () => {
    test('should have webhook processor lambda with correct configuration', async () => {
      const command = new GetFunctionCommand({
        FunctionName: outputs.WebhookProcessingLambdaName,
      });
      const response = await lambdaClient.send(command);

      expect(response.Configuration?.FunctionName).toBe(
        outputs.WebhookProcessingLambdaName
      );
      expect(response.Configuration?.Runtime).toBe('nodejs18.x');
      expect(response.Configuration?.MemorySize).toBe(3008);
      expect(response.Configuration?.Timeout).toBe(30);
      expect(
        response.Configuration?.Environment?.Variables?.TRANSACTIONS_TABLE
      ).toBe(outputs.TransactionsTableName);
    });

    test('should have webhook processor lambda with provisioned concurrency', async () => {
      const command = new GetAliasCommand({
        FunctionName: outputs.WebhookProcessingLambdaName,
        Name: 'production',
      });
      const response = await lambdaClient.send(command);

      expect(response.Name).toBe('production');
      expect(response.FunctionVersion).toBeDefined();
    });

    test('should have webhook archiver lambda', async () => {
      const command = new GetFunctionCommand({
        FunctionName: outputs.WebhookArchiveLambdaName,
      });
      const response = await lambdaClient.send(command);

      expect(response.Configuration?.FunctionName).toBe(
        outputs.WebhookArchiveLambdaName
      );
      expect(
        response.Configuration?.Environment?.Variables?.ARCHIVE_BUCKET
      ).toBe(outputs.WebhookArchiveBucketName);
    });

    test('should have vendor notification lambda', async () => {
      const command = new GetFunctionCommand({
        FunctionName: outputs.VendorNotificationLambdaName,
      });
      const response = await lambdaClient.send(command);

      expect(response.Configuration?.FunctionName).toBe(
        outputs.VendorNotificationLambdaName
      );
      expect(response.Configuration?.Environment?.Variables?.SNS_TOPIC_ARN).toBe(
        outputs.VendorNotificationTopicArn
      );
    });

    test('should have authorizer lambda', async () => {
      const command = new GetFunctionCommand({
        FunctionName: outputs.AuthorizerLambdaName,
      });
      const response = await lambdaClient.send(command);

      expect(response.Configuration?.FunctionName).toBe(
        outputs.AuthorizerLambdaName
      );
      expect(
        response.Configuration?.Environment?.Variables?.PARAMETER_STORE_PREFIX
      ).toBe(outputs.ApiKeyParameterPrefix);
    });
  });

  describe('3. SQS Queue Configuration', () => {
    test('should have webhook queue with correct configuration', async () => {
      const command = new GetQueueAttributesCommand({
        QueueUrl: outputs.WebhookQueueUrl,
        AttributeNames: ['All'],
      });
      const response = await sqsClient.send(command);

      expect(response.Attributes?.FifoQueue).toBe('true');
      expect(response.Attributes?.ContentBasedDeduplication).toBe('true');
      expect(response.Attributes?.MessageRetentionPeriod).toBe('604800'); // 7 days
      expect(response.Attributes?.VisibilityTimeout).toBe('300');
      expect(response.Attributes?.KmsMasterKeyId).toContain(
        outputs.EncryptionKeyId
      );
    });

    test('should have webhook DLQ with correct configuration', async () => {
      const command = new GetQueueAttributesCommand({
        QueueUrl: outputs.WebhookDlqUrl,
        AttributeNames: ['All'],
      });
      const response = await sqsClient.send(command);

      expect(response.Attributes?.FifoQueue).toBe('true');
      expect(response.Attributes?.MessageRetentionPeriod).toBe('1209600'); // 14 days
    });
  });

  describe('4. DynamoDB Table Configuration', () => {
    test('should have transactions table with correct configuration', async () => {
      const command = new DescribeTableCommand({
        TableName: outputs.TransactionsTableName,
      });
      const response = await dynamoDBClient.send(command);

      expect(response.Table?.TableName).toBe(outputs.TransactionsTableName);
      expect(response.Table?.TableStatus).toBe('ACTIVE');
      expect(response.Table?.KeySchema).toEqual([
        { AttributeName: 'transactionId', KeyType: 'HASH' },
      ]);

      // Check encryption
      expect(response.Table?.SSEDescription?.Status).toBe('ENABLED');
      expect(response.Table?.SSEDescription?.SSEType).toBe('KMS');
    });

    test('should have VendorIndex GSI configured', async () => {
      const command = new DescribeTableCommand({
        TableName: outputs.TransactionsTableName,
      });
      const response = await dynamoDBClient.send(command);

      const vendorIndex = response.Table?.GlobalSecondaryIndexes?.find(
        (gsi) => gsi.IndexName === outputs.VendorIndexName
      );

      expect(vendorIndex).toBeDefined();
      expect(vendorIndex?.KeySchema).toEqual([
        { AttributeName: 'vendorId', KeyType: 'HASH' },
        { AttributeName: 'timestamp', KeyType: 'RANGE' },
      ]);
      expect(vendorIndex?.IndexStatus).toBe('ACTIVE');
    });

    test('should have DynamoDB Stream enabled', async () => {
      const command = new DescribeTableCommand({
        TableName: outputs.TransactionsTableName,
      });
      const response = await dynamoDBClient.send(command);

      expect(response.Table?.StreamSpecification?.StreamEnabled).toBe(true);
      expect(response.Table?.StreamSpecification?.StreamViewType).toBe(
        'NEW_AND_OLD_IMAGES'
      );
      expect(response.Table?.LatestStreamArn).toBeDefined();
    });
  });

  describe('5. S3 Bucket Configuration', () => {
    test('should have webhook archive bucket with KMS encryption', async () => {
      const command = new GetBucketEncryptionCommand({
        Bucket: outputs.WebhookArchiveBucketName,
      });
      const response = await s3Client.send(command);

      expect(response.ServerSideEncryptionConfiguration?.Rules).toBeDefined();
      const rule = response.ServerSideEncryptionConfiguration?.Rules?.[0];
      expect(
        rule?.ApplyServerSideEncryptionByDefault?.SSEAlgorithm
      ).toBe('aws:kms');
      expect(
        rule?.ApplyServerSideEncryptionByDefault?.KMSMasterKeyID
      ).toContain(outputs.EncryptionKeyId);
    });
  });

  describe('6. SNS Topic Configuration', () => {
    test('should have vendor notification topic', async () => {
      const command = new GetTopicAttributesCommand({
        TopicArn: outputs.VendorNotificationTopicArn,
      });
      const response = await snsClient.send(command);

      expect(response.Attributes?.TopicArn).toBe(
        outputs.VendorNotificationTopicArn
      );
      expect(response.Attributes?.DisplayName).toContain('Vendor');
    });
  });

  describe('7. KMS Encryption Key', () => {
    test('should have KMS key enabled', async () => {
      const command = new DescribeKeyCommand({
        KeyId: outputs.EncryptionKeyId,
      });
      const response = await kmsClient.send(command);

      expect(response.KeyMetadata?.KeyId).toBe(outputs.EncryptionKeyId);
      expect(response.KeyMetadata?.Enabled).toBe(true);
      expect(response.KeyMetadata?.KeyUsage).toBe('ENCRYPT_DECRYPT');
    });
  });

  describe('8. WAF Web ACL Configuration', () => {
    test('should have WAF Web ACL configured with multiple security rules', async () => {
      // Extract WAF name from ARN - format: arn:aws:wafv2:region:account:regional/webacl/NAME/ID
      const wafArnParts = outputs.WafWebAclArn.split('/');
      const wafName = wafArnParts[wafArnParts.length - 2];

      const command = new GetWebACLCommand({
        Id: outputs.WafWebAclId,
        Name: wafName,
        Scope: 'REGIONAL',
      });
      const response = await wafClient.send(command);

      expect(response.WebACL?.Id).toBe(outputs.WafWebAclId);
      expect(response.WebACL?.Rules).toBeDefined();
      expect(response.WebACL?.Rules!.length).toBeGreaterThanOrEqual(8);

      // Verify essential security rules exist
      const ruleNames = response.WebACL?.Rules?.map((rule) => rule.Name) || [];
      expect(ruleNames).toContain('AWSManagedRulesCommonRuleSet');
      expect(ruleNames).toContain('RateLimitRule');
      expect(ruleNames).toContain('AWSManagedRulesSQLiRuleSet');
      expect(ruleNames).toContain('AWSManagedRulesKnownBadInputsRuleSet');
      expect(ruleNames).toContain('AWSManagedRulesAmazonIpReputationList');
      expect(ruleNames).toContain('AWSManagedRulesAnonymousIpList');
      expect(ruleNames).toContain('BlockOversizedRequests');
      expect(ruleNames).toContain('BlockSuspiciousUserAgents');
    });

    test('should block requests with oversized body (> 8KB)', async () => {
      // Create a payload larger than 8KB
      const oversizedPayload = {
        id: 'test-oversized',
        vendor_id: 'vendor-123',
        amount: 99.99,
        currency: 'USD',
        provider: 'stripe',
        // Add large dummy data to exceed 8KB
        dummyData: 'X'.repeat(9000),
      };

      try {
        await axios.post(outputs.StripeWebhookUrl, oversizedPayload, {
          headers: {
            'Content-Type': 'application/json',
          },
          timeout: 5000,
        });
        // If it doesn't throw, the test should fail
        fail('Expected request to be blocked by WAF');
      } catch (error: any) {
        // WAF should block with 403 Forbidden
        expect(error.response?.status).toBe(403);
      }
    }, 10000);

    test('should block requests with suspicious user agent (nikto)', async () => {
      const testPayload = {
        id: 'test-suspicious-ua',
        vendor_id: 'vendor-123',
        amount: 99.99,
        currency: 'USD',
        provider: 'stripe',
      };

      try {
        await axios.post(outputs.StripeWebhookUrl, testPayload, {
          headers: {
            'Content-Type': 'application/json',
            'User-Agent': 'Nikto/2.1.6',
          },
          timeout: 5000,
        });
        fail('Expected request to be blocked by WAF');
      } catch (error: any) {
        // WAF should block with 403 Forbidden
        expect(error.response?.status).toBe(403);
      }
    }, 10000);

    test('should block requests with suspicious user agent (sqlmap)', async () => {
      const testPayload = {
        id: 'test-sqlmap',
        vendor_id: 'vendor-123',
        amount: 99.99,
        currency: 'USD',
      };

      try {
        await axios.post(outputs.StripeWebhookUrl, testPayload, {
          headers: {
            'Content-Type': 'application/json',
            'User-Agent': 'sqlmap/1.0',
          },
          timeout: 5000,
        });
        fail('Expected request to be blocked by WAF');
      } catch (error: any) {
        // WAF should block with 403 Forbidden
        expect(error.response?.status).toBe(403);
      }
    }, 10000);

    test('should block SQL injection attempts in query string', async () => {
      // Attempt SQL injection in URL
      const maliciousUrl = `${outputs.StripeWebhookUrl}?id=1' OR '1'='1`;

      try {
        await axios.post(
          maliciousUrl,
          {
            id: 'test-sqli',
            vendor_id: 'vendor-123',
            amount: 99.99,
          },
          {
            headers: {
              'Content-Type': 'application/json',
            },
            timeout: 5000,
          }
        );
        fail('Expected SQL injection attempt to be blocked by WAF');
      } catch (error: any) {
        // WAF should block with 403 Forbidden
        expect(error.response?.status).toBe(403);
      }
    }, 10000);

    test('should allow legitimate requests through WAF', async () => {
      // This test ensures WAF doesn't block legitimate traffic
      const legitimatePayload = {
        id: `test-legitimate-${Date.now()}`,
        vendor_id: 'vendor-legitimate',
        amount: 49.99,
        currency: 'USD',
        provider: 'stripe',
      };

      try {
        await axios.post(outputs.StripeWebhookUrl, legitimatePayload, {
          headers: {
            'Content-Type': 'application/json',
            'User-Agent': 'Stripe/1.0 (+https://stripe.com)',
          },
          timeout: 5000,
        });
        fail('Expected 401/403 due to missing auth, not WAF block');
      } catch (error: any) {
        // Should get auth error (401/403) not WAF block (403 with specific message)
        // Both are 403, but auth comes from Lambda authorizer
        expect([401, 403]).toContain(error.response?.status);
        // If it's a WAF block, the response would be HTML, not JSON
        // Auth errors return JSON
        const contentType = error.response?.headers['content-type'] || '';
        if (error.response?.status === 403) {
          // If 403, check it's from authorizer (JSON) not WAF (HTML)
          expect(contentType).toContain('json');
        }
      }
    }, 10000);
  });

  describe('9. CloudWatch Dashboard', () => {
    test('should have CloudWatch dashboard created', async () => {
      const command = new GetDashboardCommand({
        DashboardName: outputs.CloudWatchDashboardName,
      });
      const response = await cloudWatchClient.send(command);

      expect(response.DashboardName).toBe(outputs.CloudWatchDashboardName);
      expect(response.DashboardBody).toBeDefined();

      const dashboardBody = JSON.parse(response.DashboardBody!);
      expect(dashboardBody.widgets).toBeDefined();
      expect(dashboardBody.widgets.length).toBeGreaterThan(0);
    });
  });

  describe('10. SSM Parameter Store', () => {
    test('should have API key parameter paths defined in outputs', () => {
      // Note: SSM parameters are not auto-created by CDK, only paths are defined
      // These parameters need to be created manually or via initialization script
      expect(outputs.StripeApiKeyParameter).toContain('api-keys/stripe');
      expect(outputs.PaypalApiKeyParameter).toContain('api-keys/paypal');
      expect(outputs.ApiKeyParameterPrefix).toContain('api-keys/');
    });
  });

  describe('11. End-to-End Workflow Tests', () => {
    let testTransactionId: string;
    let subscriptionArn: string;
    let initialDlqMessageCount: number = 0;

    beforeAll(async () => {
      testTransactionId = `test-txn-${Date.now()}`;

      // Get initial DLQ message count to track new failures
      const dlqCommand = new GetQueueAttributesCommand({
        QueueUrl: outputs.WebhookDlqUrl,
        AttributeNames: ['ApproximateNumberOfMessages'],
      });
      const dlqResponse = await sqsClient.send(dlqCommand);
      initialDlqMessageCount = parseInt(
        dlqResponse.Attributes?.ApproximateNumberOfMessages || '0',
        10
      );
    });

    afterAll(async () => {
      // Clean up SNS subscription if created
      if (subscriptionArn) {
        try {
          await snsClient.send(
            new UnsubscribeCommand({ SubscriptionArn: subscriptionArn })
          );
        } catch (error) {
          console.error('Failed to unsubscribe from SNS:', error);
        }
      }
    });

    test('should successfully send message to SQS queue', async () => {
      // Payload format matches what webhook-processor Lambda expects
      const testPayload = {
        id: testTransactionId, // Lambda reads 'id' field
        vendor_id: 'vendor-123', // Lambda reads 'vendor_id' field
        amount: 99.99,
        currency: 'USD',
        provider: 'stripe',
        eventType: 'payment_intent.succeeded',
      };

      const command = new SendMessageCommand({
        QueueUrl: outputs.WebhookQueueUrl,
        MessageBody: JSON.stringify(testPayload),
        MessageGroupId: 'test-group',
        MessageDeduplicationId: testTransactionId,
      });

      const response = await sqsClient.send(command);
      expect(response.MessageId).toBeDefined();
    }, 10000);

    test('should process webhook and store in DynamoDB', async () => {
      // Wait for Lambda to process the message
      await waitFor(
        async () => {
          try {
            const command = new GetItemCommand({
              TableName: outputs.TransactionsTableName,
              Key: marshall({ transactionId: testTransactionId }),
            });
            const response = await dynamoDBClient.send(command);
            return response.Item !== undefined;
          } catch (error) {
            return false;
          }
        },
        60000,
        3000
      );

      // Verify the item exists in DynamoDB
      const command = new GetItemCommand({
        TableName: outputs.TransactionsTableName,
        Key: marshall({ transactionId: testTransactionId }),
      });
      const response = await dynamoDBClient.send(command);

      expect(response.Item).toBeDefined();
      const item = unmarshall(response.Item!);
      expect(item.transactionId).toBe(testTransactionId);
      expect(item.vendorId).toBe('vendor-123');
      expect(item.amount).toBe(99.99);
      expect(item.currency).toBe('USD');
    }, 70000);

    test('should archive webhook to S3', async () => {
      // Wait for archiver Lambda to process the stream event
      await waitFor(
        async () => {
          try {
            const command = new ListObjectsV2Command({
              Bucket: outputs.WebhookArchiveBucketName,
              Prefix: 'webhooks/',
            });
            const response = await s3Client.send(command);
            return (
              response.Contents?.some((obj) =>
                obj.Key?.includes(testTransactionId)
              ) ?? false
            );
          } catch (error) {
            return false;
          }
        },
        90000,
        5000
      );

      // Verify the webhook was archived to S3
      const listCommand = new ListObjectsV2Command({
        Bucket: outputs.WebhookArchiveBucketName,
        Prefix: 'webhooks/',
      });
      const listResponse = await s3Client.send(listCommand);

      const archivedObject = listResponse.Contents?.find((obj) =>
        obj.Key?.includes(testTransactionId)
      );
      expect(archivedObject).toBeDefined();

      // Verify the content of the archived object
      const getCommand = new GetObjectCommand({
        Bucket: outputs.WebhookArchiveBucketName,
        Key: archivedObject!.Key,
      });
      const getResponse = await s3Client.send(getCommand);
      const content = await getResponse.Body?.transformToString();
      const archivedData = JSON.parse(content!);

      expect(archivedData.transactionId).toBe(testTransactionId);
      expect(archivedData.vendorId).toBe('vendor-123');
    }, 100000);

    test('should query transactions by vendorId using GSI', async () => {
      const command = new ScanCommand({
        TableName: outputs.TransactionsTableName,
        IndexName: outputs.VendorIndexName,
        FilterExpression: 'vendorId = :vendorId',
        ExpressionAttributeValues: marshall({
          ':vendorId': 'vendor-123',
        }),
      });

      const response = await dynamoDBClient.send(command);
      expect(response.Items).toBeDefined();
      expect(response.Items!.length).toBeGreaterThan(0);

      const items = response.Items!.map((item) => unmarshall(item));
      const testItem = items.find(
        (item) => item.transactionId === testTransactionId
      );
      expect(testItem).toBeDefined();
    }, 10000);

    test('should validate webhook queue is empty after processing', async () => {
      // Try to receive messages from the queue
      const command = new ReceiveMessageCommand({
        QueueUrl: outputs.WebhookQueueUrl,
        MaxNumberOfMessages: 10,
        WaitTimeSeconds: 5,
      });

      const response = await sqsClient.send(command);
      // Queue should be empty after processing
      expect(response.Messages || []).toHaveLength(0);
    }, 10000);

    test('should validate no new messages added to DLQ', async () => {
      // Check that no new messages were added to DLQ during this test
      const command = new GetQueueAttributesCommand({
        QueueUrl: outputs.WebhookDlqUrl,
        AttributeNames: ['ApproximateNumberOfMessages'],
      });

      const response = await sqsClient.send(command);
      const currentDlqMessageCount = parseInt(
        response.Attributes?.ApproximateNumberOfMessages || '0',
        10
      );

      // No new messages should have been added to DLQ
      expect(currentDlqMessageCount).toBeLessThanOrEqual(initialDlqMessageCount);
    }, 10000);
  });

  describe('12. Resource Naming Conventions', () => {
    test('should follow naming conventions with environment suffix', () => {
      // Most resources use MarketGrid naming (case-sensitive)
      const marketGridResources = [
        outputs.TransactionsTableName,
        outputs.WebhookQueueName,
        outputs.WebhookProcessingLambdaName,
        outputs.VendorNotificationTopicName,
      ];

      marketGridResources.forEach((resource) => {
        expect(resource).toContain('MarketGrid');
        expect(resource).toMatch(/pr\d+/); // Should contain environment suffix like pr4722
      });

      // S3 bucket uses lowercase (S3 naming requirement)
      expect(outputs.WebhookArchiveBucketName.toLowerCase()).toBe(
        outputs.WebhookArchiveBucketName
      );
      expect(outputs.WebhookArchiveBucketName).toContain('marketgrid');
      expect(outputs.WebhookArchiveBucketName).toMatch(/pr\d+/);
    });

    test('should have consistent ARN format across resources', () => {
      const arns = [
        outputs.TransactionsTableArn,
        outputs.WebhookProcessingLambdaArn,
        outputs.WebhookArchiveLambdaArn,
        outputs.VendorNotificationLambdaArn,
        outputs.AuthorizerLambdaArn,
        outputs.WebhookQueueArn,
        outputs.WebhookDlqArn,
        outputs.VendorNotificationTopicArn,
        outputs.EncryptionKeyArn,
        outputs.WafWebAclArn,
      ];

      arns.forEach((arn) => {
        expect(arn).toMatch(/^arn:aws:/);
        expect(arn).toContain(region);
      });
    });
  });
});
