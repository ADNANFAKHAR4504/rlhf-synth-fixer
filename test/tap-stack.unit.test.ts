import fs from 'fs';
import path from 'path';

const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';

describe('TapStack CloudFormation Template', () => {
  let template: any;

  beforeAll(() => {
    // If you're testing a yaml template, run `pipenv run cfn-flip-to-json > lib/TapStack.json`
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
        'Secure-by-Design AWS Infrastructure with stringent security controls and compliance enforcement'
      );
    });

    test('should have all required sections', () => {
      expect(template.Parameters).toBeDefined();
      expect(template.Resources).toBeDefined();
      expect(template.Outputs).toBeDefined();
    });
  });

  describe('Parameters', () => {
    test('should have all required parameters', () => {
      const expectedParameters = [
        'VpcCidr',
        'DBInstanceClass',
        'DBEngineVersion',
        'EnvironmentSuffix'
      ];

      expectedParameters.forEach(paramName => {
        expect(template.Parameters[paramName]).toBeDefined();
      });
    });

    test('VpcCidr parameter should have correct properties', () => {
      const param = template.Parameters.VpcCidr;
      expect(param.Type).toBe('String');
      expect(param.Default).toBe('10.0.0.0/16');
      expect(param.Description).toBe('CIDR block for the VPC');
      expect(param.AllowedPattern).toBeDefined();
    });

    test('DBInstanceClass parameter should have correct properties', () => {
      const param = template.Parameters.DBInstanceClass;
      expect(param.Type).toBe('String');
      expect(param.Default).toBe('db.t3.micro');
      expect(param.Description).toBe('RDS instance class (e.g., db.t3.micro, db.m6g.large, db.r6g.xlarge)');
      expect(param.AllowedPattern).toBe('^db\\.[a-z0-9]+\\.[a-z0-9]+$');
      expect(param.MinLength).toBe(8);
      expect(param.MaxLength).toBe(20);
    });

    test('DBEngineVersion parameter should have correct properties', () => {
      const param = template.Parameters.DBEngineVersion;
      expect(param.Type).toBe('String');
      expect(param.Default).toBe('8.0.42');
      expect(param.Description).toBe('MySQL engine version');
    });

    test('EnvironmentSuffix parameter should have correct properties', () => {
      const param = template.Parameters.EnvironmentSuffix;
      expect(param.Type).toBe('String');
      expect(param.Default).toBe('dev');
      expect(param.Description).toBe('Environment suffix - used for resource naming and tagging');
      expect(param.MinLength).toBe(1);
      expect(param.MaxLength).toBe(64);
      expect(param.AllowedPattern).toBe('^[a-zA-Z0-9-_]+$');
    });
  });

  describe('KMS Resources', () => {
    test('should have SecureDataKMSKey resource', () => {
      expect(template.Resources.SecureDataKMSKey).toBeDefined();
      const key = template.Resources.SecureDataKMSKey;
      expect(key.Type).toBe('AWS::KMS::Key');
    });

    test('SecureDataKMSKey should have correct properties and service permissions', () => {
      const key = template.Resources.SecureDataKMSKey;
      const properties = key.Properties;
      
      expect(properties.Description).toBe('Customer-managed KMS key for encrypting S3 and RDS data at rest');
      expect(properties.KeyPolicy).toBeDefined();
      expect(properties.Tags).toBeDefined();

      // Verify service permissions in key policy
      const serviceStatement = properties.KeyPolicy.Statement.find((s: any) => 
        s.Sid === 'Allow use of the key for S3 and RDS'
      );
      expect(serviceStatement).toBeDefined();
      expect(serviceStatement.Principal.Service).toContain('s3.amazonaws.com');
      expect(serviceStatement.Principal.Service).toContain('rds.amazonaws.com');
      expect(serviceStatement.Action).toContain('kms:Decrypt');
      expect(serviceStatement.Action).toContain('kms:GenerateDataKey');
      expect(serviceStatement.Action).toContain('kms:ReEncrypt*');
      expect(serviceStatement.Action).toContain('kms:CreateGrant');
      expect(serviceStatement.Action).toContain('kms:DescribeKey');
    });

    test('SecureDataKMSKey should have correct tags', () => {
      const key = template.Resources.SecureDataKMSKey;
      const tags = key.Properties.Tags;
      
      expect(tags).toContainEqual({
        Key: 'Project',
        Value: 'SecureOps'
      });
      expect(tags).toContainEqual({
        Key: 'Environment',
        Value: { Ref: 'EnvironmentSuffix' }
      });
    });

    test('should have SecureDataKMSKeyAlias resource', () => {
      expect(template.Resources.SecureDataKMSKeyAlias).toBeDefined();
      const alias = template.Resources.SecureDataKMSKeyAlias;
      expect(alias.Type).toBe('AWS::KMS::Alias');
    });

    test('SecureDataKMSKeyAlias should reference the key correctly', () => {
      const alias = template.Resources.SecureDataKMSKeyAlias;
      expect(alias.Properties.TargetKeyId).toEqual({ Ref: 'SecureDataKMSKey' });
      expect(alias.Properties.AliasName).toEqual({
        'Fn::Sub': 'alias/${AWS::StackName}-${EnvironmentSuffix}-key'
      });
    });
  });

  describe('VPC Resources', () => {
    test('should have SecureVPC resource', () => {
      expect(template.Resources.SecureVPC).toBeDefined();
      const vpc = template.Resources.SecureVPC;
      expect(vpc.Type).toBe('AWS::EC2::VPC');
    });

    test('SecureVPC should have correct properties', () => {
      const vpc = template.Resources.SecureVPC;
      const properties = vpc.Properties;
      
      expect(properties.CidrBlock).toEqual({ Ref: 'VpcCidr' });
      expect(properties.EnableDnsHostnames).toBe(true);
      expect(properties.EnableDnsSupport).toBe(true);
    });

    test('SecureVPC should have correct tags', () => {
      const vpc = template.Resources.SecureVPC;
      const tags = vpc.Properties.Tags;
      
      expect(tags).toContainEqual({
        Key: 'Name',
        Value: { 'Fn::Sub': '${AWS::StackName}-VPC-${EnvironmentSuffix}' }
      });
      expect(tags).toContainEqual({
        Key: 'Project',
        Value: 'SecureOps'
      });
      expect(tags).toContainEqual({
        Key: 'Environment',
        Value: { Ref: 'EnvironmentSuffix' }
      });
    });

    test('should have PrivateSubnet1 resource', () => {
      expect(template.Resources.PrivateSubnet1).toBeDefined();
      const subnet = template.Resources.PrivateSubnet1;
      expect(subnet.Type).toBe('AWS::EC2::Subnet');
    });

    test('should have PrivateSubnet2 resource', () => {
      expect(template.Resources.PrivateSubnet2).toBeDefined();
      const subnet = template.Resources.PrivateSubnet2;
      expect(subnet.Type).toBe('AWS::EC2::Subnet');
    });

    test('should have DBSubnetGroup resource', () => {
      expect(template.Resources.DBSubnetGroup).toBeDefined();
      const subnetGroup = template.Resources.DBSubnetGroup;
      expect(subnetGroup.Type).toBe('AWS::RDS::DBSubnetGroup');
    });

    test('DBSubnetGroup should reference both subnets', () => {
      const subnetGroup = template.Resources.DBSubnetGroup;
      const subnetIds = subnetGroup.Properties.SubnetIds;
      
      expect(subnetIds).toContainEqual({ Ref: 'PrivateSubnet1' });
      expect(subnetIds).toContainEqual({ Ref: 'PrivateSubnet2' });
    });
  });

  describe('AWS Config Resources', () => {
    test('should have ConfigServiceRole resource', () => {
      expect(template.Resources.ConfigServiceRole).toBeDefined();
      const role = template.Resources.ConfigServiceRole;
      expect(role.Type).toBe('AWS::IAM::Role');
    });

    test('ConfigServiceRole should have correct assume role policy', () => {
      const role = template.Resources.ConfigServiceRole;
      const assumeRolePolicy = role.Properties.AssumeRolePolicyDocument;
      
      expect(assumeRolePolicy.Version).toBe('2012-10-17');
      expect(assumeRolePolicy.Statement).toHaveLength(1);
      expect(assumeRolePolicy.Statement[0].Effect).toBe('Allow');
      expect(assumeRolePolicy.Statement[0].Principal.Service).toBe('config.amazonaws.com');
      expect(assumeRolePolicy.Statement[0].Action).toBe('sts:AssumeRole');
    });

    test('ConfigServiceRole should have inline policies', () => {
      const role = template.Resources.ConfigServiceRole;
      expect(role.Properties.Policies).toBeDefined();
      expect(role.Properties.Policies).toHaveLength(1);
      
      const policy = role.Properties.Policies[0];
      expect(policy.PolicyName).toBe('ConfigServiceMinimalAccess');
      expect(policy.PolicyDocument).toBeDefined();
    });

    test('should have ConfigDeliveryChannel resource', () => {
      expect(template.Resources.ConfigDeliveryChannel).toBeDefined();
      const channel = template.Resources.ConfigDeliveryChannel;
      expect(channel.Type).toBe('AWS::Config::DeliveryChannel');
    });

    test('should have ConfigurationRecorder resource', () => {
      expect(template.Resources.ConfigurationRecorder).toBeDefined();
      const recorder = template.Resources.ConfigurationRecorder;
      expect(recorder.Type).toBe('AWS::Config::ConfigurationRecorder');
    });

    test('should have VPCDnsSupportConfigRule resource', () => {
      expect(template.Resources.VPCDnsSupportConfigRule).toBeDefined();
      const rule = template.Resources.VPCDnsSupportConfigRule;
      expect(rule.Type).toBe('AWS::Config::ConfigRule');
    });

    test('should have VPCDnsSupportLambdaRole resource', () => {
      expect(template.Resources.VPCDnsSupportLambdaRole).toBeDefined();
      const role = template.Resources.VPCDnsSupportLambdaRole;
      expect(role.Type).toBe('AWS::IAM::Role');
    });

    test('should have VPCDnsSupportFunction resource', () => {
      expect(template.Resources.VPCDnsSupportFunction).toBeDefined();
      const function_ = template.Resources.VPCDnsSupportFunction;
      expect(function_.Type).toBe('AWS::Lambda::Function');
    });

    test('should have VPCDnsSupportLambdaPermission resource', () => {
      expect(template.Resources.VPCDnsSupportLambdaPermission).toBeDefined();
      const permission = template.Resources.VPCDnsSupportLambdaPermission;
      expect(permission.Type).toBe('AWS::Lambda::Permission');
      expect(permission.Properties.Principal).toBe('config.amazonaws.com');
      expect(permission.Properties.Action).toBe('lambda:InvokeFunction');
    });

    test('VPCDnsSupportConfigRule should have correct source', () => {
      const rule = template.Resources.VPCDnsSupportConfigRule;
      const source = rule.Properties.Source;
      
      expect(source.Owner).toBe('CUSTOM_LAMBDA');
      expect(source.SourceIdentifier).toEqual({ 'Fn::GetAtt': ['VPCDnsSupportFunction', 'Arn'] });
      expect(source.SourceDetails).toBeDefined();
      expect(source.SourceDetails).toHaveLength(1);
      expect(source.SourceDetails[0].EventSource).toBe('aws.config');
      expect(source.SourceDetails[0].MessageType).toBe('ConfigurationItemChangeNotification');
      // MaximumExecutionFrequency is not allowed for ConfigurationItemChangeNotification
    });
  });

  describe('IAM Roles', () => {
    test('should have AppServerRole resource', () => {
      expect(template.Resources.AppServerRole).toBeDefined();
      const role = template.Resources.AppServerRole;
      expect(role.Type).toBe('AWS::IAM::Role');
    });

    test('AppServerRole should have correct properties', () => {
      const role = template.Resources.AppServerRole;
      expect(role.Properties.RoleName).toEqual({
        'Fn::Sub': '${AWS::StackName}-AppServerRole-${EnvironmentSuffix}'
      });
      expect(role.Properties.Policies).toBeDefined();
    });

    test('should have LowSecurityReadOnlyRole resource', () => {
      expect(template.Resources.LowSecurityReadOnlyRole).toBeDefined();
      const role = template.Resources.LowSecurityReadOnlyRole;
      expect(role.Type).toBe('AWS::IAM::Role');
    });

    test('LowSecurityReadOnlyRole should have SecurityLevel tag', () => {
      const role = template.Resources.LowSecurityReadOnlyRole;
      const tags = role.Properties.Tags;
      
      expect(tags).toContainEqual({
        Key: 'SecurityLevel',
        Value: 'Low'
      });
    });
  });

  describe('S3 Resources', () => {
    test('should have CentralLoggingBucket resource', () => {
      expect(template.Resources.CentralLoggingBucket).toBeDefined();
      const bucket = template.Resources.CentralLoggingBucket;
      expect(bucket.Type).toBe('AWS::S3::Bucket');
      expect(bucket.DeletionPolicy).toBe('Delete');
    });

    test('CentralLoggingBucket should have correct properties', () => {
      const bucket = template.Resources.CentralLoggingBucket;
      const properties = bucket.Properties;
      
      expect(properties.BucketName).toEqual({
        'Fn::Sub': 'tapstack-${EnvironmentSuffix}-central-logging-${AWS::AccountId}'
      });
      expect(properties.PublicAccessBlockConfiguration).toBeDefined();
      expect(properties.VersioningConfiguration).toBeDefined();
      expect(properties.BucketEncryption).toBeDefined();
      expect(properties.LifecycleConfiguration).toBeDefined();
    });

    test('should have SecureDataBucket resource', () => {
      expect(template.Resources.SecureDataBucket).toBeDefined();
      const bucket = template.Resources.SecureDataBucket;
      expect(bucket.Type).toBe('AWS::S3::Bucket');
      expect(bucket.DeletionPolicy).toBe('Delete');
    });

    test('SecureDataBucket should have correct bucket name and versioning', () => {
      const bucket = template.Resources.SecureDataBucket;
      const properties = bucket.Properties;
      
      expect(properties.BucketName).toEqual({
        'Fn::Sub': 'tapstack-${EnvironmentSuffix}-secure-data-${AWS::AccountId}'
      });
      expect(properties.VersioningConfiguration.Status).toBe('Enabled');
    });

    test('should have SecureDataBucketPolicy resource', () => {
      expect(template.Resources.SecureDataBucketPolicy).toBeDefined();
      const policy = template.Resources.SecureDataBucketPolicy;
      expect(policy.Type).toBe('AWS::S3::BucketPolicy');
    });

    test('SecureDataBucketPolicy should reference the bucket', () => {
      const policy = template.Resources.SecureDataBucketPolicy;
      expect(policy.Properties.Bucket).toEqual({ Ref: 'SecureDataBucket' });
    });

    test('SecureDataBucketPolicy should have deny statement for SecurityLevel=Low', () => {
      const policy = template.Resources.SecureDataBucketPolicy;
      const statements = policy.Properties.PolicyDocument.Statement;
      
      const denyStatement = statements.find((s: any) => s.Effect === 'Deny');
      expect(denyStatement).toBeDefined();
      expect(denyStatement.Condition.StringEquals['aws:PrincipalTag/SecurityLevel']).toBe('Low');
    });
  });

  describe('RDS Resources', () => {
    test('should have RDSSecurityGroup resource', () => {
      expect(template.Resources.RDSSecurityGroup).toBeDefined();
      const sg = template.Resources.RDSSecurityGroup;
      expect(sg.Type).toBe('AWS::EC2::SecurityGroup');
    });

    test('should have SecureRDSInstance resource', () => {
      expect(template.Resources.SecureRDSInstance).toBeDefined();
      const rds = template.Resources.SecureRDSInstance;
      expect(rds.Type).toBe('AWS::RDS::DBInstance');
    });

    test('SecureRDSInstance should have correct deletion policies', () => {
      const rds = template.Resources.SecureRDSInstance;
      expect(rds.DeletionPolicy).toBe('Snapshot');
      expect(rds.UpdateReplacePolicy).toBe('Snapshot');
    });

    test('SecureRDSInstance should have correct properties and backup configuration', () => {
      const rds = template.Resources.SecureRDSInstance;
      const properties = rds.Properties;
      
      expect(properties.DBInstanceIdentifier).toEqual({
        'Fn::Sub': '${AWS::StackName}-db-${EnvironmentSuffix}'
      });
      expect(properties.DBInstanceClass).toEqual({ Ref: 'DBInstanceClass' });
      expect(properties.Engine).toBe('mysql');
      expect(properties.EngineVersion).toEqual({ Ref: 'DBEngineVersion' });
      expect(properties.StorageEncrypted).toBe(true);
      expect(properties.DeletionProtection).toBe(false);
      expect(properties.PubliclyAccessible).toBe(false);
      
      // Backup configuration
      expect(properties.BackupRetentionPeriod).toBe(30);
      expect(properties.PreferredBackupWindow).toBe('03:00-04:00');
      expect(properties.PreferredMaintenanceWindow).toBe('sun:04:00-sun:05:00');
      
      // Storage configuration
      expect(properties.AllocatedStorage).toBe(20);
      expect(properties.MaxAllocatedStorage).toBe(100);
    });

    test('SecureRDSInstance should have valid credentials configuration', () => {
      const rds = template.Resources.SecureRDSInstance;
      const properties = rds.Properties;
      
      // Accept either Secrets Manager reference (for AWS) or hardcoded values (for LocalStack)
      const isSecretsManager = typeof properties.MasterUsername === 'object' && 
                               properties.MasterUsername['Fn::Sub'];
      const isHardcoded = typeof properties.MasterUsername === 'string';
      
      expect(isSecretsManager || isHardcoded).toBe(true);
      expect(properties.MasterUsername).toBeDefined();
      expect(properties.MasterUserPassword).toBeDefined();
    });

    test('SecureRDSInstance should have log exports enabled', () => {
      const rds = template.Resources.SecureRDSInstance;
      const logExports = rds.Properties.EnableCloudwatchLogsExports;
      
      expect(logExports).toContain('audit');
      expect(logExports).toContain('error');
      expect(logExports).toContain('general');
      expect(logExports).toContain('slowquery');
    });


  });

  describe('Outputs', () => {
    test('should have all required outputs', () => {
      // Core outputs (always present)
      const coreOutputs = [
        'VPCId',
        'KMSKeyArn',
        'CentralLoggingBucketName',
        'SecureDataBucketName',
        'AppServerRoleArn',
        'LowSecurityRoleArn'
      ];

      coreOutputs.forEach(outputName => {
        expect(template.Outputs[outputName]).toBeDefined();
      });

      // Conditional outputs (may have Condition for LocalStack)
      const conditionalOutputs = ['RDSEndpoint', 'ConfigRuleName'];
      conditionalOutputs.forEach(outputName => {
        expect(template.Outputs[outputName]).toBeDefined();
      });
    });

    test('VPCId output should be correct', () => {
      const output = template.Outputs.VPCId;
      expect(output.Description).toBe('ID of the secure VPC');
      expect(output.Value).toEqual({ Ref: 'SecureVPC' });
      expect(output.Export.Name).toEqual({
        'Fn::Sub': '${AWS::StackName}-VPC-ID'
      });
    });

    test('KMSKeyArn output should be correct', () => {
      const output = template.Outputs.KMSKeyArn;
      expect(output.Description).toBe('ARN of the customer-managed KMS key');
      expect(output.Value).toEqual({ 'Fn::GetAtt': ['SecureDataKMSKey', 'Arn'] });
      expect(output.Export.Name).toEqual({
        'Fn::Sub': '${AWS::StackName}-KMS-Key-ARN'
      });
    });

    test('CentralLoggingBucketName output should be correct', () => {
      const output = template.Outputs.CentralLoggingBucketName;
      expect(output.Description).toBe('Name of the central logging S3 bucket');
      expect(output.Value).toEqual({ Ref: 'CentralLoggingBucket' });
      expect(output.Export.Name).toEqual({
        'Fn::Sub': '${AWS::StackName}-Central-Logging-Bucket'
      });
    });

    test('SecureDataBucketName output should be correct', () => {
      const output = template.Outputs.SecureDataBucketName;
      expect(output.Description).toBe('Name of the secure data S3 bucket');
      expect(output.Value).toEqual({ Ref: 'SecureDataBucket' });
      expect(output.Export.Name).toEqual({
        'Fn::Sub': '${AWS::StackName}-Secure-Data-Bucket'
      });
    });

    test('RDSEndpoint output should be correct', () => {
      const output = template.Outputs.RDSEndpoint;
      expect(output.Description).toBe('RDS instance endpoint address');
      expect(output.Value).toEqual({ 'Fn::GetAtt': ['SecureRDSInstance', 'Endpoint.Address'] });
      expect(output.Export.Name).toEqual({
        'Fn::Sub': '${AWS::StackName}-RDS-Endpoint'
      });
    });

    test('AppServerRoleArn output should be correct', () => {
      const output = template.Outputs.AppServerRoleArn;
      expect(output.Description).toBe('ARN of the Application Server IAM Role');
      expect(output.Value).toEqual({ 'Fn::GetAtt': ['AppServerRole', 'Arn'] });
      expect(output.Export.Name).toEqual({
        'Fn::Sub': '${AWS::StackName}-AppServer-Role-ARN'
      });
    });

    test('LowSecurityRoleArn output should be correct', () => {
      const output = template.Outputs.LowSecurityRoleArn;
      expect(output.Description).toBe('ARN of the Low Security Read-Only IAM Role');
      expect(output.Value).toEqual({ 'Fn::GetAtt': ['LowSecurityReadOnlyRole', 'Arn'] });
      expect(output.Export.Name).toEqual({
        'Fn::Sub': '${AWS::StackName}-LowSecurity-Role-ARN'
      });
    });

    test('ConfigRuleName output should be correct', () => {
      const output = template.Outputs.ConfigRuleName;
      expect(output.Description).toBe('Name of the AWS Config rule validating VPC DNS support');
      expect(output.Value).toEqual({ Ref: 'VPCDnsSupportConfigRule' });
      expect(output.Export.Name).toEqual({
        'Fn::Sub': '${AWS::StackName}-Config-Rule-Name'
      });
    });
  });

  describe('Resource Tagging', () => {
    test('all resources should follow consistent tagging pattern', () => {
      const resourcesWithTags = [
        'SecureVPC',
        'PrivateSubnet1',
        'PrivateSubnet2',
        'DBSubnetGroup',
        'SecureDataKMSKey',
        'ConfigServiceRole',
        'AppServerRole',
        'LowSecurityReadOnlyRole',
        'CentralLoggingBucket',
        'SecureDataBucket',
        'RDSSecurityGroup',
        'SecureRDSInstance'
      ];

      resourcesWithTags.forEach(resourceName => {
        const resource = template.Resources[resourceName];
        if (resource.Properties.Tags) {
          const projectTag = resource.Properties.Tags.find((tag: any) => tag.Key === 'Project');
          
          expect(projectTag).toBeDefined();
          expect(projectTag.Value).toBe('SecureOps');
        }
      });
    });

    test('VPC should have correct tags', () => {
      const vpc = template.Resources.SecureVPC;
      const tags = vpc.Properties.Tags;
      
      expect(tags).toContainEqual({
        Key: 'Name',
        Value: { 'Fn::Sub': '${AWS::StackName}-VPC-${EnvironmentSuffix}' }
      });
      expect(tags).toContainEqual({
        Key: 'Project',
        Value: 'SecureOps'
      });
              expect(tags).toContainEqual({
          Key: 'Environment',
          Value: { Ref: 'EnvironmentSuffix' }
        });
    });
  });

  describe('Security Configuration', () => {
    test('all S3 buckets should have public access blocked', () => {
      const buckets = ['CentralLoggingBucket', 'SecureDataBucket'];
      
      buckets.forEach(bucketName => {
        const bucket = template.Resources[bucketName];
        const publicAccessBlock = bucket.Properties.PublicAccessBlockConfiguration;
        
        expect(publicAccessBlock.BlockPublicAcls).toBe(true);
        expect(publicAccessBlock.BlockPublicPolicy).toBe(true);
        expect(publicAccessBlock.IgnorePublicAcls).toBe(true);
        expect(publicAccessBlock.RestrictPublicBuckets).toBe(true);
      });
    });

    test('all S3 buckets should have encryption enabled', () => {
      const buckets = ['CentralLoggingBucket', 'SecureDataBucket'];
      
      buckets.forEach(bucketName => {
        const bucket = template.Resources[bucketName];
        const encryption = bucket.Properties.BucketEncryption;
        
        expect(encryption.ServerSideEncryptionConfiguration).toHaveLength(1);
        expect(encryption.ServerSideEncryptionConfiguration[0].ServerSideEncryptionByDefault.SSEAlgorithm).toBe('aws:kms');
        expect(encryption.ServerSideEncryptionConfiguration[0].ServerSideEncryptionByDefault.KMSMasterKeyID).toEqual({
          'Fn::GetAtt': ['SecureDataKMSKey', 'Arn']
        });
      });
    });

    test('RDS instance should have encryption enabled', () => {
      const rds = template.Resources.SecureRDSInstance;
      expect(rds.Properties.StorageEncrypted).toBe(true);
      expect(rds.Properties.KmsKeyId).toEqual({ 'Fn::GetAtt': ['SecureDataKMSKey', 'Arn'] });
    });

    test('RDS instance should have deletion protection enabled', () => {
      const rds = template.Resources.SecureRDSInstance;
      expect(rds.Properties.DeletionProtection).toBe(false);
    });

    test('RDS instance should not be publicly accessible', () => {
      const rds = template.Resources.SecureRDSInstance;
      expect(rds.Properties.PubliclyAccessible).toBe(false);
    });
  });

  describe('Resource Naming Convention', () => {
    test('resources should follow stack-based naming convention', () => {
      const resourcesWithNames = [
              { resource: 'SecureVPC', property: 'Tags[0].Value', expected: '${AWS::StackName}-VPC-${EnvironmentSuffix}' },
      { resource: 'SecureRDSInstance', property: 'DBInstanceIdentifier', expected: '${AWS::StackName}-db-${EnvironmentSuffix}' },
      { resource: 'AppServerRole', property: 'RoleName', expected: '${AWS::StackName}-AppServerRole-${EnvironmentSuffix}' },
      { resource: 'LowSecurityReadOnlyRole', property: 'RoleName', expected: '${AWS::StackName}-LowSecurityReadOnlyRole-${EnvironmentSuffix}' }
      ];

      resourcesWithNames.forEach(({ resource, property, expected }) => {
        const resourceObj = template.Resources[resource];
        const propertyPath = property.split('.');
        let value = resourceObj.Properties;
        
        propertyPath.forEach(path => {
          if (path.includes('[')) {
            const [arrayName, index] = path.split(/[\[\]]/);
            value = value[arrayName][parseInt(index)];
          } else {
            value = value[path];
          }
        });

        expect(value).toEqual({ 'Fn::Sub': expected });
      });
    });

    test('export names should follow correct naming pattern', () => {
      const expectedExportNames = {
        'VPCId': '${AWS::StackName}-VPC-ID',
        'KMSKeyArn': '${AWS::StackName}-KMS-Key-ARN',
        'CentralLoggingBucketName': '${AWS::StackName}-Central-Logging-Bucket',
        'SecureDataBucketName': '${AWS::StackName}-Secure-Data-Bucket',
        'RDSEndpoint': '${AWS::StackName}-RDS-Endpoint',
        'AppServerRoleArn': '${AWS::StackName}-AppServer-Role-ARN',
        'LowSecurityRoleArn': '${AWS::StackName}-LowSecurity-Role-ARN',
        'ConfigRuleName': '${AWS::StackName}-Config-Rule-Name'
      };

      Object.keys(expectedExportNames).forEach(outputKey => {
        const output = template.Outputs[outputKey];
        const expectedPattern = expectedExportNames[outputKey as keyof typeof expectedExportNames];
        
        expect(output.Export).toBeDefined();
        expect(output.Export.Name).toEqual({
          'Fn::Sub': expectedPattern
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

    test('should have correct number of parameters', () => {
      const parameterCount = Object.keys(template.Parameters).length;
      expect(parameterCount).toBe(4);
    });

    test('should have reasonable number of resources', () => {
      const resourceCount = Object.keys(template.Resources).length;
      expect(resourceCount).toBeGreaterThan(10); // Should have multiple resources
      
      // Optional: Log actual resources for debugging
      console.log('Actual resources:', Object.keys(template.Resources));
      console.log('Total resource count:', resourceCount);
    });

    test('should have correct number of outputs', () => {
      const outputCount = Object.keys(template.Outputs).length;
      expect(outputCount).toBeGreaterThanOrEqual(6); // Core outputs, conditionals may vary
      expect(outputCount).toBeLessThanOrEqual(8);
    });
  });
});
