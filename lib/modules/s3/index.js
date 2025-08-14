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
exports.SecureS3Bucket = void 0;
const aws = __importStar(require("@pulumi/aws"));
const pulumi = __importStar(require("@pulumi/pulumi"));
const tags_1 = require("../../config/tags");
class SecureS3Bucket extends pulumi.ComponentResource {
    bucket;
    bucketPolicy;
    publicAccessBlock;
    accessLogsBucket;
    constructor(name, args, opts) {
        super('custom:security:SecureS3Bucket', name, {}, opts);
        // Input validation
        if (!args.kmsKeyId) {
            throw new Error(`KMS Key ID is required for secure S3 bucket ${name}`);
        }
        // Validate bucket name if provided
        if (args.bucketName) {
            const bucketNameRegex = /^[a-z0-9][a-z0-9.-]*[a-z0-9]$/;
            if (!bucketNameRegex.test(args.bucketName) ||
                args.bucketName.length < 3 ||
                args.bucketName.length > 63) {
                throw new Error(`Invalid bucket name ${args.bucketName}. Must be 3-63 characters, lowercase, and follow S3 naming rules.`);
            }
        }
        // Create access logs bucket only if logging is enabled (default: true)
        const enableLogging = args.enableAccessLogging !== false;
        if (enableLogging) {
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
        // Create S3 bucket
        this.bucket = new aws.s3.Bucket(`${name}-bucket`, {
            bucket: args.bucketName,
            forceDestroy: false,
            tags: { ...tags_1.commonTags, ...args.tags },
        }, { parent: this });
        // Enable versioning with error handling
        try {
            new aws.s3.BucketVersioning(`${name}-versioning`, {
                bucket: this.bucket.id,
                versioningConfiguration: {
                    status: 'Enabled',
                    mfaDelete: 'Disabled', // Can be enabled if MFA delete is required
                },
            }, {
                parent: this,
                dependsOn: [this.bucket],
            });
        }
        catch (error) {
            console.warn(`Warning: Failed to configure versioning for bucket ${name}:`, error);
            // Versioning is important for security, so we should still try to continue
        }
        // Configure server-side encryption with error handling
        try {
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
            }, {
                parent: this,
                dependsOn: [this.bucket],
            });
        }
        catch (error) {
            console.warn(`Warning: Failed to configure encryption for bucket ${name}:`, error);
            throw new Error(`Critical: Cannot create secure S3 bucket without encryption: ${error}`);
        }
        // Block all public access
        this.publicAccessBlock = new aws.s3.BucketPublicAccessBlock(`${name}-public-access-block`, {
            bucket: this.bucket.id,
            blockPublicAcls: true,
            blockPublicPolicy: true,
            ignorePublicAcls: true,
            restrictPublicBuckets: true,
        }, { parent: this });
        // Secure bucket policy with error handling (optional)
        if (args.enableBucketPolicy !== false) {
            const bucketPolicyDocument = pulumi
                .all([
                this.bucket.arn,
                aws.getCallerIdentity().then(id => id.accountId),
            ])
                .apply(([bucketArn, accountId]) => {
                try {
                    if (!bucketArn || !accountId) {
                        throw new Error('Missing required values for bucket policy creation');
                    }
                    return {
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
                        ],
                    };
                }
                catch (error) {
                    console.warn(`Warning: Error creating bucket policy for ${name}:`, error);
                    // Return a minimal policy that still enforces security
                    return {
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
                        ],
                    };
                }
            });
            this.bucketPolicy = new aws.s3.BucketPolicy(`${name}-policy`, {
                bucket: this.bucket.id,
                policy: bucketPolicyDocument.apply(policy => JSON.stringify(policy)),
            }, { parent: this, dependsOn: [this.publicAccessBlock] });
        }
        // Configure lifecycle rules with validation and error handling
        if (args.lifecycleRules && args.lifecycleRules.length > 0) {
            try {
                // Validate lifecycle rules structure
                const validatedRules = args.lifecycleRules.filter(rule => {
                    if (!rule.id || !rule.status) {
                        console.warn(`Warning: Skipping invalid lifecycle rule for bucket ${name}:`, rule);
                        return false;
                    }
                    return true;
                });
                if (validatedRules.length > 0) {
                    new aws.s3.BucketLifecycleConfiguration(`${name}-lifecycle`, {
                        bucket: this.bucket.id,
                        rules: validatedRules,
                    }, {
                        parent: this,
                        dependsOn: [this.bucket],
                    });
                }
            }
            catch (error) {
                console.warn(`Warning: Failed to configure lifecycle rules for bucket ${name}:`, error);
            }
        }
        // Enable access logging with proper dependency management and error resilience
        if (enableLogging && this.accessLogsBucket) {
            new aws.s3.BucketLogging(`${name}-logging`, {
                bucket: this.bucket.id,
                targetBucket: this.accessLogsBucket.id,
                targetPrefix: 'access-logs/',
            }, {
                parent: this,
                dependsOn: [this.accessLogsBucket, this.publicAccessBlock],
                // Add error handling through resource options
                ignoreChanges: [], // Allow updates if needed
                retainOnDelete: false, // Clean up on deletion
            });
        }
        this.registerOutputs({
            bucketName: this.bucket.id,
            bucketArn: this.bucket.arn,
            bucketDomainName: this.bucket.bucketDomainName,
            accessLogsBucketName: this.accessLogsBucket?.id,
            accessLogsBucketArn: this.accessLogsBucket?.arn,
        });
    }
}
exports.SecureS3Bucket = SecureS3Bucket;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJpbmRleC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFBQSxpREFBbUM7QUFDbkMsdURBQXlDO0FBQ3pDLDRDQUErQztBQVcvQyxNQUFhLGNBQWUsU0FBUSxNQUFNLENBQUMsaUJBQWlCO0lBQzFDLE1BQU0sQ0FBZ0I7SUFDdEIsWUFBWSxDQUFzQjtJQUNsQyxpQkFBaUIsQ0FBaUM7SUFDbEQsZ0JBQWdCLENBQWlCO0lBRWpELFlBQ0UsSUFBWSxFQUNaLElBQXdCLEVBQ3hCLElBQXNDO1FBRXRDLEtBQUssQ0FBQyxnQ0FBZ0MsRUFBRSxJQUFJLEVBQUUsRUFBRSxFQUFFLElBQUksQ0FBQyxDQUFDO1FBRXhELG1CQUFtQjtRQUNuQixJQUFJLENBQUMsSUFBSSxDQUFDLFFBQVEsRUFBRSxDQUFDO1lBQ25CLE1BQU0sSUFBSSxLQUFLLENBQUMsK0NBQStDLElBQUksRUFBRSxDQUFDLENBQUM7UUFDekUsQ0FBQztRQUVELG1DQUFtQztRQUNuQyxJQUFJLElBQUksQ0FBQyxVQUFVLEVBQUUsQ0FBQztZQUNwQixNQUFNLGVBQWUsR0FBRywrQkFBK0IsQ0FBQztZQUN4RCxJQUNFLENBQUMsZUFBZSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsVUFBVSxDQUFDO2dCQUN0QyxJQUFJLENBQUMsVUFBVSxDQUFDLE1BQU0sR0FBRyxDQUFDO2dCQUMxQixJQUFJLENBQUMsVUFBVSxDQUFDLE1BQU0sR0FBRyxFQUFFLEVBQzNCLENBQUM7Z0JBQ0QsTUFBTSxJQUFJLEtBQUssQ0FDYix1QkFBdUIsSUFBSSxDQUFDLFVBQVUsbUVBQW1FLENBQzFHLENBQUM7WUFDSixDQUFDO1FBQ0gsQ0FBQztRQUVELHVFQUF1RTtRQUN2RSxNQUFNLGFBQWEsR0FBRyxJQUFJLENBQUMsbUJBQW1CLEtBQUssS0FBSyxDQUFDO1FBRXpELElBQUksYUFBYSxFQUFF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QUNGO0FBclNELHdDQXFTQyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCAqIGFzIGF3cyBmcm9tICdAcHVsdW1pL2F3cyc7XG5pbXBvcnQgKiBhcyBwdWx1bWkgZnJvbSAnQHB1bHVtaS9wdWx1bWknO1xuaW1wb3J0IHsgY29tbW9uVGFncyB9IGZyb20gJy4uLy4uL2NvbmZpZy90YWdzJztcblxuZXhwb3J0IGludGVyZmFjZSBTZWN1cmVTM0J1Y2tldEFyZ3Mge1xuICBidWNrZXROYW1lPzogc3RyaW5nO1xuICBrbXNLZXlJZDogcHVsdW1pLklucHV0PHN0cmluZz47XG4gIHRhZ3M/OiBSZWNvcmQ8c3RyaW5nLCBzdHJpbmc+O1xuICBsaWZlY3ljbGVSdWxlcz86IGFueVtdO1xuICBlbmFibGVCdWNrZXRQb2xpY3k/OiBib29sZWFuOyAvLyBPcHRpb25hbCBmbGFnIHRvIGVuYWJsZS9kaXNhYmxlIGJ1Y2tldCBwb2xpY3lcbiAgZW5hYmxlQWNjZXNzTG9nZ2luZz86IGJvb2xlYW47IC8vIE9wdGlvbmFsIGZsYWcgdG8gZW5hYmxlL2Rpc2FibGUgYWNjZXNzIGxvZ2dpbmdcbn1cblxuZXhwb3J0IGNsYXNzIFNlY3VyZVMzQnVja2V0IGV4dGVuZHMgcHVsdW1pLkNvbXBvbmVudFJlc291cmNlIHtcbiAgcHVibGljIHJlYWRvbmx5IGJ1Y2tldDogYXdzLnMzLkJ1Y2tldDtcbiAgcHVibGljIHJlYWRvbmx5IGJ1Y2tldFBvbGljeTogYXdzLnMzLkJ1Y2tldFBvbGljeTtcbiAgcHVibGljIHJlYWRvbmx5IHB1YmxpY0FjY2Vzc0Jsb2NrOiBhd3MuczMuQnVja2V0UHVibGljQWNjZXNzQmxvY2s7XG4gIHB1YmxpYyByZWFkb25seSBhY2Nlc3NMb2dzQnVja2V0PzogYXdzLnMzLkJ1Y2tldDtcblxuICBjb25zdHJ1Y3RvcihcbiAgICBuYW1lOiBzdHJpbmcsXG4gICAgYXJnczogU2VjdXJlUzNCdWNrZXRBcmdzLFxuICAgIG9wdHM/OiBwdWx1bWkuQ29tcG9uZW50UmVzb3VyY2VPcHRpb25zXG4gICkge1xuICAgIHN1cGVyKCdjdXN0b206c2VjdXJpdHk6U2VjdXJlUzNCdWNrZXQnLCBuYW1lLCB7fSwgb3B0cyk7XG5cbiAgICAvLyBJbnB1dCB2YWxpZGF0aW9uXG4gICAgaWYgKCFhcmdzLmttc0tleUlkKSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoYEtNUyBLZXkgSUQgaXMgcmVxdWlyZWQgZm9yIHNlY3VyZSBTMyBidWNrZXQgJHtuYW1lfWApO1xuICAgIH1cblxuICAgIC8vIFZhbGlkYXRlIGJ1Y2tldCBuYW1lIGlmIHByb3ZpZGVkXG4gICAgaWYgKGFyZ3MuYnVja2V0TmFtZSkge1xuICAgICAgY29uc3QgYnVja2V0TmFtZVJlZ2V4ID0gL15bYS16MC05XVthLXowLTkuLV0qW2EtejAtOV0kLztcbiAgICAgIGlmIChcbiAgICAgICAgIWJ1Y2tldE5hbWVSZWdleC50ZXN0KGFyZ3MuYnVja2V0TmFtZSkgfHxcbiAgICAgICAgYXJncy5idWNrZXROYW1lLmxlbmd0aCA8IDMgfHxcbiAgICAgICAgYXJncy5idWNrZXROYW1lLmxlbmd0aCA+IDYzXG4gICAgICApIHtcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKFxuICAgICAgICAgIGBJbnZhbGlkIGJ1Y2tldCBuYW1lICR7YXJncy5idWNrZXROYW1lfS4gTXVzdCBiZSAzLTYzIGNoYXJhY3RlcnMsIGxvd2VyY2FzZSwgYW5kIGZvbGxvdyBTMyBuYW1pbmcgcnVsZXMuYFxuICAgICAgICApO1xuICAgICAgfVxuICAgIH1cblxuICAgIC8vIENyZWF0ZSBhY2Nlc3MgbG9ncyBidWNrZXQgb25seSBpZiBsb2dnaW5nIGlzIGVuYWJsZWQgKGRlZmF1bHQ6IHRydWUpXG4gICAgY29uc3QgZW5hYmxlTG9nZ2luZyA9IGFyZ3MuZW5hYmxlQWNjZXNzTG9nZ2luZyAhPT0gZmFsc2U7XG5cbiAgICBpZiAoZW5hYmxlTG9nZ2luZykge1xuICAgICAgdGhpcy5hY2Nlc3NMb2dzQnVja2V0ID0gbmV3IGF3cy5zMy5CdWNrZXQoXG4gICAgICAgIGAke25hbWV9LWFjY2Vzcy1sb2dzYCxcbiAgICAgICAge1xuICAgICAgICAgIGJ1Y2tldDogYXJncy5idWNrZXROYW1lXG4gICAgICAgICAgICA/IGAke2FyZ3MuYnVja2V0TmFtZX0tYWNjZXNzLWxvZ3NgXG4gICAgICAgICAgICA6IHVuZGVmaW5lZCxcbiAgICAgICAgICBmb3JjZURlc3Ryb3k6IGZhbHNlLFxuICAgICAgICAgIHRhZ3M6IHsgLi4uY29tbW9uVGFncywgLi4uYXJncy50YWdzLCBQdXJwb3NlOiAnQWNjZXNzIExvZ3MnIH0sXG4gICAgICAgIH0sXG4gICAgICAgIHsgcGFyZW50OiB0aGlzIH1cbiAgICAgICk7XG5cbiAgICAgIC8vIEJsb2NrIHB1YmxpYyBhY2Nlc3MgZm9yIGxvZ3MgYnVja2V0XG4gICAgICBuZXcgYXdzLnMzLkJ1Y2tldFB1YmxpY0FjY2Vzc0Jsb2NrKFxuICAgICAgICBgJHtuYW1lfS1sb2dzLXB1YmxpYy1hY2Nlc3MtYmxvY2tgLFxuICAgICAgICB7XG4gICAgICAgICAgYnVja2V0OiB0aGlzLmFjY2Vzc0xvZ3NCdWNrZXQuaWQsXG4gICAgICAgICAgYmxvY2tQdWJsaWNBY2xzOiB0cnVlLFxuICAgICAgICAgIGJsb2NrUHVibGljUG9saWN5OiB0cnVlLFxuICAgICAgICAgIGlnbm9yZVB1YmxpY0FjbHM6IHRydWUsXG4gICAgICAgICAgcmVzdHJpY3RQdWJsaWNCdWNrZXRzOiB0cnVlLFxuICAgICAgICB9LFxuICAgICAgICB7IHBhcmVudDogdGhpcyB9XG4gICAgICApO1xuICAgIH1cblxuICAgIC8vIENyZWF0ZSBTMyBidWNrZXRcbiAgICB0aGlzLmJ1Y2tldCA9IG5ldyBhd3MuczMuQnVja2V0KFxuICAgICAgYCR7bmFtZX0tYnVja2V0YCxcbiAgICAgIHtcbiAgICAgICAgYnVja2V0OiBhcmdzLmJ1Y2tldE5hbWUsXG4gICAgICAgIGZvcmNlRGVzdHJveTogZmFsc2UsXG4gICAgICAgIHRhZ3M6IHsgLi4uY29tbW9uVGFncywgLi4uYXJncy50YWdzIH0sXG4gICAgICB9LFxuICAgICAgeyBwYXJlbnQ6IHRoaXMgfVxuICAgICk7XG5cbiAgICAvLyBFbmFibGUgdmVyc2lvbmluZyB3aXRoIGVycm9yIGhhbmRsaW5nXG4gICAgdHJ5IHtcbiAgICAgIG5ldyBhd3MuczMuQnVja2V0VmVyc2lvbmluZyhcbiAgICAgICAgYCR7bmFtZX0tdmVyc2lvbmluZ2AsXG4gICAgICAgIHtcbiAgICAgICAgICBidWNrZXQ6IHRoaXMuYnVja2V0LmlkLFxuICAgICAgICAgIHZlcnNpb25pbmdDb25maWd1cmF0aW9uOiB7XG4gICAgICAgICAgICBzdGF0dXM6ICdFbmFibGVkJyxcbiAgICAgICAgICAgIG1mYURlbGV0ZTogJ0Rpc2FibGVkJywgLy8gQ2FuIGJlIGVuYWJsZWQgaWYgTUZBIGRlbGV0ZSBpcyByZXF1aXJlZFxuICAgICAgICAgIH0sXG4gICAgICAgIH0sXG4gICAgICAgIHtcbiAgICAgICAgICBwYXJlbnQ6IHRoaXMsXG4gICAgICAgICAgZGVwZW5kc09uOiBbdGhpcy5idWNrZXRdLFxuICAgICAgICB9XG4gICAgICApO1xuICAgIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgICBjb25zb2xlLndhcm4oXG4gICAgICAgIGBXYXJuaW5nOiBGYWlsZWQgdG8gY29uZmlndXJlIHZlcnNpb25pbmcgZm9yIGJ1Y2tldCAke25hbWV9OmAsXG4gICAgICAgIGVycm9yXG4gICAgICApO1xuICAgICAgLy8gVmVyc2lvbmluZyBpcyBpbXBvcnRhbnQgZm9yIHNlY3VyaXR5LCBzbyB3ZSBzaG91bGQgc3RpbGwgdHJ5IHRvIGNvbnRpbnVlXG4gICAgfVxuXG4gICAgLy8gQ29uZmlndXJlIHNlcnZlci1zaWRlIGVuY3J5cHRpb24gd2l0aCBlcnJvciBoYW5kbGluZ1xuICAgIHRyeSB7XG4gICAgICBuZXcgYXdzLnMzLkJ1Y2tldFNlcnZlclNpZGVFbmNyeXB0aW9uQ29uZmlndXJhdGlvbihcbiAgICAgICAgYCR7bmFtZX0tZW5jcnlwdGlvbmAsXG4gICAgICAgIHtcbiAgICAgICAgICBidWNrZXQ6IHRoaXMuYnVja2V0LmlkLFxuICAgICAgICAgIHJ1bGVzOiBbXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgIGFwcGx5U2VydmVyU2lkZUVuY3J5cHRpb25CeURlZmF1bHQ6IHtcbiAgICAgICAgICAgICAgICBzc2VBbGdvcml0aG06ICdhd3M6a21zJyxcbiAgICAgICAgICAgICAgICBrbXNNYXN0ZXJLZXlJZDogYXJncy5rbXNLZXlJZCxcbiAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgYnVja2V0S2V5RW5hYmxlZDogdHJ1ZSxcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgXSxcbiAgICAgICAgfSxcbiAgICAgICAge1xuICAgICAgICAgIHBhcmVudDogdGhpcyxcbiAgICAgICAgICBkZXBlbmRzT246IFt0aGlzLmJ1Y2tldF0sXG4gICAgICAgIH1cbiAgICAgICk7XG4gICAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICAgIGNvbnNvbGUud2FybihcbiAgICAgICAgYFdhcm5pbmc6IEZhaWxlZCB0byBjb25maWd1cmUgZW5jcnlwdGlvbiBmb3IgYnVja2V0ICR7bmFtZX06YCxcbiAgICAgICAgZXJyb3JcbiAgICAgICk7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoXG4gICAgICAgIGBDcml0aWNhbDogQ2Fubm90IGNyZWF0ZSBzZWN1cmUgUzMgYnVja2V0IHdpdGhvdXQgZW5jcnlwdGlvbjogJHtlcnJvcn1gXG4gICAgICApO1xuICAgIH1cblxuICAgIC8vIEJsb2NrIGFsbCBwdWJsaWMgYWNjZXNzXG4gICAgdGhpcy5wdWJsaWNBY2Nlc3NCbG9jayA9IG5ldyBhd3MuczMuQnVja2V0UHVibGljQWNjZXNzQmxvY2soXG4gICAgICBgJHtuYW1lfS1wdWJsaWMtYWNjZXNzLWJsb2NrYCxcbiAgICAgIHtcbiAgICAgICAgYnVja2V0OiB0aGlzLmJ1Y2tldC5pZCxcbiAgICAgICAgYmxvY2tQdWJsaWNBY2xzOiB0cnVlLFxuICAgICAgICBibG9ja1B1YmxpY1BvbGljeTogdHJ1ZSxcbiAgICAgICAgaWdub3JlUHVibGljQWNsczogdHJ1ZSxcbiAgICAgICAgcmVzdHJpY3RQdWJsaWNCdWNrZXRzOiB0cnVlLFxuICAgICAgfSxcbiAgICAgIHsgcGFyZW50OiB0aGlzIH1cbiAgICApO1xuXG4gICAgLy8gU2VjdXJlIGJ1Y2tldCBwb2xpY3kgd2l0aCBlcnJvciBoYW5kbGluZyAob3B0aW9uYWwpXG4gICAgaWYgKGFyZ3MuZW5hYmxlQnVja2V0UG9saWN5ICE9PSBmYWxzZSkge1xuICAgICAgY29uc3QgYnVja2V0UG9saWN5RG9jdW1lbnQgPSBwdWx1bWlcbiAgICAgICAgLmFsbChbXG4gICAgICAgICAgdGhpcy5idWNrZXQuYXJuLFxuICAgICAgICAgIGF3cy5nZXRDYWxsZXJJZGVudGl0eSgpLnRoZW4oaWQgPT4gaWQuYWNjb3VudElkKSxcbiAgICAgICAgXSlcbiAgICAgICAgLmFwcGx5KChbYnVja2V0QXJuLCBhY2NvdW50SWRdKSA9PiB7XG4gICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIGlmICghYnVja2V0QXJuIHx8ICFhY2NvdW50SWQpIHtcbiAgICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKFxuICAgICAgICAgICAgICAgICdNaXNzaW5nIHJlcXVpcmVkIHZhbHVlcyBmb3IgYnVja2V0IHBvbGljeSBjcmVhdGlvbidcbiAgICAgICAgICAgICAgKTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgICAgVmVyc2lvbjogJzIwMTItMTAtMTcnLFxuICAgICAgICAgICAgICBTdGF0ZW1lbnQ6IFtcbiAgICAgICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgICBTaWQ6ICdBbGxvd1Jvb3RBY2NvdW50RnVsbEFjY2VzcycsXG4gICAgICAgICAgICAgICAgICBFZmZlY3Q6ICdBbGxvdycsXG4gICAgICAgICAgICAgICAgICBQcmluY2lwYWw6IHtcbiAgICAgICAgICAgICAgICAgICAgQVdTOiBgYXJuOmF3czppYW06OiR7YWNjb3VudElkfTpyb290YCxcbiAgICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgICBBY3Rpb246ICdzMzoqJyxcbiAgICAgICAgICAgICAgICAgIFJlc291cmNlOiBbYnVja2V0QXJuLCBgJHtidWNrZXRBcm59LypgXSxcbiAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICAgIFNpZDogJ0RlbnlJbnNlY3VyZUNvbm5lY3Rpb25zJyxcbiAgICAgICAgICAgICAgICAgIEVmZmVjdDogJ0RlbnknLFxuICAgICAgICAgICAgICAgICAgUHJpbmNpcGFsOiAnKicsXG4gICAgICAgICAgICAgICAgICBBY3Rpb246ICdzMzoqJyxcbiAgICAgICAgICAgICAgICAgIFJlc291cmNlOiBbYnVja2V0QXJuLCBgJHtidWNrZXRBcm59LypgXSxcbiAgICAgICAgICAgICAgICAgIENvbmRpdGlvbjoge1xuICAgICAgICAgICAgICAgICAgICBCb29sOiB7XG4gICAgICAgICAgICAgICAgICAgICAgJ2F3czpTZWN1cmVUcmFuc3BvcnQnOiAnZmFsc2UnLFxuICAgICAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICAgIFNpZDogJ0RlbnlVbmVuY3J5cHRlZE9iamVjdFVwbG9hZHMnLFxuICAgICAgICAgICAgICAgICAgRWZmZWN0OiAnRGVueScsXG4gICAgICAgICAgICAgICAgICBQcmluY2lwYWw6ICcqJyxcbiAgICAgICAgICAgICAgICAgIEFjdGlvbjogJ3MzOlB1dE9iamVjdCcsXG4gICAgICAgICAgICAgICAgICBSZXNvdXJjZTogYCR7YnVja2V0QXJufS8qYCxcbiAgICAgICAgICAgICAgICAgIENvbmRpdGlvbjoge1xuICAgICAgICAgICAgICAgICAgICBTdHJpbmdOb3RFcXVhbHM6IHtcbiAgICAgICAgICAgICAgICAgICAgICAnczM6eC1hbXotc2VydmVyLXNpZGUtZW5jcnlwdGlvbic6ICdhd3M6a21zJyxcbiAgICAgICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgXSxcbiAgICAgICAgICAgIH07XG4gICAgICAgICAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICAgICAgICAgIGNvbnNvbGUud2FybihcbiAgICAgICAgICAgICAgYFdhcm5pbmc6IEVycm9yIGNyZWF0aW5nIGJ1Y2tldCBwb2xpY3kgZm9yICR7bmFtZX06YCxcbiAgICAgICAgICAgICAgZXJyb3JcbiAgICAgICAgICAgICk7XG4gICAgICAgICAgICAvLyBSZXR1cm4gYSBtaW5pbWFsIHBvbGljeSB0aGF0IHN0aWxsIGVuZm9yY2VzIHNlY3VyaXR5XG4gICAgICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgICBWZXJzaW9uOiAnMjAxMi0xMC0xNycsXG4gICAgICAgICAgICAgIFN0YXRlbWVudDogW1xuICAgICAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICAgIFNpZDogJ0RlbnlJbnNlY3VyZUNvbm5lY3Rpb25zJyxcbiAgICAgICAgICAgICAgICAgIEVmZmVjdDogJ0RlbnknLFxuICAgICAgICAgICAgICAgICAgUHJpbmNpcGFsOiAnKicsXG4gICAgICAgICAgICAgICAgICBBY3Rpb246ICdzMzoqJyxcbiAgICAgICAgICAgICAgICAgIFJlc291cmNlOiBbYnVja2V0QXJuLCBgJHtidWNrZXRBcm59LypgXSxcbiAgICAgICAgICAgICAgICAgIENvbmRpdGlvbjoge1xuICAgICAgICAgICAgICAgICAgICBCb29sOiB7XG4gICAgICAgICAgICAgICAgICAgICAgJ2F3czpTZWN1cmVUcmFuc3BvcnQnOiAnZmFsc2UnLFxuICAgICAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICBdLFxuICAgICAgICAgICAgfTtcbiAgICAgICAgICB9XG4gICAgICAgIH0pO1xuXG4gICAgICB0aGlzLmJ1Y2tldFBvbGljeSA9IG5ldyBhd3MuczMuQnVja2V0UG9saWN5KFxuICAgICAgICBgJHtuYW1lfS1wb2xpY3lgLFxuICAgICAgICB7XG4gICAgICAgICAgYnVja2V0OiB0aGlzLmJ1Y2tldC5pZCxcbiAgICAgICAgICBwb2xpY3k6IGJ1Y2tldFBvbGljeURvY3VtZW50LmFwcGx5KHBvbGljeSA9PiBKU09OLnN0cmluZ2lmeShwb2xpY3kpKSxcbiAgICAgICAgfSxcbiAgICAgICAgeyBwYXJlbnQ6IHRoaXMsIGRlcGVuZHNPbjogW3RoaXMucHVibGljQWNjZXNzQmxvY2tdIH1cbiAgICAgICk7XG4gICAgfVxuXG4gICAgLy8gQ29uZmlndXJlIGxpZmVjeWNsZSBydWxlcyB3aXRoIHZhbGlkYXRpb24gYW5kIGVycm9yIGhhbmRsaW5nXG4gICAgaWYgKGFyZ3MubGlmZWN5Y2xlUnVsZXMgJiYgYXJncy5saWZlY3ljbGVSdWxlcy5sZW5ndGggPiAwKSB7XG4gICAgICB0cnkge1xuICAgICAgICAvLyBWYWxpZGF0ZSBsaWZlY3ljbGUgcnVsZXMgc3RydWN0dXJlXG4gICAgICAgIGNvbnN0IHZhbGlkYXRlZFJ1bGVzID0gYXJncy5saWZlY3ljbGVSdWxlcy5maWx0ZXIocnVsZSA9PiB7XG4gICAgICAgICAgaWYgKCFydWxlLmlkIHx8ICFydWxlLnN0YXR1cykge1xuICAgICAgICAgICAgY29uc29sZS53YXJuKFxuICAgICAgICAgICAgICBgV2FybmluZzogU2tpcHBpbmcgaW52YWxpZCBsaWZlY3ljbGUgcnVsZSBmb3IgYnVja2V0ICR7bmFtZX06YCxcbiAgICAgICAgICAgICAgcnVsZVxuICAgICAgICAgICAgKTtcbiAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgICB9XG4gICAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICAgIH0pO1xuXG4gICAgICAgIGlmICh2YWxpZGF0ZWRSdWxlcy5sZW5ndGggPiAwKSB7XG4gICAgICAgICAgbmV3IGF3cy5zMy5CdWNrZXRMaWZlY3ljbGVDb25maWd1cmF0aW9uKFxuICAgICAgICAgICAgYCR7bmFtZX0tbGlmZWN5Y2xlYCxcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgYnVja2V0OiB0aGlzLmJ1Y2tldC5pZCxcbiAgICAgICAgICAgICAgcnVsZXM6IHZhbGlkYXRlZFJ1bGVzLFxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgcGFyZW50OiB0aGlzLFxuICAgICAgICAgICAgICBkZXBlbmRzT246IFt0aGlzLmJ1Y2tldF0sXG4gICAgICAgICAgICB9XG4gICAgICAgICAgKTtcbiAgICAgICAgfVxuICAgICAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICAgICAgY29uc29sZS53YXJuKFxuICAgICAgICAgIGBXYXJuaW5nOiBGYWlsZWQgdG8gY29uZmlndXJlIGxpZmVjeWNsZSBydWxlcyBmb3IgYnVja2V0ICR7bmFtZX06YCxcbiAgICAgICAgICBlcnJvclxuICAgICAgICApO1xuICAgICAgfVxuICAgIH1cblxuICAgIC8vIEVuYWJsZSBhY2Nlc3MgbG9nZ2luZyB3aXRoIHByb3BlciBkZXBlbmRlbmN5IG1hbmFnZW1lbnQgYW5kIGVycm9yIHJlc2lsaWVuY2VcbiAgICBpZiAoZW5hYmxlTG9nZ2luZyAmJiB0aGlzLmFjY2Vzc0xvZ3NCdWNrZXQpIHtcbiAgICAgIG5ldyBhd3MuczMuQnVja2V0TG9nZ2luZyhcbiAgICAgICAgYCR7bmFtZX0tbG9nZ2luZ2AsXG4gICAgICAgIHtcbiAgICAgICAgICBidWNrZXQ6IHRoaXMuYnVja2V0LmlkLFxuICAgICAgICAgIHRhcmdldEJ1Y2tldDogdGhpcy5hY2Nlc3NMb2dzQnVja2V0LmlkLFxuICAgICAgICAgIHRhcmdldFByZWZpeDogJ2FjY2Vzcy1sb2dzLycsXG4gICAgICAgIH0sXG4gICAgICAgIHtcbiAgICAgICAgICBwYXJlbnQ6IHRoaXMsXG4gICAgICAgICAgZGVwZW5kc09uOiBbdGhpcy5hY2Nlc3NMb2dzQnVja2V0LCB0aGlzLnB1YmxpY0FjY2Vzc0Jsb2NrXSxcbiAgICAgICAgICAvLyBBZGQgZXJyb3IgaGFuZGxpbmcgdGhyb3VnaCByZXNvdXJjZSBvcHRpb25zXG4gICAgICAgICAgaWdub3JlQ2hhbmdlczogW10sIC8vIEFsbG93IHVwZGF0ZXMgaWYgbmVlZGVkXG4gICAgICAgICAgcmV0YWluT25EZWxldGU6IGZhbHNlLCAvLyBDbGVhbiB1cCBvbiBkZWxldGlvblxuICAgICAgICB9XG4gICAgICApO1xuICAgIH1cblxuICAgIHRoaXMucmVnaXN0ZXJPdXRwdXRzKHtcbiAgICAgIGJ1Y2tldE5hbWU6IHRoaXMuYnVja2V0LmlkLFxuICAgICAgYnVja2V0QXJuOiB0aGlzLmJ1Y2tldC5hcm4sXG4gICAgICBidWNrZXREb21haW5OYW1lOiB0aGlzLmJ1Y2tldC5idWNrZXREb21haW5OYW1lLFxuICAgICAgYWNjZXNzTG9nc0J1Y2tldE5hbWU6IHRoaXMuYWNjZXNzTG9nc0J1Y2tldD8uaWQsXG4gICAgICBhY2Nlc3NMb2dzQnVja2V0QXJuOiB0aGlzLmFjY2Vzc0xvZ3NCdWNrZXQ/LmFybixcbiAgICB9KTtcbiAgfVxufVxuIl19