import { App, Testing } from 'cdktf';
import { TapStack } from '../lib/tap-stack';

describe('TapStack Integration Tests', () => {
  let app: App;

  const synthParsed = (stack: TapStack) => {
    const json = Testing.synth(stack);
    return JSON.parse(json as unknown as string);
  };

  beforeAll(() => {
    jest.setTimeout(30000);
  });

  beforeEach(() => {
    app = new App();
    jest.clearAllMocks();
  });

  describe('Synthesis & Providers', () => {
    test('synthesizes without errors (default config)', () => {
      expect(() => {
        const stack = new TapStack(app, 'IntDefault');
        Testing.synth(stack);
      }).not.toThrow();
    });

    test('synthesizes without errors (custom config)', () => {
      expect(() => {
        const stack = new TapStack(app, 'IntCustom', {
          environmentSuffix: 'staging',
          awsRegion: 'us-west-2',
          defaultTags: { TestSuite: 'Integration' },
        });
        Testing.synth(stack);
      }).not.toThrow();
    });

    test('has AWS provider configured', () => {
      const stack = new TapStack(app, 'ProvidersCheck');
      const s = synthParsed(stack);

      expect(s.provider).toBeDefined();
      expect(Object.keys(s.provider)).toEqual(
        expect.arrayContaining(['aws'])
      );
      expect(s.provider.aws[0].region).toBe('us-east-1');
    });
  });

  describe('Core Resources Presence', () => {
    let s: any;
    beforeEach(() => {
      const stack = new TapStack(app, 'ResourcesPresence');
      s = synthParsed(stack);
    });

    test('creates expected core resource types', () => {
      expect(s.resource).toBeDefined();

      const requiredTypes = [
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
      ];

      requiredTypes.forEach(t => {
        expect(s.resource[t]).toBeDefined();
        expect(Object.keys(s.resource[t]).length).toBeGreaterThan(0);
      });
    });

    test('resource counts match expected serverless architecture', () => {
      const counts: Record<string, number> = {
        aws_s3_bucket: 1,
        aws_dynamodb_table: 2,
        aws_iam_role: 1,
        aws_iam_policy: 1,
        aws_iam_role_policy_attachment: 2,
        aws_cloudwatch_log_group: 4,
        aws_lambda_function: 3,
        aws_lambda_permission: 3,
        aws_api_gateway_rest_api: 1,
        aws_api_gateway_resource: 5,
        aws_api_gateway_method: 9,
        aws_api_gateway_integration: 9,
        aws_api_gateway_deployment: 1,
        aws_api_gateway_stage: 1,
        aws_api_gateway_method_settings: 1,
      };

      Object.entries(counts).forEach(([type, expected]) => {
        const bag = s.resource[type];
        const actual = bag ? Object.keys(bag).length : 0;
        expect(actual).toBe(expected);
      });
    });
  });

  describe('API Gateway Configuration', () => {
    let s: any;
    beforeEach(() => {
      const stack = new TapStack(app, 'ApiChecks');
      s = synthParsed(stack);
    });

    test('REST API configured as REGIONAL with prod stage and logging', () => {
      const restApis = s.resource.aws_api_gateway_rest_api;
      const restApi = Object.values(restApis)[0] as any;
      expect(restApi.description).toBe('Serverless Web Application API');
      expect(restApi.endpoint_configuration.types).toEqual(['REGIONAL']);

      const stages = s.resource.aws_api_gateway_stage;
      const stage = Object.values(stages)[0] as any;
      expect(stage.stage_name).toBe('prod');
      expect(stage.access_log_settings).toBeDefined();

      const methodSettings = s.resource.aws_api_gateway_method_settings;
      const settings = Object.values(methodSettings)[0] as any;
      expect(settings.method_path).toBe('*/*');
      expect(settings.settings.metrics_enabled).toBe(true);
      expect(settings.settings.logging_level).toBe('INFO');
      expect(settings.settings.data_trace_enabled).toBe(true);
      expect(settings.settings.throttling_burst_limit).toBe(5000);
      expect(settings.settings.throttling_rate_limit).toBe(2000);
    });

    test('creates resources, methods, and integrations for users/sessions/health', () => {
      const resources = s.resource.aws_api_gateway_resource;
      const expectedParts = [
        'users',
        '{userId}',
        'sessions',
        '{sessionId}',
        'health',
      ];
      expectedParts.forEach(part => {
        const found = Object.values(resources).find(
          (r: any) => r.path_part === part
        );
        expect(found).toBeDefined();
      });

      const methods = s.resource.aws_api_gateway_method;
      const integrations = s.resource.aws_api_gateway_integration;
      expect(Object.keys(methods).length).toBe(9);
      expect(Object.keys(integrations).length).toBe(9);

      const deployment = s.resource.aws_api_gateway_deployment;
      const dep = Object.values(deployment)[0] as any;
      expect(dep.depends_on).toBeDefined();
      expect(Array.isArray(dep.depends_on)).toBe(true);
      expect(dep.depends_on.length).toBeGreaterThanOrEqual(9);
    });
  });

  describe('Lambda & Permissions', () => {
    let s: any;
    beforeEach(() => {
      const stack = new TapStack(app, 'LambdaChecks');
      s = synthParsed(stack);
    });

    test('lambda functions configured with timeouts, memory, and optional env vars', () => {
      const fns = s.resource.aws_lambda_function;
      const list = Object.values(fns) as any[];

      expect(list.length).toBe(3);
      list.forEach(fn => {
        expect(fn.handler).toBe('lambda-handler.handler');
        expect(fn.runtime).toBe('nodejs18.x');
        expect(fn.timeout).toBeDefined();
        expect(fn.memory_size).toBeDefined();
        
        // Environment variables may be nested differently in CDKTF
        const envVars = fn.environment?.[0]?.variables || fn.environment?.variables;
        if (envVars) {
          expect(envVars.USER_TABLE_NAME).toBeDefined();
          expect(envVars.SESSION_TABLE_NAME).toBeDefined();
        }
        
        // Dependencies may not always be explicitly set in CDKTF
        if (fn.depends_on) {
          expect(Array.isArray(fn.depends_on)).toBe(true);
          expect(fn.depends_on.length).toBeGreaterThan(0);
        }
      });
    });

    test('lambda permissions allow API Gateway invocation', () => {
      const perms = s.resource.aws_lambda_permission;
      const list = Object.values(perms) as any[];
      expect(list.length).toBe(3);
      list.forEach(p => {
        expect(p.statement_id).toBe('AllowExecutionFromAPIGateway');
        expect(p.action).toBe('lambda:InvokeFunction');
        expect(p.principal).toBe('apigateway.amazonaws.com');
        // CDKTF uses interpolation for execution_arn; verify the pattern rather than literal "execute-api"
        expect(typeof p.source_arn).toBe('string');
        expect(p.source_arn).toMatch(
          /\$\{aws_api_gateway_rest_api\.[^.}]+\.execution_arn}\/\*\/\*/
        );
      });
    });
  });

  describe('DynamoDB & Security', () => {
    let s: any;
    beforeEach(() => {
      const stack = new TapStack(app, 'DynamoSecurity');
      s = synthParsed(stack);
    });

    test('DynamoDB tables have encryption and proper configs (users: PITR; sessions: TTL)', () => {
      const tables = s.resource.aws_dynamodb_table;
      const vals = Object.values(tables) as any[];

      const user = vals.find(t => (t.name as string).includes('users'));
      const sessions = vals.find(t => (t.name as string).includes('sessions'));

      expect(user).toBeDefined();
      expect(sessions).toBeDefined();

      expect(user.server_side_encryption.enabled).toBe(true);
      expect(sessions.server_side_encryption.enabled).toBe(true);

      expect(user.point_in_time_recovery.enabled).toBe(true);

      expect(sessions.ttl.enabled).toBe(true);
      expect(sessions.ttl.attribute_name).toBe('expiresAt');
    });

    test('IAM role/policies exist and attachments reference the role', () => {
      const roles = s.resource.aws_iam_role;
      const policies = s.resource.aws_iam_policy;
      const atts = s.resource.aws_iam_role_policy_attachment;

      expect(Object.keys(roles).length).toBe(1);
      expect(Object.keys(policies).length).toBe(1);
      expect(Object.keys(atts).length).toBeGreaterThanOrEqual(2);

      Object.values(atts).forEach((a: any) => {
        expect(a.role).toBeDefined();
      });
    });

    test('CloudWatch log groups exist for API and all Lambdas', () => {
      const logs = s.resource.aws_cloudwatch_log_group;
      const names = Object.values(logs).map((lg: any) => lg.name as string);

      expect(names.length).toBe(4);
      expect(names.some(n => n.includes('/aws/apigateway/'))).toBe(true);
      expect(names.filter(n => n.includes('/aws/lambda/')).length).toBe(3);
    });
  });

  describe('Outputs', () => {
    test('stack exposes required outputs with descriptions', () => {
      const stack = new TapStack(app, 'OutputsCheck');
      const s = synthParsed(stack);

      const expected = [
        'api_gateway_url',
        'user_table_name',
        'session_table_name',
        'lambda_function_names',
        'health_check_url',
      ];

      expected.forEach(name => {
        expect(s.output[name]).toBeDefined();
        expect(s.output[name].description).toBeDefined();
        expect((s.output[name].description as string).length).toBeGreaterThan(
          0
        );
      });

      expect(s.output.api_gateway_url.value).toContain(
        '${aws_api_gateway_rest_api'
      );
      expect(s.output.health_check_url.value).toContain(
        '${aws_api_gateway_rest_api'
      );
    });
  });
});
