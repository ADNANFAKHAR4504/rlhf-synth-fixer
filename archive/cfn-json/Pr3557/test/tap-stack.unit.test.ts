import fs from 'fs';
import path from 'path';

describe('TapStack CloudFormation Template - Serverless Email Notification System', () => {
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

    test('should have correct description', () => {
      expect(template.Description).toBe('Serverless Email Notification System for Job Board Platform');
    });

    test('should have Parameters, Resources, and Outputs sections', () => {
      expect(template.Parameters).toBeDefined();
      expect(template.Resources).toBeDefined();
      expect(template.Outputs).toBeDefined();
    });
  });

  describe('Parameters', () => {
    test('should have SenderEmail parameter', () => {
      expect(template.Parameters.SenderEmail).toBeDefined();
    });

    test('SenderEmail parameter should have correct properties', () => {
      const param = template.Parameters.SenderEmail;
      expect(param.Type).toBe('String');
      expect(param.Description).toBe('Verified SES email address for sending notifications');
      expect(param.AllowedPattern).toBeDefined();
      expect(param.ConstraintDescription).toBe('Must be a valid email address');
    });
  });

  describe('DynamoDB Tables', () => {
    test('should have UserPreferencesTable resource', () => {
      expect(template.Resources.UserPreferencesTable).toBeDefined();
    });

    test('UserPreferencesTable should have correct configuration', () => {
      const table = template.Resources.UserPreferencesTable;
      expect(table.Type).toBe('AWS::DynamoDB::Table');
      expect(table.Properties.BillingMode).toBe('PAY_PER_REQUEST');
      expect(table.Properties.AttributeDefinitions).toHaveLength(1);
      expect(table.Properties.AttributeDefinitions[0].AttributeName).toBe('userId');
      expect(table.Properties.AttributeDefinitions[0].AttributeType).toBe('S');
      expect(table.Properties.KeySchema[0].AttributeName).toBe('userId');
      expect(table.Properties.KeySchema[0].KeyType).toBe('HASH');
    });

    test('UserPreferencesTable should have correct tags', () => {
      const table = template.Resources.UserPreferencesTable;
      expect(table.Properties.Tags).toContainEqual({
        Key: 'iac-rlhf-amazon',
        Value: 'true'
      });
    });

    test('should have JobPostingsTable resource', () => {
      expect(template.Resources.JobPostingsTable).toBeDefined();
    });

    test('JobPostingsTable should have correct configuration', () => {
      const table = template.Resources.JobPostingsTable;
      expect(table.Type).toBe('AWS::DynamoDB::Table');
      expect(table.Properties.BillingMode).toBe('PAY_PER_REQUEST');
      expect(table.Properties.AttributeDefinitions).toHaveLength(1);
      expect(table.Properties.AttributeDefinitions[0].AttributeName).toBe('jobId');
      expect(table.Properties.AttributeDefinitions[0].AttributeType).toBe('S');
      expect(table.Properties.KeySchema[0].AttributeName).toBe('jobId');
      expect(table.Properties.KeySchema[0].KeyType).toBe('HASH');
    });

    test('JobPostingsTable should have correct tags', () => {
      const table = template.Resources.JobPostingsTable;
      expect(table.Properties.Tags).toContainEqual({
        Key: 'iac-rlhf-amazon',
        Value: 'true'
      });
    });
  });

  describe('S3 Bucket', () => {
    test('should have EmailTemplatesBucket resource', () => {
      expect(template.Resources.EmailTemplatesBucket).toBeDefined();
    });

    test('EmailTemplatesBucket should have correct configuration', () => {
      const bucket = template.Resources.EmailTemplatesBucket;
      expect(bucket.Type).toBe('AWS::S3::Bucket');
      expect(bucket.Properties.BucketEncryption).toBeDefined();
      expect(bucket.Properties.BucketEncryption.ServerSideEncryptionConfiguration).toBeDefined();
      expect(bucket.Properties.PublicAccessBlockConfiguration).toBeDefined();
    });

    test('EmailTemplatesBucket should block all public access', () => {
      const bucket = template.Resources.EmailTemplatesBucket;
      const publicAccess = bucket.Properties.PublicAccessBlockConfiguration;
      expect(publicAccess.BlockPublicAcls).toBe(true);
      expect(publicAccess.BlockPublicPolicy).toBe(true);
      expect(publicAccess.IgnorePublicAcls).toBe(true);
      expect(publicAccess.RestrictPublicBuckets).toBe(true);
    });

    test('EmailTemplatesBucket should have correct tags', () => {
      const bucket = template.Resources.EmailTemplatesBucket;
      expect(bucket.Properties.Tags).toContainEqual({
        Key: 'iac-rlhf-amazon',
        Value: 'true'
      });
    });

  });

  describe('IAM Role', () => {
    test('should have LambdaExecutionRole resource', () => {
      expect(template.Resources.LambdaExecutionRole).toBeDefined();
    });

    test('LambdaExecutionRole should have correct assume role policy', () => {
      const role = template.Resources.LambdaExecutionRole;
      expect(role.Type).toBe('AWS::IAM::Role');
      expect(role.Properties.AssumeRolePolicyDocument.Statement[0].Principal.Service).toBe('lambda.amazonaws.com');
      expect(role.Properties.AssumeRolePolicyDocument.Statement[0].Action).toBe('sts:AssumeRole');
    });

    test('LambdaExecutionRole should have AWSLambdaBasicExecutionRole managed policy', () => {
      const role = template.Resources.LambdaExecutionRole;
      expect(role.Properties.ManagedPolicyArns).toContain('arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole');
    });

    test('LambdaExecutionRole should have DynamoDBScanPolicy', () => {
      const role = template.Resources.LambdaExecutionRole;
      const scanPolicy = role.Properties.Policies.find((p: any) => p.PolicyName === 'DynamoDBScanPolicy');
      expect(scanPolicy).toBeDefined();
      expect(scanPolicy.PolicyDocument.Statement[0].Action).toBe('dynamodb:Scan');
      expect(scanPolicy.PolicyDocument.Statement[0].Resource).toHaveLength(2);
    });

    test('LambdaExecutionRole should have S3GetObjectPolicy', () => {
      const role = template.Resources.LambdaExecutionRole;
      const s3Policy = role.Properties.Policies.find((p: any) => p.PolicyName === 'S3GetObjectPolicy');
      expect(s3Policy).toBeDefined();
      expect(s3Policy.PolicyDocument.Statement[0].Action).toBe('s3:GetObject');
    });

    test('LambdaExecutionRole should have SESSendEmailPolicy', () => {
      const role = template.Resources.LambdaExecutionRole;
      const sesPolicy = role.Properties.Policies.find((p: any) => p.PolicyName === 'SESSendEmailPolicy');
      expect(sesPolicy).toBeDefined();
      expect(sesPolicy.PolicyDocument.Statement[0].Action).toBe('ses:SendEmail');
    });

    test('LambdaExecutionRole should have correct tags', () => {
      const role = template.Resources.LambdaExecutionRole;
      expect(role.Properties.Tags).toContainEqual({
        Key: 'iac-rlhf-amazon',
        Value: 'true'
      });
    });
  });

  describe('Lambda Function', () => {
    test('should have NotificationFunction resource', () => {
      expect(template.Resources.NotificationFunction).toBeDefined();
    });

    test('NotificationFunction should have correct runtime', () => {
      const lambda = template.Resources.NotificationFunction;
      expect(lambda.Type).toBe('AWS::Lambda::Function');
      expect(lambda.Properties.Runtime).toBe('nodejs20.x');
      expect(lambda.Properties.Handler).toBe('index.handler');
    });

    test('NotificationFunction should reference LambdaExecutionRole', () => {
      const lambda = template.Resources.NotificationFunction;
      expect(lambda.Properties.Role).toEqual({
        'Fn::GetAtt': ['LambdaExecutionRole', 'Arn']
      });
    });

    test('NotificationFunction should have correct environment variables', () => {
      const lambda = template.Resources.NotificationFunction;
      const env = lambda.Properties.Environment.Variables;
      expect(env.USER_PREFERENCES_TABLE).toEqual({ Ref: 'UserPreferencesTable' });
      expect(env.JOB_POSTINGS_TABLE).toEqual({ Ref: 'JobPostingsTable' });
      expect(env.TEMPLATE_BUCKET).toEqual({ Ref: 'EmailTemplatesBucket' });
      expect(env.SENDER_EMAIL).toEqual({ Ref: 'SenderEmail' });
    });

    test('NotificationFunction should have inline code', () => {
      const lambda = template.Resources.NotificationFunction;
      expect(lambda.Properties.Code.ZipFile).toBeDefined();
      expect(lambda.Properties.Code.ZipFile['Fn::Join']).toBeDefined();
    });

    test('NotificationFunction should have correct timeout', () => {
      const lambda = template.Resources.NotificationFunction;
      expect(lambda.Properties.Timeout).toBe(300);
    });

    test('NotificationFunction should have correct tags', () => {
      const lambda = template.Resources.NotificationFunction;
      expect(lambda.Properties.Tags).toContainEqual({
        Key: 'iac-rlhf-amazon',
        Value: 'true'
      });
    });
  });

  describe('EventBridge', () => {
    test('should have EventBridgeRule resource', () => {
      expect(template.Resources.EventBridgeRule).toBeDefined();
    });

    test('EventBridgeRule should have correct schedule expression', () => {
      const rule = template.Resources.EventBridgeRule;
      expect(rule.Type).toBe('AWS::Events::Rule');
      expect(rule.Properties.ScheduleExpression).toBe('cron(0 12 * * ? *)');
      expect(rule.Properties.State).toBe('ENABLED');
    });

    test('EventBridgeRule should target NotificationFunction', () => {
      const rule = template.Resources.EventBridgeRule;
      expect(rule.Properties.Targets).toHaveLength(1);
      expect(rule.Properties.Targets[0].Arn).toEqual({
        'Fn::GetAtt': ['NotificationFunction', 'Arn']
      });
    });

    test('should have EventBridgeLambdaPermission resource', () => {
      expect(template.Resources.EventBridgeLambdaPermission).toBeDefined();
    });

    test('EventBridgeLambdaPermission should grant correct permissions', () => {
      const permission = template.Resources.EventBridgeLambdaPermission;
      expect(permission.Type).toBe('AWS::Lambda::Permission');
      expect(permission.Properties.Action).toBe('lambda:InvokeFunction');
      expect(permission.Properties.Principal).toBe('events.amazonaws.com');
    });
  });

  describe('SES Configuration', () => {
    test('should have SESConfigurationSet resource', () => {
      expect(template.Resources.SESConfigurationSet).toBeDefined();
    });

    test('SESConfigurationSet should have dynamic name', () => {
      const configSet = template.Resources.SESConfigurationSet;
      expect(configSet.Type).toBe('AWS::SES::ConfigurationSet');
      expect(configSet.Properties.Name).toEqual({
        'Fn::Sub': '${AWS::StackName}-email-config-set'
      });
    });

    test('should have SESEventDestination resource', () => {
      expect(template.Resources.SESEventDestination).toBeDefined();
    });

    test('SESEventDestination should publish to CloudWatch', () => {
      const destination = template.Resources.SESEventDestination;
      expect(destination.Type).toBe('AWS::SES::ConfigurationSetEventDestination');
      expect(destination.Properties.EventDestination.Name).toBe('CloudWatchDestination');
      expect(destination.Properties.EventDestination.Enabled).toBe(true);
      expect(destination.Properties.EventDestination.MatchingEventTypes).toContain('send');
      expect(destination.Properties.EventDestination.MatchingEventTypes).toContain('bounce');
      expect(destination.Properties.EventDestination.MatchingEventTypes).toContain('complaint');
    });

    test('SESEventDestination should have CloudWatch dimension configuration', () => {
      const destination = template.Resources.SESEventDestination;
      const cwConfig = destination.Properties.EventDestination.CloudWatchDestination;
      expect(cwConfig).toBeDefined();
      expect(cwConfig.DimensionConfigurations).toHaveLength(1);
    });
  });

  describe('Outputs', () => {
    test('should have all required outputs', () => {
      const expectedOutputs = [
        'UserPreferencesTable',
        'JobPostingsTable',
        'S3Bucket',
        'LambdaFunctionARN'
      ];

      expectedOutputs.forEach(outputName => {
        expect(template.Outputs[outputName]).toBeDefined();
      });
    });

    test('UserPreferencesTable output should be correct', () => {
      const output = template.Outputs.UserPreferencesTable;
      expect(output.Description).toBe('Name of the UserPreferences DynamoDB table');
      expect(output.Value).toEqual({ Ref: 'UserPreferencesTable' });
    });

    test('JobPostingsTable output should be correct', () => {
      const output = template.Outputs.JobPostingsTable;
      expect(output.Description).toBe('Name of the JobPostings DynamoDB table');
      expect(output.Value).toEqual({ Ref: 'JobPostingsTable' });
    });

    test('S3Bucket output should be correct', () => {
      const output = template.Outputs.S3Bucket;
      expect(output.Description).toBe('Name of the S3 bucket for email templates');
      expect(output.Value).toEqual({ Ref: 'EmailTemplatesBucket' });
    });

    test('LambdaFunctionARN output should be correct', () => {
      const output = template.Outputs.LambdaFunctionARN;
      expect(output.Description).toBe('ARN of the notification Lambda function');
      expect(output.Value).toEqual({
        'Fn::GetAtt': ['NotificationFunction', 'Arn']
      });
    });
  });

  describe('Resource Tagging', () => {
    test('all taggable resources should have iac-rlhf-amazon tag', () => {
      const taggableResources = [
        'UserPreferencesTable',
        'JobPostingsTable',
        'EmailTemplatesBucket',
        'LambdaExecutionRole',
        'NotificationFunction'
      ];

      taggableResources.forEach(resourceName => {
        const resource = template.Resources[resourceName];
        expect(resource.Properties.Tags).toContainEqual({
          Key: 'iac-rlhf-amazon',
          Value: 'true'
        });
      });
    });
  });

  describe('Security Best Practices', () => {
    test('S3 bucket should have encryption enabled', () => {
      const bucket = template.Resources.EmailTemplatesBucket;
      expect(bucket.Properties.BucketEncryption.ServerSideEncryptionConfiguration[0].ServerSideEncryptionByDefault.SSEAlgorithm).toBe('AES256');
    });

    test('IAM role should follow least privilege principle', () => {
      const role = template.Resources.LambdaExecutionRole;
      const policies = role.Properties.Policies;

      const dynamoPolicy = policies.find((p: any) => p.PolicyName === 'DynamoDBScanPolicy');
      expect(dynamoPolicy.PolicyDocument.Statement[0].Action).toBe('dynamodb:Scan');

      const s3Policy = policies.find((p: any) => p.PolicyName === 'S3GetObjectPolicy');
      expect(s3Policy.PolicyDocument.Statement[0].Action).toBe('s3:GetObject');

      const sesPolicy = policies.find((p: any) => p.PolicyName === 'SESSendEmailPolicy');
      expect(sesPolicy.PolicyDocument.Statement[0].Action).toBe('ses:SendEmail');
    });
  });

  describe('Template Completeness', () => {
    test('should have exactly 9 resources', () => {
      const resourceCount = Object.keys(template.Resources).length;
      expect(resourceCount).toBe(9);
    });

    test('should have exactly 1 parameter', () => {
      const parameterCount = Object.keys(template.Parameters).length;
      expect(parameterCount).toBe(1);
    });

    test('should have exactly 4 outputs', () => {
      const outputCount = Object.keys(template.Outputs).length;
      expect(outputCount).toBe(4);
    });

    test('Lambda function code should include all required SDK clients', () => {
      const lambda = template.Resources.NotificationFunction;
      const codeLines = lambda.Properties.Code.ZipFile['Fn::Join'][1];
      const codeString = codeLines.join('\n');

      expect(codeString).toContain('DynamoDBClient');
      expect(codeString).toContain('S3Client');
      expect(codeString).toContain('SESClient');
      expect(codeString).toContain('ScanCommand');
      expect(codeString).toContain('GetObjectCommand');
      expect(codeString).toContain('SendEmailCommand');
    });

    test('Lambda function should use environment variables correctly', () => {
      const lambda = template.Resources.NotificationFunction;
      const codeLines = lambda.Properties.Code.ZipFile['Fn::Join'][1];
      const codeString = codeLines.join('\n');

      expect(codeString).toContain('process.env.USER_PREFERENCES_TABLE');
      expect(codeString).toContain('process.env.JOB_POSTINGS_TABLE');
      expect(codeString).toContain('process.env.TEMPLATE_BUCKET');
      expect(codeString).toContain('process.env.SENDER_EMAIL');
    });
  });
});
