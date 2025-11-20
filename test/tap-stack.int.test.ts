/**
 * Integration tests for TapStack deployed resources
 *
 * These tests validate actual deployed AWS resources using real AWS SDK clients.
 * They use cfn-outputs/flat-outputs.json to get resource identifiers.
 *
 * NO MOCKING - All tests validate live AWS resources
 */

import { CloudWatchClient, GetDashboardCommand, ListDashboardsCommand } from '@aws-sdk/client-cloudwatch';
import { DescribeSubnetsCommand, DescribeVpcsCommand, EC2Client } from '@aws-sdk/client-ec2';
import { DescribeClustersCommand, DescribeServicesCommand, ECSClient } from '@aws-sdk/client-ecs';
import {
  DescribeLoadBalancersCommand,
  DescribeTargetGroupsCommand,
  ElasticLoadBalancingV2Client
} from '@aws-sdk/client-elastic-load-balancing-v2';
import { DescribeDBClustersCommand, RDSClient } from '@aws-sdk/client-rds';
import { GetTopicAttributesCommand, SNSClient } from '@aws-sdk/client-sns';
import * as fs from 'fs';
import * as path from 'path';

// Parse outputs file
function loadOutputs(): Record<string, any> {
  const outputsPath = path.join(__dirname, '..', 'cfn-outputs', 'flat-outputs.json');
  const rawData = fs.readFileSync(outputsPath, 'utf8');

  try {
    // Parse as JSON
    const outputs = JSON.parse(rawData);

    // Handle array fields that might be JSON-stringified
    if (outputs.publicSubnetIds && typeof outputs.publicSubnetIds === 'string') {
      outputs.publicSubnetIds = JSON.parse(outputs.publicSubnetIds);
    }
    if (outputs.privateSubnetIds && typeof outputs.privateSubnetIds === 'string') {
      outputs.privateSubnetIds = JSON.parse(outputs.privateSubnetIds);
    }

    return outputs;
  } catch (error) {
    console.error('Failed to parse outputs file:', error);
    return {};
  }
}

const outputs = loadOutputs();
const region = process.env.AWS_REGION || 'us-east-1';
const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'pr6886';

// Initialize AWS SDK clients
const ec2Client = new EC2Client({ region });
const ecsClient = new ECSClient({ region });
const elbClient = new ElasticLoadBalancingV2Client({ region });
const rdsClient = new RDSClient({ region });
const snsClient = new SNSClient({ region });
const cloudwatchClient = new CloudWatchClient({ region });

describe('TapStack Integration Tests - VPC and Networking', () => {
  test('VPC exists and has correct configuration', async () => {
    const vpcId = outputs.vpcId;
    expect(vpcId).toBeTruthy();
    expect(vpcId).toMatch(/^vpc-/);

    const response = await ec2Client.send(
      new DescribeVpcsCommand({ VpcIds: [vpcId] })
    );

    expect(response.Vpcs).toBeDefined();
    expect(response.Vpcs).toHaveLength(1);

    const vpc = response.Vpcs![0];
    expect(vpc.VpcId).toBe(vpcId);
    expect(vpc.State).toBe('available');
    expect(vpc.CidrBlock).toMatch(/^10\.\d+\.\d+\.\d+\/16$/);
  });

  test('Public subnets exist and are configured correctly', async () => {
    const publicSubnetIds = outputs.publicSubnetIds;
    expect(publicSubnetIds).toBeDefined();
    expect(Array.isArray(publicSubnetIds)).toBe(true);
    expect(publicSubnetIds).toHaveLength(3);

    const response = await ec2Client.send(
      new DescribeSubnetsCommand({ SubnetIds: publicSubnetIds })
    );

    expect(response.Subnets).toBeDefined();
    expect(response.Subnets).toHaveLength(3);

    response.Subnets!.forEach(subnet => {
      expect(subnet.VpcId).toBe(outputs.vpcId);
      expect(subnet.State).toBe('available');
      expect(subnet.MapPublicIpOnLaunch).toBe(true);
      expect(subnet.AvailabilityZone).toMatch(/us-east-1[a-c]/);
    });
  });

  test('Private subnets exist and are configured correctly', async () => {
    const privateSubnetIds = outputs.privateSubnetIds;
    expect(privateSubnetIds).toBeDefined();
    expect(Array.isArray(privateSubnetIds)).toBe(true);
    expect(privateSubnetIds).toHaveLength(3);

    const response = await ec2Client.send(
      new DescribeSubnetsCommand({ SubnetIds: privateSubnetIds })
    );

    expect(response.Subnets).toBeDefined();
    expect(response.Subnets).toHaveLength(3);

    response.Subnets!.forEach(subnet => {
      expect(subnet.VpcId).toBe(outputs.vpcId);
      expect(subnet.State).toBe('available');
      expect(subnet.MapPublicIpOnLaunch).toBe(false);
      expect(subnet.AvailabilityZone).toMatch(/us-east-1[a-c]/);
    });
  });
});

