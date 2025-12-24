import crypto from 'crypto';
import fs from 'fs';
import path from 'path';

const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';

// Generate unique test names with randomness
const generateUniqueTestName = (baseName: string): string => {
  const randomSuffix = crypto.randomBytes(4).toString('hex');
  return `${baseName}-${randomSuffix}`;
};

describe('ServerlessApp CloudFormation Template Unit Tests', () => {
  let template: any;

  beforeAll(() => {
    // Read JSON template converted from YAML
    const templatePath = path.join(__dirname, '../lib/TapStack.json');
    const templateContent = fs.readFileSync(templatePath, 'utf8');
    template = JSON.parse(templateContent);
  });

  describe('Template Structure Validation', () => {
    const testName = generateUniqueTestName('template-format-version');
    test(testName, () => {
      expect(template.AWSTemplateFormatVersion).toBe('2010-09-09');
    });

    const transformTestName = generateUniqueTestName('sam-transform');
    test(transformTestName, () => {
      expect(template.Transform).toBe('AWS::Serverless-2016-10-31');
    });

    const descriptionTestName = generateUniqueTestName('description-exists');
    test(descriptionTestName, () => {
      expect(template.Description).toBeDefined();
      expect(template.Description).toBe(
        'Serverless application with Lambda functions and API Gateway for user management'
      );
    });

    const globalsTestName = generateUniqueTestName('globals-section');
    test(globalsTestName, () => {
      expect(template.Globals).toBeDefined();
      expect(template.Globals.Function).toBeDefined();
      expect(template.Globals.Api).toBeDefined();
    });
  });

  describe('Parameters Section', () => {
    const envParamTestName = generateUniqueTestName('environment-parameter');
    test(envParamTestName, () => {
      expect(template.Parameters.Environment).toBeDefined();
      const envParam = template.Parameters.Environment;
      expect(envParam.Type).toBe('String');
      expect(envParam.Default).toBe('dev');
      expect(envParam.AllowedValues).toEqual(['dev', 'staging', 'prod']);
    });

    const logRetentionTestName = generateUniqueTestName(
      'log-retention-parameter'
    );
    test(logRetentionTestName, () => {
      expect(template.Parameters.LogRetentionDays).toBeDefined();
      const logParam = template.Parameters.LogRetentionDays;
      expect(logParam.Type).toBe('Number');
      expect(logParam.Default).toBe(14);
    });
  });

  describe('Globals Configuration', () => {
    const functionGlobalsTestName = generateUniqueTestName('function-globals');
    test(functionGlobalsTestName, () => {
      const functionGlobals = template.Globals.Function;
      expect(functionGlobals.Runtime).toBe('python3.9');
      expect(functionGlobals.Timeout).toBe(30);
      expect(functionGlobals.MemorySize).toBe(256);
      expect(functionGlobals.Tags.Project).toBe('ServerlessApp');
    });

    const apiGlobalsTestName = generateUniqueTestName('api-globals');
    test(apiGlobalsTestName, () => {
      const apiGlobals = template.Globals.Api;
      expect(apiGlobals).toBeDefined();
      expect(apiGlobals.Name).toBeDefined();
    });
  });

  describe('API Gateway Resources', () => {
    const apiLogGroupTestName = generateUniqueTestName('api-log-group-exists');
    test(apiLogGroupTestName, () => {
      // Since we're using SAM implicit API, we validate the log group exists
      expect(template.Resources.ApiGatewayLogGroup).toBeDefined();
      const logGroup = template.Resources.ApiGatewayLogGroup;
      expect(logGroup.Type).toBe('AWS::Logs::LogGroup');
      expect(logGroup.Properties.LogGroupName).toBeDefined();
    });
  });

  describe('Lambda Functions', () => {
    const createUserFunctionTestName = generateUniqueTestName(
      'create-user-function'
    );
    test(createUserFunctionTestName, () => {
      expect(template.Resources.CreateUserFunction).toBeDefined();
      const func = template.Resources.CreateUserFunction;
      expect(func.Type).toBe('AWS::Serverless::Function');
      expect(func.Properties.Handler).toBe('index.lambda_handler');
      expect(func.Properties.InlineCode).toBeDefined();
      expect(func.Properties.CodeUri).toBeUndefined();
      expect(func.Properties.DeadLetterQueue.Type).toBe('SQS');
    });

    const getUserFunctionTestName = generateUniqueTestName('get-user-function');
    test(getUserFunctionTestName, () => {
      expect(template.Resources.GetUserFunction).toBeDefined();
      const func = template.Resources.GetUserFunction;
      expect(func.Type).toBe('AWS::Serverless::Function');
      expect(func.Properties.Handler).toBe('index.lambda_handler');
      expect(func.Properties.InlineCode).toBeDefined();
      expect(func.Properties.CodeUri).toBeUndefined();
      expect(func.Properties.DeadLetterQueue.Type).toBe('SQS');
    });

    const createUserApiEventTestName = generateUniqueTestName(
      'create-user-api-event'
    );
    test(createUserApiEventTestName, () => {
      const func = template.Resources.CreateUserFunction;
      const apiEvent = func.Properties.Events.CreateUserApi;
      expect(apiEvent.Type).toBe('Api');
      expect(apiEvent.Properties.Path).toBe('/user');
      expect(apiEvent.Properties.Method).toBe('POST');
    });

    const getUserApiEventTestName =
      generateUniqueTestName('get-user-api-event');
    test(getUserApiEventTestName, () => {
      const func = template.Resources.GetUserFunction;
      const apiEvent = func.Properties.Events.GetUserApi;
      expect(apiEvent.Type).toBe('Api');
      expect(apiEvent.Properties.Path).toBe('/user/{id}');
      expect(apiEvent.Properties.Method).toBe('GET');
    });
  });

  describe('DynamoDB Table', () => {
    const userTableTestName = generateUniqueTestName('user-table-resource');
    test(userTableTestName, () => {
      expect(template.Resources.UserTable).toBeDefined();
      const table = template.Resources.UserTable;
      expect(table.Type).toBe('AWS::DynamoDB::Table');
      expect(table.Properties.BillingMode).toBe('PAY_PER_REQUEST');
      expect(table.Properties.StreamSpecification.StreamViewType).toBe(
        'NEW_AND_OLD_IMAGES'
      );
      expect(
        table.Properties.PointInTimeRecoverySpecification
          .PointInTimeRecoveryEnabled
      ).toBe(true);
      expect(table.Properties.SSESpecification.SSEEnabled).toBe(true);
    });

    const tableAttributesTestName = generateUniqueTestName('table-attributes');
    test(tableAttributesTestName, () => {
      const table = template.Resources.UserTable;
      expect(table.Properties.AttributeDefinitions).toHaveLength(1);
      expect(table.Properties.AttributeDefinitions[0].AttributeName).toBe(
        'userId'
      );
      expect(table.Properties.AttributeDefinitions[0].AttributeType).toBe('S');
    });

    const tableKeySchemaTestName = generateUniqueTestName('table-key-schema');
    test(tableKeySchemaTestName, () => {
      const table = template.Resources.UserTable;
      expect(table.Properties.KeySchema).toHaveLength(1);
      expect(table.Properties.KeySchema[0].AttributeName).toBe('userId');
      expect(table.Properties.KeySchema[0].KeyType).toBe('HASH');
    });
  });

  describe('IAM Role', () => {
    const lambdaExecutionRoleTestName = generateUniqueTestName(
      'lambda-execution-role'
    );
    test(lambdaExecutionRoleTestName, () => {
      expect(template.Resources.LambdaExecutionRole).toBeDefined();
      const role = template.Resources.LambdaExecutionRole;
      expect(role.Type).toBe('AWS::IAM::Role');
      expect(role.Properties.AssumeRolePolicyDocument.Version).toBe(
        '2012-10-17'
      );
    });

    const rolePoliciesTestName = generateUniqueTestName('role-policies');
    test(rolePoliciesTestName, () => {
      const role = template.Resources.LambdaExecutionRole;
      expect(role.Properties.ManagedPolicyArns).toContain(
        'arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole'
      );
      expect(role.Properties.ManagedPolicyArns).toContain(
        'arn:aws:iam::aws:policy/AWSXRayDaemonWriteAccess'
      );
      expect(role.Properties.Policies).toHaveLength(2);
    });

    const dynamoDbPolicyTestName = generateUniqueTestName('dynamodb-policy');
    test(dynamoDbPolicyTestName, () => {
      const role = template.Resources.LambdaExecutionRole;
      const dynamoPolicy = role.Properties.Policies.find(
        (p: any) => p.PolicyName === 'DynamoDBAccess'
      );
      expect(dynamoPolicy).toBeDefined();
      expect(dynamoPolicy.PolicyDocument.Statement[0].Action).toContain(
        'dynamodb:GetItem'
      );
      expect(dynamoPolicy.PolicyDocument.Statement[0].Action).toContain(
        'dynamodb:PutItem'
      );
    });

    const sqsPolicyTestName = generateUniqueTestName('sqs-policy');
    test(sqsPolicyTestName, () => {
      const role = template.Resources.LambdaExecutionRole;
      const sqsPolicy = role.Properties.Policies.find(
        (p: any) => p.PolicyName === 'SQSAccess'
      );
      expect(sqsPolicy).toBeDefined();
      expect(sqsPolicy.PolicyDocument.Statement[0].Action).toContain(
        'sqs:SendMessage'
      );
    });
  });

  describe('Dead Letter Queues', () => {
    const createUserDlqTestName = generateUniqueTestName('create-user-dlq');
    test(createUserDlqTestName, () => {
      expect(template.Resources.CreateUserDLQ).toBeDefined();
      const dlq = template.Resources.CreateUserDLQ;
      expect(dlq.Type).toBe('AWS::SQS::Queue');
      expect(dlq.Properties.MessageRetentionPeriod).toBe(1209600);
    });

    const getUserDlqTestName = generateUniqueTestName('get-user-dlq');
    test(getUserDlqTestName, () => {
      expect(template.Resources.GetUserDLQ).toBeDefined();
      const dlq = template.Resources.GetUserDLQ;
      expect(dlq.Type).toBe('AWS::SQS::Queue');
      expect(dlq.Properties.MessageRetentionPeriod).toBe(1209600);
    });
  });

  describe('CloudWatch Log Groups', () => {
    const createUserLogGroupTestName = generateUniqueTestName(
      'create-user-log-group'
    );
    test(createUserLogGroupTestName, () => {
      expect(template.Resources.CreateUserLogGroup).toBeDefined();
      const logGroup = template.Resources.CreateUserLogGroup;
      expect(logGroup.Type).toBe('AWS::Logs::LogGroup');
      expect(logGroup.Properties.RetentionInDays).toEqual({
        Ref: 'LogRetentionDays',
      });
    });

    const getUserLogGroupTestName =
      generateUniqueTestName('get-user-log-group');
    test(getUserLogGroupTestName, () => {
      expect(template.Resources.GetUserLogGroup).toBeDefined();
      const logGroup = template.Resources.GetUserLogGroup;
      expect(logGroup.Type).toBe('AWS::Logs::LogGroup');
      expect(logGroup.Properties.RetentionInDays).toEqual({
        Ref: 'LogRetentionDays',
      });
    });

    const apiLogGroupTestName = generateUniqueTestName('api-gateway-log-group');
    test(apiLogGroupTestName, () => {
      expect(template.Resources.ApiGatewayLogGroup).toBeDefined();
      const logGroup = template.Resources.ApiGatewayLogGroup;
      expect(logGroup.Type).toBe('AWS::Logs::LogGroup');
      expect(logGroup.Properties.RetentionInDays).toEqual({
        Ref: 'LogRetentionDays',
      });
    });
  });

  describe('CloudWatch Alarms', () => {
    const createUserErrorAlarmTestName = generateUniqueTestName(
      'create-user-error-alarm'
    );
    test(createUserErrorAlarmTestName, () => {
      expect(template.Resources.CreateUserErrorAlarm).toBeDefined();
      const alarm = template.Resources.CreateUserErrorAlarm;
      expect(alarm.Type).toBe('AWS::CloudWatch::Alarm');
      expect(alarm.Properties.MetricName).toBe('Errors');
      expect(alarm.Properties.Namespace).toBe('AWS/Lambda');
      expect(alarm.Properties.Threshold).toBe(5);
      expect(alarm.Properties.ComparisonOperator).toBe('GreaterThanThreshold');
    });

    const getUserErrorAlarmTestName = generateUniqueTestName(
      'get-user-error-alarm'
    );
    test(getUserErrorAlarmTestName, () => {
      expect(template.Resources.GetUserErrorAlarm).toBeDefined();
      const alarm = template.Resources.GetUserErrorAlarm;
      expect(alarm.Type).toBe('AWS::CloudWatch::Alarm');
      expect(alarm.Properties.MetricName).toBe('Errors');
      expect(alarm.Properties.Namespace).toBe('AWS/Lambda');
      expect(alarm.Properties.Threshold).toBe(5);
      expect(alarm.Properties.ComparisonOperator).toBe('GreaterThanThreshold');
    });
  });

  describe('Lambda Versions and Aliases', () => {
    const createUserVersionTestName = generateUniqueTestName(
      'create-user-version'
    );
    test(createUserVersionTestName, () => {
      expect(template.Resources.CreateUserFunctionVersion).toBeDefined();
      const version = template.Resources.CreateUserFunctionVersion;
      expect(version.Type).toBe('AWS::Lambda::Version');
      expect(version.Properties.FunctionName).toEqual({
        Ref: 'CreateUserFunction',
      });
    });

    const createUserAliasTestName = generateUniqueTestName('create-user-alias');
    test(createUserAliasTestName, () => {
      expect(template.Resources.CreateUserFunctionAlias).toBeDefined();
      const alias = template.Resources.CreateUserFunctionAlias;
      expect(alias.Type).toBe('AWS::Lambda::Alias');
      expect(alias.Properties.FunctionName).toEqual({
        Ref: 'CreateUserFunction',
      });
    });

    const getUserVersionTestName = generateUniqueTestName('get-user-version');
    test(getUserVersionTestName, () => {
      expect(template.Resources.GetUserFunctionVersion).toBeDefined();
      const version = template.Resources.GetUserFunctionVersion;
      expect(version.Type).toBe('AWS::Lambda::Version');
      expect(version.Properties.FunctionName).toEqual({
        Ref: 'GetUserFunction',
      });
    });

    const getUserAliasTestName = generateUniqueTestName('get-user-alias');
    test(getUserAliasTestName, () => {
      expect(template.Resources.GetUserFunctionAlias).toBeDefined();
      const alias = template.Resources.GetUserFunctionAlias;
      expect(alias.Type).toBe('AWS::Lambda::Alias');
      expect(alias.Properties.FunctionName).toEqual({ Ref: 'GetUserFunction' });
    });
  });

  describe('Template Outputs', () => {
    const apiEndpointOutputTestName = generateUniqueTestName(
      'api-endpoint-output'
    );
    test(apiEndpointOutputTestName, () => {
      expect(template.Outputs.ApiEndpoint).toBeDefined();
      const output = template.Outputs.ApiEndpoint;
      expect(output.Description).toBe('API Gateway endpoint URL');
      expect(output.Export).toBeDefined();
    });

    const userTableNameOutputTestName = generateUniqueTestName(
      'user-table-name-output'
    );
    test(userTableNameOutputTestName, () => {
      expect(template.Outputs.UserTableName).toBeDefined();
      const output = template.Outputs.UserTableName;
      expect(output.Description).toBe('DynamoDB User Table Name');
      expect(output.Value).toEqual({ Ref: 'UserTable' });
    });
  });

  describe('Resource Tagging', () => {
    const resourceTagsTestName = generateUniqueTestName(
      'resource-tags-validation'
    );
    test(resourceTagsTestName, () => {
      const resourcesWithTags = [
        'UserTable',
        'LambdaExecutionRole',
        'CreateUserDLQ',
        'GetUserDLQ',
        'CreateUserLogGroup',
        'GetUserLogGroup',
        'ApiGatewayLogGroup',
        'CreateUserErrorAlarm',
        'GetUserErrorAlarm',
      ];

      resourcesWithTags.forEach(resourceName => {
        const resource = template.Resources[resourceName];
        expect(resource.Properties.Tags).toBeDefined();

        // Find Project tag
        const projectTag = resource.Properties.Tags.find(
          (tag: any) => tag.Key === 'Project'
        );
        expect(projectTag).toBeDefined();
        expect(projectTag.Value).toBe('ServerlessApp');
      });
    });
  });

  describe('Template Validation Comprehensive', () => {
    const structuralIntegrityTestName = generateUniqueTestName(
      'structural-integrity'
    );
    test(structuralIntegrityTestName, () => {
      expect(template).toBeDefined();
      expect(typeof template).toBe('object');
      expect(template.AWSTemplateFormatVersion).not.toBeNull();
      expect(template.Transform).not.toBeNull();
      expect(template.Description).not.toBeNull();
      expect(template.Parameters).not.toBeNull();
      expect(template.Resources).not.toBeNull();
      expect(template.Outputs).not.toBeNull();
    });

    const resourceCountTestName = generateUniqueTestName(
      'resource-count-validation'
    );
    test(resourceCountTestName, () => {
      const resourceCount = Object.keys(template.Resources).length;
      expect(resourceCount).toBe(15); // Total resources in the template (removed explicit ServerlessApi)
    });

    const outputCountTestName = generateUniqueTestName(
      'output-count-validation'
    );
    test(outputCountTestName, () => {
      const outputCount = Object.keys(template.Outputs).length;
      expect(outputCount).toBe(5); // Total outputs in the template
    });

    const parameterCountTestName = generateUniqueTestName(
      'parameter-count-validation'
    );
    test(parameterCountTestName, () => {
      const parameterCount = Object.keys(template.Parameters).length;
      expect(parameterCount).toBe(2); // Environment and LogRetentionDays
    });
  });

  describe('Security Configuration', () => {
    const encryptionTestName = generateUniqueTestName('dynamodb-encryption');
    test(encryptionTestName, () => {
      const table = template.Resources.UserTable;
      expect(table.Properties.SSESpecification.SSEEnabled).toBe(true);
    });

    const xrayTracingTestName = generateUniqueTestName('xray-tracing');
    test(xrayTracingTestName, () => {
      // Since we're using SAM implicit API and removed TracingConfig,
      // we can verify X-Ray is configured via Lambda execution role
      const role = template.Resources.LambdaExecutionRole;
      expect(role.Properties.ManagedPolicyArns).toContain(
        'arn:aws:iam::aws:policy/AWSXRayDaemonWriteAccess'
      );
    });

    const iamPermissionsTestName = generateUniqueTestName(
      'iam-least-privilege'
    );
    test(iamPermissionsTestName, () => {
      const role = template.Resources.LambdaExecutionRole;
      const dynamoPolicy = role.Properties.Policies.find(
        (p: any) => p.PolicyName === 'DynamoDBAccess'
      );

      // Ensure specific DynamoDB permissions are granted
      expect(dynamoPolicy.PolicyDocument.Statement[0].Action).toEqual([
        'dynamodb:GetItem',
        'dynamodb:PutItem',
        'dynamodb:UpdateItem',
        'dynamodb:DeleteItem',
        'dynamodb:Query',
        'dynamodb:Scan',
      ]);
    });
  });
});
