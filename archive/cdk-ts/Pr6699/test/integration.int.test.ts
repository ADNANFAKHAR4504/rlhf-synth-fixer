import {
  DescribeNatGatewaysCommand,
  DescribeSubnetsCommand,
  DescribeVpcsCommand,
  EC2Client,
} from '@aws-sdk/client-ec2';
import {
  DescribeClustersCommand,
  DescribeServicesCommand,
  ECSClient,
  ListServicesCommand,
} from '@aws-sdk/client-ecs';
import {
  DescribeLoadBalancersCommand,
  DescribeTargetGroupsCommand,
  ElasticLoadBalancingV2Client,
} from '@aws-sdk/client-elastic-load-balancing-v2';
import {
  DescribeCacheClustersCommand,
  ElastiCacheClient,
} from '@aws-sdk/client-elasticache';
import {
  GetFunctionCommand,
  LambdaClient,
} from '@aws-sdk/client-lambda';
import {
  RDSClient
} from '@aws-sdk/client-rds';
import {
  GetTopicAttributesCommand,
  ListTopicsCommand,
  SNSClient,
} from '@aws-sdk/client-sns';

/**
 * Integration tests that validate deployed AWS infrastructure
 * Uses environment variables to detect and verify resources:
 * - ENVIRONMENT_SUFFIX: The environment suffix used for resource naming (required)
 * - AWS_REGION: AWS region where resources are deployed (defaults to us-east-1)
 */

const ENVIRONMENT_SUFFIX = process.env.ENVIRONMENT_SUFFIX;
const AWS_REGION = process.env.AWS_REGION || 'us-east-1';

// Skip all tests if ENVIRONMENT_SUFFIX is not set
const describeOrSkip = ENVIRONMENT_SUFFIX ? describe : describe.skip;

