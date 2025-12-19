import fs from 'fs';
import path from 'path';

describe('TapStack CloudFormation Template - Multi-Tier Web Application', () => {
  let template: any;

  beforeAll(() => {
    const templatePath = path.join(__dirname, '../lib/TapStack.json');
    const templateContent = fs.readFileSync(templatePath, 'utf8');
    template = JSON.parse(templateContent);
  });

  // ============================
  // Template Structure Tests
  // ============================
  describe('Template Structure', () => {
    test('should have valid CloudFormation format version', () => {
      expect(template.AWSTemplateFormatVersion).toBe('2010-09-09');
    });

    test('should have a description', () => {
      expect(template.Description).toBeDefined();
      expect(typeof template.Description).toBe('string');
      expect(template.Description.length).toBeGreaterThan(0);
    });

    test('should have Parameters section', () => {
      expect(template.Parameters).toBeDefined();
      expect(typeof template.Parameters).toBe('object');
    });

    test('should have Mappings section', () => {
      expect(template.Mappings).toBeDefined();
      expect(typeof template.Mappings).toBe('object');
    });

    test('should have Conditions section', () => {
      expect(template.Conditions).toBeDefined();
      expect(typeof template.Conditions).toBe('object');
    });

    test('should have Resources section', () => {
      expect(template.Resources).toBeDefined();
      expect(typeof template.Resources).toBe('object');
      expect(Object.keys(template.Resources).length).toBeGreaterThan(0);
    });

    test('should have Outputs section', () => {
      expect(template.Outputs).toBeDefined();
      expect(typeof template.Outputs).toBe('object');
    });
  });

  // ============================
  // Parameters Tests
  // ============================
  describe('Parameters', () => {
    test('should have EnvironmentSuffix parameter', () => {
      expect(template.Parameters.EnvironmentSuffix).toBeDefined();
      expect(template.Parameters.EnvironmentSuffix.Type).toBe('String');
      expect(template.Parameters.EnvironmentSuffix.Default).toBe('dev');
      expect(template.Parameters.EnvironmentSuffix.AllowedPattern).toBe('^[a-z0-9-]+$');
    });

    test('should have ProjectName parameter', () => {
      expect(template.Parameters.ProjectName).toBeDefined();
      expect(template.Parameters.ProjectName.Type).toBe('String');
      expect(template.Parameters.ProjectName.Default).toBe('fintech-app');
    });

    test('should have DBMasterUsername parameter', () => {
      expect(template.Parameters.DBMasterUsername).toBeDefined();
      expect(template.Parameters.DBMasterUsername.Type).toBe('String');
      expect(template.Parameters.DBMasterUsername.Default).toBe('admin');
      expect(template.Parameters.DBMasterUsername.MinLength).toBe(1);
      expect(template.Parameters.DBMasterUsername.MaxLength).toBe(16);
      expect(template.Parameters.DBMasterUsername.AllowedPattern).toBe('[a-zA-Z][a-zA-Z0-9]*');
    });

    test('should have DBInstanceClass parameter', () => {
      expect(template.Parameters.DBInstanceClass).toBeDefined();
      expect(template.Parameters.DBInstanceClass.Type).toBe('String');
      expect(template.Parameters.DBInstanceClass.Default).toBe('db.r5.large');
    });

    test('should have DesiredTaskCount parameter', () => {
      expect(template.Parameters.DesiredTaskCount).toBeDefined();
      expect(template.Parameters.DesiredTaskCount.Type).toBe('Number');
      expect(template.Parameters.DesiredTaskCount.Default).toBe(2);
    });

    test('all parameters should have descriptions', () => {
      Object.keys(template.Parameters).forEach((paramName) => {
        expect(template.Parameters[paramName].Description).toBeDefined();
        expect(typeof template.Parameters[paramName].Description).toBe('string');
      });
    });

    test('all parameters should have default values', () => {
      Object.keys(template.Parameters).forEach((paramName) => {
        expect(template.Parameters[paramName].Default).toBeDefined();
      });
    });
  });

  // ============================
  // Mappings Tests
  // ============================
  describe('Mappings', () => {
    test('should have SubnetConfig mapping', () => {
      expect(template.Mappings.SubnetConfig).toBeDefined();
    });

    test('SubnetConfig should have VPC CIDR', () => {
      expect(template.Mappings.SubnetConfig.VPC.CIDR).toBe('10.0.0.0/16');
    });

    test('SubnetConfig should have 3 public subnets', () => {
      expect(template.Mappings.SubnetConfig.PublicSubnet1.CIDR).toBe('10.0.1.0/24');
      expect(template.Mappings.SubnetConfig.PublicSubnet2.CIDR).toBe('10.0.2.0/24');
      expect(template.Mappings.SubnetConfig.PublicSubnet3.CIDR).toBe('10.0.3.0/24');
    });

    test('SubnetConfig should have 3 private subnets', () => {
      expect(template.Mappings.SubnetConfig.PrivateSubnet1.CIDR).toBe('10.0.11.0/24');
      expect(template.Mappings.SubnetConfig.PrivateSubnet2.CIDR).toBe('10.0.12.0/24');
      expect(template.Mappings.SubnetConfig.PrivateSubnet3.CIDR).toBe('10.0.13.0/24');
    });

    test('SubnetConfig should have 3 database subnets', () => {
      expect(template.Mappings.SubnetConfig.DatabaseSubnet1.CIDR).toBe('10.0.21.0/24');
      expect(template.Mappings.SubnetConfig.DatabaseSubnet2.CIDR).toBe('10.0.22.0/24');
      expect(template.Mappings.SubnetConfig.DatabaseSubnet3.CIDR).toBe('10.0.23.0/24');
    });
  });

  // ============================
  // Conditions Tests
  // ============================
  describe('Conditions', () => {
    test('should have IsProduction condition', () => {
      expect(template.Conditions.IsProduction).toBeDefined();
      expect(template.Conditions.IsProduction['Fn::Equals']).toBeDefined();
      expect(template.Conditions.IsProduction['Fn::Equals'][1]).toBe('prod');
    });
  });

  // ============================
  // VPC and Networking Tests
  // ============================
  describe('VPC and Networking Resources', () => {
    test('VPC should exist with correct properties', () => {
      const vpc = template.Resources.VPC;
      expect(vpc).toBeDefined();
      expect(vpc.Type).toBe('AWS::EC2::VPC');
      expect(vpc.DeletionPolicy).toBe('Delete');
      expect(vpc.UpdateReplacePolicy).toBe('Delete');
      expect(vpc.Properties.EnableDnsHostnames).toBe(true);
      expect(vpc.Properties.EnableDnsSupport).toBe(true);
    });

    test('InternetGateway should exist', () => {
      const igw = template.Resources.InternetGateway;
      expect(igw).toBeDefined();
      expect(igw.Type).toBe('AWS::EC2::InternetGateway');
      expect(igw.DeletionPolicy).toBe('Delete');
    });

    test('AttachGateway should exist', () => {
      const attach = template.Resources.AttachGateway;
      expect(attach).toBeDefined();
      expect(attach.Type).toBe('AWS::EC2::VPCGatewayAttachment');
    });

    test('should have 3 public subnets', () => {
      expect(template.Resources.PublicSubnet1).toBeDefined();
      expect(template.Resources.PublicSubnet2).toBeDefined();
      expect(template.Resources.PublicSubnet3).toBeDefined();

      [1, 2, 3].forEach((i) => {
        const subnet = template.Resources[`PublicSubnet${i}`];
        expect(subnet.Type).toBe('AWS::EC2::Subnet');
        expect(subnet.DeletionPolicy).toBe('Delete');
        expect(subnet.Properties.MapPublicIpOnLaunch).toBe(true);
      });
    });

    test('should have 3 private subnets', () => {
      expect(template.Resources.PrivateSubnet1).toBeDefined();
      expect(template.Resources.PrivateSubnet2).toBeDefined();
      expect(template.Resources.PrivateSubnet3).toBeDefined();

      [1, 2, 3].forEach((i) => {
        const subnet = template.Resources[`PrivateSubnet${i}`];
        expect(subnet.Type).toBe('AWS::EC2::Subnet');
        expect(subnet.DeletionPolicy).toBe('Delete');
      });
    });

    test('should have 3 database subnets', () => {
      expect(template.Resources.DatabaseSubnet1).toBeDefined();
      expect(template.Resources.DatabaseSubnet2).toBeDefined();
      expect(template.Resources.DatabaseSubnet3).toBeDefined();

      [1, 2, 3].forEach((i) => {
        const subnet = template.Resources[`DatabaseSubnet${i}`];
        expect(subnet.Type).toBe('AWS::EC2::Subnet');
        expect(subnet.DeletionPolicy).toBe('Delete');
      });
    });

    test('should have 3 NAT Gateways with EIPs', () => {
      [1, 2, 3].forEach((i) => {
        const eip = template.Resources[`NATGateway${i}EIP`];
        expect(eip).toBeDefined();
        expect(eip.Type).toBe('AWS::EC2::EIP');
        expect(eip.DeletionPolicy).toBe('Delete');
        expect(eip.Properties.Domain).toBe('vpc');

        const nat = template.Resources[`NATGateway${i}`];
        expect(nat).toBeDefined();
        expect(nat.Type).toBe('AWS::EC2::NatGateway');
        expect(nat.DeletionPolicy).toBe('Delete');
      });
    });

    test('should have route tables for public, private, and database subnets', () => {
      expect(template.Resources.PublicRouteTable).toBeDefined();
      expect(template.Resources.PublicRouteTable.Type).toBe('AWS::EC2::RouteTable');

      expect(template.Resources.PrivateRouteTable1).toBeDefined();
      expect(template.Resources.PrivateRouteTable2).toBeDefined();
      expect(template.Resources.PrivateRouteTable3).toBeDefined();

      expect(template.Resources.DatabaseRouteTable).toBeDefined();
    });

    test('public route should point to Internet Gateway', () => {
      const route = template.Resources.PublicRoute;
      expect(route).toBeDefined();
      expect(route.Type).toBe('AWS::EC2::Route');
      expect(route.Properties.DestinationCidrBlock).toBe('0.0.0.0/0');
      expect(route.Properties.GatewayId).toBeDefined();
    });

    test('private routes should point to NAT Gateways', () => {
      [1, 2, 3].forEach((i) => {
        const route = template.Resources[`PrivateRoute${i}`];
        expect(route).toBeDefined();
        expect(route.Type).toBe('AWS::EC2::Route');
        expect(route.Properties.DestinationCidrBlock).toBe('0.0.0.0/0');
        expect(route.Properties.NatGatewayId).toBeDefined();
      });
    });
  });

  // ============================
  // Security Groups Tests
  // ============================
  describe('Security Groups', () => {
    test('ALBSecurityGroup should exist with correct ingress rules', () => {
      const sg = template.Resources.ALBSecurityGroup;
      expect(sg).toBeDefined();
      expect(sg.Type).toBe('AWS::EC2::SecurityGroup');
      expect(sg.DeletionPolicy).toBe('Delete');

      const ingress = sg.Properties.SecurityGroupIngress;
      expect(ingress.length).toBe(2);

      const httpRule = ingress.find((r: any) => r.FromPort === 80);
      expect(httpRule).toBeDefined();
      expect(httpRule.CidrIp).toBe('0.0.0.0/0');

      const httpsRule = ingress.find((r: any) => r.FromPort === 443);
      expect(httpsRule).toBeDefined();
      expect(httpsRule.CidrIp).toBe('0.0.0.0/0');
    });

    test('ECSTaskSecurityGroup should allow traffic only from ALB', () => {
      const sg = template.Resources.ECSTaskSecurityGroup;
      expect(sg).toBeDefined();
      expect(sg.Type).toBe('AWS::EC2::SecurityGroup');
      expect(sg.DeletionPolicy).toBe('Delete');

      const ingress = sg.Properties.SecurityGroupIngress;
      expect(ingress.length).toBe(1);
      expect(ingress[0].FromPort).toBe(80);
      expect(ingress[0].ToPort).toBe(80);
      expect(ingress[0].SourceSecurityGroupId).toBeDefined();
    });

    test('DatabaseSecurityGroup should allow traffic only from ECS tasks', () => {
      const sg = template.Resources.DatabaseSecurityGroup;
      expect(sg).toBeDefined();
      expect(sg.Type).toBe('AWS::EC2::SecurityGroup');
      expect(sg.DeletionPolicy).toBe('Delete');

      const ingress = sg.Properties.SecurityGroupIngress;
      expect(ingress.length).toBe(1);
      expect(ingress[0].FromPort).toBe(3306);
      expect(ingress[0].ToPort).toBe(3306);
      expect(ingress[0].SourceSecurityGroupId).toBeDefined();
    });
  });

  // ============================
  // KMS Tests
  // ============================
  describe('KMS Encryption', () => {
    test('ApplicationKMSKey should exist with key rotation enabled', () => {
      const key = template.Resources.ApplicationKMSKey;
      expect(key).toBeDefined();
      expect(key.Type).toBe('AWS::KMS::Key');
      expect(key.DeletionPolicy).toBe('Delete');
      expect(key.Properties.EnableKeyRotation).toBe(true);
    });

    test('KMS key policy should allow root account', () => {
      const key = template.Resources.ApplicationKMSKey;
      const policy = key.Properties.KeyPolicy;
      expect(policy.Statement).toBeDefined();

      const rootStatement = policy.Statement.find((s: any) => s.Sid === 'Enable IAM User Permissions');
      expect(rootStatement).toBeDefined();
      expect(rootStatement.Effect).toBe('Allow');
      expect(rootStatement.Action).toBe('kms:*');
    });

    test('KMS key policy should allow S3 service', () => {
      const key = template.Resources.ApplicationKMSKey;
      const policy = key.Properties.KeyPolicy;

      const s3Statement = policy.Statement.find((s: any) => s.Sid === 'Allow S3 to use the key');
      expect(s3Statement).toBeDefined();
      expect(s3Statement.Principal.Service).toBe('s3.amazonaws.com');
    });

    test('KMS key policy should allow CloudWatch Logs', () => {
      const key = template.Resources.ApplicationKMSKey;
      const policy = key.Properties.KeyPolicy;

      const logsStatement = policy.Statement.find((s: any) => s.Sid === 'Allow CloudWatch Logs');
      expect(logsStatement).toBeDefined();
    });

    test('KMS key policy should allow Secrets Manager', () => {
      const key = template.Resources.ApplicationKMSKey;
      const policy = key.Properties.KeyPolicy;

      const secretsStatement = policy.Statement.find((s: any) => s.Sid === 'Allow Secrets Manager to use the key');
      expect(secretsStatement).toBeDefined();
      expect(secretsStatement.Principal.Service).toBe('secretsmanager.amazonaws.com');
    });

    test('ApplicationKMSKeyAlias should exist', () => {
      const alias = template.Resources.ApplicationKMSKeyAlias;
      expect(alias).toBeDefined();
      expect(alias.Type).toBe('AWS::KMS::Alias');
    });
  });

  // ============================
  // S3 Tests
  // ============================
  describe('S3 Buckets', () => {
    test('StaticAssetsBucket should exist with encryption', () => {
      const bucket = template.Resources.StaticAssetsBucket;
      expect(bucket).toBeDefined();
      expect(bucket.Type).toBe('AWS::S3::Bucket');
      expect(bucket.DeletionPolicy).toBe('Delete');

      const encryption = bucket.Properties.BucketEncryption;
      expect(encryption).toBeDefined();
      expect(encryption.ServerSideEncryptionConfiguration[0].ServerSideEncryptionByDefault.SSEAlgorithm).toBe('aws:kms');
      expect(encryption.ServerSideEncryptionConfiguration[0].BucketKeyEnabled).toBe(true);
    });

    test('StaticAssetsBucket should have versioning enabled', () => {
      const bucket = template.Resources.StaticAssetsBucket;
      expect(bucket.Properties.VersioningConfiguration.Status).toBe('Enabled');
    });

    test('StaticAssetsBucket should have lifecycle rules', () => {
      const bucket = template.Resources.StaticAssetsBucket;
      const lifecycle = bucket.Properties.LifecycleConfiguration;
      expect(lifecycle.Rules).toBeDefined();
      expect(lifecycle.Rules.length).toBeGreaterThan(0);

      const deleteOldVersions = lifecycle.Rules.find((r: any) => r.Id === 'DeleteOldVersions');
      expect(deleteOldVersions).toBeDefined();
      expect(deleteOldVersions.NoncurrentVersionExpirationInDays).toBe(90);

      const transitionToIA = lifecycle.Rules.find((r: any) => r.Id === 'TransitionToIA');
      expect(transitionToIA).toBeDefined();
      expect(transitionToIA.Transitions[0].TransitionInDays).toBe(30);
    });

    test('StaticAssetsBucket should block public access', () => {
      const bucket = template.Resources.StaticAssetsBucket;
      const publicAccessBlock = bucket.Properties.PublicAccessBlockConfiguration;
      expect(publicAccessBlock.BlockPublicAcls).toBe(true);
      expect(publicAccessBlock.BlockPublicPolicy).toBe(true);
      expect(publicAccessBlock.IgnorePublicAcls).toBe(true);
      expect(publicAccessBlock.RestrictPublicBuckets).toBe(true);
    });

    test('StaticAssetsBucketPolicy should deny insecure transport', () => {
      const policy = template.Resources.StaticAssetsBucketPolicy;
      expect(policy).toBeDefined();
      expect(policy.Type).toBe('AWS::S3::BucketPolicy');

      const denyStatement = policy.Properties.PolicyDocument.Statement.find((s: any) => s.Sid === 'DenyInsecureTransport');
      expect(denyStatement).toBeDefined();
      expect(denyStatement.Effect).toBe('Deny');
      expect(denyStatement.Condition.Bool['aws:SecureTransport']).toBe(false);
    });
  });

  // ============================
  // Secrets Manager Tests
  // ============================
  describe('Secrets Manager', () => {
    test('DBPasswordSecret should exist with KMS encryption', () => {
      const secret = template.Resources.DBPasswordSecret;
      expect(secret).toBeDefined();
      expect(secret.Type).toBe('AWS::SecretsManager::Secret');
      expect(secret.DeletionPolicy).toBe('Delete');
      expect(secret.Properties.KmsKeyId).toBeDefined();
    });

    test('DBPasswordSecret should generate password with correct properties', () => {
      const secret = template.Resources.DBPasswordSecret;
      const generateConfig = secret.Properties.GenerateSecretString;
      expect(generateConfig).toBeDefined();
      expect(generateConfig.GenerateStringKey).toBe('password');
      expect(generateConfig.PasswordLength).toBe(32);
      expect(generateConfig.ExcludeCharacters).toBeDefined();
    });

    test('SecretRDSAttachment should exist', () => {
      const attachment = template.Resources.SecretRDSAttachment;
      expect(attachment).toBeDefined();
      expect(attachment.Type).toBe('AWS::SecretsManager::SecretTargetAttachment');
      expect(attachment.Properties.TargetType).toBe('AWS::RDS::DBCluster');
    });
  });

  // ============================
  // RDS Aurora Tests
  // ============================
  describe('RDS Aurora', () => {
    test('DBSubnetGroup should exist', () => {
      const subnetGroup = template.Resources.DBSubnetGroup;
      expect(subnetGroup).toBeDefined();
      expect(subnetGroup.Type).toBe('AWS::RDS::DBSubnetGroup');
      expect(subnetGroup.DeletionPolicy).toBe('Delete');
      expect(subnetGroup.Properties.SubnetIds.length).toBe(3);
    });

    test('DBClusterParameterGroup should have SSL enforcement', () => {
      const paramGroup = template.Resources.DBClusterParameterGroup;
      expect(paramGroup).toBeDefined();
      expect(paramGroup.Type).toBe('AWS::RDS::DBClusterParameterGroup');
      expect(paramGroup.DeletionPolicy).toBe('Delete');
      expect(paramGroup.Properties.Family).toBe('aurora-mysql5.7');
      expect(paramGroup.Properties.Parameters.require_secure_transport).toBe('ON');
    });

    test('DBClusterParameterGroup should have UTF8MB4 character set', () => {
      const paramGroup = template.Resources.DBClusterParameterGroup;
      const params = paramGroup.Properties.Parameters;
      expect(params.character_set_server).toBe('utf8mb4');
      expect(params.character_set_database).toBe('utf8mb4');
      expect(params.character_set_client).toBe('utf8mb4');
      expect(params.collation_server).toBe('utf8mb4_unicode_ci');
    });

    test('AuroraDBCluster should exist with encryption', () => {
      const cluster = template.Resources.AuroraDBCluster;
      expect(cluster).toBeDefined();
      expect(cluster.Type).toBe('AWS::RDS::DBCluster');
      expect(cluster.DeletionPolicy).toBe('Delete');
      expect(cluster.Properties.StorageEncrypted).toBe(true);
      expect(cluster.Properties.KmsKeyId).toBeDefined();
    });

    test('AuroraDBCluster should have correct engine configuration', () => {
      const cluster = template.Resources.AuroraDBCluster;
      expect(cluster.Properties.Engine).toBe('aurora-mysql');
      expect(cluster.Properties.EngineMode).toBe('provisioned');
      expect(cluster.Properties.EngineVersion).toBe('5.7.mysql_aurora.2.11.3');
    });

    test('AuroraDBCluster should have alphanumeric database name', () => {
      const cluster = template.Resources.AuroraDBCluster;
      expect(cluster.Properties.DatabaseName).toBe('fintechdb');
      expect(cluster.Properties.DatabaseName).toMatch(/^[a-zA-Z][a-zA-Z0-9]*$/);
    });

    test('AuroraDBCluster should have CloudWatch logs enabled', () => {
      const cluster = template.Resources.AuroraDBCluster;
      expect(cluster.Properties.EnableCloudwatchLogsExports).toBeDefined();
      expect(cluster.Properties.EnableCloudwatchLogsExports).toContain('error');
      expect(cluster.Properties.EnableCloudwatchLogsExports).toContain('general');
      expect(cluster.Properties.EnableCloudwatchLogsExports).toContain('slowquery');
    });

    test('AuroraDBCluster should have conditional backup retention', () => {
      const cluster = template.Resources.AuroraDBCluster;
      expect(cluster.Properties.BackupRetentionPeriod).toBeDefined();
      expect(cluster.Properties.BackupRetentionPeriod['Fn::If']).toBeDefined();
    });

    test('should have 2 Aurora DB instances', () => {
      const instance1 = template.Resources.AuroraDBInstance1;
      const instance2 = template.Resources.AuroraDBInstance2;

      expect(instance1).toBeDefined();
      expect(instance1.Type).toBe('AWS::RDS::DBInstance');
      expect(instance1.DeletionPolicy).toBe('Delete');
      expect(instance1.Properties.PubliclyAccessible).toBe(false);

      expect(instance2).toBeDefined();
      expect(instance2.Type).toBe('AWS::RDS::DBInstance');
      expect(instance2.DeletionPolicy).toBe('Delete');
      expect(instance2.Properties.PubliclyAccessible).toBe(false);
    });
  });

  // ============================
  // ECS Tests
  // ============================
  describe('ECS Cluster and Tasks', () => {
    test('ECSCluster should exist with Container Insights', () => {
      const cluster = template.Resources.ECSCluster;
      expect(cluster).toBeDefined();
      expect(cluster.Type).toBe('AWS::ECS::Cluster');
      expect(cluster.DeletionPolicy).toBe('Delete');

      const settings = cluster.Properties.ClusterSettings;
      expect(settings).toBeDefined();
      expect(settings[0].Name).toBe('containerInsights');
      expect(settings[0].Value).toBe('enabled');
    });

    test('ECSCluster should have FARGATE capacity providers', () => {
      const cluster = template.Resources.ECSCluster;
      expect(cluster.Properties.CapacityProviders).toContain('FARGATE');
      expect(cluster.Properties.CapacityProviders).toContain('FARGATE_SPOT');
    });

    test('ECSTaskExecutionRole should have correct policies', () => {
      const role = template.Resources.ECSTaskExecutionRole;
      expect(role).toBeDefined();
      expect(role.Type).toBe('AWS::IAM::Role');
      expect(role.DeletionPolicy).toBe('Delete');
      expect(role.Properties.ManagedPolicyArns).toContain('arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy');
    });

    test('ECSTaskExecutionRole should have Secrets Manager access', () => {
      const role = template.Resources.ECSTaskExecutionRole;
      const policies = role.Properties.Policies;
      const secretPolicy = policies.find((p: any) => p.PolicyName === 'SecretManagerAccess');

      expect(secretPolicy).toBeDefined();
      const statements = secretPolicy.PolicyDocument.Statement;

      const getSecretStatement = statements.find((s: any) => s.Sid === 'GetSecretValue');
      expect(getSecretStatement).toBeDefined();
      expect(getSecretStatement.Action).toContain('secretsmanager:GetSecretValue');

      const kmsStatement = statements.find((s: any) => s.Sid === 'DecryptSecrets');
      expect(kmsStatement).toBeDefined();
      expect(kmsStatement.Action).toContain('kms:Decrypt');
      expect(kmsStatement.Condition).toBeDefined();
    });

    test('ECSTaskRole should have S3 and CloudWatch permissions', () => {
      const role = template.Resources.ECSTaskRole;
      expect(role).toBeDefined();
      expect(role.Type).toBe('AWS::IAM::Role');
      expect(role.DeletionPolicy).toBe('Delete');

      const policies = role.Properties.Policies;
      expect(policies.find((p: any) => p.PolicyName === 'S3Access')).toBeDefined();
      expect(policies.find((p: any) => p.PolicyName === 'CloudWatchLogs')).toBeDefined();
    });

    test('ECSTaskRole S3 permissions should be scoped to specific bucket', () => {
      const role = template.Resources.ECSTaskRole;
      const s3Policy = role.Properties.Policies.find((p: any) => p.PolicyName === 'S3Access');
      const statements = s3Policy.PolicyDocument.Statement;

      const objectStatement = statements.find((s: any) => s.Sid === 'S3ObjectAccess');
      expect(objectStatement).toBeDefined();
      expect(objectStatement.Resource).toBeDefined();

      const bucketStatement = statements.find((s: any) => s.Sid === 'S3BucketAccess');
      expect(bucketStatement).toBeDefined();

      const kmsStatement = statements.find((s: any) => s.Sid === 'KMSForS3');
      expect(kmsStatement).toBeDefined();
    });

    test('ECSLogGroup should exist with KMS encryption', () => {
      const logGroup = template.Resources.ECSLogGroup;
      expect(logGroup).toBeDefined();
      expect(logGroup.Type).toBe('AWS::Logs::LogGroup');
      expect(logGroup.DeletionPolicy).toBe('Delete');
      expect(logGroup.Properties.KmsKeyId).toBeDefined();
    });

    test('ECSLogGroup should have conditional retention period', () => {
      const logGroup = template.Resources.ECSLogGroup;
      expect(logGroup.Properties.RetentionInDays).toBeDefined();
      expect(logGroup.Properties.RetentionInDays['Fn::If']).toBeDefined();
    });

    test('TaskDefinition should exist with correct configuration', () => {
      const taskDef = template.Resources.TaskDefinition;
      expect(taskDef).toBeDefined();
      expect(taskDef.Type).toBe('AWS::ECS::TaskDefinition');
      expect(taskDef.Properties.NetworkMode).toBe('awsvpc');
      expect(taskDef.Properties.RequiresCompatibilities).toContain('FARGATE');
      expect(taskDef.Properties.Cpu).toBe('1024');
      expect(taskDef.Properties.Memory).toBe('2048');
    });

    test('TaskDefinition should use public nginx image', () => {
      const taskDef = template.Resources.TaskDefinition;
      const container = taskDef.Properties.ContainerDefinitions[0];
      expect(container.Image).toBe('public.ecr.aws/nginx/nginx:latest');
    });

    test('TaskDefinition should have database environment variables', () => {
      const taskDef = template.Resources.TaskDefinition;
      const container = taskDef.Properties.ContainerDefinitions[0];
      const env = container.Environment;

      expect(env.find((e: any) => e.Name === 'ENVIRONMENT')).toBeDefined();
      expect(env.find((e: any) => e.Name === 'DB_HOST')).toBeDefined();
      expect(env.find((e: any) => e.Name === 'DB_NAME')).toBeDefined();

      const dbName = env.find((e: any) => e.Name === 'DB_NAME');
      expect(dbName.Value).toBe('fintechdb');
    });

    test('TaskDefinition should have secrets from Secrets Manager', () => {
      const taskDef = template.Resources.TaskDefinition;
      const container = taskDef.Properties.ContainerDefinitions[0];
      const secrets = container.Secrets;

      expect(secrets.find((s: any) => s.Name === 'DB_USERNAME')).toBeDefined();
      expect(secrets.find((s: any) => s.Name === 'DB_PASSWORD')).toBeDefined();
    });

    test('TaskDefinition should have health check', () => {
      const taskDef = template.Resources.TaskDefinition;
      const container = taskDef.Properties.ContainerDefinitions[0];
      expect(container.HealthCheck).toBeDefined();
      expect(container.HealthCheck.Command).toContain('CMD-SHELL');
      expect(container.HealthCheck.Interval).toBe(30);
      expect(container.HealthCheck.Retries).toBe(3);
    });
  });

  // ============================
  // Application Load Balancer Tests
  // ============================
  describe('Application Load Balancer', () => {
    test('ApplicationLoadBalancer should exist', () => {
      const alb = template.Resources.ApplicationLoadBalancer;
      expect(alb).toBeDefined();
      expect(alb.Type).toBe('AWS::ElasticLoadBalancingV2::LoadBalancer');
      expect(alb.DeletionPolicy).toBe('Delete');
      expect(alb.Properties.Type).toBe('application');
      expect(alb.Properties.Scheme).toBe('internet-facing');
    });

    test('ApplicationLoadBalancer should be in public subnets', () => {
      const alb = template.Resources.ApplicationLoadBalancer;
      expect(alb.Properties.Subnets.length).toBe(3);
    });

    test('ALBTargetGroup should exist with correct health check', () => {
      const tg = template.Resources.ALBTargetGroup;
      expect(tg).toBeDefined();
      expect(tg.Type).toBe('AWS::ElasticLoadBalancingV2::TargetGroup');
      expect(tg.DeletionPolicy).toBe('Delete');
      expect(tg.Properties.Port).toBe(80);
      expect(tg.Properties.Protocol).toBe('HTTP');
      expect(tg.Properties.TargetType).toBe('ip');
      expect(tg.Properties.HealthCheckEnabled).toBe(true);
      expect(tg.Properties.HealthCheckPath).toBe('/');
    });

    test('ALBTargetGroup should have stickiness enabled', () => {
      const tg = template.Resources.ALBTargetGroup;
      const attrs = tg.Properties.TargetGroupAttributes;
      const stickiness = attrs.find((a: any) => a.Key === 'stickiness.enabled');
      expect(stickiness).toBeDefined();
      expect(stickiness.Value).toBe('true');
    });

    test('ALBListenerHTTP should exist and forward to target group', () => {
      const listener = template.Resources.ALBListenerHTTP;
      expect(listener).toBeDefined();
      expect(listener.Type).toBe('AWS::ElasticLoadBalancingV2::Listener');
      expect(listener.Properties.Port).toBe(80);
      expect(listener.Properties.Protocol).toBe('HTTP');
      expect(listener.Properties.DefaultActions[0].Type).toBe('forward');
    });
  });

  // ============================
  // ECS Service Tests
  // ============================
  describe('ECS Service', () => {
    test('ECSService should exist', () => {
      const service = template.Resources.ECSService;
      expect(service).toBeDefined();
      expect(service.Type).toBe('AWS::ECS::Service');
      expect(service.DeletionPolicy).toBe('Delete');
      expect(service.DependsOn).toBe('ALBListenerHTTP');
    });

    test('ECSService should be in private subnets', () => {
      const service = template.Resources.ECSService;
      const subnets = service.Properties.NetworkConfiguration.AwsvpcConfiguration.Subnets;
      expect(subnets.length).toBe(3);
      expect(service.Properties.NetworkConfiguration.AwsvpcConfiguration.AssignPublicIp).toBe('DISABLED');
    });

    test('ECSService should have deployment circuit breaker', () => {
      const service = template.Resources.ECSService;
      const circuitBreaker = service.Properties.DeploymentConfiguration.DeploymentCircuitBreaker;
      expect(circuitBreaker).toBeDefined();
      expect(circuitBreaker.Enable).toBe(true);
      expect(circuitBreaker.Rollback).toBe(true);
    });

    test('ECSService should have load balancer configuration', () => {
      const service = template.Resources.ECSService;
      expect(service.Properties.LoadBalancers).toBeDefined();
      expect(service.Properties.LoadBalancers.length).toBe(1);
      expect(service.Properties.LoadBalancers[0].ContainerPort).toBe(80);
    });
  });

  // ============================
  // Auto Scaling Tests
  // ============================
  describe('Auto Scaling', () => {
    test('ServiceScalingTarget should exist', () => {
      const target = template.Resources.ServiceScalingTarget;
      expect(target).toBeDefined();
      expect(target.Type).toBe('AWS::ApplicationAutoScaling::ScalableTarget');
      expect(target.Properties.MaxCapacity).toBe(10);
      expect(target.Properties.MinCapacity).toBeDefined();
    });

    test('ServiceScalingTarget should have conditional min capacity', () => {
      const target = template.Resources.ServiceScalingTarget;
      expect(target.Properties.MinCapacity['Fn::If']).toBeDefined();
    });

    test('ServiceScalingPolicyCPU should exist', () => {
      const policy = template.Resources.ServiceScalingPolicyCPU;
      expect(policy).toBeDefined();
      expect(policy.Type).toBe('AWS::ApplicationAutoScaling::ScalingPolicy');
      expect(policy.Properties.PolicyType).toBe('TargetTrackingScaling');
      expect(policy.Properties.TargetTrackingScalingPolicyConfiguration.TargetValue).toBe(75.0);
    });

    test('ServiceScalingPolicyMemory should exist', () => {
      const policy = template.Resources.ServiceScalingPolicyMemory;
      expect(policy).toBeDefined();
      expect(policy.Type).toBe('AWS::ApplicationAutoScaling::ScalingPolicy');
      expect(policy.Properties.PolicyType).toBe('TargetTrackingScaling');
      expect(policy.Properties.TargetTrackingScalingPolicyConfiguration.TargetValue).toBe(75.0);
    });
  });

  // ============================
  // CloudWatch Alarms Tests
  // ============================
  describe('CloudWatch Alarms', () => {
    test('HighCPUAlarm should exist', () => {
      const alarm = template.Resources.HighCPUAlarm;
      expect(alarm).toBeDefined();
      expect(alarm.Type).toBe('AWS::CloudWatch::Alarm');
      expect(alarm.Properties.MetricName).toBe('CPUUtilization');
      expect(alarm.Properties.Namespace).toBe('AWS/ECS');
      expect(alarm.Properties.Threshold).toBe(85);
      expect(alarm.Properties.ComparisonOperator).toBe('GreaterThanThreshold');
    });

    test('HighMemoryAlarm should exist', () => {
      const alarm = template.Resources.HighMemoryAlarm;
      expect(alarm).toBeDefined();
      expect(alarm.Type).toBe('AWS::CloudWatch::Alarm');
      expect(alarm.Properties.MetricName).toBe('MemoryUtilization');
      expect(alarm.Properties.Namespace).toBe('AWS/ECS');
      expect(alarm.Properties.Threshold).toBe(85);
    });

    test('DatabaseCPUAlarm should exist', () => {
      const alarm = template.Resources.DatabaseCPUAlarm;
      expect(alarm).toBeDefined();
      expect(alarm.Type).toBe('AWS::CloudWatch::Alarm');
      expect(alarm.Properties.MetricName).toBe('CPUUtilization');
      expect(alarm.Properties.Namespace).toBe('AWS/RDS');
      expect(alarm.Properties.Threshold).toBe(80);
    });

    test('TargetResponseTimeAlarm should exist', () => {
      const alarm = template.Resources.TargetResponseTimeAlarm;
      expect(alarm).toBeDefined();
      expect(alarm.Type).toBe('AWS::CloudWatch::Alarm');
      expect(alarm.Properties.MetricName).toBe('TargetResponseTime');
      expect(alarm.Properties.Namespace).toBe('AWS/ApplicationELB');
      expect(alarm.Properties.Threshold).toBe(1.0);
    });

    test('all alarms should treat missing data as notBreaching', () => {
      const alarms = ['HighCPUAlarm', 'HighMemoryAlarm', 'DatabaseCPUAlarm', 'TargetResponseTimeAlarm'];
      alarms.forEach((alarmName) => {
        const alarm = template.Resources[alarmName];
        expect(alarm.Properties.TreatMissingData).toBe('notBreaching');
      });
    });
  });

  // ============================
  // Tagging Tests
  // ============================
  describe('Resource Tagging', () => {
    const requiredTags = ['project', 'team-number', 'Environment'];
    const taggedResourceTypes = [
      'AWS::EC2::VPC',
      'AWS::EC2::Subnet',
      'AWS::EC2::InternetGateway',
      'AWS::EC2::NatGateway',
      'AWS::EC2::EIP',
      'AWS::EC2::RouteTable',
      'AWS::EC2::SecurityGroup',
      'AWS::KMS::Key',
      'AWS::S3::Bucket',
      'AWS::SecretsManager::Secret',
      'AWS::RDS::DBSubnetGroup',
      'AWS::RDS::DBClusterParameterGroup',
      'AWS::RDS::DBCluster',
      'AWS::RDS::DBInstance',
      'AWS::ECS::Cluster',
      'AWS::IAM::Role',
      'AWS::Logs::LogGroup',
      'AWS::ECS::TaskDefinition',
      'AWS::ElasticLoadBalancingV2::LoadBalancer',
      'AWS::ElasticLoadBalancingV2::TargetGroup',
      'AWS::ECS::Service'
    ];

    test('all taggable resources should have required tags', () => {
      Object.keys(template.Resources).forEach((resourceName) => {
        const resource = template.Resources[resourceName];

        if (taggedResourceTypes.includes(resource.Type)) {
          expect(resource.Properties.Tags).toBeDefined();

          requiredTags.forEach((tagKey) => {
            const tag = resource.Properties.Tags.find((t: any) => t.Key === tagKey);
            expect(tag).toBeDefined();
          });
        }
      });
    });

    test('project tag should be iac-rlhf-amazon', () => {
      Object.keys(template.Resources).forEach((resourceName) => {
        const resource = template.Resources[resourceName];

        if (resource.Properties?.Tags) {
          const projectTag = resource.Properties.Tags.find((t: any) => t.Key === 'project');
          if (projectTag) {
            expect(projectTag.Value).toBe('iac-rlhf-amazon');
          }
        }
      });
    });

    test('team-number tag should be 2', () => {
      Object.keys(template.Resources).forEach((resourceName) => {
        const resource = template.Resources[resourceName];

        if (resource.Properties?.Tags) {
          const teamTag = resource.Properties.Tags.find((t: any) => t.Key === 'team-number');
          if (teamTag) {
            expect(teamTag.Value).toBe(2);
          }
        }
      });
    });
  });

  // ============================
  // DeletionPolicy Tests
  // ============================
  describe('DeletionPolicy', () => {
    const resourcesWithDeletionPolicy = [
      'VPC', 'InternetGateway', 'PublicSubnet1', 'PublicSubnet2', 'PublicSubnet3',
      'PrivateSubnet1', 'PrivateSubnet2', 'PrivateSubnet3',
      'DatabaseSubnet1', 'DatabaseSubnet2', 'DatabaseSubnet3',
      'NATGateway1EIP', 'NATGateway2EIP', 'NATGateway3EIP',
      'NATGateway1', 'NATGateway2', 'NATGateway3',
      'PublicRouteTable', 'PrivateRouteTable1', 'PrivateRouteTable2', 'PrivateRouteTable3', 'DatabaseRouteTable',
      'ALBSecurityGroup', 'ECSTaskSecurityGroup', 'DatabaseSecurityGroup',
      'ApplicationKMSKey', 'StaticAssetsBucket', 'DBPasswordSecret',
      'DBSubnetGroup', 'DBClusterParameterGroup', 'AuroraDBCluster', 'AuroraDBInstance1', 'AuroraDBInstance2',
      'ECSCluster', 'ECSTaskExecutionRole', 'ECSTaskRole', 'ECSLogGroup',
      'ApplicationLoadBalancer', 'ALBTargetGroup', 'ECSService'
    ];

    test('critical resources should have DeletionPolicy Delete', () => {
      resourcesWithDeletionPolicy.forEach((resourceName) => {
        const resource = template.Resources[resourceName];
        if (resource) {
          expect(resource.DeletionPolicy).toBe('Delete');
        }
      });
    });

    test('critical resources should have UpdateReplacePolicy Delete', () => {
      resourcesWithDeletionPolicy.forEach((resourceName) => {
        const resource = template.Resources[resourceName];
        if (resource) {
          expect(resource.UpdateReplacePolicy).toBe('Delete');
        }
      });
    });
  });

  // ============================
  // Outputs Tests
  // ============================
  describe('Outputs', () => {
    const expectedOutputs = [
      'VPCId',
      'ECSClusterName',
      'ALBDNSName',
      'RDSEndpoint',
      'RDSReadEndpoint',
      'DBSecretArn',
      'StaticAssetsBucketName',
      'ServiceName',
      'TaskDefinitionArn',
      'EnvironmentSuffix',
      'KMSKeyId'
    ];

    test('should have all expected outputs', () => {
      expectedOutputs.forEach((outputName) => {
        expect(template.Outputs[outputName]).toBeDefined();
      });
    });

    test('all outputs should have descriptions', () => {
      Object.keys(template.Outputs).forEach((outputName) => {
        expect(template.Outputs[outputName].Description).toBeDefined();
        expect(typeof template.Outputs[outputName].Description).toBe('string');
      });
    });

    test('all outputs should have values', () => {
      Object.keys(template.Outputs).forEach((outputName) => {
        expect(template.Outputs[outputName].Value).toBeDefined();
      });
    });

    test('all outputs should have export names', () => {
      Object.keys(template.Outputs).forEach((outputName) => {
        expect(template.Outputs[outputName].Export).toBeDefined();
        expect(template.Outputs[outputName].Export.Name).toBeDefined();
      });
    });
  });

  // ============================
  // IAM Least Privilege Tests
  // ============================
  describe('IAM Least Privilege', () => {
    test('ECSTaskExecutionRole should not have wildcard resources in Secrets Manager policy', () => {
      const role = template.Resources.ECSTaskExecutionRole;
      const policies = role.Properties.Policies;

      policies.forEach((policy: any) => {
        policy.PolicyDocument.Statement.forEach((statement: any) => {
          if (statement.Action && statement.Action.includes('secretsmanager:GetSecretValue')) {
            expect(statement.Resource).not.toBe('*');
          }
        });
      });
    });

    test('ECSTaskRole should not have wildcard resources in S3 policy', () => {
      const role = template.Resources.ECSTaskRole;
      const s3Policy = role.Properties.Policies.find((p: any) => p.PolicyName === 'S3Access');

      s3Policy.PolicyDocument.Statement.forEach((statement: any) => {
        expect(statement.Resource).not.toBe('*');
      });
    });

    test('ECSTaskRole CloudWatch Logs should be scoped to specific log group', () => {
      const role = template.Resources.ECSTaskRole;
      const logsPolicy = role.Properties.Policies.find((p: any) => p.PolicyName === 'CloudWatchLogs');
      const statement = logsPolicy.PolicyDocument.Statement[0];

      expect(statement.Resource).toBeDefined();
      expect(statement.Resource).not.toBe('*');
    });

    test('KMS decrypt should use ViaService condition', () => {
      const role = template.Resources.ECSTaskExecutionRole;
      const policies = role.Properties.Policies;

      const kmsStatement = policies[0].PolicyDocument.Statement.find((s: any) =>
        s.Action && (s.Action.includes('kms:Decrypt') || s.Action.includes('kms:DescribeKey'))
      );

      if (kmsStatement) {
        expect(kmsStatement.Condition).toBeDefined();
        expect(kmsStatement.Condition.StringEquals).toBeDefined();
      }
    });
  });

  // ============================
  // Region Agnostic Tests
  // ============================
  describe('Region Agnostic Configuration', () => {
    test('should not have hardcoded regions', () => {
      const templateStr = JSON.stringify(template);
      const hardcodedRegions = ['us-east-1', 'us-west-2', 'eu-west-1', 'ap-southeast-1'];

      hardcodedRegions.forEach((region) => {
        const matches = templateStr.match(new RegExp(region, 'g'));
        expect(matches).toBeNull();
      });
    });

    test('should use AWS::Region for region references', () => {
      const templateStr = JSON.stringify(template);
      expect(templateStr).toContain('AWS::Region');
    });

    test('should use GetAZs for availability zones', () => {
      const publicSubnet1 = template.Resources.PublicSubnet1;
      expect(publicSubnet1.Properties.AvailabilityZone['Fn::Select']).toBeDefined();
      expect(publicSubnet1.Properties.AvailabilityZone['Fn::Select'][1]['Fn::GetAZs']).toBe('');
    });
  });
});
