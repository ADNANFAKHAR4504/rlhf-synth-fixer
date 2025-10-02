/* eslint-disable @typescript-eslint/no-unused-vars */
import * as aws from '@pulumi/aws';
import * as pulumi from '@pulumi/pulumi';
import * as random from '@pulumi/random';

const config = new pulumi.Config();
const environment = config.get('environment') || 'dev';
const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || environment;
const domainName = config.get('domainName') || 'example.com';

// Generate random suffix for unique bucket names
const randomSuffix = new random.RandomString('randomSuffix', {
  length: 8,
  special: false,
  upper: false,
});

// Tags for all resources
const tags = {
  Environment: environment,
  Project: 'MediaStartup',
  ManagedBy: 'Pulumi',
};

// S3 bucket for static website content
const websiteBucket = new aws.s3.Bucket('websiteBucket', {
  bucket: pulumi.interpolate`tap-${environmentSuffix}-website-${randomSuffix.result}`,
  website: {
    indexDocument: 'index.html',
    errorDocument: 'error.html',
  },
  tags: tags,
});

// S3 bucket for CloudFront logs
const logsBucket = new aws.s3.Bucket('logsBucket', {
  bucket: pulumi.interpolate`tap-${environmentSuffix}-logs-${randomSuffix.result}`,
  lifecycleRules: [
    {
      enabled: true,
      id: 'archive-old-logs',
      transitions: [
        {
          days: 60,
          storageClass: 'GLACIER',
        },
      ],
      expiration: {
        days: 365,
      },
    },
  ],
  tags: tags,
});

// S3 bucket public access block for website bucket
const websiteBucketPAB = new aws.s3.BucketPublicAccessBlock(
  'websiteBucketPAB',
  {
    bucket: websiteBucket.id,
    blockPublicAcls: false,
    blockPublicPolicy: false,
    ignorePublicAcls: false,
    restrictPublicBuckets: false,
  }
);

// S3 bucket public access block for logs bucket
const _logsBucketPAB = new aws.s3.BucketPublicAccessBlock('logsBucketPAB', {
  bucket: logsBucket.id,
  blockPublicAcls: true,
  blockPublicPolicy: true,
  ignorePublicAcls: true,
  restrictPublicBuckets: true,
});

// S3 bucket ownership controls for CloudFront logs
const _logsBucketOwnershipControls = new aws.s3.BucketOwnershipControls(
  'logsBucketOwnershipControls',
  {
    bucket: logsBucket.id,
    rule: {
      objectOwnership: 'BucketOwnerPreferred',
    },
  }
);

// Grant CloudFront permission to write logs to S3
const _logsBucketPolicy = new aws.s3.BucketPolicy('logsBucketPolicy', {
  bucket: logsBucket.id,
  policy: pulumi.interpolate`{
    "Version": "2012-10-17",
    "Statement": [
      {
        "Sid": "AllowCloudFrontLogDelivery",
        "Effect": "Allow",
        "Principal": {
          "Service": "cloudfront.amazonaws.com"
        },
        "Action": [
          "s3:PutObject",
          "s3:GetBucketAcl"
        ],
        "Resource": [
          "${logsBucket.arn}/*",
          "${logsBucket.arn}"
        ]
      }
    ]
  }`,
});

// CloudFront Origin Access Control
const oac = new aws.cloudfront.OriginAccessControl('oac', {
  originAccessControlOriginType: 's3',
  signingBehavior: 'always',
  signingProtocol: 'sigv4',
  description: 'OAC for media startup website',
});

// CloudFront Response Headers Policy
const responseHeadersPolicy = new aws.cloudfront.ResponseHeadersPolicy(
  'responseHeadersPolicy',
  {
    customHeadersConfig: {
      items: [
        {
          header: 'X-Custom-Header',
          value: 'MediaStartup',
          override: false,
        },
      ],
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
        contentSecurityPolicy:
          "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline';",
        override: false,
      },
      strictTransportSecurity: {
        accessControlMaxAgeSec: 63072000,
        includeSubdomains: true,
        override: false,
      },
    },
  }
);

// Create Kinesis stream for real-time logs
const kinesisStream = new aws.kinesis.Stream('logStream', {
  shardCount: 1,
  retentionPeriod: 24,
  tags: tags,
});

// Create IAM role for real-time logs
const realtimeLogRole = new aws.iam.Role('realtimeLogRole', {
  assumeRolePolicy: JSON.stringify({
    Version: '2012-10-17',
    Statement: [
      {
        Action: 'sts:AssumeRole',
        Effect: 'Allow',
        Principal: {
          Service: 'cloudfront.amazonaws.com',
        },
      },
    ],
  }),
  tags: tags,
});

