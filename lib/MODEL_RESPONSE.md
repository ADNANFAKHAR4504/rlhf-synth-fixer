### Reasoning Trace
---

Alright, I'm being asked to create a complete CDK implementation in JavaScript for a news website's content delivery setup. Let me break down the requirements:

1. Infrastructure for a news website with global audience
2. Minimize latency, control costs, and be simple to maintain
3. Use AWS CDK with JavaScript
4. Components:
   - S3 bucket for storing articles
   - CloudFront distribution with SSL for delivery
   - Route 53 for DNS management
   - S3 bucket policy for controlled public access
   - CloudWatch for metrics
   - KMS for encryption

The output should be complete CDK JavaScript code files with no explanations or comments.

I'll create the following files:
1. `package.json` - Dependencies for the CDK project
2. `bin/news-website.js` - Entry point for the CDK app
3. `lib/news-website-stack.js` - Main stack definition
4. `cdk.json` - CDK configuration

Let me start with the package.json file:

```json
{
  "name": "news-website-infrastructure",
  "version": "0.1.0",
  "bin": {
    "news-website": "bin/news-website.js"
  },
  "scripts": {
    "build": "echo \"The build step is not required when using JavaScript!\" && exit 0",
    "cdk": "cdk",
    "test": "jest"
  },
  "devDependencies": {
    "aws-cdk": "^2.80.0",
    "jest": "^29.5.0"
  },
  "dependencies": {
    "aws-cdk-lib": "^2.80.0",
    "constructs": "^10.2.0"
  }
}
```

Now for the main entry point, bin/news-website.js:

```javascript
#!/usr/bin/env node

const cdk = require('aws-cdk-lib');
const { NewsWebsiteStack } = require('../lib/news-website-stack');

const app = new cdk.App();
new NewsWebsiteStack(app, 'NewsWebsiteStack', {
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: process.env.CDK_DEFAULT_REGION
  }
});
```

Next, let's create the main stack in lib/news-website-stack.js:

```javascript
const { Stack, Duration, RemovalPolicy } = require('aws-cdk-lib');
const s3 = require('aws-cdk-lib/aws-s3');
const cloudfront = require('aws-cdk-lib/aws-cloudfront');
const origins = require('aws-cdk-lib/aws-cloudfront-origins');
const route53 = require('aws-cdk-lib/aws-route53');
const targets = require('aws-cdk-lib/aws-route53-targets');
const acm = require('aws-cdk-lib/aws-certificatemanager');
const kms = require('aws-cdk-lib/aws-kms');
const iam = require('aws-cdk-lib/aws-iam');
const cloudwatch = require('aws-cdk-lib/aws-cloudwatch');

class NewsWebsiteStack extends Stack {
  constructor(scope, id, props) {
    super(scope, id, props);

    // Define domain name
    const domainName = 'news-website.com';
    const www = 'www.' + domainName;

    // Create a KMS Key for S3 bucket encryption
    const encryptionKey = new kms.Key(this, 'NewsEncryptionKey', {
      enableKeyRotation: true,
      description: 'KMS key for news website content encryption'
    });

    // Create an S3 bucket to store the news articles
    const websiteBucket = new s3.Bucket(this, 'NewsWebsiteBucket', {
      encryption: s3.BucketEncryption.KMS,
      encryptionKey: encryptionKey,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      removalPolicy: RemovalPolicy.RETAIN,
      versioned: true,
      metrics: [
        {
          id: 'EntireBucket',
          metricName: 'NewsWebsiteS3Metrics'
        }
      ]
    });

    // Create a CloudFront Origin Access Identity
    const originAccessIdentity = new cloudfront.OriginAccessIdentity(this, 'OAI', {
      comment: 'OAI for news website'
    });

    // Grant read access to the CloudFront distribution
    websiteBucket.grantRead(originAccessIdentity);

    // Create an ACM certificate (assuming the domain is already registered in Route 53)
    // Note: Certificate needs to be in us-east-1 for CloudFront
    const certificate = new acm.Certificate(this, 'NewsWebsiteCertificate', {
      domainName: domainName,
      subjectAlternativeNames: [www],
      validation: acm.CertificateValidation.fromDns()
    });

    // Create a CloudFront distribution
    const distribution = new cloudfront.Distribution(this, 'NewsDistribution', {
      defaultBehavior: {
        origin: new origins.S3Origin(websiteBucket, {
          originAccessIdentity
        }),
        viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
        cachePolicy: cloudfront.CachePolicy.CACHING_OPTIMIZED,
        originRequestPolicy: cloudfront.OriginRequestPolicy.CORS_S3_ORIGIN,
        allowedMethods: cloudfront.AllowedMethods.ALLOW_GET_HEAD,
        cachedMethods: cloudfront.CachedMethods.CACHE_GET_HEAD
      },
      domainNames: [domainName, www],
      certificate: certificate,
      enableLogging: true,
      logBucket: new s3.Bucket(this, 'NewsWebsiteLogBucket', {
        removalPolicy: RemovalPolicy.DESTROY,
        autoDeleteObjects: true
      }),
      logFilePrefix: 'cloudfront-logs/',
      defaultRootObject: 'index.html',
      errorResponses: [
        {
          httpStatus: 403,
          responseHttpStatus: 404,
          responsePagePath: '/404.html'
        },
        {
          httpStatus: 404,
          responsePagePath: '/404.html'
        }
      ],
      minimumProtocolVersion: cloudfront.SecurityPolicyProtocol.TLS_V1_2_2021
    });

    // Create Route 53 records
    // Assuming the hosted zone already exists
    const hostedZone = route53.HostedZone.fromLookup(this, 'NewsHostedZone', {
      domainName: domainName
    });

    new route53.ARecord(this, 'NewsApexRecord', {
      zone: hostedZone,
      target: route53.RecordTarget.fromAlias(new targets.CloudFrontTarget(distribution)),
      recordName: domainName
    });

    new route53.ARecord(this, 'NewsWwwRecord', {
      zone: hostedZone,
      target: route53.RecordTarget.fromAlias(new targets.CloudFrontTarget(distribution)),
      recordName: www
    });

    // Set up CloudWatch Dashboard for monitoring
    const dashboard = new cloudwatch.Dashboard(this, 'NewsWebsiteDashboard', {
      dashboardName: 'NewsWebsiteMetrics'
    });

    dashboard.addWidgets(
      new cloudwatch.GraphWidget({
        title: 'CloudFront Requests',
        left: [distribution.metricRequests()]
      }),
      new cloudwatch.GraphWidget({
        title: 'CloudFront Error Rate',
        left: [distribution.metricTotalErrorRate()]
      }),
      new cloudwatch.GraphWidget({
        title: 'S3 Bucket Requests',
        left: [websiteBucket.metricAllRequests()]
      })
    );
  }
}

module.exports = { NewsWebsiteStack };
```

