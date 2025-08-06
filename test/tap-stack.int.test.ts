import {
  EC2Client,
  DescribeVpcsCommand,
  DescribeSubnetsCommand,
  DescribeInstancesCommand,
  DescribeInternetGatewaysCommand,
  DescribeRouteTablesCommand,
  DescribeSecurityGroupsCommand,
  DescribeAddressesCommand,
} from '@aws-sdk/client-ec2';
import * as fs from 'fs';
import * as path from 'path';

const awsRegion = process.env.AWS_REGION || process.env.AWS_DEFAULT_REGION || 'us-east-1';
const ec2Client = new EC2Client({ region: awsRegion });

describe('TapStack EC2 and VPC Infrastructure Integration Tests', () => {
  let outputs: Record<string, string[] | string>;

  beforeAll(() => {
    const suffix = process.env.ENVIRONMENT_SUFFIX;
    if (!suffix) throw new Error('ENVIRONMENT_SUFFIX is not set');

    const outputFilePath = path.join(__dirname, '..', 'cfn-outputs', 'flat-outputs.json');
    if (!fs.existsSync(outputFilePath)) throw new Error(`Output file not found at ${outputFilePath}`);

    const allOutputs = JSON.parse(fs.readFileSync(outputFilePath, 'utf-8'));
    const stackKey = Object.keys(allOutputs).find(k => k.includes(suffix));
    if (!stackKey) throw new Error(`No output found for suffix: ${suffix}`);

    outputs = allOutputs[stackKey];
  });

  test('should have created VPC with valid CIDR block', async () => {
    const vpcId = outputs['VpcId'] as string;
    const { Vpcs } = await ec2Client.send(new DescribeVpcsCommand({ VpcIds: [vpcId] }));

    expect(Vpcs?.[0].VpcId).toBe(vpcId);
    expect(Vpcs?.[0].CidrBlock).toBe('10.0.0.0/16');
  }, 20000);

  test('should have two public subnets in correct AZs', async () => {
    const subnetIds = outputs['SubnetIds'] as string[];
    const { Subnets } = await ec2Client.send(new DescribeSubnetsCommand({ SubnetIds: subnetIds }));

    expect(Subnets).toHaveLength(2);
    Subnets?.forEach((subnet, i) => {
      expect(subnet.AvailabilityZone).toMatch(/^us-east-1[a-z]$/);
      expect(subnet.CidrBlock).toBe(`10.0.${i}.0/24`);
    });
  }, 20000);

  test('should have Internet Gateway attached to VPC', async () => {
    const igwId = outputs['InternetGatewayId'] as string;
    const { InternetGateways } = await ec2Client.send(new DescribeInternetGatewaysCommand({ InternetGatewayIds: [igwId] }));

    const igw = InternetGateways?.[0];
    expect(igw?.InternetGatewayId).toBe(igwId);
    expect(igw?.Attachments?.[0].State).toBe('available');
  }, 20000);

  test('should have route table with 0.0.0.0/0 route through IGW', async () => {
    const rtId = outputs['RouteTableId'] as string;
    const { RouteTables } = await ec2Client.send(new DescribeRouteTablesCommand({ RouteTableIds: [rtId] }));

    const route = RouteTables?.[0].Routes?.find(r => r.DestinationCidrBlock === '0.0.0.0/0');
    expect(route).toBeDefined();
    expect(route?.GatewayId).toBe(outputs['InternetGatewayId']);
  }, 20000);

  test('should have security group allowing SSH and HTTP from trusted CIDR', async () => {
    const sgId = outputs['SecurityGroupId'] as string;
    const { SecurityGroups } = await ec2Client.send(new DescribeSecurityGroupsCommand({ GroupIds: [sgId] }));

    const sg = SecurityGroups?.[0];
    expect(sg?.GroupId).toBe(sgId);
    const sshRule = sg?.IpPermissions?.find(r => r.FromPort === 22 && r.ToPort === 22);
    const httpRule = sg?.IpPermissions?.find(r => r.FromPort === 80 && r.ToPort === 80);

    expect(sshRule?.IpRanges?.[0].CidrIp).toBe('203.0.113.0/24');
    expect(httpRule?.IpRanges?.[0].CidrIp).toBe('203.0.113.0/24');
  }, 20000);

  test('should have launched EC2 instances with public IPs and associated Elastic IPs', async () => {
    const instanceIds = outputs['InstanceIds'] as string[];
    const allocationIds = outputs['ElasticIpAllocationIds'] as string[];

    const { Reservations } = await ec2Client.send(new DescribeInstancesCommand({
      InstanceIds: instanceIds,
    }));

    const instances = Reservations?.flatMap(r => r.Instances ?? []) ?? [];

    expect(instances).toHaveLength(instanceIds.length);

    const { Addresses } = await ec2Client.send(new DescribeAddressesCommand({
      AllocationIds: allocationIds,
    }));

    expect(Addresses).toHaveLength(allocationIds.length);
    Addresses?.forEach((addr) => {
      expect(addr.InstanceId).toBeDefined();
    });
  }, 20000);
});
