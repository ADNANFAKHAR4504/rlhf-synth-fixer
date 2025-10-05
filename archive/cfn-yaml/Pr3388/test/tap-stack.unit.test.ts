import fs from 'fs';
import path from 'path';

const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';

describe('Survey Data Platform CloudFormation Template', () => {
  let template: any;

  beforeAll(() => {
    // Template converted from YAML to JSON for testing
    const templatePath = path.join(__dirname, '../lib/TapStack.json');
    const templateContent = fs.readFileSync(templatePath, 'utf8');
    template = JSON.parse(templateContent);
  });

  describe('Template Structure', () => {
    test('should have valid CloudFormation format version', () => {
      expect(template.AWSTemplateFormatVersion).toBe('2010-09-09');
    });

    test('should have correct description', () => {
      expect(template.Description).toBeDefined();
      expect(template.Description).toBe(
        'Serverless Survey Data Collection and Analysis System'
      );
    });

    test('should have all required sections', () => {
      expect(template.Parameters).toBeDefined();
      expect(template.Resources).toBeDefined();
      expect(template.Outputs).toBeDefined();
    });
  });

  describe('Parameters', () => {
    test('should have Environment parameter', () => {
      expect(template.Parameters.Environment).toBeDefined();
      expect(template.Parameters.Environment.Type).toBe('String');
      expect(template.Parameters.Environment.Default).toBe('dev');
      expect(template.Parameters.Environment.Description).toBe('Deployment environment');
    });

    test('should have EnvironmentSuffix parameter', () => {
      expect(template.Parameters.EnvironmentSuffix).toBeDefined();
      expect(template.Parameters.EnvironmentSuffix.Type).toBe('String');
      expect(template.Parameters.EnvironmentSuffix.Default).toBe('dev');
      expect(template.Parameters.EnvironmentSuffix.Description).toBe(
        'Environment suffix for unique resource naming'
      );
    });

    test('should have ApiRateLimit parameter', () => {
      expect(template.Parameters.ApiRateLimit).toBeDefined();
      expect(template.Parameters.ApiRateLimit.Type).toBe('Number');
      expect(template.Parameters.ApiRateLimit.Default).toBe(1000);
      expect(template.Parameters.ApiRateLimit.Description).toBe(
        'API Gateway throttling limit per second'
      );
    });

    test('should have AdminEmail parameter', () => {
      expect(template.Parameters.AdminEmail).toBeDefined();
      expect(template.Parameters.AdminEmail.Type).toBe('String');
      expect(template.Parameters.AdminEmail.Default).toBe('govardhan.y@turing.com');
      expect(template.Parameters.AdminEmail.Description).toBe(
        'Admin email address for notifications'
      );
    });

    test('should have ApiKeyName parameter', () => {
      expect(template.Parameters.ApiKeyName).toBeDefined();
      expect(template.Parameters.ApiKeyName.Type).toBe('String');
      expect(template.Parameters.ApiKeyName.Default).toBe('survey-api-key');
      expect(template.Parameters.ApiKeyName.Description).toBe(
        'Name for the API Gateway API key'
      );
    });

    test('should have KmsKeyRotation parameter', () => {
      expect(template.Parameters.KmsKeyRotation).toBeDefined();
      expect(template.Parameters.KmsKeyRotation.Type).toBe('String');
      expect(template.Parameters.KmsKeyRotation.Default).toBe('true');
      expect(template.Parameters.KmsKeyRotation.Description).toBe(
        'Enable automatic KMS key rotation'
      );
      expect(template.Parameters.KmsKeyRotation.AllowedValues).toEqual(['true', 'false']);
    });

    test('should have exactly 6 parameters', () => {
      const parameterCount = Object.keys(template.Parameters).length;
      expect(parameterCount).toBe(6);
    });
  });

  describe('DynamoDB Resources', () => {
    test('should have SurveyResponseTable resource', () => {
      expect(template.Resources.SurveyResponseTable).toBeDefined();
      expect(template.Resources.SurveyResponseTable.Type).toBe('AWS::DynamoDB::Table');
    });

    test('SurveyResponseTable should have correct table name with environment suffix', () => {
      const table = template.Resources.SurveyResponseTable;
      expect(table.Properties.TableName).toEqual({
        'Fn::Sub': 'SurveyResponses-${EnvironmentSuffix}',
      });
    });

    test('SurveyResponseTable should use PAY_PER_REQUEST billing', () => {
      const table = template.Resources.SurveyResponseTable;
      expect(table.Properties.BillingMode).toBe('PAY_PER_REQUEST');
    });

    test('SurveyResponseTable should have correct attribute definitions', () => {
      const table = template.Resources.SurveyResponseTable;
      const attributeDefinitions = table.Properties.AttributeDefinitions;

      expect(attributeDefinitions).toHaveLength(4);
      expect(attributeDefinitions).toEqual([
        { AttributeName: 'responseId', AttributeType: 'S' },
        { AttributeName: 'surveyId', AttributeType: 'S' },
        { AttributeName: 'timestamp', AttributeType: 'S' },
        { AttributeName: 'respondentId', AttributeType: 'S' },
      ]);
    });

    test('SurveyResponseTable should have correct primary key schema', () => {
      const table = template.Resources.SurveyResponseTable;
      const keySchema = table.Properties.KeySchema;

      expect(keySchema).toHaveLength(1);
      expect(keySchema[0]).toEqual({ AttributeName: 'responseId', KeyType: 'HASH' });
    });

    test('SurveyResponseTable should have required Global Secondary Indexes', () => {
      const table = template.Resources.SurveyResponseTable;
      const gsiList = table.Properties.GlobalSecondaryIndexes;

      expect(gsiList).toHaveLength(2);
      
      // SurveyIdIndex for querying by survey
      const surveyIndex = gsiList.find((gsi: any) => gsi.IndexName === 'SurveyIdIndex');
      expect(surveyIndex).toBeDefined();
      expect(surveyIndex.KeySchema).toEqual([
        { AttributeName: 'surveyId', KeyType: 'HASH' },
        { AttributeName: 'timestamp', KeyType: 'RANGE' },
      ]);
      expect(surveyIndex.Projection.ProjectionType).toBe('ALL');

      // RespondentIndex for querying by respondent
      const respondentIndex = gsiList.find((gsi: any) => gsi.IndexName === 'RespondentIndex');
      expect(respondentIndex).toBeDefined();
      expect(respondentIndex.KeySchema).toEqual([
        { AttributeName: 'respondentId', KeyType: 'HASH' },
        { AttributeName: 'timestamp', KeyType: 'RANGE' },
      ]);
      expect(respondentIndex.Projection.ProjectionType).toBe('ALL');
    });
  });

  describe('S3 Resources', () => {
    test('should have BackupBucket resource', () => {
      expect(template.Resources.BackupBucket).toBeDefined();
      expect(template.Resources.BackupBucket.Type).toBe('AWS::S3::Bucket');
    });

    test('BackupBucket should have correct naming with account ID and environment suffix', () => {
      const bucket = template.Resources.BackupBucket;
      expect(bucket.Properties.BucketName).toEqual({
        'Fn::Sub': 'survey-backups-${AWS::AccountId}-${EnvironmentSuffix}',
      });
    });

    test('BackupBucket should have versioning enabled', () => {
      const bucket = template.Resources.BackupBucket;
      expect(bucket.Properties.VersioningConfiguration.Status).toBe('Enabled');
    });

    test('BackupBucket should have lifecycle configuration for cost optimization', () => {
      const bucket = template.Resources.BackupBucket;
      const lifecycleRules = bucket.Properties.LifecycleConfiguration.Rules;
      
      expect(lifecycleRules).toHaveLength(1);
      expect(lifecycleRules[0].Id).toBe('TransitionToInfrequentAccess');
      expect(lifecycleRules[0].Status).toBe('Enabled');
      expect(lifecycleRules[0].Transitions[0].TransitionInDays).toBe(30);
      expect(lifecycleRules[0].Transitions[0].StorageClass).toBe('STANDARD_IA');
    });
  });

  describe('IAM Resources', () => {
    test('should have LambdaExecutionRole resource', () => {
      expect(template.Resources.LambdaExecutionRole).toBeDefined();
      expect(template.Resources.LambdaExecutionRole.Type).toBe('AWS::IAM::Role');
    });

    test('LambdaExecutionRole should have correct assume role policy', () => {
      const role = template.Resources.LambdaExecutionRole;
      const assumeRoleDoc = role.Properties.AssumeRolePolicyDocument;
      
      expect(assumeRoleDoc.Version).toBe('2012-10-17');
      expect(assumeRoleDoc.Statement[0].Effect).toBe('Allow');
      expect(assumeRoleDoc.Statement[0].Principal.Service).toBe('lambda.amazonaws.com');
      expect(assumeRoleDoc.Statement[0].Action).toBe('sts:AssumeRole');
    });

    test('LambdaExecutionRole should have basic execution managed policy', () => {
      const role = template.Resources.LambdaExecutionRole;
      expect(role.Properties.ManagedPolicyArns).toContain(
        'arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole'
      );
    });

    test('LambdaExecutionRole should have correct DynamoDB permissions', () => {
      const role = template.Resources.LambdaExecutionRole;
      const policies = role.Properties.Policies;
      const surveyDataPolicy = policies.find((p: any) => p.PolicyName === 'SurveyDataAccess');
      
      expect(surveyDataPolicy).toBeDefined();
      const statement = surveyDataPolicy.PolicyDocument.Statement[0];
      expect(statement.Effect).toBe('Allow');
      expect(statement.Action).toEqual([
        'dynamodb:PutItem',
        'dynamodb:GetItem',
        'dynamodb:Query',
        'dynamodb:Scan',
      ]);
    });

    test('LambdaExecutionRole should have S3 and SNS permissions', () => {
      const role = template.Resources.LambdaExecutionRole;
      const policies = role.Properties.Policies;
      const surveyDataPolicy = policies.find((p: any) => p.PolicyName === 'SurveyDataAccess');
      const statements = surveyDataPolicy.PolicyDocument.Statement;
      
      // S3 permissions
      const s3Statement = statements.find((s: any) => s.Action.includes('s3:PutObject'));
      expect(s3Statement).toBeDefined();
      expect(s3Statement.Effect).toBe('Allow');
      
      // SNS permissions
      const snsStatement = statements.find((s: any) => s.Action.includes('sns:Publish'));
      expect(snsStatement).toBeDefined();
      expect(snsStatement.Effect).toBe('Allow');
    });
  });

  describe('Lambda Functions', () => {
    test('should have SubmissionFunction resource', () => {
      expect(template.Resources.SubmissionFunction).toBeDefined();
      expect(template.Resources.SubmissionFunction.Type).toBe('AWS::Lambda::Function');
    });

    test('SubmissionFunction should have correct configuration', () => {
      const func = template.Resources.SubmissionFunction;
      expect(func.Properties.FunctionName).toEqual({
        'Fn::Sub': 'survey-submission-${EnvironmentSuffix}',
      });
      expect(func.Properties.Runtime).toBe('python3.10');
      expect(func.Properties.Handler).toBe('index.handler');
    });

    test('SubmissionFunction should have correct environment variables', () => {
      const func = template.Resources.SubmissionFunction;
      const envVars = func.Properties.Environment.Variables;
      
      expect(envVars.TABLE_NAME).toEqual({ Ref: 'SurveyResponseTable' });
      expect(envVars.REGION).toBe('us-east-1');
    });

    test('should have AggregationFunction resource', () => {
      expect(template.Resources.AggregationFunction).toBeDefined();
      expect(template.Resources.AggregationFunction.Type).toBe('AWS::Lambda::Function');
    });

    test('AggregationFunction should have correct configuration', () => {
      const func = template.Resources.AggregationFunction;
      expect(func.Properties.FunctionName).toEqual({
        'Fn::Sub': 'survey-aggregation-${EnvironmentSuffix}',
      });
      expect(func.Properties.Runtime).toBe('python3.10');
      expect(func.Properties.Timeout).toBe(120);
    });

    test('should have BackupFunction resource', () => {
      expect(template.Resources.BackupFunction).toBeDefined();
      expect(template.Resources.BackupFunction.Type).toBe('AWS::Lambda::Function');
    });

    test('BackupFunction should have correct configuration', () => {
      const func = template.Resources.BackupFunction;
      expect(func.Properties.FunctionName).toEqual({
        'Fn::Sub': 'survey-backup-${EnvironmentSuffix}',
      });
      expect(func.Properties.Runtime).toBe('python3.10');
      expect(func.Properties.Timeout).toBe(300);
    });
  });

  describe('API Gateway Resources', () => {
    test('should have SurveyApi resource', () => {
      expect(template.Resources.SurveyApi).toBeDefined();
      expect(template.Resources.SurveyApi.Type).toBe('AWS::ApiGateway::RestApi');
    });

    test('SurveyApi should have correct name and description', () => {
      const api = template.Resources.SurveyApi;
      expect(api.Properties.Name).toEqual({
        'Fn::Sub': 'SurveyAPI-${EnvironmentSuffix}',
      });
      expect(api.Properties.Description).toBe('API for survey data collection');
    });

    test('should have correct API Gateway resource hierarchy', () => {
      expect(template.Resources.SurveyResource).toBeDefined();
      expect(template.Resources.SubmitResource).toBeDefined();
      expect(template.Resources.SubmitMethod).toBeDefined();
      expect(template.Resources.ApiDeployment).toBeDefined();
      expect(template.Resources.ApiStage).toBeDefined();
    });

    test('SubmitMethod should have correct configuration', () => {
      const method = template.Resources.SubmitMethod;
      expect(method.Type).toBe('AWS::ApiGateway::Method');
      expect(method.Properties.HttpMethod).toBe('POST');
      expect(method.Properties.AuthorizationType).toBe('NONE');
      expect(method.Properties.Integration.Type).toBe('AWS_PROXY');
    });

    test('should have ApiUsagePlan with throttling configuration', () => {
      const usagePlan = template.Resources.ApiUsagePlan;
      expect(usagePlan).toBeDefined();
      expect(usagePlan.Type).toBe('AWS::ApiGateway::UsagePlan');
      expect(usagePlan.Properties.Throttle.BurstLimit).toEqual({ Ref: 'ApiRateLimit' });
      expect(usagePlan.Properties.Throttle.RateLimit).toEqual({ Ref: 'ApiRateLimit' });
    });
  });

  describe('EventBridge and Scheduling Resources', () => {
    test('should have DailyAggregationRule resource', () => {
      expect(template.Resources.DailyAggregationRule).toBeDefined();
      expect(template.Resources.DailyAggregationRule.Type).toBe('AWS::Events::Rule');
    });

    test('DailyAggregationRule should have correct schedule', () => {
      const rule = template.Resources.DailyAggregationRule;
      expect(rule.Properties.ScheduleExpression).toBe('cron(0 1 * * ? *)');
      expect(rule.Properties.State).toBe('ENABLED');
    });

    test('should have WeeklyBackupRule resource', () => {
      expect(template.Resources.WeeklyBackupRule).toBeDefined();
      expect(template.Resources.WeeklyBackupRule.Type).toBe('AWS::Events::Rule');
    });

    test('WeeklyBackupRule should have correct schedule', () => {
      const rule = template.Resources.WeeklyBackupRule;
      expect(rule.Properties.ScheduleExpression).toBe('cron(0 2 ? * SUN *)');
      expect(rule.Properties.State).toBe('ENABLED');
    });
  });

  describe('SNS Resources', () => {
    test('should have AdminNotificationTopic resource', () => {
      expect(template.Resources.AdminNotificationTopic).toBeDefined();
      expect(template.Resources.AdminNotificationTopic.Type).toBe('AWS::SNS::Topic');
    });

    test('should have AdminEmailSubscription resource', () => {
      expect(template.Resources.AdminEmailSubscription).toBeDefined();
      expect(template.Resources.AdminEmailSubscription.Type).toBe('AWS::SNS::Subscription');
      expect(template.Resources.AdminEmailSubscription.Properties.Protocol).toBe('email');
    });
  });

  describe('CloudWatch Resources', () => {
    test('should have SurveyDashboard resource', () => {
      expect(template.Resources.SurveyDashboard).toBeDefined();
      expect(template.Resources.SurveyDashboard.Type).toBe('AWS::CloudWatch::Dashboard');
    });

    test('should have ApiErrorAlarm resource', () => {
      expect(template.Resources.ApiErrorAlarm).toBeDefined();
      expect(template.Resources.ApiErrorAlarm.Type).toBe('AWS::CloudWatch::Alarm');
    });

    test('ApiErrorAlarm should have correct configuration', () => {
      const alarm = template.Resources.ApiErrorAlarm;
      expect(alarm.Properties.MetricName).toBe('5XXError');
      expect(alarm.Properties.Namespace).toBe('AWS/ApiGateway');
      expect(alarm.Properties.Threshold).toBe(5);
      expect(alarm.Properties.ComparisonOperator).toBe('GreaterThanThreshold');
    });
  });

  describe('Outputs', () => {
    test('should have all required outputs for integration testing', () => {
      const expectedOutputs = [
        'ApiEndpoint',
        'ApiGatewayId',
        'ApiStageName',
        'DynamoDBTableName',
        'BackupBucketName',
        'DashboardURL',
      ];

      expectedOutputs.forEach(outputName => {
        expect(template.Outputs[outputName]).toBeDefined();
      });
    });

    test('ApiEndpoint output should be correctly formatted', () => {
      const output = template.Outputs.ApiEndpoint;
      expect(output.Description).toBe('API Endpoint URL for survey submission');
      expect(output.Value).toEqual({
        'Fn::Sub': 'https://${SurveyApi}.execute-api.us-east-1.amazonaws.com/${Environment}/survey/submit',
      });
    });

    test('outputs should have proper exports for stack references', () => {
      Object.keys(template.Outputs).forEach(outputKey => {
        const output = template.Outputs[outputKey];
        expect(output.Export.Name).toEqual({
          'Fn::Sub': `\${AWS::StackName}-${outputKey}`,
        });
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

    test('should have correct number of resources for survey platform', () => {
      const resourceCount = Object.keys(template.Resources).length;
      expect(resourceCount).toBe(28); // All survey platform resources including security improvements
    });

    test('should have correct number of parameters', () => {
      const parameterCount = Object.keys(template.Parameters).length;
      expect(parameterCount).toBe(6);
    });

    test('should have correct number of outputs', () => {
      const outputCount = Object.keys(template.Outputs).length;
      expect(outputCount).toBe(9);
    });
  });

  describe('Resource Naming Convention', () => {
    test('DynamoDB table should follow naming convention with environment suffix', () => {
      const table = template.Resources.SurveyResponseTable;
      const tableName = table.Properties.TableName;

      expect(tableName).toEqual({
        'Fn::Sub': 'SurveyResponses-${EnvironmentSuffix}',
      });
    });

    test('S3 bucket should follow naming convention with account ID and environment suffix', () => {
      const bucket = template.Resources.BackupBucket;
      const bucketName = bucket.Properties.BucketName;

      expect(bucketName).toEqual({
        'Fn::Sub': 'survey-backups-${AWS::AccountId}-${EnvironmentSuffix}',
      });
    });

    test('Lambda functions should follow naming convention with environment suffix', () => {
      const functions = [
        'SubmissionFunction',
        'AggregationFunction', 
        'BackupFunction'
      ];

      functions.forEach(funcName => {
        const func = template.Resources[funcName];
        expect(func.Properties.FunctionName['Fn::Sub']).toContain('${EnvironmentSuffix}');
      });
    });

    test('EventBridge rules should follow naming convention with environment suffix', () => {
      const rules = ['DailyAggregationRule', 'WeeklyBackupRule'];
      
      rules.forEach(ruleName => {
        const rule = template.Resources[ruleName];
        expect(rule.Properties.Name['Fn::Sub']).toContain('${EnvironmentSuffix}');
      });
    });

    test('export names should follow naming convention', () => {
      Object.keys(template.Outputs).forEach(outputKey => {
        const output = template.Outputs[outputKey];
        expect(output.Export.Name).toEqual({
          'Fn::Sub': `\${AWS::StackName}-${outputKey}`,
        });
      });
    });
  });

  describe('Security Resources', () => {
    test('should have SurveyDataKmsKey resource', () => {
      expect(template.Resources.SurveyDataKmsKey).toBeDefined();
      expect(template.Resources.SurveyDataKmsKey.Type).toBe('AWS::KMS::Key');
      expect(template.Resources.SurveyDataKmsKey.Properties.Description).toBe(
        'KMS key for Survey Data Platform encryption'
      );
      expect(template.Resources.SurveyDataKmsKey.Properties.EnableKeyRotation).toEqual({
        Ref: 'KmsKeyRotation'
      });
    });

    test('should have SurveyDataKmsKeyAlias resource', () => {
      expect(template.Resources.SurveyDataKmsKeyAlias).toBeDefined();
      expect(template.Resources.SurveyDataKmsKeyAlias.Type).toBe('AWS::KMS::Alias');
      expect(template.Resources.SurveyDataKmsKeyAlias.Properties.AliasName).toEqual({
        'Fn::Sub': 'alias/survey-data-${EnvironmentSuffix}'
      });
    });

    test('should have SurveyApiKey resource', () => {
      expect(template.Resources.SurveyApiKey).toBeDefined();
      expect(template.Resources.SurveyApiKey.Type).toBe('AWS::ApiGateway::ApiKey');
      expect(template.Resources.SurveyApiKey.Properties.Name).toEqual({
        'Fn::Sub': '${ApiKeyName}-${EnvironmentSuffix}'
      });
      expect(template.Resources.SurveyApiKey.Properties.Enabled).toBe(true);
    });

    test('should have ApiUsagePlanKey resource', () => {
      expect(template.Resources.ApiUsagePlanKey).toBeDefined();
      expect(template.Resources.ApiUsagePlanKey.Type).toBe('AWS::ApiGateway::UsagePlanKey');
      expect(template.Resources.ApiUsagePlanKey.Properties.KeyType).toBe('API_KEY');
    });

    test('should have SurveyApiWebACL resource', () => {
      expect(template.Resources.SurveyApiWebACL).toBeDefined();
      expect(template.Resources.SurveyApiWebACL.Type).toBe('AWS::WAFv2::WebACL');
      expect(template.Resources.SurveyApiWebACL.Properties.Scope).toBe('REGIONAL');
      expect(template.Resources.SurveyApiWebACL.Properties.Rules).toHaveLength(3);
    });

    test('should have ApiWebACLAssociation resource', () => {
      expect(template.Resources.ApiWebACLAssociation).toBeDefined();
      expect(template.Resources.ApiWebACLAssociation.Type).toBe('AWS::WAFv2::WebACLAssociation');
    });

    test('DynamoDB table should have encryption enabled', () => {
      const table = template.Resources.SurveyResponseTable;
      expect(table.Properties.SSESpecification).toBeDefined();
      expect(table.Properties.SSESpecification.SSEEnabled).toBe(true);
      expect(table.Properties.SSESpecification.KMSMasterKeyId).toEqual({
        Ref: 'SurveyDataKmsKey'
      });
    });

    test('S3 bucket should have encryption and security configuration', () => {
      const bucket = template.Resources.BackupBucket;
      expect(bucket.Properties.BucketEncryption).toBeDefined();
      expect(bucket.Properties.BucketEncryption.ServerSideEncryptionConfiguration[0].ServerSideEncryptionByDefault.SSEAlgorithm).toBe('aws:kms');
      expect(bucket.Properties.PublicAccessBlockConfiguration).toBeDefined();
      expect(bucket.Properties.PublicAccessBlockConfiguration.BlockPublicAcls).toBe(true);
    });

    test('API Gateway method should require API key', () => {
      const method = template.Resources.SubmitMethod;
      expect(method.Properties.ApiKeyRequired).toBe(true);
    });
  });

  describe('Security and Permissions Validation', () => {
    test('Lambda functions should have proper IAM role assignment', () => {
      const lambdaFunctions = ['SubmissionFunction', 'AggregationFunction', 'BackupFunction'];
      
      lambdaFunctions.forEach(funcName => {
        const func = template.Resources[funcName];
        expect(func.Properties.Role).toEqual({ 'Fn::GetAtt': ['LambdaExecutionRole', 'Arn'] });
      });
    });

    test('API Gateway should have proper Lambda permissions', () => {
      const permission = template.Resources.SubmissionFunctionPermission;
      expect(permission).toBeDefined();
      expect(permission.Type).toBe('AWS::Lambda::Permission');
      expect(permission.Properties.Principal).toBe('apigateway.amazonaws.com');
    });

    test('EventBridge should have proper Lambda permissions', () => {
      const aggregationPermission = template.Resources.AggregationFunctionPermission;
      const backupPermission = template.Resources.BackupFunctionPermission;
      
      expect(aggregationPermission).toBeDefined();
      expect(aggregationPermission.Properties.Principal).toBe('events.amazonaws.com');
      expect(backupPermission).toBeDefined();
      expect(backupPermission.Properties.Principal).toBe('events.amazonaws.com');
    });
  });

  describe('Dependency Validation', () => {
    test('API deployment should depend on method creation', () => {
      const deployment = template.Resources.ApiDeployment;
      expect(deployment.DependsOn).toBe('SubmitMethod');
    });

    test('API usage plan should depend on stage creation', () => {
      const usagePlan = template.Resources.ApiUsagePlan;
      expect(usagePlan.DependsOn).toBe('ApiStage');
    });
  });
});
