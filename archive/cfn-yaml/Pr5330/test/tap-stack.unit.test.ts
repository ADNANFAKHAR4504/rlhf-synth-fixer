import * as fs from 'fs';
import { yamlParse } from 'yaml-cfn';

const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';

describe('CloudFormation Payment Workflow Unit Tests', () => {
  let template: any;

  beforeAll(() => {
    const yamlContent = fs.readFileSync('./lib/TapStack.yml', 'utf8');
    template = yamlParse(yamlContent);
  });

  describe('Template Structure', () => {
    test('should have correct AWSTemplateFormatVersion', () => {
      expect(template.AWSTemplateFormatVersion).toBe('2010-09-09');
    });

    test('should have proper description', () => {
      expect(template.Description).toContain('Production-grade serverless payment workflow');
    });

    test('should have required parameters', () => {
      const requiredParams = ['Environment', 'NotificationEmail', 'TransactionRetentionDays', 'ApiThrottlingRateLimit', 'ValidatorConcurrency', 'StandardConcurrency', 'LogRetentionInDays'];
      requiredParams.forEach(param => {
        expect(template.Parameters).toHaveProperty(param);
      });
    });
  });

  describe('IAM Roles', () => {
    test('should have ValidatorLambdaRole with correct permissions', () => {
      const role = template.Resources.ValidatorLambdaRole;
      expect(role.Type).toBe('AWS::IAM::Role');
      expect(role.Properties.AssumeRolePolicyDocument.Statement[0].Principal.Service).toBe('lambda.amazonaws.com');

      const policies = role.Properties.Policies[0].PolicyDocument.Statement;
      const dynamodbActions = policies.find((stmt: any) =>
        Array.isArray(stmt.Action) ? stmt.Action.includes('dynamodb:PutItem') : stmt.Action === 'dynamodb:PutItem'
      );
      expect(dynamodbActions).toBeDefined();
      if (Array.isArray(dynamodbActions.Action)) {
        expect(dynamodbActions.Action).toContain('dynamodb:UpdateItem');
      }
    });

    test('should have FraudDetectorLambdaRole with correct permissions', () => {
      const role = template.Resources.FraudDetectorLambdaRole;
      expect(role.Type).toBe('AWS::IAM::Role');
      expect(role.Properties.ManagedPolicyArns.length).toBeGreaterThan(0);
      const xrayPolicy = role.Properties.ManagedPolicyArns.find((arn: any) =>
        (typeof arn === 'object' && arn['Fn::Sub'] && arn['Fn::Sub'].includes('AWSXrayWriteOnlyAccess')) ||
        (typeof arn === 'string' && arn.includes('AWSXrayWriteOnlyAccess'))
      );
      expect(xrayPolicy).toBeDefined();
    });

    test('should have SettlementLambdaRole with S3 and DynamoDB permissions', () => {
      const role = template.Resources.SettlementLambdaRole;
      const policies = role.Properties.Policies[0].PolicyDocument.Statement;

      const s3Actions = policies.find((stmt: any) =>
        Array.isArray(stmt.Action) ? stmt.Action.includes('s3:PutObject') : stmt.Action === 's3:PutObject'
      );
      const dynamoActions = policies.find((stmt: any) =>
        Array.isArray(stmt.Action) ? stmt.Action.includes('dynamodb:UpdateItem') : stmt.Action === 'dynamodb:UpdateItem'
      );

      expect(s3Actions).toBeDefined();
      expect(dynamoActions).toBeDefined();
    });

    test('should have NotificationLambdaRole with SNS permissions', () => {
      const role = template.Resources.NotificationLambdaRole;
      const policies = role.Properties.Policies[0].PolicyDocument.Statement;

      const snsActions = policies.find((stmt: any) =>
        Array.isArray(stmt.Action) ? stmt.Action.includes('sns:Publish') : stmt.Action === 'sns:Publish'
      );
      expect(snsActions).toBeDefined();
      expect(Array.isArray(snsActions.Resource) && snsActions.Resource.length).toBe(2);
    });

    test('should have StateMachineRole with proper Lambda and logging permissions', () => {
      const role = template.Resources.StateMachineRole;
      const policies = role.Properties.Policies[0].PolicyDocument.Statement;

      const lambdaActions = policies.find((stmt: any) =>
        Array.isArray(stmt.Action) ? stmt.Action.includes('lambda:InvokeFunction') : stmt.Action === 'lambda:InvokeFunction'
      );
      const logsActions = policies.find((stmt: any) =>
        Array.isArray(stmt.Action) ? stmt.Action.includes('logs:CreateLogStream') : stmt.Action === 'logs:CreateLogStream'
      );

      expect(lambdaActions).toBeDefined();
      expect(Array.isArray(lambdaActions.Resource) && lambdaActions.Resource.length).toBe(4);
      expect(logsActions).toBeDefined();
    });
  });

  describe('Lambda Functions', () => {
    test('should have ValidatorFunction with correct configuration', () => {
      const func = template.Resources.ValidatorFunction;
      expect(func.Type).toBe('AWS::Lambda::Function');
      expect(func.Properties.Runtime).toBe('python3.12');
      expect(func.Properties.MemorySize).toBe(512);
      expect(func.Properties.Timeout).toBe(30);
      expect(func.Properties.TracingConfig.Mode).toBe('Active');

      const envVars = func.Properties.Environment.Variables;
      expect(envVars).toHaveProperty('TRANSACTIONS_TABLE');
      expect(envVars).toHaveProperty('AUDIT_LOGS_TABLE');
      expect(envVars).toHaveProperty('ENVIRONMENT');
      expect(envVars).toHaveProperty('TTL_DAYS');
    });

    test('should have FraudDetectorFunction with reserved concurrency', () => {
      const func = template.Resources.FraudDetectorFunction;
      expect(func.Properties.ReservedConcurrentExecutions).toEqual({ Ref: 'StandardConcurrency' });
      expect(func.Properties.Handler).toBe('index.lambda_handler');
    });

    test('should have SettlementFunction with S3 bucket environment variable', () => {
      const func = template.Resources.SettlementFunction;
      expect(func.Properties.Environment.Variables).toHaveProperty('ARCHIVE_BUCKET');
      expect(func.Properties.Environment.Variables.ARCHIVE_BUCKET).toEqual({
        Ref: 'TransactionArchivesBucket'
      });
    });

    test('should have NotificationFunction with SNS topic environment variables', () => {
      const func = template.Resources.NotificationFunction;
      const envVars = func.Properties.Environment.Variables;
      expect(envVars).toHaveProperty('ALERTS_TOPIC');
      expect(envVars).toHaveProperty('FAILED_TRANSACTIONS_TOPIC');
    });

    test('should have all functions with X-Ray tracing enabled', () => {
      const functions = ['ValidatorFunction', 'FraudDetectorFunction', 'SettlementFunction', 'NotificationFunction'];
      functions.forEach(funcName => {
        const func = template.Resources[funcName];
        expect(func.Properties.TracingConfig.Mode).toBe('Active');
      });
    });
  });

  describe('DynamoDB Tables', () => {
    test('should have TransactionsTable with correct configuration', () => {
      const table = template.Resources.TransactionsTable;
      expect(table.Type).toBe('AWS::DynamoDB::Table');
      expect(table.Properties.BillingMode).toBe('PAY_PER_REQUEST');
      expect(table.Properties.PointInTimeRecoverySpecification.PointInTimeRecoveryEnabled).toBe(true);
      expect(table.Properties.SSESpecification.SSEEnabled).toBe(true);

      const gsi = table.Properties.GlobalSecondaryIndexes[0];
      expect(gsi.IndexName).toBe('MerchantIndex');
      expect(gsi.KeySchema[0].AttributeName).toBe('merchant_id');
    });

    test('should have AuditLogsTable with TTL configuration', () => {
      const table = template.Resources.AuditLogsTable;
      expect(table.Properties.TimeToLiveSpecification.AttributeName).toBe('ttl');
      expect(table.Properties.TimeToLiveSpecification.Enabled).toBe(true);
    });
  });

  describe('S3 Bucket', () => {
    test('should have TransactionArchivesBucket with proper security configuration', () => {
      const bucket = template.Resources.TransactionArchivesBucket;
      expect(bucket.Type).toBe('AWS::S3::Bucket');

      const encryption = bucket.Properties.BucketEncryption.ServerSideEncryptionConfiguration[0];
      expect(encryption.ServerSideEncryptionByDefault.SSEAlgorithm).toBe('AES256');

      const lifecycle = bucket.Properties.LifecycleConfiguration.Rules[0];
      expect(lifecycle.Transitions[0].TransitionInDays).toBe(30);
      expect(lifecycle.Transitions[0].StorageClass).toBe('GLACIER');

      const publicAccess = bucket.Properties.PublicAccessBlockConfiguration;
      expect(publicAccess.BlockPublicAcls).toBe(true);
      expect(publicAccess.BlockPublicPolicy).toBe(true);
      expect(publicAccess.IgnorePublicAcls).toBe(true);
      expect(publicAccess.RestrictPublicBuckets).toBe(true);
    });

    test('should have bucket policy enforcing HTTPS', () => {
      const policy = template.Resources.TransactionArchivesBucketPolicy;
      expect(policy.Type).toBe('AWS::S3::BucketPolicy');

      const statement = policy.Properties.PolicyDocument.Statement[0];
      expect(statement.Effect).toBe('Deny');
      expect(statement.Condition.Bool['aws:SecureTransport']).toBe(false);
    });
  });

  describe('SNS Topics', () => {
    test('should have AlertsTopic and FailedTransactionsTopic', () => {
      expect(template.Resources.AlertsTopic.Type).toBe('AWS::SNS::Topic');
      expect(template.Resources.FailedTransactionsTopic.Type).toBe('AWS::SNS::Topic');
    });

    test('should have email subscriptions for both topics', () => {
      const alertsSub = template.Resources.AlertsSubscription;
      expect(alertsSub.Properties.Protocol).toBe('email');
      expect(alertsSub.Properties.Endpoint).toEqual({ Ref: 'NotificationEmail' });

      const failedSub = template.Resources.FailedTransactionsSubscription;
      expect(failedSub.Properties.Protocol).toBe('email');
    });
  });

  describe('Step Functions', () => {
    test('should have PaymentWorkflow with correct configuration', () => {
      const stateMachine = template.Resources.PaymentWorkflow;
      expect(stateMachine.Type).toBe('AWS::StepFunctions::StateMachine');
      expect(stateMachine.Properties.StateMachineType).toBe('STANDARD');
      expect(stateMachine.Properties.TracingConfiguration.Enabled).toBe(true);

      const logging = stateMachine.Properties.LoggingConfiguration;
      expect(logging.Level).toBe('ALL');
      expect(logging.IncludeExecutionData).toBe(true);
    });

    test('should have correct state machine definition structure', () => {
      const definition = template.Resources.PaymentWorkflow.Properties.Definition;
      expect(definition.StartAt).toBe('ValidationAndFraudDetection');
      expect(definition.TimeoutSeconds).toBe(60);

      const parallelState = definition.States.ValidationAndFraudDetection;
      expect(parallelState.Type).toBe('Parallel');
      expect(parallelState.Branches).toHaveLength(2);

      const validationBranch = parallelState.Branches[0];
      expect(validationBranch.StartAt).toBe('ValidateTransaction');

      const fraudBranch = parallelState.Branches[1];
      expect(fraudBranch.StartAt).toBe('DetectFraud');
    });

    test('should have retry configuration for all tasks', () => {
      const definition = template.Resources.PaymentWorkflow.Properties.Definition;

      const validateTask = definition.States.ValidationAndFraudDetection.Branches[0].States.ValidateTransaction;
      expect(validateTask.Retry[0].MaxAttempts).toBe(3);
      expect(validateTask.Retry[0].BackoffRate).toBe(2);

      const settlementTask = definition.States.SettleTransaction;
      expect(settlementTask.Retry[0].MaxAttempts).toBe(3);
    });
  });

  describe('API Gateway', () => {
    test('should have PaymentApi with regional endpoint', () => {
      const api = template.Resources.PaymentApi;
      expect(api.Type).toBe('AWS::ApiGateway::RestApi');
      expect(api.Properties.EndpointConfiguration.Types[0]).toBe('REGIONAL');
      expect(api.Properties.ApiKeySourceType).toBe('HEADER');
    });

    test('should have usage plan with throttling configuration', () => {
      const usagePlan = template.Resources.ApiGatewayUsagePlan;
      expect(usagePlan.Properties.Throttle.RateLimit).toEqual({ Ref: 'ApiThrottlingRateLimit' });
      expect(usagePlan.Properties.Throttle.BurstLimit).toEqual({ Ref: 'ApiThrottlingRateLimit' });
    });

    test('should have transaction model with required fields', () => {
      const model = template.Resources.TransactionModel;
      expect(model.Properties.Schema.required).toContain('transaction_id');
      expect(model.Properties.Schema.required).toContain('merchant_id');
      expect(model.Properties.Schema.required).toContain('amount');
      expect(model.Properties.Schema.required).toContain('payment_method');
      expect(model.Properties.Schema.required).toContain('customer_id');

      expect(model.Properties.Schema.properties.amount.minimum).toBe(0.01);
    });

    test('should have POST method with API key required', () => {
      const method = template.Resources.TransactionPostMethod;
      expect(method.Properties.HttpMethod).toBe('POST');
      expect(method.Properties.ApiKeyRequired).toBe(true);
      expect(method.Properties.AuthorizationType).toBe('NONE');

      const integration = method.Properties.Integration;
      expect(integration.Type).toBe('AWS');
      expect(integration.IntegrationHttpMethod).toBe('POST');
    });

    test('should have API stage with X-Ray tracing enabled', () => {
      const stage = template.Resources.ApiStage;
      expect(stage.Properties.TracingEnabled).toBe(true);

      const methodSettings = stage.Properties.MethodSettings[0];
      expect(methodSettings.MetricsEnabled).toBe(true);
      expect(methodSettings.LoggingLevel).toBe('INFO');
    });
  });

  describe('CloudWatch Resources', () => {
    test('should have log groups for all Lambda functions', () => {
      const logGroups = ['ValidatorLogGroup', 'FraudDetectorLogGroup', 'SettlementLogGroup', 'NotificationLogGroup'];
      logGroups.forEach(logGroup => {
        const resource = template.Resources[logGroup];
        expect(resource.Type).toBe('AWS::Logs::LogGroup');
        expect(resource.Properties.RetentionInDays).toEqual({ Ref: 'LogRetentionInDays' });
      });
    });

    test('should have StateMachineLogGroup', () => {
      const logGroup = template.Resources.StateMachineLogGroup;
      expect(logGroup.Type).toBe('AWS::Logs::LogGroup');
    });

    test('should have metric filters for Lambda monitoring', () => {
      const errorFilter = template.Resources.LambdaErrorRateMetricFilter;
      expect(errorFilter.Type).toBe('AWS::Logs::MetricFilter');
      expect(errorFilter.Properties.FilterPattern).toBe('{ $.errorMessage = "*" }');

      const invocationFilter = template.Resources.LambdaInvocationMetricFilter;
      expect(invocationFilter.Properties.FilterPattern).toBe('');
    });

    test('should have CloudWatch alarms with proper configuration', () => {
      const errorAlarm = template.Resources.LambdaErrorRateAlarm;
      expect(errorAlarm.Type).toBe('AWS::CloudWatch::Alarm');
      expect(errorAlarm.Properties.Threshold).toBe(0.01);
      expect(errorAlarm.Properties.ComparisonOperator).toBe('GreaterThanThreshold');

      const apiAlarm = template.Resources.API4xxErrorsAlarm;
      expect(apiAlarm.Properties.MetricName).toBe('4XXError');
      expect(apiAlarm.Properties.Namespace).toBe('AWS/ApiGateway');
      expect(apiAlarm.Properties.Threshold).toBe(0.05);
    });
  });

  describe('Template Outputs', () => {
    test('should have all required outputs', () => {
      const requiredOutputs = [
        'ApiEndpoint',
        'StateMachineArn',
        'TransactionsTableArn',
        'AuditLogsTableArn',
        'TransactionArchivesBucketArn',
        'ApiKey'
      ];

      requiredOutputs.forEach(output => {
        expect(template.Outputs).toHaveProperty(output);
        expect(template.Outputs[output]).toHaveProperty('Description');
        expect(template.Outputs[output]).toHaveProperty('Value');
        expect(template.Outputs[output]).toHaveProperty('Export');
      });
    });
  });

  describe('Resource Naming Conventions', () => {
    test('should use consistent naming with stack name and environment', () => {
      const checkNaming = (resourceName: string, expectedPattern: RegExp) => {
        const resource = template.Resources[resourceName];
        if (resource && resource.Properties) {
          const nameProperty = resource.Properties.FunctionName ||
            resource.Properties.TableName ||
            resource.Properties.TopicName ||
            resource.Properties.StateMachineName ||
            resource.Properties.Name;
          if (nameProperty) {
            if (typeof nameProperty === 'object' && nameProperty['Fn::Sub']) {
              expect(nameProperty['Fn::Sub']).toMatch(expectedPattern);
            } else if (typeof nameProperty === 'string') {
              expect(nameProperty).toMatch(expectedPattern);
            }
          }
        }
      };

      checkNaming('ValidatorFunction', /.*validator.*/);
      checkNaming('TransactionsTable', /.*transactions.*/);
      checkNaming('PaymentWorkflow', /.*payment.*workflow.*/);
    });
  });

  describe('Security Configuration', () => {
    test('should have proper IAM role trust policies', () => {
      const roles = ['ValidatorLambdaRole', 'FraudDetectorLambdaRole', 'SettlementLambdaRole', 'NotificationLambdaRole'];
      roles.forEach(roleName => {
        const role = template.Resources[roleName];
        const trustPolicy = role.Properties.AssumeRolePolicyDocument;
        expect(trustPolicy.Statement[0].Principal.Service).toBe('lambda.amazonaws.com');
        expect(trustPolicy.Statement[0].Effect).toBe('Allow');
      });
    });

    test('should have StateMachineRole trust policy for states service', () => {
      const role = template.Resources.StateMachineRole;
      const trustPolicy = role.Properties.AssumeRolePolicyDocument;
      expect(trustPolicy.Statement[0].Principal.Service).toBe('states.amazonaws.com');
    });

    test('should have least privilege IAM policies', () => {
      const validatorRole = template.Resources.ValidatorLambdaRole;
      const policies = validatorRole.Properties.Policies[0].PolicyDocument.Statement;

      const dynamoPolicy = policies.find((stmt: any) =>
        Array.isArray(stmt.Action) ? stmt.Action.includes('dynamodb:PutItem') : stmt.Action === 'dynamodb:PutItem'
      );
      expect(dynamoPolicy.Resource).toBeDefined();
      expect(dynamoPolicy.Action).toBeDefined();
    });
  });

  describe('Performance and Scalability', () => {
    test('should have appropriate Lambda memory and timeout settings', () => {
      const functions = ['ValidatorFunction', 'FraudDetectorFunction', 'SettlementFunction', 'NotificationFunction'];
      functions.forEach(funcName => {
        const func = template.Resources[funcName];
        expect(func.Properties.MemorySize).toBe(512);
        expect(func.Properties.Timeout).toBe(30);
      });
    });

    test('should have reserved concurrency configuration', () => {
      const validator = template.Resources.ValidatorFunction;
      expect(validator.Properties.ReservedConcurrentExecutions).toEqual({ Ref: 'ValidatorConcurrency' });

      const others = ['FraudDetectorFunction', 'SettlementFunction', 'NotificationFunction'];
      others.forEach(funcName => {
        const func = template.Resources[funcName];
        expect(func.Properties.ReservedConcurrentExecutions).toEqual({ Ref: 'StandardConcurrency' });
      });
    });

    test('should use DynamoDB on-demand billing', () => {
      const tables = ['TransactionsTable', 'AuditLogsTable'];
      tables.forEach(tableName => {
        const table = template.Resources[tableName];
        expect(table.Properties.BillingMode).toBe('PAY_PER_REQUEST');
      });
    });
  });

  describe('Monitoring and Observability', () => {
    test('should have comprehensive X-Ray tracing', () => {
      const functions = ['ValidatorFunction', 'FraudDetectorFunction', 'SettlementFunction', 'NotificationFunction'];
      functions.forEach(funcName => {
        const func = template.Resources[funcName];
        expect(func.Properties.TracingConfig.Mode).toBe('Active');
      });

      const stateMachine = template.Resources.PaymentWorkflow;
      expect(stateMachine.Properties.TracingConfiguration.Enabled).toBe(true);

      const apiStage = template.Resources.ApiStage;
      expect(apiStage.Properties.TracingEnabled).toBe(true);
    });

    test('should have proper CloudWatch logging configuration', () => {
      const stateMachine = template.Resources.PaymentWorkflow;
      const logging = stateMachine.Properties.LoggingConfiguration;
      expect(logging.Level).toBe('ALL');
      expect(logging.IncludeExecutionData).toBe(true);
    });
  });
});
