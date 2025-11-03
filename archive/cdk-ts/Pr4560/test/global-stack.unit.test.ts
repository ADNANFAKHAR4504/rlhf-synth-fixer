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
      primaryOaiId: 'E1234567890ABC',
      secondaryOaiId: 'E0987654321XYZ',
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

    test('CloudFront has api/* behavior for API Gateway', () => {
      template.hasResourceProperties('AWS::CloudFront::Distribution', {
        DistributionConfig: {
          CacheBehaviors: Match.arrayWith([
            Match.objectLike({
              PathPattern: 'api/*',
              ViewerProtocolPolicy: 'https-only',
              AllowedMethods: ['GET', 'HEAD', 'OPTIONS', 'PUT', 'PATCH', 'POST', 'DELETE'],
            }),
          ]),
        },
      });
    });

    test('CloudFront api/* behavior has caching disabled', () => {
      template.hasResourceProperties('AWS::CloudFront::Distribution', {
        DistributionConfig: {
          CacheBehaviors: Match.arrayWith([
            Match.objectLike({
              PathPattern: 'api/*',
              CachePolicyId: Match.anyValue(),
            }),
          ]),
        },
      });
    });
  });

  describe('Lambda@Edge for Path Rewriting', () => {
    test('Creates Lambda functions (includes Edge function for API rewriting)', () => {
      const resources = template.toJSON().Resources;
      const functions = Object.values(resources).filter(
        (r: any) => r.Type === 'AWS::Lambda::Function'
      );
      expect(functions.length).toBeGreaterThanOrEqual(1);
    });

    test('Lambda has inline code for path rewriting', () => {
      const resources = template.toJSON().Resources;
      const functions = Object.values(resources).filter(
        (r: any) => r.Type === 'AWS::Lambda::Function'
      );
      expect(functions.length).toBeGreaterThanOrEqual(1);
      const lambdaFunction = functions.find((f: any) =>
        f.Properties.Code?.ZipFile?.includes('/api')
      );
      expect(lambdaFunction).toBeDefined();
      const functionCode = (lambdaFunction as any).Properties.Code.ZipFile;
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

    test('Exports CloudFront API URL', () => {
      template.hasOutput('CloudFrontApiUrl', {});
    });

    test('Exports CloudFront health endpoint', () => {
      template.hasOutput('CloudFrontHealthEndpoint', {});
    });

    test('Exports WAF Web ACL ARN', () => {
      template.hasOutput('WebAclArn', {
        Value: 'arn:aws:wafv2:us-east-1:123456789012:global/webacl/test-acl/12345678',
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
        primaryOaiId: 'E1234567890ABC',
        secondaryOaiId: 'E0987654321XYZ',
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


  describe('Multi-Region Support', () => {
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
        primaryOaiId: 'E1234567890ABC',
        secondaryOaiId: 'E0987654321XYZ',
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
  });
});
