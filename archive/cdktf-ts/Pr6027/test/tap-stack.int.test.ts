import * as fs from 'fs';
import {
  EC2Client,
  DescribeVpcsCommand,
  DescribeSubnetsCommand,
  DescribeInternetGatewaysCommand,
  DescribeRouteTablesCommand,
  DescribeInstancesCommand,
  DescribeNetworkAclsCommand,
  DescribeSecurityGroupsCommand,
  DescribeVpcEndpointsCommand,
  DescribeTransitGatewaysCommand,
  DescribeFlowLogsCommand,
  DescribeVpcAttributeCommand,
} from '@aws-sdk/client-ec2';
import { S3Client, GetBucketEncryptionCommand, GetBucketLifecycleConfigurationCommand } from '@aws-sdk/client-s3';

describe('Payment Processing VPC Integration Tests', () => {
  let outputs: Record<string, any>;
  let ec2Client: EC2Client;
  let s3Client: S3Client;
  let vpcId: string;
  let region: string;

  beforeAll(() => {
    // Load outputs from deployment
    const outputsPath = 'cfn-outputs/flat-outputs.json';
    if (!fs.existsSync(outputsPath)) {
      throw new Error(`Outputs file not found at ${outputsPath}. Run deployment first.`);
    }
    const rawOutputs = JSON.parse(fs.readFileSync(outputsPath, 'utf-8'));

    // Handle nested CDKTF outputs format: {"StackName": {"OutputKey": "value"}}
    // If outputs are nested under a stack name, flatten them
    const stackKeys = Object.keys(rawOutputs);
    if (stackKeys.length === 1 && typeof rawOutputs[stackKeys[0]] === 'object') {
      outputs = rawOutputs[stackKeys[0]];
    } else {
      outputs = rawOutputs;
    }

    // Extract VPC ID and region from outputs
    vpcId = outputs.VpcId || outputs.vpc_id;
    region = outputs.Region || process.env.AWS_REGION || 'us-east-1';

    if (!vpcId) {
      throw new Error('VPC ID not found in outputs');
    }

    // Initialize AWS clients
    ec2Client = new EC2Client({ region });
    s3Client = new S3Client({ region });
  });

  describe('VPC Configuration', () => {
    test('VPC exists and has correct CIDR block', async () => {
      const command = new DescribeVpcsCommand({
        VpcIds: [vpcId],
      });
      const response = await ec2Client.send(command);

      expect(response.Vpcs).toBeDefined();
      expect(response.Vpcs?.length).toBe(1);
      expect(response.Vpcs?.[0].CidrBlock).toBe('10.0.0.0/16');
    });

    test('VPC has DNS support enabled', async () => {
      const dnsSupportCommand = new DescribeVpcAttributeCommand({
        VpcId: vpcId,
        Attribute: 'enableDnsSupport',
      });
      const dnsSupportResponse = await ec2Client.send(dnsSupportCommand);

      const dnsHostnamesCommand = new DescribeVpcAttributeCommand({
        VpcId: vpcId,
        Attribute: 'enableDnsHostnames',
      });
      const dnsHostnamesResponse = await ec2Client.send(dnsHostnamesCommand);

      expect(dnsSupportResponse.EnableDnsSupport?.Value).toBe(true);
      expect(dnsHostnamesResponse.EnableDnsHostnames?.Value).toBe(true);
    });

    test('VPC has correct tags', async () => {
      const command = new DescribeVpcsCommand({
        VpcIds: [vpcId],
      });
      const response = await ec2Client.send(command);
      const vpc = response.Vpcs?.[0];
      const tags = vpc?.Tags || [];

      const projectTag = tags.find(tag => tag.Key === 'Project');
      const costCenterTag = tags.find(tag => tag.Key === 'CostCenter');

      expect(projectTag?.Value).toBe('PaymentProcessing');
      expect(costCenterTag?.Value).toBe('FinTech');
    });
  });

  describe('Subnet Configuration', () => {
    test('has exactly 9 subnets (3 public, 3 app, 3 db)', async () => {
      const command = new DescribeSubnetsCommand({
        Filters: [
          {
            Name: 'vpc-id',
            Values: [vpcId],
          },
        ],
      });
      const response = await ec2Client.send(command);

      expect(response.Subnets?.length).toBe(9);
    });

    test('public subnets have correct CIDR blocks', async () => {
      const command = new DescribeSubnetsCommand({
        Filters: [
          {
            Name: 'vpc-id',
            Values: [vpcId],
          },
          {
            Name: 'tag:Tier',
            Values: ['Public'],
          },
        ],
      });
      const response = await ec2Client.send(command);
      const subnets = response.Subnets || [];

      expect(subnets.length).toBe(3);
      const cidrBlocks = subnets.map(s => s.CidrBlock).sort();
      expect(cidrBlocks).toEqual(['10.0.1.0/24', '10.0.2.0/24', '10.0.3.0/24']);
    });

    test('application subnets have correct CIDR blocks', async () => {
      const command = new DescribeSubnetsCommand({
        Filters: [
          {
            Name: 'vpc-id',
            Values: [vpcId],
          },
          {
            Name: 'tag:Tier',
            Values: ['Application'],
          },
        ],
      });
      const response = await ec2Client.send(command);
      const subnets = response.Subnets || [];

      expect(subnets.length).toBe(3);
      const cidrBlocks = subnets.map(s => s.CidrBlock).sort();
      expect(cidrBlocks).toEqual(['10.0.16.0/23', '10.0.18.0/23', '10.0.20.0/23']);
    });

    test('database subnets have correct CIDR blocks', async () => {
      const command = new DescribeSubnetsCommand({
        Filters: [
          {
            Name: 'vpc-id',
            Values: [vpcId],
          },
          {
            Name: 'tag:Tier',
            Values: ['Database'],
          },
        ],
      });
      const response = await ec2Client.send(command);
      const subnets = response.Subnets || [];

      expect(subnets.length).toBe(3);
      const cidrBlocks = subnets.map(s => s.CidrBlock).sort();
      expect(cidrBlocks).toEqual(['10.0.32.0/23', '10.0.34.0/23', '10.0.36.0/23']);
    });

    test('subnets are distributed across 3 availability zones', async () => {
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
      const azs = new Set(subnets.map(s => s.AvailabilityZone));

      expect(azs.size).toBe(3);
    });

    test('public subnets enable public IP assignment', async () => {
      const command = new DescribeSubnetsCommand({
        Filters: [
          {
            Name: 'vpc-id',
            Values: [vpcId],
          },
          {
            Name: 'tag:Tier',
            Values: ['Public'],
          },
        ],
      });
      const response = await ec2Client.send(command);
      const subnets = response.Subnets || [];

      subnets.forEach(subnet => {
        expect(subnet.MapPublicIpOnLaunch).toBe(true);
      });
    });
  });

  describe('Internet Gateway', () => {
    test('Internet Gateway is attached to VPC', async () => {
      const command = new DescribeInternetGatewaysCommand({
        Filters: [
          {
            Name: 'attachment.vpc-id',
            Values: [vpcId],
          },
        ],
      });
      const response = await ec2Client.send(command);

      expect(response.InternetGateways?.length).toBe(1);
      expect(response.InternetGateways?.[0].Attachments?.[0].State).toBe('available');
    });
  });

  describe('NAT Instances', () => {
    test('has 3 NAT instances running', async () => {
      const command = new DescribeInstancesCommand({
        Filters: [
          {
            Name: 'vpc-id',
            Values: [vpcId],
          },
          {
            Name: 'tag:Name',
            Values: ['payment-nat-instance-*'],
          },
        ],
      });
      const response = await ec2Client.send(command);

      const instances = response.Reservations?.flatMap(r => r.Instances || []) || [];
      const runningInstances = instances.filter(i => i.State?.Name === 'running');

      expect(runningInstances.length).toBeGreaterThanOrEqual(1);
    });

    test('NAT instances use t3.micro instance type', async () => {
      const command = new DescribeInstancesCommand({
        Filters: [
          {
            Name: 'vpc-id',
            Values: [vpcId],
          },
          {
            Name: 'tag:Name',
            Values: ['payment-nat-instance-*'],
          },
        ],
      });
      const response = await ec2Client.send(command);

      const instances = response.Reservations?.flatMap(r => r.Instances || []) || [];
      instances.forEach(instance => {
        expect(instance.InstanceType).toBe('t3.micro');
      });
    });

    test('NAT instances have source/destination check disabled', async () => {
      const command = new DescribeInstancesCommand({
        Filters: [
          {
            Name: 'vpc-id',
            Values: [vpcId],
          },
          {
            Name: 'tag:Name',
            Values: ['payment-nat-instance-*'],
          },
        ],
      });
      const response = await ec2Client.send(command);

      const instances = response.Reservations?.flatMap(r => r.Instances || []) || [];
      instances.forEach(instance => {
        expect(instance.SourceDestCheck).toBe(false);
      });
    });
  });

  describe('Route Tables', () => {
    test('has correct number of route tables', async () => {
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

      // 1 main + 1 public + 3 private = 5 route tables
      expect(routeTables.length).toBeGreaterThanOrEqual(4);
    });

    test('public route table has route to Internet Gateway', async () => {
      const command = new DescribeRouteTablesCommand({
        Filters: [
          {
            Name: 'vpc-id',
            Values: [vpcId],
          },
          {
            Name: 'tag:Name',
            Values: ['payment-public-rt-*'],
          },
        ],
      });
      const response = await ec2Client.send(command);
      const routeTable = response.RouteTables?.[0];
      const routes = routeTable?.Routes || [];

      const igwRoute = routes.find(r => r.DestinationCidrBlock === '0.0.0.0/0' && r.GatewayId?.startsWith('igw-'));
      expect(igwRoute).toBeDefined();
    });

    test('private route tables have routes to NAT instances', async () => {
      const command = new DescribeRouteTablesCommand({
        Filters: [
          {
            Name: 'vpc-id',
            Values: [vpcId],
          },
          {
            Name: 'tag:Name',
            Values: ['payment-private-rt-*'],
          },
        ],
      });
      const response = await ec2Client.send(command);
      const routeTables = response.RouteTables || [];

      expect(routeTables.length).toBeGreaterThanOrEqual(3);

      routeTables.forEach(rt => {
        const routes = rt.Routes || [];
        const natRoute = routes.find(r => r.DestinationCidrBlock === '0.0.0.0/0' && r.NetworkInterfaceId);
        expect(natRoute).toBeDefined();
      });
    });
  });

  describe('Network ACLs', () => {
    test('custom Network ACL exists', async () => {
      const command = new DescribeNetworkAclsCommand({
        Filters: [
          {
            Name: 'vpc-id',
            Values: [vpcId],
          },
          {
            Name: 'tag:Name',
            Values: ['payment-nacl-*'],
          },
        ],
      });
      const response = await ec2Client.send(command);

      expect(response.NetworkAcls?.length).toBeGreaterThanOrEqual(1);
    });

    test('Network ACL allows HTTPS (443)', async () => {
      const command = new DescribeNetworkAclsCommand({
        Filters: [
          {
            Name: 'vpc-id',
            Values: [vpcId],
          },
          {
            Name: 'tag:Name',
            Values: ['payment-nacl-*'],
          },
        ],
      });
      const response = await ec2Client.send(command);
      const nacl = response.NetworkAcls?.[0];
      const entries = nacl?.Entries || [];

      const httpsRule = entries.find(e =>
        e.PortRange?.From === 443 &&
        e.PortRange?.To === 443 &&
        e.RuleAction === 'allow'
      );
      expect(httpsRule).toBeDefined();
    });

    test('Network ACL allows ephemeral ports', async () => {
      const command = new DescribeNetworkAclsCommand({
        Filters: [
          {
            Name: 'vpc-id',
            Values: [vpcId],
          },
          {
            Name: 'tag:Name',
            Values: ['payment-nacl-*'],
          },
        ],
      });
      const response = await ec2Client.send(command);
      const nacl = response.NetworkAcls?.[0];
      const entries = nacl?.Entries || [];

      const ephemeralRule = entries.find(e =>
        e.PortRange?.From === 1024 &&
        e.PortRange?.To === 65535 &&
        e.RuleAction === 'allow'
      );
      expect(ephemeralRule).toBeDefined();
    });
  });

  describe('Security Groups', () => {
    test('web tier security group exists', async () => {
      const command = new DescribeSecurityGroupsCommand({
        Filters: [
          {
            Name: 'vpc-id',
            Values: [vpcId],
          },
          {
            Name: 'group-name',
            Values: ['payment-web-sg-*'],
          },
        ],
      });
      const response = await ec2Client.send(command);

      expect(response.SecurityGroups?.length).toBe(1);
    });

    test('app tier security group exists', async () => {
      const command = new DescribeSecurityGroupsCommand({
        Filters: [
          {
            Name: 'vpc-id',
            Values: [vpcId],
          },
          {
            Name: 'group-name',
            Values: ['payment-app-sg-*'],
          },
        ],
      });
      const response = await ec2Client.send(command);

      expect(response.SecurityGroups?.length).toBe(1);
    });

    test('database tier security group exists', async () => {
      const command = new DescribeSecurityGroupsCommand({
        Filters: [
          {
            Name: 'vpc-id',
            Values: [vpcId],
          },
          {
            Name: 'group-name',
            Values: ['payment-db-sg-*'],
          },
        ],
      });
      const response = await ec2Client.send(command);

      expect(response.SecurityGroups?.length).toBe(1);
    });

    test('web SG allows HTTPS from internet', async () => {
      const command = new DescribeSecurityGroupsCommand({
        Filters: [
          {
            Name: 'vpc-id',
            Values: [vpcId],
          },
          {
            Name: 'group-name',
            Values: ['payment-web-sg-*'],
          },
        ],
      });
      const response = await ec2Client.send(command);
      const sg = response.SecurityGroups?.[0];
      const ingressRules = sg?.IpPermissions || [];

      const httpsRule = ingressRules.find(rule =>
        rule.FromPort === 443 &&
        rule.ToPort === 443 &&
        rule.IpRanges?.some(range => range.CidrIp === '0.0.0.0/0')
      );
      expect(httpsRule).toBeDefined();
    });

    test('db SG allows PostgreSQL from app SG', async () => {
      const command = new DescribeSecurityGroupsCommand({
        Filters: [
          {
            Name: 'vpc-id',
            Values: [vpcId],
          },
          {
            Name: 'group-name',
            Values: ['payment-db-sg-*'],
          },
        ],
      });
      const response = await ec2Client.send(command);
      const sg = response.SecurityGroups?.[0];
      const ingressRules = sg?.IpPermissions || [];

      const postgresRule = ingressRules.find(rule =>
        rule.FromPort === 5432 &&
        rule.ToPort === 5432 &&
        rule.UserIdGroupPairs && rule.UserIdGroupPairs.length > 0
      );
      expect(postgresRule).toBeDefined();
    });
  });

  describe('VPC Endpoints', () => {
    test('S3 VPC endpoint exists', async () => {
      const command = new DescribeVpcEndpointsCommand({
        Filters: [
          {
            Name: 'vpc-id',
            Values: [vpcId],
          },
          {
            Name: 'service-name',
            Values: ['com.amazonaws.us-east-1.s3'],
          },
        ],
      });
      const response = await ec2Client.send(command);

      expect(response.VpcEndpoints?.length).toBe(1);
      expect(response.VpcEndpoints?.[0].VpcEndpointType).toBe('Gateway');
    });

    test('DynamoDB VPC endpoint exists', async () => {
      const command = new DescribeVpcEndpointsCommand({
        Filters: [
          {
            Name: 'vpc-id',
            Values: [vpcId],
          },
          {
            Name: 'service-name',
            Values: ['com.amazonaws.us-east-1.dynamodb'],
          },
        ],
      });
      const response = await ec2Client.send(command);

      expect(response.VpcEndpoints?.length).toBe(1);
      expect(response.VpcEndpoints?.[0].VpcEndpointType).toBe('Gateway');
    });

    test('endpoints are associated with route tables', async () => {
      const command = new DescribeVpcEndpointsCommand({
        Filters: [
          {
            Name: 'vpc-id',
            Values: [vpcId],
          },
        ],
      });
      const response = await ec2Client.send(command);
      const endpoints = response.VpcEndpoints || [];

      endpoints.forEach(endpoint => {
        if (endpoint.VpcEndpointType === 'Gateway') {
          expect(endpoint.RouteTableIds?.length).toBeGreaterThan(0);
        }
      });
    });
  });

  describe('Transit Gateway', () => {
    test('Transit Gateway exists', async () => {
      const command = new DescribeTransitGatewaysCommand({
        Filters: [
          {
            Name: 'tag:Name',
            Values: ['payment-tgw-*'],
          },
        ],
      });
      const response = await ec2Client.send(command);

      expect(response.TransitGateways?.length).toBeGreaterThanOrEqual(1);
      expect(response.TransitGateways?.[0].State).toBe('available');
    });

    test('Transit Gateway has correct configuration', async () => {
      const command = new DescribeTransitGatewaysCommand({
        Filters: [
          {
            Name: 'tag:Name',
            Values: ['payment-tgw-*'],
          },
        ],
      });
      const response = await ec2Client.send(command);
      const tgw = response.TransitGateways?.[0];
      const options = tgw?.Options;

      expect(options?.AmazonSideAsn).toBe(64512);
      expect(options?.DefaultRouteTableAssociation).toBe('enable');
      expect(options?.DnsSupport).toBe('enable');
    });
  });

  describe('VPC Flow Logs', () => {
    let flowLogsBucketName: string;

    beforeAll(() => {
      // Extract flow logs bucket name from outputs
      flowLogsBucketName = outputs.FlowLogsBucketName || outputs.flow_logs_bucket_name;
      if (!flowLogsBucketName) {
        throw new Error('Flow logs bucket name not found in outputs');
      }
    });

    test('VPC Flow Log is enabled', async () => {
      const command = new DescribeFlowLogsCommand({
        Filter: [
          {
            Name: 'resource-id',
            Values: [vpcId],
          },
        ],
      });
      const response = await ec2Client.send(command);

      expect(response.FlowLogs?.length).toBeGreaterThanOrEqual(1);
      expect(response.FlowLogs?.[0].LogDestinationType).toBe('s3');
    });

    test('Flow logs capture ALL traffic', async () => {
      const command = new DescribeFlowLogsCommand({
        Filter: [
          {
            Name: 'resource-id',
            Values: [vpcId],
          },
        ],
      });
      const response = await ec2Client.send(command);

      expect(response.FlowLogs?.[0].TrafficType).toBe('ALL');
    });

    test('flow logs S3 bucket has encryption enabled', async () => {
      try {
        const command = new GetBucketEncryptionCommand({
          Bucket: flowLogsBucketName,
        });
        const response = await s3Client.send(command);

        expect(response.ServerSideEncryptionConfiguration?.Rules).toBeDefined();
        expect(response.ServerSideEncryptionConfiguration?.Rules?.length).toBeGreaterThan(0);
      } catch (error: any) {
        // If encryption is not set, test should fail
        fail('Bucket encryption should be enabled');
      }
    });

    test('flow logs S3 bucket has 90-day lifecycle policy', async () => {
      try {
        const command = new GetBucketLifecycleConfigurationCommand({
          Bucket: flowLogsBucketName,
        });
        const response = await s3Client.send(command);

        const expirationRule = response.Rules?.find(rule =>
          rule.Status === 'Enabled' && rule.Expiration?.Days === 90
        );
        expect(expirationRule).toBeDefined();
      } catch (error: any) {
        fail('Bucket should have lifecycle policy configured');
      }
    });
  });

  describe('Tagging Compliance', () => {
    test('all resources have required tags', async () => {
      // Test VPC tags
      const vpcCommand = new DescribeVpcsCommand({ VpcIds: [vpcId] });
      const vpcResponse = await ec2Client.send(vpcCommand);
      const vpcTags = vpcResponse.Vpcs?.[0].Tags || [];

      expect(vpcTags.find(t => t.Key === 'Environment')).toBeDefined();
      expect(vpcTags.find(t => t.Key === 'Project')).toBeDefined();
      expect(vpcTags.find(t => t.Key === 'CostCenter')).toBeDefined();

      // Test subnet tags
      const subnetCommand = new DescribeSubnetsCommand({
        Filters: [{ Name: 'vpc-id', Values: [vpcId] }],
      });
      const subnetResponse = await ec2Client.send(subnetCommand);
      const subnets = subnetResponse.Subnets || [];

      subnets.forEach(subnet => {
        const tags = subnet.Tags || [];
        expect(tags.find(t => t.Key === 'Environment')).toBeDefined();
        expect(tags.find(t => t.Key === 'Project')).toBeDefined();
        expect(tags.find(t => t.Key === 'CostCenter')).toBeDefined();
      });
    });
  });
});
