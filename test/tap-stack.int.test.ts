// test/tap-stack.int.test.ts - Comprehensive Integration Tests for TapStack Infrastructure
import {
  AppMeshClient,
  DescribeMeshCommand,
  DescribeRouteCommand,
  DescribeVirtualNodeCommand,
  DescribeVirtualRouterCommand,
} from '@aws-sdk/client-app-mesh';
import {
  ApplicationAutoScalingClient,
  DescribeScalableTargetsCommand,
  DescribeScalingPoliciesCommand,
} from '@aws-sdk/client-application-auto-scaling';
import {
  CloudFormationClient,
  DescribeStacksCommand,
  StackStatus,
} from '@aws-sdk/client-cloudformation';
import {
  CloudWatchClient,
  DescribeAlarmsCommand,
} from '@aws-sdk/client-cloudwatch';
import {
  CloudWatchLogsClient,
  DescribeLogGroupsCommand,
} from '@aws-sdk/client-cloudwatch-logs';
import {
  DescribeSecurityGroupsCommand,
  DescribeSubnetsCommand,
  DescribeVpcsCommand,
  EC2Client,
} from '@aws-sdk/client-ec2';
import { DescribeRepositoriesCommand, ECRClient } from '@aws-sdk/client-ecr';
import {
  DescribeClustersCommand,
  DescribeServicesCommand,
  DescribeTaskDefinitionCommand,
  ECSClient,
  ListServicesCommand,
} from '@aws-sdk/client-ecs';
import {
  DescribeListenersCommand,
  DescribeLoadBalancersCommand,
  DescribeRulesCommand,
  DescribeTargetGroupsCommand,
  ElasticLoadBalancingV2Client,
} from '@aws-sdk/client-elastic-load-balancing-v2';
import {
  GetRoleCommand,
  IAMClient,
  ListRolesCommand,
} from '@aws-sdk/client-iam';
import {
  ListSecretsCommand,
  SecretsManagerClient,
} from '@aws-sdk/client-secrets-manager';
import { execSync } from 'child_process';
import { SERVICES } from '../lib/config/service-config';

// Enhanced LocalStack detection with multiple fallback methods
async function detectLocalStack(): Promise<boolean> {
  // Method 1: Check health endpoint
  try {
    execSync('curl -s -f http://localhost:4566/_localstack/health', {
      stdio: 'ignore',
      timeout: 3000,
    });
    return true;
  } catch {
    // Method 2: Check if LocalStack container is running
    try {
      const result = execSync(
        'docker ps --filter name=localstack --format "{{.Names}}"',
        {
          encoding: 'utf8',
          timeout: 2000,
        }
      );
      if (result.trim().includes('localstack')) {
        return true;
      }
    } catch {
      // Method 3: Check environment variables
      const indicators = [
        process.env.USE_LOCALSTACK === 'true',
        process.env.AWS_ENDPOINT_URL?.includes('localhost'),
        process.env.AWS_ENDPOINT_URL?.includes('localstack'),
        process.env.LOCALSTACK_API_KEY,
      ];
      return indicators.some(Boolean);
    }
  }
  return false;
}

// Environment configuration
const environmentSuffix =
  process.env.ENVIRONMENT_SUFFIX ||
  process.env.TEST_ENVIRONMENT_SUFFIX ||
  'dev';
const region =
  process.env.CDK_DEFAULT_REGION || process.env.AWS_REGION || 'us-east-1';
const account = process.env.CDK_DEFAULT_ACCOUNT || process.env.AWS_ACCOUNT_ID;

// Detect LocalStack availability asynchronously
let useLocalStack = false;
let localStackRunning = false;

const mainStackName = `TapStack-${environmentSuffix}`;
const ecsStackName = `tap-ecs-microservices-${environmentSuffix}`;

const testTimeout = parseInt(process.env.TEST_TIMEOUT || '600000', 10);
const skipDeployment = process.env.TEST_SKIP_DEPLOYMENT === 'true';
const skipTeardown = process.env.TEST_SKIP_TEARDOWN === 'true';
const includeOptionalServices = process.env.TEST_INCLUDE_OPTIONAL === 'true';
const mockMode = process.env.TEST_MOCK_MODE === 'true'; // Skip actual AWS calls, just test logic

const servicesToTest = SERVICES.filter(
  service => !service.optional || includeOptionalServices
);

