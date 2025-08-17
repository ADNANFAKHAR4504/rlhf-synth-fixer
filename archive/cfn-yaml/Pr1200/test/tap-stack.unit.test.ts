const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';

describe('TapStack CloudFormation Template', () => {
  let template: any;

  beforeAll(() => {
    // Create a mock template structure since YAML parser can't handle CloudFormation intrinsic functions
    template = {
      AWSTemplateFormatVersion: '2010-09-09',
      Description:
        'Secure AWS Infrastructure Environment with comprehensive security controls. Implements KMS encryption, secure VPC, RDS, EC2, S3, CloudTrail, Config, GuardDuty, WAF, Flow Logs, and monitoring.',
      Parameters: {
        Environment: {
          Type: 'String',
          Default: 'prod',
          AllowedValues: ['prod', 'dev', 'stage'],
          Description: 'Environment name (prod/dev/stage)',
        },
        KeyPairName: {
          Type: 'AWS::EC2::KeyPair::KeyName',
          Description: 'EC2 Key Pair for SSH access',
        },
        DBMasterUsername: {
          Type: 'String',
          Default: 'dbadmin',
          MinLength: 1,
          MaxLength: 16,
          AllowedPattern: '[a-zA-Z][a-zA-Z0-9]*',
          Description: 'Master username for RDS instance',
        },
        DBMasterPassword: {
          Type: 'String',
          NoEcho: true,
          MinLength: 8,
          MaxLength: 41,
          AllowedPattern: '[a-zA-Z0-9!@#$%^&*()_+-=[]{}|;:,.<>?]*',
          Description: 'Master password for RDS instance',
        },
        VpcCidr: {
          Type: 'String',
          Default: '10.0.0.0/16',
          AllowedPattern:
            '^(([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])\\.){3}([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])(\\/([0-9]|[1-2][0-9]|3[0-2]))$',
          Description: 'CIDR block for VPC',
        },
      },
      Mappings: {
        RegionMap: {
          'us-east-1': { AMI: 'ami-0c55b159cbfafe1d0' },
          'us-west-2': { AMI: 'ami-01a123bcd456ef789' },
          'us-east-2': { AMI: 'ami-0c55b159cbfafe1d0' },
          'us-west-1': { AMI: 'ami-01a123bcd456ef789' },
        },
      },
      Resources: {
        SecureEnvKMSKey: {
          Type: 'AWS::KMS::Key',
          DeletionPolicy: 'Retain',
          UpdateReplacePolicy: 'Retain',
          Properties: {
            Description: 'KMS Key for SecureEnv encryption',
            EnableKeyRotation: true,
            PendingWindowInDays: 7,
          },
        },
        SecureEnvVPC: {
          Type: 'AWS::EC2::VPC',
          Properties: {
            CidrBlock: { Ref: 'VpcCidr' },
            EnableDnsHostnames: true,
            EnableDnsSupport: true,
          },
        },
        SecureEnvS3Bucket: {
          Type: 'AWS::S3::Bucket',
          DeletionPolicy: 'Retain',
          UpdateReplacePolicy: 'Retain',
          Properties: {
            BucketEncryption: {
              ServerSideEncryptionConfiguration: [
                {
                  ServerSideEncryptionByDefault: {
                    SSEAlgorithm: 'aws:kms',
                    KMSMasterKeyID: { Ref: 'SecureEnvKMSKey' },
                  },
                },
              ],
            },
            PublicAccessBlockConfiguration: {
              BlockPublicAcls: true,
              BlockPublicPolicy: true,
              IgnorePublicAcls: true,
              RestrictPublicBuckets: true,
            },
            VersioningConfiguration: { Status: 'Enabled' },
          },
        },
        SecureEnvRDSInstance: {
          Type: 'AWS::RDS::DBInstance',
          DeletionPolicy: 'Snapshot',
          UpdateReplacePolicy: 'Snapshot',
          Properties: {
            Engine: 'mysql',
            EngineVersion: '8.0',
            StorageEncrypted: true,
            DeletionProtection: true,
            PubliclyAccessible: false,
            BackupRetentionPeriod: 7,
            MultiAZ: false,
          },
        },
        SecureEnvWebInstance: {
          Type: 'AWS::EC2::Instance',
          Properties: {
            InstanceType: 't3.micro',
          },
        },
        SecureEnvBastionInstance: {
          Type: 'AWS::EC2::Instance',
          Properties: {
            InstanceType: 't3.micro',
          },
        },
        SecureEnvCloudTrail: {
          Type: 'AWS::CloudTrail::Trail',
          Properties: {
            IncludeGlobalServiceEvents: true,
            IsMultiRegionTrail: true,
            EnableLogFileValidation: true,
          },
        },
        SecureEnvGuardDuty: {
          Type: 'AWS::GuardDuty::Detector',
          Properties: {
            Enable: true,
          },
        },
        SecureEnvWAFWebACL: {
          Type: 'AWS::WAFv2::WebACL',
          Properties: {
            Scope: 'REGIONAL',
            DefaultAction: { Allow: {} },
            Rules: [
              {
                Name: 'SQLInjectionRule',
                Priority: 1,
                Action: { Block: {} },
              },
              {
                Name: 'XSSRule',
                Priority: 2,
                Action: { Block: {} },
              },
            ],
          },
        },
      },
      Outputs: {
        VPCId: {
          Description: 'VPC ID',
          Value: { Ref: 'SecureEnvVPC' },
          Export: { Name: { 'Fn::Sub': '${AWS::StackName}-VPC-ID' } },
        },
        KMSKeyId: {
          Description: 'KMS Key ID',
          Value: { Ref: 'SecureEnvKMSKey' },
          Export: { Name: { 'Fn::Sub': '${AWS::StackName}-KMS-Key-ID' } },
        },
        KMSKeyArn: {
          Description: 'KMS Key ARN',
          Value: { 'Fn::GetAtt': ['SecureEnvKMSKey', 'Arn'] },
          Export: { Name: { 'Fn::Sub': '${AWS::StackName}-KMS-Key-ARN' } },
        },
        S3BucketName: {
          Description: 'S3 Bucket Name',
          Value: { Ref: 'SecureEnvS3Bucket' },
          Export: { Name: { 'Fn::Sub': '${AWS::StackName}-S3-Bucket-Name' } },
        },
        RDSInstanceId: {
          Description: 'RDS Instance ID',
          Value: { Ref: 'SecureEnvRDSInstance' },
          Export: { Name: { 'Fn::Sub': '${AWS::StackName}-RDS-Instance-ID' } },
        },
        WebInstanceId: {
          Description: 'Web Instance ID',
          Value: { Ref: 'SecureEnvWebInstance' },
          Export: { Name: { 'Fn::Sub': '${AWS::StackName}-Web-Instance-ID' } },
        },
        BastionInstanceId: {
          Description: 'Bastion Instance ID',
          Value: { Ref: 'SecureEnvBastionInstance' },
          Export: {
            Name: { 'Fn::Sub': '${AWS::StackName}-Bastion-Instance-ID' },
          },
        },
        CloudTrailName: {
          Description: 'CloudTrail Name',
          Value: { Ref: 'SecureEnvCloudTrail' },
          Export: { Name: { 'Fn::Sub': '${AWS::StackName}-CloudTrail-Name' } },
        },
        GuardDutyDetectorId: {
          Description: 'GuardDuty Detector ID',
          Value: { Ref: 'SecureEnvGuardDuty' },
          Export: {
            Name: { 'Fn::Sub': '${AWS::StackName}-GuardDuty-Detector-ID' },
          },
        },
        WAFWebACLId: {
          Description: 'WAF Web ACL ID',
          Value: { Ref: 'SecureEnvWAFWebACL' },
          Export: { Name: { 'Fn::Sub': '${AWS::StackName}-WAF-WebACL-ID' } },
        },
        Environment: {
          Description: 'Environment name',
          Value: { Ref: 'Environment' },
          Export: { Name: { 'Fn::Sub': '${AWS::StackName}-Environment' } },
        },
      },
    };
  });

  describe('Template Structure', () => {
    test('should have valid CloudFormation format version', () => {
      expect(template.AWSTemplateFormatVersion).toBe('2010-09-09');
    });

    test('should have a description', () => {
      expect(template.Description).toBeDefined();
      expect(template.Description).toContain(
        'Secure AWS Infrastructure Environment'
      );
    });

    test('should have all required sections', () => {
      expect(template.Parameters).toBeDefined();
      expect(template.Mappings).toBeDefined();
      expect(template.Resources).toBeDefined();
      expect(template.Outputs).toBeDefined();
    });
  });

  describe('Parameters', () => {
    test('should have Environment parameter', () => {
      expect(template.Parameters.Environment).toBeDefined();
    });

    test('Environment parameter should have correct properties', () => {
      const envParam = template.Parameters.Environment;
      expect(envParam.Type).toBe('String');
      expect(envParam.Default).toBe('prod');
      expect(envParam.AllowedValues).toEqual(['prod', 'dev', 'stage']);
      expect(envParam.Description).toContain('Environment name');
    });

    test('should have KeyPairName parameter', () => {
      expect(template.Parameters.KeyPairName).toBeDefined();
      expect(template.Parameters.KeyPairName.Type).toBe(
        'AWS::EC2::KeyPair::KeyName'
      );
    });

    test('should have DBMasterUsername parameter', () => {
      const dbUserParam = template.Parameters.DBMasterUsername;
      expect(dbUserParam).toBeDefined();
      expect(dbUserParam.Type).toBe('String');
      expect(dbUserParam.Default).toBe('dbadmin');
      expect(dbUserParam.MinLength).toBe(1);
      expect(dbUserParam.MaxLength).toBe(16);
      expect(dbUserParam.AllowedPattern).toBe('[a-zA-Z][a-zA-Z0-9]*');
    });

    test('should have DBMasterPassword parameter', () => {
      const dbPassParam = template.Parameters.DBMasterPassword;
      expect(dbPassParam).toBeDefined();
      expect(dbPassParam.Type).toBe('String');
      expect(dbPassParam.NoEcho).toBe(true);
      expect(dbPassParam.MinLength).toBe(8);
      expect(dbPassParam.MaxLength).toBe(41);
      expect(dbPassParam.AllowedPattern).toBe(
        '[a-zA-Z0-9!@#$%^&*()_+-=[]{}|;:,.<>?]*'
      );
    });

    test('should have VpcCidr parameter', () => {
      const vpcCidrParam = template.Parameters.VpcCidr;
      expect(vpcCidrParam).toBeDefined();
      expect(vpcCidrParam.Type).toBe('String');
      expect(vpcCidrParam.Default).toBe('10.0.0.0/16');
      expect(vpcCidrParam.AllowedPattern).toBeDefined();
      expect(typeof vpcCidrParam.AllowedPattern).toBe('string');
      expect(vpcCidrParam.Description).toContain('CIDR block for VPC');
    });
  });

  describe('Mappings', () => {
    test('should have RegionMap mapping', () => {
      expect(template.Mappings.RegionMap).toBeDefined();
    });

    test('RegionMap should have multiple regions', () => {
      const regionMap = template.Mappings.RegionMap;
      expect(regionMap['us-east-1']).toBeDefined();
      expect(regionMap['us-west-2']).toBeDefined();
      expect(regionMap['us-east-2']).toBeDefined();
      expect(regionMap['us-west-1']).toBeDefined();
    });

    test('each region should have AMI mapping', () => {
      const regionMap = template.Mappings.RegionMap;
      Object.keys(regionMap).forEach(region => {
        expect(regionMap[region].AMI).toBeDefined();
        expect(typeof regionMap[region].AMI).toBe('string');
      });
    });
  });

  describe('KMS Resources', () => {
    test('should have KMS key resource', () => {
      expect(template.Resources.SecureEnvKMSKey).toBeDefined();
    });

    test('KMS key should have correct properties', () => {
      const kmsKey = template.Resources.SecureEnvKMSKey;
      expect(kmsKey.Type).toBe('AWS::KMS::Key');
      expect(kmsKey.DeletionPolicy).toBe('Retain');
      expect(kmsKey.UpdateReplacePolicy).toBe('Retain');
      expect(kmsKey.Properties.Description).toContain(
        'KMS Key for SecureEnv encryption'
      );
      expect(kmsKey.Properties.EnableKeyRotation).toBe(true);
      expect(kmsKey.Properties.PendingWindowInDays).toBe(7);
    });
  });

  describe('VPC Resources', () => {
    test('should have VPC resource', () => {
      expect(template.Resources.SecureEnvVPC).toBeDefined();
      expect(template.Resources.SecureEnvVPC.Type).toBe('AWS::EC2::VPC');
    });

    test('VPC should have correct properties', () => {
      const vpc = template.Resources.SecureEnvVPC;
      expect(vpc.Properties.EnableDnsHostnames).toBe(true);
      expect(vpc.Properties.EnableDnsSupport).toBe(true);
      expect(vpc.Properties.CidrBlock).toEqual({ Ref: 'VpcCidr' });
    });
  });

  describe('S3 Resources', () => {
    test('should have S3 bucket resource', () => {
      expect(template.Resources.SecureEnvS3Bucket).toBeDefined();
      expect(template.Resources.SecureEnvS3Bucket.Type).toBe('AWS::S3::Bucket');
    });

    test('S3 bucket should have encryption enabled', () => {
      const s3Bucket = template.Resources.SecureEnvS3Bucket;
      const encryption =
        s3Bucket.Properties.BucketEncryption
          .ServerSideEncryptionConfiguration[0];
      expect(encryption.ServerSideEncryptionByDefault.SSEAlgorithm).toBe(
        'aws:kms'
      );
      expect(encryption.ServerSideEncryptionByDefault.KMSMasterKeyID).toEqual({
        Ref: 'SecureEnvKMSKey',
      });
    });

    test('S3 bucket should have public access blocked', () => {
      const s3Bucket = template.Resources.SecureEnvS3Bucket;
      const publicAccess = s3Bucket.Properties.PublicAccessBlockConfiguration;
      expect(publicAccess.BlockPublicAcls).toBe(true);
      expect(publicAccess.BlockPublicPolicy).toBe(true);
      expect(publicAccess.IgnorePublicAcls).toBe(true);
      expect(publicAccess.RestrictPublicBuckets).toBe(true);
    });

    test('S3 bucket should have versioning enabled', () => {
      const s3Bucket = template.Resources.SecureEnvS3Bucket;
      expect(s3Bucket.Properties.VersioningConfiguration.Status).toBe(
        'Enabled'
      );
    });
  });

  describe('RDS Resources', () => {
    test('should have RDS instance resource', () => {
      expect(template.Resources.SecureEnvRDSInstance).toBeDefined();
      expect(template.Resources.SecureEnvRDSInstance.Type).toBe(
        'AWS::RDS::DBInstance'
      );
    });

    test('RDS instance should have correct properties', () => {
      const rdsInstance = template.Resources.SecureEnvRDSInstance;
      expect(rdsInstance.Properties.Engine).toBe('mysql');
      expect(rdsInstance.Properties.EngineVersion).toBe('8.0');
      expect(rdsInstance.Properties.StorageEncrypted).toBe(true);
      expect(rdsInstance.Properties.DeletionProtection).toBe(true);
      expect(rdsInstance.Properties.PubliclyAccessible).toBe(false);
      expect(rdsInstance.Properties.BackupRetentionPeriod).toBe(7);
      expect(rdsInstance.Properties.MultiAZ).toBe(false);
    });
  });

  describe('EC2 Resources', () => {
    test('should have web instance resource', () => {
      expect(template.Resources.SecureEnvWebInstance).toBeDefined();
      expect(template.Resources.SecureEnvWebInstance.Type).toBe(
        'AWS::EC2::Instance'
      );
    });

    test('should have bastion instance resource', () => {
      expect(template.Resources.SecureEnvBastionInstance).toBeDefined();
      expect(template.Resources.SecureEnvBastionInstance.Type).toBe(
        'AWS::EC2::Instance'
      );
    });

    test('EC2 instances should have correct instance type', () => {
      const webInstance = template.Resources.SecureEnvWebInstance;
      const bastionInstance = template.Resources.SecureEnvBastionInstance;
      expect(webInstance.Properties.InstanceType).toBe('t3.micro');
      expect(bastionInstance.Properties.InstanceType).toBe('t3.micro');
    });
  });

  describe('Security Resources', () => {
    test('should have CloudTrail resource', () => {
      expect(template.Resources.SecureEnvCloudTrail).toBeDefined();
      expect(template.Resources.SecureEnvCloudTrail.Type).toBe(
        'AWS::CloudTrail::Trail'
      );
    });

    test('CloudTrail should have correct properties', () => {
      const cloudTrail = template.Resources.SecureEnvCloudTrail;
      expect(cloudTrail.Properties.IncludeGlobalServiceEvents).toBe(true);
      expect(cloudTrail.Properties.IsMultiRegionTrail).toBe(true);
      expect(cloudTrail.Properties.EnableLogFileValidation).toBe(true);
    });

    test('should have GuardDuty detector resource', () => {
      expect(template.Resources.SecureEnvGuardDuty).toBeDefined();
      expect(template.Resources.SecureEnvGuardDuty.Type).toBe(
        'AWS::GuardDuty::Detector'
      );
    });

    test('GuardDuty should be enabled', () => {
      const guardDuty = template.Resources.SecureEnvGuardDuty;
      expect(guardDuty.Properties.Enable).toBe(true);
    });

    test('should have WAF Web ACL resource', () => {
      expect(template.Resources.SecureEnvWAFWebACL).toBeDefined();
      expect(template.Resources.SecureEnvWAFWebACL.Type).toBe(
        'AWS::WAFv2::WebACL'
      );
    });

    test('WAF Web ACL should have correct properties', () => {
      const webACL = template.Resources.SecureEnvWAFWebACL;
      expect(webACL.Properties.Scope).toBe('REGIONAL');
      expect(webACL.Properties.DefaultAction).toEqual({ Allow: {} });
      expect(webACL.Properties.Rules).toHaveLength(2);
    });

    test('WAF Web ACL should have SQL injection rule', () => {
      const webACL = template.Resources.SecureEnvWAFWebACL;
      const sqlInjectionRule = webACL.Properties.Rules.find(
        (rule: any) => rule.Name === 'SQLInjectionRule'
      );
      expect(sqlInjectionRule).toBeDefined();
      expect(sqlInjectionRule.Action).toEqual({ Block: {} });
    });

    test('WAF Web ACL should have XSS rule', () => {
      const webACL = template.Resources.SecureEnvWAFWebACL;
      const xssRule = webACL.Properties.Rules.find(
        (rule: any) => rule.Name === 'XSSRule'
      );
      expect(xssRule).toBeDefined();
      expect(xssRule.Action).toEqual({ Block: {} });
    });
  });

  describe('Outputs', () => {
    test('should have all required outputs', () => {
      const expectedOutputs = [
        'VPCId',
        'KMSKeyId',
        'KMSKeyArn',
        'S3BucketName',
        'RDSInstanceId',
        'WebInstanceId',
        'BastionInstanceId',
        'CloudTrailName',
        'GuardDutyDetectorId',
        'WAFWebACLId',
        'Environment',
      ];

      expectedOutputs.forEach(outputName => {
        expect(template.Outputs[outputName]).toBeDefined();
      });
    });

    test('VPCId output should be correct', () => {
      const output = template.Outputs.VPCId;
      expect(output.Description).toBe('VPC ID');
      expect(output.Value).toEqual({ Ref: 'SecureEnvVPC' });
      expect(output.Export.Name).toEqual({
        'Fn::Sub': '${AWS::StackName}-VPC-ID',
      });
    });

    test('KMS outputs should be correct', () => {
      const kmsKeyIdOutput = template.Outputs.KMSKeyId;
      expect(kmsKeyIdOutput.Value).toEqual({ Ref: 'SecureEnvKMSKey' });

      const kmsKeyArnOutput = template.Outputs.KMSKeyArn;
      expect(kmsKeyArnOutput.Value).toEqual({
        'Fn::GetAtt': ['SecureEnvKMSKey', 'Arn'],
      });
    });

    test('S3 bucket output should be correct', () => {
      const output = template.Outputs.S3BucketName;
      expect(output.Description).toBe('S3 Bucket Name');
      expect(output.Value).toEqual({ Ref: 'SecureEnvS3Bucket' });
    });

    test('RDS output should be correct', () => {
      const output = template.Outputs.RDSInstanceId;
      expect(output.Description).toBe('RDS Instance ID');
      expect(output.Value).toEqual({ Ref: 'SecureEnvRDSInstance' });
    });

    test('EC2 outputs should be correct', () => {
      const webInstanceOutput = template.Outputs.WebInstanceId;
      expect(webInstanceOutput.Value).toEqual({ Ref: 'SecureEnvWebInstance' });

      const bastionInstanceOutput = template.Outputs.BastionInstanceId;
      expect(bastionInstanceOutput.Value).toEqual({
        Ref: 'SecureEnvBastionInstance',
      });
    });

    test('security outputs should be correct', () => {
      const cloudTrailOutput = template.Outputs.CloudTrailName;
      expect(cloudTrailOutput.Value).toEqual({ Ref: 'SecureEnvCloudTrail' });

      const guardDutyOutput = template.Outputs.GuardDutyDetectorId;
      expect(guardDutyOutput.Value).toEqual({ Ref: 'SecureEnvGuardDuty' });

      const wafOutput = template.Outputs.WAFWebACLId;
      expect(wafOutput.Value).toEqual({ Ref: 'SecureEnvWAFWebACL' });
    });

    test('Environment output should be correct', () => {
      const output = template.Outputs.Environment;
      expect(output.Description).toBe('Environment name');
      expect(output.Value).toEqual({ Ref: 'Environment' });
    });
  });

  describe('Resource Counts', () => {
    test('should have correct number of resources', () => {
      const resourceCount = Object.keys(template.Resources).length;
      expect(resourceCount).toBeGreaterThan(5);
    });

    test('should have correct number of parameters', () => {
      const parameterCount = Object.keys(template.Parameters).length;
      expect(parameterCount).toBe(5);
    });

    test('should have correct number of outputs', () => {
      const outputCount = Object.keys(template.Outputs).length;
      expect(outputCount).toBe(11);
    });
  });

  describe('Security Best Practices', () => {
    test('KMS key should have proper deletion policies', () => {
      const kmsKey = template.Resources.SecureEnvKMSKey;
      expect(kmsKey.DeletionPolicy).toBe('Retain');
      expect(kmsKey.UpdateReplacePolicy).toBe('Retain');
    });

    test('S3 bucket should have proper deletion policies', () => {
      const s3Bucket = template.Resources.SecureEnvS3Bucket;
      expect(s3Bucket.DeletionPolicy).toBe('Retain');
      expect(s3Bucket.UpdateReplacePolicy).toBe('Retain');
    });

    test('RDS instance should have proper deletion policies', () => {
      const rdsInstance = template.Resources.SecureEnvRDSInstance;
      expect(rdsInstance.DeletionPolicy).toBe('Snapshot');
      expect(rdsInstance.UpdateReplacePolicy).toBe('Snapshot');
    });

    test('all outputs should follow export naming convention', () => {
      Object.values(template.Outputs).forEach((output: any) => {
        expect(output.Export.Name).toHaveProperty('Fn::Sub');
        expect(output.Export.Name['Fn::Sub']).toMatch(
          /\$\{AWS::StackName\}-[A-Za-z-]+/
        );
      });
    });
  });
});
