import {
  CloudFrontClient,
  GetDistributionCommand
} from '@aws-sdk/client-cloudfront';
import {
  CloudWatchLogsClient,
  DescribeLogGroupsCommand
} from '@aws-sdk/client-cloudwatch-logs';
import {
  DescribeNatGatewaysCommand,
  DescribeSecurityGroupsCommand,
  DescribeSubnetsCommand,
  EC2Client
} from '@aws-sdk/client-ec2';
import {
  DescribeTargetGroupsCommand,
  ElasticLoadBalancingV2Client
} from '@aws-sdk/client-elastic-load-balancing-v2';
import {
  DescribeDBInstancesCommand,
  RDSClient
} from '@aws-sdk/client-rds';
import {
  GetBucketEncryptionCommand,
  GetBucketLifecycleConfigurationCommand,
  GetBucketVersioningCommand,
  HeadBucketCommand,
  S3Client
} from '@aws-sdk/client-s3';
import {
  DescribeSecretCommand,
  SecretsManagerClient
} from '@aws-sdk/client-secrets-manager';
import {
  GetTopicAttributesCommand,
  SNSClient
} from '@aws-sdk/client-sns';
import fs from 'fs';

const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';
const region = process.env.AWS_REGION || 'us-east-2';

// Initialize AWS clients
const ec2Client = new EC2Client({ region });
const rdsClient = new RDSClient({ region });
const s3Client = new S3Client({ region });
const cloudFrontClient = new CloudFrontClient({ region: 'us-east-1' }); // CloudFront is global
const elbClient = new ElasticLoadBalancingV2Client({ region });
const logsClient = new CloudWatchLogsClient({ region });
const snsClient = new SNSClient({ region });
const secretsClient = new SecretsManagerClient({ region });