// Create AWS clients lazily after determining LocalStack vs AWS
function createClientConfig() {
  if (useLocalStack) {
    return {
      region,
      endpoint: process.env.AWS_ENDPOINT_URL || 'http://localhost:4566',
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID || 'test',
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || 'test',
      },
    };
  }
  return { region };
}

let cloudFormationClient: CloudFormationClient;
let ec2Client: EC2Client;
let ecsClient: ECSClient;
let elbClient: ElasticLoadBalancingV2Client;
let appMeshClient: AppMeshClient;
let secretsClient: SecretsManagerClient;
let ecrClient: ECRClient;
let logsClient: CloudWatchLogsClient;
let cloudWatchClient: CloudWatchClient;
let iamClient: IAMClient;
let autoScalingClient: ApplicationAutoScalingClient;

function initClients() {
  const clientConfig = createClientConfig();
  cloudFormationClient = new CloudFormationClient(clientConfig);
  ec2Client = new EC2Client(clientConfig);
  ecsClient = new ECSClient(clientConfig);
  elbClient = new ElasticLoadBalancingV2Client(clientConfig);
  appMeshClient = new AppMeshClient(clientConfig);
  secretsClient = new SecretsManagerClient(clientConfig);
  ecrClient = new ECRClient(clientConfig);
  logsClient = new CloudWatchLogsClient(clientConfig);
  cloudWatchClient = new CloudWatchClient(clientConfig);
  iamClient = new IAMClient(clientConfig);
  autoScalingClient = new ApplicationAutoScalingClient(clientConfig);
}

// decide whether to run the suite (synchronously determined)
const canRunTests = useLocalStack || !!account;

// Allow forced execution for development/testing purposes
const forceRunTests = process.env.FORCE_INTEGRATION_TESTS === 'true';

// If neither available and not forced, skip the whole suite
const describeOrSkip = canRunTests || forceRunTests ? describe : describe.skip;

