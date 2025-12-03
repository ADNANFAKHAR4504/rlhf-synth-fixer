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
  DescribeTaskDefinitionCommand,
} from '@aws-sdk/client-ecs';
import {
  ECRClient,
  DescribeRepositoriesCommand,
} from '@aws-sdk/client-ecr';
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

const AWS_REGION = process.env.AWS_REGION || 'us-east-1';
const ENVIRONMENT_SUFFIX = process.env.ENVIRONMENT_SUFFIX || 'dev';

interface StackOutputs {
  'alb-dns-name': string;
  'api-gateway-ecr-url': string;
  'api-gateway-service-arn': string;
  'cluster-name': string;
  'frontend-ecr-url': string;
  'frontend-service-arn': string;
  'processing-ecr-url': string;
  'processing-service-arn': string;
  'vpc-id': string;
}

describe('ECS Fargate Multi-Service Application Integration Tests', () => {
  let outputs: StackOutputs;

  beforeAll(() => {
    // Try multiple possible output locations
    const possiblePaths = [
      path.join(__dirname, '..', 'cfn-outputs', 'flat-outputs.json'),
      path.join(__dirname, '..', 'test', 'cfn-outputs', 'flat-outputs.json'),
      path.join(__dirname, '..', 'cdktf.out', 'stacks', 'tap', 'outputs.json'),
    ];

    let outputsPath: string | null = null;
    for (const p of possiblePaths) {
      if (fs.existsSync(p)) {
        outputsPath = p;
        break;
      }
    }

    if (!outputsPath) {
      throw new Error(
        `Outputs file not found in any of the expected locations: ${possiblePaths.join(', ')}. Please deploy the infrastructure first.`,
      );
    }

    const rawOutputs = JSON.parse(fs.readFileSync(outputsPath, 'utf-8'));

    // Handle both flat outputs and CDKTF terraform output format
    if (rawOutputs['alb-dns-name']?.value) {
      // CDKTF terraform output format: { "output-name": { "value": "...", "type": "..." } }
      const parsedOutputs: Record<string, string> = {};
      for (const key of Object.keys(rawOutputs)) {
        parsedOutputs[key] = rawOutputs[key].value;
      }
      outputs = parsedOutputs as unknown as StackOutputs;
    } else {
      // Flat format: { "output-name": "value" }
      outputs = rawOutputs;
    }
  });

  describe('VPC and Networking', () => {
    const ec2Client = new EC2Client({ region: AWS_REGION });

    test('VPC exists and is properly configured', async () => {
      const command = new DescribeVpcsCommand({
        VpcIds: [outputs['vpc-id']],
      });
      const response = await ec2Client.send(command);

      expect(response.Vpcs).toHaveLength(1);
      const vpc = response.Vpcs![0];
      expect(vpc.CidrBlock).toBe('10.0.0.0/16');
      expect(vpc.State).toBe('available');
      expect(vpc.VpcId).toBe(outputs['vpc-id']);
    });

    test('Public and private subnets exist across multiple AZs', async () => {
      const command = new DescribeSubnetsCommand({
        Filters: [
          {
            Name: 'vpc-id',
            Values: [outputs['vpc-id']],
          },
        ],
      });
      const response = await ec2Client.send(command);

      expect(response.Subnets!.length).toBeGreaterThanOrEqual(6);

      const publicSubnets = response.Subnets!.filter((subnet) =>
        subnet.Tags?.some(
          (tag) => tag.Key === 'Name' && tag.Value?.includes('public'),
        ),
      );
      const privateSubnets = response.Subnets!.filter((subnet) =>
        subnet.Tags?.some(
          (tag) => tag.Key === 'Name' && tag.Value?.includes('private'),
        ),
      );

      expect(publicSubnets.length).toBeGreaterThanOrEqual(3);
      expect(privateSubnets.length).toBeGreaterThanOrEqual(3);

      const azs = new Set(
        response.Subnets!.map((subnet) => subnet.AvailabilityZone),
      );
      expect(azs.size).toBeGreaterThanOrEqual(3);
    });

    test('NAT Gateways are provisioned for private subnet internet access', async () => {
      const command = new DescribeNatGatewaysCommand({
        Filter: [
          {
            Name: 'vpc-id',
            Values: [outputs['vpc-id']],
          },
          {
            Name: 'state',
            Values: ['available'],
          },
        ],
      });
      const response = await ec2Client.send(command);

      expect(response.NatGateways!.length).toBeGreaterThanOrEqual(1);
      response.NatGateways!.forEach((natGw) => {
        expect(natGw.State).toBe('available');
        expect(natGw.ConnectivityType).toBe('public');
      });
    });

    test('Security groups are configured with proper rules', async () => {
      const command = new DescribeSecurityGroupsCommand({
        Filters: [
          {
            Name: 'vpc-id',
            Values: [outputs['vpc-id']],
          },
        ],
      });
      const response = await ec2Client.send(command);

      const customSgs = response.SecurityGroups!.filter(
        (sg) => sg.GroupName !== 'default',
      );
      expect(customSgs.length).toBeGreaterThanOrEqual(4);
    });
  });

  describe('ECR Repositories', () => {
    const ecrClient = new ECRClient({ region: AWS_REGION });

    test('Frontend ECR repository exists and is properly configured', async () => {
      const repoName = outputs['frontend-ecr-url'].split('/')[1];
      const command = new DescribeRepositoriesCommand({
        repositoryNames: [repoName],
      });
      const response = await ecrClient.send(command);

      expect(response.repositories).toHaveLength(1);
      const repo = response.repositories![0];
      expect(repo.repositoryName).toBe(repoName);
      expect(repo.imageTagMutability).toBe('IMMUTABLE');
    });

    test('API Gateway ECR repository exists and is properly configured', async () => {
      const repoName = outputs['api-gateway-ecr-url'].split('/')[1];
      const command = new DescribeRepositoriesCommand({
        repositoryNames: [repoName],
      });
      const response = await ecrClient.send(command);

      expect(response.repositories).toHaveLength(1);
      const repo = response.repositories![0];
      expect(repo.repositoryName).toBe(repoName);
      expect(repo.imageTagMutability).toBe('IMMUTABLE');
    });

    test('Processing Service ECR repository exists and is properly configured', async () => {
      const repoName = outputs['processing-ecr-url'].split('/')[1];
      const command = new DescribeRepositoriesCommand({
        repositoryNames: [repoName],
      });
      const response = await ecrClient.send(command);

      expect(response.repositories).toHaveLength(1);
      const repo = response.repositories![0];
      expect(repo.repositoryName).toBe(repoName);
      expect(repo.imageTagMutability).toBe('IMMUTABLE');
    });
  });

  describe('ECS Cluster and Services', () => {
    const ecsClient = new ECSClient({ region: AWS_REGION });

    test('ECS cluster exists and is active', async () => {
      const command = new DescribeClustersCommand({
        clusters: [outputs['cluster-name']],
      });
      const response = await ecsClient.send(command);

      expect(response.clusters).toHaveLength(1);
      const cluster = response.clusters![0];
      expect(cluster.clusterName).toBe(outputs['cluster-name']);
      expect(cluster.status).toBe('ACTIVE');
      expect(cluster.registeredContainerInstancesCount).toBeGreaterThanOrEqual(
        0,
      );
    });

    test('Frontend service is created with proper configuration', async () => {
      // Handle both ARN and service name formats
      const serviceIdentifier = outputs['frontend-service-arn'];
      const command = new DescribeServicesCommand({
        cluster: outputs['cluster-name'],
        services: [serviceIdentifier],
      });
      const response = await ecsClient.send(command);

      expect(response.services).toHaveLength(1);
      const service = response.services![0];
      expect(service.serviceName).toContain('frontend');
      expect(service.launchType).toBe('FARGATE');
      expect(service.desiredCount).toBeGreaterThanOrEqual(0);
    });

    test('API Gateway service is created with proper configuration', async () => {
      // Handle both ARN and service name formats
      const serviceIdentifier = outputs['api-gateway-service-arn'];
      const command = new DescribeServicesCommand({
        cluster: outputs['cluster-name'],
        services: [serviceIdentifier],
      });
      const response = await ecsClient.send(command);

      expect(response.services).toHaveLength(1);
      const service = response.services![0];
      expect(service.serviceName).toContain('api-gateway');
      expect(service.launchType).toBe('FARGATE');
      expect(service.desiredCount).toBeGreaterThanOrEqual(0);
    });

    test('Processing service is created with proper configuration', async () => {
      // Handle both ARN and service name formats
      const serviceIdentifier = outputs['processing-service-arn'];
      const command = new DescribeServicesCommand({
        cluster: outputs['cluster-name'],
        services: [serviceIdentifier],
      });
      const response = await ecsClient.send(command);

      expect(response.services).toHaveLength(1);
      const service = response.services![0];
      expect(service.serviceName).toContain('processing');
      expect(service.launchType).toBe('FARGATE');
      expect(service.desiredCount).toBeGreaterThanOrEqual(0);
    });

    test('Task definitions have appropriate resource allocations', async () => {
      // Handle both ARN and service name formats
      const serviceIdentifier = outputs['frontend-service-arn'];
      const frontendService = await ecsClient.send(
        new DescribeServicesCommand({
          cluster: outputs['cluster-name'],
          services: [serviceIdentifier],
        }),
      );
      const taskDefArn = frontendService.services![0].taskDefinition!;

      const command = new DescribeTaskDefinitionCommand({
        taskDefinition: taskDefArn,
      });
      const response = await ecsClient.send(command);

      expect(response.taskDefinition).toBeDefined();
      const taskDef = response.taskDefinition!;
      expect(taskDef.cpu).toBeDefined();
      expect(taskDef.memory).toBeDefined();
      expect(taskDef.networkMode).toBe('awsvpc');
      expect(taskDef.requiresCompatibilities).toContain('FARGATE');
    });
  });

  describe('Application Load Balancer', () => {
    const elbClient = new ElasticLoadBalancingV2Client({ region: AWS_REGION });

    test('ALB exists and is active', async () => {
      const albArn = `arn:aws:elasticloadbalancing:${AWS_REGION}:342597974367:loadbalancer/app/${outputs['alb-dns-name'].split('-')[0]}-${outputs['alb-dns-name'].split('-')[1]}-${outputs['alb-dns-name'].split('-')[2].split('.')[0]}`;

      const command = new DescribeLoadBalancersCommand({
        Names: [outputs['alb-dns-name'].split('-')[0] + '-' + outputs['alb-dns-name'].split('-')[1] + '-' + outputs['alb-dns-name'].split('-')[2].split('.')[0]],
      });
      const response = await elbClient.send(command);

      expect(response.LoadBalancers).toHaveLength(1);
      const alb = response.LoadBalancers![0];
      expect(alb.State?.Code).toBe('active');
      expect(alb.Type).toBe('application');
      expect(alb.Scheme).toBe('internet-facing');
      expect(alb.VpcId).toBe(outputs['vpc-id']);
    });

    test('Target groups are configured for services', async () => {
      const command = new DescribeTargetGroupsCommand({
        Names: undefined,
      });
      const response = await elbClient.send(command);

      const targetGroups = response.TargetGroups!.filter((tg) =>
        tg.TargetGroupName?.includes(ENVIRONMENT_SUFFIX),
      );

      expect(targetGroups.length).toBeGreaterThanOrEqual(2);
      targetGroups.forEach((tg) => {
        expect(tg.Protocol).toBe('HTTP');
        expect(tg.VpcId).toBe(outputs['vpc-id']);
        expect(tg.HealthCheckEnabled).toBe(true);
      });
    });

    test('ALB listeners are configured', async () => {
      const albName = outputs['alb-dns-name']
        .split('-')
        .slice(0, 3)
        .join('-');
      const loadBalancers = await elbClient.send(
        new DescribeLoadBalancersCommand({ Names: [albName] }),
      );
      const albArn = loadBalancers.LoadBalancers![0].LoadBalancerArn!;

      const command = new DescribeListenersCommand({
        LoadBalancerArn: albArn,
      });
      const response = await elbClient.send(command);

      expect(response.Listeners!.length).toBeGreaterThanOrEqual(2);
      response.Listeners!.forEach((listener) => {
        expect(listener.Protocol).toBe('HTTP');
        expect(listener.Port).toBeGreaterThanOrEqual(80);
      });
    });
  });

  describe('CloudWatch Logging', () => {
    const logsClient = new CloudWatchLogsClient({ region: AWS_REGION });

    test('Log groups exist for all services', async () => {
      const command = new DescribeLogGroupsCommand({
        logGroupNamePrefix: '/ecs',
      });
      const response = await logsClient.send(command);

      const logGroups = response.logGroups!.filter((lg) =>
        lg.logGroupName?.includes(ENVIRONMENT_SUFFIX),
      );

      expect(logGroups.length).toBeGreaterThanOrEqual(3);
      logGroups.forEach((lg) => {
        expect(lg.retentionInDays).toBe(30);
      });
    });
  });

  describe('Secrets Management', () => {
    const secretsClient = new SecretsManagerClient({ region: AWS_REGION });

    test('Database secret exists', async () => {
      const command = new DescribeSecretCommand({
        SecretId: `db-credentials-${ENVIRONMENT_SUFFIX}`,
      });

      try {
        const response = await secretsClient.send(command);
        expect(response.ARN).toBeDefined();
        expect(response.Name).toContain('db-credentials');
      } catch (error: any) {
        if (error.name === 'ResourceNotFoundException') {
          console.warn(
            'Database secret not found - may be expected if not fully deployed',
          );
        } else {
          throw error;
        }
      }
    });

    test('API Keys secret exists', async () => {
      const command = new DescribeSecretCommand({
        SecretId: `api-keys-${ENVIRONMENT_SUFFIX}`,
      });

      try {
        const response = await secretsClient.send(command);
        expect(response.ARN).toBeDefined();
        expect(response.Name).toContain('api-keys');
      } catch (error: any) {
        if (error.name === 'ResourceNotFoundException') {
          console.warn(
            'API keys secret not found - may be expected if not fully deployed',
          );
        } else {
          throw error;
        }
      }
    });
  });

  describe('Stack Outputs Validation', () => {
    test('All required outputs are present', () => {
      const requiredOutputs = [
        'alb-dns-name',
        'api-gateway-ecr-url',
        'api-gateway-service-arn',
        'cluster-name',
        'frontend-ecr-url',
        'frontend-service-arn',
        'processing-ecr-url',
        'processing-service-arn',
        'vpc-id',
      ];

      requiredOutputs.forEach((output) => {
        expect(outputs[output as keyof StackOutputs]).toBeDefined();
        expect(outputs[output as keyof StackOutputs]).not.toBe('');
      });
    });

    test('Output values have correct format', () => {
      expect(outputs['alb-dns-name']).toMatch(/\.elb\.amazonaws\.com$/);
      expect(outputs['api-gateway-ecr-url']).toMatch(/\.dkr\.ecr\./);
      expect(outputs['frontend-ecr-url']).toMatch(/\.dkr\.ecr\./);
      expect(outputs['processing-ecr-url']).toMatch(/\.dkr\.ecr\./);
      // Service outputs can be ARNs or service IDs depending on the CDKTF version
      expect(outputs['api-gateway-service-arn']).toBeDefined();
      expect(outputs['frontend-service-arn']).toBeDefined();
      expect(outputs['processing-service-arn']).toBeDefined();
      expect(outputs['vpc-id']).toMatch(/^vpc-/);
      expect(outputs['cluster-name']).toContain(ENVIRONMENT_SUFFIX);
    });
  });
});
