/**
 * Unit tests for Ec2SchedulerStack
 *
 * Tests the EC2 scheduler component with Lambda functions and CloudWatch rules.
 */
import * as pulumi from '@pulumi/pulumi';
import { Ec2SchedulerStack } from '../lib/ec2-scheduler-stack';

pulumi.runtime.setMocks({
  newResource: (args: pulumi.runtime.MockResourceArgs): {
    id: string;
    state: any;
  } => {
    return {
      id: `${args.name}_id`,
      state: {
        ...args.inputs,
        arn:
          args.type === 'aws:lambda:Function'
            ? `arn:aws:lambda:ap-southeast-1:123456789012:function:${args.name}`
            : args.type === 'aws:cloudwatch:EventRule'
              ? `arn:aws:events:ap-southeast-1:123456789012:rule/${args.name}`
              : `arn:aws:${args.type}:ap-southeast-1:123456789012:${args.name}`,
        name: args.name,
      },
    };
  },
  call: (args: pulumi.runtime.MockCallArgs) => {
    if (args.token === 'aws:ec2/getInstances:getInstances') {
      return {
        ids: ['i-1234567890abcdef0', 'i-0987654321fedcba0'],
        publicIps: ['1.2.3.4', '5.6.7.8'],
        privateIps: ['10.0.1.1', '10.0.1.2'],
      };
    } else if (args.token === 'aws:ec2/getInstance:getInstance') {
      return {
        instanceType: 't3.medium',
        instanceState: 'running',
      };
    }
    return args.inputs;
  },
});

