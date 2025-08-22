import { App, Testing } from 'cdktf';
import { TapStack } from '../lib/tap-stack';

describe('TapStack Integration Tests', () => {
  let app: App;
  let stack: TapStack;
  let synthesized: any;

  beforeAll(() => {
    // Set longer timeout for integration tests
    jest.setTimeout(30000);
  });

  beforeEach(() => {
    app = new App();
    jest.clearAllMocks();
  });

  describe('Infrastructure Synthesis Integration', () => {
    test('Stack synthesizes without errors with default configuration', () => {
      stack = new TapStack(app, 'IntegrationTestStack');

      expect(() => {
        synthesized = JSON.parse(Testing.synth(stack));
      }).not.toThrow();

      expect(synthesized).toBeDefined();
      expect(typeof synthesized).toBe('object');
    });

    test('Stack synthesizes without errors with custom configuration', () => {
      stack = new TapStack(app, 'IntegrationTestStackCustom', {
        environmentSuffix: 'integration-test',
        awsRegion: 'us-west-2',
        defaultTags: {
          tags: {
            IntegrationTest: 'true',
            TestSuite: 'CDKTFIntegration',
          },
        },
      });

      expect(() => {
        synthesized = JSON.parse(Testing.synth(stack));
      }).not.toThrow();

      expect(synthesized).toBeDefined();
      expect(synthesized.provider.aws[0].region).toBe('us-west-2');
    });

    test('Multiple stack instances can be synthesized simultaneously', () => {
      const stack1 = new TapStack(app, 'MultiTestStack1');
      const stack2 = new TapStack(app, 'MultiTestStack2');

      const synthesized1 = JSON.parse(Testing.synth(stack1));
      const synthesized2 = JSON.parse(Testing.synth(stack2));

      expect(synthesized1).toBeDefined();
      expect(synthesized2).toBeDefined();

      // Verify both stacks have unique Lambda bucket names
      const bucket1 =
        synthesized1.resource.aws_s3_bucket['lambda-deployment-bucket'];
      const bucket2 =
        synthesized2.resource.aws_s3_bucket['lambda-deployment-bucket'];
      expect(bucket1.bucket).not.toBe(bucket2.bucket);
    });
  });

  describe('AWS Resource Dependencies Integration', () => {
    beforeEach(() => {
      stack = new TapStack(app, 'DependencyTestStack');
      synthesized = JSON.parse(Testing.synth(stack));
    });

    test('Lambda functions depend on S3 objects', () => {
      const userFunction =
        synthesized.resource.aws_lambda_function['user-handler-function'];
      const sessionFunction =
        synthesized.resource.aws_lambda_function['session-handler-function'];
      const healthFunction =
        synthesized.resource.aws_lambda_function['health-check-function'];

      expect(userFunction.depends_on).toContain(
        'aws_s3_object.user-handler-s3'
      );
      expect(sessionFunction.depends_on).toContain(
        'aws_s3_object.session-handler-s3'
      );
      expect(healthFunction.depends_on).toContain(
        'aws_s3_object.health-check-s3'
      );
    });

    test('API Gateway deployment depends on integrations', () => {
      const deployment =
        synthesized.resource.aws_api_gateway_deployment['api-deployment'];

      expect(deployment.depends_on).toEqual(
        expect.arrayContaining([
          'aws_api_gateway_integration.user-integration',
          'aws_api_gateway_integration.user-post-integration',
          'aws_api_gateway_integration.user-id-get-integration',
          'aws_api_gateway_integration.user-id-put-integration',
          'aws_api_gateway_integration.user-id-delete-integration',
          'aws_api_gateway_integration.session-integration',
          'aws_api_gateway_integration.session-post-integration',
          'aws_api_gateway_integration.session-id-get-integration',
          'aws_api_gateway_integration.session-id-delete-integration',
          'aws_api_gateway_integration.health-integration',
        ])
      );
    });

    test('IAM role policy attachments reference correct role', () => {
      const basicExecution =
        synthesized.resource.aws_iam_role_policy_attachment[
          'lambda-basic-execution-policy'
        ];
      const dynamoAttachment =
        synthesized.resource.aws_iam_role_policy_attachment[
          'lambda-dynamodb-policy-attachment'
        ];

      expect(basicExecution.role).toBe(
        '${aws_iam_role.lambda-execution-role.name}'
      );
      expect(dynamoAttachment.role).toBe(
        '${aws_iam_role.lambda-execution-role.name}'
      );
    });

    test('S3 bucket has security configurations', () => {
      const bucket =
        synthesized.resource.aws_s3_bucket['lambda-deployment-bucket'];
      const bucketPAB =
        synthesized.resource.aws_s3_bucket_public_access_block[
          'lambda-bucket-pab'
        ];
      const bucketEncryption =
        synthesized.resource.aws_s3_bucket_server_side_encryption_configuration[
          'lambda-bucket-encryption'
        ];

      expect(bucket).toBeDefined();
      expect(bucketPAB).toBeDefined();
      expect(bucketEncryption).toBeDefined();
      expect(bucketPAB.block_public_acls).toBe(true);
      expect(bucketPAB.block_public_policy).toBe(true);
      expect(bucketPAB.ignore_public_acls).toBe(true);
      expect(bucketPAB.restrict_public_buckets).toBe(true);
    });
  });

  describe('AWS Resource Configuration Validation', () => {
    beforeEach(() => {
      stack = new TapStack(app, 'ConfigTestStack');
      synthesized = JSON.parse(Testing.synth(stack));
    });

    test('DynamoDB tables have correct configuration', () => {
      const userTable =
        synthesized.resource.aws_dynamodb_table['prod-service-user-table'];
      const sessionTable =
        synthesized.resource.aws_dynamodb_table['prod-service-session-table'];

  expect(userTable.name.startsWith('prod-service-users')).toBe(true);
      expect(userTable.hash_key).toBe('userId');
      expect(userTable.billing_mode).toBe('PAY_PER_REQUEST');
      expect(userTable.server_side_encryption.enabled).toBe(true);
      expect(userTable.point_in_time_recovery.enabled).toBe(true);

  expect(sessionTable.name.startsWith('prod-service-sessions')).toBe(true);
      expect(sessionTable.hash_key).toBe('sessionId');
      expect(sessionTable.ttl.enabled).toBe(true);
      expect(sessionTable.ttl.attribute_name).toBe('expiresAt');
    });

    test('Lambda functions have correct environment variables', () => {
      const userFunction =
        synthesized.resource.aws_lambda_function['user-handler-function'];
      const sessionFunction =
        synthesized.resource.aws_lambda_function['session-handler-function'];
      const healthFunction =
        synthesized.resource.aws_lambda_function['health-check-function'];

      [userFunction, sessionFunction, healthFunction].forEach(func => {
        expect(func.environment.variables.USER_TABLE_NAME).toBe(
          '${aws_dynamodb_table.prod-service-user-table.name}'
        );
        expect(func.environment.variables.SESSION_TABLE_NAME).toBe(
          '${aws_dynamodb_table.prod-service-session-table.name}'
        );
      });
    });

    test('IAM policy has correct DynamoDB permissions', () => {
      const dynamoPolicy =
        synthesized.resource.aws_iam_policy['lambda-dynamodb-policy'];
      const policyDocument = JSON.parse(dynamoPolicy.policy);

      expect(policyDocument.Version).toBe('2012-10-17');
      expect(policyDocument.Statement).toHaveLength(1);

      const statement = policyDocument.Statement[0];
      expect(statement.Effect).toBe('Allow');
      expect(statement.Action).toEqual([
        'dynamodb:GetItem',
        'dynamodb:PutItem',
        'dynamodb:UpdateItem',
        'dynamodb:DeleteItem',
        'dynamodb:Query',
        'dynamodb:Scan',
      ]);
      expect(statement.Resource).toEqual([
        '${aws_dynamodb_table.prod-service-user-table.arn}',
        '${aws_dynamodb_table.prod-service-session-table.arn}',
        '${aws_dynamodb_table.prod-service-user-table.arn}/index/*',
        '${aws_dynamodb_table.prod-service-session-table.arn}/index/*',
      ]);
    });

    test('API Gateway has correct configuration', () => {
      const restApi =
        synthesized.resource.aws_api_gateway_rest_api['service-api'];
      const stage = synthesized.resource.aws_api_gateway_stage['api-stage'];
      const methodSettings =
        synthesized.resource.aws_api_gateway_method_settings[
          'api-method-settings'
        ];

  expect(restApi.name.startsWith('prod-service-api')).toBe(true);
      expect(restApi.description).toBe('Serverless Web Application API');
      expect(restApi.endpoint_configuration.types).toEqual(['REGIONAL']);

      expect(stage.stage_name).toBe('prod');
      expect(stage.access_log_settings).toBeDefined();

      expect(methodSettings.method_path).toBe('*/*');
      expect(methodSettings.settings.metrics_enabled).toBe(true);
      expect(methodSettings.settings.logging_level).toBe('INFO');
    });
  });

  describe('Security and Compliance Integration', () => {
    beforeEach(() => {
      stack = new TapStack(app, 'SecurityTestStack');
      synthesized = JSON.parse(Testing.synth(stack));
    });

    test('S3 bucket has security configurations enabled', () => {
      const bucket =
        synthesized.resource.aws_s3_bucket['lambda-deployment-bucket'];
      const bucketPAB =
        synthesized.resource.aws_s3_bucket_public_access_block[
          'lambda-bucket-pab'
        ];
      const bucketEncryption =
        synthesized.resource.aws_s3_bucket_server_side_encryption_configuration[
          'lambda-bucket-encryption'
        ];

      expect(bucket).toBeDefined();
      expect(bucketPAB.block_public_acls).toBe(true);
      expect(bucketPAB.block_public_policy).toBe(true);
      expect(bucketPAB.ignore_public_acls).toBe(true);
      expect(bucketPAB.restrict_public_buckets).toBe(true);

      expect(
        bucketEncryption.rule[0].apply_server_side_encryption_by_default
          .sse_algorithm
      ).toBe('AES256');
    });

    test('DynamoDB tables have encryption enabled', () => {
      const userTable =
        synthesized.resource.aws_dynamodb_table['prod-service-user-table'];
      const sessionTable =
        synthesized.resource.aws_dynamodb_table['prod-service-session-table'];

      expect(userTable.server_side_encryption.enabled).toBe(true);
      expect(sessionTable.server_side_encryption.enabled).toBe(true);
    });

    test('CloudWatch logs have appropriate retention', () => {
      const apiLogGroup =
        synthesized.resource.aws_cloudwatch_log_group['api-gateway-log-group'];
      const userLogGroup =
        synthesized.resource.aws_cloudwatch_log_group['user-handler-log-group'];
      const sessionLogGroup =
        synthesized.resource.aws_cloudwatch_log_group[
          'session-handler-log-group'
        ];
      const healthLogGroup =
        synthesized.resource.aws_cloudwatch_log_group['health-check-log-group'];

      [apiLogGroup, userLogGroup, sessionLogGroup, healthLogGroup].forEach(
        logGroup => {
          expect(logGroup.retention_in_days).toBe(14);
        }
      );
    });
  });

  describe('Resource Count and Performance Tests', () => {
    test('Stack maintains resource count consistency', () => {
      stack = new TapStack(app, 'ResourceCountStack');
      synthesized = JSON.parse(Testing.synth(stack));

      // Specific counts for serverless stack
      expect(
        Object.keys(synthesized.resource.aws_lambda_function)
      ).toHaveLength(3);
      expect(Object.keys(synthesized.resource.aws_dynamodb_table)).toHaveLength(
        2
      );
      expect(
        Object.keys(synthesized.resource.aws_api_gateway_method)
      ).toHaveLength(10);
      expect(
        Object.keys(synthesized.resource.aws_api_gateway_integration)
      ).toHaveLength(10);
    });

    test('Large scale synthesis completes within reasonable time', () => {
      const startTime = Date.now();

      // Create multiple stacks to test performance
      for (let i = 0; i < 5; i++) {
        const stack = new TapStack(app, `PerformanceTestStack${i}`);
        JSON.parse(Testing.synth(stack));
      }

      const endTime = Date.now();
      const duration = endTime - startTime;

      // Should complete within 10 seconds for 5 stacks
      expect(duration).toBeLessThan(10000);
    });
  });

  describe('Output and Configuration Validation', () => {
    test('All outputs reference valid resources', () => {
      stack = new TapStack(app, 'OutputTestStack');
      synthesized = JSON.parse(Testing.synth(stack));

      const outputs = synthesized.output;

      expect(outputs.api_gateway_url.value).toContain(
        '${aws_api_gateway_rest_api.service-api.id}'
      );
      expect(outputs.user_table_name.value).toBe(
        '${aws_dynamodb_table.prod-service-user-table.name}'
      );
      expect(outputs.session_table_name.value).toBe(
        '${aws_dynamodb_table.prod-service-session-table.name}'
      );
      expect(outputs.health_check_url.value).toContain(
        '${aws_api_gateway_rest_api.service-api.id}'
      );
    });

    test('Terraform configuration structure is valid', () => {
      stack = new TapStack(app, 'StructureTestStack');
      synthesized = JSON.parse(Testing.synth(stack));

      expect(synthesized.provider).toBeDefined();
      expect(synthesized.resource).toBeDefined();
      expect(synthesized.data).toBeDefined();
      expect(synthesized.output).toBeDefined();

      expect(synthesized.provider.aws).toHaveLength(1);
      expect(synthesized.provider.archive).toHaveLength(1);
    });
  });

  describe('Serverless Pattern Validation', () => {
    beforeEach(() => {
      stack = new TapStack(app, 'APIIntegrationTestStack');
      synthesized = JSON.parse(Testing.synth(stack));
    });

    test('Infrastructure supports serverless API pattern', () => {
      // Verify API Gateway is configured for serverless pattern
      const restApi =
        synthesized.resource.aws_api_gateway_rest_api['service-api'];
      const stage = synthesized.resource.aws_api_gateway_stage['api-stage'];

      expect(restApi.endpoint_configuration.types).toEqual(['REGIONAL']);
      expect(stage.stage_name).toBe('prod');

      // Verify all required API endpoints exist
      const resources = synthesized.resource.aws_api_gateway_resource;
      expect(resources['users-resource']).toBeDefined();
      expect(resources['sessions-resource']).toBeDefined();
      expect(resources['health-resource']).toBeDefined();
    });

    test('Infrastructure supports monitoring and health checking', () => {
      // Verify health check endpoint and function exist
      const healthFunction =
        synthesized.resource.aws_lambda_function['health-check-function'];
      const healthMethod =
        synthesized.resource.aws_api_gateway_method['health-get-method'];

      expect(healthFunction).toBeDefined();
      expect(healthMethod.http_method).toBe('GET');

      // Verify CloudWatch log groups for monitoring
      const logGroups = synthesized.resource.aws_cloudwatch_log_group;
      expect(Object.keys(logGroups)).toHaveLength(4);
    });

    test('Infrastructure supports secure data storage patterns', () => {
      // Verify DynamoDB tables have encryption
      const userTable =
        synthesized.resource.aws_dynamodb_table['prod-service-user-table'];
      const sessionTable =
        synthesized.resource.aws_dynamodb_table['prod-service-session-table'];

      expect(userTable.server_side_encryption.enabled).toBe(true);
      expect(sessionTable.server_side_encryption.enabled).toBe(true);

      // Verify S3 bucket encryption
      const bucketEncryption =
        synthesized.resource.aws_s3_bucket_server_side_encryption_configuration[
          'lambda-bucket-encryption'
        ];
      expect(
        bucketEncryption.rule[0].apply_server_side_encryption_by_default
          .sse_algorithm
      ).toBe('AES256');
    });
  });
});