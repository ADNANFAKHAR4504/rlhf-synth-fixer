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
exports.SecureS3BucketComponent = exports.S3BucketPolicyComponent = exports.S3BucketComponent = void 0;
exports.createS3Bucket = createS3Bucket;
exports.createS3BucketPolicy = createS3BucketPolicy;
exports.createSecureS3Bucket = createSecureS3Bucket;
const pulumi = __importStar(require("@pulumi/pulumi"));
const aws = __importStar(require("@pulumi/aws"));
class S3BucketComponent extends pulumi.ComponentResource {
    bucket;
    bucketId;
    bucketArn;
    bucketDomainName;
    versioning;
    serverSideEncryption;
    publicAccessBlock;
    lifecycleConfiguration;
    corsConfiguration;
    bucketPolicy;
    constructor(name, args, opts) {
        super("aws:s3:S3BucketComponent", name, {}, opts);
        const defaultTags = {
            Name: args.bucketName || name,
            Environment: pulumi.getStack(),
            ManagedBy: "Pulumi",
            Project: "AWS-Nova-Model-Breaking",
            ...args.tags,
        };
        // Create S3 bucket
        this.bucket = new aws.s3.Bucket(`${name}-bucket`, {
            bucket: args.bucketName,
            acl: args.acl || "private",
            forceDestroy: args.forceDestroy ?? false,
            tags: defaultTags,
        }, { parent: this });
        this.bucketId = this.bucket.id;
        this.bucketArn = this.bucket.arn;
        this.bucketDomainName = this.bucket.bucketDomainName;
        // Configure versioning if specified
        if (args.versioning) {
            this.versioning = new aws.s3.BucketVersioningV2(`${name}-versioning`, {
                bucket: this.bucket.id,
                versioningConfiguration: {
                    status: args.versioning.enabled ? "Enabled" : "Suspended",
                    mfaDelete: args.versioning.mfaDelete ? "Enabled" : "Disabled",
                },
            }, { parent: this });
        }
        // Configure server-side encryption if specified
        if (args.serverSideEncryption) {
            this.serverSideEncryption = new aws.s3.BucketServerSideEncryptionConfigurationV2(`${name}-encryption`, {
                bucket: this.bucket.id,
                // Fixed: Use correct property structure for server-side encryption
                rules: [{
                        applyServerSideEncryptionByDefault: {
                            sseAlgorithm: args.serverSideEncryption.algorithm,
                            kmsMasterKeyId: args.serverSideEncryption.kmsKeyId,
                        },
                        bucketKeyEnabled: args.serverSideEncryption.bucketKeyEnabled ?? true,
                    }],
            }, { parent: this });
        }
        // Configure public access block (defaults to blocking all public access)
        const publicAccessBlockConfig = args.publicAccessBlock || {
            blockPublicAcls: true,
            blockPublicPolicy: true,
            ignorePublicAcls: true,
            restrictPublicBuckets: true,
        };
        this.publicAccessBlock = new aws.s3.BucketPublicAccessBlock(`${name}-public-access-block`, {
            bucket: this.bucket.id,
            blockPublicAcls: publicAccessBlockConfig.blockPublicAcls ?? true,
            blockPublicPolicy: publicAccessBlockConfig.blockPublicPolicy ?? true,
            ignorePublicAcls: publicAccessBlockConfig.ignorePublicAcls ?? true,
            restrictPublicBuckets: publicAccessBlockConfig.restrictPublicBuckets ?? true,
        }, { parent: this });
        // Configure lifecycle rules if specified
        if (args.lifecycleRules && args.lifecycleRules.length > 0) {
            this.lifecycleConfiguration = new aws.s3.BucketLifecycleConfigurationV2(`${name}-lifecycle`, {
                bucket: this.bucket.id,
                // Fixed: Filter out undefined values and ensure proper typing
                rules: args.lifecycleRules.map(rule => {
                    const lifecycleRule = {
                        id: rule.id,
                        status: rule.status,
                    };
                    if (rule.filter) {
                        lifecycleRule.filter = {
                            prefix: rule.filter.prefix,
                            tags: rule.filter.tags,
                        };
                    }
                    if (rule.expiration) {
                        lifecycleRule.expiration = {
                            days: rule.expiration.days,
                            expiredObjectDeleteMarker: rule.expiration.expiredObjectDeleteMarker,
                        };
                    }
                    if (rule.noncurrentVersionExpiration && rule.noncurrentVersionExpiration.noncurrentDays !== undefined) {
                        lifecycleRule.noncurrentVersionExpiration = {
                            noncurrentDays: rule.noncurrentVersionExpiration.noncurrentDays,
                        };
                    }
                    if (rule.transitions) {
                        lifecycleRule.transitions = rule.transitions.map(transition => ({
                            days: transition.days,
                            storageClass: transition.storageClass,
                        }));
                    }
                    return lifecycleRule;
                }),
            }, { parent: this });
        }
        // Configure CORS if specified
        if (args.corsRules && args.corsRules.length > 0) {
            this.corsConfiguration = new aws.s3.BucketCorsConfigurationV2(`${name}-cors`, {
                bucket: this.bucket.id,
                corsRules: args.corsRules,
            }, { parent: this });
        }
        this.registerOutputs({
            bucket: this.bucket,
            bucketId: this.bucketId,
            bucketArn: this.bucketArn,
            bucketDomainName: this.bucketDomainName,
            versioning: this.versioning,
            serverSideEncryption: this.serverSideEncryption,
            publicAccessBlock: this.publicAccessBlock,
            lifecycleConfiguration: this.lifecycleConfiguration,
            corsConfiguration: this.corsConfiguration,
        });
    }
}
exports.S3BucketComponent = S3BucketComponent;
class S3BucketPolicyComponent extends pulumi.ComponentResource {
    bucketPolicy;
    constructor(name, args, opts) {
        super("aws:s3:S3BucketPolicyComponent", name, {}, opts);
        this.bucketPolicy = new aws.s3.BucketPolicy(`${name}-policy`, {
            bucket: args.bucket,
            policy: args.policy,
        }, { parent: this });
        this.registerOutputs({
            bucketPolicy: this.bucketPolicy,
        });
    }
}
exports.S3BucketPolicyComponent = S3BucketPolicyComponent;
class SecureS3BucketComponent extends pulumi.ComponentResource {
    bucket;
    bucketId;
    bucketArn;
    bucketDomainName;
    versioning;
    serverSideEncryption;
    publicAccessBlock;
    lifecycleConfiguration;
    bucketPolicy;
    constructor(name, args, opts) {
        super("aws:s3:SecureS3BucketComponent", name, {}, opts);
        // Default secure lifecycle rules - ensure all values are defined
        const defaultLifecycleRules = args.enableLifecycle ? [
            {
                id: "transition-to-ia",
                status: "Enabled",
                transitions: [
                    {
                        days: 30,
                        storageClass: "STANDARD_IA",
                    },
                    {
                        days: 90,
                        storageClass: "GLACIER",
                    },
                ],
            },
            {
                id: "delete-old-versions",
                status: "Enabled",
                noncurrentVersionExpiration: {
                    noncurrentDays: 90, // Always defined, no undefined values
                },
            },
            {
                id: "cleanup-incomplete-uploads",
                status: "Enabled",
                expiration: {
                    expiredObjectDeleteMarker: true,
                },
            },
        ] : undefined;
        // Create secure S3 bucket
        const s3BucketComponent = new S3BucketComponent(name, {
            bucketName: args.bucketName,
            acl: "private",
            forceDestroy: false,
            tags: args.tags,
            versioning: {
                enabled: args.enableVersioning ?? true,
                mfaDelete: false,
            },
            serverSideEncryption: {
                algorithm: "aws:kms",
                kmsKeyId: args.kmsKeyId,
                bucketKeyEnabled: true,
            },
            publicAccessBlock: {
                blockPublicAcls: true,
                blockPublicPolicy: true,
                ignorePublicAcls: true,
                restrictPublicBuckets: true,
            },
            lifecycleRules: defaultLifecycleRules,
        }, { parent: this });
        this.bucket = s3BucketComponent.bucket;
        this.bucketId = s3BucketComponent.bucketId;
        this.bucketArn = s3BucketComponent.bucketArn;
        this.bucketDomainName = s3BucketComponent.bucketDomainName;
        this.versioning = s3BucketComponent.versioning;
        this.serverSideEncryption = s3BucketComponent.serverSideEncryption;
        this.publicAccessBlock = s3BucketComponent.publicAccessBlock;
        this.lifecycleConfiguration = s3BucketComponent.lifecycleConfiguration;
        // Create secure bucket policy
        if (args.allowedPrincipals && args.allowedActions) {
            const bucketPolicy = pulumi.all([this.bucketArn, pulumi.output(aws.getCallerIdentity())]).apply(([bucketArn, identity]) => JSON.stringify({
                Version: "2012-10-17",
                Statement: [
                    {
                        Sid: "DenyInsecureConnections",
                        Effect: "Deny",
                        Principal: "*",
                        Action: "s3:*",
                        Resource: [
                            bucketArn,
                            `${bucketArn}/*`,
                        ],
                        Condition: {
                            Bool: {
                                "aws:SecureTransport": "false",
                            },
                        },
                    },
                    {
                        Sid: "AllowSpecificPrincipals",
                        Effect: "Allow",
                        Principal: {
                            AWS: args.allowedPrincipals,
                        },
                        Action: args.allowedActions,
                        Resource: [
                            bucketArn,
                            `${bucketArn}/*`,
                        ],
                    },
                    {
                        Sid: "DenyUnencryptedUploads",
                        Effect: "Deny",
                        Principal: "*",
                        Action: "s3:PutObject",
                        Resource: `${bucketArn}/*`,
                        Condition: {
                            StringNotEquals: {
                                "s3:x-amz-server-side-encryption": "aws:kms",
                            },
                        },
                    },
                ],
            }));
            const bucketPolicyComponent = new S3BucketPolicyComponent(`${name}-policy`, {
                bucket: this.bucketId,
                policy: bucketPolicy,
            }, { parent: this });
            this.bucketPolicy = bucketPolicyComponent.bucketPolicy;
        }
        this.registerOutputs({
            bucket: this.bucket,
            bucketId: this.bucketId,
            bucketArn: this.bucketArn,
            bucketDomainName: this.bucketDomainName,
            versioning: this.versioning,
            serverSideEncryption: this.serverSideEncryption,
            publicAccessBlock: this.publicAccessBlock,
            lifecycleConfiguration: this.lifecycleConfiguration,
            bucketPolicy: this.bucketPolicy,
        });
    }
}
exports.SecureS3BucketComponent = SecureS3BucketComponent;
function createS3Bucket(name, args) {
    const s3BucketComponent = new S3BucketComponent(name, args);
    return {
        bucket: s3BucketComponent.bucket,
        bucketId: s3BucketComponent.bucketId,
        bucketArn: s3BucketComponent.bucketArn,
        bucketDomainName: s3BucketComponent.bucketDomainName,
        versioning: s3BucketComponent.versioning,
        serverSideEncryption: s3BucketComponent.serverSideEncryption,
        publicAccessBlock: s3BucketComponent.publicAccessBlock,
        lifecycleConfiguration: s3BucketComponent.lifecycleConfiguration,
        corsConfiguration: s3BucketComponent.corsConfiguration,
        bucketPolicy: s3BucketComponent.bucketPolicy,
    };
}
function createS3BucketPolicy(name, args) {
    const bucketPolicyComponent = new S3BucketPolicyComponent(name, args);
    return bucketPolicyComponent.bucketPolicy;
}
function createSecureS3Bucket(name, args) {
    const secureS3BucketComponent = new SecureS3BucketComponent(name, args);
    return {
        bucket: secureS3BucketComponent.bucket,
        bucketId: secureS3BucketComponent.bucketId,
        bucketArn: secureS3BucketComponent.bucketArn,
        bucketDomainName: secureS3BucketComponent.bucketDomainName,
        versioning: secureS3BucketComponent.versioning,
        serverSideEncryption: secureS3BucketComponent.serverSideEncryption,
        publicAccessBlock: secureS3BucketComponent.publicAccessBlock,
        lifecycleConfiguration: secureS3BucketComponent.lifecycleConfiguration,
        corsConfiguration: undefined,
        bucketPolicy: secureS3BucketComponent.bucketPolicy,
    };
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiczMuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJzMy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFtWUEsd0NBY0M7QUFFRCxvREFHQztBQUVELG9EQWNDO0FBdGFELHVEQUF5QztBQUN6QyxpREFBbUM7QUErRW5DLE1BQWEsaUJBQWtCLFNBQVEsTUFBTSxDQUFDLGlCQUFpQjtJQUMzQyxNQUFNLENBQWdCO0lBQ3RCLFFBQVEsQ0FBd0I7SUFDaEMsU0FBUyxDQUF3QjtJQUNqQyxnQkFBZ0IsQ0FBd0I7SUFDeEMsVUFBVSxDQUE2QjtJQUN2QyxvQkFBb0IsQ0FBb0Q7SUFDeEUsaUJBQWlCLENBQWtDO0lBQ25ELHNCQUFzQixDQUF5QztJQUMvRCxpQkFBaUIsQ0FBb0M7SUFDckQsWUFBWSxDQUF1QjtJQUVuRCxZQUFZLElBQVksRUFBRSxJQUFrQixFQUFFLElBQXNDO1FBQ2hGLEtBQUssQ0FBQywwQkFBMEIsRUFBRSxJQUFJLEVBQUUsRUFBRSxFQUFFLElBQUksQ0FBQyxDQUFDO1FBRWxELE1BQU0sV0FBVyxHQUFHO1lBQ2hCLElBQUksRUFBRSxJQUFJLENBQUMsVUFBVSxJQUFJLElBQUk7WUFDN0IsV0FBVyxFQUFFLE1BQU0sQ0FBQyxRQUFRLEVBQUU7WUFDOUIsU0FBUyxFQUFFLFFBQVE7WUFDbkIsT0FBTyxFQUFFLHlCQUF5QjtZQUNsQyxHQUFHLElBQUksQ0FBQyxJQUFJO1NBQ2YsQ0FBQztRQUVGLG1CQUFtQjtRQUNuQixJQUFJLENBQUMsTUFBTSxHQUFHLElBQUksR0FBRyxDQUFDLEVBQUUsQ0FBQyxNQUFNLENBQUMsR0FBRyxJQUFJLFNBQVMsRUFBRTtZQUM5QyxNQUFNLEVBQUUsSUFBSSxDQUFDLFVBQVU7WUFDdkIsR0FBRyxFQUFFLElBQUksQ0FBQyxHQUFHLElBQUksU0FBUztZQUMxQixZQUFZLEVBQUUsSUFBSSxDQUFDLFlBQVksSUFBSSxLQUFLO1lBQ3hDLElBQUks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QixDQUFDLGdCQUFnQjtRQUMxRCxVQUFVLEVBQUUsdUJBQXVCLENBQUMsVUFBVTtRQUM5QyxvQkFBb0IsRUFBRSx1QkFBdUIsQ0FBQyxvQkFBb0I7UUFDbEUsaUJBQWlCLEVBQUUsdUJBQXVCLENBQUMsaUJBQWlCO1FBQzVELHNCQUFzQixFQUFFLHVCQUF1QixDQUFDLHNCQUFzQjtRQUN0RSxpQkFBaUIsRUFBRSxTQUFTO1FBQzVCLFlBQVksRUFBRSx1QkFBdUIsQ0FBQyxZQUFZO0tBQ3JELENBQUM7QUFDTixDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0ICogYXMgcHVsdW1pIGZyb20gXCJAcHVsdW1pL3B1bHVtaVwiO1xuaW1wb3J0ICogYXMgYXdzIGZyb20gXCJAcHVsdW1pL2F3c1wiO1xuXG5leHBvcnQgaW50ZXJmYWNlIFMzQnVja2V0QXJncyB7XG4gICAgYnVja2V0TmFtZT86IHN0cmluZztcbiAgICBhY2w/OiBzdHJpbmc7XG4gICAgZm9yY2VEZXN0cm95PzogYm9vbGVhbjtcbiAgICB0YWdzPzogUmVjb3JkPHN0cmluZywgc3RyaW5nPjtcbiAgICB2ZXJzaW9uaW5nPzoge1xuICAgICAgICBlbmFibGVkOiBib29sZWFuO1xuICAgICAgICBtZmFEZWxldGU/OiBib29sZWFuO1xuICAgIH07XG4gICAgc2VydmVyU2lkZUVuY3J5cHRpb24/OiB7XG4gICAgICAgIGFsZ29yaXRobTogc3RyaW5nO1xuICAgICAgICBrbXNLZXlJZD86IHB1bHVtaS5JbnB1dDxzdHJpbmc+O1xuICAgICAgICBidWNrZXRLZXlFbmFibGVkPzogYm9vbGVhbjtcbiAgICB9O1xuICAgIHB1YmxpY0FjY2Vzc0Jsb2NrPzoge1xuICAgICAgICBibG9ja1B1YmxpY0FjbHM/OiBib29sZWFuO1xuICAgICAgICBibG9ja1B1YmxpY1BvbGljeT86IGJvb2xlYW47XG4gICAgICAgIGlnbm9yZVB1YmxpY0FjbHM/OiBib29sZWFuO1xuICAgICAgICByZXN0cmljdFB1YmxpY0J1Y2tldHM/OiBib29sZWFuO1xuICAgIH07XG4gICAgbGlmZWN5Y2xlUnVsZXM/OiBBcnJheTx7XG4gICAgICAgIGlkOiBzdHJpbmc7XG4gICAgICAgIHN0YXR1czogXCJFbmFibGVkXCIgfCBcIkRpc2FibGVkXCI7XG4gICAgICAgIGZpbHRlcj86IHtcbiAgICAgICAgICAgIHByZWZpeD86IHN0cmluZztcbiAgICAgICAgICAgIHRhZ3M/OiBSZWNvcmQ8c3RyaW5nLCBzdHJpbmc+O1xuICAgICAgICB9O1xuICAgICAgICBleHBpcmF0aW9uPzoge1xuICAgICAgICAgICAgZGF5cz86IG51bWJlcjtcbiAgICAgICAgICAgIGV4cGlyZWRPYmplY3REZWxldGVNYXJrZXI/OiBib29sZWFuO1xuICAgICAgICB9O1xuICAgICAgICBub25jdXJyZW50VmVyc2lvbkV4cGlyYXRpb24/OiB7XG4gICAgICAgICAgICBub25jdXJyZW50RGF5cz86IG51bWJlcjtcbiAgICAgICAgfTtcbiAgICAgICAgdHJhbnNpdGlvbnM/OiBBcnJheTx7XG4gICAgICAgICAgICBkYXlzOiBudW1iZXI7XG4gICAgICAgICAgICBzdG9yYWdlQ2xhc3M6IHN0cmluZztcbiAgICAgICAgfT47XG4gICAgfT47XG4gICAgY29yc1J1bGVzPzogQXJyYXk8e1xuICAgICAgICBhbGxvd2VkSGVhZGVycz86IHN0cmluZ1tdO1xuICAgICAgICBhbGxvd2VkTWV0aG9kczogc3RyaW5nW107XG4gICAgICAgIGFsbG93ZWRPcmlnaW5zOiBzdHJpbmdbXTtcbiAgICAgICAgZXhwb3NlSGVhZGVycz86IHN0cmluZ1tdO1xuICAgICAgICBtYXhBZ2VTZWNvbmRzPzogbnVtYmVyO1xuICAgIH0+O1xufVxuXG5leHBvcnQgaW50ZXJmYWNlIFMzQnVja2V0UmVzdWx0IHtcbiAgICBidWNrZXQ6IGF3cy5zMy5CdWNrZXQ7XG4gICAgYnVja2V0SWQ6IHB1bHVtaS5PdXRwdXQ8c3RyaW5nPjtcbiAgICBidWNrZXRBcm46IHB1bHVtaS5PdXRwdXQ8c3RyaW5nPjtcbiAgICBidWNrZXREb21haW5OYW1lOiBwdWx1bWkuT3V0cHV0PHN0cmluZz47XG4gICAgdmVyc2lvbmluZz86IGF3cy5zMy5CdWNrZXRWZXJzaW9uaW5nVjI7XG4gICAgc2VydmVyU2lkZUVuY3J5cHRpb24/OiBhd3MuczMuQnVja2V0U2VydmVyU2lkZUVuY3J5cHRpb25Db25maWd1cmF0aW9uVjI7XG4gICAgcHVibGljQWNjZXNzQmxvY2s/OiBhd3MuczMuQnVja2V0UHVibGljQWNjZXNzQmxvY2s7XG4gICAgbGlmZWN5Y2xlQ29uZmlndXJhdGlvbj86IGF3cy5zMy5CdWNrZXRMaWZlY3ljbGVDb25maWd1cmF0aW9uVjI7XG4gICAgY29yc0NvbmZpZ3VyYXRpb24/OiBhd3MuczMuQnVja2V0Q29yc0NvbmZpZ3VyYXRpb25WMjtcbiAgICBidWNrZXRQb2xpY3k/OiBhd3MuczMuQnVja2V0UG9saWN5O1xufVxuXG5leHBvcnQgaW50ZXJmYWNlIFMzQnVja2V0UG9saWN5QXJncyB7XG4gICAgYnVja2V0OiBwdWx1bWkuSW5wdXQ8c3RyaW5nPjtcbiAgICBwb2xpY3k6IHB1bHVtaS5JbnB1dDxzdHJpbmc+O1xufVxuXG5leHBvcnQgaW50ZXJmYWNlIFNlY3VyZVMzQnVja2V0QXJncyB7XG4gICAgbmFtZTogc3RyaW5nO1xuICAgIGJ1Y2tldE5hbWU/OiBzdHJpbmc7XG4gICAga21zS2V5SWQ/OiBwdWx1bWkuSW5wdXQ8c3RyaW5nPjtcbiAgICBlbmFibGVWZXJzaW9uaW5nPzogYm9vbGVhbjtcbiAgICBlbmFibGVMaWZlY3ljbGU/OiBib29sZWFuO1xuICAgIHRhZ3M/OiBSZWNvcmQ8c3RyaW5nLCBzdHJpbmc+O1xuICAgIGFsbG93ZWRQcmluY2lwYWxzPzogc3RyaW5nW107XG4gICAgYWxsb3dlZEFjdGlvbnM/OiBzdHJpbmdbXTtcbn1cblxuZXhwb3J0IGNsYXNzIFMzQnVja2V0Q29tcG9uZW50IGV4dGVuZHMgcHVsdW1pLkNvbXBvbmVudFJlc291cmNlIHtcbiAgICBwdWJsaWMgcmVhZG9ubHkgYnVja2V0OiBhd3MuczMuQnVja2V0O1xuICAgIHB1YmxpYyByZWFkb25seSBidWNrZXRJZDogcHVsdW1pLk91dHB1dDxzdHJpbmc+O1xuICAgIHB1YmxpYyByZWFkb25seSBidWNrZXRBcm46IHB1bHVtaS5PdXRwdXQ8c3RyaW5nPjtcbiAgICBwdWJsaWMgcmVhZG9ubHkgYnVja2V0RG9tYWluTmFtZTogcHVsdW1pLk91dHB1dDxzdHJpbmc+O1xuICAgIHB1YmxpYyByZWFkb25seSB2ZXJzaW9uaW5nPzogYXdzLnMzLkJ1Y2tldFZlcnNpb25pbmdWMjtcbiAgICBwdWJsaWMgcmVhZG9ubHkgc2VydmVyU2lkZUVuY3J5cHRpb24/OiBhd3MuczMuQnVja2V0U2VydmVyU2lkZUVuY3J5cHRpb25Db25maWd1cmF0aW9uVjI7XG4gICAgcHVibGljIHJlYWRvbmx5IHB1YmxpY0FjY2Vzc0Jsb2NrPzogYXdzLnMzLkJ1Y2tldFB1YmxpY0FjY2Vzc0Jsb2NrO1xuICAgIHB1YmxpYyByZWFkb25seSBsaWZlY3ljbGVDb25maWd1cmF0aW9uPzogYXdzLnMzLkJ1Y2tldExpZmVjeWNsZUNvbmZpZ3VyYXRpb25WMjtcbiAgICBwdWJsaWMgcmVhZG9ubHkgY29yc0NvbmZpZ3VyYXRpb24/OiBhd3MuczMuQnVja2V0Q29yc0NvbmZpZ3VyYXRpb25WMjtcbiAgICBwdWJsaWMgcmVhZG9ubHkgYnVja2V0UG9saWN5PzogYXdzLnMzLkJ1Y2tldFBvbGljeTtcblxuICAgIGNvbnN0cnVjdG9yKG5hbWU6IHN0cmluZywgYXJnczogUzNCdWNrZXRBcmdzLCBvcHRzPzogcHVsdW1pLkNvbXBvbmVudFJlc291cmNlT3B0aW9ucykge1xuICAgICAgICBzdXBlcihcImF3czpzMzpTM0J1Y2tldENvbXBvbmVudFwiLCBuYW1lLCB7fSwgb3B0cyk7XG5cbiAgICAgICAgY29uc3QgZGVmYXVsdFRhZ3MgPSB7XG4gICAgICAgICAgICBOYW1lOiBhcmdzLmJ1Y2tldE5hbWUgfHwgbmFtZSxcbiAgICAgICAgICAgIEVudmlyb25tZW50OiBwdWx1bWkuZ2V0U3RhY2soKSxcbiAgICAgICAgICAgIE1hbmFnZWRCeTogXCJQdWx1bWlcIixcbiAgICAgICAgICAgIFByb2plY3Q6IFwiQVdTLU5vdmEtTW9kZWwtQnJlYWtpbmdcIixcbiAgICAgICAgICAgIC4uLmFyZ3MudGFncyxcbiAgICAgICAgfTtcblxuICAgICAgICAvLyBDcmVhdGUgUzMgYnVja2V0XG4gICAgICAgIHRoaXMuYnVja2V0ID0gbmV3IGF3cy5zMy5CdWNrZXQoYCR7bmFtZX0tYnVja2V0YCwge1xuICAgICAgICAgICAgYnVja2V0OiBhcmdzLmJ1Y2tldE5hbWUsXG4gICAgICAgICAgICBhY2w6IGFyZ3MuYWNsIHx8IFwicHJpdmF0ZVwiLFxuICAgICAgICAgICAgZm9yY2VEZXN0cm95OiBhcmdzLmZvcmNlRGVzdHJveSA/PyBmYWxzZSxcbiAgICAgICAgICAgIHRhZ3M6IGRlZmF1bHRUYWdzLFxuICAgICAgICB9LCB7IHBhcmVudDogdGhpcyB9KTtcblxuICAgICAgICB0aGlzLmJ1Y2tldElkID0gdGhpcy5idWNrZXQuaWQ7XG4gICAgICAgIHRoaXMuYnVja2V0QXJuID0gdGhpcy5idWNrZXQuYXJuO1xuICAgICAgICB0aGlzLmJ1Y2tldERvbWFpbk5hbWUgPSB0aGlzLmJ1Y2tldC5idWNrZXREb21haW5OYW1lO1xuXG4gICAgICAgIC8vIENvbmZpZ3VyZSB2ZXJzaW9uaW5nIGlmIHNwZWNpZmllZFxuICAgICAgICBpZiAoYXJncy52ZXJzaW9uaW5nKSB7XG4gICAgICAgICAgICB0aGlzLnZlcnNpb25pbmcgPSBuZXcgYXdzLnMzLkJ1Y2tldFZlcnNpb25pbmdWMihgJHtuYW1lfS12ZXJzaW9uaW5nYCwge1xuICAgICAgICAgICAgICAgIGJ1Y2tldDogdGhpcy5idWNrZXQuaWQsXG4gICAgICAgICAgICAgICAgdmVyc2lvbmluZ0NvbmZpZ3VyYXRpb246IHtcbiAgICAgICAgICAgICAgICAgICAgc3RhdHVzOiBhcmdzLnZlcnNpb25pbmcuZW5hYmxlZCA/IFwiRW5hYmxlZFwiIDogXCJTdXNwZW5kZWRcIixcbiAgICAgICAgICAgICAgICAgICAgbWZhRGVsZXRlOiBhcmdzLnZlcnNpb25pbmcubWZhRGVsZXRlID8gXCJFbmFibGVkXCIgOiBcIkRpc2FibGVkXCIsXG4gICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIH0sIHsgcGFyZW50OiB0aGlzIH0pO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gQ29uZmlndXJlIHNlcnZlci1zaWRlIGVuY3J5cHRpb24gaWYgc3BlY2lmaWVkXG4gICAgICAgIGlmIChhcmdzLnNlcnZlclNpZGVFbmNyeXB0aW9uKSB7XG4gICAgICAgICAgICB0aGlzLnNlcnZlclNpZGVFbmNyeXB0aW9uID0gbmV3IGF3cy5zMy5CdWNrZXRTZXJ2ZXJTaWRlRW5jcnlwdGlvbkNvbmZpZ3VyYXRpb25WMihgJHtuYW1lfS1lbmNyeXB0aW9uYCwge1xuICAgICAgICAgICAgICAgIGJ1Y2tldDogdGhpcy5idWNrZXQuaWQsXG4gICAgICAgICAgICAgICAgLy8gRml4ZWQ6IFVzZSBjb3JyZWN0IHByb3BlcnR5IHN0cnVjdHVyZSBmb3Igc2VydmVyLXNpZGUgZW5jcnlwdGlvblxuICAgICAgICAgICAgICAgIHJ1bGVzOiBbe1xuICAgICAgICAgICAgICAgICAgICBhcHBseVNlcnZlclNpZGVFbmNyeXB0aW9uQnlEZWZhdWx0OiB7XG4gICAgICAgICAgICAgICAgICAgICAgICBzc2VBbGdvcml0aG06IGFyZ3Muc2VydmVyU2lkZUVuY3J5cHRpb24uYWxnb3JpdGhtLFxuICAgICAgICAgICAgICAgICAgICAgICAga21zTWFzdGVyS2V5SWQ6IGFyZ3Muc2VydmVyU2lkZUVuY3J5cHRpb24ua21zS2V5SWQsXG4gICAgICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgICAgIGJ1Y2tldEtleUVuYWJsZWQ6IGFyZ3Muc2VydmVyU2lkZUVuY3J5cHRpb24uYnVja2V0S2V5RW5hYmxlZCA/PyB0cnVlLFxuICAgICAgICAgICAgICAgIH1dLFxuICAgICAgICAgICAgfSwgeyBwYXJlbnQ6IHRoaXMgfSk7XG4gICAgICAgIH1cblxuICAgICAgICAvLyBDb25maWd1cmUgcHVibGljIGFjY2VzcyBibG9jayAoZGVmYXVsdHMgdG8gYmxvY2tpbmcgYWxsIHB1YmxpYyBhY2Nlc3MpXG4gICAgICAgIGNvbnN0IHB1YmxpY0FjY2Vzc0Jsb2NrQ29uZmlnID0gYXJncy5wdWJsaWNBY2Nlc3NCbG9jayB8fCB7XG4gICAgICAgICAgICBibG9ja1B1YmxpY0FjbHM6IHRydWUsXG4gICAgICAgICAgICBibG9ja1B1YmxpY1BvbGljeTogdHJ1ZSxcbiAgICAgICAgICAgIGlnbm9yZVB1YmxpY0FjbHM6IHRydWUsXG4gICAgICAgICAgICByZXN0cmljdFB1YmxpY0J1Y2tldHM6IHRydWUsXG4gICAgICAgIH07XG5cbiAgICAgICAgdGhpcy5wdWJsaWNBY2Nlc3NCbG9jayA9IG5ldyBhd3MuczMuQnVja2V0UHVibGljQWNjZXNzQmxvY2soYCR7bmFtZX0tcHVibGljLWFjY2Vzcy1ibG9ja2AsIHtcbiAgICAgICAgICAgIGJ1Y2tldDogdGhpcy5idWNrZXQuaWQsXG4gICAgICAgICAgICBibG9ja1B1YmxpY0FjbHM6IHB1YmxpY0FjY2Vzc0Jsb2NrQ29uZmlnLmJsb2NrUHVibGljQWNscyA/PyB0cnVlLFxuICAgICAgICAgICAgYmxvY2tQdWJsaWNQb2xpY3k6IHB1YmxpY0FjY2Vzc0Jsb2NrQ29uZmlnLmJsb2NrUHVibGljUG9saWN5ID8/IHRydWUsXG4gICAgICAgICAgICBpZ25vcmVQdWJsaWNBY2xzOiBwdWJsaWNBY2Nlc3NCbG9ja0NvbmZpZy5pZ25vcmVQdWJsaWNBY2xzID8/IHRydWUsXG4gICAgICAgICAgICByZXN0cmljdFB1YmxpY0J1Y2tldHM6IHB1YmxpY0FjY2Vzc0Jsb2NrQ29uZmlnLnJlc3RyaWN0UHVibGljQnVja2V0cyA/PyB0cnVlLFxuICAgICAgICB9LCB7IHBhcmVudDogdGhpcyB9KTtcblxuICAgICAgICAvLyBDb25maWd1cmUgbGlmZWN5Y2xlIHJ1bGVzIGlmIHNwZWNpZmllZFxuICAgICAgICBpZiAoYXJncy5saWZlY3ljbGVSdWxlcyAmJiBhcmdzLmxpZmVjeWNsZVJ1bGVzLmxlbmd0aCA+IDApIHtcbiAgICAgICAgICAgIHRoaXMubGlmZWN5Y2xlQ29uZmlndXJhdGlvbiA9IG5ldyBhd3MuczMuQnVja2V0TGlmZWN5Y2xlQ29uZmlndXJhdGlvblYyKGAke25hbWV9LWxpZmVjeWNsZWAsIHtcbiAgICAgICAgICAgICAgICBidWNrZXQ6IHRoaXMuYnVja2V0LmlkLFxuICAgICAgICAgICAgICAgIC8vIEZpeGVkOiBGaWx0ZXIgb3V0IHVuZGVmaW5lZCB2YWx1ZXMgYW5kIGVuc3VyZSBwcm9wZXIgdHlwaW5nXG4gICAgICAgICAgICAgICAgcnVsZXM6IGFyZ3MubGlmZWN5Y2xlUnVsZXMubWFwKHJ1bGUgPT4ge1xuICAgICAgICAgICAgICAgICAgICBjb25zdCBsaWZlY3ljbGVSdWxlOiBhbnkgPSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZDogcnVsZS5pZCxcbiAgICAgICAgICAgICAgICAgICAgICAgIHN0YXR1czogcnVsZS5zdGF0dXMsXG4gICAgICAgICAgICAgICAgICAgIH07XG5cbiAgICAgICAgICAgICAgICAgICAgaWYgKHJ1bGUuZmlsdGVyKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBsaWZlY3ljbGVSdWxlLmZpbHRlciA9IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBwcmVmaXg6IHJ1bGUuZmlsdGVyLnByZWZpeCxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0YWdzOiBydWxlLmZpbHRlci50YWdzLFxuICAgICAgICAgICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgICAgIGlmIChydWxlLmV4cGlyYXRpb24pIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGxpZmVjeWNsZVJ1bGUuZXhwaXJhdGlvbiA9IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBkYXlzOiBydWxlLmV4cGlyYXRpb24uZGF5cyxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBleHBpcmVkT2JqZWN0RGVsZXRlTWFya2VyOiBydWxlLmV4cGlyYXRpb24uZXhwaXJlZE9iamVjdERlbGV0ZU1hcmtlcixcbiAgICAgICAgICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgICAgICBpZiAocnVsZS5ub25jdXJyZW50VmVyc2lvbkV4cGlyYXRpb24gJiYgcnVsZS5ub25jdXJyZW50VmVyc2lvbkV4cGlyYXRpb24ubm9uY3VycmVudERheXMgIT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgbGlmZWN5Y2xlUnVsZS5ub25jdXJyZW50VmVyc2lvbkV4cGlyYXRpb24gPSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgbm9uY3VycmVudERheXM6IHJ1bGUubm9uY3VycmVudFZlcnNpb25FeHBpcmF0aW9uLm5vbmN1cnJlbnREYXlzLFxuICAgICAgICAgICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgICAgIGlmIChydWxlLnRyYW5zaXRpb25zKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBsaWZlY3ljbGVSdWxlLnRyYW5zaXRpb25zID0gcnVsZS50cmFuc2l0aW9ucy5tYXAodHJhbnNpdGlvbiA9PiAoe1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGRheXM6IHRyYW5zaXRpb24uZGF5cyxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBzdG9yYWdlQ2xhc3M6IHRyYW5zaXRpb24uc3RvcmFnZUNsYXNzLFxuICAgICAgICAgICAgICAgICAgICAgICAgfSkpO1xuICAgICAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGxpZmVjeWNsZVJ1bGU7XG4gICAgICAgICAgICAgICAgfSksXG4gICAgICAgICAgICB9LCB7IHBhcmVudDogdGhpcyB9KTtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIENvbmZpZ3VyZSBDT1JTIGlmIHNwZWNpZmllZFxuICAgICAgICBpZiAoYXJncy5jb3JzUnVsZXMgJiYgYXJncy5jb3JzUnVsZXMubGVuZ3RoID4gMCkge1xuICAgICAgICAgICAgdGhpcy5jb3JzQ29uZmlndXJhdGlvbiA9IG5ldyBhd3MuczMuQnVja2V0Q29yc0NvbmZpZ3VyYXRpb25WMihgJHtuYW1lfS1jb3JzYCwge1xuICAgICAgICAgICAgICAgIGJ1Y2tldDogdGhpcy5idWNrZXQuaWQsXG4gICAgICAgICAgICAgICAgY29yc1J1bGVzOiBhcmdzLmNvcnNSdWxlcyxcbiAgICAgICAgICAgIH0sIHsgcGFyZW50OiB0aGlzIH0pO1xuICAgICAgICB9XG5cbiAgICAgICAgdGhpcy5yZWdpc3Rlck91dHB1dHMoe1xuICAgICAgICAgICAgYnVja2V0OiB0aGlzLmJ1Y2tldCxcbiAgICAgICAgICAgIGJ1Y2tldElkOiB0aGlzLmJ1Y2tldElkLFxuICAgICAgICAgICAgYnVja2V0QXJuOiB0aGlzLmJ1Y2tldEFybixcbiAgICAgICAgICAgIGJ1Y2tldERvbWFpbk5hbWU6IHRoaXMuYnVja2V0RG9tYWluTmFtZSxcbiAgICAgICAgICAgIHZlcnNpb25pbmc6IHRoaXMudmVyc2lvbmluZyxcbiAgICAgICAgICAgIHNlcnZlclNpZGVFbmNyeXB0aW9uOiB0aGlzLnNlcnZlclNpZGVFbmNyeXB0aW9uLFxuICAgICAgICAgICAgcHVibGljQWNjZXNzQmxvY2s6IHRoaXMucHVibGljQWNjZXNzQmxvY2ssXG4gICAgICAgICAgICBsaWZlY3ljbGVDb25maWd1cmF0aW9uOiB0aGlzLmxpZmVjeWNsZUNvbmZpZ3VyYXRpb24sXG4gICAgICAgICAgICBjb3JzQ29uZmlndXJhdGlvbjogdGhpcy5jb3JzQ29uZmlndXJhdGlvbixcbiAgICAgICAgfSk7XG4gICAgfVxufVxuXG5leHBvcnQgY2xhc3MgUzNCdWNrZXRQb2xpY3lDb21wb25lbnQgZXh0ZW5kcyBwdWx1bWkuQ29tcG9uZW50UmVzb3VyY2Uge1xuICAgIHB1YmxpYyByZWFkb25seSBidWNrZXRQb2xpY3k6IGF3cy5zMy5CdWNrZXRQb2xpY3k7XG5cbiAgICBjb25zdHJ1Y3RvcihuYW1lOiBzdHJpbmcsIGFyZ3M6IFMzQnVja2V0UG9saWN5QXJncywgb3B0cz86IHB1bHVtaS5Db21wb25lbnRSZXNvdXJjZU9wdGlvbnMpIHtcbiAgICAgICAgc3VwZXIoXCJhd3M6czM6UzNCdWNrZXRQb2xpY3lDb21wb25lbnRcIiwgbmFtZSwge30sIG9wdHMpO1xuXG4gICAgICAgIHRoaXMuYnVja2V0UG9saWN5ID0gbmV3IGF3cy5zMy5CdWNrZXRQb2xpY3koYCR7bmFtZX0tcG9saWN5YCwge1xuICAgICAgICAgICAgYnVja2V0OiBhcmdzLmJ1Y2tldCxcbiAgICAgICAgICAgIHBvbGljeTogYXJncy5wb2xpY3ksXG4gICAgICAgIH0sIHsgcGFyZW50OiB0aGlzIH0pO1xuXG4gICAgICAgIHRoaXMucmVnaXN0ZXJPdXRwdXRzKHtcbiAgICAgICAgICAgIGJ1Y2tldFBvbGljeTogdGhpcy5idWNrZXRQb2xpY3ksXG4gICAgICAgIH0pO1xuICAgIH1cbn1cblxuZXhwb3J0IGNsYXNzIFNlY3VyZVMzQnVja2V0Q29tcG9uZW50IGV4dGVuZHMgcHVsdW1pLkNvbXBvbmVudFJlc291cmNlIHtcbiAgICBwdWJsaWMgcmVhZG9ubHkgYnVja2V0OiBhd3MuczMuQnVja2V0O1xuICAgIHB1YmxpYyByZWFkb25seSBidWNrZXRJZDogcHVsdW1pLk91dHB1dDxzdHJpbmc+O1xuICAgIHB1YmxpYyByZWFkb25seSBidWNrZXRBcm46IHB1bHVtaS5PdXRwdXQ8c3RyaW5nPjtcbiAgICBwdWJsaWMgcmVhZG9ubHkgYnVja2V0RG9tYWluTmFtZTogcHVsdW1pLk91dHB1dDxzdHJpbmc+O1xuICAgIHB1YmxpYyByZWFkb25seSB2ZXJzaW9uaW5nPzogYXdzLnMzLkJ1Y2tldFZlcnNpb25pbmdWMjtcbiAgICBwdWJsaWMgcmVhZG9ubHkgc2VydmVyU2lkZUVuY3J5cHRpb24/OiBhd3MuczMuQnVja2V0U2VydmVyU2lkZUVuY3J5cHRpb25Db25maWd1cmF0aW9uVjI7XG4gICAgcHVibGljIHJlYWRvbmx5IHB1YmxpY0FjY2Vzc0Jsb2NrOiBhd3MuczMuQnVja2V0UHVibGljQWNjZXNzQmxvY2s7XG4gICAgcHVibGljIHJlYWRvbmx5IGxpZmVjeWNsZUNvbmZpZ3VyYXRpb24/OiBhd3MuczMuQnVja2V0TGlmZWN5Y2xlQ29uZmlndXJhdGlvblYyO1xuICAgIHB1YmxpYyByZWFkb25seSBidWNrZXRQb2xpY3k/OiBhd3MuczMuQnVja2V0UG9saWN5O1xuXG4gICAgY29uc3RydWN0b3IobmFtZTogc3RyaW5nLCBhcmdzOiBTZWN1cmVTM0J1Y2tldEFyZ3MsIG9wdHM/OiBwdWx1bWkuQ29tcG9uZW50UmVzb3VyY2VPcHRpb25zKSB7XG4gICAgICAgIHN1cGVyKFwiYXdzOnMzOlNlY3VyZVMzQnVja2V0Q29tcG9uZW50XCIsIG5hbWUsIHt9LCBvcHRzKTtcblxuICAgICAgICAvLyBEZWZhdWx0IHNlY3VyZSBsaWZlY3ljbGUgcnVsZXMgLSBlbnN1cmUgYWxsIHZhbHVlcyBhcmUgZGVmaW5lZFxuICAgICAgICBjb25zdCBkZWZhdWx0TGlmZWN5Y2xlUnVsZXMgPSBhcmdzLmVuYWJsZUxpZmVjeWNsZSA/IFtcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICBpZDogXCJ0cmFuc2l0aW9uLXRvLWlhXCIsXG4gICAgICAgICAgICAgICAgc3RhdHVzOiBcIkVuYWJsZWRcIiBhcyBjb25zdCxcbiAgICAgICAgICAgICAgICB0cmFuc2l0aW9uczogW1xuICAgICAgICAgICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgICAgICAgICBkYXlzOiAzMCxcbiAgICAgICAgICAgICAgICAgICAgICAgIHN0b3JhZ2VDbGFzczogXCJTVEFOREFSRF9JQVwiLFxuICAgICAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgICAgICAgICBkYXlzOiA5MCxcbiAgICAgICAgICAgICAgICAgICAgICAgIHN0b3JhZ2VDbGFzczogXCJHTEFDSUVSXCIsXG4gICAgICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgXSxcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgaWQ6IFwiZGVsZXRlLW9sZC12ZXJzaW9uc1wiLFxuICAgICAgICAgICAgICAgIHN0YXR1czogXCJFbmFibGVkXCIgYXMgY29uc3QsXG4gICAgICAgICAgICAgICAgbm9uY3VycmVudFZlcnNpb25FeHBpcmF0aW9uOiB7XG4gICAgICAgICAgICAgICAgICAgIG5vbmN1cnJlbnREYXlzOiA5MCwgLy8gQWx3YXlzIGRlZmluZWQsIG5vIHVuZGVmaW5lZCB2YWx1ZXNcbiAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICBpZDogXCJjbGVhbnVwLWluY29tcGxldGUtdXBsb2Fkc1wiLFxuICAgICAgICAgICAgICAgIHN0YXR1czogXCJFbmFibGVkXCIgYXMgY29uc3QsXG4gICAgICAgICAgICAgICAgZXhwaXJhdGlvbjoge1xuICAgICAgICAgICAgICAgICAgICBleHBpcmVkT2JqZWN0RGVsZXRlTWFya2VyOiB0cnVlLFxuICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICB9LFxuICAgICAgICBdIDogdW5kZWZpbmVkO1xuXG4gICAgICAgIC8vIENyZWF0ZSBzZWN1cmUgUzMgYnVja2V0XG4gICAgICAgIGNvbnN0IHMzQnVja2V0Q29tcG9uZW50ID0gbmV3IFMzQnVja2V0Q29tcG9uZW50KG5hbWUsIHtcbiAgICAgICAgICAgIGJ1Y2tldE5hbWU6IGFyZ3MuYnVja2V0TmFtZSxcbiAgICAgICAgICAgIGFjbDogXCJwcml2YXRlXCIsXG4gICAgICAgICAgICBmb3JjZURlc3Ryb3k6IGZhbHNlLFxuICAgICAgICAgICAgdGFnczogYXJncy50YWdzLFxuICAgICAgICAgICAgdmVyc2lvbmluZzoge1xuICAgICAgICAgICAgICAgIGVuYWJsZWQ6IGFyZ3MuZW5hYmxlVmVyc2lvbmluZyA/PyB0cnVlLFxuICAgICAgICAgICAgICAgIG1mYURlbGV0ZTogZmFsc2UsXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgc2VydmVyU2lkZUVuY3J5cHRpb246IHtcbiAgICAgICAgICAgICAgICBhbGdvcml0aG06IFwiYXdzOmttc1wiLFxuICAgICAgICAgICAgICAgIGttc0tleUlkOiBhcmdzLmttc0tleUlkLFxuICAgICAgICAgICAgICAgIGJ1Y2tldEtleUVuYWJsZWQ6IHRydWUsXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgcHVibGljQWNjZXNzQmxvY2s6IHtcbiAgICAgICAgICAgICAgICBibG9ja1B1YmxpY0FjbHM6IHRydWUsXG4gICAgICAgICAgICAgICAgYmxvY2tQdWJsaWNQb2xpY3k6IHRydWUsXG4gICAgICAgICAgICAgICAgaWdub3JlUHVibGljQWNsczogdHJ1ZSxcbiAgICAgICAgICAgICAgICByZXN0cmljdFB1YmxpY0J1Y2tldHM6IHRydWUsXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgbGlmZWN5Y2xlUnVsZXM6IGRlZmF1bHRMaWZlY3ljbGVSdWxlcyxcbiAgICAgICAgfSwgeyBwYXJlbnQ6IHRoaXMgfSk7XG5cbiAgICAgICAgdGhpcy5idWNrZXQgPSBzM0J1Y2tldENvbXBvbmVudC5idWNrZXQ7XG4gICAgICAgIHRoaXMuYnVja2V0SWQgPSBzM0J1Y2tldENvbXBvbmVudC5idWNrZXRJZDtcbiAgICAgICAgdGhpcy5idWNrZXRBcm4gPSBzM0J1Y2tldENvbXBvbmVudC5idWNrZXRBcm47XG4gICAgICAgIHRoaXMuYnVja2V0RG9tYWluTmFtZSA9IHMzQnVja2V0Q29tcG9uZW50LmJ1Y2tldERvbWFpbk5hbWU7XG4gICAgICAgIHRoaXMudmVyc2lvbmluZyA9IHMzQnVja2V0Q29tcG9uZW50LnZlcnNpb25pbmc7XG4gICAgICAgIHRoaXMuc2VydmVyU2lkZUVuY3J5cHRpb24gPSBzM0J1Y2tldENvbXBvbmVudC5zZXJ2ZXJTaWRlRW5jcnlwdGlvbjtcbiAgICAgICAgdGhpcy5wdWJsaWNBY2Nlc3NCbG9jayA9IHMzQnVja2V0Q29tcG9uZW50LnB1YmxpY0FjY2Vzc0Jsb2NrITtcbiAgICAgICAgdGhpcy5saWZlY3ljbGVDb25maWd1cmF0aW9uID0gczNCdWNrZXRDb21wb25lbnQubGlmZWN5Y2xlQ29uZmlndXJhdGlvbjtcblxuICAgICAgICAvLyBDcmVhdGUgc2VjdXJlIGJ1Y2tldCBwb2xpY3lcbiAgICAgICAgaWYgKGFyZ3MuYWxsb3dlZFByaW5jaXBhbHMgJiYgYXJncy5hbGxvd2VkQWN0aW9ucykge1xuICAgICAgICAgICAgY29uc3QgYnVja2V0UG9saWN5ID0gcHVsdW1pLmFsbChbdGhpcy5idWNrZXRBcm4sIHB1bHVtaS5vdXRwdXQoYXdzLmdldENhbGxlcklkZW50aXR5KCkpXSkuYXBwbHkoKFtidWNrZXRBcm4sIGlkZW50aXR5XSkgPT4gSlNPTi5zdHJpbmdpZnkoe1xuICAgICAgICAgICAgICAgIFZlcnNpb246IFwiMjAxMi0xMC0xN1wiLFxuICAgICAgICAgICAgICAgIFN0YXRlbWVudDogW1xuICAgICAgICAgICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgICAgICAgICBTaWQ6IFwiRGVueUluc2VjdXJlQ29ubmVjdGlvbnNcIixcbiAgICAgICAgICAgICAgICAgICAgICAgIEVmZmVjdDogXCJEZW55XCIsXG4gICAgICAgICAgICAgICAgICAgICAgICBQcmluY2lwYWw6IFwiKlwiLFxuICAgICAgICAgICAgICAgICAgICAgICAgQWN0aW9uOiBcInMzOipcIixcbiAgICAgICAgICAgICAgICAgICAgICAgIFJlc291cmNlOiBbXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgYnVja2V0QXJuLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGAke2J1Y2tldEFybn0vKmAsXG4gICAgICAgICAgICAgICAgICAgICAgICBdLFxuICAgICAgICAgICAgICAgICAgICAgICAgQ29uZGl0aW9uOiB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgQm9vbDoge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBcImF3czpTZWN1cmVUcmFuc3BvcnRcIjogXCJmYWxzZVwiLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgICAgICAgICBTaWQ6IFwiQWxsb3dTcGVjaWZpY1ByaW5jaXBhbHNcIixcbiAgICAgICAgICAgICAgICAgICAgICAgIEVmZmVjdDogXCJBbGxvd1wiLFxuICAgICAgICAgICAgICAgICAgICAgICAgUHJpbmNpcGFsOiB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgQVdTOiBhcmdzLmFsbG93ZWRQcmluY2lwYWxzLFxuICAgICAgICAgICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICAgICAgICAgIEFjdGlvbjogYXJncy5hbGxvd2VkQWN0aW9ucyxcbiAgICAgICAgICAgICAgICAgICAgICAgIFJlc291cmNlOiBbXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgYnVja2V0QXJuLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGAke2J1Y2tldEFybn0vKmAsXG4gICAgICAgICAgICAgICAgICAgICAgICBdLFxuICAgICAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgICAgICAgICBTaWQ6IFwiRGVueVVuZW5jcnlwdGVkVXBsb2Fkc1wiLFxuICAgICAgICAgICAgICAgICAgICAgICAgRWZmZWN0OiBcIkRlbnlcIixcbiAgICAgICAgICAgICAgICAgICAgICAgIFByaW5jaXBhbDogXCIqXCIsXG4gICAgICAgICAgICAgICAgICAgICAgICBBY3Rpb246IFwiczM6UHV0T2JqZWN0XCIsXG4gICAgICAgICAgICAgICAgICAgICAgICBSZXNvdXJjZTogYCR7YnVja2V0QXJufS8qYCxcbiAgICAgICAgICAgICAgICAgICAgICAgIENvbmRpdGlvbjoge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIFN0cmluZ05vdEVxdWFsczoge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBcInMzOngtYW16LXNlcnZlci1zaWRlLWVuY3J5cHRpb25cIjogXCJhd3M6a21zXCIsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgXSxcbiAgICAgICAgICAgIH0pKTtcblxuICAgICAgICAgICAgY29uc3QgYnVja2V0UG9saWN5Q29tcG9uZW50ID0gbmV3IFMzQnVja2V0UG9saWN5Q29tcG9uZW50KGAke25hbWV9LXBvbGljeWAsIHtcbiAgICAgICAgICAgICAgICBidWNrZXQ6IHRoaXMuYnVja2V0SWQsXG4gICAgICAgICAgICAgICAgcG9saWN5OiBidWNrZXRQb2xpY3ksXG4gICAgICAgICAgICB9LCB7IHBhcmVudDogdGhpcyB9KTtcblxuICAgICAgICAgICAgdGhpcy5idWNrZXRQb2xpY3kgPSBidWNrZXRQb2xpY3lDb21wb25lbnQuYnVja2V0UG9saWN5O1xuICAgICAgICB9XG5cbiAgICAgICAgdGhpcy5yZWdpc3Rlck91dHB1dHMoe1xuICAgICAgICAgICAgYnVja2V0OiB0aGlzLmJ1Y2tldCxcbiAgICAgICAgICAgIGJ1Y2tldElkOiB0aGlzLmJ1Y2tldElkLFxuICAgICAgICAgICAgYnVja2V0QXJuOiB0aGlzLmJ1Y2tldEFybixcbiAgICAgICAgICAgIGJ1Y2tldERvbWFpbk5hbWU6IHRoaXMuYnVja2V0RG9tYWluTmFtZSxcbiAgICAgICAgICAgIHZlcnNpb25pbmc6IHRoaXMudmVyc2lvbmluZyxcbiAgICAgICAgICAgIHNlcnZlclNpZGVFbmNyeXB0aW9uOiB0aGlzLnNlcnZlclNpZGVFbmNyeXB0aW9uLFxuICAgICAgICAgICAgcHVibGljQWNjZXNzQmxvY2s6IHRoaXMucHVibGljQWNjZXNzQmxvY2ssXG4gICAgICAgICAgICBsaWZlY3ljbGVDb25maWd1cmF0aW9uOiB0aGlzLmxpZmVjeWNsZUNvbmZpZ3VyYXRpb24sXG4gICAgICAgICAgICBidWNrZXRQb2xpY3k6IHRoaXMuYnVja2V0UG9saWN5LFxuICAgICAgICB9KTtcbiAgICB9XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBjcmVhdGVTM0J1Y2tldChuYW1lOiBzdHJpbmcsIGFyZ3M6IFMzQnVja2V0QXJncyk6IFMzQnVja2V0UmVzdWx0IHtcbiAgICBjb25zdCBzM0J1Y2tldENvbXBvbmVudCA9IG5ldyBTM0J1Y2tldENvbXBvbmVudChuYW1lLCBhcmdzKTtcbiAgICByZXR1cm4ge1xuICAgICAgICBidWNrZXQ6IHMzQnVja2V0Q29tcG9uZW50LmJ1Y2tldCxcbiAgICAgICAgYnVja2V0SWQ6IHMzQnVja2V0Q29tcG9uZW50LmJ1Y2tldElkLFxuICAgICAgICBidWNrZXRBcm46IHMzQnVja2V0Q29tcG9uZW50LmJ1Y2tldEFybixcbiAgICAgICAgYnVja2V0RG9tYWluTmFtZTogczNCdWNrZXRDb21wb25lbnQuYnVja2V0RG9tYWluTmFtZSxcbiAgICAgICAgdmVyc2lvbmluZzogczNCdWNrZXRDb21wb25lbnQudmVyc2lvbmluZyxcbiAgICAgICAgc2VydmVyU2lkZUVuY3J5cHRpb246IHMzQnVja2V0Q29tcG9uZW50LnNlcnZlclNpZGVFbmNyeXB0aW9uLFxuICAgICAgICBwdWJsaWNBY2Nlc3NCbG9jazogczNCdWNrZXRDb21wb25lbnQucHVibGljQWNjZXNzQmxvY2ssXG4gICAgICAgIGxpZmVjeWNsZUNvbmZpZ3VyYXRpb246IHMzQnVja2V0Q29tcG9uZW50LmxpZmVjeWNsZUNvbmZpZ3VyYXRpb24sXG4gICAgICAgIGNvcnNDb25maWd1cmF0aW9uOiBzM0J1Y2tldENvbXBvbmVudC5jb3JzQ29uZmlndXJhdGlvbixcbiAgICAgICAgYnVja2V0UG9saWN5OiBzM0J1Y2tldENvbXBvbmVudC5idWNrZXRQb2xpY3ksXG4gICAgfTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGNyZWF0ZVMzQnVja2V0UG9saWN5KG5hbWU6IHN0cmluZywgYXJnczogUzNCdWNrZXRQb2xpY3lBcmdzKTogYXdzLnMzLkJ1Y2tldFBvbGljeSB7XG4gICAgY29uc3QgYnVja2V0UG9saWN5Q29tcG9uZW50ID0gbmV3IFMzQnVja2V0UG9saWN5Q29tcG9uZW50KG5hbWUsIGFyZ3MpO1xuICAgIHJldHVybiBidWNrZXRQb2xpY3lDb21wb25lbnQuYnVja2V0UG9saWN5O1xufVxuXG5leHBvcnQgZnVuY3Rpb24gY3JlYXRlU2VjdXJlUzNCdWNrZXQobmFtZTogc3RyaW5nLCBhcmdzOiBTZWN1cmVTM0J1Y2tldEFyZ3MpOiBTM0J1Y2tldFJlc3VsdCB7XG4gICAgY29uc3Qgc2VjdXJlUzNCdWNrZXRDb21wb25lbnQgPSBuZXcgU2VjdXJlUzNCdWNrZXRDb21wb25lbnQobmFtZSwgYXJncyk7XG4gICAgcmV0dXJuIHtcbiAgICAgICAgYnVja2V0OiBzZWN1cmVTM0J1Y2tldENvbXBvbmVudC5idWNrZXQsXG4gICAgICAgIGJ1Y2tldElkOiBzZWN1cmVTM0J1Y2tldENvbXBvbmVudC5idWNrZXRJZCxcbiAgICAgICAgYnVja2V0QXJuOiBzZWN1cmVTM0J1Y2tldENvbXBvbmVudC5idWNrZXRBcm4sXG4gICAgICAgIGJ1Y2tldERvbWFpbk5hbWU6IHNlY3VyZVMzQnVja2V0Q29tcG9uZW50LmJ1Y2tldERvbWFpbk5hbWUsXG4gICAgICAgIHZlcnNpb25pbmc6IHNlY3VyZVMzQnVja2V0Q29tcG9uZW50LnZlcnNpb25pbmcsXG4gICAgICAgIHNlcnZlclNpZGVFbmNyeXB0aW9uOiBzZWN1cmVTM0J1Y2tldENvbXBvbmVudC5zZXJ2ZXJTaWRlRW5jcnlwdGlvbixcbiAgICAgICAgcHVibGljQWNjZXNzQmxvY2s6IHNlY3VyZVMzQnVja2V0Q29tcG9uZW50LnB1YmxpY0FjY2Vzc0Jsb2NrLFxuICAgICAgICBsaWZlY3ljbGVDb25maWd1cmF0aW9uOiBzZWN1cmVTM0J1Y2tldENvbXBvbmVudC5saWZlY3ljbGVDb25maWd1cmF0aW9uLFxuICAgICAgICBjb3JzQ29uZmlndXJhdGlvbjogdW5kZWZpbmVkLFxuICAgICAgICBidWNrZXRQb2xpY3k6IHNlY3VyZVMzQnVja2V0Q29tcG9uZW50LmJ1Y2tldFBvbGljeSxcbiAgICB9O1xufSJdfQ==