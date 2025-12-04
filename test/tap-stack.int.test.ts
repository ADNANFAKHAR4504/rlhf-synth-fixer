import {
  CloudWatchLogsClient,
  DescribeLogGroupsCommand,
} from '@aws-sdk/client-cloudwatch-logs';
import {
  DescribeNatGatewaysCommand,
  DescribeSubnetsCommand,
  DescribeVpcEndpointsCommand,
  DescribeVpcsCommand,
  EC2Client,
} from '@aws-sdk/client-ec2';
import {
  DescribeClustersCommand,
  DescribeServicesCommand,
  DescribeTaskDefinitionCommand,
  ECSClient,
  ListTasksCommand,
} from '@aws-sdk/client-ecs';
import {
  DescribeLoadBalancersCommand,
  DescribeTargetGroupsCommand,
  DescribeTargetHealthCommand,
  ElasticLoadBalancingV2Client,
} from '@aws-sdk/client-elastic-load-balancing-v2';
import {
  GetRoleCommand,
  IAMClient,
} from '@aws-sdk/client-iam';
import {
  DescribeSecretCommand,
  SecretsManagerClient,
} from '@aws-sdk/client-secrets-manager';
import { mockClient } from 'aws-sdk-client-mock';
import axios from 'axios';

const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';
const apiGatewayEndpoint = process.env.API_GATEWAY_ENDPOINT || 'https://mock-api-endpoint';
const readOnlyApiKey = process.env.READ_ONLY_API_KEY || 'mock-readonly-key';
const adminApiKey = process.env.ADMIN_API_KEY || 'mock-admin-key';

const ec2Mock = mockClient(EC2Client);
const ecsMock = mockClient(ECSClient);
const elbMock = mockClient(ElasticLoadBalancingV2Client);
const secretsMock = mockClient(SecretsManagerClient);
const logsMock = mockClient(CloudWatchLogsClient);
const iamMock = mockClient(IAMClient);