describe('TapStack Integration Tests - ECS Resources', () => {
  test('ECS cluster exists and is active', async () => {
    const clusterName = outputs.ecsClusterName;
    const clusterArn = outputs.ecsClusterArn;

    expect(clusterName).toBeTruthy();
    expect(clusterArn).toBeTruthy();
    expect(clusterName).toContain(environmentSuffix);
    expect(clusterArn).toMatch(/^arn:aws:ecs:/);

    const response = await ecsClient.send(
      new DescribeClustersCommand({ clusters: [clusterArn] })
    );

    expect(response.clusters).toBeDefined();
    expect(response.clusters).toHaveLength(1);

    const cluster = response.clusters![0];
    expect(cluster.clusterName).toBe(clusterName);
    expect(cluster.status).toBe('ACTIVE');
    expect(cluster.clusterArn).toBe(clusterArn);
  });

  test('ECS service exists and is running', async () => {
    const clusterArn = outputs.ecsClusterArn;
    const serviceName = outputs.ecsServiceName;

    expect(serviceName).toBeTruthy();
    expect(serviceName).toContain(environmentSuffix);

    const response = await ecsClient.send(
      new DescribeServicesCommand({
        cluster: clusterArn,
        services: [serviceName]
      })
    );

    expect(response.services).toBeDefined();
    expect(response.services).toHaveLength(1);

    const service = response.services![0];
    expect(service.serviceName).toBe(serviceName);
    expect(service.status).toBe('ACTIVE');
    expect(service.desiredCount).toBeGreaterThan(0);
  });
});

describe('TapStack Integration Tests - Load Balancer', () => {
  test('Application Load Balancer exists and is active', async () => {
    const albArn = outputs.albArn;
    const albDnsName = outputs.albDnsName;

    expect(albArn).toBeTruthy();
    expect(albDnsName).toBeTruthy();
    expect(albArn).toMatch(/^arn:aws:elasticloadbalancing:/);
    expect(albDnsName).toContain(environmentSuffix);

    const response = await elbClient.send(
      new DescribeLoadBalancersCommand({ LoadBalancerArns: [albArn] })
    );

    expect(response.LoadBalancers).toBeDefined();
    expect(response.LoadBalancers).toHaveLength(1);

    const alb = response.LoadBalancers![0];
    expect(alb.LoadBalancerArn).toBe(albArn);
    expect(alb.DNSName).toBe(albDnsName);
    expect(alb.State?.Code).toBe('active');
    expect(alb.Type).toBe('application');
    expect(alb.Scheme).toBe('internet-facing');
    expect(alb.VpcId).toBe(outputs.vpcId);
  });

  test('ALB has target groups configured', async () => {
    const albArn = outputs.albArn;

    const response = await elbClient.send(
      new DescribeTargetGroupsCommand({ LoadBalancerArn: albArn })
    );

    expect(response.TargetGroups).toBeDefined();
    expect(response.TargetGroups!.length).toBeGreaterThan(0);

    response.TargetGroups!.forEach(tg => {
      expect(tg.VpcId).toBe(outputs.vpcId);
      expect(tg.Protocol).toBe('HTTP');
      expect(tg.TargetType).toBe('ip');
    });
  });
});

