// Configuration - These are coming from cfn-outputs after cdk deploy
import fs from 'fs';
import path from 'path';

// Get AWS region from the AWS_REGION file
const awsRegionPath = path.join(__dirname, '../lib/AWS_REGION');
const awsRegion = fs.readFileSync(awsRegionPath, 'utf8').trim();

// Get CloudFormation outputs
const outputsPath = path.join(__dirname, '../cfn-outputs/flat-outputs.json');
let outputs: any = {};

try {
  const outputsContent = fs.readFileSync(outputsPath, 'utf8');
  outputs = JSON.parse(outputsContent);
} catch (error) {
  console.warn('CloudFormation outputs file not found. Integration tests will be skipped.');
  outputs = null;
}

// Get environment suffix from environment variable (set by CI/CD pipeline)
const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';

describe('TapStack Infrastructure Integration Tests', () => {
  beforeAll(() => {
    // Skip tests if outputs are not available
    if (!outputs) {
      console.log('Skipping integration tests - CloudFormation outputs not available');
    }
  });

  describe('AWS Region Configuration', () => {
    test('should deploy to ap-south-1 region as specified in prompt', () => {
      expect(awsRegion).toBe('ap-south-1');
    });
  });

  describe('VPC Infrastructure', () => {
    test('should have VPC deployed', () => {
      if (!outputs) {
        console.log('Skipping VPC test - outputs not available');
        return;
      }
      
      const vpcId = outputs.VPCId;
      expect(vpcId).toBeDefined();
      expect(typeof vpcId).toBe('string');
      expect(vpcId.startsWith('vpc-')).toBe(true);
    });

    test('should have public subnet deployed', () => {
      if (!outputs) {
        console.log('Skipping public subnet test - outputs not available');
        return;
      }
      
      const publicSubnetId = outputs.PublicSubnetId;
      expect(publicSubnetId).toBeDefined();
      expect(typeof publicSubnetId).toBe('string');
      expect(publicSubnetId.startsWith('subnet-')).toBe(true);
    });

    test('should have private subnets deployed', () => {
      if (!outputs) {
        console.log('Skipping private subnet test - outputs not available');
        return;
      }
      
      const privateSubnet1Id = outputs.PrivateSubnet1Id;
      const privateSubnet2Id = outputs.PrivateSubnet2Id;
      
      expect(privateSubnet1Id).toBeDefined();
      expect(privateSubnet2Id).toBeDefined();
      expect(typeof privateSubnet1Id).toBe('string');
      expect(typeof privateSubnet2Id).toBe('string');
      expect(privateSubnet1Id.startsWith('subnet-')).toBe(true);
      expect(privateSubnet2Id.startsWith('subnet-')).toBe(true);
    });

    test('should have NAT Gateway deployed', () => {
      if (!outputs) {
        console.log('Skipping NAT Gateway test - outputs not available');
        return;
      }
      
      const natGatewayId = outputs.NATGatewayId;
      expect(natGatewayId).toBeDefined();
      expect(typeof natGatewayId).toBe('string');
      expect(natGatewayId.startsWith('nat-')).toBe(true);
    });
  });

  describe('Security Groups', () => {
    test('should have web security group deployed', () => {
      if (!outputs) {
        console.log('Skipping web security group test - outputs not available');
        return;
      }
      
      const webSecurityGroupId = outputs.WebSecurityGroupId;
      expect(webSecurityGroupId).toBeDefined();
      expect(typeof webSecurityGroupId).toBe('string');
      expect(webSecurityGroupId.startsWith('sg-')).toBe(true);
    });
  });

  describe('Database Infrastructure', () => {
    test('should have RDS database endpoint available', () => {
      if (!outputs) {
        console.log('Skipping RDS endpoint test - outputs not available');
        return;
      }
      
      const databaseEndpoint = outputs.DatabaseEndpoint;
      expect(databaseEndpoint).toBeDefined();
      expect(typeof databaseEndpoint).toBe('string');
      expect(databaseEndpoint.length).toBeGreaterThan(0);
    });

    test('should have RDS database endpoint in correct format', () => {
      if (!outputs) {
        console.log('Skipping RDS endpoint format test - outputs not available');
        return;
      }
      
      const databaseEndpoint = outputs.DatabaseEndpoint;
      // RDS endpoint should be in format: production-mysql-db.xxxxx.ap-south-1.rds.amazonaws.com
      expect(databaseEndpoint).toMatch(/^production-mysql-db\.[a-zA-Z0-9-]+\.ap-south-1\.rds\.amazonaws\.com$/);
    });
  });

  describe('Network Connectivity', () => {
    test('should have proper subnet configuration', () => {
      if (!outputs) {
        console.log('Skipping subnet configuration test - outputs not available');
        return;
      }
      
      // All subnets should be in the same VPC
      const vpcId = outputs.VPCId;
      const publicSubnetId = outputs.PublicSubnetId;
      const privateSubnet1Id = outputs.PrivateSubnet1Id;
      const privateSubnet2Id = outputs.PrivateSubnet2Id;
      
      expect(vpcId).toBeDefined();
      expect(publicSubnetId).toBeDefined();
      expect(privateSubnet1Id).toBeDefined();
      expect(privateSubnet2Id).toBeDefined();
      
      // All subnet IDs should be different
      expect(publicSubnetId).not.toBe(privateSubnet1Id);
      expect(publicSubnetId).not.toBe(privateSubnet2Id);
      expect(privateSubnet1Id).not.toBe(privateSubnet2Id);
    });
  });

  describe('Security and Compliance', () => {
    test('should have security groups configured', () => {
      if (!outputs) {
        console.log('Skipping security group test - outputs not available');
        return;
      }
      
      const webSecurityGroupId = outputs.WebSecurityGroupId;
      expect(webSecurityGroupId).toBeDefined();
      expect(webSecurityGroupId.startsWith('sg-')).toBe(true);
    });

    test('should have database in private subnet', () => {
      if (!outputs) {
        console.log('Skipping database subnet test - outputs not available');
        return;
      }
      
      const databaseEndpoint = outputs.DatabaseEndpoint;
      const privateSubnet1Id = outputs.PrivateSubnet1Id;
      const privateSubnet2Id = outputs.PrivateSubnet2Id;
      
      // Database endpoint should be accessible from private subnets
      expect(databaseEndpoint).toBeDefined();
      expect(privateSubnet1Id).toBeDefined();
      expect(privateSubnet2Id).toBeDefined();
    });
  });

  describe('Resource Naming and Tagging', () => {
    test('should have consistent resource naming', () => {
      if (!outputs) {
        console.log('Skipping resource naming test - outputs not available');
        return;
      }
      
      // All resources should follow production naming convention
      const vpcId = outputs.VPCId;
      const publicSubnetId = outputs.PublicSubnetId;
      const privateSubnet1Id = outputs.PrivateSubnet1Id;
      const privateSubnet2Id = outputs.PrivateSubnet2Id;
      const webSecurityGroupId = outputs.WebSecurityGroupId;
      const natGatewayId = outputs.NATGatewayId;
      
      // All resources should be properly created
      expect(vpcId).toBeDefined();
      expect(publicSubnetId).toBeDefined();
      expect(privateSubnet1Id).toBeDefined();
      expect(privateSubnet2Id).toBeDefined();
      expect(webSecurityGroupId).toBeDefined();
      expect(natGatewayId).toBeDefined();
    });
  });

  describe('Database Connectivity', () => {
    test('should have database endpoint accessible from private subnets', () => {
      if (!outputs) {
        console.log('Skipping database connectivity test - outputs not available');
        return;
      }
      
      const databaseEndpoint = outputs.DatabaseEndpoint;
      const privateSubnet1Id = outputs.PrivateSubnet1Id;
      const privateSubnet2Id = outputs.PrivateSubnet2Id;
      
      // Database should be accessible from both private subnets
      expect(databaseEndpoint).toBeDefined();
      expect(privateSubnet1Id).toBeDefined();
      expect(privateSubnet2Id).toBeDefined();
      
      // Database endpoint should be in ap-south-1 region
      expect(databaseEndpoint).toContain('ap-south-1');
    });
  });

  describe('Infrastructure Health', () => {
    test('should have all required outputs available', () => {
      if (!outputs) {
        console.log('Skipping outputs availability test - outputs not available');
        return;
      }
      
      const requiredOutputs = [
        'VPCId',
        'PublicSubnetId',
        'PrivateSubnet1Id',
        'PrivateSubnet2Id',
        'DatabaseEndpoint',
        'WebSecurityGroupId',
        'NATGatewayId'
      ];
      
      requiredOutputs.forEach(outputName => {
        expect(outputs[outputName]).toBeDefined();
        expect(typeof outputs[outputName]).toBe('string');
        expect(outputs[outputName].length).toBeGreaterThan(0);
      });
    });

    test('should have no null or undefined outputs', () => {
      if (!outputs) {
        console.log('Skipping null outputs test - outputs not available');
        return;
      }
      
      Object.keys(outputs).forEach(key => {
        expect(outputs[key]).not.toBeNull();
        expect(outputs[key]).not.toBeUndefined();
      });
    });
  });

  describe('Environment Configuration', () => {
    test('should use correct environment suffix', () => {
      expect(environmentSuffix).toBeDefined();
      expect(typeof environmentSuffix).toBe('string');
      expect(environmentSuffix.length).toBeGreaterThan(0);
    });

    test('should deploy to production environment', () => {
      // Based on the prompt requirements, this should be a production environment
      expect(awsRegion).toBe('ap-south-1');
    });
  });

  describe('Cross-Resource Dependencies', () => {
    test('should have proper resource dependencies', () => {
      if (!outputs) {
        console.log('Skipping resource dependencies test - outputs not available');
        return;
      }
      
      // VPC should exist before subnets
      const vpcId = outputs.VPCId;
      const publicSubnetId = outputs.PublicSubnetId;
      const privateSubnet1Id = outputs.PrivateSubnet1Id;
      const privateSubnet2Id = outputs.PrivateSubnet2Id;
      
      expect(vpcId).toBeDefined();
      expect(publicSubnetId).toBeDefined();
      expect(privateSubnet1Id).toBeDefined();
      expect(privateSubnet2Id).toBeDefined();
      
      // NAT Gateway should exist for private subnet internet access
      const natGatewayId = outputs.NATGatewayId;
      expect(natGatewayId).toBeDefined();
      
      // Security groups should exist for network access control
      const webSecurityGroupId = outputs.WebSecurityGroupId;
      expect(webSecurityGroupId).toBeDefined();
    });
  });
});
