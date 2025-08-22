import { EC2Client, DescribeVpcsCommand, DescribeSubnetsCommand, DescribeInstancesCommand, DescribeSecurityGroupsCommand, DescribeInternetGatewaysCommand, DescribeRouteTablesCommand } from '@aws-sdk/client-ec2';
import fs from 'fs';
import path from 'path';

describe('TAP Infrastructure Integration Tests', () => {
  let outputs;
  let ec2Client;

  beforeAll(() => {
    // Read the deployment outputs
    const outputsPath = path.join(process.cwd(), 'cfn-outputs', 'flat-outputs.json');
    if (!fs.existsSync(outputsPath)) {
      throw new Error('No deployment outputs found. Please deploy the stack first.');
    }
    outputs = JSON.parse(fs.readFileSync(outputsPath, 'utf8'));
    
    // Initialize AWS SDK client
    ec2Client = new EC2Client({ region: 'us-east-1' });
  });

  describe('VPC Infrastructure', () => {
    test('VPC should exist and be available', async () => {
      const command = new DescribeVpcsCommand({
        VpcIds: [outputs.vpcId]
      });
      
      const response = await ec2Client.send(command);
      expect(response.Vpcs).toHaveLength(1);
      
      const vpc = response.Vpcs[0];
      expect(vpc.State).toBe('available');
      expect(vpc.CidrBlock).toBe('10.0.0.0/16');
      // DNS settings might be returned as booleans or might not be included in the response
      // We check if they are defined and if so, verify they are true
      if (vpc.EnableDnsHostnames !== undefined) {
        expect(vpc.EnableDnsHostnames).toBe(true);
      }
      if (vpc.EnableDnsSupport !== undefined) {
        expect(vpc.EnableDnsSupport).toBe(true);
      }
    });

    test('VPC should have correct tags', async () => {
      const command = new DescribeVpcsCommand({
        VpcIds: [outputs.vpcId]
      });
      
      const response = await ec2Client.send(command);
      const vpc = response.Vpcs[0];
      const tags = vpc.Tags || [];
      
      const projectTag = tags.find(t => t.Key === 'Project');
      expect(projectTag).toBeDefined();
      expect(projectTag.Value).toBe('TerraformSetup');
      
      const nameTag = tags.find(t => t.Key === 'Name');
      expect(nameTag).toBeDefined();
      expect(nameTag.Value).toMatch(/^tf-vpc-/);
    });
  });

  describe('Subnet Configuration', () => {
    test('Both subnets should exist and be available', async () => {
      const command = new DescribeSubnetsCommand({
        SubnetIds: [outputs.publicSubnet1Id, outputs.publicSubnet2Id]
      });
      
      const response = await ec2Client.send(command);
      expect(response.Subnets).toHaveLength(2);
      
      response.Subnets.forEach(subnet => {
        expect(subnet.State).toBe('available');
        expect(subnet.VpcId).toBe(outputs.vpcId);
        expect(subnet.MapPublicIpOnLaunch).toBe(true);
      });
    });

    test('Subnets should be in different availability zones', async () => {
      const command = new DescribeSubnetsCommand({
        SubnetIds: [outputs.publicSubnet1Id, outputs.publicSubnet2Id]
      });
      
      const response = await ec2Client.send(command);
      const azs = response.Subnets.map(s => s.AvailabilityZone);
      expect(new Set(azs).size).toBe(2);
    });

    test('Subnets should have correct CIDR blocks', async () => {
      const command = new DescribeSubnetsCommand({
        SubnetIds: [outputs.publicSubnet1Id, outputs.publicSubnet2Id]
      });
      
      const response = await ec2Client.send(command);
      const cidrBlocks = response.Subnets.map(s => s.CidrBlock).sort();
      expect(cidrBlocks).toEqual(['10.0.1.0/24', '10.0.2.0/24']);
    });

    test('Subnets should have correct tags', async () => {
      const command = new DescribeSubnetsCommand({
        SubnetIds: [outputs.publicSubnet1Id, outputs.publicSubnet2Id]
      });
      
      const response = await ec2Client.send(command);
      response.Subnets.forEach(subnet => {
        const tags = subnet.Tags || [];
        const projectTag = tags.find(t => t.Key === 'Project');
        expect(projectTag).toBeDefined();
        expect(projectTag.Value).toBe('TerraformSetup');
        
        const nameTag = tags.find(t => t.Key === 'Name');
        expect(nameTag).toBeDefined();
        expect(nameTag.Value).toMatch(/^tf-public-subnet-/);
      });
    });
  });

  describe('EC2 Instance', () => {
    test('EC2 instance should exist and be running', async () => {
      const command = new DescribeInstancesCommand({
        InstanceIds: [outputs.instanceId]
      });
      
      const response = await ec2Client.send(command);
      expect(response.Reservations).toHaveLength(1);
      expect(response.Reservations[0].Instances).toHaveLength(1);
      
      const instance = response.Reservations[0].Instances[0];
      expect(instance.State.Name).toBe('running');
      expect(instance.InstanceType).toBe('t3.micro');
    });

    test('EC2 instance should have public IP', async () => {
      const command = new DescribeInstancesCommand({
        InstanceIds: [outputs.instanceId]
      });
      
      const response = await ec2Client.send(command);
      const instance = response.Reservations[0].Instances[0];
      
      expect(instance.PublicIpAddress).toBeDefined();
      expect(instance.PublicIpAddress).toBe(outputs.publicIp);
    });

    test('EC2 instance should be in correct subnet', async () => {
      const command = new DescribeInstancesCommand({
        InstanceIds: [outputs.instanceId]
      });
      
      const response = await ec2Client.send(command);
      const instance = response.Reservations[0].Instances[0];
      
      expect(instance.SubnetId).toBe(outputs.publicSubnet1Id);
      expect(instance.VpcId).toBe(outputs.vpcId);
    });

    test('EC2 instance should have correct tags', async () => {
      const command = new DescribeInstancesCommand({
        InstanceIds: [outputs.instanceId]
      });
      
      const response = await ec2Client.send(command);
      const instance = response.Reservations[0].Instances[0];
      const tags = instance.Tags || [];
      
      const projectTag = tags.find(t => t.Key === 'Project');
      expect(projectTag).toBeDefined();
      expect(projectTag.Value).toBe('TerraformSetup');
      
      const nameTag = tags.find(t => t.Key === 'Name');
      expect(nameTag).toBeDefined();
      expect(nameTag.Value).toMatch(/^tf-ec2-instance-/);
    });

    test('EC2 instance should use Amazon Linux 2023 AMI', async () => {
      const command = new DescribeInstancesCommand({
        InstanceIds: [outputs.instanceId]
      });
      
      const response = await ec2Client.send(command);
      const instance = response.Reservations[0].Instances[0];
      
      // Verify it's using an Amazon Linux AMI
      expect(instance.ImageId).toMatch(/^ami-/);
      expect(instance.PlatformDetails).toContain('Linux');
    });
  });

  describe('Security Group', () => {
    test('Security group should exist with SSH access', async () => {
      // First get the security group ID from the instance
      const instanceCommand = new DescribeInstancesCommand({
        InstanceIds: [outputs.instanceId]
      });
      
      const instanceResponse = await ec2Client.send(instanceCommand);
      const instance = instanceResponse.Reservations[0].Instances[0];
      const securityGroupId = instance.SecurityGroups[0].GroupId;
      
      // Now describe the security group
      const sgCommand = new DescribeSecurityGroupsCommand({
        GroupIds: [securityGroupId]
      });
      
      const sgResponse = await ec2Client.send(sgCommand);
      expect(sgResponse.SecurityGroups).toHaveLength(1);
      
      const sg = sgResponse.SecurityGroups[0];
      expect(sg.VpcId).toBe(outputs.vpcId);
      
      // Check ingress rules
      const sshRule = sg.IpPermissions.find(rule => 
        rule.FromPort === 22 && rule.ToPort === 22 && rule.IpProtocol === 'tcp'
      );
      expect(sshRule).toBeDefined();
      expect(sshRule.IpRanges).toContainEqual(
        expect.objectContaining({ CidrIp: '0.0.0.0/0' })
      );
    });

    test('Security group should have correct tags', async () => {
      const instanceCommand = new DescribeInstancesCommand({
        InstanceIds: [outputs.instanceId]
      });
      
      const instanceResponse = await ec2Client.send(instanceCommand);
      const instance = instanceResponse.Reservations[0].Instances[0];
      const securityGroupId = instance.SecurityGroups[0].GroupId;
      
      const sgCommand = new DescribeSecurityGroupsCommand({
        GroupIds: [securityGroupId]
      });
      
      const sgResponse = await ec2Client.send(sgCommand);
      const sg = sgResponse.SecurityGroups[0];
      const tags = sg.Tags || [];
      
      const projectTag = tags.find(t => t.Key === 'Project');
      expect(projectTag).toBeDefined();
      expect(projectTag.Value).toBe('TerraformSetup');
      
      const nameTag = tags.find(t => t.Key === 'Name');
      expect(nameTag).toBeDefined();
      expect(nameTag.Value).toMatch(/^tf-ec2-sg-/);
    });
  });

  describe('Internet Gateway', () => {
    test('Internet Gateway should exist and be attached to VPC', async () => {
      const command = new DescribeInternetGatewaysCommand({
        Filters: [
          {
            Name: 'attachment.vpc-id',
            Values: [outputs.vpcId]
          }
        ]
      });
      
      const response = await ec2Client.send(command);
      expect(response.InternetGateways).toHaveLength(1);
      
      const igw = response.InternetGateways[0];
      const attachment = igw.Attachments.find(a => a.VpcId === outputs.vpcId);
      expect(attachment).toBeDefined();
      expect(attachment.State).toBe('available');
    });

    test('Internet Gateway should have correct tags', async () => {
      const command = new DescribeInternetGatewaysCommand({
        Filters: [
          {
            Name: 'attachment.vpc-id',
            Values: [outputs.vpcId]
          }
        ]
      });
      
      const response = await ec2Client.send(command);
      const igw = response.InternetGateways[0];
      const tags = igw.Tags || [];
      
      const projectTag = tags.find(t => t.Key === 'Project');
      expect(projectTag).toBeDefined();
      expect(projectTag.Value).toBe('TerraformSetup');
      
      const nameTag = tags.find(t => t.Key === 'Name');
      expect(nameTag).toBeDefined();
      expect(nameTag.Value).toMatch(/^tf-igw-/);
    });
  });

  describe('Route Tables', () => {
    test('Route table should have route to Internet Gateway', async () => {
      const command = new DescribeRouteTablesCommand({
        Filters: [
          {
            Name: 'vpc-id',
            Values: [outputs.vpcId]
          },
          {
            Name: 'tag:Name',
            Values: ['tf-public-rt-*']
          }
        ]
      });
      
      const response = await ec2Client.send(command);
      const publicRouteTable = response.RouteTables.find(rt => {
        const nameTag = rt.Tags?.find(t => t.Key === 'Name');
        return nameTag && nameTag.Value.startsWith('tf-public-rt-');
      });
      
      expect(publicRouteTable).toBeDefined();
      
      // Check for internet route
      const internetRoute = publicRouteTable.Routes.find(r => 
        r.DestinationCidrBlock === '0.0.0.0/0' && r.GatewayId && r.GatewayId.startsWith('igw-')
      );
      expect(internetRoute).toBeDefined();
      expect(internetRoute.State).toBe('active');
    });

    test('Both subnets should be associated with public route table', async () => {
      const command = new DescribeRouteTablesCommand({
        Filters: [
          {
            Name: 'vpc-id',
            Values: [outputs.vpcId]
          },
          {
            Name: 'association.subnet-id',
            Values: [outputs.publicSubnet1Id, outputs.publicSubnet2Id]
          }
        ]
      });
      
      const response = await ec2Client.send(command);
      
      // Get all subnet associations from route tables
      const associatedSubnets = new Set();
      response.RouteTables.forEach(rt => {
        rt.Associations?.forEach(assoc => {
          if (assoc.SubnetId) {
            associatedSubnets.add(assoc.SubnetId);
          }
        });
      });
      
      expect(associatedSubnets.has(outputs.publicSubnet1Id)).toBe(true);
      expect(associatedSubnets.has(outputs.publicSubnet2Id)).toBe(true);
    });
  });

  describe('End-to-End Connectivity', () => {
    test('All networking components should be properly connected', async () => {
      // Verify VPC exists
      const vpcCommand = new DescribeVpcsCommand({
        VpcIds: [outputs.vpcId]
      });
      const vpcResponse = await ec2Client.send(vpcCommand);
      expect(vpcResponse.Vpcs).toHaveLength(1);
      
      // Verify subnets are in VPC
      const subnetCommand = new DescribeSubnetsCommand({
        SubnetIds: [outputs.publicSubnet1Id, outputs.publicSubnet2Id]
      });
      const subnetResponse = await ec2Client.send(subnetCommand);
      subnetResponse.Subnets.forEach(subnet => {
        expect(subnet.VpcId).toBe(outputs.vpcId);
      });
      
      // Verify instance is in correct subnet and VPC
      const instanceCommand = new DescribeInstancesCommand({
        InstanceIds: [outputs.instanceId]
      });
      const instanceResponse = await ec2Client.send(instanceCommand);
      const instance = instanceResponse.Reservations[0].Instances[0];
      expect(instance.VpcId).toBe(outputs.vpcId);
      expect(instance.SubnetId).toBe(outputs.publicSubnet1Id);
      
      // Verify Internet Gateway is attached
      const igwCommand = new DescribeInternetGatewaysCommand({
        Filters: [
          {
            Name: 'attachment.vpc-id',
            Values: [outputs.vpcId]
          }
        ]
      });
      const igwResponse = await ec2Client.send(igwCommand);
      expect(igwResponse.InternetGateways).toHaveLength(1);
    });

    test('Resource naming convention should use tf- prefix', async () => {
      // Check VPC name
      const vpcCommand = new DescribeVpcsCommand({
        VpcIds: [outputs.vpcId]
      });
      const vpcResponse = await ec2Client.send(vpcCommand);
      const vpcName = vpcResponse.Vpcs[0].Tags?.find(t => t.Key === 'Name')?.Value;
      expect(vpcName).toMatch(/^tf-vpc-/);
      
      // Check subnet names
      const subnetCommand = new DescribeSubnetsCommand({
        SubnetIds: [outputs.publicSubnet1Id, outputs.publicSubnet2Id]
      });
      const subnetResponse = await ec2Client.send(subnetCommand);
      subnetResponse.Subnets.forEach(subnet => {
        const name = subnet.Tags?.find(t => t.Key === 'Name')?.Value;
        expect(name).toMatch(/^tf-public-subnet-/);
      });
      
      // Check instance name
      const instanceCommand = new DescribeInstancesCommand({
        InstanceIds: [outputs.instanceId]
      });
      const instanceResponse = await ec2Client.send(instanceCommand);
      const instanceName = instanceResponse.Reservations[0].Instances[0].Tags?.find(t => t.Key === 'Name')?.Value;
      expect(instanceName).toMatch(/^tf-ec2-instance-/);
    });
  });
});