import fs from 'fs';
import path from 'path';

const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';

describe('Batch Processing CloudFormation Template', () => {
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

    test('should have a description for batch processing', () => {
      expect(template.Description).toBeDefined();
      expect(template.Description).toBe(
        'Batch Processing System for Financial Transactions with Complete Audit Trail and Monitoring'
      );
    });
  });

  describe('Parameters', () => {
    test('should have EnvironmentSuffix parameter', () => {
      expect(template.Parameters.EnvironmentSuffix).toBeDefined();
    });

    test('should have NotificationEmail parameter', () => {
      expect(template.Parameters.NotificationEmail).toBeDefined();
      expect(template.Parameters.NotificationEmail.Type).toBe('String');
      expect(template.Parameters.NotificationEmail.Default).toBe('admin@example.com');
    });

    test('should have MaxvCpus parameter', () => {
      expect(template.Parameters.MaxvCpus).toBeDefined();
      expect(template.Parameters.MaxvCpus.Type).toBe('Number');
      expect(template.Parameters.MaxvCpus.Default).toBe(256);
      expect(template.Parameters.MaxvCpus.MinValue).toBe(16);
      expect(template.Parameters.MaxvCpus.MaxValue).toBe(512);
    });

    test('should have JobTimeout parameter', () => {
      expect(template.Parameters.JobTimeout).toBeDefined();
      expect(template.Parameters.JobTimeout.Type).toBe('Number');
      expect(template.Parameters.JobTimeout.Default).toBe(14400);
      expect(template.Parameters.JobTimeout.MinValue).toBe(3600);
      expect(template.Parameters.JobTimeout.MaxValue).toBe(28800);
    });
  });

  describe('S3 Resources', () => {
    test('should have TransactionDataBucket', () => {
      expect(template.Resources.TransactionDataBucket).toBeDefined();
      const bucket = template.Resources.TransactionDataBucket;
      expect(bucket.Type).toBe('AWS::S3::Bucket');
      expect(bucket.Properties.BucketName).toEqual({
        'Fn::Sub': 'transactiondata-${EnvironmentSuffix}-${AWS::AccountId}'
      });
    });

    test('should have ProcessedDataBucket', () => {
      expect(template.Resources.ProcessedDataBucket).toBeDefined();
      const bucket = template.Resources.ProcessedDataBucket;
      expect(bucket.Type).toBe('AWS::S3::Bucket');
      expect(bucket.Properties.BucketName).toEqual({
        'Fn::Sub': 'processeddata-${EnvironmentSuffix}-${AWS::AccountId}'
      });
    });

    test('S3 buckets should have encryption enabled', () => {
      const transactionBucket = template.Resources.TransactionDataBucket;
      const processedBucket = template.Resources.ProcessedDataBucket;

      expect(transactionBucket.Properties.BucketEncryption).toBeDefined();
      expect(transactionBucket.Properties.BucketEncryption.ServerSideEncryptionConfiguration[0].ServerSideEncryptionByDefault.SSEAlgorithm).toBe('AES256');

      expect(processedBucket.Properties.BucketEncryption).toBeDefined();
      expect(processedBucket.Properties.BucketEncryption.ServerSideEncryptionConfiguration[0].ServerSideEncryptionByDefault.SSEAlgorithm).toBe('AES256');
    });

    test('S3 buckets should have public access blocked', () => {
      const transactionBucket = template.Resources.TransactionDataBucket;
      const processedBucket = template.Resources.ProcessedDataBucket;

      expect(transactionBucket.Properties.PublicAccessBlockConfiguration).toBeDefined();
      expect(transactionBucket.Properties.PublicAccessBlockConfiguration.BlockPublicAcls).toBe(true);

      expect(processedBucket.Properties.PublicAccessBlockConfiguration).toBeDefined();
      expect(processedBucket.Properties.PublicAccessBlockConfiguration.BlockPublicAcls).toBe(true);
    });
  });

  describe('DynamoDB Resources', () => {
    test('should have JobStatusTable', () => {
      expect(template.Resources.JobStatusTable).toBeDefined();
      const table = template.Resources.JobStatusTable;
      expect(table.Type).toBe('AWS::DynamoDB::Table');
      expect(table.Properties.TableName).toEqual({
        'Fn::Sub': 'job-status-${EnvironmentSuffix}'
      });
    });

    test('should have AuditLogTable', () => {
      expect(template.Resources.AuditLogTable).toBeDefined();
      const table = template.Resources.AuditLogTable;
      expect(table.Type).toBe('AWS::DynamoDB::Table');
      expect(table.Properties.TableName).toEqual({
        'Fn::Sub': 'audit-log-${EnvironmentSuffix}'
      });
    });

    test('JobStatusTable should have correct key schema', () => {
      const table = template.Resources.JobStatusTable;
      const keySchema = table.Properties.KeySchema;
      expect(keySchema).toHaveLength(1);
      expect(keySchema[0].AttributeName).toBe('jobId');
      expect(keySchema[0].KeyType).toBe('HASH');
    });

    test('JobStatusTable should have StatusIndex GSI', () => {
      const table = template.Resources.JobStatusTable;
      const gsi = table.Properties.GlobalSecondaryIndexes;
      expect(gsi).toHaveLength(1);
      expect(gsi[0].IndexName).toBe('StatusIndex');
      expect(gsi[0].KeySchema[0].AttributeName).toBe('status');
      expect(gsi[0].KeySchema[1].AttributeName).toBe('submittedAt');
    });

    test('AuditLogTable should have TTL enabled', () => {
      const table = template.Resources.AuditLogTable;
      expect(table.Properties.TimeToLiveSpecification).toBeDefined();
      expect(table.Properties.TimeToLiveSpecification.AttributeName).toBe('ttl');
      expect(table.Properties.TimeToLiveSpecification.Enabled).toBe(true);
    });

    test('DynamoDB tables should have point-in-time recovery enabled', () => {
      const jobStatusTable = template.Resources.JobStatusTable;
      const auditLogTable = template.Resources.AuditLogTable;

      expect(jobStatusTable.Properties.PointInTimeRecoverySpecification.PointInTimeRecoveryEnabled).toBe(true);
      expect(auditLogTable.Properties.PointInTimeRecoverySpecification.PointInTimeRecoveryEnabled).toBe(true);
    });
  });

  describe('Batch Resources', () => {
    test('should have BatchComputeEnvironment', () => {
      expect(template.Resources.BatchComputeEnvironment).toBeDefined();
      const compute = template.Resources.BatchComputeEnvironment;
      expect(compute.Type).toBe('AWS::Batch::ComputeEnvironment');
      expect(compute.Properties.Type).toBe('MANAGED');
      expect(compute.Properties.State).toBe('ENABLED');
    });

    test('should have BatchJobQueue', () => {
      expect(template.Resources.BatchJobQueue).toBeDefined();
      const queue = template.Resources.BatchJobQueue;
      expect(queue.Type).toBe('AWS::Batch::JobQueue');
      expect(queue.Properties.State).toBe('ENABLED');
      expect(queue.Properties.Priority).toBe(1);
    });

    test('should have BatchJobDefinition', () => {
      expect(template.Resources.BatchJobDefinition).toBeDefined();
      const jobDef = template.Resources.BatchJobDefinition;
      expect(jobDef.Type).toBe('AWS::Batch::JobDefinition');
      expect(jobDef.Properties.Type).toBe('container');
      expect(jobDef.Properties.ContainerProperties.Vcpus).toBe(2);
      expect(jobDef.Properties.ContainerProperties.Memory).toBe(4096);
    });

    test('BatchJobDefinition should have correct environment variables', () => {
      const jobDef = template.Resources.BatchJobDefinition;
      const env = jobDef.Properties.ContainerProperties.Environment;

      const envNames = env.map((e: any) => e.Name);
      expect(envNames).toContain('JOB_STATUS_TABLE');
      expect(envNames).toContain('AUDIT_LOG_TABLE');
      expect(envNames).toContain('SOURCE_BUCKET');
      expect(envNames).toContain('DEST_BUCKET');
      expect(envNames).toContain('SNS_TOPIC_ARN');
      expect(envNames).toContain('ENVIRONMENT');
    });

    test('BatchJobDefinition should have retry strategy', () => {
      const jobDef = template.Resources.BatchJobDefinition;
      expect(jobDef.Properties.RetryStrategy).toBeDefined();
      expect(jobDef.Properties.RetryStrategy.Attempts).toBe(3);
    });

    test('BatchJobDefinition should have timeout configuration', () => {
      const jobDef = template.Resources.BatchJobDefinition;
      expect(jobDef.Properties.Timeout).toBeDefined();
      expect(jobDef.Properties.Timeout.AttemptDurationSeconds).toEqual({
        'Ref': 'JobTimeout'
      });
    });
  });

  describe('SNS Resources', () => {
    test('should have BatchProcessingTopic', () => {
      expect(template.Resources.BatchProcessingTopic).toBeDefined();
      const topic = template.Resources.BatchProcessingTopic;
      expect(topic.Type).toBe('AWS::SNS::Topic');
      expect(topic.Properties.TopicName).toEqual({
        'Fn::Sub': 'batchprocessing-alerts-${EnvironmentSuffix}'
      });
    });

    test('BatchProcessingTopic should have email subscription', () => {
      const topic = template.Resources.BatchProcessingTopic;
      expect(topic.Properties.Subscription).toHaveLength(1);
      expect(topic.Properties.Subscription[0].Protocol).toBe('email');
      expect(topic.Properties.Subscription[0].Endpoint).toEqual({
        'Ref': 'NotificationEmail'
      });
    });
  });

  describe('VPC Resources', () => {
    test('should have VPC', () => {
      expect(template.Resources.VPC).toBeDefined();
      const vpc = template.Resources.VPC;
      expect(vpc.Type).toBe('AWS::EC2::VPC');
      expect(vpc.Properties.CidrBlock).toBe('10.0.0.0/16');
      expect(vpc.Properties.EnableDnsHostnames).toBe(true);
      expect(vpc.Properties.EnableDnsSupport).toBe(true);
    });
  });

  describe('IAM Resources', () => {
    test('should have BatchServiceRole', () => {
      expect(template.Resources.BatchServiceRole).toBeDefined();
      const role = template.Resources.BatchServiceRole;
      expect(role.Type).toBe('AWS::IAM::Role');
      expect(role.Properties.ManagedPolicyArns).toContain(
        'arn:aws:iam::aws:policy/service-role/AWSBatchServiceRole'
      );
    });
  });

  describe('Outputs', () => {
    test('should have all required outputs', () => {
      const expectedOutputs = [
        'TransactionDataBucketName',
        'ProcessedDataBucketName',
        'JobStatusTableName',
        'AuditLogTableName',
        'BatchJobQueueArn',
        'BatchJobDefinitionArn',
        'SNSTopicArn',
        'VPCId',
        'ComputeEnvironmentArn'
      ];

      expectedOutputs.forEach(outputName => {
        expect(template.Outputs[outputName]).toBeDefined();
      });
    });

  });

  describe('Template Validation', () => {
    test('should have valid JSON structure', () => {
      expect(template).toBeDefined();
      expect(typeof template).toBe('object');
    });

    test('should not have any undefined or null required sections', () => {
      expect(template.AWSTemplateFormatVersion).not.toBeNull();
      expect(template.Description).not.toBeNull();
      expect(template.Parameters).not.toBeNull();
      expect(template.Resources).not.toBeNull();
      expect(template.Outputs).not.toBeNull();
    });

    test('should have correct number of parameters', () => {
      const parameterCount = Object.keys(template.Parameters).length;
      expect(parameterCount).toBe(4);
    });

  });

  describe('Resource Naming Convention', () => {
    test('resource names should follow naming convention with environment suffix', () => {
      const jobStatusTable = template.Resources.JobStatusTable;
      expect(jobStatusTable.Properties.TableName).toEqual({
        'Fn::Sub': 'job-status-${EnvironmentSuffix}'
      });

      const auditLogTable = template.Resources.AuditLogTable;
      expect(auditLogTable.Properties.TableName).toEqual({
        'Fn::Sub': 'audit-log-${EnvironmentSuffix}'
      });
    });
  });
});
