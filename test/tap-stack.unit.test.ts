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
        'Serverless infrastructure with Lambda, API Gateway, and DynamoDB for trainr929 project'
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
        'Environment suffix for resource naming'
      );
      expect(envSuffixParam.AllowedPattern).toBe('^[a-zA-Z0-9]+$');
      expect(envSuffixParam.ConstraintDescription).toBe(
        'Must contain only alphanumeric characters'
      );
    });

    test('should have Environment parameter', () => {
      expect(template.Parameters.Environment).toBeDefined();
      expect(template.Parameters.Environment.Type).toBe('String');
      expect(template.Parameters.Environment.Default).toBe('dev');
    });

    test('should have Project parameter', () => {
      expect(template.Parameters.Project).toBeDefined();
      expect(template.Parameters.Project.Type).toBe('String');
      expect(template.Parameters.Project.Default).toBe('trainr929');
    });
  });

  describe('Resources - DynamoDB Table', () => {
    test('should have DataProcessingTable resource', () => {
      expect(template.Resources.DataProcessingTable).toBeDefined();
    });

    test('DataProcessingTable should be a DynamoDB table', () => {
      const table = template.Resources.DataProcessingTable;
      expect(table.Type).toBe('AWS::DynamoDB::Table');
    });

    test('DataProcessingTable should have correct deletion policies', () => {
      const table = template.Resources.DataProcessingTable;
      expect(table.DeletionPolicy).toBe('Delete');
      expect(table.UpdateReplacePolicy).toBe('Delete');
    });

    test('DataProcessingTable should have correct properties', () => {
      const table = template.Resources.DataProcessingTable;
      const properties = table.Properties;

      expect(properties.TableName).toEqual({
        'Fn::Sub': '${Project}-data-processing-table-${EnvironmentSuffix}',
      });
      expect(properties.BillingMode).toBe('PAY_PER_REQUEST');
    });

    test('DataProcessingTable should have correct attribute definitions', () => {
      const table = template.Resources.DataProcessingTable;
      const attributeDefinitions = table.Properties.AttributeDefinitions;

      expect(attributeDefinitions).toHaveLength(1);
      expect(attributeDefinitions[0].AttributeName).toBe('id');
      expect(attributeDefinitions[0].AttributeType).toBe('S');
    });

    test('DataProcessingTable should have correct key schema', () => {
      const table = template.Resources.DataProcessingTable;
      const keySchema = table.Properties.KeySchema;

      expect(keySchema).toHaveLength(1);
      expect(keySchema[0].AttributeName).toBe('id');
      expect(keySchema[0].KeyType).toBe('HASH');
    });

    test('DataProcessingTable should have streams enabled', () => {
      const table = template.Resources.DataProcessingTable;
      expect(table.Properties.StreamSpecification).toBeDefined();
      expect(table.Properties.StreamSpecification.StreamViewType).toBe('NEW_AND_OLD_IMAGES');
    });

    test('DataProcessingTable should have point-in-time recovery enabled', () => {
      const table = template.Resources.DataProcessingTable;
      expect(table.Properties.PointInTimeRecoverySpecification).toBeDefined();
      expect(table.Properties.PointInTimeRecoverySpecification.PointInTimeRecoveryEnabled).toBe(true);
    });

    test('DataProcessingTable should have KMS encryption', () => {
      const table = template.Resources.DataProcessingTable;
      expect(table.Properties.SSESpecification).toBeDefined();
      expect(table.Properties.SSESpecification.SSEEnabled).toBe(true);
      expect(table.Properties.SSESpecification.SSEType).toBe('KMS');
      expect(table.Properties.SSESpecification.KMSMasterKeyId).toBe('alias/aws/dynamodb');
    });

    test('DataProcessingTable should have proper tags', () => {
      const table = template.Resources.DataProcessingTable;
      const tags = table.Properties.Tags;
      
      expect(tags).toBeDefined();
      expect(tags).toContainEqual({
        Key: 'Environment',
        Value: { Ref: 'Environment' }
      });
      expect(tags).toContainEqual({
        Key: 'Project',
        Value: { Ref: 'Project' }
      });
    });
  });

  describe('Resources - IAM Roles', () => {
    test('should have LambdaExecutionRole', () => {
      expect(template.Resources.LambdaExecutionRole).toBeDefined();
      expect(template.Resources.LambdaExecutionRole.Type).toBe('AWS::IAM::Role');
    });

    test('LambdaExecutionRole should have correct properties', () => {
      const role = template.Resources.LambdaExecutionRole;
      expect(role.Properties.RoleName).toEqual({
        'Fn::Sub': '${Project}-lambda-execution-role-${EnvironmentSuffix}'
      });
      expect(role.Properties.AssumeRolePolicyDocument).toBeDefined();
      expect(role.Properties.ManagedPolicyArns).toContain(
        'arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole'
      );
      expect(role.Properties.ManagedPolicyArns).toContain(
        'arn:aws:iam::aws:policy/AWSXRayDaemonWriteAccess'
      );
    });

    test('LambdaExecutionRole should have DynamoDB access policy', () => {
      const role = template.Resources.LambdaExecutionRole;
      const policies = role.Properties.Policies;
      
      expect(policies).toBeDefined();
      expect(policies).toHaveLength(1);
      expect(policies[0].PolicyName).toBe('DynamoDBAccess');
      
      const policyDocument = policies[0].PolicyDocument;
      expect(policyDocument.Statement).toBeDefined();
      expect(policyDocument.Statement[0].Action).toContain('dynamodb:GetItem');
      expect(policyDocument.Statement[0].Action).toContain('dynamodb:PutItem');
      expect(policyDocument.Statement[0].Action).toContain('dynamodb:UpdateItem');
      expect(policyDocument.Statement[0].Action).toContain('dynamodb:DeleteItem');
    });

    test('should have StreamProcessorRole', () => {
      expect(template.Resources.StreamProcessorRole).toBeDefined();
      expect(template.Resources.StreamProcessorRole.Type).toBe('AWS::IAM::Role');
    });

    test('StreamProcessorRole should have correct properties', () => {
      const role = template.Resources.StreamProcessorRole;
      expect(role.Properties.RoleName).toEqual({
        'Fn::Sub': '${Project}-stream-processor-role-${EnvironmentSuffix}'
      });
      expect(role.Properties.ManagedPolicyArns).toContain(
        'arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole'
      );
    });

    test('StreamProcessorRole should have DynamoDB stream access', () => {
      const role = template.Resources.StreamProcessorRole;
      const policies = role.Properties.Policies;
      
      expect(policies).toBeDefined();
      expect(policies[0].PolicyName).toBe('DynamoDBStreamAccess');
      
      const statement = policies[0].PolicyDocument.Statement[0];
      expect(statement.Action).toContain('dynamodb:DescribeStream');
      expect(statement.Action).toContain('dynamodb:GetRecords');
      expect(statement.Action).toContain('dynamodb:GetShardIterator');
      expect(statement.Action).toContain('dynamodb:ListStreams');
    });
  });

  describe('Resources - Lambda Functions', () => {
    test('should have DataProcessingFunction', () => {
      expect(template.Resources.DataProcessingFunction).toBeDefined();
      expect(template.Resources.DataProcessingFunction.Type).toBe('AWS::Lambda::Function');
    });

    test('DataProcessingFunction should have correct configuration', () => {
      const lambda = template.Resources.DataProcessingFunction;
      const props = lambda.Properties;
      
      expect(props.FunctionName).toEqual({
        'Fn::Sub': '${Project}-data-processing-function-${EnvironmentSuffix}'
      });
      expect(props.Runtime).toBe('python3.12');
      expect(props.Handler).toBe('index.lambda_handler');
      expect(props.MemorySize).toBe(512);
      expect(props.Timeout).toBe(30);
      expect(props.TracingConfig).toEqual({ Mode: 'Active' });
    });

    test('DataProcessingFunction should have environment variables', () => {
      const lambda = template.Resources.DataProcessingFunction;
      const envVars = lambda.Properties.Environment.Variables;
      
      expect(envVars.TABLE_NAME).toEqual({ Ref: 'DataProcessingTable' });
      expect(envVars.REGION).toEqual({ Ref: 'AWS::Region' });
      expect(envVars.ENVIRONMENT).toEqual({ Ref: 'Environment' });
    });

    test('should have StreamProcessorFunction', () => {
      expect(template.Resources.StreamProcessorFunction).toBeDefined();
      expect(template.Resources.StreamProcessorFunction.Type).toBe('AWS::Lambda::Function');
    });

    test('StreamProcessorFunction should have correct configuration', () => {
      const lambda = template.Resources.StreamProcessorFunction;
      const props = lambda.Properties;
      
      expect(props.FunctionName).toEqual({
        'Fn::Sub': '${Project}-stream-processor-function-${EnvironmentSuffix}'
      });
      expect(props.Runtime).toBe('python3.12');
      expect(props.MemorySize).toBe(256);
      expect(props.Timeout).toBe(30);
      expect(props.TracingConfig).toEqual({ Mode: 'Active' });
    });

    test('should have LambdaVersion resource', () => {
      expect(template.Resources.LambdaVersion).toBeDefined();
      expect(template.Resources.LambdaVersion.Type).toBe('AWS::Lambda::Version');
    });

    test('should have LambdaAlias resource', () => {
      expect(template.Resources.LambdaAlias).toBeDefined();
      expect(template.Resources.LambdaAlias.Type).toBe('AWS::Lambda::Alias');
      expect(template.Resources.LambdaAlias.Properties.Name).toBe('LIVE');
    });
  });

  describe('Resources - API Gateway', () => {
    test('should have HttpApi resource', () => {
      expect(template.Resources.HttpApi).toBeDefined();
      expect(template.Resources.HttpApi.Type).toBe('AWS::ApiGatewayV2::Api');
    });

    test('HttpApi should have correct configuration', () => {
      const api = template.Resources.HttpApi;
      const props = api.Properties;
      
      expect(props.Name).toEqual({
        'Fn::Sub': '${Project}-http-api-${EnvironmentSuffix}'
      });
      expect(props.ProtocolType).toBe('HTTP');
      expect(props.CorsConfiguration).toBeDefined();
    });

    test('HttpApi should have proper CORS configuration', () => {
      const cors = template.Resources.HttpApi.Properties.CorsConfiguration;
      
      expect(cors.AllowCredentials).toBe(false);
      expect(cors.AllowHeaders).toContain('Content-Type');
      expect(cors.AllowHeaders).toContain('Authorization');
      expect(cors.AllowMethods).toContain('GET');
      expect(cors.AllowMethods).toContain('POST');
      expect(cors.AllowMethods).toContain('PUT');
      expect(cors.AllowMethods).toContain('DELETE');
      expect(cors.AllowMethods).toContain('OPTIONS');
      expect(cors.AllowOrigins).toContain('*');
      expect(cors.MaxAge).toBe(86400);
    });

    test('should have LambdaIntegration resource', () => {
      expect(template.Resources.LambdaIntegration).toBeDefined();
      expect(template.Resources.LambdaIntegration.Type).toBe('AWS::ApiGatewayV2::Integration');
    });

    test('LambdaIntegration should have correct configuration', () => {
      const integration = template.Resources.LambdaIntegration;
      const props = integration.Properties;
      
      expect(props.IntegrationType).toBe('AWS_PROXY');
      expect(props.PayloadFormatVersion).toBe('2.0');
      expect(props.IntegrationUri).toBeDefined();
    });

    test('should have ApiRoute resource', () => {
      expect(template.Resources.ApiRoute).toBeDefined();
      expect(template.Resources.ApiRoute.Type).toBe('AWS::ApiGatewayV2::Route');
      expect(template.Resources.ApiRoute.Properties.RouteKey).toBe('$default');
    });

    test('should have ApiStage resource', () => {
      expect(template.Resources.ApiStage).toBeDefined();
      expect(template.Resources.ApiStage.Type).toBe('AWS::ApiGatewayV2::Stage');
      expect(template.Resources.ApiStage.Properties.StageName).toBe('$default');
      expect(template.Resources.ApiStage.Properties.AutoDeploy).toBe(true);
    });

    test('should have LambdaApiPermission resource', () => {
      expect(template.Resources.LambdaApiPermission).toBeDefined();
      expect(template.Resources.LambdaApiPermission.Type).toBe('AWS::Lambda::Permission');
    });

    test('LambdaApiPermission should have correct configuration', () => {
      const permission = template.Resources.LambdaApiPermission;
      const props = permission.Properties;
      
      expect(props.Action).toBe('lambda:InvokeFunction');
      expect(props.Principal).toBe('apigateway.amazonaws.com');
      expect(props.FunctionName).toEqual({ Ref: 'DataProcessingFunction' });
      expect(props.SourceArn).toBeDefined();
    });
  });

  describe('Resources - Event Source Mapping', () => {
    test('should have StreamEventSourceMapping resource', () => {
      expect(template.Resources.StreamEventSourceMapping).toBeDefined();
      expect(template.Resources.StreamEventSourceMapping.Type).toBe('AWS::Lambda::EventSourceMapping');
    });

    test('StreamEventSourceMapping should have correct configuration', () => {
      const mapping = template.Resources.StreamEventSourceMapping;
      const props = mapping.Properties;
      
      expect(props.EventSourceArn).toEqual({
        'Fn::GetAtt': ['DataProcessingTable', 'StreamArn']
      });
      expect(props.FunctionName).toEqual({ Ref: 'StreamProcessorFunction' });
      expect(props.StartingPosition).toBe('LATEST');
      expect(props.MaximumBatchingWindowInSeconds).toBe(10);
      expect(props.BatchSize).toBe(10);
    });
  });

  describe('Outputs', () => {
    test('should have all required outputs', () => {
      const expectedOutputs = [
        'ApiGatewayUrl',
        'LambdaFunctionArn',
        'DynamoDBTableName',
        'LambdaFunctionName',
        'DynamoDBTableArn',
        'StreamProcessorFunctionArn',
        'StackName',
        'EnvironmentSuffix',
      ];

      expectedOutputs.forEach(outputName => {
        expect(template.Outputs[outputName]).toBeDefined();
      });
    });

    test('ApiGatewayUrl output should be correct', () => {
      const output = template.Outputs.ApiGatewayUrl;
      expect(output.Description).toBe('HTTP API Gateway URL');
      expect(output.Value).toEqual({
        'Fn::Sub': 'https://${HttpApi}.execute-api.${AWS::Region}.amazonaws.com'
      });
      expect(output.Export.Name).toEqual({
        'Fn::Sub': '${AWS::StackName}-api-gateway-url',
      });
    });

    test('LambdaFunctionArn output should be correct', () => {
      const output = template.Outputs.LambdaFunctionArn;
      expect(output.Description).toBe('Lambda Function ARN');
      expect(output.Value).toEqual({
        'Fn::GetAtt': ['DataProcessingFunction', 'Arn']
      });
      expect(output.Export.Name).toEqual({
        'Fn::Sub': '${AWS::StackName}-lambda-function-arn',
      });
    });

    test('DynamoDBTableName output should be correct', () => {
      const output = template.Outputs.DynamoDBTableName;
      expect(output.Description).toBe('DynamoDB Table Name');
      expect(output.Value).toEqual({ Ref: 'DataProcessingTable' });
      expect(output.Export.Name).toEqual({
        'Fn::Sub': '${AWS::StackName}-dynamodb-table-name',
      });
    });

    test('StackName output should be correct', () => {
      const output = template.Outputs.StackName;
      expect(output.Description).toBe('Name of this CloudFormation stack');
      expect(output.Value).toEqual({ Ref: 'AWS::StackName' });
      expect(output.Export.Name).toEqual({
        'Fn::Sub': '${AWS::StackName}-stack-name',
      });
    });

    test('EnvironmentSuffix output should be correct', () => {
      const output = template.Outputs.EnvironmentSuffix;
      expect(output.Description).toBe(
        'Environment suffix used for this deployment'
      );
      expect(output.Value).toEqual({ Ref: 'EnvironmentSuffix' });
      expect(output.Export.Name).toEqual({
        'Fn::Sub': '${AWS::StackName}-environment-suffix',
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

    test('should have correct number of parameters', () => {
      const parameterCount = Object.keys(template.Parameters).length;
      expect(parameterCount).toBe(3); // EnvironmentSuffix, Environment, Project
    });

    test('should have correct number of outputs', () => {
      const outputCount = Object.keys(template.Outputs).length;
      expect(outputCount).toBe(8);
    });

    test('all resources should have deletion policies for cleanup', () => {
      const criticalResources = [
        'DataProcessingTable',
        'LambdaExecutionRole',
        'DataProcessingFunction',
        'StreamProcessorFunction',
        'StreamProcessorRole'
      ];
      
      criticalResources.forEach(resourceName => {
        if (template.Resources[resourceName]) {
          expect(template.Resources[resourceName].DeletionPolicy).toBe('Delete');
        }
      });
    });
  });

  describe('Resource Naming Convention', () => {
    test('table name should follow naming convention with environment suffix', () => {
      const table = template.Resources.DataProcessingTable;
      const tableName = table.Properties.TableName;

      expect(tableName).toEqual({
        'Fn::Sub': '${Project}-data-processing-table-${EnvironmentSuffix}',
      });
    });

    test('lambda function names should follow naming convention', () => {
      const dataFunc = template.Resources.DataProcessingFunction;
      const streamFunc = template.Resources.StreamProcessorFunction;

      expect(dataFunc.Properties.FunctionName).toEqual({
        'Fn::Sub': '${Project}-data-processing-function-${EnvironmentSuffix}'
      });
      expect(streamFunc.Properties.FunctionName).toEqual({
        'Fn::Sub': '${Project}-stream-processor-function-${EnvironmentSuffix}'
      });
    });

    test('IAM role names should follow naming convention', () => {
      const execRole = template.Resources.LambdaExecutionRole;
      const streamRole = template.Resources.StreamProcessorRole;

      expect(execRole.Properties.RoleName).toEqual({
        'Fn::Sub': '${Project}-lambda-execution-role-${EnvironmentSuffix}'
      });
      expect(streamRole.Properties.RoleName).toEqual({
        'Fn::Sub': '${Project}-stream-processor-role-${EnvironmentSuffix}'
      });
    });

    test('export names should follow naming convention', () => {
      Object.keys(template.Outputs).forEach(outputKey => {
        const output = template.Outputs[outputKey];
        expect(output.Export.Name).toEqual({
          'Fn::Sub': expect.stringContaining('${AWS::StackName}'),
        });
      });
    });
  });

  describe('Security Best Practices', () => {
    test('DynamoDB table should have encryption enabled', () => {
      const table = template.Resources.DataProcessingTable;
      expect(table.Properties.SSESpecification).toBeDefined();
      expect(table.Properties.SSESpecification.SSEEnabled).toBe(true);
    });

    test('Lambda functions should have X-Ray tracing enabled', () => {
      const dataFunc = template.Resources.DataProcessingFunction;
      const streamFunc = template.Resources.StreamProcessorFunction;
      
      expect(dataFunc.Properties.TracingConfig.Mode).toBe('Active');
      expect(streamFunc.Properties.TracingConfig.Mode).toBe('Active');
    });

    test('IAM roles should follow least privilege principle', () => {
      const execRole = template.Resources.LambdaExecutionRole;
      const policies = execRole.Properties.Policies[0].PolicyDocument.Statement;
      
      // Check that DynamoDB permissions are scoped to specific table
      const dynamoStatement = policies.find((s: any) => 
        s.Action && s.Action.some((a: string) => a.startsWith('dynamodb:'))
      );
      expect(dynamoStatement.Resource).toEqual({
        'Fn::GetAtt': ['DataProcessingTable', 'Arn']
      });
    });

    test('KMS permissions should be scoped properly', () => {
      const execRole = template.Resources.LambdaExecutionRole;
      const policies = execRole.Properties.Policies[0].PolicyDocument.Statement;
      
      const kmsStatement = policies.find((s: any) => 
        s.Action && s.Action.some((a: string) => a.startsWith('kms:'))
      );
      expect(kmsStatement.Condition).toBeDefined();
      expect(kmsStatement.Condition.StringEquals).toBeDefined();
    });
  });
});