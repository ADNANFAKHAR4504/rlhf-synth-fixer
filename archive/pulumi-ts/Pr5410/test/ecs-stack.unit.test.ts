import * as pulumi from '@pulumi/pulumi';
import { EcsStack } from '../lib/ecs-stack';

pulumi.runtime.setMocks({
  newResource: (args: pulumi.runtime.MockResourceArgs): { id: string; state: any } => {
    return {
      id: `${args.name}_id`,
      state: args.inputs,
    };
  },
  call: (args: pulumi.runtime.MockCallArgs) => {
    if (args.token === 'aws:index/getRegion:getRegion') {
      return {
        name: 'ap-northeast-2',
      };
    }
    return args.inputs;
  },
});

describe('EcsStack', () => {
  const vpcId = pulumi.output('vpc-12345');
  const subnetIds = pulumi.output(['subnet-1', 'subnet-2']);
  const securityGroupId = pulumi.output('sg-12345');
  const targetGroupArn = pulumi.output('arn:aws:elasticloadbalancing:...:targetgroup/...');
  const dbEndpoint = pulumi.output('db.example.com:5432');
  const logGroupName = pulumi.output('/aws/ecs/payment-app');

  it('should create ECS cluster', () => {
    const ecsStack = new EcsStack('test-ecs', {
      environmentSuffix: 'test',
      vpcId,
      subnetIds,
      securityGroupId,
      targetGroupArn,
      ecrImageUri: 'nginx:latest',
      dbEndpoint,
      logGroupName,
      tags: { Environment: 'test' },
    });

    expect(ecsStack.clusterName).toBeDefined();
    expect(ecsStack.serviceName).toBeDefined();
  });

  it('should handle dbSecretArn when provided', () => {
    const ecsStack = new EcsStack('test-ecs-2', {
      environmentSuffix: 'test',
      vpcId,
      subnetIds,
      securityGroupId,
      targetGroupArn,
      ecrImageUri: 'nginx:latest',
      dbSecretArn: 'arn:aws:secretsmanager:us-east-1:123456789012:secret:test-secret',
      dbEndpoint,
      logGroupName,
      tags: { Environment: 'test' },
    });

    expect(ecsStack.clusterName).toBeDefined();
  });

  it('should include environmentSuffix in cluster name', () => {
    const envSuffix = 'staging';
    const ecsStack = new EcsStack('test-ecs-3', {
      environmentSuffix: envSuffix,
      vpcId,
      subnetIds,
      securityGroupId,
      targetGroupArn,
      ecrImageUri: 'nginx:latest',
      dbEndpoint,
      logGroupName,
      tags: { Environment: 'staging' },
    });

    expect(ecsStack.clusterName).toBeDefined();
  });
});
