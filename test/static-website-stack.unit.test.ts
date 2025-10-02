import * as pulumi from '@pulumi/pulumi';
import { StaticWebsiteStack, StaticWebsiteStackArgs } from '../lib/static-website-stack';

// Track resources for testing
let resources: any[] = [];

// Mock Pulumi runtime
pulumi.runtime.setMocks({
  newResource: function (args: pulumi.runtime.MockResourceArgs) {
    resources.push(args);
    const mockOutputs: any = {};

    // Mock ComponentResource (StaticWebsiteStack)
    if (args.type === 'custom:app:StaticWebsiteStack') {
      mockOutputs.websiteUrl = 'https://d111111abcdef8.cloudfront.net';
      mockOutputs.cloudfrontDomain = 'd111111abcdef8.cloudfront.net';
      mockOutputs.s3BucketName = `static-website-${args.name}-content`;
    }

    // Mock S3 bucket outputs
    if (args.type === 'aws:s3/bucket:Bucket') {
      mockOutputs.arn = `arn:aws:s3:::${args.name}`;
      mockOutputs.id = args.name;
      mockOutputs.bucket = args.name;
      mockOutputs.bucketRegionalDomainName = `${args.name}.s3.amazonaws.com`;
      mockOutputs.bucketDomainName = `${args.name}.s3.amazonaws.com`;
    }

    // Mock CloudFront outputs
    if (args.type === 'aws:cloudfront/distribution:Distribution') {
      mockOutputs.id = `${args.name}-distribution-id`;
      mockOutputs.domainName = `d111111abcdef8.cloudfront.net`;
      mockOutputs.hostedZoneId = 'Z2FDTNDATAQYW2';
      mockOutputs.arn = `arn:aws:cloudfront::123456789012:distribution/${args.name}`;
    }

    // Mock CloudFront OAI outputs
    if (args.type === 'aws:cloudfront/originAccessIdentity:OriginAccessIdentity') {
      mockOutputs.iamArn = `arn:aws:iam::cloudfront:user/CloudFront Origin Access Identity ${args.name}`;
      mockOutputs.cloudfrontAccessIdentityPath = `origin-access-identity/cloudfront/${args.name}`;
    }

    // Mock ACM certificate outputs
    if (args.type === 'aws:acm/certificate:Certificate') {
      mockOutputs.arn = `arn:aws:acm:us-east-1:123456789012:certificate/${args.name}`;
      mockOutputs.domainName = args.inputs.domainName;
    }

    // Mock Route53 zone outputs
    if (args.type === 'aws:route53/zone:Zone') {
      mockOutputs.zoneId = `Z${args.name.toUpperCase()}`;
      mockOutputs.name = args.inputs.name;
    }

    // Mock CloudWatch alarm outputs
    if (args.type === 'aws:cloudwatch/metricAlarm:MetricAlarm') {
      mockOutputs.id = `${args.name}-alarm`;
      mockOutputs.arn = `arn:aws:cloudwatch:us-west-2:123456789012:alarm:${args.name}`;
    }

    return {
      id: `${args.name}_id`,
      state: { ...args.inputs, ...mockOutputs },
    };
  },
  call: function (args: pulumi.runtime.MockCallArgs) {
    return args.inputs;
  },
});

