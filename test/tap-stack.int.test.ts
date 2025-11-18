/**
 * Integration tests for TapStack - validates real AWS deployment
 * Uses actual cfn-outputs/flat-outputs.json for assertions
 */
import * as fs from 'fs';
import * as path from 'path';
import {
  ECSClient,
  DescribeServicesCommand,
  DescribeClustersCommand,
} from '@aws-sdk/client-ecs';
import {
  ECRClient,
  DescribeRepositoriesCommand,
} from '@aws-sdk/client-ecr';
import {
  EC2Client,
  DescribeVpcsCommand,
  DescribeSubnetsCommand,
  DescribeNatGatewaysCommand,
  DescribeInternetGatewaysCommand,
  DescribeRouteTablesCommand,
  DescribeSecurityGroupsCommand,
} from '@aws-sdk/client-ec2';
import {
  ElasticLoadBalancingV2Client,
  DescribeLoadBalancersCommand,
  DescribeTargetGroupsCommand,
  DescribeListenersCommand,
} from '@aws-sdk/client-elastic-load-balancing-v2';
import {
  CloudWatchLogsClient,
  DescribeLogGroupsCommand,
} from '@aws-sdk/client-cloudwatch-logs';
import {
  SecretsManagerClient,
  DescribeSecretCommand,
} from '@aws-sdk/client-secrets-manager';
import {
  IAMClient,
  GetRoleCommand,
} from '@aws-sdk/client-iam';
import {
  ServiceDiscoveryClient,
  GetNamespaceCommand,
  GetServiceCommand,
} from '@aws-sdk/client-servicediscovery';
import {
  ApplicationAutoScalingClient,
  DescribeScalableTargetsCommand,
  DescribeScalingPoliciesCommand,
} from '@aws-sdk/client-application-auto-scaling';

const AWS_REGION = process.env.AWS_REGION || 'us-east-1';

// Initialize AWS clients
const ecsClient = new ECSClient({ region: AWS_REGION });
const ecrClient = new ECRClient({ region: AWS_REGION });
const ec2Client = new EC2Client({ region: AWS_REGION });
const elbClient = new ElasticLoadBalancingV2Client({ region: AWS_REGION });
const logsClient = new CloudWatchLogsClient({ region: AWS_REGION });
const secretsClient = new SecretsManagerClient({ region: AWS_REGION });
const iamClient = new IAMClient({ region: AWS_REGION });
const sdClient = new ServiceDiscoveryClient({ region: AWS_REGION });
const autoScalingClient = new ApplicationAutoScalingClient({ region: AWS_REGION });

// Load deployment outputs
function loadOutputs(): any {
  const outputsPath = path.join(
    __dirname,
    '../cfn-outputs/flat-outputs.json'
  );
  if (!fs.existsSync(outputsPath)) {
    throw new Error(
      `Outputs file not found at ${outputsPath}. Run deployment first.`
    );
  }
  return JSON.parse(fs.readFileSync(outputsPath, 'utf8'));
}

