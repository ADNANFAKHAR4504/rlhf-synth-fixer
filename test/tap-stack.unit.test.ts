import fs from 'fs';
import path from 'path';

describe('TapStack CloudFormation Template - RDS PostgreSQL Infrastructure', () => {
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
      expect(template.Description).toContain('RDS PostgreSQL');
    });

    test('should have metadata section with parameter groups', () => {
      expect(template.Metadata).toBeDefined();
      expect(template.Metadata['AWS::CloudFormation::Interface']).toBeDefined();
      expect(template.Metadata['AWS::CloudFormation::Interface'].ParameterGroups).toHaveLength(3);
    });
  });

  describe('Parameters', () => {
    test('should have all required parameters', () => {
      const expectedParams = [
        'EnvironmentName',
        'ProjectName',
        'DBAllocatedStorage',
        'DBMaxAllocatedStorage',
        'AlarmEmail',
        'EnvironmentSuffix'
      ];

      expectedParams.forEach(param => {
        expect(template.Parameters[param]).toBeDefined();
      });
    });

    test('EnvironmentName parameter should have correct configuration', () => {
      const param = template.Parameters.EnvironmentName;
      expect(param.Type).toBe('String');
      expect(param.Default).toBe('Production');
      expect(param.AllowedValues).toEqual(['Development', 'Staging', 'Production']);
    });

    test('AlarmEmail parameter should have email validation pattern and default', () => {
      const param = template.Parameters.AlarmEmail;
      expect(param.AllowedPattern).toBeDefined();
      expect(param.AllowedPattern).toContain('@');
      expect(param.Default).toBe('devops@example.com');
    });

    test('DBAllocatedStorage should have correct constraints', () => {
      const param = template.Parameters.DBAllocatedStorage;
      expect(param.Type).toBe('Number');
      expect(param.MinValue).toBe('20');
      expect(param.MaxValue).toBe('100');
    });
  });

  describe('Mappings', () => {
    test('should have RegionConfig mapping', () => {
      expect(template.Mappings).toBeDefined();
      expect(template.Mappings.RegionConfig).toBeDefined();
      expect(template.Mappings.RegionConfig['us-west-2']).toBeDefined();
      expect(template.Mappings.RegionConfig['us-west-2'].AZ1).toBe('us-west-2a');
      expect(template.Mappings.RegionConfig['us-west-2'].AZ2).toBe('us-west-2b');
    });
  });

  describe('VPC and Network Resources', () => {
    test('should have VPC with correct CIDR', () => {
      expect(template.Resources.VPC).toBeDefined();
      expect(template.Resources.VPC.Type).toBe('AWS::EC2::VPC');
      expect(template.Resources.VPC.Properties.CidrBlock).toBe('10.60.0.0/16');
      expect(template.Resources.VPC.Properties.EnableDnsHostnames).toBe(true);
      expect(template.Resources.VPC.Properties.EnableDnsSupport).toBe(true);
    });

    test('should have two private subnets with correct CIDRs', () => {
      expect(template.Resources.PrivateSubnet1).toBeDefined();
      expect(template.Resources.PrivateSubnet1.Properties.CidrBlock).toBe('10.60.10.0/24');

      expect(template.Resources.PrivateSubnet2).toBeDefined();
      expect(template.Resources.PrivateSubnet2.Properties.CidrBlock).toBe('10.60.20.0/24');
    });

    test('private subnets should be in different AZs', () => {
      const subnet1AZ = template.Resources.PrivateSubnet1.Properties.AvailabilityZone;
      const subnet2AZ = template.Resources.PrivateSubnet2.Properties.AvailabilityZone;

      expect(subnet1AZ['Fn::FindInMap'][2]).toBe('AZ1');
      expect(subnet2AZ['Fn::FindInMap'][2]).toBe('AZ2');
    });

    test('should have route tables for private subnets', () => {
      expect(template.Resources.PrivateRouteTable1).toBeDefined();
      expect(template.Resources.PrivateRouteTable2).toBeDefined();
      expect(template.Resources.PrivateSubnet1RouteTableAssociation).toBeDefined();
      expect(template.Resources.PrivateSubnet2RouteTableAssociation).toBeDefined();
    });

    test('should have S3 VPC Gateway Endpoint', () => {
      expect(template.Resources.S3VPCEndpoint).toBeDefined();
      expect(template.Resources.S3VPCEndpoint.Type).toBe('AWS::EC2::VPCEndpoint');
      expect(template.Resources.S3VPCEndpoint.Properties.VpcEndpointType).toBe('Gateway');
      expect(template.Resources.S3VPCEndpoint.Properties.ServiceName['Fn::Sub']).toContain('s3');
    });
  });

  describe('Security Groups', () => {
    test('should have database security group', () => {
      expect(template.Resources.DatabaseSecurityGroup).toBeDefined();
      expect(template.Resources.DatabaseSecurityGroup.Type).toBe('AWS::EC2::SecurityGroup');
    });

    test('database security group should allow PostgreSQL port 5432', () => {
      const sg = template.Resources.DatabaseSecurityGroup.Properties;
      expect(sg.SecurityGroupIngress).toHaveLength(1);
      expect(sg.SecurityGroupIngress[0].FromPort).toBe(5432);
      expect(sg.SecurityGroupIngress[0].ToPort).toBe(5432);
      expect(sg.SecurityGroupIngress[0].IpProtocol).toBe('tcp');
      expect(sg.SecurityGroupIngress[0].CidrIp).toBe('10.60.0.0/16');
    });
  });

  describe('KMS Encryption', () => {
    test('should have KMS key for encryption', () => {
      expect(template.Resources.KMSKey).toBeDefined();
      expect(template.Resources.KMSKey.Type).toBe('AWS::KMS::Key');
    });

    test('KMS key should have correct key policy', () => {
      const keyPolicy = template.Resources.KMSKey.Properties.KeyPolicy;
      expect(keyPolicy.Statement).toHaveLength(3);

      // Check for RDS permissions
      const rdsStatement = keyPolicy.Statement.find((s: any) =>
        s.Principal?.Service === 'rds.amazonaws.com'
      );
      expect(rdsStatement).toBeDefined();
      expect(rdsStatement.Action).toContain('kms:Encrypt');
      expect(rdsStatement.Action).toContain('kms:Decrypt');

      // Check for S3 permissions
      const s3Statement = keyPolicy.Statement.find((s: any) =>
        s.Principal?.Service === 's3.amazonaws.com'
      );
      expect(s3Statement).toBeDefined();
    });

    test('should have KMS key alias', () => {
      expect(template.Resources.KMSKeyAlias).toBeDefined();
      expect(template.Resources.KMSKeyAlias.Type).toBe('AWS::KMS::Alias');
    });
  });

  describe('RDS Database Configuration', () => {
    test('should have Secrets Manager secret for RDS credentials', () => {
      expect(template.Resources.RDSMasterSecret).toBeDefined();
      expect(template.Resources.RDSMasterSecret.Type).toBe('AWS::SecretsManager::Secret');

      const secret = template.Resources.RDSMasterSecret.Properties;
      expect(secret.GenerateSecretString).toBeDefined();
      expect(secret.GenerateSecretString.SecretStringTemplate).toContain('username');
      expect(secret.GenerateSecretString.GenerateStringKey).toBe('password');
      expect(secret.GenerateSecretString.PasswordLength).toBe(32);
    });

    test('should have DB subnet group', () => {
      expect(template.Resources.DBSubnetGroup).toBeDefined();
      expect(template.Resources.DBSubnetGroup.Type).toBe('AWS::RDS::DBSubnetGroup');
      expect(template.Resources.DBSubnetGroup.Properties.SubnetIds).toHaveLength(2);
    });

    test('should have DB parameter group for PostgreSQL 16', () => {
      expect(template.Resources.DBParameterGroup).toBeDefined();
      expect(template.Resources.DBParameterGroup.Type).toBe('AWS::RDS::DBParameterGroup');
      expect(template.Resources.DBParameterGroup.Properties.Family).toBe('postgres16');
    });

    test('DB parameter group should have performance monitoring parameters', () => {
      const params = template.Resources.DBParameterGroup.Properties.Parameters;
      expect(params.log_statement).toBe('all');
      expect(params.log_min_duration_statement).toBe('100');
      expect(params.shared_preload_libraries).toBe('pg_stat_statements');
      expect(params.track_io_timing).toBe('1');
    });

    test('should have RDS instance with correct configuration', () => {
      expect(template.Resources.DBInstance).toBeDefined();
      expect(template.Resources.DBInstance.Type).toBe('AWS::RDS::DBInstance');
    });

    test('RDS instance should use Secrets Manager dynamic references', () => {
      const db = template.Resources.DBInstance.Properties;
      expect(db.MasterUsername['Fn::Join']).toBeDefined();
      const usernameJoinParts = db.MasterUsername['Fn::Join'][1];
      expect(JSON.stringify(usernameJoinParts)).toContain('resolve:secretsmanager');
      expect(JSON.stringify(usernameJoinParts)).toContain('RDSMasterSecret');
      expect(JSON.stringify(usernameJoinParts)).toContain('username');

      expect(db.MasterUserPassword['Fn::Join']).toBeDefined();
      const passwordJoinParts = db.MasterUserPassword['Fn::Join'][1];
      expect(JSON.stringify(passwordJoinParts)).toContain('resolve:secretsmanager');
      expect(JSON.stringify(passwordJoinParts)).toContain('RDSMasterSecret');
      expect(JSON.stringify(passwordJoinParts)).toContain('password');
    });

    test('RDS instance should use db.t3.micro', () => {
      const db = template.Resources.DBInstance.Properties;
      expect(db.DBInstanceClass).toBe('db.t3.micro');
    });

    test('RDS instance should use PostgreSQL 16.8', () => {
      const db = template.Resources.DBInstance.Properties;
      expect(db.Engine).toBe('postgres');
      expect(db.EngineVersion).toBe('16.8');
    });

    test('RDS instance should have encryption enabled', () => {
      const db = template.Resources.DBInstance.Properties;
      expect(db.StorageEncrypted).toBe(true);
      expect(db.KmsKeyId).toBeDefined();
      expect(db.KmsKeyId.Ref).toBe('KMSKey');
    });

    test('RDS instance should have 7-day backup retention', () => {
      const db = template.Resources.DBInstance.Properties;
      expect(db.BackupRetentionPeriod).toBe(7);
    });

    test('RDS instance should have Performance Insights enabled', () => {
      const db = template.Resources.DBInstance.Properties;
      expect(db.EnablePerformanceInsights).toBe(true);
      expect(db.PerformanceInsightsRetentionPeriod).toBe(7);
      expect(db.PerformanceInsightsKMSKeyId).toBeDefined();
    });

    test('RDS instance should have enhanced monitoring enabled', () => {
      const db = template.Resources.DBInstance.Properties;
      expect(db.MonitoringInterval).toBe(60);
      expect(db.MonitoringRoleArn).toBeDefined();
    });

    test('RDS instance should export CloudWatch logs', () => {
      const db = template.Resources.DBInstance.Properties;
      expect(db.EnableCloudwatchLogsExports).toContain('postgresql');
    });

    test('RDS instance should use GP3 storage', () => {
      const db = template.Resources.DBInstance.Properties;
      expect(db.StorageType).toBe('gp3');
    });

    test('RDS instance should have deletion and update policies', () => {
      expect(template.Resources.DBInstance.DeletionPolicy).toBe('Delete');
      expect(template.Resources.DBInstance.UpdateReplacePolicy).toBe('Delete');
    });
  });

  describe('S3 Backup Bucket', () => {
    test('should have S3 bucket for backups', () => {
      expect(template.Resources.BackupBucket).toBeDefined();
      expect(template.Resources.BackupBucket.Type).toBe('AWS::S3::Bucket');
    });

    test('S3 bucket should have KMS encryption', () => {
      const bucket = template.Resources.BackupBucket.Properties;
      const encryption = bucket.BucketEncryption.ServerSideEncryptionConfiguration[0];
      expect(encryption.ServerSideEncryptionByDefault.SSEAlgorithm).toBe('aws:kms');
      expect(encryption.ServerSideEncryptionByDefault.KMSMasterKeyID.Ref).toBe('KMSKey');
      expect(encryption.BucketKeyEnabled).toBe(true);
    });

    test('S3 bucket should have versioning enabled', () => {
      const bucket = template.Resources.BackupBucket.Properties;
      expect(bucket.VersioningConfiguration.Status).toBe('Enabled');
    });

    test('S3 bucket should have lifecycle policies', () => {
      const bucket = template.Resources.BackupBucket.Properties;
      expect(bucket.LifecycleConfiguration.Rules).toHaveLength(3);

      const rules = bucket.LifecycleConfiguration.Rules;
      expect(rules.find((r: any) => r.Id === 'DeleteOldVersions')).toBeDefined();
      expect(rules.find((r: any) => r.Id === 'TransitionToIA')).toBeDefined();
      expect(rules.find((r: any) => r.Id === 'TransitionToGlacier')).toBeDefined();
    });

    test('S3 bucket should block public access', () => {
      const bucket = template.Resources.BackupBucket.Properties;
      const publicAccess = bucket.PublicAccessBlockConfiguration;
      expect(publicAccess.BlockPublicAcls).toBe(true);
      expect(publicAccess.BlockPublicPolicy).toBe(true);
      expect(publicAccess.IgnorePublicAcls).toBe(true);
      expect(publicAccess.RestrictPublicBuckets).toBe(true);
    });

    test('should have bucket policy to enforce SSL', () => {
      expect(template.Resources.BackupBucketPolicy).toBeDefined();
      const policy = template.Resources.BackupBucketPolicy.Properties.PolicyDocument;
      const statement = policy.Statement[0];
      expect(statement.Effect).toBe('Deny');
      expect(statement.Condition.Bool['aws:SecureTransport']).toBe('false');
    });
  });

  describe('IAM Roles', () => {
    test('should have RDS enhanced monitoring role', () => {
      expect(template.Resources.RDSEnhancedMonitoringRole).toBeDefined();
      expect(template.Resources.RDSEnhancedMonitoringRole.Type).toBe('AWS::IAM::Role');

      const role = template.Resources.RDSEnhancedMonitoringRole.Properties;
      expect(role.AssumeRolePolicyDocument.Statement[0].Principal.Service)
        .toBe('monitoring.rds.amazonaws.com');
      expect(role.ManagedPolicyArns).toContain(
        'arn:aws:iam::aws:policy/service-role/AmazonRDSEnhancedMonitoringRole'
      );
    });

    test('should have S3 backup role', () => {
      expect(template.Resources.S3BackupRole).toBeDefined();
      expect(template.Resources.S3BackupRole.Type).toBe('AWS::IAM::Role');

      const role = template.Resources.S3BackupRole.Properties;
      expect(role.AssumeRolePolicyDocument.Statement[0].Principal.Service)
        .toBe('rds.amazonaws.com');
    });

    test('S3 backup role should have correct permissions', () => {
      const role = template.Resources.S3BackupRole.Properties;
      const policy = role.Policies[0].PolicyDocument.Statement;

      // Check S3 permissions
      const s3Statement = policy.find((s: any) =>
        s.Action.includes('s3:GetObject')
      );
      expect(s3Statement).toBeDefined();
      expect(s3Statement.Action).toContain('s3:PutObject');
      expect(s3Statement.Action).toContain('s3:ListBucket');

      // Check KMS permissions
      const kmsStatement = policy.find((s: any) =>
        s.Action.includes('kms:Decrypt')
      );
      expect(kmsStatement).toBeDefined();
      expect(kmsStatement.Action).toContain('kms:Encrypt');
    });
  });

  describe('CloudWatch Alarms', () => {
    test('should have CPU utilization alarm', () => {
      expect(template.Resources.CPUAlarm).toBeDefined();
      const alarm = template.Resources.CPUAlarm.Properties;
      expect(alarm.MetricName).toBe('CPUUtilization');
      expect(alarm.Threshold).toBe(80);
      expect(alarm.ComparisonOperator).toBe('GreaterThanThreshold');
    });

    test('should have database connections alarm', () => {
      expect(template.Resources.DatabaseConnectionsAlarm).toBeDefined();
      const alarm = template.Resources.DatabaseConnectionsAlarm.Properties;
      expect(alarm.MetricName).toBe('DatabaseConnections');
      expect(alarm.Threshold).toBe(15);
    });

    test('should have free storage space alarm', () => {
      expect(template.Resources.FreeStorageSpaceAlarm).toBeDefined();
      const alarm = template.Resources.FreeStorageSpaceAlarm.Properties;
      expect(alarm.MetricName).toBe('FreeStorageSpace');
      expect(alarm.Threshold).toBe(2147483648); // 2GB in bytes
      expect(alarm.ComparisonOperator).toBe('LessThanThreshold');
    });

    test('should have read latency alarm', () => {
      expect(template.Resources.ReadLatencyAlarm).toBeDefined();
      const alarm = template.Resources.ReadLatencyAlarm.Properties;
      expect(alarm.MetricName).toBe('ReadLatency');
      expect(alarm.Threshold).toBe(0.2); // 200ms
    });

    test('should have write latency alarm', () => {
      expect(template.Resources.WriteLatencyAlarm).toBeDefined();
      const alarm = template.Resources.WriteLatencyAlarm.Properties;
      expect(alarm.MetricName).toBe('WriteLatency');
      expect(alarm.Threshold).toBe(0.2); // 200ms
    });

    test('all alarms should use SNS topic for notifications', () => {
      const alarmResources = [
        'CPUAlarm',
        'DatabaseConnectionsAlarm',
        'FreeStorageSpaceAlarm',
        'ReadLatencyAlarm',
        'WriteLatencyAlarm'
      ];

      alarmResources.forEach(alarmName => {
        const alarm = template.Resources[alarmName].Properties;
        expect(alarm.AlarmActions).toHaveLength(1);
        expect(alarm.AlarmActions[0].Ref).toBe('SNSTopic');
      });
    });
  });

  describe('SNS Topic', () => {
    test('should have SNS topic for alerts', () => {
      expect(template.Resources.SNSTopic).toBeDefined();
      expect(template.Resources.SNSTopic.Type).toBe('AWS::SNS::Topic');
    });

    test('SNS topic should have email subscription', () => {
      const topic = template.Resources.SNSTopic.Properties;
      expect(topic.Subscription).toHaveLength(1);
      expect(topic.Subscription[0].Protocol).toBe('email');
      expect(topic.Subscription[0].Endpoint.Ref).toBe('AlarmEmail');
    });
  });

  describe('Outputs', () => {
    test('should have all required outputs', () => {
      const expectedOutputs = [
        'VPCId',
        'PrivateSubnet1Id',
        'PrivateSubnet2Id',
        'DBInstanceId',
        'DBEndpoint',
        'DBPort',
        'BackupBucketName',
        'BackupBucketArn',
        'KMSKeyId',
        'KMSKeyArn',
        'DatabaseSecurityGroupId',
        'S3VPCEndpointId',
        'SNSTopicArn',
        'S3BackupRoleArn',
        'RDSMonitoringRoleArn',
        'RDSMasterSecretArn'
      ];

      expectedOutputs.forEach(output => {
        expect(template.Outputs[output]).toBeDefined();
      });
    });

    test('all outputs should have exports for cross-stack references', () => {
      Object.keys(template.Outputs).forEach(outputKey => {
        const output = template.Outputs[outputKey];
        expect(output.Export).toBeDefined();
        expect(output.Export.Name['Fn::Sub']).toContain('${AWS::StackName}');
      });
    });

    test('database endpoint output should use GetAtt', () => {
      const dbEndpoint = template.Outputs.DBEndpoint;
      expect(dbEndpoint.Value['Fn::GetAtt']).toBeDefined();
      expect(dbEndpoint.Value['Fn::GetAtt'][0]).toBe('DBInstance');
      expect(dbEndpoint.Value['Fn::GetAtt'][1]).toBe('Endpoint.Address');
    });

    test('database port output should use GetAtt', () => {
      const dbPort = template.Outputs.DBPort;
      expect(dbPort.Value['Fn::GetAtt']).toBeDefined();
      expect(dbPort.Value['Fn::GetAtt'][0]).toBe('DBInstance');
      expect(dbPort.Value['Fn::GetAtt'][1]).toBe('Endpoint.Port');
    });
  });

  describe('Resource Tagging', () => {
    test('VPC should have proper tags', () => {
      const tags = template.Resources.VPC.Properties.Tags;
      expect(tags.find((t: any) => t.Key === 'Name')).toBeDefined();
      expect(tags.find((t: any) => t.Key === 'Environment')).toBeDefined();
      expect(tags.find((t: any) => t.Key === 'Project')).toBeDefined();
    });

    test('RDS instance should have proper tags', () => {
      const tags = template.Resources.DBInstance.Properties.Tags;
      expect(tags.find((t: any) => t.Key === 'Name')).toBeDefined();
      expect(tags.find((t: any) => t.Key === 'Environment')).toBeDefined();
    });

    test('all taggable resources should have Name tag', () => {
      const taggableResources = [
        'VPC',
        'PrivateSubnet1',
        'PrivateSubnet2',
        'DatabaseSecurityGroup',
        'DBSubnetGroup',
        'DBParameterGroup',
        'DBInstance',
        'BackupBucket',
        'KMSKey',
        'RDSEnhancedMonitoringRole',
        'S3BackupRole',
        'SNSTopic',
        'RDSMasterSecret'
      ];

      taggableResources.forEach(resourceName => {
        const resource = template.Resources[resourceName];
        if (resource.Properties.Tags) {
          const nameTag = resource.Properties.Tags.find((t: any) => t.Key === 'Name');
          expect(nameTag).toBeDefined();
        }
      });
    });
  });

  describe('Template Validation', () => {
    test('should have valid JSON structure', () => {
      expect(template).toBeDefined();
      expect(typeof template).toBe('object');
    });

    test('should have all main sections', () => {
      expect(template.AWSTemplateFormatVersion).toBeDefined();
      expect(template.Description).toBeDefined();
      expect(template.Parameters).toBeDefined();
      expect(template.Resources).toBeDefined();
      expect(template.Outputs).toBeDefined();
    });

    test('all resource references should be valid', () => {
      // Check that DBInstance references existing resources
      const dbInstance = template.Resources.DBInstance.Properties;
      expect(template.Resources[dbInstance.KmsKeyId.Ref]).toBeDefined();
      expect(template.Resources[dbInstance.DBSubnetGroupName.Ref]).toBeDefined();
      expect(template.Resources[dbInstance.VPCSecurityGroups[0].Ref]).toBeDefined();
      expect(template.Resources[dbInstance.DBParameterGroupName.Ref]).toBeDefined();
    });

    test('S3 VPC endpoint should reference backup bucket correctly', () => {
      const endpoint = template.Resources.S3VPCEndpoint.Properties;
      const policyResource = endpoint.PolicyDocument.Statement[0].Resource[0]['Fn::Sub'];
      expect(policyResource).toContain('${BackupBucket}');
    });
  });
});