// tests/integration/terraform.int.test.ts
// Integration tests for deployed Terraform infrastructure

import { DescribeInternetGatewaysCommand, DescribeNatGatewaysCommand, DescribeNetworkAclsCommand, DescribeRouteTablesCommand, DescribeSecurityGroupsCommand, DescribeSubnetsCommand, DescribeVpcAttributeCommand, DescribeVpcsCommand, EC2Client } from '@aws-sdk/client-ec2';
import * as fs from 'fs';
import * as path from 'path';

// Read the deployment outputs
const outputsPath = path.resolve(__dirname, '../cfn-outputs/flat-outputs.json');
let outputs: Record<string, string> = {};

if (fs.existsSync(outputsPath)) {
  outputs = JSON.parse(fs.readFileSync(outputsPath, 'utf8'));
}

// Initialize AWS client
const region = 'us-west-2';
const ec2Client = new EC2Client({ region });

describe('Terraform Infrastructure Integration Tests', () => {
  describe('Deployment Outputs', () => {
    test('outputs file exists and contains all required outputs', () => {
      expect(fs.existsSync(outputsPath)).toBe(true);
      expect(outputs).toBeDefined();
      expect(outputs.vpc_id).toBeDefined();
      expect(outputs.public_subnet_id).toBeDefined();
      expect(outputs.private_subnet_id).toBeDefined();
      expect(outputs.internet_gateway_id).toBeDefined();
      expect(outputs.nat_gateway_id).toBeDefined();
      expect(outputs.application_security_group_id).toBeDefined();
      expect(outputs.ssh_security_group_id).toBeDefined();
      expect(outputs.vpc_cidr_block).toBeDefined();
    });

    test('all output values are non-empty strings', () => {
      Object.entries(outputs).forEach(([key, value]) => {
        expect(value).toBeTruthy();
        expect(typeof value).toBe('string');
      });
    });

    test('resource IDs follow AWS format', () => {
      expect(outputs.vpc_id).toMatch(/^vpc-[a-f0-9]+$/);
      expect(outputs.public_subnet_id).toMatch(/^subnet-[a-f0-9]+$/);
      expect(outputs.private_subnet_id).toMatch(/^subnet-[a-f0-9]+$/);
      expect(outputs.internet_gateway_id).toMatch(/^igw-[a-f0-9]+$/);
      expect(outputs.nat_gateway_id).toMatch(/^nat-[a-f0-9]+$/);
      expect(outputs.application_security_group_id).toMatch(/^sg-[a-f0-9]+$/);
      expect(outputs.ssh_security_group_id).toMatch(/^sg-[a-f0-9]+$/);
    });

    test('VPC CIDR block is valid', () => {
      expect(outputs.vpc_cidr_block).toMatch(/^10\.0\.0\.0\/16$/);
    });
  });

  describe('VPC Infrastructure Verification', () => {
    test('VPC exists with correct configuration', async () => {
      const command = new DescribeVpcsCommand({
        VpcIds: [outputs.vpc_id]
      });
      
      const response = await ec2Client.send(command);
      expect(response.Vpcs).toHaveLength(1);
      
      const vpc = response.Vpcs![0];
      expect(vpc.VpcId).toBe(outputs.vpc_id);
      expect(vpc.CidrBlock).toBe('10.0.0.0/16');
      expect(vpc.State).toBe('available');
      expect(vpc.DhcpOptionsId).toBeDefined();
      expect(vpc.InstanceTenancy).toBe('default');
    }, 30000);

    test('VPC has DNS support and hostnames enabled', async () => {
      // Check DNS support
      const dnsSupportCommand = new DescribeVpcAttributeCommand({
        VpcId: outputs.vpc_id,
        Attribute: 'enableDnsSupport'
      });
      
      const dnsSupportResponse = await ec2Client.send(dnsSupportCommand);
      expect(dnsSupportResponse.EnableDnsSupport?.Value).toBe(true);
      
      // Check DNS hostnames
      const dnsHostnamesCommand = new DescribeVpcAttributeCommand({
        VpcId: outputs.vpc_id,
        Attribute: 'enableDnsHostnames'
      });
      
      const dnsHostnamesResponse = await ec2Client.send(dnsHostnamesCommand);
      expect(dnsHostnamesResponse.EnableDnsHostnames?.Value).toBe(true);
    }, 30000);

    test('VPC has correct tags', async () => {
      const command = new DescribeVpcsCommand({
        VpcIds: [outputs.vpc_id]
      });
      
      const response = await ec2Client.send(command);
      const vpc = response.Vpcs![0];
      
      expect(vpc.Tags).toBeDefined();
      const nameTag = vpc.Tags?.find(t => t.Key === 'Name');
      expect(nameTag).toBeDefined();
      expect(nameTag?.Value).toContain('task-229148-tap-vpc');
      
      const environmentTag = vpc.Tags?.find(t => t.Key === 'Environment');
      expect(environmentTag).toBeDefined();
      
      const taskIdTag = vpc.Tags?.find(t => t.Key === 'TaskId');
      expect(taskIdTag).toBeDefined();
      expect(taskIdTag?.Value).toBe('task-229148');
      
      const managedByTag = vpc.Tags?.find(t => t.Key === 'ManagedBy');
      expect(managedByTag).toBeDefined();
      expect(managedByTag?.Value).toBe('Terraform');
    }, 30000);
  });

  describe('Subnet Configuration Verification', () => {
    test('public subnet exists with correct configuration', async () => {
      const command = new DescribeSubnetsCommand({
        SubnetIds: [outputs.public_subnet_id]
      });
      
      const response = await ec2Client.send(command);
      expect(response.Subnets).toHaveLength(1);
      
      const subnet = response.Subnets![0];
      expect(subnet.SubnetId).toBe(outputs.public_subnet_id);
      expect(subnet.VpcId).toBe(outputs.vpc_id);
      expect(subnet.CidrBlock).toBe('10.0.1.0/24');
      expect(subnet.MapPublicIpOnLaunch).toBe(true);
      expect(subnet.State).toBe('available');
    }, 30000);

    test('private subnet exists with correct configuration', async () => {
      const command = new DescribeSubnetsCommand({
        SubnetIds: [outputs.private_subnet_id]
      });
      
      const response = await ec2Client.send(command);
      expect(response.Subnets).toHaveLength(1);
      
      const subnet = response.Subnets![0];
      expect(subnet.SubnetId).toBe(outputs.private_subnet_id);
      expect(subnet.VpcId).toBe(outputs.vpc_id);
      expect(subnet.CidrBlock).toBe('10.0.2.0/24');
      expect(subnet.MapPublicIpOnLaunch).toBe(false);
      expect(subnet.State).toBe('available');
    }, 30000);

    test('subnets are in different availability zones', async () => {
      const command = new DescribeSubnetsCommand({
        SubnetIds: [outputs.public_subnet_id, outputs.private_subnet_id]
      });
      
      const response = await ec2Client.send(command);
      expect(response.Subnets).toHaveLength(2);
      
      const publicSubnet = response.Subnets!.find(s => s.SubnetId === outputs.public_subnet_id);
      const privateSubnet = response.Subnets!.find(s => s.SubnetId === outputs.private_subnet_id);
      
      expect(publicSubnet?.AvailabilityZone).toBeDefined();
      expect(privateSubnet?.AvailabilityZone).toBeDefined();
      expect(publicSubnet?.AvailabilityZone).not.toBe(privateSubnet?.AvailabilityZone);
    }, 30000);

    test('subnets have correct tags', async () => {
      const command = new DescribeSubnetsCommand({
        SubnetIds: [outputs.public_subnet_id, outputs.private_subnet_id]
      });
      
      const response = await ec2Client.send(command);
      
      const publicSubnet = response.Subnets!.find(s => s.SubnetId === outputs.public_subnet_id);
      const privateSubnet = response.Subnets!.find(s => s.SubnetId === outputs.private_subnet_id);
      
      // Check public subnet tags
      const publicNameTag = publicSubnet?.Tags?.find(t => t.Key === 'Name');
      expect(publicNameTag?.Value).toContain('task-229148-tap-public-subnet');
      
      const publicTypeTag = publicSubnet?.Tags?.find(t => t.Key === 'Type');
      expect(publicTypeTag?.Value).toBe('Public');
      
      // Check private subnet tags
      const privateNameTag = privateSubnet?.Tags?.find(t => t.Key === 'Name');
      expect(privateNameTag?.Value).toContain('task-229148-tap-private-subnet');
      
      const privateTypeTag = privateSubnet?.Tags?.find(t => t.Key === 'Type');
      expect(privateTypeTag?.Value).toBe('Private');
    }, 30000);
  });

  describe('Internet Gateway Verification', () => {
    test('Internet Gateway exists and is attached to VPC', async () => {
      const command = new DescribeInternetGatewaysCommand({
        InternetGatewayIds: [outputs.internet_gateway_id]
      });
      
      const response = await ec2Client.send(command);
      expect(response.InternetGateways).toHaveLength(1);
      
      const igw = response.InternetGateways![0];
      expect(igw.InternetGatewayId).toBe(outputs.internet_gateway_id);
      
      const attachment = igw.Attachments?.find(a => a.VpcId === outputs.vpc_id);
      expect(attachment).toBeDefined();
      expect(attachment?.State).toBe('available');
    }, 30000);

    test('Internet Gateway has correct tags', async () => {
      const command = new DescribeInternetGatewaysCommand({
        InternetGatewayIds: [outputs.internet_gateway_id]
      });
      
      const response = await ec2Client.send(command);
      const igw = response.InternetGateways![0];
      
      const nameTag = igw.Tags?.find(t => t.Key === 'Name');
      expect(nameTag?.Value).toContain('task-229148-tap-igw');
    }, 30000);
  });

  describe('NAT Gateway Verification', () => {
    test('NAT Gateway exists with correct configuration', async () => {
      const command = new DescribeNatGatewaysCommand({
        NatGatewayIds: [outputs.nat_gateway_id]
      });
      
      const response = await ec2Client.send(command);
      expect(response.NatGateways).toHaveLength(1);
      
      const natGw = response.NatGateways![0];
      expect(natGw.NatGatewayId).toBe(outputs.nat_gateway_id);
      expect(natGw.SubnetId).toBe(outputs.public_subnet_id);
      expect(natGw.VpcId).toBe(outputs.vpc_id);
      expect(natGw.State).toBe('available');
    }, 30000);

    test('NAT Gateway has Elastic IP attached', async () => {
      const command = new DescribeNatGatewaysCommand({
        NatGatewayIds: [outputs.nat_gateway_id]
      });
      
      const response = await ec2Client.send(command);
      const natGw = response.NatGateways![0];
      
      expect(natGw.NatGatewayAddresses).toBeDefined();
      expect(natGw.NatGatewayAddresses!.length).toBeGreaterThan(0);
      
      const address = natGw.NatGatewayAddresses![0];
      expect(address.AllocationId).toBeDefined();
      expect(address.PublicIp).toBeDefined();
    }, 30000);

    test('NAT Gateway has correct tags', async () => {
      const command = new DescribeNatGatewaysCommand({
        NatGatewayIds: [outputs.nat_gateway_id]
      });
      
      const response = await ec2Client.send(command);
      const natGw = response.NatGateways![0];
      
      const nameTag = natGw.Tags?.find(t => t.Key === 'Name');
      expect(nameTag?.Value).toContain('task-229148-tap-nat-gateway');
    }, 30000);
  });

  describe('Route Tables Verification', () => {
    test('public route table exists with correct routes', async () => {
      const command = new DescribeRouteTablesCommand({
        Filters: [
          {
            Name: 'vpc-id',
            Values: [outputs.vpc_id]
          },
          {
            Name: 'association.subnet-id',
            Values: [outputs.public_subnet_id]
          }
        ]
      });
      
      const response = await ec2Client.send(command);
      expect(response.RouteTables).toHaveLength(1);
      
      const routeTable = response.RouteTables![0];
      expect(routeTable.VpcId).toBe(outputs.vpc_id);
      
      // Check for internet gateway route
      const igwRoute = routeTable.Routes?.find(r => 
        r.DestinationCidrBlock === '0.0.0.0/0' && r.GatewayId === outputs.internet_gateway_id
      );
      expect(igwRoute).toBeDefined();
      expect(igwRoute?.State).toBe('active');
    }, 30000);

    test('private route table exists with correct routes', async () => {
      const command = new DescribeRouteTablesCommand({
        Filters: [
          {
            Name: 'vpc-id',
            Values: [outputs.vpc_id]
          },
          {
            Name: 'association.subnet-id',
            Values: [outputs.private_subnet_id]
          }
        ]
      });
      
      const response = await ec2Client.send(command);
      expect(response.RouteTables).toHaveLength(1);
      
      const routeTable = response.RouteTables![0];
      expect(routeTable.VpcId).toBe(outputs.vpc_id);
      
      // Check for NAT gateway route
      const natRoute = routeTable.Routes?.find(r => 
        r.DestinationCidrBlock === '0.0.0.0/0' && r.NatGatewayId === outputs.nat_gateway_id
      );
      expect(natRoute).toBeDefined();
      expect(natRoute?.State).toBe('active');
    }, 30000);

    test('route tables have correct tags', async () => {
      const command = new DescribeRouteTablesCommand({
        Filters: [
          {
            Name: 'vpc-id',
            Values: [outputs.vpc_id]
          },
          {
            Name: 'tag:Name',
            Values: ['*task-229148-tap*']
          }
        ]
      });
      
      const response = await ec2Client.send(command);
      expect(response.RouteTables!.length).toBeGreaterThanOrEqual(2);
      
      const publicRouteTable = response.RouteTables!.find(rt => 
        rt.Tags?.some(tag => tag.Value?.includes('public-route-table'))
      );
      const privateRouteTable = response.RouteTables!.find(rt => 
        rt.Tags?.some(tag => tag.Value?.includes('private-route-table'))
      );
      
      expect(publicRouteTable).toBeDefined();
      expect(privateRouteTable).toBeDefined();
    }, 30000);
  });

  describe('Security Groups Verification', () => {
    test('application security group exists with correct configuration', async () => {
      const command = new DescribeSecurityGroupsCommand({
        GroupIds: [outputs.application_security_group_id]
      });
      
      const response = await ec2Client.send(command);
      expect(response.SecurityGroups).toHaveLength(1);
      
      const sg = response.SecurityGroups![0];
      expect(sg.GroupId).toBe(outputs.application_security_group_id);
      expect(sg.VpcId).toBe(outputs.vpc_id);
      expect(sg.Description).toContain('Security group for application servers');
    }, 30000);

    test('application security group has correct ingress rules', async () => {
      const command = new DescribeSecurityGroupsCommand({
        GroupIds: [outputs.application_security_group_id]
      });
      
      const response = await ec2Client.send(command);
      const sg = response.SecurityGroups![0];
      
      expect(sg.IpPermissions).toBeDefined();
      expect(sg.IpPermissions!.length).toBe(2); // HTTP and HTTPS
      
      // Check for HTTP rule (port 80)
      const httpRule = sg.IpPermissions?.find(rule => 
        rule.FromPort === 80 && rule.ToPort === 80
      );
      expect(httpRule).toBeDefined();
      expect(httpRule?.IpProtocol).toBe('tcp');
      
      // Check for HTTPS rule (port 443)
      const httpsRule = sg.IpPermissions?.find(rule => 
        rule.FromPort === 443 && rule.ToPort === 443
      );
      expect(httpsRule).toBeDefined();
      expect(httpsRule?.IpProtocol).toBe('tcp');
      
      // Ensure no SSH rule
      const sshRule = sg.IpPermissions?.find(rule => 
        rule.FromPort === 22 && rule.ToPort === 22
      );
      expect(sshRule).toBeUndefined();
    }, 30000);

    test('SSH security group exists with correct configuration', async () => {
      const command = new DescribeSecurityGroupsCommand({
        GroupIds: [outputs.ssh_security_group_id]
      });
      
      const response = await ec2Client.send(command);
      expect(response.SecurityGroups).toHaveLength(1);
      
      const sg = response.SecurityGroups![0];
      expect(sg.GroupId).toBe(outputs.ssh_security_group_id);
      expect(sg.VpcId).toBe(outputs.vpc_id);
      expect(sg.Description).toContain('Security group for SSH access');
    }, 30000);

    test('SSH security group has correct ingress rules', async () => {
      const command = new DescribeSecurityGroupsCommand({
        GroupIds: [outputs.ssh_security_group_id]
      });
      
      const response = await ec2Client.send(command);
      const sg = response.SecurityGroups![0];
      
      expect(sg.IpPermissions).toBeDefined();
      expect(sg.IpPermissions!.length).toBe(1); // Only SSH
      
      // Check for SSH rule (port 22)
      const sshRule = sg.IpPermissions?.find(rule => 
        rule.FromPort === 22 && rule.ToPort === 22
      );
      expect(sshRule).toBeDefined();
      expect(sshRule?.IpProtocol).toBe('tcp');
      
      // Check that SSH is restricted to trusted IP ranges (not 0.0.0.0/0)
      const cidrBlocks = sshRule?.IpRanges?.map(r => r.CidrIp) || [];
      const defaultTrustedRanges = ['10.0.0.0/8', '172.16.0.0/12', '192.168.0.0/16'];
      expect(cidrBlocks.length).toBeGreaterThan(0);
      
      // Verify that all CIDR blocks are from trusted ranges (not the open internet)
      cidrBlocks.forEach(cidr => {
        expect(cidr).not.toBe('0.0.0.0/0');
        // Should be either one of the default private ranges or a custom trusted range
        const isPrivateRange = defaultTrustedRanges.some(range => 
          cidr === range || cidr?.startsWith('10.') || cidr?.startsWith('172.') || cidr?.startsWith('192.168.')
        );
        expect(isPrivateRange).toBe(true);
      });
      
      // Ensure no HTTP/HTTPS rules
      const httpRule = sg.IpPermissions?.find(rule => 
        rule.FromPort === 80 && rule.ToPort === 80
      );
      expect(httpRule).toBeUndefined();
    }, 30000);

    test('security groups have correct egress rules', async () => {
      const appCommand = new DescribeSecurityGroupsCommand({
        GroupIds: [outputs.application_security_group_id]
      });
      const sshCommand = new DescribeSecurityGroupsCommand({
        GroupIds: [outputs.ssh_security_group_id]
      });
      
      const [appResponse, sshResponse] = await Promise.all([
        ec2Client.send(appCommand),
        ec2Client.send(sshCommand)
      ]);
      
      // Both should have all outbound traffic allowed
      [appResponse.SecurityGroups![0], sshResponse.SecurityGroups![0]].forEach(sg => {
        expect(sg.IpPermissionsEgress).toBeDefined();
        expect(sg.IpPermissionsEgress!.length).toBeGreaterThanOrEqual(1);
        
        const allTrafficRule = sg.IpPermissionsEgress?.find(rule => 
          rule.IpProtocol === '-1'
        );
        expect(allTrafficRule).toBeDefined();
      });
    }, 30000);

    test('security groups have correct tags', async () => {
      const command = new DescribeSecurityGroupsCommand({
        GroupIds: [outputs.application_security_group_id, outputs.ssh_security_group_id]
      });
      
      const response = await ec2Client.send(command);
      expect(response.SecurityGroups).toHaveLength(2);
      
      response.SecurityGroups!.forEach(sg => {
        const nameTag = sg.Tags?.find(t => t.Key === 'Name');
        expect(nameTag).toBeDefined();
        expect(nameTag?.Value).toContain('task-229148-tap');
        
        const taskIdTag = sg.Tags?.find(t => t.Key === 'TaskId');
        expect(taskIdTag?.Value).toBe('task-229148');
      });
    }, 30000);
  });

  describe('Network ACL Verification', () => {
    test('Network ACL exists with correct configuration', async () => {
      const command = new DescribeNetworkAclsCommand({
        Filters: [
          {
            Name: 'vpc-id',
            Values: [outputs.vpc_id]
          },
          {
            Name: 'tag:Name',
            Values: ['*task-229148-tap-network-acl*']
          }
        ]
      });
      
      const response = await ec2Client.send(command);
      expect(response.NetworkAcls!.length).toBeGreaterThanOrEqual(1);
      
      const networkAcl = response.NetworkAcls![0];
      expect(networkAcl.VpcId).toBe(outputs.vpc_id);
    }, 30000);

    test('Network ACL has correct ingress rules', async () => {
      const command = new DescribeNetworkAclsCommand({
        Filters: [
          {
            Name: 'vpc-id',
            Values: [outputs.vpc_id]
          },
          {
            Name: 'tag:Name',
            Values: ['*task-229148-tap-network-acl*']
          }
        ]
      });
      
      const response = await ec2Client.send(command);
      const networkAcl = response.NetworkAcls![0];
      
      expect(networkAcl.Entries).toBeDefined();
      
      const ingressRules = networkAcl.Entries!.filter(entry => !entry.Egress);
      
      // Check for HTTP rule (rule 100)
      const httpRule = ingressRules.find(rule => rule.RuleNumber === 100);
      expect(httpRule).toBeDefined();
      expect(httpRule?.Protocol).toBe('6'); // TCP
      expect(httpRule?.PortRange?.From).toBe(80);
      expect(httpRule?.PortRange?.To).toBe(80);
      expect(httpRule?.RuleAction).toBe('allow');
      
      // Check for HTTPS rule (rule 110)
      const httpsRule = ingressRules.find(rule => rule.RuleNumber === 110);
      expect(httpsRule).toBeDefined();
      expect(httpsRule?.Protocol).toBe('6'); // TCP
      expect(httpsRule?.PortRange?.From).toBe(443);
      expect(httpsRule?.PortRange?.To).toBe(443);
      expect(httpsRule?.RuleAction).toBe('allow');
      
      // Check for SSH rules (starting from rule 120)
      const sshRules = ingressRules.filter(rule => 
        rule.Protocol === '6' && 
        rule.PortRange?.From === 22 && 
        rule.PortRange?.To === 22 &&
        rule.RuleAction === 'allow'
      );
      expect(sshRules.length).toBeGreaterThanOrEqual(1); // Should have at least one SSH rule
      
      // Verify SSH rules use trusted IP ranges (not 0.0.0.0/0)
      sshRules.forEach(sshRule => {
        expect(sshRule.CidrBlock).toBeDefined();
        expect(sshRule.CidrBlock).not.toBe('0.0.0.0/0');
        // Should be private IP ranges (10.x, 172.16-31.x, 192.168.x)
        const isPrivateRange = 
          sshRule.CidrBlock?.startsWith('10.') ||
          sshRule.CidrBlock?.startsWith('172.') ||
          sshRule.CidrBlock?.startsWith('192.168.');
        expect(isPrivateRange).toBe(true);
      });
      
      // Check for ephemeral ports rule (rule 140 - updated from 130)
      const ephemeralRule = ingressRules.find(rule => rule.RuleNumber === 140);
      expect(ephemeralRule).toBeDefined();
      expect(ephemeralRule?.Protocol).toBe('6'); // TCP
      expect(ephemeralRule?.PortRange?.From).toBe(1024);
      expect(ephemeralRule?.PortRange?.To).toBe(65535);
      expect(ephemeralRule?.RuleAction).toBe('allow');
    }, 30000);

    test('Network ACL has correct egress rules', async () => {
      const command = new DescribeNetworkAclsCommand({
        Filters: [
          {
            Name: 'vpc-id',
            Values: [outputs.vpc_id]
          },
          {
            Name: 'tag:Name',
            Values: ['*task-229148-tap-network-acl*']
          }
        ]
      });
      
      const response = await ec2Client.send(command);
      const networkAcl = response.NetworkAcls![0];
      
      const egressRules = networkAcl.Entries!.filter(entry => entry.Egress);
      
      // Check for all outbound traffic rule (rule 100)
      const allTrafficRule = egressRules.find(rule => rule.RuleNumber === 100);
      expect(allTrafficRule).toBeDefined();
      expect(allTrafficRule?.Protocol).toBe('-1'); // All protocols
      expect(allTrafficRule?.RuleAction).toBe('allow');
    }, 30000);
  });

  describe('Resource Tagging and Naming Consistency', () => {
    test('all resources follow consistent naming convention', async () => {
      // Test VPC naming
      const vpcCommand = new DescribeVpcsCommand({ VpcIds: [outputs.vpc_id] });
      const vpcResponse = await ec2Client.send(vpcCommand);
      const vpcName = vpcResponse.Vpcs![0].Tags?.find(t => t.Key === 'Name')?.Value;
      expect(vpcName).toBe('task-229148-tap-vpc');
      
      // Test IGW naming
      const igwCommand = new DescribeInternetGatewaysCommand({ InternetGatewayIds: [outputs.internet_gateway_id] });
      const igwResponse = await ec2Client.send(igwCommand);
      const igwName = igwResponse.InternetGateways![0].Tags?.find(t => t.Key === 'Name')?.Value;
      expect(igwName).toBe('task-229148-tap-igw');
      
      // Test NAT Gateway naming
      const natCommand = new DescribeNatGatewaysCommand({ NatGatewayIds: [outputs.nat_gateway_id] });
      const natResponse = await ec2Client.send(natCommand);
      const natName = natResponse.NatGateways![0].Tags?.find(t => t.Key === 'Name')?.Value;
      expect(natName).toBe('task-229148-tap-nat-gateway');
    }, 30000);

    test('all resources have required common tags', async () => {
      const requiredTags = ['TaskId', 'ManagedBy', 'Project', 'Environment'];
      
      // Check VPC tags
      const vpcCommand = new DescribeVpcsCommand({ VpcIds: [outputs.vpc_id] });
      const vpcResponse = await ec2Client.send(vpcCommand);
      const vpcTags = vpcResponse.Vpcs![0].Tags || [];
      
      requiredTags.forEach(tagKey => {
        const tag = vpcTags.find(t => t.Key === tagKey);
        expect(tag).toBeDefined();
        if (tagKey === 'TaskId') expect(tag?.Value).toBe('task-229148');
        if (tagKey === 'ManagedBy') expect(tag?.Value).toBe('Terraform');
        if (tagKey === 'Project') expect(tag?.Value).toBe('TAP');
      });
    }, 30000);
  });

  describe('Connectivity and Network Flow', () => {
    test('public subnet can reach internet through IGW', async () => {
      // Verify route table association and IGW route
      const command = new DescribeRouteTablesCommand({
        Filters: [
          {
            Name: 'association.subnet-id',
            Values: [outputs.public_subnet_id]
          }
        ]
      });
      
      const response = await ec2Client.send(command);
      expect(response.RouteTables).toHaveLength(1);
      
      const routeTable = response.RouteTables![0];
      const igwRoute = routeTable.Routes?.find(r => 
        r.DestinationCidrBlock === '0.0.0.0/0' && 
        r.GatewayId === outputs.internet_gateway_id
      );
      
      expect(igwRoute).toBeDefined();
      expect(igwRoute?.State).toBe('active');
    }, 30000);

    test('private subnet can reach internet through NAT Gateway', async () => {
      // Verify route table association and NAT route
      const command = new DescribeRouteTablesCommand({
        Filters: [
          {
            Name: 'association.subnet-id',
            Values: [outputs.private_subnet_id]
          }
        ]
      });
      
      const response = await ec2Client.send(command);
      expect(response.RouteTables).toHaveLength(1);
      
      const routeTable = response.RouteTables![0];
      const natRoute = routeTable.Routes?.find(r => 
        r.DestinationCidrBlock === '0.0.0.0/0' && 
        r.NatGatewayId === outputs.nat_gateway_id
      );
      
      expect(natRoute).toBeDefined();
      expect(natRoute?.State).toBe('active');
    }, 30000);

    test('subnets can communicate within VPC', async () => {
      // Check for VPC local routes
      const command = new DescribeRouteTablesCommand({
        Filters: [
          {
            Name: 'vpc-id',
            Values: [outputs.vpc_id]
          }
        ]
      });
      
      const response = await ec2Client.send(command);
      
      response.RouteTables!.forEach(rt => {
        const localRoute = rt.Routes?.find(r => 
          r.DestinationCidrBlock === '10.0.0.0/16' && 
          r.GatewayId === 'local'
        );
        expect(localRoute).toBeDefined();
        expect(localRoute?.State).toBe('active');
      });
    }, 30000);
  });

  describe('Security Posture Validation', () => {
    test('security groups implement least privilege principle', async () => {
      // Application SG should only allow HTTP/HTTPS
      const appSgCommand = new DescribeSecurityGroupsCommand({
        GroupIds: [outputs.application_security_group_id]
      });
      const appSgResponse = await ec2Client.send(appSgCommand);
      const appSg = appSgResponse.SecurityGroups![0];
      
      expect(appSg.IpPermissions!.length).toBe(2); // Only HTTP and HTTPS
      
      // SSH SG should only allow SSH
      const sshSgCommand = new DescribeSecurityGroupsCommand({
        GroupIds: [outputs.ssh_security_group_id]
      });
      const sshSgResponse = await ec2Client.send(sshSgCommand);
      const sshSg = sshSgResponse.SecurityGroups![0];
      
      expect(sshSg.IpPermissions!.length).toBe(1); // Only SSH
    }, 30000);

    test('private subnet does not auto-assign public IPs', async () => {
      const command = new DescribeSubnetsCommand({
        SubnetIds: [outputs.private_subnet_id]
      });
      
      const response = await ec2Client.send(command);
      const privateSubnet = response.Subnets![0];
      
      expect(privateSubnet.MapPublicIpOnLaunch).toBe(false);
    }, 30000);

    test('Network ACL provides additional security layer', async () => {
      const command = new DescribeNetworkAclsCommand({
        Filters: [
          {
            Name: 'vpc-id',
            Values: [outputs.vpc_id]
          },
          {
            Name: 'tag:Name',
            Values: ['*task-229148-tap-network-acl*']
          }
        ]
      });
      
      const response = await ec2Client.send(command);
      expect(response.NetworkAcls!.length).toBeGreaterThan(0);
      
      const networkAcl = response.NetworkAcls![0];
      const ingressRules = networkAcl.Entries!.filter(entry => !entry.Egress);
      
      // Should have specific rules, not just allow-all
      expect(ingressRules.length).toBeGreaterThan(1);
      
      // Should have specific port-based rules
      const httpRule = ingressRules.find(rule => 
        rule.PortRange?.From === 80 && rule.PortRange?.To === 80
      );
      expect(httpRule).toBeDefined();
    }, 30000);
  });
});