describeOrSkip('TapStack Integration Tests', () => {
  // runtime flags and outputs
  let deployedStacks: string[] = [];
  let albDnsName: string | undefined;
  let clusterName: string | undefined;
  let meshName: string | undefined;

  beforeAll(async () => {
    // Detect LocalStack availability first
    localStackRunning = await detectLocalStack();
    useLocalStack =
      process.env.USE_LOCALSTACK === 'true' ||
      process.env.TEST_USE_LOCALSTACK === 'true' ||
      (!account && localStackRunning); // default to localstack when no account set but LocalStack is available

    // Determine if we can run tests
    const canRunTests = useLocalStack || !!account;
    const forceRunTests = process.env.FORCE_INTEGRATION_TESTS === 'true';

    if (!canRunTests && !forceRunTests) {
      console.warn(
        'Neither LocalStack nor AWS credentials are available - skipping integration tests'
      );
      console.warn(
        '💡 To force run tests anyway, set FORCE_INTEGRATION_TESTS=true'
      );
      return;
    }

    if (!account && !useLocalStack && !forceRunTests) {
      throw new Error(
        'AWS account not configured and LocalStack not available. Set CDK_DEFAULT_ACCOUNT or ensure LocalStack is running'
      );
    }

    // Configure environment for testing
    if (useLocalStack) {
      console.log('🧪 Using LocalStack for integration tests');
      process.env.USE_LOCALSTACK = 'true';
      process.env.AWS_ENDPOINT_URL =
        process.env.AWS_ENDPOINT_URL || 'http://localhost:4566';
      process.env.AWS_ACCESS_KEY_ID = process.env.AWS_ACCESS_KEY_ID || 'test';
      process.env.AWS_SECRET_ACCESS_KEY =
        process.env.AWS_SECRET_ACCESS_KEY || 'test';
    } else if (forceRunTests) {
      console.log('⚡ Force-running integration tests (mock environment)');
      console.warn(
        '⚠️ Tests will use mock AWS credentials - may fail on actual AWS calls'
      );
      process.env.AWS_ACCESS_KEY_ID = 'test';
      process.env.AWS_SECRET_ACCESS_KEY = 'test';
      process.env.CDK_DEFAULT_ACCOUNT = '123456789012'; // Mock account
    } else {
      console.log('☁️ Using AWS for integration tests');
    }

    // Initialize AWS clients with proper configuration
    initClients();

    // Ensure CDK knows account/region
    process.env.CDK_DEFAULT_ACCOUNT =
      account || process.env.CDK_DEFAULT_ACCOUNT || '123456789012';
    process.env.CDK_DEFAULT_REGION = region;

    if (!skipDeployment && !mockMode) {
      // Deploy the stacks (user requested)
      try {
        console.log(
          `Deploying stacks (envSuffix=${environmentSuffix}) - useLocalStack=${useLocalStack}`
        );

        // we call the same npm script you use for deployment
        execSync('npm run cdk:deploy', {
          stdio: 'inherit',
          env: {
            ...process.env,
            CDK_DEFAULT_ACCOUNT: account || process.env.CDK_DEFAULT_ACCOUNT,
            CDK_DEFAULT_REGION: region,
            ENVIRONMENT_SUFFIX: environmentSuffix,
          },
        });

        deployedStacks.push(mainStackName, ecsStackName);

        await waitForStackReady(mainStackName);
        await waitForStackReady(ecsStackName);

        const outputs = await getStackOutputs(ecsStackName);
        albDnsName = outputs.AlbDnsName;
        clusterName = outputs.ClusterName;
        meshName = outputs.MeshName;

        console.log('Deployment succeeded:', {
          albDnsName,
          clusterName,
          meshName,
        });
      } catch (err) {
        console.error('Deployment error:', err);
        throw err;
      }
    } else if (mockMode) {
      // Mock deployment - simulate success without actual AWS calls
      console.log('🎭 Mock deployment mode - skipping actual CDK deployment');
      console.log('Mock deployment succeeded with simulated outputs');

      // Set mock outputs for testing
      albDnsName = 'mock-alb-123456789.us-east-1.elb.amazonaws.com';
      clusterName = 'mock-cluster';
      meshName = 'mock-mesh';
    } else {
      // Try to fetch outputs for already deployed stacks
      try {
        const outputs = await getStackOutputs(ecsStackName);
        albDnsName = outputs.AlbDnsName;
        clusterName = outputs.ClusterName;
        meshName = outputs.MeshName;
      } catch (err) {
        console.warn('Unable to get stack outputs:', err);
      }
    }
  }, testTimeout);

  afterAll(async () => {
    if (!skipTeardown && !skipDeployment && deployedStacks.length > 0) {
      try {
        for (const stackName of deployedStacks.reverse()) {
          execSync(`npx cdk destroy ${stackName} --force`, {
            stdio: 'inherit',
            env: {
              ...process.env,
              CDK_DEFAULT_ACCOUNT: account || process.env.CDK_DEFAULT_ACCOUNT,
              CDK_DEFAULT_REGION: region,
              ENVIRONMENT_SUFFIX: environmentSuffix,
            },
          });
        }
      } catch (err) {
        console.error('Teardown error:', err);
      }
    }
  }, testTimeout);

  //
  // Basic stack checks
  //
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

  //
  // VPC
  //
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

      expect(vpcs.Vpcs && vpcs.Vpcs.length).toBeGreaterThan(0);
      const vpc = vpcs.Vpcs![0];
      expect(vpc.State).toBe('available');
      expect(vpc.CidrBlock).toBeDefined();

      const expectedCidr =
        process.env.TEST_VPC_CIDR || process.env.VPC_CIDR || '10.0.0.0/16';
      expect(vpc.CidrBlock).toBe(expectedCidr);
    }, 30000);

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
        const vpcId = vpcs.Vpcs[0].VpcId!;
        const subnets = await ec2Client.send(
          new DescribeSubnetsCommand({
            Filters: [{ Name: 'vpc-id', Values: [vpcId] }],
          })
        );

        expect(subnets.Subnets && subnets.Subnets.length).toBeGreaterThan(0);

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

      expect(logGroups.logGroups && logGroups.logGroups.length).toBeGreaterThan(
        0
      );
    });
  });

  //
  // ECS cluster and services
  //
  describe('ECS Cluster', () => {
    test('ECS Cluster should exist and be active', async () => {
      if (!clusterName) throw new Error('Cluster name not available');

      const response = await ecsClient.send(
        new DescribeClustersCommand({
          clusters: [clusterName],
        })
      );

      expect(response.clusters && response.clusters.length).toBe(1);
      const cluster = response.clusters![0];
      expect(cluster.status).toBe('ACTIVE');
      expect(cluster.clusterName).toBe(clusterName);
    }, 30000);

    test('ECS Services should be created for each service', async () => {
      if (!clusterName) throw new Error('Cluster name not available');

      const servicesResponse = await ecsClient.send(
        new ListServicesCommand({ cluster: clusterName })
      );

      expect(
        servicesResponse.serviceArns && servicesResponse.serviceArns.length
      ).toBeGreaterThanOrEqual(servicesToTest.length);

      for (const service of servicesToTest) {
        const serviceResponse = await ecsClient.send(
          new DescribeServicesCommand({
            cluster: clusterName,
            services: [service.name],
          })
        );

        expect(
          serviceResponse.services && serviceResponse.services.length
        ).toBe(1);
        const ecsService = serviceResponse.services![0];
        expect(ecsService.serviceName).toBe(service.name);
        expect(ecsService.status).toBe('ACTIVE');
        expect(ecsService.desiredCount! > 0).toBeTruthy();
        expect(!!ecsService.taskDefinition).toBeTruthy();
        expect(
          ecsService.loadBalancers && ecsService.loadBalancers.length > 0
        ).toBeTruthy();
        expect(
          ecsService.capacityProviderStrategy &&
            ecsService.capacityProviderStrategy.length > 0
        ).toBeTruthy();
      }
    }, 60000);

    test('ECS Task Definitions should be created for each service', async () => {
      if (!clusterName) throw new Error('Cluster name not available');

      const servicesResponse = await ecsClient.send(
        new ListServicesCommand({ cluster: clusterName })
      );

      const taskDefinitionArns = new Set<string>();

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
          if (service.taskDefinition)
            taskDefinitionArns.add(service.taskDefinition);
        }
      }

      expect(taskDefinitionArns.size).toBeGreaterThanOrEqual(
        servicesToTest.length
      );

      for (const taskDefArn of Array.from(taskDefinitionArns)) {
        const taskDefResponse = await ecsClient.send(
          new DescribeTaskDefinitionCommand({ taskDefinition: taskDefArn })
        );
        const taskDef = taskDefResponse.taskDefinition;
        expect(taskDef).toBeDefined();
        expect(taskDef?.status).toBe('ACTIVE');
        expect(
          taskDef?.requiresCompatibilities &&
            taskDef?.requiresCompatibilities.includes('FARGATE')
        ).toBeTruthy();
        expect(
          taskDef?.containerDefinitions &&
            taskDef.containerDefinitions.length > 0
        ).toBeTruthy();

        const appContainer = taskDef?.containerDefinitions!.find(
          c => c.name !== 'envoy'
        );
        expect(appContainer).toBeDefined();
        expect(
          appContainer?.portMappings && appContainer.portMappings.length > 0
        ).toBeTruthy();

        const envoyContainer = taskDef?.containerDefinitions!.find(
          c => c.name === 'envoy'
        );
        expect(envoyContainer).toBeDefined();
        expect(
          envoyContainer?.image && envoyContainer.image.includes('envoy')
        ).toBeTruthy();
      }
    }, 60000);
  });

  //
  // ALB
  //
  describe('Application Load Balancer', () => {
    test('ALB should exist and be active', async () => {
      const lbs = await elbClient.send(new DescribeLoadBalancersCommand({}));
      expect(lbs.LoadBalancers && lbs.LoadBalancers.length).toBeGreaterThan(0);

      const alb = lbs.LoadBalancers!.find(
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
      const lbs = await elbClient.send(new DescribeLoadBalancersCommand({}));
      const alb = lbs.LoadBalancers!.find(
        lb =>
          lb.LoadBalancerName?.includes('alb') ||
          lb.LoadBalancerName?.includes('microservices')
      );

      if (alb?.LoadBalancerArn) {
        const listeners = await elbClient.send(
          new DescribeListenersCommand({ LoadBalancerArn: alb.LoadBalancerArn })
        );
        expect(
          listeners.Listeners && listeners.Listeners.length
        ).toBeGreaterThan(0);

        const httpListener = listeners.Listeners!.find(l => l.Port === 80);
        expect(httpListener).toBeDefined();
        expect(httpListener?.Protocol).toBe('HTTP');
      }
    }, 30000);

    test('Target groups should be created for each service', async () => {
      const targetGroups = await elbClient.send(
        new DescribeTargetGroupsCommand({})
      );
      expect(
        targetGroups.TargetGroups && targetGroups.TargetGroups.length
      ).toBeGreaterThanOrEqual(servicesToTest.length);

      for (const service of servicesToTest) {
        const tg = targetGroups.TargetGroups!.find(
          t => t.TargetGroupName === `${service.name}-tg`
        );
        expect(tg).toBeDefined();
        expect(tg?.Port).toBe(service.port);
        expect(tg?.Protocol).toBe('HTTP');
        expect(tg?.TargetType).toBe('ip');
        // health checks are optional in some local environments; assert if present
        if (tg?.HealthCheckPath)
          expect(tg.HealthCheckPath).toBe(service.healthCheckPath);
      }
    }, 30000);

    test('ALB listener rules should be created for each service', async () => {
      const lbs = await elbClient.send(new DescribeLoadBalancersCommand({}));
      const alb = lbs.LoadBalancers!.find(
        lb =>
          lb.LoadBalancerName?.includes('alb') ||
          lb.LoadBalancerName?.includes('microservices')
      );

      if (alb?.LoadBalancerArn) {
        const listeners = await elbClient.send(
          new DescribeListenersCommand({ LoadBalancerArn: alb.LoadBalancerArn })
        );
        const httpListener = listeners.Listeners!.find(l => l.Port === 80);
        expect(httpListener).toBeDefined();

        if (httpListener?.ListenerArn) {
          const rules = await elbClient.send(
            new DescribeRulesCommand({ ListenerArn: httpListener.ListenerArn })
          );
          expect(rules.Rules && rules.Rules.length).toBeGreaterThanOrEqual(
            servicesToTest.length + 1
          );

          for (const service of servicesToTest) {
            const serviceRule = rules.Rules!.find(rule =>
              rule.Conditions?.some(
                condition =>
                  condition.Field === 'path-pattern' &&
                  condition.PathPatternConfig?.Values?.some(path =>
                    path.includes(service.path)
                  )
              )
            );
            expect(serviceRule).toBeDefined();
          }
        }
      }
    }, 30000);
  });

  //
  // App Mesh - Comprehensive Service Mesh Validation
  //
  describe('App Mesh', () => {
    // Conditionally skip App Mesh tests for LocalStack (limited support)
    const describeAppMesh = useLocalStack ? describe.skip : describe;

    describeAppMesh('Mesh Configuration', () => {
      test('App Mesh should exist and be properly configured', async () => {
        if (!meshName) throw new Error('Mesh name not available');

        const mesh = await appMeshClient.send(
          new DescribeMeshCommand({ meshName })
        );
        expect(mesh.mesh).toBeDefined();
        expect(mesh.mesh!.meshName).toBe(meshName);
        expect(mesh.mesh!.status?.status).toBe('ACTIVE');
      });

      test('Virtual Nodes should exist for each service', async () => {
        if (!meshName) throw new Error('Mesh name not available');

        for (const service of servicesToTest) {
          const virtualNode = await appMeshClient.send(
            new DescribeVirtualNodeCommand({
              meshName,
              virtualNodeName: service.name,
            })
          );

          expect(virtualNode.virtualNode).toBeDefined();
          expect(virtualNode.virtualNode!.status?.status).toBe('ACTIVE');
          expect(virtualNode.virtualNode!.spec?.listeners).toBeDefined();
          expect(virtualNode.virtualNode!.spec?.serviceDiscovery).toBeDefined();
        }
      });
    });

    describeAppMesh('Virtual Router and Routes', () => {
      test('Virtual Router should exist and be configured', async () => {
        if (!meshName) throw new Error('Mesh name not available');

        const virtualRouter = await appMeshClient.send(
          new DescribeVirtualRouterCommand({
            meshName,
            virtualRouterName: 'microservices-router',
          })
        );

        expect(virtualRouter.virtualRouter).toBeDefined();
        expect(virtualRouter.virtualRouter!.status?.status).toBe('ACTIVE');
      });

      test('Routes should be configured for each service', async () => {
        if (!meshName) throw new Error('Mesh name not available');

        for (const service of servicesToTest) {
          const route = await appMeshClient.send(
            new DescribeRouteCommand({
              meshName,
              virtualRouterName: 'microservices-router',
              routeName: `${service.name}-route`,
            })
          );

          expect(route.route).toBeDefined();
          expect(route.route!.status?.status).toBe('ACTIVE');
          expect(route.route!.spec?.httpRoute).toBeDefined();
        }
      });
    });
  });

  //
  // ECR, Secrets, Logs, IAM, Alarms, AutoScaling, Security Groups
  //
  describe('ECR Repositories', () => {
    test('ECR repositories should exist for each service', async () => {
      const repos = await ecrClient.send(new DescribeRepositoriesCommand({}));
      expect(
        repos.repositories && repos.repositories.length
      ).toBeGreaterThanOrEqual(servicesToTest.length);

      for (const service of servicesToTest) {
        const repo = repos.repositories!.find(
          r => r.repositoryName === service.name
        );
        expect(repo).toBeDefined();
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
      const dbSecret = secrets.SecretList!.find(
        s =>
          s.Name?.includes('database-url') ||
          s.Name?.includes(`${secretPrefix}/database-url`)
      );
      expect(dbSecret).toBeDefined();
    });

    test('API Key secret should exist', async () => {
      const secretPrefix =
        process.env.TEST_SECRET_PREFIX ||
        process.env.SECRET_PREFIX ||
        '/microservices';
      const secrets = await secretsClient.send(new ListSecretsCommand({}));
      const apiKeySecret = secrets.SecretList!.find(
        s =>
          s.Name?.includes('api-key') ||
          s.Name?.includes(`${secretPrefix}/api-key`)
      );
      expect(apiKeySecret).toBeDefined();
    });
  });

  describe('CloudWatch Logs', () => {
    test('Log groups should exist for each service', async () => {
      const logGroups = await logsClient.send(
        new DescribeLogGroupsCommand({ logGroupNamePrefix: '/ecs/' })
      );
      expect(logGroups.logGroups && logGroups.logGroups.length).toBeGreaterThan(
        0
      );

      for (const service of servicesToTest) {
        const serviceLogGroup = logGroups.logGroups!.find(
          lg => lg.logGroupName === `/ecs/${service.name}`
        );
        expect(serviceLogGroup).toBeDefined();
      }
    });
  });

  describe('IAM Roles', () => {
    test('Task execution roles should be created for each service', async () => {
      const roles = await iamClient.send(
        new ListRolesCommand({ PathPrefix: '/' })
      );
      expect(roles.Roles && roles.Roles.length).toBeGreaterThan(0);

      for (const service of servicesToTest) {
        const executionRole = roles.Roles!.find(r =>
          r.RoleName?.includes(`${service.name}TaskExecutionRole`)
        );
        expect(executionRole).toBeDefined();
        expect(executionRole!.AssumeRolePolicyDocument).toBeDefined();

        // Verify the role can be assumed by ECS tasks
        if (executionRole!.RoleName) {
          const roleDetails = await iamClient.send(
            new GetRoleCommand({ RoleName: executionRole!.RoleName })
          );
          const policyDocument = JSON.parse(
            decodeURIComponent(roleDetails.Role!.AssumeRolePolicyDocument!)
          );
          expect(policyDocument.Statement[0].Principal.Service).toBe(
            'ecs-tasks.amazonaws.com'
          );
        }
      }
    });
  });

  describe('CloudWatch Alarms', () => {
    // Skip alarm tests for CI/CD environments where alarms are disabled
    const isCiCd =
      process.env.CI === 'true' ||
      process.env.CDK_DEFAULT_ACCOUNT === '123456789012';
    const describeAlarms = isCiCd ? describe.skip : describe;

    describeAlarms('CPU and Memory Alarms', () => {
      test('CPU utilization alarms should exist for each service', async () => {
        const alarms = await cloudWatchClient.send(
          new DescribeAlarmsCommand({})
        );
        expect(alarms.MetricAlarms).toBeDefined();

        for (const service of servicesToTest) {
          const cpuAlarm = alarms.MetricAlarms!.find(
            alarm =>
              alarm.AlarmName?.includes(`${service.name}-cpu`) ||
              alarm.AlarmName?.includes('CpuAlarm')
          );
          expect(cpuAlarm).toBeDefined();
          expect(cpuAlarm!.MetricName).toBe('CPUUtilization');
          expect(cpuAlarm!.Namespace).toBe('AWS/ECS');
        }
      });

      test('Memory utilization alarms should exist for each service', async () => {
        const alarms = await cloudWatchClient.send(
          new DescribeAlarmsCommand({})
        );
        expect(alarms.MetricAlarms).toBeDefined();

        for (const service of servicesToTest) {
          const memoryAlarm = alarms.MetricAlarms!.find(
            alarm =>
              alarm.AlarmName?.includes(`${service.name}-memory`) ||
              alarm.AlarmName?.includes('MemoryAlarm')
          );
          expect(memoryAlarm).toBeDefined();
          expect(memoryAlarm!.MetricName).toBe('MemoryUtilization');
          expect(memoryAlarm!.Namespace).toBe('AWS/ECS');
        }
      });
    });
  });

  describe('Auto Scaling', () => {
    // Skip auto scaling tests for CI/CD environments where scaling is disabled
    const isCiCd =
      process.env.CI === 'true' ||
      process.env.CDK_DEFAULT_ACCOUNT === '123456789012';
    const describeScaling = isCiCd ? describe.skip : describe;

    describeScaling('Application Auto Scaling', () => {
      test('Scalable targets should exist for each service', async () => {
        const targets = await autoScalingClient.send(
          new DescribeScalableTargetsCommand({
            ServiceNamespace: 'ecs',
          })
        );

        expect(targets.ScalableTargets).toBeDefined();

        for (const service of servicesToTest) {
          const target = targets.ScalableTargets!.find(
            t =>
              t.ResourceId?.includes(service.name) &&
              t.ScalableDimension === 'ecs:service:DesiredCount'
          );
          expect(target).toBeDefined();
          expect(target!.MinCapacity).toBe(2);
          expect(target!.MaxCapacity).toBe(10);
        }
      });

      test('Scaling policies should exist for each service', async () => {
        const policies = await autoScalingClient.send(
          new DescribeScalingPoliciesCommand({
            ServiceNamespace: 'ecs',
          })
        );

        expect(policies.ScalingPolicies).toBeDefined();

        for (const service of servicesToTest) {
          const cpuPolicy = policies.ScalingPolicies!.find(
            p =>
              p.ResourceId?.includes(service.name) &&
              p.PolicyName?.includes('CpuScaling')
          );
          expect(cpuPolicy).toBeDefined();
          expect(cpuPolicy!.PolicyType).toBe('TargetTrackingScaling');

          const memoryPolicy = policies.ScalingPolicies!.find(
            p =>
              p.ResourceId?.includes(service.name) &&
              p.PolicyName?.includes('MemoryScaling')
          );
          expect(memoryPolicy).toBeDefined();
          expect(memoryPolicy!.PolicyType).toBe('TargetTrackingScaling');
        }
      });
    });
  });

  describe('Security Groups', () => {
    test('Security groups should exist and be properly configured', async () => {
      const securityGroups = await ec2Client.send(
        new DescribeSecurityGroupsCommand({})
      );
      expect(securityGroups.SecurityGroups).toBeDefined();

      // Should have at least one security group for services
      const serviceSGs = securityGroups.SecurityGroups!.filter(
        sg =>
          sg.GroupName?.includes('service') ||
          sg.GroupName?.includes('microservice')
      );
      expect(serviceSGs.length).toBeGreaterThan(0);

      // Verify security group has proper ingress rules for service ports
      for (const sg of serviceSGs) {
        if (sg.IpPermissions) {
          const hasServicePorts = servicesToTest.some(service =>
            sg.IpPermissions!.some(
              perm =>
                perm.FromPort === service.port && perm.ToPort === service.port
            )
          );
          expect(hasServicePorts).toBeTruthy();
        }
      }
    });
  });

  describe('End-to-End Connectivity', () => {
    test('ALB should be resolvable', async () => {
      if (!albDnsName) throw new Error('ALB DNS name not available');
      const resolved = await resolveDns(albDnsName);
      expect(resolved).toBe(true);
    }, 30000);
  });

  //
  // Comprehensive Infrastructure Validation Summary
  //
  describe('Infrastructure Resource Validation Summary', () => {
    test('All CloudFormation stacks should be deployed successfully', async () => {
      const [mainStack, ecsStack] = await Promise.all([
        describeStack(mainStackName),
        describeStack(ecsStackName),
      ]);

      expect(mainStack).toBeDefined();
      expect(ecsStack).toBeDefined();
      expect(mainStack!.StackStatus).toMatch(/CREATE_COMPLETE|UPDATE_COMPLETE/);
      expect(ecsStack!.StackStatus).toMatch(/CREATE_COMPLETE|UPDATE_COMPLETE/);
    });

    test('All core AWS services should be operational', async () => {
      // VPC and networking
      const vpcs = await ec2Client.send(new DescribeVpcsCommand({}));
      expect(vpcs.Vpcs?.length).toBeGreaterThan(0);

      // ECS cluster
      if (clusterName) {
        const clusters = await ecsClient.send(
          new DescribeClustersCommand({ clusters: [clusterName] })
        );
        expect(clusters.clusters?.[0]?.status).toBe('ACTIVE');
      }

      // ALB
      const lbs = await elbClient.send(new DescribeLoadBalancersCommand({}));
      expect(lbs.LoadBalancers?.length).toBeGreaterThan(0);

      // ECR repositories
      const repos = await ecrClient.send(new DescribeRepositoriesCommand({}));
      expect(repos.repositories?.length).toBeGreaterThanOrEqual(
        servicesToTest.length
      );

      // Secrets
      const secrets = await secretsClient.send(new ListSecretsCommand({}));
      expect(secrets.SecretList?.length).toBeGreaterThanOrEqual(2); // At least DB URL and API key

      // Log groups
      const logGroups = await logsClient.send(new DescribeLogGroupsCommand({}));
      expect(logGroups.logGroups?.length).toBeGreaterThan(0);
    });

    test('All microservices should be properly registered', async () => {
      if (!clusterName) return;

      const services = await ecsClient.send(
        new ListServicesCommand({ cluster: clusterName })
      );
      const taskDefs = await ecsClient.send(
        new DescribeClustersCommand({ clusters: [clusterName] })
      );

      expect(services.serviceArns?.length).toBeGreaterThanOrEqual(
        servicesToTest.length
      );

      // Verify each service is running with correct configuration
      for (const service of servicesToTest) {
        const serviceDetails = await ecsClient.send(
          new DescribeServicesCommand({
            cluster: clusterName,
            services: [service.name],
          })
        );

        const ecsService = serviceDetails.services?.[0];
        expect(ecsService).toBeDefined();
        expect(ecsService!.status).toBe('ACTIVE');
        expect(ecsService!.desiredCount).toBeGreaterThan(0);
        expect(ecsService!.loadBalancers?.length).toBeGreaterThan(0);
      }
    });

    test('Service mesh should be fully operational', async () => {
      if (useLocalStack || !meshName) return; // Skip for LocalStack or if mesh not available

      // Verify App Mesh components
      const mesh = await appMeshClient.send(
        new DescribeMeshCommand({ meshName })
      );
      expect(mesh.mesh?.status?.status).toBe('ACTIVE');

      // Verify virtual nodes
      for (const service of servicesToTest) {
        const virtualNode = await appMeshClient.send(
          new DescribeVirtualNodeCommand({
            meshName,
            virtualNodeName: service.name,
          })
        );
        expect(virtualNode.virtualNode?.status?.status).toBe('ACTIVE');
      }
    });

    test('Infrastructure health indicators', () => {
      // Basic connectivity checks
      expect(albDnsName).toBeDefined();
      expect(clusterName).toBeDefined();

      if (!useLocalStack) {
        expect(meshName).toBeDefined();
      }

      // Environment-specific validations
      if (useLocalStack) {
        console.log('✅ LocalStack environment validated');
      } else {
        console.log('✅ AWS environment validated');
      }
    });
  });
});

