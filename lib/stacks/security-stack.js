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
exports.SecurityStack = void 0;
const aws = __importStar(require("@pulumi/aws"));
const pulumi = __importStar(require("@pulumi/pulumi"));
const kms_1 = require("../modules/kms");
const s3_1 = require("../modules/s3");
const enhanced_s3_1 = require("../modules/s3/enhanced-s3");
const iam_1 = require("../modules/iam");
const cloudtrail_1 = require("../modules/cloudtrail");
const enhanced_cloudtrail_1 = require("../modules/cloudtrail/enhanced-cloudtrail");
const security_policies_1 = require("../modules/security-policies");
const tags_1 = require("../config/tags");
class SecurityStack extends pulumi.ComponentResource {
    // S3 Buckets
    primaryBucketName;
    primaryBucketArn;
    auditBucketName;
    auditBucketArn;
    // KMS Keys
    s3KmsKeyId;
    s3KmsKeyArn;
    cloudTrailKmsKeyId;
    cloudTrailKmsKeyArn;
    // IAM Roles
    dataAccessRoleArn;
    auditRoleArn;
    // CloudTrail
    cloudTrailArn;
    cloudTrailLogGroupArn;
    // Security Policies
    securityPolicyArn;
    mfaEnforcementPolicyArn;
    s3SecurityPolicyArn;
    cloudTrailProtectionPolicyArn;
    kmsProtectionPolicyArn;
    // Region confirmation
    region;
    constructor(name, args, opts) {
        super('tap:security:SecurityStack', name, args, opts);
        const environmentSuffix = args?.environmentSuffix || 'dev';
        const tags = args?.tags || {};
        const allowedIpRanges = args?.allowedIpRanges || ['203.0.113.0/24'];
        const enableEnhancedSecurity = args?.enableEnhancedSecurity ?? true;
        // Configure AWS provider for us-east-1
        const provider = new aws.Provider('aws-provider', {
            region: 'us-east-1',
        }, { parent: this });
        // Get account ID for IAM role policies
        const accountId = aws.getCallerIdentity().then(id => id.accountId);
        // Create enhanced security policies
        const securityPolicies = new security_policies_1.SecurityPolicies(`tap-security-policies-${environmentSuffix}`, {
            environmentSuffix,
            tags: tags_1.commonTags,
        }, { parent: this, provider });
        // Create KMS keys for encryption
        const s3KmsKey = new kms_1.KMSKey(`s3-encryption-${environmentSuffix}`, {
            description: `KMS key for S3 bucket encryption - ${environmentSuffix} environment`,
            tags: {
                Purpose: 'S3 Encryption',
                Environment: environmentSuffix,
            },
        }, { parent: this, provider });
        const cloudTrailKmsKey = new kms_1.KMSKey(`cloudtrail-encryption-${environmentSuffix}`, {
            description: `KMS key for CloudTrail log encryption - ${environmentSuffix} environment`,
            tags: {
                Purpose: 'CloudTrail Encryption',
                Environment: environmentSuffix,
            },
        }, { parent: this, provider });
        // Create secure S3 buckets with enhanced security
        let primaryBucket;
        let auditBucket;
        if (enableEnhancedSecurity) {
            primaryBucket = new enhanced_s3_1.EnhancedSecureS3Bucket(`tap-primary-storage-${environmentSuffix}`, {
                bucketName: `tap-primary-storage-${environmentSuffix}`,
                kmsKeyId: s3KmsKey.key.keyId,
                allowedIpRanges,
                enableAccessLogging: true,
                enableNotifications: true,
                enableObjectLock: true,
                lifecycleRules: [
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
                            {
                                days: 365,
                                storageClass: 'DEEP_ARCHIVE',
                            },
                        ],
                    },
                ],
                tags: {
                    Purpose: 'Primary data storage with enhanced security',
                    Environment: environmentSuffix,
                },
            }, { parent: this, provider });
            auditBucket = new enhanced_s3_1.EnhancedSecureS3Bucket(`tap-audit-logs-${environmentSuffix}`, {
                bucketName: `tap-audit-logs-${environmentSuffix}`,
                kmsKeyId: cloudTrailKmsKey.key.keyId,
                allowedIpRanges,
                enableAccessLogging: true,
                enableObjectLock: true,
                tags: {
                    Purpose: 'Audit and compliance logs with enhanced security',
                    Environment: environmentSuffix,
                },
            }, { parent: this, provider });
        }
        else {
            primaryBucket = new s3_1.SecureS3Bucket(`tap-primary-storage-${environmentSuffix}`, {
                bucketName: `tap-primary-storage-${environmentSuffix}`,
                kmsKeyId: s3KmsKey.key.keyId,
                lifecycleRules: [
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
                            {
                                days: 365,
                                storageClass: 'DEEP_ARCHIVE',
                            },
                        ],
                    },
                ],
                tags: {
                    Purpose: 'Primary data storage',
                    Environment: environmentSuffix,
                },
            }, { parent: this, provider });
            auditBucket = new s3_1.SecureS3Bucket(`tap-audit-logs-${environmentSuffix}`, {
                bucketName: `tap-audit-logs-${environmentSuffix}`,
                kmsKeyId: cloudTrailKmsKey.key.keyId,
                tags: {
                    Purpose: 'Audit and compliance logs',
                    Environment: environmentSuffix,
                },
            }, { parent: this, provider });
        }
        // Create IAM roles with enhanced least privilege and MFA enforcement
        const dataAccessRole = new iam_1.SecureIAMRole(`tap-data-access-${environmentSuffix}`, {
            assumeRolePolicy: pulumi.all([accountId]).apply(([accountId]) => JSON.stringify({
                Version: '2012-10-17',
                Statement: [
                    {
                        Action: 'sts:AssumeRole',
                        Effect: 'Allow',
                        Principal: {
                            AWS: `arn:aws:iam::${accountId}:root`,
                        },
                        Condition: {
                            Bool: {
                                'aws:MultiFactorAuthPresent': 'true',
                            },
                            StringEquals: {
                                'aws:RequestedRegion': 'us-east-1',
                            },
                            IpAddress: {
                                'aws:SourceIp': allowedIpRanges,
                            },
                        },
                    },
                ],
            })),
            roleName: `tap-data-access-role-${environmentSuffix}`,
            policies: enableEnhancedSecurity
                ? [
                    (0, security_policies_1.createTimeBasedS3AccessPolicy)(primaryBucket.bucket.arn),
                    (0, iam_1.createMFAEnforcedPolicy)(),
                ]
                : [
                    (0, iam_1.createS3AccessPolicy)(primaryBucket.bucket.arn),
                    (0, iam_1.createMFAEnforcedPolicy)(),
                ],
            managedPolicyArns: [],
            requireMFA: true,
            tags: {
                Purpose: 'Data access with enhanced MFA enforcement and time restrictions',
                Environment: environmentSuffix,
            },
        }, { parent: this, provider });
        const auditRole = new iam_1.SecureIAMRole(`tap-audit-access-${environmentSuffix}`, {
            assumeRolePolicy: pulumi.all([accountId]).apply(([accountId]) => JSON.stringify({
                Version: '2012-10-17',
                Statement: [
                    {
                        Action: 'sts:AssumeRole',
                        Effect: 'Allow',
                        Principal: {
                            AWS: `arn:aws:iam::${accountId}:root`,
                        },
                        Condition: {
                            Bool: {
                                'aws:MultiFactorAuthPresent': 'true',
                            },
                            StringEquals: {
                                'aws:RequestedRegion': 'us-east-1',
                            },
                            IpAddress: {
                                'aws:SourceIp': allowedIpRanges,
                            },
                        },
                    },
                ],
            })),
            roleName: `tap-audit-access-role-${environmentSuffix}`,
            policies: enableEnhancedSecurity
                ? [
                    (0, security_policies_1.createRestrictedAuditPolicy)(auditBucket.bucket.arn, allowedIpRanges),
                ]
                : [
                    pulumi.interpolate `{
          "Version": "2012-10-17",
          "Statement": [
            {
              "Effect": "Allow",
              "Action": [
                "s3:GetObject",
                "s3:ListBucket"
              ],
              "Resource": [
                "${auditBucket.bucket.arn}",
                "${auditBucket.bucket.arn}/*"
              ]
            },
            {
              "Effect": "Allow",
              "Action": [
                "cloudtrail:LookupEvents",
                "cloudtrail:GetTrailStatus"
              ],
              "Resource": "*"
            }
          ]
        }`,
                ],
            managedPolicyArns: ['arn:aws:iam::aws:policy/ReadOnlyAccess'],
            requireMFA: true,
            tags: {
                Purpose: 'Audit log access with IP and time restrictions',
                Environment: environmentSuffix,
            },
        }, { parent: this, provider });
        // Create CloudTrail for comprehensive logging
        let cloudTrail;
        if (enableEnhancedSecurity) {
            cloudTrail = new enhanced_cloudtrail_1.EnhancedCloudTrail(`tap-security-audit-${environmentSuffix}`, {
                trailName: `tap-security-audit-trail-${environmentSuffix}`,
                s3BucketName: auditBucket.bucket.id,
                kmsKeyId: cloudTrailKmsKey.key.keyId,
                includeGlobalServiceEvents: true,
                isMultiRegionTrail: true,
                enableLogFileValidation: true,
                enableInsightSelectors: true,
                tags: {
                    Purpose: 'Enhanced security audit and compliance with anomaly detection',
                    Environment: environmentSuffix,
                },
            }, { parent: this, provider });
        }
        else {
            cloudTrail = new cloudtrail_1.SecureCloudTrail(`tap-security-audit-${environmentSuffix}`, {
                trailName: `tap-security-audit-trail-${environmentSuffix}`,
                s3BucketName: auditBucket.bucket.id,
                kmsKeyId: cloudTrailKmsKey.key.keyId,
                includeGlobalServiceEvents: true,
                isMultiRegionTrail: true,
                enableLogFileValidation: true,
                tags: {
                    Purpose: 'Security audit and compliance',
                    Environment: environmentSuffix,
                },
            }, { parent: this, provider });
        }
        // Create additional security policies with enhanced controls
        const securityPolicy = new aws.iam.Policy(`tap-security-baseline-${environmentSuffix}`, {
            name: `SecurityBaseline-${environmentSuffix}`,
            description: 'Enhanced baseline security policy with comprehensive MFA requirements',
            policy: JSON.stringify({
                Version: '2012-10-17',
                Statement: [
                    {
                        Sid: 'RequireMFAForAllSensitiveActions',
                        Effect: 'Deny',
                        Action: [
                            'iam:CreateRole',
                            'iam:DeleteRole',
                            'iam:AttachRolePolicy',
                            'iam:DetachRolePolicy',
                            'iam:PutRolePolicy',
                            'iam:DeleteRolePolicy',
                            's3:DeleteBucket',
                            's3:PutBucketPolicy',
                            'kms:ScheduleKeyDeletion',
                            'kms:DisableKey',
                            'cloudtrail:DeleteTrail',
                            'cloudtrail:StopLogging',
                        ],
                        Resource: '*',
                        Condition: {
                            BoolIfExists: {
                                'aws:MultiFactorAuthPresent': 'false',
                            },
                        },
                    },
                    {
                        Sid: 'RestrictToUSEast1Only',
                        Effect: 'Deny',
                        Action: '*',
                        Resource: '*',
                        Condition: {
                            StringNotEquals: {
                                'aws:RequestedRegion': 'us-east-1',
                            },
                        },
                    },
                    {
                        Sid: 'RequireEncryptedStorage',
                        Effect: 'Deny',
                        Action: [
                            's3:PutObject',
                            'ebs:CreateVolume',
                            'rds:CreateDBInstance',
                        ],
                        Resource: '*',
                        Condition: {
                            Bool: {
                                'aws:SecureTransport': 'false',
                            },
                        },
                    },
                ],
            }),
            tags: { ...tags_1.commonTags, ...tags },
        }, { parent: this, provider });
        // Assign outputs
        this.primaryBucketName = primaryBucket.bucket.id;
        this.primaryBucketArn = primaryBucket.bucket.arn;
        this.auditBucketName = auditBucket.bucket.id;
        this.auditBucketArn = auditBucket.bucket.arn;
        this.s3KmsKeyId = s3KmsKey.key.keyId;
        this.s3KmsKeyArn = s3KmsKey.key.arn;
        this.cloudTrailKmsKeyId = cloudTrailKmsKey.key.keyId;
        this.cloudTrailKmsKeyArn = cloudTrailKmsKey.key.arn;
        this.dataAccessRoleArn = dataAccessRole.role.arn;
        this.auditRoleArn = auditRole.role.arn;
        this.cloudTrailArn = cloudTrail.trail.arn;
        this.cloudTrailLogGroupArn = cloudTrail.logGroup.arn;
        this.securityPolicyArn = securityPolicy.arn;
        this.mfaEnforcementPolicyArn = securityPolicies.mfaEnforcementPolicy.arn;
        this.s3SecurityPolicyArn = securityPolicies.s3DenyInsecurePolicy.arn;
        this.cloudTrailProtectionPolicyArn =
            securityPolicies.cloudTrailProtectionPolicy.arn;
        this.kmsProtectionPolicyArn = securityPolicies.kmsKeyProtectionPolicy.arn;
        this.region = 'us-east-1';
        // Register the outputs of this component
        this.registerOutputs({
            primaryBucketName: this.primaryBucketName,
            primaryBucketArn: this.primaryBucketArn,
            auditBucketName: this.auditBucketName,
            auditBucketArn: this.auditBucketArn,
            s3KmsKeyId: this.s3KmsKeyId,
            s3KmsKeyArn: this.s3KmsKeyArn,
            cloudTrailKmsKeyId: this.cloudTrailKmsKeyId,
            cloudTrailKmsKeyArn: this.cloudTrailKmsKeyArn,
            dataAccessRoleArn: this.dataAccessRoleArn,
            auditRoleArn: this.auditRoleArn,
            cloudTrailArn: this.cloudTrailArn,
            cloudTrailLogGroupArn: this.cloudTrailLogGroupArn,
            securityPolicyArn: this.securityPolicyArn,
            mfaEnforcementPolicyArn: this.mfaEnforcementPolicyArn,
            s3SecurityPolicyArn: this.s3SecurityPolicyArn,
            cloudTrailProtectionPolicyArn: this.cloudTrailProtectionPolicyArn,
            kmsProtectionPolicyArn: this.kmsProtectionPolicyArn,
            region: this.region,
        });
    }
}
exports.SecurityStack = SecurityStack;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic2VjdXJpdHktc3RhY2suanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJzZWN1cml0eS1zdGFjay50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFBQSxpREFBbUM7QUFDbkMsdURBQXlDO0FBQ3pDLHdDQUF3QztBQUN4QyxzQ0FBK0M7QUFDL0MsMkRBQW1FO0FBQ25FLHdDQUl3QjtBQUN4QixzREFBeUQ7QUFDekQsbUZBQStFO0FBQy9FLG9FQUlzQztBQUN0Qyx5Q0FBNEM7QUFTNUMsTUFBYSxhQUFjLFNBQVEsTUFBTSxDQUFDLGlCQUFpQjtJQUN6RCxhQUFhO0lBQ0csaUJBQWlCLENBQXdCO0lBQ3pDLGdCQUFnQixDQUF3QjtJQUN4QyxlQUFlLENBQXdCO0lBQ3ZDLGNBQWMsQ0FBd0I7SUFFdEQsV0FBVztJQUNLLFVBQVUsQ0FBd0I7SUFDbEMsV0FBVyxDQUF3QjtJQUNuQyxrQkFBa0IsQ0FBd0I7SUFDMUMsbUJBQW1CLENBQXdCO0lBRTNELFlBQVk7SUFDSSxpQkFBaUIsQ0FBd0I7SUFDekMsWUFBWSxDQUF3QjtJQUVwRCxhQUFhO0lBQ0csYUFBYSxDQUF3QjtJQUNyQyxxQkFBcUIsQ0FBd0I7SUFFN0Qsb0JBQW9CO0lBQ0osaUJBQWlCLENBQXdCO0lBQ3pDLHVCQUF1QixDQUF3QjtJQUMvQyxtQkFBbUIsQ0FBd0I7SUFDM0MsNkJBQTZCLENBQXdCO0lBQ3JELHNCQUFzQixDQUF3QjtJQUU5RCxzQkFBc0I7SUFDTixNQUFNLENBQVM7SUFFL0IsWUFDRSxJQUFZLEVBQ1osSUFBd0IsRUFDeEIsSUFBc0M7UUFFdEMsS0FBSyxDQUFDLDRCQUE0QixFQUFFLElBQUksRUFBRSxJQUFJLEVBQUUsSUFBSSxDQUFDLENBQUM7UUFFdEQsTUFBTSxpQkFBaUIsR0FBRyxJQUFJLEVBQUUsaUJBQWlCLElBQUksS0FBSyxDQUFDO1FBQzNELE1BQU0sSUFBSSxHQUFHLElBQUksRUFBRSxJQUFJLElB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QUFZLEVBQUUsSUFBSSxDQUFDLFlBQVk7WUFDL0IsYUFBYSxFQUFFLElBQUksQ0FBQyxhQUFhO1lBQ2pDLHFCQUFxQixFQUFFLElBQUksQ0FBQyxxQkFBcUI7WUFDakQsaUJBQWlCLEVBQUUsSUFBSSxDQUFDLGlCQUFpQjtZQUN6Qyx1QkFBdUIsRUFBRSxJQUFJLENBQUMsdUJBQXVCO1lBQ3JELG1CQUFtQixFQUFFLElBQUksQ0FBQyxtQkFBbUI7WUFDN0MsNkJBQTZCLEVBQUUsSUFBSSxDQUFDLDZCQUE2QjtZQUNqRSxzQkFBc0IsRUFBRSxJQUFJLENBQUMsc0JBQXNCO1lBQ25ELE1BQU0sRUFBRSxJQUFJLENBQUMsTUFBTTtTQUNwQixDQUFDLENBQUM7SUFDTCxDQUFDO0NBQ0Y7QUFwZEQsc0NBb2RDIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0ICogYXMgYXdzIGZyb20gJ0BwdWx1bWkvYXdzJztcbmltcG9ydCAqIGFzIHB1bHVtaSBmcm9tICdAcHVsdW1pL3B1bHVtaSc7XG5pbXBvcnQgeyBLTVNLZXkgfSBmcm9tICcuLi9tb2R1bGVzL2ttcyc7XG5pbXBvcnQgeyBTZWN1cmVTM0J1Y2tldCB9IGZyb20gJy4uL21vZHVsZXMvczMnO1xuaW1wb3J0IHsgRW5oYW5jZWRTZWN1cmVTM0J1Y2tldCB9IGZyb20gJy4uL21vZHVsZXMvczMvZW5oYW5jZWQtczMnO1xuaW1wb3J0IHtcbiAgU2VjdXJlSUFNUm9sZSxcbiAgY3JlYXRlTUZBRW5mb3JjZWRQb2xpY3ksXG4gIGNyZWF0ZVMzQWNjZXNzUG9saWN5LFxufSBmcm9tICcuLi9tb2R1bGVzL2lhbSc7XG5pbXBvcnQgeyBTZWN1cmVDbG91ZFRyYWlsIH0gZnJvbSAnLi4vbW9kdWxlcy9jbG91ZHRyYWlsJztcbmltcG9ydCB7IEVuaGFuY2VkQ2xvdWRUcmFpbCB9IGZyb20gJy4uL21vZHVsZXMvY2xvdWR0cmFpbC9lbmhhbmNlZC1jbG91ZHRyYWlsJztcbmltcG9ydCB7XG4gIFNlY3VyaXR5UG9saWNpZXMsXG4gIGNyZWF0ZVRpbWVCYXNlZFMzQWNjZXNzUG9saWN5LFxuICBjcmVhdGVSZXN0cmljdGVkQXVkaXRQb2xpY3ksXG59IGZyb20gJy4uL21vZHVsZXMvc2VjdXJpdHktcG9saWNpZXMnO1xuaW1wb3J0IHsgY29tbW9uVGFncyB9IGZyb20gJy4uL2NvbmZpZy90YWdzJztcblxuZXhwb3J0IGludGVyZmFjZSBTZWN1cml0eVN0YWNrQXJncyB7XG4gIGVudmlyb25tZW50U3VmZml4Pzogc3RyaW5nO1xuICB0YWdzPzogcHVsdW1pLklucHV0PHsgW2tleTogc3RyaW5nXTogc3RyaW5nIH0+O1xuICBhbGxvd2VkSXBSYW5nZXM/OiBzdHJpbmdbXTtcbiAgZW5hYmxlRW5oYW5jZWRTZWN1cml0eT86IGJvb2xlYW47XG59XG5cbmV4cG9ydCBjbGFzcyBTZWN1cml0eVN0YWNrIGV4dGVuZHMgcHVsdW1pLkNvbXBvbmVudFJlc291cmNlIHtcbiAgLy8gUzMgQnVja2V0c1xuICBwdWJsaWMgcmVhZG9ubHkgcHJpbWFyeUJ1Y2tldE5hbWU6IHB1bHVtaS5PdXRwdXQ8c3RyaW5nPjtcbiAgcHVibGljIHJlYWRvbmx5IHByaW1hcnlCdWNrZXRBcm46IHB1bHVtaS5PdXRwdXQ8c3RyaW5nPjtcbiAgcHVibGljIHJlYWRvbmx5IGF1ZGl0QnVja2V0TmFtZTogcHVsdW1pLk91dHB1dDxzdHJpbmc+O1xuICBwdWJsaWMgcmVhZG9ubHkgYXVkaXRCdWNrZXRBcm46IHB1bHVtaS5PdXRwdXQ8c3RyaW5nPjtcblxuICAvLyBLTVMgS2V5c1xuICBwdWJsaWMgcmVhZG9ubHkgczNLbXNLZXlJZDogcHVsdW1pLk91dHB1dDxzdHJpbmc+O1xuICBwdWJsaWMgcmVhZG9ubHkgczNLbXNLZXlBcm46IHB1bHVtaS5PdXRwdXQ8c3RyaW5nPjtcbiAgcHVibGljIHJlYWRvbmx5IGNsb3VkVHJhaWxLbXNLZXlJZDogcHVsdW1pLk91dHB1dDxzdHJpbmc+O1xuICBwdWJsaWMgcmVhZG9ubHkgY2xvdWRUcmFpbEttc0tleUFybjogcHVsdW1pLk91dHB1dDxzdHJpbmc+O1xuXG4gIC8vIElBTSBSb2xlc1xuICBwdWJsaWMgcmVhZG9ubHkgZGF0YUFjY2Vzc1JvbGVBcm46IHB1bHVtaS5PdXRwdXQ8c3RyaW5nPjtcbiAgcHVibGljIHJlYWRvbmx5IGF1ZGl0Um9sZUFybjogcHVsdW1pLk91dHB1dDxzdHJpbmc+O1xuXG4gIC8vIENsb3VkVHJhaWxcbiAgcHVibGljIHJlYWRvbmx5IGNsb3VkVHJhaWxBcm46IHB1bHVtaS5PdXRwdXQ8c3RyaW5nPjtcbiAgcHVibGljIHJlYWRvbmx5IGNsb3VkVHJhaWxMb2dHcm91cEFybjogcHVsdW1pLk91dHB1dDxzdHJpbmc+O1xuXG4gIC8vIFNlY3VyaXR5IFBvbGljaWVzXG4gIHB1YmxpYyByZWFkb25seSBzZWN1cml0eVBvbGljeUFybjogcHVsdW1pLk91dHB1dDxzdHJpbmc+O1xuICBwdWJsaWMgcmVhZG9ubHkgbWZhRW5mb3JjZW1lbnRQb2xpY3lBcm46IHB1bHVtaS5PdXRwdXQ8c3RyaW5nPjtcbiAgcHVibGljIHJlYWRvbmx5IHMzU2VjdXJpdHlQb2xpY3lBcm46IHB1bHVtaS5PdXRwdXQ8c3RyaW5nPjtcbiAgcHVibGljIHJlYWRvbmx5IGNsb3VkVHJhaWxQcm90ZWN0aW9uUG9saWN5QXJuOiBwdWx1bWkuT3V0cHV0PHN0cmluZz47XG4gIHB1YmxpYyByZWFkb25seSBrbXNQcm90ZWN0aW9uUG9saWN5QXJuOiBwdWx1bWkuT3V0cHV0PHN0cmluZz47XG5cbiAgLy8gUmVnaW9uIGNvbmZpcm1hdGlvblxuICBwdWJsaWMgcmVhZG9ubHkgcmVnaW9uOiBzdHJpbmc7XG5cbiAgY29uc3RydWN0b3IoXG4gICAgbmFtZTogc3RyaW5nLFxuICAgIGFyZ3M/OiBTZWN1cml0eVN0YWNrQXJncyxcbiAgICBvcHRzPzogcHVsdW1pLkNvbXBvbmVudFJlc291cmNlT3B0aW9uc1xuICApIHtcbiAgICBzdXBlcigndGFwOnNlY3VyaXR5OlNlY3VyaXR5U3RhY2snLCBuYW1lLCBhcmdzLCBvcHRzKTtcblxuICAgIGNvbnN0IGVudmlyb25tZW50U3VmZml4ID0gYXJncz8uZW52aXJvbm1lbnRTdWZmaXggfHwgJ2Rldic7XG4gICAgY29uc3QgdGFncyA9IGFyZ3M/LnRhZ3MgfHwge307XG4gICAgY29uc3QgYWxsb3dlZElwUmFuZ2VzID0gYXJncz8uYWxsb3dlZElwUmFuZ2VzIHx8IFsnMjAzLjAuMTEzLjAvMjQnXTtcbiAgICBjb25zdCBlbmFibGVFbmhhbmNlZFNlY3VyaXR5ID0gYXJncz8uZW5hYmxlRW5oYW5jZWRTZWN1cml0eSA/PyB0cnVlO1xuXG4gICAgLy8gQ29uZmlndXJlIEFXUyBwcm92aWRlciBmb3IgdXMtZWFzdC0xXG4gICAgY29uc3QgcHJvdmlkZXIgPSBuZXcgYXdzLlByb3ZpZGVyKFxuICAgICAgJ2F3cy1wcm92aWRlcicsXG4gICAgICB7XG4gICAgICAgIHJlZ2lvbjogJ3VzLWVhc3QtMScsXG4gICAgICB9LFxuICAgICAgeyBwYXJlbnQ6IHRoaXMgfVxuICAgICk7XG5cbiAgICAvLyBHZXQgYWNjb3VudCBJRCBmb3IgSUFNIHJvbGUgcG9saWNpZXNcbiAgICBjb25zdCBhY2NvdW50SWQgPSBhd3MuZ2V0Q2FsbGVySWRlbnRpdHkoKS50aGVuKGlkID0+IGlkLmFjY291bnRJZCk7XG5cbiAgICAvLyBDcmVhdGUgZW5oYW5jZWQgc2VjdXJpdHkgcG9saWNpZXNcbiAgICBjb25zdCBzZWN1cml0eVBvbGljaWVzID0gbmV3IFNlY3VyaXR5UG9saWNpZXMoXG4gICAgICBgdGFwLXNlY3VyaXR5LXBvbGljaWVzLSR7ZW52aXJvbm1lbnRTdWZmaXh9YCxcbiAgICAgIHtcbiAgICAgICAgZW52aXJvbm1lbnRTdWZmaXgsXG4gICAgICAgIHRhZ3M6IGNvbW1vblRhZ3MsXG4gICAgICB9LFxuICAgICAgeyBwYXJlbnQ6IHRoaXMsIHByb3ZpZGVyIH1cbiAgICApO1xuXG4gICAgLy8gQ3JlYXRlIEtNUyBrZXlzIGZvciBlbmNyeXB0aW9uXG4gICAgY29uc3QgczNLbXNLZXkgPSBuZXcgS01TS2V5KFxuICAgICAgYHMzLWVuY3J5cHRpb24tJHtlbnZpcm9ubWVudFN1ZmZpeH1gLFxuICAgICAge1xuICAgICAgICBkZXNjcmlwdGlvbjogYEtNUyBrZXkgZm9yIFMzIGJ1Y2tldCBlbmNyeXB0aW9uIC0gJHtlbnZpcm9ubWVudFN1ZmZpeH0gZW52aXJvbm1lbnRgLFxuICAgICAgICB0YWdzOiB7XG4gICAgICAgICAgUHVycG9zZTogJ1MzIEVuY3J5cHRpb24nLFxuICAgICAgICAgIEVudmlyb25tZW50OiBlbnZpcm9ubWVudFN1ZmZpeCxcbiAgICAgICAgfSxcbiAgICAgIH0sXG4gICAgICB7IHBhcmVudDogdGhpcywgcHJvdmlkZXIgfVxuICAgICk7XG5cbiAgICBjb25zdCBjbG91ZFRyYWlsS21zS2V5ID0gbmV3IEtNU0tleShcbiAgICAgIGBjbG91ZHRyYWlsLWVuY3J5cHRpb24tJHtlbnZpcm9ubWVudFN1ZmZpeH1gLFxuICAgICAge1xuICAgICAgICBkZXNjcmlwdGlvbjogYEtNUyBrZXkgZm9yIENsb3VkVHJhaWwgbG9nIGVuY3J5cHRpb24gLSAke2Vudmlyb25tZW50U3VmZml4fSBlbnZpcm9ubWVudGAsXG4gICAgICAgIHRhZ3M6IHtcbiAgICAgICAgICBQdXJwb3NlOiAnQ2xvdWRUcmFpbCBFbmNyeXB0aW9uJyxcbiAgICAgICAgICBFbnZpcm9ubWVudDogZW52aXJvbm1lbnRTdWZmaXgsXG4gICAgICAgIH0sXG4gICAgICB9LFxuICAgICAgeyBwYXJlbnQ6IHRoaXMsIHByb3ZpZGVyIH1cbiAgICApO1xuXG4gICAgLy8gQ3JlYXRlIHNlY3VyZSBTMyBidWNrZXRzIHdpdGggZW5oYW5jZWQgc2VjdXJpdHlcbiAgICBsZXQgcHJpbWFyeUJ1Y2tldDogU2VjdXJlUzNCdWNrZXQgfCBFbmhhbmNlZFNlY3VyZVMzQnVja2V0O1xuICAgIGxldCBhdWRpdEJ1Y2tldDogU2VjdXJlUzNCdWNrZXQgfCBFbmhhbmNlZFNlY3VyZVMzQnVja2V0O1xuXG4gICAgaWYgKGVuYWJsZUVuaGFuY2VkU2VjdXJpdHkpIHtcbiAgICAgIHByaW1hcnlCdWNrZXQgPSBuZXcgRW5oYW5jZWRTZWN1cmVTM0J1Y2tldChcbiAgICAgICAgYHRhcC1wcmltYXJ5LXN0b3JhZ2UtJHtlbnZpcm9ubWVudFN1ZmZpeH1gLFxuICAgICAgICB7XG4gICAgICAgICAgYnVja2V0TmFtZTogYHRhcC1wcmltYXJ5LXN0b3JhZ2UtJHtlbnZpcm9ubWVudFN1ZmZpeH1gLFxuICAgICAgICAgIGttc0tleUlkOiBzM0ttc0tleS5rZXkua2V5SWQsXG4gICAgICAgICAgYWxsb3dlZElwUmFuZ2VzLFxuICAgICAgICAgIGVuYWJsZUFjY2Vzc0xvZ2dpbmc6IHRydWUsXG4gICAgICAgICAgZW5hYmxlTm90aWZpY2F0aW9uczogdHJ1ZSxcbiAgICAgICAgICBlbmFibGVPYmplY3RMb2NrOiB0cnVlLFxuICAgICAgICAgIGxpZmVjeWNsZVJ1bGVzOiBbXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgIGlkOiAndHJhbnNpdGlvbi10by1pYScsXG4gICAgICAgICAgICAgIHN0YXR1czogJ0VuYWJsZWQnLFxuICAgICAgICAgICAgICB0cmFuc2l0aW9uczogW1xuICAgICAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICAgIGRheXM6IDMwLFxuICAgICAgICAgICAgICAgICAgc3RvcmFnZUNsYXNzOiAnU1RBTkRBUkRfSUEnLFxuICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgICAgZGF5czogOTAsXG4gICAgICAgICAgICAgICAgICBzdG9yYWdlQ2xhc3M6ICdHTEFDSUVSJyxcbiAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICAgIGRheXM6IDM2NSxcbiAgICAgICAgICAgICAgICAgIHN0b3JhZ2VDbGFzczogJ0RFRVBfQVJDSElWRScsXG4gICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgXSxcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgXSxcbiAgICAgICAgICB0YWdzOiB7XG4gICAgICAgICAgICBQdXJwb3NlOiAnUHJpbWFyeSBkYXRhIHN0b3JhZ2Ugd2l0aCBlbmhhbmNlZCBzZWN1cml0eScsXG4gICAgICAgICAgICBFbnZpcm9ubWVudDogZW52aXJvbm1lbnRTdWZmaXgsXG4gICAgICAgICAgfSxcbiAgICAgICAgfSxcbiAgICAgICAgeyBwYXJlbnQ6IHRoaXMsIHByb3ZpZGVyIH1cbiAgICAgICk7XG5cbiAgICAgIGF1ZGl0QnVja2V0ID0gbmV3IEVuaGFuY2VkU2VjdXJlUzNCdWNrZXQoXG4gICAgICAgIGB0YXAtYXVkaXQtbG9ncy0ke2Vudmlyb25tZW50U3VmZml4fWAsXG4gICAgICAgIHtcbiAgICAgICAgICBidWNrZXROYW1lOiBgdGFwLWF1ZGl0LWxvZ3MtJHtlbnZpcm9ubWVudFN1ZmZpeH1gLFxuICAgICAgICAgIGttc0tleUlkOiBjbG91ZFRyYWlsS21zS2V5LmtleS5rZXlJZCxcbiAgICAgICAgICBhbGxvd2VkSXBSYW5nZXMsXG4gICAgICAgICAgZW5hYmxlQWNjZXNzTG9nZ2luZzogdHJ1ZSxcbiAgICAgICAgICBlbmFibGVPYmplY3RMb2NrOiB0cnVlLFxuICAgICAgICAgIHRhZ3M6IHtcbiAgICAgICAgICAgIFB1cnBvc2U6ICdBdWRpdCBhbmQgY29tcGxpYW5jZSBsb2dzIHdpdGggZW5oYW5jZWQgc2VjdXJpdHknLFxuICAgICAgICAgICAgRW52aXJvbm1lbnQ6IGVudmlyb25tZW50U3VmZml4LFxuICAgICAgICAgIH0sXG4gICAgICAgIH0sXG4gICAgICAgIHsgcGFyZW50OiB0aGlzLCBwcm92aWRlciB9XG4gICAgICApO1xuICAgIH0gZWxzZSB7XG4gICAgICBwcmltYXJ5QnVja2V0ID0gbmV3IFNlY3VyZVMzQnVja2V0KFxuICAgICAgICBgdGFwLXByaW1hcnktc3RvcmFnZS0ke2Vudmlyb25tZW50U3VmZml4fWAsXG4gICAgICAgIHtcbiAgICAgICAgICBidWNrZXROYW1lOiBgdGFwLXByaW1hcnktc3RvcmFnZS0ke2Vudmlyb25tZW50U3VmZml4fWAsXG4gICAgICAgICAga21zS2V5SWQ6IHMzS21zS2V5LmtleS5rZXlJZCxcbiAgICAgICAgICBsaWZlY3ljbGVSdWxlczogW1xuICAgICAgICAgICAge1xuICAgICAgICAgICAgICBpZDogJ3RyYW5zaXRpb24tdG8taWEnLFxuICAgICAgICAgICAgICBzdGF0dXM6ICdFbmFibGVkJyxcbiAgICAgICAgICAgICAgdHJhbnNpdGlvbnM6IFtcbiAgICAgICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgICBkYXlzOiAzMCxcbiAgICAgICAgICAgICAgICAgIHN0b3JhZ2VDbGFzczogJ1NUQU5EQVJEX0lBJyxcbiAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICAgIGRheXM6IDkwLFxuICAgICAgICAgICAgICAgICAgc3RvcmFnZUNsYXNzOiAnR0xBQ0lFUicsXG4gICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgICBkYXlzOiAzNjUsXG4gICAgICAgICAgICAgICAgICBzdG9yYWdlQ2xhc3M6ICdERUVQX0FSQ0hJVkUnLFxuICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgIF0sXG4gICAgICAgICAgICB9LFxuICAgICAgICAgIF0sXG4gICAgICAgICAgdGFnczoge1xuICAgICAgICAgICAgUHVycG9zZTogJ1ByaW1hcnkgZGF0YSBzdG9yYWdlJyxcbiAgICAgICAgICAgIEVudmlyb25tZW50OiBlbnZpcm9ubWVudFN1ZmZpeCxcbiAgICAgICAgICB9LFxuICAgICAgICB9LFxuICAgICAgICB7IHBhcmVudDogdGhpcywgcHJvdmlkZXIgfVxuICAgICAgKTtcblxuICAgICAgYXVkaXRCdWNrZXQgPSBuZXcgU2VjdXJlUzNCdWNrZXQoXG4gICAgICAgIGB0YXAtYXVkaXQtbG9ncy0ke2Vudmlyb25tZW50U3VmZml4fWAsXG4gICAgICAgIHtcbiAgICAgICAgICBidWNrZXROYW1lOiBgdGFwLWF1ZGl0LWxvZ3MtJHtlbnZpcm9ubWVudFN1ZmZpeH1gLFxuICAgICAgICAgIGttc0tleUlkOiBjbG91ZFRyYWlsS21zS2V5LmtleS5rZXlJZCxcbiAgICAgICAgICB0YWdzOiB7XG4gICAgICAgICAgICBQdXJwb3NlOiAnQXVkaXQgYW5kIGNvbXBsaWFuY2UgbG9ncycsXG4gICAgICAgICAgICBFbnZpcm9ubWVudDogZW52aXJvbm1lbnRTdWZmaXgsXG4gICAgICAgICAgfSxcbiAgICAgICAgfSxcbiAgICAgICAgeyBwYXJlbnQ6IHRoaXMsIHByb3ZpZGVyIH1cbiAgICAgICk7XG4gICAgfVxuXG4gICAgLy8gQ3JlYXRlIElBTSByb2xlcyB3aXRoIGVuaGFuY2VkIGxlYXN0IHByaXZpbGVnZSBhbmQgTUZBIGVuZm9yY2VtZW50XG4gICAgY29uc3QgZGF0YUFjY2Vzc1JvbGUgPSBuZXcgU2VjdXJlSUFNUm9sZShcbiAgICAgIGB0YXAtZGF0YS1hY2Nlc3MtJHtlbnZpcm9ubWVudFN1ZmZpeH1gLFxuICAgICAge1xuICAgICAgICBhc3N1bWVSb2xlUG9saWN5OiBwdWx1bWkuYWxsKFthY2NvdW50SWRdKS5hcHBseSgoW2FjY291bnRJZF0pID0+XG4gICAgICAgICAgSlNPTi5zdHJpbmdpZnkoe1xuICAgICAgICAgICAgVmVyc2lvbjogJzIwMTItMTAtMTcnLFxuICAgICAgICAgICAgU3RhdGVtZW50OiBbXG4gICAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICBBY3Rpb246ICdzdHM6QXNzdW1lUm9sZScsXG4gICAgICAgICAgICAgICAgRWZmZWN0OiAnQWxsb3cnLFxuICAgICAgICAgICAgICAgIFByaW5jaXBhbDoge1xuICAgICAgICAgICAgICAgICAgQVdTOiBgYXJuOmF3czppYW06OiR7YWNjb3VudElkfTpyb290YCxcbiAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgIENvbmRpdGlvbjoge1xuICAgICAgICAgICAgICAgICAgQm9vbDoge1xuICAgICAgICAgICAgICAgICAgICAnYXdzOk11bHRpRmFjdG9yQXV0aFByZXNlbnQnOiAndHJ1ZScsXG4gICAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgICAgU3RyaW5nRXF1YWxzOiB7XG4gICAgICAgICAgICAgICAgICAgICdhd3M6UmVxdWVzdGVkUmVnaW9uJzogJ3VzLWVhc3QtMScsXG4gICAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgICAgSXBBZGRyZXNzOiB7XG4gICAgICAgICAgICAgICAgICAgICdhd3M6U291cmNlSXAnOiBhbGxvd2VkSXBSYW5nZXMsXG4gICAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBdLFxuICAgICAgICAgIH0pXG4gICAgICAgICksXG4gICAgICAgIHJvbGVOYW1lOiBgdGFwLWRhdGEtYWNjZXNzLXJvbGUtJHtlbnZpcm9ubWVudFN1ZmZpeH1gLFxuICAgICAgICBwb2xpY2llczogZW5hYmxlRW5oYW5jZWRTZWN1cml0eVxuICAgICAgICAgID8gW1xuICAgICAgICAgICAgICBjcmVhdGVUaW1lQmFzZWRTM0FjY2Vzc1BvbGljeShwcmltYXJ5QnVja2V0LmJ1Y2tldC5hcm4pLFxuICAgICAgICAgICAgICBjcmVhdGVNRkFFbmZvcmNlZFBvbGljeSgpLFxuICAgICAgICAgICAgXVxuICAgICAgICAgIDogW1xuICAgICAgICAgICAgICBjcmVhdGVTM0FjY2Vzc1BvbGljeShwcmltYXJ5QnVja2V0LmJ1Y2tldC5hcm4pLFxuICAgICAgICAgICAgICBjcmVhdGVNRkFFbmZvcmNlZFBvbGljeSgpLFxuICAgICAgICAgICAgXSxcbiAgICAgICAgbWFuYWdlZFBvbGljeUFybnM6IFtdLFxuICAgICAgICByZXF1aXJlTUZBOiB0cnVlLFxuICAgICAgICB0YWdzOiB7XG4gICAgICAgICAgUHVycG9zZTpcbiAgICAgICAgICAgICdEYXRhIGFjY2VzcyB3aXRoIGVuaGFuY2VkIE1GQSBlbmZvcmNlbWVudCBhbmQgdGltZSByZXN0cmljdGlvbnMnLFxuICAgICAgICAgIEVudmlyb25tZW50OiBlbnZpcm9ubWVudFN1ZmZpeCxcbiAgICAgICAgfSxcbiAgICAgIH0sXG4gICAgICB7IHBhcmVudDogdGhpcywgcHJvdmlkZXIgfVxuICAgICk7XG5cbiAgICBjb25zdCBhdWRpdFJvbGUgPSBuZXcgU2VjdXJlSUFNUm9sZShcbiAgICAgIGB0YXAtYXVkaXQtYWNjZXNzLSR7ZW52aXJvbm1lbnRTdWZmaXh9YCxcbiAgICAgIHtcbiAgICAgICAgYXNzdW1lUm9sZVBvbGljeTogcHVsdW1pLmFsbChbYWNjb3VudElkXSkuYXBwbHkoKFthY2NvdW50SWRdKSA9PlxuICAgICAgICAgIEpTT04uc3RyaW5naWZ5KHtcbiAgICAgICAgICAgIFZlcnNpb246ICcyMDEyLTEwLTE3JyxcbiAgICAgICAgICAgIFN0YXRlbWVudDogW1xuICAgICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgQWN0aW9uOiAnc3RzOkFzc3VtZVJvbGUnLFxuICAgICAgICAgICAgICAgIEVmZmVjdDogJ0FsbG93JyxcbiAgICAgICAgICAgICAgICBQcmluY2lwYWw6IHtcbiAgICAgICAgICAgICAgICAgIEFXUzogYGFybjphd3M6aWFtOjoke2FjY291bnRJZH06cm9vdGAsXG4gICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICBDb25kaXRpb246IHtcbiAgICAgICAgICAgICAgICAgIEJvb2w6IHtcbiAgICAgICAgICAgICAgICAgICAgJ2F3czpNdWx0aUZhY3RvckF1dGhQcmVzZW50JzogJ3RydWUnLFxuICAgICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICAgIFN0cmluZ0VxdWFsczoge1xuICAgICAgICAgICAgICAgICAgICAnYXdzOlJlcXVlc3RlZFJlZ2lvbic6ICd1cy1lYXN0LTEnLFxuICAgICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICAgIElwQWRkcmVzczoge1xuICAgICAgICAgICAgICAgICAgICAnYXdzOlNvdXJjZUlwJzogYWxsb3dlZElwUmFuZ2VzLFxuICAgICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgXSxcbiAgICAgICAgICB9KVxuICAgICAgICApLFxuICAgICAgICByb2xlTmFtZTogYHRhcC1hdWRpdC1hY2Nlc3Mtcm9sZS0ke2Vudmlyb25tZW50U3VmZml4fWAsXG4gICAgICAgIHBvbGljaWVzOiBlbmFibGVFbmhhbmNlZFNlY3VyaXR5XG4gICAgICAgICAgPyBbXG4gICAgICAgICAgICAgIGNyZWF0ZVJlc3RyaWN0ZWRBdWRpdFBvbGljeShcbiAgICAgICAgICAgICAgICBhdWRpdEJ1Y2tldC5idWNrZXQuYXJuLFxuICAgICAgICAgICAgICAgIGFsbG93ZWRJcFJhbmdlc1xuICAgICAgICAgICAgICApLFxuICAgICAgICAgICAgXVxuICAgICAgICAgIDogW1xuICAgICAgICAgICAgICBwdWx1bWkuaW50ZXJwb2xhdGVge1xuICAgICAgICAgIFwiVmVyc2lvblwiOiBcIjIwMTItMTAtMTdcIixcbiAgICAgICAgICBcIlN0YXRlbWVudFwiOiBbXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgIFwiRWZmZWN0XCI6IFwiQWxsb3dcIixcbiAgICAgICAgICAgICAgXCJBY3Rpb25cIjogW1xuICAgICAgICAgICAgICAgIFwiczM6R2V0T2JqZWN0XCIsXG4gICAgICAgICAgICAgICAgXCJzMzpMaXN0QnVja2V0XCJcbiAgICAgICAgICAgICAgXSxcbiAgICAgICAgICAgICAgXCJSZXNvdXJjZVwiOiBbXG4gICAgICAgICAgICAgICAgXCIke2F1ZGl0QnVja2V0LmJ1Y2tldC5hcm59XCIsXG4gICAgICAgICAgICAgICAgXCIke2F1ZGl0QnVja2V0LmJ1Y2tldC5hcm59LypcIlxuICAgICAgICAgICAgICBdXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAge1xuICAgICAgICAgICAgICBcIkVmZmVjdFwiOiBcIkFsbG93XCIsXG4gICAgICAgICAgICAgIFwiQWN0aW9uXCI6IFtcbiAgICAgICAgICAgICAgICBcImNsb3VkdHJhaWw6TG9va3VwRXZlbnRzXCIsXG4gICAgICAgICAgICAgICAgXCJjbG91ZHRyYWlsOkdldFRyYWlsU3RhdHVzXCJcbiAgICAgICAgICAgICAgXSxcbiAgICAgICAgICAgICAgXCJSZXNvdXJjZVwiOiBcIipcIlxuICAgICAgICAgICAgfVxuICAgICAgICAgIF1cbiAgICAgICAgfWAsXG4gICAgICAgICAgICBdLFxuICAgICAgICBtYW5hZ2VkUG9saWN5QXJuczogWydhcm46YXdzOmlhbTo6YXdzOnBvbGljeS9SZWFkT25seUFjY2VzcyddLFxuICAgICAgICByZXF1aXJlTUZBOiB0cnVlLFxuICAgICAgICB0YWdzOiB7XG4gICAgICAgICAgUHVycG9zZTogJ0F1ZGl0IGxvZyBhY2Nlc3Mgd2l0aCBJUCBhbmQgdGltZSByZXN0cmljdGlvbnMnLFxuICAgICAgICAgIEVudmlyb25tZW50OiBlbnZpcm9ubWVudFN1ZmZpeCxcbiAgICAgICAgfSxcbiAgICAgIH0sXG4gICAgICB7IHBhcmVudDogdGhpcywgcHJvdmlkZXIgfVxuICAgICk7XG5cbiAgICAvLyBDcmVhdGUgQ2xvdWRUcmFpbCBmb3IgY29tcHJlaGVuc2l2ZSBsb2dnaW5nXG4gICAgbGV0IGNsb3VkVHJhaWw6IFNlY3VyZUNsb3VkVHJhaWwgfCBFbmhhbmNlZENsb3VkVHJhaWw7XG5cbiAgICBpZiAoZW5hYmxlRW5oYW5jZWRTZWN1cml0eSkge1xuICAgICAgY2xvdWRUcmFpbCA9IG5ldyBFbmhhbmNlZENsb3VkVHJhaWwoXG4gICAgICAgIGB0YXAtc2VjdXJpdHktYXVkaXQtJHtlbnZpcm9ubWVudFN1ZmZpeH1gLFxuICAgICAgICB7XG4gICAgICAgICAgdHJhaWxOYW1lOiBgdGFwLXNlY3VyaXR5LWF1ZGl0LXRyYWlsLSR7ZW52aXJvbm1lbnRTdWZmaXh9YCxcbiAgICAgICAgICBzM0J1Y2tldE5hbWU6IGF1ZGl0QnVja2V0LmJ1Y2tldC5pZCxcbiAgICAgICAgICBrbXNLZXlJZDogY2xvdWRUcmFpbEttc0tleS5rZXkua2V5SWQsXG4gICAgICAgICAgaW5jbHVkZUdsb2JhbFNlcnZpY2VFdmVudHM6IHRydWUsXG4gICAgICAgICAgaXNNdWx0aVJlZ2lvblRyYWlsOiB0cnVlLFxuICAgICAgICAgIGVuYWJsZUxvZ0ZpbGVWYWxpZGF0aW9uOiB0cnVlLFxuICAgICAgICAgIGVuYWJsZUluc2lnaHRTZWxlY3RvcnM6IHRydWUsXG4gICAgICAgICAgdGFnczoge1xuICAgICAgICAgICAgUHVycG9zZTpcbiAgICAgICAgICAgICAgJ0VuaGFuY2VkIHNlY3VyaXR5IGF1ZGl0IGFuZCBjb21wbGlhbmNlIHdpdGggYW5vbWFseSBkZXRlY3Rpb24nLFxuICAgICAgICAgICAgRW52aXJvbm1lbnQ6IGVudmlyb25tZW50U3VmZml4LFxuICAgICAgICAgIH0sXG4gICAgICAgIH0sXG4gICAgICAgIHsgcGFyZW50OiB0aGlzLCBwcm92aWRlciB9XG4gICAgICApO1xuICAgIH0gZWxzZSB7XG4gICAgICBjbG91ZFRyYWlsID0gbmV3IFNlY3VyZUNsb3VkVHJhaWwoXG4gICAgICAgIGB0YXAtc2VjdXJpdHktYXVkaXQtJHtlbnZpcm9ubWVudFN1ZmZpeH1gLFxuICAgICAgICB7XG4gICAgICAgICAgdHJhaWxOYW1lOiBgdGFwLXNlY3VyaXR5LWF1ZGl0LXRyYWlsLSR7ZW52aXJvbm1lbnRTdWZmaXh9YCxcbiAgICAgICAgICBzM0J1Y2tldE5hbWU6IGF1ZGl0QnVja2V0LmJ1Y2tldC5pZCxcbiAgICAgICAgICBrbXNLZXlJZDogY2xvdWRUcmFpbEttc0tleS5rZXkua2V5SWQsXG4gICAgICAgICAgaW5jbHVkZUdsb2JhbFNlcnZpY2VFdmVudHM6IHRydWUsXG4gICAgICAgICAgaXNNdWx0aVJlZ2lvblRyYWlsOiB0cnVlLFxuICAgICAgICAgIGVuYWJsZUxvZ0ZpbGVWYWxpZGF0aW9uOiB0cnVlLFxuICAgICAgICAgIHRhZ3M6IHtcbiAgICAgICAgICAgIFB1cnBvc2U6ICdTZWN1cml0eSBhdWRpdCBhbmQgY29tcGxpYW5jZScsXG4gICAgICAgICAgICBFbnZpcm9ubWVudDogZW52aXJvbm1lbnRTdWZmaXgsXG4gICAgICAgICAgfSxcbiAgICAgICAgfSxcbiAgICAgICAgeyBwYXJlbnQ6IHRoaXMsIHByb3ZpZGVyIH1cbiAgICAgICk7XG4gICAgfVxuXG4gICAgLy8gQ3JlYXRlIGFkZGl0aW9uYWwgc2VjdXJpdHkgcG9saWNpZXMgd2l0aCBlbmhhbmNlZCBjb250cm9sc1xuICAgIGNvbnN0IHNlY3VyaXR5UG9saWN5ID0gbmV3IGF3cy5pYW0uUG9saWN5KFxuICAgICAgYHRhcC1zZWN1cml0eS1iYXNlbGluZS0ke2Vudmlyb25tZW50U3VmZml4fWAsXG4gICAgICB7XG4gICAgICAgIG5hbWU6IGBTZWN1cml0eUJhc2VsaW5lLSR7ZW52aXJvbm1lbnRTdWZmaXh9YCxcbiAgICAgICAgZGVzY3JpcHRpb246XG4gICAgICAgICAgJ0VuaGFuY2VkIGJhc2VsaW5lIHNlY3VyaXR5IHBvbGljeSB3aXRoIGNvbXByZWhlbnNpdmUgTUZBIHJlcXVpcmVtZW50cycsXG4gICAgICAgIHBvbGljeTogSlNPTi5zdHJpbmdpZnkoe1xuICAgICAgICAgIFZlcnNpb246ICcyMDEyLTEwLTE3JyxcbiAgICAgICAgICBTdGF0ZW1lbnQ6IFtcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgU2lkOiAnUmVxdWlyZU1GQUZvckFsbFNlbnNpdGl2ZUFjdGlvbnMnLFxuICAgICAgICAgICAgICBFZmZlY3Q6ICdEZW55JyxcbiAgICAgICAgICAgICAgQWN0aW9uOiBbXG4gICAgICAgICAgICAgICAgJ2lhbTpDcmVhdGVSb2xlJyxcbiAgICAgICAgICAgICAgICAnaWFtOkRlbGV0ZVJvbGUnLFxuICAgICAgICAgICAgICAgICdpYW06QXR0YWNoUm9sZVBvbGljeScsXG4gICAgICAgICAgICAgICAgJ2lhbTpEZXRhY2hSb2xlUG9saWN5JyxcbiAgICAgICAgICAgICAgICAnaWFtOlB1dFJvbGVQb2xpY3knLFxuICAgICAgICAgICAgICAgICdpYW06RGVsZXRlUm9sZVBvbGljeScsXG4gICAgICAgICAgICAgICAgJ3MzOkRlbGV0ZUJ1Y2tldCcsXG4gICAgICAgICAgICAgICAgJ3MzOlB1dEJ1Y2tldFBvbGljeScsXG4gICAgICAgICAgICAgICAgJ2ttczpTY2hlZHVsZUtleURlbGV0aW9uJyxcbiAgICAgICAgICAgICAgICAna21zOkRpc2FibGVLZXknLFxuICAgICAgICAgICAgICAgICdjbG91ZHRyYWlsOkRlbGV0ZVRyYWlsJyxcbiAgICAgICAgICAgICAgICAnY2xvdWR0cmFpbDpTdG9wTG9nZ2luZycsXG4gICAgICAgICAgICAgIF0sXG4gICAgICAgICAgICAgIFJlc291cmNlOiAnKicsXG4gICAgICAgICAgICAgIENvbmRpdGlvbjoge1xuICAgICAgICAgICAgICAgIEJvb2xJZkV4aXN0czoge1xuICAgICAgICAgICAgICAgICAgJ2F3czpNdWx0aUZhY3RvckF1dGhQcmVzZW50JzogJ2ZhbHNlJyxcbiAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgU2lkOiAnUmVzdHJpY3RUb1VTRWFzdDFPbmx5JyxcbiAgICAgICAgICAgICAgRWZmZWN0OiAnRGVueScsXG4gICAgICAgICAgICAgIEFjdGlvbjogJyonLFxuICAgICAgICAgICAgICBSZXNvdXJjZTogJyonLFxuICAgICAgICAgICAgICBDb25kaXRpb246IHtcbiAgICAgICAgICAgICAgICBTdHJpbmdOb3RFcXVhbHM6IHtcbiAgICAgICAgICAgICAgICAgICdhd3M6UmVxdWVzdGVkUmVnaW9uJzogJ3VzLWVhc3QtMScsXG4gICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgIFNpZDogJ1JlcXVpcmVFbmNyeXB0ZWRTdG9yYWdlJyxcbiAgICAgICAgICAgICAgRWZmZWN0OiAnRGVueScsXG4gICAgICAgICAgICAgIEFjdGlvbjogW1xuICAgICAgICAgICAgICAgICdzMzpQdXRPYmplY3QnLFxuICAgICAgICAgICAgICAgICdlYnM6Q3JlYXRlVm9sdW1lJyxcbiAgICAgICAgICAgICAgICAncmRzOkNyZWF0ZURCSW5zdGFuY2UnLFxuICAgICAgICAgICAgICBdLFxuICAgICAgICAgICAgICBSZXNvdXJjZTogJyonLFxuICAgICAgICAgICAgICBDb25kaXRpb246IHtcbiAgICAgICAgICAgICAgICBCb29sOiB7XG4gICAgICAgICAgICAgICAgICAnYXdzOlNlY3VyZVRyYW5zcG9ydCc6ICdmYWxzZScsXG4gICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgXSxcbiAgICAgICAgfSksXG4gICAgICAgIHRhZ3M6IHsgLi4uY29tbW9uVGFncywgLi4udGFncyB9LFxuICAgICAgfSxcbiAgICAgIHsgcGFyZW50OiB0aGlzLCBwcm92aWRlciB9XG4gICAgKTtcblxuICAgIC8vIEFzc2lnbiBvdXRwdXRzXG4gICAgdGhpcy5wcmltYXJ5QnVja2V0TmFtZSA9IHByaW1hcnlCdWNrZXQuYnVja2V0LmlkO1xuICAgIHRoaXMucHJpbWFyeUJ1Y2tldEFybiA9IHByaW1hcnlCdWNrZXQuYnVja2V0LmFybjtcbiAgICB0aGlzLmF1ZGl0QnVja2V0TmFtZSA9IGF1ZGl0QnVja2V0LmJ1Y2tldC5pZDtcbiAgICB0aGlzLmF1ZGl0QnVja2V0QXJuID0gYXVkaXRCdWNrZXQuYnVja2V0LmFybjtcbiAgICB0aGlzLnMzS21zS2V5SWQgPSBzM0ttc0tleS5rZXkua2V5SWQ7XG4gICAgdGhpcy5zM0ttc0tleUFybiA9IHMzS21zS2V5LmtleS5hcm47XG4gICAgdGhpcy5jbG91ZFRyYWlsS21zS2V5SWQgPSBjbG91ZFRyYWlsS21zS2V5LmtleS5rZXlJZDtcbiAgICB0aGlzLmNsb3VkVHJhaWxLbXNLZXlBcm4gPSBjbG91ZFRyYWlsS21zS2V5LmtleS5hcm47XG4gICAgdGhpcy5kYXRhQWNjZXNzUm9sZUFybiA9IGRhdGFBY2Nlc3NSb2xlLnJvbGUuYXJuO1xuICAgIHRoaXMuYXVkaXRSb2xlQXJuID0gYXVkaXRSb2xlLnJvbGUuYXJuO1xuICAgIHRoaXMuY2xvdWRUcmFpbEFybiA9IGNsb3VkVHJhaWwudHJhaWwuYXJuO1xuICAgIHRoaXMuY2xvdWRUcmFpbExvZ0dyb3VwQXJuID0gY2xvdWRUcmFpbC5sb2dHcm91cC5hcm47XG4gICAgdGhpcy5zZWN1cml0eVBvbGljeUFybiA9IHNlY3VyaXR5UG9saWN5LmFybjtcbiAgICB0aGlzLm1mYUVuZm9yY2VtZW50UG9saWN5QXJuID0gc2VjdXJpdHlQb2xpY2llcy5tZmFFbmZvcmNlbWVudFBvbGljeS5hcm47XG4gICAgdGhpcy5zM1NlY3VyaXR5UG9saWN5QXJuID0gc2VjdXJpdHlQb2xpY2llcy5zM0RlbnlJbnNlY3VyZVBvbGljeS5hcm47XG4gICAgdGhpcy5jbG91ZFRyYWlsUHJvdGVjdGlvblBvbGljeUFybiA9XG4gICAgICBzZWN1cml0eVBvbGljaWVzLmNsb3VkVHJhaWxQcm90ZWN0aW9uUG9saWN5LmFybjtcbiAgICB0aGlzLmttc1Byb3RlY3Rpb25Qb2xpY3lBcm4gPSBzZWN1cml0eVBvbGljaWVzLmttc0tleVByb3RlY3Rpb25Qb2xpY3kuYXJuO1xuICAgIHRoaXMucmVnaW9uID0gJ3VzLWVhc3QtMSc7XG5cbiAgICAvLyBSZWdpc3RlciB0aGUgb3V0cHV0cyBvZiB0aGlzIGNvbXBvbmVudFxuICAgIHRoaXMucmVnaXN0ZXJPdXRwdXRzKHtcbiAgICAgIHByaW1hcnlCdWNrZXROYW1lOiB0aGlzLnByaW1hcnlCdWNrZXROYW1lLFxuICAgICAgcHJpbWFyeUJ1Y2tldEFybjogdGhpcy5wcmltYXJ5QnVja2V0QXJuLFxuICAgICAgYXVkaXRCdWNrZXROYW1lOiB0aGlzLmF1ZGl0QnVja2V0TmFtZSxcbiAgICAgIGF1ZGl0QnVja2V0QXJuOiB0aGlzLmF1ZGl0QnVja2V0QXJuLFxuICAgICAgczNLbXNLZXlJZDogdGhpcy5zM0ttc0tleUlkLFxuICAgICAgczNLbXNLZXlBcm46IHRoaXMuczNLbXNLZXlBcm4sXG4gICAgICBjbG91ZFRyYWlsS21zS2V5SWQ6IHRoaXMuY2xvdWRUcmFpbEttc0tleUlkLFxuICAgICAgY2xvdWRUcmFpbEttc0tleUFybjogdGhpcy5jbG91ZFRyYWlsS21zS2V5QXJuLFxuICAgICAgZGF0YUFjY2Vzc1JvbGVBcm46IHRoaXMuZGF0YUFjY2Vzc1JvbGVBcm4sXG4gICAgICBhdWRpdFJvbGVBcm46IHRoaXMuYXVkaXRSb2xlQXJuLFxuICAgICAgY2xvdWRUcmFpbEFybjogdGhpcy5jbG91ZFRyYWlsQXJuLFxuICAgICAgY2xvdWRUcmFpbExvZ0dyb3VwQXJuOiB0aGlzLmNsb3VkVHJhaWxMb2dHcm91cEFybixcbiAgICAgIHNlY3VyaXR5UG9saWN5QXJuOiB0aGlzLnNlY3VyaXR5UG9saWN5QXJuLFxuICAgICAgbWZhRW5mb3JjZW1lbnRQb2xpY3lBcm46IHRoaXMubWZhRW5mb3JjZW1lbnRQb2xpY3lBcm4sXG4gICAgICBzM1NlY3VyaXR5UG9saWN5QXJuOiB0aGlzLnMzU2VjdXJpdHlQb2xpY3lBcm4sXG4gICAgICBjbG91ZFRyYWlsUHJvdGVjdGlvblBvbGljeUFybjogdGhpcy5jbG91ZFRyYWlsUHJvdGVjdGlvblBvbGljeUFybixcbiAgICAgIGttc1Byb3RlY3Rpb25Qb2xpY3lBcm46IHRoaXMua21zUHJvdGVjdGlvblBvbGljeUFybixcbiAgICAgIHJlZ2lvbjogdGhpcy5yZWdpb24sXG4gICAgfSk7XG4gIH1cbn1cbiJdfQ==