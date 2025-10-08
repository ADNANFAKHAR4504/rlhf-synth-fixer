import { CloudFormationClient, ValidateTemplateCommand } from '@aws-sdk/client-cloudformation';
import * as fs from 'fs';
import * as yaml from 'js-yaml';
import * as path from 'path';

// Define CloudFormation intrinsic function tags
const cfnSchema = yaml.CORE_SCHEMA.extend([
  new yaml.Type('!Ref', { kind: 'scalar' }),
  new yaml.Type('!GetAtt', { kind: 'scalar' }),
  new yaml.Type('!Sub', { kind: 'scalar' }),
  new yaml.Type('!Join', { kind: 'sequence' }),
  new yaml.Type('!Select', { kind: 'sequence' }),
  new yaml.Type('!Split', { kind: 'sequence' }),
  new yaml.Type('!GetAZs', { kind: 'scalar' }),
  new yaml.Type('!ImportValue', { kind: 'scalar' }),
  new yaml.Type('!If', { kind: 'sequence' }),
  new yaml.Type('!Not', { kind: 'sequence' }),
  new yaml.Type('!Equals', { kind: 'sequence' }),
  new yaml.Type('!And', { kind: 'sequence' }),
  new yaml.Type('!Or', { kind: 'sequence' }),
  new yaml.Type('!Condition', { kind: 'scalar' }),
  new yaml.Type('!FindInMap', { kind: 'sequence' }),
  new yaml.Type('!Base64', { kind: 'scalar' })
]);

