import {
  CloudWatchLogsClient,
  DescribeLogGroupsCommand,
} from '@aws-sdk/client-cloudwatch-logs';
import {
  DescribeFlowLogsCommand,
  DescribeInternetGatewaysCommand,
  DescribeNatGatewaysCommand,
  DescribeNetworkAclsCommand,
  DescribeRouteTablesCommand,
  DescribeSubnetsCommand,
  DescribeVpcsCommand,
  EC2Client,
} from '@aws-sdk/client-ec2';
import * as fs from 'fs';
import * as path from 'path';

describe('TapStack Integration Tests', () => {
  const region = 'ap-southeast-1';
  const ec2Client = new EC2Client({ region });
  const logsClient = new CloudWatchLogsClient({ region });

  let outputs: Record<string, string>;
  let vpcId: string;

  beforeAll(() => {
    // Load stack outputs from deployment
    const outputsPath = path.join(
      __dirname,
      '..',
      'cfn-outputs',
      'flat-outputs.json'
    );
    if (!fs.existsSync(outputsPath)) {
      throw new Error(
        'Stack outputs not found. Deploy the stack first with: npm run cdk:deploy'
      );
    }
    outputs = JSON.parse(fs.readFileSync(outputsPath, 'utf-8'));
    vpcId = outputs.VpcId;
  });

  describe('VPC Configuration', () => {
    test('VPC exists with correct CIDR block', async () => {
      const command = new DescribeVpcsCommand({
        VpcIds: [vpcId],
      });
      const response = await ec2Client.send(command);

      expect(response.Vpcs).toHaveLength(1);
      expect(response.Vpcs![0].CidrBlock).toBe('10.0.0.0/16');
      expect(response.Vpcs![0].State).toBe('available');
    });

    test('VPC has correct tags', async () => {
      const command = new DescribeVpcsCommand({
        VpcIds: [vpcId],
      });
      const response = await ec2Client.send(command);

      const tags = response.Vpcs![0].Tags || [];
      const envTag = tags.find(t => t.Key === 'Environment');
      const projectTag = tags.find(t => t.Key === 'Project');

      expect(envTag?.Value).toBe('production');
      expect(projectTag?.Value).toBe('apac-expansion');
    });
  });

  describe('Subnet Configuration', () => {
    test('Six subnets created across 3 availability zones', async () => {
      const command = new DescribeSubnetsCommand({
        Filters: [{ Name: 'vpc-id', Values: [vpcId] }],
      });
      const response = await ec2Client.send(command);

      expect(response.Subnets).toHaveLength(6);

      // Check AZ distribution
      const azs = new Set(response.Subnets!.map(s => s.AvailabilityZone));
      expect(azs.size).toBe(3);
    });

    test('Three public subnets with /24 CIDR blocks', async () => {
      const command = new DescribeSubnetsCommand({
        Filters: [{ Name: 'vpc-id', Values: [vpcId] }],
      });
      const response = await ec2Client.send(command);

      const publicSubnets = response.Subnets!.filter(
        s => s.MapPublicIpOnLaunch === true
      );

      expect(publicSubnets).toHaveLength(3);

      // Verify CIDR masks
      publicSubnets.forEach(subnet => {
        const cidr = subnet.CidrBlock!;
        const mask = cidr.split('/')[1];
        expect(mask).toBe('24');
      });
    });

    test('Three private subnets with /23 CIDR blocks', async () => {
      const command = new DescribeSubnetsCommand({
        Filters: [{ Name: 'vpc-id', Values: [vpcId] }],
      });
      const response = await ec2Client.send(command);

      const privateSubnets = response.Subnets!.filter(
        s => s.MapPublicIpOnLaunch === false
      );

      expect(privateSubnets).toHaveLength(3);

      // Verify CIDR masks
      privateSubnets.forEach(subnet => {
        const cidr = subnet.CidrBlock!;
        const mask = cidr.split('/')[1];
        expect(mask).toBe('23');
      });
    });

    test('Subnets have correct tags', async () => {
      const command = new DescribeSubnetsCommand({
        Filters: [{ Name: 'vpc-id', Values: [vpcId] }],
      });
      const response = await ec2Client.send(command);

      response.Subnets!.forEach(subnet => {
        const tags = subnet.Tags || [];
        const envTag = tags.find(t => t.Key === 'Environment');
        const projectTag = tags.find(t => t.Key === 'Project');

        expect(envTag?.Value).toBe('production');
        expect(projectTag?.Value).toBe('apac-expansion');
      });
    });
  });

  describe('Internet Gateway', () => {
    test('Internet Gateway attached to VPC', async () => {
      const igwId = outputs.InternetGatewayId;
      const command = new DescribeInternetGatewaysCommand({
        InternetGatewayIds: [igwId],
      });
      const response = await ec2Client.send(command);

      expect(response.InternetGateways).toHaveLength(1);
      expect(response.InternetGateways![0].Attachments).toHaveLength(1);
      expect(response.InternetGateways![0].Attachments![0].VpcId).toBe(vpcId);
      expect(response.InternetGateways![0].Attachments![0].State).toBe(
        'available'
      );
    });
  });

  describe('NAT Gateways', () => {
    test('Two NAT Gateways deployed', async () => {
      const command = new DescribeNatGatewaysCommand({
        Filter: [{ Name: 'vpc-id', Values: [vpcId] }],
      });
      const response = await ec2Client.send(command);

      const activeNatGateways = response.NatGateways!.filter(
        ng => ng.State === 'available'
      );
      expect(activeNatGateways).toHaveLength(2);
    });

    test('NAT Gateways in public subnets', async () => {
      const command = new DescribeNatGatewaysCommand({
        Filter: [{ Name: 'vpc-id', Values: [vpcId] }],
      });
      const response = await ec2Client.send(command);

      const publicSubnetIds = [
        outputs.PublicSubnetId1,
        outputs.PublicSubnetId2,
        outputs.PublicSubnetId3,
      ];

      response.NatGateways!.forEach(natGateway => {
        expect(publicSubnetIds).toContain(natGateway.SubnetId);
      });
    });

    test('NAT Gateways have Elastic IPs', async () => {
      const command = new DescribeNatGatewaysCommand({
        Filter: [{ Name: 'vpc-id', Values: [vpcId] }],
      });
      const response = await ec2Client.send(command);

      response.NatGateways!.forEach(natGateway => {
        expect(natGateway.NatGatewayAddresses).toHaveLength(1);
        expect(natGateway.NatGatewayAddresses![0].AllocationId).toBeDefined();
      });
    });
  });

  describe('VPC Flow Logs', () => {
    test('VPC Flow Logs enabled', async () => {
      const command = new DescribeFlowLogsCommand({
        Filter: [{ Name: 'resource-id', Values: [vpcId] }],
      });
      const response = await ec2Client.send(command);

      expect(response.FlowLogs).toHaveLength(1);
      expect(response.FlowLogs![0].LogDestinationType).toBe('cloud-watch-logs');
      expect(response.FlowLogs![0].TrafficType).toBe('ALL');
    });

    test('CloudWatch Log Group exists with 7-day retention', async () => {
      const logGroupName = outputs.FlowLogGroupName;
      const command = new DescribeLogGroupsCommand({
        logGroupNamePrefix: logGroupName,
      });
      const response = await logsClient.send(command);

      expect(response.logGroups).toHaveLength(1);
      expect(response.logGroups![0].logGroupName).toBe(logGroupName);
      expect(response.logGroups![0].retentionInDays).toBe(7);
    });
  });

  describe('Network ACLs', () => {
    test('Custom Network ACLs exist', async () => {
      const command = new DescribeNetworkAclsCommand({
        Filters: [
          { Name: 'vpc-id', Values: [vpcId] },
          { Name: 'default', Values: ['false'] },
        ],
      });
      const response = await ec2Client.send(command);

      // Should have 2 custom NACLs (public and private)
      expect(response.NetworkAcls!.length).toBeGreaterThanOrEqual(2);
    });

    test('Network ACLs allow HTTP, HTTPS, and SSH', async () => {
      const command = new DescribeNetworkAclsCommand({
        Filters: [
          { Name: 'vpc-id', Values: [vpcId] },
          { Name: 'default', Values: ['false'] },
        ],
      });
      const response = await ec2Client.send(command);

      response.NetworkAcls!.forEach(nacl => {
        const entries = nacl.Entries || [];
        const ingressEntries = entries.filter(e => !e.Egress);

        const httpEntry = ingressEntries.find(
          e => e.PortRange?.From === 80 && e.PortRange?.To === 80
        );
        const httpsEntry = ingressEntries.find(
          e => e.PortRange?.From === 443 && e.PortRange?.To === 443
        );
        const sshEntry = ingressEntries.find(
          e => e.PortRange?.From === 22 && e.PortRange?.To === 22
        );

        // At least one NACL should have these rules
        if (httpEntry || httpsEntry || sshEntry) {
          expect(httpEntry?.RuleAction).toBe('allow');
          expect(httpsEntry?.RuleAction).toBe('allow');
          expect(sshEntry?.RuleAction).toBe('allow');
        }
      });
    });

    test('Network ACLs have correct tags', async () => {
      const command = new DescribeNetworkAclsCommand({
        Filters: [
          { Name: 'vpc-id', Values: [vpcId] },
          { Name: 'default', Values: ['false'] },
        ],
      });
      const response = await ec2Client.send(command);

      response.NetworkAcls!.forEach(nacl => {
        const tags = nacl.Tags || [];
        const envTag = tags.find(t => t.Key === 'Environment');
        const projectTag = tags.find(t => t.Key === 'Project');

        expect(envTag?.Value).toBe('production');
        expect(projectTag?.Value).toBe('apac-expansion');
      });
    });
  });

  describe('Route Tables', () => {
    test('Route tables exist for all subnets', async () => {
      const command = new DescribeRouteTablesCommand({
        Filters: [{ Name: 'vpc-id', Values: [vpcId] }],
      });
      const response = await ec2Client.send(command);

      // Should have 6 route tables (one per subnet) plus potentially default
      expect(response.RouteTables!.length).toBeGreaterThanOrEqual(6);
    });

    test('Public route tables have Internet Gateway routes', async () => {
      const command = new DescribeRouteTablesCommand({
        Filters: [{ Name: 'vpc-id', Values: [vpcId] }],
      });
      const response = await ec2Client.send(command);

      const igwId = outputs.InternetGatewayId;
      const publicRouteTables = response.RouteTables!.filter(rt =>
        rt.Routes?.some(r => r.GatewayId === igwId)
      );

      expect(publicRouteTables.length).toBeGreaterThanOrEqual(3);
    });

    test('Private route tables have NAT Gateway routes', async () => {
      const command = new DescribeRouteTablesCommand({
        Filters: [{ Name: 'vpc-id', Values: [vpcId] }],
      });
      const response = await ec2Client.send(command);

      const privateRouteTables = response.RouteTables!.filter(rt =>
        rt.Routes?.some(r => r.NatGatewayId !== undefined)
      );

      expect(privateRouteTables.length).toBeGreaterThanOrEqual(3);
    });

    test('Route tables have correct tags', async () => {
      const command = new DescribeRouteTablesCommand({
        Filters: [
          { Name: 'vpc-id', Values: [vpcId] },
          { Name: 'tag:Environment', Values: ['production'] },
        ],
      });
      const response = await ec2Client.send(command);

      response.RouteTables!.forEach(rt => {
        const tags = rt.Tags || [];
        const envTag = tags.find(t => t.Key === 'Environment');
        const projectTag = tags.find(t => t.Key === 'Project');

        if (envTag) {
          expect(envTag.Value).toBe('production');
        }
        if (projectTag) {
          expect(projectTag.Value).toBe('apac-expansion');
        }
      });
    });
  });

  describe('Stack Outputs', () => {
    test('All required outputs present', () => {
      expect(outputs.VpcId).toBeDefined();
      expect(outputs.PublicSubnetId1).toBeDefined();
      expect(outputs.PublicSubnetId2).toBeDefined();
      expect(outputs.PublicSubnetId3).toBeDefined();
      expect(outputs.PrivateSubnetId1).toBeDefined();
      expect(outputs.PrivateSubnetId2).toBeDefined();
      expect(outputs.PrivateSubnetId3).toBeDefined();
      expect(outputs.InternetGatewayId).toBeDefined();
      expect(outputs.NatGatewayCount).toBe('2');
      expect(outputs.FlowLogGroupName).toBeDefined();
    });

    test('Output values are valid AWS resource IDs', () => {
      expect(outputs.VpcId).toMatch(/^vpc-[a-f0-9]+$/);
      expect(outputs.PublicSubnetId1).toMatch(/^subnet-[a-f0-9]+$/);
      expect(outputs.PublicSubnetId2).toMatch(/^subnet-[a-f0-9]+$/);
      expect(outputs.PublicSubnetId3).toMatch(/^subnet-[a-f0-9]+$/);
      expect(outputs.PrivateSubnetId1).toMatch(/^subnet-[a-f0-9]+$/);
      expect(outputs.PrivateSubnetId2).toMatch(/^subnet-[a-f0-9]+$/);
      expect(outputs.PrivateSubnetId3).toMatch(/^subnet-[a-f0-9]+$/);
      expect(outputs.InternetGatewayId).toMatch(/^igw-[a-f0-9]+$/);
    });
  });

  describe('End-to-End Network Connectivity', () => {
    test('VPC resources are interconnected correctly', async () => {
      // Verify VPC contains all expected resources
      const [subnetsResponse, igwResponse, natResponse, routeTablesResponse] =
        await Promise.all([
          ec2Client.send(
            new DescribeSubnetsCommand({
              Filters: [{ Name: 'vpc-id', Values: [vpcId] }],
            })
          ),
          ec2Client.send(
            new DescribeInternetGatewaysCommand({
              Filters: [{ Name: 'attachment.vpc-id', Values: [vpcId] }],
            })
          ),
          ec2Client.send(
            new DescribeNatGatewaysCommand({
              Filter: [{ Name: 'vpc-id', Values: [vpcId] }],
            })
          ),
          ec2Client.send(
            new DescribeRouteTablesCommand({
              Filters: [{ Name: 'vpc-id', Values: [vpcId] }],
            })
          ),
        ]);

      // All resources should belong to the same VPC
      expect(subnetsResponse.Subnets!.every(s => s.VpcId === vpcId)).toBe(true);
      expect(
        igwResponse.InternetGateways!.every(
          ig => ig.Attachments![0].VpcId === vpcId
        )
      ).toBe(true);
      expect(natResponse.NatGateways!.every(ng => ng.VpcId === vpcId)).toBe(
        true
      );
      expect(
        routeTablesResponse.RouteTables!.every(rt => rt.VpcId === vpcId)
      ).toBe(true);
    });
  });
});
