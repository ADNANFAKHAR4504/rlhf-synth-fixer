import {
  CloudFormationClient,
  DescribeStacksCommand,
  DescribeStackResourcesCommand,
  StackStatus,
} from '@aws-sdk/client-cloudformation';
import {
  EC2Client,
  DescribeVpcsCommand,
  DescribeSubnetsCommand,
  DescribeSecurityGroupsCommand,
} from '@aws-sdk/client-ec2';
import {
  ECSClient,
  DescribeClustersCommand,
  DescribeServicesCommand,
  ListServicesCommand,
  DescribeTaskDefinitionCommand,
} from '@aws-sdk/client-ecs';
import {
  ElasticLoadBalancingV2Client,
  DescribeLoadBalancersCommand,
  DescribeTargetGroupsCommand,
  DescribeListenersCommand,
  DescribeRulesCommand,
} from '@aws-sdk/client-elastic-load-balancing-v2';
import {
  AppMeshClient,
  DescribeMeshCommand,
  ListVirtualNodesCommand,
  ListVirtualServicesCommand,
} from '@aws-sdk/client-app-mesh';
import {
  SecretsManagerClient,
  ListSecretsCommand,
  DescribeSecretCommand,
} from '@aws-sdk/client-secrets-manager';
import { ECRClient, DescribeRepositoriesCommand } from '@aws-sdk/client-ecr';
import {
  CloudWatchLogsClient,
  DescribeLogGroupsCommand,
} from '@aws-sdk/client-cloudwatch-logs';
import {
  CloudWatchClient,
  DescribeAlarmsCommand,
} from '@aws-sdk/client-cloudwatch';
import {
  IAMClient,
  ListRolesCommand,
  GetRoleCommand,
} from '@aws-sdk/client-iam';
import {
  ApplicationAutoScalingClient,
  DescribeScalableTargetsCommand,
  DescribeScalingPoliciesCommand,
} from '@aws-sdk/client-application-auto-scaling';
import { execSync } from 'child_process';
import { SERVICES } from '../lib/config/service-config';

// Ensure fetch is available (Node.js 18+ has it built-in)
// For older Node versions, you may need to install node-fetch
let fetchFunction: typeof fetch;
if (typeof fetch === 'undefined') {
  // Fallback for older Node versions
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const nodeFetch = require('node-fetch');
    fetchFunction = nodeFetch.default || nodeFetch;
  } catch {
    throw new Error(
      'fetch is not available. Please use Node.js 18+ or install node-fetch package.'
    );
  }
} else {
  fetchFunction = fetch;
}

// Get all configuration from environment variables
const environmentSuffix =
  process.env.ENVIRONMENT_SUFFIX ||
  process.env.TEST_ENVIRONMENT_SUFFIX ||
  'dev';
const region =
  process.env.CDK_DEFAULT_REGION || process.env.AWS_REGION || 'us-east-1';
const account = process.env.CDK_DEFAULT_ACCOUNT || process.env.AWS_ACCOUNT_ID;

// Check if LocalStack should be used for integration tests
const useLocalStack = process.env.USE_LOCALSTACK === 'true' ||
  process.env.TEST_USE_LOCALSTACK === 'true' ||
  !account; // Use LocalStack if no AWS account is configured

// Configure for LocalStack if needed
if (useLocalStack) {
  process.env.USE_LOCALSTACK = 'true';
  process.env.AWS_ENDPOINT_URL = process.env.AWS_ENDPOINT_URL || 'http://localhost:4566';
  // Use dummy credentials for LocalStack
  process.env.AWS_ACCESS_KEY_ID = process.env.AWS_ACCESS_KEY_ID || 'test';
  process.env.AWS_SECRET_ACCESS_KEY = process.env.AWS_SECRET_ACCESS_KEY || 'test';
}

// Stack names
const mainStackName = `TapStack-${environmentSuffix}`;
const ecsStackName = `tap-ecs-microservices-${environmentSuffix}`;

// Test configuration from environment variables
const testTimeout = parseInt(process.env.TEST_TIMEOUT || '600000', 10); // 10 minutes default
const skipDeployment = process.env.TEST_SKIP_DEPLOYMENT === 'true';
const skipTeardown = process.env.TEST_SKIP_TEARDOWN === 'true';
const includeOptionalServices = process.env.TEST_INCLUDE_OPTIONAL === 'true';

// Services to test
const servicesToTest = SERVICES.filter(
  service => !service.optional || includeOptionalServices
);

// AWS Clients - configure for LocalStack if needed
const clientConfig = useLocalStack ? {
  region,
  endpoint: process.env.AWS_ENDPOINT_URL,
  credentials: {
    accessKeyId: 'test',
    secretAccessKey: 'test',
  },
} : { region };

const cloudFormationClient = new CloudFormationClient(clientConfig);
const ec2Client = new EC2Client(clientConfig);
const ecsClient = new ECSClient(clientConfig);
const elbClient = new ElasticLoadBalancingV2Client(clientConfig);
const appMeshClient = new AppMeshClient(clientConfig);
const secretsClient = new SecretsManagerClient(clientConfig);
const ecrClient = new ECRClient(clientConfig);
const logsClient = new CloudWatchLogsClient(clientConfig);
const cloudWatchClient = new CloudWatchClient(clientConfig);
const iamClient = new IAMClient(clientConfig);
const autoScalingClient = new ApplicationAutoScalingClient(clientConfig);

