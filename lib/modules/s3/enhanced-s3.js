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
                bucket: args.bucketName ? `${args.bucketName}-access-logs` : undefined,
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZW5oYW5jZWQtczMuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJlbmhhbmNlZC1zMy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFBQSxpREFBbUM7QUFDbkMsdURBQXlDO0FBQ3pDLDRDQUErQztBQWEvQyxNQUFhLHNCQUF1QixTQUFRLE1BQU0sQ0FBQyxpQkFBaUI7SUFDbEQsTUFBTSxDQUFnQjtJQUN0QixZQUFZLENBQXNCO0lBQ2xDLGlCQUFpQixDQUFpQztJQUNsRCxnQkFBZ0IsQ0FBaUI7SUFDakMsWUFBWSxDQUE2QjtJQUV6RCxZQUNFLElBQVksRUFDWixJQUFnQyxFQUNoQyxJQUFzQztRQUV0QyxLQUFLLENBQUMsd0NBQXdDLEVBQUUsSUFBSSxFQUFFLEVBQUUsRUFBRSxJQUFJLENBQUMsQ0FBQztRQUVoRSxrREFBa0Q7UUFDbEQsSUFBSSxJQUFJLENBQUMsbUJBQW1CLEVBQUUsQ0FBQztZQUM3QixJQUFJLENBQUMsZ0JBQWdCLEdBQUcsSUFBSSxHQUFHLENBQUMsRUFBRSxDQUFDLE1BQU0sQ0FDdkMsR0FBRyxJQUFJLGNBQWMsRUFDckI7Z0JBQ0UsTUFBTSxFQUFFLElBQUksQ0FBQyxVQUFVLENBQUMsQ0FBQyxDQUFDLEdBQUcsSUFBSSxDQUFDLFVBQVUsY0FBYyxDQUFDLENBQUMsQ0FBQyxTQUFTO2dCQUN0RSxZQUFZLEVBQUUsS0FBSztnQkFDbkIsSUFBSSxFQUFFLEVBQUUsR0FBRyxpQkFBVSxFQUFFLEdBQUcsSUFBSSxDQUFDLElBQUksRUFBRSxPQUFPLEVBQUUsYUFBYSxFQUFFO2FBQzlELEVBQ0QsRUFBRSxNQUFNLEVBQUUsSUFBSSxFQUFFLENBQ2pCLENBQUM7WUFFRixzQ0FBc0M7WUFDdEMsSUFBSSxHQUFHLENBQUMsRUFBRSxDQUFDLHVCQUF1QixDQUNoQyxHQUFHLElBQUksMkJBQTJCLEVBQ2xDO2dCQUNFLE1BQU0sRUFBRSxJQUFJLENBQUMsZ0JBQWdC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QUFFOzRCQUNOLG9CQUFvQjs0QkFDcEIsb0JBQW9COzRCQUNwQixvQkFBb0I7eUJBQ3JCO3dCQUNELGlCQUFpQixFQUFFLEVBQUUsRUFBRSwrQkFBK0I7cUJBQ3ZEO2lCQUNGO2FBQ0YsRUFDRCxFQUFFLE1BQU0sRUFBRSxJQUFJLEVBQUUsQ0FDakIsQ0FBQztRQUNKLENBQUM7UUFFRCx3Q0FBd0M7UUFDeEMsSUFBSSxHQUFHLENBQUMsRUFBRSxDQUFDLFlBQVksQ0FDckIsR0FBRyxJQUFJLFVBQVUsRUFDakI7WUFDRSxNQUFNLEVBQUUsSUFBSSxDQUFDLE1BQU0sQ0FBQyxFQUFFO1lBQ3RCLElBQUksRUFBRSxjQUFjO1NBQ3JCLEVBQ0QsRUFBRSxNQUFNLEVBQUUsSUFBSSxFQUFFLENBQ2pCLENBQUM7UUFFRix1RUFBdUU7UUFDdkUsMERBQTBEO1FBRTFELElBQUksQ0FBQyxlQUFlLENBQUM7WUFDbkIsVUFBVSxFQUFFLElBQUksQ0FBQyxNQUFNLENBQUMsRUFBRTtZQUMxQixTQUFTLEVBQUUsSUFBSSxDQUFDLE1BQU0sQ0FBQyxHQUFHO1lBQzFCLGdCQUFnQixFQUFFLElBQUksQ0FBQyxNQUFNLENBQUMsZ0JBQWdCO1lBQzlDLG9CQUFvQixFQUFFLElBQUksQ0FBQyxnQkFBZ0IsRUFBRSxFQUFFO1lBQy9DLG1CQUFtQixFQUFFLElBQUksQ0FBQyxnQkFBZ0IsRUFBRSxHQUFHO1NBQ2hELENBQUMsQ0FBQztJQUNMLENBQUM7Q0FDRjtBQXBTRCx3REFvU0MiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgKiBhcyBhd3MgZnJvbSAnQHB1bHVtaS9hd3MnO1xuaW1wb3J0ICogYXMgcHVsdW1pIGZyb20gJ0BwdWx1bWkvcHVsdW1pJztcbmltcG9ydCB7IGNvbW1vblRhZ3MgfSBmcm9tICcuLi8uLi9jb25maWcvdGFncyc7XG5cbmV4cG9ydCBpbnRlcmZhY2UgRW5oYW5jZWRTZWN1cmVTM0J1Y2tldEFyZ3Mge1xuICBidWNrZXROYW1lPzogc3RyaW5nO1xuICBrbXNLZXlJZDogcHVsdW1pLklucHV0PHN0cmluZz47XG4gIHRhZ3M/OiBSZWNvcmQ8c3RyaW5nLCBzdHJpbmc+O1xuICBsaWZlY3ljbGVSdWxlcz86IGFueVtdO1xuICBlbmFibGVBY2Nlc3NMb2dnaW5nPzogYm9vbGVhbjtcbiAgZW5hYmxlTm90aWZpY2F0aW9ucz86IGJvb2xlYW47XG4gIGFsbG93ZWRJcFJhbmdlcz86IHN0cmluZ1tdO1xuICBlbmFibGVPYmplY3RMb2NrPzogYm9vbGVhbjtcbn1cblxuZXhwb3J0IGNsYXNzIEVuaGFuY2VkU2VjdXJlUzNCdWNrZXQgZXh0ZW5kcyBwdWx1bWkuQ29tcG9uZW50UmVzb3VyY2Uge1xuICBwdWJsaWMgcmVhZG9ubHkgYnVja2V0OiBhd3MuczMuQnVja2V0O1xuICBwdWJsaWMgcmVhZG9ubHkgYnVja2V0UG9saWN5OiBhd3MuczMuQnVja2V0UG9saWN5O1xuICBwdWJsaWMgcmVhZG9ubHkgcHVibGljQWNjZXNzQmxvY2s6IGF3cy5zMy5CdWNrZXRQdWJsaWNBY2Nlc3NCbG9jaztcbiAgcHVibGljIHJlYWRvbmx5IGFjY2Vzc0xvZ3NCdWNrZXQ/OiBhd3MuczMuQnVja2V0O1xuICBwdWJsaWMgcmVhZG9ubHkgbm90aWZpY2F0aW9uPzogYXdzLnMzLkJ1Y2tldE5vdGlmaWNhdGlvbjtcblxuICBjb25zdHJ1Y3RvcihcbiAgICBuYW1lOiBzdHJpbmcsXG4gICAgYXJnczogRW5oYW5jZWRTZWN1cmVTM0J1Y2tldEFyZ3MsXG4gICAgb3B0cz86IHB1bHVtaS5Db21wb25lbnRSZXNvdXJjZU9wdGlvbnNcbiAgKSB7XG4gICAgc3VwZXIoJ2N1c3RvbTpzZWN1cml0eTpFbmhhbmNlZFNlY3VyZVMzQnVja2V0JywgbmFtZSwge30sIG9wdHMpO1xuXG4gICAgLy8gQ3JlYXRlIGFjY2VzcyBsb2dzIGJ1Y2tldCBpZiBsb2dnaW5nIGlzIGVuYWJsZWRcbiAgICBpZiAoYXJncy5lbmFibGVBY2Nlc3NMb2dnaW5nKSB7XG4gICAgICB0aGlzLmFjY2Vzc0xvZ3NCdWNrZXQgPSBuZXcgYXdzLnMzLkJ1Y2tldChcbiAgICAgICAgYCR7bmFtZX0tYWNjZXNzLWxvZ3NgLFxuICAgICAgICB7XG4gICAgICAgICAgYnVja2V0OiBhcmdzLmJ1Y2tldE5hbWUgPyBgJHthcmdzLmJ1Y2tldE5hbWV9LWFjY2Vzcy1sb2dzYCA6IHVuZGVmaW5lZCxcbiAgICAgICAgICBmb3JjZURlc3Ryb3k6IGZhbHNlLFxuICAgICAgICAgIHRhZ3M6IHsgLi4uY29tbW9uVGFncywgLi4uYXJncy50YWdzLCBQdXJwb3NlOiAnQWNjZXNzIExvZ3MnIH0sXG4gICAgICAgIH0sXG4gICAgICAgIHsgcGFyZW50OiB0aGlzIH1cbiAgICAgICk7XG5cbiAgICAgIC8vIEJsb2NrIHB1YmxpYyBhY2Nlc3MgZm9yIGxvZ3MgYnVja2V0XG4gICAgICBuZXcgYXdzLnMzLkJ1Y2tldFB1YmxpY0FjY2Vzc0Jsb2NrKFxuICAgICAgICBgJHtuYW1lfS1sb2dzLXB1YmxpYy1hY2Nlc3MtYmxvY2tgLFxuICAgICAgICB7XG4gICAgICAgICAgYnVja2V0OiB0aGlzLmFjY2Vzc0xvZ3NCdWNrZXQuaWQsXG4gICAgICAgICAgYmxvY2tQdWJsaWNBY2xzOiB0cnVlLFxuICAgICAgICAgIGJsb2NrUHVibGljUG9saWN5OiB0cnVlLFxuICAgICAgICAgIGlnbm9yZVB1YmxpY0FjbHM6IHRydWUsXG4gICAgICAgICAgcmVzdHJpY3RQdWJsaWNCdWNrZXRzOiB0cnVlLFxuICAgICAgICB9LFxuICAgICAgICB7IHBhcmVudDogdGhpcyB9XG4gICAgICApO1xuICAgIH1cblxuICAgIC8vIENyZWF0ZSBtYWluIFMzIGJ1Y2tldCB3aXRoIGVuaGFuY2VkIHNlY3VyaXR5XG4gICAgdGhpcy5idWNrZXQgPSBuZXcgYXdzLnMzLkJ1Y2tldChcbiAgICAgIGAke25hbWV9LWJ1Y2tldGAsXG4gICAgICB7XG4gICAgICAgIGJ1Y2tldDogYXJncy5idWNrZXROYW1lLFxuICAgICAgICBmb3JjZURlc3Ryb3k6IGZhbHNlLFxuICAgICAgICBvYmplY3RMb2NrRW5hYmxlZDogYXJncy5lbmFibGVPYmplY3RMb2NrLFxuICAgICAgICB0YWdzOiB7IC4uLmNvbW1vblRhZ3MsIC4uLmFyZ3MudGFncyB9LFxuICAgICAgfSxcbiAgICAgIHsgcGFyZW50OiB0aGlzIH1cbiAgICApO1xuXG4gICAgLy8gRW5hYmxlIHZlcnNpb25pbmcgd2l0aCBNRkEgZGVsZXRlIHByb3RlY3Rpb24gKGRpc2FibGVkIGZvciBhdXRvbWF0aW9uKVxuICAgIG5ldyBhd3MuczMuQnVja2V0VmVyc2lvbmluZyhcbiAgICAgIGAke25hbWV9LXZlcnNpb25pbmdgLFxuICAgICAge1xuICAgICAgICBidWNrZXQ6IHRoaXMuYnVja2V0LmlkLFxuICAgICAgICB2ZXJzaW9uaW5nQ29uZmlndXJhdGlvbjoge1xuICAgICAgICAgIHN0YXR1czogJ0VuYWJsZWQnLFxuICAgICAgICAgIG1mYURlbGV0ZTogJ0Rpc2FibGVkJywgLy8gRGlzYWJsZWQgZm9yIGF1dG9tYXRlZCBkZXBsb3ltZW50c1xuICAgICAgICB9LFxuICAgICAgfSxcbiAgICAgIHsgcGFyZW50OiB0aGlzIH1cbiAgICApO1xuXG4gICAgLy8gQ29uZmlndXJlIHNlcnZlci1zaWRlIGVuY3J5cHRpb24gd2l0aCBhZGRpdGlvbmFsIHNlY3VyaXR5XG4gICAgbmV3IGF3cy5zMy5CdWNrZXRTZXJ2ZXJTaWRlRW5jcnlwdGlvbkNvbmZpZ3VyYXRpb24oXG4gICAgICBgJHtuYW1lfS1lbmNyeXB0aW9uYCxcbiAgICAgIHtcbiAgICAgICAgYnVja2V0OiB0aGlzLmJ1Y2tldC5pZCxcbiAgICAgICAgcnVsZXM6IFtcbiAgICAgICAgICB7XG4gICAgICAgICAgICBhcHBseVNlcnZlclNpZGVFbmNyeXB0aW9uQnlEZWZhdWx0OiB7XG4gICAgICAgICAgICAgIHNzZUFsZ29yaXRobTogJ2F3czprbXMnLFxuICAgICAgICAgICAgICBrbXNNYXN0ZXJLZXlJZDogYXJncy5rbXNLZXlJZCxcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBidWNrZXRLZXlFbmFibGVkOiB0cnVlLFxuICAgICAgICAgIH0sXG4gICAgICAgIF0sXG4gICAgICB9LFxuICAgICAgeyBwYXJlbnQ6IHRoaXMgfVxuICAgICk7XG5cbiAgICAvLyBCbG9jayBhbGwgcHVibGljIGFjY2Vzc1xuICAgIHRoaXMucHVibGljQWNjZXNzQmxvY2sgPSBuZXcgYXdzLnMzLkJ1Y2tldFB1YmxpY0FjY2Vzc0Jsb2NrKFxuICAgICAgYCR7bmFtZX0tcHVibGljLWFjY2Vzcy1ibG9ja2AsXG4gICAgICB7XG4gICAgICAgIGJ1Y2tldDogdGhpcy5idWNrZXQuaWQsXG4gICAgICAgIGJsb2NrUHVibGljQWNsczogdHJ1ZSxcbiAgICAgICAgYmxvY2tQdWJsaWNQb2xpY3k6IHRydWUsXG4gICAgICAgIGlnbm9yZVB1YmxpY0FjbHM6IHRydWUsXG4gICAgICAgIHJlc3RyaWN0UHVibGljQnVja2V0czogdHJ1ZSxcbiAgICAgIH0sXG4gICAgICB7IHBhcmVudDogdGhpcyB9XG4gICAgKTtcblxuICAgIC8vIEVuaGFuY2VkIHNlY3VyZSBidWNrZXQgcG9saWN5IHdpdGggSVAgcmVzdHJpY3Rpb25zXG4gICAgY29uc3QgYnVja2V0UG9saWN5RG9jdW1lbnQgPSBwdWx1bWlcbiAgICAgIC5hbGwoW3RoaXMuYnVja2V0LmFybl0pXG4gICAgICAuYXBwbHkoKFtidWNrZXRBcm5dKSA9PiAoe1xuICAgICAgICBWZXJzaW9uOiAnMjAxMi0xMC0xNycsXG4gICAgICAgIFN0YXRlbWVudDogW1xuICAgICAgICAgIHtcbiAgICAgICAgICAgIFNpZDogJ0RlbnlJbnNlY3VyZUNvbm5lY3Rpb25zJyxcbiAgICAgICAgICAgIEVmZmVjdDogJ0RlbnknLFxuICAgICAgICAgICAgUHJpbmNpcGFsOiAnKicsXG4gICAgICAgICAgICBBY3Rpb246ICdzMzoqJyxcbiAgICAgICAgICAgIFJlc291cmNlOiBbYnVja2V0QXJuLCBgJHtidWNrZXRBcm59LypgXSxcbiAgICAgICAgICAgIENvbmRpdGlvbjoge1xuICAgICAgICAgICAgICBCb29sOiB7XG4gICAgICAgICAgICAgICAgJ2F3czpTZWN1cmVUcmFuc3BvcnQnOiAnZmFsc2UnLFxuICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgfSxcbiAgICAgICAgICB9LFxuICAgICAgICAgIHtcbiAgICAgICAgICAgIFNpZDogJ0RlbnlVbmVuY3J5cHRlZE9iamVjdFVwbG9hZHMnLFxuICAgICAgICAgICAgRWZmZWN0OiAnRGVueScsXG4gICAgICAgICAgICBQcmluY2lwYWw6ICcqJyxcbiAgICAgICAgICAgIEFjdGlvbjogJ3MzOlB1dE9iamVjdCcsXG4gICAgICAgICAgICBSZXNvdXJjZTogYCR7YnVja2V0QXJufS8qYCxcbiAgICAgICAgICAgIENvbmRpdGlvbjoge1xuICAgICAgICAgICAgICBTdHJpbmdOb3RFcXVhbHM6IHtcbiAgICAgICAgICAgICAgICAnczM6eC1hbXotc2VydmVyLXNpZGUtZW5jcnlwdGlvbic6ICdhd3M6a21zJyxcbiAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgfSxcbiAgICAgICAgICB7XG4gICAgICAgICAgICBTaWQ6ICdEZW55SW5jb3JyZWN0RW5jcnlwdGlvbkhlYWRlcicsXG4gICAgICAgICAgICBFZmZlY3Q6ICdEZW55JyxcbiAgICAgICAgICAgIFByaW5jaXBhbDogJyonLFxuICAgICAgICAgICAgQWN0aW9uOiAnczM6UHV0T2JqZWN0JyxcbiAgICAgICAgICAgIFJlc291cmNlOiBgJHtidWNrZXRBcm59LypgLFxuICAgICAgICAgICAgQ29uZGl0aW9uOiB7XG4gICAgICAgICAgICAgIFN0cmluZ05vdEVxdWFsczoge1xuICAgICAgICAgICAgICAgICdzMzp4LWFtei1zZXJ2ZXItc2lkZS1lbmNyeXB0aW9uLWF3cy1rbXMta2V5LWlkJzogYXJncy5rbXNLZXlJZCxcbiAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgfSxcbiAgICAgICAgICB7XG4gICAgICAgICAgICBTaWQ6ICdSZXN0cmljdFRvQWxsb3dlZElQcycsXG4gICAgICAgICAgICBFZmZlY3Q6ICdEZW55JyxcbiAgICAgICAgICAgIFByaW5jaXBhbDogJyonLFxuICAgICAgICAgICAgQWN0aW9uOiAnczM6KicsXG4gICAgICAgICAgICBSZXNvdXJjZTogW2J1Y2tldEFybiwgYCR7YnVja2V0QXJufS8qYF0sXG4gICAgICAgICAgICBDb25kaXRpb246IGFyZ3MuYWxsb3dlZElwUmFuZ2VzXG4gICAgICAgICAgICAgID8ge1xuICAgICAgICAgICAgICAgICAgTm90SXBBZGRyZXNzOiB7XG4gICAgICAgICAgICAgICAgICAgICdhd3M6U291cmNlSXAnOiBhcmdzLmFsbG93ZWRJcFJhbmdlcyxcbiAgICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICA6IHVuZGVmaW5lZCxcbiAgICAgICAgICB9LFxuICAgICAgICAgIHtcbiAgICAgICAgICAgIFNpZDogJ0RlbnlEZWxldGVXaXRob3V0TUZBJyxcbiAgICAgICAgICAgIEVmZmVjdDogJ0RlbnknLFxuICAgICAgICAgICAgUHJpbmNpcGFsOiAnKicsXG4gICAgICAgICAgICBBY3Rpb246IFtcbiAgICAgICAgICAgICAgJ3MzOkRlbGV0ZU9iamVjdCcsXG4gICAgICAgICAgICAgICdzMzpEZWxldGVPYmplY3RWZXJzaW9uJyxcbiAgICAgICAgICAgICAgJ3MzOkRlbGV0ZUJ1Y2tldCcsXG4gICAgICAgICAgICBdLFxuICAgICAgICAgICAgUmVzb3VyY2U6IFtidWNrZXRBcm4sIGAke2J1Y2tldEFybn0vKmBdLFxuICAgICAgICAgICAgQ29uZGl0aW9uOiB7XG4gICAgICAgICAgICAgIEJvb2xJZkV4aXN0czoge1xuICAgICAgICAgICAgICAgICdhd3M6TXVsdGlGYWN0b3JBdXRoUHJlc2VudCc6ICdmYWxzZScsXG4gICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICB9LFxuICAgICAgICAgIH0sXG4gICAgICAgIF0uZmlsdGVyKHN0YXRlbWVudCA9PiBzdGF0ZW1lbnQuQ29uZGl0aW9uICE9PSB1bmRlZmluZWQpLFxuICAgICAgfSkpO1xuXG4gICAgdGhpcy5idWNrZXRQb2xpY3kgPSBuZXcgYXdzLnMzLkJ1Y2tldFBvbGljeShcbiAgICAgIGAke25hbWV9LXBvbGljeWAsXG4gICAgICB7XG4gICAgICAgIGJ1Y2tldDogdGhpcy5idWNrZXQuaWQsXG4gICAgICAgIHBvbGljeTogYnVja2V0UG9saWN5RG9jdW1lbnQuYXBwbHkocG9saWN5ID0+IEpTT04uc3RyaW5naWZ5KHBvbGljeSkpLFxuICAgICAgfSxcbiAgICAgIHsgcGFyZW50OiB0aGlzLCBkZXBlbmRzT246IFt0aGlzLnB1YmxpY0FjY2Vzc0Jsb2NrXSB9XG4gICAgKTtcblxuICAgIC8vIENvbmZpZ3VyZSBlbmhhbmNlZCBsaWZlY3ljbGUgcnVsZXNcbiAgICBpZiAoYXJncy5saWZlY3ljbGVSdWxlcykge1xuICAgICAgbmV3IGF3cy5zMy5CdWNrZXRMaWZlY3ljbGVDb25maWd1cmF0aW9uKFxuICAgICAgICBgJHtuYW1lfS1saWZlY3ljbGVgLFxuICAgICAgICB7XG4gICAgICAgICAgYnVja2V0OiB0aGlzLmJ1Y2tldC5pZCxcbiAgICAgICAgICBydWxlczogW1xuICAgICAgICAgICAgLi4uYXJncy5saWZlY3ljbGVSdWxlcyxcbiAgICAgICAgICAgIC8vIEFkZCBkZWZhdWx0IHJ1bGUgZm9yIGluY29tcGxldGUgbXVsdGlwYXJ0IHVwbG9hZHNcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgaWQ6ICdjbGVhbnVwLWluY29tcGxldGUtdXBsb2FkcycsXG4gICAgICAgICAgICAgIHN0YXR1czogJ0VuYWJsZWQnLFxuICAgICAgICAgICAgICBhYm9ydEluY29tcGxldGVNdWx0aXBhcnRVcGxvYWQ6IHtcbiAgICAgICAgICAgICAgICBkYXlzQWZ0ZXJJbml0aWF0aW9uOiA3LFxuICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIC8vIEFkZCBydWxlIGZvciBvbGQgdmVyc2lvbnMgY2xlYW51cFxuICAgICAgICAgICAge1xuICAgICAgICAgICAgICBpZDogJ2NsZWFudXAtb2xkLXZlcnNpb25zJyxcbiAgICAgICAgICAgICAgc3RhdHVzOiAnRW5hYmxlZCcsXG4gICAgICAgICAgICAgIG5vbmN1cnJlbnRWZXJzaW9uRXhwaXJhdGlvbjoge1xuICAgICAgICAgICAgICAgIG5vbmN1cnJlbnREYXlzOiA5MCxcbiAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgXSxcbiAgICAgICAgfSxcbiAgICAgICAgeyBwYXJlbnQ6IHRoaXMgfVxuICAgICAgKTtcbiAgICB9XG5cbiAgICAvLyBFbmFibGUgYWNjZXNzIGxvZ2dpbmcgaWYgcmVxdWVzdGVkXG4gICAgaWYgKGFyZ3MuZW5hYmxlQWNjZXNzTG9nZ2luZyAmJiB0aGlzLmFjY2Vzc0xvZ3NCdWNrZXQpIHtcbiAgICAgIG5ldyBhd3MuczMuQnVja2V0TG9nZ2luZyhcbiAgICAgICAgYCR7bmFtZX0tbG9nZ2luZ2AsXG4gICAgICAgIHtcbiAgICAgICAgICBidWNrZXQ6IHRoaXMuYnVja2V0LmlkLFxuICAgICAgICAgIHRhcmdldEJ1Y2tldDogdGhpcy5hY2Nlc3NMb2dzQnVja2V0LmlkLFxuICAgICAgICAgIHRhcmdldFByZWZpeDogJ2FjY2Vzcy1sb2dzLycsXG4gICAgICAgICAgdGFyZ2V0R3JhbnRzOiBbXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgIGdyYW50ZWU6IHtcbiAgICAgICAgICAgICAgICB0eXBlOiAnR3JvdXAnLFxuICAgICAgICAgICAgICAgIHVyaTogJ2h0dHA6Ly9hY3MuYW1hem9uYXdzLmNvbS9ncm91cHMvczMvTG9nRGVsaXZlcnknLFxuICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICBwZXJtaXNzaW9uOiAnV1JJVEUnLFxuICAgICAgICAgICAgfSxcbiAgICAgICAgICBdLFxuICAgICAgICB9LFxuICAgICAgICB7IHBhcmVudDogdGhpcyB9XG4gICAgICApO1xuICAgIH1cblxuICAgIC8vIENvbmZpZ3VyZSBvYmplY3QgbG9jayBpZiBlbmFibGVkXG4gICAgaWYgKGFyZ3MuZW5hYmxlT2JqZWN0TG9jaykge1xuICAgICAgbmV3IGF3cy5zMy5CdWNrZXRPYmplY3RMb2NrQ29uZmlndXJhdGlvbihcbiAgICAgICAgYCR7bmFtZX0tb2JqZWN0LWxvY2tgLFxuICAgICAgICB7XG4gICAgICAgICAgYnVja2V0OiB0aGlzLmJ1Y2tldC5pZCxcbiAgICAgICAgICBvYmplY3RMb2NrRW5hYmxlZDogJ0VuYWJsZWQnLFxuICAgICAgICAgIHJ1bGU6IHtcbiAgICAgICAgICAgIGRlZmF1bHRSZXRlbnRpb246IHtcbiAgICAgICAgICAgICAgbW9kZTogJ0NPTVBMSUFOQ0UnLFxuICAgICAgICAgICAgICB5ZWFyczogNywgLy8gNyB5ZWFycyByZXRlbnRpb24gZm9yIGNvbXBsaWFuY2VcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgfSxcbiAgICAgICAgfSxcbiAgICAgICAgeyBwYXJlbnQ6IHRoaXMgfVxuICAgICAgKTtcbiAgICB9XG5cbiAgICAvLyBFbmFibGUgbm90aWZpY2F0aW9ucyBmb3Igc2VjdXJpdHkgbW9uaXRvcmluZ1xuICAgIGlmIChhcmdzLmVuYWJsZU5vdGlmaWNhdGlvbnMpIHtcbiAgICAgIHRoaXMubm90aWZpY2F0aW9uID0gbmV3IGF3cy5zMy5CdWNrZXROb3RpZmljYXRpb24oXG4gICAgICAgIGAke25hbWV9LW5vdGlmaWNhdGlvbmAsXG4gICAgICAgIHtcbiAgICAgICAgICBidWNrZXQ6IHRoaXMuYnVja2V0LmlkLFxuICAgICAgICAgIGxhbWJkYUZ1bmN0aW9uczogW1xuICAgICAgICAgICAge1xuICAgICAgICAgICAgICBldmVudHM6IFtcbiAgICAgICAgICAgICAgICAnczM6T2JqZWN0Q3JlYXRlZDoqJyxcbiAgICAgICAgICAgICAgICAnczM6T2JqZWN0UmVtb3ZlZDoqJyxcbiAgICAgICAgICAgICAgICAnczM6T2JqZWN0UmVzdG9yZToqJyxcbiAgICAgICAgICAgICAgXSxcbiAgICAgICAgICAgICAgbGFtYmRhRnVuY3Rpb25Bcm46ICcnLCAvLyBBZGQgTGFtYmRhIGZ1bmN0aW9uIEFSTiBoZXJlXG4gICAgICAgICAgICB9LFxuICAgICAgICAgIF0sXG4gICAgICAgIH0sXG4gICAgICAgIHsgcGFyZW50OiB0aGlzIH1cbiAgICAgICk7XG4gICAgfVxuXG4gICAgLy8gRW5hYmxlIHJlcXVlc3QgbWV0cmljcyBmb3IgbW9uaXRvcmluZ1xuICAgIG5ldyBhd3MuczMuQnVja2V0TWV0cmljKFxuICAgICAgYCR7bmFtZX0tbWV0cmljc2AsXG4gICAgICB7XG4gICAgICAgIGJ1Y2tldDogdGhpcy5idWNrZXQuaWQsXG4gICAgICAgIG5hbWU6ICdFbnRpcmVCdWNrZXQnLFxuICAgICAgfSxcbiAgICAgIHsgcGFyZW50OiB0aGlzIH1cbiAgICApO1xuXG4gICAgLy8gTm90ZTogQnVja2V0SW52ZW50b3J5IGlzIG5vdCBhdmFpbGFibGUgaW4gY3VycmVudCBQdWx1bWkgQVdTIHZlcnNpb25cbiAgICAvLyBUaGlzIHdvdWxkIGJlIGFkZGVkIHdoZW4gdGhlIHJlc291cmNlIGJlY29tZXMgYXZhaWxhYmxlXG5cbiAgICB0aGlzLnJlZ2lzdGVyT3V0cHV0cyh7XG4gICAgICBidWNrZXROYW1lOiB0aGlzLmJ1Y2tldC5pZCxcbiAgICAgIGJ1Y2tldEFybjogdGhpcy5idWNrZXQuYXJuLFxuICAgICAgYnVja2V0RG9tYWluTmFtZTogdGhpcy5idWNrZXQuYnVja2V0RG9tYWluTmFtZSxcbiAgICAgIGFjY2Vzc0xvZ3NCdWNrZXROYW1lOiB0aGlzLmFjY2Vzc0xvZ3NCdWNrZXQ/LmlkLFxuICAgICAgYWNjZXNzTG9nc0J1Y2tldEFybjogdGhpcy5hY2Nlc3NMb2dzQnVja2V0Py5hcm4sXG4gICAgfSk7XG4gIH1cbn1cbiJdfQ==