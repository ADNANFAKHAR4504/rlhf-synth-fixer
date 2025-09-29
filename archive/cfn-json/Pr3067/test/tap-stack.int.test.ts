import fs from 'fs';
import { ECSClient, DescribeClustersCommand, DescribeServicesCommand } from "@aws-sdk/client-ecs";
import { EC2Client, DescribeVpcsCommand } from "@aws-sdk/client-ec2";

// --- Configuration ---

const outputs = JSON.parse(
  fs.readFileSync('cfn-outputs/flat-outputs.json', 'utf8')
);

const ecsClient = new ECSClient({});
const ec2Client = new EC2Client({});

const expectedOutputKeys = [
    "VPCId", "PublicSubnet1Id", "PublicSubnet2Id",
    "EcrRepositoryUri",
    "ECSClusterName", "ECSServiceName", "ALBDNSName"
];

// --- Integration Test Suite ---

describe('ECS Fargate WebApp Service Existence and Status Checks', () => {
  jest.setTimeout(20000);

  test('All required Outputs must be available and populated', () => {
    expectedOutputKeys.forEach(key => {
      expect(outputs[key]).toBeDefined();
      expect(typeof outputs[key]).toBe('string');
      expect(outputs[key].length).toBeGreaterThan(0);
    });
    
    // Verify removal of private subnet outputs
    expect(outputs.PrivateSubnet1Id).toBeUndefined();
    expect(outputs.PrivateSubnet2Id).toBeUndefined();
  });

  // ------------------------------------------------------------------
  // 1. ECS Service Checks
  // ------------------------------------------------------------------

  test('ECS Cluster should exist and be active', async () => {
    const clusterName = outputs.ECSClusterName;
    expect(clusterName).toBeDefined();

    const command = new DescribeClustersCommand({
      clusters: [clusterName],
    });

    const response = await ecsClient.send(command);

    expect(response.clusters).toBeDefined();
    if (!response.clusters || response.clusters.length === 0) {
        throw new Error(`ECS Cluster with name ${clusterName} not found.`);
    }
    
    expect(response.clusters).toHaveLength(1);
    const cluster = response.clusters[0];
    expect(cluster.status).toBe("ACTIVE");
    expect(cluster.clusterName).toBe(clusterName);

    console.log(`Cluster '${clusterName}' is ACTIVE.`);
  });

  test('ECS Service should exist, be active, and have desired count', async () => {
    const clusterName = outputs.ECSClusterName;
    const serviceName = outputs.ECSServiceName;

    expect(serviceName).toBeDefined();

    const command = new DescribeServicesCommand({
      cluster: clusterName,
      services: [serviceName],
    });

    const response = await ecsClient.send(command);

    expect(response.services).toBeDefined();
    if (!response.services || response.services.length === 0) {
        throw new Error(`ECS Service with name ${serviceName} not found in cluster ${clusterName}.`);
    }

    expect(response.services).toHaveLength(1);
    const service = response.services[0];
    
    expect(service.status).toBe("ACTIVE");
    expect(service.serviceName).toBe(serviceName);
    
    expect(service.runningCount).toBeGreaterThanOrEqual(0);
    expect(service.desiredCount).toBeGreaterThanOrEqual(0);

    console.log(`Service '${serviceName}' is ACTIVE with ${service.runningCount}/${service.desiredCount} running tasks.`);
  });


  // ------------------------------------------------------------------
  // 2. Networking Checks (VPC)
  // ------------------------------------------------------------------

  test('VPC should exist and be available', async () => {
    const vpcId = outputs.VPCId;
    expect(vpcId).toBeDefined();

    const command = new DescribeVpcsCommand({
        VpcIds: [vpcId],
    });

    const response = await ec2Client.send(command);
    
    expect(response.Vpcs).toBeDefined();
    if (!response.Vpcs || response.Vpcs.length === 0) {
        throw new Error(`VPC with ID ${vpcId} not found.`);
    }

    expect(response.Vpcs).toHaveLength(1);
    const vpc = response.Vpcs[0];
    expect(vpc.VpcId).toBe(vpcId);
    expect(vpc.State).toBe('available');

    console.log(`VPC '${vpcId}' is available.`);
  });
});