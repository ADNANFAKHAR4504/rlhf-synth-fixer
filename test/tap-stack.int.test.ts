// Multi-Region Trading Platform Integration Tests
// Tests the complete active-active infrastructure across two AWS regions
import fs from 'fs';
import axios from 'axios';
import {
  CloudFormationClient,
  DescribeStacksCommand,
} from '@aws-sdk/client-cloudformation';
import {
  EC2Client,
  DescribeTransitGatewaysCommand,
  DescribeTransitGatewayVpcAttachmentsCommand,
  DescribeRouteTablesCommand,
  DescribeVpcsCommand,
} from '@aws-sdk/client-ec2';
import {
  ECSClient,
  DescribeServicesCommand,
  DescribeClustersCommand,
} from '@aws-sdk/client-ecs';
import {
  RDSClient,
  DescribeGlobalClustersCommand,
  DescribeDBClustersCommand,
} from '@aws-sdk/client-rds';
import {
  ElasticLoadBalancingV2Client,
  DescribeLoadBalancersCommand,
  DescribeTargetHealthCommand,
  DescribeTargetGroupsCommand,
} from '@aws-sdk/client-elastic-load-balancing-v2';
import {
  SecretsManagerClient,
  GetSecretValueCommand,
} from '@aws-sdk/client-secrets-manager';

// Load outputs from primary region (from flat-outputs.json)
const primaryOutputs = JSON.parse(
  fs.readFileSync('cfn-outputs/flat-outputs.json', 'utf8')
);

// Fetch outputs from secondary region CloudFormation stack
const SECONDARY_REGION = 'ap-southeast-2';
const cfnSecondary = new CloudFormationClient({ region: SECONDARY_REGION });

// Get environment suffix and construct stack name
const ENVIRONMENT_SUFFIX = process.env.ENVIRONMENT_SUFFIX || 'dev';
const SECONDARY_STACK_NAME = process.env.SECONDARY_STACK_NAME || `TapStack${ENVIRONMENT_SUFFIX}`;

async function fetchSecondaryOutputs(): Promise<Record<string, string>> {
  const response = await cfnSecondary.send(
    new DescribeStacksCommand({
      StackName: SECONDARY_STACK_NAME,
    })
  );

  const outputs: Record<string, string> = {};
  const stack = response.Stacks?.[0];

  if (stack?.Outputs) {
    stack.Outputs.forEach((output) => {
      if (output.OutputKey && output.OutputValue) {
        outputs[output.OutputKey] = output.OutputValue;
      }
    });
  }

  return outputs;
}

// Fetch secondary outputs before tests run
let secondaryOutputs: Record<string, string> = {};

// Extract region-agnostic keys
const getOutputValue = (outputs: Record<string, string>, keyPattern: string): string => {
  const key = Object.keys(outputs).find(k => k.includes(keyPattern));
  if (!key) throw new Error(`Output key containing "${keyPattern}" not found`);
  return outputs[key];
};

// AWS Client configurations
const PRIMARY_REGION = 'ap-northeast-2';

const ec2Primary = new EC2Client({ region: PRIMARY_REGION });
const ec2Secondary = new EC2Client({ region: SECONDARY_REGION });
const ecsPrimary = new ECSClient({ region: PRIMARY_REGION });
const ecsSecondary = new ECSClient({ region: SECONDARY_REGION });
const rdsClient = new RDSClient({ region: PRIMARY_REGION });
const elbPrimary = new ElasticLoadBalancingV2Client({ region: PRIMARY_REGION });
const elbSecondary = new ElasticLoadBalancingV2Client({ region: SECONDARY_REGION });
const secretsClient = new SecretsManagerClient({ region: PRIMARY_REGION });

