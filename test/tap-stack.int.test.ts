import fs from 'fs';
import path from 'path';

describe('TapStack CloudFormation Template', () => {
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

    test('should have a description', () => {
      expect(template.Description).toBeDefined();
      expect(template.Description).toBe('Secure-by-Design AWS Infrastructure with stringent security controls and compliance enforcement');
    });
  });

  describe('Parameters', () => {
    test('should have required parameters', () => {
      const expectedParameters = [
        'VpcCidr',
        'DBInstanceClass',
        'DBEngineVersion',
        'EnvironmentSuffix'
      ];
      
      expectedParameters.forEach(param => {
        expect(template.Parameters[param]).toBeDefined();
      });
    });

    test('VpcCidr parameter should have correct configuration', () => {
      const param = template.Parameters.VpcCidr;
      expect(param.Type).toBe('String');
      expect(param.Default).toBe('10.0.0.0/16');
      expect(param.Description).toBe('CIDR block for the VPC');
      expect(param.AllowedPattern).toBe('^(([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])\\.){3}([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])(\\/([0-9]|[1-2][0-9]|3[0-2]))$');
    });

    test('DBInstanceClass parameter should have correct configuration', () => {
      const param = template.Parameters.DBInstanceClass;
      expect(param.Type).toBe('String');
      expect(param.Default).toBe('db.t3.micro');
      expect(param.Description).toBe('RDS instance class (e.g., db.t3.micro, db.m6g.large, db.r6g.xlarge)');
      expect(param.AllowedPattern).toBe('^db\\.[a-z0-9]+\\.[a-z0-9]+$');
      expect(param.MinLength).toBe(8);
      expect(param.MaxLength).toBe(20);
    });

    test('DBEngineVersion parameter should have correct configuration', () => {
      const param = template.Parameters.DBEngineVersion;
      expect(param.Type).toBe('String');
      expect(param.Default).toBe('8.0.42');
      expect(param.Description).toBe('MySQL engine version');
    });

    test('EnvironmentSuffix parameter should have correct configuration', () => {
      const param = template.Parameters.EnvironmentSuffix;
      expect(param.Type).toBe('String');
      expect(param.Default).toBe('dev');
      expect(param.Description).toBe('Environment suffix - used for resource naming and tagging');
      expect(param.MinLength).toBe(1);
      expect(param.MaxLength).toBe(64);
      expect(param.AllowedPattern).toBe('^[a-zA-Z0-9-_]+$');
    });
  });

  describe('Resources', () => {
    describe('KMS Resources', () => {
      test('should have KMS key with correct configuration', () => {
        const kmsKey = template.Resources.SecureDataKMSKey;
        expect(kmsKey.Type).toBe('AWS::KMS::Key');
        expect(kmsKey.Properties.Description).toBe('Customer-managed KMS key for encrypting S3 and RDS data at rest');
        
        // Test key policy
        const keyPolicy = kmsKey.Properties.KeyPolicy;
        expect(keyPolicy.Version).toBe('2012-10-17');
        expect(keyPolicy.Statement).toHaveLength(2);
        
        // Test tags
        const tags = kmsKey.Properties.Tags;
        expect(tags).toContainEqual({ Key: 'Project', Value: 'SecureOps' });
        expect(tags).toContainEqual({ Key: 'Environment', Value: { Ref: 'EnvironmentSuffix' } });
      });

      test('should have KMS alias', () => {
        const alias = template.Resources.SecureDataKMSKeyAlias;
        expect(alias.Type).toBe('AWS::KMS::Alias');
        expect(alias.Properties.TargetKeyId.Ref).toBe('SecureDataKMSKey');
      });
    });

    describe('VPC Resources', () => {
      test('should have VPC with correct configuration', () => {
        const vpc = template.Resources.SecureVPC;
        expect(vpc.Type).toBe('AWS::EC2::VPC');
        expect(vpc.Properties.CidrBlock.Ref).toBe('VpcCidr');
        expect(vpc.Properties.EnableDnsHostnames).toBe(true);
        expect(vpc.Properties.EnableDnsSupport).toBe(true);
        
        const tags = vpc.Properties.Tags;
        expect(tags).toContainEqual({ 
          Key: 'Name', 
          Value: { 'Fn::Sub': '${AWS::StackName}-VPC-${EnvironmentSuffix}' } 
        });
      });

      test('should have private subnets in different AZs', () => {
        const subnet1 = template.Resources.PrivateSubnet1;
        const subnet2 = template.Resources.PrivateSubnet2;

        expect(subnet1.Type).toBe('AWS::EC2::Subnet');
        expect(subnet2.Type).toBe('AWS::EC2::Subnet');
        
        expect(subnet1.Properties.VpcId.Ref).toBe('SecureVPC');
        expect(subnet2.Properties.VpcId.Ref).toBe('SecureVPC');
        
        // Check they're in different AZs (accepts either Fn::Select or hardcoded values for LocalStack)
        const az1 = subnet1.Properties.AvailabilityZone;
        const az2 = subnet2.Properties.AvailabilityZone;
        
        // If using Fn::Select
        if (az1['Fn::Select']) {
          expect(az1['Fn::Select'][0]).toBe(0);
          expect(az2['Fn::Select'][0]).toBe(1);
        } else {
          // Hardcoded for LocalStack compatibility
          expect(az1).not.toBe(az2);
        }
      });
    });

    describe('S3 Resources', () => {
      test('should have central logging bucket with correct security settings', () => {
        const bucket = template.Resources.CentralLoggingBucket;
        expect(bucket.Type).toBe('AWS::S3::Bucket');
        
        const props = bucket.Properties;
        expect(props.PublicAccessBlockConfiguration.BlockPublicAcls).toBe(true);
        expect(props.PublicAccessBlockConfiguration.BlockPublicPolicy).toBe(true);
        expect(props.PublicAccessBlockConfiguration.IgnorePublicAcls).toBe(true);
        expect(props.PublicAccessBlockConfiguration.RestrictPublicBuckets).toBe(true);
        
        expect(props.VersioningConfiguration.Status).toBe('Enabled');
        expect(props.BucketEncryption.ServerSideEncryptionConfiguration[0].ServerSideEncryptionByDefault.SSEAlgorithm).toBe('aws:kms');
      });

      test('should have secure data bucket with correct security settings', () => {
        const bucket = template.Resources.SecureDataBucket;
        expect(bucket.Type).toBe('AWS::S3::Bucket');
        
        const props = bucket.Properties;
        expect(props.PublicAccessBlockConfiguration.BlockPublicAcls).toBe(true);
        expect(props.VersioningConfiguration.Status).toBe('Enabled');
        
        // Test bucket policy
        const policy = template.Resources.SecureDataBucketPolicy;
        expect(policy.Type).toBe('AWS::S3::BucketPolicy');
        expect(policy.Properties.Bucket.Ref).toBe('SecureDataBucket');
      });
    });

    describe('RDS Resources', () => {
      test('should have RDS instance with correct security configuration', () => {
        const rds = template.Resources.SecureRDSInstance;
        expect(rds.Type).toBe('AWS::RDS::DBInstance');
        // RDS has condition for LocalStack, so it's conditionally deployed
        expect(rds.Condition).toBe('IsNotLocalStack');
        
        const props = rds.Properties;
        expect(props.StorageEncrypted).toBe(true);
        expect(props.PubliclyAccessible).toBe(false);
        expect(props.DeletionProtection).toBe(false);
        expect(props.MultiAZ).toBe(false);
        
        expect(props.EnableCloudwatchLogsExports).toEqual([
          'audit',
          'error',
          'general',
          'slowquery'
        ]);
        
        expect(props.KmsKeyId['Fn::GetAtt']).toEqual(['SecureDataKMSKey', 'Arn']);
      });

      test('should have RDS security group', () => {
        const sg = template.Resources.RDSSecurityGroup;
        expect(sg.Type).toBe('AWS::EC2::SecurityGroup');
        // RDS SG has condition for LocalStack
        expect(sg.Condition).toBe('IsNotLocalStack');
        expect(sg.Properties.VpcId.Ref).toBe('SecureVPC');
        expect(sg.Properties.GroupDescription).toBe('Security group for secure RDS instance');
      });
    });

    describe('IAM Resources', () => {
      test('should have application server role with correct permissions', () => {
        const role = template.Resources.AppServerRole;
        expect(role.Type).toBe('AWS::IAM::Role');
        expect(role.Properties.AssumeRolePolicyDocument.Statement[0].Principal.Service).toBe('ec2.amazonaws.com');
        
        const policies = role.Properties.Policies;
        expect(policies[0].PolicyName).toBe('AppServerMinimalAccess');
      });

      test('should have low security read-only role', () => {
        const role = template.Resources.LowSecurityReadOnlyRole;
        expect(role.Type).toBe('AWS::IAM::Role');
        expect(role.Properties.Policies[0].PolicyName).toBe('LowSecurityReadOnlyAccess');
      });
    });
  });

  describe('Outputs', () => {
    test('should have all required outputs', () => {
      const expectedOutputs = [
        'VPCId',
        'KMSKeyArn',
        'CentralLoggingBucketName',
        'SecureDataBucketName',
        'RDSEndpoint',
        'AppServerRoleArn',
        'LowSecurityRoleArn',
        'ConfigRuleName'
      ];

      expectedOutputs.forEach(output => {
        expect(template.Outputs[output]).toBeDefined();
      });
    });

    test('should have correct VPC output', () => {
      const output = template.Outputs.VPCId;
      expect(output.Description).toBe('ID of the secure VPC');
      expect(output.Value.Ref).toBe('SecureVPC');
    });

    test('should have correct KMS key output', () => {
      const output = template.Outputs.KMSKeyArn;
      expect(output.Description).toBe('ARN of the customer-managed KMS key');
      expect(output.Value['Fn::GetAtt']).toEqual(['SecureDataKMSKey', 'Arn']);
    });

    test('should have correct RDS endpoint output', () => {
      const output = template.Outputs.RDSEndpoint;
      expect(output.Description).toBe('RDS instance endpoint address');
      expect(output.Value['Fn::GetAtt']).toEqual(['SecureRDSInstance', 'Endpoint.Address']);
    });
  });
});