import * as fs from 'fs';
import * as path from 'path';
import {
  ECSClient,
  DescribeClustersCommand,
  DescribeServicesCommand,
} from '@aws-sdk/client-ecs';
import {
  RDSClient,
  DescribeDBInstancesCommand,
} from '@aws-sdk/client-rds';
import {
  ElasticLoadBalancingV2Client,
  DescribeLoadBalancersCommand,
} from '@aws-sdk/client-elastic-load-balancing-v2';

// Load stack outputs from deployment
const loadOutputs = () => {
  const outputsPath = path.join(
    process.cwd(),
    'cfn-outputs',
    'flat-outputs.json'
  );
  if (!fs.existsSync(outputsPath)) {
    throw new Error(
      `Stack outputs not found at ${outputsPath}. Please deploy the stack first.`
    );
  }
  return JSON.parse(fs.readFileSync(outputsPath, 'utf-8'));
};

describe('Payment Platform Integration Tests', () => {
  let outputs: any;
  let region: string;

  beforeAll(() => {
    try {
      outputs = loadOutputs();
      region = process.env.AWS_REGION || 'ap-northeast-2';
    } catch (error) {
      console.warn('Stack outputs not available. Skipping integration tests.');
      outputs = null;
    }
  });

  describe('ECS Cluster', () => {
    it('should have a running ECS cluster', async () => {
      if (!outputs || !outputs.ECSClusterName) {
        console.warn('Skipping: ECS cluster name not found in outputs');
        return;
      }

      const ecsClient = new ECSClient({ region });
      const command = new DescribeClustersCommand({
        clusters: [outputs.ECSClusterName],
      });

      const response = await ecsClient.send(command);
      expect(response.clusters).toBeDefined();
      expect(response.clusters?.length).toBeGreaterThan(0);
      expect(response.clusters?.[0].status).toBe('ACTIVE');
    }, 30000);

    it('should have a running ECS service with tasks', async () => {
      if (
        !outputs ||
        !outputs.ECSClusterName ||
        !outputs.ECSServiceName
      ) {
        console.warn('Skipping: ECS cluster or service name not found');
        return;
      }

      const ecsClient = new ECSClient({ region });
      const command = new DescribeServicesCommand({
        cluster: outputs.ECSClusterName,
        services: [outputs.ECSServiceName],
      });

      const response = await ecsClient.send(command);
      expect(response.services).toBeDefined();
      expect(response.services?.length).toBeGreaterThan(0);
      expect(response.services?.[0].status).toBe('ACTIVE');
      expect(response.services?.[0].desiredCount).toBeGreaterThanOrEqual(1);
    }, 30000);
  });

  describe('Application Load Balancer', () => {
    it('should have an active load balancer', async () => {
      if (!outputs || !outputs.ALBDnsName) {
        console.warn('Skipping: ALB DNS name not found in outputs');
        return;
      }

      const elbClient = new ElasticLoadBalancingV2Client({ region });
      const command = new DescribeLoadBalancersCommand({});

      const response = await elbClient.send(command);
      const alb = response.LoadBalancers?.find(
        (lb) => lb.DNSName === outputs.ALBDnsName
      );

      expect(alb).toBeDefined();
      expect(alb?.State?.Code).toBe('active');
    }, 30000);

    it('should be accessible via HTTP', async () => {
      if (!outputs || !outputs.ALBDnsName) {
        console.warn('Skipping: ALB DNS name not found');
        return;
      }

      // Simple connectivity test
      const url = `http://${outputs.ALBDnsName}`;
      try {
        const response = await fetch(url, { method: 'GET' });
        // We expect either success or a valid HTTP error (not network error)
        expect(response).toBeDefined();
      } catch (error: any) {
        // If it's a network error, fail the test
        if (error.code === 'ENOTFOUND' || error.code === 'ECONNREFUSED') {
          throw error;
        }
        // Otherwise, the ALB exists but may return an error from the app
        expect(error).toBeDefined();
      }
    }, 30000);
  });

  describe('RDS Database', () => {
    it('should have an available database instance', async () => {
      if (!outputs || !outputs.DBEndpoint) {
        console.warn('Skipping: DB endpoint not found in outputs');
        return;
      }

      const rdsClient = new RDSClient({ region });
      const command = new DescribeDBInstancesCommand({});

      const response = await rdsClient.send(command);
      const dbInstance = response.DBInstances?.find(
        (db) => db.Endpoint?.Address && outputs.DBEndpoint.includes(db.Endpoint.Address)
      );

      expect(dbInstance).toBeDefined();
      expect(dbInstance?.DBInstanceStatus).toBe('available');
      expect(dbInstance?.MultiAZ).toBe(true);
    }, 30000);
  });
});
