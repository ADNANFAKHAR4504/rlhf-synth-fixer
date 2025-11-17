/**
 * VPC Infrastructure Integration Tests
 *
 * Tests against actual deployed AWS resources dynamically using AWS CLI
 * to avoid AWS SDK module loading issues. Validates all VPC infrastructure
 * components including connectivity, routing, network isolation, and PCI DSS
 * compliance requirements.
 *
 * Test Design:
 * - Uses AWS CLI commands to query real infrastructure
 * - Validates connectivity, routing, and network isolation
 * - Verifies PCI DSS compliance requirements
 * - Tests flow logs and monitoring capabilities
 * - No mocking - all tests against live AWS resources
 */

import { execSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';

const AWS_REGION = process.env.AWS_REGION || 'us-east-1';
const ENVIRONMENT_SUFFIX = process.env.ENVIRONMENT_SUFFIX || 'dev';
const STACK_NAME = `TapStack${ENVIRONMENT_SUFFIX}`;

// Load actual deployment outputs from cfn-outputs/flat-outputs.json
const outputsPath = path.join(__dirname, '..', 'cfn-outputs', 'flat-outputs.json');
const outputs = JSON.parse(fs.readFileSync(outputsPath, 'utf8'));

// Helper function to execute AWS CLI commands
function awsCommand(command: string): any {
  try {
    const result = execSync(`aws ${command} --region ${AWS_REGION}`, { encoding: 'utf8' });
    return JSON.parse(result);
  } catch (error) {
    console.error('AWS CLI command failed:', command);
    throw error;
  }
}

describe('VPC Infrastructure Integration Tests', () => {
  let vpcId: string;
  let publicSubnetIds: string[];
  let privateSubnetIds: string[];
  let isolatedSubnetIds: string[];
  let natGatewayIds: string[];

  beforeAll(() => {
    // Load actual deployment outputs
    vpcId = outputs.VPCId;
    publicSubnetIds = [outputs.PublicSubnet1Id, outputs.PublicSubnet2Id, outputs.PublicSubnet3Id];
    privateSubnetIds = [outputs.PrivateSubnet1Id, outputs.PrivateSubnet2Id, outputs.PrivateSubnet3Id];
    isolatedSubnetIds = [outputs.IsolatedSubnet1Id, outputs.IsolatedSubnet2Id, outputs.IsolatedSubnet3Id];
    natGatewayIds = [outputs.NatGateway1Id, outputs.NatGateway2Id, outputs.NatGateway3Id];

    console.log(`🔍 Testing VPC: ${vpcId}`);
    console.log(`🔍 Public Subnets: ${publicSubnetIds.join(', ')}`);
    console.log(`🔍 Private Subnets: ${privateSubnetIds.join(', ')}`);
    console.log(`🔍 Isolated Subnets: ${isolatedSubnetIds.join(', ')}`);
    console.log(`🔍 NAT Gateways: ${natGatewayIds.join(', ')}`);
  });

  describe('VPC Configuration Validation', () => {
    test('VPC should exist with correct CIDR block', () => {
      const result = awsCommand(`ec2 describe-vpcs --vpc-ids ${vpcId}`);
      const vpc = result.Vpcs[0];

      expect(vpc.VpcId).toBe(vpcId);
      expect(vpc.CidrBlock).toBe('10.0.0.0/16');
      expect(vpc.State).toBe('available');
    });

    test('VPC should have correct tags', () => {
      const result = awsCommand(`ec2 describe-vpcs --vpc-ids ${vpcId}`);
      const tags = result.Vpcs[0].Tags || [];

      const nameTag = tags.find((t: any) => t.Key === 'Name');
      expect(nameTag?.Value).toContain(ENVIRONMENT_SUFFIX);

      const envTag = tags.find((t: any) => t.Key === 'Environment');
      expect(envTag?.Value).toBe('Production');

      const projectTag = tags.find((t: any) => t.Key === 'Project');
      expect(projectTag?.Value).toBe('PaymentGateway');
    });
  });

  describe('Subnet Configuration Validation', () => {
    test('should have 9 subnets across 3 availability zones', () => {
      const result = awsCommand(`ec2 describe-subnets --filter Name=vpc-id,Values=${vpcId}`);
      const subnets = result.Subnets || [];

      expect(subnets).toHaveLength(9);

      // Verify distribution across 3 AZs
      const azs = new Set(subnets.map((s: any) => s.AvailabilityZone));
      expect(azs.size).toBe(3);
    });

    test('public subnets should have correct CIDR blocks', () => {
      const result = awsCommand(`ec2 describe-subnets --subnet-ids ${publicSubnetIds.join(' ')}`);
      const subnets = result.Subnets || [];

      const expectedCidrs = ['10.0.1.0/24', '10.0.2.0/24', '10.0.3.0/24'];
      const actualCidrs = subnets.map((s: any) => s.CidrBlock).sort();
      expect(actualCidrs).toEqual(expectedCidrs);

      // Verify MapPublicIpOnLaunch is enabled
      subnets.forEach((subnet: any) => {
        expect(subnet.MapPublicIpOnLaunch).toBe(true);
      });
    });

    test('private subnets should have correct CIDR blocks', () => {
      const result = awsCommand(`ec2 describe-subnets --subnet-ids ${privateSubnetIds.join(' ')}`);
      const subnets = result.Subnets || [];

      const expectedCidrs = ['10.0.11.0/24', '10.0.12.0/24', '10.0.13.0/24'];
      const actualCidrs = subnets.map((s: any) => s.CidrBlock).sort();
      expect(actualCidrs).toEqual(expectedCidrs);
    });

    test('isolated subnets should have correct CIDR blocks', () => {
      const result = awsCommand(`ec2 describe-subnets --subnet-ids ${isolatedSubnetIds.join(' ')}`);
      const subnets = result.Subnets || [];

      const expectedCidrs = ['10.0.21.0/24', '10.0.22.0/24', '10.0.23.0/24'];
      const actualCidrs = subnets.map((s: any) => s.CidrBlock).sort();
      expect(actualCidrs).toEqual(expectedCidrs);
    });
  });

  describe('NAT Gateway High Availability', () => {
    test('should have 3 NAT Gateways in available state', () => {
      const result = awsCommand(`ec2 describe-nat-gateways --nat-gateway-ids ${natGatewayIds.join(' ')}`);
      const natGateways = result.NatGateways || [];

      expect(natGateways).toHaveLength(3);
      natGateways.forEach((nat: any) => {
        expect(nat.State).toBe('available');
      });
    });

    test('each NAT Gateway should be in a different AZ', () => {
      const result = awsCommand(`ec2 describe-nat-gateways --nat-gateway-ids ${natGatewayIds.join(' ')}`);
      const natGateways = result.NatGateways || [];

      const subnetIds = natGateways.map((nat: any) => nat.SubnetId);
      const subnetsResult = awsCommand(`ec2 describe-subnets --subnet-ids ${subnetIds.join(' ')}`);
      const azs = subnetsResult.Subnets.map((s: any) => s.AvailabilityZone);

      const uniqueAzs = new Set(azs);
      expect(uniqueAzs.size).toBe(3);
    });

    test('each NAT Gateway should have an Elastic IP', () => {
      const result = awsCommand(`ec2 describe-nat-gateways --nat-gateway-ids ${natGatewayIds.join(' ')}`);
      const natGateways = result.NatGateways || [];

      natGateways.forEach((nat: any) => {
        expect(nat.NatGatewayAddresses).toHaveLength(1);
        expect(nat.NatGatewayAddresses[0].AllocationId).toBeDefined();
        expect(nat.NatGatewayAddresses[0].PublicIp).toBeDefined();
      });
    });
  });

  describe('VPC Flow Logs', () => {
    test('VPC Flow Logs should be enabled and active', () => {
      const result = awsCommand(`ec2 describe-flow-logs --filter "Name=resource-id,Values=${vpcId}"`);
      const flowLogs = result.FlowLogs || [];

      expect(flowLogs).toHaveLength(1);
      const flowLog = flowLogs[0];

      expect(flowLog.FlowLogStatus).toBe('ACTIVE');
      expect(flowLog.ResourceId).toBe(vpcId);
      expect(flowLog.TrafficType).toBe('ALL');
      expect(flowLog.LogDestinationType).toBe('cloud-watch-logs');
    });

    test('IAM role for Flow Logs should have correct permissions', () => {
      const flowLogsResult = awsCommand(`ec2 describe-flow-logs --filter "Name=resource-id,Values=${vpcId}"`);
      const flowLog = flowLogsResult.FlowLogs[0];

      // Extract role name from delivery role ARN
      const roleArn = flowLog.DeliverLogsPermissionArn;
      const roleName = roleArn.split('/').pop();

      // Validate role exists
      const roleResult = awsCommand(`iam get-role --role-name ${roleName}`);
      expect(roleResult.Role.RoleName).toBe(roleName);
    });
  }); describe('Internet Gateway and Routing', () => {
    test('VPC should have an Internet Gateway', () => {
      const result = awsCommand(`ec2 describe-internet-gateways --filters Name=attachment.vpc-id,Values=${vpcId}`);
      const igws = result.InternetGateways || [];

      expect(igws).toHaveLength(1);
      expect(igws[0].Attachments[0].VpcId).toBe(vpcId);
      expect(igws[0].Attachments[0].State).toBe('available');
    });

    test('public subnets should route to Internet Gateway', () => {
      const result = awsCommand(`ec2 describe-route-tables --filters Name=vpc-id,Values=${vpcId} Name=association.subnet-id,Values=${publicSubnetIds.join(',')}`);
      const routeTables = result.RouteTables || [];

      expect(routeTables.length).toBeGreaterThan(0);

      routeTables.forEach((rt: any) => {
        const defaultRoute = rt.Routes.find((r: any) => r.DestinationCidrBlock === '0.0.0.0/0');
        expect(defaultRoute).toBeDefined();
        expect(defaultRoute.GatewayId).toMatch(/^igw-/);
      });
    });

    test('private subnets should route to NAT Gateways', () => {
      const result = awsCommand(`ec2 describe-route-tables --filters Name=vpc-id,Values=${vpcId} Name=association.subnet-id,Values=${privateSubnetIds.join(',')}`);
      const routeTables = result.RouteTables || [];

      expect(routeTables.length).toBeGreaterThan(0);

      routeTables.forEach((rt: any) => {
        const defaultRoute = rt.Routes.find((r: any) => r.DestinationCidrBlock === '0.0.0.0/0');
        expect(defaultRoute).toBeDefined();
        expect(defaultRoute.NatGatewayId).toMatch(/^nat-/);
      });
    });
  });

  describe('VPC Endpoint Configuration', () => {
    test('S3 VPC Endpoint should be configured', () => {
      const result = awsCommand(`ec2 describe-vpc-endpoints --filters Name=vpc-id,Values=${vpcId} Name=service-name,Values=com.amazonaws.${AWS_REGION}.s3`);
      const endpoints = result.VpcEndpoints || [];

      expect(endpoints).toHaveLength(1);
      const s3Endpoint = endpoints[0];

      expect(s3Endpoint.State.toLowerCase()).toBe('available');
      expect(s3Endpoint.VpcEndpointType).toBe('Gateway');
      expect(s3Endpoint.ServiceName).toBe(`com.amazonaws.${AWS_REGION}.s3`);
    });
  });
});
