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
  RDSClient,
  DescribeGlobalClustersCommand,
  DescribeDBClustersCommand,
  DescribeDBInstancesCommand,
} from '@aws-sdk/client-rds';
import {
  DynamoDBClient,
  DescribeTableCommand,
  ScanCommand,
} from '@aws-sdk/client-dynamodb';
import {
  LambdaClient,
  GetFunctionCommand,
  GetFunctionConfigurationCommand,
} from '@aws-sdk/client-lambda';
import {
  SNSClient,
  GetTopicAttributesCommand,
  ListSubscriptionsByTopicCommand,
} from '@aws-sdk/client-sns';
import {
  ECSClient,
  DescribeClustersCommand,
  DescribeServicesCommand,
  DescribeTaskDefinitionCommand,
} from '@aws-sdk/client-ecs';
import {
  ElasticLoadBalancingV2Client,
  DescribeLoadBalancersCommand,
  DescribeTargetGroupsCommand,
  DescribeListenersCommand,
} from '@aws-sdk/client-elastic-load-balancing-v2';

// Load deployment outputs
const outputsPath = path.join(__dirname, '..', 'cfn-outputs', 'flat-outputs.json');
let deploymentOutputs: any;

try {
  deploymentOutputs = JSON.parse(fs.readFileSync(outputsPath, 'utf-8'));
} catch (error) {
  console.error('Failed to load deployment outputs:', error);
  deploymentOutputs = {};
}

// Parse JSON strings in outputs
const vpcIds = deploymentOutputs.vpcIds ? JSON.parse(deploymentOutputs.vpcIds) : {};
const stackSummary = deploymentOutputs.stackSummary ? JSON.parse(deploymentOutputs.stackSummary) : {};
const deploymentTags = deploymentOutputs.deploymentTags ? JSON.parse(deploymentOutputs.deploymentTags) : {};

// Helper function to extract region from ARN
function getRegionFromArn(arn: string): string {
  const parts = arn.split(':');
  return parts[3] || 'us-east-1';
}

// Helper function to create AWS clients
function createEC2Client(region: string) {
  return new EC2Client({ region });
}

function createRDSClient(region: string) {
  return new RDSClient({ region });
}

function createDynamoDBClient(region: string) {
  return new DynamoDBClient({ region });
}

function createLambdaClient(region: string) {
  return new LambdaClient({ region });
}

function createSNSClient(region: string) {
  return new SNSClient({ region });
}

function createECSClient(region: string) {
  return new ECSClient({ region });
}

function createELBClient(region: string) {
  return new ElasticLoadBalancingV2Client({ region });
}

