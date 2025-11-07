// Configuration - Dynamically discover stack outputs from CloudFormation
import {
  CloudFormationClient,
  DescribeStacksCommand,
} from '@aws-sdk/client-cloudformation';
import {
  DescribeFlowLogsCommand,
  DescribeInternetGatewaysCommand,
  DescribeNatGatewaysCommand,
  DescribeSecurityGroupsCommand,
  DescribeSubnetsCommand,
  DescribeVpcAttributeCommand,
  DescribeVpcEndpointsCommand,
  DescribeVpcsCommand,
  EC2Client,
} from '@aws-sdk/client-ec2';
import { HeadBucketCommand, S3Client } from '@aws-sdk/client-s3';

// Get environment suffix from environment variable (set by CI/CD pipeline)
const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';
const stackName = `TapStack${environmentSuffix}`;
// Region must match the region configured in bin/tap.ts
const region = 'us-east-2';

// AWS SDK Clients
const cfnClient = new CloudFormationClient({ region });
const ec2Client = new EC2Client({ region });
const s3Client = new S3Client({ region });

// Helper function to get stack outputs
async function getStackOutputs(): Promise<Record<string, string>> {
  const response = await cfnClient.send(
    new DescribeStacksCommand({ StackName: stackName })
  );

  const stack = response.Stacks?.[0];
  if (!stack || !stack.Outputs) {
    throw new Error(`Stack ${stackName} not found or has no outputs`);
  }

  const outputs: Record<string, string> = {};
  for (const output of stack.Outputs) {
    if (output.OutputKey && output.OutputValue) {
      outputs[output.OutputKey] = output.OutputValue;
    }
  }

  return outputs;
}

// Global variable to store outputs (loaded once before all tests)
let outputs: Record<string, string>;

