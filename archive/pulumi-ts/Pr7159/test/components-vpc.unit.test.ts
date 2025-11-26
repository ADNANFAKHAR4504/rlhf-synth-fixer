import * as pulumi from '@pulumi/pulumi';
import { VpcComponent } from '../lib/components/vpc';

// Mock Pulumi
pulumi.runtime.setMocks({
  newResource: (args: pulumi.runtime.MockResourceArgs): {
    id: string;
    state: any;
  } => {
    return {
      id: `${args.name}-id`,
      state: {
        ...args.inputs,
        id: args.name,
        arn: `arn:aws:${args.type}:::${args.name}`,
      },
    };
  },
  call: (args: pulumi.runtime.MockCallArgs) => {
    return args.inputs;
  },
});

describe('VpcComponent', () => {
  let vpc: VpcComponent;

  beforeAll(() => {
    vpc = new VpcComponent('test-vpc', {
      vpcCidr: '10.0.0.0/16',
      availabilityZones: ['us-east-1a', 'us-east-1b'],
      environmentSuffix: 'test',
      tags: { Environment: 'test', Owner: 'test-team' },
    });
  });

  it('should create a VPC component', () => {
    expect(vpc).toBeInstanceOf(VpcComponent);
  });

  it('should export vpcId', (done) => {
    pulumi.output(vpc.vpcId).apply((id) => {
      expect(id).toBeDefined();
      expect(typeof id).toBe('string');
      done();
    });
  });

  it('should export publicSubnetIds', (done) => {
    pulumi.output(vpc.publicSubnetIds).apply((ids) => {
      expect(ids).toBeDefined();
      expect(Array.isArray(ids)).toBe(true);
      expect(ids.length).toBe(2);
      done();
    });
  });

  it('should export privateSubnetIds', (done) => {
    pulumi.output(vpc.privateSubnetIds).apply((ids) => {
      expect(ids).toBeDefined();
      expect(Array.isArray(ids)).toBe(true);
      expect(ids.length).toBe(2);
      done();
    });
  });

  describe('with single availability zone', () => {
    it('should create VPC with single AZ', (done) => {
      const singleAzVpc = new VpcComponent('single-az-vpc', {
        vpcCidr: '10.1.0.0/16',
        availabilityZones: ['us-west-2a'],
        environmentSuffix: 'singleaz',
        tags: { Environment: 'test' },
      });

      pulumi.all([singleAzVpc.publicSubnetIds, singleAzVpc.privateSubnetIds]).apply(
        ([publicIds, privateIds]) => {
          expect(publicIds.length).toBe(1);
          expect(privateIds.length).toBe(1);
          done();
        }
      );
    });
  });

  describe('with multiple availability zones', () => {
    it('should create VPC with three AZs', (done) => {
      const multiAzVpc = new VpcComponent('multi-az-vpc', {
        vpcCidr: '10.2.0.0/16',
        availabilityZones: ['us-east-1a', 'us-east-1b', 'us-east-1c'],
        environmentSuffix: 'multiaz',
        tags: { Environment: 'test' },
      });

      pulumi.all([multiAzVpc.publicSubnetIds, multiAzVpc.privateSubnetIds]).apply(
        ([publicIds, privateIds]) => {
          expect(publicIds.length).toBe(3);
          expect(privateIds.length).toBe(3);
          done();
        }
      );
    });
  });
});
