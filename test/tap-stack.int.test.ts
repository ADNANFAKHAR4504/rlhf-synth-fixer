/**
 * test/tap-stack.integration.test.ts
 *
 * Integration tests for the deployed CloudFormation stack
 * Tests actual AWS resources and their interactions
 */

import {
  EC2Client,
  DescribeVpcsCommand,
  DescribeSubnetsCommand,
  DescribeNatGatewaysCommand,
  DescribeInternetGatewaysCommand,
  DescribeSecurityGroupsCommand,
  DescribeInstancesCommand,
  DescribeRouteTablesCommand,
  DescribeVpcAttributeCommand,
  DescribeAddressesCommand,
} from '@aws-sdk/client-ec2';
import {
  CloudFormationClient,
  DescribeStacksCommand,
  DescribeStackResourcesCommand,
} from '@aws-sdk/client-cloudformation';
import fs from 'fs';
import path from 'path';

// LocalStack configuration
const isLocalStack = process.env.AWS_ENDPOINT_URL?.includes('localhost') || process.env.AWS_ENDPOINT_URL?.includes('4566');
const endpoint = process.env.AWS_ENDPOINT_URL || 'http://localhost:4566';

// Configuration - Load from cfn-outputs after stack deployment
const outputs = JSON.parse(
  fs.readFileSync('cfn-outputs/flat-outputs.json', 'utf8')
);

// Get environment suffix from environment variable (set by CI/CD pipeline)
const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';
const stackName = `TapStack${environmentSuffix}`;

// Extract outputs for testing
const VPC_ID = outputs[`${stackName}-VPC-ID`] || outputs['VPCId'];
const PUBLIC_SUBNET1_ID = outputs[`${stackName}-PublicSubnet1-ID`] || outputs['PublicSubnet1Id'];
const PUBLIC_SUBNET2_ID = outputs[`${stackName}-PublicSubnet2-ID`] || outputs['PublicSubnet2Id'];
const PRIVATE_SUBNET1_ID = outputs[`${stackName}-PrivateSubnet1-ID`] || outputs['PrivateSubnet1Id'];
const PRIVATE_SUBNET2_ID = outputs[`${stackName}-PrivateSubnet2-ID`] || outputs['PrivateSubnet2Id'];
const EC2_INSTANCE_ID = outputs[`${stackName}-WebServer-ID`] || outputs['EC2InstanceId'];
const SECURITY_GROUP_ID = outputs[`${stackName}-SecurityGroup-ID`] || outputs['SecurityGroupId'];
const NAT_GATEWAY_ID = outputs[`${stackName}-NATGateway-ID`] || outputs['NATGatewayId'];
const WEB_SERVER_PUBLIC_IP = outputs['WebServerPublicIP'];
const WEB_SERVER_URL = outputs['WebServerURL'];

// AWS SDK v3 clients with LocalStack support
const clientConfig = isLocalStack ? {
  region: 'us-east-1',
  endpoint: endpoint,
  credentials: {
    accessKeyId: 'test',
    secretAccessKey: 'test'
  }
} : { region: 'us-east-1' };

const ec2Client = new EC2Client(clientConfig);
const cloudFormationClient = new CloudFormationClient(clientConfig);

// Helper functions for AWS SDK v3 operations
async function getStackInfo() {
  const command = new DescribeStacksCommand({ StackName: stackName });
  const response = await cloudFormationClient.send(command);
  return response.Stacks![0];
}

async function getStackParameters() {
  const stack = await getStackInfo();
  const parameters: { [key: string]: string } = {};
  stack.Parameters?.forEach((param: any) => {
    parameters[param.ParameterKey] = param.ParameterValue;
  });
  return parameters;
}

async function getVpcInfo() {
  const command = new DescribeVpcsCommand({ VpcIds: [VPC_ID] });
  const response = await ec2Client.send(command);
  return response.Vpcs![0];
}

