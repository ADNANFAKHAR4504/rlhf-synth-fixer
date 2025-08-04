import {
  EC2Client,
  DescribeVpcsCommand,
  DescribeSubnetsCommand,
  DescribeInstancesCommand,
  DescribeInternetGatewaysCommand,
  DescribeEgressOnlyInternetGatewaysCommand,
  DescribeRouteTablesCommand,
  DescribeSecurityGroupsCommand,
} from '@aws-sdk/client-ec2';
import * as fs from 'fs';
import * as path from 'path';

const client = new EC2Client({ region: process.env.AWS_REGION || 'us-west-2' });

describe('IPv6-Only IoT Infrastructure Integration Tests', () => {
  let vpcId: string;
  let subnetId: string;
  let instanceId: string;
  let securityGroupId: string;

  beforeAll(() => {
    // Determine the path to the flat.output.json file.
    // Assuming it's in the root of the project, which is where your pipeline
    // seems to be placing it.
    const outputFilePath = path.join(__dirname, '..', 'flat.output.json');
    
    if (!fs.existsSync(outputFilePath)) {
      throw new Error(`flat.output.json not found at ${outputFilePath}. Please ensure the CI/CD pipeline places the output file correctly.`);
    }

    // Read and parse the outputs file
    const outputs = JSON.parse(fs.readFileSync(outputFilePath, 'utf-8'));
    
    // Extract the values from the nested structure
    // The key is the stack name, "TapStackpr435" in your case.
    const stackOutputs = outputs.TapStackpr435;

    vpcId = stackOutputs['vpc-id'];
    subnetId = stackOutputs['public-subnet-id'];
    instanceId = stackOutputs['ec2-instance-id'];
    
    if (!vpcId || !subnetId || !instanceId) {
      throw new Error("Required Terraform outputs not found in flat.output.json.");
    }
  });

  // Test 1: Verify the VPC exists with the correct properties
  test('should find the IPv6-enabled VPC with both IPv4 (dummy) and IPv6 CIDRs', async () => {
    const result = await client.send(new DescribeVpcsCommand({ VpcIds: [vpcId] }));
    const vpc = result.Vpcs?.[0];

    expect(vpc).toBeDefined();
    expect(vpc?.IsDefault).toBe(false);
    expect(vpc?.CidrBlock).toBe('10.0.0.0/16');
    expect(vpc?.Ipv6CidrBlockAssociationSet).toBeDefined();
    expect(vpc?.Ipv6CidrBlockAssociationSet?.length).toBeGreaterThan(0);
    expect(vpc?.Tags).toEqual(expect.arrayContaining([
      { Key: 'Environment', Value: 'dev' },
      { Key: 'Project', Value: 'IPv6-IoT' },
    ]));
  });

  // Test 2: Verify the public subnet exists and is correctly configured
  test('should find the public IPv6-only subnet with no IPv4 public IP mapping', async () => {
    const result = await client.send(new DescribeSubnetsCommand({ SubnetIds: [subnetId] }));
    const subnet = result.Subnets?.[0];

    expect(subnet).toBeDefined();
    expect(subnet?.VpcId).toBe(vpcId);
    expect(subnet?.MapPublicIpOnLaunch).toBe(false);
    expect(subnet?.Ipv6CidrBlockAssociationSet).toBeDefined();
    expect(subnet?.Tags).toEqual(expect.arrayContaining([
      { Key: 'Environment', Value: 'dev' },
    ]));
  });

  // Test 3: Verify the Internet Gateway is attached to the VPC
  test('should find the Internet Gateway attached to the VPC', async () => {
    const result = await client.send(new DescribeInternetGatewaysCommand({
      Filters: [{ Name: 'attachment.vpc-id', Values: [vpcId] }]
    }));
    const igw = result.InternetGateways?.[0];

    expect(igw).toBeDefined();
    expect(igw?.Attachments?.length).toBe(1);
    expect(igw?.Attachments?.[0].VpcId).toBe(vpcId);
  });

  // Test 4: Verify the Egress-Only Internet Gateway is attached to the VPC
  test('should find the Egress-Only Internet Gateway attached to the VPC', async () => {
    const result = await client.send(new DescribeEgressOnlyInternetGatewaysCommand({
      Filters: [{ Name: 'attachment.vpc-id', Values: [vpcId] }]
    }));
    const eoigw = result.EgressOnlyInternetGateways?.[0];

    expect(eoigw).toBeDefined();
    expect(eoigw?.Attachments?.length).toBe(1);
    expect(eoigw?.Attachments?.[0].VpcId).toBe(vpcId);
  });

  // Test 5: Verify the Route Table has an IPv6 default route
  test('should find a route table with a default IPv6 route to the Internet Gateway', async () => {
    const result = await client.send(new DescribeRouteTablesCommand({
      Filters: [{ Name: 'vpc-id', Values: [vpcId] }]
    }));
    const routeTable = result.RouteTables?.[0];

    expect(routeTable).toBeDefined();
    const ipv6Route = routeTable?.Routes?.find(
      (r) => r.DestinationIpv6CidrBlock === '::/0' && r.GatewayId?.startsWith('igw-')
    );
    expect(ipv6Route).toBeDefined();
  });

  // Test 6: Verify the Security Group exists with IPv6-only rules
  test('should find the IPv6-only Security Group with the correct rules', async () => {
    const result = await client.send(new DescribeSecurityGroupsCommand({
      Filters: [{ Name: 'vpc-id', Values: [vpcId] }]
    }));
    const sg = result.SecurityGroups?.find(s => s.GroupName === 'tap-ec2-sg');
    
    expect(sg).toBeDefined();
    securityGroupId = sg?.GroupId as string;

    // Verify inbound rules
    expect(sg?.IpPermissions).toEqual(expect.arrayContaining([
      expect.objectContaining({
        IpProtocol: 'tcp',
        FromPort: 80,
        ToPort: 80,
        Ipv6Ranges: expect.arrayContaining([
          expect.objectContaining({ CidrIpv6: '::/0' })
        ]),
      }),
    ]));

    // Verify outbound rules
    expect(sg?.IpPermissionsEgress).toEqual(expect.arrayContaining([
      expect.objectContaining({
        IpProtocol: '-1',
        Ipv6Ranges: expect.arrayContaining([
          expect.objectContaining({ CidrIpv6: '::/0' })
        ]),
      }),
    ]));
  });

  // Test 7: Verify the EC2 instance is running and has an IPv6 address
  test('should find the EC2 instance with an IPv6 address and correct state', async () => {
    const result = await client.send(new DescribeInstancesCommand({ InstanceIds: [instanceId] }));
    const instance = result.Reservations?.[0].Instances?.[0];

    expect(instance).toBeDefined();
    expect(instance?.SubnetId).toBe(subnetId);
    expect(instance?.State?.Name).toBe('running');
    expect(instance?.Ipv6Address).toBeDefined();
    expect(instance?.Tags).toEqual(expect.arrayContaining([
      { Key: 'Environment', Value: 'dev' },
    ]));
    expect(instance?.IamInstanceProfile?.Arn).toContain('tap-ec2-ec2-instance-profile');
    expect(instance?.SecurityGroups).toEqual(expect.arrayContaining([
      expect.objectContaining({ GroupId: securityGroupId })
    ]));
  });
});