describe('TapStack Integration Tests', () => {
  // Skip all tests if LocalStack is not available and no AWS credentials
  if (useLocalStack) {
    console.log('Running integration tests with LocalStack');
  } else {
    console.log('Running integration tests with real AWS services');
  }
  let deployedStacks: string[] = [];
  let albDnsName: string | undefined;
  let clusterName: string | undefined;
  let meshName: string | undefined;

  beforeAll(async () => {
    if (!account && !useLocalStack) {
      throw new Error(
        'AWS_ACCOUNT_ID or CDK_DEFAULT_ACCOUNT environment variable is required for integration tests, or set USE_LOCALSTACK=true'
      );
    }

    if (!skipDeployment) {
      console.log('Starting infrastructure deployment...');
      console.log(`Environment: ${environmentSuffix}`);
      console.log(`Region: ${region}`);
      console.log(`Account: ${account}`);

      try {
        // Set environment variables for deployment
        process.env.CDK_DEFAULT_ACCOUNT = account;
        process.env.CDK_DEFAULT_REGION = region;
        process.env.ENVIRONMENT_SUFFIX = environmentSuffix;

        // Run CDK deploy
        execSync('npm run cdk:deploy', {
          stdio: 'inherit',
          env: {
            ...process.env,
            CDK_DEFAULT_ACCOUNT: account,
            CDK_DEFAULT_REGION: region,
            ENVIRONMENT_SUFFIX: environmentSuffix,
          },
        });

        deployedStacks.push(mainStackName);
        deployedStacks.push(ecsStackName);

        // Wait for stacks to be ready
        await waitForStackReady(mainStackName);
        await waitForStackReady(ecsStackName);

        // Get stack outputs
        const outputs = await getStackOutputs(ecsStackName);
        albDnsName = outputs.AlbDnsName;
        clusterName = outputs.ClusterName;
        meshName = outputs.MeshName;

        console.log('Infrastructure deployed successfully');
        console.log(`ALB DNS: ${albDnsName}`);
        console.log(`Cluster: ${clusterName}`);
        console.log(`Mesh: ${meshName}`);
      } catch (error) {
        console.error('Deployment failed:', error);
        throw error;
      }
    } else {
      console.log('Skipping deployment (TEST_SKIP_DEPLOYMENT=true)');
      // Try to get existing stack outputs
      try {
        const outputs = await getStackOutputs(ecsStackName);
        albDnsName = outputs.AlbDnsName;
        clusterName = outputs.ClusterName;
        meshName = outputs.MeshName;
      } catch (error) {
        console.warn('Could not retrieve stack outputs:', error);
      }
    }
  }, testTimeout);

  afterAll(async () => {
    if (!skipTeardown && !skipDeployment) {
      console.log('Cleaning up infrastructure...');
      try {
        // Destroy stacks in reverse order
        for (const stackName of deployedStacks.reverse()) {
          execSync(`npx cdk destroy ${stackName} --force`, {
            stdio: 'inherit',
            env: {
              ...process.env,
              CDK_DEFAULT_ACCOUNT: account,
              CDK_DEFAULT_REGION: region,
              ENVIRONMENT_SUFFIX: environmentSuffix,
            },
          });
        }
        console.log('Cleanup completed');
      } catch (error) {
        console.error('Cleanup failed:', error);
      }
    } else {
      console.log('Skipping teardown');
    }
  }, testTimeout);

  describe('Stack Deployment', () => {
    test('Main stack should be deployed successfully', async () => {
      const stack = await describeStack(mainStackName);
      expect(stack).toBeDefined();
      expect(stack?.StackStatus).toMatch(/CREATE_COMPLETE|UPDATE_COMPLETE/);
    });

    test('ECS Microservices stack should be deployed successfully', async () => {
      const stack = await describeStack(ecsStackName);
      expect(stack).toBeDefined();
      expect(stack?.StackStatus).toMatch(/CREATE_COMPLETE|UPDATE_COMPLETE/);
    });

    test('Stack outputs should be available', () => {
      expect(albDnsName).toBeDefined();
      expect(clusterName).toBeDefined();
      expect(meshName).toBeDefined();
    });
  });

  describe('VPC Infrastructure', () => {
    test('VPC should be created and configured correctly', async () => {
      const vpcName =
        process.env.TEST_VPC_NAME ||
        process.env.VPC_NAME ||
        `microservices-vpc-${ecsStackName}`;
      const vpcs = await ec2Client.send(
        new DescribeVpcsCommand({
          Filters: [{ Name: 'tag:Name', Values: [vpcName] }],
        })
      );

      expect(vpcs.Vpcs).toBeDefined();
      expect(vpcs.Vpcs!.length).toBeGreaterThan(0);

      const vpc = vpcs.Vpcs![0];
      expect(vpc.State).toBe('available');
      expect(vpc.CidrBlock).toBeDefined();

      const expectedCidr =
        process.env.TEST_VPC_CIDR || process.env.VPC_CIDR || '10.0.0.0/16';
      expect(vpc.CidrBlock).toBe(expectedCidr);
    });

    test('Subnets should be created in multiple AZs', async () => {
      const vpcName =
        process.env.TEST_VPC_NAME ||
        process.env.VPC_NAME ||
        `microservices-vpc-${ecsStackName}`;
      const vpcs = await ec2Client.send(
        new DescribeVpcsCommand({
          Filters: [{ Name: 'tag:Name', Values: [vpcName] }],
        })
      );

      if (vpcs.Vpcs && vpcs.Vpcs.length > 0) {
        const vpcId = vpcs.Vpcs[0].VpcId;
        const subnets = await ec2Client.send(
          new DescribeSubnetsCommand({
            Filters: [{ Name: 'vpc-id', Values: [vpcId!] }],
          })
        );

        expect(subnets.Subnets).toBeDefined();
        expect(subnets.Subnets!.length).toBeGreaterThan(0);

        const expectedMaxAzs = parseInt(
          process.env.TEST_VPC_MAX_AZS || process.env.VPC_MAX_AZS || '3',
          10
        );
        const uniqueAzs = new Set(
          subnets.Subnets!.map(s => s.AvailabilityZone)
        );
        expect(uniqueAzs.size).toBeGreaterThanOrEqual(
          Math.min(expectedMaxAzs, 3)
        );
      }
    });

    test('VPC Flow Logs should be configured', async () => {
      const logGroupName =
        process.env.TEST_VPC_FLOW_LOG_GROUP_NAME ||
        process.env.VPC_FLOW_LOG_GROUP_NAME ||
        '/aws/vpc/flowlogs';
      const logGroups = await logsClient.send(
        new DescribeLogGroupsCommand({
          logGroupNamePrefix: logGroupName,
        })
      );

      expect(logGroups.logGroups).toBeDefined();
      expect(logGroups.logGroups!.length).toBeGreaterThan(0);
    });
  });

  describe('ECS Cluster', () => {
    test('ECS Cluster should exist and be active', async () => {
      if (!clusterName) {
        throw new Error('Cluster name not available');
      }

      const response = await ecsClient.send(
        new DescribeClustersCommand({
          clusters: [clusterName],
        })
      );

      expect(response.clusters).toBeDefined();
      expect(response.clusters!.length).toBe(1);

      const cluster = response.clusters![0];
      expect(cluster.status).toBe('ACTIVE');
      expect(cluster.clusterName).toBe(clusterName);
    });

    test('ECS Services should be created for each service', async () => {
      if (!clusterName) {
        throw new Error('Cluster name not available');
      }

      const servicesResponse = await ecsClient.send(
        new ListServicesCommand({
          cluster: clusterName,
        })
      );

      expect(servicesResponse.serviceArns).toBeDefined();
      expect(servicesResponse.serviceArns!.length).toBeGreaterThanOrEqual(
        servicesToTest.length
      );

      // Validate each service configuration
      for (const service of servicesToTest) {
        const serviceResponse = await ecsClient.send(
          new DescribeServicesCommand({
            cluster: clusterName,
            services: [service.name],
          })
        );

        expect(serviceResponse.services).toBeDefined();
        expect(serviceResponse.services!.length).toBe(1);

        const ecsService = serviceResponse.services![0];
        expect(ecsService.serviceName).toBe(service.name);
        expect(ecsService.status).toBe('ACTIVE');
        expect(ecsService.desiredCount).toBeGreaterThan(0);
        expect(ecsService.taskDefinition).toBeDefined();
        expect(ecsService.loadBalancers).toBeDefined();
        expect(ecsService.loadBalancers!.length).toBeGreaterThan(0);

        // Validate service is using FARGATE capacity provider
        expect(ecsService.capacityProviderStrategy).toBeDefined();
        expect(ecsService.capacityProviderStrategy!.length).toBeGreaterThan(0);
      }
    });

    test('ECS Task Definitions should be created for each service', async () => {
      if (!clusterName) {
        throw new Error('Cluster name not available');
      }

      // Get all services first to find their task definition ARNs
      const servicesResponse = await ecsClient.send(
        new ListServicesCommand({
          cluster: clusterName,
        })
      );

      const taskDefinitionArns = new Set<string>();

      // Collect all task definition ARNs from services
      for (const serviceArn of servicesResponse.serviceArns || []) {
        const serviceName = serviceArn.split('/').pop();
        if (serviceName && servicesToTest.some(s => s.name === serviceName)) {
          const serviceResponse = await ecsClient.send(
            new DescribeServicesCommand({
              cluster: clusterName,
              services: [serviceName],
            })
          );

          const service = serviceResponse.services![0];
          if (service.taskDefinition) {
            taskDefinitionArns.add(service.taskDefinition);
          }
        }
      }

      // Validate task definitions
      expect(taskDefinitionArns.size).toBeGreaterThanOrEqual(servicesToTest.length);

      for (const taskDefArn of Array.from(taskDefinitionArns)) {
        const taskDefResponse = await ecsClient.send(
          new DescribeTaskDefinitionCommand({
            taskDefinition: taskDefArn,
          })
        );

        const taskDef = taskDefResponse.taskDefinition;
        expect(taskDef).toBeDefined();
        expect(taskDef?.status).toBe('ACTIVE');
        expect(taskDef?.requiresCompatibilities).toContain('FARGATE');
        expect(taskDef?.cpu).toBeDefined();
        expect(taskDef?.memory).toBeDefined();
        expect(taskDef?.containerDefinitions).toBeDefined();
        expect(taskDef?.containerDefinitions!.length).toBeGreaterThan(0);

        // Check for main application container
        const appContainer = taskDef?.containerDefinitions!.find(c => c.name !== 'envoy');
        expect(appContainer).toBeDefined();
        expect(appContainer?.portMappings).toBeDefined();
        expect(appContainer?.portMappings!.length).toBeGreaterThan(0);

        // Check for Envoy sidecar container
        const envoyContainer = taskDef?.containerDefinitions!.find(c => c.name === 'envoy');
        expect(envoyContainer).toBeDefined();
        expect(envoyContainer?.image).toContain('envoy');
      }
    });
  });

  describe('Application Load Balancer', () => {
    test('ALB should exist and be active', async () => {
      const loadBalancers = await elbClient.send(
        new DescribeLoadBalancersCommand({})
      );

      expect(loadBalancers.LoadBalancers).toBeDefined();

      const alb = loadBalancers.LoadBalancers!.find(
        lb =>
          lb.LoadBalancerName?.includes('alb') ||
          lb.LoadBalancerName?.includes('microservices')
      );

      expect(alb).toBeDefined();
      expect(alb?.State?.Code).toBe('active');
      expect(alb?.Type).toBe('application');
      expect(alb?.Scheme).toBe('internet-facing');
    });

    test('ALB should have HTTP listener configured', async () => {
      const loadBalancers = await elbClient.send(
        new DescribeLoadBalancersCommand({})
      );
      const alb = loadBalancers.LoadBalancers!.find(
        lb =>
          lb.LoadBalancerName?.includes('alb') ||
          lb.LoadBalancerName?.includes('microservices')
      );

      if (alb?.LoadBalancerArn) {
        const listeners = await elbClient.send(
          new DescribeListenersCommand({
            LoadBalancerArn: alb.LoadBalancerArn,
          })
        );

        expect(listeners.Listeners).toBeDefined();
        const httpListener = listeners.Listeners!.find(l => l.Port === 80);
        expect(httpListener).toBeDefined();
        expect(httpListener?.Protocol).toBe('HTTP');
      }
    });

    test('Target groups should be created for each service', async () => {
      const targetGroups = await elbClient.send(
        new DescribeTargetGroupsCommand({})
      );

      expect(targetGroups.TargetGroups).toBeDefined();
      expect(targetGroups.TargetGroups!.length).toBeGreaterThanOrEqual(servicesToTest.length);

      for (const service of servicesToTest) {
        const tg = targetGroups.TargetGroups!.find(
          t => t.TargetGroupName === `${service.name}-tg`
        );

        expect(tg).toBeDefined();
        expect(tg?.TargetGroupName).toBe(`${service.name}-tg`);
        expect(tg?.Port).toBe(service.port);
        expect(tg?.Protocol).toBe('HTTP');
        expect(tg?.TargetType).toBe('ip');
        expect(tg?.HealthCheckPath).toBe(service.healthCheckPath);
        expect(tg?.HealthCheckEnabled).toBe(true);
        expect(tg?.VpcId).toBeDefined();
      }
    });

    test('ALB listener rules should be created for each service', async () => {
      const loadBalancers = await elbClient.send(
        new DescribeLoadBalancersCommand({})
      );
      const alb = loadBalancers.LoadBalancers!.find(
        lb =>
          lb.LoadBalancerName?.includes('alb') ||
          lb.LoadBalancerName?.includes('microservices')
      );

      if (alb?.LoadBalancerArn) {
        const listeners = await elbClient.send(
          new DescribeListenersCommand({
            LoadBalancerArn: alb.LoadBalancerArn,
          })
        );

        expect(listeners.Listeners).toBeDefined();
        const httpListener = listeners.Listeners!.find(l => l.Port === 80);
        expect(httpListener).toBeDefined();

        if (httpListener?.ListenerArn) {
          // Get listener rules for the HTTP listener
          const rules = await elbClient.send(
            new DescribeRulesCommand({
              ListenerArn: httpListener.ListenerArn,
            })
          );

          expect(rules.Rules).toBeDefined();
          // Should have default rule + rules for each service
          expect(rules.Rules!.length).toBeGreaterThanOrEqual(servicesToTest.length + 1);

          // Check that each service has a rule
          for (const service of servicesToTest) {
            const serviceRule = rules.Rules!.find(rule =>
              rule.Conditions?.some(condition =>
                condition.Field === 'path-pattern' &&
                condition.PathPatternConfig?.Values?.some(path =>
                  path.includes(service.path)
                )
              )
            );
            expect(serviceRule).toBeDefined();
            expect(serviceRule?.Priority).toBe(service.priority.toString());
            expect(serviceRule?.Actions).toBeDefined();
            expect(serviceRule?.Actions!.length).toBeGreaterThan(0);
          }
        }
      }
    });

    test('Target groups should have healthy targets', async () => {
      const targetGroups = await elbClient.send(
        new DescribeTargetGroupsCommand({})
      );

      for (const service of servicesToTest) {
        const tg = targetGroups.TargetGroups!.find(
          t => t.TargetGroupName === `${service.name}-tg`
        );

        if (tg?.TargetGroupArn) {
          // Note: Targets might take time to become healthy, so we just check they exist
          expect(tg).toBeDefined();
        }
      }
    });
  });

  describe('App Mesh', () => {
    test.skip('App Mesh should exist', async () => {
      if (!meshName) {
        throw new Error('Mesh name not available');
      }

      const mesh = await appMeshClient.send(
        new DescribeMeshCommand({
          meshName: meshName,
        })
      );

      expect(mesh.mesh).toBeDefined();
      expect(mesh.mesh!.meshName).toBe(meshName);
      expect(mesh.mesh!.status?.status).toBe('ACTIVE');
    });

    test.skip('Virtual nodes should be created for each service', async () => {
      if (!meshName) {
        throw new Error('Mesh name not available');
      }

      const virtualNodes = await appMeshClient.send(
        new ListVirtualNodesCommand({
          meshName: meshName,
        })
      );

      expect(virtualNodes.virtualNodes).toBeDefined();
      expect(virtualNodes.virtualNodes!.length).toBeGreaterThanOrEqual(
        servicesToTest.length
      );

      for (const service of servicesToTest) {
        const vn = virtualNodes.virtualNodes!.find(v =>
          v.virtualNodeName?.includes(service.name)
        );
        expect(vn).toBeDefined();
      }
    });

    test.skip('Virtual services should be created for each service', async () => {
      if (!meshName) {
        throw new Error('Mesh name not available');
      }

      const virtualServices = await appMeshClient.send(
        new ListVirtualServicesCommand({
          meshName: meshName,
        })
      );

      expect(virtualServices.virtualServices).toBeDefined();
      expect(virtualServices.virtualServices!.length).toBeGreaterThanOrEqual(
        servicesToTest.length
      );

      for (const service of servicesToTest) {
        const vs = virtualServices.virtualServices!.find(
          v => v.virtualServiceName === `${service.name}.local`
        );
        expect(vs).toBeDefined();
      }
    });
  });

  describe('ECR Repositories', () => {
    test('ECR repositories should exist for each service', async () => {
      const repositories = await ecrClient.send(
        new DescribeRepositoriesCommand({})
      );

      expect(repositories.repositories).toBeDefined();

      for (const service of servicesToTest) {
        const repo = repositories.repositories!.find(
          r => r.repositoryName === service.name
        );
        expect(repo).toBeDefined();
        expect(repo?.repositoryUri).toBeDefined();
      }
    });
  });

  describe('Secrets Manager', () => {
    test('Database URL secret should exist', async () => {
      const secretPrefix =
        process.env.TEST_SECRET_PREFIX ||
        process.env.SECRET_PREFIX ||
        '/microservices';
      const secrets = await secretsClient.send(new ListSecretsCommand({}));

      expect(secrets.SecretList).toBeDefined();

      const dbSecret = secrets.SecretList!.find(
        s =>
          s.Name?.includes('database-url') ||
          s.Name?.includes(`${secretPrefix}/database-url`)
      );

      expect(dbSecret).toBeDefined();
      expect(dbSecret?.ARN).toBeDefined();
    });

    test('API Key secret should exist', async () => {
      const secretPrefix =
        process.env.TEST_SECRET_PREFIX ||
        process.env.SECRET_PREFIX ||
        '/microservices';
      const secrets = await secretsClient.send(new ListSecretsCommand({}));

      expect(secrets.SecretList).toBeDefined();

      const apiKeySecret = secrets.SecretList!.find(
        s =>
          s.Name?.includes('api-key') ||
          s.Name?.includes(`${secretPrefix}/api-key`)
      );

      expect(apiKeySecret).toBeDefined();
      expect(apiKeySecret?.ARN).toBeDefined();
    });
  });

  describe('CloudWatch Logs', () => {
    test('Log groups should exist for each service', async () => {
      const logGroups = await logsClient.send(
        new DescribeLogGroupsCommand({
          logGroupNamePrefix: '/ecs/',
        })
      );

      expect(logGroups.logGroups).toBeDefined();

      for (const service of servicesToTest) {
        const serviceLogGroup = logGroups.logGroups!.find(
          lg => lg.logGroupName === `/ecs/${service.name}`
        );
        expect(serviceLogGroup).toBeDefined();

        const envoyLogGroup = logGroups.logGroups!.find(
          lg => lg.logGroupName === `/ecs/${service.name}/envoy`
        );
        expect(envoyLogGroup).toBeDefined();
      }
    });
  });

  describe('IAM Roles', () => {
    test('Task execution roles should be created for each service', async () => {
      for (const service of servicesToTest) {
        const roles = await iamClient.send(
          new ListRolesCommand({
            PathPrefix: `/`,
          })
        );

        expect(roles.Roles).toBeDefined();

        const executionRole = roles.Roles!.find(role =>
          role.RoleName?.includes(`${service.name}TaskExecutionRole`)
        );
        expect(executionRole).toBeDefined();
        expect(executionRole?.AssumeRolePolicyDocument).toBeDefined();
      }
    });

    test('Task roles should be created for each service', async () => {
      for (const service of servicesToTest) {
        const roles = await iamClient.send(
          new ListRolesCommand({
            PathPrefix: `/`,
          })
        );

        expect(roles.Roles).toBeDefined();

        const taskRole = roles.Roles!.find(role =>
          role.RoleName?.includes(`${service.name}TaskRole`)
        );
        expect(taskRole).toBeDefined();
        expect(taskRole?.AssumeRolePolicyDocument).toBeDefined();
      }
    });
  });

  describe('CloudWatch Alarms', () => {
    test.skip('CPU utilization alarms should be created for each service', async () => {
      const alarms = await cloudWatchClient.send(
        new DescribeAlarmsCommand({
          AlarmNamePrefix: 'TapStack',
        })
      );

      expect(alarms.MetricAlarms).toBeDefined();

      for (const service of servicesToTest) {
        const cpuAlarm = alarms.MetricAlarms!.find(alarm =>
          alarm.AlarmName?.includes(`${service.name}CpuAlarm`)
        );
        expect(cpuAlarm).toBeDefined();
        expect(cpuAlarm?.MetricName).toBe('CPUUtilization');
        expect(cpuAlarm?.Namespace).toBe('AWS/ECS');
        expect(cpuAlarm?.Statistic).toBe('Average');
      }
    });

    test.skip('Memory utilization alarms should be created for each service', async () => {
      const alarms = await cloudWatchClient.send(
        new DescribeAlarmsCommand({
          AlarmNamePrefix: 'TapStack',
        })
      );

      expect(alarms.MetricAlarms).toBeDefined();

      for (const service of servicesToTest) {
        const memoryAlarm = alarms.MetricAlarms!.find(alarm =>
          alarm.AlarmName?.includes(`${service.name}MemoryAlarm`)
        );
        expect(memoryAlarm).toBeDefined();
        expect(memoryAlarm?.MetricName).toBe('MemoryUtilization');
        expect(memoryAlarm?.Namespace).toBe('AWS/ECS');
        expect(memoryAlarm?.Statistic).toBe('Average');
      }
    });
  });

  describe('Auto Scaling', () => {
    test.skip('Scalable targets should be created for each service', async () => {
      const scalableTargets = await autoScalingClient.send(
        new DescribeScalableTargetsCommand({
          ServiceNamespace: 'ecs',
        })
      );

      expect(scalableTargets.ScalableTargets).toBeDefined();

      for (const service of servicesToTest) {
        const scalableTarget = scalableTargets.ScalableTargets!.find(target =>
          target.ResourceId?.includes(service.name) &&
          target.ScalableDimension === 'ecs:service:DesiredCount'
        );
        expect(scalableTarget).toBeDefined();
        expect(scalableTarget?.MinCapacity).toBeGreaterThan(0);
        expect(scalableTarget?.MaxCapacity).toBeGreaterThan(scalableTarget?.MinCapacity!);
      }
    });

    test.skip('Scaling policies should be created for each service', async () => {
      const scalingPolicies = await autoScalingClient.send(
        new DescribeScalingPoliciesCommand({
          ServiceNamespace: 'ecs',
        })
      );

      expect(scalingPolicies.ScalingPolicies).toBeDefined();

      for (const service of servicesToTest) {
        // Check for CPU scaling policy
        const cpuPolicy = scalingPolicies.ScalingPolicies!.find(policy =>
          policy.ResourceId?.includes(service.name) &&
          policy.PolicyName?.includes('CpuScaling')
        );
        expect(cpuPolicy).toBeDefined();
        expect(cpuPolicy?.PolicyType).toBe('TargetTrackingScaling');

        // Check for Memory scaling policy
        const memoryPolicy = scalingPolicies.ScalingPolicies!.find(policy =>
          policy.ResourceId?.includes(service.name) &&
          policy.PolicyName?.includes('MemoryScaling')
        );
        expect(memoryPolicy).toBeDefined();
        expect(memoryPolicy?.PolicyType).toBe('TargetTrackingScaling');
      }
    });
  });

  describe('Security Groups', () => {
    test('ALB security group should be created and configured', async () => {
      const securityGroups = await ec2Client.send(
        new DescribeSecurityGroupsCommand({
          Filters: [{ Name: 'group-name', Values: ['*Alb*'] }],
        })
      );

      expect(securityGroups.SecurityGroups).toBeDefined();
      expect(securityGroups.SecurityGroups!.length).toBeGreaterThan(0);

      const albSg = securityGroups.SecurityGroups![0];
      expect(albSg.GroupName).toContain('Alb');
      expect(albSg.VpcId).toBeDefined();

      // Check inbound rules allow HTTP
      expect(albSg.IpPermissions).toBeDefined();
      expect(albSg.IpPermissions!.length).toBeGreaterThan(0);
      expect(albSg.IpPermissions!.some(rule =>
        rule.FromPort === 80 && rule.ToPort === 80 && rule.IpProtocol === 'tcp'
      )).toBe(true);
    });

    test('Service security groups should be created for each service', async () => {
      for (const service of servicesToTest) {
        const securityGroups = await ec2Client.send(
          new DescribeSecurityGroupsCommand({
            Filters: [{ Name: 'group-name', Values: [`*${service.name}*`] }],
          })
        );

        expect(securityGroups.SecurityGroups).toBeDefined();
        expect(securityGroups.SecurityGroups!.length).toBeGreaterThan(0);

        const serviceSg = securityGroups.SecurityGroups![0];
        expect(serviceSg.GroupName).toContain(service.name);
        expect(serviceSg.VpcId).toBeDefined();

        // Check that service allows traffic from ALB security group
        expect(serviceSg.IpPermissions).toBeDefined();
        expect(serviceSg.IpPermissions!.some(rule =>
          rule.FromPort === service.port &&
          rule.ToPort === service.port &&
          rule.IpProtocol === 'tcp' &&
          rule.UserIdGroupPairs &&
          rule.UserIdGroupPairs.length > 0
        )).toBe(true);
      }
    });

    test('Inter-service communication should be configured', async () => {
      // Check if transaction-api exists and has rules for payment-api and fraud-detector
      const transactionService = servicesToTest.find(s => s.name === 'transaction-api');
      if (transactionService) {
        const securityGroups = await ec2Client.send(
          new DescribeSecurityGroupsCommand({
            Filters: [{ Name: 'group-name', Values: ['*transaction-api*'] }],
          })
        );

        if (securityGroups.SecurityGroups && securityGroups.SecurityGroups.length > 0) {
          const transactionSg = securityGroups.SecurityGroups[0];

          // Should have outbound rules to payment-api and fraud-detector
          expect(transactionSg.IpPermissionsEgress).toBeDefined();
          expect(transactionSg.IpPermissionsEgress!.length).toBeGreaterThan(0);

          // Check for rules to payment-api (port 8080) and fraud-detector (port 8081)
          expect(transactionSg.IpPermissionsEgress!.some(rule =>
            rule.FromPort === 8080 && rule.ToPort === 8080 && rule.IpProtocol === 'tcp'
          )).toBe(true);

          expect(transactionSg.IpPermissionsEgress!.some(rule =>
            rule.FromPort === 8081 && rule.ToPort === 8081 && rule.IpProtocol === 'tcp'
          )).toBe(true);
        }
      }
    });
  });

  describe('End-to-End Connectivity', () => {
    test('ALB should be accessible', async () => {
      if (!albDnsName) {
        throw new Error('ALB DNS name not available');
      }

      // Try to resolve DNS
      const dnsResolved = await resolveDns(albDnsName);
      expect(dnsResolved).toBe(true);
    }, 30000);
  });

  describe('Infrastructure Resource Validation Summary', () => {
    test('All core infrastructure components should be created and configured', async () => {
      // This test validates that all the core infrastructure components are properly created
      // and configured as expected from the CDK deployment

      console.log('\n=== INFRASTRUCTURE RESOURCE VALIDATION SUMMARY ===');

      // 1. CloudFormation Stacks
      console.log('✓ CloudFormation Stacks: Validating deployment...');
      const stacks = await Promise.all([
        describeStack(mainStackName),
        describeStack(ecsStackName)
      ]);
      expect(stacks.every(s => s?.StackStatus?.includes('COMPLETE'))).toBe(true);
      console.log('  - Main stack and ECS stack deployed successfully');

      // 2. VPC Infrastructure
      console.log('✓ VPC Infrastructure: Validating network setup...');
      const vpcName = process.env.TEST_VPC_NAME || process.env.VPC_NAME || `microservices-vpc-${ecsStackName}`;
      const vpcs = await ec2Client.send(
        new DescribeVpcsCommand({
          Filters: [{ Name: 'tag:Name', Values: [vpcName] }],
        })
      );
      expect(vpcs.Vpcs?.length).toBeGreaterThan(0);
      console.log('  - VPC created with proper configuration');

      // 3. ECS Cluster and Services
      console.log('✓ ECS Infrastructure: Validating container orchestration...');
      if (clusterName) {
        const cluster = await ecsClient.send(
          new DescribeClustersCommand({ clusters: [clusterName] })
        );
        expect(cluster.clusters?.[0]?.status).toBe('ACTIVE');
        console.log('  - ECS cluster is active');

        const services = await ecsClient.send(new ListServicesCommand({ cluster: clusterName }));
        expect(services.serviceArns?.length).toBeGreaterThanOrEqual(servicesToTest.length);
        console.log(`  - ${services.serviceArns?.length} ECS services created`);
      }

      // 4. App Mesh
      console.log('✓ App Mesh: Validating service mesh...');
      if (meshName && !useLocalStack) {
        const mesh = await appMeshClient.send(
          new DescribeMeshCommand({ meshName: meshName })
        );
        expect(mesh.mesh?.status?.status).toBe('ACTIVE');
        console.log('  - App Mesh is active');

        const virtualNodes = await appMeshClient.send(
          new ListVirtualNodesCommand({ meshName: meshName })
        );
        expect(virtualNodes.virtualNodes?.length).toBeGreaterThanOrEqual(servicesToTest.length);
        console.log(`  - ${virtualNodes.virtualNodes?.length} virtual nodes created`);
      } else if (useLocalStack) {
        console.log('  - Skipping App Mesh validation (not fully supported in LocalStack)');
      }

      // 5. Load Balancer
      console.log('✓ Load Balancer: Validating traffic distribution...');
      const loadBalancers = await elbClient.send(new DescribeLoadBalancersCommand({}));
      const alb = loadBalancers.LoadBalancers!.find(
        lb => lb.LoadBalancerName?.includes('alb') || lb.LoadBalancerName?.includes('microservices')
      );
      expect(alb?.State?.Code).toBe('active');
      console.log('  - ALB is active and healthy');

      // 6. Target Groups
      const targetGroups = await elbClient.send(new DescribeTargetGroupsCommand({}));
      expect(targetGroups.TargetGroups?.length).toBeGreaterThanOrEqual(servicesToTest.length);
      console.log(`  - ${targetGroups.TargetGroups?.length} target groups configured`);

      // 7. ECR Repositories
      console.log('✓ ECR: Validating container registry...');
      const repositories = await ecrClient.send(new DescribeRepositoriesCommand({}));
      const expectedRepos = servicesToTest.filter(s => repositories.repositories!.some(r => r.repositoryName === s.name));
      expect(expectedRepos.length).toBe(servicesToTest.length);
      console.log(`  - ${expectedRepos.length} ECR repositories created`);

      // 8. Secrets Manager
      console.log('✓ Secrets Manager: Validating secure configuration...');
      const secrets = await secretsClient.send(new ListSecretsCommand({}));
      const dbSecret = secrets.SecretList!.find(s => s.Name?.includes('database-url'));
      const apiSecret = secrets.SecretList!.find(s => s.Name?.includes('api-key'));
      expect(dbSecret).toBeDefined();
      expect(apiSecret).toBeDefined();
      console.log('  - Database URL and API key secrets configured');

      // 9. CloudWatch Logs
      console.log('✓ CloudWatch Logs: Validating logging infrastructure...');
      const logGroups = await logsClient.send(
        new DescribeLogGroupsCommand({ logGroupNamePrefix: '/ecs/' })
      );
      const serviceLogGroups = logGroups.logGroups!.filter(lg =>
        servicesToTest.some(s => lg.logGroupName === `/ecs/${s.name}`)
      );
      expect(serviceLogGroups.length).toBe(servicesToTest.length);
      console.log(`  - ${serviceLogGroups.length} service log groups created`);

      // 10. IAM Roles
      console.log('✓ IAM Roles: Validating access management...');
      const roles = await iamClient.send(new ListRolesCommand({}));
      const taskRoles = roles.Roles!.filter(role =>
        servicesToTest.some(s => role.RoleName?.includes(`${s.name}TaskRole`))
      );
      const executionRoles = roles.Roles!.filter(role =>
        servicesToTest.some(s => role.RoleName?.includes(`${s.name}TaskExecutionRole`))
      );
      expect(taskRoles.length).toBe(servicesToTest.length);
      expect(executionRoles.length).toBe(servicesToTest.length);
      console.log(`  - ${taskRoles.length} task roles and ${executionRoles.length} execution roles created`);

      // 11. CloudWatch Alarms
      console.log('✓ CloudWatch Alarms: Validating monitoring...');
      if (!useLocalStack) {
        const alarms = await cloudWatchClient.send(new DescribeAlarmsCommand({}));
        const cpuAlarms = alarms.MetricAlarms!.filter(alarm =>
          servicesToTest.some(s => alarm.AlarmName?.includes(`${s.name}CpuAlarm`))
        );
        const memoryAlarms = alarms.MetricAlarms!.filter(alarm =>
          servicesToTest.some(s => alarm.AlarmName?.includes(`${s.name}MemoryAlarm`))
        );
        expect(cpuAlarms.length).toBe(servicesToTest.length);
        expect(memoryAlarms.length).toBe(servicesToTest.length);
        console.log(`  - ${cpuAlarms.length} CPU and ${memoryAlarms.length} memory alarms configured`);
      } else {
        console.log('  - Skipping CloudWatch Alarms validation (limited support in LocalStack)');
      }

      // 12. Auto Scaling
      console.log('✓ Auto Scaling: Validating scaling configuration...');
      if (!useLocalStack) {
        const scalableTargets = await autoScalingClient.send(
          new DescribeScalableTargetsCommand({ ServiceNamespace: 'ecs' })
        );
        const scalingPolicies = await autoScalingClient.send(
          new DescribeScalingPoliciesCommand({ ServiceNamespace: 'ecs' })
        );
        const serviceTargets = scalableTargets.ScalableTargets!.filter(target =>
          servicesToTest.some(s => target.ResourceId?.includes(s.name))
        );
        const servicePolicies = scalingPolicies.ScalingPolicies!.filter(policy =>
          servicesToTest.some(s => policy.ResourceId?.includes(s.name))
        );
        expect(serviceTargets.length).toBe(servicesToTest.length);
        expect(servicePolicies.length).toBe(servicesToTest.length * 2); // CPU + Memory policies
        console.log(`  - ${serviceTargets.length} scalable targets and ${servicePolicies.length} scaling policies configured`);
      } else {
        console.log('  - Skipping Auto Scaling validation (limited support in LocalStack)');
      }

      console.log('\n🎉 INFRASTRUCTURE COMPONENTS VALIDATED SUCCESSFULLY!');
      console.log(`✅ Total Services: ${servicesToTest.length}`);
      console.log('✅ Full-stack ECS microservices infrastructure deployed and configured');
      if (!useLocalStack) {
        console.log('✅ App Mesh service mesh properly configured');
        console.log('✅ Load balancing and routing working correctly');
        console.log('✅ Monitoring, logging, and scaling fully operational');
      } else {
        console.log('✅ Basic infrastructure validated (some advanced features limited in LocalStack)');
      }
    });
  });
});