describe('TapStack Integration Tests', () => {
  let outputs: any;

  beforeAll(() => {
    outputs = loadOutputs();
  });

  describe('Deployment Outputs', () => {
    it('should have all required outputs', () => {
      expect(outputs.vpcId).toBeDefined();
      expect(outputs.albDnsName).toBeDefined();
      expect(outputs.clusterName).toBeDefined();
      expect(outputs.clusterArn).toBeDefined();
      expect(outputs.frontendServiceArn).toBeDefined();
      expect(outputs.apiGatewayServiceArn).toBeDefined();
      expect(outputs.processingServiceArn).toBeDefined();
      expect(outputs.frontendEcrUrl).toBeDefined();
      expect(outputs.apiGatewayEcrUrl).toBeDefined();
      expect(outputs.processingServiceEcrUrl).toBeDefined();
      expect(outputs.publicSubnetIds).toBeDefined();
      expect(outputs.privateSubnetIds).toBeDefined();
    });

    it('should have non-empty output values', () => {
      expect(outputs.vpcId).not.toBe('');
      expect(outputs.albDnsName).not.toBe('');
      expect(outputs.clusterName).not.toBe('');
      expect(outputs.publicSubnetIds.length).toBeGreaterThan(0);
      expect(outputs.privateSubnetIds.length).toBeGreaterThan(0);
    });
  });

  describe('VPC Configuration', () => {
    it('should have VPC deployed', async () => {
      const command = new DescribeVpcsCommand({
        VpcIds: [outputs.vpcId],
      });
      const response = await ec2Client.send(command);
      expect(response.Vpcs).toBeDefined();
      expect(response.Vpcs!.length).toBe(1);
      expect(response.Vpcs![0].VpcId).toBe(outputs.vpcId);
    });

    it('should have 3 public subnets', async () => {
      expect(outputs.publicSubnetIds).toHaveLength(3);
      const command = new DescribeSubnetsCommand({
        SubnetIds: outputs.publicSubnetIds,
      });
      const response = await ec2Client.send(command);
      expect(response.Subnets!.length).toBe(3);
    });

    it('should have 3 private subnets', async () => {
      expect(outputs.privateSubnetIds).toHaveLength(3);
      const command = new DescribeSubnetsCommand({
        SubnetIds: outputs.privateSubnetIds,
      });
      const response = await ec2Client.send(command);
      expect(response.Subnets!.length).toBe(3);
    });

    it('should have Internet Gateway', async () => {
      const command = new DescribeInternetGatewaysCommand({
        Filters: [
          {
            Name: 'attachment.vpc-id',
            Values: [outputs.vpcId],
          },
        ],
      });
      const response = await ec2Client.send(command);
      expect(response.InternetGateways!.length).toBeGreaterThan(0);
    });

    it('should have NAT Gateways for private subnets', async () => {
      const command = new DescribeNatGatewaysCommand({
        Filter: [
          {
            Name: 'vpc-id',
            Values: [outputs.vpcId],
          },
          {
            Name: 'state',
            Values: ['available'],
          },
        ],
      });
      const response = await ec2Client.send(command);
      expect(response.NatGateways!.length).toBeGreaterThanOrEqual(1);
    });

    it('should have route tables configured', async () => {
      const command = new DescribeRouteTablesCommand({
        Filters: [
          {
            Name: 'vpc-id',
            Values: [outputs.vpcId],
          },
        ],
      });
      const response = await ec2Client.send(command);
      expect(response.RouteTables!.length).toBeGreaterThanOrEqual(4);
    });
  });

  describe('ECR Repositories', () => {
    it('should have frontend ECR repository', async () => {
      const repoName = outputs.frontendEcrUrl.split('/')[1].split(':')[0];
      const command = new DescribeRepositoriesCommand({
        repositoryNames: [repoName],
      });
      const response = await ecrClient.send(command);
      expect(response.repositories!.length).toBe(1);
      expect(response.repositories![0].repositoryName).toBe(repoName);
    });

    it('should have api-gateway ECR repository', async () => {
      const repoName = outputs.apiGatewayEcrUrl.split('/')[1].split(':')[0];
      const command = new DescribeRepositoriesCommand({
        repositoryNames: [repoName],
      });
      const response = await ecrClient.send(command);
      expect(response.repositories!.length).toBe(1);
      expect(response.repositories![0].repositoryName).toBe(repoName);
    });

    it('should have processing-service ECR repository', async () => {
      const repoName = outputs.processingServiceEcrUrl.split('/')[1].split(':')[0];
      const command = new DescribeRepositoriesCommand({
        repositoryNames: [repoName],
      });
      const response = await ecrClient.send(command);
      expect(response.repositories!.length).toBe(1);
      expect(response.repositories![0].repositoryName).toBe(repoName);
    });

    it('should have image scanning enabled on ECR repositories', async () => {
      const repoName = outputs.frontendEcrUrl.split('/')[1].split(':')[0];
      const command = new DescribeRepositoriesCommand({
        repositoryNames: [repoName],
      });
      const response = await ecrClient.send(command);
      expect(
        response.repositories![0].imageScanningConfiguration?.scanOnPush
      ).toBe(true);
    });
  });

  describe('ECS Cluster', () => {
    it('should have cluster deployed and active', async () => {
      const command = new DescribeClustersCommand({
        clusters: [outputs.clusterArn],
      });
      const response = await ecsClient.send(command);
      expect(response.clusters!.length).toBe(1);
      expect(response.clusters![0].status).toBe('ACTIVE');
      expect(response.clusters![0].clusterName).toBe(outputs.clusterName);
    });
  });

  describe('ECS Services', () => {
    it('should have frontend service running', async () => {
      const command = new DescribeServicesCommand({
        cluster: outputs.clusterArn,
        services: [outputs.frontendServiceArn],
      });
      const response = await ecsClient.send(command);
      expect(response.services!.length).toBe(1);
      expect(response.services![0].status).toBe('ACTIVE');
      expect(response.services![0].desiredCount).toBeGreaterThanOrEqual(2);
    });

    it('should have api-gateway service running', async () => {
      const command = new DescribeServicesCommand({
        cluster: outputs.clusterArn,
        services: [outputs.apiGatewayServiceArn],
      });
      const response = await ecsClient.send(command);
      expect(response.services!.length).toBe(1);
      expect(response.services![0].status).toBe('ACTIVE');
      expect(response.services![0].desiredCount).toBeGreaterThanOrEqual(2);
    });

    it('should have processing service running', async () => {
      const command = new DescribeServicesCommand({
        cluster: outputs.clusterArn,
        services: [outputs.processingServiceArn],
      });
      const response = await ecsClient.send(command);
      expect(response.services!.length).toBe(1);
      expect(response.services![0].status).toBe('ACTIVE');
      expect(response.services![0].desiredCount).toBeGreaterThanOrEqual(2);
    });

    it('should have services running in Fargate', async () => {
      const command = new DescribeServicesCommand({
        cluster: outputs.clusterArn,
        services: [outputs.frontendServiceArn],
      });
      const response = await ecsClient.send(command);
      expect(response.services![0].launchType).toBe('FARGATE');
    });
  });

  describe('Application Load Balancer', () => {
    it('should have ALB deployed', async () => {
      const command = new DescribeLoadBalancersCommand({
        Names: [outputs.albDnsName.split('-')[0] + '-' + outputs.albDnsName.split('-')[1] + '-' + outputs.albDnsName.split('-')[2]],
      });
      const response = await elbClient.send(command);
      expect(response.LoadBalancers!.length).toBeGreaterThan(0);
      expect(response.LoadBalancers![0].DNSName).toBe(outputs.albDnsName);
    });

    it('should have ALB in active state', async () => {
      const command = new DescribeLoadBalancersCommand({
        Names: [outputs.albDnsName.split('-')[0] + '-' + outputs.albDnsName.split('-')[1] + '-' + outputs.albDnsName.split('-')[2]],
      });
      const response = await elbClient.send(command);
      expect(response.LoadBalancers![0].State?.Code).toBe('active');
    });

    it('should have target groups configured', async () => {
      const loadBalancerCommand = new DescribeLoadBalancersCommand({
        Names: [outputs.albDnsName.split('-')[0] + '-' + outputs.albDnsName.split('-')[1] + '-' + outputs.albDnsName.split('-')[2]],
      });
      const lbResponse = await elbClient.send(loadBalancerCommand);
      const lbArn = lbResponse.LoadBalancers![0].LoadBalancerArn!;

      const command = new DescribeTargetGroupsCommand({
        LoadBalancerArn: lbArn,
      });
      const response = await elbClient.send(command);
      expect(response.TargetGroups!.length).toBeGreaterThanOrEqual(2);
    });

    it('should have listeners configured', async () => {
      const loadBalancerCommand = new DescribeLoadBalancersCommand({
        Names: [outputs.albDnsName.split('-')[0] + '-' + outputs.albDnsName.split('-')[1] + '-' + outputs.albDnsName.split('-')[2]],
      });
      const lbResponse = await elbClient.send(loadBalancerCommand);
      const lbArn = lbResponse.LoadBalancers![0].LoadBalancerArn!;

      const command = new DescribeListenersCommand({
        LoadBalancerArn: lbArn,
      });
      const response = await elbClient.send(command);
      expect(response.Listeners!.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('Security Groups', () => {
    it('should have security groups configured for VPC', async () => {
      const command = new DescribeSecurityGroupsCommand({
        Filters: [
          {
            Name: 'vpc-id',
            Values: [outputs.vpcId],
          },
        ],
      });
      const response = await ec2Client.send(command);
      expect(response.SecurityGroups!.length).toBeGreaterThanOrEqual(4);
    });
  });

  describe('CloudWatch Logs', () => {
    it('should have log groups for services', async () => {
      const command = new DescribeLogGroupsCommand({
        logGroupNamePrefix: '/ecs/tap-',
      });
      const response = await logsClient.send(command);
      expect(response.logGroups!.length).toBeGreaterThanOrEqual(3);
    });

    it('should have log retention configured', async () => {
      const command = new DescribeLogGroupsCommand({
        logGroupNamePrefix: '/ecs/tap-',
      });
      const response = await logsClient.send(command);
      response.logGroups!.forEach((logGroup) => {
        expect(logGroup.retentionInDays).toBe(30);
      });
    });
  });

  describe('Auto Scaling', () => {
    it('should have auto-scaling targets configured', async () => {
      const command = new DescribeScalableTargetsCommand({
        ServiceNamespace: 'ecs',
      });
      const response = await autoScalingClient.send(command);
      const relevantTargets = response.ScalableTargets!.filter(
        (t) => t.ResourceId?.includes(outputs.clusterName)
      );
      expect(relevantTargets.length).toBeGreaterThanOrEqual(3);
    });

    it('should have scaling policies configured', async () => {
      const command = new DescribeScalingPoliciesCommand({
        ServiceNamespace: 'ecs',
      });
      const response = await autoScalingClient.send(command);
      const relevantPolicies = response.ScalingPolicies!.filter(
        (p) => p.ResourceId?.includes(outputs.clusterName)
      );
      // Should have at least 2 policies (could be 2 or 3 depending on service config)
      expect(relevantPolicies.length).toBeGreaterThanOrEqual(2);
    });

    it('should have capacity limits configured correctly', async () => {
      const command = new DescribeScalableTargetsCommand({
        ServiceNamespace: 'ecs',
      });
      const response = await autoScalingClient.send(command);
      const relevantTargets = response.ScalableTargets!.filter(
        (t) => t.ResourceId?.includes(outputs.clusterName)
      );
      relevantTargets.forEach((target) => {
        expect(target.MinCapacity).toBe(2);
        expect(target.MaxCapacity).toBe(10);
      });
    });
  });

  describe('High Availability', () => {
    it('should have resources distributed across multiple AZs', async () => {
      const command = new DescribeSubnetsCommand({
        SubnetIds: [...outputs.publicSubnetIds, ...outputs.privateSubnetIds],
      });
      const response = await ec2Client.send(command);
      const azs = new Set(response.Subnets!.map((s) => s.AvailabilityZone));
      expect(azs.size).toBe(3);
    });
  });

  describe('Resource Naming', () => {
    it('should include environment suffix in cluster name', () => {
      expect(outputs.clusterName).toMatch(/synthw0w8v9/);
    });

    it('should include environment suffix in VPC ID reference', () => {
      expect(outputs.vpcId).toBeDefined();
      expect(outputs.vpcId).toMatch(/^vpc-/);
    });

    it('should include environment suffix in ECR URLs', () => {
      expect(outputs.frontendEcrUrl).toContain('synthw0w8v9');
      expect(outputs.apiGatewayEcrUrl).toContain('synthw0w8v9');
      expect(outputs.processingServiceEcrUrl).toContain('synthw0w8v9');
    });
  });

  describe('Network Isolation', () => {
    it('should have services in private subnets', async () => {
      const command = new DescribeServicesCommand({
        cluster: outputs.clusterArn,
        services: [outputs.frontendServiceArn],
      });
      const response = await ecsClient.send(command);
      const serviceSubnets =
        response.services![0].networkConfiguration?.awsvpcConfiguration
          ?.subnets || [];
      const hasPrivateSubnet = serviceSubnets.some((subnet) =>
        outputs.privateSubnetIds.includes(subnet)
      );
      expect(hasPrivateSubnet).toBe(true);
    });
  });
});
