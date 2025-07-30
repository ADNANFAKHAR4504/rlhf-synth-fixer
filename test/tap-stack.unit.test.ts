import * as pulumi from '@pulumi/pulumi';
import 'jest';
import { TapStack } from '../lib/tap-stack';

// Helper function to unwrap the value from a Pulumi Output.
function promiseOf<T>(output: pulumi.Output<T>): Promise<T> {
  return new Promise(resolve => output.apply(resolve));
}

// Define the shape of the IAM policy for TypeScript
interface IamPolicy {
  Statement: {
    Principal: {
      Service: string;
    };
  }[];
}

describe('ServerlessApp Infrastructure', () => {
  let stack: TapStack;
  const mockTags = {
    Environment: 'test',
    Project: 'ServerlessApp',
  };

  // Before any tests run, we set up the Pulumi mock environment.
  beforeAll(() => {
    pulumi.runtime.setMocks({
      // Mocks the creation of a new resource.
      newResource: (
        args: pulumi.runtime.MockResourceArgs
      ): { id: string; state: any } => {
        // We return a mock ID and a state object that includes the
        // inputs passed to the resource. We also mock any computed
        // outputs like ARNs or endpoints.
        return {
          id: `${args.name}_id`,
          state: {
            ...args.inputs,
            // --- Mocked computed outputs ---
            name: args.name, // Use the resource name as the mock name
            arn: `arn:aws:mock:${args.type}:${args.name}`,
            invokeArn: `arn:aws:apigateway:us-east-1::/functions/arn:aws:mock:lambda:${args.name}/invocations`,
            executionArn: `arn:aws:execute-api:us-east-1:123456789012:${args.name}`,
            apiEndpoint: `https://mock-api.execute-api.us-east-1.amazonaws.com`,
          },
        };
      },
      // Mocks provider-level function calls.
      call: (args: pulumi.runtime.MockCallArgs) => {
        return args.inputs;
      },
    });

    // After setting mocks, we instantiate our stack.
    // This ensures the stack code runs within our mocked Pulumi environment.
    stack = new TapStack('test-stack', {
      tags: mockTags,
    });
  });

  // Reset modules after all tests to ensure a clean slate for other test files.
  afterAll(() => {
    jest.resetModules();
  });

  // --- Test Suites ---

  describe('DynamoDB Table', () => {
    it('is created with the correct configuration and tags', async () => {
      expect(stack.dynamoTable).toBeDefined();
      const attributes = await promiseOf(stack.dynamoTable.attributes);
      const billingMode = await promiseOf(stack.dynamoTable.billingMode);
      const hashKey = await promiseOf(stack.dynamoTable.hashKey);
      const tags = await promiseOf(stack.dynamoTable.tags);

      expect(attributes).toEqual([{ name: 'id', type: 'S' }]);
      expect(billingMode).toBe('PAY_PER_REQUEST');
      expect(hashKey).toBe('id');
      expect(tags).toEqual(mockTags);
    });
  });

  describe('IAM Role and Policy', () => {
    it('creates an IAM role for the Lambda function with correct tags', async () => {
      expect(stack.lambdaRole).toBeDefined();

      // FIX: Cast the result to the IamPolicy interface instead of 'any'.
      const policyObject = (await promiseOf(
        stack.lambdaRole.assumeRolePolicy as any
      )) as IamPolicy;

      const tags = await promiseOf(stack.lambdaRole.tags);

      expect(policyObject.Statement[0].Principal.Service).toBe(
        'lambda.amazonaws.com'
      );
      expect(tags).toEqual(mockTags);
    });

    it('creates an IAM policy with correct permissions and tags', async () => {
      expect(stack.lambdaPolicy).toBeDefined();
      const policyDoc = await promiseOf(stack.lambdaPolicy.policy);
      const policy = JSON.parse(policyDoc);
      const tags = await promiseOf(stack.lambdaPolicy.tags);

      expect(policy.Statement[0].Action).toContain('dynamodb:PutItem');
      // The ARN is mocked, so we check for the mocked resource name.
      expect(policy.Statement[0].Resource).toBe(
        'arn:aws:mock:aws:dynamodb/table:Table:my-app-table'
      );
      expect(policy.Statement[1].Action).toContain('logs:CreateLogStream');
      expect(policy.Statement[1].Resource).toBe('arn:aws:logs:*:*:*');
      expect(tags).toEqual(mockTags);
    });
  });

  describe('Lambda Security Group', () => {
    it('is created with the correct egress rule and tags', async () => {
      expect(stack.lambdaSecurityGroup).toBeDefined();
      const egress = await promiseOf(stack.lambdaSecurityGroup.egress);
      const tags = await promiseOf(stack.lambdaSecurityGroup.tags);

      expect(egress).toEqual([
        {
          protocol: 'tcp',
          fromPort: 443,
          toPort: 443,
          cidrBlocks: ['0.0.0.0/0'],
        },
      ]);
      expect(tags).toEqual(mockTags);
    });
  });

  describe('Lambda Function', () => {
    it('is created with the correct runtime, environment variables, and tags', async () => {
      expect(stack.lambda).toBeDefined();
      const runtime = await promiseOf(stack.lambda.runtime);
      const roleArn = await promiseOf(stack.lambda.role);
      const envVars = await promiseOf(
        stack.lambda.environment.apply(env => env?.variables)
      );
      const tags = await promiseOf(stack.lambda.tags);

      expect(runtime).toBe('nodejs20.x');
      expect(roleArn).toBe('arn:aws:mock:aws:iam/role:Role:my-lambda-role');
      expect(envVars).toBeDefined();
      // The table name is mocked to be the resource name.
      expect(envVars?.TABLE_NAME).toBe('my-app-table');
      expect(tags).toEqual(mockTags);
    });

    it('has active XRay tracing enabled', async () => {
      const tracingConfig = await promiseOf(stack.lambda.tracingConfig);
      expect(tracingConfig?.mode).toBe('Active');
    });
  });

  describe('API Gateway', () => {
    it('creates an HTTP API with correct tags', async () => {
      expect(stack.api).toBeDefined();
      const protocolType = await promiseOf(stack.api.protocolType);
      const tags = await promiseOf(stack.api.tags);

      expect(protocolType).toBe('HTTP');
      expect(tags).toEqual(mockTags);
    });

    it('creates a default stage with logging enabled', async () => {
      expect(stack.apiStage).toBeDefined();
      const apiId = await promiseOf(stack.apiStage.apiId);
      const destinationArn = await promiseOf(
        stack.apiStage.accessLogSettings.apply(s => s?.destinationArn)
      );

      expect(apiId).toBe('my-http-api_id');
      expect(destinationArn).toBe(
        'arn:aws:mock:aws:cloudwatch/logGroup:LogGroup:my-api-log-group'
      );
    });

    it('creates a route for GET /', async () => {
      expect(stack.route).toBeDefined();
      const routeKey = await promiseOf(stack.route.routeKey);
      const target = await promiseOf(stack.route.target);

      expect(routeKey).toBe('GET /');
      expect(target).toBe('integrations/my-lambda-integration_id');
    });
  });

  describe('Stack Exports', () => {
    it('exports the API endpoint URL', async () => {
      const url = await promiseOf(stack.apiUrl);
      expect(url).toBe(
        'https://mock-api.execute-api.us-east-1.amazonaws.com'
      );
    });
  });
});