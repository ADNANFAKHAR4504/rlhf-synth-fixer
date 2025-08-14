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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZW5oYW5jZWQtczMuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJlbmhhbmNlZC1zMy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFBQSxpREFBbUM7QUFDbkMsdURBQXlDO0FBQ3pDLDRDQUErQztBQWMvQyxNQUFhLHNCQUF1QixTQUFRLE1BQU0sQ0FBQyxpQkFBaUI7SUFDbEQsTUFBTSxDQUFnQjtJQUN0QixZQUFZLENBQXNCO0lBQ2xDLGlCQUFpQixDQUFpQztJQUNsRCxnQkFBZ0IsQ0FBaUI7SUFDakMsWUFBWSxDQUE2QjtJQUV6RCxZQUNFLElBQVksRUFDWixJQUFnQyxFQUNoQyxJQUFzQztRQUV0QyxLQUFLLENBQUMsd0NBQXdDLEVBQUUsSUFBSSxFQUFFLEVBQUUsRUFBRSxJQUFJLENBQUMsQ0FBQztRQUVoRSxrREFBa0Q7UUFDbEQsSUFBSSxJQUFJLENBQUMsbUJBQW1CLEVBQUUsQ0FBQztZQUM3QixJQUFJLENBQUMsZ0JBQWdCLEdBQUcsSUFBSSxHQUFHLENBQUMsRUFBRSxDQUFDLE1BQU0sQ0FDdkMsR0FBRyxJQUFJLGNBQWMsRUFDckI7Z0JBQ0UsTUFBTSxFQUFFLElBQUksQ0FBQyxVQUFVO29CQUNyQixDQUFDLENBQUMsR0FBRyxJQUFJLENBQUMsVUFBVSxjQUFjO29CQUNsQyxDQUFDLENBQUMsU0FBUztnQkFDYixZQUFZLEVBQUUsS0FBSztnQkFDbkIsSUFBSSxFQUFFLEVBQUUsR0FBRyxpQkFBVSxFQUFFLEdBQUcsSUFBSSxDQUFDLElBQUksRUFBRSxPQUFPLEVBQUUsYUFBYSxFQUFFO2FBQzlELEVBQ0QsRUFBRSxNQUFNLEVBQUUsSUFBSSxFQUFFLENBQ2pCLENBQUM7WUFFRixzQ0FBc0M7WUFDdEMsSUFBSSxHQUFHLENBQUMsRUFBRSxDQUFDLHVCQUF1QixDQUNoQyxHQUFHLElBQUksMkJBQTJCLEVBQ2xDO2dCQUNFLE1BQU0sRUFBRSxJQUFJLENBQUMsZ0JB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aUI7cUJBQzFDO2lCQUNGO2FBQ0YsRUFDRCxFQUFFLE1BQU0sRUFBRSxJQUFJLEVBQUUsQ0FDakIsQ0FBQztRQUNKLENBQUM7UUFFRCx3Q0FBd0M7UUFDeEMsSUFBSSxHQUFHLENBQUMsRUFBRSxDQUFDLFlBQVksQ0FDckIsR0FBRyxJQUFJLFVBQVUsRUFDakI7WUFDRSxNQUFNLEVBQUUsSUFBSSxDQUFDLE1BQU0sQ0FBQyxFQUFFO1lBQ3RCLElBQUksRUFBRSxjQUFjO1NBQ3JCLEVBQ0QsRUFBRSxNQUFNLEVBQUUsSUFBSSxFQUFFLENBQ2pCLENBQUM7UUFFRix1RUFBdUU7UUFDdkUsMERBQTBEO1FBRTFELElBQUksQ0FBQyxlQUFlLENBQUM7WUFDbkIsVUFBVSxFQUFFLElBQUksQ0FBQyxNQUFNLENBQUMsRUFBRTtZQUMxQixTQUFTLEVBQUUsSUFBSSxDQUFDLE1BQU0sQ0FBQyxHQUFHO1lBQzFCLGdCQUFnQixFQUFFLElBQUksQ0FBQyxNQUFNLENBQUMsZ0JBQWdCO1lBQzlDLG9CQUFvQixFQUFFLElBQUksQ0FBQyxnQkFBZ0IsRUFBRSxFQUFFO1lBQy9DLG1CQUFtQixFQUFFLElBQUksQ0FBQyxnQkFBZ0IsRUFBRSxHQUFHO1NBQ2hELENBQUMsQ0FBQztJQUNMLENBQUM7Q0FDRjtBQTlSRCx3REE4UkMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgKiBhcyBhd3MgZnJvbSAnQHB1bHVtaS9hd3MnO1xuaW1wb3J0ICogYXMgcHVsdW1pIGZyb20gJ0BwdWx1bWkvcHVsdW1pJztcbmltcG9ydCB7IGNvbW1vblRhZ3MgfSBmcm9tICcuLi8uLi9jb25maWcvdGFncyc7XG5cbmV4cG9ydCBpbnRlcmZhY2UgRW5oYW5jZWRTZWN1cmVTM0J1Y2tldEFyZ3Mge1xuICBidWNrZXROYW1lPzogc3RyaW5nO1xuICBrbXNLZXlJZDogcHVsdW1pLklucHV0PHN0cmluZz47XG4gIHRhZ3M/OiBSZWNvcmQ8c3RyaW5nLCBzdHJpbmc+O1xuICBsaWZlY3ljbGVSdWxlcz86IGFueVtdO1xuICBlbmFibGVBY2Nlc3NMb2dnaW5nPzogYm9vbGVhbjtcbiAgZW5hYmxlTm90aWZpY2F0aW9ucz86IGJvb2xlYW47XG4gIGFsbG93ZWRJcFJhbmdlcz86IHN0cmluZ1tdO1xuICBlbmFibGVPYmplY3RMb2NrPzogYm9vbGVhbjtcbiAgbGFtYmRhRnVuY3Rpb25Bcm4/OiBzdHJpbmc7IC8vIE9wdGlvbmFsIExhbWJkYSBmdW5jdGlvbiBBUk4gZm9yIG5vdGlmaWNhdGlvbnNcbn1cblxuZXhwb3J0IGNsYXNzIEVuaGFuY2VkU2VjdXJlUzNCdWNrZXQgZXh0ZW5kcyBwdWx1bWkuQ29tcG9uZW50UmVzb3VyY2Uge1xuICBwdWJsaWMgcmVhZG9ubHkgYnVja2V0OiBhd3MuczMuQnVja2V0O1xuICBwdWJsaWMgcmVhZG9ubHkgYnVja2V0UG9saWN5OiBhd3MuczMuQnVja2V0UG9saWN5O1xuICBwdWJsaWMgcmVhZG9ubHkgcHVibGljQWNjZXNzQmxvY2s6IGF3cy5zMy5CdWNrZXRQdWJsaWNBY2Nlc3NCbG9jaztcbiAgcHVibGljIHJlYWRvbmx5IGFjY2Vzc0xvZ3NCdWNrZXQ/OiBhd3MuczMuQnVja2V0O1xuICBwdWJsaWMgcmVhZG9ubHkgbm90aWZpY2F0aW9uPzogYXdzLnMzLkJ1Y2tldE5vdGlmaWNhdGlvbjtcblxuICBjb25zdHJ1Y3RvcihcbiAgICBuYW1lOiBzdHJpbmcsXG4gICAgYXJnczogRW5oYW5jZWRTZWN1cmVTM0J1Y2tldEFyZ3MsXG4gICAgb3B0cz86IHB1bHVtaS5Db21wb25lbnRSZXNvdXJjZU9wdGlvbnNcbiAgKSB7XG4gICAgc3VwZXIoJ2N1c3RvbTpzZWN1cml0eTpFbmhhbmNlZFNlY3VyZVMzQnVja2V0JywgbmFtZSwge30sIG9wdHMpO1xuXG4gICAgLy8gQ3JlYXRlIGFjY2VzcyBsb2dzIGJ1Y2tldCBpZiBsb2dnaW5nIGlzIGVuYWJsZWRcbiAgICBpZiAoYXJncy5lbmFibGVBY2Nlc3NMb2dnaW5nKSB7XG4gICAgICB0aGlzLmFjY2Vzc0xvZ3NCdWNrZXQgPSBuZXcgYXdzLnMzLkJ1Y2tldChcbiAgICAgICAgYCR7bmFtZX0tYWNjZXNzLWxvZ3NgLFxuICAgICAgICB7XG4gICAgICAgICAgYnVja2V0OiBhcmdzLmJ1Y2tldE5hbWVcbiAgICAgICAgICAgID8gYCR7YXJncy5idWNrZXROYW1lfS1hY2Nlc3MtbG9nc2BcbiAgICAgICAgICAgIDogdW5kZWZpbmVkLFxuICAgICAgICAgIGZvcmNlRGVzdHJveTogZmFsc2UsXG4gICAgICAgICAgdGFnczogeyAuLi5jb21tb25UYWdzLCAuLi5hcmdzLnRhZ3MsIFB1cnBvc2U6ICdBY2Nlc3MgTG9ncycgfSxcbiAgICAgICAgfSxcbiAgICAgICAgeyBwYXJlbnQ6IHRoaXMgfVxuICAgICAgKTtcblxuICAgICAgLy8gQmxvY2sgcHVibGljIGFjY2VzcyBmb3IgbG9ncyBidWNrZXRcbiAgICAgIG5ldyBhd3MuczMuQnVja2V0UHVibGljQWNjZXNzQmxvY2soXG4gICAgICAgIGAke25hbWV9LWxvZ3MtcHVibGljLWFjY2Vzcy1ibG9ja2AsXG4gICAgICAgIHtcbiAgICAgICAgICBidWNrZXQ6IHRoaXMuYWNjZXNzTG9nc0J1Y2tldC5pZCxcbiAgICAgICAgICBibG9ja1B1YmxpY0FjbHM6IHRydWUsXG4gICAgICAgICAgYmxvY2tQdWJsaWNQb2xpY3k6IHRydWUsXG4gICAgICAgICAgaWdub3JlUHVibGljQWNsczogdHJ1ZSxcbiAgICAgICAgICByZXN0cmljdFB1YmxpY0J1Y2tldHM6IHRydWUsXG4gICAgICAgIH0sXG4gICAgICAgIHsgcGFyZW50OiB0aGlzIH1cbiAgICAgICk7XG4gICAgfVxuXG4gICAgLy8gQ3JlYXRlIG1haW4gUzMgYnVja2V0IHdpdGggZW5oYW5jZWQgc2VjdXJpdHlcbiAgICB0aGlzLmJ1Y2tldCA9IG5ldyBhd3MuczMuQnVja2V0KFxuICAgICAgYCR7bmFtZX0tYnVja2V0YCxcbiAgICAgIHtcbiAgICAgICAgYnVja2V0OiBhcmdzLmJ1Y2tldE5hbWUsXG4gICAgICAgIGZvcmNlRGVzdHJveTogZmFsc2UsXG4gICAgICAgIG9iamVjdExvY2tFbmFibGVkOiBhcmdzLmVuYWJsZU9iamVjdExvY2ssXG4gICAgICAgIHRhZ3M6IHsgLi4uY29tbW9uVGFncywgLi4uYXJncy50YWdzIH0sXG4gICAgICB9LFxuICAgICAgeyBwYXJlbnQ6IHRoaXMgfVxuICAgICk7XG5cbiAgICAvLyBFbmFibGUgdmVyc2lvbmluZyB3aXRoIE1GQSBkZWxldGUgcHJvdGVjdGlvbiAoZGlzYWJsZWQgZm9yIGF1dG9tYXRpb24pXG4gICAgbmV3IGF3cy5zMy5CdWNrZXRWZXJzaW9uaW5nKFxuICAgICAgYCR7bmFtZX0tdmVyc2lvbmluZ2AsXG4gICAgICB7XG4gICAgICAgIGJ1Y2tldDogdGhpcy5idWNrZXQuaWQsXG4gICAgICAgIHZlcnNpb25pbmdDb25maWd1cmF0aW9uOiB7XG4gICAgICAgICAgc3RhdHVzOiAnRW5hYmxlZCcsXG4gICAgICAgICAgbWZhRGVsZXRlOiAnRGlzYWJsZWQnLCAvLyBEaXNhYmxlZCBmb3IgYXV0b21hdGVkIGRlcGxveW1lbnRzXG4gICAgICAgIH0sXG4gICAgICB9LFxuICAgICAgeyBwYXJlbnQ6IHRoaXMgfVxuICAgICk7XG5cbiAgICAvLyBDb25maWd1cmUgc2VydmVyLXNpZGUgZW5jcnlwdGlvbiB3aXRoIGFkZGl0aW9uYWwgc2VjdXJpdHlcbiAgICBuZXcgYXdzLnMzLkJ1Y2tldFNlcnZlclNpZGVFbmNyeXB0aW9uQ29uZmlndXJhdGlvbihcbiAgICAgIGAke25hbWV9LWVuY3J5cHRpb25gLFxuICAgICAge1xuICAgICAgICBidWNrZXQ6IHRoaXMuYnVja2V0LmlkLFxuICAgICAgICBydWxlczogW1xuICAgICAgICAgIHtcbiAgICAgICAgICAgIGFwcGx5U2VydmVyU2lkZUVuY3J5cHRpb25CeURlZmF1bHQ6IHtcbiAgICAgICAgICAgICAgc3NlQWxnb3JpdGhtOiAnYXdzOmttcycsXG4gICAgICAgICAgICAgIGttc01hc3RlcktleUlkOiBhcmdzLmttc0tleUlkLFxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIGJ1Y2tldEtleUVuYWJsZWQ6IHRydWUsXG4gICAgICAgICAgfSxcbiAgICAgICAgXSxcbiAgICAgIH0sXG4gICAgICB7IHBhcmVudDogdGhpcyB9XG4gICAgKTtcblxuICAgIC8vIEJsb2NrIGFsbCBwdWJsaWMgYWNjZXNzXG4gICAgdGhpcy5wdWJsaWNBY2Nlc3NCbG9jayA9IG5ldyBhd3MuczMuQnVja2V0UHVibGljQWNjZXNzQmxvY2soXG4gICAgICBgJHtuYW1lfS1wdWJsaWMtYWNjZXNzLWJsb2NrYCxcbiAgICAgIHtcbiAgICAgICAgYnVja2V0OiB0aGlzLmJ1Y2tldC5pZCxcbiAgICAgICAgYmxvY2tQdWJsaWNBY2xzOiB0cnVlLFxuICAgICAgICBibG9ja1B1YmxpY1BvbGljeTogdHJ1ZSxcbiAgICAgICAgaWdub3JlUHVibGljQWNsczogdHJ1ZSxcbiAgICAgICAgcmVzdHJpY3RQdWJsaWNCdWNrZXRzOiB0cnVlLFxuICAgICAgfSxcbiAgICAgIHsgcGFyZW50OiB0aGlzIH1cbiAgICApO1xuXG4gICAgLy8gRW5oYW5jZWQgc2VjdXJlIGJ1Y2tldCBwb2xpY3kgd2l0aCBJUCByZXN0cmljdGlvbnNcbiAgICBjb25zdCBidWNrZXRQb2xpY3lEb2N1bWVudCA9IHB1bHVtaVxuICAgICAgLmFsbChbdGhpcy5idWNrZXQuYXJuXSlcbiAgICAgIC5hcHBseSgoW2J1Y2tldEFybl0pID0+ICh7XG4gICAgICAgIFZlcnNpb246ICcyMDEyLTEwLTE3JyxcbiAgICAgICAgU3RhdGVtZW50OiBbXG4gICAgICAgICAge1xuICAgICAgICAgICAgU2lkOiAnRGVueUluc2VjdXJlQ29ubmVjdGlvbnMnLFxuICAgICAgICAgICAgRWZmZWN0OiAnRGVueScsXG4gICAgICAgICAgICBQcmluY2lwYWw6ICcqJyxcbiAgICAgICAgICAgIEFjdGlvbjogJ3MzOionLFxuICAgICAgICAgICAgUmVzb3VyY2U6IFtidWNrZXRBcm4sIGAke2J1Y2tldEFybn0vKmBdLFxuICAgICAgICAgICAgQ29uZGl0aW9uOiB7XG4gICAgICAgICAgICAgIEJvb2w6IHtcbiAgICAgICAgICAgICAgICAnYXdzOlNlY3VyZVRyYW5zcG9ydCc6ICdmYWxzZScsXG4gICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICB9LFxuICAgICAgICAgIH0sXG4gICAgICAgICAge1xuICAgICAgICAgICAgU2lkOiAnRGVueVVuZW5jcnlwdGVkT2JqZWN0VXBsb2FkcycsXG4gICAgICAgICAgICBFZmZlY3Q6ICdEZW55JyxcbiAgICAgICAgICAgIFByaW5jaXBhbDogJyonLFxuICAgICAgICAgICAgQWN0aW9uOiAnczM6UHV0T2JqZWN0JyxcbiAgICAgICAgICAgIFJlc291cmNlOiBgJHtidWNrZXRBcm59LypgLFxuICAgICAgICAgICAgQ29uZGl0aW9uOiB7XG4gICAgICAgICAgICAgIFN0cmluZ05vdEVxdWFsczoge1xuICAgICAgICAgICAgICAgICdzMzp4LWFtei1zZXJ2ZXItc2lkZS1lbmNyeXB0aW9uJzogJ2F3czprbXMnLFxuICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgfSxcbiAgICAgICAgICB9LFxuICAgICAgICAgIHtcbiAgICAgICAgICAgIFNpZDogJ0RlbnlJbmNvcnJlY3RFbmNyeXB0aW9uSGVhZGVyJyxcbiAgICAgICAgICAgIEVmZmVjdDogJ0RlbnknLFxuICAgICAgICAgICAgUHJpbmNpcGFsOiAnKicsXG4gICAgICAgICAgICBBY3Rpb246ICdzMzpQdXRPYmplY3QnLFxuICAgICAgICAgICAgUmVzb3VyY2U6IGAke2J1Y2tldEFybn0vKmAsXG4gICAgICAgICAgICBDb25kaXRpb246IHtcbiAgICAgICAgICAgICAgU3RyaW5nTm90RXF1YWxzOiB7XG4gICAgICAgICAgICAgICAgJ3MzOngtYW16LXNlcnZlci1zaWRlLWVuY3J5cHRpb24tYXdzLWttcy1rZXktaWQnOiBhcmdzLmttc0tleUlkLFxuICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgfSxcbiAgICAgICAgICB9LFxuICAgICAgICAgIHtcbiAgICAgICAgICAgIFNpZDogJ1Jlc3RyaWN0VG9BbGxvd2VkSVBzJyxcbiAgICAgICAgICAgIEVmZmVjdDogJ0RlbnknLFxuICAgICAgICAgICAgUHJpbmNpcGFsOiAnKicsXG4gICAgICAgICAgICBBY3Rpb246ICdzMzoqJyxcbiAgICAgICAgICAgIFJlc291cmNlOiBbYnVja2V0QXJuLCBgJHtidWNrZXRBcm59LypgXSxcbiAgICAgICAgICAgIENvbmRpdGlvbjogYXJncy5hbGxvd2VkSXBSYW5nZXNcbiAgICAgICAgICAgICAgPyB7XG4gICAgICAgICAgICAgICAgICBOb3RJcEFkZHJlc3M6IHtcbiAgICAgICAgICAgICAgICAgICAgJ2F3czpTb3VyY2VJcCc6IGFyZ3MuYWxsb3dlZElwUmFuZ2VzLFxuICAgICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgIDogdW5kZWZpbmVkLFxuICAgICAgICAgIH0sXG4gICAgICAgICAge1xuICAgICAgICAgICAgU2lkOiAnRGVueURlbGV0ZVdpdGhvdXRNRkEnLFxuICAgICAgICAgICAgRWZmZWN0OiAnRGVueScsXG4gICAgICAgICAgICBQcmluY2lwYWw6ICcqJyxcbiAgICAgICAgICAgIEFjdGlvbjogW1xuICAgICAgICAgICAgICAnczM6RGVsZXRlT2JqZWN0JyxcbiAgICAgICAgICAgICAgJ3MzOkRlbGV0ZU9iamVjdFZlcnNpb24nLFxuICAgICAgICAgICAgICAnczM6RGVsZXRlQnVja2V0JyxcbiAgICAgICAgICAgIF0sXG4gICAgICAgICAgICBSZXNvdXJjZTogW2J1Y2tldEFybiwgYCR7YnVja2V0QXJufS8qYF0sXG4gICAgICAgICAgICBDb25kaXRpb246IHtcbiAgICAgICAgICAgICAgQm9vbElmRXhpc3RzOiB7XG4gICAgICAgICAgICAgICAgJ2F3czpNdWx0aUZhY3RvckF1dGhQcmVzZW50JzogJ2ZhbHNlJyxcbiAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgfSxcbiAgICAgICAgXS5maWx0ZXIoc3RhdGVtZW50ID0+IHN0YXRlbWVudC5Db25kaXRpb24gIT09IHVuZGVmaW5lZCksXG4gICAgICB9KSk7XG5cbiAgICB0aGlzLmJ1Y2tldFBvbGljeSA9IG5ldyBhd3MuczMuQnVja2V0UG9saWN5KFxuICAgICAgYCR7bmFtZX0tcG9saWN5YCxcbiAgICAgIHtcbiAgICAgICAgYnVja2V0OiB0aGlzLmJ1Y2tldC5pZCxcbiAgICAgICAgcG9saWN5OiBidWNrZXRQb2xpY3lEb2N1bWVudC5hcHBseShwb2xpY3kgPT4gSlNPTi5zdHJpbmdpZnkocG9saWN5KSksXG4gICAgICB9LFxuICAgICAgeyBwYXJlbnQ6IHRoaXMsIGRlcGVuZHNPbjogW3RoaXMucHVibGljQWNjZXNzQmxvY2tdIH1cbiAgICApO1xuXG4gICAgLy8gQ29uZmlndXJlIGVuaGFuY2VkIGxpZmVjeWNsZSBydWxlc1xuICAgIGlmIChhcmdzLmxpZmVjeWNsZVJ1bGVzKSB7XG4gICAgICBuZXcgYXdzLnMzLkJ1Y2tldExpZmVjeWNsZUNvbmZpZ3VyYXRpb24oXG4gICAgICAgIGAke25hbWV9LWxpZmVjeWNsZWAsXG4gICAgICAgIHtcbiAgICAgICAgICBidWNrZXQ6IHRoaXMuYnVja2V0LmlkLFxuICAgICAgICAgIHJ1bGVzOiBbXG4gICAgICAgICAgICAuLi5hcmdzLmxpZmVjeWNsZVJ1bGVzLFxuICAgICAgICAgICAgLy8gQWRkIGRlZmF1bHQgcnVsZSBmb3IgaW5jb21wbGV0ZSBtdWx0aXBhcnQgdXBsb2Fkc1xuICAgICAgICAgICAge1xuICAgICAgICAgICAgICBpZDogJ2NsZWFudXAtaW5jb21wbGV0ZS11cGxvYWRzJyxcbiAgICAgICAgICAgICAgc3RhdHVzOiAnRW5hYmxlZCcsXG4gICAgICAgICAgICAgIGFib3J0SW5jb21wbGV0ZU11bHRpcGFydFVwbG9hZDoge1xuICAgICAgICAgICAgICAgIGRheXNBZnRlckluaXRpYXRpb246IDcsXG4gICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgLy8gQWRkIHJ1bGUgZm9yIG9sZCB2ZXJzaW9ucyBjbGVhbnVwXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgIGlkOiAnY2xlYW51cC1vbGQtdmVyc2lvbnMnLFxuICAgICAgICAgICAgICBzdGF0dXM6ICdFbmFibGVkJyxcbiAgICAgICAgICAgICAgbm9uY3VycmVudFZlcnNpb25FeHBpcmF0aW9uOiB7XG4gICAgICAgICAgICAgICAgbm9uY3VycmVudERheXM6IDkwLFxuICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgfSxcbiAgICAgICAgICBdLFxuICAgICAgICB9LFxuICAgICAgICB7IHBhcmVudDogdGhpcyB9XG4gICAgICApO1xuICAgIH1cblxuICAgIC8vIEVuYWJsZSBhY2Nlc3MgbG9nZ2luZyBpZiByZXF1ZXN0ZWRcbiAgICBpZiAoYXJncy5lbmFibGVBY2Nlc3NMb2dnaW5nICYmIHRoaXMuYWNjZXNzTG9nc0J1Y2tldCkge1xuICAgICAgbmV3IGF3cy5zMy5CdWNrZXRMb2dnaW5nKFxuICAgICAgICBgJHtuYW1lfS1sb2dnaW5nYCxcbiAgICAgICAge1xuICAgICAgICAgIGJ1Y2tldDogdGhpcy5idWNrZXQuaWQsXG4gICAgICAgICAgdGFyZ2V0QnVja2V0OiB0aGlzLmFjY2Vzc0xvZ3NCdWNrZXQuaWQsXG4gICAgICAgICAgdGFyZ2V0UHJlZml4OiAnYWNjZXNzLWxvZ3MvJyxcbiAgICAgICAgICAvLyBOb3RlOiB0YXJnZXRHcmFudHMgcmVtb3ZlZCBmb3IgYnVja2V0IG93bmVyIGVuZm9yY2VkIGJ1Y2tldHNcbiAgICAgICAgfSxcbiAgICAgICAgeyBwYXJlbnQ6IHRoaXMgfVxuICAgICAgKTtcbiAgICB9XG5cbiAgICAvLyBDb25maWd1cmUgb2JqZWN0IGxvY2sgaWYgZW5hYmxlZFxuICAgIGlmIChhcmdzLmVuYWJsZU9iamVjdExvY2spIHtcbiAgICAgIG5ldyBhd3MuczMuQnVja2V0T2JqZWN0TG9ja0NvbmZpZ3VyYXRpb24oXG4gICAgICAgIGAke25hbWV9LW9iamVjdC1sb2NrYCxcbiAgICAgICAge1xuICAgICAgICAgIGJ1Y2tldDogdGhpcy5idWNrZXQuaWQsXG4gICAgICAgICAgb2JqZWN0TG9ja0VuYWJsZWQ6ICdFbmFibGVkJyxcbiAgICAgICAgICBydWxlOiB7XG4gICAgICAgICAgICBkZWZhdWx0UmV0ZW50aW9uOiB7XG4gICAgICAgICAgICAgIG1vZGU6ICdDT01QTElBTkNFJyxcbiAgICAgICAgICAgICAgeWVhcnM6IDcsIC8vIDcgeWVhcnMgcmV0ZW50aW9uIGZvciBjb21wbGlhbmNlXG4gICAgICAgICAgICB9LFxuICAgICAgICAgIH0sXG4gICAgICAgIH0sXG4gICAgICAgIHsgcGFyZW50OiB0aGlzIH1cbiAgICAgICk7XG4gICAgfVxuXG4gICAgLy8gRW5hYmxlIG5vdGlmaWNhdGlvbnMgZm9yIHNlY3VyaXR5IG1vbml0b3JpbmcgKG9ubHkgaWYgTGFtYmRhIEFSTiBpcyBwcm92aWRlZClcbiAgICBpZiAoYXJncy5lbmFibGVOb3RpZmljYXRpb25zICYmIGFyZ3MubGFtYmRhRnVuY3Rpb25Bcm4pIHtcbiAgICAgIHRoaXMubm90aWZpY2F0aW9uID0gbmV3IGF3cy5zMy5CdWNrZXROb3RpZmljYXRpb24oXG4gICAgICAgIGAke25hbWV9LW5vdGlmaWNhdGlvbmAsXG4gICAgICAgIHtcbiAgICAgICAgICBidWNrZXQ6IHRoaXMuYnVja2V0LmlkLFxuICAgICAgICAgIGxhbWJkYUZ1bmN0aW9uczogW1xuICAgICAgICAgICAge1xuICAgICAgICAgICAgICBldmVudHM6IFtcbiAgICAgICAgICAgICAgICAnczM6T2JqZWN0Q3JlYXRlZDoqJyxcbiAgICAgICAgICAgICAgICAnczM6T2JqZWN0UmVtb3ZlZDoqJyxcbiAgICAgICAgICAgICAgICAnczM6T2JqZWN0UmVzdG9yZToqJyxcbiAgICAgICAgICAgICAgXSxcbiAgICAgICAgICAgICAgbGFtYmRhRnVuY3Rpb25Bcm46IGFyZ3MubGFtYmRhRnVuY3Rpb25Bcm4sXG4gICAgICAgICAgICB9LFxuICAgICAgICAgIF0sXG4gICAgICAgIH0sXG4gICAgICAgIHsgcGFyZW50OiB0aGlzIH1cbiAgICAgICk7XG4gICAgfVxuXG4gICAgLy8gRW5hYmxlIHJlcXVlc3QgbWV0cmljcyBmb3IgbW9uaXRvcmluZ1xuICAgIG5ldyBhd3MuczMuQnVja2V0TWV0cmljKFxuICAgICAgYCR7bmFtZX0tbWV0cmljc2AsXG4gICAgICB7XG4gICAgICAgIGJ1Y2tldDogdGhpcy5idWNrZXQuaWQsXG4gICAgICAgIG5hbWU6ICdFbnRpcmVCdWNrZXQnLFxuICAgICAgfSxcbiAgICAgIHsgcGFyZW50OiB0aGlzIH1cbiAgICApO1xuXG4gICAgLy8gTm90ZTogQnVja2V0SW52ZW50b3J5IGlzIG5vdCBhdmFpbGFibGUgaW4gY3VycmVudCBQdWx1bWkgQVdTIHZlcnNpb25cbiAgICAvLyBUaGlzIHdvdWxkIGJlIGFkZGVkIHdoZW4gdGhlIHJlc291cmNlIGJlY29tZXMgYXZhaWxhYmxlXG5cbiAgICB0aGlzLnJlZ2lzdGVyT3V0cHV0cyh7XG4gICAgICBidWNrZXROYW1lOiB0aGlzLmJ1Y2tldC5pZCxcbiAgICAgIGJ1Y2tldEFybjogdGhpcy5idWNrZXQuYXJuLFxuICAgICAgYnVja2V0RG9tYWluTmFtZTogdGhpcy5idWNrZXQuYnVja2V0RG9tYWluTmFtZSxcbiAgICAgIGFjY2Vzc0xvZ3NCdWNrZXROYW1lOiB0aGlzLmFjY2Vzc0xvZ3NCdWNrZXQ/LmlkLFxuICAgICAgYWNjZXNzTG9nc0J1Y2tldEFybjogdGhpcy5hY2Nlc3NMb2dzQnVja2V0Py5hcm4sXG4gICAgfSk7XG4gIH1cbn1cbiJdfQ==