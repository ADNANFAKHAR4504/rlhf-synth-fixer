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
    corsConfiguration; // ← FIXED: Removed V2
    bucketPolicy;
    constructor(name, args, opts) {
        super('aws:s3:S3BucketComponent', name, {}, opts);
        const defaultTags = {
            Name: args.bucketName || name,
            Environment: pulumi.getStack(),
            ManagedBy: 'Pulumi',
            Project: 'AWS-Nova-Model-Breaking',
            ...args.tags,
        };
        //  Create S3 bucket without deprecated ACL
        this.bucket = new aws.s3.Bucket(`${name}-bucket`, {
            bucket: args.bucketName,
            // Removed ACL - will use aws.s3.BucketAcl resource instead
            forceDestroy: args.forceDestroy ?? false,
            tags: defaultTags,
        }, { parent: this, provider: opts?.provider });
        //  Create separate ACL
        if (args.acl && args.acl !== 'private') {
            new aws.s3.BucketAcl(`${name}-acl`, {
                bucket: this.bucket.id,
                acl: args.acl,
            }, { parent: this, provider: opts?.provider });
        }
        this.bucketId = this.bucket.id;
        this.bucketArn = this.bucket.arn;
        this.bucketDomainName = this.bucket.bucketDomainName;
        // Configure versioning
        if (args.versioning) {
            this.versioning = new aws.s3.BucketVersioning(`${name}-versioning`, {
                bucket: this.bucket.id,
                versioningConfiguration: {
                    status: args.versioning.enabled ? 'Enabled' : 'Suspended',
                    mfaDelete: args.versioning.mfaDelete ? 'Enabled' : 'Disabled',
                },
            }, { parent: this, provider: opts?.provider });
        }
        // Configure server-side encryption if specified
        if (args.serverSideEncryption) {
            this.serverSideEncryption =
                new aws.s3.BucketServerSideEncryptionConfiguration(`${name}-encryption`, {
                    bucket: this.bucket.id,
                    rules: [
                        {
                            applyServerSideEncryptionByDefault: {
                                sseAlgorithm: args.serverSideEncryption.algorithm,
                                kmsMasterKeyId: args.serverSideEncryption.kmsKeyId,
                            },
                            bucketKeyEnabled: args.serverSideEncryption.bucketKeyEnabled ?? true,
                        },
                    ],
                }, { parent: this, provider: opts?.provider });
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
        }, { parent: this, provider: opts?.provider });
        // Configure lifecycle rules if specified
        if (args.lifecycleRules && args.lifecycleRules.length > 0) {
            this.lifecycleConfiguration = new aws.s3.BucketLifecycleConfiguration(`${name}-lifecycle`, {
                bucket: this.bucket.id,
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
                    if (rule.noncurrentVersionExpiration &&
                        rule.noncurrentVersionExpiration.noncurrentDays !== undefined) {
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
            }, { parent: this, provider: opts?.provider });
        }
        //  Configure CORS with non-deprecated resource
        if (args.corsRules && args.corsRules.length > 0) {
            this.corsConfiguration = new aws.s3.BucketCorsConfiguration(// ← FIXED: Removed V2
            `${name}-cors`, {
                bucket: this.bucket.id,
                corsRules: args.corsRules,
            }, { parent: this, provider: opts?.provider });
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
        super('aws:s3:S3BucketPolicyComponent', name, {}, opts);
        this.bucketPolicy = new aws.s3.BucketPolicy(`${name}-policy`, {
            bucket: args.bucket,
            policy: args.policy,
        }, { parent: this, provider: opts?.provider });
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
        super('aws:s3:SecureS3BucketComponent', name, {}, opts);
        // Default secure lifecycle rules - ensure all values are defined
        const defaultLifecycleRules = args.enableLifecycle
            ? [
                {
                    id: 'transition-to-ia',
                    status: 'Enabled',
                    transitions: [
                        {
                            days: 30,
                            storageClass: 'STANDARD_IA',
                        },
                        {
                            days: 90,
                            storageClass: 'GLACIER',
                        },
                    ],
                },
                {
                    id: 'delete-old-versions',
                    status: 'Enabled',
                    noncurrentVersionExpiration: {
                        noncurrentDays: 90,
                    },
                },
                {
                    id: 'cleanup-incomplete-uploads',
                    status: 'Enabled',
                    expiration: {
                        expiredObjectDeleteMarker: true,
                    },
                },
            ]
            : undefined;
        // Create secure S3 bucket
        const s3BucketComponent = new S3BucketComponent(name, {
            bucketName: args.bucketName,
            // Removed ACL parameter - defaults to private
            forceDestroy: false,
            tags: args.tags,
            versioning: {
                enabled: args.enableVersioning ?? true,
                mfaDelete: false,
            },
            serverSideEncryption: {
                algorithm: 'aws:kms',
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
        }, { parent: this, provider: opts?.provider });
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
            const bucketPolicy = pulumi
                .all([this.bucketArn, pulumi.output(aws.getCallerIdentity())])
                .apply(([bucketArn, _identity]) => JSON.stringify({
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
                        Sid: 'AllowSpecificPrincipals',
                        Effect: 'Allow',
                        Principal: {
                            AWS: args.allowedPrincipals,
                        },
                        Action: args.allowedActions,
                        Resource: [bucketArn, `${bucketArn}/*`],
                    },
                    {
                        Sid: 'DenyUnencryptedUploads',
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
            }));
            const bucketPolicyComponent = new S3BucketPolicyComponent(`${name}-policy`, {
                bucket: this.bucketId,
                policy: bucketPolicy,
            }, { parent: this, provider: opts?.provider });
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
function createS3Bucket(name, args, opts) {
    const s3BucketComponent = new S3BucketComponent(name, args, opts);
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
function createS3BucketPolicy(name, args, opts) {
    const bucketPolicyComponent = new S3BucketPolicyComponent(name, args, opts);
    return bucketPolicyComponent.bucketPolicy;
}
function createSecureS3Bucket(name, args, opts) {
    const secureS3BucketComponent = new SecureS3BucketComponent(name, args, opts);
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiczMuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJzMy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUEyZEEsd0NBa0JDO0FBRUQsb0RBT0M7QUFFRCxvREFrQkM7QUExZ0JELHVEQUF5QztBQUN6QyxpREFBbUM7QUFvR25DLE1BQWEsaUJBQWtCLFNBQVEsTUFBTSxDQUFDLGlCQUFpQjtJQUM3QyxNQUFNLENBQWdCO0lBQ3RCLFFBQVEsQ0FBd0I7SUFDaEMsU0FBUyxDQUF3QjtJQUNqQyxnQkFBZ0IsQ0FBd0I7SUFDeEMsVUFBVSxDQUEyQjtJQUNyQyxvQkFBb0IsQ0FBa0Q7SUFDdEUsaUJBQWlCLENBQWtDO0lBQ25ELHNCQUFzQixDQUF1QztJQUM3RCxpQkFBaUIsQ0FBa0MsQ0FBQyxzQkFBc0I7SUFDMUUsWUFBWSxDQUF1QjtJQUVuRCxZQUNFLElBQVksRUFDWixJQUFrQixFQUNsQixJQUFzQztRQUV0QyxLQUFLLENBQUMsMEJBQTBCLEVBQUUsSUFBSSxFQUFFLEVBQUUsRUFBRSxJQUFJLENBQUMsQ0FBQztRQUVsRCxNQUFNLFdBQVcsR0FBRztZQUNsQixJQUFJLEVBQUUsSUFBSSxDQUFDLFVBQVUsSUFBSSxJQUFJO1lBQzdCLFdBQVcsRUFBRSxNQUFNLENBQUMsUUFBUSxFQUFFO1lBQzlCLFNBQVMsRUFBRSxRQUFRO1lBQ25CLE9BQU8sRUFBRSx5QkFBeUI7WUFDbEMsR0FBRyxJQUFJLENBQUMsSUFBSTtTQUNiLENBQUM7UUFFRiwyQ0FBMkM7UUFDM0MsSUFBSSxDQUFDLE1BQU0sR0FBRyxJQUFJLEdBQUcsQ0FBQyxFQUFFLENBQUMsTUFBTSxDQUM3QixHQUFHLElBQUksU0FBUyxFQUNoQjtZQUNFLE1BQU0sRUFBRSxJQUFJLENBQUMsVUFBVTtZQUN2QiwyREFBMkQ7WUFDM0QsWUFBWSxFQUFFLElBQUksQ0FBQyxZQUFZLElBQUksS0FBSztZQUN4QyxJQUFJLEVBQUUsV0FBVztT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dWx1bWkvcHVsdW1pJztcbmltcG9ydCAqIGFzIGF3cyBmcm9tICdAcHVsdW1pL2F3cyc7XG5cbmV4cG9ydCBpbnRlcmZhY2UgUzNCdWNrZXRBcmdzIHtcbiAgYnVja2V0TmFtZT86IHN0cmluZztcbiAgYWNsPzogc3RyaW5nO1xuICBmb3JjZURlc3Ryb3k/OiBib29sZWFuO1xuICB0YWdzPzogUmVjb3JkPHN0cmluZywgc3RyaW5nPjtcbiAgdmVyc2lvbmluZz86IHtcbiAgICBlbmFibGVkOiBib29sZWFuO1xuICAgIG1mYURlbGV0ZT86IGJvb2xlYW47XG4gIH07XG4gIHNlcnZlclNpZGVFbmNyeXB0aW9uPzoge1xuICAgIGFsZ29yaXRobTogc3RyaW5nO1xuICAgIGttc0tleUlkPzogcHVsdW1pLklucHV0PHN0cmluZz47XG4gICAgYnVja2V0S2V5RW5hYmxlZD86IGJvb2xlYW47XG4gIH07XG4gIHB1YmxpY0FjY2Vzc0Jsb2NrPzoge1xuICAgIGJsb2NrUHVibGljQWNscz86IGJvb2xlYW47XG4gICAgYmxvY2tQdWJsaWNQb2xpY3k/OiBib29sZWFuO1xuICAgIGlnbm9yZVB1YmxpY0FjbHM/OiBib29sZWFuO1xuICAgIHJlc3RyaWN0UHVibGljQnVja2V0cz86IGJvb2xlYW47XG4gIH07XG4gIGxpZmVjeWNsZVJ1bGVzPzogQXJyYXk8e1xuICAgIGlkOiBzdHJpbmc7XG4gICAgc3RhdHVzOiAnRW5hYmxlZCcgfCAnRGlzYWJsZWQnO1xuICAgIGZpbHRlcj86IHtcbiAgICAgIHByZWZpeD86IHN0cmluZztcbiAgICAgIHRhZ3M/OiBSZWNvcmQ8c3RyaW5nLCBzdHJpbmc+O1xuICAgIH07XG4gICAgZXhwaXJhdGlvbj86IHtcbiAgICAgIGRheXM/OiBudW1iZXI7XG4gICAgICBleHBpcmVkT2JqZWN0RGVsZXRlTWFya2VyPzogYm9vbGVhbjtcbiAgICB9O1xuICAgIG5vbmN1cnJlbnRWZXJzaW9uRXhwaXJhdGlvbj86IHtcbiAgICAgIG5vbmN1cnJlbnREYXlzPzogbnVtYmVyO1xuICAgIH07XG4gICAgdHJhbnNpdGlvbnM/OiBBcnJheTx7XG4gICAgICBkYXlzOiBudW1iZXI7XG4gICAgICBzdG9yYWdlQ2xhc3M6IHN0cmluZztcbiAgICB9PjtcbiAgfT47XG4gIGNvcnNSdWxlcz86IEFycmF5PHtcbiAgICBhbGxvd2VkSGVhZGVycz86IHN0cmluZ1tdO1xuICAgIGFsbG93ZWRNZXRob2RzOiBzdHJpbmdbXTtcbiAgICBhbGxvd2VkT3JpZ2luczogc3RyaW5nW107XG4gICAgZXhwb3NlSGVhZGVycz86IHN0cmluZ1tdO1xuICAgIG1heEFnZVNlY29uZHM/OiBudW1iZXI7XG4gIH0+O1xufVxuXG5leHBvcnQgaW50ZXJmYWNlIFMzQnVja2V0UmVzdWx0IHtcbiAgYnVja2V0OiBhd3MuczMuQnVja2V0O1xuICBidWNrZXRJZDogcHVsdW1pLk91dHB1dDxzdHJpbmc+O1xuICBidWNrZXRBcm46IHB1bHVtaS5PdXRwdXQ8c3RyaW5nPjtcbiAgYnVja2V0RG9tYWluTmFtZTogcHVsdW1pLk91dHB1dDxzdHJpbmc+O1xuICB2ZXJzaW9uaW5nPzogYXdzLnMzLkJ1Y2tldFZlcnNpb25pbmc7XG4gIHNlcnZlclNpZGVFbmNyeXB0aW9uPzogYXdzLnMzLkJ1Y2tldFNlcnZlclNpZGVFbmNyeXB0aW9uQ29uZmlndXJhdGlvbjtcbiAgcHVibGljQWNjZXNzQmxvY2s/OiBhd3MuczMuQnVja2V0UHVibGljQWNjZXNzQmxvY2s7XG4gIGxpZmVjeWNsZUNvbmZpZ3VyYXRpb24/OiBhd3MuczMuQnVja2V0TGlmZWN5Y2xlQ29uZmlndXJhdGlvbjtcbiAgY29yc0NvbmZpZ3VyYXRpb24/OiBhd3MuczMuQnVja2V0Q29yc0NvbmZpZ3VyYXRpb247IC8vIOKGkCBGSVhFRDogUmVtb3ZlZCBWMlxuICBidWNrZXRQb2xpY3k/OiBhd3MuczMuQnVja2V0UG9saWN5O1xufVxuXG5leHBvcnQgaW50ZXJmYWNlIFMzQnVja2V0UG9saWN5QXJncyB7XG4gIGJ1Y2tldDogcHVsdW1pLklucHV0PHN0cmluZz47XG4gIHBvbGljeTogcHVsdW1pLklucHV0PHN0cmluZz47XG59XG5cbmV4cG9ydCBpbnRlcmZhY2UgU2VjdXJlUzNCdWNrZXRBcmdzIHtcbiAgbmFtZTogc3RyaW5nO1xuICBidWNrZXROYW1lPzogc3RyaW5nO1xuICBrbXNLZXlJZD86IHB1bHVtaS5JbnB1dDxzdHJpbmc+O1xuICBlbmFibGVWZXJzaW9uaW5nPzogYm9vbGVhbjtcbiAgZW5hYmxlTGlmZWN5Y2xlPzogYm9vbGVhbjtcbiAgdGFncz86IFJlY29yZDxzdHJpbmcsIHN0cmluZz47XG4gIGFsbG93ZWRQcmluY2lwYWxzPzogc3RyaW5nW107XG4gIGFsbG93ZWRBY3Rpb25zPzogc3RyaW5nW107XG59XG5cbi8vIERlZmluZSBpbnRlcmZhY2UgZm9yIGxpZmVjeWNsZSBydWxlIGNvbmZpZ3VyYXRpb25cbmludGVyZmFjZSBMaWZlY3ljbGVSdWxlQ29uZmlnIHtcbiAgaWQ6IHN0cmluZztcbiAgc3RhdHVzOiBzdHJpbmc7XG4gIGZpbHRlcj86IHtcbiAgICBwcmVmaXg/OiBzdHJpbmc7XG4gICAgdGFncz86IFJlY29yZDxzdHJpbmcsIHN0cmluZz47XG4gIH07XG4gIGV4cGlyYXRpb24/OiB7XG4gICAgZGF5cz86IG51bWJlcjtcbiAgICBleHBpcmVkT2JqZWN0RGVsZXRlTWFya2VyPzogYm9vbGVhbjtcbiAgfTtcbiAgbm9uY3VycmVudFZlcnNpb25FeHBpcmF0aW9uPzoge1xuICAgIG5vbmN1cnJlbnREYXlzOiBudW1iZXI7XG4gIH07XG4gIHRyYW5zaXRpb25zPzogQXJyYXk8e1xuICAgIGRheXM6IG51bWJlcjtcbiAgICBzdG9yYWdlQ2xhc3M6IHN0cmluZztcbiAgfT47XG59XG5cbmV4cG9ydCBjbGFzcyBTM0J1Y2tldENvbXBvbmVudCBleHRlbmRzIHB1bHVtaS5Db21wb25lbnRSZXNvdXJjZSB7XG4gIHB1YmxpYyByZWFkb25seSBidWNrZXQ6IGF3cy5zMy5CdWNrZXQ7XG4gIHB1YmxpYyByZWFkb25seSBidWNrZXRJZDogcHVsdW1pLk91dHB1dDxzdHJpbmc+O1xuICBwdWJsaWMgcmVhZG9ubHkgYnVja2V0QXJuOiBwdWx1bWkuT3V0cHV0PHN0cmluZz47XG4gIHB1YmxpYyByZWFkb25seSBidWNrZXREb21haW5OYW1lOiBwdWx1bWkuT3V0cHV0PHN0cmluZz47XG4gIHB1YmxpYyByZWFkb25seSB2ZXJzaW9uaW5nPzogYXdzLnMzLkJ1Y2tldFZlcnNpb25pbmc7XG4gIHB1YmxpYyByZWFkb25seSBzZXJ2ZXJTaWRlRW5jcnlwdGlvbj86IGF3cy5zMy5CdWNrZXRTZXJ2ZXJTaWRlRW5jcnlwdGlvbkNvbmZpZ3VyYXRpb247XG4gIHB1YmxpYyByZWFkb25seSBwdWJsaWNBY2Nlc3NCbG9jaz86IGF3cy5zMy5CdWNrZXRQdWJsaWNBY2Nlc3NCbG9jaztcbiAgcHVibGljIHJlYWRvbmx5IGxpZmVjeWNsZUNvbmZpZ3VyYXRpb24/OiBhd3MuczMuQnVja2V0TGlmZWN5Y2xlQ29uZmlndXJhdGlvbjtcbiAgcHVibGljIHJlYWRvbmx5IGNvcnNDb25maWd1cmF0aW9uPzogYXdzLnMzLkJ1Y2tldENvcnNDb25maWd1cmF0aW9uOyAvLyDihpAgRklYRUQ6IFJlbW92ZWQgVjJcbiAgcHVibGljIHJlYWRvbmx5IGJ1Y2tldFBvbGljeT86IGF3cy5zMy5CdWNrZXRQb2xpY3k7XG5cbiAgY29uc3RydWN0b3IoXG4gICAgbmFtZTogc3RyaW5nLFxuICAgIGFyZ3M6IFMzQnVja2V0QXJncyxcbiAgICBvcHRzPzogcHVsdW1pLkNvbXBvbmVudFJlc291cmNlT3B0aW9uc1xuICApIHtcbiAgICBzdXBlcignYXdzOnMzOlMzQnVja2V0Q29tcG9uZW50JywgbmFtZSwge30sIG9wdHMpO1xuXG4gICAgY29uc3QgZGVmYXVsdFRhZ3MgPSB7XG4gICAgICBOYW1lOiBhcmdzLmJ1Y2tldE5hbWUgfHwgbmFtZSxcbiAgICAgIEVudmlyb25tZW50OiBwdWx1bWkuZ2V0U3RhY2soKSxcbiAgICAgIE1hbmFnZWRCeTogJ1B1bHVtaScsXG4gICAgICBQcm9qZWN0OiAnQVdTLU5vdmEtTW9kZWwtQnJlYWtpbmcnLFxuICAgICAgLi4uYXJncy50YWdzLFxuICAgIH07XG5cbiAgICAvLyAgQ3JlYXRlIFMzIGJ1Y2tldCB3aXRob3V0IGRlcHJlY2F0ZWQgQUNMXG4gICAgdGhpcy5idWNrZXQgPSBuZXcgYXdzLnMzLkJ1Y2tldChcbiAgICAgIGAke25hbWV9LWJ1Y2tldGAsXG4gICAgICB7XG4gICAgICAgIGJ1Y2tldDogYXJncy5idWNrZXROYW1lLFxuICAgICAgICAvLyBSZW1vdmVkIEFDTCAtIHdpbGwgdXNlIGF3cy5zMy5CdWNrZXRBY2wgcmVzb3VyY2UgaW5zdGVhZFxuICAgICAgICBmb3JjZURlc3Ryb3k6IGFyZ3MuZm9yY2VEZXN0cm95ID8/IGZhbHNlLFxuICAgICAgICB0YWdzOiBkZWZhdWx0VGFncyxcbiAgICAgIH0sXG4gICAgICB7IHBhcmVudDogdGhpcywgcHJvdmlkZXI6IG9wdHM/LnByb3ZpZGVyIH1cbiAgICApO1xuXG4gICAgLy8gIENyZWF0ZSBzZXBhcmF0ZSBBQ0xcbiAgICBpZiAoYXJncy5hY2wgJiYgYXJncy5hY2wgIT09ICdwcml2YXRlJykge1xuICAgICAgbmV3IGF3cy5zMy5CdWNrZXRBY2woXG4gICAgICAgIGAke25hbWV9LWFjbGAsXG4gICAgICAgIHtcbiAgICAgICAgICBidWNrZXQ6IHRoaXMuYnVja2V0LmlkLFxuICAgICAgICAgIGFjbDogYXJncy5hY2wsXG4gICAgICAgIH0sXG4gICAgICAgIHsgcGFyZW50OiB0aGlzLCBwcm92aWRlcjogb3B0cz8ucHJvdmlkZXIgfVxuICAgICAgKTtcbiAgICB9XG5cbiAgICB0aGlzLmJ1Y2tldElkID0gdGhpcy5idWNrZXQuaWQ7XG4gICAgdGhpcy5idWNrZXRBcm4gPSB0aGlzLmJ1Y2tldC5hcm47XG4gICAgdGhpcy5idWNrZXREb21haW5OYW1lID0gdGhpcy5idWNrZXQuYnVja2V0RG9tYWluTmFtZTtcblxuICAgIC8vIENvbmZpZ3VyZSB2ZXJzaW9uaW5nXG4gICAgaWYgKGFyZ3MudmVyc2lvbmluZykge1xuICAgICAgdGhpcy52ZXJzaW9uaW5nID0gbmV3IGF3cy5zMy5CdWNrZXRWZXJzaW9uaW5nKFxuICAgICAgICBgJHtuYW1lfS12ZXJzaW9uaW5nYCxcbiAgICAgICAge1xuICAgICAgICAgIGJ1Y2tldDogdGhpcy5idWNrZXQuaWQsXG4gICAgICAgICAgdmVyc2lvbmluZ0NvbmZpZ3VyYXRpb246IHtcbiAgICAgICAgICAgIHN0YXR1czogYXJncy52ZXJzaW9uaW5nLmVuYWJsZWQgPyAnRW5hYmxlZCcgOiAnU3VzcGVuZGVkJyxcbiAgICAgICAgICAgIG1mYURlbGV0ZTogYXJncy52ZXJzaW9uaW5nLm1mYURlbGV0ZSA/ICdFbmFibGVkJyA6ICdEaXNhYmxlZCcsXG4gICAgICAgICAgfSxcbiAgICAgICAgfSxcbiAgICAgICAgeyBwYXJlbnQ6IHRoaXMsIHByb3ZpZGVyOiBvcHRzPy5wcm92aWRlciB9XG4gICAgICApO1xuICAgIH1cblxuICAgIC8vIENvbmZpZ3VyZSBzZXJ2ZXItc2lkZSBlbmNyeXB0aW9uIGlmIHNwZWNpZmllZFxuICAgIGlmIChhcmdzLnNlcnZlclNpZGVFbmNyeXB0aW9uKSB7XG4gICAgICB0aGlzLnNlcnZlclNpZGVFbmNyeXB0aW9uID1cbiAgICAgICAgbmV3IGF3cy5zMy5CdWNrZXRTZXJ2ZXJTaWRlRW5jcnlwdGlvbkNvbmZpZ3VyYXRpb24oXG4gICAgICAgICAgYCR7bmFtZX0tZW5jcnlwdGlvbmAsXG4gICAgICAgICAge1xuICAgICAgICAgICAgYnVja2V0OiB0aGlzLmJ1Y2tldC5pZCxcbiAgICAgICAgICAgIHJ1bGVzOiBbXG4gICAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICBhcHBseVNlcnZlclNpZGVFbmNyeXB0aW9uQnlEZWZhdWx0OiB7XG4gICAgICAgICAgICAgICAgICBzc2VBbGdvcml0aG06IGFyZ3Muc2VydmVyU2lkZUVuY3J5cHRpb24uYWxnb3JpdGhtLFxuICAgICAgICAgICAgICAgICAga21zTWFzdGVyS2V5SWQ6IGFyZ3Muc2VydmVyU2lkZUVuY3J5cHRpb24ua21zS2V5SWQsXG4gICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICBidWNrZXRLZXlFbmFibGVkOlxuICAgICAgICAgICAgICAgICAgYXJncy5zZXJ2ZXJTaWRlRW5jcnlwdGlvbi5idWNrZXRLZXlFbmFibGVkID8/IHRydWUsXG4gICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBdLFxuICAgICAgICAgIH0sXG4gICAgICAgICAgeyBwYXJlbnQ6IHRoaXMsIHByb3ZpZGVyOiBvcHRzPy5wcm92aWRlciB9XG4gICAgICAgICk7XG4gICAgfVxuXG4gICAgLy8gQ29uZmlndXJlIHB1YmxpYyBhY2Nlc3MgYmxvY2sgKGRlZmF1bHRzIHRvIGJsb2NraW5nIGFsbCBwdWJsaWMgYWNjZXNzKVxuICAgIGNvbnN0IHB1YmxpY0FjY2Vzc0Jsb2NrQ29uZmlnID0gYXJncy5wdWJsaWNBY2Nlc3NCbG9jayB8fCB7XG4gICAgICBibG9ja1B1YmxpY0FjbHM6IHRydWUsXG4gICAgICBibG9ja1B1YmxpY1BvbGljeTogdHJ1ZSxcbiAgICAgIGlnbm9yZVB1YmxpY0FjbHM6IHRydWUsXG4gICAgICByZXN0cmljdFB1YmxpY0J1Y2tldHM6IHRydWUsXG4gICAgfTtcblxuICAgIHRoaXMucHVibGljQWNjZXNzQmxvY2sgPSBuZXcgYXdzLnMzLkJ1Y2tldFB1YmxpY0FjY2Vzc0Jsb2NrKFxuICAgICAgYCR7bmFtZX0tcHVibGljLWFjY2Vzcy1ibG9ja2AsXG4gICAgICB7XG4gICAgICAgIGJ1Y2tldDogdGhpcy5idWNrZXQuaWQsXG4gICAgICAgIGJsb2NrUHVibGljQWNsczogcHVibGljQWNjZXNzQmxvY2tDb25maWcuYmxvY2tQdWJsaWNBY2xzID8/IHRydWUsXG4gICAgICAgIGJsb2NrUHVibGljUG9saWN5OiBwdWJsaWNBY2Nlc3NCbG9ja0NvbmZpZy5ibG9ja1B1YmxpY1BvbGljeSA/PyB0cnVlLFxuICAgICAgICBpZ25vcmVQdWJsaWNBY2xzOiBwdWJsaWNBY2Nlc3NCbG9ja0NvbmZpZy5pZ25vcmVQdWJsaWNBY2xzID8/IHRydWUsXG4gICAgICAgIHJlc3RyaWN0UHVibGljQnVja2V0czpcbiAgICAgICAgICBwdWJsaWNBY2Nlc3NCbG9ja0NvbmZpZy5yZXN0cmljdFB1YmxpY0J1Y2tldHMgPz8gdHJ1ZSxcbiAgICAgIH0sXG4gICAgICB7IHBhcmVudDogdGhpcywgcHJvdmlkZXI6IG9wdHM/LnByb3ZpZGVyIH1cbiAgICApO1xuXG4gICAgLy8gQ29uZmlndXJlIGxpZmVjeWNsZSBydWxlcyBpZiBzcGVjaWZpZWRcbiAgICBpZiAoYXJncy5saWZlY3ljbGVSdWxlcyAmJiBhcmdzLmxpZmVjeWNsZVJ1bGVzLmxlbmd0aCA+IDApIHtcbiAgICAgIHRoaXMubGlmZWN5Y2xlQ29uZmlndXJhdGlvbiA9IG5ldyBhd3MuczMuQnVja2V0TGlmZWN5Y2xlQ29uZmlndXJhdGlvbihcbiAgICAgICAgYCR7bmFtZX0tbGlmZWN5Y2xlYCxcbiAgICAgICAge1xuICAgICAgICAgIGJ1Y2tldDogdGhpcy5idWNrZXQuaWQsXG4gICAgICAgICAgcnVsZXM6IGFyZ3MubGlmZWN5Y2xlUnVsZXMubWFwKHJ1bGUgPT4ge1xuICAgICAgICAgICAgY29uc3QgbGlmZWN5Y2xlUnVsZTogTGlmZWN5Y2xlUnVsZUNvbmZpZyA9IHtcbiAgICAgICAgICAgICAgaWQ6IHJ1bGUuaWQsXG4gICAgICAgICAgICAgIHN0YXR1czogcnVsZS5zdGF0dXMsXG4gICAgICAgICAgICB9O1xuXG4gICAgICAgICAgICBpZiAocnVsZS5maWx0ZXIpIHtcbiAgICAgICAgICAgICAgbGlmZWN5Y2xlUnVsZS5maWx0ZXIgPSB7XG4gICAgICAgICAgICAgICAgcHJlZml4OiBydWxlLmZpbHRlci5wcmVmaXgsXG4gICAgICAgICAgICAgICAgdGFnczogcnVsZS5maWx0ZXIudGFncyxcbiAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgaWYgKHJ1bGUuZXhwaXJhdGlvbikge1xuICAgICAgICAgICAgICBsaWZlY3ljbGVSdWxlLmV4cGlyYXRpb24gPSB7XG4gICAgICAgICAgICAgICAgZGF5czogcnVsZS5leHBpcmF0aW9uLmRheXMsXG4gICAgICAgICAgICAgICAgZXhwaXJlZE9iamVjdERlbGV0ZU1hcmtlcjpcbiAgICAgICAgICAgICAgICAgIHJ1bGUuZXhwaXJhdGlvbi5leHBpcmVkT2JqZWN0RGVsZXRlTWFya2VyLFxuICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBpZiAoXG4gICAgICAgICAgICAgIHJ1bGUubm9uY3VycmVudFZlcnNpb25FeHBpcmF0aW9uICYmXG4gICAgICAgICAgICAgIHJ1bGUubm9uY3VycmVudFZlcnNpb25FeHBpcmF0aW9uLm5vbmN1cnJlbnREYXlzICE9PSB1bmRlZmluZWRcbiAgICAgICAgICAgICkge1xuICAgICAgICAgICAgICBsaWZlY3ljbGVSdWxlLm5vbmN1cnJlbnRWZXJzaW9uRXhwaXJhdGlvbiA9IHtcbiAgICAgICAgICAgICAgICBub25jdXJyZW50RGF5czogcnVsZS5ub25jdXJyZW50VmVyc2lvbkV4cGlyYXRpb24ubm9uY3VycmVudERheXMsXG4gICAgICAgICAgICAgIH07XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGlmIChydWxlLnRyYW5zaXRpb25zKSB7XG4gICAgICAgICAgICAgIGxpZmVjeWNsZVJ1bGUudHJhbnNpdGlvbnMgPSBydWxlLnRyYW5zaXRpb25zLm1hcCh0cmFuc2l0aW9uID0+ICh7XG4gICAgICAgICAgICAgICAgZGF5czogdHJhbnNpdGlvbi5kYXlzLFxuICAgICAgICAgICAgICAgIHN0b3JhZ2VDbGFzczogdHJhbnNpdGlvbi5zdG9yYWdlQ2xhc3MsXG4gICAgICAgICAgICAgIH0pKTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgcmV0dXJuIGxpZmVjeWNsZVJ1bGU7XG4gICAgICAgICAgfSksXG4gICAgICAgIH0sXG4gICAgICAgIHsgcGFyZW50OiB0aGlzLCBwcm92aWRlcjogb3B0cz8ucHJvdmlkZXIgfVxuICAgICAgKTtcbiAgICB9XG5cbiAgICAvLyAgQ29uZmlndXJlIENPUlMgd2l0aCBub24tZGVwcmVjYXRlZCByZXNvdXJjZVxuICAgIGlmIChhcmdzLmNvcnNSdWxlcyAmJiBhcmdzLmNvcnNSdWxlcy5sZW5ndGggPiAwKSB7XG4gICAgICB0aGlzLmNvcnNDb25maWd1cmF0aW9uID0gbmV3IGF3cy5zMy5CdWNrZXRDb3JzQ29uZmlndXJhdGlvbiggLy8g4oaQIEZJWEVEOiBSZW1vdmVkIFYyXG4gICAgICAgIGAke25hbWV9LWNvcnNgLFxuICAgICAgICB7XG4gICAgICAgICAgYnVja2V0OiB0aGlzLmJ1Y2tldC5pZCxcbiAgICAgICAgICBjb3JzUnVsZXM6IGFyZ3MuY29yc1J1bGVzLFxuICAgICAgICB9LFxuICAgICAgICB7IHBhcmVudDogdGhpcywgcHJvdmlkZXI6IG9wdHM/LnByb3ZpZGVyIH1cbiAgICAgICk7XG4gICAgfVxuXG4gICAgdGhpcy5yZWdpc3Rlck91dHB1dHMoe1xuICAgICAgYnVja2V0OiB0aGlzLmJ1Y2tldCxcbiAgICAgIGJ1Y2tldElkOiB0aGlzLmJ1Y2tldElkLFxuICAgICAgYnVja2V0QXJuOiB0aGlzLmJ1Y2tldEFybixcbiAgICAgIGJ1Y2tldERvbWFpbk5hbWU6IHRoaXMuYnVja2V0RG9tYWluTmFtZSxcbiAgICAgIHZlcnNpb25pbmc6IHRoaXMudmVyc2lvbmluZyxcbiAgICAgIHNlcnZlclNpZGVFbmNyeXB0aW9uOiB0aGlzLnNlcnZlclNpZGVFbmNyeXB0aW9uLFxuICAgICAgcHVibGljQWNjZXNzQmxvY2s6IHRoaXMucHVibGljQWNjZXNzQmxvY2ssXG4gICAgICBsaWZlY3ljbGVDb25maWd1cmF0aW9uOiB0aGlzLmxpZmVjeWNsZUNvbmZpZ3VyYXRpb24sXG4gICAgICBjb3JzQ29uZmlndXJhdGlvbjogdGhpcy5jb3JzQ29uZmlndXJhdGlvbixcbiAgICB9KTtcbiAgfVxufVxuXG5leHBvcnQgY2xhc3MgUzNCdWNrZXRQb2xpY3lDb21wb25lbnQgZXh0ZW5kcyBwdWx1bWkuQ29tcG9uZW50UmVzb3VyY2Uge1xuICBwdWJsaWMgcmVhZG9ubHkgYnVja2V0UG9saWN5OiBhd3MuczMuQnVja2V0UG9saWN5O1xuXG4gIGNvbnN0cnVjdG9yKFxuICAgIG5hbWU6IHN0cmluZyxcbiAgICBhcmdzOiBTM0J1Y2tldFBvbGljeUFyZ3MsXG4gICAgb3B0cz86IHB1bHVtaS5Db21wb25lbnRSZXNvdXJjZU9wdGlvbnNcbiAgKSB7XG4gICAgc3VwZXIoJ2F3czpzMzpTM0J1Y2tldFBvbGljeUNvbXBvbmVudCcsIG5hbWUsIHt9LCBvcHRzKTtcblxuICAgIHRoaXMuYnVja2V0UG9saWN5ID0gbmV3IGF3cy5zMy5CdWNrZXRQb2xpY3koXG4gICAgICBgJHtuYW1lfS1wb2xpY3lgLFxuICAgICAge1xuICAgICAgICBidWNrZXQ6IGFyZ3MuYnVja2V0LFxuICAgICAgICBwb2xpY3k6IGFyZ3MucG9saWN5LFxuICAgICAgfSxcbiAgICAgIHsgcGFyZW50OiB0aGlzLCBwcm92aWRlcjogb3B0cz8ucHJvdmlkZXIgfVxuICAgICk7XG5cbiAgICB0aGlzLnJlZ2lzdGVyT3V0cHV0cyh7XG4gICAgICBidWNrZXRQb2xpY3k6IHRoaXMuYnVja2V0UG9saWN5LFxuICAgIH0pO1xuICB9XG59XG5cbmV4cG9ydCBjbGFzcyBTZWN1cmVTM0J1Y2tldENvbXBvbmVudCBleHRlbmRzIHB1bHVtaS5Db21wb25lbnRSZXNvdXJjZSB7XG4gIHB1YmxpYyByZWFkb25seSBidWNrZXQ6IGF3cy5zMy5CdWNrZXQ7XG4gIHB1YmxpYyByZWFkb25seSBidWNrZXRJZDogcHVsdW1pLk91dHB1dDxzdHJpbmc+O1xuICBwdWJsaWMgcmVhZG9ubHkgYnVja2V0QXJuOiBwdWx1bWkuT3V0cHV0PHN0cmluZz47XG4gIHB1YmxpYyByZWFkb25seSBidWNrZXREb21haW5OYW1lOiBwdWx1bWkuT3V0cHV0PHN0cmluZz47XG4gIHB1YmxpYyByZWFkb25seSB2ZXJzaW9uaW5nPzogYXdzLnMzLkJ1Y2tldFZlcnNpb25pbmc7XG4gIHB1YmxpYyByZWFkb25seSBzZXJ2ZXJTaWRlRW5jcnlwdGlvbj86IGF3cy5zMy5CdWNrZXRTZXJ2ZXJTaWRlRW5jcnlwdGlvbkNvbmZpZ3VyYXRpb247XG4gIHB1YmxpYyByZWFkb25seSBwdWJsaWNBY2Nlc3NCbG9jazogYXdzLnMzLkJ1Y2tldFB1YmxpY0FjY2Vzc0Jsb2NrO1xuICBwdWJsaWMgcmVhZG9ubHkgbGlmZWN5Y2xlQ29uZmlndXJhdGlvbj86IGF3cy5zMy5CdWNrZXRMaWZlY3ljbGVDb25maWd1cmF0aW9uO1xuICBwdWJsaWMgcmVhZG9ubHkgYnVja2V0UG9saWN5PzogYXdzLnMzLkJ1Y2tldFBvbGljeTtcblxuICBjb25zdHJ1Y3RvcihcbiAgICBuYW1lOiBzdHJpbmcsXG4gICAgYXJnczogU2VjdXJlUzNCdWNrZXRBcmdzLFxuICAgIG9wdHM/OiBwdWx1bWkuQ29tcG9uZW50UmVzb3VyY2VPcHRpb25zXG4gICkge1xuICAgIHN1cGVyKCdhd3M6czM6U2VjdXJlUzNCdWNrZXRDb21wb25lbnQnLCBuYW1lLCB7fSwgb3B0cyk7XG5cbiAgICAvLyBEZWZhdWx0IHNlY3VyZSBsaWZlY3ljbGUgcnVsZXMgLSBlbnN1cmUgYWxsIHZhbHVlcyBhcmUgZGVmaW5lZFxuICAgIGNvbnN0IGRlZmF1bHRMaWZlY3ljbGVSdWxlcyA9IGFyZ3MuZW5hYmxlTGlmZWN5Y2xlXG4gICAgICA/IFtcbiAgICAgICAgICB7XG4gICAgICAgICAgICBpZDogJ3RyYW5zaXRpb24tdG8taWEnLFxuICAgICAgICAgICAgc3RhdHVzOiAnRW5hYmxlZCcgYXMgY29uc3QsXG4gICAgICAgICAgICB0cmFuc2l0aW9uczogW1xuICAgICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgZGF5czogMzAsXG4gICAgICAgICAgICAgICAgc3RvcmFnZUNsYXNzOiAnU1RBTkRBUkRfSUEnLFxuICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgZGF5czogOTAsXG4gICAgICAgICAgICAgICAgc3RvcmFnZUNsYXNzOiAnR0xBQ0lFUicsXG4gICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBdLFxuICAgICAgICAgIH0sXG4gICAgICAgICAge1xuICAgICAgICAgICAgaWQ6ICdkZWxldGUtb2xkLXZlcnNpb25zJyxcbiAgICAgICAgICAgIHN0YXR1czogJ0VuYWJsZWQnIGFzIGNvbnN0LFxuICAgICAgICAgICAgbm9uY3VycmVudFZlcnNpb25FeHBpcmF0aW9uOiB7XG4gICAgICAgICAgICAgIG5vbmN1cnJlbnREYXlzOiA5MCxcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgfSxcbiAgICAgICAgICB7XG4gICAgICAgICAgICBpZDogJ2NsZWFudXAtaW5jb21wbGV0ZS11cGxvYWRzJyxcbiAgICAgICAgICAgIHN0YXR1czogJ0VuYWJsZWQnIGFzIGNvbnN0LFxuICAgICAgICAgICAgZXhwaXJhdGlvbjoge1xuICAgICAgICAgICAgICBleHBpcmVkT2JqZWN0RGVsZXRlTWFya2VyOiB0cnVlLFxuICAgICAgICAgICAgfSxcbiAgICAgICAgICB9LFxuICAgICAgICBdXG4gICAgICA6IHVuZGVmaW5lZDtcblxuICAgIC8vIENyZWF0ZSBzZWN1cmUgUzMgYnVja2V0XG4gICAgY29uc3QgczNCdWNrZXRDb21wb25lbnQgPSBuZXcgUzNCdWNrZXRDb21wb25lbnQoXG4gICAgICBuYW1lLFxuICAgICAge1xuICAgICAgICBidWNrZXROYW1lOiBhcmdzLmJ1Y2tldE5hbWUsXG4gICAgICAgIC8vIFJlbW92ZWQgQUNMIHBhcmFtZXRlciAtIGRlZmF1bHRzIHRvIHByaXZhdGVcbiAgICAgICAgZm9yY2VEZXN0cm95OiBmYWxzZSxcbiAgICAgICAgdGFnczogYXJncy50YWdzLFxuICAgICAgICB2ZXJzaW9uaW5nOiB7XG4gICAgICAgICAgZW5hYmxlZDogYXJncy5lbmFibGVWZXJzaW9uaW5nID8/IHRydWUsXG4gICAgICAgICAgbWZhRGVsZXRlOiBmYWxzZSxcbiAgICAgICAgfSxcbiAgICAgICAgc2VydmVyU2lkZUVuY3J5cHRpb246IHtcbiAgICAgICAgICBhbGdvcml0aG06ICdhd3M6a21zJyxcbiAgICAgICAgICBrbXNLZXlJZDogYXJncy5rbXNLZXlJZCxcbiAgICAgICAgICBidWNrZXRLZXlFbmFibGVkOiB0cnVlLFxuICAgICAgICB9LFxuICAgICAgICBwdWJsaWNBY2Nlc3NCbG9jazoge1xuICAgICAgICAgIGJsb2NrUHVibGljQWNsczogdHJ1ZSxcbiAgICAgICAgICBibG9ja1B1YmxpY1BvbGljeTogdHJ1ZSxcbiAgICAgICAgICBpZ25vcmVQdWJsaWNBY2xzOiB0cnVlLFxuICAgICAgICAgIHJlc3RyaWN0UHVibGljQnVja2V0czogdHJ1ZSxcbiAgICAgICAgfSxcbiAgICAgICAgbGlmZWN5Y2xlUnVsZXM6IGRlZmF1bHRMaWZlY3ljbGVSdWxlcyxcbiAgICAgIH0sXG4gICAgICB7IHBhcmVudDogdGhpcywgcHJvdmlkZXI6IG9wdHM/LnByb3ZpZGVyIH1cbiAgICApO1xuXG4gICAgdGhpcy5idWNrZXQgPSBzM0J1Y2tldENvbXBvbmVudC5idWNrZXQ7XG4gICAgdGhpcy5idWNrZXRJZCA9IHMzQnVja2V0Q29tcG9uZW50LmJ1Y2tldElkO1xuICAgIHRoaXMuYnVja2V0QXJuID0gczNCdWNrZXRDb21wb25lbnQuYnVja2V0QXJuO1xuICAgIHRoaXMuYnVja2V0RG9tYWluTmFtZSA9IHMzQnVja2V0Q29tcG9uZW50LmJ1Y2tldERvbWFpbk5hbWU7XG4gICAgdGhpcy52ZXJzaW9uaW5nID0gczNCdWNrZXRDb21wb25lbnQudmVyc2lvbmluZztcbiAgICB0aGlzLnNlcnZlclNpZGVFbmNyeXB0aW9uID0gczNCdWNrZXRDb21wb25lbnQuc2VydmVyU2lkZUVuY3J5cHRpb247XG4gICAgdGhpcy5wdWJsaWNBY2Nlc3NCbG9jayA9IHMzQnVja2V0Q29tcG9uZW50LnB1YmxpY0FjY2Vzc0Jsb2NrITtcbiAgICB0aGlzLmxpZmVjeWNsZUNvbmZpZ3VyYXRpb24gPSBzM0J1Y2tldENvbXBvbmVudC5saWZlY3ljbGVDb25maWd1cmF0aW9uO1xuXG4gICAgLy8gQ3JlYXRlIHNlY3VyZSBidWNrZXQgcG9saWN5XG4gICAgaWYgKGFyZ3MuYWxsb3dlZFByaW5jaXBhbHMgJiYgYXJncy5hbGxvd2VkQWN0aW9ucykge1xuICAgICAgY29uc3QgYnVja2V0UG9saWN5ID0gcHVsdW1pXG4gICAgICAgIC5hbGwoW3RoaXMuYnVja2V0QXJuLCBwdWx1bWkub3V0cHV0KGF3cy5nZXRDYWxsZXJJZGVudGl0eSgpKV0pXG4gICAgICAgIC5hcHBseSgoW2J1Y2tldEFybiwgX2lkZW50aXR5XSkgPT5cbiAgICAgICAgICBKU09OLnN0cmluZ2lmeSh7XG4gICAgICAgICAgICBWZXJzaW9uOiAnMjAxMi0xMC0xNycsXG4gICAgICAgICAgICBTdGF0ZW1lbnQ6IFtcbiAgICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgIFNpZDogJ0RlbnlJbnNlY3VyZUNvbm5lY3Rpb25zJyxcbiAgICAgICAgICAgICAgICBFZmZlY3Q6ICdEZW55JyxcbiAgICAgICAgICAgICAgICBQcmluY2lwYWw6ICcqJyxcbiAgICAgICAgICAgICAgICBBY3Rpb246ICdzMzoqJyxcbiAgICAgICAgICAgICAgICBSZXNvdXJjZTogW2J1Y2tldEFybiwgYCR7YnVja2V0QXJufS8qYF0sXG4gICAgICAgICAgICAgICAgQ29uZGl0aW9uOiB7XG4gICAgICAgICAgICAgICAgICBCb29sOiB7XG4gICAgICAgICAgICAgICAgICAgICdhd3M6U2VjdXJlVHJhbnNwb3J0JzogJ2ZhbHNlJyxcbiAgICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgIFNpZDogJ0FsbG93U3BlY2lmaWNQcmluY2lwYWxzJyxcbiAgICAgICAgICAgICAgICBFZmZlY3Q6ICdBbGxvdycsXG4gICAgICAgICAgICAgICAgUHJpbmNpcGFsOiB7XG4gICAgICAgICAgICAgICAgICBBV1M6IGFyZ3MuYWxsb3dlZFByaW5jaXBhbHMsXG4gICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICBBY3Rpb246IGFyZ3MuYWxsb3dlZEFjdGlvbnMsXG4gICAgICAgICAgICAgICAgUmVzb3VyY2U6IFtidWNrZXRBcm4sIGAke2J1Y2tldEFybn0vKmBdLFxuICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgU2lkOiAnRGVueVVuZW5jcnlwdGVkVXBsb2FkcycsXG4gICAgICAgICAgICAgICAgRWZmZWN0OiAnRGVueScsXG4gICAgICAgICAgICAgICAgUHJpbmNpcGFsOiAnKicsXG4gICAgICAgICAgICAgICAgQWN0aW9uOiAnczM6UHV0T2JqZWN0JyxcbiAgICAgICAgICAgICAgICBSZXNvdXJjZTogYCR7YnVja2V0QXJufS8qYCxcbiAgICAgICAgICAgICAgICBDb25kaXRpb246IHtcbiAgICAgICAgICAgICAgICAgIFN0cmluZ05vdEVxdWFsczoge1xuICAgICAgICAgICAgICAgICAgICAnczM6eC1hbXotc2VydmVyLXNpZGUtZW5jcnlwdGlvbic6ICdhd3M6a21zJyxcbiAgICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIF0sXG4gICAgICAgICAgfSlcbiAgICAgICAgKTtcblxuICAgICAgY29uc3QgYnVja2V0UG9saWN5Q29tcG9uZW50ID0gbmV3IFMzQnVja2V0UG9saWN5Q29tcG9uZW50KFxuICAgICAgICBgJHtuYW1lfS1wb2xpY3lgLFxuICAgICAgICB7XG4gICAgICAgICAgYnVja2V0OiB0aGlzLmJ1Y2tldElkLFxuICAgICAgICAgIHBvbGljeTogYnVja2V0UG9saWN5LFxuICAgICAgICB9LFxuICAgICAgICB7IHBhcmVudDogdGhpcywgcHJvdmlkZXI6IG9wdHM/LnByb3ZpZGVyIH1cbiAgICAgICk7XG5cbiAgICAgIHRoaXMuYnVja2V0UG9saWN5ID0gYnVja2V0UG9saWN5Q29tcG9uZW50LmJ1Y2tldFBvbGljeTtcbiAgICB9XG5cbiAgICB0aGlzLnJlZ2lzdGVyT3V0cHV0cyh7XG4gICAgICBidWNrZXQ6IHRoaXMuYnVja2V0LFxuICAgICAgYnVja2V0SWQ6IHRoaXMuYnVja2V0SWQsXG4gICAgICBidWNrZXRBcm46IHRoaXMuYnVja2V0QXJuLFxuICAgICAgYnVja2V0RG9tYWluTmFtZTogdGhpcy5idWNrZXREb21haW5OYW1lLFxuICAgICAgdmVyc2lvbmluZzogdGhpcy52ZXJzaW9uaW5nLFxuICAgICAgc2VydmVyU2lkZUVuY3J5cHRpb246IHRoaXMuc2VydmVyU2lkZUVuY3J5cHRpb24sXG4gICAgICBwdWJsaWNBY2Nlc3NCbG9jazogdGhpcy5wdWJsaWNBY2Nlc3NCbG9jayxcbiAgICAgIGxpZmVjeWNsZUNvbmZpZ3VyYXRpb246IHRoaXMubGlmZWN5Y2xlQ29uZmlndXJhdGlvbixcbiAgICAgIGJ1Y2tldFBvbGljeTogdGhpcy5idWNrZXRQb2xpY3ksXG4gICAgfSk7XG4gIH1cbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGNyZWF0ZVMzQnVja2V0KFxuICBuYW1lOiBzdHJpbmcsXG4gIGFyZ3M6IFMzQnVja2V0QXJncyxcbiAgb3B0cz86IHB1bHVtaS5Db21wb25lbnRSZXNvdXJjZU9wdGlvbnNcbik6IFMzQnVja2V0UmVzdWx0IHtcbiAgY29uc3QgczNCdWNrZXRDb21wb25lbnQgPSBuZXcgUzNCdWNrZXRDb21wb25lbnQobmFtZSwgYXJncywgb3B0cyk7XG4gIHJldHVybiB7XG4gICAgYnVja2V0OiBzM0J1Y2tldENvbXBvbmVudC5idWNrZXQsXG4gICAgYnVja2V0SWQ6IHMzQnVja2V0Q29tcG9uZW50LmJ1Y2tldElkLFxuICAgIGJ1Y2tldEFybjogczNCdWNrZXRDb21wb25lbnQuYnVja2V0QXJuLFxuICAgIGJ1Y2tldERvbWFpbk5hbWU6IHMzQnVja2V0Q29tcG9uZW50LmJ1Y2tldERvbWFpbk5hbWUsXG4gICAgdmVyc2lvbmluZzogczNCdWNrZXRDb21wb25lbnQudmVyc2lvbmluZyxcbiAgICBzZXJ2ZXJTaWRlRW5jcnlwdGlvbjogczNCdWNrZXRDb21wb25lbnQuc2VydmVyU2lkZUVuY3J5cHRpb24sXG4gICAgcHVibGljQWNjZXNzQmxvY2s6IHMzQnVja2V0Q29tcG9uZW50LnB1YmxpY0FjY2Vzc0Jsb2NrLFxuICAgIGxpZmVjeWNsZUNvbmZpZ3VyYXRpb246IHMzQnVja2V0Q29tcG9uZW50LmxpZmVjeWNsZUNvbmZpZ3VyYXRpb24sXG4gICAgY29yc0NvbmZpZ3VyYXRpb246IHMzQnVja2V0Q29tcG9uZW50LmNvcnNDb25maWd1cmF0aW9uLFxuICAgIGJ1Y2tldFBvbGljeTogczNCdWNrZXRDb21wb25lbnQuYnVja2V0UG9saWN5LFxuICB9O1xufVxuXG5leHBvcnQgZnVuY3Rpb24gY3JlYXRlUzNCdWNrZXRQb2xpY3koXG4gIG5hbWU6IHN0cmluZyxcbiAgYXJnczogUzNCdWNrZXRQb2xpY3lBcmdzLFxuICBvcHRzPzogcHVsdW1pLkNvbXBvbmVudFJlc291cmNlT3B0aW9uc1xuKTogYXdzLnMzLkJ1Y2tldFBvbGljeSB7XG4gIGNvbnN0IGJ1Y2tldFBvbGljeUNvbXBvbmVudCA9IG5ldyBTM0J1Y2tldFBvbGljeUNvbXBvbmVudChuYW1lLCBhcmdzLCBvcHRzKTtcbiAgcmV0dXJuIGJ1Y2tldFBvbGljeUNvbXBvbmVudC5idWNrZXRQb2xpY3k7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBjcmVhdGVTZWN1cmVTM0J1Y2tldChcbiAgbmFtZTogc3RyaW5nLFxuICBhcmdzOiBTZWN1cmVTM0J1Y2tldEFyZ3MsXG4gIG9wdHM/OiBwdWx1bWkuQ29tcG9uZW50UmVzb3VyY2VPcHRpb25zXG4pOiBTM0J1Y2tldFJlc3VsdCB7XG4gIGNvbnN0IHNlY3VyZVMzQnVja2V0Q29tcG9uZW50ID0gbmV3IFNlY3VyZVMzQnVja2V0Q29tcG9uZW50KG5hbWUsIGFyZ3MsIG9wdHMpO1xuICByZXR1cm4ge1xuICAgIGJ1Y2tldDogc2VjdXJlUzNCdWNrZXRDb21wb25lbnQuYnVja2V0LFxuICAgIGJ1Y2tldElkOiBzZWN1cmVTM0J1Y2tldENvbXBvbmVudC5idWNrZXRJZCxcbiAgICBidWNrZXRBcm46IHNlY3VyZVMzQnVja2V0Q29tcG9uZW50LmJ1Y2tldEFybixcbiAgICBidWNrZXREb21haW5OYW1lOiBzZWN1cmVTM0J1Y2tldENvbXBvbmVudC5idWNrZXREb21haW5OYW1lLFxuICAgIHZlcnNpb25pbmc6IHNlY3VyZVMzQnVja2V0Q29tcG9uZW50LnZlcnNpb25pbmcsXG4gICAgc2VydmVyU2lkZUVuY3J5cHRpb246IHNlY3VyZVMzQnVja2V0Q29tcG9uZW50LnNlcnZlclNpZGVFbmNyeXB0aW9uLFxuICAgIHB1YmxpY0FjY2Vzc0Jsb2NrOiBzZWN1cmVTM0J1Y2tldENvbXBvbmVudC5wdWJsaWNBY2Nlc3NCbG9jayxcbiAgICBsaWZlY3ljbGVDb25maWd1cmF0aW9uOiBzZWN1cmVTM0J1Y2tldENvbXBvbmVudC5saWZlY3ljbGVDb25maWd1cmF0aW9uLFxuICAgIGNvcnNDb25maWd1cmF0aW9uOiB1bmRlZmluZWQsXG4gICAgYnVja2V0UG9saWN5OiBzZWN1cmVTM0J1Y2tldENvbXBvbmVudC5idWNrZXRQb2xpY3ksXG4gIH07XG59XG4iXX0=