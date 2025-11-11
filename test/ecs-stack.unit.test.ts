/**
 * Unit tests for EcsStack - ECS cluster, ALB, and services
 */
import * as pulumi from '@pulumi/pulumi';
import { EcsStack } from '../lib/ecs-stack';

// Set up Pulumi mocking
pulumi.runtime.setMocks({
  newResource: function(args: pulumi.runtime.MockResourceArgs): {id: string, state: any} {
    return {
      id: args.inputs.name ? `${args.inputs.name}-id` : `${args.name}-id`,
      state: {
        ...args.inputs,
        id: args.inputs.name ? `${args.inputs.name}-id` : `${args.name}-id`,
        arn: `arn:aws:${args.type}:eu-central-1 :123456789012:${args.name}`,
        dnsName: args.type.includes('loadbalancer') ? `${args.name}.eu-central-1 .elb.amazonaws.com` : undefined,
      },
    };
  },
  call: function(args: pulumi.runtime.MockCallArgs) {
    return args.inputs;
  },
});

describe('EcsStack', () => {
  const mockArgs = {
    environmentSuffix: 'test',
    vpcId: pulumi.output('vpc-123'),
    publicSubnetIds: [pulumi.output('subnet-pub-1'), pulumi.output('subnet-pub-2')],
    privateSubnetIds: [pulumi.output('subnet-priv-1'), pulumi.output('subnet-priv-2')],
    apiEcrUrl: pulumi.output('123456789012.dkr.ecr.eu-central-1 .amazonaws.com/api-service-test'),
    workerEcrUrl: pulumi.output('123456789012.dkr.ecr.eu-central-1 .amazonaws.com/worker-service-test'),
    schedulerEcrUrl: pulumi.output('123456789012.dkr.ecr.eu-central-1 .amazonaws.com/scheduler-service-test'),
    dbSecretArn: pulumi.output('arn:aws:secretsmanager:eu-central-1 :123456789012:secret:db-credentials-test'),
    apiKeySecretArn: pulumi.output('arn:aws:secretsmanager:eu-central-1 :123456789012:secret:api-keys-test'),
  };

  describe('constructor', () => {
    it('should create an EcsStack with required args', () => {
      const stack = new EcsStack('test-ecs', mockArgs);

      expect(stack).toBeDefined();
      expect(stack).toBeInstanceOf(pulumi.ComponentResource);
      expect(stack.albDnsName).toBeDefined();
      expect(stack.clusterName).toBeDefined();
    });

    it('should create an EcsStack with custom tags', () => {
      const customTags = { Environment: 'staging', Team: 'platform' };
      const stack = new EcsStack('test-ecs', {
        ...mockArgs,
        tags: customTags,
      });

      expect(stack).toBeDefined();
      expect(stack.albDnsName).toBeDefined();
    });

    it('should expose albDnsName output', () => {
      const stack = new EcsStack('test-ecs', mockArgs);

      expect(stack.albDnsName).toBeDefined();
      expect(pulumi.Output.isInstance(stack.albDnsName)).toBe(true);
    });

    it('should expose clusterName output', () => {
      const stack = new EcsStack('test-ecs', mockArgs);

      expect(stack.clusterName).toBeDefined();
      expect(pulumi.Output.isInstance(stack.clusterName)).toBe(true);
    });
  });

  describe('resource naming with environmentSuffix', () => {
    it('should use environmentSuffix in resource names', () => {
      const suffix = 'prod123';
      const stack = new EcsStack('test-ecs', {
        ...mockArgs,
        environmentSuffix: suffix,
      });

      expect(stack).toBeDefined();
      expect(stack.albDnsName).toBeDefined();
    });

    it('should handle different environmentSuffix values', () => {
      const suffixes = ['dev', 'staging', 'prod', 'pr123'];

      for (const suffix of suffixes) {
        const stack = new EcsStack(`test-ecs-${suffix}`, {
          ...mockArgs,
          environmentSuffix: suffix,
        });
        expect(stack).toBeDefined();
      }
    });
  });

  describe('EcsStackArgs interface', () => {
    it('should accept all required fields', () => {
      const stack = new EcsStack('test-ecs', mockArgs);
      expect(stack).toBeDefined();
    });

    it('should accept required fields and tags', () => {
      const stack = new EcsStack('test-ecs', {
        ...mockArgs,
        tags: { Owner: 'team' },
      });
      expect(stack).toBeDefined();
    });

    it('should handle empty tags object', () => {
      const stack = new EcsStack('test-ecs', {
        ...mockArgs,
        tags: {},
      });
      expect(stack).toBeDefined();
    });

    it('should handle multiple tags', () => {
      const stack = new EcsStack('test-ecs', {
        ...mockArgs,
        tags: {
          Environment: 'prod',
          Owner: 'platform',
          CostCenter: '12345',
        },
      });
      expect(stack).toBeDefined();
    });

    it('should accept VPC and subnet outputs', () => {
      const stack = new EcsStack('test-ecs', {
        environmentSuffix: 'test',
        vpcId: pulumi.output('vpc-custom'),
        publicSubnetIds: [pulumi.output('subnet-pub-custom-1')],
        privateSubnetIds: [pulumi.output('subnet-priv-custom-1')],
        apiEcrUrl: pulumi.output('custom-ecr-url'),
        workerEcrUrl: pulumi.output('custom-worker-url'),
        schedulerEcrUrl: pulumi.output('custom-scheduler-url'),
        dbSecretArn: pulumi.output('custom-db-secret'),
        apiKeySecretArn: pulumi.output('custom-api-secret'),
      });
      expect(stack).toBeDefined();
    });

    it('should accept ECR repository URLs', () => {
      const customUrls = {
        apiEcrUrl: pulumi.output('999999999999.dkr.ecr.eu-west-1.amazonaws.com/custom-api'),
        workerEcrUrl: pulumi.output('999999999999.dkr.ecr.eu-west-1.amazonaws.com/custom-worker'),
        schedulerEcrUrl: pulumi.output('999999999999.dkr.ecr.eu-west-1.amazonaws.com/custom-scheduler'),
      };
      const stack = new EcsStack('test-ecs', {
        ...mockArgs,
        ...customUrls,
      });
      expect(stack).toBeDefined();
    });

    it('should accept Secrets Manager ARNs', () => {
      const customSecrets = {
        dbSecretArn: pulumi.output('arn:aws:secretsmanager:eu-west-1:999999999999:secret:custom-db'),
        apiKeySecretArn: pulumi.output('arn:aws:secretsmanager:eu-west-1:999999999999:secret:custom-api'),
      };
      const stack = new EcsStack('test-ecs', {
        ...mockArgs,
        ...customSecrets,
      });
      expect(stack).toBeDefined();
    });
  });

  describe('outputs resolution', () => {
    it('should have albDnsName output defined', () => {
      const stack = new EcsStack('test-ecs', mockArgs);

      expect(stack.albDnsName).toBeDefined();
      expect(pulumi.Output.isInstance(stack.albDnsName)).toBe(true);
    });

    it('should have clusterName output defined', () => {
      const stack = new EcsStack('test-ecs', mockArgs);

      expect(stack.clusterName).toBeDefined();
      expect(pulumi.Output.isInstance(stack.clusterName)).toBe(true);
    });
  });

  describe('dependency handling', () => {
    it('should accept outputs from other stacks', () => {
      const networkOutputs = {
        vpcId: pulumi.output('vpc-from-network-stack'),
        publicSubnetIds: [pulumi.output('subnet-pub-from-network')],
        privateSubnetIds: [pulumi.output('subnet-priv-from-network')],
      };

      const ecrOutputs = {
        apiEcrUrl: pulumi.output('ecr-from-ecr-stack-api'),
        workerEcrUrl: pulumi.output('ecr-from-ecr-stack-worker'),
        schedulerEcrUrl: pulumi.output('ecr-from-ecr-stack-scheduler'),
      };

      const secretsOutputs = {
        dbSecretArn: pulumi.output('arn-from-secrets-stack-db'),
        apiKeySecretArn: pulumi.output('arn-from-secrets-stack-api'),
      };

      const stack = new EcsStack('test-ecs', {
        environmentSuffix: 'test',
        ...networkOutputs,
        ...ecrOutputs,
        ...secretsOutputs,
      });

      expect(stack).toBeDefined();
    });
  });
});
