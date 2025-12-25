import fs from 'fs';
import path from 'path';

const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';

describe('TapStack CloudFormation Template - Cryptocurrency Webhook Processing System', () => {
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

    test('should have correct description', () => {
      expect(template.Description).toBeDefined();
      expect(template.Description).toBe(
        'Serverless Cryptocurrency Webhook Processing System'
      );
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
      expect(envSuffixParam.Description).toBe(
        'Environment suffix for resource naming (e.g., dev, staging, prod)'
      );
      expect(envSuffixParam.AllowedPattern).toBe('^[a-zA-Z0-9]+$');
      expect(envSuffixParam.ConstraintDescription).toBe(
        'Must contain only alphanumeric characters'
      );
    });
  });

  describe('KMS Resources', () => {
    test('should have LambdaEncryptionKey resource', () => {
      expect(template.Resources.LambdaEncryptionKey).toBeDefined();
    });

    test('LambdaEncryptionKey should be a KMS Key', () => {
      const key = template.Resources.LambdaEncryptionKey;
      expect(key.Type).toBe('AWS::KMS::Key');
    });

    test('LambdaEncryptionKey should have correct deletion policies', () => {
      const key = template.Resources.LambdaEncryptionKey;
      expect(key.DeletionPolicy).toBe('Delete');
      expect(key.UpdateReplacePolicy).toBe('Delete');
    });

    test('LambdaEncryptionKey should have correct key policy', () => {
      const key = template.Resources.LambdaEncryptionKey;
      const keyPolicy = key.Properties.KeyPolicy;
      expect(keyPolicy.Version).toBe('2012-10-17');
      expect(keyPolicy.Statement).toBeDefined();
      expect(keyPolicy.Statement.length).toBeGreaterThanOrEqual(2);
    });

    test('LambdaEncryptionKey should allow Lambda service to use it', () => {
      const key = template.Resources.LambdaEncryptionKey;
      const lambdaStatement = key.Properties.KeyPolicy.Statement.find(
        (stmt: any) => stmt.Sid === 'Allow Lambda to use the key'
      );
      expect(lambdaStatement).toBeDefined();
      expect(lambdaStatement.Principal.Service).toBe('lambda.amazonaws.com');
      expect(lambdaStatement.Action).toContain('kms:Decrypt');
      expect(lambdaStatement.Action).toContain('kms:DescribeKey');
    });

    test('should have LambdaEncryptionKeyAlias resource', () => {
      expect(template.Resources.LambdaEncryptionKeyAlias).toBeDefined();
    });

    test('LambdaEncryptionKeyAlias should reference LambdaEncryptionKey', () => {
      const alias = template.Resources.LambdaEncryptionKeyAlias;
      expect(alias.Type).toBe('AWS::KMS::Alias');
      expect(alias.Properties.TargetKeyId).toEqual({
        Ref: 'LambdaEncryptionKey',
      });
      expect(alias.Properties.AliasName).toEqual({
        'Fn::Sub': 'alias/lambda-webhook-${EnvironmentSuffix}',
      });
    });
  });

  describe('DynamoDB Resources', () => {
    test('should have TransactionTable resource', () => {
      expect(template.Resources.TransactionTable).toBeDefined();
    });

    test('TransactionTable should be a DynamoDB table', () => {
      const table = template.Resources.TransactionTable;
      expect(table.Type).toBe('AWS::DynamoDB::Table');
    });

    test('TransactionTable should have correct deletion policies', () => {
      const table = template.Resources.TransactionTable;
      expect(table.DeletionPolicy).toBe('Delete');
      expect(table.UpdateReplacePolicy).toBe('Delete');
    });

    test('TransactionTable should include EnvironmentSuffix in name', () => {
      const table = template.Resources.TransactionTable;
      expect(table.Properties.TableName).toEqual({
        'Fn::Sub': 'crypto-transactions-${EnvironmentSuffix}',
      });
    });

    test('TransactionTable should have correct key schema', () => {
      const table = template.Resources.TransactionTable;
      const keySchema = table.Properties.KeySchema;
      expect(keySchema).toHaveLength(2);

      const hashKey = keySchema.find((k: any) => k.KeyType === 'HASH');
      const rangeKey = keySchema.find((k: any) => k.KeyType === 'RANGE');

      expect(hashKey.AttributeName).toBe('transactionId');
      expect(rangeKey.AttributeName).toBe('timestamp');
    });

    test('TransactionTable should have correct attribute definitions', () => {
      const table = template.Resources.TransactionTable;
      const attrs = table.Properties.AttributeDefinitions;
      expect(attrs).toHaveLength(2);

      const transactionIdAttr = attrs.find(
        (a: any) => a.AttributeName === 'transactionId'
      );
      const timestampAttr = attrs.find(
        (a: any) => a.AttributeName === 'timestamp'
      );

      expect(transactionIdAttr.AttributeType).toBe('S');
      expect(timestampAttr.AttributeType).toBe('N');
    });

    test('TransactionTable should use PAY_PER_REQUEST billing', () => {
      const table = template.Resources.TransactionTable;
      expect(table.Properties.BillingMode).toBe('PAY_PER_REQUEST');
    });

    test('TransactionTable should have point-in-time recovery enabled', () => {
      const table = template.Resources.TransactionTable;
      expect(
        table.Properties.PointInTimeRecoverySpecification
          .PointInTimeRecoveryEnabled
      ).toBe(true);
    });

    test('TransactionTable should have encryption enabled', () => {
      const table = template.Resources.TransactionTable;
      expect(table.Properties.SSESpecification.SSEEnabled).toBe(true);
      // SSEType should be undefined to use AWS-managed encryption (not customer-managed KMS)
      expect(table.Properties.SSESpecification.SSEType).toBeUndefined();
    });

    test('TransactionTable should have deletion protection disabled', () => {
      const table = template.Resources.TransactionTable;
      expect(table.Properties.DeletionProtectionEnabled).toBe(false);
    });
  });

  describe('SQS Resources', () => {
    test('should have DeadLetterQueue resource', () => {
      expect(template.Resources.DeadLetterQueue).toBeDefined();
    });

    test('DeadLetterQueue should be an SQS Queue', () => {
      const queue = template.Resources.DeadLetterQueue;
      expect(queue.Type).toBe('AWS::SQS::Queue');
    });

    test('DeadLetterQueue should have correct deletion policies', () => {
      const queue = template.Resources.DeadLetterQueue;
      expect(queue.DeletionPolicy).toBe('Delete');
      expect(queue.UpdateReplacePolicy).toBe('Delete');
    });

    test('DeadLetterQueue should include EnvironmentSuffix in name', () => {
      const queue = template.Resources.DeadLetterQueue;
      expect(queue.Properties.QueueName).toEqual({
        'Fn::Sub': 'webhook-dlq-${EnvironmentSuffix}',
      });
    });

    test('DeadLetterQueue should have exactly 14 days retention (1209600 seconds)', () => {
      const queue = template.Resources.DeadLetterQueue;
      expect(queue.Properties.MessageRetentionPeriod).toBe(1209600);
    });

    test('should have ProcessingQueue resource', () => {
      expect(template.Resources.ProcessingQueue).toBeDefined();
    });

    test('ProcessingQueue should be an SQS Queue', () => {
      const queue = template.Resources.ProcessingQueue;
      expect(queue.Type).toBe('AWS::SQS::Queue');
    });

    test('ProcessingQueue should include EnvironmentSuffix in name', () => {
      const queue = template.Resources.ProcessingQueue;
      expect(queue.Properties.QueueName).toEqual({
        'Fn::Sub': 'webhook-processing-${EnvironmentSuffix}',
      });
    });

    test('ProcessingQueue should have visibility timeout of 300 seconds', () => {
      const queue = template.Resources.ProcessingQueue;
      expect(queue.Properties.VisibilityTimeout).toBe(300);
    });

    test('ProcessingQueue should have redrive policy with maxReceiveCount of 3', () => {
      const queue = template.Resources.ProcessingQueue;
      expect(queue.Properties.RedrivePolicy).toBeDefined();
      expect(queue.Properties.RedrivePolicy.maxReceiveCount).toBe(3);
      expect(queue.Properties.RedrivePolicy.deadLetterTargetArn).toEqual({
        'Fn::GetAtt': ['DeadLetterQueue', 'Arn'],
      });
    });
  });

  describe('IAM Resources', () => {
    test('should have LambdaExecutionRole resource', () => {
      expect(template.Resources.LambdaExecutionRole).toBeDefined();
    });

    test('LambdaExecutionRole should be an IAM Role', () => {
      const role = template.Resources.LambdaExecutionRole;
      expect(role.Type).toBe('AWS::IAM::Role');
    });

    test('LambdaExecutionRole should have correct deletion policies', () => {
      const role = template.Resources.LambdaExecutionRole;
      expect(role.DeletionPolicy).toBe('Delete');
      expect(role.UpdateReplacePolicy).toBe('Delete');
    });

    test('LambdaExecutionRole should include EnvironmentSuffix in name', () => {
      const role = template.Resources.LambdaExecutionRole;
      expect(role.Properties.RoleName).toEqual({
        'Fn::Sub': 'webhook-lambda-role-${EnvironmentSuffix}',
      });
    });

    test('LambdaExecutionRole should have Lambda assume role policy', () => {
      const role = template.Resources.LambdaExecutionRole;
      const assumePolicy =
        role.Properties.AssumeRolePolicyDocument.Statement[0];
      expect(assumePolicy.Effect).toBe('Allow');
      expect(assumePolicy.Principal.Service).toBe('lambda.amazonaws.com');
      expect(assumePolicy.Action).toBe('sts:AssumeRole');
    });

    test('LambdaExecutionRole should have correct managed policies', () => {
      const role = template.Resources.LambdaExecutionRole;
      expect(role.Properties.ManagedPolicyArns).toContain(
        'arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole'
      );
      expect(role.Properties.ManagedPolicyArns).toContain(
        'arn:aws:iam::aws:policy/AWSXRayDaemonWriteAccess'
      );
    });

    test('LambdaExecutionRole should have inline policy with DynamoDB permissions', () => {
      const role = template.Resources.LambdaExecutionRole;
      const policy = role.Properties.Policies[0];
      expect(policy.PolicyName).toBe('LambdaExecutionPolicy');

      const dynamoStatement = policy.PolicyDocument.Statement.find(
        (stmt: any) =>
          stmt.Action.includes('dynamodb:PutItem') ||
          stmt.Action.includes('dynamodb:GetItem')
      );
      expect(dynamoStatement).toBeDefined();
      expect(dynamoStatement.Action).toContain('dynamodb:PutItem');
      expect(dynamoStatement.Action).toContain('dynamodb:GetItem');
      expect(dynamoStatement.Action).toContain('dynamodb:UpdateItem');
      expect(dynamoStatement.Resource).toEqual({
        'Fn::GetAtt': ['TransactionTable', 'Arn'],
      });
    });

    test('LambdaExecutionRole should have inline policy with SQS permissions', () => {
      const role = template.Resources.LambdaExecutionRole;
      const policy = role.Properties.Policies[0];

      const sqsStatement = policy.PolicyDocument.Statement.find((stmt: any) =>
        stmt.Action.includes('sqs:SendMessage')
      );
      expect(sqsStatement).toBeDefined();
      expect(sqsStatement.Action).toContain('sqs:SendMessage');
      expect(sqsStatement.Action).toContain('sqs:GetQueueAttributes');
      expect(sqsStatement.Resource).toContainEqual({
        'Fn::GetAtt': ['ProcessingQueue', 'Arn'],
      });
      expect(sqsStatement.Resource).toContainEqual({
        'Fn::GetAtt': ['DeadLetterQueue', 'Arn'],
      });
    });

    test('LambdaExecutionRole should have inline policy with KMS permissions', () => {
      const role = template.Resources.LambdaExecutionRole;
      const policy = role.Properties.Policies[0];

      const kmsStatement = policy.PolicyDocument.Statement.find((stmt: any) =>
        stmt.Action.includes('kms:Decrypt')
      );
      expect(kmsStatement).toBeDefined();
      expect(kmsStatement.Action).toContain('kms:Decrypt');
      expect(kmsStatement.Action).toContain('kms:DescribeKey');
      expect(kmsStatement.Resource).toEqual({
        'Fn::GetAtt': ['LambdaEncryptionKey', 'Arn'],
      });
    });

    test('LambdaExecutionRole should not have wildcard actions', () => {
      const role = template.Resources.LambdaExecutionRole;
      const policy = role.Properties.Policies[0];

      policy.PolicyDocument.Statement.forEach((stmt: any) => {
        if (Array.isArray(stmt.Action)) {
          stmt.Action.forEach((action: string) => {
            expect(action).not.toBe('*');
          });
        } else {
          expect(stmt.Action).not.toBe('*');
        }
      });
    });
  });

  describe('CloudWatch Resources', () => {
    test('should have LambdaLogGroup resource', () => {
      expect(template.Resources.LambdaLogGroup).toBeDefined();
    });

    test('LambdaLogGroup should be a CloudWatch Log Group', () => {
      const logGroup = template.Resources.LambdaLogGroup;
      expect(logGroup.Type).toBe('AWS::Logs::LogGroup');
    });

    test('LambdaLogGroup should have correct deletion policies', () => {
      const logGroup = template.Resources.LambdaLogGroup;
      expect(logGroup.DeletionPolicy).toBe('Delete');
      expect(logGroup.UpdateReplacePolicy).toBe('Delete');
    });

    test('LambdaLogGroup should include EnvironmentSuffix in name', () => {
      const logGroup = template.Resources.LambdaLogGroup;
      expect(logGroup.Properties.LogGroupName).toEqual({
        'Fn::Sub': '/aws/lambda/webhook-processor-${EnvironmentSuffix}',
      });
    });

    test('LambdaLogGroup should have exactly 30 days retention', () => {
      const logGroup = template.Resources.LambdaLogGroup;
      expect(logGroup.Properties.RetentionInDays).toBe(30);
    });

    test('should have BTCMetricFilter resource', () => {
      expect(template.Resources.BTCMetricFilter).toBeDefined();
    });

    test('BTCMetricFilter should filter for BTC transactions', () => {
      const filter = template.Resources.BTCMetricFilter;
      expect(filter.Type).toBe('AWS::Logs::MetricFilter');
      expect(filter.Properties.FilterPattern).toContain('BTC');
      expect(filter.Properties.LogGroupName).toEqual({
        Ref: 'LambdaLogGroup',
      });
    });

    test('BTCMetricFilter should create metric with EnvironmentSuffix', () => {
      const filter = template.Resources.BTCMetricFilter;
      const metric = filter.Properties.MetricTransformations[0];
      expect(metric.MetricName).toEqual({
        'Fn::Sub': 'BTCTransactionCount-${EnvironmentSuffix}',
      });
      expect(metric.MetricNamespace).toBe('CryptoWebhooks');
      expect(metric.MetricValue).toBe('1');
      expect(metric.DefaultValue).toBe(0);
    });

    test('should have ETHMetricFilter resource', () => {
      expect(template.Resources.ETHMetricFilter).toBeDefined();
    });

    test('ETHMetricFilter should filter for ETH transactions', () => {
      const filter = template.Resources.ETHMetricFilter;
      expect(filter.Type).toBe('AWS::Logs::MetricFilter');
      expect(filter.Properties.FilterPattern).toContain('ETH');
    });

    test('ETHMetricFilter should create metric with EnvironmentSuffix', () => {
      const filter = template.Resources.ETHMetricFilter;
      const metric = filter.Properties.MetricTransformations[0];
      expect(metric.MetricName).toEqual({
        'Fn::Sub': 'ETHTransactionCount-${EnvironmentSuffix}',
      });
      expect(metric.MetricNamespace).toBe('CryptoWebhooks');
    });

    test('should have USDTMetricFilter resource', () => {
      expect(template.Resources.USDTMetricFilter).toBeDefined();
    });

    test('USDTMetricFilter should filter for USDT transactions', () => {
      const filter = template.Resources.USDTMetricFilter;
      expect(filter.Type).toBe('AWS::Logs::MetricFilter');
      expect(filter.Properties.FilterPattern).toContain('USDT');
    });

    test('USDTMetricFilter should create metric with EnvironmentSuffix', () => {
      const filter = template.Resources.USDTMetricFilter;
      const metric = filter.Properties.MetricTransformations[0];
      expect(metric.MetricName).toEqual({
        'Fn::Sub': 'USDTTransactionCount-${EnvironmentSuffix}',
      });
      expect(metric.MetricNamespace).toBe('CryptoWebhooks');
    });
  });

  describe('Lambda Resources', () => {
    test('should have WebhookProcessorFunction resource', () => {
      expect(template.Resources.WebhookProcessorFunction).toBeDefined();
    });

    test('WebhookProcessorFunction should be a Lambda Function', () => {
      const lambda = template.Resources.WebhookProcessorFunction;
      expect(lambda.Type).toBe('AWS::Lambda::Function');
    });

    test('WebhookProcessorFunction should have correct deletion policies', () => {
      const lambda = template.Resources.WebhookProcessorFunction;
      expect(lambda.DeletionPolicy).toBe('Delete');
      expect(lambda.UpdateReplacePolicy).toBe('Delete');
    });

    test('WebhookProcessorFunction should depend on LambdaLogGroup', () => {
      const lambda = template.Resources.WebhookProcessorFunction;
      expect(lambda.DependsOn).toBe('LambdaLogGroup');
    });

    test('WebhookProcessorFunction should include EnvironmentSuffix in name', () => {
      const lambda = template.Resources.WebhookProcessorFunction;
      expect(lambda.Properties.FunctionName).toEqual({
        'Fn::Sub': 'webhook-processor-${EnvironmentSuffix}',
      });
    });

    test('WebhookProcessorFunction should use Python 3.11 runtime', () => {
      const lambda = template.Resources.WebhookProcessorFunction;
      expect(lambda.Properties.Runtime).toBe('python3.11');
    });

    test('WebhookProcessorFunction should have 1GB memory', () => {
      const lambda = template.Resources.WebhookProcessorFunction;
      expect(lambda.Properties.MemorySize).toBe(1024);
    });

    test('WebhookProcessorFunction should have 60 second timeout', () => {
      const lambda = template.Resources.WebhookProcessorFunction;
      expect(lambda.Properties.Timeout).toBe(60);
    });

    test('WebhookProcessorFunction should have exactly 50 reserved concurrent executions', () => {
      const lambda = template.Resources.WebhookProcessorFunction;
      expect(lambda.Properties.ReservedConcurrentExecutions).toBe(50);
    });

    test('WebhookProcessorFunction should reference LambdaExecutionRole', () => {
      const lambda = template.Resources.WebhookProcessorFunction;
      expect(lambda.Properties.Role).toEqual({
        'Fn::GetAtt': ['LambdaExecutionRole', 'Arn'],
      });
    });

    test('WebhookProcessorFunction should use KMS key for encryption', () => {
      const lambda = template.Resources.WebhookProcessorFunction;
      expect(lambda.Properties.KmsKeyArn).toEqual({
        'Fn::GetAtt': ['LambdaEncryptionKey', 'Arn'],
      });
    });

    test('WebhookProcessorFunction should have dead letter queue configured', () => {
      const lambda = template.Resources.WebhookProcessorFunction;
      expect(lambda.Properties.DeadLetterConfig).toBeDefined();
      expect(lambda.Properties.DeadLetterConfig.TargetArn).toEqual({
        'Fn::GetAtt': ['DeadLetterQueue', 'Arn'],
      });
    });

    test('WebhookProcessorFunction should have X-Ray tracing enabled', () => {
      const lambda = template.Resources.WebhookProcessorFunction;
      expect(lambda.Properties.TracingConfig.Mode).toBe('Active');
    });

    test('WebhookProcessorFunction should have correct environment variables', () => {
      const lambda = template.Resources.WebhookProcessorFunction;
      expect(lambda.Properties.Environment.Variables).toBeDefined();
      expect(lambda.Properties.Environment.Variables.TRANSACTION_TABLE).toEqual(
        {
          Ref: 'TransactionTable',
        }
      );
      expect(
        lambda.Properties.Environment.Variables.PROCESSING_QUEUE_URL
      ).toEqual({
        Ref: 'ProcessingQueue',
      });
    });

    test('WebhookProcessorFunction should have inline code', () => {
      const lambda = template.Resources.WebhookProcessorFunction;
      expect(lambda.Properties.Code.ZipFile).toBeDefined();
      expect(lambda.Properties.Code.ZipFile).toContain('def handler');
      expect(lambda.Properties.Code.ZipFile).toContain('import boto3');
    });

    test('WebhookProcessorFunction code should validate currencies', () => {
      const lambda = template.Resources.WebhookProcessorFunction;
      const code = lambda.Properties.Code.ZipFile;
      expect(code).toContain('BTC');
      expect(code).toContain('ETH');
      expect(code).toContain('USDT');
      expect(code).toContain('valid_currencies');
    });

    test('WebhookProcessorFunction code should use DynamoDB', () => {
      const lambda = template.Resources.WebhookProcessorFunction;
      const code = lambda.Properties.Code.ZipFile;
      expect(code).toContain('dynamodb');
      expect(code).toContain('put_item');
    });

    test('WebhookProcessorFunction code should use SQS', () => {
      const lambda = template.Resources.WebhookProcessorFunction;
      const code = lambda.Properties.Code.ZipFile;
      expect(code).toContain('sqs');
      expect(code).toContain('send_message');
    });
  });

  describe('API Gateway Resources', () => {
    test('should have RequestValidator resource', () => {
      expect(template.Resources.RequestValidator).toBeDefined();
    });

    test('RequestValidator should validate body and parameters', () => {
      const validator = template.Resources.RequestValidator;
      expect(validator.Type).toBe('AWS::ApiGateway::RequestValidator');
      expect(validator.Properties.ValidateRequestBody).toBe(true);
      expect(validator.Properties.ValidateRequestParameters).toBe(true);
      expect(validator.Properties.Name).toEqual({
        'Fn::Sub': 'webhook-validator-${EnvironmentSuffix}',
      });
    });

    test('should have WebhookRequestModel resource', () => {
      expect(template.Resources.WebhookRequestModel).toBeDefined();
    });

    test('WebhookRequestModel should have correct JSON schema', () => {
      const model = template.Resources.WebhookRequestModel;
      expect(model.Type).toBe('AWS::ApiGateway::Model');
      expect(model.Properties.ContentType).toBe('application/json');
      expect(model.Properties.Schema.type).toBe('object');
      expect(model.Properties.Schema.required).toContain('transactionId');
      expect(model.Properties.Schema.properties.transactionId).toBeDefined();
    });

    test('should have WebhookRestApi resource', () => {
      expect(template.Resources.WebhookRestApi).toBeDefined();
    });

    test('WebhookRestApi should be a REST API', () => {
      const api = template.Resources.WebhookRestApi;
      expect(api.Type).toBe('AWS::ApiGateway::RestApi');
    });

    test('WebhookRestApi should have correct deletion policies', () => {
      const api = template.Resources.WebhookRestApi;
      expect(api.DeletionPolicy).toBe('Delete');
      expect(api.UpdateReplacePolicy).toBe('Delete');
    });

    test('WebhookRestApi should include EnvironmentSuffix in name', () => {
      const api = template.Resources.WebhookRestApi;
      expect(api.Properties.Name).toEqual({
        'Fn::Sub': 'webhook-api-${EnvironmentSuffix}',
      });
    });

    test('WebhookRestApi should be REGIONAL', () => {
      const api = template.Resources.WebhookRestApi;
      expect(api.Properties.EndpointConfiguration.Types).toContain('REGIONAL');
    });

    test('should have WebhooksResource', () => {
      expect(template.Resources.WebhooksResource).toBeDefined();
      const resource = template.Resources.WebhooksResource;
      expect(resource.Type).toBe('AWS::ApiGateway::Resource');
      expect(resource.Properties.PathPart).toBe('webhooks');
    });

    test('should have CurrencyResource', () => {
      expect(template.Resources.CurrencyResource).toBeDefined();
      const resource = template.Resources.CurrencyResource;
      expect(resource.Type).toBe('AWS::ApiGateway::Resource');
      expect(resource.Properties.PathPart).toBe('{currency}');
      expect(resource.Properties.ParentId).toEqual({
        Ref: 'WebhooksResource',
      });
    });

    test('should have WebhookPostMethod', () => {
      expect(template.Resources.WebhookPostMethod).toBeDefined();
    });

    test('WebhookPostMethod should be a POST method', () => {
      const method = template.Resources.WebhookPostMethod;
      expect(method.Type).toBe('AWS::ApiGateway::Method');
      expect(method.Properties.HttpMethod).toBe('POST');
    });

    test('WebhookPostMethod should use AWS_IAM authorization', () => {
      const method = template.Resources.WebhookPostMethod;
      expect(method.Properties.AuthorizationType).toBe('AWS_IAM');
    });

    test('WebhookPostMethod should use request validator', () => {
      const method = template.Resources.WebhookPostMethod;
      expect(method.Properties.RequestValidatorId).toEqual({
        Ref: 'RequestValidator',
      });
    });

    test('WebhookPostMethod should use request model', () => {
      const method = template.Resources.WebhookPostMethod;
      expect(method.Properties.RequestModels['application/json']).toEqual({
        Ref: 'WebhookRequestModel',
      });
    });

    test('WebhookPostMethod should require currency path parameter', () => {
      const method = template.Resources.WebhookPostMethod;
      expect(method.Properties.RequestParameters).toBeDefined();
      expect(method.Properties.RequestParameters['method.request.path.currency']).toBe(true);
    });

    test('WebhookPostMethod should use AWS_PROXY integration', () => {
      const method = template.Resources.WebhookPostMethod;
      expect(method.Properties.Integration.Type).toBe('AWS_PROXY');
      expect(method.Properties.Integration.IntegrationHttpMethod).toBe('POST');
    });

    test('should have ApiGatewayInvokePermission', () => {
      expect(template.Resources.ApiGatewayInvokePermission).toBeDefined();
      const permission = template.Resources.ApiGatewayInvokePermission;
      expect(permission.Type).toBe('AWS::Lambda::Permission');
      expect(permission.Properties.Action).toBe('lambda:InvokeFunction');
      expect(permission.Properties.Principal).toBe('apigateway.amazonaws.com');
    });

    test('should have ApiDeployment', () => {
      expect(template.Resources.ApiDeployment).toBeDefined();
      const deployment = template.Resources.ApiDeployment;
      expect(deployment.Type).toBe('AWS::ApiGateway::Deployment');
      expect(deployment.DependsOn).toBe('WebhookPostMethod');
    });

    test('should have ApiStage with X-Ray tracing', () => {
      expect(template.Resources.ApiStage).toBeDefined();
      const stage = template.Resources.ApiStage;
      expect(stage.Type).toBe('AWS::ApiGateway::Stage');
      expect(stage.Properties.StageName).toEqual({
        Ref: 'EnvironmentSuffix',
      });
      expect(stage.Properties.TracingEnabled).toBe(true);
    });

    test('ApiStage should have correct method settings', () => {
      const stage = template.Resources.ApiStage;
      const settings = stage.Properties.MethodSettings[0];
      expect(settings.ResourcePath).toBe('/*');
      expect(settings.HttpMethod).toBe('*');
      expect(settings.LoggingLevel).toBe('INFO');
      expect(settings.DataTraceEnabled).toBe(true);
      expect(settings.MetricsEnabled).toBe(true);
    });

    test('should have ApiUsagePlan', () => {
      expect(template.Resources.ApiUsagePlan).toBeDefined();
      const plan = template.Resources.ApiUsagePlan;
      expect(plan.Type).toBe('AWS::ApiGateway::UsagePlan');
    });

    test('ApiUsagePlan should have 1000 requests per day limit', () => {
      const plan = template.Resources.ApiUsagePlan;
      expect(plan.Properties.Quota.Limit).toBe(1000);
      expect(plan.Properties.Quota.Period).toBe('DAY');
    });

    test('ApiUsagePlan should have correct throttle settings', () => {
      const plan = template.Resources.ApiUsagePlan;
      expect(plan.Properties.Throttle.BurstLimit).toBe(100);
      expect(plan.Properties.Throttle.RateLimit).toBe(50);
    });

    test('should have ApiKey', () => {
      expect(template.Resources.ApiKey).toBeDefined();
      const key = template.Resources.ApiKey;
      expect(key.Type).toBe('AWS::ApiGateway::ApiKey');
      expect(key.Properties.Enabled).toBe(true);
      expect(key.Properties.Name).toEqual({
        'Fn::Sub': 'webhook-api-key-${EnvironmentSuffix}',
      });
    });

    test('should have UsagePlanKey', () => {
      expect(template.Resources.UsagePlanKey).toBeDefined();
      const planKey = template.Resources.UsagePlanKey;
      expect(planKey.Type).toBe('AWS::ApiGateway::UsagePlanKey');
      expect(planKey.Properties.KeyType).toBe('API_KEY');
    });
  });

  describe('Outputs', () => {
    test('should have all required outputs', () => {
      const expectedOutputs = [
        'ApiEndpointUrl',
        'LambdaFunctionArn',
        'DynamoDBTableName',
        'ProcessingQueueUrl',
        'DeadLetterQueueUrl',
        'KMSKeyId',
        'ApiKeyId',
      ];

      expectedOutputs.forEach(outputName => {
        expect(template.Outputs[outputName]).toBeDefined();
      });
    });

    test('ApiEndpointUrl output should be correct', () => {
      const output = template.Outputs.ApiEndpointUrl;
      expect(output.Description).toContain('API Gateway endpoint');
      expect(output.Value).toBeDefined();
      expect(output.Export).toBeDefined();
    });

    test('LambdaFunctionArn output should be correct', () => {
      const output = template.Outputs.LambdaFunctionArn;
      expect(output.Description).toContain('Lambda function ARN');
      expect(output.Value).toEqual({
        'Fn::GetAtt': ['WebhookProcessorFunction', 'Arn'],
      });
    });

    test('DynamoDBTableName output should be correct', () => {
      const output = template.Outputs.DynamoDBTableName;
      expect(output.Description).toContain('DynamoDB table name');
      expect(output.Value).toEqual({
        Ref: 'TransactionTable',
      });
    });

    test('ProcessingQueueUrl output should be correct', () => {
      const output = template.Outputs.ProcessingQueueUrl;
      expect(output.Description).toContain('SQS processing queue');
      expect(output.Value).toEqual({
        Ref: 'ProcessingQueue',
      });
    });

    test('DeadLetterQueueUrl output should be correct', () => {
      const output = template.Outputs.DeadLetterQueueUrl;
      expect(output.Description).toContain('SQS dead letter queue');
      expect(output.Value).toEqual({
        Ref: 'DeadLetterQueue',
      });
    });

    test('KMSKeyId output should be correct', () => {
      const output = template.Outputs.KMSKeyId;
      expect(output.Description).toContain('KMS key ID');
      expect(output.Value).toEqual({
        Ref: 'LambdaEncryptionKey',
      });
    });

    test('ApiKeyId output should be correct', () => {
      const output = template.Outputs.ApiKeyId;
      expect(output.Description).toContain('API Gateway API Key');
      expect(output.Value).toEqual({
        Ref: 'ApiKey',
      });
    });
  });

  describe('Resource Naming Convention', () => {
    test('all applicable resource names should include EnvironmentSuffix', () => {
      const resourcesWithNames = [
        'LambdaEncryptionKeyAlias',
        'TransactionTable',
        'DeadLetterQueue',
        'ProcessingQueue',
        'LambdaExecutionRole',
        'LambdaLogGroup',
        'WebhookProcessorFunction',
        'RequestValidator',
        'WebhookRestApi',
        'ApiUsagePlan',
        'ApiKey',
      ];

      resourcesWithNames.forEach(resourceName => {
        const resource = template.Resources[resourceName];
        const nameProperty =
          resource.Properties.FunctionName ||
          resource.Properties.TableName ||
          resource.Properties.QueueName ||
          resource.Properties.RoleName ||
          resource.Properties.LogGroupName ||
          resource.Properties.Name ||
          resource.Properties.AliasName ||
          resource.Properties.UsagePlanName;

        if (nameProperty && typeof nameProperty === 'object') {
          expect(nameProperty['Fn::Sub']).toContain('${EnvironmentSuffix}');
        }
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

    test('should have exactly 25 resources', () => {
      const resourceCount = Object.keys(template.Resources).length;
      expect(resourceCount).toBe(25);
    });

    test('should have exactly 1 parameter', () => {
      const parameterCount = Object.keys(template.Parameters).length;
      expect(parameterCount).toBe(1);
    });

    test('should have exactly 9 outputs', () => {
      const outputCount = Object.keys(template.Outputs).length;
      expect(outputCount).toBe(9);
    });

    test('all resources should have DeletionPolicy Delete or be API Gateway child resources', () => {
      Object.keys(template.Resources).forEach(resourceKey => {
        const resource = template.Resources[resourceKey];
        const apiGatewayChildTypes = [
          'AWS::ApiGateway::Method',
          'AWS::ApiGateway::Resource',
          'AWS::ApiGateway::RequestValidator',
          'AWS::ApiGateway::Model',
          'AWS::ApiGateway::Deployment',
          'AWS::ApiGateway::Stage',
          'AWS::ApiGateway::UsagePlan',
          'AWS::ApiGateway::ApiKey',
          'AWS::ApiGateway::UsagePlanKey',
          'AWS::Lambda::Permission',
          'AWS::Logs::MetricFilter',
        ];

        if (!apiGatewayChildTypes.includes(resource.Type)) {
          expect(resource.DeletionPolicy).toBe('Delete');
        }
      });
    });
  });
});
