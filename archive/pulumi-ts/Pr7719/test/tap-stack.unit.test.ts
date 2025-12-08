import * as pulumi from '@pulumi/pulumi';

// Mock Pulumi runtime for testing
pulumi.runtime.setMocks({
  newResource: function (args: pulumi.runtime.MockResourceArgs): {
    id: string;
    state: any;
  } {
    const outputs: any = {
      ...args.inputs,
      id: args.inputs.name + '_id',
      arn:
        'arn:aws:mock:us-east-1:123456789012:' +
        args.type +
        '/' +
        args.inputs.name,
      url: 'https://mock-url.com/' + args.inputs.name,
    };
    return {
      id: args.inputs.name + '_id',
      state: outputs,
    };
  },
  call: function (args: pulumi.runtime.MockCallArgs) {
    return args.inputs;
  },
});

import { TapStack } from '../lib/tap-stack';
import { LambdaComponent } from '../lib/lambda-component';
import * as aws from '@pulumi/aws';

describe('TapStack Unit Tests', () => {
  describe('Stack Creation', () => {
    it('should create stack with environment suffix', async () => {
      const stack = new TapStack('test-stack', {
        environmentSuffix: 'test',
        tags: {
          Environment: 'test',
          Project: 'DataProcessing',
        },
      });

      expect(stack).toBeDefined();
      expect(stack.table).toBeDefined();
      expect(stack.processorFunctionArn).toBeDefined();
      expect(stack.dlqUrl).toBeDefined();

      // Wait for outputs to resolve
      await Promise.all([
        stack.table.apply(v => v),
        stack.processorFunctionArn.apply(v => v),
        stack.dlqUrl.apply(v => v),
      ]);
    }, 10000);

    it('should create stack with default environment suffix', async () => {
      const stack = new TapStack('test-stack-default', {});

      expect(stack).toBeDefined();
      expect(stack.table).toBeDefined();

      // Wait for output to resolve
      await stack.table.apply(v => v);
    }, 10000);
  });

  describe('LambdaComponent', () => {
    it('should create Lambda component without provisioned concurrency', () => {
      const role = new aws.iam.Role('test-role', {
        assumeRolePolicy: JSON.stringify({
          Version: '2012-10-17',
          Statement: [
            {
              Action: 'sts:AssumeRole',
              Effect: 'Allow',
              Principal: { Service: 'lambda.amazonaws.com' },
            },
          ],
        }),
      });

      const dlq = new aws.sqs.Queue('test-dlq', {
        name: 'test-dlq',
      });

      const component = new LambdaComponent('test-component', {
        environmentSuffix: 'test',
        functionName: 'test-function',
        handler: 'index.handler',
        memorySize: 512,
        role: role,
        deadLetterQueue: dlq,
        logRetentionDays: 7,
        tags: { Environment: 'test' },
        code: new pulumi.asset.AssetArchive({
          'index.js': new pulumi.asset.StringAsset(
            'exports.handler = async () => ({ statusCode: 200 });'
          ),
        }),
      });

      expect(component.function).toBeDefined();
      expect(component.logGroup).toBeDefined();
    });

    it('should create Lambda component with provisioned concurrency', () => {
      const role = new aws.iam.Role('test-role-2', {
        assumeRolePolicy: JSON.stringify({
          Version: '2012-10-17',
          Statement: [
            {
              Action: 'sts:AssumeRole',
              Effect: 'Allow',
              Principal: { Service: 'lambda.amazonaws.com' },
            },
          ],
        }),
      });

      const dlq = new aws.sqs.Queue('test-dlq-2', {
        name: 'test-dlq-2',
      });

      const component = new LambdaComponent('test-component-with-pc', {
        environmentSuffix: 'test',
        functionName: 'test-function-with-pc',
        handler: 'index.handler',
        memorySize: 512,
        role: role,
        deadLetterQueue: dlq,
        provisionedConcurrency: 2,
        logRetentionDays: 7,
        tags: { Environment: 'test' },
        code: new pulumi.asset.AssetArchive({
          'index.js': new pulumi.asset.StringAsset(
            'exports.handler = async () => ({ statusCode: 200 });'
          ),
        }),
      });

      expect(component.function).toBeDefined();
    });

    it('should create Lambda component with environment variables', () => {
      const role = new aws.iam.Role('test-role-3', {
        assumeRolePolicy: JSON.stringify({
          Version: '2012-10-17',
          Statement: [
            {
              Action: 'sts:AssumeRole',
              Effect: 'Allow',
              Principal: { Service: 'lambda.amazonaws.com' },
            },
          ],
        }),
      });

      const dlq = new aws.sqs.Queue('test-dlq-3', {
        name: 'test-dlq-3',
      });

      const component = new LambdaComponent('test-component-with-env', {
        environmentSuffix: 'test',
        functionName: 'test-function-with-env',
        handler: 'index.handler',
        memorySize: 512,
        role: role,
        deadLetterQueue: dlq,
        logRetentionDays: 7,
        tags: { Environment: 'test' },
        code: new pulumi.asset.AssetArchive({
          'index.js': new pulumi.asset.StringAsset(
            'exports.handler = async () => ({ statusCode: 200 });'
          ),
        }),
        environment: {
          variables: {
            TABLE_NAME: 'test-table',
          },
        },
      });

      expect(component.function).toBeDefined();
    });

    it('should create Lambda component with default log retention', () => {
      const role = new aws.iam.Role('test-role-4', {
        assumeRolePolicy: JSON.stringify({
          Version: '2012-10-17',
          Statement: [
            {
              Action: 'sts:AssumeRole',
              Effect: 'Allow',
              Principal: { Service: 'lambda.amazonaws.com' },
            },
          ],
        }),
      });

      const dlq = new aws.sqs.Queue('test-dlq-4', {
        name: 'test-dlq-4',
      });

      // Test without logRetentionDays to cover the default value branch
      const component = new LambdaComponent(
        'test-component-default-retention',
        {
          environmentSuffix: 'test',
          functionName: 'test-function-default-retention',
          handler: 'index.handler',
          memorySize: 512,
          role: role,
          deadLetterQueue: dlq,
          tags: { Environment: 'test' },
          code: new pulumi.asset.AssetArchive({
            'index.js': new pulumi.asset.StringAsset(
              'exports.handler = async () => ({ statusCode: 200 });'
            ),
          }),
        }
      );

      expect(component.function).toBeDefined();
      expect(component.logGroup).toBeDefined();
    });
  });

  describe('Index Module Exports', () => {
    it('should export stack outputs', () => {
      // Import index to ensure exports are working
      const indexModule = require('../lib/index');
      expect(indexModule.tableName).toBeDefined();
      expect(indexModule.processorFunctionArn).toBeDefined();
      expect(indexModule.dlqUrl).toBeDefined();
    });
  });
});
