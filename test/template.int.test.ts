// Integration tests for deployed CloudFormation stack
// These tests validate the actual deployed resources in AWS

import {
  CloudFormationClient,
  DescribeStacksCommand,
  DescribeStackResourcesCommand
} from '@aws-sdk/client-cloudformation';
import {
  EC2Client,
  DescribeVpcsCommand,
  DescribeSubnetsCommand,
  DescribeInternetGatewaysCommand,
  DescribeNatGatewaysCommand,
  DescribeRouteTablesCommand,
  DescribeNetworkAclsCommand,
  DescribeFlowLogsCommand
} from '@aws-sdk/client-ec2';
import {
  IAMClient,
  GetRoleCommand
} from '@aws-sdk/client-iam';
import {
  CloudWatchLogsClient,
  DescribeLogGroupsCommand
} from '@aws-sdk/client-cloudwatch-logs';

const region = process.env.AWS_REGION || 'us-east-1';
const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'synth101912761pr';
const stackName = `TapStack${environmentSuffix}`;

const cfnClient = new CloudFormationClient({ region });
const ec2Client = new EC2Client({ region });
const iamClient = new IAMClient({ region });
const logsClient = new CloudWatchLogsClient({ region });

describe('CloudFormation Stack Integration Tests', () => {
  let stackOutputs: Record<string, string> = {};
  let stackResources: Record<string, string> = {};

  beforeAll(async () => {
    try {
      const stackResponse = await cfnClient.send(
        new DescribeStacksCommand({ StackName: stackName })
      );
      const stack = stackResponse.Stacks![0];

      if (stack.Outputs) {
        stack.Outputs.forEach(output => {
          stackOutputs[output.OutputKey!] = output.OutputValue!;
        });
      }

      const resourcesResponse = await cfnClient.send(
        new DescribeStackResourcesCommand({ StackName: stackName })
      );
      resourcesResponse.StackResources!.forEach(resource => {
        stackResources[resource.LogicalResourceId!] = resource.PhysicalResourceId!;
      });
    } catch (error) {
      console.error('Failed to fetch stack information:', error);
      throw error;
    }
  }, 30000);

  describe('Stack Status', () => {
    test('stack should be in CREATE_COMPLETE or UPDATE_COMPLETE state', async () => {
      const response = await cfnClient.send(
        new DescribeStacksCommand({ StackName: stackName })
      );
      const stack = response.Stacks![0];
      expect(['CREATE_COMPLETE', 'UPDATE_COMPLETE']).toContain(stack.StackStatus);
    });

    test('stack should have all expected outputs', () => {
      const expectedOutputs = [
        'VPCId',
        'VPCCidrBlock',
        'VPCIpv6CidrBlock',
        'PublicSubnetAZ1Id',
        'PublicSubnetAZ2Id',
        'PublicSubnetAZ3Id',
        'PrivateSubnetAZ1Id',
        'PrivateSubnetAZ2Id',
        'PrivateSubnetAZ3Id',
        'InternetGatewayId',
        'NATGatewayAZ1Id',
        'NATGatewayAZ2Id',
        'NATGatewayAZ3Id',
        'FlowLogsLogGroupName'
      ];

      expectedOutputs.forEach(outputKey => {
        expect(stackOutputs[outputKey]).toBeDefined();
      });
    });
  });

  describe('VPC Validation', () => {
    test('VPC should exist with correct CIDR block', async () => {
      const vpcId = stackOutputs.VPCId;
      const response = await ec2Client.send(
        new DescribeVpcsCommand({ VpcIds: [vpcId] })
      );

      expect(response.Vpcs!.length).toBe(1);
      const vpc = response.Vpcs![0];
      expect(vpc.CidrBlock).toBe('10.0.0.0/16');
    });

    test('VPC should have IPv6 CIDR block assigned', async () => {
      const vpcId = stackOutputs.VPCId;
      const response = await ec2Client.send(
        new DescribeVpcsCommand({ VpcIds: [vpcId] })
      );

      const vpc = response.Vpcs![0];
      expect(vpc.Ipv6CidrBlockAssociationSet).toBeDefined();
      expect(vpc.Ipv6CidrBlockAssociationSet!.length).toBeGreaterThan(0);
      expect(vpc.Ipv6CidrBlockAssociationSet![0].Ipv6CidrBlockState!.State).toBe('associated');
    });
  });

  describe('Subnets Validation', () => {
    test('all public subnets should exist', async () => {
      const subnetIds = [
        stackOutputs.PublicSubnetAZ1Id,
        stackOutputs.PublicSubnetAZ2Id,
        stackOutputs.PublicSubnetAZ3Id
      ];

      const response = await ec2Client.send(
        new DescribeSubnetsCommand({ SubnetIds: subnetIds })
      );

      expect(response.Subnets!.length).toBe(3);
    });

    test('all private subnets should exist', async () => {
      const subnetIds = [
        stackOutputs.PrivateSubnetAZ1Id,
        stackOutputs.PrivateSubnetAZ2Id,
        stackOutputs.PrivateSubnetAZ3Id
      ];

      const response = await ec2Client.send(
        new DescribeSubnetsCommand({ SubnetIds: subnetIds })
      );

      expect(response.Subnets!.length).toBe(3);
    });
  });

  describe('NAT Gateways Validation', () => {
    test('all NAT Gateways should exist and be available', async () => {
      const natGatewayIds = [
        stackOutputs.NATGatewayAZ1Id,
        stackOutputs.NATGatewayAZ2Id,
        stackOutputs.NATGatewayAZ3Id
      ];

      const response = await ec2Client.send(
        new DescribeNatGatewaysCommand({ NatGatewayIds: natGatewayIds })
      );

      expect(response.NatGateways!.length).toBe(3);
      response.NatGateways!.forEach(nat => {
        expect(nat.State).toBe('available');
      });
    });
  });
});
