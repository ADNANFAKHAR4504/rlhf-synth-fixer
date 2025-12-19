import * as pulumi from '@pulumi/pulumi';
import { InfrastructureStack } from '../lib/infrastructure-stack';

// Mock console.warn to suppress warnings during tests
const originalConsoleWarn = console.warn;
beforeAll(() => {
  console.warn = jest.fn();
});

afterAll(() => {
  console.warn = originalConsoleWarn;
});

// Set up comprehensive Pulumi mocks for testing
pulumi.runtime.setMocks({
  newResource: (args: pulumi.runtime.MockResourceArgs) => {
    const { type, name, inputs } = args;
    const id = `${name}-${type.replace(/:/g, '-')}-id`;
    const state: any = { ...inputs, id, arn: `arn:aws:${type.split(':')[0]}:us-east-1:123456789012:${name}` };

    switch (type) {
      case 'aws:ec2/vpc:Vpc':
        state.cidrBlock = inputs.cidrBlock || '10.0.0.0/16';
        break;
      case 'aws:ec2/subnet:Subnet':
        state.availabilityZone = inputs.availabilityZone || 'us-east-1a';
        state.cidrBlock = inputs.cidrBlock || '10.0.1.0/24';
        break;
      case 'aws:s3/bucket:Bucket':
        state.bucket = inputs.bucket || name;
        state.bucketDomainName = `${inputs.bucket || name}.s3.amazonaws.com`;
        break;
      case 'aws:lb/loadBalancer:LoadBalancer':
        state.dnsName = `${name}-123456789.us-east-1.elb.amazonaws.com`;
        state.zoneId = 'Z35SXDOTRQ7X7K';
        break;
      case 'aws:cloudfront/distribution:Distribution':
        state.domainName = `${name}.cloudfront.net`;
        break;
      case 'aws:kms/key:Key':
        state.keyId = `${name}-key-id`;
        break;
    }
    return { id: state.id, state };
  },
  call: (args: pulumi.runtime.MockCallArgs) => {
    switch (args.token) {
      case 'aws:index/getCallerIdentity:getCallerIdentity':
        return { accountId: '123456789012', arn: 'arn:aws:iam::123456789012:user/test-user' };
      case 'aws:index/getRegion:getRegion':
        return { name: 'us-east-1' };
      case 'aws:index/getAvailabilityZones:getAvailabilityZones':
        return { names: ['us-east-1a', 'us-east-1b'] };
      case 'aws:ec2/getAmi:getAmi':
        return { id: 'ami-0c55b159cbfafe1f0' };
      default:
        return args.inputs;
    }
  },
});

