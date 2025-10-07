import fs from 'fs';
import path from 'path';

describe('E-Learning RDS MySQL CloudFormation Template', () => {
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
      expect(template.Description).toContain('E-Learning Platform RDS MySQL Database Infrastructure');
    });

    test('should have all required sections', () => {
      expect(template.Parameters).toBeDefined();
      expect(template.Mappings).toBeDefined();
      expect(template.Resources).toBeDefined();
      expect(template.Outputs).toBeDefined();
    });
  });

  describe('Parameters', () => {
    test('should have EnvironmentSuffix parameter', () => {
      expect(template.Parameters.EnvironmentSuffix).toBeDefined();
      expect(template.Parameters.EnvironmentSuffix.Type).toBe('String');
      expect(template.Parameters.EnvironmentSuffix.Default).toBe('dev');
    });

    test('should have DBMasterUsername parameter', () => {
      expect(template.Parameters.DBMasterUsername).toBeDefined();
      expect(template.Parameters.DBMasterUsername.Type).toBe('String');
      expect(template.Parameters.DBMasterUsername.Default).toBe('admin');
      expect(template.Parameters.DBMasterUsername.AllowedPattern).toBe('[a-zA-Z][a-zA-Z0-9]*');
    });

    test('should not expose password as template parameter', () => {
      expect(template.Parameters.DBMasterPassword).toBeUndefined();
    });
  });

  describe('Mappings', () => {
    test('should have SubnetConfig mapping', () => {
      expect(template.Mappings.SubnetConfig).toBeDefined();
    });

    test('should have correct VPC CIDR block', () => {
      expect(template.Mappings.SubnetConfig.VPC.CIDR).toBe('10.7.0.0/16');
    });

    test('should have correct private subnet CIDR blocks', () => {
      expect(template.Mappings.SubnetConfig.PrivateSubnet1.CIDR).toBe('10.7.10.0/24');
      expect(template.Mappings.SubnetConfig.PrivateSubnet2.CIDR).toBe('10.7.20.0/24');
    });
  });

  describe('VPC Resources', () => {
    test('should have VPC resource', () => {
      expect(template.Resources.VPC).toBeDefined();
      expect(template.Resources.VPC.Type).toBe('AWS::EC2::VPC');
    });

    test('VPC should have correct properties', () => {
      const vpc = template.Resources.VPC.Properties;
      expect(vpc.EnableDnsHostnames).toBe(true);
      expect(vpc.EnableDnsSupport).toBe(true);
      expect(vpc.CidrBlock['Fn::FindInMap']).toEqual(['SubnetConfig', 'VPC', 'CIDR']);
    });

    test('should have two private subnets', () => {
      expect(template.Resources.PrivateSubnet1).toBeDefined();
      expect(template.Resources.PrivateSubnet2).toBeDefined();
      expect(template.Resources.PrivateSubnet1.Type).toBe('AWS::EC2::Subnet');
      expect(template.Resources.PrivateSubnet2.Type).toBe('AWS::EC2::Subnet');
    });

    test('subnets should be in different availability zones', () => {
      const subnet1 = template.Resources.PrivateSubnet1.Properties;
      const subnet2 = template.Resources.PrivateSubnet2.Properties;
      expect(subnet1.AvailabilityZone['Fn::Select'][0]).toBe(0);
      expect(subnet2.AvailabilityZone['Fn::Select'][0]).toBe(1);
    });

    test('subnets should use environment suffix in names', () => {
      const subnet1Tags = template.Resources.PrivateSubnet1.Properties.Tags;
      const subnet2Tags = template.Resources.PrivateSubnet2.Properties.Tags;
      expect(subnet1Tags[0].Value['Fn::Sub']).toContain('${EnvironmentSuffix}');
      expect(subnet2Tags[0].Value['Fn::Sub']).toContain('${EnvironmentSuffix}');
    });
  });

  describe('RDS Database Resources', () => {
    test('should have DB subnet group', () => {
      expect(template.Resources.DBSubnetGroup).toBeDefined();
      expect(template.Resources.DBSubnetGroup.Type).toBe('AWS::RDS::DBSubnetGroup');
    });

    test('DB subnet group should reference both private subnets', () => {
      const subnetGroup = template.Resources.DBSubnetGroup.Properties;
      expect(subnetGroup.SubnetIds).toHaveLength(2);
      expect(subnetGroup.SubnetIds[0].Ref).toBe('PrivateSubnet1');
      expect(subnetGroup.SubnetIds[1].Ref).toBe('PrivateSubnet2');
    });

    test('should have MySQL database instance', () => {
      expect(template.Resources.MySQLDatabase).toBeDefined();
      expect(template.Resources.MySQLDatabase.Type).toBe('AWS::RDS::DBInstance');
    });

    test('MySQL database should have correct configuration', () => {
      const db = template.Resources.MySQLDatabase.Properties;
      expect(db.Engine).toBe('mysql');
      expect(db.EngineVersion).toBe('8.0.39');
      expect(db.DBInstanceClass).toBe('db.t3.micro');
      expect(db.AllocatedStorage).toBe('20');
      expect(db.StorageType).toBe('gp3');
      expect(db.MultiAZ).toBe(false);
    });

    test('MySQL database should have encryption enabled', () => {
      const db = template.Resources.MySQLDatabase.Properties;
      expect(db.StorageEncrypted).toBe(true);
      expect(db.KmsKeyId.Ref).toBe('KMSKey');
    });

    test('MySQL database should have backup configuration', () => {
      const db = template.Resources.MySQLDatabase.Properties;
      expect(db.BackupRetentionPeriod).toBe(7);
      expect(db.PreferredBackupWindow).toBe('03:00-04:00');
      expect(db.PreferredMaintenanceWindow).toBe('sun:04:00-sun:05:00');
    });

    test('MySQL database should have monitoring enabled', () => {
      const db = template.Resources.MySQLDatabase.Properties;
      expect(db.MonitoringInterval).toBe(60);
      expect(db.MonitoringRoleArn['Fn::GetAtt']).toEqual(['EnhancedMonitoringRole', 'Arn']);
      expect(db.EnableCloudwatchLogsExports).toContain('error');
      expect(db.EnableCloudwatchLogsExports).toContain('general');
      expect(db.EnableCloudwatchLogsExports).toContain('slowquery');
    });

    test('MySQL database should use environment suffix in identifier', () => {
      const db = template.Resources.MySQLDatabase.Properties;
      expect(db.DBInstanceIdentifier['Fn::Sub']).toContain('${EnvironmentSuffix}');
    });
  });

  describe('Security Resources', () => {
    test('should have database security group', () => {
      expect(template.Resources.DatabaseSecurityGroup).toBeDefined();
      expect(template.Resources.DatabaseSecurityGroup.Type).toBe('AWS::EC2::SecurityGroup');
    });

    test('security group should allow MySQL traffic on port 3306', () => {
      const sg = template.Resources.DatabaseSecurityGroup.Properties;
      expect(sg.SecurityGroupIngress).toHaveLength(1);
      expect(sg.SecurityGroupIngress[0].IpProtocol).toBe('tcp');
      expect(sg.SecurityGroupIngress[0].FromPort).toBe(3306);
      expect(sg.SecurityGroupIngress[0].ToPort).toBe(3306);
      expect(sg.SecurityGroupIngress[0].CidrIp).toBe('10.7.0.0/16');
    });

    test('should have KMS key for encryption', () => {
      expect(template.Resources.KMSKey).toBeDefined();
      expect(template.Resources.KMSKey.Type).toBe('AWS::KMS::Key');
    });

    test('KMS key should have proper key policy', () => {
      const keyPolicy = template.Resources.KMSKey.Properties.KeyPolicy;
      expect(keyPolicy.Statement).toHaveLength(2);

      const rootStatement = keyPolicy.Statement.find((s: any) => s.Sid === 'Enable IAM User Permissions');
      expect(rootStatement.Effect).toBe('Allow');
      expect(rootStatement.Action).toBe('kms:*');

      const rdsStatement = keyPolicy.Statement.find((s: any) => s.Sid === 'Allow RDS to use the key');
      expect(rdsStatement.Effect).toBe('Allow');
      expect(rdsStatement.Principal.Service).toBe('rds.amazonaws.com');
    });

    test('should have KMS key alias', () => {
      expect(template.Resources.KMSKeyAlias).toBeDefined();
      expect(template.Resources.KMSKeyAlias.Type).toBe('AWS::KMS::Alias');
      expect(template.Resources.KMSKeyAlias.Properties.AliasName['Fn::Sub']).toContain('${EnvironmentSuffix}');
    });
  });

  describe('S3 Backup Resources', () => {
    test('should have S3 backup bucket', () => {
      expect(template.Resources.S3BackupBucket).toBeDefined();
      expect(template.Resources.S3BackupBucket.Type).toBe('AWS::S3::Bucket');
    });

    test('S3 bucket should have encryption enabled', () => {
      const bucket = template.Resources.S3BackupBucket.Properties;
      expect(bucket.BucketEncryption.ServerSideEncryptionConfiguration[0]
        .ServerSideEncryptionByDefault.SSEAlgorithm).toBe('AES256');
    });

    test('S3 bucket should have lifecycle policy', () => {
      const bucket = template.Resources.S3BackupBucket.Properties;
      expect(bucket.LifecycleConfiguration.Rules).toHaveLength(1);
      expect(bucket.LifecycleConfiguration.Rules[0].ExpirationInDays).toBe(30);
      expect(bucket.LifecycleConfiguration.Rules[0].NoncurrentVersionExpirationInDays).toBe(7);
    });

    test('S3 bucket should have versioning enabled', () => {
      const bucket = template.Resources.S3BackupBucket.Properties;
      expect(bucket.VersioningConfiguration.Status).toBe('Enabled');
    });

    test('S3 bucket should block public access', () => {
      const bucket = template.Resources.S3BackupBucket.Properties;
      expect(bucket.PublicAccessBlockConfiguration.BlockPublicAcls).toBe(true);
      expect(bucket.PublicAccessBlockConfiguration.BlockPublicPolicy).toBe(true);
      expect(bucket.PublicAccessBlockConfiguration.IgnorePublicAcls).toBe(true);
      expect(bucket.PublicAccessBlockConfiguration.RestrictPublicBuckets).toBe(true);
    });

    test('S3 bucket name should include environment suffix', () => {
      const bucket = template.Resources.S3BackupBucket.Properties;
      expect(bucket.BucketName['Fn::Sub']).toContain('${EnvironmentSuffix}');
    });
  });

  describe('IAM Resources', () => {
    test('should have enhanced monitoring role', () => {
      expect(template.Resources.EnhancedMonitoringRole).toBeDefined();
      expect(template.Resources.EnhancedMonitoringRole.Type).toBe('AWS::IAM::Role');
    });

    test('enhanced monitoring role should have correct trust policy', () => {
      const role = template.Resources.EnhancedMonitoringRole.Properties;
      const trustPolicy = role.AssumeRolePolicyDocument.Statement[0];
      expect(trustPolicy.Effect).toBe('Allow');
      expect(trustPolicy.Principal.Service).toBe('monitoring.rds.amazonaws.com');
      expect(trustPolicy.Action).toBe('sts:AssumeRole');
    });

    test('enhanced monitoring role should have RDS monitoring policy', () => {
      const role = template.Resources.EnhancedMonitoringRole.Properties;
      expect(role.ManagedPolicyArns).toContain(
        'arn:aws:iam::aws:policy/service-role/AmazonRDSEnhancedMonitoringRole'
      );
    });
  });

  describe('CloudWatch Alarms', () => {
    test('should have high CPU alarm', () => {
      expect(template.Resources.DBHighCPUAlarm).toBeDefined();
      expect(template.Resources.DBHighCPUAlarm.Type).toBe('AWS::CloudWatch::Alarm');
    });

    test('high CPU alarm should have correct configuration', () => {
      const alarm = template.Resources.DBHighCPUAlarm.Properties;
      expect(alarm.MetricName).toBe('CPUUtilization');
      expect(alarm.Namespace).toBe('AWS/RDS');
      expect(alarm.Threshold).toBe(80);
      expect(alarm.ComparisonOperator).toBe('GreaterThanThreshold');
      expect(alarm.Period).toBe(300);
      expect(alarm.EvaluationPeriods).toBe(2);
    });

    test('should have low storage alarm', () => {
      expect(template.Resources.DBLowStorageAlarm).toBeDefined();
      expect(template.Resources.DBLowStorageAlarm.Type).toBe('AWS::CloudWatch::Alarm');
    });

    test('low storage alarm should have correct configuration', () => {
      const alarm = template.Resources.DBLowStorageAlarm.Properties;
      expect(alarm.MetricName).toBe('FreeStorageSpace');
      expect(alarm.Namespace).toBe('AWS/RDS');
      expect(alarm.Threshold).toBe(2147483648); // 2GB in bytes
      expect(alarm.ComparisonOperator).toBe('LessThanThreshold');
      expect(alarm.Period).toBe(300);
      expect(alarm.EvaluationPeriods).toBe(1);
    });

    test('alarms should reference MySQL database instance', () => {
      const cpuAlarm = template.Resources.DBHighCPUAlarm.Properties;
      const storageAlarm = template.Resources.DBLowStorageAlarm.Properties;
      expect(cpuAlarm.Dimensions[0].Value.Ref).toBe('MySQLDatabase');
      expect(storageAlarm.Dimensions[0].Value.Ref).toBe('MySQLDatabase');
    });

    test('alarms should use environment suffix in names', () => {
      const cpuAlarm = template.Resources.DBHighCPUAlarm.Properties;
      const storageAlarm = template.Resources.DBLowStorageAlarm.Properties;
      expect(cpuAlarm.AlarmName['Fn::Sub']).toContain('${EnvironmentSuffix}');
      expect(storageAlarm.AlarmName['Fn::Sub']).toContain('${EnvironmentSuffix}');
    });
  });

  describe('Outputs', () => {
    test('should have all required outputs', () => {
      const expectedOutputs = ['VPCId', 'DBEndpoint', 'DBPort', 'BackupBucketName', 'KMSKeyId'];
      expectedOutputs.forEach(output => {
        expect(template.Outputs[output]).toBeDefined();
      });
    });

    test('VPCId output should be correct', () => {
      const output = template.Outputs.VPCId;
      expect(output.Description).toBe('VPC ID');
      expect(output.Value.Ref).toBe('VPC');
      expect(output.Export.Name['Fn::Sub']).toBe('${AWS::StackName}-VPCId');
    });

    test('DBEndpoint output should be correct', () => {
      const output = template.Outputs.DBEndpoint;
      expect(output.Description).toBe('MySQL Database Endpoint');
      expect(output.Value['Fn::GetAtt']).toEqual(['MySQLDatabase', 'Endpoint.Address']);
      expect(output.Export.Name['Fn::Sub']).toBe('${AWS::StackName}-DBEndpoint');
    });

    test('DBPort output should be correct', () => {
      const output = template.Outputs.DBPort;
      expect(output.Description).toBe('MySQL Database Port');
      expect(output.Value['Fn::GetAtt']).toEqual(['MySQLDatabase', 'Endpoint.Port']);
      expect(output.Export.Name['Fn::Sub']).toBe('${AWS::StackName}-DBPort');
    });

    test('BackupBucketName output should be correct', () => {
      const output = template.Outputs.BackupBucketName;
      expect(output.Description).toBe('S3 Backup Bucket Name');
      expect(output.Value.Ref).toBe('S3BackupBucket');
      expect(output.Export.Name['Fn::Sub']).toBe('${AWS::StackName}-BackupBucket');
    });

    test('KMSKeyId output should be correct', () => {
      const output = template.Outputs.KMSKeyId;
      expect(output.Description).toBe('KMS Key ID for encryption');
      expect(output.Value.Ref).toBe('KMSKey');
      expect(output.Export.Name['Fn::Sub']).toBe('${AWS::StackName}-KMSKeyId');
    });
  });

  describe('Resource Naming Convention', () => {
    test('all resources with names should include environment suffix', () => {
      const namedResources = [
        'VPC', 'PrivateSubnet1', 'PrivateSubnet2', 'DBSubnetGroup',
        'DatabaseSecurityGroup', 'KMSKey', 'S3BackupBucket',
        'EnhancedMonitoringRole', 'MySQLDatabase'
      ];

      namedResources.forEach(resourceName => {
        const resource = template.Resources[resourceName];
        if (resource.Properties.Tags) {
          const nameTag = resource.Properties.Tags.find((t: any) => t.Key === 'Name');
          if (nameTag) {
            expect(nameTag.Value['Fn::Sub'] || nameTag.Value).toContain('${EnvironmentSuffix}');
          }
        }
      });
    });

    test('database identifier should include environment suffix', () => {
      const db = template.Resources.MySQLDatabase.Properties;
      expect(db.DBInstanceIdentifier['Fn::Sub']).toContain('${EnvironmentSuffix}');
    });

    test('bucket name should include environment suffix', () => {
      const bucket = template.Resources.S3BackupBucket.Properties;
      expect(bucket.BucketName['Fn::Sub']).toContain('${EnvironmentSuffix}');
    });

    test('KMS alias should include environment suffix', () => {
      const alias = template.Resources.KMSKeyAlias.Properties;
      expect(alias.AliasName['Fn::Sub']).toContain('${EnvironmentSuffix}');
    });
  });

  describe('Template Validation', () => {
    test('should have valid JSON structure', () => {
      expect(template).toBeDefined();
      expect(typeof template).toBe('object');
    });

    test('should not have any deletion retention policies', () => {
      Object.keys(template.Resources).forEach(resourceName => {
        const resource = template.Resources[resourceName];
        if (resource.DeletionPolicy) {
          expect(resource.DeletionPolicy).not.toBe('Retain');
        }
        if (resource.UpdateReplacePolicy) {
          expect(resource.UpdateReplacePolicy).not.toBe('Retain');
        }
      });
    });

    test('should have correct resource count', () => {
      const expectedResources = [
        'VPC', 'PrivateSubnet1', 'PrivateSubnet2', 'DBSubnetGroup',
        'DatabaseSecurityGroup', 'KMSKey', 'KMSKeyAlias', 'S3BackupBucket',
        'EnhancedMonitoringRole', 'DBMasterPasswordSecret', 'MySQLDatabase', 'DBHighCPUAlarm', 'DBLowStorageAlarm'
      ];

      expect(Object.keys(template.Resources).length).toBe(expectedResources.length);
      expectedResources.forEach(resource => {
        expect(template.Resources[resource]).toBeDefined();
      });
    });

    test('should have correct parameter count', () => {
      expect(Object.keys(template.Parameters).length).toBe(2);
    });

    test('should have correct output count', () => {
      expect(Object.keys(template.Outputs).length).toBe(5);
    });
  });
});