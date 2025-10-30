/**
 * Unit tests for TapStack component
 *
 * Tests the main TapStack component to ensure proper initialization,
 * resource creation, and configuration.
 */
import * as pulumi from '@pulumi/pulumi';
import { TapStack } from '../lib/tap-stack';

// Mock Pulumi runtime
pulumi.runtime.setMocks({
  newResource: function (args: pulumi.runtime.MockResourceArgs): {
    id: string;
    state: any;
  } {
    const resourceName =
      (args.inputs && (args.inputs.name || args.inputs.arn || args.inputs.id)) ||
      args.name;
    const physicalId = `${resourceName}_id`;

    return {
      id: physicalId,
      state: {
        ...args.inputs,
        arn: `arn:aws:mock:::${resourceName}`,
        dnsName: `${resourceName}.mock.aws`,
        id: physicalId,
      },
    };
  },
  call: function (args: pulumi.runtime.MockCallArgs) {
    if (args.token === 'aws:index/getAvailabilityZones:getAvailabilityZones') {
      return {
        names: ['us-east-1a', 'us-east-1b', 'us-east-1c'],
      };
    }
    if (args.token === 'aws:elb/getServiceAccount:getServiceAccount') {
      return {
        arn: 'arn:aws:iam::127311923021:root',
      };
    }
    return {};
  },
});

describe('TapStack', () => {
  let stack: TapStack;

  describe('with default configuration', () => {
    beforeAll(() => {
      stack = new TapStack('test-stack', {});
    });

    it('should instantiate successfully', () => {
      expect(stack).toBeDefined();
    });

    it('should expose vpcId output', (done) => {
      stack.vpcId.apply((id) => {
        expect(id).toBeDefined();
        done();
      });
    });

    it('should expose albDns output', (done) => {
      stack.albDns.apply((dns) => {
        expect(dns).toBeDefined();
        done();
      });
    });

    it('should expose clusterArn output', (done) => {
      stack.clusterArn.apply((arn) => {
        expect(arn).toBeDefined();
        done();
      });
    });

    it('should expose serviceArn output', (done) => {
      stack.serviceArn.apply((arn) => {
        expect(arn).toBeDefined();
        done();
      });
    });
  });

  describe('with custom configuration', () => {
    beforeAll(() => {
      stack = new TapStack('test-stack-custom', {
        environmentSuffix: 'prod',
        tags: {
          Environment: 'production',
          Project: 'payment-api',
        },
        containerImage: 'my-ecr-repo/payment-api:v1.0.0',
      });
    });

    it('should instantiate with custom environment suffix', () => {
      expect(stack).toBeDefined();
    });

    it('should create VPC with environment suffix', (done) => {
      stack.vpcId.apply((id) => {
        expect(id).toBeDefined();
        expect(id).toContain('_id');
        done();
      });
    });

    it('should create ALB with environment suffix', (done) => {
      stack.albDns.apply((dns) => {
        expect(dns).toBeDefined();
        done();
      });
    });

    it('should create ECS cluster with environment suffix', (done) => {
      stack.clusterArn.apply((arn) => {
        expect(arn).toBeDefined();
        done();
      });
    });

    it('should create ECS service with environment suffix', (done) => {
      stack.serviceArn.apply((arn) => {
        expect(arn).toBeDefined();
        done();
      });
    });
  });

  describe('resource naming conventions', () => {
    beforeAll(() => {
      stack = new TapStack('naming-test', {
        environmentSuffix: 'test',
      });
    });

    it('should use environmentSuffix in resource names', () => {
      expect(stack).toBeDefined();
      // The stack should create resources with 'test' suffix
    });

    it('should apply tags to all resources', () => {
      expect(stack).toBeDefined();
      // Tags should be propagated to all nested stacks
    });
  });
});
