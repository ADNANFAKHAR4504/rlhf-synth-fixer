/**
 * Unit tests for TapStack - Main orchestration stack
 * Tests the component structure and output exports
 */
import * as pulumi from '@pulumi/pulumi';
import { TapStack } from '../lib/tap-stack';
import { NetworkStack } from '../lib/network-stack';
import { EcrStack } from '../lib/ecr-stack';
import { SecretsStack } from '../lib/secrets-stack';
import { EcsStack } from '../lib/ecs-stack';

// Mock child stacks
jest.mock('../lib/network-stack');
jest.mock('../lib/ecr-stack');
jest.mock('../lib/secrets-stack');
jest.mock('../lib/ecs-stack');

// Set up Pulumi mocking
pulumi.runtime.setMocks({
  newResource: function(args: pulumi.runtime.MockResourceArgs): {id: string, state: any} {
    return {
      id: args.inputs.name ? `${args.inputs.name}-id` : `${args.name}-id`,
      state: args.inputs,
    };
  },
  call: function(args: pulumi.runtime.MockCallArgs) {
    return args.inputs;
  },
});

describe('TapStack', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    // Mock NetworkStack
    (NetworkStack as unknown as jest.Mock).mockImplementation(() => ({
      vpcId: pulumi.output('vpc-123'),
      publicSubnetIds: [pulumi.output('subnet-pub-1'), pulumi.output('subnet-pub-2')],
      privateSubnetIds: [pulumi.output('subnet-priv-1'), pulumi.output('subnet-priv-2')],
      registerOutputs: jest.fn(),
    }));

    // Mock EcrStack
    (EcrStack as unknown as jest.Mock).mockImplementation(() => ({
      apiRepositoryUrl: pulumi.output('123456789012.dkr.ecr.eu-central-1 .amazonaws.com/api-service-test'),
      workerRepositoryUrl: pulumi.output('123456789012.dkr.ecr.eu-central-1 .amazonaws.com/worker-service-test'),
      schedulerRepositoryUrl: pulumi.output('123456789012.dkr.ecr.eu-central-1 .amazonaws.com/scheduler-service-test'),
      registerOutputs: jest.fn(),
    }));

    // Mock SecretsStack
    (SecretsStack as unknown as jest.Mock).mockImplementation(() => ({
      dbSecretArn: pulumi.output('arn:aws:secretsmanager:eu-central-1 :123456789012:secret:db-credentials-test'),
      apiKeySecretArn: pulumi.output('arn:aws:secretsmanager:eu-central-1 :123456789012:secret:api-keys-test'),
      registerOutputs: jest.fn(),
    }));

    // Mock EcsStack
    (EcsStack as unknown as jest.Mock).mockImplementation(() => ({
      albDnsName: pulumi.output('alb-test.eu-central-1 .elb.amazonaws.com'),
      clusterName: pulumi.output('ecs-cluster-test'),
      registerOutputs: jest.fn(),
    }));
  });

  describe('constructor', () => {
    it('should create a TapStack with default values', () => {
      const stack = new TapStack('test-stack', {});
      expect(stack).toBeDefined();
      expect(stack).toBeInstanceOf(pulumi.ComponentResource);
    });

    it('should create a TapStack with custom environmentSuffix', () => {
      const stack = new TapStack('test-stack', {
        environmentSuffix: 'prod',
      });
      expect(stack).toBeDefined();
      expect(NetworkStack).toHaveBeenCalledWith(
        'tap-network-prod',
        expect.objectContaining({ environmentSuffix: 'prod' }),
        expect.any(Object)
      );
    });

    it('should create a TapStack with custom tags', () => {
      const customTags = { Environment: 'staging', Team: 'platform' };
      new TapStack('test-stack', {
        tags: customTags,
      });
      expect(NetworkStack).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({ tags: customTags }),
        expect.any(Object)
      );
    });

    it('should create a TapStack with custom region', () => {
      new TapStack('test-stack', {
        region: 'us-west-2',
      });
      // Region is accepted but not currently used in the implementation
      expect(NetworkStack).toHaveBeenCalled();
    });
  });

  describe('child stacks instantiation', () => {
    it('should instantiate NetworkStack', () => {
      new TapStack('test-stack', { environmentSuffix: 'test' });
      expect(NetworkStack).toHaveBeenCalledTimes(1);
      expect(NetworkStack).toHaveBeenCalledWith(
        'tap-network-test',
        { environmentSuffix: 'test', tags: {} },
        expect.objectContaining({ parent: expect.any(Object) })
      );
    });

    it('should instantiate EcrStack', () => {
      new TapStack('test-stack', { environmentSuffix: 'test' });
      expect(EcrStack).toHaveBeenCalledTimes(1);
      expect(EcrStack).toHaveBeenCalledWith(
        'tap-ecr-test',
        { environmentSuffix: 'test', tags: {} },
        expect.objectContaining({ parent: expect.any(Object) })
      );
    });

    it('should instantiate SecretsStack', () => {
      new TapStack('test-stack', { environmentSuffix: 'test' });
      expect(SecretsStack).toHaveBeenCalledTimes(1);
      expect(SecretsStack).toHaveBeenCalledWith(
        'tap-secrets-test',
        { environmentSuffix: 'test', tags: {} },
        expect.objectContaining({ parent: expect.any(Object) })
      );
    });

    it('should instantiate EcsStack with correct dependencies', () => {
      new TapStack('test-stack', { environmentSuffix: 'test' });
      expect(EcsStack).toHaveBeenCalledTimes(1);
      expect(EcsStack).toHaveBeenCalledWith(
        'tap-ecs-test',
        expect.objectContaining({
          environmentSuffix: 'test',
          tags: {},
          vpcId: expect.anything(),
          publicSubnetIds: expect.anything(),
          privateSubnetIds: expect.anything(),
          apiEcrUrl: expect.anything(),
          workerEcrUrl: expect.anything(),
          schedulerEcrUrl: expect.anything(),
          dbSecretArn: expect.anything(),
          apiKeySecretArn: expect.anything(),
        }),
        expect.objectContaining({ parent: expect.any(Object) })
      );
    });
  });

  describe('outputs', () => {
    it('should expose albDnsName output', () => {
      const stack = new TapStack('test-stack', {});
      expect(stack.albDnsName).toBeDefined();
    });

    it('should expose apiEcrUrl output', () => {
      const stack = new TapStack('test-stack', {});
      expect(stack.apiEcrUrl).toBeDefined();
    });

    it('should expose workerEcrUrl output', () => {
      const stack = new TapStack('test-stack', {});
      expect(stack.workerEcrUrl).toBeDefined();
    });

    it('should expose schedulerEcrUrl output', () => {
      const stack = new TapStack('test-stack', {});
      expect(stack.schedulerEcrUrl).toBeDefined();
    });

    it('should expose clusterName output', () => {
      const stack = new TapStack('test-stack', {});
      expect(stack.clusterName).toBeDefined();
    });

    it('should register all outputs', () => {
      const stack = new TapStack('test-stack', {});
      // Verify all outputs are defined
      expect(stack.albDnsName).toBeDefined();
      expect(stack.apiEcrUrl).toBeDefined();
      expect(stack.workerEcrUrl).toBeDefined();
      expect(stack.schedulerEcrUrl).toBeDefined();
      expect(stack.clusterName).toBeDefined();
    });
  });

  describe('resource naming with environmentSuffix', () => {
    it('should use environmentSuffix in all child stack names', () => {
      const suffix = 'custom123';
      new TapStack('test-stack', { environmentSuffix: suffix });

      expect(NetworkStack).toHaveBeenCalledWith(
        `tap-network-${suffix}`,
        expect.anything(),
        expect.anything()
      );
      expect(EcrStack).toHaveBeenCalledWith(
        `tap-ecr-${suffix}`,
        expect.anything(),
        expect.anything()
      );
      expect(SecretsStack).toHaveBeenCalledWith(
        `tap-secrets-${suffix}`,
        expect.anything(),
        expect.anything()
      );
      expect(EcsStack).toHaveBeenCalledWith(
        `tap-ecs-${suffix}`,
        expect.anything(),
        expect.anything()
      );
    });

    it('should default to "dev" when environmentSuffix is not provided', () => {
      new TapStack('test-stack', {});

      expect(NetworkStack).toHaveBeenCalledWith(
        'tap-network-dev',
        expect.objectContaining({ environmentSuffix: 'dev' }),
        expect.anything()
      );
    });

    it('should default to empty object for tags when not provided', () => {
      new TapStack('test-stack', {});

      expect(NetworkStack).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({ tags: {} }),
        expect.anything()
      );
    });
  });

  describe('interface TapStackArgs', () => {
    it('should accept all optional fields', () => {
      const args = {
        environmentSuffix: 'test',
        tags: { key: 'value' },
        region: 'eu-central-1 ',
      };
      const stack = new TapStack('test-stack', args);
      expect(stack).toBeDefined();
    });

    it('should accept empty object', () => {
      const stack = new TapStack('test-stack', {});
      expect(stack).toBeDefined();
    });

    it('should accept only environmentSuffix', () => {
      const stack = new TapStack('test-stack', { environmentSuffix: 'staging' });
      expect(stack).toBeDefined();
    });

    it('should accept only tags', () => {
      const stack = new TapStack('test-stack', { tags: { Environment: 'prod' } });
      expect(stack).toBeDefined();
    });

    it('should accept only region', () => {
      const stack = new TapStack('test-stack', { region: 'eu-west-1' });
      expect(stack).toBeDefined();
    });
  });
});
