import fs from 'fs';
import {
  EC2Client,
  DescribeVpcsCommand,
  DescribeSubnetsCommand,
  DescribeSecurityGroupsCommand,
  DescribeInternetGatewaysCommand,
  DescribeNatGatewaysCommand,
  DescribeRouteTablesCommand,
  DescribeFlowLogsCommand,
} from '@aws-sdk/client-ec2';
import {
  CloudWatchLogsClient,
  DescribeLogGroupsCommand,
} from '@aws-sdk/client-cloudwatch-logs';

// Read deployment outputs
const outputs = JSON.parse(
  fs.readFileSync('cfn-outputs/flat-outputs.json', 'utf8')
);

// Configure AWS SDK
const region = process.env.AWS_REGION || 'us-east-1';
const ec2Client = new EC2Client({ region });
const logsClient = new CloudWatchLogsClient({ region });

describe('VPC Infrastructure Integration Tests', () => {
  describe('VPC Configuration', () => {
    test('VPC exists with correct CIDR block', async () => {
      const command = new DescribeVpcsCommand({
        VpcIds: [outputs.VpcId],
      });
      const response = await ec2Client.send(command);

      expect(response.Vpcs).toBeDefined();
      expect(response.Vpcs).toHaveLength(1);
      expect(response.Vpcs![0].CidrBlock).toBe('10.0.0.0/16');
      expect(response.Vpcs![0].State).toBe('available');
    });

    test('VPC has correct tags', async () => {
      const command = new DescribeVpcsCommand({
        VpcIds: [outputs.VpcId],
      });
      const response = await ec2Client.send(command);

      const tags = response.Vpcs![0].Tags || [];
      const environmentTag = tags.find(t => t.Key === 'Environment');
      const projectTag = tags.find(t => t.Key === 'Project');

      expect(environmentTag?.Value).toBe('production');
      expect(projectTag?.Value).toBe('payment-platform');
    });

    test('VPC has DNS support and hostnames enabled', async () => {
      const command = new DescribeVpcsCommand({
        VpcIds: [outputs.VpcId],
      });
      const response = await ec2Client.send(command);

      expect(response.Vpcs![0].EnableDnsSupport).toBe(true);
      expect(response.Vpcs![0].EnableDnsHostnames).toBe(true);
    });
  });

  describe('Subnet Configuration', () => {
    test('Public subnets exist and are in correct AZs', async () => {
      const subnetIds = outputs.PublicSubnetIds.split(',');
      const command = new DescribeSubnetsCommand({
        SubnetIds: subnetIds,
      });
      const response = await ec2Client.send(command);

      expect(response.Subnets).toBeDefined();
      expect(response.Subnets!.length).toBe(3);

      const azs = new Set(response.Subnets!.map(s => s.AvailabilityZone));
      expect(azs.size).toBe(3); // Distributed across 3 AZs
    });

    test('Private subnets exist and are in correct AZs', async () => {
      const subnetIds = outputs.PrivateSubnetIds.split(',');
      const command = new DescribeSubnetsCommand({
        SubnetIds: subnetIds,
      });
      const response = await ec2Client.send(command);

      expect(response.Subnets).toBeDefined();
      expect(response.Subnets!.length).toBe(3);

      const azs = new Set(response.Subnets!.map(s => s.AvailabilityZone));
      expect(azs.size).toBe(3); // Distributed across 3 AZs
    });

    test('Database subnets exist and are in correct AZs', async () => {
      const subnetIds = outputs.DatabaseSubnetIds.split(',');
      const command = new DescribeSubnetsCommand({
        SubnetIds: subnetIds,
      });
      const response = await ec2Client.send(command);

      expect(response.Subnets).toBeDefined();
      expect(response.Subnets!.length).toBe(3);

      const azs = new Set(response.Subnets!.map(s => s.AvailabilityZone));
      expect(azs.size).toBe(3); // Distributed across 3 AZs
    });

    test('Public subnets have MapPublicIpOnLaunch enabled', async () => {
      const subnetIds = outputs.PublicSubnetIds.split(',');
      const command = new DescribeSubnetsCommand({
        SubnetIds: subnetIds,
      });
      const response = await ec2Client.send(command);

      response.Subnets!.forEach(subnet => {
        expect(subnet.MapPublicIpOnLaunch).toBe(true);
      });
    });

    test('Private and database subnets do not auto-assign public IPs', async () => {
      const privateIds = outputs.PrivateSubnetIds.split(',');
      const databaseIds = outputs.DatabaseSubnetIds.split(',');

      const command = new DescribeSubnetsCommand({
        SubnetIds: [...privateIds, ...databaseIds],
      });
      const response = await ec2Client.send(command);

      response.Subnets!.forEach(subnet => {
        expect(subnet.MapPublicIpOnLaunch).toBe(false);
      });
    });

    test('All subnets belong to the correct VPC', async () => {
      const allSubnetIds = [
        ...outputs.PublicSubnetIds.split(','),
        ...outputs.PrivateSubnetIds.split(','),
        ...outputs.DatabaseSubnetIds.split(','),
      ];

      const command = new DescribeSubnetsCommand({
        SubnetIds: allSubnetIds,
      });
      const response = await ec2Client.send(command);

      response.Subnets!.forEach(subnet => {
        expect(subnet.VpcId).toBe(outputs.VpcId);
      });
    });
  });

  describe('Internet Gateway and NAT Gateways', () => {
    test('Internet Gateway is attached to VPC', async () => {
      const command = new DescribeInternetGatewaysCommand({
        InternetGatewayIds: [outputs.InternetGatewayId],
      });
      const response = await ec2Client.send(command);

      expect(response.InternetGateways).toBeDefined();
      expect(response.InternetGateways!.length).toBe(1);

      const attachments = response.InternetGateways![0].Attachments;
      expect(attachments).toBeDefined();
      expect(attachments!.length).toBeGreaterThan(0);
      expect(attachments![0].VpcId).toBe(outputs.VpcId);
      expect(attachments![0].State).toBe('available');
    });

    test('NAT Gateways exist in public subnets (HA mode)', async () => {
      const publicSubnetIds = outputs.PublicSubnetIds.split(',');
      const command = new DescribeNatGatewaysCommand({
        Filter: [
          {
            Name: 'vpc-id',
            Values: [outputs.VpcId],
          },
          {
            Name: 'state',
            Values: ['available'],
          },
        ],
      });
      const response = await ec2Client.send(command);

      expect(response.NatGateways).toBeDefined();
      expect(response.NatGateways!.length).toBe(3); // One per AZ

      response.NatGateways!.forEach(natGateway => {
        expect(publicSubnetIds).toContain(natGateway.SubnetId!);
      });
    });

    test('NAT Gateways have Elastic IPs assigned', async () => {
      const command = new DescribeNatGatewaysCommand({
        Filter: [
          {
            Name: 'vpc-id',
            Values: [outputs.VpcId],
          },
        ],
      });
      const response = await ec2Client.send(command);

      response.NatGateways!.forEach(natGateway => {
        expect(natGateway.NatGatewayAddresses).toBeDefined();
        expect(natGateway.NatGatewayAddresses!.length).toBeGreaterThan(0);
        expect(natGateway.NatGatewayAddresses![0].AllocationId).toBeDefined();
      });
    });
  });

  describe('Route Tables and Routing', () => {
    test('Public subnets route to Internet Gateway', async () => {
      const publicSubnetIds = outputs.PublicSubnetIds.split(',');
      const command = new DescribeRouteTablesCommand({
        Filters: [
          {
            Name: 'association.subnet-id',
            Values: publicSubnetIds,
          },
        ],
      });
      const response = await ec2Client.send(command);

      expect(response.RouteTables).toBeDefined();
      expect(response.RouteTables!.length).toBeGreaterThanOrEqual(3);

      response.RouteTables!.forEach(routeTable => {
        const igwRoute = routeTable.Routes!.find(
          r => r.DestinationCidrBlock === '0.0.0.0/0'
        );
        expect(igwRoute).toBeDefined();
        expect(igwRoute!.GatewayId).toBe(outputs.InternetGatewayId);
      });
    });

    test('Private subnets route to NAT Gateway', async () => {
      const privateSubnetIds = outputs.PrivateSubnetIds.split(',');
      const command = new DescribeRouteTablesCommand({
        Filters: [
          {
            Name: 'association.subnet-id',
            Values: privateSubnetIds,
          },
        ],
      });
      const response = await ec2Client.send(command);

      expect(response.RouteTables).toBeDefined();
      expect(response.RouteTables!.length).toBeGreaterThanOrEqual(3);

      response.RouteTables!.forEach(routeTable => {
        const natRoute = routeTable.Routes!.find(
          r => r.DestinationCidrBlock === '0.0.0.0/0'
        );
        expect(natRoute).toBeDefined();
        expect(natRoute!.NatGatewayId).toBeDefined();
      });
    });

    test('Database subnets have no default route (isolated)', async () => {
      const databaseSubnetIds = outputs.DatabaseSubnetIds.split(',');
      const command = new DescribeRouteTablesCommand({
        Filters: [
          {
            Name: 'association.subnet-id',
            Values: databaseSubnetIds,
          },
        ],
      });
      const response = await ec2Client.send(command);

      expect(response.RouteTables).toBeDefined();

      response.RouteTables!.forEach(routeTable => {
        const defaultRoute = routeTable.Routes!.find(
          r => r.DestinationCidrBlock === '0.0.0.0/0'
        );
        expect(defaultRoute).toBeUndefined(); // No internet access
      });
    });
  });

  describe('Security Groups', () => {
    test('Web security group allows HTTP and HTTPS from internet', async () => {
      const command = new DescribeSecurityGroupsCommand({
        GroupIds: [outputs.WebSecurityGroupId],
      });
      const response = await ec2Client.send(command);

      expect(response.SecurityGroups).toBeDefined();
      expect(response.SecurityGroups!.length).toBe(1);

      const ingress = response.SecurityGroups![0].IpPermissions || [];
      const httpRule = ingress.find(r => r.FromPort === 80);
      const httpsRule = ingress.find(r => r.FromPort === 443);

      expect(httpRule).toBeDefined();
      expect(httpsRule).toBeDefined();
      expect(httpRule!.IpRanges?.some(r => r.CidrIp === '0.0.0.0/0')).toBe(true);
      expect(httpsRule!.IpRanges?.some(r => r.CidrIp === '0.0.0.0/0')).toBe(true);
    });

    test('App security group allows traffic from web tier on port 8080', async () => {
      const command = new DescribeSecurityGroupsCommand({
        GroupIds: [outputs.AppSecurityGroupId],
      });
      const response = await ec2Client.send(command);

      expect(response.SecurityGroups).toBeDefined();
      const ingress = response.SecurityGroups![0].IpPermissions || [];
      const port8080Rule = ingress.find(r => r.FromPort === 8080);

      expect(port8080Rule).toBeDefined();
      expect(
        port8080Rule!.UserIdGroupPairs?.some(
          pair => pair.GroupId === outputs.WebSecurityGroupId
        )
      ).toBe(true);
    });

    test('Database security group allows PostgreSQL from app tier', async () => {
      const command = new DescribeSecurityGroupsCommand({
        GroupIds: [outputs.DatabaseSecurityGroupId],
      });
      const response = await ec2Client.send(command);

      expect(response.SecurityGroups).toBeDefined();
      const ingress = response.SecurityGroups![0].IpPermissions || [];
      const postgresRule = ingress.find(r => r.FromPort === 5432);

      expect(postgresRule).toBeDefined();
      expect(
        postgresRule!.UserIdGroupPairs?.some(
          pair => pair.GroupId === outputs.AppSecurityGroupId
        )
      ).toBe(true);
    });

    test('Database security group allows MySQL from app tier', async () => {
      const command = new DescribeSecurityGroupsCommand({
        GroupIds: [outputs.DatabaseSecurityGroupId],
      });
      const response = await ec2Client.send(command);

      expect(response.SecurityGroups).toBeDefined();
      const ingress = response.SecurityGroups![0].IpPermissions || [];
      const mysqlRule = ingress.find(r => r.FromPort === 3306);

      expect(mysqlRule).toBeDefined();
      expect(
        mysqlRule!.UserIdGroupPairs?.some(
          pair => pair.GroupId === outputs.AppSecurityGroupId
        )
      ).toBe(true);
    });

    test('Security groups have correct tags', async () => {
      const command = new DescribeSecurityGroupsCommand({
        GroupIds: [
          outputs.WebSecurityGroupId,
          outputs.AppSecurityGroupId,
          outputs.DatabaseSecurityGroupId,
        ],
      });
      const response = await ec2Client.send(command);

      response.SecurityGroups!.forEach(sg => {
        const tags = sg.Tags || [];
        const environmentTag = tags.find(t => t.Key === 'Environment');
        const projectTag = tags.find(t => t.Key === 'Project');

        expect(environmentTag?.Value).toBe('production');
        expect(projectTag?.Value).toBe('payment-platform');
      });
    });
  });

  describe('VPC Flow Logs', () => {
    test('VPC Flow Logs are enabled', async () => {
      const command = new DescribeFlowLogsCommand({
        Filter: [
          {
            Name: 'resource-id',
            Values: [outputs.VpcId],
          },
        ],
      });
      const response = await ec2Client.send(command);

      expect(response.FlowLogs).toBeDefined();
      expect(response.FlowLogs!.length).toBeGreaterThan(0);

      const flowLog = response.FlowLogs![0];
      expect(flowLog.LogDestinationType).toBe('cloud-watch-logs');
      expect(flowLog.TrafficType).toBe('ALL');
      expect(flowLog.FlowLogStatus).toBe('ACTIVE');
    });

    test('CloudWatch Log Group exists for Flow Logs', async () => {
      const command = new DescribeLogGroupsCommand({
        logGroupNamePrefix: outputs.FlowLogGroupName,
      });
      const response = await logsClient.send(command);

      expect(response.logGroups).toBeDefined();
      expect(response.logGroups!.length).toBeGreaterThan(0);

      const logGroup = response.logGroups![0];
      expect(logGroup.logGroupName).toBe(outputs.FlowLogGroupName);
      expect(logGroup.retentionInDays).toBe(30);
    });
  });

  describe('High Availability Validation', () => {
    test('Resources are distributed across 3 availability zones', async () => {
      const azs = outputs.AvailabilityZones.split(',');

      expect(azs).toHaveLength(3);
      expect(azs[0]).not.toBe(azs[1]);
      expect(azs[1]).not.toBe(azs[2]);
      expect(azs[0]).not.toBe(azs[2]);
    });

    test('NAT Gateways provide redundancy across AZs', async () => {
      const command = new DescribeNatGatewaysCommand({
        Filter: [
          {
            Name: 'vpc-id',
            Values: [outputs.VpcId],
          },
          {
            Name: 'state',
            Values: ['available'],
          },
        ],
      });
      const response = await ec2Client.send(command);

      const natGatewayAZs = new Set(
        response.NatGateways!.map(ng => ng.SubnetId)
      );
      expect(natGatewayAZs.size).toBe(3); // One NAT Gateway per AZ
    });
  });
});
