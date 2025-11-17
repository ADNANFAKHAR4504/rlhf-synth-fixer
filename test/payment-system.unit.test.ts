import { describe, test, expect, beforeAll, afterAll } from '@jest/globals';
import * as fs from 'fs';
import * as path from 'path';
import * as yaml from 'js-yaml';

describe('Payment Processing System - Unit Tests', () => {
  let mainTemplate: any;
  let networkStack: any;
  let databaseStack: any;
  let computeStack: any;
  let queueStack: any;
  let monitoringStack: any;
  let route53Stack: any;

  beforeAll(() => {
    // Load all CloudFormation templates
    const templateDir = path.join(__dirname, '..', 'lib');

    try {
      mainTemplate = yaml.load(fs.readFileSync(path.join(templateDir, 'main-template.yaml'), 'utf8'));
      networkStack = yaml.load(fs.readFileSync(path.join(templateDir, 'network-stack.yaml'), 'utf8'));
      databaseStack = yaml.load(fs.readFileSync(path.join(templateDir, 'database-stack.yaml'), 'utf8'));
      computeStack = yaml.load(fs.readFileSync(path.join(templateDir, 'compute-stack.yaml'), 'utf8'));
      queueStack = yaml.load(fs.readFileSync(path.join(templateDir, 'queue-stack.yaml'), 'utf8'));
      monitoringStack = yaml.load(fs.readFileSync(path.join(templateDir, 'monitoring-stack.yaml'), 'utf8'));
      route53Stack = yaml.load(fs.readFileSync(path.join(templateDir, 'route53-failover.yaml'), 'utf8'));
    } catch (error) {
      console.error('Failed to load templates:', error);
    }
  });

  describe('Main Template Tests', () => {
    test('should have valid CloudFormation structure', () => {
      expect(mainTemplate).toBeDefined();
      expect(mainTemplate.AWSTemplateFormatVersion).toBe('2010-09-09');
      expect(mainTemplate.Description).toContain('Multi-Region Disaster Recovery');
    });

    test('should have all required parameters', () => {
      const parameters = mainTemplate.Parameters;
      expect(parameters).toBeDefined();
      expect(parameters.EnvironmentSuffix).toBeDefined();
      expect(parameters.DeploymentRegion).toBeDefined();
      expect(parameters.PrimaryRegion).toBeDefined();
      expect(parameters.DRRegion).toBeDefined();
      expect(parameters.DBSecretArn).toBeDefined();
    });

    test('should have all nested stacks', () => {
      const resources = mainTemplate.Resources;
      expect(resources).toBeDefined();
      expect(resources.NetworkStack).toBeDefined();
      expect(resources.DatabaseStack).toBeDefined();
      expect(resources.ComputeStack).toBeDefined();
      expect(resources.QueueStack).toBeDefined();
      expect(resources.MonitoringStack).toBeDefined();
    });

    test('should have proper stack dependencies', () => {
      expect(mainTemplate.Resources.DatabaseStack.DependsOn).toContain('NetworkStack');
      expect(mainTemplate.Resources.ComputeStack.DependsOn).toContain('NetworkStack');
      expect(mainTemplate.Resources.ComputeStack.DependsOn).toContain('DatabaseStack');
      expect(mainTemplate.Resources.MonitoringStack.DependsOn).toContain('DatabaseStack');
      expect(mainTemplate.Resources.MonitoringStack.DependsOn).toContain('ComputeStack');
    });

    test('should have all required outputs', () => {
      const outputs = mainTemplate.Outputs;
      expect(outputs).toBeDefined();
      expect(outputs.VPCId).toBeDefined();
      expect(outputs.DBClusterEndpoint).toBeDefined();
      expect(outputs.APIEndpoint).toBeDefined();
      expect(outputs.LoadBalancerDNS).toBeDefined();
    });
  });

  describe('Network Stack Tests', () => {
    test('should have VPC configuration', () => {
      const resources = networkStack.Resources;
      expect(resources.VPC).toBeDefined();
      expect(resources.VPC.Properties.CidrBlock).toBe('10.0.0.0/16');
      expect(resources.VPC.Properties.EnableDnsHostnames).toBe(true);
      expect(resources.VPC.Properties.EnableDnsSupport).toBe(true);
    });

    test('should have public and private subnets', () => {
      const resources = networkStack.Resources;
      expect(resources.PublicSubnet1).toBeDefined();
      expect(resources.PublicSubnet2).toBeDefined();
      expect(resources.PublicSubnet3).toBeDefined();
      expect(resources.PrivateSubnet1).toBeDefined();
      expect(resources.PrivateSubnet2).toBeDefined();
      expect(resources.PrivateSubnet3).toBeDefined();
    });

    test('should have internet gateway and route tables', () => {
      const resources = networkStack.Resources;
      expect(resources.InternetGateway).toBeDefined();
      expect(resources.AttachGateway).toBeDefined();
      expect(resources.PublicRouteTable).toBeDefined();
      expect(resources.PrivateRouteTable1).toBeDefined();
      expect(resources.PrivateRouteTable2).toBeDefined();
      expect(resources.PrivateRouteTable3).toBeDefined();
    });

    test('should have VPC endpoints for S3 and DynamoDB', () => {
      const resources = networkStack.Resources;
      expect(resources.S3VPCEndpoint).toBeDefined();
      expect(resources.S3VPCEndpoint.Properties.ServiceName).toContain('s3');
      expect(resources.DynamoDBVPCEndpoint).toBeDefined();
      expect(resources.DynamoDBVPCEndpoint.Properties.ServiceName).toContain('dynamodb');
    });

    test('should have proper subnet CIDR blocks', () => {
      const resources = networkStack.Resources;
      expect(resources.PublicSubnet1.Properties.CidrBlock).toBe('10.0.1.0/24');
      expect(resources.PublicSubnet2.Properties.CidrBlock).toBe('10.0.2.0/24');
      expect(resources.PublicSubnet3.Properties.CidrBlock).toBe('10.0.3.0/24');
      expect(resources.PrivateSubnet1.Properties.CidrBlock).toBe('10.0.11.0/24');
      expect(resources.PrivateSubnet2.Properties.CidrBlock).toBe('10.0.12.0/24');
      expect(resources.PrivateSubnet3.Properties.CidrBlock).toBe('10.0.13.0/24');
    });
  });

  describe('Database Stack Tests', () => {
    test('should have KMS key for encryption', () => {
      const resources = databaseStack.Resources;
      expect(resources.KMSKey).toBeDefined();
      expect(resources.KMSKey.Type).toBe('AWS::KMS::Key');
      expect(resources.KMSKeyAlias).toBeDefined();
    });

    test('should have Aurora MySQL cluster configuration', () => {
      const resources = databaseStack.Resources;
      expect(resources.DBCluster).toBeDefined();
      expect(resources.DBCluster.Properties.Engine).toBe('aurora-mysql');
      expect(resources.DBCluster.Properties.StorageEncrypted).toBe(true);
      expect(resources.DBCluster.Properties.BackupRetentionPeriod).toBe(7);
    });

    test('should have multiple DB instances for HA', () => {
      const resources = databaseStack.Resources;
      expect(resources.DBInstance1).toBeDefined();
      expect(resources.DBInstance2).toBeDefined();
      expect(resources.DBInstance1.Properties.DBInstanceClass).toBe('db.t4g.medium');
      expect(resources.DBInstance2.Properties.DBInstanceClass).toBe('db.t4g.medium');
    });

    test('should have DynamoDB global table', () => {
      const resources = databaseStack.Resources;
      expect(resources.SessionTable).toBeDefined();
      expect(resources.SessionTable.Type).toBe('AWS::DynamoDB::GlobalTable');
      expect(resources.SessionTable.Properties.Replicas).toHaveLength(2);
      expect(resources.SessionTable.Properties.BillingMode).toBe('PAY_PER_REQUEST');
    });

    test('should have S3 bucket for transaction logs', () => {
      const resources = databaseStack.Resources;
      expect(resources.TransactionLogBucket).toBeDefined();
      expect(resources.TransactionLogBucket.Properties.VersioningConfiguration.Status).toBe('Enabled');
      expect(resources.TransactionLogBucket.Properties.BucketEncryption).toBeDefined();
    });

    test('should have proper security group for database', () => {
      const resources = databaseStack.Resources;
      expect(resources.DBSecurityGroup).toBeDefined();
      expect(resources.DBSecurityGroup.Properties.SecurityGroupIngress[0].FromPort).toBe(3306);
      expect(resources.DBSecurityGroup.Properties.SecurityGroupIngress[0].ToPort).toBe(3306);
    });
  });

  describe('Compute Stack Tests', () => {
    test('should have Lambda execution role with proper policies', () => {
      const resources = computeStack.Resources;
      expect(resources.LambdaExecutionRole).toBeDefined();
      expect(resources.LambdaExecutionRole.Properties.ManagedPolicyArns).toContain(
        'arn:aws:iam::aws:policy/service-role/AWSLambdaVPCAccessExecutionRole'
      );
    });

    test('should have transaction processor Lambda function', () => {
      const resources = computeStack.Resources;
      expect(resources.TransactionProcessorFunction).toBeDefined();
      expect(resources.TransactionProcessorFunction.Properties.Runtime).toBe('python3.11');
      expect(resources.TransactionProcessorFunction.Properties.Timeout).toBe(60);
      expect(resources.TransactionProcessorFunction.Properties.MemorySize).toBe(512);
    });

    test('should have payment gateway Lambda function', () => {
      const resources = computeStack.Resources;
      expect(resources.PaymentGatewayFunction).toBeDefined();
      expect(resources.PaymentGatewayFunction.Properties.Runtime).toBe('python3.11');
      expect(resources.PaymentGatewayFunction.Properties.Timeout).toBe(30);
      expect(resources.PaymentGatewayFunction.Properties.MemorySize).toBe(256);
    });

    test('should have Application Load Balancer', () => {
      const resources = computeStack.Resources;
      expect(resources.ApplicationLoadBalancer).toBeDefined();
      expect(resources.ApplicationLoadBalancer.Properties.Type).toBe('application');
      expect(resources.ApplicationLoadBalancer.Properties.Scheme).toBe('internet-facing');
    });

    test('should have API Gateway configuration', () => {
      const resources = computeStack.Resources;
      expect(resources.PaymentAPI).toBeDefined();
      expect(resources.PaymentAPI.Properties.ProtocolType).toBe('HTTP');
      expect(resources.PaymentAPIRoute).toBeDefined();
      expect(resources.PaymentAPIRoute.Properties.RouteKey).toBe('POST /transactions');
    });

    test('should have SQS event source mapping', () => {
      const resources = computeStack.Resources;
      expect(resources.SQSEventSourceMapping).toBeDefined();
      expect(resources.SQSEventSourceMapping.Properties.BatchSize).toBe(10);
      expect(resources.SQSEventSourceMapping.Properties.Enabled).toBe(true);
    });
  });

  describe('Queue Stack Tests', () => {
    test('should have transaction queue with DLQ', () => {
      const resources = queueStack.Resources;
      expect(resources.TransactionQueue).toBeDefined();
      expect(resources.TransactionDLQ).toBeDefined();
      expect(resources.TransactionQueue.Properties.VisibilityTimeout).toBe(300);
      expect(resources.TransactionQueue.Properties.MessageRetentionPeriod).toBe(345600);
    });

    test('should have notification queue with DLQ', () => {
      const resources = queueStack.Resources;
      expect(resources.NotificationQueue).toBeDefined();
      expect(resources.NotificationDLQ).toBeDefined();
      expect(resources.NotificationQueue.Properties.VisibilityTimeout).toBe(60);
    });

    test('should have proper redrive policies', () => {
      const resources = queueStack.Resources;
      expect(resources.TransactionQueue.Properties.RedrivePolicy.maxReceiveCount).toBe(3);
      expect(resources.NotificationQueue.Properties.RedrivePolicy.maxReceiveCount).toBe(5);
    });

    test('should have KMS encryption enabled', () => {
      const resources = queueStack.Resources;
      expect(resources.TransactionQueue.Properties.KmsMasterKeyId).toBe('alias/aws/sqs');
      expect(resources.NotificationQueue.Properties.KmsMasterKeyId).toBe('alias/aws/sqs');
    });
  });

  describe('Monitoring Stack Tests', () => {
    test('should have SNS topic for alerts', () => {
      const resources = monitoringStack.Resources;
      expect(resources.SNSTopic).toBeDefined();
      expect(resources.SNSTopic.Properties.TopicName).toContain('payment-alerts');
    });

    test('should have database CloudWatch alarms', () => {
      const resources = monitoringStack.Resources;
      expect(resources.DBConnectionCountAlarm).toBeDefined();
      expect(resources.DBCPUUtilizationAlarm).toBeDefined();
      expect(resources.DBConnectionCountAlarm.Properties.Threshold).toBe(80);
      expect(resources.DBCPUUtilizationAlarm.Properties.Threshold).toBe(80);
    });

    test('should have ALB CloudWatch alarms', () => {
      const resources = monitoringStack.Resources;
      expect(resources.ALBResponseTimeAlarm).toBeDefined();
      expect(resources.ALBHealthyHostCountAlarm).toBeDefined();
      expect(resources.ALBResponseTimeAlarm.Properties.Threshold).toBe(1);
      expect(resources.ALBHealthyHostCountAlarm.Properties.Threshold).toBe(1);
    });

    test('should have API Gateway alarms', () => {
      const resources = monitoringStack.Resources;
      expect(resources.API5XXErrorAlarm).toBeDefined();
      expect(resources.APILatencyAlarm).toBeDefined();
      expect(resources.API5XXErrorAlarm.Properties.Threshold).toBe(10);
      expect(resources.APILatencyAlarm.Properties.Threshold).toBe(500);
    });

    test('should have CloudTrail for audit logging', () => {
      const resources = monitoringStack.Resources;
      expect(resources.CloudTrail).toBeDefined();
      expect(resources.CloudTrail.Properties.IsMultiRegionTrail).toBe(true);
      expect(resources.CloudTrail.Properties.EnableLogFileValidation).toBe(true);
    });

    test('should have CloudWatch Dashboard', () => {
      const resources = monitoringStack.Resources;
      expect(resources.DashboardMain).toBeDefined();
      expect(resources.DashboardMain.Properties.DashboardName).toContain('payment-processing');
    });
  });

  describe('Route53 Failover Stack Tests', () => {
    test('should have health checks for both regions', () => {
      const resources = route53Stack.Resources;
      expect(resources.PrimaryHealthCheck).toBeDefined();
      expect(resources.DRHealthCheck).toBeDefined();
      expect(resources.PrimaryHealthCheck.Properties.HealthCheckConfig.Type).toBe('HTTPS');
      expect(resources.DRHealthCheck.Properties.HealthCheckConfig.Type).toBe('HTTPS');
    });

    test('should have failover record sets', () => {
      const resources = route53Stack.Resources;
      expect(resources.PrimaryRecordSet).toBeDefined();
      expect(resources.DRRecordSet).toBeDefined();
      expect(resources.PrimaryRecordSet.Properties.Failover).toBe('PRIMARY');
      expect(resources.DRRecordSet.Properties.Failover).toBe('SECONDARY');
    });

    test('should have proper health check configuration', () => {
      const resources = route53Stack.Resources;
      expect(resources.PrimaryHealthCheck.Properties.HealthCheckConfig.RequestInterval).toBe(30);
      expect(resources.PrimaryHealthCheck.Properties.HealthCheckConfig.FailureThreshold).toBe(3);
      expect(resources.DRHealthCheck.Properties.HealthCheckConfig.RequestInterval).toBe(30);
      expect(resources.DRHealthCheck.Properties.HealthCheckConfig.FailureThreshold).toBe(3);
    });
  });

  describe('Cross-Stack Integration Tests', () => {
    test('should have proper parameter passing between stacks', () => {
      const mainResources = mainTemplate.Resources;

      // Network outputs used by Database stack
      expect(mainResources.DatabaseStack.Properties.Parameters.VPCId).toContain('NetworkStack.Outputs.VPCId');
      expect(mainResources.DatabaseStack.Properties.Parameters.PrivateSubnet1).toContain('NetworkStack.Outputs.PrivateSubnet1');

      // Database outputs used by Compute stack
      expect(mainResources.ComputeStack.Properties.Parameters.DBEndpoint).toContain('DatabaseStack.Outputs.DBClusterEndpoint');

      // Queue outputs used by Compute stack
      expect(mainResources.ComputeStack.Properties.Parameters.TransactionQueueUrl).toContain('QueueStack.Outputs.TransactionQueueUrl');
    });

    test('should have consistent tagging across all stacks', () => {
      const stacks = [mainTemplate, networkStack, databaseStack, computeStack, queueStack, monitoringStack];

      stacks.forEach((stack) => {
        if (stack && stack.Resources) {
          const resources = Object.values(stack.Resources) as any[];
          const taggedResources = resources.filter((r) => r.Properties && r.Properties.Tags);

          taggedResources.forEach((resource) => {
            const tags = resource.Properties.Tags;
            const envTag = tags.find((t: any) => t.Key === 'Environment');
            expect(envTag).toBeDefined();
          });
        }
      });
    });
  });

  describe('Security Best Practices Tests', () => {
    test('should have encryption enabled for all data stores', () => {
      // RDS encryption
      expect(databaseStack.Resources.DBCluster.Properties.StorageEncrypted).toBe(true);

      // DynamoDB encryption
      expect(databaseStack.Resources.SessionTable.Properties.SSESpecification.SSEEnabled).toBe(true);

      // S3 encryption
      expect(databaseStack.Resources.TransactionLogBucket.Properties.BucketEncryption).toBeDefined();

      // SQS encryption
      expect(queueStack.Resources.TransactionQueue.Properties.KmsMasterKeyId).toBeDefined();
    });

    test('should have proper IAM policies with least privilege', () => {
      const lambdaRole = computeStack.Resources.LambdaExecutionRole;
      const policies = lambdaRole.Properties.Policies[0].PolicyDocument.Statement;

      policies.forEach((policy: any) => {
        expect(policy.Effect).toBe('Allow');
        expect(policy.Resource).toBeDefined();
        expect(policy.Resource).not.toBe('*');
      });
    });

    test('should have VPC endpoints to avoid internet traffic', () => {
      expect(networkStack.Resources.S3VPCEndpoint).toBeDefined();
      expect(networkStack.Resources.DynamoDBVPCEndpoint).toBeDefined();
    });

    test('should have backup and retention policies', () => {
      // RDS backup retention
      expect(databaseStack.Resources.DBCluster.Properties.BackupRetentionPeriod).toBeGreaterThan(0);

      // DynamoDB point-in-time recovery
      const replicas = databaseStack.Resources.SessionTable.Properties.Replicas;
      replicas.forEach((replica: any) => {
        expect(replica.PointInTimeRecoverySpecification.PointInTimeRecoveryEnabled).toBe(true);
      });

      // CloudWatch logs retention
      expect(monitoringStack.Resources.CloudWatchLogGroup.Properties.RetentionInDays).toBe(30);
    });
  });
});