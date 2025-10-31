import {
  CloudWatchLogsClient
} from '@aws-sdk/client-cloudwatch-logs';
import {
  DescribeFlowLogsCommand,
  DescribeInternetGatewaysCommand,
  DescribeNatGatewaysCommand,
  DescribeNetworkAclsCommand,
  DescribeRouteTablesCommand,
  DescribeSecurityGroupsCommand,
  DescribeSubnetsCommand,
  DescribeVpcEndpointsCommand,
  DescribeVpcsCommand,
  EC2Client
} from '@aws-sdk/client-ec2';
import {
  IAMClient
} from '@aws-sdk/client-iam';
import fs from 'fs';

const outputs = JSON.parse(
  fs.readFileSync('cfn-outputs/flat-outputs.json', 'utf8')
);

// Attempt to obtain static credentials to avoid triggering the AWS SDK's
// dynamic credential-provider imports (which require --experimental-vm-modules
// under Jest). We prefer environment variables, fall back to the shared
// credentials file (~/.aws/credentials), and if none are found the
// integration suite will be skipped with a clear message.
import path from 'path';

const region = process.env.AWS_REGION || 'us-east-1';

function parseIni(contents: string) {
  const lines = contents.split(/\r?\n/);
  const profiles: Record<string, Record<string, string>> = {};
  let current: string | null = null;
  for (const raw of lines) {
    const line = raw.trim();
    if (!line || line.startsWith('#') || line.startsWith(';')) continue;
    const m = line.match(/^\[(.+)\]$/);
    if (m) {
      current = m[1];
      profiles[current] = {};
      continue;
    }
    if (!current) continue;
    const idx = line.indexOf('=');
    if (idx === -1) continue;
    const key = line.substring(0, idx).trim();
    const value = line.substring(idx + 1).trim();
    profiles[current][key] = value;
  }
  return profiles;
}

function loadSharedCredentials() {
  const credsFile = process.env.AWS_SHARED_CREDENTIALS_FILE ||
    path.join(process.env.HOME || process.env.USERPROFILE || '', '.aws', 'credentials');
  try {
    if (!credsFile) return null;
    const raw = fs.readFileSync(credsFile, 'utf8');
    const profiles = parseIni(raw);
    const profileName = process.env.AWS_PROFILE || 'default';
    const profile = profiles[profileName];
    if (!profile) return null;
    if (profile.aws_access_key_id && profile.aws_secret_access_key) {
      return {
        accessKeyId: profile.aws_access_key_id,
        secretAccessKey: profile.aws_secret_access_key,
        sessionToken: profile.aws_session_token || undefined,
      };
    }
    return null;
  } catch (e) {
    return null;
  }
}

const awsAccessKeyId = process.env.AWS_ACCESS_KEY_ID;
const awsSecretAccessKey = process.env.AWS_SECRET_ACCESS_KEY;
const awsSessionToken = process.env.AWS_SESSION_TOKEN;

let staticCredentials: { accessKeyId: string; secretAccessKey: string; sessionToken?: string } | null = null;
if (awsAccessKeyId && awsSecretAccessKey) {
  staticCredentials = {
    accessKeyId: awsAccessKeyId,
    secretAccessKey: awsSecretAccessKey,
    sessionToken: awsSessionToken || undefined,
  };
} else {
  staticCredentials = loadSharedCredentials();
}

const shouldSkipIntegration = !staticCredentials;
if (shouldSkipIntegration) {
  // eslint-disable-next-line no-console
  console.warn('Skipping integration tests: no AWS credentials found in environment or shared credentials file.');
}

const ec2Client = staticCredentials ? new EC2Client({ region, credentials: staticCredentials }) : (null as any);
const logsClient = staticCredentials ? new CloudWatchLogsClient({ region, credentials: staticCredentials }) : (null as any);
const iamClient = staticCredentials ? new IAMClient({ region, credentials: staticCredentials }) : (null as any);

