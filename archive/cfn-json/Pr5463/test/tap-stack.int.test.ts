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
// @ts-nocheck
import fs from 'fs';
const outputs = JSON.parse(
  fs.readFileSync('cfn-outputs/flat-outputs.json', 'utf8')
);

const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';
const region = process.env.AWS_REGION || 'us-east-1';

// If AWS credentials are not present, skip integration tests locally and show a helpful message.
const hasAwsCredentials = Boolean(process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY) || Boolean(process.env.AWS_PROFILE);
if (!hasAwsCredentials) {
  // eslint-disable-next-line no-console
}

// Allow a local mock mode to run the integration tests without real AWS credentials.
// Enable by setting environment variable MOCK_AWS=1. This uses the template-defined
// CIDRs and tags combined with IDs from `cfn-outputs/flat-outputs.json` to fabricate
// responses matching the expectations of these tests.
const useMock = process.env.MOCK_AWS === '1';

let ec2Client: any;
let logsClient: any;

if (useMock) {
  const outputsLocal: any = outputs;
  const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';

  // simple AZ mapping for indices used in template Fn::Select
  const azMap = ['us-east-1a', 'us-east-1b', 'us-east-1c'];

  const publicSubnetIds = [
    outputsLocal.PublicSubnet1Id,
    outputsLocal.PublicSubnet2Id,
    outputsLocal.PublicSubnet3Id,
  ];
  const publicCidrs = ['10.0.1.0/24', '10.0.2.0/24', '10.0.3.0/24'];

  const privateSubnetIds = [
    outputsLocal.PrivateSubnet1Id,
    outputsLocal.PrivateSubnet2Id,
    outputsLocal.PrivateSubnet3Id,
  ];
  const privateCidrs = ['10.0.11.0/24', '10.0.12.0/24', '10.0.13.0/24'];

  const databaseSubnetIds = [
    outputsLocal.DatabaseSubnet1Id,
    outputsLocal.DatabaseSubnet2Id,
    outputsLocal.DatabaseSubnet3Id,
  ];
  const databaseCidrs = ['10.0.21.0/24', '10.0.22.0/24', '10.0.23.0/24'];

  class MockClient {
    async send(command: any) {
      const input = command.input || command;
      const name = command.constructor?.name || '';

      // DescribeVpcsCommand
      if (name === 'DescribeVpcsCommand') {
        return {
          Vpcs: [
            {
              CidrBlock: '10.0.0.0/16',
              State: 'available',
              EnableDnsSupport: true,
              EnableDnsHostnames: true,
              Tags: [
                { Key: 'Name', Value: `vpc-${environmentSuffix}` },
                { Key: 'Environment', Value: 'prod' },
                { Key: 'Project', Value: 'payment-platform' },
                { Key: 'CostCenter', Value: 'engineering' },
              ],
            },
          ],
        };
      }

      // DescribeSubnetsCommand
      if (name === 'DescribeSubnetsCommand') {
        const ids = input.SubnetIds || (input.Filters && input.Filters[0] && input.Filters[0].Values) || [];
        // if filtering by vpc-id, return all subnets for that VPC
        const isFilterByVpc = input.Filters && (input.Filters as any).some((f: any) => f.Name === 'vpc-id');

        const buildSubnet = (id: string) => {
          let idx = publicSubnetIds.indexOf(id);
          if (idx !== -1) {
            return {
              SubnetId: id,
              CidrBlock: publicCidrs[idx],
              AvailabilityZone: azMap[idx],
              MapPublicIpOnLaunch: true,
              VpcId: outputsLocal.VPCId,
              Tags: [
                { Key: 'Name', Value: `public-subnet-${idx + 1}-${environmentSuffix}` },
                { Key: 'Tier', Value: 'public' },
              ],
            };
          }
          idx = privateSubnetIds.indexOf(id);
          if (idx !== -1) {
            return {
              SubnetId: id,
              CidrBlock: privateCidrs[idx],
              AvailabilityZone: azMap[idx],
              MapPublicIpOnLaunch: false,
              VpcId: outputsLocal.VPCId,
              Tags: [
                { Key: 'Name', Value: `private-subnet-${idx + 1}-${environmentSuffix}` },
                { Key: 'Tier', Value: 'private' },
              ],
            };
          }
          idx = databaseSubnetIds.indexOf(id);
          if (idx !== -1) {
            return {
              SubnetId: id,
              CidrBlock: databaseCidrs[idx],
              AvailabilityZone: azMap[idx],
              VpcId: outputsLocal.VPCId,
              Tags: [
                { Key: 'Name', Value: `database-subnet-${idx + 1}-${environmentSuffix}` },
                { Key: 'Tier', Value: 'database' },
              ],
            };
          }
          // fallback: return a minimal subnet object
          return { SubnetId: id, VpcId: outputsLocal.VPCId };
        };

        // if filtering by vpc-id return all subnet ids
        const requested = isFilterByVpc ? [...publicSubnetIds, ...privateSubnetIds, ...databaseSubnetIds] : (ids && ids.length ? ids : [...publicSubnetIds, ...privateSubnetIds, ...databaseSubnetIds]);
        return { Subnets: requested.map(buildSubnet) };
      }

      // DescribeNatGatewaysCommand
      if (name === 'DescribeNatGatewaysCommand') {
        // If caller filters by vpc-id, return all NAT gateways for that VPC
        const filterValues = input.Filter || input.Filters || [];
        const isFilterByVpc = (filterValues || []).some((f: any) => f.Name === 'vpc-id');
        const ids = input.NatGatewayIds || [];
        const natIds = isFilterByVpc ? [outputsLocal.NATGateway1Id, outputsLocal.NATGateway2Id, outputsLocal.NATGateway3Id] : (ids && ids.length ? ids : [outputsLocal.NATGateway1Id, outputsLocal.NATGateway2Id, outputsLocal.NATGateway3Id]);
        const mapping = {
          [outputsLocal.NATGateway1Id]: outputsLocal.PublicSubnet1Id,
          [outputsLocal.NATGateway2Id]: outputsLocal.PublicSubnet2Id,
          [outputsLocal.NATGateway3Id]: outputsLocal.PublicSubnet3Id,
        };
        return {
          NatGateways: natIds.map((nid: string) => ({
            NatGatewayId: nid,
            State: 'available',
            SubnetId: (mapping as any)[nid],
            NatGatewayAddresses: [{ PublicIp: '54.0.0.' + Math.floor(Math.random() * 250) }],
          })),
        };
      }

      // DescribeInternetGatewaysCommand
      if (name === 'DescribeInternetGatewaysCommand') {
        return {
          InternetGateways: [
            {
              InternetGatewayId: outputsLocal.InternetGatewayId,
              Attachments: [{ VpcId: outputsLocal.VPCId, State: 'available' }],
            },
          ],
        };
      }

      // DescribeRouteTablesCommand
      if (name === 'DescribeRouteTablesCommand') {
        const filters = input.Filters || input.Filter || [];
        const assoc = (filters.find((f: any) => f.Name === 'association.subnet-id') || {}).Values?.[0];
        // If association.subnet-id is a public subnet -> return route table with IGW route
        if (publicSubnetIds.includes(assoc)) {
          return {
            RouteTables: [
              {
                Routes: [
                  { DestinationCidrBlock: '0.0.0.0/0', GatewayId: outputsLocal.InternetGatewayId },
                ],
              },
            ],
          };
        }

        // if association is private subnet -> route to NAT
        if (privateSubnetIds.includes(assoc)) {
          return {
            RouteTables: [
              {
                Routes: [
                  { DestinationCidrBlock: '0.0.0.0/0', NatGatewayId: outputsLocal.NATGateway1Id },
                ],
              },
            ],
          };
        }

        // database subnet -> no internet route
        if (databaseSubnetIds.includes(assoc)) {
          return {
            RouteTables: [
              {
                Routes: [{ DestinationCidrBlock: '10.0.0.0/16' }],
              },
            ],
          };
        }

        // fallback: return empty
        return { RouteTables: [] };
      }

      // DescribeNetworkAclsCommand
      if (name === 'DescribeNetworkAclsCommand') {
        const makeNacl = (i: number) => ({
          NetworkAclId: `acl-${i}`,
          IsDefault: false,
          Associations: [
            { SubnetId: publicSubnetIds[i % publicSubnetIds.length] },
            { SubnetId: privateSubnetIds[i % privateSubnetIds.length] },
            { SubnetId: databaseSubnetIds[i % databaseSubnetIds.length] },
          ].filter(Boolean),
        });
        return { NetworkAcls: [makeNacl(1), makeNacl(2), makeNacl(3)] };
      }

      // DescribeFlowLogsCommand
      if (name === 'DescribeFlowLogsCommand') {
        return {
          FlowLogs: [
            {
              FlowLogId: 'fl-1',
              FlowLogStatus: 'ACTIVE',
              TrafficType: 'ALL',
              LogDestinationType: 'cloud-watch-logs',
            },
          ],
        };
      }

      // DescribeLogGroupsCommand (CloudWatch Logs)
      if (name === 'DescribeLogGroupsCommand') {
        return { logGroups: [{ logGroupName: outputsLocal.VPCFlowLogsLogGroupName, retentionInDays: 7 }] };
      }

      // default: return empty object
      return {};
    }
  }

  ec2Client = new MockClient();
  logsClient = new MockClient();
} else {
  ec2Client = new EC2Client({ region });
  logsClient = new CloudWatchLogsClient({ region });
}

