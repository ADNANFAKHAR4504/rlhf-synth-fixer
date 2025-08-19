import fs from 'fs';
import path from 'path';

const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';

describe('TapStack CloudFormation Template', () => {
  let template: any;

  beforeAll(() => {
    // If youre testing a yaml template. run `pipenv run cfn-flip-to-json > lib/TapStack.json`
    // Otherwise, ensure the template is in JSON format.
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
        'Serverless application with API Gateway, Lambda, and DynamoDB following security best practices'
      );
    });
  });

  describe('Parameters', () => {
    test('should have Environment parameter', () => {
      expect(template.Parameters.Environment).toBeDefined();
    });

    test('Environment parameter should have correct properties', () => {
      const envParam = template.Parameters.Environment;
      expect(envParam.Type).toBe('String');
      expect(envParam.Default).toBe('dev');
      expect(envParam.Description).toBe('Environment name for resource naming');
    });

    test('should have DomainName parameter', () => {
      expect(template.Parameters.DomainName).toBeDefined();
      const domainParam = template.Parameters.DomainName;
      expect(domainParam.Type).toBe('String');
      expect(domainParam.Default).toBe('');
      expect(domainParam.Description).toBe('Optional custom domain name for API Gateway');
    });
  });

  describe('DynamoDB Resources', () => {
    test('should have ServerlessTable resource', () => {
      expect(template.Resources.ServerlessTable).toBeDefined();
    });

    test('ServerlessTable should be a DynamoDB table', () => {
      const table = template.Resources.ServerlessTable;
      expect(table.Type).toBe('AWS::DynamoDB::Table');
    });

    test('ServerlessTable should have correct properties', () => {
      const table = template.Resources.ServerlessTable;
      const properties = table.Properties;

      expect(properties.TableName).toEqual({
        'Fn::Sub': '${Environment}-serverless-table',
      });
      expect(properties.BillingMode).toBe('PAY_PER_REQUEST');
    });

    test('ServerlessTable should have server-side encryption enabled', () => {
      const table = template.Resources.ServerlessTable;
      const sseSpec = table.Properties.SSESpecification;
      
      expect(sseSpec.SSEEnabled).toBe(true);
      expect(sseSpec.KMSMasterKeyId).toEqual({ Ref: 'DynamoDBKMSKey' });
    });

    test('should have KMS key for DynamoDB encryption', () => {
      expect(template.Resources.DynamoDBKMSKey).toBeDefined();
      const kmsKey = template.Resources.DynamoDBKMSKey;
      expect(kmsKey.Type).toBe('AWS::KMS::Key');
    });
  });

  describe('Lambda Resources', () => {
    test('should have ServerlessFunction resource', () => {
      expect(template.Resources.ServerlessFunction).toBeDefined();
    });

    test('ServerlessFunction should have correct properties', () => {
      const lambda = template.Resources.ServerlessFunction;
      const properties = lambda.Properties;

      expect(lambda.Type).toBe('AWS::Lambda::Function');
      expect(properties.Runtime).toBe('python3.9');
      expect(properties.MemorySize).toBe(256);
      expect(properties.Timeout).toBe(120);
      expect(properties.Handler).toBe('index.lambda_handler');
    });

    test('should have Lambda execution role', () => {
      expect(template.Resources.LambdaExecutionRole).toBeDefined();
      const role = template.Resources.LambdaExecutionRole;
      expect(role.Type).toBe('AWS::IAM::Role');
    });

    test('should have CloudWatch log group for Lambda', () => {
      expect(template.Resources.LambdaLogGroup).toBeDefined();
      const logGroup = template.Resources.LambdaLogGroup;
      expect(logGroup.Type).toBe('AWS::Logs::LogGroup');
    });
  });

  describe('API Gateway Resources', () => {
    test('should have ServerlessApi resource', () => {
      expect(template.Resources.ServerlessApi).toBeDefined();
      const api = template.Resources.ServerlessApi;
      expect(api.Type).toBe('AWS::ApiGateway::RestApi');
    });

    test('should have API Gateway methods', () => {
      expect(template.Resources.ApiMethodGet).toBeDefined();
      expect(template.Resources.ApiMethodPost).toBeDefined();
      expect(template.Resources.ApiMethodOptions).toBeDefined();
    });

    test('should have API Gateway deployment', () => {
      expect(template.Resources.ApiDeployment).toBeDefined();
      const deployment = template.Resources.ApiDeployment;
      expect(deployment.Type).toBe('AWS::ApiGateway::Deployment');
    });

    test('should have Lambda permission for API Gateway', () => {
      expect(template.Resources.LambdaApiGatewayPermission).toBeDefined();
      const permission = template.Resources.LambdaApiGatewayPermission;
      expect(permission.Type).toBe('AWS::Lambda::Permission');
    });
  });

  describe('Security Resources', () => {
    test('Lambda execution role should follow least privilege', () => {
      const role = template.Resources.LambdaExecutionRole;
      const policies = role.Properties.Policies;
      
      expect(policies).toHaveLength(2);
      
      // Check DynamoDB policy
      const dynamoPolicy = policies.find((p: any) => p.PolicyName === 'DynamoDBAccess');
      expect(dynamoPolicy).toBeDefined();
      
      // Check CloudWatch logs policy
      const logsPolicy = policies.find((p: any) => p.PolicyName === 'CloudWatchLogsAccess');
      expect(logsPolicy).toBeDefined();
    });

    test('should have SSL certificate for custom domain', () => {
      expect(template.Resources.ApiCertificate).toBeDefined();
      const cert = template.Resources.ApiCertificate;
      expect(cert.Type).toBe('AWS::CertificateManager::Certificate');
      expect(cert.Condition).toBe('HasDomainName');
    });
  });

  describe('Outputs', () => {
    test('should have all required outputs', () => {
      const expectedOutputs = [
        'ApiGatewayUrl',
        'LambdaFunctionArn',
        'DynamoDBTableName',
        'DynamoDBTableArn'
      ];

      expectedOutputs.forEach(outputName => {
        expect(template.Outputs[outputName]).toBeDefined();
      });
    });

    test('ApiGatewayUrl output should be correct', () => {
      const output = template.Outputs.ApiGatewayUrl;
      expect(output.Description).toBe('API Gateway endpoint URL');
      expect(output.Value).toEqual({
        'Fn::Sub': 'https://${ServerlessApi}.execute-api.${AWS::Region}.amazonaws.com/${Environment}'
      });
    });

    test('DynamoDBTableName output should be correct', () => {
      const output = template.Outputs.DynamoDBTableName;
      expect(output.Description).toBe('DynamoDB table name');
      expect(output.Value).toEqual({ Ref: 'ServerlessTable' });
    });
  });

  describe('Conditions', () => {
    test('should have HasDomainName condition', () => {
      expect(template.Conditions.HasDomainName).toBeDefined();
      expect(template.Conditions.HasDomainName).toEqual({
        'Fn::Not': [{ 'Fn::Equals': [{ Ref: 'DomainName' }, ''] }]
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

    test('should have expected number of resources', () => {
      const resourceCount = Object.keys(template.Resources).length;
      expect(resourceCount).toBeGreaterThan(10); // Multiple resources for serverless stack
    });

    test('should have expected number of parameters', () => {
      const parameterCount = Object.keys(template.Parameters).length;
      expect(parameterCount).toBe(2); // Environment and DomainName
    });

    test('should have expected number of outputs', () => {
      const outputCount = Object.keys(template.Outputs).length;
      expect(outputCount).toBe(5); // Including CustomDomainUrl
    });
  });

  describe('Resource Naming Convention', () => {
    test('table name should follow naming convention', () => {
      const table = template.Resources.ServerlessTable;
      const tableName = table.Properties.TableName;

      expect(tableName).toEqual({
        'Fn::Sub': '${Environment}-serverless-table',
      });
    });

    test('Lambda function name should follow naming convention', () => {
      const lambda = template.Resources.ServerlessFunction;
      const functionName = lambda.Properties.FunctionName;

      expect(functionName).toEqual({
        'Fn::Sub': '${Environment}-serverless-function',
      });
    });
  });
});
