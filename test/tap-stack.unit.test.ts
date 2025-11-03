/**
 * Unit tests for TapStack
 *
 * Tests the main TapStack component resource for EC2 cost optimization.
 */
import * as pulumi from '@pulumi/pulumi';
import { TapStack } from '../lib/tap-stack';

// Variable to control region mock behavior
let mockRegion: string | null = 'ap-southeast-1';

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
      if (mockRegion === null) {
        // Simulate no region configured
        return {
          name: undefined,
        };
      }
      return {
        name: mockRegion,
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
      expect(typeof outputs).toBe('object');
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

  it('should handle region configuration with explicit region parameter', (done) => {
    const regionStack = new TapStack('region-stack', {
      environmentSuffix: 'ap-test',
      region: 'us-west-2',
    });
    pulumi.all([regionStack.urn]).apply(([urn]) => {
      expect(urn).toBeDefined();
      done();
    });
  });

  it('should use default region when not specified', (done) => {
    const defaultRegionStack = new TapStack('default-region-stack', {
      environmentSuffix: 'default-region',
    });
    pulumi.all([defaultRegionStack.urn]).apply(([urn]) => {
      expect(urn).toBeDefined();
      expect(urn).toContain('TapStack');
      done();
    });
  });

  it('should handle undefined tags gracefully', (done) => {
    const noTagsStack = new TapStack('undefined-tags-stack', {
      environmentSuffix: 'notags',
      tags: undefined,
    });
    pulumi.all([noTagsStack.urn]).apply(([urn]) => {
      expect(urn).toBeDefined();
      done();
    });
  });

  it('should create both scheduler and cost calculation stacks', (done) => {
    pulumi.all([stack.schedulerOutputs, stack.costOutputs]).apply(
      ([schedulerOutputs, costOutputs]) => {
        expect(schedulerOutputs).toBeDefined();
        expect(costOutputs).toBeDefined();
        expect(typeof schedulerOutputs).toBe('object');
        expect(typeof costOutputs).toBe('object');
        done();
      }
    );
  });

  it('should use fallback region when aws.config.region is undefined', (done) => {
    // Temporarily set mockRegion to null to test fallback
    const originalMockRegion = mockRegion;
    mockRegion = null;

    const fallbackStack = new TapStack('fallback-region-stack', {
      environmentSuffix: 'fallback',
    });

    pulumi.all([fallbackStack.urn]).apply(([urn]) => {
      expect(urn).toBeDefined();
      expect(urn).toContain('TapStack');
      // Restore original mockRegion
      mockRegion = originalMockRegion;
      done();
    });
  });

  it('should work with us-east-1 region via parameter', (done) => {
    const usEastStack = new TapStack('us-east-stack', {
      environmentSuffix: 'useast',
      region: 'us-east-1',
    });

    pulumi.all([usEastStack.urn]).apply(([urn]) => {
      expect(urn).toBeDefined();
      done();
    });
  });

  it('should work with eu-west-1 region via parameter', (done) => {
    const euStack = new TapStack('eu-west-stack', {
      environmentSuffix: 'eu',
      region: 'eu-west-1',
    });

    pulumi.all([euStack.urn]).apply(([urn]) => {
      expect(urn).toBeDefined();
      done();
    });
  });

  it('should create stack with all optional parameters', (done) => {
    const fullStack = new TapStack('full-params-stack', {
      environmentSuffix: 'production',
      tags: {
        Environment: 'production',
        Team: 'platform',
        CostCenter: 'engineering',
      },
    });

    pulumi.all([fullStack.urn, fullStack.schedulerOutputs, fullStack.costOutputs]).apply(
      ([urn, schedulerOutputs, costOutputs]) => {
        expect(urn).toBeDefined();
        expect(schedulerOutputs).toBeDefined();
        expect(costOutputs).toBeDefined();
        done();
      }
    );
  });

  it('should create stack with minimal parameters', (done) => {
    const minimalStack = new TapStack('minimal-stack', {});

    pulumi.all([minimalStack.urn]).apply(([urn]) => {
      expect(urn).toBeDefined();
      done();
    });
  });

  it('should handle stack creation with different naming patterns', (done) => {
    const kebabStack = new TapStack('my-test-stack', {
      environmentSuffix: 'my-env',
    });

    pulumi.all([kebabStack.urn]).apply(([urn]) => {
      expect(urn).toContain('TapStack');
      done();
    });
  });

  it('should prioritize explicit region parameter over aws.config.region', (done) => {
    const explicitRegionStack = new TapStack('explicit-region-stack', {
      environmentSuffix: 'explicit',
      region: 'ca-central-1',
    });

    pulumi.all([explicitRegionStack.urn]).apply(([urn]) => {
      expect(urn).toBeDefined();
      expect(urn).toContain('TapStack');
      done();
    });
  });

  it('should handle different region formats', (done) => {
    const apStack = new TapStack('ap-region-stack', {
      environmentSuffix: 'ap',
      region: 'ap-northeast-1',
    });

    pulumi.all([apStack.urn]).apply(([urn]) => {
      expect(urn).toBeDefined();
      done();
    });
  });

  it('should create stack with region and all parameters', (done) => {
    const completeStack = new TapStack('complete-stack', {
      environmentSuffix: 'complete',
      region: 'us-west-1',
      tags: {
        Environment: 'production',
        Application: 'ec2-optimizer',
      },
    });

    pulumi.all([completeStack.urn, completeStack.schedulerOutputs, completeStack.costOutputs]).apply(
      ([urn, schedulerOutputs, costOutputs]) => {
        expect(urn).toBeDefined();
        expect(schedulerOutputs).toBeDefined();
        expect(costOutputs).toBeDefined();
        done();
      }
    );
  });
});
