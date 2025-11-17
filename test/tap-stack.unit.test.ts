import * as pulumi from '@pulumi/pulumi';

// Mock Pulumi runtime before importing TapStack
pulumi.runtime.setMocks({
  newResource: function (args: pulumi.runtime.MockResourceArgs): { id: string; state: any } {
    return {
      id: `${args.name}-id`,
      state: {
        ...args.inputs,
        arn: `arn:aws:${args.type}:us-east-1:123456789012:${args.name}`,
        id: `${args.name}-id`,
        name: args.name,
        dnsName: `${args.name}.example.com`,
        zoneId: 'Z1234567890ABC',
        endpoint: `${args.name}.endpoint.amazonaws.com`,
        readerEndpoint: `${args.name}.reader.endpoint.amazonaws.com`,
        clusterIdentifier: `${args.name}-cluster`,
        names: ['us-east-1a', 'us-east-1b', 'us-east-1c'],
        url: `https://${args.name}.example.com`,
        invokeArn: `arn:aws:apigateway:us-east-1:lambda:path/2015-03-31/functions/arn:aws:lambda:us-east-1:123456789012:function:${args.name}/invocations`,
      },
    };
  },
  call: function (args: pulumi.runtime.MockCallArgs): any {
    if (args.token === 'aws:index/getAvailabilityZones:getAvailabilityZones') {
      return {
        names: ['us-east-1a', 'us-east-1b', 'us-east-1c'],
        zoneIds: ['use1-az1', 'use1-az2', 'use1-az3'],
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
        endpoint: 'ec2.us-east-1.amazonaws.com',
      };
    }
    return {};
  },
});

import { TapStack } from '../lib/tap-stack';

describe('TapStack Component Resource', () => {
  describe('Basic Instantiation', () => {
    it('should instantiate successfully with default values', async () => {
      const stack = new TapStack('test-stack', {});

      expect(stack).toBeDefined();
      expect(stack.primaryEndpoint).toBeDefined();
      expect(stack.secondaryEndpoint).toBeDefined();
      expect(stack.healthCheckUrl).toBeDefined();
      expect(stack.dashboardUrl).toBeDefined();
    });

    it('should instantiate successfully with custom environment suffix', async () => {
      const stack = new TapStack('test-stack-prod', {
        environmentSuffix: 'prod',
      });

      expect(stack).toBeDefined();
    });

    it('should instantiate successfully with custom tags', async () => {
      const customTags = {
        Environment: 'production',
        Team: 'platform',
      };

      const stack = new TapStack('test-stack-tags', {
        environmentSuffix: 'prod',
        tags: customTags,
      });

      expect(stack).toBeDefined();
    });
  });

  describe('Output Properties', () => {
    let stack: TapStack;

    beforeAll(() => {
      stack = new TapStack('test-stack-outputs', {
        environmentSuffix: 'test',
        tags: {
          Project: 'TradingPlatform',
        },
      });
    });

    it('should export primaryEndpoint output', async () => {
      expect(stack.primaryEndpoint).toBeDefined();
      const endpoint = await stack.primaryEndpoint.promise();
      expect(typeof endpoint).toBe('string');
    });

    it('should export secondaryEndpoint output', async () => {
      expect(stack.secondaryEndpoint).toBeDefined();
      const endpoint = await stack.secondaryEndpoint.promise();
      expect(typeof endpoint).toBe('string');
    });

    it('should export healthCheckUrl output', async () => {
      expect(stack.healthCheckUrl).toBeDefined();
      const url = await stack.healthCheckUrl.promise();
      expect(typeof url).toBe('string');
    });

    it('should export dashboardUrl output', async () => {
      expect(stack.dashboardUrl).toBeDefined();
      const url = await stack.dashboardUrl.promise();
      expect(url).toContain('cloudwatch');
    });
  });
});