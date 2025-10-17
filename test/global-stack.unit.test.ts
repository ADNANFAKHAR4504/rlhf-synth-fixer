import * as cdk from 'aws-cdk-lib';
import { Template, Match } from 'aws-cdk-lib/assertions';
import { GlobalStack } from '../lib/global-stack';

describe('GlobalStack Unit Tests', () => {
  let app: cdk.App;
  let stack: GlobalStack;
  let template: Template;

  beforeEach(() => {
    app = new cdk.App();
    stack = new GlobalStack(app, 'TestGlobalStack', {
      primaryRegion: 'us-east-1',
      secondaryRegion: 'us-east-2',
      primaryApiEndpoint: 'https://abc123.execute-api.us-east-1.amazonaws.com/prod/',
      secondaryApiEndpoint: 'https://xyz789.execute-api.us-east-2.amazonaws.com/prod/',
      primaryHealthCheckPath: '/health',
      primaryBucketName: 'payments-website-us-east-1-test123-123456789012',
      secondaryBucketName: 'payments-website-us-east-2-test123-123456789012',
      webAclArn: 'arn:aws:wafv2:us-east-1:123456789012:global/webacl/test-acl/12345678',
      environmentSuffix: 'test123',
      env: {
        account: '123456789012',
        region: 'us-east-1',
      },
    });
    template = Template.fromStack(stack);
  });

  describe('Stack Creation', () => {
    test('Stack is created successfully', () => {
      expect(stack).toBeDefined();
    });

    test('CloudFront distribution is exported correctly', () => {
      expect(stack.cloudfrontDistribution).toBeDefined();
    });

    test('Distribution ID is exported correctly', () => {
      expect(stack.distributionId).toBeDefined();
    });
  });

  describe('CloudFront Distribution', () => {
    test('Creates exactly one CloudFront distribution', () => {
      template.resourceCountIs('AWS::CloudFront::Distribution', 1);
    });

    test('CloudFront distribution has WAF Web ACL attached', () => {
      template.hasResourceProperties('AWS::CloudFront::Distribution', {
        DistributionConfig: {
          WebACLId: 'arn:aws:wafv2:us-east-1:123456789012:global/webacl/test-acl/12345678',
        },
      });
    });

    test('CloudFront distribution redirects HTTP to HTTPS', () => {
      template.hasResourceProperties('AWS::CloudFront::Distribution', {
        DistributionConfig: {
          DefaultCacheBehavior: {
            ViewerProtocolPolicy: 'redirect-to-https',
          },
        },
      });
    });

    test('CloudFront distribution has default root object', () => {
      template.hasResourceProperties('AWS::CloudFront::Distribution', {
        DistributionConfig: {
          DefaultRootObject: 'index.html',
        },
      });
    });

    test('CloudFront distribution has error responses for SPA', () => {
      const resources = template.toJSON().Resources;
      const distributions = Object.values(resources).filter(
        (r: any) => r.Type === 'AWS::CloudFront::Distribution'
      );
      expect(distributions.length).toBe(1);
      const dist = distributions[0] as any;
      const errorResponses = dist.Properties.DistributionConfig.CustomErrorResponses;
      expect(errorResponses).toBeDefined();
      expect(errorResponses.some((r: any) => r.ErrorCode === 404)).toBe(true);
      expect(errorResponses.some((r: any) => r.ErrorCode === 403)).toBe(true);
    });

    test('CloudFront has /api/* behavior for API Gateway', () => {
      template.hasResourceProperties('AWS::CloudFront::Distribution', {
        DistributionConfig: {
          CacheBehaviors: Match.arrayWith([
            Match.objectLike({
              PathPattern: '/api/*',
              ViewerProtocolPolicy: 'https-only',
              AllowedMethods: ['GET', 'HEAD', 'OPTIONS', 'PUT', 'PATCH', 'POST', 'DELETE'],
            }),
          ]),
        },
      });
    });

    test('CloudFront /api/* behavior has caching disabled', () => {
      template.hasResourceProperties('AWS::CloudFront::Distribution', {
        DistributionConfig: {
          CacheBehaviors: Match.arrayWith([
            Match.objectLike({
              PathPattern: '/api/*',
              CachePolicyId: Match.anyValue(),
            }),
          ]),
        },
      });
    });
  });

  describe('CloudFront Origin Access Identity', () => {
    test('Creates two OAIs (primary and secondary)', () => {
      template.resourceCountIs('AWS::CloudFront::CloudFrontOriginAccessIdentity', 2);
    });

    test('Primary OAI has correct comment', () => {
      template.hasResourceProperties('AWS::CloudFront::CloudFrontOriginAccessIdentity', {
        CloudFrontOriginAccessIdentityConfig: {
          Comment: Match.stringLikeRegexp('.*primary.*'),
        },
      });
    });

    test('Secondary OAI has correct comment', () => {
      template.hasResourceProperties('AWS::CloudFront::CloudFrontOriginAccessIdentity', {
        CloudFrontOriginAccessIdentityConfig: {
          Comment: Match.stringLikeRegexp('.*secondary.*'),
        },
      });
    });
  });

  describe('S3 Bucket Policies', () => {
    test('Creates two bucket policies (primary and secondary)', () => {
      template.resourceCountIs('AWS::S3::BucketPolicy', 2);
    });

    test('Primary bucket policy has SSL enforcement', () => {
      template.hasResourceProperties('AWS::S3::BucketPolicy', {
        Bucket: 'payments-website-us-east-1-test123-123456789012',
        PolicyDocument: {
          Statement: Match.arrayWith([
            Match.objectLike({
              Sid: 'DenyInsecureTransport',
              Effect: 'Deny',
              Action: 's3:*',
              Condition: {
                Bool: {
                  'aws:SecureTransport': 'false',
                },
              },
            }),
          ]),
        },
      });
    });

    test('Primary bucket policy allows CloudFront OAI access', () => {
      template.hasResourceProperties('AWS::S3::BucketPolicy', {
        Bucket: 'payments-website-us-east-1-test123-123456789012',
        PolicyDocument: {
          Statement: Match.arrayWith([
            Match.objectLike({
              Sid: 'AllowCloudFrontOAIAccess',
              Effect: 'Allow',
              Action: 's3:GetObject',
              Principal: {
                CanonicalUser: Match.anyValue(),
              },
            }),
          ]),
        },
      });
    });

    test('Secondary bucket policy has SSL enforcement', () => {
      template.hasResourceProperties('AWS::S3::BucketPolicy', {
        Bucket: 'payments-website-us-east-2-test123-123456789012',
        PolicyDocument: {
          Statement: Match.arrayWith([
            Match.objectLike({
              Sid: 'DenyInsecureTransport',
              Effect: 'Deny',
            }),
          ]),
        },
      });
    });
  });

  describe('CloudFront Function', () => {
    test('Creates CloudFront Function for API path rewriting', () => {
      template.resourceCountIs('AWS::CloudFront::Function', 1);
    });

    test('CloudFront Function has correct code for path rewriting', () => {
      template.hasResourceProperties('AWS::CloudFront::Function', {
        FunctionConfig: {
          Comment: 'Rewrites /api/* to /prod/* for API Gateway',
          Runtime: 'cloudfront-js-1.0',
        },
      });
    });

    test('CloudFront Function code includes path rewrite logic', () => {
      const resources = template.toJSON().Resources;
      const functions = Object.values(resources).filter(
        (r: any) => r.Type === 'AWS::CloudFront::Function'
      );
      expect(functions.length).toBe(1);
      const functionCode = (functions[0] as any).Properties.FunctionCode;
      expect(functionCode).toContain('request.uri.replace');
      expect(functionCode).toContain('/api');
      expect(functionCode).toContain('/prod');
    });
  });

  describe('Route 53 Configuration', () => {
    test('Creates Route 53 hosted zone', () => {
      template.resourceCountIs('AWS::Route53::HostedZone', 1);
      template.hasResourceProperties('AWS::Route53::HostedZone', {
        Name: 'payment-gateway-test123.com.',
      });
    });

    test('Creates primary health check', () => {
      template.hasResourceProperties('AWS::Route53::HealthCheck', {
        HealthCheckConfig: {
          Type: 'HTTPS',
          ResourcePath: '/health',
          Port: 443,
          FailureThreshold: 3,
          RequestInterval: 30,
        },
      });
    });

    test('Creates secondary health check', () => {
      const healthChecks = template.findResources('AWS::Route53::HealthCheck');
      expect(Object.keys(healthChecks).length).toBe(2);
    });

    test('Creates failover DNS records', () => {
      template.resourceCountIs('AWS::Route53::RecordSet', 2);
    });

    test('Primary failover record has correct configuration', () => {
      template.hasResourceProperties('AWS::Route53::RecordSet', {
        Type: 'CNAME',
        Failover: 'PRIMARY',
        SetIdentifier: 'primary-api',
      });
    });

    test('Secondary failover record has correct configuration', () => {
      template.hasResourceProperties('AWS::Route53::RecordSet', {
        Type: 'CNAME',
        Failover: 'SECONDARY',
        SetIdentifier: 'secondary-api',
      });
    });

    test('Failover records have 60 second TTL', () => {
      template.hasResourceProperties('AWS::Route53::RecordSet', {
        TTL: '60',
      });
    });
  });

  describe('S3 Bucket Deployments', () => {
    test('Creates custom resources for S3 deployments', () => {
      const customResources = template.findResources('Custom::CDKBucketDeployment');
      expect(Object.keys(customResources).length).toBeGreaterThanOrEqual(2);
    });
  });

  describe('Stack Outputs', () => {
    test('Exports CloudFront distribution domain', () => {
      template.hasOutput('CloudFrontDistributionDomain', {});
    });

    test('Exports CloudFront distribution ID', () => {
      template.hasOutput('CloudFrontDistributionId', {});
    });

    test('Exports application URL', () => {
      template.hasOutput('ApplicationUrl', {});
    });

    test('Exports CloudFront transfer endpoint', () => {
      template.hasOutput('CloudFrontTransferEndpoint', {});
    });

    test('Exports CloudFront health endpoint', () => {
      template.hasOutput('CloudFrontHealthEndpoint', {});
    });

    test('Exports hosted zone name', () => {
      template.hasOutput('HostedZoneName', {
        Value: 'payment-gateway-test123.com',
      });
    });

    test('Exports API failover DNS name', () => {
      template.hasOutput('ApiFailoverDnsName', {
        Value: 'api.payment-gateway-test123.com',
      });
    });

    test('Exports primary region', () => {
      template.hasOutput('PrimaryRegion', {
        Value: 'us-east-1',
      });
    });

    test('Exports secondary region', () => {
      template.hasOutput('SecondaryRegion', {
        Value: 'us-east-2',
      });
    });
  });

  describe('Environment Suffix Handling', () => {
    test('Different environment suffixes create different hosted zones', () => {
      const app2 = new cdk.App();
      const stack2 = new GlobalStack(app2, 'TestGlobalStack2', {
        primaryRegion: 'us-east-1',
        secondaryRegion: 'us-east-2',
        primaryApiEndpoint: 'https://abc123.execute-api.us-east-1.amazonaws.com/prod/',
        secondaryApiEndpoint: 'https://xyz789.execute-api.us-east-2.amazonaws.com/prod/',
        primaryHealthCheckPath: '/health',
        primaryBucketName: 'payments-website-us-east-1-prod456-123456789012',
        secondaryBucketName: 'payments-website-us-east-2-prod456-123456789012',
        webAclArn: 'arn:aws:wafv2:us-east-1:123456789012:global/webacl/test-acl/12345678',
        environmentSuffix: 'prod456',
        env: {
          account: '123456789012',
          region: 'us-east-1',
        },
      });
      const template2 = Template.fromStack(stack2);

      template.hasResourceProperties('AWS::Route53::HostedZone', {
        Name: 'payment-gateway-test123.com.',
      });

      template2.hasResourceProperties('AWS::Route53::HostedZone', {
        Name: 'payment-gateway-prod456.com.',
      });
    });
  });

  describe('Failover Configuration', () => {
    test('Failover strategy output exists', () => {
      template.hasOutput('FailoverStrategy', {
        Value: 'Route 53 DNS-based failover with health checks',
      });
    });

    test('Health check interval is documented', () => {
      template.hasOutput('HealthCheckInterval', {
        Value: '30 seconds',
      });
    });

    test('Failover threshold is documented', () => {
      template.hasOutput('FailoverThreshold', {
        Value: '3 failures',
      });
    });

    test('DNS TTL is documented', () => {
      template.hasOutput('DNSTTL', {
        Value: '60 seconds',
      });
    });
  });

  describe('Multi-Region Support', () => {
    test('Stack uses bucket names from both regions', () => {
      template.hasResourceProperties('AWS::S3::BucketPolicy', {
        Bucket: Match.stringLikeRegexp('us-east-1'),
      });

      template.hasResourceProperties('AWS::S3::BucketPolicy', {
        Bucket: Match.stringLikeRegexp('us-east-2'),
      });
    });

    test('Health checks monitor both regional API endpoints', () => {
      const healthChecks = template.findResources('AWS::Route53::HealthCheck');
      const healthCheckValues = Object.values(healthChecks);

      expect(healthCheckValues.length).toBe(2);
    });
  });

  describe('Branch Coverage - Optional Hosted Zone', () => {
    test('Uses provided hostedZoneName when specified', () => {
      const app2 = new cdk.App();
      const stack2 = new GlobalStack(app2, 'TestGlobalStack2', {
        primaryRegion: 'us-east-1',
        secondaryRegion: 'us-east-2',
        primaryApiEndpoint: 'https://abc123.execute-api.us-east-1.amazonaws.com/prod/',
        secondaryApiEndpoint: 'https://xyz789.execute-api.us-east-2.amazonaws.com/prod/',
        primaryHealthCheckPath: '/health',
        primaryBucketName: 'payments-website-us-east-1-test123-123456789012',
        secondaryBucketName: 'payments-website-us-east-2-test123-123456789012',
        webAclArn: 'arn:aws:wafv2:us-east-1:123456789012:global/webacl/test-acl/12345678',
        environmentSuffix: 'test123',
        hostedZoneName: 'custom-domain.com',
        env: {
          account: '123456789012',
          region: 'us-east-1',
        },
      });
      const template2 = Template.fromStack(stack2);

      template2.hasResourceProperties('AWS::Route53::HostedZone', {
        Name: 'custom-domain.com.',
      });
    });

    test('Creates default hostedZoneName when not specified', () => {
      template.hasResourceProperties('AWS::Route53::HostedZone', {
        Name: 'payment-gateway-test123.com.',
      });
    });

    test('NameServers output handles hostedZoneNameServers correctly', () => {
      const outputs = template.toJSON().Outputs;
      expect(outputs.NameServers).toBeDefined();
      expect(outputs.NameServers.Value).toBeDefined();
    });
  });
});
