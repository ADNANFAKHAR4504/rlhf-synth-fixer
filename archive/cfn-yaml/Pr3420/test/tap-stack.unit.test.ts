import fs from 'fs';
import path from 'path';

const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';

describe('Inventory Processing CloudFormation Template', () => {
  let template: any;

  beforeAll(() => {
    // Load the JSON version of the CloudFormation template
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
      expect(template.Description).toBe('Serverless Event-Driven Inventory Processing System');
    });

    test('should have required top-level sections', () => {
      expect(template.Parameters).toBeDefined();
      expect(template.Resources).toBeDefined();
      expect(template.Outputs).toBeDefined();
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
      expect(envSuffixParam.Description).toBe('Environment suffix for resource naming');
      expect(envSuffixParam.AllowedPattern).toBe('^[a-zA-Z0-9]+$');
    });
  });

  describe('S3 Bucket Resource', () => {
    test('should have InventoryBucket resource', () => {
      expect(template.Resources.InventoryBucket).toBeDefined();
    });

    test('InventoryBucket should be an S3 bucket with correct properties', () => {
      const bucket = template.Resources.InventoryBucket;
      expect(bucket.Type).toBe('AWS::S3::Bucket');

      const properties = bucket.Properties;
      expect(properties.BucketName).toEqual({
        'Fn::Sub': 'inventory-uploads-${EnvironmentSuffix}-${AWS::AccountId}'
      });
      expect(properties.VersioningConfiguration.Status).toBe('Enabled');
      expect(properties.PublicAccessBlockConfiguration.BlockPublicAcls).toBe(true);
      expect(properties.PublicAccessBlockConfiguration.BlockPublicPolicy).toBe(true);
      expect(properties.PublicAccessBlockConfiguration.IgnorePublicAcls).toBe(true);
      expect(properties.PublicAccessBlockConfiguration.RestrictPublicBuckets).toBe(true);
      expect(properties.NotificationConfiguration.EventBridgeConfiguration.EventBridgeEnabled).toBe(true);
    });

    test('InventoryBucket should have proper tags', () => {
      const bucket = template.Resources.InventoryBucket;
      const tags = bucket.Properties.Tags;
      expect(tags).toBeDefined();
      expect(tags).toContainEqual({
        Key: 'Environment',
        Value: { Ref: 'EnvironmentSuffix' }
      });
      expect(tags).toContainEqual({
        Key: 'Purpose',
        Value: 'InventoryProcessing'
      });
    });
  });

  describe('DynamoDB Table Resource', () => {
    test('should have InventoryTable resource', () => {
      expect(template.Resources.InventoryTable).toBeDefined();
    });

    test('InventoryTable should be a DynamoDB table with correct properties', () => {
      const table = template.Resources.InventoryTable;
      expect(table.Type).toBe('AWS::DynamoDB::Table');
      expect(table.DeletionPolicy).toBe('Delete');
      expect(table.UpdateReplacePolicy).toBe('Delete');

      const properties = table.Properties;
      expect(properties.TableName).toEqual({
        'Fn::Sub': 'InventoryData-${EnvironmentSuffix}'
      });
      expect(properties.BillingMode).toBe('PAY_PER_REQUEST');
      expect(properties.StreamSpecification.StreamViewType).toBe('NEW_AND_OLD_IMAGES');
    });

    test('InventoryTable should have correct attribute definitions', () => {
      const table = template.Resources.InventoryTable;
      const attributeDefinitions = table.Properties.AttributeDefinitions;

      expect(attributeDefinitions).toHaveLength(2);
      expect(attributeDefinitions).toContainEqual({
        AttributeName: 'itemId',
        AttributeType: 'S'
      });
      expect(attributeDefinitions).toContainEqual({
        AttributeName: 'timestamp',
        AttributeType: 'N'
      });
    });

    test('InventoryTable should have correct key schema', () => {
      const table = template.Resources.InventoryTable;
      const keySchema = table.Properties.KeySchema;

      expect(keySchema).toHaveLength(2);
      expect(keySchema).toContainEqual({
        AttributeName: 'itemId',
        KeyType: 'HASH'
      });
      expect(keySchema).toContainEqual({
        AttributeName: 'timestamp',
        KeyType: 'RANGE'
      });
    });
  });

  describe('Lambda Function Resource', () => {
    test('should have InventoryProcessorFunction resource', () => {
      expect(template.Resources.InventoryProcessorFunction).toBeDefined();
    });

    test('InventoryProcessorFunction should have correct properties', () => {
      const lambda = template.Resources.InventoryProcessorFunction;
      expect(lambda.Type).toBe('AWS::Lambda::Function');

      const properties = lambda.Properties;
      expect(properties.FunctionName).toEqual({
        'Fn::Sub': 'InventoryProcessor-${EnvironmentSuffix}'
      });
      expect(properties.Runtime).toBe('python3.10');
      expect(properties.Handler).toBe('index.lambda_handler');
      expect(properties.Timeout).toBe(60);
      expect(properties.MemorySize).toBe(512);
      expect(properties.Role).toEqual({
        'Fn::GetAtt': ['LambdaExecutionRole', 'Arn']
      });
    });

    test('InventoryProcessorFunction should have environment variables', () => {
      const lambda = template.Resources.InventoryProcessorFunction;
      const envVars = lambda.Properties.Environment.Variables;

      expect(envVars.DYNAMODB_TABLE).toEqual({ Ref: 'InventoryTable' });
      expect(envVars.ENVIRONMENT).toEqual({ Ref: 'EnvironmentSuffix' });
    });

    test('InventoryProcessorFunction should have inline code', () => {
      const lambda = template.Resources.InventoryProcessorFunction;
      expect(lambda.Properties.Code.ZipFile).toBeDefined();
      expect(lambda.Properties.Code.ZipFile).toContain('def lambda_handler');
      expect(lambda.Properties.Code.ZipFile).toContain('import boto3');
      expect(lambda.Properties.Code.ZipFile).toContain('cloudwatch.put_metric_data');
    });
  });

  describe('IAM Role Resource', () => {
    test('should have LambdaExecutionRole resource', () => {
      expect(template.Resources.LambdaExecutionRole).toBeDefined();
    });

    test('LambdaExecutionRole should have correct properties', () => {
      const role = template.Resources.LambdaExecutionRole;
      expect(role.Type).toBe('AWS::IAM::Role');

      const properties = role.Properties;
      expect(properties.RoleName).toEqual({
        'Fn::Sub': 'InventoryLambdaRole-${EnvironmentSuffix}'
      });
      expect(properties.ManagedPolicyArns).toContain(
        'arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole'
      );
    });

    test('LambdaExecutionRole should have correct assume role policy', () => {
      const role = template.Resources.LambdaExecutionRole;
      const assumeRolePolicy = role.Properties.AssumeRolePolicyDocument;

      expect(assumeRolePolicy.Version).toBe('2012-10-17');
      expect(assumeRolePolicy.Statement[0].Effect).toBe('Allow');
      expect(assumeRolePolicy.Statement[0].Principal.Service).toBe('lambda.amazonaws.com');
      expect(assumeRolePolicy.Statement[0].Action).toBe('sts:AssumeRole');
    });

    test('LambdaExecutionRole should have inventory processing policy', () => {
      const role = template.Resources.LambdaExecutionRole;
      const policy = role.Properties.Policies[0];

      expect(policy.PolicyName).toBe('InventoryProcessingPolicy');
      expect(policy.PolicyDocument.Version).toBe('2012-10-17');

      const statements = policy.PolicyDocument.Statement;

      // Check S3 permissions
      const s3Statement = statements.find((s: any) =>
        s.Action && s.Action.includes('s3:GetObject')
      );
      expect(s3Statement).toBeDefined();
      expect(s3Statement.Action).toContain('s3:GetObject');
      expect(s3Statement.Action).toContain('s3:ListBucket');

      // Check DynamoDB permissions
      const dynamoStatement = statements.find((s: any) =>
        s.Action && s.Action.includes('dynamodb:PutItem')
      );
      expect(dynamoStatement).toBeDefined();
      expect(dynamoStatement.Action).toContain('dynamodb:PutItem');
      expect(dynamoStatement.Action).toContain('dynamodb:UpdateItem');
      expect(dynamoStatement.Action).toContain('dynamodb:GetItem');
      expect(dynamoStatement.Action).toContain('dynamodb:Query');

      // Check CloudWatch permissions
      const cloudwatchStatement = statements.find((s: any) =>
        s.Action && s.Action.includes('cloudwatch:PutMetricData')
      );
      expect(cloudwatchStatement).toBeDefined();
    });
  });

  describe('EventBridge Resources', () => {
    test('should have S3UploadEventRule resource', () => {
      expect(template.Resources.S3UploadEventRule).toBeDefined();
    });

    test('S3UploadEventRule should have correct properties', () => {
      const rule = template.Resources.S3UploadEventRule;
      expect(rule.Type).toBe('AWS::Events::Rule');

      const properties = rule.Properties;
      expect(properties.Name).toEqual({
        'Fn::Sub': 'InventoryS3Upload-${EnvironmentSuffix}'
      });
      expect(properties.Description).toBe('Trigger Lambda on S3 inventory uploads');
      expect(properties.State).toBe('ENABLED');

      const eventPattern = properties.EventPattern;
      expect(eventPattern.source).toContain('aws.s3');
      expect(eventPattern['detail-type']).toContain('Object Created');
    });

    test('S3UploadEventRule should have Lambda target with retry policy', () => {
      const rule = template.Resources.S3UploadEventRule;
      const targets = rule.Properties.Targets;

      expect(targets).toHaveLength(1);
      expect(targets[0].Arn).toEqual({
        'Fn::GetAtt': ['InventoryProcessorFunction', 'Arn']
      });
      expect(targets[0].Id).toBe('InventoryProcessorTarget');
      expect(targets[0].RetryPolicy.MaximumRetryAttempts).toBe(2);
    });

    test('should have LambdaEventBridgePermission resource', () => {
      expect(template.Resources.LambdaEventBridgePermission).toBeDefined();

      const permission = template.Resources.LambdaEventBridgePermission;
      expect(permission.Type).toBe('AWS::Lambda::Permission');
      expect(permission.Properties.FunctionName).toEqual({ Ref: 'InventoryProcessorFunction' });
      expect(permission.Properties.Action).toBe('lambda:InvokeFunction');
      expect(permission.Properties.Principal).toBe('events.amazonaws.com');
    });
  });

  describe('CloudWatch Alarms', () => {
    test('should have LambdaErrorAlarm resource', () => {
      expect(template.Resources.LambdaErrorAlarm).toBeDefined();

      const alarm = template.Resources.LambdaErrorAlarm;
      expect(alarm.Type).toBe('AWS::CloudWatch::Alarm');

      const properties = alarm.Properties;
      expect(properties.AlarmName).toEqual({
        'Fn::Sub': 'InventoryProcessor-Errors-${EnvironmentSuffix}'
      });
      expect(properties.MetricName).toBe('Errors');
      expect(properties.Namespace).toBe('AWS/Lambda');
      expect(properties.Threshold).toBe(5);
      expect(properties.ComparisonOperator).toBe('GreaterThanThreshold');
    });

    test('should have LambdaDurationAlarm resource', () => {
      expect(template.Resources.LambdaDurationAlarm).toBeDefined();

      const alarm = template.Resources.LambdaDurationAlarm;
      expect(alarm.Type).toBe('AWS::CloudWatch::Alarm');

      const properties = alarm.Properties;
      expect(properties.AlarmName).toEqual({
        'Fn::Sub': 'InventoryProcessor-Duration-${EnvironmentSuffix}'
      });
      expect(properties.MetricName).toBe('Duration');
      expect(properties.Threshold).toBe(30000);
    });

    test('should have DynamoDBThrottleAlarm resource', () => {
      expect(template.Resources.DynamoDBThrottleAlarm).toBeDefined();

      const alarm = template.Resources.DynamoDBThrottleAlarm;
      expect(alarm.Type).toBe('AWS::CloudWatch::Alarm');

      const properties = alarm.Properties;
      expect(properties.AlarmName).toEqual({
        'Fn::Sub': 'InventoryTable-Throttles-${EnvironmentSuffix}'
      });
      expect(properties.MetricName).toBe('UserErrors');
      expect(properties.Namespace).toBe('AWS/DynamoDB');
    });
  });

  describe('EventBridge API Destination', () => {
    test('should have WebhookConnection resource', () => {
      expect(template.Resources.WebhookConnection).toBeDefined();

      const connection = template.Resources.WebhookConnection;
      expect(connection.Type).toBe('AWS::Events::Connection');
      expect(connection.Properties.AuthorizationType).toBe('API_KEY');
    });

    test('should have WebhookDestination resource', () => {
      expect(template.Resources.WebhookDestination).toBeDefined();

      const destination = template.Resources.WebhookDestination;
      expect(destination.Type).toBe('AWS::Events::ApiDestination');
      expect(destination.Properties.HttpMethod).toBe('POST');
      expect(destination.Properties.InvocationRateLimitPerSecond).toBe(10);
    });

    test('should have WebhookEventRule resource', () => {
      expect(template.Resources.WebhookEventRule).toBeDefined();

      const rule = template.Resources.WebhookEventRule;
      expect(rule.Type).toBe('AWS::Events::Rule');

      const eventPattern = rule.Properties.EventPattern;
      expect(eventPattern.source).toContain('inventory.processor');
      expect(eventPattern['detail-type']).toContain('Inventory Processing Complete');
    });

    test('should have WebhookRole resource', () => {
      expect(template.Resources.WebhookRole).toBeDefined();

      const role = template.Resources.WebhookRole;
      expect(role.Type).toBe('AWS::IAM::Role');

      const policy = role.Properties.Policies[0];
      expect(policy.PolicyName).toBe('InvokeApiDestinationPolicy');
      expect(policy.PolicyDocument.Statement[0].Action).toContain('events:InvokeApiDestination');
    });
  });

  describe('Outputs', () => {
    test('should have all required outputs', () => {
      const expectedOutputs = ['BucketName', 'TableName', 'FunctionArn', 'EventRuleArn'];

      expectedOutputs.forEach(outputName => {
        expect(template.Outputs[outputName]).toBeDefined();
      });
    });

    test('BucketName output should be correct', () => {
      const output = template.Outputs.BucketName;
      expect(output.Description).toBe('S3 Bucket for inventory uploads');
      expect(output.Value).toEqual({ Ref: 'InventoryBucket' });
      expect(output.Export.Name).toEqual({
        'Fn::Sub': '${AWS::StackName}-BucketName'
      });
    });

    test('TableName output should be correct', () => {
      const output = template.Outputs.TableName;
      expect(output.Description).toBe('DynamoDB table name');
      expect(output.Value).toEqual({ Ref: 'InventoryTable' });
      expect(output.Export.Name).toEqual({
        'Fn::Sub': '${AWS::StackName}-TableName'
      });
    });

    test('FunctionArn output should be correct', () => {
      const output = template.Outputs.FunctionArn;
      expect(output.Description).toBe('Lambda function ARN');
      expect(output.Value).toEqual({
        'Fn::GetAtt': ['InventoryProcessorFunction', 'Arn']
      });
      expect(output.Export.Name).toEqual({
        'Fn::Sub': '${AWS::StackName}-FunctionArn'
      });
    });

    test('EventRuleArn output should be correct', () => {
      const output = template.Outputs.EventRuleArn;
      expect(output.Description).toBe('EventBridge rule ARN');
      expect(output.Value).toEqual({
        'Fn::GetAtt': ['S3UploadEventRule', 'Arn']
      });
      expect(output.Export.Name).toEqual({
        'Fn::Sub': '${AWS::StackName}-EventRuleArn'
      });
    });
  });

  describe('Template Validation', () => {
    test('should have valid JSON structure', () => {
      expect(template).toBeDefined();
      expect(typeof template).toBe('object');
    });

    test('should not have undefined or null required sections', () => {
      expect(template.AWSTemplateFormatVersion).not.toBeNull();
      expect(template.Description).not.toBeNull();
      expect(template.Parameters).not.toBeNull();
      expect(template.Resources).not.toBeNull();
      expect(template.Outputs).not.toBeNull();
    });

    test('should have expected number of resources', () => {
      const resourceCount = Object.keys(template.Resources).length;
      expect(resourceCount).toBeGreaterThan(10); // We have many resources
    });

    test('all resources should follow naming convention with environment suffix', () => {
      const namedResources = [
        'InventoryBucket',
        'InventoryTable',
        'InventoryProcessorFunction',
        'LambdaExecutionRole',
        'S3UploadEventRule',
        'LambdaErrorAlarm',
        'LambdaDurationAlarm',
        'DynamoDBThrottleAlarm'
      ];

      namedResources.forEach(resourceName => {
        const resource = template.Resources[resourceName];
        if (resource && resource.Properties && (resource.Properties.Name ||
            resource.Properties.FunctionName || resource.Properties.TableName ||
            resource.Properties.BucketName || resource.Properties.RoleName ||
            resource.Properties.AlarmName)) {
          const nameProperty = resource.Properties.Name ||
                              resource.Properties.FunctionName ||
                              resource.Properties.TableName ||
                              resource.Properties.BucketName ||
                              resource.Properties.RoleName ||
                              resource.Properties.AlarmName;

          if (typeof nameProperty === 'object' && nameProperty['Fn::Sub']) {
            expect(nameProperty['Fn::Sub']).toContain('${EnvironmentSuffix}');
          }
        }
      });
    });
  });
});