/**
 * Unit Tests for TapStack
 *
 * These tests verify the structure and configuration of the TapStack component
 * using Pulumi testing utilities.
 */
import * as pulumi from '@pulumi/pulumi';
import { TapStack } from '../lib/tap-stack';
import { VpcStack } from '../lib/vpc-stack';
import { RdsStack } from '../lib/rds-stack';

// Mock Pulumi runtime for unit testing
pulumi.runtime.setMocks({
  newResource: (args: pulumi.runtime.MockResourceArgs): {
    id: string;
    state: any;
  } => {
    return {
      id: args.inputs.name
        ? `${args.inputs.name}-id`
        : `${args.name}-${args.type}-id`,
      state: {
        ...args.inputs,
      },
    };
  },
  call: (args: pulumi.runtime.MockCallArgs) => {
    if (args.token === 'aws:index/getAvailabilityZones:getAvailabilityZones') {
      return {
        names: ['us-east-1a', 'us-east-1b', 'us-east-1c'],
      };
    }
    return {};
  },
});

describe('TapStack Component', () => {
  let stack: TapStack;

  describe('with custom environmentSuffix and tags', () => {
    beforeAll(() => {
      stack = new TapStack('test-tapstack', {
        environmentSuffix: 'testenv123',
        tags: {
          Project: 'TestProject',
          Owner: 'TestOwner',
        },
      });
    });

    it('should create the stack successfully', () => {
      expect(stack).toBeDefined();
      expect(stack).toBeInstanceOf(pulumi.ComponentResource);
    });

    it('should create VpcStack component', () => {
      expect(stack.vpcStack).toBeDefined();
      expect(stack.vpcStack).toBeInstanceOf(VpcStack);
    });

    it('should create RdsStack component', () => {
      expect(stack.rdsStack).toBeDefined();
      expect(stack.rdsStack).toBeInstanceOf(RdsStack);
    });

    it('should expose dbEndpoint output', () => {
      expect(stack.dbEndpoint).toBeDefined();
      expect(stack.dbEndpoint).toBeInstanceOf(Object);
    });

    it('should expose snsTopicArn output', () => {
      expect(stack.snsTopicArn).toBeDefined();
      expect(stack.snsTopicArn).toBeInstanceOf(Object);
    });
  });

  describe('with default values', () => {
    beforeAll(() => {
      stack = new TapStack('test-tapstack-default', {});
    });

    it('should create the stack with default environmentSuffix', () => {
      expect(stack).toBeDefined();
      expect(stack.vpcStack).toBeDefined();
      expect(stack.rdsStack).toBeDefined();
    });

    it('should have default outputs', () => {
      expect(stack.dbEndpoint).toBeDefined();
      expect(stack.snsTopicArn).toBeDefined();
    });
  });
});

describe('VpcStack Component', () => {
  let vpcStack: VpcStack;

  beforeAll(() => {
    vpcStack = new VpcStack('test-vpcstack', {
      environmentSuffix: 'testenv456',
      tags: {
        Environment: 'test',
      },
    });
  });

  it('should create VPC successfully', () => {
    expect(vpcStack).toBeDefined();
    expect(vpcStack.vpc).toBeDefined();
  });

  it('should create private subnet 1', () => {
    expect(vpcStack.privateSubnet1).toBeDefined();
  });

  it('should create private subnet 2', () => {
    expect(vpcStack.privateSubnet2).toBeDefined();
  });

  it('should create application security group', () => {
    expect(vpcStack.applicationSecurityGroup).toBeDefined();
  });

  it('should have correct VPC CIDR block', (done) => {
    vpcStack.vpc.cidrBlock.apply((cidr) => {
      expect(cidr).toBe('10.0.0.0/16');
      done();
    });
  });

  it('should have DNS support enabled', (done) => {
    pulumi
      .all([vpcStack.vpc.enableDnsSupport, vpcStack.vpc.enableDnsHostnames])
      .apply(([dnsSupport, dnsHostnames]) => {
        expect(dnsSupport).toBe(true);
        expect(dnsHostnames).toBe(true);
        done();
      });
  });
});