describe('StaticWebsiteStack', () => {
  let stack: StaticWebsiteStack;

  describe('Component Creation', () => {
    beforeAll(() => {
      const args: StaticWebsiteStackArgs = {
        environmentSuffix: 'test',
        domainName: 'example-test.com',
        tags: {
          Environment: 'test',
          Project: 'website',
        },
      };
      stack = new StaticWebsiteStack('test-website', args);
    });

    it('should instantiate successfully', () => {
      expect(stack).toBeDefined();
    });

    it('should have websiteUrl output', () => {
      expect(stack.websiteUrl).toBeDefined();
    });

    it('should have cloudfrontDomain output', () => {
      expect(stack.cloudfrontDomain).toBeDefined();
    });

    it('should have s3BucketName output', () => {
      expect(stack.s3BucketName).toBeDefined();
    });
  });

  describe('Resource Configuration', () => {
    let resources: any[] = [];

    beforeAll(() => {
      resources = [];

      // Capture resource creation calls
      pulumi.runtime.setMocks({
        newResource: function (args: pulumi.runtime.MockResourceArgs) {
          resources.push(args);
          const mockOutputs: any = {};

          // Mock ComponentResource (StaticWebsiteStack)
          if (args.type === 'custom:app:StaticWebsiteStack') {
            mockOutputs.websiteUrl = 'https://d111111abcdef8.cloudfront.net';
            mockOutputs.cloudfrontDomain = 'd111111abcdef8.cloudfront.net';
            mockOutputs.s3BucketName = `static-website-${args.name}-content`;
          }

          return {
            id: `${args.name}_id`,
            state: { ...args.inputs, ...mockOutputs },
          };
        },
        call: function (args: pulumi.runtime.MockCallArgs) {
          return args.inputs;
        },
      });

      const args: StaticWebsiteStackArgs = {
        environmentSuffix: 'prod',
        domainName: 'example-prod.com',
        tags: {
          Environment: 'production',
        },
      };
      stack = new StaticWebsiteStack('prod-website', args);
    });

    it('should create S3 bucket for content', () => {
      const contentBucket = resources.find(r =>
        r.type === 'aws:s3/bucket:Bucket' && r.name.includes('content')
      );
      expect(contentBucket).toBeDefined();
      expect(contentBucket.inputs.website).toBeDefined();
      expect(contentBucket.inputs.website.indexDocument).toBe('index.html');
      expect(contentBucket.inputs.website.errorDocument).toBe('error.html');
    });

    it('should enable encryption on content bucket', () => {
      const contentBucket = resources.find(r =>
        r.type === 'aws:s3/bucket:Bucket' && r.name.includes('content')
      );
      expect(contentBucket.inputs.serverSideEncryptionConfiguration).toBeDefined();
      expect(contentBucket.inputs.serverSideEncryptionConfiguration.rule.applyServerSideEncryptionByDefault.sseAlgorithm).toBe('AES256');
    });

    it('should configure lifecycle rules on content bucket', () => {
      const contentBucket = resources.find(r =>
        r.type === 'aws:s3/bucket:Bucket' && r.name.includes('content')
      );
      expect(contentBucket.inputs.lifecycleRules).toBeDefined();
      expect(contentBucket.inputs.lifecycleRules).toHaveLength(1);
      expect(contentBucket.inputs.lifecycleRules[0].abortIncompleteMultipartUploadDays).toBe(7);
    });

    it('should create S3 bucket for logs', () => {
      const logsBucket = resources.find(r =>
        r.type === 'aws:s3/bucket:Bucket' && r.name.includes('logs')
      );
      expect(logsBucket).toBeDefined();
      expect(logsBucket.inputs.acl).toBe('log-delivery-write');
    });

    it('should configure lifecycle rules on logs bucket', () => {
      const logsBucket = resources.find(r =>
        r.type === 'aws:s3/bucket:Bucket' && r.name.includes('logs')
      );
      expect(logsBucket.inputs.lifecycleRules).toBeDefined();
      expect(logsBucket.inputs.lifecycleRules).toHaveLength(2);

      const transitionRule = logsBucket.inputs.lifecycleRules.find((r: any) => r.transitions);
      expect(transitionRule.transitions[0].days).toBe(30);
      expect(transitionRule.transitions[0].storageClass).toBe('GLACIER');

      const expirationRule = logsBucket.inputs.lifecycleRules.find((r: any) => r.expiration);
      expect(expirationRule.expiration.days).toBe(90);
    });

    it('should create bucket public access block', () => {
      const publicAccessBlock = resources.find(r =>
        r.type === 'aws:s3/bucketPublicAccessBlock:BucketPublicAccessBlock'
      );
      expect(publicAccessBlock).toBeDefined();
      expect(publicAccessBlock.inputs.blockPublicAcls).toBe(true);
      expect(publicAccessBlock.inputs.blockPublicPolicy).toBe(false);
      expect(publicAccessBlock.inputs.ignorePublicAcls).toBe(true);
      expect(publicAccessBlock.inputs.restrictPublicBuckets).toBe(false);
    });

    it('should create CloudFront origin access identity', () => {
      const oai = resources.find(r =>
        r.type === 'aws:cloudfront/originAccessIdentity:OriginAccessIdentity'
      );
      expect(oai).toBeDefined();
      expect(oai.inputs.comment).toContain('prod-website');
    });

    it('should create bucket policy for OAI', () => {
      const bucketPolicy = resources.find(r =>
        r.type === 'aws:s3/bucketPolicy:BucketPolicy'
      );
      expect(bucketPolicy).toBeDefined();
    });

    it('should create ACM certificate', () => {
      const certificate = resources.find(r =>
        r.type === 'aws:acm/certificate:Certificate'
      );
      expect(certificate).toBeDefined();
      expect(certificate.inputs.domainName).toBe('example-prod.com');
      expect(certificate.inputs.validationMethod).toBe('DNS');
    });

    it('should create CloudFront distribution', () => {
      const distribution = resources.find(r =>
        r.type === 'aws:cloudfront/distribution:Distribution'
      );
      expect(distribution).toBeDefined();
      expect(distribution.inputs.enabled).toBe(true);
      expect(distribution.inputs.isIpv6Enabled).toBe(true);
      expect(distribution.inputs.defaultRootObject).toBe('index.html');
    });

    it('should configure CloudFront cache behavior', () => {
      const distribution = resources.find(r =>
        r.type === 'aws:cloudfront/distribution:Distribution'
      );
      expect(distribution.inputs.defaultCacheBehavior).toBeDefined();
      expect(distribution.inputs.defaultCacheBehavior.viewerProtocolPolicy).toBe('redirect-to-https');
      expect(distribution.inputs.defaultCacheBehavior.compress).toBe(true);
      expect(distribution.inputs.defaultCacheBehavior.defaultTtl).toBe(3600);
    });

    it('should configure CloudFront custom error responses', () => {
      const distribution = resources.find(r =>
        r.type === 'aws:cloudfront/distribution:Distribution'
      );
      expect(distribution.inputs.customErrorResponses).toBeDefined();
      expect(distribution.inputs.customErrorResponses).toHaveLength(2);

      const error403 = distribution.inputs.customErrorResponses.find((e: any) => e.errorCode === 403);
      expect(error403.responsePagePath).toBe('/error.html');

      const error404 = distribution.inputs.customErrorResponses.find((e: any) => e.errorCode === 404);
      expect(error404.responsePagePath).toBe('/error.html');
    });

    it('should configure CloudFront SSL/TLS', () => {
      const distribution = resources.find(r =>
        r.type === 'aws:cloudfront/distribution:Distribution'
      );
      expect(distribution.inputs.viewerCertificate).toBeDefined();
      expect(distribution.inputs.viewerCertificate.sslSupportMethod).toBe('sni-only');
      expect(distribution.inputs.viewerCertificate.minimumProtocolVersion).toBe('TLSv1.2_2021');
    });

    it('should create Route53 hosted zone', () => {
      const hostedZone = resources.find(r =>
        r.type === 'aws:route53/zone:Zone'
      );
      expect(hostedZone).toBeDefined();
      expect(hostedZone.inputs.name).toBe('example-prod.com');
    });

    it('should create Route53 A record', () => {
      const aRecord = resources.find(r =>
        r.type === 'aws:route53/record:Record' && r.inputs.type === 'A'
      );
      expect(aRecord).toBeDefined();
      expect(aRecord.inputs.name).toBe('example-prod.com');
      expect(aRecord.inputs.aliases).toBeDefined();
    });

    it('should create Route53 AAAA record for IPv6', () => {
      const aaaaRecord = resources.find(r =>
        r.type === 'aws:route53/record:Record' && r.inputs.type === 'AAAA'
      );
      expect(aaaaRecord).toBeDefined();
      expect(aaaaRecord.inputs.name).toBe('example-prod.com');
      expect(aaaaRecord.inputs.aliases).toBeDefined();
    });

    it('should create CloudWatch alarm for 4xx errors', () => {
      const alarm4xx = resources.find(r =>
        r.type === 'aws:cloudwatch/metricAlarm:MetricAlarm' && r.name.includes('4xx')
      );
      expect(alarm4xx).toBeDefined();
      expect(alarm4xx.inputs.metricName).toBe('4xxErrorRate');
      expect(alarm4xx.inputs.threshold).toBe(5);
    });

    it('should create CloudWatch alarm for 5xx errors', () => {
      const alarm5xx = resources.find(r =>
        r.type === 'aws:cloudwatch/metricAlarm:MetricAlarm' && r.name.includes('5xx')
      );
      expect(alarm5xx).toBeDefined();
      expect(alarm5xx.inputs.metricName).toBe('5xxErrorRate');
      expect(alarm5xx.inputs.threshold).toBe(1);
    });

    it('should create index.html S3 object', () => {
      const indexHtml = resources.find(r =>
        r.type === 'aws:s3/bucketObject:BucketObject' && r.name === 'index.html'
      );
      expect(indexHtml).toBeDefined();
      expect(indexHtml.inputs.key).toBe('index.html');
      expect(indexHtml.inputs.contentType).toBe('text/html');
      expect(indexHtml.inputs.content).toContain('Welcome to Our Small Business Website');
    });

    it('should create error.html S3 object', () => {
      const errorHtml = resources.find(r =>
        r.type === 'aws:s3/bucketObject:BucketObject' && r.name === 'error.html'
      );
      expect(errorHtml).toBeDefined();
      expect(errorHtml.inputs.key).toBe('error.html');
      expect(errorHtml.inputs.contentType).toBe('text/html');
      expect(errorHtml.inputs.content).toContain('404 - Page Not Found');
    });

    it('should apply tags to resources', () => {
      const taggedResources = resources.filter(r => r.inputs.tags);
      expect(taggedResources.length).toBeGreaterThan(0);

      taggedResources.forEach(resource => {
        expect(resource.inputs.tags.Environment).toBe('production');
      });
    });
  });

  describe('Environment Suffix Handling', () => {
    it('should use environment suffix in resource names', () => {
      const args: StaticWebsiteStackArgs = {
        environmentSuffix: 'staging',
        domainName: 'example-staging.com',
      };

      const resources: any[] = [];
      pulumi.runtime.setMocks({
        newResource: function (args: pulumi.runtime.MockResourceArgs) {
          resources.push(args);
          const mockOutputs: any = {};

          // Mock ComponentResource (StaticWebsiteStack)
          if (args.type === 'custom:app:StaticWebsiteStack') {
            mockOutputs.websiteUrl = 'https://d111111abcdef8.cloudfront.net';
            mockOutputs.cloudfrontDomain = 'd111111abcdef8.cloudfront.net';
            mockOutputs.s3BucketName = `static-website-${args.name}-content`;
          }

          return {
            id: `${args.name}_id`,
            state: { ...args.inputs, ...mockOutputs },
          };
        },
        call: function (args: pulumi.runtime.MockCallArgs) {
          return args.inputs;
        },
      });

      new StaticWebsiteStack('staging-website', args);

      const contentBucket = resources.find(r =>
        r.type === 'aws:s3/bucket:Bucket' && r.name.includes('content')
      );
      expect(contentBucket.name).toContain('staging');
    });
  });
});