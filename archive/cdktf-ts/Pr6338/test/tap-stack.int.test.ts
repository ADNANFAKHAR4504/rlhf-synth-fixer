/**
 * Integration Tests for Multi-Environment Infrastructure
 *
 * These tests validate the deployed infrastructure using AWS SDK to test live resources.
 * The tests read from cfn-outputs/flat-outputs.json and use ENVIRONMENT_SUFFIX from env variables
 * to work across different environments (dev, staging, prod, pr branches).
 */

import {
  ApiGatewayV2Client
} from '@aws-sdk/client-apigatewayv2';
import {
  CloudWatchClient,
  DescribeAlarmsCommand,
} from '@aws-sdk/client-cloudwatch';
import {
  DynamoDBClient
} from '@aws-sdk/client-dynamodb';
import {
  DescribeInternetGatewaysCommand,
  DescribeNatGatewaysCommand,
  DescribeRouteTablesCommand,
  DescribeSecurityGroupsCommand,
  DescribeSubnetsCommand,
  DescribeVpcAttributeCommand,
  DescribeVpcsCommand,
  EC2Client,
} from '@aws-sdk/client-ec2';
import {
  DescribeRepositoriesCommand,
  ECRClient,
  GetLifecyclePolicyCommand,
} from '@aws-sdk/client-ecr';
import {
  DescribeClustersCommand,
  DescribeTaskDefinitionCommand,
  ECSClient
} from '@aws-sdk/client-ecs';
import {
  DescribeListenersCommand,
  DescribeLoadBalancersCommand,
  DescribeTargetGroupsCommand,
  ElasticLoadBalancingV2Client,
} from '@aws-sdk/client-elastic-load-balancing-v2';
import { GetRoleCommand, IAMClient } from '@aws-sdk/client-iam';
import {
  LambdaClient
} from '@aws-sdk/client-lambda';
import {
  DescribeDBClustersCommand,
  DescribeDBSubnetGroupsCommand,
  RDSClient,
} from '@aws-sdk/client-rds';
import {
  GetBucketEncryptionCommand,
  GetBucketLifecycleConfigurationCommand,
  GetPublicAccessBlockCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import { GetParameterCommand, SSMClient } from '@aws-sdk/client-ssm';
import * as fs from 'fs';
import * as path from 'path';

// Read outputs from flat-outputs.json
const outputsPath = path.join(
  process.cwd(),
  'cfn-outputs',
  'flat-outputs.json',
);

// Get environment suffix and region from environment variables
const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';
const region = process.env.AWS_REGION || 'us-east-1';

// Check if outputs file exists
if (!fs.existsSync(outputsPath)) {
  console.warn(
    `⚠️ flat-outputs.json not found at ${outputsPath}. Integration tests will be skipped.`,
  );
  console.warn(
    'To run integration tests, deploy the infrastructure first and generate outputs.',
  );
}

describe('Multi-Environment Infrastructure Integration Tests', () => {
  let outputs: Record<string, any>;
  let ec2Client: EC2Client;
  let rdsClient: RDSClient;
  let ecsClient: ECSClient;
  let elbClient: ElasticLoadBalancingV2Client;
  let ecrClient: ECRClient;
  let s3Client: S3Client;
  let cloudwatchClient: CloudWatchClient;
  let iamClient: IAMClient;
  let ssmClient: SSMClient;
  let lambdaClient: LambdaClient;
  let dynamodbClient: DynamoDBClient;
  let apiGatewayClient: ApiGatewayV2Client;

  beforeAll(() => {
    if (!fs.existsSync(outputsPath)) {
      return;
    }

    const rawOutputs = JSON.parse(fs.readFileSync(outputsPath, 'utf8'));
    // The flat-outputs.json has a structure like: { "TapStackpr6338": { ... } }
    // We need to extract the nested object
    const stackKey = Object.keys(rawOutputs)[0];
    outputs = rawOutputs[stackKey];

    // Initialize AWS clients
    ec2Client = new EC2Client({ region });
    rdsClient = new RDSClient({ region });
    ecsClient = new ECSClient({ region });
    elbClient = new ElasticLoadBalancingV2Client({ region });
    ecrClient = new ECRClient({ region });
    s3Client = new S3Client({ region });
    cloudwatchClient = new CloudWatchClient({ region });
    iamClient = new IAMClient({ region });
    ssmClient = new SSMClient({ region });
    lambdaClient = new LambdaClient({ region });
    dynamodbClient = new DynamoDBClient({ region });
    apiGatewayClient = new ApiGatewayV2Client({ region });
  });

  afterAll(async () => {
    // Cleanup clients - call destroy() to release resources
    try {
      if (ec2Client) await ec2Client.destroy();
      if (rdsClient) await rdsClient.destroy();
      if (ecsClient) await ecsClient.destroy();
      if (elbClient) await elbClient.destroy();
      if (ecrClient) await ecrClient.destroy();
      if (s3Client) await s3Client.destroy();
      if (cloudwatchClient) await cloudwatchClient.destroy();
      if (iamClient) await iamClient.destroy();
      if (ssmClient) await ssmClient.destroy();
      if (lambdaClient) await lambdaClient.destroy();
      if (dynamodbClient) await dynamodbClient.destroy();
      if (apiGatewayClient) await apiGatewayClient.destroy();
    } catch (error) {
      // Ignore cleanup errors
    }
  });

  describe('VPC Resources', () => {
    test('should verify VPC exists with correct configuration', async () => {
      const vpcId = outputs.vpc_id;
      expect(vpcId).toBeDefined();
      expect(vpcId).toMatch(/^vpc-[a-f0-9]+$/);

      const response = await ec2Client.send(
        new DescribeVpcsCommand({
          VpcIds: [vpcId],
        }),
      );

      expect(response.Vpcs).toHaveLength(1);
      const vpc = response.Vpcs![0];
      expect(vpc.VpcId).toBe(vpcId);
      expect(vpc.State).toBe('available');

      // Check DNS attributes separately
      const dnsHostnamesAttr = await ec2Client.send(
        new DescribeVpcAttributeCommand({
          VpcId: vpcId,
          Attribute: 'enableDnsHostnames',
        }),
      );
      const dnsSupportAttr = await ec2Client.send(
        new DescribeVpcAttributeCommand({
          VpcId: vpcId,
          Attribute: 'enableDnsSupport',
        }),
      );
      expect(dnsHostnamesAttr.EnableDnsHostnames?.Value).toBe(true);
      expect(dnsSupportAttr.EnableDnsSupport?.Value).toBe(true);

      // Verify CIDR block matches environment
      const envSuffix = outputs.environment_suffix;
      const envName = outputs.environment_name;
      if (envName === 'dev' || !['staging', 'prod'].includes(envName)) {
        expect(vpc.CidrBlock).toBe('10.1.0.0/16');
      } else if (envName === 'staging') {
        expect(vpc.CidrBlock).toBe('10.2.0.0/16');
      } else if (envName === 'prod') {
        expect(vpc.CidrBlock).toBe('10.3.0.0/16');
      }

      // Verify VPC tags
      const nameTag = vpc.Tags?.find((tag) => tag.Key === 'Name');
      expect(nameTag).toBeDefined();
      expect(nameTag!.Value).toContain(envSuffix);
    });

    test('should verify subnets exist and are correctly configured', async () => {
      const vpcId = outputs.vpc_id;

      const response = await ec2Client.send(
        new DescribeSubnetsCommand({
          Filters: [{ Name: 'vpc-id', Values: [vpcId] }],
        }),
      );

      expect(response.Subnets).toBeDefined();
      expect(response.Subnets!.length).toBeGreaterThanOrEqual(6);

      // Verify public subnets (3 expected)
      const publicSubnets = response.Subnets!.filter((subnet) =>
        subnet.Tags?.some(
          (tag) => tag.Key === 'Type' && tag.Value === 'public',
        ),
      );
      expect(publicSubnets.length).toBe(3);

      // Verify private subnets (3 expected)
      const privateSubnets = response.Subnets!.filter((subnet) =>
        subnet.Tags?.some(
          (tag) => tag.Key === 'Type' && tag.Value === 'private',
        ),
      );
      expect(privateSubnets.length).toBe(3);

      // Verify public subnets have MapPublicIpOnLaunch enabled
      publicSubnets.forEach((subnet) => {
        expect(subnet.MapPublicIpOnLaunch).toBe(true);
      });

      // Verify private subnets don't auto-assign public IPs
      privateSubnets.forEach((subnet) => {
        expect(subnet.MapPublicIpOnLaunch).toBe(false);
      });

      // Verify all subnets are in available state
      response.Subnets!.forEach((subnet) => {
        expect(subnet.State).toBe('available');
      });
    });

    test('should verify Internet Gateway exists and is attached', async () => {
      const vpcId = outputs.vpc_id;

      const response = await ec2Client.send(
        new DescribeInternetGatewaysCommand({
          Filters: [{ Name: 'attachment.vpc-id', Values: [vpcId] }],
        }),
      );

      expect(response.InternetGateways).toHaveLength(1);
      const igw = response.InternetGateways![0];
      expect(igw.Attachments).toHaveLength(1);
      expect(igw.Attachments![0].State).toBe('available');
      expect(igw.Attachments![0].VpcId).toBe(vpcId);
    });

    test('should verify NAT Gateways exist in public subnets', async () => {
      const vpcId = outputs.vpc_id;

      const response = await ec2Client.send(
        new DescribeNatGatewaysCommand({
          Filter: [{ Name: 'vpc-id', Values: [vpcId] }],
        }),
      );

      expect(response.NatGateways).toBeDefined();
      const activeNatGateways = response.NatGateways!.filter(
        (nat) => nat.State === 'available',
      );
      expect(activeNatGateways.length).toBeGreaterThanOrEqual(1);

      // Verify NAT gateways have Elastic IPs
      activeNatGateways.forEach((nat) => {
        expect(nat.NatGatewayAddresses).toBeDefined();
        expect(nat.NatGatewayAddresses!.length).toBeGreaterThan(0);
        const hasPublicIp = nat.NatGatewayAddresses!.some(
          (addr) => addr.PublicIp,
        );
        expect(hasPublicIp).toBe(true);
      });
    });

    test('should verify route tables are correctly configured', async () => {
      const vpcId = outputs.vpc_id;

      const response = await ec2Client.send(
        new DescribeRouteTablesCommand({
          Filters: [{ Name: 'vpc-id', Values: [vpcId] }],
        }),
      );

      expect(response.RouteTables).toBeDefined();
      expect(response.RouteTables!.length).toBeGreaterThanOrEqual(4);

      // Find public route table (should have IGW route)
      const publicRouteTables = response.RouteTables!.filter((rt) =>
        rt.Routes?.some(
          (route) =>
            route.GatewayId &&
            route.GatewayId.startsWith('igw-') &&
            route.DestinationCidrBlock === '0.0.0.0/0',
        ),
      );
      expect(publicRouteTables.length).toBeGreaterThan(0);

      // Find private route tables (should have NAT gateway routes)
      const privateRouteTables = response.RouteTables!.filter((rt) =>
        rt.Routes?.some(
          (route) =>
            route.NatGatewayId &&
            route.NatGatewayId.startsWith('nat-') &&
            route.DestinationCidrBlock === '0.0.0.0/0',
        ),
      );
      expect(privateRouteTables.length).toBeGreaterThan(0);
    });
  });

  describe('Aurora RDS Resources', () => {
    test('should verify Aurora cluster exists and is available', async () => {
      const clusterArn = outputs.aurora_cluster_arn;
      const clusterEndpoint = outputs.aurora_cluster_endpoint;
      expect(clusterArn).toBeDefined();
      expect(clusterEndpoint).toBeDefined();

      // Extract cluster identifier from ARN
      const clusterIdentifier = clusterArn.split(':cluster:')[1];

      const response = await rdsClient.send(
        new DescribeDBClustersCommand({
          DBClusterIdentifier: clusterIdentifier,
        }),
      );

      expect(response.DBClusters).toHaveLength(1);
      const cluster = response.DBClusters![0];
      expect(cluster.Status).toBe('available');
      expect(cluster.Engine).toBe('aurora-postgresql');
      expect(cluster.EngineVersion).toContain('14.6');
      expect(cluster.DatabaseName).toBe('appdb');
      expect(cluster.MasterUsername).toBe('dbadmin');
      expect(cluster.StorageEncrypted).toBe(true);
      expect(cluster.Endpoint).toBe(clusterEndpoint);

      // Verify backup configuration
      expect(cluster.BackupRetentionPeriod).toBe(7);
      expect(cluster.PreferredBackupWindow).toBeDefined();
      expect(cluster.PreferredMaintenanceWindow).toBeDefined();

      // Verify cluster members (instances)
      expect(cluster.DBClusterMembers).toBeDefined();
      expect(cluster.DBClusterMembers!.length).toBeGreaterThan(0);
    });

    test('should verify Aurora DB subnet group configuration', async () => {
      const envSuffix = outputs.environment_suffix;
      const envName = outputs.environment_name;
      const subnetGroupName = `aurora-subnet-${envName}-${envSuffix}`;

      const response = await rdsClient.send(
        new DescribeDBSubnetGroupsCommand({
          DBSubnetGroupName: subnetGroupName,
        }),
      );

      expect(response.DBSubnetGroups).toHaveLength(1);
      const subnetGroup = response.DBSubnetGroups![0];
      expect(subnetGroup.DBSubnetGroupName).toBe(subnetGroupName);
      expect(subnetGroup.Subnets).toBeDefined();
      expect(subnetGroup.Subnets!.length).toBe(3);

      // Verify all subnets are in Active state
      subnetGroup.Subnets!.forEach((subnet) => {
        expect(subnet.SubnetStatus).toBe('Active');
      });
    });

    test('should verify Aurora security group allows VPC access on port 5432', async () => {
      const envSuffix = outputs.environment_suffix;
      const envName = outputs.environment_name;
      const vpcId = outputs.vpc_id;
      const sgName = `aurora-sg-${envName}-${envSuffix}`;

      const response = await ec2Client.send(
        new DescribeSecurityGroupsCommand({
          Filters: [
            { Name: 'vpc-id', Values: [vpcId] },
            { Name: 'group-name', Values: [sgName] },
          ],
        }),
      );

      expect(response.SecurityGroups).toHaveLength(1);
      const sg = response.SecurityGroups![0];

      // Verify ingress rule for PostgreSQL port
      const postgresRule = sg.IpPermissions?.find(
        (rule) => rule.FromPort === 5432 && rule.ToPort === 5432,
      );
      expect(postgresRule).toBeDefined();
      expect(postgresRule!.IpProtocol).toBe('tcp');

      // Verify egress allows all traffic
      const egressAllTraffic = sg.IpPermissionsEgress?.find(
        (rule) => rule.IpProtocol === '-1',
      );
      expect(egressAllTraffic).toBeDefined();
    });

    test(
      'should verify master password is stored in SSM Parameter Store',
      async () => {
        if (!fs.existsSync(outputsPath)) {
          console.warn('Skipping test - outputs file not found');
          return;
        }

        const envSuffix = outputs.environment_suffix;
        const parameterName = `/${envSuffix}/aurora/master-password`;

        const response = await ssmClient.send(
          new GetParameterCommand({
            Name: parameterName,
            WithDecryption: false,
          }),
        );

        expect(response.Parameter).toBeDefined();
        expect(response.Parameter!.Name).toBe(parameterName);
        expect(response.Parameter!.Type).toBe('SecureString');
      },
      60000,
    );
  });

  describe('ECS Resources', () => {
    test('should verify ECS cluster exists and is active', async () => {
      const clusterName = outputs.ecs_cluster_name;
      const clusterArn = outputs.ecs_cluster_arn;
      expect(clusterName).toBeDefined();
      expect(clusterArn).toBeDefined();

      const response = await ecsClient.send(
        new DescribeClustersCommand({
          clusters: [clusterArn],
        }),
      );

      expect(response.clusters).toHaveLength(1);
      const cluster = response.clusters![0];
      expect(cluster.clusterName).toBe(clusterName);
      expect(cluster.status).toBe('ACTIVE');
      expect(cluster.clusterArn).toBe(clusterArn);
    });

    test('should verify ECS task definition is configured correctly', async () => {
      const envSuffix = outputs.environment_suffix;
      const envName = outputs.environment_name;
      const taskFamily = `app-task-${envName}-${envSuffix}`;

      const response = await ecsClient.send(
        new DescribeTaskDefinitionCommand({
          taskDefinition: taskFamily,
        }),
      );

      expect(response.taskDefinition).toBeDefined();
      const taskDef = response.taskDefinition!;
      expect(taskDef.family).toBe(taskFamily);
      expect(taskDef.requiresCompatibilities).toContain('FARGATE');
      expect(taskDef.networkMode).toBe('awsvpc');
      expect(taskDef.cpu).toBeDefined();
      expect(taskDef.memory).toBeDefined();

      // Verify container definitions
      expect(taskDef.containerDefinitions).toHaveLength(1);
      const container = taskDef.containerDefinitions![0];
      expect(container.name).toBe('app');
      expect(container.portMappings).toBeDefined();
      const portMapping = container.portMappings!.find(
        (pm) => pm.containerPort === 8080,
      );
      expect(portMapping).toBeDefined();

      // Verify log configuration
      expect(container.logConfiguration).toBeDefined();
      expect(container.logConfiguration!.logDriver).toBe('awslogs');
    });

    test('should verify IAM roles for ECS tasks exist', async () => {
      const envSuffix = outputs.environment_suffix;
      const envName = outputs.environment_name;

      // Check execution role
      const executionRoleName = `ecs-execution-${envName}-${envSuffix}`;
      const executionRoleResponse = await iamClient.send(
        new GetRoleCommand({
          RoleName: executionRoleName,
        }),
      );
      expect(executionRoleResponse.Role).toBeDefined();
      expect(executionRoleResponse.Role!.RoleName).toBe(executionRoleName);

      // Check task role
      const taskRoleName = `ecs-task-${envName}-${envSuffix}`;
      const taskRoleResponse = await iamClient.send(
        new GetRoleCommand({
          RoleName: taskRoleName,
        }),
      );
      expect(taskRoleResponse.Role).toBeDefined();
      expect(taskRoleResponse.Role!.RoleName).toBe(taskRoleName);
    });
  });

  describe('Application Load Balancer Resources', () => {
    test('should verify ALB exists and is active', async () => {
      const albArn = outputs.alb_arn;
      const albDnsName = outputs.alb_dns_name;
      expect(albArn).toBeDefined();
      expect(albDnsName).toBeDefined();

      const response = await elbClient.send(
        new DescribeLoadBalancersCommand({
          LoadBalancerArns: [albArn],
        }),
      );

      expect(response.LoadBalancers).toHaveLength(1);
      const alb = response.LoadBalancers![0];
      expect(alb.State?.Code).toBe('active');
      expect(alb.Type).toBe('application');
      expect(alb.Scheme).toBe('internet-facing');
      expect(alb.DNSName).toBe(albDnsName);

      // Verify ALB is in public subnets
      expect(alb.AvailabilityZones).toBeDefined();
      expect(alb.AvailabilityZones!.length).toBeGreaterThanOrEqual(2);
    });

    test('should verify ALB target group is configured correctly', async () => {
      const albArn = outputs.alb_arn;

      const response = await elbClient.send(
        new DescribeTargetGroupsCommand({
          LoadBalancerArn: albArn,
        }),
      );

      expect(response.TargetGroups).toBeDefined();
      expect(response.TargetGroups!.length).toBeGreaterThan(0);

      const targetGroup = response.TargetGroups![0];
      expect(targetGroup.Protocol).toBe('HTTP');
      expect(targetGroup.Port).toBe(8080);
      expect(targetGroup.TargetType).toBe('ip');

      // Verify health check configuration
      expect(targetGroup.HealthCheckEnabled).toBe(true);
      expect(targetGroup.HealthCheckPath).toBe('/health');
      expect(targetGroup.HealthyThresholdCount).toBe(2);
      expect(targetGroup.UnhealthyThresholdCount).toBe(3);
    });

    test('should verify ALB listener is configured for HTTP', async () => {
      const albArn = outputs.alb_arn;

      const response = await elbClient.send(
        new DescribeListenersCommand({
          LoadBalancerArn: albArn,
        }),
      );

      expect(response.Listeners).toBeDefined();
      const httpListener = response.Listeners!.find(
        (listener) => listener.Port === 80 && listener.Protocol === 'HTTP',
      );
      expect(httpListener).toBeDefined();
      expect(httpListener!.DefaultActions).toBeDefined();
      expect(httpListener!.DefaultActions!.length).toBeGreaterThan(0);
    });

    test('should verify ALB security group allows HTTP/HTTPS', async () => {
      const envSuffix = outputs.environment_suffix;
      const envName = outputs.environment_name;
      const vpcId = outputs.vpc_id;
      const sgName = `alb-sg-${envName}-${envSuffix}`;

      const response = await ec2Client.send(
        new DescribeSecurityGroupsCommand({
          Filters: [
            { Name: 'vpc-id', Values: [vpcId] },
            { Name: 'group-name', Values: [sgName] },
          ],
        }),
      );

      expect(response.SecurityGroups).toHaveLength(1);
      const sg = response.SecurityGroups![0];

      // Verify HTTP ingress
      const httpRule = sg.IpPermissions?.find(
        (rule) => rule.FromPort === 80 && rule.ToPort === 80,
      );
      expect(httpRule).toBeDefined();

      // Verify HTTPS ingress
      const httpsRule = sg.IpPermissions?.find(
        (rule) => rule.FromPort === 443 && rule.ToPort === 443,
      );
      expect(httpsRule).toBeDefined();
    });
  });

  describe('ECR Resources', () => {
    test('should verify ECR repository exists', async () => {
      const repositoryUrl = outputs.ecr_repository_url;
      expect(repositoryUrl).toBeDefined();

      // Extract repository name from URL
      const repositoryName = repositoryUrl.split('/').pop();

      const response = await ecrClient.send(
        new DescribeRepositoriesCommand({
          repositoryNames: [repositoryName!],
        }),
      );

      expect(response.repositories).toHaveLength(1);
      const repo = response.repositories![0];
      expect(repo.repositoryName).toBe(repositoryName);
      expect(repo.imageScanningConfiguration?.scanOnPush).toBe(true);
    });

    test('should verify ECR lifecycle policy exists', async () => {
      const repositoryUrl = outputs.ecr_repository_url;
      const repositoryName = repositoryUrl.split('/').pop();

      const response = await ecrClient.send(
        new GetLifecyclePolicyCommand({
          repositoryName: repositoryName!,
        }),
      );

      expect(response.lifecyclePolicyText).toBeDefined();
      const policy = JSON.parse(response.lifecyclePolicyText!);
      expect(policy.rules).toBeDefined();
      expect(policy.rules.length).toBeGreaterThan(0);
    });
  });

  describe('S3 Resources', () => {
    test('should verify S3 bucket exists with encryption', async () => {
      const bucketName = outputs.s3_bucket_name;
      const bucketArn = outputs.s3_bucket_arn;
      expect(bucketName).toBeDefined();
      expect(bucketArn).toBeDefined();

      // Verify encryption
      const encryptionResponse = await s3Client.send(
        new GetBucketEncryptionCommand({
          Bucket: bucketName,
        }),
      );

      expect(encryptionResponse.ServerSideEncryptionConfiguration).toBeDefined();
      const rules =
        encryptionResponse.ServerSideEncryptionConfiguration!.Rules!;
      expect(rules.length).toBeGreaterThan(0);
      const sseRule = rules[0];
      expect(
        sseRule.ApplyServerSideEncryptionByDefault?.SSEAlgorithm,
      ).toBe('AES256');
    });

    test('should verify S3 bucket has public access blocked', async () => {
      const bucketName = outputs.s3_bucket_name;

      const response = await s3Client.send(
        new GetPublicAccessBlockCommand({
          Bucket: bucketName,
        }),
      );

      expect(response.PublicAccessBlockConfiguration).toBeDefined();
      const config = response.PublicAccessBlockConfiguration!;
      expect(config.BlockPublicAcls).toBe(true);
      expect(config.BlockPublicPolicy).toBe(true);
      expect(config.IgnorePublicAcls).toBe(true);
      expect(config.RestrictPublicBuckets).toBe(true);
    });

    test('should verify S3 bucket has lifecycle policies configured', async () => {
      const bucketName = outputs.s3_bucket_name;

      const response = await s3Client.send(
        new GetBucketLifecycleConfigurationCommand({
          Bucket: bucketName,
        }),
      );

      expect(response.Rules).toBeDefined();
      expect(response.Rules!.length).toBeGreaterThan(0);

      // Verify transition to STANDARD_IA exists
      const iaRule = response.Rules!.find((rule) =>
        rule.Transitions?.some((t) => t.StorageClass === 'STANDARD_IA'),
      );
      expect(iaRule).toBeDefined();

      // Verify transition to GLACIER exists
      const glacierRule = response.Rules!.find((rule) =>
        rule.Transitions?.some((t) => t.StorageClass === 'GLACIER'),
      );
      expect(glacierRule).toBeDefined();
    });
  });

  describe('CloudWatch Monitoring Resources', () => {
    test('should verify CloudWatch alarms exist for ECS and RDS', async () => {
      const envSuffix = outputs.environment_suffix;
      const envName = outputs.environment_name;

      const response = await cloudwatchClient.send(
        new DescribeAlarmsCommand({
          AlarmNamePrefix: `${envName}-`,
        }),
      );

      expect(response.MetricAlarms).toBeDefined();
      expect(response.MetricAlarms!.length).toBeGreaterThan(0);

      // Verify ECS CPU alarm exists
      const ecsCpuAlarm = response.MetricAlarms!.find((alarm) =>
        alarm.AlarmName?.includes(`${envName}-ecs-cpu-${envSuffix}`),
      );
      expect(ecsCpuAlarm).toBeDefined();
      expect(ecsCpuAlarm!.MetricName).toBe('CPUUtilization');
      expect(ecsCpuAlarm!.Namespace).toBe('AWS/ECS');

      // Verify ECS Memory alarm exists
      const ecsMemoryAlarm = response.MetricAlarms!.find((alarm) =>
        alarm.AlarmName?.includes(`${envName}-ecs-memory-${envSuffix}`),
      );
      expect(ecsMemoryAlarm).toBeDefined();
      expect(ecsMemoryAlarm!.MetricName).toBe('MemoryUtilization');

      // Verify RDS CPU alarm exists
      const rdsCpuAlarm = response.MetricAlarms!.find((alarm) =>
        alarm.AlarmName?.includes(`${envName}-rds-cpu-${envSuffix}`),
      );
      expect(rdsCpuAlarm).toBeDefined();
      expect(rdsCpuAlarm!.MetricName).toBe('CPUUtilization');
      expect(rdsCpuAlarm!.Namespace).toBe('AWS/RDS');
    });
  });

  describe('Resource Tagging and Naming', () => {
    test('should verify all resources include environment suffix in names', () => {
      const envSuffix = outputs.environment_suffix;
      expect(envSuffix).toBeDefined();

      // Verify outputs contain environment suffix
      expect(outputs.ecs_cluster_name).toContain(envSuffix);
      expect(outputs.s3_bucket_name).toContain(envSuffix);
      expect(outputs.ecr_repository_url).toContain(envSuffix);
      expect(outputs.alb_dns_name).toContain(envSuffix);
    });

    test('should verify environment name and suffix are exported', () => {
      expect(outputs.environment_name).toBeDefined();
      expect(outputs.environment_suffix).toBeDefined();
      expect(['dev', 'staging', 'prod']).toContain(outputs.environment_name);
    });
  });
});
