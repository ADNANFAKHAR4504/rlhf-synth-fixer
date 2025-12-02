import * as pulumi from '@pulumi/pulumi';

// Set up mocking before importing TapStack
pulumi.runtime.setMocks({
  newResource: (args: pulumi.runtime.MockResourceArgs): { id: string; state: any } => {
    const mockState: any = {
      ...args.inputs,
      arn: `arn:aws:service:us-east-1:123456789012:${args.type}/${args.name}`,
      id: `${args.name}_id`,
    };

    // S3 Bucket specific mocks
    if (args.type === 'aws:s3/bucket:Bucket') {
      mockState.bucket = args.inputs.bucket || `${args.name}-bucket`;
      mockState.arn = `arn:aws:s3:::${mockState.bucket}`;
    }

    // ECR Repository specific mocks
    if (args.type === 'aws:ecr/repository:Repository') {
      mockState.name = args.inputs.name || args.name;
      mockState.repositoryUrl = `123456789012.dkr.ecr.us-east-1.amazonaws.com/${mockState.name}`;
      mockState.arn = `arn:aws:ecr:us-east-1:123456789012:repository/${mockState.name}`;
    }

    // CodeBuild Project specific mocks
    if (args.type === 'aws:codebuild/project:Project') {
      mockState.name = args.inputs.name || args.name;
      mockState.arn = `arn:aws:codebuild:us-east-1:123456789012:project/${mockState.name}`;
    }

    // CodePipeline specific mocks
    if (args.type === 'aws:codepipeline/pipeline:Pipeline') {
      mockState.name = args.inputs.name || args.name;
      mockState.arn = `arn:aws:codepipeline:us-east-1:123456789012:${mockState.name}`;
    }

    // IAM Role specific mocks
    if (args.type === 'aws:iam/role:Role') {
      mockState.name = args.inputs.name || args.name;
      mockState.arn = `arn:aws:iam::123456789012:role/${mockState.name}`;
    }

    // CloudWatch Log Group specific mocks
    if (args.type === 'aws:cloudwatch/logGroup:LogGroup') {
      mockState.name = args.inputs.name || args.name;
      mockState.arn = `arn:aws:logs:us-east-1:123456789012:log-group:${mockState.name}`;
    }

    // SNS Topic specific mocks
    if (args.type === 'aws:sns/topic:Topic') {
      mockState.name = args.inputs.name || args.name;
      mockState.arn = `arn:aws:sns:us-east-1:123456789012:${mockState.name}`;
    }

    return {
      id: `${args.name}_id`,
      state: mockState,
    };
  },
  call: (args: pulumi.runtime.MockCallArgs) => {
    if (args.token === 'aws:index/getCallerIdentity:getCallerIdentity') {
      return {
        accountId: '123456789012',
        arn: 'arn:aws:iam::123456789012:user/test',
        userId: 'AIDACKCEVSQ6C2EXAMPLE',
      };
    }
    return args.inputs;
  },
});

import { TapStack } from '../lib/tap-stack';