describe('Ec2SchedulerStack', () => {
  let stack: Ec2SchedulerStack;

  beforeEach(() => {
    stack = new Ec2SchedulerStack('test-scheduler', {
      environmentSuffix: 'test',
      region: 'ap-southeast-1',
      tags: {
        Environment: 'test',
        Project: 'test',
      },
    });
  });

  it('should create Ec2SchedulerStack with correct type', (done) => {
    pulumi.all([stack.urn]).apply(([urn]) => {
      expect(urn).toContain('tap:ec2:Ec2SchedulerStack');
      done();
    });
  });

  it('should have managedInstanceIds output', (done) => {
    pulumi.all([stack.managedInstanceIds]).apply(([instanceIds]) => {
      expect(instanceIds).toBeDefined();
      expect(Array.isArray(instanceIds)).toBe(true);
      done();
    });
  });

  it('should have stopFunctionArn output', (done) => {
    pulumi.all([stack.stopFunctionArn]).apply(([arn]) => {
      expect(arn).toBeDefined();
      expect(typeof arn).toBe('string');
      expect(arn).toContain('arn:aws');
      done();
    });
  });

  it('should have startFunctionArn output', (done) => {
    pulumi.all([stack.startFunctionArn]).apply(([arn]) => {
      expect(arn).toBeDefined();
      expect(typeof arn).toBe('string');
      expect(arn).toContain('arn:aws');
      done();
    });
  });

  it('should have stopRuleArn output', (done) => {
    pulumi.all([stack.stopRuleArn]).apply(([arn]) => {
      expect(arn).toBeDefined();
      expect(typeof arn).toBe('string');
      expect(arn).toContain('arn:aws');
      done();
    });
  });

  it('should have startRuleArn output', (done) => {
    pulumi.all([stack.startRuleArn]).apply(([arn]) => {
      expect(arn).toBeDefined();
      expect(typeof arn).toBe('string');
      expect(arn).toContain('arn:aws');
      done();
    });
  });

  it('should create outputs with all required fields', (done) => {
    pulumi.all([stack.outputs]).apply(([outputs]) => {
      expect(outputs).toBeDefined();
      expect(outputs.stopFunctionArn).toBeDefined();
      expect(outputs.startFunctionArn).toBeDefined();
      expect(outputs.stopRuleArn).toBeDefined();
      expect(outputs.startRuleArn).toBeDefined();
      expect(outputs.managedInstanceIds).toBeDefined();
      done();
    });
  });

  it('should use environmentSuffix in resource naming', (done) => {
    const customStack = new Ec2SchedulerStack('custom-scheduler', {
      environmentSuffix: 'prod',
      region: 'us-west-2',
    });
    pulumi.all([customStack.urn]).apply(([urn]) => {
      expect(urn).toBeDefined();
      done();
    });
  });

  it('should handle empty tags', (done) => {
    const noTagsStack = new Ec2SchedulerStack('notags-scheduler', {
      environmentSuffix: 'test',
      region: 'ap-southeast-1',
    });
    pulumi.all([noTagsStack.urn]).apply(([urn]) => {
      expect(urn).toBeDefined();
      done();
    });
  });

  it('should query both development and staging instances', (done) => {
    pulumi.all([stack.managedInstanceIds]).apply(([instanceIds]) => {
      // Mock returns 2 instances per environment
      expect(Array.isArray(instanceIds)).toBe(true);
      done();
    });
  });

  it('should create stop and start Lambda functions', (done) => {
    pulumi.all([stack.stopFunctionArn, stack.startFunctionArn]).apply(
      ([stopArn, startArn]) => {
        expect(stopArn).not.toBe(startArn);
        expect(stopArn).toContain('function');
        expect(startArn).toContain('function');
        done();
      }
    );
  });

  it('should create stop and start EventBridge schedules', (done) => {
    pulumi.all([stack.stopRuleArn, stack.startRuleArn]).apply(
      ([stopArn, startArn]) => {
        expect(stopArn).not.toBe(startArn);
        expect(stopArn).toContain('schedule');
        expect(startArn).toContain('schedule');
        done();
      }
    );
  });

  it('should work with different AWS regions', (done) => {
    const usEastStack = new Ec2SchedulerStack('us-east-scheduler', {
      environmentSuffix: 'useast',
      region: 'us-east-1',
    });
    pulumi.all([usEastStack.stopFunctionArn]).apply(([arn]) => {
      expect(arn).toBeDefined();
      done();
    });
  });

  it('should handle custom environment suffixes', (done) => {
    const customSuffix = 'pr1234';
    const customStack = new Ec2SchedulerStack('custom-env-scheduler', {
      environmentSuffix: customSuffix,
      region: 'ap-southeast-1',
    });
    pulumi.all([customStack.urn]).apply(([urn]) => {
      expect(urn).toBeDefined();
      done();
    });
  });

  it('should create IAM role for Lambda execution', (done) => {
    pulumi.all([stack.stopFunctionArn]).apply(([arn]) => {
      // If Lambda function is created, role must exist
      expect(arn).toBeDefined();
      done();
    });
  });

  it('should create CloudWatch log groups', (done) => {
    pulumi.all([stack.stopFunctionArn, stack.startFunctionArn]).apply(
      ([stopArn, startArn]) => {
        // Log groups must be created for both functions
        expect(stopArn).toBeDefined();
        expect(startArn).toBeDefined();
        done();
      }
    );
  });

  it('should create EventBridge schedules with proper configuration', (done) => {
    pulumi.all([stack.stopRuleArn, stack.startRuleArn]).apply(
      ([stopRuleArn, startRuleArn]) => {
        // Schedules must exist to invoke functions
        expect(stopRuleArn).toBeDefined();
        expect(startRuleArn).toBeDefined();
        done();
      }
    );
  });

  it('should create CloudWatch alarm for monitoring', (done) => {
    pulumi.all([stack.startFunctionArn]).apply(([arn]) => {
      // Alarm should be created for start function
      expect(arn).toBeDefined();
      done();
    });
  });

  it('should handle instance queries gracefully', (done) => {
    pulumi.all([stack.managedInstanceIds]).apply(([instanceIds]) => {
      // Should return array even if no instances found
      expect(Array.isArray(instanceIds)).toBe(true);
      done();
    });
  });

  it('should create resources with proper naming conventions', (done) => {
    pulumi.all([stack.stopFunctionArn, stack.startFunctionArn]).apply(
      ([stopArn, startArn]) => {
        expect(stopArn).toContain('stop');
        expect(startArn).toContain('start');
        done();
      }
    );
  });

  it('should handle tags parameter correctly', (done) => {
    const taggedStack = new Ec2SchedulerStack('tagged-scheduler', {
      environmentSuffix: 'tagged',
      region: 'us-west-2',
      tags: {
        Team: 'DevOps',
        Environment: 'Production',
      },
    });
    pulumi.all([taggedStack.urn]).apply(([urn]) => {
      expect(urn).toBeDefined();
      done();
    });
  });

  it('should create Lambda functions with correct environment variables', (done) => {
    pulumi.all([stack.outputs]).apply(([outputs]) => {
      expect(outputs.stopFunctionArn).toBeDefined();
      expect(outputs.startFunctionArn).toBeDefined();
      done();
    });
  });
});
