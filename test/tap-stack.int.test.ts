// Ensure this file is run after your CloudFormation stack has been deployed
// and the 'cfn-outputs/flat-outputs.json' file is populated.

import fs from 'fs';
import { EC2Client, DescribeVpcsCommand, DescribeSubnetsCommand, DescribeRouteTablesCommand, DescribeNatGatewaysCommand } from '@aws-sdk/client-ec2';

// Path to your CloudFormation outputs file
const outputsFilePath = 'cfn-outputs/flat-outputs.json';

// Check if the outputs file exists before trying to read it
if (!fs.existsSync(outputsFilePath)) {
  console.error("CloudFormation outputs file not found. Please ensure the stack has been deployed and the outputs are saved to 'cfn-outputs/flat-outputs.json'.");
  // Use a mock object to allow tests to run, but they will fail gracefully
  // This helps prevent a crash during local development or CI/CD
  const mockOutputs = {
    VPCId: 'mock-vpc-id',
    PublicSubnet1Id: 'mock-public-subnet-1',
    PublicSubnet2Id: 'mock-public-subnet-2',
    PrivateSubnet1Id: 'mock-private-subnet-1',
    PrivateSubnet2Id: 'mock-private-subnet-2',
    NATGateway1Id: 'mock-nat-gateway-1',
    NATGateway2Id: 'mock-nat-gateway-2'
  };
  // Exit the process if the required file isn't there to prevent false positives.
  process.exit(1);
}

const outputs = JSON.parse(fs.readFileSync(outputsFilePath, 'utf8'));
const ec2Client = new EC2Client({});

describe('Network Infrastructure Integration Tests', () => {

  // Test for VPC existence and properties
  test('VPC should exist and have the correct CIDR block', async () => {
    const vpcId = outputs.VPCId;
    expect(vpcId).toBeDefined();

    try {
      const command = new DescribeVpcsCommand({ VpcIds: [vpcId] });
      const data = await ec2Client.send(command);

      // Use optional chaining and a conditional check for safety
      expect(data.Vpcs?.length).toBe(1);
      const vpc = data.Vpcs?.[0];
      expect(vpc?.VpcId).toBe(vpcId);
      expect(vpc?.CidrBlock).toBe('10.0.0.0/16');

      console.log(`VPC "${vpcId}" exists and has the correct CIDR block.`);
    } catch (error) {
      // Use a type guard to handle the 'unknown' error type
      if (error instanceof Error) {
        console.error(`Error verifying VPC "${vpcId}":`, error.message);
      } else {
        console.error(`An unexpected error occurred:`, error);
      }
      throw error; // Fail the test if a real error occurs
    }
  });

  // Test for subnets existence and properties
  test('Public and private subnets should exist and have correct CIDR blocks', async () => {
    const publicSubnetIds = [outputs.PublicSubnet1Id, outputs.PublicSubnet2Id];
    const privateSubnetIds = [outputs.PrivateSubnet1Id, outputs.PrivateSubnet2Id];
    const allSubnetIds = [...publicSubnetIds, ...privateSubnetIds];

    try {
      const command = new DescribeSubnetsCommand({ SubnetIds: allSubnetIds });
      const data = await ec2Client.send(command);

      // Use optional chaining for safe access
      expect(data.Subnets?.length).toBe(4);
      if (!data.Subnets) throw new Error("Subnet data is missing.");

      // Use a Map for efficient lookup
      const subnetMap = new Map(data.Subnets.map(subnet => [subnet.SubnetId, subnet]));

      expect(subnetMap.get(publicSubnetIds[0])?.CidrBlock).toBe('10.0.1.0/24');
      expect(subnetMap.get(publicSubnetIds[1])?.CidrBlock).toBe('10.0.2.0/24');
      expect(subnetMap.get(privateSubnetIds[0])?.CidrBlock).toBe('10.0.3.0/24');
      expect(subnetMap.get(privateSubnetIds[1])?.CidrBlock).toBe('10.0.4.0/24');

      console.log('All subnets exist with correct CIDR blocks.');
    } catch (error) {
      if (error instanceof Error) {
        console.error('Error verifying subnets:', error.message);
      } else {
        console.error('An unexpected error occurred:', error);
      }
      throw error;
    }
  });

  // Test for NAT gateway configuration
  test('NAT gateways should exist in public subnets', async () => {
    const natGateway1Id = outputs.NATGateway1Id;
    const natGateway2Id = outputs.NATGateway2Id;

    try {
      const command = new DescribeNatGatewaysCommand({ NatGatewayIds: [natGateway1Id, natGateway2Id] });
      const data = await ec2Client.send(command);

      // Safely access the NatGateways array
      expect(data.NatGateways?.length).toBe(2);
      if (!data.NatGateways) throw new Error("NAT Gateway data is missing.");

      const natGateway1 = data.NatGateways.find(nat => nat.NatGatewayId === natGateway1Id);
      const natGateway2 = data.NatGateways.find(nat => nat.NatGatewayId === natGateway2Id);

      // Use optional chaining for safe access
      expect(natGateway1?.SubnetId).toBe(outputs.PublicSubnet1Id);
      expect(natGateway2?.SubnetId).toBe(outputs.PublicSubnet2Id);
      expect(natGateway1?.State).toBe('available');
      expect(natGateway2?.State).toBe('available');

      console.log('NAT Gateways exist and are in the correct public subnets.');
    } catch (error) {
      if (error instanceof Error) {
        console.error('Error verifying NAT gateways:', error.message);
      } else {
        console.error('An unexpected error occurred:', error);
      }
      throw error;
    }
  });
});