import fs from 'fs';
import path from 'path';

const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';

describe('TapStack CloudFormation Template', () => {
  let template: any;

  beforeAll(() => {
    // If you're testing a yaml template, run `pipenv run cfn-flip lib/TapStack.yml > lib/TapStack.json`
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
        'TAP Stack - Task Assignment Platform CloudFormation Template'
      );
    });

    test('should have metadata section', () => {
      expect(template.Metadata).toBeDefined();
      expect(template.Metadata['AWS::CloudFormation::Interface']).toBeDefined();
    });

    test('should have all required sections', () => {
      expect(template.AWSTemplateFormatVersion).not.toBeNull();
      expect(template.Description).not.toBeNull();
      expect(template.Parameters).not.toBeNull();
      expect(template.Resources).not.toBeNull();
      expect(template.Outputs).not.toBeNull();
    });
  });

  describe('Parameters', () => {
    test('should have all required parameters', () => {
      const expectedParams = ['EnvironmentSuffix', 'DBUsername'];
      expectedParams.forEach(param => {
        expect(template.Parameters[param]).toBeDefined();
      });
    });

    test('should have exactly two parameters', () => {
      const parameterCount = Object.keys(template.Parameters).length;
      expect(parameterCount).toBe(2);
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



    test('DBUsername parameter should have correct properties', () => {
      const dbUserParam = template.Parameters.DBUsername;
      expect(dbUserParam.Type).toBe('String');
      expect(dbUserParam.Default).toBe('admin');
      expect(dbUserParam.Description).toBe('Database administrator username');
      expect(dbUserParam.MinLength).toBe(1);
      expect(dbUserParam.MaxLength).toBe(16);
      expect(dbUserParam.AllowedPattern).toBe('[a-zA-Z][a-zA-Z0-9]*');
    });


  });

  describe('Resources', () => {
    test('should have exactly eighteen resources', () => {
      const resourceCount = Object.keys(template.Resources).length;
      expect(resourceCount).toBe(18);
    });

    test('should have all required resources', () => {
      const expectedResources = [
        'DatabaseSecret',
        'TurnAroundPromptTable',
        'RDSKMSKey',
        'RDSKMSKeyAlias',
        'CloudTrailLogsBucket',
        'AccessLogsBucket',
        'ApplicationDataBucket',
        'CloudTrailBucketPolicy',
        'SecurityCloudTrail',
        'VPC',
        'PrivateSubnet1',
        'PrivateSubnet2',
        'DBSubnetGroup',
        'RDSSecurityGroup',
        'ApplicationSecurityGroup',
        'RDSDatabase',
        'ApplicationRole',
        'ApplicationInstanceProfile'
      ];

      expectedResources.forEach(resourceName => {
        expect(template.Resources[resourceName]).toBeDefined();
      });
    });
  });

  describe('Secrets Manager', () => {
    test('DatabaseSecret should be a Secrets Manager secret', () => {
      const secret = template.Resources.DatabaseSecret;
      expect(secret.Type).toBe('AWS::SecretsManager::Secret');
    });

    test('DatabaseSecret should have correct configuration', () => {
      const secret = template.Resources.DatabaseSecret;
      const properties = secret.Properties;

      expect(properties.Name).toEqual({
        'Fn::Sub': 'rds-password-${EnvironmentSuffix}'
      });
      expect(properties.Description).toBe('Auto-generated password for RDS MySQL database');
      expect(properties.GenerateSecretString).toBeDefined();
      
      const genConfig = properties.GenerateSecretString;
      expect(genConfig.PasswordLength).toBe(32);
      expect(genConfig.RequireEachIncludedType).toBe(true);
      expect(genConfig.ExcludeCharacters).toBe('"@/\\');
    });

    test('DatabaseSecret should have proper tags', () => {
      const secret = template.Resources.DatabaseSecret;
      const tags = secret.Properties.Tags;

      expect(tags).toBeDefined();
      expect(tags).toHaveLength(2);
      
      const envTag = tags.find((tag: any) => tag.Key === 'Environment');
      const purposeTag = tags.find((tag: any) => tag.Key === 'Purpose');
      
      expect(envTag).toBeDefined();
      expect(purposeTag).toBeDefined();
      
      expect(envTag.Value).toEqual({ Ref: 'EnvironmentSuffix' });
      expect(purposeTag.Value).toBe('RDS-Authentication');
    });
  });

  describe('DynamoDB Table', () => {
    test('TurnAroundPromptTable should be a DynamoDB table', () => {
      const table = template.Resources.TurnAroundPromptTable;
      expect(table.Type).toBe('AWS::DynamoDB::Table');
    });

    test('TurnAroundPromptTable should have correct deletion policies', () => {
      const table = template.Resources.TurnAroundPromptTable;
      expect(table.DeletionPolicy).toBe('Delete');
      expect(table.UpdateReplacePolicy).toBe('Delete');
    });

    test('TurnAroundPromptTable should have correct properties', () => {
      const table = template.Resources.TurnAroundPromptTable;
      const properties = table.Properties;

      expect(properties.TableName).toEqual({
        'Fn::Sub': 'TurnAroundPromptTable${EnvironmentSuffix}',
      });
      expect(properties.BillingMode).toBe('PAY_PER_REQUEST');
      expect(properties.DeletionProtectionEnabled).toBe(false);
    });

    test('TurnAroundPromptTable should have proper tags', () => {
      const table = template.Resources.TurnAroundPromptTable;
      const tags = table.Properties.Tags;

      expect(tags).toBeDefined();
      expect(tags).toHaveLength(2);
      
      const envTag = tags.find((tag: any) => tag.Key === 'Environment');
      const purposeTag = tags.find((tag: any) => tag.Key === 'Purpose');
      
      expect(envTag).toBeDefined();
      expect(purposeTag).toBeDefined();
      
      expect(envTag.Value).toEqual({ Ref: 'EnvironmentSuffix' });
      expect(purposeTag.Value).toBe('Prompt-Storage');
    });

    test('TurnAroundPromptTable should have correct attribute definitions', () => {
      const table = template.Resources.TurnAroundPromptTable;
      const attributeDefinitions = table.Properties.AttributeDefinitions;

      expect(attributeDefinitions).toHaveLength(1);
      expect(attributeDefinitions[0].AttributeName).toBe('id');
      expect(attributeDefinitions[0].AttributeType).toBe('S');
    });

    test('TurnAroundPromptTable should have correct key schema', () => {
      const table = template.Resources.TurnAroundPromptTable;
      const keySchema = table.Properties.KeySchema;

      expect(keySchema).toHaveLength(1);
      expect(keySchema[0].AttributeName).toBe('id');
      expect(keySchema[0].KeyType).toBe('HASH');
    });
  });

  describe('KMS Resources', () => {
    test('RDSKMSKey should be a KMS key', () => {
      const key = template.Resources.RDSKMSKey;
      expect(key.Type).toBe('AWS::KMS::Key');
    });

    test('RDSKMSKey should have correct description and key policy', () => {
      const key = template.Resources.RDSKMSKey;
      expect(key.Properties.Description).toBe('KMS Key for RDS Database encryption');
      expect(key.Properties.KeyPolicy).toBeDefined();
      expect(key.Properties.KeyPolicy.Statement).toHaveLength(2);
    });

    test('RDSKMSKey should have correct IAM permissions', () => {
      const key = template.Resources.RDSKMSKey;
      const statements = key.Properties.KeyPolicy.Statement;
      
      const iamStatement = statements.find((s: any) => s.Sid === 'Enable IAM User Permissions');
      expect(iamStatement).toBeDefined();
      expect(iamStatement.Effect).toBe('Allow');
      expect(iamStatement.Action).toBe('kms:*');
    });

    test('RDSKMSKey should have correct RDS service permissions', () => {
      const key = template.Resources.RDSKMSKey;
      const statements = key.Properties.KeyPolicy.Statement;
      
      const rdsStatement = statements.find((s: any) => s.Sid === 'Allow RDS Service');
      expect(rdsStatement).toBeDefined();
      expect(rdsStatement.Effect).toBe('Allow');
      expect(rdsStatement.Principal.Service).toBe('rds.amazonaws.com');
      expect(rdsStatement.Action).toContain('kms:Decrypt');
      expect(rdsStatement.Action).toContain('kms:GenerateDataKey');
    });

    test('RDSKMSKeyAlias should be a KMS alias', () => {
      const alias = template.Resources.RDSKMSKeyAlias;
      expect(alias.Type).toBe('AWS::KMS::Alias');
      expect(alias.Properties.AliasName).toEqual({
        'Fn::Sub': 'alias/rds-${EnvironmentSuffix}-key'
      });
      expect(alias.Properties.TargetKeyId).toEqual({ Ref: 'RDSKMSKey' });
    });
  });

  describe('S3 Resources', () => {
    test('should have three S3 buckets', () => {
      const s3Buckets = ['CloudTrailLogsBucket', 'AccessLogsBucket', 'ApplicationDataBucket'];
      s3Buckets.forEach(bucket => {
        expect(template.Resources[bucket]).toBeDefined();
        expect(template.Resources[bucket].Type).toBe('AWS::S3::Bucket');
      });
    });

    test('CloudTrailLogsBucket should have correct configuration', () => {
      const bucket = template.Resources.CloudTrailLogsBucket;
      expect(bucket.Properties.BucketName).toEqual({
        'Fn::Sub': 'cloudtrail-logs-${AWS::AccountId}-${EnvironmentSuffix}'
      });
      expect(bucket.Properties.BucketEncryption).toBeDefined();
      expect(bucket.Properties.PublicAccessBlockConfiguration).toBeDefined();
      expect(bucket.Properties.VersioningConfiguration.Status).toBe('Enabled');
    });

    test('AccessLogsBucket should have correct configuration', () => {
      const bucket = template.Resources.AccessLogsBucket;
      expect(bucket.Properties.BucketName).toEqual({
        'Fn::Sub': 'access-logs-${AWS::AccountId}-${EnvironmentSuffix}'
      });
      expect(bucket.Properties.PublicAccessBlockConfiguration.BlockPublicAcls).toBe(true);
      expect(bucket.Properties.PublicAccessBlockConfiguration.BlockPublicPolicy).toBe(true);
    });

    test('ApplicationDataBucket should have correct configuration', () => {
      const bucket = template.Resources.ApplicationDataBucket;
      expect(bucket.Properties.BucketName).toEqual({
        'Fn::Sub': 'app-data-${AWS::AccountId}-${EnvironmentSuffix}'
      });
      expect(bucket.Properties.LoggingConfiguration).toBeDefined();
      expect(bucket.Properties.LoggingConfiguration.DestinationBucketName).toEqual({
        Ref: 'AccessLogsBucket'
      });
    });

    test('CloudTrailBucketPolicy should be configured correctly', () => {
      const policy = template.Resources.CloudTrailBucketPolicy;
      expect(policy.Type).toBe('AWS::S3::BucketPolicy');
      expect(policy.Properties.Bucket).toEqual({ Ref: 'CloudTrailLogsBucket' });
      expect(policy.Properties.PolicyDocument.Statement).toHaveLength(2);
    });
  });

  describe('CloudTrail', () => {
    test('SecurityCloudTrail should be configured correctly', () => {
      const trail = template.Resources.SecurityCloudTrail;
      expect(trail.Type).toBe('AWS::CloudTrail::Trail');
      expect(trail.DependsOn).toBe('CloudTrailBucketPolicy');
      expect(trail.Properties.TrailName).toEqual({
        'Fn::Sub': 'security-trail-${EnvironmentSuffix}'
      });
      expect(trail.Properties.IsMultiRegionTrail).toBe(true);
      expect(trail.Properties.EnableLogFileValidation).toBe(true);
    });
  });

  describe('Networking Resources', () => {
    test('VPC should be configured correctly', () => {
      const vpc = template.Resources.VPC;
      expect(vpc.Type).toBe('AWS::EC2::VPC');
      expect(vpc.Properties.CidrBlock).toBe('10.0.0.0/16');
      expect(vpc.Properties.EnableDnsHostnames).toBe(true);
      expect(vpc.Properties.EnableDnsSupport).toBe(true);
    });

    test('should have two private subnets', () => {
      const subnet1 = template.Resources.PrivateSubnet1;
      const subnet2 = template.Resources.PrivateSubnet2;

      expect(subnet1.Type).toBe('AWS::EC2::Subnet');
      expect(subnet2.Type).toBe('AWS::EC2::Subnet');
      
      expect(subnet1.Properties.CidrBlock).toBe('10.0.1.0/24');
      expect(subnet2.Properties.CidrBlock).toBe('10.0.2.0/24');
      
      // Verify dynamic AZ selection instead of hardcoded values
      expect(subnet1.Properties.AvailabilityZone).toEqual({
        'Fn::Select': [0, { 'Fn::GetAZs': '' }]
      });
      expect(subnet2.Properties.AvailabilityZone).toEqual({
        'Fn::Select': [1, { 'Fn::GetAZs': '' }]
      });
    });

    test('should have two security groups', () => {
      const rdsSecGroup = template.Resources.RDSSecurityGroup;
      const appSecGroup = template.Resources.ApplicationSecurityGroup;

      expect(rdsSecGroup.Type).toBe('AWS::EC2::SecurityGroup');
      expect(appSecGroup.Type).toBe('AWS::EC2::SecurityGroup');
      
      expect(rdsSecGroup.Properties.GroupDescription).toBe('Security group for RDS database');
      expect(appSecGroup.Properties.GroupDescription).toBe('Security group for application tier');
    });

    test('RDS security group should allow MySQL access from application', () => {
      const rdsSecGroup = template.Resources.RDSSecurityGroup;
      const ingress = rdsSecGroup.Properties.SecurityGroupIngress[0];
      
      expect(ingress.IpProtocol).toBe('tcp');
      expect(ingress.FromPort).toBe(3306);
      expect(ingress.ToPort).toBe(3306);
      expect(ingress.SourceSecurityGroupId).toEqual({ Ref: 'ApplicationSecurityGroup' });
    });
  });

  describe('RDS Resources', () => {
    test('DBSubnetGroup should be configured correctly', () => {
      const subnetGroup = template.Resources.DBSubnetGroup;
      expect(subnetGroup.Type).toBe('AWS::RDS::DBSubnetGroup');
      expect(subnetGroup.Properties.SubnetIds).toHaveLength(2);
      expect(subnetGroup.Properties.SubnetIds).toContainEqual({ Ref: 'PrivateSubnet1' });
      expect(subnetGroup.Properties.SubnetIds).toContainEqual({ Ref: 'PrivateSubnet2' });
    });

    test('RDSDatabase should be configured correctly', () => {
      const db = template.Resources.RDSDatabase;
      expect(db.Type).toBe('AWS::RDS::DBInstance');
      expect(db.DeletionPolicy).toBe('Snapshot');
      
      expect(db.Properties.DBInstanceIdentifier).toEqual({
        'Fn::Sub': 'secure-db-${EnvironmentSuffix}'
      });
      expect(db.Properties.Engine).toBe('mysql');
      expect(db.Properties.EngineVersion).toBe('8.0.42');
      expect(db.Properties.DBInstanceClass).toBe('db.t3.micro');
    });

    test('RDSDatabase should have security features enabled', () => {
      const db = template.Resources.RDSDatabase;
      expect(db.Properties.StorageEncrypted).toBe(true);
      expect(db.Properties.KmsKeyId).toEqual({ Ref: 'RDSKMSKey' });
      // DeletionProtection was removed from template - it defaults to false
      expect(db.Properties.DeletionProtection).toBeUndefined();
      expect(db.Properties.PubliclyAccessible).toBe(false);
      expect(db.Properties.BackupRetentionPeriod).toBe(7);
    });

    test('RDSDatabase should use Secrets Manager for password management', () => {
      const db = template.Resources.RDSDatabase;
      expect(db.Properties.ManageMasterUserPassword).toBe(true);
      expect(db.Properties.MasterUserSecret).toBeDefined();
      expect(db.Properties.MasterUserSecret.SecretArn).toEqual({ Ref: 'DatabaseSecret' });
      
      // Should not have hardcoded password
      expect(db.Properties.MasterUserPassword).toBeUndefined();
    });
  });

  describe('IAM Resources', () => {
    test('ApplicationRole should be configured correctly', () => {
      const role = template.Resources.ApplicationRole;
      expect(role.Type).toBe('AWS::IAM::Role');
      expect(role.Properties.RoleName).toEqual({
        'Fn::Sub': 'ApplicationRole-${EnvironmentSuffix}'
      });
    });

    test('ApplicationRole should have correct assume role policy', () => {
      const role = template.Resources.ApplicationRole;
      const assumePolicy = role.Properties.AssumeRolePolicyDocument;
      
      expect(assumePolicy.Version).toBe('2012-10-17');
      expect(assumePolicy.Statement[0].Effect).toBe('Allow');
      expect(assumePolicy.Statement[0].Principal.Service).toBe('ec2.amazonaws.com');
      expect(assumePolicy.Statement[0].Action).toBe('sts:AssumeRole');
    });

    test('ApplicationRole should have S3 and CloudWatch policies', () => {
      const role = template.Resources.ApplicationRole;
      const policies = role.Properties.Policies;
      
      expect(policies).toHaveLength(2);
      
      const s3Policy = policies.find((p: any) => p.PolicyName === 'S3ApplicationDataAccess');
      const cwPolicy = policies.find((p: any) => p.PolicyName === 'CloudWatchLogs');
      
      expect(s3Policy).toBeDefined();
      expect(cwPolicy).toBeDefined();
    });

    test('ApplicationInstanceProfile should reference ApplicationRole', () => {
      const profile = template.Resources.ApplicationInstanceProfile;
      expect(profile.Type).toBe('AWS::IAM::InstanceProfile');
      expect(profile.Properties.Roles).toContainEqual({ Ref: 'ApplicationRole' });
    });
  });

  describe('Outputs', () => {
    test('should have exactly eleven outputs', () => {
      const outputCount = Object.keys(template.Outputs).length;
      expect(outputCount).toBe(11);
    });

    test('should have all required outputs', () => {
      const expectedOutputs = [
        'TurnAroundPromptTableName',
        'TurnAroundPromptTableArn',
        'StackName',
        'EnvironmentSuffix',
        'VPCId',
        'RDSEndpoint',
        'ApplicationDataBucket',
        'CloudTrailArn',
        'KMSKeyId',
        'ApplicationRoleArn',
        'DatabaseSecretArn'
      ];

      expectedOutputs.forEach(outputName => {
        expect(template.Outputs[outputName]).toBeDefined();
      });
    });

    test('TurnAroundPromptTableName output should be correct', () => {
      const output = template.Outputs.TurnAroundPromptTableName;
      expect(output.Description).toBe('Name of the DynamoDB table');
      expect(output.Value).toEqual({ Ref: 'TurnAroundPromptTable' });
      expect(output.Export.Name).toEqual({
        'Fn::Sub': '${AWS::StackName}-TurnAroundPromptTableName',
      });
    });

    test('VPCId output should be correct', () => {
      const output = template.Outputs.VPCId;
      expect(output.Description).toBe('VPC ID');
      expect(output.Value).toEqual({ Ref: 'VPC' });
      expect(output.Export.Name).toEqual({
        'Fn::Sub': '${AWS::StackName}-VPC-ID',
      });
    });

    test('RDSEndpoint output should be correct', () => {
      const output = template.Outputs.RDSEndpoint;
      expect(output.Description).toBe('RDS Database Endpoint');
      expect(output.Value).toEqual({
        'Fn::GetAtt': ['RDSDatabase', 'Endpoint.Address']
      });
    });

    test('ApplicationDataBucket output should be correct', () => {
      const output = template.Outputs.ApplicationDataBucket;
      expect(output.Description).toBe('Application Data S3 Bucket');
      expect(output.Value).toEqual({ Ref: 'ApplicationDataBucket' });
    });

    test('CloudTrailArn output should be correct', () => {
      const output = template.Outputs.CloudTrailArn;
      expect(output.Description).toBe('CloudTrail ARN');
      expect(output.Value).toEqual({
        'Fn::GetAtt': ['SecurityCloudTrail', 'Arn']
      });
    });

    test('ApplicationRoleArn output should be correct', () => {
      const output = template.Outputs.ApplicationRoleArn;
      expect(output.Description).toBe('Application IAM Role ARN');
      expect(output.Value).toEqual({
        'Fn::GetAtt': ['ApplicationRole', 'Arn']
      });
    });

    test('DatabaseSecretArn output should be correct', () => {
      const output = template.Outputs.DatabaseSecretArn;
      expect(output.Description).toBe('Database Secret ARN (contains auto-generated password)');
      expect(output.Value).toEqual({ Ref: 'DatabaseSecret' });
      expect(output.Export.Name).toEqual({
        'Fn::Sub': '${AWS::StackName}-DB-Secret-ARN'
      });
    });
  });

  describe('Resource Naming Convention', () => {
    test('resources should follow naming convention with environment suffix', () => {
      const namingTests = [
        { resource: 'TurnAroundPromptTable', property: 'TableName', expected: 'TurnAroundPromptTable${EnvironmentSuffix}' },
        { resource: 'RDSDatabase', property: 'DBInstanceIdentifier', expected: 'secure-db-${EnvironmentSuffix}' },
        { resource: 'ApplicationRole', property: 'RoleName', expected: 'ApplicationRole-${EnvironmentSuffix}' }
      ];

      namingTests.forEach(test => {
        const resource = template.Resources[test.resource];
        expect(resource.Properties[test.property]).toEqual({
          'Fn::Sub': test.expected
        });
      });
    });

    test('export names should follow naming convention', () => {
      Object.keys(template.Outputs).forEach(outputKey => {
        const output = template.Outputs[outputKey];
        expect(output.Export.Name['Fn::Sub']).toMatch(/^\${AWS::StackName}-.+$/);
      });
    });
  });

  describe('Security Best Practices', () => {
    test('S3 buckets should have encryption enabled', () => {
      const s3Buckets = ['CloudTrailLogsBucket', 'AccessLogsBucket', 'ApplicationDataBucket'];
      s3Buckets.forEach(bucketName => {
        const bucket = template.Resources[bucketName];
        expect(bucket.Properties.BucketEncryption).toBeDefined();
        expect(bucket.Properties.BucketEncryption.ServerSideEncryptionConfiguration[0].ServerSideEncryptionByDefault.SSEAlgorithm).toBe('AES256');
      });
    });

    test('S3 buckets should block public access', () => {
      const s3Buckets = ['CloudTrailLogsBucket', 'AccessLogsBucket', 'ApplicationDataBucket'];
      s3Buckets.forEach(bucketName => {
        const bucket = template.Resources[bucketName];
        const publicAccessBlock = bucket.Properties.PublicAccessBlockConfiguration;
        
        expect(publicAccessBlock.BlockPublicAcls).toBe(true);
        expect(publicAccessBlock.BlockPublicPolicy).toBe(true);
        expect(publicAccessBlock.IgnorePublicAcls).toBe(true);
        expect(publicAccessBlock.RestrictPublicBuckets).toBe(true);
      });
    });

    test('RDS should be in private subnets only', () => {
      const db = template.Resources.RDSDatabase;
      expect(db.Properties.PubliclyAccessible).toBe(false);
      expect(db.Properties.DBSubnetGroupName).toEqual({ Ref: 'DBSubnetGroup' });
    });

    test('RDS should have encryption enabled', () => {
      const db = template.Resources.RDSDatabase;
      expect(db.Properties.StorageEncrypted).toBe(true);
      expect(db.Properties.KmsKeyId).toEqual({ Ref: 'RDSKMSKey' });
    });
  });

  describe('Template Validation', () => {
    test('should have valid JSON structure', () => {
      expect(template).toBeDefined();
      expect(typeof template).toBe('object');
    });

    test('all resources should have proper tags where applicable', () => {
      const resourcesWithTags = [
        'DatabaseSecret', 'TurnAroundPromptTable', 'RDSKMSKey', 'CloudTrailLogsBucket', 'AccessLogsBucket', 'ApplicationDataBucket',
        'SecurityCloudTrail', 'VPC', 'PrivateSubnet1', 'PrivateSubnet2', 'DBSubnetGroup',
        'RDSSecurityGroup', 'ApplicationSecurityGroup', 'RDSDatabase', 'ApplicationRole'
      ];

      resourcesWithTags.forEach(resourceName => {
        const resource = template.Resources[resourceName];
        if (resource.Properties.Tags) {
          const envTag = resource.Properties.Tags.find((tag: any) => tag.Key === 'Environment');
          
          expect(envTag).toBeDefined();
          expect(envTag.Value).toEqual({ Ref: 'EnvironmentSuffix' });
        }
      });
    });

    test('should not have any circular dependencies', () => {
      // Basic check for obvious circular dependencies
      const dbSubnetGroup = template.Resources.DBSubnetGroup;
      const rdsDatabase = template.Resources.RDSDatabase;
      
      // DBSubnetGroup should reference subnets, not RDS
      expect(dbSubnetGroup.Properties.SubnetIds).not.toContain({ Ref: 'RDSDatabase' });
      
      // RDS should reference DBSubnetGroup, not create circular reference
      expect(rdsDatabase.Properties.DBSubnetGroupName).toEqual({ Ref: 'DBSubnetGroup' });
    });
  });
});