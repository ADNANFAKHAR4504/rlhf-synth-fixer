"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.TapStack = void 0;
const pulumi = __importStar(require("@pulumi/pulumi"));
const aws = __importStar(require("@pulumi/aws"));
class TapStack extends pulumi.ComponentResource {
    bucketName;
    distributionDomainName;
    hostedZoneId;
    subscriberTableName;
    mediaConvertRoleArn;
    constructor(name, args, opts) {
        super('tap:TapStack', name, {}, opts);
        const tags = args?.tags || {};
        const environmentSuffix = args.environmentSuffix;
        // S3 Bucket for audio storage with requester pays
        const audioBucket = new aws.s3.Bucket(`podcast-audio-bucket-${environmentSuffix}`, {
            bucket: `tap-podcast-audio-${environmentSuffix}`.toLowerCase(),
            requestPayer: 'Requester',
            versioning: {
                enabled: true,
            },
            serverSideEncryptionConfiguration: {
                rule: {
                    applyServerSideEncryptionByDefault: {
                        sseAlgorithm: 'AES256',
                    },
                },
            },
            forceDestroy: true, // Allow destruction for testing
            tags: {
                ...tags,
                Name: `podcast-audio-storage-${environmentSuffix}`,
                Purpose: 'Audio file storage',
                EnvironmentSuffix: environmentSuffix,
            },
        }, { parent: this });
        // Create bucket policy (kept for infrastructure completeness)
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const _audioBucketPolicy = new aws.s3.BucketPolicy(`audio-bucket-policy-${environmentSuffix}`, {
            bucket: audioBucket.id,
            policy: pulumi.all([audioBucket.arn]).apply(([bucketArn]) => JSON.stringify({
                Version: '2012-10-17',
                Statement: [
                    {
                        Effect: 'Allow',
                        Principal: {
                            Service: 'cloudfront.amazonaws.com',
                        },
                        Action: 's3:GetObject',
                        Resource: `${bucketArn}/*`,
                        Condition: {
                            StringEquals: {
                                'AWS:SourceArn': 'arn:aws:cloudfront::*:distribution/*',
                            },
                        },
                    },
                ],
            })),
        }, { parent: this });
        // DynamoDB table for subscriber data
        const subscriberTable = new aws.dynamodb.Table(`subscriber-table-${environmentSuffix}`, {
            name: `tap-subscribers-${environmentSuffix}`,
            attributes: [
                { name: 'subscriberId', type: 'S' },
                { name: 'email', type: 'S' },
            ],
            hashKey: 'subscriberId',
            billingMode: 'PAY_PER_REQUEST',
            globalSecondaryIndexes: [
                {
                    name: 'email-index',
                    hashKey: 'email',
                    projectionType: 'ALL',
                },
            ],
            streamEnabled: true,
            streamViewType: 'NEW_AND_OLD_IMAGES',
            pointInTimeRecovery: {
                enabled: true,
            },
            deletionProtectionEnabled: false, // Allow destruction for testing
            tags: {
                ...tags,
                Name: `subscriber-data-${environmentSuffix}`,
                EnvironmentSuffix: environmentSuffix,
            },
        }, { parent: this });
        // Lambda@Edge function for authorization
        const authLambdaRole = new aws.iam.Role(`auth-lambda-role-${environmentSuffix}`, {
            name: `tap-auth-lambda-role-${environmentSuffix}`,
            assumeRolePolicy: JSON.stringify({
                Version: '2012-10-17',
                Statement: [
                    {
                        Action: 'sts:AssumeRole',
                        Effect: 'Allow',
                        Principal: {
                            Service: ['lambda.amazonaws.com', 'edgelambda.amazonaws.com'],
                        },
                    },
                ],
            }),
            tags: {
                ...tags,
                EnvironmentSuffix: environmentSuffix,
            },
        }, { parent: this });
        new aws.iam.RolePolicyAttachment(`auth-lambda-basic-execution-${environmentSuffix}`, {
            role: authLambdaRole.name,
            policyArn: 'arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole',
        }, { parent: this });
        // Create Lambda policy (kept for infrastructure completeness)
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const _authLambdaPolicy = new aws.iam.RolePolicy(`auth-lambda-policy-${environmentSuffix}`, {
            role: authLambdaRole.id,
            policy: pulumi.all([subscriberTable.arn]).apply(([tableArn]) => JSON.stringify({
                Version: '2012-10-17',
                Statement: [
                    {
                        Effect: 'Allow',
                        Action: ['dynamodb:GetItem', 'dynamodb:Query'],
                        Resource: [tableArn, `${tableArn}/index/*`],
                    },
                ],
            })),
        }, { parent: this });
        // Create us-east-1 provider for Lambda@Edge
        const usEast1Provider = new aws.Provider(`us-east-1-provider-${environmentSuffix}`, {
            region: 'us-east-1',
        }, { parent: this });
        const authLambda = new aws.lambda.Function(`auth-lambda-edge-${environmentSuffix}`, {
            name: `tap-auth-edge-${environmentSuffix}`,
            code: new pulumi.asset.AssetArchive({
                'index.js': new pulumi.asset.StringAsset(`
exports.handler = async (event) => {
    const request = event.Records[0].cf.request;
    const headers = request.headers;

    // Check for signed cookie
    const cookies = headers.cookie || [];
    let isAuthorized = false;

    for (const cookie of cookies) {
        if (cookie.value && cookie.value.includes('CloudFront-Policy')) {
            isAuthorized = true;
            break;
        }
    }

    if (!isAuthorized) {
        return {
            status: '403',
            statusDescription: 'Forbidden',
            body: 'Authorization required',
        };
    }

    return request;
};
                `),
            }),
            runtime: 'nodejs18.x',
            handler: 'index.handler',
            role: authLambdaRole.arn,
            timeout: 5,
            publish: true,
            tags: {
                ...tags,
                EnvironmentSuffix: environmentSuffix,
            },
        }, { parent: this, provider: usEast1Provider });
        // CloudFront Origin Access Control
        const oac = new aws.cloudfront.OriginAccessControl(`podcast-oac-${environmentSuffix}`, {
            name: `tap-podcast-oac-${environmentSuffix}`,
            originAccessControlOriginType: 's3',
            signingBehavior: 'always',
            signingProtocol: 'sigv4',
            description: `OAC for podcast audio bucket ${environmentSuffix}`,
        }, { parent: this });
        // CloudFront distribution
        const distribution = new aws.cloudfront.Distribution(`podcast-distribution-${environmentSuffix}`, {
            enabled: true,
            isIpv6Enabled: true,
            defaultRootObject: 'index.html',
            priceClass: 'PriceClass_100',
            comment: `Podcast CDN for ${environmentSuffix}`,
            origins: [
                {
                    domainName: audioBucket.bucketRegionalDomainName,
                    originId: 's3-podcast-audio',
                    originAccessControlId: oac.id,
                },
            ],
            defaultCacheBehavior: {
                targetOriginId: 's3-podcast-audio',
                viewerProtocolPolicy: 'redirect-to-https',
                allowedMethods: ['GET', 'HEAD', 'OPTIONS'],
                cachedMethods: ['GET', 'HEAD'],
                trustedSigners: ['self'],
                forwardedValues: {
                    queryString: false,
                    cookies: {
                        forward: 'all',
                    },
                },
                lambdaFunctionAssociations: [
                    {
                        eventType: 'viewer-request',
                        lambdaArn: authLambda.qualifiedArn,
                    },
                ],
                minTtl: 0,
                defaultTtl: 86400,
                maxTtl: 31536000,
            },
            restrictions: {
                geoRestriction: {
                    restrictionType: 'none',
                },
            },
            viewerCertificate: {
                cloudfrontDefaultCertificate: true,
            },
            tags: {
                ...tags,
                Name: `podcast-cdn-${environmentSuffix}`,
                EnvironmentSuffix: environmentSuffix,
            },
        }, { parent: this });
        // Route 53 hosted zone
        const hostedZone = new aws.route53.Zone(`podcast-zone-${environmentSuffix}`, {
            name: `tap-podcast-${environmentSuffix}.com`,
            comment: `DNS zone for ${environmentSuffix}`,
            tags: {
                ...tags,
                Name: `podcast-dns-${environmentSuffix}`,
                EnvironmentSuffix: environmentSuffix,
            },
        }, { parent: this });
        // MediaConvert role
        const mediaConvertRole = new aws.iam.Role(`mediaconvert-role-${environmentSuffix}`, {
            name: `tap-mediaconvert-role-${environmentSuffix}`,
            assumeRolePolicy: JSON.stringify({
                Version: '2012-10-17',
                Statement: [
                    {
                        Action: 'sts:AssumeRole',
                        Effect: 'Allow',
                        Principal: {
                            Service: 'mediaconvert.amazonaws.com',
                        },
                    },
                ],
            }),
            tags: {
                ...tags,
                EnvironmentSuffix: environmentSuffix,
            },
        }, { parent: this });
        // Create MediaConvert policy (kept for infrastructure completeness)
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const _mediaConvertPolicy = new aws.iam.RolePolicy(`mediaconvert-policy-${environmentSuffix}`, {
            role: mediaConvertRole.id,
            policy: pulumi.all([audioBucket.arn]).apply(([bucketArn]) => JSON.stringify({
                Version: '2012-10-17',
                Statement: [
                    {
                        Effect: 'Allow',
                        Action: ['s3:GetObject', 's3:PutObject'],
                        Resource: `${bucketArn}/*`,
                    },
                    {
                        Effect: 'Allow',
                        Action: 's3:ListBucket',
                        Resource: bucketArn,
                    },
                ],
            })),
        }, { parent: this });
        // EventBridge rule for scheduled tasks
        const schedulerRole = new aws.iam.Role(`scheduler-role-${environmentSuffix}`, {
            name: `tap-scheduler-role-${environmentSuffix}`,
            assumeRolePolicy: JSON.stringify({
                Version: '2012-10-17',
                Statement: [
                    {
                        Action: 'sts:AssumeRole',
                        Effect: 'Allow',
                        Principal: {
                            Service: 'scheduler.amazonaws.com',
                        },
                    },
                ],
            }),
            tags: {
                ...tags,
                EnvironmentSuffix: environmentSuffix,
            },
        }, { parent: this });
        // Processing Lambda
        const processingLambdaRole = new aws.iam.Role(`processing-lambda-role-${environmentSuffix}`, {
            name: `tap-processing-lambda-role-${environmentSuffix}`,
            assumeRolePolicy: JSON.stringify({
                Version: '2012-10-17',
                Statement: [
                    {
                        Action: 'sts:AssumeRole',
                        Effect: 'Allow',
                        Principal: {
                            Service: 'lambda.amazonaws.com',
                        },
                    },
                ],
            }),
            tags: {
                ...tags,
                EnvironmentSuffix: environmentSuffix,
            },
        }, { parent: this });
        new aws.iam.RolePolicyAttachment(`processing-lambda-basic-${environmentSuffix}`, {
            role: processingLambdaRole.name,
            policyArn: 'arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole',
        }, { parent: this });
        // Create processing Lambda policy (kept for infrastructure completeness)
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const _processingLambdaPolicy = new aws.iam.RolePolicy(`processing-lambda-policy-${environmentSuffix}`, {
            role: processingLambdaRole.id,
            policy: JSON.stringify({
                Version: '2012-10-17',
                Statement: [
                    {
                        Effect: 'Allow',
                        Action: [
                            'mediaconvert:CreateJob',
                            'mediaconvert:GetJob',
                            'mediaconvert:ListJobs',
                            'iam:PassRole',
                        ],
                        Resource: '*',
                    },
                ],
            }),
        }, { parent: this });
        const processingLambda = new aws.lambda.Function(`processing-lambda-${environmentSuffix}`, {
            name: `tap-processing-${environmentSuffix}`,
            code: new pulumi.asset.AssetArchive({
                'index.js': new pulumi.asset.StringAsset(`
const AWS = require('aws-sdk');
const mediaConvert = new AWS.MediaConvert({ region: 'us-west-2' });

exports.handler = async (event) => {
    console.log('Processing scheduled task:', JSON.stringify(event));

    // Placeholder for MediaConvert job creation
    // This would be expanded with actual transcoding logic

    return {
        statusCode: 200,
        body: JSON.stringify({ message: 'Processing completed' }),
    };
};
                `),
            }),
            runtime: 'nodejs18.x',
            handler: 'index.handler',
            role: processingLambdaRole.arn,
            timeout: 60,
            environment: {
                variables: {
                    MEDIACONVERT_ROLE: mediaConvertRole.arn,
                    AUDIO_BUCKET: audioBucket.id,
                },
            },
            tags: {
                ...tags,
                EnvironmentSuffix: environmentSuffix,
            },
        }, { parent: this });
        // Create scheduler policy (kept for infrastructure completeness)
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const _schedulerPolicy = new aws.iam.RolePolicy(`scheduler-policy-${environmentSuffix}`, {
            role: schedulerRole.id,
            policy: pulumi.all([processingLambda.arn]).apply(([lambdaArn]) => JSON.stringify({
                Version: '2012-10-17',
                Statement: [
                    {
                        Effect: 'Allow',
                        Action: 'lambda:InvokeFunction',
                        Resource: lambdaArn,
                    },
                ],
            })),
        }, { parent: this });
        const scheduleGroup = new aws.scheduler.ScheduleGroup(`podcast-schedules-${environmentSuffix}`, {
            name: `tap-podcast-schedules-${environmentSuffix}`,
            tags: {
                ...tags,
                EnvironmentSuffix: environmentSuffix,
            },
        }, { parent: this });
        // Create content processing schedule (kept for infrastructure completeness)
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const _contentProcessingSchedule = new aws.scheduler.Schedule(`content-processing-${environmentSuffix}`, {
            name: `tap-content-processing-${environmentSuffix}`,
            groupName: scheduleGroup.name,
            flexibleTimeWindow: {
                mode: 'OFF',
            },
            scheduleExpression: 'rate(1 hour)',
            target: {
                arn: processingLambda.arn,
                roleArn: schedulerRole.arn,
                input: JSON.stringify({
                    task: 'process_new_content',
                }),
            },
        }, { parent: this });
        // CloudWatch Dashboard (kept for infrastructure completeness)
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const _dashboard = new aws.cloudwatch.Dashboard(`podcast-dashboard-${environmentSuffix}`, {
            dashboardName: `tap-podcast-metrics-${environmentSuffix}`,
            dashboardBody: JSON.stringify({
                widgets: [
                    {
                        type: 'metric',
                        properties: {
                            metrics: [
                                ['AWS/CloudFront', 'BytesDownloaded', { stat: 'Sum' }],
                                ['AWS/CloudFront', 'Requests', { stat: 'Sum' }],
                            ],
                            period: 300,
                            stat: 'Average',
                            region: 'us-east-1',
                            title: 'CDN Traffic',
                        },
                    },
                    {
                        type: 'metric',
                        properties: {
                            metrics: [
                                ['AWS/DynamoDB', 'ConsumedReadCapacityUnits'],
                                ['AWS/DynamoDB', 'ConsumedWriteCapacityUnits'],
                            ],
                            period: 300,
                            stat: 'Sum',
                            region: 'us-west-2',
                            title: 'Subscriber Table Activity',
                        },
                    },
                ],
            }),
        }, { parent: this });
        // CloudWatch Alarms (kept for infrastructure completeness)
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const _highTrafficAlarm = new aws.cloudwatch.MetricAlarm(`high-traffic-alarm-${environmentSuffix}`, {
            name: `tap-high-traffic-${environmentSuffix}`,
            comparisonOperator: 'GreaterThanThreshold',
            evaluationPeriods: 2,
            metricName: 'Requests',
            namespace: 'AWS/CloudFront',
            period: 300,
            statistic: 'Sum',
            threshold: 10000,
            alarmDescription: `Alert when traffic exceeds threshold for ${environmentSuffix}`,
            tags: {
                ...tags,
                EnvironmentSuffix: environmentSuffix,
            },
        }, { parent: this });
        this.bucketName = audioBucket.id;
        this.distributionDomainName = distribution.domainName;
        this.hostedZoneId = hostedZone.zoneId;
        this.subscriberTableName = subscriberTable.name;
        this.mediaConvertRoleArn = mediaConvertRole.arn;
        this.registerOutputs({
            bucketName: this.bucketName,
            distributionDomainName: this.distributionDomainName,
            hostedZoneId: this.hostedZoneId,
            subscriberTableName: this.subscriberTableName,
            mediaConvertRoleArn: this.mediaConvertRoleArn,
        });
    }
}
exports.TapStack = TapStack;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidGFwLXN0YWNrLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vbGliL3RhcC1zdGFjay50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFBQSx1REFBeUM7QUFDekMsaURBQW1DO0FBT25DLE1BQWEsUUFBUyxTQUFRLE1BQU0sQ0FBQyxpQkFBaUI7SUFDcEMsVUFBVSxDQUF3QjtJQUNsQyxzQkFBc0IsQ0FBd0I7SUFDOUMsWUFBWSxDQUF3QjtJQUNwQyxtQkFBbUIsQ0FBd0I7SUFDM0MsbUJBQW1CLENBQXdCO0lBRTNELFlBQ0UsSUFBWSxFQUNaLElBQWtCLEVBQ2xCLElBQXNDO1FBRXRDLEtBQUssQ0FBQyxjQUFjLEVBQUUsSUFBSSxFQUFFLEVBQUUsRUFBRSxJQUFJLENBQUMsQ0FBQztRQUV0QyxNQUFNLElBQUksR0FBRyxJQUFJLEVBQUUsSUFBSSxJQUFJLEVBQUUsQ0FBQztRQUM5QixNQUFNLGlCQUFpQixHQUFHLElBQUksQ0FBQyxpQkFBaUIsQ0FBQztRQUVqRCxrREFBa0Q7UUFDbEQsTUFBTSxXQUFXLEdBQUcsSUFBSSxHQUFHLENBQUMsRUFBRSxDQUFDLE1BQU0sQ0FDbkMsd0JBQXdCLGlCQUFpQixFQUFFLEVBQzNDO1lBQ0UsTUFBTSxFQUFFLHFCQUFxQixpQkFBaUIsRUFBRSxDQUFDLFdBQVcsRUFBRTtZQUM5RCxZQUFZLEVBQUUsV0FBVztZQUN6QixVQUFVLEVBQUU7Z0JBQ1YsT0FBTyxFQUFFLElBQUk7YUFDZDtZQUNELGlDQUFpQyxFQUFFO2dCQUNqQyxJQUFJLEVBQUU7b0JBQ0osa0NBQWtDLEVBQUU7d0JBQ2xDLFlBQVksRUFBRSxRQUFRO3FCQUN2QjtpQkFDRjthQUNGO1lBQ0QsWUFBWSxFQUFFLElBQUksRUFBRSxnQ0FBZ0M7WUFDcEQsSUFBSSxFQUFFO2dCQUNKLEdBQUcsSUFBSTtnQkFDUCxJQUFJLEVBQUUseUJBQXlCLGlCQUFpQixFQUFFO2dCQUNs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UyxFQUFFLGdCQUFnQjtZQUMzQixNQUFNLEVBQUUsR0FBRztZQUNYLFNBQVMsRUFBRSxLQUFLO1lBQ2hCLFNBQVMsRUFBRSxLQUFLO1lBQ2hCLGdCQUFnQixFQUFFLDRDQUE0QyxpQkFBaUIsRUFBRTtZQUNqRixJQUFJLEVBQUU7Z0JBQ0osR0FBRyxJQUFJO2dCQUNQLGlCQUFpQixFQUFFLGlCQUFpQjthQUNyQztTQUNGLEVBQ0QsRUFBRSxNQUFNLEVBQUUsSUFBSSxFQUFFLENBQ2pCLENBQUM7UUFFRixJQUFJLENBQUMsVUFBVSxHQUFHLFdBQVcsQ0FBQyxFQUFFLENBQUM7UUFDakMsSUFBSSxDQUFDLHNCQUFzQixHQUFHLFlBQVksQ0FBQyxVQUFVLENBQUM7UUFDdEQsSUFBSSxDQUFDLFlBQVksR0FBRyxVQUFVLENBQUMsTUFBTSxDQUFDO1FBQ3RDLElBQUksQ0FBQyxtQkFBbUIsR0FBRyxlQUFlLENBQUMsSUFBSSxDQUFDO1FBQ2hELElBQUksQ0FBQyxtQkFBbUIsR0FBRyxnQkFBZ0IsQ0FBQyxHQUFHLENBQUM7UUFFaEQsSUFBSSxDQUFDLGVBQWUsQ0FBQztZQUNuQixVQUFVLEVBQUUsSUFBSSxDQUFDLFVBQVU7WUFDM0Isc0JBQXNCLEVBQUUsSUFBSSxDQUFDLHNCQUFzQjtZQUNuRCxZQUFZLEVBQUUsSUFBSSxDQUFDLFlBQVk7WUFDL0IsbUJBQW1CLEVBQUUsSUFBSSxDQUFDLG1CQUFtQjtZQUM3QyxtQkFBbUIsRUFBRSxJQUFJLENBQUMsbUJBQW1CO1NBQzlDLENBQUMsQ0FBQztJQUNMLENBQUM7Q0FDRjtBQTNtQkQsNEJBMm1CQyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCAqIGFzIHB1bHVtaSBmcm9tICdAcHVsdW1pL3B1bHVtaSc7XG5pbXBvcnQgKiBhcyBhd3MgZnJvbSAnQHB1bHVtaS9hd3MnO1xuXG5leHBvcnQgaW50ZXJmYWNlIFRhcFN0YWNrQXJncyB7XG4gIHRhZ3M/OiB7IFtrZXk6IHN0cmluZ106IHN0cmluZyB9O1xuICBlbnZpcm9ubWVudFN1ZmZpeDogc3RyaW5nO1xufVxuXG5leHBvcnQgY2xhc3MgVGFwU3RhY2sgZXh0ZW5kcyBwdWx1bWkuQ29tcG9uZW50UmVzb3VyY2Uge1xuICBwdWJsaWMgcmVhZG9ubHkgYnVja2V0TmFtZTogcHVsdW1pLk91dHB1dDxzdHJpbmc+O1xuICBwdWJsaWMgcmVhZG9ubHkgZGlzdHJpYnV0aW9uRG9tYWluTmFtZTogcHVsdW1pLk91dHB1dDxzdHJpbmc+O1xuICBwdWJsaWMgcmVhZG9ubHkgaG9zdGVkWm9uZUlkOiBwdWx1bWkuT3V0cHV0PHN0cmluZz47XG4gIHB1YmxpYyByZWFkb25seSBzdWJzY3JpYmVyVGFibGVOYW1lOiBwdWx1bWkuT3V0cHV0PHN0cmluZz47XG4gIHB1YmxpYyByZWFkb25seSBtZWRpYUNvbnZlcnRSb2xlQXJuOiBwdWx1bWkuT3V0cHV0PHN0cmluZz47XG5cbiAgY29uc3RydWN0b3IoXG4gICAgbmFtZTogc3RyaW5nLFxuICAgIGFyZ3M6IFRhcFN0YWNrQXJncyxcbiAgICBvcHRzPzogcHVsdW1pLkNvbXBvbmVudFJlc291cmNlT3B0aW9uc1xuICApIHtcbiAgICBzdXBlcigndGFwOlRhcFN0YWNrJywgbmFtZSwge30sIG9wdHMpO1xuXG4gICAgY29uc3QgdGFncyA9IGFyZ3M/LnRhZ3MgfHwge307XG4gICAgY29uc3QgZW52aXJvbm1lbnRTdWZmaXggPSBhcmdzLmVudmlyb25tZW50U3VmZml4O1xuXG4gICAgLy8gUzMgQnVja2V0IGZvciBhdWRpbyBzdG9yYWdlIHdpdGggcmVxdWVzdGVyIHBheXNcbiAgICBjb25zdCBhdWRpb0J1Y2tldCA9IG5ldyBhd3MuczMuQnVja2V0KFxuICAgICAgYHBvZGNhc3QtYXVkaW8tYnVja2V0LSR7ZW52aXJvbm1lbnRTdWZmaXh9YCxcbiAgICAgIHtcbiAgICAgICAgYnVja2V0OiBgdGFwLXBvZGNhc3QtYXVkaW8tJHtlbnZpcm9ubWVudFN1ZmZpeH1gLnRvTG93ZXJDYXNlKCksXG4gICAgICAgIHJlcXVlc3RQYXllcjogJ1JlcXVlc3RlcicsXG4gICAgICAgIHZlcnNpb25pbmc6IHtcbiAgICAgICAgICBlbmFibGVkOiB0cnVlLFxuICAgICAgICB9LFxuICAgICAgICBzZXJ2ZXJTaWRlRW5jcnlwdGlvbkNvbmZpZ3VyYXRpb246IHtcbiAgICAgICAgICBydWxlOiB7XG4gICAgICAgICAgICBhcHBseVNlcnZlclNpZGVFbmNyeXB0aW9uQnlEZWZhdWx0OiB7XG4gICAgICAgICAgICAgIHNzZUFsZ29yaXRobTogJ0FFUzI1NicsXG4gICAgICAgICAgICB9LFxuICAgICAgICAgIH0sXG4gICAgICAgIH0sXG4gICAgICAgIGZvcmNlRGVzdHJveTogdHJ1ZSwgLy8gQWxsb3cgZGVzdHJ1Y3Rpb24gZm9yIHRlc3RpbmdcbiAgICAgICAgdGFnczoge1xuICAgICAgICAgIC4uLnRhZ3MsXG4gICAgICAgICAgTmFtZTogYHBvZGNhc3QtYXVkaW8tc3RvcmFnZS0ke2Vudmlyb25tZW50U3VmZml4fWAsXG4gICAgICAgICAgUHVycG9zZTogJ0F1ZGlvIGZpbGUgc3RvcmFnZScsXG4gICAgICAgICAgRW52aXJvbm1lbnRTdWZmaXg6IGVudmlyb25tZW50U3VmZml4LFxuICAgICAgICB9LFxuICAgICAgfSxcbiAgICAgIHsgcGFyZW50OiB0aGlzIH1cbiAgICApO1xuXG4gICAgLy8gQ3JlYXRlIGJ1Y2tldCBwb2xpY3kgKGtlcHQgZm9yIGluZnJhc3RydWN0dXJlIGNvbXBsZXRlbmVzcylcbiAgICAvLyBlc2xpbnQtZGlzYWJsZS1uZXh0LWxpbmUgQHR5cGVzY3JpcHQtZXNsaW50L25vLXVudXNlZC12YXJzXG4gICAgY29uc3QgX2F1ZGlvQnVja2V0UG9saWN5ID0gbmV3IGF3cy5zMy5CdWNrZXRQb2xpY3koXG4gICAgICBgYXVkaW8tYnVja2V0LXBvbGljeS0ke2Vudmlyb25tZW50U3VmZml4fWAsXG4gICAgICB7XG4gICAgICAgIGJ1Y2tldDogYXVkaW9CdWNrZXQuaWQsXG4gICAgICAgIHBvbGljeTogcHVsdW1pLmFsbChbYXVkaW9CdWNrZXQuYXJuXSkuYXBwbHkoKFtidWNrZXRBcm5dKSA9PlxuICAgICAgICAgIEpTT04uc3RyaW5naWZ5KHtcbiAgICAgICAgICAgIFZlcnNpb246ICcyMDEyLTEwLTE3JyxcbiAgICAgICAgICAgIFN0YXRlbWVudDogW1xuICAgICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgRWZmZWN0OiAnQWxsb3cnLFxuICAgICAgICAgICAgICAgIFByaW5jaXBhbDoge1xuICAgICAgICAgICAgICAgICAgU2VydmljZTogJ2Nsb3VkZnJvbnQuYW1hem9uYXdzLmNvbScsXG4gICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICBBY3Rpb246ICdzMzpHZXRPYmplY3QnLFxuICAgICAgICAgICAgICAgIFJlc291cmNlOiBgJHtidWNrZXRBcm59LypgLFxuICAgICAgICAgICAgICAgIENvbmRpdGlvbjoge1xuICAgICAgICAgICAgICAgICAgU3RyaW5nRXF1YWxzOiB7XG4gICAgICAgICAgICAgICAgICAgICdBV1M6U291cmNlQXJuJzogJ2Fybjphd3M6Y2xvdWRmcm9udDo6KjpkaXN0cmlidXRpb24vKicsXG4gICAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBdLFxuICAgICAgICAgIH0pXG4gICAgICAgICksXG4gICAgICB9LFxuICAgICAgeyBwYXJlbnQ6IHRoaXMgfVxuICAgICk7XG5cbiAgICAvLyBEeW5hbW9EQiB0YWJsZSBmb3Igc3Vic2NyaWJlciBkYXRhXG4gICAgY29uc3Qgc3Vic2NyaWJlclRhYmxlID0gbmV3IGF3cy5keW5hbW9kYi5UYWJsZShcbiAgICAgIGBzdWJzY3JpYmVyLXRhYmxlLSR7ZW52aXJvbm1lbnRTdWZmaXh9YCxcbiAgICAgIHtcbiAgICAgICAgbmFtZTogYHRhcC1zdWJzY3JpYmVycy0ke2Vudmlyb25tZW50U3VmZml4fWAsXG4gICAgICAgIGF0dHJpYnV0ZXM6IFtcbiAgICAgICAgICB7IG5hbWU6ICdzdWJzY3JpYmVySWQnLCB0eXBlOiAnUycgfSxcbiAgICAgICAgICB7IG5hbWU6ICdlbWFpbCcsIHR5cGU6ICdTJyB9LFxuICAgICAgICBdLFxuICAgICAgICBoYXNoS2V5OiAnc3Vic2NyaWJlcklkJyxcbiAgICAgICAgYmlsbGluZ01vZGU6ICdQQVlfUEVSX1JFUVVFU1QnLFxuICAgICAgICBnbG9iYWxTZWNvbmRhcnlJbmRleGVzOiBbXG4gICAgICAgICAge1xuICAgICAgICAgICAgbmFtZTogJ2VtYWlsLWluZGV4JyxcbiAgICAgICAgICAgIGhhc2hLZXk6ICdlbWFpbCcsXG4gICAgICAgICAgICBwcm9qZWN0aW9uVHlwZTogJ0FMTCcsXG4gICAgICAgICAgfSxcbiAgICAgICAgXSxcbiAgICAgICAgc3RyZWFtRW5hYmxlZDogdHJ1ZSxcbiAgICAgICAgc3RyZWFtVmlld1R5cGU6ICdORVdfQU5EX09MRF9JTUFHRVMnLFxuICAgICAgICBwb2ludEluVGltZVJlY292ZXJ5OiB7XG4gICAgICAgICAgZW5hYmxlZDogdHJ1ZSxcbiAgICAgICAgfSxcbiAgICAgICAgZGVsZXRpb25Qcm90ZWN0aW9uRW5hYmxlZDogZmFsc2UsIC8vIEFsbG93IGRlc3RydWN0aW9uIGZvciB0ZXN0aW5nXG4gICAgICAgIHRhZ3M6IHtcbiAgICAgICAgICAuLi50YWdzLFxuICAgICAgICAgIE5hbWU6IGBzdWJzY3JpYmVyLWRhdGEtJHtlbnZpcm9ubWVudFN1ZmZpeH1gLFxuICAgICAgICAgIEVudmlyb25tZW50U3VmZml4OiBlbnZpcm9ubWVudFN1ZmZpeCxcbiAgICAgICAgfSxcbiAgICAgIH0sXG4gICAgICB7IHBhcmVudDogdGhpcyB9XG4gICAgKTtcblxuICAgIC8vIExhbWJkYUBFZGdlIGZ1bmN0aW9uIGZvciBhdXRob3JpemF0aW9uXG4gICAgY29uc3QgYXV0aExhbWJkYVJvbGUgPSBuZXcgYXdzLmlhbS5Sb2xlKFxuICAgICAgYGF1dGgtbGFtYmRhLXJvbGUtJHtlbnZpcm9ubWVudFN1ZmZpeH1gLFxuICAgICAge1xuICAgICAgICBuYW1lOiBgdGFwLWF1dGgtbGFtYmRhLXJvbGUtJHtlbnZpcm9ubWVudFN1ZmZpeH1gLFxuICAgICAgICBhc3N1bWVSb2xlUG9saWN5OiBKU09OLnN0cmluZ2lmeSh7XG4gICAgICAgICAgVmVyc2lvbjogJzIwMTItMTAtMTcnLFxuICAgICAgICAgIFN0YXRlbWVudDogW1xuICAgICAgICAgICAge1xuICAgICAgICAgICAgICBBY3Rpb246ICdzdHM6QXNzdW1lUm9sZScsXG4gICAgICAgICAgICAgIEVmZmVjdDogJ0FsbG93JyxcbiAgICAgICAgICAgICAgUHJpbmNpcGFsOiB7XG4gICAgICAgICAgICAgICAgU2VydmljZTogWydsYW1iZGEuYW1hem9uYXdzLmNvbScsICdlZGdlbGFtYmRhLmFtYXpvbmF3cy5jb20nXSxcbiAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgXSxcbiAgICAgICAgfSksXG4gICAgICAgIHRhZ3M6IHtcbiAgICAgICAgICAuLi50YWdzLFxuICAgICAgICAgIEVudmlyb25tZW50U3VmZml4OiBlbnZpcm9ubWVudFN1ZmZpeCxcbiAgICAgICAgfSxcbiAgICAgIH0sXG4gICAgICB7IHBhcmVudDogdGhpcyB9XG4gICAgKTtcblxuICAgIG5ldyBhd3MuaWFtLlJvbGVQb2xpY3lBdHRhY2htZW50KFxuICAgICAgYGF1dGgtbGFtYmRhLWJhc2ljLWV4ZWN1dGlvbi0ke2Vudmlyb25tZW50U3VmZml4fWAsXG4gICAgICB7XG4gICAgICAgIHJvbGU6IGF1dGhMYW1iZGFSb2xlLm5hbWUsXG4gICAgICAgIHBvbGljeUFybjpcbiAgICAgICAgICAnYXJuOmF3czppYW06OmF3czpwb2xpY3kvc2VydmljZS1yb2xlL0FXU0xhbWJkYUJhc2ljRXhlY3V0aW9uUm9sZScsXG4gICAgICB9LFxuICAgICAgeyBwYXJlbnQ6IHRoaXMgfVxuICAgICk7XG5cbiAgICAvLyBDcmVhdGUgTGFtYmRhIHBvbGljeSAoa2VwdCBmb3IgaW5mcmFzdHJ1Y3R1cmUgY29tcGxldGVuZXNzKVxuICAgIC8vIGVzbGludC1kaXNhYmxlLW5leHQtbGluZSBAdHlwZXNjcmlwdC1lc2xpbnQvbm8tdW51c2VkLXZhcnNcbiAgICBjb25zdCBfYXV0aExhbWJkYVBvbGljeSA9IG5ldyBhd3MuaWFtLlJvbGVQb2xpY3koXG4gICAgICBgYXV0aC1sYW1iZGEtcG9saWN5LSR7ZW52aXJvbm1lbnRTdWZmaXh9YCxcbiAgICAgIHtcbiAgICAgICAgcm9sZTogYXV0aExhbWJkYVJvbGUuaWQsXG4gICAgICAgIHBvbGljeTogcHVsdW1pLmFsbChbc3Vic2NyaWJlclRhYmxlLmFybl0pLmFwcGx5KChbdGFibGVBcm5dKSA9PlxuICAgICAgICAgIEpTT04uc3RyaW5naWZ5KHtcbiAgICAgICAgICAgIFZlcnNpb246ICcyMDEyLTEwLTE3JyxcbiAgICAgICAgICAgIFN0YXRlbWVudDogW1xuICAgICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgRWZmZWN0OiAnQWxsb3cnLFxuICAgICAgICAgICAgICAgIEFjdGlvbjogWydkeW5hbW9kYjpHZXRJdGVtJywgJ2R5bmFtb2RiOlF1ZXJ5J10sXG4gICAgICAgICAgICAgICAgUmVzb3VyY2U6IFt0YWJsZUFybiwgYCR7dGFibGVBcm59L2luZGV4LypgXSxcbiAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIF0sXG4gICAgICAgICAgfSlcbiAgICAgICAgKSxcbiAgICAgIH0sXG4gICAgICB7IHBhcmVudDogdGhpcyB9XG4gICAgKTtcblxuICAgIC8vIENyZWF0ZSB1cy1lYXN0LTEgcHJvdmlkZXIgZm9yIExhbWJkYUBFZGdlXG4gICAgY29uc3QgdXNFYXN0MVByb3ZpZGVyID0gbmV3IGF3cy5Qcm92aWRlcihcbiAgICAgIGB1cy1lYXN0LTEtcHJvdmlkZXItJHtlbnZpcm9ubWVudFN1ZmZpeH1gLFxuICAgICAge1xuICAgICAgICByZWdpb246ICd1cy1lYXN0LTEnLFxuICAgICAgfSxcbiAgICAgIHsgcGFyZW50OiB0aGlzIH1cbiAgICApO1xuXG4gICAgY29uc3QgYXV0aExhbWJkYSA9IG5ldyBhd3MubGFtYmRhLkZ1bmN0aW9uKFxuICAgICAgYGF1dGgtbGFtYmRhLWVkZ2UtJHtlbnZpcm9ubWVudFN1ZmZpeH1gLFxuICAgICAge1xuICAgICAgICBuYW1lOiBgdGFwLWF1dGgtZWRnZS0ke2Vudmlyb25tZW50U3VmZml4fWAsXG4gICAgICAgIGNvZGU6IG5ldyBwdWx1bWkuYXNzZXQuQXNzZXRBcmNoaXZlKHtcbiAgICAgICAgICAnaW5kZXguanMnOiBuZXcgcHVsdW1pLmFzc2V0LlN0cmluZ0Fzc2V0KGBcbmV4cG9ydHMuaGFuZGxlciA9IGFzeW5jIChldmVudCkgPT4ge1xuICAgIGNvbnN0IHJlcXVlc3QgPSBldmVudC5SZWNvcmRzWzBdLmNmLnJlcXVlc3Q7XG4gICAgY29uc3QgaGVhZGVycyA9IHJlcXVlc3QuaGVhZGVycztcblxuICAgIC8vIENoZWNrIGZvciBzaWduZWQgY29va2llXG4gICAgY29uc3QgY29va2llcyA9IGhlYWRlcnMuY29va2llIHx8IFtdO1xuICAgIGxldCBpc0F1dGhvcml6ZWQgPSBmYWxzZTtcblxuICAgIGZvciAoY29uc3QgY29va2llIG9mIGNvb2tpZXMpIHtcbiAgICAgICAgaWYgKGNvb2tpZS52YWx1ZSAmJiBjb29raWUudmFsdWUuaW5jbHVkZXMoJ0Nsb3VkRnJvbnQtUG9saWN5JykpIHtcbiAgICAgICAgICAgIGlzQXV0aG9yaXplZCA9IHRydWU7XG4gICAgICAgICAgICBicmVhaztcbiAgICAgICAgfVxuICAgIH1cblxuICAgIGlmICghaXNBdXRob3JpemVkKSB7XG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICBzdGF0dXM6ICc0MDMnLFxuICAgICAgICAgICAgc3RhdHVzRGVzY3JpcHRpb246ICdGb3JiaWRkZW4nLFxuICAgICAgICAgICAgYm9keTogJ0F1dGhvcml6YXRpb24gcmVxdWlyZWQnLFxuICAgICAgICB9O1xuICAgIH1cblxuICAgIHJldHVybiByZXF1ZXN0O1xufTtcbiAgICAgICAgICAgICAgICBgKSxcbiAgICAgICAgfSksXG4gICAgICAgIHJ1bnRpbWU6ICdub2RlanMxOC54JyxcbiAgICAgICAgaGFuZGxlcjogJ2luZGV4LmhhbmRsZXInLFxuICAgICAgICByb2xlOiBhdXRoTGFtYmRhUm9sZS5hcm4sXG4gICAgICAgIHRpbWVvdXQ6IDUsXG4gICAgICAgIHB1Ymxpc2g6IHRydWUsXG4gICAgICAgIHRhZ3M6IHtcbiAgICAgICAgICAuLi50YWdzLFxuICAgICAgICAgIEVudmlyb25tZW50U3VmZml4OiBlbnZpcm9ubWVudFN1ZmZpeCxcbiAgICAgICAgfSxcbiAgICAgIH0sXG4gICAgICB7IHBhcmVudDogdGhpcywgcHJvdmlkZXI6IHVzRWFzdDFQcm92aWRlciB9XG4gICAgKTtcblxuICAgIC8vIENsb3VkRnJvbnQgT3JpZ2luIEFjY2VzcyBDb250cm9sXG4gICAgY29uc3Qgb2FjID0gbmV3IGF3cy5jbG91ZGZyb250Lk9yaWdpbkFjY2Vzc0NvbnRyb2woXG4gICAgICBgcG9kY2FzdC1vYWMtJHtlbnZpcm9ubWVudFN1ZmZpeH1gLFxuICAgICAge1xuICAgICAgICBuYW1lOiBgdGFwLXBvZGNhc3Qtb2FjLSR7ZW52aXJvbm1lbnRTdWZmaXh9YCxcbiAgICAgICAgb3JpZ2luQWNjZXNzQ29udHJvbE9yaWdpblR5cGU6ICdzMycsXG4gICAgICAgIHNpZ25pbmdCZWhhdmlvcjogJ2Fsd2F5cycsXG4gICAgICAgIHNpZ25pbmdQcm90b2NvbDogJ3NpZ3Y0JyxcbiAgICAgICAgZGVzY3JpcHRpb246IGBPQUMgZm9yIHBvZGNhc3QgYXVkaW8gYnVja2V0ICR7ZW52aXJvbm1lbnRTdWZmaXh9YCxcbiAgICAgIH0sXG4gICAgICB7IHBhcmVudDogdGhpcyB9XG4gICAgKTtcblxuICAgIC8vIENsb3VkRnJvbnQgZGlzdHJpYnV0aW9uXG4gICAgY29uc3QgZGlzdHJpYnV0aW9uID0gbmV3IGF3cy5jbG91ZGZyb250LkRpc3RyaWJ1dGlvbihcbiAgICAgIGBwb2RjYXN0LWRpc3RyaWJ1dGlvbi0ke2Vudmlyb25tZW50U3VmZml4fWAsXG4gICAgICB7XG4gICAgICAgIGVuYWJsZWQ6IHRydWUsXG4gICAgICAgIGlzSXB2NkVuYWJsZWQ6IHRydWUsXG4gICAgICAgIGRlZmF1bHRSb290T2JqZWN0OiAnaW5kZXguaHRtbCcsXG4gICAgICAgIHByaWNlQ2xhc3M6ICdQcmljZUNsYXNzXzEwMCcsXG4gICAgICAgIGNvbW1lbnQ6IGBQb2RjYXN0IENETiBmb3IgJHtlbnZpcm9ubWVudFN1ZmZpeH1gLFxuXG4gICAgICAgIG9yaWdpbnM6IFtcbiAgICAgICAgICB7XG4gICAgICAgICAgICBkb21haW5OYW1lOiBhdWRpb0J1Y2tldC5idWNrZXRSZWdpb25hbERvbWFpbk5hbWUsXG4gICAgICAgICAgICBvcmlnaW5JZDogJ3MzLXBvZGNhc3QtYXVkaW8nLFxuICAgICAgICAgICAgb3JpZ2luQWNjZXNzQ29udHJvbElkOiBvYWMuaWQsXG4gICAgICAgICAgfSxcbiAgICAgICAgXSxcblxuICAgICAgICBkZWZhdWx0Q2FjaGVCZWhhdmlvcjoge1xuICAgICAgICAgIHRhcmdldE9yaWdpbklkOiAnczMtcG9kY2FzdC1hdWRpbycsXG4gICAgICAgICAgdmlld2VyUHJvdG9jb2xQb2xpY3k6ICdyZWRpcmVjdC10by1odHRwcycsXG4gICAgICAgICAgYWxsb3dlZE1ldGhvZHM6IFsnR0VUJywgJ0hFQUQnLCAnT1BUSU9OUyddLFxuICAgICAgICAgIGNhY2hlZE1ldGhvZHM6IFsnR0VUJywgJ0hFQUQnXSxcbiAgICAgICAgICB0cnVzdGVkU2lnbmVyczogWydzZWxmJ10sXG5cbiAgICAgICAgICBmb3J3YXJkZWRWYWx1ZXM6IHtcbiAgICAgICAgICAgIHF1ZXJ5U3RyaW5nOiBmYWxzZSxcbiAgICAgICAgICAgIGNvb2tpZXM6IHtcbiAgICAgICAgICAgICAgZm9yd2FyZDogJ2FsbCcsXG4gICAgICAgICAgICB9LFxuICAgICAgICAgIH0sXG5cbiAgICAgICAgICBsYW1iZGFGdW5jdGlvbkFzc29jaWF0aW9uczogW1xuICAgICAgICAgICAge1xuICAgICAgICAgICAgICBldmVudFR5cGU6ICd2aWV3ZXItcmVxdWVzdCcsXG4gICAgICAgICAgICAgIGxhbWJkYUFybjogYXV0aExhbWJkYS5xdWFsaWZpZWRBcm4sXG4gICAgICAgICAgICB9LFxuICAgICAgICAgIF0sXG5cbiAgICAgICAgICBtaW5UdGw6IDAsXG4gICAgICAgICAgZGVmYXVsdFR0bDogODY0MDAsXG4gICAgICAgICAgbWF4VHRsOiAzMTUzNjAwMCxcbiAgICAgICAgfSxcblxuICAgICAgICByZXN0cmljdGlvbnM6IHtcbiAgICAgICAgICBnZW9SZXN0cmljdGlvbjoge1xuICAgICAgICAgICAgcmVzdHJpY3Rpb25UeXBlOiAnbm9uZScsXG4gICAgICAgICAgfSxcbiAgICAgICAgfSxcblxuICAgICAgICB2aWV3ZXJDZXJ0aWZpY2F0ZToge1xuICAgICAgICAgIGNsb3VkZnJvbnREZWZhdWx0Q2VydGlmaWNhdGU6IHRydWUsXG4gICAgICAgIH0sXG5cbiAgICAgICAgdGFnczoge1xuICAgICAgICAgIC4uLnRhZ3MsXG4gICAgICAgICAgTmFtZTogYHBvZGNhc3QtY2RuLSR7ZW52aXJvbm1lbnRTdWZmaXh9YCxcbiAgICAgICAgICBFbnZpcm9ubWVudFN1ZmZpeDogZW52aXJvbm1lbnRTdWZmaXgsXG4gICAgICAgIH0sXG4gICAgICB9LFxuICAgICAgeyBwYXJlbnQ6IHRoaXMgfVxuICAgICk7XG5cbiAgICAvLyBSb3V0ZSA1MyBob3N0ZWQgem9uZVxuICAgIGNvbnN0IGhvc3RlZFpvbmUgPSBuZXcgYXdzLnJvdXRlNTMuWm9uZShcbiAgICAgIGBwb2RjYXN0LXpvbmUtJHtlbnZpcm9ubWVudFN1ZmZpeH1gLFxuICAgICAge1xuICAgICAgICBuYW1lOiBgdGFwLXBvZGNhc3QtJHtlbnZpcm9ubWVudFN1ZmZpeH0uY29tYCxcbiAgICAgICAgY29tbWVudDogYEROUyB6b25lIGZvciAke2Vudmlyb25tZW50U3VmZml4fWAsXG4gICAgICAgIHRhZ3M6IHtcbiAgICAgICAgICAuLi50YWdzLFxuICAgICAgICAgIE5hbWU6IGBwb2RjYXN0LWRucy0ke2Vudmlyb25tZW50U3VmZml4fWAsXG4gICAgICAgICAgRW52aXJvbm1lbnRTdWZmaXg6IGVudmlyb25tZW50U3VmZml4LFxuICAgICAgICB9LFxuICAgICAgfSxcbiAgICAgIHsgcGFyZW50OiB0aGlzIH1cbiAgICApO1xuXG4gICAgLy8gTWVkaWFDb252ZXJ0IHJvbGVcbiAgICBjb25zdCBtZWRpYUNvbnZlcnRSb2xlID0gbmV3IGF3cy5pYW0uUm9sZShcbiAgICAgIGBtZWRpYWNvbnZlcnQtcm9sZS0ke2Vudmlyb25tZW50U3VmZml4fWAsXG4gICAgICB7XG4gICAgICAgIG5hbWU6IGB0YXAtbWVkaWFjb252ZXJ0LXJvbGUtJHtlbnZpcm9ubWVudFN1ZmZpeH1gLFxuICAgICAgICBhc3N1bWVSb2xlUG9saWN5OiBKU09OLnN0cmluZ2lmeSh7XG4gICAgICAgICAgVmVyc2lvbjogJzIwMTItMTAtMTcnLFxuICAgICAgICAgIFN0YXRlbWVudDogW1xuICAgICAgICAgICAge1xuICAgICAgICAgICAgICBBY3Rpb246ICdzdHM6QXNzdW1lUm9sZScsXG4gICAgICAgICAgICAgIEVmZmVjdDogJ0FsbG93JyxcbiAgICAgICAgICAgICAgUHJpbmNpcGFsOiB7XG4gICAgICAgICAgICAgICAgU2VydmljZTogJ21lZGlhY29udmVydC5hbWF6b25hd3MuY29tJyxcbiAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgXSxcbiAgICAgICAgfSksXG4gICAgICAgIHRhZ3M6IHtcbiAgICAgICAgICAuLi50YWdzLFxuICAgICAgICAgIEVudmlyb25tZW50U3VmZml4OiBlbnZpcm9ubWVudFN1ZmZpeCxcbiAgICAgICAgfSxcbiAgICAgIH0sXG4gICAgICB7IHBhcmVudDogdGhpcyB9XG4gICAgKTtcblxuICAgIC8vIENyZWF0ZSBNZWRpYUNvbnZlcnQgcG9saWN5IChrZXB0IGZvciBpbmZyYXN0cnVjdHVyZSBjb21wbGV0ZW5lc3MpXG4gICAgLy8gZXNsaW50LWRpc2FibGUtbmV4dC1saW5lIEB0eXBlc2NyaXB0LWVzbGludC9uby11bnVzZWQtdmFyc1xuICAgIGNvbnN0IF9tZWRpYUNvbnZlcnRQb2xpY3kgPSBuZXcgYXdzLmlhbS5Sb2xlUG9saWN5KFxuICAgICAgYG1lZGlhY29udmVydC1wb2xpY3ktJHtlbnZpcm9ubWVudFN1ZmZpeH1gLFxuICAgICAge1xuICAgICAgICByb2xlOiBtZWRpYUNvbnZlcnRSb2xlLmlkLFxuICAgICAgICBwb2xpY3k6IHB1bHVtaS5hbGwoW2F1ZGlvQnVja2V0LmFybl0pLmFwcGx5KChbYnVja2V0QXJuXSkgPT5cbiAgICAgICAgICBKU09OLnN0cmluZ2lmeSh7XG4gICAgICAgICAgICBWZXJzaW9uOiAnMjAxMi0xMC0xNycsXG4gICAgICAgICAgICBTdGF0ZW1lbnQ6IFtcbiAgICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgIEVmZmVjdDogJ0FsbG93JyxcbiAgICAgICAgICAgICAgICBBY3Rpb246IFsnczM6R2V0T2JqZWN0JywgJ3MzOlB1dE9iamVjdCddLFxuICAgICAgICAgICAgICAgIFJlc291cmNlOiBgJHtidWNrZXRBcm59LypgLFxuICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgRWZmZWN0OiAnQWxsb3cnLFxuICAgICAgICAgICAgICAgIEFjdGlvbjogJ3MzOkxpc3RCdWNrZXQnLFxuICAgICAgICAgICAgICAgIFJlc291cmNlOiBidWNrZXRBcm4sXG4gICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBdLFxuICAgICAgICAgIH0pXG4gICAgICAgICksXG4gICAgICB9LFxuICAgICAgeyBwYXJlbnQ6IHRoaXMgfVxuICAgICk7XG5cbiAgICAvLyBFdmVudEJyaWRnZSBydWxlIGZvciBzY2hlZHVsZWQgdGFza3NcbiAgICBjb25zdCBzY2hlZHVsZXJSb2xlID0gbmV3IGF3cy5pYW0uUm9sZShcbiAgICAgIGBzY2hlZHVsZXItcm9sZS0ke2Vudmlyb25tZW50U3VmZml4fWAsXG4gICAgICB7XG4gICAgICAgIG5hbWU6IGB0YXAtc2NoZWR1bGVyLXJvbGUtJHtlbnZpcm9ubWVudFN1ZmZpeH1gLFxuICAgICAgICBhc3N1bWVSb2xlUG9saWN5OiBKU09OLnN0cmluZ2lmeSh7XG4gICAgICAgICAgVmVyc2lvbjogJzIwMTItMTAtMTcnLFxuICAgICAgICAgIFN0YXRlbWVudDogW1xuICAgICAgICAgICAge1xuICAgICAgICAgICAgICBBY3Rpb246ICdzdHM6QXNzdW1lUm9sZScsXG4gICAgICAgICAgICAgIEVmZmVjdDogJ0FsbG93JyxcbiAgICAgICAgICAgICAgUHJpbmNpcGFsOiB7XG4gICAgICAgICAgICAgICAgU2VydmljZTogJ3NjaGVkdWxlci5hbWF6b25hd3MuY29tJyxcbiAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgXSxcbiAgICAgICAgfSksXG4gICAgICAgIHRhZ3M6IHtcbiAgICAgICAgICAuLi50YWdzLFxuICAgICAgICAgIEVudmlyb25tZW50U3VmZml4OiBlbnZpcm9ubWVudFN1ZmZpeCxcbiAgICAgICAgfSxcbiAgICAgIH0sXG4gICAgICB7IHBhcmVudDogdGhpcyB9XG4gICAgKTtcblxuICAgIC8vIFByb2Nlc3NpbmcgTGFtYmRhXG4gICAgY29uc3QgcHJvY2Vzc2luZ0xhbWJkYVJvbGUgPSBuZXcgYXdzLmlhbS5Sb2xlKFxuICAgICAgYHByb2Nlc3NpbmctbGFtYmRhLXJvbGUtJHtlbnZpcm9ubWVudFN1ZmZpeH1gLFxuICAgICAge1xuICAgICAgICBuYW1lOiBgdGFwLXByb2Nlc3NpbmctbGFtYmRhLXJvbGUtJHtlbnZpcm9ubWVudFN1ZmZpeH1gLFxuICAgICAgICBhc3N1bWVSb2xlUG9saWN5OiBKU09OLnN0cmluZ2lmeSh7XG4gICAgICAgICAgVmVyc2lvbjogJzIwMTItMTAtMTcnLFxuICAgICAgICAgIFN0YXRlbWVudDogW1xuICAgICAgICAgICAge1xuICAgICAgICAgICAgICBBY3Rpb246ICdzdHM6QXNzdW1lUm9sZScsXG4gICAgICAgICAgICAgIEVmZmVjdDogJ0FsbG93JyxcbiAgICAgICAgICAgICAgUHJpbmNpcGFsOiB7XG4gICAgICAgICAgICAgICAgU2VydmljZTogJ2xhbWJkYS5hbWF6b25hd3MuY29tJyxcbiAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgXSxcbiAgICAgICAgfSksXG4gICAgICAgIHRhZ3M6IHtcbiAgICAgICAgICAuLi50YWdzLFxuICAgICAgICAgIEVudmlyb25tZW50U3VmZml4OiBlbnZpcm9ubWVudFN1ZmZpeCxcbiAgICAgICAgfSxcbiAgICAgIH0sXG4gICAgICB7IHBhcmVudDogdGhpcyB9XG4gICAgKTtcblxuICAgIG5ldyBhd3MuaWFtLlJvbGVQb2xpY3lBdHRhY2htZW50KFxuICAgICAgYHByb2Nlc3NpbmctbGFtYmRhLWJhc2ljLSR7ZW52aXJvbm1lbnRTdWZmaXh9YCxcbiAgICAgIHtcbiAgICAgICAgcm9sZTogcHJvY2Vzc2luZ0xhbWJkYVJvbGUubmFtZSxcbiAgICAgICAgcG9saWN5QXJuOlxuICAgICAgICAgICdhcm46YXdzOmlhbTo6YXdzOnBvbGljeS9zZXJ2aWNlLXJvbGUvQVdTTGFtYmRhQmFzaWNFeGVjdXRpb25Sb2xlJyxcbiAgICAgIH0sXG4gICAgICB7IHBhcmVudDogdGhpcyB9XG4gICAgKTtcblxuICAgIC8vIENyZWF0ZSBwcm9jZXNzaW5nIExhbWJkYSBwb2xpY3kgKGtlcHQgZm9yIGluZnJhc3RydWN0dXJlIGNvbXBsZXRlbmVzcylcbiAgICAvLyBlc2xpbnQtZGlzYWJsZS1uZXh0LWxpbmUgQHR5cGVzY3JpcHQtZXNsaW50L25vLXVudXNlZC12YXJzXG4gICAgY29uc3QgX3Byb2Nlc3NpbmdMYW1iZGFQb2xpY3kgPSBuZXcgYXdzLmlhbS5Sb2xlUG9saWN5KFxuICAgICAgYHByb2Nlc3NpbmctbGFtYmRhLXBvbGljeS0ke2Vudmlyb25tZW50U3VmZml4fWAsXG4gICAgICB7XG4gICAgICAgIHJvbGU6IHByb2Nlc3NpbmdMYW1iZGFSb2xlLmlkLFxuICAgICAgICBwb2xpY3k6IEpTT04uc3RyaW5naWZ5KHtcbiAgICAgICAgICBWZXJzaW9uOiAnMjAxMi0xMC0xNycsXG4gICAgICAgICAgU3RhdGVtZW50OiBbXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgIEVmZmVjdDogJ0FsbG93JyxcbiAgICAgICAgICAgICAgQWN0aW9uOiBbXG4gICAgICAgICAgICAgICAgJ21lZGlhY29udmVydDpDcmVhdGVKb2InLFxuICAgICAgICAgICAgICAgICdtZWRpYWNvbnZlcnQ6R2V0Sm9iJyxcbiAgICAgICAgICAgICAgICAnbWVkaWFjb252ZXJ0Okxpc3RKb2JzJyxcbiAgICAgICAgICAgICAgICAnaWFtOlBhc3NSb2xlJyxcbiAgICAgICAgICAgICAgXSxcbiAgICAgICAgICAgICAgUmVzb3VyY2U6ICcqJyxcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgXSxcbiAgICAgICAgfSksXG4gICAgICB9LFxuICAgICAgeyBwYXJlbnQ6IHRoaXMgfVxuICAgICk7XG5cbiAgICBjb25zdCBwcm9jZXNzaW5nTGFtYmRhID0gbmV3IGF3cy5sYW1iZGEuRnVuY3Rpb24oXG4gICAgICBgcHJvY2Vzc2luZy1sYW1iZGEtJHtlbnZpcm9ubWVudFN1ZmZpeH1gLFxuICAgICAge1xuICAgICAgICBuYW1lOiBgdGFwLXByb2Nlc3NpbmctJHtlbnZpcm9ubWVudFN1ZmZpeH1gLFxuICAgICAgICBjb2RlOiBuZXcgcHVsdW1pLmFzc2V0LkFzc2V0QXJjaGl2ZSh7XG4gICAgICAgICAgJ2luZGV4LmpzJzogbmV3IHB1bHVtaS5hc3NldC5TdHJpbmdBc3NldChgXG5jb25zdCBBV1MgPSByZXF1aXJlKCdhd3Mtc2RrJyk7XG5jb25zdCBtZWRpYUNvbnZlcnQgPSBuZXcgQVdTLk1lZGlhQ29udmVydCh7IHJlZ2lvbjogJ3VzLXdlc3QtMicgfSk7XG5cbmV4cG9ydHMuaGFuZGxlciA9IGFzeW5jIChldmVudCkgPT4ge1xuICAgIGNvbnNvbGUubG9nKCdQcm9jZXNzaW5nIHNjaGVkdWxlZCB0YXNrOicsIEpTT04uc3RyaW5naWZ5KGV2ZW50KSk7XG5cbiAgICAvLyBQbGFjZWhvbGRlciBmb3IgTWVkaWFDb252ZXJ0IGpvYiBjcmVhdGlvblxuICAgIC8vIFRoaXMgd291bGQgYmUgZXhwYW5kZWQgd2l0aCBhY3R1YWwgdHJhbnNjb2RpbmcgbG9naWNcblxuICAgIHJldHVybiB7XG4gICAgICAgIHN0YXR1c0NvZGU6IDIwMCxcbiAgICAgICAgYm9keTogSlNPTi5zdHJpbmdpZnkoeyBtZXNzYWdlOiAnUHJvY2Vzc2luZyBjb21wbGV0ZWQnIH0pLFxuICAgIH07XG59O1xuICAgICAgICAgICAgICAgIGApLFxuICAgICAgICB9KSxcbiAgICAgICAgcnVudGltZTogJ25vZGVqczE4LngnLFxuICAgICAgICBoYW5kbGVyOiAnaW5kZXguaGFuZGxlcicsXG4gICAgICAgIHJvbGU6IHByb2Nlc3NpbmdMYW1iZGFSb2xlLmFybixcbiAgICAgICAgdGltZW91dDogNjAsXG4gICAgICAgIGVudmlyb25tZW50OiB7XG4gICAgICAgICAgdmFyaWFibGVzOiB7XG4gICAgICAgICAgICBNRURJQUNPTlZFUlRfUk9MRTogbWVkaWFDb252ZXJ0Um9sZS5hcm4sXG4gICAgICAgICAgICBBVURJT19CVUNLRVQ6IGF1ZGlvQnVja2V0LmlkLFxuICAgICAgICAgIH0sXG4gICAgICAgIH0sXG4gICAgICAgIHRhZ3M6IHtcbiAgICAgICAgICAuLi50YWdzLFxuICAgICAgICAgIEVudmlyb25tZW50U3VmZml4OiBlbnZpcm9ubWVudFN1ZmZpeCxcbiAgICAgICAgfSxcbiAgICAgIH0sXG4gICAgICB7IHBhcmVudDogdGhpcyB9XG4gICAgKTtcblxuICAgIC8vIENyZWF0ZSBzY2hlZHVsZXIgcG9saWN5IChrZXB0IGZvciBpbmZyYXN0cnVjdHVyZSBjb21wbGV0ZW5lc3MpXG4gICAgLy8gZXNsaW50LWRpc2FibGUtbmV4dC1saW5lIEB0eXBlc2NyaXB0LWVzbGludC9uby11bnVzZWQtdmFyc1xuICAgIGNvbnN0IF9zY2hlZHVsZXJQb2xpY3kgPSBuZXcgYXdzLmlhbS5Sb2xlUG9saWN5KFxuICAgICAgYHNjaGVkdWxlci1wb2xpY3ktJHtlbnZpcm9ubWVudFN1ZmZpeH1gLFxuICAgICAge1xuICAgICAgICByb2xlOiBzY2hlZHVsZXJSb2xlLmlkLFxuICAgICAgICBwb2xpY3k6IHB1bHVtaS5hbGwoW3Byb2Nlc3NpbmdMYW1iZGEuYXJuXSkuYXBwbHkoKFtsYW1iZGFBcm5dKSA9PlxuICAgICAgICAgIEpTT04uc3RyaW5naWZ5KHtcbiAgICAgICAgICAgIFZlcnNpb246ICcyMDEyLTEwLTE3JyxcbiAgICAgICAgICAgIFN0YXRlbWVudDogW1xuICAgICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgRWZmZWN0OiAnQWxsb3cnLFxuICAgICAgICAgICAgICAgIEFjdGlvbjogJ2xhbWJkYTpJbnZva2VGdW5jdGlvbicsXG4gICAgICAgICAgICAgICAgUmVzb3VyY2U6IGxhbWJkYUFybixcbiAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIF0sXG4gICAgICAgICAgfSlcbiAgICAgICAgKSxcbiAgICAgIH0sXG4gICAgICB7IHBhcmVudDogdGhpcyB9XG4gICAgKTtcblxuICAgIGNvbnN0IHNjaGVkdWxlR3JvdXAgPSBuZXcgYXdzLnNjaGVkdWxlci5TY2hlZHVsZUdyb3VwKFxuICAgICAgYHBvZGNhc3Qtc2NoZWR1bGVzLSR7ZW52aXJvbm1lbnRTdWZmaXh9YCxcbiAgICAgIHtcbiAgICAgICAgbmFtZTogYHRhcC1wb2RjYXN0LXNjaGVkdWxlcy0ke2Vudmlyb25tZW50U3VmZml4fWAsXG4gICAgICAgIHRhZ3M6IHtcbiAgICAgICAgICAuLi50YWdzLFxuICAgICAgICAgIEVudmlyb25tZW50U3VmZml4OiBlbnZpcm9ubWVudFN1ZmZpeCxcbiAgICAgICAgfSxcbiAgICAgIH0sXG4gICAgICB7IHBhcmVudDogdGhpcyB9XG4gICAgKTtcblxuICAgIC8vIENyZWF0ZSBjb250ZW50IHByb2Nlc3Npbmcgc2NoZWR1bGUgKGtlcHQgZm9yIGluZnJhc3RydWN0dXJlIGNvbXBsZXRlbmVzcylcbiAgICAvLyBlc2xpbnQtZGlzYWJsZS1uZXh0LWxpbmUgQHR5cGVzY3JpcHQtZXNsaW50L25vLXVudXNlZC12YXJzXG4gICAgY29uc3QgX2NvbnRlbnRQcm9jZXNzaW5nU2NoZWR1bGUgPSBuZXcgYXdzLnNjaGVkdWxlci5TY2hlZHVsZShcbiAgICAgIGBjb250ZW50LXByb2Nlc3NpbmctJHtlbnZpcm9ubWVudFN1ZmZpeH1gLFxuICAgICAge1xuICAgICAgICBuYW1lOiBgdGFwLWNvbnRlbnQtcHJvY2Vzc2luZy0ke2Vudmlyb25tZW50U3VmZml4fWAsXG4gICAgICAgIGdyb3VwTmFtZTogc2NoZWR1bGVHcm91cC5uYW1lLFxuICAgICAgICBmbGV4aWJsZVRpbWVXaW5kb3c6IHtcbiAgICAgICAgICBtb2RlOiAnT0ZGJyxcbiAgICAgICAgfSxcbiAgICAgICAgc2NoZWR1bGVFeHByZXNzaW9uOiAncmF0ZSgxIGhvdXIpJyxcbiAgICAgICAgdGFyZ2V0OiB7XG4gICAgICAgICAgYXJuOiBwcm9jZXNzaW5nTGFtYmRhLmFybixcbiAgICAgICAgICByb2xlQXJuOiBzY2hlZHVsZXJSb2xlLmFybixcbiAgICAgICAgICBpbnB1dDogSlNPTi5zdHJpbmdpZnkoe1xuICAgICAgICAgICAgdGFzazogJ3Byb2Nlc3NfbmV3X2NvbnRlbnQnLFxuICAgICAgICAgIH0pLFxuICAgICAgICB9LFxuICAgICAgfSxcbiAgICAgIHsgcGFyZW50OiB0aGlzIH1cbiAgICApO1xuXG4gICAgLy8gQ2xvdWRXYXRjaCBEYXNoYm9hcmQgKGtlcHQgZm9yIGluZnJhc3RydWN0dXJlIGNvbXBsZXRlbmVzcylcbiAgICAvLyBlc2xpbnQtZGlzYWJsZS1uZXh0LWxpbmUgQHR5cGVzY3JpcHQtZXNsaW50L25vLXVudXNlZC12YXJzXG4gICAgY29uc3QgX2Rhc2hib2FyZCA9IG5ldyBhd3MuY2xvdWR3YXRjaC5EYXNoYm9hcmQoXG4gICAgICBgcG9kY2FzdC1kYXNoYm9hcmQtJHtlbnZpcm9ubWVudFN1ZmZpeH1gLFxuICAgICAge1xuICAgICAgICBkYXNoYm9hcmROYW1lOiBgdGFwLXBvZGNhc3QtbWV0cmljcy0ke2Vudmlyb25tZW50U3VmZml4fWAsXG4gICAgICAgIGRhc2hib2FyZEJvZHk6IEpTT04uc3RyaW5naWZ5KHtcbiAgICAgICAgICB3aWRnZXRzOiBbXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgIHR5cGU6ICdtZXRyaWMnLFxuICAgICAgICAgICAgICBwcm9wZXJ0aWVzOiB7XG4gICAgICAgICAgICAgICAgbWV0cmljczogW1xuICAgICAgICAgICAgICAgICAgWydBV1MvQ2xvdWRGcm9udCcsICdCeXRlc0Rvd25sb2FkZWQnLCB7IHN0YXQ6ICdTdW0nIH1dLFxuICAgICAgICAgICAgICAgICAgWydBV1MvQ2xvdWRGcm9udCcsICdSZXF1ZXN0cycsIHsgc3RhdDogJ1N1bScgfV0sXG4gICAgICAgICAgICAgICAgXSxcbiAgICAgICAgICAgICAgICBwZXJpb2Q6IDMwMCxcbiAgICAgICAgICAgICAgICBzdGF0OiAnQXZlcmFnZScsXG4gICAgICAgICAgICAgICAgcmVnaW9uOiAndXMtZWFzdC0xJyxcbiAgICAgICAgICAgICAgICB0aXRsZTogJ0NETiBUcmFmZmljJyxcbiAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgIHR5cGU6ICdtZXRyaWMnLFxuICAgICAgICAgICAgICBwcm9wZXJ0aWVzOiB7XG4gICAgICAgICAgICAgICAgbWV0cmljczogW1xuICAgICAgICAgICAgICAgICAgWydBV1MvRHluYW1vREInLCAnQ29uc3VtZWRSZWFkQ2FwYWNpdHlVbml0cyddLFxuICAgICAgICAgICAgICAgICAgWydBV1MvRHluYW1vREInLCAnQ29uc3VtZWRXcml0ZUNhcGFjaXR5VW5pdHMnXSxcbiAgICAgICAgICAgICAgICBdLFxuICAgICAgICAgICAgICAgIHBlcmlvZDogMzAwLFxuICAgICAgICAgICAgICAgIHN0YXQ6ICdTdW0nLFxuICAgICAgICAgICAgICAgIHJlZ2lvbjogJ3VzLXdlc3QtMicsXG4gICAgICAgICAgICAgICAgdGl0bGU6ICdTdWJzY3JpYmVyIFRhYmxlIEFjdGl2aXR5JyxcbiAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgXSxcbiAgICAgICAgfSksXG4gICAgICB9LFxuICAgICAgeyBwYXJlbnQ6IHRoaXMgfVxuICAgICk7XG5cbiAgICAvLyBDbG91ZFdhdGNoIEFsYXJtcyAoa2VwdCBmb3IgaW5mcmFzdHJ1Y3R1cmUgY29tcGxldGVuZXNzKVxuICAgIC8vIGVzbGludC1kaXNhYmxlLW5leHQtbGluZSBAdHlwZXNjcmlwdC1lc2xpbnQvbm8tdW51c2VkLXZhcnNcbiAgICBjb25zdCBfaGlnaFRyYWZmaWNBbGFybSA9IG5ldyBhd3MuY2xvdWR3YXRjaC5NZXRyaWNBbGFybShcbiAgICAgIGBoaWdoLXRyYWZmaWMtYWxhcm0tJHtlbnZpcm9ubWVudFN1ZmZpeH1gLFxuICAgICAge1xuICAgICAgICBuYW1lOiBgdGFwLWhpZ2gtdHJhZmZpYy0ke2Vudmlyb25tZW50U3VmZml4fWAsXG4gICAgICAgIGNvbXBhcmlzb25PcGVyYXRvcjogJ0dyZWF0ZXJUaGFuVGhyZXNob2xkJyxcbiAgICAgICAgZXZhbHVhdGlvblBlcmlvZHM6IDIsXG4gICAgICAgIG1ldHJpY05hbWU6ICdSZXF1ZXN0cycsXG4gICAgICAgIG5hbWVzcGFjZTogJ0FXUy9DbG91ZEZyb250JyxcbiAgICAgICAgcGVyaW9kOiAzMDAsXG4gICAgICAgIHN0YXRpc3RpYzogJ1N1bScsXG4gICAgICAgIHRocmVzaG9sZDogMTAwMDAsXG4gICAgICAgIGFsYXJtRGVzY3JpcHRpb246IGBBbGVydCB3aGVuIHRyYWZmaWMgZXhjZWVkcyB0aHJlc2hvbGQgZm9yICR7ZW52aXJvbm1lbnRTdWZmaXh9YCxcbiAgICAgICAgdGFnczoge1xuICAgICAgICAgIC4uLnRhZ3MsXG4gICAgICAgICAgRW52aXJvbm1lbnRTdWZmaXg6IGVudmlyb25tZW50U3VmZml4LFxuICAgICAgICB9LFxuICAgICAgfSxcbiAgICAgIHsgcGFyZW50OiB0aGlzIH1cbiAgICApO1xuXG4gICAgdGhpcy5idWNrZXROYW1lID0gYXVkaW9CdWNrZXQuaWQ7XG4gICAgdGhpcy5kaXN0cmlidXRpb25Eb21haW5OYW1lID0gZGlzdHJpYnV0aW9uLmRvbWFpbk5hbWU7XG4gICAgdGhpcy5ob3N0ZWRab25lSWQgPSBob3N0ZWRab25lLnpvbmVJZDtcbiAgICB0aGlzLnN1YnNjcmliZXJUYWJsZU5hbWUgPSBzdWJzY3JpYmVyVGFibGUubmFtZTtcbiAgICB0aGlzLm1lZGlhQ29udmVydFJvbGVBcm4gPSBtZWRpYUNvbnZlcnRSb2xlLmFybjtcblxuICAgIHRoaXMucmVnaXN0ZXJPdXRwdXRzKHtcbiAgICAgIGJ1Y2tldE5hbWU6IHRoaXMuYnVja2V0TmFtZSxcbiAgICAgIGRpc3RyaWJ1dGlvbkRvbWFpbk5hbWU6IHRoaXMuZGlzdHJpYnV0aW9uRG9tYWluTmFtZSxcbiAgICAgIGhvc3RlZFpvbmVJZDogdGhpcy5ob3N0ZWRab25lSWQsXG4gICAgICBzdWJzY3JpYmVyVGFibGVOYW1lOiB0aGlzLnN1YnNjcmliZXJUYWJsZU5hbWUsXG4gICAgICBtZWRpYUNvbnZlcnRSb2xlQXJuOiB0aGlzLm1lZGlhQ29udmVydFJvbGVBcm4sXG4gICAgfSk7XG4gIH1cbn1cbiJdfQ==