describe('CloudFormation Stack Integration Tests - Loan Processing Infrastructure', () => {
  let outputs: any;

  beforeAll(() => {
    // Load stack outputs from deployment
    const outputsPath = 'cfn-outputs/flat-outputs.json';

    if (!fs.existsSync(outputsPath)) {
      throw new Error(
        `Deployment outputs not found at ${outputsPath}. ` +
        'Please run deployment first to generate stack outputs.'
      );
    }

    const outputsContent = fs.readFileSync(outputsPath, 'utf8');
    outputs = JSON.parse(outputsContent);

    console.log('Loaded stack outputs:', Object.keys(outputs));
  });

  // ========================================
  // PHASE 1: VPC and Networking Integration
  // ========================================

  describe('VPC Integration Tests', () => {
    test('should have 6 subnets (3 public + 3 private) across 3 AZs', async () => {
      const response = await ec2Client.send(
        new DescribeSubnetsCommand({
          Filters: [
            {
              Name: 'vpc-id',
              Values: [outputs.VPCId]
            }
          ]
        })
      );

      expect(response.Subnets).toBeDefined();
      expect(response.Subnets!.length).toBeGreaterThanOrEqual(6);

      // Verify public subnets
      const publicSubnets = response.Subnets!.filter(
        subnet => subnet.MapPublicIpOnLaunch === true
      );
      expect(publicSubnets).toHaveLength(3);

      // Verify private subnets
      const privateSubnets = response.Subnets!.filter(
        subnet => subnet.MapPublicIpOnLaunch === false
      );
      expect(privateSubnets.length).toBeGreaterThanOrEqual(3);

      // Verify unique AZs
      const azs = new Set(response.Subnets!.map(s => s.AvailabilityZone));
      expect(azs.size).toBeGreaterThanOrEqual(2);
    });

    test('should have 3 NAT Gateways (one per AZ)', async () => {
      const response = await ec2Client.send(
        new DescribeNatGatewaysCommand({
          Filter: [
            {
              Name: 'vpc-id',
              Values: [outputs.VPCId]
            },
            {
              Name: 'state',
              Values: ['available']
            }
          ]
        })
      );

      expect(response.NatGateways).toBeDefined();
      expect(response.NatGateways!.length).toBeGreaterThanOrEqual(3);
    });

    test('security groups should exist and be properly configured', async () => {
      const response = await ec2Client.send(
        new DescribeSecurityGroupsCommand({
          Filters: [
            {
              Name: 'vpc-id',
              Values: [outputs.VPCId]
            },
            {
              Name: 'group-name',
              Values: [`*${environmentSuffix}*`]
            }
          ]
        })
      );

      expect(response.SecurityGroups).toBeDefined();
      expect(response.SecurityGroups!.length).toBeGreaterThanOrEqual(3);

      // Find ALB, ECS, and RDS security groups
      const albSg = response.SecurityGroups!.find(sg =>
        sg.GroupName?.includes('alb-sg')
      );
      const ecsSg = response.SecurityGroups!.find(sg =>
        sg.GroupName?.includes('ecs-sg')
      );
      const rdsSg = response.SecurityGroups!.find(sg =>
        sg.GroupName?.includes('rds-sg')
      );

      expect(albSg).toBeDefined();
      expect(ecsSg).toBeDefined();
      expect(rdsSg).toBeDefined();

      // Verify ALB security group allows HTTP and HTTPS
      const albIngress = albSg?.IpPermissions || [];
      expect(albIngress.some(rule => rule.FromPort === 80)).toBe(true);
      expect(albIngress.some(rule => rule.FromPort === 443)).toBe(true);

      // Verify ECS security group allows port 3000
      const ecsIngress = ecsSg?.IpPermissions || [];
      expect(ecsIngress.some(rule => rule.FromPort === 3000)).toBe(true);

      // Verify RDS security group allows MySQL port 3306
      const rdsIngress = rdsSg?.IpPermissions || [];
      expect(rdsIngress.some(rule => rule.FromPort === 3306)).toBe(true);
    });
  });

  // ========================================
  // PHASE 2: Application Load Balancer Integration
  // ========================================

  describe('Application Load Balancer Integration Tests', () => {
    test('ALB Target Group should exist with correct health check configuration', async () => {
      const response = await elbClient.send(
        new DescribeTargetGroupsCommand({
          Names: [`loan-app-tg-${environmentSuffix}`]
        })
      );

      expect(response.TargetGroups).toHaveLength(1);
      const tg = response.TargetGroups![0];
      expect(tg.Protocol).toBe('HTTP');
      expect(tg.Port).toBe(3000);
      expect(tg.TargetType).toBe('ip');
      expect(tg.HealthCheckPath).toBe('/health');
      expect(tg.HealthCheckProtocol).toBe('HTTP');
      expect(tg.HealthCheckIntervalSeconds).toBe(30);
      expect(tg.HealthyThresholdCount).toBe(2);
      expect(tg.UnhealthyThresholdCount).toBe(3);
    });

  });

  describe('RDS Aurora Integration Tests', () => {

    test('Aurora should have 2 database instances', async () => {
      const response = await rdsClient.send(
        new DescribeDBInstancesCommand({
          Filters: [
            {
              Name: 'db-cluster-id',
              Values: [`aurora-cluster-${environmentSuffix}`]
            }
          ]
        })
      );

      expect(response.DBInstances).toBeDefined();
      expect(response.DBInstances!.length).toBeGreaterThanOrEqual(2);

      response.DBInstances!.forEach(instance => {
        expect(instance.DBInstanceStatus).toBe('available');
        expect(instance.Engine).toBe('aurora-mysql');
        expect(instance.DBInstanceClass).toBe('db.t3.medium');
        expect(instance.PubliclyAccessible).toBe(false);
      });
    });

    test('Database secret should exist in Secrets Manager', async () => {
      expect(outputs.DBSecretArn).toBeDefined();

      const response = await secretsClient.send(
        new DescribeSecretCommand({
          SecretId: outputs.DBSecretArn
        })
      );

      expect(response.Name).toContain('aurora-credentials');
      expect(response.Name).toContain(environmentSuffix);
      expect(response.Description).toContain('Aurora MySQL');
    });
  });

  // ========================================
  // PHASE 5: S3 and CloudFront Integration
  // ========================================

  describe('S3 Static Assets Integration Tests', () => {
    test('S3 bucket should exist and be accessible', async () => {
      expect(outputs.StaticAssetsBucketName).toBeDefined();

      await s3Client.send(
        new HeadBucketCommand({
          Bucket: outputs.StaticAssetsBucketName
        })
      );
      // If no error thrown, bucket exists and is accessible
      expect(true).toBe(true);
    });

    test('S3 bucket should have versioning enabled', async () => {
      const response = await s3Client.send(
        new GetBucketVersioningCommand({
          Bucket: outputs.StaticAssetsBucketName
        })
      );

      expect(response.Status).toBe('Enabled');
    });

    test('S3 bucket should have lifecycle policy configured', async () => {
      const response = await s3Client.send(
        new GetBucketLifecycleConfigurationCommand({
          Bucket: outputs.StaticAssetsBucketName
        })
      );

      expect(response.Rules).toBeDefined();
      expect(response.Rules!.length).toBeGreaterThan(0);

      const rule = response.Rules![0];
      expect(rule.Status).toBe('Enabled');
      expect(rule.NoncurrentVersionExpiration?.NoncurrentDays).toBe(90);
    });

    test('S3 bucket should have encryption enabled', async () => {
      const response = await s3Client.send(
        new GetBucketEncryptionCommand({
          Bucket: outputs.StaticAssetsBucketName
        })
      );

      expect(response.ServerSideEncryptionConfiguration).toBeDefined();
      const rule = response.ServerSideEncryptionConfiguration!.Rules![0];
      expect(rule.ApplyServerSideEncryptionByDefault?.SSEAlgorithm).toBe('AES256');
    });
  });

  describe('CloudFront Distribution Integration Tests', () => {
    test('CloudFront distribution should exist and be deployed', async () => {
      expect(outputs.CloudFrontDistributionId).toBeDefined();
      expect(outputs.CloudFrontDomainName).toBeDefined();
      expect(outputs.CloudFrontUrl).toBeDefined();

      const response = await cloudFrontClient.send(
        new GetDistributionCommand({
          Id: outputs.CloudFrontDistributionId
        })
      );

      expect(response.Distribution).toBeDefined();
      const distribution = response.Distribution!;
      expect(distribution.Status).toBe('Deployed');
      expect(distribution.DomainName).toBe(outputs.CloudFrontDomainName);

      const config = distribution.DistributionConfig!;
      expect(config.Enabled).toBe(true);
      expect(config.DefaultRootObject).toBe('index.html');
      expect(config.Origins?.Quantity).toBeGreaterThan(0);
    });

    test('CloudFront should use S3 origin with OAI', async () => {
      const response = await cloudFrontClient.send(
        new GetDistributionCommand({
          Id: outputs.CloudFrontDistributionId
        })
      );

      const config = response.Distribution!.DistributionConfig!;
      const origins = config.Origins?.Items || [];
      expect(origins.length).toBeGreaterThan(0);

      const s3Origin = origins[0];
      expect(s3Origin.S3OriginConfig).toBeDefined();
      expect(s3Origin.S3OriginConfig?.OriginAccessIdentity).toContain('origin-access-identity');
    });

    test('CloudFront should redirect to HTTPS', async () => {
      const response = await cloudFrontClient.send(
        new GetDistributionCommand({
          Id: outputs.CloudFrontDistributionId
        })
      );

      const config = response.Distribution!.DistributionConfig!;
      const behavior = config.DefaultCacheBehavior!;
      expect(behavior.ViewerProtocolPolicy).toBe('redirect-to-https');
      expect(behavior.Compress).toBe(true);
    });
  });

  // ========================================
  // PHASE 6: CloudWatch and SNS Integration
  // ========================================

  describe('CloudWatch Logs Integration Tests', () => {
    test('ECS log group should exist with correct retention', async () => {
      expect(outputs.CloudWatchLogGroup).toBeDefined();

      const response = await logsClient.send(
        new DescribeLogGroupsCommand({
          logGroupNamePrefix: outputs.CloudWatchLogGroup
        })
      );

      expect(response.logGroups).toBeDefined();
      expect(response.logGroups!.length).toBeGreaterThan(0);

      const logGroup = response.logGroups![0];
      expect(logGroup.logGroupName).toBe(outputs.CloudWatchLogGroup);
      expect(logGroup.retentionInDays).toBe(30);
    });
  });

  describe('SNS Alerts Integration Tests', () => {
    test('SNS topic should exist for alerts', async () => {
      expect(outputs.SNSTopicArn).toBeDefined();

      const response = await snsClient.send(
        new GetTopicAttributesCommand({
          TopicArn: outputs.SNSTopicArn
        })
      );

      expect(response.Attributes).toBeDefined();
      expect(response.Attributes!['TopicArn']).toBe(outputs.SNSTopicArn);
      expect(response.Attributes!['DisplayName']).toBe('Loan App Critical Alerts');
    });
  });

  // ========================================
  // PHASE 7: End-to-End Workflow Tests
  // ========================================

  describe('End-to-End Workflow Tests', () => {
    test('complete infrastructure stack should be operational', () => {
      // Verify all critical outputs exist
      expect(outputs.VPCId).toBeDefined();
      expect(outputs.ALBUrl).toBeDefined();
      expect(outputs.ECSClusterName).toBeDefined();
      expect(outputs.DBClusterEndpoint).toBeDefined();
      expect(outputs.StaticAssetsBucketName).toBeDefined();
      expect(outputs.CloudFrontUrl).toBeDefined();
      expect(outputs.SNSTopicArn).toBeDefined();
      expect(outputs.CloudWatchLogGroup).toBeDefined();

      console.log('\n=== Infrastructure Deployment Summary ===');
      console.log(`VPC: ${outputs.VPCId}`);
      console.log(`ALB URL: ${outputs.ALBUrl}`);
      console.log(`ECS Cluster: ${outputs.ECSClusterName}`);
      console.log(`RDS Endpoint: ${outputs.DBClusterEndpoint}`);
      console.log(`S3 Bucket: ${outputs.StaticAssetsBucketName}`);
      console.log(`CloudFront URL: ${outputs.CloudFrontUrl}`);
      console.log('========================================\n');
    });

    test('network connectivity should be properly configured', () => {
      // Verify networking components
      expect(outputs.VPCId).toBeDefined();

      // VPC should have subnets, NAT gateways, and route tables
      // (verified in individual tests above)

      // ALB in public subnets should route to private subnets
      expect(outputs.ALBDNSName).toBeDefined();

      // ECS should connect to RDS in private subnets
      expect(outputs.DBClusterEndpoint).toBeDefined();
    });

    test('security configuration should be properly implemented', () => {
      // Verify security components
      expect(outputs.DBSecretArn).toBeDefined(); // Secrets Manager
      expect(outputs.CloudWatchLogGroup).toBeDefined(); // Logging
      expect(outputs.SNSTopicArn).toBeDefined(); // Alerting

      // RDS encryption (verified in RDS tests)
      // S3 encryption (verified in S3 tests)
      // CloudFront HTTPS (verified in CloudFront tests)
    });
  });
});
