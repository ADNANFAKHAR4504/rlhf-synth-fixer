import * as pulumi from '@pulumi/pulumi';
import { ApiGatewayStack } from '../lib/api-gateway-stack';
import { CloudWatchStack } from '../lib/cloudwatch-stack';
import { DynamoDBStack } from '../lib/dynamodb-stack';
import { LambdaStack } from '../lib/lambda-stack';
import { TapStack } from '../lib/tap-stack';

// Mock Pulumi runtime
pulumi.runtime.setMocks({
  newResource: (args: pulumi.runtime.MockResourceArgs) => {
    const { type, name, inputs } = args;
    return {
      id: `${name}-id`,
      state: {
        ...inputs,
        name: inputs.name || name,
        arn: `arn:aws:${type}:us-east-1:123456789012:${name}`,
        invokeArn: type.includes('lambda')
          ? `arn:aws:apigateway:us-east-1:lambda:path/2015-03-31/functions/arn:aws:lambda:us-east-1:123456789012:function:${name}/invocations`
          : undefined,
      },
    };
  },
  call: (args: pulumi.runtime.MockCallArgs) => {
    return args;
  },
});

// Increase coverage by testing all stacks
describe('Coverage Tests', () => {
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

  describe('DynamoDBStack', () => {
    it('should create DynamoDB table', () => {
      const stack = new DynamoDBStack('test-dynamodb', {
        environmentSuffix: 'test',
        tags: { Environment: 'test' },
      });

      expect(stack.tableName).toBeDefined();
      expect(stack.tableArn).toBeDefined();
    });
  });

  describe('LambdaStack', () => {
    it('should create Lambda function', () => {
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

  describe('ApiGatewayStack', () => {
    it('should create API Gateway', () => {
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

  describe('CloudWatchStack', () => {
    it('should create CloudWatch resources', () => {
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

  describe('TapStack', () => {
    it('should create main stack', () => {
      const stack = new TapStack('test-tap', {
        environmentSuffix: 'test',
        tags: { Environment: 'test' },
      });

      expect(stack.apiEndpoint).toBeDefined();
      expect(stack.tableName).toBeDefined();
    });
  });
});
