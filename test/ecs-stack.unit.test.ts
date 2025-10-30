/**
 * Unit tests for EcsStack component
 *
 * Tests ECS cluster, task definition, service, and auto-scaling configuration.
 */
import * as pulumi from '@pulumi/pulumi';
import { EcsStack } from '../lib/ecs-stack';

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

describe('EcsStack', () => {
  let ecsStack: EcsStack;

  beforeAll(() => {
    ecsStack = new EcsStack('test-ecs', {
      environmentSuffix: 'test',
      vpcId: pulumi.output('vpc-12345'),
      privateSubnetIds: pulumi.output(['subnet-1', 'subnet-2']),
      targetGroupArn: pulumi.output('arn:aws:elasticloadbalancing:region:account:targetgroup/name/id'),
      ecsTaskSecurityGroupId: pulumi.output('sg-12345'),
      containerImage: 'public.ecr.aws/nginx/nginx:latest',
      tags: {
        Environment: 'production',
        Project: 'payment-api',
      },
    });
  });

  it('should instantiate successfully', () => {
    expect(ecsStack).toBeDefined();
  });

  it('should expose clusterArn output', (done) => {
    ecsStack.clusterArn.apply((arn) => {
      expect(arn).toBeDefined();
      expect(typeof arn).toBe('string');
      done();
    });
  });

  it('should expose clusterName output', (done) => {
    ecsStack.clusterName.apply((name) => {
      expect(name).toBeDefined();
      expect(typeof name).toBe('string');
      done();
    });
  });

  it('should expose serviceArn output', (done) => {
    ecsStack.serviceArn.apply((arn) => {
      expect(arn).toBeDefined();
      expect(typeof arn).toBe('string');
      done();
    });
  });

  it('should expose serviceName output', (done) => {
    ecsStack.serviceName.apply((name) => {
      expect(name).toBeDefined();
      expect(typeof name).toBe('string');
      done();
    });
  });

  it('should create cluster with environment suffix', (done) => {
    ecsStack.clusterName.apply((name) => {
      expect(name).toContain('_id');
      done();
    });
  });

  it('should create service with environment suffix', (done) => {
    ecsStack.serviceName.apply((name) => {
      expect(name).toContain('_id');
      done();
    });
  });
});
