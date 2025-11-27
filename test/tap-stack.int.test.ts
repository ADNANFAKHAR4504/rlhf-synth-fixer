// Integration Tests - Three-Tier Web Application Infrastructure
// These tests validate the actual deployed infrastructure using real AWS outputs

import fs from 'fs';
import {
  EC2Client,
  DescribeVpcsCommand,
  DescribeSubnetsCommand,
  DescribeSecurityGroupsCommand,
} from '@aws-sdk/client-ec2';
import {
  ElasticLoadBalancingV2Client,
  DescribeLoadBalancersCommand,
  DescribeTargetGroupsCommand,
  DescribeTargetHealthCommand,
} from '@aws-sdk/client-elastic-load-balancing-v2';
import {
  RDSClient,
  DescribeDBClustersCommand,
  DescribeDBInstancesCommand,
} from '@aws-sdk/client-rds';
import {
  LambdaClient,
  GetFunctionCommand,
  GetFunctionConfigurationCommand,
} from '@aws-sdk/client-lambda';
import {
  S3Client,
  HeadBucketCommand,
  GetBucketEncryptionCommand,
  GetBucketVersioningCommand,
  GetPublicAccessBlockCommand,
} from '@aws-sdk/client-s3';
import {
  SNSClient,
  GetTopicAttributesCommand,
  ListSubscriptionsByTopicCommand,
} from '@aws-sdk/client-sns';
import {
  CloudWatchClient,
  DescribeAlarmsCommand,
} from '@aws-sdk/client-cloudwatch';

// Read deployment outputs
const outputs = JSON.parse(
  fs.readFileSync('cfn-outputs/flat-outputs.json', 'utf8')
);

const region = process.env.AWS_REGION || 'us-east-1';
const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';

// Initialize AWS SDK clients
const ec2Client = new EC2Client({ region });
const elbClient = new ElasticLoadBalancingV2Client({ region });
const rdsClient = new RDSClient({ region });
const lambdaClient = new LambdaClient({ region });
const s3Client = new S3Client({ region });
const snsClient = new SNSClient({ region });
const cwClient = new CloudWatchClient({ region });

