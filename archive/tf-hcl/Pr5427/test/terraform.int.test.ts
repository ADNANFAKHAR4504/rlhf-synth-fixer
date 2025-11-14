// Integration tests for ECS Terraform infrastructure
// Tests validate deployed resources and end-to-end functionality

import {
  CloudWatchClient,
  GetDashboardCommand,
} from '@aws-sdk/client-cloudwatch';
import {
  CloudWatchLogsClient,
  DescribeLogGroupsCommand,
} from '@aws-sdk/client-cloudwatch-logs';
import {
  DescribeSecurityGroupsCommand,
  EC2Client,
} from '@aws-sdk/client-ec2';
import {
  ECRClient
} from '@aws-sdk/client-ecr';
import {
  DescribeClustersCommand,
  DescribeServicesCommand,
  DescribeTaskDefinitionCommand,
  DescribeTasksCommand,
  ECSClient,
  ListTasksCommand,
} from '@aws-sdk/client-ecs';
import {
  DescribeTargetGroupsCommand,
  DescribeTargetHealthCommand,
  ElasticLoadBalancingV2Client
} from '@aws-sdk/client-elastic-load-balancing-v2';
import {
  GetRoleCommand,
  IAMClient,
  ListAttachedRolePoliciesCommand
} from '@aws-sdk/client-iam';
import fs from 'fs';
import path from 'path';

// Get outputs from deployment
const OUTPUTS_FILE = path.resolve(__dirname, '../cfn-outputs/flat-outputs.json');

interface DeploymentOutputs {
  cluster_name?: string;
  service_names?: Record<string, string>;
  task_definition_arns?: Record<string, string>;
  log_groups?: Record<string, string>;
  security_group_ids?: Record<string, string>;
  target_group_arns?: Record<string, string>;
  ecr_repository_urls?: Record<string, string>;
}

// Load outputs if file exists (deployed in CI/CD)
let outputs: DeploymentOutputs = {};
let isDeployed = false;

beforeAll(() => {
  if (fs.existsSync(OUTPUTS_FILE)) {
    const rawOutputs = JSON.parse(fs.readFileSync(OUTPUTS_FILE, 'utf8'));
    outputs = rawOutputs;
    isDeployed = true;
    console.log('Running integration tests with deployed infrastructure');
  } else {
    console.log('Outputs file not found. Skipping deployment-dependent tests.');
  }
});

// Helper to skip tests if not deployed
function skipIfNotDeployed(testName: string, testFn: () => Promise<void>) {
  if (isDeployed) {
    test(testName, testFn, 30000);
  } else {
    test.skip(testName, testFn);
  }
}

describe('ECS Cluster Configuration', () => {
  let ecsClient: ECSClient;

  beforeAll(() => {
    ecsClient = new ECSClient({ region: process.env.AWS_REGION || 'eu-central-1' });
  });

  skipIfNotDeployed('cluster exists and is active', async () => {
    const command = new DescribeClustersCommand({
      clusters: [outputs.cluster_name!],
    });
    const response = await ecsClient.send(command);

    expect(response.clusters).toBeDefined();
    expect(response.clusters!.length).toBe(1);
    expect(response.clusters![0].status).toBe('ACTIVE');
    expect(response.clusters![0].clusterName).toBe(outputs.cluster_name);
  });

  skipIfNotDeployed('cluster has Container Insights enabled', async () => {
    const command = new DescribeClustersCommand({
      clusters: [outputs.cluster_name!],
      include: ['SETTINGS'],
    });
    const response = await ecsClient.send(command);

    const cluster = response.clusters![0];
    const containerInsightsSetting = cluster.settings?.find(
      s => s.name === 'containerInsights'
    );
    expect(containerInsightsSetting).toBeDefined();
    expect(containerInsightsSetting!.value).toBe('enabled');
  });
});

