import * as fs from 'fs';
import * as path from 'path';
import {
  ECSClient,
  DescribeServicesCommand,
  DescribeClustersCommand,
  DescribeTaskDefinitionCommand,
} from '@aws-sdk/client-ecs';
import {
  ElasticLoadBalancingV2Client,
  DescribeLoadBalancersCommand,
  DescribeTargetGroupsCommand,
  DescribeListenersCommand,
} from '@aws-sdk/client-elastic-load-balancing-v2';
import {
  ECRClient,
  DescribeRepositoriesCommand,
  GetLifecyclePolicyCommand,
} from '@aws-sdk/client-ecr';
import {
  CloudWatchLogsClient,
  DescribeLogGroupsCommand,
} from '@aws-sdk/client-cloudwatch-logs';
import { EC2Client, DescribeVpcsCommand } from '@aws-sdk/client-ec2';
import { IAMClient, GetRoleCommand } from '@aws-sdk/client-iam';

const REGION = process.env.AWS_REGION || 'us-east-1';

// Read outputs from deployment
const outputsPath = path.join(process.cwd(), 'cfn-outputs', 'flat-outputs.json');
if (!fs.existsSync(outputsPath)) {
  throw new Error(
    `Outputs file not found at ${outputsPath}. Please deploy the stack first.`
  );
}

const outputs = JSON.parse(fs.readFileSync(outputsPath, 'utf8'));

