import {
  EC2Client,
  DescribeVpcsCommand,
  DescribeSubnetsCommand,
  DescribeRouteTablesCommand,
  DescribeSecurityGroupsCommand,
  DescribeInstancesCommand,
  DescribeNatGatewaysCommand,
  DescribeInternetGatewaysCommand,
  DescribeAddressesCommand
} from '@aws-sdk/client-ec2';
import fs from 'fs';

const outputs = JSON.parse(fs.readFileSync('cfn-outputs/flat-outputs.json', 'utf8'));
const ec2 = new EC2Client({});

describe('VPC Infrastructure Integration Tests', () => {
  test('VPC exists with correct CIDR block', async () => {
    const vpcId = outputs.VPCId;
    const { Vpcs } = await ec2.send(new DescribeVpcsCommand({ VpcIds: [vpcId] }));
    expect(Vpcs?.[0]?.CidrBlock).toBe('10.0.0.0/16');
    expect(Vpcs?.[0]?.Tags).toEqual(
      expect.arrayContaining([{ Key: 'Environment', Value: 'Development' }])
    );
  });

  test('Public subnet is correctly defined', async () => {
    const { Subnets } = await ec2.send(new DescribeSubnetsCommand({ SubnetIds: [outputs.PublicSubnetId] }));
    expect(Subnets?.[0]?.CidrBlock).toBe('10.0.0.0/24');
    expect(Subnets?.[0]?.MapPublicIpOnLaunch).toBe(true);
  });

  test('Private subnet is correctly defined', async () => {
    const { Subnets } = await ec2.send(new DescribeSubnetsCommand({ SubnetIds: [outputs.PrivateSubnetId] }));
    expect(Subnets?.[0]?.CidrBlock).toBe('10.0.1.0/24');
  });

  test('NAT Gateway exists in public subnet with allocated EIP', async () => {
    const { NatGateways } = await ec2.send(new DescribeNatGatewaysCommand({ NatGatewayIds: [outputs.NATGatewayId] }));
    expect(NatGateways?.[0]?.SubnetId).toBe(outputs.PublicSubnetId);
    expect(NatGateways?.[0]?.NatGatewayAddresses?.[0]?.AllocationId).toBe(outputs.NatEIPAllocationId);
  });

  test('Elastic IP exists and matches NAT Gateway allocation ID', async () => {
    const { Addresses } = await ec2.send(new DescribeAddressesCommand({ AllocationIds: [outputs.NatEIPAllocationId] }));
    expect(Addresses?.[0]?.AllocationId).toBe(outputs.NatEIPAllocationId);
  });

  test('Internet Gateway is attached to the VPC', async () => {
    const { InternetGateways } = await ec2.send(new DescribeInternetGatewaysCommand({
      InternetGatewayIds: [outputs.InternetGatewayId]
    }));

    const igw = InternetGateways?.[0];
    const attachment = igw?.Attachments?.find(att => att.VpcId === outputs.VPCId);
    expect(attachment).toBeDefined();

    // Accept 'available' as valid, because AWS often returns this instead of 'attached'
    expect(['attached', 'available']).toContain(attachment?.State);
  });


  test('Security Group allows SSH access from specific CIDR block', async () => {
    const { SecurityGroups } = await ec2.send(new DescribeSecurityGroupsCommand({ GroupIds: [outputs.SecurityGroupId] }));
    const ingress = SecurityGroups?.[0]?.IpPermissions ?? [];
    const sshRule = ingress.find(p =>
      p.IpProtocol === 'tcp' &&
      p.FromPort === 22 &&
      p.ToPort === 22 &&
      p.IpRanges?.some(r => r.CidrIp === '198.51.100.0/24')
    );
    expect(sshRule).toBeDefined();
  });

  test('Public instance is in public subnet', async () => {
    const { Reservations } = await ec2.send(new DescribeInstancesCommand({ InstanceIds: [outputs.PublicInstanceId] }));
    const instance = Reservations?.[0]?.Instances?.[0];
    expect(instance?.SubnetId).toBe(outputs.PublicSubnetId);
    expect(instance?.SecurityGroups?.some(sg => sg.GroupId === outputs.SecurityGroupId)).toBe(true);
  });

  test('Private instance is in private subnet', async () => {
    const { Reservations } = await ec2.send(new DescribeInstancesCommand({ InstanceIds: [outputs.PrivateInstanceId] }));
    const instance = Reservations?.[0]?.Instances?.[0];
    expect(instance?.SubnetId).toBe(outputs.PrivateSubnetId);
    expect(instance?.SecurityGroups?.some(sg => sg.GroupId === outputs.SecurityGroupId)).toBe(true);
  });
});