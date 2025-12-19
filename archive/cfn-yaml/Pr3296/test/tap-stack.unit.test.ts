import fs from 'fs';
import path from 'path';

const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';

describe('Event-Driven Delivery App CloudFormation Template', () => {
  let template: any;

  beforeAll(() => {
    // Read the JSON CloudFormation template
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
      expect(template.Description).toBe(
        'Event-driven delivery app infrastructure with S3, Lambda, EventBridge, DynamoDB, and CloudWatch'
      );
    });
  });

  describe('Parameters', () => {
    test('should have Environment parameter', () => {
      expect(template.Parameters.Environment).toBeDefined();
      expect(template.Parameters.Environment.Type).toBe('String');
      expect(template.Parameters.Environment.Default).toBe('dev');
      expect(template.Parameters.Environment.Description).toBe('Environment name');
    });

    test('should have EnvironmentSuffix parameter', () => {
      expect(template.Parameters.EnvironmentSuffix).toBeDefined();
      expect(template.Parameters.EnvironmentSuffix.Type).toBe('String');
      expect(template.Parameters.EnvironmentSuffix.Default).toBe('dev');
      expect(template.Parameters.EnvironmentSuffix.Description).toBe(
        'Environment suffix to ensure unique resource names'
      );
    });
  });

  describe('Resources', () => {
    describe('S3 Bucket', () => {
      test('should have OrderUploadBucket resource', () => {
        expect(template.Resources.OrderUploadBucket).toBeDefined();
      });

      test('OrderUploadBucket should be an S3 bucket', () => {
        const bucket = template.Resources.OrderUploadBucket;
        expect(bucket.Type).toBe('AWS::S3::Bucket');
      });

      test('OrderUploadBucket should have correct properties', () => {
        const bucket = template.Resources.OrderUploadBucket;
        const properties = bucket.Properties;

        expect(properties.BucketName).toEqual({
          'Fn::Sub': 'delivery-app-orders-${EnvironmentSuffix}-${AWS::AccountId}',
        });
        expect(properties.BucketEncryption).toBeDefined();
        expect(properties.BucketEncryption.ServerSideEncryptionConfiguration[0].ServerSideEncryptionByDefault.SSEAlgorithm).toBe('AES256');
        expect(properties.VersioningConfiguration.Status).toBe('Enabled');
        expect(properties.PublicAccessBlockConfiguration.BlockPublicAcls).toBe(true);
        expect(properties.PublicAccessBlockConfiguration.BlockPublicPolicy).toBe(true);
        expect(properties.PublicAccessBlockConfiguration.IgnorePublicAcls).toBe(true);
        expect(properties.PublicAccessBlockConfiguration.RestrictPublicBuckets).toBe(true);
        expect(properties.NotificationConfiguration.EventBridgeConfiguration.EventBridgeEnabled).toBe(true);
      });
    });

    describe('DynamoDB Table', () => {
      test('should have ProcessedOrdersTable resource', () => {
        expect(template.Resources.ProcessedOrdersTable).toBeDefined();
      });

      test('ProcessedOrdersTable should be a DynamoDB table', () => {
        const table = template.Resources.ProcessedOrdersTable;
        expect(table.Type).toBe('AWS::DynamoDB::Table');
      });

      test('ProcessedOrdersTable should have correct properties', () => {
        const table = template.Resources.ProcessedOrdersTable;
        const properties = table.Properties;

        expect(properties.TableName).toEqual({
          'Fn::Sub': 'delivery-orders-${EnvironmentSuffix}',
        });
        expect(properties.BillingMode).toBe('PAY_PER_REQUEST');
        expect(properties.PointInTimeRecoverySpecification.PointInTimeRecoveryEnabled).toBe(false);
      });

      test('ProcessedOrdersTable should have correct attribute definitions', () => {
        const table = template.Resources.ProcessedOrdersTable;
        const attributeDefinitions = table.Properties.AttributeDefinitions;

        expect(attributeDefinitions).toHaveLength(2);
        expect(attributeDefinitions[0].AttributeName).toBe('orderId');
        expect(attributeDefinitions[0].AttributeType).toBe('S');
        expect(attributeDefinitions[1].AttributeName).toBe('processedTimestamp');
        expect(attributeDefinitions[1].AttributeType).toBe('N');
      });

      test('ProcessedOrdersTable should have correct key schema', () => {
        const table = template.Resources.ProcessedOrdersTable;
        const keySchema = table.Properties.KeySchema;

        expect(keySchema).toHaveLength(1);
        expect(keySchema[0].AttributeName).toBe('orderId');
        expect(keySchema[0].KeyType).toBe('HASH');
      });

      test('ProcessedOrdersTable should have Global Secondary Index', () => {
        const table = template.Resources.ProcessedOrdersTable;
        const gsi = table.Properties.GlobalSecondaryIndexes;

        expect(gsi).toHaveLength(1);
        expect(gsi[0].IndexName).toBe('ProcessedTimestampIndex');
        expect(gsi[0].KeySchema[0].AttributeName).toBe('processedTimestamp');
        expect(gsi[0].KeySchema[0].KeyType).toBe('HASH');
        expect(gsi[0].Projection.ProjectionType).toBe('ALL');
      });
    });

    describe('Lambda Function', () => {
      test('should have OrderProcessorFunction resource', () => {
        expect(template.Resources.OrderProcessorFunction).toBeDefined();
      });

      test('OrderProcessorFunction should be a Lambda function', () => {
        const lambda = template.Resources.OrderProcessorFunction;
        expect(lambda.Type).toBe('AWS::Lambda::Function');
      });

      test('OrderProcessorFunction should have correct properties', () => {
        const lambda = template.Resources.OrderProcessorFunction;
        const properties = lambda.Properties;

        expect(properties.FunctionName).toEqual({
          'Fn::Sub': 'order-processor-${EnvironmentSuffix}',
        });
        expect(properties.Runtime).toBe('python3.11');
        expect(properties.Handler).toBe('index.handler');
        expect(properties.MemorySize).toBe(512);
        expect(properties.Timeout).toBe(60);
        expect(properties.TracingConfig.Mode).toBe('Active');
      });

      test('OrderProcessorFunction should have environment variables', () => {
        const lambda = template.Resources.OrderProcessorFunction;
        const envVars = lambda.Properties.Environment.Variables;

        expect(envVars.DYNAMODB_TABLE).toEqual({ Ref: 'ProcessedOrdersTable' });
        expect(envVars.ENVIRONMENT).toEqual({ Ref: 'Environment' });
        expect(envVars.METRICS_NAMESPACE).toBe('DeliveryApp/OrderProcessing');
      });

      test('OrderProcessorFunction should have inline code', () => {
        const lambda = template.Resources.OrderProcessorFunction;
        expect(lambda.Properties.Code.ZipFile).toBeDefined();
        expect(lambda.Properties.Code.ZipFile).toContain('import json');
        expect(lambda.Properties.Code.ZipFile).toContain('import boto3');
        expect(lambda.Properties.Code.ZipFile).toContain('def handler(event, context):');
      });
    });

    describe('IAM Role', () => {
      test('should have OrderProcessorLambdaRole resource', () => {
        expect(template.Resources.OrderProcessorLambdaRole).toBeDefined();
      });

      test('OrderProcessorLambdaRole should be an IAM role', () => {
        const role = template.Resources.OrderProcessorLambdaRole;
        expect(role.Type).toBe('AWS::IAM::Role');
      });

      test('OrderProcessorLambdaRole should have correct role name', () => {
        const role = template.Resources.OrderProcessorLambdaRole;
        expect(role.Properties.RoleName).toEqual({
          'Fn::Sub': 'order-processor-role-${EnvironmentSuffix}',
        });
      });

      test('OrderProcessorLambdaRole should have correct assume role policy', () => {
        const role = template.Resources.OrderProcessorLambdaRole;
        const assumeRolePolicy = role.Properties.AssumeRolePolicyDocument;

        expect(assumeRolePolicy.Version).toBe('2012-10-17');
        expect(assumeRolePolicy.Statement[0].Effect).toBe('Allow');
        expect(assumeRolePolicy.Statement[0].Principal.Service).toBe('lambda.amazonaws.com');
        expect(assumeRolePolicy.Statement[0].Action).toBe('sts:AssumeRole');
      });

      test('OrderProcessorLambdaRole should have managed policies', () => {
        const role = template.Resources.OrderProcessorLambdaRole;
        expect(role.Properties.ManagedPolicyArns).toContain(
          'arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole'
        );
      });

      test('OrderProcessorLambdaRole should have inline policies for S3, DynamoDB, and CloudWatch', () => {
        const role = template.Resources.OrderProcessorLambdaRole;
        const policy = role.Properties.Policies[0];

        expect(policy.PolicyName).toBe('OrderProcessorPolicy');
        const statement = policy.PolicyDocument.Statement;

        // S3 permissions
        const s3Statement = statement.find((s: any) => s.Action.includes('s3:GetObject'));
        expect(s3Statement).toBeDefined();
        expect(s3Statement.Effect).toBe('Allow');

        // DynamoDB permissions
        const dynamoStatement = statement.find((s: any) => s.Action.includes('dynamodb:PutItem'));
        expect(dynamoStatement).toBeDefined();
        expect(dynamoStatement.Effect).toBe('Allow');

        // CloudWatch permissions
        const cwStatement = statement.find((s: any) => s.Action.includes('cloudwatch:PutMetricData'));
        expect(cwStatement).toBeDefined();
        expect(cwStatement.Effect).toBe('Allow');
      });
    });

    describe('EventBridge Rule', () => {
      test('should have OrderUploadEventRule resource', () => {
        expect(template.Resources.OrderUploadEventRule).toBeDefined();
      });

      test('OrderUploadEventRule should be an EventBridge rule', () => {
        const rule = template.Resources.OrderUploadEventRule;
        expect(rule.Type).toBe('AWS::Events::Rule');
      });

      test('OrderUploadEventRule should have correct properties', () => {
        const rule = template.Resources.OrderUploadEventRule;
        const properties = rule.Properties;

        expect(properties.Name).toEqual({
          'Fn::Sub': 'order-upload-rule-${EnvironmentSuffix}',
        });
        expect(properties.Description).toBe('Trigger Lambda when new order files are uploaded to S3');
        expect(properties.State).toBe('ENABLED');
      });

      test('OrderUploadEventRule should have correct event pattern', () => {
        const rule = template.Resources.OrderUploadEventRule;
        const eventPattern = rule.Properties.EventPattern;

        expect(eventPattern.source).toEqual(['aws.s3']);
        expect(eventPattern['detail-type']).toEqual(['Object Created']);
        expect(eventPattern.detail.bucket.name).toEqual([{ Ref: 'OrderUploadBucket' }]);
        expect(eventPattern.detail.object.key).toEqual([{ prefix: 'orders/' }]);
      });

      test('OrderUploadEventRule should have Lambda target', () => {
        const rule = template.Resources.OrderUploadEventRule;
        const targets = rule.Properties.Targets;

        expect(targets).toHaveLength(1);
        expect(targets[0].Id).toBe('OrderProcessorTarget');
        expect(targets[0].Arn).toEqual({
          'Fn::GetAtt': ['OrderProcessorFunction', 'Arn'],
        });
        expect(targets[0].RetryPolicy.MaximumRetryAttempts).toBe(2);
      });
    });

    describe('Lambda Invoke Permission', () => {
      test('should have LambdaInvokePermission resource', () => {
        expect(template.Resources.LambdaInvokePermission).toBeDefined();
      });

      test('LambdaInvokePermission should be a Lambda permission', () => {
        const permission = template.Resources.LambdaInvokePermission;
        expect(permission.Type).toBe('AWS::Lambda::Permission');
      });

      test('LambdaInvokePermission should have correct properties', () => {
        const permission = template.Resources.LambdaInvokePermission;
        const properties = permission.Properties;

        expect(properties.FunctionName).toEqual({ Ref: 'OrderProcessorFunction' });
        expect(properties.Action).toBe('lambda:InvokeFunction');
        expect(properties.Principal).toBe('events.amazonaws.com');
        expect(properties.SourceArn).toEqual({
          'Fn::GetAtt': ['OrderUploadEventRule', 'Arn'],
        });
      });
    });

    describe('CloudWatch Dashboard', () => {
      test('should have OrderProcessingDashboard resource', () => {
        expect(template.Resources.OrderProcessingDashboard).toBeDefined();
      });

      test('OrderProcessingDashboard should be a CloudWatch dashboard', () => {
        const dashboard = template.Resources.OrderProcessingDashboard;
        expect(dashboard.Type).toBe('AWS::CloudWatch::Dashboard');
      });

      test('OrderProcessingDashboard should have correct dashboard name', () => {
        const dashboard = template.Resources.OrderProcessingDashboard;
        expect(dashboard.Properties.DashboardName).toEqual({
          'Fn::Sub': 'delivery-app-orders-${EnvironmentSuffix}',
        });
      });

      test('OrderProcessingDashboard should have dashboard body', () => {
        const dashboard = template.Resources.OrderProcessingDashboard;
        expect(dashboard.Properties.DashboardBody).toBeDefined();
        const bodyStr = dashboard.Properties.DashboardBody['Fn::Sub'];
        expect(bodyStr).toContain('widgets');
        expect(bodyStr).toContain('DeliveryApp/OrderProcessing');
        expect(bodyStr).toContain('OrdersProcessed');
        expect(bodyStr).toContain('ProcessingTime');
        expect(bodyStr).toContain('SuccessRate');
      });
    });

    describe('CloudWatch Alarms', () => {
      test('should have HighErrorRateAlarm resource', () => {
        expect(template.Resources.HighErrorRateAlarm).toBeDefined();
      });

      test('HighErrorRateAlarm should be a CloudWatch alarm', () => {
        const alarm = template.Resources.HighErrorRateAlarm;
        expect(alarm.Type).toBe('AWS::CloudWatch::Alarm');
      });

      test('HighErrorRateAlarm should have correct properties', () => {
        const alarm = template.Resources.HighErrorRateAlarm;
        const properties = alarm.Properties;

        expect(properties.AlarmName).toEqual({
          'Fn::Sub': 'delivery-app-high-error-rate-${EnvironmentSuffix}',
        });
        expect(properties.MetricName).toBe('OrderProcessingErrors');
        expect(properties.Namespace).toBe('DeliveryApp/OrderProcessing');
        expect(properties.Statistic).toBe('Sum');
        expect(properties.Period).toBe(300);
        expect(properties.EvaluationPeriods).toBe(2);
        expect(properties.Threshold).toBe(10);
        expect(properties.ComparisonOperator).toBe('GreaterThanThreshold');
      });

      test('should have ProcessingFailureAlarm resource', () => {
        expect(template.Resources.ProcessingFailureAlarm).toBeDefined();
      });

      test('ProcessingFailureAlarm should be a CloudWatch alarm', () => {
        const alarm = template.Resources.ProcessingFailureAlarm;
        expect(alarm.Type).toBe('AWS::CloudWatch::Alarm');
      });

      test('ProcessingFailureAlarm should have correct properties', () => {
        const alarm = template.Resources.ProcessingFailureAlarm;
        const properties = alarm.Properties;

        expect(properties.AlarmName).toEqual({
          'Fn::Sub': 'delivery-app-processing-failures-${EnvironmentSuffix}',
        });
        expect(properties.MetricName).toBe('ProcessingFailures');
        expect(properties.Namespace).toBe('DeliveryApp/OrderProcessing');
        expect(properties.Statistic).toBe('Sum');
        expect(properties.Period).toBe(60);
        expect(properties.EvaluationPeriods).toBe(1);
        expect(properties.Threshold).toBe(1);
        expect(properties.ComparisonOperator).toBe('GreaterThanOrEqualToThreshold');
      });
    });
  });

  describe('Outputs', () => {
    test('should have all required outputs', () => {
      const expectedOutputs = [
        'S3BucketName',
        'DynamoDBTableName',
        'LambdaFunctionArn',
        'DashboardURL',
      ];

      expectedOutputs.forEach(outputName => {
        expect(template.Outputs[outputName]).toBeDefined();
      });
    });

    test('S3BucketName output should be correct', () => {
      const output = template.Outputs.S3BucketName;
      expect(output.Description).toBe('S3 bucket for order uploads');
      expect(output.Value).toEqual({ Ref: 'OrderUploadBucket' });
      expect(output.Export.Name).toEqual({
        'Fn::Sub': '${AWS::StackName}-bucket',
      });
    });

    test('DynamoDBTableName output should be correct', () => {
      const output = template.Outputs.DynamoDBTableName;
      expect(output.Description).toBe('DynamoDB table for processed orders');
      expect(output.Value).toEqual({ Ref: 'ProcessedOrdersTable' });
      expect(output.Export.Name).toEqual({
        'Fn::Sub': '${AWS::StackName}-table',
      });
    });

    test('LambdaFunctionArn output should be correct', () => {
      const output = template.Outputs.LambdaFunctionArn;
      expect(output.Description).toBe('Order processor Lambda function ARN');
      expect(output.Value).toEqual({
        'Fn::GetAtt': ['OrderProcessorFunction', 'Arn'],
      });
      expect(output.Export.Name).toEqual({
        'Fn::Sub': '${AWS::StackName}-lambda',
      });
    });

    test('DashboardURL output should be correct', () => {
      const output = template.Outputs.DashboardURL;
      expect(output.Description).toBe('CloudWatch Dashboard URL');
      expect(output.Value['Fn::Sub']).toContain('cloudwatch');
      expect(output.Value['Fn::Sub']).toContain('dashboards');
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

    test('should have correct number of resources', () => {
      const resourceCount = Object.keys(template.Resources).length;
      expect(resourceCount).toBe(9); // 9 resources total
    });

    test('should have correct number of parameters', () => {
      const parameterCount = Object.keys(template.Parameters).length;
      expect(parameterCount).toBe(2); // Environment and EnvironmentSuffix
    });

    test('should have correct number of outputs', () => {
      const outputCount = Object.keys(template.Outputs).length;
      expect(outputCount).toBe(4); // S3, DynamoDB, Lambda, Dashboard
    });
  });

  describe('Resource Naming Convention', () => {
    test('all resources should use EnvironmentSuffix', () => {
      const bucket = template.Resources.OrderUploadBucket.Properties.BucketName;
      const table = template.Resources.ProcessedOrdersTable.Properties.TableName;
      const lambda = template.Resources.OrderProcessorFunction.Properties.FunctionName;
      const role = template.Resources.OrderProcessorLambdaRole.Properties.RoleName;
      const rule = template.Resources.OrderUploadEventRule.Properties.Name;
      const dashboard = template.Resources.OrderProcessingDashboard.Properties.DashboardName;
      const highAlarm = template.Resources.HighErrorRateAlarm.Properties.AlarmName;
      const failureAlarm = template.Resources.ProcessingFailureAlarm.Properties.AlarmName;

      expect(bucket['Fn::Sub']).toContain('${EnvironmentSuffix}');
      expect(table['Fn::Sub']).toContain('${EnvironmentSuffix}');
      expect(lambda['Fn::Sub']).toContain('${EnvironmentSuffix}');
      expect(role['Fn::Sub']).toContain('${EnvironmentSuffix}');
      expect(rule['Fn::Sub']).toContain('${EnvironmentSuffix}');
      expect(dashboard['Fn::Sub']).toContain('${EnvironmentSuffix}');
      expect(highAlarm['Fn::Sub']).toContain('${EnvironmentSuffix}');
      expect(failureAlarm['Fn::Sub']).toContain('${EnvironmentSuffix}');
    });

    test('export names should follow naming convention', () => {
      const outputs = ['S3BucketName', 'DynamoDBTableName', 'LambdaFunctionArn'];
      outputs.forEach(outputKey => {
        const output = template.Outputs[outputKey];
        expect(output.Export.Name['Fn::Sub']).toContain('${AWS::StackName}');
      });
    });
  });

  describe('Security Configuration', () => {
    test('S3 bucket should have encryption enabled', () => {
      const bucket = template.Resources.OrderUploadBucket.Properties;
      expect(bucket.BucketEncryption).toBeDefined();
      expect(bucket.BucketEncryption.ServerSideEncryptionConfiguration[0].ServerSideEncryptionByDefault.SSEAlgorithm).toBe('AES256');
    });

    test('S3 bucket should have public access blocked', () => {
      const bucket = template.Resources.OrderUploadBucket.Properties;
      const publicAccess = bucket.PublicAccessBlockConfiguration;
      expect(publicAccess.BlockPublicAcls).toBe(true);
      expect(publicAccess.BlockPublicPolicy).toBe(true);
      expect(publicAccess.IgnorePublicAcls).toBe(true);
      expect(publicAccess.RestrictPublicBuckets).toBe(true);
    });

    test('S3 bucket should have versioning enabled', () => {
      const bucket = template.Resources.OrderUploadBucket.Properties;
      expect(bucket.VersioningConfiguration.Status).toBe('Enabled');
    });

    test('Lambda function should have X-Ray tracing enabled', () => {
      const lambda = template.Resources.OrderProcessorFunction.Properties;
      expect(lambda.TracingConfig.Mode).toBe('Active');
    });

    test('IAM role should follow principle of least privilege', () => {
      const role = template.Resources.OrderProcessorLambdaRole.Properties;
      const statements = role.Policies[0].PolicyDocument.Statement;

      // Check that S3 permissions are scoped to specific bucket
      const s3Statement = statements.find((s: any) => s.Action.includes('s3:GetObject'));
      expect(s3Statement.Resource['Fn::Sub']).toContain('${OrderUploadBucket.Arn}');

      // Check that DynamoDB permissions are scoped to specific table
      const dynamoStatement = statements.find((s: any) => s.Action.includes('dynamodb:PutItem'));
      expect(dynamoStatement.Resource).toBeDefined();
    });
  });
});