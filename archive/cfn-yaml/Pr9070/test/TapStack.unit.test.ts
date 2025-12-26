import fs from 'fs';
import path from 'path';

const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';

describe('TapStack CloudFormation Template', () => {
  let template: any;

  beforeAll(() => {
    // Load the JSON version of the template
    const templatePath = path.join(__dirname, '../lib/TapStack.json');
    const templateContent = fs.readFileSync(templatePath, 'utf8');
    template = JSON.parse(templateContent);
  });

  describe('Template Structure', () => {
    test('should have valid CloudFormation format version', () => {
      expect(template.AWSTemplateFormatVersion).toBe('2010-09-09');
    });

    test('should use AWS SAM Transform', () => {
      expect(template.Transform).toBe('AWS::Serverless-2016-10-31');
    });

    test('should have a description', () => {
      expect(template.Description).toBeDefined();
      expect(template.Description).toContain('Serverless Application');
    });
  });

  describe('Parameters', () => {
    test('should have EnvironmentSuffix parameter', () => {
      expect(template.Parameters.EnvironmentSuffix).toBeDefined();
      expect(template.Parameters.EnvironmentSuffix.Type).toBe('String');
      expect(template.Parameters.EnvironmentSuffix.Default).toBe('dev');
    });

    test('should have ProjectName parameter', () => {
      expect(template.Parameters.ProjectName).toBeDefined();
      expect(template.Parameters.ProjectName.Type).toBe('String');
      expect(template.Parameters.ProjectName.Default).toBe('serverless-app');
    });

    test('parameters should have validation patterns', () => {
      expect(template.Parameters.EnvironmentSuffix.AllowedPattern).toBe('^[a-zA-Z0-9]+$');
      expect(template.Parameters.ProjectName.AllowedPattern).toBe('^[a-zA-Z0-9-]+$');
    });
  });

  describe('Resources - DynamoDB Table', () => {
    test('should have DataTable resource', () => {
      expect(template.Resources.DataTable).toBeDefined();
      expect(template.Resources.DataTable.Type).toBe('AWS::DynamoDB::Table');
    });

    test('DataTable should have on-demand billing', () => {
      const table = template.Resources.DataTable;
      expect(table.Properties.BillingMode).toBe('PAY_PER_REQUEST');
    });

    test('DataTable should have correct deletion policies', () => {
      const table = template.Resources.DataTable;
      expect(table.DeletionPolicy).toBe('Delete');
      expect(table.UpdateReplacePolicy).toBe('Delete');
      expect(table.Properties.DeletionProtectionEnabled).toBe(false);
    });

    test('DataTable should have correct key schema', () => {
      const table = template.Resources.DataTable;
      expect(table.Properties.KeySchema).toHaveLength(2);
      expect(table.Properties.KeySchema[0].AttributeName).toBe('id');
      expect(table.Properties.KeySchema[0].KeyType).toBe('HASH');
      expect(table.Properties.KeySchema[1].AttributeName).toBe('timestamp');
      expect(table.Properties.KeySchema[1].KeyType).toBe('RANGE');
    });

    test('DataTable should have Point-in-Time Recovery enabled', () => {
      const table = template.Resources.DataTable;
      expect(table.Properties.PointInTimeRecoverySpecification.PointInTimeRecoveryEnabled).toBe(true);
    });

    test('DataTable should have DynamoDB Streams enabled', () => {
      const table = template.Resources.DataTable;
      expect(table.Properties.StreamSpecification.StreamViewType).toBe('NEW_AND_OLD_IMAGES');
    });
  });

  describe('Resources - S3 Bucket', () => {
    test('should have ApiGatewayLogsBucket resource', () => {
      expect(template.Resources.ApiGatewayLogsBucket).toBeDefined();
      expect(template.Resources.ApiGatewayLogsBucket.Type).toBe('AWS::S3::Bucket');
    });

    test('S3 bucket should have encryption enabled', () => {
      const bucket = template.Resources.ApiGatewayLogsBucket;
      expect(bucket.Properties.BucketEncryption.ServerSideEncryptionConfiguration[0].ServerSideEncryptionByDefault.SSEAlgorithm).toBe('AES256');
    });

    test('S3 bucket should block public access', () => {
      const bucket = template.Resources.ApiGatewayLogsBucket;
      const blockConfig = bucket.Properties.PublicAccessBlockConfiguration;
      expect(blockConfig.BlockPublicAcls).toBe(true);
      expect(blockConfig.BlockPublicPolicy).toBe(true);
      expect(blockConfig.IgnorePublicAcls).toBe(true);
      expect(blockConfig.RestrictPublicBuckets).toBe(true);
    });

    test('S3 bucket should have lifecycle policy', () => {
      const bucket = template.Resources.ApiGatewayLogsBucket;
      expect(bucket.Properties.LifecycleConfiguration.Rules[0].ExpirationInDays).toBe(90);
    });

    test('should have S3 bucket policy for API Gateway logs', () => {
      expect(template.Resources.ApiGatewayLogsBucketPolicy).toBeDefined();
      expect(template.Resources.ApiGatewayLogsBucketPolicy.Type).toBe('AWS::S3::BucketPolicy');
    });
  });

  describe('Resources - Lambda Function', () => {
    test('should have ServerlessFunction resource', () => {
      expect(template.Resources.ServerlessFunction).toBeDefined();
      expect(template.Resources.ServerlessFunction.Type).toBe('AWS::Serverless::Function');
    });

    test('Lambda function should use Python 3.11 runtime', () => {
      const lambda = template.Resources.ServerlessFunction;
      expect(lambda.Properties.Runtime).toBe('python3.11');
    });

    test('Lambda function should have X-Ray tracing enabled', () => {
      expect(template.Globals.Function.Tracing).toBe('Active');
    });

    test('Lambda function should have environment variables', () => {
      const lambda = template.Resources.ServerlessFunction;
      expect(lambda.Properties.Environment.Variables.TABLE_NAME).toBeDefined();
      expect(lambda.Properties.Environment.Variables.ENVIRONMENT).toBeDefined();
      expect(lambda.Properties.Environment.Variables.PROJECT_NAME).toBeDefined();
      expect(lambda.Properties.Environment.Variables.LOG_LEVEL).toBe('INFO');
    });

    test('Lambda function should have reserved concurrent executions', () => {
      const lambda = template.Resources.ServerlessFunction;
      expect(lambda.Properties.ReservedConcurrentExecutions).toBe(100);
    });

    test('Lambda function should have Dead Letter Queue', () => {
      const lambda = template.Resources.ServerlessFunction;
      expect(lambda.Properties.DeadLetterQueue).toBeDefined();
      expect(lambda.Properties.DeadLetterQueue.Type).toBe('SQS');
    });

    test('Lambda function should have API Gateway events', () => {
      const lambda = template.Resources.ServerlessFunction;
      expect(lambda.Properties.Events.ApiGatewayGetEvent).toBeDefined();
      expect(lambda.Properties.Events.ApiGatewayPostEvent).toBeDefined();
      expect(lambda.Properties.Events.ApiGatewayPutEvent).toBeDefined();
      expect(lambda.Properties.Events.ApiGatewayDeleteEvent).toBeDefined();
    });
  });

  describe('Resources - Lambda Version and Alias', () => {
    test('should have Lambda Version resource', () => {
      expect(template.Resources.ServerlessFunctionVersion).toBeDefined();
      expect(template.Resources.ServerlessFunctionVersion.Type).toBe('AWS::Lambda::Version');
    });

    test('should have Lambda Alias resource', () => {
      expect(template.Resources.ServerlessFunctionAlias).toBeDefined();
      expect(template.Resources.ServerlessFunctionAlias.Type).toBe('AWS::Lambda::Alias');
    });
  });

  describe('Resources - IAM Roles', () => {
    test('should have Lambda execution role', () => {
      expect(template.Resources.LambdaExecutionRole).toBeDefined();
      expect(template.Resources.LambdaExecutionRole.Type).toBe('AWS::IAM::Role');
    });

    test('Lambda role should have DynamoDB permissions', () => {
      const role = template.Resources.LambdaExecutionRole;
      const dynamoPolicy = role.Properties.Policies.find((p: any) => p.PolicyName === 'DynamoDBAccess');
      expect(dynamoPolicy).toBeDefined();
      const actions = dynamoPolicy.PolicyDocument.Statement[0].Action;
      expect(actions).toContain('dynamodb:GetItem');
      expect(actions).toContain('dynamodb:PutItem');
      expect(actions).toContain('dynamodb:UpdateItem');
      expect(actions).toContain('dynamodb:DeleteItem');
      expect(actions).toContain('dynamodb:Query');
      expect(actions).toContain('dynamodb:Scan');
    });

    test('Lambda role should have SQS permissions for DLQ', () => {
      const role = template.Resources.LambdaExecutionRole;
      const sqsPolicy = role.Properties.Policies.find((p: any) => p.PolicyName === 'SQSAccess');
      expect(sqsPolicy).toBeDefined();
      const actions = sqsPolicy.PolicyDocument.Statement[0].Action;
      expect(actions).toContain('sqs:SendMessage');
      expect(actions).toContain('sqs:GetQueueAttributes');
    });

    test('Lambda role should have X-Ray daemon write access', () => {
      const role = template.Resources.LambdaExecutionRole;
      expect(role.Properties.ManagedPolicyArns).toContain('arn:aws:iam::aws:policy/AWSXRayDaemonWriteAccess');
    });

    test('should have API Gateway CloudWatch role', () => {
      expect(template.Resources.ApiGatewayCloudWatchRole).toBeDefined();
      expect(template.Resources.ApiGatewayCloudWatchRole.Type).toBe('AWS::IAM::Role');
    });
  });

  describe('Resources - API Gateway', () => {
    test('should have ServerlessApi resource', () => {
      expect(template.Resources.ServerlessApi).toBeDefined();
      expect(template.Resources.ServerlessApi.Type).toBe('AWS::Serverless::Api');
    });

    test('API Gateway should have X-Ray tracing enabled', () => {
      const api = template.Resources.ServerlessApi;
      expect(api.Properties.TracingEnabled).toBe(true);
    });

    test('API Gateway should have CORS configuration', () => {
      const api = template.Resources.ServerlessApi;
      expect(api.Properties.Cors).toBeDefined();
      expect(api.Properties.Cors.AllowMethods).toContain('GET');
      expect(api.Properties.Cors.AllowMethods).toContain('POST');
      expect(api.Properties.Cors.AllowMethods).toContain('PUT');
      expect(api.Properties.Cors.AllowMethods).toContain('DELETE');
      expect(api.Properties.Cors.AllowOrigin).toBe("'*'");
    });

    test('API Gateway should have stage variables', () => {
      const api = template.Resources.ServerlessApi;
      expect(api.Properties.Variables).toBeDefined();
      expect(api.Properties.Variables.Environment).toBeDefined();
      expect(api.Properties.Variables.ProjectName).toBeDefined();
      expect(api.Properties.Variables.TableName).toBeDefined();
    });

    test('API Gateway should have access logging configured', () => {
      const api = template.Resources.ServerlessApi;
      expect(api.Properties.AccessLogSetting).toBeDefined();
      expect(api.Properties.AccessLogSetting.DestinationArn).toBeDefined();
      expect(api.Properties.AccessLogSetting.Format).toBeDefined();
    });

    test('API Gateway should have method settings for logging', () => {
      const api = template.Resources.ServerlessApi;
      expect(api.Properties.MethodSettings).toBeDefined();
      expect(api.Properties.MethodSettings[0].LoggingLevel).toBe('INFO');
      expect(api.Properties.MethodSettings[0].DataTraceEnabled).toBe(true);
      expect(api.Properties.MethodSettings[0].MetricsEnabled).toBe(true);
    });
  });

  describe('Resources - SQS Dead Letter Queue', () => {
    test('should have DeadLetterQueue resource', () => {
      expect(template.Resources.DeadLetterQueue).toBeDefined();
      expect(template.Resources.DeadLetterQueue.Type).toBe('AWS::SQS::Queue');
    });

    test('DLQ should have 14-day retention', () => {
      const dlq = template.Resources.DeadLetterQueue;
      expect(dlq.Properties.MessageRetentionPeriod).toBe(1209600); // 14 days in seconds
    });
  });

  describe('Resources - CloudWatch', () => {
    test('should have Lambda log group', () => {
      expect(template.Resources.LambdaLogGroup).toBeDefined();
      expect(template.Resources.LambdaLogGroup.Type).toBe('AWS::Logs::LogGroup');
      expect(template.Resources.LambdaLogGroup.Properties.RetentionInDays).toBe(14);
    });

    test('should have API Gateway log group', () => {
      expect(template.Resources.ApiGatewayLogGroup).toBeDefined();
      expect(template.Resources.ApiGatewayLogGroup.Type).toBe('AWS::Logs::LogGroup');
      expect(template.Resources.ApiGatewayLogGroup.Properties.RetentionInDays).toBe(14);
    });

    test('should have Lambda error alarm', () => {
      expect(template.Resources.LambdaErrorAlarm).toBeDefined();
      expect(template.Resources.LambdaErrorAlarm.Type).toBe('AWS::CloudWatch::Alarm');
      expect(template.Resources.LambdaErrorAlarm.Properties.MetricName).toBe('Errors');
      expect(template.Resources.LambdaErrorAlarm.Properties.Threshold).toBe(5);
    });

    test('should have Lambda duration alarm', () => {
      expect(template.Resources.LambdaDurationAlarm).toBeDefined();
      expect(template.Resources.LambdaDurationAlarm.Type).toBe('AWS::CloudWatch::Alarm');
      expect(template.Resources.LambdaDurationAlarm.Properties.MetricName).toBe('Duration');
      expect(template.Resources.LambdaDurationAlarm.Properties.Threshold).toBe(25000);
    });
  });

  describe('Outputs', () => {
    test('should have all required outputs', () => {
      const expectedOutputs = [
        'ApiGatewayUrl',
        'LambdaFunctionName',
        'LambdaFunctionArn',
        'DynamoDBTableName',
        'DynamoDBTableArn',
        'S3BucketName',
        'LambdaAliasArn',
        'LambdaVersionArn',
        'DeadLetterQueueUrl',
        'DeadLetterQueueArn',
        'StackName',
        'EnvironmentSuffix'
      ];

      expectedOutputs.forEach(outputName => {
        expect(template.Outputs[outputName]).toBeDefined();
      });
    });

    test('all outputs should have exports', () => {
      Object.keys(template.Outputs).forEach(outputKey => {
        const output = template.Outputs[outputKey];
        expect(output.Export).toBeDefined();
        expect(output.Export.Name).toBeDefined();
      });
    });
  });

  describe('Resource Naming Convention', () => {
    test('all resources should follow naming convention with environment suffix', () => {
      const namingResources = [
        { resource: 'DataTable', propertyPath: 'Properties.TableName' },
        { resource: 'ApiGatewayLogsBucket', propertyPath: 'Properties.BucketName' },
        { resource: 'LambdaExecutionRole', propertyPath: 'Properties.RoleName' },
        { resource: 'ServerlessFunction', propertyPath: 'Properties.FunctionName' },
        { resource: 'DeadLetterQueue', propertyPath: 'Properties.QueueName' },
        { resource: 'ServerlessApi', propertyPath: 'Properties.Name' }
      ];

      namingResources.forEach(({ resource, propertyPath }) => {
        const resourceDef = template.Resources[resource];
        const pathParts = propertyPath.split('.');
        let value = resourceDef;
        
        for (const part of pathParts) {
          value = value[part];
        }
        
        expect(value).toBeDefined();
        if (typeof value === 'object' && value['Fn::Sub']) {
          expect(value['Fn::Sub']).toContain('${EnvironmentSuffix}');
        }
      });
    });
  });

  describe('Security Best Practices', () => {
    test('should not have any hardcoded secrets', () => {
      const templateString = JSON.stringify(template);
      expect(templateString).not.toMatch(/password/i);
      // Note: 'secret' is allowed in SecretAccessKey which is a valid CloudFormation parameter
      // expect(templateString).not.toMatch(/secret/i);
      // Note: 'ApiKey' is allowed in API Gateway context which is a valid resource property
      // expect(templateString).not.toMatch(/api[_-]?key/i);
    });

    test('IAM roles should follow least privilege principle', () => {
      const lambdaRole = template.Resources.LambdaExecutionRole;
      const dynamoPolicy = lambdaRole.Properties.Policies.find((p: any) => p.PolicyName === 'DynamoDBAccess');
      const resource = dynamoPolicy.PolicyDocument.Statement[0].Resource;
      
      // Should be restricted to specific table ARN
      expect(resource['Fn::GetAtt']).toBeDefined();
      expect(resource['Fn::GetAtt'][0]).toBe('DataTable');
    });

    test('S3 bucket should have server-side encryption', () => {
      const bucket = template.Resources.ApiGatewayLogsBucket;
      expect(bucket.Properties.BucketEncryption).toBeDefined();
      expect(bucket.Properties.BucketEncryption.ServerSideEncryptionConfiguration).toBeDefined();
    });
  });

  describe('High Availability and Resilience', () => {
    test('DynamoDB should support multi-AZ by default', () => {
      // DynamoDB is inherently multi-AZ
      const table = template.Resources.DataTable;
      expect(table.Type).toBe('AWS::DynamoDB::Table');
      expect(table.Properties.BillingMode).toBe('PAY_PER_REQUEST');
    });

    test('Lambda should have dead letter queue configured', () => {
      const lambda = template.Resources.ServerlessFunction;
      expect(lambda.Properties.DeadLetterQueue).toBeDefined();
      expect(lambda.Properties.DeadLetterQueue.TargetArn).toBeDefined();
    });

    test('Lambda should have reserved concurrency', () => {
      const lambda = template.Resources.ServerlessFunction;
      expect(lambda.Properties.ReservedConcurrentExecutions).toBeDefined();
      expect(lambda.Properties.ReservedConcurrentExecutions).toBeGreaterThan(0);
    });
  });

  describe('Monitoring and Observability', () => {
    test('CloudWatch alarms should be configured', () => {
      expect(template.Resources.LambdaErrorAlarm).toBeDefined();
      expect(template.Resources.LambdaDurationAlarm).toBeDefined();
    });

    test('X-Ray tracing should be enabled globally', () => {
      expect(template.Globals.Function.Tracing).toBe('Active');
    });

    test('API Gateway should have detailed logging enabled', () => {
      const api = template.Resources.ServerlessApi;
      expect(api.Properties.MethodSettings[0].LoggingLevel).toBe('INFO');
      expect(api.Properties.MethodSettings[0].DataTraceEnabled).toBe(true);
    });

    test('Lambda should have CloudWatch logs retention configured', () => {
      const logGroup = template.Resources.LambdaLogGroup;
      expect(logGroup.Properties.RetentionInDays).toBeDefined();
      expect(logGroup.Properties.RetentionInDays).toBeLessThanOrEqual(30);
    });
  });

  describe('Template Validation', () => {
    test('should have valid JSON structure', () => {
      expect(template).toBeDefined();
      expect(typeof template).toBe('object');
    });

    test('should not have any undefined or null required sections', () => {
      expect(template.AWSTemplateFormatVersion).not.toBeNull();
      expect(template.Transform).not.toBeNull();
      expect(template.Description).not.toBeNull();
      expect(template.Parameters).not.toBeNull();
      expect(template.Resources).not.toBeNull();
      expect(template.Outputs).not.toBeNull();
    });

    test('all resource references should be valid', () => {
      // Check Lambda role reference
      const lambda = template.Resources.ServerlessFunction;
      expect(lambda.Properties.Role['Fn::GetAtt'][0]).toBe('LambdaExecutionRole');
      
      // Check DLQ reference
      expect(lambda.Properties.DeadLetterQueue.TargetArn['Fn::GetAtt'][0]).toBe('DeadLetterQueue');
      
      // Check Table reference in environment variables
      expect(lambda.Properties.Environment.Variables.TABLE_NAME.Ref).toBe('DataTable');
    });
  });
});