import fs from 'fs';
import path from 'path';

const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';

describe('TapStack CloudFormation Template - Student Records Infrastructure', () => {
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

    test('should have student records management description', () => {
      expect(template.Description).toBeDefined();
      expect(template.Description).toContain('Student Records');
      expect(template.Description).toContain('FERPA');
    });

    test('should have metadata section with parameter groups', () => {
      expect(template.Metadata).toBeDefined();
      expect(template.Metadata['AWS::CloudFormation::Interface']).toBeDefined();
      expect(template.Metadata['AWS::CloudFormation::Interface'].ParameterGroups).toBeDefined();
    });
  });

  describe('Parameters', () => {
    test('should have EnvironmentSuffix parameter', () => {
      expect(template.Parameters.EnvironmentSuffix).toBeDefined();
      expect(template.Parameters.EnvironmentSuffix.Type).toBe('String');
      expect(template.Parameters.EnvironmentSuffix.Default).toBe('dev');
    });

    test('should have database configuration parameters', () => {
      expect(template.Parameters.DBInstanceClass).toBeDefined();
      expect(template.Parameters.DBAllocatedStorage).toBeDefined();
      expect(template.Parameters.DBName).toBeDefined();
      expect(template.Parameters.DBMasterUsername).toBeDefined();
    });

    test('should have cache configuration parameters', () => {
      expect(template.Parameters.CacheNodeType).toBeDefined();
      expect(template.Parameters.CacheNodeType.AllowedValues).toContain('cache.t3.medium');
    });

    test('should have network configuration parameters', () => {
      expect(template.Parameters.VpcId).toBeDefined();
      expect(template.Parameters.PrivateSubnetIds).toBeDefined();
    });
  });

  describe('VPC and Network Resources', () => {
    test('should have VPC resource', () => {
      expect(template.Resources.VPC).toBeDefined();
      expect(template.Resources.VPC.Type).toBe('AWS::EC2::VPC');
      expect(template.Resources.VPC.DeletionPolicy).toBe('Delete');
    });

    test('should have Internet Gateway', () => {
      expect(template.Resources.InternetGateway).toBeDefined();
      expect(template.Resources.InternetGateway.Type).toBe('AWS::EC2::InternetGateway');
      expect(template.Resources.InternetGateway.DeletionPolicy).toBe('Delete');
    });

    test('should have two private subnets for Multi-AZ', () => {
      expect(template.Resources.PrivateSubnet1).toBeDefined();
      expect(template.Resources.PrivateSubnet2).toBeDefined();
      expect(template.Resources.PrivateSubnet1.Type).toBe('AWS::EC2::Subnet');
      expect(template.Resources.PrivateSubnet2.Type).toBe('AWS::EC2::Subnet');
    });

    test('private subnets should use environment suffix in name', () => {
      const subnet1Name = template.Resources.PrivateSubnet1.Properties.Tags.find(
        (t: any) => t.Key === 'Name'
      );
      expect(subnet1Name.Value['Fn::Sub']).toContain('${EnvironmentSuffix}');
    });
  });

  describe('KMS Encryption Keys', () => {
    test('should have RDS KMS key', () => {
      expect(template.Resources.RDSKMSKey).toBeDefined();
      expect(template.Resources.RDSKMSKey.Type).toBe('AWS::KMS::Key');
      expect(template.Resources.RDSKMSKey.DeletionPolicy).toBe('Delete');
      expect(template.Resources.RDSKMSKey.Properties.EnableKeyRotation).toBe(true);
    });

    test('should have ElastiCache KMS key', () => {
      expect(template.Resources.ElastiCacheKMSKey).toBeDefined();
      expect(template.Resources.ElastiCacheKMSKey.Type).toBe('AWS::KMS::Key');
      expect(template.Resources.ElastiCacheKMSKey.DeletionPolicy).toBe('Delete');
      expect(template.Resources.ElastiCacheKMSKey.Properties.EnableKeyRotation).toBe(true);
    });

    test('should have KMS key aliases with environment suffix', () => {
      expect(template.Resources.RDSKMSKeyAlias).toBeDefined();
      expect(template.Resources.ElastiCacheKMSKeyAlias).toBeDefined();
      expect(template.Resources.RDSKMSKeyAlias.Properties.AliasName['Fn::Sub']).toContain(
        '${EnvironmentSuffix}'
      );
    });
  });

  describe('Secrets Manager', () => {
    test('should have database secret', () => {
      expect(template.Resources.DBSecret).toBeDefined();
      expect(template.Resources.DBSecret.Type).toBe('AWS::SecretsManager::Secret');
      expect(template.Resources.DBSecret.DeletionPolicy).toBe('Delete');
    });

    test('should have ElastiCache auth secret', () => {
      expect(template.Resources.CacheAuthSecret).toBeDefined();
      expect(template.Resources.CacheAuthSecret.Type).toBe('AWS::SecretsManager::Secret');
      expect(template.Resources.CacheAuthSecret.DeletionPolicy).toBe('Delete');
    });

    test('secrets should use environment suffix in name', () => {
      const dbSecretName = template.Resources.DBSecret.Properties.Name['Fn::Sub'];
      const cacheSecretName = template.Resources.CacheAuthSecret.Properties.Name['Fn::Sub'];
      expect(dbSecretName).toContain('${EnvironmentSuffix}');
      expect(cacheSecretName).toContain('${EnvironmentSuffix}');
    });

    test('should have secret rotation schedule', () => {
      expect(template.Resources.SecretRotationSchedule).toBeDefined();
      expect(template.Resources.SecretRotationSchedule.Type).toBe(
        'AWS::SecretsManager::RotationSchedule'
      );
      expect(
        template.Resources.SecretRotationSchedule.Properties.RotationRules.AutomaticallyAfterDays
      ).toBe(30);
    });

    test('should have secret rotation Lambda function', () => {
      expect(template.Resources.SecretRotationLambda).toBeDefined();
      expect(template.Resources.SecretRotationLambda.Type).toBe('AWS::Lambda::Function');
      expect(template.Resources.SecretRotationLambda.Properties.Runtime).toBe('python3.11');
      expect(template.Resources.SecretRotationLambda.Properties.Timeout).toBe(300);
    });
  });

  describe('Security Groups', () => {
    test('should have three security groups', () => {
      expect(template.Resources.RDSSecurityGroup).toBeDefined();
      expect(template.Resources.ElastiCacheSecurityGroup).toBeDefined();
      expect(template.Resources.AppSecurityGroup).toBeDefined();
    });

    test('security groups should use environment suffix', () => {
      const rdsName = template.Resources.RDSSecurityGroup.Properties.GroupName['Fn::Sub'];
      const cacheName = template.Resources.ElastiCacheSecurityGroup.Properties.GroupName['Fn::Sub'];
      const appName = template.Resources.AppSecurityGroup.Properties.GroupName['Fn::Sub'];
      expect(rdsName).toContain('${EnvironmentSuffix}');
      expect(cacheName).toContain('${EnvironmentSuffix}');
      expect(appName).toContain('${EnvironmentSuffix}');
    });

    test('RDS security group should allow traffic from app security group', () => {
      const ingress = template.Resources.RDSSecurityGroup.Properties.SecurityGroupIngress[0];
      expect(ingress.FromPort).toBe(5432);
      expect(ingress.ToPort).toBe(5432);
      expect(ingress.IpProtocol).toBe('tcp');
    });

    test('ElastiCache security group should allow Redis traffic', () => {
      const ingress = template.Resources.ElastiCacheSecurityGroup.Properties.SecurityGroupIngress[0];
      expect(ingress.FromPort).toBe(6379);
      expect(ingress.ToPort).toBe(6379);
      expect(ingress.IpProtocol).toBe('tcp');
    });
  });

  describe('RDS PostgreSQL', () => {
    test('should have RDS instance', () => {
      expect(template.Resources.RDSInstance).toBeDefined();
      expect(template.Resources.RDSInstance.Type).toBe('AWS::RDS::DBInstance');
      expect(template.Resources.RDSInstance.DeletionPolicy).toBe('Delete');
    });

    test('should be Multi-AZ enabled', () => {
      expect(template.Resources.RDSInstance.Properties.MultiAZ).toBe(true);
    });

    test('should have encryption enabled', () => {
      expect(template.Resources.RDSInstance.Properties.StorageEncrypted).toBe(true);
      expect(template.Resources.RDSInstance.Properties.KmsKeyId).toEqual({ Ref: 'RDSKMSKey' });
    });

    test('should have correct PostgreSQL engine', () => {
      expect(template.Resources.RDSInstance.Properties.Engine).toBe('postgres');
      expect(template.Resources.RDSInstance.Properties.EngineVersion).toBeDefined();
    });

    test('should have deletion protection disabled', () => {
      expect(template.Resources.RDSInstance.Properties.DeletionProtection).toBe(false);
    });

    test('should have backup retention configured', () => {
      expect(template.Resources.RDSInstance.Properties.BackupRetentionPeriod).toBe(7);
      expect(template.Resources.RDSInstance.Properties.PreferredBackupWindow).toBeDefined();
    });

    test('should have CloudWatch logs enabled', () => {
      expect(template.Resources.RDSInstance.Properties.EnableCloudwatchLogsExports).toContain(
        'postgresql'
      );
      expect(template.Resources.RDSInstance.Properties.EnableCloudwatchLogsExports).toContain(
        'upgrade'
      );
    });

    test('should use Secrets Manager for credentials', () => {
      const masterPassword =
        template.Resources.RDSInstance.Properties.MasterUserPassword['Fn::Sub'];
      expect(masterPassword).toContain('resolve:secretsmanager');
    });

    test('should have IAM database authentication enabled', () => {
      expect(template.Resources.RDSInstance.Properties.EnableIAMDatabaseAuthentication).toBe(true);
    });
  });

  describe('ElastiCache Redis', () => {
    test('should have ElastiCache replication group', () => {
      expect(template.Resources.ElastiCacheReplicationGroup).toBeDefined();
      expect(template.Resources.ElastiCacheReplicationGroup.Type).toBe(
        'AWS::ElastiCache::ReplicationGroup'
      );
      expect(template.Resources.ElastiCacheReplicationGroup.DeletionPolicy).toBe('Delete');
    });

    test('should have automatic failover and Multi-AZ enabled', () => {
      expect(template.Resources.ElastiCacheReplicationGroup.Properties.AutomaticFailoverEnabled).toBe(
        true
      );
      expect(template.Resources.ElastiCacheReplicationGroup.Properties.MultiAZEnabled).toBe(true);
    });

    test('should have at least 2 cache clusters', () => {
      expect(template.Resources.ElastiCacheReplicationGroup.Properties.NumCacheClusters).toBe(2);
    });

    test('should have encryption at rest enabled', () => {
      expect(
        template.Resources.ElastiCacheReplicationGroup.Properties.AtRestEncryptionEnabled
      ).toBe(true);
      expect(template.Resources.ElastiCacheReplicationGroup.Properties.KmsKeyId).toEqual({
        Ref: 'ElastiCacheKMSKey',
      });
    });

    test('should have encryption in transit enabled', () => {
      expect(
        template.Resources.ElastiCacheReplicationGroup.Properties.TransitEncryptionEnabled
      ).toBe(true);
    });

    test('should have snapshot retention configured', () => {
      expect(template.Resources.ElastiCacheReplicationGroup.Properties.SnapshotRetentionLimit).toBe(
        5
      );
      expect(template.Resources.ElastiCacheReplicationGroup.Properties.SnapshotWindow).toBeDefined();
    });
  });

  describe('CloudWatch Monitoring', () => {
    test('should have RDS log group', () => {
      expect(template.Resources.RDSLogGroup).toBeDefined();
      expect(template.Resources.RDSLogGroup.Type).toBe('AWS::Logs::LogGroup');
      expect(template.Resources.RDSLogGroup.DeletionPolicy).toBe('Delete');
      expect(template.Resources.RDSLogGroup.Properties.RetentionInDays).toBe(30);
    });

    test('should have ElastiCache log group', () => {
      expect(template.Resources.ElastiCacheLogGroup).toBeDefined();
      expect(template.Resources.ElastiCacheLogGroup.Type).toBe('AWS::Logs::LogGroup');
      expect(template.Resources.ElastiCacheLogGroup.DeletionPolicy).toBe('Delete');
      expect(template.Resources.ElastiCacheLogGroup.Properties.RetentionInDays).toBe(30);
    });

    test('should have RDS CPU alarm', () => {
      expect(template.Resources.RDSCPUAlarm).toBeDefined();
      expect(template.Resources.RDSCPUAlarm.Type).toBe('AWS::CloudWatch::Alarm');
      expect(template.Resources.RDSCPUAlarm.Properties.MetricName).toBe('CPUUtilization');
      expect(template.Resources.RDSCPUAlarm.Properties.Threshold).toBe(80);
    });

    test('should have RDS connections alarm', () => {
      expect(template.Resources.RDSConnectionsAlarm).toBeDefined();
      expect(template.Resources.RDSConnectionsAlarm.Properties.MetricName).toBe(
        'DatabaseConnections'
      );
    });

    test('should have ElastiCache CPU alarm', () => {
      expect(template.Resources.ElastiCacheCPUAlarm).toBeDefined();
      expect(template.Resources.ElastiCacheCPUAlarm.Properties.Threshold).toBe(75);
    });

    test('should have ElastiCache memory alarm', () => {
      expect(template.Resources.ElastiCacheMemoryAlarm).toBeDefined();
      expect(template.Resources.ElastiCacheMemoryAlarm.Properties.MetricName).toBe(
        'DatabaseMemoryUsagePercentage'
      );
    });
  });

  describe('Outputs', () => {
    test('should have RDS endpoint output', () => {
      expect(template.Outputs.RDSInstanceEndpoint).toBeDefined();
      expect(template.Outputs.RDSInstanceEndpoint.Description).toContain('endpoint');
    });

    test('should have ElastiCache endpoint output', () => {
      expect(template.Outputs.ElastiCacheEndpoint).toBeDefined();
      expect(template.Outputs.ElastiCacheReaderEndpoint).toBeDefined();
    });

    test('should have secrets ARN outputs', () => {
      expect(template.Outputs.DBSecretArn).toBeDefined();
      expect(template.Outputs.CacheAuthSecretArn).toBeDefined();
    });

    test('should have KMS key outputs', () => {
      expect(template.Outputs.RDSKMSKeyId).toBeDefined();
      expect(template.Outputs.ElastiCacheKMSKeyId).toBeDefined();
    });

    test('should have environment suffix output', () => {
      expect(template.Outputs.EnvironmentSuffix).toBeDefined();
      expect(template.Outputs.EnvironmentSuffix.Value).toEqual({ Ref: 'EnvironmentSuffix' });
    });
  });

  describe('Resource Deletion Policies', () => {
    test('all resources with deletion policy should be set to Delete', () => {
      const resourcesWithDeletionPolicy = Object.keys(template.Resources).filter(key => {
        return template.Resources[key].DeletionPolicy;
      });

      resourcesWithDeletionPolicy.forEach(resourceKey => {
        expect(template.Resources[resourceKey].DeletionPolicy).toBe('Delete');
      });
    });

    test('RDS should not have deletion protection', () => {
      expect(template.Resources.RDSInstance.Properties.DeletionProtection).toBe(false);
    });
  });

  describe('Resource Naming with Environment Suffix', () => {
    test('at least 80% of named resources should use environment suffix', () => {
      const namedResources: string[] = [];
      const resourcesWithSuffix: string[] = [];

      Object.keys(template.Resources).forEach(key => {
        const resource = template.Resources[key];
        let hasName = false;
        let usesSuffix = false;

        // Check various name properties
        if (resource.Properties) {
          const props = resource.Properties;
          if (
            props.Name ||
            props.TableName ||
            props.BucketName ||
            props.FunctionName ||
            props.RoleName ||
            props.DBInstanceIdentifier ||
            props.ReplicationGroupId ||
            props.DBSubnetGroupName ||
            props.CacheSubnetGroupName ||
            props.GroupName ||
            props.AliasName ||
            props.LogGroupName ||
            props.AlarmName
          ) {
            hasName = true;
            const nameValue =
              props.Name ||
              props.TableName ||
              props.BucketName ||
              props.FunctionName ||
              props.RoleName ||
              props.DBInstanceIdentifier ||
              props.ReplicationGroupId ||
              props.DBSubnetGroupName ||
              props.CacheSubnetGroupName ||
              props.GroupName ||
              props.AliasName ||
              props.LogGroupName ||
              props.AlarmName;

            if (
              nameValue &&
              typeof nameValue === 'object' &&
              nameValue['Fn::Sub'] &&
              nameValue['Fn::Sub'].includes('${EnvironmentSuffix}')
            ) {
              usesSuffix = true;
            }
          }
        }

        if (hasName) {
          namedResources.push(key);
          if (usesSuffix) {
            resourcesWithSuffix.push(key);
          }
        }
      });

      const percentage = (resourcesWithSuffix.length / namedResources.length) * 100;
      expect(percentage).toBeGreaterThanOrEqual(80);
    });
  });
});
