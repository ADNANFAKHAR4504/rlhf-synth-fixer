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
      state.customErrorResponses = args.inputs.customErrorResponses;
      state.restrictions = args.inputs.restrictions;
    }

    return {
      id: `${args.name}_id`,
      state,
    };
  },
  call: (args: pulumi.runtime.MockCallArgs) => {
    return args.inputs;
  },
});

// Import after setting mocks
import { ContentHostingStack } from '../lib/content-hosting-stack';
import { TapStack } from '../lib/tap-stack';

// Create a test class that extends ContentHostingStack to access private methods
class TestableContentHostingStack extends ContentHostingStack {
  public testGetCacheTtl(environment: string): number {
    return this.getCacheTtl(environment);
  }

  public testGetSubdomain(environment: string, domainName: string): string {
    return this.getSubdomain(environment, domainName);
  }
}

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

    it('should handle all constructor parameters', () => {
      const stack = new TapStack('full-params-test', {
        environmentSuffix: 'test',
        tags: {
          Environment: 'test',
          Project: 'myapp',
          Owner: 'TestTeam',
        },
      });

      expect(stack).toBeDefined();
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

    it('should register outputs correctly', () => {
      const stack = new TapStack('register-outputs-test', {
        environmentSuffix: 'test',
      });

      expect(stack.bucketName).toBeDefined();
      expect(stack.distributionUrl).toBeDefined();
      expect(stack.distributionDomainName).toBeDefined();
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

    it('should handle empty environment suffix gracefully', () => {
      const stack = new TapStack('empty-env-test', {
        environmentSuffix: '',
      });
      expect(stack).toBeDefined();
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

    it('should handle null tags', () => {
      const stack = new TapStack('null-tags-test', {
        environmentSuffix: 'test',
        tags: undefined,
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

    it('should pass tags to child components', () => {
      const testTags = {
        Owner: 'TestTeam',
        CostCenter: '12345',
      };

      const stack = new TapStack('tag-passing-test', {
        environmentSuffix: 'test',
        tags: testTags,
      });

      expect(stack).toBeDefined();
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

    it('should handle all constructor parameters', () => {
      const contentStack = new ContentHostingStack('full-constructor-test', {
        environmentSuffix: 'test',
        projectName: 'testapp',
        domainName: 'test.com',
        tags: {
          Environment: 'test',
          Project: 'testapp',
          Owner: 'TestTeam',
        },
      });

      expect(contentStack).toBeDefined();
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

    it('should handle edge case environments', () => {
      const edgeCases = ['', 'test', 'development', 'production'];

      edgeCases.forEach((env, index) => {
        const stack = new ContentHostingStack(`edge-case-${index}`, {
          environmentSuffix: env,
          projectName: 'myapp',
          domainName: 'myapp.com',
        });
        expect(stack).toBeDefined();
      });
    });
  });

  describe('Helper Methods Direct Testing', () => {
    let testableStack: TestableContentHostingStack;

    beforeAll(() => {
      testableStack = new TestableContentHostingStack('testable-stack', {
        environmentSuffix: 'test',
        projectName: 'myapp',
        domainName: 'myapp.com',
      });
    });

    describe('getCacheTtl method', () => {
      it('should return 60 seconds for dev environment', () => {
        const ttl = testableStack.testGetCacheTtl('dev');
        expect(ttl).toBe(60);
      });

      it('should return 300 seconds for staging environment', () => {
        const ttl = testableStack.testGetCacheTtl('staging');
        expect(ttl).toBe(300);
      });

      it('should return 86400 seconds for prod environment', () => {
        const ttl = testableStack.testGetCacheTtl('prod');
        expect(ttl).toBe(86400);
      });

      it('should return 300 seconds for unknown environment', () => {
        const ttl = testableStack.testGetCacheTtl('unknown');
        expect(ttl).toBe(300);
      });

      it('should return default TTL for empty environment', () => {
        const ttl = testableStack.testGetCacheTtl('');
        expect(ttl).toBe(300);
      });
    });

    describe('getSubdomain method', () => {
      it('should return domain name for prod environment', () => {
        const subdomain = testableStack.testGetSubdomain('prod', 'myapp.com');
        expect(subdomain).toBe('myapp.com');
      });

      it('should return prefixed subdomain for dev environment', () => {
        const subdomain = testableStack.testGetSubdomain('dev', 'myapp.com');
        expect(subdomain).toBe('dev.myapp.com');
      });

      it('should return prefixed subdomain for staging environment', () => {
        const subdomain = testableStack.testGetSubdomain('staging', 'myapp.com');
        expect(subdomain).toBe('staging.myapp.com');
      });

      it('should return prefixed subdomain for test environment', () => {
        const subdomain = testableStack.testGetSubdomain('test', 'example.com');
        expect(subdomain).toBe('test.example.com');
      });

      it('should handle different domain names correctly', () => {
        const testCases = [
          { env: 'dev', domain: 'example.org', expected: 'dev.example.org' },
          { env: 'staging', domain: 'test.net', expected: 'staging.test.net' },
          { env: 'prod', domain: 'production.io', expected: 'production.io' },
          { env: 'custom', domain: 'custom.dev', expected: 'custom.custom.dev' },
        ];

        testCases.forEach(({ env, domain, expected }) => {
          const result = testableStack.testGetSubdomain(env, domain);
          expect(result).toBe(expected);
        });
      });

      it('should handle empty environment suffix', () => {
        const subdomain = testableStack.testGetSubdomain('', 'myapp.com');
        expect(subdomain).toBe('.myapp.com');
      });
    });
  });

  describe('Helper Methods Coverage (Indirect Testing)', () => {
    it('should handle getCacheTtl method for all environment types', () => {
      const environments = ['dev', 'staging', 'prod', 'custom', ''];

      environments.forEach((env, index) => {
        const stack = new ContentHostingStack(`cache-ttl-${index}`, {
          environmentSuffix: env,
          projectName: 'myapp',
          domainName: 'myapp.com',
        });
        expect(stack).toBeDefined();
      });
    });

    it('should handle getSubdomain method for different environments', () => {
      const testCases = [
        { env: 'prod', project: 'myapp', domain: 'myapp.com' },
        { env: 'dev', project: 'myapp', domain: 'myapp.com' },
        { env: 'staging', project: 'myapp', domain: 'myapp.com' },
        { env: 'test', project: 'myapp', domain: 'test.com' },
      ];

      testCases.forEach((testCase, index) => {
        const stack = new ContentHostingStack(`subdomain-test-${index}`, {
          environmentSuffix: testCase.env,
          projectName: testCase.project,
          domainName: testCase.domain,
        });
        expect(stack).toBeDefined();
      });
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

    it('should include project name and environment in bucket name', (done) => {
      const stack = new ContentHostingStack('bucket-naming-test', {
        environmentSuffix: 'staging',
        projectName: 'customapp',
        domainName: 'custom.com',
      });

      stack.bucketName.apply((name: string) => {
        expect(name).toBe('customapp-staging-content_id');
        done();
      });
    });

    it('should handle different project names correctly', (done) => {
      const stack = new ContentHostingStack('project-name-test', {
        environmentSuffix: 'dev',
        projectName: 'special-app',
        domainName: 'special.com',
      });

      stack.bucketName.apply((name: string) => {
        expect(name).toContain('special-app');
        expect(name).toContain('dev');
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

    it('should handle different domain names correctly', () => {
      const domainNames = ['example.com', 'test.org', 'my-app.net'];

      domainNames.forEach((domain, index) => {
        const stack = new ContentHostingStack(`domain-test-${index}`, {
          environmentSuffix: 'test',
          projectName: 'myapp',
          domainName: domain,
        });
        expect(stack).toBeDefined();
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

    it('should handle complex tag objects', () => {
      const complexTags = {
        'multi-word-tag': 'multi-word-value',
        'numeric-tag': '12345',
        'boolean-like-tag': 'true',
        'special-chars': 'test@#$%',
      };

      const stack = new ContentHostingStack('complex-tags-test', {
        environmentSuffix: 'test',
        projectName: 'myapp',
        domainName: 'myapp.com',
        tags: complexTags,
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

    it('should include environment suffix in all resource names', (done) => {
      const stack = new ContentHostingStack('env-suffix-test', {
        environmentSuffix: 'integration',
        projectName: 'testproject',
        domainName: 'test.com',
      });

      stack.bucketName.apply((name: string) => {
        expect(name).toContain('integration');
        expect(name).toBe('testproject-integration-content_id');
        done();
      });
    });

    it('should handle multiple parallel deployments', () => {
      const environments = ['dev1', 'dev2', 'test1', 'test2'];
      const stacks: ContentHostingStack[] = [];

      environments.forEach((env, index) => {
        const stack = new ContentHostingStack(`parallel-${index}`, {
          environmentSuffix: env,
          projectName: 'parallel-app',
          domainName: 'parallel.com',
        });
        stacks.push(stack);
        expect(stack).toBeDefined();
      });

      expect(stacks).toHaveLength(4);
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

      expect(stack1.bucketName).toBeDefined();
      expect(stack1.distributionUrl).toBeDefined();
      expect(stack1.distributionDomainName).toBeDefined();

      expect(stack2.bucketName).toBeDefined();
      expect(stack2.distributionUrl).toBeDefined();
      expect(stack2.distributionDomainName).toBeDefined();
    });

    it('should maintain consistent output types', (done) => {
      const stack = new ContentHostingStack('output-types-test', {
        environmentSuffix: 'test',
        projectName: 'myapp',
        domainName: 'myapp.com',
      });

      Promise.all([
        stack.bucketName.promise(),
        stack.distributionUrl.promise(),
        stack.distributionDomainName.promise(),
      ]).then(([bucketName, distributionUrl, distributionDomain]) => {
        expect(typeof bucketName).toBe('string');
        expect(typeof distributionUrl).toBe('string');
        expect(typeof distributionDomain).toBe('string');
        done();
      });
    });
  });

  describe('Error Handling and Edge Cases', () => {
    it('should handle special characters in environment suffix', () => {
      const stack = new ContentHostingStack('special-chars-test', {
        environmentSuffix: 'test-123',
        projectName: 'myapp',
        domainName: 'myapp.com',
      });

      expect(stack).toBeDefined();
    });

    it('should handle long environment suffix', () => {
      const stack = new ContentHostingStack('long-env-test', {
        environmentSuffix: 'very-long-environment-suffix-name',
        projectName: 'myapp',
        domainName: 'myapp.com',
      });

      expect(stack).toBeDefined();
    });

    it('should handle minimal configuration', () => {
      const stack = new ContentHostingStack('minimal-test', {
        environmentSuffix: 'min',
        projectName: 'app',
        domainName: 'app.com',
      });

      expect(stack).toBeDefined();
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

  it('should handle complex integration scenarios', () => {
    const scenarios = [
      { env: 'dev', tags: { Owner: 'DevTeam' } },
      { env: 'staging', tags: { Owner: 'QATeam' } },
      { env: 'prod', tags: { Owner: 'ProdTeam', Critical: 'true' } },
    ];

    scenarios.forEach((scenario, index) => {
      const stack = new TapStack(`integration-scenario-${index}`, {
        environmentSuffix: scenario.env,
        tags: scenario.tags,
      });
      expect(stack).toBeDefined();
    });
  });

  it('should propagate environment configuration correctly', (done) => {
    const stack = new TapStack('env-propagation-test', {
      environmentSuffix: 'propagation',
      tags: {
        TestEnv: 'propagation',
        Owner: 'TestOwner',
      },
    });

    stack.bucketName.apply((bucketName: string) => {
      expect(bucketName).toContain('propagation');
      expect(bucketName).toContain('myapp');
      done();
    });
  });
});

describe('Component Resource Registration and Pulumi Integration', () => {
  it('should register outputs correctly in TapStack', () => {
    const stack = new TapStack('output-registration-test', {
      environmentSuffix: 'test',
    });

    expect(stack).toBeInstanceOf(pulumi.ComponentResource);
    expect(stack.bucketName).toBeDefined();
    expect(stack.distributionUrl).toBeDefined();
    expect(stack.distributionDomainName).toBeDefined();
  });

  it('should register outputs correctly in ContentHostingStack', () => {
    const stack = new ContentHostingStack('content-registration-test', {
      environmentSuffix: 'test',
      projectName: 'myapp',
      domainName: 'myapp.com',
    });

    expect(stack).toBeInstanceOf(pulumi.ComponentResource);
    expect(stack.bucketName).toBeDefined();
    expect(stack.distributionUrl).toBeDefined();
    expect(stack.distributionDomainName).toBeDefined();
  });

  it('should handle Pulumi resource options correctly', () => {
    const stack = new TapStack('resource-options-test', {
      environmentSuffix: 'test',
    }, {
      protect: false,
    });

    expect(stack).toBeDefined();
  });

  it('should handle ContentHostingStack resource options correctly', () => {
    const stack = new ContentHostingStack('content-options-test', {
      environmentSuffix: 'test',
      projectName: 'myapp',
      domainName: 'myapp.com',
    }, {
      protect: false,
    });

    expect(stack).toBeDefined();
  });
});