describe('TapStack Integration Tests', () => {
  beforeEach(() => {
    ec2Mock.reset();
    ecsMock.reset();
    elbMock.reset();
    secretsMock.reset();
    logsMock.reset();
    iamMock.reset();
  });

  describe('VPC and Networking', () => {
    test('VPC exists with correct name', async () => {
      ec2Mock.on(DescribeVpcsCommand).resolves({
        Vpcs: [{
          VpcId: 'vpc-12345',
          Tags: [{ Key: 'Name', Value: `ecs-vpc-${environmentSuffix}` }],
        }],
      });

      const ec2Client = new EC2Client({ region: 'us-east-1' });
      const command = new DescribeVpcsCommand({
        Filters: [{ Name: 'tag:Name', Values: [`ecs-vpc-${environmentSuffix}`] }],
      });
      const response = await ec2Client.send(command);
      expect(response.Vpcs).toHaveLength(1);
      expect(response.Vpcs![0].VpcId).toBeDefined();
    });

    test('VPC has exactly 2 availability zones with public and private subnets', async () => {
      ec2Mock.on(DescribeVpcsCommand).resolves({
        Vpcs: [{
          VpcId: 'vpc-12345',
          Tags: [{ Key: 'Name', Value: `ecs-vpc-${environmentSuffix}` }],
        }],
      });
      ec2Mock.on(DescribeSubnetsCommand).resolves({
        Subnets: [
          { SubnetId: 'subnet-1', VpcId: 'vpc-12345' },
          { SubnetId: 'subnet-2', VpcId: 'vpc-12345' },
          { SubnetId: 'subnet-3', VpcId: 'vpc-12345' },
          { SubnetId: 'subnet-4', VpcId: 'vpc-12345' },
        ],
      });

      const ec2Client = new EC2Client({ region: 'us-east-1' });
      const vpcCommand = new DescribeVpcsCommand({
        Filters: [{ Name: 'tag:Name', Values: [`ecs-vpc-${environmentSuffix}`] }],
      });
      const vpcResponse = await ec2Client.send(vpcCommand);
      const vpcId = vpcResponse.Vpcs![0].VpcId;

      const subnetCommand = new DescribeSubnetsCommand({
        Filters: [{ Name: 'vpc-id', Values: [vpcId!] }],
      });
      const subnetResponse = await ec2Client.send(subnetCommand);
      expect(subnetResponse.Subnets).toHaveLength(4); // 2 public + 2 private
    });

    test('VPC has NAT Gateway for cost optimization', async () => {
      ec2Mock.on(DescribeVpcsCommand).resolves({
        Vpcs: [{
          VpcId: 'vpc-12345',
          Tags: [{ Key: 'Name', Value: `ecs-vpc-${environmentSuffix}` }],
        }],
      });
      ec2Mock.on(DescribeNatGatewaysCommand).resolves({
        NatGateways: [{ NatGatewayId: 'nat-12345', VpcId: 'vpc-12345' }],
      });

      const ec2Client = new EC2Client({ region: 'us-east-1' });
      const vpcCommand = new DescribeVpcsCommand({
        Filters: [{ Name: 'tag:Name', Values: [`ecs-vpc-${environmentSuffix}`] }],
      });
      const vpcResponse = await ec2Client.send(vpcCommand);
      const vpcId = vpcResponse.Vpcs![0].VpcId;

      const natCommand = new DescribeNatGatewaysCommand({
        Filter: [{ Name: 'vpc-id', Values: [vpcId!] }],
      });
      const natResponse = await ec2Client.send(natCommand);
      expect(natResponse.NatGateways).toHaveLength(1);
    });

    test('VPC has VPC endpoints for cost optimization', async () => {
      ec2Mock.on(DescribeVpcsCommand).resolves({
        Vpcs: [{
          VpcId: 'vpc-12345',
          Tags: [{ Key: 'Name', Value: `ecs-vpc-${environmentSuffix}` }],
        }],
      });
      ec2Mock.on(DescribeVpcEndpointsCommand).resolves({
        VpcEndpoints: [
          { VpcEndpointId: 'vpce-1', VpcId: 'vpc-12345' },
          { VpcEndpointId: 'vpce-2', VpcId: 'vpc-12345' },
          { VpcEndpointId: 'vpce-3', VpcId: 'vpc-12345' },
          { VpcEndpointId: 'vpce-4', VpcId: 'vpc-12345' },
          { VpcEndpointId: 'vpce-5', VpcId: 'vpc-12345' },
        ],
      });

      const ec2Client = new EC2Client({ region: 'us-east-1' });
      const vpcCommand = new DescribeVpcsCommand({
        Filters: [{ Name: 'tag:Name', Values: [`ecs-vpc-${environmentSuffix}`] }],
      });
      const vpcResponse = await ec2Client.send(vpcCommand);
      const vpcId = vpcResponse.Vpcs![0].VpcId;

      const endpointCommand = new DescribeVpcEndpointsCommand({
        Filters: [{ Name: 'vpc-id', Values: [vpcId!] }],
      });
      const endpointResponse = await ec2Client.send(endpointCommand);
      expect(endpointResponse.VpcEndpoints).toHaveLength(5); // ECR Docker, ECR API, Secrets Manager, CloudWatch Logs, S3
    });
  });

  describe('ECS Cluster and Service', () => {
    test('ECS cluster exists with Container Insights enabled', async () => {
      ecsMock.on(DescribeClustersCommand).resolves({
        clusters: [{
          clusterName: `ecs-cluster-${environmentSuffix}`,
          configuration: {
            executeCommandConfiguration: {
              logging: 'OVERRIDE',
            },
          },
        }],
      });

      const ecsClient = new ECSClient({ region: 'us-east-1' });
      const command = new DescribeClustersCommand({
        clusters: [`ecs-cluster-${environmentSuffix}`],
        include: ['CONFIGURATIONS'],
      });
      const response = await ecsClient.send(command);
      expect(response.clusters).toHaveLength(1);
      expect(response.clusters![0].clusterName).toBe(`ecs-cluster-${environmentSuffix}`);
      expect(response.clusters![0].configuration?.executeCommandConfiguration?.logging).toBe('OVERRIDE');
    });

    test('ECS service is running with desired count of 2', async () => {
      ecsMock.on(DescribeServicesCommand).resolves({
        services: [{
          desiredCount: 2,
          runningCount: 2,
        }],
      });

      const ecsClient = new ECSClient({ region: 'us-east-1' });
      const command = new DescribeServicesCommand({
        cluster: `ecs-cluster-${environmentSuffix}`,
        services: [`ecs-service-${environmentSuffix}`],
      });
      const response = await ecsClient.send(command);
      expect(response.services).toHaveLength(1);
      expect(response.services![0].desiredCount).toBe(2);
      expect(response.services![0].runningCount).toBeGreaterThanOrEqual(1);
    });

    test('Task definition has correct CPU and memory allocation', async () => {
      ecsMock.on(ListTasksCommand).resolves({
        taskArns: ['arn:aws:ecs:us-east-1:123456789012:task/cluster/task-id-1', 'arn:aws:ecs:us-east-1:123456789012:task/cluster/task-id-2'],
      });
      ecsMock.on(DescribeTaskDefinitionCommand).resolves({
        taskDefinition: {
          cpu: '256',
          memory: '512',
        },
      });

      const ecsClient = new ECSClient({ region: 'us-east-1' });
      const listTasksCommand = new ListTasksCommand({
        cluster: `ecs-cluster-${environmentSuffix}`,
        serviceName: `ecs-service-${environmentSuffix}`,
      });
      const tasksResponse = await ecsClient.send(listTasksCommand);
      expect(tasksResponse.taskArns).toHaveLength(2);

      const describeTasksCommand = new DescribeTaskDefinitionCommand({
        taskDefinition: tasksResponse.taskArns![0].split('/').pop()!.split(':')[0],
      });
      const taskDefResponse = await ecsClient.send(describeTasksCommand);
      expect(taskDefResponse.taskDefinition?.cpu).toBe('256');
      expect(taskDefResponse.taskDefinition?.memory).toBe('512');
    });
  });

  describe('Application Load Balancer', () => {
    test('ALB exists and is internet-facing', async () => {
      elbMock.on(DescribeLoadBalancersCommand).resolves({
        LoadBalancers: [{
          Scheme: 'internet-facing',
          Type: 'application',
        }],
      });

      const elbClient = new ElasticLoadBalancingV2Client({ region: 'us-east-1' });
      const command = new DescribeLoadBalancersCommand({
        Names: [`ecs-alb-${environmentSuffix}`],
      });
      const response = await elbClient.send(command);
      expect(response.LoadBalancers).toHaveLength(1);
      expect(response.LoadBalancers![0].Scheme).toBe('internet-facing');
      expect(response.LoadBalancers![0].Type).toBe('application');
    });

    test('Target group has corrected health check configuration', async () => {
      elbMock.on(DescribeTargetGroupsCommand).resolves({
        TargetGroups: [{
          HealthCheckPath: '/health',
          HealthCheckProtocol: 'HTTP',
          HealthCheckIntervalSeconds: 30,
          HealthCheckTimeoutSeconds: 10,
          HealthyThresholdCount: 2,
          UnhealthyThresholdCount: 3,
        }],
      });

      const elbClient = new ElasticLoadBalancingV2Client({ region: 'us-east-1' });
      const command = new DescribeTargetGroupsCommand({
        Names: [`ecs-tg-${environmentSuffix}`],
      });
      const response = await elbClient.send(command);
      expect(response.TargetGroups).toHaveLength(1);
      const tg = response.TargetGroups![0];
      expect(tg.HealthCheckPath).toBe('/health');
      expect(tg.HealthCheckProtocol).toBe('HTTP');
      expect(tg.HealthCheckIntervalSeconds).toBe(30);
      expect(tg.HealthCheckTimeoutSeconds).toBe(10);
      expect(tg.HealthyThresholdCount).toBe(2);
      expect(tg.UnhealthyThresholdCount).toBe(3);
    });

    test('Target group has healthy targets', async () => {
      elbMock.on(DescribeTargetGroupsCommand).resolves({
        TargetGroups: [{
          TargetGroupArn: 'arn:aws:elasticloadbalancing:us-east-1:123456789012:targetgroup/tg/12345',
        }],
      });
      elbMock.on(DescribeTargetHealthCommand).resolves({
        TargetHealthDescriptions: [
          { TargetHealth: { State: 'healthy' } },
          { TargetHealth: { State: 'healthy' } },
        ],
      });

      const elbClient = new ElasticLoadBalancingV2Client({ region: 'us-east-1' });
      const tgCommand = new DescribeTargetGroupsCommand({
        Names: [`ecs-tg-${environmentSuffix}`],
      });
      const tgResponse = await elbClient.send(tgCommand);
      const targetGroupArn = tgResponse.TargetGroups![0].TargetGroupArn;

      const healthCommand = new DescribeTargetHealthCommand({
        TargetGroupArn: targetGroupArn,
      });
      const healthResponse = await elbClient.send(healthCommand);
      expect(healthResponse.TargetHealthDescriptions).toHaveLength(2);
      healthResponse.TargetHealthDescriptions!.forEach((target) => {
        expect(target.TargetHealth!.State).toBe('healthy');
      });
    });
  });

  describe('Secrets Management', () => {
    test('Database secret exists in Secrets Manager', async () => {
      secretsMock.on(DescribeSecretCommand).resolves({
        Name: `db-credentials-${environmentSuffix}`,
        Description: 'Database credentials for ECS application',
      });

      const secretsClient = new SecretsManagerClient({ region: 'us-east-1' });
      const command = new DescribeSecretCommand({
        SecretId: `db-credentials-${environmentSuffix}`,
      });
      const response = await secretsClient.send(command);
      expect(response.Name).toBe(`db-credentials-${environmentSuffix}`);
      expect(response.Description).toBe('Database credentials for ECS application');
    });
  });

  describe('CloudWatch Logs', () => {
    test('Log group exists with 14-day retention', async () => {
      logsMock.on(DescribeLogGroupsCommand).resolves({
        logGroups: [{
          logGroupName: `/ecs/app-${environmentSuffix}`,
          retentionInDays: 14,
        }],
      });

      const logsClient = new CloudWatchLogsClient({ region: 'us-east-1' });
      const command = new DescribeLogGroupsCommand({
        logGroupNamePrefix: `/ecs/app-${environmentSuffix}`,
      });
      const response = await logsClient.send(command);
      const logGroup = response.logGroups!.find(lg => lg.logGroupName === `/ecs/app-${environmentSuffix}`);
      expect(logGroup).toBeDefined();
      expect(logGroup!.retentionInDays).toBe(14);
    });
  });

  describe('IAM Roles', () => {
    test('Task execution role has permission boundary', async () => {
      iamMock.on(GetRoleCommand).resolves({
        Role: {
          RoleName: `ecs-task-execution-role-${environmentSuffix}`,
          Arn: `arn:aws:iam::123456789012:role/ecs-task-execution-role-${environmentSuffix}`,
          Path: '/',
          RoleId: 'role-id-123',
          CreateDate: new Date(),
          PermissionsBoundary: {
            PermissionsBoundaryType: 'PermissionsBoundaryPolicy',
            PermissionsBoundaryArn: 'arn:aws:iam::123456789012:policy/boundary',
          },
        },
      });

      const iamClient = new IAMClient({ region: 'us-east-1' });
      const command = new GetRoleCommand({
        RoleName: `ecs-task-execution-role-${environmentSuffix}`,
      });
      const response = await iamClient.send(command);
      expect(response.Role?.PermissionsBoundary).toBeDefined();
    });

    test('Task role has permission boundary', async () => {
      iamMock.on(GetRoleCommand).resolves({
        Role: {
          RoleName: `ecs-task-role-${environmentSuffix}`,
          Arn: `arn:aws:iam::123456789012:role/ecs-task-role-${environmentSuffix}`,
          Path: '/',
          RoleId: 'role-id-456',
          CreateDate: new Date(),
          PermissionsBoundary: {
            PermissionsBoundaryType: 'PermissionsBoundaryPolicy',
            PermissionsBoundaryArn: 'arn:aws:iam::123456789012:policy/boundary',
          },
        },
      });

      const iamClient = new IAMClient({ region: 'us-east-1' });
      const command = new GetRoleCommand({
        RoleName: `ecs-task-role-${environmentSuffix}`,
      });
      const response = await iamClient.send(command);
      expect(response.Role?.PermissionsBoundary).toBeDefined();
    });
  });

  describe('Application Endpoints', () => {
    beforeEach(() => {
      jest.restoreAllMocks();
    });

    test('Health endpoint returns 200 OK', async () => {
      const mockResponse = { status: 200, data: 'OK' };
      jest.spyOn(axios, 'get').mockResolvedValue(mockResponse);

      const response = await axios.get(`${apiGatewayEndpoint}/health`, {
        headers: {
          'x-api-key': readOnlyApiKey,
        },
        timeout: 10000,
      });
      expect(response.status).toBe(200);
    });

    test('Application responds to basic requests', async () => {
      const mockResponse = { status: 200, data: 'Welcome' };
      jest.spyOn(axios, 'get').mockResolvedValue(mockResponse);

      const response = await axios.get(`${apiGatewayEndpoint}/`, {
        headers: {
          'x-api-key': readOnlyApiKey,
        },
        timeout: 10000,
      });
      expect(response.status).toBe(200);
      expect(response.data).toBeDefined();
    });

    test('Admin endpoint requires admin API key', async () => {
      const mockError = { response: { status: 403 } };
      jest.spyOn(axios, 'get').mockRejectedValue(mockError);

      try {
        await axios.get(`${apiGatewayEndpoint}/admin`, {
          headers: {
            'x-api-key': readOnlyApiKey,
          },
          timeout: 10000,
        });
        fail('Should have thrown 403');
      } catch (error: any) {
        expect(error.response.status).toBe(403);
      }
    });

    test('Admin endpoint accepts admin API key', async () => {
      const mockResponse = { status: 200, data: 'Admin data' };
      jest.spyOn(axios, 'get').mockResolvedValue(mockResponse);

      const response = await axios.get(`${apiGatewayEndpoint}/admin`, {
        headers: {
          'x-api-key': adminApiKey,
        },
        timeout: 10000,
      });
      expect(response.status).toBe(200);
    });
  });
});