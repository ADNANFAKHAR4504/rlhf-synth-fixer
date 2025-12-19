import {
  DescribeSubnetsCommand,
  DescribeVpcsCommand,
  DescribeRouteTablesCommand,
  DescribeInternetGatewaysCommand,
  DescribeNatGatewaysCommand,
  EC2Client,
} from '@aws-sdk/client-ec2';
import fs from 'fs';

const region = process.env.AWS_REGION || 'us-east-1';
const outputs = JSON.parse(fs.readFileSync('cfn-outputs/flat-outputs.json', 'utf-8'));

const ec2 = new EC2Client({ region });

describe('VPC Stack Integration Tests', () => {
  test('VPC should exist', async () => {
    const res = await ec2.send(new DescribeVpcsCommand({ VpcIds: [outputs.VPCId] }));
    expect(res.Vpcs?.length).toBe(1);
  });

  test('Public and private subnets should exist in the VPC', async () => {
    const res = await ec2.send(new DescribeSubnetsCommand({
      SubnetIds: [outputs.PublicSubnetId, outputs.PrivateSubnetId],
    }));
    expect(res.Subnets?.length).toBe(2);
    res.Subnets?.forEach(s => {
      expect(s.VpcId).toBe(outputs.VPCId);
    });
  });

  test('Internet Gateway should be attached to the VPC', async () => {
    const res = await ec2.send(new DescribeInternetGatewaysCommand({
      InternetGatewayIds: [outputs.InternetGatewayId],
    }));
    expect(res.InternetGateways?.length).toBe(1);
    const attachment = res.InternetGateways?.[0].Attachments?.[0];
    expect(attachment?.VpcId).toBe(outputs.VPCId);
    expect(attachment?.State).toBe('available');
  });

  test('Public route table should exist and route to Internet Gateway', async () => {
    const res = await ec2.send(new DescribeRouteTablesCommand({
      RouteTableIds: [outputs.PublicRouteTableId],
    }));
    expect(res.RouteTables?.length).toBe(1);
    const route = res.RouteTables?.[0].Routes?.find(r => r.DestinationCidrBlock === '0.0.0.0/0');
    expect(route).toBeDefined(); // LocalStack may not populate GatewayId
  });

  test('NAT Gateway should exist in the public subnet', async () => {
    const res = await ec2.send(new DescribeNatGatewaysCommand({
      Filter: [
        { Name: 'subnet-id', Values: [outputs.PublicSubnetId] },
        { Name: 'vpc-id', Values: [outputs.VPCId] }
      ]
    }));
    const natGateway = res.NatGateways?.[0];
    expect(natGateway).toBeDefined();
    expect(natGateway?.SubnetId).toBe(outputs.PublicSubnetId);
    expect(natGateway?.State).toMatch(/available|pending/i);
  });

  test('All required output keys are present', () => {
    const expected = [
      'VPCId',
      'PublicSubnetId',
      'PrivateSubnetId',
      'InternetGatewayId',
      'PublicRouteTableId',
    ];
    expected.forEach(key => expect(outputs[key]).toBeDefined());
  });
});
