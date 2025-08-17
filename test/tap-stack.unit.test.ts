import fs from 'fs';
import * as yaml from 'js-yaml';
import path from 'path';

const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';

describe('TapStack CloudFormation Template', () => {
  let template: any;

  beforeAll(() => {
    // Load YAML template directly since it contains CloudFormation intrinsic functions
    const templatePath = path.join(__dirname, '../lib/TapStack.yml');
    const templateContent = fs.readFileSync(templatePath, 'utf8');

    // Use js-yaml with a comprehensive schema to handle all CloudFormation functions
    const CloudFormationSchema = yaml.DEFAULT_SCHEMA.extend([
      new yaml.Type('!Ref', {
        kind: 'scalar',
        construct: data => ({ Ref: data }),
      }),
      new yaml.Type('!GetAtt', {
        kind: 'sequence',
        construct: data => ({ 'Fn::GetAtt': data }),
      }),
      new yaml.Type('!GetAtt', {
        kind: 'scalar',
        construct: data => {
          // Handle dot notation like !GetAtt Resource.Attribute
          const parts = data.split('.');
          return { 'Fn::GetAtt': parts };
        },
      }),
      new yaml.Type('!Sub', {
        kind: 'scalar',
        construct: data => ({ 'Fn::Sub': data }),
      }),
      new yaml.Type('!Join', {
        kind: 'sequence',
        construct: data => ({ 'Fn::Join': data }),
      }),
      new yaml.Type('!Select', {
        kind: 'sequence',
        construct: data => ({ 'Fn::Select': data }),
      }),
      new yaml.Type('!Split', {
        kind: 'sequence',
        construct: data => ({ 'Fn::Split': data }),
      }),
      new yaml.Type('!Base64', {
        kind: 'scalar',
        construct: data => ({ 'Fn::Base64': data }),
      }),
      new yaml.Type('!If', {
        kind: 'sequence',
        construct: data => ({ 'Fn::If': data }),
      }),
      new yaml.Type('!Not', {
        kind: 'sequence',
        construct: data => ({ 'Fn::Not': data }),
      }),
      new yaml.Type('!Equals', {
        kind: 'sequence',
        construct: data => ({ 'Fn::Equals': data }),
      }),
      new yaml.Type('!And', {
        kind: 'sequence',
        construct: data => ({ 'Fn::And': data }),
      }),
      new yaml.Type('!Or', {
        kind: 'sequence',
        construct: data => ({ 'Fn::Or': data }),
      }),
    ]);

    template = yaml.load(templateContent, { schema: CloudFormationSchema });
  });

  describe('Template Security and Best Practices', () => {
    test('Lambda function should have appropriate timeout', () => {
      const lambda = template.Resources.TapDataProcessorFunction;
      expect(lambda.Properties.Timeout).toBeLessThanOrEqual(15);
      expect(lambda.Properties.Timeout).toBeGreaterThan(0);
    });

    test('Lambda function should have appropriate memory size', () => {
      const lambda = template.Resources.TapDataProcessorFunction;
      expect(lambda.Properties.MemorySize).toBeGreaterThanOrEqual(128);
      expect(lambda.Properties.MemorySize).toBeLessThanOrEqual(3008);
    });

    test('DynamoDB table should have deletion protection disabled for non-prod', () => {
      const table = template.Resources.TurnAroundPromptTable;
      expect(table.Properties.DeletionProtectionEnabled).toBe(false);
    });

    test('CloudWatch log groups should have retention policy', () => {
      const lambdaLogGroup = template.Resources.TapLambdaLogGroup;
      const apiLogGroup = template.Resources.TapApiGatewayLogGroup;

      expect(lambdaLogGroup.Properties.RetentionInDays).toBeDefined();
      expect(apiLogGroup.Properties.RetentionInDays).toBeDefined();
    });

    test('API Gateway should use regional endpoint', () => {
      const api = template.Resources.TapServerlessApi;
      expect(api.Properties.EndpointConfiguration.Types).toContain('REGIONAL');
    });
  });

  describe('Template Structure', () => {
    test('should have valid CloudFormation format version', () => {
      expect(template.AWSTemplateFormatVersion).toBe('2010-09-09');
    });

    test('should have a description', () => {
      expect(template.Description).toBeDefined();
      expect(template.Description).toBe(
        'TAP Stack - Task Assignment Platform CloudFormation Template'
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

    test('should have LambdaFunctionName parameter', () => {
      expect(template.Parameters.LambdaFunctionName).toBeDefined();
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

    test('LambdaFunctionName parameter should have correct properties', () => {
      const lambdaParam = template.Parameters.LambdaFunctionName;
      expect(lambdaParam.Type).toBe('String');
      expect(lambdaParam.Default).toBe('tap-data-processor');
      expect(lambdaParam.Description).toBe('Name for the Lambda function');
      expect(lambdaParam.MinLength).toBe(1);
      expect(lambdaParam.MaxLength).toBe(64);
      expect(lambdaParam.AllowedPattern).toBe('^[a-zA-Z0-9-_]+$');
      expect(lambdaParam.ConstraintDescription).toBe(
        'Must contain only alphanumeric characters, hyphens, and underscores'
      );
    });
  });

  describe('Resources', () => {
    const expectedResources = [
      'TurnAroundPromptTable',
      'TapLambdaExecutionRole',
      'TapLambdaLogGroup',
      'TapDataProcessorFunction',
      'TapLambdaApiGatewayPermission',
      'TapServerlessApi',
      'TapDataResource',
      'TapDataGetMethod',
      'TapApiDeployment',
      'TapApiStage',
      'TapApiGatewayLogGroup',
      'TapApiGatewayCloudWatchRole',
      'TapApiGatewayAccount',
    ];

    test('should have all required resources', () => {
      expectedResources.forEach(resourceName => {
        expect(template.Resources[resourceName]).toBeDefined();
      });
    });

    describe('DynamoDB Table', () => {
      test('TurnAroundPromptTable should be a DynamoDB table', () => {
        const table = template.Resources.TurnAroundPromptTable;
        expect(table.Type).toBe('AWS::DynamoDB::Table');
      });

      test('TurnAroundPromptTable should have correct deletion policies', () => {
        const table = template.Resources.TurnAroundPromptTable;
        expect(table.DeletionPolicy).toBe('Delete');
        expect(table.UpdateReplacePolicy).toBe('Delete');
      });

      test('TurnAroundPromptTable should have correct properties', () => {
        const table = template.Resources.TurnAroundPromptTable;
        const properties = table.Properties;

        expect(properties.TableName).toEqual({
          'Fn::Sub': 'TurnAroundPromptTable${EnvironmentSuffix}',
        });
        expect(properties.BillingMode).toBe('PAY_PER_REQUEST');
        expect(properties.DeletionProtectionEnabled).toBe(false);
      });

      test('TurnAroundPromptTable should have correct attribute definitions', () => {
        const table = template.Resources.TurnAroundPromptTable;
        const attributeDefinitions = table.Properties.AttributeDefinitions;

        expect(attributeDefinitions).toHaveLength(1);
        expect(attributeDefinitions[0].AttributeName).toBe('id');
        expect(attributeDefinitions[0].AttributeType).toBe('S');
      });

      test('TurnAroundPromptTable should have correct key schema', () => {
        const table = template.Resources.TurnAroundPromptTable;
        const keySchema = table.Properties.KeySchema;

        expect(keySchema).toHaveLength(1);
        expect(keySchema[0].AttributeName).toBe('id');
        expect(keySchema[0].KeyType).toBe('HASH');
      });
    });

    describe('IAM Roles', () => {
      test('TapLambdaExecutionRole should be an IAM Role', () => {
        const role = template.Resources.TapLambdaExecutionRole;
        expect(role.Type).toBe('AWS::IAM::Role');
      });

      test('TapLambdaExecutionRole should have correct properties', () => {
        const role = template.Resources.TapLambdaExecutionRole;
        const properties = role.Properties;

        expect(properties.RoleName).toEqual({
          'Fn::Sub':
            '${LambdaFunctionName}-execution-role-${EnvironmentSuffix}',
        });
        expect(
          properties.AssumeRolePolicyDocument.Statement[0].Principal.Service
        ).toBe('lambda.amazonaws.com');
        expect(properties.ManagedPolicyArns).toContain(
          'arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole'
        );
      });

      test('TapLambdaExecutionRole should have DynamoDB and CloudWatch policies', () => {
        const role = template.Resources.TapLambdaExecutionRole;
        const policies = role.Properties.Policies;

        expect(policies).toHaveLength(2);
        expect(
          policies.some((p: any) => p.PolicyName === 'CloudWatchLogsPolicy')
        ).toBe(true);
        expect(
          policies.some((p: any) => p.PolicyName === 'DynamoDBAccessPolicy')
        ).toBe(true);
      });

      test('TapApiGatewayCloudWatchRole should be an IAM Role', () => {
        const role = template.Resources.TapApiGatewayCloudWatchRole;
        expect(role.Type).toBe('AWS::IAM::Role');
        expect(
          role.Properties.AssumeRolePolicyDocument.Statement[0].Principal
            .Service
        ).toBe('apigateway.amazonaws.com');
      });
    });

    describe('Lambda Function', () => {
      test('TapDataProcessorFunction should be a Lambda function', () => {
        const lambda = template.Resources.TapDataProcessorFunction;
        expect(lambda.Type).toBe('AWS::Lambda::Function');
      });

      test('TapDataProcessorFunction should have correct properties', () => {
        const lambda = template.Resources.TapDataProcessorFunction;
        const properties = lambda.Properties;

        expect(properties.FunctionName).toEqual({
          'Fn::Sub': '${LambdaFunctionName}-${EnvironmentSuffix}',
        });
        expect(properties.Runtime).toBe('python3.9');
        expect(properties.Handler).toBe('index.lambda_handler');
        expect(properties.MemorySize).toBe(256);
        expect(properties.Timeout).toBe(15);
      });

      test('TapDataProcessorFunction should have correct environment variables', () => {
        const lambda = template.Resources.TapDataProcessorFunction;
        const envVars = lambda.Properties.Environment.Variables;

        expect(envVars.ENVIRONMENT).toEqual({ Ref: 'EnvironmentSuffix' });
        expect(envVars.LOG_LEVEL).toBe('INFO');
        expect(envVars.DATA_SOURCE).toBe('api-gateway');
        expect(envVars.REGION).toBe('us-east-1');
        expect(envVars.DYNAMODB_TABLE).toEqual({
          Ref: 'TurnAroundPromptTable',
        });
      });

      test('TapDataProcessorFunction should depend on log group', () => {
        const lambda = template.Resources.TapDataProcessorFunction;
        expect(lambda.DependsOn).toBe('TapLambdaLogGroup');
      });
    });

    describe('API Gateway', () => {
      test('TapServerlessApi should be a REST API', () => {
        const api = template.Resources.TapServerlessApi;
        expect(api.Type).toBe('AWS::ApiGateway::RestApi');
      });

      test('TapServerlessApi should have correct properties', () => {
        const api = template.Resources.TapServerlessApi;
        const properties = api.Properties;

        expect(properties.Name).toEqual({
          'Fn::Sub': 'tap-api-${EnvironmentSuffix}',
        });
        expect(properties.EndpointConfiguration.Types).toContain('REGIONAL');
      });

      test('TapDataResource should be an API Gateway Resource', () => {
        const resource = template.Resources.TapDataResource;
        expect(resource.Type).toBe('AWS::ApiGateway::Resource');
        expect(resource.Properties.PathPart).toBe('data');
      });

      test('TapDataGetMethod should be an API Gateway Method', () => {
        const method = template.Resources.TapDataGetMethod;
        expect(method.Type).toBe('AWS::ApiGateway::Method');
        expect(method.Properties.HttpMethod).toBe('GET');
        expect(method.Properties.AuthorizationType).toBe('NONE');
        expect(method.Properties.Integration.Type).toBe('AWS_PROXY');
      });

      test('TapApiDeployment should be an API Gateway Deployment', () => {
        const deployment = template.Resources.TapApiDeployment;
        expect(deployment.Type).toBe('AWS::ApiGateway::Deployment');
        expect(deployment.DependsOn).toBe('TapDataGetMethod');
      });

      test('TapApiStage should be an API Gateway Stage', () => {
        const stage = template.Resources.TapApiStage;
        expect(stage.Type).toBe('AWS::ApiGateway::Stage');
        expect(stage.Properties.StageName).toEqual({
          Ref: 'EnvironmentSuffix',
        });

        // Verify MethodSettings has correct ResourcePath
        const methodSettings = stage.Properties.MethodSettings;
        expect(methodSettings).toHaveLength(1);
        expect(methodSettings[0].ResourcePath).toBe('/*');
        expect(methodSettings[0].HttpMethod).toBe('*');
        expect(methodSettings[0].LoggingLevel).toBe('INFO');
        expect(methodSettings[0].DataTraceEnabled).toBe(true);
        expect(methodSettings[0].MetricsEnabled).toBe(true);
      });
    });

    describe('CloudWatch Log Groups', () => {
      test('TapLambdaLogGroup should be a CloudWatch Log Group', () => {
        const logGroup = template.Resources.TapLambdaLogGroup;
        expect(logGroup.Type).toBe('AWS::Logs::LogGroup');
        expect(logGroup.Properties.RetentionInDays).toBe(14);
      });

      test('TapApiGatewayLogGroup should be a CloudWatch Log Group', () => {
        const logGroup = template.Resources.TapApiGatewayLogGroup;
        expect(logGroup.Type).toBe('AWS::Logs::LogGroup');
        expect(logGroup.Properties.RetentionInDays).toBe(14);
      });
    });

    describe('Lambda Permissions', () => {
      test('TapLambdaApiGatewayPermission should be a Lambda Permission', () => {
        const permission = template.Resources.TapLambdaApiGatewayPermission;
        expect(permission.Type).toBe('AWS::Lambda::Permission');
        expect(permission.Properties.Principal).toBe(
          'apigateway.amazonaws.com'
        );
        expect(permission.Properties.Action).toBe('lambda:InvokeFunction');
        expect(permission.Properties.SourceArn).toEqual({
          'Fn::Sub':
            'arn:aws:execute-api:us-east-1:${AWS::AccountId}:${TapServerlessApi}/*/*',
        });
      });
    });

    describe('API Gateway Account', () => {
      test('TapApiGatewayAccount should be an API Gateway Account', () => {
        const account = template.Resources.TapApiGatewayAccount;
        expect(account.Type).toBe('AWS::ApiGateway::Account');
      });
    });
  });

  describe('Outputs', () => {
    const expectedOutputs = [
      'TurnAroundPromptTableName',
      'TurnAroundPromptTableArn',
      'TapApiEndpoint',
      'TapApiGatewayId',
      'TapLambdaFunctionArn',
      'TapLambdaFunctionName',
      'TapLambdaLogGroup',
      'TapApiGatewayLogGroup',
      'StackName',
      'EnvironmentSuffix',
    ];

    test('should have all required outputs', () => {
      expectedOutputs.forEach(outputName => {
        expect(template.Outputs[outputName]).toBeDefined();
      });
    });

    describe('DynamoDB Outputs', () => {
      test('TurnAroundPromptTableName output should be correct', () => {
        const output = template.Outputs.TurnAroundPromptTableName;
        expect(output.Description).toBe('Name of the DynamoDB table');
        expect(output.Value).toEqual({ Ref: 'TurnAroundPromptTable' });
        expect(output.Export.Name).toEqual({
          'Fn::Sub': '${AWS::StackName}-TurnAroundPromptTableName',
        });
      });

      test('TurnAroundPromptTableArn output should be correct', () => {
        const output = template.Outputs.TurnAroundPromptTableArn;
        expect(output.Description).toBe('ARN of the DynamoDB table');
        expect(output.Value).toEqual({
          'Fn::GetAtt': ['TurnAroundPromptTable', 'Arn'],
        });
        expect(output.Export.Name).toEqual({
          'Fn::Sub': '${AWS::StackName}-TurnAroundPromptTableArn',
        });
      });
    });

    describe('API Gateway Outputs', () => {
      test('TapApiEndpoint output should be correct', () => {
        const output = template.Outputs.TapApiEndpoint;
        expect(output.Description).toBe(
          'API Gateway endpoint URL for the /data resource'
        );
        expect(output.Value).toEqual({
          'Fn::Sub':
            'https://${TapServerlessApi}.execute-api.us-east-1.amazonaws.com/${EnvironmentSuffix}/data',
        });
        expect(output.Export.Name).toEqual({
          'Fn::Sub': '${AWS::StackName}-TapApiEndpoint',
        });
      });

      test('TapApiGatewayId output should be correct', () => {
        const output = template.Outputs.TapApiGatewayId;
        expect(output.Description).toBe('ID of the TAP API Gateway');
        expect(output.Value).toEqual({ Ref: 'TapServerlessApi' });
        expect(output.Export.Name).toEqual({
          'Fn::Sub': '${AWS::StackName}-TapApiGatewayId',
        });
      });
    });

    describe('Lambda Outputs', () => {
      test('TapLambdaFunctionArn output should be correct', () => {
        const output = template.Outputs.TapLambdaFunctionArn;
        expect(output.Description).toBe('ARN of the TAP Lambda function');
        expect(output.Value).toEqual({
          'Fn::GetAtt': ['TapDataProcessorFunction', 'Arn'],
        });
        expect(output.Export.Name).toEqual({
          'Fn::Sub': '${AWS::StackName}-TapLambdaFunctionArn',
        });
      });

      test('TapLambdaFunctionName output should be correct', () => {
        const output = template.Outputs.TapLambdaFunctionName;
        expect(output.Description).toBe('Name of the TAP Lambda function');
        expect(output.Value).toEqual({ Ref: 'TapDataProcessorFunction' });
        expect(output.Export.Name).toEqual({
          'Fn::Sub': '${AWS::StackName}-TapLambdaFunctionName',
        });
      });
    });

    describe('CloudWatch Outputs', () => {
      test('TapLambdaLogGroup output should be correct', () => {
        const output = template.Outputs.TapLambdaLogGroup;
        expect(output.Description).toBe(
          'CloudWatch Log Group for TAP Lambda function'
        );
        expect(output.Value).toEqual({ Ref: 'TapLambdaLogGroup' });
        expect(output.Export.Name).toEqual({
          'Fn::Sub': '${AWS::StackName}-TapLambdaLogGroup',
        });
      });

      test('TapApiGatewayLogGroup output should be correct', () => {
        const output = template.Outputs.TapApiGatewayLogGroup;
        expect(output.Description).toBe(
          'CloudWatch Log Group for TAP API Gateway'
        );
        expect(output.Value).toEqual({ Ref: 'TapApiGatewayLogGroup' });
        expect(output.Export.Name).toEqual({
          'Fn::Sub': '${AWS::StackName}-TapApiGatewayLogGroup',
        });
      });
    });

    describe('Stack Information Outputs', () => {
      test('StackName output should be correct', () => {
        const output = template.Outputs.StackName;
        expect(output.Description).toBe('Name of this CloudFormation stack');
        expect(output.Value).toEqual({ Ref: 'AWS::StackName' });
        expect(output.Export.Name).toEqual({
          'Fn::Sub': '${AWS::StackName}-StackName',
        });
      });

      test('EnvironmentSuffix output should be correct', () => {
        const output = template.Outputs.EnvironmentSuffix;
        expect(output.Description).toBe(
          'Environment suffix used for this deployment'
        );
        expect(output.Value).toEqual({ Ref: 'EnvironmentSuffix' });
        expect(output.Export.Name).toEqual({
          'Fn::Sub': '${AWS::StackName}-EnvironmentSuffix',
        });
      });
    });
  });

  describe('Template Validation', () => {
    test('should have valid YAML structure', () => {
      expect(template).toBeDefined();
      expect(typeof template).toBe('object');
    });

    test('should not have any undefined or null required sections', () => {
      expect(template.AWSTemplateFormatVersion).not.toBeNull();
      expect(template.Description).not.toBeNull();
      expect(template.Parameters).not.toBeNull();
      expect(template.Resources).not.toBeNull();
      expect(template.Outputs).not.toBeNull();
      expect(template.Metadata).not.toBeNull();
    });

    test('should have correct number of resources', () => {
      const resourceCount = Object.keys(template.Resources).length;
      expect(resourceCount).toBe(13); // Updated to reflect all serverless resources
    });

    test('should have correct number of parameters', () => {
      const parameterCount = Object.keys(template.Parameters).length;
      expect(parameterCount).toBe(2); // EnvironmentSuffix and LambdaFunctionName
    });

    test('should have correct number of outputs', () => {
      const outputCount = Object.keys(template.Outputs).length;
      expect(outputCount).toBe(10); // Updated to reflect all outputs
    });

    test('all resources should have a Type property', () => {
      Object.values(template.Resources).forEach((resource: any) => {
        expect(resource.Type).toBeDefined();
        expect(typeof resource.Type).toBe('string');
      });
    });

    test('all outputs should have Description and Value properties', () => {
      Object.values(template.Outputs).forEach((output: any) => {
        expect(output.Description).toBeDefined();
        expect(output.Value).toBeDefined();
        expect(output.Export).toBeDefined();
        expect(output.Export.Name).toBeDefined();
      });
    });

    test('template should be deployable to us-east-1 region', () => {
      const lambda = template.Resources.TapDataProcessorFunction;
      expect(lambda.Properties.Environment.Variables.REGION).toBe('us-east-1');

      // Check if any hardcoded regions are us-east-1
      const templateStr = JSON.stringify(template);
      if (templateStr.includes('us-')) {
        expect(templateStr.includes('us-east-1')).toBe(true);
      }
    });
  });

  describe('Resource Naming Convention', () => {
    test('DynamoDB table name should follow naming convention with environment suffix', () => {
      const table = template.Resources.TurnAroundPromptTable;
      const tableName = table.Properties.TableName;

      expect(tableName).toEqual({
        'Fn::Sub': 'TurnAroundPromptTable${EnvironmentSuffix}',
      });
    });

    test('Lambda function name should follow naming convention with environment suffix', () => {
      const lambda = template.Resources.TapDataProcessorFunction;
      expect(lambda.Properties.FunctionName).toEqual({
        'Fn::Sub': '${LambdaFunctionName}-${EnvironmentSuffix}',
      });
    });

    test('IAM role names should follow naming convention with environment suffix', () => {
      const lambdaRole = template.Resources.TapLambdaExecutionRole;
      expect(lambdaRole.Properties.RoleName).toEqual({
        'Fn::Sub': '${LambdaFunctionName}-execution-role-${EnvironmentSuffix}',
      });

      const apiRole = template.Resources.TapApiGatewayCloudWatchRole;
      expect(apiRole.Properties.RoleName).toEqual({
        'Fn::Sub': 'tap-apigateway-cloudwatch-role-${EnvironmentSuffix}',
      });
    });

    test('API Gateway name should follow naming convention with environment suffix', () => {
      const api = template.Resources.TapServerlessApi;
      expect(api.Properties.Name).toEqual({
        'Fn::Sub': 'tap-api-${EnvironmentSuffix}',
      });
    });

    test('CloudWatch log group names should follow naming convention', () => {
      const lambdaLogGroup = template.Resources.TapLambdaLogGroup;
      expect(lambdaLogGroup.Properties.LogGroupName).toEqual({
        'Fn::Sub': '/aws/lambda/${LambdaFunctionName}-${EnvironmentSuffix}',
      });

      const apiLogGroup = template.Resources.TapApiGatewayLogGroup;
      expect(apiLogGroup.Properties.LogGroupName).toEqual({
        'Fn::Sub':
          'API-Gateway-Execution-Logs_${TapServerlessApi}/${EnvironmentSuffix}',
      });
    });

    test('API Gateway stage name should use environment suffix', () => {
      const stage = template.Resources.TapApiStage;
      expect(stage.Properties.StageName).toEqual({ Ref: 'EnvironmentSuffix' });
    });

    test('all export names should follow naming convention', () => {
      Object.keys(template.Outputs).forEach(outputKey => {
        const output = template.Outputs[outputKey];
        expect(output.Export.Name).toEqual({
          'Fn::Sub': `\${AWS::StackName}-${outputKey}`,
        });
      });
    });

    test('all TAP resources should have consistent "Tap" prefix', () => {
      const tapResources = [
        'TapLambdaExecutionRole',
        'TapLambdaLogGroup',
        'TapDataProcessorFunction',
        'TapLambdaApiGatewayPermission',
        'TapServerlessApi',
        'TapDataResource',
        'TapDataGetMethod',
        'TapApiDeployment',
        'TapApiStage',
        'TapApiGatewayLogGroup',
        'TapApiGatewayCloudWatchRole',
        'TapApiGatewayAccount',
      ];

      tapResources.forEach(resourceName => {
        expect(resourceName.startsWith('Tap')).toBe(true);
        expect(template.Resources[resourceName]).toBeDefined();
      });
    });
  });
});
