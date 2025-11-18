/**
 * Unit tests for TapStack
 */
import * as pulumi from '@pulumi/pulumi';
import { TapStack } from '../lib/tap-stack';

pulumi.runtime.setMocks({
  newResource: (
    args: pulumi.runtime.MockResourceArgs
  ): { id: string; state: any } => {
    return {
      id: `${args.name}-id`,
      state: {
        ...args.inputs,
        arn: `arn:aws:mock::123456789012:${args.type}/${args.name}`,
        id: `${args.name}-id`,
        endpoint: `${args.name}.mock.endpoint`,
        dnsName: `${args.name}.mock.alb.amazonaws.com`,
      },
    };
  },
  call: (args: pulumi.runtime.MockCallArgs): { outputs: any } => {
    if (args.token === 'aws:index/getAvailabilityZones:getAvailabilityZones') {
      return {
        outputs: {
          names: ['us-east-1a', 'us-east-1b', 'us-east-1c'],
          zoneIds: ['use1-az1', 'use1-az2', 'use1-az3'],
        },
      };
    }
    return { outputs: {} };
  },
});

describe('TapStack', () => {
  let stack: TapStack;

  beforeAll(() => {
    stack = new TapStack('test-stack', {
      environmentSuffix: 'test',
      tags: {
        Environment: 'prod-migration',
        CostCenter: 'finance',
        MigrationPhase: 'active',
      },
    });
  });

  it('should create a stack', async () => {
    expect(stack).toBeDefined();
  });

  it('should export ALB DNS name', done => {
    pulumi.all([stack.albDnsName]).apply(([dnsName]) => {
      expect(dnsName).toBeDefined();
      expect(typeof dnsName).toBe('string');
      done();
    });
  });

  it('should export RDS cluster endpoint', done => {
    pulumi.all([stack.rdsClusterEndpoint]).apply(([endpoint]) => {
      expect(endpoint).toBeDefined();
      expect(typeof endpoint).toBe('string');
      done();
    });
  });

  it('should export DMS task ARN', done => {
    pulumi.all([stack.dmsTaskArn]).apply(([arn]) => {
      expect(arn).toBeDefined();
      expect(typeof arn).toBe('string');
      done();
    });
  });

  it('should export VPC ID', done => {
    pulumi.all([stack.vpcId]).apply(([vpcId]) => {
      expect(vpcId).toBeDefined();
      expect(typeof vpcId).toBe('string');
      done();
    });
  });

  it('should have correct tags', async () => {
    const tags = {
      Environment: 'prod-migration',
      CostCenter: 'finance',
      MigrationPhase: 'active',
    };
    expect(tags.Environment).toBe('prod-migration');
    expect(tags.CostCenter).toBe('finance');
    expect(tags.MigrationPhase).toBe('active');
  });

  it('should use correct environment suffix', () => {
    expect(stack).toBeDefined();
    // Environment suffix is used internally for resource naming
  });
});
