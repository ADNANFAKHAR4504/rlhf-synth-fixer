import path from 'path';
import { TemplateValidator } from '../lib/template-validator';

describe('TemplateValidator - CloudFormation Template Validation', () => {
  let validator: TemplateValidator;

  beforeAll(() => {
    const templatePath = path.join(__dirname, '../lib/TapStack.yml');
    validator = new TemplateValidator(templatePath);
  });

  describe('Template Structure', () => {
    test('loads template successfully', () => {
      const template = validator.getTemplate();
      expect(template).toBeDefined();
      expect(template.AWSTemplateFormatVersion).toBe('2010-09-09');
    });

    test('has required sections', () => {
      const template = validator.getTemplate();
      expect(template.Description).toBeDefined();
      expect(template.Parameters).toBeDefined();
      expect(template.Resources).toBeDefined();
      expect(template.Outputs).toBeDefined();
      expect(template.Metadata).toBeDefined();
    });

    test('has expected parameters', () => {
      const template = validator.getTemplate();
      expect(template.Parameters?.EnvironmentSuffix).toBeDefined();
      expect(template.Parameters?.ApplicationName).toBeDefined();
      expect(template.Parameters?.DatabaseInstanceClass).toBeDefined();
      expect(template.Parameters?.VpcCidr).toBeDefined();
    });
  });

  describe('HIPAA Compliance Validation', () => {
    test('validates all resources use KMS encryption', () => {
      const result = validator.validateHIPAACompliance();
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    test('detects S3 buckets have KMS encryption', () => {
      const template = validator.getTemplate();
      const s3Resources = Object.entries(template.Resources)
        .filter(([_, r]) => r.Type === 'AWS::S3::Bucket');
      
      expect(s3Resources.length).toBeGreaterThan(0);
      
      s3Resources.forEach(([name, resource]) => {
        const encryption = resource.Properties?.BucketEncryption?.ServerSideEncryptionConfiguration?.[0];
        expect(encryption).toBeDefined();
        expect(encryption.ServerSideEncryptionByDefault?.SSEAlgorithm).toBe('aws:kms');
      });
    });

    test('detects RDS has storage encryption', () => {
      const template = validator.getTemplate();
      const rdsResources = Object.entries(template.Resources)
        .filter(([_, r]) => r.Type === 'AWS::RDS::DBInstance');
      
      expect(rdsResources.length).toBeGreaterThan(0);
      
      rdsResources.forEach(([name, resource]) => {
        expect(resource.Properties?.StorageEncrypted).toBe(true);
        expect(resource.Properties?.KmsKeyId).toBeDefined();
      });
    });

    test('has required Secrets Manager secrets', () => {
      const template = validator.getTemplate();
      const secrets = Object.entries(template.Resources)
        .filter(([_, r]) => r.Type === 'AWS::SecretsManager::Secret');
      
      expect(secrets.length).toBeGreaterThanOrEqual(2);
      
      // Check for database and API secrets
      const secretNames = secrets.map(([name]) => name);
      expect(secretNames).toContain('DatabaseSecret');
      expect(secretNames).toContain('ApplicationAPISecret');
    });
  });

  describe('No Retain Policies Validation', () => {
    test('validates no resources have Retain policies', () => {
      const result = validator.validateNoRetainPolicies();
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    test('S3 buckets have Delete policies', () => {
      const template = validator.getTemplate();
      const s3Resources = Object.entries(template.Resources)
        .filter(([_, r]) => r.Type === 'AWS::S3::Bucket');
      
      s3Resources.forEach(([name, resource]) => {
        expect(resource.DeletionPolicy).toBe('Delete');
        expect(resource.UpdateReplacePolicy).toBe('Delete');
      });
    });

    test('RDS instance has Delete policy', () => {
      const template = validator.getTemplate();
      const rdsResources = Object.entries(template.Resources)
        .filter(([_, r]) => r.Type === 'AWS::RDS::DBInstance');
      
      rdsResources.forEach(([name, resource]) => {
        expect(resource.DeletionPolicy).toBe('Delete');
        expect(resource.UpdateReplacePolicy).toBe('Delete');
        expect(resource.Properties?.DeletionProtection).toBe(false);
      });
    });
  });

  describe('Required Tags Validation', () => {
    test('validates resources have required tags', () => {
      const result = validator.validateRequiredTags();
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    test('all taggable resources have Project: HealthApp tag', () => {
      const template = validator.getTemplate();
      const taggableTypes = [
        'AWS::S3::Bucket',
        'AWS::RDS::DBInstance',
        'AWS::EC2::VPC',
        'AWS::EC2::Subnet',
        'AWS::EC2::SecurityGroup',
        'AWS::IAM::Role',
        'AWS::Logs::LogGroup',
        'AWS::KMS::Key',
        'AWS::SecretsManager::Secret'
      ];

      Object.entries(template.Resources).forEach(([name, resource]) => {
        if (taggableTypes.includes(resource.Type) && resource.Properties?.Tags) {
          const tags = resource.Properties.Tags;
          const projectTag = tags.find((t: any) => t.Key === 'Project');
          expect(projectTag).toBeDefined();
          expect(projectTag?.Value).toBe('HealthApp');
        }
      });
    });

    test('all taggable resources have Environment: Production tag', () => {
      const template = validator.getTemplate();
      Object.entries(template.Resources).forEach(([name, resource]) => {
        if (resource.Properties?.Tags) {
          const tags = resource.Properties.Tags;
          const envTag = tags.find((t: any) => t.Key === 'Environment');
          if (envTag) {
            expect(envTag.Value).toBe('Production');
          }
        }
      });
    });
  });

  describe('Environment Suffix Validation', () => {
    test('validates environment suffix usage', () => {
      const result = validator.validateEnvironmentSuffix();
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    test('S3 bucket names include environment suffix', () => {
      const template = validator.getTemplate();
      const s3Resources = Object.entries(template.Resources)
        .filter(([_, r]) => r.Type === 'AWS::S3::Bucket');
      
      s3Resources.forEach(([name, resource]) => {
        const bucketName = resource.Properties?.BucketName;
        expect(bucketName).toBeDefined();
        if (typeof bucketName === 'object' && bucketName['Fn::Sub']) {
          expect(bucketName['Fn::Sub']).toContain('${EnvironmentSuffix}');
        }
      });
    });

    test('RDS instance identifier includes environment suffix', () => {
      const template = validator.getTemplate();
      const rdsResources = Object.entries(template.Resources)
        .filter(([_, r]) => r.Type === 'AWS::RDS::DBInstance');
      
      rdsResources.forEach(([name, resource]) => {
        const identifier = resource.Properties?.DBInstanceIdentifier;
        expect(identifier).toBeDefined();
        if (typeof identifier === 'object' && identifier['Fn::Sub']) {
          expect(identifier['Fn::Sub']).toContain('${EnvironmentSuffix}');
        }
      });
    });

    test('IAM role names include environment suffix', () => {
      const template = validator.getTemplate();
      const iamRoles = Object.entries(template.Resources)
        .filter(([_, r]) => r.Type === 'AWS::IAM::Role');
      
      iamRoles.forEach(([name, resource]) => {
        const roleName = resource.Properties?.RoleName;
        expect(roleName).toBeDefined();
        if (typeof roleName === 'object' && roleName['Fn::Sub']) {
          expect(roleName['Fn::Sub']).toContain('${EnvironmentSuffix}');
        }
      });
    });
  });

  describe('Public Access Block Validation', () => {
    test('validates S3 buckets have public access blocked', () => {
      const result = validator.validatePublicAccessBlock();
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    test('all S3 buckets have complete public access block configuration', () => {
      const template = validator.getTemplate();
      const s3Resources = Object.entries(template.Resources)
        .filter(([_, r]) => r.Type === 'AWS::S3::Bucket');
      
      s3Resources.forEach(([name, resource]) => {
        const pab = resource.Properties?.PublicAccessBlockConfiguration;
        expect(pab).toBeDefined();
        expect(pab.BlockPublicAcls).toBe(true);
        expect(pab.BlockPublicPolicy).toBe(true);
        expect(pab.IgnorePublicAcls).toBe(true);
        expect(pab.RestrictPublicBuckets).toBe(true);
      });
    });
  });

  describe('Outputs Validation', () => {
    test('validates all required outputs exist', () => {
      const result = validator.validateOutputs();
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    test('has all expected output keys', () => {
      const template = validator.getTemplate();
      const expectedOutputs = [
        'VPCId',
        'PrivateSubnetIds',
        'PublicSubnetIds',
        'DatabaseEndpoint',
        'KMSKeyId',
        'PatientDataBucket',
        'LogsBucket',
        'DatabaseSecretArn',
        'ApplicationAPISecretArn',
        'ApplicationRoleArn',
        'ApplicationSecurityGroupId',
        'LoadBalancerSecurityGroupId'
      ];

      expectedOutputs.forEach(output => {
        expect(template.Outputs?.[output]).toBeDefined();
        expect(template.Outputs?.[output].Value).toBeDefined();
        expect(template.Outputs?.[output].Export).toBeDefined();
      });
    });
  });

  describe('Complete Validation', () => {
    test('passes all validation checks', () => {
      const result = validator.validateAll();
      expect(result.valid).toBe(true);
      
      Object.entries(result.results).forEach(([check, checkResult]) => {
        expect(checkResult.valid).toBe(true);
        expect(checkResult.errors).toHaveLength(0);
      });
    });
  });

  describe('Security and Networking', () => {
    test('VPC has required configuration', () => {
      const template = validator.getTemplate();
      const vpc = Object.values(template.Resources).find(r => r.Type === 'AWS::EC2::VPC');
      expect(vpc).toBeDefined();
      expect(vpc?.Properties?.EnableDnsHostnames).toBe(true);
      expect(vpc?.Properties?.EnableDnsSupport).toBe(true);
    });

    test('has private and public subnets', () => {
      const template = validator.getTemplate();
      const subnets = Object.entries(template.Resources)
        .filter(([_, r]) => r.Type === 'AWS::EC2::Subnet');
      
      expect(subnets.length).toBeGreaterThanOrEqual(4); // At least 2 private and 2 public
      
      const privateSubnets = subnets.filter(([name]) => name.includes('Private'));
      const publicSubnets = subnets.filter(([name]) => name.includes('Public'));
      
      expect(privateSubnets.length).toBeGreaterThanOrEqual(2);
      expect(publicSubnets.length).toBeGreaterThanOrEqual(2);
    });

    test('security groups have proper ingress rules', () => {
      const template = validator.getTemplate();
      const securityGroups = Object.entries(template.Resources)
        .filter(([_, r]) => r.Type === 'AWS::EC2::SecurityGroup');
      
      expect(securityGroups.length).toBeGreaterThan(0);
      
      // Check for database security group
      const dbSg = securityGroups.find(([name]) => name.includes('Database'));
      expect(dbSg).toBeDefined();
      
      // Check for application security group
      const appSg = securityGroups.find(([name]) => name.includes('Application'));
      expect(appSg).toBeDefined();
      
      // Check for load balancer security group
      const albSg = securityGroups.find(([name]) => name.includes('LoadBalancer'));
      expect(albSg).toBeDefined();
    });
  });

  describe('Database Configuration', () => {
    test('RDS instance has proper backup configuration', () => {
      const template = validator.getTemplate();
      const rds = Object.values(template.Resources).find(r => r.Type === 'AWS::RDS::DBInstance');
      
      expect(rds).toBeDefined();
      expect(rds?.Properties?.BackupRetentionPeriod).toBeGreaterThanOrEqual(30);
      expect(rds?.Properties?.PreferredBackupWindow).toBeDefined();
      expect(rds?.Properties?.PreferredMaintenanceWindow).toBeDefined();
    });

    test('RDS has performance insights enabled', () => {
      const template = validator.getTemplate();
      const rds = Object.values(template.Resources).find(r => r.Type === 'AWS::RDS::DBInstance');
      
      expect(rds?.Properties?.EnablePerformanceInsights).toBe(true);
      expect(rds?.Properties?.PerformanceInsightsKMSKeyId).toBeDefined();
    });

    test('RDS has monitoring configured', () => {
      const template = validator.getTemplate();
      const rds = Object.values(template.Resources).find(r => r.Type === 'AWS::RDS::DBInstance');
      
      expect(rds?.Properties?.MonitoringInterval).toBe(60);
      expect(rds?.Properties?.MonitoringRoleArn).toBeDefined();
    });
  });

  describe('CloudWatch Logs Configuration', () => {
    test('log group has proper retention and encryption', () => {
      const template = validator.getTemplate();
      const logGroup = Object.values(template.Resources).find(r => r.Type === 'AWS::Logs::LogGroup');
      
      expect(logGroup).toBeDefined();
      expect(logGroup?.Properties?.RetentionInDays).toBeDefined();
      expect(logGroup?.Properties?.KmsKeyId).toBeDefined();
    });
  });
});