// Create IAM role policy for Kinesis access
const _realtimeLogRolePolicy = new aws.iam.RolePolicy('realtimeLogRolePolicy', {
  role: realtimeLogRole.id,
  policy: pulumi.interpolate`{
    "Version": "2012-10-17",
    "Statement": [
      {
        "Effect": "Allow",
        "Action": [
          "kinesis:PutRecord",
          "kinesis:PutRecords"
        ],
        "Resource": "${kinesisStream.arn}"
      }
    ]
  }`,
});

// Real-time logs configuration
const realtimeLogConfig = new aws.cloudfront.RealtimeLogConfig(
  'realtimeLogConfig',
  {
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
  }
);

// CloudFront distribution
const distribution = new aws.cloudfront.Distribution('distribution', {
  enabled: true,
  isIpv6Enabled: true,
  comment: 'Media startup static website distribution',
  defaultRootObject: 'index.html',
  // aliases: [domainName], // Commenting out since we don't have a real domain
  priceClass: 'PriceClass_100',

  origins: [
    {
      domainName: websiteBucket.bucketRegionalDomainName,
      originId: 'S3-Website',
      originAccessControlId: oac.id,
      connectionAttempts: 3,
      connectionTimeout: 10,
    },
  ],

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

  restrictions: {
    geoRestriction: {
      restrictionType: 'none',
    },
  },

  viewerCertificate: {
    cloudfrontDefaultCertificate: true,
    minimumProtocolVersion: 'TLSv1.2_2021',
  },

  // Commenting out logging config due to S3 ACL issues
  // loggingConfig: {
  //   bucket: logsBucket.bucketDomainName,
  //   prefix: 'cloudfront/',
  //   includeCookies: false,
  // },

  tags: tags,
});

// S3 bucket policy for CloudFront OAC access
const _bucketPolicy = new aws.s3.BucketPolicy(
  'bucketPolicy',
  {
    bucket: websiteBucket.id,
    policy: pulumi
      .all([websiteBucket.arn, distribution.arn])
      .apply(([bucketArn, distArn]) =>
        JSON.stringify({
          Version: '2012-10-17',
          Statement: [
            {
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
            },
          ],
        })
      ),
  },
  { dependsOn: [websiteBucketPAB] }
);

// Route 53 hosted zone - commented out as we don't have a real domain
// const hostedZone = new aws.route53.Zone('hostedZone', {
//   name: domainName,
//   comment: `Hosted zone for ${environment} environment`,
//   tags: tags,
// });

// Route 53 A record for CloudFront - commented out as we don't have a real domain
// const _aRecord = new aws.route53.Record('aRecord', {
//   zoneId: hostedZone.zoneId,
//   name: domainName,
//   type: 'A',
//   aliases: [
//     {
//       name: distribution.domainName,
//       zoneId: distribution.hostedZoneId,
//       evaluateTargetHealth: false,
//     },
//   ],
// });

// Route 53 AAAA record for CloudFront (IPv6) - commented out as we don't have a real domain
// const _aaaaRecord = new aws.route53.Record('aaaaRecord', {
//   zoneId: hostedZone.zoneId,
//   name: domainName,
//   type: 'AAAA',
//   aliases: [
//     {
//       name: distribution.domainName,
//       zoneId: distribution.hostedZoneId,
//       evaluateTargetHealth: false,
//     },
//   ],
// });

// CloudWatch metric alarm for 4xx errors
const _error4xxAlarm = new aws.cloudwatch.MetricAlarm('error4xxAlarm', {
  alarmDescription: 'Alert when 4xx errors exceed threshold',
  comparisonOperator: 'GreaterThanThreshold',
  evaluationPeriods: 2,
  metricName: '4xxErrorRate',
  namespace: 'AWS/CloudFront',
  period: 300,
  statistic: 'Average',
  threshold: 5,
  dimensions: {
    DistributionId: distribution.id,
  },
  tags: tags,
});

// CloudWatch metric alarm for 5xx errors
const _error5xxAlarm = new aws.cloudwatch.MetricAlarm('error5xxAlarm', {
  alarmDescription: 'Alert when 5xx errors exceed threshold',
  comparisonOperator: 'GreaterThanThreshold',
  evaluationPeriods: 2,
  metricName: '5xxErrorRate',
  namespace: 'AWS/CloudFront',
  period: 300,
  statistic: 'Average',
  threshold: 1,
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
export const websiteUrl = cloudfrontUrl; // Using CloudFront URL since we don't have a custom domain
export const kinesisStreamArn = kinesisStream.arn;
export const kinesisStreamName = kinesisStream.name;
export const websiteBucketArn = websiteBucket.arn;
export const logsBucketArn = logsBucket.arn;
// export const nameservers = hostedZone.nameServers;  // Commented out - no Route53
// export const hostedZoneId = hostedZone.zoneId;      // Commented out - no Route53
