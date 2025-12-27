import fs from 'fs';
import path from 'path';

describe('TapStack CloudFormation Template', () => {
  let template: any;

  beforeAll(() => {
    const templatePath = path.join(__dirname, '../lib/TapStack.json');
    if (!fs.existsSync(templatePath)) {
      throw new Error(`Template file not found at ${templatePath}. If your YAML is the source, run 'pipenv run cfn-flip lib/TapStack.yml >lib/TapStack.json' first.`);
    }
    const templateContent = fs.readFileSync(templatePath, 'utf8');
    template = JSON.parse(templateContent);
  });

  describe('Template Structure', () => {
    test('should have a valid CloudFormation format version', () => {
      expect(template.AWSTemplateFormatVersion).toBe('2010-09-09');
    });

    test('should have the correct description', () => {
      expect(template.Description).toBe('Serverless Transaction Processing Pipeline with API Gateway, Lambda, Step Functions, DynamoDB, and EventBridge');
    });

    test('should contain Parameters, Resources, and Outputs sections', () => {
      expect(template.Parameters).toBeDefined();
      expect(template.Resources).toBeDefined();
      expect(template.Outputs).toBeDefined();
    });
  });

  describe('Parameters', () => {
    test('should define all required parameters', () => {
      expect(template.Parameters.AllowedCORSDomain).toBeDefined();
      expect(template.Parameters.Environment).toBeDefined();
    });

    test('AllowedCORSDomain parameter should have correct properties', () => {
      const param = template.Parameters.AllowedCORSDomain;
      expect(param.Type).toBe('String');
      expect(param.Default).toBe('https://example.com');
      expect(param.Description).toBe('Allowed domain for CORS configuration');
    });

    test('Environment parameter should have correct properties and allowed values', () => {
      const param = template.Parameters.Environment;
      expect(param.Type).toBe('String');
      expect(param.Default).toBe('production');
      expect(param.Description).toBe('Environment name');
      expect(param.AllowedValues).toEqual(['development', 'staging', 'production']);
    });
  });

  describe('KMS Resources', () => {
    test('TransactionKMSKey should be defined', () => {
      const key = template.Resources.TransactionKMSKey;
      expect(key).toBeDefined();
      expect(key.Type).toBe('AWS::KMS::Key');
      expect(key.Properties.Description).toBe('KMS key for encrypting Lambda environment variables');
    });

    test('TransactionKMSKey policy should grant admin permissions to root', () => {
      const policy = template.Resources.TransactionKMSKey.Properties.KeyPolicy;
      const rootStatement = policy.Statement.find((s: any) => s.Sid === 'Enable IAM User Permissions');
      expect(rootStatement).toBeDefined();
      expect(rootStatement.Effect).toBe('Allow');
      expect(rootStatement.Principal.AWS['Fn::Sub']).toBe('arn:aws:iam::${AWS::AccountId}:root');
      expect(rootStatement.Action).toBe('kms:*');
      expect(rootStatement.Resource).toBe('*');
    });

    test('TransactionKMSKey policy should allow Lambda to use the key', () => {
      const policy = template.Resources.TransactionKMSKey.Properties.KeyPolicy;
      const lambdaStatement = policy.Statement.find((s: any) => s.Sid === 'Allow Lambda Functions to use the key');
      expect(lambdaStatement).toBeDefined();
      expect(lambdaStatement.Effect).toBe('Allow');
      expect(lambdaStatement.Principal.Service).toBe('lambda.amazonaws.com');
      expect(lambdaStatement.Action).toEqual(['kms:Decrypt', 'kms:GenerateDataKey']);
    });

    test('TransactionKMSKeyAlias should be defined with correct naming', () => {
      const alias = template.Resources.TransactionKMSKeyAlias;
      expect(alias).toBeDefined();
      expect(alias.Type).toBe('AWS::KMS::Alias');
      expect(alias.Properties.AliasName).toBe('alias/transaction-processing-key');
      expect(alias.Properties.TargetKeyId).toEqual({ Ref: 'TransactionKMSKey' });
    });
  });

  describe('DynamoDB Tables', () => {
    test('TransactionsTable should be defined with correct properties', () => {
      const table = template.Resources.TransactionsTable;
      expect(table).toBeDefined();
      expect(table.Type).toBe('AWS::DynamoDB::Table');
      expect(table.Properties.TableName).toEqual({ 'Fn::Sub': '${AWS::StackName}-Transactions' });
      expect(table.Properties.BillingMode).toBe('PAY_PER_REQUEST');
    });

    test('TransactionsTable should have correct key schema', () => {
      const table = template.Resources.TransactionsTable.Properties;
      expect(table.KeySchema).toEqual([
        { AttributeName: 'transactionId', KeyType: 'HASH' },
        { AttributeName: 'timestamp', KeyType: 'RANGE' }
      ]);
    });

    test('TransactionsTable should have correct attribute definitions', () => {
      const table = template.Resources.TransactionsTable.Properties;
      expect(table.AttributeDefinitions).toEqual([
        { AttributeName: 'transactionId', AttributeType: 'S' },
        { AttributeName: 'timestamp', AttributeType: 'N' }
      ]);
    });

    test('TransactionsTable should have SSE and point-in-time recovery enabled', () => {
      const table = template.Resources.TransactionsTable.Properties;
      expect(table.SSESpecification.SSEEnabled).toBe(true);
      expect(table.PointInTimeRecoverySpecification.PointInTimeRecoveryEnabled).toBe(true);
    });

    test('TransactionsTable should have DynamoDB streams enabled', () => {
      const table = template.Resources.TransactionsTable.Properties;
      expect(table.StreamSpecification.StreamViewType).toBe('NEW_AND_OLD_IMAGES');
    });

    test('FraudPatternsTable should be defined with provisioned billing', () => {
      const table = template.Resources.FraudPatternsTable;
      expect(table).toBeDefined();
      expect(table.Type).toBe('AWS::DynamoDB::Table');
      expect(table.Properties.BillingMode).toBe('PROVISIONED');
      expect(table.Properties.ProvisionedThroughput.ReadCapacityUnits).toBe(100);
      expect(table.Properties.ProvisionedThroughput.WriteCapacityUnits).toBe(100);
    });

    test('FraudPatternsTable should have correct key schema', () => {
      const table = template.Resources.FraudPatternsTable.Properties;
      expect(table.KeySchema).toEqual([
        { AttributeName: 'patternId', KeyType: 'HASH' },
        { AttributeName: 'riskScore', KeyType: 'RANGE' }
      ]);
    });
  });

  describe('SQS Dead Letter Queues', () => {
    test('should have all DLQ resources defined', () => {
      expect(template.Resources.TransactionValidatorDLQ).toBeDefined();
      expect(template.Resources.FraudDetectorDLQ).toBeDefined();
      expect(template.Resources.AuditLoggerDLQ).toBeDefined();
    });

    test('DLQs should have correct retention period and encryption', () => {
      const dlqs = ['TransactionValidatorDLQ', 'FraudDetectorDLQ', 'AuditLoggerDLQ'];
      dlqs.forEach(dlqName => {
        const dlq = template.Resources[dlqName];
        expect(dlq.Type).toBe('AWS::SQS::Queue');
        expect(dlq.Properties.MessageRetentionPeriod).toBe(1209600); // 14 days
        expect(dlq.Properties.KmsMasterKeyId).toBe('alias/aws/sqs');
      });
    });
  });

  describe('IAM Roles', () => {
    test('TransactionValidatorRole should have correct managed policies', () => {
      const role = template.Resources.TransactionValidatorRole;
      expect(role.Properties.ManagedPolicyArns).toContain('arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole');
      expect(role.Properties.ManagedPolicyArns).toContain('arn:aws:iam::aws:policy/AWSXRayDaemonWriteAccess');
    });

    test('TransactionValidatorRole should have DynamoDB permissions', () => {
      const role = template.Resources.TransactionValidatorRole.Properties;
      const policy = role.Policies.find((p: any) => p.PolicyName === 'TransactionValidatorPolicy');
      expect(policy).toBeDefined();
      const dynamoStatement = policy.PolicyDocument.Statement.find((s: any) =>
        s.Action && s.Action.includes('dynamodb:GetItem')
      );
      expect(dynamoStatement.Action).toEqual(expect.arrayContaining([
        'dynamodb:GetItem',
        'dynamodb:PutItem',
        'dynamodb:Query'
      ]));
    });

    test('FraudDetectorRole should have access to both DynamoDB tables', () => {
      const role = template.Resources.FraudDetectorRole.Properties;
      const policy = role.Policies.find((p: any) => p.PolicyName === 'FraudDetectorPolicy');
      expect(policy).toBeDefined();
      const statements = policy.PolicyDocument.Statement;

      const fraudPatternsStatement = statements.find((s: any) =>
        s.Resource && Array.isArray(s.Resource) &&
        s.Resource.some((r: any) => r['Fn::GetAtt'] && r['Fn::GetAtt'][0] === 'FraudPatternsTable')
      );
      expect(fraudPatternsStatement).toBeDefined();

      const transactionsStatement = statements.find((s: any) =>
        s.Action && s.Action.includes('dynamodb:UpdateItem')
      );
      expect(transactionsStatement).toBeDefined();
    });

    test('AuditLoggerRole should have necessary permissions', () => {
      const role = template.Resources.AuditLoggerRole.Properties;
      expect(role.ManagedPolicyArns).toContain('arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole');
      const policy = role.Policies.find((p: any) => p.PolicyName === 'AuditLoggerPolicy');
      expect(policy).toBeDefined();
    });

    test('StateMachineRole should have Lambda invoke permissions', () => {
      const role = template.Resources.StateMachineRole.Properties;
      const policy = role.Policies.find((p: any) => p.PolicyName === 'StateMachinePolicy');
      const lambdaStatement = policy.PolicyDocument.Statement.find((s: any) =>
        s.Action && s.Action.includes('lambda:InvokeFunction')
      );
      expect(lambdaStatement).toBeDefined();
      expect(lambdaStatement.Resource).toHaveLength(3);
    });

    test('APIGatewayStepFunctionsRole should have StartExecution permission', () => {
      const role = template.Resources.APIGatewayStepFunctionsRole.Properties;
      const policy = role.Policies.find((p: any) => p.PolicyName === 'StepFunctionsExecutionPolicy');
      expect(policy).toBeDefined();
      const statement = policy.PolicyDocument.Statement[0];
      expect(statement.Action).toEqual(['states:StartExecution']);
    });
  });

  describe('Lambda Functions', () => {
    test('TransactionValidatorLambda should be configured correctly', () => {
      const lambda = template.Resources.TransactionValidatorLambda.Properties;
      expect(lambda.Runtime).toBe('python3.11');
      expect(lambda.Architectures).toEqual(['arm64']);
      expect(lambda.Handler).toBe('index.handler');
      expect(lambda.MemorySize).toBe(256);
      expect(lambda.Timeout).toBe(30);
      expect(lambda.ReservedConcurrentExecutions).toBe(100);
    });

    test('TransactionValidatorLambda should have X-Ray tracing enabled', () => {
      const lambda = template.Resources.TransactionValidatorLambda.Properties;
      expect(lambda.TracingConfig.Mode).toBe('Active');
    });

    test('TransactionValidatorLambda should have correct environment variables', () => {
      const lambda = template.Resources.TransactionValidatorLambda.Properties;
      expect(lambda.Environment.Variables.TRANSACTIONS_TABLE).toEqual({ Ref: 'TransactionsTable' });
      expect(lambda.Environment.Variables.ENVIRONMENT).toEqual({ Ref: 'Environment' });
    });

    test('TransactionValidatorLambda should have DLQ configured', () => {
      const lambda = template.Resources.TransactionValidatorLambda.Properties;
      expect(lambda.DeadLetterConfig.TargetArn).toEqual({ 'Fn::GetAtt': ['TransactionValidatorDLQ', 'Arn'] });
    });

    test('TransactionValidatorLambda should have KMS encryption', () => {
      const lambda = template.Resources.TransactionValidatorLambda.Properties;
      expect(lambda.KmsKeyArn).toEqual({ 'Fn::GetAtt': ['TransactionKMSKey', 'Arn'] });
    });

    test('FraudDetectorLambda should be configured with higher memory', () => {
      const lambda = template.Resources.FraudDetectorLambda.Properties;
      expect(lambda.MemorySize).toBe(512);
      expect(lambda.ReservedConcurrentExecutions).toBe(50);
      expect(lambda.Runtime).toBe('python3.11');
    });

    test('FraudDetectorLambda should have access to both tables', () => {
      const lambda = template.Resources.FraudDetectorLambda.Properties;
      expect(lambda.Environment.Variables.FRAUD_PATTERNS_TABLE).toEqual({ Ref: 'FraudPatternsTable' });
      expect(lambda.Environment.Variables.TRANSACTIONS_TABLE).toEqual({ Ref: 'TransactionsTable' });
    });

    test('AuditLoggerLambda should have minimal resource allocation', () => {
      const lambda = template.Resources.AuditLoggerLambda.Properties;
      expect(lambda.MemorySize).toBe(128);
      expect(lambda.ReservedConcurrentExecutions).toBe(25);
    });

    test('all Lambda functions should have inline code', () => {
      expect(template.Resources.TransactionValidatorLambda.Properties.Code.ZipFile).toBeDefined();
      expect(template.Resources.FraudDetectorLambda.Properties.Code.ZipFile).toBeDefined();
      expect(template.Resources.AuditLoggerLambda.Properties.Code.ZipFile).toBeDefined();
    });
  });

  describe('CloudWatch Log Groups', () => {
    test('should have log groups for all Lambda functions', () => {
      expect(template.Resources.TransactionValidatorLogGroup).toBeDefined();
      expect(template.Resources.FraudDetectorLogGroup).toBeDefined();
      expect(template.Resources.AuditLoggerLogGroup).toBeDefined();
    });

    test('Lambda log groups should have 7 day retention', () => {
      const logGroups = ['TransactionValidatorLogGroup', 'FraudDetectorLogGroup', 'AuditLoggerLogGroup'];
      logGroups.forEach(logGroupName => {
        const logGroup = template.Resources[logGroupName];
        expect(logGroup.Type).toBe('AWS::Logs::LogGroup');
        expect(logGroup.Properties.RetentionInDays).toBe(7);
      });
    });

    test('StateMachineLogGroup should be defined', () => {
      const logGroup = template.Resources.StateMachineLogGroup;
      expect(logGroup).toBeDefined();
      expect(logGroup.Properties.RetentionInDays).toBe(7);
    });

    test('APILogGroup should have 30 day retention', () => {
      const logGroup = template.Resources.APILogGroup;
      expect(logGroup).toBeDefined();
      expect(logGroup.Properties.RetentionInDays).toBe(30);
    });
  });

  describe('Step Functions State Machine', () => {
    test('TransactionProcessingStateMachine should be defined', () => {
      const stateMachine = template.Resources.TransactionProcessingStateMachine;
      expect(stateMachine).toBeDefined();
      expect(stateMachine.Type).toBe('AWS::StepFunctions::StateMachine');
    });

    test('State machine should have X-Ray tracing enabled', () => {
      const stateMachine = template.Resources.TransactionProcessingStateMachine.Properties;
      expect(stateMachine.TracingConfiguration.Enabled).toBe(true);
    });

    test('State machine should have comprehensive logging', () => {
      const stateMachine = template.Resources.TransactionProcessingStateMachine.Properties;
      expect(stateMachine.LoggingConfiguration.Level).toBe('ALL');
      expect(stateMachine.LoggingConfiguration.IncludeExecutionData).toBe(true);
    });

    test('State machine definition should contain all required states', () => {
      const stateMachine = template.Resources.TransactionProcessingStateMachine.Properties;
      const definition = JSON.parse(stateMachine.DefinitionString['Fn::Sub']);
      expect(definition.States.ValidateTransaction).toBeDefined();
      expect(definition.States.CheckValidation).toBeDefined();
      expect(definition.States.ParallelProcessing).toBeDefined();
      expect(definition.States.ProcessingComplete).toBeDefined();
      expect(definition.States.ValidationFailed).toBeDefined();
      expect(definition.States.HandleError).toBeDefined();
    });

    test('State machine should have parallel fraud detection and audit logging', () => {
      const stateMachine = template.Resources.TransactionProcessingStateMachine.Properties;
      const definition = JSON.parse(stateMachine.DefinitionString['Fn::Sub']);
      expect(definition.States.ParallelProcessing.Type).toBe('Parallel');
      expect(definition.States.ParallelProcessing.Branches).toHaveLength(2);
    });
  });

  describe('API Gateway', () => {
    test('TransactionAPI should be defined as regional', () => {
      const api = template.Resources.TransactionAPI;
      expect(api).toBeDefined();
      expect(api.Type).toBe('AWS::ApiGateway::RestApi');
      expect(api.Properties.Description).toBe('Transaction Processing REST API');
      expect(api.Properties.EndpointConfiguration.Types).toEqual(['REGIONAL']);
    });

    test('APIGatewayAccount should be configured for CloudWatch', () => {
      const account = template.Resources.APIGatewayAccount;
      expect(account).toBeDefined();
      expect(account.Properties.CloudWatchRoleArn).toEqual({ 'Fn::GetAtt': ['APIGatewayCloudWatchRole', 'Arn'] });
    });

    test('TransactionRequestValidator should validate body and parameters', () => {
      const validator = template.Resources.TransactionRequestValidator;
      expect(validator.Properties.ValidateRequestBody).toBe(true);
      expect(validator.Properties.ValidateRequestParameters).toBe(true);
    });

    test('TransactionModel should have correct JSON schema', () => {
      const model = template.Resources.TransactionModel.Properties;
      expect(model.ContentType).toBe('application/json');
      expect(model.Schema.required).toEqual(['transactionId', 'amount', 'currency', 'timestamp']);
      expect(model.Schema.properties.transactionId.type).toBe('string');
      expect(model.Schema.properties.amount.type).toBe('number');
      expect(model.Schema.properties.amount.minimum).toBe(0);
    });

    test('TransactionResource should be defined at /transactions path', () => {
      const resource = template.Resources.TransactionResource;
      expect(resource.Properties.PathPart).toBe('transactions');
    });

    test('TransactionMethod should use IAM authorization', () => {
      const method = template.Resources.TransactionMethod.Properties;
      expect(method.HttpMethod).toBe('POST');
      expect(method.AuthorizationType).toBe('AWS_IAM');
    });

    test('TransactionMethod should integrate with Step Functions', () => {
      const method = template.Resources.TransactionMethod.Properties;
      expect(method.Integration.Type).toBe('AWS');
      expect(method.Integration.IntegrationHttpMethod).toBe('POST');
      expect(method.Integration.Uri).toEqual({
        'Fn::Sub': 'arn:aws:apigateway:${AWS::Region}:states:action/StartExecution'
      });
    });

    test('TransactionOptionsMethod should handle CORS preflight', () => {
      const method = template.Resources.TransactionOptionsMethod.Properties;
      expect(method.HttpMethod).toBe('OPTIONS');
      expect(method.AuthorizationType).toBe('NONE');
      expect(method.Integration.Type).toBe('MOCK');
    });

    test('APIDeployment should have comprehensive configuration', () => {
      const deployment = template.Resources.APIDeployment.Properties;
      expect(deployment.StageDescription.TracingEnabled).toBe(true);
      expect(deployment.StageDescription.LoggingLevel).toBe('INFO');
      expect(deployment.StageDescription.DataTraceEnabled).toBe(true);
      expect(deployment.StageDescription.MetricsEnabled).toBe(true);
      expect(deployment.StageDescription.ThrottlingBurstLimit).toBe(10000);
      expect(deployment.StageDescription.ThrottlingRateLimit).toBe(10000);
    });
  });

  describe('EventBridge', () => {
    test('TransactionCompleteEventRule should be defined', () => {
      const rule = template.Resources.TransactionCompleteEventRule;
      expect(rule).toBeDefined();
      expect(rule.Type).toBe('AWS::Events::Rule');
      expect(rule.Properties.State).toBe('ENABLED');
    });

    test('Event rule should listen for Step Functions completion', () => {
      const rule = template.Resources.TransactionCompleteEventRule.Properties;
      expect(rule.EventPattern.source).toEqual(['aws.states']);
      expect(rule.EventPattern['detail-type']).toEqual(['Step Functions Execution Status Change']);
      expect(rule.EventPattern.detail.status).toEqual(['SUCCEEDED']);
    });

    test('Event rule should target AuditLogger Lambda', () => {
      const rule = template.Resources.TransactionCompleteEventRule.Properties;
      expect(rule.Targets).toHaveLength(1);
      expect(rule.Targets[0].Arn).toEqual({ 'Fn::GetAtt': ['AuditLoggerLambda', 'Arn'] });
      expect(rule.Targets[0].RetryPolicy.MaximumRetryAttempts).toBe(2);
    });

    test('PermissionForEventsToInvokeLambda should be configured', () => {
      const permission = template.Resources.PermissionForEventsToInvokeLambda;
      expect(permission).toBeDefined();
      expect(permission.Properties.Action).toBe('lambda:InvokeFunction');
      expect(permission.Properties.Principal).toBe('events.amazonaws.com');
    });
  });

  describe('Outputs', () => {
    test('should define all required outputs', () => {
      const expectedOutputs = [
        'APIEndpoint',
        'StateMachineArn',
        'TransactionsTableName',
        'FraudPatternsTableName'
      ];
      expectedOutputs.forEach(output => {
        expect(template.Outputs[output]).toBeDefined();
      });
    });

    test('APIEndpoint should output complete URL', () => {
      const output = template.Outputs.APIEndpoint;
      expect(output.Description).toBe('API Gateway endpoint URL');
      expect(output.Value).toEqual({
        'Fn::Sub': 'https://${TransactionAPI}.execute-api.${AWS::Region}.amazonaws.com/${Environment}'
      });
      expect(output.Export.Name).toEqual({ 'Fn::Sub': '${AWS::StackName}-APIEndpoint' });
    });

    test('StateMachineArn should output state machine reference', () => {
      const output = template.Outputs.StateMachineArn;
      expect(output.Description).toBe('Step Functions State Machine ARN');
      expect(output.Value).toEqual({ Ref: 'TransactionProcessingStateMachine' });
    });

    test('TransactionsTableName should output table reference', () => {
      const output = template.Outputs.TransactionsTableName;
      expect(output.Description).toBe('DynamoDB Transactions table name');
      expect(output.Value).toEqual({ Ref: 'TransactionsTable' });
    });

    test('FraudPatternsTableName should output table reference', () => {
      const output = template.Outputs.FraudPatternsTableName;
      expect(output.Description).toBe('DynamoDB Fraud Patterns table name');
      expect(output.Value).toEqual({ Ref: 'FraudPatternsTable' });
    });

    test('all outputs should have exports', () => {
      Object.keys(template.Outputs).forEach(outputKey => {
        const output = template.Outputs[outputKey];
        expect(output.Export).toBeDefined();
        expect(output.Export.Name).toBeDefined();
      });
    });
  });

  describe('Resource Dependencies and References', () => {
    test('Lambda functions should reference their respective roles', () => {
      expect(template.Resources.TransactionValidatorLambda.Properties.Role).toEqual({
        'Fn::GetAtt': ['TransactionValidatorRole', 'Arn']
      });
      expect(template.Resources.FraudDetectorLambda.Properties.Role).toEqual({
        'Fn::GetAtt': ['FraudDetectorRole', 'Arn']
      });
      expect(template.Resources.AuditLoggerLambda.Properties.Role).toEqual({
        'Fn::GetAtt': ['AuditLoggerRole', 'Arn']
      });
    });

    test('State machine should reference StateMachineRole', () => {
      const stateMachine = template.Resources.TransactionProcessingStateMachine.Properties;
      expect(stateMachine.RoleArn).toEqual({ 'Fn::GetAtt': ['StateMachineRole', 'Arn'] });
    });

    test('APIDeployment should depend on methods', () => {
      const deployment = template.Resources.APIDeployment;
      expect(deployment.DependsOn).toContain('TransactionMethod');
      expect(deployment.DependsOn).toContain('TransactionOptionsMethod');
    });
  });

  describe('Security Best Practices', () => {
    test('all DynamoDB tables should have encryption enabled', () => {
      expect(template.Resources.TransactionsTable.Properties.SSESpecification.SSEEnabled).toBe(true);
      expect(template.Resources.FraudPatternsTable.Properties.SSESpecification.SSEEnabled).toBe(true);
    });

    test('all Lambda functions should use KMS encryption', () => {
      const lambdas = ['TransactionValidatorLambda', 'FraudDetectorLambda', 'AuditLoggerLambda'];
      lambdas.forEach(lambdaName => {
        const lambda = template.Resources[lambdaName];
        expect(lambda.Properties.KmsKeyArn).toBeDefined();
      });
    });

    test('all Lambda functions should have X-Ray tracing enabled', () => {
      const lambdas = ['TransactionValidatorLambda', 'FraudDetectorLambda', 'AuditLoggerLambda'];
      lambdas.forEach(lambdaName => {
        const lambda = template.Resources[lambdaName];
        expect(lambda.Properties.TracingConfig.Mode).toBe('Active');
      });
    });

    test('API Gateway should have throttling configured', () => {
      const deployment = template.Resources.APIDeployment.Properties;
      expect(deployment.StageDescription.ThrottlingBurstLimit).toBeGreaterThan(0);
      expect(deployment.StageDescription.ThrottlingRateLimit).toBeGreaterThan(0);
    });

    test('all SQS queues should have encryption', () => {
      const queues = ['TransactionValidatorDLQ', 'FraudDetectorDLQ', 'AuditLoggerDLQ'];
      queues.forEach(queueName => {
        const queue = template.Resources[queueName];
        expect(queue.Properties.KmsMasterKeyId).toBeDefined();
      });
    });
  });
});