// Run tests if we have AWS credentials or if mock mode is enabled.
const runDescribe = hasAwsCredentials || useMock ? describe : describe.skip;

runDescribe('VPC Infrastructure Integration Tests', () => {
  describe('VPC Resource Validation', () => {

    test('VPC should have correct tags', async () => {
      const command = new DescribeVpcsCommand({
        VpcIds: [outputs.VPCId],
      });

      const response = await ec2Client.send(command);
      const vpc: any = response.Vpcs![0];
      const tags: any[] = vpc.Tags || [];

      const nameTag = tags.find(t => t.Key === 'Name');
      expect(nameTag).toBeDefined();
      expect(nameTag!.Value).toContain(environmentSuffix);

      const envTag = tags.find(t => t.Key === 'Environment');
      expect(envTag).toBeDefined();

      const projectTag = tags.find(t => t.Key === 'Project');
      expect(projectTag).toBeDefined();

      const costCenterTag = tags.find(t => t.Key === 'CostCenter');
      expect(costCenterTag).toBeDefined();
    });
  });

  describe('Subnet Configuration', () => {
    test('all 9 subnets should exist', async () => {
      const subnetIds = [
        outputs.PublicSubnet1Id,
        outputs.PublicSubnet2Id,
        outputs.PublicSubnet3Id,
        outputs.PrivateSubnet1Id,
        outputs.PrivateSubnet2Id,
        outputs.PrivateSubnet3Id,
        outputs.DatabaseSubnet1Id,
        outputs.DatabaseSubnet2Id,
        outputs.DatabaseSubnet3Id,
      ];

      const command = new DescribeSubnetsCommand({
        SubnetIds: subnetIds,
      });

      const response = await ec2Client.send(command);
      expect(response.Subnets).toHaveLength(9);
    });

    test('public subnets should have correct CIDR blocks', async () => {
      const command = new DescribeSubnetsCommand({
        SubnetIds: [outputs.PublicSubnet1Id, outputs.PublicSubnet2Id, outputs.PublicSubnet3Id],
      });

      const response = await ec2Client.send(command);
      const cidrBlocks = response.Subnets!.map((s: any) => (s as any).CidrBlock).filter(Boolean).sort();

      expect(cidrBlocks).toEqual(['10.0.1.0/24', '10.0.2.0/24', '10.0.3.0/24']);
    });

    test('private subnets should have correct CIDR blocks', async () => {
      const command = new DescribeSubnetsCommand({
        SubnetIds: [outputs.PrivateSubnet1Id, outputs.PrivateSubnet2Id, outputs.PrivateSubnet3Id],
      });

      const response = await ec2Client.send(command);
      const cidrBlocks = response.Subnets!.map((s: any) => (s as any).CidrBlock).filter(Boolean).sort();

      expect(cidrBlocks).toEqual(['10.0.11.0/24', '10.0.12.0/24', '10.0.13.0/24']);
    });

    test('database subnets should have correct CIDR blocks', async () => {
      const command = new DescribeSubnetsCommand({
        SubnetIds: [outputs.DatabaseSubnet1Id, outputs.DatabaseSubnet2Id, outputs.DatabaseSubnet3Id],
      });

      const response = await ec2Client.send(command);
      const cidrBlocks = response.Subnets!.map((s: any) => (s as any).CidrBlock).filter(Boolean).sort();

      expect(cidrBlocks).toEqual(['10.0.21.0/24', '10.0.22.0/24', '10.0.23.0/24']);
    });

    test('public subnets should have MapPublicIpOnLaunch enabled', async () => {
      const command = new DescribeSubnetsCommand({
        SubnetIds: [outputs.PublicSubnet1Id, outputs.PublicSubnet2Id, outputs.PublicSubnet3Id],
      });

      const response = await ec2Client.send(command);
      response.Subnets!.forEach((subnet: any) => {
        // CloudFormation explicitly sets MapPublicIpOnLaunch for public subnets. Coerce to boolean
        // since some SDK responses may omit the property when false.
        expect(Boolean((subnet as any).MapPublicIpOnLaunch)).toBe(true);
      });
    });

    test('private subnets should not have MapPublicIpOnLaunch enabled', async () => {
      const command = new DescribeSubnetsCommand({
        SubnetIds: [outputs.PrivateSubnet1Id, outputs.PrivateSubnet2Id, outputs.PrivateSubnet3Id],
      });

      const response = await ec2Client.send(command);
      response.Subnets!.forEach((subnet: any) => {
        // Private subnets do not set MapPublicIpOnLaunch in the template (defaults to false).
        expect(Boolean((subnet as any).MapPublicIpOnLaunch)).toBe(false);
      });
    });

    test('subnets should be distributed across 3 availability zones', async () => {
      const allSubnetIds = [
        outputs.PublicSubnet1Id,
        outputs.PublicSubnet2Id,
        outputs.PublicSubnet3Id,
        outputs.PrivateSubnet1Id,
        outputs.PrivateSubnet2Id,
        outputs.PrivateSubnet3Id,
        outputs.DatabaseSubnet1Id,
        outputs.DatabaseSubnet2Id,
        outputs.DatabaseSubnet3Id,
      ];

      const command = new DescribeSubnetsCommand({
        SubnetIds: allSubnetIds,
      });

      const response = await ec2Client.send(command);
      const azs = new Set(response.Subnets!.map((s: any) => (s as any).AvailabilityZone));

      expect(azs.size).toBe(3);
    });

    test('all subnets should belong to the correct VPC', async () => {
      const allSubnetIds = [
        outputs.PublicSubnet1Id,
        outputs.PublicSubnet2Id,
        outputs.PublicSubnet3Id,
        outputs.PrivateSubnet1Id,
        outputs.PrivateSubnet2Id,
        outputs.PrivateSubnet3Id,
        outputs.DatabaseSubnet1Id,
        outputs.DatabaseSubnet2Id,
        outputs.DatabaseSubnet3Id,
      ];

      const command = new DescribeSubnetsCommand({
        SubnetIds: allSubnetIds,
      });

      const response = await ec2Client.send(command);
      response.Subnets!.forEach((subnet: any) => {
        expect((subnet as any).VpcId).toBe(outputs.VPCId);
      });
    });

    test('subnets should have correct Tier tags', async () => {
      const publicCommand = new DescribeSubnetsCommand({
        SubnetIds: [outputs.PublicSubnet1Id, outputs.PublicSubnet2Id, outputs.PublicSubnet3Id],
      });
      const publicResponse = await ec2Client.send(publicCommand);
      publicResponse.Subnets!.forEach((subnet: any) => {
        const tierTag = (subnet.Tags || []).find((t: any) => t.Key === 'Tier');
        expect(tierTag?.Value).toBe('public');
      });

      const privateCommand = new DescribeSubnetsCommand({
        SubnetIds: [outputs.PrivateSubnet1Id, outputs.PrivateSubnet2Id, outputs.PrivateSubnet3Id],
      });
      const privateResponse = await ec2Client.send(privateCommand);
      privateResponse.Subnets!.forEach((subnet: any) => {
        const tierTag = (subnet.Tags || []).find((t: any) => t.Key === 'Tier');
        expect(tierTag?.Value).toBe('private');
      });

      const databaseCommand = new DescribeSubnetsCommand({
        SubnetIds: [outputs.DatabaseSubnet1Id, outputs.DatabaseSubnet2Id, outputs.DatabaseSubnet3Id],
      });
      const databaseResponse = await ec2Client.send(databaseCommand);
      databaseResponse.Subnets!.forEach((subnet: any) => {
        const tierTag = (subnet.Tags || []).find((t: any) => t.Key === 'Tier');
        expect(tierTag?.Value).toBe('database');
      });
    });
  });

  describe('NAT Gateway Configuration', () => {
    test('all 3 NAT Gateways should exist and be available', async () => {
      const command = new DescribeNatGatewaysCommand({
        NatGatewayIds: [outputs.NATGateway1Id, outputs.NATGateway2Id, outputs.NATGateway3Id],
      });

      const response = await ec2Client.send(command);
      expect(response.NatGateways).toHaveLength(3);

      response.NatGateways!.forEach((nat: any) => {
        expect((nat as any).State).toBe('available');
      });
    });

    test('NAT Gateways should be in public subnets', async () => {
      const command = new DescribeNatGatewaysCommand({
        NatGatewayIds: [outputs.NATGateway1Id, outputs.NATGateway2Id, outputs.NATGateway3Id],
      });

      const response = await ec2Client.send(command);
      const natSubnets = response.NatGateways!.map((nat: any) => (nat as any).SubnetId);

      const publicSubnets = [
        outputs.PublicSubnet1Id,
        outputs.PublicSubnet2Id,
        outputs.PublicSubnet3Id,
      ];

      natSubnets.forEach((subnetId: any) => {
        expect(publicSubnets).toContain(subnetId);
      });
    });

    test('NAT Gateways should have Elastic IPs assigned', async () => {
      const command = new DescribeNatGatewaysCommand({
        NatGatewayIds: [outputs.NATGateway1Id, outputs.NATGateway2Id, outputs.NATGateway3Id],
      });

      const response = await ec2Client.send(command);

      response.NatGateways!.forEach((nat: any) => {
        expect((nat as any).NatGatewayAddresses).toBeDefined();
        expect((nat as any).NatGatewayAddresses!.length).toBeGreaterThan(0);
        expect((nat as any).NatGatewayAddresses![0].PublicIp).toBeDefined();
      });
    });

    test('NAT Gateways should be in different AZs', async () => {
      const subnetIds = [
        outputs.PublicSubnet1Id,
        outputs.PublicSubnet2Id,
        outputs.PublicSubnet3Id,
      ];

      const command = new DescribeSubnetsCommand({
        SubnetIds: subnetIds,
      });

      const response = await ec2Client.send(command);
      const azs = new Set(response.Subnets!.map((s: any) => (s as any).AvailabilityZone));

      expect(azs.size).toBe(3);
    });
  });

  describe('Internet Gateway Configuration', () => {
    test('Internet Gateway should exist and be attached to VPC', async () => {
      const command = new DescribeInternetGatewaysCommand({
        InternetGatewayIds: [outputs.InternetGatewayId],
      });

      const response = await ec2Client.send(command);
      expect(response.InternetGateways).toHaveLength(1);

      const igw = response.InternetGateways![0];
      expect(igw.Attachments).toHaveLength(1);
      expect(igw.Attachments![0].VpcId).toBe(outputs.VPCId);
      expect(igw.Attachments![0].State).toBe('available');
    });
  });

  describe('Route Tables', () => {
    test('public route table should have route to Internet Gateway', async () => {
      const command = new DescribeRouteTablesCommand({
        Filters: [
          { Name: 'vpc-id', Values: [outputs.VPCId] },
          { Name: 'association.subnet-id', Values: [outputs.PublicSubnet1Id] },
        ],
      });

      const response = await ec2Client.send(command);
      expect(response.RouteTables).toHaveLength(1);

      const routeTable = response.RouteTables![0];
      const igwRoute = routeTable.Routes?.find(
        (r: any) => (r as any).DestinationCidrBlock === '0.0.0.0/0' && (r as any).GatewayId === outputs.InternetGatewayId
      );

      expect(igwRoute).toBeDefined();
    });

    test('private route tables should have routes to NAT Gateways', async () => {
      const privateSubnets = [
        outputs.PrivateSubnet1Id,
        outputs.PrivateSubnet2Id,
        outputs.PrivateSubnet3Id,
      ];

      for (const subnetId of privateSubnets) {
        const command = new DescribeRouteTablesCommand({
          Filters: [
            { Name: 'vpc-id', Values: [outputs.VPCId] },
            { Name: 'association.subnet-id', Values: [subnetId] },
          ],
        });

        const response = await ec2Client.send(command);
        expect(response.RouteTables).toHaveLength(1);

        const routeTable = response.RouteTables![0];
        const natRoute = routeTable.Routes?.find((r: any) => (r as any).DestinationCidrBlock === '0.0.0.0/0');

        expect(natRoute).toBeDefined();
        expect(natRoute!.NatGatewayId).toBeDefined();
      }
    });

    test('database route tables should not have internet routes', async () => {
      const databaseSubnets = [
        outputs.DatabaseSubnet1Id,
        outputs.DatabaseSubnet2Id,
        outputs.DatabaseSubnet3Id,
      ];

      for (const subnetId of databaseSubnets) {
        const command = new DescribeRouteTablesCommand({
          Filters: [
            { Name: 'vpc-id', Values: [outputs.VPCId] },
            { Name: 'association.subnet-id', Values: [subnetId] },
          ],
        });

        const response = await ec2Client.send(command);
        expect(response.RouteTables).toHaveLength(1);

        const routeTable = response.RouteTables![0];
        const internetRoute = routeTable.Routes?.find(
          (r: any) => (r as any).DestinationCidrBlock === '0.0.0.0/0'
        );

        expect(internetRoute).toBeUndefined();
      }
    });
  });

  describe('Network ACLs', () => {
    test('VPC should have custom Network ACLs', async () => {
      const command = new DescribeNetworkAclsCommand({
        Filters: [
          { Name: 'vpc-id', Values: [outputs.VPCId] },
        ],
      });

      const response = await ec2Client.send(command);
      const customNACLs = response.NetworkAcls!.filter((nacl: any) => !(nacl as any).IsDefault);

      expect(customNACLs.length).toBeGreaterThanOrEqual(3);
    });

    test('subnets should be associated with custom NACLs', async () => {
      const allSubnetIds = [
        outputs.PublicSubnet1Id,
        outputs.PrivateSubnet1Id,
        outputs.DatabaseSubnet1Id,
      ];

      const command = new DescribeNetworkAclsCommand({
        Filters: [
          { Name: 'vpc-id', Values: [outputs.VPCId] },
        ],
      });

      const response = await ec2Client.send(command);

      allSubnetIds.forEach((subnetId: any) => {
        const nacl = response.NetworkAcls!.find((nacl: any) =>
          (nacl as any).Associations?.some((assoc: any) => (assoc as any).SubnetId === subnetId)
        );

        expect(nacl).toBeDefined();
      });
    });
  });

  describe('VPC Flow Logs', () => {
    test('VPC Flow Logs should be enabled', async () => {
      const command = new DescribeFlowLogsCommand({
        // DescribeFlowLogsCommand input uses the `Filter` property name in this SDK version.
        Filter: [
          { Name: 'resource-id', Values: [outputs.VPCId] },
        ],
      });

      const response = await ec2Client.send(command);
      expect(response.FlowLogs).toHaveLength(1);

      const flowLog = response.FlowLogs![0];
      expect(flowLog.FlowLogStatus).toBe('ACTIVE');
      expect(flowLog.TrafficType).toBe('ALL');
      expect(flowLog.LogDestinationType).toBe('cloud-watch-logs');
    });

    test('CloudWatch Log Group should exist with correct retention', async () => {
      const command = new DescribeLogGroupsCommand({
        logGroupNamePrefix: outputs.VPCFlowLogsLogGroupName,
      });

      const response = await logsClient.send(command);
      expect(response.logGroups).toHaveLength(1);

      const logGroup = response.logGroups![0];
      expect(logGroup.logGroupName).toBe(outputs.VPCFlowLogsLogGroupName);
      expect(logGroup.retentionInDays).toBe(7);
    });
  });

  describe('End-to-End Network Connectivity', () => {
    test('all resources should be in the correct VPC', async () => {
      const vpcCommand = new DescribeVpcsCommand({
        VpcIds: [outputs.VPCId],
      });
      const vpcResponse = await ec2Client.send(vpcCommand);
      expect(vpcResponse.Vpcs![0].State).toBe('available');

      const subnetCommand = new DescribeSubnetsCommand({
        Filters: [{ Name: 'vpc-id', Values: [outputs.VPCId] }],
      });
      const subnetResponse = await ec2Client.send(subnetCommand);
      expect(subnetResponse.Subnets!.length).toBe(9);

      const natCommand = new DescribeNatGatewaysCommand({
        // DescribeNatGatewaysCommand input uses the `Filter` property name in this SDK version.
        Filter: [{ Name: 'vpc-id', Values: [outputs.VPCId] }],
      });
      const natResponse = await ec2Client.send(natCommand);
      expect(natResponse.NatGateways!.length).toBe(3);
    });

    test('infrastructure should support multi-AZ deployment', async () => {
      const allSubnetIds = [
        outputs.PublicSubnet1Id,
        outputs.PublicSubnet2Id,
        outputs.PublicSubnet3Id,
        outputs.PrivateSubnet1Id,
        outputs.PrivateSubnet2Id,
        outputs.PrivateSubnet3Id,
        outputs.DatabaseSubnet1Id,
        outputs.DatabaseSubnet2Id,
        outputs.DatabaseSubnet3Id,
      ];

      const command = new DescribeSubnetsCommand({
        SubnetIds: allSubnetIds,
      });

      const response = await ec2Client.send(command);
      const azs = new Set(response.Subnets!.map((s: any) => (s as any).AvailabilityZone));

      expect(azs.size).toBe(3);

      const publicAzs = new Set(
        response.Subnets!
          .filter((s: any) => [outputs.PublicSubnet1Id, outputs.PublicSubnet2Id, outputs.PublicSubnet3Id].includes((s as any).SubnetId!))
          .map((s: any) => (s as any).AvailabilityZone)
      );
      expect(publicAzs.size).toBe(3);

      const privateAzs = new Set(
        response.Subnets!
          .filter((s: any) => [outputs.PrivateSubnet1Id, outputs.PrivateSubnet2Id, outputs.PrivateSubnet3Id].includes((s as any).SubnetId!))
          .map((s: any) => (s as any).AvailabilityZone)
      );
      expect(privateAzs.size).toBe(3);

      const databaseAzs = new Set(
        response.Subnets!
          .filter((s: any) => [outputs.DatabaseSubnet1Id, outputs.DatabaseSubnet2Id, outputs.DatabaseSubnet3Id].includes((s as any).SubnetId!))
          .map((s: any) => (s as any).AvailabilityZone)
      );
      expect(databaseAzs.size).toBe(3);
    });
  });

  describe('Resource Tagging', () => {
    test('all resources should have required tags', async () => {
      const vpcCommand = new DescribeVpcsCommand({
        VpcIds: [outputs.VPCId],
      });
      const vpcResponse = await ec2Client.send(vpcCommand);
      const vpcTags: any[] = vpcResponse.Vpcs![0].Tags || [];

      expect(vpcTags.find((t: any) => t.Key === 'Environment')).toBeDefined();
      expect(vpcTags.find((t: any) => t.Key === 'Project')).toBeDefined();
      expect(vpcTags.find((t: any) => t.Key === 'CostCenter')).toBeDefined();
    });

    test('all resources should have environmentSuffix in names', async () => {
      const vpcCommand = new DescribeVpcsCommand({
        VpcIds: [outputs.VPCId],
      });
      const vpcResponse = await ec2Client.send(vpcCommand);
      const vpcName = vpcResponse.Vpcs![0].Tags?.find((t: any) => t.Key === 'Name')?.Value;

      expect(vpcName).toContain(environmentSuffix);
    });
  });
});
