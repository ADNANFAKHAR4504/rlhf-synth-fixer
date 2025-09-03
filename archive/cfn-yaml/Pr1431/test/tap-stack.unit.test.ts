import fs from 'fs';
import path from 'path';

// const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';

describe('Secure AWS Infrastructure CloudFormation Template', () => {
  let template: any;

  beforeAll(() => {
    const templatePath = path.join(__dirname, '../lib/TapStack.json');
    const templateContent = fs.readFileSync(templatePath, 'utf8');
    template = JSON.parse(templateContent);
  });

  describe('Template Structure', () => {
    test('should have valid CloudFormation format version', () => {
      expect(template.AWSTemplateFormatVersion).toBe('2010-09-09');
    });

    test('should have correct description', () => {
      expect(template.Description).toBeDefined();
      expect(template.Description).toBe(
        'Secure AWS Infrastructure Template - CIS Compliant with Encryption and IAM Best Practices'
      );
    });

    test('should have metadata section', () => {
      expect(template.Metadata).toBeDefined();
      expect(template.Metadata['AWS::CloudFormation::Interface']).toBeDefined();
    });
  });

  describe('Parameters', () => {
    test('should have all required parameters', () => {
      const expectedParams = [
        'Environment',
        'KMSKeyAlias',
        'EnvironmentSuffix',
      ];
      expectedParams.forEach(param => {
        expect(template.Parameters[param]).toBeDefined();
      });
    });

    test('EnvironmentSuffix parameter should have correct properties', () => {
      const envSuffixParam = template.Parameters.EnvironmentSuffix;
      expect(envSuffixParam.Type).toBe('String');
      expect(envSuffixParam.Default).toBe('dev');
      expect(envSuffixParam.AllowedPattern).toBe('^[a-zA-Z0-9]+$');
    });

    test('Environment parameter should have allowed values', () => {
      const envParam = template.Parameters.Environment;
      expect(envParam.Type).toBe('String');
      expect(envParam.AllowedValues).toEqual(['dev', 'staging', 'prod']);
    });

    test('KMSKeyAlias parameter should have correct properties', () => {
      const kmsAliasParam = template.Parameters.KMSKeyAlias;
      expect(kmsAliasParam.Type).toBe('String');
      expect(kmsAliasParam.Default).toBe('corp-security-key');
    });
  });

  describe('Security Resources', () => {
    test('should have KMS key for encryption', () => {
      expect(template.Resources.CorpSecurityKMSKey).toBeDefined();
      expect(template.Resources.CorpSecurityKMSKey.Type).toBe('AWS::KMS::Key');
    });

    test('KMS key should have key rotation enabled', () => {
      const kmsKey = template.Resources.CorpSecurityKMSKey;
      expect(kmsKey.Properties.EnableKeyRotation).toBe(true);
    });

    test('KMS key should have proper policy', () => {
      const kmsKey = template.Resources.CorpSecurityKMSKey;
      const policy = kmsKey.Properties.KeyPolicy;
      expect(policy.Version).toBe('2012-10-17');
      expect(Array.isArray(policy.Statement)).toBe(true);
      expect(policy.Statement.length).toBeGreaterThan(0);
    });

    test('should have KMS key alias', () => {
      expect(template.Resources.CorpSecurityKMSKeyAlias).toBeDefined();
      expect(template.Resources.CorpSecurityKMSKeyAlias.Type).toBe(
        'AWS::KMS::Alias'
      );
    });

    test('should have CloudTrail for audit logging', () => {
      expect(template.Resources.CorpCloudTrail).toBeDefined();
      expect(template.Resources.CorpCloudTrail.Type).toBe(
        'AWS::CloudTrail::Trail'
      );
    });

    test('CloudTrail should have proper security settings', () => {
      const cloudTrail = template.Resources.CorpCloudTrail;
      expect(cloudTrail.Properties.IsMultiRegionTrail).toBe(true);
      expect(cloudTrail.Properties.EnableLogFileValidation).toBe(true);
      expect(cloudTrail.Properties.IsLogging).toBe(true);
      expect(cloudTrail.Properties.KMSKeyId).toEqual({
        Ref: 'CorpSecurityKMSKey',
      });
    });
  });

  describe('IAM Resources', () => {
    test('should have EC2 IAM role', () => {
      expect(template.Resources.CorpEC2Role).toBeDefined();
      expect(template.Resources.CorpEC2Role.Type).toBe('AWS::IAM::Role');
    });

    test('EC2 role should have minimal permissions', () => {
      const ec2Role = template.Resources.CorpEC2Role;
      const policies = ec2Role.Properties.Policies;
      expect(Array.isArray(policies)).toBe(true);
      expect(policies[0].PolicyName).toBe('CorpEC2MinimalPolicy');
    });

    test('EC2 role should have region restriction', () => {
      const ec2Role = template.Resources.CorpEC2Role;
      const assumePolicy = ec2Role.Properties.AssumeRolePolicyDocument;
      const condition = assumePolicy.Statement[0].Condition;
      expect(condition.StringEquals['aws:RequestedRegion']).toBe('us-east-1');
    });

    test('should have Lambda execution role', () => {
      expect(template.Resources.CorpLambdaExecutionRole).toBeDefined();
      expect(template.Resources.CorpLambdaExecutionRole.Type).toBe(
        'AWS::IAM::Role'
      );
    });

    test('should have CloudTrail role', () => {
      expect(template.Resources.CorpCloudTrailRole).toBeDefined();
      expect(template.Resources.CorpCloudTrailRole.Type).toBe('AWS::IAM::Role');
    });

    test('should have EC2 instance profile', () => {
      expect(template.Resources.CorpEC2InstanceProfile).toBeDefined();
      expect(template.Resources.CorpEC2InstanceProfile.Type).toBe(
        'AWS::IAM::InstanceProfile'
      );
    });
  });

  describe('Storage Resources', () => {
    test('should have S3 bucket with encryption', () => {
      expect(template.Resources.CorpS3Bucket).toBeDefined();
      expect(template.Resources.CorpS3Bucket.Type).toBe('AWS::S3::Bucket');
    });

    test('S3 bucket should have KMS encryption', () => {
      const s3Bucket = template.Resources.CorpS3Bucket;
      const encryption = s3Bucket.Properties.BucketEncryption;
      expect(
        encryption.ServerSideEncryptionConfiguration[0]
          .ServerSideEncryptionByDefault.SSEAlgorithm
      ).toBe('aws:kms');
      expect(
        encryption.ServerSideEncryptionConfiguration[0]
          .ServerSideEncryptionByDefault.KMSMasterKeyID
      ).toEqual({ Ref: 'CorpSecurityKMSKey' });
    });

    test('S3 bucket should have versioning enabled', () => {
      const s3Bucket = template.Resources.CorpS3Bucket;
      expect(s3Bucket.Properties.VersioningConfiguration.Status).toBe(
        'Enabled'
      );
    });

    test('S3 bucket should block public access', () => {
      const s3Bucket = template.Resources.CorpS3Bucket;
      const publicAccess = s3Bucket.Properties.PublicAccessBlockConfiguration;
      expect(publicAccess.BlockPublicAcls).toBe(true);
      expect(publicAccess.BlockPublicPolicy).toBe(true);
      expect(publicAccess.IgnorePublicAcls).toBe(true);
      expect(publicAccess.RestrictPublicBuckets).toBe(true);
    });

    test('should have access logs bucket', () => {
      expect(template.Resources.CorpS3AccessLogsBucket).toBeDefined();
      expect(template.Resources.CorpS3AccessLogsBucket.Type).toBe(
        'AWS::S3::Bucket'
      );
    });

    test('access logs bucket should have lifecycle policy', () => {
      const logsBucket = template.Resources.CorpS3AccessLogsBucket;
      const lifecycle = logsBucket.Properties.LifecycleConfiguration;
      expect(lifecycle.Rules[0].ExpirationInDays).toBe(90);
    });
  });

  describe('Monitoring Resources', () => {
    test('should have CloudWatch log group', () => {
      expect(template.Resources.CorpCloudWatchLogGroup).toBeDefined();
      expect(template.Resources.CorpCloudWatchLogGroup.Type).toBe(
        'AWS::Logs::LogGroup'
      );
    });

    test('CloudWatch log group should be encrypted', () => {
      const logGroup = template.Resources.CorpCloudWatchLogGroup;
      expect(logGroup.Properties.KmsKeyId).toEqual({
        'Fn::GetAtt': ['CorpSecurityKMSKey', 'Arn'],
      });
    });

    test('CloudWatch log group should have retention policy', () => {
      const logGroup = template.Resources.CorpCloudWatchLogGroup;
      expect(logGroup.Properties.RetentionInDays).toBe(365);
    });
  });

  describe('Network Security', () => {
    test('should have VPC', () => {
      expect(template.Resources.CorpVPC).toBeDefined();
      expect(template.Resources.CorpVPC.Type).toBe('AWS::EC2::VPC');
    });

    test('VPC should have correct CIDR block', () => {
      const vpc = template.Resources.CorpVPC;
      expect(vpc.Properties.CidrBlock).toBe('10.0.0.0/16');
      expect(vpc.Properties.EnableDnsHostnames).toBe(true);
      expect(vpc.Properties.EnableDnsSupport).toBe(true);
    });

    test('should have public subnet', () => {
      expect(template.Resources.CorpPublicSubnet).toBeDefined();
      expect(template.Resources.CorpPublicSubnet.Type).toBe('AWS::EC2::Subnet');
    });

    test('should have internet gateway', () => {
      expect(template.Resources.CorpInternetGateway).toBeDefined();
      expect(template.Resources.CorpInternetGateway.Type).toBe(
        'AWS::EC2::InternetGateway'
      );
    });

    test('should have route table and route', () => {
      expect(template.Resources.CorpRouteTable).toBeDefined();
      expect(template.Resources.CorpRoute).toBeDefined();
      expect(template.Resources.CorpSubnetRouteTableAssociation).toBeDefined();
    });

    test('should have security group', () => {
      expect(template.Resources.CorpSecurityGroup).toBeDefined();
      expect(template.Resources.CorpSecurityGroup.Type).toBe(
        'AWS::EC2::SecurityGroup'
      );
    });

    test('security group should have restricted ingress', () => {
      const securityGroup = template.Resources.CorpSecurityGroup;
      const ingress = securityGroup.Properties.SecurityGroupIngress;
      expect(Array.isArray(ingress)).toBe(true);
      expect(ingress[0].FromPort).toBe(443);
      expect(ingress[0].ToPort).toBe(443);
      expect(ingress[0].CidrIp).toBe('10.0.0.0/8');
    });

    test('security group should have restricted egress', () => {
      const securityGroup = template.Resources.CorpSecurityGroup;
      const egress = securityGroup.Properties.SecurityGroupEgress;
      expect(Array.isArray(egress)).toBe(true);
      expect(egress.length).toBe(2);
    });
  });

  describe('Compliance Resources', () => {
    test('should have CloudTrail for audit logging', () => {
      expect(template.Resources.CorpCloudTrail).toBeDefined();
      expect(template.Resources.CorpCloudTrail.Type).toBe(
        'AWS::CloudTrail::Trail'
      );
    });

    test('CloudTrail should have encryption and logging enabled', () => {
      const cloudTrail = template.Resources.CorpCloudTrail;
      expect(cloudTrail.Properties.IsLogging).toBe(true);
      expect(cloudTrail.Properties.EnableLogFileValidation).toBe(true);
      expect(cloudTrail.Properties.KMSKeyId).toEqual({
        Ref: 'CorpSecurityKMSKey',
      });
    });
  });

  describe('Naming Conventions', () => {
    test('all resources should follow corp- prefix naming', () => {
      const resourceNames = Object.keys(template.Resources);
      resourceNames.forEach(resourceName => {
        expect(resourceName.startsWith('Corp')).toBe(true);
      });
    });

    test('resource tags should include Environment and compliance tags', () => {
      const kmsKey = template.Resources.CorpSecurityKMSKey;
      const tags = kmsKey.Properties.Tags;
      const tagKeys = tags.map((tag: any) => tag.Key);
      expect(tagKeys).toContain('Environment');
      expect(tagKeys).toContain('CISCompliance');
    });
  });

  describe('Outputs', () => {
    test('should have all required outputs', () => {
      const expectedOutputs = [
        'KMSKeyId',
        'KMSKeyArn',
        'S3BucketName',
        'EC2RoleArn',
        'LambdaRoleArn',
        'SecurityGroupId',
        'CloudWatchLogGroup',
        'StackName',
        'EnvironmentSuffix',
        'VPCId',
        'PublicSubnetId',
      ];

      expectedOutputs.forEach(outputName => {
        expect(template.Outputs[outputName]).toBeDefined();
      });
    });

    test('outputs should have proper export names', () => {
      const expectedExports = {
        KMSKeyId: 'KMSKey',
        KMSKeyArn: 'KMSKeyArn',
        S3BucketName: 'S3Bucket',
        EC2RoleArn: 'EC2Role',
        LambdaRoleArn: 'LambdaRole',
        SecurityGroupId: 'SecurityGroup',
        CloudWatchLogGroup: 'LogGroup',
        StackName: 'StackName',
        EnvironmentSuffix: 'EnvironmentSuffix',
        VPCId: 'VPC',
        PublicSubnetId: 'PublicSubnet',
      };

      Object.keys(template.Outputs).forEach(outputKey => {
        const output = template.Outputs[outputKey];
        const expectedExportKey =
          expectedExports[outputKey as keyof typeof expectedExports];
        expect(output.Export.Name).toEqual({
          'Fn::Sub': `\${AWS::StackName}-${expectedExportKey}`,
        });
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

    test('should have correct number of resources', () => {
      const resourceCount = Object.keys(template.Resources).length;
      expect(resourceCount).toBe(21);
    });

    test('should have correct number of parameters', () => {
      const parameterCount = Object.keys(template.Parameters).length;
      expect(parameterCount).toBe(3);
    });

    test('should have correct number of outputs', () => {
      const outputCount = Object.keys(template.Outputs).length;
      expect(outputCount).toBe(11);
    });
  });
});
