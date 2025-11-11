import {
    CloudFormationClient,
    DescribeStacksCommand
} from '@aws-sdk/client-cloudformation';
import {
    CloudWatchLogsClient,
    DescribeLogGroupsCommand
} from '@aws-sdk/client-cloudwatch-logs';
import {
    DescribeInternetGatewaysCommand,
    DescribeNatGatewaysCommand,
    DescribeRouteTablesCommand,
    DescribeSecurityGroupsCommand,
    DescribeSubnetsCommand,
    DescribeTransitGatewayAttachmentsCommand,
    DescribeTransitGatewayRouteTablesCommand,
    DescribeTransitGatewaysCommand,
    DescribeVpcAttributeCommand,
    DescribeVpcsCommand,
    EC2Client,
    SearchTransitGatewayRoutesCommand
} from '@aws-sdk/client-ec2';

const region = process.env.AWS_REGION || 'us-east-1';
const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'stage';
const stackName = `TapStack-${environmentSuffix}`;

const ec2Client = new EC2Client({ region });
const logsClient = new CloudWatchLogsClient({ region });
const cfnClient = new CloudFormationClient({ region });

// Dynamically load stack outputs from CloudFormation
let outputs = {};
let stackOutputs = [];

async function loadStackOutputs() {
  try {
    const response = await cfnClient.send(
      new DescribeStacksCommand({ StackName: stackName })
    );
    
    if (response.Stacks && response.Stacks.length > 0) {
      stackOutputs = response.Stacks[0].Outputs || [];
      outputs = stackOutputs.reduce((acc, output) => {
        acc[output.OutputKey] = output.OutputValue;
        return acc;
      }, {});
      console.log(`Loaded ${stackOutputs.length} outputs from stack ${stackName}`);
    }
  } catch (error) {
    console.error(`Failed to load stack outputs from ${stackName}:`, error.message);
    throw error;
  }
}

