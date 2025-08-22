// tap-stack.integration.test.ts
import { Testing } from 'cdktf';
import { TapStack } from '../lib/tap-stack'; // Adjust path as needed

describe('TapStack Integration Tests', () => {
  let synthesized: any;

  // Helper functions
  const countResources = (resourceType: string): number => {
    return synthesized.resource?.[resourceType] ? 
      Object.keys(synthesized.resource[resourceType]).length : 0;
  };

  const findResourceByType = (resourceType: string): any => {
    return synthesized.resource?.[resourceType] ? 
      Object.values(synthesized.resource[resourceType])[0] : null;
  };

  const findAllResourcesByType = (resourceType: string): any[] => {
    return synthesized.resource?.[resourceType] ? 
      Object.values(synthesized.resource[resourceType]) : [];
  };

  const hasOutput = (outputName: string): boolean => {
    return synthesized.output?.[outputName] !== undefined;
  };

  const getOutputValue = (outputName: string): any => {
    return synthesized.output?.[outputName]?.value;
  };

  describe('Default Configuration', () => {
    beforeEach(() => {
      const app = Testing.app();
      const stack = new TapStack(app, 'test-tap-stack');
      const synthResult = Testing.synth(stack);
      synthesized = JSON.parse(synthResult); // Parse the JSON string
    });

    describe('Provider and Backend Configuration', () => {
      it('should configure AWS provider with default region', () => {
        expect(synthesized.provider?.aws).toBeDefined();
        expect(synthesized.provider.aws.region).toBe('us-east-1');
      });

      it('should configure S3 backend with correct settings', () => {
        const backend = synthesized.terraform?.backend?.s3;
        expect(backend).toBeDefined();
        expect(backend.bucket).toBe('iac-rlhf-tf-states');
        expect(backend.key).toBe('dev/test-tap-stack.tfstate');
        expect(backend.region).toBe('us-east-1');
        expect(backend.encrypt).toBe(true);
        expect(backend.use_lockfile).toBe(true);
      });
    });

    describe('Data Sources', () => {
      it('should include AWS caller identity data source', () => {
        expect(synthesized.data?.aws_caller_identity?.current).toBeDefined();
      });

      it('should include secrets manager secret version for database password', () => {
        const secretVersion = synthesized.data?.aws_secretsmanager_secret_version?.['db-password-secret'];
        expect(secretVersion).toBeDefined();
        expect(secretVersion.secret_id).toBe('my-db-password');
      });
    });

    describe('Resource Creation', () => {
      it('should create KMS resources', () => {
        expect(countResources('aws_kms_key')).toBeGreaterThan(0);
        expect(countResources('aws_kms_alias')).toBeGreaterThan(0);
      });

      it('should create VPC and networking resources', () => {
        expect(countResources('aws_vpc')).toBe(1);
        expect(countResources('aws_subnet')).toBeGreaterThanOrEqual(4); // 2 public + 2 private minimum
        expect(countResources('aws_internet_gateway')).toBe(1);
        expect(countResources('aws_nat_gateway')).toBeGreaterThan(0);
        expect(countResources('aws_route_table')).toBeGreaterThan(0);
        expect(countResources('aws_route_table_association')).toBeGreaterThan(0);
      });

      it('should create security groups', () => {
        expect(countResources('aws_security_group')).toBeGreaterThanOrEqual(3); // public-ec2, private-ec2, rds
        expect(countResources('aws_security_group_rule')).toBeGreaterThan(0);
      });

      it('should create S3 buckets', () => {
        expect(countResources('aws_s3_bucket')).toBeGreaterThanOrEqual(3); // app-data, public-assets, private-data
        expect(countResources('aws_s3_bucket_server_side_encryption_configuration')).toBeGreaterThan(0);
        expect(countResources('aws_s3_bucket_versioning')).toBeGreaterThan(0);
        expect(countResources('aws_s3_bucket_public_access_block')).toBeGreaterThan(0);
      });

      it('should create IAM resources', () => {
        expect(countResources('aws_iam_role')).toBeGreaterThan(0);
        expect(countResources('aws_iam_instance_profile')).toBeGreaterThan(0);
        expect(countResources('aws_iam_policy')).toBeGreaterThan(0);
        expect(countResources('aws_iam_role_policy_attachment')).toBeGreaterThan(0);
      });

      it('should create EC2 instances', () => {
        expect(countResources('aws_instance')).toBe(2); // public and private
        
        const instances = findAllResourcesByType('aws_instance');
        instances.forEach(instance => {
          expect(instance.instance_type).toBe('t3.micro');
          expect(instance.key_name).toBe('turing-key');
        });
      });

      it('should create RDS resources', () => {
        expect(countResources('aws_db_instance')).toBe(1);
        expect(countResources('aws_db_subnet_group')).toBe(1);
        
        const rdsInstance = findResourceByType('aws_db_instance');
        expect(rdsInstance.engine).toBe('postgres');
        expect(rdsInstance.instance_class).toBe('db.t3.micro');
        expect(rdsInstance.allocated_storage).toBe(20);
        expect(rdsInstance.db_name).toBe('appdb');
        expect(rdsInstance.username).toBe('dbadmin');
        expect(rdsInstance.storage_encrypted).toBe(true);
      });
    });

    describe('Security Configuration', () => {
      it('should encrypt S3 buckets with KMS', () => {
        const encryptionConfigs = findAllResourcesByType('aws_s3_bucket_server_side_encryption_configuration');
        encryptionConfigs.forEach(config => {
          expect(config.rule[0].apply_server_side_encryption_by_default[0].sse_algorithm).toBe('aws:kms');
        });
      });

      it('should configure proper security group rules for SSH access', () => {
        const sgRules = findAllResourcesByType('aws_security_group_rule');
        const sshRules = sgRules.filter(rule => rule.from_port === 22 && rule.to_port === 22);
        
        expect(sshRules.length).toBeGreaterThan(0);
        
        // Check that SSH is not open to the world
        sshRules.forEach(rule => {
          if (rule.cidr_blocks) {
            expect(rule.cidr_blocks).not.toContain('0.0.0.0/0');
          }
        });
      });

      it('should configure RDS security group for PostgreSQL access', () => {
        const sgRules = findAllResourcesByType('aws_security_group_rule');
        const postgresRules = sgRules.filter(rule => rule.from_port === 5432 && rule.to_port === 5432);
        
        expect(postgresRules.length).toBeGreaterThan(0);
      });

      it('should block public access for private S3 buckets', () => {
        const publicAccessBlocks = findAllResourcesByType('aws_s3_bucket_public_access_block');
        
        publicAccessBlocks.forEach(block => {
          expect(block.block_public_acls).toBe(true);
          expect(block.block_public_policy).toBe(true);
          expect(block.ignore_public_acls).toBe(true);
          expect(block.restrict_public_buckets).toBe(true);
        });
      });
    });

    describe('Outputs', () => {
      it('should define all required outputs', () => {
        const expectedOutputs = [
          'vpc-id',
          'public-subnet-ids',
          'private-subnet-ids',
          'public-ec2-instance-id',
          'public-ec2-public-ip',
          'private-ec2-instance-id',
          'private-ec2-private-ip',
          'public-s3-bucket-name',
          'private-s3-bucket-name',
          'rds-endpoint',
          'kms-key-id',
          'aws-account-id'
        ];

        expectedOutputs.forEach(outputName => {
          expect(hasOutput(outputName)).toBe(true);
          expect(synthesized.output[outputName].description).toBeDefined();
        });
      });

      it('should have proper output descriptions', () => {
        expect(synthesized.output['vpc-id'].description).toBe('VPC ID');
        expect(synthesized.output['public-subnet-ids'].description).toBe('Public subnet IDs');
        expect(synthesized.output['private-subnet-ids'].description).toBe('Private subnet IDs');
        expect(synthesized.output['rds-endpoint'].description).toBe('RDS instance endpoint');
      });
    });
  });

  describe('Custom Configuration', () => {
    beforeEach(() => {
      const app = Testing.app();
      const stack = new TapStack(app, 'custom-tap-stack', {
        environmentSuffix: 'staging',
        awsRegion: 'us-west-2',
        stateBucket: 'custom-terraform-state',
        stateBucketRegion: 'us-west-2',
        defaultTags: {
          tags: {
            Environment: 'staging',
            Project: 'tap-project',
            Owner: 'DevOps Team',
            CostCenter: '12345'
          }
        }
      });
      const synthResult = Testing.synth(stack);
      synthesized = JSON.parse(synthResult); // Parse the JSON string
    });

    it('should use custom configuration values', () => {
      expect(synthesized.provider.aws.region).toBe('us-east-1'); // AWS_REGION_OVERRIDE takes precedence
      
      const backend = synthesized.terraform.backend.s3;
      expect(backend.bucket).toBe('custom-terraform-state');
      expect(backend.key).toBe('staging/custom-tap-stack.tfstate');
      expect(backend.region).toBe('us-west-2');
    });

    it('should apply custom default tags', () => {
      expect(synthesized.provider.aws.default_tags).toEqual([{
        tags: {
          Environment: 'staging',
          Project: 'tap-project',
          Owner: 'DevOps Team',
          CostCenter: '12345'
        }
      }]);
    });

    it('should use environment suffix in resource names', () => {
      // This would depend on how your modules implement naming
      // The test assumes resources include the environment suffix
      const resourceString = JSON.stringify(synthesized);
      expect(resourceString).toContain('staging');
    });
  });

  describe('Resource Dependencies and References', () => {
    beforeEach(() => {
      const app = Testing.app();
      const stack = new TapStack(app, 'dependency-test-stack');
      const synthResult = Testing.synth(stack);
      synthesized = JSON.parse(synthResult); // Parse the JSON string
    });

    it('should have proper Terraform references between resources', () => {
      const resourceString = JSON.stringify(synthesized);
      
      // Check for common Terraform reference patterns
      expect(resourceString).toMatch(/\$\{[^}]+\}/); // Should contain Terraform interpolations
    });

    it('should reference VPC in subnets', () => {
      const subnets = findAllResourcesByType('aws_subnet');
      subnets.forEach(subnet => {
        expect(subnet.vpc_id).toMatch(/\$\{aws_vpc\./);
      });
    });

    it('should reference subnets in EC2 instances', () => {
      const instances = findAllResourcesByType('aws_instance');
      instances.forEach(instance => {
        expect(instance.subnet_id).toMatch(/\$\{aws_subnet\./);
      });
    });

    it('should reference KMS key in encrypted resources', () => {
      const encryptionConfigs = findAllResourcesByType('aws_s3_bucket_server_side_encryption_configuration');
      encryptionConfigs.forEach(config => {
        expect(config.rule[0].apply_server_side_encryption_by_default[0].kms_master_key_id).toMatch(/\$\{aws_kms_key\./);
      });
    });
  });

  describe('Resource Validation', () => {
    beforeEach(() => {
      const app = Testing.app();
      const stack = new TapStack(app, 'validation-test-stack');
      const synthResult = Testing.synth(stack);
      synthesized = JSON.parse(synthResult); // Parse the JSON string
    });

    it('should have valid VPC CIDR block', () => {
      const vpc = findResourceByType('aws_vpc');
      expect(vpc.cidr_block).toBe('10.0.0.0/16');
      expect(vpc.enable_dns_hostnames).toBe(true);
      expect(vpc.enable_dns_support).toBe(true);
    });

    it('should configure EC2 instances with user data for public instance', () => {
      const instances = findAllResourcesByType('aws_instance');
      const publicInstance = instances.find(instance => instance.user_data);
      
      expect(publicInstance).toBeDefined();
      expect(publicInstance.user_data).toContain('#!/bin/bash');
      expect(publicInstance.user_data).toContain('yum update -y');
    });

    it('should have proper availability zones configuration', () => {
      const subnets = findAllResourcesByType('aws_subnet');
      const azs = subnets.map(subnet => subnet.availability_zone).filter(Boolean);
      
      // Should have subnets in multiple AZs
      const uniqueAzs = [...new Set(azs)];
      expect(uniqueAzs.length).toBeGreaterThan(1);
    });

    it('should configure RDS with proper backup and maintenance settings', () => {
      const rdsInstance = findResourceByType('aws_db_instance');
      
      expect(rdsInstance.backup_retention_period).toBeGreaterThanOrEqual(0);
      expect(rdsInstance.skip_final_snapshot).toBeDefined();
    });
  });

  describe('Error Scenarios', () => {
    it('should handle empty props gracefully', () => {
      const app = Testing.app();
      expect(() => {
        new TapStack(app, 'empty-props-stack', {});
      }).not.toThrow();
    });

    it('should handle undefined props gracefully', () => {
      const app = Testing.app();
      expect(() => {
        new TapStack(app, 'undefined-props-stack');
      }).not.toThrow();
    });

    it('should use default values when props are not provided', () => {
      const app = Testing.app();
      const stack = new TapStack(app, 'default-values-stack');
      const synthResult = Testing.synth(stack);
      const synth = JSON.parse(synthResult); // Parse the JSON string
      
      expect(synth.provider.aws.region).toBe('us-east-1');
      expect(synth.terraform.backend.s3.bucket).toBe('iac-rlhf-tf-states');
      expect(synth.terraform.backend.s3.key).toBe('dev/default-values-stack.tfstate');
    });
  });

  describe('Module Integration', () => {
    beforeEach(() => {
      const app = Testing.app();
      const stack = new TapStack(app, 'module-integration-stack');
      const synthResult = Testing.synth(stack);
      synthesized = JSON.parse(synthResult); // Parse the JSON string
    });

    it('should integrate KMS module properly', () => {
      expect(countResources('aws_kms_key')).toBeGreaterThan(0);
      expect(countResources('aws_kms_alias')).toBeGreaterThan(0);
    });

    it('should integrate VPC module with all networking components', () => {
      expect(countResources('aws_vpc')).toBe(1);
      expect(countResources('aws_internet_gateway')).toBe(1);
      expect(countResources('aws_nat_gateway')).toBeGreaterThan(0);
      expect(countResources('aws_route_table')).toBeGreaterThan(0);
      expect(countResources('aws_subnet')).toBeGreaterThanOrEqual(4);
    });

    it('should integrate security group modules with proper rules', () => {
      expect(countResources('aws_security_group')).toBeGreaterThanOrEqual(3);
      expect(countResources('aws_security_group_rule')).toBeGreaterThan(0);
    });

    it('should integrate S3 modules with encryption and policies', () => {
      expect(countResources('aws_s3_bucket')).toBeGreaterThanOrEqual(3);
      expect(countResources('aws_s3_bucket_server_side_encryption_configuration')).toBeGreaterThan(0);
      expect(countResources('aws_s3_bucket_versioning')).toBeGreaterThan(0);
    });

    it('should integrate IAM module with roles and policies', () => {
      expect(countResources('aws_iam_role')).toBeGreaterThan(0);
      expect(countResources('aws_iam_instance_profile')).toBeGreaterThan(0);
      expect(countResources('aws_iam_policy')).toBeGreaterThan(0);
    });

    it('should integrate EC2 modules with proper configuration', () => {
      expect(countResources('aws_instance')).toBe(2);
      
      const instances = findAllResourcesByType('aws_instance');
      instances.forEach(instance => {
        expect(instance.instance_type).toBe('t3.micro');
        expect(instance.key_name).toBe('turing-key');
      });
    });

    it('should integrate RDS module with subnet group and security', () => {
      expect(countResources('aws_db_instance')).toBe(1);
      expect(countResources('aws_db_subnet_group')).toBe(1);
      
      const rdsInstance = findResourceByType('aws_db_instance');
      expect(rdsInstance.engine).toBe('postgres');
      expect(rdsInstance.storage_encrypted).toBe(true);
    });
  });

  describe('Stack Structure Validation', () => {
    beforeEach(() => {
      const app = Testing.app();
      const stack = new TapStack(app, 'structure-test-stack');
      const synthResult = Testing.synth(stack);
      synthesized = JSON.parse(synthResult); // Parse the JSON string
    });

    it('should have the expected top-level structure', () => {
      expect(synthesized).toHaveProperty('terraform');
      expect(synthesized).toHaveProperty('provider');
      expect(synthesized).toHaveProperty('data');
      expect(synthesized).toHaveProperty('resource');
      expect(synthesized).toHaveProperty('output');
    });

    it('should have terraform configuration with version constraints', () => {
      expect(synthesized.terraform).toBeDefined();
      expect(synthesized.terraform.required_providers).toBeDefined();
    });

    it('should have AWS provider configuration', () => {
      expect(synthesized.provider.aws).toBeDefined();
      expect(synthesized.provider.aws.region).toBeDefined();
    });
  });
});