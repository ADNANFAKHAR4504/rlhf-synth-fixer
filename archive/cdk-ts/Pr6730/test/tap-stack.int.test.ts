import * as fs from 'fs';
import * as path from 'path';
import {
  EC2Client,
  DescribeVpcsCommand,
  DescribeSubnetsCommand,
  DescribeSecurityGroupsCommand,
  DescribeNatGatewaysCommand,
} from '@aws-sdk/client-ec2';
import {
  RDSClient,
  DescribeDBInstancesCommand,
  DescribeDBSubnetGroupsCommand,
} from '@aws-sdk/client-rds';
import {
  S3Client,
  HeadBucketCommand,
  GetBucketEncryptionCommand,
  GetPublicAccessBlockCommand,
} from '@aws-sdk/client-s3';
import {
  LambdaClient,
  GetFunctionCommand,
  GetFunctionConfigurationCommand,
} from '@aws-sdk/client-lambda';
import {
  APIGatewayClient,
  GetRestApiCommand,
  GetResourcesCommand,
  GetStageCommand,
} from '@aws-sdk/client-api-gateway';
import {
  SQSClient,
  GetQueueAttributesCommand,
  GetQueueUrlCommand,
} from '@aws-sdk/client-sqs';
import { SNSClient, GetTopicAttributesCommand } from '@aws-sdk/client-sns';
import {
  SecretsManagerClient,
  DescribeSecretCommand,
  GetSecretValueCommand,
} from '@aws-sdk/client-secrets-manager';
import {
  CloudWatchClient,
  DescribeAlarmsCommand,
} from '@aws-sdk/client-cloudwatch';
import {
  IAMClient,
  GetRoleCommand,
  ListAttachedRolePoliciesCommand,
  ListRolePoliciesCommand,
} from '@aws-sdk/client-iam';

// Load outputs from flat-outputs.json
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
const ec2Client = new EC2Client({ region });
const rdsClient = new RDSClient({ region });
const s3Client = new S3Client({ region });
const lambdaClient = new LambdaClient({ region });
const apiGatewayClient = new APIGatewayClient({ region });
const sqsClient = new SQSClient({ region });
const snsClient = new SNSClient({ region });
const secretsClient = new SecretsManagerClient({ region });
const cloudWatchClient = new CloudWatchClient({ region });
const iamClient = new IAMClient({ region });

// Get outputs from flat-outputs.json
const vpcId = outputs.VpcId;
const apiEndpoint = outputs.ApiEndpoint;
const paymentsFunctionArn = outputs.PaymentsFunctionArn;
const refundsFunctionArn = outputs.RefundsFunctionArn;
const databaseEndpoint = outputs.DatabaseEndpoint;
const databaseSecretArn = outputs.DatabaseSecretArn;
const receiptsBucketName = outputs.ReceiptsBucketName;
const alarmTopicArn = outputs.AlarmTopicArn;

