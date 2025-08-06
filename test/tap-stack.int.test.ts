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

const REGION = process.env.AWS_REGION || 'us-east-1';
const ec2 = new EC2Client({ region: REGION });

// Load stack outputs
const outputsPath = path.join(__dirname, '../flat-outputs.json');
const outputs = JSON.parse(fs.readFileSync(outputsPath, 'utf-8'));

describe('TapStack Integration Tests', () => {
  it('VPC should exist with correct CIDR', async () => {
    const res = await ec2.send(new DescribeVpcsCommand({ VpcIds: [outputs.VpcId] }));
    expect(res.Vpcs?.[0].CidrBlock).toBe('10.0.0.0/16');
  });

  it('Public subnets should exist', async () => {
    const res = await ec2.send(new DescribeSubnetsCommand({ SubnetIds: outputs.SubnetIds }));
    expect(res.Subnets?.length).toBe(2);
    const cidrs = res.Subnets?.map(s => s.CidrBlock);
    expect(cidrs).toContain('10.0.0.0/24');
    expect(cidrs).toContain('10.0.1.0/24');
  });

  it('Internet Gateway should exist and be attached to VPC', async () => {
    const res = await ec2.send(new DescribeInternetGatewaysCommand({ InternetGatewayIds: [outputs.InternetGatewayId] }));
    const igw = res.InternetGateways?.[0];
    const attachedVpcId = igw?.Attachments?.[0]?.VpcId;
    expect(attachedVpcId).toBe(outputs.VpcId);
  });

  it('Route Table should have route to IGW', async () => {
    const res = await ec2.send(new DescribeRouteTablesCommand({ RouteTableIds: [outputs.RouteTableId] }));
    const rt = res.RouteTables?.[0];
    const route = rt?.Routes?.find(r => r.DestinationCidrBlock === '0.0.0.0/0');
    expect(route?.GatewayId).toBe(outputs.InternetGatewayId);
  });

  it('Security group should allow SSH and HTTP', async () => {
    const res = await ec2.send(new DescribeSecurityGroupsCommand({ GroupIds: [outputs.SecurityGroupId] }));
    const sg = res.SecurityGroups?.[0];

    const ssh = sg?.IpPermissions?.find(p => p.FromPort === 22 && p.IpProtocol === 'tcp');
    const http = sg?.IpPermissions?.find(p => p.FromPort === 80 && p.IpProtocol === 'tcp');
    
    expect(ssh).toBeDefined();
    expect(http).toBeDefined();
  });

  it('EC2 instances should exist and be in running state', async () => {
    const res = await ec2.send(new DescribeInstancesCommand({ InstanceIds: outputs.InstanceIds }));
    for (const reservation of res.Reservations || []) {
      for (const instance of reservation.Instances || []) {
        expect(instance.State?.Name).toBe('running');
        expect(outputs.SubnetIds).toContain(instance.SubnetId);
        expect(instance.SecurityGroups?.some(sg => sg.GroupId === outputs.SecurityGroupId)).toBe(true);
      }
    }
  });

  it('Elastic IPs should be associated with instances', async () => {
    const res = await ec2.send(new DescribeAddressesCommand({ AllocationIds: outputs.ElasticIpAllocationIds }));
    for (const eip of res.Addresses || []) {
      expect(outputs.InstanceIds).toContain(eip.InstanceId);
    }
  });
});