if (shouldSkipIntegration) {
  describe.skip('VPC Infrastructure Integration Tests', () => {
    test('skipped: no AWS credentials available', () => {
      expect(true).toBe(true);
    });
  });
} else {
  describe('VPC Infrastructure Integration Tests', () => {
    describe('VPC Configuration', () => {
      test('VPC should exist and have correct CIDR block', async () => {
        const response = await ec2Client.send(
          new DescribeVpcsCommand({
            VpcIds: [outputs.VPCId]
          })
        );

        expect(response.Vpcs).toBeDefined();
        expect(response.Vpcs!.length).toBe(1);
        const vpc = response.Vpcs![0];
        expect(vpc.CidrBlock).toBe('10.0.0.0/16');
        expect(vpc.State).toBe('available');
      });

      test('VPC should have proper tags', async () => {
        const response = await ec2Client.send(
          new DescribeVpcsCommand({
            VpcIds: [outputs.VPCId]
          })
        );

        const vpc = response.Vpcs![0];
        const tags = vpc.Tags || [];
        const tagMap = tags.reduce((acc: any, tag) => {
          acc[tag.Key!] = tag.Value;
          return acc;
        }, {});

        expect(tagMap.Environment).toBe('Production');
        expect(tagMap.Owner).toBe('FinanceTeam');
        expect(tagMap.CostCenter).toBe('TECH001');
      });
    });

    describe('Subnet Configuration', () => {
      test('should have 3 public subnets', async () => {
        const subnetIds = [
          outputs.PublicSubnet1Id,
          outputs.PublicSubnet2Id,
          outputs.PublicSubnet3Id
        ];

        const response = await ec2Client.send(
          new DescribeSubnetsCommand({
            SubnetIds: subnetIds
          })
        );

        expect(response.Subnets!.length).toBe(3);
        response.Subnets!.forEach(subnet => {
          expect(subnet.State).toBe('available');
          expect(subnet.VpcId).toBe(outputs.VPCId);
          expect(subnet.MapPublicIpOnLaunch).toBe(true);
        });
      });

      test('public subnets should have correct CIDR blocks', async () => {
        const subnetIds = [
          outputs.PublicSubnet1Id,
          outputs.PublicSubnet2Id,
          outputs.PublicSubnet3Id
        ];

        const response = await ec2Client.send(
          new DescribeSubnetsCommand({
            SubnetIds: subnetIds
          })
        );

        const cidrBlocks = response.Subnets!.map(s => s.CidrBlock).sort();
        expect(cidrBlocks).toEqual(['10.0.1.0/24', '10.0.2.0/24', '10.0.3.0/24']);
      });

      test('public subnets should be in different availability zones', async () => {
        const subnetIds = [
          outputs.PublicSubnet1Id,
          outputs.PublicSubnet2Id,
          outputs.PublicSubnet3Id
        ];

        const response = await ec2Client.send(
          new DescribeSubnetsCommand({
            SubnetIds: subnetIds
          })
        );

        const azs = response.Subnets!.map(s => s.AvailabilityZone).sort();
        expect(new Set(azs).size).toBe(3);
      });

      test('should have 3 private subnets', async () => {
        const subnetIds = [
          outputs.PrivateSubnet1Id,
          outputs.PrivateSubnet2Id,
          outputs.PrivateSubnet3Id
        ];

        const response = await ec2Client.send(
          new DescribeSubnetsCommand({
            SubnetIds: subnetIds
          })
        );

        expect(response.Subnets!.length).toBe(3);
        response.Subnets!.forEach(subnet => {
          expect(subnet.State).toBe('available');
          expect(subnet.VpcId).toBe(outputs.VPCId);
          expect(subnet.MapPublicIpOnLaunch).toBe(false);
        });
      });

      test('private subnets should have correct CIDR blocks', async () => {
        const subnetIds = [
          outputs.PrivateSubnet1Id,
          outputs.PrivateSubnet2Id,
          outputs.PrivateSubnet3Id
        ];

        const response = await ec2Client.send(
          new DescribeSubnetsCommand({
            SubnetIds: subnetIds
          })
        );

        const cidrBlocks = response.Subnets!.map(s => s.CidrBlock).sort();
        expect(cidrBlocks).toEqual(['10.0.11.0/24', '10.0.12.0/24', '10.0.13.0/24']);
      });

      test('private subnets should be in different availability zones', async () => {
        const subnetIds = [
          outputs.PrivateSubnet1Id,
          outputs.PrivateSubnet2Id,
          outputs.PrivateSubnet3Id
        ];

        const response = await ec2Client.send(
          new DescribeSubnetsCommand({
            SubnetIds: subnetIds
          })
        );

        const azs = response.Subnets!.map(s => s.AvailabilityZone).sort();
        expect(new Set(azs).size).toBe(3);
      });
    });

    describe('NAT Gateway Configuration', () => {
      test('should have 2 NAT Gateways in available state', async () => {
        const natGatewayIds = [
          outputs.NatGateway1Id,
          outputs.NatGateway2Id
        ];

        const response = await ec2Client.send(
          new DescribeNatGatewaysCommand({
            NatGatewayIds: natGatewayIds
          })
        );

        expect(response.NatGateways!.length).toBe(2);
        response.NatGateways!.forEach(nat => {
          expect(nat.State).toBe('available');
          expect(nat.VpcId).toBe(outputs.VPCId);
        });
      });

      test('NAT Gateways should be in public subnets', async () => {
        const natGatewayIds = [
          outputs.NatGateway1Id,
          outputs.NatGateway2Id
        ];

        const response = await ec2Client.send(
          new DescribeNatGatewaysCommand({
            NatGatewayIds: natGatewayIds
          })
        );

        const publicSubnetIds = [
          outputs.PublicSubnet1Id,
          outputs.PublicSubnet2Id,
          outputs.PublicSubnet3Id
        ];

        response.NatGateways!.forEach(nat => {
          expect(publicSubnetIds).toContain(nat.SubnetId);
        });
      });

      test('NAT Gateways should be in different availability zones', async () => {
        const natGatewayIds = [
          outputs.NatGateway1Id,
          outputs.NatGateway2Id
        ];

        const response = await ec2Client.send(
          new DescribeNatGatewaysCommand({
            NatGatewayIds: natGatewayIds
          })
        );

        const subnetIds = response.NatGateways!.map(nat => nat.SubnetId);
        const subnetsResponse = await ec2Client.send(
          new DescribeSubnetsCommand({
            SubnetIds: subnetIds
          })
        );

        const azs = subnetsResponse.Subnets!.map(s => s.AvailabilityZone);
        expect(new Set(azs).size).toBe(2);
      });

      test('each NAT Gateway should have an Elastic IP', async () => {
        const natGatewayIds = [
          outputs.NatGateway1Id,
          outputs.NatGateway2Id
        ];

        const response = await ec2Client.send(
          new DescribeNatGatewaysCommand({
            NatGatewayIds: natGatewayIds
          })
        );

        response.NatGateways!.forEach(nat => {
          expect(nat.NatGatewayAddresses!.length).toBeGreaterThan(0);
          expect(nat.NatGatewayAddresses![0].PublicIp).toBeDefined();
        });
      });
    });

    describe('Internet Gateway Configuration', () => {
      test('should have Internet Gateway attached to VPC', async () => {
        const response = await ec2Client.send(
          new DescribeInternetGatewaysCommand({
            Filters: [
              {
                Name: 'attachment.vpc-id',
                Values: [outputs.VPCId]
              }
            ]
          })
        );

        expect(response.InternetGateways!.length).toBe(1);
        const igw = response.InternetGateways![0];
        expect(igw.Attachments![0].State).toBe('available');
        expect(igw.Attachments![0].VpcId).toBe(outputs.VPCId);
      });
    });

    describe('Route Table Configuration', () => {
      test('public subnets should have route to Internet Gateway', async () => {
        const subnetIds = [
          outputs.PublicSubnet1Id,
          outputs.PublicSubnet2Id,
          outputs.PublicSubnet3Id
        ];

        const response = await ec2Client.send(
          new DescribeRouteTablesCommand({
            Filters: [
              {
                Name: 'association.subnet-id',
                Values: subnetIds
              }
            ]
          })
        );

        expect(response.RouteTables!.length).toBeGreaterThan(0);

        response.RouteTables!.forEach(rt => {
          const defaultRoute = rt.Routes!.find(r => r.DestinationCidrBlock === '0.0.0.0/0');
          expect(defaultRoute).toBeDefined();
          expect(defaultRoute!.GatewayId).toMatch(/^igw-/);
          expect(defaultRoute!.State).toBe('active');
        });
      });

      test('private subnets should have routes to NAT Gateways', async () => {
        const subnetIds = [
          outputs.PrivateSubnet1Id,
          outputs.PrivateSubnet2Id,
          outputs.PrivateSubnet3Id
        ];

        const response = await ec2Client.send(
          new DescribeRouteTablesCommand({
            Filters: [
              {
                Name: 'association.subnet-id',
                Values: subnetIds
              }
            ]
          })
        );

        expect(response.RouteTables!.length).toBeGreaterThan(0);

        response.RouteTables!.forEach(rt => {
          const defaultRoute = rt.Routes!.find(r => r.DestinationCidrBlock === '0.0.0.0/0');
          expect(defaultRoute).toBeDefined();
          expect(defaultRoute!.NatGatewayId).toMatch(/^nat-/);
          expect(defaultRoute!.State).toBe('active');
        });
      });

      test('private subnets should not have direct routes to Internet Gateway', async () => {
        const subnetIds = [
          outputs.PrivateSubnet1Id,
          outputs.PrivateSubnet2Id,
          outputs.PrivateSubnet3Id
        ];

        const response = await ec2Client.send(
          new DescribeRouteTablesCommand({
            Filters: [
              {
                Name: 'association.subnet-id',
                Values: subnetIds
              }
            ]
          })
        );

        response.RouteTables!.forEach(rt => {
          const routes = rt.Routes!.filter(r => r.GatewayId && r.GatewayId.startsWith('igw-'));
          expect(routes.length).toBe(0);
        });
      });
    });

    describe('Security Group Configuration', () => {
      test('Web Tier Security Group should exist and be configured correctly', async () => {
        const response = await ec2Client.send(
          new DescribeSecurityGroupsCommand({
            GroupIds: [outputs.WebTierSecurityGroupId]
          })
        );

        expect(response.SecurityGroups!.length).toBe(1);
        const sg = response.SecurityGroups![0];
        expect(sg.VpcId).toBe(outputs.VPCId);
        expect(sg.GroupName).toContain('web-tier-sg');
      });

      test('Web Tier SG should allow HTTP and HTTPS from VPC CIDR only', async () => {
        const response = await ec2Client.send(
          new DescribeSecurityGroupsCommand({
            GroupIds: [outputs.WebTierSecurityGroupId]
          })
        );

        const sg = response.SecurityGroups![0];
        const ingressRules = sg.IpPermissions!;

        const httpRule = ingressRules.find(r => r.FromPort === 80);
        expect(httpRule).toBeDefined();
        expect(httpRule!.IpRanges![0].CidrIp).toBe('10.0.0.0/16');

        const httpsRule = ingressRules.find(r => r.FromPort === 443);
        expect(httpsRule).toBeDefined();
        expect(httpsRule!.IpRanges![0].CidrIp).toBe('10.0.0.0/16');
      });

      test('Web Tier SG should have no 0.0.0.0/0 ingress rules', async () => {
        const response = await ec2Client.send(
          new DescribeSecurityGroupsCommand({
            GroupIds: [outputs.WebTierSecurityGroupId]
          })
        );

        const sg = response.SecurityGroups![0];
        const openRules = sg.IpPermissions!.filter(
          r => r.IpRanges && r.IpRanges.some(ip => ip.CidrIp === '0.0.0.0/0')
        );
        expect(openRules.length).toBe(0);
      });

      test('Application Tier Security Group should exist and be configured correctly', async () => {
        const response = await ec2Client.send(
          new DescribeSecurityGroupsCommand({
            GroupIds: [outputs.AppTierSecurityGroupId]
          })
        );

        expect(response.SecurityGroups!.length).toBe(1);
        const sg = response.SecurityGroups![0];
        expect(sg.VpcId).toBe(outputs.VPCId);
        expect(sg.GroupName).toContain('app-tier-sg');
      });

      test('Application Tier SG should allow port 8080 from Web Tier only', async () => {
        const response = await ec2Client.send(
          new DescribeSecurityGroupsCommand({
            GroupIds: [outputs.AppTierSecurityGroupId]
          })
        );

        const sg = response.SecurityGroups![0];
        const ingressRules = sg.IpPermissions!;

        const appRule = ingressRules.find(r => r.FromPort === 8080);
        expect(appRule).toBeDefined();
        expect(appRule!.UserIdGroupPairs![0].GroupId).toBe(outputs.WebTierSecurityGroupId);
      });

      test('Application Tier SG should have no CIDR-based ingress rules', async () => {
        const response = await ec2Client.send(
          new DescribeSecurityGroupsCommand({
            GroupIds: [outputs.AppTierSecurityGroupId]
          })
        );

        const sg = response.SecurityGroups![0];
        const cidrRules = sg.IpPermissions!.filter(
          r => r.IpRanges && r.IpRanges.length > 0
        );
        expect(cidrRules.length).toBe(0);
      });
    });

    describe('Network ACL Configuration', () => {
      test('should have custom Network ACLs for public subnets', async () => {
        const subnetIds = [
          outputs.PublicSubnet1Id,
          outputs.PublicSubnet2Id,
          outputs.PublicSubnet3Id
        ];

        const response = await ec2Client.send(
          new DescribeNetworkAclsCommand({
            Filters: [
              {
                Name: 'association.subnet-id',
                Values: subnetIds
              }
            ]
          })
        );

        expect(response.NetworkAcls!.length).toBeGreaterThan(0);
        response.NetworkAcls!.forEach(nacl => {
          expect(nacl.IsDefault).toBe(false);
          expect(nacl.VpcId).toBe(outputs.VPCId);
        });
      });

      test('public subnets should have Network ACL rules for HTTP and HTTPS', async () => {
        const subnetIds = [outputs.PublicSubnet1Id];

        const response = await ec2Client.send(
          new DescribeNetworkAclsCommand({
            Filters: [
              {
                Name: 'association.subnet-id',
                Values: subnetIds
              }
            ]
          })
        );

        const nacl = response.NetworkAcls![0];
        const ingressRules = nacl.Entries!.filter(e => !e.Egress);

        const httpRule = ingressRules.find(r => r.PortRange?.From === 80);
        const httpsRule = ingressRules.find(r => r.PortRange?.From === 443);

        expect(httpRule).toBeDefined();
        expect(httpsRule).toBeDefined();
        expect(httpRule!.RuleAction).toBe('allow');
        expect(httpsRule!.RuleAction).toBe('allow');
      });

      test('should have custom Network ACLs for private subnets', async () => {
        const subnetIds = [
          outputs.PrivateSubnet1Id,
          outputs.PrivateSubnet2Id,
          outputs.PrivateSubnet3Id
        ];

        const response = await ec2Client.send(
          new DescribeNetworkAclsCommand({
            Filters: [
              {
                Name: 'association.subnet-id',
                Values: subnetIds
              }
            ]
          })
        );

        expect(response.NetworkAcls!.length).toBeGreaterThan(0);
        response.NetworkAcls!.forEach(nacl => {
          expect(nacl.IsDefault).toBe(false);
          expect(nacl.VpcId).toBe(outputs.VPCId);
        });
      });
    });

    describe('VPC Endpoints Configuration', () => {
      test('should have VPC Endpoint for S3', async () => {
        const response = await ec2Client.send(
          new DescribeVpcEndpointsCommand({
            Filters: [
              {
                Name: 'vpc-id',
                Values: [outputs.VPCId]
              },
              {
                Name: 'service-name',
                Values: [`com.amazonaws.${process.env.AWS_REGION || 'us-east-1'}.s3`]
              }
            ]
          })
        );

        expect(response.VpcEndpoints!.length).toBeGreaterThan(0);
        const s3Endpoint = response.VpcEndpoints![0];
        expect(s3Endpoint.State).toBe('available');
        expect(s3Endpoint.VpcEndpointType).toBe('Gateway');
      });

      test('S3 VPC Endpoint should be associated with private route tables', async () => {
        const response = await ec2Client.send(
          new DescribeVpcEndpointsCommand({
            Filters: [
              {
                Name: 'vpc-id',
                Values: [outputs.VPCId]
              },
              {
                Name: 'service-name',
                Values: [`com.amazonaws.${process.env.AWS_REGION || 'us-east-1'}.s3`]
              }
            ]
          })
        );

        const s3Endpoint = response.VpcEndpoints![0];
        expect(s3Endpoint.RouteTableIds!.length).toBeGreaterThanOrEqual(3);
      });

      test('should have VPC Endpoint for DynamoDB', async () => {
        const response = await ec2Client.send(
          new DescribeVpcEndpointsCommand({
            Filters: [
              {
                Name: 'vpc-id',
                Values: [outputs.VPCId]
              },
              {
                Name: 'service-name',
                Values: [`com.amazonaws.${process.env.AWS_REGION || 'us-east-1'}.dynamodb`]
              }
            ]
          })
        );

        expect(response.VpcEndpoints!.length).toBeGreaterThan(0);
        const dynamoEndpoint = response.VpcEndpoints![0];
        expect(dynamoEndpoint.State).toBe('available');
        expect(dynamoEndpoint.VpcEndpointType).toBe('Gateway');
      });

      test('DynamoDB VPC Endpoint should be associated with private route tables', async () => {
        const response = await ec2Client.send(
          new DescribeVpcEndpointsCommand({
            Filters: [
              {
                Name: 'vpc-id',
                Values: [outputs.VPCId]
              },
              {
                Name: 'service-name',
                Values: [`com.amazonaws.${process.env.AWS_REGION || 'us-east-1'}.dynamodb`]
              }
            ]
          })
        );

        const dynamoEndpoint = response.VpcEndpoints![0];
        expect(dynamoEndpoint.RouteTableIds!.length).toBeGreaterThanOrEqual(3);
      });
    });

    describe('VPC Flow Logs Configuration', () => {
      test('VPC Flow Logs should be enabled', async () => {
        const response = await ec2Client.send(
          new DescribeFlowLogsCommand({
            Filters: [
              {
                Name: 'resource-id',
                Values: [outputs.VPCId]
              }
            ]
          })
        );

        expect(response.FlowLogs!.length).toBeGreaterThan(0);
        const flowLog = response.FlowLogs![0];
        expect(flowLog.FlowLogStatus).toBe('ACTIVE');
        expect(flowLog.TrafficType).toBe('ALL');
        expect(flowLog.LogDestinationType).toBe('cloud-watch-logs');
      });
    });

    describe('High Availability Validation', () => {
      test('infrastructure should span 3 availability zones', async () => {
        const allSubnetIds = [
          outputs.PublicSubnet1Id,
          outputs.PublicSubnet2Id,
          outputs.PublicSubnet3Id,
          outputs.PrivateSubnet1Id,
          outputs.PrivateSubnet2Id,
          outputs.PrivateSubnet3Id
        ];

        const response = await ec2Client.send(
          new DescribeSubnetsCommand({
            SubnetIds: allSubnetIds
          })
        );

        const azs = response.Subnets!.map(s => s.AvailabilityZone);
        const uniqueAzs = new Set(azs);
        expect(uniqueAzs.size).toBe(3);
      });

      test('NAT Gateways should be redundant across different AZs', async () => {
        const natGatewayIds = [
          outputs.NatGateway1Id,
          outputs.NatGateway2Id
        ];

        const response = await ec2Client.send(
          new DescribeNatGatewaysCommand({
            NatGatewayIds: natGatewayIds
          })
        );

        const subnetIds = response.NatGateways!.map(nat => nat.SubnetId);
        const subnetsResponse = await ec2Client.send(
          new DescribeSubnetsCommand({
            SubnetIds: subnetIds
          })
        );

        const azs = subnetsResponse.Subnets!.map(s => s.AvailabilityZone);
        expect(new Set(azs).size).toBe(2);
      });
    });

    describe('Security Compliance Validation', () => {
      test('all security groups should follow least privilege', async () => {
        const sgIds = [
          outputs.WebTierSecurityGroupId,
          outputs.AppTierSecurityGroupId
        ];

        const response = await ec2Client.send(
          new DescribeSecurityGroupsCommand({
            GroupIds: sgIds
          })
        );

        response.SecurityGroups!.forEach(sg => {
          expect(sg.VpcId).toBe(outputs.VPCId);

          const openRules = sg.IpPermissions!.filter(
            r => r.IpRanges && r.IpRanges.some(ip => ip.CidrIp === '0.0.0.0/0')
          );
          expect(openRules.length).toBe(0);
        });
      });

      test('private subnets should not have direct internet access', async () => {
        const subnetIds = [
          outputs.PrivateSubnet1Id,
          outputs.PrivateSubnet2Id,
          outputs.PrivateSubnet3Id
        ];

        const response = await ec2Client.send(
          new DescribeRouteTablesCommand({
            Filters: [
              {
                Name: 'association.subnet-id',
                Values: subnetIds
              }
            ]
          })
        );

        response.RouteTables!.forEach(rt => {
          const igwRoutes = rt.Routes!.filter(
            r => r.GatewayId && r.GatewayId.startsWith('igw-')
          );
          expect(igwRoutes.length).toBe(0);
        });
      });

      test('VPC Flow Logs should be capturing all traffic', async () => {
        const response = await ec2Client.send(
          new DescribeFlowLogsCommand({
            Filters: [
              {
                Name: 'resource-id',
                Values: [outputs.VPCId]
              }
            ]
          })
        );

        expect(response.FlowLogs!.length).toBeGreaterThan(0);
        const flowLog = response.FlowLogs![0];
        expect(flowLog.TrafficType).toBe('ALL');
        expect(flowLog.FlowLogStatus).toBe('ACTIVE');
      });
    });
  });
}