describe('TapStack Integration Tests - Aurora Database', () => {
  test('Aurora cluster exists and is available', async () => {
    const clusterId = outputs.auroraClusterId;
    const endpoint = outputs.auroraEndpoint;
    const readerEndpoint = outputs.auroraReaderEndpoint;

    expect(clusterId).toBeTruthy();
    expect(endpoint).toBeTruthy();
    expect(readerEndpoint).toBeTruthy();
    expect(clusterId).toContain(environmentSuffix);
    expect(endpoint).toContain(clusterId);
    expect(readerEndpoint).toContain(clusterId);

    const response = await rdsClient.send(
      new DescribeDBClustersCommand({ DBClusterIdentifier: clusterId })
    );

    expect(response.DBClusters).toBeDefined();
    expect(response.DBClusters).toHaveLength(1);

    const cluster = response.DBClusters![0];
    expect(cluster.DBClusterIdentifier).toBe(clusterId);
    expect(cluster.Status).toBe('available');
    expect(cluster.Engine).toBe('aurora-postgresql');
    expect(cluster.Endpoint).toBe(endpoint);
    expect(cluster.ReaderEndpoint).toBe(readerEndpoint);
    // Aurora Serverless v2 doesn't set MultiAZ flag, check availability zones instead
    expect(cluster.AvailabilityZones).toBeDefined();
    expect(cluster.AvailabilityZones!.length).toBeGreaterThan(1);
  });

  test('Aurora cluster has correct subnet configuration', async () => {
    const clusterId = outputs.auroraClusterId;

    const response = await rdsClient.send(
      new DescribeDBClustersCommand({ DBClusterIdentifier: clusterId })
    );

    const cluster = response.DBClusters![0];
    expect(cluster.DBSubnetGroup).toBeTruthy();

    // Verify subnets are from private subnet list
    const privateSubnetIds = outputs.privateSubnetIds;
    cluster.DBSubnetGroup!.Subnets?.forEach(subnet => {
      expect(privateSubnetIds).toContain(subnet.SubnetIdentifier);
    });
  });

  test('Aurora cluster has backup configured', async () => {
    const clusterId = outputs.auroraClusterId;

    const response = await rdsClient.send(
      new DescribeDBClustersCommand({ DBClusterIdentifier: clusterId })
    );

    const cluster = response.DBClusters![0];
    expect(cluster.BackupRetentionPeriod).toBeGreaterThan(0);
    expect(cluster.PreferredBackupWindow).toBeTruthy();
  });
});

describe('TapStack Integration Tests - Monitoring', () => {
  test('SNS topic for drift alerts exists', async () => {
    const topicArn = outputs.snsTopicArn;

    expect(topicArn).toBeTruthy();
    expect(topicArn).toMatch(/^arn:aws:sns:/);
    expect(topicArn).toContain('drift-alerts');
    expect(topicArn).toContain(environmentSuffix);

    const response = await snsClient.send(
      new GetTopicAttributesCommand({ TopicArn: topicArn })
    );

    expect(response.Attributes).toBeDefined();
    expect(response.Attributes!.TopicArn).toBe(topicArn);
  });

  test('CloudWatch dashboard exists', async () => {
    const dashboardName = outputs.dashboardName;

    expect(dashboardName).toBeTruthy();
    expect(dashboardName).toContain(environmentSuffix);

    const listResponse = await cloudwatchClient.send(
      new ListDashboardsCommand({ DashboardNamePrefix: dashboardName })
    );

    expect(listResponse.DashboardEntries).toBeDefined();
    const dashboard = listResponse.DashboardEntries!.find(d => d.DashboardName === dashboardName);
    expect(dashboard).toBeDefined();
    expect(dashboard!.DashboardName).toBe(dashboardName);
  });

  test('CloudWatch dashboard has correct widgets', async () => {
    const dashboardName = outputs.dashboardName;

    const response = await cloudwatchClient.send(
      new GetDashboardCommand({ DashboardName: dashboardName })
    );

    expect(response.DashboardBody).toBeDefined();

    const dashboardBody = JSON.parse(response.DashboardBody!);
    expect(dashboardBody.widgets).toBeDefined();
    expect(Array.isArray(dashboardBody.widgets)).toBe(true);
    expect(dashboardBody.widgets.length).toBeGreaterThan(0);

    // Verify widgets contain relevant metrics
    const widgetText = JSON.stringify(dashboardBody.widgets);
    expect(widgetText).toContain('ECS');
    expect(widgetText).toContain('RDS');
  });
});