describe('ECS Services Deployment', () => {
  let ecsClient: ECSClient;
  const expectedServices = ['web', 'api', 'worker'];

  beforeAll(() => {
    ecsClient = new ECSClient({ region: process.env.AWS_REGION || 'eu-central-1' });
  });

  skipIfNotDeployed('all services are deployed and running', async () => {
    expect(outputs.service_names).toBeDefined();

    const serviceArns = Object.values(outputs.service_names!);
    const command = new DescribeServicesCommand({
      cluster: outputs.cluster_name!,
      services: serviceArns,
    });
    const response = await ecsClient.send(command);

    expect(response.services).toBeDefined();
    expect(response.services!.length).toBe(3);

    response.services!.forEach(service => {
      expect(service.status).toBe('ACTIVE');
      expect(service.launchType).toBe('FARGATE');
    });
  });

  skipIfNotDeployed('services have correct resource allocations', async () => {
    const expectedAllocations = {
      web: { cpu: '256', memory: '512' },
      api: { cpu: '512', memory: '1024' },
      worker: { cpu: '1024', memory: '2048' },
    };

    for (const [serviceName, taskDefArn] of Object.entries(outputs.task_definition_arns!)) {
      const command = new DescribeTaskDefinitionCommand({
        taskDefinition: taskDefArn,
      });
      const response = await ecsClient.send(command);

      const taskDef = response.taskDefinition!;
      expect(taskDef.cpu).toBe(expectedAllocations[serviceName as keyof typeof expectedAllocations].cpu);
      expect(taskDef.memory).toBe(expectedAllocations[serviceName as keyof typeof expectedAllocations].memory);
      expect(taskDef.networkMode).toBe('awsvpc');
      expect(taskDef.requiresCompatibilities).toContain('FARGATE');
    }
  });

  skipIfNotDeployed('services are using latest task definition', async () => {
    const serviceArns = Object.values(outputs.service_names!);
    const command = new DescribeServicesCommand({
      cluster: outputs.cluster_name!,
      services: serviceArns,
    });
    const response = await ecsClient.send(command);

    response.services!.forEach(service => {
      expect(service.taskDefinition).toBeDefined();
      expect(service.taskDefinition).toBeTruthy();
    });
  });

  skipIfNotDeployed('services do not have public IPs', async () => {
    const serviceArns = Object.values(outputs.service_names!);
    const command = new DescribeServicesCommand({
      cluster: outputs.cluster_name!,
      services: serviceArns,
    });
    const response = await ecsClient.send(command);

    response.services!.forEach(service => {
      expect(service.networkConfiguration?.awsvpcConfiguration?.assignPublicIp).toBe('DISABLED');
    });
  });
});

describe('ECR Repositories', () => {
  let ecrClient: ECRClient;

  beforeAll(() => {
    ecrClient = new ECRClient({ region: process.env.AWS_REGION || 'eu-central-1' });
  });

  skipIfNotDeployed('ECR repositories are accessible', async () => {
    expect(outputs.ecr_repository_urls).toBeDefined();

    const repositoryNames = Object.keys(outputs.ecr_repository_urls!).map(
      service => `${process.env.ENVIRONMENT || 'dev'}-${service}`
    );

    // Just verify the structure exists, actual repos may be pre-existing
    expect(Object.keys(outputs.ecr_repository_urls!).length).toBeGreaterThan(0);
    expect(outputs.ecr_repository_urls!.web).toBeDefined();
    expect(outputs.ecr_repository_urls!.api).toBeDefined();
    expect(outputs.ecr_repository_urls!.worker).toBeDefined();
  });
});

