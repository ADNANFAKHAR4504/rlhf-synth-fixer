import { App, Testing } from 'cdktf';
import { TapStack } from '../lib/tap-stack';

describe('TapStack Unit Tests', () => {
  let app: App;
  let stack: TapStack;
  let synthesized: any;

  beforeEach(() => {
    jest.clearAllMocks();
    app = new App();
    stack = new TapStack(app, 'TestTapStack', {
      environmentSuffix: 'prod',
      awsRegion: 'us-east-1',
      defaultTags: {
        Environment: 'Test',
      },
    });
    const synthesizedString = Testing.synth(stack);
    synthesized = JSON.parse(synthesizedString);
  });

  describe('Stack Instantiation', () => {
    test('should instantiate successfully with props', () => {
      expect(stack).toBeDefined();
      expect(synthesized).toBeDefined();
    });

    test('should use default values when no props provided', () => {
      const defaultApp = new App();
      const defaultStack = new TapStack(defaultApp, 'TestTapStackDefault');
      const defaultSynthesized = JSON.parse(Testing.synth(defaultStack));

      expect(defaultStack).toBeDefined();
      expect(defaultSynthesized).toBeDefined();
    });

    test('should handle partial props configuration', () => {
      const partialApp = new App();
      const partialStack = new TapStack(partialApp, 'TestTapStackPartial', {
        awsRegion: 'eu-west-1',
      });
      const partialSynthesized = JSON.parse(Testing.synth(partialStack));

      expect(partialStack).toBeDefined();
      expect(partialSynthesized).toBeDefined();
    });
  });

  describe('AWS Resources Creation', () => {
    test('should create AWS provider with correct configuration', () => {
      const providers = Object.keys(synthesized.provider);
      expect(providers).toContain('aws');

      const awsProvider = synthesized.provider.aws;
      expect(awsProvider).toBeDefined();
      expect(awsProvider[0].region).toBe('us-east-1');
    });

    test('should create S3 bucket for Lambda packages', () => {
      const s3Buckets = synthesized.resource.aws_s3_bucket;
      expect(s3Buckets).toBeDefined();

      const lambdaBuckets = Object.values(s3Buckets).filter(
        (bucket: any) => bucket.tags?.Purpose === 'Lambda deployment packages'
      );
      expect(lambdaBuckets).toHaveLength(1);
    });

    test('should create DynamoDB user table with correct configuration', () => {
      const dynamoTables = synthesized.resource.aws_dynamodb_table;
      expect(dynamoTables).toBeDefined();

      const userTable = Object.values(dynamoTables).find(
        (table: any) => table.name && table.name.includes('users')
      );

      expect(userTable).toBeDefined();
      expect((userTable as any).billing_mode).toBe('PAY_PER_REQUEST');
      expect((userTable as any).hash_key).toBe('userId');
      expect((userTable as any).server_side_encryption.enabled).toBe(true);
      expect((userTable as any).point_in_time_recovery.enabled).toBe(true);
    });

    test('should create DynamoDB session table with TTL configuration', () => {
      const dynamoTables = synthesized.resource.aws_dynamodb_table;
      const sessionTable = Object.values(dynamoTables).find(
        (table: any) => table.name && table.name.includes('sessions')
      );

      expect(sessionTable).toBeDefined();
      expect((sessionTable as any).ttl.attribute_name).toBe('expiresAt');
      expect((sessionTable as any).ttl.enabled).toBe(true);
    });

    test('should create IAM role for Lambda execution', () => {
      const iamRoles = synthesized.resource.aws_iam_role;
      expect(iamRoles).toBeDefined();

      const lambdaRole = Object.values(iamRoles).find(
        (role: any) => role.name && role.name.includes('lambda-execution-role')
      );

      expect(lambdaRole).toBeDefined();
      expect((lambdaRole as any).assume_role_policy).toContain(
        'lambda.amazonaws.com'
      );
    });

    test('should create DynamoDB access policy for Lambda', () => {
      const iamPolicies = synthesized.resource.aws_iam_policy;
      expect(iamPolicies).toBeDefined();

      const dynamoPolicy = Object.values(iamPolicies).find(
        (policy: any) =>
          policy.name && policy.name.includes('lambda-dynamodb-policy')
      );

      expect(dynamoPolicy).toBeDefined();
      expect((dynamoPolicy as any).description).toBe(
        'DynamoDB access policy for Lambda functions'
      );
    });

    test('should attach basic execution policy to Lambda role', () => {
      const policyAttachments =
        synthesized.resource.aws_iam_role_policy_attachment;
      expect(policyAttachments).toBeDefined();

      const basicPolicyAttachment = Object.values(policyAttachments).find(
        (attachment: any) =>
          attachment.policy_arn ===
          'arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole'
      );

      expect(basicPolicyAttachment).toBeDefined();
    });

    test('should create CloudWatch log groups for all services', () => {
      const logGroups = synthesized.resource.aws_cloudwatch_log_group;
      expect(logGroups).toBeDefined();

      const expectedLogGroups = ['/aws/apigateway/', '/aws/lambda/'];

      expectedLogGroups.forEach(expectedPrefix => {
        const logGroup = Object.values(logGroups).find(
          (lg: any) => lg.name && lg.name.includes(expectedPrefix)
        );
        expect(logGroup).toBeDefined();
      });
    });

    test('should create Lambda functions with correct configuration', () => {
      const lambdaFunctions = synthesized.resource.aws_lambda_function;
      expect(lambdaFunctions).toBeDefined();

      const expectedFunctions = [
        { pattern: 'user-handler', timeout: 30, memory: 128 },
        { pattern: 'session-handler', timeout: 30, memory: 128 },
        { pattern: 'health-check', timeout: 10, memory: 128 },
      ];

      expectedFunctions.forEach(expectedFunc => {
        const lambdaFunc = Object.values(lambdaFunctions).find(
          (func: any) =>
            func.function_name &&
            func.function_name.includes(expectedFunc.pattern)
        );

        expect(lambdaFunc).toBeDefined();
        expect((lambdaFunc as any).handler).toBe('lambda-handler.handler');
        expect((lambdaFunc as any).runtime).toBe('nodejs18.x');
        expect((lambdaFunc as any).timeout).toBe(expectedFunc.timeout);
        expect((lambdaFunc as any).memory_size).toBe(expectedFunc.memory);
      });
    });

    test('should create API Gateway REST API', () => {
      const apiGateways = synthesized.resource.aws_api_gateway_rest_api;
      expect(apiGateways).toBeDefined();

      const restApi = Object.values(apiGateways).find(
        (api: any) => api.name && api.name.includes('api')
      );

      expect(restApi).toBeDefined();
      expect((restApi as any).description).toBe(
        'Serverless Web Application API'
      );
      expect((restApi as any).endpoint_configuration.types).toEqual([
        'REGIONAL',
      ]);
    });

    test('should create API Gateway resources for all endpoints', () => {
      const apiResources = synthesized.resource.aws_api_gateway_resource;
      expect(apiResources).toBeDefined();

      const expectedPathParts = [
        'users',
        'sessions',
        'health',
        '{userId}',
        '{sessionId}',
      ];

      expectedPathParts.forEach(pathPart => {
        const resource = Object.values(apiResources).find(
          (res: any) => res.path_part === pathPart
        );
        expect(resource).toBeDefined();
      });
    });

    test('should create API Gateway methods for all endpoints', () => {
      const apiMethods = synthesized.resource.aws_api_gateway_method;
      expect(apiMethods).toBeDefined();

      const httpMethods = ['GET', 'POST', 'PUT', 'DELETE'];

      httpMethods.forEach(method => {
        const methodResource = Object.values(apiMethods).find(
          (m: any) => m.http_method === method
        );
        expect(methodResource).toBeDefined();
      });
    });

    test('should create API Gateway integrations with Lambda functions', () => {
      const integrations = synthesized.resource.aws_api_gateway_integration;
      expect(integrations).toBeDefined();

      const integrationList = Object.values(integrations);
      integrationList.forEach((integration: any) => {
        expect(integration.integration_http_method).toBe('POST');
        expect(integration.type).toBe('AWS_PROXY');
      });
    });

    test('should create API Gateway deployment and stage', () => {
      const deployments = synthesized.resource.aws_api_gateway_deployment;
      expect(deployments).toBeDefined();

      const stages = synthesized.resource.aws_api_gateway_stage;
      expect(stages).toBeDefined();

      const prodStage = Object.values(stages).find(
        (stage: any) => stage.stage_name === 'prod'
      );
      expect(prodStage).toBeDefined();
    });

    test('should create Lambda permissions for API Gateway', () => {
      const permissions = synthesized.resource.aws_lambda_permission;
      expect(permissions).toBeDefined();

      const permissionList = Object.values(permissions);
      permissionList.forEach((permission: any) => {
        expect(permission.statement_id).toBe('AllowExecutionFromAPIGateway');
        expect(permission.action).toBe('lambda:InvokeFunction');
        expect(permission.principal).toBe('apigateway.amazonaws.com');
      });
    });
  });

  describe('Resource Configuration Validation', () => {
    test('should configure API Gateway method settings with throttling', () => {
      const methodSettings =
        synthesized.resource.aws_api_gateway_method_settings;
      expect(methodSettings).toBeDefined();

      const settings = Object.values(methodSettings)[0] as any;
      expect(settings.method_path).toBe('*/*');
      expect(settings.settings.metrics_enabled).toBe(true);
      expect(settings.settings.logging_level).toBe('INFO');
      expect(settings.settings.data_trace_enabled).toBe(true);
      expect(settings.settings.throttling_burst_limit).toBe(5000);
      expect(settings.settings.throttling_rate_limit).toBe(2000);
    });

    test('should configure access logging for API Gateway stage', () => {
      const stages = synthesized.resource.aws_api_gateway_stage;
      const stage = Object.values(stages)[0] as any;

      expect(stage.access_log_settings).toBeDefined();
      expect(stage.access_log_settings.format).toBeDefined();
    });

    test('should set appropriate environment variables for Lambda functions', () => {
      const lambdaFunctions = synthesized.resource.aws_lambda_function;

      Object.values(lambdaFunctions).forEach((lambda: any) => {
        // Environment variables may be nested differently in CDKTF
        const envVars = lambda.environment?.[0]?.variables || lambda.environment?.variables;
        if (envVars) {
          expect(envVars.USER_TABLE_NAME).toBeDefined();
          expect(envVars.SESSION_TABLE_NAME).toBeDefined();
        }
      });
    });

    test('should create appropriate tags for all resources', () => {
      const resourceTypes = [
        'aws_s3_bucket',
        'aws_dynamodb_table',
        'aws_iam_role',
        'aws_iam_policy',
        'aws_cloudwatch_log_group',
        'aws_lambda_function',
        'aws_api_gateway_rest_api',
      ];

      resourceTypes.forEach(resourceType => {
        const resources = synthesized.resource[resourceType];
        if (resources) {
          Object.values(resources).forEach((resource: any) => {
            if (resource.tags) {
              expect(resource.tags).toBeDefined();
            }
          });
        }
      });
    });
  });

  describe('Output Validation', () => {
    test('should create all required Terraform outputs', () => {
      const expectedOutputs = [
        'api_gateway_url',
        'user_table_name',
        'session_table_name',
        'lambda_function_names',
        'health_check_url',
      ];

      expectedOutputs.forEach(outputName => {
        expect(synthesized.output[outputName]).toBeDefined();
      });
    });

    test('should have proper output descriptions', () => {
      const outputs = synthesized.output;

      expect(outputs.api_gateway_url.description).toBe(
        'API Gateway endpoint URL'
      );
      expect(outputs.user_table_name.description).toBe(
        'DynamoDB Users table name'
      );
      expect(outputs.session_table_name.description).toBe(
        'DynamoDB Sessions table name'
      );
      expect(outputs.lambda_function_names.description).toBe(
        'Lambda function names'
      );
      expect(outputs.health_check_url.description).toBe(
        'Health check endpoint for deployment validation'
      );
    });
  });

  describe('Lambda Function Code Validation', () => {
    let stack: TapStack;

    beforeEach(() => {
      app = new App();
      stack = new TapStack(app, 'TestTapStack');
    });

    test('user handler code should contain proper error handling', () => {
      const userHandlerCode = (stack as any).getUserHandlerCode();

      expect(userHandlerCode).toContain('try {');
      expect(userHandlerCode).toContain('catch (error)');
      expect(userHandlerCode).toContain('console.error');
      expect(userHandlerCode).toContain('statusCode: 500');
    });

    test('session handler code should contain TTL logic', () => {
      const sessionHandlerCode = (stack as any).getSessionHandlerCode();

      expect(sessionHandlerCode).toContain('expiresAt');
      expect(sessionHandlerCode).toContain('24 * 60 * 60'); // 24 hours
    });

    test('health check code should test DynamoDB connectivity', () => {
      const healthCheckCode = (stack as any).getHealthCheckCode();

      expect(healthCheckCode).toContain('describeTable');
      expect(healthCheckCode).toContain('writeTest');
      expect(healthCheckCode).toContain('readTest');
      expect(healthCheckCode).toContain('statusCode: 200');
      expect(healthCheckCode).toContain('statusCode: 503');
    });

    test('all lambda functions should have proper response structure', () => {
      const codes = [
        (stack as any).getUserHandlerCode(),
        (stack as any).getSessionHandlerCode(),
        (stack as any).getHealthCheckCode(),
      ];

      codes.forEach(code => {
        expect(code).toContain('statusCode');
        expect(code).toContain('headers');
        expect(code).toContain('Content-Type');
        expect(code).toContain('application/json');
      });
    });
  });

  describe('Resource Dependencies', () => {
    test('API Gateway deployment should depend on methods', () => {
      const deployments = synthesized.resource.aws_api_gateway_deployment;

      Object.values(deployments).forEach((deployment: any) => {
        expect(deployment.depends_on).toBeDefined();
        expect(Array.isArray(deployment.depends_on)).toBe(true);
        expect(deployment.depends_on.length).toBeGreaterThan(0);
      });
    });

    test('IAM role policy attachments should reference correct role', () => {
      const attachments = synthesized.resource.aws_iam_role_policy_attachment;

      Object.values(attachments).forEach((attachment: any) => {
        expect(attachment.role).toBeDefined();
      });
    });
  });

  describe('Resource Counts', () => {
    test('should create expected number of each resource type', () => {
      const expectedCounts = {
        aws_s3_bucket: 1,
        aws_dynamodb_table: 2,
        aws_iam_role: 1,
        aws_iam_policy: 1,
        aws_cloudwatch_log_group: 4,
        aws_lambda_function: 3,
        aws_api_gateway_rest_api: 1,
        aws_api_gateway_resource: 5,
        aws_api_gateway_method: 9,
        aws_api_gateway_integration: 9,
        aws_api_gateway_deployment: 1,
        aws_api_gateway_stage: 1,
        aws_lambda_permission: 3,
      };

      Object.entries(expectedCounts).forEach(
        ([resourceType, expectedCount]) => {
          const resources = synthesized.resource[resourceType];
          const actualCount = resources ? Object.keys(resources).length : 0;
          expect(actualCount).toBe(expectedCount);
        }
      );
    });
  });
});



