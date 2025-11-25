import * as fs from 'fs';
import * as path from 'path';
import {
  DynamoDBClient,
  DescribeTableCommand,
  DescribeContinuousBackupsCommand,
} from '@aws-sdk/client-dynamodb';
import {
  S3Client,
  HeadBucketCommand,
  GetBucketVersioningCommand,
  GetBucketReplicationCommand,
} from '@aws-sdk/client-s3';
import {
  EC2Client,
  DescribeVpcsCommand,
  DescribeSubnetsCommand,
} from '@aws-sdk/client-ec2';
import {
  LambdaClient,
  GetFunctionCommand,
  GetFunctionConcurrencyCommand,
} from '@aws-sdk/client-lambda';
import {
  ElasticLoadBalancingV2Client,
  DescribeLoadBalancersCommand,
  DescribeTargetGroupsCommand,
  DescribeListenersCommand,
} from '@aws-sdk/client-elastic-load-balancing-v2';
import {
  Route53Client,
  ListHostedZonesByNameCommand,
  ListResourceRecordSetsCommand,
  GetHealthCheckCommand,
  ListHealthChecksCommand,
} from '@aws-sdk/client-route-53';
import {
  CloudWatchClient,
  DescribeAlarmsCommand,
} from '@aws-sdk/client-cloudwatch';
import {
  SNSClient,
  ListTopicsCommand,
  GetTopicAttributesCommand,
} from '@aws-sdk/client-sns';
import {
  SSMClient,
  GetParameterCommand,
} from '@aws-sdk/client-ssm';

