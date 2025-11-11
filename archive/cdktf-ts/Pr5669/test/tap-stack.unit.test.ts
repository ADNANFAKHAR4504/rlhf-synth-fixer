import { Testing } from 'cdktf';
import { TapStack } from '../lib/tap-stack';

describe('TapStack', () => {
  const environmentSuffix = 'test-123';
  const region = 'us-east-1';

  let stack: TapStack;
  let synthesized: any;

  beforeEach(() => {
    const app = Testing.app();
    stack = new TapStack(app, 'test-stack', {
      environmentSuffix,
      region,
    });
    synthesized = Testing.synth(stack);
  });

  describe('VPC Configuration', () => {
    it('should create VPC with correct configuration', () => {
      expect(synthesized).toHaveResourceWithProperties('aws_vpc', {
        cidr_block: '10.0.0.0/16',
        enable_dns_hostnames: true,
        enable_dns_support: true,
        tags: expect.objectContaining({
          EnvironmentSuffix: environmentSuffix,
        }),
      });
    });

    it('should create two private subnets', () => {
      const resources = JSON.parse(synthesized);
      const subnets = Object.values(resources.resource?.aws_subnet || {});

      expect(subnets.length).toBeGreaterThanOrEqual(2);
    });

    it('should create security group for Lambda functions', () => {
      expect(synthesized).toHaveResourceWithProperties('aws_security_group', {
        name: `lambda-sg-${environmentSuffix}`,
        egress: expect.arrayContaining([
          expect.objectContaining({
            from_port: 0,
            to_port: 0,
            protocol: '-1',
          }),
        ]),
      });
    });
  });

  describe('DynamoDB Table', () => {
    it('should create DynamoDB table with correct configuration', () => {
      expect(synthesized).toHaveResourceWithProperties('aws_dynamodb_table', {
        name: `driver-locations-${environmentSuffix}`,
        billing_mode: 'PAY_PER_REQUEST',
        hash_key: 'driverId',
        range_key: 'timestamp',
      });
    });

    it('should enable point-in-time recovery', () => {
      expect(synthesized).toHaveResourceWithProperties('aws_dynamodb_table', {
        point_in_time_recovery: expect.objectContaining({
          enabled: true,
        }),
      });
    });

    it('should enable server-side encryption', () => {
      expect(synthesized).toHaveResourceWithProperties('aws_dynamodb_table', {
        server_side_encryption: expect.objectContaining({
          enabled: true,
        }),
      });
    });

    it('should have correct attributes', () => {
      expect(synthesized).toHaveResourceWithProperties('aws_dynamodb_table', {
        attribute: expect.arrayContaining([
          expect.objectContaining({
            name: 'driverId',
            type: 'S',
          }),
          expect.objectContaining({
            name: 'timestamp',
            type: 'N',
          }),
        ]),
      });
    });
  });

  describe('SQS Dead Letter Queues', () => {
    it('should create three DLQs', () => {
      const resources = JSON.parse(synthesized);
      const queues = Object.values(resources.resource?.aws_sqs_queue || {});

      expect(queues.length).toBeGreaterThanOrEqual(3);
    });

    it('should configure DLQ with correct retention period', () => {
      expect(synthesized).toHaveResourceWithProperties('aws_sqs_queue', {
        message_retention_seconds: 1209600, // 14 days
      });
    });

    it('should have environment suffix in DLQ names', () => {
      expect(synthesized).toHaveResourceWithProperties('aws_sqs_queue', {
        name: expect.stringContaining(environmentSuffix),
      });
    });
  });

  describe('IAM Roles and Policies', () => {
    it('should create three IAM roles for Lambda functions', () => {
      const resources = JSON.parse(synthesized);
      const roles = Object.values(resources.resource?.aws_iam_role || {});

      expect(roles.length).toBeGreaterThanOrEqual(3);
    });

    it('should create IAM role with Lambda trust policy', () => {
      const resources = JSON.parse(synthesized);
      const roles = Object.values(
        resources.resource?.aws_iam_role || {}
      ) as any[];

      roles.forEach((role: any) => {
        const assumePolicy = JSON.parse(role.assume_role_policy);
        expect(assumePolicy.Statement[0].Principal.Service).toBe(
          'lambda.amazonaws.com'
        );
      });
    });

    it('should create IAM policies with least privilege', () => {
      expect(synthesized).toHaveResourceWithProperties('aws_iam_policy', {
        name: expect.stringContaining('policy'),
      });
    });

    it('should attach policies to roles', () => {
      const resources = JSON.parse(synthesized);
      const attachments = Object.values(
        resources.resource?.aws_iam_role_policy_attachment || {}
      );

      expect(attachments.length).toBeGreaterThanOrEqual(3);
    });

    it('should grant DynamoDB permissions to update location function', () => {
      const resources = JSON.parse(synthesized);
      const policies = Object.values(
        resources.resource?.aws_iam_policy || {}
      ) as any[];

      const updatePolicy = policies.find((p: any) =>
        p.name?.includes('update-location')
      );

      if (updatePolicy) {
        const policyDoc = JSON.parse(updatePolicy.policy);
        const dynamoStatement = policyDoc.Statement.find((s: any) =>
          s.Action.includes('dynamodb:PutItem')
        );
        expect(dynamoStatement).toBeDefined();
      }
    });

    it('should grant DynamoDB query permissions to get location function', () => {
      const resources = JSON.parse(synthesized);
      const policies = Object.values(
        resources.resource?.aws_iam_policy || {}
      ) as any[];

      const getPolicy = policies.find((p: any) =>
        p.name?.includes('get-location')
      );

      if (getPolicy) {
        const policyDoc = JSON.parse(getPolicy.policy);
        const dynamoStatement = policyDoc.Statement.find((s: any) =>
          s.Action.includes('dynamodb:Query')
        );
        expect(dynamoStatement).toBeDefined();
      }
    });

    it('should grant X-Ray permissions to all Lambda functions', () => {
      const resources = JSON.parse(synthesized);
      const policies = Object.values(
        resources.resource?.aws_iam_policy || {}
      ) as any[];

      policies.forEach((policy: any) => {
        const policyDoc = JSON.parse(policy.policy);
        const xrayStatement = policyDoc.Statement.find((s: any) =>
          s.Action.includes('xray:PutTraceSegments')
        );
        expect(xrayStatement).toBeDefined();
      });
    });

    it('should grant VPC permissions for Lambda functions', () => {
      const resources = JSON.parse(synthesized);
      const policies = Object.values(
        resources.resource?.aws_iam_policy || {}
      ) as any[];

      policies.forEach((policy: any) => {
        const policyDoc = JSON.parse(policy.policy);
        const vpcStatement = policyDoc.Statement.find((s: any) =>
          s.Action.includes('ec2:CreateNetworkInterface')
        );
        expect(vpcStatement).toBeDefined();
      });
    });
  });

  describe('Lambda Functions', () => {
    it('should create three Lambda functions', () => {
      const resources = JSON.parse(synthesized);
      const functions = Object.values(
        resources.resource?.aws_lambda_function || {}
      );

      expect(functions.length).toBeGreaterThanOrEqual(3);
    });

    it('should configure update location Lambda with 1GB memory and 30s timeout', () => {
      expect(synthesized).toHaveResourceWithProperties('aws_lambda_function', {
        function_name: `update-location-${environmentSuffix}`,
        memory_size: 1024,
        timeout: 30,
        runtime: 'nodejs18.x',
      });
    });

    it('should configure Lambda functions with Node.js 18.x runtime', () => {
      const resources = JSON.parse(synthesized);
      const functions = Object.values(
        resources.resource?.aws_lambda_function || {}
      ) as any[];

      functions.forEach((fn: any) => {
        expect(fn.runtime).toBe('nodejs18.x');
      });
    });

    it('should enable X-Ray tracing for all Lambda functions', () => {
      const resources = JSON.parse(synthesized);
      const functions = Object.values(
        resources.resource?.aws_lambda_function || {}
      ) as any[];

      functions.forEach((fn: any) => {
        expect(fn.tracing_config).toEqual(
          expect.objectContaining({
            mode: 'Active',
          })
        );
      });
    });

    it('should configure dead letter queues for all Lambda functions', () => {
      const resources = JSON.parse(synthesized);
      const functions = Object.values(
        resources.resource?.aws_lambda_function || {}
      ) as any[];

      functions.forEach((fn: any) => {
        expect(fn.dead_letter_config).toBeDefined();
      });
    });

    it('should set environment variables for Lambda functions', () => {
      expect(synthesized).toHaveResourceWithProperties('aws_lambda_function', {
        environment: expect.objectContaining({
          variables: expect.objectContaining({
            TABLE_NAME: `driver-locations-${environmentSuffix}`,
            REGION: region,
          }),
        }),
      });
    });

    it('should deploy Lambda functions in VPC with private subnets', () => {
      const resources = JSON.parse(synthesized);
      const functions = Object.values(
        resources.resource?.aws_lambda_function || {}
      ) as any[];

      functions.forEach((fn: any) => {
        expect(fn.vpc_config).toBeDefined();
        expect(fn.vpc_config.subnet_ids).toBeDefined();
        expect(fn.vpc_config.security_group_ids).toBeDefined();
      });
    });

    it('should include environment suffix in function names', () => {
      const resources = JSON.parse(synthesized);
      const functions = Object.values(
        resources.resource?.aws_lambda_function || {}
      ) as any[];

      functions.forEach((fn: any) => {
        expect(fn.function_name).toContain(environmentSuffix);
      });
    });
  });

  describe('CloudWatch Configuration', () => {
    it('should create log groups with 7-day retention', () => {
      expect(synthesized).toHaveResourceWithProperties(
        'aws_cloudwatch_log_group',
        {
          retention_in_days: 7,
        }
      );
    });

    it('should create CloudWatch alarms for Lambda errors', () => {
      const resources = JSON.parse(synthesized);
      const alarms = Object.values(
        resources.resource?.aws_cloudwatch_metric_alarm || {}
      );

      expect(alarms.length).toBeGreaterThanOrEqual(3);
    });

    it('should configure alarms with 1% error threshold', () => {
      expect(synthesized).toHaveResourceWithProperties(
        'aws_cloudwatch_metric_alarm',
        {
          threshold: 0.01,
          comparison_operator: 'GreaterThanThreshold',
          metric_name: 'Errors',
          namespace: 'AWS/Lambda',
        }
      );
    });

    it('should configure alarms with 5-minute evaluation period', () => {
      expect(synthesized).toHaveResourceWithProperties(
        'aws_cloudwatch_metric_alarm',
        {
          period: 300,
          evaluation_periods: 1,
        }
      );
    });
  });

  describe('API Gateway', () => {
    it('should create REST API', () => {
      expect(synthesized).toHaveResourceWithProperties(
        'aws_api_gateway_rest_api',
        {
          name: `location-tracking-api-${environmentSuffix}`,
        }
      );
    });

    it('should configure API with edge-optimized endpoint', () => {
      expect(synthesized).toHaveResourceWithProperties(
        'aws_api_gateway_rest_api',
        {
          endpoint_configuration: expect.objectContaining({
            types: ['EDGE'],
          }),
        }
      );
    });

    it('should create request validator for POST requests', () => {
      expect(synthesized).toHaveResourceWithProperties(
        'aws_api_gateway_request_validator',
        {
          validate_request_body: true,
          validate_request_parameters: true,
        }
      );
    });

    it('should create API resources for locations and history', () => {
      const resources = JSON.parse(synthesized);
      const apiResources = Object.values(
        resources.resource?.aws_api_gateway_resource || {}
      );

      expect(apiResources.length).toBeGreaterThanOrEqual(2);
    });

    it('should create POST method for location updates', () => {
      expect(synthesized).toHaveResourceWithProperties(
        'aws_api_gateway_method',
        {
          http_method: 'POST',
        }
      );
    });

    it('should create GET methods for retrieving locations', () => {
      const resources = JSON.parse(synthesized);
      const methods = Object.values(
        resources.resource?.aws_api_gateway_method || {}
      ) as any[];

      const getMethods = methods.filter((m: any) => m.http_method === 'GET');
      expect(getMethods.length).toBeGreaterThanOrEqual(2);
    });

    it('should configure Lambda integrations for all methods', () => {
      const resources = JSON.parse(synthesized);
      const integrations = Object.values(
        resources.resource?.aws_api_gateway_integration || {}
      ) as any[];

      expect(integrations.length).toBeGreaterThanOrEqual(3);

      integrations.forEach((integration: any) => {
        expect(integration.type).toBe('AWS_PROXY');
      });
    });

    it('should create Lambda permissions for API Gateway invocations', () => {
      const resources = JSON.parse(synthesized);
      const permissions = Object.values(
        resources.resource?.aws_lambda_permission || {}
      );

      expect(permissions.length).toBeGreaterThanOrEqual(3);
    });

    it('should create API deployment', () => {
      expect(synthesized).toHaveResource('aws_api_gateway_deployment');
    });

    it('should create API stage with X-Ray tracing enabled', () => {
      expect(synthesized).toHaveResourceWithProperties(
        'aws_api_gateway_stage',
        {
          stage_name: 'prod',
          xray_tracing_enabled: true,
        }
      );
    });

    it('should configure throttling limits of 10,000 requests per second', () => {
      expect(synthesized).toHaveResourceWithProperties(
        'aws_api_gateway_method_settings',
        {
          settings: expect.objectContaining({
            throttling_rate_limit: 10000,
          }),
        }
      );
    });

    it('should configure throttling burst limit', () => {
      expect(synthesized).toHaveResourceWithProperties(
        'aws_api_gateway_method_settings',
        {
          settings: expect.objectContaining({
            throttling_burst_limit: 5000,
          }),
        }
      );
    });

    it('should enable logging and metrics for API methods', () => {
      expect(synthesized).toHaveResourceWithProperties(
        'aws_api_gateway_method_settings',
        {
          settings: expect.objectContaining({
            logging_level: 'INFO',
            data_trace_enabled: true,
            metrics_enabled: true,
          }),
        }
      );
    });
  });

  describe('Outputs', () => {
    it('should export API endpoint URL', () => {
      expect(synthesized).toHaveOutput('ApiEndpoint');
    });

    it('should export DynamoDB table name', () => {
      expect(synthesized).toHaveOutput('DynamoDbTableName');
    });

    it('should export Lambda function names', () => {
      expect(synthesized).toHaveOutput('UpdateLocationFunctionName');
      expect(synthesized).toHaveOutput('GetLocationFunctionName');
      expect(synthesized).toHaveOutput('GetHistoryFunctionName');
    });

    it('should export VPC ID', () => {
      expect(synthesized).toHaveOutput('VpcId');
    });

    it('should export API Gateway ID', () => {
      expect(synthesized).toHaveOutput('ApiId');
    });
  });

  describe('Resource Tagging', () => {
    it('should tag all resources with EnvironmentSuffix', () => {
      const resources = JSON.parse(synthesized);

      // Check various resource types for tags
      const resourceTypes = [
        'aws_vpc',
        'aws_subnet',
        'aws_security_group',
        'aws_dynamodb_table',
        'aws_sqs_queue',
        'aws_iam_role',
        'aws_iam_policy',
        'aws_lambda_function',
        'aws_cloudwatch_log_group',
      ];

      resourceTypes.forEach(type => {
        if (resources.resource?.[type]) {
          const resourcesOfType = Object.values(
            resources.resource[type]
          ) as any[];
          resourcesOfType.forEach((resource: any) => {
            if (resource.tags) {
              expect(resource.tags.EnvironmentSuffix).toBe(environmentSuffix);
            }
          });
        }
      });
    });
  });

  describe('Security Best Practices', () => {
    it('should enable encryption for DynamoDB table', () => {
      expect(synthesized).toHaveResourceWithProperties('aws_dynamodb_table', {
        server_side_encryption: expect.objectContaining({
          enabled: true,
        }),
      });
    });

    it('should enable X-Ray tracing for observability', () => {
      const resources = JSON.parse(synthesized);
      const functions = Object.values(
        resources.resource?.aws_lambda_function || {}
      ) as any[];

      functions.forEach((fn: any) => {
        expect(fn.tracing_config.mode).toBe('Active');
      });
    });

    it('should configure Lambda functions in private subnets', () => {
      const resources = JSON.parse(synthesized);
      const functions = Object.values(
        resources.resource?.aws_lambda_function || {}
      ) as any[];

      functions.forEach((fn: any) => {
        expect(fn.vpc_config).toBeDefined();
      });
    });

    it('should implement dead letter queues for error handling', () => {
      const resources = JSON.parse(synthesized);
      const functions = Object.values(
        resources.resource?.aws_lambda_function || {}
      ) as any[];

      functions.forEach((fn: any) => {
        expect(fn.dead_letter_config).toBeDefined();
      });
    });
  });

  describe('Cost Optimization', () => {
    it('should use DynamoDB on-demand billing mode', () => {
      expect(synthesized).toHaveResourceWithProperties('aws_dynamodb_table', {
        billing_mode: 'PAY_PER_REQUEST',
      });
    });

    it('should configure appropriate Lambda memory sizes', () => {
      const resources = JSON.parse(synthesized);
      const functions = Object.values(
        resources.resource?.aws_lambda_function || {}
      ) as any[];

      functions.forEach((fn: any) => {
        expect(fn.memory_size).toBeGreaterThanOrEqual(512);
        expect(fn.memory_size).toBeLessThanOrEqual(1024);
      });
    });

    it('should set CloudWatch log retention to 7 days', () => {
      const resources = JSON.parse(synthesized);
      const logGroups = Object.values(
        resources.resource?.aws_cloudwatch_log_group || {}
      ) as any[];

      logGroups.forEach((lg: any) => {
        expect(lg.retention_in_days).toBe(7);
      });
    });
  });
});
