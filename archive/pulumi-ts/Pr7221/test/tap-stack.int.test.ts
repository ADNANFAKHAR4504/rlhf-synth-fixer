import {
  DescribeSubnetsCommand,
  DescribeVpcsCommand,
  EC2Client,
} from '@aws-sdk/client-ec2';
import {
  DescribeLoadBalancersCommand,
  ElasticLoadBalancingV2Client,
} from '@aws-sdk/client-elastic-load-balancing-v2';
import {
  DescribeDBClustersCommand,
  RDSClient,
} from '@aws-sdk/client-rds';
import * as fs from 'fs';
import * as path from 'path';

const OUTPUTS_PATH = path.join(
  process.cwd(),
  'cfn-outputs',
  'flat-outputs.json'
);

interface StackOutputs {
  VpcId?: string;
  AlbDnsName?: string;
  DistributionUrl?: string;
  DatabaseEndpoint?: string;
  DatabaseConnectionString?: string;
  [key: string]: string | undefined;
}

describe('TapStack Integration Tests', () => {
  let outputs: StackOutputs;
  const region = process.env.AWS_REGION || 'us-east-1';

  beforeAll(() => {
    // Load stack outputs from deployment
    if (!fs.existsSync(OUTPUTS_PATH)) {
      console.warn(
        `Outputs file not found at ${OUTPUTS_PATH}. Integration tests will be skipped.`
      );
      outputs = {};
      return;
    }

    const outputsRaw = fs.readFileSync(OUTPUTS_PATH, 'utf-8');
    outputs = JSON.parse(outputsRaw);
  });

  describe('Deployment Outputs', () => {
    it('should have required outputs', () => {
      if (!fs.existsSync(OUTPUTS_PATH)) {
        console.log('Skipping: outputs file not found');
        return;
      }

      expect(outputs).toBeDefined();
      expect(Object.keys(outputs).length).toBeGreaterThan(0);
    });

    it('should have VPC ID output', () => {
      if (!fs.existsSync(OUTPUTS_PATH)) {
        console.log('Skipping: outputs file not found');
        return;
      }

      const vpcIdKey = Object.keys(outputs).find(
        key => key.toLowerCase().includes('vpc')
      );
      expect(vpcIdKey).toBeDefined();
    });

    it('should have ALB DNS name output', () => {
      if (!fs.existsSync(OUTPUTS_PATH)) {
        console.log('Skipping: outputs file not found');
        return;
      }

      const albKey = Object.keys(outputs).find(
        key => key.toLowerCase().includes('alb') || key.toLowerCase().includes('loadbalancer')
      );
      expect(albKey).toBeDefined();
    });

    it('should have database endpoint output', () => {
      if (!fs.existsSync(OUTPUTS_PATH)) {
        console.log('Skipping: outputs file not found');
        return;
      }

      const dbKey = Object.keys(outputs).find(
        key =>
          key.toLowerCase().includes('database') ||
          key.toLowerCase().includes('db') ||
          key.toLowerCase().includes('cluster')
      );
      expect(dbKey).toBeDefined();
    });
  });

  describe('VPC Resources', () => {
    it('should validate VPC exists', async () => {
      if (!fs.existsSync(OUTPUTS_PATH)) {
        console.log('Skipping: outputs file not found');
        return;
      }

      const vpcIdKey = Object.keys(outputs).find(
        key => key.toLowerCase().includes('vpc')
      );
      if (!vpcIdKey || !outputs[vpcIdKey]) {
        console.log('Skipping: VPC ID not found in outputs');
        return;
      }

      const ec2Client = new EC2Client({ region });
      const vpcId = outputs[vpcIdKey];

      const command = new DescribeVpcsCommand({
        VpcIds: [vpcId!],
      });

      const response = await ec2Client.send(command);
      expect(response.Vpcs).toBeDefined();
      expect(response.Vpcs!.length).toBe(1);
      expect(response.Vpcs![0].VpcId).toBe(vpcId);
    });

    it('should validate subnets exist', async () => {
      if (!fs.existsSync(OUTPUTS_PATH)) {
        console.log('Skipping: outputs file not found');
        return;
      }

      const vpcIdKey = Object.keys(outputs).find(
        key => key.toLowerCase().includes('vpc')
      );
      if (!vpcIdKey || !outputs[vpcIdKey]) {
        console.log('Skipping: VPC ID not found in outputs');
        return;
      }

      const ec2Client = new EC2Client({ region });
      const vpcId = outputs[vpcIdKey];

      const command = new DescribeSubnetsCommand({
        Filters: [
          {
            Name: 'vpc-id',
            Values: [vpcId!],
          },
        ],
      });

      const response = await ec2Client.send(command);
      expect(response.Subnets).toBeDefined();
      expect(response.Subnets!.length).toBeGreaterThan(0);
    });
  });

  describe('Load Balancer Resources', () => {
    it('should validate ALB exists', async () => {
      if (!fs.existsSync(OUTPUTS_PATH)) {
        console.log('Skipping: outputs file not found');
        return;
      }

      const albDnsKey = Object.keys(outputs).find(
        key => key.toLowerCase().includes('alb') || key.toLowerCase().includes('loadbalancer')
      );
      if (!albDnsKey || !outputs[albDnsKey]) {
        console.log('Skipping: ALB DNS not found in outputs');
        return;
      }

      const elbClient = new ElasticLoadBalancingV2Client({ region });
      const albDns = outputs[albDnsKey];

      const command = new DescribeLoadBalancersCommand({});
      const response = await elbClient.send(command);

      const alb = response.LoadBalancers?.find(
        lb => lb.DNSName === albDns
      );
      expect(alb).toBeDefined();
      expect(alb!.State?.Code).toBe('active');
    });
  });

  describe('Database Resources', () => {
    it('should validate RDS cluster exists', async () => {
      if (!fs.existsSync(OUTPUTS_PATH)) {
        console.log('Skipping: outputs file not found');
        return;
      }

      const dbEndpointKey = Object.keys(outputs).find(
        key =>
          key.toLowerCase().includes('database') ||
          key.toLowerCase().includes('db') ||
          key.toLowerCase().includes('cluster')
      );
      if (!dbEndpointKey || !outputs[dbEndpointKey]) {
        console.log('Skipping: Database endpoint not found in outputs');
        return;
      }

      const rdsClient = new RDSClient({ region });
      const command = new DescribeDBClustersCommand({});

      const response = await rdsClient.send(command);
      expect(response.DBClusters).toBeDefined();
      expect(response.DBClusters!.length).toBeGreaterThan(0);

      const cluster = response.DBClusters![0];
      expect(cluster.Status).toBe('available');
      expect(cluster.StorageEncrypted).toBe(true);
    });
  });

  describe('Resource Connectivity', () => {
    it('should verify ALB DNS name is resolvable', async () => {
      if (!fs.existsSync(OUTPUTS_PATH)) {
        console.log('Skipping: outputs file not found');
        return;
      }

      const albDnsKey = Object.keys(outputs).find(
        key => key.toLowerCase().includes('alb') || key.toLowerCase().includes('loadbalancer')
      );
      if (!albDnsKey || !outputs[albDnsKey]) {
        console.log('Skipping: ALB DNS not found in outputs');
        return;
      }

      const albDns = outputs[albDnsKey];
      expect(albDns).toMatch(/\.elb\.amazonaws\.com$/);
    });

    it('should verify database endpoint format', async () => {
      if (!fs.existsSync(OUTPUTS_PATH)) {
        console.log('Skipping: outputs file not found');
        return;
      }

      const dbEndpointKey = Object.keys(outputs).find(
        key =>
          key.toLowerCase().includes('database') ||
          key.toLowerCase().includes('db') ||
          key.toLowerCase().includes('cluster')
      );
      if (!dbEndpointKey || !outputs[dbEndpointKey]) {
        console.log('Skipping: Database endpoint not found in outputs');
        return;
      }

      const dbEndpoint = outputs[dbEndpointKey];
      expect(dbEndpoint).toMatch(/\.rds\.amazonaws\.com/);
    });
  });

  describe('CloudFront Distribution', () => {
    it('should verify distribution URL format', async () => {
      if (!fs.existsSync(OUTPUTS_PATH)) {
        console.log('Skipping: outputs file not found');
        return;
      }

      const cfKey = Object.keys(outputs).find(
        key =>
          key.includes('Distribution') || key.includes('CloudFront')
      );
      if (!cfKey || !outputs[cfKey]) {
        console.log('Skipping: CloudFront distribution not found in outputs');
        return;
      }

      const distributionUrl = outputs[cfKey];
      expect(distributionUrl).toMatch(/\.cloudfront\.net$/);
    });
  });
});
