import fs from 'fs';
import path from 'path';
import { randomBytes } from 'crypto';

const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';

// Generate unique test identifiers with randomness
const generateUniqueTestId = (prefix: string) => {
  const timestamp = Date.now();
  const randomSuffix = randomBytes(4).toString('hex');
  return `${prefix}_${timestamp}_${randomSuffix}`;
};

const uniqueTestPrefix = generateUniqueTestId('tapstack_unit_test');

describe(`${uniqueTestPrefix}: TapStack CloudFormation Template Comprehensive Unit Tests`, () => {
  let template: any;

  beforeAll(() => {
    // Load the converted JSON template
    const templatePath = path.join(__dirname, '../lib/TapStack.json');
    const templateContent = fs.readFileSync(templatePath, 'utf8');
    template = JSON.parse(templateContent);
  });

  describe(`${generateUniqueTestId('template_structure')}: Template Structure Validation`, () => {
    test(`${generateUniqueTestId('cf_version')}: should have valid CloudFormation format version`, () => {
      expect(template.AWSTemplateFormatVersion).toBe('2010-09-09');
    });

    test(`${generateUniqueTestId('cf_transform')}: should have SAM transform`, () => {
      expect(template.Transform).toBe('AWS::Serverless-2016-10-31');
    });

    test(`${generateUniqueTestId('description')}: should have correct description`, () => {
      expect(template.Description).toBeDefined();
      expect(template.Description).toBe(
        'Serverless application with Lambda functions and API Gateway for user management'
      );
    });

    test(`${generateUniqueTestId('template_sections')}: should have all required template sections`, () => {
      expect(template).toHaveProperty('AWSTemplateFormatVersion');
      expect(template).toHaveProperty('Transform');
      expect(template).toHaveProperty('Description');
      expect(template).toHaveProperty('Parameters');
      expect(template).toHaveProperty('Globals');
      expect(template).toHaveProperty('Resources');
      expect(template).toHaveProperty('Outputs');
    });
  });

  describe(`${generateUniqueTestId('parameters')}: Parameters Validation`, () => {
    test(`${generateUniqueTestId('env_param')}: should have Environment parameter with correct properties`, () => {
      const envParam = template.Parameters.Environment;
      expect(envParam).toBeDefined();
      expect(envParam.Type).toBe('String');
      expect(envParam.Default).toBe('dev');
      expect(envParam.Description).toBe('Environment name for the application');
      expect(envParam.AllowedValues).toEqual(['dev', 'staging', 'prod']);
    });

    test(`${generateUniqueTestId('loglevel_param')}: should have LogLevel parameter with correct properties`, () => {
      const logLevelParam = template.Parameters.LogLevel;
      expect(logLevelParam).toBeDefined();
      expect(logLevelParam.Type).toBe('String');
      expect(logLevelParam.Default).toBe('INFO');
      expect(logLevelParam.Description).toBe('Log level for Lambda functions');
      expect(logLevelParam.AllowedValues).toEqual(['DEBUG', 'INFO', 'WARN', 'ERROR']);
    });

    test(`${generateUniqueTestId('param_count')}: should have exactly two parameters`, () => {
      const parameterCount = Object.keys(template.Parameters).length;
      expect(parameterCount).toBe(2);
    });
  });

  describe(`${generateUniqueTestId('globals')}: Global Configuration Tests`, () => {
    test(`${generateUniqueTestId('global_function')}: should have proper global function configuration`, () => {
      const globalFunction = template.Globals.Function;
      expect(globalFunction).toBeDefined();
      expect(globalFunction.Runtime).toBe('python3.9');
      expect(globalFunction.Timeout).toBe(30);
      expect(globalFunction.MemorySize).toBe(128);
    });

    test(`${generateUniqueTestId('global_env_vars')}: should have proper global environment variables`, () => {
      const envVars = template.Globals.Function.Environment.Variables;
      expect(envVars.ENVIRONMENT).toEqual({ Ref: 'Environment' });
      expect(envVars.LOG_LEVEL).toEqual({ Ref: 'LogLevel' });
      expect(envVars.DYNAMODB_TABLE).toEqual({ Ref: 'UserTable' });
    });
  });

  describe(`${generateUniqueTestId('resources')}: Resources Comprehensive Validation`, () => {
    test(`${generateUniqueTestId('resource_count')}: should have expected number of resources`, () => {
      const resourceCount = Object.keys(template.Resources).length;
      expect(resourceCount).toBe(7); // UserTable, LambdaExecutionRole, CreateUserFunction, GetUserFunction, UserApi, CreateUserFunctionPermission, GetUserFunctionPermission
    });

    test(`${generateUniqueTestId('user_table')}: UserTable should have correct configuration`, () => {
      const userTable = template.Resources.UserTable;
      expect(userTable).toBeDefined();
      expect(userTable.Type).toBe('AWS::DynamoDB::Table');
      
      const props = userTable.Properties;
      expect(props.TableName).toEqual({ 'Fn::Sub': '${Environment}-users' });
      expect(props.BillingMode).toBe('PAY_PER_REQUEST');
      expect(props.AttributeDefinitions).toHaveLength(1);
      expect(props.AttributeDefinitions[0].AttributeName).toBe('id');
      expect(props.AttributeDefinitions[0].AttributeType).toBe('S');
      expect(props.KeySchema).toHaveLength(1);
      expect(props.KeySchema[0].AttributeName).toBe('id');
      expect(props.KeySchema[0].KeyType).toBe('HASH');
      expect(props.Tags).toEqual([{ Key: 'Environment', Value: { Ref: 'Environment' } }]);
    });

    test(`${generateUniqueTestId('lambda_role')}: LambdaExecutionRole should have correct configuration`, () => {
      const role = template.Resources.LambdaExecutionRole;
      expect(role).toBeDefined();
      expect(role.Type).toBe('AWS::IAM::Role');
      
      const props = role.Properties;
      expect(props.RoleName).toBeUndefined(); // Role name auto-generated to avoid CAPABILITY_NAMED_IAM requirement
      expect(props.AssumeRolePolicyDocument.Version).toBe('2012-10-17');
      expect(props.ManagedPolicyArns).toContain('arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole');
      expect(props.Policies).toHaveLength(1);
      expect(props.Policies[0].PolicyName).toBe('DynamoDBAccess');
    });

    test(`${generateUniqueTestId('create_user_lambda')}: CreateUserFunction should have correct configuration`, () => {
      const lambda = template.Resources.CreateUserFunction;
      expect(lambda).toBeDefined();
      expect(lambda.Type).toBe('AWS::Serverless::Function');
      
      const props = lambda.Properties;
      expect(props.FunctionName).toEqual({ 'Fn::Sub': '${Environment}-create-user' });
      expect(props.InlineCode).toBeDefined();
      expect(props.Handler).toBe('index.lambda_handler');
      expect(props.Role).toEqual({ 'Fn::GetAtt': ['LambdaExecutionRole', 'Arn'] });
      expect(props.Environment.Variables.FEATURE_FLAG_VALIDATION).toBe('true');
      expect(props.Events.CreateUserApi.Type).toBe('Api');
    });

    test(`${generateUniqueTestId('get_user_lambda')}: GetUserFunction should have correct configuration`, () => {
      const lambda = template.Resources.GetUserFunction;
      expect(lambda).toBeDefined();
      expect(lambda.Type).toBe('AWS::Serverless::Function');
      
      const props = lambda.Properties;
      expect(props.FunctionName).toEqual({ 'Fn::Sub': '${Environment}-get-user' });
      expect(props.InlineCode).toBeDefined();
      expect(props.Handler).toBe('index.lambda_handler');
      expect(props.Role).toEqual({ 'Fn::GetAtt': ['LambdaExecutionRole', 'Arn'] });
      expect(props.Environment.Variables.FEATURE_FLAG_CACHING).toBe('false');
      expect(props.Events.GetUserApi.Type).toBe('Api');
    });

    test(`${generateUniqueTestId('api_gateway')}: UserApi should have correct configuration`, () => {
      const api = template.Resources.UserApi;
      expect(api).toBeDefined();
      expect(api.Type).toBe('AWS::Serverless::Api');
      
      const props = api.Properties;
      expect(props.Name).toEqual({ 'Fn::Sub': '${Environment}-user-api' });
      expect(props.StageName).toEqual({ Ref: 'Environment' });
      expect(props.Cors).toBeDefined();
      expect(props.DefinitionBody).toBeDefined();
      expect(props.DefinitionBody.openapi).toBe('3.0.1');
    });

    test(`${generateUniqueTestId('lambda_permissions')}: Lambda permissions should be correctly configured`, () => {
      const createUserPermission = template.Resources.CreateUserFunctionPermission;
      const getUserPermission = template.Resources.GetUserFunctionPermission;
      
      expect(createUserPermission).toBeDefined();
      expect(createUserPermission.Type).toBe('AWS::Lambda::Permission');
      expect(createUserPermission.Properties.Action).toBe('lambda:InvokeFunction');
      expect(createUserPermission.Properties.Principal).toBe('apigateway.amazonaws.com');
      
      expect(getUserPermission).toBeDefined();
      expect(getUserPermission.Type).toBe('AWS::Lambda::Permission');
      expect(getUserPermission.Properties.Action).toBe('lambda:InvokeFunction');
      expect(getUserPermission.Properties.Principal).toBe('apigateway.amazonaws.com');
    });
  });

  describe(`${generateUniqueTestId('outputs')}: Outputs Comprehensive Validation`, () => {
    test(`${generateUniqueTestId('output_count')}: should have expected number of outputs`, () => {
      const outputCount = Object.keys(template.Outputs).length;
      expect(outputCount).toBe(4);
    });

    test(`${generateUniqueTestId('required_outputs')}: should have all required outputs`, () => {
      const expectedOutputs = [
        'ApiGatewayUrl',
        'CreateUserFunctionArn',
        'GetUserFunctionArn',
        'DynamoDBTableName',
      ];

      expectedOutputs.forEach(outputName => {
        expect(template.Outputs[outputName]).toBeDefined();
      });
    });

    test(`${generateUniqueTestId('api_gateway_url_output')}: ApiGatewayUrl output should be correct`, () => {
      const output = template.Outputs.ApiGatewayUrl;
      expect(output.Description).toBe('API Gateway endpoint URL');
      expect(output.Value).toEqual({
        'Fn::Sub': 'https://${UserApi}.execute-api.${AWS::Region}.amazonaws.com/${Environment}'
      });
      expect(output.Export.Name).toEqual({
        'Fn::Sub': '${AWS::StackName}-ApiUrl',
      });
    });

    test(`${generateUniqueTestId('create_user_function_output')}: CreateUserFunctionArn output should be correct`, () => {
      const output = template.Outputs.CreateUserFunctionArn;
      expect(output.Description).toBe('Create User Lambda Function ARN');
      expect(output.Value).toEqual({
        'Fn::GetAtt': ['CreateUserFunction', 'Arn'],
      });
      expect(output.Export.Name).toEqual({
        'Fn::Sub': '${AWS::StackName}-CreateUserFunction',
      });
    });

    test(`${generateUniqueTestId('get_user_function_output')}: GetUserFunctionArn output should be correct`, () => {
      const output = template.Outputs.GetUserFunctionArn;
      expect(output.Description).toBe('Get User Lambda Function ARN');
      expect(output.Value).toEqual({
        'Fn::GetAtt': ['GetUserFunction', 'Arn'],
      });
      expect(output.Export.Name).toEqual({
        'Fn::Sub': '${AWS::StackName}-GetUserFunction',
      });
    });

    test(`${generateUniqueTestId('dynamodb_table_output')}: DynamoDBTableName output should be correct`, () => {
      const output = template.Outputs.DynamoDBTableName;
      expect(output.Description).toBe('DynamoDB Table Name');
      expect(output.Value).toEqual({ Ref: 'UserTable' });
      expect(output.Export.Name).toEqual({
        'Fn::Sub': '${AWS::StackName}-UserTable',
      });
    });
  });

  describe(`${generateUniqueTestId('template_validation')}: Template Validation and Security`, () => {
    test(`${generateUniqueTestId('json_structure')}: should have valid JSON structure`, () => {
      expect(template).toBeDefined();
      expect(typeof template).toBe('object');
      expect(template).not.toBeNull();
    });

    test(`${generateUniqueTestId('required_sections_not_null')}: should not have any undefined or null required sections`, () => {
      expect(template.AWSTemplateFormatVersion).not.toBeNull();
      expect(template.Transform).not.toBeNull();
      expect(template.Description).not.toBeNull();
      expect(template.Parameters).not.toBeNull();
      expect(template.Globals).not.toBeNull();
      expect(template.Resources).not.toBeNull();
      expect(template.Outputs).not.toBeNull();
    });

    test(`${generateUniqueTestId('iam_permissions')}: should have least privilege IAM permissions`, () => {
      const role = template.Resources.LambdaExecutionRole;
      const dynamoDbPolicy = role.Properties.Policies[0];
      const statement = dynamoDbPolicy.PolicyDocument.Statement[0];
      
      // Check that permissions are scoped to specific actions, not wildcard
      expect(statement.Action).toEqual([
        'dynamodb:GetItem',
        'dynamodb:PutItem', 
        'dynamodb:UpdateItem',
        'dynamodb:DeleteItem',
        'dynamodb:Query',
        'dynamodb:Scan'
      ]);
      
      // Check that resource is specific, not wildcard
      expect(statement.Resource).toEqual({ 'Fn::GetAtt': ['UserTable', 'Arn'] });
    });

    test(`${generateUniqueTestId('cors_validation')}: should have proper CORS configuration`, () => {
      const api = template.Resources.UserApi;
      const corsConfig = api.Properties.Cors;
      
      expect(corsConfig.AllowMethods).toBe("'GET,POST,OPTIONS'");
      expect(corsConfig.AllowHeaders).toBe("'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token'");
      expect(corsConfig.AllowOrigin).toBe("'*'");
    });

    test(`${generateUniqueTestId('lambda_timeouts')}: should have reasonable Lambda timeouts`, () => {
      const globalTimeout = template.Globals.Function.Timeout;
      expect(globalTimeout).toBe(30);
      expect(globalTimeout).toBeLessThanOrEqual(900); // Max Lambda timeout
      expect(globalTimeout).toBeGreaterThan(0);
    });

    test(`${generateUniqueTestId('memory_configuration')}: should have reasonable memory configuration`, () => {
      const globalMemory = template.Globals.Function.MemorySize;
      expect(globalMemory).toBe(128);
      expect(globalMemory).toBeGreaterThanOrEqual(128); // Min Lambda memory
      expect(globalMemory).toBeLessThanOrEqual(10240); // Max Lambda memory
    });
  });

  describe(`${generateUniqueTestId('naming_conventions')}: Resource Naming Convention and Best Practices`, () => {
    test(`${generateUniqueTestId('resource_naming')}: resources should follow naming conventions with environment suffix`, () => {
      const userTable = template.Resources.UserTable;
      const createUserFunction = template.Resources.CreateUserFunction;
      const getUserFunction = template.Resources.GetUserFunction;
      const lambdaRole = template.Resources.LambdaExecutionRole;
      const api = template.Resources.UserApi;
      
      expect(userTable.Properties.TableName).toEqual({ 'Fn::Sub': '${Environment}-users' });
      expect(createUserFunction.Properties.FunctionName).toEqual({ 'Fn::Sub': '${Environment}-create-user' });
      expect(getUserFunction.Properties.FunctionName).toEqual({ 'Fn::Sub': '${Environment}-get-user' });
      expect(lambdaRole.Properties.RoleName).toBeUndefined(); // Role name auto-generated to avoid CAPABILITY_NAMED_IAM requirement
      expect(api.Properties.Name).toEqual({ 'Fn::Sub': '${Environment}-user-api' });
    });

    test(`${generateUniqueTestId('export_naming')}: export names should follow naming convention`, () => {
      const expectedExports = {
        'ApiGatewayUrl': '${AWS::StackName}-ApiUrl',
        'CreateUserFunctionArn': '${AWS::StackName}-CreateUserFunction', 
        'GetUserFunctionArn': '${AWS::StackName}-GetUserFunction',
        'DynamoDBTableName': '${AWS::StackName}-UserTable'
      };
      
      Object.keys(expectedExports).forEach(outputKey => {
        const output = template.Outputs[outputKey];
        expect(output.Export.Name).toEqual({
          'Fn::Sub': expectedExports[outputKey as keyof typeof expectedExports],
        });
      });
    });

    test(`${generateUniqueTestId('api_path_structure')}: API paths should follow RESTful conventions`, () => {
      const apiDefinition = template.Resources.UserApi.Properties.DefinitionBody;
      const paths = Object.keys(apiDefinition.paths);
      
      expect(paths).toContain('/user');
      expect(paths).toContain('/user/{id}');
      expect(apiDefinition.paths['/user'].post).toBeDefined();
      expect(apiDefinition.paths['/user/{id}'].get).toBeDefined();
    });
  });

  describe(`${generateUniqueTestId('integration_readiness')}: Integration Test Readiness`, () => {
    test(`${generateUniqueTestId('feature_flags')}: should have feature flags for testing control`, () => {
      const createUserFunction = template.Resources.CreateUserFunction;
      const getUserFunction = template.Resources.GetUserFunction;
      
      expect(createUserFunction.Properties.Environment.Variables.FEATURE_FLAG_VALIDATION).toBe('true');
      expect(getUserFunction.Properties.Environment.Variables.FEATURE_FLAG_CACHING).toBe('false');
    });

    test(`${generateUniqueTestId('outputs_for_integration')}: should have all outputs needed for integration tests`, () => {
      const outputs = template.Outputs;
      
      // API URL needed for HTTP calls
      expect(outputs.ApiGatewayUrl).toBeDefined();
      // Function ARNs needed for direct invocation tests
      expect(outputs.CreateUserFunctionArn).toBeDefined();
      expect(outputs.GetUserFunctionArn).toBeDefined();
      // Table name needed for data validation
      expect(outputs.DynamoDBTableName).toBeDefined();
    });
  });

  // Performance and scalability tests
  describe(`${generateUniqueTestId('performance_config')}: Performance and Scalability Configuration`, () => {
    test(`${generateUniqueTestId('dynamodb_billing')}: DynamoDB should use PAY_PER_REQUEST for cost optimization`, () => {
      const userTable = template.Resources.UserTable;
      expect(userTable.Properties.BillingMode).toBe('PAY_PER_REQUEST');
    });

    test(`${generateUniqueTestId('lambda_config')}: Lambda functions should have appropriate resource configuration`, () => {
      const globalConfig = template.Globals.Function;
      expect(globalConfig.MemorySize).toBe(128); // Minimum for cost efficiency
      expect(globalConfig.Timeout).toBe(30); // Reasonable timeout
      expect(globalConfig.Runtime).toBe('python3.9');
    });
  });
});