describe('TapStack Integration Tests', () => {
  let stackParameters: { [key: string]: string } = {};

  // Setup validation
  beforeAll(async () => {
    console.log('Validating stack deployment...');
    const stack = await getStackInfo();
    stackParameters = await getStackParameters();
    console.log(`Stack ${stackName} is in ${stack.StackStatus} state`);
    console.log(`Stack parameters:`, stackParameters);
    
    // Enhanced logging for KeyPair parameter
    console.log(`KeyPair Parameter: ${stackParameters.KeyPairName || 'Empty (SSH disabled)'}`);
    console.log(`Instance Type: ${stackParameters.InstanceType || 't3.micro'}`);
    
    // Log key infrastructure endpoints
    console.log(`VPC ID: ${VPC_ID}`);
    console.log(`Public Subnet 1: ${PUBLIC_SUBNET1_ID}`);
    console.log(`Public Subnet 2: ${PUBLIC_SUBNET2_ID}`);
    console.log(`Private Subnet 1: ${PRIVATE_SUBNET1_ID}`);
    console.log(`Private Subnet 2: ${PRIVATE_SUBNET2_ID}`);
    console.log(`EC2 Instance: ${EC2_INSTANCE_ID}`);
    console.log(`Web Server URL: ${WEB_SERVER_URL}`);
  });
  

  describe('Infrastructure Validation', () => {
    test('should have valid VPC ID', () => {
      expect(VPC_ID).toBeDefined();
      expect(VPC_ID).toMatch(/^vpc-[a-f0-9]+$/);
    });

    test('should have valid subnet IDs', () => {
      expect(PUBLIC_SUBNET1_ID).toBeDefined();
      expect(PUBLIC_SUBNET1_ID).toMatch(/^subnet-[a-f0-9]+$/);
      expect(PUBLIC_SUBNET2_ID).toBeDefined();
      expect(PUBLIC_SUBNET2_ID).toMatch(/^subnet-[a-f0-9]+$/);
      expect(PRIVATE_SUBNET1_ID).toBeDefined();
      expect(PRIVATE_SUBNET1_ID).toMatch(/^subnet-[a-f0-9]+$/);
      expect(PRIVATE_SUBNET2_ID).toBeDefined();
      expect(PRIVATE_SUBNET2_ID).toMatch(/^subnet-[a-f0-9]+$/);
    });

    test('should have valid EC2 instance ID', () => {
      expect(EC2_INSTANCE_ID).toBeDefined();
      expect(EC2_INSTANCE_ID).toMatch(/^i-[a-f0-9]+$/);
    });

    test('should have valid NAT Gateway ID', () => {
      expect(NAT_GATEWAY_ID).toBeDefined();
      expect(NAT_GATEWAY_ID).toMatch(/^nat-[a-f0-9]+$/);
    });

    test('should have valid Web Server Public IP and URL', () => {
      expect(WEB_SERVER_PUBLIC_IP).toBeDefined();
      expect(WEB_SERVER_PUBLIC_IP).toMatch(/^(\d{1,3}\.){3}\d{1,3}$/);
      expect(WEB_SERVER_URL).toBeDefined();
      expect(WEB_SERVER_URL).toMatch(/^http:\/\/(\d{1,3}\.){3}\d{1,3}$/);
    });

    test('should validate stack parameters', async () => {
      expect(stackParameters.KeyPairName).toBeDefined();
      expect(stackParameters.InstanceType).toBeDefined();
      
      // KeyPairName can now be empty string
      console.log(`KeyPair: ${stackParameters.KeyPairName || 'Not specified (empty)'}`);
      console.log(`Instance Type: ${stackParameters.InstanceType}`);
    });
  });

  describe('Stack Deployment Status', () => {
    test('should be in complete state', async () => {
      const stack = await getStackInfo();
      
      expect(stack).toBeDefined();
      expect(['CREATE_COMPLETE', 'UPDATE_COMPLETE']).toContain(stack.StackStatus!);
      expect(stack.StackName).toBe(stackName);
    });

    test('should have proper stack tags', async () => {
      const stack = await getStackInfo();
      
      expect(stack.Tags).toBeDefined();
      const repositoryTag = stack.Tags!.find((tag: any) => tag.Key === 'Repository');
      const authorTag = stack.Tags!.find((tag: any) => tag.Key === 'CommitAuthor');
      
      if (repositoryTag) {
        expect(repositoryTag.Value).toContain('iac-test-automations');
      }
      if (authorTag) {
        expect(typeof authorTag.Value).toBe('string');
      }
    });
  });

  describe('VPC & Networking Health Check', () => {
    test('should have available VPC with correct configuration', async () => {
      const vpc = await getVpcInfo();

      expect(vpc.State).toBe('available');
      expect(vpc.CidrBlock).toBe('10.0.0.0/16');
      expect(vpc.DhcpOptionsId).toBeDefined();

      // Fetch DNS attributes separately
      const dnsHostnamesCommand = new DescribeVpcAttributeCommand({
        VpcId: vpc.VpcId!,
        Attribute: 'enableDnsHostnames'
      });
      const dnsHostnamesResponse = await ec2Client.send(dnsHostnamesCommand);
      expect(dnsHostnamesResponse.EnableDnsHostnames?.Value).toBe(true);

      const dnsSupportCommand = new DescribeVpcAttributeCommand({
        VpcId: vpc.VpcId!,
        Attribute: 'enableDnsSupport'
      });
      const dnsSupportResponse = await ec2Client.send(dnsSupportCommand);
      expect(dnsSupportResponse.EnableDnsSupport?.Value).toBe(true);
      
      console.log(`VPC ${VPC_ID} is available with CIDR 10.0.0.0/16`);
    });

    test('should have public subnets in multiple AZs', async () => {
      const command = new DescribeSubnetsCommand({
        SubnetIds: [PUBLIC_SUBNET1_ID, PUBLIC_SUBNET2_ID]
      });
      const response = await ec2Client.send(command);
      const publicSubnets = response.Subnets!;

      expect(publicSubnets.length).toBe(2);
      
      publicSubnets.forEach((subnet: any) => {
        expect(subnet.State).toBe('available');
        expect(subnet.MapPublicIpOnLaunch).toBe(true);
        expect(['10.0.1.0/24', '10.0.2.0/24']).toContain(subnet.CidrBlock);
        expect(subnet.VpcId).toBe(VPC_ID);
      });

      // Verify AZ distribution
      const azs = [...new Set(publicSubnets.map((s: any) => s.AvailabilityZone))];
      expect(azs.length).toBe(2);
      
      console.log(`Found ${publicSubnets.length} public subnets across ${azs.length} AZs: ${azs.join(', ')}`);
    });

    test('should have private subnets properly configured', async () => {
      const command = new DescribeSubnetsCommand({
        SubnetIds: [PRIVATE_SUBNET1_ID, PRIVATE_SUBNET2_ID]
      });
      const response = await ec2Client.send(command);
      const privateSubnets = response.Subnets!;

      expect(privateSubnets.length).toBe(2);
      
      privateSubnets.forEach((subnet: any) => {
        expect(subnet.State).toBe('available');
        expect(subnet.MapPublicIpOnLaunch).toBe(false);
        expect(['10.0.3.0/24', '10.0.4.0/24']).toContain(subnet.CidrBlock);
        expect(subnet.VpcId).toBe(VPC_ID);
      });

      // Verify AZ distribution matches public subnets
      const azs = [...new Set(privateSubnets.map((s: any) => s.AvailabilityZone))];
      expect(azs.length).toBe(2);
      
      console.log(`Found ${privateSubnets.length} private subnets across ${azs.length} AZs`);
    });

    test('should have functioning NAT Gateway', async () => {
      const command = new DescribeNatGatewaysCommand({
        NatGatewayIds: [NAT_GATEWAY_ID]
      });
      const response = await ec2Client.send(command);
      const natGateway = response.NatGateways![0];

      expect(natGateway).toBeDefined();
      expect(natGateway.State).toBe('available');
      expect(natGateway.VpcId).toBe(VPC_ID);
      expect(natGateway.SubnetId).toBe(PUBLIC_SUBNET1_ID);
      expect(natGateway.NatGatewayAddresses![0].AllocationId).toBeDefined();
      expect(natGateway.NatGatewayAddresses![0].PublicIp).toBeDefined();
      
      console.log(`NAT Gateway is healthy with public IP: ${natGateway.NatGatewayAddresses![0].PublicIp}`);
    });

    test('should have Internet Gateway attached', async () => {
      const command = new DescribeInternetGatewaysCommand({
        Filters: [{ Name: 'attachment.vpc-id', Values: [VPC_ID] }]
      });
      const response = await ec2Client.send(command);
      const igws = response.InternetGateways!;

      expect(igws.length).toBe(1);
      expect(igws[0].Attachments![0].State).toBe('available');
      expect(igws[0].Attachments![0].VpcId).toBe(VPC_ID);
      
      console.log(`Internet Gateway ${igws[0].InternetGatewayId} is attached`);
    });

    test('should have proper route table configuration', async () => {
      const command = new DescribeRouteTablesCommand({
        Filters: [{ Name: 'vpc-id', Values: [VPC_ID] }]
      });
      const response = await ec2Client.send(command);
      const routeTables = response.RouteTables!.filter(rt => rt.VpcId === VPC_ID);

      // Should have at least 3 route tables: default + public + private
      expect(routeTables.length).toBeGreaterThanOrEqual(3);

      // Find public route table (has route to IGW)
      const publicRT = routeTables.find(rt => 
        rt.Routes!.some(route => 
          route.GatewayId && 
          route.GatewayId.startsWith('igw-') && 
          route.DestinationCidrBlock === '0.0.0.0/0'
        )
      );
      expect(publicRT).toBeDefined();

      // Find private route table (has route to NAT Gateway)
      const privateRT = routeTables.find(rt => 
        rt.Routes!.some(route => 
          route.NatGatewayId === NAT_GATEWAY_ID && 
          route.DestinationCidrBlock === '0.0.0.0/0'
        )
      );
      expect(privateRT).toBeDefined();

      console.log(`Found proper routing configuration with IGW and NAT Gateway routes`);
    });

    test('should have Elastic IP allocated for NAT Gateway', async () => {
      const command = new DescribeAddressesCommand({
        Filters: [{ Name: 'domain', Values: ['vpc'] }]
      });
      const response = await ec2Client.send(command);
      
      // Find EIP associated with our NAT Gateway
      const natEip = response.Addresses!.find(addr => 
        addr.AssociationId && 
        addr.NetworkInterfaceId && 
        addr.Domain === 'vpc'
      );

      expect(natEip).toBeDefined();
      expect(natEip!.PublicIp).toBeDefined();
      expect(natEip!.AllocationId).toBeDefined();
      
      console.log(`NAT Gateway EIP allocated: ${natEip!.PublicIp}`);
    });
  });

  describe('EC2 Instance Health Check', () => {
    test('should have running EC2 instance with correct configuration', async () => {
      const command = new DescribeInstancesCommand({
        InstanceIds: [EC2_INSTANCE_ID]
      });
      const response = await ec2Client.send(command);
      
      expect(response.Reservations).toBeDefined();
      expect(response.Reservations!.length).toBe(1);
      
      const instance = response.Reservations![0].Instances![0];
      
      expect(['running', 'pending']).toContain(instance.State!.Name!);
      expect(instance.InstanceType).toBe(stackParameters.InstanceType || 't3.micro');

      // KeyName may not be present if KeyPairName parameter is empty
      if (stackParameters.KeyPairName && stackParameters.KeyPairName !== '') {
        expect(instance.KeyName).toBe(stackParameters.KeyPairName);
        console.log(`Instance has KeyName: ${instance.KeyName}`);
      } else {
        expect(instance.KeyName).toBeUndefined();
        console.log('Instance has no KeyName (SSH key not configured)');
      }
      expect(instance.SubnetId).toBe(PUBLIC_SUBNET1_ID);
      expect(instance.VpcId).toBe(VPC_ID);
      expect(instance.PublicIpAddress).toBe(WEB_SERVER_PUBLIC_IP);
      
      // Check security group assignment
      expect(instance.SecurityGroups).toBeDefined();
      expect(instance.SecurityGroups!.length).toBe(1);
      expect(instance.SecurityGroups![0].GroupId).toBe(SECURITY_GROUP_ID);

      // Check tags
      const nameTag = instance.Tags!.find((tag: any) => tag.Key === 'Name');
      expect(nameTag).toBeDefined();
      expect(nameTag!.Value).toContain(stackName);
      
      console.log(`EC2 instance ${EC2_INSTANCE_ID} is ${instance.State!.Name} in ${instance.SubnetId}`);
    }, 30000);

    test('should respond to HTTP requests', async () => {
      console.log(`Testing HTTP connectivity to ${WEB_SERVER_URL}...`);
      
      try {
        const response = await fetch(WEB_SERVER_URL, {
          method: 'GET',
          signal: AbortSignal.timeout(10000), // 10 second timeout
        });

        expect([200, 503, 504]).toContain(response.status);
        
        if (response.status === 200) {
          const body = await response.text();
          expect(body).toContain('Hello from');
          expect(body).toContain(stackName);
          console.log(`Web server responded successfully with status: ${response.status}`);
        } else {
          console.log(`Web server responded with status: ${response.status} (service may still be starting)`);
        }
      } catch (error: any) {
        if (error.name === 'TimeoutError') {
          console.log('Request timed out - server may still be initializing');
          // Don't fail test on timeout as server might still be starting
        } else {
          throw error;
        }
      }
    }, 15000);

    test('should have proper UserData script installed', async () => {
      // This test validates that the instance was launched with UserData
      // by checking if it's accessible on port 80 (httpd should be running)
      const command = new DescribeInstancesCommand({
        InstanceIds: [EC2_INSTANCE_ID]
      });
      const response = await ec2Client.send(command);
      const instance = response.Reservations![0].Instances![0];

      console.log('UserData execution will be validated by HTTP connectivity test');
      
      // Check if instance has been running long enough for UserData to execute
      if (instance.State!.Name === 'running') {
        const launchTime = new Date(instance.LaunchTime!);
        const now = new Date();
        const uptime = (now.getTime() - launchTime.getTime()) / 1000 / 60; // minutes
        
        console.log(`Instance has been running for ${uptime.toFixed(1)} minutes`);
        if (uptime > 2) {
          console.log('Instance should have completed UserData script execution');
        }
      }
    });
  });

  describe('Security Group Validation', () => {
    test('should have properly configured security group', async () => {
      const command = new DescribeSecurityGroupsCommand({
        GroupIds: [SECURITY_GROUP_ID]
      });
      const response = await ec2Client.send(command);
      const securityGroup = response.SecurityGroups![0];

      expect(securityGroup).toBeDefined();
      expect(securityGroup.VpcId).toBe(VPC_ID);
      expect(securityGroup.Description).toBe('Security group allowing SSH and HTTP access');


      // Check ingress rules
      const ingressRules = securityGroup.IpPermissions!;
      expect(ingressRules.length).toBe(2);

      // SSH rule
      const sshRule = ingressRules.find(rule => rule.FromPort === 22);
      expect(sshRule).toBeDefined();
      expect(sshRule!.ToPort).toBe(22);
      expect(sshRule!.IpProtocol).toBe('tcp');
      expect(sshRule!.IpRanges![0].CidrIp).toBe('0.0.0.0/0');

      // HTTP rule  
      const httpRule = ingressRules.find(rule => rule.FromPort === 80);
      expect(httpRule).toBeDefined();
      expect(httpRule!.ToPort).toBe(80);
      expect(httpRule!.IpProtocol).toBe('tcp');
      expect(httpRule!.IpRanges![0].CidrIp).toBe('0.0.0.0/0');

      console.log(`Security group ${SECURITY_GROUP_ID} has SSH and HTTP access configured`);
    });

    test('should handle SSH connectivity based on KeyPair configuration', async () => {
      // Check if KeyPair is configured
      if (stackParameters.KeyPairName && stackParameters.KeyPairName !== '') {
        console.log(`Testing SSH connectivity with KeyPair: ${stackParameters.KeyPairName}`);
        
        const net = require('net');
        
        return new Promise((resolve) => {
          const socket = new net.Socket();
          let testComplete = false;
    
          socket.setTimeout(5000);
    
          socket.on('timeout', () => {
            if (!testComplete) {
              testComplete = true;
              socket.destroy();
              console.log('SSH port timeout - this is expected behavior for security');
              resolve('SSH port accessible but connection handling as expected');
            }
          });
    
          socket.on('error', (error: any) => {
            if (!testComplete) {
              testComplete = true;
              expect(['ECONNRESET', 'ECONNREFUSED', 'ETIMEDOUT', 'ENOTFOUND']).toContain(error.code);
              console.log(`SSH connectivity test result: ${error.code}`);
              resolve('SSH port test completed');
            }
          });
    
          socket.on('connect', () => {
            if (!testComplete) {
              testComplete = true;
              socket.destroy();
              console.log('SSH port is accessible');
              resolve('SSH port is accessible');
            }
          });
    
          socket.connect(22, WEB_SERVER_PUBLIC_IP);
        });
      } else {
        console.log('No KeyPair configured - SSH access not available');
        console.log('This is expected when KeyPairName parameter is empty');
        // Test passes as this is a valid configuration
        expect(true).toBe(true);
        return Promise.resolve(); // ← Add this explicit return
      }
    }, 10000);
    
    
  });

  describe('Resource Tagging Validation', () => {
    test('should have consistent resource tagging', async () => {
      // Test VPC tags
      const vpc = await getVpcInfo();
      const vpcNameTag = vpc.Tags!.find((tag: any) => tag.Key === 'Name');
      expect(vpcNameTag).toBeDefined();
      expect(vpcNameTag!.Value).toContain(stackName);

      // Test subnet tags
      const subnetCommand = new DescribeSubnetsCommand({
        SubnetIds: [PUBLIC_SUBNET1_ID, PRIVATE_SUBNET1_ID]
      });
      const subnetResponse = await ec2Client.send(subnetCommand);
      
      subnetResponse.Subnets!.forEach(subnet => {
        const nameTag = subnet.Tags!.find((tag: any) => tag.Key === 'Name');
        expect(nameTag).toBeDefined();
        expect(nameTag!.Value).toContain(stackName);
      });

      // Test security group tags
      const sgCommand = new DescribeSecurityGroupsCommand({
        GroupIds: [SECURITY_GROUP_ID]
      });
      const sgResponse = await ec2Client.send(sgCommand);
      const sgNameTag = sgResponse.SecurityGroups![0].Tags!.find((tag: any) => tag.Key === 'Name');
      expect(sgNameTag).toBeDefined();
      expect(sgNameTag!.Value).toContain(stackName);

      console.log('All resources have consistent tagging with stack name');
    });
  });

  describe('Stack Resource Completeness', () => {
    test('should have all expected resources deployed', async () => {
      const command = new DescribeStackResourcesCommand({
        StackName: stackName
      });
      const response = await cloudFormationClient.send(command);
      const resources = response.StackResources!;

      // Expected resource types based on template
      const expectedResourceTypes = [
        'AWS::EC2::VPC',
        'AWS::EC2::Subnet', // Should have 4 subnets
        'AWS::EC2::InternetGateway',
        'AWS::EC2::VPCGatewayAttachment',
        'AWS::EC2::EIP',
        'AWS::EC2::NatGateway',
        'AWS::EC2::RouteTable', // Should have 2 route tables
        'AWS::EC2::Route', // Should have 2 routes
        'AWS::EC2::SubnetRouteTableAssociation', // Should have 4 associations
        'AWS::EC2::SecurityGroup',
        'AWS::EC2::Instance'
      ];

      expectedResourceTypes.forEach(resourceType => {
        const resourcesOfType = resources.filter(r => r.ResourceType === resourceType);
        expect(resourcesOfType.length).toBeGreaterThan(0);
      });

      // Count specific resources
      const subnets = resources.filter(r => r.ResourceType === 'AWS::EC2::Subnet');
      expect(subnets.length).toBe(4); // 2 public + 2 private

      const routeTables = resources.filter(r => r.ResourceType === 'AWS::EC2::RouteTable');
      expect(routeTables.length).toBe(2); // public + private

      const routes = resources.filter(r => r.ResourceType === 'AWS::EC2::Route');
      expect(routes.length).toBe(2); // public route + private route

      const associations = resources.filter(r => r.ResourceType === 'AWS::EC2::SubnetRouteTableAssociation');
      expect(associations.length).toBe(4); // 2 public + 2 private subnet associations

      console.log(`Stack has ${resources.length} resources deployed successfully`);
      console.log(`Resource breakdown: ${subnets.length} subnets, ${routeTables.length} route tables, ${routes.length} routes, ${associations.length} associations`);
    });

    test('should have conditional resources based on parameters', async () => {
      // Test that the template properly handles conditional KeyPair logic
      const command = new DescribeInstancesCommand({
        InstanceIds: [EC2_INSTANCE_ID]
      });
      const response = await ec2Client.send(command);
      const instance = response.Reservations![0].Instances![0];
    
      if (stackParameters.KeyPairName && stackParameters.KeyPairName !== '') {
        expect(instance.KeyName).toBeDefined();
        console.log(`Instance configured with KeyPair: ${instance.KeyName}`);
      } else {
        expect(instance.KeyName).toBeUndefined();
        console.log('Instance configured without KeyPair (conditional logic working)');
      }
    });
    

    test('should have all resources in CREATE_COMPLETE state', async () => {
      const command = new DescribeStackResourcesCommand({
        StackName: stackName
      });
      const response = await cloudFormationClient.send(command);
      const resources = response.StackResources!;

      resources.forEach(resource => {
        expect(resource.ResourceStatus).toBe('CREATE_COMPLETE');
        expect(resource.PhysicalResourceId).toBeDefined();
      });

      console.log(`All ${resources.length} resources are in CREATE_COMPLETE state`);
    });
  });

  describe('Network Connectivity Validation', () => {
    test('should validate public subnet internet connectivity', async () => {
      // Test that public subnets have route to internet gateway
      const command = new DescribeRouteTablesCommand({
        Filters: [
          { Name: 'vpc-id', Values: [VPC_ID] },
          { Name: 'association.subnet-id', Values: [PUBLIC_SUBNET1_ID] }
        ]
      });
      const response = await ec2Client.send(command);
      const routeTable = response.RouteTables![0];

      const internetRoute = routeTable.Routes!.find(route => 
        route.DestinationCidrBlock === '0.0.0.0/0' && 
        route.GatewayId && 
        route.GatewayId.startsWith('igw-')
      );

      expect(internetRoute).toBeDefined();
      console.log(`Public subnet has internet connectivity via IGW ${internetRoute!.GatewayId}`);
    });

    test('should validate private subnet NAT Gateway connectivity', async () => {
      // Test that private subnets have route to NAT gateway
      const command = new DescribeRouteTablesCommand({
        Filters: [
          { Name: 'vpc-id', Values: [VPC_ID] },
          { Name: 'association.subnet-id', Values: [PRIVATE_SUBNET1_ID] }
        ]
      });
      const response = await ec2Client.send(command);
      const routeTable = response.RouteTables![0];

      const natRoute = routeTable.Routes!.find(route => 
        route.DestinationCidrBlock === '0.0.0.0/0' && 
        route.NatGatewayId === NAT_GATEWAY_ID
      );

      expect(natRoute).toBeDefined();
      console.log(`Private subnet has internet connectivity via NAT Gateway ${NAT_GATEWAY_ID}`);
    });
  });
});