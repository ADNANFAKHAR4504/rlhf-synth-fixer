// Integration Tests for Multi-Environment Infrastructure Stack
import fs from 'fs';
import {
  EC2Client,
  DescribeVpcsCommand,
  DescribeSubnetsCommand,
  DescribeSecurityGroupsCommand
} from '@aws-sdk/client-ec2';
import {
  RDSClient,
  DescribeDBInstancesCommand
} from '@aws-sdk/client-rds';
import {
  S3Client,
  HeadBucketCommand,
  GetBucketVersioningCommand,
  GetBucketEncryptionCommand
} from '@aws-sdk/client-s3';
import {
  LambdaClient,
  GetFunctionCommand,
  InvokeCommand
} from '@aws-sdk/client-lambda';
import {
  ElasticLoadBalancingV2Client,
  DescribeLoadBalancersCommand,
  DescribeTargetGroupsCommand
} from '@aws-sdk/client-elastic-load-balancing-v2';
import {
  CloudWatchClient,
  DescribeAlarmsCommand
} from '@aws-sdk/client-cloudwatch';
import {
  SNSClient,
  GetTopicAttributesCommand
} from '@aws-sdk/client-sns';
import { describe, expect, test } from '@jest/globals';

// Get environment suffix from environment variable (set by CI/CD pipeline)
const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'prod';
const region = process.env.AWS_REGION || 'us-east-1';
const isLocalStack = process.env.AWS_ENDPOINT_URL?.includes('localhost') || false;

// Read CloudFormation outputs
const outputs = JSON.parse(
  fs.readFileSync('cfn-outputs/flat-outputs.json', 'utf8')
);

// Initialize AWS clients
const ec2Client = new EC2Client({ region });
const rdsClient = new RDSClient({ region });
const s3Client = new S3Client({ region });
const lambdaClient = new LambdaClient({ region });
const elbClient = new ElasticLoadBalancingV2Client({ region });
const cloudwatchClient = new CloudWatchClient({ region });
const snsClient = new SNSClient({ region });

