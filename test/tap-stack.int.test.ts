import { DescribeRouteTablesCommand, DescribeSubnetsCommand, DescribeVpcsCommand, EC2Client } from '@aws-sdk/client-ec2';

const region = 'us-east-1'; // Adjust as needed
const client = new EC2Client({ region });

let vpcId: string | undefined;

describe('🧪 Real AWS Integration: TapStack VPC Deployment', () => {
  beforeAll(async () => {
    const vpcs = await client.send(new DescribeVpcsCommand({}));
    const matchingVpc = vpcs.Vpcs?.find(vpc =>
      vpc.Tags?.some(tag => tag.Key === 'Name' && tag.Value === 'main-vpc')
    );
    vpcId = matchingVpc?.VpcId;
  });

  test('✅ VPC should exist with correct CIDR block', async () => {
    expect(vpcId).toBeDefined();
    const result = await client.send(new DescribeVpcsCommand({ VpcIds: [vpcId!] }));
    const cidrBlock = result.Vpcs?.[0].CidrBlock;
    expect(cidrBlock).toBe('10.0.0.0/16'); // Replace with your expected CIDR
  });

  test('✅ VPC should have Environment tag set to Production', async () => {
    const result = await client.send(new DescribeVpcsCommand({ VpcIds: [vpcId!] }));
    const tags = result.Vpcs?.[0].Tags;
    const envTag = tags?.find(tag => tag.Key === 'Environment');
    expect(envTag?.Value).toBe('Production');
  });

  test('✅ Subnets should be created within the VPC', async () => {
    const subnets = await client.send(new DescribeSubnetsCommand({}));
    const privateSubnets = subnets.Subnets?.filter(
      subnet => subnet.VpcId === vpcId && subnet.Tags?.some(t => t.Key === 'Type' && t.Value === 'Private')
    );
    expect(privateSubnets?.length).toBeGreaterThanOrEqual(2); // Expect at least 2 private subnets
  });

  test('✅ Route Tables should be associated with subnets', async () => {
    const rt = await client.send(new DescribeRouteTablesCommand({}));
    const rtInVpc = rt.RouteTables?.filter(r => r.VpcId === vpcId);
    expect(rtInVpc?.length).toBeGreaterThanOrEqual(1);
    const associated = rtInVpc?.some(r =>
      r.Associations?.some(assoc => assoc.SubnetId && assoc.RouteTableId)
    );
    expect(associated).toBe(true);
  });
});
