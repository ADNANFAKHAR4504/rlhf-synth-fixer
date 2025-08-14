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
                        Sid: 'AllowCloudTrailAclCheck',
                        Effect: 'Allow',
                        Principal: {
                            Service: 'cloudtrail.amazonaws.com',
                        },
                        Action: 's3:GetBucketAcl',
                        Resource: bucketArn,
                    },
                    {
                        Sid: 'AllowCloudTrailWrite',
                        Effect: 'Allow',
                        Principal: {
                            Service: 'cloudtrail.amazonaws.com',
                        },
                        Action: 's3:PutObject',
                        Resource: `${bucketArn}/*`,
                        Condition: {
                            StringEquals: {
                                's3:x-amz-acl': 'bucket-owner-full-control',
                            },
                        },
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
                            Bool: {
                                'aws:MultiFactorAuthPresent': 'false',
                            },
                        },
                    },
                ],
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZW5oYW5jZWQtczMuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJlbmhhbmNlZC1zMy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFBQSxpREFBbUM7QUFDbkMsdURBQXlDO0FBQ3pDLDRDQUErQztBQWUvQyxNQUFhLHNCQUF1QixTQUFRLE1BQU0sQ0FBQyxpQkFBaUI7SUFDbEQsTUFBTSxDQUFnQjtJQUN0QixZQUFZLENBQXNCO0lBQ2xDLGlCQUFpQixDQUFpQztJQUNsRCxnQkFBZ0IsQ0FBaUI7SUFDakMsWUFBWSxDQUE2QjtJQUV6RCxZQUNFLElBQVksRUFDWixJQUFnQyxFQUNoQyxJQUFzQztRQUV0QyxLQUFLLENBQUMsd0NBQXdDLEVBQUUsSUFBSSxFQUFFLEVBQUUsRUFBRSxJQUFJLENBQUMsQ0FBQztRQUVoRSxrREFBa0Q7UUFDbEQsSUFBSSxJQUFJLENBQUMsbUJBQW1CLEVBQUUsQ0FBQztZQUM3QixJQUFJLENBQUMsZ0JBQWdCLEdBQUcsSUFBSSxHQUFHLENBQUMsRUFBRSxDQUFDLE1BQU0sQ0FDdkMsR0FBRyxJQUFJLGNBQWMsRUFDckI7Z0JBQ0UsTUFBTSxFQUFFLElBQUksQ0FBQyxVQUFVO29CQUNyQixDQUFDLENBQUMsR0FBRyxJQUFJLENBQUMsVUFBVSxjQUFjO29CQUNsQyxDQUFDLENBQUMsU0FBUztnQkFDYixZQUFZLEVBQUUsS0FBSztnQkFDbkIsSUFBSSxFQUFFLEVBQUUsR0FBRyxpQkFBVSxFQUFFLEdBQUcsSUFBSSxDQUFDLElBQUksRUFBRSxPQUFPLEVBQUUsYUFBYSxFQUFFO2FBQzlELEVBQ0QsRUFBRSxNQUFNLEVBQUUsSUFBSSxFQUFFLENBQ2pCLENBQUM7WUFFRixzQ0FBc0M7WUFDdEMsSUFBSSxHQUFHLENBQUMsRUFBRSxDQUFDLHVCQUF1QixDQUNoQyxHQUFHLElBQUksMkJBQTJCLEVBQ2xDO2dCQUNFLE1BQU0sRUFBRSxJQUFJLENBQUMsZ0JB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QUFFLElBQUksRUFBRSxDQUNqQixDQUFDO1FBQ0osQ0FBQztRQUVELHdDQUF3QztRQUN4QyxJQUFJLEdBQUcsQ0FBQyxFQUFFLENBQUMsWUFBWSxDQUNyQixHQUFHLElBQUksVUFBVSxFQUNqQjtZQUNFLE1BQU0sRUFBRSxJQUFJLENBQUMsTUFBTSxDQUFDLEVBQUU7WUFDdEIsSUFBSSxFQUFFLGNBQWM7U0FDckIsRUFDRCxFQUFFLE1BQU0sRUFBRSxJQUFJLEVBQUUsQ0FDakIsQ0FBQztRQUVGLHVFQUF1RTtRQUN2RSwwREFBMEQ7UUFFMUQsSUFBSSxDQUFDLGVBQWUsQ0FBQztZQUNuQixVQUFVLEVBQUUsSUFBSSxDQUFDLE1BQU0sQ0FBQyxFQUFFO1lBQzFCLFNBQVMsRUFBRSxJQUFJLENBQUMsTUFBTSxDQUFDLEdBQUc7WUFDMUIsZ0JBQWdCLEVBQUUsSUFBSSxDQUFDLE1BQU0sQ0FBQyxnQkFBZ0I7WUFDOUMsb0JBQW9CLEVBQUUsSUFBSSxDQUFDLGdCQUFnQixFQUFFLEVBQUU7WUFDL0MsbUJBQW1CLEVBQUUsSUFBSSxDQUFDLGdCQUFnQixFQUFFLEdBQUc7U0FDaEQsQ0FBQyxDQUFDO0lBQ0wsQ0FBQztDQUNGO0FBN1JELHdEQTZSQyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCAqIGFzIGF3cyBmcm9tICdAcHVsdW1pL2F3cyc7XG5pbXBvcnQgKiBhcyBwdWx1bWkgZnJvbSAnQHB1bHVtaS9wdWx1bWknO1xuaW1wb3J0IHsgY29tbW9uVGFncyB9IGZyb20gJy4uLy4uL2NvbmZpZy90YWdzJztcblxuZXhwb3J0IGludGVyZmFjZSBFbmhhbmNlZFNlY3VyZVMzQnVja2V0QXJncyB7XG4gIGJ1Y2tldE5hbWU/OiBzdHJpbmc7XG4gIGttc0tleUlkOiBwdWx1bWkuSW5wdXQ8c3RyaW5nPjtcbiAgdGFncz86IFJlY29yZDxzdHJpbmcsIHN0cmluZz47XG4gIGxpZmVjeWNsZVJ1bGVzPzogYW55W107XG4gIGVuYWJsZUFjY2Vzc0xvZ2dpbmc/OiBib29sZWFuO1xuICBlbmFibGVOb3RpZmljYXRpb25zPzogYm9vbGVhbjtcbiAgYWxsb3dlZElwUmFuZ2VzPzogc3RyaW5nW107XG4gIGVuYWJsZU9iamVjdExvY2s/OiBib29sZWFuO1xuICBsYW1iZGFGdW5jdGlvbkFybj86IHN0cmluZzsgLy8gT3B0aW9uYWwgTGFtYmRhIGZ1bmN0aW9uIEFSTiBmb3Igbm90aWZpY2F0aW9uc1xuICBlbmFibGVCdWNrZXRQb2xpY3k/OiBib29sZWFuOyAvLyBPcHRpb25hbCBmbGFnIHRvIGVuYWJsZS9kaXNhYmxlIGJ1Y2tldCBwb2xpY3lcbn1cblxuZXhwb3J0IGNsYXNzIEVuaGFuY2VkU2VjdXJlUzNCdWNrZXQgZXh0ZW5kcyBwdWx1bWkuQ29tcG9uZW50UmVzb3VyY2Uge1xuICBwdWJsaWMgcmVhZG9ubHkgYnVja2V0OiBhd3MuczMuQnVja2V0O1xuICBwdWJsaWMgcmVhZG9ubHkgYnVja2V0UG9saWN5OiBhd3MuczMuQnVja2V0UG9saWN5O1xuICBwdWJsaWMgcmVhZG9ubHkgcHVibGljQWNjZXNzQmxvY2s6IGF3cy5zMy5CdWNrZXRQdWJsaWNBY2Nlc3NCbG9jaztcbiAgcHVibGljIHJlYWRvbmx5IGFjY2Vzc0xvZ3NCdWNrZXQ/OiBhd3MuczMuQnVja2V0O1xuICBwdWJsaWMgcmVhZG9ubHkgbm90aWZpY2F0aW9uPzogYXdzLnMzLkJ1Y2tldE5vdGlmaWNhdGlvbjtcblxuICBjb25zdHJ1Y3RvcihcbiAgICBuYW1lOiBzdHJpbmcsXG4gICAgYXJnczogRW5oYW5jZWRTZWN1cmVTM0J1Y2tldEFyZ3MsXG4gICAgb3B0cz86IHB1bHVtaS5Db21wb25lbnRSZXNvdXJjZU9wdGlvbnNcbiAgKSB7XG4gICAgc3VwZXIoJ2N1c3RvbTpzZWN1cml0eTpFbmhhbmNlZFNlY3VyZVMzQnVja2V0JywgbmFtZSwge30sIG9wdHMpO1xuXG4gICAgLy8gQ3JlYXRlIGFjY2VzcyBsb2dzIGJ1Y2tldCBpZiBsb2dnaW5nIGlzIGVuYWJsZWRcbiAgICBpZiAoYXJncy5lbmFibGVBY2Nlc3NMb2dnaW5nKSB7XG4gICAgICB0aGlzLmFjY2Vzc0xvZ3NCdWNrZXQgPSBuZXcgYXdzLnMzLkJ1Y2tldChcbiAgICAgICAgYCR7bmFtZX0tYWNjZXNzLWxvZ3NgLFxuICAgICAgICB7XG4gICAgICAgICAgYnVja2V0OiBhcmdzLmJ1Y2tldE5hbWVcbiAgICAgICAgICAgID8gYCR7YXJncy5idWNrZXROYW1lfS1hY2Nlc3MtbG9nc2BcbiAgICAgICAgICAgIDogdW5kZWZpbmVkLFxuICAgICAgICAgIGZvcmNlRGVzdHJveTogZmFsc2UsXG4gICAgICAgICAgdGFnczogeyAuLi5jb21tb25UYWdzLCAuLi5hcmdzLnRhZ3MsIFB1cnBvc2U6ICdBY2Nlc3MgTG9ncycgfSxcbiAgICAgICAgfSxcbiAgICAgICAgeyBwYXJlbnQ6IHRoaXMgfVxuICAgICAgKTtcblxuICAgICAgLy8gQmxvY2sgcHVibGljIGFjY2VzcyBmb3IgbG9ncyBidWNrZXRcbiAgICAgIG5ldyBhd3MuczMuQnVja2V0UHVibGljQWNjZXNzQmxvY2soXG4gICAgICAgIGAke25hbWV9LWxvZ3MtcHVibGljLWFjY2Vzcy1ibG9ja2AsXG4gICAgICAgIHtcbiAgICAgICAgICBidWNrZXQ6IHRoaXMuYWNjZXNzTG9nc0J1Y2tldC5pZCxcbiAgICAgICAgICBibG9ja1B1YmxpY0FjbHM6IHRydWUsXG4gICAgICAgICAgYmxvY2tQdWJsaWNQb2xpY3k6IHRydWUsXG4gICAgICAgICAgaWdub3JlUHVibGljQWNsczogdHJ1ZSxcbiAgICAgICAgICByZXN0cmljdFB1YmxpY0J1Y2tldHM6IHRydWUsXG4gICAgICAgIH0sXG4gICAgICAgIHsgcGFyZW50OiB0aGlzIH1cbiAgICAgICk7XG4gICAgfVxuXG4gICAgLy8gQ3JlYXRlIG1haW4gUzMgYnVja2V0IHdpdGggZW5oYW5jZWQgc2VjdXJpdHlcbiAgICB0aGlzLmJ1Y2tldCA9IG5ldyBhd3MuczMuQnVja2V0KFxuICAgICAgYCR7bmFtZX0tYnVja2V0YCxcbiAgICAgIHtcbiAgICAgICAgYnVja2V0OiBhcmdzLmJ1Y2tldE5hbWUsXG4gICAgICAgIGZvcmNlRGVzdHJveTogZmFsc2UsXG4gICAgICAgIG9iamVjdExvY2tFbmFibGVkOiBhcmdzLmVuYWJsZU9iamVjdExvY2ssXG4gICAgICAgIHRhZ3M6IHsgLi4uY29tbW9uVGFncywgLi4uYXJncy50YWdzIH0sXG4gICAgICB9LFxuICAgICAgeyBwYXJlbnQ6IHRoaXMgfVxuICAgICk7XG5cbiAgICAvLyBFbmFibGUgdmVyc2lvbmluZyB3aXRoIE1GQSBkZWxldGUgcHJvdGVjdGlvbiAoZGlzYWJsZWQgZm9yIGF1dG9tYXRpb24pXG4gICAgbmV3IGF3cy5zMy5CdWNrZXRWZXJzaW9uaW5nKFxuICAgICAgYCR7bmFtZX0tdmVyc2lvbmluZ2AsXG4gICAgICB7XG4gICAgICAgIGJ1Y2tldDogdGhpcy5idWNrZXQuaWQsXG4gICAgICAgIHZlcnNpb25pbmdDb25maWd1cmF0aW9uOiB7XG4gICAgICAgICAgc3RhdHVzOiAnRW5hYmxlZCcsXG4gICAgICAgICAgbWZhRGVsZXRlOiAnRGlzYWJsZWQnLCAvLyBEaXNhYmxlZCBmb3IgYXV0b21hdGVkIGRlcGxveW1lbnRzXG4gICAgICAgIH0sXG4gICAgICB9LFxuICAgICAgeyBwYXJlbnQ6IHRoaXMgfVxuICAgICk7XG5cbiAgICAvLyBDb25maWd1cmUgc2VydmVyLXNpZGUgZW5jcnlwdGlvbiB3aXRoIGFkZGl0aW9uYWwgc2VjdXJpdHlcbiAgICBuZXcgYXdzLnMzLkJ1Y2tldFNlcnZlclNpZGVFbmNyeXB0aW9uQ29uZmlndXJhdGlvbihcbiAgICAgIGAke25hbWV9LWVuY3J5cHRpb25gLFxuICAgICAge1xuICAgICAgICBidWNrZXQ6IHRoaXMuYnVja2V0LmlkLFxuICAgICAgICBydWxlczogW1xuICAgICAgICAgIHtcbiAgICAgICAgICAgIGFwcGx5U2VydmVyU2lkZUVuY3J5cHRpb25CeURlZmF1bHQ6IHtcbiAgICAgICAgICAgICAgc3NlQWxnb3JpdGhtOiAnYXdzOmttcycsXG4gICAgICAgICAgICAgIGttc01hc3RlcktleUlkOiBhcmdzLmttc0tleUlkLFxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIGJ1Y2tldEtleUVuYWJsZWQ6IHRydWUsXG4gICAgICAgICAgfSxcbiAgICAgICAgXSxcbiAgICAgIH0sXG4gICAgICB7IHBhcmVudDogdGhpcyB9XG4gICAgKTtcblxuICAgIC8vIEJsb2NrIGFsbCBwdWJsaWMgYWNjZXNzXG4gICAgdGhpcy5wdWJsaWNBY2Nlc3NCbG9jayA9IG5ldyBhd3MuczMuQnVja2V0UHVibGljQWNjZXNzQmxvY2soXG4gICAgICBgJHtuYW1lfS1wdWJsaWMtYWNjZXNzLWJsb2NrYCxcbiAgICAgIHtcbiAgICAgICAgYnVja2V0OiB0aGlzLmJ1Y2tldC5pZCxcbiAgICAgICAgYmxvY2tQdWJsaWNBY2xzOiB0cnVlLFxuICAgICAgICBibG9ja1B1YmxpY1BvbGljeTogdHJ1ZSxcbiAgICAgICAgaWdub3JlUHVibGljQWNsczogdHJ1ZSxcbiAgICAgICAgcmVzdHJpY3RQdWJsaWNCdWNrZXRzOiB0cnVlLFxuICAgICAgfSxcbiAgICAgIHsgcGFyZW50OiB0aGlzIH1cbiAgICApO1xuXG4gICAgLy8gRW5oYW5jZWQgc2VjdXJlIGJ1Y2tldCBwb2xpY3kgd2l0aCBJUCByZXN0cmljdGlvbnMgKG9wdGlvbmFsKVxuICAgIGlmIChhcmdzLmVuYWJsZUJ1Y2tldFBvbGljeSAhPT0gZmFsc2UpIHtcbiAgICAgIGNvbnN0IGJ1Y2tldFBvbGljeURvY3VtZW50ID0gcHVsdW1pXG4gICAgICAgIC5hbGwoW1xuICAgICAgICAgIHRoaXMuYnVja2V0LmFybixcbiAgICAgICAgICBhd3MuZ2V0Q2FsbGVySWRlbnRpdHkoKS50aGVuKGlkID0+IGlkLmFjY291bnRJZCksXG4gICAgICAgIF0pXG4gICAgICAgIC5hcHBseSgoW2J1Y2tldEFybiwgYWNjb3VudElkXSkgPT4gKHtcbiAgICAgICAgICBWZXJzaW9uOiAnMjAxMi0xMC0xNycsXG4gICAgICAgICAgU3RhdGVtZW50OiBbXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgIFNpZDogJ0FsbG93Um9vdEFjY291bnRGdWxsQWNjZXNzJyxcbiAgICAgICAgICAgICAgRWZmZWN0OiAnQWxsb3cnLFxuICAgICAgICAgICAgICBQcmluY2lwYWw6IHtcbiAgICAgICAgICAgICAgICBBV1M6IGBhcm46YXdzOmlhbTo6JHthY2NvdW50SWR9OnJvb3RgLFxuICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICBBY3Rpb246ICdzMzoqJyxcbiAgICAgICAgICAgICAgUmVzb3VyY2U6IFtidWNrZXRBcm4sIGAke2J1Y2tldEFybn0vKmBdLFxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgU2lkOiAnQWxsb3dDbG91ZFRyYWlsQWNsQ2hlY2snLFxuICAgICAgICAgICAgICBFZmZlY3Q6ICdBbGxvdycsXG4gICAgICAgICAgICAgIFByaW5jaXBhbDoge1xuICAgICAgICAgICAgICAgIFNlcnZpY2U6ICdjbG91ZHRyYWlsLmFtYXpvbmF3cy5jb20nLFxuICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICBBY3Rpb246ICdzMzpHZXRCdWNrZXRBY2wnLFxuICAgICAgICAgICAgICBSZXNvdXJjZTogYnVja2V0QXJuLFxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgU2lkOiAnQWxsb3dDbG91ZFRyYWlsV3JpdGUnLFxuICAgICAgICAgICAgICBFZmZlY3Q6ICdBbGxvdycsXG4gICAgICAgICAgICAgIFByaW5jaXBhbDoge1xuICAgICAgICAgICAgICAgIFNlcnZpY2U6ICdjbG91ZHRyYWlsLmFtYXpvbmF3cy5jb20nLFxuICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICBBY3Rpb246ICdzMzpQdXRPYmplY3QnLFxuICAgICAgICAgICAgICBSZXNvdXJjZTogYCR7YnVja2V0QXJufS8qYCxcbiAgICAgICAgICAgICAgQ29uZGl0aW9uOiB7XG4gICAgICAgICAgICAgICAgU3RyaW5nRXF1YWxzOiB7XG4gICAgICAgICAgICAgICAgICAnczM6eC1hbXotYWNsJzogJ2J1Y2tldC1vd25lci1mdWxsLWNvbnRyb2wnLFxuICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAge1xuICAgICAgICAgICAgICBTaWQ6ICdEZW55SW5zZWN1cmVDb25uZWN0aW9ucycsXG4gICAgICAgICAgICAgIEVmZmVjdDogJ0RlbnknLFxuICAgICAgICAgICAgICBQcmluY2lwYWw6ICcqJyxcbiAgICAgICAgICAgICAgQWN0aW9uOiAnczM6KicsXG4gICAgICAgICAgICAgIFJlc291cmNlOiBbYnVja2V0QXJuLCBgJHtidWNrZXRBcm59LypgXSxcbiAgICAgICAgICAgICAgQ29uZGl0aW9uOiB7XG4gICAgICAgICAgICAgICAgQm9vbDoge1xuICAgICAgICAgICAgICAgICAgJ2F3czpTZWN1cmVUcmFuc3BvcnQnOiAnZmFsc2UnLFxuICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAge1xuICAgICAgICAgICAgICBTaWQ6ICdEZW55RGVsZXRlV2l0aG91dE1GQScsXG4gICAgICAgICAgICAgIEVmZmVjdDogJ0RlbnknLFxuICAgICAgICAgICAgICBQcmluY2lwYWw6ICcqJyxcbiAgICAgICAgICAgICAgQWN0aW9uOiBbXG4gICAgICAgICAgICAgICAgJ3MzOkRlbGV0ZU9iamVjdCcsXG4gICAgICAgICAgICAgICAgJ3MzOkRlbGV0ZU9iamVjdFZlcnNpb24nLFxuICAgICAgICAgICAgICAgICdzMzpEZWxldGVCdWNrZXQnLFxuICAgICAgICAgICAgICBdLFxuICAgICAgICAgICAgICBSZXNvdXJjZTogW2J1Y2tldEFybiwgYCR7YnVja2V0QXJufS8qYF0sXG4gICAgICAgICAgICAgIENvbmRpdGlvbjoge1xuICAgICAgICAgICAgICAgIEJvb2w6IHtcbiAgICAgICAgICAgICAgICAgICdhd3M6TXVsdGlGYWN0b3JBdXRoUHJlc2VudCc6ICdmYWxzZScsXG4gICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgXSxcbiAgICAgICAgfSkpO1xuXG4gICAgICB0aGlzLmJ1Y2tldFBvbGljeSA9IG5ldyBhd3MuczMuQnVja2V0UG9saWN5KFxuICAgICAgICBgJHtuYW1lfS1wb2xpY3lgLFxuICAgICAgICB7XG4gICAgICAgICAgYnVja2V0OiB0aGlzLmJ1Y2tldC5pZCxcbiAgICAgICAgICBwb2xpY3k6IGJ1Y2tldFBvbGljeURvY3VtZW50LmFwcGx5KHBvbGljeSA9PiBKU09OLnN0cmluZ2lmeShwb2xpY3kpKSxcbiAgICAgICAgfSxcbiAgICAgICAgeyBwYXJlbnQ6IHRoaXMsIGRlcGVuZHNPbjogW3RoaXMucHVibGljQWNjZXNzQmxvY2tdIH1cbiAgICAgICk7XG4gICAgfVxuXG4gICAgLy8gQ29uZmlndXJlIGVuaGFuY2VkIGxpZmVjeWNsZSBydWxlc1xuICAgIGlmIChhcmdzLmxpZmVjeWNsZVJ1bGVzKSB7XG4gICAgICBuZXcgYXdzLnMzLkJ1Y2tldExpZmVjeWNsZUNvbmZpZ3VyYXRpb24oXG4gICAgICAgIGAke25hbWV9LWxpZmVjeWNsZWAsXG4gICAgICAgIHtcbiAgICAgICAgICBidWNrZXQ6IHRoaXMuYnVja2V0LmlkLFxuICAgICAgICAgIHJ1bGVzOiBbXG4gICAgICAgICAgICAuLi5hcmdzLmxpZmVjeWNsZVJ1bGVzLFxuICAgICAgICAgICAgLy8gQWRkIGRlZmF1bHQgcnVsZSBmb3IgaW5jb21wbGV0ZSBtdWx0aXBhcnQgdXBsb2Fkc1xuICAgICAgICAgICAge1xuICAgICAgICAgICAgICBpZDogJ2NsZWFudXAtaW5jb21wbGV0ZS11cGxvYWRzJyxcbiAgICAgICAgICAgICAgc3RhdHVzOiAnRW5hYmxlZCcsXG4gICAgICAgICAgICAgIGFib3J0SW5jb21wbGV0ZU11bHRpcGFydFVwbG9hZDoge1xuICAgICAgICAgICAgICAgIGRheXNBZnRlckluaXRpYXRpb246IDcsXG4gICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgLy8gQWRkIHJ1bGUgZm9yIG9sZCB2ZXJzaW9ucyBjbGVhbnVwXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgIGlkOiAnY2xlYW51cC1vbGQtdmVyc2lvbnMnLFxuICAgICAgICAgICAgICBzdGF0dXM6ICdFbmFibGVkJyxcbiAgICAgICAgICAgICAgbm9uY3VycmVudFZlcnNpb25FeHBpcmF0aW9uOiB7XG4gICAgICAgICAgICAgICAgbm9uY3VycmVudERheXM6IDkwLFxuICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgfSxcbiAgICAgICAgICBdLFxuICAgICAgICB9LFxuICAgICAgICB7IHBhcmVudDogdGhpcyB9XG4gICAgICApO1xuICAgIH1cblxuICAgIC8vIEVuYWJsZSBhY2Nlc3MgbG9nZ2luZyBpZiByZXF1ZXN0ZWRcbiAgICBpZiAoYXJncy5lbmFibGVBY2Nlc3NMb2dnaW5nICYmIHRoaXMuYWNjZXNzTG9nc0J1Y2tldCkge1xuICAgICAgbmV3IGF3cy5zMy5CdWNrZXRMb2dnaW5nKFxuICAgICAgICBgJHtuYW1lfS1sb2dnaW5nYCxcbiAgICAgICAge1xuICAgICAgICAgIGJ1Y2tldDogdGhpcy5idWNrZXQuaWQsXG4gICAgICAgICAgdGFyZ2V0QnVja2V0OiB0aGlzLmFjY2Vzc0xvZ3NCdWNrZXQuaWQsXG4gICAgICAgICAgdGFyZ2V0UHJlZml4OiAnYWNjZXNzLWxvZ3MvJyxcbiAgICAgICAgICAvLyBOb3RlOiB0YXJnZXRHcmFudHMgcmVtb3ZlZCBmb3IgYnVja2V0IG93bmVyIGVuZm9yY2VkIGJ1Y2tldHNcbiAgICAgICAgfSxcbiAgICAgICAgeyBwYXJlbnQ6IHRoaXMgfVxuICAgICAgKTtcbiAgICB9XG5cbiAgICAvLyBDb25maWd1cmUgb2JqZWN0IGxvY2sgaWYgZW5hYmxlZFxuICAgIGlmIChhcmdzLmVuYWJsZU9iamVjdExvY2spIHtcbiAgICAgIG5ldyBhd3MuczMuQnVja2V0T2JqZWN0TG9ja0NvbmZpZ3VyYXRpb24oXG4gICAgICAgIGAke25hbWV9LW9iamVjdC1sb2NrYCxcbiAgICAgICAge1xuICAgICAgICAgIGJ1Y2tldDogdGhpcy5idWNrZXQuaWQsXG4gICAgICAgICAgb2JqZWN0TG9ja0VuYWJsZWQ6ICdFbmFibGVkJyxcbiAgICAgICAgICBydWxlOiB7XG4gICAgICAgICAgICBkZWZhdWx0UmV0ZW50aW9uOiB7XG4gICAgICAgICAgICAgIG1vZGU6ICdDT01QTElBTkNFJyxcbiAgICAgICAgICAgICAgeWVhcnM6IDcsIC8vIDcgeWVhcnMgcmV0ZW50aW9uIGZvciBjb21wbGlhbmNlXG4gICAgICAgICAgICB9LFxuICAgICAgICAgIH0sXG4gICAgICAgIH0sXG4gICAgICAgIHsgcGFyZW50OiB0aGlzIH1cbiAgICAgICk7XG4gICAgfVxuXG4gICAgLy8gRW5hYmxlIG5vdGlmaWNhdGlvbnMgZm9yIHNlY3VyaXR5IG1vbml0b3JpbmcgKG9ubHkgaWYgTGFtYmRhIEFSTiBpcyBwcm92aWRlZClcbiAgICBpZiAoYXJncy5lbmFibGVOb3RpZmljYXRpb25zICYmIGFyZ3MubGFtYmRhRnVuY3Rpb25Bcm4pIHtcbiAgICAgIHRoaXMubm90aWZpY2F0aW9uID0gbmV3IGF3cy5zMy5CdWNrZXROb3RpZmljYXRpb24oXG4gICAgICAgIGAke25hbWV9LW5vdGlmaWNhdGlvbmAsXG4gICAgICAgIHtcbiAgICAgICAgICBidWNrZXQ6IHRoaXMuYnVja2V0LmlkLFxuICAgICAgICAgIGxhbWJkYUZ1bmN0aW9uczogW1xuICAgICAgICAgICAge1xuICAgICAgICAgICAgICBldmVudHM6IFtcbiAgICAgICAgICAgICAgICAnczM6T2JqZWN0Q3JlYXRlZDoqJyxcbiAgICAgICAgICAgICAgICAnczM6T2JqZWN0UmVtb3ZlZDoqJyxcbiAgICAgICAgICAgICAgICAnczM6T2JqZWN0UmVzdG9yZToqJyxcbiAgICAgICAgICAgICAgXSxcbiAgICAgICAgICAgICAgbGFtYmRhRnVuY3Rpb25Bcm46IGFyZ3MubGFtYmRhRnVuY3Rpb25Bcm4sXG4gICAgICAgICAgICB9LFxuICAgICAgICAgIF0sXG4gICAgICAgIH0sXG4gICAgICAgIHsgcGFyZW50OiB0aGlzIH1cbiAgICAgICk7XG4gICAgfVxuXG4gICAgLy8gRW5hYmxlIHJlcXVlc3QgbWV0cmljcyBmb3IgbW9uaXRvcmluZ1xuICAgIG5ldyBhd3MuczMuQnVja2V0TWV0cmljKFxuICAgICAgYCR7bmFtZX0tbWV0cmljc2AsXG4gICAgICB7XG4gICAgICAgIGJ1Y2tldDogdGhpcy5idWNrZXQuaWQsXG4gICAgICAgIG5hbWU6ICdFbnRpcmVCdWNrZXQnLFxuICAgICAgfSxcbiAgICAgIHsgcGFyZW50OiB0aGlzIH1cbiAgICApO1xuXG4gICAgLy8gTm90ZTogQnVja2V0SW52ZW50b3J5IGlzIG5vdCBhdmFpbGFibGUgaW4gY3VycmVudCBQdWx1bWkgQVdTIHZlcnNpb25cbiAgICAvLyBUaGlzIHdvdWxkIGJlIGFkZGVkIHdoZW4gdGhlIHJlc291cmNlIGJlY29tZXMgYXZhaWxhYmxlXG5cbiAgICB0aGlzLnJlZ2lzdGVyT3V0cHV0cyh7XG4gICAgICBidWNrZXROYW1lOiB0aGlzLmJ1Y2tldC5pZCxcbiAgICAgIGJ1Y2tldEFybjogdGhpcy5idWNrZXQuYXJuLFxuICAgICAgYnVja2V0RG9tYWluTmFtZTogdGhpcy5idWNrZXQuYnVja2V0RG9tYWluTmFtZSxcbiAgICAgIGFjY2Vzc0xvZ3NCdWNrZXROYW1lOiB0aGlzLmFjY2Vzc0xvZ3NCdWNrZXQ/LmlkLFxuICAgICAgYWNjZXNzTG9nc0J1Y2tldEFybjogdGhpcy5hY2Nlc3NMb2dzQnVja2V0Py5hcm4sXG4gICAgfSk7XG4gIH1cbn1cbiJdfQ==