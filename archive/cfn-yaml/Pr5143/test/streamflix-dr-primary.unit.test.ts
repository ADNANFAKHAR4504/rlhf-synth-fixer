import fs from 'fs';
import path from 'path';
import { yamlParse } from 'yaml-cfn';

const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';

describe('StreamFlix DR Primary Region CloudFormation Template', () => {
  let template: any;

  beforeAll(() => {
    const templatePath = path.join(__dirname, '../lib/streamflix-dr-primary.yaml');
    const templateContent = fs.readFileSync(templatePath, 'utf8');
    template = yamlParse(templateContent);
  });

  describe('Template Structure', () => {
    test('should have valid CloudFormation format version', () => {
      expect(template.AWSTemplateFormatVersion).toBe('2010-09-09');
    });

    test('should have a description', () => {
      expect(template.Description).toBeDefined();
      expect(template.Description).toContain('StreamFlix Disaster Recovery Solution');
      expect(template.Description).toContain('Primary Region');
    });

    test('should have metadata section', () => {
      expect(template.Metadata).toBeDefined();
      expect(template.Metadata['AWS::CloudFormation::Interface']).toBeDefined();
    });
  });

  describe('Parameters', () => {
    test('should have environmentSuffix parameter', () => {
      expect(template.Parameters.environmentSuffix).toBeDefined();
    });

    test('environmentSuffix parameter should have correct properties', () => {
      const param = template.Parameters.environmentSuffix;
      expect(param.Type).toBe('String');
      expect(param.Default).toBe('dev');
      expect(param.AllowedPattern).toBe('^[a-z0-9-]+$');
    });

    test('should have database credential parameters', () => {
      expect(template.Parameters.DBUsername).toBeDefined();
      expect(template.Parameters.DBPassword).toBeDefined();
      expect(template.Parameters.DBUsername.NoEcho).toBe(true);
      expect(template.Parameters.DBPassword.NoEcho).toBe(true);
    });

    test('should have network configuration parameters', () => {
      expect(template.Parameters.VpcCIDR).toBeDefined();
      expect(template.Parameters.PublicSubnet1CIDR).toBeDefined();
      expect(template.Parameters.PublicSubnet2CIDR).toBeDefined();
      expect(template.Parameters.PrivateSubnet1CIDR).toBeDefined();
      expect(template.Parameters.PrivateSubnet2CIDR).toBeDefined();
    });
  });

  describe('VPC Infrastructure', () => {
    test('should have VPC resource', () => {
      expect(template.Resources.VPC).toBeDefined();
      expect(template.Resources.VPC.Type).toBe('AWS::EC2::VPC');
    });

    test('VPC should have DNS support enabled', () => {
      const vpc = template.Resources.VPC;
      expect(vpc.Properties.EnableDnsHostnames).toBe(true);
      expect(vpc.Properties.EnableDnsSupport).toBe(true);
    });

    test('should have Internet Gateway', () => {
      expect(template.Resources.InternetGateway).toBeDefined();
      expect(template.Resources.InternetGateway.Type).toBe('AWS::EC2::InternetGateway');
    });

    test('should have public and private subnets', () => {
      expect(template.Resources.PublicSubnet1).toBeDefined();
      expect(template.Resources.PublicSubnet2).toBeDefined();
      expect(template.Resources.PrivateSubnet1).toBeDefined();
      expect(template.Resources.PrivateSubnet2).toBeDefined();
    });

    test('public subnets should map public IP on launch', () => {
      expect(template.Resources.PublicSubnet1.Properties.MapPublicIpOnLaunch).toBe(true);
      expect(template.Resources.PublicSubnet2.Properties.MapPublicIpOnLaunch).toBe(true);
    });

    test('should have route tables', () => {
      expect(template.Resources.PublicRouteTable).toBeDefined();
      expect(template.Resources.PublicRoute).toBeDefined();
    });
  });

  describe('KMS Encryption', () => {
    test('should have KMS Key', () => {
      expect(template.Resources.KMSKey).toBeDefined();
      expect(template.Resources.KMSKey.Type).toBe('AWS::KMS::Key');
    });

    test('KMS Key should have proper key policy', () => {
      const key = template.Resources.KMSKey;
      expect(key.Properties.KeyPolicy).toBeDefined();
      expect(key.Properties.KeyPolicy.Statement).toBeDefined();
      expect(Array.isArray(key.Properties.KeyPolicy.Statement)).toBe(true);
    });

    test('KMS Key should allow RDS, ElastiCache, and EFS services', () => {
      const key = template.Resources.KMSKey;
      const serviceStatement = key.Properties.KeyPolicy.Statement.find(
        (s: any) => s.Sid === 'Allow services to use the key'
      );
      expect(serviceStatement).toBeDefined();
      expect(serviceStatement.Principal.Service).toContain('rds.amazonaws.com');
      expect(serviceStatement.Principal.Service).toContain('elasticache.amazonaws.com');
      expect(serviceStatement.Principal.Service).toContain('elasticfilesystem.amazonaws.com');
    });

    test('should have KMS Key Alias', () => {
      expect(template.Resources.KMSKeyAlias).toBeDefined();
      expect(template.Resources.KMSKeyAlias.Type).toBe('AWS::KMS::Alias');
    });
  });

  describe('RDS Configuration', () => {
    test('should have RDS instance', () => {
      expect(template.Resources.RDSInstance).toBeDefined();
      expect(template.Resources.RDSInstance.Type).toBe('AWS::RDS::DBInstance');
    });

    test('RDS should use PostgreSQL engine', () => {
      const rds = template.Resources.RDSInstance;
      expect(rds.Properties.Engine).toBe('postgres');
    });

    test('RDS should have Multi-AZ enabled', () => {
      const rds = template.Resources.RDSInstance;
      expect(rds.Properties.MultiAZ).toBe(true);
    });

    test('RDS should have encryption enabled', () => {
      const rds = template.Resources.RDSInstance;
      expect(rds.Properties.StorageEncrypted).toBe(true);
    });

    test('RDS should use KMS encryption', () => {
      const rds = template.Resources.RDSInstance;
      expect(rds.Properties.KmsKeyId).toBeDefined();
    });

    test('RDS should have backup retention configured', () => {
      const rds = template.Resources.RDSInstance;
      expect(rds.Properties.BackupRetentionPeriod).toBe(7);
    });

    test('RDS should have deletion protection disabled for destroyability', () => {
      const rds = template.Resources.RDSInstance;
      expect(rds.Properties.DeletionProtection).toBe(false);
    });

    test('RDS should have CloudWatch logs enabled', () => {
      const rds = template.Resources.RDSInstance;
      expect(rds.Properties.EnableCloudwatchLogsExports).toBeDefined();
      expect(rds.Properties.EnableCloudwatchLogsExports).toContain('postgresql');
    });

    test('should have RDS security group', () => {
      expect(template.Resources.RDSSecurityGroup).toBeDefined();
      expect(template.Resources.RDSSecurityGroup.Type).toBe('AWS::EC2::SecurityGroup');
    });

    test('should have DB subnet group', () => {
      expect(template.Resources.DBSubnetGroup).toBeDefined();
      expect(template.Resources.DBSubnetGroup.Type).toBe('AWS::RDS::DBSubnetGroup');
    });
  });

  describe('EFS Configuration', () => {
    test('should have EFS file system', () => {
      expect(template.Resources.EFSFileSystem).toBeDefined();
      expect(template.Resources.EFSFileSystem.Type).toBe('AWS::EFS::FileSystem');
    });

    test('EFS should have encryption enabled', () => {
      const efs = template.Resources.EFSFileSystem;
      expect(efs.Properties.Encrypted).toBe(true);
    });

    test('EFS should use KMS encryption', () => {
      const efs = template.Resources.EFSFileSystem;
      expect(efs.Properties.KmsKeyId).toBeDefined();
    });

    test('EFS should have lifecycle policies', () => {
      const efs = template.Resources.EFSFileSystem;
      expect(efs.Properties.LifecyclePolicies).toBeDefined();
      expect(Array.isArray(efs.Properties.LifecyclePolicies)).toBe(true);
    });

    test('should have EFS mount targets', () => {
      expect(template.Resources.EFSMountTarget1).toBeDefined();
      expect(template.Resources.EFSMountTarget2).toBeDefined();
    });

    test('should have EFS security group', () => {
      expect(template.Resources.EFSSecurityGroup).toBeDefined();
      expect(template.Resources.EFSSecurityGroup.Type).toBe('AWS::EC2::SecurityGroup');
    });
  });

  describe('ElastiCache Configuration', () => {
    test('should have ElastiCache replication group', () => {
      expect(template.Resources.CacheReplicationGroup).toBeDefined();
      expect(template.Resources.CacheReplicationGroup.Type).toBe('AWS::ElastiCache::ReplicationGroup');
    });

    test('ElastiCache should use Redis engine', () => {
      const cache = template.Resources.CacheReplicationGroup;
      expect(cache.Properties.Engine).toBe('redis');
    });

    test('ElastiCache should have Multi-AZ enabled', () => {
      const cache = template.Resources.CacheReplicationGroup;
      expect(cache.Properties.MultiAZEnabled).toBe(true);
    });

    test('ElastiCache should have automatic failover enabled', () => {
      const cache = template.Resources.CacheReplicationGroup;
      expect(cache.Properties.AutomaticFailoverEnabled).toBe(true);
    });

    test('ElastiCache should have at-rest encryption enabled', () => {
      const cache = template.Resources.CacheReplicationGroup;
      expect(cache.Properties.AtRestEncryptionEnabled).toBe(true);
    });

    test('ElastiCache should have transit encryption enabled', () => {
      const cache = template.Resources.CacheReplicationGroup;
      expect(cache.Properties.TransitEncryptionEnabled).toBe(true);
    });

    test('ElastiCache should use KMS encryption', () => {
      const cache = template.Resources.CacheReplicationGroup;
      expect(cache.Properties.KmsKeyId).toBeDefined();
    });

    test('should have cache subnet group', () => {
      expect(template.Resources.CacheSubnetGroup).toBeDefined();
      expect(template.Resources.CacheSubnetGroup.Type).toBe('AWS::ElastiCache::SubnetGroup');
    });

    test('should have cache security group', () => {
      expect(template.Resources.CacheSecurityGroup).toBeDefined();
      expect(template.Resources.CacheSecurityGroup.Type).toBe('AWS::EC2::SecurityGroup');
    });
  });

  describe('ECS Configuration', () => {
    test('should have ECS cluster', () => {
      expect(template.Resources.ECSCluster).toBeDefined();
      expect(template.Resources.ECSCluster.Type).toBe('AWS::ECS::Cluster');
    });

    test('ECS cluster should support Fargate', () => {
      const cluster = template.Resources.ECSCluster;
      expect(cluster.Properties.CapacityProviders).toContain('FARGATE');
    });

    test('ECS cluster should have Container Insights enabled', () => {
      const cluster = template.Resources.ECSCluster;
      const insights = cluster.Properties.ClusterSettings.find(
        (s: any) => s.Name === 'containerInsights'
      );
      expect(insights).toBeDefined();
      expect(insights.Value).toBe('enabled');
    });

    test('should have ECS task definition', () => {
      expect(template.Resources.ECSTaskDefinition).toBeDefined();
      expect(template.Resources.ECSTaskDefinition.Type).toBe('AWS::ECS::TaskDefinition');
    });

    test('ECS task should use Fargate', () => {
      const task = template.Resources.ECSTaskDefinition;
      expect(task.Properties.RequiresCompatibilities).toContain('FARGATE');
    });

    test('ECS task should have EFS volume configured', () => {
      const task = template.Resources.ECSTaskDefinition;
      expect(task.Properties.Volumes).toBeDefined();
      const efsVolume = task.Properties.Volumes.find(
        (v: any) => v.Name === 'efs-storage'
      );
      expect(efsVolume).toBeDefined();
      expect(efsVolume.EFSVolumeConfiguration).toBeDefined();
      expect(efsVolume.EFSVolumeConfiguration.TransitEncryption).toBe('ENABLED');
    });

    test('should have ECS service', () => {
      expect(template.Resources.ECSService).toBeDefined();
      expect(template.Resources.ECSService.Type).toBe('AWS::ECS::Service');
    });

    test('ECS service should have desired count of 2', () => {
      const service = template.Resources.ECSService;
      expect(service.Properties.DesiredCount).toBe(2);
    });

    test('should have ECS task execution role', () => {
      expect(template.Resources.ECSTaskExecutionRole).toBeDefined();
      expect(template.Resources.ECSTaskExecutionRole.Type).toBe('AWS::IAM::Role');
    });

    test('should have ECS task role', () => {
      expect(template.Resources.ECSTaskRole).toBeDefined();
      expect(template.Resources.ECSTaskRole.Type).toBe('AWS::IAM::Role');
    });

    test('ECS task role should have EFS access policy', () => {
      const role = template.Resources.ECSTaskRole;
      const efsPolicy = role.Properties.Policies.find(
        (p: any) => p.PolicyName === 'EFSAccess'
      );
      expect(efsPolicy).toBeDefined();
    });

    test('ECS task role should have KMS access policy', () => {
      const role = template.Resources.ECSTaskRole;
      const kmsPolicy = role.Properties.Policies.find(
        (p: any) => p.PolicyName === 'KMSAccess'
      );
      expect(kmsPolicy).toBeDefined();
    });
  });

  describe('Load Balancer Configuration', () => {
    test('should have Application Load Balancer', () => {
      expect(template.Resources.ApplicationLoadBalancer).toBeDefined();
      expect(template.Resources.ApplicationLoadBalancer.Type).toBe('AWS::ElasticLoadBalancingV2::LoadBalancer');
    });

    test('ALB should be internet-facing', () => {
      const alb = template.Resources.ApplicationLoadBalancer;
      expect(alb.Properties.Scheme).toBe('internet-facing');
    });

    test('should have ALB target group', () => {
      expect(template.Resources.ALBTargetGroup).toBeDefined();
      expect(template.Resources.ALBTargetGroup.Type).toBe('AWS::ElasticLoadBalancingV2::TargetGroup');
    });

    test('ALB target group should have health checks configured', () => {
      const tg = template.Resources.ALBTargetGroup;
      expect(tg.Properties.HealthCheckEnabled).toBe(true);
      expect(tg.Properties.HealthCheckPath).toBe('/health');
    });

    test('should have ALB listener', () => {
      expect(template.Resources.ALBListener).toBeDefined();
      expect(template.Resources.ALBListener.Type).toBe('AWS::ElasticLoadBalancingV2::Listener');
    });

    test('should have ALB security group', () => {
      expect(template.Resources.ALBSecurityGroup).toBeDefined();
      expect(template.Resources.ALBSecurityGroup.Type).toBe('AWS::EC2::SecurityGroup');
    });

    test('should have ECS security group', () => {
      expect(template.Resources.ECSSecurityGroup).toBeDefined();
      expect(template.Resources.ECSSecurityGroup.Type).toBe('AWS::EC2::SecurityGroup');
    });
  });

  describe('CloudWatch Logs', () => {
    test('should have ECS log group', () => {
      expect(template.Resources.ECSLogGroup).toBeDefined();
      expect(template.Resources.ECSLogGroup.Type).toBe('AWS::Logs::LogGroup');
    });

    test('log group should have retention policy', () => {
      const logGroup = template.Resources.ECSLogGroup;
      expect(logGroup.Properties.RetentionInDays).toBe(7);
    });
  });

  describe('Resource Tagging', () => {
    test('VPC should have required tags', () => {
      const vpc = template.Resources.VPC;
      const tags = vpc.Properties.Tags;
      expect(tags).toBeDefined();
      expect(tags.some((t: any) => t.Key === 'Environment')).toBe(true);
      expect(tags.some((t: any) => t.Key === 'Application')).toBe(true);
      expect(tags.some((t: any) => t.Key === 'CostCenter')).toBe(true);
    });

    test('RDS should have required tags', () => {
      const rds = template.Resources.RDSInstance;
      const tags = rds.Properties.Tags;
      expect(tags).toBeDefined();
      expect(tags.some((t: any) => t.Key === 'Environment')).toBe(true);
      expect(tags.some((t: any) => t.Key === 'Application' && t.Value === 'StreamFlix')).toBe(true);
      expect(tags.some((t: any) => t.Key === 'CostCenter' && t.Value === 'Media')).toBe(true);
    });

    test('EFS should have required tags', () => {
      const efs = template.Resources.EFSFileSystem;
      const tags = efs.Properties.FileSystemTags;
      expect(tags).toBeDefined();
      expect(tags.some((t: any) => t.Key === 'Application' && t.Value === 'StreamFlix')).toBe(true);
    });
  });

  describe('Resource Naming with environmentSuffix', () => {
    test('RDS instance should include environmentSuffix in identifier', () => {
      const rds = template.Resources.RDSInstance;
      expect(rds.Properties.DBInstanceIdentifier).toBeDefined();
      expect(rds.Properties.DBInstanceIdentifier['Fn::Sub']).toContain('${environmentSuffix}');
    });

    test('ECS cluster should include environmentSuffix in name', () => {
      const cluster = template.Resources.ECSCluster;
      expect(cluster.Properties.ClusterName).toBeDefined();
      expect(cluster.Properties.ClusterName['Fn::Sub']).toContain('${environmentSuffix}');
    });

    test('ElastiCache should include environmentSuffix in ID', () => {
      const cache = template.Resources.CacheReplicationGroup;
      expect(cache.Properties.ReplicationGroupId).toBeDefined();
      expect(cache.Properties.ReplicationGroupId['Fn::Sub']).toContain('${environmentSuffix}');
    });

    test('IAM roles should include environmentSuffix in name', () => {
      const execRole = template.Resources.ECSTaskExecutionRole;
      expect(execRole.Properties.RoleName['Fn::Sub']).toContain('${environmentSuffix}');
    });
  });

  describe('Outputs', () => {
    test('should have all required outputs', () => {
      const expectedOutputs = [
        'VPCId',
        'RDSEndpoint',
        'RDSInstanceId',
        'EFSFileSystemId',
        'CacheEndpoint',
        'ECSClusterName',
        'ALBDNSName',
        'KMSKeyId'
      ];

      expectedOutputs.forEach(outputName => {
        expect(template.Outputs[outputName]).toBeDefined();
      });
    });

    test('outputs should have descriptions', () => {
      Object.keys(template.Outputs).forEach(outputKey => {
        const output = template.Outputs[outputKey];
        expect(output.Description).toBeDefined();
      });
    });

    test('outputs should have exports', () => {
      Object.keys(template.Outputs).forEach(outputKey => {
        const output = template.Outputs[outputKey];
        expect(output.Export).toBeDefined();
        expect(output.Export.Name).toBeDefined();
      });
    });
  });

  describe('Template Validation', () => {
    test('should have valid YAML structure', () => {
      expect(template).toBeDefined();
      expect(typeof template).toBe('object');
    });

    test('should not have any Retain deletion policies', () => {
      Object.keys(template.Resources).forEach(resourceKey => {
        const resource = template.Resources[resourceKey];
        if (resource.DeletionPolicy) {
          expect(resource.DeletionPolicy).not.toBe('Retain');
        }
        if (resource.UpdateReplacePolicy) {
          expect(resource.UpdateReplacePolicy).not.toBe('Retain');
        }
      });
    });

    test('should have all major resource types', () => {
      const resources = template.Resources;
      const resourceTypes = Object.keys(resources).map(key => resources[key].Type);

      expect(resourceTypes).toContain('AWS::RDS::DBInstance');
      expect(resourceTypes).toContain('AWS::EFS::FileSystem');
      expect(resourceTypes).toContain('AWS::ElastiCache::ReplicationGroup');
      expect(resourceTypes).toContain('AWS::ECS::Cluster');
      expect(resourceTypes).toContain('AWS::EC2::VPC');
      expect(resourceTypes).toContain('AWS::KMS::Key');
    });
  });
});