Finally, let's create the cdk.json file:

```json
{
  "app": "node bin/news-website.js",
  "context": {
    "@aws-cdk/core:enableDynamicContextLookup": true,
    "@aws-cdk/aws-lambda:recognizeLayerVersion": true,
    "@aws-cdk/aws-lambda:recognizeVersionProps": true,
    "@aws-cdk/aws-cloudfront:defaultSecurityPolicyTLSv1.2_2021": true
  }
}
```

Let me review these files to make sure they meet all the requirements:

1. S3 bucket for articles 
   - KMS encryption 
   - Metrics enabled 
   - Controlled public access via CloudFront OAI 

2. CloudFront distribution 
   - SSL configured 
   - Optimized caching policy 
   - Logging enabled 

3. Route 53 for DNS 
   - A records for apex and www 

4. CloudWatch for metrics 
   - Dashboard with relevant metrics 

5. Security considerations 
   - S3 block public access 
   - HTTPS enforcement 
   - KMS encryption 
   - Modern TLS protocol 

This solution provides a complete CDK JavaScript implementation for the news website's content delivery infrastructure. It focuses on:
- Low latency through CloudFront's global edge network
- Cost control through optimized caching and S3 storage
- Simple maintenance with complete infrastructure as code
- Security with encryption and access controls

I think the implementation covers all the requirements, but let me check if I'm missing anything:

The requirements mentioned an S3 bucket policy for controlled public access, which is implemented through the CloudFront Origin Access Identity pattern. This is the recommended approach for securing S3 content while allowing CloudFront to serve it.

I believe these files provide a complete solution that meets all the requirements.

I will now provide the complete files as requested, without comments or explanations.
### Answer 
---

# package.json
```json
{
  "name": "news-website-infrastructure",
  "version": "0.1.0",
  "bin": {
    "news-website": "bin/news-website.js"
  },
  "scripts": {
    "build": "echo \"The build step is not required when using JavaScript!\" && exit 0",
    "cdk": "cdk",
    "test": "jest"
  },
  "devDependencies": {
    "aws-cdk": "^2.80.0",
    "jest": "^29.5.0"
  },
  "dependencies": {
    "aws-cdk-lib": "^2.80.0",
    "constructs": "^10.2.0"
  }
}
```

# bin/news-website.js
```javascript
#!/usr/bin/env node

const cdk = require('aws-cdk-lib');
const { NewsWebsiteStack } = require('../lib/news-website-stack');

const app = new cdk.App();
new NewsWebsiteStack(app, 'NewsWebsiteStack', {
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: process.env.CDK_DEFAULT_REGION
  }
});
```

