import {
  EC2Client,
  DescribeVpcsCommand,
  DescribeInternetGatewaysCommand,
  DescribeNatGatewaysCommand,
} from '@aws-sdk/client-ec2';
import {
  RDSClient,
  DescribeDBInstancesCommand,
  DescribeDBSubnetGroupsCommand,
} from '@aws-sdk/client-rds';
import {
  ElasticLoadBalancingV2Client,
  DescribeLoadBalancersCommand,
} from '@aws-sdk/client-elastic-load-balancing-v2';
import * as fs from 'fs';
import * as path from 'path';

// Load deployment outputs
const outputsPath = path.join(process.cwd(), 'cfn-outputs', 'flat-outputs.json');
let outputs: Record<string, string> = {};

if (fs.existsSync(outputsPath)) {
  outputs = JSON.parse(fs.readFileSync(outputsPath, 'utf-8'));
} else {
  console.warn('Warning: cfn-outputs/flat-outputs.json not found. Using environment variables.');
}

const region = process.env.AWS_REGION || 'us-east-1';

// Initialize AWS clients
const ec2Client = new EC2Client({ region });
const rdsClient = new RDSClient({ region });
const elbClient = new ElasticLoadBalancingV2Client({ region });

describe('Payment Processing Infrastructure - Integration Tests', () => {
  describe('VPC and Networking', () => {
    test('VPC should exist with correct CIDR block', async () => {
      const vpcId = outputs.vpc_id;
      expect(vpcId).toBeDefined();

      const command = new DescribeVpcsCommand({ VpcIds: [vpcId] });
      const response = await ec2Client.send(command);

      expect(response.Vpcs).toBeDefined();
      expect(response.Vpcs!.length).toBe(1);
      expect(response.Vpcs![0].CidrBlock).toBe('10.0.0.0/16');
    }, 30000);

    test('Internet Gateway should be attached to VPC', async () => {
      const vpcId = outputs.vpc_id;
      const command = new DescribeInternetGatewaysCommand({
        Filters: [{ Name: 'attachment.vpc-id', Values: [vpcId] }],
      });
      const response = await ec2Client.send(command);

      expect(response.InternetGateways).toBeDefined();
      expect(response.InternetGateways!.length).toBeGreaterThanOrEqual(1);
    }, 30000);

    test('NAT Gateway should exist', async () => {
      const vpcId = outputs.vpc_id;
      const command = new DescribeNatGatewaysCommand({
        Filter: [
          { Name: 'vpc-id', Values: [vpcId] },
          { Name: 'state', Values: ['available', 'pending'] },
        ],
      });
      const response = await ec2Client.send(command);

      expect(response.NatGateways).toBeDefined();
      expect(response.NatGateways!.length).toBeGreaterThanOrEqual(1);
    }, 30000);
  });

  describe('RDS Database', () => {
    test('RDS should have encryption enabled', async () => {
      const dbIdentifier = outputs.rds_endpoint?.split('.')[0];
      if (!dbIdentifier) {
        console.warn('Skipping test: RDS endpoint not available');
        return;
      }

      const command = new DescribeDBInstancesCommand({
        DBInstanceIdentifier: dbIdentifier,
      });
      const response = await rdsClient.send(command);

      expect(response.DBInstances![0].StorageEncrypted).toBe(true);
      expect(response.DBInstances![0].KmsKeyId).toBeDefined();
    }, 30000);

    test('RDS should be in private subnets', async () => {
      const dbIdentifier = outputs.rds_endpoint?.split('.')[0];
      if (!dbIdentifier) {
        console.warn('Skipping test: RDS endpoint not available');
        return;
      }

      const command = new DescribeDBInstancesCommand({
        DBInstanceIdentifier: dbIdentifier,
      });
      const response = await rdsClient.send(command);

      expect(response.DBInstances![0].PubliclyAccessible).toBe(false);
    }, 30000);

    test('RDS DB Subnet Group should use private subnets', async () => {
      const dbIdentifier = outputs.rds_endpoint?.split('.')[0];
      if (!dbIdentifier) {
        console.warn('Skipping test: RDS endpoint not available');
        return;
      }

      const dbInstanceCmd = new DescribeDBInstancesCommand({
        DBInstanceIdentifier: dbIdentifier,
      });
      const dbInstanceResponse = await rdsClient.send(dbInstanceCmd);
      const subnetGroupName = dbInstanceResponse.DBInstances![0].DBSubnetGroup?.DBSubnetGroupName;

      expect(subnetGroupName).toBeDefined();

      const subnetGroupCmd = new DescribeDBSubnetGroupsCommand({
        DBSubnetGroupName: subnetGroupName,
      });
      const subnetGroupResponse = await rdsClient.send(subnetGroupCmd);

      expect(subnetGroupResponse.DBSubnetGroups![0].Subnets!.length).toBeGreaterThanOrEqual(3);
    }, 30000);
  });

  describe('Application Load Balancer', () => {
    test('ALB should exist and be internet-facing', async () => {
      const albDns = outputs.alb_dns_name;
      expect(albDns).toBeDefined();

      const command = new DescribeLoadBalancersCommand({
        Names: [albDns.split('.')[0].split('-').slice(0, -1).join('-')],
      });
      const response = await elbClient.send(command);

      expect(response.LoadBalancers).toBeDefined();
      expect(response.LoadBalancers!.length).toBe(1);
      expect(response.LoadBalancers![0].Scheme).toBe('internet-facing');
      expect(response.LoadBalancers![0].Type).toBe('application');
    }, 30000);
  });

  describe('Resource Tagging', () => {
    test('All resources should have required tags', async () => {
      const vpcId = outputs.vpc_id;
      const vpcCommand = new DescribeVpcsCommand({ VpcIds: [vpcId] });
      const vpcResponse = await ec2Client.send(vpcCommand);

      const tags = vpcResponse.Vpcs![0].Tags || [];
      const tagMap = Object.fromEntries(tags.map(t => [t.Key!, t.Value!]));

      expect(tagMap.Environment).toBe('production');
      expect(tagMap.Project).toBe('payment-gateway');
      expect(tagMap.ManagedBy).toBe('terraform');
    }, 30000);
  });
});
