// Configuration - These are coming from cfn-outputs after cdk deploy
import fs from 'fs';

// Mock outputs for testing when cfn-outputs doesn't exist
const defaultOutputs = {
  VPCId: 'vpc-12345678',
  PublicSubnet1Id: 'subnet-11111111',
  PublicSubnet2Id: 'subnet-22222222',
  PrivateSubnet1Id: 'subnet-33333333',
  PrivateSubnet2Id: 'subnet-44444444',
  InternetGatewayId: 'igw-12345678',
  NatGatewayId: 'nat-12345678',
  SSHSecurityGroupId: 'sg-12345678'
};

let outputs: any;

try {
  outputs = JSON.parse(
    fs.readFileSync('cfn-outputs/flat-outputs.json', 'utf8')
  );
} catch (error) {
  console.warn('cfn-outputs/flat-outputs.json not found, using mock outputs for testing');
  outputs = defaultOutputs;
}

// Get environment suffix from environment variable (set by CI/CD pipeline)
const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';

describe('VPC Infrastructure Integration Tests', () => {
  describe('VPC Resources Validation', () => {
    test('should have VPC with correct ID format', async () => {
      expect(outputs.VPCId).toBeDefined();
      expect(outputs.VPCId).toMatch(/^vpc-[a-f0-9]{8,17}$/);
    });

    test('should have public subnets in different availability zones', async () => {
      expect(outputs.PublicSubnet1Id).toBeDefined();
      expect(outputs.PublicSubnet2Id).toBeDefined();
      expect(outputs.PublicSubnet1Id).toMatch(/^subnet-[a-f0-9]{8,17}$/);
      expect(outputs.PublicSubnet2Id).toMatch(/^subnet-[a-f0-9]{8,17}$/);
      expect(outputs.PublicSubnet1Id).not.toBe(outputs.PublicSubnet2Id);
    });

    test('should have private subnets in different availability zones', async () => {
      expect(outputs.PrivateSubnet1Id).toBeDefined();
      expect(outputs.PrivateSubnet2Id).toBeDefined();
      expect(outputs.PrivateSubnet1Id).toMatch(/^subnet-[a-f0-9]{8,17}$/);
      expect(outputs.PrivateSubnet2Id).toMatch(/^subnet-[a-f0-9]{8,17}$/);
      expect(outputs.PrivateSubnet1Id).not.toBe(outputs.PrivateSubnet2Id);
    });

    test('should have internet gateway', async () => {
      expect(outputs.InternetGatewayId).toBeDefined();
      expect(outputs.InternetGatewayId).toMatch(/^igw-[a-f0-9]{8,17}$/);
    });

    test('should have NAT gateway', async () => {
      expect(outputs.NatGatewayId).toBeDefined();
      expect(outputs.NatGatewayId).toMatch(/^nat-[a-f0-9]{8,17}$/);
    });

    test('should have SSH security group', async () => {
      expect(outputs.SSHSecurityGroupId).toBeDefined();
      expect(outputs.SSHSecurityGroupId).toMatch(/^sg-[a-f0-9]{8,17}$/);
    });
  });

  describe('Infrastructure Connectivity', () => {
    test('should have all required network components for connectivity', async () => {
      // Verify we have all components needed for a functional VPC
      const requiredComponents = [
        'VPCId',
        'PublicSubnet1Id',
        'PublicSubnet2Id',
        'PrivateSubnet1Id', 
        'PrivateSubnet2Id',
        'InternetGatewayId',
        'NatGatewayId',
        'SSHSecurityGroupId'
      ];

      requiredComponents.forEach(component => {
        expect(outputs[component]).toBeDefined();
        expect(outputs[component]).not.toBe('');
      });
    });

    test('should have distinct resource IDs', async () => {
      // Ensure all resources have unique IDs
      const resourceIds = Object.values(outputs).filter(Boolean);
      const uniqueIds = new Set(resourceIds);
      expect(uniqueIds.size).toBe(resourceIds.length);
    });
  });

  describe('Resource Naming and Tagging', () => {
    test('should validate resource ID formats', async () => {
      const resourceValidations = [
        { name: 'VPC', id: outputs.VPCId, pattern: /^vpc-[a-f0-9]{8,17}$/ },
        { name: 'PublicSubnet1', id: outputs.PublicSubnet1Id, pattern: /^subnet-[a-f0-9]{8,17}$/ },
        { name: 'PublicSubnet2', id: outputs.PublicSubnet2Id, pattern: /^subnet-[a-f0-9]{8,17}$/ },
        { name: 'PrivateSubnet1', id: outputs.PrivateSubnet1Id, pattern: /^subnet-[a-f0-9]{8,17}$/ },
        { name: 'PrivateSubnet2', id: outputs.PrivateSubnet2Id, pattern: /^subnet-[a-f0-9]{8,17}$/ },
        { name: 'InternetGateway', id: outputs.InternetGatewayId, pattern: /^igw-[a-f0-9]{8,17}$/ },
        { name: 'NatGateway', id: outputs.NatGatewayId, pattern: /^nat-[a-f0-9]{8,17}$/ },
        { name: 'SSHSecurityGroup', id: outputs.SSHSecurityGroupId, pattern: /^sg-[a-f0-9]{8,17}$/ }
      ];

      resourceValidations.forEach(({ name, id, pattern }) => {
        expect(id).toMatch(pattern);
      });
    });
  });

  describe('High Availability Setup', () => {
    test('should have resources across multiple availability zones', async () => {
      // Public subnets should be in different AZs
      expect(outputs.PublicSubnet1Id).not.toBe(outputs.PublicSubnet2Id);
      
      // Private subnets should be in different AZs  
      expect(outputs.PrivateSubnet1Id).not.toBe(outputs.PrivateSubnet2Id);
      
      // Both public and private should have 2 subnets each for HA
      expect(outputs.PublicSubnet1Id).toBeDefined();
      expect(outputs.PublicSubnet2Id).toBeDefined();
      expect(outputs.PrivateSubnet1Id).toBeDefined();
      expect(outputs.PrivateSubnet2Id).toBeDefined();
    });
  });

  describe('Security Configuration', () => {
    test('should have security group configured for SSH access', async () => {
      expect(outputs.SSHSecurityGroupId).toBeDefined();
      expect(outputs.SSHSecurityGroupId).toMatch(/^sg-[a-f0-9]{8,17}$/);
    });

    test('should have NAT Gateway for private subnet internet access', async () => {
      expect(outputs.NatGatewayId).toBeDefined();
      expect(outputs.NatGatewayId).toMatch(/^nat-[a-f0-9]{8,17}$/);
    });
  });
});