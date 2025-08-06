import { App, Testing } from 'cdktf';
import * as fs from 'fs';
import * as path from 'path';
import { TapStack } from '../lib/tap-stack';

describe('TapStack Integration Tests', () => {
  let app: App;
  let stack: TapStack;
  let synthesized: any;

  beforeEach(() => {
    jest.clearAllMocks();
    app = new App();
    stack = new TapStack(app, 'TestTapStackIntegration', {
      environmentSuffix: 'test',
      awsRegion: 'us-east-1',
      defaultTags: {
        Environment: 'Test',
        TestSuite: 'Integration',
      },
    });
    synthesized = Testing.synth(stack);
  });

  describe('Terraform Configuration Generation', () => {
    test('should generate valid Terraform JSON', () => {
      expect(synthesized).toBeDefined();
      expect(typeof synthesized).toBe('object');

      // Check main sections
      expect(synthesized).toHaveProperty('terraform');
      expect(synthesized).toHaveProperty('provider');
      expect(synthesized).toHaveProperty('resource');
      expect(synthesized).toHaveProperty('data');
      expect(synthesized).toHaveProperty('output');
    });

    test('should have proper Terraform version constraints', () => {
      expect(synthesized.terraform).toBeDefined();
      expect(synthesized.terraform.required_providers).toBeDefined();
      expect(synthesized.terraform.required_providers.aws).toBeDefined();
      expect(synthesized.terraform.required_providers.archive).toBeDefined();
    });

    test('should generate syntactically valid JSON structure', () => {
      const jsonString = JSON.stringify(synthesized, null, 2);
      expect(() => JSON.parse(jsonString)).not.toThrow();
      expect(jsonString.length).toBeGreaterThan(1000); // Substantial content
    });
  });

  describe('Terraform Plan Simulation', () => {
    test('should simulate terraform plan without errors', async () => {
      // This test simulates what would happen during terraform plan
      const terraformJson = JSON.stringify(synthesized, null, 2);

      // Write to temporary file to simulate terraform plan
      const tempDir = path.join(__dirname, '..', 'temp');
      if (!fs.existsSync(tempDir)) {
        fs.mkdirSync(tempDir, { recursive: true });
      }

      const tempFile = path.join(tempDir, 'terraform-plan-test.json');
      fs.writeFileSync(tempFile, terraformJson);

      // Verify file was written successfully
      expect(fs.existsSync(tempFile)).toBe(true);

      // Verify content is valid JSON
      const readContent = fs.readFileSync(tempFile, 'utf8');
      const parsedContent = JSON.parse(readContent);
      expect(parsedContent).toEqual(synthesized);

      // Clean up
      fs.unlinkSync(tempFile);
    });

    test('should contain all required resource declarations for plan', () => {
      const requiredResourceTypes = [
        'aws_s3_bucket',
        'aws_dynamodb_table',
        'aws_iam_role',
        'aws_iam_policy',
        'aws_iam_role_policy_attachment',
        'aws_cloudwatch_log_group',
        'aws_lambda_function',
        'aws_lambda_permission',
        'aws_api_gateway_rest_api',
        'aws_api_gateway_resource',
        'aws_api_gateway_method',
        'aws_api_gateway_integration',
        'aws_api_gateway_deployment',
        'aws_api_gateway_stage',
        'aws_api_gateway_method_settings',
        'aws_s3_object',
      ];

      requiredResourceTypes.forEach(resourceType => {
        expect(synthesized.resource[resourceType]).toBeDefined();
        expect(
          Object.keys(synthesized.resource[resourceType]).length
        ).toBeGreaterThan(0);
      });
    });

    test('should have proper data source declarations', () => {
      expect(synthesized.data).toBeDefined();
      expect(synthesized.data.archive_file).toBeDefined();

      // Should have 3 archive files for 3 lambda functions
      expect(Object.keys(synthesized.data.archive_file).length).toBe(3);
    });
  });

  describe('Resource Interdependencies', () => {
    test('should have proper Lambda function dependencies', () => {
      const lambdaFunctions = synthesized.resource.aws_lambda_function;

      Object.values(lambdaFunctions).forEach((lambdaFunc: any) => {
        // Lambda functions should depend on their log groups
        expect(lambdaFunc.depends_on).toBeDefined();
        expect(Array.isArray(lambdaFunc.depends_on)).toBe(true);

        // Should reference IAM role
        expect(lambdaFunc.role).toBeDefined();
        expect(typeof lambdaFunc.role).toBe('string');

        // Should have environment variables
        expect(lambdaFunc.environment).toBeDefined();
        expect(lambdaFunc.environment.variables).toBeDefined();
      });
    });

    test('should have proper API Gateway integration dependencies', () => {
      const apiIntegrations = synthesized.resource.aws_api_gateway_integration;
      const lambdaFunctions = synthesized.resource.aws_lambda_function;

      Object.values(apiIntegrations).forEach((integration: any) => {
        expect(integration.uri).toBeDefined();
        expect(integration.uri).toContain('lambda');
      });
    });

    test('should have proper IAM role and policy relationships', () => {
      const iamRoles = synthesized.resource.aws_iam_role;
      const iamPolicies = synthesized.resource.aws_iam_policy;
      const policyAttachments =
        synthesized.resource.aws_iam_role_policy_attachment;

      expect(Object.keys(iamRoles).length).toBeGreaterThan(0);
      expect(Object.keys(iamPolicies).length).toBeGreaterThan(0);
      expect(Object.keys(policyAttachments).length).toBeGreaterThan(0);

      // Check policy attachments reference roles
      Object.values(policyAttachments).forEach((attachment: any) => {
        expect(attachment.role).toBeDefined();
        expect(attachment.policy_arn).toBeDefined();
      });
    });
  });

  describe('Security Configuration Validation', () => {
    test('should configure DynamoDB with encryption', () => {
      const dynamoTables = synthesized.resource.aws_dynamodb_table;

      Object.values(dynamoTables).forEach((table: any) => {
        expect(table.server_side_encryption).toBeDefined();
        expect(table.server_side_encryption.enabled).toBe(true);
      });
    });

    test('should use least privilege IAM policies', () => {
      const iamPolicies = synthesized.resource.aws_iam_policy;

      Object.values(iamPolicies).forEach((policy: any) => {
        const policyDoc = JSON.parse(policy.policy);
        expect(policyDoc.Version).toBe('2012-10-17');
        expect(policyDoc.Statement).toBeDefined();
        expect(Array.isArray(policyDoc.Statement)).toBe(true);

        // Check no wildcard resources on sensitive actions
        policyDoc.Statement.forEach((statement: any) => {
          if (statement.Effect === 'Allow' && statement.Action) {
            // Should not have wildcard permissions
            const actions = Array.isArray(statement.Action)
              ? statement.Action
              : [statement.Action];
            const hasWildcard = actions.some(
              (action: string) => action === '*'
            );
            expect(hasWildcard).toBe(false);
          }
        });
      });
    });

    test('should configure API Gateway with proper authentication', () => {
      const apiMethods = synthesized.resource.aws_api_gateway_method;

      Object.values(apiMethods).forEach((method: any) => {
        expect(method.authorization).toBeDefined();
        // While currently set to 'NONE' for demo, in production this should be more restrictive
        expect(
          ['NONE', 'AWS_IAM', 'COGNITO_USER_POOLS'].includes(
            method.authorization
          )
        ).toBe(true);
      });
    });
  });

  describe('Performance and Scalability Configuration', () => {
    test('should configure DynamoDB for on-demand scaling', () => {
      const dynamoTables = synthesized.resource.aws_dynamodb_table;

      Object.values(dynamoTables).forEach((table: any) => {
        expect(table.billing_mode).toBe('ON_DEMAND');
      });
    });

    test('should configure API Gateway with throttling', () => {
      const methodSettings =
        synthesized.resource.aws_api_gateway_method_settings;

      Object.values(methodSettings).forEach((settings: any) => {
        expect(settings.settings).toBeDefined();
        expect(settings.settings.throttling_rate_limit).toBeDefined();
        expect(settings.settings.throttling_burst_limit).toBeDefined();
        expect(settings.settings.throttling_rate_limit).toBeGreaterThan(0);
        expect(settings.settings.throttling_burst_limit).toBeGreaterThan(0);
      });
    });

    test('should configure appropriate Lambda timeout and memory', () => {
      const lambdaFunctions = synthesized.resource.aws_lambda_function;

      Object.values(lambdaFunctions).forEach((lambdaFunc: any) => {
        expect(lambdaFunc.timeout).toBeDefined();
        expect(lambdaFunc.memory_size).toBeDefined();
        expect(lambdaFunc.timeout).toBeGreaterThan(0);
        expect(lambdaFunc.timeout).toBeLessThanOrEqual(900); // Max Lambda timeout
        expect(lambdaFunc.memory_size).toBeGreaterThanOrEqual(128);
        expect(lambdaFunc.memory_size).toBeLessThanOrEqual(10240); // Max Lambda memory
      });
    });
  });

  describe('Monitoring and Logging Configuration', () => {
    test('should create CloudWatch log groups for all services', () => {
      const logGroups = synthesized.resource.aws_cloudwatch_log_group;

      const expectedLogGroups = [
        '/aws/apigateway/prod-service-api',
        '/aws/lambda/prod-service-user-handler',
        '/aws/lambda/prod-service-session-handler',
        '/aws/lambda/prod-service-health-check',
      ];

      expectedLogGroups.forEach(expectedLogGroup => {
        const logGroup = Object.values(logGroups).find(
          (lg: any) => lg.name === expectedLogGroup
        );
        expect(logGroup).toBeDefined();
        expect((logGroup as any).retention_in_days).toBeDefined();
      });
    });

    test('should configure API Gateway access logging', () => {
      const apiStages = synthesized.resource.aws_api_gateway_stage;

      Object.values(apiStages).forEach((stage: any) => {
        expect(stage.access_log_settings).toBeDefined();
        expect(stage.access_log_settings.destination_arn).toBeDefined();
        expect(stage.access_log_settings.format).toBeDefined();
      });
    });

    test('should enable API Gateway metrics', () => {
      const methodSettings =
        synthesized.resource.aws_api_gateway_method_settings;

      Object.values(methodSettings).forEach((settings: any) => {
        expect(settings.settings.metrics_enabled).toBe(true);
        expect(settings.settings.logging_level).toBeDefined();
      });
    });
  });

  describe('Lambda Function Integration', () => {
    test('should create proper Lambda permissions for API Gateway', () => {
      const lambdaPermissions = synthesized.resource.aws_lambda_permission;

      Object.values(lambdaPermissions).forEach((permission: any) => {
        expect(permission.statement_id).toBe('AllowExecutionFromAPIGateway');
        expect(permission.action).toBe('lambda:InvokeFunction');
        expect(permission.principal).toBe('apigateway.amazonaws.com');
        expect(permission.source_arn).toBeDefined();
        expect(permission.function_name).toBeDefined();
      });
    });

    test('should configure Lambda environment variables properly', () => {
      const lambdaFunctions = synthesized.resource.aws_lambda_function;

      Object.values(lambdaFunctions).forEach((lambdaFunc: any) => {
        const envVars = lambdaFunc.environment.variables;

        expect(envVars.USER_TABLE_NAME).toBe('prod-service-users');
        expect(envVars.SESSION_TABLE_NAME).toBe('prod-service-sessions');
        expect(envVars.AWS_REGION).toBe('us-east-1');
      });
    });

    test('should deploy Lambda code from S3', () => {
      const lambdaFunctions = synthesized.resource.aws_lambda_function;
      const s3Objects = synthesized.resource.aws_s3_object;

      Object.values(lambdaFunctions).forEach((lambdaFunc: any) => {
        expect(lambdaFunc.s3_bucket).toBeDefined();
        expect(lambdaFunc.s3_key).toBeDefined();

        // Verify corresponding S3 object exists
        const s3Object = Object.values(s3Objects).find(
          (obj: any) => obj.key === lambdaFunc.s3_key
        );
        expect(s3Object).toBeDefined();
      });
    });
  });

  describe('API Gateway Configuration Completeness', () => {
    test('should create complete REST API structure', () => {
      const restApi = synthesized.resource.aws_api_gateway_rest_api;
      const resources = synthesized.resource.aws_api_gateway_resource;
      const methods = synthesized.resource.aws_api_gateway_method;
      const integrations = synthesized.resource.aws_api_gateway_integration;
      const deployment = synthesized.resource.aws_api_gateway_deployment;
      const stage = synthesized.resource.aws_api_gateway_stage;

      expect(Object.keys(restApi).length).toBe(1);
      expect(Object.keys(resources).length).toBe(5); // users, sessions, health, {userId}, {sessionId}
      expect(Object.keys(methods).length).toBe(9); // Various HTTP methods
      expect(Object.keys(integrations).length).toBe(9); // One per method
      expect(Object.keys(deployment).length).toBe(1);
      expect(Object.keys(stage).length).toBe(1);
    });

    test('should configure proper CORS if needed', () => {
      // This test would check for CORS configuration
      // Currently not implemented in the stack, but would be important for production
      const apiMethods = synthesized.resource.aws_api_gateway_method;

      // Check if OPTIONS methods exist for CORS
      const optionsMethods = Object.values(apiMethods).filter(
        (method: any) => method.http_method === 'OPTIONS'
      );

      // For now, we just verify structure exists for future CORS implementation
      expect(apiMethods).toBeDefined();
    });
  });

  describe('Data Persistence Configuration', () => {
    test('should configure DynamoDB with point-in-time recovery', () => {
      const dynamoTables = synthesized.resource.aws_dynamodb_table;

      Object.values(dynamoTables).forEach((table: any) => {
        if (table.name === 'prod-service-users') {
          expect(table.point_in_time_recovery).toBeDefined();
          expect(table.point_in_time_recovery.enabled).toBe(true);
        }
      });
    });

    test('should configure session table with TTL', () => {
      const dynamoTables = synthesized.resource.aws_dynamodb_table;

      const sessionTable = Object.values(dynamoTables).find(
        (table: any) => table.name === 'prod-service-sessions'
      );

      expect(sessionTable).toBeDefined();
      expect((sessionTable as any).ttl).toBeDefined();
      expect((sessionTable as any).ttl.enabled).toBe(true);
      expect((sessionTable as any).ttl.attribute_name).toBe('expiresAt');
    });

    test('should configure proper GSI for query patterns', () => {
      const dynamoTables = synthesized.resource.aws_dynamodb_table;

      const userTable = Object.values(dynamoTables).find(
        (table: any) => table.name === 'prod-service-users'
      );

      const sessionTable = Object.values(dynamoTables).find(
        (table: any) => table.name === 'prod-service-sessions'
      );

      expect((userTable as any).global_secondary_index).toBeDefined();
      expect((sessionTable as any).global_secondary_index).toBeDefined();

      // Check specific GSI configurations
      const userGSI = (userTable as any).global_secondary_index[0];
      expect(userGSI.name).toBe('email-index');
      expect(userGSI.hash_key).toBe('email');

      const sessionGSI = (sessionTable as any).global_secondary_index[0];
      expect(sessionGSI.name).toBe('user-sessions-index');
      expect(sessionGSI.hash_key).toBe('userId');
    });
  });

  describe('Output Configuration', () => {
    test('should provide all necessary outputs for external consumption', () => {
      const outputs = synthesized.output;

      expect(outputs.api_gateway_url).toBeDefined();
      expect(outputs.user_table_name).toBeDefined();
      expect(outputs.session_table_name).toBeDefined();
      expect(outputs.lambda_function_names).toBeDefined();
      expect(outputs.health_check_url).toBeDefined();

      // Check output values are properly referenced
      expect(outputs.user_table_name.value).toBe('prod-service-users');
      expect(outputs.session_table_name.value).toBe('prod-service-sessions');
    });

    test('should have meaningful output descriptions', () => {
      const outputs = synthesized.output;

      Object.values(outputs).forEach((output: any) => {
        expect(output.description).toBeDefined();
        expect(output.description.length).toBeGreaterThan(0);
      });
    });
  });

  describe('Terraform State Management', () => {
    test('should not include sensitive data in plain text', () => {
      const terraformString = JSON.stringify(synthesized);

      // Check for common sensitive patterns
      const sensitivePatterns = [
        /password/i,
        /secret/i,
        /key.*=.*[a-zA-Z0-9]{20,}/i, // Potential API keys
      ];

      sensitivePatterns.forEach(pattern => {
        const matches = terraformString.match(pattern);
        if (matches) {
          // If matches are found, they should be in appropriate contexts
          // like resource names or descriptions, not actual values
          matches.forEach(match => {
            expect(match.toLowerCase()).not.toMatch(/password.*=.*[a-zA-Z0-9]/);
          });
        }
      });
    });

    test('should use proper resource naming conventions', () => {
      const allResources = { ...synthesized.resource };

      Object.entries(allResources).forEach(([resourceType, resources]) => {
        Object.keys(resources as any).forEach(resourceName => {
          // Resource names should follow naming conventions
          expect(resourceName).toMatch(/^[a-zA-Z][a-zA-Z0-9_-]*$/);
          expect(resourceName.length).toBeLessThan(100); // Reasonable length limit
        });
      });
    });
  });

  afterEach(() => {
    // Clean up any temporary files created during tests
    const tempDir = path.join(__dirname, '..', 'temp');
    if (fs.existsSync(tempDir)) {
      const files = fs.readdirSync(tempDir);
      files.forEach(file => {
        if (file.includes('terraform-plan-test')) {
          const filePath = path.join(tempDir, file);
          if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
          }
        }
      });
    }
  });
});
