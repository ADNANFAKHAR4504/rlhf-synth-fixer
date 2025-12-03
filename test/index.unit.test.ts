import * as pulumi from '@pulumi/pulumi';

// Set up Pulumi mocks
pulumi.runtime.setMocks({
  newResource: function (args: pulumi.runtime.MockResourceArgs): {
    id: string;
    state: any;
  } {
    const outputs: Record<string, any> = {
      ...args.inputs,
      id: `${args.name}-id`,
      arn: `arn:aws:${args.type}:us-east-1:123456789012:${args.name}`,
      name: args.inputs.name || args.name,
    };

    // Add type-specific outputs
    if (args.type === 'aws:ecr/repository:Repository') {
      outputs.repositoryUrl = `123456789012.dkr.ecr.us-east-1.amazonaws.com/${args.inputs.name}`;
    } else if (args.type === 'aws:s3/bucketV2:BucketV2') {
      outputs.bucket = args.inputs.bucket || `${args.name}-bucket`;
    } else if (args.type === 'aws:codepipeline/pipeline:Pipeline') {
      outputs.arn = `arn:aws:codepipeline:us-east-1:123456789012:${args.inputs.name}`;
    } else if (args.type === 'aws:lambda/function:Function') {
      outputs.functionName = args.inputs.name;
    }

    return {
      id: outputs.id,
      state: outputs,
    };
  },
  call: function (args: pulumi.runtime.MockCallArgs) {
    if (args.token === 'aws:index/getCallerIdentity:getCallerIdentity') {
      return {
        accountId: '123456789012',
        arn: 'arn:aws:iam::123456789012:user/test',
        userId: 'AIDACKCEVSQ6C2EXAMPLE',
      };
    } else if (args.token === 'aws:index/getRegion:getRegion') {
      return {
        name: 'us-east-1',
      };
    }
    return args.inputs;
  },
});

