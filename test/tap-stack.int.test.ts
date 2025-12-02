import fs from 'fs';
import { CloudFormationClient, DescribeStacksCommand } from '@aws-sdk/client-cloudformation';
import { EC2Client, DescribeVpcsCommand, DescribeSubnetsCommand, DescribeSecurityGroupsCommand } from '@aws-sdk/client-ec2';
import { ElasticLoadBalancingV2Client, DescribeLoadBalancersCommand, DescribeTargetGroupsCommand } from '@aws-sdk/client-elastic-load-balancing-v2';
import { RDSClient, DescribeDBInstancesCommand } from '@aws-sdk/client-rds';
import { S3Client, HeadBucketCommand, GetBucketVersioningCommand, GetBucketEncryptionCommand } from '@aws-sdk/client-s3';
import { SQSClient, GetQueueAttributesCommand } from '@aws-sdk/client-sqs';
import { LambdaClient, GetFunctionCommand } from '@aws-sdk/client-lambda';

// Read deployment outputs
const outputs = JSON.parse(
  fs.readFileSync('cfn-outputs/flat-outputs.json', 'utf8')
);

const region = process.env.AWS_REGION || 'us-east-1';
const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';

// Initialize AWS clients
const cfnClient = new CloudFormationClient({ region });
const ec2Client = new EC2Client({ region });
const elbClient = new ElasticLoadBalancingV2Client({ region });
const rdsClient = new RDSClient({ region });
const s3Client = new S3Client({ region });
const sqsClient = new SQSClient({ region });
const lambdaClient = new LambdaClient({ region });

