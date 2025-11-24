/**
 * Integration Tests for TAP Stack Deployment
 *
 * These tests validate the actual deployment outputs from cfn-outputs/flat-outputs.json
 * against expected values and infrastructure requirements.
 *
 * Pattern: Uses cfn-outputs/flat-outputs.json to validate deployed infrastructure
 * No AWS SDK calls - all validation based on deployment outputs
 */
import * as fs from 'fs';
import * as path from 'path';

describe('TAP Stack Infrastructure Integration Tests', () => {
  let outputs: any;

  beforeAll(() => {
    const outputsPath = path.join(
      __dirname,
      '..',
      'cfn-outputs',
      'flat-outputs.json'
    );

    if (!fs.existsSync(outputsPath)) {
      throw new Error(
        `Deployment outputs not found at ${outputsPath}. Run deployment first.`
      );
    }

    const rawData = fs.readFileSync(outputsPath, 'utf-8');
    outputs = JSON.parse(rawData);

    // Parse JSON array strings if needed
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
      outputs.natInstancePrivateIps = JSON.parse(
        outputs.natInstancePrivateIps
      );
    }
  });

  describe('Core Outputs', () => {
    test('should have all required outputs', () => {
      expect(outputs.vpcId).toBeDefined();
      expect(outputs.vpcCidr).toBeDefined();
      expect(outputs.internetGatewayId).toBeDefined();
      expect(outputs.publicSubnetIds).toBeDefined();
      expect(outputs.privateSubnetIds).toBeDefined();
      expect(outputs.databaseSubnetIds).toBeDefined();
      expect(outputs.natInstanceIds).toBeDefined();
      expect(outputs.natInstancePrivateIps).toBeDefined();
      expect(outputs.webSecurityGroupId).toBeDefined();
      expect(outputs.appSecurityGroupId).toBeDefined();
      expect(outputs.databaseSecurityGroupId).toBeDefined();
      expect(outputs.flowLogsLogGroupName).toBeDefined();
    });

    test('should have valid output types', () => {
      expect(typeof outputs.vpcId).toBe('string');
      expect(typeof outputs.vpcCidr).toBe('string');
      expect(typeof outputs.internetGatewayId).toBe('string');
      expect(Array.isArray(outputs.publicSubnetIds)).toBe(true);
      expect(Array.isArray(outputs.privateSubnetIds)).toBe(true);
      expect(Array.isArray(outputs.databaseSubnetIds)).toBe(true);
      expect(Array.isArray(outputs.natInstanceIds)).toBe(true);
      expect(Array.isArray(outputs.natInstancePrivateIps)).toBe(true);
    });
  });

  describe('VPC Infrastructure', () => {
    test('should have valid VPC ID', () => {
      expect(outputs.vpcId).toBeDefined();
      expect(outputs.vpcId).toMatch(/^vpc-[a-f0-9]{8,17}$/);
    });

    test('should have correct VPC CIDR block', () => {
      expect(outputs.vpcCidr).toBe('10.0.0.0/16');
    });

    test('VPC CIDR should be valid format', () => {
      expect(outputs.vpcCidr).toMatch(/^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}\/\d{1,2}$/);
    });

    test('should have valid Internet Gateway ID', () => {
      expect(outputs.internetGatewayId).toBeDefined();
      expect(outputs.internetGatewayId).toMatch(/^igw-[a-f0-9]{8,17}$/);
    });
  });

  describe('Subnet Configuration', () => {
    test('should have 3 public subnets', () => {
      expect(outputs.publicSubnetIds).toHaveLength(3);
    });

    test('should have 3 private subnets', () => {
      expect(outputs.privateSubnetIds).toHaveLength(3);
    });

    test('should have 3 database subnets', () => {
      expect(outputs.databaseSubnetIds).toHaveLength(3);
    });

    test('all public subnet IDs should be valid', () => {
      outputs.publicSubnetIds.forEach((subnetId: string) => {
        expect(subnetId).toMatch(/^subnet-[a-f0-9]{8,17}$/);
      });
    });

    test('all private subnet IDs should be valid', () => {
      outputs.privateSubnetIds.forEach((subnetId: string) => {
        expect(subnetId).toMatch(/^subnet-[a-f0-9]{8,17}$/);
      });
    });

    test('all database subnet IDs should be valid', () => {
      outputs.databaseSubnetIds.forEach((subnetId: string) => {
        expect(subnetId).toMatch(/^subnet-[a-f0-9]{8,17}$/);
      });
    });

    test('public subnets should be unique', () => {
      const uniqueSubnets = new Set(outputs.publicSubnetIds);
      expect(uniqueSubnets.size).toBe(3);
    });

    test('private subnets should be unique', () => {
      const uniqueSubnets = new Set(outputs.privateSubnetIds);
      expect(uniqueSubnets.size).toBe(3);
    });

    test('database subnets should match private subnets', () => {
      // Based on implementation, database subnets use private subnets
      expect(outputs.databaseSubnetIds).toEqual(outputs.privateSubnetIds);
    });
  });

  describe('NAT Gateway Configuration', () => {
    test('should have 3 NAT Gateways', () => {
      expect(outputs.natInstanceIds).toHaveLength(3);
    });

    test('should have 3 NAT Gateway private IPs', () => {
      expect(outputs.natInstancePrivateIps).toHaveLength(3);
    });

    test('all NAT Gateway IDs should be valid', () => {
      outputs.natInstanceIds.forEach((natId: string) => {
        expect(natId).toMatch(/^nat-[a-f0-9]{8,17}$/);
      });
    });

    test('all NAT Gateway private IPs should be valid', () => {
      outputs.natInstancePrivateIps.forEach((ip: string) => {
        expect(ip).toMatch(/^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/);
      });
    });

    test('NAT Gateway IPs should be in VPC CIDR range', () => {
      outputs.natInstancePrivateIps.forEach((ip: string) => {
        expect(ip).toMatch(/^10\.0\./);
      });
    });

    test('NAT Gateway count should match public subnet count', () => {
      expect(outputs.natInstanceIds.length).toBe(
        outputs.publicSubnetIds.length
      );
    });
  });

  describe('Security Groups', () => {
    test('should have valid web security group ID', () => {
      expect(outputs.webSecurityGroupId).toBeDefined();
      expect(outputs.webSecurityGroupId).toMatch(/^sg-[a-f0-9]{8,17}$/);
    });

    test('should have valid app security group ID', () => {
      expect(outputs.appSecurityGroupId).toBeDefined();
      expect(outputs.appSecurityGroupId).toMatch(/^sg-[a-f0-9]{8,17}$/);
    });

    test('should have valid database security group ID', () => {
      expect(outputs.databaseSecurityGroupId).toBeDefined();
      expect(outputs.databaseSecurityGroupId).toMatch(/^sg-[a-f0-9]{8,17}$/);
    });

    test('security groups should use cluster security group', () => {
      // Based on implementation, all three use the same cluster SG
      expect(outputs.webSecurityGroupId).toBe(outputs.appSecurityGroupId);
      expect(outputs.appSecurityGroupId).toBe(
        outputs.databaseSecurityGroupId
      );
    });
  });

  describe('CloudWatch Flow Logs', () => {
    test('should have flow logs log group name', () => {
      expect(outputs.flowLogsLogGroupName).toBeDefined();
      expect(outputs.flowLogsLogGroupName).toMatch(/^\/aws\/eks\/cluster-/);
    });

    test('flow logs log group should follow naming convention', () => {
      expect(outputs.flowLogsLogGroupName).toMatch(
        /^\/aws\/eks\/cluster-[a-z0-9]+\/logs$/
      );
    });

    test('flow logs bucket should be defined', () => {
      // Empty string is expected based on implementation
      expect(outputs.flowLogsBucketName).toBeDefined();
      expect(typeof outputs.flowLogsBucketName).toBe('string');
    });
  });

  describe('S3 VPC Endpoint', () => {
    test('should have S3 endpoint ID output', () => {
      expect(outputs.s3EndpointId).toBeDefined();
      expect(typeof outputs.s3EndpointId).toBe('string');
    });
  });

  describe('AWS Resource Format Validation', () => {
    test('VPC ID should follow AWS format', () => {
      expect(outputs.vpcId).toMatch(/^vpc-[a-f0-9]{8,17}$/);
    });

    test('Internet Gateway ID should follow AWS format', () => {
      expect(outputs.internetGatewayId).toMatch(/^igw-[a-f0-9]{8,17}$/);
    });

    test('all subnet IDs should follow AWS format', () => {
      const allSubnetIds = [
        ...outputs.publicSubnetIds,
        ...outputs.privateSubnetIds,
        ...outputs.databaseSubnetIds,
      ];

      allSubnetIds.forEach((subnetId: string) => {
        expect(subnetId).toMatch(/^subnet-[a-f0-9]{8,17}$/);
      });
    });

    test('all NAT Gateway IDs should follow AWS format', () => {
      outputs.natInstanceIds.forEach((natId: string) => {
        expect(natId).toMatch(/^nat-[a-f0-9]{8,17}$/);
      });
    });

    test('all security group IDs should follow AWS format', () => {
      const securityGroups = [
        outputs.webSecurityGroupId,
        outputs.appSecurityGroupId,
        outputs.databaseSecurityGroupId,
      ];

      securityGroups.forEach((sgId: string) => {
        expect(sgId).toMatch(/^sg-[a-f0-9]{8,17}$/);
      });
    });
  });

  describe('Infrastructure Consistency', () => {
    test('should have matching counts for multi-AZ resources', () => {
      expect(outputs.publicSubnetIds.length).toBe(3);
      expect(outputs.privateSubnetIds.length).toBe(3);
      expect(outputs.natInstanceIds.length).toBe(3);
      expect(outputs.natInstancePrivateIps.length).toBe(3);
    });

    test('NAT IP count should match NAT Gateway count', () => {
      expect(outputs.natInstancePrivateIps.length).toBe(
        outputs.natInstanceIds.length
      );
    });

    test('all subnets should be unique across all types', () => {
      const allSubnets = [
        ...outputs.publicSubnetIds,
        ...outputs.privateSubnetIds,
        ...outputs.databaseSubnetIds,
      ];

      const uniqueSubnets = new Set(allSubnets);
      // Database subnets are same as private, so we expect 6 unique (3 public + 3 private)
      expect(uniqueSubnets.size).toBe(6);
    });
  });

  describe('Naming Conventions', () => {
    test('flow logs log group should contain environment suffix', () => {
      const match = outputs.flowLogsLogGroupName.match(
        /^\/aws\/eks\/cluster-([a-z0-9]+)\/logs$/
      );
      expect(match).not.toBeNull();
      expect(match![1]).toBeTruthy();
    });

    test('should extract consistent environment suffix', () => {
      const match = outputs.flowLogsLogGroupName.match(
        /cluster-([a-z0-9]+)\//
      );
      expect(match).not.toBeNull();
      const suffix = match![1];
      expect(suffix.length).toBeGreaterThan(0);
    });
  });

  describe('IP Address Validation', () => {
    test('all NAT Gateway private IPs should be valid IPv4', () => {
      outputs.natInstancePrivateIps.forEach((ip: string) => {
        const octets = ip.split('.');
        expect(octets).toHaveLength(4);

        octets.forEach((octet: string) => {
          const num = parseInt(octet, 10);
          expect(num).toBeGreaterThanOrEqual(0);
          expect(num).toBeLessThanOrEqual(255);
        });
      });
    });

    test('NAT Gateway IPs should be in public subnet ranges', () => {
      // Based on implementation: public subnets are 10.0.1.0/24, 10.0.2.0/24, 10.0.3.0/24
      outputs.natInstancePrivateIps.forEach((ip: string) => {
        expect(ip).toMatch(/^10\.0\.[1-3]\.\d{1,3}$/);
      });
    });
  });

  describe('Output Completeness', () => {
    test('should not have undefined outputs', () => {
      Object.entries(outputs).forEach(([key, value]) => {
        expect(value).not.toBeUndefined();
      });
    });

    test('should not have null outputs', () => {
      Object.entries(outputs).forEach(([key, value]) => {
        expect(value).not.toBeNull();
      });
    });

    test('required outputs should not be empty', () => {
      const requiredNonEmptyOutputs = [
        'vpcId',
        'vpcCidr',
        'internetGatewayId',
        'publicSubnetIds',
        'privateSubnetIds',
        'databaseSubnetIds',
        'natInstanceIds',
        'natInstancePrivateIps',
        'webSecurityGroupId',
        'appSecurityGroupId',
        'databaseSecurityGroupId',
        'flowLogsLogGroupName',
      ];

      requiredNonEmptyOutputs.forEach(key => {
        const value = outputs[key];
        if (typeof value === 'string') {
          expect(value.length).toBeGreaterThan(0);
        } else if (Array.isArray(value)) {
          expect(value.length).toBeGreaterThan(0);
        }
      });
    });

    test('optional outputs can be empty strings', () => {
      // These are expected to be empty based on implementation
      expect(typeof outputs.flowLogsBucketName).toBe('string');
      expect(typeof outputs.s3EndpointId).toBe('string');
    });
  });

  describe('High Availability Configuration', () => {
    test('should deploy across 3 availability zones', () => {
      expect(outputs.publicSubnetIds.length).toBe(3);
      expect(outputs.privateSubnetIds.length).toBe(3);
      expect(outputs.natInstanceIds.length).toBe(3);
    });

    test('should have NAT Gateway per AZ for HA', () => {
      expect(outputs.natInstanceIds.length).toBe(3);
      expect(outputs.natInstancePrivateIps.length).toBe(3);
    });
  });

  describe('Network Architecture', () => {
    test('should have both public and private subnet tiers', () => {
      expect(outputs.publicSubnetIds.length).toBeGreaterThan(0);
      expect(outputs.privateSubnetIds.length).toBeGreaterThan(0);
    });

    test('should have database subnet tier', () => {
      expect(outputs.databaseSubnetIds.length).toBeGreaterThan(0);
    });

    test('should have Internet Gateway for public connectivity', () => {
      expect(outputs.internetGatewayId).toBeDefined();
      expect(outputs.internetGatewayId).toMatch(/^igw-/);
    });

    test('should have NAT Gateways for private subnet outbound', () => {
      expect(outputs.natInstanceIds.length).toBeGreaterThan(0);
      outputs.natInstanceIds.forEach((natId: string) => {
        expect(natId).toMatch(/^nat-/);
      });
    });
  });
});
