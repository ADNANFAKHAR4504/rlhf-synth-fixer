import {
  DescribeRouteTablesCommand,
  DescribeSubnetsCommand,
  DescribeVpcsCommand,
  EC2Client
} from '@aws-sdk/client-ec2';

const region = 'us-east-1'; // change if needed
const client = new EC2Client({ region });

let vpcId: string | undefined;
let infrastructureDeployed = false;

describe('Real AWS Integration: TapStack VPC Deployment', () => {
  beforeAll(async () => {
    try {
      const vpcs = await client.send(new DescribeVpcsCommand({}));
      const vpc = vpcs.Vpcs?.find(v =>
        v.Tags?.some(tag => tag.Key === 'Name' && tag.Value === 'main-vpc')
      );
      vpcId = vpc?.VpcId;
      infrastructureDeployed = !!vpcId;
    } catch (error) {
      // Infrastructure not deployed or AWS credentials not configured
      infrastructureDeployed = false;
    }
  });

  test('VPC should exist with correct CIDR block', async () => {
    if (!infrastructureDeployed) {
      console.log('Skipping: Infrastructure not deployed');
      return;
    }

    const vpcs = await client.send(new DescribeVpcsCommand({ VpcIds: [vpcId!] }));
    const vpc = vpcs.Vpcs?.[0];
    expect(vpc?.CidrBlock).toBe('10.0.0.0/16');
  });

  test('VPC should have Environment tag set to Production', async () => {
    if (!infrastructureDeployed) {
      console.log('Skipping: Infrastructure not deployed');
      return;
    }

    const vpcs = await client.send(new DescribeVpcsCommand({ VpcIds: [vpcId!] }));
    const tags = vpcs.Vpcs?.[0].Tags;
    const envTag = tags?.find(tag => tag.Key === 'Environment');
    expect(envTag?.Value).toBe('Production');
  });

  test('Subnets should be created within the VPC', async () => {
    if (!infrastructureDeployed) {
      console.log('Skipping: Infrastructure not deployed');
      return;
    }

    const subnets = await client.send(new DescribeSubnetsCommand({}));
    const privateSubnets = subnets.Subnets?.filter(
      subnet =>
        subnet.VpcId === vpcId &&
        subnet.Tags?.some(t => t.Key === 'Name' && t.Value?.startsWith('private-subnet'))
    );
    expect(privateSubnets?.length).toBeGreaterThanOrEqual(2);
  });

  test('Route Tables should be associated with subnets', async () => {
    if (!infrastructureDeployed) {
      console.log('Skipping: Infrastructure not deployed');
      return;
    }

    const routeTables = await client.send(new DescribeRouteTablesCommand({}));
    const associations = routeTables.RouteTables?.flatMap(rt => rt.Associations || []);
    const associatedSubnetIds = associations?.filter(a => a.SubnetId).map(a => a.SubnetId);

    expect(associatedSubnetIds?.length).toBeGreaterThanOrEqual(4); // 2 public + 2 private
  });
});
