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
      expect(template.Description).toBe(
        'Serverless Task Management Application - Complete Infrastructure'
      );
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
      expect(envSuffixParam.Description).toBe(
        'Environment suffix for resource naming (e.g., dev, staging, prod)'
      );
      expect(envSuffixParam.AllowedPattern).toBe('^[a-zA-Z0-9]+$');
      expect(envSuffixParam.ConstraintDescription).toBe(
        'Must contain only alphanumeric characters'
      );
    });
  });

  describe('DynamoDB Resources', () => {
    test('should have TasksTable resource', () => {
      expect(template.Resources.TasksTable).toBeDefined();
      expect(template.Resources.TasksTable.Type).toBe('AWS::DynamoDB::Table');
    });

    test('TasksTable should have correct properties', () => {
      const table = template.Resources.TasksTable.Properties;
      expect(table.TableName).toEqual({ 'Fn::Sub': 'TasksTable-${EnvironmentSuffix}' });
      expect(table.BillingMode).toBe('PAY_PER_REQUEST');
      expect(table.DeletionProtectionEnabled).toBe(false);
    });

    test('TasksTable should have correct key schema', () => {
      const table = template.Resources.TasksTable.Properties;
      expect(table.KeySchema).toEqual([
        { AttributeName: 'taskId', KeyType: 'HASH' }
      ]);
    });

    test('TasksTable should have Global Secondary Indexes', () => {
      const table = template.Resources.TasksTable.Properties;
      expect(table.GlobalSecondaryIndexes).toHaveLength(2);
      
      const userStatusIndex = table.GlobalSecondaryIndexes.find(
        (gsi: any) => gsi.IndexName === 'UserStatusIndex'
      );
      expect(userStatusIndex).toBeDefined();
      expect(userStatusIndex.KeySchema).toEqual([
        { AttributeName: 'userId', KeyType: 'HASH' },
        { AttributeName: 'status', KeyType: 'RANGE' }
      ]);

      const userCreatedAtIndex = table.GlobalSecondaryIndexes.find(
        (gsi: any) => gsi.IndexName === 'UserCreatedAtIndex'
      );
      expect(userCreatedAtIndex).toBeDefined();
      expect(userCreatedAtIndex.KeySchema).toEqual([
        { AttributeName: 'userId', KeyType: 'HASH' },
        { AttributeName: 'createdAt', KeyType: 'RANGE' }
      ]);
    });

    test('TasksTable should have encryption enabled', () => {
      const table = template.Resources.TasksTable.Properties;
      expect(table.SSESpecification).toBeDefined();
      expect(table.SSESpecification.SSEEnabled).toBe(true);
      expect(table.SSESpecification.SSEType).toBe('KMS');
    });

    test('TasksTable should have stream specification', () => {
      const table = template.Resources.TasksTable.Properties;
      expect(table.StreamSpecification).toBeDefined();
      expect(table.StreamSpecification.StreamViewType).toBe('NEW_AND_OLD_IMAGES');
    });
  });

  describe('S3 Resources', () => {
    test('should have TaskAttachmentsBucket resource', () => {
      expect(template.Resources.TaskAttachmentsBucket).toBeDefined();
      expect(template.Resources.TaskAttachmentsBucket.Type).toBe('AWS::S3::Bucket');
    });

    test('TaskAttachmentsBucket should have correct properties', () => {
      const bucket = template.Resources.TaskAttachmentsBucket.Properties;
      expect(bucket.BucketName).toEqual({
        'Fn::Sub': 'task-attachments-${EnvironmentSuffix}-${AWS::AccountId}-${AWS::Region}'
      });
    });

    test('TaskAttachmentsBucket should have encryption', () => {
      const bucket = template.Resources.TaskAttachmentsBucket.Properties;
      expect(bucket.BucketEncryption).toBeDefined();
      expect(bucket.BucketEncryption.ServerSideEncryptionConfiguration).toBeDefined();
      expect(bucket.BucketEncryption.ServerSideEncryptionConfiguration[0]
        .ServerSideEncryptionByDefault.SSEAlgorithm).toBe('AES256');
    });

    test('TaskAttachmentsBucket should block public access', () => {
      const bucket = template.Resources.TaskAttachmentsBucket.Properties;
      expect(bucket.PublicAccessBlockConfiguration).toBeDefined();
      expect(bucket.PublicAccessBlockConfiguration.BlockPublicAcls).toBe(true);
      expect(bucket.PublicAccessBlockConfiguration.BlockPublicPolicy).toBe(true);
      expect(bucket.PublicAccessBlockConfiguration.IgnorePublicAcls).toBe(true);
      expect(bucket.PublicAccessBlockConfiguration.RestrictPublicBuckets).toBe(true);
    });

    test('TaskAttachmentsBucket should have versioning enabled', () => {
      const bucket = template.Resources.TaskAttachmentsBucket.Properties;
      expect(bucket.VersioningConfiguration).toBeDefined();
      expect(bucket.VersioningConfiguration.Status).toBe('Enabled');
    });

    test('TaskAttachmentsBucket should have lifecycle configuration', () => {
      const bucket = template.Resources.TaskAttachmentsBucket.Properties;
      expect(bucket.LifecycleConfiguration).toBeDefined();
      expect(bucket.LifecycleConfiguration.Rules).toHaveLength(1);
      expect(bucket.LifecycleConfiguration.Rules[0].Id).toBe('DeleteIncompleteMultipartUploads');
    });
  });

  describe('IAM Resources', () => {
    test('should have LambdaExecutionRole resource', () => {
      expect(template.Resources.LambdaExecutionRole).toBeDefined();
      expect(template.Resources.LambdaExecutionRole.Type).toBe('AWS::IAM::Role');
    });

    test('LambdaExecutionRole should have correct assume role policy', () => {
      const role = template.Resources.LambdaExecutionRole.Properties;
      expect(role.AssumeRolePolicyDocument).toBeDefined();
      expect(role.AssumeRolePolicyDocument.Statement[0].Effect).toBe('Allow');
      expect(role.AssumeRolePolicyDocument.Statement[0].Principal.Service).toBe('lambda.amazonaws.com');
      expect(role.AssumeRolePolicyDocument.Statement[0].Action).toBe('sts:AssumeRole');
    });

    test('LambdaExecutionRole should have DynamoDB access policy', () => {
      const role = template.Resources.LambdaExecutionRole.Properties;
      const dynamoPolicy = role.Policies.find((p: any) => p.PolicyName === 'DynamoDBAccess');
      expect(dynamoPolicy).toBeDefined();
      expect(dynamoPolicy.PolicyDocument.Statement[0].Action).toContain('dynamodb:GetItem');
      expect(dynamoPolicy.PolicyDocument.Statement[0].Action).toContain('dynamodb:PutItem');
      expect(dynamoPolicy.PolicyDocument.Statement[0].Action).toContain('dynamodb:UpdateItem');
      expect(dynamoPolicy.PolicyDocument.Statement[0].Action).toContain('dynamodb:DeleteItem');
      expect(dynamoPolicy.PolicyDocument.Statement[0].Action).toContain('dynamodb:Query');
      expect(dynamoPolicy.PolicyDocument.Statement[0].Action).toContain('dynamodb:Scan');
    });

    test('LambdaExecutionRole should have S3 access policy', () => {
      const role = template.Resources.LambdaExecutionRole.Properties;
      const s3Policy = role.Policies.find((p: any) => p.PolicyName === 'S3Access');
      expect(s3Policy).toBeDefined();
      expect(s3Policy.PolicyDocument.Statement[0].Action).toContain('s3:GetObject');
      expect(s3Policy.PolicyDocument.Statement[0].Action).toContain('s3:PutObject');
      expect(s3Policy.PolicyDocument.Statement[0].Action).toContain('s3:DeleteObject');
      expect(s3Policy.PolicyDocument.Statement[0].Action).toContain('s3:ListBucket');
    });
  });

  describe('Lambda Functions', () => {
    test('should have TaskManagementFunction resource', () => {
      expect(template.Resources.TaskManagementFunction).toBeDefined();
      expect(template.Resources.TaskManagementFunction.Type).toBe('AWS::Lambda::Function');
    });

    test('TaskManagementFunction should have correct properties', () => {
      const func = template.Resources.TaskManagementFunction.Properties;
      expect(func.FunctionName).toEqual({ 'Fn::Sub': 'TaskManagement-${EnvironmentSuffix}' });
      expect(func.Runtime).toBe('nodejs20.x');
      expect(func.Handler).toBe('index.handler');
      expect(func.Timeout).toBe(30);
      expect(func.MemorySize).toBe(512);
    });

    test('TaskManagementFunction should have environment variables', () => {
      const func = template.Resources.TaskManagementFunction.Properties;
      expect(func.Environment).toBeDefined();
      expect(func.Environment.Variables.TASKS_TABLE_NAME).toEqual({ Ref: 'TasksTable' });
      expect(func.Environment.Variables.ATTACHMENTS_BUCKET_NAME).toEqual({ Ref: 'TaskAttachmentsBucket' });
      expect(func.Environment.Variables.ENVIRONMENT).toEqual({ Ref: 'EnvironmentSuffix' });
    });

    test('should have TaskStreamingFunction resource', () => {
      expect(template.Resources.TaskStreamingFunction).toBeDefined();
      expect(template.Resources.TaskStreamingFunction.Type).toBe('AWS::Lambda::Function');
    });

    test('TaskStreamingFunction should have correct properties', () => {
      const func = template.Resources.TaskStreamingFunction.Properties;
      expect(func.FunctionName).toEqual({ 'Fn::Sub': 'TaskStreaming-${EnvironmentSuffix}' });
      expect(func.Runtime).toBe('nodejs20.x');
      expect(func.Handler).toBe('index.handler');
      expect(func.Timeout).toBe(300);
      expect(func.MemorySize).toBe(1024);
    });
  });

  describe('Lambda Function URLs', () => {
    test('should have TaskManagementFunctionUrl resource', () => {
      expect(template.Resources.TaskManagementFunctionUrl).toBeDefined();
      expect(template.Resources.TaskManagementFunctionUrl.Type).toBe('AWS::Lambda::Url');
    });

    test('TaskManagementFunctionUrl should have correct properties', () => {
      const url = template.Resources.TaskManagementFunctionUrl.Properties;
      expect(url.AuthType).toBe('NONE');
      expect(url.InvokeMode).toBe('BUFFERED');
      expect(url.Cors).toBeDefined();
      expect(url.Cors.AllowMethods).toContain('GET');
      expect(url.Cors.AllowMethods).toContain('POST');
      expect(url.Cors.AllowMethods).toContain('PUT');
      expect(url.Cors.AllowMethods).toContain('DELETE');
    });

    test('should have TaskStreamingFunctionUrl resource', () => {
      expect(template.Resources.TaskStreamingFunctionUrl).toBeDefined();
      expect(template.Resources.TaskStreamingFunctionUrl.Type).toBe('AWS::Lambda::Url');
    });

    test('TaskStreamingFunctionUrl should have RESPONSE_STREAM mode', () => {
      const url = template.Resources.TaskStreamingFunctionUrl.Properties;
      expect(url.InvokeMode).toBe('RESPONSE_STREAM');
    });
  });

  describe('API Gateway Resources', () => {
    test('should have TaskManagementApi resource', () => {
      expect(template.Resources.TaskManagementApi).toBeDefined();
      expect(template.Resources.TaskManagementApi.Type).toBe('AWS::ApiGatewayV2::Api');
    });

    test('TaskManagementApi should have correct properties', () => {
      const api = template.Resources.TaskManagementApi.Properties;
      expect(api.Name).toEqual({ 'Fn::Sub': 'TaskManagementApi-${EnvironmentSuffix}' });
      expect(api.ProtocolType).toBe('HTTP');
      expect(api.Description).toBe('Task Management API Gateway');
    });

    test('TaskManagementApi should have CORS configuration', () => {
      const api = template.Resources.TaskManagementApi.Properties;
      expect(api.CorsConfiguration).toBeDefined();
      expect(api.CorsConfiguration.AllowMethods).toContain('GET');
      expect(api.CorsConfiguration.AllowMethods).toContain('POST');
      expect(api.CorsConfiguration.AllowMethods).toContain('PUT');
      expect(api.CorsConfiguration.AllowMethods).toContain('DELETE');
      expect(api.CorsConfiguration.AllowOrigins).toContain('*');
    });

    test('should have TaskManagementIntegration resource', () => {
      expect(template.Resources.TaskManagementIntegration).toBeDefined();
      expect(template.Resources.TaskManagementIntegration.Type).toBe('AWS::ApiGatewayV2::Integration');
    });

    test('should have API Gateway routes', () => {
      expect(template.Resources.TasksRoute).toBeDefined();
      expect(template.Resources.TasksRoute.Type).toBe('AWS::ApiGatewayV2::Route');
      expect(template.Resources.TasksRoute.Properties.RouteKey).toBe('ANY /tasks');

      expect(template.Resources.TaskByIdRoute).toBeDefined();
      expect(template.Resources.TaskByIdRoute.Type).toBe('AWS::ApiGatewayV2::Route');
      expect(template.Resources.TaskByIdRoute.Properties.RouteKey).toBe('ANY /tasks/{taskId}');
    });

    test('should have TaskManagementStage resource', () => {
      expect(template.Resources.TaskManagementStage).toBeDefined();
      expect(template.Resources.TaskManagementStage.Type).toBe('AWS::ApiGatewayV2::Stage');
      expect(template.Resources.TaskManagementStage.Properties.AutoDeploy).toBe(true);
    });
  });

  describe('CloudWatch Resources', () => {
    test('should have TaskManagementLogGroup resource', () => {
      expect(template.Resources.TaskManagementLogGroup).toBeDefined();
      expect(template.Resources.TaskManagementLogGroup.Type).toBe('AWS::Logs::LogGroup');
    });

    test('TaskManagementLogGroup should have correct properties', () => {
      const logGroup = template.Resources.TaskManagementLogGroup.Properties;
      expect(logGroup.LogGroupName).toEqual({
        'Fn::Sub': '/aws/lambda/TaskManagement-${EnvironmentSuffix}'
      });
      expect(logGroup.RetentionInDays).toBe(14);
    });

    test('should have TaskStreamingLogGroup resource', () => {
      expect(template.Resources.TaskStreamingLogGroup).toBeDefined();
      expect(template.Resources.TaskStreamingLogGroup.Type).toBe('AWS::Logs::LogGroup');
    });

    test('should have ApiGatewayLogGroup resource', () => {
      expect(template.Resources.ApiGatewayLogGroup).toBeDefined();
      expect(template.Resources.ApiGatewayLogGroup.Type).toBe('AWS::Logs::LogGroup');
    });

    test('should have CloudWatch alarms', () => {
      expect(template.Resources.TaskManagementErrorAlarm).toBeDefined();
      expect(template.Resources.TaskManagementErrorAlarm.Type).toBe('AWS::CloudWatch::Alarm');
      
      expect(template.Resources.TaskManagementDurationAlarm).toBeDefined();
      expect(template.Resources.TaskManagementDurationAlarm.Type).toBe('AWS::CloudWatch::Alarm');
    });

    test('TaskManagementErrorAlarm should have correct properties', () => {
      const alarm = template.Resources.TaskManagementErrorAlarm.Properties;
      expect(alarm.MetricName).toBe('Errors');
      expect(alarm.Namespace).toBe('AWS/Lambda');
      expect(alarm.Statistic).toBe('Sum');
      expect(alarm.Period).toBe(300);
      expect(alarm.Threshold).toBe(5);
    });

    test('TaskManagementDurationAlarm should have correct properties', () => {
      const alarm = template.Resources.TaskManagementDurationAlarm.Properties;
      expect(alarm.MetricName).toBe('Duration');
      expect(alarm.Namespace).toBe('AWS/Lambda');
      expect(alarm.Statistic).toBe('Average');
      expect(alarm.Period).toBe(300);
      expect(alarm.Threshold).toBe(25000);
    });
  });

  describe('Lambda Permissions', () => {
    test('should have TaskManagementFunctionUrlPermission', () => {
      expect(template.Resources.TaskManagementFunctionUrlPermission).toBeDefined();
      expect(template.Resources.TaskManagementFunctionUrlPermission.Type).toBe('AWS::Lambda::Permission');
    });

    test('should have TaskStreamingFunctionUrlPermission', () => {
      expect(template.Resources.TaskStreamingFunctionUrlPermission).toBeDefined();
      expect(template.Resources.TaskStreamingFunctionUrlPermission.Type).toBe('AWS::Lambda::Permission');
    });

    test('should have ApiGatewayInvokePermission', () => {
      expect(template.Resources.ApiGatewayInvokePermission).toBeDefined();
      expect(template.Resources.ApiGatewayInvokePermission.Type).toBe('AWS::Lambda::Permission');
      expect(template.Resources.ApiGatewayInvokePermission.Properties.Principal).toBe('apigateway.amazonaws.com');
    });
  });

  describe('Outputs', () => {
    test('should have ApiGatewayUrl output', () => {
      expect(template.Outputs.ApiGatewayUrl).toBeDefined();
      expect(template.Outputs.ApiGatewayUrl.Description).toBe('API Gateway endpoint URL');
    });

    test('should have TaskManagementFunctionUrl output', () => {
      expect(template.Outputs.TaskManagementFunctionUrl).toBeDefined();
      expect(template.Outputs.TaskManagementFunctionUrl.Description).toBe('Lambda Function URL for Task Management');
    });

    test('should have TaskStreamingFunctionUrl output', () => {
      expect(template.Outputs.TaskStreamingFunctionUrl).toBeDefined();
      expect(template.Outputs.TaskStreamingFunctionUrl.Description).toBe('Lambda Function URL for Task Streaming');
    });

    test('should have TasksTableName output', () => {
      expect(template.Outputs.TasksTableName).toBeDefined();
      expect(template.Outputs.TasksTableName.Description).toBe('DynamoDB Tasks table name');
    });

    test('should have TaskAttachmentsBucketName output', () => {
      expect(template.Outputs.TaskAttachmentsBucketName).toBeDefined();
      expect(template.Outputs.TaskAttachmentsBucketName.Description).toBe('S3 bucket name for task attachments');
    });

    test('should have LambdaExecutionRoleArn output', () => {
      expect(template.Outputs.LambdaExecutionRoleArn).toBeDefined();
      expect(template.Outputs.LambdaExecutionRoleArn.Description).toBe('Lambda execution role ARN');
    });

    test('all outputs should be properly defined', () => {
      Object.keys(template.Outputs).forEach(outputKey => {
        expect(template.Outputs[outputKey].Description).toBeDefined();
        expect(template.Outputs[outputKey].Value).toBeDefined();
      });
    });
  });

  describe('Resource Tags', () => {
    test('all taggable resources should have Environment tag', () => {
      const taggableResources = [
        'TasksTable',
        'TaskAttachmentsBucket',
        'LambdaExecutionRole',
        'TaskManagementFunction',
        'TaskStreamingFunction',
        'TaskManagementLogGroup',
        'TaskStreamingLogGroup',
        'ApiGatewayLogGroup',
        'TaskManagementErrorAlarm',
        'TaskManagementDurationAlarm'
      ];

      taggableResources.forEach(resourceName => {
        const resource = template.Resources[resourceName];
        if (resource && resource.Properties && resource.Properties.Tags) {
          const envTag = resource.Properties.Tags.find((tag: any) => tag.Key === 'Environment');
          expect(envTag).toBeDefined();
          expect(envTag.Value).toEqual({ Ref: 'EnvironmentSuffix' });
        }
      });
    });

    test('all taggable resources should have Application tag', () => {
      const taggableResources = [
        'TasksTable',
        'TaskAttachmentsBucket',
        'LambdaExecutionRole',
        'TaskManagementFunction',
        'TaskStreamingFunction',
        'TaskManagementLogGroup',
        'TaskStreamingLogGroup',
        'ApiGatewayLogGroup',
        'TaskManagementErrorAlarm',
        'TaskManagementDurationAlarm'
      ];

      taggableResources.forEach(resourceName => {
        const resource = template.Resources[resourceName];
        if (resource && resource.Properties && resource.Properties.Tags) {
          const appTag = resource.Properties.Tags.find((tag: any) => tag.Key === 'Application');
          expect(appTag).toBeDefined();
          expect(appTag.Value).toBe('TaskManagement');
        }
      });
    });
  });

  describe('Security Best Practices', () => {
    test('DynamoDB table should have deletion policy', () => {
      expect(template.Resources.TasksTable.DeletionPolicy).toBe('Delete');
      expect(template.Resources.TasksTable.UpdateReplacePolicy).toBe('Delete');
    });

    test('S3 bucket should have deletion policy', () => {
      expect(template.Resources.TaskAttachmentsBucket.DeletionPolicy).toBe('Delete');
    });

    test('Lambda functions should use specific IAM role', () => {
      expect(template.Resources.TaskManagementFunction.Properties.Role).toEqual({
        'Fn::GetAtt': ['LambdaExecutionRole', 'Arn']
      });
      expect(template.Resources.TaskStreamingFunction.Properties.Role).toEqual({
        'Fn::GetAtt': ['LambdaExecutionRole', 'Arn']
      });
    });

    test('IAM role should follow least privilege principle', () => {
      const role = template.Resources.LambdaExecutionRole.Properties;
      role.Policies.forEach((policy: any) => {
        policy.PolicyDocument.Statement.forEach((statement: any) => {
          expect(statement.Effect).toBe('Allow');
          expect(statement.Resource).toBeDefined();
          expect(statement.Resource).not.toContain('*');
        });
      });
    });
  });
});