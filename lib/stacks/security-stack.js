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
const tags_1 = require("../config/tags");
const cloudtrail_1 = require("../modules/cloudtrail");
const enhanced_cloudtrail_1 = require("../modules/cloudtrail/enhanced-cloudtrail");
const iam_1 = require("../modules/iam");
const kms_1 = require("../modules/kms");
const s3_1 = require("../modules/s3");
const enhanced_s3_1 = require("../modules/s3/enhanced-s3");
const security_policies_1 = require("../modules/security-policies");
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
    // CloudTrail properties
    cloudTrailArn;
    cloudTrailLogGroupArn;
    // Security Policies
    securityPolicyArn;
    mfaEnforcementPolicyArn;
    ec2LifecyclePolicyArn;
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
                enableNotifications: false,
                enableObjectLock: true,
                enableBucketPolicy: true,
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
                kmsKeyId: cloudTrailKmsKey.key.arn,
                allowedIpRanges,
                enableAccessLogging: true,
                enableObjectLock: true,
                enableBucketPolicy: true,
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
                enableBucketPolicy: true,
                enableAccessLogging: true,
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
                kmsKeyId: cloudTrailKmsKey.key.arn,
                enableBucketPolicy: true,
                enableAccessLogging: true,
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
                kmsKeyId: cloudTrailKmsKey.key.arn,
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
                kmsKeyId: cloudTrailKmsKey.key.arn,
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
        // CloudTrail outputs
        this.cloudTrailArn = cloudTrail.trail.arn;
        this.cloudTrailLogGroupArn = cloudTrail.logGroup.arn;
        this.securityPolicyArn = securityPolicy.arn;
        this.mfaEnforcementPolicyArn = securityPolicies.mfaEnforcementPolicy.arn;
        this.ec2LifecyclePolicyArn = securityPolicies.ec2LifecyclePolicy.arn;
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
            // CloudTrail outputs
            cloudTrailArn: this.cloudTrailArn,
            cloudTrailLogGroupArn: this.cloudTrailLogGroupArn,
            securityPolicyArn: this.securityPolicyArn,
            mfaEnforcementPolicyArn: this.mfaEnforcementPolicyArn,
            ec2LifecyclePolicyArn: this.ec2LifecyclePolicyArn,
            s3SecurityPolicyArn: this.s3SecurityPolicyArn,
            cloudTrailProtectionPolicyArn: this.cloudTrailProtectionPolicyArn,
            kmsProtectionPolicyArn: this.kmsProtectionPolicyArn,
            region: this.region,
        });
    }
}
exports.SecurityStack = SecurityStack;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic2VjdXJpdHktc3RhY2suanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJzZWN1cml0eS1zdGFjay50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFBQSxpREFBbUM7QUFDbkMsdURBQXlDO0FBQ3pDLHlDQUE0QztBQUM1QyxzREFBeUQ7QUFDekQsbUZBQStFO0FBQy9FLHdDQUl3QjtBQUN4Qix3Q0FBd0M7QUFDeEMsc0NBQStDO0FBQy9DLDJEQUFtRTtBQUNuRSxvRUFJc0M7QUFTdEMsTUFBYSxhQUFjLFNBQVEsTUFBTSxDQUFDLGlCQUFpQjtJQUN6RCxhQUFhO0lBQ0csaUJBQWlCLENBQXdCO0lBQ3pDLGdCQUFnQixDQUF3QjtJQUN4QyxlQUFlLENBQXdCO0lBQ3ZDLGNBQWMsQ0FBd0I7SUFFdEQsV0FBVztJQUNLLFVBQVUsQ0FBd0I7SUFDbEMsV0FBVyxDQUF3QjtJQUNuQyxrQkFBa0IsQ0FBd0I7SUFDMUMsbUJBQW1CLENBQXdCO0lBRTNELFlBQVk7SUFDSSxpQkFBaUIsQ0FBd0I7SUFDekMsWUFBWSxDQUF3QjtJQUVwRCx3QkFBd0I7SUFDUixhQUFhLENBQXdCO0lBQ3JDLHFCQUFxQixDQUF3QjtJQUU3RCxvQkFBb0I7SUFDSixpQkFBaUIsQ0FBd0I7SUFDekMsdUJBQXVCLENBQXdCO0lBQy9DLHFCQUFxQixDQUF3QjtJQUM3QyxtQkFBbUIsQ0FBd0I7SUFDM0MsNkJBQTZCLENBQXdCO0lBQ3JELHNCQUFzQixDQUF3QjtJQUU5RCxzQkFBc0I7SUFDTixNQUFNLENBQVM7SUFFL0IsWUFDRSxJQUFZLEVBQ1osSUFBd0IsRUFDeEIsSUFBc0M7UUFFdEMsS0FBSyxDQUFDLDRCQUE0QixFQUFFLElBQUksRUFBRSxJQUFJLEVBQUUsSUFBSSxDQUFDLENBQUM7UUFFdEQsTUFBTSxpQkFBaUIsR0FBRyxJQUFJLEVBQUUsaUJBQWlCLElBQUksS0FBSyxDQUFDO1FBQzNELE1BQU0sSUFBSSxH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QWdCO1lBQ3ZDLGVBQWUsRUFBRSxJQUFJLENBQUMsZUFBZTtZQUNyQyxjQUFjLEVBQUUsSUFBSSxDQUFDLGNBQWM7WUFDbkMsVUFBVSxFQUFFLElBQUksQ0FBQyxVQUFVO1lBQzNCLFdBQVcsRUFBRSxJQUFJLENBQUMsV0FBVztZQUM3QixrQkFBa0IsRUFBRSxJQUFJLENBQUMsa0JBQWtCO1lBQzNDLG1CQUFtQixFQUFFLElBQUksQ0FBQyxtQkFBbUI7WUFDN0MsaUJBQWlCLEVBQUUsSUFBSSxDQUFDLGlCQUFpQjtZQUN6QyxZQUFZLEVBQUUsSUFBSSxDQUFDLFlBQVk7WUFDL0IscUJBQXFCO1lBQ3JCLGFBQWEsRUFBRSxJQUFJLENBQUMsYUFBYTtZQUNqQyxxQkFBcUIsRUFBRSxJQUFJLENBQUMscUJBQXFCO1lBQ2pELGlCQUFpQixFQUFFLElBQUksQ0FBQyxpQkFBaUI7WUFDekMsdUJBQXVCLEVBQUUsSUFBSSxDQUFDLHVCQUF1QjtZQUNyRCxxQkFBcUIsRUFBRSxJQUFJLENBQUMscUJBQXFCO1lBQ2pELG1CQUFtQixFQUFFLElBQUksQ0FBQyxtQkFBbUI7WUFDN0MsNkJBQTZCLEVBQUUsSUFBSSxDQUFDLDZCQUE2QjtZQUNqRSxzQkFBc0IsRUFBRSxJQUFJLENBQUMsc0JBQXNCO1lBQ25ELE1BQU0sRUFBRSxJQUFJLENBQUMsTUFBTTtTQUNwQixDQUFDLENBQUM7SUFDTCxDQUFDO0NBQ0Y7QUEvZEQsc0NBK2RDIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0ICogYXMgYXdzIGZyb20gJ0BwdWx1bWkvYXdzJztcbmltcG9ydCAqIGFzIHB1bHVtaSBmcm9tICdAcHVsdW1pL3B1bHVtaSc7XG5pbXBvcnQgeyBjb21tb25UYWdzIH0gZnJvbSAnLi4vY29uZmlnL3RhZ3MnO1xuaW1wb3J0IHsgU2VjdXJlQ2xvdWRUcmFpbCB9IGZyb20gJy4uL21vZHVsZXMvY2xvdWR0cmFpbCc7XG5pbXBvcnQgeyBFbmhhbmNlZENsb3VkVHJhaWwgfSBmcm9tICcuLi9tb2R1bGVzL2Nsb3VkdHJhaWwvZW5oYW5jZWQtY2xvdWR0cmFpbCc7XG5pbXBvcnQge1xuICBTZWN1cmVJQU1Sb2xlLFxuICBjcmVhdGVNRkFFbmZvcmNlZFBvbGljeSxcbiAgY3JlYXRlUzNBY2Nlc3NQb2xpY3ksXG59IGZyb20gJy4uL21vZHVsZXMvaWFtJztcbmltcG9ydCB7IEtNU0tleSB9IGZyb20gJy4uL21vZHVsZXMva21zJztcbmltcG9ydCB7IFNlY3VyZVMzQnVja2V0IH0gZnJvbSAnLi4vbW9kdWxlcy9zMyc7XG5pbXBvcnQgeyBFbmhhbmNlZFNlY3VyZVMzQnVja2V0IH0gZnJvbSAnLi4vbW9kdWxlcy9zMy9lbmhhbmNlZC1zMyc7XG5pbXBvcnQge1xuICBTZWN1cml0eVBvbGljaWVzLFxuICBjcmVhdGVSZXN0cmljdGVkQXVkaXRQb2xpY3ksXG4gIGNyZWF0ZVRpbWVCYXNlZFMzQWNjZXNzUG9saWN5LFxufSBmcm9tICcuLi9tb2R1bGVzL3NlY3VyaXR5LXBvbGljaWVzJztcblxuZXhwb3J0IGludGVyZmFjZSBTZWN1cml0eVN0YWNrQXJncyB7XG4gIGVudmlyb25tZW50U3VmZml4Pzogc3RyaW5nO1xuICB0YWdzPzogcHVsdW1pLklucHV0PHsgW2tleTogc3RyaW5nXTogc3RyaW5nIH0+O1xuICBhbGxvd2VkSXBSYW5nZXM/OiBzdHJpbmdbXTtcbiAgZW5hYmxlRW5oYW5jZWRTZWN1cml0eT86IGJvb2xlYW47XG59XG5cbmV4cG9ydCBjbGFzcyBTZWN1cml0eVN0YWNrIGV4dGVuZHMgcHVsdW1pLkNvbXBvbmVudFJlc291cmNlIHtcbiAgLy8gUzMgQnVja2V0c1xuICBwdWJsaWMgcmVhZG9ubHkgcHJpbWFyeUJ1Y2tldE5hbWU6IHB1bHVtaS5PdXRwdXQ8c3RyaW5nPjtcbiAgcHVibGljIHJlYWRvbmx5IHByaW1hcnlCdWNrZXRBcm46IHB1bHVtaS5PdXRwdXQ8c3RyaW5nPjtcbiAgcHVibGljIHJlYWRvbmx5IGF1ZGl0QnVja2V0TmFtZTogcHVsdW1pLk91dHB1dDxzdHJpbmc+O1xuICBwdWJsaWMgcmVhZG9ubHkgYXVkaXRCdWNrZXRBcm46IHB1bHVtaS5PdXRwdXQ8c3RyaW5nPjtcblxuICAvLyBLTVMgS2V5c1xuICBwdWJsaWMgcmVhZG9ubHkgczNLbXNLZXlJZDogcHVsdW1pLk91dHB1dDxzdHJpbmc+O1xuICBwdWJsaWMgcmVhZG9ubHkgczNLbXNLZXlBcm46IHB1bHVtaS5PdXRwdXQ8c3RyaW5nPjtcbiAgcHVibGljIHJlYWRvbmx5IGNsb3VkVHJhaWxLbXNLZXlJZDogcHVsdW1pLk91dHB1dDxzdHJpbmc+O1xuICBwdWJsaWMgcmVhZG9ubHkgY2xvdWRUcmFpbEttc0tleUFybjogcHVsdW1pLk91dHB1dDxzdHJpbmc+O1xuXG4gIC8vIElBTSBSb2xlc1xuICBwdWJsaWMgcmVhZG9ubHkgZGF0YUFjY2Vzc1JvbGVBcm46IHB1bHVtaS5PdXRwdXQ8c3RyaW5nPjtcbiAgcHVibGljIHJlYWRvbmx5IGF1ZGl0Um9sZUFybjogcHVsdW1pLk91dHB1dDxzdHJpbmc+O1xuXG4gIC8vIENsb3VkVHJhaWwgcHJvcGVydGllc1xuICBwdWJsaWMgcmVhZG9ubHkgY2xvdWRUcmFpbEFybjogcHVsdW1pLk91dHB1dDxzdHJpbmc+O1xuICBwdWJsaWMgcmVhZG9ubHkgY2xvdWRUcmFpbExvZ0dyb3VwQXJuOiBwdWx1bWkuT3V0cHV0PHN0cmluZz47XG5cbiAgLy8gU2VjdXJpdHkgUG9saWNpZXNcbiAgcHVibGljIHJlYWRvbmx5IHNlY3VyaXR5UG9saWN5QXJuOiBwdWx1bWkuT3V0cHV0PHN0cmluZz47XG4gIHB1YmxpYyByZWFkb25seSBtZmFFbmZvcmNlbWVudFBvbGljeUFybjogcHVsdW1pLk91dHB1dDxzdHJpbmc+O1xuICBwdWJsaWMgcmVhZG9ubHkgZWMyTGlmZWN5Y2xlUG9saWN5QXJuOiBwdWx1bWkuT3V0cHV0PHN0cmluZz47XG4gIHB1YmxpYyByZWFkb25seSBzM1NlY3VyaXR5UG9saWN5QXJuOiBwdWx1bWkuT3V0cHV0PHN0cmluZz47XG4gIHB1YmxpYyByZWFkb25seSBjbG91ZFRyYWlsUHJvdGVjdGlvblBvbGljeUFybjogcHVsdW1pLk91dHB1dDxzdHJpbmc+O1xuICBwdWJsaWMgcmVhZG9ubHkga21zUHJvdGVjdGlvblBvbGljeUFybjogcHVsdW1pLk91dHB1dDxzdHJpbmc+O1xuXG4gIC8vIFJlZ2lvbiBjb25maXJtYXRpb25cbiAgcHVibGljIHJlYWRvbmx5IHJlZ2lvbjogc3RyaW5nO1xuXG4gIGNvbnN0cnVjdG9yKFxuICAgIG5hbWU6IHN0cmluZyxcbiAgICBhcmdzPzogU2VjdXJpdHlTdGFja0FyZ3MsXG4gICAgb3B0cz86IHB1bHVtaS5Db21wb25lbnRSZXNvdXJjZU9wdGlvbnNcbiAgKSB7XG4gICAgc3VwZXIoJ3RhcDpzZWN1cml0eTpTZWN1cml0eVN0YWNrJywgbmFtZSwgYXJncywgb3B0cyk7XG5cbiAgICBjb25zdCBlbnZpcm9ubWVudFN1ZmZpeCA9IGFyZ3M/LmVudmlyb25tZW50U3VmZml4IHx8ICdkZXYnO1xuICAgIGNvbnN0IHRhZ3MgPSBhcmdzPy50YWdzIHx8IHt9O1xuICAgIGNvbnN0IGFsbG93ZWRJcFJhbmdlcyA9IGFyZ3M/LmFsbG93ZWRJcFJhbmdlcyB8fCBbJzIwMy4wLjExMy4wLzI0J107XG4gICAgY29uc3QgZW5hYmxlRW5oYW5jZWRTZWN1cml0eSA9IGFyZ3M/LmVuYWJsZUVuaGFuY2VkU2VjdXJpdHkgPz8gdHJ1ZTtcblxuICAgIC8vIENvbmZpZ3VyZSBBV1MgcHJvdmlkZXIgZm9yIHVzLWVhc3QtMVxuICAgIGNvbnN0IHByb3ZpZGVyID0gbmV3IGF3cy5Qcm92aWRlcihcbiAgICAgICdhd3MtcHJvdmlkZXInLFxuICAgICAge1xuICAgICAgICByZWdpb246ICd1cy1lYXN0LTEnLFxuICAgICAgfSxcbiAgICAgIHsgcGFyZW50OiB0aGlzIH1cbiAgICApO1xuXG4gICAgLy8gR2V0IGFjY291bnQgSUQgZm9yIElBTSByb2xlIHBvbGljaWVzXG4gICAgY29uc3QgYWNjb3VudElkID0gYXdzLmdldENhbGxlcklkZW50aXR5KCkudGhlbihpZCA9PiBpZC5hY2NvdW50SWQpO1xuXG4gICAgLy8gQ3JlYXRlIGVuaGFuY2VkIHNlY3VyaXR5IHBvbGljaWVzXG4gICAgY29uc3Qgc2VjdXJpdHlQb2xpY2llcyA9IG5ldyBTZWN1cml0eVBvbGljaWVzKFxuICAgICAgYHRhcC1zZWN1cml0eS1wb2xpY2llcy0ke2Vudmlyb25tZW50U3VmZml4fWAsXG4gICAgICB7XG4gICAgICAgIGVudmlyb25tZW50U3VmZml4LFxuICAgICAgICB0YWdzOiBjb21tb25UYWdzLFxuICAgICAgfSxcbiAgICAgIHsgcGFyZW50OiB0aGlzLCBwcm92aWRlciB9XG4gICAgKTtcblxuICAgIC8vIENyZWF0ZSBLTVMga2V5cyBmb3IgZW5jcnlwdGlvblxuICAgIGNvbnN0IHMzS21zS2V5ID0gbmV3IEtNU0tleShcbiAgICAgIGBzMy1lbmNyeXB0aW9uLSR7ZW52aXJvbm1lbnRTdWZmaXh9YCxcbiAgICAgIHtcbiAgICAgICAgZGVzY3JpcHRpb246IGBLTVMga2V5IGZvciBTMyBidWNrZXQgZW5jcnlwdGlvbiAtICR7ZW52aXJvbm1lbnRTdWZmaXh9IGVudmlyb25tZW50YCxcbiAgICAgICAgdGFnczoge1xuICAgICAgICAgIFB1cnBvc2U6ICdTMyBFbmNyeXB0aW9uJyxcbiAgICAgICAgICBFbnZpcm9ubWVudDogZW52aXJvbm1lbnRTdWZmaXgsXG4gICAgICAgIH0sXG4gICAgICB9LFxuICAgICAgeyBwYXJlbnQ6IHRoaXMsIHByb3ZpZGVyIH1cbiAgICApO1xuXG4gICAgY29uc3QgY2xvdWRUcmFpbEttc0tleSA9IG5ldyBLTVNLZXkoXG4gICAgICBgY2xvdWR0cmFpbC1lbmNyeXB0aW9uLSR7ZW52aXJvbm1lbnRTdWZmaXh9YCxcbiAgICAgIHtcbiAgICAgICAgZGVzY3JpcHRpb246IGBLTVMga2V5IGZvciBDbG91ZFRyYWlsIGxvZyBlbmNyeXB0aW9uIC0gJHtlbnZpcm9ubWVudFN1ZmZpeH0gZW52aXJvbm1lbnRgLFxuICAgICAgICB0YWdzOiB7XG4gICAgICAgICAgUHVycG9zZTogJ0Nsb3VkVHJhaWwgRW5jcnlwdGlvbicsXG4gICAgICAgICAgRW52aXJvbm1lbnQ6IGVudmlyb25tZW50U3VmZml4LFxuICAgICAgICB9LFxuICAgICAgfSxcbiAgICAgIHsgcGFyZW50OiB0aGlzLCBwcm92aWRlciB9XG4gICAgKTtcblxuICAgIC8vIENyZWF0ZSBzZWN1cmUgUzMgYnVja2V0cyB3aXRoIGVuaGFuY2VkIHNlY3VyaXR5XG4gICAgbGV0IHByaW1hcnlCdWNrZXQ6IFNlY3VyZVMzQnVja2V0IHwgRW5oYW5jZWRTZWN1cmVTM0J1Y2tldDtcbiAgICBsZXQgYXVkaXRCdWNrZXQ6IFNlY3VyZVMzQnVja2V0IHwgRW5oYW5jZWRTZWN1cmVTM0J1Y2tldDtcblxuICAgIGlmIChlbmFibGVFbmhhbmNlZFNlY3VyaXR5KSB7XG4gICAgICBwcmltYXJ5QnVja2V0ID0gbmV3IEVuaGFuY2VkU2VjdXJlUzNCdWNrZXQoXG4gICAgICAgIGB0YXAtcHJpbWFyeS1zdG9yYWdlLSR7ZW52aXJvbm1lbnRTdWZmaXh9YCxcbiAgICAgICAge1xuICAgICAgICAgIGJ1Y2tldE5hbWU6IGB0YXAtcHJpbWFyeS1zdG9yYWdlLSR7ZW52aXJvbm1lbnRTdWZmaXh9YCxcbiAgICAgICAgICBrbXNLZXlJZDogczNLbXNLZXkua2V5LmtleUlkLFxuICAgICAgICAgIGFsbG93ZWRJcFJhbmdlcyxcbiAgICAgICAgICBlbmFibGVBY2Nlc3NMb2dnaW5nOiB0cnVlLFxuICAgICAgICAgIGVuYWJsZU5vdGlmaWNhdGlvbnM6IGZhbHNlLFxuICAgICAgICAgIGVuYWJsZU9iamVjdExvY2s6IHRydWUsXG4gICAgICAgICAgZW5hYmxlQnVja2V0UG9saWN5OiB0cnVlLFxuICAgICAgICAgIGxpZmVjeWNsZVJ1bGVzOiBbXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgIGlkOiAndHJhbnNpdGlvbi10by1pYScsXG4gICAgICAgICAgICAgIHN0YXR1czogJ0VuYWJsZWQnLFxuICAgICAgICAgICAgICB0cmFuc2l0aW9uczogW1xuICAgICAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICAgIGRheXM6IDMwLFxuICAgICAgICAgICAgICAgICAgc3RvcmFnZUNsYXNzOiAnU1RBTkRBUkRfSUEnLFxuICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgICAgZGF5czogOTAsXG4gICAgICAgICAgICAgICAgICBzdG9yYWdlQ2xhc3M6ICdHTEFDSUVSJyxcbiAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICAgIGRheXM6IDM2NSxcbiAgICAgICAgICAgICAgICAgIHN0b3JhZ2VDbGFzczogJ0RFRVBfQVJDSElWRScsXG4gICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgXSxcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgXSxcbiAgICAgICAgICB0YWdzOiB7XG4gICAgICAgICAgICBQdXJwb3NlOiAnUHJpbWFyeSBkYXRhIHN0b3JhZ2Ugd2l0aCBlbmhhbmNlZCBzZWN1cml0eScsXG4gICAgICAgICAgICBFbnZpcm9ubWVudDogZW52aXJvbm1lbnRTdWZmaXgsXG4gICAgICAgICAgfSxcbiAgICAgICAgfSxcbiAgICAgICAgeyBwYXJlbnQ6IHRoaXMsIHByb3ZpZGVyIH1cbiAgICAgICk7XG5cbiAgICAgIGF1ZGl0QnVja2V0ID0gbmV3IEVuaGFuY2VkU2VjdXJlUzNCdWNrZXQoXG4gICAgICAgIGB0YXAtYXVkaXQtbG9ncy0ke2Vudmlyb25tZW50U3VmZml4fWAsXG4gICAgICAgIHtcbiAgICAgICAgICBidWNrZXROYW1lOiBgdGFwLWF1ZGl0LWxvZ3MtJHtlbnZpcm9ubWVudFN1ZmZpeH1gLFxuICAgICAgICAgIGttc0tleUlkOiBjbG91ZFRyYWlsS21zS2V5LmtleS5hcm4sXG4gICAgICAgICAgYWxsb3dlZElwUmFuZ2VzLFxuICAgICAgICAgIGVuYWJsZUFjY2Vzc0xvZ2dpbmc6IHRydWUsXG4gICAgICAgICAgZW5hYmxlT2JqZWN0TG9jazogdHJ1ZSxcbiAgICAgICAgICBlbmFibGVCdWNrZXRQb2xpY3k6IHRydWUsXG4gICAgICAgICAgdGFnczoge1xuICAgICAgICAgICAgUHVycG9zZTogJ0F1ZGl0IGFuZCBjb21wbGlhbmNlIGxvZ3Mgd2l0aCBlbmhhbmNlZCBzZWN1cml0eScsXG4gICAgICAgICAgICBFbnZpcm9ubWVudDogZW52aXJvbm1lbnRTdWZmaXgsXG4gICAgICAgICAgfSxcbiAgICAgICAgfSxcbiAgICAgICAgeyBwYXJlbnQ6IHRoaXMsIHByb3ZpZGVyIH1cbiAgICAgICk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHByaW1hcnlCdWNrZXQgPSBuZXcgU2VjdXJlUzNCdWNrZXQoXG4gICAgICAgIGB0YXAtcHJpbWFyeS1zdG9yYWdlLSR7ZW52aXJvbm1lbnRTdWZmaXh9YCxcbiAgICAgICAge1xuICAgICAgICAgIGJ1Y2tldE5hbWU6IGB0YXAtcHJpbWFyeS1zdG9yYWdlLSR7ZW52aXJvbm1lbnRTdWZmaXh9YCxcbiAgICAgICAgICBrbXNLZXlJZDogczNLbXNLZXkua2V5LmtleUlkLFxuICAgICAgICAgIGVuYWJsZUJ1Y2tldFBvbGljeTogdHJ1ZSxcbiAgICAgICAgICBlbmFibGVBY2Nlc3NMb2dnaW5nOiB0cnVlLFxuICAgICAgICAgIGxpZmVjeWNsZVJ1bGVzOiBbXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgIGlkOiAndHJhbnNpdGlvbi10by1pYScsXG4gICAgICAgICAgICAgIHN0YXR1czogJ0VuYWJsZWQnLFxuICAgICAgICAgICAgICB0cmFuc2l0aW9uczogW1xuICAgICAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICAgIGRheXM6IDMwLFxuICAgICAgICAgICAgICAgICAgc3RvcmFnZUNsYXNzOiAnU1RBTkRBUkRfSUEnLFxuICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgICAgZGF5czogOTAsXG4gICAgICAgICAgICAgICAgICBzdG9yYWdlQ2xhc3M6ICdHTEFDSUVSJyxcbiAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICAgIGRheXM6IDM2NSxcbiAgICAgICAgICAgICAgICAgIHN0b3JhZ2VDbGFzczogJ0RFRVBfQVJDSElWRScsXG4gICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgXSxcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgXSxcbiAgICAgICAgICB0YWdzOiB7XG4gICAgICAgICAgICBQdXJwb3NlOiAnUHJpbWFyeSBkYXRhIHN0b3JhZ2UnLFxuICAgICAgICAgICAgRW52aXJvbm1lbnQ6IGVudmlyb25tZW50U3VmZml4LFxuICAgICAgICAgIH0sXG4gICAgICAgIH0sXG4gICAgICAgIHsgcGFyZW50OiB0aGlzLCBwcm92aWRlciB9XG4gICAgICApO1xuXG4gICAgICBhdWRpdEJ1Y2tldCA9IG5ldyBTZWN1cmVTM0J1Y2tldChcbiAgICAgICAgYHRhcC1hdWRpdC1sb2dzLSR7ZW52aXJvbm1lbnRTdWZmaXh9YCxcbiAgICAgICAge1xuICAgICAgICAgIGJ1Y2tldE5hbWU6IGB0YXAtYXVkaXQtbG9ncy0ke2Vudmlyb25tZW50U3VmZml4fWAsXG4gICAgICAgICAga21zS2V5SWQ6IGNsb3VkVHJhaWxLbXNLZXkua2V5LmFybixcbiAgICAgICAgICBlbmFibGVCdWNrZXRQb2xpY3k6IHRydWUsXG4gICAgICAgICAgZW5hYmxlQWNjZXNzTG9nZ2luZzogdHJ1ZSxcbiAgICAgICAgICB0YWdzOiB7XG4gICAgICAgICAgICBQdXJwb3NlOiAnQXVkaXQgYW5kIGNvbXBsaWFuY2UgbG9ncycsXG4gICAgICAgICAgICBFbnZpcm9ubWVudDogZW52aXJvbm1lbnRTdWZmaXgsXG4gICAgICAgICAgfSxcbiAgICAgICAgfSxcbiAgICAgICAgeyBwYXJlbnQ6IHRoaXMsIHByb3ZpZGVyIH1cbiAgICAgICk7XG4gICAgfVxuXG4gICAgLy8gQ3JlYXRlIElBTSByb2xlcyB3aXRoIGVuaGFuY2VkIGxlYXN0IHByaXZpbGVnZSBhbmQgTUZBIGVuZm9yY2VtZW50XG4gICAgY29uc3QgZGF0YUFjY2Vzc1JvbGUgPSBuZXcgU2VjdXJlSUFNUm9sZShcbiAgICAgIGB0YXAtZGF0YS1hY2Nlc3MtJHtlbnZpcm9ubWVudFN1ZmZpeH1gLFxuICAgICAge1xuICAgICAgICBhc3N1bWVSb2xlUG9saWN5OiBwdWx1bWkuYWxsKFthY2NvdW50SWRdKS5hcHBseSgoW2FjY291bnRJZF0pID0+XG4gICAgICAgICAgSlNPTi5zdHJpbmdpZnkoe1xuICAgICAgICAgICAgVmVyc2lvbjogJzIwMTItMTAtMTcnLFxuICAgICAgICAgICAgU3RhdGVtZW50OiBbXG4gICAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICBBY3Rpb246ICdzdHM6QXNzdW1lUm9sZScsXG4gICAgICAgICAgICAgICAgRWZmZWN0OiAnQWxsb3cnLFxuICAgICAgICAgICAgICAgIFByaW5jaXBhbDoge1xuICAgICAgICAgICAgICAgICAgQVdTOiBgYXJuOmF3czppYW06OiR7YWNjb3VudElkfTpyb290YCxcbiAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgIENvbmRpdGlvbjoge1xuICAgICAgICAgICAgICAgICAgQm9vbDoge1xuICAgICAgICAgICAgICAgICAgICAnYXdzOk11bHRpRmFjdG9yQXV0aFByZXNlbnQnOiAndHJ1ZScsXG4gICAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgICAgU3RyaW5nRXF1YWxzOiB7XG4gICAgICAgICAgICAgICAgICAgICdhd3M6UmVxdWVzdGVkUmVnaW9uJzogJ3VzLWVhc3QtMScsXG4gICAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgICAgSXBBZGRyZXNzOiB7XG4gICAgICAgICAgICAgICAgICAgICdhd3M6U291cmNlSXAnOiBhbGxvd2VkSXBSYW5nZXMsXG4gICAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBdLFxuICAgICAgICAgIH0pXG4gICAgICAgICksXG4gICAgICAgIHJvbGVOYW1lOiBgdGFwLWRhdGEtYWNjZXNzLXJvbGUtJHtlbnZpcm9ubWVudFN1ZmZpeH1gLFxuICAgICAgICBwb2xpY2llczogZW5hYmxlRW5oYW5jZWRTZWN1cml0eVxuICAgICAgICAgID8gW1xuICAgICAgICAgICAgICBjcmVhdGVUaW1lQmFzZWRTM0FjY2Vzc1BvbGljeShwcmltYXJ5QnVja2V0LmJ1Y2tldC5hcm4pLFxuICAgICAgICAgICAgICBjcmVhdGVNRkFFbmZvcmNlZFBvbGljeSgpLFxuICAgICAgICAgICAgXVxuICAgICAgICAgIDogW1xuICAgICAgICAgICAgICBjcmVhdGVTM0FjY2Vzc1BvbGljeShwcmltYXJ5QnVja2V0LmJ1Y2tldC5hcm4pLFxuICAgICAgICAgICAgICBjcmVhdGVNRkFFbmZvcmNlZFBvbGljeSgpLFxuICAgICAgICAgICAgXSxcbiAgICAgICAgbWFuYWdlZFBvbGljeUFybnM6IFtdLFxuICAgICAgICByZXF1aXJlTUZBOiB0cnVlLFxuICAgICAgICB0YWdzOiB7XG4gICAgICAgICAgUHVycG9zZTpcbiAgICAgICAgICAgICdEYXRhIGFjY2VzcyB3aXRoIGVuaGFuY2VkIE1GQSBlbmZvcmNlbWVudCBhbmQgdGltZSByZXN0cmljdGlvbnMnLFxuICAgICAgICAgIEVudmlyb25tZW50OiBlbnZpcm9ubWVudFN1ZmZpeCxcbiAgICAgICAgfSxcbiAgICAgIH0sXG4gICAgICB7IHBhcmVudDogdGhpcywgcHJvdmlkZXIgfVxuICAgICk7XG5cbiAgICBjb25zdCBhdWRpdFJvbGUgPSBuZXcgU2VjdXJlSUFNUm9sZShcbiAgICAgIGB0YXAtYXVkaXQtYWNjZXNzLSR7ZW52aXJvbm1lbnRTdWZmaXh9YCxcbiAgICAgIHtcbiAgICAgICAgYXNzdW1lUm9sZVBvbGljeTogcHVsdW1pLmFsbChbYWNjb3VudElkXSkuYXBwbHkoKFthY2NvdW50SWRdKSA9PlxuICAgICAgICAgIEpTT04uc3RyaW5naWZ5KHtcbiAgICAgICAgICAgIFZlcnNpb246ICcyMDEyLTEwLTE3JyxcbiAgICAgICAgICAgIFN0YXRlbWVudDogW1xuICAgICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgQWN0aW9uOiAnc3RzOkFzc3VtZVJvbGUnLFxuICAgICAgICAgICAgICAgIEVmZmVjdDogJ0FsbG93JyxcbiAgICAgICAgICAgICAgICBQcmluY2lwYWw6IHtcbiAgICAgICAgICAgICAgICAgIEFXUzogYGFybjphd3M6aWFtOjoke2FjY291bnRJZH06cm9vdGAsXG4gICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICBDb25kaXRpb246IHtcbiAgICAgICAgICAgICAgICAgIEJvb2w6IHtcbiAgICAgICAgICAgICAgICAgICAgJ2F3czpNdWx0aUZhY3RvckF1dGhQcmVzZW50JzogJ3RydWUnLFxuICAgICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICAgIFN0cmluZ0VxdWFsczoge1xuICAgICAgICAgICAgICAgICAgICAnYXdzOlJlcXVlc3RlZFJlZ2lvbic6ICd1cy1lYXN0LTEnLFxuICAgICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICAgIElwQWRkcmVzczoge1xuICAgICAgICAgICAgICAgICAgICAnYXdzOlNvdXJjZUlwJzogYWxsb3dlZElwUmFuZ2VzLFxuICAgICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgXSxcbiAgICAgICAgICB9KVxuICAgICAgICApLFxuICAgICAgICByb2xlTmFtZTogYHRhcC1hdWRpdC1hY2Nlc3Mtcm9sZS0ke2Vudmlyb25tZW50U3VmZml4fWAsXG4gICAgICAgIHBvbGljaWVzOiBlbmFibGVFbmhhbmNlZFNlY3VyaXR5XG4gICAgICAgICAgPyBbXG4gICAgICAgICAgICAgIGNyZWF0ZVJlc3RyaWN0ZWRBdWRpdFBvbGljeShcbiAgICAgICAgICAgICAgICBhdWRpdEJ1Y2tldC5idWNrZXQuYXJuLFxuICAgICAgICAgICAgICAgIGFsbG93ZWRJcFJhbmdlc1xuICAgICAgICAgICAgICApLFxuICAgICAgICAgICAgXVxuICAgICAgICAgIDogW1xuICAgICAgICAgICAgICBwdWx1bWkuaW50ZXJwb2xhdGVge1xuICAgICAgICAgIFwiVmVyc2lvblwiOiBcIjIwMTItMTAtMTdcIixcbiAgICAgICAgICBcIlN0YXRlbWVudFwiOiBbXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgIFwiRWZmZWN0XCI6IFwiQWxsb3dcIixcbiAgICAgICAgICAgICAgXCJBY3Rpb25cIjogW1xuICAgICAgICAgICAgICAgIFwiczM6R2V0T2JqZWN0XCIsXG4gICAgICAgICAgICAgICAgXCJzMzpMaXN0QnVja2V0XCJcbiAgICAgICAgICAgICAgXSxcbiAgICAgICAgICAgICAgXCJSZXNvdXJjZVwiOiBbXG4gICAgICAgICAgICAgICAgXCIke2F1ZGl0QnVja2V0LmJ1Y2tldC5hcm59XCIsXG4gICAgICAgICAgICAgICAgXCIke2F1ZGl0QnVja2V0LmJ1Y2tldC5hcm59LypcIlxuICAgICAgICAgICAgICBdXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAge1xuICAgICAgICAgICAgICBcIkVmZmVjdFwiOiBcIkFsbG93XCIsXG4gICAgICAgICAgICAgIFwiQWN0aW9uXCI6IFtcbiAgICAgICAgICAgICAgICBcImNsb3VkdHJhaWw6TG9va3VwRXZlbnRzXCIsXG4gICAgICAgICAgICAgICAgXCJjbG91ZHRyYWlsOkdldFRyYWlsU3RhdHVzXCJcbiAgICAgICAgICAgICAgXSxcbiAgICAgICAgICAgICAgXCJSZXNvdXJjZVwiOiBcIipcIlxuICAgICAgICAgICAgfVxuICAgICAgICAgIF1cbiAgICAgICAgfWAsXG4gICAgICAgICAgICBdLFxuICAgICAgICBtYW5hZ2VkUG9saWN5QXJuczogWydhcm46YXdzOmlhbTo6YXdzOnBvbGljeS9SZWFkT25seUFjY2VzcyddLFxuICAgICAgICByZXF1aXJlTUZBOiB0cnVlLFxuICAgICAgICB0YWdzOiB7XG4gICAgICAgICAgUHVycG9zZTogJ0F1ZGl0IGxvZyBhY2Nlc3Mgd2l0aCBJUCBhbmQgdGltZSByZXN0cmljdGlvbnMnLFxuICAgICAgICAgIEVudmlyb25tZW50OiBlbnZpcm9ubWVudFN1ZmZpeCxcbiAgICAgICAgfSxcbiAgICAgIH0sXG4gICAgICB7IHBhcmVudDogdGhpcywgcHJvdmlkZXIgfVxuICAgICk7XG5cbiAgICAvLyBDcmVhdGUgQ2xvdWRUcmFpbCBmb3IgY29tcHJlaGVuc2l2ZSBsb2dnaW5nXG4gICAgbGV0IGNsb3VkVHJhaWw6IFNlY3VyZUNsb3VkVHJhaWwgfCBFbmhhbmNlZENsb3VkVHJhaWw7XG5cbiAgICBpZiAoZW5hYmxlRW5oYW5jZWRTZWN1cml0eSkge1xuICAgICAgY2xvdWRUcmFpbCA9IG5ldyBFbmhhbmNlZENsb3VkVHJhaWwoXG4gICAgICAgIGB0YXAtc2VjdXJpdHktYXVkaXQtJHtlbnZpcm9ubWVudFN1ZmZpeH1gLFxuICAgICAgICB7XG4gICAgICAgICAgdHJhaWxOYW1lOiBgdGFwLXNlY3VyaXR5LWF1ZGl0LXRyYWlsLSR7ZW52aXJvbm1lbnRTdWZmaXh9YCxcbiAgICAgICAgICBzM0J1Y2tldE5hbWU6IGF1ZGl0QnVja2V0LmJ1Y2tldC5pZCxcbiAgICAgICAgICBrbXNLZXlJZDogY2xvdWRUcmFpbEttc0tleS5rZXkuYXJuLFxuICAgICAgICAgIGluY2x1ZGVHbG9iYWxTZXJ2aWNlRXZlbnRzOiB0cnVlLFxuICAgICAgICAgIGlzTXVsdGlSZWdpb25UcmFpbDogdHJ1ZSxcbiAgICAgICAgICBlbmFibGVMb2dGaWxlVmFsaWRhdGlvbjogdHJ1ZSxcbiAgICAgICAgICBlbmFibGVJbnNpZ2h0U2VsZWN0b3JzOiB0cnVlLFxuICAgICAgICAgIHRhZ3M6IHtcbiAgICAgICAgICAgIFB1cnBvc2U6XG4gICAgICAgICAgICAgICdFbmhhbmNlZCBzZWN1cml0eSBhdWRpdCBhbmQgY29tcGxpYW5jZSB3aXRoIGFub21hbHkgZGV0ZWN0aW9uJyxcbiAgICAgICAgICAgIEVudmlyb25tZW50OiBlbnZpcm9ubWVudFN1ZmZpeCxcbiAgICAgICAgICB9LFxuICAgICAgICB9LFxuICAgICAgICB7IHBhcmVudDogdGhpcywgcHJvdmlkZXIgfVxuICAgICAgKTtcbiAgICB9IGVsc2Uge1xuICAgICAgY2xvdWRUcmFpbCA9IG5ldyBTZWN1cmVDbG91ZFRyYWlsKFxuICAgICAgICBgdGFwLXNlY3VyaXR5LWF1ZGl0LSR7ZW52aXJvbm1lbnRTdWZmaXh9YCxcbiAgICAgICAge1xuICAgICAgICAgIHRyYWlsTmFtZTogYHRhcC1zZWN1cml0eS1hdWRpdC10cmFpbC0ke2Vudmlyb25tZW50U3VmZml4fWAsXG4gICAgICAgICAgczNCdWNrZXROYW1lOiBhdWRpdEJ1Y2tldC5idWNrZXQuaWQsXG4gICAgICAgICAga21zS2V5SWQ6IGNsb3VkVHJhaWxLbXNLZXkua2V5LmFybixcbiAgICAgICAgICBpbmNsdWRlR2xvYmFsU2VydmljZUV2ZW50czogdHJ1ZSxcbiAgICAgICAgICBpc011bHRpUmVnaW9uVHJhaWw6IHRydWUsXG4gICAgICAgICAgZW5hYmxlTG9nRmlsZVZhbGlkYXRpb246IHRydWUsXG4gICAgICAgICAgdGFnczoge1xuICAgICAgICAgICAgUHVycG9zZTogJ1NlY3VyaXR5IGF1ZGl0IGFuZCBjb21wbGlhbmNlJyxcbiAgICAgICAgICAgIEVudmlyb25tZW50OiBlbnZpcm9ubWVudFN1ZmZpeCxcbiAgICAgICAgICB9LFxuICAgICAgICB9LFxuICAgICAgICB7IHBhcmVudDogdGhpcywgcHJvdmlkZXIgfVxuICAgICAgKTtcbiAgICB9XG5cbiAgICAvLyBDcmVhdGUgYWRkaXRpb25hbCBzZWN1cml0eSBwb2xpY2llcyB3aXRoIGVuaGFuY2VkIGNvbnRyb2xzXG4gICAgY29uc3Qgc2VjdXJpdHlQb2xpY3kgPSBuZXcgYXdzLmlhbS5Qb2xpY3koXG4gICAgICBgdGFwLXNlY3VyaXR5LWJhc2VsaW5lLSR7ZW52aXJvbm1lbnRTdWZmaXh9YCxcbiAgICAgIHtcbiAgICAgICAgbmFtZTogYFNlY3VyaXR5QmFzZWxpbmUtJHtlbnZpcm9ubWVudFN1ZmZpeH1gLFxuICAgICAgICBkZXNjcmlwdGlvbjpcbiAgICAgICAgICAnRW5oYW5jZWQgYmFzZWxpbmUgc2VjdXJpdHkgcG9saWN5IHdpdGggY29tcHJlaGVuc2l2ZSBNRkEgcmVxdWlyZW1lbnRzJyxcbiAgICAgICAgcG9saWN5OiBKU09OLnN0cmluZ2lmeSh7XG4gICAgICAgICAgVmVyc2lvbjogJzIwMTItMTAtMTcnLFxuICAgICAgICAgIFN0YXRlbWVudDogW1xuICAgICAgICAgICAge1xuICAgICAgICAgICAgICBTaWQ6ICdSZXF1aXJlTUZBRm9yQWxsU2Vuc2l0aXZlQWN0aW9ucycsXG4gICAgICAgICAgICAgIEVmZmVjdDogJ0RlbnknLFxuICAgICAgICAgICAgICBBY3Rpb246IFtcbiAgICAgICAgICAgICAgICAnaWFtOkNyZWF0ZVJvbGUnLFxuICAgICAgICAgICAgICAgICdpYW06RGVsZXRlUm9sZScsXG4gICAgICAgICAgICAgICAgJ2lhbTpBdHRhY2hSb2xlUG9saWN5JyxcbiAgICAgICAgICAgICAgICAnaWFtOkRldGFjaFJvbGVQb2xpY3knLFxuICAgICAgICAgICAgICAgICdpYW06UHV0Um9sZVBvbGljeScsXG4gICAgICAgICAgICAgICAgJ2lhbTpEZWxldGVSb2xlUG9saWN5JyxcbiAgICAgICAgICAgICAgICAnczM6RGVsZXRlQnVja2V0JyxcbiAgICAgICAgICAgICAgICAnczM6UHV0QnVja2V0UG9saWN5JyxcbiAgICAgICAgICAgICAgICAna21zOlNjaGVkdWxlS2V5RGVsZXRpb24nLFxuICAgICAgICAgICAgICAgICdrbXM6RGlzYWJsZUtleScsXG4gICAgICAgICAgICAgICAgJ2Nsb3VkdHJhaWw6RGVsZXRlVHJhaWwnLFxuICAgICAgICAgICAgICAgICdjbG91ZHRyYWlsOlN0b3BMb2dnaW5nJyxcbiAgICAgICAgICAgICAgXSxcbiAgICAgICAgICAgICAgUmVzb3VyY2U6ICcqJyxcbiAgICAgICAgICAgICAgQ29uZGl0aW9uOiB7XG4gICAgICAgICAgICAgICAgQm9vbElmRXhpc3RzOiB7XG4gICAgICAgICAgICAgICAgICAnYXdzOk11bHRpRmFjdG9yQXV0aFByZXNlbnQnOiAnZmFsc2UnLFxuICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAge1xuICAgICAgICAgICAgICBTaWQ6ICdSZXN0cmljdFRvVVNFYXN0MU9ubHknLFxuICAgICAgICAgICAgICBFZmZlY3Q6ICdEZW55JyxcbiAgICAgICAgICAgICAgQWN0aW9uOiAnKicsXG4gICAgICAgICAgICAgIFJlc291cmNlOiAnKicsXG4gICAgICAgICAgICAgIENvbmRpdGlvbjoge1xuICAgICAgICAgICAgICAgIFN0cmluZ05vdEVxdWFsczoge1xuICAgICAgICAgICAgICAgICAgJ2F3czpSZXF1ZXN0ZWRSZWdpb24nOiAndXMtZWFzdC0xJyxcbiAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgU2lkOiAnUmVxdWlyZUVuY3J5cHRlZFN0b3JhZ2UnLFxuICAgICAgICAgICAgICBFZmZlY3Q6ICdEZW55JyxcbiAgICAgICAgICAgICAgQWN0aW9uOiBbXG4gICAgICAgICAgICAgICAgJ3MzOlB1dE9iamVjdCcsXG4gICAgICAgICAgICAgICAgJ2ViczpDcmVhdGVWb2x1bWUnLFxuICAgICAgICAgICAgICAgICdyZHM6Q3JlYXRlREJJbnN0YW5jZScsXG4gICAgICAgICAgICAgIF0sXG4gICAgICAgICAgICAgIFJlc291cmNlOiAnKicsXG4gICAgICAgICAgICAgIENvbmRpdGlvbjoge1xuICAgICAgICAgICAgICAgIEJvb2w6IHtcbiAgICAgICAgICAgICAgICAgICdhd3M6U2VjdXJlVHJhbnNwb3J0JzogJ2ZhbHNlJyxcbiAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgfSxcbiAgICAgICAgICBdLFxuICAgICAgICB9KSxcbiAgICAgICAgdGFnczogeyAuLi5jb21tb25UYWdzLCAuLi50YWdzIH0sXG4gICAgICB9LFxuICAgICAgeyBwYXJlbnQ6IHRoaXMsIHByb3ZpZGVyIH1cbiAgICApO1xuXG4gICAgLy8gQXNzaWduIG91dHB1dHNcbiAgICB0aGlzLnByaW1hcnlCdWNrZXROYW1lID0gcHJpbWFyeUJ1Y2tldC5idWNrZXQuaWQ7XG4gICAgdGhpcy5wcmltYXJ5QnVja2V0QXJuID0gcHJpbWFyeUJ1Y2tldC5idWNrZXQuYXJuO1xuICAgIHRoaXMuYXVkaXRCdWNrZXROYW1lID0gYXVkaXRCdWNrZXQuYnVja2V0LmlkO1xuICAgIHRoaXMuYXVkaXRCdWNrZXRBcm4gPSBhdWRpdEJ1Y2tldC5idWNrZXQuYXJuO1xuICAgIHRoaXMuczNLbXNLZXlJZCA9IHMzS21zS2V5LmtleS5rZXlJZDtcbiAgICB0aGlzLnMzS21zS2V5QXJuID0gczNLbXNLZXkua2V5LmFybjtcbiAgICB0aGlzLmNsb3VkVHJhaWxLbXNLZXlJZCA9IGNsb3VkVHJhaWxLbXNLZXkua2V5LmtleUlkO1xuICAgIHRoaXMuY2xvdWRUcmFpbEttc0tleUFybiA9IGNsb3VkVHJhaWxLbXNLZXkua2V5LmFybjtcbiAgICB0aGlzLmRhdGFBY2Nlc3NSb2xlQXJuID0gZGF0YUFjY2Vzc1JvbGUucm9sZS5hcm47XG4gICAgdGhpcy5hdWRpdFJvbGVBcm4gPSBhdWRpdFJvbGUucm9sZS5hcm47XG4gICAgLy8gQ2xvdWRUcmFpbCBvdXRwdXRzXG4gICAgdGhpcy5jbG91ZFRyYWlsQXJuID0gY2xvdWRUcmFpbC50cmFpbC5hcm47XG4gICAgdGhpcy5jbG91ZFRyYWlsTG9nR3JvdXBBcm4gPSBjbG91ZFRyYWlsLmxvZ0dyb3VwLmFybjtcbiAgICB0aGlzLnNlY3VyaXR5UG9saWN5QXJuID0gc2VjdXJpdHlQb2xpY3kuYXJuO1xuICAgIHRoaXMubWZhRW5mb3JjZW1lbnRQb2xpY3lBcm4gPSBzZWN1cml0eVBvbGljaWVzLm1mYUVuZm9yY2VtZW50UG9saWN5LmFybjtcbiAgICB0aGlzLmVjMkxpZmVjeWNsZVBvbGljeUFybiA9IHNlY3VyaXR5UG9saWNpZXMuZWMyTGlmZWN5Y2xlUG9saWN5LmFybjtcbiAgICB0aGlzLnMzU2VjdXJpdHlQb2xpY3lBcm4gPSBzZWN1cml0eVBvbGljaWVzLnMzRGVueUluc2VjdXJlUG9saWN5LmFybjtcbiAgICB0aGlzLmNsb3VkVHJhaWxQcm90ZWN0aW9uUG9saWN5QXJuID1cbiAgICAgIHNlY3VyaXR5UG9saWNpZXMuY2xvdWRUcmFpbFByb3RlY3Rpb25Qb2xpY3kuYXJuO1xuICAgIHRoaXMua21zUHJvdGVjdGlvblBvbGljeUFybiA9IHNlY3VyaXR5UG9saWNpZXMua21zS2V5UHJvdGVjdGlvblBvbGljeS5hcm47XG4gICAgdGhpcy5yZWdpb24gPSAndXMtZWFzdC0xJztcblxuICAgIC8vIFJlZ2lzdGVyIHRoZSBvdXRwdXRzIG9mIHRoaXMgY29tcG9uZW50XG4gICAgdGhpcy5yZWdpc3Rlck91dHB1dHMoe1xuICAgICAgcHJpbWFyeUJ1Y2tldE5hbWU6IHRoaXMucHJpbWFyeUJ1Y2tldE5hbWUsXG4gICAgICBwcmltYXJ5QnVja2V0QXJuOiB0aGlzLnByaW1hcnlCdWNrZXRBcm4sXG4gICAgICBhdWRpdEJ1Y2tldE5hbWU6IHRoaXMuYXVkaXRCdWNrZXROYW1lLFxuICAgICAgYXVkaXRCdWNrZXRBcm46IHRoaXMuYXVkaXRCdWNrZXRBcm4sXG4gICAgICBzM0ttc0tleUlkOiB0aGlzLnMzS21zS2V5SWQsXG4gICAgICBzM0ttc0tleUFybjogdGhpcy5zM0ttc0tleUFybixcbiAgICAgIGNsb3VkVHJhaWxLbXNLZXlJZDogdGhpcy5jbG91ZFRyYWlsS21zS2V5SWQsXG4gICAgICBjbG91ZFRyYWlsS21zS2V5QXJuOiB0aGlzLmNsb3VkVHJhaWxLbXNLZXlBcm4sXG4gICAgICBkYXRhQWNjZXNzUm9sZUFybjogdGhpcy5kYXRhQWNjZXNzUm9sZUFybixcbiAgICAgIGF1ZGl0Um9sZUFybjogdGhpcy5hdWRpdFJvbGVBcm4sXG4gICAgICAvLyBDbG91ZFRyYWlsIG91dHB1dHNcbiAgICAgIGNsb3VkVHJhaWxBcm46IHRoaXMuY2xvdWRUcmFpbEFybixcbiAgICAgIGNsb3VkVHJhaWxMb2dHcm91cEFybjogdGhpcy5jbG91ZFRyYWlsTG9nR3JvdXBBcm4sXG4gICAgICBzZWN1cml0eVBvbGljeUFybjogdGhpcy5zZWN1cml0eVBvbGljeUFybixcbiAgICAgIG1mYUVuZm9yY2VtZW50UG9saWN5QXJuOiB0aGlzLm1mYUVuZm9yY2VtZW50UG9saWN5QXJuLFxuICAgICAgZWMyTGlmZWN5Y2xlUG9saWN5QXJuOiB0aGlzLmVjMkxpZmVjeWNsZVBvbGljeUFybixcbiAgICAgIHMzU2VjdXJpdHlQb2xpY3lBcm46IHRoaXMuczNTZWN1cml0eVBvbGljeUFybixcbiAgICAgIGNsb3VkVHJhaWxQcm90ZWN0aW9uUG9saWN5QXJuOiB0aGlzLmNsb3VkVHJhaWxQcm90ZWN0aW9uUG9saWN5QXJuLFxuICAgICAga21zUHJvdGVjdGlvblBvbGljeUFybjogdGhpcy5rbXNQcm90ZWN0aW9uUG9saWN5QXJuLFxuICAgICAgcmVnaW9uOiB0aGlzLnJlZ2lvbixcbiAgICB9KTtcbiAgfVxufVxuIl19