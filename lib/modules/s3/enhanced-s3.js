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
            this.accessLogsBucket = new aws.s3.BucketV2(`${name}-access-logs`, {
                bucket: `${args.bucketName || name}-access-logs`,
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
        this.bucket = new aws.s3.BucketV2(`${name}-bucket`, {
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
            new aws.s3.BucketObjectLockConfigurationV2(`${name}-object-lock`, {
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZW5oYW5jZWQtczMuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJlbmhhbmNlZC1zMy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFBQSxpREFBbUM7QUFDbkMsdURBQXlDO0FBQ3pDLDRDQUErQztBQWEvQyxNQUFhLHNCQUF1QixTQUFRLE1BQU0sQ0FBQyxpQkFBaUI7SUFDbEQsTUFBTSxDQUFrQjtJQUN4QixZQUFZLENBQXNCO0lBQ2xDLGlCQUFpQixDQUFpQztJQUNsRCxnQkFBZ0IsQ0FBbUI7SUFDbkMsWUFBWSxDQUE2QjtJQUV6RCxZQUNFLElBQVksRUFDWixJQUFnQyxFQUNoQyxJQUFzQztRQUV0QyxLQUFLLENBQUMsd0NBQXdDLEVBQUUsSUFBSSxFQUFFLEVBQUUsRUFBRSxJQUFJLENBQUMsQ0FBQztRQUVoRSxrREFBa0Q7UUFDbEQsSUFBSSxJQUFJLENBQUMsbUJBQW1CLEVBQUUsQ0FBQztZQUM3QixJQUFJLENBQUMsZ0JBQWdCLEdBQUcsSUFBSSxHQUFHLENBQUMsRUFBRSxDQUFDLFFBQVEsQ0FDekMsR0FBRyxJQUFJLGNBQWMsRUFDckI7Z0JBQ0UsTUFBTSxFQUFFLEdBQUcsSUFBSSxDQUFDLFVBQVUsSUFBSSxJQUFJLGNBQWM7Z0JBQ2hELFlBQVksRUFBRSxLQUFLO2dCQUNuQixJQUFJLEVBQUUsRUFBRSxHQUFHLGlCQUFVLEVBQUUsR0FBRyxJQUFJLENBQUMsSUFBSSxFQUFFLE9BQU8sRUFBRSxhQUFhLEVBQUU7YUFDOUQsRUFDRCxFQUFFLE1BQU0sRUFBRSxJQUFJLEVBQUUsQ0FDakIsQ0FBQztZQUVGLHNDQUFzQztZQUN0QyxJQUFJLEdBQUcsQ0FBQyxFQUFFLENBQUMsdUJBQXVCLENBQ2hDLEdBQUcsSUFBSSwyQkFBMkIsRUFDbEM7Z0JBQ0UsTUFBTSxFQUFFLElBQUksQ0FBQyxnQkFBZ0IsQ0FBQyxFQUFFO2dCQUNoQyxlQUFlLEVBQUUsSUFBSTtnQkFDckIs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QUFvQjt5QkFDckI7d0JBQ0QsaUJBQWlCLEVBQUUsRUFBRSxFQUFFLCtCQUErQjtxQkFDdkQ7aUJBQ0Y7YUFDRixFQUNELEVBQUUsTUFBTSxFQUFFLElBQUksRUFBRSxDQUNqQixDQUFDO1FBQ0osQ0FBQztRQUVELHdDQUF3QztRQUN4QyxJQUFJLEdBQUcsQ0FBQyxFQUFFLENBQUMsWUFBWSxDQUNyQixHQUFHLElBQUksVUFBVSxFQUNqQjtZQUNFLE1BQU0sRUFBRSxJQUFJLENBQUMsTUFBTSxDQUFDLEVBQUU7WUFDdEIsSUFBSSxFQUFFLGNBQWM7U0FDckIsRUFDRCxFQUFFLE1BQU0sRUFBRSxJQUFJLEVBQUUsQ0FDakIsQ0FBQztRQUVGLHVFQUF1RTtRQUN2RSwwREFBMEQ7UUFFMUQsSUFBSSxDQUFDLGVBQWUsQ0FBQztZQUNuQixVQUFVLEVBQUUsSUFBSSxDQUFDLE1BQU0sQ0FBQyxFQUFFO1lBQzFCLFNBQVMsRUFBRSxJQUFJLENBQUMsTUFBTSxDQUFDLEdBQUc7WUFDMUIsZ0JBQWdCLEVBQUUsSUFBSSxDQUFDLE1BQU0sQ0FBQyxnQkFBZ0I7WUFDOUMsb0JBQW9CLEVBQUUsSUFBSSxDQUFDLGdCQUFnQixFQUFFLEVBQUU7WUFDL0MsbUJBQW1CLEVBQUUsSUFBSSxDQUFDLGdCQUFnQixFQUFFLEdBQUc7U0FDaEQsQ0FBQyxDQUFDO0lBQ0wsQ0FBQztDQUNGO0FBcFNELHdEQW9TQyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCAqIGFzIGF3cyBmcm9tICdAcHVsdW1pL2F3cyc7XG5pbXBvcnQgKiBhcyBwdWx1bWkgZnJvbSAnQHB1bHVtaS9wdWx1bWknO1xuaW1wb3J0IHsgY29tbW9uVGFncyB9IGZyb20gJy4uLy4uL2NvbmZpZy90YWdzJztcblxuZXhwb3J0IGludGVyZmFjZSBFbmhhbmNlZFNlY3VyZVMzQnVja2V0QXJncyB7XG4gIGJ1Y2tldE5hbWU/OiBzdHJpbmc7XG4gIGttc0tleUlkOiBwdWx1bWkuSW5wdXQ8c3RyaW5nPjtcbiAgdGFncz86IFJlY29yZDxzdHJpbmcsIHN0cmluZz47XG4gIGxpZmVjeWNsZVJ1bGVzPzogYW55W107XG4gIGVuYWJsZUFjY2Vzc0xvZ2dpbmc/OiBib29sZWFuO1xuICBlbmFibGVOb3RpZmljYXRpb25zPzogYm9vbGVhbjtcbiAgYWxsb3dlZElwUmFuZ2VzPzogc3RyaW5nW107XG4gIGVuYWJsZU9iamVjdExvY2s/OiBib29sZWFuO1xufVxuXG5leHBvcnQgY2xhc3MgRW5oYW5jZWRTZWN1cmVTM0J1Y2tldCBleHRlbmRzIHB1bHVtaS5Db21wb25lbnRSZXNvdXJjZSB7XG4gIHB1YmxpYyByZWFkb25seSBidWNrZXQ6IGF3cy5zMy5CdWNrZXRWMjtcbiAgcHVibGljIHJlYWRvbmx5IGJ1Y2tldFBvbGljeTogYXdzLnMzLkJ1Y2tldFBvbGljeTtcbiAgcHVibGljIHJlYWRvbmx5IHB1YmxpY0FjY2Vzc0Jsb2NrOiBhd3MuczMuQnVja2V0UHVibGljQWNjZXNzQmxvY2s7XG4gIHB1YmxpYyByZWFkb25seSBhY2Nlc3NMb2dzQnVja2V0PzogYXdzLnMzLkJ1Y2tldFYyO1xuICBwdWJsaWMgcmVhZG9ubHkgbm90aWZpY2F0aW9uPzogYXdzLnMzLkJ1Y2tldE5vdGlmaWNhdGlvbjtcblxuICBjb25zdHJ1Y3RvcihcbiAgICBuYW1lOiBzdHJpbmcsXG4gICAgYXJnczogRW5oYW5jZWRTZWN1cmVTM0J1Y2tldEFyZ3MsXG4gICAgb3B0cz86IHB1bHVtaS5Db21wb25lbnRSZXNvdXJjZU9wdGlvbnNcbiAgKSB7XG4gICAgc3VwZXIoJ2N1c3RvbTpzZWN1cml0eTpFbmhhbmNlZFNlY3VyZVMzQnVja2V0JywgbmFtZSwge30sIG9wdHMpO1xuXG4gICAgLy8gQ3JlYXRlIGFjY2VzcyBsb2dzIGJ1Y2tldCBpZiBsb2dnaW5nIGlzIGVuYWJsZWRcbiAgICBpZiAoYXJncy5lbmFibGVBY2Nlc3NMb2dnaW5nKSB7XG4gICAgICB0aGlzLmFjY2Vzc0xvZ3NCdWNrZXQgPSBuZXcgYXdzLnMzLkJ1Y2tldFYyKFxuICAgICAgICBgJHtuYW1lfS1hY2Nlc3MtbG9nc2AsXG4gICAgICAgIHtcbiAgICAgICAgICBidWNrZXQ6IGAke2FyZ3MuYnVja2V0TmFtZSB8fCBuYW1lfS1hY2Nlc3MtbG9nc2AsXG4gICAgICAgICAgZm9yY2VEZXN0cm95OiBmYWxzZSxcbiAgICAgICAgICB0YWdzOiB7IC4uLmNvbW1vblRhZ3MsIC4uLmFyZ3MudGFncywgUHVycG9zZTogJ0FjY2VzcyBMb2dzJyB9LFxuICAgICAgICB9LFxuICAgICAgICB7IHBhcmVudDogdGhpcyB9XG4gICAgICApO1xuXG4gICAgICAvLyBCbG9jayBwdWJsaWMgYWNjZXNzIGZvciBsb2dzIGJ1Y2tldFxuICAgICAgbmV3IGF3cy5zMy5CdWNrZXRQdWJsaWNBY2Nlc3NCbG9jayhcbiAgICAgICAgYCR7bmFtZX0tbG9ncy1wdWJsaWMtYWNjZXNzLWJsb2NrYCxcbiAgICAgICAge1xuICAgICAgICAgIGJ1Y2tldDogdGhpcy5hY2Nlc3NMb2dzQnVja2V0LmlkLFxuICAgICAgICAgIGJsb2NrUHVibGljQWNsczogdHJ1ZSxcbiAgICAgICAgICBibG9ja1B1YmxpY1BvbGljeTogdHJ1ZSxcbiAgICAgICAgICBpZ25vcmVQdWJsaWNBY2xzOiB0cnVlLFxuICAgICAgICAgIHJlc3RyaWN0UHVibGljQnVja2V0czogdHJ1ZSxcbiAgICAgICAgfSxcbiAgICAgICAgeyBwYXJlbnQ6IHRoaXMgfVxuICAgICAgKTtcbiAgICB9XG5cbiAgICAvLyBDcmVhdGUgbWFpbiBTMyBidWNrZXQgd2l0aCBlbmhhbmNlZCBzZWN1cml0eVxuICAgIHRoaXMuYnVja2V0ID0gbmV3IGF3cy5zMy5CdWNrZXRWMihcbiAgICAgIGAke25hbWV9LWJ1Y2tldGAsXG4gICAgICB7XG4gICAgICAgIGJ1Y2tldDogYXJncy5idWNrZXROYW1lLFxuICAgICAgICBmb3JjZURlc3Ryb3k6IGZhbHNlLFxuICAgICAgICBvYmplY3RMb2NrRW5hYmxlZDogYXJncy5lbmFibGVPYmplY3RMb2NrLFxuICAgICAgICB0YWdzOiB7IC4uLmNvbW1vblRhZ3MsIC4uLmFyZ3MudGFncyB9LFxuICAgICAgfSxcbiAgICAgIHsgcGFyZW50OiB0aGlzIH1cbiAgICApO1xuXG4gICAgLy8gRW5hYmxlIHZlcnNpb25pbmcgd2l0aCBNRkEgZGVsZXRlIHByb3RlY3Rpb25cbiAgICBuZXcgYXdzLnMzLkJ1Y2tldFZlcnNpb25pbmcoXG4gICAgICBgJHtuYW1lfS12ZXJzaW9uaW5nYCxcbiAgICAgIHtcbiAgICAgICAgYnVja2V0OiB0aGlzLmJ1Y2tldC5pZCxcbiAgICAgICAgdmVyc2lvbmluZ0NvbmZpZ3VyYXRpb246IHtcbiAgICAgICAgICBzdGF0dXM6ICdFbmFibGVkJyxcbiAgICAgICAgICBtZmFEZWxldGU6ICdFbmFibGVkJywgLy8gUmVxdWlyZSBNRkEgZm9yIHBlcm1hbmVudCBkZWxldGlvblxuICAgICAgICB9LFxuICAgICAgfSxcbiAgICAgIHsgcGFyZW50OiB0aGlzIH1cbiAgICApO1xuXG4gICAgLy8gQ29uZmlndXJlIHNlcnZlci1zaWRlIGVuY3J5cHRpb24gd2l0aCBhZGRpdGlvbmFsIHNlY3VyaXR5XG4gICAgbmV3IGF3cy5zMy5CdWNrZXRTZXJ2ZXJTaWRlRW5jcnlwdGlvbkNvbmZpZ3VyYXRpb24oXG4gICAgICBgJHtuYW1lfS1lbmNyeXB0aW9uYCxcbiAgICAgIHtcbiAgICAgICAgYnVja2V0OiB0aGlzLmJ1Y2tldC5pZCxcbiAgICAgICAgcnVsZXM6IFtcbiAgICAgICAgICB7XG4gICAgICAgICAgICBhcHBseVNlcnZlclNpZGVFbmNyeXB0aW9uQnlEZWZhdWx0OiB7XG4gICAgICAgICAgICAgIHNzZUFsZ29yaXRobTogJ2F3czprbXMnLFxuICAgICAgICAgICAgICBrbXNNYXN0ZXJLZXlJZDogYXJncy5rbXNLZXlJZCxcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBidWNrZXRLZXlFbmFibGVkOiB0cnVlLFxuICAgICAgICAgIH0sXG4gICAgICAgIF0sXG4gICAgICB9LFxuICAgICAgeyBwYXJlbnQ6IHRoaXMgfVxuICAgICk7XG5cbiAgICAvLyBCbG9jayBhbGwgcHVibGljIGFjY2Vzc1xuICAgIHRoaXMucHVibGljQWNjZXNzQmxvY2sgPSBuZXcgYXdzLnMzLkJ1Y2tldFB1YmxpY0FjY2Vzc0Jsb2NrKFxuICAgICAgYCR7bmFtZX0tcHVibGljLWFjY2Vzcy1ibG9ja2AsXG4gICAgICB7XG4gICAgICAgIGJ1Y2tldDogdGhpcy5idWNrZXQuaWQsXG4gICAgICAgIGJsb2NrUHVibGljQWNsczogdHJ1ZSxcbiAgICAgICAgYmxvY2tQdWJsaWNQb2xpY3k6IHRydWUsXG4gICAgICAgIGlnbm9yZVB1YmxpY0FjbHM6IHRydWUsXG4gICAgICAgIHJlc3RyaWN0UHVibGljQnVja2V0czogdHJ1ZSxcbiAgICAgIH0sXG4gICAgICB7IHBhcmVudDogdGhpcyB9XG4gICAgKTtcblxuICAgIC8vIEVuaGFuY2VkIHNlY3VyZSBidWNrZXQgcG9saWN5IHdpdGggSVAgcmVzdHJpY3Rpb25zXG4gICAgY29uc3QgYnVja2V0UG9saWN5RG9jdW1lbnQgPSBwdWx1bWlcbiAgICAgIC5hbGwoW3RoaXMuYnVja2V0LmFybl0pXG4gICAgICAuYXBwbHkoKFtidWNrZXRBcm5dKSA9PiAoe1xuICAgICAgICBWZXJzaW9uOiAnMjAxMi0xMC0xNycsXG4gICAgICAgIFN0YXRlbWVudDogW1xuICAgICAgICAgIHtcbiAgICAgICAgICAgIFNpZDogJ0RlbnlJbnNlY3VyZUNvbm5lY3Rpb25zJyxcbiAgICAgICAgICAgIEVmZmVjdDogJ0RlbnknLFxuICAgICAgICAgICAgUHJpbmNpcGFsOiAnKicsXG4gICAgICAgICAgICBBY3Rpb246ICdzMzoqJyxcbiAgICAgICAgICAgIFJlc291cmNlOiBbYnVja2V0QXJuLCBgJHtidWNrZXRBcm59LypgXSxcbiAgICAgICAgICAgIENvbmRpdGlvbjoge1xuICAgICAgICAgICAgICBCb29sOiB7XG4gICAgICAgICAgICAgICAgJ2F3czpTZWN1cmVUcmFuc3BvcnQnOiAnZmFsc2UnLFxuICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgfSxcbiAgICAgICAgICB9LFxuICAgICAgICAgIHtcbiAgICAgICAgICAgIFNpZDogJ0RlbnlVbmVuY3J5cHRlZE9iamVjdFVwbG9hZHMnLFxuICAgICAgICAgICAgRWZmZWN0OiAnRGVueScsXG4gICAgICAgICAgICBQcmluY2lwYWw6ICcqJyxcbiAgICAgICAgICAgIEFjdGlvbjogJ3MzOlB1dE9iamVjdCcsXG4gICAgICAgICAgICBSZXNvdXJjZTogYCR7YnVja2V0QXJufS8qYCxcbiAgICAgICAgICAgIENvbmRpdGlvbjoge1xuICAgICAgICAgICAgICBTdHJpbmdOb3RFcXVhbHM6IHtcbiAgICAgICAgICAgICAgICAnczM6eC1hbXotc2VydmVyLXNpZGUtZW5jcnlwdGlvbic6ICdhd3M6a21zJyxcbiAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgfSxcbiAgICAgICAgICB7XG4gICAgICAgICAgICBTaWQ6ICdEZW55SW5jb3JyZWN0RW5jcnlwdGlvbkhlYWRlcicsXG4gICAgICAgICAgICBFZmZlY3Q6ICdEZW55JyxcbiAgICAgICAgICAgIFByaW5jaXBhbDogJyonLFxuICAgICAgICAgICAgQWN0aW9uOiAnczM6UHV0T2JqZWN0JyxcbiAgICAgICAgICAgIFJlc291cmNlOiBgJHtidWNrZXRBcm59LypgLFxuICAgICAgICAgICAgQ29uZGl0aW9uOiB7XG4gICAgICAgICAgICAgIFN0cmluZ05vdEVxdWFsczoge1xuICAgICAgICAgICAgICAgICdzMzp4LWFtei1zZXJ2ZXItc2lkZS1lbmNyeXB0aW9uLWF3cy1rbXMta2V5LWlkJzogYXJncy5rbXNLZXlJZCxcbiAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgfSxcbiAgICAgICAgICB7XG4gICAgICAgICAgICBTaWQ6ICdSZXN0cmljdFRvQWxsb3dlZElQcycsXG4gICAgICAgICAgICBFZmZlY3Q6ICdEZW55JyxcbiAgICAgICAgICAgIFByaW5jaXBhbDogJyonLFxuICAgICAgICAgICAgQWN0aW9uOiAnczM6KicsXG4gICAgICAgICAgICBSZXNvdXJjZTogW2J1Y2tldEFybiwgYCR7YnVja2V0QXJufS8qYF0sXG4gICAgICAgICAgICBDb25kaXRpb246IGFyZ3MuYWxsb3dlZElwUmFuZ2VzXG4gICAgICAgICAgICAgID8ge1xuICAgICAgICAgICAgICAgICAgTm90SXBBZGRyZXNzOiB7XG4gICAgICAgICAgICAgICAgICAgICdhd3M6U291cmNlSXAnOiBhcmdzLmFsbG93ZWRJcFJhbmdlcyxcbiAgICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICA6IHVuZGVmaW5lZCxcbiAgICAgICAgICB9LFxuICAgICAgICAgIHtcbiAgICAgICAgICAgIFNpZDogJ0RlbnlEZWxldGVXaXRob3V0TUZBJyxcbiAgICAgICAgICAgIEVmZmVjdDogJ0RlbnknLFxuICAgICAgICAgICAgUHJpbmNpcGFsOiAnKicsXG4gICAgICAgICAgICBBY3Rpb246IFtcbiAgICAgICAgICAgICAgJ3MzOkRlbGV0ZU9iamVjdCcsXG4gICAgICAgICAgICAgICdzMzpEZWxldGVPYmplY3RWZXJzaW9uJyxcbiAgICAgICAgICAgICAgJ3MzOkRlbGV0ZUJ1Y2tldCcsXG4gICAgICAgICAgICBdLFxuICAgICAgICAgICAgUmVzb3VyY2U6IFtidWNrZXRBcm4sIGAke2J1Y2tldEFybn0vKmBdLFxuICAgICAgICAgICAgQ29uZGl0aW9uOiB7XG4gICAgICAgICAgICAgIEJvb2xJZkV4aXN0czoge1xuICAgICAgICAgICAgICAgICdhd3M6TXVsdGlGYWN0b3JBdXRoUHJlc2VudCc6ICdmYWxzZScsXG4gICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICB9LFxuICAgICAgICAgIH0sXG4gICAgICAgIF0uZmlsdGVyKHN0YXRlbWVudCA9PiBzdGF0ZW1lbnQuQ29uZGl0aW9uICE9PSB1bmRlZmluZWQpLFxuICAgICAgfSkpO1xuXG4gICAgdGhpcy5idWNrZXRQb2xpY3kgPSBuZXcgYXdzLnMzLkJ1Y2tldFBvbGljeShcbiAgICAgIGAke25hbWV9LXBvbGljeWAsXG4gICAgICB7XG4gICAgICAgIGJ1Y2tldDogdGhpcy5idWNrZXQuaWQsXG4gICAgICAgIHBvbGljeTogYnVja2V0UG9saWN5RG9jdW1lbnQuYXBwbHkocG9saWN5ID0+IEpTT04uc3RyaW5naWZ5KHBvbGljeSkpLFxuICAgICAgfSxcbiAgICAgIHsgcGFyZW50OiB0aGlzLCBkZXBlbmRzT246IFt0aGlzLnB1YmxpY0FjY2Vzc0Jsb2NrXSB9XG4gICAgKTtcblxuICAgIC8vIENvbmZpZ3VyZSBlbmhhbmNlZCBsaWZlY3ljbGUgcnVsZXNcbiAgICBpZiAoYXJncy5saWZlY3ljbGVSdWxlcykge1xuICAgICAgbmV3IGF3cy5zMy5CdWNrZXRMaWZlY3ljbGVDb25maWd1cmF0aW9uKFxuICAgICAgICBgJHtuYW1lfS1saWZlY3ljbGVgLFxuICAgICAgICB7XG4gICAgICAgICAgYnVja2V0OiB0aGlzLmJ1Y2tldC5pZCxcbiAgICAgICAgICBydWxlczogW1xuICAgICAgICAgICAgLi4uYXJncy5saWZlY3ljbGVSdWxlcyxcbiAgICAgICAgICAgIC8vIEFkZCBkZWZhdWx0IHJ1bGUgZm9yIGluY29tcGxldGUgbXVsdGlwYXJ0IHVwbG9hZHNcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgaWQ6ICdjbGVhbnVwLWluY29tcGxldGUtdXBsb2FkcycsXG4gICAgICAgICAgICAgIHN0YXR1czogJ0VuYWJsZWQnLFxuICAgICAgICAgICAgICBhYm9ydEluY29tcGxldGVNdWx0aXBhcnRVcGxvYWQ6IHtcbiAgICAgICAgICAgICAgICBkYXlzQWZ0ZXJJbml0aWF0aW9uOiA3LFxuICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIC8vIEFkZCBydWxlIGZvciBvbGQgdmVyc2lvbnMgY2xlYW51cFxuICAgICAgICAgICAge1xuICAgICAgICAgICAgICBpZDogJ2NsZWFudXAtb2xkLXZlcnNpb25zJyxcbiAgICAgICAgICAgICAgc3RhdHVzOiAnRW5hYmxlZCcsXG4gICAgICAgICAgICAgIG5vbmN1cnJlbnRWZXJzaW9uRXhwaXJhdGlvbjoge1xuICAgICAgICAgICAgICAgIG5vbmN1cnJlbnREYXlzOiA5MCxcbiAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgXSxcbiAgICAgICAgfSxcbiAgICAgICAgeyBwYXJlbnQ6IHRoaXMgfVxuICAgICAgKTtcbiAgICB9XG5cbiAgICAvLyBFbmFibGUgYWNjZXNzIGxvZ2dpbmcgaWYgcmVxdWVzdGVkXG4gICAgaWYgKGFyZ3MuZW5hYmxlQWNjZXNzTG9nZ2luZyAmJiB0aGlzLmFjY2Vzc0xvZ3NCdWNrZXQpIHtcbiAgICAgIG5ldyBhd3MuczMuQnVja2V0TG9nZ2luZyhcbiAgICAgICAgYCR7bmFtZX0tbG9nZ2luZ2AsXG4gICAgICAgIHtcbiAgICAgICAgICBidWNrZXQ6IHRoaXMuYnVja2V0LmlkLFxuICAgICAgICAgIHRhcmdldEJ1Y2tldDogdGhpcy5hY2Nlc3NMb2dzQnVja2V0LmlkLFxuICAgICAgICAgIHRhcmdldFByZWZpeDogJ2FjY2Vzcy1sb2dzLycsXG4gICAgICAgICAgdGFyZ2V0R3JhbnRzOiBbXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgIGdyYW50ZWU6IHtcbiAgICAgICAgICAgICAgICB0eXBlOiAnR3JvdXAnLFxuICAgICAgICAgICAgICAgIHVyaTogJ2h0dHA6Ly9hY3MuYW1hem9uYXdzLmNvbS9ncm91cHMvczMvTG9nRGVsaXZlcnknLFxuICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICBwZXJtaXNzaW9uOiAnV1JJVEUnLFxuICAgICAgICAgICAgfSxcbiAgICAgICAgICBdLFxuICAgICAgICB9LFxuICAgICAgICB7IHBhcmVudDogdGhpcyB9XG4gICAgICApO1xuICAgIH1cblxuICAgIC8vIENvbmZpZ3VyZSBvYmplY3QgbG9jayBpZiBlbmFibGVkXG4gICAgaWYgKGFyZ3MuZW5hYmxlT2JqZWN0TG9jaykge1xuICAgICAgbmV3IGF3cy5zMy5CdWNrZXRPYmplY3RMb2NrQ29uZmlndXJhdGlvblYyKFxuICAgICAgICBgJHtuYW1lfS1vYmplY3QtbG9ja2AsXG4gICAgICAgIHtcbiAgICAgICAgICBidWNrZXQ6IHRoaXMuYnVja2V0LmlkLFxuICAgICAgICAgIG9iamVjdExvY2tFbmFibGVkOiAnRW5hYmxlZCcsXG4gICAgICAgICAgcnVsZToge1xuICAgICAgICAgICAgZGVmYXVsdFJldGVudGlvbjoge1xuICAgICAgICAgICAgICBtb2RlOiAnQ09NUExJQU5DRScsXG4gICAgICAgICAgICAgIHllYXJzOiA3LCAvLyA3IHllYXJzIHJldGVudGlvbiBmb3IgY29tcGxpYW5jZVxuICAgICAgICAgICAgfSxcbiAgICAgICAgICB9LFxuICAgICAgICB9LFxuICAgICAgICB7IHBhcmVudDogdGhpcyB9XG4gICAgICApO1xuICAgIH1cblxuICAgIC8vIEVuYWJsZSBub3RpZmljYXRpb25zIGZvciBzZWN1cml0eSBtb25pdG9yaW5nXG4gICAgaWYgKGFyZ3MuZW5hYmxlTm90aWZpY2F0aW9ucykge1xuICAgICAgdGhpcy5ub3RpZmljYXRpb24gPSBuZXcgYXdzLnMzLkJ1Y2tldE5vdGlmaWNhdGlvbihcbiAgICAgICAgYCR7bmFtZX0tbm90aWZpY2F0aW9uYCxcbiAgICAgICAge1xuICAgICAgICAgIGJ1Y2tldDogdGhpcy5idWNrZXQuaWQsXG4gICAgICAgICAgbGFtYmRhRnVuY3Rpb25zOiBbXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgIGV2ZW50czogW1xuICAgICAgICAgICAgICAgICdzMzpPYmplY3RDcmVhdGVkOionLFxuICAgICAgICAgICAgICAgICdzMzpPYmplY3RSZW1vdmVkOionLFxuICAgICAgICAgICAgICAgICdzMzpPYmplY3RSZXN0b3JlOionLFxuICAgICAgICAgICAgICBdLFxuICAgICAgICAgICAgICBsYW1iZGFGdW5jdGlvbkFybjogJycsIC8vIEFkZCBMYW1iZGEgZnVuY3Rpb24gQVJOIGhlcmVcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgXSxcbiAgICAgICAgfSxcbiAgICAgICAgeyBwYXJlbnQ6IHRoaXMgfVxuICAgICAgKTtcbiAgICB9XG5cbiAgICAvLyBFbmFibGUgcmVxdWVzdCBtZXRyaWNzIGZvciBtb25pdG9yaW5nXG4gICAgbmV3IGF3cy5zMy5CdWNrZXRNZXRyaWMoXG4gICAgICBgJHtuYW1lfS1tZXRyaWNzYCxcbiAgICAgIHtcbiAgICAgICAgYnVja2V0OiB0aGlzLmJ1Y2tldC5pZCxcbiAgICAgICAgbmFtZTogJ0VudGlyZUJ1Y2tldCcsXG4gICAgICB9LFxuICAgICAgeyBwYXJlbnQ6IHRoaXMgfVxuICAgICk7XG5cbiAgICAvLyBOb3RlOiBCdWNrZXRJbnZlbnRvcnkgaXMgbm90IGF2YWlsYWJsZSBpbiBjdXJyZW50IFB1bHVtaSBBV1MgdmVyc2lvblxuICAgIC8vIFRoaXMgd291bGQgYmUgYWRkZWQgd2hlbiB0aGUgcmVzb3VyY2UgYmVjb21lcyBhdmFpbGFibGVcblxuICAgIHRoaXMucmVnaXN0ZXJPdXRwdXRzKHtcbiAgICAgIGJ1Y2tldE5hbWU6IHRoaXMuYnVja2V0LmlkLFxuICAgICAgYnVja2V0QXJuOiB0aGlzLmJ1Y2tldC5hcm4sXG4gICAgICBidWNrZXREb21haW5OYW1lOiB0aGlzLmJ1Y2tldC5idWNrZXREb21haW5OYW1lLFxuICAgICAgYWNjZXNzTG9nc0J1Y2tldE5hbWU6IHRoaXMuYWNjZXNzTG9nc0J1Y2tldD8uaWQsXG4gICAgICBhY2Nlc3NMb2dzQnVja2V0QXJuOiB0aGlzLmFjY2Vzc0xvZ3NCdWNrZXQ/LmFybixcbiAgICB9KTtcbiAgfVxufVxuIl19