describe('Multi-Region Trading Platform - E2E Integration Tests', () => {
  // Fetch secondary region outputs before running tests
  beforeAll(async () => {
    secondaryOutputs = await fetchSecondaryOutputs();
    console.log(`Fetched ${Object.keys(secondaryOutputs).length} outputs from secondary region stack`);
  }, 30000); // 30 second timeout for fetching outputs

  describe('1. Global Accelerator - Global Traffic Routing', () => {
    const globalAcceleratorDNS = getOutputValue(primaryOutputs, 'GlobalAcceleratorDNS');
    const globalAcceleratorEndpoint = getOutputValue(primaryOutputs, 'GlobalAcceleratorEndpoint');

    test('Global Accelerator should respond with 200 OK', async () => {
      const response = await axios.get(globalAcceleratorEndpoint, { timeout: 10000 });
      expect(response.status).toBe(200);
    });

    test('Global Accelerator should have static IP addresses', () => {
      const ip1 = getOutputValue(primaryOutputs, 'GlobalAcceleratorIpAddress1');
      const ip2 = getOutputValue(primaryOutputs, 'GlobalAcceleratorIpAddress2');

      expect(ip1).toMatch(/^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/);
      expect(ip2).toMatch(/^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/);
      expect(ip1).not.toBe(ip2);
    });

    test('Global Accelerator DNS should be resolvable', async () => {
      const response = await axios.get(`http://${globalAcceleratorDNS}`, {
        timeout: 10000,
        validateStatus: () => true
      });
      expect([200, 404, 503]).toContain(response.status);
    });
  });

  describe('2. Regional Load Balancers - Both Regions Operational', () => {
    test('Primary region ALB should respond to health checks', async () => {
      const primaryHealthCheck = getOutputValue(primaryOutputs, 'ALBHealthCheckUrl');
      const response = await axios.get(primaryHealthCheck, { timeout: 10000 });
      expect(response.status).toBe(200);
      expect(response.data).toBeDefined();
    });

    test('Secondary region ALB should respond to health checks', async () => {
      const secondaryHealthCheck = getOutputValue(secondaryOutputs, 'ALBHealthCheckUrl');
      const response = await axios.get(secondaryHealthCheck, { timeout: 10000 });
      expect(response.status).toBe(200);
      expect(response.data).toBeDefined();
    });

    test('Primary ALB should be in active state', async () => {
      const albArn = getOutputValue(primaryOutputs, 'ALBArn');
      const response = await elbPrimary.send(
        new DescribeLoadBalancersCommand({
          LoadBalancerArns: [albArn],
        })
      );
      expect(response.LoadBalancers).toHaveLength(1);
      expect(response.LoadBalancers![0].State?.Code).toBe('active');
      expect(response.LoadBalancers![0].Scheme).toBe('internet-facing');
    });

    test('Secondary ALB should be in active state', async () => {
      const albArn = getOutputValue(secondaryOutputs, 'ALBArn');
      const response = await elbSecondary.send(
        new DescribeLoadBalancersCommand({
          LoadBalancerArns: [albArn],
        })
      );
      expect(response.LoadBalancers).toHaveLength(1);
      expect(response.LoadBalancers![0].State?.Code).toBe('active');
      expect(response.LoadBalancers![0].Scheme).toBe('internet-facing');
    });

    test('Both ALBs should respond within acceptable latency', async () => {
      const primaryHealthCheck = getOutputValue(primaryOutputs, 'ALBHealthCheckUrl');
      const secondaryHealthCheck = getOutputValue(secondaryOutputs, 'ALBHealthCheckUrl');

      const startPrimary = Date.now();
      await axios.get(primaryHealthCheck, { timeout: 5000 });
      const primaryLatency = Date.now() - startPrimary;

      const startSecondary = Date.now();
      await axios.get(secondaryHealthCheck, { timeout: 5000 });
      const secondaryLatency = Date.now() - startSecondary;

      expect(primaryLatency).toBeLessThan(2000);
      expect(secondaryLatency).toBeLessThan(2000);
    });
  });

  describe('3. ECS Microservices - Active-Active Configuration', () => {
    test('Primary region ECS cluster should be active', async () => {
      const primaryClusterName = getOutputValue(primaryOutputs, 'ECSClusterName');
      const response = await ecsPrimary.send(
        new DescribeClustersCommand({
          clusters: [primaryClusterName],
        })
      );
      expect(response.clusters).toHaveLength(1);
      expect(response.clusters![0].status).toBe('ACTIVE');
      expect(response.clusters![0].runningTasksCount).toBeGreaterThan(0);
    });

    test('Secondary region ECS cluster should be active', async () => {
      const secondaryClusterName = getOutputValue(secondaryOutputs, 'ECSClusterName');
      const response = await ecsSecondary.send(
        new DescribeClustersCommand({
          clusters: [secondaryClusterName],
        })
      );
      expect(response.clusters).toHaveLength(1);
      expect(response.clusters![0].status).toBe('ACTIVE');
      expect(response.clusters![0].runningTasksCount).toBeGreaterThan(0);
    });

    test('Primary region Trading Service should be running', async () => {
      const primaryClusterName = getOutputValue(primaryOutputs, 'ECSClusterName');
      const primaryTradingService = getOutputValue(primaryOutputs, 'TradingServiceName');
      const response = await ecsPrimary.send(
        new DescribeServicesCommand({
          cluster: primaryClusterName,
          services: [primaryTradingService],
        })
      );
      expect(response.services).toHaveLength(1);
      expect(response.services![0].status).toBe('ACTIVE');
      expect(response.services![0].runningCount).toBe(response.services![0].desiredCount);
      expect(response.services![0].runningCount).toBeGreaterThan(0);
    });

    test('Secondary region Trading Service should be running', async () => {
      const secondaryClusterName = getOutputValue(secondaryOutputs, 'ECSClusterName');
      const secondaryTradingService = getOutputValue(secondaryOutputs, 'TradingServiceName');
      const response = await ecsSecondary.send(
        new DescribeServicesCommand({
          cluster: secondaryClusterName,
          services: [secondaryTradingService],
        })
      );
      expect(response.services).toHaveLength(1);
      expect(response.services![0].status).toBe('ACTIVE');
      expect(response.services![0].runningCount).toBe(response.services![0].desiredCount);
      expect(response.services![0].runningCount).toBeGreaterThan(0);
    });

    test('Primary region Order Management Service should be running', async () => {
      const primaryClusterName = getOutputValue(primaryOutputs, 'ECSClusterName');
      const primaryOrderService = getOutputValue(primaryOutputs, 'OrderManagementServiceName');
      const response = await ecsPrimary.send(
        new DescribeServicesCommand({
          cluster: primaryClusterName,
          services: [primaryOrderService],
        })
      );
      expect(response.services).toHaveLength(1);
      expect(response.services![0].status).toBe('ACTIVE');
      expect(response.services![0].runningCount).toBe(response.services![0].desiredCount);
    });

    test('Secondary region Order Management Service should be running', async () => {
      const secondaryClusterName = getOutputValue(secondaryOutputs, 'ECSClusterName');
      const secondaryOrderService = getOutputValue(secondaryOutputs, 'OrderManagementServiceName');
      const response = await ecsSecondary.send(
        new DescribeServicesCommand({
          cluster: secondaryClusterName,
          services: [secondaryOrderService],
        })
      );
      expect(response.services).toHaveLength(1);
      expect(response.services![0].status).toBe('ACTIVE');
      expect(response.services![0].runningCount).toBe(response.services![0].desiredCount);
    });

    test('Both regions should have matching service configurations', async () => {
      const primaryClusterName = getOutputValue(primaryOutputs, 'ECSClusterName');
      const secondaryClusterName = getOutputValue(secondaryOutputs, 'ECSClusterName');
      const primaryTradingService = getOutputValue(primaryOutputs, 'TradingServiceName');
      const secondaryTradingService = getOutputValue(secondaryOutputs, 'TradingServiceName');

      const primaryResponse = await ecsPrimary.send(
        new DescribeServicesCommand({
          cluster: primaryClusterName,
          services: [primaryTradingService],
        })
      );

      const secondaryResponse = await ecsSecondary.send(
        new DescribeServicesCommand({
          cluster: secondaryClusterName,
          services: [secondaryTradingService],
        })
      );

      expect(primaryResponse.services![0].desiredCount).toBe(
        secondaryResponse.services![0].desiredCount
      );
      expect(primaryResponse.services![0].launchType).toBe(
        secondaryResponse.services![0].launchType
      );
    });
  });

  describe('4. Aurora Global Database - Multi-Region Data Layer', () => {
    const globalClusterId = getOutputValue(primaryOutputs, 'GlobalClusterIdentifier');
    const primaryClusterId = getOutputValue(primaryOutputs, 'PrimaryClusterIdentifier');
    const dbEngine = getOutputValue(primaryOutputs, 'DBEngine');
    const dbEngineVersion = getOutputValue(primaryOutputs, 'DBEngineVersion');
    const secretArn = getOutputValue(primaryOutputs, 'DBSecretArn');

    test('Aurora Global Cluster should be available', async () => {
      const response = await rdsClient.send(
        new DescribeGlobalClustersCommand({
          GlobalClusterIdentifier: globalClusterId,
        })
      );
      expect(response.GlobalClusters).toHaveLength(1);
      expect(response.GlobalClusters![0].Status).toBe('available');
      expect(response.GlobalClusters![0].Engine).toBe(dbEngine);
      expect(response.GlobalClusters![0].EngineVersion).toBe(dbEngineVersion);
    });

    test('Aurora Global Cluster should have encryption enabled', async () => {
      const response = await rdsClient.send(
        new DescribeGlobalClustersCommand({
          GlobalClusterIdentifier: globalClusterId,
        })
      );
      expect(response.GlobalClusters![0].StorageEncrypted).toBe(true);
    });

    test('Primary Aurora cluster should be available', async () => {
      const response = await rdsClient.send(
        new DescribeDBClustersCommand({
          DBClusterIdentifier: primaryClusterId,
        })
      );
      expect(response.DBClusters).toHaveLength(1);
      expect(response.DBClusters![0].Status).toBe('available');
      expect(response.DBClusters![0].Engine).toBe(dbEngine);
      expect(response.DBClusters![0].EngineVersion).toBe(dbEngineVersion);
    });

    test('Primary Aurora cluster should have both read and write endpoints', () => {
      const writeEndpoint = getOutputValue(primaryOutputs, 'PrimaryClusterEndpoint');
      const readEndpoint = getOutputValue(primaryOutputs, 'PrimaryClusterReadEndpoint');

      expect(writeEndpoint).toContain('.rds.amazonaws.com');
      expect(readEndpoint).toContain('.rds.amazonaws.com');
      expect(writeEndpoint).toContain('.cluster');
      expect(readEndpoint).toContain('.cluster-ro');
    });

    test('Primary Aurora cluster should have encryption enabled', async () => {
      const response = await rdsClient.send(
        new DescribeDBClustersCommand({
          DBClusterIdentifier: primaryClusterId,
        })
      );
      expect(response.DBClusters![0].StorageEncrypted).toBe(true);
    });

    test('Database credentials should be stored in Secrets Manager', async () => {
      const response = await secretsClient.send(
        new GetSecretValueCommand({
          SecretId: secretArn,
        })
      );
      expect(response.SecretString).toBeDefined();
      const secret = JSON.parse(response.SecretString!);
      expect(secret.username).toBeDefined();
      expect(secret.password).toBeDefined();
      expect(secret.username).toBe(getOutputValue(primaryOutputs, 'DBUsername'));
    });

    test('Primary Aurora cluster should have at least one instance running', async () => {
      const response = await rdsClient.send(
        new DescribeDBClustersCommand({
          DBClusterIdentifier: primaryClusterId,
        })
      );
      expect(response.DBClusters![0].DBClusterMembers).toBeDefined();
      expect(response.DBClusters![0].DBClusterMembers!.length).toBeGreaterThan(0);

      const writerInstance = response.DBClusters![0].DBClusterMembers!.find(
        member => member.IsClusterWriter
      );
      expect(writerInstance).toBeDefined();
    });
  });

  describe('5. Transit Gateway - Inter-Region Connectivity', () => {
    test('Primary region Transit Gateway should be available', async () => {
      const primaryTGWId = getOutputValue(primaryOutputs, 'TransitGatewayId');
      const response = await ec2Primary.send(
        new DescribeTransitGatewaysCommand({
          TransitGatewayIds: [primaryTGWId],
        })
      );
      expect(response.TransitGateways).toHaveLength(1);
      expect(response.TransitGateways![0].State).toBe('available');
      expect(response.TransitGateways![0].Options?.AmazonSideAsn).toBe(64512);
    });

    test('Secondary region Transit Gateway should be available', async () => {
      const secondaryTGWId = getOutputValue(secondaryOutputs, 'TransitGatewayId');
      const response = await ec2Secondary.send(
        new DescribeTransitGatewaysCommand({
          TransitGatewayIds: [secondaryTGWId],
        })
      );
      expect(response.TransitGateways).toHaveLength(1);
      expect(response.TransitGateways![0].State).toBe('available');
      expect(response.TransitGateways![0].Options?.AmazonSideAsn).toBe(64513);
    });

    test('Primary VPC should be attached to Transit Gateway', async () => {
      const primaryTGWAttachment = getOutputValue(primaryOutputs, 'TransitGatewayAttachmentId');
      const primaryVpcId = getOutputValue(primaryOutputs, 'VpcId');
      const response = await ec2Primary.send(
        new DescribeTransitGatewayVpcAttachmentsCommand({
          TransitGatewayAttachmentIds: [primaryTGWAttachment],
        })
      );
      expect(response.TransitGatewayVpcAttachments).toHaveLength(1);
      expect(response.TransitGatewayVpcAttachments![0].State).toBe('available');
      expect(response.TransitGatewayVpcAttachments![0].VpcId).toBe(primaryVpcId);
    });

    test('Secondary VPC should be attached to Transit Gateway', async () => {
      const secondaryTGWAttachment = getOutputValue(secondaryOutputs, 'TransitGatewayAttachmentId');
      const secondaryVpcId = getOutputValue(secondaryOutputs, 'VpcId');
      const response = await ec2Secondary.send(
        new DescribeTransitGatewayVpcAttachmentsCommand({
          TransitGatewayAttachmentIds: [secondaryTGWAttachment],
        })
      );
      expect(response.TransitGatewayVpcAttachments).toHaveLength(1);
      expect(response.TransitGatewayVpcAttachments![0].State).toBe('available');
      expect(response.TransitGatewayVpcAttachments![0].VpcId).toBe(secondaryVpcId);
    });

    test('Primary VPC should have routes to secondary VPC CIDR via TGW', async () => {
      const primaryVpcId = getOutputValue(primaryOutputs, 'VpcId');
      const primaryTGWId = getOutputValue(primaryOutputs, 'TransitGatewayId');
      const secondaryCidr = getOutputValue(secondaryOutputs, 'VpcCidr');
      const response = await ec2Primary.send(
        new DescribeRouteTablesCommand({
          Filters: [
            { Name: 'vpc-id', Values: [primaryVpcId] },
            { Name: 'route.transit-gateway-id', Values: [primaryTGWId] },
          ],
        })
      );

      expect(response.RouteTables!.length).toBeGreaterThan(0);

      const hasRouteToSecondary = response.RouteTables!.some(rt =>
        rt.Routes!.some(route =>
          route.DestinationCidrBlock === secondaryCidr &&
          route.TransitGatewayId === primaryTGWId
        )
      );
      expect(hasRouteToSecondary).toBe(true);
    });

    test('Secondary VPC should have routes to primary VPC CIDR via TGW', async () => {
      const primaryCidr = getOutputValue(primaryOutputs, 'VpcCidr');
      const secondaryVpcId = getOutputValue(secondaryOutputs, 'VpcId');
      const secondaryTGWId = getOutputValue(secondaryOutputs, 'TransitGatewayId');
      const response = await ec2Secondary.send(
        new DescribeRouteTablesCommand({
          Filters: [
            { Name: 'vpc-id', Values: [secondaryVpcId] },
            { Name: 'route.transit-gateway-id', Values: [secondaryTGWId] },
          ],
        })
      );

      expect(response.RouteTables!.length).toBeGreaterThan(0);

      const hasRouteToPrimary = response.RouteTables!.some(rt =>
        rt.Routes!.some(route =>
          route.DestinationCidrBlock === primaryCidr &&
          route.TransitGatewayId === secondaryTGWId
        )
      );
      expect(hasRouteToPrimary).toBe(true);
    });
  });

  describe('6. VPC Network Configuration - Non-Overlapping CIDRs', () => {
    test('Primary and secondary VPCs should have non-overlapping CIDRs', () => {
      const primaryCidr = getOutputValue(primaryOutputs, 'VpcCidr');
      const secondaryCidr = getOutputValue(secondaryOutputs, 'VpcCidr');
      expect(primaryCidr).toBe('10.0.0.0/16');
      expect(secondaryCidr).toBe('172.16.0.0/16');
      expect(primaryCidr).not.toBe(secondaryCidr);
    });

    test('Primary VPC should have 3 availability zones', async () => {
      const publicSubnets = getOutputValue(primaryOutputs, 'PublicSubnetIds').split(',');
      const privateSubnets = getOutputValue(primaryOutputs, 'PrivateSubnetIds').split(',');
      const isolatedSubnets = getOutputValue(primaryOutputs, 'IsolatedSubnetIds').split(',');

      expect(publicSubnets).toHaveLength(3);
      expect(privateSubnets).toHaveLength(3);
      expect(isolatedSubnets).toHaveLength(3);
    });

    test('Secondary VPC should have 3 availability zones', async () => {
      const publicSubnets = getOutputValue(secondaryOutputs, 'PublicSubnetIds').split(',');
      const privateSubnets = getOutputValue(secondaryOutputs, 'PrivateSubnetIds').split(',');
      const isolatedSubnets = getOutputValue(secondaryOutputs, 'IsolatedSubnetIds').split(',');

      expect(publicSubnets).toHaveLength(3);
      expect(privateSubnets).toHaveLength(3);
      expect(isolatedSubnets).toHaveLength(3);
    });

    test('Primary VPC should be in correct region and state', async () => {
      const primaryVpcId = getOutputValue(primaryOutputs, 'VpcId');
      const primaryCidr = getOutputValue(primaryOutputs, 'VpcCidr');
      const response = await ec2Primary.send(
        new DescribeVpcsCommand({
          VpcIds: [primaryVpcId],
        })
      );
      expect(response.Vpcs).toHaveLength(1);
      expect(response.Vpcs![0].State).toBe('available');
      expect(response.Vpcs![0].CidrBlock).toBe(primaryCidr);
    });

    test('Secondary VPC should be in correct region and state', async () => {
      const secondaryVpcId = getOutputValue(secondaryOutputs, 'VpcId');
      const secondaryCidr = getOutputValue(secondaryOutputs, 'VpcCidr');
      const response = await ec2Secondary.send(
        new DescribeVpcsCommand({
          VpcIds: [secondaryVpcId],
        })
      );
      expect(response.Vpcs).toHaveLength(1);
      expect(response.Vpcs![0].State).toBe('available');
      expect(response.Vpcs![0].CidrBlock).toBe(secondaryCidr);
    });
  });

  describe('7. Complete Workflow - Global to Regional Services', () => {
    test('Traffic should flow from Global Accelerator to ALB', async () => {
      const globalEndpoint = getOutputValue(primaryOutputs, 'GlobalAcceleratorEndpoint');
      const primaryALB = getOutputValue(primaryOutputs, 'ALBHealthCheckUrl');
      const globalResponse = await axios.get(globalEndpoint, {
        timeout: 10000,
        maxRedirects: 0,
      });
      expect(globalResponse.status).toBe(200);

      const albResponse = await axios.get(primaryALB, { timeout: 10000 });
      expect(albResponse.status).toBe(200);

      // Both should return similar responses since GA routes to ALB
      expect(globalResponse.data).toBeDefined();
      expect(albResponse.data).toBeDefined();
    });

    test('Both regional ALBs should be independently accessible', async () => {
      const primaryALB = getOutputValue(primaryOutputs, 'ALBHealthCheckUrl');
      const secondaryALB = getOutputValue(secondaryOutputs, 'ALBHealthCheckUrl');
      const [primaryResponse, secondaryResponse] = await Promise.all([
        axios.get(primaryALB, { timeout: 10000 }),
        axios.get(secondaryALB, { timeout: 10000 }),
      ]);

      expect(primaryResponse.status).toBe(200);
      expect(secondaryResponse.status).toBe(200);
    });

    test('System should handle concurrent requests across regions', async () => {
      const primaryALB = getOutputValue(primaryOutputs, 'ALBHealthCheckUrl');
      const secondaryALB = getOutputValue(secondaryOutputs, 'ALBHealthCheckUrl');
      const requests = Array(10).fill(null).map((_, i) => {
        const endpoint = i % 2 === 0 ? primaryALB : secondaryALB;
        return axios.get(endpoint, { timeout: 10000 });
      });

      const responses = await Promise.all(requests);
      responses.forEach(response => {
        expect(response.status).toBe(200);
      });
    });
  });

  describe('8. Edge Cases and Resilience', () => {
    const globalEndpoint = getOutputValue(primaryOutputs, 'GlobalAcceleratorEndpoint');
    const primaryALB = getOutputValue(primaryOutputs, 'ALBHealthCheckUrl');

    test('Global Accelerator should handle malformed paths gracefully', async () => {
      const response = await axios.get(`${globalEndpoint}/nonexistent`, {
        timeout: 10000,
        validateStatus: () => true,
      });
      expect(response.status).toBeGreaterThanOrEqual(200);
      expect([200, 404, 503]).toContain(response.status);
    });

    test('ALB should handle large number of rapid requests', async () => {
      const requests = Array(20).fill(null).map(() =>
        axios.get(primaryALB, {
          timeout: 5000,
          validateStatus: () => true
        })
      );

      const responses = await Promise.all(requests);
      const successfulRequests = responses.filter(r => r.status === 200);
      expect(successfulRequests.length).toBeGreaterThan(15); // At least 75% success
    });

    test('System should respond within SLA even under load', async () => {
      const measurements: number[] = [];

      for (let i = 0; i < 5; i++) {
        const start = Date.now();
        await axios.get(primaryALB, { timeout: 10000 });
        measurements.push(Date.now() - start);
      }

      const avgLatency = measurements.reduce((a, b) => a + b, 0) / measurements.length;
      expect(avgLatency).toBeLessThan(1500); // Average under 1.5s
    });

    test('Both regions should be independently operational', async () => {
      const primaryCluster = getOutputValue(primaryOutputs, 'ECSClusterName');
      const secondaryCluster = getOutputValue(secondaryOutputs, 'ECSClusterName');

      const [primaryClusters, secondaryClusters] = await Promise.all([
        ecsPrimary.send(new DescribeClustersCommand({ clusters: [primaryCluster] })),
        ecsSecondary.send(new DescribeClustersCommand({ clusters: [secondaryCluster] })),
      ]);

      expect(primaryClusters.clusters![0].status).toBe('ACTIVE');
      expect(secondaryClusters.clusters![0].status).toBe('ACTIVE');
      expect(primaryClusters.clusters![0].runningTasksCount).toBeGreaterThan(0);
      expect(secondaryClusters.clusters![0].runningTasksCount).toBeGreaterThan(0);
    });
  });
});
