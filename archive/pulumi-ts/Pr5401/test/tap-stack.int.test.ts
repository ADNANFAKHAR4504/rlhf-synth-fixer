/**
 * Integration tests for TapStack
 * Tests the deployed infrastructure using real AWS resources and stack outputs
 *
 * IMPORTANT: These tests require:
 * 1. Infrastructure to be deployed first
 * 2. cfn-outputs/flat-outputs.json file with stack outputs
 * 3. Valid AWS credentials configured
 */
import * as fs from 'fs';
import * as path from 'path';
import {
  EC2Client,
  DescribeVpcsCommand,
  DescribeSubnetsCommand,
  DescribeSecurityGroupsCommand,
  DescribeNatGatewaysCommand,
  DescribeInternetGatewaysCommand,
} from '@aws-sdk/client-ec2';
import {
  ECSClient,
  DescribeClustersCommand,
  DescribeServicesCommand,
  DescribeTaskDefinitionCommand,
  ListServicesCommand,
} from '@aws-sdk/client-ecs';
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
  ApplicationAutoScalingClient,
  DescribeScalableTargetsCommand,
  DescribeScalingPoliciesCommand,
} from '@aws-sdk/client-application-auto-scaling';

const AWS_REGION = process.env.AWS_REGION || 'ap-southeast-1';

// Initialize AWS clients
const ec2Client = new EC2Client({ region: AWS_REGION });
const ecsClient = new ECSClient({ region: AWS_REGION });
const elbClient = new ElasticLoadBalancingV2Client({ region: AWS_REGION });
const logsClient = new CloudWatchLogsClient({ region: AWS_REGION });
const autoScalingClient = new ApplicationAutoScalingClient({ region: AWS_REGION });

// Load deployment outputs
const outputsPath = path.join(__dirname, '..', 'cfn-outputs', 'flat-outputs.json');
let deploymentOutputs: any = {};