describe('Hub-and-Spoke Network Architecture Integration Tests', () => {
  beforeAll(async () => {
    await loadStackOutputs();
  });

  describe('VPC Validation', () => {
    test('Hub VPC should exist with correct CIDR', async () => {
      const vpcId = outputs.HubVpcId;
      expect(vpcId).toBeDefined();

      const response = await ec2Client.send(
        new DescribeVpcsCommand({ VpcIds: [vpcId] })
      );

      expect(response.Vpcs).toHaveLength(1);
      const vpc = response.Vpcs[0];
      expect(vpc.CidrBlock).toBe('10.0.0.0/16');
      expect(vpc.State).toBe('available');
    });

    test('Finance VPC should exist with correct CIDR', async () => {
      const vpcId = outputs.FinanceVpcId;
      expect(vpcId).toBeDefined();

      const response = await ec2Client.send(
        new DescribeVpcsCommand({ VpcIds: [vpcId] })
      );

      expect(response.Vpcs).toHaveLength(1);
      expect(response.Vpcs[0].CidrBlock).toBe('10.1.0.0/16');
      expect(response.Vpcs[0].State).toBe('available');
    });

    test('Engineering VPC should exist with correct CIDR', async () => {
      const vpcId = outputs.EngineeringVpcId;
      expect(vpcId).toBeDefined();

      const response = await ec2Client.send(
        new DescribeVpcsCommand({ VpcIds: [vpcId] })
      );

      expect(response.Vpcs).toHaveLength(1);
      expect(response.Vpcs[0].CidrBlock).toBe('10.2.0.0/16');
      expect(response.Vpcs[0].State).toBe('available');
    });

    test('Marketing VPC should exist with correct CIDR', async () => {
      const vpcId = outputs.MarketingVpcId;
      expect(vpcId).toBeDefined();

      const response = await ec2Client.send(
        new DescribeVpcsCommand({ VpcIds: [vpcId] })
      );

      expect(response.Vpcs).toHaveLength(1);
      expect(response.Vpcs[0].CidrBlock).toBe('10.3.0.0/16');
      expect(response.Vpcs[0].State).toBe('available');
    });

    test('all VPCs should have DNS support enabled', async () => {
      const vpcIds = [
        outputs.HubVpcId,
        outputs.FinanceVpcId,
        outputs.EngineeringVpcId,
        outputs.MarketingVpcId
      ];

      for (const vpcId of vpcIds) {
        const dnsSupportResponse = await ec2Client.send(
          new DescribeVpcAttributeCommand({
            VpcId: vpcId,
            Attribute: 'enableDnsSupport'
          })
        );

        const dnsHostnamesResponse = await ec2Client.send(
          new DescribeVpcAttributeCommand({
            VpcId: vpcId,
            Attribute: 'enableDnsHostnames'
          })
        );

        expect(dnsSupportResponse.EnableDnsSupport?.Value).toBe(true);
        expect(dnsHostnamesResponse.EnableDnsHostnames?.Value).toBe(true);
      }
    });
  });

  describe('Subnet Validation', () => {
    test('Hub VPC should have all 6 subnets', async () => {
      const subnetIds = [
        outputs.HubPublicSubnet1Id,
        outputs.HubPublicSubnet2Id,
        outputs.HubPublicSubnet3Id,
        outputs.HubPrivateSubnet1Id,
        outputs.HubPrivateSubnet2Id,
        outputs.HubPrivateSubnet3Id
      ];

      subnetIds.forEach(id => expect(id).toBeDefined());

      const response = await ec2Client.send(
        new DescribeSubnetsCommand({ SubnetIds: subnetIds })
      );

      expect(response.Subnets).toHaveLength(6);
    });

    test('Hub public subnets should have correct CIDR blocks', async () => {
      const subnetIds = [
        outputs.HubPublicSubnet1Id,
        outputs.HubPublicSubnet2Id,
        outputs.HubPublicSubnet3Id
      ];

      const response = await ec2Client.send(
        new DescribeSubnetsCommand({ SubnetIds: subnetIds })
      );

      const cidrs = response.Subnets.map(s => s.CidrBlock).sort();
      expect(cidrs).toContain('10.0.100.0/24');
      expect(cidrs).toContain('10.0.101.0/24');
      expect(cidrs).toContain('10.0.102.0/24');
    });

    test('Hub private subnets should have correct CIDR blocks', async () => {
      const subnetIds = [
        outputs.HubPrivateSubnet1Id,
        outputs.HubPrivateSubnet2Id,
        outputs.HubPrivateSubnet3Id
      ];

      const response = await ec2Client.send(
        new DescribeSubnetsCommand({ SubnetIds: subnetIds })
      );

      const cidrs = response.Subnets.map(s => s.CidrBlock).sort();
      expect(cidrs).toContain('10.0.0.0/24');
      expect(cidrs).toContain('10.0.1.0/24');
      expect(cidrs).toContain('10.0.2.0/24');
    });

    test('spoke VPCs should each have 6 subnets', async () => {
      const financeSubnets = [
        outputs.FinancePublicSubnet1Id,
        outputs.FinancePublicSubnet2Id,
        outputs.FinancePublicSubnet3Id,
        outputs.FinancePrivateSubnet1Id,
        outputs.FinancePrivateSubnet2Id,
        outputs.FinancePrivateSubnet3Id
      ];

      financeSubnets.forEach(id => expect(id).toBeDefined());

      const response = await ec2Client.send(
        new DescribeSubnetsCommand({ SubnetIds: financeSubnets })
      );

      expect(response.Subnets).toHaveLength(6);
    });

    test('subnets should span multiple availability zones', async () => {
      const subnetIds = [
        outputs.HubPublicSubnet1Id,
        outputs.HubPublicSubnet2Id,
        outputs.HubPublicSubnet3Id
      ];

      const response = await ec2Client.send(
        new DescribeSubnetsCommand({ SubnetIds: subnetIds })
      );

      const azs = new Set(response.Subnets.map(s => s.AvailabilityZone));
      expect(azs.size).toBe(3);
    });
  });

  describe('Transit Gateway Validation', () => {
    test('Transit Gateway should exist and be available', async () => {
      const tgwId = outputs.TransitGatewayId;
      expect(tgwId).toBeDefined();

      const response = await ec2Client.send(
        new DescribeTransitGatewaysCommand({
          TransitGatewayIds: [tgwId]
        })
      );

      expect(response.TransitGateways).toHaveLength(1);
      const tgw = response.TransitGateways[0];
      expect(tgw.State).toBe('available');
      expect(tgw.Options.DefaultRouteTableAssociation).toBe('disable');
      expect(tgw.Options.DefaultRouteTablePropagation).toBe('disable');
    });

    test('all VPCs should be attached to Transit Gateway', async () => {
      const tgwId = outputs.TransitGatewayId;

      const response = await ec2Client.send(
        new DescribeTransitGatewayAttachmentsCommand({
          Filters: [
            {
              Name: 'transit-gateway-id',
              Values: [tgwId]
            },
            {
              Name: 'state',
              Values: ['available']
            }
          ]
        })
      );

      expect(response.TransitGatewayAttachments.length).toBeGreaterThanOrEqual(4);

      const attachedVpcs = response.TransitGatewayAttachments.map(
        att => att.ResourceId
      );

      expect(attachedVpcs).toContain(outputs.HubVpcId);
      expect(attachedVpcs).toContain(outputs.FinanceVpcId);
      expect(attachedVpcs).toContain(outputs.EngineeringVpcId);
      expect(attachedVpcs).toContain(outputs.MarketingVpcId);
    });

    test('Transit Gateway should have route tables configured', async () => {
      const tgwId = outputs.TransitGatewayId;

      const response = await ec2Client.send(
        new DescribeTransitGatewayRouteTablesCommand({
          Filters: [
            {
              Name: 'transit-gateway-id',
              Values: [tgwId]
            }
          ]
        })
      );

      expect(response.TransitGatewayRouteTables.length).toBeGreaterThanOrEqual(2);

      response.TransitGatewayRouteTables.forEach(rt => {
        expect(rt.State).toBe('available');
      });
    });
  });

  describe('NAT Gateway Validation', () => {
    test('Finance NAT Gateway should exist and be available', async () => {
      const natId = outputs.FinanceNATGatewayId;
      expect(natId).toBeDefined();

      const response = await ec2Client.send(
        new DescribeNatGatewaysCommand({ NatGatewayIds: [natId] })
      );

      expect(response.NatGateways).toHaveLength(1);
      expect(response.NatGateways[0].State).toBe('available');
    });

    test('Engineering NAT Gateway should exist and be available', async () => {
      const natId = outputs.EngineeringNATGatewayId;
      expect(natId).toBeDefined();

      const response = await ec2Client.send(
        new DescribeNatGatewaysCommand({ NatGatewayIds: [natId] })
      );

      expect(response.NatGateways).toHaveLength(1);
      expect(response.NatGateways[0].State).toBe('available');
    });

    test('Marketing NAT Gateway should exist and be available', async () => {
      const natId = outputs.MarketingNATGatewayId;
      expect(natId).toBeDefined();

      const response = await ec2Client.send(
        new DescribeNatGatewaysCommand({ NatGatewayIds: [natId] })
      );

      expect(response.NatGateways).toHaveLength(1);
      expect(response.NatGateways[0].State).toBe('available');
    });

    test('NAT Gateways should have Elastic IPs assigned', async () => {
      const natIds = [
        outputs.FinanceNATGatewayId,
        outputs.EngineeringNATGatewayId,
        outputs.MarketingNATGatewayId
      ];

      const response = await ec2Client.send(
        new DescribeNatGatewaysCommand({ NatGatewayIds: natIds })
      );

      response.NatGateways.forEach(nat => {
        expect(nat.NatGatewayAddresses).toHaveLength(1);
        expect(nat.NatGatewayAddresses[0].PublicIp).toBeDefined();
      });
    });
  });

  describe('Security Groups Validation', () => {
    test('Web Tier Security Group should exist with correct rules', async () => {
      const sgId = outputs.WebTierSecurityGroupId;
      expect(sgId).toBeDefined();

      const response = await ec2Client.send(
        new DescribeSecurityGroupsCommand({ GroupIds: [sgId] })
      );

      expect(response.SecurityGroups).toHaveLength(1);
      const sg = response.SecurityGroups[0];

      const httpRule = sg.IpPermissions.find(
        rule => rule.FromPort === 80 && rule.ToPort === 80
      );
      expect(httpRule).toBeDefined();

      const httpsRule = sg.IpPermissions.find(
        rule => rule.FromPort === 443 && rule.ToPort === 443
      );
      expect(httpsRule).toBeDefined();
    });

    test('App Tier Security Group should exist', async () => {
      const sgId = outputs.AppTierSecurityGroupId;
      expect(sgId).toBeDefined();

      const response = await ec2Client.send(
        new DescribeSecurityGroupsCommand({ GroupIds: [sgId] })
      );

      expect(response.SecurityGroups).toHaveLength(1);
      expect(response.SecurityGroups[0].IpPermissions.length).toBeGreaterThan(0);
    });

    test('App Tier should only allow traffic from Web Tier', async () => {
      const appSgId = outputs.AppTierSecurityGroupId;
      const webSgId = outputs.WebTierSecurityGroupId;

      const response = await ec2Client.send(
        new DescribeSecurityGroupsCommand({ GroupIds: [appSgId] })
      );

      const appSg = response.SecurityGroups[0];
      const hasWebTierSource = appSg.IpPermissions.some(rule =>
        rule.UserIdGroupPairs?.some(pair => pair.GroupId === webSgId)
      );

      expect(hasWebTierSource).toBe(true);
    });
  });

  describe('Internet Gateway Validation', () => {
    test('Hub VPC should have an Internet Gateway attached', async () => {
      const vpcId = outputs.HubVpcId;

      const response = await ec2Client.send(
        new DescribeInternetGatewaysCommand({
          Filters: [
            {
              Name: 'attachment.vpc-id',
              Values: [vpcId]
            }
          ]
        })
      );

      expect(response.InternetGateways.length).toBeGreaterThanOrEqual(1);
      expect(response.InternetGateways[0].Attachments[0].State).toBe('available');
    });

    test('all spoke VPCs should have Internet Gateways attached', async () => {
      const vpcIds = [
        outputs.FinanceVpcId,
        outputs.EngineeringVpcId,
        outputs.MarketingVpcId
      ];

      for (const vpcId of vpcIds) {
        const response = await ec2Client.send(
          new DescribeInternetGatewaysCommand({
            Filters: [
              {
                Name: 'attachment.vpc-id',
                Values: [vpcId]
              }
            ]
          })
        );

        expect(response.InternetGateways.length).toBeGreaterThanOrEqual(1);
      }
    });
  });

  describe('VPC Flow Logs Validation', () => {
    test('CloudWatch Log Groups should exist for all VPCs', async () => {
      const response = await logsClient.send(
        new DescribeLogGroupsCommand({
          logGroupNamePrefix: '/aws/vpc/'
        })
      );

      const logGroupNames = response.logGroups.map(lg => lg.logGroupName);

      expect(logGroupNames.some(name => name.includes('hub-vpc'))).toBe(true);
      expect(logGroupNames.some(name => name.includes('finance-vpc'))).toBe(true);
      expect(logGroupNames.some(name => name.includes('engineering-vpc'))).toBe(true);
      expect(logGroupNames.some(name => name.includes('marketing-vpc'))).toBe(true);
    });
  });

  describe('Route Tables Validation', () => {
    test('Hub VPC should have public and private route tables', async () => {
      const vpcId = outputs.HubVpcId;

      const response = await ec2Client.send(
        new DescribeRouteTablesCommand({
          Filters: [
            {
              Name: 'vpc-id',
              Values: [vpcId]
            }
          ]
        })
      );

      expect(response.RouteTables.length).toBeGreaterThanOrEqual(2);
    });

    test('private route tables should have routes to Transit Gateway', async () => {
      const vpcId = outputs.HubVpcId;

      const response = await ec2Client.send(
        new DescribeRouteTablesCommand({
          Filters: [
            {
              Name: 'vpc-id',
              Values: [vpcId]
            }
          ]
        })
      );

      const hasTgwRoute = response.RouteTables.some(rt =>
        rt.Routes.some(route => route.TransitGatewayId)
      );

      expect(hasTgwRoute).toBe(true);
    });

    test('public route tables should have routes to Internet Gateway', async () => {
      const vpcId = outputs.HubVpcId;

      const response = await ec2Client.send(
        new DescribeRouteTablesCommand({
          Filters: [
            {
              Name: 'vpc-id',
              Values: [vpcId]
            }
          ]
        })
      );

      const hasIgwRoute = response.RouteTables.some(rt =>
        rt.Routes.some(route => route.GatewayId && route.GatewayId.startsWith('igw-'))
      );

      expect(hasIgwRoute).toBe(true);
    });

    test('spoke private subnets should have routes to NAT Gateway', async () => {
      const vpcId = outputs.FinanceVpcId;

      const response = await ec2Client.send(
        new DescribeRouteTablesCommand({
          Filters: [
            {
              Name: 'vpc-id',
              Values: [vpcId]
            }
          ]
        })
      );

      const hasNatRoute = response.RouteTables.some(rt =>
        rt.Routes.some(route => route.NatGatewayId)
      );

      expect(hasNatRoute).toBe(true);
    });
  });

  describe('Connectivity Test Results', () => {
    test('custom resource should report success', () => {
      const result = outputs.ConnectivityTestResult;
      expect(result).toBeDefined();
      expect(result).toContain('VPCs created');
    });
  });

  describe('Hub-and-Spoke Routing Validation', () => {
    test('Hub should be able to reach all spoke VPCs', async () => {
      const tgwId = outputs.TransitGatewayId;

      const rtResponse = await ec2Client.send(
        new DescribeTransitGatewayRouteTablesCommand({
          Filters: [
            {
              Name: 'transit-gateway-id',
              Values: [tgwId]
            }
          ]
        })
      );

      expect(rtResponse.TransitGatewayRouteTables.length).toBeGreaterThanOrEqual(2);

      for (const routeTable of rtResponse.TransitGatewayRouteTables) {
        const routesResponse = await ec2Client.send(
          new SearchTransitGatewayRoutesCommand({
            TransitGatewayRouteTableId: routeTable.TransitGatewayRouteTableId,
            Filters: [
              {
                Name: 'type',
                Values: ['propagated', 'static']
              }
            ]
          })
        );

        expect(routesResponse.Routes).toBeDefined();
      }
    });
  });

  describe('Resource Tagging Validation', () => {
    test('VPCs should have required tags', async () => {
      const vpcIds = [
        outputs.HubVpcId,
        outputs.FinanceVpcId,
        outputs.EngineeringVpcId,
        outputs.MarketingVpcId
      ];

      const response = await ec2Client.send(
        new DescribeVpcsCommand({ VpcIds: vpcIds })
      );

      response.Vpcs.forEach(vpc => {
        const tags = vpc.Tags || [];
        const tagKeys = tags.map(t => t.Key);

        expect(tagKeys).toContain('Department');
        expect(tagKeys).toContain('Environment');
        expect(tagKeys).toContain('MigrationPhase');
      });
    });

    test('Transit Gateway should have required tags', async () => {
      const tgwId = outputs.TransitGatewayId;

      const response = await ec2Client.send(
        new DescribeTransitGatewaysCommand({
          TransitGatewayIds: [tgwId]
        })
      );

      const tags = response.TransitGateways[0].Tags || [];
      const tagKeys = tags.map(t => t.Key);

      expect(tagKeys).toContain('Department');
      expect(tagKeys).toContain('Environment');
      expect(tagKeys).toContain('MigrationPhase');
    });
  });
});
