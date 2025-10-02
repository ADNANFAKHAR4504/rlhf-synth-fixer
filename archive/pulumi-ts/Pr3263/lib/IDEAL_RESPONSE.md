# Infrastructure Code for Media Startup Static Website

## index.ts
```typescript
/* eslint-disable @typescript-eslint/no-unused-vars */
import * as pulumi from '@pulumi/pulumi';
import * as aws from '@pulumi/aws';
import * as random from '@pulumi/random';

const config = new pulumi.Config();
const environment = config.get('environment') || 'dev';
const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || environment;
const domainName = config.get('domainName') || `media-${environmentSuffix}.example.com`;

// Generate random suffix for unique bucket names
const randomSuffix = new random.RandomString('randomSuffix', {
  length: 8,
  special: false,
  upper: false,
});

// Tags for all resources
const tags = {
  Environment: environment,
  EnvironmentSuffix: environmentSuffix,
  Project: 'MediaStartup',
  ManagedBy: 'Pulumi',
};

// S3 bucket for static website content
const websiteBucket = new aws.s3.BucketV2('websiteBucket', {
  bucket: pulumi.interpolate`tap-${environmentSuffix}-website-${randomSuffix.result}`,
  tags: tags,
});

// S3 bucket website configuration
const websiteBucketWebsiteConfig = new aws.s3.BucketWebsiteConfigurationV2('websiteBucketWebsiteConfig', {
  bucket: websiteBucket.id,
  indexDocument: {
    suffix: 'index.html',
  },
  errorDocument: {
    key: 'error.html',
  },
});

// S3 bucket for CloudFront logs
const logsBucket = new aws.s3.BucketV2('logsBucket', {
  bucket: pulumi.interpolate`tap-${environmentSuffix}-logs-${randomSuffix.result}`,
  tags: tags,
});

// S3 bucket lifecycle configuration
const logsBucketLifecycle = new aws.s3.BucketLifecycleConfigurationV2('logsBucketLifecycle', {
  bucket: logsBucket.id,
  rules: [{
    id: 'archive-old-logs',
    status: 'Enabled',
    transitions: [{
      days: 60,
      storageClass: 'GLACIER',
    }],
    expiration: {
      days: 365,
    },
  }],
});

// S3 bucket public access block for website bucket
const websiteBucketPAB = new aws.s3.BucketPublicAccessBlock('websiteBucketPAB', {
  bucket: websiteBucket.id,
  blockPublicAcls: false,
  blockPublicPolicy: false,
  ignorePublicAcls: false,
  restrictPublicBuckets: false,
});

// S3 bucket public access block for logs bucket
const logsBucketPAB = new aws.s3.BucketPublicAccessBlock('logsBucketPAB', {
  bucket: logsBucket.id,
  blockPublicAcls: true,
  blockPublicPolicy: true,
  ignorePublicAcls: true,
  restrictPublicBuckets: true,
});

// S3 bucket ownership controls for CloudFront logs
const logsBucketOwnershipControls = new aws.s3.BucketOwnershipControls('logsBucketOwnershipControls', {
  bucket: logsBucket.id,
  rule: {
    objectOwnership: 'BucketOwnerPreferred',
  },
});

// CloudFront Origin Access Control
const oac = new aws.cloudfront.OriginAccessControl('oac', {
  name: pulumi.interpolate`tap-${environmentSuffix}-oac`,
  originAccessControlOriginType: 's3',
  signingBehavior: 'always',
  signingProtocol: 'sigv4',
  description: 'OAC for media startup website',
});

// CloudFront Response Headers Policy
const responseHeadersPolicy = new aws.cloudfront.ResponseHeadersPolicy('responseHeadersPolicy', {
  name: pulumi.interpolate`tap-${environmentSuffix}-security-headers`,
  customHeadersConfig: {
    items: [{
      header: 'X-Custom-Header',
      value: 'MediaStartup',
      override: false,
    }],
  },
  securityHeadersConfig: {
    contentTypeOptions: {
      override: false,
    },
    frameOptions: {
      frameOption: 'DENY',
      override: false,
    },
    referrerPolicy: {
      referrerPolicy: 'strict-origin-when-cross-origin',
      override: false,
    },
    contentSecurityPolicy: {
      contentSecurityPolicy: "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline';",
      override: false,
    },
    strictTransportSecurity: {
      accessControlMaxAgeSec: 63072000,
      includeSubdomains: true,
      override: false,
    },
    xssProtection: {
      modeBlock: true,
      protection: true,
      override: false,
    },
  },
});

// Create Kinesis stream for real-time logs
const kinesisStream = new aws.kinesis.Stream('logStream', {
  name: pulumi.interpolate`tap-${environmentSuffix}-realtime-logs`,
  shardCount: 1,
  retentionPeriod: 24,
  tags: tags,
});

// Create IAM role for real-time logs
const realtimeLogRole = new aws.iam.Role('realtimeLogRole', {
  name: pulumi.interpolate`tap-${environmentSuffix}-realtime-log-role`,
  assumeRolePolicy: JSON.stringify({
    Version: '2012-10-17',
    Statement: [{
      Action: 'sts:AssumeRole',
      Effect: 'Allow',
      Principal: {
        Service: 'cloudfront.amazonaws.com',
      },
    }],
  }),
  tags: tags,
});

// Create IAM role policy for Kinesis access
const realtimeLogRolePolicy = new aws.iam.RolePolicy('realtimeLogRolePolicy', {
  role: realtimeLogRole.id,
  policy: pulumi.interpolate`{
    "Version": "2012-10-17",
    "Statement": [{
      "Effect": "Allow",
      "Action": [
        "kinesis:PutRecord",
        "kinesis:PutRecords"
      ],
      "Resource": "${kinesisStream.arn}"
    }]
  }`,
});

// Real-time logs configuration
const realtimeLogConfig = new aws.cloudfront.RealtimeLogConfig('realtimeLogConfig', {
  name: pulumi.interpolate`tap-${environmentSuffix}-realtime-logs`,
  samplingRate: 1,
  fields: [
    'timestamp',
    'c-ip',
    'time-taken',
    'sc-status',
    'cs-method',
    'cs-uri-stem',
    'cs-bytes',
    'sc-bytes',
  ],
  endpoint: {
    streamType: 'Kinesis',
    kinesisStreamConfig: {
      streamArn: kinesisStream.arn,
      roleArn: realtimeLogRole.arn,
    },
  },
}, { dependsOn: [realtimeLogRolePolicy] });

// CloudFront distribution
const distribution = new aws.cloudfront.Distribution('distribution', {
  enabled: true,
  isIpv6Enabled: true,
  comment: 'Media startup static website distribution',
  defaultRootObject: 'index.html',
  priceClass: 'PriceClass_100',

  origins: [{
    domainName: websiteBucket.bucketRegionalDomainName,
    originId: 'S3-Website',
    originAccessControlId: oac.id,
    connectionAttempts: 3,
    connectionTimeout: 10,
  }],

  defaultCacheBehavior: {
    targetOriginId: 'S3-Website',
    viewerProtocolPolicy: 'redirect-to-https',
    allowedMethods: ['GET', 'HEAD', 'OPTIONS'],
    cachedMethods: ['GET', 'HEAD', 'OPTIONS'],
    compress: true,
    minTtl: 0,
    defaultTtl: 86400,
    maxTtl: 31536000,
    forwardedValues: {
      queryString: false,
      cookies: {
        forward: 'none',
      },
    },
    realtimeLogConfigArn: realtimeLogConfig.arn,
    responseHeadersPolicyId: responseHeadersPolicy.id,
  },

  orderedCacheBehaviors: [{
    pathPattern: '*.jpg',
    targetOriginId: 'S3-Website',
    viewerProtocolPolicy: 'redirect-to-https',
    allowedMethods: ['GET', 'HEAD'],
    cachedMethods: ['GET', 'HEAD'],
    compress: true,
    minTtl: 0,
    defaultTtl: 604800, // 7 days for images
    maxTtl: 31536000,
    forwardedValues: {
      queryString: false,
      cookies: {
        forward: 'none',
      },
    },
  }, {
    pathPattern: '*.css',
    targetOriginId: 'S3-Website',
    viewerProtocolPolicy: 'redirect-to-https',
    allowedMethods: ['GET', 'HEAD'],
    cachedMethods: ['GET', 'HEAD'],
    compress: true,
    minTtl: 0,
    defaultTtl: 86400, // 1 day for CSS
    maxTtl: 31536000,
    forwardedValues: {
      queryString: false,
      cookies: {
        forward: 'none',
      },
    },
  }, {
    pathPattern: '*.js',
    targetOriginId: 'S3-Website',
    viewerProtocolPolicy: 'redirect-to-https',
    allowedMethods: ['GET', 'HEAD'],
    cachedMethods: ['GET', 'HEAD'],
    compress: true,
    minTtl: 0,
    defaultTtl: 86400, // 1 day for JS
    maxTtl: 31536000,
    forwardedValues: {
      queryString: false,
      cookies: {
        forward: 'none',
      },
    },
  }],

  restrictions: {
    geoRestriction: {
      restrictionType: 'none',
    },
  },

  viewerCertificate: {
    cloudfrontDefaultCertificate: true,
    minimumProtocolVersion: 'TLSv1.2_2021',
  },

  tags: tags,
}, { dependsOn: [websiteBucketWebsiteConfig] });

// S3 bucket policy for CloudFront OAC access
const bucketPolicy = new aws.s3.BucketPolicy('bucketPolicy', {
  bucket: websiteBucket.id,
  policy: pulumi.all([websiteBucket.arn, distribution.arn]).apply(([bucketArn, distArn]) =>
    JSON.stringify({
      Version: '2012-10-17',
      Statement: [{
        Sid: 'AllowCloudFrontServicePrincipal',
        Effect: 'Allow',
        Principal: {
          Service: 'cloudfront.amazonaws.com',
        },
        Action: 's3:GetObject',
        Resource: `${bucketArn}/*`,
        Condition: {
          StringEquals: {
            'AWS:SourceArn': distArn,
          },
        },
      }],
    })
  ),
}, { dependsOn: [websiteBucketPAB] });

// CloudWatch metric alarm for 4xx errors
const error4xxAlarm = new aws.cloudwatch.MetricAlarm('error4xxAlarm', {
  alarmName: pulumi.interpolate`tap-${environmentSuffix}-4xx-errors`,
  alarmDescription: 'Alert when 4xx errors exceed threshold',
  comparisonOperator: 'GreaterThanThreshold',
  evaluationPeriods: 2,
  metricName: '4xxErrorRate',
  namespace: 'AWS/CloudFront',
  period: 300,
  statistic: 'Average',
  threshold: 5,
  treatMissingData: 'notBreaching',
  dimensions: {
    DistributionId: distribution.id,
  },
  tags: tags,
});

// CloudWatch metric alarm for 5xx errors
const error5xxAlarm = new aws.cloudwatch.MetricAlarm('error5xxAlarm', {
  alarmName: pulumi.interpolate`tap-${environmentSuffix}-5xx-errors`,
  alarmDescription: 'Alert when 5xx errors exceed threshold',
  comparisonOperator: 'GreaterThanThreshold',
  evaluationPeriods: 2,
  metricName: '5xxErrorRate',
  namespace: 'AWS/CloudFront',
  period: 300,
  statistic: 'Average',
  threshold: 1,
  treatMissingData: 'notBreaching',
  dimensions: {
    DistributionId: distribution.id,
  },
  tags: tags,
});

// CloudWatch metric alarm for origin latency
const originLatencyAlarm = new aws.cloudwatch.MetricAlarm('originLatencyAlarm', {
  alarmName: pulumi.interpolate`tap-${environmentSuffix}-origin-latency`,
  alarmDescription: 'Alert when origin latency is high',
  comparisonOperator: 'GreaterThanThreshold',
  evaluationPeriods: 2,
  metricName: 'OriginLatency',
  namespace: 'AWS/CloudFront',
  period: 300,
  statistic: 'Average',
  threshold: 1000, // 1 second
  treatMissingData: 'notBreaching',
  dimensions: {
    DistributionId: distribution.id,
  },
  tags: tags,
});

// Exports
export const websiteBucketName = websiteBucket.bucket;
export const logsBucketName = logsBucket.bucket;
export const cloudfrontUrl = pulumi.interpolate`https://${distribution.domainName}`;
export const cloudfrontDistributionId = distribution.id;
export const websiteUrl = cloudfrontUrl;
export const kinesisStreamArn = kinesisStream.arn;
export const kinesisStreamName = kinesisStream.name;
export const websiteBucketArn = websiteBucket.arn;
export const logsBucketArn = logsBucket.arn;
export const distributionArn = distribution.arn;
export const realtimeLogConfigArn = realtimeLogConfig.arn;
```

## Pulumi.yaml
```yaml
name: tap
description: Media startup static website infrastructure
runtime: nodejs
config:
  aws:region: us-east-2
```

## Pulumi.dev.yaml
```yaml
config:
  tap:domainName: media-startup-dev.example.com
  tap:environment: dev
```

## package.json
```json
{
  "name": "tap",
  "main": "index.js",
  "devDependencies": {
    "@types/node": "^18.0.0",
    "typescript": "^5.0.0"
  },
  "dependencies": {
    "@pulumi/aws": "^7.0.0",
    "@pulumi/pulumi": "^3.0.0",
    "@pulumi/random": "^4.0.0"
  }
}
```

## tsconfig.json
```json
{
  "compilerOptions": {
    "strict": true,
    "outDir": "bin",
    "target": "es2016",
    "module": "commonjs",
    "moduleResolution": "node",
    "sourceMap": true,
    "experimentalDecorators": true,
    "pretty": true,
    "noFallthroughCasesInSwitch": true,
    "noImplicitReturns": true,
    "forceConsistentCasingInFileNames": true,
    "skipLibCheck": true
  },
  "files": ["index.ts"]
}
```

## Key Improvements

1. **Modernized S3 Resources**: Used BucketV2 and separate configuration resources instead of deprecated inline configurations
2. **Enhanced Security**: Added XSS protection to response headers policy
3. **Better Resource Naming**: All resources use environment suffix for unique naming across deployments
4. **Optimized Cache Behaviors**: Added specific cache behaviors for different file types (images, CSS, JS)
5. **Additional Monitoring**: Added origin latency alarm for comprehensive monitoring
6. **Improved Dependencies**: Properly defined dependencies between resources
7. **Better Error Handling**: Added treatMissingData configuration for alarms
8. **Enhanced Exports**: Added more outputs for better integration with other systems
9. **Removed Unused Resources**: Removed Route53 resources when not using custom domain
10. **Better Configuration**: Made domain name optional with sensible defaults