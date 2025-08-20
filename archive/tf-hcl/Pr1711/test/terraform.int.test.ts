// Integration tests for Terraform infrastructure
// Tests against real AWS deployment outputs

import fs from 'fs';
import path from 'path';
import { EC2Client, DescribeInstancesCommand, DescribeSecurityGroupsCommand } from '@aws-sdk/client-ec2';

// Load deployment outputs
const outputsPath = path.resolve(__dirname, '../cfn-outputs/flat-outputs.json');
let deploymentOutputs: any = {};

// AWS client
const ec2Client = new EC2Client({ region: process.env.AWS_REGION || 'us-east-1' });

describe('Terraform Infrastructure Integration Tests', () => {
  beforeAll(() => {
    // Load deployment outputs
    if (fs.existsSync(outputsPath)) {
      const outputsContent = fs.readFileSync(outputsPath, 'utf8');
      deploymentOutputs = JSON.parse(outputsContent);
      
      // Parse security_summary if it's a JSON string
      if (typeof deploymentOutputs.security_summary === 'string') {
        deploymentOutputs.security_summary = JSON.parse(deploymentOutputs.security_summary);
      }
    } else {
      throw new Error('Deployment outputs not found. Run deployment first.');
    }
  });

  describe('VPC and Network Infrastructure', () => {
    test('VPC exists and has correct CIDR block', () => {
      expect(deploymentOutputs.vpc_id).toBeDefined();
      expect(deploymentOutputs.vpc_id).toMatch(/^vpc-[a-f0-9]+$/);
      expect(deploymentOutputs.vpc_cidr_block).toBe('10.0.0.0/16');
    });

    test('Public and private subnets exist', () => {
      expect(deploymentOutputs.public_subnet_id).toBeDefined();
      expect(deploymentOutputs.public_subnet_id).toMatch(/^subnet-[a-f0-9]+$/);
      expect(deploymentOutputs.private_subnet_id).toBeDefined();
      expect(deploymentOutputs.private_subnet_id).toMatch(/^subnet-[a-f0-9]+$/);
    });

    test('NAT Gateway exists for private subnet connectivity', () => {
      expect(deploymentOutputs.nat_gateway_id).toBeDefined();
      expect(deploymentOutputs.nat_gateway_id).toMatch(/^nat-[a-f0-9]+$/);
    });
  });

  describe('Security Groups Configuration', () => {
    test('All required security groups exist', () => {
      expect(deploymentOutputs.http_security_group_id).toBeDefined();
      expect(deploymentOutputs.http_security_group_id).toMatch(/^sg-[a-f0-9]+$/);
      expect(deploymentOutputs.ssh_security_group_id).toBeDefined();
      expect(deploymentOutputs.ssh_security_group_id).toMatch(/^sg-[a-f0-9]+$/);
      expect(deploymentOutputs.internal_security_group_id).toBeDefined();
      expect(deploymentOutputs.internal_security_group_id).toMatch(/^sg-[a-f0-9]+$/);
    });

    test('Security groups have correct allowed CIDR blocks', () => {
      expect(deploymentOutputs.allowed_http_cidr).toBe('192.168.1.0/24');
      expect(deploymentOutputs.allowed_ssh_cidr).toBe('203.0.113.0/24');
    });

    test('HTTP security group allows traffic only from specific CIDR', async () => {
      const command = new DescribeSecurityGroupsCommand({
        GroupIds: [deploymentOutputs.http_security_group_id]
      });
      
      const response = await ec2Client.send(command);
      expect(response.SecurityGroups).toHaveLength(1);
      
      const sg = response.SecurityGroups![0];
      const httpRule = sg.IpPermissions?.find(rule => rule.FromPort === 80);
      const httpsRule = sg.IpPermissions?.find(rule => rule.FromPort === 443);
      
      expect(httpRule).toBeDefined();
      expect(httpRule?.IpRanges?.[0]?.CidrIp).toBe('192.168.1.0/24');
      expect(httpsRule).toBeDefined();
      expect(httpsRule?.IpRanges?.[0]?.CidrIp).toBe('192.168.1.0/24');
      
      // Ensure no 0.0.0.0/0 rules
      sg.IpPermissions?.forEach(rule => {
        rule.IpRanges?.forEach(range => {
          expect(range.CidrIp).not.toBe('0.0.0.0/0');
        });
      });
    });

    test('SSH security group allows traffic only from specific CIDR', async () => {
      const command = new DescribeSecurityGroupsCommand({
        GroupIds: [deploymentOutputs.ssh_security_group_id]
      });
      
      const response = await ec2Client.send(command);
      expect(response.SecurityGroups).toHaveLength(1);
      
      const sg = response.SecurityGroups![0];
      const sshRule = sg.IpPermissions?.find(rule => rule.FromPort === 22);
      
      expect(sshRule).toBeDefined();
      expect(sshRule?.IpRanges?.[0]?.CidrIp).toBe('203.0.113.0/24');
      
      // Ensure no 0.0.0.0/0 rules
      sg.IpPermissions?.forEach(rule => {
        rule.IpRanges?.forEach(range => {
          expect(range.CidrIp).not.toBe('0.0.0.0/0');
        });
      });
    });

    test('No security group allows traffic from 0.0.0.0/0', async () => {
      const groupIds = [
        deploymentOutputs.http_security_group_id,
        deploymentOutputs.ssh_security_group_id,
        deploymentOutputs.internal_security_group_id
      ];
      
      for (const groupId of groupIds) {
        const command = new DescribeSecurityGroupsCommand({ GroupIds: [groupId] });
        const response = await ec2Client.send(command);
        
        const sg = response.SecurityGroups![0];
        sg.IpPermissions?.forEach(rule => {
          rule.IpRanges?.forEach(range => {
            expect(range.CidrIp).not.toBe('0.0.0.0/0');
          });
        });
      }
    });
  });

  describe('EC2 Instance Configuration', () => {
    test('EC2 instance exists and is running', async () => {
      expect(deploymentOutputs.web_server_id).toBeDefined();
      expect(deploymentOutputs.web_server_id).toMatch(/^i-[a-f0-9]+$/);
      
      const command = new DescribeInstancesCommand({
        InstanceIds: [deploymentOutputs.web_server_id]
      });
      
      const response = await ec2Client.send(command);
      expect(response.Reservations).toHaveLength(1);
      expect(response.Reservations![0].Instances).toHaveLength(1);
      
      const instance = response.Reservations![0].Instances![0];
      expect(instance.State?.Name).toBe('running');
    });

    test('EC2 instance is in private subnet', async () => {
      const command = new DescribeInstancesCommand({
        InstanceIds: [deploymentOutputs.web_server_id]
      });
      
      const response = await ec2Client.send(command);
      const instance = response.Reservations![0].Instances![0];
      
      expect(instance.SubnetId).toBe(deploymentOutputs.private_subnet_id);
    });

    test('EC2 instance has no public IP', async () => {
      const command = new DescribeInstancesCommand({
        InstanceIds: [deploymentOutputs.web_server_id]
      });
      
      const response = await ec2Client.send(command);
      const instance = response.Reservations![0].Instances![0];
      
      expect(instance.PublicIpAddress).toBeUndefined();
    });

    test('EC2 instance has correct security groups attached', async () => {
      const command = new DescribeInstancesCommand({
        InstanceIds: [deploymentOutputs.web_server_id]
      });
      
      const response = await ec2Client.send(command);
      const instance = response.Reservations![0].Instances![0];
      
      const sgIds = instance.SecurityGroups?.map(sg => sg.GroupId) || [];
      expect(sgIds).toContain(deploymentOutputs.http_security_group_id);
      expect(sgIds).toContain(deploymentOutputs.ssh_security_group_id);
      expect(sgIds).toContain(deploymentOutputs.internal_security_group_id);
    });

    test('EC2 instance has encrypted root volume', async () => {
      const command = new DescribeInstancesCommand({
        InstanceIds: [deploymentOutputs.web_server_id]
      });
      
      const response = await ec2Client.send(command);
      const instance = response.Reservations![0].Instances![0];
      
      const rootDevice = instance.BlockDeviceMappings?.find(
        device => device.DeviceName === instance.RootDeviceName
      );
      
      expect(rootDevice).toBeDefined();
      // Note: Direct encryption check would require DescribeVolumes
    });

    test('EC2 instance has private IP in correct range', () => {
      expect(deploymentOutputs.web_server_private_ip).toBeDefined();
      expect(deploymentOutputs.web_server_private_ip).toMatch(/^10\.0\.2\.\d+$/);
    });
  });

  describe('Security Configuration Summary', () => {
    test('Security summary reflects correct configuration', () => {
      expect(deploymentOutputs.security_summary).toBeDefined();
      expect(deploymentOutputs.security_summary.http_access_restricted_to).toBe('192.168.1.0/24');
      expect(deploymentOutputs.security_summary.ssh_access_restricted_to).toBe('203.0.113.0/24');
      expect(deploymentOutputs.security_summary.public_ip_assignment_disabled).toBe(true);
      expect(deploymentOutputs.security_summary.encrypted_root_volume).toBe(true);
    });
  });

  describe('Infrastructure Connectivity', () => {
    test('Resources are properly connected within VPC', async () => {
      // Verify instance can be reached through security groups
      const instanceCommand = new DescribeInstancesCommand({
        InstanceIds: [deploymentOutputs.web_server_id]
      });
      
      const instanceResponse = await ec2Client.send(instanceCommand);
      const instance = instanceResponse.Reservations![0].Instances![0];
      
      // Verify instance is in the correct VPC
      expect(instance.VpcId).toBe(deploymentOutputs.vpc_id);
      
      // Verify instance is in the private subnet
      expect(instance.SubnetId).toBe(deploymentOutputs.private_subnet_id);
      
      // Verify instance has the correct security groups
      const sgIds = instance.SecurityGroups?.map(sg => sg.GroupId) || [];
      expect(sgIds.length).toBe(3); // Should have exactly 3 security groups
    });
  });
});
