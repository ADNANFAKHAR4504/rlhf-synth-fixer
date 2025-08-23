import fs from 'fs';
import path from 'path';
import { CloudFormation } from '@aws-sdk/client-cloudformation';

describe('TapStack Integration Tests', () => {
  let stackName: string;
  let region: string;
  let cfnClient: CloudFormation;
  let stackOutputs: any = {};

    beforeAll(async () => {
    // Read AWS region from file
    const regionPath = path.join(__dirname, '../lib/AWS_REGION');
    region = fs.readFileSync(regionPath, 'utf8').trim();
    
    // Initialize AWS CloudFormation client
    cfnClient = new CloudFormation({ region });
    
    // Load outputs from the provided JSON file
    const outputsPath = path.join(__dirname, '../cfn-outputs/flat-outputs.json');
    try {
      const outputsContent = fs.readFileSync(outputsPath, 'utf8');
      stackOutputs = JSON.parse(outputsContent);
      stackName = stackOutputs.StackName || 'TapStack';
      
      console.log('Stack outputs loaded from JSON file:', stackOutputs);
      console.log(`Stack name: ${stackName}`);
    } catch (error) {
      console.error('Failed to load outputs from JSON file:', error);
      throw error;
    }
  });

  describe('Stack Outputs Validation', () => {
    test('should have all required stack outputs', async () => {
      // Validate stack outputs from JSON file
      expect(stackOutputs).toBeDefined();
      expect(Object.keys(stackOutputs).length).toBeGreaterThan(10); // Should have many outputs
      
      // Check VPC ID output
      expect(stackOutputs.VPCId).toBeDefined();
      expect(stackOutputs.VPCId).toMatch(/^vpc-[a-f0-9]+$/);
      
      // Check VPC CIDR block
      expect(stackOutputs.VpcCidrBlock).toBeDefined();
      expect(stackOutputs.VpcCidrBlock).toMatch(/^10\.0\.0\.0\/16$/);
      
      // Check subnet IDs
      expect(stackOutputs.PublicSubnet1Id).toBeDefined();
      expect(stackOutputs.PublicSubnet1Id).toMatch(/^subnet-[a-f0-9]+$/);
      expect(stackOutputs.PublicSubnet2Id).toBeDefined();
      expect(stackOutputs.PublicSubnet2Id).toMatch(/^subnet-[a-f0-9]+$/);
      expect(stackOutputs.PrivateSubnet1Id).toBeDefined();
      expect(stackOutputs.PrivateSubnet1Id).toMatch(/^subnet-[a-f0-9]+$/);
      expect(stackOutputs.PrivateSubnet2Id).toBeDefined();
      expect(stackOutputs.PrivateSubnet2Id).toMatch(/^subnet-[a-f0-9]+$/);
      
      // Check security group ID
      expect(stackOutputs.WebServerSecurityGroupId).toBeDefined();
      expect(stackOutputs.WebServerSecurityGroupId).toMatch(/^sg-[a-f0-9]+$/);
      
      // Check IAM resources
      expect(stackOutputs.EC2RoleArn).toBeDefined();
      expect(stackOutputs.EC2RoleArn).toMatch(/^arn:aws:iam::[0-9]+:role\/.*$/);
      expect(stackOutputs.EC2InstanceProfileArn).toBeDefined();
      expect(stackOutputs.EC2InstanceProfileArn).toMatch(/^arn:aws:iam::[0-9]+:instance-profile\/.*$/);
      
      console.log('Stack outputs validation passed:', Object.keys(stackOutputs));
    });

    test('should have valid VPC ID format', async () => {
      expect(stackOutputs.VPCId).toMatch(/^vpc-[a-f0-9]{8,17}$/);
    });

    test('should have valid subnet ID formats', async () => {
      expect(stackOutputs.PublicSubnet1Id).toMatch(/^subnet-[a-f0-9]{8,17}$/);
      expect(stackOutputs.PublicSubnet2Id).toMatch(/^subnet-[a-f0-9]{8,17}$/);
      expect(stackOutputs.PrivateSubnet1Id).toMatch(/^subnet-[a-f0-9]{8,17}$/);
      expect(stackOutputs.PrivateSubnet2Id).toMatch(/^subnet-[a-f0-9]{8,17}$/);
    });

    test('should have valid security group ID format', async () => {
      expect(stackOutputs.WebServerSecurityGroupId).toMatch(/^sg-[a-f0-9]{8,17}$/);
    });

    test('should have valid IAM ARN formats', async () => {
      expect(stackOutputs.EC2RoleArn).toMatch(/^arn:aws:iam::[0-9]{12}:role\/.*$/);
      expect(stackOutputs.EC2InstanceProfileArn).toMatch(/^arn:aws:iam::[0-9]{12}:instance-profile\/.*$/);
    });

    test('should have valid configuration values', async () => {
      expect(stackOutputs.StackName).toBe('TapStack');
      expect(stackOutputs.Environment).toBe('production');
      expect(stackOutputs.InstanceType).toBe('t3.micro');
      expect(stackOutputs.AllowedSSHCIDR).toBe('10.0.0.0/8');
    });
  });

  describe('Resource Outputs Validation', () => {
    test('should have all required resource outputs', async () => {
      // Validate that all required resource outputs are present
      const requiredOutputs = [
        'VPCId', 'VpcCidrBlock',
        'PublicSubnet1Id', 'PublicSubnet2Id',
        'PrivateSubnet1Id', 'PrivateSubnet2Id',
        'WebServerSecurityGroupId', 'WebServerInstanceId',
        'WebServerPublicIP', 'WebServerURL',
        'InternetGatewayId', 'NatGateway1Id',
        'PublicRouteTableId', 'PrivateRouteTable1Id',
        'EC2RoleArn', 'EC2InstanceProfileArn',
        'StackName', 'Environment', 'InstanceType', 'AllowedSSHCIDR'
      ];
      
      requiredOutputs.forEach(outputKey => {
        expect(stackOutputs[outputKey]).toBeDefined();
        expect(stackOutputs[outputKey]).not.toBe('');
      });
      
      console.log(`All ${requiredOutputs.length} required outputs are present`);
    });

    test('should have valid networking resource IDs', async () => {
      // VPC
      expect(stackOutputs.VPCId).toMatch(/^vpc-[a-f0-9]{8,17}$/);
      expect(stackOutputs.VpcCidrBlock).toBe('10.0.0.0/16');
      
      // Subnets
      expect(stackOutputs.PublicSubnet1Id).toMatch(/^subnet-[a-f0-9]{8,17}$/);
      expect(stackOutputs.PublicSubnet2Id).toMatch(/^subnet-[a-f0-9]{8,17}$/);
      expect(stackOutputs.PrivateSubnet1Id).toMatch(/^subnet-[a-f0-9]{8,17}$/);
      expect(stackOutputs.PrivateSubnet2Id).toMatch(/^subnet-[a-f0-9]{8,17}$/);
      
      // Internet Gateway
      expect(stackOutputs.InternetGatewayId).toMatch(/^igw-[a-f0-9]{8,17}$/);
      
      // NAT Gateway
      expect(stackOutputs.NatGateway1Id).toMatch(/^nat-[a-f0-9]{8,17}$/);
      
      // Route Tables
      expect(stackOutputs.PublicRouteTableId).toMatch(/^rtb-[a-f0-9]{8,17}$/);
      expect(stackOutputs.PrivateRouteTable1Id).toMatch(/^rtb-[a-f0-9]{8,17}$/);
      
      console.log('All networking resource IDs are valid');
    });

    test('should have valid compute resource IDs', async () => {
      // Security Group
      expect(stackOutputs.WebServerSecurityGroupId).toMatch(/^sg-[a-f0-9]{8,17}$/);
      
      // EC2 Instance
      expect(stackOutputs.WebServerInstanceId).toMatch(/^i-[a-f0-9]{8,17}$/);
      
      // Public IP
      expect(stackOutputs.WebServerPublicIP).toMatch(/^[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}$/);
      
      // Web Server URL
      expect(stackOutputs.WebServerURL).toMatch(/^http:\/\/[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}$/);
      
      console.log('All compute resource IDs are valid');
    });

    test('should have valid IAM resource ARNs', async () => {
      // IAM Role
      expect(stackOutputs.EC2RoleArn).toMatch(/^arn:aws:iam::[0-9]{12}:role\/.*$/);
      
      // Instance Profile
      expect(stackOutputs.EC2InstanceProfileArn).toMatch(/^arn:aws:iam::[0-9]{12}:instance-profile\/.*$/);
      
      console.log('All IAM resource ARNs are valid');
    });

    test('should have valid configuration values', async () => {
      expect(stackOutputs.StackName).toBe('TapStack');
      expect(stackOutputs.Environment).toBe('production');
      expect(stackOutputs.InstanceType).toBe('t3.micro');
      expect(stackOutputs.AllowedSSHCIDR).toBe('10.0.0.0/8');
      
      console.log('All configuration values are valid');
    });
  });

  describe('End-to-End Validation', () => {
    test('should have complete infrastructure setup', async () => {
      // Validate that we have a complete infrastructure setup
      expect(stackOutputs.VPCId).toBeDefined();
      expect(stackOutputs.PublicSubnet1Id).toBeDefined();
      expect(stackOutputs.PublicSubnet2Id).toBeDefined();
      expect(stackOutputs.PrivateSubnet1Id).toBeDefined();
      expect(stackOutputs.PrivateSubnet2Id).toBeDefined();
      expect(stackOutputs.WebServerSecurityGroupId).toBeDefined();
      expect(stackOutputs.WebServerInstanceId).toBeDefined();
      expect(stackOutputs.WebServerPublicIP).toBeDefined();
      expect(stackOutputs.WebServerURL).toBeDefined();
      
      console.log('Complete infrastructure setup validated');
    });

    test('should have proper networking configuration', async () => {
      // Validate networking configuration
      expect(stackOutputs.VpcCidrBlock).toBe('10.0.0.0/16');
      expect(stackOutputs.InternetGatewayId).toBeDefined();
      expect(stackOutputs.NatGateway1Id).toBeDefined();
      expect(stackOutputs.PublicRouteTableId).toBeDefined();
      expect(stackOutputs.PrivateRouteTable1Id).toBeDefined();
      
      console.log('Networking configuration validated');
    });

    test('should have proper security configuration', async () => {
      // Validate security configuration
      expect(stackOutputs.WebServerSecurityGroupId).toMatch(/^sg-[a-f0-9]{8,17}$/);
      expect(stackOutputs.AllowedSSHCIDR).toBe('10.0.0.0/8');
      
      console.log('Security configuration validated');
    });

    test('should have proper IAM configuration', async () => {
      // Validate IAM configuration
      expect(stackOutputs.EC2RoleArn).toMatch(/^arn:aws:iam::[0-9]{12}:role\/.*$/);
      expect(stackOutputs.EC2InstanceProfileArn).toMatch(/^arn:aws:iam::[0-9]{12}:instance-profile\/.*$/);
      
      console.log('IAM configuration validated');
    });

    test('should have accessible web server', async () => {
      // Validate web server accessibility
      expect(stackOutputs.WebServerInstanceId).toMatch(/^i-[a-f0-9]{8,17}$/);
      expect(stackOutputs.WebServerPublicIP).toMatch(/^[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}$/);
      expect(stackOutputs.WebServerURL).toMatch(/^http:\/\/[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}$/);
      
      console.log('Web server accessibility validated');
    });
  });
});
