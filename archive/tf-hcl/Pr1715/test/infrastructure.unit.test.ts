// test/infrastructure.unit.test.ts
// Unit tests for infrastructure configuration

import {
  InfrastructureValidator,
  validateTerraformOutputs,
  parseRDSEndpoint,
  generateResourceTags,
  InfrastructureConfig,
} from '../lib/infrastructure';

describe('Infrastructure Configuration Tests', () => {
  let validator: InfrastructureValidator;
  let config: InfrastructureConfig;

  beforeEach(() => {
    config = {
      awsRegion: 'us-east-1',
      projectName: 'cloud-environment',
      environment: 'dev',
      environmentSuffix: 'test123',
    };
    validator = new InfrastructureValidator(config);
  });

  describe('Resource Naming', () => {
    test('should generate correct resource names with environment suffix', () => {
      const resourceName = validator.validateResourceName('bucket');
      expect(resourceName).toBe('cloud-environment-test123-bucket');
    });

    test('should throw error if environment suffix is missing', () => {
      const invalidConfig = { ...config, environmentSuffix: '' };
      const invalidValidator = new InfrastructureValidator(invalidConfig);
      expect(() => invalidValidator.validateResourceName('bucket')).toThrow(
        'Environment suffix is required for resource naming'
      );
    });
  });

  describe('S3 Bucket Configuration', () => {
    test('should have versioning enabled', () => {
      const s3Config = validator.getS3BucketConfig();
      expect(s3Config.versioning).toBe(true);
    });

    test('should have encryption enabled', () => {
      const s3Config = validator.getS3BucketConfig();
      expect(s3Config.encryption).toBe(true);
    });

    test('should have public access blocked', () => {
      const s3Config = validator.getS3BucketConfig();
      expect(s3Config.publicAccessBlock).toBe(true);
    });

    test('should have force destroy enabled for cleanup', () => {
      const s3Config = validator.getS3BucketConfig();
      expect(s3Config.forceDestroy).toBe(true);
    });

    test('should validate S3 data integrity features', () => {
      expect(validator.validateS3DataIntegrity()).toBe(true);
    });
  });

  describe('RDS Configuration', () => {
    test('should use PostgreSQL engine', () => {
      const rdsConfig = validator.getRDSConfig();
      expect(rdsConfig.engine).toBe('postgres');
    });

    test('should use version 15.8', () => {
      const rdsConfig = validator.getRDSConfig();
      expect(rdsConfig.engineVersion).toBe('15.8');
    });

    test('should use Graviton2-based instance class', () => {
      const rdsConfig = validator.getRDSConfig();
      expect(rdsConfig.instanceClass).toBe('db.t4g.micro');
      expect(validator.validateRDSGraviton()).toBe(true);
    });

    test('should have Multi-AZ enabled for high availability', () => {
      const rdsConfig = validator.getRDSConfig();
      expect(rdsConfig.multiAz).toBe(true);
      expect(validator.validateHighAvailability()).toBe(true);
    });

    test('should use gp3 storage type', () => {
      const rdsConfig = validator.getRDSConfig();
      expect(rdsConfig.storageType).toBe('gp3');
    });

    test('should have storage encryption enabled', () => {
      const rdsConfig = validator.getRDSConfig();
      expect(rdsConfig.storageEncrypted).toBe(true);
    });

    test('should have deletion protection disabled for cleanup', () => {
      const rdsConfig = validator.getRDSConfig();
      expect(rdsConfig.deletionProtection).toBe(false);
    });

    test('should skip final snapshot for cleanup', () => {
      const rdsConfig = validator.getRDSConfig();
      expect(rdsConfig.skipFinalSnapshot).toBe(true);
    });

    test('should have 7-day backup retention', () => {
      const rdsConfig = validator.getRDSConfig();
      expect(rdsConfig.backupRetentionPeriod).toBe(7);
    });
  });

  describe('EC2 Configuration', () => {
    test('should use t2.micro instance type', () => {
      const ec2Config = validator.getEC2Config();
      expect(ec2Config.instanceType).toBe('t2.micro');
    });

    test('should associate public IP', () => {
      const ec2Config = validator.getEC2Config();
      expect(ec2Config.associatePublicIp).toBe(true);
    });
  });

  describe('VPC Configuration', () => {
    test('should use correct CIDR block', () => {
      const vpcConfig = validator.getVPCConfig();
      expect(vpcConfig.cidrBlock).toBe('10.0.0.0/16');
    });

    test('should have 2 public subnets', () => {
      const vpcConfig = validator.getVPCConfig();
      expect(vpcConfig.publicSubnetsCount).toBe(2);
    });

    test('should have 2 private subnets', () => {
      const vpcConfig = validator.getVPCConfig();
      expect(vpcConfig.privateSubnetsCount).toBe(2);
    });

    test('should enable DNS hostnames', () => {
      const vpcConfig = validator.getVPCConfig();
      expect(vpcConfig.enableDnsHostnames).toBe(true);
    });

    test('should enable DNS support', () => {
      const vpcConfig = validator.getVPCConfig();
      expect(vpcConfig.enableDnsSupport).toBe(true);
    });
  });

  describe('Security Best Practices', () => {
    test('should validate all security best practices', () => {
      expect(validator.validateSecurityBestPractices()).toBe(true);
    });

    test('should enforce S3 public access block', () => {
      const s3Config = validator.getS3BucketConfig();
      expect(s3Config.publicAccessBlock).toBe(true);
    });

    test('should enforce encryption for S3 and RDS', () => {
      const s3Config = validator.getS3BucketConfig();
      const rdsConfig = validator.getRDSConfig();
      expect(s3Config.encryption).toBe(true);
      expect(rdsConfig.storageEncrypted).toBe(true);
    });
  });

  describe('Cleanup Capability', () => {
    test('should validate cleanup capability for all resources', () => {
      expect(validator.validateCleanupCapability()).toBe(true);
    });

    test('should have force destroy on S3', () => {
      const s3Config = validator.getS3BucketConfig();
      expect(s3Config.forceDestroy).toBe(true);
    });

    test('should disable deletion protection on RDS', () => {
      const rdsConfig = validator.getRDSConfig();
      expect(rdsConfig.deletionProtection).toBe(false);
      expect(rdsConfig.skipFinalSnapshot).toBe(true);
    });
  });

  describe('Network Segmentation', () => {
    test('should generate correct subnet CIDRs', () => {
      const vpcConfig = validator.getVPCConfig();
      const publicSubnets = validator.generateSubnetCidrs(
        vpcConfig.cidrBlock,
        2,
        0
      );
      expect(publicSubnets).toEqual(['10.0.1.0/24', '10.0.2.0/24']);

      const privateSubnets = validator.generateSubnetCidrs(
        vpcConfig.cidrBlock,
        2,
        9
      );
      expect(privateSubnets).toEqual(['10.0.10.0/24', '10.0.11.0/24']);
    });

    test('should validate network segmentation without overlap', () => {
      expect(validator.validateNetworkSegmentation()).toBe(true);
    });
  });

  describe('Cost Estimation', () => {
    test('should calculate infrastructure cost estimates', () => {
      const cost = validator.calculateInfrastructureCost();
      expect(cost.min).toBeGreaterThan(30);
      expect(cost.min).toBeLessThan(50);
      expect(cost.max).toBeGreaterThan(cost.min);
      expect(cost.max).toBeLessThan(150);
    });
  });

  describe('Terraform Outputs', () => {
    test('should validate all required outputs are present', () => {
      const validOutputs = {
        s3_bucket_name: 'test-bucket',
        ec2_instance_id: 'i-123456',
        ec2_public_ip: '1.2.3.4',
        rds_endpoint: 'db.example.com:5432',
        rds_port: 5432,
        vpc_id: 'vpc-123456',
      };
      expect(validateTerraformOutputs(validOutputs)).toBe(true);
    });

    test('should fail validation if outputs are missing', () => {
      const invalidOutputs = {
        s3_bucket_name: 'test-bucket',
        ec2_instance_id: 'i-123456',
        // Missing other outputs
      };
      expect(validateTerraformOutputs(invalidOutputs)).toBe(false);
    });
  });

  describe('RDS Endpoint Parsing', () => {
    test('should parse RDS endpoint correctly', () => {
      const endpoint = 'database.cluster.us-east-1.rds.amazonaws.com:5432';
      const parsed = parseRDSEndpoint(endpoint);
      expect(parsed.host).toBe('database.cluster.us-east-1.rds.amazonaws.com');
      expect(parsed.port).toBe(5432);
    });

    test('should throw error for invalid endpoint format', () => {
      const invalidEndpoint = 'database.cluster.us-east-1.rds.amazonaws.com';
      expect(() => parseRDSEndpoint(invalidEndpoint)).toThrow(
        'Invalid RDS endpoint format'
      );
    });
  });

  describe('Resource Tagging', () => {
    test('should generate correct resource tags', () => {
      const tags = generateResourceTags(config);
      expect(tags).toEqual({
        Name: 'cloud-environment-test123',
        Project: 'cloud-environment',
        Environment: 'dev',
        ManagedBy: 'terraform',
      });
    });

    test('should include all required tags', () => {
      const tags = generateResourceTags(config);
      expect(tags).toHaveProperty('Name');
      expect(tags).toHaveProperty('Project');
      expect(tags).toHaveProperty('Environment');
      expect(tags).toHaveProperty('ManagedBy');
    });
  });

  describe('Infrastructure Requirements Validation', () => {
    test('should meet all requirements from PROMPT.md', () => {
      // S3 with versioning
      const s3Config = validator.getS3BucketConfig();
      expect(s3Config.versioning).toBe(true);

      // RDS PostgreSQL with Multi-AZ
      const rdsConfig = validator.getRDSConfig();
      expect(rdsConfig.engine).toBe('postgres');
      expect(rdsConfig.multiAz).toBe(true);

      // EC2 t2.micro instance
      const ec2Config = validator.getEC2Config();
      expect(ec2Config.instanceType).toBe('t2.micro');

      // Latest features: Graviton2 and S3 data integrity
      expect(validator.validateRDSGraviton()).toBe(true);
      expect(validator.validateS3DataIntegrity()).toBe(true);
    });
  });
});
