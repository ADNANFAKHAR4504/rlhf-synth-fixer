import fs from 'fs';
import path from 'path';

const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';

describe('SaaS Staging Environment CloudFormation Template', () => {
  let template: any;

  beforeAll(() => {
    // If youre testing a yaml template. run `pipenv run cfn-flip-to-json > lib/TapStack.json`
    // Otherwise, ensure the template is in JSON format.
    const templatePath = path.join(__dirname, '../lib/TapStack.json');
    const templateContent = fs.readFileSync(templatePath, 'utf8');
    template = JSON.parse(templateContent);
  });

  describe('Template Structure', () => {
    test('should have valid CloudFormation format version', () => {
      expect(template.AWSTemplateFormatVersion).toBe('2010-09-09');
    });

    test('should have comprehensive description for SaaS staging environment', () => {
      expect(template.Description).toBeDefined();
      expect(template.Description).toBe('Enhanced SaaS staging environment mirroring production with advanced monitoring, security, and performance optimizations');
    });

    test('should have metadata section with proper parameter grouping', () => {
      expect(template.Metadata).toBeDefined();
      expect(template.Metadata['AWS::CloudFormation::Interface']).toBeDefined();
      expect(template.Metadata['AWS::CloudFormation::Interface'].ParameterGroups).toHaveLength(6);
    });

    test('should validate all required template sections exist', () => {
      expect(template.AWSTemplateFormatVersion).toBeDefined();
      expect(template.Description).toBeDefined();
      expect(template.Parameters).toBeDefined();
      expect(template.Resources).toBeDefined();
      expect(template.Outputs).toBeDefined();
      expect(template.Metadata).toBeDefined();
      expect(template.Conditions).toBeDefined();
    });
  });

  describe('Parameters Configuration', () => {
    test('should have all required parameters', () => {
      const expectedParameters = [
        'EnvironmentSuffix',
        'ProductionDBSnapshotIdentifier', 
        'VPNCidr',
        'NotificationEmail',
        'MonthlyCostThreshold',
        'ElastiCacheNodeType',
        'CreateConfigDeliveryChannel',
        'CreateConfigRecorder'
      ];
      
      expectedParameters.forEach(param => {
        expect(template.Parameters[param]).toBeDefined();
      });
      expect(Object.keys(template.Parameters)).toHaveLength(8);
    });

    test('EnvironmentSuffix parameter should have correct properties', () => {
      const envSuffixParam = template.Parameters.EnvironmentSuffix;
      expect(envSuffixParam.Type).toBe('String');
      expect(envSuffixParam.Default).toBe('dev');
      expect(envSuffixParam.AllowedPattern).toBe('^[a-zA-Z0-9]+$');
      expect(envSuffixParam.ConstraintDescription).toBe('Must contain only alphanumeric characters');
    });

    test('should have proper parameter defaults for staging environment', () => {
      expect(template.Parameters.VPNCidr.Default).toBe('172.16.0.0/16');
      expect(template.Parameters.NotificationEmail.Default).toBe('admin@example.com');
      expect(template.Parameters.MonthlyCostThreshold.Default).toBe(1000);
      expect(template.Parameters.ElastiCacheNodeType.Default).toBe('cache.t3.micro');
    });

    test('should have AWS Config parameters with safe defaults', () => {
      expect(template.Parameters.CreateConfigDeliveryChannel.Default).toBe('false');
      expect(template.Parameters.CreateConfigRecorder.Default).toBe('false');
    });
  });

  describe('Conditions', () => {
    test('should have proper conditions for AWS Config resources', () => {
      expect(template.Conditions.ShouldCreateConfigDeliveryChannel).toBeDefined();
      expect(template.Conditions.ShouldCreateConfigRecorder).toBeDefined();
    });
  });

  describe('Network Infrastructure', () => {
    test('should have VPC with proper CIDR configuration', () => {
      const vpc = template.Resources.StagingVPC;
      expect(vpc.Type).toBe('AWS::EC2::VPC');
      expect(vpc.Properties.CidrBlock).toBe('10.25.0.0/16');
      expect(vpc.Properties.EnableDnsSupport).toBe(true);
      expect(vpc.Properties.EnableDnsHostnames).toBe(true);
    });

    test('should have private subnets in multiple AZs', () => {
      const subnet1 = template.Resources.PrivateSubnet1;
      const subnet2 = template.Resources.PrivateSubnet2;
      
      expect(subnet1.Type).toBe('AWS::EC2::Subnet');
      expect(subnet2.Type).toBe('AWS::EC2::Subnet');
      expect(subnet1.Properties.CidrBlock).toBe('10.25.10.0/24');
      expect(subnet2.Properties.CidrBlock).toBe('10.25.20.0/24');
      expect(subnet1.Properties.MapPublicIpOnLaunch).toBe(false);
      expect(subnet2.Properties.MapPublicIpOnLaunch).toBe(false);
    });

    test('should have S3 VPC endpoint for private subnet access', () => {
      const s3Endpoint = template.Resources.S3VPCEndpoint;
      expect(s3Endpoint.Type).toBe('AWS::EC2::VPCEndpoint');
      expect(s3Endpoint.Properties.ServiceName['Fn::Sub']).toBe('com.amazonaws.${AWS::Region}.s3');
    });
  });

  describe('Security Groups', () => {
    test('should have database security group with VPN restrictions', () => {
      const dbSG = template.Resources.DBSecurityGroup;
      expect(dbSG.Type).toBe('AWS::EC2::SecurityGroup');
      
      const vpnRule = dbSG.Properties.SecurityGroupIngress.find((rule: any) => 
        rule.CidrIp && rule.CidrIp.Ref === 'VPNCidr'
      );
      expect(vpnRule).toBeDefined();
      expect(vpnRule.FromPort).toBe(3306);
      expect(vpnRule.ToPort).toBe(3306);
    });

    test('should have Lambda security group with proper egress', () => {
      const lambdaSG = template.Resources.LambdaSecurityGroup;
      expect(lambdaSG.Type).toBe('AWS::EC2::SecurityGroup');
      expect(lambdaSG.Properties.SecurityGroupEgress[0].IpProtocol).toBe(-1);
    });

    test('should have ElastiCache security group with restricted access', () => {
      const cacheSG = template.Resources.ElastiCacheSecurityGroup;
      expect(cacheSG.Type).toBe('AWS::EC2::SecurityGroup');
      
      const redisRule = cacheSG.Properties.SecurityGroupIngress.find((rule: any) => 
        rule.FromPort === 6379
      );
      expect(redisRule).toBeDefined();
    });
  });

  describe('Database Configuration', () => {
    test('should have Aurora MySQL cluster with encryption', () => {
      const cluster = template.Resources.AuroraDBCluster;
      expect(cluster.Type).toBe('AWS::RDS::DBCluster');
      expect(cluster.Properties.Engine).toBe('aurora-mysql');
      expect(cluster.Properties.EngineVersion).toBe('8.0.mysql_aurora.3.04.4');
      expect(cluster.Properties.StorageEncrypted).toBe(true);
      expect(cluster.Properties.DeletionProtection).toBe(false);
    });

    test('should have RDS instance with monitoring', () => {
      const instance = template.Resources.AuroraDBInstance;
      expect(instance.Type).toBe('AWS::RDS::DBInstance');
      expect(instance.Properties.Engine).toBe('aurora-mysql');
      expect(instance.Properties.DBInstanceClass).toBe('db.r5.large');
      expect(instance.Properties.MonitoringInterval).toBe(60);
      expect(instance.Properties.PubliclyAccessible).toBe(false);
    });

    test('should have database secret in Secrets Manager', () => {
      const secret = template.Resources.DBSecret;
      expect(secret.Type).toBe('AWS::SecretsManager::Secret');
      expect(secret.Properties.GenerateSecretString).toBeDefined();
      expect(secret.Properties.GenerateSecretString.PasswordLength).toBe(16);
    });

    test('should have DB subnet group', () => {
      const subnetGroup = template.Resources.DBSubnetGroup;
      expect(subnetGroup.Type).toBe('AWS::RDS::DBSubnetGroup');
      expect(subnetGroup.Properties.SubnetIds).toHaveLength(2);
    });
  });

  describe('ElastiCache Configuration', () => {
    test('should have Redis replication group with encryption', () => {
      const redis = template.Resources.ElastiCacheCluster;
      expect(redis.Type).toBe('AWS::ElastiCache::ReplicationGroup');
      expect(redis.Properties.Engine).toBe('redis');
      expect(redis.Properties.EngineVersion).toBe(7.0);
      expect(redis.Properties.AtRestEncryptionEnabled).toBe(true);
      expect(redis.Properties.TransitEncryptionEnabled).toBe(true);
      expect(redis.Properties.MultiAZEnabled).toBe(true);
      expect(redis.Properties.NumCacheClusters).toBe(2);
    });

    test('should have ElastiCache subnet group', () => {
      const subnetGroup = template.Resources.ElastiCacheSubnetGroup;
      expect(subnetGroup.Type).toBe('AWS::ElastiCache::SubnetGroup');
      expect(subnetGroup.Properties.SubnetIds).toHaveLength(2);
    });
  });

  describe('Lambda Configuration', () => {
    test('should have data masking Lambda function', () => {
      const lambda = template.Resources.DataMaskingFunction;
      expect(lambda.Type).toBe('AWS::Lambda::Function');
      expect(lambda.Properties.Runtime).toBe('python3.10');
      expect(lambda.Properties.Timeout).toBe(900);
      expect(lambda.Properties.MemorySize).toBe(1024);
    });

    test('should have Lambda execution role with proper policies', () => {
      const role = template.Resources.LambdaExecutionRole;
      expect(role.Type).toBe('AWS::IAM::Role');
      expect(role.Properties.ManagedPolicyArns).toContain('arn:aws:iam::aws:policy/service-role/AWSLambdaVPCAccessExecutionRole');
      expect(role.Properties.Policies).toHaveLength(1);
    });
  });

  describe('IAM Roles and Security', () => {
    test('should have three-tier access control roles', () => {
      expect(template.Resources.DeveloperRole).toBeDefined();
      expect(template.Resources.DevOpsRole).toBeDefined();
      expect(template.Resources.StagingAdminRole).toBeDefined();
    });

    test('should have MFA requirement for privileged roles', () => {
      const devOpsRole = template.Resources.DevOpsRole;
      const adminRole = template.Resources.StagingAdminRole;
      
      const devOpsMFACondition = devOpsRole.Properties.AssumeRolePolicyDocument.Statement[0].Condition;
      const adminMFACondition = adminRole.Properties.AssumeRolePolicyDocument.Statement[0].Condition;
      
      expect(devOpsMFACondition.Bool['aws:MultiFactorAuthPresent']).toBe(true);
      expect(adminMFACondition.Bool['aws:MultiFactorAuthPresent']).toBe(true);
      expect(adminMFACondition.NumericLessThan['aws:MultiFactorAuthAge']).toBe(3600);
    });

    test('should have RDS enhanced monitoring role', () => {
      const role = template.Resources.RDSEnhancedMonitoringRole;
      expect(role.Type).toBe('AWS::IAM::Role');
      expect(role.Properties.ManagedPolicyArns).toContain('arn:aws:iam::aws:policy/service-role/AmazonRDSEnhancedMonitoringRole');
    });
  });

  describe('Backup and Recovery', () => {
    test('should have backup vault with KMS encryption', () => {
      const vault = template.Resources.BackupVault;
      expect(vault.Type).toBe('AWS::Backup::BackupVault');
      expect(vault.Properties.EncryptionKeyArn['Fn::GetAtt']).toEqual(['BackupKMSKey', 'Arn']);
    });

    test('should have backup plan with cross-region replication', () => {
      const plan = template.Resources.BackupPlan;
      expect(plan.Type).toBe('AWS::Backup::BackupPlan');
      expect(plan.Properties.BackupPlan.BackupPlanRule[0].CopyActions).toBeDefined();
      expect(plan.Properties.BackupPlan.BackupPlanRule[0].Lifecycle.DeleteAfterDays).toBe(30);
    });

    test('should have backup KMS key with proper policies', () => {
      const key = template.Resources.BackupKMSKey;
      expect(key.Type).toBe('AWS::KMS::Key');
      expect(key.Properties.KeyPolicy.Statement).toHaveLength(2);
    });
  });

  describe('Storage Configuration', () => {
    test('should have test data S3 bucket with encryption and lifecycle', () => {
      const bucket = template.Resources.TestDataBucket;
      expect(bucket.Type).toBe('AWS::S3::Bucket');
      expect(bucket.Properties.BucketEncryption.ServerSideEncryptionConfiguration[0].ServerSideEncryptionByDefault.SSEAlgorithm).toBe('AES256');
      expect(bucket.Properties.LifecycleConfiguration.Rules).toHaveLength(2);
      expect(bucket.Properties.VersioningConfiguration.Status).toBe('Enabled');
    });

    test('should have S3 bucket policy enforcing HTTPS', () => {
      const policy = template.Resources.TestDataBucketPolicy;
      expect(policy.Type).toBe('AWS::S3::BucketPolicy');
      expect(policy.Properties.PolicyDocument.Statement[0].Condition.Bool['aws:SecureTransport']).toBe(false);
      expect(policy.Properties.PolicyDocument.Statement[0].Effect).toBe('Deny');
    });

    test('should have Config S3 bucket for compliance', () => {
      const bucket = template.Resources.ConfigBucket;
      expect(bucket.Type).toBe('AWS::S3::Bucket');
      expect(bucket.Properties.BucketEncryption).toBeDefined();
    });
  });

  describe('AWS Config Compliance', () => {
    test('should have Config role with proper policies', () => {
      const role = template.Resources.ConfigRole;
      expect(role.Type).toBe('AWS::IAM::Role');
      expect(role.Properties.ManagedPolicyArns).toContain('arn:aws:iam::aws:policy/service-role/AWS_ConfigRole');
    });

    test('should have conditional Config resources', () => {
      const recorder = template.Resources.ConfigurationRecorder;
      const deliveryChannel = template.Resources.ConfigDeliveryChannel;
      const rules = [
        template.Resources.RDSEncryptionRule,
        template.Resources.S3EncryptionRule,
        template.Resources.SecurityGroupRestrictiveRule
      ];

      expect(recorder.Condition).toBe('ShouldCreateConfigRecorder');
      expect(deliveryChannel.Condition).toBe('ShouldCreateConfigDeliveryChannel');
      rules.forEach(rule => {
        expect(rule.Condition).toBe('ShouldCreateConfigRecorder');
      });
    });
  });

  describe('Monitoring and Alerting', () => {
    test('should have comprehensive CloudWatch dashboard', () => {
      const dashboard = template.Resources.MonitoringDashboard;
      expect(dashboard.Type).toBe('AWS::CloudWatch::Dashboard');
      expect(dashboard.Properties.DashboardBody['Fn::Sub']).toBeDefined();
    });

    test('should have multiple CloudWatch alarms', () => {
      const alarms = [
        'DatabaseCPUAlarm',
        'DatabaseConnectionsAlarm', 
        'ElastiCacheCPUAlarm',
        'DataMaskingErrorsAlarm',
        'MonthlySpendingAlarm',
        'DailyTransactionsMetricAlarm'
      ];

      alarms.forEach(alarmName => {
        const alarm = template.Resources[alarmName];
        expect(alarm.Type).toBe('AWS::CloudWatch::Alarm');
        expect(alarm.Properties.AlarmActions).toContainEqual({ Ref: 'AlertTopic' });
      });
    });

    test('should have SNS topic for alerts', () => {
      const topic = template.Resources.AlertTopic;
      expect(topic.Type).toBe('AWS::SNS::Topic');
      expect(topic.Properties.Subscription[0].Protocol).toBe('email');
      expect(topic.Properties.Subscription[0].Endpoint).toEqual({ Ref: 'NotificationEmail' });
    });

    test('should have log groups with retention policies', () => {
      const s3LogGroup = template.Resources.S3AccessLogGroup;
      const appLogGroup = template.Resources.ApplicationLogGroup;
      
      expect(s3LogGroup.Type).toBe('AWS::Logs::LogGroup');
      expect(appLogGroup.Type).toBe('AWS::Logs::LogGroup');
      expect(s3LogGroup.Properties.RetentionInDays).toBe(14);
      expect(appLogGroup.Properties.RetentionInDays).toBe(30);
    });
  });

  describe('Resource Naming and Tagging', () => {
    test('should use consistent environment suffix in resource names', () => {
      const resourcesWithSuffix = [
        'StagingVPC',
        'AuroraDBCluster', 
        'DataMaskingFunction',
        'TestDataBucket',
        'BackupVault'
      ];

      resourcesWithSuffix.forEach(resourceName => {
        const resource = template.Resources[resourceName];
        const nameProperty = resource.Properties.Name || 
                            resource.Properties.DBClusterIdentifier ||
                            resource.Properties.FunctionName ||
                            resource.Properties.BucketName ||
                            resource.Properties.BackupVaultName;
        
        if (nameProperty && nameProperty['Fn::Sub']) {
          expect(nameProperty['Fn::Sub']).toContain('${EnvironmentSuffix}');
        }
      });
    });

    test('should have proper tags for resource management', () => {
      const taggedResources = ['StagingVPC', 'AuroraDBCluster', 'ElastiCacheCluster'];
      
      taggedResources.forEach(resourceName => {
        const resource = template.Resources[resourceName];
        expect(resource.Properties.Tags).toBeDefined();
        
        const envTag = resource.Properties.Tags.find((tag: any) => tag.Key === 'Environment');
        const suffixTag = resource.Properties.Tags.find((tag: any) => tag.Key === 'EnvironmentSuffix');
        
        expect(envTag).toBeDefined();
        expect(envTag.Value).toBe('staging');
        expect(suffixTag).toBeDefined();
      });
    });
  });

  describe('Template Validation', () => {
    test('should have valid JSON structure', () => {
      expect(template).toBeDefined();
      expect(typeof template).toBe('object');
    });

    test('should have expected resource count for complex infrastructure', () => {
      const resourceCount = Object.keys(template.Resources).length;
      expect(resourceCount).toBe(48); // Complex SaaS environment
    });

    test('should have proper parameter count', () => {
      const parameterCount = Object.keys(template.Parameters).length;
      expect(parameterCount).toBe(8);
    });

    test('should have comprehensive outputs', () => {
      const outputCount = Object.keys(template.Outputs).length;
      expect(outputCount).toBe(20); // Comprehensive outputs for integration testing
    });
  });

  describe('Security and Compliance Validation', () => {
    test('should not have hardcoded sensitive values', () => {
      const templateString = JSON.stringify(template);
      // Check for obvious hardcoded sensitive values (simple patterns)
      expect(templateString).not.toMatch(/:\s*"password123"/i);
      expect(templateString).not.toMatch(/:\s*"mypassword"/i);
      expect(templateString).not.toMatch(/:\s*"token123"/i);
      expect(templateString).not.toMatch(/:\s*"sk-\w+"/);  // API keys
      expect(templateString).not.toMatch(/:\s*"AKIA[A-Z0-9]+"/);  // AWS access keys
      // This test ensures no actual hardcoded credentials, while allowing legitimate CloudFormation references
    });

    test('should use parameter references for configurable values', () => {
      // Check VPN CIDR is parameterized
      const vpnIngress = template.Resources.DBSecurityGroup.Properties.SecurityGroupIngress.find(
        (rule: any) => rule.CidrIp && rule.CidrIp.Ref === 'VPNCidr'
      );
      expect(vpnIngress).toBeDefined();

      // Check notification email is parameterized
      const snsSubscription = template.Resources.AlertTopic.Properties.Subscription[0];
      expect(snsSubscription.Endpoint).toEqual({ Ref: 'NotificationEmail' });
    });

    test('should enable proper resource cleanup for CI/CD', () => {
      const cluster = template.Resources.AuroraDBCluster;
      expect(cluster.Properties.DeletionProtection).toBe(false);
    });
  });

  describe('Export Naming Patterns', () => {
    test('should have consistent export naming patterns', () => {
      const expectedPattern = /^\$\{AWS::StackName\}-\w+$/;
      Object.keys(template.Outputs).forEach(outputKey => {
        const exportName = template.Outputs[outputKey].Export.Name['Fn::Sub'];
        expect(exportName).toMatch(expectedPattern);
      });
    });
  });

  describe('Output Validation', () => {
    test('should have all critical infrastructure outputs', () => {
      const expectedOutputs = [
        'VpcId',
        'AuroraClusterEndpoint', 
        'ElastiCacheEndpoint',
        'DataMaskingFunctionArn',
        'TestDataBucketName',
        'AlertTopicArn',
        'MonitoringDashboardURL',
        'StackName'
      ];

      expectedOutputs.forEach(outputName => {
        expect(template.Outputs[outputName]).toBeDefined();
      });
    });

    test('should have outputs with proper descriptions', () => {
      Object.keys(template.Outputs).forEach(outputKey => {
        const output = template.Outputs[outputKey];
        expect(output.Description).toBeDefined();
        expect(output.Description.length).toBeGreaterThan(10);
      });
    });
  });
});
