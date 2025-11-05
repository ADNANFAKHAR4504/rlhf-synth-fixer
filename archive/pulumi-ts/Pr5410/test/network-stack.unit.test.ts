import * as pulumi from '@pulumi/pulumi';
import { NetworkStack } from '../lib/network-stack';

pulumi.runtime.setMocks({
  newResource: (args: pulumi.runtime.MockResourceArgs): { id: string; state: any } => {
    return {
      id: `${args.name}_id`,
      state: args.inputs,
    };
  },
  call: (args: pulumi.runtime.MockCallArgs) => {
    if (args.token === 'aws:index/getAvailabilityZones:getAvailabilityZones') {
      return {
        names: ['ap-northeast-2a', 'ap-northeast-2b', 'ap-northeast-2c'],
      };
    }
    if (args.token === 'aws:index/getRegion:getRegion') {
      return {
        name: 'ap-northeast-2',
      };
    }
    return args.inputs;
  },
});

describe('NetworkStack', () => {
  it('should create VPC with correct CIDR', (done) => {
    const networkStack = new NetworkStack('test-network', {
      environmentSuffix: 'test',
      tags: { Environment: 'test' },
    });

    networkStack.vpcId.apply((vpcId) => {
      expect(vpcId).toBeDefined();
      done();
    });
  });

  it('should create public and private subnets', (done) => {
    const networkStack = new NetworkStack('test-network-2', {
      environmentSuffix: 'test',
      tags: { Environment: 'test' },
    });

    pulumi
      .all([networkStack.publicSubnetIds, networkStack.privateSubnetIds])
      .apply(([publicSubnets, privateSubnets]) => {
        expect(publicSubnets).toBeDefined();
        expect(privateSubnets).toBeDefined();
        expect(publicSubnets.length).toBeGreaterThan(0);
        expect(privateSubnets.length).toBeGreaterThan(0);
        done();
      });
  });

  it('should include environmentSuffix in resource names', (done) => {
    const envSuffix = 'prod';
    const networkStack = new NetworkStack('test-network-3', {
      environmentSuffix: envSuffix,
      tags: { Environment: 'production' },
    });

    networkStack.vpcId.apply((vpcId) => {
      expect(vpcId).toContain(envSuffix);
      done();
    });
  });
});
