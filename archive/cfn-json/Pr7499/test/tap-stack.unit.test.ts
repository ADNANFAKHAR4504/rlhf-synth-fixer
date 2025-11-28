import fs from 'fs';
import path from 'path';

const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'test';

describe('Multi-Environment Aurora Database Replication System - Unit Tests', () => {
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
      expect(template.Description).toContain('Multi-environment RDS Aurora database replication');
    });

    test('should have all required top-level sections', () => {
      expect(template.Parameters).toBeDefined();
      expect(template.Conditions).toBeDefined();
      expect(template.Resources).toBeDefined();
      expect(template.Outputs).toBeDefined();
    });
  });

  describe('Parameters', () => {
    test('should have EnvironmentSuffix parameter', () => {
      expect(template.Parameters.EnvironmentSuffix).toBeDefined();
      expect(template.Parameters.EnvironmentSuffix.Type).toBe('String');
      expect(template.Parameters.EnvironmentSuffix.Default).toBe('test');
    });

    test('should have Environment parameter with correct values', () => {
      const envParam = template.Parameters.Environment;
      expect(envParam).toBeDefined();
      expect(envParam.Type).toBe('String');
      expect(envParam.AllowedValues).toEqual(['dev', 'staging', 'prod']);
      expect(envParam.Default).toBe('dev');
    });

    test('should have account ID parameters', () => {
      expect(template.Parameters.DevAccountId).toBeDefined();
      expect(template.Parameters.StagingAccountId).toBeDefined();
      expect(template.Parameters.ProdAccountId).toBeDefined();
    });
  });

  describe('Conditions', () => {
    test('should have environment conditions', () => {
      expect(template.Conditions.IsDevEnvironment).toBeDefined();
      expect(template.Conditions.IsStagingEnvironment).toBeDefined();
      expect(template.Conditions.IsProdEnvironment).toBeDefined();
    });

    test('IsDevEnvironment condition should be correct', () => {
      const condition = template.Conditions.IsDevEnvironment;
      expect(condition['Fn::Equals']).toEqual([
        { Ref: 'Environment' },
        'dev',
      ]);
    });
  });

  describe('VPC Resources', () => {
    test('should have VPC resource', () => {
      const vpc = template.Resources.VPC;
      expect(vpc).toBeDefined();
      expect(vpc.Type).toBe('AWS::EC2::VPC');
    });

    test('VPC should have conditional CIDR blocks', () => {
      const vpc = template.Resources.VPC;
      expect(vpc.Properties.CidrBlock['Fn::If']).toBeDefined();
      expect(vpc.Properties.EnableDnsHostnames).toBe(true);
      expect(vpc.Properties.EnableDnsSupport).toBe(true);
    });

    test('VPC should use environmentSuffix in name', () => {
      const vpc = template.Resources.VPC;
      const nameTag = vpc.Properties.Tags.find((tag: any) => tag.Key === 'Name');
      expect(nameTag.Value['Fn::Sub']).toContain('${EnvironmentSuffix}');
    });

    test('should have two private subnets', () => {
      expect(template.Resources.PrivateSubnet1).toBeDefined();
      expect(template.Resources.PrivateSubnet2).toBeDefined();
      expect(template.Resources.PrivateSubnet1.Type).toBe('AWS::EC2::Subnet');
      expect(template.Resources.PrivateSubnet2.Type).toBe('AWS::EC2::Subnet');
    });

    test('subnets should use different availability zones', () => {
      const subnet1 = template.Resources.PrivateSubnet1;
      const subnet2 = template.Resources.PrivateSubnet2;

      expect(subnet1.Properties.AvailabilityZone['Fn::Select'][0]).toBe(0);
      expect(subnet2.Properties.AvailabilityZone['Fn::Select'][0]).toBe(1);
    });
  });

  describe('Security Groups', () => {
    test('should have database security group', () => {
      const sg = template.Resources.DatabaseSecurityGroup;
      expect(sg).toBeDefined();
      expect(sg.Type).toBe('AWS::EC2::SecurityGroup');
    });

    test('database security group should allow MySQL port 3306', () => {
      const sg = template.Resources.DatabaseSecurityGroup;
      const ingressRule = sg.Properties.SecurityGroupIngress[0];
      expect(ingressRule.IpProtocol).toBe('tcp');
      expect(ingressRule.FromPort).toBe(3306);
      expect(ingressRule.ToPort).toBe(3306);
    });

    test('should have Lambda security group', () => {
      const sg = template.Resources.LambdaSecurityGroup;
      expect(sg).toBeDefined();
      expect(sg.Type).toBe('AWS::EC2::SecurityGroup');
    });

    test('Lambda security group should allow HTTPS egress', () => {
      const sg = template.Resources.LambdaSecurityGroup;
      const httpsRule = sg.Properties.SecurityGroupEgress.find(
        (rule: any) => rule.FromPort === 443
      );
      expect(httpsRule).toBeDefined();
      expect(httpsRule.ToPort).toBe(443);
      expect(httpsRule.CidrIp).toBe('0.0.0.0/0');
    });
  });

  describe('KMS Encryption', () => {
    test('should have KMS encryption key', () => {
      const key = template.Resources.EncryptionKey;
      expect(key).toBeDefined();
      expect(key.Type).toBe('AWS::KMS::Key');
    });

    test('KMS key should have rotation enabled', () => {
      const key = template.Resources.EncryptionKey;
      expect(key.Properties.EnableKeyRotation).toBe(true);
    });

    test('KMS key should have correct policy', () => {
      const key = template.Resources.EncryptionKey;
      const policy = key.Properties.KeyPolicy;
      expect(policy.Version).toBe('2012-10-17');
      expect(policy.Statement).toBeDefined();
      expect(policy.Statement.length).toBeGreaterThan(0);
    });

    test('should have KMS alias', () => {
      const alias = template.Resources.EncryptionKeyAlias;
      expect(alias).toBeDefined();
      expect(alias.Type).toBe('AWS::KMS::Alias');
      expect(alias.Properties.AliasName['Fn::Sub']).toContain('alias/');
    });
  });

  describe('Aurora Cluster', () => {
    test('should have Aurora DB cluster', () => {
      const cluster = template.Resources.AuroraCluster;
      expect(cluster).toBeDefined();
      expect(cluster.Type).toBe('AWS::RDS::DBCluster');
    });

    test('Aurora cluster should use aurora-mysql engine', () => {
      const cluster = template.Resources.AuroraCluster;
      expect(cluster.Properties.Engine).toBe('aurora-mysql');
      expect(cluster.Properties.EngineVersion).toBeDefined();
    });

    test('Aurora cluster should have encryption enabled', () => {
      const cluster = template.Resources.AuroraCluster;
      expect(cluster.Properties.StorageEncrypted).toBe(true);
      expect(cluster.Properties.KmsKeyId).toEqual({ Ref: 'EncryptionKey' });
    });

    test('Aurora cluster should have DeletionProtection conditional on environment', () => {
      const cluster = template.Resources.AuroraCluster;
      expect(cluster.Properties.DeletionProtection).toBeDefined();
      // DeletionProtection should be conditional: true for prod, false for dev/staging
      expect(cluster.Properties.DeletionProtection).toHaveProperty('Fn::If');
    });

    // SkipFinalSnapshot is not a valid property for AWS::RDS::DBCluster
    // It's only available for AWS::RDS::DBInstance
    test('Aurora cluster should not have SkipFinalSnapshot (not valid for DBCluster)', () => {
      const cluster = template.Resources.AuroraCluster;
      expect(cluster.Properties.SkipFinalSnapshot).toBeUndefined();
    });

    test('Aurora cluster should have 7-day backup retention', () => {
      const cluster = template.Resources.AuroraCluster;
      expect(cluster.Properties.BackupRetentionPeriod).toBe(7);
    });

    test('Aurora cluster should use environmentSuffix in identifier', () => {
      const cluster = template.Resources.AuroraCluster;
      expect(cluster.Properties.DBClusterIdentifier['Fn::Sub']).toContain(
        '${EnvironmentSuffix}'
      );
    });

    test('should have DB subnet group', () => {
      const subnetGroup = template.Resources.DBSubnetGroup;
      expect(subnetGroup).toBeDefined();
      expect(subnetGroup.Type).toBe('AWS::RDS::DBSubnetGroup');
      expect(subnetGroup.Properties.SubnetIds).toHaveLength(2);
    });
  });

  describe('Aurora Instances', () => {
    test('should have two Aurora instances', () => {
      expect(template.Resources.AuroraInstance1).toBeDefined();
      expect(template.Resources.AuroraInstance2).toBeDefined();
    });

    test('Aurora instances should use db.r5.large class', () => {
      const instance1 = template.Resources.AuroraInstance1;
      const instance2 = template.Resources.AuroraInstance2;
      expect(instance1.Properties.DBInstanceClass).toBe('db.r5.large');
      expect(instance2.Properties.DBInstanceClass).toBe('db.r5.large');
    });

    test('Aurora instances should not be publicly accessible', () => {
      const instance1 = template.Resources.AuroraInstance1;
      expect(instance1.Properties.PubliclyAccessible).toBe(false);
    });

    test('Aurora instances should use environmentSuffix in identifier', () => {
      const instance1 = template.Resources.AuroraInstance1;
      expect(instance1.Properties.DBInstanceIdentifier['Fn::Sub']).toContain(
        '${EnvironmentSuffix}'
      );
    });
  });

  describe('Secrets Manager', () => {
    test('should have database secret', () => {
      const secret = template.Resources.DatabaseSecret;
      expect(secret).toBeDefined();
      expect(secret.Type).toBe('AWS::SecretsManager::Secret');
    });

    test('database secret should generate secure password', () => {
      const secret = template.Resources.DatabaseSecret;
      const genConfig = secret.Properties.GenerateSecretString;
      expect(genConfig).toBeDefined();
      expect(genConfig.PasswordLength).toBe(32);
      expect(genConfig.ExcludeCharacters).toBeDefined();
    });

    test('database secret should use KMS encryption', () => {
      const secret = template.Resources.DatabaseSecret;
      expect(secret.Properties.KmsKeyId).toEqual({ Ref: 'EncryptionKey' });
    });

    test('should have secret rotation schedule', () => {
      const rotation = template.Resources.SecretRotationSchedule;
      expect(rotation).toBeDefined();
      expect(rotation.Type).toBe('AWS::SecretsManager::RotationSchedule');
    });

    test('secret rotation should be every 30 days', () => {
      const rotation = template.Resources.SecretRotationSchedule;
      expect(rotation.Properties.RotationRules.AutomaticallyAfterDays).toBe(30);
    });
  });

  describe('S3 Bucket', () => {
    test('should have migration script bucket', () => {
      const bucket = template.Resources.MigrationScriptBucket;
      expect(bucket).toBeDefined();
      expect(bucket.Type).toBe('AWS::S3::Bucket');
    });

    test('S3 bucket should have versioning enabled', () => {
      const bucket = template.Resources.MigrationScriptBucket;
      expect(bucket.Properties.VersioningConfiguration.Status).toBe('Enabled');
    });

    test('S3 bucket should have KMS encryption', () => {
      const bucket = template.Resources.MigrationScriptBucket;
      const encryption =
        bucket.Properties.BucketEncryption.ServerSideEncryptionConfiguration[0];
      expect(encryption.ServerSideEncryptionByDefault.SSEAlgorithm).toBe(
        'aws:kms'
      );
    });

    test('S3 bucket should have 30-day lifecycle policy', () => {
      const bucket = template.Resources.MigrationScriptBucket;
      const rule = bucket.Properties.LifecycleConfiguration.Rules[0];
      expect(rule.ExpirationInDays).toBe(30);
      expect(rule.Status).toBe('Enabled');
    });

    test('S3 bucket should block public access', () => {
      const bucket = template.Resources.MigrationScriptBucket;
      const publicAccess = bucket.Properties.PublicAccessBlockConfiguration;
      expect(publicAccess.BlockPublicAcls).toBe(true);
      expect(publicAccess.BlockPublicPolicy).toBe(true);
      expect(publicAccess.IgnorePublicAcls).toBe(true);
      expect(publicAccess.RestrictPublicBuckets).toBe(true);
    });
  });

  describe('Lambda Functions', () => {
    test('should have schema sync Lambda function', () => {
      const lambda = template.Resources.SchemaSyncLambda;
      expect(lambda).toBeDefined();
      expect(lambda.Type).toBe('AWS::Lambda::Function');
    });

    test('should have data sync Lambda function', () => {
      const lambda = template.Resources.DataSyncLambda;
      expect(lambda).toBeDefined();
      expect(lambda.Type).toBe('AWS::Lambda::Function');
    });

    test('should have secret rotation Lambda function', () => {
      const lambda = template.Resources.SecretRotationLambda;
      expect(lambda).toBeDefined();
      expect(lambda.Type).toBe('AWS::Lambda::Function');
    });

    test('Lambda functions should use Python 3.9 runtime', () => {
      const schemaSync = template.Resources.SchemaSyncLambda;
      const dataSync = template.Resources.DataSyncLambda;
      expect(schemaSync.Properties.Runtime).toBe('python3.9');
      expect(dataSync.Properties.Runtime).toBe('python3.9');
    });

    test('Lambda functions should have 5-minute timeout', () => {
      const schemaSync = template.Resources.SchemaSyncLambda;
      expect(schemaSync.Properties.Timeout).toBe(300);
    });

    test('Lambda functions should be in VPC', () => {
      const lambda = template.Resources.SchemaSyncLambda;
      expect(lambda.Properties.VpcConfig).toBeDefined();
      expect(lambda.Properties.VpcConfig.SubnetIds).toHaveLength(2);
      expect(lambda.Properties.VpcConfig.SecurityGroupIds).toHaveLength(1);
    });

    test('Lambda functions should have environment variables', () => {
      const lambda = template.Resources.SchemaSyncLambda;
      const envVars = lambda.Properties.Environment.Variables;
      expect(envVars.DB_SECRET_ARN).toBeDefined();
      expect(envVars.DB_CLUSTER_ENDPOINT).toBeDefined();
      expect(envVars.MIGRATION_BUCKET).toBeDefined();
      expect(envVars.ENVIRONMENT).toBeDefined();
    });

    test('Lambda execution role should exist', () => {
      const role = template.Resources.LambdaExecutionRole;
      expect(role).toBeDefined();
      expect(role.Type).toBe('AWS::IAM::Role');
    });

    test('Lambda execution role should have VPC access policy', () => {
      const role = template.Resources.LambdaExecutionRole;
      const policyArns = role.Properties.ManagedPolicyArns;
      expect(policyArns).toContain(
        'arn:aws:iam::aws:policy/service-role/AWSLambdaVPCAccessExecutionRole'
      );
    });
  });

  describe('IAM Roles', () => {
    test('should have cross-account role', () => {
      const role = template.Resources.CrossAccountRole;
      expect(role).toBeDefined();
      expect(role.Type).toBe('AWS::IAM::Role');
    });

    test('cross-account role should use external ID', () => {
      const role = template.Resources.CrossAccountRole;
      const statement = role.Properties.AssumeRolePolicyDocument.Statement[0];
      expect(statement.Condition.StringEquals['sts:ExternalId']).toBeDefined();
    });

    test('Lambda execution role should have required permissions', () => {
      const role = template.Resources.LambdaExecutionRole;
      const policy = role.Properties.Policies[0];
      const statements = policy.PolicyDocument.Statement;

      const hasRDSPermissions = statements.some((s: any) =>
        s.Action.includes('rds:DescribeDBClusters')
      );
      const hasSecretsPermissions = statements.some((s: any) =>
        s.Action.includes('secretsmanager:GetSecretValue')
      );
      const hasS3Permissions = statements.some((s: any) =>
        s.Action.includes('s3:GetObject')
      );

      expect(hasRDSPermissions).toBe(true);
      expect(hasSecretsPermissions).toBe(true);
      expect(hasS3Permissions).toBe(true);
    });
  });

  describe('SSM Parameter', () => {
    test('should have DB connection parameter', () => {
      const param = template.Resources.DBConnectionParameter;
      expect(param).toBeDefined();
      expect(param.Type).toBe('AWS::SSM::Parameter');
    });

    test('DB connection parameter should be String type', () => {
      const param = template.Resources.DBConnectionParameter;
      // SSM Parameter Type must be String or StringList per cfn-lint validation
      expect(param.Properties.Type).toBe('String');
    });

    // KmsKeyId is not a valid property for AWS::SSM::Parameter
    // Encryption is handled automatically for SecureString type, but cfn-lint requires String type
    test('DB connection parameter should exist', () => {
      const param = template.Resources.DBConnectionParameter;
      expect(param).toBeDefined();
      expect(param.Properties.Value).toBeDefined();
    });
  });

  describe('CloudWatch Alarms', () => {
    test('should have replication lag alarm', () => {
      const alarm = template.Resources.ReplicationLagAlarm;
      expect(alarm).toBeDefined();
      expect(alarm.Type).toBe('AWS::CloudWatch::Alarm');
    });

    test('replication lag alarm should monitor AuroraReplicaLag metric', () => {
      const alarm = template.Resources.ReplicationLagAlarm;
      expect(alarm.Properties.MetricName).toBe('AuroraReplicaLag');
      expect(alarm.Properties.Threshold).toBe(60);
    });

    test('should have schema sync error alarm', () => {
      const alarm = template.Resources.SchemaSyncErrorAlarm;
      expect(alarm).toBeDefined();
      expect(alarm.Properties.MetricName).toBe('Errors');
    });

    test('should have data sync error alarm', () => {
      const alarm = template.Resources.DataSyncErrorAlarm;
      expect(alarm).toBeDefined();
      expect(alarm.Properties.MetricName).toBe('Errors');
    });
  });

  describe('Outputs', () => {
    test('should have VPCId output', () => {
      const output = template.Outputs.VPCId;
      expect(output).toBeDefined();
      expect(output.Value).toEqual({ Ref: 'VPC' });
    });

    test('should have Aurora cluster endpoint output', () => {
      const output = template.Outputs.AuroraClusterEndpoint;
      expect(output).toBeDefined();
      expect(output.Value['Fn::GetAtt']).toEqual([
        'AuroraCluster',
        'Endpoint.Address',
      ]);
    });

    test('should have Aurora cluster read endpoint output', () => {
      const output = template.Outputs.AuroraClusterReadEndpoint;
      expect(output).toBeDefined();
      expect(output.Value['Fn::GetAtt']).toEqual([
        'AuroraCluster',
        'ReadEndpoint.Address',
      ]);
    });

    test('should have database secret ARN output', () => {
      const output = template.Outputs.DatabaseSecretArn;
      expect(output).toBeDefined();
      expect(output.Value).toEqual({ Ref: 'DatabaseSecret' });
    });

    test('should have migration bucket name output', () => {
      const output = template.Outputs.MigrationBucketName;
      expect(output).toBeDefined();
      expect(output.Value).toEqual({ Ref: 'MigrationScriptBucket' });
    });

    test('should have schema sync Lambda ARN output', () => {
      const output = template.Outputs.SchemaSyncLambdaArn;
      expect(output).toBeDefined();
      expect(output.Value['Fn::GetAtt']).toEqual(['SchemaSyncLambda', 'Arn']);
    });

    test('all outputs should have exports', () => {
      Object.keys(template.Outputs).forEach(outputKey => {
        const output = template.Outputs[outputKey];
        expect(output.Export).toBeDefined();
        expect(output.Export.Name).toBeDefined();
      });
    });
  });

  describe('Resource Naming with EnvironmentSuffix', () => {
    test('all named resources should include environmentSuffix', () => {
      const namedResources = [
        'VPC',
        'PrivateSubnet1',
        'PrivateSubnet2',
        'DatabaseSecurityGroup',
        'LambdaSecurityGroup',
        'EncryptionKeyAlias',
        'DBSubnetGroup',
        'DatabaseSecret',
        'AuroraCluster',
        'AuroraInstance1',
        'AuroraInstance2',
        'MigrationScriptBucket',
        'LambdaExecutionRole',
        'CrossAccountRole',
        'SchemaSyncLambda',
        'DataSyncLambda',
        'SecretRotationLambda',
        'DBConnectionParameter',
        'ReplicationLagAlarm',
        'SchemaSyncErrorAlarm',
        'DataSyncErrorAlarm',
      ];

      namedResources.forEach(resourceName => {
        const resource = template.Resources[resourceName];
        if (resource) {
          const hasEnvSuffix = JSON.stringify(resource).includes(
            'EnvironmentSuffix'
          );
          expect(hasEnvSuffix).toBe(true);
        }
      });
    });
  });

  describe('Destroyability', () => {
    test('Aurora cluster should not have Retain deletion policy', () => {
      const cluster = template.Resources.AuroraCluster;
      expect(cluster.DeletionPolicy).not.toBe('Retain');
      expect(cluster.UpdateReplacePolicy).not.toBe('Retain');
    });

    test('S3 bucket should not have Retain deletion policy', () => {
      const bucket = template.Resources.MigrationScriptBucket;
      expect(bucket.DeletionPolicy).not.toBe('Retain');
      expect(bucket.UpdateReplacePolicy).not.toBe('Retain');
    });

    // SkipFinalSnapshot is not a valid property for AWS::RDS::DBCluster
    test('Aurora cluster should not have SkipFinalSnapshot (not valid for DBCluster)', () => {
      const cluster = template.Resources.AuroraCluster;
      expect(cluster.Properties.SkipFinalSnapshot).toBeUndefined();
    });
  });
});