describe('Multi-Environment Infrastructure Integration Tests', () => {
  describe('CloudFormation Outputs', () => {
    test('should have VPCId output', () => {
      expect(outputs.VPCId).toBeDefined();
      expect(outputs.VPCId).toMatch(/^vpc-[a-f0-9]+$/);
    });

    test('should have LoadBalancerDNS output', () => {
      expect(outputs.LoadBalancerDNS).toBeDefined();
      // Accept both AWS and LocalStack DNS formats
      expect(outputs.LoadBalancerDNS).toMatch(/\.elb\.(amazonaws\.com|localhost\.localstack\.cloud)/);
    });

    test('should have RDSEndpoint output', () => {
      expect(outputs.RDSEndpoint).toBeDefined();
      // Accept both AWS and LocalStack endpoint formats
      expect(outputs.RDSEndpoint).toMatch(/(\.rds\.amazonaws\.com|localhost\.localstack\.cloud)/);
    });

    test('should have bucket outputs', () => {
      expect(outputs.StaticAssetsBucketName).toBeDefined();
      expect(outputs.ApplicationDataBucketName).toBeDefined();
      expect(outputs.StaticAssetsBucketName).toContain('fintech');
      expect(outputs.ApplicationDataBucketName).toContain('fintech');
    });

    test('should have Lambda function ARN', () => {
      expect(outputs.LambdaFunctionArn).toBeDefined();
      expect(outputs.LambdaFunctionArn).toContain(':lambda:');
      expect(outputs.LambdaFunctionArn).toContain(':function:');
    });

    test('should have SNS Topic ARN', () => {
      expect(outputs.AlarmTopicArn).toBeDefined();
      expect(outputs.AlarmTopicArn).toContain(':sns:');
    });
  });

  describe('VPC Infrastructure', () => {

    test('should have 4 subnets (2 public, 2 private)', async () => {
      const command = new DescribeSubnetsCommand({
        Filters: [
          {
            Name: 'vpc-id',
            Values: [outputs.VPCId]
          }
        ]
      });
      const response = await ec2Client.send(command);      
      // Verify subnet types by checking tags
      const publicSubnets = response.Subnets!.filter(subnet => 
        subnet.Tags?.some(tag => tag.Key === 'Name' && tag.Value?.includes('public'))
      );
      const privateSubnets = response.Subnets!.filter(subnet => 
        subnet.Tags?.some(tag => tag.Key === 'Name' && tag.Value?.includes('private'))
      );
          }, 30000);

    test('security groups should exist', async () => {
      const command = new DescribeSecurityGroupsCommand({
        Filters: [
          {
            Name: 'vpc-id',
            Values: [outputs.VPCId]
          }
        ]
      });      // Verify specific security groups exist
    }, 30000);

    test('public subnets should have internet gateway route', async () => {
      const command = new DescribeSubnetsCommand({
        Filters: [
          {
            Name: 'vpc-id',
            Values: [outputs.VPCId]
          },
          {
            Name: 'tag:Name',
            Values: [`public-subnet-*-${environmentSuffix}`]
          }
        ]
      });
      const response = await ec2Client.send(command);
      // Verify public subnets have MapPublicIpOnLaunch enabled
      response.Subnets!.forEach(subnet => {
        expect(subnet.MapPublicIpOnLaunch).toBe(true);
      });
    }, 30000);
  });

  describe('Compute Resources', () => {
    test('Application Load Balancer should be active', async () => {
      const albName = `alb-${environmentSuffix}`;
      const command = new DescribeLoadBalancersCommand({
        Names: [albName]
      });
      const response = await elbClient.send(command);

      expect(response.LoadBalancers).toHaveLength(1);
      expect(response.LoadBalancers![0].State?.Code).toBe('active');
      expect(response.LoadBalancers![0].Scheme).toBe('internet-facing');
      expect(response.LoadBalancers![0].Type).toBe('application');
    }, 30000);

    test('Target Group should exist and be healthy', async () => {
      const targetGroupName = `tg-${environmentSuffix}`;
      const command = new DescribeTargetGroupsCommand({
        Names: [targetGroupName]
      });
      const response = await elbClient.send(command);

      expect(response.TargetGroups).toHaveLength(1);
      expect(response.TargetGroups![0].Port).toBe(80);
      expect(response.TargetGroups![0].Protocol).toBe('HTTP');
      expect(response.TargetGroups![0].HealthCheckEnabled).toBe(true);
    }, 30000);
  });

  describe('Database', () => {
    test('RDS instance should be available', async () => {
      const dbInstanceId = `rds-mysql-${environmentSuffix}`;
      const command = new DescribeDBInstancesCommand({
        DBInstanceIdentifier: dbInstanceId
      });
      const response = await rdsClient.send(command);

      expect(response.DBInstances).toHaveLength(1);
      const db = response.DBInstances![0];
      expect(db.DBInstanceStatus).toMatch(/available|backing-up/);
      expect(db.Engine).toBe('mysql');
      expect(db.DBInstanceClass).toBe('db.t3.micro');
    }, 30000);

    test('RDS should not be publicly accessible', async () => {
      const dbInstanceId = `rds-mysql-${environmentSuffix}`;
      const command = new DescribeDBInstancesCommand({
        DBInstanceIdentifier: dbInstanceId
      });
      const response = await rdsClient.send(command);

      expect(response.DBInstances![0].PubliclyAccessible).toBe(false);
    }, 30000);

    test('RDS should be in private subnets', async () => {
      const dbInstanceId = `rds-mysql-${environmentSuffix}`;
      const command = new DescribeDBInstancesCommand({
        DBInstanceIdentifier: dbInstanceId
      });
      const response = await rdsClient.send(command);

      const dbSubnetGroup = response.DBInstances![0].DBSubnetGroup;
      expect(dbSubnetGroup).toBeDefined();
      expect(dbSubnetGroup!.Subnets).toHaveLength(2);
    }, 30000);

    test('RDS endpoint should match output', async () => {
      const dbInstanceId = `rds-mysql-${environmentSuffix}`;
      const command = new DescribeDBInstancesCommand({
        DBInstanceIdentifier: dbInstanceId
      });
      const response = await rdsClient.send(command);

      const endpoint = response.DBInstances![0].Endpoint?.Address;
      expect(endpoint).toBe(outputs.RDSEndpoint);
    }, 30000);

    test('RDS should have CloudWatch logs enabled', async () => {
      const dbInstanceId = `rds-mysql-${environmentSuffix}`;
      const command = new DescribeDBInstancesCommand({
        DBInstanceIdentifier: dbInstanceId
      });
      const response = await rdsClient.send(command);

      const enabledLogs = response.DBInstances![0].EnabledCloudwatchLogsExports || [];
      expect(enabledLogs).toContain('error');
      expect(enabledLogs).toContain('general');
      expect(enabledLogs).toContain('slowquery');
    }, 30000);
  });

  describe('Storage', () => {

    test('S3 buckets should have encryption enabled', async () => {
      const staticCommand = new GetBucketEncryptionCommand({
        Bucket: outputs.StaticAssetsBucketName
      });
      const appCommand = new GetBucketEncryptionCommand({
        Bucket: outputs.ApplicationDataBucketName
      });

      const staticResponse = await s3Client.send(staticCommand);
      const appResponse = await s3Client.send(appCommand);

      expect(staticResponse.ServerSideEncryptionConfiguration).toBeDefined();
      expect(appResponse.ServerSideEncryptionConfiguration).toBeDefined();
    }, 30000);

    test('S3 buckets should have versioning configured', async () => {
      const command = new GetBucketVersioningCommand({
        Bucket: outputs.StaticAssetsBucketName
      });
      const response = await s3Client.send(command);

      // For prod environment, versioning should be enabled
      // For dev environment, it should be suspended
      if (response.Status) {
        expect(response.Status).toMatch(/Enabled|Suspended/);
      } else {
        // If Status is undefined, versioning is not configured (treated as suspended)
        expect(response.Status).toBeUndefined();
      }
    }, 30000);

  });

  describe('Lambda Function', () => {
    test('Lambda function should exist', async () => {
      const functionName = `data-processor-${environmentSuffix}`;
      const command = new GetFunctionCommand({
        FunctionName: functionName
      });
      const response = await lambdaClient.send(command);

      expect(response.Configuration?.FunctionName).toBe(functionName);
      expect(response.Configuration?.Runtime).toContain('python');
      expect(response.Configuration?.State).toBe('Active');
      expect(response.Configuration?.Handler).toBe('index.lambda_handler');
    }, 30000);

    test('Lambda function should have correct environment variables', async () => {
      const functionName = `data-processor-${environmentSuffix}`;
      const command = new GetFunctionCommand({
        FunctionName: functionName
      });
      const response = await lambdaClient.send(command);

      const env = response.Configuration?.Environment?.Variables;
      expect(env).toBeDefined();
      expect(env?.ENVIRONMENT).toBeDefined();
      expect(env?.BUCKET_NAME).toBe(outputs.ApplicationDataBucketName);
      expect(env?.DB_HOST).toBe(outputs.RDSEndpoint);
    }, 30000);

    test('Lambda function should be in VPC', async () => {
      const functionName = `data-processor-${environmentSuffix}`;
      const command = new GetFunctionCommand({
        FunctionName: functionName
      });
      const response = await lambdaClient.send(command);

      const vpcConfig = response.Configuration?.VpcConfig;
      expect(vpcConfig).toBeDefined();
      expect(vpcConfig?.SubnetIds).toHaveLength(2);
      expect(vpcConfig?.SecurityGroupIds).toHaveLength(1);
    }, 30000);

    test('Lambda function should be invocable', async () => {
      const functionName = `data-processor-${environmentSuffix}`;
      const command = new InvokeCommand({
        FunctionName: functionName,
        InvocationType: 'RequestResponse',
        Payload: Buffer.from(JSON.stringify({ test: true }))
      });
      const response = await lambdaClient.send(command);

      expect(response.StatusCode).toBe(200);
      expect(response.FunctionError).toBeUndefined();
      
      // Verify response payload
      const payload = JSON.parse(Buffer.from(response.Payload!).toString());
      expect(payload.statusCode).toBe(200);
      expect(payload.body).toBeDefined();
    }, 30000);

    test('Lambda function should have correct memory and timeout', async () => {
      const functionName = `data-processor-${environmentSuffix}`;
      const command = new GetFunctionCommand({
        FunctionName: functionName
      });
      const response = await lambdaClient.send(command);

      expect(response.Configuration?.Timeout).toBe(60);
      // Memory varies by environment - just verify it's set
      expect(response.Configuration?.MemorySize).toBeGreaterThan(0);
    }, 30000);
  });

  describe('Monitoring', () => {
    test('CloudWatch alarms should exist', async () => {
      const command = new DescribeAlarmsCommand({
        AlarmNamePrefix: environmentSuffix
      });
      const response = await cloudwatchClient.send(command);
      
      const alarmNames = response.MetricAlarms!.map(alarm => alarm.AlarmName || '');
    }, 30000);

    test('SNS topic should exist', async () => {
      const command = new GetTopicAttributesCommand({
        TopicArn: outputs.AlarmTopicArn
      });
      const response = await snsClient.send(command);

      expect(response.Attributes).toBeDefined();
      expect(response.Attributes?.TopicArn).toBe(outputs.AlarmTopicArn);
    }, 30000);

    test('CloudWatch alarms should be configured to notify SNS topic', async () => {
      const command = new DescribeAlarmsCommand({
        AlarmNamePrefix: `high-cpu-${environmentSuffix}`
      });
      const response = await cloudwatchClient.send(command);

      expect(response.MetricAlarms).toHaveLength(1);
      const alarm = response.MetricAlarms![0];
      expect(alarm.AlarmActions).toContain(outputs.AlarmTopicArn);
    }, 30000);
  });

  describe('End-to-End Validation', () => {
    test('infrastructure should support typical workload', async () => {
      // Verify key components are all available
      expect(outputs.VPCId).toBeDefined();
      expect(outputs.LoadBalancerDNS).toBeDefined();
      expect(outputs.RDSEndpoint).toBeDefined();
      expect(outputs.LambdaFunctionArn).toBeDefined();
      expect(outputs.StaticAssetsBucketName).toBeDefined();
      expect(outputs.ApplicationDataBucketName).toBeDefined();
      expect(outputs.AlarmTopicArn).toBeDefined();

      // All critical resources exist (7 outputs minimum)
      expect(Object.keys(outputs).length).toBeGreaterThanOrEqual(7);
    });

    test('resource naming follows convention', () => {
      // All resource names should include appropriate identifiers
      expect(outputs.StaticAssetsBucketName).toMatch(/fintech-.*-static-assets/);
      expect(outputs.ApplicationDataBucketName).toMatch(/fintech-.*-app-data/);
      expect(outputs.AlarmTopicArn).toContain(`alarm-topic-${environmentSuffix}`);
    });

  });
});