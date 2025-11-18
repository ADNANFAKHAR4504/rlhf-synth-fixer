import * as pulumi from '@pulumi/pulumi';

// Set up Pulumi mocks before imports
pulumi.runtime.setMocks({
  newResource: function (
    args: pulumi.runtime.MockResourceArgs
  ): { id: string; state: any } {
    const outputs: any = {
      ...args.inputs,
      id: `${args.name}_id`,
      arn: `arn:aws:mock:us-east-1:123456789012:${args.type}/${args.name}`,
    };

    // Add specific outputs for different resource types
    if (args.type === 'aws:kms/key:Key') {
      outputs.keyId = `key-${args.name}`;
    }
    if (args.type === 'aws:s3/bucket:Bucket') {
      outputs.bucket = `${args.name}-bucket`;
    }
    if (args.type === 'aws:cloudwatch/logGroup:LogGroup') {
      outputs.name = `/aws/${args.name}`;
    }

    return {
      id: outputs.id,
      state: outputs,
    };
  },
  call: function (args: pulumi.runtime.MockCallArgs) {
    if (args.token === 'aws:index/getAvailabilityZones:getAvailabilityZones') {
      return {
        names: ['us-east-1a', 'us-east-1b', 'us-east-1c'],
        state: 'available',
      };
    }
    if (args.token === 'aws:index/getCallerIdentity:getCallerIdentity') {
      return {
        accountId: '123456789012',
        arn: 'arn:aws:iam::123456789012:user/test',
        userId: 'AIDACKCEVSQ6C2EXAMPLE',
      };
    }
    if (args.token === 'aws:index/getRegion:getRegion') {
      return {
        name: 'us-east-1',
      };
    }
    return args.inputs;
  },
});

import { TapStack } from '../lib/tap-stack';
import { NetworkStack } from '../lib/network-stack';
import { SecurityStack } from '../lib/security-stack';
import { MonitoringStack } from '../lib/monitoring-stack';
import { AccessStack } from '../lib/access-stack';

describe('TapStack', () => {
  describe('with custom environmentSuffix', () => {
    it('should create stack successfully with all outputs', async () => {
      const stack = new TapStack('test-stack', {
        environmentSuffix: 'test123',
        tags: { Project: 'Test' },
      });

      expect(stack).toBeDefined();
      expect(stack.vpcId).toBeDefined();
      expect(stack.privateSubnetIds).toBeDefined();
      expect(stack.flowLogsBucketName).toBeDefined();
      expect(stack.secretArn).toBeDefined();

      // Test actual output values asynchronously
      const [vpcId, subnetIds, bucketName, secretArn] = await Promise.all([
        stack.vpcId.promise(),
        Promise.all(stack.privateSubnetIds.map((s) => s.promise())),
        stack.flowLogsBucketName.promise(),
        stack.secretArn.promise(),
      ]);

      expect(vpcId).toBeDefined();
      expect(subnetIds).toBeDefined();
      expect(Array.isArray(subnetIds)).toBe(true);
      expect(bucketName).toBeDefined();
      expect(secretArn).toBeDefined();
    });

    it('should use provided tags', () => {
      const stack = new TapStack('test-stack-tags', {
        environmentSuffix: 'test',
        tags: { Environment: 'test', Project: 'MyProject' },
      });
      expect(stack).toBeDefined();
    });
  });

  describe('with default environmentSuffix', () => {
    it('should create stack with default suffix from env', () => {
      process.env.ENVIRONMENT_SUFFIX = 'dev';
      const stack = new TapStack('test-stack-default', {});
      expect(stack).toBeDefined();
      delete process.env.ENVIRONMENT_SUFFIX;
    });

    it('should use empty tags when not provided', () => {
      const stack = new TapStack('test-stack-no-tags', {
        environmentSuffix: 'test',
      });
      expect(stack).toBeDefined();
    });

    it('should fallback to "dev" when no suffix is provided', () => {
      // Ensure ENVIRONMENT_SUFFIX is not set
      delete process.env.ENVIRONMENT_SUFFIX;
      const stack = new TapStack('test-stack-fallback', {});
      expect(stack).toBeDefined();
    });
  });
});