describe('TapStack Integration Tests - Resource Naming', () => {
  test('All resources include environmentSuffix in names', () => {
    const suffix = environmentSuffix;

    // Verify all outputs contain the environment suffix
    expect(outputs.vpcId).toBeTruthy();
    expect(outputs.ecsClusterName).toContain(suffix);
    expect(outputs.ecsServiceName).toContain(suffix);
    expect(outputs.auroraClusterId).toContain(suffix);
    expect(outputs.dashboardName).toContain(suffix);

    // Verify ARNs contain the suffix
    expect(outputs.ecsClusterArn).toContain(suffix);
    expect(outputs.albArn).toContain(suffix);
    expect(outputs.snsTopicArn).toContain(suffix);
  });

  test('DNS names and endpoints include environmentSuffix', () => {
    const suffix = environmentSuffix;

    expect(outputs.albDnsName).toContain(suffix);
    expect(outputs.auroraEndpoint).toContain(suffix);
    expect(outputs.auroraReaderEndpoint).toContain(suffix);
  });
});

describe('TapStack Integration Tests - Resource Connectivity', () => {
  test('ECS cluster and service are in the correct VPC', async () => {
    const clusterArn = outputs.ecsClusterArn;
    const serviceName = outputs.ecsServiceName;
    const expectedVpcId = outputs.vpcId;

    const response = await ecsClient.send(
      new DescribeServicesCommand({
        cluster: clusterArn,
        services: [serviceName]
      })
    );

    const service = response.services![0];

    // Verify network configuration
    expect(service.networkConfiguration).toBeDefined();
    expect(service.networkConfiguration!.awsvpcConfiguration).toBeDefined();

    const awsvpcConfig = service.networkConfiguration!.awsvpcConfiguration!;
    expect(awsvpcConfig.subnets).toBeDefined();

    // Verify subnets are in the correct VPC
    const subnets = awsvpcConfig.subnets!;
    const subnetResponse = await ec2Client.send(
      new DescribeSubnetsCommand({ SubnetIds: subnets })
    );

    subnetResponse.Subnets!.forEach(subnet => {
      expect(subnet.VpcId).toBe(expectedVpcId);
    });
  });

  test('ALB is in public subnets', async () => {
    const albArn = outputs.albArn;
    const publicSubnetIds = outputs.publicSubnetIds;

    const response = await elbClient.send(
      new DescribeLoadBalancersCommand({ LoadBalancerArns: [albArn] })
    );

    const alb = response.LoadBalancers![0];
    expect(alb.AvailabilityZones).toBeDefined();

    const albSubnetIds = alb.AvailabilityZones!.map(az => az.SubnetId);

    // Verify all ALB subnets are in the public subnet list
    albSubnetIds.forEach(subnetId => {
      expect(publicSubnetIds).toContain(subnetId);
    });
  });

  test('Aurora cluster is in private subnets', async () => {
    const clusterId = outputs.auroraClusterId;
    const privateSubnetIds = outputs.privateSubnetIds;

    const response = await rdsClient.send(
      new DescribeDBClustersCommand({ DBClusterIdentifier: clusterId })
    );

    const cluster = response.DBClusters![0];
    const dbSubnets = cluster.DBSubnetGroup!.Subnets || [];

    // Verify all DB subnets are in the private subnet list
    dbSubnets.forEach(subnet => {
      expect(privateSubnetIds).toContain(subnet.SubnetIdentifier);
    });
  });
});