// Additional comprehensive edge case and error handling tests
describe(`${generateUniqueTestId('edge_cases')}: Edge Cases and Error Handling`, () => {
  let template: any;

  beforeAll(() => {
    const templatePath = path.join(__dirname, '../lib/TapStack.json');
    const templateContent = fs.readFileSync(templatePath, 'utf8');
    template = JSON.parse(templateContent);
  });

  test(`${generateUniqueTestId('parameter_constraints')}: parameters should have proper constraints`, () => {
    const envParam = template.Parameters.Environment;
    const logLevelParam = template.Parameters.LogLevel;
    
    expect(envParam.AllowedValues).toBeTruthy();
    expect(envParam.AllowedValues.length).toBeGreaterThan(0);
    expect(logLevelParam.AllowedValues).toBeTruthy();
    expect(logLevelParam.AllowedValues.length).toBeGreaterThan(0);
  });

  test(`${generateUniqueTestId('missing_properties')}: critical resources should not have missing required properties`, () => {
    const resources = template.Resources;
    
    // Check that all resources have Type property
    Object.keys(resources).forEach(resourceName => {
      expect(resources[resourceName].Type).toBeDefined();
    });
    
    // Check specific required properties
    expect(resources.UserTable.Properties.AttributeDefinitions).toBeDefined();
    expect(resources.UserTable.Properties.KeySchema).toBeDefined();
    expect(resources.LambdaExecutionRole.Properties.AssumeRolePolicyDocument).toBeDefined();
  });

  test(`${generateUniqueTestId('function_references')}: intrinsic function references should be valid`, () => {
    const outputs = template.Outputs;
    
    // Test that Ref functions reference actual parameters/resources
    expect(template.Parameters.Environment).toBeDefined(); // Referenced in multiple places
    expect(template.Parameters.LogLevel).toBeDefined(); // Referenced in globals
    expect(template.Resources.UserTable).toBeDefined(); // Referenced in outputs
    expect(template.Resources.CreateUserFunction).toBeDefined(); // Referenced in outputs
    expect(template.Resources.GetUserFunction).toBeDefined(); // Referenced in outputs
  });

  test(`${generateUniqueTestId('circular_dependencies')}: should not have circular dependencies`, () => {
    const resources = template.Resources;
    
    // Basic check - API references functions, functions don't reference API
    const createUserFunction = resources.CreateUserFunction;
    const getUserFunction = resources.GetUserFunction;
    
    // Functions should reference role and table, not API
    expect(createUserFunction.Properties.Role).toEqual({ 'Fn::GetAtt': ['LambdaExecutionRole', 'Arn'] });
    expect(getUserFunction.Properties.Role).toEqual({ 'Fn::GetAtt': ['LambdaExecutionRole', 'Arn'] });
    
    // API events should reference the API resource itself
    expect(createUserFunction.Properties.Events.CreateUserApi.Properties.RestApiId).toEqual({ Ref: 'UserApi' });
  });
});