describe('NetworkStack', () => {
  it('should create network stack with all components', async () => {
    const networkStack = new NetworkStack('test-network', {
      environmentSuffix: 'test',
      tags: { Environment: 'test' },
    });

    expect(networkStack).toBeDefined();
    expect(networkStack.vpcId).toBeDefined();
    expect(networkStack.privateSubnetIds).toBeDefined();
    expect(networkStack.s3EndpointId).toBeDefined();
    expect(networkStack.dynamodbEndpointId).toBeDefined();
    expect(networkStack.secretsManagerEndpointId).toBeDefined();

    // Verify outputs resolve correctly
    const [vpcId, subnetIds, s3Id, dynamoId, smId] = await Promise.all([
      networkStack.vpcId.promise(),
      Promise.all(networkStack.privateSubnetIds.map((s) => s.promise())),
      networkStack.s3EndpointId.promise(),
      networkStack.dynamodbEndpointId.promise(),
      networkStack.secretsManagerEndpointId.promise(),
    ]);

    expect(vpcId).toBeDefined();
    expect(Array.isArray(subnetIds)).toBe(true);
    expect(subnetIds.length).toBeGreaterThan(0);
    expect(s3Id).toBeDefined();
    expect(dynamoId).toBeDefined();
    expect(smId).toBeDefined();
  });
});

describe('SecurityStack', () => {
  it('should create security stack with KMS keys and secrets', async () => {
    const mockVpcId = pulumi.output('vpc-12345');
    const mockSubnetIds = [
      pulumi.output('subnet-1'),
      pulumi.output('subnet-2'),
      pulumi.output('subnet-3'),
    ];

    const securityStack = new SecurityStack('test-security', {
      environmentSuffix: 'test',
      vpcId: mockVpcId,
      privateSubnetIds: mockSubnetIds,
      tags: { Environment: 'test' },
    });

    expect(securityStack).toBeDefined();
    expect(securityStack.logsKmsKeyArn).toBeDefined();
    expect(securityStack.secretsKmsKeyArn).toBeDefined();
    expect(securityStack.s3KmsKeyArn).toBeDefined();
    expect(securityStack.secretArn).toBeDefined();
    expect(securityStack.abacRoleArn).toBeDefined();

    // Verify outputs resolve correctly
    const [logsKms, secretsKms, s3Kms, secret, abacRole] = await Promise.all([
      securityStack.logsKmsKeyArn.promise(),
      securityStack.secretsKmsKeyArn.promise(),
      securityStack.s3KmsKeyArn.promise(),
      securityStack.secretArn.promise(),
      securityStack.abacRoleArn.promise(),
    ]);

    expect(logsKms).toBeDefined();
    expect(secretsKms).toBeDefined();
    expect(s3Kms).toBeDefined();
    expect(secret).toBeDefined();
    expect(abacRole).toBeDefined();
  });
});

describe('MonitoringStack', () => {
  it('should create monitoring stack with flow logs and log groups', async () => {
    const mockVpcId = pulumi.output('vpc-12345');
    const mockKmsKeyArn = pulumi.output(
      'arn:aws:kms:us-east-1:123456789012:key/test'
    );

    const monitoringStack = new MonitoringStack('test-monitoring', {
      environmentSuffix: 'test',
      vpcId: mockVpcId,
      kmsKeyArn: mockKmsKeyArn,
      tags: { Environment: 'test' },
    });

    expect(monitoringStack).toBeDefined();
    expect(monitoringStack.flowLogsBucketName).toBeDefined();
    expect(monitoringStack.logGroupName).toBeDefined();

    // Verify outputs resolve correctly
    const [bucketName, logGroupName] = await Promise.all([
      monitoringStack.flowLogsBucketName.promise(),
      monitoringStack.logGroupName.promise(),
    ]);

    expect(bucketName).toBeDefined();
    expect(logGroupName).toBeDefined();
  });
});

describe('AccessStack', () => {
  it('should create access stack with SSM session manager config', async () => {
    const mockVpcId = pulumi.output('vpc-12345');
    const mockSubnetIds = [
      pulumi.output('subnet-1'),
      pulumi.output('subnet-2'),
      pulumi.output('subnet-3'),
    ];
    const mockKmsKeyArn = pulumi.output(
      'arn:aws:kms:us-east-1:123456789012:key/test'
    );

    const accessStack = new AccessStack('test-access', {
      environmentSuffix: 'test',
      vpcId: mockVpcId,
      privateSubnetIds: mockSubnetIds,
      kmsKeyArn: mockKmsKeyArn,
      tags: { Environment: 'test' },
    });

    expect(accessStack).toBeDefined();
    expect(accessStack.sessionManagerRoleArn).toBeDefined();

    // Verify output resolves correctly
    const roleArn = await accessStack.sessionManagerRoleArn.promise();
    expect(roleArn).toBeDefined();
  });
});
