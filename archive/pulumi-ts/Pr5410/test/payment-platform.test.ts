import * as pulumi from '@pulumi/pulumi';

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
    if (args.token === 'aws:index/getCallerIdentity:getCallerIdentity') {
      return {
        accountId: '123456789012',
      };
    }
    if (args.token === 'aws:secretsmanager/getSecretVersion:getSecretVersion') {
      return {
        secretString: JSON.stringify({
          username: 'testuser',
          password: 'testpassword123',
        }),
      };
    }
    return args.inputs;
  },
});

describe('Payment Platform Infrastructure', () => {
  let stack: typeof import('../lib/tap-stack');

  beforeAll(() => {
    stack = require('../lib/tap-stack');
  });

  describe('TapStack', () => {
    it('should create TapStack with default environment suffix', async () => {
      const tapStack = new stack.TapStack('test-stack', {
        environmentSuffix: 'test',
        tags: { Environment: 'test' },
      });

      const albDnsName = await tapStack.albDnsName;
      const dbEndpoint = await tapStack.dbEndpoint;
      const ecsClusterName = await tapStack.ecsClusterName;

      expect(albDnsName).toBeDefined();
      expect(dbEndpoint).toBeDefined();
      expect(ecsClusterName).toBeDefined();
    });

    it('should use provided environmentSuffix in resource naming', (done) => {
      const envSuffix = 'prod';
      const tapStack = new stack.TapStack('test-stack-2', {
        environmentSuffix: envSuffix,
        tags: { Environment: 'production' },
      });

      tapStack.ecsClusterName.apply((clusterName) => {
        expect(clusterName).toContain(envSuffix);
        done();
      });
    });

    it('should create stack with all optional parameters', async () => {
      const tapStack = new stack.TapStack('test-stack-3', {
        environmentSuffix: 'staging',
        tags: { Environment: 'staging', Team: 'Platform' },
        ecrImageUri: 'my-registry/my-app:v1.0.0',
        domainName: 'example.com',
        certificateArn: 'arn:aws:acm:us-east-1:123456789012:certificate/test',
        dbSecretArn: 'arn:aws:secretsmanager:us-east-1:123456789012:secret:db-secret',
      });

      const albDnsName = await tapStack.albDnsName;
      const dbEndpoint = await tapStack.dbEndpoint;
      const ecsClusterName = await tapStack.ecsClusterName;

      expect(albDnsName).toBeDefined();
      expect(dbEndpoint).toBeDefined();
      expect(ecsClusterName).toBeDefined();
    });

    it('should handle missing environmentSuffix and use default', (done) => {
      const tapStack = new stack.TapStack('test-stack-4', {
        tags: { Environment: 'test' },
      });

      tapStack.ecsClusterName.apply((clusterName) => {
        expect(clusterName).toBeDefined();
        // Should use 'dev' as default
        expect(clusterName).toContain('dev');
        done();
      });
    });

    it('should create stack without certificate for HTTP-only setup', (done) => {
      const tapStack = new stack.TapStack('test-stack-5', {
        environmentSuffix: 'dev',
        tags: { Environment: 'development' },
        ecrImageUri: 'nginx:latest',
        // No certificateArn provided
      });

      tapStack.albDnsName.apply((dnsName) => {
        expect(dnsName).toBeDefined();
        done();
      });
    });

    it('should create stack without domain name', (done) => {
      const tapStack = new stack.TapStack('test-stack-6', {
        environmentSuffix: 'test',
        tags: { Environment: 'test' },
        // No domainName provided
      });

      tapStack.albDnsName.apply((dnsName) => {
        expect(dnsName).toBeDefined();
        done();
      });
    });
  });
});
