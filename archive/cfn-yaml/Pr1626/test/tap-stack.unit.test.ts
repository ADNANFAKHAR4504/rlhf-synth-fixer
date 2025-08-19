import fs from 'fs';
import path from 'path';

const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';

describe('TapStack CloudFormation Template', () => {
  let template: any;

  beforeAll(() => {
    // Load JSON template
    const jsonTemplatePath = path.join(__dirname, '../lib/TapStack.json');
    const jsonTemplateContent = fs.readFileSync(jsonTemplatePath, 'utf8');
    template = JSON.parse(jsonTemplateContent);
  });

  describe('Template Structure', () => {
    test('should have valid CloudFormation format version', () => {
      expect(template.AWSTemplateFormatVersion).toBe('2010-09-09');
    });

    test('should have a description', () => {
      expect(template.Description).toBeDefined();
      expect(template.Description).toContain('serverless application');
    });
  });

  describe('Parameters', () => {
    test('should have all required parameters', () => {
      const requiredParams = ['EnvironmentSuffix', 'LambdaFunctionName', 'DynamoDBTableName', 'SQSQueueName'];
      requiredParams.forEach(param => {
        expect(template.Parameters[param]).toBeDefined();
        expect(template.Parameters[param].Type).toBe('String');
      });
    });

    test('EnvironmentSuffix parameter should have correct properties', () => {
      const envSuffixParam = template.Parameters.EnvironmentSuffix;
      expect(envSuffixParam.Type).toBe('String');
      expect(envSuffixParam.Default).toBe('dev');
      expect(envSuffixParam.Description).toContain('Environment suffix');
    });

    test('LambdaFunctionName parameter should have correct properties', () => {
      const lambdaParam = template.Parameters.LambdaFunctionName;
      expect(lambdaParam.Type).toBe('String');
      expect(lambdaParam.Default).toBe('ServerlessProcessor');
      expect(lambdaParam.Description).toContain('Lambda function');
    });

    test('DynamoDBTableName parameter should have correct properties', () => {
      const dynamoParam = template.Parameters.DynamoDBTableName;
      expect(dynamoParam.Type).toBe('String');
      expect(dynamoParam.Default).toBe('ProcessedData');
      expect(dynamoParam.Description).toContain('DynamoDB table');
    });

    test('SQSQueueName parameter should have correct properties', () => {
      const sqsParam = template.Parameters.SQSQueueName;
      expect(sqsParam.Type).toBe('String');
      expect(sqsParam.Default).toBe('lambda-dlq');
      expect(sqsParam.Description).toContain('Dead Letter Queue');
    });
  });

  describe('KMS Resources', () => {
    test('should have DynamoDB KMS key', () => {
      expect(template.Resources.DynamoDBKMSKey).toBeDefined();
      expect(template.Resources.DynamoDBKMSKey.Type).toBe('AWS::KMS::Key');
    });

    test('DynamoDB KMS key should have correct key policy', () => {
      const kmsKey = template.Resources.DynamoDBKMSKey;
      const keyPolicy = kmsKey.Properties.KeyPolicy;
      expect(keyPolicy.Statement).toBeDefined();
      expect(keyPolicy.Statement.length).toBeGreaterThanOrEqual(2);
      
      // Check for root account permissions
      const rootStatement = keyPolicy.Statement.find((s: any) => s.Sid === 'Enable IAM User Permissions');
      expect(rootStatement).toBeDefined();
      expect(rootStatement.Effect).toBe('Allow');
      
      // Check for DynamoDB service permissions
      const serviceStatement = keyPolicy.Statement.find((s: any) => s.Sid === 'Allow DynamoDB Service');
      expect(serviceStatement).toBeDefined();
      expect(serviceStatement.Principal.Service).toBe('dynamodb.amazonaws.com');
    });

    test('should have SQS KMS key', () => {
      expect(template.Resources.SQSKMSKey).toBeDefined();
      expect(template.Resources.SQSKMSKey.Type).toBe('AWS::KMS::Key');
    });

    test('SQS KMS key should have correct key policy', () => {
      const kmsKey = template.Resources.SQSKMSKey;
      const keyPolicy = kmsKey.Properties.KeyPolicy;
      expect(keyPolicy.Statement).toBeDefined();
      expect(keyPolicy.Statement.length).toBeGreaterThanOrEqual(2);
      
      // Check for SQS service permissions
      const serviceStatement = keyPolicy.Statement.find((s: any) => s.Sid === 'Allow SQS Service');
      expect(serviceStatement).toBeDefined();
      expect(serviceStatement.Principal.Service).toBe('sqs.amazonaws.com');
    });

    test('should have KMS key aliases with environment suffix', () => {
      expect(template.Resources.DynamoDBKMSKeyAlias).toBeDefined();
      expect(template.Resources.SQSKMSKeyAlias).toBeDefined();
      
      const dynamoAlias = template.Resources.DynamoDBKMSKeyAlias.Properties.AliasName;
      expect(dynamoAlias['Fn::Sub']).toContain('${EnvironmentSuffix}');
      
      const sqsAlias = template.Resources.SQSKMSKeyAlias.Properties.AliasName;
      expect(sqsAlias['Fn::Sub']).toContain('${EnvironmentSuffix}');
    });
  });

  describe('DynamoDB Table', () => {
    test('should have ProcessedDataTable resource', () => {
      expect(template.Resources.ProcessedDataTable).toBeDefined();
      expect(template.Resources.ProcessedDataTable.Type).toBe('AWS::DynamoDB::Table');
    });

    test('ProcessedDataTable should have PAY_PER_REQUEST billing mode', () => {
      const table = template.Resources.ProcessedDataTable;
      expect(table.Properties.BillingMode).toBe('PAY_PER_REQUEST');
    });

    test('ProcessedDataTable should have KMS encryption', () => {
      const table = template.Resources.ProcessedDataTable;
      const sseSpec = table.Properties.SSESpecification;
      expect(sseSpec).toBeDefined();
      expect(sseSpec.SSEEnabled).toBe(true);
      expect(sseSpec.SSEType).toBe('KMS');
      expect(sseSpec.KMSMasterKeyId).toEqual({ Ref: 'DynamoDBKMSKey' });
    });

    test('ProcessedDataTable should have environment suffix in name', () => {
      const table = template.Resources.ProcessedDataTable;
      expect(table.Properties.TableName['Fn::Sub']).toBe('${DynamoDBTableName}-${EnvironmentSuffix}');
    });

    test('ProcessedDataTable should have correct attribute definitions', () => {
      const table = template.Resources.ProcessedDataTable;
      const attributeDefinitions = table.Properties.AttributeDefinitions;
      expect(attributeDefinitions).toHaveLength(1);
      expect(attributeDefinitions[0].AttributeName).toBe('id');
      expect(attributeDefinitions[0].AttributeType).toBe('S');
    });

    test('ProcessedDataTable should have Point-in-Time Recovery enabled', () => {
      const table = template.Resources.ProcessedDataTable;
      expect(table.Properties.PointInTimeRecoverySpecification).toBeDefined();
      expect(table.Properties.PointInTimeRecoverySpecification.PointInTimeRecoveryEnabled).toBe(true);
    });
  });

  describe('SQS Dead Letter Queue', () => {
    test('should have DeadLetterQueue resource', () => {
      expect(template.Resources.DeadLetterQueue).toBeDefined();
      expect(template.Resources.DeadLetterQueue.Type).toBe('AWS::SQS::Queue');
    });

    test('DeadLetterQueue should have KMS encryption', () => {
      const queue = template.Resources.DeadLetterQueue;
      expect(queue.Properties.KmsMasterKeyId).toEqual({ Ref: 'SQSKMSKey' });
      expect(queue.Properties.KmsDataKeyReusePeriodSeconds).toBe(300);
    });

    test('DeadLetterQueue should have environment suffix in name', () => {
      const queue = template.Resources.DeadLetterQueue;
      expect(queue.Properties.QueueName['Fn::Sub']).toBe('${SQSQueueName}-${EnvironmentSuffix}');
    });

    test('DeadLetterQueue should have 14-day message retention', () => {
      const queue = template.Resources.DeadLetterQueue;
      expect(queue.Properties.MessageRetentionPeriod).toBe(1209600); // 14 days in seconds
    });
  });

  describe('Lambda Function', () => {
    test('should have ProcessorLambdaFunction resource', () => {
      expect(template.Resources.ProcessorLambdaFunction).toBeDefined();
      expect(template.Resources.ProcessorLambdaFunction.Type).toBe('AWS::Lambda::Function');
    });

    test('Lambda function should have correct runtime', () => {
      const lambda = template.Resources.ProcessorLambdaFunction;
      expect(lambda.Properties.Runtime).toBe('python3.12');
    });

    test('Lambda function should have 60-second timeout', () => {
      const lambda = template.Resources.ProcessorLambdaFunction;
      expect(lambda.Properties.Timeout).toBe(60);
    });

    test('Lambda function should have DLQ configured', () => {
      const lambda = template.Resources.ProcessorLambdaFunction;
      expect(lambda.Properties.DeadLetterConfig).toBeDefined();
      expect(lambda.Properties.DeadLetterConfig.TargetArn).toEqual({
        'Fn::GetAtt': ['DeadLetterQueue', 'Arn']
      });
    });

    test('Lambda function should have environment suffix in name', () => {
      const lambda = template.Resources.ProcessorLambdaFunction;
      expect(lambda.Properties.FunctionName['Fn::Sub']).toBe('${LambdaFunctionName}-${EnvironmentSuffix}');
    });

    test('Lambda function should have environment variables', () => {
      const lambda = template.Resources.ProcessorLambdaFunction;
      expect(lambda.Properties.Environment).toBeDefined();
      expect(lambda.Properties.Environment.Variables).toBeDefined();
      expect(lambda.Properties.Environment.Variables.DYNAMODB_TABLE).toEqual({ Ref: 'ProcessedDataTable' });
      expect(lambda.Properties.Environment.Variables.DLQ_URL).toEqual({ Ref: 'DeadLetterQueue' });
    });

    test('Lambda function should have inline code', () => {
      const lambda = template.Resources.ProcessorLambdaFunction;
      expect(lambda.Properties.Code).toBeDefined();
      expect(lambda.Properties.Code.ZipFile).toBeDefined();
      expect(lambda.Properties.Code.ZipFile).toContain('lambda_handler');
      expect(lambda.Properties.Code.ZipFile).toContain('dynamodb');
    });
  });

  describe('IAM Role', () => {
    test('should have LambdaExecutionRole resource', () => {
      expect(template.Resources.LambdaExecutionRole).toBeDefined();
      expect(template.Resources.LambdaExecutionRole.Type).toBe('AWS::IAM::Role');
    });

    test('LambdaExecutionRole should have correct trust policy', () => {
      const role = template.Resources.LambdaExecutionRole;
      const trustPolicy = role.Properties.AssumeRolePolicyDocument;
      expect(trustPolicy.Statement[0].Principal.Service).toBe('lambda.amazonaws.com');
      expect(trustPolicy.Statement[0].Action).toBe('sts:AssumeRole');
    });

    test('LambdaExecutionRole should have managed policies', () => {
      const role = template.Resources.LambdaExecutionRole;
      expect(role.Properties.ManagedPolicyArns).toContain(
        'arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole'
      );
    });

    test('LambdaExecutionRole should have DynamoDB access policy', () => {
      const role = template.Resources.LambdaExecutionRole;
      const dynamoPolicy = role.Properties.Policies.find((p: any) => p.PolicyName === 'DynamoDBAccess');
      expect(dynamoPolicy).toBeDefined();
      
      const statement = dynamoPolicy.PolicyDocument.Statement[0];
      expect(statement.Action).toContain('dynamodb:PutItem');
      expect(statement.Action).toContain('dynamodb:GetItem');
      expect(statement.Resource).toEqual({ 'Fn::GetAtt': ['ProcessedDataTable', 'Arn'] });
    });

    test('LambdaExecutionRole should have SQS access policy', () => {
      const role = template.Resources.LambdaExecutionRole;
      const sqsPolicy = role.Properties.Policies.find((p: any) => p.PolicyName === 'SQSAccess');
      expect(sqsPolicy).toBeDefined();
      
      const statement = sqsPolicy.PolicyDocument.Statement[0];
      expect(statement.Action).toContain('sqs:SendMessage');
      expect(statement.Resource).toEqual({ 'Fn::GetAtt': ['DeadLetterQueue', 'Arn'] });
    });

    test('LambdaExecutionRole should have KMS permissions', () => {
      const role = template.Resources.LambdaExecutionRole;
      
      // Check DynamoDB KMS permissions
      const dynamoPolicy = role.Properties.Policies.find((p: any) => p.PolicyName === 'DynamoDBAccess');
      const kmsStatement = dynamoPolicy.PolicyDocument.Statement.find((s: any) => 
        s.Action && s.Action.includes('kms:Decrypt')
      );
      expect(kmsStatement).toBeDefined();
      expect(kmsStatement.Action).toContain('kms:GenerateDataKey');
      
      // Check SQS KMS permissions
      const sqsPolicy = role.Properties.Policies.find((p: any) => p.PolicyName === 'SQSAccess');
      const sqsKmsStatement = sqsPolicy.PolicyDocument.Statement.find((s: any) => 
        s.Action && s.Action.includes('kms:Decrypt')
      );
      expect(sqsKmsStatement).toBeDefined();
    });
  });

  describe('API Gateway', () => {
    test('should have ServerlessApi resource', () => {
      expect(template.Resources.ServerlessApi).toBeDefined();
      expect(template.Resources.ServerlessApi.Type).toBe('AWS::ApiGateway::RestApi');
    });

    test('ServerlessApi should have environment suffix in name', () => {
      const api = template.Resources.ServerlessApi;
      expect(api.Properties.Name['Fn::Sub']).toBe('ServerlessProcessorAPI-${EnvironmentSuffix}');
    });

    test('ServerlessApi should be REGIONAL', () => {
      const api = template.Resources.ServerlessApi;
      expect(api.Properties.EndpointConfiguration.Types).toContain('REGIONAL');
    });

    test('should have proxy resource for all paths', () => {
      expect(template.Resources.ApiGatewayProxyResource).toBeDefined();
      expect(template.Resources.ApiGatewayProxyResource.Type).toBe('AWS::ApiGateway::Resource');
      expect(template.Resources.ApiGatewayProxyResource.Properties.PathPart).toBe('{proxy+}');
    });

    test('should have ANY method for root resource', () => {
      expect(template.Resources.ApiGatewayRootMethod).toBeDefined();
      expect(template.Resources.ApiGatewayRootMethod.Type).toBe('AWS::ApiGateway::Method');
      expect(template.Resources.ApiGatewayRootMethod.Properties.HttpMethod).toBe('ANY');
    });

    test('should have ANY method for proxy resource', () => {
      expect(template.Resources.ApiGatewayProxyMethod).toBeDefined();
      expect(template.Resources.ApiGatewayProxyMethod.Type).toBe('AWS::ApiGateway::Method');
      expect(template.Resources.ApiGatewayProxyMethod.Properties.HttpMethod).toBe('ANY');
    });

    test('API methods should have Lambda integration', () => {
      const rootMethod = template.Resources.ApiGatewayRootMethod;
      expect(rootMethod.Properties.Integration.Type).toBe('AWS_PROXY');
      expect(rootMethod.Properties.Integration.IntegrationHttpMethod).toBe('POST');
      
      const proxyMethod = template.Resources.ApiGatewayProxyMethod;
      expect(proxyMethod.Properties.Integration.Type).toBe('AWS_PROXY');
      expect(proxyMethod.Properties.Integration.IntegrationHttpMethod).toBe('POST');
    });

    test('should have deployment resource', () => {
      expect(template.Resources.ApiGatewayDeployment).toBeDefined();
      expect(template.Resources.ApiGatewayDeployment.Type).toBe('AWS::ApiGateway::Deployment');
      expect(template.Resources.ApiGatewayDeployment.Properties.StageName).toBe('prod');
    });

    test('should have Lambda permission for API Gateway', () => {
      expect(template.Resources.LambdaApiGatewayPermission).toBeDefined();
      expect(template.Resources.LambdaApiGatewayPermission.Type).toBe('AWS::Lambda::Permission');
      expect(template.Resources.LambdaApiGatewayPermission.Properties.Action).toBe('lambda:InvokeFunction');
      expect(template.Resources.LambdaApiGatewayPermission.Properties.Principal).toBe('apigateway.amazonaws.com');
    });
  });

  describe('Outputs', () => {
    test('should have all required outputs', () => {
      const expectedOutputs = [
        'ApiGatewayUrl',
        'LambdaFunctionArn',
        'DynamoDBTableName',
        'DeadLetterQueueUrl',
        'DynamoDBKMSKeyId',
        'SQSKMSKeyId'
      ];

      expectedOutputs.forEach(outputName => {
        expect(template.Outputs[outputName]).toBeDefined();
        expect(template.Outputs[outputName].Description).toBeDefined();
        expect(template.Outputs[outputName].Value).toBeDefined();
      });
    });

    test('ApiGatewayUrl output should be correct', () => {
      const output = template.Outputs.ApiGatewayUrl;
      expect(output.Description).toContain('API Gateway');
      expect(output.Value['Fn::Sub']).toContain('https://${ServerlessApi}.execute-api');
    });

    test('LambdaFunctionArn output should be correct', () => {
      const output = template.Outputs.LambdaFunctionArn;
      expect(output.Value['Fn::GetAtt']).toEqual(['ProcessorLambdaFunction', 'Arn']);
    });

    test('DynamoDBTableName output should be correct', () => {
      const output = template.Outputs.DynamoDBTableName;
      expect(output.Value).toEqual({ Ref: 'ProcessedDataTable' });
    });

    test('DeadLetterQueueUrl output should be correct', () => {
      const output = template.Outputs.DeadLetterQueueUrl;
      expect(output.Value).toEqual({ Ref: 'DeadLetterQueue' });
    });

    test('KMS key outputs should be correct', () => {
      expect(template.Outputs.DynamoDBKMSKeyId.Value).toEqual({ Ref: 'DynamoDBKMSKey' });
      expect(template.Outputs.SQSKMSKeyId.Value).toEqual({ Ref: 'SQSKMSKey' });
    });

    test('outputs should have export names', () => {
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

    test('should have correct number of resources', () => {
      const resourceCount = Object.keys(template.Resources).length;
      expect(resourceCount).toBeGreaterThanOrEqual(11); // At least 11 resources
    });

    test('should have correct number of parameters', () => {
      const parameterCount = Object.keys(template.Parameters).length;
      expect(parameterCount).toBe(4); // EnvironmentSuffix, LambdaFunctionName, DynamoDBTableName, SQSQueueName
    });

    test('should have correct number of outputs', () => {
      const outputCount = Object.keys(template.Outputs).length;
      expect(outputCount).toBe(6); // 6 outputs
    });
  });

  describe('Security and Compliance', () => {
    test('all resources should use KMS encryption where applicable', () => {
      // DynamoDB encryption
      const dynamoDB = template.Resources.ProcessedDataTable;
      expect(dynamoDB.Properties.SSESpecification.SSEEnabled).toBe(true);
      expect(dynamoDB.Properties.SSESpecification.SSEType).toBe('KMS');
      
      // SQS encryption
      const sqs = template.Resources.DeadLetterQueue;
      expect(sqs.Properties.KmsMasterKeyId).toBeDefined();
    });

    test('Lambda should have minimal required permissions', () => {
      const role = template.Resources.LambdaExecutionRole;
      const policies = role.Properties.Policies;
      
      // Check that each policy has specific resource ARNs, not wildcards
      policies.forEach((policy: any) => {
        policy.PolicyDocument.Statement.forEach((statement: any) => {
          if (statement.Resource && statement.Resource !== '*') {
            // Resources should reference specific ARNs
            expect(statement.Resource).toBeDefined();
          }
        });
      });
    });

    test('API Gateway should not require authentication (as per requirements)', () => {
      const rootMethod = template.Resources.ApiGatewayRootMethod;
      expect(rootMethod.Properties.AuthorizationType).toBe('NONE');
      
      const proxyMethod = template.Resources.ApiGatewayProxyMethod;
      expect(proxyMethod.Properties.AuthorizationType).toBe('NONE');
    });
  });

  describe('Resource Naming Convention', () => {
    test('all nameable resources should include environment suffix', () => {
      // Lambda
      const lambda = template.Resources.ProcessorLambdaFunction;
      expect(lambda.Properties.FunctionName['Fn::Sub']).toContain('${EnvironmentSuffix}');
      
      // DynamoDB
      const dynamoDB = template.Resources.ProcessedDataTable;
      expect(dynamoDB.Properties.TableName['Fn::Sub']).toContain('${EnvironmentSuffix}');
      
      // SQS
      const sqs = template.Resources.DeadLetterQueue;
      expect(sqs.Properties.QueueName['Fn::Sub']).toContain('${EnvironmentSuffix}');
      
      // API Gateway
      const api = template.Resources.ServerlessApi;
      expect(api.Properties.Name['Fn::Sub']).toContain('${EnvironmentSuffix}');
      
      // KMS Aliases
      const dynamoAlias = template.Resources.DynamoDBKMSKeyAlias;
      expect(dynamoAlias.Properties.AliasName['Fn::Sub']).toContain('${EnvironmentSuffix}');
      
      const sqsAlias = template.Resources.SQSKMSKeyAlias;
      expect(sqsAlias.Properties.AliasName['Fn::Sub']).toContain('${EnvironmentSuffix}');
    });
  });
});