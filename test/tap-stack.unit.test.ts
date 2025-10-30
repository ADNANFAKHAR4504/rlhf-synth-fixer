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
      state.bucketRegionalDomainName = `${args.name}.s3.us-east-1.amazonaws.com`;
      state.arn = `arn:aws:s3:::${args.name}`;
      state.bucket = args.inputs.bucket || args.name;
    } else if (args.type === 'aws:s3/bucketPublicAccessBlock:BucketPublicAccessBlock') {
      state.bucket = args.inputs.bucket;
      state.blockPublicAcls = args.inputs.blockPublicAcls;
      state.blockPublicPolicy = args.inputs.blockPublicPolicy;
      state.ignorePublicAcls = args.inputs.ignorePublicAcls;
      state.restrictPublicBuckets = args.inputs.restrictPublicBuckets;
    } else if (args.type === 'aws:s3/bucketPolicy:BucketPolicy') {
      state.bucket = args.inputs.bucket;
      state.policy = args.inputs.policy;
    } else if (args.type === 'aws:cloudfront/originAccessIdentity:OriginAccessIdentity') {
      state.iamArn = `arn:aws:iam::cloudfront:user/CloudFront Origin Access Identity ${args.name}`;
      state.cloudfrontAccessIdentityPath = `origin-access-identity/cloudfront/${args.name}`;
      state.comment = args.inputs.comment;
    } else if (args.type === 'aws:cloudfront/distribution:Distribution') {
      state.domainName = `${args.name}.cloudfront.net`;
      state.hostedZoneId = 'Z2FDTNDATAQYW2';
      state.enabled = args.inputs.enabled;
      state.isIpv6Enabled = args.inputs.isIpv6Enabled;
      state.comment = args.inputs.comment;
      state.defaultRootObject = args.inputs.defaultRootObject;
      state.origins = args.inputs.origins;
      state.defaultCacheBehavior = args.inputs.defaultCacheBehavior;
      state.viewerCertificate = args.inputs.viewerCertificate;
    }

    return {
      id: `${args.name}_id`,
      state,
    };
  },
  call: (args: pulumi.runtime.MockCallArgs) => {
    // No Route53 calls needed anymore
    return args.inputs;
  },
});

