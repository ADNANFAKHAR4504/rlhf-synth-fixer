import fs from 'fs';
import path from 'path';

const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'test-001';

describe('TapStack CloudFormation Template', () => {
  let template: any;

  beforeAll(() => {
    // If you're testing a YAML template, run `cfn-flip lib/TapStack.yml > lib/TapStack.json`
    const templatePath = path.join(__dirname, '../lib/TapStack.json');
    const templateContent = fs.readFileSync(templatePath, 'utf8');
    template = JSON.parse(templateContent);
  });

  describe('Template Structure', () => {
    test('should have correct AWS template format version', () => {
      expect(template.AWSTemplateFormatVersion).toBe('2010-09-09');
    });

    test('should have description for multi-environment payment processing', () => {
      expect(template.Description).toBeDefined();
      expect(template.Description).toContain('Multi-Environment Payment Processing Infrastructure');
    });

    test('should have all required parameters', () => {
      expect(template.Parameters.Environment).toBeDefined();
      expect(template.Parameters.EnvironmentSuffix).toBeDefined();
      expect(template.Parameters.DBMasterUsername).toBeDefined();
      expect(template.Parameters.ContainerImage).toBeDefined();
      expect(template.Parameters.CertificateArn).toBeDefined();
    });

    test('Environment parameter should have dev, staging, prod values', () => {
      expect(template.Parameters.Environment.AllowedValues).toEqual(['dev', 'staging', 'prod']);
    });

    test('should have environment-specific mappings', () => {
      expect(template.Mappings.EnvironmentConfig).toBeDefined();
      expect(template.Mappings.EnvironmentConfig.prod).toBeDefined();
      expect(template.Mappings.EnvironmentConfig.staging).toBeDefined();
      expect(template.Mappings.EnvironmentConfig.dev).toBeDefined();
    });
  });

  describe('Network Infrastructure', () => {
    test('should have VPC with environment-specific CIDR', () => {
      expect(template.Resources.VPC).toBeDefined();
      expect(template.Resources.VPC.Type).toBe('AWS::EC2::VPC');
    });

    test('should have correct CIDR ranges per environment', () => {
      expect(template.Mappings.EnvironmentConfig.prod.VpcCidr).toBe('10.0.0.0/16');
      expect(template.Mappings.EnvironmentConfig.staging.VpcCidr).toBe('10.1.0.0/16');
      expect(template.Mappings.EnvironmentConfig.dev.VpcCidr).toBe('10.2.0.0/16');
    });

    test('should have 2 public and 2 private subnets', () => {
      expect(template.Resources.PublicSubnet1).toBeDefined();
      expect(template.Resources.PublicSubnet2).toBeDefined();
      expect(template.Resources.PrivateSubnet1).toBeDefined();
      expect(template.Resources.PrivateSubnet2).toBeDefined();
    });

    test('should have Internet Gateway', () => {
      expect(template.Resources.InternetGateway).toBeDefined();
      expect(template.Resources.InternetGateway.Type).toBe('AWS::EC2::InternetGateway');
    });

    test('should have NAT Gateway for outbound connectivity', () => {
      expect(template.Resources.NatGateway1).toBeDefined();
      expect(template.Resources.NatGateway1.Type).toBe('AWS::EC2::NatGateway');
      // Single NAT Gateway reduces EIP quota usage while maintaining functionality
      expect(template.Resources.NatGateway1EIP).toBeDefined();
    });

    test('should have route tables for public and private subnets', () => {
      expect(template.Resources.PublicRouteTable).toBeDefined();
      expect(template.Resources.PrivateRouteTable1).toBeDefined();
      expect(template.Resources.PrivateRouteTable2).toBeDefined();
    });
  });

  describe('Database Layer', () => {
    test('should have Aurora MySQL cluster', () => {
      expect(template.Resources.AuroraCluster).toBeDefined();
      expect(template.Resources.AuroraCluster.Type).toBe('AWS::RDS::DBCluster');
      expect(template.Resources.AuroraCluster.Properties.Engine).toBe('aurora-mysql');
    });

    test('should have environment-specific DB instance classes', () => {
      expect(template.Mappings.EnvironmentConfig.prod.DBInstanceClass).toBe('db.r5.large');
      expect(template.Mappings.EnvironmentConfig.staging.DBInstanceClass).toBe('db.t3.medium');
      expect(template.Mappings.EnvironmentConfig.dev.DBInstanceClass).toBe('db.t3.medium');
    });

    test('should have environment-specific backup retention', () => {
      expect(template.Mappings.EnvironmentConfig.prod.DBBackupRetention).toBe(30);
      expect(template.Mappings.EnvironmentConfig.staging.DBBackupRetention).toBe(7);
      expect(template.Mappings.EnvironmentConfig.dev.DBBackupRetention).toBe(7);
    });

    test('should have 2 Aurora instances for high availability', () => {
      expect(template.Resources.AuroraInstance1).toBeDefined();
      expect(template.Resources.AuroraInstance2).toBeDefined();
    });

    test('should have KMS encryption key for database', () => {
      expect(template.Resources.DBEncryptionKey).toBeDefined();
      expect(template.Resources.DBEncryptionKey.Type).toBe('AWS::KMS::Key');
    });

    test('Aurora cluster should have storage encryption enabled', () => {
      expect(template.Resources.AuroraCluster.Properties.StorageEncrypted).toBe(true);
    });

    test('database instances should not be publicly accessible', () => {
      expect(template.Resources.AuroraInstance1.Properties.PubliclyAccessible).toBe(false);
      expect(template.Resources.AuroraInstance2.Properties.PubliclyAccessible).toBe(false);
    });
  });

  describe('Container Services', () => {
    test('should have ECS cluster', () => {
      expect(template.Resources.ECSCluster).toBeDefined();
      expect(template.Resources.ECSCluster.Type).toBe('AWS::ECS::Cluster');
    });

    test('should have Container Insights enabled', () => {
      const settings = template.Resources.ECSCluster.Properties.ClusterSettings;
      expect(settings).toBeDefined();
      expect(settings[0].Name).toBe('containerInsights');
      expect(settings[0].Value).toBe('enabled');
    });

    test('should have Fargate task definition', () => {
      expect(template.Resources.ECSTaskDefinition).toBeDefined();
      expect(template.Resources.ECSTaskDefinition.Properties.RequiresCompatibilities).toContain('FARGATE');
    });

    test('should have ECS service with environment-specific capacity', () => {
      expect(template.Resources.ECSService).toBeDefined();
      expect(template.Mappings.EnvironmentConfig.prod.ECSDesiredCount).toBe(3);
      expect(template.Mappings.EnvironmentConfig.staging.ECSDesiredCount).toBe(2);
      expect(template.Mappings.EnvironmentConfig.dev.ECSDesiredCount).toBe(1);
    });

    test('should have auto scaling configured', () => {
      expect(template.Resources.ECSServiceScalingTarget).toBeDefined();
      expect(template.Resources.ECSServiceScalingPolicyCPU).toBeDefined();
      expect(template.Resources.ECSServiceScalingPolicyMemory).toBeDefined();
    });

    test('ECS tasks should run in private subnets', () => {
      const networkConfig = template.Resources.ECSService.Properties.NetworkConfiguration.AwsvpcConfiguration;
      expect(networkConfig.AssignPublicIp).toBe('DISABLED');
    });
  });

  describe('Load Balancing', () => {
    test('should have Application Load Balancer', () => {
      expect(template.Resources.ApplicationLoadBalancer).toBeDefined();
      expect(template.Resources.ApplicationLoadBalancer.Type).toBe('AWS::ElasticLoadBalancingV2::LoadBalancer');
    });

    test('ALB should be internet-facing', () => {
      expect(template.Resources.ApplicationLoadBalancer.Properties.Scheme).toBe('internet-facing');
    });

    test('should have target group with health checks', () => {
      expect(template.Resources.ALBTargetGroup).toBeDefined();
      expect(template.Resources.ALBTargetGroup.Properties.HealthCheckEnabled).toBe(true);
    });

    test('should have HTTP listener', () => {
      expect(template.Resources.ALBHTTPListener).toBeDefined();
      expect(template.Resources.ALBHTTPListener.Properties.Port).toBe(80);
    });

    test('should have conditional HTTPS listener', () => {
      expect(template.Resources.ALBHTTPSListener).toBeDefined();
      expect(template.Resources.ALBHTTPSListener.Condition).toBe('HasCertificate');
    });
  });

  describe('Storage and Logging', () => {
    test('should have S3 bucket for transaction logs', () => {
      expect(template.Resources.TransactionLogsBucket).toBeDefined();
      expect(template.Resources.TransactionLogsBucket.Type).toBe('AWS::S3::Bucket');
    });

    test('S3 bucket should have versioning enabled', () => {
      expect(template.Resources.TransactionLogsBucket.Properties.VersioningConfiguration.Status).toBe('Enabled');
    });

    test('S3 bucket should have encryption', () => {
      const encryption = template.Resources.TransactionLogsBucket.Properties.BucketEncryption;
      expect(encryption).toBeDefined();
      expect(encryption.ServerSideEncryptionConfiguration[0].ServerSideEncryptionByDefault.SSEAlgorithm).toBe('AES256');
    });

    test('S3 bucket should block public access', () => {
      const publicAccess = template.Resources.TransactionLogsBucket.Properties.PublicAccessBlockConfiguration;
      expect(publicAccess.BlockPublicAcls).toBe(true);
      expect(publicAccess.BlockPublicPolicy).toBe(true);
    });

    test('should have CloudWatch Log Group for ECS', () => {
      expect(template.Resources.ECSLogGroup).toBeDefined();
      expect(template.Resources.ECSLogGroup.Type).toBe('AWS::Logs::LogGroup');
    });
  });

  describe('Monitoring and Alerting', () => {
    test('should have SNS topic for alarms', () => {
      expect(template.Resources.AlarmSNSTopic).toBeDefined();
      expect(template.Resources.AlarmSNSTopic.Type).toBe('AWS::SNS::Topic');
    });

    test('should have ECS CPU utilization alarm', () => {
      expect(template.Resources.ECSCPUAlarm).toBeDefined();
      expect(template.Resources.ECSCPUAlarm.Properties.MetricName).toBe('CPUUtilization');
    });

    test('should have ECS memory utilization alarm', () => {
      expect(template.Resources.ECSMemoryAlarm).toBeDefined();
      expect(template.Resources.ECSMemoryAlarm.Properties.MetricName).toBe('MemoryUtilization');
    });

    test('should have database connections alarm', () => {
      expect(template.Resources.DBConnectionsAlarm).toBeDefined();
      expect(template.Resources.DBConnectionsAlarm.Properties.MetricName).toBe('DatabaseConnections');
    });

    test('should have environment-specific alarm thresholds', () => {
      expect(template.Mappings.EnvironmentConfig.prod.CPUAlarmThreshold).toBe(70);
      expect(template.Mappings.EnvironmentConfig.staging.CPUAlarmThreshold).toBe(80);
      expect(template.Mappings.EnvironmentConfig.dev.CPUAlarmThreshold).toBe(85);
    });
  });

  describe('Security Configuration', () => {
    test('should have ALB security group', () => {
      expect(template.Resources.ALBSecurityGroup).toBeDefined();
    });

    test('ALB security group should allow HTTP and HTTPS', () => {
      const ingress = template.Resources.ALBSecurityGroup.Properties.SecurityGroupIngress;
      const ports = ingress.map((rule: any) => rule.FromPort);
      expect(ports).toContain(80);
      expect(ports).toContain(443);
    });

    test('should have ECS security group allowing traffic only from ALB', () => {
      expect(template.Resources.ECSSecurityGroup).toBeDefined();
      const ingress = template.Resources.ECSSecurityGroup.Properties.SecurityGroupIngress[0];
      expect(ingress.SourceSecurityGroupId).toBeDefined();
    });

    test('should have DB security group allowing traffic only from ECS', () => {
      expect(template.Resources.DBSecurityGroup).toBeDefined();
      const ingress = template.Resources.DBSecurityGroup.Properties.SecurityGroupIngress[0];
      expect(ingress.FromPort).toBe(3306);
      expect(ingress.SourceSecurityGroupId).toBeDefined();
    });

    test('should have database password secret in Secrets Manager', () => {
      expect(template.Resources.DBMasterPasswordSecret).toBeDefined();
      expect(template.Resources.DBMasterPasswordSecret.Type).toBe('AWS::SecretsManager::Secret');
      expect(template.Resources.DBMasterPasswordSecret.Properties.GenerateSecretString).toBeDefined();
    });
  });

  describe('IAM Roles', () => {
    test('should have ECS task execution role', () => {
      expect(template.Resources.ECSTaskExecutionRole).toBeDefined();
      expect(template.Resources.ECSTaskExecutionRole.Type).toBe('AWS::IAM::Role');
    });

    test('should have ECS task role with S3 access', () => {
      expect(template.Resources.ECSTaskRole).toBeDefined();
      const policies = template.Resources.ECSTaskRole.Properties.Policies;
      expect(policies).toBeDefined();
      expect(policies[0].PolicyName).toBe('S3AccessPolicy');
    });
  });

  describe('Outputs', () => {
    test('should have VPC ID output', () => {
      expect(template.Outputs.VPCId).toBeDefined();
    });

    test('should have subnet IDs outputs', () => {
      expect(template.Outputs.PublicSubnet1Id).toBeDefined();
      expect(template.Outputs.PublicSubnet2Id).toBeDefined();
      expect(template.Outputs.PrivateSubnet1Id).toBeDefined();
      expect(template.Outputs.PrivateSubnet2Id).toBeDefined();
    });

    test('should have ALB DNS name output', () => {
      expect(template.Outputs.ALBDNSName).toBeDefined();
    });

    test('should have Aurora cluster endpoints outputs', () => {
      expect(template.Outputs.AuroraClusterEndpoint).toBeDefined();
      expect(template.Outputs.AuroraReaderEndpoint).toBeDefined();
    });

    test('should have S3 bucket name output', () => {
      expect(template.Outputs.TransactionLogsBucketName).toBeDefined();
    });

    test('should have ECS cluster and service name outputs', () => {
      expect(template.Outputs.ECSClusterName).toBeDefined();
      expect(template.Outputs.ECSServiceName).toBeDefined();
    });

    test('should have SNS topic ARN output', () => {
      expect(template.Outputs.AlarmSNSTopicArn).toBeDefined();
    });
  });

  describe('Resource Naming with EnvironmentSuffix', () => {
    test('resources should use EnvironmentSuffix parameter', () => {
      const vpc = template.Resources.VPC.Properties.Tags.find((t: any) => t.Key === 'Name');
      expect(vpc.Value['Fn::Sub']).toContain('${EnvironmentSuffix}');
    });
  });
});