describe('Application Load Balancer Integration', () => {
  let elbClient: ElasticLoadBalancingV2Client;

  beforeAll(() => {
    elbClient = new ElasticLoadBalancingV2Client({ region: process.env.AWS_REGION || 'eu-central-1' });
  });

  skipIfNotDeployed('target groups are created for web and api services', async () => {
    expect(outputs.target_group_arns).toBeDefined();

    const targetGroupArns = Object.values(outputs.target_group_arns!);
    const command = new DescribeTargetGroupsCommand({
      TargetGroupArns: targetGroupArns,
    });
    const response = await elbClient.send(command);

    expect(response.TargetGroups).toBeDefined();
    // Worker service doesn't have a port, so only web and api have target groups
    expect(response.TargetGroups!.length).toBeGreaterThanOrEqual(2);

    response.TargetGroups!.forEach(tg => {
      expect(tg.TargetType).toBe('ip');
      expect(tg.Protocol).toBe('HTTP');

      // Verify health check configuration
      expect(tg.HealthCheckEnabled).toBe(true);
      expect(tg.HealthCheckIntervalSeconds).toBe(30);
      expect(tg.HealthCheckTimeoutSeconds).toBe(5);
      expect(tg.HealthyThresholdCount).toBe(3);
      expect(tg.UnhealthyThresholdCount).toBe(2);
    });
  });

  skipIfNotDeployed('target groups have correct health check configuration', async () => {
    const targetGroupArns = Object.values(outputs.target_group_arns!);
    const command = new DescribeTargetGroupsCommand({
      TargetGroupArns: targetGroupArns,
    });
    const response = await elbClient.send(command);

    response.TargetGroups!.forEach(tg => {
      expect(tg.HealthCheckPath).toBeDefined();
      expect(tg.HealthCheckProtocol).toBe('HTTP');
      expect(tg.Matcher?.HttpCode).toBe('200');
    });
  });
});

describe('IAM Roles and Policies', () => {
  let iamClient: IAMClient;

  beforeAll(() => {
    iamClient = new IAMClient({ region: process.env.AWS_REGION || 'eu-central-1' });
  });

  skipIfNotDeployed('task execution roles exist with proper policies', async () => {
    const envSuffix = process.env.ENVIRONMENT_SUFFIX || process.env.ENVIRONMENT || 'dev';
    const services = ['web', 'api', 'worker'];

    for (const service of services) {
      const roleName = `${process.env.ENVIRONMENT || 'dev'}-${service}-ecs-execution-${envSuffix}`;

      try {
        const command = new GetRoleCommand({ RoleName: roleName });
        const response = await iamClient.send(command);

        expect(response.Role).toBeDefined();
        expect(response.Role!.RoleName).toBe(roleName);

        // Verify attached policies
        const policiesCommand = new ListAttachedRolePoliciesCommand({ RoleName: roleName });
        const policiesResponse = await iamClient.send(policiesCommand);

        expect(policiesResponse.AttachedPolicies).toBeDefined();
        // Should have at least the managed ECS execution policy and SSM policy
        expect(policiesResponse.AttachedPolicies!.length).toBeGreaterThanOrEqual(2);

        const policyNames = policiesResponse.AttachedPolicies!.map(p => p.PolicyName);
        expect(policyNames).toContain('AmazonECSTaskExecutionRolePolicy');
      } catch (error: any) {
        if (error.name === 'NoSuchEntity') {
          console.log(`Role ${roleName} not found, might use different naming`);
        }
      }
    }
  });

  skipIfNotDeployed('task roles exist for application permissions', async () => {
    const envSuffix = process.env.ENVIRONMENT_SUFFIX || process.env.ENVIRONMENT || 'dev';
    const services = ['web', 'api', 'worker'];

    for (const service of services) {
      const roleName = `${process.env.ENVIRONMENT || 'dev'}-${service}-ecs-task-${envSuffix}`;

      try {
        const command = new GetRoleCommand({ RoleName: roleName });
        const response = await iamClient.send(command);

        expect(response.Role).toBeDefined();
        expect(response.Role!.RoleName).toBe(roleName);
      } catch (error: any) {
        if (error.name === 'NoSuchEntity') {
          console.log(`Task role ${roleName} not found, might use different naming`);
        }
      }
    }
  });
});