# lib/news-website-stack.js
```javascript
const { Stack, Duration, RemovalPolicy } = require('aws-cdk-lib');
const s3 = require('aws-cdk-lib/aws-s3');
const cloudfront = require('aws-cdk-lib/aws-cloudfront');
const origins = require('aws-cdk-lib/aws-cloudfront-origins');
const route53 = require('aws-cdk-lib/aws-route53');
const targets = require('aws-cdk-lib/aws-route53-targets');
const acm = require('aws-cdk-lib/aws-certificatemanager');
const kms = require('aws-cdk-lib/aws-kms');
const iam = require('aws-cdk-lib/aws-iam');
const cloudwatch = require('aws-cdk-lib/aws-cloudwatch');

class NewsWebsiteStack extends Stack {
  constructor(scope, id, props) {
    super(scope, id, props);

    const domainName = 'news-website.com';
    const www = 'www.' + domainName;

    const encryptionKey = new kms.Key(this, 'NewsEncryptionKey', {
      enableKeyRotation: true,
      description: 'KMS key for news website content encryption'
    });

    const websiteBucket = new s3.Bucket(this, 'NewsWebsiteBucket', {
      encryption: s3.BucketEncryption.KMS,
      encryptionKey: encryptionKey,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      removalPolicy: RemovalPolicy.RETAIN,
      versioned: true,
      metrics: [
        {
          id: 'EntireBucket',
          metricName: 'NewsWebsiteS3Metrics'
        }
      ]
    });

    const originAccessIdentity = new cloudfront.OriginAccessIdentity(this, 'OAI', {
      comment: 'OAI for news website'
    });

    websiteBucket.grantRead(originAccessIdentity);

    const certificate = new acm.Certificate(this, 'NewsWebsiteCertificate', {
      domainName: domainName,
      subjectAlternativeNames: [www],
      validation: acm.CertificateValidation.fromDns()
    });

    const distribution = new cloudfront.Distribution(this, 'NewsDistribution', {
      defaultBehavior: {
        origin: new origins.S3Origin(websiteBucket, {
          originAccessIdentity
        }),
        viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
        cachePolicy: cloudfront.CachePolicy.CACHING_OPTIMIZED,
        originRequestPolicy: cloudfront.OriginRequestPolicy.CORS_S3_ORIGIN,
        allowedMethods: cloudfront.AllowedMethods.ALLOW_GET_HEAD,
        cachedMethods: cloudfront.CachedMethods.CACHE_GET_HEAD
      },
      domainNames: [domainName, www],
      certificate: certificate,
      enableLogging: true,
      logBucket: new s3.Bucket(this, 'NewsWebsiteLogBucket', {
        removalPolicy: RemovalPolicy.DESTROY,
        autoDeleteObjects: true
      }),
      logFilePrefix: 'cloudfront-logs/',
      defaultRootObject: 'index.html',
      errorResponses: [
        {
          httpStatus: 403,
          responseHttpStatus: 404,
          responsePagePath: '/404.html'
        },
        {
          httpStatus: 404,
          responsePagePath: '/404.html'
        }
      ],
      minimumProtocolVersion: cloudfront.SecurityPolicyProtocol.TLS_V1_2_2021
    });

    const hostedZone = route53.HostedZone.fromLookup(this, 'NewsHostedZone', {
      domainName: domainName
    });

    new route53.ARecord(this, 'NewsApexRecord', {
      zone: hostedZone,
      target: route53.RecordTarget.fromAlias(new targets.CloudFrontTarget(distribution)),
      recordName: domainName
    });

    new route53.ARecord(this, 'NewsWwwRecord', {
      zone: hostedZone,
      target: route53.RecordTarget.fromAlias(new targets.CloudFrontTarget(distribution)),
      recordName: www
    });

    const dashboard = new cloudwatch.Dashboard(this, 'NewsWebsiteDashboard', {
      dashboardName: 'NewsWebsiteMetrics'
    });

    dashboard.addWidgets(
      new cloudwatch.GraphWidget({
        title: 'CloudFront Requests',
        left: [distribution.metricRequests()]
      }),
      new cloudwatch.GraphWidget({
        title: 'CloudFront Error Rate',
        left: [distribution.metricTotalErrorRate()]
      }),
      new cloudwatch.GraphWidget({
        title: 'S3 Bucket Requests',
        left: [websiteBucket.metricAllRequests()]
      })
    );
  }
}

module.exports = { NewsWebsiteStack };
```

# cdk.json
```json
{
  "app": "node bin/news-website.js",
  "context": {
    "@aws-cdk/core:enableDynamicContextLookup": true,
    "@aws-cdk/aws-lambda:recognizeLayerVersion": true,
    "@aws-cdk/aws-lambda:recognizeVersionProps": true,
    "@aws-cdk/aws-cloudfront:defaultSecurityPolicyTLSv1.2_2021": true
  }
}
```