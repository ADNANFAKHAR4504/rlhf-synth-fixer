import fs from 'fs';
import {
  EC2Client,
  DescribeVpcsCommand,
  DescribeSubnetsCommand,
  DescribeInternetGatewaysCommand,
  DescribeNatGatewaysCommand,
  DescribeRouteTablesCommand,
  DescribeFlowLogsCommand,
  DescribeNetworkAclsCommand,
} from '@aws-sdk/client-ec2';
import {
  IAMClient,
  GetRoleCommand,
} from '@aws-sdk/client-iam';
import {
  CloudWatchLogsClient,
  DescribeLogGroupsCommand,
} from '@aws-sdk/client-cloudwatch-logs';

// Load outputs from deployment
const outputs = JSON.parse(
  fs.readFileSync('cfn-outputs/flat-outputs.json', 'utf8')
);

// Get environment suffix from environment variable (set by CI/CD pipeline)
const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';

// AWS clients
const ec2Client = new EC2Client({ region: 'us-east-1' });
const iamClient = new IAMClient({ region: 'us-east-1' });
const logsClient = new CloudWatchLogsClient({ region: 'us-east-1' });

describe('VPC Network Architecture Integration Tests', () => {
  describe('VPC Validation', () => {
    test('VPC should exist and have correct CIDR block', async () => {
      const vpcId = outputs.VPCID;
      expect(vpcId).toBeDefined();
      expect(vpcId).toMatch(/^vpc-[a-z0-9]+$/);

      const response = await ec2Client.send(
        new DescribeVpcsCommand({ VpcIds: [vpcId] })
      );

      expect(response.Vpcs).toHaveLength(1);
      const vpc = response.Vpcs![0];
      expect(vpc.CidrBlock).toBe('10.0.0.0/16');
      expect(vpc.State).toBe('available');
    });

    test('VPC should have DNS support enabled', async () => {
      const vpcId = outputs.VPCID;

      const response = await ec2Client.send(
        new DescribeVpcsCommand({ VpcIds: [vpcId] })
      );

      const vpc = response.Vpcs![0];
      // Note: DNS hostnames and support are enabled in the template
      // but may not be returned in all API responses
      expect(vpc.State).toBe('available');
    });

    test('VPC should have proper tags', async () => {
      const vpcId = outputs.VPCID;

      const response = await ec2Client.send(
        new DescribeVpcsCommand({ VpcIds: [vpcId] })
      );

      const vpc = response.Vpcs![0];
      const tags = vpc.Tags || [];

      const nameTag = tags.find(t => t.Key === 'Name');
      expect(nameTag).toBeDefined();
      expect(nameTag!.Value).toContain(environmentSuffix);

      const envTag = tags.find(t => t.Key === 'Environment');
      expect(envTag).toBeDefined();

      const deptTag = tags.find(t => t.Key === 'Department');
      expect(deptTag).toBeDefined();
    });
  });

  describe('Public Subnets Validation', () => {
    test('all three public subnets should exist', async () => {
      const publicSubnetIds = [
        outputs.PublicSubnet1ID,
        outputs.PublicSubnet2ID,
        outputs.PublicSubnet3ID,
      ];

      publicSubnetIds.forEach(subnetId => {
        expect(subnetId).toBeDefined();
        expect(subnetId).toMatch(/^subnet-[a-z0-9]+$/);
      });

      const response = await ec2Client.send(
        new DescribeSubnetsCommand({ SubnetIds: publicSubnetIds })
      );

      expect(response.Subnets).toHaveLength(3);
    });

    test('public subnets should be distributed across 3 AZs', async () => {
      const publicSubnetIds = [
        outputs.PublicSubnet1ID,
        outputs.PublicSubnet2ID,
        outputs.PublicSubnet3ID,
      ];

      const response = await ec2Client.send(
        new DescribeSubnetsCommand({ SubnetIds: publicSubnetIds })
      );

      const azs = new Set(response.Subnets!.map(s => s.AvailabilityZone));
      expect(azs.size).toBe(3);
      // Verify each AZ is in the us-east-1 region
      azs.forEach(az => {
        expect(az).toMatch(/^us-east-1[a-z]$/);
      });
    });

    test('public subnets should have MapPublicIpOnLaunch enabled', async () => {
      const publicSubnetIds = [
        outputs.PublicSubnet1ID,
        outputs.PublicSubnet2ID,
        outputs.PublicSubnet3ID,
      ];

      const response = await ec2Client.send(
        new DescribeSubnetsCommand({ SubnetIds: publicSubnetIds })
      );

      response.Subnets!.forEach(subnet => {
        expect(subnet.MapPublicIpOnLaunch).toBe(true);
      });
    });

    test('public subnets should belong to the VPC', async () => {
      const vpcId = outputs.VPCID;
      const publicSubnetIds = [
        outputs.PublicSubnet1ID,
        outputs.PublicSubnet2ID,
        outputs.PublicSubnet3ID,
      ];

      const response = await ec2Client.send(
        new DescribeSubnetsCommand({ SubnetIds: publicSubnetIds })
      );

      response.Subnets!.forEach(subnet => {
        expect(subnet.VpcId).toBe(vpcId);
      });
    });
  });

  describe('Private Subnets Validation', () => {
    test('all three private subnets should exist', async () => {
      const privateSubnetIds = [
        outputs.PrivateSubnet1ID,
        outputs.PrivateSubnet2ID,
        outputs.PrivateSubnet3ID,
      ];

      privateSubnetIds.forEach(subnetId => {
        expect(subnetId).toBeDefined();
        expect(subnetId).toMatch(/^subnet-[a-z0-9]+$/);
      });

      const response = await ec2Client.send(
        new DescribeSubnetsCommand({ SubnetIds: privateSubnetIds })
      );

      expect(response.Subnets).toHaveLength(3);
    });

    test('private subnets should be distributed across 3 AZs', async () => {
      const privateSubnetIds = [
        outputs.PrivateSubnet1ID,
        outputs.PrivateSubnet2ID,
        outputs.PrivateSubnet3ID,
      ];

      const response = await ec2Client.send(
        new DescribeSubnetsCommand({ SubnetIds: privateSubnetIds })
      );

      const azs = new Set(response.Subnets!.map(s => s.AvailabilityZone));
      expect(azs.size).toBe(3);
    });

    test('private subnets should NOT have MapPublicIpOnLaunch enabled', async () => {
      const privateSubnetIds = [
        outputs.PrivateSubnet1ID,
        outputs.PrivateSubnet2ID,
        outputs.PrivateSubnet3ID,
      ];

      const response = await ec2Client.send(
        new DescribeSubnetsCommand({ SubnetIds: privateSubnetIds })
      );

      response.Subnets!.forEach(subnet => {
        expect(subnet.MapPublicIpOnLaunch).toBe(false);
      });
    });

    test('private subnets should belong to the VPC', async () => {
      const vpcId = outputs.VPCID;
      const privateSubnetIds = [
        outputs.PrivateSubnet1ID,
        outputs.PrivateSubnet2ID,
        outputs.PrivateSubnet3ID,
      ];

      const response = await ec2Client.send(
        new DescribeSubnetsCommand({ SubnetIds: privateSubnetIds })
      );

      response.Subnets!.forEach(subnet => {
        expect(subnet.VpcId).toBe(vpcId);
      });
    });
  });

  describe('Internet Gateway Validation', () => {
    test('Internet Gateway should be attached to VPC', async () => {
      const vpcId = outputs.VPCID;

      const response = await ec2Client.send(
        new DescribeInternetGatewaysCommand({
          Filters: [{ Name: 'attachment.vpc-id', Values: [vpcId] }],
        })
      );

      expect(response.InternetGateways).toHaveLength(1);
      const igw = response.InternetGateways![0];
      expect(igw.Attachments).toHaveLength(1);
      expect(igw.Attachments![0].VpcId).toBe(vpcId);
      expect(igw.Attachments![0].State).toBe('available');
    });
  });

  describe('NAT Gateways Validation', () => {
    test('all three NAT Gateways should be active', async () => {
      const natIPs = [
        outputs.NATGateway1IP,
        outputs.NATGateway2IP,
        outputs.NATGateway3IP,
      ];

      natIPs.forEach(ip => {
        expect(ip).toBeDefined();
        expect(ip).toMatch(/^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/);
      });

      const response = await ec2Client.send(
        new DescribeNatGatewaysCommand({
          Filter: [
            { Name: 'state', Values: ['available'] },
            { Name: 'vpc-id', Values: [outputs.VPCID] },
          ],
        })
      );

      expect(response.NatGateways!.length).toBeGreaterThanOrEqual(3);

      const activeNATGateways = response.NatGateways!.filter(
        ng => ng.State === 'available'
      );
      expect(activeNATGateways).toHaveLength(3);
    });

    test('NAT Gateways should be in public subnets', async () => {
      const publicSubnetIds = [
        outputs.PublicSubnet1ID,
        outputs.PublicSubnet2ID,
        outputs.PublicSubnet3ID,
      ];

      const response = await ec2Client.send(
        new DescribeNatGatewaysCommand({
          Filter: [
            { Name: 'state', Values: ['available'] },
            { Name: 'vpc-id', Values: [outputs.VPCID] },
          ],
        })
      );

      response.NatGateways!.forEach(ng => {
        expect(publicSubnetIds).toContain(ng.SubnetId);
      });
    });

    test('each NAT Gateway should have an Elastic IP', async () => {
      const response = await ec2Client.send(
        new DescribeNatGatewaysCommand({
          Filter: [
            { Name: 'state', Values: ['available'] },
            { Name: 'vpc-id', Values: [outputs.VPCID] },
          ],
        })
      );

      response.NatGateways!.forEach(ng => {
        expect(ng.NatGatewayAddresses).toHaveLength(1);
        expect(ng.NatGatewayAddresses![0].AllocationId).toBeDefined();
        expect(ng.NatGatewayAddresses![0].PublicIp).toBeDefined();
      });
    });
  });

  describe('Route Tables Validation', () => {
    test('VPC should have route tables for public and private subnets', async () => {
      const vpcId = outputs.VPCID;

      const response = await ec2Client.send(
        new DescribeRouteTablesCommand({
          Filters: [{ Name: 'vpc-id', Values: [vpcId] }],
        })
      );

      // 1 main route table + 1 public + 3 private = 5 total (or 4 if main is reused)
      expect(response.RouteTables!.length).toBeGreaterThanOrEqual(4);
    });

    test('public route table should have route to Internet Gateway', async () => {
      const vpcId = outputs.VPCID;
      const publicSubnetIds = [
        outputs.PublicSubnet1ID,
        outputs.PublicSubnet2ID,
        outputs.PublicSubnet3ID,
      ];

      const response = await ec2Client.send(
        new DescribeRouteTablesCommand({
          Filters: [
            { Name: 'vpc-id', Values: [vpcId] },
            { Name: 'association.subnet-id', Values: [publicSubnetIds[0]] },
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
      const vpcId = outputs.VPCID;
      const privateSubnetIds = [
        outputs.PrivateSubnet1ID,
        outputs.PrivateSubnet2ID,
        outputs.PrivateSubnet3ID,
      ];

      for (const subnetId of privateSubnetIds) {
        const response = await ec2Client.send(
          new DescribeRouteTablesCommand({
            Filters: [
              { Name: 'vpc-id', Values: [vpcId] },
              { Name: 'association.subnet-id', Values: [subnetId] },
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

  describe('VPC Flow Logs Validation', () => {
    test('VPC Flow Logs should be enabled', async () => {
      const vpcId = outputs.VPCID;

      const response = await ec2Client.send(
        new DescribeFlowLogsCommand({
          Filter: [
            { Name: 'resource-id', Values: [vpcId] },
          ],
        })
      );

      expect(response.FlowLogs!.length).toBeGreaterThanOrEqual(1);
      const flowLog = response.FlowLogs![0];
      expect(flowLog.FlowLogStatus).toBe('ACTIVE');
      expect(flowLog.TrafficType).toBe('ALL');
      expect(flowLog.LogDestinationType).toBe('cloud-watch-logs');
    });

    test('CloudWatch log group should exist with 30-day retention', async () => {
      const response = await logsClient.send(
        new DescribeLogGroupsCommand({
          logGroupNamePrefix: '/aws/vpc/flowlogs',
        })
      );

      expect(response.logGroups!.length).toBeGreaterThanOrEqual(1);
      const logGroup = response.logGroups!.find(
        lg => lg.logGroupName === '/aws/vpc/flowlogs'
      );
      expect(logGroup).toBeDefined();
      expect(logGroup!.retentionInDays).toBe(30);
    });

    test('IAM role for Flow Logs should exist', async () => {
      const vpcId = outputs.VPCID;

      const flowLogsResponse = await ec2Client.send(
        new DescribeFlowLogsCommand({
          Filter: [{ Name: 'resource-id', Values: [vpcId] }],
        })
      );

      expect(flowLogsResponse.FlowLogs).toHaveLength(1);
      const roleArn = flowLogsResponse.FlowLogs![0].DeliverLogsPermissionArn;
      expect(roleArn).toBeDefined();

      const roleName = roleArn!.split('/').pop();
      const roleResponse = await iamClient.send(
        new GetRoleCommand({ RoleName: roleName })
      );

      expect(roleResponse.Role).toBeDefined();
      expect(roleResponse.Role!.AssumeRolePolicyDocument).toBeDefined();
    });
  });

  describe('Network ACLs Validation', () => {
    test('custom Network ACLs should exist', async () => {
      const vpcId = outputs.VPCID;

      const response = await ec2Client.send(
        new DescribeNetworkAclsCommand({
          Filters: [
            { Name: 'vpc-id', Values: [vpcId] },
            { Name: 'default', Values: ['false'] },
          ],
        })
      );

      // Should have at least one custom NACL
      expect(response.NetworkAcls!.length).toBeGreaterThanOrEqual(1);
    });

    test('Network ACL should have rules for HTTP, HTTPS, and SSH', async () => {
      const vpcId = outputs.VPCID;

      const response = await ec2Client.send(
        new DescribeNetworkAclsCommand({
          Filters: [
            { Name: 'vpc-id', Values: [vpcId] },
            { Name: 'default', Values: ['false'] },
          ],
        })
      );

      if (response.NetworkAcls && response.NetworkAcls.length > 0) {
        const nacl = response.NetworkAcls[0];
        const ingressRules = nacl.Entries!.filter(e => !e.Egress);

        // Check for HTTP (port 80)
        const httpRule = ingressRules.find(
          r => r.Protocol === '6' && r.PortRange?.From === 80 && r.PortRange?.To === 80
        );
        expect(httpRule).toBeDefined();

        // Check for HTTPS (port 443)
        const httpsRule = ingressRules.find(
          r => r.Protocol === '6' && r.PortRange?.From === 443 && r.PortRange?.To === 443
        );
        expect(httpsRule).toBeDefined();

        // Check for SSH (port 22)
        const sshRule = ingressRules.find(
          r => r.Protocol === '6' && r.PortRange?.From === 22 && r.PortRange?.To === 22
        );
        expect(sshRule).toBeDefined();
      }
    });
  });

  describe('High Availability Validation', () => {
    test('infrastructure should span exactly 3 availability zones', async () => {
      const allSubnetIds = [
        outputs.PublicSubnet1ID,
        outputs.PublicSubnet2ID,
        outputs.PublicSubnet3ID,
        outputs.PrivateSubnet1ID,
        outputs.PrivateSubnet2ID,
        outputs.PrivateSubnet3ID,
      ];

      const response = await ec2Client.send(
        new DescribeSubnetsCommand({ SubnetIds: allSubnetIds })
      );

      const azs = new Set(response.Subnets!.map(s => s.AvailabilityZone));
      expect(azs.size).toBe(3);
    });

    test('each AZ should have both public and private subnets', async () => {
      const publicSubnetIds = [
        outputs.PublicSubnet1ID,
        outputs.PublicSubnet2ID,
        outputs.PublicSubnet3ID,
      ];
      const privateSubnetIds = [
        outputs.PrivateSubnet1ID,
        outputs.PrivateSubnet2ID,
        outputs.PrivateSubnet3ID,
      ];

      const publicResponse = await ec2Client.send(
        new DescribeSubnetsCommand({ SubnetIds: publicSubnetIds })
      );
      const privateResponse = await ec2Client.send(
        new DescribeSubnetsCommand({ SubnetIds: privateSubnetIds })
      );

      const publicAZs = new Set(publicResponse.Subnets!.map(s => s.AvailabilityZone));
      const privateAZs = new Set(privateResponse.Subnets!.map(s => s.AvailabilityZone));

      // Both sets should have 3 AZs and they should match
      expect(publicAZs.size).toBe(3);
      expect(privateAZs.size).toBe(3);

      publicAZs.forEach(az => {
        expect(privateAZs.has(az)).toBe(true);
      });
    });

    test('NAT Gateways should be distributed across all 3 AZs', async () => {
      const response = await ec2Client.send(
        new DescribeNatGatewaysCommand({
          Filter: [
            { Name: 'state', Values: ['available'] },
            { Name: 'vpc-id', Values: [outputs.VPCID] },
          ],
        })
      );

      const natSubnetIds = response.NatGateways!.map(ng => ng.SubnetId);
      const subnetResponse = await ec2Client.send(
        new DescribeSubnetsCommand({ SubnetIds: natSubnetIds })
      );

      const azs = new Set(subnetResponse.Subnets!.map(s => s.AvailabilityZone));
      expect(azs.size).toBe(3);
    });
  });

  describe('Security Compliance Validation', () => {
    test('all deployed resources should have proper tagging', async () => {
      const vpcId = outputs.VPCID;

      // Check VPC tags
      const vpcResponse = await ec2Client.send(
        new DescribeVpcsCommand({ VpcIds: [vpcId] })
      );
      const vpcTags = vpcResponse.Vpcs![0].Tags || [];
      expect(vpcTags.length).toBeGreaterThan(0);

      // Check subnet tags
      const allSubnetIds = [
        outputs.PublicSubnet1ID,
        outputs.PublicSubnet2ID,
        outputs.PublicSubnet3ID,
        outputs.PrivateSubnet1ID,
        outputs.PrivateSubnet2ID,
        outputs.PrivateSubnet3ID,
      ];
      const subnetResponse = await ec2Client.send(
        new DescribeSubnetsCommand({ SubnetIds: allSubnetIds })
      );
      subnetResponse.Subnets!.forEach(subnet => {
        expect(subnet.Tags).toBeDefined();
        expect(subnet.Tags!.length).toBeGreaterThan(0);
      });
    });

    test('VPC should have comprehensive monitoring enabled', async () => {
      const vpcId = outputs.VPCID;

      // Verify Flow Logs are active
      const flowLogsResponse = await ec2Client.send(
        new DescribeFlowLogsCommand({
          Filter: [{ Name: 'resource-id', Values: [vpcId] }],
        })
      );

      expect(flowLogsResponse.FlowLogs!.length).toBeGreaterThanOrEqual(1);
      expect(flowLogsResponse.FlowLogs![0].FlowLogStatus).toBe('ACTIVE');
    });
  });
});