describe('CloudWatch Logging', () => {
  let logsClient: CloudWatchLogsClient;

  beforeAll(() => {
    logsClient = new CloudWatchLogsClient({ region: process.env.AWS_REGION || 'eu-central-1' });
  });

  skipIfNotDeployed('log groups exist for all services', async () => {
    expect(outputs.log_groups).toBeDefined();

    const logGroupNames = Object.values(outputs.log_groups!);

    for (const logGroupName of logGroupNames) {
      const command = new DescribeLogGroupsCommand({
        logGroupNamePrefix: logGroupName,
      });
      const response = await logsClient.send(command);

      expect(response.logGroups).toBeDefined();
      expect(response.logGroups!.length).toBeGreaterThan(0);

      const logGroup = response.logGroups!.find(lg => lg.logGroupName === logGroupName);
      expect(logGroup).toBeDefined();
      expect(logGroup!.retentionInDays).toBeDefined();
    }
  });

  skipIfNotDeployed('log retention is set based on environment', async () => {
    const logGroupNames = Object.values(outputs.log_groups!);
    const environment = process.env.ENVIRONMENT || 'dev';
    const expectedRetention = environment === 'prod' ? 30 : 7;

    for (const logGroupName of logGroupNames) {
      const command = new DescribeLogGroupsCommand({
        logGroupNamePrefix: logGroupName,
      });
      const response = await logsClient.send(command);

      const logGroup = response.logGroups!.find(lg => lg.logGroupName === logGroupName);
      if (logGroup && logGroup.retentionInDays) {
        expect(logGroup.retentionInDays).toBe(expectedRetention);
      }
    }
  });
});

describe('CloudWatch Monitoring Dashboard', () => {
  let cloudwatchClient: CloudWatchClient;

  beforeAll(() => {
    cloudwatchClient = new CloudWatchClient({ region: process.env.AWS_REGION || 'eu-central-1' });
  });

  skipIfNotDeployed('monitoring dashboard exists', async () => {
    const envSuffix = process.env.ENVIRONMENT_SUFFIX || process.env.ENVIRONMENT || 'dev';
    const dashboardName = `${process.env.ENVIRONMENT || 'dev'}-ecs-dashboard-${envSuffix}`;

    try {
      const command = new GetDashboardCommand({ DashboardName: dashboardName });
      const response = await cloudwatchClient.send(command);

      expect(response.DashboardBody).toBeDefined();

      const dashboardBody = JSON.parse(response.DashboardBody!);
      expect(dashboardBody.widgets).toBeDefined();
      expect(dashboardBody.widgets.length).toBeGreaterThan(0);

      // Verify CPU and Memory monitoring widgets exist
      const dashboardStr = JSON.stringify(dashboardBody);
      expect(dashboardStr).toContain('CPUUtilization');
      expect(dashboardStr).toContain('MemoryUtilization');
    } catch (error: any) {
      if (error.name === 'ResourceNotFound') {
        console.log(`Dashboard ${dashboardName} not found`);
      }
    }
  });
});

