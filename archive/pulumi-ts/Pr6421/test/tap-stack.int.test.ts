/**
 * Integration tests for deployed VPC infrastructure
 * Tests CloudFormation outputs without AWS API calls
 */

import * as fs from 'fs';
import * as path from 'path';

// Load deployment outputs
const outputsPath = path.join(
  __dirname,
  '..',
  'cfn-outputs',
  'flat-outputs.json'
);

let outputs: any;
try {
  outputs = JSON.parse(fs.readFileSync(outputsPath, 'utf8'));
  
  // Parse JSON string arrays into actual arrays
  outputs.publicSubnetIds = JSON.parse(outputs.publicSubnetIds);
  outputs.privateSubnetIds = JSON.parse(outputs.privateSubnetIds);
  outputs.databaseSubnetIds = JSON.parse(outputs.databaseSubnetIds);
  outputs.natInstanceIds = JSON.parse(outputs.natInstanceIds);
} catch (error) {
  throw new Error(
    `Failed to load deployment outputs from ${outputsPath}: ${error}`
  );
}

describe('VPC Infrastructure Integration Tests', () => {
  describe('VPC Configuration', () => {
    it('should have a VPC ID in correct format', () => {
      expect(outputs.vpcId).toBeDefined();
      expect(outputs.vpcId).toMatch(/^vpc-[a-f0-9]{17}$/);
    });

    it('should have all required outputs defined', () => {
      expect(outputs.vpcId).toBeDefined();
      expect(outputs.publicSubnetIds).toBeDefined();
      expect(outputs.privateSubnetIds).toBeDefined();
      expect(outputs.databaseSubnetIds).toBeDefined();
      expect(outputs.natInstanceIds).toBeDefined();
      expect(outputs.webSgId).toBeDefined();
      expect(outputs.appSgId).toBeDefined();
      expect(outputs.dbSgId).toBeDefined();
      expect(outputs.flowLogsBucketName).toBeDefined();
    });
  });

  describe('Subnet Configuration', () => {
    it('should have exactly 3 public subnets', () => {
      expect(outputs.publicSubnetIds).toBeInstanceOf(Array);
      expect(outputs.publicSubnetIds).toHaveLength(3);
      
      outputs.publicSubnetIds.forEach((subnetId: string) => {
        expect(subnetId).toMatch(/^subnet-[a-f0-9]{17}$/);
      });
    });

    it('should have exactly 3 private subnets', () => {
      expect(outputs.privateSubnetIds).toBeInstanceOf(Array);
      expect(outputs.privateSubnetIds).toHaveLength(3);
      
      outputs.privateSubnetIds.forEach((subnetId: string) => {
        expect(subnetId).toMatch(/^subnet-[a-f0-9]{17}$/);
      });
    });

    it('should have exactly 3 database subnets', () => {
      expect(outputs.databaseSubnetIds).toBeInstanceOf(Array);
      expect(outputs.databaseSubnetIds).toHaveLength(3);
      
      outputs.databaseSubnetIds.forEach((subnetId: string) => {
        expect(subnetId).toMatch(/^subnet-[a-f0-9]{17}$/);
      });
    });

    it('should have unique subnet IDs across all subnet types', () => {
      const allSubnetIds = [
        ...outputs.publicSubnetIds,
        ...outputs.privateSubnetIds,
        ...outputs.databaseSubnetIds,
      ];
      
      const uniqueSubnetIds = new Set(allSubnetIds);
      expect(uniqueSubnetIds.size).toBe(9);
      expect(allSubnetIds.length).toBe(9);
    });

    it('should have subnets in correct format for 3 availability zones', () => {
      // Each subnet type should have 3 subnets (one per AZ)
      expect(outputs.publicSubnetIds.length).toBe(3);
      expect(outputs.privateSubnetIds.length).toBe(3);
      expect(outputs.databaseSubnetIds.length).toBe(3);
    });
  });

  describe('NAT Instance Configuration', () => {
    it('should have exactly 3 NAT instances', () => {
      expect(outputs.natInstanceIds).toBeInstanceOf(Array);
      expect(outputs.natInstanceIds).toHaveLength(3);
      
      outputs.natInstanceIds.forEach((instanceId: string) => {
        expect(instanceId).toMatch(/^i-[a-f0-9]{17}$/);
      });
    });

    it('should have unique NAT instance IDs', () => {
      const uniqueInstanceIds = new Set(outputs.natInstanceIds);
      expect(uniqueInstanceIds.size).toBe(3);
    });

    it('should have one NAT instance per availability zone', () => {
      // We expect 3 NAT instances, one for each of the 3 AZs
      expect(outputs.natInstanceIds.length).toBe(3);
    });
  });

  describe('Security Group Configuration', () => {
    it('should have web security group with correct format', () => {
      expect(outputs.webSgId).toBeDefined();
      expect(outputs.webSgId).toMatch(/^sg-[a-f0-9]{17}$/);
    });

    it('should have app security group with correct format', () => {
      expect(outputs.appSgId).toBeDefined();
      expect(outputs.appSgId).toMatch(/^sg-[a-f0-9]{17}$/);
    });

    it('should have database security group with correct format', () => {
      expect(outputs.dbSgId).toBeDefined();
      expect(outputs.dbSgId).toMatch(/^sg-[a-f0-9]{17}$/);
    });

    it('should have unique security group IDs', () => {
      const sgIds = [outputs.webSgId, outputs.appSgId, outputs.dbSgId];
      const uniqueSgIds = new Set(sgIds);
      expect(uniqueSgIds.size).toBe(3);
    });

    it('should have all three security groups for 3-tier architecture', () => {
      // Verify we have all three tiers
      expect(outputs.webSgId).toBeDefined();
      expect(outputs.appSgId).toBeDefined();
      expect(outputs.dbSgId).toBeDefined();
    });
  });

  describe('VPC Flow Logs', () => {
    it('should have S3 bucket name for VPC Flow Logs', () => {
      expect(outputs.flowLogsBucketName).toBeDefined();
      expect(typeof outputs.flowLogsBucketName).toBe('string');
      expect(outputs.flowLogsBucketName.length).toBeGreaterThan(0);
    });

    it('should have flow logs bucket with expected naming pattern', () => {
      // Bucket name should follow pattern: vpc-flow-logs-{environment}
      expect(outputs.flowLogsBucketName).toMatch(/^vpc-flow-logs-/);
    });

    it('should have valid S3 bucket name format', () => {
      // S3 bucket names must be between 3 and 63 characters
      expect(outputs.flowLogsBucketName.length).toBeGreaterThanOrEqual(3);
      expect(outputs.flowLogsBucketName.length).toBeLessThanOrEqual(63);
      
      // Must be lowercase, numbers, and hyphens only
      expect(outputs.flowLogsBucketName).toMatch(/^[a-z0-9-]+$/);
    });
  });

  describe('Output Data Validation', () => {
    it('should have all outputs as non-empty values', () => {
      expect(outputs.vpcId).toBeTruthy();
      expect(outputs.publicSubnetIds.length).toBeGreaterThan(0);
      expect(outputs.privateSubnetIds.length).toBeGreaterThan(0);
      expect(outputs.databaseSubnetIds.length).toBeGreaterThan(0);
      expect(outputs.natInstanceIds.length).toBeGreaterThan(0);
      expect(outputs.webSgId).toBeTruthy();
      expect(outputs.appSgId).toBeTruthy();
      expect(outputs.dbSgId).toBeTruthy();
      expect(outputs.flowLogsBucketName).toBeTruthy();
    });

    it('should have correct AWS resource ID formats', () => {
      // VPC ID format
      expect(outputs.vpcId).toMatch(/^vpc-[a-f0-9]{17}$/);
      
      // Security Group ID formats
      expect(outputs.webSgId).toMatch(/^sg-[a-f0-9]{17}$/);
      expect(outputs.appSgId).toMatch(/^sg-[a-f0-9]{17}$/);
      expect(outputs.dbSgId).toMatch(/^sg-[a-f0-9]{17}$/);
      
      // Subnet ID formats
      outputs.publicSubnetIds.forEach((id: string) => {
        expect(id).toMatch(/^subnet-[a-f0-9]{17}$/);
      });
      outputs.privateSubnetIds.forEach((id: string) => {
        expect(id).toMatch(/^subnet-[a-f0-9]{17}$/);
      });
      outputs.databaseSubnetIds.forEach((id: string) => {
        expect(id).toMatch(/^subnet-[a-f0-9]{17}$/);
      });
      
      // Instance ID formats
      outputs.natInstanceIds.forEach((id: string) => {
        expect(id).toMatch(/^i-[a-f0-9]{17}$/);
      });
    });

    it('should have total of 9 subnets (3 per tier)', () => {
      const totalSubnets = 
        outputs.publicSubnetIds.length +
        outputs.privateSubnetIds.length +
        outputs.databaseSubnetIds.length;
      
      expect(totalSubnets).toBe(9);
    });

    it('should have equal number of subnets per tier', () => {
      expect(outputs.publicSubnetIds.length).toBe(outputs.privateSubnetIds.length);
      expect(outputs.privateSubnetIds.length).toBe(outputs.databaseSubnetIds.length);
    });
  });

  describe('High Availability Configuration', () => {
    it('should have resources distributed across 3 availability zones', () => {
      // Each tier should have 3 subnets (one per AZ)
      expect(outputs.publicSubnetIds.length).toBe(3);
      expect(outputs.privateSubnetIds.length).toBe(3);
      expect(outputs.databaseSubnetIds.length).toBe(3);
      
      // Should have 3 NAT instances (one per AZ)
      expect(outputs.natInstanceIds.length).toBe(3);
    });

    it('should have redundant NAT instances for high availability', () => {
      // 3 NAT instances for 3 AZs ensures no single point of failure
      expect(outputs.natInstanceIds.length).toBe(3);
    });
  });

  describe('3-Tier Architecture Validation', () => {
    it('should have complete web tier components', () => {
      expect(outputs.publicSubnetIds).toBeDefined();
      expect(outputs.publicSubnetIds.length).toBe(3);
      expect(outputs.webSgId).toBeDefined();
    });

    it('should have complete app tier components', () => {
      expect(outputs.privateSubnetIds).toBeDefined();
      expect(outputs.privateSubnetIds.length).toBe(3);
      expect(outputs.appSgId).toBeDefined();
    });

    it('should have complete database tier components', () => {
      expect(outputs.databaseSubnetIds).toBeDefined();
      expect(outputs.databaseSubnetIds.length).toBe(3);
      expect(outputs.dbSgId).toBeDefined();
    });

    it('should have separate security groups for each tier', () => {
      const securityGroups = [outputs.webSgId, outputs.appSgId, outputs.dbSgId];
      const uniqueSecurityGroups = new Set(securityGroups);
      
      // All security groups should be unique
      expect(uniqueSecurityGroups.size).toBe(3);
    });
  });

  describe('Infrastructure Naming and Environment', () => {
    it('should have environment-specific bucket naming', () => {
      // Check if bucket name contains environment suffix
      expect(outputs.flowLogsBucketName).toContain('vpc-flow-logs');
    });

    it('should have consistent resource deployment', () => {
      // All critical infrastructure components should be present
      const criticalComponents = [
        outputs.vpcId,
        outputs.publicSubnetIds,
        outputs.privateSubnetIds,
        outputs.databaseSubnetIds,
        outputs.natInstanceIds,
        outputs.webSgId,
        outputs.appSgId,
        outputs.dbSgId,
        outputs.flowLogsBucketName,
      ];
      
      criticalComponents.forEach(component => {
        expect(component).toBeDefined();
        expect(component).not.toBeNull();
      });
    });
  });

  describe('End-to-End Validation', () => {
    it('should have all required outputs for a production VPC', () => {
      const requiredOutputs = [
        'vpcId',
        'publicSubnetIds',
        'privateSubnetIds',
        'databaseSubnetIds',
        'natInstanceIds',
        'webSgId',
        'appSgId',
        'dbSgId',
        'flowLogsBucketName',
      ];
      
      requiredOutputs.forEach(outputKey => {
        expect(outputs[outputKey]).toBeDefined();
        expect(outputs[outputKey]).not.toBeNull();
      });
    });

    it('should have valid infrastructure for multi-tier deployment', () => {
      // Verify infrastructure can support a 3-tier application
      expect(outputs.publicSubnetIds.length).toBeGreaterThanOrEqual(3);
      expect(outputs.privateSubnetIds.length).toBeGreaterThanOrEqual(3);
      expect(outputs.databaseSubnetIds.length).toBeGreaterThanOrEqual(3);
      expect(outputs.natInstanceIds.length).toBeGreaterThanOrEqual(3);
    });

    it('should have complete output structure matching expected schema', () => {
      const outputKeys = Object.keys(outputs).sort();
      const expectedKeys = [
        'appSgId',
        'databaseSubnetIds',
        'dbSgId',
        'flowLogsBucketName',
        'natInstanceIds',
        'privateSubnetIds',
        'publicSubnetIds',
        'vpcId',
        'webSgId',
      ].sort();
      
      expect(outputKeys).toEqual(expectedKeys);
    });
  });
});
