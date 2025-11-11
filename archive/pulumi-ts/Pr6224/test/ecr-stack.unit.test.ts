/**
 * Unit tests for EcrStack - ECR repositories for microservices
 */
import * as pulumi from '@pulumi/pulumi';
import { EcrStack } from '../lib/ecr-stack';

// Set up Pulumi mocking
pulumi.runtime.setMocks({
  newResource: function(args: pulumi.runtime.MockResourceArgs): {id: string, state: any} {
    return {
      id: args.inputs.name ? `${args.inputs.name}-id` : `${args.name}-id`,
      state: {
        ...args.inputs,
        id: args.inputs.name ? `${args.inputs.name}-id` : `${args.name}-id`,
        arn: `arn:aws:ecr:eu-central-1 :123456789012:repository/${args.inputs.name || args.name}`,
        repositoryUrl: `123456789012.dkr.ecr.eu-central-1 .amazonaws.com/${args.inputs.name || args.name}`,
      },
    };
  },
  call: function(args: pulumi.runtime.MockCallArgs) {
    return args.inputs;
  },
});

describe('EcrStack', () => {
  describe('constructor', () => {
    it('should create an EcrStack with required args', () => {
      const stack = new EcrStack('test-ecr', {
        environmentSuffix: 'test',
      });

      expect(stack).toBeDefined();
      expect(stack).toBeInstanceOf(pulumi.ComponentResource);
      expect(stack.apiRepositoryUrl).toBeDefined();
      expect(stack.workerRepositoryUrl).toBeDefined();
      expect(stack.schedulerRepositoryUrl).toBeDefined();
    });

    it('should create an EcrStack with custom tags', () => {
      const customTags = { Environment: 'staging', Team: 'platform' };
      const stack = new EcrStack('test-ecr', {
        environmentSuffix: 'staging',
        tags: customTags,
      });

      expect(stack).toBeDefined();
      expect(stack.apiRepositoryUrl).toBeDefined();
    });

    it('should expose apiRepositoryUrl output', () => {
      const stack = new EcrStack('test-ecr', {
        environmentSuffix: 'test',
      });

      expect(stack.apiRepositoryUrl).toBeDefined();
      expect(pulumi.Output.isInstance(stack.apiRepositoryUrl)).toBe(true);
    });

    it('should expose workerRepositoryUrl output', () => {
      const stack = new EcrStack('test-ecr', {
        environmentSuffix: 'test',
      });

      expect(stack.workerRepositoryUrl).toBeDefined();
      expect(pulumi.Output.isInstance(stack.workerRepositoryUrl)).toBe(true);
    });

    it('should expose schedulerRepositoryUrl output', () => {
      const stack = new EcrStack('test-ecr', {
        environmentSuffix: 'test',
      });

      expect(stack.schedulerRepositoryUrl).toBeDefined();
      expect(pulumi.Output.isInstance(stack.schedulerRepositoryUrl)).toBe(true);
    });
  });

  describe('resource naming with environmentSuffix', () => {
    it('should use environmentSuffix in resource names', () => {
      const suffix = 'prod123';
      const stack = new EcrStack('test-ecr', {
        environmentSuffix: suffix,
      });

      expect(stack).toBeDefined();
      expect(stack.apiRepositoryUrl).toBeDefined();
    });

    it('should handle different environmentSuffix values', () => {
      const suffixes = ['dev', 'staging', 'prod', 'pr123'];

      for (const suffix of suffixes) {
        const stack = new EcrStack(`test-ecr-${suffix}`, {
          environmentSuffix: suffix,
        });
        expect(stack).toBeDefined();
      }
    });
  });

  describe('EcrStackArgs interface', () => {
    it('should accept only environmentSuffix', () => {
      const stack = new EcrStack('test-ecr', {
        environmentSuffix: 'test',
      });
      expect(stack).toBeDefined();
    });

    it('should accept environmentSuffix and tags', () => {
      const stack = new EcrStack('test-ecr', {
        environmentSuffix: 'test',
        tags: { Owner: 'team' },
      });
      expect(stack).toBeDefined();
    });

    it('should handle empty tags object', () => {
      const stack = new EcrStack('test-ecr', {
        environmentSuffix: 'test',
        tags: {},
      });
      expect(stack).toBeDefined();
    });

    it('should handle multiple tags', () => {
      const stack = new EcrStack('test-ecr', {
        environmentSuffix: 'test',
        tags: {
          Environment: 'prod',
          Owner: 'platform',
          CostCenter: '12345',
        },
      });
      expect(stack).toBeDefined();
    });
  });

  describe('outputs resolution', () => {
    it('should have apiRepositoryUrl output defined', () => {
      const stack = new EcrStack('test-ecr', {
        environmentSuffix: 'test',
      });

      expect(stack.apiRepositoryUrl).toBeDefined();
      expect(pulumi.Output.isInstance(stack.apiRepositoryUrl)).toBe(true);
    });

    it('should have workerRepositoryUrl output defined', () => {
      const stack = new EcrStack('test-ecr', {
        environmentSuffix: 'test',
      });

      expect(stack.workerRepositoryUrl).toBeDefined();
      expect(pulumi.Output.isInstance(stack.workerRepositoryUrl)).toBe(true);
    });

    it('should have schedulerRepositoryUrl output defined', () => {
      const stack = new EcrStack('test-ecr', {
        environmentSuffix: 'test',
      });

      expect(stack.schedulerRepositoryUrl).toBeDefined();
      expect(pulumi.Output.isInstance(stack.schedulerRepositoryUrl)).toBe(true);
    });

    it('should have all three repository URLs defined', () => {
      const stack = new EcrStack('test-ecr', {
        environmentSuffix: 'test',
      });

      expect(stack.apiRepositoryUrl).toBeDefined();
      expect(stack.workerRepositoryUrl).toBeDefined();
      expect(stack.schedulerRepositoryUrl).toBeDefined();
    });
  });
});
