// Integration Tests - Payment Processing Infrastructure
// Tests deployed AWS resources using actual services (no mocking)

import fs from 'fs';
import {
  EC2Client,
  DescribeVpcsCommand,
  DescribeSubnetsCommand,
  DescribeVpcEndpointsCommand,
  DescribeNatGatewaysCommand,
} from '@aws-sdk/client-ec2';
import {
  RDSClient,
  DescribeDBClustersCommand,
  DescribeDBInstancesCommand,
} from '@aws-sdk/client-rds';
import {
  S3Client,
  HeadBucketCommand,
  GetBucketVersioningCommand,
  GetBucketEncryptionCommand,
  GetBucketLifecycleConfigurationCommand,
} from '@aws-sdk/client-s3';
import {
  SQSClient,
  GetQueueAttributesCommand,
  GetQueueUrlCommand,
} from '@aws-sdk/client-sqs';
import {
  LambdaClient,
  GetFunctionCommand,
  GetFunctionConfigurationCommand,
} from '@aws-sdk/client-lambda';
import {
  APIGatewayClient,
  GetRestApiCommand,
  GetStageCommand,
  GetResourcesCommand,
} from '@aws-sdk/client-api-gateway';
import {
  CloudWatchClient,
  DescribeAlarmsCommand,
  GetDashboardCommand,
} from '@aws-sdk/client-cloudwatch';
import {
  SecretsManagerClient,
  DescribeSecretCommand,
} from '@aws-sdk/client-secrets-manager';
import {
  SNSClient,
  GetTopicAttributesCommand,
} from '@aws-sdk/client-sns';

// Load deployed stack outputs
const outputs = JSON.parse(
  fs.readFileSync('cfn-outputs/flat-outputs.json', 'utf8')
);

const region = process.env.AWS_REGION || 'us-east-1';
const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'synthansux';

// Initialize AWS clients
const ec2Client = new EC2Client({ region });
const rdsClient = new RDSClient({ region });
const s3Client = new S3Client({ region });
const sqsClient = new SQSClient({ region });
const lambdaClient = new LambdaClient({ region });
const apiGatewayClient = new APIGatewayClient({ region });
const cloudWatchClient = new CloudWatchClient({ region });
const secretsClient = new SecretsManagerClient({ region });
const snsClient = new SNSClient({ region });