describe('TAP Stack Integration Tests', () => {
  beforeAll(() => {
    if (fs.existsSync(outputsPath)) {
      const outputsContent = fs.readFileSync(outputsPath, 'utf-8');
      deploymentOutputs = JSON.parse(outputsContent);
      console.log('Loaded deployment outputs:', Object.keys(deploymentOutputs));
    } else {
      console.warn(`Outputs file not found at ${outputsPath}. Some tests may fail.`);
    }
  });

  describe('Deployment Outputs', () => {
    it('should have required outputs', () => {
      expect(deploymentOutputs).toBeDefined();
      expect(deploymentOutputs).toHaveProperty('albDnsName');
      expect(deploymentOutputs).toHaveProperty('vpcId');
      expect(deploymentOutputs).toHaveProperty('ecsClusterName');
    });

    it('should have valid ALB DNS name', () => {
      expect(deploymentOutputs.albDnsName).toBeDefined();
      expect(typeof deploymentOutputs.albDnsName).toBe('string');
      expect(deploymentOutputs.albDnsName.length).toBeGreaterThan(0);
    });

    it('should have valid VPC ID', () => {
      expect(deploymentOutputs.vpcId).toBeDefined();
      expect(deploymentOutputs.vpcId).toMatch(/^vpc-[a-f0-9]+$/);
    });

    it('should have valid ECS cluster name', () => {
      expect(deploymentOutputs.ecsClusterName).toBeDefined();
      expect(typeof deploymentOutputs.ecsClusterName).toBe('string');
      expect(deploymentOutputs.ecsClusterName.length).toBeGreaterThan(0);
    });
  });

  describe('VPC Infrastructure', () => {
    it('should have 2 public subnets in different AZs', async () => {
      const command = new DescribeSubnetsCommand({
        Filters: [
          { Name: 'vpc-id', Values: [deploymentOutputs.vpcId] },
          { Name: 'tag:Type', Values: ['public'] },
        ],
      });
      const response = await ec2Client.send(command);

      expect(response.Subnets).toBeDefined();
      expect(response.Subnets?.length).toBe(2);

      const azs = response.Subnets!.map(subnet => subnet.AvailabilityZone);
      expect(new Set(azs).size).toBe(2);

      response.Subnets!.forEach(subnet => {
        expect(subnet.MapPublicIpOnLaunch).toBe(true);
      });
    });

    it('should have 2 private subnets in different AZs', async () => {
      const command = new DescribeSubnetsCommand({
        Filters: [
          { Name: 'vpc-id', Values: [deploymentOutputs.vpcId] },
          { Name: 'tag:Type', Values: ['private'] },
        ],
      });
      const response = await ec2Client.send(command);

      expect(response.Subnets).toBeDefined();
      expect(response.Subnets?.length).toBe(2);

      const azs = response.Subnets!.map(subnet => subnet.AvailabilityZone);
      expect(new Set(azs).size).toBe(2);
    });

    it('should have an Internet Gateway attached to VPC', async () => {
      const command = new DescribeInternetGatewaysCommand({
        Filters: [
          { Name: 'attachment.vpc-id', Values: [deploymentOutputs.vpcId] },
        ],
      });
      const response = await ec2Client.send(command);

      expect(response.InternetGateways).toBeDefined();
      expect(response.InternetGateways?.length).toBeGreaterThanOrEqual(1);

      const igw = response.InternetGateways![0];
      expect(igw.Attachments).toBeDefined();
      expect(igw.Attachments![0].State).toBe('available');
    });

    it('should have a NAT Gateway in public subnet', async () => {
      const command = new DescribeNatGatewaysCommand({
        Filter: [
          { Name: 'vpc-id', Values: [deploymentOutputs.vpcId] },
          { Name: 'state', Values: ['available'] },
        ],
      });
      const response = await ec2Client.send(command);

      expect(response.NatGateways).toBeDefined();
      expect(response.NatGateways?.length).toBeGreaterThanOrEqual(1);

      const natGateway = response.NatGateways![0];
      expect(natGateway.State).toBe('available');
    });
  });

  describe('Application Load Balancer', () => {
    let albArn: string;

    beforeAll(async () => {
      const command = new DescribeLoadBalancersCommand({});
      const response = await elbClient.send(command);
      const alb = response.LoadBalancers?.find(
        lb => lb.DNSName === deploymentOutputs.albDnsName
      );
      expect(alb).toBeDefined();
      albArn = alb!.LoadBalancerArn!;
    });

    it('should be internet-facing and in public subnets', async () => {
      const command = new DescribeLoadBalancersCommand({
        LoadBalancerArns: [albArn],
      });
      const response = await elbClient.send(command);

      const alb = response.LoadBalancers![0];
      expect(alb.Scheme).toBe('internet-facing');
      expect(alb.Type).toBe('application');
      expect(alb.State?.Code).toBe('active');
    });

    it('should have HTTP listener on port 80', async () => {
      const command = new DescribeListenersCommand({
        LoadBalancerArn: albArn,
      });
      const response = await elbClient.send(command);

      expect(response.Listeners).toBeDefined();
      expect(response.Listeners?.length).toBeGreaterThanOrEqual(1);

      const httpListener = response.Listeners!.find(l => l.Port === 80);
      expect(httpListener).toBeDefined();
      expect(httpListener!.Protocol).toBe('HTTP');
    });

    it('should have target group with health checks configured', async () => {
      const command = new DescribeTargetGroupsCommand({
        LoadBalancerArn: albArn,
      });
      const response = await elbClient.send(command);

      expect(response.TargetGroups).toBeDefined();
      expect(response.TargetGroups?.length).toBeGreaterThanOrEqual(1);

      const tg = response.TargetGroups![0];
      expect(tg.HealthCheckEnabled).toBe(true);
      expect(tg.HealthCheckPath).toBe('/health');
      expect(tg.HealthCheckIntervalSeconds).toBe(30);
      expect(tg.TargetType).toBe('ip');
    });
  });

  describe('ECS Cluster and Service', () => {
    let clusterArn: string;
    let serviceArn: string;

    beforeAll(async () => {
      const clustersCommand = new DescribeClustersCommand({
        clusters: [deploymentOutputs.ecsClusterName],
      });
      const clustersResponse = await ecsClient.send(clustersCommand);
      expect(clustersResponse.clusters).toBeDefined();
      expect(clustersResponse.clusters?.length).toBe(1);
      clusterArn = clustersResponse.clusters![0].clusterArn!;

      const servicesListCommand = new ListServicesCommand({
        cluster: clusterArn,
      });
      const servicesListResponse = await ecsClient.send(servicesListCommand);
      expect(servicesListResponse.serviceArns).toBeDefined();
      expect(servicesListResponse.serviceArns?.length).toBeGreaterThanOrEqual(1);
      serviceArn = servicesListResponse.serviceArns![0];
    });

    it('should have ECS cluster in active state', async () => {
      const command = new DescribeClustersCommand({
        clusters: [clusterArn],
      });
      const response = await ecsClient.send(command);

      expect(response.clusters).toBeDefined();
      expect(response.clusters?.length).toBe(1);

      const cluster = response.clusters![0];
      expect(cluster.status).toBe('ACTIVE');
    });

    it('should have task definition with correct CPU and memory', async () => {
      const servicesCommand = new DescribeServicesCommand({
        cluster: clusterArn,
        services: [serviceArn],
      });
      const servicesResponse = await ecsClient.send(servicesCommand);
      const taskDefArn = servicesResponse.services![0].taskDefinition!;

      const command = new DescribeTaskDefinitionCommand({
        taskDefinition: taskDefArn,
      });
      const response = await ecsClient.send(command);

      expect(response.taskDefinition).toBeDefined();
      const taskDef = response.taskDefinition!;

      expect(taskDef.cpu).toBe('512');
      expect(taskDef.memory).toBe('1024');
      expect(taskDef.networkMode).toBe('awsvpc');
      expect(taskDef.requiresCompatibilities).toContain('FARGATE');
    });

    it('should have container with health check configured', async () => {
      const servicesCommand = new DescribeServicesCommand({
        cluster: clusterArn,
        services: [serviceArn],
      });
      const servicesResponse = await ecsClient.send(servicesCommand);
      const taskDefArn = servicesResponse.services![0].taskDefinition!;

      const command = new DescribeTaskDefinitionCommand({
        taskDefinition: taskDefArn,
      });
      const response = await ecsClient.send(command);

      const container = response.taskDefinition!.containerDefinitions![0];
      expect(container.healthCheck).toBeDefined();
      expect(container.healthCheck!.interval).toBe(30);
      expect(container.healthCheck!.retries).toBe(3);
    });
  });

  describe('Auto Scaling Configuration', () => {
    it('should have auto scaling target configured for ECS service', async () => {
      const command = new DescribeScalableTargetsCommand({
        ServiceNamespace: 'ecs',
      });
      const response = await autoScalingClient.send(command);

      expect(response.ScalableTargets).toBeDefined();
      const target = response.ScalableTargets!.find(t =>
        t.ResourceId?.includes(deploymentOutputs.ecsClusterName)
      );

      expect(target).toBeDefined();
      expect(target!.MinCapacity).toBe(3);
      expect(target!.MaxCapacity).toBe(10);
    });

    it('should have CPU-based target tracking scaling policy', async () => {
      const command = new DescribeScalingPoliciesCommand({
        ServiceNamespace: 'ecs',
      });
      const response = await autoScalingClient.send(command);

      expect(response.ScalingPolicies).toBeDefined();
      const policy = response.ScalingPolicies!.find(p =>
        p.ResourceId?.includes(deploymentOutputs.ecsClusterName)
      );

      expect(policy).toBeDefined();
      expect(policy!.PolicyType).toBe('TargetTrackingScaling');
      expect(policy!.TargetTrackingScalingPolicyConfiguration).toBeDefined();

      const config = policy!.TargetTrackingScalingPolicyConfiguration!;
      expect(config.TargetValue).toBe(70.0);
      expect(config.PredefinedMetricSpecification?.PredefinedMetricType).toBe(
        'ECSServiceAverageCPUUtilization'
      );
    });
  });

  describe('CloudWatch Logs', () => {
    it('should have log group with 7-day retention', async () => {
      const command = new DescribeLogGroupsCommand({});
      const response = await logsClient.send(command);

      expect(response.logGroups).toBeDefined();
      const logGroup = response.logGroups!.find(lg =>
        lg.logGroupName?.includes('ecs-logs')
      );

      expect(logGroup).toBeDefined();
      expect(logGroup!.retentionInDays).toBe(7);
    });
  });

  describe('Security Groups', () => {
    it('should have ALB security group allowing HTTP from internet', async () => {
      const command = new DescribeSecurityGroupsCommand({
        Filters: [
          { Name: 'vpc-id', Values: [deploymentOutputs.vpcId] },
          { Name: 'group-name', Values: ['*alb-sg*'] },
        ],
      });
      const response = await ec2Client.send(command);

      expect(response.SecurityGroups).toBeDefined();
      const sg = response.SecurityGroups!.find(sg => sg.GroupName?.includes('alb-sg'));

      expect(sg).toBeDefined();
      const httpIngress = sg!.IpPermissions!.find(
        rule => rule.FromPort === 80 && rule.ToPort === 80
      );

      expect(httpIngress).toBeDefined();
      expect(httpIngress!.IpRanges).toBeDefined();
      expect(httpIngress!.IpRanges!.some(range => range.CidrIp === '0.0.0.0/0')).toBe(true);
    });

    it('should have ECS task security group allowing traffic from ALB', async () => {
      const command = new DescribeSecurityGroupsCommand({
        Filters: [
          { Name: 'vpc-id', Values: [deploymentOutputs.vpcId] },
          { Name: 'group-name', Values: ['*ecs-task-sg*'] },
        ],
      });
      const response = await ec2Client.send(command);

      expect(response.SecurityGroups).toBeDefined();
      const sg = response.SecurityGroups!.find(sg => sg.GroupName?.includes('ecs-task-sg'));

      expect(sg).toBeDefined();
      const httpIngress = sg!.IpPermissions!.find(
        rule => rule.FromPort === 80 && rule.ToPort === 80
      );

      expect(httpIngress).toBeDefined();
      expect(httpIngress!.UserIdGroupPairs).toBeDefined();
      expect(httpIngress!.UserIdGroupPairs!.length).toBeGreaterThan(0);
    });
  });

  describe('Resource Tagging', () => {
    it('should have required tags on VPC', async () => {
      const command = new DescribeVpcsCommand({
        VpcIds: [deploymentOutputs.vpcId],
      });
      const response = await ec2Client.send(command);

      const vpc = response.Vpcs![0];
      expect(vpc.Tags).toBeDefined();

      const tags = vpc.Tags!.reduce((acc, tag) => {
        acc[tag.Key!] = tag.Value!;
        return acc;
      }, {} as Record<string, string>);

      expect(tags.Environment).toBe('production');
      expect(tags.ManagedBy).toBe('pulumi');
    });
  });
});
