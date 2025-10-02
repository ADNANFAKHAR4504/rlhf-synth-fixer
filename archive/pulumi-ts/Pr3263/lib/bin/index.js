"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.hostedZoneId = exports.nameservers = exports.websiteUrl = exports.cloudfrontDistributionId = exports.cloudfrontUrl = exports.logsBucketName = exports.websiteBucketName = void 0;
const pulumi = require("@pulumi/pulumi");
const aws = require("@pulumi/aws");
const random = require("@pulumi/random");
const config = new pulumi.Config();
const environment = config.get("environment") || "dev";
const domainName = config.require("domainName");
// Generate random suffix for unique bucket names
const randomSuffix = new random.RandomString("randomSuffix", {
    length: 8,
    special: false,
    upper: false,
});
// Tags for all resources
const tags = {
    Environment: environment,
    Project: "MediaStartup",
    ManagedBy: "Pulumi",
};
// S3 bucket for static website content
const websiteBucket = new aws.s3.Bucket("websiteBucket", {
    bucket: pulumi.interpolate `media-startup-website-${environment}-${randomSuffix.result}`,
    acl: "private",
    website: {
        indexDocument: "index.html",
        errorDocument: "error.html",
    },
    tags: tags,
});
// S3 bucket for CloudFront logs
const logsBucket = new aws.s3.Bucket("logsBucket", {
    bucket: pulumi.interpolate `media-startup-logs-${environment}-${randomSuffix.result}`,
    acl: "private",
    lifecycleRules: [{
            enabled: true,
            id: "archive-old-logs",
            transitions: [{
                    days: 60,
                    storageClass: "GLACIER",
                }],
            expiration: {
                days: 365,
            },
        }],
    tags: tags,
});
// S3 bucket public access block for website bucket
const websiteBucketPAB = new aws.s3.BucketPublicAccessBlock("websiteBucketPAB", {
    bucket: websiteBucket.id,
    blockPublicAcls: false,
    blockPublicPolicy: false,
    ignorePublicAcls: false,
    restrictPublicBuckets: false,
});
// S3 bucket public access block for logs bucket
const logsBucketPAB = new aws.s3.BucketPublicAccessBlock("logsBucketPAB", {
    bucket: logsBucket.id,
    blockPublicAcls: true,
    blockPublicPolicy: true,
    ignorePublicAcls: true,
    restrictPublicBuckets: true,
});
// CloudFront Origin Access Control
const oac = new aws.cloudfront.OriginAccessControl("oac", {
    originAccessControlOriginType: "s3",
    signingBehavior: "always",
    signingProtocol: "sigv4",
    description: "OAC for media startup website",
});
// CloudFront Response Headers Policy
const responseHeadersPolicy = new aws.cloudfront.ResponseHeadersPolicy("responseHeadersPolicy", {
    customHeadersConfig: {
        items: [
            {
                header: "X-Frame-Options",
                value: "DENY",
                override: false,
            },
            {
                header: "X-Content-Type-Options",
                value: "nosniff",
                override: false,
            },
        ],
    },
    securityHeadersConfig: {
        contentTypeOptions: {
            override: false,
        },
        frameOptions: {
            frameOption: "DENY",
            override: false,
        },
        referrerPolicy: {
            referrerPolicy: "strict-origin-when-cross-origin",
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
    },
});
// Real-time logs configuration
const realtimeLogConfig = new aws.cloudfront.RealtimeLogConfig("realtimeLogConfig", {
    name: pulumi.interpolate `media-startup-realtime-logs-${environment}`,
    samplingRate: 1,
    fields: [
        "timestamp",
        "c-ip",
        "time-taken",
        "sc-status",
        "cs-method",
        "cs-uri-stem",
        "cs-bytes",
        "sc-bytes",
    ],
    endpoint: {
        streamType: "Kinesis",
        kinesisStreamConfig: {
            streamArn: new aws.kinesis.Stream("logStream", {
                shardCount: 1,
                retentionPeriod: 24,
                tags: tags,
            }).arn,
            roleArn: new aws.iam.Role("realtimeLogRole", {
                assumeRolePolicy: JSON.stringify({
                    Version: "2012-10-17",
                    Statement: [{
                            Action: "sts:AssumeRole",
                            Effect: "Allow",
                            Principal: {
                                Service: "cloudfront.amazonaws.com"
                            },
                        }],
                }),
                tags: tags,
            }).arn,
        },
    },
});
// CloudFront distribution
const distribution = new aws.cloudfront.Distribution("distribution", {
    enabled: true,
    isIpv6Enabled: true,
    comment: "Media startup static website distribution",
    defaultRootObject: "index.html",
    aliases: [domainName],
    priceClass: "PriceClass_100",
    origins: [{
            domainName: websiteBucket.bucketRegionalDomainName,
            originId: "S3-Website",
            originAccessControlId: oac.id,
            connectionAttempts: 3,
            connectionTimeout: 10,
        }],
    defaultCacheBehavior: {
        targetOriginId: "S3-Website",
        viewerProtocolPolicy: "redirect-to-https",
        allowedMethods: ["GET", "HEAD", "OPTIONS"],
        cachedMethods: ["GET", "HEAD", "OPTIONS"],
        compress: true,
        minTtl: 0,
        defaultTtl: 86400,
        maxTtl: 31536000,
        forwardedValues: {
            queryString: false,
            cookies: {
                forward: "none",
            },
        },
        realtimeLogConfigArn: realtimeLogConfig.arn,
        responseHeadersPolicyId: responseHeadersPolicy.id,
    },
    restrictions: {
        geoRestriction: {
            restrictionType: "none",
        },
    },
    viewerCertificate: {
        acmCertificateArn: new aws.acm.Certificate("certificate", {
            domainName: domainName,
            validationMethod: "DNS",
            tags: tags,
        }).arn,
        sslSupportMethod: "sni-only",
        minimumProtocolVersion: "TLSv1.2_2021",
    },
    loggingConfig: {
        bucket: logsBucket.bucketDomainName,
        prefix: "cloudfront/",
        includeCookies: false,
    },
    tags: tags,
});
// S3 bucket policy for CloudFront OAC access
const bucketPolicy = new aws.s3.BucketPolicy("bucketPolicy", {
    bucket: websiteBucket.id,
    policy: pulumi.all([websiteBucket.arn, distribution.arn]).apply(([bucketArn, distArn]) => JSON.stringify({
        Version: "2012-10-17",
        Statement: [{
                Sid: "AllowCloudFrontServicePrincipal",
                Effect: "Allow",
                Principal: {
                    Service: "cloudfront.amazonaws.com"
                },
                Action: "s3:GetObject",
                Resource: `${bucketArn}/*`,
                Condition: {
                    StringEquals: {
                        "AWS:SourceArn": distArn
                    }
                }
            }]
    })),
}, { dependsOn: [websiteBucketPAB] });
// Route 53 hosted zone
const hostedZone = new aws.route53.Zone("hostedZone", {
    name: domainName,
    comment: `Hosted zone for ${environment} environment`,
    tags: tags,
});
// Route 53 A record for CloudFront
const aRecord = new aws.route53.Record("aRecord", {
    zoneId: hostedZone.zoneId,
    name: domainName,
    type: "A",
    aliases: [{
            name: distribution.domainName,
            zoneId: distribution.hostedZoneId,
            evaluateTargetHealth: false,
        }],
});
// Route 53 AAAA record for CloudFront (IPv6)
const aaaaRecord = new aws.route53.Record("aaaaRecord", {
    zoneId: hostedZone.zoneId,
    name: domainName,
    type: "AAAA",
    aliases: [{
            name: distribution.domainName,
            zoneId: distribution.hostedZoneId,
            evaluateTargetHealth: false,
        }],
});
// CloudWatch metric alarm for 4xx errors
const error4xxAlarm = new aws.cloudwatch.MetricAlarm("error4xxAlarm", {
    alarmDescription: "Alert when 4xx errors exceed threshold",
    comparisonOperator: "GreaterThanThreshold",
    evaluationPeriods: 2,
    metricName: "4xxErrorRate",
    namespace: "AWS/CloudFront",
    period: 300,
    statistic: "Average",
    threshold: 5,
    dimensions: {
        DistributionId: distribution.id,
    },
    tags: tags,
});
// CloudWatch metric alarm for 5xx errors
const error5xxAlarm = new aws.cloudwatch.MetricAlarm("error5xxAlarm", {
    alarmDescription: "Alert when 5xx errors exceed threshold",
    comparisonOperator: "GreaterThanThreshold",
    evaluationPeriods: 2,
    metricName: "5xxErrorRate",
    namespace: "AWS/CloudFront",
    period: 300,
    statistic: "Average",
    threshold: 1,
    dimensions: {
        DistributionId: distribution.id,
    },
    tags: tags,
});
// Exports
exports.websiteBucketName = websiteBucket.bucket;
exports.logsBucketName = logsBucket.bucket;
exports.cloudfrontUrl = pulumi.interpolate `https://${distribution.domainName}`;
exports.cloudfrontDistributionId = distribution.id;
exports.websiteUrl = pulumi.interpolate `https://${domainName}`;
exports.nameservers = hostedZone.nameServers;
exports.hostedZoneId = hostedZone.zoneId;
//# sourceMappingURL=index.js.map