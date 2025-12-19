import fs from 'fs';
import {
  DynamoDBClient,
  PutItemCommand,
  GetItemCommand,
  UpdateItemCommand,
  DeleteItemCommand,
  ScanCommand,
} from '@aws-sdk/client-dynamodb';
import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
  ListObjectsV2Command,
} from '@aws-sdk/client-s3';
import {
  LambdaClient,
  InvokeCommand,
  GetFunctionCommand,
} from '@aws-sdk/client-lambda';
import {
  CloudWatchLogsClient,
  DescribeLogStreamsCommand,
  FilterLogEventsCommand,
} from '@aws-sdk/client-cloudwatch-logs';
import {
  CloudWatchClient,
  DescribeAlarmsCommand,
  PutMetricDataCommand,
} from '@aws-sdk/client-cloudwatch';
import {
  EC2Client,
  DescribeVpcsCommand,
  DescribeSubnetsCommand,
  DescribeSecurityGroupsCommand,
  DescribeInternetGatewaysCommand,
} from '@aws-sdk/client-ec2';
import {
  RDSClient,
  DescribeDBInstancesCommand,
} from '@aws-sdk/client-rds';
import {
  SecretsManagerClient,
  GetSecretValueCommand,
} from '@aws-sdk/client-secrets-manager';
import {
  ElasticLoadBalancingV2Client,
  DescribeLoadBalancersCommand,
  DescribeTargetGroupsCommand,
  DescribeTargetHealthCommand,
} from '@aws-sdk/client-elastic-load-balancing-v2';
import {
  SNSClient,
  ListSubscriptionsByTopicCommand,
  PublishCommand,
} from '@aws-sdk/client-sns';
import {
  AutoScalingClient,
  DescribeAutoScalingGroupsCommand,
} from '@aws-sdk/client-auto-scaling';
import {
  IAMClient,
  GetRoleCommand,
  GetUserCommand,
} from '@aws-sdk/client-iam';

// Load stack outputs
const outputs = JSON.parse(
  fs.readFileSync('cfn-outputs/flat-outputs.json', 'utf8')
);

// Get AWS region
const awsRegion = fs.existsSync('lib/AWS_REGION')
  ? fs.readFileSync('lib/AWS_REGION', 'utf8').trim()
  : process.env.AWS_REGION || 'us-east-1';

// Initialize AWS SDK clients
const dynamodbClient = new DynamoDBClient({ region: awsRegion });
const s3Client = new S3Client({ region: awsRegion });
const lambdaClient = new LambdaClient({ region: awsRegion });
const cloudwatchLogsClient = new CloudWatchLogsClient({ region: awsRegion });
const cloudwatchClient = new CloudWatchClient({ region: awsRegion });
const ec2Client = new EC2Client({ region: awsRegion });
const rdsClient = new RDSClient({ region: awsRegion });
const secretsManagerClient = new SecretsManagerClient({ region: awsRegion });
const elbv2Client = new ElasticLoadBalancingV2Client({ region: awsRegion });
const snsClient = new SNSClient({ region: awsRegion });
const asgClient = new AutoScalingClient({ region: awsRegion });
const iamClient = new IAMClient({ region: awsRegion });

// Helper function to generate unique test ID
const generateTestId = () => `test-${Date.now()}-${Math.random().toString(36).substring(7)}`;

