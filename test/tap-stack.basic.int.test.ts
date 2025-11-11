import * as pulumi from '@pulumi/pulumi';
import * as aws from '@pulumi/aws';
import { TapStack } from '../lib/tap-stack';

// Basic int test configuration
const testConfig = {
  stackName: 'tap-stack-basic-int-test',
  projectName: 'TapStack',
  region: 'us-west-2',
  environmentSuffix: `int-${Date.now()}`,
};

describe('TapStack Basic Int Tests', () => {
  let stack: pulumi.automation.Stack;
  let outputs: pulumi.automation.OutputMap;

  beforeAll(async () => {
    // Set up Pulumi automation API for int testing
    const pulumiProgram = async () => {
      // Create the stack
      const tapStack = new TapStack();

      // Return essential stack outputs for validation
      return {
        vpcId: tapStack.vpc.id,
        albDnsName: tapStack.alb.dnsName,
        ecsClusterName: tapStack.ecsCluster.name,
        rdsEndpoint: tapStack.rdsCluster.endpoint,
        cloudFrontDomain: tapStack.cloudFrontDistribution.domainName,
      };
    };

    // Create stack using automation API
    stack = await pulumi.automation.LocalWorkspace.createOrSelectStack({
      stackName: testConfig.stackName,
      projectName: testConfig.projectName,
      program: pulumiProgram,
    });

    // Set AWS region and environment suffix
    await stack.setConfig('aws:region', { value: testConfig.region });
    await stack.setConfig('environmentSuffix', {
      value: testConfig.environmentSuffix,
    });

    // Deploy the stack for int testing
    console.log('Deploying stack for basic int tests...');
    const upResult = await stack.up({ onOutput: console.log });
    outputs = upResult.outputs;
    console.log('Stack deployed successfully for int tests');
  }, 300000); // 5 minute timeout for deployment

  afterAll(async () => {
    // Clean up: destroy the int test stack
    if (stack) {
      console.log('Destroying int test stack...');
      await stack.destroy({ onOutput: console.log });
      console.log('Int test stack destroyed successfully');
    }
  }, 300000); // 5 minute timeout for cleanup

  describe('Core Infrastructure Int Tests', () => {
    test('VPC should be created and accessible', async () => {
      expect(outputs.vpcId).toBeDefined();
      expect(outputs.vpcId.value).toMatch(/^vpc-[a-f0-9]+$/);
    });

    test('ALB should be created with DNS name', async () => {
      expect(outputs.albDnsName).toBeDefined();
      expect(outputs.albDnsName.value).toMatch(
        /^[a-z0-9-]+\.[a-z0-9-]+\.elb\.amazonaws\.com$/,
      );
    });

    test('ECS cluster should be active', async () => {
      expect(outputs.ecsClusterName).toBeDefined();

      const ecsClient = new aws.ecs.EcsClient({ region: testConfig.region });
      const clusters = await ecsClient.describeClusters({
        clusters: [outputs.ecsClusterName.value as string],
      });

      expect(clusters.clusters).toHaveLength(1);
      expect(clusters.clusters[0].status).toBe('ACTIVE');
    });

    test('RDS cluster should be available', async () => {
      expect(outputs.rdsEndpoint).toBeDefined();

      const rdsClient = new aws.rds.RdsClient({ region: testConfig.region });
      const clusters = await rdsClient.describeDBClusters({
        DBClusterIdentifier: `payment-db-cluster-${testConfig.environmentSuffix}`,
      });

      expect(clusters.DBClusters).toHaveLength(1);
      expect(clusters.DBClusters[0].Status).toBe('available');
    });

    test('CloudFront distribution should be deployed', async () => {
      expect(outputs.cloudFrontDomain).toBeDefined();
      expect(outputs.cloudFrontDomain.value).toMatch(
        /^[a-z0-9]+\.cloudfront\.net$/,
      );
    });
  });

  describe('Security Int Tests', () => {
    test('RDS should have encryption enabled', async () => {
      const rdsClient = new aws.rds.RdsClient({ region: testConfig.region });
      const clusters = await rdsClient.describeDBClusters({
        DBClusterIdentifier: `payment-db-cluster-${testConfig.environmentSuffix}`,
      });

      expect(clusters.DBClusters[0].StorageEncrypted).toBe(true);
    });

    test('VPC should have flow logs enabled', async () => {
      const ec2Client = new aws.ec2.Ec2Client({ region: testConfig.region });
      const flowLogs = await ec2Client.describeFlowLogs({
        Filter: [
          {
            Name: 'resource-id',
            Values: [outputs.vpcId.value as string],
          },
        ],
      });

      expect(flowLogs.FlowLogs).toHaveLength(1);
      expect(flowLogs.FlowLogs[0].FlowLogStatus).toBe('ACTIVE');
    });
  });

  describe('High Availability Int Tests', () => {
    test('ECS service should have multiple tasks running', async () => {
      const ecsClient = new aws.ecs.EcsClient({ region: testConfig.region });
      const services = await ecsClient.describeServices({
        cluster: outputs.ecsClusterName.value as string,
        services: [`payment-api-${testConfig.environmentSuffix}`],
      });

      expect(services.services).toHaveLength(1);
      expect(services.services[0].runningCount).toBeGreaterThanOrEqual(2);
    });

    test('RDS should have Multi-AZ configuration', async () => {
      const rdsClient = new aws.rds.RdsClient({ region: testConfig.region });
      const instances = await rdsClient.describeDBInstances({
        Filters: [
          {
            Name: 'db-cluster-id',
            Values: [`payment-db-cluster-${testConfig.environmentSuffix}`],
          },
        ],
      });

      expect(instances.DBInstances?.length).toBeGreaterThanOrEqual(2);
    });
  });
});
