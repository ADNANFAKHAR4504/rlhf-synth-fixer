import fs from 'fs';
import path from 'path';

const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';

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
      expect(template.Description).toContain('TAP Stack');
    });

    test('should have metadata section', () => {
      expect(template.Metadata).toBeDefined();
      expect(template.Metadata['AWS::CloudFormation::Interface']).toBeDefined();
    });
  });

  describe('Parameters', () => {
    test('should have EnvironmentSuffix parameter', () => {
      expect(template.Parameters.EnvironmentSuffix).toBeDefined();
    });

    test('EnvironmentSuffix parameter should have correct properties', () => {
      const envSuffixParam = template.Parameters.EnvironmentSuffix;
      expect(envSuffixParam.Type).toBe('String');
      expect(envSuffixParam.Default).toBe('dev');
      expect(envSuffixParam.AllowedPattern).toBe('^[a-zA-Z0-9]+$');
    });

    test('should have NotificationEmail parameter', () => {
      expect(template.Parameters.NotificationEmail).toBeDefined();
    });

    test('NotificationEmail parameter should have correct properties', () => {
      const emailParam = template.Parameters.NotificationEmail;
      expect(emailParam.Type).toBe('String');
      expect(emailParam.Default).toBe('noreply@example.com');
      expect(emailParam.AllowedPattern).toBeDefined();
    });
  });

  describe('DynamoDB Resources', () => {
    test('should have TurnAroundPromptTable resource', () => {
      expect(template.Resources.TurnAroundPromptTable).toBeDefined();
    });

    test('TurnAroundPromptTable should be a DynamoDB table', () => {
      const table = template.Resources.TurnAroundPromptTable;
      expect(table.Type).toBe('AWS::DynamoDB::Table');
    });

    test('TurnAroundPromptTable should have correct billing mode', () => {
      const table = template.Resources.TurnAroundPromptTable;
      expect(table.Properties.BillingMode).toBe('PAY_PER_REQUEST');
    });

    test('TurnAroundPromptTable should have Global Secondary Indexes', () => {
      const table = template.Resources.TurnAroundPromptTable;
      expect(table.Properties.GlobalSecondaryIndexes).toBeDefined();
      expect(Array.isArray(table.Properties.GlobalSecondaryIndexes)).toBe(true);
      expect(table.Properties.GlobalSecondaryIndexes.length).toBeGreaterThan(0);
    });

    test('TurnAroundPromptTable should have DateSentimentIndex GSI', () => {
      const table = template.Resources.TurnAroundPromptTable;
      const gsi = table.Properties.GlobalSecondaryIndexes.find(
        (g: any) => g.IndexName === 'DateSentimentIndex'
      );
      expect(gsi).toBeDefined();
    });

    test('TurnAroundPromptTable should have SentimentTimestampIndex GSI', () => {
      const table = template.Resources.TurnAroundPromptTable;
      const gsi = table.Properties.GlobalSecondaryIndexes.find(
        (g: any) => g.IndexName === 'SentimentTimestampIndex'
      );
      expect(gsi).toBeDefined();
    });

    test('TurnAroundPromptTable should have proper tags', () => {
      const table = template.Resources.TurnAroundPromptTable;
      expect(table.Properties.Tags).toBeDefined();
      const envTag = table.Properties.Tags.find(
        (t: any) => t.Key === 'Environment'
      );
      expect(envTag).toBeDefined();
    });
  });

  describe('S3 Resources', () => {
    test('should have ReportsBucket resource', () => {
      expect(template.Resources.ReportsBucket).toBeDefined();
    });

    test('ReportsBucket should be an S3 bucket', () => {
      const bucket = template.Resources.ReportsBucket;
      expect(bucket.Type).toBe('AWS::S3::Bucket');
    });

    test('ReportsBucket should have encryption enabled', () => {
      const bucket = template.Resources.ReportsBucket;
      expect(bucket.Properties.BucketEncryption).toBeDefined();
    });

    test('ReportsBucket should have public access blocked', () => {
      const bucket = template.Resources.ReportsBucket;
      expect(bucket.Properties.PublicAccessBlockConfiguration).toBeDefined();
      expect(
        bucket.Properties.PublicAccessBlockConfiguration.BlockPublicAcls
      ).toBe(true);
      expect(
        bucket.Properties.PublicAccessBlockConfiguration.BlockPublicPolicy
      ).toBe(true);
      expect(
        bucket.Properties.PublicAccessBlockConfiguration.IgnorePublicAcls
      ).toBe(true);
      expect(
        bucket.Properties.PublicAccessBlockConfiguration.RestrictPublicBuckets
      ).toBe(true);
    });

    test('ReportsBucket should have lifecycle policy', () => {
      const bucket = template.Resources.ReportsBucket;
      expect(bucket.Properties.LifecycleConfiguration).toBeDefined();
      expect(bucket.Properties.LifecycleConfiguration.Rules).toBeDefined();
    });
  });

  describe('IAM Resources', () => {
    test('should have FeedbackProcessorRole resource', () => {
      expect(template.Resources.FeedbackProcessorRole).toBeDefined();
    });

    test('FeedbackProcessorRole should be an IAM role', () => {
      const role = template.Resources.FeedbackProcessorRole;
      expect(role.Type).toBe('AWS::IAM::Role');
    });

    test('FeedbackProcessorRole should have AssumeRolePolicyDocument', () => {
      const role = template.Resources.FeedbackProcessorRole;
      expect(role.Properties.AssumeRolePolicyDocument).toBeDefined();
    });

    test('FeedbackProcessorRole should have managed policies', () => {
      const role = template.Resources.FeedbackProcessorRole;
      expect(role.Properties.ManagedPolicyArns).toBeDefined();
      expect(Array.isArray(role.Properties.ManagedPolicyArns)).toBe(true);
    });

    test('should have ReportGeneratorRole resource', () => {
      expect(template.Resources.ReportGeneratorRole).toBeDefined();
    });

    test('ReportGeneratorRole should be an IAM role', () => {
      const role = template.Resources.ReportGeneratorRole;
      expect(role.Type).toBe('AWS::IAM::Role');
    });
  });

  describe('Lambda Resources', () => {
    test('should have FeedbackProcessorFunction resource', () => {
      expect(template.Resources.FeedbackProcessorFunction).toBeDefined();
    });

    test('FeedbackProcessorFunction should be a Lambda function', () => {
      const lambda = template.Resources.FeedbackProcessorFunction;
      expect(lambda.Type).toBe('AWS::Lambda::Function');
    });

    test('FeedbackProcessorFunction should use Python 3.10 runtime', () => {
      const lambda = template.Resources.FeedbackProcessorFunction;
      expect(lambda.Properties.Runtime).toBe('python3.10');
    });

    test('FeedbackProcessorFunction should have environment variables', () => {
      const lambda = template.Resources.FeedbackProcessorFunction;
      expect(lambda.Properties.Environment).toBeDefined();
      expect(lambda.Properties.Environment.Variables).toBeDefined();
      expect(lambda.Properties.Environment.Variables.TABLE_NAME).toBeDefined();
      expect(lambda.Properties.Environment.Variables.ENVIRONMENT).toBeDefined();
    });

    test('FeedbackProcessorFunction should have proper timeout and memory', () => {
      const lambda = template.Resources.FeedbackProcessorFunction;
      expect(lambda.Properties.Timeout).toBeDefined();
      expect(lambda.Properties.MemorySize).toBeDefined();
      expect(lambda.Properties.Timeout).toBeGreaterThanOrEqual(30);
      expect(lambda.Properties.MemorySize).toBeGreaterThanOrEqual(128);
    });

    test('should have ReportGeneratorFunction resource', () => {
      expect(template.Resources.ReportGeneratorFunction).toBeDefined();
    });

    test('ReportGeneratorFunction should be a Lambda function', () => {
      const lambda = template.Resources.ReportGeneratorFunction;
      expect(lambda.Type).toBe('AWS::Lambda::Function');
    });

    test('ReportGeneratorFunction should use Python 3.10 runtime', () => {
      const lambda = template.Resources.ReportGeneratorFunction;
      expect(lambda.Properties.Runtime).toBe('python3.10');
    });

    test('ReportGeneratorFunction should have all required environment variables', () => {
      const lambda = template.Resources.ReportGeneratorFunction;
      expect(lambda.Properties.Environment.Variables.TABLE_NAME).toBeDefined();
      expect(lambda.Properties.Environment.Variables.BUCKET_NAME).toBeDefined();
      expect(
        lambda.Properties.Environment.Variables.NOTIFICATION_EMAIL
      ).toBeDefined();
      expect(lambda.Properties.Environment.Variables.ENVIRONMENT).toBeDefined();
    });
  });

  describe('API Gateway Resources', () => {
    test('should have FeedbackApi resource', () => {
      expect(template.Resources.FeedbackApi).toBeDefined();
    });

    test('FeedbackApi should be a REST API', () => {
      const api = template.Resources.FeedbackApi;
      expect(api.Type).toBe('AWS::ApiGateway::RestApi');
    });

    test('should have FeedbackResource', () => {
      expect(template.Resources.FeedbackResource).toBeDefined();
    });

    test('should have FeedbackMethod', () => {
      expect(template.Resources.FeedbackMethod).toBeDefined();
    });

    test('FeedbackMethod should be a POST method', () => {
      const method = template.Resources.FeedbackMethod;
      expect(method.Type).toBe('AWS::ApiGateway::Method');
      expect(method.Properties.HttpMethod).toBe('POST');
    });

    test('should have ApiRequestValidator', () => {
      expect(template.Resources.ApiRequestValidator).toBeDefined();
    });

    test('should have FeedbackModel for request validation', () => {
      expect(template.Resources.FeedbackModel).toBeDefined();
    });

    test('should have ApiDeployment', () => {
      expect(template.Resources.ApiDeployment).toBeDefined();
    });

    test('should have Lambda permission for API Gateway', () => {
      expect(template.Resources.ApiGatewayInvokePermission).toBeDefined();
      const permission = template.Resources.ApiGatewayInvokePermission;
      expect(permission.Type).toBe('AWS::Lambda::Permission');
      expect(permission.Properties.Action).toBe('lambda:InvokeFunction');
    });
  });

  describe('EventBridge Resources', () => {
    test('should have WeeklyReportSchedule resource', () => {
      expect(template.Resources.WeeklyReportSchedule).toBeDefined();
    });

    test('WeeklyReportSchedule should be an Events Rule', () => {
      const rule = template.Resources.WeeklyReportSchedule;
      expect(rule.Type).toBe('AWS::Events::Rule');
    });

    test('WeeklyReportSchedule should have cron expression', () => {
      const rule = template.Resources.WeeklyReportSchedule;
      expect(rule.Properties.ScheduleExpression).toBeDefined();
      expect(rule.Properties.ScheduleExpression).toContain('cron');
    });

    test('WeeklyReportSchedule should be enabled', () => {
      const rule = template.Resources.WeeklyReportSchedule;
      expect(rule.Properties.State).toBe('ENABLED');
    });

    test('should have EventBridgeInvokePermission', () => {
      expect(template.Resources.EventBridgeInvokePermission).toBeDefined();
      const permission = template.Resources.EventBridgeInvokePermission;
      expect(permission.Type).toBe('AWS::Lambda::Permission');
    });
  });

  describe('CloudWatch Resources', () => {
    test('should have FeedbackProcessorErrorAlarm', () => {
      expect(template.Resources.FeedbackProcessorErrorAlarm).toBeDefined();
    });

    test('FeedbackProcessorErrorAlarm should be a CloudWatch Alarm', () => {
      const alarm = template.Resources.FeedbackProcessorErrorAlarm;
      expect(alarm.Type).toBe('AWS::CloudWatch::Alarm');
    });

    test('should have ReportGeneratorErrorAlarm', () => {
      expect(template.Resources.ReportGeneratorErrorAlarm).toBeDefined();
    });

    test('should have ApiGateway4xxAlarm', () => {
      expect(template.Resources.ApiGateway4xxAlarm).toBeDefined();
    });

    test('should have ApiGateway5xxAlarm', () => {
      expect(template.Resources.ApiGateway5xxAlarm).toBeDefined();
    });

    test('should have FeedbackProcessorLogGroup', () => {
      expect(template.Resources.FeedbackProcessorLogGroup).toBeDefined();
    });

    test('FeedbackProcessorLogGroup should have retention policy', () => {
      const logGroup = template.Resources.FeedbackProcessorLogGroup;
      expect(logGroup.Properties.RetentionInDays).toBeDefined();
      expect(logGroup.Properties.RetentionInDays).toBeGreaterThan(0);
    });

    test('should have ReportGeneratorLogGroup', () => {
      expect(template.Resources.ReportGeneratorLogGroup).toBeDefined();
    });
  });

  describe('Outputs', () => {
    test('should have all required outputs', () => {
      const expectedOutputs = [
        'TurnAroundPromptTableName',
        'TurnAroundPromptTableArn',
        'ApiEndpoint',
        'ReportsBucketName',
        'FeedbackProcessorFunctionArn',
        'ReportGeneratorFunctionArn',
        'StackName',
        'EnvironmentSuffix',
      ];

      expectedOutputs.forEach(outputName => {
        expect(template.Outputs[outputName]).toBeDefined();
      });
    });

    test('TurnAroundPromptTableName output should be correct', () => {
      const output = template.Outputs.TurnAroundPromptTableName;
      expect(output.Description).toBe('Name of the DynamoDB table');
      expect(output.Value).toBeDefined();
    });

    test('ApiEndpoint output should be correct', () => {
      const output = template.Outputs.ApiEndpoint;
      expect(output.Description).toContain('API Gateway');
      expect(output.Value).toBeDefined();
    });

    test('ReportsBucketName output should be correct', () => {
      const output = template.Outputs.ReportsBucketName;
      expect(output.Description).toContain('S3 bucket');
      expect(output.Value).toBeDefined();
    });

    test('all outputs should have exports', () => {
      Object.keys(template.Outputs).forEach(outputKey => {
        const output = template.Outputs[outputKey];
        expect(output.Export).toBeDefined();
        expect(output.Export.Name).toBeDefined();
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

    test('should have proper number of resources', () => {
      const resourceCount = Object.keys(template.Resources).length;
      expect(resourceCount).toBeGreaterThan(10);
    });

    test('should have proper number of parameters', () => {
      const parameterCount = Object.keys(template.Parameters).length;
      expect(parameterCount).toBe(2);
    });

    test('should have proper number of outputs', () => {
      const outputCount = Object.keys(template.Outputs).length;
      expect(outputCount).toBe(8);
    });
  });

  describe('Resource Naming Convention', () => {
    test('DynamoDB table name should follow naming convention with environment suffix', () => {
      const table = template.Resources.TurnAroundPromptTable;
      const tableName = table.Properties.TableName;
      expect(tableName).toBeDefined();
    });

    test('Lambda functions should have environment suffix in name', () => {
      const feedbackLambda = template.Resources.FeedbackProcessorFunction;
      const reportLambda = template.Resources.ReportGeneratorFunction;
      expect(feedbackLambda.Properties.FunctionName).toBeDefined();
      expect(reportLambda.Properties.FunctionName).toBeDefined();
    });

    test('export names should follow naming convention', () => {
      Object.keys(template.Outputs).forEach(outputKey => {
        const output = template.Outputs[outputKey];
        expect(output.Export.Name).toBeDefined();
      });
    });
  });

  describe('Security Configuration', () => {
    test('S3 bucket should have server-side encryption', () => {
      const bucket = template.Resources.ReportsBucket;
      expect(bucket.Properties.BucketEncryption).toBeDefined();
      expect(
        bucket.Properties.BucketEncryption.ServerSideEncryptionConfiguration
      ).toBeDefined();
    });

    test('IAM roles should follow least privilege principle', () => {
      const feedbackRole = template.Resources.FeedbackProcessorRole;
      const reportRole = template.Resources.ReportGeneratorRole;
      expect(feedbackRole.Properties.Policies).toBeDefined();
      expect(reportRole.Properties.Policies).toBeDefined();
    });

    test('Lambda functions should have appropriate IAM roles', () => {
      const feedbackLambda = template.Resources.FeedbackProcessorFunction;
      const reportLambda = template.Resources.ReportGeneratorFunction;
      expect(feedbackLambda.Properties.Role).toBeDefined();
      expect(reportLambda.Properties.Role).toBeDefined();
    });
  });

  describe('Monitoring and Alarms', () => {
    test('should have error monitoring for Lambda functions', () => {
      expect(template.Resources.FeedbackProcessorErrorAlarm).toBeDefined();
      expect(template.Resources.ReportGeneratorErrorAlarm).toBeDefined();
    });

    test('should have API Gateway monitoring', () => {
      expect(template.Resources.ApiGateway4xxAlarm).toBeDefined();
      expect(template.Resources.ApiGateway5xxAlarm).toBeDefined();
    });

    test('alarms should have proper thresholds', () => {
      const feedbackAlarm = template.Resources.FeedbackProcessorErrorAlarm;
      const reportAlarm = template.Resources.ReportGeneratorErrorAlarm;
      expect(feedbackAlarm.Properties.Threshold).toBeDefined();
      expect(reportAlarm.Properties.Threshold).toBeDefined();
    });
  });

  describe('Integration Points', () => {
    test('Lambda should be integrated with DynamoDB', () => {
      const feedbackLambda = template.Resources.FeedbackProcessorFunction;
      expect(
        feedbackLambda.Properties.Environment.Variables.TABLE_NAME
      ).toBeDefined();
    });

    test('Lambda should be integrated with S3', () => {
      const reportLambda = template.Resources.ReportGeneratorFunction;
      expect(
        reportLambda.Properties.Environment.Variables.BUCKET_NAME
      ).toBeDefined();
    });

    test('API Gateway should be integrated with Lambda', () => {
      const method = template.Resources.FeedbackMethod;
      expect(method.Properties.Integration).toBeDefined();
      expect(method.Properties.Integration.Type).toBe('AWS_PROXY');
    });

    test('EventBridge should trigger Lambda', () => {
      const rule = template.Resources.WeeklyReportSchedule;
      expect(rule.Properties.Targets).toBeDefined();
      expect(Array.isArray(rule.Properties.Targets)).toBe(true);
      expect(rule.Properties.Targets.length).toBeGreaterThan(0);
    });
  });
});