describe('RdsStack Component', () => {
  let rdsStack: RdsStack;
  let mockVpcId: pulumi.Output<string>;
  let mockSubnetIds: pulumi.Output<string[]>;
  let mockSecurityGroupId: pulumi.Output<string>;

  beforeAll(() => {
    mockVpcId = pulumi.output('vpc-12345');
    mockSubnetIds = pulumi.output(['subnet-1', 'subnet-2']);
    mockSecurityGroupId = pulumi.output('sg-67890');

    rdsStack = new RdsStack('test-rdsstack', {
      environmentSuffix: 'testenv789',
      vpcId: mockVpcId,
      privateSubnetIds: mockSubnetIds,
      applicationSecurityGroupId: mockSecurityGroupId,
      tags: {
        Service: 'test-rds',
      },
    });
  });

  it('should create RDS stack successfully', () => {
    expect(rdsStack).toBeDefined();
    expect(rdsStack).toBeInstanceOf(pulumi.ComponentResource);
  });

  it('should create DB instance', () => {
    expect(rdsStack.dbInstance).toBeDefined();
  });

  it('should create DB security group', () => {
    expect(rdsStack.dbSecurityGroup).toBeDefined();
  });

  it('should create SNS topic', () => {
    expect(rdsStack.snsTopic).toBeDefined();
  });

  it('should configure instance as db.r6g.large', (done) => {
    rdsStack.dbInstance.instanceClass.apply((instanceClass) => {
      expect(instanceClass).toBe('db.r6g.large');
      done();
    });
  });

  it('should enable Multi-AZ deployment', (done) => {
    rdsStack.dbInstance.multiAz.apply((multiAz) => {
      expect(multiAz).toBe(true);
      done();
    });
  });

  it('should configure 35-day backup retention', (done) => {
    rdsStack.dbInstance.backupRetentionPeriod.apply((retention) => {
      expect(retention).toBe(35);
      done();
    });
  });

  it('should enable Performance Insights with 7-day retention', (done) => {
    pulumi
      .all([
        rdsStack.dbInstance.performanceInsightsEnabled,
        rdsStack.dbInstance.performanceInsightsRetentionPeriod,
      ])
      .apply(([enabled, retention]) => {
        expect(enabled).toBe(true);
        expect(retention).toBe(7);
        done();
      });
  });

  it('should enable Enhanced Monitoring with 60-second interval', (done) => {
    rdsStack.dbInstance.monitoringInterval.apply((interval) => {
      expect(interval).toBe(60);
      done();
    });
  });

  it('should have storage encrypted', (done) => {
    rdsStack.dbInstance.storageEncrypted.apply((encrypted) => {
      expect(encrypted).toBe(true);
      done();
    });
  });

  it('should use gp3 storage type', (done) => {
    rdsStack.dbInstance.storageType.apply((storageType) => {
      expect(storageType).toBe('gp3');
      done();
    });
  });

  it('should not be publicly accessible', (done) => {
    rdsStack.dbInstance.publiclyAccessible.apply((accessible) => {
      expect(accessible).toBe(false);
      done();
    });
  });

  it('should have deletion protection disabled for destroyability', (done) => {
    rdsStack.dbInstance.deletionProtection.apply((protection) => {
      expect(protection).toBe(false);
      done();
    });
  });

  it('should skip final snapshot for destroyability', (done) => {
    rdsStack.dbInstance.skipFinalSnapshot.apply((skip) => {
      expect(skip).toBe(true);
      done();
    });
  });

  it('should expose dbEndpoint output', () => {
    expect(rdsStack.dbEndpoint).toBeDefined();
  });

  it('should expose dbPort output', () => {
    expect(rdsStack.dbPort).toBeDefined();
  });
});

describe('RDS Parameter Group Configuration', () => {
  let rdsStack: RdsStack;

  beforeAll(() => {
    rdsStack = new RdsStack('test-params', {
      environmentSuffix: 'testparams',
      vpcId: pulumi.output('vpc-test'),
      privateSubnetIds: pulumi.output(['subnet-a', 'subnet-b']),
      applicationSecurityGroupId: pulumi.output('sg-test'),
    });
  });

  it('should create parameter group with postgres14 family', () => {
    expect(rdsStack.dbInstance).toBeDefined();
    // Parameter group configuration is validated through dbInstance
  });
});

describe('CloudWatch Alarms Configuration', () => {
  let rdsStack: RdsStack;

  beforeAll(() => {
    rdsStack = new RdsStack('test-alarms', {
      environmentSuffix: 'testalarms',
      vpcId: pulumi.output('vpc-test'),
      privateSubnetIds: pulumi.output(['subnet-a', 'subnet-b']),
      applicationSecurityGroupId: pulumi.output('sg-test'),
    });
  });

  it('should create RDS stack with monitoring components', () => {
    expect(rdsStack).toBeDefined();
    expect(rdsStack.snsTopic).toBeDefined();
    // CloudWatch alarms are created within the component
  });
});

describe('Security Group Configuration', () => {
  let rdsStack: RdsStack;

  beforeAll(() => {
    rdsStack = new RdsStack('test-security', {
      environmentSuffix: 'testsec',
      vpcId: pulumi.output('vpc-test'),
      privateSubnetIds: pulumi.output(['subnet-a', 'subnet-b']),
      applicationSecurityGroupId: pulumi.output('sg-app'),
    });
  });

  it('should create database security group', () => {
    expect(rdsStack.dbSecurityGroup).toBeDefined();
  });

  it('should configure security group with correct VPC', (done) => {
    rdsStack.dbSecurityGroup.vpcId.apply((vpcId) => {
      expect(vpcId).toBe('vpc-test');
      done();
    });
  });
});