describe('CloudFormation Template Unit Tests', () => {
  let template: any;
  let cfnClient: CloudFormationClient;

  beforeAll(() => {
    // Load the CloudFormation template
    const templatePath = path.join(__dirname, '..', 'lib', 'TapStack.yml');
    const templateContent = fs.readFileSync(templatePath, 'utf8');
    template = yaml.load(templateContent, { schema: cfnSchema });

    // Initialize CloudFormation client
    cfnClient = new CloudFormationClient({ region: 'us-east-1' });
  });

  describe('Template Structure', () => {
    test('should have valid CloudFormation template format', () => {
      expect(template).toHaveProperty('AWSTemplateFormatVersion');
      expect(template.AWSTemplateFormatVersion).toBe('2010-09-09');
    });

    test('should have a description', () => {
      expect(template).toHaveProperty('Description');
      expect(template.Description).toContain('Report Generation Service');
    });

    test('should have required parameters', () => {
      expect(template).toHaveProperty('Parameters');
      expect(template.Parameters).toHaveProperty('EnvironmentSuffix');
      expect(template.Parameters).toHaveProperty('EnvironmentName');
      expect(template.Parameters).toHaveProperty('DatabasePassword');
      expect(template.Parameters).toHaveProperty('SenderEmail');
    });

    test('should have EnvironmentSuffix parameter for resource naming', () => {
      const envSuffix = template.Parameters.EnvironmentSuffix;
      expect(envSuffix).toBeDefined();
      expect(envSuffix.Type).toBe('String');
      expect(envSuffix.Default).toBe('dev');
    });
  });

  describe('Resources', () => {
    test('should have all required resources', () => {
      expect(template).toHaveProperty('Resources');
      const resources = template.Resources;

      // Core resources
      expect(resources).toHaveProperty('ReportBucket');
      expect(resources).toHaveProperty('ReportGeneratorFunction');
      expect(resources).toHaveProperty('DailyReportSchedule');
      expect(resources).toHaveProperty('FailureNotificationTopic');
      expect(resources).toHaveProperty('ReportDeadLetterQueue');
      expect(resources).toHaveProperty('DatabaseSecret');
      expect(resources).toHaveProperty('LambdaExecutionRole');
      expect(resources).toHaveProperty('LambdaLogGroup');
      expect(resources).toHaveProperty('LambdaInvokePermission');
    });

    describe('S3 Bucket', () => {
      test('should have correct configuration', () => {
        const bucket = template.Resources.ReportBucket;
        expect(bucket.Type).toBe('AWS::S3::Bucket');
        expect(bucket.Properties).toHaveProperty('BucketName');
        expect(bucket.Properties).toHaveProperty('LifecycleConfiguration');
        expect(bucket.Properties).toHaveProperty('BucketEncryption');
        expect(bucket.Properties).toHaveProperty('VersioningConfiguration');
      });

      test('should use EnvironmentSuffix in bucket name', () => {
        const bucketName = template.Resources.ReportBucket.Properties.BucketName;
        expect(JSON.stringify(bucketName)).toContain('${EnvironmentSuffix}');
      });

      test('should have lifecycle rules for cost optimization', () => {
        const lifecycle = template.Resources.ReportBucket.Properties.LifecycleConfiguration;
        expect(lifecycle.Rules).toHaveLength(1);
        expect(lifecycle.Rules[0].ExpirationInDays).toBe(365);
      });

      test('should have encryption enabled', () => {
        const encryption = template.Resources.ReportBucket.Properties.BucketEncryption;
        expect(encryption.ServerSideEncryptionConfiguration[0].ServerSideEncryptionByDefault.SSEAlgorithm).toBe('AES256');
      });
    });

    describe('Lambda Function', () => {
      test('should have correct configuration', () => {
        const lambda = template.Resources.ReportGeneratorFunction;
        expect(lambda.Type).toBe('AWS::Lambda::Function');
        expect(lambda.Properties.Runtime).toBe('python3.10');
        expect(lambda.Properties.Handler).toBe('index.lambda_handler');
        expect(lambda.Properties.Timeout).toBe(300);
        expect(lambda.Properties.MemorySize).toBe(1024);
      });

      test('should use EnvironmentSuffix in function name', () => {
        const functionName = template.Resources.ReportGeneratorFunction.Properties.FunctionName;
        expect(JSON.stringify(functionName)).toContain('${EnvironmentSuffix}');
      });

      test('should have environment variables', () => {
        const envVars = template.Resources.ReportGeneratorFunction.Properties.Environment.Variables;
        expect(envVars).toHaveProperty('BUCKET_NAME');
        expect(envVars).toHaveProperty('DB_SECRET_ARN');
        expect(envVars).toHaveProperty('SNS_TOPIC_ARN');
        expect(envVars).toHaveProperty('SENDER_EMAIL');
        expect(envVars).toHaveProperty('AWS_LAMBDA_EXTENSIONS_ENABLED');
      });

      test('should have dead letter queue configuration', () => {
        const dlq = template.Resources.ReportGeneratorFunction.Properties.DeadLetterConfig;
        expect(dlq).toHaveProperty('TargetArn');
      });

      test('should have reserved concurrent executions', () => {
        const concurrency = template.Resources.ReportGeneratorFunction.Properties.ReservedConcurrentExecutions;
        expect(concurrency).toBe(100);
      });
    });

    describe('EventBridge Rule', () => {
      test('should have correct schedule configuration', () => {
        const schedule = template.Resources.DailyReportSchedule;
        expect(schedule.Type).toBe('AWS::Events::Rule');
        expect(schedule.Properties.ScheduleExpression).toBe('cron(0 6 * * ? *)');
        expect(schedule.Properties.State).toBe('ENABLED');
      });

      test('should use EnvironmentSuffix in rule name', () => {
        const ruleName = template.Resources.DailyReportSchedule.Properties.Name;
        expect(JSON.stringify(ruleName)).toContain('${EnvironmentSuffix}');
      });

      test('should target Lambda function', () => {
        const targets = template.Resources.DailyReportSchedule.Properties.Targets;
        expect(targets).toHaveLength(1);
        expect(targets[0]).toHaveProperty('Arn');
        expect(targets[0].Id).toBe('ReportGeneratorTarget');
      });

      test('should have retry policy', () => {
        const retryPolicy = template.Resources.DailyReportSchedule.Properties.Targets[0].RetryPolicy;
        expect(retryPolicy.MaximumRetryAttempts).toBe(2);
      });
    });

    describe('SNS Topic', () => {
      test('should have correct configuration', () => {
        const sns = template.Resources.FailureNotificationTopic;
        expect(sns.Type).toBe('AWS::SNS::Topic');
        expect(sns.Properties.DisplayName).toBe('Report Generation Failures');
        expect(sns.Properties.KmsMasterKeyId).toBe('alias/aws/sns');
      });

      test('should use EnvironmentSuffix in topic name', () => {
        const topicName = template.Resources.FailureNotificationTopic.Properties.TopicName;
        expect(JSON.stringify(topicName)).toContain('${EnvironmentSuffix}');
      });
    });

    describe('SQS Queue', () => {
      test('should have correct configuration', () => {
        const sqs = template.Resources.ReportDeadLetterQueue;
        expect(sqs.Type).toBe('AWS::SQS::Queue');
        expect(sqs.Properties.MessageRetentionPeriod).toBe(1209600); // 14 days
        expect(sqs.Properties.VisibilityTimeout).toBe(300);
        expect(sqs.Properties.KmsMasterKeyId).toBe('alias/aws/sqs');
      });

      test('should use EnvironmentSuffix in queue name', () => {
        const queueName = template.Resources.ReportDeadLetterQueue.Properties.QueueName;
        expect(JSON.stringify(queueName)).toContain('${EnvironmentSuffix}');
      });
    });

    describe('IAM Role', () => {
      test('should have correct configuration', () => {
        const role = template.Resources.LambdaExecutionRole;
        expect(role.Type).toBe('AWS::IAM::Role');
        expect(role.Properties.ManagedPolicyArns).toContain('arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole');
      });

      test('should have correct policies', () => {
        const policies = template.Resources.LambdaExecutionRole.Properties.Policies;
        expect(policies).toHaveLength(1);

        const policy = policies[0];
        expect(policy.PolicyName).toBe('ReportGenerationPolicy');

        const statements = policy.PolicyDocument.Statement;
        expect(statements).toBeDefined();

        // Check for S3 permissions
        const s3Statement = statements.find((s: any) => s.Action && s.Action.some((a: string) => a.startsWith('s3:')));
        expect(s3Statement).toBeDefined();

        // Check for SNS permissions
        const snsStatement = statements.find((s: any) => s.Action && s.Action.some((a: string) => a.startsWith('sns:')));
        expect(snsStatement).toBeDefined();

        // Check for Secrets Manager permissions
        const secretsStatement = statements.find((s: any) => s.Action && s.Action.some((a: string) => a.startsWith('secretsmanager:')));
        expect(secretsStatement).toBeDefined();
      });
    });

    describe('CloudWatch Alarms', () => {
      test('should have failure alarm', () => {
        const alarm = template.Resources.ReportGenerationFailureAlarm;
        expect(alarm.Type).toBe('AWS::CloudWatch::Alarm');
        expect(alarm.Properties.MetricName).toBe('Errors');
        expect(alarm.Properties.Threshold).toBe(10);
      });

      test('should have duration alarm', () => {
        const alarm = template.Resources.ReportGenerationDurationAlarm;
        expect(alarm.Type).toBe('AWS::CloudWatch::Alarm');
        expect(alarm.Properties.MetricName).toBe('Duration');
        expect(alarm.Properties.Threshold).toBe(240000);
      });
    });

    describe('Secrets Manager', () => {
      test('should have database secret', () => {
        const secret = template.Resources.DatabaseSecret;
        expect(secret.Type).toBe('AWS::SecretsManager::Secret');
        expect(secret.Properties).toHaveProperty('Name');
        expect(secret.Properties).toHaveProperty('SecretString');
      });

      test('should use EnvironmentSuffix in secret name', () => {
        const secretName = template.Resources.DatabaseSecret.Properties.Name;
        expect(JSON.stringify(secretName)).toContain('${EnvironmentSuffix}');
      });
    });
  });

  describe('Outputs', () => {
    test('should have all required outputs', () => {
      expect(template).toHaveProperty('Outputs');
      const outputs = template.Outputs;

      expect(outputs).toHaveProperty('ReportBucketName');
      expect(outputs).toHaveProperty('LambdaFunctionArn');
      expect(outputs).toHaveProperty('LambdaFunctionName');
      expect(outputs).toHaveProperty('SNSTopicArn');
      expect(outputs).toHaveProperty('DeadLetterQueueUrl');
      expect(outputs).toHaveProperty('DatabaseSecretArn');
      expect(outputs).toHaveProperty('EventRuleArn');
      expect(outputs).toHaveProperty('CloudWatchLogGroup');
    });

    test('should have export names for all outputs', () => {
      Object.values(template.Outputs).forEach((output: any) => {
        expect(output).toHaveProperty('Export');
        expect(output.Export).toHaveProperty('Name');
      });
    });
  });

  describe('Security and Best Practices', () => {
    test('should not have Retain deletion policies', () => {
      Object.values(template.Resources).forEach((resource: any) => {
        expect(resource.DeletionPolicy).not.toBe('Retain');
      });
    });

    test('should have NoEcho for sensitive parameters', () => {
      expect(template.Parameters.DatabasePassword.NoEcho).toBe(true);
    });

    test('should have encryption enabled on all storage resources', () => {
      // S3 bucket encryption
      const bucket = template.Resources.ReportBucket;
      expect(bucket.Properties.BucketEncryption).toBeDefined();

      // SQS queue encryption
      const queue = template.Resources.ReportDeadLetterQueue;
      expect(queue.Properties.KmsMasterKeyId).toBeDefined();

      // SNS topic encryption
      const topic = template.Resources.FailureNotificationTopic;
      expect(topic.Properties.KmsMasterKeyId).toBeDefined();
    });

    test('should use least privilege IAM policies', () => {
      const role = template.Resources.LambdaExecutionRole;
      const policies = role.Properties.Policies[0].PolicyDocument.Statement;

      // Check that S3 permissions are scoped
      const s3Statement = policies.find((s: any) => s.Action && s.Action.some((a: string) => a.startsWith('s3:Put')));
      expect(s3Statement.Resource).toBeDefined();
      expect(JSON.stringify(s3Statement.Resource)).toContain('ReportBucket.Arn');
    });
  });

  describe('Template Validation', () => {
    test('should pass CloudFormation validation', async () => {
      const templatePath = path.join(__dirname, '..', 'lib', 'TapStack.yml');
      const templateContent = fs.readFileSync(templatePath, 'utf8');

      try {
        const command = new ValidateTemplateCommand({
          TemplateBody: templateContent
        });
        const response = await cfnClient.send(command);
        expect(response).toHaveProperty('Parameters');
        expect(response).toHaveProperty('Description');
      } catch (error) {
        // In test environment, AWS credentials might not be available
        // so we'll skip this test if it fails due to credentials
        if (error instanceof Error && error.message.includes('credentials')) {
          console.warn('Skipping CloudFormation validation test due to missing credentials');
          expect(true).toBe(true);
        } else {
          throw error;
        }
      }
    }, 10000);
  });
});