describe('TapStack Unit Tests', () => {
  let stack: TapStack;
  const testEnvironmentSuffix = 'test123';

  beforeAll(async () => {
    stack = new TapStack('tap-stack', {
      environmentSuffix: testEnvironmentSuffix,
    });
  });

  describe('Stack Instantiation', () => {
    it('should create a TapStack instance', () => {
      expect(stack).toBeDefined();
      expect(stack).toBeInstanceOf(pulumi.ComponentResource);
    });

    it('should have pipelineUrl output', () => {
      expect(stack.pipelineUrl).toBeDefined();
    });

    it('should have ecrRepositoryUri output', () => {
      expect(stack.ecrRepositoryUri).toBeDefined();
    });
  });

  describe('Output Values', () => {
    it('should generate correct pipeline URL format', (done) => {
      stack.pipelineUrl.apply((url) => {
        expect(url).toContain('https://console.aws.amazon.com/codesuite/codepipeline/pipelines/');
        expect(url).toContain('ci-pipeline');
        expect(url).toContain('region=us-east-1');
        done();
        return url;
      });
    });

    it('should generate correct ECR repository URI format', (done) => {
      stack.ecrRepositoryUri.apply((uri) => {
        expect(uri).toContain('.dkr.ecr.us-east-1.amazonaws.com/');
        done();
        return uri;
      });
    });
  });

  describe('Constructor with different environmentSuffix values', () => {
    it('should handle empty environmentSuffix gracefully', () => {
      expect(() => {
        new TapStack('test-empty', { environmentSuffix: '' });
      }).not.toThrow();
    });

    it('should handle special characters in environmentSuffix', () => {
      expect(() => {
        new TapStack('test-special', { environmentSuffix: 'test-123-abc' });
      }).not.toThrow();
    });

    it('should handle long environmentSuffix', () => {
      expect(() => {
        new TapStack('test-long', { environmentSuffix: 'very-long-environment-suffix-for-testing' });
      }).not.toThrow();
    });

    it('should create stack with numeric environmentSuffix', () => {
      expect(() => {
        new TapStack('test-numeric', { environmentSuffix: '12345' });
      }).not.toThrow();
    });
  });

  describe('Component Resource Properties', () => {
    it('should be a ComponentResource', () => {
      expect(stack).toBeInstanceOf(pulumi.ComponentResource);
    });

    it('should have registered outputs', () => {
      expect(stack.pipelineUrl).toBeDefined();
      expect(stack.ecrRepositoryUri).toBeDefined();
    });
  });

  describe('Stack with pulumi.Input<string> environmentSuffix', () => {
    it('should accept Output<string> as environmentSuffix', () => {
      const outputSuffix = pulumi.output('test-output');
      expect(() => {
        new TapStack('test-output-suffix', { environmentSuffix: outputSuffix });
      }).not.toThrow();
    });

    it('should accept string literal as environmentSuffix', () => {
      expect(() => {
        new TapStack('test-literal-suffix', { environmentSuffix: 'literal-test' });
      }).not.toThrow();
    });
  });

  describe('Output type verification', () => {
    it('should have pipelineUrl as pulumi.Output', () => {
      expect(stack.pipelineUrl).toHaveProperty('apply');
      expect(typeof stack.pipelineUrl.apply).toBe('function');
    });

    it('should have ecrRepositoryUri as pulumi.Output', () => {
      expect(stack.ecrRepositoryUri).toHaveProperty('apply');
      expect(typeof stack.ecrRepositoryUri.apply).toBe('function');
    });
  });

  describe('URL generation logic', () => {
    it('should include pipeline name in URL', (done) => {
      stack.pipelineUrl.apply((url) => {
        expect(url).toMatch(/ci-pipeline-/);
        done();
        return url;
      });
    });

    it('should include region in URL', (done) => {
      stack.pipelineUrl.apply((url) => {
        expect(url).toContain('us-east-1');
        done();
        return url;
      });
    });

    it('should use AWS Console URL format', (done) => {
      stack.pipelineUrl.apply((url) => {
        expect(url.startsWith('https://console.aws.amazon.com/')).toBe(true);
        done();
        return url;
      });
    });
  });

  describe('ECR URI generation logic', () => {
    it('should include account ID in ECR URI', (done) => {
      stack.ecrRepositoryUri.apply((uri) => {
        expect(uri).toMatch(/\d{12}\.dkr\.ecr/);
        done();
        return uri;
      });
    });

    it('should include region in ECR URI', (done) => {
      stack.ecrRepositoryUri.apply((uri) => {
        expect(uri).toContain('us-east-1');
        done();
        return uri;
      });
    });

    it('should use ECR format', (done) => {
      stack.ecrRepositoryUri.apply((uri) => {
        expect(uri).toMatch(/\.dkr\.ecr\.us-east-1\.amazonaws\.com\//);
        done();
        return uri;
      });
    });
  });

  describe('Multiple stack instantiation', () => {
    it('should allow creating multiple stacks with different names', () => {
      const stack1 = new TapStack('stack-1', { environmentSuffix: 'env1' });
      const stack2 = new TapStack('stack-2', { environmentSuffix: 'env2' });

      expect(stack1).toBeDefined();
      expect(stack2).toBeDefined();
      expect(stack1).not.toBe(stack2);
    });

    it('should allow creating stacks with same environmentSuffix', () => {
      const stack3 = new TapStack('stack-3', { environmentSuffix: 'shared' });
      const stack4 = new TapStack('stack-4', { environmentSuffix: 'shared' });

      expect(stack3).toBeDefined();
      expect(stack4).toBeDefined();
    });
  });

  describe('Interface compliance', () => {
    it('should accept valid TapStackProps', () => {
      const props = { environmentSuffix: 'valid-test' };
      expect(() => {
        new TapStack('interface-test', props);
      }).not.toThrow();
    });

    it('should work with pulumi.Input<string> type', () => {
      const props: { environmentSuffix: pulumi.Input<string> } = {
        environmentSuffix: pulumi.output('input-test'),
      };
      expect(() => {
        new TapStack('input-test', props);
      }).not.toThrow();
    });
  });

  describe('Edge cases', () => {
    it('should handle environmentSuffix with dashes', () => {
      expect(() => {
        new TapStack('dash-test', { environmentSuffix: 'test-with-dashes' });
      }).not.toThrow();
    });

    it('should handle environmentSuffix with underscores', () => {
      expect(() => {
        new TapStack('underscore-test', { environmentSuffix: 'test_with_underscores' });
      }).not.toThrow();
    });

    it('should handle short environmentSuffix', () => {
      expect(() => {
        new TapStack('short-test', { environmentSuffix: 'a' });
      }).not.toThrow();
    });
  });

  describe('Output promises', () => {
    it('should resolve pipelineUrl promise', async () => {
      const url = await stack.pipelineUrl.promise();
      expect(url).toBeDefined();
      expect(typeof url).toBe('string');
    });

    it('should resolve ecrRepositoryUri promise', async () => {
      const uri = await stack.ecrRepositoryUri.promise();
      expect(uri).toBeDefined();
      expect(typeof uri).toBe('string');
    });
  });

  describe('Registered outputs', () => {
    it('should have correct output keys', () => {
      expect(stack.pipelineUrl).toBeDefined();
      expect(stack.ecrRepositoryUri).toBeDefined();
    });
  });
});