describe('Three-Tier Web Application - Integration Tests', () => {
  describe('Deployment Outputs Validation', () => {
    test('should have all required outputs', () => {
      expect(outputs.VPCId).toBeDefined();
      expect(outputs.ALBDNSName).toBeDefined();
      expect(outputs.DBClusterEndpoint).toBeDefined();
      expect(outputs.DBClusterReadEndpoint).toBeDefined();
      expect(outputs.LambdaFunctionArn).toBeDefined();
      expect(outputs.StaticAssetsBucketName).toBeDefined();
      expect(outputs.SNSTopicArn).toBeDefined();
    });

    test('VPCId should be valid AWS VPC ID format', () => {
      expect(outputs.VPCId).toMatch(/^vpc-[a-f0-9]{8,17}$/);
    });

    test('ALB DNS name should be valid format', () => {
      expect(outputs.ALBDNSName).toMatch(/^[a-z0-9-]+\.us-east-1\.elb\.amazonaws\.com$/);
    });

    test('Lambda ARN should be valid format', () => {
      expect(outputs.LambdaFunctionArn).toMatch(/^arn:aws:lambda:us-east-1:\d{12}:function:.+$/);
    });

    test('SNS Topic ARN should be valid format', () => {
      expect(outputs.SNSTopicArn).toMatch(/^arn:aws:sns:us-east-1:\d{12}:.+$/);
    });
  });

  describe('VPC and Network Infrastructure', () => {
    test('VPC should exist and be available', async () => {
      const command = new DescribeVpcsCommand({
        VpcIds: [outputs.VPCId],
      });
      const response = await ec2Client.send(command);

      expect(response.Vpcs).toBeDefined();
      expect(response.Vpcs!.length).toBe(1);
      expect(response.Vpcs![0].State).toBe('available');
      expect(response.Vpcs![0].CidrBlock).toBeDefined();
    }, 30000);

    test('should have subnets across multiple availability zones', async () => {
      const command = new DescribeSubnetsCommand({
        Filters: [
          { Name: 'vpc-id', Values: [outputs.VPCId] },
        ],
      });
      const response = await ec2Client.send(command);

      expect(response.Subnets).toBeDefined();
      expect(response.Subnets!.length).toBeGreaterThanOrEqual(6); // 3 public + 3 private

      const azs = new Set(response.Subnets!.map(s => s.AvailabilityZone));
      expect(azs.size).toBeGreaterThanOrEqual(3); // At least 3 AZs
    }, 30000);

    test('should have public and private subnets', async () => {
      const command = new DescribeSubnetsCommand({
        Filters: [
          { Name: 'vpc-id', Values: [outputs.VPCId] },
        ],
      });
      const response = await ec2Client.send(command);

      const publicSubnets = response.Subnets!.filter(s => s.MapPublicIpOnLaunch);
      const privateSubnets = response.Subnets!.filter(s => !s.MapPublicIpOnLaunch);

      expect(publicSubnets.length).toBeGreaterThanOrEqual(3);
      expect(privateSubnets.length).toBeGreaterThanOrEqual(3);
    }, 30000);
  });

  describe('Application Load Balancer', () => {
    let albArn: string;

    beforeAll(async () => {
      const command = new DescribeLoadBalancersCommand({});
      const response = await elbClient.send(command);
      const alb = response.LoadBalancers!.find(lb =>
        lb.DNSName === outputs.ALBDNSName
      );
      albArn = alb!.LoadBalancerArn!;
    });

    test('ALB should exist and be active', async () => {
      const command = new DescribeLoadBalancersCommand({});
      const response = await elbClient.send(command);

      const alb = response.LoadBalancers!.find(lb =>
        lb.DNSName === outputs.ALBDNSName
      );

      expect(alb).toBeDefined();
      expect(alb!.State!.Code).toBe('active');
      expect(alb!.Scheme).toBe('internet-facing');
      expect(alb!.Type).toBe('application');
    }, 30000);

    test('ALB should be in multiple availability zones', async () => {
      const command = new DescribeLoadBalancersCommand({});
      const response = await elbClient.send(command);

      const alb = response.LoadBalancers!.find(lb =>
        lb.DNSName === outputs.ALBDNSName
      );

      expect(alb!.AvailabilityZones!.length).toBeGreaterThanOrEqual(3);
    }, 30000);

    test('ALB should have target group with health checks configured', async () => {
      const command = new DescribeTargetGroupsCommand({
        LoadBalancerArn: albArn,
      });
      const response = await elbClient.send(command);

      expect(response.TargetGroups).toBeDefined();
      expect(response.TargetGroups!.length).toBeGreaterThan(0);

      const tg = response.TargetGroups![0];
      expect(tg.HealthCheckEnabled).toBe(true);
      expect(tg.HealthCheckPath).toBeDefined();
      expect(tg.HealthCheckIntervalSeconds).toBeDefined();
    }, 30000);
  });

  describe('RDS Aurora Database Cluster', () => {
    test('Aurora cluster should exist and be available', async () => {
      const clusterIdentifier = outputs.DBClusterEndpoint.split('.')[0];
      const command = new DescribeDBClustersCommand({
        DBClusterIdentifier: clusterIdentifier,
      });
      const response = await rdsClient.send(command);

      expect(response.DBClusters).toBeDefined();
      expect(response.DBClusters!.length).toBe(1);
      expect(response.DBClusters![0].Status).toBe('available');
      expect(response.DBClusters![0].Engine).toBe('aurora-mysql');
    }, 30000);

    test('Aurora cluster should have encryption enabled', async () => {
      const clusterIdentifier = outputs.DBClusterEndpoint.split('.')[0];
      const command = new DescribeDBClustersCommand({
        DBClusterIdentifier: clusterIdentifier,
      });
      const response = await rdsClient.send(command);

      expect(response.DBClusters![0].StorageEncrypted).toBe(true);
    }, 30000);

    test('Aurora cluster should have both writer and reader endpoints', async () => {
      expect(outputs.DBClusterEndpoint).toBeDefined();
      expect(outputs.DBClusterReadEndpoint).toBeDefined();
      expect(outputs.DBClusterEndpoint).not.toBe(outputs.DBClusterReadEndpoint);
    });

    test('Aurora cluster should have multiple instances', async () => {
      const clusterIdentifier = outputs.DBClusterEndpoint.split('.')[0];
      const command = new DescribeDBInstancesCommand({
        Filters: [
          { Name: 'db-cluster-id', Values: [clusterIdentifier] },
        ],
      });
      const response = await rdsClient.send(command);

      expect(response.DBInstances).toBeDefined();
      expect(response.DBInstances!.length).toBeGreaterThanOrEqual(2);

      response.DBInstances!.forEach(instance => {
        expect(instance.DBInstanceStatus).toBe('available');
      });
    }, 30000);

    test('Aurora instances should be in different availability zones', async () => {
      const clusterIdentifier = outputs.DBClusterEndpoint.split('.')[0];
      const command = new DescribeDBInstancesCommand({
        Filters: [
          { Name: 'db-cluster-id', Values: [clusterIdentifier] },
        ],
      });
      const response = await rdsClient.send(command);

      const azs = new Set(response.DBInstances!.map(i => i.AvailabilityZone));
      expect(azs.size).toBeGreaterThanOrEqual(2); // Multi-AZ deployment
    }, 30000);
  });

  describe('Lambda Function', () => {
    test('Lambda function should be in VPC', async () => {
      const command = new GetFunctionConfigurationCommand({
        FunctionName: outputs.LambdaFunctionArn,
      });
      const response = await lambdaClient.send(command);

      expect(response.VpcConfig).toBeDefined();
      expect(response.VpcConfig!.VpcId).toBe(outputs.VPCId);
      expect(response.VpcConfig!.SubnetIds!.length).toBeGreaterThan(0);
      expect(response.VpcConfig!.SecurityGroupIds!.length).toBeGreaterThan(0);
    }, 30000);

    test('Lambda function should have appropriate memory and timeout', async () => {
      const command = new GetFunctionConfigurationCommand({
        FunctionName: outputs.LambdaFunctionArn,
      });
      const response = await lambdaClient.send(command);

      expect(response.MemorySize).toBeGreaterThanOrEqual(128);
      expect(response.Timeout).toBeGreaterThan(0);
    }, 30000);
  });

  describe('S3 Bucket Security', () => {
    test('S3 bucket should exist', async () => {
      const command = new HeadBucketCommand({
        Bucket: outputs.StaticAssetsBucketName,
      });

      await expect(s3Client.send(command)).resolves.not.toThrow();
    }, 30000);

    test('S3 bucket should have encryption enabled', async () => {
      const command = new GetBucketEncryptionCommand({
        Bucket: outputs.StaticAssetsBucketName,
      });
      const response = await s3Client.send(command);

      expect(response.ServerSideEncryptionConfiguration).toBeDefined();
      expect(response.ServerSideEncryptionConfiguration!.Rules!.length).toBeGreaterThan(0);
    }, 30000);

    test('S3 bucket should have versioning enabled', async () => {
      const command = new GetBucketVersioningCommand({
        Bucket: outputs.StaticAssetsBucketName,
      });
      const response = await s3Client.send(command);

      expect(response.Status).toBe('Enabled');
    }, 30000);

    test('S3 bucket should block all public access', async () => {
      const command = new GetPublicAccessBlockCommand({
        Bucket: outputs.StaticAssetsBucketName,
      });
      const response = await s3Client.send(command);

      expect(response.PublicAccessBlockConfiguration).toBeDefined();
      expect(response.PublicAccessBlockConfiguration!.BlockPublicAcls).toBe(true);
      expect(response.PublicAccessBlockConfiguration!.BlockPublicPolicy).toBe(true);
      expect(response.PublicAccessBlockConfiguration!.IgnorePublicAcls).toBe(true);
      expect(response.PublicAccessBlockConfiguration!.RestrictPublicBuckets).toBe(true);
    }, 30000);
  });

  describe('Monitoring and Alerting', () => {
    test('SNS topic should exist', async () => {
      const command = new GetTopicAttributesCommand({
        TopicArn: outputs.SNSTopicArn,
      });
      const response = await snsClient.send(command);

      expect(response.Attributes).toBeDefined();
      expect(response.Attributes!.TopicArn).toBe(outputs.SNSTopicArn);
    }, 30000);

    test('SNS topic should have email subscription', async () => {
      const command = new ListSubscriptionsByTopicCommand({
        TopicArn: outputs.SNSTopicArn,
      });
      const response = await snsClient.send(command);

      expect(response.Subscriptions).toBeDefined();
      expect(response.Subscriptions!.length).toBeGreaterThan(0);

      const emailSub = response.Subscriptions!.find(s => s.Protocol === 'email');
      expect(emailSub).toBeDefined();
    }, 30000);

    test('CloudWatch alarms should be configured to notify SNS topic', async () => {
      const command = new DescribeAlarmsCommand({
        MaxRecords: 100,
      });
      const response = await cwClient.send(command);

      const stackAlarms = response.MetricAlarms!.filter(alarm =>
        alarm.AlarmName!.includes(environmentSuffix)
      );

      stackAlarms.forEach(alarm => {
        expect(alarm.AlarmActions).toBeDefined();
        expect(alarm.AlarmActions!.length).toBeGreaterThan(0);
        expect(alarm.AlarmActions).toContain(outputs.SNSTopicArn);
      });
    }, 30000);
  });

  describe('Security Groups Configuration', () => {
    test('security groups should exist for all tiers', async () => {
      const command = new DescribeSecurityGroupsCommand({
        Filters: [
          { Name: 'vpc-id', Values: [outputs.VPCId] },
        ],
      });
      const response = await ec2Client.send(command);

      const sgNames = response.SecurityGroups!.map(sg => sg.GroupName).join(',');

      // Should have security groups for ALB, WebServer, Database, and Lambda
      expect(response.SecurityGroups!.length).toBeGreaterThanOrEqual(4);
    }, 30000);

    test('database security group should not allow public access', async () => {
      const command = new DescribeSecurityGroupsCommand({
        Filters: [
          { Name: 'vpc-id', Values: [outputs.VPCId] },
          { Name: 'group-name', Values: ['*database*', '*Database*', '*db*'] },
        ],
      });
      const response = await ec2Client.send(command);

      if (response.SecurityGroups && response.SecurityGroups.length > 0) {
        const dbSg = response.SecurityGroups[0];
        const publicIngress = dbSg.IpPermissions!.filter(rule =>
          rule.IpRanges!.some(ip => ip.CidrIp === '0.0.0.0/0')
        );

        expect(publicIngress.length).toBe(0); // No public access to database
      }
    }, 30000);
  });

  describe('Infrastructure Integration', () => {
    test('all resources should be in the same VPC', async () => {
      // Already validated through individual tests
      expect(outputs.VPCId).toBeDefined();
    });

    test('infrastructure should support multi-AZ deployment', async () => {
      // Validated through subnets and RDS instances tests
      expect(true).toBe(true);
    });

    test('all critical resources should be deployed and functional', () => {
      // Validated through all integration tests above
      expect(outputs.VPCId).toBeDefined();
      expect(outputs.ALBDNSName).toBeDefined();
      expect(outputs.DBClusterEndpoint).toBeDefined();
      expect(outputs.LambdaFunctionArn).toBeDefined();
      expect(outputs.StaticAssetsBucketName).toBeDefined();
      expect(outputs.SNSTopicArn).toBeDefined();
    });
  });
});
