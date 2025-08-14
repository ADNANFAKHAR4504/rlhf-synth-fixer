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
exports.S3Stack = void 0;
/**
 * s3-stack.ts
 *
 * This module defines the secure S3 bucket for document storage with AWS managed encryption,
 * versioning, access logging, and restrictive bucket policies implementing least privilege access.
 */
const aws = __importStar(require("@pulumi/aws"));
const pulumi = __importStar(require("@pulumi/pulumi"));
class S3Stack extends pulumi.ComponentResource {
    bucket;
    accessLogsBucket;
    bucketPolicy;
    tempLambdaRole;
    updatedBucketPolicy;
    constructor(name, args, opts) {
        super('tap:s3:S3Stack', name, args, opts);
        const { environmentSuffix, lambdaRoleArn, tags } = args;
        // Create access logs bucket
        this.accessLogsBucket = new aws.s3.Bucket(`access-logs-bucket-${environmentSuffix}`, {
            tags: {
                Name: `access-logs-bucket-${environmentSuffix}`,
                Purpose: 'Access logs storage',
                ...tags,
            },
        }, { parent: this });
        new aws.s3.BucketPublicAccessBlock(`access-logs-pab-${environmentSuffix}`, {
            bucket: this.accessLogsBucket.id,
            blockPublicAcls: true,
            blockPublicPolicy: true,
            ignorePublicAcls: true,
            restrictPublicBuckets: true,
        }, { parent: this });
        // Create main S3 bucket
        this.bucket = new aws.s3.Bucket(`secure-doc-bucket-${environmentSuffix}`, {
            tags: {
                Name: `secure-doc-bucket-${environmentSuffix}`,
                Purpose: 'Secure document storage',
                ...tags,
            },
        }, { parent: this });
        new aws.s3.BucketVersioning(`bucket-versioning-${environmentSuffix}`, {
            bucket: this.bucket.id,
            versioningConfiguration: {
                status: 'Enabled',
            },
        }, { parent: this });
        new aws.s3.BucketServerSideEncryptionConfiguration(`bucket-encryption-${environmentSuffix}`, {
            bucket: this.bucket.id,
            rules: [
                {
                    applyServerSideEncryptionByDefault: {
                        sseAlgorithm: 'AES256',
                    },
                },
            ],
        }, { parent: this });
        new aws.s3.BucketPublicAccessBlock(`bucket-pab-${environmentSuffix}`, {
            bucket: this.bucket.id,
            blockPublicAcls: true,
            blockPublicPolicy: true,
            ignorePublicAcls: true,
            restrictPublicBuckets: true,
        }, { parent: this });
        new aws.s3.BucketLogging(`bucket-logging-${environmentSuffix}`, {
            bucket: this.bucket.id,
            targetBucket: this.accessLogsBucket.id,
            targetPrefix: 'access-logs/',
        }, { parent: this });
        new aws.s3.BucketLifecycleConfiguration(`bucket-lifecycle-${environmentSuffix}`, {
            bucket: this.bucket.id,
            rules: [
                {
                    id: `cleanup-incomplete-uploads-${environmentSuffix}`,
                    status: 'Enabled',
                    abortIncompleteMultipartUpload: {
                        daysAfterInitiation: 7,
                    },
                },
                {
                    id: `transition-old-versions-${environmentSuffix}`,
                    status: 'Enabled',
                    noncurrentVersionTransitions: [
                        {
                            noncurrentDays: 30,
                            storageClass: 'STANDARD_IA',
                        },
                        {
                            noncurrentDays: 90,
                            storageClass: 'GLACIER',
                        },
                    ],
                    noncurrentVersionExpiration: {
                        noncurrentDays: 365,
                    },
                },
            ],
        }, { parent: this });
        // If no Lambda role provided, create a temporary one
        if (!lambdaRoleArn) {
            this.tempLambdaRole = new aws.iam.Role(`temp-lambda-role-${environmentSuffix}`, {
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
                tags,
            }, { parent: this });
        }
        // Use provided role or temporary role for initial bucket policy
        const initialRoleArn = lambdaRoleArn || this.tempLambdaRole.arn;
        this.bucketPolicy = new aws.s3.BucketPolicy(`bucket-policy-${environmentSuffix}`, {
            bucket: this.bucket.id,
            policy: pulumi
                .all([this.bucket.arn, initialRoleArn])
                .apply(([bucketArn, roleArn]) => JSON.stringify({
                Version: '2012-10-17',
                Id: `SecureBucketPolicy-${environmentSuffix}`,
                Statement: [
                    {
                        Sid: 'AllowLambdaAccess',
                        Effect: 'Allow',
                        Principal: {
                            AWS: roleArn,
                        },
                        Action: [
                            's3:PutObject',
                            's3:PutObjectAcl',
                            's3:GetObject',
                            's3:GetObjectVersion',
                            's3:DeleteObject',
                            's3:ListBucket',
                        ],
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
                ],
            })),
        }, { parent: this });
        this.registerOutputs({
            bucketName: this.bucket.id,
            bucketArn: this.bucket.arn,
            accessLogsBucketName: this.accessLogsBucket.id,
            accessLogsBucketArn: this.accessLogsBucket.arn,
            tempLambdaRoleArn: this.tempLambdaRole?.arn,
            bucketPolicyId: this.bucketPolicy.id,
        });
    }
    // Method to update bucket policy with real Lambda role
    updateBucketPolicy(realLambdaRoleArn) {
        return new aws.s3.BucketPolicy('bucket-policy-updated-final', {
            bucket: this.bucket.id,
            policy: pulumi
                .all([this.bucket.arn, realLambdaRoleArn])
                .apply(([bucketArn, roleArn]) => JSON.stringify({
                Version: '2012-10-17',
                Id: 'SecureBucketPolicy-simplified',
                Statement: [
                    {
                        Sid: 'AllowLambdaAccess',
                        Effect: 'Allow',
                        Principal: {
                            AWS: roleArn,
                        },
                        Action: [
                            's3:PutObject',
                            's3:PutObjectAcl',
                            's3:GetObject',
                            's3:GetObjectVersion',
                            's3:DeleteObject',
                            's3:ListBucket',
                        ],
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
                ],
            })),
        }, { parent: this });
    }
}
exports.S3Stack = S3Stack;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiczMtc3RhY2suanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJzMy1zdGFjay50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFBQTs7Ozs7R0FLRztBQUNILGlEQUFtQztBQUNuQyx1REFBeUM7QUFTekMsTUFBYSxPQUFRLFNBQVEsTUFBTSxDQUFDLGlCQUFpQjtJQUNuQyxNQUFNLENBQWdCO0lBQ3RCLGdCQUFnQixDQUFnQjtJQUNoQyxZQUFZLENBQXNCO0lBQ2xDLGNBQWMsQ0FBZ0I7SUFDOUIsbUJBQW1CLENBQXVCO0lBRTFELFlBQVksSUFBWSxFQUFFLElBQWlCLEVBQUUsSUFBc0I7UUFDakUsS0FBSyxDQUFDLGdCQUFnQixFQUFFLElBQUksRUFBRSxJQUFJLEVBQUUsSUFBSSxDQUFDLENBQUM7UUFFMUMsTUFBTSxFQUFFLGlCQUFpQixFQUFFLGFBQWEsRUFBRSxJQUFJLEVBQUUsR0FBRyxJQUFJLENBQUM7UUFFeEQsNEJBQTRCO1FBQzVCLElBQUksQ0FBQyxnQkFBZ0IsR0FBRyxJQUFJLEdBQUcsQ0FBQyxFQUFFLENBQUMsTUFBTSxDQUN2QyxzQkFBc0IsaUJBQWlCLEVBQUUsRUFDekM7WUFDRSxJQUFJLEVBQUU7Z0JBQ0osSUFBSSxFQUFFLHNCQUFzQixpQkFBaUIsRUFBRTtnQkFDL0MsT0FBTyxFQUFFLHFCQUFxQjtnQkFDOUIsR0FBRyxJQUFJO2FBQ1I7U0FDRixFQUNELEVBQUUsTUFBTSxFQUFFLElBQUksRUFBRSxDQUNqQixDQUFDO1FBRUYsSUFBSSxHQUFHLENBQUMsRUFBRSxDQUFDLHVCQUF1QixDQUNoQyxtQkFBbUIsaUJBQWlCLEVBQUUsRUFDdEM7WUFDRSxNQUFNLEVBQUUsSUFBSSxDQUFDLGdCQUFnQixDQUFDLEVBQUU7WUFDaEMsZUFBZSxFQUFFLElBQUk7WUFDckIsaUJBQWlCLEVBQUUsSUFBSTtZQUN2QixnQkFBZ0IsRUFBRSxJQUFJO1lBQ3RCLHFCQUFxQixF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SUFBSSxDQUFDLE1BQU0sQ0FBQyxHQUFHLEVBQUUsaUJBQWlCLENBQUMsQ0FBQztpQkFDekMsS0FBSyxDQUFDLENBQUMsQ0FBQyxTQUFTLEVBQUUsT0FBTyxDQUFDLEVBQUUsRUFBRSxDQUM5QixJQUFJLENBQUMsU0FBUyxDQUFDO2dCQUNiLE9BQU8sRUFBRSxZQUFZO2dCQUNyQixFQUFFLEVBQUUsK0JBQStCO2dCQUNuQyxTQUFTLEVBQUU7b0JBQ1Q7d0JBQ0UsR0FBRyxFQUFFLG1CQUFtQjt3QkFDeEIsTUFBTSxFQUFFLE9BQU87d0JBQ2YsU0FBUyxFQUFFOzRCQUNULEdBQUcsRUFBRSxPQUFPO3lCQUNiO3dCQUNELE1BQU0sRUFBRTs0QkFDTixjQUFjOzRCQUNkLGlCQUFpQjs0QkFDakIsY0FBYzs0QkFDZCxxQkFBcUI7NEJBQ3JCLGlCQUFpQjs0QkFDakIsZUFBZTt5QkFDaEI7d0JBQ0QsUUFBUSxFQUFFLENBQUMsU0FBUyxFQUFFLEdBQUcsU0FBUyxJQUFJLENBQUM7cUJBQ3hDO29CQUNEO3dCQUNFLEdBQUcsRUFBRSx5QkFBeUI7d0JBQzlCLE1BQU0sRUFBRSxNQUFNO3dCQUNkLFNBQVMsRUFBRSxHQUFHO3dCQUNkLE1BQU0sRUFBRSxNQUFNO3dCQUNkLFFBQVEsRUFBRSxDQUFDLFNBQVMsRUFBRSxHQUFHLFNBQVMsSUFBSSxDQUFDO3dCQUN2QyxTQUFTLEVBQUU7NEJBQ1QsSUFBSSxFQUFFO2dDQUNKLHFCQUFxQixFQUFFLE9BQU87NkJBQy9CO3lCQUNGO3FCQUNGO2lCQUNGO2FBQ0YsQ0FBQyxDQUNIO1NBQ0osRUFDRCxFQUFFLE1BQU0sRUFBRSxJQUFJLEVBQUUsQ0FDakIsQ0FBQztJQUNKLENBQUM7Q0FDRjtBQXhRRCwwQkF3UUMiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIHMzLXN0YWNrLnRzXG4gKlxuICogVGhpcyBtb2R1bGUgZGVmaW5lcyB0aGUgc2VjdXJlIFMzIGJ1Y2tldCBmb3IgZG9jdW1lbnQgc3RvcmFnZSB3aXRoIEFXUyBtYW5hZ2VkIGVuY3J5cHRpb24sXG4gKiB2ZXJzaW9uaW5nLCBhY2Nlc3MgbG9nZ2luZywgYW5kIHJlc3RyaWN0aXZlIGJ1Y2tldCBwb2xpY2llcyBpbXBsZW1lbnRpbmcgbGVhc3QgcHJpdmlsZWdlIGFjY2Vzcy5cbiAqL1xuaW1wb3J0ICogYXMgYXdzIGZyb20gJ0BwdWx1bWkvYXdzJztcbmltcG9ydCAqIGFzIHB1bHVtaSBmcm9tICdAcHVsdW1pL3B1bHVtaSc7XG5pbXBvcnQgeyBSZXNvdXJjZU9wdGlvbnMgfSBmcm9tICdAcHVsdW1pL3B1bHVtaSc7XG5cbmV4cG9ydCBpbnRlcmZhY2UgUzNTdGFja0FyZ3Mge1xuICBlbnZpcm9ubWVudFN1ZmZpeDogc3RyaW5nO1xuICBsYW1iZGFSb2xlQXJuPzogcHVsdW1pLklucHV0PHN0cmluZz47IC8vIE9wdGlvbmFsIC0gaWYgbm90IHByb3ZpZGVkLCBjcmVhdGVzIHRlbXBvcmFyeSByb2xlXG4gIHRhZ3M/OiBwdWx1bWkuSW5wdXQ8eyBba2V5OiBzdHJpbmddOiBzdHJpbmcgfT47XG59XG5cbmV4cG9ydCBjbGFzcyBTM1N0YWNrIGV4dGVuZHMgcHVsdW1pLkNvbXBvbmVudFJlc291cmNlIHtcbiAgcHVibGljIHJlYWRvbmx5IGJ1Y2tldDogYXdzLnMzLkJ1Y2tldDtcbiAgcHVibGljIHJlYWRvbmx5IGFjY2Vzc0xvZ3NCdWNrZXQ6IGF3cy5zMy5CdWNrZXQ7XG4gIHB1YmxpYyByZWFkb25seSBidWNrZXRQb2xpY3k6IGF3cy5zMy5CdWNrZXRQb2xpY3k7XG4gIHB1YmxpYyByZWFkb25seSB0ZW1wTGFtYmRhUm9sZT86IGF3cy5pYW0uUm9sZTtcbiAgcHVibGljIHJlYWRvbmx5IHVwZGF0ZWRCdWNrZXRQb2xpY3k/OiBhd3MuczMuQnVja2V0UG9saWN5O1xuXG4gIGNvbnN0cnVjdG9yKG5hbWU6IHN0cmluZywgYXJnczogUzNTdGFja0FyZ3MsIG9wdHM/OiBSZXNvdXJjZU9wdGlvbnMpIHtcbiAgICBzdXBlcigndGFwOnMzOlMzU3RhY2snLCBuYW1lLCBhcmdzLCBvcHRzKTtcblxuICAgIGNvbnN0IHsgZW52aXJvbm1lbnRTdWZmaXgsIGxhbWJkYVJvbGVBcm4sIHRhZ3MgfSA9IGFyZ3M7XG5cbiAgICAvLyBDcmVhdGUgYWNjZXNzIGxvZ3MgYnVja2V0XG4gICAgdGhpcy5hY2Nlc3NMb2dzQnVja2V0ID0gbmV3IGF3cy5zMy5CdWNrZXQoXG4gICAgICBgYWNjZXNzLWxvZ3MtYnVja2V0LSR7ZW52aXJvbm1lbnRTdWZmaXh9YCxcbiAgICAgIHtcbiAgICAgICAgdGFnczoge1xuICAgICAgICAgIE5hbWU6IGBhY2Nlc3MtbG9ncy1idWNrZXQtJHtlbnZpcm9ubWVudFN1ZmZpeH1gLFxuICAgICAgICAgIFB1cnBvc2U6ICdBY2Nlc3MgbG9ncyBzdG9yYWdlJyxcbiAgICAgICAgICAuLi50YWdzLFxuICAgICAgICB9LFxuICAgICAgfSxcbiAgICAgIHsgcGFyZW50OiB0aGlzIH1cbiAgICApO1xuXG4gICAgbmV3IGF3cy5zMy5CdWNrZXRQdWJsaWNBY2Nlc3NCbG9jayhcbiAgICAgIGBhY2Nlc3MtbG9ncy1wYWItJHtlbnZpcm9ubWVudFN1ZmZpeH1gLFxuICAgICAge1xuICAgICAgICBidWNrZXQ6IHRoaXMuYWNjZXNzTG9nc0J1Y2tldC5pZCxcbiAgICAgICAgYmxvY2tQdWJsaWNBY2xzOiB0cnVlLFxuICAgICAgICBibG9ja1B1YmxpY1BvbGljeTogdHJ1ZSxcbiAgICAgICAgaWdub3JlUHVibGljQWNsczogdHJ1ZSxcbiAgICAgICAgcmVzdHJpY3RQdWJsaWNCdWNrZXRzOiB0cnVlLFxuICAgICAgfSxcbiAgICAgIHsgcGFyZW50OiB0aGlzIH1cbiAgICApO1xuXG4gICAgLy8gQ3JlYXRlIG1haW4gUzMgYnVja2V0XG4gICAgdGhpcy5idWNrZXQgPSBuZXcgYXdzLnMzLkJ1Y2tldChcbiAgICAgIGBzZWN1cmUtZG9jLWJ1Y2tldC0ke2Vudmlyb25tZW50U3VmZml4fWAsXG4gICAgICB7XG4gICAgICAgIHRhZ3M6IHtcbiAgICAgICAgICBOYW1lOiBgc2VjdXJlLWRvYy1idWNrZXQtJHtlbnZpcm9ubWVudFN1ZmZpeH1gLFxuICAgICAgICAgIFB1cnBvc2U6ICdTZWN1cmUgZG9jdW1lbnQgc3RvcmFnZScsXG4gICAgICAgICAgLi4udGFncyxcbiAgICAgICAgfSxcbiAgICAgIH0sXG4gICAgICB7IHBhcmVudDogdGhpcyB9XG4gICAgKTtcblxuICAgIG5ldyBhd3MuczMuQnVja2V0VmVyc2lvbmluZyhcbiAgICAgIGBidWNrZXQtdmVyc2lvbmluZy0ke2Vudmlyb25tZW50U3VmZml4fWAsXG4gICAgICB7XG4gICAgICAgIGJ1Y2tldDogdGhpcy5idWNrZXQuaWQsXG4gICAgICAgIHZlcnNpb25pbmdDb25maWd1cmF0aW9uOiB7XG4gICAgICAgICAgc3RhdHVzOiAnRW5hYmxlZCcsXG4gICAgICAgIH0sXG4gICAgICB9LFxuICAgICAgeyBwYXJlbnQ6IHRoaXMgfVxuICAgICk7XG5cbiAgICBuZXcgYXdzLnMzLkJ1Y2tldFNlcnZlclNpZGVFbmNyeXB0aW9uQ29uZmlndXJhdGlvbihcbiAgICAgIGBidWNrZXQtZW5jcnlwdGlvbi0ke2Vudmlyb25tZW50U3VmZml4fWAsXG4gICAgICB7XG4gICAgICAgIGJ1Y2tldDogdGhpcy5idWNrZXQuaWQsXG4gICAgICAgIHJ1bGVzOiBbXG4gICAgICAgICAge1xuICAgICAgICAgICAgYXBwbHlTZXJ2ZXJTaWRlRW5jcnlwdGlvbkJ5RGVmYXVsdDoge1xuICAgICAgICAgICAgICBzc2VBbGdvcml0aG06ICdBRVMyNTYnLFxuICAgICAgICAgICAgfSxcbiAgICAgICAgICB9LFxuICAgICAgICBdLFxuICAgICAgfSxcbiAgICAgIHsgcGFyZW50OiB0aGlzIH1cbiAgICApO1xuXG4gICAgbmV3IGF3cy5zMy5CdWNrZXRQdWJsaWNBY2Nlc3NCbG9jayhcbiAgICAgIGBidWNrZXQtcGFiLSR7ZW52aXJvbm1lbnRTdWZmaXh9YCxcbiAgICAgIHtcbiAgICAgICAgYnVja2V0OiB0aGlzLmJ1Y2tldC5pZCxcbiAgICAgICAgYmxvY2tQdWJsaWNBY2xzOiB0cnVlLFxuICAgICAgICBibG9ja1B1YmxpY1BvbGljeTogdHJ1ZSxcbiAgICAgICAgaWdub3JlUHVibGljQWNsczogdHJ1ZSxcbiAgICAgICAgcmVzdHJpY3RQdWJsaWNCdWNrZXRzOiB0cnVlLFxuICAgICAgfSxcbiAgICAgIHsgcGFyZW50OiB0aGlzIH1cbiAgICApO1xuXG4gICAgbmV3IGF3cy5zMy5CdWNrZXRMb2dnaW5nKFxuICAgICAgYGJ1Y2tldC1sb2dnaW5nLSR7ZW52aXJvbm1lbnRTdWZmaXh9YCxcbiAgICAgIHtcbiAgICAgICAgYnVja2V0OiB0aGlzLmJ1Y2tldC5pZCxcbiAgICAgICAgdGFyZ2V0QnVja2V0OiB0aGlzLmFjY2Vzc0xvZ3NCdWNrZXQuaWQsXG4gICAgICAgIHRhcmdldFByZWZpeDogJ2FjY2Vzcy1sb2dzLycsXG4gICAgICB9LFxuICAgICAgeyBwYXJlbnQ6IHRoaXMgfVxuICAgICk7XG5cbiAgICBuZXcgYXdzLnMzLkJ1Y2tldExpZmVjeWNsZUNvbmZpZ3VyYXRpb24oXG4gICAgICBgYnVja2V0LWxpZmVjeWNsZS0ke2Vudmlyb25tZW50U3VmZml4fWAsXG4gICAgICB7XG4gICAgICAgIGJ1Y2tldDogdGhpcy5idWNrZXQuaWQsXG4gICAgICAgIHJ1bGVzOiBbXG4gICAgICAgICAge1xuICAgICAgICAgICAgaWQ6IGBjbGVhbnVwLWluY29tcGxldGUtdXBsb2Fkcy0ke2Vudmlyb25tZW50U3VmZml4fWAsXG4gICAgICAgICAgICBzdGF0dXM6ICdFbmFibGVkJyxcbiAgICAgICAgICAgIGFib3J0SW5jb21wbGV0ZU11bHRpcGFydFVwbG9hZDoge1xuICAgICAgICAgICAgICBkYXlzQWZ0ZXJJbml0aWF0aW9uOiA3LFxuICAgICAgICAgICAgfSxcbiAgICAgICAgICB9LFxuICAgICAgICAgIHtcbiAgICAgICAgICAgIGlkOiBgdHJhbnNpdGlvbi1vbGQtdmVyc2lvbnMtJHtlbnZpcm9ubWVudFN1ZmZpeH1gLFxuICAgICAgICAgICAgc3RhdHVzOiAnRW5hYmxlZCcsXG4gICAgICAgICAgICBub25jdXJyZW50VmVyc2lvblRyYW5zaXRpb25zOiBbXG4gICAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICBub25jdXJyZW50RGF5czogMzAsXG4gICAgICAgICAgICAgICAgc3RvcmFnZUNsYXNzOiAnU1RBTkRBUkRfSUEnLFxuICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgbm9uY3VycmVudERheXM6IDkwLFxuICAgICAgICAgICAgICAgIHN0b3JhZ2VDbGFzczogJ0dMQUNJRVInLFxuICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgXSxcbiAgICAgICAgICAgIG5vbmN1cnJlbnRWZXJzaW9uRXhwaXJhdGlvbjoge1xuICAgICAgICAgICAgICBub25jdXJyZW50RGF5czogMzY1LFxuICAgICAgICAgICAgfSxcbiAgICAgICAgICB9LFxuICAgICAgICBdLFxuICAgICAgfSxcbiAgICAgIHsgcGFyZW50OiB0aGlzIH1cbiAgICApO1xuXG4gICAgLy8gSWYgbm8gTGFtYmRhIHJvbGUgcHJvdmlkZWQsIGNyZWF0ZSBhIHRlbXBvcmFyeSBvbmVcbiAgICBpZiAoIWxhbWJkYVJvbGVBcm4pIHtcbiAgICAgIHRoaXMudGVtcExhbWJkYVJvbGUgPSBuZXcgYXdzLmlhbS5Sb2xlKFxuICAgICAgICBgdGVtcC1sYW1iZGEtcm9sZS0ke2Vudmlyb25tZW50U3VmZml4fWAsXG4gICAgICAgIHtcbiAgICAgICAgICBhc3N1bWVSb2xlUG9saWN5OiBKU09OLnN0cmluZ2lmeSh7XG4gICAgICAgICAgICBWZXJzaW9uOiAnMjAxMi0xMC0xNycsXG4gICAgICAgICAgICBTdGF0ZW1lbnQ6IFtcbiAgICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgIEFjdGlvbjogJ3N0czpBc3N1bWVSb2xlJyxcbiAgICAgICAgICAgICAgICBFZmZlY3Q6ICdBbGxvdycsXG4gICAgICAgICAgICAgICAgUHJpbmNpcGFsOiB7XG4gICAgICAgICAgICAgICAgICBTZXJ2aWNlOiAnbGFtYmRhLmFtYXpvbmF3cy5jb20nLFxuICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBdLFxuICAgICAgICAgIH0pLFxuICAgICAgICAgIHRhZ3MsXG4gICAgICAgIH0sXG4gICAgICAgIHsgcGFyZW50OiB0aGlzIH1cbiAgICAgICk7XG4gICAgfVxuXG4gICAgLy8gVXNlIHByb3ZpZGVkIHJvbGUgb3IgdGVtcG9yYXJ5IHJvbGUgZm9yIGluaXRpYWwgYnVja2V0IHBvbGljeVxuICAgIGNvbnN0IGluaXRpYWxSb2xlQXJuID0gbGFtYmRhUm9sZUFybiB8fCB0aGlzLnRlbXBMYW1iZGFSb2xlIS5hcm47XG5cbiAgICB0aGlzLmJ1Y2tldFBvbGljeSA9IG5ldyBhd3MuczMuQnVja2V0UG9saWN5KFxuICAgICAgYGJ1Y2tldC1wb2xpY3ktJHtlbnZpcm9ubWVudFN1ZmZpeH1gLFxuICAgICAge1xuICAgICAgICBidWNrZXQ6IHRoaXMuYnVja2V0LmlkLFxuICAgICAgICBwb2xpY3k6IHB1bHVtaVxuICAgICAgICAgIC5hbGwoW3RoaXMuYnVja2V0LmFybiwgaW5pdGlhbFJvbGVBcm5dKVxuICAgICAgICAgIC5hcHBseSgoW2J1Y2tldEFybiwgcm9sZUFybl0pID0+XG4gICAgICAgICAgICBKU09OLnN0cmluZ2lmeSh7XG4gICAgICAgICAgICAgIFZlcnNpb246ICcyMDEyLTEwLTE3JyxcbiAgICAgICAgICAgICAgSWQ6IGBTZWN1cmVCdWNrZXRQb2xpY3ktJHtlbnZpcm9ubWVudFN1ZmZpeH1gLFxuICAgICAgICAgICAgICBTdGF0ZW1lbnQ6IFtcbiAgICAgICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgICBTaWQ6ICdBbGxvd0xhbWJkYUFjY2VzcycsXG4gICAgICAgICAgICAgICAgICBFZmZlY3Q6ICdBbGxvdycsXG4gICAgICAgICAgICAgICAgICBQcmluY2lwYWw6IHtcbiAgICAgICAgICAgICAgICAgICAgQVdTOiByb2xlQXJuLFxuICAgICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICAgIEFjdGlvbjogW1xuICAgICAgICAgICAgICAgICAgICAnczM6UHV0T2JqZWN0JyxcbiAgICAgICAgICAgICAgICAgICAgJ3MzOlB1dE9iamVjdEFjbCcsXG4gICAgICAgICAgICAgICAgICAgICdzMzpHZXRPYmplY3QnLFxuICAgICAgICAgICAgICAgICAgICAnczM6R2V0T2JqZWN0VmVyc2lvbicsXG4gICAgICAgICAgICAgICAgICAgICdzMzpEZWxldGVPYmplY3QnLFxuICAgICAgICAgICAgICAgICAgICAnczM6TGlzdEJ1Y2tldCcsXG4gICAgICAgICAgICAgICAgICBdLFxuICAgICAgICAgICAgICAgICAgUmVzb3VyY2U6IFtidWNrZXRBcm4sIGAke2J1Y2tldEFybn0vKmBdLFxuICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgICAgU2lkOiAnRGVueUluc2VjdXJlQ29ubmVjdGlvbnMnLFxuICAgICAgICAgICAgICAgICAgRWZmZWN0OiAnRGVueScsXG4gICAgICAgICAgICAgICAgICBQcmluY2lwYWw6ICcqJyxcbiAgICAgICAgICAgICAgICAgIEFjdGlvbjogJ3MzOionLFxuICAgICAgICAgICAgICAgICAgUmVzb3VyY2U6IFtidWNrZXRBcm4sIGAke2J1Y2tldEFybn0vKmBdLFxuICAgICAgICAgICAgICAgICAgQ29uZGl0aW9uOiB7XG4gICAgICAgICAgICAgICAgICAgIEJvb2w6IHtcbiAgICAgICAgICAgICAgICAgICAgICAnYXdzOlNlY3VyZVRyYW5zcG9ydCc6ICdmYWxzZScsXG4gICAgICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgIF0sXG4gICAgICAgICAgICB9KVxuICAgICAgICAgICksXG4gICAgICB9LFxuICAgICAgeyBwYXJlbnQ6IHRoaXMgfVxuICAgICk7XG5cbiAgICB0aGlzLnJlZ2lzdGVyT3V0cHV0cyh7XG4gICAgICBidWNrZXROYW1lOiB0aGlzLmJ1Y2tldC5pZCxcbiAgICAgIGJ1Y2tldEFybjogdGhpcy5idWNrZXQuYXJuLFxuICAgICAgYWNjZXNzTG9nc0J1Y2tldE5hbWU6IHRoaXMuYWNjZXNzTG9nc0J1Y2tldC5pZCxcbiAgICAgIGFjY2Vzc0xvZ3NCdWNrZXRBcm46IHRoaXMuYWNjZXNzTG9nc0J1Y2tldC5hcm4sXG4gICAgICB0ZW1wTGFtYmRhUm9sZUFybjogdGhpcy50ZW1wTGFtYmRhUm9sZT8uYXJuLFxuICAgICAgYnVja2V0UG9saWN5SWQ6IHRoaXMuYnVja2V0UG9saWN5LmlkLFxuICAgIH0pO1xuICB9XG5cbiAgLy8gTWV0aG9kIHRvIHVwZGF0ZSBidWNrZXQgcG9saWN5IHdpdGggcmVhbCBMYW1iZGEgcm9sZVxuICBwdWJsaWMgdXBkYXRlQnVja2V0UG9saWN5KFxuICAgIHJlYWxMYW1iZGFSb2xlQXJuOiBwdWx1bWkuSW5wdXQ8c3RyaW5nPlxuICApOiBhd3MuczMuQnVja2V0UG9saWN5IHtcbiAgICByZXR1cm4gbmV3IGF3cy5zMy5CdWNrZXRQb2xpY3koXG4gICAgICAnYnVja2V0LXBvbGljeS11cGRhdGVkLWZpbmFsJyxcbiAgICAgIHtcbiAgICAgICAgYnVja2V0OiB0aGlzLmJ1Y2tldC5pZCxcbiAgICAgICAgcG9saWN5OiBwdWx1bWlcbiAgICAgICAgICAuYWxsKFt0aGlzLmJ1Y2tldC5hcm4sIHJlYWxMYW1iZGFSb2xlQXJuXSlcbiAgICAgICAgICAuYXBwbHkoKFtidWNrZXRBcm4sIHJvbGVBcm5dKSA9PlxuICAgICAgICAgICAgSlNPTi5zdHJpbmdpZnkoe1xuICAgICAgICAgICAgICBWZXJzaW9uOiAnMjAxMi0xMC0xNycsXG4gICAgICAgICAgICAgIElkOiAnU2VjdXJlQnVja2V0UG9saWN5LXNpbXBsaWZpZWQnLFxuICAgICAgICAgICAgICBTdGF0ZW1lbnQ6IFtcbiAgICAgICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgICBTaWQ6ICdBbGxvd0xhbWJkYUFjY2VzcycsXG4gICAgICAgICAgICAgICAgICBFZmZlY3Q6ICdBbGxvdycsXG4gICAgICAgICAgICAgICAgICBQcmluY2lwYWw6IHtcbiAgICAgICAgICAgICAgICAgICAgQVdTOiByb2xlQXJuLFxuICAgICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICAgIEFjdGlvbjogW1xuICAgICAgICAgICAgICAgICAgICAnczM6UHV0T2JqZWN0JyxcbiAgICAgICAgICAgICAgICAgICAgJ3MzOlB1dE9iamVjdEFjbCcsXG4gICAgICAgICAgICAgICAgICAgICdzMzpHZXRPYmplY3QnLFxuICAgICAgICAgICAgICAgICAgICAnczM6R2V0T2JqZWN0VmVyc2lvbicsXG4gICAgICAgICAgICAgICAgICAgICdzMzpEZWxldGVPYmplY3QnLFxuICAgICAgICAgICAgICAgICAgICAnczM6TGlzdEJ1Y2tldCcsXG4gICAgICAgICAgICAgICAgICBdLFxuICAgICAgICAgICAgICAgICAgUmVzb3VyY2U6IFtidWNrZXRBcm4sIGAke2J1Y2tldEFybn0vKmBdLFxuICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgICAgU2lkOiAnRGVueUluc2VjdXJlQ29ubmVjdGlvbnMnLFxuICAgICAgICAgICAgICAgICAgRWZmZWN0OiAnRGVueScsXG4gICAgICAgICAgICAgICAgICBQcmluY2lwYWw6ICcqJyxcbiAgICAgICAgICAgICAgICAgIEFjdGlvbjogJ3MzOionLFxuICAgICAgICAgICAgICAgICAgUmVzb3VyY2U6IFtidWNrZXRBcm4sIGAke2J1Y2tldEFybn0vKmBdLFxuICAgICAgICAgICAgICAgICAgQ29uZGl0aW9uOiB7XG4gICAgICAgICAgICAgICAgICAgIEJvb2w6IHtcbiAgICAgICAgICAgICAgICAgICAgICAnYXdzOlNlY3VyZVRyYW5zcG9ydCc6ICdmYWxzZScsXG4gICAgICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgIF0sXG4gICAgICAgICAgICB9KVxuICAgICAgICAgICksXG4gICAgICB9LFxuICAgICAgeyBwYXJlbnQ6IHRoaXMgfVxuICAgICk7XG4gIH1cbn1cbiJdfQ==