describe('Payment API Infrastructure Integration Tests', () => {
  describe('VPC Infrastructure', () => {
    test('VPC should exist and be in available state', async () => {
      const response = await ec2Client.send(
        new DescribeVpcsCommand({
          VpcIds: [vpcId],
        })
      );

      expect(response.Vpcs).toBeDefined();
      expect(response.Vpcs!.length).toBe(1);
      expect(response.Vpcs![0].VpcId).toBe(vpcId);
      expect(response.Vpcs![0].State).toBe('available');
      expect(response.Vpcs![0].CidrBlock).toBe('10.0.0.0/16');
    });

    test('VPC should have correct tags', async () => {
      const response = await ec2Client.send(
        new DescribeVpcsCommand({
          VpcIds: [vpcId],
        })
      );

      const vpc = response.Vpcs![0];
      expect(vpc.Tags).toBeDefined();
      const nameTag = vpc.Tags?.find(tag => tag.Key === 'Name');
      expect(nameTag).toBeDefined();
      expect(nameTag!.Value).toContain(`payment-vpc-${environmentSuffix}`);
    });

    test('VPC should have 4 subnets (2 public, 2 private)', async () => {
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
      expect(response.Subnets!.length).toBe(4);

      const publicSubnets = response.Subnets!.filter(subnet =>
        subnet.Tags?.some(
          tag =>
            tag.Key === 'aws-cdk:subnet-name' &&
            tag.Value?.includes(`public-${environmentSuffix}`)
        )
      );
      expect(publicSubnets.length).toBe(2);

      const privateSubnets = response.Subnets!.filter(subnet =>
        subnet.Tags?.some(
          tag =>
            tag.Key === 'aws-cdk:subnet-name' &&
            tag.Value?.includes(`private-${environmentSuffix}`)
        )
      );
      expect(privateSubnets.length).toBe(2);
    });

    test('VPC should have 2 NAT Gateways in available state', async () => {
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

      expect(response.NatGateways).toBeDefined();
      expect(response.NatGateways!.length).toBe(2);
    });

    test('Lambda security group should exist with correct configuration', async () => {
      const response = await ec2Client.send(
        new DescribeSecurityGroupsCommand({
          Filters: [
            {
              Name: 'vpc-id',
              Values: [vpcId],
            },
            {
              Name: 'group-name',
              Values: [`lambda-sg-${environmentSuffix}`],
            },
          ],
        })
      );

      expect(response.SecurityGroups).toBeDefined();
      expect(response.SecurityGroups!.length).toBe(1);
      expect(response.SecurityGroups![0].GroupName).toBe(
        `lambda-sg-${environmentSuffix}`
      );
      expect(response.SecurityGroups![0].Description).toBe(
        `Security group for Lambda functions in ${environmentSuffix}`
      );
    });

    test('RDS security group should exist with PostgreSQL access from Lambda', async () => {
      const response = await ec2Client.send(
        new DescribeSecurityGroupsCommand({
          Filters: [
            {
              Name: 'vpc-id',
              Values: [vpcId],
            },
            {
              Name: 'group-name',
              Values: [`rds-sg-${environmentSuffix}`],
            },
          ],
        })
      );

      expect(response.SecurityGroups).toBeDefined();
      expect(response.SecurityGroups!.length).toBe(1);

      const sg = response.SecurityGroups![0];
      const postgresRule = sg.IpPermissions?.find(
        rule => rule.FromPort === 5432 && rule.ToPort === 5432
      );
      expect(postgresRule).toBeDefined();
      expect(postgresRule!.IpProtocol).toBe('tcp');
    });
  });

  describe('RDS Database', () => {
    const dbInstanceId = `payment-db-${environmentSuffix}`;

    test('RDS instance should exist and be available', async () => {
      const response = await rdsClient.send(
        new DescribeDBInstancesCommand({
          DBInstanceIdentifier: dbInstanceId,
        })
      );

      expect(response.DBInstances).toBeDefined();
      expect(response.DBInstances!.length).toBe(1);
      expect(response.DBInstances![0].DBInstanceStatus).toBe('available');
    });

    test('RDS instance should have correct configuration', async () => {
      const response = await rdsClient.send(
        new DescribeDBInstancesCommand({
          DBInstanceIdentifier: dbInstanceId,
        })
      );

      const dbInstance = response.DBInstances![0];
      expect(dbInstance.DBInstanceIdentifier).toBe(dbInstanceId);
      expect(dbInstance.Engine).toBe('postgres');
      expect(dbInstance.DBInstanceClass).toBe('db.t3.micro');
      expect(dbInstance.AllocatedStorage).toBe(20);
      expect(dbInstance.StorageEncrypted).toBe(true);
      expect(dbInstance.PubliclyAccessible).toBe(false);
      expect(dbInstance.DeletionProtection).toBe(false);
    });

    test('RDS instance should have correct database name', async () => {
      const response = await rdsClient.send(
        new DescribeDBInstancesCommand({
          DBInstanceIdentifier: dbInstanceId,
        })
      );

      expect(response.DBInstances![0].DBName).toBe('payments');
    });

    test('RDS endpoint should match output value', async () => {
      const response = await rdsClient.send(
        new DescribeDBInstancesCommand({
          DBInstanceIdentifier: dbInstanceId,
        })
      );

      expect(response.DBInstances![0].Endpoint?.Address).toBe(databaseEndpoint);
      expect(response.DBInstances![0].Endpoint?.Port).toBe(5432);
    });

    test('DB subnet group should exist with correct configuration', async () => {
      const response = await rdsClient.send(
        new DescribeDBSubnetGroupsCommand({
          DBSubnetGroupName: `payment-db-subnet-${environmentSuffix}`,
        })
      );

      expect(response.DBSubnetGroups).toBeDefined();
      expect(response.DBSubnetGroups!.length).toBe(1);
      expect(response.DBSubnetGroups![0].DBSubnetGroupName).toBe(
        `payment-db-subnet-${environmentSuffix}`
      );
      expect(response.DBSubnetGroups![0].Subnets!.length).toBe(2);
    });
  });

  describe('Secrets Manager', () => {
    test('Database secret should exist', async () => {
      const response = await secretsClient.send(
        new DescribeSecretCommand({
          SecretId: databaseSecretArn,
        })
      );

      expect(response.Name).toBe(`payment-db-secret-${environmentSuffix}`);
      expect(response.Description).toBe(
        `Database credentials for ${environmentSuffix}`
      );
    });

    test('Database secret should contain username and password', async () => {
      const response = await secretsClient.send(
        new GetSecretValueCommand({
          SecretId: databaseSecretArn,
        })
      );

      expect(response.SecretString).toBeDefined();
      const secret = JSON.parse(response.SecretString!);
      expect(secret.username).toBe('postgres');
      expect(secret.password).toBeDefined();
      expect(secret.password.length).toBeGreaterThan(0);
    });
  });

  describe('S3 Bucket', () => {
    test('Receipts bucket should exist', async () => {
      const response = await s3Client.send(
        new HeadBucketCommand({
          Bucket: receiptsBucketName,
        })
      );

      expect(response.$metadata.httpStatusCode).toBe(200);
    });

    test('Receipts bucket should have encryption enabled', async () => {
      const response = await s3Client.send(
        new GetBucketEncryptionCommand({
          Bucket: receiptsBucketName,
        })
      );

      expect(response.ServerSideEncryptionConfiguration).toBeDefined();
      expect(
        response.ServerSideEncryptionConfiguration!.Rules![0]
          .ApplyServerSideEncryptionByDefault?.SSEAlgorithm
      ).toBe('AES256');
    });

    test('Receipts bucket should have public access blocked', async () => {
      const response = await s3Client.send(
        new GetPublicAccessBlockCommand({
          Bucket: receiptsBucketName,
        })
      );

      expect(response.PublicAccessBlockConfiguration).toBeDefined();
      expect(response.PublicAccessBlockConfiguration!.BlockPublicAcls).toBe(
        true
      );
      expect(response.PublicAccessBlockConfiguration!.BlockPublicPolicy).toBe(
        true
      );
      expect(response.PublicAccessBlockConfiguration!.IgnorePublicAcls).toBe(
        true
      );
      expect(
        response.PublicAccessBlockConfiguration!.RestrictPublicBuckets
      ).toBe(true);
    });
  });

  describe('Lambda Functions', () => {
    test('Payments Lambda function should exist and be active', async () => {
      const response = await lambdaClient.send(
        new GetFunctionCommand({
          FunctionName: paymentsFunctionArn,
        })
      );

      expect(response.Configuration).toBeDefined();
      expect(response.Configuration!.FunctionName).toBe(
        `payment-api-payments-${environmentSuffix}`
      );
      expect(response.Configuration!.State).toBe('Active');
      expect(response.Configuration!.Runtime).toBe('nodejs18.x');
    });

    test('Payments Lambda should have correct configuration', async () => {
      const response = await lambdaClient.send(
        new GetFunctionConfigurationCommand({
          FunctionName: paymentsFunctionArn,
        })
      );

      expect(response.Timeout).toBe(30);
      expect(response.MemorySize).toBe(256);
      expect(response.Handler).toBe('index.handler');
      expect(response.Environment?.Variables?.DB_NAME).toBe('payments');
      expect(response.Environment?.Variables?.ENVIRONMENT).toBe(
        environmentSuffix
      );
      expect(response.Environment?.Variables?.DB_SECRET_ARN).toBe(
        databaseSecretArn
      );
      expect(response.Environment?.Variables?.DB_HOST).toBe(databaseEndpoint);
      expect(response.Environment?.Variables?.RECEIPTS_BUCKET).toBe(
        receiptsBucketName
      );
    });

    test('Payments Lambda should be deployed in VPC', async () => {
      const response = await lambdaClient.send(
        new GetFunctionConfigurationCommand({
          FunctionName: paymentsFunctionArn,
        })
      );

      expect(response.VpcConfig).toBeDefined();
      expect(response.VpcConfig!.VpcId).toBe(vpcId);
      expect(response.VpcConfig!.SubnetIds).toBeDefined();
      expect(response.VpcConfig!.SubnetIds!.length).toBeGreaterThan(0);
      expect(response.VpcConfig!.SecurityGroupIds).toBeDefined();
      expect(response.VpcConfig!.SecurityGroupIds!.length).toBeGreaterThan(0);
    });

    test('Payments Lambda should have DLQ configured', async () => {
      const response = await lambdaClient.send(
        new GetFunctionConfigurationCommand({
          FunctionName: paymentsFunctionArn,
        })
      );

      expect(response.DeadLetterConfig).toBeDefined();
      expect(response.DeadLetterConfig!.TargetArn).toBeDefined();
    });

    test('Refunds Lambda function should exist and be active', async () => {
      const response = await lambdaClient.send(
        new GetFunctionCommand({
          FunctionName: refundsFunctionArn,
        })
      );

      expect(response.Configuration).toBeDefined();
      expect(response.Configuration!.FunctionName).toBe(
        `payment-api-refunds-${environmentSuffix}`
      );
      expect(response.Configuration!.State).toBe('Active');
      expect(response.Configuration!.Runtime).toBe('nodejs18.x');
    });

    test('Refunds Lambda should have correct configuration', async () => {
      const response = await lambdaClient.send(
        new GetFunctionConfigurationCommand({
          FunctionName: refundsFunctionArn,
        })
      );

      expect(response.Timeout).toBe(30);
      expect(response.MemorySize).toBe(256);
      expect(response.Handler).toBe('index.handler');
      expect(response.Environment?.Variables?.DB_NAME).toBe('payments');
      expect(response.Environment?.Variables?.ENVIRONMENT).toBe(
        environmentSuffix
      );
    });
  });

  describe('API Gateway', () => {
    const extractApiId = (url: string) => {
      const match = url.match(/https:\/\/([^.]+)\.execute-api/);
      return match ? match[1] : null;
    };

    const extractStageName = (url: string) => {
      const match = url.match(/\.amazonaws\.com\/([^/]+)\/?$/);
      return match ? match[1] : null;
    };

    test('REST API should exist and be deployable', async () => {
      const apiId = extractApiId(apiEndpoint);
      expect(apiId).not.toBeNull();

      const response = await apiGatewayClient.send(
        new GetRestApiCommand({
          restApiId: apiId!,
        })
      );

      expect(response.name).toBe(`payment-api-${environmentSuffix}`);
      expect(response.description).toBe(
        `Payment processing API for ${environmentSuffix}`
      );
    });

    test('API should have /payments and /refunds resources', async () => {
      const apiId = extractApiId(apiEndpoint);
      const response = await apiGatewayClient.send(
        new GetResourcesCommand({
          restApiId: apiId!,
        })
      );

      expect(response.items).toBeDefined();
      const paymentResource = response.items!.find(
        r => r.pathPart === 'payments'
      );
      const refundsResource = response.items!.find(
        r => r.pathPart === 'refunds'
      );

      expect(paymentResource).toBeDefined();
      expect(refundsResource).toBeDefined();
    });

    test('API should have prod stage deployed', async () => {
      const apiId = extractApiId(apiEndpoint);
      const stageName = extractStageName(apiEndpoint);
      expect(stageName).not.toBeNull();

      const response = await apiGatewayClient.send(
        new GetStageCommand({
          restApiId: apiId!,
          stageName: stageName!,
        })
      );

      expect(response.stageName).toBe(stageName);
      expect(response.deploymentId).toBeDefined();
    });
  });

  describe('SQS Dead Letter Queue', () => {
    test('DLQ should exist with correct configuration', async () => {
      const queueUrlResponse = await sqsClient.send(
        new GetQueueUrlCommand({
          QueueName: `payment-dlq-${environmentSuffix}`,
        })
      );

      expect(queueUrlResponse.QueueUrl).toBeDefined();

      const attributesResponse = await sqsClient.send(
        new GetQueueAttributesCommand({
          QueueUrl: queueUrlResponse.QueueUrl!,
          AttributeNames: ['All'],
        })
      );

      expect(attributesResponse.Attributes).toBeDefined();
      expect(attributesResponse.Attributes!.MessageRetentionPeriod).toBe(
        '1209600'
      ); // 14 days
    });
  });

  describe('SNS Topic', () => {
    test('Alarm topic should exist', async () => {
      const response = await snsClient.send(
        new GetTopicAttributesCommand({
          TopicArn: alarmTopicArn,
        })
      );

      expect(response.Attributes).toBeDefined();
      expect(response.Attributes!.TopicArn).toBe(alarmTopicArn);
      expect(response.Attributes!.DisplayName).toBe(
        `Payment API Alarms for ${environmentSuffix}`
      );
    });
  });

  describe('CloudWatch Alarms', () => {
    test('Payments Lambda error alarm should exist', async () => {
      const response = await cloudWatchClient.send(
        new DescribeAlarmsCommand({
          AlarmNames: [`payment-api-payments-errors-${environmentSuffix}`],
        })
      );

      expect(response.MetricAlarms).toBeDefined();
      expect(response.MetricAlarms!.length).toBe(1);

      const alarm = response.MetricAlarms![0];
      expect(alarm.AlarmName).toBe(
        `payment-api-payments-errors-${environmentSuffix}`
      );
      expect(alarm.Threshold).toBe(5);
      expect(alarm.EvaluationPeriods).toBe(1);
      expect(alarm.ComparisonOperator).toBe('GreaterThanOrEqualToThreshold');
      expect(alarm.ActionsEnabled).toBe(true);
      expect(alarm.AlarmActions).toBeDefined();
      expect(alarm.AlarmActions!.length).toBeGreaterThan(0);
    });

    test('Refunds Lambda error alarm should exist', async () => {
      const response = await cloudWatchClient.send(
        new DescribeAlarmsCommand({
          AlarmNames: [`payment-api-refunds-errors-${environmentSuffix}`],
        })
      );

      expect(response.MetricAlarms).toBeDefined();
      expect(response.MetricAlarms!.length).toBe(1);

      const alarm = response.MetricAlarms![0];
      expect(alarm.AlarmName).toBe(
        `payment-api-refunds-errors-${environmentSuffix}`
      );
      expect(alarm.Threshold).toBe(5);
      expect(alarm.ComparisonOperator).toBe('GreaterThanOrEqualToThreshold');
    });
  });

  describe('IAM Role', () => {
    test('Lambda execution role should exist with correct policies', async () => {
      const response = await iamClient.send(
        new GetRoleCommand({
          RoleName: `payment-lambda-role-${environmentSuffix}`,
        })
      );

      expect(response.Role).toBeDefined();
      expect(response.Role!.RoleName).toBe(
        `payment-lambda-role-${environmentSuffix}`
      );

      const policiesResponse = await iamClient.send(
        new ListAttachedRolePoliciesCommand({
          RoleName: `payment-lambda-role-${environmentSuffix}`,
        })
      );

      expect(policiesResponse.AttachedPolicies).toBeDefined();
      const vpcPolicy = policiesResponse.AttachedPolicies!.find(p =>
        p.PolicyName?.includes('AWSLambdaVPCAccessExecutionRole')
      );
      expect(vpcPolicy).toBeDefined();
    });

    test('Lambda execution role should have inline policies for secrets and S3', async () => {
      const response = await iamClient.send(
        new ListRolePoliciesCommand({
          RoleName: `payment-lambda-role-${environmentSuffix}`,
        })
      );

      expect(response.PolicyNames).toBeDefined();
      expect(response.PolicyNames!.length).toBeGreaterThan(0);
    });
  });
});