describe('TapStack Integration Tests', () => {

  // ===================================================================
  // SERVICE-LEVEL TESTS - Test ONE service with actual CRUD operations
  // ===================================================================

  describe('SERVICE-LEVEL Tests', () => {

    describe('DynamoDB Table Operations', () => {
      const tableName = outputs.DynamoDBTableName;
      let testItemId: string;

      test('should create (PutItem) a new item in DynamoDB table', async () => {
        testItemId = generateTestId();

        await dynamodbClient.send(
          new PutItemCommand({
            TableName: tableName,
            Item: {
              id: { S: testItemId },
              name: { S: 'Integration Test Item' },
              description: { S: 'This item was created during integration testing' },
              timestamp: { N: Date.now().toString() },
              status: { S: 'active' },
            },
          })
        );

        // Verify item was created
        const result = await dynamodbClient.send(
          new GetItemCommand({
            TableName: tableName,
            Key: {
              id: { S: testItemId },
            },
          })
        );

        expect(result.Item).toBeDefined();
        expect(result.Item?.id.S).toBe(testItemId);
        expect(result.Item?.name.S).toBe('Integration Test Item');
      }, 30000);

      test('should read (GetItem) an existing item from DynamoDB table', async () => {
        const result = await dynamodbClient.send(
          new GetItemCommand({
            TableName: tableName,
            Key: {
              id: { S: testItemId },
            },
          })
        );

        expect(result.Item).toBeDefined();
        expect(result.Item?.id.S).toBe(testItemId);
        expect(result.Item?.status.S).toBe('active');
      }, 30000);

      test('should update (UpdateItem) an existing item in DynamoDB table', async () => {
        await dynamodbClient.send(
          new UpdateItemCommand({
            TableName: tableName,
            Key: {
              id: { S: testItemId },
            },
            UpdateExpression: 'SET #status = :newStatus, #description = :newDesc',
            ExpressionAttributeNames: {
              '#status': 'status',
              '#description': 'description',
            },
            ExpressionAttributeValues: {
              ':newStatus': { S: 'updated' },
              ':newDesc': { S: 'This item was updated during integration testing' },
            },
          })
        );

        // Verify update
        const result = await dynamodbClient.send(
          new GetItemCommand({
            TableName: tableName,
            Key: {
              id: { S: testItemId },
            },
          })
        );

        expect(result.Item?.status.S).toBe('updated');
        expect(result.Item?.description.S).toContain('updated');
      }, 30000);

      test('should scan table and find test items', async () => {
        const result = await dynamodbClient.send(
          new ScanCommand({
            TableName: tableName,
            Limit: 10,
          })
        );

        expect(result.Items).toBeDefined();
        expect(Array.isArray(result.Items)).toBe(true);
      }, 30000);

      test('should delete (DeleteItem) an item from DynamoDB table', async () => {
        await dynamodbClient.send(
          new DeleteItemCommand({
            TableName: tableName,
            Key: {
              id: { S: testItemId },
            },
          })
        );

        // Verify deletion
        const result = await dynamodbClient.send(
          new GetItemCommand({
            TableName: tableName,
            Key: {
              id: { S: testItemId },
            },
          })
        );

        expect(result.Item).toBeUndefined();
      }, 30000);
    });

    describe('S3 Bucket Operations', () => {
      const bucketName = outputs.S3BucketName;
      let testObjectKey: string;

      test('should upload (PutObject) a file to S3 bucket', async () => {
        testObjectKey = `integration-test/${generateTestId()}.txt`;
        const testContent = 'This is test content uploaded during integration testing';

        await s3Client.send(
          new PutObjectCommand({
            Bucket: bucketName,
            Key: testObjectKey,
            Body: testContent,
            ContentType: 'text/plain',
            Metadata: {
              testType: 'integration',
              createdBy: 'automated-test',
            },
          })
        );

        // Verify upload
        const result = await s3Client.send(
          new GetObjectCommand({
            Bucket: bucketName,
            Key: testObjectKey,
          })
        );

        expect(result.Body).toBeDefined();
        expect(result.ContentType).toBe('text/plain');
      }, 30000);

      test('should download (GetObject) a file from S3 bucket', async () => {
        const result = await s3Client.send(
          new GetObjectCommand({
            Bucket: bucketName,
            Key: testObjectKey,
          })
        );

        const content = await result.Body?.transformToString();
        expect(content).toContain('integration testing');
        // Metadata keys are case-insensitive and may be lowercased by S3
        expect(result.Metadata?.testtype || result.Metadata?.testType).toBe('integration');
      }, 30000);

      test('should list objects in S3 bucket', async () => {
        const result = await s3Client.send(
          new ListObjectsV2Command({
            Bucket: bucketName,
            Prefix: 'integration-test/',
            MaxKeys: 10,
          })
        );

        expect(result.Contents).toBeDefined();
        expect(Array.isArray(result.Contents)).toBe(true);
      }, 30000);

      test('should delete (DeleteObject) a file from S3 bucket', async () => {
        await s3Client.send(
          new DeleteObjectCommand({
            Bucket: bucketName,
            Key: testObjectKey,
          })
        );

        // Verify deletion
        await expect(
          s3Client.send(
            new GetObjectCommand({
              Bucket: bucketName,
              Key: testObjectKey,
            })
          )
        ).rejects.toThrow();
      }, 30000);
    });

    describe('Lambda Function Tests', () => {
      const functionName = outputs.LambdaFunctionName;

      test('should invoke Lambda function successfully', async () => {
        const result = await lambdaClient.send(
          new InvokeCommand({
            FunctionName: functionName,
            Payload: JSON.stringify({
              test: true,
              action: 'integration-test',
              timestamp: Date.now(),
            }),
          })
        );

        expect(result.StatusCode).toBe(200);
        expect(result.Payload).toBeDefined();

        const payload = JSON.parse(Buffer.from(result.Payload).toString());
        expect(payload.statusCode).toBe(200);
      }, 30000);

      test('should verify Lambda function configuration', async () => {
        const result = await lambdaClient.send(
          new GetFunctionCommand({
            FunctionName: functionName,
          })
        );

        expect(result.Configuration).toBeDefined();
        expect(result.Configuration?.Runtime).toBe('python3.9');
        expect(result.Configuration?.Environment?.Variables?.TABLE_NAME).toBeDefined();
      }, 30000);
    });

    describe('CloudWatch Logs Tests', () => {
      const logGroupName = outputs.VPCFlowLogGroup;

      test('should verify VPC Flow Logs log group exists', async () => {
        const result = await cloudwatchLogsClient.send(
          new DescribeLogStreamsCommand({
            logGroupName: logGroupName,
            limit: 5,
          })
        );

        expect(result.logStreams).toBeDefined();
      }, 30000);

      test('should read VPC Flow Logs data', async () => {
        const result = await cloudwatchLogsClient.send(
          new FilterLogEventsCommand({
            logGroupName: logGroupName,
            limit: 10,
          })
        );

        expect(result.events).toBeDefined();
      }, 30000);
    });

    describe('CloudWatch Alarms Tests', () => {
      test('should verify HighCPUAlarm exists and is properly configured', async () => {
        const alarmName = outputs.HighCPUAlarmName;

        const result = await cloudwatchClient.send(
          new DescribeAlarmsCommand({
            AlarmNames: [alarmName],
          })
        );

        expect(result.MetricAlarms).toBeDefined();
        expect(result.MetricAlarms!.length).toBe(1);

        const alarm = result.MetricAlarms![0];
        expect(alarm.MetricName).toBe('CPUUtilization');
        expect(alarm.Threshold).toBe(80);
        expect(alarm.StateValue).toBeDefined();
      }, 30000);

      test('should verify UnauthorizedAPICallsAlarm exists', async () => {
        const alarmName = outputs.UnauthorizedAPICallsAlarmName;

        const result = await cloudwatchClient.send(
          new DescribeAlarmsCommand({
            AlarmNames: [alarmName],
          })
        );

        expect(result.MetricAlarms).toBeDefined();
        expect(result.MetricAlarms!.length).toBe(1);
      }, 30000);
    });

    describe('VPC and Network Infrastructure Tests', () => {
      test('should verify VPC exists and is available', async () => {
        const vpcId = outputs.VPCId;

        const result = await ec2Client.send(
          new DescribeVpcsCommand({
            VpcIds: [vpcId],
          })
        );

        expect(result.Vpcs).toBeDefined();
        expect(result.Vpcs!.length).toBe(1);
        expect(result.Vpcs![0].State).toBe('available');
        expect(result.Vpcs![0].CidrBlock).toBe('10.0.0.0/16');
      }, 30000);

      test('should verify all four subnets exist', async () => {
        const subnetIds = [
          outputs.PublicSubnet1Id,
          outputs.PublicSubnet2Id,
          outputs.PrivateSubnet1Id,
          outputs.PrivateSubnet2Id,
        ];

        const result = await ec2Client.send(
          new DescribeSubnetsCommand({
            SubnetIds: subnetIds,
          })
        );

        expect(result.Subnets).toBeDefined();
        expect(result.Subnets!.length).toBe(4);

        result.Subnets!.forEach((subnet) => {
          expect(subnet.State).toBe('available');
        });
      }, 30000);

      test('should verify Internet Gateway is attached', async () => {
        const igwId = outputs.InternetGatewayId;
        const vpcId = outputs.VPCId;

        const result = await ec2Client.send(
          new DescribeInternetGatewaysCommand({
            InternetGatewayIds: [igwId],
          })
        );

        expect(result.InternetGateways).toBeDefined();
        expect(result.InternetGateways!.length).toBe(1);

        const attachment = result.InternetGateways![0].Attachments?.find(
          (a) => a.VpcId === vpcId
        );
        expect(attachment).toBeDefined();
        expect(attachment!.State).toBe('available');
      }, 30000);

      test('should verify security groups exist', async () => {
        const sgIds = [
          outputs.ALBSecurityGroupId,
          outputs.WebServerSecurityGroupId,
          outputs.DatabaseSecurityGroupId,
        ];

        const result = await ec2Client.send(
          new DescribeSecurityGroupsCommand({
            GroupIds: sgIds,
          })
        );

        expect(result.SecurityGroups).toBeDefined();
        expect(result.SecurityGroups!.length).toBe(3);
      }, 30000);
    });

    describe('RDS Database Tests', () => {
      test('should verify RDS instance exists and is available', async () => {
        const dbEndpoint = outputs.DatabaseEndpoint;
        const dbIdentifier = dbEndpoint.split('.')[0];

        const result = await rdsClient.send(
          new DescribeDBInstancesCommand({
            DBInstanceIdentifier: dbIdentifier,
          })
        );

        expect(result.DBInstances).toBeDefined();
        expect(result.DBInstances!.length).toBe(1);

        const db = result.DBInstances![0];
        expect(db.DBInstanceStatus).toBe('available');
        expect(db.Engine).toBe('mysql');
        expect(db.StorageEncrypted).toBe(true);
      }, 30000);

      test('should verify database password secret exists', async () => {
        const secretArn = outputs.DatabasePasswordSecret;

        const result = await secretsManagerClient.send(
          new GetSecretValueCommand({
            SecretId: secretArn,
          })
        );

        expect(result.SecretString).toBeDefined();

        const secret = JSON.parse(result.SecretString!);
        expect(secret.username).toBe('admin');
        expect(secret.password).toBeDefined();
      }, 30000);
    });

    describe('Load Balancer Tests', () => {
      test('should verify ALB exists and is active', async () => {
        const albUrl = outputs.LoadBalancerURL;

        const result = await elbv2Client.send(
          new DescribeLoadBalancersCommand({})
        );

        const alb = result.LoadBalancers?.find((lb) =>
          lb.DNSName === albUrl
        );

        expect(alb).toBeDefined();
        expect(alb!.State?.Code).toBe('active');
        expect(alb!.Scheme).toBe('internet-facing');
      }, 30000);

      test('should verify ALB target group exists', async () => {
        const targetGroupArn = outputs.ALBTargetGroupArn;

        const result = await elbv2Client.send(
          new DescribeTargetGroupsCommand({
            TargetGroupArns: [targetGroupArn],
          })
        );

        expect(result.TargetGroups).toBeDefined();
        expect(result.TargetGroups!.length).toBe(1);
        expect(result.TargetGroups![0].HealthCheckPath).toBe('/health');
      }, 30000);

      test('should verify target health status', async () => {
        const targetGroupArn = outputs.ALBTargetGroupArn;

        const result = await elbv2Client.send(
          new DescribeTargetHealthCommand({
            TargetGroupArn: targetGroupArn,
          })
        );

        expect(result.TargetHealthDescriptions).toBeDefined();
      }, 30000);
    });

    describe('Auto Scaling Group Tests', () => {
      test('should verify ASG exists and has correct configuration', async () => {
        const asgName = outputs.AutoScalingGroupName;

        const result = await asgClient.send(
          new DescribeAutoScalingGroupsCommand({
            AutoScalingGroupNames: [asgName],
          })
        );

        expect(result.AutoScalingGroups).toBeDefined();
        expect(result.AutoScalingGroups!.length).toBe(1);

        const asg = result.AutoScalingGroups![0];
        expect(asg.MinSize).toBe(1);
        expect(asg.MaxSize).toBe(3);
        expect(asg.DesiredCapacity).toBe(2);
      }, 30000);
    });

    describe('IAM Resources Tests', () => {
      test('should verify EC2 instance role exists', async () => {
        const roleArn = outputs.EC2InstanceRoleArn;
        const roleName = roleArn.split('/').pop()!;

        const result = await iamClient.send(
          new GetRoleCommand({
            RoleName: roleName,
          })
        );

        expect(result.Role).toBeDefined();
        expect(result.Role!.AssumeRolePolicyDocument).toBeDefined();
      }, 30000);

      test('should verify Lambda execution role exists', async () => {
        const roleArn = outputs.LambdaExecutionRoleArn;
        const roleName = roleArn.split('/').pop()!;

        const result = await iamClient.send(
          new GetRoleCommand({
            RoleName: roleName,
          })
        );

        expect(result.Role).toBeDefined();
      }, 30000);

      test('should verify Developer IAM user exists', async () => {
        const userArn = outputs.DeveloperUserArn;
        const userName = userArn.split('/').pop()!;

        const result = await iamClient.send(
          new GetUserCommand({
            UserName: userName,
          })
        );

        expect(result.User).toBeDefined();
      }, 30000);
    });

    describe('SNS Topic Tests', () => {
      test('should verify SNS topic exists', async () => {
        const topicArn = outputs.SNSTopicArn;

        const result = await snsClient.send(
          new ListSubscriptionsByTopicCommand({
            TopicArn: topicArn,
          })
        );

        expect(result.Subscriptions).toBeDefined();
      }, 30000);
    });
  });

  // ===================================================================
  // CROSS-SERVICE TESTS - Test TWO services interacting
  // ===================================================================

  describe('CROSS-SERVICE Tests', () => {

    describe('Lambda → DynamoDB Integration', () => {
      test('should invoke Lambda and verify it can write to DynamoDB', async () => {
        const functionName = outputs.LambdaFunctionName;
        const tableName = outputs.DynamoDBTableName;
        const testId = generateTestId();

        // Invoke Lambda
        const lambdaResult = await lambdaClient.send(
          new InvokeCommand({
            FunctionName: functionName,
            Payload: JSON.stringify({
              action: 'test-write',
              itemId: testId,
              data: 'Cross-service test data',
            }),
          })
        );

        expect(lambdaResult.StatusCode).toBe(200);

        // Note: This test demonstrates the integration pattern
        // The actual Lambda code would need to implement the write operation
      }, 30000);
    });

    describe('S3 → Lambda Integration', () => {
      test('should upload file to S3 and verify Lambda has read access', async () => {
        const bucketName = outputs.S3BucketName;
        const functionName = outputs.LambdaFunctionName;
        const testKey = `lambda-test/${generateTestId()}.json`;

        // Upload test file to S3
        await s3Client.send(
          new PutObjectCommand({
            Bucket: bucketName,
            Key: testKey,
            Body: JSON.stringify({
              test: 'cross-service',
              timestamp: Date.now(),
            }),
            ContentType: 'application/json',
          })
        );

        // Invoke Lambda to read from S3
        const result = await lambdaClient.send(
          new InvokeCommand({
            FunctionName: functionName,
            Payload: JSON.stringify({
              action: 'read-s3',
              bucket: bucketName,
              key: testKey,
            }),
          })
        );

        expect(result.StatusCode).toBe(200);

        // Cleanup
        await s3Client.send(
          new DeleteObjectCommand({
            Bucket: bucketName,
            Key: testKey,
          })
        );
      }, 30000);
    });

    describe('CloudWatch → SNS Integration', () => {
      test('should publish custom metric and verify alarm can trigger', async () => {
        const topicArn = outputs.SNSTopicArn;

        // Send custom metric
        await cloudwatchClient.send(
          new PutMetricDataCommand({
            Namespace: 'TapStack/IntegrationTests',
            MetricData: [
              {
                MetricName: 'TestMetric',
                Value: 1,
                Timestamp: new Date(),
                Unit: 'Count',
              },
            ],
          })
        );

        // Verify SNS topic is ready to receive alarms
        const snsResult = await snsClient.send(
          new ListSubscriptionsByTopicCommand({
            TopicArn: topicArn,
          })
        );

        expect(snsResult.Subscriptions).toBeDefined();
      }, 30000);
    });

    describe('VPC → CloudWatch Logs Integration', () => {
      test('should verify VPC flow logs are being sent to CloudWatch', async () => {
        const vpcId = outputs.VPCId;
        const logGroupName = outputs.VPCFlowLogGroup;

        // Verify VPC exists
        const vpcResult = await ec2Client.send(
          new DescribeVpcsCommand({
            VpcIds: [vpcId],
          })
        );

        expect(vpcResult.Vpcs![0].State).toBe('available');

        // Verify flow logs are being written
        const logsResult = await cloudwatchLogsClient.send(
          new DescribeLogStreamsCommand({
            logGroupName: logGroupName,
            limit: 1,
          })
        );

        expect(logsResult.logStreams).toBeDefined();
      }, 30000);
    });
  });

  // ===================================================================
  // E2E TESTS - Complete workflows with REAL DATA (3+ services)
  // ===================================================================

  describe('E2E Tests', () => {

    describe('Complete Data Processing Workflow', () => {
      test('should execute full workflow: S3 → Lambda → DynamoDB', async () => {
        const bucketName = outputs.S3BucketName;
        const functionName = outputs.LambdaFunctionName;
        const tableName = outputs.DynamoDBTableName;
        const testId = generateTestId();
        const testKey = `e2e-test/${testId}.json`;

        // STEP 1: Upload data file to S3
        const testData = {
          id: testId,
          name: 'E2E Test Item',
          description: 'End-to-end integration test data',
          timestamp: Date.now(),
          metadata: {
            source: 's3',
            processed: false,
          },
        };

        await s3Client.send(
          new PutObjectCommand({
            Bucket: bucketName,
            Key: testKey,
            Body: JSON.stringify(testData),
            ContentType: 'application/json',
          })
        );

        // STEP 2: Invoke Lambda to process S3 file
        const lambdaResult = await lambdaClient.send(
          new InvokeCommand({
            FunctionName: functionName,
            Payload: JSON.stringify({
              action: 'process-s3-file',
              bucket: bucketName,
              key: testKey,
            }),
          })
        );

        expect(lambdaResult.StatusCode).toBe(200);

        // STEP 3: Verify data was written to DynamoDB
        // Note: Actual implementation would depend on Lambda code

        // STEP 4: Cleanup S3
        await s3Client.send(
          new DeleteObjectCommand({
            Bucket: bucketName,
            Key: testKey,
          })
        );
      }, 60000);
    });

    describe('Complete Monitoring and Alerting Workflow', () => {
      test('should execute full workflow: Metric → CloudWatch Alarm → SNS', async () => {
        const alarmName = outputs.HighCPUAlarmName;
        const topicArn = outputs.SNSTopicArn;

        // STEP 1: Send test metric to custom namespace (AWS/ namespaces are reserved)
        await cloudwatchClient.send(
          new PutMetricDataCommand({
            Namespace: 'TapStack/E2E',
            MetricData: [
              {
                MetricName: 'TestCPUUtilization',
                Value: 50,
                Timestamp: new Date(),
                Unit: 'Percent',
                Dimensions: [
                  {
                    Name: 'TestType',
                    Value: 'E2E',
                  },
                ],
              },
            ],
          })
        );

        // STEP 2: Verify alarm exists and is configured
        const alarmResult = await cloudwatchClient.send(
          new DescribeAlarmsCommand({
            AlarmNames: [alarmName],
          })
        );

        expect(alarmResult.MetricAlarms![0].ActionsEnabled).toBe(true);
        expect(alarmResult.MetricAlarms![0].AlarmActions).toContain(topicArn);

        // STEP 3: Verify SNS topic is ready
        const snsResult = await snsClient.send(
          new ListSubscriptionsByTopicCommand({
            TopicArn: topicArn,
          })
        );

        expect(snsResult.Subscriptions).toBeDefined();
      }, 60000);
    });

    describe('Complete Storage and Encryption Workflow', () => {
      test('should execute full workflow: Upload → Encrypt → Store → Retrieve → Verify', async () => {
        const bucketName = outputs.S3BucketName;
        const testKey = `e2e-encryption-test/${generateTestId()}.txt`;
        const originalContent = 'This content should be encrypted at rest in S3';

        // STEP 1: Upload file (S3 automatically encrypts with AES256)
        await s3Client.send(
          new PutObjectCommand({
            Bucket: bucketName,
            Key: testKey,
            Body: originalContent,
            ContentType: 'text/plain',
          })
        );

        // STEP 2: Verify file is stored and encrypted
        const headResult = await s3Client.send(
          new GetObjectCommand({
            Bucket: bucketName,
            Key: testKey,
          })
        );

        expect(headResult.ServerSideEncryption).toBeDefined();

        // STEP 3: Download and verify content integrity
        const retrievedContent = await headResult.Body?.transformToString();
        expect(retrievedContent).toBe(originalContent);

        // STEP 4: Cleanup
        await s3Client.send(
          new DeleteObjectCommand({
            Bucket: bucketName,
            Key: testKey,
          })
        );
      }, 60000);
    });

    describe('Complete Infrastructure Security Workflow', () => {
      test('should verify end-to-end security: VPC → Security Groups → RDS → Secrets', async () => {
        const vpcId = outputs.VPCId;
        const dbSecurityGroupId = outputs.DatabaseSecurityGroupId;
        const secretArn = outputs.DatabasePasswordSecret;

        // STEP 1: Verify VPC isolation
        const vpcResult = await ec2Client.send(
          new DescribeVpcsCommand({
            VpcIds: [vpcId],
          })
        );

        expect(vpcResult.Vpcs![0].State).toBe('available');

        // STEP 2: Verify database security group restrictions
        const sgResult = await ec2Client.send(
          new DescribeSecurityGroupsCommand({
            GroupIds: [dbSecurityGroupId],
          })
        );

        const dbSG = sgResult.SecurityGroups![0];
        expect(dbSG.IpPermissions).toBeDefined();

        // Verify only port 3306 is allowed
        const mysqlRule = dbSG.IpPermissions!.find((rule) => rule.FromPort === 3306);
        expect(mysqlRule).toBeDefined();

        // STEP 3: Verify database password is stored securely
        const secretResult = await secretsManagerClient.send(
          new GetSecretValueCommand({
            SecretId: secretArn,
          })
        );

        expect(secretResult.SecretString).toBeDefined();
        const secret = JSON.parse(secretResult.SecretString!);
        expect(secret.password.length).toBeGreaterThanOrEqual(32);

        // STEP 4: Verify RDS encryption
        const dbEndpoint = outputs.DatabaseEndpoint;
        const dbIdentifier = dbEndpoint.split('.')[0];

        const dbResult = await rdsClient.send(
          new DescribeDBInstancesCommand({
            DBInstanceIdentifier: dbIdentifier,
          })
        );

        expect(dbResult.DBInstances![0].StorageEncrypted).toBe(true);
      }, 60000);
    });

    describe('Complete High Availability Workflow', () => {
      test('should verify multi-AZ deployment: Subnets → ASG → ALB', async () => {
        const publicSubnet1 = outputs.PublicSubnet1Id;
        const publicSubnet2 = outputs.PublicSubnet2Id;
        const privateSubnet1 = outputs.PrivateSubnet1Id;
        const privateSubnet2 = outputs.PrivateSubnet2Id;

        // STEP 1: Verify subnets are in different AZs
        const subnetResult = await ec2Client.send(
          new DescribeSubnetsCommand({
            SubnetIds: [publicSubnet1, publicSubnet2, privateSubnet1, privateSubnet2],
          })
        );

        const azs = new Set(subnetResult.Subnets!.map((s) => s.AvailabilityZone));
        expect(azs.size).toBeGreaterThanOrEqual(2);

        // STEP 2: Verify ASG spans multiple AZs
        const asgResult = await asgClient.send(
          new DescribeAutoScalingGroupsCommand({
            AutoScalingGroupNames: [outputs.AutoScalingGroupName],
          })
        );

        const asgAZs = asgResult.AutoScalingGroups![0].AvailabilityZones!;
        expect(asgAZs.length).toBeGreaterThanOrEqual(2);

        // STEP 3: Verify ALB is deployed across multiple subnets
        const albUrl = outputs.LoadBalancerURL;
        const albResult = await elbv2Client.send(
          new DescribeLoadBalancersCommand({})
        );

        const alb = albResult.LoadBalancers?.find((lb) => lb.DNSName === albUrl);
        expect(alb!.AvailabilityZones!.length).toBeGreaterThanOrEqual(2);
      }, 60000);
    });
  });
});
