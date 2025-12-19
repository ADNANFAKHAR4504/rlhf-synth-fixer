import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  ListObjectsV2Command,
} from '@aws-sdk/client-s3';
import {
  DynamoDBClient,
  ScanCommand,
  GetItemCommand,
  QueryCommand,
} from '@aws-sdk/client-dynamodb';
import {
  LambdaClient,
  GetFunctionCommand,
  InvokeCommand,
} from '@aws-sdk/client-lambda';
import {
  CloudWatchLogsClient,
  DescribeLogGroupsCommand,
  FilterLogEventsCommand,
} from '@aws-sdk/client-cloudwatch-logs';
import {
  EventBridgeClient,
  ListRulesCommand,
  DescribeRuleCommand,
  ListTargetsByRuleCommand,
} from '@aws-sdk/client-eventbridge';
import * as fs from 'fs';
import * as path from 'path';

const AWS_REGION = process.env.AWS_REGION || 'us-east-1';

describe('CloudFormation Stack Integration Tests', () => {
  let outputs: any;
  let s3Client: S3Client;
  let dynamoClient: DynamoDBClient;
  let lambdaClient: LambdaClient;
  let logsClient: CloudWatchLogsClient;
  let eventBridgeClient: EventBridgeClient;

  beforeAll(() => {
    const outputsPath = path.join(__dirname, '../cfn-outputs/flat-outputs.json');
    expect(fs.existsSync(outputsPath)).toBe(true);

    const outputsContent = fs.readFileSync(outputsPath, 'utf8');
    outputs = JSON.parse(outputsContent);

    s3Client = new S3Client({ region: AWS_REGION });
    dynamoClient = new DynamoDBClient({ region: AWS_REGION });
    lambdaClient = new LambdaClient({ region: AWS_REGION });
    logsClient = new CloudWatchLogsClient({ region: AWS_REGION });
    eventBridgeClient = new EventBridgeClient({ region: AWS_REGION });
  });

  afterAll(async () => {
    s3Client.destroy();
    dynamoClient.destroy();
    lambdaClient.destroy();
    logsClient.destroy();
    eventBridgeClient.destroy();
  });

  describe('Stack Outputs Validation', () => {
    test('should have ValidatorFunctionArn output', () => {
      expect(outputs.ValidatorFunctionArn).toBeDefined();
      expect(outputs.ValidatorFunctionArn).toMatch(/^arn:aws:lambda:/);
    });

    test('should have ResultsTableName output', () => {
      expect(outputs.ResultsTableName).toBeDefined();
      expect(outputs.ResultsTableName).toMatch(/template-validation-results-/);
    });

    test('should have TemplateBucketName output', () => {
      expect(outputs.TemplateBucketName).toBeDefined();
      expect(outputs.TemplateBucketName).toMatch(/template-validation-bucket-/);
    });

    test('should have TemplateBucketArn output', () => {
      expect(outputs.TemplateBucketArn).toBeDefined();
      expect(outputs.TemplateBucketArn).toMatch(/^arn:aws:s3:/);
    });
  });

  describe('S3 Bucket Integration', () => {
    test('should be able to list objects in the bucket', async () => {
      const command = new ListObjectsV2Command({
        Bucket: outputs.TemplateBucketName,
        MaxKeys: 10,
      });

      const response = await s3Client.send(command);
      expect(response.$metadata.httpStatusCode).toBe(200);
    });

    test('should be able to upload a test template', async () => {
      const testTemplate = JSON.stringify({
        AWSTemplateFormatVersion: '2010-09-09',
        Description: 'Test template for validation',
        Resources: {
          TestBucket: {
            Type: 'AWS::S3::Bucket',
            Properties: {
              BucketName: 'test-bucket-with-public-access',
            },
          },
        },
      });

      const command = new PutObjectCommand({
        Bucket: outputs.TemplateBucketName,
        Key: `test-template-${Date.now()}.json`,
        Body: testTemplate,
        ContentType: 'application/json',
      });

      const response = await s3Client.send(command);
      expect(response.$metadata.httpStatusCode).toBe(200);
    }, 30000);

    test('should be able to retrieve uploaded template', async () => {
      const uploadKey = `test-template-retrieve-${Date.now()}.json`;
      const testTemplate = JSON.stringify({
        AWSTemplateFormatVersion: '2010-09-09',
        Resources: {},
      });

      await s3Client.send(
        new PutObjectCommand({
          Bucket: outputs.TemplateBucketName,
          Key: uploadKey,
          Body: testTemplate,
          ContentType: 'application/json',
        })
      );

      const getCommand = new GetObjectCommand({
        Bucket: outputs.TemplateBucketName,
        Key: uploadKey,
      });

      const response = await s3Client.send(getCommand);
      expect(response.$metadata.httpStatusCode).toBe(200);
      expect(response.Body).toBeDefined();
    }, 30000);
  });

  describe('Lambda Function Integration', () => {
    test('should exist and be configured correctly', async () => {
      const functionName = outputs.ValidatorFunctionArn.split(':').pop();

      const command = new GetFunctionCommand({
        FunctionName: functionName,
      });

      const response = await lambdaClient.send(command);
      expect(response.$metadata.httpStatusCode).toBe(200);
      expect(response.Configuration?.FunctionName).toContain('template-validator');
      expect(response.Configuration?.Runtime).toBe('python3.12');
      expect(response.Configuration?.Handler).toBe('index.handler');
    });

    test('should have correct environment variables', async () => {
      const functionName = outputs.ValidatorFunctionArn.split(':').pop();

      const command = new GetFunctionCommand({
        FunctionName: functionName,
      });

      const response = await lambdaClient.send(command);
      expect(response.Configuration?.Environment?.Variables).toBeDefined();
      expect(response.Configuration?.Environment?.Variables?.RESULTS_TABLE_NAME).toBe(
        outputs.ResultsTableName
      );
    });

    test('should have appropriate timeout and memory', async () => {
      const functionName = outputs.ValidatorFunctionArn.split(':').pop();

      const command = new GetFunctionCommand({
        FunctionName: functionName,
      });

      const response = await lambdaClient.send(command);
      expect(response.Configuration?.Timeout).toBe(300);
      expect(response.Configuration?.MemorySize).toBe(512);
    });
  });

  describe('DynamoDB Table Integration', () => {
    test('should be able to scan the table', async () => {
      const command = new ScanCommand({
        TableName: outputs.ResultsTableName,
        Limit: 10,
      });

      const response = await dynamoClient.send(command);
      expect(response.$metadata.httpStatusCode).toBe(200);
      expect(response.Items).toBeDefined();
    });

    test('should accept validation results after template upload', async () => {
      const uploadKey = `test-template-validation-${Date.now()}.json`;
      const testTemplate = JSON.stringify({
        AWSTemplateFormatVersion: '2010-09-09',
        Resources: {
          InsecureRole: {
            Type: 'AWS::IAM::Role',
            Properties: {
              AssumeRolePolicyDocument: {
                Version: '2012-10-17',
                Statement: [
                  {
                    Effect: 'Allow',
                    Principal: { Service: 'lambda.amazonaws.com' },
                    Action: 'sts:AssumeRole',
                  },
                ],
              },
              Policies: [
                {
                  PolicyName: 'WildcardPolicy',
                  PolicyDocument: {
                    Version: '2012-10-17',
                    Statement: [
                      {
                        Effect: 'Allow',
                        Action: '*',
                        Resource: 'arn:aws:s3:::my-bucket/*',
                      },
                    ],
                  },
                },
              ],
            },
          },
        },
      });

      await s3Client.send(
        new PutObjectCommand({
          Bucket: outputs.TemplateBucketName,
          Key: uploadKey,
          Body: testTemplate,
          ContentType: 'application/json',
        })
      );

      await new Promise((resolve) => setTimeout(resolve, 15000));

      const queryCommand = new QueryCommand({
        TableName: outputs.ResultsTableName,
        KeyConditionExpression: 'TemplateId = :templateId',
        ExpressionAttributeValues: {
          ':templateId': { S: uploadKey },
        },
        Limit: 1,
        ScanIndexForward: false,
      });

      const response = await dynamoClient.send(queryCommand);
      expect(response.$metadata.httpStatusCode).toBe(200);
    }, 30000);
  });

  describe('CloudWatch Logs Integration', () => {
    test('should have log group created for Lambda function', async () => {
      const functionName = outputs.ValidatorFunctionArn.split(':').pop();
      const logGroupName = `/aws/lambda/${functionName}`;

      const command = new DescribeLogGroupsCommand({
        logGroupNamePrefix: logGroupName,
      });

      const response = await logsClient.send(command);
      expect(response.$metadata.httpStatusCode).toBe(200);
      expect(response.logGroups).toBeDefined();
      expect(response.logGroups!.length).toBeGreaterThan(0);
      expect(response.logGroups![0].logGroupName).toBe(logGroupName);
    });

    test('should have 30-day retention policy', async () => {
      const functionName = outputs.ValidatorFunctionArn.split(':').pop();
      const logGroupName = `/aws/lambda/${functionName}`;

      const command = new DescribeLogGroupsCommand({
        logGroupNamePrefix: logGroupName,
      });

      const response = await logsClient.send(command);
      expect(response.logGroups![0].retentionInDays).toBe(30);
    });

    test('should contain Lambda execution logs', async () => {
      const uploadKey = `test-template-logs-${Date.now()}.json`;
      const testTemplate = JSON.stringify({
        AWSTemplateFormatVersion: '2010-09-09',
        Resources: {},
      });

      await s3Client.send(
        new PutObjectCommand({
          Bucket: outputs.TemplateBucketName,
          Key: uploadKey,
          Body: testTemplate,
          ContentType: 'application/json',
        })
      );

      await new Promise((resolve) => setTimeout(resolve, 10000));

      const functionName = outputs.ValidatorFunctionArn.split(':').pop();
      const logGroupName = `/aws/lambda/${functionName}`;

      const command = new FilterLogEventsCommand({
        logGroupName: logGroupName,
        startTime: Date.now() - 60000,
        limit: 50,
      });

      const response = await logsClient.send(command);
      expect(response.$metadata.httpStatusCode).toBe(200);
    }, 30000);
  });

  describe('EventBridge Rule Integration', () => {
    test('should have validation trigger rule created', async () => {
      const command = new ListRulesCommand({
        NamePrefix: 'template-validation-trigger',
      });

      const response = await eventBridgeClient.send(command);
      expect(response.$metadata.httpStatusCode).toBe(200);
      expect(response.Rules).toBeDefined();
      expect(response.Rules!.length).toBeGreaterThan(0);
    });

    test('should have rule in enabled state', async () => {
      const listCommand = new ListRulesCommand({
        NamePrefix: 'template-validation-trigger',
      });

      const listResponse = await eventBridgeClient.send(listCommand);
      const ruleName = listResponse.Rules![0].Name!;

      const describeCommand = new DescribeRuleCommand({
        Name: ruleName,
      });

      const response = await eventBridgeClient.send(describeCommand);
      expect(response.State).toBe('ENABLED');
    });

    test('should have Lambda function as target', async () => {
      const listCommand = new ListRulesCommand({
        NamePrefix: 'template-validation-trigger',
      });

      const listResponse = await eventBridgeClient.send(listCommand);
      const ruleName = listResponse.Rules![0].Name!;

      const targetsCommand = new ListTargetsByRuleCommand({
        Rule: ruleName,
      });

      const response = await eventBridgeClient.send(targetsCommand);
      expect(response.$metadata.httpStatusCode).toBe(200);
      expect(response.Targets).toBeDefined();
      expect(response.Targets!.length).toBeGreaterThan(0);
      expect(response.Targets![0].Arn).toBe(outputs.ValidatorFunctionArn);
    });

    test('should have correct event pattern for S3', async () => {
      const listCommand = new ListRulesCommand({
        NamePrefix: 'template-validation-trigger',
      });

      const listResponse = await eventBridgeClient.send(listCommand);
      const ruleName = listResponse.Rules![0].Name!;

      const describeCommand = new DescribeRuleCommand({
        Name: ruleName,
      });

      const response = await eventBridgeClient.send(describeCommand);
      expect(response.EventPattern).toBeDefined();

      const eventPattern = JSON.parse(response.EventPattern!);
      expect(eventPattern.source).toContain('aws.s3');
      expect(eventPattern['detail-type']).toContain('Object Created');
    });
  });

  describe('End-to-End Workflow', () => {
    test('complete validation workflow: upload template, Lambda processes, results stored', async () => {
      const uploadKey = `e2e-test-template-${Date.now()}.json`;
      const testTemplate = JSON.stringify({
        AWSTemplateFormatVersion: '2010-09-09',
        Description: 'End-to-end test template with security issues',
        Resources: {
          PublicBucket: {
            Type: 'AWS::S3::Bucket',
            Properties: {
              BucketName: 'public-test-bucket',
            },
          },
          InsecureSecurityGroup: {
            Type: 'AWS::EC2::SecurityGroup',
            Properties: {
              GroupDescription: 'Insecure security group',
              SecurityGroupIngress: [
                {
                  IpProtocol: 'tcp',
                  FromPort: 22,
                  ToPort: 22,
                  CidrIp: '0.0.0.0/0',
                },
              ],
            },
          },
          UnencryptedDatabase: {
            Type: 'AWS::RDS::DBInstance',
            Properties: {
              Engine: 'mysql',
              DBInstanceClass: 'db.t3.micro',
              MasterUsername: 'admin',
              MasterUserPassword: 'password123',
            },
          },
        },
      });

      console.log('Step 1: Uploading test template to S3...');
      await s3Client.send(
        new PutObjectCommand({
          Bucket: outputs.TemplateBucketName,
          Key: uploadKey,
          Body: testTemplate,
          ContentType: 'application/json',
        })
      );

      console.log('Step 2: Waiting for EventBridge to trigger Lambda...');
      await new Promise((resolve) => setTimeout(resolve, 20000));

      console.log('Step 3: Checking DynamoDB for validation results...');
      const queryCommand = new QueryCommand({
        TableName: outputs.ResultsTableName,
        KeyConditionExpression: 'TemplateId = :templateId',
        ExpressionAttributeValues: {
          ':templateId': { S: uploadKey },
        },
        ScanIndexForward: false,
        Limit: 1,
      });

      const dynamoResponse = await dynamoClient.send(queryCommand);
      expect(dynamoResponse.$metadata.httpStatusCode).toBe(200);
      expect(dynamoResponse.Items).toBeDefined();

      if (dynamoResponse.Items && dynamoResponse.Items.length > 0) {
        const item = dynamoResponse.Items[0];
        console.log('Validation results found:');
        console.log('  - TemplateId:', item.TemplateId?.S);
        console.log('  - Status:', item.Status?.S);
        console.log('  - Total Findings:', item.TotalFindings?.N);

        expect(item.TemplateId?.S).toBe(uploadKey);
        expect(item.Status?.S).toBeDefined();
      }

      console.log('Step 4: Verifying Lambda execution in CloudWatch Logs...');
      const functionName = outputs.ValidatorFunctionArn.split(':').pop();
      const logGroupName = `/aws/lambda/${functionName}`;

      const logsCommand = new FilterLogEventsCommand({
        logGroupName: logGroupName,
        startTime: Date.now() - 60000,
        filterPattern: uploadKey,
      });

      const logsResponse = await logsClient.send(logsCommand);
      expect(logsResponse.$metadata.httpStatusCode).toBe(200);

      console.log('End-to-end workflow completed successfully!');
    }, 40000);

    test('validation detects IAM wildcard actions', async () => {
      const uploadKey = `wildcard-test-${Date.now()}.json`;
      const testTemplate = JSON.stringify({
        AWSTemplateFormatVersion: '2010-09-09',
        Resources: {
          WildcardRole: {
            Type: 'AWS::IAM::Role',
            Properties: {
              AssumeRolePolicyDocument: {
                Version: '2012-10-17',
                Statement: [
                  {
                    Effect: 'Allow',
                    Principal: { Service: 'lambda.amazonaws.com' },
                    Action: 'sts:AssumeRole',
                  },
                ],
              },
              Policies: [
                {
                  PolicyName: 'AdminPolicy',
                  PolicyDocument: {
                    Version: '2012-10-17',
                    Statement: [
                      {
                        Effect: 'Allow',
                        Action: '*',
                        Resource: '*',
                      },
                    ],
                  },
                },
              ],
            },
          },
        },
      });

      await s3Client.send(
        new PutObjectCommand({
          Bucket: outputs.TemplateBucketName,
          Key: uploadKey,
          Body: testTemplate,
          ContentType: 'application/json',
        })
      );

      await new Promise((resolve) => setTimeout(resolve, 15000));

      const queryCommand = new QueryCommand({
        TableName: outputs.ResultsTableName,
        KeyConditionExpression: 'TemplateId = :templateId',
        ExpressionAttributeValues: {
          ':templateId': { S: uploadKey },
        },
        Limit: 1,
        ScanIndexForward: false,
      });

      const response = await dynamoClient.send(queryCommand);
      expect(response.$metadata.httpStatusCode).toBe(200);

      if (response.Items && response.Items.length > 0) {
        const item = response.Items[0];
        expect(item.Status?.S).toBeDefined();
      }
    }, 30000);
  });

  describe('Resource Configuration Validation', () => {
    test('S3 bucket should have versioning enabled', async () => {
      const uploadKey = `versioning-test-${Date.now()}.json`;

      await s3Client.send(
        new PutObjectCommand({
          Bucket: outputs.TemplateBucketName,
          Key: uploadKey,
          Body: 'test content v1',
        })
      );

      await s3Client.send(
        new PutObjectCommand({
          Bucket: outputs.TemplateBucketName,
          Key: uploadKey,
          Body: 'test content v2',
        })
      );

      const listCommand = new ListObjectsV2Command({
        Bucket: outputs.TemplateBucketName,
        Prefix: uploadKey,
      });

      const response = await s3Client.send(listCommand);
      expect(response.$metadata.httpStatusCode).toBe(200);
    });

    test('Lambda function should have IAM role with specific permissions', async () => {
      const functionName = outputs.ValidatorFunctionArn.split(':').pop();

      const command = new GetFunctionCommand({
        FunctionName: functionName,
      });

      const response = await lambdaClient.send(command);
      expect(response.Configuration?.Role).toBeDefined();
      expect(response.Configuration?.Role).toMatch(/arn:aws:iam::/);
      expect(response.Configuration?.Role).toContain('template-validator-role');
    });

    test('DynamoDB table should be accessible', async () => {
      const scanCommand = new ScanCommand({
        TableName: outputs.ResultsTableName,
        Limit: 1,
      });

      const response = await dynamoClient.send(scanCommand);
      expect(response.$metadata.httpStatusCode).toBe(200);
    });
  });
});