describe('TAP Stack Integration Tests - Multi-Region DR', () => {
  let outputs: any;
  const primaryRegion = 'us-east-1';
  const secondaryRegion = 'us-west-2';

  beforeAll(() => {
    const outputsPath = path.join(__dirname, '../cfn-outputs/flat-outputs.json');
    if (!fs.existsSync(outputsPath)) {
      throw new Error('Deployment outputs not found at cfn-outputs/flat-outputs.json. Please deploy first.');
    }
    outputs = JSON.parse(fs.readFileSync(outputsPath, 'utf-8'));
  });

  describe('Deployment Outputs Validation', () => {
    it('should have all required outputs', () => {
      expect(outputs).toHaveProperty('primaryVpcId');
      expect(outputs).toHaveProperty('secondaryVpcId');
      expect(outputs).toHaveProperty('dynamoTableName');
      expect(outputs).toHaveProperty('primaryBucketName');
      expect(outputs).toHaveProperty('secondaryBucketName');
    });

    it('should have valid VPC IDs', () => {
      expect(outputs.primaryVpcId).toMatch(/^vpc-[a-f0-9]+$/);
      expect(outputs.secondaryVpcId).toMatch(/^vpc-[a-f0-9]+$/);
      expect(outputs.primaryVpcId).not.toEqual(outputs.secondaryVpcId);
    });

    it('should have valid resource names with environment suffix', () => {
      expect(outputs.dynamoTableName).toContain('synthn4i3p2v4');
      expect(outputs.primaryBucketName).toContain('synthn4i3p2v4');
      expect(outputs.secondaryBucketName).toContain('synthn4i3p2v4');
    });

    it('should differentiate primary and secondary buckets', () => {
      expect(outputs.primaryBucketName).not.toEqual(outputs.secondaryBucketName);
    });
  });

  describe('VPC Configuration - Primary Region', () => {
    const ec2Client = new EC2Client({ region: primaryRegion });

    it('should have VPC in primary region', async () => {
      const command = new DescribeVpcsCommand({
        VpcIds: [outputs.primaryVpcId],
      });
      const response = await ec2Client.send(command);

      expect(response.Vpcs).toHaveLength(1);
      expect(response.Vpcs![0].VpcId).toEqual(outputs.primaryVpcId);
      expect(response.Vpcs![0].State).toEqual('available');
    });

    it('should have DNS support enabled', async () => {
      const command = new DescribeVpcsCommand({
        VpcIds: [outputs.primaryVpcId],
      });
      const response = await ec2Client.send(command);

      expect(response.Vpcs![0].EnableDnsSupport).toBeTruthy();
      expect(response.Vpcs![0].EnableDnsHostnames).toBeTruthy();
    });

    it('should have multiple subnets in primary region', async () => {
      const command = new DescribeSubnetsCommand({
        Filters: [
          {
            Name: 'vpc-id',
            Values: [outputs.primaryVpcId],
          },
        ],
      });
      const response = await ec2Client.send(command);

      expect(response.Subnets!.length).toBeGreaterThanOrEqual(3);
      const azs = new Set(response.Subnets!.map(s => s.AvailabilityZone));
      expect(azs.size).toBeGreaterThanOrEqual(3); // Multiple AZs
    });
  });

  describe('VPC Configuration - Secondary Region', () => {
    const ec2Client = new EC2Client({ region: secondaryRegion });

    it('should have VPC in secondary region', async () => {
      const command = new DescribeVpcsCommand({
        VpcIds: [outputs.secondaryVpcId],
      });
      const response = await ec2Client.send(command);

      expect(response.Vpcs).toHaveLength(1);
      expect(response.Vpcs![0].VpcId).toEqual(outputs.secondaryVpcId);
      expect(response.Vpcs![0].State).toEqual('available');
    });

    it('should have multiple subnets in secondary region', async () => {
      const command = new DescribeSubnetsCommand({
        Filters: [
          {
            Name: 'vpc-id',
            Values: [outputs.secondaryVpcId],
          },
        ],
      });
      const response = await ec2Client.send(command);

      expect(response.Subnets!.length).toBeGreaterThanOrEqual(3);
      const azs = new Set(response.Subnets!.map(s => s.AvailabilityZone));
      expect(azs.size).toBeGreaterThanOrEqual(3); // Multiple AZs
    });
  });

  describe('DynamoDB Global Table', () => {
    const dynamoClient = new DynamoDBClient({ region: primaryRegion });

    it('should exist and be active', async () => {
      const command = new DescribeTableCommand({
        TableName: outputs.dynamoTableName,
      });
      const response = await dynamoClient.send(command);

      expect(response.Table).toBeDefined();
      expect(response.Table!.TableName).toEqual(outputs.dynamoTableName);
      expect(response.Table!.TableStatus).toEqual('ACTIVE');
    });

    it('should have point-in-time recovery enabled', async () => {
      const command = new DescribeContinuousBackupsCommand({
        TableName: outputs.dynamoTableName,
      });
      const response = await dynamoClient.send(command);

      expect(response.ContinuousBackupsDescription!.PointInTimeRecoveryDescription!.PointInTimeRecoveryStatus).toEqual('ENABLED');
    });

    it('should have global table configuration', async () => {
      const command = new DescribeTableCommand({
        TableName: outputs.dynamoTableName,
      });
      const response = await dynamoClient.send(command);

      expect(response.Table!.Replicas).toBeDefined();
      expect(response.Table!.Replicas!.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('S3 Buckets - Primary Region', () => {
    const s3Client = new S3Client({ region: primaryRegion });

    it('should exist and be accessible', async () => {
      const command = new HeadBucketCommand({
        Bucket: outputs.primaryBucketName,
      });
      await expect(s3Client.send(command)).resolves.not.toThrow();
    });

    it('should have versioning enabled', async () => {
      const command = new GetBucketVersioningCommand({
        Bucket: outputs.primaryBucketName,
      });
      const response = await s3Client.send(command);

      expect(response.Status).toEqual('Enabled');
    });

    it('should have replication configured', async () => {
      const command = new GetBucketReplicationCommand({
        Bucket: outputs.primaryBucketName,
      });
      const response = await s3Client.send(command);

      expect(response.ReplicationConfiguration).toBeDefined();
      expect(response.ReplicationConfiguration!.Rules).toBeDefined();
      expect(response.ReplicationConfiguration!.Rules!.length).toBeGreaterThan(0);
      expect(response.ReplicationConfiguration!.Rules![0].Status).toEqual('Enabled');
    });

    it('should have replication to secondary region', async () => {
      const command = new GetBucketReplicationCommand({
        Bucket: outputs.primaryBucketName,
      });
      const response = await s3Client.send(command);

      const rule = response.ReplicationConfiguration!.Rules![0];
      expect(rule.Destination!.Bucket).toContain(outputs.secondaryBucketName);
    });
  });

  describe('S3 Buckets - Secondary Region', () => {
    const s3Client = new S3Client({ region: secondaryRegion });

    it('should exist and be accessible', async () => {
      const command = new HeadBucketCommand({
        Bucket: outputs.secondaryBucketName,
      });
      await expect(s3Client.send(command)).resolves.not.toThrow();
    });

    it('should have versioning enabled', async () => {
      const command = new GetBucketVersioningCommand({
        Bucket: outputs.secondaryBucketName,
      });
      const response = await s3Client.send(command);

      expect(response.Status).toEqual('Enabled');
    });
  });

  describe('Lambda Functions - Primary Region', () => {
    const lambdaClient = new LambdaClient({ region: primaryRegion });
    const functionName = `dr-function-primary-synthn4i3p2v4`;

    it('should exist and be active', async () => {
      const command = new GetFunctionCommand({
        FunctionName: functionName,
      });
      const response = await lambdaClient.send(command);

      expect(response.Configuration).toBeDefined();
      expect(response.Configuration!.State).toEqual('Active');
    });

    it('should use Node.js 18 runtime', async () => {
      const command = new GetFunctionCommand({
        FunctionName: functionName,
      });
      const response = await lambdaClient.send(command);

      expect(response.Configuration!.Runtime).toEqual('nodejs18.x');
    });

    it('should have 512MB memory configured', async () => {
      const command = new GetFunctionCommand({
        FunctionName: functionName,
      });
      const response = await lambdaClient.send(command);

      expect(response.Configuration!.MemorySize).toEqual(512);
    });

    it('should have reserved concurrency set to 100', async () => {
      const command = new GetFunctionConcurrencyCommand({
        FunctionName: functionName,
      });
      const response = await lambdaClient.send(command);

      expect(response.ReservedConcurrentExecutions).toEqual(100);
    });
  });

  describe('Lambda Functions - Secondary Region', () => {
    const lambdaClient = new LambdaClient({ region: secondaryRegion });
    const functionName = `dr-function-secondary-synthn4i3p2v4`;

    it('should exist and be active', async () => {
      const command = new GetFunctionCommand({
        FunctionName: functionName,
      });
      const response = await lambdaClient.send(command);

      expect(response.Configuration).toBeDefined();
      expect(response.Configuration!.State).toEqual('Active');
    });

    it('should use Node.js 18 runtime', async () => {
      const command = new GetFunctionCommand({
        FunctionName: functionName,
      });
      const response = await lambdaClient.send(command);

      expect(response.Configuration!.Runtime).toEqual('nodejs18.x');
    });

    it('should have 512MB memory configured', async () => {
      const command = new GetFunctionCommand({
        FunctionName: functionName,
      });
      const response = await lambdaClient.send(command);

      expect(response.Configuration!.MemorySize).toEqual(512);
    });

    it('should have reserved concurrency set to 100', async () => {
      const command = new GetFunctionConcurrencyCommand({
        FunctionName: functionName,
      });
      const response = await lambdaClient.send(command);

      expect(response.ReservedConcurrentExecutions).toEqual(100);
    });
  });

  describe('Application Load Balancers - Primary Region', () => {
    const elbClient = new ElasticLoadBalancingV2Client({ region: primaryRegion });

    it('should have ALB deployed', async () => {
      const command = new DescribeLoadBalancersCommand({
        Names: [`alb-pri-synthn4i3p2`],
      });
      const response = await elbClient.send(command);

      expect(response.LoadBalancers).toBeDefined();
      expect(response.LoadBalancers!.length).toBeGreaterThan(0);
      expect(response.LoadBalancers![0].State!.Code).toEqual('active');
    });

    it('should have target group configured', async () => {
      const command = new DescribeTargetGroupsCommand({
        Names: [`tg-pri-synthn4i3p`],
      });
      const response = await elbClient.send(command);

      expect(response.TargetGroups).toBeDefined();
      expect(response.TargetGroups!.length).toBeGreaterThan(0);
      expect(response.TargetGroups![0].TargetType).toEqual('lambda');
    });
  });

  describe('Application Load Balancers - Secondary Region', () => {
    const elbClient = new ElasticLoadBalancingV2Client({ region: secondaryRegion });

    it('should have ALB deployed', async () => {
      const command = new DescribeLoadBalancersCommand({
        Names: [`alb-sec-synthn4i3p2`],
      });
      const response = await elbClient.send(command);

      expect(response.LoadBalancers).toBeDefined();
      expect(response.LoadBalancers!.length).toBeGreaterThan(0);
      expect(response.LoadBalancers![0].State!.Code).toEqual('active');
    });

    it('should have target group configured', async () => {
      const command = new DescribeTargetGroupsCommand({
        Names: [`tg-sec-synthn4i3p`],
      });
      const response = await elbClient.send(command);

      expect(response.TargetGroups).toBeDefined();
      expect(response.TargetGroups!.length).toBeGreaterThan(0);
      expect(response.TargetGroups![0].TargetType).toEqual('lambda');
    });
  });

  describe('Route53 Failover Configuration', () => {
    const route53Client = new Route53Client({ region: 'us-east-1' }); // Route53 is global but accessed via us-east-1

    it('should have hosted zone created', async () => {
      const command = new ListHostedZonesByNameCommand({
        DNSName: 'testing.dr-n4i3p2v4.com',
        MaxItems: 1,
      });
      const response = await route53Client.send(command);

      expect(response.HostedZones).toBeDefined();
      expect(response.HostedZones!.length).toBeGreaterThan(0);
    });

    it('should have health checks configured', async () => {
      const command = new ListHealthChecksCommand({});
      const response = await route53Client.send(command);

      const drHealthChecks = response.HealthChecks!.filter(
        hc => hc.HealthCheckConfig?.FullyQualifiedDomainName?.includes('synthn4i3p2v4')
      );
      expect(drHealthChecks.length).toBeGreaterThan(0);
    });
  });

  describe('CloudWatch Alarms', () => {
    const cloudwatchClient = new CloudWatchClient({ region: primaryRegion });

    it('should have health monitoring alarms', async () => {
      const command = new DescribeAlarmsCommand({
        AlarmNamePrefix: 'dr-health',
      });
      const response = await cloudwatchClient.send(command);

      expect(response.MetricAlarms).toBeDefined();
      expect(response.MetricAlarms!.length).toBeGreaterThan(0);
    });
  });

  describe('SNS Topics - Primary Region', () => {
    const snsClient = new SNSClient({ region: primaryRegion });

    it('should have SNS topic created', async () => {
      const command = new ListTopicsCommand({});
      const response = await snsClient.send(command);

      const drTopics = response.Topics!.filter(
        t => t.TopicArn!.includes('dr-sns-primary-synthn4i3p2v4')
      );
      expect(drTopics.length).toBeGreaterThan(0);
    });
  });

  describe('SNS Topics - Secondary Region', () => {
    const snsClient = new SNSClient({ region: secondaryRegion });

    it('should have SNS topic created', async () => {
      const command = new ListTopicsCommand({});
      const response = await snsClient.send(command);

      const drTopics = response.Topics!.filter(
        t => t.TopicArn!.includes('dr-sns-secondary-synthn4i3p2v4')
      );
      expect(drTopics.length).toBeGreaterThan(0);
    });
  });

  describe('SSM Parameter Store - Primary Region', () => {
    const ssmClient = new SSMClient({ region: primaryRegion });

    it('should have ALB endpoint parameter stored', async () => {
      const command = new GetParameterCommand({
        Name: '/dr-app/synthn4i3p2v4/endpoint/us-east-1',
      });
      const response = await ssmClient.send(command);

      expect(response.Parameter).toBeDefined();
      expect(response.Parameter!.Value).toContain('.elb.amazonaws.com');
    });
  });

  describe('SSM Parameter Store - Secondary Region', () => {
    const ssmClient = new SSMClient({ region: secondaryRegion });

    it('should have ALB endpoint parameter stored', async () => {
      const command = new GetParameterCommand({
        Name: '/dr-app/synthn4i3p2v4/endpoint/us-west-2',
      });
      const response = await ssmClient.send(command);

      expect(response.Parameter).toBeDefined();
      expect(response.Parameter!.Value).toContain('.elb.amazonaws.com');
    });
  });

  describe('Cross-Region Disaster Recovery Validation', () => {
    it('should have resources in both regions', () => {
      expect(outputs.primaryVpcId).toBeDefined();
      expect(outputs.secondaryVpcId).toBeDefined();
      expect(outputs.primaryBucketName).toBeDefined();
      expect(outputs.secondaryBucketName).toBeDefined();
    });

    it('should have DynamoDB global table spanning regions', async () => {
      const dynamoClient = new DynamoDBClient({ region: primaryRegion });
      const command = new DescribeTableCommand({
        TableName: outputs.dynamoTableName,
      });
      const response = await dynamoClient.send(command);

      expect(response.Table!.Replicas).toBeDefined();
      expect(response.Table!.Replicas!.length).toBeGreaterThanOrEqual(1);
    });

    it('should have S3 replication configured between regions', async () => {
      const s3Client = new S3Client({ region: primaryRegion });
      const command = new GetBucketReplicationCommand({
        Bucket: outputs.primaryBucketName,
      });
      const response = await s3Client.send(command);

      expect(response.ReplicationConfiguration).toBeDefined();
      const hasRTC = response.ReplicationConfiguration!.Rules!.some(
        rule => rule.ReplicationTime?.Status === 'Enabled'
      );
      expect(hasRTC).toBeTruthy();
    });
  });
});