describeOrSkip('Infrastructure Integration Tests', () => {
  let ec2Client: EC2Client;
  let rdsClient: RDSClient;
  let elasticacheClient: ElastiCacheClient;
  let ecsClient: ECSClient;
  let elbClient: ElasticLoadBalancingV2Client;
  let lambdaClient: LambdaClient;
  let snsClient: SNSClient;

  beforeAll(() => {
    if (!ENVIRONMENT_SUFFIX) {
      console.warn(
        '⚠️  ENVIRONMENT_SUFFIX not set. Integration tests will be skipped.'
      );
      console.warn(
        '   Set ENVIRONMENT_SUFFIX env var to run integration tests.'
      );
      return;
    }

    console.log(`🔍 Running integration tests for environment: ${ENVIRONMENT_SUFFIX}`);
    console.log(`🌍 Region: ${AWS_REGION}`);

    // Initialize AWS clients
    const config = { region: AWS_REGION };
    ec2Client = new EC2Client(config);
    rdsClient = new RDSClient(config);
    elasticacheClient = new ElastiCacheClient(config);
    ecsClient = new ECSClient(config);
    elbClient = new ElasticLoadBalancingV2Client(config);
    lambdaClient = new LambdaClient(config);
    snsClient = new SNSClient(config);
  });

  describe('Network Infrastructure', () => {
    test('VPC exists with correct naming convention', async () => {
      const command = new DescribeVpcsCommand({
        Filters: [
          {
            Name: 'tag:Name',
            Values: [`trading-vpc-${ENVIRONMENT_SUFFIX}`],
          },
        ],
      });

      const response = await ec2Client.send(command);
      expect(response.Vpcs).toBeDefined();
      expect(response.Vpcs!.length).toBeGreaterThanOrEqual(1);

      const vpc = response.Vpcs![0];
      expect(vpc.VpcId).toMatch(/^vpc-[a-z0-9]+$/);
      expect(vpc.State).toBe('available');
    }, 30000);

    test('VPC has at least 6 subnets (3 public + 3 private)', async () => {
      // First get VPC ID
      const vpcCommand = new DescribeVpcsCommand({
        Filters: [
          {
            Name: 'tag:Name',
            Values: [`trading-vpc-${ENVIRONMENT_SUFFIX}`],
          },
        ],
      });
      const vpcResponse = await ec2Client.send(vpcCommand);
      const vpcId = vpcResponse.Vpcs![0].VpcId;

      // Get subnets for this VPC
      const subnetsCommand = new DescribeSubnetsCommand({
        Filters: [
          {
            Name: 'vpc-id',
            Values: [vpcId!],
          },
        ],
      });

      const subnetsResponse = await ec2Client.send(subnetsCommand);
      expect(subnetsResponse.Subnets).toBeDefined();
      expect(subnetsResponse.Subnets!.length).toBeGreaterThanOrEqual(6);

      // Verify we have both public and private subnets
      const publicSubnets = subnetsResponse.Subnets!.filter((subnet) =>
        subnet.Tags?.some((tag) => tag.Key === 'Name' && tag.Value?.includes('Public'))
      );
      const privateSubnets = subnetsResponse.Subnets!.filter((subnet) =>
        subnet.Tags?.some((tag) => tag.Key === 'Name' && tag.Value?.includes('Private'))
      );

      expect(publicSubnets.length).toBeGreaterThanOrEqual(3);
      expect(privateSubnets.length).toBeGreaterThanOrEqual(3);
    }, 30000);

    test('NAT Gateway exists for private subnet connectivity', async () => {
      const vpcCommand = new DescribeVpcsCommand({
        Filters: [
          {
            Name: 'tag:Name',
            Values: [`trading-vpc-${ENVIRONMENT_SUFFIX}`],
          },
        ],
      });
      const vpcResponse = await ec2Client.send(vpcCommand);
      const vpcId = vpcResponse.Vpcs![0].VpcId;

      const natCommand = new DescribeNatGatewaysCommand({
        Filter: [
          {
            Name: 'vpc-id',
            Values: [vpcId!],
          },
          {
            Name: 'state',
            Values: ['available'],
          },
        ],
      });

      const natResponse = await ec2Client.send(natCommand);
      expect(natResponse.NatGateways).toBeDefined();
      expect(natResponse.NatGateways!.length).toBeGreaterThanOrEqual(1);
    }, 30000);
  });

  describe('Database Infrastructure', () => {
    test('ElastiCache Redis cluster exists and is available', async () => {
      const command = new DescribeCacheClustersCommand({
        CacheClusterId: `trading-redis-${ENVIRONMENT_SUFFIX}`,
      });

      const response = await elasticacheClient.send(command);
      expect(response.CacheClusters).toBeDefined();
      expect(response.CacheClusters!.length).toBe(1);

      const cluster = response.CacheClusters![0];
      expect(cluster.CacheClusterStatus).toBe('available');
      expect(cluster.Engine).toBe('redis');
    }, 30000);

    test('Migration Lambda function exists', async () => {
      const command = new GetFunctionCommand({
        FunctionName: `db-migration-${ENVIRONMENT_SUFFIX}`,
      });

      const response = await lambdaClient.send(command);
      expect(response.Configuration).toBeDefined();
      expect(response.Configuration!.FunctionName).toBe(
        `db-migration-${ENVIRONMENT_SUFFIX}`
      );
      expect(response.Configuration!.Runtime).toMatch(/^nodejs/);
      expect(response.Configuration!.Timeout).toBe(900); // 15 minutes
    }, 30000);
  });

  describe('Compute Infrastructure', () => {
    test('ECS cluster exists with correct configuration', async () => {
      const command = new DescribeClustersCommand({
        clusters: [`trading-cluster-${ENVIRONMENT_SUFFIX}`],
        include: ['SETTINGS'],
      });

      const response = await ecsClient.send(command);
      expect(response.clusters).toBeDefined();
      expect(response.clusters!.length).toBe(1);

      const cluster = response.clusters![0];
      expect(cluster.status).toBe('ACTIVE');
      expect(cluster.clusterName).toBe(`trading-cluster-${ENVIRONMENT_SUFFIX}`);

      // Verify Container Insights is enabled
      const containerInsightsSetting = cluster.settings?.find(
        (s) => s.name === 'containerInsights'
      );
      expect(containerInsightsSetting?.value).toBe('enabled');
    }, 30000);

    test('ECS Fargate service is running', async () => {
      // First list services in the cluster
      const listCommand = new ListServicesCommand({
        cluster: `trading-cluster-${ENVIRONMENT_SUFFIX}`,
      });
      const listResponse = await ecsClient.send(listCommand);
      expect(listResponse.serviceArns).toBeDefined();
      expect(listResponse.serviceArns!.length).toBeGreaterThanOrEqual(1);

      // Describe the service
      const describeCommand = new DescribeServicesCommand({
        cluster: `trading-cluster-${ENVIRONMENT_SUFFIX}`,
        services: listResponse.serviceArns!,
      });

      const describeResponse = await ecsClient.send(describeCommand);
      expect(describeResponse.services).toBeDefined();
      expect(describeResponse.services!.length).toBeGreaterThanOrEqual(1);

      const service = describeResponse.services![0];
      expect(service.status).toBe('ACTIVE');
      expect(service.desiredCount).toBeGreaterThanOrEqual(2);
      expect(service.launchType).toBe('FARGATE');
    }, 30000);

    test('Application Load Balancer exists and is active', async () => {
      const command = new DescribeLoadBalancersCommand({
        Names: [`trading-alb-${ENVIRONMENT_SUFFIX}`],
      });

      const response = await elbClient.send(command);
      expect(response.LoadBalancers).toBeDefined();
      expect(response.LoadBalancers!.length).toBe(1);

      const alb = response.LoadBalancers![0];
      expect(alb.State?.Code).toBe('active');
      expect(alb.Type).toBe('application');
      expect(alb.Scheme).toBe('internet-facing');
      expect(alb.LoadBalancerName).toBe(`trading-alb-${ENVIRONMENT_SUFFIX}`);
    }, 30000);

    test('Target group exists with health check configuration', async () => {
      const command = new DescribeTargetGroupsCommand({
        Names: [`trading-tg-${ENVIRONMENT_SUFFIX}`],
      });

      const response = await elbClient.send(command);
      expect(response.TargetGroups).toBeDefined();
      expect(response.TargetGroups!.length).toBe(1);

      const targetGroup = response.TargetGroups![0];
      expect(targetGroup.TargetType).toBe('ip');
      expect(targetGroup.Protocol).toBe('HTTP');
      expect(targetGroup.Port).toBe(80);

      // Verify health check
      expect(targetGroup.HealthCheckPath).toBe('/health');
      expect(targetGroup.HealthCheckIntervalSeconds).toBe(30);
      expect(targetGroup.HealthyThresholdCount).toBe(2);
      expect(targetGroup.UnhealthyThresholdCount).toBe(3);
    }, 30000);
  });

  describe('Monitoring Infrastructure', () => {
    test('SNS alert topic exists', async () => {
      const listCommand = new ListTopicsCommand({});
      const listResponse = await snsClient.send(listCommand);

      const alertTopic = listResponse.Topics?.find((topic) =>
        topic.TopicArn?.includes(`critical-alerts-${ENVIRONMENT_SUFFIX}`)
      );

      expect(alertTopic).toBeDefined();
      expect(alertTopic!.TopicArn).toMatch(
        /^arn:aws:sns:[a-z0-9-]+:\d+:critical-alerts-.+$/
      );

      // Get topic attributes to verify configuration
      const getAttributesCommand = new GetTopicAttributesCommand({
        TopicArn: alertTopic!.TopicArn,
      });
      const attributesResponse = await snsClient.send(getAttributesCommand);

      expect(attributesResponse.Attributes).toBeDefined();
      expect(attributesResponse.Attributes!.DisplayName).toBe(
        'Critical Infrastructure Alerts'
      );
    }, 30000);
  });
});
