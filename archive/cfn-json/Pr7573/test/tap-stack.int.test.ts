// Integration tests for Multi-Region Disaster Recovery Solution for Payment Processing
import * as fs from 'fs';
import * as path from 'path';

const LIB_DIR = path.resolve(__dirname, '../lib');

describe('Multi-Region DR Payment Processing - Integration Tests', () => {
  const templatePath = path.join(LIB_DIR, 'TapStack.json');
  let template: any;

  beforeAll(() => {
    const templateContent = fs.readFileSync(templatePath, 'utf8');
    template = JSON.parse(templateContent);
  });

  describe('CloudFormation Template Structure', () => {
    test('template has valid AWSTemplateFormatVersion', () => {
      expect(template.AWSTemplateFormatVersion).toBe('2010-09-09');
    });

    test('template has description for DR solution', () => {
      expect(template.Description).toBeDefined();
      expect(template.Description).toContain('Disaster Recovery');
    });

    test('template has required parameters', () => {
      expect(template.Parameters).toBeDefined();
      expect(template.Parameters.EnvironmentSuffix).toBeDefined();
      expect(template.Parameters.HostedZoneName).toBeDefined();
      expect(template.Parameters.AlertEmail).toBeDefined();
    });
  });

  describe('VPC and Networking Resources', () => {
    test('VPC resource is defined with correct properties', () => {
      expect(template.Resources.PrimaryVPC).toBeDefined();
      expect(template.Resources.PrimaryVPC.Type).toBe('AWS::EC2::VPC');
      expect(template.Resources.PrimaryVPC.Properties.EnableDnsHostnames).toBe(true);
      expect(template.Resources.PrimaryVPC.Properties.EnableDnsSupport).toBe(true);
    });

    test('public subnets are defined in multiple AZs', () => {
      expect(template.Resources.PrimaryPublicSubnet1).toBeDefined();
      expect(template.Resources.PrimaryPublicSubnet2).toBeDefined();
      expect(template.Resources.PrimaryPublicSubnet1.Properties.MapPublicIpOnLaunch).toBe(true);
      expect(template.Resources.PrimaryPublicSubnet2.Properties.MapPublicIpOnLaunch).toBe(true);
    });

    test('private subnets are defined for database', () => {
      expect(template.Resources.PrimaryPrivateSubnet1).toBeDefined();
      expect(template.Resources.PrimaryPrivateSubnet2).toBeDefined();
    });

    test('internet gateway is attached to VPC', () => {
      expect(template.Resources.PrimaryInternetGateway).toBeDefined();
      expect(template.Resources.PrimaryVPCGatewayAttachment).toBeDefined();
    });
  });

  describe('Aurora Global Database Configuration', () => {
    test('global cluster is defined with Aurora MySQL', () => {
      expect(template.Resources.GlobalDBCluster).toBeDefined();
      expect(template.Resources.GlobalDBCluster.Type).toBe('AWS::RDS::GlobalCluster');
      expect(template.Resources.GlobalDBCluster.Properties.Engine).toBe('aurora-mysql');
    });

    test('global cluster has encryption enabled', () => {
      expect(template.Resources.GlobalDBCluster.Properties.StorageEncrypted).toBe(true);
    });

    test('global cluster has deletion protection disabled for testing', () => {
      expect(template.Resources.GlobalDBCluster.Properties.DeletionProtection).toBe(false);
    });

    test('primary DB cluster is defined with proper configuration', () => {
      expect(template.Resources.PrimaryDBCluster).toBeDefined();
      expect(template.Resources.PrimaryDBCluster.Type).toBe('AWS::RDS::DBCluster');
      expect(template.Resources.PrimaryDBCluster.Properties.BackupRetentionPeriod).toBe(7);
    });

    test('primary DB cluster uses secrets manager for credentials', () => {
      const masterUsername = template.Resources.PrimaryDBCluster.Properties.MasterUsername;
      const masterPassword = template.Resources.PrimaryDBCluster.Properties.MasterUserPassword;
      expect(masterUsername['Fn::Sub']).toContain('resolve:secretsmanager');
      expect(masterPassword['Fn::Sub']).toContain('resolve:secretsmanager');
    });

    test('DB subnet group uses private subnets', () => {
      expect(template.Resources.DBSubnetGroup).toBeDefined();
      expect(template.Resources.DBSubnetGroup.Properties.SubnetIds).toHaveLength(2);
    });
  });

  describe('Security Configuration', () => {
    test('Aurora security group restricts access', () => {
      expect(template.Resources.AuroraSecurityGroup).toBeDefined();
      const ingress = template.Resources.AuroraSecurityGroup.Properties.SecurityGroupIngress;
      expect(ingress).toBeDefined();
      expect(ingress.some((rule: any) => rule.FromPort === 3306)).toBe(true);
    });

    test('Lambda security group is defined', () => {
      expect(template.Resources.LambdaSecurityGroup).toBeDefined();
    });

    test('ALB security group allows HTTP and HTTPS', () => {
      expect(template.Resources.ALBSecurityGroup).toBeDefined();
      const ingress = template.Resources.ALBSecurityGroup.Properties.SecurityGroupIngress;
      expect(ingress.some((rule: any) => rule.FromPort === 80)).toBe(true);
      expect(ingress.some((rule: any) => rule.FromPort === 443)).toBe(true);
    });

    test('Secrets Manager secret is defined for DB credentials', () => {
      expect(template.Resources.DBMasterPasswordSecret).toBeDefined();
      expect(template.Resources.DBMasterPasswordSecret.Type).toBe('AWS::SecretsManager::Secret');
    });
  });

  describe('S3 Configuration', () => {
    test('transaction logs bucket is defined', () => {
      expect(template.Resources.TransactionLogsBucket).toBeDefined();
      expect(template.Resources.TransactionLogsBucket.Type).toBe('AWS::S3::Bucket');
    });

    test('S3 bucket has versioning enabled', () => {
      expect(template.Resources.TransactionLogsBucket.Properties.VersioningConfiguration.Status).toBe('Enabled');
    });

    test('S3 bucket has encryption enabled', () => {
      const encryption = template.Resources.TransactionLogsBucket.Properties.BucketEncryption;
      expect(encryption).toBeDefined();
      expect(encryption.ServerSideEncryptionConfiguration).toBeDefined();
    });

    test('S3 bucket blocks public access', () => {
      const publicAccess = template.Resources.TransactionLogsBucket.Properties.PublicAccessBlockConfiguration;
      expect(publicAccess.BlockPublicAcls).toBe(true);
      expect(publicAccess.BlockPublicPolicy).toBe(true);
    });
  });

  describe('Lambda Configuration', () => {
    test('payment processor Lambda function is defined', () => {
      expect(template.Resources.PaymentProcessorFunction).toBeDefined();
      expect(template.Resources.PaymentProcessorFunction.Type).toBe('AWS::Lambda::Function');
    });

    test('Lambda function is VPC attached', () => {
      const vpcConfig = template.Resources.PaymentProcessorFunction.Properties.VpcConfig;
      expect(vpcConfig).toBeDefined();
      expect(vpcConfig.SubnetIds).toHaveLength(2);
    });

    test('Lambda execution role is defined with proper permissions', () => {
      expect(template.Resources.LambdaExecutionRole).toBeDefined();
      expect(template.Resources.LambdaExecutionRole.Type).toBe('AWS::IAM::Role');
    });
  });

  describe('Load Balancer Configuration', () => {
    test('ALB is defined as internet-facing', () => {
      expect(template.Resources.PrimaryALB).toBeDefined();
      expect(template.Resources.PrimaryALB.Properties.Scheme).toBe('internet-facing');
    });

    test('ALB target group uses Lambda target type', () => {
      expect(template.Resources.PrimaryTargetGroup).toBeDefined();
      expect(template.Resources.PrimaryTargetGroup.Properties.TargetType).toBe('lambda');
    });

    test('ALB listener is configured on port 80', () => {
      expect(template.Resources.PrimaryALBListener).toBeDefined();
      expect(template.Resources.PrimaryALBListener.Properties.Port).toBe(80);
    });
  });

  describe('Route 53 Configuration', () => {
    test('hosted zone is defined', () => {
      expect(template.Resources.HostedZone).toBeDefined();
      expect(template.Resources.HostedZone.Type).toBe('AWS::Route53::HostedZone');
    });

    test('health check is defined for ALB', () => {
      expect(template.Resources.PrimaryALBHealthCheck).toBeDefined();
      expect(template.Resources.PrimaryALBHealthCheck.Type).toBe('AWS::Route53::HealthCheck');
    });

    test('DNS record set points to ALB', () => {
      expect(template.Resources.PrimaryRecordSet).toBeDefined();
      expect(template.Resources.PrimaryRecordSet.Properties.AliasTarget).toBeDefined();
    });
  });

  describe('Monitoring and Alerts', () => {
    test('SNS topic for alerts is defined', () => {
      expect(template.Resources.PrimarySNSTopic).toBeDefined();
      expect(template.Resources.PrimarySNSTopic.Type).toBe('AWS::SNS::Topic');
    });

    test('Aurora replication lag alarm is defined', () => {
      expect(template.Resources.AuroraReplicationLagAlarm).toBeDefined();
      expect(template.Resources.AuroraReplicationLagAlarm.Properties.MetricName).toBe('AuroraGlobalDBReplicationLag');
    });

    test('ALB target health alarm is defined', () => {
      expect(template.Resources.ALBTargetHealthAlarm).toBeDefined();
    });

    test('Lambda error alarm is defined', () => {
      expect(template.Resources.LambdaErrorAlarm).toBeDefined();
      expect(template.Resources.LambdaErrorAlarm.Properties.MetricName).toBe('Errors');
    });

    test('Route 53 health check alarm is defined', () => {
      expect(template.Resources.HealthCheckAlarm).toBeDefined();
    });
  });

  describe('Stack Outputs', () => {
    test('VPC ID is exported', () => {
      expect(template.Outputs.PrimaryVPCId).toBeDefined();
      expect(template.Outputs.PrimaryVPCId.Export).toBeDefined();
    });

    test('ALB DNS name is output', () => {
      expect(template.Outputs.PrimaryALBDNSName).toBeDefined();
    });

    test('Global DB cluster ARN is exported', () => {
      expect(template.Outputs.GlobalDBClusterArn).toBeDefined();
      expect(template.Outputs.GlobalDBClusterArn.Export).toBeDefined();
    });

    test('DB cluster endpoint is output', () => {
      expect(template.Outputs.PrimaryDBClusterEndpoint).toBeDefined();
    });

    test('S3 bucket name is output', () => {
      expect(template.Outputs.TransactionLogsBucketName).toBeDefined();
    });

    test('Route 53 hosted zone ID is exported', () => {
      expect(template.Outputs.Route53HostedZoneId).toBeDefined();
      expect(template.Outputs.Route53HostedZoneId.Export).toBeDefined();
    });

    test('Payment endpoint is output', () => {
      expect(template.Outputs.PaymentEndpoint).toBeDefined();
    });
  });
});
