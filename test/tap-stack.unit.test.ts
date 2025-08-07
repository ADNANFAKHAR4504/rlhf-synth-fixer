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
        'CompanyName',
        'Environment',
        'ExistingVpcId',
        'PrivateSubnetIds',
        'DBSubnetGroupName',
        'DBMasterUsername',
        'EC2InstanceType',
        'EnvironmentSuffix',
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

    test('VPC parameters should use proper AWS types', () => {
      expect(template.Parameters.ExistingVpcId.Type).toBe('AWS::EC2::VPC::Id');
      expect(template.Parameters.PrivateSubnetIds.Type).toBe(
        'List<AWS::EC2::Subnet::Id>'
      );
    });

    test('EnvironmentSuffix should be the last parameter', () => {
      const paramKeys = Object.keys(template.Parameters);
      expect(paramKeys[paramKeys.length - 1]).toBe('EnvironmentSuffix');
    });
  });

  describe('Conditions', () => {
    test('should define conditions for conditional resource deployment', () => {
      expect(template.Conditions).toBeDefined();
      expect(template.Conditions.HasExistingVpcId).toBeDefined();
      expect(template.Conditions.HasPrivateSubnetIds).toBeDefined();
      expect(template.Conditions.HasDBSubnetGroupName).toBeDefined();
      expect(template.Conditions.DeployEC2AndRDS).toBeDefined();

      // DeployEC2AndRDS should be an AND condition of the other three
      expect(template.Conditions.DeployEC2AndRDS['Fn::And']).toBeDefined();
      expect(template.Conditions.DeployEC2AndRDS['Fn::And'].length).toBe(3);
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

      // Add additional test for granular CloudWatch logs permissions
      const cwLogsPolicy = policies.find(
        (p: any) => p.PolicyName === 'CloudWatchLogsPolicy'
      );
      expect(cwLogsPolicy).toBeDefined();

      const cwStatement = cwLogsPolicy.PolicyDocument.Statement[0];
      expect(cwStatement.Resource).toBeInstanceOf(Array);
      expect(cwStatement.Resource.length).toBeGreaterThanOrEqual(2);

      // Fixed tests to handle CloudFormation Fn::Sub intrinsic function
      if (cwStatement.Resource[0]['Fn::Sub']) {
        expect(cwStatement.Resource[0]['Fn::Sub']).toContain('/aws/ec2/');
      } else {
        expect(cwStatement.Resource[0]).toContain('/aws/ec2/');
      }

      if (cwStatement.Resource[1]['Fn::Sub']) {
        expect(cwStatement.Resource[1]['Fn::Sub']).toContain(':log-stream:');
      } else {
        expect(cwStatement.Resource[1]).toContain(':log-stream:');
      }
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

  describe('EC2 and RDS Resources', () => {
    test('should have conditional EC2 and RDS resources', () => {
      const conditionalResources = [
        'RDSEnhancedMonitoringRole',
        'DBParameterGroup',
        'EC2SecurityGroup',
        'RDSSecurityGroup',
        'EC2LaunchTemplate',
        'EC2Instance',
        'RDSSecret',
        'RDSInstance',
      ];

      conditionalResources.forEach(resourceName => {
        expect(template.Resources[resourceName]).toBeDefined();
        expect(template.Resources[resourceName].Condition).toBe(
          'DeployEC2AndRDS'
        );
      });
    });

    test('security groups should properly reference each other', () => {
      const rdsIngress = template.Resources.RDSSecurityGroupIngress;
      expect(rdsIngress).toBeDefined();
      expect(rdsIngress.Properties.GroupId.Ref).toBe('RDSSecurityGroup');
      expect(rdsIngress.Properties.SourceSecurityGroupId.Ref).toBe(
        'EC2SecurityGroup'
      );
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

    test('EC2 security group should restrict MySQL traffic to RDS security group', () => {
      const ec2SG = template.Resources.EC2SecurityGroup;
      expect(ec2SG).toBeDefined();

      const mysqlEgress = ec2SG.Properties.SecurityGroupEgress.find(
        (rule: any) => rule.FromPort === 3306 && rule.ToPort === 3306
      );

      expect(mysqlEgress).toBeDefined();
      expect(mysqlEgress.DestinationSecurityGroupId).toEqual({
        Ref: 'RDSSecurityGroup',
      });
      expect(mysqlEgress.CidrIp).toBeUndefined();
    });
  });

  describe('Secrets Manager Configuration', () => {
    test('should have RDS secret configured correctly', () => {
      const secret = template.Resources.RDSSecret;
      expect(secret).toBeDefined();
      expect(secret.Type).toBe('AWS::SecretsManager::Secret');
      expect(secret.Properties.GenerateSecretString).toBeDefined();
      expect(
        secret.Properties.GenerateSecretString.SecretStringTemplate['Fn::Sub']
      ).toContain('${DBMasterUsername}');
      expect(secret.Properties.GenerateSecretString.GenerateStringKey).toBe(
        'password'
      );
    });

    test('RDS instance should reference secrets manager for credentials', () => {
      const rdsInstance = template.Resources.RDSInstance;
      expect(rdsInstance.Properties.MasterUsername['Fn::Sub']).toContain(
        'resolve:secretsmanager'
      );
      expect(rdsInstance.Properties.MasterUserPassword['Fn::Sub']).toContain(
        'resolve:secretsmanager'
      );
    });
  });

  describe('Outputs Configuration', () => {
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
        if (
          template.Resources[resourceName] &&
          template.Resources[resourceName].Properties &&
          template.Resources[resourceName].Properties.Tags
        ) {
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

  describe('VPC Endpoint Configuration', () => {
    test('should create VPC endpoint for S3 to avoid internet routing', () => {
      const s3Endpoint = template.Resources.S3VPCEndpoint;
      expect(s3Endpoint).toBeDefined();
      expect(s3Endpoint.Type).toBe('AWS::EC2::VPCEndpoint');
      expect(s3Endpoint.Properties.ServiceName['Fn::Sub']).toContain('s3');

      // Verify policy allows access only to our S3 bucket
      const policy = s3Endpoint.Properties.PolicyDocument;

      // Update the test to match actual ARN format in the JSON
      expect(policy.Statement[0].Resource[0]['Fn::Sub']).toContain(
        'arn:aws:s3:::${SecureS3Bucket}'
      );
      expect(policy.Statement[0].Resource[1]['Fn::Sub']).toContain(
        'arn:aws:s3:::${SecureS3Bucket}/*'
      );

      // Verify S3 endpoint is connected to the VPC
      expect(s3Endpoint.Properties.VpcId).toEqual({ Ref: 'ExistingVpcId' });
    });
  });
});
