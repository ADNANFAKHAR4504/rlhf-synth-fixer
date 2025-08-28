import fs from 'fs';
import path from 'path';

const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';

describe('TapStack CloudFormation Template', () => {
  let template: any;

  beforeAll(() => {
    // If youre testing a yaml template. run `cfn-flip lib/TapStack.yml > lib/TapStack.json`
    // Otherwise, ensure the template is in JSON format.
    const templatePath = path.join(__dirname, '../lib/TapStack.json');
    const templateContent = fs.readFileSync(templatePath, 'utf8');
    template = JSON.parse(templateContent);
  });

  describe('Template Structure', () => {
    test('should have valid CloudFormation format version', () => {
      expect(template.AWSTemplateFormatVersion).toBe('2010-09-09');
    });

    test('should have a description', () => {
      expect(template.Description).toBeDefined();
      expect(template.Description).toBe(
        'TAP Stack - AWS CloudFormation template with security best practices and compliance for TAP environment'
      );
    });

    test('should have metadata section', () => {
      expect(template.Metadata).toBeDefined();
      expect(template.Metadata['AWS::CloudFormation::Interface']).toBeDefined();
    });
  });

  describe('Parameters', () => {
    test('should have EnvironmentSuffix parameter', () => {
      expect(template.Parameters.EnvironmentSuffix).toBeDefined();
    });

    test('should have AllowedSSHCIDR parameter', () => {
      expect(template.Parameters.AllowedSSHCIDR).toBeDefined();
    });

    test('should have DBUsername parameter', () => {
      expect(template.Parameters.DBUsername).toBeDefined();
    });

    test('EnvironmentSuffix parameter should have correct properties', () => {
      const envSuffixParam = template.Parameters.EnvironmentSuffix;
      expect(envSuffixParam.Type).toBe('String');
      expect(envSuffixParam.Default).toBe('dev');
      expect(envSuffixParam.Description).toBe(
        'Environment suffix for resource naming (e.g., dev, staging, prod)'
      );
      expect(envSuffixParam.AllowedPattern).toBe('^[a-zA-Z0-9]+$');
      expect(envSuffixParam.ConstraintDescription).toBe(
        'Must contain only alphanumeric characters'
      );
    });

    test('AllowedSSHCIDR parameter should have correct properties', () => {
      const sshParam = template.Parameters.AllowedSSHCIDR;
      expect(sshParam.Type).toBe('String');
      expect(sshParam.Default).toBe('10.0.0.0/8');
      expect(sshParam.Description).toBe('CIDR block allowed for SSH access');
    });

    test('DBUsername parameter should have correct properties', () => {
      const dbParam = template.Parameters.DBUsername;
      expect(dbParam.Type).toBe('String');
      expect(dbParam.Default).toBe('admin');
      expect(dbParam.Description).toBe('Database administrator username');
      expect(dbParam.NoEcho).toBe(true);
    });
  });

  describe('Resources', () => {
    test('should have TAPKMSKey resource', () => {
      expect(template.Resources.TAPKMSKey).toBeDefined();
      expect(template.Resources.TAPKMSKey.Type).toBe('AWS::KMS::Key');
    });

    test('should have TAPVPC resource', () => {
      expect(template.Resources.TAPVPC).toBeDefined();
      expect(template.Resources.TAPVPC.Type).toBe('AWS::EC2::VPC');
    });

    test('should have TAPApplicationLoadBalancer resource', () => {
      expect(template.Resources.TAPApplicationLoadBalancer).toBeDefined();
      expect(template.Resources.TAPApplicationLoadBalancer.Type).toBe(
        'AWS::ElasticLoadBalancingV2::LoadBalancer'
      );
    });

    test('should have TAPRDSInstance resource', () => {
      expect(template.Resources.TAPRDSInstance).toBeDefined();
      expect(template.Resources.TAPRDSInstance.Type).toBe(
        'AWS::RDS::DBInstance'
      );
    });

    test('should have TAPS3Bucket resource', () => {
      expect(template.Resources.TAPS3Bucket).toBeDefined();
      expect(template.Resources.TAPS3Bucket.Type).toBe('AWS::S3::Bucket');
    });

    test('should have TAPAutoScalingGroup resource', () => {
      expect(template.Resources.TAPAutoScalingGroup).toBeDefined();
      expect(template.Resources.TAPAutoScalingGroup.Type).toBe(
        'AWS::AutoScaling::AutoScalingGroup'
      );
    });

    test('VPC should have correct CIDR block', () => {
      const vpc = template.Resources.TAPVPC;
      expect(vpc.Properties.CidrBlock).toBe('10.0.0.0/16');
    });

    test('RDS instance should have correct properties', () => {
      const rds = template.Resources.TAPRDSInstance;
      expect(rds.Properties.Engine).toBe('mysql');
      expect(rds.Properties.DBInstanceClass).toBe('db.t3.micro');
      expect(rds.Properties.StorageEncrypted).toBe(true);
    });

    test('S3 bucket should have encryption enabled', () => {
      const bucket = template.Resources.TAPS3Bucket;
      expect(bucket.Properties.BucketEncryption).toBeDefined();
      expect(
        bucket.Properties.BucketEncryption.ServerSideEncryptionConfiguration
      ).toBeDefined();
    });

    test('Load balancer should be internet-facing', () => {
      const alb = template.Resources.TAPApplicationLoadBalancer;
      expect(alb.Properties.Scheme).toBe('internet-facing');
      expect(alb.Properties.Type).toBe('application');
    });
  });

  describe('Outputs', () => {
    test('should have all required outputs', () => {
      const expectedOutputs = [
        'VPCId',
        'LoadBalancerDNS',
        'S3BucketName',
        'KMSKeyId',
        'DatabaseSecretArn',
        'EnvironmentSuffix',
      ];

      expectedOutputs.forEach(outputName => {
        expect(template.Outputs[outputName]).toBeDefined();
      });
    });

    test('VPCId output should be correct', () => {
      const output = template.Outputs.VPCId;
      expect(output.Description).toBe('VPC ID');
      expect(output.Value).toEqual({ Ref: 'TAPVPC' });
      expect(output.Export.Name).toEqual({
        'Fn::Sub': '${AWS::StackName}-VPC-ID',
      });
    });

    test('LoadBalancerDNS output should be correct', () => {
      const output = template.Outputs.LoadBalancerDNS;
      expect(output.Description).toBe('Application Load Balancer DNS Name');
      expect(output.Value).toEqual({
        'Fn::GetAtt': ['TAPApplicationLoadBalancer', 'DNSName'],
      });
      expect(output.Export.Name).toEqual({
        'Fn::Sub': '${AWS::StackName}-ALB-DNS',
      });
    });

    test('S3BucketName output should be correct', () => {
      const output = template.Outputs.S3BucketName;
      expect(output.Description).toBe('TAP S3 Bucket Name');
      expect(output.Value).toEqual({ Ref: 'TAPS3Bucket' });
      expect(output.Export.Name).toEqual({
        'Fn::Sub': '${AWS::StackName}-S3-Bucket',
      });
    });

    test('KMSKeyId output should be correct', () => {
      const output = template.Outputs.KMSKeyId;
      expect(output.Description).toBe('KMS Key ID');
      expect(output.Value).toEqual({ Ref: 'TAPKMSKey' });
      expect(output.Export.Name).toEqual({
        'Fn::Sub': '${AWS::StackName}-KMS-Key',
      });
    });

    test('DatabaseSecretArn output should be correct', () => {
      const output = template.Outputs.DatabaseSecretArn;
      expect(output.Description).toBe('Database Secret ARN');
      expect(output.Value).toEqual({ Ref: 'TAPDatabaseSecret' });
      expect(output.Export.Name).toEqual({
        'Fn::Sub': '${AWS::StackName}-DB-Secret',
      });
    });

    test('EnvironmentSuffix output should be correct', () => {
      const output = template.Outputs.EnvironmentSuffix;
      expect(output.Description).toBe(
        'Environment suffix used for this deployment'
      );
      expect(output.Value).toEqual({ Ref: 'EnvironmentSuffix' });
      expect(output.Export.Name).toEqual({
        'Fn::Sub': '${AWS::StackName}-EnvironmentSuffix',
      });
    });
  });

  describe('Template Validation', () => {
    test('should have valid JSON structure', () => {
      expect(template).toBeDefined();
      expect(typeof template).toBe('object');
    });

    test('should not have any undefined or null required sections', () => {
      expect(template.AWSTemplateFormatVersion).not.toBeNull();
      expect(template.Description).not.toBeNull();
      expect(template.Parameters).not.toBeNull();
      expect(template.Resources).not.toBeNull();
      expect(template.Outputs).not.toBeNull();
    });

    test('should have multiple resources for a complete infrastructure', () => {
      const resourceCount = Object.keys(template.Resources).length;
      expect(resourceCount).toBeGreaterThan(20); // We have many resources (VPC, EC2, RDS, etc.)
    });

    test('should have three parameters', () => {
      const parameterCount = Object.keys(template.Parameters).length;
      expect(parameterCount).toBe(3);
    });

    test('should have six outputs', () => {
      const outputCount = Object.keys(template.Outputs).length;
      expect(outputCount).toBe(6);
    });
  });

  describe('Resource Naming Convention', () => {
    test('resources should have TAP prefix for naming consistency', () => {
      const resourceNames = Object.keys(template.Resources);
      const tapResources = resourceNames.filter(name => name.startsWith('TAP'));
      expect(tapResources.length).toBeGreaterThan(15); // Most resources should have TAP prefix
    });

    test('VPC should have proper naming with environment suffix', () => {
      const vpc = template.Resources.TAPVPC;
      const tags = vpc.Properties.Tags;
      const nameTag = tags.find((tag: any) => tag.Key === 'Name');
      expect(nameTag.Value).toEqual({
        'Fn::Sub': 'TAPVPC${EnvironmentSuffix}',
      });
    });

    test('export names should follow naming convention', () => {
      Object.keys(template.Outputs).forEach(outputKey => {
        const output = template.Outputs[outputKey];
        expect(output.Export.Name).toBeDefined();
        expect(output.Export.Name['Fn::Sub']).toMatch(
          /\$\{AWS::StackName\}-.+/
        );
      });
    });

    test('should have security best practices - AutoTerminate tags', () => {
      const resourcesWithTags = Object.values(template.Resources).filter(
        (resource: any) => resource.Properties && resource.Properties.Tags
      );

      resourcesWithTags.forEach((resource: any) => {
        const autoTerminateTag = resource.Properties.Tags.find(
          (tag: any) => tag.Key === 'AutoTerminate'
        );
        expect(autoTerminateTag).toBeDefined();
        expect(autoTerminateTag.Value).toBe('30');
      });
    });
  });

  describe('Security Best Practices', () => {
    test('S3 bucket should have public access blocked', () => {
      const bucket = template.Resources.TAPS3Bucket;
      const config = bucket.Properties.PublicAccessBlockConfiguration;
      expect(config.BlockPublicAcls).toBe(true);
      expect(config.BlockPublicPolicy).toBe(true);
      expect(config.IgnorePublicAcls).toBe(true);
      expect(config.RestrictPublicBuckets).toBe(true);
    });

    test('RDS should have encryption enabled', () => {
      const rds = template.Resources.TAPRDSInstance;
      expect(rds.Properties.StorageEncrypted).toBe(true);
      expect(rds.Properties.KmsKeyId).toEqual({ Ref: 'TAPKMSKey' });
    });

    test('Should have KMS key for encryption', () => {
      const kmsKey = template.Resources.TAPKMSKey;
      expect(kmsKey).toBeDefined();
      expect(kmsKey.Type).toBe('AWS::KMS::Key');
    });

    test('Database credentials should be stored in Secrets Manager', () => {
      const secret = template.Resources.TAPDatabaseSecret;
      expect(secret).toBeDefined();
      expect(secret.Type).toBe('AWS::SecretsManager::Secret');
      expect(secret.Properties.KmsKeyId).toEqual({ Ref: 'TAPKMSKey' });
    });
  });
});
