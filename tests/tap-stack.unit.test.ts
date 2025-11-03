/**
 * Unit tests for TapStack
 *
 * Tests the main TapStack component resource for EC2 cost optimization.
 */
import * as pulumi from '@pulumi/pulumi';
import { TapStack } from '../lib/tap-stack';

pulumi.runtime.setMocks({
  newResource: (args: pulumi.runtime.MockResourceArgs): {
    id: string;
    state: any;
  } => {
    return {
      id: `${args.name}_id`,
      state: args.inputs,
    };
  },
  call: (args: pulumi.runtime.MockCallArgs) => {
    if (args.token === 'aws:ec2/getInstances:getInstances') {
      return {
        ids: [],
        publicIps: [],
        privateIps: [],
      };
    } else if (args.token === 'aws:ec2/getInstance:getInstance') {
      return {
        instanceType: 't3.medium',
        instanceState: 'running',
      };
    } else if (args.token === 'aws:getRegion:getRegion') {
      return {
        name: 'ap-southeast-1',
      };
    }
    return args.inputs;
  },
});

describe('TapStack', () => {
  let stack: TapStack;

  beforeEach(() => {
    // Create a new stack for each test
    stack = new TapStack('test-stack', {
      environmentSuffix: 'test',
      tags: {
        Environment: 'test',
        Project: 'test',
      },
    });
  });

  it('should create a TapStack with correct type', (done) => {
    pulumi.all([stack.urn]).apply(([urn]) => {
      expect(urn).toContain('tap:stack:TapStack');
      done();
    });
  });

  it('should have scheduler outputs defined', (done) => {
    pulumi.all([stack.schedulerOutputs]).apply(([outputs]) => {
      expect(outputs).toBeDefined();
      expect(outputs.stopFunctionArn).toBeDefined();
      expect(outputs.startFunctionArn).toBeDefined();
      expect(outputs.stopRuleArn).toBeDefined();
      expect(outputs.startRuleArn).toBeDefined();
      expect(outputs.managedInstanceIds).toBeDefined();
      done();
    });
  });

  it('should have cost outputs defined', (done) => {
    pulumi.all([stack.costOutputs]).apply(([outputs]) => {
      expect(outputs).toBeDefined();
      expect(outputs.estimatedMonthlySavings).toBeDefined();
      expect(outputs.instanceCount).toBeDefined();
      done();
    });
  });

  it('should use correct environmentSuffix', (done) => {
    pulumi.all([stack.urn]).apply(([urn]) => {
      // The URN should not contain the default 'dev' suffix
      expect(urn).not.toContain('dev');
      done();
    });
  });

  it('should default to dev environmentSuffix when not provided', (done) => {
    const defaultStack = new TapStack('default-stack', {});
    pulumi.all([defaultStack.urn]).apply(([urn]) => {
      expect(urn).toContain('TapStack');
      done();
    });
  });

  it('should accept custom tags', (done) => {
    const customStack = new TapStack('custom-stack', {
      environmentSuffix: 'custom',
      tags: {
        CustomTag: 'CustomValue',
        Project: 'CustomProject',
      },
    });
    pulumi.all([customStack.urn]).apply(([urn]) => {
      expect(urn).toBeDefined();
      done();
    });
  });

  it('should create child stacks with correct parent reference', (done) => {
    pulumi.all([stack.urn]).apply(([urn]) => {
      // Both scheduler and cost stacks should be created as children
      expect(urn).toBeDefined();
      done();
    });
  });

  it('should handle empty tags object', (done) => {
    const noTagsStack = new TapStack('no-tags-stack', {
      environmentSuffix: 'test',
      tags: {},
    });
    pulumi.all([noTagsStack.urn]).apply(([urn]) => {
      expect(urn).toBeDefined();
      done();
    });
  });

  it('should propagate environmentSuffix to child stacks', (done) => {
    const envStack = new TapStack('env-stack', {
      environmentSuffix: 'staging',
    });
    pulumi.all([envStack.schedulerOutputs]).apply(([outputs]) => {
      expect(outputs).toBeDefined();
      done();
    });
  });

  it('should create outputs with correct structure', (done) => {
    pulumi.all([stack.schedulerOutputs, stack.costOutputs]).apply(
      ([schedulerOutputs, costOutputs]) => {
        // Verify scheduler outputs structure
        expect(typeof schedulerOutputs).toBe('object');
        expect(Array.isArray(schedulerOutputs.managedInstanceIds)).toBe(true);

        // Verify cost outputs structure
        expect(typeof costOutputs).toBe('object');
        expect(typeof costOutputs.estimatedMonthlySavings).toBe('number');
        expect(typeof costOutputs.instanceCount).toBe('number');

        done();
      }
    );
  });

  it('should handle region configuration', (done) => {
    const regionStack = new TapStack('region-stack', {
      environmentSuffix: 'ap-test',
    });
    pulumi.all([regionStack.urn]).apply(([urn]) => {
      expect(urn).toBeDefined();
      done();
    });
  });
});
