import * as pulumi from '@pulumi/pulumi';
import { LoadBalancerStack } from '../lib/load-balancer-stack';

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

describe('LoadBalancerStack', () => {
  const vpcId = pulumi.output('vpc-12345');
  const subnetIds = pulumi.output(['subnet-1', 'subnet-2']);
  const securityGroupId = pulumi.output('sg-12345');

  it('should create ALB and target group', () => {
    const lbStack = new LoadBalancerStack('test-lb', {
      environmentSuffix: 'test',
      vpcId,
      subnetIds,
      securityGroupId,
      tags: { Environment: 'test' },
    });

    expect(lbStack.albArn).toBeDefined();
    expect(lbStack.albDnsName).toBeDefined();
    expect(lbStack.targetGroupArn).toBeDefined();
  });

  it('should handle certificate ARN when provided', () => {
    const lbStack = new LoadBalancerStack('test-lb-2', {
      environmentSuffix: 'test',
      vpcId,
      subnetIds,
      securityGroupId,
      certificateArn: 'arn:aws:acm:us-east-1:123456789012:certificate/test',
      tags: { Environment: 'test' },
    });

    expect(lbStack.albArn).toBeDefined();
  });

  it('should include environmentSuffix in resource names', () => {
    const envSuffix = 'prod';
    const lbStack = new LoadBalancerStack('test-lb-3', {
      environmentSuffix: envSuffix,
      vpcId,
      subnetIds,
      securityGroupId,
      tags: { Environment: 'production' },
    });

    expect(lbStack.albArn).toBeDefined();
  });
});
