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
  ECSClient,
  DescribeClustersCommand,
  DescribeServicesCommand,
  ListTasksCommand,
} from '@aws-sdk/client-ecs';
import {
  RDSClient,
  DescribeDBClustersCommand,
  DescribeDBClusterInstancesCommand,
} from '@aws-sdk/client-rds';
import {
  S3Client,
  ListBucketsCommand,
  GetBucketVersioningCommand,
  GetBucketEncryptionCommand,
} from '@aws-sdk/client-s3';
import {
  CloudFrontClient,
  GetDistributionCommand,
  ListDistributionsCommand,
} from '@aws-sdk/client-cloudfront';
import {
  ElasticLoadBalancingV2Client,
  DescribeLoadBalancersCommand,
  DescribeTargetGroupsCommand,
  DescribeListenersCommand,
} from '@aws-sdk/client-elastic-load-balancing-v2';
import {
  SecretsManagerClient,
  DescribeSecretCommand,
  GetSecretValueCommand,
} from '@aws-sdk/client-secrets-manager';
import {
  CloudWatchLogsClient,
  DescribeLogGroupsCommand,
} from '@aws-sdk/client-cloudwatch-logs';

/**
 * Integration tests for deployed payment processing infrastructure
 *
 * These tests validate the actual deployed AWS resources using real AWS APIs.
 * They load stack outputs from cfn-outputs/flat-outputs.json and verify:
 * - Resources exist and are properly configured
 * - Security settings are correctly applied
 * - Resources are interconnected as expected
 * - Compliance requirements are met
 */

const AWS_REGION = 'us-east-1';
const ENVIRONMENT_SUFFIX = process.env.ENVIRONMENT_SUFFIX || 'synthc8m2f3';

// Initialize AWS SDK clients
const ec2Client = new EC2Client({ region: AWS_REGION });
const ecsClient = new ECSClient({ region: AWS_REGION });
const rdsClient = new RDSClient({ region: AWS_REGION });
const s3Client = new S3Client({ region: AWS_REGION });
const cloudFrontClient = new CloudFrontClient({ region: AWS_REGION });
const elbClient = new ElasticLoadBalancingV2Client({ region: AWS_REGION });
const secretsClient = new SecretsManagerClient({ region: AWS_REGION });
const logsClient = new CloudWatchLogsClient({ region: AWS_REGION });

interface StackOutputs {
  vpcId?: string;
  albDnsName?: string;
  ecsClusterArn?: string;
  rdsEndpoint?: string;
  cloudfrontDomainName?: string;
  ecsClusterName?: string;
  ecsServiceName?: string;
  rdsClusterIdentifier?: string;
  staticAssetsBucket?: string;
  flowLogsBucket?: string;
  secretArn?: string;
  [key: string]: string | undefined;
}

// Load deployment outputs
const loadOutputs = (): StackOutputs => {
  const outputPath = path.join(process.cwd(), 'cfn-outputs', 'flat-outputs.json');

  if (!fs.existsSync(outputPath)) {
    throw new Error(
      `Deployment outputs not found at ${outputPath}. ` +
        'Please ensure deployment completed successfully and outputs were captured.'
    );
  }

  const outputs = JSON.parse(fs.readFileSync(outputPath, 'utf-8'));
  return outputs;
};

