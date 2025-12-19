import { Testing } from 'cdktf';
import { TapStack } from '../lib/tap-stack';

describe('TapStack Unit Tests', () => {
  describe('Development Environment', () => {
    it('should create a stack with development configuration', () => {
      const app = Testing.app();
      const stack = new TapStack(app, 'test-dev', {
        environmentSuffix: 'dev-test',
        environment: 'dev',
        region: 'ap-southeast-1',
        project: 'test-project',
      });

      const synthesized = Testing.synth(stack);
      expect(synthesized).toBeTruthy();
    });

    it('should create DynamoDB table with PAY_PER_REQUEST billing for dev', () => {
      const app = Testing.app();
      const stack = new TapStack(app, 'test-dev', {
        environmentSuffix: 'dev-test',
        environment: 'dev',
        region: 'ap-southeast-1',
        project: 'test-project',
      });

      const synthesized = Testing.synth(stack);
      const resources = JSON.parse(synthesized).resource;

      expect(resources.aws_dynamodb_table).toBeDefined();
      const dynamoTable = resources.aws_dynamodb_table.api_table;
      expect(dynamoTable.billing_mode).toBe('PAY_PER_REQUEST');
      expect(dynamoTable.read_capacity).toBeUndefined();
      expect(dynamoTable.write_capacity).toBeUndefined();
      expect(dynamoTable.name).toContain('dev-test');
    });

    it('should configure Lambda with 512MB memory for dev', () => {
      const app = Testing.app();
      const stack = new TapStack(app, 'test-dev', {
        environmentSuffix: 'dev-test',
        environment: 'dev',
        region: 'ap-southeast-1',
        project: 'test-project',
      });

      const synthesized = Testing.synth(stack);
      const resources = JSON.parse(synthesized).resource;

      expect(resources.aws_lambda_function).toBeDefined();
      const lambdaFunction = resources.aws_lambda_function.api_function;
      expect(lambdaFunction.memory_size).toBe(512);
      expect(lambdaFunction.reserved_concurrent_executions).toBe(10);
      expect(lambdaFunction.function_name).toContain('dev-test');
    });

    it('should set CloudWatch log retention to 7 days for dev', () => {
      const app = Testing.app();
      const stack = new TapStack(app, 'test-dev', {
        environmentSuffix: 'dev-test',
        environment: 'dev',
        region: 'ap-southeast-1',
        project: 'test-project',
      });

      const synthesized = Testing.synth(stack);
      const resources = JSON.parse(synthesized).resource;

      expect(resources.aws_cloudwatch_log_group).toBeDefined();
      const logGroups = resources.aws_cloudwatch_log_group;
      expect(logGroups.lambda_log_group.retention_in_days).toBe(7);
      expect(logGroups.api_log_group.retention_in_days).toBe(7);
    });

    it('should not create API key for dev environment', () => {
      const app = Testing.app();
      const stack = new TapStack(app, 'test-dev', {
        environmentSuffix: 'dev-test',
        environment: 'dev',
        region: 'ap-southeast-1',
        project: 'test-project',
      });

      const synthesized = Testing.synth(stack);
      const resources = JSON.parse(synthesized).resource;

      expect(resources.aws_api_gateway_api_key).toBeUndefined();
      expect(resources.aws_api_gateway_usage_plan).toBeUndefined();
    });

    it('should not create CloudWatch alarm for dev environment', () => {
      const app = Testing.app();
      const stack = new TapStack(app, 'test-dev', {
        environmentSuffix: 'dev-test',
        environment: 'dev',
        region: 'ap-southeast-1',
        project: 'test-project',
      });

      const synthesized = Testing.synth(stack);
      const resources = JSON.parse(synthesized).resource;

      expect(resources.aws_cloudwatch_metric_alarm).toBeUndefined();
    });

    it('should not configure access logging for dev environment', () => {
      const app = Testing.app();
      const stack = new TapStack(app, 'test-dev', {
        environmentSuffix: 'dev-test',
        environment: 'dev',
        region: 'ap-southeast-1',
        project: 'test-project',
      });

      const synthesized = Testing.synth(stack);
      const resources = JSON.parse(synthesized).resource;

      const apiStage = resources.aws_api_gateway_stage.api_stage;
      expect(apiStage.access_log_settings).toBeUndefined();
    });

    it('should set API method api_key_required to false for dev', () => {
      const app = Testing.app();
      const stack = new TapStack(app, 'test-dev', {
        environmentSuffix: 'dev-test',
        environment: 'dev',
        region: 'ap-southeast-1',
        project: 'test-project',
      });

      const synthesized = Testing.synth(stack);
      const resources = JSON.parse(synthesized).resource;

      const apiMethod = resources.aws_api_gateway_method.api_method;
      expect(apiMethod.api_key_required).toBe(false);
    });
  });

  describe('Production Environment', () => {
    it('should create DynamoDB table with PROVISIONED billing for prod', () => {
      const app = Testing.app();
      const stack = new TapStack(app, 'test-prod', {
        environmentSuffix: 'prod-test',
        environment: 'prod',
        region: 'ap-southeast-1',
        project: 'test-project',
      });

      const synthesized = Testing.synth(stack);
      const resources = JSON.parse(synthesized).resource;

      const dynamoTable = resources.aws_dynamodb_table.api_table;
      expect(dynamoTable.billing_mode).toBe('PROVISIONED');
      expect(dynamoTable.read_capacity).toBe(5);
      expect(dynamoTable.write_capacity).toBe(5);
    });

    it('should configure Lambda with 1024MB memory for prod', () => {
      const app = Testing.app();
      const stack = new TapStack(app, 'test-prod', {
        environmentSuffix: 'prod-test',
        environment: 'prod',
        region: 'ap-southeast-1',
        project: 'test-project',
      });

      const synthesized = Testing.synth(stack);
      const resources = JSON.parse(synthesized).resource;

      const lambdaFunction = resources.aws_lambda_function.api_function;
      expect(lambdaFunction.memory_size).toBe(1024);
      expect(lambdaFunction.reserved_concurrent_executions).toBe(100);
    });

    it('should set CloudWatch log retention to 30 days for prod', () => {
      const app = Testing.app();
      const stack = new TapStack(app, 'test-prod', {
        environmentSuffix: 'prod-test',
        environment: 'prod',
        region: 'ap-southeast-1',
        project: 'test-project',
      });

      const synthesized = Testing.synth(stack);
      const resources = JSON.parse(synthesized).resource;

      const logGroups = resources.aws_cloudwatch_log_group;
      expect(logGroups.lambda_log_group.retention_in_days).toBe(30);
      expect(logGroups.api_log_group.retention_in_days).toBe(30);
    });

    it('should create API key for prod environment', () => {
      const app = Testing.app();
      const stack = new TapStack(app, 'test-prod', {
        environmentSuffix: 'prod-test',
        environment: 'prod',
        region: 'ap-southeast-1',
        project: 'test-project',
      });

      const synthesized = Testing.synth(stack);
      const resources = JSON.parse(synthesized).resource;

      expect(resources.aws_api_gateway_api_key).toBeDefined();
      const apiKey = resources.aws_api_gateway_api_key.api_key;
      expect(apiKey.enabled).toBe(true);
      expect(apiKey.name).toContain('prod-test');
    });

    it('should create usage plan with throttling for prod', () => {
      const app = Testing.app();
      const stack = new TapStack(app, 'test-prod', {
        environmentSuffix: 'prod-test',
        environment: 'prod',
        region: 'ap-southeast-1',
        project: 'test-project',
      });

      const synthesized = Testing.synth(stack);
      const resources = JSON.parse(synthesized).resource;

      expect(resources.aws_api_gateway_usage_plan).toBeDefined();
      const usagePlan = resources.aws_api_gateway_usage_plan.usage_plan;
      expect(usagePlan.throttle_settings).toBeDefined();
      const throttleSettings = Array.isArray(usagePlan.throttle_settings)
        ? usagePlan.throttle_settings[0]
        : usagePlan.throttle_settings;
      expect(throttleSettings.rate_limit).toBe(1000);
      expect(throttleSettings.burst_limit).toBe(2000);
    });

    it('should create CloudWatch alarm for prod environment', () => {
      const app = Testing.app();
      const stack = new TapStack(app, 'test-prod', {
        environmentSuffix: 'prod-test',
        environment: 'prod',
        region: 'ap-southeast-1',
        project: 'test-project',
      });

      const synthesized = Testing.synth(stack);
      const resources = JSON.parse(synthesized).resource;

      expect(resources.aws_cloudwatch_metric_alarm).toBeDefined();
      const alarm = resources.aws_cloudwatch_metric_alarm.api_4xx_alarm;
      expect(alarm.alarm_name).toContain('prod-test');
      expect(alarm.metric_name).toBe('4XXError');
      expect(alarm.threshold).toBe(10);
    });

    it('should configure access logging for prod environment', () => {
      const app = Testing.app();
      const stack = new TapStack(app, 'test-prod', {
        environmentSuffix: 'prod-test',
        environment: 'prod',
        region: 'ap-southeast-1',
        project: 'test-project',
      });

      const synthesized = Testing.synth(stack);
      const resources = JSON.parse(synthesized).resource;

      const apiStage = resources.aws_api_gateway_stage.api_stage;
      expect(apiStage.access_log_settings).toBeDefined();
      const accessLogSettings = Array.isArray(apiStage.access_log_settings)
        ? apiStage.access_log_settings[0]
        : apiStage.access_log_settings;
      expect(accessLogSettings.format).toBeDefined();
    });

    it('should set API method api_key_required to true for prod', () => {
      const app = Testing.app();
      const stack = new TapStack(app, 'test-prod', {
        environmentSuffix: 'prod-test',
        environment: 'prod',
        region: 'ap-southeast-1',
        project: 'test-project',
      });

      const synthesized = Testing.synth(stack);
      const resources = JSON.parse(synthesized).resource;

      const apiMethod = resources.aws_api_gateway_method.api_method;
      expect(apiMethod.api_key_required).toBe(true);
    });
  });

  describe('Common Resources', () => {
    it('should create IAM role for Lambda', () => {
      const app = Testing.app();
      const stack = new TapStack(app, 'test', {
        environmentSuffix: 'test',
        environment: 'dev',
        region: 'ap-southeast-1',
        project: 'test-project',
      });

      const synthesized = Testing.synth(stack);
      const resources = JSON.parse(synthesized).resource;

      expect(resources.aws_iam_role).toBeDefined();
      const lambdaRole = resources.aws_iam_role.lambda_role;
      expect(lambdaRole.name).toContain('test');
      expect(lambdaRole.assume_role_policy).toContain('lambda.amazonaws.com');
    });

    it('should attach Lambda basic execution policy', () => {
      const app = Testing.app();
      const stack = new TapStack(app, 'test', {
        environmentSuffix: 'test',
        environment: 'dev',
        region: 'ap-southeast-1',
        project: 'test-project',
      });

      const synthesized = Testing.synth(stack);
      const resources = JSON.parse(synthesized).resource;

      expect(resources.aws_iam_role_policy_attachment).toBeDefined();
      const policyAttachment =
        resources.aws_iam_role_policy_attachment.lambda_basic_execution;
      expect(policyAttachment.policy_arn).toContain(
        'AWSLambdaBasicExecutionRole',
      );
    });

    it('should create DynamoDB access policy', () => {
      const app = Testing.app();
      const stack = new TapStack(app, 'test', {
        environmentSuffix: 'test',
        environment: 'dev',
        region: 'ap-southeast-1',
        project: 'test-project',
      });

      const synthesized = Testing.synth(stack);
      const resources = JSON.parse(synthesized).resource;

      expect(resources.aws_iam_policy).toBeDefined();
      const dynamoPolicy = resources.aws_iam_policy.dynamo_policy;
      expect(dynamoPolicy.name).toContain('test');
      const policyDocument = JSON.parse(dynamoPolicy.policy);
      expect(policyDocument.Statement[0].Action).toContain('dynamodb:GetItem');
      expect(policyDocument.Statement[0].Action).toContain('dynamodb:PutItem');
    });

    it('should create API Gateway REST API', () => {
      const app = Testing.app();
      const stack = new TapStack(app, 'test', {
        environmentSuffix: 'test',
        environment: 'dev',
        region: 'ap-southeast-1',
        project: 'test-project',
      });

      const synthesized = Testing.synth(stack);
      const resources = JSON.parse(synthesized).resource;

      expect(resources.aws_api_gateway_rest_api).toBeDefined();
      const restApi = resources.aws_api_gateway_rest_api.rest_api;
      expect(restApi.name).toContain('test');
      const endpointConfig = Array.isArray(restApi.endpoint_configuration)
        ? restApi.endpoint_configuration[0]
        : restApi.endpoint_configuration;
      expect(endpointConfig.types).toContain('EDGE');
    });

    it('should create API Gateway resource and method', () => {
      const app = Testing.app();
      const stack = new TapStack(app, 'test', {
        environmentSuffix: 'test',
        environment: 'dev',
        region: 'ap-southeast-1',
        project: 'test-project',
      });

      const synthesized = Testing.synth(stack);
      const resources = JSON.parse(synthesized).resource;

      expect(resources.aws_api_gateway_resource).toBeDefined();
      const apiResource = resources.aws_api_gateway_resource.api_resource;
      expect(apiResource.path_part).toBe('items');

      expect(resources.aws_api_gateway_method).toBeDefined();
      const apiMethod = resources.aws_api_gateway_method.api_method;
      expect(apiMethod.http_method).toBe('GET');
      expect(apiMethod.authorization).toBe('NONE');
    });

    it('should create Lambda integration with API Gateway', () => {
      const app = Testing.app();
      const stack = new TapStack(app, 'test', {
        environmentSuffix: 'test',
        environment: 'dev',
        region: 'ap-southeast-1',
        project: 'test-project',
      });

      const synthesized = Testing.synth(stack);
      const resources = JSON.parse(synthesized).resource;

      expect(resources.aws_api_gateway_integration).toBeDefined();
      const integration =
        resources.aws_api_gateway_integration.lambda_integration;
      expect(integration.type).toBe('AWS_PROXY');
      expect(integration.integration_http_method).toBe('POST');
    });

    it('should create Lambda permission for API Gateway', () => {
      const app = Testing.app();
      const stack = new TapStack(app, 'test', {
        environmentSuffix: 'test',
        environment: 'dev',
        region: 'ap-southeast-1',
        project: 'test-project',
      });

      const synthesized = Testing.synth(stack);
      const resources = JSON.parse(synthesized).resource;

      expect(resources.aws_lambda_permission).toBeDefined();
      const permission =
        resources.aws_lambda_permission.api_lambda_permission;
      expect(permission.action).toBe('lambda:InvokeFunction');
      expect(permission.principal).toBe('apigateway.amazonaws.com');
    });

    it('should enable DynamoDB encryption', () => {
      const app = Testing.app();
      const stack = new TapStack(app, 'test', {
        environmentSuffix: 'test',
        environment: 'dev',
        region: 'ap-southeast-1',
        project: 'test-project',
      });

      const synthesized = Testing.synth(stack);
      const resources = JSON.parse(synthesized).resource;

      const dynamoTable = resources.aws_dynamodb_table.api_table;
      expect(dynamoTable.server_side_encryption).toBeDefined();
      expect(dynamoTable.server_side_encryption.enabled).toBe(true);
    });

    it('should configure Lambda environment variables', () => {
      const app = Testing.app();
      const stack = new TapStack(app, 'test', {
        environmentSuffix: 'test',
        environment: 'dev',
        region: 'ap-southeast-1',
        project: 'test-project',
      });

      const synthesized = Testing.synth(stack);
      const resources = JSON.parse(synthesized).resource;

      const lambdaFunction = resources.aws_lambda_function.api_function;
      expect(lambdaFunction.environment).toBeDefined();
      const environment = Array.isArray(lambdaFunction.environment)
        ? lambdaFunction.environment[0]
        : lambdaFunction.environment;
      expect(environment.variables).toBeDefined();
      expect(environment.variables.TABLE_NAME).toBeDefined();
      expect(environment.variables.ENVIRONMENT).toBe('dev');
    });

    it('should include environmentSuffix in all resource names', () => {
      const app = Testing.app();
      const stack = new TapStack(app, 'test', {
        environmentSuffix: 'unique-test-123',
        environment: 'dev',
        region: 'ap-southeast-1',
        project: 'test-project',
      });

      const synthesized = Testing.synth(stack);
      const resources = JSON.parse(synthesized).resource;

      // Check DynamoDB table name
      expect(resources.aws_dynamodb_table.api_table.name).toContain(
        'unique-test-123',
      );

      // Check Lambda function name
      expect(resources.aws_lambda_function.api_function.function_name).toContain(
        'unique-test-123',
      );

      // Check IAM role name
      expect(resources.aws_iam_role.lambda_role.name).toContain(
        'unique-test-123',
      );

      // Check IAM policy name
      expect(resources.aws_iam_policy.dynamo_policy.name).toContain(
        'unique-test-123',
      );

      // Check API Gateway name
      expect(resources.aws_api_gateway_rest_api.rest_api.name).toContain(
        'unique-test-123',
      );

      // Check CloudWatch log group names
      expect(
        resources.aws_cloudwatch_log_group.lambda_log_group.name,
      ).toContain('unique-test-123');
      expect(resources.aws_cloudwatch_log_group.api_log_group.name).toContain(
        'unique-test-123',
      );
    });

    it('should include environment tags on resources', () => {
      const app = Testing.app();
      const stack = new TapStack(app, 'test', {
        environmentSuffix: 'test',
        environment: 'staging',
        region: 'ap-southeast-1',
        project: 'test-project',
      });

      const synthesized = Testing.synth(stack);
      const resources = JSON.parse(synthesized).resource;

      // Check DynamoDB tags
      expect(resources.aws_dynamodb_table.api_table.tags).toBeDefined();
      expect(resources.aws_dynamodb_table.api_table.tags.Environment).toBe(
        'staging',
      );

      // Check Lambda tags
      expect(resources.aws_lambda_function.api_function.tags).toBeDefined();
      expect(resources.aws_lambda_function.api_function.tags.Environment).toBe(
        'staging',
      );

      // Check IAM role tags
      expect(resources.aws_iam_role.lambda_role.tags).toBeDefined();
      expect(resources.aws_iam_role.lambda_role.tags.Environment).toBe(
        'staging',
      );
    });

    it('should create stack outputs', () => {
      const app = Testing.app();
      const stack = new TapStack(app, 'test', {
        environmentSuffix: 'test',
        environment: 'dev',
        region: 'ap-southeast-1',
        project: 'test-project',
      });

      const synthesized = Testing.synth(stack);
      const outputs = JSON.parse(synthesized).output;

      expect(outputs).toBeDefined();
      expect(outputs.dynamodb_table_name).toBeDefined();
      expect(outputs.lambda_function_name).toBeDefined();
      expect(outputs.api_gateway_id).toBeDefined();
      expect(outputs.api_gateway_url).toBeDefined();
      expect(outputs.api_stage_name).toBeDefined();
    });

    it('should use correct region', () => {
      const app = Testing.app();
      const stack = new TapStack(app, 'test', {
        environmentSuffix: 'test',
        environment: 'dev',
        region: 'us-west-2',
        project: 'test-project',
      });

      const synthesized = Testing.synth(stack);
      const provider = JSON.parse(synthesized).provider;

      expect(provider.aws[0].region).toBe('us-west-2');
    });

    it('should include default tags from provider', () => {
      const app = Testing.app();
      const stack = new TapStack(app, 'test', {
        environmentSuffix: 'test',
        environment: 'dev',
        region: 'ap-southeast-1',
        project: 'my-project',
      });

      const synthesized = Testing.synth(stack);
      const provider = JSON.parse(synthesized).provider;

      expect(provider.aws[0].default_tags).toBeDefined();
      const defaultTags = provider.aws[0].default_tags[0].tags;
      expect(defaultTags.Environment).toBe('dev');
      expect(defaultTags.Project).toBe('my-project');
      expect(defaultTags.ManagedBy).toBe('CDKTF');
    });
  });
});
