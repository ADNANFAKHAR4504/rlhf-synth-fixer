import fs from 'fs';
import path from 'path';

const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';

describe('TapStack CloudFormation Template - SaaS Encryption Standards', () => {
  let template: any;

  beforeAll(() => {
    const templatePath = path.join(__dirname, '../lib/TapStack.json');
    const templateContent = fs.readFileSync(templatePath, 'utf8');
    template = JSON.parse(templateContent);
  });

  describe('Template Structure and Metadata', () => {
    test('should have valid CloudFormation format version', () => {
      expect(template.AWSTemplateFormatVersion).toBe('2010-09-09');
    });

    test('should have encryption standards description', () => {
      expect(template.Description).toBeDefined();
      expect(template.Description).toBe('SaaS Encryption Standards Enforcement Template - Compliant with cfn-nag and AWS Config');
    });

    test('should have CloudFormation Interface metadata', () => {
      expect(template.Metadata).toBeDefined();
      expect(template.Metadata['AWS::CloudFormation::Interface']).toBeDefined();
      expect(template.Metadata['AWS::CloudFormation::Interface'].ParameterGroups).toBeDefined();
      expect(template.Metadata['AWS::CloudFormation::Interface'].ParameterLabels).toBeDefined();
    });
  });

  describe('Parameters Validation', () => {
    test('should have Environment parameter with correct configuration', () => {
      expect(template.Parameters.Environment).toBeDefined();
      const envParam = template.Parameters.Environment;
      
      expect(envParam.Type).toBe('String');
      expect(envParam.Default).toBe('production');
      expect(envParam.AllowedValues).toEqual(['development', 'staging', 'production']);
      expect(envParam.Description).toBe('Environment name for resource tagging');
    });

    test('should have MFAAge parameter for multi-factor authentication', () => {
      expect(template.Parameters.MFAAge).toBeDefined();
      const mfaParam = template.Parameters.MFAAge;
      
      expect(mfaParam.Type).toBe('Number');
      expect(mfaParam.Default).toBe(3600);
      expect(mfaParam.Description).toBe('Maximum age in seconds for MFA authentication (default 1 hour)');
    });

    test('should have KMSKeyArn parameter for custom encryption key', () => {
      expect(template.Parameters.KMSKeyArn).toBeDefined();
      const kmsParam = template.Parameters.KMSKeyArn;
      
      expect(kmsParam.Type).toBe('String');
      expect(kmsParam.Default).toBe('');
      expect(kmsParam.Description).toBe('Optional KMS key ARN for S3 encryption (leave empty for AWS managed key)');
    });
  });

  describe('Conditions for KMS Key Management', () => {
    test('should have UseCustomKMS condition', () => {
      expect(template.Conditions.UseCustomKMS).toBeDefined();
      const condition = template.Conditions.UseCustomKMS;
      
      expect(condition['Fn::Not']).toBeDefined();
      expect(condition['Fn::Not'][0]['Fn::Equals']).toEqual([{ 'Ref': 'KMSKeyArn' }, '']);
    });

    test('should have UseDefaultKMS condition', () => {
      expect(template.Conditions.UseDefaultKMS).toBeDefined();
      const condition = template.Conditions.UseDefaultKMS;
      
      expect(condition['Fn::Equals']).toEqual([{ 'Ref': 'KMSKeyArn' }, '']);
    });
  });

  describe('KMS Encryption Resources', () => {
    test('should have EncryptionKey with proper configuration', () => {
      expect(template.Resources.EncryptionKey).toBeDefined();
      const key = template.Resources.EncryptionKey;
      
      expect(key.Type).toBe('AWS::KMS::Key');
      expect(key.Condition).toBe('UseDefaultKMS');
      expect(key.Properties.Description).toBe('Master key for encryption compliance');
      expect(key.Properties.EnableKeyRotation).toBe(true);
    });

    test('should have EncryptionKey with comprehensive key policy', () => {
      const key = template.Resources.EncryptionKey;
      const keyPolicy = key.Properties.KeyPolicy;
      
      expect(keyPolicy.Version).toBe('2012-10-17');
      expect(keyPolicy.Statement).toHaveLength(2);
      
      // Check root permissions statement
      const rootStatement = keyPolicy.Statement.find((s: any) => s.Sid === 'Enable IAM User Permissions');
      expect(rootStatement).toBeDefined();
      expect(rootStatement.Effect).toBe('Allow');
      expect(rootStatement.Action).toBe('kms:*');
      
      // Check service permissions statement
      const serviceStatement = keyPolicy.Statement.find((s: any) => s.Sid === 'Allow use of the key for encryption');
      expect(serviceStatement).toBeDefined();
      expect(serviceStatement.Principal.Service).toEqual(['s3.amazonaws.com', 'ec2.amazonaws.com', 'config.amazonaws.com']);
    });

    test('should have EncryptionKeyAlias with correct naming', () => {
      expect(template.Resources.EncryptionKeyAlias).toBeDefined();
      const alias = template.Resources.EncryptionKeyAlias;
      
      expect(alias.Type).toBe('AWS::KMS::Alias');
      expect(alias.Condition).toBe('UseDefaultKMS');
      expect(alias.Properties.AliasName).toEqual({ 'Fn::Sub': 'alias/encryption-compliance-${Environment}' });
      expect(alias.Properties.TargetKeyId).toEqual({ 'Ref': 'EncryptionKey' });
    });
  });

  describe('S3 Buckets and Encryption Policies', () => {
    test('should have ApplicationDataBucket with mandatory encryption', () => {
      expect(template.Resources.ApplicationDataBucket).toBeDefined();
      const bucket = template.Resources.ApplicationDataBucket;
      
      expect(bucket.Type).toBe('AWS::S3::Bucket');
      expect(bucket.Properties.BucketName).toEqual({ 'Fn::Sub': 'saas-app-data-${AWS::AccountId}-${Environment}' });
      expect(bucket.Properties.BucketEncryption.ServerSideEncryptionConfiguration).toBeDefined();
    });

    test('should have ApplicationDataBucket with conditional KMS encryption', () => {
      const bucket = template.Resources.ApplicationDataBucket;
      const encryption = bucket.Properties.BucketEncryption.ServerSideEncryptionConfiguration[0].ServerSideEncryptionByDefault;
      
      expect(encryption.SSEAlgorithm).toEqual({ 'Fn::If': ['UseCustomKMS', 'aws:kms', 'AES256'] });
      expect(encryption.KMSMasterKeyID).toEqual({ 'Fn::If': ['UseCustomKMS', { 'Ref': 'KMSKeyArn' }, { 'Ref': 'AWS::NoValue' }] });
    });

    test('should have ApplicationDataBucket with security best practices', () => {
      const bucket = template.Resources.ApplicationDataBucket;
      
      // Public access blocking
      expect(bucket.Properties.PublicAccessBlockConfiguration).toEqual({
        BlockPublicAcls: true,
        BlockPublicPolicy: true,
        IgnorePublicAcls: true,
        RestrictPublicBuckets: true
      });
      
      // Versioning
      expect(bucket.Properties.VersioningConfiguration.Status).toBe('Enabled');
      
      // Lifecycle policies
      expect(bucket.Properties.LifecycleConfiguration.Rules).toHaveLength(1);
      expect(bucket.Properties.LifecycleConfiguration.Rules[0].NoncurrentVersionExpirationInDays).toBe(90);
    });

    test('should have ApplicationDataBucketPolicy enforcing encryption', () => {
      expect(template.Resources.ApplicationDataBucketPolicy).toBeDefined();
      const policy = template.Resources.ApplicationDataBucketPolicy;
      
      expect(policy.Type).toBe('AWS::S3::BucketPolicy');
      expect(policy.Properties.Bucket).toEqual({ 'Ref': 'ApplicationDataBucket' });
      
      const statements = policy.Properties.PolicyDocument.Statement;
      expect(statements).toHaveLength(2);
      
      // Deny insecure connections
      const httpsStatement = statements.find((s: any) => s.Sid === 'DenyInsecureConnections');
      expect(httpsStatement.Effect).toBe('Deny');
      expect(httpsStatement.Condition.Bool['aws:SecureTransport']).toBe('false');
      
      // Deny unencrypted uploads
      const encryptionStatement = statements.find((s: any) => s.Sid === 'DenyUnencryptedObjectUploads');
      expect(encryptionStatement.Effect).toBe('Deny');
      expect(encryptionStatement.Action).toBe('s3:PutObject');
    });

    test('should have LoggingBucket with AES256 encryption', () => {
      expect(template.Resources.LoggingBucket).toBeDefined();
      const bucket = template.Resources.LoggingBucket;
      
      expect(bucket.Type).toBe('AWS::S3::Bucket');
      expect(bucket.Properties.BucketName).toEqual({ 'Fn::Sub': 'saas-logs-${AWS::AccountId}-${Environment}' });
      
      const encryption = bucket.Properties.BucketEncryption.ServerSideEncryptionConfiguration[0];
      expect(encryption.ServerSideEncryptionByDefault.SSEAlgorithm).toBe('AES256');
    });

    test('should have LoggingBucketPolicy for S3 server access logging', () => {
      expect(template.Resources.LoggingBucketPolicy).toBeDefined();
      const policy = template.Resources.LoggingBucketPolicy;
      
      expect(policy.Type).toBe('AWS::S3::BucketPolicy');
      expect(policy.Properties.PolicyDocument.Version).toBe('2012-10-17');
      
      const statement = policy.Properties.PolicyDocument.Statement[0];
      expect(statement.Principal.Service).toBe('logging.s3.amazonaws.com');
      expect(statement.Action).toEqual(['s3:PutObject']);
      expect(statement.Condition.StringEquals['aws:SourceAccount']).toEqual({ 'Ref': 'AWS::AccountId' });
    });
  });

  describe('EBS Encryption Lambda Function', () => {
    test('should have EBSEncryptionLambdaRole with proper permissions', () => {
      expect(template.Resources.EBSEncryptionLambdaRole).toBeDefined();
      const role = template.Resources.EBSEncryptionLambdaRole;
      
      expect(role.Type).toBe('AWS::IAM::Role');
      expect(role.Properties.ManagedPolicyArns).toContain('arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole');
      
      const policy = role.Properties.Policies[0];
      expect(policy.PolicyName).toBe('EnableEBSEncryption');
      expect(policy.PolicyDocument.Statement[0].Action).toEqual([
        'ec2:EnableEbsEncryptionByDefault',
        'ec2:GetEbsEncryptionByDefault',
        'ec2:ModifyEbsDefaultKmsKeyId'
      ]);
    });

    test('should have EBSEncryptionLambda function', () => {
      expect(template.Resources.EBSEncryptionLambda).toBeDefined();
      const lambda = template.Resources.EBSEncryptionLambda;
      
      expect(lambda.Type).toBe('AWS::Lambda::Function');
      expect(lambda.Properties.Runtime).toBe('python3.9');
      expect(lambda.Properties.Handler).toBe('index.handler');
      expect(lambda.Properties.FunctionName).toEqual({ 'Fn::Sub': 'EnableEBSEncryption-${Environment}' });
      expect(lambda.Properties.Timeout).toBe(60);
    });

    test('should have EnableEBSEncryption custom resource', () => {
      expect(template.Resources.EnableEBSEncryption).toBeDefined();
      const resource = template.Resources.EnableEBSEncryption;
      
      expect(resource.Type).toBe('Custom::EnableEBSEncryption');
      expect(resource.Properties.ServiceToken).toEqual({ 'Fn::GetAtt': ['EBSEncryptionLambda', 'Arn'] });
      expect(resource.Properties.KmsKeyId).toEqual({ 'Fn::If': ['UseCustomKMS', { 'Ref': 'KMSKeyArn' }, { 'Ref': 'AWS::NoValue' }] });
    });
  });

  describe('IAM MFA Enforcement Policy', () => {
    test('should have MFAEnforcementPolicy with comprehensive rules', () => {
      expect(template.Resources.MFAEnforcementPolicy).toBeDefined();
      const policy = template.Resources.MFAEnforcementPolicy;
      
      expect(policy.Type).toBe('AWS::IAM::ManagedPolicy');
      expect(policy.Properties.ManagedPolicyName).toEqual({ 'Fn::Sub': 'RequireMFA-${Environment}' });
      expect(policy.Properties.Description).toBe('Enforces MFA for all IAM users');
    });

    test('should have MFA policy statements covering all required scenarios', () => {
      const policy = template.Resources.MFAEnforcementPolicy;
      const statements = policy.Properties.PolicyDocument.Statement;
      
      expect(statements).toHaveLength(4);
      
      // Check view account info statement
      const viewStatement = statements.find((s: any) => s.Sid === 'AllowViewAccountInfo');
      expect(viewStatement.Effect).toBe('Allow');
      expect(viewStatement.Action).toContain('iam:GetAccountPasswordPolicy');
      
      // Check manage own MFA statement
      const manageStatement = statements.find((s: any) => s.Sid === 'AllowManageOwnPasswordsAndMFA');
      expect(manageStatement.Effect).toBe('Allow');
      expect(manageStatement.Action).toContain('iam:EnableMFADevice');
      
      // Check deny without MFA statement
      const denyStatement = statements.find((s: any) => s.Sid === 'DenyAllExceptListedIfNoMFA');
      expect(denyStatement.Effect).toBe('Deny');
      expect(denyStatement.Condition.BoolIfExists['aws:MultiFactorAuthPresent']).toBe('false');
      
      // Check deny if MFA too old statement
      const ageStatement = statements.find((s: any) => s.Sid === 'DenyIfMFATooOld');
      expect(ageStatement.Effect).toBe('Deny');
      expect(ageStatement.Condition.NumericGreaterThan['aws:MultiFactorAuthAge']).toEqual({ 'Ref': 'MFAAge' });
    });
  });

  describe('AWS Config Resources', () => {
    test('should have ConfigRecorder with proper configuration', () => {
      expect(template.Resources.ConfigRecorder).toBeDefined();
      const recorder = template.Resources.ConfigRecorder;
      
      expect(recorder.Type).toBe('AWS::Config::ConfigurationRecorder');
      expect(recorder.Properties.Name).toEqual({ 'Fn::Sub': 'EncryptionComplianceRecorder-${Environment}' });
      expect(recorder.Properties.RoleARN).toEqual({ 'Fn::GetAtt': ['ConfigRole', 'Arn'] });
      expect(recorder.Properties.RecordingGroup.AllSupported).toBe(true);
      expect(recorder.Properties.RecordingGroup.IncludeGlobalResourceTypes).toBe(true);
    });

    test('should have ConfigDeliveryChannel', () => {
      expect(template.Resources.ConfigDeliveryChannel).toBeDefined();
      const channel = template.Resources.ConfigDeliveryChannel;
      
      expect(channel.Type).toBe('AWS::Config::DeliveryChannel');
      expect(channel.Properties.S3BucketName).toEqual({ 'Ref': 'ConfigBucket' });
      expect(channel.Properties.SnsTopicARN).toEqual({ 'Ref': 'ConfigSNSTopic' });
      expect(channel.Properties.ConfigSnapshotDeliveryProperties.DeliveryFrequency).toBe('TwentyFour_Hours');
    });

    test('should have ConfigBucket with encryption and lifecycle', () => {
      expect(template.Resources.ConfigBucket).toBeDefined();
      const bucket = template.Resources.ConfigBucket;
      
      expect(bucket.Type).toBe('AWS::S3::Bucket');
      expect(bucket.Properties.BucketName).toEqual({ 'Fn::Sub': 'config-bucket-${AWS::AccountId}-${Environment}' });
      
      // Check encryption
      expect(bucket.Properties.BucketEncryption.ServerSideEncryptionConfiguration[0].ServerSideEncryptionByDefault.SSEAlgorithm).toBe('AES256');
      
      // Check lifecycle - 7 years retention
      expect(bucket.Properties.LifecycleConfiguration.Rules[0].ExpirationInDays).toBe(2555);
    });

    test('should have ConfigRole with comprehensive permissions', () => {
      expect(template.Resources.ConfigRole).toBeDefined();
      const role = template.Resources.ConfigRole;
      
      expect(role.Type).toBe('AWS::IAM::Role');
      expect(role.Properties.AssumeRolePolicyDocument.Statement[0].Principal.Service).toBe('config.amazonaws.com');
      
      const policy = role.Properties.Policies[0];
      expect(policy.PolicyName).toBe('ConfigServiceRolePolicy');
      expect(policy.PolicyDocument.Statement[0].Action).toContain('config:Put*');
      expect(policy.PolicyDocument.Statement[0].Action).toContain('s3:PutObject');
    });
  });

  describe('AWS Config Rules for Compliance', () => {
    const configRules = [
      'S3BucketSSLRequestsOnly',
      'S3BucketServerSideEncryption',
      'S3DefaultEncryptionKMS',
      'EncryptedVolumes',
      'EC2EBSEncryptionByDefault',
      'RDSStorageEncrypted',
      'EFSEncryptedCheck',
      'IAMUserMFAEnabled',
      'RootAccountMFAEnabled'
    ];

    configRules.forEach(ruleName => {
      test(`should have ${ruleName} Config rule`, () => {
        expect(template.Resources[ruleName]).toBeDefined();
        const rule = template.Resources[ruleName];
        
        expect(rule.Type).toBe('AWS::Config::ConfigRule');
        expect(rule.DependsOn).toBe('ConfigRecorder');
        expect(rule.Properties.Source.Owner).toBe('AWS');
        expect(rule.Properties.Description).toBeDefined();
      });
    });

    test('should have S3BucketSSLRequestsOnly with correct source identifier', () => {
      const rule = template.Resources.S3BucketSSLRequestsOnly;
      expect(rule.Properties.Source.SourceIdentifier).toBe('S3_BUCKET_SSL_REQUESTS_ONLY');
    });

    test('should have EC2EBSEncryptionByDefault with correct source identifier', () => {
      const rule = template.Resources.EC2EBSEncryptionByDefault;
      expect(rule.Properties.Source.SourceIdentifier).toBe('EC2_EBS_ENCRYPTION_BY_DEFAULT');
    });

    test('should have IAMUserMFAEnabled with correct source identifier', () => {
      const rule = template.Resources.IAMUserMFAEnabled;
      expect(rule.Properties.Source.SourceIdentifier).toBe('IAM_USER_MFA_ENABLED');
    });
  });

  describe('Conformance Pack', () => {
    test('should have EncryptionConformancePack', () => {
      expect(template.Resources.EncryptionConformancePack).toBeDefined();
      const pack = template.Resources.EncryptionConformancePack;
      
      expect(pack.Type).toBe('AWS::Config::ConformancePack');
      expect(pack.DependsOn).toEqual(['ConfigRecorder', 'ConfigDeliveryChannel']);
      expect(pack.Properties.ConformancePackName).toEqual({ 'Fn::Sub': 'encryption-compliance-pack-${Environment}' });
      expect(pack.Properties.TemplateBody).toBeDefined();
    });
  });

  describe('Outputs Validation', () => {
    test('should have all required outputs', () => {
      const expectedOutputs = [
        'ApplicationDataBucketName',
        'LoggingBucketName', 
        'KMSKeyId',
        'MFAPolicyArn',
        'ConfigRecorderName',
        'ComplianceStatus'
      ];

      expectedOutputs.forEach(outputName => {
        expect(template.Outputs[outputName]).toBeDefined();
      });
    });

    test('should have ApplicationDataBucketName output with export', () => {
      const output = template.Outputs.ApplicationDataBucketName;
      expect(output.Description).toBe('Name of the encrypted application data bucket');
      expect(output.Value).toEqual({ 'Ref': 'ApplicationDataBucket' });
      expect(output.Export.Name).toEqual({ 'Fn::Sub': '${AWS::StackName}-AppBucket' });
    });

    test('should have KMSKeyId output with conditional value', () => {
      const output = template.Outputs.KMSKeyId;
      expect(output.Description).toBe('KMS Key ID for encryption');
      expect(output.Value).toEqual({ 'Fn::If': ['UseCustomKMS', { 'Ref': 'KMSKeyArn' }, { 'Ref': 'EncryptionKey' }] });
    });

    test('should have ComplianceStatus output with Config console URL', () => {
      const output = template.Outputs.ComplianceStatus;
      expect(output.Description).toBe('Check Config Rules dashboard for compliance status');
      expect(output.Value).toEqual({ 'Fn::Sub': 'https://console.aws.amazon.com/config/home?region=${AWS::Region}#/rules' });
    });
  });

  describe('Resource Count and Structure Validation', () => {
    test('should have correct number of resources', () => {
      const resourceCount = Object.keys(template.Resources).length;
      expect(resourceCount).toBe(26); // All encryption, MFA, and Config resources
    });

    test('should have correct number of parameters', () => {
      const parameterCount = Object.keys(template.Parameters).length;
      expect(parameterCount).toBe(3); // Environment, MFAAge, KMSKeyArn
    });

    test('should have correct number of conditions', () => {
      const conditionCount = Object.keys(template.Conditions).length;
      expect(conditionCount).toBe(2); // UseCustomKMS, UseDefaultKMS
    });

    test('should have correct number of outputs', () => {
      const outputCount = Object.keys(template.Outputs).length;
      expect(outputCount).toBe(6);
    });
  });

  describe('Security and Compliance Validation', () => {
    test('all S3 buckets should have encryption configured', () => {
      const s3Buckets = ['ApplicationDataBucket', 'LoggingBucket', 'ConfigBucket'];
      
      s3Buckets.forEach(bucketName => {
        const bucket = template.Resources[bucketName];
        expect(bucket.Properties.BucketEncryption).toBeDefined();
        expect(bucket.Properties.BucketEncryption.ServerSideEncryptionConfiguration).toBeDefined();
      });
    });

    test('all S3 buckets should block public access', () => {
      const s3Buckets = ['ApplicationDataBucket', 'LoggingBucket', 'ConfigBucket'];
      
      s3Buckets.forEach(bucketName => {
        const bucket = template.Resources[bucketName];
        const publicAccess = bucket.Properties.PublicAccessBlockConfiguration;
        
        expect(publicAccess.BlockPublicAcls).toBe(true);
        expect(publicAccess.BlockPublicPolicy).toBe(true);
        expect(publicAccess.IgnorePublicAcls).toBe(true);
        expect(publicAccess.RestrictPublicBuckets).toBe(true);
      });
    });

    test('KMS key should have key rotation enabled', () => {
      const key = template.Resources.EncryptionKey;
      expect(key.Properties.EnableKeyRotation).toBe(true);
    });

    test('Config SNS topic should be encrypted', () => {
      const topic = template.Resources.ConfigSNSTopic;
      expect(topic.Properties.KmsMasterKeyId).toEqual({ 'Fn::If': ['UseCustomKMS', { 'Ref': 'KMSKeyArn' }, { 'Ref': 'EncryptionKey' }] });
    });
  });

  describe('Template Naming Conventions', () => {
    test('all resources should follow consistent naming patterns', () => {
      const resourcesWithEnvironmentNaming = [
        'EBSEncryptionLambda',
        'MFAEnforcementPolicy',
        'ConfigRecorder',
        'ConfigDeliveryChannel',
        'EncryptionConformancePack'
      ];
      
      resourcesWithEnvironmentNaming.forEach(resourceName => {
        const resource = template.Resources[resourceName];
        const nameProperty = resource.Properties.FunctionName || 
                            resource.Properties.ManagedPolicyName || 
                            resource.Properties.Name ||
                            resource.Properties.ConformancePackName;
        
        expect(nameProperty).toBeDefined();
        expect(JSON.stringify(nameProperty)).toContain('${Environment}');
      });
    });

    test('all bucket names should include AccountId and Environment', () => {
      const bucketResources = ['ApplicationDataBucket', 'LoggingBucket', 'ConfigBucket'];
      
      bucketResources.forEach(bucketName => {
        const bucket = template.Resources[bucketName];
        const bucketNameSub = bucket.Properties.BucketName;
        
        expect(bucketNameSub['Fn::Sub']).toContain('${AWS::AccountId}');
        expect(bucketNameSub['Fn::Sub']).toContain('${Environment}');
      });
    });
  });
});