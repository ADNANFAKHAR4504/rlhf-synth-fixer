// Configuration - These are coming from cfn-outputs after cdk deploy
import fs from 'fs';
import {
  EC2Client,
  DescribeVpcsCommand,
  DescribeSubnetsCommand,
  DescribeInstancesCommand,
  DescribeSecurityGroupsCommand,
  DescribeRouteTablesCommand,
  DescribeNatGatewaysCommand,
  DescribeInternetGatewaysCommand,
} from '@aws-sdk/client-ec2';
import {
  CloudWatchLogsClient,
  DescribeLogGroupsCommand,
} from '@aws-sdk/client-cloudwatch-logs';
import { SSMClient, GetParameterCommand } from '@aws-sdk/client-ssm';

const outputs = JSON.parse(
  fs.readFileSync('cfn-outputs/flat-outputs.json', 'utf8')
);

// Get environment suffix from environment variable (set by CI/CD pipeline)
const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';

// AWS Clients
const ec2Client = new EC2Client({ region: 'us-east-1' });
const logsClient = new CloudWatchLogsClient({ region: 'us-east-1' });
const ssmClient = new SSMClient({ region: 'us-east-1' });

describe('CloudFormation Infrastructure Integration Tests', () => {
  test('VPC should be created with correct CIDR block 10.0.0.0/16', async () => {
    const vpcId =
      outputs[`MyWebApp-VPCId-${environmentSuffix}`] ||
      outputs['MyWebApp-VPCId'];

    const command = new DescribeVpcsCommand({
      VpcIds: [vpcId],
    });

    const response = await ec2Client.send(command);
    const vpc = response.Vpcs?.[0];

    expect(vpc).toBeDefined();
    expect(vpc?.CidrBlock).toBe('10.0.0.0/16');
    expect(vpc?.State).toBe('available');
    expect(vpc?.Tags?.find(tag => tag.Key === 'Name')?.Value).toContain(
      'MyWebApp-VPC'
    );
  });

  test('Three subnets should be created in different availability zones with correct CIDR blocks', async () => {
    const vpcId =
      outputs[`MyWebApp-VPCId-${environmentSuffix}`] ||
      outputs['MyWebApp-VPCId'];

    const command = new DescribeSubnetsCommand({
      Filters: [
        {
          Name: 'vpc-id',
          Values: [vpcId],
        },
      ],
    });

    const response = await ec2Client.send(command);
    const subnets = response.Subnets || [];

    expect(subnets).toHaveLength(3);

    const cidrBlocks = subnets.map(subnet => subnet.CidrBlock).sort();
    expect(cidrBlocks).toEqual(['10.0.1.0/24', '10.0.2.0/24', '10.0.3.0/24']);

    // Verify different AZs
    const azs = subnets.map(subnet => subnet.AvailabilityZone);
    const uniqueAzs = [...new Set(azs)];
    expect(uniqueAzs).toHaveLength(3);

    // Check public subnet has MapPublicIpOnLaunch enabled
    const publicSubnet = subnets.find(
      subnet => subnet.CidrBlock === '10.0.1.0/24'
    );
    expect(publicSubnet?.MapPublicIpOnLaunch).toBe(true);
  });

  test('Internet Gateway should be created and attached to VPC', async () => {
    const vpcId =
      outputs[`MyWebApp-VPCId-${environmentSuffix}`] ||
      outputs['MyWebApp-VPCId'];

    const command = new DescribeInternetGatewaysCommand({
      Filters: [
        {
          Name: 'attachment.vpc-id',
          Values: [vpcId],
        },
      ],
    });

    const response = await ec2Client.send(command);
    const igws = response.InternetGateways || [];

    expect(igws).toHaveLength(1);
    expect(igws[0].Attachments?.[0].State).toBe('available');
    expect(igws[0].Tags?.find(tag => tag.Key === 'Name')?.Value).toContain(
      'MyWebApp-IGW'
    );
  });

  test('NAT Gateway should be created in public subnet with Elastic IP', async () => {
    const vpcId =
      outputs[`MyWebApp-VPCId-${environmentSuffix}`] ||
      outputs['MyWebApp-VPCId'];

    const command = new DescribeNatGatewaysCommand({
      Filter: [
        {
          Name: 'vpc-id',
          Values: [vpcId],
        },
      ],
    });

    const response = await ec2Client.send(command);
    const natGateways = response.NatGateways || [];

    expect(natGateways).toHaveLength(1);
    expect(natGateways[0].State).toBe('available');
    expect(natGateways[0].NatGatewayAddresses?.[0].AllocationId).toBeDefined();
    expect(
      natGateways[0].Tags?.find(tag => tag.Key === 'Name')?.Value
    ).toContain('MyWebApp-NATGateway');

    // Verify NAT Gateway EIP output
    const natGatewayEIP =
      outputs[`MyWebApp-NATGatewayEIP-${environmentSuffix}`] ||
      outputs['MyWebApp-NATGatewayEIP'];
    expect(natGatewayEIP).toBeDefined();
  });

  test('Route tables should be configured correctly for public and private subnets', async () => {
    const vpcId =
      outputs[`MyWebApp-VPCId-${environmentSuffix}`] ||
      outputs['MyWebApp-VPCId'];

    const command = new DescribeRouteTablesCommand({
      Filters: [
        {
          Name: 'vpc-id',
          Values: [vpcId],
        },
      ],
    });

    const response = await ec2Client.send(command);
    const routeTables = response.RouteTables || [];

    // Should have 2 custom route tables + 1 main route table
    expect(routeTables.length).toBeGreaterThanOrEqual(2);

    const publicRouteTable = routeTables.find(rt =>
      rt.Tags?.find(tag => tag.Key === 'Name' && tag.Value?.includes('Public'))
    );
    const privateRouteTable = routeTables.find(rt =>
      rt.Tags?.find(tag => tag.Key === 'Name' && tag.Value?.includes('Private'))
    );

    expect(publicRouteTable).toBeDefined();
    expect(privateRouteTable).toBeDefined();

    // Check public route has internet gateway route
    const publicInternetRoute = publicRouteTable?.Routes?.find(
      route =>
        route.DestinationCidrBlock === '0.0.0.0/0' &&
        route.GatewayId?.startsWith('igw-')
    );
    expect(publicInternetRoute).toBeDefined();

    // Check private route has NAT gateway route
    const privateNatRoute = privateRouteTable?.Routes?.find(
      route =>
        route.DestinationCidrBlock === '0.0.0.0/0' &&
        route.NatGatewayId?.startsWith('nat-')
    );
    expect(privateNatRoute).toBeDefined();
  });

  test('Three EC2 instances should be deployed with latest Amazon Linux 2 AMI', async () => {
    const vpcId =
      outputs[`MyWebApp-VPCId-${environmentSuffix}`] ||
      outputs['MyWebApp-VPCId'];

    const command = new DescribeInstancesCommand({
      Filters: [
        {
          Name: 'vpc-id',
          Values: [vpcId],
        },
        {
          Name: 'instance-state-name',
          Values: ['running', 'pending'],
        },
      ],
    });

    const response = await ec2Client.send(command);
    const instances =
      response.Reservations?.flatMap(res => res.Instances || []) || [];

    expect(instances).toHaveLength(3);

    // Verify AMI is Amazon Linux 2
    const ssmCommand = new GetParameterCommand({
      Name: '/aws/service/ami-amazon-linux-latest/amzn2-ami-hvm-x86_64-gp2',
    });
    const ssmResponse = await ssmClient.send(ssmCommand);
    const expectedAmiId = ssmResponse.Parameter?.Value;

    instances.forEach(instance => {
      expect(instance.ImageId).toBe(expectedAmiId);
      expect(instance.InstanceType).toBe('t3.micro');
    });

    // Verify naming tags
    const instanceNames = instances
      .map(instance => instance.Tags?.find(tag => tag.Key === 'Name')?.Value)
      .sort();

    expect(instanceNames).toEqual([
      'MyWebApp-EC2-Private-A',
      'MyWebApp-EC2-Private-B',
      'MyWebApp-EC2-Public',
    ]);
  });

  test('Security Group should allow SSH from specified CIDR and internal communication', async () => {
    const vpcId =
      outputs[`MyWebApp-VPCId-${environmentSuffix}`] ||
      outputs['MyWebApp-VPCId'];

    const command = new DescribeSecurityGroupsCommand({
      Filters: [
        {
          Name: 'vpc-id',
          Values: [vpcId],
        },
        {
          Name: 'group-name',
          Values: ['*'],
        },
      ],
    });

    const response = await ec2Client.send(command);
    const securityGroups = response.SecurityGroups || [];

    const appSecurityGroup = securityGroups.find(sg =>
      sg.Tags?.find(
        tag => tag.Key === 'Name' && tag.Value?.includes('MyWebApp-SG')
      )
    );

    expect(appSecurityGroup).toBeDefined();
    expect(appSecurityGroup?.GroupName).toContain('MyWebApp');

    const ingressRules = appSecurityGroup?.IpPermissions || [];

    // Check SSH rule
    const sshRule = ingressRules.find(
      rule =>
        rule.FromPort === 22 && rule.ToPort === 22 && rule.IpProtocol === 'tcp'
    );
    expect(sshRule).toBeDefined();
    expect(sshRule?.IpRanges?.[0].CidrIp).toBe('203.0.113.0/24');

    // Check self-referencing rule for internal communication
    const selfRule = ingressRules.find(
      rule => rule.UserIdGroupPairs?.[0].GroupId === appSecurityGroup?.GroupId
    );
    expect(selfRule).toBeDefined();
    expect(selfRule?.IpProtocol).toBe('-1');
  });

  test('VPC Flow Logs should be enabled and configured correctly', async () => {
    const vpcId =
      outputs[`MyWebApp-VPCId-${environmentSuffix}`] ||
      outputs['MyWebApp-VPCId'];

    // Check CloudWatch Log Group exists
    const logGroupName = `/aws/vpcflowlogs/${vpcId}/FlowLogs`;

    const command = new DescribeLogGroupsCommand({
      logGroupNamePrefix: logGroupName,
    });

    const response = await logsClient.send(command);
    const logGroups = response.logGroups || [];

    expect(logGroups).toHaveLength(1);
    expect(logGroups[0].logGroupName).toBe(logGroupName);
    expect(logGroups[0].retentionInDays).toBe(7);
  });

  test('All resources should have proper naming tags with ProjectName prefix', async () => {
    const vpcId =
      outputs[`MyWebApp-VPCId-${environmentSuffix}`] ||
      outputs['MyWebApp-VPCId'];

    // Test VPC tags
    const vpcCommand = new DescribeVpcsCommand({ VpcIds: [vpcId] });
    const vpcResponse = await ec2Client.send(vpcCommand);
    const vpcNameTag = vpcResponse.Vpcs?.[0].Tags?.find(
      tag => tag.Key === 'Name'
    );
    expect(vpcNameTag?.Value).toBe('MyWebApp-VPC');

    // Test Subnet tags
    const subnetCommand = new DescribeSubnetsCommand({
      Filters: [{ Name: 'vpc-id', Values: [vpcId] }],
    });
    const subnetResponse = await ec2Client.send(subnetCommand);
    const subnets = subnetResponse.Subnets || [];

    subnets.forEach(subnet => {
      const nameTag = subnet.Tags?.find(tag => tag.Key === 'Name');
      expect(nameTag?.Value).toMatch(/^MyWebApp-/);
    });

    // Test Instance tags
    const instanceCommand = new DescribeInstancesCommand({
      Filters: [{ Name: 'vpc-id', Values: [vpcId] }],
    });
    const instanceResponse = await ec2Client.send(instanceCommand);
    const instances =
      instanceResponse.Reservations?.flatMap(res => res.Instances || []) || [];

    instances.forEach(instance => {
      const nameTag = instance.Tags?.find(tag => tag.Key === 'Name');
      expect(nameTag?.Value).toMatch(/^MyWebApp-/);
    });
  });

  test('Stack outputs should export correct resource identifiers', async () => {
    // Test VPC ID output
    const vpcId =
      outputs[`MyWebApp-VPCId-${environmentSuffix}`] ||
      outputs['MyWebApp-VPCId'];
    expect(vpcId).toBeDefined();
    expect(vpcId).toMatch(/^vpc-/);

    // Test Public Instance ID output
    const publicInstanceId =
      outputs[`MyWebApp-PublicInstanceId-${environmentSuffix}`] ||
      outputs['MyWebApp-PublicInstanceId'];
    expect(publicInstanceId).toBeDefined();
    expect(publicInstanceId).toMatch(/^i-/);

    // Test NAT Gateway EIP output
    const natGatewayEIP =
      outputs[`MyWebApp-NATGatewayEIP-${environmentSuffix}`] ||
      outputs['MyWebApp-NATGatewayEIP'];
    expect(natGatewayEIP).toBeDefined();
    expect(natGatewayEIP).toMatch(/^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/);

    // Verify the public instance is actually in the public subnet
    const instanceCommand = new DescribeInstancesCommand({
      InstanceIds: [publicInstanceId],
    });
    const instanceResponse = await ec2Client.send(instanceCommand);
    const publicInstance = instanceResponse.Reservations?.[0].Instances?.[0];

    expect(publicInstance?.PublicIpAddress).toBeDefined();
    expect(publicInstance?.PrivateIpAddress).toMatch(/^10\.0\.1\./);
  });
});
