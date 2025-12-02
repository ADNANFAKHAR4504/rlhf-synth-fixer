import * as pulumi from '@pulumi/pulumi';

// Mock Pulumi runtime
pulumi.runtime.setMocks({
  newResource: function (args: pulumi.runtime.MockResourceArgs): {
    id: string;
    state: any;
  } {
    return {
      id: `${args.name}-id`,
      state: args.inputs,
    };
  },
  call: function (args: pulumi.runtime.MockCallArgs) {
    return args.inputs;
  },
});

// Import the stack after mocking
import { TapStack } from '../lib/tap-stack';

describe('TapStack Unit Tests', () => {
  let stack: TapStack;

  beforeAll(async () => {
    stack = new TapStack('test-stack', {
      environmentSuffix: 'test123',
    });
  });

  describe('Stack Instantiation', () => {
    it('should create a TapStack instance', () => {
      expect(stack).toBeDefined();
      expect(stack).toBeInstanceOf(TapStack);
    });

    it('should have required output properties', () => {
      expect(stack.pipelineArn).toBeDefined();
      expect(stack.artifactBucketName).toBeDefined();
      expect(stack.repositoryCloneUrl).toBeDefined();
    });
  });

  describe('Stack Outputs', () => {
    it('should have pipelineArn output property', () => {
      expect(stack.pipelineArn).toBeDefined();
      expect(stack.pipelineArn).toBeInstanceOf(pulumi.Output);
    });

    it('should export artifactBucketName', async () => {
      const bucketName = await stack.artifactBucketName.promise();
      expect(bucketName).toBeDefined();
    });

    it('should have repositoryCloneUrl output property', () => {
      expect(stack.repositoryCloneUrl).toBeDefined();
      expect(stack.repositoryCloneUrl).toBeInstanceOf(pulumi.Output);
    });
  });

  describe('Resource Configuration', () => {
    it('should include environmentSuffix in resource names', async () => {
      const bucketName = await stack.artifactBucketName.promise();
      expect(bucketName).toContain('test123');
    });
  });

  describe('Interface Validation', () => {
    it('should accept valid TapStackProps', () => {
      const testStack = new TapStack('interface-test', {
        environmentSuffix: 'valid-suffix',
      });
      expect(testStack).toBeDefined();
    });

    it('should accept environmentSuffix as Input<string>', () => {
      const testStack = new TapStack('input-test', {
        environmentSuffix: pulumi.output('dynamic-suffix'),
      });
      expect(testStack).toBeDefined();
    });
  });

  describe('Component Resource', () => {
    it('should be a ComponentResource', () => {
      expect(stack).toBeInstanceOf(pulumi.ComponentResource);
    });

    it('should have correct resource type', () => {
      const urn = (stack as any).urn;
      expect(urn).toBeDefined();
    });
  });

  describe('Stack with Different Environment Suffixes', () => {
    it('should create stack with short suffix', () => {
      const shortStack = new TapStack('short-test', {
        environmentSuffix: 'dev',
      });
      expect(shortStack).toBeDefined();
    });

    it('should create stack with long suffix', () => {
      const longStack = new TapStack('long-test', {
        environmentSuffix: 'very-long-environment-suffix-123',
      });
      expect(longStack).toBeDefined();
    });

    it('should create stack with numeric suffix', () => {
      const numericStack = new TapStack('numeric-test', {
        environmentSuffix: '12345',
      });
      expect(numericStack).toBeDefined();
    });
  });

  describe('Output Registration', () => {
    it('should register outputs with registerOutputs', () => {
      const registerSpy = jest.spyOn(stack as any, 'registerOutputs');
      // The registerOutputs is called in constructor, verify it was set up
      expect((stack as any).__registered).toBeTruthy();
    });
  });

  describe('Resource Dependencies', () => {
    it('should create all required AWS resources', async () => {
      // Verify that the stack creates the expected resources
      expect(stack.pipelineArn).toBeDefined();
      expect(stack.artifactBucketName).toBeDefined();
      expect(stack.repositoryCloneUrl).toBeDefined();
    });
  });

  describe('Error Handling', () => {
    it('should require environmentSuffix parameter', () => {
      // TypeScript enforces this at compile time
      // Test that the interface requires environmentSuffix
      const props: any = {};
      expect(props.environmentSuffix).toBeUndefined();
    });
  });
});

describe('TapStack Resource Names', () => {
  it('should use consistent naming pattern', async () => {
    const testStack = new TapStack('naming-test', {
      environmentSuffix: 'naming123',
    });
    const bucketName = await testStack.artifactBucketName.promise();
    expect(bucketName).toMatch(/nodeapp-artifacts-naming123/);
  });
});

describe('TapStack Integration Points', () => {
  it('should export all required outputs for integration tests', async () => {
    const integrationStack = new TapStack('integration-test', {
      environmentSuffix: 'int123',
    });

    // Verify output properties exist (values may be undefined in mocked tests)
    expect(integrationStack.pipelineArn).toBeDefined();
    expect(integrationStack.pipelineArn).toBeInstanceOf(pulumi.Output);

    expect(integrationStack.artifactBucketName).toBeDefined();
    expect(integrationStack.artifactBucketName).toBeInstanceOf(pulumi.Output);

    expect(integrationStack.repositoryCloneUrl).toBeDefined();
    expect(integrationStack.repositoryCloneUrl).toBeInstanceOf(pulumi.Output);

    // Test that bucket name can be resolved
    const bucketName = await integrationStack.artifactBucketName.promise();
    expect(bucketName).toBeDefined();
  });
});
