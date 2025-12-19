import * as fs from 'fs';
import * as path from 'path';

describe('CloudFormation Multi-Region DR Template Unit Tests', () => {
  let primaryTemplate: any;
  let secondaryTemplate: any;
  let tapStackTemplate: any;

  beforeAll(() => {
    const primaryPath = path.join(__dirname, '..', 'lib', 'primary-stack.json');
    const secondaryPath = path.join(__dirname, '..', 'lib', 'secondary-stack.json');
    const tapStackPath = path.join(__dirname, '..', 'lib', 'TapStack.json');
    
    const primaryContent = fs.readFileSync(primaryPath, 'utf-8');
    const secondaryContent = fs.readFileSync(secondaryPath, 'utf-8');
    const tapStackContent = fs.readFileSync(tapStackPath, 'utf-8');
    
    primaryTemplate = JSON.parse(primaryContent);
    secondaryTemplate = JSON.parse(secondaryContent);
    tapStackTemplate = JSON.parse(tapStackContent);
  });

  describe('Template Structure', () => {
    test('primary template should have valid AWSTemplateFormatVersion', () => {
      expect(primaryTemplate.AWSTemplateFormatVersion).toBe('2010-09-09');
    });

    test('secondary template should have valid AWSTemplateFormatVersion', () => {
      expect(secondaryTemplate.AWSTemplateFormatVersion).toBe('2010-09-09');
    });

    test('primary template should have Description', () => {
      expect(primaryTemplate.Description).toBeDefined();
      expect(primaryTemplate.Description).toContain('Multi-Region DR');
    });

    test('secondary template should have Description', () => {
      expect(secondaryTemplate.Description).toBeDefined();
      expect(secondaryTemplate.Description).toContain('Secondary Region');
    });

    test('templates should have Parameters section', () => {
      expect(primaryTemplate.Parameters).toBeDefined();
      expect(secondaryTemplate.Parameters).toBeDefined();
    });

    test('templates should have Resources section', () => {
      expect(primaryTemplate.Resources).toBeDefined();
      expect(secondaryTemplate.Resources).toBeDefined();
      expect(Object.keys(primaryTemplate.Resources).length).toBeGreaterThan(0);
      expect(Object.keys(secondaryTemplate.Resources).length).toBeGreaterThan(0);
    });

    test('templates should have Outputs section', () => {
      expect(primaryTemplate.Outputs).toBeDefined();
      expect(secondaryTemplate.Outputs).toBeDefined();
    });
  });

  describe('Parameters', () => {
    test('both templates should have EnvironmentSuffix parameter', () => {
      expect(primaryTemplate.Parameters.EnvironmentSuffix).toBeDefined();
      expect(primaryTemplate.Parameters.EnvironmentSuffix.Type).toBe('String');
      expect(primaryTemplate.Parameters.EnvironmentSuffix.Default).toBe('dev');

      expect(secondaryTemplate.Parameters.EnvironmentSuffix).toBeDefined();
      expect(secondaryTemplate.Parameters.EnvironmentSuffix.Type).toBe('String');
    });

    test('primary template should use Secrets Manager for database credentials', () => {
      expect(primaryTemplate.Resources.DatabaseSecret).toBeDefined();
      expect(primaryTemplate.Resources.DatabaseSecret.Type).toBe('AWS::SecretsManager::Secret');
      expect(primaryTemplate.Resources.DatabaseSecret.Properties.GenerateSecretString).toBeDefined();
      expect(primaryTemplate.Resources.DatabaseSecret.Properties.GenerateSecretString.SecretStringTemplate).toContain('admin');
    });

    test('primary template should NOT have database credential parameters', () => {
      expect(primaryTemplate.Parameters.DatabaseUsername).toBeUndefined();
      expect(primaryTemplate.Parameters.DatabasePassword).toBeUndefined();
    });

    test('both templates should have NotificationEmail parameter', () => {
      expect(primaryTemplate.Parameters.NotificationEmail).toBeDefined();
      expect(primaryTemplate.Parameters.NotificationEmail.AllowedPattern).toBeDefined();
      
      expect(secondaryTemplate.Parameters.NotificationEmail).toBeDefined();
    });

    test('secondary template should have GlobalClusterIdentifier parameter', () => {
      expect(secondaryTemplate.Parameters.GlobalClusterIdentifier).toBeDefined();
      expect(secondaryTemplate.Parameters.GlobalClusterIdentifier.Type).toBe('String');
    });

    test('secondary template should have HostedZoneId parameter', () => {
      expect(secondaryTemplate.Parameters.HostedZoneId).toBeDefined();
      expect(secondaryTemplate.Parameters.HostedZoneId.Type).toBe('String');
    });
  });

  describe('VPC and Network Resources', () => {
    test('both templates should have VPC resource', () => {
      expect(primaryTemplate.Resources.VPC).toBeDefined();
      expect(primaryTemplate.Resources.VPC.Type).toBe('AWS::EC2::VPC');
      expect(primaryTemplate.Resources.VPC.Properties.CidrBlock).toBe('10.0.0.0/16');
      
      expect(secondaryTemplate.Resources.VPC).toBeDefined();
      expect(secondaryTemplate.Resources.VPC.Type).toBe('AWS::EC2::VPC');
      expect(secondaryTemplate.Resources.VPC.Properties.CidrBlock).toBe('10.1.0.0/16');
    });

    test('VPCs should enable DNS', () => {
      expect(primaryTemplate.Resources.VPC.Properties.EnableDnsHostnames).toBe(true);
      expect(primaryTemplate.Resources.VPC.Properties.EnableDnsSupport).toBe(true);
      
      expect(secondaryTemplate.Resources.VPC.Properties.EnableDnsHostnames).toBe(true);
      expect(secondaryTemplate.Resources.VPC.Properties.EnableDnsSupport).toBe(true);
    });

    test('both templates should have 3 private subnets', () => {
      expect(primaryTemplate.Resources.PrivateSubnet1).toBeDefined();
      expect(primaryTemplate.Resources.PrivateSubnet2).toBeDefined();
      expect(primaryTemplate.Resources.PrivateSubnet3).toBeDefined();
      
      expect(secondaryTemplate.Resources.PrivateSubnet1).toBeDefined();
      expect(secondaryTemplate.Resources.PrivateSubnet2).toBeDefined();
      expect(secondaryTemplate.Resources.PrivateSubnet3).toBeDefined();
    });

    test('subnets should be in different AZs', () => {
      const checkSubnetAZs = (template: any) => {
        expect(template.Resources.PrivateSubnet1.Properties.AvailabilityZone['Fn::Select'][0]).toBe(0);
        expect(template.Resources.PrivateSubnet2.Properties.AvailabilityZone['Fn::Select'][0]).toBe(1);
        expect(template.Resources.PrivateSubnet3.Properties.AvailabilityZone['Fn::Select'][0]).toBe(2);
      };

      checkSubnetAZs(primaryTemplate);
      checkSubnetAZs(secondaryTemplate);
    });

    test('both templates should have DB subnet group', () => {
      expect(primaryTemplate.Resources.DBSubnetGroup).toBeDefined();
      expect(primaryTemplate.Resources.DBSubnetGroup.Type).toBe('AWS::RDS::DBSubnetGroup');
      expect(primaryTemplate.Resources.DBSubnetGroup.Properties.SubnetIds.length).toBe(3);
      
      expect(secondaryTemplate.Resources.DBSubnetGroup).toBeDefined();
      expect(secondaryTemplate.Resources.DBSubnetGroup.Type).toBe('AWS::RDS::DBSubnetGroup');
      expect(secondaryTemplate.Resources.DBSubnetGroup.Properties.SubnetIds.length).toBe(3);
    });

    test('both templates should have security groups', () => {
      expect(primaryTemplate.Resources.DatabaseSecurityGroup).toBeDefined();
      expect(primaryTemplate.Resources.LambdaSecurityGroup).toBeDefined();
      
      expect(secondaryTemplate.Resources.DatabaseSecurityGroup).toBeDefined();
      expect(secondaryTemplate.Resources.LambdaSecurityGroup).toBeDefined();
    });

    test('security groups should not have circular dependencies', () => {
      // Database SG should not have inline ingress rules
      expect(primaryTemplate.Resources.DatabaseSecurityGroup.Properties.SecurityGroupIngress).toBeUndefined();
      expect(secondaryTemplate.Resources.DatabaseSecurityGroup.Properties.SecurityGroupIngress).toBeUndefined();

      // Separate ingress/egress resources should exist
      expect(primaryTemplate.Resources.DatabaseSecurityGroupIngress).toBeDefined();
      expect(primaryTemplate.Resources.LambdaSecurityGroupEgress).toBeDefined();
      
      expect(secondaryTemplate.Resources.DatabaseSecurityGroupIngress).toBeDefined();
      expect(secondaryTemplate.Resources.LambdaSecurityGroupEgress).toBeDefined();
    });
  });

  describe('Aurora Global Database', () => {
    test('primary template should have Global Cluster', () => {
      expect(primaryTemplate.Resources.GlobalCluster).toBeDefined();
      expect(primaryTemplate.Resources.GlobalCluster.Type).toBe('AWS::RDS::GlobalCluster');
    });

    test('Global Cluster should have correct configuration', () => {
      const globalCluster = primaryTemplate.Resources.GlobalCluster.Properties;
      expect(globalCluster.Engine).toBe('aurora-mysql');
      expect(globalCluster.EngineVersion).toBe('8.0.mysql_aurora.3.04.0');
      expect(globalCluster.DeletionProtection).toBe(false);
      expect(globalCluster.StorageEncrypted).toBe(true);
    });

    test('primary template should have Aurora DB Cluster', () => {
      expect(primaryTemplate.Resources.AuroraDBCluster).toBeDefined();
      expect(primaryTemplate.Resources.AuroraDBCluster.Type).toBe('AWS::RDS::DBCluster');
    });

    test('primary Aurora cluster should depend on Global Cluster', () => {
      expect(primaryTemplate.Resources.AuroraDBCluster.DependsOn).toBe('GlobalCluster');
    });

    test('primary Aurora cluster should have correct configuration', () => {
      const cluster = primaryTemplate.Resources.AuroraDBCluster.Properties;
      expect(cluster.Engine).toBe('aurora-mysql');
      expect(cluster.BackupRetentionPeriod).toBe(7);
      expect(cluster.StorageEncrypted).toBe(true);
      expect(cluster.DeletionProtection).toBe(false);
      expect(cluster.EnableCloudwatchLogsExports).toEqual(['error', 'general', 'slowquery']);
    });

    test('primary Aurora cluster should have DeletionPolicy Delete', () => {
      expect(primaryTemplate.Resources.AuroraDBCluster.DeletionPolicy).toBe('Delete');
    });

    test('primary template should have 2 Aurora DB instances', () => {
      expect(primaryTemplate.Resources.AuroraDBInstance1).toBeDefined();
      expect(primaryTemplate.Resources.AuroraDBInstance2).toBeDefined();
      
      expect(primaryTemplate.Resources.AuroraDBInstance1.Properties.DBInstanceClass).toBe('db.r5.large');
      expect(primaryTemplate.Resources.AuroraDBInstance2.Properties.DBInstanceClass).toBe('db.r5.large');
    });

    test('secondary template should have Aurora DB Cluster', () => {
      expect(secondaryTemplate.Resources.SecondaryAuroraDBCluster).toBeDefined();
      expect(secondaryTemplate.Resources.SecondaryAuroraDBCluster.Type).toBe('AWS::RDS::DBCluster');
    });

    test('secondary Aurora cluster should reference Global Cluster', () => {
      const cluster = secondaryTemplate.Resources.SecondaryAuroraDBCluster.Properties;
      expect(cluster.GlobalClusterIdentifier).toEqual({ Ref: 'GlobalClusterIdentifier' });
    });

    test('secondary Aurora cluster should not have master credentials', () => {
      const cluster = secondaryTemplate.Resources.SecondaryAuroraDBCluster.Properties;
      expect(cluster.MasterUsername).toBeUndefined();
      expect(cluster.MasterUserPassword).toBeUndefined();
    });

    test('secondary template should have at least 1 Aurora DB instance', () => {
      expect(secondaryTemplate.Resources.SecondaryAuroraDBInstance1).toBeDefined();
      expect(secondaryTemplate.Resources.SecondaryAuroraDBInstance1.Properties.DBInstanceClass).toBe('db.r5.large');
    });

    test('DB instances should not be publicly accessible', () => {
      expect(primaryTemplate.Resources.AuroraDBInstance1.Properties.PubliclyAccessible).toBe(false);
      expect(primaryTemplate.Resources.AuroraDBInstance2.Properties.PubliclyAccessible).toBe(false);
      expect(secondaryTemplate.Resources.SecondaryAuroraDBInstance1.Properties.PubliclyAccessible).toBe(false);
    });
  });

  describe('Lambda Functions', () => {
    test('both templates should have Lambda execution role', () => {
      expect(primaryTemplate.Resources.LambdaExecutionRole).toBeDefined();
      expect(primaryTemplate.Resources.LambdaExecutionRole.Type).toBe('AWS::IAM::Role');
      
      expect(secondaryTemplate.Resources.LambdaExecutionRole).toBeDefined();
      expect(secondaryTemplate.Resources.LambdaExecutionRole.Type).toBe('AWS::IAM::Role');
    });

    test('Lambda roles should have VPC access managed policy', () => {
      const primaryPolicies = primaryTemplate.Resources.LambdaExecutionRole.Properties.ManagedPolicyArns;
      expect(primaryPolicies).toContain('arn:aws:iam::aws:policy/service-role/AWSLambdaVPCAccessExecutionRole');
      
      const secondaryPolicies = secondaryTemplate.Resources.LambdaExecutionRole.Properties.ManagedPolicyArns;
      expect(secondaryPolicies).toContain('arn:aws:iam::aws:policy/service-role/AWSLambdaVPCAccessExecutionRole');
    });

    test('Lambda roles should have inline policies for RDS and logs', () => {
      const checkPolicies = (role: any) => {
        const policies = role.Properties.Policies;
        const policyNames = policies.map((p: any) => p.PolicyName);
        expect(policyNames).toContain('RDSDataAccess');
        expect(policyNames).toContain('CloudWatchLogs');
      };

      checkPolicies(primaryTemplate.Resources.LambdaExecutionRole);
      checkPolicies(secondaryTemplate.Resources.LambdaExecutionRole);
    });

    test('both templates should have payment processor Lambda function', () => {
      expect(primaryTemplate.Resources.PaymentProcessorFunction).toBeDefined();
      expect(primaryTemplate.Resources.PaymentProcessorFunction.Type).toBe('AWS::Lambda::Function');
      
      expect(secondaryTemplate.Resources.PaymentProcessorFunction).toBeDefined();
      expect(secondaryTemplate.Resources.PaymentProcessorFunction.Type).toBe('AWS::Lambda::Function');
    });

    test('Lambda functions should have correct runtime and configuration', () => {
      const checkLambda = (func: any) => {
        expect(func.Properties.Runtime).toBe('python3.11');
        expect(func.Properties.MemorySize).toBe(1024);
        expect(func.Properties.Timeout).toBe(30);
      };

      checkLambda(primaryTemplate.Resources.PaymentProcessorFunction);
      checkLambda(secondaryTemplate.Resources.PaymentProcessorFunction);
    });

    test('Lambda functions should be in VPC', () => {
      const checkVpcConfig = (func: any) => {
        expect(func.Properties.VpcConfig).toBeDefined();
        expect(func.Properties.VpcConfig.SubnetIds.length).toBe(3);
        expect(func.Properties.VpcConfig.SecurityGroupIds.length).toBeGreaterThan(0);
      };

      checkVpcConfig(primaryTemplate.Resources.PaymentProcessorFunction);
      checkVpcConfig(secondaryTemplate.Resources.PaymentProcessorFunction);
    });

    test('Lambda functions should have environment variables', () => {
      expect(primaryTemplate.Resources.PaymentProcessorFunction.Properties.Environment).toBeDefined();
      expect(primaryTemplate.Resources.PaymentProcessorFunction.Properties.Environment.Variables.REGION).toBe('us-east-1');
      
      expect(secondaryTemplate.Resources.PaymentProcessorFunction.Properties.Environment).toBeDefined();
      expect(secondaryTemplate.Resources.PaymentProcessorFunction.Properties.Environment.Variables.REGION).toBe('us-west-2');
    });

    test('Lambda functions should have inline code', () => {
      expect(primaryTemplate.Resources.PaymentProcessorFunction.Properties.Code.ZipFile).toBeDefined();
      expect(secondaryTemplate.Resources.PaymentProcessorFunction.Properties.Code.ZipFile).toBeDefined();
    });

    test('both templates should have Lambda log groups', () => {
      expect(primaryTemplate.Resources.PaymentProcessorLogGroup).toBeDefined();
      expect(primaryTemplate.Resources.PaymentProcessorLogGroup.Type).toBe('AWS::Logs::LogGroup');
      expect(primaryTemplate.Resources.PaymentProcessorLogGroup.Properties.RetentionInDays).toBe(30);
      
      expect(secondaryTemplate.Resources.PaymentProcessorLogGroup).toBeDefined();
      expect(secondaryTemplate.Resources.PaymentProcessorLogGroup.Type).toBe('AWS::Logs::LogGroup');
      expect(secondaryTemplate.Resources.PaymentProcessorLogGroup.Properties.RetentionInDays).toBe(30);
    });
  });

  describe('CloudWatch Alarms', () => {
    test('primary template should have replication lag alarm', () => {
      expect(primaryTemplate.Resources.ReplicationLagAlarm).toBeDefined();
      expect(primaryTemplate.Resources.ReplicationLagAlarm.Type).toBe('AWS::CloudWatch::Alarm');
      expect(primaryTemplate.Resources.ReplicationLagAlarm.Properties.MetricName).toBe('AuroraGlobalDBReplicationLag');
      expect(primaryTemplate.Resources.ReplicationLagAlarm.Properties.Threshold).toBe(1000);
    });

    test('both templates should have database CPU alarms', () => {
      expect(primaryTemplate.Resources.DatabaseCPUAlarm).toBeDefined();
      expect(primaryTemplate.Resources.DatabaseCPUAlarm.Properties.MetricName).toBe('CPUUtilization');
      expect(primaryTemplate.Resources.DatabaseCPUAlarm.Properties.Threshold).toBe(80);
      
      expect(secondaryTemplate.Resources.SecondaryDatabaseCPUAlarm).toBeDefined();
      expect(secondaryTemplate.Resources.SecondaryDatabaseCPUAlarm.Properties.MetricName).toBe('CPUUtilization');
    });

    test('both templates should have Lambda error alarms', () => {
      expect(primaryTemplate.Resources.LambdaErrorAlarm).toBeDefined();
      expect(primaryTemplate.Resources.LambdaErrorAlarm.Properties.MetricName).toBe('Errors');
      
      expect(secondaryTemplate.Resources.SecondaryLambdaErrorAlarm).toBeDefined();
      expect(secondaryTemplate.Resources.SecondaryLambdaErrorAlarm.Properties.MetricName).toBe('Errors');
    });

    test('primary template should have Lambda throttle alarm', () => {
      expect(primaryTemplate.Resources.LambdaThrottleAlarm).toBeDefined();
      expect(primaryTemplate.Resources.LambdaThrottleAlarm.Properties.MetricName).toBe('Throttles');
    });
  });

  describe('SNS Topics', () => {
    test('both templates should have SNS topics', () => {
      expect(primaryTemplate.Resources.FailoverNotificationTopic).toBeDefined();
      expect(primaryTemplate.Resources.FailoverNotificationTopic.Type).toBe('AWS::SNS::Topic');
      
      expect(secondaryTemplate.Resources.SecondaryFailoverNotificationTopic).toBeDefined();
      expect(secondaryTemplate.Resources.SecondaryFailoverNotificationTopic.Type).toBe('AWS::SNS::Topic');
    });

    test('SNS topics should have KMS encryption', () => {
      expect(primaryTemplate.Resources.FailoverNotificationTopic.Properties.KmsMasterKeyId).toBe('alias/aws/sns');
      expect(secondaryTemplate.Resources.SecondaryFailoverNotificationTopic.Properties.KmsMasterKeyId).toBe('alias/aws/sns');
    });

    test('both templates should have SNS subscriptions', () => {
      expect(primaryTemplate.Resources.FailoverNotificationSubscription).toBeDefined();
      expect(primaryTemplate.Resources.FailoverNotificationSubscription.Type).toBe('AWS::SNS::Subscription');
      expect(primaryTemplate.Resources.FailoverNotificationSubscription.Properties.Protocol).toBe('email');
      
      expect(secondaryTemplate.Resources.SecondaryFailoverNotificationSubscription).toBeDefined();
      expect(secondaryTemplate.Resources.SecondaryFailoverNotificationSubscription.Type).toBe('AWS::SNS::Subscription');
    });
  });

  describe('Route 53 DNS Failover', () => {
    test('primary template should have hosted zone', () => {
      expect(primaryTemplate.Resources.Route53HostedZone).toBeDefined();
      expect(primaryTemplate.Resources.Route53HostedZone.Type).toBe('AWS::Route53::HostedZone');
    });

    test('hosted zone should not use reserved domain', () => {
      const zoneName = primaryTemplate.Resources.Route53HostedZone.Properties.Name['Fn::Sub'];
      expect(zoneName).toContain('test-domain.internal');
      expect(zoneName).not.toContain('example.com');
    });

    test('primary template should have health check', () => {
      expect(primaryTemplate.Resources.PrimaryHealthCheck).toBeDefined();
      expect(primaryTemplate.Resources.PrimaryHealthCheck.Type).toBe('AWS::Route53::HealthCheck');
    });

    test('primary health check should use CloudWatch metric', () => {
      const config = primaryTemplate.Resources.PrimaryHealthCheck.Properties.HealthCheckConfig;
      expect(config.Type).toBe('CLOUDWATCH_METRIC');
      expect(config.AlarmIdentifier).toBeDefined();
      expect(config.AlarmIdentifier.Region).toBe('us-east-1');
    });

    test('primary health check should depend on health alarm', () => {
      expect(primaryTemplate.Resources.PrimaryHealthCheck.DependsOn).toBe('PrimaryHealthAlarm');
    });

    test('primary template should have DNS record', () => {
      expect(primaryTemplate.Resources.PrimaryDNSRecord).toBeDefined();
      expect(primaryTemplate.Resources.PrimaryDNSRecord.Type).toBe('AWS::Route53::RecordSet');
      expect(primaryTemplate.Resources.PrimaryDNSRecord.Properties.Failover).toBe('PRIMARY');
      expect(primaryTemplate.Resources.PrimaryDNSRecord.Properties.Type).toBe('CNAME');
      expect(primaryTemplate.Resources.PrimaryDNSRecord.Properties.TTL).toBe(60);
    });

    test('secondary template should have health check', () => {
      expect(secondaryTemplate.Resources.SecondaryHealthCheck).toBeDefined();
      expect(secondaryTemplate.Resources.SecondaryHealthCheck.Type).toBe('AWS::Route53::HealthCheck');
    });

    test('secondary health check should use CloudWatch metric in us-west-2', () => {
      const config = secondaryTemplate.Resources.SecondaryHealthCheck.Properties.HealthCheckConfig;
      expect(config.Type).toBe('CLOUDWATCH_METRIC');
      expect(config.AlarmIdentifier.Region).toBe('us-west-2');
    });

    test('secondary template should have DNS record', () => {
      expect(secondaryTemplate.Resources.SecondaryDNSRecord).toBeDefined();
      expect(secondaryTemplate.Resources.SecondaryDNSRecord.Type).toBe('AWS::Route53::RecordSet');
      expect(secondaryTemplate.Resources.SecondaryDNSRecord.Properties.Failover).toBe('SECONDARY');
      expect(secondaryTemplate.Resources.SecondaryDNSRecord.Properties.Type).toBe('CNAME');
    });

    test('secondary DNS record should reference hosted zone parameter', () => {
      expect(secondaryTemplate.Resources.SecondaryDNSRecord.Properties.HostedZoneId).toEqual({ Ref: 'HostedZoneId' });
    });
  });

  describe('Resource Naming', () => {
    test('all primary resources should include EnvironmentSuffix', () => {
      const checkNaming = (resourceName: string, propertyPath: string[] = ['Properties']) => {
        const resource = primaryTemplate.Resources[resourceName];
        const resourceStr = JSON.stringify(resource);
        expect(resourceStr).toContain('${EnvironmentSuffix}');
      };

      checkNaming('VPC');
      checkNaming('DBSubnetGroup');
      checkNaming('AuroraDBCluster');
      checkNaming('PaymentProcessorFunction');
      checkNaming('FailoverNotificationTopic');
      checkNaming('Route53HostedZone');
    });

    test('all secondary resources should include EnvironmentSuffix', () => {
      const checkNaming = (resourceName: string) => {
        const resource = secondaryTemplate.Resources[resourceName];
        const resourceStr = JSON.stringify(resource);
        expect(resourceStr).toContain('${EnvironmentSuffix}');
      };

      checkNaming('VPC');
      checkNaming('DBSubnetGroup');
      checkNaming('SecondaryAuroraDBCluster');
      checkNaming('PaymentProcessorFunction');
      checkNaming('SecondaryFailoverNotificationTopic');
    });
  });

  describe('Outputs', () => {
    test('primary template should have all required outputs', () => {
      expect(primaryTemplate.Outputs.VPCId).toBeDefined();
      expect(primaryTemplate.Outputs.PrimaryAuroraEndpoint).toBeDefined();
      expect(primaryTemplate.Outputs.PrimaryAuroraReadEndpoint).toBeDefined();
      expect(primaryTemplate.Outputs.PrimaryLambdaArn).toBeDefined();
      expect(primaryTemplate.Outputs.GlobalClusterId).toBeDefined();
      expect(primaryTemplate.Outputs.HostedZoneId).toBeDefined();
      expect(primaryTemplate.Outputs.SNSTopicArn).toBeDefined();
    });

    test('secondary template should have all required outputs', () => {
      expect(secondaryTemplate.Outputs.VPCId).toBeDefined();
      expect(secondaryTemplate.Outputs.SecondaryAuroraEndpoint).toBeDefined();
      expect(secondaryTemplate.Outputs.SecondaryAuroraReadEndpoint).toBeDefined();
      expect(secondaryTemplate.Outputs.SecondaryLambdaArn).toBeDefined();
      expect(secondaryTemplate.Outputs.SNSTopicArn).toBeDefined();
    });

    test('outputs should have Export names', () => {
      expect(primaryTemplate.Outputs.VPCId.Export).toBeDefined();
      expect(primaryTemplate.Outputs.GlobalClusterId.Export).toBeDefined();
      expect(secondaryTemplate.Outputs.VPCId.Export).toBeDefined();
    });
  });

  describe('Security Best Practices', () => {
    test('no resources should have Retain deletion policy', () => {
      const checkDeletionPolicy = (template: any) => {
        Object.keys(template.Resources).forEach(resourceName => {
          const resource = template.Resources[resourceName];
          if (resource.DeletionPolicy) {
            expect(resource.DeletionPolicy).not.toBe('Retain');
          }
        });
      };

      checkDeletionPolicy(primaryTemplate);
      checkDeletionPolicy(secondaryTemplate);
    });

    test('Aurora clusters should have encryption enabled', () => {
      expect(primaryTemplate.Resources.AuroraDBCluster.Properties.StorageEncrypted).toBe(true);
      expect(secondaryTemplate.Resources.SecondaryAuroraDBCluster.Properties.StorageEncrypted).toBe(true);
      expect(primaryTemplate.Resources.GlobalCluster.Properties.StorageEncrypted).toBe(true);
    });

    test('Aurora clusters should have deletion protection disabled for testing', () => {
      expect(primaryTemplate.Resources.AuroraDBCluster.Properties.DeletionProtection).toBe(false);
      expect(primaryTemplate.Resources.GlobalCluster.Properties.DeletionProtection).toBe(false);
      expect(secondaryTemplate.Resources.SecondaryAuroraDBCluster.Properties.DeletionProtection).toBe(false);
    });

    test('DB instances should not be publicly accessible', () => {
      expect(primaryTemplate.Resources.AuroraDBInstance1.Properties.PubliclyAccessible).toBe(false);
      expect(secondaryTemplate.Resources.SecondaryAuroraDBInstance1.Properties.PubliclyAccessible).toBe(false);
    });

    test('security groups should not allow unrestricted access', () => {
      // Check that security groups don't have 0.0.0.0/0 for database access
      const dbIngress = primaryTemplate.Resources.DatabaseSecurityGroupIngress.Properties;
      expect(dbIngress.SourceSecurityGroupId).toBeDefined();
      expect(dbIngress.CidrIp).toBeUndefined();
    });
  });

  describe('Multi-Region Configuration', () => {
    test('primary template should be us-east-1 specific', () => {
      const primaryStr = JSON.stringify(primaryTemplate);
      expect(primaryStr).toContain('us-east-1');
      expect(primaryTemplate.Resources.PaymentProcessorFunction.Properties.Environment.Variables.REGION).toBe('us-east-1');
    });

    test('secondary template should be us-west-2 specific', () => {
      const secondaryStr = JSON.stringify(secondaryTemplate);
      expect(secondaryStr).toContain('us-west-2');
      expect(secondaryTemplate.Resources.PaymentProcessorFunction.Properties.Environment.Variables.REGION).toBe('us-west-2');
    });

    test('VPCs should have different CIDR blocks', () => {
      expect(primaryTemplate.Resources.VPC.Properties.CidrBlock).toBe('10.0.0.0/16');
      expect(secondaryTemplate.Resources.VPC.Properties.CidrBlock).toBe('10.1.0.0/16');
    });
  });

  describe('Disaster Recovery Configuration', () => {
    test('primary stack should define global cluster', () => {
      expect(primaryTemplate.Resources.GlobalCluster).toBeDefined();
      expect(primaryTemplate.Resources.GlobalCluster.Type).toBe('AWS::RDS::GlobalCluster');
    });

    test('secondary stack should reference global cluster from parameters', () => {
      const cluster = secondaryTemplate.Resources.SecondaryAuroraDBCluster;
      expect(cluster.Properties.GlobalClusterIdentifier).toEqual({ Ref: 'GlobalClusterIdentifier' });
    });

    test('both stacks should have health checks for failover', () => {
      expect(primaryTemplate.Resources.PrimaryHealthCheck).toBeDefined();
      expect(secondaryTemplate.Resources.SecondaryHealthCheck).toBeDefined();
    });

    test('DNS records should have different failover settings', () => {
      expect(primaryTemplate.Resources.PrimaryDNSRecord.Properties.Failover).toBe('PRIMARY');
      expect(secondaryTemplate.Resources.SecondaryDNSRecord.Properties.Failover).toBe('SECONDARY');
    });

    test('both stacks should have Lambda functions configured', () => {
      // Note: ReservedConcurrentExecutions removed due to account concurrency limits
      expect(primaryTemplate.Resources.PaymentProcessorFunction.Properties.MemorySize).toBe(1024);
      expect(secondaryTemplate.Resources.PaymentProcessorFunction.Properties.MemorySize).toBe(1024);
    });
  });

  describe('Template Validation', () => {
    test('templates should be valid JSON', () => {
      expect(primaryTemplate).toBeDefined();
      expect(secondaryTemplate).toBeDefined();
      expect(typeof primaryTemplate).toBe('object');
      expect(typeof secondaryTemplate).toBe('object');
    });

    test('primary template should have expected resource count', () => {
      const resourceCount = Object.keys(primaryTemplate.Resources).length;
      expect(resourceCount).toBeGreaterThan(20);
      expect(resourceCount).toBeLessThan(50);
    });

    test('secondary template should have expected resource count', () => {
      const resourceCount = Object.keys(secondaryTemplate.Resources).length;
      expect(resourceCount).toBeGreaterThan(15);
      expect(resourceCount).toBeLessThan(40);
    });

    test('no hardcoded account IDs should be present', () => {
      const primaryStr = JSON.stringify(primaryTemplate.Resources);
      const secondaryStr = JSON.stringify(secondaryTemplate.Resources);
      
      // Allow AWS account references in ARNs, but not hardcoded specific account IDs
      const accountIdPattern = /\d{12}/;
      const matches = primaryStr.match(accountIdPattern) || [];
      const matches2 = secondaryStr.match(accountIdPattern) || [];
      
      // If account IDs are found, they should be in ${AWS::AccountId} format
      if (matches.length > 0 || matches2.length > 0) {
        expect(primaryStr).toContain('${AWS::AccountId}');
        expect(secondaryStr).toContain('${AWS::AccountId}');
      }
    });
  });

  describe('TapStack.json Deployment Template', () => {
    test('TapStack.json should exist and be valid', () => {
      expect(tapStackTemplate).toBeDefined();
      expect(tapStackTemplate.AWSTemplateFormatVersion).toBe('2010-09-09');
    });

    test('TapStack.json should be the primary stack template', () => {
      expect(tapStackTemplate.Description).toContain('Primary Region');
      expect(tapStackTemplate.Description).toContain('us-east-1');
    });

    test('TapStack.json should have required parameters (using Secrets Manager for DB)', () => {
      expect(tapStackTemplate.Parameters.EnvironmentSuffix).toBeDefined();
      expect(tapStackTemplate.Parameters.NotificationEmail).toBeDefined();
      // Database credentials now managed by Secrets Manager
      expect(tapStackTemplate.Parameters.DatabaseUsername).toBeUndefined();
      expect(tapStackTemplate.Parameters.DatabasePassword).toBeUndefined();
    });

    test('TapStack.json should have Secrets Manager secret for database credentials', () => {
      expect(tapStackTemplate.Resources.DatabaseSecret).toBeDefined();
      expect(tapStackTemplate.Resources.DatabaseSecret.Type).toBe('AWS::SecretsManager::Secret');
      expect(tapStackTemplate.Resources.DatabaseSecret.Properties.GenerateSecretString).toBeDefined();
    });

    test('TapStack.json should have GlobalCluster resource', () => {
      expect(tapStackTemplate.Resources.GlobalCluster).toBeDefined();
      expect(tapStackTemplate.Resources.GlobalCluster.Type).toBe('AWS::RDS::GlobalCluster');
    });

    test('TapStack.json should have Aurora DB Cluster', () => {
      expect(tapStackTemplate.Resources.AuroraDBCluster).toBeDefined();
      expect(tapStackTemplate.Resources.AuroraDBCluster.Type).toBe('AWS::RDS::DBCluster');
    });

    test('TapStack.json should have Lambda function', () => {
      expect(tapStackTemplate.Resources.PaymentProcessorFunction).toBeDefined();
      expect(tapStackTemplate.Resources.PaymentProcessorFunction.Type).toBe('AWS::Lambda::Function');
    });

    test('TapStack.json should have Route 53 hosted zone', () => {
      expect(tapStackTemplate.Resources.HostedZone).toBeDefined();
      expect(tapStackTemplate.Resources.HostedZone.Type).toBe('AWS::Route53::HostedZone');
    });

    test('TapStack.json should have primary health check', () => {
      expect(tapStackTemplate.Resources.PrimaryHealthCheck).toBeDefined();
      expect(tapStackTemplate.Resources.PrimaryHealthCheck.Type).toBe('AWS::Route53::HealthCheck');
    });

    test('TapStack.json should not have circular dependency in security groups', () => {
      const lambdaSG = tapStackTemplate.Resources.LambdaSecurityGroup;
      const dbSG = tapStackTemplate.Resources.DatabaseSecurityGroup;
      
      // Security groups should not have ingress/egress rules that reference each other
      expect(lambdaSG.Properties.SecurityGroupIngress).toBeUndefined();
      expect(dbSG.Properties.SecurityGroupEgress).toBeUndefined();
      
      // Separate ingress/egress rules should exist
      expect(tapStackTemplate.Resources.DatabaseSecurityGroupIngress).toBeDefined();
      expect(tapStackTemplate.Resources.LambdaSecurityGroupEgressDB).toBeDefined();
    });

    test('TapStack.json should use valid Aurora engine version', () => {
      const globalCluster = tapStackTemplate.Resources.GlobalCluster;
      const dbCluster = tapStackTemplate.Resources.AuroraDBCluster;
      
      expect(globalCluster.Properties.EngineVersion).toBe('8.0.mysql_aurora.3.04.0');
      expect(dbCluster.Properties.EngineVersion).toBe('8.0.mysql_aurora.3.04.0');
    });

    test('TapStack.json should have all required outputs', () => {
      expect(tapStackTemplate.Outputs.GlobalClusterIdentifier).toBeDefined();
      expect(tapStackTemplate.Outputs.PrimaryClusterEndpoint).toBeDefined();
      expect(tapStackTemplate.Outputs.PrimaryLambdaArn).toBeDefined();
      expect(tapStackTemplate.Outputs.HostedZoneId).toBeDefined();
      expect(tapStackTemplate.Outputs.PrimarySNSTopicArn).toBeDefined();
    });

    test('TapStack.json should have DeletionProtection disabled', () => {
      expect(tapStackTemplate.Resources.GlobalCluster.Properties.DeletionProtection).toBe(false);
      expect(tapStackTemplate.Resources.AuroraDBCluster.Properties.DeletionProtection).toBe(false);
    });

    test('TapStack.json should have DeletionPolicy Delete', () => {
      expect(tapStackTemplate.Resources.AuroraDBCluster.DeletionPolicy).toBe('Delete');
      expect(tapStackTemplate.Resources.AuroraDBInstance1.DeletionPolicy).toBe('Delete');
      expect(tapStackTemplate.Resources.AuroraDBInstance2.DeletionPolicy).toBe('Delete');
    });
  });
});