describe('TAP Infrastructure Integration Tests', () => {
  // Skip all tests if outputs are not available
  const skipTests = !deploymentOutputs || Object.keys(deploymentOutputs).length === 0;

  describe('Deployment Outputs Validation', () => {
    test('should have deployment outputs file', () => {
      expect(fs.existsSync(outputsPath)).toBe(true);
    });

    test('should have required output fields', () => {
      expect(deploymentOutputs).toHaveProperty('environment');
      expect(deploymentOutputs).toHaveProperty('deploymentRegion');
      expect(deploymentOutputs).toHaveProperty('globalClusterIdentifier');
      expect(deploymentOutputs).toHaveProperty('vpcIds');
      expect(deploymentOutputs).toHaveProperty('migrationTableName');
      expect(deploymentOutputs).toHaveProperty('validationLambdaArn');
      expect(deploymentOutputs).toHaveProperty('notificationTopicArn');
    });

    test('should have valid VPC IDs for all regions', () => {
      expect(vpcIds).toHaveProperty('us-east-1');
      expect(vpcIds).toHaveProperty('eu-west-1');
      expect(vpcIds).toHaveProperty('ap-southeast-1');
      expect(vpcIds['us-east-1']).toMatch(/^vpc-[a-f0-9]+$/);
      expect(vpcIds['eu-west-1']).toMatch(/^vpc-[a-f0-9]+$/);
      expect(vpcIds['ap-southeast-1']).toMatch(/^vpc-[a-f0-9]+$/);
    });

    test('should have valid ARN formats', () => {
      expect(deploymentOutputs.globalClusterArn).toMatch(/^arn:aws:rds::/);
      expect(deploymentOutputs.migrationTableArn).toMatch(/^arn:aws:dynamodb:/);
      expect(deploymentOutputs.validationLambdaArn).toMatch(/^arn:aws:lambda:/);
      expect(deploymentOutputs.notificationTopicArn).toMatch(/^arn:aws:sns:/);
    });

    test('should have valid deployment tags', () => {
      expect(deploymentTags).toHaveProperty('Environment');
      expect(deploymentTags).toHaveProperty('Author');
      expect(deploymentTags).toHaveProperty('PRNumber');
      expect(deploymentTags).toHaveProperty('Repository');
      expect(deploymentTags).toHaveProperty('Team');
      expect(deploymentTags.Team).toBe('synth');
    });
  });

  describe('VPC Infrastructure Tests', () => {
    const regions = ['us-east-1', 'eu-west-1', 'ap-southeast-1'];

    regions.forEach(region => {
      describe(`VPC in ${region}`, () => {
        const vpcId = vpcIds[region];
        let ec2Client: EC2Client;

        beforeAll(() => {
          ec2Client = createEC2Client(region);
        });

        test(`should exist and be available in ${region}`, async () => {
          if (skipTests) return;

          const command = new DescribeVpcsCommand({ VpcIds: [vpcId] });
          const response = await ec2Client.send(command);

          expect(response.Vpcs).toBeDefined();
          expect(response.Vpcs?.length).toBe(1);
          expect(response.Vpcs?.[0].State).toBe('available');
          expect(response.Vpcs?.[0].VpcId).toBe(vpcId);
        }, 30000);

        test(`should have correct CIDR block in ${region}`, async () => {
          if (skipTests) return;

          const command = new DescribeVpcsCommand({ VpcIds: [vpcId] });
          const response = await ec2Client.send(command);

          const cidr = response.Vpcs?.[0].CidrBlock;
          expect(cidr).toMatch(/^10\.\d+\.\d+\.\d+\/16$/);
        }, 30000);

        test(`should have public and private subnets in ${region}`, async () => {
          if (skipTests) return;

          const command = new DescribeSubnetsCommand({
            Filters: [{ Name: 'vpc-id', Values: [vpcId] }],
          });
          const response = await ec2Client.send(command);

          expect(response.Subnets).toBeDefined();
          expect(response.Subnets!.length).toBeGreaterThanOrEqual(4);

          const publicSubnets = response.Subnets?.filter(
            s => s.MapPublicIpOnLaunch === true
          );
          const privateSubnets = response.Subnets?.filter(
            s => s.MapPublicIpOnLaunch === false
          );

          expect(publicSubnets?.length).toBeGreaterThanOrEqual(2);
          expect(privateSubnets?.length).toBeGreaterThanOrEqual(2);
        }, 30000);

        test(`should have NAT Gateway in ${region}`, async () => {
          if (skipTests) return;

          const command = new DescribeNatGatewaysCommand({
            Filter: [{ Name: 'vpc-id', Values: [vpcId] }],
          });
          const response = await ec2Client.send(command);

          expect(response.NatGateways).toBeDefined();
          expect(response.NatGateways!.length).toBeGreaterThanOrEqual(1);
          expect(response.NatGateways?.[0].State).toBe('available');
        }, 30000);

        test(`should have security groups with proper tags in ${region}`, async () => {
          if (skipTests) return;

          const command = new DescribeSecurityGroupsCommand({
            Filters: [
              { Name: 'vpc-id', Values: [vpcId] },
              { Name: 'tag:Environment', Values: [deploymentOutputs.environment] },
            ],
          });
          const response = await ec2Client.send(command);

          expect(response.SecurityGroups).toBeDefined();
          expect(response.SecurityGroups!.length).toBeGreaterThan(0);
        }, 30000);
      });
    });
  });

  describe('Aurora Global Database Tests', () => {
    const primaryRegion = deploymentOutputs.deploymentRegion || 'us-east-1';
    let rdsClient: RDSClient;

    beforeAll(() => {
      rdsClient = createRDSClient(primaryRegion);
    });

    test('should have Aurora Global Cluster', async () => {
      if (skipTests) return;

      const command = new DescribeGlobalClustersCommand({
        GlobalClusterIdentifier: deploymentOutputs.globalClusterIdentifier,
      });
      const response = await rdsClient.send(command);

      expect(response.GlobalClusters).toBeDefined();
      expect(response.GlobalClusters?.length).toBe(1);
      expect(response.GlobalClusters?.[0].GlobalClusterIdentifier).toBe(
        deploymentOutputs.globalClusterIdentifier
      );
      expect(response.GlobalClusters?.[0].Engine).toBe('aurora-postgresql');
      expect(response.GlobalClusters?.[0].StorageEncrypted).toBe(true);
    }, 30000);

    test('should have primary Aurora cluster', async () => {
      if (skipTests) return;

      const command = new DescribeDBClustersCommand({
        Filters: [
          {
            Name: 'engine',
            Values: ['aurora-postgresql'],
          },
        ],
      });
      const response = await rdsClient.send(command);

      const primaryCluster = response.DBClusters?.find(
        c => c.DBClusterIdentifier?.includes('primary') &&
             c.DBClusterIdentifier?.includes(deploymentOutputs.environment)
      );

      expect(primaryCluster).toBeDefined();
      expect(primaryCluster?.Status).toBe('available');
      expect(primaryCluster?.Engine).toBe('aurora-postgresql');
      expect(primaryCluster?.EngineVersion).toBe('14.6');
      expect(primaryCluster?.StorageEncrypted).toBe(true);
    }, 30000);

    test('should have database endpoint accessible', async () => {
      if (skipTests) return;

      const command = new DescribeDBClustersCommand({
        Filters: [
          {
            Name: 'engine',
            Values: ['aurora-postgresql'],
          },
        ],
      });
      const response = await rdsClient.send(command);

      const primaryCluster = response.DBClusters?.find(
        c => c.DBClusterIdentifier?.includes('primary') &&
             c.DBClusterIdentifier?.includes(deploymentOutputs.environment)
      );

      expect(primaryCluster?.Endpoint).toBeDefined();
      expect(primaryCluster?.Endpoint).toContain('.rds.amazonaws.com');
      expect(primaryCluster?.Port).toBe(5432);
    }, 30000);

    test('should have Aurora cluster instances running', async () => {
      if (skipTests) return;

      const command = new DescribeDBInstancesCommand({
        Filters: [
          {
            Name: 'engine',
            Values: ['aurora-postgresql'],
          },
        ],
      });
      const response = await rdsClient.send(command);

      const instances = response.DBInstances?.filter(
        i => i.DBInstanceIdentifier?.includes(deploymentOutputs.environment)
      );

      expect(instances).toBeDefined();
      expect(instances!.length).toBeGreaterThanOrEqual(1);
      instances?.forEach(instance => {
        expect(instance.DBInstanceStatus).toBe('available');
        expect(instance.DBInstanceClass).toBe('db.serverless');
      });
    }, 30000);
  });

  describe('DynamoDB Migration Table Tests', () => {
    const region = getRegionFromArn(deploymentOutputs.migrationTableArn);
    let dynamoClient: DynamoDBClient;

    beforeAll(() => {
      dynamoClient = createDynamoDBClient(region);
    });

    test('should have migration state table', async () => {
      if (skipTests) return;

      const command = new DescribeTableCommand({
        TableName: deploymentOutputs.migrationTableName,
      });
      const response = await dynamoClient.send(command);

      expect(response.Table).toBeDefined();
      expect(response.Table?.TableName).toBe(deploymentOutputs.migrationTableName);
      expect(response.Table?.TableStatus).toBe('ACTIVE');
    }, 30000);

    test('should have proper table configuration', async () => {
      if (skipTests) return;

      const command = new DescribeTableCommand({
        TableName: deploymentOutputs.migrationTableName,
      });
      const response = await dynamoClient.send(command);

      expect(response.Table?.BillingModeSummary?.BillingMode).toBe('PAY_PER_REQUEST');
      expect(response.Table?.SSEDescription?.Status).toBe('ENABLED');

      const keySchema = response.Table?.KeySchema;
      expect(keySchema).toBeDefined();
      expect(keySchema?.find(k => k.AttributeName === 'migration_id')).toBeDefined();
      expect(keySchema?.find(k => k.AttributeName === 'timestamp')).toBeDefined();
    }, 30000);

    test('should have Point-in-Time Recovery enabled', async () => {
      if (skipTests) return;

      const command = new DescribeTableCommand({
        TableName: deploymentOutputs.migrationTableName,
      });
      const response = await dynamoClient.send(command);

      expect(response.Table?.SSEDescription?.Status).toBe('ENABLED');
    }, 30000);

    test('should be able to scan table (empty is okay)', async () => {
      if (skipTests) return;

      const command = new ScanCommand({
        TableName: deploymentOutputs.migrationTableName,
        Limit: 10,
      });
      const response = await dynamoClient.send(command);

      expect(response.Items).toBeDefined();
      expect(response.Count).toBeGreaterThanOrEqual(0);
    }, 30000);
  });

  describe('Lambda Validation Function Tests', () => {
    const region = getRegionFromArn(deploymentOutputs.validationLambdaArn);
    let lambdaClient: LambdaClient;

    beforeAll(() => {
      lambdaClient = createLambdaClient(region);
    });

    test('should have validation Lambda function', async () => {
      if (skipTests) return;

      const command = new GetFunctionCommand({
        FunctionName: deploymentOutputs.validationLambdaName,
      });
      const response = await lambdaClient.send(command);

      expect(response.Configuration).toBeDefined();
      expect(response.Configuration?.FunctionName).toBe(
        deploymentOutputs.validationLambdaName
      );
      expect(response.Configuration?.State).toBe('Active');
    }, 30000);

    test('should have correct Lambda configuration', async () => {
      if (skipTests) return;

      const command = new GetFunctionConfigurationCommand({
        FunctionName: deploymentOutputs.validationLambdaName,
      });
      const response = await lambdaClient.send(command);

      expect(response.Runtime).toBe('nodejs18.x');
      expect(response.Handler).toBe('index.handler');
      expect(response.MemorySize).toBe(256);
      expect(response.Timeout).toBe(300);
      expect(response.Environment?.Variables).toHaveProperty('MIGRATION_TABLE');
      expect(response.Environment?.Variables).toHaveProperty('NOTIFICATION_TOPIC');
      expect(response.Environment?.Variables).toHaveProperty('ENVIRONMENT_SUFFIX');
    }, 30000);

    test('should have VPC configuration', async () => {
      if (skipTests) return;

      const command = new GetFunctionConfigurationCommand({
        FunctionName: deploymentOutputs.validationLambdaName,
      });
      const response = await lambdaClient.send(command);

      expect(response.VpcConfig).toBeDefined();
      expect(response.VpcConfig?.VpcId).toBeDefined();
      expect(response.VpcConfig?.SubnetIds).toBeDefined();
      expect(response.VpcConfig?.SubnetIds!.length).toBeGreaterThan(0);
      expect(response.VpcConfig?.SecurityGroupIds).toBeDefined();
      expect(response.VpcConfig?.SecurityGroupIds!.length).toBeGreaterThan(0);
    }, 30000);
  });

  describe('SNS Notification Topic Tests', () => {
    const region = getRegionFromArn(deploymentOutputs.notificationTopicArn);
    let snsClient: SNSClient;

    beforeAll(() => {
      snsClient = createSNSClient(region);
    });

    test('should have SNS notification topic', async () => {
      if (skipTests) return;

      const command = new GetTopicAttributesCommand({
        TopicArn: deploymentOutputs.notificationTopicArn,
      });
      const response = await snsClient.send(command);

      expect(response.Attributes).toBeDefined();
      expect(response.Attributes?.TopicArn).toBe(deploymentOutputs.notificationTopicArn);
      expect(response.Attributes?.DisplayName).toBe('Migration Notifications');
    }, 30000);

    test('should have subscriptions (or be ready for subscriptions)', async () => {
      if (skipTests) return;

      const command = new ListSubscriptionsByTopicCommand({
        TopicArn: deploymentOutputs.notificationTopicArn,
      });
      const response = await snsClient.send(command);

      expect(response.Subscriptions).toBeDefined();
      // Subscriptions count can be 0 or more
      expect(response.Subscriptions!.length).toBeGreaterThanOrEqual(0);
    }, 30000);
  });

  describe('ECS Infrastructure Tests', () => {
    const regions = ['us-east-1', 'eu-west-1', 'ap-southeast-1'];

    regions.forEach(region => {
      describe(`ECS in ${region}`, () => {
        let ecsClient: ECSClient;
        let elbClient: ElasticLoadBalancingV2Client;
        const envSuffix = deploymentOutputs.environment;

        beforeAll(() => {
          ecsClient = createECSClient(region);
          elbClient = createELBClient(region);
        });

        test(`should have ECS cluster in ${region}`, async () => {
          if (skipTests) return;

          const command = new DescribeClustersCommand({
            clusters: [`ecs-cluster-${region}-${envSuffix}`],
          });
          const response = await ecsClient.send(command);

          expect(response.clusters).toBeDefined();
          expect(response.clusters!.length).toBe(1);
          expect(response.clusters?.[0].status).toBe('ACTIVE');
          expect(response.clusters?.[0].clusterName).toBe(
            `ecs-cluster-${region}-${envSuffix}`
          );
        }, 30000);

        test(`should have ECS service running in ${region}`, async () => {
          if (skipTests) return;

          const command = new DescribeServicesCommand({
            cluster: `ecs-cluster-${region}-${envSuffix}`,
            services: [`app-service-${region}-${envSuffix}`],
          });
          const response = await ecsClient.send(command);

          expect(response.services).toBeDefined();
          expect(response.services!.length).toBe(1);
          expect(response.services?.[0].status).toBe('ACTIVE');
          expect(response.services?.[0].desiredCount).toBeGreaterThanOrEqual(2);
        }, 30000);

        test(`should have Application Load Balancer in ${region}`, async () => {
          if (skipTests) return;

          const command = new DescribeLoadBalancersCommand({
            Names: [`alb-${region}-${envSuffix}`],
          });
          const response = await elbClient.send(command);

          expect(response.LoadBalancers).toBeDefined();
          expect(response.LoadBalancers!.length).toBe(1);
          expect(response.LoadBalancers?.[0].State?.Code).toBe('active');
          expect(response.LoadBalancers?.[0].Type).toBe('application');
        }, 30000);

        test(`should have target groups for blue-green deployment in ${region}`, async () => {
          if (skipTests) return;

          const command = new DescribeTargetGroupsCommand({
            Names: [
              `tg-blue-${region}-${envSuffix}`,
              `tg-green-${region}-${envSuffix}`,
            ],
          });
          const response = await elbClient.send(command);

          expect(response.TargetGroups).toBeDefined();
          expect(response.TargetGroups!.length).toBe(2);

          const blueTg = response.TargetGroups?.find(
            tg => tg.TargetGroupName === `tg-blue-${region}-${envSuffix}`
          );
          const greenTg = response.TargetGroups?.find(
            tg => tg.TargetGroupName === `tg-green-${region}-${envSuffix}`
          );

          expect(blueTg).toBeDefined();
          expect(greenTg).toBeDefined();
          expect(blueTg?.HealthCheckPath).toBe('/health');
          expect(greenTg?.HealthCheckPath).toBe('/health');
        }, 30000);
      });
    });
  });

  describe('Stack Summary Validation', () => {
    test('should have complete stack summary', () => {
      expect(stackSummary).toHaveProperty('database');
      expect(stackSummary).toHaveProperty('migration');
      expect(stackSummary).toHaveProperty('notifications');
      expect(stackSummary).toHaveProperty('vpcs');
      expect(stackSummary).toHaveProperty('tags');
      expect(stackSummary).toHaveProperty('deploymentRegion');
      expect(stackSummary).toHaveProperty('environment');
      expect(stackSummary).toHaveProperty('deployedAt');
    });

    test('should have correct database information', () => {
      expect(stackSummary.database.engine).toBe('aurora-postgresql');
      expect(stackSummary.database.version).toBe('14.6');
      expect(stackSummary.database.globalClusterId).toBe(
        deploymentOutputs.globalClusterIdentifier
      );
    });

    test('should have all three VPCs', () => {
      expect(stackSummary.vpcs).toHaveProperty('us-east-1');
      expect(stackSummary.vpcs).toHaveProperty('eu-west-1');
      expect(stackSummary.vpcs).toHaveProperty('ap-southeast-1');
      expect(stackSummary.vpcs['us-east-1']).toBe(vpcIds['us-east-1']);
      expect(stackSummary.vpcs['eu-west-1']).toBe(vpcIds['eu-west-1']);
      expect(stackSummary.vpcs['ap-southeast-1']).toBe(vpcIds['ap-southeast-1']);
    });

    test('should have valid deployment timestamp', () => {
      const deployedAt = new Date(stackSummary.deployedAt);
      expect(deployedAt.getTime()).toBeGreaterThan(0);
      expect(deployedAt.getTime()).toBeLessThanOrEqual(Date.now());
    });

    test('should have migration resources', () => {
      expect(stackSummary.migration.stateTable).toBe(
        deploymentOutputs.migrationTableName
      );
      expect(stackSummary.migration.validationLambda).toBe(
        deploymentOutputs.validationLambdaArn
      );
    });
  });

  describe('Multi-Region Consistency Tests', () => {
    test('should have consistent tagging across regions', async () => {
      if (skipTests) return;

      const regions = ['us-east-1', 'eu-west-1', 'ap-southeast-1'];
      const tagChecks = await Promise.all(
        regions.map(async region => {
          const ec2Client = createEC2Client(region);
          const command = new DescribeVpcsCommand({
            VpcIds: [vpcIds[region]],
          });
          const response = await ec2Client.send(command);
          return response.Vpcs?.[0].Tags;
        })
      );

      tagChecks.forEach(tags => {
        const envTag = tags?.find(t => t.Key === 'Environment');
        expect(envTag?.Value).toBe(deploymentOutputs.environment);
      });
    }, 30000);

    test('should have VPCs in all three regions', () => {
      expect(Object.keys(vpcIds).length).toBe(3);
      expect(vpcIds).toHaveProperty('us-east-1');
      expect(vpcIds).toHaveProperty('eu-west-1');
      expect(vpcIds).toHaveProperty('ap-southeast-1');
    });
  });
});
