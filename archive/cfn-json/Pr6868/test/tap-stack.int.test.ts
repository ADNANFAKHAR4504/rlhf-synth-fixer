import fs from 'fs';
import {
  EC2Client,
  DescribeVpcsCommand,
  DescribeVpcAttributeCommand,
  DescribeSubnetsCommand,
  DescribeNatGatewaysCommand,
  DescribeInternetGatewaysCommand,
  DescribeRouteTablesCommand,
  DescribeSecurityGroupsCommand,
  DescribeNetworkAclsCommand,
  DescribeFlowLogsCommand,
} from '@aws-sdk/client-ec2';
import {
  CloudWatchLogsClient,
  DescribeLogGroupsCommand,
} from '@aws-sdk/client-cloudwatch-logs';
import {
  KMSClient,
  DescribeKeyCommand,
  ListAliasesCommand,
} from '@aws-sdk/client-kms';

// Load outputs from deployment
const outputs = JSON.parse(
  fs.readFileSync('cfn-outputs/flat-outputs.json', 'utf8')
);

const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';
const region = process.env.AWS_REGION || 'us-east-1';

const ec2Client = new EC2Client({ region });
const cwlClient = new CloudWatchLogsClient({ region });
const kmsClient = new KMSClient({ region });

describe('VPC Infrastructure Integration Tests', () => {
  describe('VPC Configuration', () => {
    test('VPC should exist and have correct CIDR block', async () => {
      const response = await ec2Client.send(
        new DescribeVpcsCommand({
          VpcIds: [outputs.VPCId],
        })
      );

      expect(response.Vpcs).toHaveLength(1);
      const vpc = response.Vpcs![0];
      expect(vpc.VpcId).toBe(outputs.VPCId);
      expect(vpc.CidrBlock).toBe(outputs.VPCCidr);
    });

    test('VPC should have DNS support enabled', async () => {
      const dnsHostnamesResponse = await ec2Client.send(
        new DescribeVpcAttributeCommand({
          VpcId: outputs.VPCId,
          Attribute: 'enableDnsHostnames',
        })
      );
      const dnsSupportResponse = await ec2Client.send(
        new DescribeVpcAttributeCommand({
          VpcId: outputs.VPCId,
          Attribute: 'enableDnsSupport',
        })
      );

      expect(dnsHostnamesResponse.EnableDnsHostnames?.Value).toBe(true);
      expect(dnsSupportResponse.EnableDnsSupport?.Value).toBe(true);
    });

    test('VPC should have proper tags', async () => {
      const response = await ec2Client.send(
        new DescribeVpcsCommand({
          VpcIds: [outputs.VPCId],
        })
      );

      const vpc = response.Vpcs![0];
      const tags = vpc.Tags || [];

      const nameTag = tags.find(t => t.Key === 'Name');
      expect(nameTag).toBeDefined();
      expect(nameTag!.Value).toContain(environmentSuffix);

      const envTag = tags.find(t => t.Key === 'Environment');
      expect(envTag).toBeDefined();

      const ownerTag = tags.find(t => t.Key === 'Owner');
      expect(ownerTag).toBeDefined();
    });
  });

  describe('Subnet Architecture', () => {
    test('should have 9 subnets total (3 public + 6 private)', async () => {
      const response = await ec2Client.send(
        new DescribeSubnetsCommand({
          Filters: [
            {
              Name: 'vpc-id',
              Values: [outputs.VPCId],
            },
          ],
        })
      );

      expect(response.Subnets).toHaveLength(9);
    });

    test('public subnets should exist with correct CIDR blocks', async () => {
      const publicSubnetIds = [
        outputs.PublicSubnet1Id,
        outputs.PublicSubnet2Id,
        outputs.PublicSubnet3Id,
      ];

      const response = await ec2Client.send(
        new DescribeSubnetsCommand({
          SubnetIds: publicSubnetIds,
        })
      );

      expect(response.Subnets).toHaveLength(3);

      const cidrBlocks = response.Subnets!.map(s => s.CidrBlock).sort();
      expect(cidrBlocks).toEqual([
        '10.0.1.0/24',
        '10.0.2.0/24',
        '10.0.3.0/24',
      ]);
    });

    test('private subnets should exist with correct CIDR blocks', async () => {
      const privateSubnetIds = [
        outputs.PrivateSubnet1Id,
        outputs.PrivateSubnet2Id,
        outputs.PrivateSubnet3Id,
        outputs.PrivateSubnet4Id,
        outputs.PrivateSubnet5Id,
        outputs.PrivateSubnet6Id,
      ];

      const response = await ec2Client.send(
        new DescribeSubnetsCommand({
          SubnetIds: privateSubnetIds,
        })
      );

      expect(response.Subnets).toHaveLength(6);

      const cidrBlocks = response.Subnets!.map(s => s.CidrBlock).sort();
      expect(cidrBlocks).toEqual([
        '10.0.11.0/24',
        '10.0.12.0/24',
        '10.0.13.0/24',
        '10.0.14.0/24',
        '10.0.15.0/24',
        '10.0.16.0/24',
      ]);
    });

    test('public subnets should map public IPs on launch', async () => {
      const publicSubnetIds = [
        outputs.PublicSubnet1Id,
        outputs.PublicSubnet2Id,
        outputs.PublicSubnet3Id,
      ];

      const response = await ec2Client.send(
        new DescribeSubnetsCommand({
          SubnetIds: publicSubnetIds,
        })
      );

      response.Subnets!.forEach(subnet => {
        expect(subnet.MapPublicIpOnLaunch).toBe(true);
      });
    });

    test('subnets should span 3 different availability zones', async () => {
      const response = await ec2Client.send(
        new DescribeSubnetsCommand({
          Filters: [
            {
              Name: 'vpc-id',
              Values: [outputs.VPCId],
            },
          ],
        })
      );

      const azs = new Set(response.Subnets!.map(s => s.AvailabilityZone));
      expect(azs.size).toBe(3);
    });

    test('each AZ should have 1 public and 2 private subnets', async () => {
      const response = await ec2Client.send(
        new DescribeSubnetsCommand({
          Filters: [
            {
              Name: 'vpc-id',
              Values: [outputs.VPCId],
            },
          ],
        })
      );

      const azMap: { [key: string]: { public: number; private: number } } = {};

      response.Subnets!.forEach(subnet => {
        const az = subnet.AvailabilityZone!;
        if (!azMap[az]) {
          azMap[az] = { public: 0, private: 0 };
        }

        const isPublic = subnet.MapPublicIpOnLaunch === true;
        if (isPublic) {
          azMap[az].public++;
        } else {
          azMap[az].private++;
        }
      });

      expect(Object.keys(azMap).length).toBe(3);
      Object.values(azMap).forEach(counts => {
        expect(counts.public).toBe(1);
        expect(counts.private).toBe(2);
      });
    });
  });

  describe('Internet Gateway and NAT Gateways', () => {
    test('should have Internet Gateway attached to VPC', async () => {
      const response = await ec2Client.send(
        new DescribeInternetGatewaysCommand({
          Filters: [
            {
              Name: 'attachment.vpc-id',
              Values: [outputs.VPCId],
            },
          ],
        })
      );

      expect(response.InternetGateways).toHaveLength(1);
      const igw = response.InternetGateways![0];
      expect(igw.Attachments).toHaveLength(1);
      expect(igw.Attachments![0].VpcId).toBe(outputs.VPCId);
      expect(igw.Attachments![0].State).toBe('available');
    });

    test('should have exactly 3 NAT Gateways', async () => {
      const response = await ec2Client.send(
        new DescribeNatGatewaysCommand({
          Filter: [
            {
              Name: 'vpc-id',
              Values: [outputs.VPCId],
            },
            {
              Name: 'state',
              Values: ['available'],
            },
          ],
        })
      );

      expect(response.NatGateways).toHaveLength(3);
    });

    test('each NAT Gateway should be in a different public subnet', async () => {
      const response = await ec2Client.send(
        new DescribeNatGatewaysCommand({
          Filter: [
            {
              Name: 'vpc-id',
              Values: [outputs.VPCId],
            },
            {
              Name: 'state',
              Values: ['available'],
            },
          ],
        })
      );

      const natSubnetIds = response.NatGateways!.map(nat => nat.SubnetId);
      const uniqueSubnetIds = new Set(natSubnetIds);

      expect(uniqueSubnetIds.size).toBe(3);

      // Verify all NAT Gateways are in public subnets
      const publicSubnetIds = [
        outputs.PublicSubnet1Id,
        outputs.PublicSubnet2Id,
        outputs.PublicSubnet3Id,
      ];

      natSubnetIds.forEach(subnetId => {
        expect(publicSubnetIds).toContain(subnetId);
      });
    });

    test('each NAT Gateway should have an Elastic IP', async () => {
      const response = await ec2Client.send(
        new DescribeNatGatewaysCommand({
          Filter: [
            {
              Name: 'vpc-id',
              Values: [outputs.VPCId],
            },
            {
              Name: 'state',
              Values: ['available'],
            },
          ],
        })
      );

      response.NatGateways!.forEach(nat => {
        expect(nat.NatGatewayAddresses).toBeDefined();
        expect(nat.NatGatewayAddresses!.length).toBeGreaterThan(0);
        expect(nat.NatGatewayAddresses![0].AllocationId).toBeDefined();
        expect(nat.NatGatewayAddresses![0].PublicIp).toBeDefined();
      });
    });
  });

  describe('Route Tables', () => {
    test('should have correct number of route tables (1 public + 3 private)', async () => {
      const response = await ec2Client.send(
        new DescribeRouteTablesCommand({
          Filters: [
            {
              Name: 'vpc-id',
              Values: [outputs.VPCId],
            },
            {
              Name: 'association.main',
              Values: ['false'],
            },
          ],
        })
      );

      // Should have 4 custom route tables (1 public + 3 private)
      expect(response.RouteTables!.length).toBeGreaterThanOrEqual(4);
    });

    test('public route table should have route to Internet Gateway', async () => {
      const publicSubnetIds = [outputs.PublicSubnet1Id];

      const response = await ec2Client.send(
        new DescribeRouteTablesCommand({
          Filters: [
            {
              Name: 'vpc-id',
              Values: [outputs.VPCId],
            },
            {
              Name: 'association.subnet-id',
              Values: publicSubnetIds,
            },
          ],
        })
      );

      expect(response.RouteTables).toHaveLength(1);
      const routeTable = response.RouteTables![0];

      const igwRoute = routeTable.Routes!.find(
        r => r.DestinationCidrBlock === '0.0.0.0/0' && r.GatewayId?.startsWith('igw-')
      );

      expect(igwRoute).toBeDefined();
      expect(igwRoute!.State).toBe('active');
    });

    test('private route tables should have routes to NAT Gateways', async () => {
      const privateSubnetIds = [
        outputs.PrivateSubnet1Id,
        outputs.PrivateSubnet3Id,
        outputs.PrivateSubnet5Id,
      ];

      for (const subnetId of privateSubnetIds) {
        const response = await ec2Client.send(
          new DescribeRouteTablesCommand({
            Filters: [
              {
                Name: 'vpc-id',
                Values: [outputs.VPCId],
              },
              {
                Name: 'association.subnet-id',
                Values: [subnetId],
              },
            ],
          })
        );

        expect(response.RouteTables).toHaveLength(1);
        const routeTable = response.RouteTables![0];

        const natRoute = routeTable.Routes!.find(
          r => r.DestinationCidrBlock === '0.0.0.0/0' && r.NatGatewayId?.startsWith('nat-')
        );

        expect(natRoute).toBeDefined();
        expect(natRoute!.State).toBe('active');
      }
    });
  });

  describe('Security Groups', () => {
    test('should have BastionSecurityGroup', async () => {
      const response = await ec2Client.send(
        new DescribeSecurityGroupsCommand({
          GroupIds: [outputs.BastionSecurityGroupId],
        })
      );

      expect(response.SecurityGroups).toHaveLength(1);
      const sg = response.SecurityGroups![0];
      expect(sg.GroupId).toBe(outputs.BastionSecurityGroupId);
      expect(sg.VpcId).toBe(outputs.VPCId);
    });

    test('should have ALBSecurityGroup', async () => {
      const response = await ec2Client.send(
        new DescribeSecurityGroupsCommand({
          GroupIds: [outputs.ALBSecurityGroupId],
        })
      );

      expect(response.SecurityGroups).toHaveLength(1);
      const sg = response.SecurityGroups![0];
      expect(sg.GroupId).toBe(outputs.ALBSecurityGroupId);
      expect(sg.VpcId).toBe(outputs.VPCId);
    });

    test('should have ApplicationSecurityGroup', async () => {
      const response = await ec2Client.send(
        new DescribeSecurityGroupsCommand({
          GroupIds: [outputs.ApplicationSecurityGroupId],
        })
      );

      expect(response.SecurityGroups).toHaveLength(1);
      const sg = response.SecurityGroups![0];
      expect(sg.GroupId).toBe(outputs.ApplicationSecurityGroupId);
      expect(sg.VpcId).toBe(outputs.VPCId);
    });

    test('BastionSecurityGroup should allow SSH from specific IP only', async () => {
      const response = await ec2Client.send(
        new DescribeSecurityGroupsCommand({
          GroupIds: [outputs.BastionSecurityGroupId],
        })
      );

      const sg = response.SecurityGroups![0];
      const sshRules = sg.IpPermissions!.filter(
        r => r.FromPort === 22 && r.ToPort === 22
      );

      expect(sshRules.length).toBeGreaterThan(0);

      // Should not allow SSH from 0.0.0.0/0
      sshRules.forEach(rule => {
        rule.IpRanges?.forEach(range => {
          expect(range.CidrIp).not.toBe('0.0.0.0/0');
        });
      });
    });

    test('ALBSecurityGroup should allow HTTP and HTTPS from internet', async () => {
      const response = await ec2Client.send(
        new DescribeSecurityGroupsCommand({
          GroupIds: [outputs.ALBSecurityGroupId],
        })
      );

      const sg = response.SecurityGroups![0];

      const httpRule = sg.IpPermissions!.find(
        r => r.FromPort === 80 && r.ToPort === 80
      );
      expect(httpRule).toBeDefined();

      const httpsRule = sg.IpPermissions!.find(
        r => r.FromPort === 443 && r.ToPort === 443
      );
      expect(httpsRule).toBeDefined();
    });

    test('ApplicationSecurityGroup should allow traffic from ALB and Bastion', async () => {
      const response = await ec2Client.send(
        new DescribeSecurityGroupsCommand({
          GroupIds: [outputs.ApplicationSecurityGroupId],
        })
      );

      const sg = response.SecurityGroups![0];

      // Check for rules referencing other security groups
      const rulesWithSgSources = sg.IpPermissions!.filter(
        r => r.UserIdGroupPairs && r.UserIdGroupPairs.length > 0
      );

      expect(rulesWithSgSources.length).toBeGreaterThan(0);

      const sourceSecurityGroups = new Set<string>();
      rulesWithSgSources.forEach(rule => {
        rule.UserIdGroupPairs?.forEach(pair => {
          sourceSecurityGroups.add(pair.GroupId!);
        });
      });

      expect(sourceSecurityGroups.has(outputs.ALBSecurityGroupId)).toBe(true);
      expect(sourceSecurityGroups.has(outputs.BastionSecurityGroupId)).toBe(true);
    });

    test('security groups should have proper tags with environment suffix', async () => {
      const sgIds = [
        outputs.BastionSecurityGroupId,
        outputs.ALBSecurityGroupId,
        outputs.ApplicationSecurityGroupId,
      ];

      const response = await ec2Client.send(
        new DescribeSecurityGroupsCommand({
          GroupIds: sgIds,
        })
      );

      response.SecurityGroups!.forEach(sg => {
        const tags = sg.Tags || [];
        const nameTag = tags.find(t => t.Key === 'Name');
        expect(nameTag).toBeDefined();
        expect(nameTag!.Value).toContain(environmentSuffix);
      });
    });
  });

  describe('Network ACLs', () => {
    test('should have custom Network ACLs', async () => {
      const response = await ec2Client.send(
        new DescribeNetworkAclsCommand({
          Filters: [
            {
              Name: 'vpc-id',
              Values: [outputs.VPCId],
            },
            {
              Name: 'default',
              Values: ['false'],
            },
          ],
        })
      );

      // Should have at least 2 custom NACLs (public and private)
      expect(response.NetworkAcls!.length).toBeGreaterThanOrEqual(2);
    });

    test('Network ACLs should have inbound and outbound rules', async () => {
      const response = await ec2Client.send(
        new DescribeNetworkAclsCommand({
          Filters: [
            {
              Name: 'vpc-id',
              Values: [outputs.VPCId],
            },
            {
              Name: 'default',
              Values: ['false'],
            },
          ],
        })
      );

      response.NetworkAcls!.forEach(nacl => {
        expect(nacl.Entries!.length).toBeGreaterThan(0);

        const inboundRules = nacl.Entries!.filter(e => !e.Egress);
        const outboundRules = nacl.Entries!.filter(e => e.Egress);

        expect(inboundRules.length).toBeGreaterThan(0);
        expect(outboundRules.length).toBeGreaterThan(0);
      });
    });

    test('subnets should be associated with custom NACLs', async () => {
      const allSubnetIds = [
        outputs.PublicSubnet1Id,
        outputs.PublicSubnet2Id,
        outputs.PublicSubnet3Id,
        outputs.PrivateSubnet1Id,
        outputs.PrivateSubnet2Id,
        outputs.PrivateSubnet3Id,
        outputs.PrivateSubnet4Id,
        outputs.PrivateSubnet5Id,
        outputs.PrivateSubnet6Id,
      ];

      const response = await ec2Client.send(
        new DescribeNetworkAclsCommand({
          Filters: [
            {
              Name: 'vpc-id',
              Values: [outputs.VPCId],
            },
          ],
        })
      );

      const associatedSubnets = new Set<string>();
      response.NetworkAcls!.forEach(nacl => {
        nacl.Associations?.forEach(assoc => {
          if (assoc.SubnetId) {
            associatedSubnets.add(assoc.SubnetId);
          }
        });
      });

      allSubnetIds.forEach(subnetId => {
        expect(associatedSubnets.has(subnetId)).toBe(true);
      });
    });
  });

  describe('VPC Flow Logs', () => {
    test('VPC should have Flow Logs enabled', async () => {
      const response = await ec2Client.send(
        new DescribeFlowLogsCommand({
          Filter: [
            {
              Name: 'resource-id',
              Values: [outputs.VPCId],
            },
          ],
        })
      );

      expect(response.FlowLogs!.length).toBeGreaterThan(0);
      const flowLog = response.FlowLogs![0];
      expect(flowLog.ResourceId).toBe(outputs.VPCId);
      expect(flowLog.TrafficType).toBe('ALL');
      expect(flowLog.LogDestinationType).toBe('cloud-watch-logs');
    });

    test('CloudWatch Log Group should exist with correct retention', async () => {
      const response = await cwlClient.send(
        new DescribeLogGroupsCommand({
          logGroupNamePrefix: outputs.FlowLogsLogGroupName,
        })
      );

      expect(response.logGroups).toHaveLength(1);
      const logGroup = response.logGroups![0];
      expect(logGroup.logGroupName).toBe(outputs.FlowLogsLogGroupName);
      expect(logGroup.retentionInDays).toBe(30);
    });

    test('CloudWatch Log Group should use KMS encryption', async () => {
      const response = await cwlClient.send(
        new DescribeLogGroupsCommand({
          logGroupNamePrefix: outputs.FlowLogsLogGroupName,
        })
      );

      const logGroup = response.logGroups![0];
      expect(logGroup.kmsKeyId).toBeDefined();
      expect(logGroup.kmsKeyId).toBe(outputs.FlowLogsKMSKeyArn);
    });

    test('KMS key should be active and properly configured', async () => {
      const keyId = outputs.FlowLogsKMSKeyArn.split('/').pop();

      const response = await kmsClient.send(
        new DescribeKeyCommand({
          KeyId: keyId,
        })
      );

      expect(response.KeyMetadata).toBeDefined();
      expect(response.KeyMetadata!.KeyState).toBe('Enabled');
      expect(response.KeyMetadata!.Enabled).toBe(true);
    });

    test('KMS key should have an alias', async () => {
      const keyId = outputs.FlowLogsKMSKeyArn.split('/').pop();

      const response = await kmsClient.send(
        new ListAliasesCommand({
          KeyId: keyId,
        })
      );

      expect(response.Aliases!.length).toBeGreaterThan(0);
      const alias = response.Aliases![0];
      expect(alias.AliasName).toMatch(/flow[-_]?logs/i);
    });
  });

  describe('High Availability Validation', () => {
    test('infrastructure should span 3 availability zones', async () => {
      const response = await ec2Client.send(
        new DescribeSubnetsCommand({
          Filters: [
            {
              Name: 'vpc-id',
              Values: [outputs.VPCId],
            },
          ],
        })
      );

      const azs = new Set(response.Subnets!.map(s => s.AvailabilityZone));
      expect(azs.size).toBe(3);
    });

    test('each availability zone should have redundant NAT Gateway', async () => {
      const response = await ec2Client.send(
        new DescribeNatGatewaysCommand({
          Filter: [
            {
              Name: 'vpc-id',
              Values: [outputs.VPCId],
            },
            {
              Name: 'state',
              Values: ['available'],
            },
          ],
        })
      );

      const natAZs = new Set(response.NatGateways!.map(nat => nat.SubnetId));
      expect(natAZs.size).toBe(3);
    });
  });

  describe('Resource Naming Conventions', () => {
    test('all resources should include environment suffix in names', async () => {
      // Check VPC
      const vpcResponse = await ec2Client.send(
        new DescribeVpcsCommand({ VpcIds: [outputs.VPCId] })
      );
      const vpcNameTag = vpcResponse.Vpcs![0].Tags!.find(t => t.Key === 'Name');
      expect(vpcNameTag!.Value).toContain(environmentSuffix);

      // Check subnets
      const subnetResponse = await ec2Client.send(
        new DescribeSubnetsCommand({
          SubnetIds: [outputs.PublicSubnet1Id],
        })
      );
      const subnetNameTag = subnetResponse.Subnets![0].Tags!.find(t => t.Key === 'Name');
      expect(subnetNameTag!.Value).toContain(environmentSuffix);

      // Check security groups
      const sgResponse = await ec2Client.send(
        new DescribeSecurityGroupsCommand({
          GroupIds: [outputs.BastionSecurityGroupId],
        })
      );
      const sgNameTag = sgResponse.SecurityGroups![0].Tags!.find(t => t.Key === 'Name');
      expect(sgNameTag!.Value).toContain(environmentSuffix);
    });
  });
});
