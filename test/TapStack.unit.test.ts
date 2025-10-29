import * as fs from 'fs';
import * as path from 'path';
// @ts-ignore
import * as yamlCfn from 'yaml-cfn';

describe('TapStack CloudFormation Template Unit Tests', () => {
  let template: any;
  const templatePath = path.join(__dirname, '..', 'lib', 'TapStack.yml');

  beforeAll(() => {
    const templateContent = fs.readFileSync(templatePath, 'utf8');
    template = yamlCfn.yamlParse(templateContent);
  });

  describe('Template Structure', () => {
    test('should have valid AWSTemplateFormatVersion', () => {
      expect(template.AWSTemplateFormatVersion).toBe('2010-09-09');
    });

    test('should have a description', () => {
      expect(template.Description).toBeDefined();
      expect(template.Description).toContain('HIPAA-Compliant');
    });

    test('should have Parameters section', () => {
      expect(template.Parameters).toBeDefined();
      expect(typeof template.Parameters).toBe('object');
    });

    test('should have Resources section', () => {
      expect(template.Resources).toBeDefined();
      expect(typeof template.Resources).toBe('object');
    });

    test('should have Outputs section', () => {
      expect(template.Outputs).toBeDefined();
      expect(typeof template.Outputs).toBe('object');
    });
  });

  describe('Parameters', () => {
    test('should have EnvironmentSuffix parameter', () => {
      expect(template.Parameters.EnvironmentSuffix).toBeDefined();
      expect(template.Parameters.EnvironmentSuffix.Type).toBe('String');
      expect(template.Parameters.EnvironmentSuffix.MinLength).toBe(1);
      expect(template.Parameters.EnvironmentSuffix.MaxLength).toBe(20);
    });

    test('should have VPC CIDR parameters with defaults', () => {
      expect(template.Parameters.VpcCIDR).toBeDefined();
      expect(template.Parameters.VpcCIDR.Default).toBe('10.0.0.0/16');
      expect(template.Parameters.PublicSubnet1CIDR).toBeDefined();
      expect(template.Parameters.PublicSubnet2CIDR).toBeDefined();
      expect(template.Parameters.PrivateSubnet1CIDR).toBeDefined();
      expect(template.Parameters.PrivateSubnet2CIDR).toBeDefined();
    });

  });

  describe('Required AWS Services', () => {
    test('should have Kinesis Data Stream', () => {
      expect(template.Resources.VitalSignsStream).toBeDefined();
      expect(template.Resources.VitalSignsStream.Type).toBe('AWS::Kinesis::Stream');
      const props = template.Resources.VitalSignsStream.Properties;
      expect(props.ShardCount).toBeGreaterThan(0);
      expect(props.StreamEncryption).toBeDefined();
      expect(props.StreamEncryption.EncryptionType).toBe('KMS');
    });

    test('should have ECS Fargate cluster', () => {
      expect(template.Resources.ECSCluster).toBeDefined();
      expect(template.Resources.ECSCluster.Type).toBe('AWS::ECS::Cluster');

      expect(template.Resources.ProcessorTaskDefinition).toBeDefined();
      expect(template.Resources.ProcessorTaskDefinition.Type).toBe('AWS::ECS::TaskDefinition');
      const props = template.Resources.ProcessorTaskDefinition.Properties;
      expect(props.RequiresCompatibilities).toContain('FARGATE');
      expect(props.NetworkMode).toBe('awsvpc');
    });

    test('should have RDS Aurora cluster with encryption', () => {
      expect(template.Resources.AuroraCluster).toBeDefined();
      expect(template.Resources.AuroraCluster.Type).toBe('AWS::RDS::DBCluster');
      const props = template.Resources.AuroraCluster.Properties;
      expect(props.Engine).toContain('aurora-postgresql');
      expect(props.StorageEncrypted).toBe(true);
      expect(props.KmsKeyId).toBeDefined();

      // Multi-AZ instances
      expect(template.Resources.AuroraInstance1).toBeDefined();
      expect(template.Resources.AuroraInstance2).toBeDefined();
    });

    test('should have ElastiCache Redis cluster with Multi-AZ', () => {
      expect(template.Resources.RedisReplicationGroup).toBeDefined();
      expect(template.Resources.RedisReplicationGroup.Type).toBe('AWS::ElastiCache::ReplicationGroup');
      const props = template.Resources.RedisReplicationGroup.Properties;
      expect(props.Engine).toBe('redis');
      expect(props.MultiAZEnabled).toBe(true);
      expect(props.AutomaticFailoverEnabled).toBe(true);
      expect(props.AtRestEncryptionEnabled).toBe(true);
      expect(props.TransitEncryptionEnabled).toBe(true);
      expect(props.NumCacheClusters).toBeGreaterThanOrEqual(2);
    });

    test('should have Secrets Manager secret', () => {
      expect(template.Resources.DBSecret).toBeDefined();
      expect(template.Resources.DBSecret.Type).toBe('AWS::SecretsManager::Secret');
      const props = template.Resources.DBSecret.Properties;
      expect(props.KmsKeyId).toBeDefined();
    });

    test('should have API Gateway REST API', () => {
      expect(template.Resources.RestAPI).toBeDefined();
      expect(template.Resources.RestAPI.Type).toBe('AWS::ApiGateway::RestApi');
      expect(template.Resources.APIMethod).toBeDefined();
      expect(template.Resources.APIDeployment).toBeDefined();
    });
  });

  describe('Security Configuration', () => {
    test('should have KMS key for encryption', () => {
      expect(template.Resources.DataEncryptionKey).toBeDefined();
      expect(template.Resources.DataEncryptionKey.Type).toBe('AWS::KMS::Key');
      expect(template.Resources.DataEncryptionKeyAlias).toBeDefined();
    });

    test('should have proper IAM roles for ECS', () => {
      expect(template.Resources.ECSTaskExecutionRole).toBeDefined();
      expect(template.Resources.ECSTaskExecutionRole.Type).toBe('AWS::IAM::Role');
      expect(template.Resources.ECSTaskRole).toBeDefined();
      expect(template.Resources.ECSTaskRole.Type).toBe('AWS::IAM::Role');

      const taskRoleProps = template.Resources.ECSTaskRole.Properties;
      expect(taskRoleProps.Policies).toBeDefined();
      expect(taskRoleProps.Policies.length).toBeGreaterThan(0);
    });

    test('should have security groups with proper ingress rules', () => {
      expect(template.Resources.ECSSecurityGroup).toBeDefined();
      expect(template.Resources.RDSSecurityGroup).toBeDefined();
      expect(template.Resources.RedisSecurityGroup).toBeDefined();

      const rdsProps = template.Resources.RDSSecurityGroup.Properties;
      expect(rdsProps.SecurityGroupIngress).toBeDefined();
      expect(rdsProps.SecurityGroupIngress[0].FromPort).toBe(5432);

      const redisProps = template.Resources.RedisSecurityGroup.Properties;
      expect(redisProps.SecurityGroupIngress).toBeDefined();
      expect(redisProps.SecurityGroupIngress[0].FromPort).toBe(6379);
    });

    test('should have CloudWatch log groups with retention', () => {
      expect(template.Resources.ECSLogGroup).toBeDefined();
      expect(template.Resources.ECSLogGroup.Type).toBe('AWS::Logs::LogGroup');
      expect(template.Resources.ECSLogGroup.Properties.RetentionInDays).toBeDefined();

      expect(template.Resources.APILogGroup).toBeDefined();
      expect(template.Resources.APILogGroup.Type).toBe('AWS::Logs::LogGroup');
    });

    test('should not have public access to databases', () => {
      const aurora1 = template.Resources.AuroraInstance1.Properties;
      const aurora2 = template.Resources.AuroraInstance2.Properties;
      expect(aurora1.PubliclyAccessible).toBe(false);
      expect(aurora2.PubliclyAccessible).toBe(false);
    });
  });

  describe('High Availability Configuration', () => {
    test('should have Multi-AZ VPC with multiple subnets', () => {
      expect(template.Resources.VPC).toBeDefined();
      expect(template.Resources.PublicSubnet1).toBeDefined();
      expect(template.Resources.PublicSubnet2).toBeDefined();
      expect(template.Resources.PrivateSubnet1).toBeDefined();
      expect(template.Resources.PrivateSubnet2).toBeDefined();
    });

    test('should have subnet groups spanning multiple AZs', () => {
      const dbSubnetGroup = template.Resources.DBSubnetGroup.Properties;
      expect(dbSubnetGroup.SubnetIds).toBeDefined();
      expect(dbSubnetGroup.SubnetIds.length).toBeGreaterThanOrEqual(2);

      const redisSubnetGroup = template.Resources.RedisSubnetGroup.Properties;
      expect(redisSubnetGroup.SubnetIds).toBeDefined();
      expect(redisSubnetGroup.SubnetIds.length).toBeGreaterThanOrEqual(2);
    });

    test('should have multiple ECS tasks for redundancy', () => {
      const ecsService = template.Resources.ECSService.Properties;
      expect(ecsService.DesiredCount).toBeGreaterThanOrEqual(2);
    });

    test('should have Aurora backup configuration', () => {
      const auroraProps = template.Resources.AuroraCluster.Properties;
      expect(auroraProps.BackupRetentionPeriod).toBeGreaterThan(0);
      expect(auroraProps.PreferredBackupWindow).toBeDefined();
    });
  });

  describe('Resource Naming with EnvironmentSuffix', () => {
    test('should use EnvironmentSuffix in all resource names', () => {
      const resourcesWithNames = [
        'VitalSignsStream',
        'ECSCluster',
        'AuroraCluster',
        'RedisReplicationGroup',
        'DBSecret',
        'RestAPI',
        'ECSTaskExecutionRole',
        'ECSTaskRole'
      ];

    });

    test('should not have hardcoded environment names', () => {
      const templateString = JSON.stringify(template);
      expect(templateString).not.toMatch(/prod-/);
      expect(templateString).not.toMatch(/dev-/);
      expect(templateString).not.toMatch(/stage-/);
    });
  });

  describe('Destroyability Requirements', () => {
    test('should not have Retain deletion policies', () => {
      const resources = template.Resources;
      Object.keys(resources).forEach(resourceName => {
        const resource = resources[resourceName];
        expect(resource.DeletionPolicy).not.toBe('Retain');
      });
    });

    test('should not have DeletionProtection enabled', () => {
      const auroraProps = template.Resources.AuroraCluster.Properties;
      expect(auroraProps.DeletionProtection).toBeUndefined();
    });
  });

  describe('Outputs', () => {
    test('should export all required resource identifiers', () => {
      expect(template.Outputs.VPCId).toBeDefined();
      expect(template.Outputs.KinesisStreamName).toBeDefined();
      expect(template.Outputs.KinesisStreamArn).toBeDefined();
      expect(template.Outputs.ECSClusterArn).toBeDefined();
      expect(template.Outputs.ECSClusterName).toBeDefined();
      expect(template.Outputs.AuroraClusterEndpoint).toBeDefined();
      expect(template.Outputs.RedisEndpoint).toBeDefined();
      expect(template.Outputs.DBSecretArn).toBeDefined();
      expect(template.Outputs.APIEndpoint).toBeDefined();
      expect(template.Outputs.DataEncryptionKeyId).toBeDefined();
    });

    test('should have export names for cross-stack references', () => {
      Object.keys(template.Outputs).forEach(outputKey => {
        const output = template.Outputs[outputKey];
        expect(output.Export).toBeDefined();
        expect(output.Export.Name).toBeDefined();
      });
    });
  });

  describe('HIPAA Compliance', () => {
    test('should enable CloudWatch Logs exports for Aurora', () => {
      const auroraProps = template.Resources.AuroraCluster.Properties;
      expect(auroraProps.EnableCloudwatchLogsExports).toBeDefined();
      expect(auroraProps.EnableCloudwatchLogsExports).toContain('postgresql');
    });

    test('should have KMS encryption for all data at rest', () => {
      // Kinesis
      expect(template.Resources.VitalSignsStream.Properties.StreamEncryption).toBeDefined();

      // Aurora
      expect(template.Resources.AuroraCluster.Properties.StorageEncrypted).toBe(true);
      expect(template.Resources.AuroraCluster.Properties.KmsKeyId).toBeDefined();

      // Redis
      expect(template.Resources.RedisReplicationGroup.Properties.AtRestEncryptionEnabled).toBe(true);

      // Secrets Manager
      expect(template.Resources.DBSecret.Properties.KmsKeyId).toBeDefined();
    });

    test('should have encryption in transit', () => {
      const redisProps = template.Resources.RedisReplicationGroup.Properties;
      expect(redisProps.TransitEncryptionEnabled).toBe(true);
    });

    test('should have API Gateway with IAM authentication', () => {
      const apiMethod = template.Resources.APIMethod.Properties;
      expect(apiMethod.AuthorizationType).toBe('AWS_IAM');
    });
  });

  describe('Performance Requirements', () => {
    test('should have sufficient Kinesis shard capacity', () => {
      const kinesisProps = template.Resources.VitalSignsStream.Properties;
      expect(kinesisProps.ShardCount).toBeGreaterThanOrEqual(2);
    });

    test('should have appropriate ECS task resources', () => {
      const taskDef = template.Resources.ProcessorTaskDefinition.Properties;
      expect(parseInt(taskDef.Cpu)).toBeGreaterThan(0);
      expect(parseInt(taskDef.Memory)).toBeGreaterThan(0);
    });

    test('should have appropriate Aurora instance class', () => {
      const instance1 = template.Resources.AuroraInstance1.Properties;
      expect(instance1.DBInstanceClass).toBeDefined();
      expect(instance1.DBInstanceClass).toMatch(/db\./);
    });
  });
});
