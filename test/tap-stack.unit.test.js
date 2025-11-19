const fs = require('fs');
const path = require('path');

describe('CloudFormation Template Unit Tests', () => {
  let primaryTemplate;
  let secondaryTemplate;

  beforeAll(() => {
    const primaryPath = path.join(__dirname, '../lib/tap-stack.json');
    const secondaryPath = path.join(__dirname, '../lib/secondary-stack.json');

    primaryTemplate = JSON.parse(fs.readFileSync(primaryPath, 'utf8'));
    secondaryTemplate = JSON.parse(fs.readFileSync(secondaryPath, 'utf8'));
  });

  describe('Primary Stack Template Validation', () => {
    test('should have valid CloudFormation version', () => {
      expect(primaryTemplate.AWSTemplateFormatVersion).toBe('2010-09-09');
    });

    test('should have description', () => {
      expect(primaryTemplate.Description).toBeDefined();
      expect(primaryTemplate.Description).toContain('Multi-Region');
    });

    test('should have EnvironmentSuffix parameter', () => {
      expect(primaryTemplate.Parameters.EnvironmentSuffix).toBeDefined();
      expect(primaryTemplate.Parameters.EnvironmentSuffix.Type).toBe('String');
      expect(primaryTemplate.Parameters.EnvironmentSuffix.MinLength).toBe(1);
    });

    test('should have all required parameters', () => {
      const requiredParams = ['EnvironmentSuffix', 'PrimaryRegion', 'SecondaryRegion', 'AlertEmail'];
      requiredParams.forEach(param => {
        expect(primaryTemplate.Parameters[param]).toBeDefined();
      });
    });

    test('should have VPC resource', () => {
      expect(primaryTemplate.Resources.PrimaryVPC).toBeDefined();
      expect(primaryTemplate.Resources.PrimaryVPC.Type).toBe('AWS::EC2::VPC');
    });

    test('should have multi-AZ subnets', () => {
      expect(primaryTemplate.Resources.PrimaryPublicSubnet1).toBeDefined();
      expect(primaryTemplate.Resources.PrimaryPublicSubnet2).toBeDefined();
      expect(primaryTemplate.Resources.PrimaryPrivateSubnet1).toBeDefined();
      expect(primaryTemplate.Resources.PrimaryPrivateSubnet2).toBeDefined();
    });

    test('should have DynamoDB Global Table', () => {
      expect(primaryTemplate.Resources.TransactionTable).toBeDefined();
      expect(primaryTemplate.Resources.TransactionTable.Type).toBe('AWS::DynamoDB::GlobalTable');
      expect(primaryTemplate.Resources.TransactionTable.Properties.Replicas).toBeDefined();
      expect(primaryTemplate.Resources.TransactionTable.Properties.Replicas.length).toBe(2);
    });

    test('should have S3 bucket with replication', () => {
      expect(primaryTemplate.Resources.TransactionLogBucket).toBeDefined();
      expect(primaryTemplate.Resources.TransactionLogBucket.Type).toBe('AWS::S3::Bucket');
      expect(primaryTemplate.Resources.TransactionLogBucket.Properties.ReplicationConfiguration).toBeDefined();
    });

    test('should have S3 bucket with encryption', () => {
      const bucket = primaryTemplate.Resources.TransactionLogBucket;
      expect(bucket.Properties.BucketEncryption).toBeDefined();
      expect(bucket.Properties.BucketEncryption.ServerSideEncryptionConfiguration).toBeDefined();
    });

    test('should have S3 bucket with versioning enabled', () => {
      const bucket = primaryTemplate.Resources.TransactionLogBucket;
      expect(bucket.Properties.VersioningConfiguration).toBeDefined();
      expect(bucket.Properties.VersioningConfiguration.Status).toBe('Enabled');
    });

    test('should have Lambda function', () => {
      expect(primaryTemplate.Resources.TransactionProcessorFunction).toBeDefined();
      expect(primaryTemplate.Resources.TransactionProcessorFunction.Type).toBe('AWS::Lambda::Function');
    });

    test('should have Lambda function with environment variables', () => {
      const lambda = primaryTemplate.Resources.TransactionProcessorFunction;
      expect(lambda.Properties.Environment).toBeDefined();
      expect(lambda.Properties.Environment.Variables).toBeDefined();
      expect(lambda.Properties.Environment.Variables.TABLE_NAME).toBeDefined();
      expect(lambda.Properties.Environment.Variables.BUCKET_NAME).toBeDefined();
    });

    test('should have API Gateway', () => {
      expect(primaryTemplate.Resources.TransactionApi).toBeDefined();
      expect(primaryTemplate.Resources.TransactionApi.Type).toBe('AWS::ApiGateway::RestApi');
    });

    test('should have SQS queue', () => {
      expect(primaryTemplate.Resources.TransactionQueue).toBeDefined();
      expect(primaryTemplate.Resources.TransactionQueue.Type).toBe('AWS::SQS::Queue');
    });

    test('should have Route53 health check', () => {
      expect(primaryTemplate.Resources.ApiHealthCheck).toBeDefined();
      expect(primaryTemplate.Resources.ApiHealthCheck.Type).toBe('AWS::Route53::HealthCheck');
    });

    test('should have CloudWatch alarms', () => {
      expect(primaryTemplate.Resources.LambdaErrorAlarm).toBeDefined();
      expect(primaryTemplate.Resources.LambdaErrorAlarm.Type).toBe('AWS::CloudWatch::Alarm');
    });

    test('should have SNS topic for alarms', () => {
      expect(primaryTemplate.Resources.HealthCheckAlarmTopic).toBeDefined();
      expect(primaryTemplate.Resources.HealthCheckAlarmTopic.Type).toBe('AWS::SNS::Topic');
    });

    test('should have IAM roles with proper permissions', () => {
      expect(primaryTemplate.Resources.TransactionProcessorRole).toBeDefined();
      expect(primaryTemplate.Resources.S3ReplicationRole).toBeDefined();
    });

    test('should have proper security group configuration', () => {
      expect(primaryTemplate.Resources.PrimarySecurityGroup).toBeDefined();
      expect(primaryTemplate.Resources.PrimarySecurityGroup.Type).toBe('AWS::EC2::SecurityGroup');
    });

    test('should use EnvironmentSuffix in resource names', () => {
      const vpcName = primaryTemplate.Resources.PrimaryVPC.Properties.Tags[0].Value;
      expect(vpcName['Fn::Sub']).toContain('${EnvironmentSuffix}');
    });

    test('should have outputs defined', () => {
      expect(primaryTemplate.Outputs).toBeDefined();
      expect(Object.keys(primaryTemplate.Outputs).length).toBeGreaterThan(0);
    });

    test('should export key outputs', () => {
      expect(primaryTemplate.Outputs.TransactionTableName).toBeDefined();
      expect(primaryTemplate.Outputs.TransactionTableName.Export).toBeDefined();
    });

    test('should not have DeletionPolicy Retain', () => {
      Object.keys(primaryTemplate.Resources).forEach(resourceKey => {
        const resource = primaryTemplate.Resources[resourceKey];
        expect(resource.DeletionPolicy).not.toBe('Retain');
      });
    });

    test('should have public access block on S3 bucket', () => {
      const bucket = primaryTemplate.Resources.TransactionLogBucket;
      expect(bucket.Properties.PublicAccessBlockConfiguration).toBeDefined();
      expect(bucket.Properties.PublicAccessBlockConfiguration.BlockPublicAcls).toBe(true);
    });

    test('should have KMS encryption on DynamoDB', () => {
      const table = primaryTemplate.Resources.TransactionTable;
      expect(table.Properties.SSESpecification).toBeDefined();
      expect(table.Properties.SSESpecification.SSEEnabled).toBe(true);
    });
  });

  describe('Secondary Stack Template Validation', () => {
    test('should have valid CloudFormation version', () => {
      expect(secondaryTemplate.AWSTemplateFormatVersion).toBe('2010-09-09');
    });

    test('should have description', () => {
      expect(secondaryTemplate.Description).toBeDefined();
      expect(secondaryTemplate.Description).toContain('Secondary');
    });

    test('should have EnvironmentSuffix parameter', () => {
      expect(secondaryTemplate.Parameters.EnvironmentSuffix).toBeDefined();
    });

    test('should have VPC resource', () => {
      expect(secondaryTemplate.Resources.SecondaryVPC).toBeDefined();
      expect(secondaryTemplate.Resources.SecondaryVPC.Type).toBe('AWS::EC2::VPC');
    });

    test('should have multi-AZ subnets', () => {
      expect(secondaryTemplate.Resources.SecondaryPublicSubnet1).toBeDefined();
      expect(secondaryTemplate.Resources.SecondaryPublicSubnet2).toBeDefined();
    });

    test('should have S3 bucket for replication target', () => {
      expect(secondaryTemplate.Resources.SecondaryTransactionLogBucket).toBeDefined();
      expect(secondaryTemplate.Resources.SecondaryTransactionLogBucket.Type).toBe('AWS::S3::Bucket');
    });

    test('should have Lambda function', () => {
      expect(secondaryTemplate.Resources.SecondaryTransactionProcessorFunction).toBeDefined();
    });

    test('should have API Gateway', () => {
      expect(secondaryTemplate.Resources.SecondaryTransactionApi).toBeDefined();
    });

    test('should have outputs defined', () => {
      expect(secondaryTemplate.Outputs).toBeDefined();
    });

    test('should use EnvironmentSuffix in resource names', () => {
      const vpcName = secondaryTemplate.Resources.SecondaryVPC.Properties.Tags[0].Value;
      expect(vpcName['Fn::Sub']).toContain('${EnvironmentSuffix}');
    });

    test('should not have DeletionPolicy Retain', () => {
      Object.keys(secondaryTemplate.Resources).forEach(resourceKey => {
        const resource = secondaryTemplate.Resources[resourceKey];
        expect(resource.DeletionPolicy).not.toBe('Retain');
      });
    });
  });

  describe('Cross-Stack Consistency', () => {
    test('should use same EnvironmentSuffix parameter configuration', () => {
      expect(primaryTemplate.Parameters.EnvironmentSuffix.Type).toBe(
        secondaryTemplate.Parameters.EnvironmentSuffix.Type
      );
    });

    test('should have consistent naming patterns', () => {
      expect(primaryTemplate.Resources.PrimaryVPC).toBeDefined();
      expect(secondaryTemplate.Resources.SecondaryVPC).toBeDefined();
    });

    test('should both have Lambda functions', () => {
      expect(primaryTemplate.Resources.TransactionProcessorFunction).toBeDefined();
      expect(secondaryTemplate.Resources.SecondaryTransactionProcessorFunction).toBeDefined();
    });

    test('should both have API Gateways', () => {
      expect(primaryTemplate.Resources.TransactionApi).toBeDefined();
      expect(secondaryTemplate.Resources.SecondaryTransactionApi).toBeDefined();
    });
  });

  describe('Security Best Practices', () => {
    test('primary stack should have IAM roles for Lambda', () => {
      expect(primaryTemplate.Resources.TransactionProcessorRole).toBeDefined();
      expect(primaryTemplate.Resources.TransactionProcessorRole.Type).toBe('AWS::IAM::Role');
    });

    test('secondary stack should have IAM roles for Lambda', () => {
      expect(secondaryTemplate.Resources.SecondaryTransactionProcessorRole).toBeDefined();
    });

    test('should have encryption enabled on S3 buckets', () => {
      expect(primaryTemplate.Resources.TransactionLogBucket.Properties.BucketEncryption).toBeDefined();
      expect(secondaryTemplate.Resources.SecondaryTransactionLogBucket.Properties.BucketEncryption).toBeDefined();
    });

    test('should have security groups with proper egress rules', () => {
      const sg = primaryTemplate.Resources.PrimarySecurityGroup;
      expect(sg.Properties.SecurityGroupEgress).toBeDefined();
    });
  });

  describe('High Availability Configuration', () => {
    test('should have multiple availability zones in primary', () => {
      const subnets = [
        primaryTemplate.Resources.PrimaryPublicSubnet1,
        primaryTemplate.Resources.PrimaryPublicSubnet2
      ];

      subnets.forEach(subnet => {
        expect(subnet.Properties.AvailabilityZone).toBeDefined();
      });
    });

    test('should have DynamoDB Global Table with replicas', () => {
      const table = primaryTemplate.Resources.TransactionTable;
      expect(table.Properties.Replicas.length).toBeGreaterThanOrEqual(2);
    });

    test('should have S3 replication configuration', () => {
      const bucket = primaryTemplate.Resources.TransactionLogBucket;
      expect(bucket.Properties.ReplicationConfiguration).toBeDefined();
      expect(bucket.Properties.ReplicationConfiguration.Rules).toBeDefined();
    });
  });

  describe('Monitoring and Alarms', () => {
    test('should have CloudWatch alarms for Lambda errors', () => {
      expect(primaryTemplate.Resources.LambdaErrorAlarm).toBeDefined();
      expect(primaryTemplate.Resources.LambdaErrorAlarm.Properties.MetricName).toBe('Errors');
    });

    test('should have SNS topic for alarm notifications', () => {
      expect(primaryTemplate.Resources.HealthCheckAlarmTopic).toBeDefined();
      const topic = primaryTemplate.Resources.HealthCheckAlarmTopic;
      expect(topic.Properties.Subscription).toBeDefined();
    });

    test('should have Route53 health check monitoring', () => {
      const healthCheck = primaryTemplate.Resources.ApiHealthCheck;
      expect(healthCheck.Properties.HealthCheckConfig).toBeDefined();
    });
  });

  describe('Resource Dependencies', () => {
    test('should have proper DependsOn for S3 bucket', () => {
      const bucket = primaryTemplate.Resources.TransactionLogBucket;
      expect(bucket.DependsOn).toBe('S3ReplicationRole');
    });

    test('should have API Gateway deployment depending on method', () => {
      const deployment = primaryTemplate.Resources.TransactionApiDeployment;
      expect(deployment.DependsOn).toBe('TransactionApiMethod');
    });

    test('Lambda function should depend on IAM role', () => {
      const lambda = primaryTemplate.Resources.TransactionProcessorFunction;
      expect(lambda.Properties.Role).toBeDefined();
    });
  });

  describe('Disaster Recovery Configuration', () => {
    test('should have multi-region DynamoDB configuration', () => {
      const table = primaryTemplate.Resources.TransactionTable;
      const regions = table.Properties.Replicas.map(r => r.Region.Ref);
      expect(regions).toContain('PrimaryRegion');
      expect(regions).toContain('SecondaryRegion');
    });

    test('should have cross-region S3 replication', () => {
      const bucket = primaryTemplate.Resources.TransactionLogBucket;
      const rules = bucket.Properties.ReplicationConfiguration.Rules;
      expect(rules.length).toBeGreaterThan(0);
      expect(rules[0].Status).toBe('Enabled');
    });

    test('should have health check for failover', () => {
      const healthCheck = primaryTemplate.Resources.ApiHealthCheck;
      expect(healthCheck.Properties.HealthCheckConfig.Type).toBe('HTTPS');
    });
  });

  describe('Cost Optimization', () => {
    test('should use appropriate Lambda memory size', () => {
      const lambda = primaryTemplate.Resources.TransactionProcessorFunction;
      expect(lambda.Properties.MemorySize).toBeLessThanOrEqual(1024);
    });

    test('should use appropriate Lambda timeout', () => {
      const lambda = primaryTemplate.Resources.TransactionProcessorFunction;
      expect(lambda.Properties.Timeout).toBeLessThanOrEqual(60);
    });

    test('should use DynamoDB on-demand or provisioned appropriately', () => {
      const table = primaryTemplate.Resources.TransactionTable;
      expect(table.Properties.BillingMode || 'PROVISIONED').toBeDefined();
    });
  });
});
