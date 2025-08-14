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
                bucket: args.bucketName
                    ? `${args.bucketName}-access-logs`
                    : undefined,
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
        // Enable versioning with MFA delete protection (disabled for automation)
        new aws.s3.BucketVersioning(`${name}-versioning`, {
            bucket: this.bucket.id,
            versioningConfiguration: {
                status: 'Enabled',
                mfaDelete: 'Disabled', // Disabled for automated deployments
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
        // Enhanced secure bucket policy with IP restrictions (optional)
        if (args.enableBucketPolicy !== false) {
            const bucketPolicyDocument = pulumi
                .all([
                this.bucket.arn,
                aws.getCallerIdentity().then(id => id.accountId),
            ])
                .apply(([bucketArn, accountId]) => ({
                Version: '2012-10-17',
                Statement: [
                    {
                        Sid: 'AllowRootAccountFullAccess',
                        Effect: 'Allow',
                        Principal: {
                            AWS: `arn:aws:iam::${accountId}:root`,
                        },
                        Action: 's3:*',
                        Resource: [bucketArn, `${bucketArn}/*`],
                    },
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
                    // Note: IP restrictions removed to prevent deployment issues
                    // Can be re-enabled with proper condition logic if needed
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
        }
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
                // Note: targetGrants removed for bucket owner enforced buckets
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
        // Enable notifications for security monitoring (only if Lambda ARN is provided)
        if (args.enableNotifications && args.lambdaFunctionArn) {
            this.notification = new aws.s3.BucketNotification(`${name}-notification`, {
                bucket: this.bucket.id,
                lambdaFunctions: [
                    {
                        events: [
                            's3:ObjectCreated:*',
                            's3:ObjectRemoved:*',
                            's3:ObjectRestore:*',
                        ],
                        lambdaFunctionArn: args.lambdaFunctionArn,
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZW5oYW5jZWQtczMuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJlbmhhbmNlZC1zMy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFBQSxpREFBbUM7QUFDbkMsdURBQXlDO0FBQ3pDLDRDQUErQztBQWUvQyxNQUFhLHNCQUF1QixTQUFRLE1BQU0sQ0FBQyxpQkFBaUI7SUFDbEQsTUFBTSxDQUFnQjtJQUN0QixZQUFZLENBQXNCO0lBQ2xDLGlCQUFpQixDQUFpQztJQUNsRCxnQkFBZ0IsQ0FBaUI7SUFDakMsWUFBWSxDQUE2QjtJQUV6RCxZQUNFLElBQVksRUFDWixJQUFnQyxFQUNoQyxJQUFzQztRQUV0QyxLQUFLLENBQUMsd0NBQXdDLEVBQUUsSUFBSSxFQUFFLEVBQUUsRUFBRSxJQUFJLENBQUMsQ0FBQztRQUVoRSxrREFBa0Q7UUFDbEQsSUFBSSxJQUFJLENBQUMsbUJBQW1CLEVBQUUsQ0FBQztZQUM3QixJQUFJLENBQUMsZ0JBQWdCLEdBQUcsSUFBSSxHQUFHLENBQUMsRUFBRSxDQUFDLE1BQU0sQ0FDdkMsR0FBRyxJQUFJLGNBQWMsRUFDckI7Z0JBQ0UsTUFBTSxFQUFFLElBQUksQ0FBQyxVQUFVO29CQUNyQixDQUFDLENBQUMsR0FBRyxJQUFJLENBQUMsVUFBVSxjQUFjO29CQUNsQyxDQUFDLENBQUMsU0FBUztnQkFDYixZQUFZLEVBQUUsS0FBSztnQkFDbkIsSUFBSSxFQUFFLEVBQUUsR0FBRyxpQkFBVSxFQUFFLEdBQUcsSUFBSSxDQUFDLElBQUksRUFBRSxPQUFPLEVBQUUsYUFBYSxFQUFFO2FBQzlELEVBQ0QsRUFBRSxNQUFNLEVBQUUsSUFBSSxFQUFFLENBQ2pCLENBQUM7WUFFRixzQ0FBc0M7WUFDdEMsSUFBSSxHQUFHLENBQUMsRUFBRSxDQUFDLHVCQUF1QixDQUNoQyxHQUFHLElBQUksMkJBQTJCLEVBQ2xDO2dCQUNFLE1BQU0sRUFBRSxJQUFJLENBQUMsZ0JB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QUNFLE1BQU0sRUFBRTs0QkFDTixvQkFBb0I7NEJBQ3BCLG9CQUFvQjs0QkFDcEIsb0JBQW9CO3lCQUNyQjt3QkFDRCxpQkFBaUIsRUFBRSxJQUFJLENBQUMsaUJBQWlCO3FCQUMxQztpQkFDRjthQUNGLEVBQ0QsRUFBRSxNQUFNLEVBQUUsSUFBSSxFQUFFLENBQ2pCLENBQUM7UUFDSixDQUFDO1FBRUQsd0NBQXdDO1FBQ3hDLElBQUksR0FBRyxDQUFDLEVBQUUsQ0FBQyxZQUFZLENBQ3JCLEdBQUcsSUFBSSxVQUFVLEVBQ2pCO1lBQ0UsTUFBTSxFQUFFLElBQUksQ0FBQyxNQUFNLENBQUMsRUFBRTtZQUN0QixJQUFJLEVBQUUsY0FBYztTQUNyQixFQUNELEVBQUUsTUFBTSxFQUFFLElBQUksRUFBRSxDQUNqQixDQUFDO1FBRUYsdUVBQXVFO1FBQ3ZFLDBEQUEwRDtRQUUxRCxJQUFJLENBQUMsZUFBZSxDQUFDO1lBQ25CLFVBQVUsRUFBRSxJQUFJLENBQUMsTUFBTSxDQUFDLEVBQUU7WUFDMUIsU0FBUyxFQUFFLElBQUksQ0FBQyxNQUFNLENBQUMsR0FBRztZQUMxQixnQkFBZ0IsRUFBRSxJQUFJLENBQUMsTUFBTSxDQUFDLGdCQUFnQjtZQUM5QyxvQkFBb0IsRUFBRSxJQUFJLENBQUMsZ0JBQWdCLEVBQUUsRUFBRTtZQUMvQyxtQkFBbUIsRUFBRSxJQUFJLENBQUMsZ0JBQWdCLEVBQUUsR0FBRztTQUNoRCxDQUFDLENBQUM7SUFDTCxDQUFDO0NBQ0Y7QUFqU0Qsd0RBaVNDIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0ICogYXMgYXdzIGZyb20gJ0BwdWx1bWkvYXdzJztcbmltcG9ydCAqIGFzIHB1bHVtaSBmcm9tICdAcHVsdW1pL3B1bHVtaSc7XG5pbXBvcnQgeyBjb21tb25UYWdzIH0gZnJvbSAnLi4vLi4vY29uZmlnL3RhZ3MnO1xuXG5leHBvcnQgaW50ZXJmYWNlIEVuaGFuY2VkU2VjdXJlUzNCdWNrZXRBcmdzIHtcbiAgYnVja2V0TmFtZT86IHN0cmluZztcbiAga21zS2V5SWQ6IHB1bHVtaS5JbnB1dDxzdHJpbmc+O1xuICB0YWdzPzogUmVjb3JkPHN0cmluZywgc3RyaW5nPjtcbiAgbGlmZWN5Y2xlUnVsZXM/OiBhbnlbXTtcbiAgZW5hYmxlQWNjZXNzTG9nZ2luZz86IGJvb2xlYW47XG4gIGVuYWJsZU5vdGlmaWNhdGlvbnM/OiBib29sZWFuO1xuICBhbGxvd2VkSXBSYW5nZXM/OiBzdHJpbmdbXTtcbiAgZW5hYmxlT2JqZWN0TG9jaz86IGJvb2xlYW47XG4gIGxhbWJkYUZ1bmN0aW9uQXJuPzogc3RyaW5nOyAvLyBPcHRpb25hbCBMYW1iZGEgZnVuY3Rpb24gQVJOIGZvciBub3RpZmljYXRpb25zXG4gIGVuYWJsZUJ1Y2tldFBvbGljeT86IGJvb2xlYW47IC8vIE9wdGlvbmFsIGZsYWcgdG8gZW5hYmxlL2Rpc2FibGUgYnVja2V0IHBvbGljeVxufVxuXG5leHBvcnQgY2xhc3MgRW5oYW5jZWRTZWN1cmVTM0J1Y2tldCBleHRlbmRzIHB1bHVtaS5Db21wb25lbnRSZXNvdXJjZSB7XG4gIHB1YmxpYyByZWFkb25seSBidWNrZXQ6IGF3cy5zMy5CdWNrZXQ7XG4gIHB1YmxpYyByZWFkb25seSBidWNrZXRQb2xpY3k6IGF3cy5zMy5CdWNrZXRQb2xpY3k7XG4gIHB1YmxpYyByZWFkb25seSBwdWJsaWNBY2Nlc3NCbG9jazogYXdzLnMzLkJ1Y2tldFB1YmxpY0FjY2Vzc0Jsb2NrO1xuICBwdWJsaWMgcmVhZG9ubHkgYWNjZXNzTG9nc0J1Y2tldD86IGF3cy5zMy5CdWNrZXQ7XG4gIHB1YmxpYyByZWFkb25seSBub3RpZmljYXRpb24/OiBhd3MuczMuQnVja2V0Tm90aWZpY2F0aW9uO1xuXG4gIGNvbnN0cnVjdG9yKFxuICAgIG5hbWU6IHN0cmluZyxcbiAgICBhcmdzOiBFbmhhbmNlZFNlY3VyZVMzQnVja2V0QXJncyxcbiAgICBvcHRzPzogcHVsdW1pLkNvbXBvbmVudFJlc291cmNlT3B0aW9uc1xuICApIHtcbiAgICBzdXBlcignY3VzdG9tOnNlY3VyaXR5OkVuaGFuY2VkU2VjdXJlUzNCdWNrZXQnLCBuYW1lLCB7fSwgb3B0cyk7XG5cbiAgICAvLyBDcmVhdGUgYWNjZXNzIGxvZ3MgYnVja2V0IGlmIGxvZ2dpbmcgaXMgZW5hYmxlZFxuICAgIGlmIChhcmdzLmVuYWJsZUFjY2Vzc0xvZ2dpbmcpIHtcbiAgICAgIHRoaXMuYWNjZXNzTG9nc0J1Y2tldCA9IG5ldyBhd3MuczMuQnVja2V0KFxuICAgICAgICBgJHtuYW1lfS1hY2Nlc3MtbG9nc2AsXG4gICAgICAgIHtcbiAgICAgICAgICBidWNrZXQ6IGFyZ3MuYnVja2V0TmFtZVxuICAgICAgICAgICAgPyBgJHthcmdzLmJ1Y2tldE5hbWV9LWFjY2Vzcy1sb2dzYFxuICAgICAgICAgICAgOiB1bmRlZmluZWQsXG4gICAgICAgICAgZm9yY2VEZXN0cm95OiBmYWxzZSxcbiAgICAgICAgICB0YWdzOiB7IC4uLmNvbW1vblRhZ3MsIC4uLmFyZ3MudGFncywgUHVycG9zZTogJ0FjY2VzcyBMb2dzJyB9LFxuICAgICAgICB9LFxuICAgICAgICB7IHBhcmVudDogdGhpcyB9XG4gICAgICApO1xuXG4gICAgICAvLyBCbG9jayBwdWJsaWMgYWNjZXNzIGZvciBsb2dzIGJ1Y2tldFxuICAgICAgbmV3IGF3cy5zMy5CdWNrZXRQdWJsaWNBY2Nlc3NCbG9jayhcbiAgICAgICAgYCR7bmFtZX0tbG9ncy1wdWJsaWMtYWNjZXNzLWJsb2NrYCxcbiAgICAgICAge1xuICAgICAgICAgIGJ1Y2tldDogdGhpcy5hY2Nlc3NMb2dzQnVja2V0LmlkLFxuICAgICAgICAgIGJsb2NrUHVibGljQWNsczogdHJ1ZSxcbiAgICAgICAgICBibG9ja1B1YmxpY1BvbGljeTogdHJ1ZSxcbiAgICAgICAgICBpZ25vcmVQdWJsaWNBY2xzOiB0cnVlLFxuICAgICAgICAgIHJlc3RyaWN0UHVibGljQnVja2V0czogdHJ1ZSxcbiAgICAgICAgfSxcbiAgICAgICAgeyBwYXJlbnQ6IHRoaXMgfVxuICAgICAgKTtcbiAgICB9XG5cbiAgICAvLyBDcmVhdGUgbWFpbiBTMyBidWNrZXQgd2l0aCBlbmhhbmNlZCBzZWN1cml0eVxuICAgIHRoaXMuYnVja2V0ID0gbmV3IGF3cy5zMy5CdWNrZXQoXG4gICAgICBgJHtuYW1lfS1idWNrZXRgLFxuICAgICAge1xuICAgICAgICBidWNrZXQ6IGFyZ3MuYnVja2V0TmFtZSxcbiAgICAgICAgZm9yY2VEZXN0cm95OiBmYWxzZSxcbiAgICAgICAgb2JqZWN0TG9ja0VuYWJsZWQ6IGFyZ3MuZW5hYmxlT2JqZWN0TG9jayxcbiAgICAgICAgdGFnczogeyAuLi5jb21tb25UYWdzLCAuLi5hcmdzLnRhZ3MgfSxcbiAgICAgIH0sXG4gICAgICB7IHBhcmVudDogdGhpcyB9XG4gICAgKTtcblxuICAgIC8vIEVuYWJsZSB2ZXJzaW9uaW5nIHdpdGggTUZBIGRlbGV0ZSBwcm90ZWN0aW9uIChkaXNhYmxlZCBmb3IgYXV0b21hdGlvbilcbiAgICBuZXcgYXdzLnMzLkJ1Y2tldFZlcnNpb25pbmcoXG4gICAgICBgJHtuYW1lfS12ZXJzaW9uaW5nYCxcbiAgICAgIHtcbiAgICAgICAgYnVja2V0OiB0aGlzLmJ1Y2tldC5pZCxcbiAgICAgICAgdmVyc2lvbmluZ0NvbmZpZ3VyYXRpb246IHtcbiAgICAgICAgICBzdGF0dXM6ICdFbmFibGVkJyxcbiAgICAgICAgICBtZmFEZWxldGU6ICdEaXNhYmxlZCcsIC8vIERpc2FibGVkIGZvciBhdXRvbWF0ZWQgZGVwbG95bWVudHNcbiAgICAgICAgfSxcbiAgICAgIH0sXG4gICAgICB7IHBhcmVudDogdGhpcyB9XG4gICAgKTtcblxuICAgIC8vIENvbmZpZ3VyZSBzZXJ2ZXItc2lkZSBlbmNyeXB0aW9uIHdpdGggYWRkaXRpb25hbCBzZWN1cml0eVxuICAgIG5ldyBhd3MuczMuQnVja2V0U2VydmVyU2lkZUVuY3J5cHRpb25Db25maWd1cmF0aW9uKFxuICAgICAgYCR7bmFtZX0tZW5jcnlwdGlvbmAsXG4gICAgICB7XG4gICAgICAgIGJ1Y2tldDogdGhpcy5idWNrZXQuaWQsXG4gICAgICAgIHJ1bGVzOiBbXG4gICAgICAgICAge1xuICAgICAgICAgICAgYXBwbHlTZXJ2ZXJTaWRlRW5jcnlwdGlvbkJ5RGVmYXVsdDoge1xuICAgICAgICAgICAgICBzc2VBbGdvcml0aG06ICdhd3M6a21zJyxcbiAgICAgICAgICAgICAga21zTWFzdGVyS2V5SWQ6IGFyZ3Mua21zS2V5SWQsXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgYnVja2V0S2V5RW5hYmxlZDogdHJ1ZSxcbiAgICAgICAgICB9LFxuICAgICAgICBdLFxuICAgICAgfSxcbiAgICAgIHsgcGFyZW50OiB0aGlzIH1cbiAgICApO1xuXG4gICAgLy8gQmxvY2sgYWxsIHB1YmxpYyBhY2Nlc3NcbiAgICB0aGlzLnB1YmxpY0FjY2Vzc0Jsb2NrID0gbmV3IGF3cy5zMy5CdWNrZXRQdWJsaWNBY2Nlc3NCbG9jayhcbiAgICAgIGAke25hbWV9LXB1YmxpYy1hY2Nlc3MtYmxvY2tgLFxuICAgICAge1xuICAgICAgICBidWNrZXQ6IHRoaXMuYnVja2V0LmlkLFxuICAgICAgICBibG9ja1B1YmxpY0FjbHM6IHRydWUsXG4gICAgICAgIGJsb2NrUHVibGljUG9saWN5OiB0cnVlLFxuICAgICAgICBpZ25vcmVQdWJsaWNBY2xzOiB0cnVlLFxuICAgICAgICByZXN0cmljdFB1YmxpY0J1Y2tldHM6IHRydWUsXG4gICAgICB9LFxuICAgICAgeyBwYXJlbnQ6IHRoaXMgfVxuICAgICk7XG5cbiAgICAvLyBFbmhhbmNlZCBzZWN1cmUgYnVja2V0IHBvbGljeSB3aXRoIElQIHJlc3RyaWN0aW9ucyAob3B0aW9uYWwpXG4gICAgaWYgKGFyZ3MuZW5hYmxlQnVja2V0UG9saWN5ICE9PSBmYWxzZSkge1xuICAgICAgY29uc3QgYnVja2V0UG9saWN5RG9jdW1lbnQgPSBwdWx1bWlcbiAgICAgICAgLmFsbChbXG4gICAgICAgICAgdGhpcy5idWNrZXQuYXJuLFxuICAgICAgICAgIGF3cy5nZXRDYWxsZXJJZGVudGl0eSgpLnRoZW4oaWQgPT4gaWQuYWNjb3VudElkKSxcbiAgICAgICAgXSlcbiAgICAgICAgLmFwcGx5KChbYnVja2V0QXJuLCBhY2NvdW50SWRdKSA9PiAoe1xuICAgICAgICAgIFZlcnNpb246ICcyMDEyLTEwLTE3JyxcbiAgICAgICAgICBTdGF0ZW1lbnQ6IFtcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgU2lkOiAnQWxsb3dSb290QWNjb3VudEZ1bGxBY2Nlc3MnLFxuICAgICAgICAgICAgICBFZmZlY3Q6ICdBbGxvdycsXG4gICAgICAgICAgICAgIFByaW5jaXBhbDoge1xuICAgICAgICAgICAgICAgIEFXUzogYGFybjphd3M6aWFtOjoke2FjY291bnRJZH06cm9vdGAsXG4gICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgIEFjdGlvbjogJ3MzOionLFxuICAgICAgICAgICAgICBSZXNvdXJjZTogW2J1Y2tldEFybiwgYCR7YnVja2V0QXJufS8qYF0sXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAge1xuICAgICAgICAgICAgICBTaWQ6ICdEZW55SW5zZWN1cmVDb25uZWN0aW9ucycsXG4gICAgICAgICAgICAgIEVmZmVjdDogJ0RlbnknLFxuICAgICAgICAgICAgICBQcmluY2lwYWw6ICcqJyxcbiAgICAgICAgICAgICAgQWN0aW9uOiAnczM6KicsXG4gICAgICAgICAgICAgIFJlc291cmNlOiBbYnVja2V0QXJuLCBgJHtidWNrZXRBcm59LypgXSxcbiAgICAgICAgICAgICAgQ29uZGl0aW9uOiB7XG4gICAgICAgICAgICAgICAgQm9vbDoge1xuICAgICAgICAgICAgICAgICAgJ2F3czpTZWN1cmVUcmFuc3BvcnQnOiAnZmFsc2UnLFxuICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAge1xuICAgICAgICAgICAgICBTaWQ6ICdEZW55VW5lbmNyeXB0ZWRPYmplY3RVcGxvYWRzJyxcbiAgICAgICAgICAgICAgRWZmZWN0OiAnRGVueScsXG4gICAgICAgICAgICAgIFByaW5jaXBhbDogJyonLFxuICAgICAgICAgICAgICBBY3Rpb246ICdzMzpQdXRPYmplY3QnLFxuICAgICAgICAgICAgICBSZXNvdXJjZTogYCR7YnVja2V0QXJufS8qYCxcbiAgICAgICAgICAgICAgQ29uZGl0aW9uOiB7XG4gICAgICAgICAgICAgICAgU3RyaW5nTm90RXF1YWxzOiB7XG4gICAgICAgICAgICAgICAgICAnczM6eC1hbXotc2VydmVyLXNpZGUtZW5jcnlwdGlvbic6ICdhd3M6a21zJyxcbiAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgU2lkOiAnRGVueUluY29ycmVjdEVuY3J5cHRpb25IZWFkZXInLFxuICAgICAgICAgICAgICBFZmZlY3Q6ICdEZW55JyxcbiAgICAgICAgICAgICAgUHJpbmNpcGFsOiAnKicsXG4gICAgICAgICAgICAgIEFjdGlvbjogJ3MzOlB1dE9iamVjdCcsXG4gICAgICAgICAgICAgIFJlc291cmNlOiBgJHtidWNrZXRBcm59LypgLFxuICAgICAgICAgICAgICBDb25kaXRpb246IHtcbiAgICAgICAgICAgICAgICBTdHJpbmdOb3RFcXVhbHM6IHtcbiAgICAgICAgICAgICAgICAgICdzMzp4LWFtei1zZXJ2ZXItc2lkZS1lbmNyeXB0aW9uLWF3cy1rbXMta2V5LWlkJzpcbiAgICAgICAgICAgICAgICAgICAgYXJncy5rbXNLZXlJZCxcbiAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIC8vIE5vdGU6IElQIHJlc3RyaWN0aW9ucyByZW1vdmVkIHRvIHByZXZlbnQgZGVwbG95bWVudCBpc3N1ZXNcbiAgICAgICAgICAgIC8vIENhbiBiZSByZS1lbmFibGVkIHdpdGggcHJvcGVyIGNvbmRpdGlvbiBsb2dpYyBpZiBuZWVkZWRcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgU2lkOiAnRGVueURlbGV0ZVdpdGhvdXRNRkEnLFxuICAgICAgICAgICAgICBFZmZlY3Q6ICdEZW55JyxcbiAgICAgICAgICAgICAgUHJpbmNpcGFsOiAnKicsXG4gICAgICAgICAgICAgIEFjdGlvbjogW1xuICAgICAgICAgICAgICAgICdzMzpEZWxldGVPYmplY3QnLFxuICAgICAgICAgICAgICAgICdzMzpEZWxldGVPYmplY3RWZXJzaW9uJyxcbiAgICAgICAgICAgICAgICAnczM6RGVsZXRlQnVja2V0JyxcbiAgICAgICAgICAgICAgXSxcbiAgICAgICAgICAgICAgUmVzb3VyY2U6IFtidWNrZXRBcm4sIGAke2J1Y2tldEFybn0vKmBdLFxuICAgICAgICAgICAgICBDb25kaXRpb246IHtcbiAgICAgICAgICAgICAgICBCb29sSWZFeGlzdHM6IHtcbiAgICAgICAgICAgICAgICAgICdhd3M6TXVsdGlGYWN0b3JBdXRoUHJlc2VudCc6ICdmYWxzZScsXG4gICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgXS5maWx0ZXIoc3RhdGVtZW50ID0+IHN0YXRlbWVudC5Db25kaXRpb24gIT09IHVuZGVmaW5lZCksXG4gICAgICAgIH0pKTtcblxuICAgICAgdGhpcy5idWNrZXRQb2xpY3kgPSBuZXcgYXdzLnMzLkJ1Y2tldFBvbGljeShcbiAgICAgICAgYCR7bmFtZX0tcG9saWN5YCxcbiAgICAgICAge1xuICAgICAgICAgIGJ1Y2tldDogdGhpcy5idWNrZXQuaWQsXG4gICAgICAgICAgcG9saWN5OiBidWNrZXRQb2xpY3lEb2N1bWVudC5hcHBseShwb2xpY3kgPT4gSlNPTi5zdHJpbmdpZnkocG9saWN5KSksXG4gICAgICAgIH0sXG4gICAgICAgIHsgcGFyZW50OiB0aGlzLCBkZXBlbmRzT246IFt0aGlzLnB1YmxpY0FjY2Vzc0Jsb2NrXSB9XG4gICAgICApO1xuICAgIH1cblxuICAgIC8vIENvbmZpZ3VyZSBlbmhhbmNlZCBsaWZlY3ljbGUgcnVsZXNcbiAgICBpZiAoYXJncy5saWZlY3ljbGVSdWxlcykge1xuICAgICAgbmV3IGF3cy5zMy5CdWNrZXRMaWZlY3ljbGVDb25maWd1cmF0aW9uKFxuICAgICAgICBgJHtuYW1lfS1saWZlY3ljbGVgLFxuICAgICAgICB7XG4gICAgICAgICAgYnVja2V0OiB0aGlzLmJ1Y2tldC5pZCxcbiAgICAgICAgICBydWxlczogW1xuICAgICAgICAgICAgLi4uYXJncy5saWZlY3ljbGVSdWxlcyxcbiAgICAgICAgICAgIC8vIEFkZCBkZWZhdWx0IHJ1bGUgZm9yIGluY29tcGxldGUgbXVsdGlwYXJ0IHVwbG9hZHNcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgaWQ6ICdjbGVhbnVwLWluY29tcGxldGUtdXBsb2FkcycsXG4gICAgICAgICAgICAgIHN0YXR1czogJ0VuYWJsZWQnLFxuICAgICAgICAgICAgICBhYm9ydEluY29tcGxldGVNdWx0aXBhcnRVcGxvYWQ6IHtcbiAgICAgICAgICAgICAgICBkYXlzQWZ0ZXJJbml0aWF0aW9uOiA3LFxuICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIC8vIEFkZCBydWxlIGZvciBvbGQgdmVyc2lvbnMgY2xlYW51cFxuICAgICAgICAgICAge1xuICAgICAgICAgICAgICBpZDogJ2NsZWFudXAtb2xkLXZlcnNpb25zJyxcbiAgICAgICAgICAgICAgc3RhdHVzOiAnRW5hYmxlZCcsXG4gICAgICAgICAgICAgIG5vbmN1cnJlbnRWZXJzaW9uRXhwaXJhdGlvbjoge1xuICAgICAgICAgICAgICAgIG5vbmN1cnJlbnREYXlzOiA5MCxcbiAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgXSxcbiAgICAgICAgfSxcbiAgICAgICAgeyBwYXJlbnQ6IHRoaXMgfVxuICAgICAgKTtcbiAgICB9XG5cbiAgICAvLyBFbmFibGUgYWNjZXNzIGxvZ2dpbmcgaWYgcmVxdWVzdGVkXG4gICAgaWYgKGFyZ3MuZW5hYmxlQWNjZXNzTG9nZ2luZyAmJiB0aGlzLmFjY2Vzc0xvZ3NCdWNrZXQpIHtcbiAgICAgIG5ldyBhd3MuczMuQnVja2V0TG9nZ2luZyhcbiAgICAgICAgYCR7bmFtZX0tbG9nZ2luZ2AsXG4gICAgICAgIHtcbiAgICAgICAgICBidWNrZXQ6IHRoaXMuYnVja2V0LmlkLFxuICAgICAgICAgIHRhcmdldEJ1Y2tldDogdGhpcy5hY2Nlc3NMb2dzQnVja2V0LmlkLFxuICAgICAgICAgIHRhcmdldFByZWZpeDogJ2FjY2Vzcy1sb2dzLycsXG4gICAgICAgICAgLy8gTm90ZTogdGFyZ2V0R3JhbnRzIHJlbW92ZWQgZm9yIGJ1Y2tldCBvd25lciBlbmZvcmNlZCBidWNrZXRzXG4gICAgICAgIH0sXG4gICAgICAgIHsgcGFyZW50OiB0aGlzIH1cbiAgICAgICk7XG4gICAgfVxuXG4gICAgLy8gQ29uZmlndXJlIG9iamVjdCBsb2NrIGlmIGVuYWJsZWRcbiAgICBpZiAoYXJncy5lbmFibGVPYmplY3RMb2NrKSB7XG4gICAgICBuZXcgYXdzLnMzLkJ1Y2tldE9iamVjdExvY2tDb25maWd1cmF0aW9uKFxuICAgICAgICBgJHtuYW1lfS1vYmplY3QtbG9ja2AsXG4gICAgICAgIHtcbiAgICAgICAgICBidWNrZXQ6IHRoaXMuYnVja2V0LmlkLFxuICAgICAgICAgIG9iamVjdExvY2tFbmFibGVkOiAnRW5hYmxlZCcsXG4gICAgICAgICAgcnVsZToge1xuICAgICAgICAgICAgZGVmYXVsdFJldGVudGlvbjoge1xuICAgICAgICAgICAgICBtb2RlOiAnQ09NUExJQU5DRScsXG4gICAgICAgICAgICAgIHllYXJzOiA3LCAvLyA3IHllYXJzIHJldGVudGlvbiBmb3IgY29tcGxpYW5jZVxuICAgICAgICAgICAgfSxcbiAgICAgICAgICB9LFxuICAgICAgICB9LFxuICAgICAgICB7IHBhcmVudDogdGhpcyB9XG4gICAgICApO1xuICAgIH1cblxuICAgIC8vIEVuYWJsZSBub3RpZmljYXRpb25zIGZvciBzZWN1cml0eSBtb25pdG9yaW5nIChvbmx5IGlmIExhbWJkYSBBUk4gaXMgcHJvdmlkZWQpXG4gICAgaWYgKGFyZ3MuZW5hYmxlTm90aWZpY2F0aW9ucyAmJiBhcmdzLmxhbWJkYUZ1bmN0aW9uQXJuKSB7XG4gICAgICB0aGlzLm5vdGlmaWNhdGlvbiA9IG5ldyBhd3MuczMuQnVja2V0Tm90aWZpY2F0aW9uKFxuICAgICAgICBgJHtuYW1lfS1ub3RpZmljYXRpb25gLFxuICAgICAgICB7XG4gICAgICAgICAgYnVja2V0OiB0aGlzLmJ1Y2tldC5pZCxcbiAgICAgICAgICBsYW1iZGFGdW5jdGlvbnM6IFtcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgZXZlbnRzOiBbXG4gICAgICAgICAgICAgICAgJ3MzOk9iamVjdENyZWF0ZWQ6KicsXG4gICAgICAgICAgICAgICAgJ3MzOk9iamVjdFJlbW92ZWQ6KicsXG4gICAgICAgICAgICAgICAgJ3MzOk9iamVjdFJlc3RvcmU6KicsXG4gICAgICAgICAgICAgIF0sXG4gICAgICAgICAgICAgIGxhbWJkYUZ1bmN0aW9uQXJuOiBhcmdzLmxhbWJkYUZ1bmN0aW9uQXJuLFxuICAgICAgICAgICAgfSxcbiAgICAgICAgICBdLFxuICAgICAgICB9LFxuICAgICAgICB7IHBhcmVudDogdGhpcyB9XG4gICAgICApO1xuICAgIH1cblxuICAgIC8vIEVuYWJsZSByZXF1ZXN0IG1ldHJpY3MgZm9yIG1vbml0b3JpbmdcbiAgICBuZXcgYXdzLnMzLkJ1Y2tldE1ldHJpYyhcbiAgICAgIGAke25hbWV9LW1ldHJpY3NgLFxuICAgICAge1xuICAgICAgICBidWNrZXQ6IHRoaXMuYnVja2V0LmlkLFxuICAgICAgICBuYW1lOiAnRW50aXJlQnVja2V0JyxcbiAgICAgIH0sXG4gICAgICB7IHBhcmVudDogdGhpcyB9XG4gICAgKTtcblxuICAgIC8vIE5vdGU6IEJ1Y2tldEludmVudG9yeSBpcyBub3QgYXZhaWxhYmxlIGluIGN1cnJlbnQgUHVsdW1pIEFXUyB2ZXJzaW9uXG4gICAgLy8gVGhpcyB3b3VsZCBiZSBhZGRlZCB3aGVuIHRoZSByZXNvdXJjZSBiZWNvbWVzIGF2YWlsYWJsZVxuXG4gICAgdGhpcy5yZWdpc3Rlck91dHB1dHMoe1xuICAgICAgYnVja2V0TmFtZTogdGhpcy5idWNrZXQuaWQsXG4gICAgICBidWNrZXRBcm46IHRoaXMuYnVja2V0LmFybixcbiAgICAgIGJ1Y2tldERvbWFpbk5hbWU6IHRoaXMuYnVja2V0LmJ1Y2tldERvbWFpbk5hbWUsXG4gICAgICBhY2Nlc3NMb2dzQnVja2V0TmFtZTogdGhpcy5hY2Nlc3NMb2dzQnVja2V0Py5pZCxcbiAgICAgIGFjY2Vzc0xvZ3NCdWNrZXRBcm46IHRoaXMuYWNjZXNzTG9nc0J1Y2tldD8uYXJuLFxuICAgIH0pO1xuICB9XG59XG4iXX0=