describe('Payment Processing Stack - Integration Tests', () => {
  describe('Stack Outputs Validation', () => {
    test('should have all required outputs', () => {
      expect(outputs.VPCId).toBeDefined();
      expect(outputs.LoadBalancerDNS).toBeDefined();
      expect(outputs.RDSEndpoint).toBeDefined();
      expect(outputs.PaymentLogsBucketName).toBeDefined();
      expect(outputs.TransactionArchiveBucketName).toBeDefined();
      expect(outputs.PaymentQueueURL).toBeDefined();
      expect(outputs.LambdaFunctionArn).toBeDefined();
    });

    test('VPCId should be a valid VPC ID format', () => {
      expect(outputs.VPCId).toMatch(/^vpc-[a-f0-9]+$/);
    });

    test('LoadBalancerDNS should be a valid DNS format', () => {
      expect(outputs.LoadBalancerDNS).toMatch(/\.elb\./);
    });

    test('RDSEndpoint should be a valid RDS endpoint format', () => {
      expect(outputs.RDSEndpoint).toMatch(/\.rds\.amazonaws\.com$/);
    });

    test('bucket names should contain environment suffix', () => {
      expect(outputs.PaymentLogsBucketName).toContain(environmentSuffix);
      expect(outputs.TransactionArchiveBucketName).toContain(environmentSuffix);
    });

    test('SQS queue URL should be valid', () => {
      expect(outputs.PaymentQueueURL).toMatch(/^https:\/\/sqs\./);
      expect(outputs.PaymentQueueURL).toContain(environmentSuffix);
    });

    test('Lambda ARN should be valid', () => {
      expect(outputs.LambdaFunctionArn).toMatch(/^arn:aws:lambda:/);
      expect(outputs.LambdaFunctionArn).toContain(environmentSuffix);
    });
  });

  describe('VPC Configuration', () => {
    test('VPC should exist and be available', async () => {
      const command = new DescribeVpcsCommand({
        VpcIds: [outputs.VPCId]
      });
      const response = await ec2Client.send(command);
      expect(response.Vpcs).toHaveLength(1);
      expect(response.Vpcs![0].State).toBe('available');
      expect(response.Vpcs![0].CidrBlock).toBe('10.0.0.0/16');
    });

    test('should have correct subnets', async () => {
      const command = new DescribeSubnetsCommand({
        Filters: [
          {
            Name: 'vpc-id',
            Values: [outputs.VPCId]
          }
        ]
      });
      const response = await ec2Client.send(command);
      expect(response.Subnets).toBeDefined();
      expect(response.Subnets!.length).toBe(4); // 2 public + 2 private

      const publicSubnets = response.Subnets!.filter(subnet =>
        subnet.MapPublicIpOnLaunch === true
      );
      expect(publicSubnets).toHaveLength(2);

      const privateSubnets = response.Subnets!.filter(subnet =>
        subnet.MapPublicIpOnLaunch === false
      );
      expect(privateSubnets).toHaveLength(2);
    });

    test('should have security groups created', async () => {
      const command = new DescribeSecurityGroupsCommand({
        Filters: [
          {
            Name: 'vpc-id',
            Values: [outputs.VPCId]
          },
          {
            Name: 'group-name',
            Values: [`alb-sg-${environmentSuffix}`]
          }
        ]
      });
      const response = await ec2Client.send(command);
      expect(response.SecurityGroups).toHaveLength(1);
    });
  });

  describe('Load Balancer Configuration', () => {
    test('ALB should be active and accessible', async () => {
      const dnsName = outputs.LoadBalancerDNS;
      const command = new DescribeLoadBalancersCommand({
        Names: [`alb-${environmentSuffix}`]
      });
      const response = await elbClient.send(command);
      expect(response.LoadBalancers).toHaveLength(1);
      expect(response.LoadBalancers![0].State?.Code).toBe('active');
      expect(response.LoadBalancers![0].Scheme).toBe('internet-facing');
      expect(response.LoadBalancers![0].Type).toBe('application');
      expect(response.LoadBalancers![0].DNSName).toBe(dnsName);
    });

    test('target group should exist with health check configuration', async () => {
      const command = new DescribeTargetGroupsCommand({
        Names: [`tg-${environmentSuffix}`]
      });
      const response = await elbClient.send(command);
      expect(response.TargetGroups).toHaveLength(1);
      expect(response.TargetGroups![0].HealthCheckEnabled).toBe(true);
      expect(response.TargetGroups![0].HealthCheckPath).toBe('/health');
      expect(response.TargetGroups![0].HealthCheckIntervalSeconds).toBe(30);
    });
  });

  describe('RDS Database Configuration', () => {
    test('RDS instance should be available', async () => {
      const command = new DescribeDBInstancesCommand({
        DBInstanceIdentifier: `payment-db-${environmentSuffix}`
      });
      const response = await rdsClient.send(command);
      expect(response.DBInstances).toHaveLength(1);
      const dbInstance = response.DBInstances![0];
      expect(dbInstance.DBInstanceStatus).toBe('available');
      expect(dbInstance.Engine).toBe('postgres');
      expect(dbInstance.StorageEncrypted).toBe(true);
      expect(dbInstance.PubliclyAccessible).toBe(false);
      expect(dbInstance.BackupRetentionPeriod).toBe(7);
    });

    test('RDS endpoint should match stack output', async () => {
      const command = new DescribeDBInstancesCommand({
        DBInstanceIdentifier: `payment-db-${environmentSuffix}`
      });
      const response = await rdsClient.send(command);
      const dbInstance = response.DBInstances![0];
      expect(dbInstance.Endpoint?.Address).toBe(outputs.RDSEndpoint);
    });
  });

  describe('S3 Buckets Configuration', () => {
    test('PaymentLogsBucket should exist and be accessible', async () => {
      const command = new HeadBucketCommand({
        Bucket: outputs.PaymentLogsBucketName
      });
      await expect(s3Client.send(command)).resolves.toBeDefined();
    });

    test('PaymentLogsBucket should have versioning enabled', async () => {
      const command = new GetBucketVersioningCommand({
        Bucket: outputs.PaymentLogsBucketName
      });
      const response = await s3Client.send(command);
      expect(response.Status).toBe('Enabled');
    });

    test('PaymentLogsBucket should have encryption enabled', async () => {
      const command = new GetBucketEncryptionCommand({
        Bucket: outputs.PaymentLogsBucketName
      });
      const response = await s3Client.send(command);
      expect(response.ServerSideEncryptionConfiguration).toBeDefined();
      expect(response.ServerSideEncryptionConfiguration!.Rules).toHaveLength(1);
      expect(response.ServerSideEncryptionConfiguration!.Rules[0].ApplyServerSideEncryptionByDefault?.SSEAlgorithm).toBe('AES256');
    });

    test('TransactionArchiveBucket should exist and be accessible', async () => {
      const command = new HeadBucketCommand({
        Bucket: outputs.TransactionArchiveBucketName
      });
      await expect(s3Client.send(command)).resolves.toBeDefined();
    });

    test('TransactionArchiveBucket should have versioning enabled', async () => {
      const command = new GetBucketVersioningCommand({
        Bucket: outputs.TransactionArchiveBucketName
      });
      const response = await s3Client.send(command);
      expect(response.Status).toBe('Enabled');
    });

    test('TransactionArchiveBucket should have encryption enabled', async () => {
      const command = new GetBucketEncryptionCommand({
        Bucket: outputs.TransactionArchiveBucketName
      });
      const response = await s3Client.send(command);
      expect(response.ServerSideEncryptionConfiguration).toBeDefined();
      expect(response.ServerSideEncryptionConfiguration!.Rules).toHaveLength(1);
      expect(response.ServerSideEncryptionConfiguration!.Rules[0].ApplyServerSideEncryptionByDefault?.SSEAlgorithm).toBe('AES256');
    });
  });

  describe('SQS Queue Configuration', () => {
    test('PaymentQueue should exist with correct configuration', async () => {
      const command = new GetQueueAttributesCommand({
        QueueUrl: outputs.PaymentQueueURL,
        AttributeNames: ['All']
      });
      const response = await sqsClient.send(command);
      expect(response.Attributes).toBeDefined();
      expect(response.Attributes!.QueueArn).toContain(environmentSuffix);
      expect(response.Attributes!.MessageRetentionPeriod).toBe('345600');
      expect(response.Attributes!.ReceiveMessageWaitTimeSeconds).toBe('20');
    });

    test('PaymentQueue should have dead letter queue configured', async () => {
      const command = new GetQueueAttributesCommand({
        QueueUrl: outputs.PaymentQueueURL,
        AttributeNames: ['RedrivePolicy']
      });
      const response = await sqsClient.send(command);
      expect(response.Attributes?.RedrivePolicy).toBeDefined();
      const redrivePolicy = JSON.parse(response.Attributes!.RedrivePolicy!);
      expect(redrivePolicy.maxReceiveCount).toBe(3);
      expect(redrivePolicy.deadLetterTargetArn).toContain('payment-dlq');
    });
  });

  describe('Lambda Function Configuration', () => {
    test('PaymentValidationFunction should exist and be active', async () => {
      const functionName = outputs.LambdaFunctionArn.split(':').pop();
      const command = new GetFunctionCommand({
        FunctionName: functionName
      });
      const response = await lambdaClient.send(command);
      expect(response.Configuration).toBeDefined();
      expect(response.Configuration!.State).toBe('Active');
      expect(response.Configuration!.Runtime).toBe('python3.11');
      expect(response.Configuration!.Handler).toBe('index.lambda_handler');
      expect(response.Configuration!.Timeout).toBe(60);
      expect(response.Configuration!.MemorySize).toBe(256);
    });

    test('Lambda function should have correct environment variables', async () => {
      const functionName = outputs.LambdaFunctionArn.split(':').pop();
      const command = new GetFunctionCommand({
        FunctionName: functionName
      });
      const response = await lambdaClient.send(command);
      expect(response.Configuration?.Environment?.Variables).toBeDefined();
      expect(response.Configuration!.Environment!.Variables!.LOGS_BUCKET).toBe(outputs.PaymentLogsBucketName);
      expect(response.Configuration!.Environment!.Variables!.ENVIRONMENT).toBeDefined();
    });

    test('Lambda function should be in VPC', async () => {
      const functionName = outputs.LambdaFunctionArn.split(':').pop();
      const command = new GetFunctionCommand({
        FunctionName: functionName
      });
      const response = await lambdaClient.send(command);
      expect(response.Configuration?.VpcConfig).toBeDefined();
      expect(response.Configuration!.VpcConfig!.VpcId).toBe(outputs.VPCId);
      expect(response.Configuration!.VpcConfig!.SubnetIds).toHaveLength(2);
      expect(response.Configuration!.VpcConfig!.SecurityGroupIds).toHaveLength(1);
    });
  });

  describe('Resource Naming Conventions', () => {
    test('all resources should include environment suffix', () => {
      expect(outputs.PaymentLogsBucketName).toContain(environmentSuffix);
      expect(outputs.TransactionArchiveBucketName).toContain(environmentSuffix);
      expect(outputs.PaymentQueueURL).toContain(environmentSuffix);
      expect(outputs.LambdaFunctionArn).toContain(environmentSuffix);
      expect(outputs.LoadBalancerDNS).toContain(environmentSuffix);
    });
  });

  describe('End-to-End Workflow', () => {
    test('all critical infrastructure components should be operational', async () => {
      // VPC should be available
      const vpcCommand = new DescribeVpcsCommand({
        VpcIds: [outputs.VPCId]
      });
      const vpcResponse = await ec2Client.send(vpcCommand);
      expect(vpcResponse.Vpcs![0].State).toBe('available');

      // ALB should be active
      const albCommand = new DescribeLoadBalancersCommand({
        Names: [`alb-${environmentSuffix}`]
      });
      const albResponse = await elbClient.send(albCommand);
      expect(albResponse.LoadBalancers![0].State?.Code).toBe('active');

      // RDS should be available
      const rdsCommand = new DescribeDBInstancesCommand({
        DBInstanceIdentifier: `payment-db-${environmentSuffix}`
      });
      const rdsResponse = await rdsClient.send(rdsCommand);
      expect(rdsResponse.DBInstances![0].DBInstanceStatus).toBe('available');

      // S3 buckets should be accessible
      await expect(s3Client.send(new HeadBucketCommand({
        Bucket: outputs.PaymentLogsBucketName
      }))).resolves.toBeDefined();

      await expect(s3Client.send(new HeadBucketCommand({
        Bucket: outputs.TransactionArchiveBucketName
      }))).resolves.toBeDefined();

      // SQS queue should be accessible
      const sqsCommand = new GetQueueAttributesCommand({
        QueueUrl: outputs.PaymentQueueURL,
        AttributeNames: ['QueueArn']
      });
      const sqsResponse = await sqsClient.send(sqsCommand);
      expect(sqsResponse.Attributes?.QueueArn).toBeDefined();

      // Lambda should be active
      const functionName = outputs.LambdaFunctionArn.split(':').pop();
      const lambdaCommand = new GetFunctionCommand({
        FunctionName: functionName
      });
      const lambdaResponse = await lambdaClient.send(lambdaCommand);
      expect(lambdaResponse.Configuration!.State).toBe('Active');
    });
  });
});