describe('Payment Processing Infrastructure - Integration Tests', () => {
  describe('VPC and Networking', () => {
    test('should have VPC deployed with correct configuration', async () => {
      const vpcId = outputs.VpcId;
      expect(vpcId).toBeDefined();

      const response = await ec2Client.send(
        new DescribeVpcsCommand({
          VpcIds: [vpcId],
        })
      );

      expect(response.Vpcs).toBeDefined();
      expect(response.Vpcs!.length).toBe(1);

      const vpc = response.Vpcs![0];
      expect(vpc.State).toBe('available');
      expect(vpc.CidrBlock).toBe('10.0.0.0/16');
      expect(vpc.EnableDnsHostnames).toBe(true);
      expect(vpc.EnableDnsSupport).toBe(true);

      // Check tags
      const tags = vpc.Tags || [];
      const nameTag = tags.find((t) => t.Key === 'Name');
      expect(nameTag).toBeDefined();
      expect(nameTag!.Value).toContain('payment-vpc');
    }, 30000);

    test('should have correct subnets configuration', async () => {
      const vpcId = outputs.VpcId;

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

      const subnets = response.Subnets || [];
      expect(subnets.length).toBeGreaterThanOrEqual(4); // 2 public + 2 private

      // Verify we have public subnets
      const publicSubnets = subnets.filter((s) =>
        s.Tags?.some(
          (t) => t.Key === 'Name' && t.Value?.includes('public-subnet')
        )
      );
      expect(publicSubnets.length).toBeGreaterThanOrEqual(2);

      // Verify we have private subnets
      const privateSubnets = subnets.filter((s) =>
        s.Tags?.some(
          (t) => t.Key === 'Name' && t.Value?.includes('private-subnet')
        )
      );
      expect(privateSubnets.length).toBeGreaterThanOrEqual(2);

      // Verify subnets are in different AZs
      const azs = new Set(subnets.map((s) => s.AvailabilityZone));
      expect(azs.size).toBeGreaterThanOrEqual(2);
    }, 30000);

    test('should have NAT Gateway for private subnet connectivity', async () => {
      const vpcId = outputs.VpcId;

      const response = await ec2Client.send(
        new DescribeNatGatewaysCommand({
          Filter: [
            {
              Name: 'vpc-id',
              Values: [vpcId],
            },
            {
              Name: 'state',
              Values: ['available'],
            },
          ],
        })
      );

      const natGateways = response.NatGateways || [];
      expect(natGateways.length).toBeGreaterThanOrEqual(1);
      expect(natGateways[0].State).toBe('available');
    }, 30000);

    test('should have VPC endpoints for cost optimization', async () => {
      const vpcId = outputs.VpcId;

      const response = await ec2Client.send(
        new DescribeVpcEndpointsCommand({
          Filters: [
            {
              Name: 'vpc-id',
              Values: [vpcId],
            },
          ],
        })
      );

      const endpoints = response.VpcEndpoints || [];
      expect(endpoints.length).toBeGreaterThanOrEqual(3); // S3, DynamoDB, Secrets Manager

      // Verify Gateway endpoints (S3 and DynamoDB)
      const gatewayEndpoints = endpoints.filter(
        (e) => e.VpcEndpointType === 'Gateway'
      );
      expect(gatewayEndpoints.length).toBeGreaterThanOrEqual(2);

      // Verify Interface endpoint (Secrets Manager)
      const interfaceEndpoints = endpoints.filter(
        (e) => e.VpcEndpointType === 'Interface'
      );
      expect(interfaceEndpoints.length).toBeGreaterThanOrEqual(1);

      // Check all endpoints are available
      endpoints.forEach((endpoint) => {
        expect(endpoint.State).toBe('available');
      });
    }, 30000);
  });

  describe('RDS Database', () => {
    test('should have Aurora PostgreSQL cluster deployed', async () => {
      const dbEndpoint = outputs.DatabaseEndpoint;
      expect(dbEndpoint).toBeDefined();

      // Extract cluster identifier from endpoint
      const clusterIdentifier = dbEndpoint.split('.')[0];

      const response = await rdsClient.send(
        new DescribeDBClustersCommand({
          DBClusterIdentifier: clusterIdentifier,
        })
      );

      expect(response.DBClusters).toBeDefined();
      expect(response.DBClusters!.length).toBe(1);

      const cluster = response.DBClusters![0];
      expect(cluster.Status).toBe('available');
      expect(cluster.Engine).toBe('aurora-postgresql');
      expect(cluster.StorageEncrypted).toBe(true);
      expect(cluster.DatabaseName).toBe('paymentdb');
      expect(cluster.BackupRetentionPeriod).toBeGreaterThanOrEqual(1);

      // Verify not publicly accessible
      expect(cluster.PubliclyAccessible).toBe(false);

      // Verify VPC placement
      expect(cluster.DBSubnetGroup).toBeDefined();
    }, 30000);

    test('should have writer and reader instances', async () => {
      const dbEndpoint = outputs.DatabaseEndpoint;
      const clusterIdentifier = dbEndpoint.split('.')[0];

      const response = await rdsClient.send(
        new DescribeDBInstancesCommand({
          Filters: [
            {
              Name: 'db-cluster-id',
              Values: [clusterIdentifier],
            },
          ],
        })
      );

      const instances = response.DBInstances || [];
      expect(instances.length).toBeGreaterThanOrEqual(2); // Writer + Reader

      instances.forEach((instance) => {
        expect(instance.DBInstanceStatus).toBe('available');
        expect(instance.DBInstanceClass).toContain('db.t3');
        expect(instance.PubliclyAccessible).toBe(false);
      });
    }, 30000);

    test('should have database credentials in Secrets Manager', async () => {
      const secretArn = outputs.DatabaseSecretArn;
      expect(secretArn).toBeDefined();

      const response = await secretsClient.send(
        new DescribeSecretCommand({
          SecretId: secretArn,
        })
      );

      expect(response.Name).toContain('payment-db-credentials');
      expect(response.Description).toContain('Database credentials');

      // Verify secret is accessible
      expect(response.ARN).toBe(secretArn);
    }, 30000);
  });

  describe('S3 Storage', () => {
    test('should have transaction bucket deployed', async () => {
      const bucketName = outputs.TransactionBucketName;
      expect(bucketName).toBe(`payment-transactions-${environmentSuffix}`);

      // Verify bucket exists
      await s3Client.send(
        new HeadBucketCommand({
          Bucket: bucketName,
        })
      );
    }, 30000);

    test('should have versioning enabled', async () => {
      const bucketName = outputs.TransactionBucketName;

      const response = await s3Client.send(
        new GetBucketVersioningCommand({
          Bucket: bucketName,
        })
      );

      expect(response.Status).toBe('Enabled');
    }, 30000);

    test('should have encryption enabled', async () => {
      const bucketName = outputs.TransactionBucketName;

      const response = await s3Client.send(
        new GetBucketEncryptionCommand({
          Bucket: bucketName,
        })
      );

      expect(response.ServerSideEncryptionConfiguration).toBeDefined();
      const rules =
        response.ServerSideEncryptionConfiguration!.Rules || [];
      expect(rules.length).toBeGreaterThan(0);
      expect(rules[0].ApplyServerSideEncryptionByDefault?.SSEAlgorithm).toBe(
        'AES256'
      );
    }, 30000);

    test('should have lifecycle policies configured', async () => {
      const bucketName = outputs.TransactionBucketName;

      const response = await s3Client.send(
        new GetBucketLifecycleConfigurationCommand({
          Bucket: bucketName,
        })
      );

      const rules = response.Rules || [];
      expect(rules.length).toBeGreaterThanOrEqual(3);

      // Check for Intelligent-Tiering
      const intelligentTieringRule = rules.find((r) =>
        r.ID?.includes('intelligent-tiering')
      );
      expect(intelligentTieringRule).toBeDefined();
      expect(intelligentTieringRule!.Status).toBe('Enabled');

      // Check for expiration
      const expirationRule = rules.find((r) => r.ID?.includes('expiration'));
      expect(expirationRule).toBeDefined();
      expect(expirationRule!.Status).toBe('Enabled');
      expect(expirationRule!.Expiration?.Days).toBeGreaterThan(0);

      // Check for multipart upload cleanup
      const multipartRule = rules.find((r) =>
        r.ID?.includes('abort-incomplete-multipart')
      );
      expect(multipartRule).toBeDefined();
      expect(multipartRule!.Status).toBe('Enabled');
    }, 30000);
  });

  describe('SQS Messaging', () => {
    test('should have payment queue deployed', async () => {
      const queueUrl = outputs.PaymentQueueUrl;
      expect(queueUrl).toBeDefined();
      expect(queueUrl).toContain('payment-queue');

      const response = await sqsClient.send(
        new GetQueueAttributesCommand({
          QueueUrl: queueUrl,
          AttributeNames: ['All'],
        })
      );

      const attributes = response.Attributes!;
      expect(attributes.VisibilityTimeout).toBe('30');
      expect(attributes.MessageRetentionPeriod).toBe('345600'); // 4 days

      // Verify DLQ configuration
      expect(attributes.RedrivePolicy).toBeDefined();
      const redrivePolicy = JSON.parse(attributes.RedrivePolicy);
      expect(redrivePolicy.maxReceiveCount).toBe(3);
      expect(redrivePolicy.deadLetterTargetArn).toBeDefined();
    }, 30000);

    test('should have dead-letter queue deployed', async () => {
      const queueUrl = outputs.PaymentQueueUrl;

      // Get main queue attributes to find DLQ
      const mainQueueResponse = await sqsClient.send(
        new GetQueueAttributesCommand({
          QueueUrl: queueUrl,
          AttributeNames: ['RedrivePolicy'],
        })
      );

      const redrivePolicy = JSON.parse(
        mainQueueResponse.Attributes!.RedrivePolicy
      );
      const dlqArn = redrivePolicy.deadLetterTargetArn;

      // Extract DLQ name from ARN
      const dlqName = dlqArn.split(':').pop();
      const dlqUrl = `https://sqs.${region}.amazonaws.com/${dlqArn.split(':')[4]}/${dlqName}`;

      const dlqResponse = await sqsClient.send(
        new GetQueueAttributesCommand({
          QueueUrl: dlqUrl,
          AttributeNames: ['All'],
        })
      );

      expect(dlqResponse.Attributes).toBeDefined();
      expect(dlqResponse.Attributes!.MessageRetentionPeriod).toBe('1209600'); // 14 days
    }, 30000);
  });

  describe('Lambda Compute', () => {
    test('should have payment validation Lambda deployed', async () => {
      const functionArn = outputs.PaymentValidationFunctionArn;
      expect(functionArn).toBeDefined();

      const functionName = functionArn.split(':').pop()!;

      const response = await lambdaClient.send(
        new GetFunctionCommand({
          FunctionName: functionName,
        })
      );

      expect(response.Configuration).toBeDefined();
      const config = response.Configuration!;

      expect(config.State).toBe('Active');
      expect(config.Runtime).toBe('nodejs18.x');
      expect(config.Handler).toBe('index.handler');
      expect(config.MemorySize).toBe(512);
      expect(config.Timeout).toBe(30);

      // Verify VPC configuration
      expect(config.VpcConfig).toBeDefined();
      expect(config.VpcConfig!.VpcId).toBe(outputs.VpcId);
      expect(config.VpcConfig!.SubnetIds!.length).toBeGreaterThan(0);
      expect(config.VpcConfig!.SecurityGroupIds!.length).toBeGreaterThan(0);

      // Verify tracing
      expect(config.TracingConfig?.Mode).toBe('Active');
    }, 30000);

    test('should have correct environment variables', async () => {
      const functionArn = outputs.PaymentValidationFunctionArn;
      const functionName = functionArn.split(':').pop()!;

      const response = await lambdaClient.send(
        new GetFunctionConfigurationCommand({
          FunctionName: functionName,
        })
      );

      const envVars = response.Environment!.Variables!;
      expect(envVars.ENVIRONMENT).toBeDefined();
      expect(envVars.DATABASE_SECRET_ARN).toBe(outputs.DatabaseSecretArn);
      expect(envVars.DATABASE_ENDPOINT).toBe(outputs.DatabaseEndpoint);
      expect(envVars.TRANSACTION_BUCKET).toBe(outputs.TransactionBucketName);
      expect(envVars.PAYMENT_QUEUE_URL).toBe(outputs.PaymentQueueUrl);
    }, 30000);
  });

  describe('API Gateway', () => {
    test('should have REST API deployed', async () => {
      const apiEndpoint = outputs.ApiEndpoint;
      expect(apiEndpoint).toBeDefined();

      // Extract API ID from endpoint
      const apiId = apiEndpoint.split('//')[1].split('.')[0];

      const response = await apiGatewayClient.send(
        new GetRestApiCommand({
          restApiId: apiId,
        })
      );

      expect(response.name).toContain('payment-api');
      expect(response.description).toContain('Payment processing API');
    }, 30000);

    test('should have correct stage configuration', async () => {
      const apiEndpoint = outputs.ApiEndpoint;
      const apiId = apiEndpoint.split('//')[1].split('.')[0];

      const response = await apiGatewayClient.send(
        new GetStageCommand({
          restApiId: apiId,
          stageName: environmentSuffix,
        })
      );

      expect(response.stageName).toBe(environmentSuffix);
      expect(response.deploymentId).toBeDefined();

      // Verify method settings
      const methodSettings = response.methodSettings || {};
      const wildcardSettings = methodSettings['*/*'];
      if (wildcardSettings) {
        expect(wildcardSettings.throttlingBurstLimit).toBe(100);
        expect(wildcardSettings.throttlingRateLimit).toBe(50);
        expect(wildcardSettings.dataTraceEnabled).toBe(true);
        expect(wildcardSettings.loggingLevel).toBe('INFO');
      }
    }, 30000);

    test('should have /payments resource with methods', async () => {
      const apiEndpoint = outputs.ApiEndpoint;
      const apiId = apiEndpoint.split('//')[1].split('.')[0];

      const response = await apiGatewayClient.send(
        new GetResourcesCommand({
          restApiId: apiId,
        })
      );

      const resources = response.items || [];

      // Find /payments resource
      const paymentsResource = resources.find((r) => r.path === '/payments');
      expect(paymentsResource).toBeDefined();

      // Verify POST method exists
      expect(paymentsResource!.resourceMethods).toBeDefined();
      expect(paymentsResource!.resourceMethods!.POST).toBeDefined();

      // Find /payments/{paymentId} resource
      const paymentByIdResource = resources.find((r) =>
        r.path?.startsWith('/payments/{')
      );
      expect(paymentByIdResource).toBeDefined();

      // Verify GET method exists
      expect(paymentByIdResource!.resourceMethods!.GET).toBeDefined();
    }, 30000);
  });

  describe('CloudWatch Monitoring', () => {
    test('should have CloudWatch dashboard deployed', async () => {
      const dashboardName = `payment-dashboard-${environmentSuffix}`;

      const response = await cloudWatchClient.send(
        new GetDashboardCommand({
          DashboardName: dashboardName,
        })
      );

      expect(response.DashboardName).toBe(dashboardName);
      expect(response.DashboardBody).toBeDefined();

      // Verify dashboard has widgets
      const dashboard = JSON.parse(response.DashboardBody!);
      expect(dashboard.widgets).toBeDefined();
      expect(dashboard.widgets.length).toBeGreaterThan(0);
    }, 30000);

    test('should have CloudWatch alarms configured', async () => {
      const response = await cloudWatchClient.send(
        new DescribeAlarmsCommand({
          AlarmNamePrefix: 'payment',
        })
      );

      const alarms = response.MetricAlarms || [];
      expect(alarms.length).toBeGreaterThanOrEqual(4);

      // Verify specific alarms
      const alarmNames = alarms.map((a) => a.AlarmName);
      expect(alarmNames.some((n) => n?.includes('lambda-errors'))).toBe(true);
      expect(alarmNames.some((n) => n?.includes('api-latency'))).toBe(true);
      expect(alarmNames.some((n) => n?.includes('queue-age'))).toBe(true);
      expect(alarmNames.some((n) => n?.includes('db-cpu'))).toBe(true);

      // Verify alarms are active
      alarms.forEach((alarm) => {
        expect(alarm.StateValue).toBeDefined();
        expect(alarm.ActionsEnabled).toBe(true);
        expect(alarm.AlarmActions).toBeDefined();
        expect(alarm.AlarmActions!.length).toBeGreaterThan(0);
      });
    }, 30000);

    test('should have SNS topic for alarm notifications', async () => {
      const response = await cloudWatchClient.send(
        new DescribeAlarmsCommand({
          AlarmNamePrefix: 'payment',
          MaxRecords: 1,
        })
      );

      const alarms = response.MetricAlarms || [];
      expect(alarms.length).toBeGreaterThan(0);

      // Get SNS topic ARN from alarm action
      const topicArn = alarms[0].AlarmActions![0];
      expect(topicArn).toContain('payment-alarms');

      const snsResponse = await snsClient.send(
        new GetTopicAttributesCommand({
          TopicArn: topicArn,
        })
      );

      expect(snsResponse.Attributes).toBeDefined();
      expect(snsResponse.Attributes!.TopicArn).toBe(topicArn);
    }, 30000);
  });

  describe('End-to-End Resource Connectivity', () => {
    test('should verify all outputs are accessible', () => {
      // Verify all expected outputs exist
      expect(outputs.VpcId).toBeDefined();
      expect(outputs.DatabaseEndpoint).toBeDefined();
      expect(outputs.DatabaseSecretArn).toBeDefined();
      expect(outputs.TransactionBucketName).toBeDefined();
      expect(outputs.PaymentQueueUrl).toBeDefined();
      expect(outputs.PaymentValidationFunctionArn).toBeDefined();
      expect(outputs.ApiEndpoint).toBeDefined();

      // Verify naming conventions with environment suffix
      expect(outputs.TransactionBucketName).toContain(environmentSuffix);
      expect(outputs.PaymentQueueUrl).toContain(environmentSuffix);
      expect(outputs.DatabaseSecretArn).toContain(environmentSuffix);
    });

    test('should verify resource connectivity through Lambda config', async () => {
      const functionArn = outputs.PaymentValidationFunctionArn;
      const functionName = functionArn.split(':').pop()!;

      const response = await lambdaClient.send(
        new GetFunctionConfigurationCommand({
          FunctionName: functionName,
        })
      );

      // Lambda should be connected to all key resources
      const envVars = response.Environment!.Variables!;

      // Database connection
      expect(envVars.DATABASE_SECRET_ARN).toBeDefined();
      expect(envVars.DATABASE_ENDPOINT).toBeDefined();

      // S3 connection
      expect(envVars.TRANSACTION_BUCKET).toBeDefined();

      // SQS connection
      expect(envVars.PAYMENT_QUEUE_URL).toBeDefined();

      // VPC connection
      expect(response.VpcConfig).toBeDefined();
      expect(response.VpcConfig!.VpcId).toBe(outputs.VpcId);
    }, 30000);
  });
});
