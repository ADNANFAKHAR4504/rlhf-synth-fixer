import {
  CloudFormationClient,
  DescribeStackResourcesCommand,
  DescribeStacksCommand,
} from '@aws-sdk/client-cloudformation';
import {
  DescribeFlowLogsCommand,
  DescribeInternetGatewaysCommand,
  DescribeNatGatewaysCommand,
  DescribeSubnetsCommand,
  DescribeVpcAttributeCommand,
  DescribeVpcsCommand,
  EC2Client,
} from '@aws-sdk/client-ec2';
import { HeadBucketCommand, S3Client } from '@aws-sdk/client-s3';

// Get region from AWS_REGION file
import fs from 'fs';
import path from 'path';
const awsRegion = fs.readFileSync(path.join(__dirname, '../lib/AWS_REGION'), 'utf8').trim();

// Get environment suffix from environment variable (set by CI/CD pipeline)
const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';
const stackName = `TapStack${environmentSuffix}`;

const cfnClient = new CloudFormationClient({ region: awsRegion });
const ec2Client = new EC2Client({ region: awsRegion });
const s3Client = new S3Client({ region: awsRegion });

describe('VPC Infrastructure Integration Tests', () => {
  let stackOutputs: Record<string, string> = {};
  let stackResources: any[] = [];

  beforeAll(async () => {
    try {
      // Discover stack outputs
      const stackResponse = await cfnClient.send(
        new DescribeStacksCommand({ StackName: stackName })
      );
      const stack = stackResponse.Stacks?.[0];

      if (stack?.Outputs) {
        stack.Outputs.forEach(output => {
          if (output.OutputKey && output.OutputValue) {
            stackOutputs[output.OutputKey] = output.OutputValue;
          }
        });
      }

      // Discover stack resources
      const resourcesResponse = await cfnClient.send(
        new DescribeStackResourcesCommand({ StackName: stackName })
      );
      stackResources = resourcesResponse.StackResources || [];
    } catch (error) {
      console.error('Failed to discover stack:', error);
      throw error;
    }
  }, 30000);

  describe('Stack Discovery', () => {
    test('should discover CloudFormation stack', () => {
      expect(Object.keys(stackOutputs).length).toBeGreaterThan(0);
    });

    test('should have stack resources', () => {
      expect(stackResources.length).toBeGreaterThan(0);
    });

    test('should discover VPC ID output', () => {
      expect(stackOutputs.VPCId).toBeDefined();
      expect(stackOutputs.VPCId).toMatch(/^vpc-[a-f0-9]+$/);
    });
  });

  describe('VPC Infrastructure', () => {
    test('should have a VPC with correct configuration', async () => {
      const vpcId = stackOutputs.VPCId;
      expect(vpcId).toBeDefined();

      const vpcResponse = await ec2Client.send(
        new DescribeVpcsCommand({ VpcIds: [vpcId] })
      );

      const vpc = vpcResponse.Vpcs?.[0];
      expect(vpc).toBeDefined();
      expect(vpc?.State).toBe('available');

      // Check DNS attributes using separate API calls
      const dnsHostnamesResponse = await ec2Client.send(
        new DescribeVpcAttributeCommand({
          VpcId: vpcId,
          Attribute: 'enableDnsHostnames',
        })
      );
      expect(dnsHostnamesResponse.EnableDnsHostnames?.Value).toBe(true);

      const dnsSupportResponse = await ec2Client.send(
        new DescribeVpcAttributeCommand({
          VpcId: vpcId,
          Attribute: 'enableDnsSupport',
        })
      );
      expect(dnsSupportResponse.EnableDnsSupport?.Value).toBe(true);
    });

    test('should have VPC CIDR block output', () => {
      expect(stackOutputs.VPCCidr).toBeDefined();
      expect(stackOutputs.VPCCidr).toMatch(/^10\.\d+\.\d+\.\d+\/16$/);
    });
  });

  describe('Subnets', () => {
    test('should have 3 public subnets', async () => {
      const publicSubnetIds = [
        stackOutputs.PublicSubnet1Id,
        stackOutputs.PublicSubnet2Id,
        stackOutputs.PublicSubnet3Id,
      ];

      publicSubnetIds.forEach(id => {
        expect(id).toBeDefined();
        expect(id).toMatch(/^subnet-[a-f0-9]+$/);
      });

      const subnetsResponse = await ec2Client.send(
        new DescribeSubnetsCommand({ SubnetIds: publicSubnetIds })
      );

      expect(subnetsResponse.Subnets?.length).toBe(3);
      subnetsResponse.Subnets?.forEach(subnet => {
        expect(subnet.MapPublicIpOnLaunch).toBe(true);
      });
    });

    test('should have 3 private subnets', async () => {
      const privateSubnetIds = [
        stackOutputs.PrivateSubnet1Id,
        stackOutputs.PrivateSubnet2Id,
        stackOutputs.PrivateSubnet3Id,
      ];

      privateSubnetIds.forEach(id => {
        expect(id).toBeDefined();
        expect(id).toMatch(/^subnet-[a-f0-9]+$/);
      });

      const subnetsResponse = await ec2Client.send(
        new DescribeSubnetsCommand({ SubnetIds: privateSubnetIds })
      );

      expect(subnetsResponse.Subnets?.length).toBe(3);
      subnetsResponse.Subnets?.forEach(subnet => {
        expect(subnet.MapPublicIpOnLaunch).toBe(false);
      });
    });

    test('should have subnets in different availability zones', async () => {
      const allSubnetIds = [
        stackOutputs.PublicSubnet1Id,
        stackOutputs.PublicSubnet2Id,
        stackOutputs.PublicSubnet3Id,
      ];

      const subnetsResponse = await ec2Client.send(
        new DescribeSubnetsCommand({ SubnetIds: allSubnetIds })
      );

      const azs = new Set(
        subnetsResponse.Subnets?.map(s => s.AvailabilityZone) || []
      );
      expect(azs.size).toBeGreaterThanOrEqual(2);
    });
  });

  describe('NAT Gateways', () => {
    test('should have 2 NAT Gateways', async () => {
      const natGatewayIds = [
        stackOutputs.NatGateway1Id,
        stackOutputs.NatGateway2Id,
      ];

      natGatewayIds.forEach(id => {
        expect(id).toBeDefined();
        expect(id).toMatch(/^nat-[a-f0-9]+$/);
      });

      const natResponse = await ec2Client.send(
        new DescribeNatGatewaysCommand({ NatGatewayIds: natGatewayIds })
      );

      expect(natResponse.NatGateways?.length).toBe(2);
      natResponse.NatGateways?.forEach(nat => {
        expect(nat.State).toMatch(/^(available|pending)$/);
      });
    });
  });

  describe('Internet Gateway', () => {
    test('should have an Internet Gateway', async () => {
      const igwId = stackOutputs.InternetGatewayId;
      expect(igwId).toBeDefined();
      expect(igwId).toMatch(/^igw-[a-f0-9]+$/);

      const igwResponse = await ec2Client.send(
        new DescribeInternetGatewaysCommand({ InternetGatewayIds: [igwId] })
      );

      const igw = igwResponse.InternetGateways?.[0];
      expect(igw).toBeDefined();
      expect(igw?.Attachments?.[0]?.State).toBe('available');
      expect(igw?.Attachments?.[0]?.VpcId).toBe(stackOutputs.VPCId);
    });
  });

  describe('VPC Flow Logs', () => {
    test('should have VPC Flow Logs configured', async () => {
      const vpcId = stackOutputs.VPCId;

      const flowLogsResponse = await ec2Client.send(
        new DescribeFlowLogsCommand({
          Filter: [
            {
              Name: 'resource-id',
              Values: [vpcId],
            },
          ],
        })
      );

      expect(flowLogsResponse.FlowLogs?.length).toBeGreaterThan(0);
      const flowLog = flowLogsResponse.FlowLogs?.[0];
      expect(flowLog?.TrafficType).toBe('ALL');
      expect(flowLog?.LogDestinationType).toBe('s3');
    });

    test('should have S3 bucket for flow logs', async () => {
      const bucketName = stackOutputs.FlowLogsBucketName;
      expect(bucketName).toBeDefined();
      expect(bucketName).toContain('vpc-flow-logs');

      // Verify bucket exists
      await expect(
        s3Client.send(new HeadBucketCommand({ Bucket: bucketName }))
      ).resolves.not.toThrow();
    });
  });

  describe('Resource Tagging', () => {
    test('should have proper tags on VPC', async () => {
      const vpcId = stackOutputs.VPCId;
      const vpcResponse = await ec2Client.send(
        new DescribeVpcsCommand({ VpcIds: [vpcId] })
      );

      const vpc = vpcResponse.Vpcs?.[0];
      const tags = vpc?.Tags || [];
      const tagKeys = tags.map(t => t.Key);

      expect(tagKeys).toContain('Environment');
      expect(tagKeys).toContain('Project');
      expect(tagKeys).toContain('ManagedBy');
      expect(tagKeys).toContain('TargetRegion');

      const targetRegionTag = tags.find(t => t.Key === 'TargetRegion');
      expect(targetRegionTag?.Value).toBe('eu-south-1');
    });
  });

  describe('Stack Outputs', () => {
    test('should have all expected outputs', () => {
      const expectedOutputs = [
        'VPCId',
        'VPCCidr',
        'PublicSubnets',
        'PublicSubnet1Id',
        'PublicSubnet2Id',
        'PublicSubnet3Id',
        'PrivateSubnets',
        'PrivateSubnet1Id',
        'PrivateSubnet2Id',
        'PrivateSubnet3Id',
        'InternetGatewayId',
        'NatGateway1Id',
        'NatGateway2Id',
        'FlowLogsBucketName',
        'AvailabilityZones',
      ];

      expectedOutputs.forEach(output => {
        expect(stackOutputs[output]).toBeDefined();
      });
    });

    test('should have availability zones output with multiple AZs', () => {
      const azs = stackOutputs.AvailabilityZones;
      expect(azs).toBeDefined();

      const azArray = azs.split(',');
      expect(azArray.length).toBeGreaterThanOrEqual(2);
      azArray.forEach(az => {
        expect(az).toMatch(/^[a-z]+-[a-z]+-\d+[a-z]$/);
      });
    });
  });
});