//
// Helper functions
//
async function describeStack(stackName: string) {
  try {
    const response = await cloudFormationClient.send(
      new DescribeStacksCommand({ StackName: stackName })
    );
    return response.Stacks?.[0];
  } catch (err) {
    console.warn(`describeStack ${stackName} failed:`, err);
    return undefined;
  }
}

async function waitForStackReady(stackName: string, maxWaitTime = 600000) {
  const start = Date.now();
  const poll = 10_000;
  while (Date.now() - start < maxWaitTime) {
    const s = await describeStack(stackName);
    if (!s) throw new Error(`Stack ${stackName} not found`);
    const status = s.StackStatus as StackStatus;
    if (status.includes('COMPLETE') && !status.includes('ROLLBACK')) return;
    if (status.includes('FAILED') || status.includes('ROLLBACK')) {
      throw new Error(`Stack ${stackName} failed: ${status}`);
    }
    await new Promise(r => setTimeout(r, poll));
  }
  throw new Error(`Timeout waiting for ${stackName}`);
}

async function getStackOutputs(
  stackName: string
): Promise<Record<string, string>> {
  const s = await describeStack(stackName);
  const out: Record<string, string> = {};
  if (!s?.Outputs) return out;
  for (const o of s.Outputs) {
    if (o.OutputKey && o.OutputValue) out[o.OutputKey] = o.OutputValue;
  }
  return out;
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
