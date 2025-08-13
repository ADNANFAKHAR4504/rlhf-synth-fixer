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
exports.EnhancedSecureS3Bucket = void 0;
const aws = __importStar(require("@pulumi/aws"));
const pulumi = __importStar(require("@pulumi/pulumi"));
const tags_1 = require("../../config/tags");
class EnhancedSecureS3Bucket extends pulumi.ComponentResource {
    bucket;
    bucketPolicy;
    publicAccessBlock;
    accessLogsBucket;
    notification;
    constructor(name, args, opts) {
        super('custom:security:EnhancedSecureS3Bucket', name, {}, opts);
        // Create access logs bucket if logging is enabled
        if (args.enableAccessLogging) {
            this.accessLogsBucket = new aws.s3.Bucket(`${name}-access-logs`, {
                bucket: `${args.bucketName}-access-logs`,
                forceDestroy: false,
                tags: { ...tags_1.commonTags, ...args.tags, Purpose: 'Access Logs' },
            }, { parent: this });
            // Block public access for logs bucket
            new aws.s3.BucketPublicAccessBlock(`${name}-logs-public-access-block`, {
                bucket: this.accessLogsBucket.id,
                blockPublicAcls: true,
                blockPublicPolicy: true,
                ignorePublicAcls: true,
                restrictPublicBuckets: true,
            }, { parent: this });
        }
        // Create main S3 bucket with enhanced security
        this.bucket = new aws.s3.Bucket(`${name}-bucket`, {
            bucket: args.bucketName,
            forceDestroy: false,
            objectLockEnabled: args.enableObjectLock,
            tags: { ...tags_1.commonTags, ...args.tags },
        }, { parent: this });
        // Enable versioning with MFA delete protection
        new aws.s3.BucketVersioning(`${name}-versioning`, {
            bucket: this.bucket.id,
            versioningConfiguration: {
                status: 'Enabled',
                mfaDelete: 'Enabled', // Require MFA for permanent deletion
            },
        }, { parent: this });
        // Configure server-side encryption with additional security
        new aws.s3.BucketServerSideEncryptionConfiguration(`${name}-encryption`, {
            bucket: this.bucket.id,
            rules: [
                {
                    applyServerSideEncryptionByDefault: {
                        sseAlgorithm: 'aws:kms',
                        kmsMasterKeyId: args.kmsKeyId,
                    },
                    bucketKeyEnabled: true,
                },
            ],
        }, { parent: this });
        // Block all public access
        this.publicAccessBlock = new aws.s3.BucketPublicAccessBlock(`${name}-public-access-block`, {
            bucket: this.bucket.id,
            blockPublicAcls: true,
            blockPublicPolicy: true,
            ignorePublicAcls: true,
            restrictPublicBuckets: true,
        }, { parent: this });
        // Enhanced secure bucket policy with IP restrictions
        const bucketPolicyDocument = pulumi
            .all([this.bucket.arn])
            .apply(([bucketArn]) => ({
            Version: '2012-10-17',
            Statement: [
                {
                    Sid: 'DenyInsecureConnections',
                    Effect: 'Deny',
                    Principal: '*',
                    Action: 's3:*',
                    Resource: [bucketArn, `${bucketArn}/*`],
                    Condition: {
                        Bool: {
                            'aws:SecureTransport': 'false',
                        },
                    },
                },
                {
                    Sid: 'DenyUnencryptedObjectUploads',
                    Effect: 'Deny',
                    Principal: '*',
                    Action: 's3:PutObject',
                    Resource: `${bucketArn}/*`,
                    Condition: {
                        StringNotEquals: {
                            's3:x-amz-server-side-encryption': 'aws:kms',
                        },
                    },
                },
                {
                    Sid: 'DenyIncorrectEncryptionHeader',
                    Effect: 'Deny',
                    Principal: '*',
                    Action: 's3:PutObject',
                    Resource: `${bucketArn}/*`,
                    Condition: {
                        StringNotEquals: {
                            's3:x-amz-server-side-encryption-aws-kms-key-id': args.kmsKeyId,
                        },
                    },
                },
                {
                    Sid: 'RestrictToAllowedIPs',
                    Effect: 'Deny',
                    Principal: '*',
                    Action: 's3:*',
                    Resource: [bucketArn, `${bucketArn}/*`],
                    Condition: args.allowedIpRanges
                        ? {
                            NotIpAddress: {
                                'aws:SourceIp': args.allowedIpRanges,
                            },
                        }
                        : undefined,
                },
                {
                    Sid: 'DenyDeleteWithoutMFA',
                    Effect: 'Deny',
                    Principal: '*',
                    Action: [
                        's3:DeleteObject',
                        's3:DeleteObjectVersion',
                        's3:DeleteBucket',
                    ],
                    Resource: [bucketArn, `${bucketArn}/*`],
                    Condition: {
                        BoolIfExists: {
                            'aws:MultiFactorAuthPresent': 'false',
                        },
                    },
                },
            ].filter(statement => statement.Condition !== undefined),
        }));
        this.bucketPolicy = new aws.s3.BucketPolicy(`${name}-policy`, {
            bucket: this.bucket.id,
            policy: bucketPolicyDocument.apply(policy => JSON.stringify(policy)),
        }, { parent: this, dependsOn: [this.publicAccessBlock] });
        // Configure enhanced lifecycle rules
        if (args.lifecycleRules) {
            new aws.s3.BucketLifecycleConfiguration(`${name}-lifecycle`, {
                bucket: this.bucket.id,
                rules: [
                    ...args.lifecycleRules,
                    // Add default rule for incomplete multipart uploads
                    {
                        id: 'cleanup-incomplete-uploads',
                        status: 'Enabled',
                        abortIncompleteMultipartUpload: {
                            daysAfterInitiation: 7,
                        },
                    },
                    // Add rule for old versions cleanup
                    {
                        id: 'cleanup-old-versions',
                        status: 'Enabled',
                        noncurrentVersionExpiration: {
                            noncurrentDays: 90,
                        },
                    },
                ],
            }, { parent: this });
        }
        // Enable access logging if requested
        if (args.enableAccessLogging && this.accessLogsBucket) {
            new aws.s3.BucketLogging(`${name}-logging`, {
                bucket: this.bucket.id,
                targetBucket: this.accessLogsBucket.id,
                targetPrefix: 'access-logs/',
                targetGrants: [
                    {
                        grantee: {
                            type: 'Group',
                            uri: 'http://acs.amazonaws.com/groups/s3/LogDelivery',
                        },
                        permission: 'WRITE',
                    },
                ],
            }, { parent: this });
        }
        // Configure object lock if enabled
        if (args.enableObjectLock) {
            new aws.s3.BucketObjectLockConfiguration(`${name}-object-lock`, {
                bucket: this.bucket.id,
                objectLockEnabled: 'Enabled',
                rule: {
                    defaultRetention: {
                        mode: 'COMPLIANCE',
                        years: 7, // 7 years retention for compliance
                    },
                },
            }, { parent: this });
        }
        // Enable notifications for security monitoring
        if (args.enableNotifications) {
            this.notification = new aws.s3.BucketNotification(`${name}-notification`, {
                bucket: this.bucket.id,
                lambdaFunctions: [
                    {
                        events: [
                            's3:ObjectCreated:*',
                            's3:ObjectRemoved:*',
                            's3:ObjectRestore:*',
                        ],
                        lambdaFunctionArn: '', // Add Lambda function ARN here
                    },
                ],
            }, { parent: this });
        }
        // Enable request metrics for monitoring
        new aws.s3.BucketMetric(`${name}-metrics`, {
            bucket: this.bucket.id,
            name: 'EntireBucket',
        }, { parent: this });
        // Note: BucketInventory is not available in current Pulumi AWS version
        // This would be added when the resource becomes available
        this.registerOutputs({
            bucketName: this.bucket.id,
            bucketArn: this.bucket.arn,
            bucketDomainName: this.bucket.bucketDomainName,
            accessLogsBucketName: this.accessLogsBucket?.id,
            accessLogsBucketArn: this.accessLogsBucket?.arn,
        });
    }
}
exports.EnhancedSecureS3Bucket = EnhancedSecureS3Bucket;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZW5oYW5jZWQtczMuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJlbmhhbmNlZC1zMy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFBQSxpREFBbUM7QUFDbkMsdURBQXlDO0FBQ3pDLDRDQUErQztBQWEvQyxNQUFhLHNCQUF1QixTQUFRLE1BQU0sQ0FBQyxpQkFBaUI7SUFDbEQsTUFBTSxDQUFnQjtJQUN0QixZQUFZLENBQXNCO0lBQ2xDLGlCQUFpQixDQUFpQztJQUNsRCxnQkFBZ0IsQ0FBaUI7SUFDakMsWUFBWSxDQUE2QjtJQUV6RCxZQUNFLElBQVksRUFDWixJQUFnQyxFQUNoQyxJQUFzQztRQUV0QyxLQUFLLENBQUMsd0NBQXdDLEVBQUUsSUFBSSxFQUFFLEVBQUUsRUFBRSxJQUFJLENBQUMsQ0FBQztRQUVoRSxrREFBa0Q7UUFDbEQsSUFBSSxJQUFJLENBQUMsbUJBQW1CLEVBQUUsQ0FBQztZQUM3QixJQUFJLENBQUMsZ0JBQWdCLEdBQUcsSUFBSSxHQUFHLENBQUMsRUFBRSxDQUFDLE1BQU0sQ0FDdkMsR0FBRyxJQUFJLGNBQWMsRUFDckI7Z0JBQ0UsTUFBTSxFQUFFLEdBQUcsSUFBSSxDQUFDLFVBQVUsY0FBYztnQkFDeEMsWUFBWSxFQUFFLEtBQUs7Z0JBQ25CLElBQUksRUFBRSxFQUFFLEdBQUcsaUJBQVUsRUFBRSxHQUFHLElBQUksQ0FBQyxJQUFJLEVBQUUsT0FBTyxFQUFFLGFBQWEsRUFBRTthQUM5RCxFQUNELEVBQUUsTUFBTSxFQUFFLElBQUksRUFBRSxDQUNqQixDQUFDO1lBRUYsc0NBQXNDO1lBQ3RDLElBQUksR0FBRyxDQUFDLEVBQUUsQ0FBQyx1QkFBdUIsQ0FDaEMsR0FBRyxJQUFJLDJCQUEyQixFQUNsQztnQkFDRSxNQUFNLEVBQUUsSUFBSSxDQUFDLGdCQUFnQixDQUFDLEVBQUU7Z0JBQ2hDLGVBQWUsRUFBRSxJQUFJO2dCQUNyQixpQkFBaUIsRUFB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Qjt3QkFDRCxpQkFBaUIsRUFBRSxFQUFFLEVBQUUsK0JBQStCO3FCQUN2RDtpQkFDRjthQUNGLEVBQ0QsRUFBRSxNQUFNLEVBQUUsSUFBSSxFQUFFLENBQ2pCLENBQUM7UUFDSixDQUFDO1FBRUQsd0NBQXdDO1FBQ3hDLElBQUksR0FBRyxDQUFDLEVBQUUsQ0FBQyxZQUFZLENBQ3JCLEdBQUcsSUFBSSxVQUFVLEVBQ2pCO1lBQ0UsTUFBTSxFQUFFLElBQUksQ0FBQyxNQUFNLENBQUMsRUFBRTtZQUN0QixJQUFJLEVBQUUsY0FBYztTQUNyQixFQUNELEVBQUUsTUFBTSxFQUFFLElBQUksRUFBRSxDQUNqQixDQUFDO1FBRUYsdUVBQXVFO1FBQ3ZFLDBEQUEwRDtRQUUxRCxJQUFJLENBQUMsZUFBZSxDQUFDO1lBQ25CLFVBQVUsRUFBRSxJQUFJLENBQUMsTUFBTSxDQUFDLEVBQUU7WUFDMUIsU0FBUyxFQUFFLElBQUksQ0FBQyxNQUFNLENBQUMsR0FBRztZQUMxQixnQkFBZ0IsRUFBRSxJQUFJLENBQUMsTUFBTSxDQUFDLGdCQUFnQjtZQUM5QyxvQkFBb0IsRUFBRSxJQUFJLENBQUMsZ0JBQWdCLEVBQUUsRUFBRTtZQUMvQyxtQkFBbUIsRUFBRSxJQUFJLENBQUMsZ0JBQWdCLEVBQUUsR0FBRztTQUNoRCxDQUFDLENBQUM7SUFDTCxDQUFDO0NBQ0Y7QUFwU0Qsd0RBb1NDIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0ICogYXMgYXdzIGZyb20gJ0BwdWx1bWkvYXdzJztcbmltcG9ydCAqIGFzIHB1bHVtaSBmcm9tICdAcHVsdW1pL3B1bHVtaSc7XG5pbXBvcnQgeyBjb21tb25UYWdzIH0gZnJvbSAnLi4vLi4vY29uZmlnL3RhZ3MnO1xuXG5leHBvcnQgaW50ZXJmYWNlIEVuaGFuY2VkU2VjdXJlUzNCdWNrZXRBcmdzIHtcbiAgYnVja2V0TmFtZT86IHN0cmluZztcbiAga21zS2V5SWQ6IHB1bHVtaS5JbnB1dDxzdHJpbmc+O1xuICB0YWdzPzogUmVjb3JkPHN0cmluZywgc3RyaW5nPjtcbiAgbGlmZWN5Y2xlUnVsZXM/OiBhbnlbXTtcbiAgZW5hYmxlQWNjZXNzTG9nZ2luZz86IGJvb2xlYW47XG4gIGVuYWJsZU5vdGlmaWNhdGlvbnM/OiBib29sZWFuO1xuICBhbGxvd2VkSXBSYW5nZXM/OiBzdHJpbmdbXTtcbiAgZW5hYmxlT2JqZWN0TG9jaz86IGJvb2xlYW47XG59XG5cbmV4cG9ydCBjbGFzcyBFbmhhbmNlZFNlY3VyZVMzQnVja2V0IGV4dGVuZHMgcHVsdW1pLkNvbXBvbmVudFJlc291cmNlIHtcbiAgcHVibGljIHJlYWRvbmx5IGJ1Y2tldDogYXdzLnMzLkJ1Y2tldDtcbiAgcHVibGljIHJlYWRvbmx5IGJ1Y2tldFBvbGljeTogYXdzLnMzLkJ1Y2tldFBvbGljeTtcbiAgcHVibGljIHJlYWRvbmx5IHB1YmxpY0FjY2Vzc0Jsb2NrOiBhd3MuczMuQnVja2V0UHVibGljQWNjZXNzQmxvY2s7XG4gIHB1YmxpYyByZWFkb25seSBhY2Nlc3NMb2dzQnVja2V0PzogYXdzLnMzLkJ1Y2tldDtcbiAgcHVibGljIHJlYWRvbmx5IG5vdGlmaWNhdGlvbj86IGF3cy5zMy5CdWNrZXROb3RpZmljYXRpb247XG5cbiAgY29uc3RydWN0b3IoXG4gICAgbmFtZTogc3RyaW5nLFxuICAgIGFyZ3M6IEVuaGFuY2VkU2VjdXJlUzNCdWNrZXRBcmdzLFxuICAgIG9wdHM/OiBwdWx1bWkuQ29tcG9uZW50UmVzb3VyY2VPcHRpb25zXG4gICkge1xuICAgIHN1cGVyKCdjdXN0b206c2VjdXJpdHk6RW5oYW5jZWRTZWN1cmVTM0J1Y2tldCcsIG5hbWUsIHt9LCBvcHRzKTtcblxuICAgIC8vIENyZWF0ZSBhY2Nlc3MgbG9ncyBidWNrZXQgaWYgbG9nZ2luZyBpcyBlbmFibGVkXG4gICAgaWYgKGFyZ3MuZW5hYmxlQWNjZXNzTG9nZ2luZykge1xuICAgICAgdGhpcy5hY2Nlc3NMb2dzQnVja2V0ID0gbmV3IGF3cy5zMy5CdWNrZXQoXG4gICAgICAgIGAke25hbWV9LWFjY2Vzcy1sb2dzYCxcbiAgICAgICAge1xuICAgICAgICAgIGJ1Y2tldDogYCR7YXJncy5idWNrZXROYW1lfS1hY2Nlc3MtbG9nc2AsXG4gICAgICAgICAgZm9yY2VEZXN0cm95OiBmYWxzZSxcbiAgICAgICAgICB0YWdzOiB7IC4uLmNvbW1vblRhZ3MsIC4uLmFyZ3MudGFncywgUHVycG9zZTogJ0FjY2VzcyBMb2dzJyB9LFxuICAgICAgICB9LFxuICAgICAgICB7IHBhcmVudDogdGhpcyB9XG4gICAgICApO1xuXG4gICAgICAvLyBCbG9jayBwdWJsaWMgYWNjZXNzIGZvciBsb2dzIGJ1Y2tldFxuICAgICAgbmV3IGF3cy5zMy5CdWNrZXRQdWJsaWNBY2Nlc3NCbG9jayhcbiAgICAgICAgYCR7bmFtZX0tbG9ncy1wdWJsaWMtYWNjZXNzLWJsb2NrYCxcbiAgICAgICAge1xuICAgICAgICAgIGJ1Y2tldDogdGhpcy5hY2Nlc3NMb2dzQnVja2V0LmlkLFxuICAgICAgICAgIGJsb2NrUHVibGljQWNsczogdHJ1ZSxcbiAgICAgICAgICBibG9ja1B1YmxpY1BvbGljeTogdHJ1ZSxcbiAgICAgICAgICBpZ25vcmVQdWJsaWNBY2xzOiB0cnVlLFxuICAgICAgICAgIHJlc3RyaWN0UHVibGljQnVja2V0czogdHJ1ZSxcbiAgICAgICAgfSxcbiAgICAgICAgeyBwYXJlbnQ6IHRoaXMgfVxuICAgICAgKTtcbiAgICB9XG5cbiAgICAvLyBDcmVhdGUgbWFpbiBTMyBidWNrZXQgd2l0aCBlbmhhbmNlZCBzZWN1cml0eVxuICAgIHRoaXMuYnVja2V0ID0gbmV3IGF3cy5zMy5CdWNrZXQoXG4gICAgICBgJHtuYW1lfS1idWNrZXRgLFxuICAgICAge1xuICAgICAgICBidWNrZXQ6IGFyZ3MuYnVja2V0TmFtZSxcbiAgICAgICAgZm9yY2VEZXN0cm95OiBmYWxzZSxcbiAgICAgICAgb2JqZWN0TG9ja0VuYWJsZWQ6IGFyZ3MuZW5hYmxlT2JqZWN0TG9jayxcbiAgICAgICAgdGFnczogeyAuLi5jb21tb25UYWdzLCAuLi5hcmdzLnRhZ3MgfSxcbiAgICAgIH0sXG4gICAgICB7IHBhcmVudDogdGhpcyB9XG4gICAgKTtcblxuICAgIC8vIEVuYWJsZSB2ZXJzaW9uaW5nIHdpdGggTUZBIGRlbGV0ZSBwcm90ZWN0aW9uXG4gICAgbmV3IGF3cy5zMy5CdWNrZXRWZXJzaW9uaW5nKFxuICAgICAgYCR7bmFtZX0tdmVyc2lvbmluZ2AsXG4gICAgICB7XG4gICAgICAgIGJ1Y2tldDogdGhpcy5idWNrZXQuaWQsXG4gICAgICAgIHZlcnNpb25pbmdDb25maWd1cmF0aW9uOiB7XG4gICAgICAgICAgc3RhdHVzOiAnRW5hYmxlZCcsXG4gICAgICAgICAgbWZhRGVsZXRlOiAnRW5hYmxlZCcsIC8vIFJlcXVpcmUgTUZBIGZvciBwZXJtYW5lbnQgZGVsZXRpb25cbiAgICAgICAgfSxcbiAgICAgIH0sXG4gICAgICB7IHBhcmVudDogdGhpcyB9XG4gICAgKTtcblxuICAgIC8vIENvbmZpZ3VyZSBzZXJ2ZXItc2lkZSBlbmNyeXB0aW9uIHdpdGggYWRkaXRpb25hbCBzZWN1cml0eVxuICAgIG5ldyBhd3MuczMuQnVja2V0U2VydmVyU2lkZUVuY3J5cHRpb25Db25maWd1cmF0aW9uKFxuICAgICAgYCR7bmFtZX0tZW5jcnlwdGlvbmAsXG4gICAgICB7XG4gICAgICAgIGJ1Y2tldDogdGhpcy5idWNrZXQuaWQsXG4gICAgICAgIHJ1bGVzOiBbXG4gICAgICAgICAge1xuICAgICAgICAgICAgYXBwbHlTZXJ2ZXJTaWRlRW5jcnlwdGlvbkJ5RGVmYXVsdDoge1xuICAgICAgICAgICAgICBzc2VBbGdvcml0aG06ICdhd3M6a21zJyxcbiAgICAgICAgICAgICAga21zTWFzdGVyS2V5SWQ6IGFyZ3Mua21zS2V5SWQsXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgYnVja2V0S2V5RW5hYmxlZDogdHJ1ZSxcbiAgICAgICAgICB9LFxuICAgICAgICBdLFxuICAgICAgfSxcbiAgICAgIHsgcGFyZW50OiB0aGlzIH1cbiAgICApO1xuXG4gICAgLy8gQmxvY2sgYWxsIHB1YmxpYyBhY2Nlc3NcbiAgICB0aGlzLnB1YmxpY0FjY2Vzc0Jsb2NrID0gbmV3IGF3cy5zMy5CdWNrZXRQdWJsaWNBY2Nlc3NCbG9jayhcbiAgICAgIGAke25hbWV9LXB1YmxpYy1hY2Nlc3MtYmxvY2tgLFxuICAgICAge1xuICAgICAgICBidWNrZXQ6IHRoaXMuYnVja2V0LmlkLFxuICAgICAgICBibG9ja1B1YmxpY0FjbHM6IHRydWUsXG4gICAgICAgIGJsb2NrUHVibGljUG9saWN5OiB0cnVlLFxuICAgICAgICBpZ25vcmVQdWJsaWNBY2xzOiB0cnVlLFxuICAgICAgICByZXN0cmljdFB1YmxpY0J1Y2tldHM6IHRydWUsXG4gICAgICB9LFxuICAgICAgeyBwYXJlbnQ6IHRoaXMgfVxuICAgICk7XG5cbiAgICAvLyBFbmhhbmNlZCBzZWN1cmUgYnVja2V0IHBvbGljeSB3aXRoIElQIHJlc3RyaWN0aW9uc1xuICAgIGNvbnN0IGJ1Y2tldFBvbGljeURvY3VtZW50ID0gcHVsdW1pXG4gICAgICAuYWxsKFt0aGlzLmJ1Y2tldC5hcm5dKVxuICAgICAgLmFwcGx5KChbYnVja2V0QXJuXSkgPT4gKHtcbiAgICAgICAgVmVyc2lvbjogJzIwMTItMTAtMTcnLFxuICAgICAgICBTdGF0ZW1lbnQ6IFtcbiAgICAgICAgICB7XG4gICAgICAgICAgICBTaWQ6ICdEZW55SW5zZWN1cmVDb25uZWN0aW9ucycsXG4gICAgICAgICAgICBFZmZlY3Q6ICdEZW55JyxcbiAgICAgICAgICAgIFByaW5jaXBhbDogJyonLFxuICAgICAgICAgICAgQWN0aW9uOiAnczM6KicsXG4gICAgICAgICAgICBSZXNvdXJjZTogW2J1Y2tldEFybiwgYCR7YnVja2V0QXJufS8qYF0sXG4gICAgICAgICAgICBDb25kaXRpb246IHtcbiAgICAgICAgICAgICAgQm9vbDoge1xuICAgICAgICAgICAgICAgICdhd3M6U2VjdXJlVHJhbnNwb3J0JzogJ2ZhbHNlJyxcbiAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgfSxcbiAgICAgICAgICB7XG4gICAgICAgICAgICBTaWQ6ICdEZW55VW5lbmNyeXB0ZWRPYmplY3RVcGxvYWRzJyxcbiAgICAgICAgICAgIEVmZmVjdDogJ0RlbnknLFxuICAgICAgICAgICAgUHJpbmNpcGFsOiAnKicsXG4gICAgICAgICAgICBBY3Rpb246ICdzMzpQdXRPYmplY3QnLFxuICAgICAgICAgICAgUmVzb3VyY2U6IGAke2J1Y2tldEFybn0vKmAsXG4gICAgICAgICAgICBDb25kaXRpb246IHtcbiAgICAgICAgICAgICAgU3RyaW5nTm90RXF1YWxzOiB7XG4gICAgICAgICAgICAgICAgJ3MzOngtYW16LXNlcnZlci1zaWRlLWVuY3J5cHRpb24nOiAnYXdzOmttcycsXG4gICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICB9LFxuICAgICAgICAgIH0sXG4gICAgICAgICAge1xuICAgICAgICAgICAgU2lkOiAnRGVueUluY29ycmVjdEVuY3J5cHRpb25IZWFkZXInLFxuICAgICAgICAgICAgRWZmZWN0OiAnRGVueScsXG4gICAgICAgICAgICBQcmluY2lwYWw6ICcqJyxcbiAgICAgICAgICAgIEFjdGlvbjogJ3MzOlB1dE9iamVjdCcsXG4gICAgICAgICAgICBSZXNvdXJjZTogYCR7YnVja2V0QXJufS8qYCxcbiAgICAgICAgICAgIENvbmRpdGlvbjoge1xuICAgICAgICAgICAgICBTdHJpbmdOb3RFcXVhbHM6IHtcbiAgICAgICAgICAgICAgICAnczM6eC1hbXotc2VydmVyLXNpZGUtZW5jcnlwdGlvbi1hd3Mta21zLWtleS1pZCc6IGFyZ3Mua21zS2V5SWQsXG4gICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICB9LFxuICAgICAgICAgIH0sXG4gICAgICAgICAge1xuICAgICAgICAgICAgU2lkOiAnUmVzdHJpY3RUb0FsbG93ZWRJUHMnLFxuICAgICAgICAgICAgRWZmZWN0OiAnRGVueScsXG4gICAgICAgICAgICBQcmluY2lwYWw6ICcqJyxcbiAgICAgICAgICAgIEFjdGlvbjogJ3MzOionLFxuICAgICAgICAgICAgUmVzb3VyY2U6IFtidWNrZXRBcm4sIGAke2J1Y2tldEFybn0vKmBdLFxuICAgICAgICAgICAgQ29uZGl0aW9uOiBhcmdzLmFsbG93ZWRJcFJhbmdlc1xuICAgICAgICAgICAgICA/IHtcbiAgICAgICAgICAgICAgICAgIE5vdElwQWRkcmVzczoge1xuICAgICAgICAgICAgICAgICAgICAnYXdzOlNvdXJjZUlwJzogYXJncy5hbGxvd2VkSXBSYW5nZXMsXG4gICAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgOiB1bmRlZmluZWQsXG4gICAgICAgICAgfSxcbiAgICAgICAgICB7XG4gICAgICAgICAgICBTaWQ6ICdEZW55RGVsZXRlV2l0aG91dE1GQScsXG4gICAgICAgICAgICBFZmZlY3Q6ICdEZW55JyxcbiAgICAgICAgICAgIFByaW5jaXBhbDogJyonLFxuICAgICAgICAgICAgQWN0aW9uOiBbXG4gICAgICAgICAgICAgICdzMzpEZWxldGVPYmplY3QnLFxuICAgICAgICAgICAgICAnczM6RGVsZXRlT2JqZWN0VmVyc2lvbicsXG4gICAgICAgICAgICAgICdzMzpEZWxldGVCdWNrZXQnLFxuICAgICAgICAgICAgXSxcbiAgICAgICAgICAgIFJlc291cmNlOiBbYnVja2V0QXJuLCBgJHtidWNrZXRBcm59LypgXSxcbiAgICAgICAgICAgIENvbmRpdGlvbjoge1xuICAgICAgICAgICAgICBCb29sSWZFeGlzdHM6IHtcbiAgICAgICAgICAgICAgICAnYXdzOk11bHRpRmFjdG9yQXV0aFByZXNlbnQnOiAnZmFsc2UnLFxuICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgfSxcbiAgICAgICAgICB9LFxuICAgICAgICBdLmZpbHRlcihzdGF0ZW1lbnQgPT4gc3RhdGVtZW50LkNvbmRpdGlvbiAhPT0gdW5kZWZpbmVkKSxcbiAgICAgIH0pKTtcblxuICAgIHRoaXMuYnVja2V0UG9saWN5ID0gbmV3IGF3cy5zMy5CdWNrZXRQb2xpY3koXG4gICAgICBgJHtuYW1lfS1wb2xpY3lgLFxuICAgICAge1xuICAgICAgICBidWNrZXQ6IHRoaXMuYnVja2V0LmlkLFxuICAgICAgICBwb2xpY3k6IGJ1Y2tldFBvbGljeURvY3VtZW50LmFwcGx5KHBvbGljeSA9PiBKU09OLnN0cmluZ2lmeShwb2xpY3kpKSxcbiAgICAgIH0sXG4gICAgICB7IHBhcmVudDogdGhpcywgZGVwZW5kc09uOiBbdGhpcy5wdWJsaWNBY2Nlc3NCbG9ja10gfVxuICAgICk7XG5cbiAgICAvLyBDb25maWd1cmUgZW5oYW5jZWQgbGlmZWN5Y2xlIHJ1bGVzXG4gICAgaWYgKGFyZ3MubGlmZWN5Y2xlUnVsZXMpIHtcbiAgICAgIG5ldyBhd3MuczMuQnVja2V0TGlmZWN5Y2xlQ29uZmlndXJhdGlvbihcbiAgICAgICAgYCR7bmFtZX0tbGlmZWN5Y2xlYCxcbiAgICAgICAge1xuICAgICAgICAgIGJ1Y2tldDogdGhpcy5idWNrZXQuaWQsXG4gICAgICAgICAgcnVsZXM6IFtcbiAgICAgICAgICAgIC4uLmFyZ3MubGlmZWN5Y2xlUnVsZXMsXG4gICAgICAgICAgICAvLyBBZGQgZGVmYXVsdCBydWxlIGZvciBpbmNvbXBsZXRlIG11bHRpcGFydCB1cGxvYWRzXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgIGlkOiAnY2xlYW51cC1pbmNvbXBsZXRlLXVwbG9hZHMnLFxuICAgICAgICAgICAgICBzdGF0dXM6ICdFbmFibGVkJyxcbiAgICAgICAgICAgICAgYWJvcnRJbmNvbXBsZXRlTXVsdGlwYXJ0VXBsb2FkOiB7XG4gICAgICAgICAgICAgICAgZGF5c0FmdGVySW5pdGlhdGlvbjogNyxcbiAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAvLyBBZGQgcnVsZSBmb3Igb2xkIHZlcnNpb25zIGNsZWFudXBcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgaWQ6ICdjbGVhbnVwLW9sZC12ZXJzaW9ucycsXG4gICAgICAgICAgICAgIHN0YXR1czogJ0VuYWJsZWQnLFxuICAgICAgICAgICAgICBub25jdXJyZW50VmVyc2lvbkV4cGlyYXRpb246IHtcbiAgICAgICAgICAgICAgICBub25jdXJyZW50RGF5czogOTAsXG4gICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICB9LFxuICAgICAgICAgIF0sXG4gICAgICAgIH0sXG4gICAgICAgIHsgcGFyZW50OiB0aGlzIH1cbiAgICAgICk7XG4gICAgfVxuXG4gICAgLy8gRW5hYmxlIGFjY2VzcyBsb2dnaW5nIGlmIHJlcXVlc3RlZFxuICAgIGlmIChhcmdzLmVuYWJsZUFjY2Vzc0xvZ2dpbmcgJiYgdGhpcy5hY2Nlc3NMb2dzQnVja2V0KSB7XG4gICAgICBuZXcgYXdzLnMzLkJ1Y2tldExvZ2dpbmcoXG4gICAgICAgIGAke25hbWV9LWxvZ2dpbmdgLFxuICAgICAgICB7XG4gICAgICAgICAgYnVja2V0OiB0aGlzLmJ1Y2tldC5pZCxcbiAgICAgICAgICB0YXJnZXRCdWNrZXQ6IHRoaXMuYWNjZXNzTG9nc0J1Y2tldC5pZCxcbiAgICAgICAgICB0YXJnZXRQcmVmaXg6ICdhY2Nlc3MtbG9ncy8nLFxuICAgICAgICAgIHRhcmdldEdyYW50czogW1xuICAgICAgICAgICAge1xuICAgICAgICAgICAgICBncmFudGVlOiB7XG4gICAgICAgICAgICAgICAgdHlwZTogJ0dyb3VwJyxcbiAgICAgICAgICAgICAgICB1cmk6ICdodHRwOi8vYWNzLmFtYXpvbmF3cy5jb20vZ3JvdXBzL3MzL0xvZ0RlbGl2ZXJ5JyxcbiAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgcGVybWlzc2lvbjogJ1dSSVRFJyxcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgXSxcbiAgICAgICAgfSxcbiAgICAgICAgeyBwYXJlbnQ6IHRoaXMgfVxuICAgICAgKTtcbiAgICB9XG5cbiAgICAvLyBDb25maWd1cmUgb2JqZWN0IGxvY2sgaWYgZW5hYmxlZFxuICAgIGlmIChhcmdzLmVuYWJsZU9iamVjdExvY2spIHtcbiAgICAgIG5ldyBhd3MuczMuQnVja2V0T2JqZWN0TG9ja0NvbmZpZ3VyYXRpb24oXG4gICAgICAgIGAke25hbWV9LW9iamVjdC1sb2NrYCxcbiAgICAgICAge1xuICAgICAgICAgIGJ1Y2tldDogdGhpcy5idWNrZXQuaWQsXG4gICAgICAgICAgb2JqZWN0TG9ja0VuYWJsZWQ6ICdFbmFibGVkJyxcbiAgICAgICAgICBydWxlOiB7XG4gICAgICAgICAgICBkZWZhdWx0UmV0ZW50aW9uOiB7XG4gICAgICAgICAgICAgIG1vZGU6ICdDT01QTElBTkNFJyxcbiAgICAgICAgICAgICAgeWVhcnM6IDcsIC8vIDcgeWVhcnMgcmV0ZW50aW9uIGZvciBjb21wbGlhbmNlXG4gICAgICAgICAgICB9LFxuICAgICAgICAgIH0sXG4gICAgICAgIH0sXG4gICAgICAgIHsgcGFyZW50OiB0aGlzIH1cbiAgICAgICk7XG4gICAgfVxuXG4gICAgLy8gRW5hYmxlIG5vdGlmaWNhdGlvbnMgZm9yIHNlY3VyaXR5IG1vbml0b3JpbmdcbiAgICBpZiAoYXJncy5lbmFibGVOb3RpZmljYXRpb25zKSB7XG4gICAgICB0aGlzLm5vdGlmaWNhdGlvbiA9IG5ldyBhd3MuczMuQnVja2V0Tm90aWZpY2F0aW9uKFxuICAgICAgICBgJHtuYW1lfS1ub3RpZmljYXRpb25gLFxuICAgICAgICB7XG4gICAgICAgICAgYnVja2V0OiB0aGlzLmJ1Y2tldC5pZCxcbiAgICAgICAgICBsYW1iZGFGdW5jdGlvbnM6IFtcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgZXZlbnRzOiBbXG4gICAgICAgICAgICAgICAgJ3MzOk9iamVjdENyZWF0ZWQ6KicsXG4gICAgICAgICAgICAgICAgJ3MzOk9iamVjdFJlbW92ZWQ6KicsXG4gICAgICAgICAgICAgICAgJ3MzOk9iamVjdFJlc3RvcmU6KicsXG4gICAgICAgICAgICAgIF0sXG4gICAgICAgICAgICAgIGxhbWJkYUZ1bmN0aW9uQXJuOiAnJywgLy8gQWRkIExhbWJkYSBmdW5jdGlvbiBBUk4gaGVyZVxuICAgICAgICAgICAgfSxcbiAgICAgICAgICBdLFxuICAgICAgICB9LFxuICAgICAgICB7IHBhcmVudDogdGhpcyB9XG4gICAgICApO1xuICAgIH1cblxuICAgIC8vIEVuYWJsZSByZXF1ZXN0IG1ldHJpY3MgZm9yIG1vbml0b3JpbmdcbiAgICBuZXcgYXdzLnMzLkJ1Y2tldE1ldHJpYyhcbiAgICAgIGAke25hbWV9LW1ldHJpY3NgLFxuICAgICAge1xuICAgICAgICBidWNrZXQ6IHRoaXMuYnVja2V0LmlkLFxuICAgICAgICBuYW1lOiAnRW50aXJlQnVja2V0JyxcbiAgICAgIH0sXG4gICAgICB7IHBhcmVudDogdGhpcyB9XG4gICAgKTtcblxuICAgIC8vIE5vdGU6IEJ1Y2tldEludmVudG9yeSBpcyBub3QgYXZhaWxhYmxlIGluIGN1cnJlbnQgUHVsdW1pIEFXUyB2ZXJzaW9uXG4gICAgLy8gVGhpcyB3b3VsZCBiZSBhZGRlZCB3aGVuIHRoZSByZXNvdXJjZSBiZWNvbWVzIGF2YWlsYWJsZVxuXG4gICAgdGhpcy5yZWdpc3Rlck91dHB1dHMoe1xuICAgICAgYnVja2V0TmFtZTogdGhpcy5idWNrZXQuaWQsXG4gICAgICBidWNrZXRBcm46IHRoaXMuYnVja2V0LmFybixcbiAgICAgIGJ1Y2tldERvbWFpbk5hbWU6IHRoaXMuYnVja2V0LmJ1Y2tldERvbWFpbk5hbWUsXG4gICAgICBhY2Nlc3NMb2dzQnVja2V0TmFtZTogdGhpcy5hY2Nlc3NMb2dzQnVja2V0Py5pZCxcbiAgICAgIGFjY2Vzc0xvZ3NCdWNrZXRBcm46IHRoaXMuYWNjZXNzTG9nc0J1Y2tldD8uYXJuLFxuICAgIH0pO1xuICB9XG59XG4iXX0=