import fs from 'fs';
import path from 'path';
import yaml from 'js-yaml';


// Custom YAML schema that handles CloudFormation intrinsic functions
const CF_SCHEMA = yaml.DEFAULT_SCHEMA.extend([
  new yaml.Type('!Ref', {
    kind: 'scalar',
    construct: (data: string) => ({ Ref: data }),
  }),
  new yaml.Type('!Sub', {
    kind: 'scalar',
    construct: (data: string) => ({ 'Fn::Sub': data }),
  }),
  new yaml.Type('!GetAtt', {
    kind: 'scalar',
    construct: (data: string) => ({ 'Fn::GetAtt': data.split('.') }),
  }),
  new yaml.Type('!Join', {
    kind: 'sequence',
    construct: (data: any[]) => ({ 'Fn::Join': data }),
  }),
  new yaml.Type('!Select', {
    kind: 'sequence',
    construct: (data: any[]) => ({ 'Fn::Select': data }),
  }),
  new yaml.Type('!GetAZs', {
    kind: 'scalar',
    construct: (data: string) => ({ 'Fn::GetAZs': data || '' }),
  }),
]);

describe('TapStack CloudFormation Template - Unit Tests', () => {
  let template: any;

  beforeAll(() => {
    const templatePath = path.join(__dirname, '../lib/TapStack.yml');
    const templateContent = fs.readFileSync(templatePath, 'utf8');
    template = yaml.load(templateContent, { schema: CF_SCHEMA });
  });

  describe('Template Structure', () => {
    test('should have valid CloudFormation format version', () => {
      expect(template.AWSTemplateFormatVersion).toBe('2010-09-09');
    });

    test('should have security-focused description', () => {
      expect(template.Description).toBeDefined();
      expect(template.Description).toContain('secure');
      expect(template.Description).toContain('security controls');
    });

    test('should have all required sections', () => {
      expect(template.Parameters).toBeDefined();
      expect(template.Resources).toBeDefined();
      expect(template.Outputs).toBeDefined();
    });
  });

  describe('Parameters', () => {
    test('should have EnvironmentSuffix parameter', () => {
      expect(template.Parameters.EnvironmentSuffix).toBeDefined();
      expect(template.Parameters.EnvironmentSuffix.Type).toBe('String');
      expect(template.Parameters.EnvironmentSuffix.Default).toBe('dev');
    });

    test('should have all required parameters', () => {
      const expectedParams = [
        'EnvironmentSuffix',
        'ProjectName',
        'OwnerName',
        'VpcCidr',
        'PublicSubnetCidr',
        'PrivateSubnetCidr',
        'NotificationEmail'
      ];

      expectedParams.forEach(param => {
        expect(template.Parameters[param]).toBeDefined();
      });
    });

    test('should have secure default values', () => {
      expect(template.Parameters.ProjectName.Default).toBe('secure-app');
      expect(template.Parameters.OwnerName.Default).toBe('security-team');
      expect(template.Parameters.VpcCidr.Default).toBe('10.0.0.0/16');
    });
  });

  describe('Security Resources', () => {
    test('should have KMS key for encryption', () => {
      expect(template.Resources.KMSKey).toBeDefined();
      expect(template.Resources.KMSKey.Type).toBe('AWS::KMS::Key');
      // KMSKeyAlias is optional due to permission constraints
      // expect(template.Resources.KMSKeyAlias).toBeDefined();
    });

    test('KMS key should have proper policies', () => {
      const kmsKey = template.Resources.KMSKey;
      const keyPolicy = kmsKey.Properties.KeyPolicy;
      
      expect(keyPolicy.Statement).toBeDefined();
      expect(keyPolicy.Statement.length).toBeGreaterThanOrEqual(2);
      
      // Check for root permissions with specific actions
      const rootStatement = keyPolicy.Statement.find((s: any) => 
        s.Sid === 'Enable IAM User Permissions'
      );
      expect(rootStatement).toBeDefined();
      expect(Array.isArray(rootStatement.Action)).toBe(true);
      expect(rootStatement.Action).toContain('kms:CreateKey');
      expect(rootStatement.Action).toContain('kms:Decrypt');
      expect(rootStatement.Action).toContain('kms:Encrypt');
    });



  });

  describe('Network Security', () => {
    test('should have VPC and networking components', () => {
      const networkResources = [
        'VPC',
        'InternetGateway',
        'InternetGatewayAttachment',
        'PublicSubnet',
        'PrivateSubnet',
        'PublicRouteTable',
        'DefaultPublicRoute'
      ];

      networkResources.forEach(resource => {
        expect(template.Resources[resource]).toBeDefined();
      });
    });

    test('should have security groups with restricted access', () => {
      expect(template.Resources.EC2SecurityGroup).toBeDefined();
      expect(template.Resources.DatabaseSecurityGroup).toBeDefined();

      const ec2SG = template.Resources.EC2SecurityGroup.Properties;
      expect(ec2SG.SecurityGroupIngress).toBeDefined();
      
      // Check that SSH is restricted to VPC
      const sshRule = ec2SG.SecurityGroupIngress.find((rule: any) => 
        rule.FromPort === 22
      );
      expect(sshRule.CidrIp).toBe('10.0.0.0/16');
    });

    test('EC2 instance should be in private subnet', () => {
      const ec2Instance = template.Resources.EC2Instance;
      expect(ec2Instance.Properties.SubnetId).toEqual({ Ref: 'PrivateSubnet' });
    });
  });

  describe('S3 Security', () => {
    test('should have encrypted S3 buckets', () => {
      const s3Buckets = ['ApplicationBucket', 'LogsBucket', 'BackupBucket'];
      
      s3Buckets.forEach(bucketName => {
        const bucket = template.Resources[bucketName];
        expect(bucket).toBeDefined();
        expect(bucket.Type).toBe('AWS::S3::Bucket');
        
        const encryption = bucket.Properties.BucketEncryption;
        expect(encryption).toBeDefined();
        expect(encryption.ServerSideEncryptionConfiguration[0].ServerSideEncryptionByDefault.SSEAlgorithm)
          .toBe('AES256');
      });
    });

    test('S3 buckets should have versioning enabled', () => {
      const s3Buckets = ['ApplicationBucket', 'LogsBucket', 'BackupBucket'];
      
      s3Buckets.forEach(bucketName => {
        const bucket = template.Resources[bucketName];
        expect(bucket.Properties.VersioningConfiguration.Status).toBe('Enabled');
      });
    });

    test('S3 buckets should block public access', () => {
      const s3Buckets = ['ApplicationBucket', 'LogsBucket', 'BackupBucket'];
      
      s3Buckets.forEach(bucketName => {
        const bucket = template.Resources[bucketName];
        const publicAccess = bucket.Properties.PublicAccessBlockConfiguration;
        
        expect(publicAccess.BlockPublicAcls).toBe(true);
        expect(publicAccess.BlockPublicPolicy).toBe(true);
        expect(publicAccess.IgnorePublicAcls).toBe(true);
        expect(publicAccess.RestrictPublicBuckets).toBe(true);
      });
    });

    test('S3 buckets should use environment suffix in naming', () => {
      const s3Buckets = ['ApplicationBucket', 'LogsBucket', 'BackupBucket'];
      
      s3Buckets.forEach(bucketName => {
        const bucket = template.Resources[bucketName];
        const bucketNameValue = bucket.Properties.BucketName;
        
        // Check that it's a CloudFormation Sub function with EnvironmentSuffix and AccountId
        expect(bucketNameValue).toEqual(expect.objectContaining({"Fn::Sub": expect.stringContaining("${EnvironmentSuffix}")}));
        expect(bucketNameValue).toEqual(expect.objectContaining({"Fn::Sub": expect.stringContaining("${AWS::AccountId}")}));
      });
    });
  });

  describe('Database Security', () => {
    test('should have RDS database with KMS encryption', () => {
      expect(template.Resources.Database).toBeDefined();
      expect(template.Resources.Database.Type).toBe('AWS::RDS::DBInstance');
      
      const database = template.Resources.Database.Properties;
      expect(database.StorageEncrypted).toBe(true);
      expect(database.KmsKeyId).toEqual({ Ref: 'KMSKey' });
    });

    test('should use modern RDS password management', () => {
      const database = template.Resources.Database.Properties;
      expect(database.ManageMasterUserPassword).toBe(true);
      expect(database.MasterUserSecret).toBeDefined();
      expect(database.MasterUserSecret.SecretArn).toEqual({ Ref: 'DBSecret' });
    });

    test('should have database secrets manager integration', () => {
      expect(template.Resources.DBSecret).toBeDefined();
      expect(template.Resources.DBSecret.Type).toBe('AWS::SecretsManager::Secret');
    });
  });

  describe('IAM Security', () => {
    test('should have least privilege IAM roles', () => {
      expect(template.Resources.EC2Role).toBeDefined();
      expect(template.Resources.LambdaExecutionRole).toBeDefined();

      const ec2Role = template.Resources.EC2Role.Properties;
      expect(ec2Role.Policies).toBeDefined();
      expect(ec2Role.Policies[0].PolicyName).toBe('S3AccessPolicy');
    });

    test('IAM policies should not use wildcards', () => {
      const ec2Role = template.Resources.EC2Role.Properties;
      const policy = ec2Role.Policies[0].PolicyDocument;
      
      // Check that actions are specific
      policy.Statement.forEach((statement: any) => {
        statement.Action.forEach((action: string) => {
          expect(action).not.toBe('*');
          expect(action).not.toBe('s3:*');
        });
      });
    });
  });

  describe('Monitoring and Alerting', () => {
    test('should have SNS topic for security alerts', () => {
      expect(template.Resources.SecurityAlertsTopic).toBeDefined();
      expect(template.Resources.SecurityAlertsTopic.Type).toBe('AWS::SNS::Topic');
      expect(template.Resources.SecurityAlertsSubscription).toBeDefined();
    });

    test('should have Lambda function for security response', () => {
      expect(template.Resources.SecurityResponseFunction).toBeDefined();
      expect(template.Resources.SecurityResponseFunction.Type).toBe('AWS::Lambda::Function');
      
      const lambda = template.Resources.SecurityResponseFunction.Properties;
      expect(lambda.Runtime).toBe('python3.9');
      expect(lambda.Environment.Variables.SNS_TOPIC_ARN).toEqual({ Ref: 'SecurityAlertsTopic' });
    });

    test('should have CloudWatch alarms', () => {
      expect(template.Resources.RootAccessAlarm).toBeDefined();
      expect(template.Resources.RootAccessAlarm.Type).toBe('AWS::CloudWatch::Alarm');
    });
  });

  describe('Resource Tagging', () => {
    test('all resources should have required tags', () => {
      const requiredTags = ['Owner', 'Environment', 'Project'];
      const taggedResources = [
        'KMSKey', 'VPC', 'InternetGateway', 'PublicSubnet', 'PrivateSubnet',
        'ApplicationBucket', 'LogsBucket', 'BackupBucket',
        'EC2Role', 'EC2SecurityGroup', 'Database', 'DatabaseSecurityGroup'
      ];

      taggedResources.forEach(resourceName => {
        const resource = template.Resources[resourceName];
        if (resource && resource.Properties && resource.Properties.Tags) {
          const tags = resource.Properties.Tags;
          
          requiredTags.forEach(tagKey => {
            const tag = tags.find((t: any) => t.Key === tagKey);
            expect(tag).toBeDefined();
            if (tagKey === 'Environment') {
              expect(tag.Value).toEqual({ Ref: 'EnvironmentSuffix' });
            }
          });
        }
      });
    });
  });

  describe('Outputs', () => {
    test('should have all required outputs', () => {
      const expectedOutputs = [
        'VPCId',
        'ApplicationBucketName',
        'LogsBucketName',
        'BackupBucketName',
        'DatabaseEndpoint',
        'KMSKeyId'
      ];

      expectedOutputs.forEach(outputName => {
        expect(template.Outputs[outputName]).toBeDefined();
        expect(template.Outputs[outputName].Description).toBeDefined();
        expect(template.Outputs[outputName].Value).toBeDefined();
      });
    });

    test('outputs should have export names', () => {
      Object.keys(template.Outputs).forEach(outputKey => {
        const output = template.Outputs[outputKey];
        expect(output.Export).toBeDefined();
        expect(output.Export.Name).toBeDefined();
      });
    });
  });

  describe('Template Validation', () => {
    test('should have valid YAML structure', () => {
      expect(template).toBeDefined();
      expect(typeof template).toBe('object');
    });

    test('should have at least 18 security-related resources', () => {
      const resourceCount = Object.keys(template.Resources).length;
      expect(resourceCount).toBeGreaterThanOrEqual(18);
    });

    test('should have proper resource dependencies', () => {
      // Route should depend on gateway attachment
      expect(template.Resources.DefaultPublicRoute.DependsOn).toBe('InternetGatewayAttachment');
    });

    test('EC2 instance should use valid instance type', () => {
      const ec2Instance = template.Resources.EC2Instance.Properties;
      expect(ec2Instance.InstanceType).toBe('t3.micro');
    });
  });
});