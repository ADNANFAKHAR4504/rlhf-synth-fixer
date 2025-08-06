import {
  EC2Client,
  DescribeVpcsCommand,
  DescribeSubnetsCommand,
  DescribeInternetGatewaysCommand,
  DescribeRouteTablesCommand,
  DescribeSecurityGroupsCommand,
  DescribeInstancesCommand,
  DescribeAddressesCommand,
} from '@aws-sdk/client-ec2';
import * as fs from 'fs';
import * as path from 'path';

const REGION = process.env.AWS_REGION || process.env.AWS_DEFAULT_REGION || 'us-east-1';
const ec2 = new EC2Client({ region: REGION });

// Load flat-outputs.json
const outputsPath = path.join(__dirname, '..', 'cfn-outputs', 'flat-outputs.json');

if (!fs.existsSync(outputsPath)) {
  throw new Error(` Missing flat-outputs.json at: ${outputsPath}`);
}

const outputs = JSON.parse(fs.readFileSync(outputsPath, 'utf-8'));

describe(' TapStack Infrastructure Integration Tests', () => {
  it(' VPC should exist with correct CIDR', async () => {
    const result = await ec2.send(new DescribeVpcsCommand({ VpcIds: [outputs.VpcId] }));
    const vpc = result.Vpcs?.[0];
    expect(vpc).toBeDefined();
    expect(vpc?.CidrBlock).toBe('10.0.0.0/16');
  });

  it(' Public subnets should exist with correct CIDRs', async () => {
    const result = await ec2.send(new DescribeSubnetsCommand({ SubnetIds: outputs.SubnetIds }));
    const subnets = result.Subnets || [];
    expect(subnets.length).toBe(2);

    const cidrs = subnets.map(s => s.CidrBlock);
    expect(cidrs).toContain('10.0.0.0/24');
    expect(cidrs).toContain('10.0.1.0/24');
  });

  it(' Internet Gateway should be attached to VPC', async () => {
    const result = await ec2.send(new DescribeInternetGatewaysCommand({ InternetGatewayIds: [outputs.InternetGatewayId] }));
    const igw = result.InternetGateways?.[0];
    expect(igw).toBeDefined();
    expect(igw?.Attachments?.[0]?.VpcId).toBe(outputs.VpcId);
  });

  it(' Route Table should have 0.0.0.0/0 route via IGW', async () => {
    const result = await ec2.send(new DescribeRouteTablesCommand({ RouteTableIds: [outputs.RouteTableId] }));
    const routeTable = result.RouteTables?.[0];
    const route = routeTable?.Routes?.find(r => r.DestinationCidrBlock === '0.0.0.0/0');
    expect(route?.GatewayId).toBe(outputs.InternetGatewayId);
  });

  it(' Security group should allow SSH and HTTP', async () => {
    const result = await ec2.send(new DescribeSecurityGroupsCommand({ GroupIds: [outputs.SecurityGroupId] }));
    const sg = result.SecurityGroups?.[0];

    expect(sg).toBeDefined();

    const sshRule = sg?.IpPermissions?.find(p => p.FromPort === 22 && p.IpProtocol === 'tcp');
    const httpRule = sg?.IpPermissions?.find(p => p.FromPort === 80 && p.IpProtocol === 'tcp');

    expect(sshRule).toBeDefined();
    expect(httpRule).toBeDefined();
  });

  it(' EC2 instances should be running in correct subnets and SG', async () => {
    const result = await ec2.send(new DescribeInstancesCommand({ InstanceIds: outputs.InstanceIds }));
    const reservations = result.Reservations || [];

    for (const reservation of reservations) {
      for (const instance of reservation.Instances || []) {
        expect(instance.State?.Name).toBe('running');
        expect(outputs.SubnetIds).toContain(instance.SubnetId);
        expect(instance.SecurityGroups?.some(sg => sg.GroupId === outputs.SecurityGroupId)).toBe(true);
      }
    }
  });

  it(' Elastic IPs should be associated with correct instances', async () => {
    const result = await ec2.send(new DescribeAddressesCommand({ AllocationIds: outputs.ElasticIpAllocationIds }));
    const addresses = result.Addresses || [];

    for (const address of addresses) {
      expect(outputs.InstanceIds).toContain(address.InstanceId);
    }
  });
});
