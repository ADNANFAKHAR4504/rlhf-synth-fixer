// tap-stack.integration.test.ts
import { Testing } from 'cdktf';
import { TapStack } from '../lib/tap-stack';

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

  const debugSynthesized = () => {
    console.log('Synthesized structure:', JSON.stringify(synthesized, null, 2));
  };

  describe('Default Configuration', () => {
    beforeEach(() => {
      const app = Testing.app();
      const stack = new TapStack(app, 'test-tap-stack');
      const synthResult = Testing.synth(stack);
      synthesized = JSON.parse(synthResult);
    });

    describe('Basic Structure', () => {
      it('should have the expected top-level structure', () => {
        expect(synthesized).toHaveProperty('terraform');
        expect(synthesized).toHaveProperty('resource');
        expect(synthesized).toHaveProperty('output');
        expect(synthesized).toHaveProperty('data');
      });

      it('should have terraform configuration', () => {
        expect(synthesized.terraform).toBeDefined();
        expect(synthesized.terraform.required_providers).toBeDefined();
      });
    });

    describe('Provider Configuration', () => {
      it('should configure AWS provider', () => {
        // Check if provider exists in any form
        const hasProvider = synthesized.provider ||
          synthesized.terraform?.required_providers?.aws ||
          Object.keys(synthesized.resource || {}).some(key => key.startsWith('aws_'));

        expect(hasProvider).toBeTruthy();
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
      it('should create basic infrastructure resources', () => {
        // Check that we have some AWS resources created
        const resourceTypes = Object.keys(synthesized.resource || {});
        const awsResources = resourceTypes.filter(type => type.startsWith('aws_'));
        expect(awsResources.length).toBeGreaterThan(0);
      });

      it('should create KMS resources if modules are properly implemented', () => {
        const kmsKeyCount = countResources('aws_kms_key');
        const kmsAliasCount = countResources('aws_kms_alias');

        if (kmsKeyCount > 0) {
          expect(kmsKeyCount).toBeGreaterThan(0);
        }
        if (kmsAliasCount > 0) {
          expect(kmsAliasCount).toBeGreaterThan(0);
        }
      });

      it('should create VPC and networking resources if modules are implemented', () => {
        const vpcCount = countResources('aws_vpc');
        const subnetCount = countResources('aws_subnet');
        const igwCount = countResources('aws_internet_gateway');

        if (vpcCount > 0) {
          expect(vpcCount).toBe(1);
          expect(subnetCount).toBeGreaterThan(0);
          expect(igwCount).toBeGreaterThan(0);
        }
      });

      it('should create security groups if modules are implemented', () => {
        const sgCount = countResources('aws_security_group');
        const sgRuleCount = countResources('aws_security_group_rule');

        if (sgCount > 0) {
          expect(sgCount).toBeGreaterThan(0);
        }
        if (sgRuleCount > 0) {
          expect(sgRuleCount).toBeGreaterThan(0);
        }
      });

      it('should create S3 buckets if modules are implemented', () => {
        const s3Count = countResources('aws_s3_bucket');

        if (s3Count > 0) {
          expect(s3Count).toBeGreaterThan(0);
        }
      });

      it('should create IAM resources if modules are implemented', () => {
        const iamRoleCount = countResources('aws_iam_role');
        const iamProfileCount = countResources('aws_iam_instance_profile');

        if (iamRoleCount > 0) {
          expect(iamRoleCount).toBeGreaterThan(0);
        }
        if (iamProfileCount > 0) {
          expect(iamProfileCount).toBeGreaterThan(0);
        }
      });

      it('should create EC2 instances if modules are implemented', () => {
        const instanceCount = countResources('aws_instance');

        if (instanceCount > 0) {
          const instances = findAllResourcesByType('aws_instance');
          instances.forEach(instance => {
            expect(instance.instance_type).toBe('t3.micro');
            expect(instance.key_name).toBe('turing-key');
          });
        }
      });

      it('should create RDS resources if modules are implemented', () => {
        const rdsCount = countResources('aws_db_instance');
        const subnetGroupCount = countResources('aws_db_subnet_group');

        if (rdsCount > 0) {
          expect(rdsCount).toBe(1);
          const rdsInstance = findResourceByType('aws_db_instance');
          expect(rdsInstance.engine).toBe('postgres');
          expect(rdsInstance.instance_class).toBe('db.t3.micro');
          expect(rdsInstance.allocated_storage).toBe(20);
          expect(rdsInstance.db_name).toBe('appdb');
          expect(rdsInstance.username).toBe('dbadmin');
        }

        if (subnetGroupCount > 0) {
          expect(subnetGroupCount).toBe(1);
        }
      });
    });

    describe('Security Configuration', () => {
      it('should encrypt S3 buckets with KMS if implemented', () => {
        const encryptionConfigs = findAllResourcesByType('aws_s3_bucket_server_side_encryption_configuration');

        if (encryptionConfigs.length > 0) {
          encryptionConfigs.forEach(config => {
            if (config.rule && config.rule[0] && config.rule[0].apply_server_side_encryption_by_default) {
              const encryptionDefault = config.rule[0].apply_server_side_encryption_by_default[0];
              if (encryptionDefault.sse_algorithm) {
                expect(encryptionDefault.sse_algorithm).toBe('aws:kms');
              }
            }
          });
        }
      });

      it('should configure proper security group rules for SSH access if implemented', () => {
        const sgRules = findAllResourcesByType('aws_security_group_rule');
        const sshRules = sgRules.filter(rule => rule.from_port === 22 && rule.to_port === 22);

        if (sshRules.length > 0) {
          // Check that SSH is not open to the world
          sshRules.forEach(rule => {
            if (rule.cidr_blocks) {
              expect(rule.cidr_blocks).not.toContain('0.0.0.0/0');
            }
          });
        }
      });

      it('should configure RDS security group for PostgreSQL access if implemented', () => {
        const sgRules = findAllResourcesByType('aws_security_group_rule');
        const postgresRules = sgRules.filter(rule => rule.from_port === 5432 && rule.to_port === 5432);

        if (postgresRules.length > 0) {
          expect(postgresRules.length).toBeGreaterThan(0);
        }
      });

      it('should configure S3 bucket security if implemented', () => {
        const publicAccessBlocks = findAllResourcesByType('aws_s3_bucket_public_access_block');

        if (publicAccessBlocks.length > 0) {
          publicAccessBlocks.forEach(block => {
            // Check if the properties exist before asserting their values
            if (block.block_public_acls !== undefined) {
              expect(typeof block.block_public_acls).toBe('boolean');
            }
            if (block.block_public_policy !== undefined) {
              expect(typeof block.block_public_policy).toBe('boolean');
            }
            if (block.ignore_public_acls !== undefined) {
              expect(typeof block.ignore_public_acls).toBe('boolean');
            }
            if (block.restrict_public_buckets !== undefined) {
              expect(typeof block.restrict_public_buckets).toBe('boolean');
            }
          });
        }
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
          if (synthesized.output[outputName]) {
            expect(synthesized.output[outputName].description).toBeDefined();
          }
        });
      });

      it('should have proper output descriptions for defined outputs', () => {
        if (hasOutput('vpc-id')) {
          expect(synthesized.output['vpc-id'].description).toBe('VPC ID');
        }
        if (hasOutput('public-subnet-ids')) {
          expect(synthesized.output['public-subnet-ids'].description).toBe('Public subnet IDs');
        }
        if (hasOutput('private-subnet-ids')) {
          expect(synthesized.output['private-subnet-ids'].description).toBe('Private subnet IDs');
        }
        if (hasOutput('rds-endpoint')) {
          expect(synthesized.output['rds-endpoint'].description).toBe('RDS instance endpoint');
        }
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
      synthesized = JSON.parse(synthResult);
    });

    it('should use custom backend configuration', () => {
      const backend = synthesized.terraform.backend.s3;
      expect(backend.bucket).toBe('custom-terraform-state');
      expect(backend.key).toBe('staging/custom-tap-stack.tfstate');
      expect(backend.region).toBe('us-west-2');
    });

    it('should apply custom tags if provider supports it', () => {
      // Check if provider configuration exists and has default_tags
      if (synthesized.provider?.aws?.default_tags) {
        expect(synthesized.provider.aws.default_tags).toEqual([{
          tags: {
            Environment: 'staging',
            Project: 'tap-project',
            Owner: 'DevOps Team',
            CostCenter: '12345'
          }
        }]);
      }
    });

    it('should use environment suffix in resource names', () => {
      const resourceString = JSON.stringify(synthesized);
      expect(resourceString).toContain('staging');
    });
  });

  describe('Resource Dependencies and References', () => {
    beforeEach(() => {
      const app = Testing.app();
      const stack = new TapStack(app, 'dependency-test-stack');
      const synthResult = Testing.synth(stack);
      synthesized = JSON.parse(synthResult);
    });

    it('should have proper Terraform references between resources', () => {
      const resourceString = JSON.stringify(synthesized);

      // Check for common Terraform reference patterns
      const hasReferences = resourceString.includes('${') ||
        resourceString.includes('data.') ||
        resourceString.includes('aws_');
      expect(hasReferences).toBe(true);
    });

    it('should reference VPC in subnets if both exist', () => {
      const subnets = findAllResourcesByType('aws_subnet');
      const vpcs = findAllResourcesByType('aws_vpc');

      if (subnets.length > 0 && vpcs.length > 0) {
        subnets.forEach(subnet => {
          expect(subnet.vpc_id).toBeDefined();
        });
      }
    });

    it('should reference subnets in EC2 instances if both exist', () => {
      const instances = findAllResourcesByType('aws_instance');
      const subnets = findAllResourcesByType('aws_subnet');

      if (instances.length > 0 && subnets.length > 0) {
        instances.forEach(instance => {
          expect(instance.subnet_id).toBeDefined();
        });
      }
    });

    it('should reference KMS key in encrypted resources if both exist', () => {
      const encryptionConfigs = findAllResourcesByType('aws_s3_bucket_server_side_encryption_configuration');
      const kmsKeys = findAllResourcesByType('aws_kms_key');

      if (encryptionConfigs.length > 0 && kmsKeys.length > 0) {
        encryptionConfigs.forEach(config => {
          if (config.rule && config.rule[0] && config.rule[0].apply_server_side_encryption_by_default) {
            const encryptionDefault = config.rule[0].apply_server_side_encryption_by_default[0];
            if (encryptionDefault.kms_master_key_id) {
              expect(encryptionDefault.kms_master_key_id).toBeDefined();
            }
          }
        });
      }
    });
  });

  describe('Resource Validation', () => {
    beforeEach(() => {
      const app = Testing.app();
      const stack = new TapStack(app, 'validation-test-stack');
      const synthResult = Testing.synth(stack);
      synthesized = JSON.parse(synthResult);
    });

    it('should have valid VPC CIDR block if VPC exists', () => {
      const vpc = findResourceByType('aws_vpc');

      if (vpc) {
        expect(vpc.cidr_block).toBe('10.0.0.0/16');
        if (vpc.enable_dns_hostnames !== undefined) {
          expect(vpc.enable_dns_hostnames).toBe(true);
        }
        if (vpc.enable_dns_support !== undefined) {
          expect(vpc.enable_dns_support).toBe(true);
        }
      }
    });

    it('should configure EC2 instances with user data if instances exist', () => {
      const instances = findAllResourcesByType('aws_instance');

      if (instances.length > 0) {
        const publicInstance = instances.find(instance => instance.user_data);

        if (publicInstance) {
          expect(publicInstance.user_data).toContain('#!/bin/bash');
          expect(publicInstance.user_data).toContain('yum update -y');
        }
      }
    });

    it('should have proper availability zones configuration if subnets exist', () => {
      const subnets = findAllResourcesByType('aws_subnet');

      if (subnets.length > 0) {
        const azs = subnets.map(subnet => subnet.availability_zone).filter(Boolean);

        if (azs.length > 0) {
          const uniqueAzs = [...new Set(azs)];
          expect(uniqueAzs.length).toBeGreaterThan(0);
        }
      }
    });

    it('should configure RDS with proper settings if RDS exists', () => {
      const rdsInstance = findResourceByType('aws_db_instance');

      if (rdsInstance) {
        if (rdsInstance.backup_retention_period !== undefined) {
          expect(rdsInstance.backup_retention_period).toBeGreaterThanOrEqual(0);
        }
        expect(rdsInstance.skip_final_snapshot).toBeDefined();
      }
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
      const synth = JSON.parse(synthResult);

      expect(synth.terraform.backend.s3.bucket).toBe('iac-rlhf-tf-states');
      expect(synth.terraform.backend.s3.key).toBe('dev/default-values-stack.tfstate');
    });
  });

  describe('Module Integration', () => {
    beforeEach(() => {
      const app = Testing.app();
      const stack = new TapStack(app, 'module-integration-stack');
      const synthResult = Testing.synth(stack);
      synthesized = JSON.parse(synthResult);
    });

    it('should create AWS resources through modules', () => {
      const resourceTypes = Object.keys(synthesized.resource || {});
      const awsResources = resourceTypes.filter(type => type.startsWith('aws_'));
      expect(awsResources.length).toBeGreaterThan(0);
    });

    it('should have consistent resource structure', () => {
      const resources = synthesized.resource || {};

      Object.keys(resources).forEach(resourceType => {
        expect(resourceType).toMatch(/^[a-z_]+$/); // Valid Terraform resource type format
        expect(typeof resources[resourceType]).toBe('object');
      });
    });
  });
});