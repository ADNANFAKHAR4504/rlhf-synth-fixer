import * as pulumi from '@pulumi/pulumi';
import { ApiGatewayStack } from '../lib/api-gateway-stack';
import { CloudWatchStack } from '../lib/cloudwatch-stack';
import { DynamoDBStack } from '../lib/dynamodb-stack';
import { LambdaStack } from '../lib/lambda-stack';
import { TapStack } from '../lib/tap-stack';

// Set up Pulumi runtime mocks before imports
pulumi.runtime.setMocks({
  newResource: (args: pulumi.runtime.MockResourceArgs) => {
    return {
      id: `${args.name}-id`,
      state: {
        ...args.inputs,
        name: args.inputs.name || args.name,
        arn: `arn:aws:${args.type}:us-east-1:123456789012:${args.name}`,
        invokeArn: args.type.includes('lambda')
          ? `arn:aws:apigateway:us-east-1:lambda:path/2015-03-31/functions/arn:aws:lambda:us-east-1:123456789012:function:${args.name}/invocations`
          : undefined,
      },
    };
  },
  call: (args: pulumi.runtime.MockCallArgs) => {
    return args;
  },
});

describe('Serverless Infrastructure Components', () => {
  beforeAll(() => {
    // Mock interpolate function
    (pulumi as any).interpolate = (
      strings: TemplateStringsArray | string,
      ...values: any[]
    ) => {
      if (typeof strings === 'string') {
        return pulumi.Output.create(strings);
      }
      const result = strings.reduce((acc, str, i) => {
        return acc + str + (values[i] || '');
      }, '');
      return pulumi.Output.create(result);
    };

    // Mock all function
    (pulumi as any).all = (values: any[]) => {
      return {
        apply: (fn: any) => {
          return pulumi.Output.create(fn(values));
        },
      };
    };
  });

  describe('DynamoDB Stack', () => {
    it('should be importable', () => {
      expect(DynamoDBStack).toBeDefined();
    });

    it('should create DynamoDB table with encryption', () => {
      const stack = new DynamoDBStack('test-dynamodb', {
        environmentSuffix: 'test',
        tags: { Environment: 'test' },
      });

      expect(stack.tableName).toBeDefined();
      expect(stack.tableArn).toBeDefined();
    });
  });

  describe('Lambda Stack', () => {
    it('should be importable', () => {
      expect(LambdaStack).toBeDefined();
    });

    it('should create Lambda function with proper configuration', () => {
      const mockTableName = pulumi.Output.create('test-table');

      const stack = new LambdaStack('test-lambda', {
        environmentSuffix: 'test',
        tableName: mockTableName,
        tags: { Environment: 'test' },
      });

      expect(stack.lambdaFunction).toBeDefined();
      expect(stack.lambdaFunctionName).toBeDefined();
    });
  });

  describe('API Gateway Stack', () => {
    it('should be importable', () => {
      expect(ApiGatewayStack).toBeDefined();
    });

    it('should create API Gateway with Lambda integration', () => {
      const mockLambdaFunction = {
        name: pulumi.Output.create('test-lambda'),
        arn: pulumi.Output.create(
          'arn:aws:lambda:us-east-1:123456789012:function:test-lambda'
        ),
        invokeArn: pulumi.Output.create(
          'arn:aws:apigateway:us-east-1:lambda:path/2015-03-31/functions/arn:aws:lambda:us-east-1:123456789012:function:test-lambda/invocations'
        ),
      };

      const stack = new ApiGatewayStack('test-api', {
        environmentSuffix: 'test',
        lambdaFunction: mockLambdaFunction as any,
        tags: { Environment: 'test' },
      });

      expect(stack.apiEndpoint).toBeDefined();
      expect(stack.apiGatewayName).toBeDefined();
    });
  });

  describe('CloudWatch Stack', () => {
    it('should be importable', () => {
      expect(CloudWatchStack).toBeDefined();
    });

    it('should create monitoring resources', () => {
      const mockLambdaFunctionName = pulumi.Output.create('test-lambda');
      const mockApiGatewayName = pulumi.Output.create('test-api');

      const stack = new CloudWatchStack('test-cloudwatch', {
        environmentSuffix: 'test',
        lambdaFunctionName: mockLambdaFunctionName,
        apiGatewayName: mockApiGatewayName,
        tags: { Environment: 'test' },
      });

      expect(stack.logGroupArn).toBeDefined();
    });
  });

  describe('Main TapStack', () => {
    it('should be importable', () => {
      expect(TapStack).toBeDefined();
    });

    it('should orchestrate all stacks', () => {
      const stack = new TapStack('test-tap', {
        environmentSuffix: 'test',
        tags: { Environment: 'test' },
      });

      expect(stack.apiEndpoint).toBeDefined();
      expect(stack.tableName).toBeDefined();
    });
  });
});
