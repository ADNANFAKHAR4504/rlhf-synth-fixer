import {
  DescribeNatGatewaysCommand,
  DescribeRouteTablesCommand,
  DescribeSecurityGroupsCommand,
  DescribeSubnetsCommand,
  DescribeTransitGatewayAttachmentsCommand,
  DescribeTransitGatewayRouteTablesCommand,
  DescribeTransitGatewaysCommand,
  DescribeVpcEndpointsCommand,
  DescribeVpcsCommand,
  EC2Client,
  GetTransitGatewayRouteTablePropagationsCommand,
} from '@aws-sdk/client-ec2';
import {
  GetBucketEncryptionCommand,
  GetPublicAccessBlockCommand,
  HeadBucketCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import fs from 'fs';

// Load deployment outputs - try cdk-outputs first (CI), fall back to cfn-outputs (local)
const outputsPath = fs.existsSync('cdk-outputs/flat-outputs.json')
  ? 'cdk-outputs/flat-outputs.json'
  : 'cfn-outputs/flat-outputs.json';
const outputs = JSON.parse(fs.readFileSync(outputsPath, 'utf8'));

// Use environment region (us-east-1 for LocalStack) or default to us-east-2 for AWS
const region = process.env.AWS_REGION || 'us-east-2';
const ec2Client = new EC2Client({ region });
const s3Client = new S3Client({ region });

describe('Hub-and-Spoke Network Architecture Integration Tests', () => {
  describe('VPC Resources', () => {
    test('Hub VPC should exist and have correct CIDR', async () => {
      const command = new DescribeVpcsCommand({
        VpcIds: [outputs.HubVpcId],
      });
      const response = await ec2Client.send(command);

      expect(response.Vpcs).toHaveLength(1);
      expect(response.Vpcs![0].CidrBlock).toBe('10.0.0.0/16');
      expect(response.Vpcs![0].State).toBe('available');
    });

    test('Spoke 1 VPC should exist and have correct CIDR', async () => {
      const command = new DescribeVpcsCommand({
        VpcIds: [outputs.Spoke1VpcId],
      });
      const response = await ec2Client.send(command);

      expect(response.Vpcs).toHaveLength(1);
      expect(response.Vpcs![0].CidrBlock).toBe('10.1.0.0/16');
      expect(response.Vpcs![0].State).toBe('available');
    });

    test('Spoke 2 VPC should exist and have correct CIDR', async () => {
      const command = new DescribeVpcsCommand({
        VpcIds: [outputs.Spoke2VpcId],
      });
      const response = await ec2Client.send(command);

      expect(response.Vpcs).toHaveLength(1);
      expect(response.Vpcs![0].CidrBlock).toBe('10.2.0.0/16');
      expect(response.Vpcs![0].State).toBe('available');
    });
  });

  describe('Subnet Resources', () => {
    test('Hub should have 3 public subnets in different AZs', async () => {
      const command = new DescribeSubnetsCommand({
        SubnetIds: [
          outputs.HubPublicSubnet1Id,
          outputs.HubPublicSubnet2Id,
          outputs.HubPublicSubnet3Id,
        ],
      });
      const response = await ec2Client.send(command);

      expect(response.Subnets).toHaveLength(3);

      const azs = response.Subnets!.map(s => s.AvailabilityZone);
      expect(new Set(azs).size).toBe(3); // All different AZs

      response.Subnets!.forEach(subnet => {
        expect(subnet.MapPublicIpOnLaunch).toBe(true);
        expect(subnet.State).toBe('available');
      });
    });

    test('Spoke 1 should have 3 private subnets in different AZs', async () => {
      const command = new DescribeSubnetsCommand({
        SubnetIds: [
          outputs.Spoke1PrivateSubnet1Id,
          outputs.Spoke1PrivateSubnet2Id,
          outputs.Spoke1PrivateSubnet3Id,
        ],
      });
      const response = await ec2Client.send(command);

      expect(response.Subnets).toHaveLength(3);

      const azs = response.Subnets!.map(s => s.AvailabilityZone);
      expect(new Set(azs).size).toBe(3);

      response.Subnets!.forEach(subnet => {
        expect(subnet.MapPublicIpOnLaunch).toBe(false);
        expect(subnet.State).toBe('available');
      });
    });

    test('Spoke 2 should have 3 private subnets in different AZs', async () => {
      const command = new DescribeSubnetsCommand({
        SubnetIds: [
          outputs.Spoke2PrivateSubnet1Id,
          outputs.Spoke2PrivateSubnet2Id,
          outputs.Spoke2PrivateSubnet3Id,
        ],
      });
      const response = await ec2Client.send(command);

      expect(response.Subnets).toHaveLength(3);

      const azs = response.Subnets!.map(s => s.AvailabilityZone);
      expect(new Set(azs).size).toBe(3);
    });
  });

  describe('Transit Gateway', () => {
    test('Transit Gateway should be available', async () => {
      const command = new DescribeTransitGatewaysCommand({
        TransitGatewayIds: [outputs.TransitGatewayId],
      });
      const response = await ec2Client.send(command);

      expect(response.TransitGateways).toHaveLength(1);
      expect(response.TransitGateways![0].State).toBe('available');

      const options = response.TransitGateways![0].Options;
      expect(options?.DnsSupport).toBe('enable');
      expect(options?.DefaultRouteTableAssociation).toBe('disable');
      expect(options?.DefaultRouteTablePropagation).toBe('disable');
    });

    test('All three VPCs should be attached to Transit Gateway', async () => {
      const command = new DescribeTransitGatewayAttachmentsCommand({
        Filters: [
          {
            Name: 'transit-gateway-id',
            Values: [outputs.TransitGatewayId],
          },
        ],
      });
      const response = await ec2Client.send(command);

      const attachments = response.TransitGatewayAttachments!.filter(
        a => a.State === 'available'
      );

      expect(attachments).toHaveLength(3);

      const vpcIds = attachments.map(a => a.ResourceId).sort();
      expect(vpcIds).toContain(outputs.HubVpcId);
      expect(vpcIds).toContain(outputs.Spoke1VpcId);
      expect(vpcIds).toContain(outputs.Spoke2VpcId);
    });

    test('Transit Gateway should have 2 route tables (Hub and Spoke)', async () => {
      const command = new DescribeTransitGatewayRouteTablesCommand({
        Filters: [
          {
            Name: 'transit-gateway-id',
            Values: [outputs.TransitGatewayId],
          },
        ],
      });
      const response = await ec2Client.send(command);

      expect(response.TransitGatewayRouteTables).toHaveLength(2);

      const routeTableIds = response.TransitGatewayRouteTables!.map(rt => rt.TransitGatewayRouteTableId).sort();
      expect(routeTableIds).toContain(outputs.HubTgwRouteTableId);
      expect(routeTableIds).toContain(outputs.SpokeTgwRouteTableId);
    });

    test('Hub route table should have propagations from both spokes', async () => {
      const command = new GetTransitGatewayRouteTablePropagationsCommand({
        TransitGatewayRouteTableId: outputs.HubTgwRouteTableId,
      });
      const response = await ec2Client.send(command);

      expect(response.TransitGatewayRouteTablePropagations!.length).toBeGreaterThanOrEqual(2);

      const propagatedVpcs = response.TransitGatewayRouteTablePropagations!
        .filter(p => p.State === 'enabled')
        .map(p => p.ResourceId)
        .sort();

      expect(propagatedVpcs).toContain(outputs.Spoke1VpcId);
      expect(propagatedVpcs).toContain(outputs.Spoke2VpcId);
    });

    test('Spoke route table should only have propagation from hub (not other spokes)', async () => {
      const command = new GetTransitGatewayRouteTablePropagationsCommand({
        TransitGatewayRouteTableId: outputs.SpokeTgwRouteTableId,
      });
      const response = await ec2Client.send(command);

      const propagations = response.TransitGatewayRouteTablePropagations!.filter(
        p => p.State === 'enabled'
      );

      expect(propagations).toHaveLength(1);
      expect(propagations[0].ResourceId).toBe(outputs.HubVpcId);

      // Ensure spokes are NOT propagated
      const propagatedVpcs = propagations.map(p => p.ResourceId);
      expect(propagatedVpcs).not.toContain(outputs.Spoke1VpcId);
      expect(propagatedVpcs).not.toContain(outputs.Spoke2VpcId);
    });
  });

  describe('NAT Gateways', () => {
    test('Hub should have 3 NAT Gateways in available state', async () => {
      const command = new DescribeNatGatewaysCommand({
        NatGatewayIds: [
          outputs.HubNatGateway1Id,
          outputs.HubNatGateway2Id,
          outputs.HubNatGateway3Id,
        ],
      });
      const response = await ec2Client.send(command);

      expect(response.NatGateways).toHaveLength(3);

      response.NatGateways!.forEach(nat => {
        expect(nat.State).toBe('available');
        expect(nat.VpcId).toBe(outputs.HubVpcId);
      });

      // Verify they're in different subnets (and thus different AZs)
      const subnetIds = response.NatGateways!.map(n => n.SubnetId).sort();
      expect(new Set(subnetIds).size).toBe(3);
    });
  });

  describe('VPC Endpoints', () => {
    test('Hub VPC should have SSM, SSM Messages, and EC2 Messages endpoints', async () => {
      const command = new DescribeVpcEndpointsCommand({
        Filters: [
          {
            Name: 'vpc-id',
            Values: [outputs.HubVpcId],
          },
        ],
      });
      const response = await ec2Client.send(command);

      const endpoints = response.VpcEndpoints!.filter(e => e.State === 'available');
      expect(endpoints.length).toBeGreaterThanOrEqual(3);

      const serviceNames = endpoints.map(e => e.ServiceName);
      expect(serviceNames.some(s => s?.includes('ssm'))).toBe(true);
      expect(serviceNames.some(s => s?.includes('ssmmessages'))).toBe(true);
      expect(serviceNames.some(s => s?.includes('ec2messages'))).toBe(true);

      endpoints.forEach(endpoint => {
        expect(endpoint.VpcEndpointType).toBe('Interface');
        expect(endpoint.PrivateDnsEnabled).toBe(true);
      });
    });

    test('Spoke 1 VPC should have SSM, SSM Messages, and EC2 Messages endpoints', async () => {
      const command = new DescribeVpcEndpointsCommand({
        Filters: [
          {
            Name: 'vpc-id',
            Values: [outputs.Spoke1VpcId],
          },
        ],
      });
      const response = await ec2Client.send(command);

      const endpoints = response.VpcEndpoints!.filter(e => e.State === 'available');
      expect(endpoints.length).toBeGreaterThanOrEqual(3);

      const serviceNames = endpoints.map(e => e.ServiceName);
      expect(serviceNames.some(s => s?.includes('ssm'))).toBe(true);
      expect(serviceNames.some(s => s?.includes('ssmmessages'))).toBe(true);
      expect(serviceNames.some(s => s?.includes('ec2messages'))).toBe(true);
    });

    test('Spoke 2 VPC should have SSM, SSM Messages, and EC2 Messages endpoints', async () => {
      const command = new DescribeVpcEndpointsCommand({
        Filters: [
          {
            Name: 'vpc-id',
            Values: [outputs.Spoke2VpcId],
          },
        ],
      });
      const response = await ec2Client.send(command);

      const endpoints = response.VpcEndpoints!.filter(e => e.State === 'available');
      expect(endpoints.length).toBeGreaterThanOrEqual(3);

      const serviceNames = endpoints.map(e => e.ServiceName);
      expect(serviceNames.some(s => s?.includes('ssm'))).toBe(true);
      expect(serviceNames.some(s => s?.includes('ssmmessages'))).toBe(true);
      expect(serviceNames.some(s => s?.includes('ec2messages'))).toBe(true);
    });
  });

  describe('Security Groups', () => {
    test('HTTPS security group should allow port 443 from all VPCs', async () => {
      const command = new DescribeSecurityGroupsCommand({
        GroupIds: [outputs.HttpsSecurityGroupId],
      });
      const response = await ec2Client.send(command);

      expect(response.SecurityGroups).toHaveLength(1);
      const sg = response.SecurityGroups![0];

      const httpsIngress = sg.IpPermissions!.find(
        rule => rule.FromPort === 443 && rule.ToPort === 443
      );
      expect(httpsIngress).toBeDefined();
      expect(httpsIngress!.IpRanges![0].CidrIp).toBe('10.0.0.0/8');
    });

    test('SSH from Hub security group should only allow from Hub VPC CIDR', async () => {
      const command = new DescribeSecurityGroupsCommand({
        GroupIds: [outputs.SshFromHubSecurityGroupId],
      });
      const response = await ec2Client.send(command);

      expect(response.SecurityGroups).toHaveLength(1);
      const sg = response.SecurityGroups![0];

      const sshIngress = sg.IpPermissions!.find(
        rule => rule.FromPort === 22 && rule.ToPort === 22
      );
      expect(sshIngress).toBeDefined();
      expect(sshIngress!.IpRanges![0].CidrIp).toBe('10.0.0.0/16');
    });
  });

  describe('VPC Flow Logs', () => {
    test('Flow Logs S3 bucket should exist and be encrypted', async () => {
      const headCommand = new HeadBucketCommand({
        Bucket: outputs.FlowLogsBucketName,
      });

      await expect(s3Client.send(headCommand)).resolves.not.toThrow();

      const encryptionCommand = new GetBucketEncryptionCommand({
        Bucket: outputs.FlowLogsBucketName,
      });
      const encryptionResponse = await s3Client.send(encryptionCommand);

      expect(encryptionResponse.ServerSideEncryptionConfiguration).toBeDefined();
      const rule = encryptionResponse.ServerSideEncryptionConfiguration!.Rules![0];
      expect(rule.ApplyServerSideEncryptionByDefault?.SSEAlgorithm).toBe('AES256');
    });

    test('Flow Logs S3 bucket should block public access', async () => {
      const command = new GetPublicAccessBlockCommand({
        Bucket: outputs.FlowLogsBucketName,
      });
      const response = await s3Client.send(command);

      expect(response.PublicAccessBlockConfiguration?.BlockPublicAcls).toBe(true);
      expect(response.PublicAccessBlockConfiguration?.BlockPublicPolicy).toBe(true);
      expect(response.PublicAccessBlockConfiguration?.IgnorePublicAcls).toBe(true);
      expect(response.PublicAccessBlockConfiguration?.RestrictPublicBuckets).toBe(true);
    });
  });

  describe('Route Tables', () => {
    test('Hub public route table should have route to Internet Gateway', async () => {
      const command = new DescribeRouteTablesCommand({
        RouteTableIds: [outputs.HubPublicRouteTableId],
      });
      const response = await ec2Client.send(command);

      expect(response.RouteTables).toHaveLength(1);
      const routeTable = response.RouteTables![0];

      const igwRoute = routeTable.Routes!.find(
        r => r.DestinationCidrBlock === '0.0.0.0/0' && r.GatewayId?.startsWith('igw-')
      );
      expect(igwRoute).toBeDefined();
    });

    test('Hub route table should have route to Transit Gateway for spoke networks', async () => {
      const command = new DescribeRouteTablesCommand({
        RouteTableIds: [outputs.HubPublicRouteTableId],
      });
      const response = await ec2Client.send(command);

      const routeTable = response.RouteTables![0];

      const tgwRoute = routeTable.Routes!.find(
        r => r.DestinationCidrBlock === '10.0.0.0/8' && r.TransitGatewayId
      );
      expect(tgwRoute).toBeDefined();
      expect(tgwRoute!.TransitGatewayId).toBe(outputs.TransitGatewayId);
    });

    test('Spoke 1 private route tables should have default route to Transit Gateway', async () => {
      const command = new DescribeRouteTablesCommand({
        RouteTableIds: [outputs.Spoke1PrivateRouteTable1Id],
      });
      const response = await ec2Client.send(command);

      const routeTable = response.RouteTables![0];

      const defaultRoute = routeTable.Routes!.find(
        r => r.DestinationCidrBlock === '0.0.0.0/0'
      );
      expect(defaultRoute).toBeDefined();
      expect(defaultRoute!.TransitGatewayId).toBe(outputs.TransitGatewayId);
    });

    test('Spoke 2 private route tables should have default route to Transit Gateway', async () => {
      const command = new DescribeRouteTablesCommand({
        RouteTableIds: [outputs.Spoke2PrivateRouteTable1Id],
      });
      const response = await ec2Client.send(command);

      const routeTable = response.RouteTables![0];

      const defaultRoute = routeTable.Routes!.find(
        r => r.DestinationCidrBlock === '0.0.0.0/0'
      );
      expect(defaultRoute).toBeDefined();
      expect(defaultRoute!.TransitGatewayId).toBe(outputs.TransitGatewayId);
    });
  });

  describe('Resource Tagging', () => {
    test('VPCs should have required tags', async () => {
      const command = new DescribeVpcsCommand({
        VpcIds: [outputs.HubVpcId, outputs.Spoke1VpcId, outputs.Spoke2VpcId],
      });
      const response = await ec2Client.send(command);

      response.Vpcs!.forEach(vpc => {
        const tags = vpc.Tags || [];
        expect(tags.find(t => t.Key === 'Name')).toBeDefined();
        expect(tags.find(t => t.Key === 'Environment')).toBeDefined();
        expect(tags.find(t => t.Key === 'CostCenter')).toBeDefined();
        expect(tags.find(t => t.Key === 'DataClassification')).toBeDefined();
      });
    });
  });

  describe('Stack Outputs', () => {
    test('All required outputs should be present', () => {
      const requiredOutputs = [
        'HubVpcId',
        'Spoke1VpcId',
        'Spoke2VpcId',
        'TransitGatewayId',
        'HubTgwRouteTableId',
        'SpokeTgwRouteTableId',
        'FlowLogsBucketName',
        'StackName',
        'EnvironmentSuffix',
      ];

      requiredOutputs.forEach(outputName => {
        expect(outputs[outputName]).toBeDefined();
        expect(outputs[outputName]).not.toBe('');
      });
    });

    test('Environment suffix should be included in resource names', () => {
      // Bucket name should include environment suffix
      expect(outputs.FlowLogsBucketName).toContain(outputs.EnvironmentSuffix);
    });
  });
});