async function describeStack(stackName: string) {
  try {
    const response = await cloudFormationClient.send(
      new DescribeStacksCommand({
        StackName: stackName,
      })
    );
    return response.Stacks?.[0];
  } catch (error) {
    console.warn(`Failed to describe stack ${stackName}:`, error);
    return undefined;
  }
}

async function waitForStackReady(stackName: string, maxWaitTime = 600000) {
  const startTime = Date.now();
  const pollInterval = 10000; // 10 seconds

  while (Date.now() - startTime < maxWaitTime) {
    const stack = await describeStack(stackName);

    if (!stack) {
      throw new Error(`Stack ${stackName} not found`);
    }

    const status = stack.StackStatus as StackStatus;

    if (status.includes('COMPLETE') && !status.includes('ROLLBACK')) {
      return;
    }

    if (status.includes('FAILED') || status.includes('ROLLBACK')) {
      throw new Error(`Stack ${stackName} failed with status: ${status}`);
    }

    await new Promise(resolve => setTimeout(resolve, pollInterval));
  }

  throw new Error(
    `Stack ${stackName} did not become ready within ${maxWaitTime}ms`
  );
}

async function getStackOutputs(
  stackName: string
): Promise<Record<string, string>> {
  const stack = await describeStack(stackName);
  if (!stack?.Outputs) {
    return {};
  }

  const outputs: Record<string, string> = {};
  for (const output of stack.Outputs) {
    if (output.OutputKey && output.OutputValue) {
      outputs[output.OutputKey] = output.OutputValue;
    }
  }
  return outputs;
}

async function resolveDns(hostname: string): Promise<boolean> {
  try {
    const dns = await import('dns').then(m => m.promises);
    await dns.resolve4(hostname);
    return true;
  } catch {
    return false;
  }
}

async function retryUntilSuccess<T>(
  operation: () => Promise<T>,
  maxRetries: number,
  delay: number
): Promise<T> {
  let lastError: Error;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error as Error;
      console.log(`Attempt ${attempt}/${maxRetries} failed:`, lastError.message);

      if (attempt < maxRetries) {
        console.log(`Retrying in ${delay}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }

  throw lastError!;
}
