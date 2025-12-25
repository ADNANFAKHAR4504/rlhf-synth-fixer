import * as fs from 'fs';
import { yamlParse } from 'yaml-cfn';

describe('CloudFormation Template Tests - LocalStack Compatible', () => {
  let yamlContent: string;
  let template: any;

  beforeAll(() => {
    // Load the YAML template as string for basic validation
    yamlContent = fs.readFileSync('lib/TapStack.yml', 'utf8');
    // Parse YAML to JSON using yaml-cfn which handles CloudFormation intrinsic functions
    template = yamlParse(yamlContent);
  });

  describe('Template Structure', () => {
    test('should have correct AWSTemplateFormatVersion', () => {
      expect(template.AWSTemplateFormatVersion).toBe('2010-09-09');
    });

    test('should have a description', () => {
      expect(template.Description).toBeDefined();
      expect(template.Description).toContain('Serverless Infrastructure');
    });

    test('should have Parameters section', () => {
      expect(template.Parameters).toBeDefined();
      expect(template.Parameters.EnvironmentSuffix).toBeDefined();
    });

    test('should have Resources section', () => {
      expect(template.Resources).toBeDefined();
    });

    test('should have Outputs section', () => {
      expect(template.Outputs).toBeDefined();
    });
  });

  describe('Parameters', () => {
    test('EnvironmentSuffix parameter should have correct properties', () => {
      const envSuffixParam = template.Parameters.EnvironmentSuffix;
      expect(envSuffixParam.Type).toBe('String');
      expect(envSuffixParam.Default).toBe('dev');
      expect(envSuffixParam.Description).toBeDefined();
    });
  });

  describe('DynamoDB Table', () => {
    test('should define UserDataTable with correct properties', () => {
      expect(template.Resources.UserDataTable).toBeDefined();
      expect(template.Resources.UserDataTable.Type).toBe('AWS::DynamoDB::Table');
    });

    test('should have correct key schema with userId', () => {
      const table = template.Resources.UserDataTable;
      const keySchema = table.Properties.KeySchema;
      expect(keySchema).toBeDefined();
      expect(keySchema).toHaveLength(1);
      expect(keySchema[0].AttributeName).toBe('userId');
      expect(keySchema[0].KeyType).toBe('HASH');
    });

    test('should have correct attribute definitions', () => {
      const table = template.Resources.UserDataTable;
      const attributeDefinitions = table.Properties.AttributeDefinitions;
      expect(attributeDefinitions).toBeDefined();
      expect(attributeDefinitions).toHaveLength(1);
      expect(attributeDefinitions[0].AttributeName).toBe('userId');
      expect(attributeDefinitions[0].AttributeType).toBe('S');
    });

    test('should use PAY_PER_REQUEST billing mode', () => {
      const table = template.Resources.UserDataTable;
      expect(table.Properties.BillingMode).toBe('PAY_PER_REQUEST');
    });

    test('should have deletion policies for LocalStack compatibility', () => {
      const table = template.Resources.UserDataTable;
      expect(table.DeletionPolicy).toBe('Delete');
      expect(table.UpdateReplacePolicy).toBe('Delete');
    });
  });

  describe('Lambda Function', () => {
    test('should define UserDataLambda with correct properties', () => {
      expect(template.Resources.UserDataLambda).toBeDefined();
      expect(template.Resources.UserDataLambda.Type).toBe('AWS::Lambda::Function');
    });

    test('should use python3.11 runtime for LocalStack compatibility', () => {
      const lambda = template.Resources.UserDataLambda;
      expect(lambda.Properties.Runtime).toBe('python3.11');
    });

    test('should have correct handler', () => {
      const lambda = template.Resources.UserDataLambda;
      expect(lambda.Properties.Handler).toBe('index.lambda_handler');
    });

    test('should have correct environment variables', () => {
      const lambda = template.Resources.UserDataLambda;
      expect(lambda.Properties.Environment).toBeDefined();
      expect(lambda.Properties.Environment.Variables).toBeDefined();
      expect(lambda.Properties.Environment.Variables.TABLE_NAME).toBeDefined();
    });

    test('should have valid Lambda code', () => {
      const lambda = template.Resources.UserDataLambda;
      expect(lambda.Properties.Code).toBeDefined();
      expect(lambda.Properties.Code.ZipFile).toBeDefined();
      expect(lambda.Properties.Code.ZipFile).toContain('lambda_handler');
      expect(lambda.Properties.Code.ZipFile).toContain('import boto3');
      expect(lambda.Properties.Code.ZipFile).toContain('dynamodb');
    });

    test('should have timeout and memory configured', () => {
      const lambda = template.Resources.UserDataLambda;
      expect(lambda.Properties.Timeout).toBe(30);
      expect(lambda.Properties.MemorySize).toBe(128);
    });

    test('should reference IAM execution role', () => {
      const lambda = template.Resources.UserDataLambda;
      expect(lambda.Properties.Role).toBeDefined();
    });
  });

  describe('IAM Role', () => {
    test('should define LambdaExecutionRole with correct trust policy', () => {
      expect(template.Resources.LambdaExecutionRole).toBeDefined();
      expect(template.Resources.LambdaExecutionRole.Type).toBe('AWS::IAM::Role');
    });

    test('should allow Lambda service to assume role', () => {
      const role = template.Resources.LambdaExecutionRole;
      const assumePolicy = role.Properties.AssumeRolePolicyDocument;
      expect(assumePolicy.Version).toBe('2012-10-17');
      const statement = assumePolicy.Statement[0];
      expect(statement.Effect).toBe('Allow');
      expect(statement.Principal.Service).toBe('lambda.amazonaws.com');
      expect(statement.Action).toBe('sts:AssumeRole');
    });

    test('should have DynamoDB permissions', () => {
      const role = template.Resources.LambdaExecutionRole;
      const policies = role.Properties.Policies;
      expect(policies).toBeDefined();

      const dynamoPolicy = policies.find(
        (p: any) => p.PolicyName === 'DynamoDBAccess'
      );
      expect(dynamoPolicy).toBeDefined();

      const statements = dynamoPolicy.PolicyDocument.Statement;
      const dynamoStatement = statements.find((s: any) =>
        s.Action.includes('dynamodb:PutItem')
      );
      expect(dynamoStatement).toBeDefined();
      expect(dynamoStatement.Action).toContain('dynamodb:GetItem');
    });

    test('should have CloudWatch Logs permissions', () => {
      const role = template.Resources.LambdaExecutionRole;
      const policies = role.Properties.Policies;

      const logsPolicy = policies.find(
        (p: any) => p.PolicyName === 'LambdaBasicExecution'
      );
      expect(logsPolicy).toBeDefined();

      const statements = logsPolicy.PolicyDocument.Statement;
      const logsStatement = statements.find((s: any) =>
        s.Action.includes('logs:CreateLogGroup')
      );
      expect(logsStatement).toBeDefined();
      expect(logsStatement.Action).toContain('logs:CreateLogStream');
      expect(logsStatement.Action).toContain('logs:PutLogEvents');
    });
  });

  describe('API Gateway', () => {
    test('should define UserDataApi with correct properties', () => {
      expect(template.Resources.UserDataApi).toBeDefined();
      expect(template.Resources.UserDataApi.Type).toBe('AWS::ApiGateway::RestApi');
    });

    test('should have REGIONAL endpoint type', () => {
      const api = template.Resources.UserDataApi;
      expect(api.Properties.EndpointConfiguration).toBeDefined();
      expect(api.Properties.EndpointConfiguration.Types).toContain('REGIONAL');
    });

    test('should have userdata resource path', () => {
      const resource = template.Resources.UserDataResource;
      expect(resource).toBeDefined();
      expect(resource.Type).toBe('AWS::ApiGateway::Resource');
      expect(resource.Properties.PathPart).toBe('userdata');
    });

    test('should have GET method defined', () => {
      const getMethod = template.Resources.GetMethod;
      expect(getMethod).toBeDefined();
      expect(getMethod.Type).toBe('AWS::ApiGateway::Method');
      expect(getMethod.Properties.HttpMethod).toBe('GET');
      expect(getMethod.Properties.ApiKeyRequired).toBe(true);
    });

    test('should have POST method defined', () => {
      const postMethod = template.Resources.PostMethod;
      expect(postMethod).toBeDefined();
      expect(postMethod.Type).toBe('AWS::ApiGateway::Method');
      expect(postMethod.Properties.HttpMethod).toBe('POST');
      expect(postMethod.Properties.ApiKeyRequired).toBe(true);
    });

    test('should have deployment configured', () => {
      expect(template.Resources.ApiDeployment).toBeDefined();
      expect(template.Resources.ApiDeployment.Type).toBe(
        'AWS::ApiGateway::Deployment'
      );
      expect(template.Resources.ApiDeployment.Properties.StageName).toBe('prod');
    });

    test('should have usage plan with correct limits', () => {
      expect(template.Resources.UsagePlan).toBeDefined();
      expect(template.Resources.UsagePlan.Type).toBe('AWS::ApiGateway::UsagePlan');
      const quota = template.Resources.UsagePlan.Properties.Quota;
      expect(quota.Limit).toBe(1000);
      expect(quota.Period).toBe('MONTH');
    });

    test('should have API key defined', () => {
      expect(template.Resources.ApiKey).toBeDefined();
      expect(template.Resources.ApiKey.Type).toBe('AWS::ApiGateway::ApiKey');
      expect(template.Resources.ApiKey.Properties.Enabled).toBe(true);
    });

    test('should have usage plan key linking API key to usage plan', () => {
      expect(template.Resources.UsagePlanKey).toBeDefined();
      expect(template.Resources.UsagePlanKey.Type).toBe(
        'AWS::ApiGateway::UsagePlanKey'
      );
      expect(template.Resources.UsagePlanKey.Properties.KeyType).toBe('API_KEY');
    });
  });

  describe('Lambda Permission', () => {
    test('should have permission for API Gateway to invoke Lambda', () => {
      expect(template.Resources.LambdaApiGatewayPermission).toBeDefined();
      expect(template.Resources.LambdaApiGatewayPermission.Type).toBe(
        'AWS::Lambda::Permission'
      );
      expect(
        template.Resources.LambdaApiGatewayPermission.Properties.Action
      ).toBe('lambda:InvokeFunction');
      expect(
        template.Resources.LambdaApiGatewayPermission.Properties.Principal
      ).toBe('apigateway.amazonaws.com');
    });
  });

  describe('CloudWatch Logging', () => {
    test('should have Lambda log group', () => {
      expect(template.Resources.LambdaLogGroup).toBeDefined();
      expect(template.Resources.LambdaLogGroup.Type).toBe('AWS::Logs::LogGroup');
      expect(template.Resources.LambdaLogGroup.Properties.RetentionInDays).toBe(7);
    });
  });

  describe('Outputs', () => {
    test('should export API Gateway endpoint', () => {
      expect(template.Outputs.ApiGatewayEndpoint).toBeDefined();
      expect(template.Outputs.ApiGatewayEndpoint.Description).toContain(
        'API Gateway endpoint'
      );
      expect(template.Outputs.ApiGatewayEndpoint.Export).toBeDefined();
    });

    test('should export API key ID', () => {
      expect(template.Outputs.ApiKeyId).toBeDefined();
      expect(template.Outputs.ApiKeyId.Description).toContain('API Key');
    });

    test('should export DynamoDB table name', () => {
      expect(template.Outputs.DynamoDBTableName).toBeDefined();
      expect(template.Outputs.DynamoDBTableName.Description).toContain(
        'DynamoDB Table Name'
      );
    });

    test('should export DynamoDB table ARN', () => {
      expect(template.Outputs.DynamoDBTableArn).toBeDefined();
      expect(template.Outputs.DynamoDBTableArn.Description).toContain(
        'DynamoDB Table ARN'
      );
    });

    test('should export Lambda function name', () => {
      expect(template.Outputs.LambdaFunctionName).toBeDefined();
      expect(template.Outputs.LambdaFunctionName.Description).toContain(
        'Lambda Function Name'
      );
    });

    test('should export Lambda function ARN', () => {
      expect(template.Outputs.LambdaFunctionArn).toBeDefined();
      expect(template.Outputs.LambdaFunctionArn.Description).toContain(
        'Lambda Function ARN'
      );
    });

    test('should export REST API ID', () => {
      expect(template.Outputs.RestApiId).toBeDefined();
      expect(template.Outputs.RestApiId.Description).toContain('REST API ID');
    });
  });

  describe('Resource Naming', () => {
    test('should use environment suffix in resource names', () => {
      // Check that resources use !Sub with EnvironmentSuffix
      const tableNameSub = template.Resources.UserDataTable.Properties.TableName;
      expect(tableNameSub).toBeDefined();
    });
  });

  describe('Security', () => {
    test('should require API keys for all methods', () => {
      expect(template.Resources.GetMethod.Properties.ApiKeyRequired).toBe(true);
      expect(template.Resources.PostMethod.Properties.ApiKeyRequired).toBe(true);
    });

    test('should use least privilege IAM policies', () => {
      const role = template.Resources.LambdaExecutionRole;
      const policies = role.Properties.Policies;
      const dynamoPolicy = policies.find(
        (p: any) => p.PolicyName === 'DynamoDBAccess'
      );
      const actions = dynamoPolicy.PolicyDocument.Statement[0].Action;

      // Should only have specific actions, not wildcards
      expect(actions).toContain('dynamodb:PutItem');
      expect(actions).toContain('dynamodb:GetItem');
      expect(actions).not.toContain('dynamodb:*');
    });
  });

  describe('LocalStack Compatibility', () => {
    test('should not have PointInTimeRecovery (not fully supported in LocalStack)', () => {
      const table = template.Resources.UserDataTable;
      expect(table.Properties.PointInTimeRecoverySpecification).toBeUndefined();
    });

    test('should not have StreamSpecification (optional for LocalStack)', () => {
      const table = template.Resources.UserDataTable;
      expect(table.Properties.StreamSpecification).toBeUndefined();
    });

    test('should not have API Gateway Account resource (not supported in LocalStack)', () => {
      expect(template.Resources.ApiGatewayAccount).toBeUndefined();
    });

    test('should not have API Gateway CloudWatch Role (not needed for LocalStack)', () => {
      expect(template.Resources.ApiGatewayCloudWatchRole).toBeUndefined();
    });

    test('should use python3.11 runtime (compatible with LocalStack)', () => {
      const lambda = template.Resources.UserDataLambda;
      expect(lambda.Properties.Runtime).toBe('python3.11');
    });

    test('Lambda code should support LocalStack endpoint configuration', () => {
      const lambda = template.Resources.UserDataLambda;
      const code = lambda.Properties.Code.ZipFile;
      expect(code).toContain('AWS_ENDPOINT_URL');
      expect(code).toContain('endpoint_url');
    });
  });

  describe('File Format', () => {
    test('should be valid YAML format', () => {
      expect(yamlContent.length).toBeGreaterThan(0);
      expect(() => yamlParse(yamlContent)).not.toThrow();
    });

    test('should have proper indentation', () => {
      const lines = yamlContent.split('\n');
      let hasProperIndentation = false;
      for (const line of lines) {
        if (line.startsWith('  ') && !line.startsWith('   ')) {
          hasProperIndentation = true;
          break;
        }
      }
      expect(hasProperIndentation).toBe(true);
    });
  });

  describe('Resource Count', () => {
    test('should have all required resources', () => {
      const expectedResources = [
        'UserDataTable',
        'LambdaExecutionRole',
        'UserDataLambda',
        'LambdaLogGroup',
        'UserDataApi',
        'UserDataResource',
        'GetMethod',
        'PostMethod',
        'LambdaApiGatewayPermission',
        'ApiDeployment',
        'ApiKey',
        'UsagePlan',
        'UsagePlanKey',
      ];

      expectedResources.forEach(resource => {
        expect(template.Resources[resource]).toBeDefined();
      });
    });

    test('should have exactly 7 outputs', () => {
      const outputCount = Object.keys(template.Outputs).length;
      expect(outputCount).toBe(7);
    });
  });
});