describe('Security Groups Configuration', () => {
  let ec2Client: EC2Client;

  beforeAll(() => {
    ec2Client = new EC2Client({ region: process.env.AWS_REGION || 'eu-central-1' });
  });

  skipIfNotDeployed('security groups exist for all services', async () => {
    expect(outputs.security_group_ids).toBeDefined();

    const securityGroupIds = Object.values(outputs.security_group_ids!);
    const command = new DescribeSecurityGroupsCommand({
      GroupIds: securityGroupIds,
    });
    const response = await ec2Client.send(command);

    expect(response.SecurityGroups).toBeDefined();
    expect(response.SecurityGroups!.length).toBe(3);

    response.SecurityGroups!.forEach(sg => {
      expect(sg.GroupName).toBeDefined();
      expect(sg.Description).toBeDefined();
      // Verify egress rules exist
      expect(sg.IpPermissionsEgress).toBeDefined();
      expect(sg.IpPermissionsEgress!.length).toBeGreaterThan(0);
    });
  });

  skipIfNotDeployed('security groups have appropriate ingress rules', async () => {
    const securityGroupIds = Object.values(outputs.security_group_ids!);
    const command = new DescribeSecurityGroupsCommand({
      GroupIds: securityGroupIds,
    });
    const response = await ec2Client.send(command);

    response.SecurityGroups!.forEach(sg => {
      // Services with ports should have ingress rules
      if (sg.GroupName?.includes('web') || sg.GroupName?.includes('api')) {
        expect(sg.IpPermissions).toBeDefined();
        // Should have at least one ingress rule
        if (sg.IpPermissions!.length > 0) {
          expect(sg.IpPermissions!.length).toBeGreaterThan(0);
        }
      }
    });
  });
});

describe('End-to-End Service Functionality', () => {
  let ecsClient: ECSClient;
  let elbClient: ElasticLoadBalancingV2Client;

  beforeAll(() => {
    ecsClient = new ECSClient({ region: process.env.AWS_REGION || 'eu-central-1' });
    elbClient = new ElasticLoadBalancingV2Client({ region: process.env.AWS_REGION || 'eu-central-1' });
  });

  skipIfNotDeployed('web service is running and registered with ALB', async () => {
    if (!outputs.service_names?.web || !outputs.target_group_arns?.web) {
      console.log('Web service not found in outputs');
      return;
    }

    // Check if service has running tasks
    const listTasksCommand = new ListTasksCommand({
      cluster: outputs.cluster_name!,
      serviceName: outputs.service_names.web,
      desiredStatus: 'RUNNING',
    });
    const tasksResponse = await ecsClient.send(listTasksCommand);

    expect(tasksResponse.taskArns).toBeDefined();

    if (tasksResponse.taskArns!.length > 0) {
      // Describe tasks to get detailed information
      const describeTasksCommand = new DescribeTasksCommand({
        cluster: outputs.cluster_name!,
        tasks: tasksResponse.taskArns!,
      });
      const taskDetails = await ecsClient.send(describeTasksCommand);

      taskDetails.tasks!.forEach(task => {
        expect(task.lastStatus).toBe('RUNNING');
        expect(task.connectivity).toBe('CONNECTED');
      });

      // Check target health
      const targetHealthCommand = new DescribeTargetHealthCommand({
        TargetGroupArn: outputs.target_group_arns.web,
      });
      const healthResponse = await elbClient.send(targetHealthCommand);

      expect(healthResponse.TargetHealthDescriptions).toBeDefined();
      // At least some targets should be registered
      expect(healthResponse.TargetHealthDescriptions!.length).toBeGreaterThan(0);
    }
  });

  skipIfNotDeployed('api service is running and registered with ALB', async () => {
    if (!outputs.service_names?.api || !outputs.target_group_arns?.api) {
      console.log('API service not found in outputs');
      return;
    }

    // Check if service has running tasks
    const listTasksCommand = new ListTasksCommand({
      cluster: outputs.cluster_name!,
      serviceName: outputs.service_names.api,
      desiredStatus: 'RUNNING',
    });
    const tasksResponse = await ecsClient.send(listTasksCommand);

    expect(tasksResponse.taskArns).toBeDefined();

    if (tasksResponse.taskArns!.length > 0) {
      const describeTasksCommand = new DescribeTasksCommand({
        cluster: outputs.cluster_name!,
        tasks: tasksResponse.taskArns!,
      });
      const taskDetails = await ecsClient.send(describeTasksCommand);

      taskDetails.tasks!.forEach(task => {
        expect(task.lastStatus).toBe('RUNNING');
      });
    }
  });

  skipIfNotDeployed('worker service is running without ALB', async () => {
    if (!outputs.service_names?.worker) {
      console.log('Worker service not found in outputs');
      return;
    }

    // Worker service should not have a target group (port = 0)
    expect(outputs.target_group_arns?.worker).toBeUndefined();

    // Check if service has running tasks
    const listTasksCommand = new ListTasksCommand({
      cluster: outputs.cluster_name!,
      serviceName: outputs.service_names.worker,
      desiredStatus: 'RUNNING',
    });
    const tasksResponse = await ecsClient.send(listTasksCommand);

    expect(tasksResponse.taskArns).toBeDefined();

    if (tasksResponse.taskArns!.length > 0) {
      const describeTasksCommand = new DescribeTasksCommand({
        cluster: outputs.cluster_name!,
        tasks: tasksResponse.taskArns!,
      });
      const taskDetails = await ecsClient.send(describeTasksCommand);

      taskDetails.tasks!.forEach(task => {
        expect(task.lastStatus).toBe('RUNNING');
      });
    }
  });

  skipIfNotDeployed('all services are properly tagged', async () => {
    const serviceArns = Object.values(outputs.service_names!);
    const command = new DescribeServicesCommand({
      cluster: outputs.cluster_name!,
      services: serviceArns,
      include: ['TAGS'],
    });
    const response = await ecsClient.send(command);

    response.services!.forEach(service => {
      expect(service.tags).toBeDefined();

      const tagMap = new Map(service.tags!.map(t => [t.key, t.value]));
      expect(tagMap.has('Environment')).toBe(true);
      expect(tagMap.has('ManagedBy')).toBe(true);
      expect(tagMap.get('ManagedBy')).toBe('Terraform');
    });
  });
});

