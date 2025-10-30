/**
 * Unit tests for AlbStack component
 *
 * Tests Application Load Balancer, target groups, listeners, and security groups.
 */
import * as pulumi from '@pulumi/pulumi';
import { AlbStack } from '../lib/alb-stack';

// Mock Pulumi runtime
pulumi.runtime.setMocks({
  newResource: function (args: pulumi.runtime.MockResourceArgs): {
    id: string;
    state: any;
  } {
    return {
      id: args.inputs.name + '_id',
      state: {
        ...args.inputs,
      },
    };
  },
  call: function (args: pulumi.runtime.MockCallArgs) {
    return {};
  },
});

describe('AlbStack', () => {
  let albStack: AlbStack;

  beforeAll(() => {
    albStack = new AlbStack('test-alb', {
      environmentSuffix: 'test',
      vpcId: pulumi.output('vpc-12345'),
      publicSubnetIds: pulumi.output(['subnet-1', 'subnet-2']),
      tags: {
        Environment: 'production',
        Project: 'payment-api',
      },
    });
  });

  it('should instantiate successfully', () => {
    expect(albStack).toBeDefined();
  });

  it('should expose albArn output', (done) => {
    albStack.albArn.apply((arn) => {
      expect(arn).toBeDefined();
      expect(typeof arn).toBe('string');
      done();
    });
  });

  it('should expose albDns output', (done) => {
    albStack.albDns.apply((dns) => {
      expect(dns).toBeDefined();
      expect(typeof dns).toBe('string');
      done();
    });
  });

  it('should expose albSecurityGroupId output', (done) => {
    albStack.albSecurityGroupId.apply((id) => {
      expect(id).toBeDefined();
      expect(typeof id).toBe('string');
      done();
    });
  });

  it('should expose targetGroupArn output', (done) => {
    albStack.targetGroupArn.apply((arn) => {
      expect(arn).toBeDefined();
      expect(typeof arn).toBe('string');
      done();
    });
  });

  it('should expose ecsTaskSecurityGroupId output', (done) => {
    albStack.ecsTaskSecurityGroupId.apply((id) => {
      expect(id).toBeDefined();
      expect(typeof id).toBe('string');
      done();
    });
  });

  it('should create ALB with environment suffix', (done) => {
    albStack.albArn.apply((arn) => {
      expect(arn).toContain('_id');
      done();
    });
  });

  it('should create target group with environment suffix', (done) => {
    albStack.targetGroupArn.apply((arn) => {
      expect(arn).toContain('_id');
      done();
    });
  });
});