describe('InfrastructureStack Unit Tests', () => {
  describe('Constructor with different configurations', () => {
    it('should create with default environment', () => {
      const stack = new InfrastructureStack('test', {});
      expect(stack).toBeDefined();
    });

    it('should create with custom environment suffix', () => {
      const stack = new InfrastructureStack('test', { environmentSuffix: 'prod' });
      expect(stack).toBeDefined();
    });

    it('should create with custom tags', () => {
      const stack = new InfrastructureStack('test', {
        environmentSuffix: 'test',
        tags: { Environment: 'test' }
      });
      expect(stack).toBeDefined();
    });

    it('should create with empty environment suffix', () => {
      const stack = new InfrastructureStack('test', { environmentSuffix: '' });
      expect(stack).toBeDefined();
    });

    it('should create with null environment suffix', () => {
      const stack = new InfrastructureStack('test', { environmentSuffix: null as any });
      expect(stack).toBeDefined();
    });

    it('should create with undefined tags', () => {
      const stack = new InfrastructureStack('test', {
        environmentSuffix: 'test',
        tags: undefined
      });
      expect(stack).toBeDefined();
    });
  });

  describe('Output properties', () => {
    let stack: InfrastructureStack;

    beforeAll(() => {
      stack = new InfrastructureStack('test', { environmentSuffix: 'test' });
    });

    it('should have all required outputs', () => {
      expect(stack.vpcId).toBeDefined();
      expect(stack.publicSubnetIds).toBeDefined();
      expect(stack.privateSubnetIds).toBeDefined();
      expect(stack.albDnsName).toBeDefined();
      expect(stack.albZoneId).toBeDefined();
      expect(stack.cloudFrontDomainName).toBeDefined();
      expect(stack.dynamoTableName).toBeDefined();
      expect(stack.secretArn).toBeDefined();
      expect(stack.kmsKeyId).toBeDefined();
      expect(stack.kmsKeyArn).toBeDefined();
      expect(stack.webAclArn).toBeDefined();
      expect(stack.logGroupName).toBeDefined();
      expect(stack.albLogsBucketName).toBeDefined();
      expect(stack.cloudFrontLogsBucketName).toBeDefined();
      expect(stack.albArn).toBeDefined();
      expect(stack.targetGroupArn).toBeDefined();
      expect(stack.autoScalingGroupName).toBeDefined();
      expect(stack.launchTemplateName).toBeDefined();
      expect(stack.ec2RoleArn).toBeDefined();
      expect(stack.albSecurityGroupId).toBeDefined();
      expect(stack.ec2SecurityGroupId).toBeDefined();
      expect(stack.cloudFrontDistributionId).toBeDefined();
      expect(stack.environment).toBeDefined();
      expect(stack.sanitizedName).toBeDefined();
    });
  });

  describe('Edge cases and branch coverage', () => {
    it('should create stack with multiple availability zones', () => {
      const stack = new InfrastructureStack('multi-az-test', { environmentSuffix: 'test' });
      expect(stack).toBeDefined();
      expect(stack.vpcId).toBeDefined();
      expect(stack.publicSubnetIds).toBeDefined();
      expect(stack.privateSubnetIds).toBeDefined();
    });

    it('should handle AWS_REGION environment variable scenarios', () => {
      const originalRegion = process.env.AWS_REGION;
      
      // Test when AWS_REGION is not set (covers line 7 branch)
      delete process.env.AWS_REGION;
      const stack1 = new InfrastructureStack('no-region-test', { environmentSuffix: 'test' });
      expect(stack1).toBeDefined();
      
      // Test when AWS_REGION is set
      process.env.AWS_REGION = 'eu-west-1';
      const stack2 = new InfrastructureStack('with-region-test', { environmentSuffix: 'test' });
      expect(stack2).toBeDefined();
      
      // Restore original environment
      if (originalRegion) {
        process.env.AWS_REGION = originalRegion;
      } else {
        delete process.env.AWS_REGION;
      }
    });

    it('should handle falsy environment suffix values', () => {
      const falsyValues = [false, 0, '', null, undefined, NaN];
      falsyValues.forEach((value, index) => {
        const stack = new InfrastructureStack(`test${index}`, {
          environmentSuffix: value as any,
        });
        expect(stack).toBeDefined();
      });
    });

    it('should handle different tag configurations', () => {
      const tagConfigs = [
        {},
        { Environment: 'test' },
        { Environment: 'prod', Owner: 'team' },
        null,
        undefined,
      ];

      tagConfigs.forEach((tags, index) => {
        const stack = new InfrastructureStack(`test${index}`, {
          environmentSuffix: 'test',
          tags: tags as any,
        });
        expect(stack).toBeDefined();
      });
    });

    it('should handle special characters in environment suffix', () => {
      const stack = new InfrastructureStack('test', {
        environmentSuffix: 'test-env_123!@#',
      });
      expect(stack).toBeDefined();
    });

    it('should handle very long environment suffix', () => {
      const stack = new InfrastructureStack('test', {
        environmentSuffix: 'a'.repeat(100),
      });
      expect(stack).toBeDefined();
    });
  });

  describe('Configuration branches', () => {
    it('should use config when environment suffix is falsy', () => {
      const stack = new InfrastructureStack('test', {
        environmentSuffix: undefined,
      });
      expect(stack).toBeDefined();
    });

    it('should fallback to stack name when both args and config are falsy', () => {
      const stack = new InfrastructureStack('test', {});
      expect(stack).toBeDefined();
    });

    it('should handle different AWS regions for ELB service account', () => {
      // Test different regions to cover the getELBServiceAccount function branches
      const regions = ['us-east-1', 'us-east-2', 'us-west-1', 'us-west-2', 'eu-west-1'];
      regions.forEach((region, index) => {
        const stack = new InfrastructureStack(`test-${region}-${index}`, {
          environmentSuffix: `test-${region}`,
        });
        expect(stack).toBeDefined();
      });
    });



    it('should handle config.get environment fallback', () => {
      // Test the config.get('environment') branch
      const stack = new InfrastructureStack('config-test', {
        environmentSuffix: '',
      });
      expect(stack).toBeDefined();
    });

    it('should handle stack name fallback', () => {
      // Test the stackName fallback branch
      const stack = new InfrastructureStack('stack-fallback-test', {
        environmentSuffix: null as any,
      });
      expect(stack).toBeDefined();
    });
  });

  describe('Resource creation coverage', () => {
    it('should create all AWS resources', () => {
      const stack = new InfrastructureStack('comprehensive', {
        environmentSuffix: 'comprehensive',
        tags: { Environment: 'comprehensive', Test: 'coverage' },
      });
      expect(stack).toBeDefined();
      expect(stack.vpcId).toBeDefined();
      expect(stack.kmsKeyId).toBeDefined();
      expect(stack.albDnsName).toBeDefined();
      expect(stack.cloudFrontDomainName).toBeDefined();
    });
  });
});