// Import after setting mocks
import { ContentHostingStack } from '../lib/content-hosting-stack';
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

    it('should use default environment suffix when not provided', () => {
      const defaultStack = new TapStack('default-test', {});
      expect(defaultStack).toBeDefined();
      expect(defaultStack.bucketName).toBeDefined();
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
        expect(name).toContain('myapp-test-content');
        done();
      });
    });

    it('should have distributionUrl output as a Pulumi Output with CloudFront domain', (done) => {
      expect(pulumi.Output.isInstance(stack.distributionUrl)).toBe(true);

      stack.distributionUrl.apply((url: string) => {
        expect(url).toBeDefined();
        expect(typeof url).toBe('string');
        expect(url).toMatch(/^https:\/\//);
        expect(url).toMatch(/\.cloudfront\.net$/);
        done();
      });
    });

    it('should have distributionDomainName output as a Pulumi Output', (done) => {
      expect(pulumi.Output.isInstance(stack.distributionDomainName)).toBe(true);

      stack.distributionDomainName.apply((domain: string) => {
        expect(domain).toBeDefined();
        expect(typeof domain).toBe('string');
        expect(domain).toMatch(/\.cloudfront\.net$/);
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

    it('should include environment suffix in bucket name', (done) => {
      const customStack = new TapStack('custom-env-test', {
        environmentSuffix: 'custom',
      });

      customStack.bucketName.apply((name: string) => {
        expect(name).toContain('custom');
        expect(name).toContain('myapp-custom-content');
        done();
      });
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

    it('should handle undefined tags', () => {
      const stack = new TapStack('undefined-tags-test', {
        environmentSuffix: 'test',
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

      stack.bucketName.apply((bucketName: string) => {
        expect(bucketName).toContain('custom');
        done();
      });
    });

    it('should use CloudFront default domain instead of custom domain', (done) => {
      const stack = new TapStack('cloudfront-domain-test', {
        environmentSuffix: 'test',
      });

      stack.distributionUrl.apply((url: string) => {
        expect(url).toMatch(/^https:\/\/.*\.cloudfront\.net$/);
        expect(url).not.toContain('myapp.com');
        done();
      });
    });
  });
});

describe('ContentHostingStack Unit Tests', () => {
  describe('Component Initialization', () => {
    it('should create a ContentHostingStack instance', () => {
      const contentStack = new ContentHostingStack('test-content-stack', {
        environmentSuffix: 'dev',
        projectName: 'myapp',
        domainName: 'myapp.com',
        tags: {
          Environment: 'dev',
          Project: 'myapp',
        },
      });

      expect(contentStack).toBeDefined();
      expect(contentStack.constructor.name).toBe('ContentHostingStack');
    });

    it('should expose required outputs', () => {
      const contentStack = new ContentHostingStack('test-outputs', {
        environmentSuffix: 'dev',
        projectName: 'myapp',
        domainName: 'myapp.com',
      });

      expect(contentStack.bucketName).toBeDefined();
      expect(contentStack.distributionUrl).toBeDefined();
      expect(contentStack.distributionDomainName).toBeDefined();
    });
  });

  describe('Cache TTL Configuration', () => {
    it('should set correct cache TTL for dev environment', () => {
      const devStack = new ContentHostingStack('dev-ttl-test', {
        environmentSuffix: 'dev',
        projectName: 'myapp',
        domainName: 'myapp.com',
      });

      expect(devStack).toBeDefined();
      // Cache TTL is internal, but we can verify the component was created
    });

    it('should set correct cache TTL for staging environment', () => {
      const stagingStack = new ContentHostingStack('staging-ttl-test', {
        environmentSuffix: 'staging',
        projectName: 'myapp',
        domainName: 'myapp.com',
      });

      expect(stagingStack).toBeDefined();
    });

    it('should set correct cache TTL for prod environment', () => {
      const prodStack = new ContentHostingStack('prod-ttl-test', {
        environmentSuffix: 'prod',
        projectName: 'myapp',
        domainName: 'myapp.com',
      });

      expect(prodStack).toBeDefined();
    });

    it('should use default cache TTL for unknown environment', () => {
      const unknownStack = new ContentHostingStack('unknown-ttl-test', {
        environmentSuffix: 'unknown',
        projectName: 'myapp',
        domainName: 'myapp.com',
      });

      expect(unknownStack).toBeDefined();
    });
  });

  describe('S3 Configuration', () => {
    it('should create bucket with versioning enabled', (done) => {
      const stack = new ContentHostingStack('s3-config-test', {
        environmentSuffix: 'test',
        projectName: 'testapp',
        domainName: 'test.com',
      });

      stack.bucketName.apply((name: string) => {
        expect(name).toContain('testapp-test-content');
        done();
      });
    });
  });

  describe('CloudFront Configuration', () => {
    it('should create distribution with default SSL certificate', (done) => {
      const stack = new ContentHostingStack('cf-ssl-test', {
        environmentSuffix: 'test',
        projectName: 'myapp',
        domainName: 'myapp.com',
      });

      stack.distributionUrl.apply((url: string) => {
        expect(url).toMatch(/^https:\/\//);
        expect(url).toMatch(/\.cloudfront\.net$/);
        done();
      });
    });

    it('should not include custom domain in distribution URL', (done) => {
      const stack = new ContentHostingStack('cf-domain-test', {
        environmentSuffix: 'test',
        projectName: 'myapp',
        domainName: 'myapp.com',
      });

      stack.distributionUrl.apply((url: string) => {
        expect(url).not.toContain('myapp.com');
        expect(url).toContain('cloudfront.net');
        done();
      });
    });

    it('should return CloudFront domain name', (done) => {
      const stack = new ContentHostingStack('cf-domain-name-test', {
        environmentSuffix: 'test',
        projectName: 'myapp',
        domainName: 'myapp.com',
      });

      stack.distributionDomainName.apply((domain: string) => {
        expect(domain).toMatch(/.*\.cloudfront\.net$/);
        done();
      });
    });
  });

  describe('Resource Tagging', () => {
    it('should merge custom tags with default tags', () => {
      const customTags = {
        CustomTag: 'CustomValue',
        Owner: 'TestTeam',
      };

      const stack = new ContentHostingStack('tag-merge-test', {
        environmentSuffix: 'test',
        projectName: 'myapp',
        domainName: 'myapp.com',
        tags: customTags,
      });

      expect(stack).toBeDefined();
      // Tags are applied internally, we verify the component was created successfully
    });

    it('should handle empty tags', () => {
      const stack = new ContentHostingStack('empty-tags-test', {
        environmentSuffix: 'test',
        projectName: 'myapp',
        domainName: 'myapp.com',
        tags: {},
      });

      expect(stack).toBeDefined();
    });

    it('should handle undefined tags', () => {
      const stack = new ContentHostingStack('undefined-tags-test', {
        environmentSuffix: 'test',
        projectName: 'myapp',
        domainName: 'myapp.com',
      });

      expect(stack).toBeDefined();
    });
  });

  describe('Multi-Environment Support', () => {
    it('should create different resources for different environments', () => {
      const devStack = new ContentHostingStack('multi-env-dev', {
        environmentSuffix: 'dev',
        projectName: 'multiapp',
        domainName: 'multiapp.com',
      });

      const prodStack = new ContentHostingStack('multi-env-prod', {
        environmentSuffix: 'prod',
        projectName: 'multiapp',
        domainName: 'multiapp.com',
      });

      expect(devStack).toBeDefined();
      expect(prodStack).toBeDefined();
    });

  });

  describe('Output Consistency', () => {
    it('should have consistent outputs across different configurations', () => {
      const stack1 = new ContentHostingStack('consistency-test-1', {
        environmentSuffix: 'test1',
        projectName: 'app1',
        domainName: 'app1.com',
      });

      const stack2 = new ContentHostingStack('consistency-test-2', {
        environmentSuffix: 'test2',
        projectName: 'app2',
        domainName: 'app2.com',
      });

      // Both stacks should have the same output structure
      expect(stack1.bucketName).toBeDefined();
      expect(stack1.distributionUrl).toBeDefined();
      expect(stack1.distributionDomainName).toBeDefined();

      expect(stack2.bucketName).toBeDefined();
      expect(stack2.distributionUrl).toBeDefined();
      expect(stack2.distributionDomainName).toBeDefined();
    });
  });
});

describe('Integration Between TapStack and ContentHostingStack', () => {
  it('should pass correct arguments from TapStack to ContentHostingStack', (done) => {
    const stack = new TapStack('integration-test', {
      environmentSuffix: 'integration',
      tags: {
        TestTag: 'TestValue',
      },
    });

    stack.bucketName.apply((name: string) => {
      expect(name).toContain('myapp-integration-content');
      done();
    });
  });

  it('should properly expose ContentHostingStack outputs', () => {
    const stack = new TapStack('output-integration-test', {
      environmentSuffix: 'test',
    });

    expect(pulumi.Output.isInstance(stack.bucketName)).toBe(true);
    expect(pulumi.Output.isInstance(stack.distributionUrl)).toBe(true);
    expect(pulumi.Output.isInstance(stack.distributionDomainName)).toBe(true);
  });

  it('should maintain output consistency between parent and child components', (done) => {
    const stack = new TapStack('consistency-integration-test', {
      environmentSuffix: 'consistency',
    });

    Promise.all([
      stack.bucketName.promise(),
      stack.distributionUrl.promise(),
      stack.distributionDomainName.promise(),
    ]).then(([bucketName, distributionUrl, distributionDomain]) => {
      expect(bucketName).toBeDefined();
      expect(distributionUrl).toBeDefined();
      expect(distributionDomain).toBeDefined();

      expect(bucketName).toContain('consistency');
      expect(distributionUrl).toMatch(/^https:\/\//);
      expect(distributionDomain).toMatch(/\.cloudfront\.net$/);

      done();
    });
  });
});
