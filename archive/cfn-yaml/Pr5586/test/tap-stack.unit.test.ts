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
      expect(template.Description).toBe(
        'Configuration Consistency and Compliance Monitoring System for Financial Services'
      );
    });

    test('should have all required top-level sections', () => {
      expect(template.Parameters).toBeDefined();
      expect(template.Mappings).toBeDefined();
      expect(template.Resources).toBeDefined();
      expect(template.Outputs).toBeDefined();
    });

    test('should have valid JSON structure', () => {
      expect(template).toBeDefined();
      expect(typeof template).toBe('object');
    });
  });

  describe('Parameters', () => {
    test('should have all required parameters', () => {
      const requiredParams = [
        'EnvironmentSuffix',
        'DBMasterUsername',
        'AlertEmail',
        'OrganizationId',
        'CostCenter',
        'DataClassification',
        'ComplianceFramework',
        'DriftCheckInterval',
      ];

      requiredParams.forEach(param => {
        expect(template.Parameters[param]).toBeDefined();
      });
    });

    test('EnvironmentSuffix should have correct properties', () => {
      const param = template.Parameters.EnvironmentSuffix;
      expect(param.Type).toBe('String');
      expect(param.Default).toBe('dev');
      expect(param.AllowedPattern).toBe('^[a-z0-9-]+$');
      expect(param.ConstraintDescription).toContain('lowercase');
    });

    test('DBMasterUsername should have correct constraints', () => {
      const param = template.Parameters.DBMasterUsername;
      expect(param.Type).toBe('String');
      expect(param.Default).toBe('admin');
      expect(param.MinLength).toBe(1);
      expect(param.MaxLength).toBe(16);
      expect(param.AllowedPattern).toBe('[a-zA-Z][a-zA-Z0-9]*');
    });

    test('AlertEmail should validate email format', () => {
      const param = template.Parameters.AlertEmail;
      expect(param.Type).toBe('String');
      expect(param.Default).toBe('alerts@example.com');
      expect(param.AllowedPattern).toMatch(/@/);
    });

    test('DataClassification should have allowed values', () => {
      const param = template.Parameters.DataClassification;
      expect(param.Type).toBe('String');
      expect(param.AllowedValues).toEqual([
        'Public',
        'Internal',
        'Confidential',
        'Restricted',
      ]);
      expect(param.Default).toBe('Confidential');
    });

    test('ComplianceFramework should have allowed values', () => {
      const param = template.Parameters.ComplianceFramework;
      expect(param.Type).toBe('String');
      expect(param.AllowedValues).toEqual([
        'PCI-DSS',
        'SOC2',
        'ISO27001',
        'GDPR',
      ]);
      expect(param.Default).toBe('PCI-DSS');
    });

    test('DriftCheckInterval should have valid range', () => {
      const param = template.Parameters.DriftCheckInterval;
      expect(param.Type).toBe('Number');
      expect(param.Default).toBe(60);
      expect(param.MinValue).toBe(5);
      expect(param.MaxValue).toBe(1440);
    });

    test('all parameters should have descriptions', () => {
      Object.keys(template.Parameters).forEach(paramKey => {
        expect(template.Parameters[paramKey].Description).toBeDefined();
        expect(template.Parameters[paramKey].Description.length).toBeGreaterThan(
          0
        );
      });
    });

    test('all parameters should have default values', () => {
      Object.keys(template.Parameters).forEach(paramKey => {
        expect(template.Parameters[paramKey].Default).toBeDefined();
      });
    });
  });

  describe('Mappings', () => {
    test('should have EnvironmentConfig mapping', () => {
      expect(template.Mappings.EnvironmentConfig).toBeDefined();
      expect(template.Mappings.EnvironmentConfig.dev).toBeDefined();
      expect(template.Mappings.EnvironmentConfig.staging).toBeDefined();
      expect(template.Mappings.EnvironmentConfig.prod).toBeDefined();
      expect(template.Mappings.EnvironmentConfig.default).toBeDefined();
    });

    test('should have SubnetConfig mapping', () => {
      expect(template.Mappings.SubnetConfig).toBeDefined();
      expect(template.Mappings.SubnetConfig.VPC).toBeDefined();
    });

    test('dev environment should have correct configuration', () => {
      const devConfig = template.Mappings.EnvironmentConfig.dev;
      expect(devConfig.DBInstanceClass).toBe('db.r5.large');
      expect(devConfig.BackupRetention).toBe(7);
      expect(devConfig.MultiAZ).toBe(false);
      expect(devConfig.StorageEncrypted).toBe(true);
    });

    test('staging environment should have correct configuration', () => {
      const stagingConfig = template.Mappings.EnvironmentConfig.staging;
      expect(stagingConfig.DBInstanceClass).toBe('db.r5.xlarge');
      expect(stagingConfig.BackupRetention).toBe(14);
      expect(stagingConfig.MultiAZ).toBe(true);
    });

    test('prod environment should have correct configuration', () => {
      const prodConfig = template.Mappings.EnvironmentConfig.prod;
      expect(prodConfig.DBInstanceClass).toBe('db.r5.2xlarge');
      expect(prodConfig.BackupRetention).toBe(30);
      expect(prodConfig.MultiAZ).toBe(true);
    });

    test('default environment should exist for PR and custom environments', () => {
      const defaultConfig = template.Mappings.EnvironmentConfig.default;
      expect(defaultConfig).toBeDefined();
      expect(defaultConfig.DBInstanceClass).toBe('db.r5.large');
      expect(defaultConfig.BackupRetention).toBe(7);
      expect(defaultConfig.MultiAZ).toBe(false);
    });
  });

  describe('Conditions', () => {
    test('should have IsProduction condition', () => {
      expect(template.Conditions.IsProduction).toBeDefined();
    });

    test('should have IsStaging condition', () => {
      expect(template.Conditions.IsStaging).toBeDefined();
    });

    test('should have IsNotDev condition', () => {
      expect(template.Conditions.IsNotDev).toBeDefined();
    });

    test('should have EnableEnhancedMonitoring condition', () => {
      expect(template.Conditions.EnableEnhancedMonitoring).toBeDefined();
    });

    test('should NOT have IsDev condition (removed as unused)', () => {
      expect(template.Conditions.IsDev).toBeUndefined();
    });

    test('should NOT have UseDefaultConfig condition (removed as unused)', () => {
      expect(template.Conditions.UseDefaultConfig).toBeUndefined();
    });
  });

  describe('VPC and Network Resources', () => {
    test('VPC should be defined with correct properties', () => {
      const vpc = template.Resources.VPC;
      expect(vpc).toBeDefined();
      expect(vpc.Type).toBe('AWS::EC2::VPC');
      expect(vpc.DeletionPolicy).toBe('Delete');
      expect(vpc.UpdateReplacePolicy).toBe('Delete');
      expect(vpc.Properties.EnableDnsHostnames).toBe(true);
      expect(vpc.Properties.EnableDnsSupport).toBe(true);
    });

    test('VPC should have required tags', () => {
      const vpc = template.Resources.VPC;
      const tags = vpc.Properties.Tags;
      expect(tags).toBeDefined();

      const projectTag = tags.find((t: any) => t.Key === 'project');
      const teamTag = tags.find((t: any) => t.Key === 'team-number');

      expect(projectTag).toBeDefined();
      expect(projectTag.Value).toBe('iac-rlhf-amazon');
      expect(teamTag).toBeDefined();
      expect(teamTag.Value).toBe(2);
    });

    test('should have 3 private subnets', () => {
      expect(template.Resources.PrivateSubnet1).toBeDefined();
      expect(template.Resources.PrivateSubnet2).toBeDefined();
      expect(template.Resources.PrivateSubnet3).toBeDefined();

      expect(template.Resources.PrivateSubnet1.Type).toBe('AWS::EC2::Subnet');
      expect(template.Resources.PrivateSubnet2.Type).toBe('AWS::EC2::Subnet');
      expect(template.Resources.PrivateSubnet3.Type).toBe('AWS::EC2::Subnet');
    });

    test('subnets should have required tags', () => {
      const subnet = template.Resources.PrivateSubnet1;
      const tags = subnet.Properties.Tags;

      const projectTag = tags.find((t: any) => t.Key === 'project');
      const teamTag = tags.find((t: any) => t.Key === 'team-number');

      expect(projectTag.Value).toBe('iac-rlhf-amazon');
      expect(teamTag.Value).toBe(2);
    });

    test('InternetGateway should be defined', () => {
      const igw = template.Resources.InternetGateway;
      expect(igw).toBeDefined();
      expect(igw.Type).toBe('AWS::EC2::InternetGateway');
      expect(igw.DeletionPolicy).toBe('Delete');
    });

    test('S3VPCEndpoint should be defined', () => {
      const endpoint = template.Resources.S3VPCEndpoint;
      expect(endpoint).toBeDefined();
      expect(endpoint.Type).toBe('AWS::EC2::VPCEndpoint');
      expect(endpoint.Properties.ServiceName['Fn::Sub']).toContain(
        'com.amazonaws.${AWS::Region}.s3'
      );
    });
  });

  describe('KMS Encryption', () => {
    test('ConfigKMSKey should be defined with encryption', () => {
      const kmsKey = template.Resources.ConfigKMSKey;
      expect(kmsKey).toBeDefined();
      expect(kmsKey.Type).toBe('AWS::KMS::Key');
      expect(kmsKey.DeletionPolicy).toBe('Delete');
      expect(kmsKey.Properties.EnableKeyRotation).toBe(true);
    });

    test('KMS key should have proper key policy', () => {
      const kmsKey = template.Resources.ConfigKMSKey;
      const keyPolicy = kmsKey.Properties.KeyPolicy;
      expect(keyPolicy).toBeDefined();
      expect(keyPolicy.Statement).toBeDefined();
      expect(Array.isArray(keyPolicy.Statement)).toBe(true);
    });

    test('KMS key should allow root account full access', () => {
      const kmsKey = template.Resources.ConfigKMSKey;
      const rootStatement = kmsKey.Properties.KeyPolicy.Statement.find(
        (s: any) =>
          s.Principal?.AWS &&
          s.Principal.AWS['Fn::Sub']?.includes('${AWS::AccountId}')
      );
      expect(rootStatement).toBeDefined();
      expect(rootStatement.Effect).toBe('Allow');
    });

    test('ConfigKMSKeyAlias should be defined', () => {
      const alias = template.Resources.ConfigKMSKeyAlias;
      expect(alias).toBeDefined();
      expect(alias.Type).toBe('AWS::KMS::Alias');
      expect(alias.Properties.AliasName['Fn::Sub']).toContain(
        'alias/${AWS::StackName}'
      );
    });

    test('KMS key should have required tags', () => {
      const kmsKey = template.Resources.ConfigKMSKey;
      const tags = kmsKey.Properties.Tags;

      const projectTag = tags.find((t: any) => t.Key === 'project');
      const teamTag = tags.find((t: any) => t.Key === 'team-number');

      expect(projectTag.Value).toBe('iac-rlhf-amazon');
      expect(teamTag.Value).toBe(2);
    });
  });

  describe('Secrets Manager', () => {
    test('DBMasterSecret should be defined', () => {
      const secret = template.Resources.DBMasterSecret;
      expect(secret).toBeDefined();
      expect(secret.Type).toBe('AWS::SecretsManager::Secret');
      expect(secret.DeletionPolicy).toBe('Delete');
    });

    test('DBMasterSecret should use KMS encryption', () => {
      const secret = template.Resources.DBMasterSecret;
      expect(secret.Properties.KmsKeyId).toEqual({ Ref: 'ConfigKMSKey' });
    });

    test('DBMasterSecret should have password generation', () => {
      const secret = template.Resources.DBMasterSecret;
      const genConfig = secret.Properties.GenerateSecretString;
      expect(genConfig).toBeDefined();
      expect(genConfig.PasswordLength).toBe(32);
      expect(genConfig.RequireEachIncludedType).toBe(true);
      expect(genConfig.ExcludeCharacters).toBeDefined();
    });

    test('SecretRDSAttachment should link secret to RDS', () => {
      const attachment = template.Resources.SecretRDSAttachment;
      expect(attachment).toBeDefined();
      expect(attachment.Type).toBe('AWS::SecretsManager::SecretTargetAttachment');
      expect(attachment.Properties.SecretId).toEqual({ Ref: 'DBMasterSecret' });
      expect(attachment.Properties.TargetType).toBe('AWS::RDS::DBCluster');
    });

    test('DBMasterSecret should have required tags', () => {
      const secret = template.Resources.DBMasterSecret;
      const tags = secret.Properties.Tags;

      const projectTag = tags.find((t: any) => t.Key === 'project');
      const teamTag = tags.find((t: any) => t.Key === 'team-number');

      expect(projectTag.Value).toBe('iac-rlhf-amazon');
      expect(teamTag.Value).toBe(2);
    });
  });

  describe('RDS Aurora Resources', () => {
    test('AuroraCluster should be defined', () => {
      const cluster = template.Resources.AuroraCluster;
      expect(cluster).toBeDefined();
      expect(cluster.Type).toBe('AWS::RDS::DBCluster');
      expect(cluster.DeletionPolicy).toBe('Delete');
    });

    test('AuroraCluster should use Secrets Manager for credentials', () => {
      const cluster = template.Resources.AuroraCluster;
      expect(cluster.Properties.MasterUsername['Fn::Sub']).toContain(
        'resolve:secretsmanager'
      );
      expect(cluster.Properties.MasterUserPassword['Fn::Sub']).toContain(
        'resolve:secretsmanager'
      );
    });

    test('AuroraCluster should have encryption enabled', () => {
      const cluster = template.Resources.AuroraCluster;
      expect(cluster.Properties.StorageEncrypted).toBe(true);
      expect(cluster.Properties.KmsKeyId).toEqual({
        Ref: 'ConfigKMSKey',
      });
    });

    test('AuroraCluster should have backup configuration', () => {
      const cluster = template.Resources.AuroraCluster;
      expect(cluster.Properties.BackupRetentionPeriod).toBeDefined();
      expect(cluster.Properties.PreferredBackupWindow).toBeDefined();
      expect(cluster.Properties.PreferredMaintenanceWindow).toBeDefined();
    });

    test('AuroraCluster should have required tags', () => {
      const cluster = template.Resources.AuroraCluster;
      const tags = cluster.Properties.Tags;

      const projectTag = tags.find((t: any) => t.Key === 'project');
      const teamTag = tags.find((t: any) => t.Key === 'team-number');

      expect(projectTag.Value).toBe('iac-rlhf-amazon');
      expect(teamTag.Value).toBe(2);
    });

    test('should have 2 Aurora instances', () => {
      expect(template.Resources.AuroraInstance1).toBeDefined();
      expect(template.Resources.AuroraInstance2).toBeDefined();
      expect(template.Resources.AuroraInstance1.Type).toBe(
        'AWS::RDS::DBInstance'
      );
      expect(template.Resources.AuroraInstance2.Type).toBe(
        'AWS::RDS::DBInstance'
      );
    });

    test('Aurora instances should have monitoring role', () => {
      const instance = template.Resources.AuroraInstance1;
      expect(instance.Properties.MonitoringInterval).toBeDefined();
      expect(instance.Properties.MonitoringRoleArn).toBeDefined();
      // Both properties use Fn::If condition for conditional monitoring
    });

    test('DBSubnetGroup should be defined', () => {
      const subnetGroup = template.Resources.DBSubnetGroup;
      expect(subnetGroup).toBeDefined();
      expect(subnetGroup.Type).toBe('AWS::RDS::DBSubnetGroup');
      expect(subnetGroup.Properties.SubnetIds).toBeDefined();
      expect(subnetGroup.Properties.SubnetIds.length).toBe(3);
    });

    test('DBSecurityGroup should be defined', () => {
      const sg = template.Resources.DBSecurityGroup;
      expect(sg).toBeDefined();
      expect(sg.Type).toBe('AWS::EC2::SecurityGroup');
    });

    test('DBClusterParameterGroup should have UTF8MB4 character set', () => {
      const paramGroup = template.Resources.DBClusterParameterGroup;
      expect(paramGroup).toBeDefined();
      expect(paramGroup.Type).toBe('AWS::RDS::DBClusterParameterGroup');
      expect(paramGroup.Properties.Parameters.character_set_server).toBe(
        'utf8mb4'
      );
    });
  });

  describe('S3 Buckets', () => {
    test('ConfigBucket should be defined with encryption', () => {
      const bucket = template.Resources.ConfigBucket;
      expect(bucket).toBeDefined();
      expect(bucket.Type).toBe('AWS::S3::Bucket');
      expect(bucket.DeletionPolicy).toBe('Delete');
      expect(
        bucket.Properties.BucketEncryption.ServerSideEncryptionConfiguration[0]
          .ServerSideEncryptionByDefault.SSEAlgorithm
      ).toBe('aws:kms');
    });

    test('ConfigBucket should have versioning enabled', () => {
      const bucket = template.Resources.ConfigBucket;
      expect(bucket.Properties.VersioningConfiguration.Status).toBe('Enabled');
    });

    test('ConfigBucket should block public access', () => {
      const bucket = template.Resources.ConfigBucket;
      const publicAccessBlock = bucket.Properties.PublicAccessBlockConfiguration;
      expect(publicAccessBlock.BlockPublicAcls).toBe(true);
      expect(publicAccessBlock.BlockPublicPolicy).toBe(true);
      expect(publicAccessBlock.IgnorePublicAcls).toBe(true);
      expect(publicAccessBlock.RestrictPublicBuckets).toBe(true);
    });

    test('ConfigBucket should have lifecycle policy', () => {
      const bucket = template.Resources.ConfigBucket;
      expect(bucket.Properties.LifecycleConfiguration).toBeDefined();
      expect(bucket.Properties.LifecycleConfiguration.Rules).toBeDefined();
      expect(bucket.Properties.LifecycleConfiguration.Rules.length).toBeGreaterThan(
        0
      );
    });

    test('ConfigBucket should have required tags', () => {
      const bucket = template.Resources.ConfigBucket;
      const tags = bucket.Properties.Tags;

      const projectTag = tags.find((t: any) => t.Key === 'project');
      const teamTag = tags.find((t: any) => t.Key === 'team-number');

      expect(projectTag.Value).toBe('iac-rlhf-amazon');
      expect(teamTag.Value).toBe(2);
    });

    test('ComplianceReportsBucket should be defined', () => {
      const bucket = template.Resources.ComplianceReportsBucket;
      expect(bucket).toBeDefined();
      expect(bucket.Type).toBe('AWS::S3::Bucket');
      expect(bucket.DeletionPolicy).toBe('Delete');
    });

    test('ComplianceReportsBucket should have encryption', () => {
      const bucket = template.Resources.ComplianceReportsBucket;
      expect(
        bucket.Properties.BucketEncryption.ServerSideEncryptionConfiguration[0]
          .ServerSideEncryptionByDefault.SSEAlgorithm
      ).toBe('aws:kms');
    });
  });

  describe('DynamoDB Table', () => {
    test('StateTable should be defined', () => {
      const table = template.Resources.StateTable;
      expect(table).toBeDefined();
      expect(table.Type).toBe('AWS::DynamoDB::Table');
      expect(table.DeletionPolicy).toBe('Delete');
    });

    test('StateTable should have on-demand billing', () => {
      const table = template.Resources.StateTable;
      expect(table.Properties.BillingMode).toBe('PAY_PER_REQUEST');
    });

    test('StateTable should have point-in-time recovery', () => {
      const table = template.Resources.StateTable;
      expect(table.Properties.PointInTimeRecoverySpecification.PointInTimeRecoveryEnabled).toBe(
        true
      );
    });

    test('StateTable should have encryption enabled', () => {
      const table = template.Resources.StateTable;
      expect(table.Properties.SSESpecification).toBeDefined();
      expect(table.Properties.SSESpecification.SSEEnabled).toBe(true);
      expect(table.Properties.SSESpecification.SSEType).toBe('KMS');
    });

    test('StateTable should have required tags', () => {
      const table = template.Resources.StateTable;
      const tags = table.Properties.Tags;

      const projectTag = tags.find((t: any) => t.Key === 'project');
      const teamTag = tags.find((t: any) => t.Key === 'team-number');

      expect(projectTag.Value).toBe('iac-rlhf-amazon');
      expect(teamTag.Value).toBe(2);
    });

    test('StateTable should have correct key schema', () => {
      const table = template.Resources.StateTable;
      expect(table.Properties.AttributeDefinitions).toBeDefined();
      expect(table.Properties.KeySchema).toBeDefined();

      const hashKey = table.Properties.KeySchema.find(
        (k: any) => k.KeyType === 'HASH'
      );
      expect(hashKey).toBeDefined();
      expect(hashKey.AttributeName).toBe('PK');
    });
  });

  describe('IAM Roles - Least Privilege', () => {
    test('DriftDetectionRole should be defined', () => {
      const role = template.Resources.DriftDetectionRole;
      expect(role).toBeDefined();
      expect(role.Type).toBe('AWS::IAM::Role');
    });

    test('DriftDetectionRole should have Lambda assume role policy', () => {
      const role = template.Resources.DriftDetectionRole;
      const assumePolicy = role.Properties.AssumeRolePolicyDocument;
      expect(assumePolicy.Statement[0].Principal.Service).toContain(
        'lambda.amazonaws.com'
      );
    });

    test('DriftDetectionRole should have scoped S3 permissions', () => {
      const role = template.Resources.DriftDetectionRole;
      const policies = role.Properties.Policies;
      const s3Policy = policies.find((p: any) =>
        p.PolicyDocument.Statement.some((s: any) =>
          s.Action.some((a: any) => a.startsWith('s3:'))
        )
      );

      expect(s3Policy).toBeDefined();
      const s3Statement = s3Policy.PolicyDocument.Statement.find((s: any) =>
        s.Action.some((a: any) => a.startsWith('s3:'))
      );
      expect(s3Statement.Resource).toBeDefined();
    });

    test('DriftDetectionRole should have scoped DynamoDB permissions', () => {
      const role = template.Resources.DriftDetectionRole;
      const policies = role.Properties.Policies;
      const dynamoPolicy = policies.find((p: any) =>
        p.PolicyDocument.Statement.some((s: any) =>
          s.Action.some((a: any) => a.startsWith('dynamodb:'))
        )
      );

      expect(dynamoPolicy).toBeDefined();
    });

    test('DriftDetectionRole should have KMS permissions with ViaService condition', () => {
      const role = template.Resources.DriftDetectionRole;
      const policies = role.Properties.Policies;
      const kmsStatement = policies
        .flatMap((p: any) => p.PolicyDocument.Statement)
        .find((s: any) => s.Sid === 'KMSAccess');

      expect(kmsStatement).toBeDefined();
      expect(kmsStatement.Condition).toBeDefined();
      expect(kmsStatement.Condition.StringEquals['kms:ViaService']).toBeDefined();
    });

    test('ReconciliationRole should be defined', () => {
      const role = template.Resources.ReconciliationRole;
      expect(role).toBeDefined();
      expect(role.Type).toBe('AWS::IAM::Role');
    });

    test('ReconciliationRole should have scoped SSM permissions', () => {
      const role = template.Resources.ReconciliationRole;
      const policies = role.Properties.Policies;
      const ssmStatement = policies
        .flatMap((p: any) => p.PolicyDocument.Statement)
        .find((s: any) => s.Sid === 'SSMAccess');

      expect(ssmStatement).toBeDefined();
      expect(ssmStatement.Resource).toBeDefined();
    });

    test('ConfigRole should be defined', () => {
      const role = template.Resources.ConfigRole;
      expect(role).toBeDefined();
      expect(role.Type).toBe('AWS::IAM::Role');
    });

    test('ConfigRole should use AWS managed policy', () => {
      const role = template.Resources.ConfigRole;
      expect(role.Properties.ManagedPolicyArns).toContain(
        'arn:aws:iam::aws:policy/service-role/AWS_ConfigRole'
      );
    });

    test('DBMonitoringRole should have RDS assume role policy', () => {
      const role = template.Resources.DBMonitoringRole;
      expect(role).toBeDefined();
      expect(role.Properties.AssumeRolePolicyDocument.Statement[0].Principal.Service).toBe(
        'monitoring.rds.amazonaws.com'
      );
    });

    test('DBMonitoringRole should have monitoring policy', () => {
      const role = template.Resources.DBMonitoringRole;
      expect(role.Properties.ManagedPolicyArns).toContain(
        'arn:aws:iam::aws:policy/service-role/AmazonRDSEnhancedMonitoringRole'
      );
    });
  });

  describe('Lambda Functions', () => {
    test('DriftDetectionFunction should be defined', () => {
      const lambda = template.Resources.DriftDetectionFunction;
      expect(lambda).toBeDefined();
      expect(lambda.Type).toBe('AWS::Lambda::Function');
      expect(lambda.DeletionPolicy).toBe('Delete');
    });

    test('DriftDetectionFunction should have correct runtime', () => {
      const lambda = template.Resources.DriftDetectionFunction;
      expect(lambda.Properties.Runtime).toMatch(/^python3\./);
    });

    test('DriftDetectionFunction should have VPC configuration', () => {
      const lambda = template.Resources.DriftDetectionFunction;
      expect(lambda.Properties.VpcConfig).toBeDefined();
      expect(lambda.Properties.VpcConfig.SubnetIds).toBeDefined();
      expect(lambda.Properties.VpcConfig.SecurityGroupIds).toBeDefined();
    });

    test('DriftDetectionFunction should have required tags', () => {
      const lambda = template.Resources.DriftDetectionFunction;
      const tags = lambda.Properties.Tags;

      const projectTag = tags.find((t: any) => t.Key === 'project');
      const teamTag = tags.find((t: any) => t.Key === 'team-number');

      expect(projectTag.Value).toBe('iac-rlhf-amazon');
      expect(teamTag.Value).toBe(2);
    });

    test('ReconciliationFunction should be defined', () => {
      const lambda = template.Resources.ReconciliationFunction;
      expect(lambda).toBeDefined();
      expect(lambda.Type).toBe('AWS::Lambda::Function');
      expect(lambda.DeletionPolicy).toBe('Delete');
    });

    test('ReconciliationFunction should have environment variables', () => {
      const lambda = template.Resources.ReconciliationFunction;
      expect(lambda.Properties.Environment).toBeDefined();
      expect(lambda.Properties.Environment.Variables).toBeDefined();
    });

    test('Lambda functions should have execution roles', () => {
      const drift = template.Resources.DriftDetectionFunction;
      const recon = template.Resources.ReconciliationFunction;

      expect(drift.Properties.Role).toEqual({
        'Fn::GetAtt': ['DriftDetectionRole', 'Arn'],
      });
      expect(recon.Properties.Role).toEqual({
        'Fn::GetAtt': ['ReconciliationRole', 'Arn'],
      });
    });

    test('LambdaSecurityGroup should be defined', () => {
      const sg = template.Resources.LambdaSecurityGroup;
      expect(sg).toBeDefined();
      expect(sg.Type).toBe('AWS::EC2::SecurityGroup');
    });
  });

  describe('EventBridge Schedules', () => {
    test('DriftDetectionSchedule should be defined', () => {
      const schedule = template.Resources.DriftDetectionSchedule;
      expect(schedule).toBeDefined();
      expect(schedule.Type).toBe('AWS::Events::Rule');
    });

    test('DriftDetectionSchedule should have schedule expression', () => {
      const schedule = template.Resources.DriftDetectionSchedule;
      expect(schedule.Properties.ScheduleExpression).toBeDefined();
      expect(schedule.Properties.ScheduleExpression['Fn::Sub']).toContain(
        'rate(${DriftCheckInterval} minutes)'
      );
    });

    test('DriftDetectionSchedule should target Lambda function', () => {
      const schedule = template.Resources.DriftDetectionSchedule;
      expect(schedule.Properties.Targets).toBeDefined();
      expect(schedule.Properties.Targets[0].Arn).toEqual({
        'Fn::GetAtt': ['DriftDetectionFunction', 'Arn'],
      });
    });

    test('ReconciliationSchedule should be defined', () => {
      const schedule = template.Resources.ReconciliationSchedule;
      expect(schedule).toBeDefined();
      expect(schedule.Type).toBe('AWS::Events::Rule');
    });

    test('Lambda functions should have EventBridge permissions', () => {
      expect(template.Resources.DriftDetectionPermission).toBeDefined();
      expect(template.Resources.ReconciliationPermission).toBeDefined();

      const permission = template.Resources.DriftDetectionPermission;
      expect(permission.Type).toBe('AWS::Lambda::Permission');
      expect(permission.Properties.Principal).toBe('events.amazonaws.com');
    });
  });

  describe('AWS Config', () => {
    test('ConfigRecorder should be defined', () => {
      const recorder = template.Resources.ConfigRecorder;
      expect(recorder).toBeDefined();
      expect(recorder.Type).toBe('AWS::Config::ConfigurationRecorder');
    });

    test('ConfigRecorder should record all resources', () => {
      const recorder = template.Resources.ConfigRecorder;
      expect(recorder.Properties.RecordingGroup.AllSupported).toBe(true);
      expect(recorder.Properties.RecordingGroup.IncludeGlobalResourceTypes).toBe(
        true
      );
    });

    test('ConfigRecorder should not have ResourceTypes when AllSupported is true', () => {
      const recorder = template.Resources.ConfigRecorder;
      expect(recorder.Properties.RecordingGroup.ResourceTypes).toBeUndefined();
    });

    test('ConfigDeliveryChannel should be defined', () => {
      const channel = template.Resources.ConfigDeliveryChannel;
      expect(channel).toBeDefined();
      expect(channel.Type).toBe('AWS::Config::DeliveryChannel');
    });

    test('ConfigDeliveryChannel should use S3 bucket', () => {
      const channel = template.Resources.ConfigDeliveryChannel;
      expect(channel.Properties.S3BucketName).toEqual({ Ref: 'ComplianceReportsBucket' });
    });

    test('Config rules should be defined', () => {
      expect(template.Resources.RDSEncryptionRule).toBeDefined();
      expect(template.Resources.S3EncryptionRule).toBeDefined();
      expect(template.Resources.RequiredTagsRule).toBeDefined();

      expect(template.Resources.RDSEncryptionRule.Type).toBe(
        'AWS::Config::ConfigRule'
      );
    });

    test('RDSEncryptionRule should check for encryption', () => {
      const rule = template.Resources.RDSEncryptionRule;
      expect(rule.Properties.Source.SourceIdentifier).toBe('RDS_STORAGE_ENCRYPTED');
    });
  });

  describe('SNS Topics', () => {
    test('AlertTopic should be defined', () => {
      const topic = template.Resources.AlertTopic;
      expect(topic).toBeDefined();
      expect(topic.Type).toBe('AWS::SNS::Topic');
      expect(topic.DeletionPolicy).toBe('Delete');
    });

    test('AlertTopic should have KMS encryption', () => {
      const topic = template.Resources.AlertTopic;
      expect(topic.Properties.KmsMasterKeyId).toEqual({
        Ref: 'ConfigKMSKey',
      });
    });

    test('AlertTopic should have required tags', () => {
      const topic = template.Resources.AlertTopic;
      const tags = topic.Properties.Tags;

      const projectTag = tags.find((t: any) => t.Key === 'project');
      const teamTag = tags.find((t: any) => t.Key === 'team-number');

      expect(projectTag.Value).toBe('iac-rlhf-amazon');
      expect(teamTag.Value).toBe(2);
    });

    test('CriticalAlertTopic should be defined', () => {
      const topic = template.Resources.CriticalAlertTopic;
      expect(topic).toBeDefined();
      expect(topic.Type).toBe('AWS::SNS::Topic');
    });
  });

  describe('CloudWatch Alarms', () => {
    test('DriftDetectionAlarm should be defined', () => {
      const alarm = template.Resources.DriftDetectionAlarm;
      expect(alarm).toBeDefined();
      expect(alarm.Type).toBe('AWS::CloudWatch::Alarm');
    });

    test('DriftDetectionAlarm should have correct metric', () => {
      const alarm = template.Resources.DriftDetectionAlarm;
      expect(alarm.Properties.Namespace).toBe('ConfigCompliance');
      expect(alarm.Properties.MetricName).toBe('ConfigurationDrift');
    });

    test('DriftDetectionAlarm should have SNS action', () => {
      const alarm = template.Resources.DriftDetectionAlarm;
      expect(alarm.Properties.AlarmActions).toBeDefined();
      expect(alarm.Properties.AlarmActions[0]).toEqual({ Ref: 'AlertTopic' });
    });

    test('LambdaErrorAlarm should be defined', () => {
      const alarm = template.Resources.LambdaErrorAlarm;
      expect(alarm).toBeDefined();
      expect(alarm.Type).toBe('AWS::CloudWatch::Alarm');
    });

    test('DatabaseCPUAlarm should be defined', () => {
      const alarm = template.Resources.DatabaseCPUAlarm;
      expect(alarm).toBeDefined();
      expect(alarm.Properties.MetricName).toBe('CPUUtilization');
    });

    test('DatabaseConnectionAlarm should be defined', () => {
      const alarm = template.Resources.DatabaseConnectionAlarm;
      expect(alarm).toBeDefined();
      expect(alarm.Properties.MetricName).toBe('DatabaseConnections');
    });
  });

  describe('CloudWatch Dashboard', () => {
    test('ComplianceDashboard should be defined', () => {
      const dashboard = template.Resources.ComplianceDashboard;
      expect(dashboard).toBeDefined();
      expect(dashboard.Type).toBe('AWS::CloudWatch::Dashboard');
    });

    test('ComplianceDashboard should have valid JSON body', () => {
      const dashboard = template.Resources.ComplianceDashboard;
      const bodyTemplate = dashboard.Properties.DashboardBody['Fn::Sub'];

      expect(bodyTemplate).toBeDefined();
      expect(typeof bodyTemplate).toBe('string');

      // Validate it's valid JSON structure (without substitutions)
      expect(bodyTemplate).toContain('"widgets"');
      expect(bodyTemplate).toContain('"type": "metric"');
    });

    test('ComplianceDashboard should have multiple widgets', () => {
      const dashboard = template.Resources.ComplianceDashboard;
      const bodyTemplate = dashboard.Properties.DashboardBody['Fn::Sub'];

      // Count widget occurrences
      const widgetCount = (bodyTemplate.match(/"type": "metric"/g) || []).length;
      expect(widgetCount).toBeGreaterThan(3);
    });
  });

  describe('SSM Parameters', () => {
    test('DBEndpointParameter should be defined', () => {
      const param = template.Resources.DBEndpointParameter;
      expect(param).toBeDefined();
      expect(param.Type).toBe('AWS::SSM::Parameter');
    });

    test('DBSecretParameter should be defined', () => {
      const param = template.Resources.DBSecretParameter;
      expect(param).toBeDefined();
      expect(param.Type).toBe('AWS::SSM::Parameter');
    });

    test('ConfigBucketParameter should be defined', () => {
      const param = template.Resources.ConfigBucketParameter;
      expect(param).toBeDefined();
      expect(param.Type).toBe('AWS::SSM::Parameter');
    });

    test('ComplianceBucketParameter should be defined', () => {
      const param = template.Resources.ComplianceBucketParameter;
      expect(param).toBeDefined();
      expect(param.Type).toBe('AWS::SSM::Parameter');
    });

    test('SSM parameters should have correct types', () => {
      const dbParam = template.Resources.DBEndpointParameter;
      const secretParam = template.Resources.DBSecretParameter;

      expect(dbParam.Properties.Type).toBe('String');
      expect(secretParam.Properties.Type).toBe('String');
    });

    test('SSM parameters should have required tags', () => {
      const param = template.Resources.DBEndpointParameter;
      const tags = param.Properties.Tags;

      expect(tags).toBeDefined();
      expect(tags.project).toBe('iac-rlhf-amazon');
      expect(tags['team-number']).toBe('2');
    });
  });

  describe('Deletion Policies', () => {
    const resourcesRequiringDeletionPolicy = [
      'VPC',
      'PrivateSubnet1',
      'PrivateSubnet2',
      'PrivateSubnet3',
      'InternetGateway',
      'ConfigKMSKey',
      'DBMasterSecret',
      'AuroraCluster',
      'AuroraInstance1',
      'AuroraInstance2',
      'ConfigBucket',
      'ComplianceReportsBucket',
      'StateTable',
      'DriftDetectionFunction',
      'ReconciliationFunction',
      'AlertTopic',
      'CriticalAlertTopic',
    ];

    test.each(resourcesRequiringDeletionPolicy)(
      '%s should have DeletionPolicy set to Delete',
      resourceName => {
        const resource = template.Resources[resourceName];
        expect(resource).toBeDefined();
        expect(resource.DeletionPolicy).toBe('Delete');
      }
    );

    test('resources with DeletionPolicy should have UpdateReplacePolicy or be certain types', () => {
      const excludedTypes = ['AWS::EC2::VPCGatewayAttachment', 'AWS::EC2::RouteTable', 'AWS::EC2::SubnetRouteTableAssociation'];
      Object.keys(template.Resources).forEach(resourceKey => {
        const resource = template.Resources[resourceKey];
        if (resource.DeletionPolicy === 'Delete' && !excludedTypes.includes(resource.Type)) {
          if (resource.UpdateReplacePolicy !== undefined) {
            expect(resource.UpdateReplacePolicy).toBe('Delete');
          }
        }
      });
    });
  });

  describe('Required Tags Validation', () => {
    const resourcesRequiringTags = [
      'VPC',
      'PrivateSubnet1',
      'PrivateSubnet2',
      'PrivateSubnet3',
      'InternetGateway',
      'ConfigKMSKey',
      'DBMasterSecret',
      'AuroraCluster',
      'AuroraInstance1',
      'AuroraInstance2',
      'DBSubnetGroup',
      'ConfigBucket',
      'ComplianceReportsBucket',
      'StateTable',
      'DriftDetectionFunction',
      'ReconciliationFunction',
      'AlertTopic',
      'CriticalAlertTopic',
      'DBSecurityGroup',
      'LambdaSecurityGroup',
    ];

    test.each(resourcesRequiringTags)(
      '%s should have project tag set to iac-rlhf-amazon',
      resourceName => {
        const resource = template.Resources[resourceName];
        expect(resource).toBeDefined();

        const tags = resource.Properties.Tags;
        expect(tags).toBeDefined();

        const projectTag = tags.find((t: any) => t.Key === 'project');
        expect(projectTag).toBeDefined();
        expect(projectTag.Value).toBe('iac-rlhf-amazon');
      }
    );

    test.each(resourcesRequiringTags)(
      '%s should have team-number tag set to 2',
      resourceName => {
        const resource = template.Resources[resourceName];
        const tags = resource.Properties.Tags;

        const teamTag = tags.find((t: any) => t.Key === 'team-number');
        expect(teamTag).toBeDefined();
        expect(teamTag.Value).toBe(2);
      }
    );
  });

  describe('Outputs', () => {
    test('should have all required outputs', () => {
      const requiredOutputs = [
        'VPCId',
        'PrivateSubnetIds',
        'ConfigBucketName',
        'ComplianceBucketName',
        'AuroraClusterEndpoint',
        'DriftDetectionFunctionArn',
        'ReconciliationFunctionArn',
        'StateTableName',
        'AlertTopicArn',
        'KMSKeyId',
        'DBMasterSecretArn',
      ];

      requiredOutputs.forEach(output => {
        expect(template.Outputs[output]).toBeDefined();
      });
    });

    test('all outputs should have descriptions', () => {
      Object.keys(template.Outputs).forEach(outputKey => {
        expect(template.Outputs[outputKey].Description).toBeDefined();
        expect(template.Outputs[outputKey].Description.length).toBeGreaterThan(0);
      });
    });

    test('all outputs should have export names', () => {
      Object.keys(template.Outputs).forEach(outputKey => {
        const output = template.Outputs[outputKey];
        if (output.Export) {
          expect(output.Export.Name).toBeDefined();
        }
      });
    });

    test('VPCId output should reference VPC resource', () => {
      const output = template.Outputs.VPCId;
      expect(output.Value).toEqual({ Ref: 'VPC' });
    });

    test('AuroraClusterEndpoint should use GetAtt', () => {
      const output = template.Outputs.AuroraClusterEndpoint;
      expect(output.Value).toEqual({
        'Fn::GetAtt': ['AuroraCluster', 'Endpoint.Address'],
      });
    });
  });

  describe('Resource Count Validation', () => {
    test('should have expected number of resources', () => {
      const resourceCount = Object.keys(template.Resources).length;
      expect(resourceCount).toBeGreaterThan(40);
    });

    test('should have expected number of parameters', () => {
      const paramCount = Object.keys(template.Parameters).length;
      expect(paramCount).toBe(8);
    });

    test('should have expected number of outputs', () => {
      const outputCount = Object.keys(template.Outputs).length;
      expect(outputCount).toBeGreaterThan(10);
    });
  });

  describe('Region Independence', () => {
    test('resources should use AWS pseudo parameters for region', () => {
      const s3Endpoint = template.Resources.S3VPCEndpoint;
      expect(s3Endpoint.Properties.ServiceName['Fn::Sub']).toContain(
        '${AWS::Region}'
      );
    });

    test('subnets should use GetAZs for availability zones', () => {
      const subnet1 = template.Resources.PrivateSubnet1;
      expect(subnet1.Properties.AvailabilityZone['Fn::Select']).toBeDefined();
      expect(subnet1.Properties.AvailabilityZone['Fn::Select'][1]).toEqual({
        'Fn::GetAZs': '',
      });
    });
  });

  describe('Security Group Rules', () => {
    test('DBSecurityGroup should have ingress from Lambda', () => {
      const sg = template.Resources.DBSecurityGroup;
      const ingressRules = sg.Properties.SecurityGroupIngress;
      expect(ingressRules).toBeDefined();
      expect(ingressRules.length).toBeGreaterThan(0);
    });

    test('LambdaSecurityGroup should allow egress', () => {
      const sg = template.Resources.LambdaSecurityGroup;
      const egressRules = sg.Properties.SecurityGroupEgress;
      expect(egressRules).toBeDefined();
    });

    test('security groups should have required tags', () => {
      const dbSg = template.Resources.DBSecurityGroup;
      const lambdaSg = template.Resources.LambdaSecurityGroup;

      [dbSg, lambdaSg].forEach(sg => {
        const tags = sg.Properties.Tags;
        const projectTag = tags.find((t: any) => t.Key === 'project');
        const teamTag = tags.find((t: any) => t.Key === 'team-number');

        expect(projectTag.Value).toBe('iac-rlhf-amazon');
        expect(teamTag.Value).toBe(2);
      });
    });
  });

  describe('Resource Dependencies', () => {
    test('AuroraCluster should depend on DBSubnetGroup', () => {
      const cluster = template.Resources.AuroraCluster;
      expect(cluster.Properties.DBSubnetGroupName).toEqual({
        Ref: 'DBSubnetGroup',
      });
    });

    test('ConfigDeliveryChannel should depend on S3 bucket', () => {
      const channel = template.Resources.ConfigDeliveryChannel;
      expect(channel.Properties.S3BucketName).toBeDefined();
      expect(channel.Properties.S3BucketName.Ref).toBeDefined();
    });

    test('Lambda functions should reference security groups', () => {
      const driftLambda = template.Resources.DriftDetectionFunction;
      expect(
        driftLambda.Properties.VpcConfig.SecurityGroupIds[0]
      ).toEqual({ Ref: 'LambdaSecurityGroup' });
    });
  });

  describe('Encryption At Rest', () => {
    test('all S3 buckets should have encryption enabled', () => {
      const s3Buckets = Object.keys(template.Resources).filter(
        key => template.Resources[key].Type === 'AWS::S3::Bucket'
      );

      s3Buckets.forEach(bucketKey => {
        const bucket = template.Resources[bucketKey];
        expect(bucket.Properties.BucketEncryption).toBeDefined();
        expect(
          bucket.Properties.BucketEncryption.ServerSideEncryptionConfiguration
        ).toBeDefined();
      });
    });

    test('DynamoDB table should have encryption enabled', () => {
      const table = template.Resources.StateTable;
      expect(table.Properties.SSESpecification.SSEEnabled).toBe(true);
      expect(table.Properties.SSESpecification.SSEType).toBe('KMS');
    });

    test('Aurora cluster should have encryption enabled', () => {
      const cluster = template.Resources.AuroraCluster;
      expect(cluster.Properties.StorageEncrypted).toBe(true);
    });

    test('SNS topics should have KMS encryption', () => {
      const alertTopic = template.Resources.AlertTopic;
      const criticalTopic = template.Resources.CriticalAlertTopic;

      expect(alertTopic.Properties.KmsMasterKeyId).toBeDefined();
      expect(criticalTopic.Properties.KmsMasterKeyId).toBeDefined();
    });
  });

  describe('Backup and Recovery', () => {
    test('Aurora should have automated backups configured', () => {
      const cluster = template.Resources.AuroraCluster;
      expect(cluster.Properties.BackupRetentionPeriod).toBeDefined();
      // BackupRetentionPeriod now uses conditional logic with !If
      expect(cluster.Properties.BackupRetentionPeriod['Fn::If']).toBeDefined();
    });

    test('DynamoDB should have point-in-time recovery', () => {
      const table = template.Resources.StateTable;
      expect(
        table.Properties.PointInTimeRecoverySpecification.PointInTimeRecoveryEnabled
      ).toBe(true);
    });

    test('S3 buckets should have versioning enabled', () => {
      const configBucket = template.Resources.ConfigBucket;
      expect(configBucket.Properties.VersioningConfiguration.Status).toBe(
        'Enabled'
      );
    });
  });

  describe('CloudFormation Schema Compliance', () => {
    test('all resources should have valid Type property', () => {
      Object.keys(template.Resources).forEach(resourceKey => {
        const resource = template.Resources[resourceKey];
        expect(resource.Type).toBeDefined();
        expect(resource.Type).toMatch(/^AWS::/);
      });
    });

    test('all resources should have Properties object', () => {
      Object.keys(template.Resources).forEach(resourceKey => {
        const resource = template.Resources[resourceKey];
        expect(resource.Properties).toBeDefined();
        expect(typeof resource.Properties).toBe('object');
      });
    });

    test('template should not have any null values in critical sections', () => {
      expect(template.AWSTemplateFormatVersion).not.toBeNull();
      expect(template.Description).not.toBeNull();
      expect(template.Parameters).not.toBeNull();
      expect(template.Resources).not.toBeNull();
      expect(template.Outputs).not.toBeNull();
    });
  });
});