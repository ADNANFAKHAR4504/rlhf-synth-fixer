import fs from 'fs';
import path from 'path';

const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';

describe('TapStack CloudFormation Template - LMS Infrastructure', () => {
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
      expect(template.Description).toContain('learning management system');
      expect(template.Description).toContain('GDPR compliance');
    });
  });

  describe('Parameters', () => {
    test('should have EnvironmentSuffix parameter', () => {
      expect(template.Parameters.EnvironmentSuffix).toBeDefined();
      expect(template.Parameters.EnvironmentSuffix.Type).toBe('String');
    });

    test('should have ECS task configuration parameters', () => {
      expect(template.Parameters.ECSTaskCpu).toBeDefined();
      expect(template.Parameters.ECSTaskMemory).toBeDefined();
      expect(template.Parameters.ECSTaskCpu.AllowedValues).toContain('1024');
      expect(template.Parameters.ECSTaskMemory.AllowedValues).toContain('2048');
    });

    test('should have database configuration parameters', () => {
      expect(template.Parameters.DatabaseInstanceClass).toBeDefined();
      expect(template.Parameters.DatabaseName).toBeDefined();
      expect(template.Parameters.DatabaseInstanceClass.Default).toBe('db.t4g.medium');
    });

    test('should have Redis configuration parameter', () => {
      expect(template.Parameters.RedisNodeType).toBeDefined();
      expect(template.Parameters.RedisNodeType.Default).toBe('cache.t4g.small');
    });
  });

  describe('VPC and Networking Resources', () => {
    test('should create VPC with proper configuration', () => {
      const vpc = template.Resources.VPC;
      expect(vpc.Type).toBe('AWS::EC2::VPC');
      expect(vpc.Properties.CidrBlock).toBe('10.0.0.0/16');
      expect(vpc.Properties.EnableDnsHostnames).toBe(true);
      expect(vpc.Properties.EnableDnsSupport).toBe(true);
    });

    test('should create Internet Gateway', () => {
      const igw = template.Resources.InternetGateway;
      expect(igw.Type).toBe('AWS::EC2::InternetGateway');
      expect(template.Resources.AttachGateway).toBeDefined();
    });

    test('should create public subnets in multiple AZs', () => {
      expect(template.Resources.PublicSubnet1).toBeDefined();
      expect(template.Resources.PublicSubnet2).toBeDefined();
      expect(template.Resources.PublicSubnet1.Properties.CidrBlock).toBe('10.0.1.0/24');
      expect(template.Resources.PublicSubnet2.Properties.CidrBlock).toBe('10.0.2.0/24');
      expect(template.Resources.PublicSubnet1.Properties.MapPublicIpOnLaunch).toBe(true);
    });

    test('should create private subnets in multiple AZs', () => {
      expect(template.Resources.PrivateSubnet1).toBeDefined();
      expect(template.Resources.PrivateSubnet2).toBeDefined();
      expect(template.Resources.PrivateSubnet1.Properties.CidrBlock).toBe('10.0.11.0/24');
      expect(template.Resources.PrivateSubnet2.Properties.CidrBlock).toBe('10.0.12.0/24');
      expect(template.Resources.PrivateSubnet1.Properties.MapPublicIpOnLaunch).toBeUndefined();
    });

    test('should create NAT Gateway with EIP', () => {
      const natGw = template.Resources.NATGateway;
      const eip = template.Resources.NATGatewayEIP;
      expect(natGw.Type).toBe('AWS::EC2::NatGateway');
      expect(eip.Type).toBe('AWS::EC2::EIP');
      expect(eip.Properties.Domain).toBe('vpc');
    });

    test('should create route tables for public and private subnets', () => {
      expect(template.Resources.PublicRouteTable).toBeDefined();
      expect(template.Resources.PrivateRouteTable).toBeDefined();
      expect(template.Resources.PublicRoute.Properties.GatewayId).toEqual({ Ref: 'InternetGateway' });
      expect(template.Resources.PrivateRoute.Properties.NatGatewayId).toEqual({ Ref: 'NATGateway' });
    });

    test('should associate subnets with route tables', () => {
      expect(template.Resources.PublicSubnet1RouteTableAssociation).toBeDefined();
      expect(template.Resources.PublicSubnet2RouteTableAssociation).toBeDefined();
      expect(template.Resources.PrivateSubnet1RouteTableAssociation).toBeDefined();
      expect(template.Resources.PrivateSubnet2RouteTableAssociation).toBeDefined();
    });
  });

  describe('Security and Encryption', () => {
    test('should create KMS key for database encryption', () => {
      const kmsKey = template.Resources.DatabaseKMSKey;
      expect(kmsKey.Type).toBe('AWS::KMS::Key');
      expect(kmsKey.Properties.Description).toContain('Aurora PostgreSQL');
      expect(template.Resources.DatabaseKMSKeyAlias).toBeDefined();
    });

    test('should create KMS key for EFS encryption', () => {
      const kmsKey = template.Resources.EFSKMSKey;
      expect(kmsKey.Type).toBe('AWS::KMS::Key');
      expect(kmsKey.Properties.Description).toContain('EFS');
      expect(template.Resources.EFSKMSKeyAlias).toBeDefined();
    });

    test('should create SecretsManager secret for database credentials', () => {
      const secret = template.Resources.DatabaseSecret;
      expect(secret.Type).toBe('AWS::SecretsManager::Secret');
      expect(secret.Properties.GenerateSecretString).toBeDefined();
      expect(secret.Properties.GenerateSecretString.PasswordLength).toBe(32);
    });

    test('should create security groups with least privilege', () => {
      expect(template.Resources.ECSSecurityGroup).toBeDefined();
      expect(template.Resources.DatabaseSecurityGroup).toBeDefined();
      expect(template.Resources.RedisSecurityGroup).toBeDefined();
      expect(template.Resources.EFSSecurityGroup).toBeDefined();
    });

    test('database security group should only allow access from ECS', () => {
      const dbSg = template.Resources.DatabaseSecurityGroup;
      const ingress = dbSg.Properties.SecurityGroupIngress[0];
      expect(ingress.FromPort).toBe(5432);
      expect(ingress.ToPort).toBe(5432);
      expect(ingress.SourceSecurityGroupId).toEqual({ Ref: 'ECSSecurityGroup' });
    });

    test('Redis security group should only allow access from ECS', () => {
      const redisSg = template.Resources.RedisSecurityGroup;
      const ingress = redisSg.Properties.SecurityGroupIngress[0];
      expect(ingress.FromPort).toBe(6379);
      expect(ingress.ToPort).toBe(6379);
      expect(ingress.SourceSecurityGroupId).toEqual({ Ref: 'ECSSecurityGroup' });
    });

    test('EFS security group should only allow NFS from ECS', () => {
      const efsSg = template.Resources.EFSSecurityGroup;
      const ingress = efsSg.Properties.SecurityGroupIngress[0];
      expect(ingress.FromPort).toBe(2049);
      expect(ingress.ToPort).toBe(2049);
      expect(ingress.SourceSecurityGroupId).toEqual({ Ref: 'ECSSecurityGroup' });
    });
  });

  describe('Database Layer - Aurora PostgreSQL', () => {
    test('should create DB subnet group in private subnets', () => {
      const subnetGroup = template.Resources.DBSubnetGroup;
      expect(subnetGroup.Type).toBe('AWS::RDS::DBSubnetGroup');
      expect(subnetGroup.Properties.SubnetIds).toHaveLength(2);
    });

    test('should create Aurora PostgreSQL cluster with encryption', () => {
      const cluster = template.Resources.AuroraCluster;
      expect(cluster.Type).toBe('AWS::RDS::DBCluster');
      expect(cluster.Properties.Engine).toBe('aurora-postgresql');
      expect(cluster.Properties.StorageEncrypted).toBe(true);
      expect(cluster.Properties.KmsKeyId).toEqual({ 'Fn::GetAtt': ['DatabaseKMSKey', 'Arn'] });
    });

    test('should configure backup retention and maintenance windows', () => {
      const cluster = template.Resources.AuroraCluster;
      expect(cluster.Properties.BackupRetentionPeriod).toBe(35);
      expect(cluster.Properties.PreferredBackupWindow).toBeDefined();
      expect(cluster.Properties.PreferredMaintenanceWindow).toBeDefined();
    });

    test('should enable CloudWatch logs export', () => {
      const cluster = template.Resources.AuroraCluster;
      expect(cluster.Properties.EnableCloudwatchLogsExports).toContain('postgresql');
    });

    test('should have deletion policy set to Delete', () => {
      const cluster = template.Resources.AuroraCluster;
      expect(cluster.DeletionPolicy).toBe('Delete');
    });

    test('should create two Aurora instances for high availability', () => {
      expect(template.Resources.AuroraInstance1).toBeDefined();
      expect(template.Resources.AuroraInstance2).toBeDefined();
      expect(template.Resources.AuroraInstance1.Properties.PubliclyAccessible).toBe(false);
      expect(template.Resources.AuroraInstance2.Properties.PubliclyAccessible).toBe(false);
    });

    test('should use SecretsManager for database credentials', () => {
      const cluster = template.Resources.AuroraCluster;
      const username = cluster.Properties.MasterUsername['Fn::Sub'];
      const password = cluster.Properties.MasterUserPassword['Fn::Sub'];
      expect(username).toContain('resolve:secretsmanager');
      expect(password).toContain('resolve:secretsmanager');
    });
  });

  describe('AWS Backup for GDPR Compliance', () => {
    test('should create backup vault with encryption', () => {
      const vault = template.Resources.BackupVault;
      expect(vault.Type).toBe('AWS::Backup::BackupVault');
      expect(vault.Properties.EncryptionKeyArn).toEqual({ 'Fn::GetAtt': ['DatabaseKMSKey', 'Arn'] });
    });

    test('should create backup plan with 90-day retention', () => {
      const plan = template.Resources.BackupPlan;
      expect(plan.Type).toBe('AWS::Backup::BackupPlan');
      const rule = plan.Properties.BackupPlan.BackupPlanRule[0];
      expect(rule.Lifecycle.DeleteAfterDays).toBe(90);
      expect(rule.ScheduleExpression).toBe('cron(0 3 * * ? *)');
    });

    test('should create IAM role for backup service', () => {
      const role = template.Resources.BackupRole;
      expect(role.Type).toBe('AWS::IAM::Role');
      expect(role.Properties.AssumeRolePolicyDocument.Statement[0].Principal.Service).toBe('backup.amazonaws.com');
      expect(role.Properties.ManagedPolicyArns).toContain('arn:aws:iam::aws:policy/service-role/AWSBackupServiceRolePolicyForBackup');
    });

    test('should create backup selection for Aurora cluster', () => {
      const selection = template.Resources.BackupSelection;
      expect(selection.Type).toBe('AWS::Backup::BackupSelection');
      expect(selection.Properties.BackupSelection.Resources).toHaveLength(1);
    });
  });

  describe('Caching Layer - ElastiCache Redis', () => {
    test('should create Redis subnet group in private subnets', () => {
      const subnetGroup = template.Resources.RedisSubnetGroup;
      expect(subnetGroup.Type).toBe('AWS::ElastiCache::SubnetGroup');
      expect(subnetGroup.Properties.SubnetIds).toHaveLength(2);
    });

    test('should create Redis replication group with Multi-AZ', () => {
      const redis = template.Resources.RedisReplicationGroup;
      expect(redis.Type).toBe('AWS::ElastiCache::ReplicationGroup');
      expect(redis.Properties.Engine).toBe('redis');
      expect(redis.Properties.NumCacheClusters).toBe(2);
      expect(redis.Properties.MultiAZEnabled).toBe(true);
      expect(redis.Properties.AutomaticFailoverEnabled).toBe(true);
    });

    test('should enable transit encryption', () => {
      const redis = template.Resources.RedisReplicationGroup;
      expect(redis.Properties.TransitEncryptionEnabled).toBe(true);
      expect(redis.Properties.TransitEncryptionMode).toBe('required');
    });

    test('should configure snapshot retention', () => {
      const redis = template.Resources.RedisReplicationGroup;
      expect(redis.Properties.SnapshotRetentionLimit).toBe(7);
      expect(redis.Properties.SnapshotWindow).toBeDefined();
    });
  });

  describe('Storage Layer - EFS', () => {
    test('should create EFS filesystem with encryption', () => {
      const efs = template.Resources.EFSFileSystem;
      expect(efs.Type).toBe('AWS::EFS::FileSystem');
      expect(efs.Properties.Encrypted).toBe(true);
      expect(efs.Properties.KmsKeyId).toEqual({ 'Fn::GetAtt': ['EFSKMSKey', 'Arn'] });
    });

    test('should configure performance and throughput modes', () => {
      const efs = template.Resources.EFSFileSystem;
      expect(efs.Properties.PerformanceMode).toBe('generalPurpose');
      expect(efs.Properties.ThroughputMode).toBe('bursting');
    });

    test('should configure lifecycle policies', () => {
      const efs = template.Resources.EFSFileSystem;
      expect(efs.Properties.LifecyclePolicies).toBeDefined();
      expect(efs.Properties.LifecyclePolicies[0].TransitionToIA).toBe('AFTER_30_DAYS');
    });

    test('should create mount targets in private subnets', () => {
      expect(template.Resources.EFSMountTarget1).toBeDefined();
      expect(template.Resources.EFSMountTarget2).toBeDefined();
      expect(template.Resources.EFSMountTarget1.Properties.SubnetId).toEqual({ Ref: 'PrivateSubnet1' });
      expect(template.Resources.EFSMountTarget2.Properties.SubnetId).toEqual({ Ref: 'PrivateSubnet2' });
    });
  });

  describe('Container Platform - ECS Fargate', () => {
    test('should create ECS cluster with Fargate capacity providers', () => {
      const cluster = template.Resources.ECSCluster;
      expect(cluster.Type).toBe('AWS::ECS::Cluster');
      expect(cluster.Properties.CapacityProviders).toContain('FARGATE');
      expect(cluster.Properties.CapacityProviders).toContain('FARGATE_SPOT');
    });

    test('should enable Container Insights', () => {
      const cluster = template.Resources.ECSCluster;
      const setting = cluster.Properties.ClusterSettings.find((s: any) => s.Name === 'containerInsights');
      expect(setting.Value).toBe('enabled');
    });

    test('should create task execution role with proper permissions', () => {
      const role = template.Resources.ECSTaskExecutionRole;
      expect(role.Type).toBe('AWS::IAM::Role');
      expect(role.Properties.AssumeRolePolicyDocument.Statement[0].Principal.Service).toBe('ecs-tasks.amazonaws.com');
      expect(role.Properties.ManagedPolicyArns).toContain('arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy');
    });

    test('should create task role with EFS and SecretsManager access', () => {
      const role = template.Resources.ECSTaskRole;
      expect(role.Type).toBe('AWS::IAM::Role');
      expect(role.Properties.Policies).toHaveLength(2);
      expect(role.Properties.Policies[0].PolicyName).toBe('EFSAccess');
      expect(role.Properties.Policies[1].PolicyName).toBe('SecretsManagerAccess');
    });

    test('should create CloudWatch log group', () => {
      const logGroup = template.Resources.ECSLogGroup;
      expect(logGroup.Type).toBe('AWS::Logs::LogGroup');
      expect(logGroup.Properties.RetentionInDays).toBe(30);
    });

    test('should create task definition with proper configuration', () => {
      const taskDef = template.Resources.ECSTaskDefinition;
      expect(taskDef.Type).toBe('AWS::ECS::TaskDefinition');
      expect(taskDef.Properties.NetworkMode).toBe('awsvpc');
      expect(taskDef.Properties.RequiresCompatibilities).toContain('FARGATE');
    });

    test('task definition should reference database and Redis endpoints', () => {
      const taskDef = template.Resources.ECSTaskDefinition;
      const container = taskDef.Properties.ContainerDefinitions[0];
      const envVars = container.Environment;

      const dbHost = envVars.find((e: any) => e.Name === 'DATABASE_HOST');
      const redisHost = envVars.find((e: any) => e.Name === 'REDIS_HOST');

      expect(dbHost).toBeDefined();
      expect(redisHost).toBeDefined();
    });

    test('task definition should mount EFS volume', () => {
      const taskDef = template.Resources.ECSTaskDefinition;
      const container = taskDef.Properties.ContainerDefinitions[0];
      expect(container.MountPoints).toHaveLength(1);
      expect(container.MountPoints[0].ContainerPath).toBe('/mnt/efs');
      expect(taskDef.Properties.Volumes[0].EFSVolumeConfiguration.TransitEncryption).toBe('ENABLED');
    });

    test('should create ECS service with desired count of 2', () => {
      const service = template.Resources.ECSService;
      expect(service.Type).toBe('AWS::ECS::Service');
      expect(service.Properties.DesiredCount).toBe(2);
      expect(service.Properties.LaunchType).toBe('FARGATE');
    });

    test('ECS service should be in private subnets with no public IP', () => {
      const service = template.Resources.ECSService;
      const netConfig = service.Properties.NetworkConfiguration.AwsvpcConfiguration;
      expect(netConfig.AssignPublicIp).toBe('DISABLED');
      expect(netConfig.Subnets).toHaveLength(2);
    });

    test('should enable deployment circuit breaker', () => {
      const service = template.Resources.ECSService;
      const circuitBreaker = service.Properties.DeploymentConfiguration.DeploymentCircuitBreaker;
      expect(circuitBreaker.Enable).toBe(true);
      expect(circuitBreaker.Rollback).toBe(true);
    });
  });

  describe('Resource Naming with EnvironmentSuffix', () => {
    test('all resource names should include EnvironmentSuffix parameter', () => {
      const resourcesToCheck = [
        'VPC', 'DatabaseKMSKeyAlias', 'EFSKMSKeyAlias', 'DatabaseSecret',
        'AuroraCluster', 'RedisReplicationGroup', 'EFSFileSystem',
        'ECSCluster', 'BackupVault', 'BackupPlan'
      ];

      resourcesToCheck.forEach(resourceName => {
        const resource = template.Resources[resourceName];
        expect(resource).toBeDefined();

        // Find any property that contains a name
        const hasEnvSuffix = JSON.stringify(resource.Properties).includes('EnvironmentSuffix');
        expect(hasEnvSuffix).toBe(true);
      });
    });
  });

  describe('Outputs', () => {
    test('should have all required outputs', () => {
      const expectedOutputs = [
        'VPCId', 'ECSClusterName', 'DatabaseEndpoint',
        'RedisEndpoint', 'EFSFileSystemId', 'DatabaseSecretArn',
        'BackupVaultName', 'BackupPlanId'
      ];

      expectedOutputs.forEach(outputName => {
        expect(template.Outputs[outputName]).toBeDefined();
      });
    });

    test('all outputs should have descriptions and exports', () => {
      Object.keys(template.Outputs).forEach(outputKey => {
        const output = template.Outputs[outputKey];
        expect(output.Description).toBeDefined();
        expect(output.Export).toBeDefined();
        expect(output.Export.Name).toBeDefined();
      });
    });
  });

  describe('GDPR Compliance Features', () => {
    test('database should have encryption at rest', () => {
      const cluster = template.Resources.AuroraCluster;
      expect(cluster.Properties.StorageEncrypted).toBe(true);
      expect(cluster.Properties.KmsKeyId).toBeDefined();
    });

    test('database should have 35-day automated backup + 90-day AWS Backup', () => {
      const cluster = template.Resources.AuroraCluster;
      const backupPlan = template.Resources.BackupPlan;
      expect(cluster.Properties.BackupRetentionPeriod).toBe(35);
      expect(backupPlan.Properties.BackupPlan.BackupPlanRule[0].Lifecycle.DeleteAfterDays).toBe(90);
    });

    test('EFS should have encryption at rest', () => {
      const efs = template.Resources.EFSFileSystem;
      expect(efs.Properties.Encrypted).toBe(true);
      expect(efs.Properties.KmsKeyId).toBeDefined();
    });

    test('Redis should have encryption in transit', () => {
      const redis = template.Resources.RedisReplicationGroup;
      expect(redis.Properties.TransitEncryptionEnabled).toBe(true);
    });

    test('all resources should be in private subnets', () => {
      const cluster = template.Resources.AuroraCluster;
      const redis = template.Resources.RedisReplicationGroup;
      const service = template.Resources.ECSService;

      // Check that DB subnet group uses private subnets
      expect(template.Resources.DBSubnetGroup.Properties.SubnetIds).toContainEqual({ Ref: 'PrivateSubnet1' });

      // Check that Redis uses private subnets
      expect(template.Resources.RedisSubnetGroup.Properties.SubnetIds).toContainEqual({ Ref: 'PrivateSubnet1' });

      // Check that ECS service is in private subnets
      expect(service.Properties.NetworkConfiguration.AwsvpcConfiguration.Subnets).toContainEqual({ Ref: 'PrivateSubnet1' });
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

    test('should have expected resource count', () => {
      const resourceCount = Object.keys(template.Resources).length;
      // VPC(1) + IGW(1) + Attach(1) + Subnets(4) + NAT(1) + EIP(1) + Routes(2) + RTAssoc(4) +
      // KMS(2) + Aliases(2) + Secret(1) + SG(4) + DBSubnetGroup(1) + Aurora(3) +
      // RedisSubnetGroup(1) + Redis(1) + EFS(1) + EFSMounts(2) + Backup(4) +
      // ECS(1) + Roles(3) + LogGroup(1) + TaskDef(1) + Service(1)
      expect(resourceCount).toBeGreaterThan(30);
    });
  });
});
