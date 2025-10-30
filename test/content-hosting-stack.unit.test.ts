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
import { ContentHostingStack } from '../lib/content-hosting-stack';

describe('ContentHostingStack Unit Tests', () => {
  describe('Stack Initialization', () => {
    it('should create a ContentHostingStack instance', () => {
      const stack = new ContentHostingStack('test-content-stack', {
        environmentSuffix: 'dev',
        projectName: 'myapp',
        domainName: 'myapp.com',
      });

      expect(stack).toBeDefined();
      expect(stack.constructor.name).toBe('ContentHostingStack');
    });

    it('should expose required outputs', () => {
      const stack = new ContentHostingStack('test-content-stack-outputs', {
        environmentSuffix: 'dev',
        projectName: 'myapp',
        domainName: 'myapp.com',
      });

      expect(stack.bucketName).toBeDefined();
      expect(stack.distributionUrl).toBeDefined();
      expect(stack.distributionDomainName).toBeDefined();
    });
  });

  describe('Environment-Specific Configuration', () => {
    it('should handle dev environment configuration', () => {
      const devStack = new ContentHostingStack('dev-stack', {
        environmentSuffix: 'dev',
        projectName: 'myapp',
        domainName: 'myapp.com',
      });

      expect(devStack).toBeDefined();
      expect(devStack.bucketName).toBeDefined();
    });

    it('should handle staging environment configuration', () => {
      const stagingStack = new ContentHostingStack('staging-stack', {
        environmentSuffix: 'staging',
        projectName: 'myapp',
        domainName: 'myapp.com',
      });

      expect(stagingStack).toBeDefined();
      expect(stagingStack.bucketName).toBeDefined();
    });

    it('should handle prod environment configuration', () => {
      const prodStack = new ContentHostingStack('prod-stack', {
        environmentSuffix: 'prod',
        projectName: 'myapp',
        domainName: 'myapp.com',
      });

      expect(prodStack).toBeDefined();
      expect(prodStack.bucketName).toBeDefined();
    });
  });

  describe('Resource Outputs', () => {
    let stack: ContentHostingStack;

    beforeAll(() => {
      stack = new ContentHostingStack('output-test-stack', {
        environmentSuffix: 'test',
        projectName: 'myapp',
        domainName: 'myapp.com',
      });
    });

    it('should output bucket name as Pulumi Output', (done) => {
      expect(pulumi.Output.isInstance(stack.bucketName)).toBe(true);

      stack.bucketName.apply((name: string) => {
        expect(name).toBeDefined();
        expect(typeof name).toBe('string');
        done();
      });
    });

    it('should output distribution URL with HTTPS', (done) => {
      expect(pulumi.Output.isInstance(stack.distributionUrl)).toBe(true);

      stack.distributionUrl.apply((url: string) => {
        expect(url).toBeDefined();
        expect(url).toMatch(/^https:\/\//);
        done();
      });
    });

    it('should output CloudFront distribution domain name', (done) => {
      expect(pulumi.Output.isInstance(stack.distributionDomainName)).toBe(true);

      stack.distributionDomainName.apply((domain: string) => {
        expect(domain).toBeDefined();
        expect(typeof domain).toBe('string');
        done();
      });
    });
  });

  describe('Resource Tagging', () => {
    it('should apply custom tags to resources', () => {
      const customTags = {
        Environment: 'test',
        Project: 'custom-project',
        ManagedBy: 'Pulumi',
        CustomTag: 'custom-value',
      };

      const taggedStack = new ContentHostingStack('tagged-stack', {
        environmentSuffix: 'test',
        projectName: 'myapp',
        domainName: 'myapp.com',
        tags: customTags,
      });

      expect(taggedStack).toBeDefined();
    });

    it('should handle empty tags object', () => {
      const stack = new ContentHostingStack('empty-tags-stack', {
        environmentSuffix: 'test',
        projectName: 'myapp',
        domainName: 'myapp.com',
        tags: {},
      });

      expect(stack).toBeDefined();
    });
  });

  describe('Domain Configuration', () => {
    it('should use environment subdomain for dev', (done) => {
      const devStack = new ContentHostingStack('dev-domain-test', {
        environmentSuffix: 'dev',
        projectName: 'myapp',
        domainName: 'myapp.com',
      });

      devStack.distributionUrl.apply((url: string) => {
        expect(url).toContain('dev.myapp.com');
        done();
      });
    });

    it('should use environment subdomain for staging', (done) => {
      const stagingStack = new ContentHostingStack('staging-domain-test', {
        environmentSuffix: 'staging',
        projectName: 'myapp',
        domainName: 'myapp.com',
      });

      stagingStack.distributionUrl.apply((url: string) => {
        expect(url).toContain('staging.myapp.com');
        done();
      });
    });

    it('should use root domain for prod', (done) => {
      const prodStack = new ContentHostingStack('prod-domain-test', {
        environmentSuffix: 'prod',
        projectName: 'myapp',
        domainName: 'myapp.com',
      });

      prodStack.distributionUrl.apply((url: string) => {
        expect(url).toBe('https://myapp.com');
        done();
      });
    });
  });

  describe('Component Resource Pattern', () => {
    it('should extend ComponentResource', () => {
      const stack = new ContentHostingStack('component-test', {
        environmentSuffix: 'test',
        projectName: 'myapp',
        domainName: 'myapp.com',
      });

      expect(stack).toBeInstanceOf(pulumi.ComponentResource);
    });

    it('should register outputs correctly', () => {
      const stack = new ContentHostingStack('register-test', {
        environmentSuffix: 'test',
        projectName: 'myapp',
        domainName: 'myapp.com',
      });

      expect(stack.bucketName).toBeDefined();
      expect(stack.distributionUrl).toBeDefined();
      expect(stack.distributionDomainName).toBeDefined();
    });
  });

  describe('Project Name Integration', () => {
    it('should use project name in bucket naming', (done) => {
      const stack = new ContentHostingStack('project-name-test', {
        environmentSuffix: 'test',
        projectName: 'customproject',
        domainName: 'example.com',
      });

      stack.bucketName.apply((name: string) => {
        expect(name).toContain('customproject');
        expect(name).toContain('test');
        done();
      });
    });
  });

  describe('Multiple Instance Creation', () => {
    it('should create multiple stacks with different environments', () => {
      const dev = new ContentHostingStack('multi-dev', {
        environmentSuffix: 'dev',
        projectName: 'myapp',
        domainName: 'myapp.com',
      });

      const staging = new ContentHostingStack('multi-staging', {
        environmentSuffix: 'staging',
        projectName: 'myapp',
        domainName: 'myapp.com',
      });

      const prod = new ContentHostingStack('multi-prod', {
        environmentSuffix: 'prod',
        projectName: 'myapp',
        domainName: 'myapp.com',
      });

      expect(dev).toBeDefined();
      expect(staging).toBeDefined();
      expect(prod).toBeDefined();
    });
  });

  describe('Bucket Name Pattern', () => {
    it('should follow naming pattern projectName-environment-content', (done) => {
      const stack = new ContentHostingStack('naming-test', {
        environmentSuffix: 'testenv',
        projectName: 'testproject',
        domainName: 'test.com',
      });

      stack.bucketName.apply((name: string) => {
        expect(name).toMatch(/testproject-testenv-content/);
        done();
      });
    });
  });
});
