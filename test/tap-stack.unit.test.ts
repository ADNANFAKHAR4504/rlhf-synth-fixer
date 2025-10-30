import * as pulumi from '@pulumi/pulumi';

// Set up Pulumi testing mode before any imports
pulumi.runtime.setMocks({
  newResource: (args: pulumi.runtime.MockResourceArgs): {
    id: string;
    state: any;
  } => {
    const state = { ...args.inputs };

    // Add specific properties based on resource type
    if (args.type === 'aws:s3/bucket:Bucket') {
      state.bucketRegionalDomainName = `${args.name}.s3.eu-west-1.amazonaws.com`;
      state.arn = `arn:aws:s3:::${args.name}`;
    } else if (args.type === 'aws:cloudfront/originAccessIdentity:OriginAccessIdentity') {
      state.iamArn = `arn:aws:iam::cloudfront:user/CloudFront Origin Access Identity ${args.name}`;
      state.cloudfrontAccessIdentityPath = `origin-access-identity/cloudfront/${args.name}`;
    } else if (args.type === 'aws:cloudfront/distribution:Distribution') {
      state.domainName = `${args.name}.cloudfront.net`;
      state.hostedZoneId = 'Z2FDTNDATAQYW2';
    } else if (args.type === 'aws:acm/certificate:Certificate') {
      state.arn = `arn:aws:acm:us-east-1:123456789012:certificate/${args.name}`;
      state.domainValidationOptions = [
        {
          resourceRecordName: `_${args.name}.myapp.com`,
          resourceRecordType: 'CNAME',
          resourceRecordValue: `_${args.name}.validation.acm.amazonaws.com`,
        },
      ];
    } else if (args.type === 'aws:route53/record:Record') {
      state.fqdn = args.inputs.name || `${args.name}.myapp.com`;
    }

    return {
      id: `${args.name}_id`,
      state,
    };
  },
  call: (args: pulumi.runtime.MockCallArgs) => {
    if (args.token === 'aws:route53/getZone:getZone') {
      return {
        zoneId: 'Z1234567890ABC',
        name: 'myapp.com',
      };
    }
    return args.inputs;
  },
});

// Import after setting mocks
import { TapStack } from '../lib/tap-stack';

describe('TapStack Unit Tests', () => {
  describe('Stack Initialization', () => {
    it('should create a TapStack instance', () => {
      const stack = new TapStack('test-stack', {
        environmentSuffix: 'dev',
        tags: {
          Environment: 'dev',
          Project: 'myapp',
          ManagedBy: 'Pulumi',
        },
      });

      expect(stack).toBeDefined();
      expect(stack.constructor.name).toBe('TapStack');
    });

    it('should expose required outputs', () => {
      const stack = new TapStack('test-stack-outputs', {
        environmentSuffix: 'dev',
      });

      expect(stack.bucketName).toBeDefined();
      expect(stack.distributionUrl).toBeDefined();
      expect(stack.distributionDomainName).toBeDefined();
    });
  });

  describe('Output Validation', () => {
    let stack: TapStack;

    beforeAll(() => {
      stack = new TapStack('output-test', {
        environmentSuffix: 'test',
      });
    });

    it('should have bucketName output as a Pulumi Output', (done) => {
      expect(pulumi.Output.isInstance(stack.bucketName)).toBe(true);

      stack.bucketName.apply((name: string) => {
        expect(name).toBeDefined();
        expect(typeof name).toBe('string');
        done();
      });
    });

    it('should have distributionUrl output as a Pulumi Output', (done) => {
      expect(pulumi.Output.isInstance(stack.distributionUrl)).toBe(true);

      stack.distributionUrl.apply((url: string) => {
        expect(url).toBeDefined();
        expect(typeof url).toBe('string');
        expect(url).toMatch(/^https:\/\//);
        done();
      });
    });

    it('should have distributionDomainName output as a Pulumi Output', (done) => {
      expect(pulumi.Output.isInstance(stack.distributionDomainName)).toBe(true);

      stack.distributionDomainName.apply((domain: string) => {
        expect(domain).toBeDefined();
        expect(typeof domain).toBe('string');
        done();
      });
    });
  });

  describe('Environment Suffix Integration', () => {
    it('should accept dev environment suffix', () => {
      const devStack = new TapStack('dev-test', { environmentSuffix: 'dev' });
      expect(devStack).toBeDefined();
      expect(devStack.bucketName).toBeDefined();
    });

    it('should accept staging environment suffix', () => {
      const stagingStack = new TapStack('staging-test', {
        environmentSuffix: 'staging',
      });
      expect(stagingStack).toBeDefined();
      expect(stagingStack.bucketName).toBeDefined();
    });

    it('should accept prod environment suffix', () => {
      const prodStack = new TapStack('prod-test', {
        environmentSuffix: 'prod',
      });
      expect(prodStack).toBeDefined();
      expect(prodStack.bucketName).toBeDefined();
    });

    it('should use default environment suffix when not provided', () => {
      const defaultStack = new TapStack('default-test', {});
      expect(defaultStack).toBeDefined();
      expect(defaultStack.bucketName).toBeDefined();
    });
  });

  describe('Resource Tagging', () => {
    it('should accept custom tags', () => {
      const customTags = {
        Environment: 'test',
        Project: 'custom-project',
        ManagedBy: 'Pulumi',
        CustomTag: 'custom-value',
      };

      const taggedStack = new TapStack('tagged-test', {
        environmentSuffix: 'test',
        tags: customTags,
      });

      expect(taggedStack).toBeDefined();
      expect(taggedStack.bucketName).toBeDefined();
    });

    it('should handle empty tags object', () => {
      const stack = new TapStack('empty-tags-test', {
        environmentSuffix: 'test',
        tags: {},
      });

      expect(stack).toBeDefined();
    });
  });

  describe('Component Integration', () => {
    it('should instantiate ContentHostingStack component', () => {
      const stack = new TapStack('component-integration-test', {
        environmentSuffix: 'test',
      });

      expect(stack).toBeDefined();
      expect(stack.bucketName).toBeDefined();
      expect(stack.distributionUrl).toBeDefined();
      expect(stack.distributionDomainName).toBeDefined();
    });

    it('should pass environment suffix to child components', (done) => {
      const stack = new TapStack('env-pass-test', {
        environmentSuffix: 'custom',
      });

      stack.distributionUrl.apply((url: string) => {
        expect(url).toContain('custom.myapp.com');
        done();
      });
    });
  });
});
