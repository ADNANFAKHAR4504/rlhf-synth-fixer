import * as pulumi from '@pulumi/pulumi';
import { SecurityStack } from '../lib/security-stack';

pulumi.runtime.setMocks({
  newResource: (args: pulumi.runtime.MockResourceArgs): { id: string; state: any } => {
    return {
      id: `${args.name}_id`,
      state: args.inputs,
    };
  },
  call: (args: pulumi.runtime.MockCallArgs) => {
    return args.inputs;
  },
});

describe('SecurityStack', () => {
  const vpcId = pulumi.output('vpc-12345');

  it('should create ALB security group', (done) => {
    const securityStack = new SecurityStack('test-security', {
      environmentSuffix: 'test',
      vpcId,
      tags: { Environment: 'test' },
    });

    securityStack.albSecurityGroupId.apply((sgId) => {
      expect(sgId).toBeDefined();
      done();
    });
  });

  it('should create ECS security group', (done) => {
    const securityStack = new SecurityStack('test-security-2', {
      environmentSuffix: 'test',
      vpcId,
      tags: { Environment: 'test' },
    });

    securityStack.ecsSecurityGroupId.apply((sgId) => {
      expect(sgId).toBeDefined();
      done();
    });
  });

  it('should create RDS security group', (done) => {
    const securityStack = new SecurityStack('test-security-3', {
      environmentSuffix: 'test',
      vpcId,
      tags: { Environment: 'test' },
    });

    securityStack.dbSecurityGroupId.apply((sgId) => {
      expect(sgId).toBeDefined();
      done();
    });
  });

  it('should include environmentSuffix in security group IDs', (done) => {
    const envSuffix = 'staging';
    const securityStack = new SecurityStack('test-security-4', {
      environmentSuffix: envSuffix,
      vpcId,
      tags: { Environment: 'staging' },
    });

    securityStack.albSecurityGroupId.apply((sgId) => {
      expect(sgId).toContain(envSuffix);
      done();
    });
  });
});