describe('Payment Processing VPC Integration Tests', () => {
  // Load stack outputs once before all tests
  beforeAll(async () => {
    outputs = await getStackOutputs();
  }, 30000); // 30 second timeout for stack discovery

  describe('VPC Configuration', () => {
    test('VPC exists with correct CIDR block', async () => {
      const vpcId = outputs!.VpcId;
      expect(vpcId).toBeDefined();

      const response = await ec2Client.send(
        new DescribeVpcsCommand({ VpcIds: [vpcId] })
      );

      expect(response.Vpcs).toHaveLength(1);
      expect(response.Vpcs![0].CidrBlock).toBe('10.0.0.0/16');

      // Check DNS attributes using DescribeVpcAttribute
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

    test('VPC has mandatory tags', async () => {
      const vpcId = outputs!.VpcId;
      const response = await ec2Client.send(
        new DescribeVpcsCommand({ VpcIds: [vpcId] })
      );

      const tags = response.Vpcs![0].Tags || [];
      const tagMap = Object.fromEntries(
        tags.map((tag) => [tag.Key, tag.Value])
      );

      expect(tagMap['Environment']).toBe('production');
      expect(tagMap['Project']).toBe('payment-processor');
      expect(tagMap['CostCenter']).toBe('engineering');
    });
  });

  describe('Subnet Configuration', () => {
    test('public subnets exist and are configured correctly', async () => {
      const subnetIds = outputs!.PublicSubnetIds.split(',');
      expect(subnetIds).toHaveLength(3);

      const response = await ec2Client.send(
        new DescribeSubnetsCommand({ SubnetIds: subnetIds })
      );

      expect(response.Subnets).toHaveLength(3);
      response.Subnets!.forEach((subnet) => {
        expect(subnet.MapPublicIpOnLaunch).toBe(true);
      });
    });

    test('private subnets exist and are configured correctly', async () => {
      const subnetIds = outputs!.PrivateSubnetIds.split(',');
      expect(subnetIds).toHaveLength(3);

      const response = await ec2Client.send(
        new DescribeSubnetsCommand({ SubnetIds: subnetIds })
      );

      expect(response.Subnets).toHaveLength(3);
      response.Subnets!.forEach((subnet) => {
        expect(subnet.MapPublicIpOnLaunch).toBe(false);
      });
    });

    test('subnets span 3 availability zones', async () => {
      const publicSubnetIds = outputs!.PublicSubnetIds.split(',');
      const privateSubnetIds = outputs!.PrivateSubnetIds.split(',');
      const allSubnetIds = [...publicSubnetIds, ...privateSubnetIds];

      const response = await ec2Client.send(
        new DescribeSubnetsCommand({ SubnetIds: allSubnetIds })
      );

      const availabilityZones = new Set(
        response.Subnets!.map((subnet) => subnet.AvailabilityZone)
      );

      expect(availabilityZones.size).toBe(3);
    });
  });

  describe('NAT Gateway Configuration', () => {
    test('NAT Gateway exists in public subnet', async () => {
      const vpcId = outputs!.VpcId;
      const response = await ec2Client.send(
        new DescribeNatGatewaysCommand({
          Filter: [
            { Name: 'vpc-id', Values: [vpcId] },
            { Name: 'state', Values: ['available'] },
          ],
        })
      );

      // Expect at least 1 NAT Gateway (currently configured for 1 to save costs)
      expect(response.NatGateways!.length).toBeGreaterThanOrEqual(1);

      const publicSubnetIds = outputs!.PublicSubnetIds.split(',');
      response.NatGateways!.forEach((natGateway) => {
        expect(publicSubnetIds).toContain(natGateway.SubnetId);
      });
    });
  });

  describe('Internet Gateway Configuration', () => {
    test('Internet Gateway exists and is attached to VPC', async () => {
      const vpcId = outputs!.VpcId;
      const response = await ec2Client.send(
        new DescribeInternetGatewaysCommand({
          Filters: [{ Name: 'attachment.vpc-id', Values: [vpcId] }],
        })
      );

      expect(response.InternetGateways).toHaveLength(1);
      expect(response.InternetGateways![0].Attachments![0].VpcId).toBe(vpcId);
    });
  });

  describe('Security Groups', () => {
    test('ALB security group allows HTTP and HTTPS traffic', async () => {
      const sgId = outputs!.ALBSecurityGroupId;
      const response = await ec2Client.send(
        new DescribeSecurityGroupsCommand({ GroupIds: [sgId] })
      );

      expect(response.SecurityGroups).toHaveLength(1);
      const sg = response.SecurityGroups![0];

      const httpRule = sg.IpPermissions!.find(
        (rule) => rule.FromPort === 80 && rule.ToPort === 80
      );
      const httpsRule = sg.IpPermissions!.find(
        (rule) => rule.FromPort === 443 && rule.ToPort === 443
      );

      expect(httpRule).toBeDefined();
      expect(httpsRule).toBeDefined();
    });

    test('ECS security group allows traffic from ALB on port 8080', async () => {
      const sgId = outputs!.ECSSecurityGroupId;
      const albSgId = outputs!.ALBSecurityGroupId;

      const response = await ec2Client.send(
        new DescribeSecurityGroupsCommand({ GroupIds: [sgId] })
      );

      expect(response.SecurityGroups).toHaveLength(1);
      const sg = response.SecurityGroups![0];

      const ecsRule = sg.IpPermissions!.find(
        (rule) =>
          rule.FromPort === 8080 &&
          rule.ToPort === 8080 &&
          rule.UserIdGroupPairs?.some((pair) => pair.GroupId === albSgId)
      );

      expect(ecsRule).toBeDefined();
    });

    test('RDS security group allows traffic from ECS on port 5432', async () => {
      const sgId = outputs!.RDSSecurityGroupId;
      const ecsSgId = outputs!.ECSSecurityGroupId;

      const response = await ec2Client.send(
        new DescribeSecurityGroupsCommand({ GroupIds: [sgId] })
      );

      expect(response.SecurityGroups).toHaveLength(1);
      const sg = response.SecurityGroups![0];

      const rdsRule = sg.IpPermissions!.find(
        (rule) =>
          rule.FromPort === 5432 &&
          rule.ToPort === 5432 &&
          rule.UserIdGroupPairs?.some((pair) => pair.GroupId === ecsSgId)
      );

      expect(rdsRule).toBeDefined();
    });

    test('all security groups have mandatory tags', async () => {
      const sgIds = [
        outputs!.ALBSecurityGroupId,
        outputs!.ECSSecurityGroupId,
        outputs!.RDSSecurityGroupId,
      ];

      const response = await ec2Client.send(
        new DescribeSecurityGroupsCommand({ GroupIds: sgIds })
      );

      response.SecurityGroups!.forEach((sg) => {
        const tags = sg.Tags || [];
        const tagMap = Object.fromEntries(
          tags.map((tag) => [tag.Key, tag.Value])
        );

        expect(tagMap['Environment']).toBe('production');
        expect(tagMap['Project']).toBe('payment-processor');
        expect(tagMap['CostCenter']).toBe('engineering');
      });
    });
  });

  describe('VPC Flow Logs', () => {
    test('VPC Flow Logs are enabled', async () => {
      const vpcId = outputs!.VpcId;
      const response = await ec2Client.send(
        new DescribeFlowLogsCommand({
          Filter: [{ Name: 'resource-id', Values: [vpcId] }],
        })
      );

      expect(response.FlowLogs!.length).toBeGreaterThan(0);

      const flowLog = response.FlowLogs![0];
      expect(flowLog.TrafficType).toBe('ALL');
      expect(flowLog.LogDestinationType).toBe('s3');
      expect(flowLog.MaxAggregationInterval).toBe(60);
    });

    test('Flow Log S3 bucket exists', async () => {
      const bucketName = outputs!.FlowLogBucketName;
      expect(bucketName).toBeDefined();

      await expect(
        s3Client.send(new HeadBucketCommand({ Bucket: bucketName }))
      ).resolves.not.toThrow();
    });
  });

  describe('VPC Endpoints', () => {
    test('S3 VPC endpoint exists', async () => {
      const vpcId = outputs!.VpcId;
      const response = await ec2Client.send(
        new DescribeVpcEndpointsCommand({
          Filters: [
            { Name: 'vpc-id', Values: [vpcId] },
            { Name: 'service-name', Values: [`com.amazonaws.${region}.s3`] },
          ],
        })
      );

      expect(response.VpcEndpoints!.length).toBeGreaterThan(0);
      expect(response.VpcEndpoints![0].VpcEndpointType).toBe('Gateway');
    });

    test('DynamoDB VPC endpoint exists', async () => {
      const vpcId = outputs!.VpcId;
      const response = await ec2Client.send(
        new DescribeVpcEndpointsCommand({
          Filters: [
            { Name: 'vpc-id', Values: [vpcId] },
            {
              Name: 'service-name',
              Values: [`com.amazonaws.${region}.dynamodb`],
            },
          ],
        })
      );

      expect(response.VpcEndpoints!.length).toBeGreaterThan(0);
      expect(response.VpcEndpoints![0].VpcEndpointType).toBe('Gateway');
    });
  });
});
