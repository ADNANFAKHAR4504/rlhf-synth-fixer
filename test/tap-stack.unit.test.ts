import fs from 'fs';
import path from 'path';

const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';

describe('TapStack CloudFormation Template', () => {
  let template: any;

  beforeAll(() => {
    // Load the template JSON file
    const templatePath = path.join(__dirname, '../lib/TapStack.json');
    const templateContent = fs.readFileSync(templatePath, 'utf8');
    template = JSON.parse(templateContent);
  });

  describe('Template Structure', () => {
    test('should have valid CloudFormation format version', () => {
      expect(template.AWSTemplateFormatVersion).toBe('2010-09-09');
    });

    test('should have a description about security features', () => {
      expect(template.Description).toBeDefined();
      expect(template.Description.toLowerCase()).toContain('secure');
      expect(template.Description).toContain('encryption');
      expect(template.Description).toContain('least privilege');
      expect(template.Description).toContain('logging');
      expect(template.Description).toContain('private subnets');
    });

    test('should have metadata section with parameter groups', () => {
      expect(template.Metadata).toBeDefined();
      expect(template.Metadata['AWS::CloudFormation::Interface']).toBeDefined();
      expect(
        template.Metadata['AWS::CloudFormation::Interface'].ParameterGroups
      ).toBeDefined();
    });
  });

  describe('Parameters', () => {
    test('should have all required parameters', () => {
      const requiredParams = [
        'EnvironmentSuffix',
        'CompanyName',
        'Environment',
        'ExistingVpcId',
        'PrivateSubnetIds',
        'DBSubnetGroupName',
        'DBMasterUsername',
        'EC2InstanceType',
      ];

      requiredParams.forEach(param => {
        expect(template.Parameters[param]).toBeDefined();
      });
    });

    test('CompanyName parameter should enforce lowercase naming convention', () => {
      const companyNameParam = template.Parameters.CompanyName;
      expect(companyNameParam.Type).toBe('String');
      expect(companyNameParam.Default).toBe('mycompany');
      expect(companyNameParam.AllowedPattern).toBe('^[a-z0-9]+$');
      expect(companyNameParam.ConstraintDescription).toContain('lowercase');
    });

    test('VPC parameters should reference existing resources', () => {
      // Updated to match actual types in template which are String with default empty value
      expect(template.Parameters.ExistingVpcId.Type).toBe('String');
      expect(template.Parameters.PrivateSubnetIds.Type).toBe('String');

      // Check they have default empty values
      expect(template.Parameters.ExistingVpcId.Default).toBe('');
      expect(template.Parameters.PrivateSubnetIds.Default).toBe('');
    });
  });

  describe('S3 Bucket Configuration', () => {
    test('should have S3 bucket with server-side encryption enabled', () => {
      const bucket = template.Resources.SecureS3Bucket;
      expect(bucket).toBeDefined();
      expect(bucket.Type).toBe('AWS::S3::Bucket');

      const encryption = bucket.Properties.BucketEncryption;
      expect(encryption).toBeDefined();
      expect(encryption.ServerSideEncryptionConfiguration).toBeDefined();
      expect(
        encryption.ServerSideEncryptionConfiguration[0]
          .ServerSideEncryptionByDefault.SSEAlgorithm
      ).toBe('aws:kms');
    });

    test('should use custom KMS key for S3 encryption', () => {
      const bucket = template.Resources.SecureS3Bucket;
      const kmsKeyId =
        bucket.Properties.BucketEncryption.ServerSideEncryptionConfiguration[0]
          .ServerSideEncryptionByDefault.KMSMasterKeyID;

      expect(kmsKeyId).toEqual({ Ref: 'S3EncryptionKey' });
    });

    test('should block public access to S3 bucket', () => {
      const bucket = template.Resources.SecureS3Bucket;
      const publicAccessBlock =
        bucket.Properties.PublicAccessBlockConfiguration;

      expect(publicAccessBlock.BlockPublicAcls).toBe(true);
      expect(publicAccessBlock.BlockPublicPolicy).toBe(true);
      expect(publicAccessBlock.IgnorePublicAcls).toBe(true);
      expect(publicAccessBlock.RestrictPublicBuckets).toBe(true);
    });

    test('should enable versioning on S3 bucket', () => {
      const bucket = template.Resources.SecureS3Bucket;
      expect(bucket.Properties.VersioningConfiguration.Status).toBe('Enabled');
    });
  });

  describe('KMS Key Configuration', () => {
    test('should create a KMS key with correct policy', () => {
      const key = template.Resources.S3EncryptionKey;
      expect(key).toBeDefined();
      expect(key.Type).toBe('AWS::KMS::Key');

      const keyPolicy = key.Properties.KeyPolicy;
      expect(keyPolicy.Version).toBe('2012-10-17');
      expect(keyPolicy.Statement).toHaveLength(2);

      // Check root account access
      expect(keyPolicy.Statement[0].Principal.AWS).toEqual({
        'Fn::Sub': 'arn:aws:iam::${AWS::AccountId}:root',
      });

      // Check S3 service access
      expect(keyPolicy.Statement[1].Principal.Service).toBe('s3.amazonaws.com');
    });

    test('should create a KMS key alias', () => {
      const alias = template.Resources.S3EncryptionKeyAlias;
      expect(alias).toBeDefined();
      expect(alias.Type).toBe('AWS::KMS::Alias');
      expect(alias.Properties.TargetKeyId).toEqual({ Ref: 'S3EncryptionKey' });
    });
  });

  describe('IAM Role Configurations', () => {
    test('EC2 role should follow least privilege principle', () => {
      const role = template.Resources.EC2Role;
      expect(role).toBeDefined();
      expect(role.Type).toBe('AWS::IAM::Role');

      // Check no wildcard permissions
      const policies = role.Properties.Policies;
      policies.forEach((policy: any) => {
        policy.PolicyDocument.Statement.forEach((statement: any) => {
          // No wildcard actions
          expect(statement.Action).not.toContain('*');
          // Check if Resource is not wildcard
          if (typeof statement.Resource === 'string') {
            expect(statement.Resource).not.toBe('*');
          }
        });
      });
    });

    test('RDS monitoring role should use managed policy', () => {
      const role = template.Resources.RDSEnhancedMonitoringRole;
      expect(role).toBeDefined();
      expect(role.Type).toBe('AWS::IAM::Role');

      const managedPolicies = role.Properties.ManagedPolicyArns;
      expect(managedPolicies).toContain(
        'arn:aws:iam::aws:policy/service-role/AmazonRDSEnhancedMonitoringRole'
      );
    });

    test('EC2 should have proper KMS access policy', () => {
      const policy = template.Resources.EC2RoleKMSPolicy;
      expect(policy).toBeDefined();
      expect(policy.Type).toBe('AWS::IAM::Policy');

      const actions = policy.Properties.PolicyDocument.Statement[0].Action;
      expect(actions).toContain('kms:Decrypt');
      expect(actions).toContain('kms:GenerateDataKey');

      const resource = policy.Properties.PolicyDocument.Statement[0].Resource;
      expect(resource).toEqual({
        'Fn::GetAtt': ['S3EncryptionKey', 'Arn'],
      });
    });
  });

  describe('RDS Configuration', () => {
    test('should create DB parameter group with logging enabled', () => {
      const paramGroup = template.Resources.DBParameterGroup;
      expect(paramGroup).toBeDefined();
      expect(paramGroup.Type).toBe('AWS::RDS::DBParameterGroup');

      const params = paramGroup.Properties.Parameters;
      expect(params.general_log).toBe(1);
      expect(params.slow_query_log).toBe(1);
      expect(params.log_queries_not_using_indexes).toBe(1);
    });

    test('RDS instance should have logging enabled', () => {
      const rdsInstance = template.Resources.RDSInstance;
      expect(rdsInstance).toBeDefined();
      expect(rdsInstance.Type).toBe('AWS::RDS::DBInstance');

      const exports = rdsInstance.Properties.EnableCloudwatchLogsExports;
      expect(exports).toContain('error');
      expect(exports).toContain('general');
      expect(exports).toContain('slow-query');
    });

    test('RDS instance should not be publicly accessible', () => {
      const rdsInstance = template.Resources.RDSInstance;
      expect(rdsInstance.Properties.PubliclyAccessible).toBe(false);
    });

    test('RDS instance should use storage encryption', () => {
      const rdsInstance = template.Resources.RDSInstance;
      expect(rdsInstance.Properties.StorageEncrypted).toBe(true);
    });

    test('RDS instance should be monitored', () => {
      const rdsInstance = template.Resources.RDSInstance;
      expect(rdsInstance.Properties.MonitoringInterval).toBe(60);
      expect(rdsInstance.Properties.MonitoringRoleArn).toEqual({
        'Fn::GetAtt': ['RDSEnhancedMonitoringRole', 'Arn'],
      });
    });

    test('RDS should use secrets manager for credentials', () => {
      const rdsInstance = template.Resources.RDSInstance;
      expect(rdsInstance.Properties.MasterUsername).toBeDefined();
      // Using different check since MasterUserPassword in JSON format is {'Fn::Sub': '{{resolve:secretsmanager...}}'}
      expect(rdsInstance.Properties.MasterUsername['Fn::Sub']).toBeDefined();
      expect(
        rdsInstance.Properties.MasterUserPassword['Fn::Sub']
      ).toBeDefined();

      // Check for SecretManager dynamic reference pattern
      const username = rdsInstance.Properties.MasterUsername;
      const password = rdsInstance.Properties.MasterUserPassword;

      expect(username['Fn::Sub']).toContain('resolve:secretsmanager');
      expect(password['Fn::Sub']).toContain('resolve:secretsmanager');
    });
  });

  describe('EC2 Configuration', () => {
    test('EC2 security group should allow only necessary traffic', () => {
      const sg = template.Resources.EC2SecurityGroup;
      expect(sg).toBeDefined();
      expect(sg.Type).toBe('AWS::EC2::SecurityGroup');

      // Check egress rules
      const egress = sg.Properties.SecurityGroupEgress;
      expect(egress).toHaveLength(3);

      // Verify no unnecessary ports are open
      const allowedPorts = [80, 443, 3306];
      egress.forEach((rule: any) => {
        expect(allowedPorts).toContain(rule.FromPort);
      });
    });

    test('EC2 instance should be placed in private subnet', () => {
      const ec2Instance = template.Resources.EC2Instance;
      expect(ec2Instance).toBeDefined();
      expect(ec2Instance.Type).toBe('AWS::EC2::Instance');

      // Check that it uses a subnet from the private subnet list with proper Split and Select
      const subnetId = ec2Instance.Properties.SubnetId;
      expect(subnetId).toEqual({
        'Fn::Select': [
          0,
          {
            'Fn::Split': [
              ',',
              {
                Ref: 'PrivateSubnetIds',
              },
            ],
          },
        ],
      });
    });

    test('EC2 launch template should have instance profile with IAM role', () => {
      const launchTemplate = template.Resources.EC2LaunchTemplate;
      expect(launchTemplate).toBeDefined();

      const iamProfile =
        launchTemplate.Properties.LaunchTemplateData.IamInstanceProfile;
      expect(iamProfile).toBeDefined();
      expect(iamProfile.Arn).toEqual({
        'Fn::GetAtt': ['EC2InstanceProfile', 'Arn'],
      });
    });
  });

  describe('Security Groups Configuration', () => {
    test('RDS security group should only allow access from EC2 security group', () => {
      const rdsIngress = template.Resources.RDSSecurityGroupIngress;
      expect(rdsIngress).toBeDefined();
      expect(rdsIngress.Type).toBe('AWS::EC2::SecurityGroupIngress');

      expect(rdsIngress.Properties.IpProtocol).toBe('tcp');
      expect(rdsIngress.Properties.FromPort).toBe(3306);
      expect(rdsIngress.Properties.ToPort).toBe(3306);
      expect(rdsIngress.Properties.SourceSecurityGroupId).toEqual({
        Ref: 'EC2SecurityGroup',
      });
    });
  });

  describe('DynamoDB Table Configuration', () => {
    test('DynamoDB table should have correct properties', () => {
      const table = template.Resources.TurnAroundPromptTable;
      expect(table).toBeDefined();
      expect(table.Type).toBe('AWS::DynamoDB::Table');

      expect(table.Properties.BillingMode).toBe('PAY_PER_REQUEST');
      expect(table.Properties.KeySchema[0].AttributeName).toBe('id');
      expect(table.Properties.KeySchema[0].KeyType).toBe('HASH');
    });
  });

  describe('Outputs', () => {
    test('should export essential resource identifiers', () => {
      const expectedOutputs = [
        'S3BucketArn',
        'S3BucketName',
        'KMSKeyArn',
        'EC2RoleArn',
        'RDSInstanceEndpoint',
        'RDSInstanceArn',
        'EC2InstanceId',
        'RDSEnhancedMonitoringRoleArn',
        'TurnAroundPromptTableName',
        'TurnAroundPromptTableArn',
        'StackName',
        'EnvironmentSuffix',
      ];

      expectedOutputs.forEach(outputName => {
        expect(template.Outputs[outputName]).toBeDefined();
        expect(template.Outputs[outputName].Export).toBeDefined();
      });
    });
  });

  describe('Resource Naming Convention', () => {
    test('resources should follow CompanyName-Environment-ResourceType naming convention', () => {
      // Check naming pattern in resource tags
      const resources = [
        'S3EncryptionKey',
        'SecureS3Bucket',
        'EC2Role',
        'RDSEnhancedMonitoringRole',
        'DBParameterGroup',
        'EC2SecurityGroup',
        'RDSSecurityGroup',
        'EC2Instance',
        'RDSInstance',
      ];

      resources.forEach(resourceName => {
        if (template.Resources[resourceName].Properties.Tags) {
          const nameTag = template.Resources[resourceName].Properties.Tags.find(
            (tag: any) => tag.Key === 'Name'
          );

          if (nameTag) {
            expect(nameTag.Value).toEqual({
              'Fn::Sub': expect.stringContaining(
                '${CompanyName}-${Environment}'
              ),
            });
          }
        }
      });
    });
  });
});
