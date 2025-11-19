/**
 * Integration Tests for VPC Infrastructure
 * Tests deployed AWS resources using actual AWS SDK calls
 */
import {
  CloudWatchLogsClient,
  DescribeLogGroupsCommand,
} from '@aws-sdk/client-cloudwatch-logs';
import {
  DescribeFlowLogsCommand,
  DescribeInstancesCommand,
  DescribeInternetGatewaysCommand,
  DescribeNetworkAclsCommand,
  DescribeRouteTablesCommand,
  DescribeSecurityGroupsCommand,
  DescribeSubnetsCommand,
  DescribeVpcEndpointsCommand,
  DescribeVpcsCommand,
  EC2Client,
} from '@aws-sdk/client-ec2';
import { IAMClient } from '@aws-sdk/client-iam';
import {
  GetBucketEncryptionCommand,
  GetBucketLifecycleConfigurationCommand,
  GetPublicAccessBlockCommand,
  HeadBucketCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import * as fs from 'fs';
import * as path from 'path';

describe('VPC Infrastructure Integration Tests', () => {
  let outputs: any;
  let ec2Client: EC2Client;
  let s3Client: S3Client;
  let logsClient: CloudWatchLogsClient;
  let iamClient: IAMClient;
  const region = 'us-east-1';

  beforeAll(() => {
    // Load deployment outputs
    const outputsPath = path.join(__dirname, '../cfn-outputs/flat-outputs.json');
    if (!fs.existsSync(outputsPath)) {
      throw new Error(
        `Deployment outputs not found at ${outputsPath}. Run deployment first.`
      );
    }
    outputs = JSON.parse(fs.readFileSync(outputsPath, 'utf-8'));

    // Parse stringified arrays back to actual arrays
    if (typeof outputs.publicSubnetIds === 'string') {
      outputs.publicSubnetIds = JSON.parse(outputs.publicSubnetIds);
    }
    if (typeof outputs.privateSubnetIds === 'string') {
      outputs.privateSubnetIds = JSON.parse(outputs.privateSubnetIds);
    }
    if (typeof outputs.databaseSubnetIds === 'string') {
      outputs.databaseSubnetIds = JSON.parse(outputs.databaseSubnetIds);
    }
    if (typeof outputs.natInstanceIds === 'string') {
      outputs.natInstanceIds = JSON.parse(outputs.natInstanceIds);
    }
    if (typeof outputs.natInstancePrivateIps === 'string') {
      outputs.natInstancePrivateIps = JSON.parse(outputs.natInstancePrivateIps);
    }

    // Initialize AWS SDK clients
    ec2Client = new EC2Client({ region });
    s3Client = new S3Client({ region });
    logsClient = new CloudWatchLogsClient({ region });
    iamClient = new IAMClient({ region });
  });

  afterAll(() => {
    // Cleanup clients
    ec2Client.destroy();
    s3Client.destroy();
    logsClient.destroy();
    iamClient.destroy();
  });

  describe('VPC Validation', () => {
    it('should have deployed VPC with correct configuration', async () => {
      const response = await ec2Client.send(
        new DescribeVpcsCommand({
          VpcIds: [outputs.vpcId],
        })
      );

      expect(response.Vpcs).toHaveLength(1);
      const vpc = response.Vpcs![0];

      expect(vpc.VpcId).toBe(outputs.vpcId);
      expect(vpc.CidrBlock).toBe('10.0.0.0/16');
      expect(vpc.State).toBe('available');
      // DNS attributes are returned in DescribeVpcAttribute, not DescribeVpcs
      expect(vpc).toBeDefined();
    });
  });

  describe('Subnet Validation', () => {
    it('should have 9 subnets total across 3 AZs', async () => {
      const allSubnetIds = [
        ...outputs.publicSubnetIds,
        ...outputs.privateSubnetIds,
        ...outputs.databaseSubnetIds,
      ];

      const response = await ec2Client.send(
        new DescribeSubnetsCommand({
          SubnetIds: allSubnetIds,
        })
      );

      expect(response.Subnets).toHaveLength(9);

      // Check availability zones
      const azs = response.Subnets!.map(s => s.AvailabilityZone);
      const uniqueAzs = new Set(azs);
      expect(uniqueAzs.size).toBeGreaterThanOrEqual(3);
    });

    it('should have public subnets with correct CIDR blocks', async () => {
      const response = await ec2Client.send(
        new DescribeSubnetsCommand({
          SubnetIds: outputs.publicSubnetIds,
        })
      );

      const cidrBlocks = response.Subnets!.map(s => s.CidrBlock).sort();
      expect(cidrBlocks).toEqual(['10.0.1.0/24', '10.0.2.0/24', '10.0.3.0/24']);
    });

    it('should have private subnets with correct CIDR blocks', async () => {
      const response = await ec2Client.send(
        new DescribeSubnetsCommand({
          SubnetIds: outputs.privateSubnetIds,
        })
      );

      const cidrBlocks = response.Subnets!.map(s => s.CidrBlock).sort();
      expect(cidrBlocks).toEqual(['10.0.10.0/23', '10.0.12.0/23', '10.0.14.0/23']);
    });

    it('should have database subnets with correct CIDR blocks', async () => {
      const response = await ec2Client.send(
        new DescribeSubnetsCommand({
          SubnetIds: outputs.databaseSubnetIds,
        })
      );

      const cidrBlocks = response.Subnets!.map(s => s.CidrBlock).sort();
      expect(cidrBlocks).toEqual(['10.0.20.0/24', '10.0.21.0/24', '10.0.22.0/24']);
    });

    it('should have public subnets configured for auto-assign public IP', async () => {
      const response = await ec2Client.send(
        new DescribeSubnetsCommand({
          SubnetIds: outputs.publicSubnetIds,
        })
      );

      response.Subnets!.forEach(subnet => {
        expect(subnet.MapPublicIpOnLaunch).toBe(true);
      });
    });
  });

  describe('Internet Gateway Validation', () => {
    it('should have internet gateway attached to VPC', async () => {
      const response = await ec2Client.send(
        new DescribeInternetGatewaysCommand({
          InternetGatewayIds: [outputs.internetGatewayId],
        })
      );

      expect(response.InternetGateways).toHaveLength(1);
      const igw = response.InternetGateways![0];

      expect(igw.Attachments).toHaveLength(1);
      expect(igw.Attachments![0].VpcId).toBe(outputs.vpcId);
      expect(igw.Attachments![0].State).toBe('available');
    });
  });

  describe('NAT Instance Validation', () => {
    it('should have 3 running NAT instances', async () => {
      const response = await ec2Client.send(
        new DescribeInstancesCommand({
          InstanceIds: outputs.natInstanceIds,
        })
      );

      const instances = response.Reservations!.flatMap(r => r.Instances || []);
      expect(instances).toHaveLength(3);

      instances.forEach(instance => {
        expect(instance.State?.Name).toBe('running');
        expect(instance.InstanceType).toBe('t3.micro');
        expect(instance.SourceDestCheck).toBe(false);
      });
    });

    it('should have NAT instances in public subnets', async () => {
      const response = await ec2Client.send(
        new DescribeInstancesCommand({
          InstanceIds: outputs.natInstanceIds,
        })
      );

      const instances = response.Reservations!.flatMap(r => r.Instances || []);
      const subnetIds = instances.map(i => i.SubnetId);

      subnetIds.forEach(subnetId => {
        expect(outputs.publicSubnetIds).toContain(subnetId);
      });
    });
  });

  describe('Security Group Validation', () => {
    it('should have web security group with correct ingress rules', async () => {
      const response = await ec2Client.send(
        new DescribeSecurityGroupsCommand({
          GroupIds: [outputs.webSecurityGroupId],
        })
      );

      const sg = response.SecurityGroups![0];
      expect(sg.GroupName).toContain('web-sg');

      const ingressRules = sg.IpPermissions || [];
      expect(ingressRules.length).toBeGreaterThanOrEqual(2);

      // Check for HTTP rule
      const httpRule = ingressRules.find(r => r.FromPort === 80 && r.ToPort === 80);
      expect(httpRule).toBeDefined();
      expect(httpRule?.IpProtocol).toBe('tcp');

      // Check for HTTPS rule
      const httpsRule = ingressRules.find(r => r.FromPort === 443 && r.ToPort === 443);
      expect(httpsRule).toBeDefined();
      expect(httpsRule?.IpProtocol).toBe('tcp');
    });

    it('should have app security group with correct ingress rules', async () => {
      const response = await ec2Client.send(
        new DescribeSecurityGroupsCommand({
          GroupIds: [outputs.appSecurityGroupId],
        })
      );

      const sg = response.SecurityGroups![0];
      expect(sg.GroupName).toContain('app-sg');

      const ingressRules = sg.IpPermissions || [];
      expect(ingressRules.length).toBeGreaterThanOrEqual(1);

      // Check for port 8080 rule from web tier
      const appRule = ingressRules.find(r => r.FromPort === 8080 && r.ToPort === 8080);
      expect(appRule).toBeDefined();
      expect(appRule?.IpProtocol).toBe('tcp');
      expect(appRule?.UserIdGroupPairs).toBeDefined();
    });

    it('should have database security group with correct ingress rules', async () => {
      const response = await ec2Client.send(
        new DescribeSecurityGroupsCommand({
          GroupIds: [outputs.databaseSecurityGroupId],
        })
      );

      const sg = response.SecurityGroups![0];
      expect(sg.GroupName).toContain('database-sg');

      const ingressRules = sg.IpPermissions || [];
      expect(ingressRules.length).toBeGreaterThanOrEqual(1);

      // Check for port 5432 rule from app tier
      const dbRule = ingressRules.find(r => r.FromPort === 5432 && r.ToPort === 5432);
      expect(dbRule).toBeDefined();
      expect(dbRule?.IpProtocol).toBe('tcp');
      expect(dbRule?.UserIdGroupPairs).toBeDefined();
    });

    it('should have security groups in correct VPC', async () => {
      const response = await ec2Client.send(
        new DescribeSecurityGroupsCommand({
          GroupIds: [
            outputs.webSecurityGroupId,
            outputs.appSecurityGroupId,
            outputs.databaseSecurityGroupId,
          ],
        })
      );

      response.SecurityGroups!.forEach(sg => {
        expect(sg.VpcId).toBe(outputs.vpcId);
      });
    });
  });

  describe('Route Table Validation', () => {
    it('should have route tables for all subnet tiers', async () => {
      const response = await ec2Client.send(
        new DescribeRouteTablesCommand({
          Filters: [
            {
              Name: 'vpc-id',
              Values: [outputs.vpcId],
            },
          ],
        })
      );

      // Should have multiple route tables: 1 public, 3 private, 3 database
      expect(response.RouteTables!.length).toBeGreaterThanOrEqual(7);
    });

    it('should have public route table with internet gateway route', async () => {
      const response = await ec2Client.send(
        new DescribeRouteTablesCommand({
          Filters: [
            {
              Name: 'vpc-id',
              Values: [outputs.vpcId],
            },
            {
              Name: 'association.subnet-id',
              Values: [outputs.publicSubnetIds[0]],
            },
          ],
        })
      );

      expect(response.RouteTables).toBeDefined();
      expect(response.RouteTables!.length).toBeGreaterThan(0);

      const routeTable = response.RouteTables![0];
      const routes = routeTable.Routes || [];

      // Find route to internet gateway
      const igwRoute = routes.find(r => r.GatewayId === outputs.internetGatewayId);
      expect(igwRoute).toBeDefined();
      expect(igwRoute?.DestinationCidrBlock).toBe('0.0.0.0/0');
    });

    it('should have private route tables with NAT instance routes', async () => {
      const response = await ec2Client.send(
        new DescribeRouteTablesCommand({
          Filters: [
            {
              Name: 'vpc-id',
              Values: [outputs.vpcId],
            },
            {
              Name: 'association.subnet-id',
              Values: [outputs.privateSubnetIds[0]],
            },
          ],
        })
      );

      expect(response.RouteTables).toBeDefined();
      expect(response.RouteTables!.length).toBeGreaterThan(0);

      const routeTable = response.RouteTables![0];
      const routes = routeTable.Routes || [];

      // Find route to NAT instance
      const natRoute = routes.find(r => r.NetworkInterfaceId);
      expect(natRoute).toBeDefined();
      expect(natRoute?.DestinationCidrBlock).toBe('0.0.0.0/0');
    });

    it('should have database route tables without internet routes', async () => {
      const response = await ec2Client.send(
        new DescribeRouteTablesCommand({
          Filters: [
            {
              Name: 'vpc-id',
              Values: [outputs.vpcId],
            },
            {
              Name: 'association.subnet-id',
              Values: [outputs.databaseSubnetIds[0]],
            },
          ],
        })
      );

      expect(response.RouteTables).toBeDefined();
      expect(response.RouteTables!.length).toBeGreaterThan(0);

      const routeTable = response.RouteTables![0];
      const routes = routeTable.Routes || [];

      // Database route table should only have local routes
      routes.forEach(route => {
        if (route.DestinationCidrBlock !== '10.0.0.0/16') {
          // Should not have any 0.0.0.0/0 routes
          expect(route.DestinationCidrBlock).not.toBe('0.0.0.0/0');
        }
      });
    });
  });

  describe('Network ACL Validation', () => {
    it('should have network ACL for public subnets', async () => {
      const response = await ec2Client.send(
        new DescribeNetworkAclsCommand({
          Filters: [
            {
              Name: 'vpc-id',
              Values: [outputs.vpcId],
            },
          ],
        })
      );

      expect(response.NetworkAcls).toBeDefined();
      expect(response.NetworkAcls!.length).toBeGreaterThan(0);

      // Find a non-default NACL with custom rules (not the default NACL that comes with VPC)
      const customNacls = response.NetworkAcls!.filter(nacl => !nacl.IsDefault);
      expect(customNacls.length).toBeGreaterThan(0);

      const nacl = customNacls[0];
      const entries = nacl.Entries || [];

      // Check for ephemeral port rules (32768-65535)
      const ephemeralRule = entries.find(
        e => e.PortRange?.From === 32768 && e.PortRange?.To === 65535
      );
      expect(ephemeralRule).toBeDefined();
    });
  });

  describe('S3 Bucket Validation', () => {
    it('should have flow logs S3 bucket', async () => {
      const response = await s3Client.send(
        new HeadBucketCommand({
          Bucket: outputs.flowLogsBucketName,
        })
      );

      expect(response.$metadata.httpStatusCode).toBe(200);
    });

    it('should have encryption enabled on flow logs bucket', async () => {
      const response = await s3Client.send(
        new GetBucketEncryptionCommand({
          Bucket: outputs.flowLogsBucketName,
        })
      );

      expect(response.ServerSideEncryptionConfiguration).toBeDefined();
      const rule = response.ServerSideEncryptionConfiguration!.Rules![0];
      expect(rule.ApplyServerSideEncryptionByDefault?.SSEAlgorithm).toBe('AES256');
    });

    it('should have lifecycle policy on flow logs bucket', async () => {
      const response = await s3Client.send(
        new GetBucketLifecycleConfigurationCommand({
          Bucket: outputs.flowLogsBucketName,
        })
      );

      expect(response.Rules).toBeDefined();
      const expirationRule = response.Rules!.find(r => r.Expiration?.Days === 7);
      expect(expirationRule).toBeDefined();
    });

    it('should block public access on flow logs bucket', async () => {
      const response = await s3Client.send(
        new GetPublicAccessBlockCommand({
          Bucket: outputs.flowLogsBucketName,
        })
      );

      expect(response.PublicAccessBlockConfiguration?.BlockPublicAcls).toBe(true);
      expect(response.PublicAccessBlockConfiguration?.BlockPublicPolicy).toBe(true);
      expect(response.PublicAccessBlockConfiguration?.IgnorePublicAcls).toBe(true);
      expect(response.PublicAccessBlockConfiguration?.RestrictPublicBuckets).toBe(true);
    });
  });

  describe('CloudWatch Logs Validation', () => {
    it('should have flow logs log group', async () => {
      const response = await logsClient.send(
        new DescribeLogGroupsCommand({
          logGroupNamePrefix: outputs.flowLogsLogGroupName,
        })
      );

      expect(response.logGroups).toBeDefined();
      expect(response.logGroups!.length).toBeGreaterThanOrEqual(1);

      const logGroup = response.logGroups!.find(
        lg => lg.logGroupName === outputs.flowLogsLogGroupName
      );
      expect(logGroup).toBeDefined();
      expect(logGroup?.retentionInDays).toBe(7);
    });
  });

  describe('VPC Flow Logs Validation', () => {
    it('should have VPC flow logs enabled', async () => {
      const response = await ec2Client.send(
        new DescribeFlowLogsCommand({
          Filters: [
            {
              Name: 'resource-id',
              Values: [outputs.vpcId],
            },
          ],
        })
      );

      expect(response.FlowLogs).toBeDefined();
      expect(response.FlowLogs!.length).toBeGreaterThanOrEqual(1);

      // Should have flow logs to both S3 and CloudWatch
      const s3FlowLog = response.FlowLogs!.find(fl => fl.LogDestinationType === 's3');
      const cwFlowLog = response.FlowLogs!.find(
        fl => fl.LogDestinationType === 'cloud-watch-logs'
      );

      expect(s3FlowLog).toBeDefined();
      expect(cwFlowLog).toBeDefined();

      // Verify flow logs are active
      response.FlowLogs!.forEach(flowLog => {
        expect(flowLog.FlowLogStatus).toBe('ACTIVE');
        expect(flowLog.TrafficType).toBe('ALL');
      });
    });
  });

  describe('S3 VPC Endpoint Validation', () => {
    it('should have S3 VPC endpoint', async () => {
      const response = await ec2Client.send(
        new DescribeVpcEndpointsCommand({
          VpcEndpointIds: [outputs.s3EndpointId],
        })
      );

      expect(response.VpcEndpoints).toHaveLength(1);
      const endpoint = response.VpcEndpoints![0];

      expect(endpoint.VpcId).toBe(outputs.vpcId);
      expect(endpoint.ServiceName).toContain('s3');
      expect(endpoint.VpcEndpointType).toBe('Gateway');
      expect(endpoint.State).toBe('available');
    });

    it('should have S3 endpoint associated with private route tables', async () => {
      const response = await ec2Client.send(
        new DescribeVpcEndpointsCommand({
          VpcEndpointIds: [outputs.s3EndpointId],
        })
      );

      const endpoint = response.VpcEndpoints![0];
      expect(endpoint.RouteTableIds).toBeDefined();
      expect(endpoint.RouteTableIds!.length).toBeGreaterThanOrEqual(3);
    });
  });

});
