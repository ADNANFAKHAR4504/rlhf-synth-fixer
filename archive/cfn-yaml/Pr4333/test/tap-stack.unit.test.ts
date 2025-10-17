import fs from 'fs';
import path from 'path';

describe('Payment Processing Database Infrastructure - CloudFormation Template Unit Tests', () => {
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

    test('should have PCI-DSS compliant description', () => {
      expect(template.Description).toBeDefined();
      expect(template.Description).toContain('PCI-DSS');
      expect(template.Description).toContain('Payment Processing');
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
      expect(template.Parameters.EnvironmentSuffix.MinLength).toBe(1);
    });

    test('should have VpcCidr parameter with default value', () => {
      expect(template.Parameters.VpcCidr).toBeDefined();
      expect(template.Parameters.VpcCidr.Default).toBe('10.0.0.0/16');
    });

    test('should have DBInstanceClass parameter with allowed values', () => {
      expect(template.Parameters.DBInstanceClass).toBeDefined();
      expect(template.Parameters.DBInstanceClass.AllowedValues).toBeDefined();
      expect(template.Parameters.DBInstanceClass.AllowedValues).toContain('db.t3.medium');
    });
  });

  describe('VPC and Network Resources', () => {
    test('should create VPC with DNS support enabled', () => {
      const vpc = template.Resources.VPC;
      expect(vpc).toBeDefined();
      expect(vpc.Type).toBe('AWS::EC2::VPC');
      expect(vpc.Properties.EnableDnsHostnames).toBe(true);
      expect(vpc.Properties.EnableDnsSupport).toBe(true);
    });

    test('should create Internet Gateway', () => {
      const igw = template.Resources.InternetGateway;
      expect(igw).toBeDefined();
      expect(igw.Type).toBe('AWS::EC2::InternetGateway');
    });

    test('should create NAT Gateway with EIP', () => {
      const natGateway = template.Resources.NatGateway;
      const eip = template.Resources.NatGatewayEIP;
      expect(natGateway).toBeDefined();
      expect(natGateway.Type).toBe('AWS::EC2::NatGateway');
      expect(eip).toBeDefined();
      expect(eip.Type).toBe('AWS::EC2::EIP');
    });

    test('should create 2 public and 2 private subnets', () => {
      expect(template.Resources.PublicSubnet1).toBeDefined();
      expect(template.Resources.PublicSubnet2).toBeDefined();
      expect(template.Resources.PrivateSubnet1).toBeDefined();
      expect(template.Resources.PrivateSubnet2).toBeDefined();
    });

    test('should create route tables for public and private subnets', () => {
      expect(template.Resources.PublicRouteTable).toBeDefined();
      expect(template.Resources.PrivateRouteTable).toBeDefined();
      expect(template.Resources.DefaultPublicRoute).toBeDefined();
      expect(template.Resources.DefaultPrivateRoute).toBeDefined();
    });

    test('VPC resources should use EnvironmentSuffix in names', () => {
      const vpc = template.Resources.VPC;
      expect(vpc.Properties.Tags).toBeDefined();
      const nameTag = vpc.Properties.Tags.find((t: any) => t.Key === 'Name');
      expect(nameTag.Value).toEqual({ 'Fn::Sub': 'payment-vpc-${EnvironmentSuffix}' });
    });
  });

  describe('KMS Encryption', () => {
    test('should create KMS key with rotation enabled', () => {
      const kmsKey = template.Resources.DatabaseEncryptionKey;
      expect(kmsKey).toBeDefined();
      expect(kmsKey.Type).toBe('AWS::KMS::Key');
      expect(kmsKey.Properties.EnableKeyRotation).toBe(true);
    });

    test('should create KMS key alias with EnvironmentSuffix', () => {
      const alias = template.Resources.DatabaseEncryptionKeyAlias;
      expect(alias).toBeDefined();
      expect(alias.Type).toBe('AWS::KMS::Alias');
      expect(alias.Properties.AliasName).toEqual({ 'Fn::Sub': 'alias/payment-db-${EnvironmentSuffix}' });
    });

    test('KMS key policy should allow RDS, Secrets Manager, and ElastiCache', () => {
      const kmsKey = template.Resources.DatabaseEncryptionKey;
      const statements = kmsKey.Properties.KeyPolicy.Statement;

      const rdsStatement = statements.find((s: any) => s.Sid === 'Allow RDS to use the key');
      const smStatement = statements.find((s: any) => s.Sid === 'Allow Secrets Manager to use the key');
      const cacheStatement = statements.find((s: any) => s.Sid === 'Allow ElastiCache to use the key');

      expect(rdsStatement).toBeDefined();
      expect(smStatement).toBeDefined();
      expect(cacheStatement).toBeDefined();
    });
  });

  describe('Secrets Manager', () => {
    test('should create secret with password generation', () => {
      const secret = template.Resources.DBMasterSecret;
      expect(secret).toBeDefined();
      expect(secret.Type).toBe('AWS::SecretsManager::Secret');
      expect(secret.Properties.GenerateSecretString).toBeDefined();
    });

    test('should generate password with correct requirements', () => {
      const secret = template.Resources.DBMasterSecret;
      const generateConfig = secret.Properties.GenerateSecretString;
      expect(generateConfig.PasswordLength).toBe(32);
      expect(generateConfig.RequireEachIncludedType).toBe(true);
    });

    test('should use KMS key for encryption', () => {
      const secret = template.Resources.DBMasterSecret;
      expect(secret.Properties.KmsKeyId).toEqual({ Ref: 'DatabaseEncryptionKey' });
    });

    test('should use EnvironmentSuffix in secret name', () => {
      const secret = template.Resources.DBMasterSecret;
      expect(secret.Properties.Name).toEqual({ 'Fn::Sub': 'payment-db-master-${EnvironmentSuffix}' });
    });
  });

  describe('Security Groups', () => {
    test('should create database security group', () => {
      const sg = template.Resources.DBSecurityGroup;
      expect(sg).toBeDefined();
      expect(sg.Type).toBe('AWS::EC2::SecurityGroup');
    });

    test('database security group should allow PostgreSQL port', () => {
      const sg = template.Resources.DBSecurityGroup;
      const ingressRule = sg.Properties.SecurityGroupIngress[0];
      expect(ingressRule.FromPort).toBe(5432);
      expect(ingressRule.ToPort).toBe(5432);
      expect(ingressRule.IpProtocol).toBe('tcp');
    });

    test('should create cache security group', () => {
      const sg = template.Resources.CacheSecurityGroup;
      expect(sg).toBeDefined();
      expect(sg.Type).toBe('AWS::EC2::SecurityGroup');
    });

    test('cache security group should allow Redis port', () => {
      const sg = template.Resources.CacheSecurityGroup;
      const ingressRule = sg.Properties.SecurityGroupIngress[0];
      expect(ingressRule.FromPort).toBe(6379);
      expect(ingressRule.ToPort).toBe(6379);
    });

    test('security groups should use EnvironmentSuffix in names', () => {
      const dbSg = template.Resources.DBSecurityGroup;
      expect(dbSg.Properties.GroupName).toEqual({ 'Fn::Sub': 'payment-db-sg-${EnvironmentSuffix}' });
    });
  });

  describe('RDS Aurora Cluster', () => {
    test('should create DB subnet group', () => {
      const subnetGroup = template.Resources.DBSubnetGroup;
      expect(subnetGroup).toBeDefined();
      expect(subnetGroup.Type).toBe('AWS::RDS::DBSubnetGroup');
    });

    test('should create RDS cluster with Aurora PostgreSQL', () => {
      const cluster = template.Resources.DBCluster;
      expect(cluster).toBeDefined();
      expect(cluster.Type).toBe('AWS::RDS::DBCluster');
      expect(cluster.Properties.Engine).toBe('aurora-postgresql');
    });

    test('RDS cluster should use Serverless v2 configuration', () => {
      const cluster = template.Resources.DBCluster;
      expect(cluster.Properties.EngineMode).toBe('provisioned');
      expect(cluster.Properties.ServerlessV2ScalingConfiguration).toBeDefined();
      expect(cluster.Properties.ServerlessV2ScalingConfiguration.MinCapacity).toBe(0.5);
      expect(cluster.Properties.ServerlessV2ScalingConfiguration.MaxCapacity).toBe(2);
    });

    test('RDS cluster should have encryption enabled', () => {
      const cluster = template.Resources.DBCluster;
      expect(cluster.Properties.StorageEncrypted).toBe(true);
      expect(cluster.Properties.KmsKeyId).toEqual({ Ref: 'DatabaseEncryptionKey' });
    });

    test('RDS cluster should have DeletionProtection set to false', () => {
      const cluster = template.Resources.DBCluster;
      expect(cluster.Properties.DeletionProtection).toBe(false);
    });

    test('RDS cluster should have backup retention of 7 days', () => {
      const cluster = template.Resources.DBCluster;
      expect(cluster.Properties.BackupRetentionPeriod).toBe(7);
    });

    test('RDS cluster should enable CloudWatch logs', () => {
      const cluster = template.Resources.DBCluster;
      expect(cluster.Properties.EnableCloudwatchLogsExports).toContain('postgresql');
    });

    test('should create DB instance', () => {
      const instance = template.Resources.DBInstance;
      expect(instance).toBeDefined();
      expect(instance.Type).toBe('AWS::RDS::DBInstance');
      expect(instance.Properties.PubliclyAccessible).toBe(false);
    });

    test('DB resources should use EnvironmentSuffix', () => {
      const cluster = template.Resources.DBCluster;
      expect(cluster.Properties.DBClusterIdentifier).toEqual({ 'Fn::Sub': 'payment-db-cluster-${EnvironmentSuffix}' });
    });
  });

  describe('Secrets Manager Rotation', () => {
    test('should create Lambda execution role', () => {
      const role = template.Resources.SecretRotationLambdaRole;
      expect(role).toBeDefined();
      expect(role.Type).toBe('AWS::IAM::Role');
    });

    test('Lambda role should have correct managed policies', () => {
      const role = template.Resources.SecretRotationLambdaRole;
      expect(role.Properties.ManagedPolicyArns).toContain('arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole');
      expect(role.Properties.ManagedPolicyArns).toContain('arn:aws:iam::aws:policy/service-role/AWSLambdaVPCAccessExecutionRole');
    });

    test('should create Lambda function for rotation', () => {
      const lambda = template.Resources.SecretRotationLambda;
      expect(lambda).toBeDefined();
      expect(lambda.Type).toBe('AWS::Lambda::Function');
      expect(lambda.Properties.Runtime).toBe('python3.9');
    });

    test('Lambda function should be deployed in VPC', () => {
      const lambda = template.Resources.SecretRotationLambda;
      expect(lambda.Properties.VpcConfig).toBeDefined();
      expect(lambda.Properties.VpcConfig.SubnetIds).toBeDefined();
      expect(lambda.Properties.VpcConfig.SecurityGroupIds).toBeDefined();
    });

    test('should create Lambda permission for Secrets Manager', () => {
      const permission = template.Resources.SecretRotationLambdaPermission;
      expect(permission).toBeDefined();
      expect(permission.Type).toBe('AWS::Lambda::Permission');
      expect(permission.Properties.Principal).toBe('secretsmanager.amazonaws.com');
    });

    test('should create rotation schedule with 30-day interval', () => {
      const schedule = template.Resources.SecretRotationSchedule;
      expect(schedule).toBeDefined();
      expect(schedule.Type).toBe('AWS::SecretsManager::RotationSchedule');
      expect(schedule.Properties.RotationRules.AutomaticallyAfterDays).toBe(30);
    });

    test('rotation schedule should depend on Lambda permission', () => {
      const schedule = template.Resources.SecretRotationSchedule;
      expect(schedule.DependsOn).toContain('SecretRotationLambdaPermission');
    });
  });

  describe('ElastiCache Redis', () => {
    test('should create cache subnet group', () => {
      const subnetGroup = template.Resources.CacheSubnetGroup;
      expect(subnetGroup).toBeDefined();
      expect(subnetGroup.Type).toBe('AWS::ElastiCache::SubnetGroup');
    });

    test('should create replication group with Redis', () => {
      const cache = template.Resources.CacheReplicationGroup;
      expect(cache).toBeDefined();
      expect(cache.Type).toBe('AWS::ElastiCache::ReplicationGroup');
      expect(cache.Properties.Engine).toBe('redis');
    });

    test('cache should have encryption enabled', () => {
      const cache = template.Resources.CacheReplicationGroup;
      expect(cache.Properties.AtRestEncryptionEnabled).toBe(true);
      expect(cache.Properties.TransitEncryptionEnabled).toBe(true);
      expect(cache.Properties.KmsKeyId).toEqual({ Ref: 'DatabaseEncryptionKey' });
    });

    test('cache should have automatic failover enabled', () => {
      const cache = template.Resources.CacheReplicationGroup;
      expect(cache.Properties.AutomaticFailoverEnabled).toBe(true);
      expect(cache.Properties.MultiAZEnabled).toBe(true);
    });

    test('cache should have 2 nodes for high availability', () => {
      const cache = template.Resources.CacheReplicationGroup;
      expect(cache.Properties.NumCacheClusters).toBe(2);
    });

    test('cache should use EnvironmentSuffix in ID', () => {
      const cache = template.Resources.CacheReplicationGroup;
      expect(cache.Properties.ReplicationGroupId).toEqual({ 'Fn::Sub': 'payment-cache-${EnvironmentSuffix}' });
    });
  });

  describe('Outputs', () => {
    test('should export VPC ID', () => {
      const output = template.Outputs.VPCId;
      expect(output).toBeDefined();
      expect(output.Value).toEqual({ Ref: 'VPC' });
    });

    test('should export private subnet IDs', () => {
      expect(template.Outputs.PrivateSubnet1Id).toBeDefined();
      expect(template.Outputs.PrivateSubnet2Id).toBeDefined();
    });

    test('should export DB cluster endpoint', () => {
      const output = template.Outputs.DBClusterEndpoint;
      expect(output).toBeDefined();
      expect(output.Value).toEqual({ 'Fn::GetAtt': ['DBCluster', 'Endpoint.Address'] });
    });

    test('should export DB cluster port', () => {
      const output = template.Outputs.DBClusterPort;
      expect(output).toBeDefined();
      expect(output.Value).toEqual({ 'Fn::GetAtt': ['DBCluster', 'Endpoint.Port'] });
    });

    test('should export Secrets Manager ARN', () => {
      const output = template.Outputs.DBSecretArn;
      expect(output).toBeDefined();
      expect(output.Value).toEqual({ Ref: 'DBMasterSecret' });
    });

    test('should export KMS key ID', () => {
      const output = template.Outputs.KMSKeyId;
      expect(output).toBeDefined();
      expect(output.Value).toEqual({ Ref: 'DatabaseEncryptionKey' });
    });

    test('should export cache endpoint', () => {
      const output = template.Outputs.CacheEndpoint;
      expect(output).toBeDefined();
      expect(output.Value).toEqual({ 'Fn::GetAtt': ['CacheReplicationGroup', 'PrimaryEndPoint.Address'] });
    });

    test('should export cache port', () => {
      const output = template.Outputs.CachePort;
      expect(output).toBeDefined();
      expect(output.Value).toEqual({ 'Fn::GetAtt': ['CacheReplicationGroup', 'PrimaryEndPoint.Port'] });
    });

    test('should export security group IDs', () => {
      expect(template.Outputs.DBSecurityGroupId).toBeDefined();
      expect(template.Outputs.CacheSecurityGroupId).toBeDefined();
    });

    test('all outputs should have export names', () => {
      Object.keys(template.Outputs).forEach(key => {
        expect(template.Outputs[key].Export).toBeDefined();
        expect(template.Outputs[key].Export.Name).toBeDefined();
      });
    });
  });

  describe('PCI-DSS Compliance', () => {
    test('should not have deletion protection on any resource', () => {
      const cluster = template.Resources.DBCluster;
      expect(cluster.Properties.DeletionProtection).toBe(false);
    });

    test('should encrypt all data at rest', () => {
      const cluster = template.Resources.DBCluster;
      const cache = template.Resources.CacheReplicationGroup;
      expect(cluster.Properties.StorageEncrypted).toBe(true);
      expect(cache.Properties.AtRestEncryptionEnabled).toBe(true);
    });

    test('should encrypt data in transit', () => {
      const cache = template.Resources.CacheReplicationGroup;
      expect(cache.Properties.TransitEncryptionEnabled).toBe(true);
    });

    test('should use customer-managed KMS keys', () => {
      const cluster = template.Resources.DBCluster;
      const cache = template.Resources.CacheReplicationGroup;
      const secret = template.Resources.DBMasterSecret;
      expect(cluster.Properties.KmsKeyId).toBeDefined();
      expect(cache.Properties.KmsKeyId).toBeDefined();
      expect(secret.Properties.KmsKeyId).toBeDefined();
    });

    test('should have automatic password rotation', () => {
      const schedule = template.Resources.SecretRotationSchedule;
      expect(schedule).toBeDefined();
      expect(schedule.Properties.RotationRules.AutomaticallyAfterDays).toBe(30);
    });
  });

  describe('High Availability', () => {
    test('should deploy across multiple availability zones', () => {
      const cache = template.Resources.CacheReplicationGroup;
      expect(cache.Properties.MultiAZEnabled).toBe(true);
      expect(cache.Properties.AutomaticFailoverEnabled).toBe(true);
    });

    test('should have backup retention for disaster recovery', () => {
      const cluster = template.Resources.DBCluster;
      const cache = template.Resources.CacheReplicationGroup;
      expect(cluster.Properties.BackupRetentionPeriod).toBeGreaterThanOrEqual(7);
      expect(cache.Properties.SnapshotRetentionLimit).toBeGreaterThanOrEqual(5);
    });
  });

  describe('Resource Naming Convention', () => {
    test('all named resources should include EnvironmentSuffix', () => {
      const namedResources = [
        'VPC', 'InternetGateway', 'PublicSubnet1', 'PublicSubnet2',
        'PrivateSubnet1', 'PrivateSubnet2', 'NatGatewayEIP', 'NatGateway',
        'PublicRouteTable', 'PrivateRouteTable', 'DatabaseEncryptionKey',
        'DBMasterSecret', 'DBSecurityGroup', 'CacheSecurityGroup',
        'DBSubnetGroup', 'DBCluster', 'DBInstance', 'SecretRotationLambdaRole',
        'SecretRotationLambda', 'CacheSubnetGroup', 'CacheReplicationGroup'
      ];

      namedResources.forEach(resourceName => {
        const resource = template.Resources[resourceName];
        if (resource && resource.Properties) {
          const hasEnvironmentSuffix =
            JSON.stringify(resource.Properties).includes('${EnvironmentSuffix}') ||
            (resource.Properties.Tags &&
             resource.Properties.Tags.some((tag: any) =>
               tag.Key === 'Environment' &&
               JSON.stringify(tag.Value).includes('EnvironmentSuffix')
             ));
          expect(hasEnvironmentSuffix).toBe(true);
        }
      });
    });
  });
});