describe('CI/CD Pipeline Integration Stack', () => {
  describe('Stack Class Tests', () => {
    it('should create stack class successfully', () => {
      // Test that the module can be loaded
      const { CiCdPipelineStack } = require('../lib/index');
      expect(CiCdPipelineStack).toBeDefined();
      expect(typeof CiCdPipelineStack).toBe('function');
    });

    it('should create stack instance with environment suffix', () => {
      const { CiCdPipelineStack } = require('../lib/index');
      const stack = new CiCdPipelineStack('test-env');

      expect(stack).toBeDefined();
      expect(stack.pipelineArn).toBeDefined();
      expect(stack.pipelineUrl).toBeDefined();
      expect(stack.ecrRepositoryUri).toBeDefined();
      expect(stack.lambdaFunctionArn).toBeDefined();
      expect(stack.deploymentTableName).toBeDefined();
    });

    it('should create all required outputs as Pulumi Outputs', () => {
      const { CiCdPipelineStack } = require('../lib/index');
      const stack = new CiCdPipelineStack('output-test');

      // Verify all outputs are Pulumi Outputs
      expect(stack.pipelineArn).toHaveProperty('apply');
      expect(stack.pipelineUrl).toHaveProperty('apply');
      expect(stack.ecrRepositoryUri).toHaveProperty('apply');
      expect(stack.lambdaFunctionArn).toHaveProperty('apply');
      expect(stack.deploymentTableName).toHaveProperty('apply');
    });

    it('should use environment suffix in resource naming', done => {
      const { CiCdPipelineStack } = require('../lib/index');
      const stack = new CiCdPipelineStack('naming-test');

      stack.deploymentTableName.apply((name: string) => {
        expect(name).toContain('naming-test');
        done();
      });
    });

    it('should generate valid ECR repository URI', done => {
      const { CiCdPipelineStack } = require('../lib/index');
      const stack = new CiCdPipelineStack('ecr-test');

      stack.ecrRepositoryUri.apply((uri: string) => {
        expect(uri).toContain('dkr.ecr');
        expect(uri).toContain('amazonaws.com');
        expect(uri).toMatch(/^\d+\.dkr\.ecr\..+\.amazonaws\.com\/.+$/);
        done();
      });
    });

    it('should generate valid pipeline console URL', done => {
      const { CiCdPipelineStack } = require('../lib/index');
      const stack = new CiCdPipelineStack('url-test');

      stack.pipelineUrl.apply((url: string) => {
        expect(url).toContain('console.aws.amazon.com');
        expect(url).toContain('codepipeline');
        expect(url).toContain('us-east-1');
        done();
      });
    });

    it('should generate valid pipeline ARN', done => {
      const { CiCdPipelineStack } = require('../lib/index');
      const stack = new CiCdPipelineStack('arn-test');

      stack.pipelineArn.apply((arn: string) => {
        expect(arn).toBeDefined();
        expect(arn).toContain('arn:aws:codepipeline');
        expect(arn).toContain('us-east-1');
        done();
      });
    });

    it('should generate valid Lambda function ARN', done => {
      const { CiCdPipelineStack } = require('../lib/index');
      const stack = new CiCdPipelineStack('lambda-test');

      stack.lambdaFunctionArn.apply((arn: string) => {
        expect(arn).toBeDefined();
        expect(arn).toContain('arn:aws');
        done();
      });
    });

    it('should handle empty environment suffix', () => {
      const { CiCdPipelineStack } = require('../lib/index');
      const stack = new CiCdPipelineStack('');

      expect(stack.pipelineArn).toBeDefined();
      expect(stack.pipelineUrl).toBeDefined();
      expect(stack.ecrRepositoryUri).toBeDefined();
      expect(stack.lambdaFunctionArn).toBeDefined();
      expect(stack.deploymentTableName).toBeDefined();
    });

    it('should resolve all outputs to strings', async () => {
      const { CiCdPipelineStack } = require('../lib/index');
      const stack = new CiCdPipelineStack('resolve-test');

      const [pipelineArn, pipelineUrl, ecrUri, lambdaArn, tableName] =
        await Promise.all([
          new Promise<string>(resolve => {
            stack.pipelineArn.apply((v: string) => resolve(v));
          }),
          new Promise<string>(resolve => {
            stack.pipelineUrl.apply((v: string) => resolve(v));
          }),
          new Promise<string>(resolve => {
            stack.ecrRepositoryUri.apply((v: string) => resolve(v));
          }),
          new Promise<string>(resolve => {
            stack.lambdaFunctionArn.apply((v: string) => resolve(v));
          }),
          new Promise<string>(resolve => {
            stack.deploymentTableName.apply((v: string) => resolve(v));
          }),
        ]);

      expect(typeof pipelineArn).toBe('string');
      expect(typeof pipelineUrl).toBe('string');
      expect(typeof ecrUri).toBe('string');
      expect(typeof lambdaArn).toBe('string');
      expect(typeof tableName).toBe('string');

      // Verify all are non-empty
      expect(pipelineArn.length).toBeGreaterThan(0);
      expect(pipelineUrl.length).toBeGreaterThan(0);
      expect(ecrUri.length).toBeGreaterThan(0);
      expect(lambdaArn.length).toBeGreaterThan(0);
      expect(tableName.length).toBeGreaterThan(0);
    });

    it('should create multiple stack instances independently', () => {
      const { CiCdPipelineStack } = require('../lib/index');
      const stack1 = new CiCdPipelineStack('env1');
      const stack2 = new CiCdPipelineStack('env2');

      expect(stack1).not.toBe(stack2);
      expect(stack1.pipelineArn).toBeDefined();
      expect(stack2.pipelineArn).toBeDefined();
    });

    it('should validate pipeline ARN format in outputs', done => {
      const { CiCdPipelineStack } = require('../lib/index');
      const stack = new CiCdPipelineStack('format-test');

      stack.pipelineArn.apply((arn: string) => {
        const arnPattern =
          /^arn:aws:codepipeline:[a-z0-9-]+:\d+:[a-zA-Z0-9-]+$/;
        expect(arn).toMatch(arnPattern);
        done();
      });
    });

    it('should validate ECR URI format in outputs', done => {
      const { CiCdPipelineStack } = require('../lib/index');
      const stack = new CiCdPipelineStack('ecr-format-test');

      stack.ecrRepositoryUri.apply((uri: string) => {
        const ecrPattern =
          /^\d+\.dkr\.ecr\.[a-z0-9-]+\.amazonaws\.com\/[a-zA-Z0-9-]+$/;
        expect(uri).toMatch(ecrPattern);
        done();
      });
    });

    it('should include environment suffix consistently', async () => {
      const { CiCdPipelineStack } = require('../lib/index');
      const suffix = 'consistency-test';
      const stack = new CiCdPipelineStack(suffix);

      const tableName = await new Promise<string>(resolve => {
        stack.deploymentTableName.apply((name: string) => {
          resolve(name);
        });
      });

      expect(tableName).toContain(suffix);
    });

    it('should create resources with proper Pulumi dependencies', () => {
      const { CiCdPipelineStack } = require('../lib/index');
      const stack = new CiCdPipelineStack('deps-test');

      // All outputs should be defined (indicating resources were created)
      expect(stack.pipelineArn).toBeDefined();
      expect(stack.ecrRepositoryUri).toBeDefined();
      expect(stack.lambdaFunctionArn).toBeDefined();
      expect(stack.deploymentTableName).toBeDefined();

      // All should be Pulumi Outputs (proper dependency tracking)
      expect(stack.pipelineArn.constructor.name).toContain('Output');
      expect(stack.ecrRepositoryUri.constructor.name).toContain('Output');
      expect(stack.lambdaFunctionArn.constructor.name).toContain('Output');
      expect(stack.deploymentTableName.constructor.name).toContain('Output');
    });
  });
});
