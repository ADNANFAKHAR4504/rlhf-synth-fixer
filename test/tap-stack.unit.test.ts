import * as pulumi from '@pulumi/pulumi';
import { TapStack } from '../lib/tap-stack';

// Set up Pulumi runtime mocking
pulumi.runtime.setMocks({
  newResource: function (
    args: pulumi.runtime.MockResourceArgs
  ): { id: string; state: any } {
    // Default state for resources
    const defaultState: any = {
      ...args.inputs,
      id: `${args.name}-id`,
      arn: `arn:aws:${args.type}:us-east-1:123456789012:${args.name}`,
    };

    // Mock specific resource types
    switch (args.type) {
      case 'aws:kms/key:Key':
        return {
          id: `${args.name}-id`,
          state: {
            ...defaultState,
            keyId: `${args.name}-key-id`,
          },
        };
      case 'aws:dynamodb/table:Table':
        return {
          id: `${args.name}-id`,
          state: {
            ...defaultState,
            streamArn: `arn:aws:dynamodb:us-east-1:123456789012:table/${args.name}/stream/2021-01-01T00:00:00.000`,
          },
        };
      case 'aws:sqs/queue:Queue':
        return {
          id: `${args.name}-id`,
          state: {
            ...defaultState,
            url: `https://sqs.us-east-1.amazonaws.com/123456789012/${args.name}`,
          },
        };
      case 'aws:sns/topic:Topic':
        return {
          id: `${args.name}-id`,
          state: {
            ...defaultState,
          },
        };
      case 'aws:iam/role:Role':
        return {
          id: `${args.name}-id`,
          state: {
            ...defaultState,
            name: args.inputs.name || args.name,
          },
        };
      case 'aws:lambda/function:Function':
        return {
          id: `${args.name}-id`,
          state: {
            ...defaultState,
            invokeArn: `arn:aws:apigateway:us-east-1:lambda:path/2015-03-31/functions/${defaultState.arn}/invocations`,
          },
        };
      case 'aws:apigateway/restApi:RestApi':
        return {
          id: `${args.name}-id`,
          state: {
            ...defaultState,
            executionArn: `arn:aws:execute-api:us-east-1:123456789012:${args.name}`,
            rootResourceId: 'root-resource-id',
          },
        };
      case 'aws:apigateway/deployment:Deployment':
        return {
          id: `${args.name}-id`,
          state: {
            ...defaultState,
            invokeUrl: `https://${args.name}.execute-api.us-east-1.amazonaws.com/prod`,
          },
        };
      case 'aws:apigateway/stage:Stage':
        return {
          id: `${args.name}-id`,
          state: {
            ...defaultState,
            invokeUrl: `https://api-id.execute-api.us-east-1.amazonaws.com/${args.inputs.stageName || 'prod'}`,
          },
        };
      case 'aws:apigateway/apiKey:ApiKey':
        return {
          id: `${args.name}-id`,
          state: {
            ...defaultState,
            value: 'test-api-key-value',
          },
        };
      default:
        return {
          id: `${args.name}-id`,
          state: defaultState,
        };
    }
  },
  call: function (args: pulumi.runtime.MockCallArgs) {
    return args.inputs;
  },
});

describe('TapStack Structure', () => {
  describe('with explicit environment suffix', () => {
    let stack: TapStack;

    beforeAll(async () => {
      stack = new TapStack('TestTapStackWithProps', {
        environmentSuffix: 'test',
      });
    });

    it('instantiates successfully', () => {
      expect(stack).toBeDefined();
      expect(stack).toBeInstanceOf(TapStack);
    });

    it('creates outputs', () => {
      expect(stack.apiUrl).toBeDefined();
      expect(stack.apiKey).toBeDefined();
    });

    it('uses correct environment suffix', async () => {
      const apiUrl = await stack.apiUrl.promise();
      expect(apiUrl).toContain('test');
    });
  });

  describe('with environment variable suffix', () => {
    let stack: TapStack;

    beforeAll(async () => {
      // Set environment variable but don't pass environmentSuffix in args
      process.env.ENVIRONMENT_SUFFIX = 'staging';
      stack = new TapStack('TestTapStackEnvVar', {});
    });

    afterAll(() => {
      delete process.env.ENVIRONMENT_SUFFIX;
    });

    it('instantiates successfully', () => {
      expect(stack).toBeDefined();
      expect(stack).toBeInstanceOf(TapStack);
    });

    it('uses environment variable suffix when args.environmentSuffix not provided', async () => {
      const apiUrl = await stack.apiUrl.promise();
      expect(apiUrl).toBeDefined();
      expect(apiUrl).toContain('staging');
    });
  });

  describe('with default suffix fallback', () => {
    let stack: TapStack;

    beforeAll(async () => {
      // Make sure no environment variable is set
      delete process.env.ENVIRONMENT_SUFFIX;
      // Don't pass environmentSuffix in args
      stack = new TapStack('TestTapStackDefault', {});
    });

    it('instantiates successfully', () => {
      expect(stack).toBeDefined();
      expect(stack).toBeInstanceOf(TapStack);
    });

    it('uses default "dev" suffix when no suffix provided', async () => {
      const apiUrl = await stack.apiUrl.promise();
      expect(apiUrl).toBeDefined();
      expect(apiUrl).toContain('dev');
    });
  });

  describe('with all optional props', () => {
    let stack: TapStack;

    beforeAll(async () => {
      stack = new TapStack('TestTapStackAllProps', {
        environmentSuffix: 'prod',
        tags: {
          Environment: 'production',
          Team: 'platform',
        },
      });
    });

    it('instantiates successfully with tags', () => {
      expect(stack).toBeDefined();
      expect(stack).toBeInstanceOf(TapStack);
    });

    it('creates outputs with prod suffix', async () => {
      const apiUrl = await stack.apiUrl.promise();
      expect(apiUrl).toBeDefined();
      expect(apiUrl).toContain('prod');
    });
  });
});
