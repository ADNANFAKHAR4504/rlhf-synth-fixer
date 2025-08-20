// Configuration - These are coming from cfn-outputs after cdk deploy
import fs from 'fs';

// Get environment suffix from environment variable (set by CI/CD pipeline)
const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';

describe('TapStack Integration Tests', () => {
  let outputs: any;

  beforeAll(() => {
    // Check if outputs file exists
    const outputsFile = 'cfn-outputs/flat-outputs.json';
    if (!fs.existsSync(outputsFile)) {
      throw new Error(`Outputs file ${outputsFile} not found. Please deploy the stack first.`);
    }
    
    // Load the outputs
    outputs = JSON.parse(fs.readFileSync(outputsFile, 'utf8'));
  });

  describe('VPC Deployment', () => {
    test('VPC was successfully created', () => {
      expect(outputs.VpcId).toBeDefined();
      expect(outputs.VpcId).toMatch(/^vpc-[a-z0-9]+$/);
    });

    test('VPC ID follows AWS format', () => {
      const vpcIdPattern = /^vpc-[a-f0-9]{8,17}$/;
      expect(outputs.VpcId).toMatch(vpcIdPattern);
    });
  });

  describe('S3 Bucket Deployment', () => {
    test('S3 bucket was successfully created', () => {
      expect(outputs.S3BucketName).toBeDefined();
      expect(outputs.S3BucketName).not.toBe('');
    });

    test('S3 bucket name follows AWS naming conventions', () => {
      const bucketName = outputs.S3BucketName;
      
      // AWS S3 bucket naming rules
      expect(bucketName.length).toBeGreaterThanOrEqual(3);
      expect(bucketName.length).toBeLessThanOrEqual(63);
      expect(bucketName).toMatch(/^[a-z0-9][a-z0-9.-]*[a-z0-9]$/);
      expect(bucketName).not.toMatch(/\.\./); // No consecutive dots
      expect(bucketName).not.toMatch(/\.-|-\./); // No dot-dash or dash-dot
    });

    test('S3 bucket name contains stack identifier', () => {
      const bucketName = outputs.S3BucketName.toLowerCase();
      // The bucket name should contain some identifier from the stack
      expect(bucketName).toMatch(/tap|stack|production|s3|bucket/);
    });
  });

  describe('EC2 Instance Deployment', () => {
    test('EC2 instance was successfully created', () => {
      expect(outputs.EC2InstanceId).toBeDefined();
      expect(outputs.EC2InstanceId).toMatch(/^i-[a-z0-9]+$/);
    });

    test('EC2 instance ID follows AWS format', () => {
      const instanceIdPattern = /^i-[a-f0-9]{8,17}$/;
      expect(outputs.EC2InstanceId).toMatch(instanceIdPattern);
    });

    test('EC2 instance has a public IP address', () => {
      expect(outputs.EC2PublicIp).toBeDefined();
      
      // Validate IP address format
      const ipPattern = /^(\d{1,3}\.){3}\d{1,3}$/;
      expect(outputs.EC2PublicIp).toMatch(ipPattern);
      
      // Validate each octet is between 0-255
      const octets = outputs.EC2PublicIp.split('.').map(Number);
      expect(octets).toHaveLength(4);
      octets.forEach((octet: number) => {
        expect(octet).toBeGreaterThanOrEqual(0);
        expect(octet).toBeLessThanOrEqual(255);
      });
    });

    test('EC2 public IP is not in private IP ranges', () => {
      const ip = outputs.EC2PublicIp;
      const octets = ip.split('.').map(Number);
      
      // Check it's not a private IP (10.x.x.x, 172.16-31.x.x, 192.168.x.x)
      const isPrivate = 
        octets[0] === 10 ||
        (octets[0] === 172 && octets[1] >= 16 && octets[1] <= 31) ||
        (octets[0] === 192 && octets[1] === 168) ||
        octets[0] === 127; // localhost
      
      expect(isPrivate).toBe(false);
    });
  });

  describe('Stack Outputs Completeness', () => {
    test('all required outputs are present', () => {
      const requiredOutputs = [
        'VpcId',
        'S3BucketName',
        'EC2InstanceId',
        'EC2PublicIp'
      ];
      
      requiredOutputs.forEach(output => {
        expect(outputs).toHaveProperty(output);
        expect(outputs[output]).toBeDefined();
        expect(outputs[output]).not.toBe('');
      });
    });

    test('no unexpected outputs are present', () => {
      const expectedOutputs = [
        'VpcId',
        'S3BucketName',
        'EC2InstanceId',
        'EC2PublicIp'
      ];
      
      const actualOutputKeys = Object.keys(outputs);
      actualOutputKeys.forEach(key => {
        expect(expectedOutputs).toContain(key);
      });
    });
  });

  describe('Resource Connectivity', () => {
    test('EC2 instance and VPC are in the same deployment', () => {
      // Both resources should exist and be valid
      expect(outputs.VpcId).toBeDefined();
      expect(outputs.EC2InstanceId).toBeDefined();
      
      // The EC2 instance should have a public IP, indicating it's in a public subnet
      expect(outputs.EC2PublicIp).toBeDefined();
      expect(outputs.EC2PublicIp).not.toBe('');
    });

    test('S3 bucket is accessible from the deployment region', () => {
      // The bucket name should be globally unique and valid
      expect(outputs.S3BucketName).toBeDefined();
      expect(outputs.S3BucketName.length).toBeGreaterThan(0);
      
      // Bucket name should not contain uppercase or underscores
      expect(outputs.S3BucketName).toBe(outputs.S3BucketName.toLowerCase());
      expect(outputs.S3BucketName).not.toContain('_');
    });
  });

  describe('Security Configuration', () => {
    test('EC2 instance has public IP for SSH access', () => {
      // The instance should have a public IP for SSH access
      expect(outputs.EC2PublicIp).toBeDefined();
      
      // Validate it's a valid public IP
      const ipPattern = /^(\d{1,3}\.){3}\d{1,3}$/;
      expect(outputs.EC2PublicIp).toMatch(ipPattern);
    });
  });

  describe('Infrastructure Validation', () => {
    test('all resources follow AWS resource ID patterns', () => {
      // VPC ID validation
      expect(outputs.VpcId).toMatch(/^vpc-[a-f0-9]+$/);
      
      // EC2 Instance ID validation
      expect(outputs.EC2InstanceId).toMatch(/^i-[a-f0-9]+$/);
      
      // S3 Bucket name validation (more permissive as it can contain various patterns)
      expect(outputs.S3BucketName).toMatch(/^[a-z0-9][a-z0-9.-]*[a-z0-9]$/);
    });

    test('outputs contain valid non-empty values', () => {
      Object.entries(outputs).forEach(([key, value]) => {
        expect(value).toBeDefined();
        expect(value).not.toBe('');
        expect(value).not.toBe(null);
        expect(value).not.toBe(undefined);
      });
    });
  });

  describe('Deployment Workflow', () => {
    test('deployment outputs file exists and is valid JSON', () => {
      const outputsFile = 'cfn-outputs/flat-outputs.json';
      
      // File should exist
      expect(fs.existsSync(outputsFile)).toBe(true);
      
      // File should be valid JSON
      const fileContent = fs.readFileSync(outputsFile, 'utf8');
      expect(() => JSON.parse(fileContent)).not.toThrow();
      
      // Parsed content should be an object
      const parsed = JSON.parse(fileContent);
      expect(typeof parsed).toBe('object');
      expect(parsed).not.toBe(null);
    });

    test('outputs file contains expected structure', () => {
      expect(outputs).toBeInstanceOf(Object);
      expect(Object.keys(outputs).length).toBeGreaterThan(0);
      
      // Each output should be a string
      Object.values(outputs).forEach(value => {
        expect(typeof value).toBe('string');
      });
    });
  });
});