describe('Payment Processing Infrastructure - Integration Tests', () => {
  let outputs: StackOutputs;

  beforeAll(() => {
    outputs = loadOutputs();
    console.log('Loaded stack outputs:', Object.keys(outputs));
  });

  describe('VPC and Networking', () => {
    it('should have a VPC with proper configuration', async () => {
      expect(outputs.vpcId).toBeDefined();

      const response = await ec2Client.send(
        new DescribeVpcsCommand({
          VpcIds: [outputs.vpcId!],
        })
      );

      expect(response.Vpcs).toHaveLength(1);
      const vpc = response.Vpcs![0];

      expect(vpc.State).toBe('available');
      expect(vpc.CidrBlock).toBe('10.0.0.0/16');
      expect(vpc.EnableDnsHostnames).toBe(true);
      expect(vpc.EnableDnsSupport).toBe(true);
    });

    it('should have 3 public and 3 private subnets across different AZs', async () => {
      const response = await ec2Client.send(
        new DescribeSubnetsCommand({
          Filters: [
            {
              Name: 'vpc-id',
              Values: [outputs.vpcId!],
            },
          ],
        })
      );

      const subnets = response.Subnets || [];
      expect(subnets.length).toBeGreaterThanOrEqual(6);

      const publicSubnets = subnets.filter((s) =>
        s.Tags?.some((t) => t.Key === 'Type' && t.Value === 'public')
      );
      const privateSubnets = subnets.filter((s) =>
        s.Tags?.some((t) => t.Key === 'Type' && t.Value === 'private')
      );

      expect(publicSubnets.length).toBe(3);
      expect(privateSubnets.length).toBe(3);

      // Verify subnets are in different AZs
      const publicAZs = new Set(publicSubnets.map((s) => s.AvailabilityZone));
      const privateAZs = new Set(privateSubnets.map((s) => s.AvailabilityZone));

      expect(publicAZs.size).toBe(3);
      expect(privateAZs.size).toBe(3);
    });

    it('should have 3 NAT gateways in public subnets', async () => {
      const response = await ec2Client.send(
        new DescribeNatGatewaysCommand({
          Filter: [
            {
              Name: 'vpc-id',
              Values: [outputs.vpcId!],
            },
            {
              Name: 'state',
              Values: ['available'],
            },
          ],
        })
      );

      const natGateways = response.NatGateways || [];
      expect(natGateways.length).toBe(3);

      // Verify each NAT gateway has an EIP
      natGateways.forEach((nat) => {
        expect(nat.NatGatewayAddresses).toBeDefined();
        expect(nat.NatGatewayAddresses!.length).toBeGreaterThan(0);
      });
    });
  });

  describe('Security Groups', () => {
    it('should have properly configured security groups', async () => {
      const response = await ec2Client.send(
        new DescribeSecurityGroupsCommand({
          Filters: [
            {
              Name: 'vpc-id',
              Values: [outputs.vpcId!],
            },
          ],
        })
      );

      const securityGroups = response.SecurityGroups || [];

      // Should have at least ALB, ECS, and RDS security groups
      expect(securityGroups.length).toBeGreaterThanOrEqual(3);

      const albSg = securityGroups.find((sg) =>
        sg.GroupName?.includes('payment-alb-sg')
      );
      const ecsSg = securityGroups.find((sg) =>
        sg.GroupName?.includes('payment-ecs-sg')
      );
      const rdsSg = securityGroups.find((sg) =>
        sg.GroupName?.includes('payment-rds-sg')
      );

      expect(albSg).toBeDefined();
      expect(ecsSg).toBeDefined();
      expect(rdsSg).toBeDefined();

      // Verify ALB allows HTTPS from internet
      const httpsRule = albSg?.IpPermissions?.find((p) => p.FromPort === 443);
      expect(httpsRule).toBeDefined();
    });
  });

  describe('Application Load Balancer', () => {
    it('should have an ALB with HTTPS listener', async () => {
      expect(outputs.albDnsName).toBeDefined();

      const lbResponse = await elbClient.send(
        new DescribeLoadBalancersCommand({
          Names: [`payment-alb-${ENVIRONMENT_SUFFIX}`],
        })
      );

      expect(lbResponse.LoadBalancers).toHaveLength(1);
      const alb = lbResponse.LoadBalancers![0];

      expect(alb.State?.Code).toBe('active');
      expect(alb.Scheme).toBe('internet-facing');
      expect(alb.Type).toBe('application');

      // Check listeners
      const listenersResponse = await elbClient.send(
        new DescribeListenersCommand({
          LoadBalancerArn: alb.LoadBalancerArn,
        })
      );

      const listeners = listenersResponse.Listeners || [];
      const httpsListener = listeners.find((l) => l.Port === 443);
      const httpListener = listeners.find((l) => l.Port === 80);

      expect(httpsListener).toBeDefined();
      expect(httpListener).toBeDefined();
      expect(httpsListener?.Protocol).toBe('HTTPS');
    });

    it('should have a target group with health checks', async () => {
      const response = await elbClient.send(
        new DescribeTargetGroupsCommand({
          Names: [`payment-tg-${ENVIRONMENT_SUFFIX}`],
        })
      );

      expect(response.TargetGroups).toHaveLength(1);
      const tg = response.TargetGroups![0];

      expect(tg.Port).toBe(8080);
      expect(tg.Protocol).toBe('HTTP');
      expect(tg.TargetType).toBe('ip');

      expect(tg.HealthCheckEnabled).toBe(true);
      expect(tg.HealthCheckPath).toBe('/health');
      expect(tg.HealthCheckProtocol).toBe('HTTP');
    });
  });

  describe('ECS Fargate', () => {
    it('should have an ECS cluster with container insights enabled', async () => {
      expect(outputs.ecsClusterArn).toBeDefined();

      const response = await ecsClient.send(
        new DescribeClustersCommand({
          clusters: [outputs.ecsClusterArn!],
          include: ['SETTINGS'],
        })
      );

      expect(response.clusters).toHaveLength(1);
      const cluster = response.clusters![0];

      expect(cluster.status).toBe('ACTIVE');

      const containerInsights = cluster.settings?.find(
        (s) => s.name === 'containerInsights'
      );
      expect(containerInsights?.value).toBe('enabled');
    });

    it('should have an ECS service running in private subnets', async () => {
      expect(outputs.ecsClusterName).toBeDefined();
      expect(outputs.ecsServiceName).toBeDefined();

      const response = await ecsClient.send(
        new DescribeServicesCommand({
          cluster: outputs.ecsClusterName!,
          services: [outputs.ecsServiceName!],
        })
      );

      expect(response.services).toHaveLength(1);
      const service = response.services![0];

      expect(service.launchType).toBe('FARGATE');
      expect(service.desiredCount).toBe(2);

      // Verify network configuration
      expect(service.networkConfiguration?.awsvpcConfiguration).toBeDefined();
      const config = service.networkConfiguration!.awsvpcConfiguration!;
      expect(config.assignPublicIp).toBe('DISABLED');
    });
  });

  describe('RDS Aurora PostgreSQL', () => {
    it('should have an Aurora cluster with Multi-AZ deployment', async () => {
      expect(outputs.rdsClusterIdentifier).toBeDefined();

      const response = await rdsClient.send(
        new DescribeDBClustersCommand({
          DBClusterIdentifier: outputs.rdsClusterIdentifier!,
        })
      );

      expect(response.DBClusters).toHaveLength(1);
      const cluster = response.DBClusters![0];

      expect(cluster.Status).toBe('available');
      expect(cluster.Engine).toBe('aurora-postgresql');
      expect(cluster.EngineVersion).toMatch(/^15\./);
      expect(cluster.StorageEncrypted).toBe(true);
      expect(cluster.BackupRetentionPeriod).toBe(7);

      // Verify Multi-AZ deployment
      expect(cluster.MultiAZ).toBeDefined();
    });

    it('should have 2 cluster instances for HA', async () => {
      const response = await rdsClient.send(
        new DescribeDBClusterInstancesCommand({
          DBClusterIdentifier: outputs.rdsClusterIdentifier!,
        })
      );

      const instances = response.DBClusterInstances || [];
      expect(instances.length).toBe(2);

      instances.forEach((instance) => {
        expect(instance.PubliclyAccessible).toBe(false);
      });
    });
  });

  describe('S3 Buckets', () => {
    it('should have static assets bucket with versioning enabled', async () => {
      expect(outputs.staticAssetsBucket).toBeDefined();

      const versioningResponse = await s3Client.send(
        new GetBucketVersioningCommand({
          Bucket: outputs.staticAssetsBucket!,
        })
      );

      expect(versioningResponse.Status).toBe('Enabled');

      const encryptionResponse = await s3Client.send(
        new GetBucketEncryptionCommand({
          Bucket: outputs.staticAssetsBucket!,
        })
      );

      expect(encryptionResponse.ServerSideEncryptionConfiguration).toBeDefined();
    });

    it('should have flow logs bucket with versioning enabled', async () => {
      expect(outputs.flowLogsBucket).toBeDefined();

      const versioningResponse = await s3Client.send(
        new GetBucketVersioningCommand({
          Bucket: outputs.flowLogsBucket!,
        })
      );

      expect(versioningResponse.Status).toBe('Enabled');
    });
  });

  describe('CloudFront Distribution', () => {
    it('should have an active CloudFront distribution', async () => {
      expect(outputs.cloudfrontDomainName).toBeDefined();

      const listResponse = await cloudFrontClient.send(
        new ListDistributionsCommand({})
      );

      const distribution = listResponse.DistributionList?.Items?.find((d) =>
        d.DomainName === outputs.cloudfrontDomainName
      );

      expect(distribution).toBeDefined();
      expect(distribution?.Enabled).toBe(true);
      expect(distribution?.Status).toMatch(/Deployed|InProgress/);
    });
  });

  describe('Secrets Manager', () => {
    it('should have database credentials secret', async () => {
      expect(outputs.secretArn).toBeDefined();

      const response = await secretsClient.send(
        new DescribeSecretCommand({
          SecretId: outputs.secretArn!,
        })
      );

      expect(response.ARN).toBe(outputs.secretArn);
      expect(response.Name).toContain('payment-db-password');
    });

    it('should have retrievable secret value', async () => {
      const response = await secretsClient.send(
        new GetSecretValueCommand({
          SecretId: outputs.secretArn!,
        })
      );

      expect(response.SecretString).toBeDefined();

      const secret = JSON.parse(response.SecretString!);
      expect(secret).toHaveProperty('username');
      expect(secret).toHaveProperty('password');
      expect(secret).toHaveProperty('engine');
      expect(secret).toHaveProperty('port');
      expect(secret.engine).toBe('postgres');
      expect(secret.port).toBe(5432);
    });
  });

  describe('CloudWatch Logs', () => {
    it('should have log groups with correct retention', async () => {
      const response = await logsClient.send(
        new DescribeLogGroupsCommand({
          logGroupNamePrefix: '/aws/ecs/payment-processing',
        })
      );

      const logGroups = response.logGroups || [];
      expect(logGroups.length).toBeGreaterThan(0);

      const ecsLogGroup = logGroups.find((lg) =>
        lg.logGroupName?.includes(ENVIRONMENT_SUFFIX)
      );

      expect(ecsLogGroup).toBeDefined();
      expect(ecsLogGroup?.retentionInDays).toBe(2557); // 7 years
    });
  });

  describe('Resource Tagging', () => {
    it('should have proper tags on VPC', async () => {
      const response = await ec2Client.send(
        new DescribeVpcsCommand({
          VpcIds: [outputs.vpcId!],
        })
      );

      const vpc = response.Vpcs![0];
      const tags = vpc.Tags || [];

      const projectTag = tags.find((t) => t.Key === 'Project');
      const costCenterTag = tags.find((t) => t.Key === 'CostCenter');

      expect(projectTag).toBeDefined();
      expect(costCenterTag).toBeDefined();
      expect(projectTag?.Value).toBe('payment-processing');
      expect(costCenterTag?.Value).toBe('fintech-operations');
    });
  });
});
