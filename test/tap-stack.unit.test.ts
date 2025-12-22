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
      expect(template).toHaveProperty('Conditions');
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

    test(`${generateUniqueTestId('rate_limit_param')}: should have ApiRateLimit parameter`, () => {
      const rateLimitParam = template.Parameters.ApiRateLimit;
      expect(rateLimitParam).toBeDefined();
      expect(rateLimitParam.Type).toBe('Number');
      expect(rateLimitParam.Default).toBe(1000);
      expect(rateLimitParam.MinValue).toBe(100);
      expect(rateLimitParam.MaxValue).toBe(10000);
    });

    test(`${generateUniqueTestId('burst_limit_param')}: should have ApiBurstLimit parameter`, () => {
      const burstLimitParam = template.Parameters.ApiBurstLimit;
      expect(burstLimitParam).toBeDefined();
      expect(burstLimitParam.Type).toBe('Number');
      expect(burstLimitParam.Default).toBe(2000);
      expect(burstLimitParam.MinValue).toBe(200);
      expect(burstLimitParam.MaxValue).toBe(20000);
    });

    test(`${generateUniqueTestId('notification_email_param')}: should have NotificationEmail parameter`, () => {
      const emailParam = template.Parameters.NotificationEmail;
      expect(emailParam).toBeDefined();
      expect(emailParam.Type).toBe('String');
      expect(emailParam.Default).toBe('admin@example.com');
      expect(emailParam.Description).toBe('Email for budget and alarm notifications');
    });

    test(`${generateUniqueTestId('budget_limit_param')}: should have BudgetLimit parameter`, () => {
      const budgetParam = template.Parameters.BudgetLimit;
      expect(budgetParam).toBeDefined();
      expect(budgetParam.Type).toBe('Number');
      expect(budgetParam.Default).toBe(100);
      expect(budgetParam.MinValue).toBe(10);
      expect(budgetParam.MaxValue).toBe(10000);
    });

    test(`${generateUniqueTestId('param_count')}: should have exactly six parameters`, () => {
      const parameterCount = Object.keys(template.Parameters).length;
      expect(parameterCount).toBe(6);
    });

    test(`${generateUniqueTestId('conditions')}: should have conditions for environment-aware configuration`, () => {
      expect(template.Conditions).toBeDefined();
      expect(template.Conditions.IsProd).toBeDefined();
      expect(template.Conditions.IsProd['Fn::Equals']).toEqual([{ Ref: 'Environment' }, 'prod']);
      expect(template.Conditions.IsNotProd).toBeDefined();
      expect(template.Conditions.IsNotProd['Fn::Not'][0]['Fn::Equals']).toEqual([{ Ref: 'Environment' }, 'prod']);
    });
  });

  describe(`${generateUniqueTestId('globals')}: Global Configuration Tests`, () => {
    test(`${generateUniqueTestId('global_function')}: should have proper global function configuration`, () => {
      const globalFunction = template.Globals.Function;
      expect(globalFunction).toBeDefined();
      expect(globalFunction.Runtime).toBe('python3.11');
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
      expect(resourceCount).toBe(35); // Updated count with all new resources (removed LogGroups)
    });

    test(`${generateUniqueTestId('kms_key')}: should have customer-managed KMS key`, () => {
      const kmsKey = template.Resources.DynamoDBKMSKey;
      expect(kmsKey).toBeDefined();
      expect(kmsKey.Type).toBe('AWS::KMS::Key');
      expect(kmsKey.Properties.Description).toBe('Customer-managed KMS key for DynamoDB encryption');
      
      const kmsAlias = template.Resources.DynamoDBKMSKeyAlias;
      expect(kmsAlias).toBeDefined();
      expect(kmsAlias.Type).toBe('AWS::KMS::Alias');
    });

    test(`${generateUniqueTestId('user_table')}: UserTable should have enhanced configuration`, () => {
      const userTable = template.Resources.UserTable;
      expect(userTable).toBeDefined();
      expect(userTable.Type).toBe('AWS::DynamoDB::Table');
      
      const props = userTable.Properties;
      expect(props.TableName).toEqual({ 'Fn::Sub': '${Environment}-users' });
      expect(props.BillingMode).toBe('PAY_PER_REQUEST');
      expect(props.SSESpecification).toBeDefined();
      expect(props.SSESpecification.SSEEnabled).toBe(true);
      expect(props.SSESpecification.SSEType).toBe('KMS');
      expect(props.SSESpecification.KMSMasterKeyId).toEqual({ Ref: 'DynamoDBKMSKey' });
    });

    test(`${generateUniqueTestId('lambda_role')}: LambdaExecutionRole should have enhanced permissions`, () => {
      const role = template.Resources.LambdaExecutionRole;
      expect(role).toBeDefined();
      expect(role.Type).toBe('AWS::IAM::Role');
      
      const props = role.Properties;
      expect(props.Policies).toHaveLength(3); // DynamoDB, KMS, and SQS access
      expect(props.Policies.find((p: any) => p.PolicyName === 'DynamoDBAccess')).toBeDefined();
      expect(props.Policies.find((p: any) => p.PolicyName === 'KMSAccess')).toBeDefined();
      expect(props.Policies.find((p: any) => p.PolicyName === 'SQSAccess')).toBeDefined();
    });

    test(`${generateUniqueTestId('api_rate_limiting')}: should have API rate limiting configuration`, () => {
      const usagePlan = template.Resources.UserApiUsagePlan;
      expect(usagePlan).toBeDefined();
      expect(usagePlan.Type).toBe('AWS::ApiGateway::UsagePlan');
      expect(usagePlan.Properties.Throttle.RateLimit).toEqual({ Ref: 'ApiRateLimit' });
      expect(usagePlan.Properties.Throttle.BurstLimit).toEqual({ Ref: 'ApiBurstLimit' });
      
      const apiKey = template.Resources.UserApiKey;
      expect(apiKey).toBeDefined();
      expect(apiKey.Type).toBe('AWS::ApiGateway::ApiKey');
    });

    test(`${generateUniqueTestId('dead_letter_queues')}: should have dead letter queues`, () => {
      const createUserDLQ = template.Resources.CreateUserDLQ;
      expect(createUserDLQ).toBeDefined();
      expect(createUserDLQ.Type).toBe('AWS::SQS::Queue');
      expect(createUserDLQ.Properties.MessageRetentionPeriod).toBe(1209600);
      
      const getUserDLQ = template.Resources.GetUserDLQ;
      expect(getUserDLQ).toBeDefined();
      expect(getUserDLQ.Type).toBe('AWS::SQS::Queue');
      expect(getUserDLQ.Properties.MessageRetentionPeriod).toBe(1209600);
    });

    // LogGroups removed to avoid conflicts - Lambda creates them automatically
    // test(`${generateUniqueTestId('cloudwatch_log_groups')}: should have CloudWatch log groups`, () => {
    //   const createUserLogGroup = template.Resources.CreateUserLogGroup;
    //   expect(createUserLogGroup).toBeDefined();
    //   expect(createUserLogGroup.Type).toBe('AWS::Logs::LogGroup');
    //   expect(createUserLogGroup.Properties.RetentionInDays).toBe(30);
    //   
    //   const getUserLogGroup = template.Resources.GetUserLogGroup;
    //   expect(getUserLogGroup).toBeDefined();
    //   expect(getUserLogGroup.Type).toBe('AWS::Logs::LogGroup');
    //   expect(getUserLogGroup.Properties.RetentionInDays).toBe(30);
    // });

    test(`${generateUniqueTestId('sns_topic')}: should have SNS topic for notifications`, () => {
      const snsTopic = template.Resources.AlarmNotificationTopic;
      expect(snsTopic).toBeDefined();
      expect(snsTopic.Type).toBe('AWS::SNS::Topic');
      
      const snsSubscription = template.Resources.AlarmNotificationSubscription;
      expect(snsSubscription).toBeDefined();
      expect(snsSubscription.Type).toBe('AWS::SNS::Subscription');
    });

    test(`${generateUniqueTestId('lambda_functions_enhanced')}: Lambda functions should have enhanced features`, () => {
      const createUserFunction = template.Resources.CreateUserFunction;
      expect(createUserFunction).toBeDefined();
      expect(createUserFunction.Type).toBe('AWS::Lambda::Function');
      expect(createUserFunction.Properties.DeadLetterConfig).toBeDefined();
      expect(createUserFunction.Properties.ReservedConcurrentExecutions).toBeDefined();
      expect(createUserFunction.Properties.TracingConfig).toBeDefined();
      
      const getUserFunction = template.Resources.GetUserFunction;
      expect(getUserFunction).toBeDefined();
      expect(getUserFunction.Type).toBe('AWS::Lambda::Function');
      expect(getUserFunction.Properties.DeadLetterConfig).toBeDefined();
      expect(getUserFunction.Properties.ReservedConcurrentExecutions).toBeDefined();
      expect(getUserFunction.Properties.TracingConfig).toBeDefined();
    });

    test(`${generateUniqueTestId('cloudwatch_alarms')}: should have comprehensive CloudWatch alarms`, () => {
      // Lambda Error Alarms
      expect(template.Resources.CreateUserFunctionErrorAlarm).toBeDefined();
      expect(template.Resources.CreateUserFunctionErrorAlarm.Type).toBe('AWS::CloudWatch::Alarm');
      expect(template.Resources.GetUserFunctionErrorAlarm).toBeDefined();
      expect(template.Resources.GetUserFunctionErrorAlarm.Type).toBe('AWS::CloudWatch::Alarm');
      
      // Lambda Throttle Alarms
      expect(template.Resources.CreateUserFunctionThrottleAlarm).toBeDefined();
      expect(template.Resources.GetUserFunctionThrottleAlarm).toBeDefined();
      
      // DynamoDB Throttle Alarms
      expect(template.Resources.DynamoDBReadThrottleAlarm).toBeDefined();
      expect(template.Resources.DynamoDBWriteThrottleAlarm).toBeDefined();
      
      // API Gateway Error Alarms
      expect(template.Resources.ApiGateway4XXErrorAlarm).toBeDefined();
      expect(template.Resources.ApiGateway5XXErrorAlarm).toBeDefined();
      
      // SQS DLQ Alarms
      expect(template.Resources.CreateUserDLQAlarm).toBeDefined();
      expect(template.Resources.GetUserDLQAlarm).toBeDefined();
    });

    test(`${generateUniqueTestId('budget')}: should have AWS Budget for cost monitoring`, () => {
      const budget = template.Resources.ProjectBudget;
      expect(budget).toBeDefined();
      expect(budget.Type).toBe('AWS::Budgets::Budget');
      expect(budget.Properties.Budget.BudgetLimit.Amount).toEqual({ Ref: 'BudgetLimit' });
      expect(budget.Properties.NotificationsWithSubscribers).toHaveLength(2);
      
      // Check that cost filters use supported Service dimension
      const costFilters = budget.Properties.Budget.CostFilters;
      expect(costFilters.Service).toBeDefined();
      expect(costFilters.Service).toContain('Amazon DynamoDB');
      expect(costFilters.Service).toContain('AWS Lambda');
      expect(costFilters.Service).toContain('Amazon API Gateway');
      
      // Ensure deprecated TagKey/TagValue are not present
      expect(costFilters.TagKey).toBeUndefined();
      expect(costFilters.TagValue).toBeUndefined();
    });
  });

  describe(`${generateUniqueTestId('outputs')}: Outputs Comprehensive Validation`, () => {
    test(`${generateUniqueTestId('output_count')}: should have expected number of outputs`, () => {
      const outputCount = Object.keys(template.Outputs).length;
      expect(outputCount).toBe(12); // All outputs including new ones
    });

    test(`${generateUniqueTestId('required_outputs')}: should have all required outputs`, () => {
      expect(template.Outputs.ApiGatewayUrl).toBeDefined();
      expect(template.Outputs.CreateUserFunctionArn).toBeDefined();
      expect(template.Outputs.GetUserFunctionArn).toBeDefined();
      expect(template.Outputs.DynamoDBTableName).toBeDefined();
      expect(template.Outputs.KMSKeyId).toBeDefined();
      expect(template.Outputs.KMSKeyAlias).toBeDefined();
      expect(template.Outputs.UsagePlanId).toBeDefined();
      expect(template.Outputs.ApiKeyId).toBeDefined();
      expect(template.Outputs.CreateUserDLQUrl).toBeDefined();
      expect(template.Outputs.GetUserDLQUrl).toBeDefined();
      expect(template.Outputs.AlarmTopicArn).toBeDefined();
      expect(template.Outputs.BudgetName).toBeDefined();
    });

    test(`${generateUniqueTestId('api_gateway_url_output')}: ApiGatewayUrl output should be correct`, () => {
      const output = template.Outputs.ApiGatewayUrl;
      expect(output.Description).toBe('API Gateway endpoint URL');
      expect(output.Value['Fn::Sub']).toBe('https://${UserApi}.execute-api.${AWS::Region}.amazonaws.com/${Environment}');
    });

    test(`${generateUniqueTestId('kms_outputs')}: KMS outputs should be correct`, () => {
      const keyOutput = template.Outputs.KMSKeyId;
      expect(keyOutput.Description).toBe('Customer-managed KMS Key ID for encryption');
      expect(keyOutput.Value).toEqual({ Ref: 'DynamoDBKMSKey' });
      
      const aliasOutput = template.Outputs.KMSKeyAlias;
      expect(aliasOutput.Description).toBe('Customer-managed KMS Key Alias');
      expect(aliasOutput.Value).toEqual({ Ref: 'DynamoDBKMSKeyAlias' });
    });

    test(`${generateUniqueTestId('dlq_outputs')}: DLQ outputs should be correct`, () => {
      const createUserDLQOutput = template.Outputs.CreateUserDLQUrl;
      expect(createUserDLQOutput.Description).toBe('CreateUser Dead Letter Queue URL');
      expect(createUserDLQOutput.Value).toEqual({ Ref: 'CreateUserDLQ' });
      
      const getUserDLQOutput = template.Outputs.GetUserDLQUrl;
      expect(getUserDLQOutput.Description).toBe('GetUser Dead Letter Queue URL');
      expect(getUserDLQOutput.Value).toEqual({ Ref: 'GetUserDLQ' });
    });
  });

  describe(`${generateUniqueTestId('template_validation')}: Template Validation and Security`, () => {
    test(`${generateUniqueTestId('json_structure')}: should have valid JSON structure`, () => {
      expect(typeof template).toBe('object');
      expect(template).not.toBeNull();
    });

    test(`${generateUniqueTestId('required_sections_not_null')}: should not have any undefined or null required sections`, () => {
      expect(template.AWSTemplateFormatVersion).toBeDefined();
      expect(template.Transform).toBeDefined();
      expect(template.Description).toBeDefined();
      expect(template.Parameters).toBeDefined();
      expect(template.Resources).toBeDefined();
      expect(template.Outputs).toBeDefined();
    });

    test(`${generateUniqueTestId('iam_permissions')}: should have least privilege IAM permissions`, () => {
      const role = template.Resources.LambdaExecutionRole;
      const dynamoPolicy = role.Properties.Policies.find((p: any) => p.PolicyName === 'DynamoDBAccess');
      expect(dynamoPolicy.PolicyDocument.Statement[0].Resource).toEqual({ 'Fn::GetAtt': ['UserTable', 'Arn'] });
      
      const kmsPolicy = role.Properties.Policies.find((p: any) => p.PolicyName === 'KMSAccess');
      expect(kmsPolicy.PolicyDocument.Statement[0].Resource).toEqual({ 'Fn::GetAtt': ['DynamoDBKMSKey', 'Arn'] });
    });

    test(`${generateUniqueTestId('cors_validation')}: should have proper CORS configuration`, () => {
      const optionsMethod = template.Resources.UserApiOptionsMethod;
      expect(optionsMethod).toBeDefined();
      expect(optionsMethod.Properties.AuthorizationType).toBe('NONE');
      
      const corsOrigin = optionsMethod.Properties.Integration.IntegrationResponses[0].ResponseParameters['method.response.header.Access-Control-Allow-Origin'];
      expect(corsOrigin['Fn::If']).toEqual(['IsProd', "'https://yourdomain.com'", "'*'"]);
    });

    test(`${generateUniqueTestId('lambda_security')}: should have security best practices for Lambda`, () => {
      const createUserFunction = template.Resources.CreateUserFunction;
      expect(createUserFunction.Properties.Code.ZipFile).toContain('validate_input');
      expect(createUserFunction.Properties.Code.ZipFile).toContain('validate_request_size');
      expect(createUserFunction.Properties.Code.ZipFile).toContain('correlation_id');
      
      const getUserFunction = template.Resources.GetUserFunction;
      expect(getUserFunction.Properties.Code.ZipFile).toContain('validate_user_id');
      expect(getUserFunction.Properties.Code.ZipFile).toContain('correlation_id');
    });

    test(`${generateUniqueTestId('environment_aware')}: should have environment-aware configurations`, () => {
      const createUserFunction = template.Resources.CreateUserFunction;
      expect(createUserFunction.Properties.ReservedConcurrentExecutions['Fn::If']).toEqual(['IsProd', 20, 10]);
      
      const getUserFunction = template.Resources.GetUserFunction;
      expect(getUserFunction.Properties.ReservedConcurrentExecutions['Fn::If']).toEqual(['IsProd', 30, 15]);
    });
  });

  describe(`${generateUniqueTestId('naming_conventions')}: Resource Naming Convention and Best Practices`, () => {
    test(`${generateUniqueTestId('resource_naming')}: resources should follow naming conventions with environment suffix`, () => {
      // Check table naming
      const userTable = template.Resources.UserTable;
      expect(userTable.Properties.TableName).toEqual({ 'Fn::Sub': '${Environment}-users' });
      
      // Check Lambda function naming
      const createUserFunction = template.Resources.CreateUserFunction;
      expect(createUserFunction.Properties.FunctionName).toEqual({ 'Fn::Sub': '${Environment}-create-user' });
      
      const getUserFunction = template.Resources.GetUserFunction;
      expect(getUserFunction.Properties.FunctionName).toEqual({ 'Fn::Sub': '${Environment}-get-user' });
      
      // Check API naming
      const userApi = template.Resources.UserApi;
      expect(userApi.Properties.Name).toEqual({ 'Fn::Sub': '${Environment}-user-api' });
    });

    test(`${generateUniqueTestId('export_naming')}: export names should follow naming convention`, () => {
      const apiGatewayOutput = template.Outputs.ApiGatewayUrl;
      expect(apiGatewayOutput.Export.Name).toEqual({ 'Fn::Sub': '${AWS::StackName}-ApiUrl' });
      
      const createUserFunctionOutput = template.Outputs.CreateUserFunctionArn;
      expect(createUserFunctionOutput.Export.Name).toEqual({ 'Fn::Sub': '${AWS::StackName}-CreateUserFunction' });
    });
  });

  describe(`${generateUniqueTestId('integration_readiness')}: Integration Test Readiness`, () => {
    test(`${generateUniqueTestId('feature_flags')}: should have feature flags for testing control`, () => {
      const createUserFunction = template.Resources.CreateUserFunction;
      expect(createUserFunction.Properties.Environment.Variables.FEATURE_FLAG_VALIDATION).toBe('true');
      
      const getUserFunction = template.Resources.GetUserFunction;
      expect(getUserFunction.Properties.Environment.Variables.FEATURE_FLAG_CACHING).toBe('false');
    });

    test(`${generateUniqueTestId('outputs_for_integration')}: should have all outputs needed for integration tests`, () => {
      expect(template.Outputs.ApiGatewayUrl).toBeDefined();
      expect(template.Outputs.CreateUserFunctionArn).toBeDefined();
      expect(template.Outputs.GetUserFunctionArn).toBeDefined();
      expect(template.Outputs.DynamoDBTableName).toBeDefined();
      expect(template.Outputs.CreateUserDLQUrl).toBeDefined();
      expect(template.Outputs.GetUserDLQUrl).toBeDefined();
    });

    test(`${generateUniqueTestId('monitoring_readiness')}: should have monitoring outputs for integration tests`, () => {
      expect(template.Outputs.AlarmTopicArn).toBeDefined();
      expect(template.Outputs.KMSKeyId).toBeDefined();
      expect(template.Outputs.UsagePlanId).toBeDefined();
    });
  });

  describe(`${generateUniqueTestId('performance_config')}: Performance and Scalability Configuration`, () => {
    test(`${generateUniqueTestId('dynamodb_billing')}: DynamoDB should use PAY_PER_REQUEST for cost optimization`, () => {
      const userTable = template.Resources.UserTable;
      expect(userTable.Properties.BillingMode).toBe('PAY_PER_REQUEST');
    });

    test(`${generateUniqueTestId('lambda_config')}: Lambda functions should have appropriate resource configuration`, () => {
      const createUserFunction = template.Resources.CreateUserFunction;
      expect(createUserFunction.Properties.MemorySize).toBe(128);
      expect(createUserFunction.Properties.Timeout).toBe(30);
      
      const getUserFunction = template.Resources.GetUserFunction;
      expect(getUserFunction.Properties.MemorySize).toBe(128);
      expect(getUserFunction.Properties.Timeout).toBe(30);
    });

    test(`${generateUniqueTestId('concurrency_limits')}: should have environment-aware concurrency limits`, () => {
      const createUserFunction = template.Resources.CreateUserFunction;
      expect(createUserFunction.Properties.ReservedConcurrentExecutions).toBeDefined();
      
      const getUserFunction = template.Resources.GetUserFunction;
      expect(getUserFunction.Properties.ReservedConcurrentExecutions).toBeDefined();
    });
  });

  describe(`${generateUniqueTestId('edge_cases')}: Edge Cases and Error Handling`, () => {
    test(`${generateUniqueTestId('parameter_constraints')}: parameters should have proper constraints`, () => {
      const rateLimitParam = template.Parameters.ApiRateLimit;
      expect(rateLimitParam.MinValue).toBe(100);
      expect(rateLimitParam.MaxValue).toBe(10000);
      
      const budgetParam = template.Parameters.BudgetLimit;
      expect(budgetParam.MinValue).toBe(10);
      expect(budgetParam.MaxValue).toBe(10000);
    });

    test(`${generateUniqueTestId('missing_properties')}: critical resources should not have missing required properties`, () => {
      // Check Lambda functions have all required properties
      const createUserFunction = template.Resources.CreateUserFunction;
      expect(createUserFunction.Properties.FunctionName).toBeDefined();
      expect(createUserFunction.Properties.Runtime).toBeDefined();
      expect(createUserFunction.Properties.Handler).toBeDefined();
      expect(createUserFunction.Properties.Role).toBeDefined();
      expect(createUserFunction.Properties.Code).toBeDefined();
      
      // Check DynamoDB table has all required properties
      const userTable = template.Resources.UserTable;
      expect(userTable.Properties.AttributeDefinitions).toBeDefined();
      expect(userTable.Properties.KeySchema).toBeDefined();
      expect(userTable.Properties.BillingMode).toBeDefined();
    });

    test(`${generateUniqueTestId('function_references')}: intrinsic function references should be valid`, () => {
      const createUserFunction = template.Resources.CreateUserFunction;
      expect(createUserFunction.Properties.Role).toEqual({ 'Fn::GetAtt': ['LambdaExecutionRole', 'Arn'] });
      
      const userTable = template.Resources.UserTable;
      expect(userTable.Properties.SSESpecification.KMSMasterKeyId).toEqual({ Ref: 'DynamoDBKMSKey' });
    });

    test(`${generateUniqueTestId('alarm_configurations')}: alarms should have proper thresholds and actions`, () => {
      const errorAlarm = template.Resources.CreateUserFunctionErrorAlarm;
      expect(errorAlarm.Properties.Threshold).toBe(5);
      expect(errorAlarm.Properties.ComparisonOperator).toBe('GreaterThanThreshold');
      expect(errorAlarm.Properties.AlarmActions).toContainEqual({ Ref: 'AlarmNotificationTopic' });
      
      const dlqAlarm = template.Resources.CreateUserDLQAlarm;
      expect(dlqAlarm.Properties.Threshold).toBe(1);
      expect(dlqAlarm.Properties.ComparisonOperator).toBe('GreaterThanOrEqualToThreshold');
    });
  });
});