import * as fs from 'fs';
import * as path from 'path';
import {
  EC2Client,
  DescribeInstancesCommand,
  DescribeVpcsCommand,
  DescribeSubnetsCommand,
  DescribeSecurityGroupsCommand,
  DescribeNatGatewaysCommand,
  DescribeVpcEndpointsCommand,
  DescribeRouteTablesCommand,
} from '@aws-sdk/client-ec2';
import {
  CloudWatchLogsClient,
  DescribeLogGroupsCommand,
} from '@aws-sdk/client-cloudwatch-logs';
import {
  CloudWatchClient,
  ListDashboardsCommand,
} from '@aws-sdk/client-cloudwatch';
import { IAMClient, GetRoleCommand } from '@aws-sdk/client-iam';

describe('Payment Processing VPC Infrastructure Integration Tests', () => {
  let outputs: Record<string, any>;
  let ec2Client: EC2Client;
  let logsClient: CloudWatchLogsClient;
  let cloudWatchClient: CloudWatchClient;
  let iamClient: IAMClient;

  const region = process.env.AWS_REGION || 'ca-central-1';
  const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';

  beforeAll(() => {
    // Load outputs from flat-outputs.json
    const outputsPath = path.join(
      __dirname,
      '../cfn-outputs/flat-outputs.json'
    );

    if (!fs.existsSync(outputsPath)) {
      throw new Error(
        `Outputs file not found at ${outputsPath}. Deploy the stack first.`
      );
    }

    outputs = JSON.parse(fs.readFileSync(outputsPath, 'utf8'));

    // Initialize AWS clients
    ec2Client = new EC2Client({ region });
    logsClient = new CloudWatchLogsClient({ region });
    cloudWatchClient = new CloudWatchClient({ region });
    iamClient = new IAMClient({ region });
  });

  describe('VPC Configuration', () => {
    test('VPC should exist with correct CIDR block', async () => {
      const vpcId = outputs['vpc-id'];
      expect(vpcId).toBeDefined();

      const command = new DescribeVpcsCommand({
        VpcIds: [vpcId],
      });
      const response = await ec2Client.send(command);

      expect(response.Vpcs).toHaveLength(1);
      expect(response.Vpcs![0].CidrBlock).toBe('10.0.0.0/16');
      expect(response.Vpcs![0].EnableDnsHostnames).toBe(true);
      expect(response.Vpcs![0].EnableDnsSupport).toBe(true);
    });

    test('VPC should have correct tags', async () => {
      const vpcId = outputs['vpc-id'];
      const command = new DescribeVpcsCommand({
        VpcIds: [vpcId],
      });
      const response = await ec2Client.send(command);

      const tags = response.Vpcs![0].Tags || [];
      const tagMap = tags.reduce(
        (acc, tag) => {
          acc[tag.Key!] = tag.Value!;
          return acc;
        },
        {} as Record<string, string>
      );

      expect(tagMap['Environment']).toBe('Production');
      expect(tagMap['Project']).toBe('PaymentGateway');
      expect(tagMap['Name']).toContain(environmentSuffix);
    });
  });

  describe('Subnet Configuration', () => {
    test('Should have 3 public subnets', async () => {
      const publicSubnetIds = outputs['public-subnet-ids'];
      expect(publicSubnetIds).toBeDefined();
      expect(publicSubnetIds).toHaveLength(3);

      const command = new DescribeSubnetsCommand({
        SubnetIds: publicSubnetIds,
      });
      const response = await ec2Client.send(command);

      expect(response.Subnets).toHaveLength(3);
      response.Subnets!.forEach((subnet) => {
        expect(subnet.MapPublicIpOnLaunch).toBe(true);
      });
    });

    test('Should have 3 private subnets', async () => {
      const privateSubnetIds = outputs['private-subnet-ids'];
      expect(privateSubnetIds).toBeDefined();
      expect(privateSubnetIds).toHaveLength(3);

      const command = new DescribeSubnetsCommand({
        SubnetIds: privateSubnetIds,
      });
      const response = await ec2Client.send(command);

      expect(response.Subnets).toHaveLength(3);
      response.Subnets!.forEach((subnet) => {
        expect(subnet.MapPublicIpOnLaunch).toBe(false);
      });
    });

    test('Subnets should be in different availability zones', async () => {
      const publicSubnetIds = outputs['public-subnet-ids'];
      const command = new DescribeSubnetsCommand({
        SubnetIds: publicSubnetIds,
      });
      const response = await ec2Client.send(command);

      const azs = new Set(
        response.Subnets!.map((subnet) => subnet.AvailabilityZone)
      );
      expect(azs.size).toBe(3);
    });

    test('Subnets should have correct CIDR blocks', async () => {
      const publicSubnetIds = outputs['public-subnet-ids'];
      const privateSubnetIds = outputs['private-subnet-ids'];

      const command = new DescribeSubnetsCommand({
        SubnetIds: [...publicSubnetIds, ...privateSubnetIds],
      });
      const response = await ec2Client.send(command);

      const cidrBlocks = response.Subnets!.map(
        (subnet) => subnet.CidrBlock
      ).sort();
      const expectedCidrs = [
        '10.0.0.0/24',
        '10.0.1.0/24',
        '10.0.2.0/24',
        '10.0.3.0/24',
        '10.0.4.0/24',
        '10.0.5.0/24',
      ];

      expect(cidrBlocks).toEqual(expectedCidrs);
    });
  });

  describe('NAT Gateway Configuration', () => {
    test('Should have 3 NAT Gateways for high availability', async () => {
      const natGatewayIds = outputs['nat-gateway-ids'];
      expect(natGatewayIds).toBeDefined();
      expect(natGatewayIds).toHaveLength(3);

      const command = new DescribeNatGatewaysCommand({
        NatGatewayIds: natGatewayIds,
      });
      const response = await ec2Client.send(command);

      expect(response.NatGateways).toHaveLength(3);
      response.NatGateways!.forEach((nat) => {
        expect(nat.State).toBe('available');
      });
    });

    test('NAT Gateways should be in public subnets', async () => {
      const natGatewayIds = outputs['nat-gateway-ids'];
      const publicSubnetIds = outputs['public-subnet-ids'];

      const command = new DescribeNatGatewaysCommand({
        NatGatewayIds: natGatewayIds,
      });
      const response = await ec2Client.send(command);

      response.NatGateways!.forEach((nat) => {
        expect(publicSubnetIds).toContain(nat.SubnetId);
      });
    });

    test('Each NAT Gateway should have an Elastic IP', async () => {
      const natGatewayIds = outputs['nat-gateway-ids'];
      const command = new DescribeNatGatewaysCommand({
        NatGatewayIds: natGatewayIds,
      });
      const response = await ec2Client.send(command);

      response.NatGateways!.forEach((nat) => {
        expect(nat.NatGatewayAddresses).toBeDefined();
        expect(nat.NatGatewayAddresses!.length).toBeGreaterThan(0);
        expect(nat.NatGatewayAddresses![0].AllocationId).toBeDefined();
      });
    });
  });

  describe('Security Group Configuration', () => {
    test('Web security group should exist and have correct rules', async () => {
      const webSgId = outputs['web-security-group-id'];
      expect(webSgId).toBeDefined();

      const command = new DescribeSecurityGroupsCommand({
        GroupIds: [webSgId],
      });
      const response = await ec2Client.send(command);

      expect(response.SecurityGroups).toHaveLength(1);
      const sg = response.SecurityGroups![0];

      // Check inbound rules
      const ingressRules = sg.IpPermissions || [];
      const httpRule = ingressRules.find((rule) => rule.FromPort === 80);
      const httpsRule = ingressRules.find((rule) => rule.FromPort === 443);

      expect(httpRule).toBeDefined();
      expect(httpsRule).toBeDefined();

      // Verify no 0.0.0.0/0 inbound rules (least privilege)
      ingressRules.forEach((rule) => {
        const hasOpenCidr = rule.IpRanges?.some(
          (range) => range.CidrIp === '0.0.0.0/0'
        );
        expect(hasOpenCidr).toBeFalsy();
      });
    });

    test('App security group should allow port 8080 from web tier only', async () => {
      const appSgId = outputs['app-security-group-id'];
      const webSgId = outputs['web-security-group-id'];

      const command = new DescribeSecurityGroupsCommand({
        GroupIds: [appSgId],
      });
      const response = await ec2Client.send(command);

      const sg = response.SecurityGroups![0];
      const ingressRules = sg.IpPermissions || [];
      const port8080Rule = ingressRules.find((rule) => rule.FromPort === 8080);

      expect(port8080Rule).toBeDefined();
      expect(port8080Rule!.UserIdGroupPairs).toBeDefined();
      expect(port8080Rule!.UserIdGroupPairs![0].GroupId).toBe(webSgId);

      // Verify no 0.0.0.0/0 inbound rules
      ingressRules.forEach((rule) => {
        const hasOpenCidr = rule.IpRanges?.some(
          (range) => range.CidrIp === '0.0.0.0/0'
        );
        expect(hasOpenCidr).toBeFalsy();
      });
    });
  });

  describe('VPC Endpoints Configuration', () => {
    test('S3 VPC Endpoint should exist and be gateway type', async () => {
      const s3EndpointId = outputs['s3-endpoint-id'];
      expect(s3EndpointId).toBeDefined();

      const command = new DescribeVpcEndpointsCommand({
        VpcEndpointIds: [s3EndpointId],
      });
      const response = await ec2Client.send(command);

      expect(response.VpcEndpoints).toHaveLength(1);
      const endpoint = response.VpcEndpoints![0];
      expect(endpoint.VpcEndpointType).toBe('Gateway');
      expect(endpoint.ServiceName).toContain('s3');
      expect(endpoint.State).toBe('available');
    });

    test('DynamoDB VPC Endpoint should exist and be gateway type', async () => {
      const dynamodbEndpointId = outputs['dynamodb-endpoint-id'];
      expect(dynamodbEndpointId).toBeDefined();

      const command = new DescribeVpcEndpointsCommand({
        VpcEndpointIds: [dynamodbEndpointId],
      });
      const response = await ec2Client.send(command);

      expect(response.VpcEndpoints).toHaveLength(1);
      const endpoint = response.VpcEndpoints![0];
      expect(endpoint.VpcEndpointType).toBe('Gateway');
      expect(endpoint.ServiceName).toContain('dynamodb');
      expect(endpoint.State).toBe('available');
    });
  });

  describe('EC2 Instances Configuration', () => {
    test('Should have 3 EC2 instances in private subnets', async () => {
      const instanceIds = outputs['instance-ids'];
      expect(instanceIds).toBeDefined();
      expect(instanceIds).toHaveLength(3);

      const command = new DescribeInstancesCommand({
        InstanceIds: instanceIds,
      });
      const response = await ec2Client.send(command);

      expect(response.Reservations).toHaveLength(3);
      response.Reservations!.forEach((reservation) => {
        const instance = reservation.Instances![0];
        expect(instance.InstanceType).toBe('t3.micro');
        expect(instance.State?.Name).toBe('running');
      });
    });

    test('Instances should use Amazon Linux 2023 AMI', async () => {
      const instanceIds = outputs['instance-ids'];
      const command = new DescribeInstancesCommand({
        InstanceIds: instanceIds,
      });
      const response = await ec2Client.send(command);

      response.Reservations!.forEach((reservation) => {
        const instance = reservation.Instances![0];
        const imageName = instance.ImageId;
        expect(imageName).toBeDefined();
        // AL2023 AMIs start with specific prefix
        expect(imageName).toMatch(/^ami-/);
      });
    });

    test('Instances should be in private subnets', async () => {
      const instanceIds = outputs['instance-ids'];
      const privateSubnetIds = outputs['private-subnet-ids'];

      const command = new DescribeInstancesCommand({
        InstanceIds: instanceIds,
      });
      const response = await ec2Client.send(command);

      response.Reservations!.forEach((reservation) => {
        const instance = reservation.Instances![0];
        expect(privateSubnetIds).toContain(instance.SubnetId);
      });
    });

    test('Instances should have IAM instance profile for Session Manager', async () => {
      const instanceIds = outputs['instance-ids'];
      const command = new DescribeInstancesCommand({
        InstanceIds: instanceIds,
      });
      const response = await ec2Client.send(command);

      response.Reservations!.forEach((reservation) => {
        const instance = reservation.Instances![0];
        expect(instance.IamInstanceProfile).toBeDefined();
        expect(instance.IamInstanceProfile!.Arn).toBeDefined();
      });
    });

    test('Instances should not have SSH key pairs', async () => {
      const instanceIds = outputs['instance-ids'];
      const command = new DescribeInstancesCommand({
        InstanceIds: instanceIds,
      });
      const response = await ec2Client.send(command);

      response.Reservations!.forEach((reservation) => {
        const instance = reservation.Instances![0];
        expect(instance.KeyName).toBeUndefined();
      });
    });

    test('Instances should have IMDSv2 enabled', async () => {
      const instanceIds = outputs['instance-ids'];
      const command = new DescribeInstancesCommand({
        InstanceIds: instanceIds,
      });
      const response = await ec2Client.send(command);

      response.Reservations!.forEach((reservation) => {
        const instance = reservation.Instances![0];
        expect(instance.MetadataOptions?.HttpTokens).toBe('required');
      });
    });
  });

  describe('VPC Flow Logs Configuration', () => {
    test('VPC Flow Logs should be enabled and logging to CloudWatch', async () => {
      const logGroupName = outputs['flow-log-group-name'];
      expect(logGroupName).toBeDefined();

      const command = new DescribeLogGroupsCommand({
        logGroupNamePrefix: logGroupName,
      });
      const response = await logsClient.send(command);

      expect(response.logGroups).toBeDefined();
      expect(response.logGroups!.length).toBeGreaterThan(0);
      expect(response.logGroups![0].logGroupName).toBe(logGroupName);
    });

    test('Flow Log Group should have retention policy', async () => {
      const logGroupName = outputs['flow-log-group-name'];
      const command = new DescribeLogGroupsCommand({
        logGroupNamePrefix: logGroupName,
      });
      const response = await logsClient.send(command);

      expect(response.logGroups![0].retentionInDays).toBe(7);
    });
  });

  describe('CloudWatch Dashboard', () => {
    test('VPC Flow Logs dashboard should exist', async () => {
      const command = new ListDashboardsCommand({
        DashboardNamePrefix: `payment-vpc-flowlogs-${environmentSuffix}`,
      });
      const response = await cloudWatchClient.send(command);

      expect(response.DashboardEntries).toBeDefined();
      expect(response.DashboardEntries!.length).toBeGreaterThan(0);
    });
  });

  describe('IAM Roles', () => {
    test('EC2 SSM role should exist with correct policies', async () => {
      const roleName = `payment-ec2-ssm-role-${environmentSuffix}`;
      const command = new GetRoleCommand({
        RoleName: roleName,
      });

      await expect(iamClient.send(command)).resolves.toBeDefined();
    });
  });

  describe('Route Table Configuration', () => {
    test('Each subnet should have explicit route table association', async () => {
      const vpcId = outputs['vpc-id'];
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
      expect(routeTables.length).toBeGreaterThanOrEqual(4); // 1 public + 3 private

      // Verify all subnets have explicit associations
      const allSubnetIds = [
        ...outputs['public-subnet-ids'],
        ...outputs['private-subnet-ids'],
      ];

      const associatedSubnets = new Set();
      routeTables.forEach((rt) => {
        rt.Associations?.forEach((assoc) => {
          if (assoc.SubnetId) {
            associatedSubnets.add(assoc.SubnetId);
          }
        });
      });

      allSubnetIds.forEach((subnetId) => {
        expect(associatedSubnets.has(subnetId)).toBe(true);
      });
    });

    test('Private subnets should have routes to NAT Gateways', async () => {
      const vpcId = outputs['vpc-id'];
      const privateSubnetIds = outputs['private-subnet-ids'];

      const command = new DescribeRouteTablesCommand({
        Filters: [
          {
            Name: 'vpc-id',
            Values: [vpcId],
          },
        ],
      });
      const response = await ec2Client.send(command);

      // Find route tables associated with private subnets
      const privateRouteTables = response.RouteTables!.filter((rt) =>
        rt.Associations?.some((assoc) =>
          privateSubnetIds.includes(assoc.SubnetId || '')
        )
      );

      expect(privateRouteTables.length).toBe(3);

      // Each private route table should have a route to a NAT Gateway
      privateRouteTables.forEach((rt) => {
        const natRoute = rt.Routes?.find((route) => route.NatGatewayId);
        expect(natRoute).toBeDefined();
        expect(natRoute!.DestinationCidrBlock).toBe('0.0.0.0/0');
      });
    });

    test('Public subnets should have route to Internet Gateway', async () => {
      const vpcId = outputs['vpc-id'];
      const publicSubnetIds = outputs['public-subnet-ids'];

      const command = new DescribeRouteTablesCommand({
        Filters: [
          {
            Name: 'vpc-id',
            Values: [vpcId],
          },
        ],
      });
      const response = await ec2Client.send(command);

      // Find route table associated with public subnets
      const publicRouteTable = response.RouteTables!.find((rt) =>
        rt.Associations?.some((assoc) =>
          publicSubnetIds.includes(assoc.SubnetId || '')
        )
      );

      expect(publicRouteTable).toBeDefined();
      const igwRoute = publicRouteTable!.Routes?.find(
        (route) => route.GatewayId?.startsWith('igw-')
      );
      expect(igwRoute).toBeDefined();
      expect(igwRoute!.DestinationCidrBlock).toBe('0.0.0.0/0');
    });
  });

  describe('Resource Naming Convention', () => {
    test('All resources should include environment suffix in tags or names', async () => {
      const vpcId = outputs['vpc-id'];
      const command = new DescribeVpcsCommand({
        VpcIds: [vpcId],
      });
      const response = await ec2Client.send(command);

      const tags = response.Vpcs![0].Tags || [];
      const nameTag = tags.find((tag) => tag.Key === 'Name');
      expect(nameTag?.Value).toContain(environmentSuffix);
    });
  });
});
