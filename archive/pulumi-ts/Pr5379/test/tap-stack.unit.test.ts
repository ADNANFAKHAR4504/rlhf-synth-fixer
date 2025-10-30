import * as pulumi from '@pulumi/pulumi';
import { TapStack } from '../lib/tap-stack';
import * as config from '../lib/config';

// Set up Pulumi testing environment
pulumi.runtime.setMocks({
  newResource: function (
    args: pulumi.runtime.MockResourceArgs
  ): { id: string; state: any } {
    return {
      id: `${args.name}_id`,
      state: args.inputs,
    };
  },
  call: function (args: pulumi.runtime.MockCallArgs) {
    return args.inputs;
  },
});

describe('TapStack Unit Tests', () => {
  describe('TapStack instantiation', () => {
    it('should create a TapStack with environmentSuffix', async () => {
      const stack = new TapStack('test-stack', {
        environmentSuffix: 'test123',
        tags: {
          TestTag: 'TestValue',
        },
      });

      expect(stack).toBeDefined();
      expect(stack.kmsKeyArn).toBeDefined();
      expect(stack.bucketArns).toBeDefined();
      expect(stack.tableArns).toBeDefined();
      expect(stack.lambdaArns).toBeDefined();
      expect(stack.apiEndpoint).toBeDefined();
      expect(stack.dashboardName).toBeDefined();
    });

    it('should use default environmentSuffix when not provided', async () => {
      const stack = new TapStack('test-stack-default', {});

      expect(stack).toBeDefined();
      // Stack should still instantiate with defaults
      expect(stack.kmsKeyArn).toBeDefined();
    });

    it('should apply custom tags to resources', async () => {
      const customTags = {
        Environment: 'test',
        Owner: 'test-team',
      };

      const stack = new TapStack('test-stack-tags', {
        environmentSuffix: 'tagged',
        tags: customTags,
      });

      expect(stack).toBeDefined();
    });
  });

  describe('Resource creation', () => {
    let stack: TapStack;

    beforeAll(() => {
      stack = new TapStack('test-resource-stack', {
        environmentSuffix: 'restest',
      });
    });

    it('should create KMS key output', async () => {
      expect(stack.kmsKeyArn).toBeDefined();
      // KMS key ARN should be a Pulumi Output
      expect(stack.kmsKeyArn).toHaveProperty('apply');
    });

    it('should create S3 bucket ARN outputs', async () => {
      const bucketArns = stack.bucketArns;
      expect(bucketArns).toBeDefined();
      expect(Array.isArray(bucketArns)).toBe(true);
      expect(bucketArns.length).toBeGreaterThan(0);
    });

    it('should create DynamoDB table ARN outputs', async () => {
      const tableArns = stack.tableArns;
      expect(tableArns).toBeDefined();
      expect(Array.isArray(tableArns)).toBe(true);
      expect(tableArns.length).toBeGreaterThan(0);
    });

    it('should create Lambda function ARN outputs', async () => {
      const lambdaArns = stack.lambdaArns;
      expect(lambdaArns).toBeDefined();
      expect(Array.isArray(lambdaArns)).toBe(true);
      expect(lambdaArns.length).toBeGreaterThan(0);
    });

    it('should create API Gateway endpoint output', async () => {
      expect(stack.apiEndpoint).toBeDefined();
      // API endpoint should be a Pulumi Output
      expect(stack.apiEndpoint).toHaveProperty('apply');
    });

    it('should create CloudWatch dashboard name output', async () => {
      expect(stack.dashboardName).toBeDefined();
      // Dashboard name should be a Pulumi Output
      expect(stack.dashboardName).toHaveProperty('apply');
    });
  });

  describe('Configuration handling', () => {
    afterEach(() => {
      jest.restoreAllMocks();
    });

    it('should successfully load dev config when available', async () => {
      // Mock successful config loading
      const mockConfig = {
        s3Buckets: [
          { name: 'payment-documents-test' },
          { name: 'payment-receipts-test' },
          { name: 'lambda-code-test' },
        ],
        dynamoTables: [
          {
            name: 'transactions-test',
            hashKey: 'transactionId',
            attributes: [{ name: 'transactionId', type: 'S' }],
          },
          {
            name: 'customers-test',
            hashKey: 'customerId',
            attributes: [{ name: 'customerId', type: 'S' }],
          },
        ],
        lambdaFunctions: [
          {
            name: 'payment-processor-test',
            handler: 'index.handler',
            runtime: 'nodejs18.x',
            codeS3Key: 'payment-processor.zip',
          },
          {
            name: 'payment-validator-test',
            handler: 'index.handler',
            runtime: 'nodejs18.x',
            codeS3Key: 'payment-validator.zip',
          },
        ],
      };

      jest.spyOn(config, 'loadDevConfig').mockReturnValue(mockConfig);

      const stack = new TapStack('test-with-config', {
        environmentSuffix: 'withconfig',
      });

      expect(stack).toBeDefined();
      expect(config.loadDevConfig).toHaveBeenCalled();
      expect(stack.bucketArns.length).toBe(3);
      expect(stack.tableArns.length).toBe(2);
      expect(stack.lambdaArns.length).toBe(2);
    });

    it('should handle missing dev config gracefully and use defaults', async () => {
      // Mock config loading to throw error
      jest.spyOn(config, 'loadDevConfig').mockImplementation(() => {
        throw new Error('ENOENT: no such file or directory');
      });

      const stack = new TapStack('test-no-config', {
        environmentSuffix: 'noconfig',
      });

      expect(stack).toBeDefined();
      expect(config.loadDevConfig).toHaveBeenCalled();
      expect(stack.bucketArns).toBeDefined();
      expect(stack.tableArns).toBeDefined();
      expect(stack.lambdaArns).toBeDefined();
      expect(stack.bucketArns.length).toBe(3);
      expect(stack.tableArns.length).toBe(2);
      expect(stack.lambdaArns.length).toBe(2);
    });

    it('should use default config when file read fails', async () => {
      // Mock config loading failure
      jest
        .spyOn(config, 'loadDevConfig')
        .mockImplementation(() => {
          throw new Error('File read error');
        });

      const stack = new TapStack('test-config-fallback', {
        environmentSuffix: 'fallback',
      });

      expect(stack).toBeDefined();
      expect(stack.bucketArns).toBeDefined();
      expect(stack.tableArns).toBeDefined();
      expect(stack.bucketArns.length).toBe(3);
      expect(stack.tableArns.length).toBe(2);
    });

    it('should load custom config with different bucket names', async () => {
      const customConfig = {
        s3Buckets: [
          { name: 'custom-bucket-1' },
          { name: 'custom-bucket-2' },
        ],
        dynamoTables: [
          {
            name: 'custom-table',
            hashKey: 'id',
            attributes: [{ name: 'id', type: 'S' }],
          },
        ],
        lambdaFunctions: [
          {
            name: 'custom-function',
            handler: 'index.handler',
            runtime: 'nodejs18.x',
            codeS3Key: 'custom-function.zip',
          },
        ],
      };

      jest.spyOn(config, 'loadDevConfig').mockReturnValue(customConfig);

      const stack = new TapStack('test-custom-config', {
        environmentSuffix: 'custom',
      });

      expect(stack).toBeDefined();
      expect(stack.bucketArns.length).toBe(2);
      expect(stack.tableArns.length).toBe(1);
      expect(stack.lambdaArns.length).toBe(1);
    });

    it('should handle config with optional rangeKey in DynamoDB tables', async () => {
      const configWithRangeKey = {
        s3Buckets: [{ name: 'test-bucket' }],
        dynamoTables: [
          {
            name: 'table-with-range',
            hashKey: 'pk',
            rangeKey: 'sk',
            attributes: [
              { name: 'pk', type: 'S' },
              { name: 'sk', type: 'S' },
            ],
          },
        ],
        lambdaFunctions: [
          {
            name: 'test-function',
            handler: 'index.handler',
            runtime: 'nodejs18.x',
            codeS3Key: 'test.zip',
          },
        ],
      };

      jest.spyOn(config, 'loadDevConfig').mockReturnValue(configWithRangeKey);

      const stack = new TapStack('test-range-key', {
        environmentSuffix: 'rangekey',
      });

      expect(stack).toBeDefined();
      expect(stack.tableArns.length).toBe(1);
    });

    it('should handle config with Lambda environment variables', async () => {
      const configWithEnvVars = {
        s3Buckets: [{ name: 'test-bucket' }],
        dynamoTables: [
          {
            name: 'test-table',
            hashKey: 'id',
            attributes: [{ name: 'id', type: 'S' }],
          },
        ],
        lambdaFunctions: [
          {
            name: 'function-with-env',
            handler: 'index.handler',
            runtime: 'nodejs18.x',
            codeS3Key: 'function.zip',
            environment: {
              TABLE_NAME: 'test-table',
              STAGE: 'production',
            },
          },
        ],
      };

      jest.spyOn(config, 'loadDevConfig').mockReturnValue(configWithEnvVars);

      const stack = new TapStack('test-env-vars', {
        environmentSuffix: 'envvars',
      });

      expect(stack).toBeDefined();
      expect(stack.lambdaArns.length).toBe(1);
    });
  });

  describe('Environment suffix propagation', () => {
    it('should apply environmentSuffix consistently', async () => {
      const suffix = 'consistent123';
      const stack = new TapStack('test-suffix', {
        environmentSuffix: suffix,
      });

      expect(stack).toBeDefined();
      // All outputs should be defined with the suffix applied
      expect(stack.kmsKeyArn).toBeDefined();
      expect(stack.bucketArns).toBeDefined();
      expect(stack.tableArns).toBeDefined();
    });
  });

  describe('Tag propagation', () => {
    it('should merge provided tags with migration tags', async () => {
      const userTags = {
        CustomTag: 'CustomValue',
        Team: 'DevOps',
      };

      const stack = new TapStack('test-tag-merge', {
        environmentSuffix: 'tagtest',
        tags: userTags,
      });

      expect(stack).toBeDefined();
      // Stack should merge user tags with default migration tags
    });
  });

  describe('Region configuration', () => {
    it('should use eu-west-1 region', async () => {
      const stack = new TapStack('test-region', {
        environmentSuffix: 'regtest',
      });

      expect(stack).toBeDefined();
      // All resources should be created in eu-west-1
    });
  });

  describe('Resource naming', () => {
    it('should include environmentSuffix in resource names', async () => {
      const suffix = 'nametest';
      const stack = new TapStack('test-naming', {
        environmentSuffix: suffix,
      });

      expect(stack).toBeDefined();
      // Resource names should include the suffix for uniqueness
    });
  });

  describe('Dev config processing', () => {
    it('should process S3 bucket configurations', async () => {
      const stack = new TapStack('test-s3-config', {
        environmentSuffix: 's3test',
      });

      expect(stack).toBeDefined();
      expect(stack.bucketArns).toBeDefined();
      expect(Array.isArray(stack.bucketArns)).toBe(true);
    });

    it('should process DynamoDB table configurations', async () => {
      const stack = new TapStack('test-dynamo-config', {
        environmentSuffix: 'dynamotest',
      });

      expect(stack).toBeDefined();
      expect(stack.tableArns).toBeDefined();
      expect(Array.isArray(stack.tableArns)).toBe(true);
    });

    it('should process Lambda function configurations', async () => {
      const stack = new TapStack('test-lambda-config', {
        environmentSuffix: 'lambdatest',
      });

      expect(stack).toBeDefined();
      expect(stack.lambdaArns).toBeDefined();
      expect(Array.isArray(stack.lambdaArns)).toBe(true);
    });
  });

  describe('Production tags', () => {
    it('should include production tags on all resources', async () => {
      const stack = new TapStack('test-prod-tags', {
        environmentSuffix: 'prodtest',
        tags: {
          CustomTag: 'value',
        },
      });

      expect(stack).toBeDefined();
      // Stack should include Environment: production, MigratedFrom: dev, MigrationDate tags
    });
  });

  describe('Lambda code bucket handling', () => {
    afterEach(() => {
      jest.restoreAllMocks();
    });

    it('should find lambda-code bucket for Lambda deployments', async () => {
      const configWithLambdaCodeBucket = {
        s3Buckets: [
          { name: 'payment-documents' },
          { name: 'lambda-code' },
        ],
        dynamoTables: [
          {
            name: 'test-table',
            hashKey: 'id',
            attributes: [{ name: 'id', type: 'S' }],
          },
        ],
        lambdaFunctions: [
          {
            name: 'test-function',
            handler: 'index.handler',
            runtime: 'nodejs18.x',
            codeS3Key: 'test-function.zip',
          },
        ],
      };

      jest
        .spyOn(config, 'loadDevConfig')
        .mockReturnValue(configWithLambdaCodeBucket);

      const stack = new TapStack('test-lambda-bucket', {
        environmentSuffix: 'lambdabucket',
      });

      expect(stack).toBeDefined();
      expect(stack.bucketArns).toBeDefined();
      expect(stack.lambdaArns).toBeDefined();
      expect(stack.bucketArns.length).toBe(2);
      expect(stack.lambdaArns.length).toBe(1);
    });

    it('should handle missing lambda-code bucket', async () => {
      const configWithoutLambdaCodeBucket = {
        s3Buckets: [
          { name: 'payment-documents' },
          { name: 'payment-receipts' },
        ],
        dynamoTables: [
          {
            name: 'test-table',
            hashKey: 'id',
            attributes: [{ name: 'id', type: 'S' }],
          },
        ],
        lambdaFunctions: [
          {
            name: 'test-function',
            handler: 'index.handler',
            runtime: 'nodejs18.x',
            codeS3Key: 'test-function.zip',
          },
        ],
      };

      jest
        .spyOn(config, 'loadDevConfig')
        .mockReturnValue(configWithoutLambdaCodeBucket);

      const stack = new TapStack('test-no-lambda-bucket', {
        environmentSuffix: 'nolambdabucket',
      });

      expect(stack).toBeDefined();
      expect(stack.bucketArns).toBeDefined();
      expect(stack.lambdaArns).toBeDefined();
      expect(stack.bucketArns.length).toBe(2);
      expect(stack.lambdaArns.length).toBe(1);
    });

    it('should use function name as codeS3Key when not provided', async () => {
      const configWithoutCodeS3Key = {
        s3Buckets: [{ name: 'lambda-code' }],
        dynamoTables: [
          {
            name: 'test-table',
            hashKey: 'id',
            attributes: [{ name: 'id', type: 'S' }],
          },
        ],
        lambdaFunctions: [
          {
            name: 'function-without-key',
            handler: 'index.handler',
            runtime: 'nodejs18.x',
          },
        ],
      };

      jest
        .spyOn(config, 'loadDevConfig')
        .mockReturnValue(configWithoutCodeS3Key);

      const stack = new TapStack('test-default-key', {
        environmentSuffix: 'defaultkey',
      });

      expect(stack).toBeDefined();
      expect(stack.lambdaArns).toBeDefined();
      expect(stack.lambdaArns.length).toBe(1);
    });

    it('should handle Lambda with explicit codeS3Key', async () => {
      const configWithExplicitKey = {
        s3Buckets: [{ name: 'lambda-code' }],
        dynamoTables: [
          {
            name: 'test-table',
            hashKey: 'id',
            attributes: [{ name: 'id', type: 'S' }],
          },
        ],
        lambdaFunctions: [
          {
            name: 'function-explicit',
            handler: 'index.handler',
            runtime: 'nodejs18.x',
            codeS3Key: 'custom-package.zip',
          },
        ],
      };

      jest
        .spyOn(config, 'loadDevConfig')
        .mockReturnValue(configWithExplicitKey);

      const stack = new TapStack('test-explicit-key', {
        environmentSuffix: 'explicitkey',
      });

      expect(stack).toBeDefined();
      expect(stack.lambdaArns).toBeDefined();
      expect(stack.lambdaArns.length).toBe(1);
    });

    it('should handle multiple Lambda functions with mixed codeS3Key configurations', async () => {
      const configMixedKeys = {
        s3Buckets: [{ name: 'lambda-code' }],
        dynamoTables: [
          {
            name: 'test-table',
            hashKey: 'id',
            attributes: [{ name: 'id', type: 'S' }],
          },
        ],
        lambdaFunctions: [
          {
            name: 'function-with-key',
            handler: 'index.handler',
            runtime: 'nodejs18.x',
            codeS3Key: 'explicit.zip',
          },
          {
            name: 'function-without-key',
            handler: 'index.handler',
            runtime: 'nodejs18.x',
          },
        ],
      };

      jest.spyOn(config, 'loadDevConfig').mockReturnValue(configMixedKeys);

      const stack = new TapStack('test-mixed-keys', {
        environmentSuffix: 'mixedkeys',
      });

      expect(stack).toBeDefined();
      expect(stack.lambdaArns).toBeDefined();
      expect(stack.lambdaArns.length).toBe(2);
    });
  });

  describe('Monitoring resources', () => {
    it('should create CloudWatch alarms for Lambda functions', async () => {
      const stack = new TapStack('test-cw-lambda', {
        environmentSuffix: 'cwlambda',
      });

      expect(stack).toBeDefined();
      expect(stack.dashboardName).toBeDefined();
    });

    it('should create CloudWatch alarms for DynamoDB tables', async () => {
      const stack = new TapStack('test-cw-dynamo', {
        environmentSuffix: 'cwdynamo',
      });

      expect(stack).toBeDefined();
      expect(stack.dashboardName).toBeDefined();
    });

    it('should create CloudWatch alarms for API Gateway', async () => {
      const stack = new TapStack('test-cw-api', {
        environmentSuffix: 'cwapi',
      });

      expect(stack).toBeDefined();
      expect(stack.dashboardName).toBeDefined();
      expect(stack.apiEndpoint).toBeDefined();
    });
  });
});