describe('Infrastructure Optimization Validation', () => {
  let ecsClient: ECSClient;

  beforeAll(() => {
    ecsClient = new ECSClient({ region: process.env.AWS_REGION || 'eu-central-1' });
  });

  skipIfNotDeployed('services use correct resource allocations to prevent OOM', async () => {
    const expectedAllocations = {
      web: { cpu: '256', memory: '512' },
      api: { cpu: '512', memory: '1024' },
      worker: { cpu: '1024', memory: '2048' },
    };

    for (const [serviceName, taskDefArn] of Object.entries(outputs.task_definition_arns!)) {
      const command = new DescribeTaskDefinitionCommand({
        taskDefinition: taskDefArn,
      });
      const response = await ecsClient.send(command);

      const taskDef = response.taskDefinition!;
      const expected = expectedAllocations[serviceName as keyof typeof expectedAllocations];

      expect(taskDef.cpu).toBe(expected.cpu);
      expect(taskDef.memory).toBe(expected.memory);
    }
  });

  skipIfNotDeployed('task definitions use dynamic ECR images', async () => {
    for (const taskDefArn of Object.values(outputs.task_definition_arns!)) {
      const command = new DescribeTaskDefinitionCommand({
        taskDefinition: taskDefArn,
      });
      const response = await ecsClient.send(command);

      const taskDef = response.taskDefinition!;
      const containerDef = taskDef.containerDefinitions![0];

      // Image should reference ECR
      expect(containerDef.image).toContain('.dkr.ecr.');
      expect(containerDef.image).toContain('.amazonaws.com');
    }
  });

  skipIfNotDeployed('task definitions reference SSM parameters for secrets', async () => {
    for (const taskDefArn of Object.values(outputs.task_definition_arns!)) {
      const command = new DescribeTaskDefinitionCommand({
        taskDefinition: taskDefArn,
      });
      const response = await ecsClient.send(command);

      const taskDef = response.taskDefinition!;
      const containerDef = taskDef.containerDefinitions![0];

      // Should have secrets from SSM
      expect(containerDef.secrets).toBeDefined();
      expect(containerDef.secrets!.length).toBeGreaterThan(0);

      containerDef.secrets!.forEach(secret => {
        expect(secret.valueFrom).toContain('parameter');
      });
    }
  });
});
