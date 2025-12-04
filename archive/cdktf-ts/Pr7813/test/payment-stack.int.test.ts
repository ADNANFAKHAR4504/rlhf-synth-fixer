import * as AWS from 'aws-sdk';
import * as fs from 'fs';
import * as path from 'path';

// Load outputs from the deployed stack
const loadOutputs = (): any => {
  const outputPath = path.join(__dirname, '..', 'cfn-outputs', 'flat-outputs.json');
  if (fs.existsSync(outputPath)) {
    return JSON.parse(fs.readFileSync(outputPath, 'utf-8'));
  }
  return {};
};

describe('Payment Processing Infrastructure Integration Tests', () => {
  let outputs: any;
  let lambda: AWS.Lambda;
  let dynamodb: AWS.DynamoDB.DocumentClient;
  let dynamodbClient: AWS.DynamoDB;
  let s3: AWS.S3;
  let apigateway: AWS.APIGateway;
  let cloudwatch: AWS.CloudWatch;
  let sns: AWS.SNS;
  let ec2: AWS.EC2;

  const region = process.env.AWS_REGION || 'us-east-2';

  beforeAll(() => {
    // Load deployed stack outputs
    outputs = loadOutputs();

    // Initialize AWS SDK clients
    lambda = new AWS.Lambda({ region });
    dynamodb = new AWS.DynamoDB.DocumentClient({ region });
    dynamodbClient = new AWS.DynamoDB({ region });
    s3 = new AWS.S3({ region });
    apigateway = new AWS.APIGateway({ region });
    cloudwatch = new AWS.CloudWatch({ region });
    sns = new AWS.SNS({ region });
    ec2 = new AWS.EC2({ region });
  });

  describe('VPC Infrastructure', () => {
    test('VPC exists and is available', async () => {
      if (!outputs['vpc-id']) {
        console.warn('VPC ID not found in outputs, skipping test');
        return;
      }

      const result = await ec2.describeVpcs({
        VpcIds: [outputs['vpc-id']],
      }).promise();

      expect(result.Vpcs).toBeDefined();
      expect(result.Vpcs!.length).toBe(1);
      expect(result.Vpcs![0].State).toBe('available');
      expect(result.Vpcs![0].CidrBlock).toBe('10.0.0.0/16');
    }, 30000);

    test('VPC has DNS support and hostnames enabled', async () => {
      if (!outputs['vpc-id']) {
        console.warn('VPC ID not found in outputs, skipping test');
        return;
      }

      const dnsSupport = await ec2.describeVpcAttribute({
        VpcId: outputs['vpc-id'],
        Attribute: 'enableDnsSupport',
      }).promise();

      const dnsHostnames = await ec2.describeVpcAttribute({
        VpcId: outputs['vpc-id'],
        Attribute: 'enableDnsHostnames',
      }).promise();

      expect(dnsSupport.EnableDnsSupport?.Value).toBe(true);
      expect(dnsHostnames.EnableDnsHostnames?.Value).toBe(true);
    }, 30000);

    test('VPC has 6 subnets (3 public + 3 private)', async () => {
      if (!outputs['vpc-id']) {
        console.warn('VPC ID not found in outputs, skipping test');
        return;
      }

      const result = await ec2.describeSubnets({
        Filters: [
          {
            Name: 'vpc-id',
            Values: [outputs['vpc-id']],
          },
        ],
      }).promise();

      expect(result.Subnets).toBeDefined();
      expect(result.Subnets!.length).toBe(6);
    }, 30000);

    test('NAT Gateways are available', async () => {
      if (!outputs['vpc-id']) {
        console.warn('VPC ID not found in outputs, skipping test');
        return;
      }

      const result = await ec2.describeNatGateways({
        Filter: [
          {
            Name: 'vpc-id',
            Values: [outputs['vpc-id']],
          },
        ],
      }).promise();

      expect(result.NatGateways).toBeDefined();
      expect(result.NatGateways!.length).toBeGreaterThanOrEqual(1);

      result.NatGateways!.forEach((natGw) => {
        expect(['available', 'pending']).toContain(natGw.State);
      });
    }, 30000);
  });

  describe('DynamoDB Table', () => {
    test('transactions table exists and is active', async () => {
      if (!outputs['dynamodb-table-name']) {
        console.warn('DynamoDB table name not found in outputs, skipping test');
        return;
      }

      const result = await dynamodbClient
        .describeTable({
          TableName: outputs['dynamodb-table-name'],
        })
        .promise();

      expect(result.Table).toBeDefined();
      expect(result.Table!.TableStatus).toBe('ACTIVE');
      expect(result.Table!.BillingModeSummary?.BillingMode).toBe('PAY_PER_REQUEST');
    }, 30000);

    test('table has correct key schema', async () => {
      if (!outputs['dynamodb-table-name']) {
        console.warn('DynamoDB table name not found in outputs, skipping test');
        return;
      }

      const result = await dynamodbClient
        .describeTable({
          TableName: outputs['dynamodb-table-name'],
        })
        .promise();

      const keySchema = result.Table!.KeySchema;
      expect(keySchema).toBeDefined();
      expect(keySchema!.length).toBe(2);

      const hashKey = keySchema!.find((k) => k.KeyType === 'HASH');
      const rangeKey = keySchema!.find((k) => k.KeyType === 'RANGE');

      expect(hashKey?.AttributeName).toBe('transactionId');
      expect(rangeKey?.AttributeName).toBe('timestamp');
    }, 30000);

    test('table has point-in-time recovery enabled', async () => {
      if (!outputs['dynamodb-table-name']) {
        console.warn('DynamoDB table name not found in outputs, skipping test');
        return;
      }

      const result = await dynamodbClient
        .describeContinuousBackups({
          TableName: outputs['dynamodb-table-name'],
        })
        .promise();

      expect(result.ContinuousBackupsDescription?.PointInTimeRecoveryDescription?.PointInTimeRecoveryStatus).toBe(
        'ENABLED'
      );
    }, 30000);

    test('can write and read from table', async () => {
      if (!outputs['dynamodb-table-name']) {
        console.warn('DynamoDB table name not found in outputs, skipping test');
        return;
      }

      const testItem = {
        transactionId: `TEST-${Date.now()}`,
        timestamp: Date.now(),
        status: 'test',
        amount: 100,
      };

      await dynamodb
        .put({
          TableName: outputs['dynamodb-table-name'],
          Item: testItem,
        })
        .promise();

      const result = await dynamodb
        .get({
          TableName: outputs['dynamodb-table-name'],
          Key: {
            transactionId: testItem.transactionId,
            timestamp: testItem.timestamp,
          },
        })
        .promise();

      expect(result.Item).toBeDefined();
      expect(result.Item!.transactionId).toBe(testItem.transactionId);
      expect(result.Item!.amount).toBe(testItem.amount);

      // Clean up
      await dynamodb
        .delete({
          TableName: outputs['dynamodb-table-name'],
          Key: {
            transactionId: testItem.transactionId,
            timestamp: testItem.timestamp,
          },
        })
        .promise();
    }, 30000);
  });

  describe('S3 Bucket', () => {
    test('audit logs bucket exists', async () => {
      if (!outputs['s3-bucket-name']) {
        console.warn('S3 bucket name not found in outputs, skipping test');
        return;
      }

      const result = await s3
        .headBucket({
          Bucket: outputs['s3-bucket-name'],
        })
        .promise();

      expect(result).toBeDefined();
    }, 30000);

    test('bucket has versioning enabled', async () => {
      if (!outputs['s3-bucket-name']) {
        console.warn('S3 bucket name not found in outputs, skipping test');
        return;
      }

      const result = await s3
        .getBucketVersioning({
          Bucket: outputs['s3-bucket-name'],
        })
        .promise();

      expect(result.Status).toBe('Enabled');
    }, 30000);

    test('bucket has encryption enabled', async () => {
      if (!outputs['s3-bucket-name']) {
        console.warn('S3 bucket name not found in outputs, skipping test');
        return;
      }

      const result = await s3
        .getBucketEncryption({
          Bucket: outputs['s3-bucket-name'],
        })
        .promise();

      expect(result.ServerSideEncryptionConfiguration?.Rules).toBeDefined();
      expect(result.ServerSideEncryptionConfiguration!.Rules!.length).toBeGreaterThan(0);
    }, 30000);

    test('can write and read objects from bucket', async () => {
      if (!outputs['s3-bucket-name']) {
        console.warn('S3 bucket name not found in outputs, skipping test');
        return;
      }

      const testKey = `test-${Date.now()}.json`;
      const testData = { test: 'data', timestamp: Date.now() };

      await s3
        .putObject({
          Bucket: outputs['s3-bucket-name'],
          Key: testKey,
          Body: JSON.stringify(testData),
          ContentType: 'application/json',
        })
        .promise();

      const result = await s3
        .getObject({
          Bucket: outputs['s3-bucket-name'],
          Key: testKey,
        })
        .promise();

      expect(result.Body).toBeDefined();
      const retrievedData = JSON.parse(result.Body!.toString());
      expect(retrievedData.test).toBe('data');

      // Clean up
      await s3
        .deleteObject({
          Bucket: outputs['s3-bucket-name'],
          Key: testKey,
        })
        .promise();
    }, 30000);
  });

  describe('Lambda Functions', () => {
    test('validator Lambda function exists and is active', async () => {
      if (!outputs['validator-function-name']) {
        console.warn('Validator function name not found in outputs, skipping test');
        return;
      }

      const result = await lambda
        .getFunction({
          FunctionName: outputs['validator-function-name'],
        })
        .promise();

      expect(result.Configuration).toBeDefined();
      expect(result.Configuration!.State).toBe('Active');
      expect(result.Configuration!.MemorySize).toBe(512);
      expect(result.Configuration!.Timeout).toBe(30);
    }, 30000);

    test('processor Lambda function exists and is active', async () => {
      if (!outputs['processor-function-name']) {
        console.warn('Processor function name not found in outputs, skipping test');
        return;
      }

      const result = await lambda
        .getFunction({
          FunctionName: outputs['processor-function-name'],
        })
        .promise();

      expect(result.Configuration).toBeDefined();
      expect(result.Configuration!.State).toBe('Active');
      expect(result.Configuration!.MemorySize).toBe(512);
      expect(result.Configuration!.Timeout).toBe(30);
    }, 30000);

    test('notifier Lambda function exists and is active', async () => {
      if (!outputs['notifier-function-name']) {
        console.warn('Notifier function name not found in outputs, skipping test');
        return;
      }

      const result = await lambda
        .getFunction({
          FunctionName: outputs['notifier-function-name'],
        })
        .promise();

      expect(result.Configuration).toBeDefined();
      expect(result.Configuration!.State).toBe('Active');
      expect(result.Configuration!.MemorySize).toBe(512);
      expect(result.Configuration!.Timeout).toBe(30);
    }, 30000);

    test('Lambda functions have reserved concurrency configured', async () => {
      if (!outputs['validator-function-name']) {
        console.warn('Validator function name not found in outputs, skipping test');
        return;
      }

      const result = await lambda
        .getFunctionConcurrency({
          FunctionName: outputs['validator-function-name'],
        })
        .promise();

      expect(result.ReservedConcurrentExecutions).toBeDefined();
      expect(result.ReservedConcurrentExecutions).toBeGreaterThan(0);
    }, 30000);

    test('validator Lambda function can be invoked', async () => {
      if (!outputs['validator-function-name']) {
        console.warn('Validator function name not found in outputs, skipping test');
        return;
      }

      const testPayload = {
        body: JSON.stringify({
          amount: 100,
          currency: 'USD',
          paymentMethod: 'credit_card',
        }),
      };

      const result = await lambda
        .invoke({
          FunctionName: outputs['validator-function-name'],
          Payload: JSON.stringify(testPayload),
        })
        .promise();

      expect(result.StatusCode).toBe(200);
      expect(result.Payload).toBeDefined();

      const response = JSON.parse(result.Payload as string);
      expect(response.statusCode).toBe(200);
    }, 30000);
  });

  describe('CloudWatch Monitoring', () => {
    test('CloudWatch log groups exist for Lambda functions', async () => {
      if (!outputs['validator-function-name']) {
        console.warn('Validator function name not found in outputs, skipping test');
        return;
      }

      const logGroupName = `/aws/lambda/${outputs['validator-function-name']}`;

      const result = await new AWS.CloudWatchLogs({ region }).describeLogGroups({
        logGroupNamePrefix: logGroupName,
      }).promise();

      expect(result.logGroups).toBeDefined();
      expect(result.logGroups!.length).toBeGreaterThan(0);
      expect(result.logGroups![0].retentionInDays).toBe(7);
    }, 30000);

    test('CloudWatch alarms exist for Lambda errors', async () => {
      const result = await cloudwatch
        .describeAlarms({
          AlarmNamePrefix: 'payment-',
        })
        .promise();

      expect(result.MetricAlarms).toBeDefined();
      expect(result.MetricAlarms!.length).toBeGreaterThanOrEqual(3);

      const errorAlarms = result.MetricAlarms!.filter(
        (alarm) => alarm.MetricName === 'Errors' && alarm.Namespace === 'AWS/Lambda'
      );

      expect(errorAlarms.length).toBeGreaterThanOrEqual(1);
    }, 30000);
  });

  describe('API Gateway', () => {
    test('API Gateway endpoint is accessible', async () => {
      if (!outputs['api-gateway-url']) {
        console.warn('API Gateway URL not found in outputs, skipping test');
        return;
      }

      // Use Node.js https module for API testing
      const https = require('https');
      const url = new URL(outputs['api-gateway-url']);

      const makeRequest = (): Promise<{ statusCode: number; body: string }> => {
        return new Promise((resolve, reject) => {
          const postData = JSON.stringify({
            amount: 50,
            currency: 'USD',
            paymentMethod: 'credit_card',
          });

          const options = {
            hostname: url.hostname,
            path: url.pathname,
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Content-Length': Buffer.byteLength(postData),
            },
          };

          const req = https.request(options, (res: any) => {
            let body = '';
            res.on('data', (chunk: any) => {
              body += chunk;
            });
            res.on('end', () => {
              resolve({ statusCode: res.statusCode, body });
            });
          });

          req.on('error', reject);
          req.write(postData);
          req.end();
        });
      };

      const response = await makeRequest();
      expect(response.statusCode).toBe(200);

      const responseBody = JSON.parse(response.body);
      expect(responseBody.transactionId).toBeDefined();
      expect(responseBody.status).toBe('validated');
    }, 30000);
  });

  describe('End-to-End Payment Flow', () => {
    test('complete payment flow from API to DynamoDB', async () => {
      if (!outputs['api-gateway-url'] || !outputs['dynamodb-table-name']) {
        console.warn('Required outputs not found, skipping end-to-end test');
        return;
      }

      // Step 1: Submit payment via API Gateway
      const https = require('https');
      const url = new URL(outputs['api-gateway-url']);

      const makeRequest = (): Promise<{ statusCode: number; body: string }> => {
        return new Promise((resolve, reject) => {
          const postData = JSON.stringify({
            amount: 250,
            currency: 'USD',
            paymentMethod: 'debit_card',
          });

          const options = {
            hostname: url.hostname,
            path: url.pathname,
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Content-Length': Buffer.byteLength(postData),
            },
          };

          const req = https.request(options, (res: any) => {
            let body = '';
            res.on('data', (chunk: any) => {
              body += chunk;
            });
            res.on('end', () => {
              resolve({ statusCode: res.statusCode, body });
            });
          });

          req.on('error', reject);
          req.write(postData);
          req.end();
        });
      };

      const response = await makeRequest();
      expect(response.statusCode).toBe(200);

      const responseBody = JSON.parse(response.body);
      const transactionId = responseBody.transactionId;
      const timestamp = responseBody.timestamp;

      expect(transactionId).toBeDefined();
      expect(timestamp).toBeDefined();

      // Step 2: Wait a moment for DynamoDB write
      await new Promise((resolve) => setTimeout(resolve, 2000));

      // Step 3: Verify transaction in DynamoDB
      const dbResult = await dynamodb
        .get({
          TableName: outputs['dynamodb-table-name'],
          Key: {
            transactionId,
            timestamp,
          },
        })
        .promise();

      expect(dbResult.Item).toBeDefined();
      expect(dbResult.Item!.status).toBe('validated');
      expect(dbResult.Item!.amount).toBe(250);

      // Clean up
      await dynamodb
        .delete({
          TableName: outputs['dynamodb-table-name'],
          Key: {
            transactionId,
            timestamp,
          },
        })
        .promise();
    }, 45000);
  });
});