describe('ECS Cluster Optimization - Integration Tests', () => {
  describe('VPC and Network Configuration', () => {
    it('should have VPC deployed', async () => {
      expect(outputs.vpcId).toBeDefined();
      expect(outputs.vpcId).toMatch(/^vpc-/);

      const ec2Client = new EC2Client({ region: REGION });
      const response = await ec2Client.send(
        new DescribeVpcsCommand({
          VpcIds: [outputs.vpcId],
        })
      );

      expect(response.Vpcs).toHaveLength(1);
      expect(response.Vpcs![0].State).toBe('available');
    });
  });

  describe('ECS Cluster - Requirement 1 & 6', () => {
    it('should have ECS cluster with Container Insights enabled', async () => {
      expect(outputs.clusterName).toBeDefined();
      expect(outputs.clusterArn).toBeDefined();

      const ecsClient = new ECSClient({ region: REGION });
      const response = await ecsClient.send(
        new DescribeClustersCommand({
          clusters: [outputs.clusterName],
          include: ['SETTINGS'],
        })
      );

      expect(response.clusters).toHaveLength(1);
      const cluster = response.clusters![0];

      expect(cluster.status).toBe('ACTIVE');
      expect(cluster.clusterName).toBe(outputs.clusterName);

      // Requirement 6: Container Insights enabled
      const containerInsightsSetting = cluster.settings?.find(
        (s) => s.name === 'containerInsights'
      );
      expect(containerInsightsSetting?.value).toBe('enabled');
    });
  });

  describe('ECS Service - Requirements 1, 3 & 4', () => {
    it('should have ECS service with Fargate Spot capacity provider', async () => {
      expect(outputs.serviceName).toBeDefined();
      expect(outputs.clusterName).toBeDefined();

      const ecsClient = new ECSClient({ region: REGION });
      const response = await ecsClient.send(
        new DescribeServicesCommand({
          cluster: outputs.clusterName,
          services: [outputs.serviceName],
        })
      );

      expect(response.services).toHaveLength(1);
      const service = response.services![0];

      expect(service.status).toBe('ACTIVE');
      expect(service.desiredCount).toBeGreaterThanOrEqual(1);

      // Requirement 1 & 3: Capacity provider with Fargate Spot
      expect(service.capacityProviderStrategy).toBeDefined();
      expect(service.capacityProviderStrategy!.length).toBeGreaterThan(0);

      const fargateSpotProvider = service.capacityProviderStrategy!.find(
        (cp) => cp.capacityProvider === 'FARGATE_SPOT'
      );
      expect(fargateSpotProvider).toBeDefined();
      expect(fargateSpotProvider!.weight).toBeGreaterThan(0);
    });
  });

  describe('Task Definition - Requirement 2', () => {
    it('should have optimized task definition with right-sized resources', async () => {
      expect(outputs.taskDefinitionArn).toBeDefined();

      const ecsClient = new ECSClient({ region: REGION });
      const response = await ecsClient.send(
        new DescribeTaskDefinitionCommand({
          taskDefinition: outputs.taskDefinitionArn,
        })
      );

      const taskDef = response.taskDefinition!;

      // Requirement 2: Optimized resources (40% reduction)
      expect(taskDef.cpu).toBe('256'); // Reduced from 512
      expect(taskDef.memory).toBe('512'); // Reduced from 1024

      expect(taskDef.networkMode).toBe('awsvpc');
      expect(taskDef.requiresCompatibilities).toContain('FARGATE');

      // Requirement 9: IAM least privilege
      expect(taskDef.executionRoleArn).toBeDefined();
      expect(taskDef.taskRoleArn).toBeDefined();
      expect(taskDef.executionRoleArn).not.toBe(taskDef.taskRoleArn);
    });
  });

  describe('Application Load Balancer - Requirement 4', () => {
    it('should have ALB with proper health checks', async () => {
      expect(outputs.albDnsName).toBeDefined();

      const elbClient = new ElasticLoadBalancingV2Client({ region: REGION });

      // Get ALB details using DNS name (more reliable than name)
      const albsResponse = await elbClient.send(
        new DescribeLoadBalancersCommand({})
      );

      const foundAlb = albsResponse.LoadBalancers!.find(
        (lb) => lb.DNSName === outputs.albDnsName
      );

      expect(foundAlb).toBeDefined();

      const albResponse = {
        LoadBalancers: [foundAlb!],
      };

      expect(albResponse.LoadBalancers).toHaveLength(1);
      const alb = albResponse.LoadBalancers![0];

      expect(alb.State?.Code).toBe('active');
      expect(alb.Scheme).toBe('internet-facing');

      // Get target group details
      const tgResponse = await elbClient.send(
        new DescribeTargetGroupsCommand({
          LoadBalancerArn: alb.LoadBalancerArn,
        })
      );

      expect(tgResponse.TargetGroups).toHaveLength(1);
      const targetGroup = tgResponse.TargetGroups![0];

      // Requirement 4: Fixed health check settings
      expect(targetGroup.HealthCheckProtocol).toBeDefined();
      expect(targetGroup.HealthCheckPath).toBe('/health');
      expect(targetGroup.HealthCheckIntervalSeconds).toBeDefined();
      expect(targetGroup.HealthCheckTimeoutSeconds).toBeDefined();
      expect(targetGroup.HealthyThresholdCount).toBeDefined();

      // Health check timeout should be less than interval
      expect(targetGroup.HealthCheckTimeoutSeconds!).toBeLessThan(
        targetGroup.HealthCheckIntervalSeconds!
      );
    });

    it('should have listener configured on port 80', async () => {
      const elbClient = new ElasticLoadBalancingV2Client({ region: REGION });

      // Get ALB details using DNS name (more reliable than name)
      const albsResponse = await elbClient.send(
        new DescribeLoadBalancersCommand({})
      );

      const alb = albsResponse.LoadBalancers!.find(
        (lb) => lb.DNSName === outputs.albDnsName
      );

      expect(alb).toBeDefined();

      const listenerResponse = await elbClient.send(
        new DescribeListenersCommand({
          LoadBalancerArn: alb!.LoadBalancerArn,
        })
      );

      expect(listenerResponse.Listeners).toHaveLength(1);
      const listener = listenerResponse.Listeners![0];

      expect(listener.Port).toBe(80);
      expect(listener.Protocol).toBe('HTTP');
    });
  });

  describe('ECR Repository - Requirement 10', () => {
    it('should have ECR repository with lifecycle policy', async () => {
      expect(outputs.ecrRepositoryUrl).toBeDefined();

      const repositoryName = outputs.ecrRepositoryUrl.split('/')[1];

      const ecrClient = new ECRClient({ region: REGION });

      // Verify repository exists
      const repoResponse = await ecrClient.send(
        new DescribeRepositoriesCommand({
          repositoryNames: [repositoryName],
        })
      );

      expect(repoResponse.repositories).toHaveLength(1);
      const repository = repoResponse.repositories![0];

      expect(repository.repositoryName).toBe(repositoryName);

      // Requirement 10: Lifecycle policy for cleaning up untagged images
      const lifecycleResponse = await ecrClient.send(
        new GetLifecyclePolicyCommand({
          repositoryName: repositoryName,
        })
      );

      expect(lifecycleResponse.lifecyclePolicyText).toBeDefined();

      const policy = JSON.parse(lifecycleResponse.lifecyclePolicyText!);
      expect(policy.rules).toBeDefined();
      expect(Array.isArray(policy.rules)).toBe(true);
      expect(policy.rules.length).toBeGreaterThan(0);

      // Verify rule for untagged images
      const untaggedRule = policy.rules.find(
        (r: any) =>
          r.selection?.tagStatus === 'untagged' &&
          r.selection?.countType === 'sinceImagePushed'
      );

      expect(untaggedRule).toBeDefined();
      expect(untaggedRule.selection.countNumber).toBe(7); // 7 days
    });
  });

  describe('CloudWatch Logs - Requirement 6', () => {
    it('should have CloudWatch log group configured', async () => {
      expect(outputs.logGroupName).toBeDefined();

      const logsClient = new CloudWatchLogsClient({ region: REGION });
      const response = await logsClient.send(
        new DescribeLogGroupsCommand({
          logGroupNamePrefix: outputs.logGroupName,
        })
      );

      expect(response.logGroups).toHaveLength(1);
      const logGroup = response.logGroups![0];

      expect(logGroup.logGroupName).toBe(outputs.logGroupName);
    });
  });

  describe('IAM Roles - Requirement 9', () => {
    it('should have task execution role', async () => {
      const ecsClient = new ECSClient({ region: REGION });
      const taskDefResponse = await ecsClient.send(
        new DescribeTaskDefinitionCommand({
          taskDefinition: outputs.taskDefinitionArn,
        })
      );

      const executionRoleArn = taskDefResponse.taskDefinition!.executionRoleArn!;
      const roleName = executionRoleArn.split('/')[1];

      const iamClient = new IAMClient({ region: REGION });
      const roleResponse = await iamClient.send(
        new GetRoleCommand({
          RoleName: roleName,
        })
      );

      expect(roleResponse.Role).toBeDefined();
      expect(roleResponse.Role!.RoleName).toBe(roleName);
    });

    it('should have task role', async () => {
      const ecsClient = new ECSClient({ region: REGION });
      const taskDefResponse = await ecsClient.send(
        new DescribeTaskDefinitionCommand({
          taskDefinition: outputs.taskDefinitionArn,
        })
      );

      const taskRoleArn = taskDefResponse.taskDefinition!.taskRoleArn!;
      const roleName = taskRoleArn.split('/')[1];

      const iamClient = new IAMClient({ region: REGION });
      const roleResponse = await iamClient.send(
        new GetRoleCommand({
          RoleName: roleName,
        })
      );

      expect(roleResponse.Role).toBeDefined();
      expect(roleResponse.Role!.RoleName).toBe(roleName);
    });
  });

  describe('Infrastructure Outputs', () => {
    it('should export all required outputs', () => {
      expect(outputs).toHaveProperty('vpcId');
      expect(outputs).toHaveProperty('clusterName');
      expect(outputs).toHaveProperty('clusterArn');
      expect(outputs).toHaveProperty('albDnsName');
      expect(outputs).toHaveProperty('albUrl');
      expect(outputs).toHaveProperty('ecrRepositoryUrl');
      expect(outputs).toHaveProperty('logGroupName');
      expect(outputs).toHaveProperty('taskDefinitionArn');
      expect(outputs).toHaveProperty('serviceName');
    });

    it('should have valid output formats', () => {
      expect(outputs.vpcId).toMatch(/^vpc-[a-f0-9]+$/);
      expect(outputs.clusterArn).toMatch(
        /^arn:aws:ecs:[a-z0-9-]+:\d+:cluster\/.+$/
      );
      expect(outputs.albDnsName).toMatch(/\.elb\.amazonaws\.com$/);
      expect(outputs.albUrl).toMatch(/^http:\/\/.+\.elb\.amazonaws\.com$/);
      expect(outputs.ecrRepositoryUrl).toMatch(/^\d+\.dkr\.ecr\..+\.amazonaws\.com\/.+$/);
      expect(outputs.taskDefinitionArn).toMatch(
        /^arn:aws:ecs:[a-z0-9-]+:\d+:task-definition\/.+:\d+$/
      );
    });
  });
});
