import fs from 'fs';
import path from 'path';

describe('TapStack CloudFormation Template', () => {
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
      expect(template.Description).toContain('Multi-Environment Infrastructure');
    });
  });

  describe('Parameters', () => {
    test('should have EnvironmentSuffix parameter', () => {
      expect(template.Parameters.EnvironmentSuffix).toBeDefined();
      expect(template.Parameters.EnvironmentSuffix.Type).toBe('String');
      expect(template.Parameters.EnvironmentSuffix.Default).toBe('dev');
    });

    test('should have EnvironmentType parameter', () => {
      expect(template.Parameters.EnvironmentType).toBeDefined();
      expect(template.Parameters.EnvironmentType.Type).toBe('String');
      expect(template.Parameters.EnvironmentType.AllowedValues).toContain('staging');
      expect(template.Parameters.EnvironmentType.AllowedValues).toContain('production');
    });

    test('should have EC2InstanceType parameter', () => {
      expect(template.Parameters.EC2InstanceType).toBeDefined();
      expect(template.Parameters.EC2InstanceType.Type).toBe('String');
      expect(template.Parameters.EC2InstanceType.Default).toBe('t3.micro');
    });

    test('should have BudgetLimit parameter', () => {
      expect(template.Parameters.BudgetLimit).toBeDefined();
      expect(template.Parameters.BudgetLimit.Type).toBe('Number');
      expect(template.Parameters.BudgetLimit.Default).toBe(500);
    });
  });

  describe('Conditions', () => {
    test('should have IsProduction condition', () => {
      expect(template.Conditions.IsProduction).toBeDefined();
      expect(template.Conditions.IsProduction['Fn::Equals']).toEqual([
        { Ref: 'EnvironmentType' },
        'production'
      ]);
    });
  });

  describe('Resources - KMS', () => {
    test('should have KMS Key for encryption', () => {
      expect(template.Resources.EnvironmentKMSKey).toBeDefined();
      expect(template.Resources.EnvironmentKMSKey.Type).toBe('AWS::KMS::Key');
    });

    test('should have KMS Key Alias', () => {
      expect(template.Resources.KMSKeyAlias).toBeDefined();
      expect(template.Resources.KMSKeyAlias.Type).toBe('AWS::KMS::Alias');
    });
  });

  describe('Resources - Networking', () => {
    test('should have VPC resource', () => {
      expect(template.Resources.MainVPC).toBeDefined();
      expect(template.Resources.MainVPC.Type).toBe('AWS::EC2::VPC');
      expect(template.Resources.MainVPC.Properties.CidrBlock).toBe('10.0.0.0/16');
      expect(template.Resources.MainVPC.Properties.EnableDnsHostnames).toBe(true);
      expect(template.Resources.MainVPC.Properties.EnableDnsSupport).toBe(true);
    });

    test('should have public subnets', () => {
      expect(template.Resources.PublicSubnet1).toBeDefined();
      expect(template.Resources.PublicSubnet1.Type).toBe('AWS::EC2::Subnet');
      expect(template.Resources.PublicSubnet1.Properties.MapPublicIpOnLaunch).toBe(true);
      
      expect(template.Resources.PublicSubnet2).toBeDefined();
      expect(template.Resources.PublicSubnet2.Type).toBe('AWS::EC2::Subnet');
    });

    test('should have private subnets', () => {
      expect(template.Resources.PrivateSubnet1).toBeDefined();
      expect(template.Resources.PrivateSubnet1.Type).toBe('AWS::EC2::Subnet');
      
      expect(template.Resources.PrivateSubnet2).toBeDefined();
      expect(template.Resources.PrivateSubnet2.Type).toBe('AWS::EC2::Subnet');
    });

    test('should have Internet Gateway', () => {
      expect(template.Resources.InternetGateway).toBeDefined();
      expect(template.Resources.InternetGateway.Type).toBe('AWS::EC2::InternetGateway');
    });

    test('should have route tables', () => {
      expect(template.Resources.PublicRouteTable).toBeDefined();
      expect(template.Resources.PublicRouteTable.Type).toBe('AWS::EC2::RouteTable');
    });
  });

  describe('Resources - Security', () => {
    test('should have security groups', () => {
      expect(template.Resources.WebServerSecurityGroup).toBeDefined();
      expect(template.Resources.WebServerSecurityGroup.Type).toBe('AWS::EC2::SecurityGroup');
      
      expect(template.Resources.DatabaseSecurityGroup).toBeDefined();
      expect(template.Resources.DatabaseSecurityGroup.Type).toBe('AWS::EC2::SecurityGroup');
    });

    test('should have IAM roles', () => {
      expect(template.Resources.EC2Role).toBeDefined();
      expect(template.Resources.EC2Role.Type).toBe('AWS::IAM::Role');
    });

    test('should have IAM instance profile', () => {
      expect(template.Resources.EC2InstanceProfile).toBeDefined();
      expect(template.Resources.EC2InstanceProfile.Type).toBe('AWS::IAM::InstanceProfile');
    });
  });

  describe('Resources - Compute', () => {
    test('should have EC2 Launch Template', () => {
      expect(template.Resources.EC2LaunchTemplate).toBeDefined();
      expect(template.Resources.EC2LaunchTemplate.Type).toBe('AWS::EC2::LaunchTemplate');
    });

    test('should have Auto Scaling Group', () => {
      expect(template.Resources.AutoScalingGroup).toBeDefined();
      expect(template.Resources.AutoScalingGroup.Type).toBe('AWS::AutoScaling::AutoScalingGroup');
    });
  });

  describe('Resources - Storage', () => {
    test('should have S3 bucket with versioning', () => {
      expect(template.Resources.DataBucket).toBeDefined();
      expect(template.Resources.DataBucket.Type).toBe('AWS::S3::Bucket');
      expect(template.Resources.DataBucket.Properties.VersioningConfiguration.Status).toBe('Enabled');
    });

    test('should have S3 bucket encryption', () => {
      const bucket = template.Resources.DataBucket;
      expect(bucket.Properties.BucketEncryption).toBeDefined();
      expect(bucket.Properties.BucketEncryption.ServerSideEncryptionConfiguration).toBeDefined();
    });

    test('should have S3 public access blocked', () => {
      const bucket = template.Resources.DataBucket;
      expect(bucket.Properties.PublicAccessBlockConfiguration).toBeDefined();
      expect(bucket.Properties.PublicAccessBlockConfiguration.BlockPublicAcls).toBe(true);
      expect(bucket.Properties.PublicAccessBlockConfiguration.BlockPublicPolicy).toBe(true);
    });
  });

  describe('Resources - Database', () => {
    test('should have RDS subnet group', () => {
      expect(template.Resources.DBSubnetGroup).toBeDefined();
      expect(template.Resources.DBSubnetGroup.Type).toBe('AWS::RDS::DBSubnetGroup');
    });

    test('should have RDS instance', () => {
      expect(template.Resources.DatabaseInstance).toBeDefined();
      expect(template.Resources.DatabaseInstance.Type).toBe('AWS::RDS::DBInstance');
    });

    test('RDS should have encryption enabled', () => {
      const db = template.Resources.DatabaseInstance;
      expect(db.Properties.StorageEncrypted).toBe(true);
    });

    test('RDS should have backup configuration', () => {
      const db = template.Resources.DatabaseInstance;
      expect(db.Properties.BackupRetentionPeriod).toBeDefined();
    });

    test('should have Secrets Manager secret for RDS password', () => {
      expect(template.Resources.RDSPasswordSecret).toBeDefined();
      expect(template.Resources.RDSPasswordSecret.Type).toBe('AWS::SecretsManager::Secret');
    });
  });

  describe('Resources - Monitoring', () => {
    test('should have CloudWatch Log Groups', () => {
      expect(template.Resources.S3LogGroup).toBeDefined();
      expect(template.Resources.S3LogGroup.Type).toBe('AWS::Logs::LogGroup');
      
      expect(template.Resources.ApplicationLogGroup).toBeDefined();
      expect(template.Resources.ApplicationLogGroup.Type).toBe('AWS::Logs::LogGroup');
    });

    test('should have CloudWatch Alarms', () => {
      expect(template.Resources.CPUUtilizationAlarm).toBeDefined();
      expect(template.Resources.CPUUtilizationAlarm.Type).toBe('AWS::CloudWatch::Alarm');
      
      expect(template.Resources.DatabaseConnectionsAlarm).toBeDefined();
      expect(template.Resources.DatabaseConnectionsAlarm.Type).toBe('AWS::CloudWatch::Alarm');
    });
  });

  describe('Resources - Cost Management', () => {
    test('should have AWS Budget', () => {
      expect(template.Resources.EnvironmentBudget).toBeDefined();
      expect(template.Resources.EnvironmentBudget.Type).toBe('AWS::Budgets::Budget');
    });

    test('Budget should have notifications configured', () => {
      const budget = template.Resources.EnvironmentBudget;
      expect(budget.Properties.Budget.BudgetType).toBe('COST');
      expect(budget.Properties.NotificationsWithSubscribers).toBeDefined();
      expect(budget.Properties.NotificationsWithSubscribers.length).toBeGreaterThan(0);
    });
  });

  describe('Outputs', () => {
    test('should have VPC outputs', () => {
      expect(template.Outputs.VPCId).toBeDefined();
      expect(template.Outputs.VPCId.Export).toBeDefined();
    });

    test('should have subnet outputs', () => {
      expect(template.Outputs.PublicSubnet1Id).toBeDefined();
      expect(template.Outputs.PublicSubnet2Id).toBeDefined();
      expect(template.Outputs.PrivateSubnet1Id).toBeDefined();
      expect(template.Outputs.PrivateSubnet2Id).toBeDefined();
    });

    test('should have database endpoint output', () => {
      expect(template.Outputs.DatabaseEndpoint).toBeDefined();
    });

    test('should have S3 bucket output', () => {
      expect(template.Outputs.S3BucketName).toBeDefined();
    });

    test('should have KMS key output', () => {
      expect(template.Outputs.KMSKeyId).toBeDefined();
    });
  });

  describe('Multi-Environment Support', () => {
    test('should support staging and production environments', () => {
      const envTypeParam = template.Parameters.EnvironmentType;
      expect(envTypeParam.AllowedValues).toContain('staging');
      expect(envTypeParam.AllowedValues).toContain('production');
    });

    test('should have production-specific conditions', () => {
      expect(template.Conditions.IsProduction).toBeDefined();
    });

    test('should use environment suffix in resource naming', () => {
      // Check that resources use EnvironmentSuffix in their names
      const kmsAlias = template.Resources.KMSKeyAlias;
      expect(JSON.stringify(kmsAlias.Properties.AliasName)).toContain('EnvironmentSuffix');
    });
  });

  describe('Cross-Region Support', () => {
    test('should have replication role for S3', () => {
      expect(template.Resources.ReplicationRole).toBeDefined();
      expect(template.Resources.ReplicationRole.Type).toBe('AWS::IAM::Role');
    });

    test('replication role should have correct condition', () => {
      expect(template.Resources.ReplicationRole.Condition).toBe('IsProduction');
    });
  });
});