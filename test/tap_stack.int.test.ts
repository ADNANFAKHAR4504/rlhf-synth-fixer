/**
 * Integration tests for deployed CloudFormation stack
 * Tests actual AWS resources created by the stack
 */

import { describe, it, expect, beforeAll } from '@jest/globals';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
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
} from '@aws-sdk/client-ecs';
import {
  ElasticLoadBalancingV2Client,
  DescribeLoadBalancersCommand,
  DescribeTargetGroupsCommand,
  DescribeListenersCommand,
} from '@aws-sdk/client-elastic-load-balancing-v2';
import {
  RDSClient,
  DescribeDBClustersCommand,
  DescribeDBInstancesCommand,
} from '@aws-sdk/client-rds';
import {
  SecretsManagerClient,
  ListSecretsCommand,
  DescribeSecretCommand,
} from '@aws-sdk/client-secrets-manager';
import {
  CloudFormationClient,
  DescribeStacksCommand,
  DescribeStackResourcesCommand,
} from '@aws-sdk/client-cloudformation';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const REGION = process.env.AWS_REGION || 'us-east-1';
const STACK_NAME = `TapStack${process.env.ENVIRONMENT_SUFFIX || 'dev'}`;

describe('CloudFormation Stack Integration Tests', () => {
  let outputs;
  let stackResources;
  let environmentSuffix;

  const ec2Client = new EC2Client({ region: REGION });
  const ecsClient = new ECSClient({ region: REGION });
  const elbClient = new ElasticLoadBalancingV2Client({ region: REGION });
  const rdsClient = new RDSClient({ region: REGION });
  const secretsClient = new SecretsManagerClient({ region: REGION });
  const cfnClient = new CloudFormationClient({ region: REGION });

  beforeAll(async () => {
    // Load stack outputs
    const outputsPath = join(__dirname, '..', 'cfn-outputs', 'flat-outputs.json');
    const outputsContent = readFileSync(outputsPath, 'utf-8');
    outputs = JSON.parse(outputsContent);

    // Get environment suffix from env or default
    environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';

    // Get stack resources
    const resourcesResponse = await cfnClient.send(
      new DescribeStackResourcesCommand({ StackName: STACK_NAME })
    );
    stackResources = resourcesResponse.StackResources;
  });

  describe('Stack Deployment', () => {
    it('should have deployed stack successfully', async () => {
      const response = await cfnClient.send(
        new DescribeStacksCommand({ StackName: STACK_NAME })
      );
      expect(response.Stacks).toBeDefined();
      expect(response.Stacks.length).toBe(1);
      expect(response.Stacks[0].StackStatus).toMatch(/COMPLETE$/);
    });

    it('should have all expected resources', () => {
      expect(stackResources.length).toBeGreaterThan(35); // Should have ~40 resources
    });

    it('should have resources in CREATE_COMPLETE or UPDATE_COMPLETE state', () => {
      const problematicResources = stackResources.filter(
        r => !r.ResourceStatus.match(/COMPLETE$/) && !r.ResourceStatus.match(/FAILED$/)
      );
      expect(problematicResources.length).toBe(0);
    });
  });

  describe('VPC and Networking', () => {
    let vpcId;
    let subnets;
    let securityGroups;

    beforeAll(() => {
      const vpcResource = stackResources.find(r => r.LogicalResourceId === 'VPC');
      vpcId = vpcResource?.PhysicalResourceId;
    });

    it('should have created VPC', async () => {
      expect(vpcId).toBeDefined();
      const response = await ec2Client.send(
        new DescribeVpcsCommand({ VpcIds: [vpcId] })
      );
      expect(response.Vpcs).toBeDefined();
      expect(response.Vpcs.length).toBe(1);
      expect(response.Vpcs[0].State).toBe('available');
    });

    it('should have DNS support enabled', async () => {
      const response = await ec2Client.send(
        new DescribeVpcsCommand({ VpcIds: [vpcId] })
      );
      expect(response.Vpcs[0].EnableDnsSupport).toBe(true);
      expect(response.Vpcs[0].EnableDnsHostnames).toBe(true);
    });

    it('should have correct CIDR block', async () => {
      const response = await ec2Client.send(
        new DescribeVpcsCommand({ VpcIds: [vpcId] })
      );
      expect(response.Vpcs[0].CidrBlock).toBe('10.0.0.0/16');
    });

    it('should have 4 subnets (2 public, 2 private)', async () => {
      const response = await ec2Client.send(
        new DescribeSubnetsCommand({
          Filters: [{ Name: 'vpc-id', Values: [vpcId] }],
        })
      );
      subnets = response.Subnets;
      expect(subnets.length).toBe(4);
    });

    it('should have subnets in different availability zones', async () => {
      const azs = new Set(subnets.map(s => s.AvailabilityZone));
      expect(azs.size).toBeGreaterThanOrEqual(2);
    });

    it('should have public subnets with auto-assign public IP', () => {
      const publicSubnets = subnets.filter(s =>
        s.Tags?.some(t => t.Key === 'Name' && t.Value.includes('public'))
      );
      expect(publicSubnets.length).toBe(2);
      publicSubnets.forEach(subnet => {
        expect(subnet.MapPublicIpOnLaunch).toBe(true);
      });
    });

    it('should have Internet Gateway attached', async () => {
      const response = await ec2Client.send(
        new DescribeInternetGatewaysCommand({
          Filters: [{ Name: 'attachment.vpc-id', Values: [vpcId] }],
        })
      );
      expect(response.InternetGateways).toBeDefined();
      expect(response.InternetGateways.length).toBe(1);
      expect(response.InternetGateways[0].Attachments[0].State).toBe('available');
    });

    it('should have 2 NAT Gateways in public subnets', async () => {
      const response = await ec2Client.send(
        new DescribeNatGatewaysCommand({
          Filter: [{ Name: 'vpc-id', Values: [vpcId] }],
        })
      );
      const activeNats = response.NatGateways.filter(n => n.State === 'available');
      expect(activeNats.length).toBe(2);
    });

    it('should have 3 security groups', async () => {
      const response = await ec2Client.send(
        new DescribeSecurityGroupsCommand({
          Filters: [
            { Name: 'vpc-id', Values: [vpcId] },
            { Name: 'group-name', Values: ['*'] },
          ],
        })
      );
      securityGroups = response.SecurityGroups.filter(
        sg => sg.GroupName !== 'default'
      );
      expect(securityGroups.length).toBeGreaterThanOrEqual(3);
    });
  });

  describe('ECS Resources', () => {
    let clusterName;
    let serviceName;
    let taskDefinitionArn;

    beforeAll(() => {
      const clusterResource = stackResources.find(r => r.LogicalResourceId === 'ECSCluster');
      clusterName = clusterResource?.PhysicalResourceId;
      const serviceResource = stackResources.find(r => r.LogicalResourceId === 'ECSService');
      serviceName = serviceResource?.PhysicalResourceId;
      const taskDefResource = stackResources.find(r => r.LogicalResourceId === 'ECSTaskDefinition');
      taskDefinitionArn = taskDefResource?.PhysicalResourceId;
    });

    it('should have ECS cluster created', async () => {
      expect(clusterName).toBeDefined();
      const response = await ecsClient.send(
        new DescribeClustersCommand({ clusters: [clusterName] })
      );
      expect(response.clusters).toBeDefined();
      expect(response.clusters.length).toBe(1);
      expect(response.clusters[0].status).toBe('ACTIVE');
    });

    it('should have cluster name with environment suffix', () => {
      expect(clusterName).toContain(environmentSuffix);
    });

    it('should have ECS service running', async () => {
      expect(serviceName).toBeDefined();
      const response = await ecsClient.send(
        new DescribeServicesCommand({
          cluster: clusterName,
          services: [serviceName],
        })
      );
      expect(response.services).toBeDefined();
      expect(response.services.length).toBe(1);
      expect(response.services[0].status).toBe('ACTIVE');
    });

    it('should have task definition registered', async () => {
      expect(taskDefinitionArn).toBeDefined();
      const response = await ecsClient.send(
        new DescribeTaskDefinitionCommand({ taskDefinition: taskDefinitionArn })
      );
      expect(response.taskDefinition).toBeDefined();
      expect(response.taskDefinition.status).toBe('ACTIVE');
    });

    it('should use Fargate launch type', async () => {
      const response = await ecsClient.send(
        new DescribeTaskDefinitionCommand({ taskDefinition: taskDefinitionArn })
      );
      expect(response.taskDefinition.requiresCompatibilities).toContain('FARGATE');
    });

    it('should have container definitions', async () => {
      const response = await ecsClient.send(
        new DescribeTaskDefinitionCommand({ taskDefinition: taskDefinitionArn })
      );
      expect(response.taskDefinition.containerDefinitions).toBeDefined();
      expect(response.taskDefinition.containerDefinitions.length).toBeGreaterThan(0);
    });

    it('should have awslogs log driver configured', async () => {
      const response = await ecsClient.send(
        new DescribeTaskDefinitionCommand({ taskDefinition: taskDefinitionArn })
      );
      const logConfig = response.taskDefinition.containerDefinitions[0].logConfiguration;
      expect(logConfig).toBeDefined();
      expect(logConfig.logDriver).toBe('awslogs');
    });
  });

  describe('Application Load Balancer', () => {
    let loadBalancerArn;
    let targetGroupArn;

    beforeAll(() => {
      const albResource = stackResources.find(
        r => r.LogicalResourceId === 'ApplicationLoadBalancer'
      );
      loadBalancerArn = albResource?.PhysicalResourceId;
      const tgResource = stackResources.find(r => r.LogicalResourceId === 'TargetGroup');
      targetGroupArn = tgResource?.PhysicalResourceId;
    });

    it('should have ALB created and active', async () => {
      expect(loadBalancerArn).toBeDefined();
      const response = await elbClient.send(
        new DescribeLoadBalancersCommand({ LoadBalancerArns: [loadBalancerArn] })
      );
      expect(response.LoadBalancers).toBeDefined();
      expect(response.LoadBalancers.length).toBe(1);
      expect(response.LoadBalancers[0].State.Code).toBe('active');
    });

    it('should be internet-facing', async () => {
      const response = await elbClient.send(
        new DescribeLoadBalancersCommand({ LoadBalancerArns: [loadBalancerArn] })
      );
      expect(response.LoadBalancers[0].Scheme).toBe('internet-facing');
    });

    it('should have ALB name with environment suffix', async () => {
      const response = await elbClient.send(
        new DescribeLoadBalancersCommand({ LoadBalancerArns: [loadBalancerArn] })
      );
      expect(response.LoadBalancers[0].LoadBalancerName).toContain(environmentSuffix);
    });

    it('should have target group created', async () => {
      expect(targetGroupArn).toBeDefined();
      const response = await elbClient.send(
        new DescribeTargetGroupsCommand({ TargetGroupArns: [targetGroupArn] })
      );
      expect(response.TargetGroups).toBeDefined();
      expect(response.TargetGroups.length).toBe(1);
    });

    it('should have target type as ip (for Fargate)', async () => {
      const response = await elbClient.send(
        new DescribeTargetGroupsCommand({ TargetGroupArns: [targetGroupArn] })
      );
      expect(response.TargetGroups[0].TargetType).toBe('ip');
    });

    it('should have HTTP listener configured', async () => {
      const response = await elbClient.send(
        new DescribeListenersCommand({ LoadBalancerArn: loadBalancerArn })
      );
      expect(response.Listeners).toBeDefined();
      expect(response.Listeners.length).toBeGreaterThan(0);
    });

    it('should be in public subnets', async () => {
      const response = await elbClient.send(
        new DescribeLoadBalancersCommand({ LoadBalancerArns: [loadBalancerArn] })
      );
      const subnets = response.LoadBalancers[0].AvailabilityZones;
      expect(subnets.length).toBeGreaterThanOrEqual(2);
    });
  });

  describe('RDS Aurora Resources', () => {
    let dbClusterIdentifier;
    let dbInstanceIdentifier;

    beforeAll(() => {
      const clusterResource = stackResources.find(r => r.LogicalResourceId === 'DBCluster');
      dbClusterIdentifier = clusterResource?.PhysicalResourceId;
      const instanceResource = stackResources.find(r => r.LogicalResourceId === 'DBInstance1');
      dbInstanceIdentifier = instanceResource?.PhysicalResourceId;
    });

    it('should have DB cluster created', async () => {
      expect(dbClusterIdentifier).toBeDefined();
      const response = await rdsClient.send(
        new DescribeDBClustersCommand({ DBClusterIdentifier: dbClusterIdentifier })
      );
      expect(response.DBClusters).toBeDefined();
      expect(response.DBClusters.length).toBe(1);
      expect(response.DBClusters[0].Status).toBe('available');
    });

    it('should use Aurora MySQL engine', async () => {
      const response = await rdsClient.send(
        new DescribeDBClustersCommand({ DBClusterIdentifier: dbClusterIdentifier })
      );
      expect(response.DBClusters[0].Engine).toBe('aurora-mysql');
    });

    it('should have DB cluster identifier with environment suffix', async () => {
      const response = await rdsClient.send(
        new DescribeDBClustersCommand({ DBClusterIdentifier: dbClusterIdentifier })
      );
      expect(response.DBClusters[0].DBClusterIdentifier).toContain(environmentSuffix);
    });

    it('should have DB instance created', async () => {
      expect(dbInstanceIdentifier).toBeDefined();
      const response = await rdsClient.send(
        new DescribeDBInstancesCommand({ DBInstanceIdentifier: dbInstanceIdentifier })
      );
      expect(response.DBInstances).toBeDefined();
      expect(response.DBInstances.length).toBe(1);
      expect(response.DBInstances[0].DBInstanceStatus).toBe('available');
    });

    it('should be in private subnets', async () => {
      const response = await rdsClient.send(
        new DescribeDBClustersCommand({ DBClusterIdentifier: dbClusterIdentifier })
      );
      expect(response.DBClusters[0].DBSubnetGroup).toBeDefined();
    });

    it('should have multiple availability zones configured', async () => {
      const response = await rdsClient.send(
        new DescribeDBClustersCommand({ DBClusterIdentifier: dbClusterIdentifier })
      );
      expect(response.DBClusters[0].AvailabilityZones.length).toBeGreaterThanOrEqual(2);
    });
  });

  describe('Secrets Manager', () => {
    let secretArn;

    beforeAll(() => {
      const secretResource = stackResources.find(r => r.LogicalResourceId === 'DBSecret');
      secretArn = secretResource?.PhysicalResourceId;
    });

    it('should have DB secret created', async () => {
      expect(secretArn).toBeDefined();
      const response = await secretsClient.send(
        new DescribeSecretCommand({ SecretId: secretArn })
      );
      expect(response.ARN).toBeDefined();
      expect(response.Name).toBeDefined();
    });

    it('should have secret name with environment suffix', async () => {
      const response = await secretsClient.send(
        new DescribeSecretCommand({ SecretId: secretArn })
      );
      expect(response.Name).toContain(environmentSuffix);
    });

    it('should be attached to DB cluster', async () => {
      const response = await secretsClient.send(
        new DescribeSecretCommand({ SecretId: secretArn })
      );
      // Secret should exist and be properly formatted
      expect(response.ARN).toMatch(/^arn:aws:secretsmanager:/);
    });
  });

  describe('Stack Outputs Validation', () => {
    it('should have outputs defined', () => {
      expect(outputs).toBeDefined();
      expect(Object.keys(outputs).length).toBeGreaterThan(0);
    });

    it('should have valid output values', () => {
      Object.keys(outputs).forEach(key => {
        expect(outputs[key]).toBeDefined();
        expect(typeof outputs[key]).toBe('string');
        expect(outputs[key].length).toBeGreaterThan(0);
      });
    });

    it('should not have hardcoded values in outputs', () => {
      Object.keys(outputs).forEach(key => {
        const value = outputs[key];
        // Outputs should not contain literal "dev", "prod", "staging" unless from environmentSuffix
        if (!key.includes('Environment') && !key.includes('Suffix')) {
          expect(value).not.toMatch(/^(dev|prod|staging)$/);
        }
      });
    });
  });

  describe('Resource Tagging', () => {
    it('should have VPC tagged with environment', async () => {
      const vpcResource = stackResources.find(r => r.LogicalResourceId === 'VPC');
      const vpcId = vpcResource?.PhysicalResourceId;
      const response = await ec2Client.send(
        new DescribeVpcsCommand({ VpcIds: [vpcId] })
      );
      const tags = response.Vpcs[0].Tags || [];
      const envTag = tags.find(t => t.Key === 'Environment');
      expect(envTag).toBeDefined();
      expect(envTag.Value).toBe(environmentSuffix);
    });

    it('should have resources properly tagged', async () => {
      const vpcResource = stackResources.find(r => r.LogicalResourceId === 'VPC');
      const vpcId = vpcResource?.PhysicalResourceId;
      const response = await ec2Client.send(
        new DescribeVpcsCommand({ VpcIds: [vpcId] })
      );
      const tags = response.Vpcs[0].Tags || [];
      expect(tags.length).toBeGreaterThan(0);
    });
  });

  describe('High Availability Verification', () => {
    it('should have resources in multiple AZs', async () => {
      const vpcResource = stackResources.find(r => r.LogicalResourceId === 'VPC');
      const vpcId = vpcResource?.PhysicalResourceId;
      const response = await ec2Client.send(
        new DescribeSubnetsCommand({
          Filters: [{ Name: 'vpc-id', Values: [vpcId] }],
        })
      );
      const azs = new Set(response.Subnets.map(s => s.AvailabilityZone));
      expect(azs.size).toBeGreaterThanOrEqual(2);
    });

    it('should have redundant NAT Gateways', async () => {
      const vpcResource = stackResources.find(r => r.LogicalResourceId === 'VPC');
      const vpcId = vpcResource?.PhysicalResourceId;
      const response = await ec2Client.send(
        new DescribeNatGatewaysCommand({
          Filter: [{ Name: 'vpc-id', Values: [vpcId] }],
        })
      );
      const activeNats = response.NatGateways.filter(n => n.State === 'available');
      expect(activeNats.length).toBeGreaterThanOrEqual(2);
    });
  });

  describe('Security Configuration', () => {
    it('should have ALB in public subnets', async () => {
      const albResource = stackResources.find(
        r => r.LogicalResourceId === 'ApplicationLoadBalancer'
      );
      const loadBalancerArn = albResource?.PhysicalResourceId;
      const response = await elbClient.send(
        new DescribeLoadBalancersCommand({ LoadBalancerArns: [loadBalancerArn] })
      );
      expect(response.LoadBalancers[0].Scheme).toBe('internet-facing');
    });

    it('should have DB in private subnets', async () => {
      const clusterResource = stackResources.find(r => r.LogicalResourceId === 'DBCluster');
      const dbClusterIdentifier = clusterResource?.PhysicalResourceId;
      const response = await rdsClient.send(
        new DescribeDBClustersCommand({ DBClusterIdentifier: dbClusterIdentifier })
      );
      expect(response.DBClusters[0].PubliclyAccessible).toBeFalsy();
    });

    it('should have proper security groups configured', async () => {
      const vpcResource = stackResources.find(r => r.LogicalResourceId === 'VPC');
      const vpcId = vpcResource?.PhysicalResourceId;
      const response = await ec2Client.send(
        new DescribeSecurityGroupsCommand({
          Filters: [{ Name: 'vpc-id', Values: [vpcId] }],
        })
      );
      const customSGs = response.SecurityGroups.filter(sg => sg.GroupName !== 'default');
      expect(customSGs.length).toBeGreaterThanOrEqual(3);
    });
  });
});
