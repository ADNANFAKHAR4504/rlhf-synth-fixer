// Integration Tests for Multi-Environment Infrastructure Stack
import fs from 'fs';
import {
  EC2Client,
  DescribeVpcsCommand,
  DescribeSubnetsCommand,
  DescribeNatGatewaysCommand,
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
  AutoScalingClient,
  DescribeAutoScalingGroupsCommand
} from '@aws-sdk/client-auto-scaling';
import {
  CloudWatchClient,
  DescribeAlarmsCommand
} from '@aws-sdk/client-cloudwatch';
import {
  SNSClient,
  GetTopicAttributesCommand
} from '@aws-sdk/client-sns';

// Get environment suffix from environment variable (set by CI/CD pipeline)
const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';
const region = process.env.AWS_REGION || 'us-east-1';

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
const asgClient = new AutoScalingClient({ region });
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
      expect(outputs.LoadBalancerDNS).toContain('.elb.amazonaws.com');
    });

    test('should have RDSEndpoint output', () => {
      expect(outputs.RDSEndpoint).toBeDefined();
      expect(outputs.RDSEndpoint).toContain('.rds.amazonaws.com');
    });

    test('should have bucket outputs', () => {
      expect(outputs.StaticAssetsBucketName).toBeDefined();
      expect(outputs.ApplicationDataBucketName).toBeDefined();
      expect(outputs.StaticAssetsBucketName).toContain(environmentSuffix);
      expect(outputs.ApplicationDataBucketName).toContain(environmentSuffix);
    });

    test('should have Lambda function ARN', () => {
      expect(outputs.LambdaFunctionArn).toBeDefined();
      expect(outputs.LambdaFunctionArn).toContain(':lambda:');
      expect(outputs.LambdaFunctionArn).toContain(':function:');
    });

    test('should have Auto Scaling Group name', () => {
      expect(outputs.AutoScalingGroupName).toBeDefined();
      expect(outputs.AutoScalingGroupName).toContain(environmentSuffix);
    });

    test('should have SNS Topic ARN', () => {
      expect(outputs.AlarmTopicArn).toBeDefined();
      expect(outputs.AlarmTopicArn).toContain(':sns:');
    });
  });

  describe('VPC Infrastructure', () => {
    test('VPC should exist and be available', async () => {
      const command = new DescribeVpcsCommand({
        VpcIds: [outputs.VPCId]
      });
      const response = await ec2Client.send(command);

      expect(response.Vpcs).toHaveLength(1);
      expect(response.Vpcs![0].State).toBe('available');
      expect(response.Vpcs![0].VpcId).toBe(outputs.VPCId);
    }, 30000);

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

      expect(response.Subnets).toHaveLength(4);
    }, 30000);

    test('should have 2 NAT Gateways', async () => {
      const command = new DescribeNatGatewaysCommand({
        Filter: [
          {
            Name: 'vpc-id',
            Values: [outputs.VPCId]
          },
          {
            Name: 'state',
            Values: ['available', 'pending']
          }
        ]
      });
      const response = await ec2Client.send(command);

      expect(response.NatGateways!.length).toBeGreaterThanOrEqual(2);
    }, 30000);

    test('security groups should exist for ALB, RDS', async () => {
      const command = new DescribeSecurityGroupsCommand({
        Filters: [
          {
            Name: 'vpc-id',
            Values: [outputs.VPCId]
          }
        ]
      });
      const response = await ec2Client.send(command);

      // Should have at least: default, ALB SG, EC2 SG, RDS SG
      expect(response.SecurityGroups!.length).toBeGreaterThanOrEqual(4);
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
      expect(response.LoadBalancers![0].DNSName).toBe(outputs.LoadBalancerDNS);
    }, 30000);

    test('Target Group should exist', async () => {
      const targetGroupName = `tg-${environmentSuffix}`;
      const command = new DescribeTargetGroupsCommand({
        Names: [targetGroupName]
      });
      const response = await elbClient.send(command);

      expect(response.TargetGroups).toHaveLength(1);
      expect(response.TargetGroups![0].VpcId).toBe(outputs.VPCId);
    }, 30000);

    test('Auto Scaling Group should exist with correct configuration', async () => {
      const command = new DescribeAutoScalingGroupsCommand({
        AutoScalingGroupNames: [outputs.AutoScalingGroupName]
      });
      const response = await asgClient.send(command);

      expect(response.AutoScalingGroups).toHaveLength(1);
      const asg = response.AutoScalingGroups![0];
      expect(asg.MinSize).toBe(2);
      expect(asg.MaxSize).toBe(4);
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
    }, 30000);

    test('RDS should not be publicly accessible', async () => {
      const dbInstanceId = `rds-mysql-${environmentSuffix}`;
      const command = new DescribeDBInstancesCommand({
        DBInstanceIdentifier: dbInstanceId
      });
      const response = await rdsClient.send(command);

      expect(response.DBInstances![0].PubliclyAccessible).toBe(false);
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
  });

  describe('Storage', () => {
    test('Static Assets S3 bucket should exist', async () => {
      const command = new HeadBucketCommand({
        Bucket: outputs.StaticAssetsBucketName
      });
      await expect(s3Client.send(command)).resolves.toBeDefined();
    }, 30000);

    test('Application Data S3 bucket should exist', async () => {
      const command = new HeadBucketCommand({
        Bucket: outputs.ApplicationDataBucketName
      });
      await expect(s3Client.send(command)).resolves.toBeDefined();
    }, 30000);

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

      // For dev environment, versioning should be suspended
      // For staging/prod, it should be enabled
      expect(response.Status).toMatch(/Enabled|Suspended/);
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
    }, 30000);

    test('Lambda function should be invocable', async () => {
      const functionName = `data-processor-${environmentSuffix}`;
      const command = new InvokeCommand({
        FunctionName: functionName,
        InvocationType: 'RequestResponse'
      });
      const response = await lambdaClient.send(command);

      expect(response.StatusCode).toBe(200);
      expect(response.FunctionError).toBeUndefined();
    }, 30000);
  });

  describe('Monitoring', () => {
    test('CloudWatch alarms should exist', async () => {
      const command = new DescribeAlarmsCommand({
        AlarmNamePrefix: `high-cpu-${environmentSuffix}`
      });
      const response = await cloudwatchClient.send(command);

      expect(response.MetricAlarms!.length).toBeGreaterThan(0);
    }, 30000);

    test('SNS topic should exist', async () => {
      const command = new GetTopicAttributesCommand({
        TopicArn: outputs.AlarmTopicArn
      });
      const response = await snsClient.send(command);

      expect(response.Attributes).toBeDefined();
      expect(response.Attributes?.TopicArn).toBe(outputs.AlarmTopicArn);
    }, 30000);
  });

  describe('Resource Tagging', () => {
    test('VPC should have proper tags', async () => {
      const command = new DescribeVpcsCommand({
        VpcIds: [outputs.VPCId]
      });
      const response = await ec2Client.send(command);

      const tags = response.Vpcs![0].Tags || [];
      const nameTag = tags.find(t => t.Key === 'Name');
      expect(nameTag).toBeDefined();
      expect(nameTag?.Value).toContain(environmentSuffix);
    }, 30000);

    test('RDS should have environment tag', async () => {
      const dbInstanceId = `rds-mysql-${environmentSuffix}`;
      const command = new DescribeDBInstancesCommand({
        DBInstanceIdentifier: dbInstanceId
      });
      const response = await rdsClient.send(command);

      const tags = response.DBInstances![0].TagList || [];
      const envTag = tags.find(t => t.Key === 'Environment');
      expect(envTag).toBeDefined();
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
      expect(outputs.AutoScalingGroupName).toBeDefined();
      expect(outputs.AlarmTopicArn).toBeDefined();

      // All critical resources exist
      expect(Object.keys(outputs).length).toBeGreaterThanOrEqual(8);
    });

    test('resource naming follows convention', () => {
      // All resource names should include environment suffix
      expect(outputs.StaticAssetsBucketName).toContain(environmentSuffix);
      expect(outputs.ApplicationDataBucketName).toContain(environmentSuffix);
      expect(outputs.AutoScalingGroupName).toContain(environmentSuffix);
      expect(outputs.AlarmTopicArn).toContain(environmentSuffix);
    });
  });
});
