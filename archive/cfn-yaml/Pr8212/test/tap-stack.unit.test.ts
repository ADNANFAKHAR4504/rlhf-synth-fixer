import fs from 'fs';
import path from 'path';

describe('TapStack CloudFormation Template - LocalStack Unit Tests', () => {
  let template: any;

  beforeAll(() => {
    const templatePath = path.join(__dirname, '../lib/TapStack.json');
    if (!fs.existsSync(templatePath)) {
      throw new Error(
        'TapStack.json not found. Run: pipenv run cfn-flip-to-json'
      );
    }
    const templateContent = fs.readFileSync(templatePath, 'utf8');
    template = JSON.parse(templateContent);
  });

  describe('Template Structure and Basics', () => {
    test('should have valid CloudFormation format version', () => {
      expect(template.AWSTemplateFormatVersion).toBe('2010-09-09');
    });

    test('should have a description', () => {
      expect(template.Description).toBeDefined();
      expect(typeof template.Description).toBe('string');
      expect(template.Description).toContain('TAP Stack');
      expect(template.Description).toContain('Feedback System');
    });

    test('should have Metadata section with CloudFormation Interface', () => {
      expect(template.Metadata).toBeDefined();
      expect(template.Metadata['AWS::CloudFormation::Interface']).toBeDefined();
    });

    test('should have Parameters section', () => {
      expect(template.Parameters).toBeDefined();
      expect(typeof template.Parameters).toBe('object');
    });

    test('should have Resources section', () => {
      expect(template.Resources).toBeDefined();
      expect(typeof template.Resources).toBe('object');
      expect(Object.keys(template.Resources).length).toBeGreaterThan(0);
    });

    test('should have Outputs section', () => {
      expect(template.Outputs).toBeDefined();
      expect(typeof template.Outputs).toBe('object');
    });

    test('should have correct number of resources', () => {
      const resourceCount = Object.keys(template.Resources).length;
      expect(resourceCount).toBe(21); // Total resources in the template
    });
  });

  describe('Parameters Validation', () => {
    test('should have EnvironmentSuffix parameter', () => {
      expect(template.Parameters.EnvironmentSuffix).toBeDefined();
    });

    test('EnvironmentSuffix parameter should have correct properties', () => {
      const param = template.Parameters.EnvironmentSuffix;
      expect(param.Type).toBe('String');
      expect(param.Default).toBe('dev');
      expect(param.Description).toContain('Environment suffix');
      expect(param.AllowedPattern).toBe('^[a-zA-Z0-9]+$');
      expect(param.ConstraintDescription).toContain('alphanumeric');
    });

    test('EnvironmentSuffix pattern should validate correctly', () => {
      const pattern = new RegExp(`^${template.Parameters.EnvironmentSuffix.AllowedPattern}$`);
      expect(pattern.test('dev')).toBe(true);
      expect(pattern.test('prod')).toBe(true);
      expect(pattern.test('staging123')).toBe(true);
      expect(pattern.test('dev-test')).toBe(false); // No hyphens allowed
      expect(pattern.test('dev_test')).toBe(false); // No underscores allowed
      expect(pattern.test('dev test')).toBe(false); // No spaces allowed
    });

    test('should only have EnvironmentSuffix parameter (NotificationEmail removed)', () => {
      const paramKeys = Object.keys(template.Parameters);
      expect(paramKeys).toEqual(['EnvironmentSuffix']);
      expect(paramKeys.length).toBe(1);
    });

    test('Metadata should reference only EnvironmentSuffix parameter', () => {
      const paramGroups = template.Metadata['AWS::CloudFormation::Interface'].ParameterGroups;
      expect(Array.isArray(paramGroups)).toBe(true);
      expect(paramGroups.length).toBe(1);
      expect(paramGroups[0].Parameters).toEqual(['EnvironmentSuffix']);
    });
  });

  describe('DynamoDB Table - TurnAroundPromptTable', () => {
    let table: any;

    beforeAll(() => {
      table = template.Resources.TurnAroundPromptTable;
    });

    test('should exist and be a DynamoDB table', () => {
      expect(table).toBeDefined();
      expect(table.Type).toBe('AWS::DynamoDB::Table');
    });

    test('should have correct deletion policies for LocalStack', () => {
      expect(table.DeletionPolicy).toBe('Delete');
      expect(table.UpdateReplacePolicy).toBe('Delete');
    });

    test('should have dynamic table name with environment suffix', () => {
      expect(table.Properties.TableName).toEqual({
        'Fn::Sub': 'TurnAroundPromptTable${EnvironmentSuffix}'
      });
    });

    test('should use PAY_PER_REQUEST billing mode (LocalStack compatible)', () => {
      expect(table.Properties.BillingMode).toBe('PAY_PER_REQUEST');
    });

    test('should have DeletionProtectionEnabled set to false', () => {
      expect(table.Properties.DeletionProtectionEnabled).toBe(false);
    });

    test('should have correct attribute definitions', () => {
      const attrs = table.Properties.AttributeDefinitions;
      expect(Array.isArray(attrs)).toBe(true);
      expect(attrs.length).toBe(4);

      const attrNames = attrs.map((a: any) => a.AttributeName);
      expect(attrNames).toContain('id');
      expect(attrNames).toContain('timestamp');
      expect(attrNames).toContain('sentiment');
      expect(attrNames).toContain('datePartition');

      const idAttr = attrs.find((a: any) => a.AttributeName === 'id');
      expect(idAttr.AttributeType).toBe('S');

      const timestampAttr = attrs.find((a: any) => a.AttributeName === 'timestamp');
      expect(timestampAttr.AttributeType).toBe('N');
    });

    test('should have correct primary key schema', () => {
      const keySchema = table.Properties.KeySchema;
      expect(Array.isArray(keySchema)).toBe(true);
      expect(keySchema.length).toBe(1);
      expect(keySchema[0].AttributeName).toBe('id');
      expect(keySchema[0].KeyType).toBe('HASH');
    });

    test('should have two Global Secondary Indexes', () => {
      const gsis = table.Properties.GlobalSecondaryIndexes;
      expect(Array.isArray(gsis)).toBe(true);
      expect(gsis.length).toBe(2);
    });

    test('should have DateSentimentIndex GSI with correct schema', () => {
      const gsi = table.Properties.GlobalSecondaryIndexes.find(
        (g: any) => g.IndexName === 'DateSentimentIndex'
      );
      expect(gsi).toBeDefined();
      expect(gsi.KeySchema.length).toBe(2);
      expect(gsi.KeySchema[0].AttributeName).toBe('datePartition');
      expect(gsi.KeySchema[0].KeyType).toBe('HASH');
      expect(gsi.KeySchema[1].AttributeName).toBe('timestamp');
      expect(gsi.KeySchema[1].KeyType).toBe('RANGE');
      expect(gsi.Projection.ProjectionType).toBe('ALL');
    });

    test('should have SentimentTimestampIndex GSI with correct schema', () => {
      const gsi = table.Properties.GlobalSecondaryIndexes.find(
        (g: any) => g.IndexName === 'SentimentTimestampIndex'
      );
      expect(gsi).toBeDefined();
      expect(gsi.KeySchema.length).toBe(2);
      expect(gsi.KeySchema[0].AttributeName).toBe('sentiment');
      expect(gsi.KeySchema[0].KeyType).toBe('HASH');
      expect(gsi.KeySchema[1].AttributeName).toBe('timestamp');
      expect(gsi.KeySchema[1].KeyType).toBe('RANGE');
      expect(gsi.Projection.ProjectionType).toBe('ALL');
    });

    test('should have DynamoDB Streams enabled', () => {
      const streamSpec = table.Properties.StreamSpecification;
      expect(streamSpec).toBeDefined();
      expect(streamSpec.StreamViewType).toBe('NEW_AND_OLD_IMAGES');
    });

    test('should have proper tags including iac-rlhf-amazon', () => {
      const tags = table.Properties.Tags;
      expect(Array.isArray(tags)).toBe(true);
      expect(tags.length).toBeGreaterThanOrEqual(2);

      const iamTag = tags.find((t: any) => t.Key === 'iac-rlhf-amazon');
      expect(iamTag).toBeDefined();
      expect(iamTag.Value).toBe('true');

      const envTag = tags.find((t: any) => t.Key === 'Environment');
      expect(envTag).toBeDefined();
      expect(envTag.Value).toEqual({ Ref: 'EnvironmentSuffix' });
    });
  });

  describe('S3 Bucket - ReportsBucket', () => {
    let bucket: any;

    beforeAll(() => {
      bucket = template.Resources.ReportsBucket;
    });

    test('should exist and be an S3 bucket', () => {
      expect(bucket).toBeDefined();
      expect(bucket.Type).toBe('AWS::S3::Bucket');
    });

    test('should have dynamic bucket name with AccountId', () => {
      expect(bucket.Properties.BucketName).toEqual({
        'Fn::Sub': 'feedback-reports-${EnvironmentSuffix}-${AWS::AccountId}'
      });
    });

    test('should have encryption enabled with AES256', () => {
      const encryption = bucket.Properties.BucketEncryption;
      expect(encryption).toBeDefined();
      expect(encryption.ServerSideEncryptionConfiguration).toBeDefined();
      expect(encryption.ServerSideEncryptionConfiguration[0].ServerSideEncryptionByDefault.SSEAlgorithm).toBe('AES256');
    });

    test('should have all public access blocked', () => {
      const publicAccess = bucket.Properties.PublicAccessBlockConfiguration;
      expect(publicAccess).toBeDefined();
      expect(publicAccess.BlockPublicAcls).toBe(true);
      expect(publicAccess.BlockPublicPolicy).toBe(true);
      expect(publicAccess.IgnorePublicAcls).toBe(true);
      expect(publicAccess.RestrictPublicBuckets).toBe(true);
    });

    test('should have versioning enabled', () => {
      const versioning = bucket.Properties.VersioningConfiguration;
      expect(versioning).toBeDefined();
      expect(versioning.Status).toBe('Enabled');
    });

    test('should have lifecycle rule to delete old reports', () => {
      const lifecycle = bucket.Properties.LifecycleConfiguration;
      expect(lifecycle).toBeDefined();
      expect(Array.isArray(lifecycle.Rules)).toBe(true);
      expect(lifecycle.Rules.length).toBe(1);
      
      const rule = lifecycle.Rules[0];
      expect(rule.Id).toBe('DeleteOldReports');
      expect(rule.Status).toBe('Enabled');
      expect(rule.ExpirationInDays).toBe(90);
    });

    test('should have proper tags', () => {
      const tags = bucket.Properties.Tags;
      expect(Array.isArray(tags)).toBe(true);
      const iamTag = tags.find((t: any) => t.Key === 'iac-rlhf-amazon');
      expect(iamTag).toBeDefined();
      expect(iamTag.Value).toBe('true');
    });
  });

  describe('IAM Role - FeedbackProcessorRole', () => {
    let role: any;

    beforeAll(() => {
      role = template.Resources.FeedbackProcessorRole;
    });

    test('should exist and be an IAM role', () => {
      expect(role).toBeDefined();
      expect(role.Type).toBe('AWS::IAM::Role');
    });

    test('should have dynamic role name', () => {
      expect(role.Properties.RoleName).toEqual({
        'Fn::Sub': 'FeedbackProcessorRole-${EnvironmentSuffix}'
      });
    });

    test('should have Lambda service as trusted entity', () => {
      const assumePolicy = role.Properties.AssumeRolePolicyDocument;
      expect(assumePolicy.Version).toBe('2012-10-17');
      expect(assumePolicy.Statement[0].Effect).toBe('Allow');
      expect(assumePolicy.Statement[0].Principal.Service).toBe('lambda.amazonaws.com');
      expect(assumePolicy.Statement[0].Action).toBe('sts:AssumeRole');
    });

    test('should have AWSLambdaBasicExecutionRole managed policy', () => {
      expect(role.Properties.ManagedPolicyArns).toContain('arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole');
    });

    test('should have DynamoDB permissions (no Comprehend)', () => {
      const policies = role.Properties.Policies;
      expect(Array.isArray(policies)).toBe(true);
      expect(policies.length).toBe(1);

      const policy = policies[0];
      expect(policy.PolicyName).toBe('FeedbackProcessorPolicy');

      const statements = policy.PolicyDocument.Statement;
      const dynamoStatement = statements.find((s: any) => 
        s.Action && s.Action.includes('dynamodb:PutItem')
      );
      expect(dynamoStatement).toBeDefined();
      expect(dynamoStatement.Action).toContain('dynamodb:PutItem');
      expect(dynamoStatement.Action).toContain('dynamodb:UpdateItem');
      expect(dynamoStatement.Action).toContain('dynamodb:GetItem');
    });

    test('should NOT have Comprehend permissions (LocalStack compatible)', () => {
      const policies = role.Properties.Policies;
      const policy = policies[0];
      const statements = policy.PolicyDocument.Statement;
      
      const comprehendStatement = statements.find((s: any) => 
        s.Action && JSON.stringify(s.Action).includes('comprehend')
      );
      expect(comprehendStatement).toBeUndefined();
    });

    test('should have CloudWatch permissions', () => {
      const policies = role.Properties.Policies;
      const policy = policies[0];
      const statements = policy.PolicyDocument.Statement;

      const cwStatement = statements.find((s: any) => 
        s.Action && s.Action.includes('cloudwatch:PutMetricData')
      );
      expect(cwStatement).toBeDefined();
    });
  });

  describe('IAM Role - ReportGeneratorRole', () => {
    let role: any;

    beforeAll(() => {
      role = template.Resources.ReportGeneratorRole;
    });

    test('should exist and be an IAM role', () => {
      expect(role).toBeDefined();
      expect(role.Type).toBe('AWS::IAM::Role');
    });

    test('should have DynamoDB read permissions including GSI access', () => {
      const policies = role.Properties.Policies;
      const policy = policies[0];
      const statements = policy.PolicyDocument.Statement;

      const dynamoStatement = statements.find((s: any) => 
        s.Action && s.Action.includes('dynamodb:Query')
      );
      expect(dynamoStatement).toBeDefined();
      expect(dynamoStatement.Action).toContain('dynamodb:Query');
      expect(dynamoStatement.Action).toContain('dynamodb:Scan');
      expect(dynamoStatement.Action).toContain('dynamodb:GetItem');
      
      // Should include GSI access
      expect(Array.isArray(dynamoStatement.Resource)).toBe(true);
      expect(dynamoStatement.Resource.length).toBe(2);
    });

    test('should have S3 write permissions', () => {
      const policies = role.Properties.Policies;
      const policy = policies[0];
      const statements = policy.PolicyDocument.Statement;

      const s3Statement = statements.find((s: any) => 
        s.Action && s.Action.includes('s3:PutObject')
      );
      expect(s3Statement).toBeDefined();
      expect(s3Statement.Action).toContain('s3:PutObject');
      expect(s3Statement.Action).toContain('s3:PutObjectAcl');
    });

    test('should NOT have SES permissions (LocalStack compatible)', () => {
      const policies = role.Properties.Policies;
      const policy = policies[0];
      const statements = policy.PolicyDocument.Statement;
      
      const sesStatement = statements.find((s: any) => 
        s.Action && JSON.stringify(s.Action).includes('ses')
      );
      expect(sesStatement).toBeUndefined();
    });
  });

  describe('Lambda Function - FeedbackProcessorFunction', () => {
    let lambda: any;

    beforeAll(() => {
      lambda = template.Resources.FeedbackProcessorFunction;
    });

    test('should exist and be a Lambda function', () => {
      expect(lambda).toBeDefined();
      expect(lambda.Type).toBe('AWS::Lambda::Function');
    });

    test('should have correct runtime and handler', () => {
      expect(lambda.Properties.Runtime).toBe('python3.10');
      expect(lambda.Properties.Handler).toBe('index.lambda_handler');
    });

    test('should have appropriate timeout and memory', () => {
      expect(lambda.Properties.Timeout).toBe(30);
      expect(lambda.Properties.MemorySize).toBe(256);
    });

    test('should have correct environment variables (no NOTIFICATION_EMAIL)', () => {
      const envVars = lambda.Properties.Environment.Variables;
      expect(envVars.TABLE_NAME).toEqual({ Ref: 'TurnAroundPromptTable' });
      expect(envVars.ENVIRONMENT).toEqual({ Ref: 'EnvironmentSuffix' });
      expect(envVars.NOTIFICATION_EMAIL).toBeUndefined(); // Should not exist
    });

    test('should reference FeedbackProcessorRole', () => {
      expect(lambda.Properties.Role).toEqual({
        'Fn::GetAtt': ['FeedbackProcessorRole', 'Arn']
      });
    });

    test('should have inline code with ZipFile', () => {
      expect(lambda.Properties.Code).toBeDefined();
      expect(lambda.Properties.Code.ZipFile).toBeDefined();
      expect(typeof lambda.Properties.Code.ZipFile).toBe('string');
    });

    test('Lambda code should NOT import comprehend (LocalStack compatible)', () => {
      const code = lambda.Properties.Code.ZipFile;
      expect(code).not.toContain("boto3.client('comprehend')");
      expect(code).not.toContain('comprehend.detect_sentiment');
    });

    test('Lambda code should have simple sentiment analysis', () => {
      const code = lambda.Properties.Code.ZipFile;
      expect(code).toContain('analyze_sentiment_simple');
      expect(code).toContain('positive_words');
      expect(code).toContain('negative_words');
    });

    test('Lambda code should use DynamoDB and CloudWatch', () => {
      const code = lambda.Properties.Code.ZipFile;
      expect(code).toContain("boto3.resource('dynamodb')");
      expect(code).toContain("boto3.client('cloudwatch')");
    });
  });

  describe('Lambda Function - ReportGeneratorFunction', () => {
    let lambda: any;

    beforeAll(() => {
      lambda = template.Resources.ReportGeneratorFunction;
    });

    test('should exist and be a Lambda function', () => {
      expect(lambda).toBeDefined();
      expect(lambda.Type).toBe('AWS::Lambda::Function');
    });

    test('should have correct runtime and handler', () => {
      expect(lambda.Properties.Runtime).toBe('python3.10');
      expect(lambda.Properties.Handler).toBe('index.lambda_handler');
    });

    test('should have appropriate timeout and memory for reporting', () => {
      expect(lambda.Properties.Timeout).toBe(60);
      expect(lambda.Properties.MemorySize).toBe(512);
    });

    test('should have correct environment variables (no NOTIFICATION_EMAIL)', () => {
      const envVars = lambda.Properties.Environment.Variables;
      expect(envVars.TABLE_NAME).toEqual({ Ref: 'TurnAroundPromptTable' });
      expect(envVars.BUCKET_NAME).toEqual({ Ref: 'ReportsBucket' });
      expect(envVars.ENVIRONMENT).toEqual({ Ref: 'EnvironmentSuffix' });
      expect(envVars.NOTIFICATION_EMAIL).toBeUndefined(); // Should not exist
    });

    test('Lambda code should NOT import SES (LocalStack compatible)', () => {
      const code = lambda.Properties.Code.ZipFile;
      expect(code).not.toContain("boto3.client('ses')");
      expect(code).not.toContain('ses.send_email');
      expect(code).not.toContain('send_email_notification');
    });

    test('Lambda code should use DynamoDB, S3, and CloudWatch', () => {
      const code = lambda.Properties.Code.ZipFile;
      expect(code).toContain("boto3.resource('dynamodb')");
      expect(code).toContain("boto3.client('s3')");
      expect(code).toContain("boto3.client('cloudwatch')");
    });
  });

  describe('API Gateway - FeedbackApi', () => {
    let api: any;

    beforeAll(() => {
      api = template.Resources.FeedbackApi;
    });

    test('should exist and be a REST API', () => {
      expect(api).toBeDefined();
      expect(api.Type).toBe('AWS::ApiGateway::RestApi');
    });

    test('should have dynamic name', () => {
      expect(api.Properties.Name).toEqual({
        'Fn::Sub': 'FeedbackAPI-${EnvironmentSuffix}'
      });
    });

    test('should use REGIONAL endpoint', () => {
      expect(api.Properties.EndpointConfiguration).toBeDefined();
      expect(api.Properties.EndpointConfiguration.Types).toContain('REGIONAL');
    });
  });

  describe('API Gateway - Request Validator and Model', () => {
    test('should have ApiRequestValidator', () => {
      const validator = template.Resources.ApiRequestValidator;
      expect(validator).toBeDefined();
      expect(validator.Type).toBe('AWS::ApiGateway::RequestValidator');
      expect(validator.Properties.ValidateRequestBody).toBe(true);
    });

    test('should have FeedbackModel with required fields', () => {
      const model = template.Resources.FeedbackModel;
      expect(model).toBeDefined();
      expect(model.Type).toBe('AWS::ApiGateway::Model');
      
      const schema = model.Properties.Schema;
      expect(schema.required).toContain('feedback');
      expect(schema.required).toContain('userEmail');
      expect(schema.required).toContain('category');
    });

    test('FeedbackModel should have category enum', () => {
      const model = template.Resources.FeedbackModel;
      const schema = model.Properties.Schema;
      const categoryProp = schema.properties.category;
      expect(categoryProp.enum).toEqual(['general', 'bug', 'feature', 'improvement']);
    });
  });

  describe('API Gateway - Resource and Method', () => {
    test('should have FeedbackResource', () => {
      const resource = template.Resources.FeedbackResource;
      expect(resource).toBeDefined();
      expect(resource.Type).toBe('AWS::ApiGateway::Resource');
      expect(resource.Properties.PathPart).toBe('feedback');
    });

    test('should have FeedbackMethod as POST', () => {
      const method = template.Resources.FeedbackMethod;
      expect(method).toBeDefined();
      expect(method.Type).toBe('AWS::ApiGateway::Method');
      expect(method.Properties.HttpMethod).toBe('POST');
      expect(method.Properties.AuthorizationType).toBe('NONE');
    });

    test('FeedbackMethod should have AWS_PROXY integration', () => {
      const method = template.Resources.FeedbackMethod;
      expect(method.Properties.Integration.Type).toBe('AWS_PROXY');
      expect(method.Properties.Integration.IntegrationHttpMethod).toBe('POST');
    });

    test('should have ApiDeployment', () => {
      const deployment = template.Resources.ApiDeployment;
      expect(deployment).toBeDefined();
      expect(deployment.Type).toBe('AWS::ApiGateway::Deployment');
      expect(deployment.DependsOn).toContain('FeedbackMethod');
    });
  });

  describe('EventBridge - WeeklyReportSchedule', () => {
    let rule: any;

    beforeAll(() => {
      rule = template.Resources.WeeklyReportSchedule;
    });

    test('should exist and be an Events Rule', () => {
      expect(rule).toBeDefined();
      expect(rule.Type).toBe('AWS::Events::Rule');
    });

    test('should have correct cron schedule (Monday 9 AM UTC)', () => {
      expect(rule.Properties.ScheduleExpression).toBe('cron(0 9 ? * MON *)');
    });

    test('should be enabled', () => {
      expect(rule.Properties.State).toBe('ENABLED');
    });

    test('should target ReportGeneratorFunction', () => {
      const targets = rule.Properties.Targets;
      expect(Array.isArray(targets)).toBe(true);
      expect(targets.length).toBe(1);
      expect(targets[0].Arn).toEqual({
        'Fn::GetAtt': ['ReportGeneratorFunction', 'Arn']
      });
    });
  });

  describe('Lambda Permissions', () => {
    test('should have ApiGatewayInvokePermission', () => {
      const permission = template.Resources.ApiGatewayInvokePermission;
      expect(permission).toBeDefined();
      expect(permission.Type).toBe('AWS::Lambda::Permission');
      expect(permission.Properties.Action).toBe('lambda:InvokeFunction');
      expect(permission.Properties.Principal).toBe('apigateway.amazonaws.com');
    });

    test('should have EventBridgeInvokePermission', () => {
      const permission = template.Resources.EventBridgeInvokePermission;
      expect(permission).toBeDefined();
      expect(permission.Type).toBe('AWS::Lambda::Permission');
      expect(permission.Properties.Action).toBe('lambda:InvokeFunction');
      expect(permission.Properties.Principal).toBe('events.amazonaws.com');
    });
  });

  describe('CloudWatch Alarms', () => {
    test('should have 4 CloudWatch alarms', () => {
      const alarms = Object.keys(template.Resources).filter(
        key => template.Resources[key].Type === 'AWS::CloudWatch::Alarm'
      );
      expect(alarms.length).toBe(4);
    });

    test('should have FeedbackProcessorErrorAlarm', () => {
      const alarm = template.Resources.FeedbackProcessorErrorAlarm;
      expect(alarm).toBeDefined();
      expect(alarm.Properties.MetricName).toBe('Errors');
      expect(alarm.Properties.Threshold).toBe(5);
    });

    test('should have ReportGeneratorErrorAlarm', () => {
      const alarm = template.Resources.ReportGeneratorErrorAlarm;
      expect(alarm).toBeDefined();
      expect(alarm.Properties.Threshold).toBe(1);
    });

    test('should have ApiGateway4xxAlarm and ApiGateway5xxAlarm', () => {
      expect(template.Resources.ApiGateway4xxAlarm).toBeDefined();
      expect(template.Resources.ApiGateway5xxAlarm).toBeDefined();
    });
  });

  describe('CloudWatch Log Groups', () => {
    test('should have 2 log groups with 7-day retention', () => {
      const feedbackLog = template.Resources.FeedbackProcessorLogGroup;
      const reportLog = template.Resources.ReportGeneratorLogGroup;

      expect(feedbackLog).toBeDefined();
      expect(feedbackLog.Type).toBe('AWS::Logs::LogGroup');
      expect(feedbackLog.Properties.RetentionInDays).toBe(7);

      expect(reportLog).toBeDefined();
      expect(reportLog.Type).toBe('AWS::Logs::LogGroup');
      expect(reportLog.Properties.RetentionInDays).toBe(7);
    });
  });

  describe('Outputs', () => {
    test('should have 8 outputs', () => {
      expect(Object.keys(template.Outputs).length).toBe(8);
    });

    test('should have all required outputs with exports', () => {
      const expectedOutputs = [
        'TurnAroundPromptTableName',
        'TurnAroundPromptTableArn',
        'ApiEndpoint',
        'ReportsBucketName',
        'FeedbackProcessorFunctionArn',
        'ReportGeneratorFunctionArn',
        'StackName',
        'EnvironmentSuffix'
      ];

      expectedOutputs.forEach(outputKey => {
        const output = template.Outputs[outputKey];
        expect(output).toBeDefined();
        expect(output.Export).toBeDefined();
        expect(output.Export.Name).toBeDefined();
      });
    });

    test('ApiEndpoint should have correct URL structure', () => {
      const output = template.Outputs.ApiEndpoint;
      expect(output.Value['Fn::Sub']).toContain('execute-api');
      expect(output.Value['Fn::Sub']).toContain('feedback');
    });
  });

  describe('LocalStack Compatibility', () => {
    test('should not use Comprehend service', () => {
      const templateStr = JSON.stringify(template);
      expect(templateStr).not.toContain('comprehend');
      expect(templateStr).not.toContain('Comprehend');
    });

    test('should not use SES service', () => {
      const templateStr = JSON.stringify(template);
      expect(templateStr).not.toContain('"ses:');
      expect(templateStr).not.toContain('SendEmail');
    });

    test('should only use LocalStack-supported resource types', () => {
      const supportedTypes = [
        'AWS::DynamoDB::Table',
        'AWS::S3::Bucket',
        'AWS::IAM::Role',
        'AWS::Lambda::Function',
        'AWS::Lambda::Permission',
        'AWS::ApiGateway::RestApi',
        'AWS::ApiGateway::Resource',
        'AWS::ApiGateway::Method',
        'AWS::ApiGateway::Deployment',
        'AWS::ApiGateway::RequestValidator',
        'AWS::ApiGateway::Model',
        'AWS::Events::Rule',
        'AWS::CloudWatch::Alarm',
        'AWS::Logs::LogGroup'
      ];

      Object.keys(template.Resources).forEach(resourceKey => {
        const resource = template.Resources[resourceKey];
        expect(supportedTypes).toContain(resource.Type);
      });
    });

    test('all Lambda functions should use python3.10 runtime', () => {
      const lambdaFunctions = Object.keys(template.Resources).filter(
        key => template.Resources[key].Type === 'AWS::Lambda::Function'
      );

      lambdaFunctions.forEach(funcKey => {
        const func = template.Resources[funcKey];
        expect(func.Properties.Runtime).toBe('python3.10');
      });
    });

    test('all resources should have proper tags', () => {
      const resourcesWithTags = [
        'TurnAroundPromptTable',
        'ReportsBucket',
        'FeedbackProcessorRole',
        'ReportGeneratorRole',
        'FeedbackProcessorFunction',
        'ReportGeneratorFunction',
        'FeedbackApi'
      ];

      resourcesWithTags.forEach(resourceKey => {
        const resource = template.Resources[resourceKey];
        expect(resource.Properties.Tags).toBeDefined();
        const iamTag = resource.Properties.Tags.find((t: any) => t.Key === 'iac-rlhf-amazon');
        expect(iamTag).toBeDefined();
        expect(iamTag.Value).toBe('true');
      });
    });
  });
});
