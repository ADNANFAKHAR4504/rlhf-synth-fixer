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
                enableNotifications: false,
                enableObjectLock: true,
                enableBucketPolicy: false,
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
                enableBucketPolicy: false, // Temporarily disabled to resolve access issues
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
                enableBucketPolicy: false, // Temporarily disabled to resolve access issues
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
                enableBucketPolicy: false, // Temporarily disabled to resolve access issues
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic2VjdXJpdHktc3RhY2suanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJzZWN1cml0eS1zdGFjay50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFBQSxpREFBbUM7QUFDbkMsdURBQXlDO0FBQ3pDLHlDQUE0QztBQUM1QyxzREFBeUQ7QUFDekQsbUZBQStFO0FBQy9FLHdDQUl3QjtBQUN4Qix3Q0FBd0M7QUFDeEMsc0NBQStDO0FBQy9DLDJEQUFtRTtBQUNuRSxvRUFJc0M7QUFTdEMsTUFBYSxhQUFjLFNBQVEsTUFBTSxDQUFDLGlCQUFpQjtJQUN6RCxhQUFhO0lBQ0csaUJBQWlCLENBQXdCO0lBQ3pDLGdCQUFnQixDQUF3QjtJQUN4QyxlQUFlLENBQXdCO0lBQ3ZDLGNBQWMsQ0FBd0I7SUFFdEQsV0FBVztJQUNLLFVBQVUsQ0FBd0I7SUFDbEMsV0FBVyxDQUF3QjtJQUNuQyxrQkFBa0IsQ0FBd0I7SUFDMUMsbUJBQW1CLENBQXdCO0lBRTNELFlBQVk7SUFDSSxpQkFBaUIsQ0FBd0I7SUFDekMsWUFBWSxDQUF3QjtJQUVwRCxhQUFhO0lBQ0csYUFBYSxDQUF3QjtJQUNyQyxxQkFBcUIsQ0FBd0I7SUFFN0Qsb0JBQW9CO0lBQ0osaUJBQWlCLENBQXdCO0lBQ3pDLHVCQUF1QixDQUF3QjtJQUMvQyxtQkFBbUIsQ0FBd0I7SUFDM0MsNkJBQTZCLENBQXdCO0lBQ3JELHNCQUFzQixDQUF3QjtJQUU5RCxzQkFBc0I7SUFDTixNQUFNLENBQVM7SUFFL0IsWUFDRSxJQUFZLEVBQ1osSUFBd0IsRUFDeEIsSUFBc0M7UUFFdEMsS0FBSyxDQUFDLDRCQUE0QixFQUFFLElBQUksRUFBRSxJQUFJLEVBQUUsSUFBSSxDQUFDLENBQUM7UUFFdEQsTUFBTSxpQkFBaUIsR0FBRyxJQUFJLEVBQUUsaUJBQWlCLElBQUksS0FBSyxDQUFDO1FBQzNELE1BQU0sSUFBSSxHQUFHLElBQUksRUFBRSxJQUFJLElB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RUFBRSxJQUFJLENBQUMsV0FBVztZQUM3QixrQkFBa0IsRUFBRSxJQUFJLENBQUMsa0JBQWtCO1lBQzNDLG1CQUFtQixFQUFFLElBQUksQ0FBQyxtQkFBbUI7WUFDN0MsaUJBQWlCLEVBQUUsSUFBSSxDQUFDLGlCQUFpQjtZQUN6QyxZQUFZLEVBQUUsSUFBSSxDQUFDLFlBQVk7WUFDL0IsYUFBYSxFQUFFLElBQUksQ0FBQyxhQUFhO1lBQ2pDLHFCQUFxQixFQUFFLElBQUksQ0FBQyxxQkFBcUI7WUFDakQsaUJBQWlCLEVBQUUsSUFBSSxDQUFDLGlCQUFpQjtZQUN6Qyx1QkFBdUIsRUFBRSxJQUFJLENBQUMsdUJBQXVCO1lBQ3JELG1CQUFtQixFQUFFLElBQUksQ0FBQyxtQkFBbUI7WUFDN0MsNkJBQTZCLEVBQUUsSUFBSSxDQUFDLDZCQUE2QjtZQUNqRSxzQkFBc0IsRUFBRSxJQUFJLENBQUMsc0JBQXNCO1lBQ25ELE1BQU0sRUFBRSxJQUFJLENBQUMsTUFBTTtTQUNwQixDQUFDLENBQUM7SUFDTCxDQUFDO0NBQ0Y7QUF4ZEQsc0NBd2RDIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0ICogYXMgYXdzIGZyb20gJ0BwdWx1bWkvYXdzJztcbmltcG9ydCAqIGFzIHB1bHVtaSBmcm9tICdAcHVsdW1pL3B1bHVtaSc7XG5pbXBvcnQgeyBjb21tb25UYWdzIH0gZnJvbSAnLi4vY29uZmlnL3RhZ3MnO1xuaW1wb3J0IHsgU2VjdXJlQ2xvdWRUcmFpbCB9IGZyb20gJy4uL21vZHVsZXMvY2xvdWR0cmFpbCc7XG5pbXBvcnQgeyBFbmhhbmNlZENsb3VkVHJhaWwgfSBmcm9tICcuLi9tb2R1bGVzL2Nsb3VkdHJhaWwvZW5oYW5jZWQtY2xvdWR0cmFpbCc7XG5pbXBvcnQge1xuICBTZWN1cmVJQU1Sb2xlLFxuICBjcmVhdGVNRkFFbmZvcmNlZFBvbGljeSxcbiAgY3JlYXRlUzNBY2Nlc3NQb2xpY3ksXG59IGZyb20gJy4uL21vZHVsZXMvaWFtJztcbmltcG9ydCB7IEtNU0tleSB9IGZyb20gJy4uL21vZHVsZXMva21zJztcbmltcG9ydCB7IFNlY3VyZVMzQnVja2V0IH0gZnJvbSAnLi4vbW9kdWxlcy9zMyc7XG5pbXBvcnQgeyBFbmhhbmNlZFNlY3VyZVMzQnVja2V0IH0gZnJvbSAnLi4vbW9kdWxlcy9zMy9lbmhhbmNlZC1zMyc7XG5pbXBvcnQge1xuICBTZWN1cml0eVBvbGljaWVzLFxuICBjcmVhdGVSZXN0cmljdGVkQXVkaXRQb2xpY3ksXG4gIGNyZWF0ZVRpbWVCYXNlZFMzQWNjZXNzUG9saWN5LFxufSBmcm9tICcuLi9tb2R1bGVzL3NlY3VyaXR5LXBvbGljaWVzJztcblxuZXhwb3J0IGludGVyZmFjZSBTZWN1cml0eVN0YWNrQXJncyB7XG4gIGVudmlyb25tZW50U3VmZml4Pzogc3RyaW5nO1xuICB0YWdzPzogcHVsdW1pLklucHV0PHsgW2tleTogc3RyaW5nXTogc3RyaW5nIH0+O1xuICBhbGxvd2VkSXBSYW5nZXM/OiBzdHJpbmdbXTtcbiAgZW5hYmxlRW5oYW5jZWRTZWN1cml0eT86IGJvb2xlYW47XG59XG5cbmV4cG9ydCBjbGFzcyBTZWN1cml0eVN0YWNrIGV4dGVuZHMgcHVsdW1pLkNvbXBvbmVudFJlc291cmNlIHtcbiAgLy8gUzMgQnVja2V0c1xuICBwdWJsaWMgcmVhZG9ubHkgcHJpbWFyeUJ1Y2tldE5hbWU6IHB1bHVtaS5PdXRwdXQ8c3RyaW5nPjtcbiAgcHVibGljIHJlYWRvbmx5IHByaW1hcnlCdWNrZXRBcm46IHB1bHVtaS5PdXRwdXQ8c3RyaW5nPjtcbiAgcHVibGljIHJlYWRvbmx5IGF1ZGl0QnVja2V0TmFtZTogcHVsdW1pLk91dHB1dDxzdHJpbmc+O1xuICBwdWJsaWMgcmVhZG9ubHkgYXVkaXRCdWNrZXRBcm46IHB1bHVtaS5PdXRwdXQ8c3RyaW5nPjtcblxuICAvLyBLTVMgS2V5c1xuICBwdWJsaWMgcmVhZG9ubHkgczNLbXNLZXlJZDogcHVsdW1pLk91dHB1dDxzdHJpbmc+O1xuICBwdWJsaWMgcmVhZG9ubHkgczNLbXNLZXlBcm46IHB1bHVtaS5PdXRwdXQ8c3RyaW5nPjtcbiAgcHVibGljIHJlYWRvbmx5IGNsb3VkVHJhaWxLbXNLZXlJZDogcHVsdW1pLk91dHB1dDxzdHJpbmc+O1xuICBwdWJsaWMgcmVhZG9ubHkgY2xvdWRUcmFpbEttc0tleUFybjogcHVsdW1pLk91dHB1dDxzdHJpbmc+O1xuXG4gIC8vIElBTSBSb2xlc1xuICBwdWJsaWMgcmVhZG9ubHkgZGF0YUFjY2Vzc1JvbGVBcm46IHB1bHVtaS5PdXRwdXQ8c3RyaW5nPjtcbiAgcHVibGljIHJlYWRvbmx5IGF1ZGl0Um9sZUFybjogcHVsdW1pLk91dHB1dDxzdHJpbmc+O1xuXG4gIC8vIENsb3VkVHJhaWxcbiAgcHVibGljIHJlYWRvbmx5IGNsb3VkVHJhaWxBcm46IHB1bHVtaS5PdXRwdXQ8c3RyaW5nPjtcbiAgcHVibGljIHJlYWRvbmx5IGNsb3VkVHJhaWxMb2dHcm91cEFybjogcHVsdW1pLk91dHB1dDxzdHJpbmc+O1xuXG4gIC8vIFNlY3VyaXR5IFBvbGljaWVzXG4gIHB1YmxpYyByZWFkb25seSBzZWN1cml0eVBvbGljeUFybjogcHVsdW1pLk91dHB1dDxzdHJpbmc+O1xuICBwdWJsaWMgcmVhZG9ubHkgbWZhRW5mb3JjZW1lbnRQb2xpY3lBcm46IHB1bHVtaS5PdXRwdXQ8c3RyaW5nPjtcbiAgcHVibGljIHJlYWRvbmx5IHMzU2VjdXJpdHlQb2xpY3lBcm46IHB1bHVtaS5PdXRwdXQ8c3RyaW5nPjtcbiAgcHVibGljIHJlYWRvbmx5IGNsb3VkVHJhaWxQcm90ZWN0aW9uUG9saWN5QXJuOiBwdWx1bWkuT3V0cHV0PHN0cmluZz47XG4gIHB1YmxpYyByZWFkb25seSBrbXNQcm90ZWN0aW9uUG9saWN5QXJuOiBwdWx1bWkuT3V0cHV0PHN0cmluZz47XG5cbiAgLy8gUmVnaW9uIGNvbmZpcm1hdGlvblxuICBwdWJsaWMgcmVhZG9ubHkgcmVnaW9uOiBzdHJpbmc7XG5cbiAgY29uc3RydWN0b3IoXG4gICAgbmFtZTogc3RyaW5nLFxuICAgIGFyZ3M/OiBTZWN1cml0eVN0YWNrQXJncyxcbiAgICBvcHRzPzogcHVsdW1pLkNvbXBvbmVudFJlc291cmNlT3B0aW9uc1xuICApIHtcbiAgICBzdXBlcigndGFwOnNlY3VyaXR5OlNlY3VyaXR5U3RhY2snLCBuYW1lLCBhcmdzLCBvcHRzKTtcblxuICAgIGNvbnN0IGVudmlyb25tZW50U3VmZml4ID0gYXJncz8uZW52aXJvbm1lbnRTdWZmaXggfHwgJ2Rldic7XG4gICAgY29uc3QgdGFncyA9IGFyZ3M/LnRhZ3MgfHwge307XG4gICAgY29uc3QgYWxsb3dlZElwUmFuZ2VzID0gYXJncz8uYWxsb3dlZElwUmFuZ2VzIHx8IFsnMjAzLjAuMTEzLjAvMjQnXTtcbiAgICBjb25zdCBlbmFibGVFbmhhbmNlZFNlY3VyaXR5ID0gYXJncz8uZW5hYmxlRW5oYW5jZWRTZWN1cml0eSA/PyB0cnVlO1xuXG4gICAgLy8gQ29uZmlndXJlIEFXUyBwcm92aWRlciBmb3IgdXMtZWFzdC0xXG4gICAgY29uc3QgcHJvdmlkZXIgPSBuZXcgYXdzLlByb3ZpZGVyKFxuICAgICAgJ2F3cy1wcm92aWRlcicsXG4gICAgICB7XG4gICAgICAgIHJlZ2lvbjogJ3VzLWVhc3QtMScsXG4gICAgICB9LFxuICAgICAgeyBwYXJlbnQ6IHRoaXMgfVxuICAgICk7XG5cbiAgICAvLyBHZXQgYWNjb3VudCBJRCBmb3IgSUFNIHJvbGUgcG9saWNpZXNcbiAgICBjb25zdCBhY2NvdW50SWQgPSBhd3MuZ2V0Q2FsbGVySWRlbnRpdHkoKS50aGVuKGlkID0+IGlkLmFjY291bnRJZCk7XG5cbiAgICAvLyBDcmVhdGUgZW5oYW5jZWQgc2VjdXJpdHkgcG9saWNpZXNcbiAgICBjb25zdCBzZWN1cml0eVBvbGljaWVzID0gbmV3IFNlY3VyaXR5UG9saWNpZXMoXG4gICAgICBgdGFwLXNlY3VyaXR5LXBvbGljaWVzLSR7ZW52aXJvbm1lbnRTdWZmaXh9YCxcbiAgICAgIHtcbiAgICAgICAgZW52aXJvbm1lbnRTdWZmaXgsXG4gICAgICAgIHRhZ3M6IGNvbW1vblRhZ3MsXG4gICAgICB9LFxuICAgICAgeyBwYXJlbnQ6IHRoaXMsIHByb3ZpZGVyIH1cbiAgICApO1xuXG4gICAgLy8gQ3JlYXRlIEtNUyBrZXlzIGZvciBlbmNyeXB0aW9uXG4gICAgY29uc3QgczNLbXNLZXkgPSBuZXcgS01TS2V5KFxuICAgICAgYHMzLWVuY3J5cHRpb24tJHtlbnZpcm9ubWVudFN1ZmZpeH1gLFxuICAgICAge1xuICAgICAgICBkZXNjcmlwdGlvbjogYEtNUyBrZXkgZm9yIFMzIGJ1Y2tldCBlbmNyeXB0aW9uIC0gJHtlbnZpcm9ubWVudFN1ZmZpeH0gZW52aXJvbm1lbnRgLFxuICAgICAgICB0YWdzOiB7XG4gICAgICAgICAgUHVycG9zZTogJ1MzIEVuY3J5cHRpb24nLFxuICAgICAgICAgIEVudmlyb25tZW50OiBlbnZpcm9ubWVudFN1ZmZpeCxcbiAgICAgICAgfSxcbiAgICAgIH0sXG4gICAgICB7IHBhcmVudDogdGhpcywgcHJvdmlkZXIgfVxuICAgICk7XG5cbiAgICBjb25zdCBjbG91ZFRyYWlsS21zS2V5ID0gbmV3IEtNU0tleShcbiAgICAgIGBjbG91ZHRyYWlsLWVuY3J5cHRpb24tJHtlbnZpcm9ubWVudFN1ZmZpeH1gLFxuICAgICAge1xuICAgICAgICBkZXNjcmlwdGlvbjogYEtNUyBrZXkgZm9yIENsb3VkVHJhaWwgbG9nIGVuY3J5cHRpb24gLSAke2Vudmlyb25tZW50U3VmZml4fSBlbnZpcm9ubWVudGAsXG4gICAgICAgIHRhZ3M6IHtcbiAgICAgICAgICBQdXJwb3NlOiAnQ2xvdWRUcmFpbCBFbmNyeXB0aW9uJyxcbiAgICAgICAgICBFbnZpcm9ubWVudDogZW52aXJvbm1lbnRTdWZmaXgsXG4gICAgICAgIH0sXG4gICAgICB9LFxuICAgICAgeyBwYXJlbnQ6IHRoaXMsIHByb3ZpZGVyIH1cbiAgICApO1xuXG4gICAgLy8gQ3JlYXRlIHNlY3VyZSBTMyBidWNrZXRzIHdpdGggZW5oYW5jZWQgc2VjdXJpdHlcbiAgICBsZXQgcHJpbWFyeUJ1Y2tldDogU2VjdXJlUzNCdWNrZXQgfCBFbmhhbmNlZFNlY3VyZVMzQnVja2V0O1xuICAgIGxldCBhdWRpdEJ1Y2tldDogU2VjdXJlUzNCdWNrZXQgfCBFbmhhbmNlZFNlY3VyZVMzQnVja2V0O1xuXG4gICAgaWYgKGVuYWJsZUVuaGFuY2VkU2VjdXJpdHkpIHtcbiAgICAgIHByaW1hcnlCdWNrZXQgPSBuZXcgRW5oYW5jZWRTZWN1cmVTM0J1Y2tldChcbiAgICAgICAgYHRhcC1wcmltYXJ5LXN0b3JhZ2UtJHtlbnZpcm9ubWVudFN1ZmZpeH1gLFxuICAgICAgICB7XG4gICAgICAgICAgYnVja2V0TmFtZTogYHRhcC1wcmltYXJ5LXN0b3JhZ2UtJHtlbnZpcm9ubWVudFN1ZmZpeH1gLFxuICAgICAgICAgIGttc0tleUlkOiBzM0ttc0tleS5rZXkua2V5SWQsXG4gICAgICAgICAgYWxsb3dlZElwUmFuZ2VzLFxuICAgICAgICAgIGVuYWJsZUFjY2Vzc0xvZ2dpbmc6IHRydWUsXG4gICAgICAgICAgZW5hYmxlTm90aWZpY2F0aW9uczogZmFsc2UsXG4gICAgICAgICAgZW5hYmxlT2JqZWN0TG9jazogdHJ1ZSxcbiAgICAgICAgICBlbmFibGVCdWNrZXRQb2xpY3k6IGZhbHNlLFxuICAgICAgICAgIGxpZmVjeWNsZVJ1bGVzOiBbXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgIGlkOiAndHJhbnNpdGlvbi10by1pYScsXG4gICAgICAgICAgICAgIHN0YXR1czogJ0VuYWJsZWQnLFxuICAgICAgICAgICAgICB0cmFuc2l0aW9uczogW1xuICAgICAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICAgIGRheXM6IDMwLFxuICAgICAgICAgICAgICAgICAgc3RvcmFnZUNsYXNzOiAnU1RBTkRBUkRfSUEnLFxuICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgICAgZGF5czogOTAsXG4gICAgICAgICAgICAgICAgICBzdG9yYWdlQ2xhc3M6ICdHTEFDSUVSJyxcbiAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICAgIGRheXM6IDM2NSxcbiAgICAgICAgICAgICAgICAgIHN0b3JhZ2VDbGFzczogJ0RFRVBfQVJDSElWRScsXG4gICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgXSxcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgXSxcbiAgICAgICAgICB0YWdzOiB7XG4gICAgICAgICAgICBQdXJwb3NlOiAnUHJpbWFyeSBkYXRhIHN0b3JhZ2Ugd2l0aCBlbmhhbmNlZCBzZWN1cml0eScsXG4gICAgICAgICAgICBFbnZpcm9ubWVudDogZW52aXJvbm1lbnRTdWZmaXgsXG4gICAgICAgICAgfSxcbiAgICAgICAgfSxcbiAgICAgICAgeyBwYXJlbnQ6IHRoaXMsIHByb3ZpZGVyIH1cbiAgICAgICk7XG5cbiAgICAgIGF1ZGl0QnVja2V0ID0gbmV3IEVuaGFuY2VkU2VjdXJlUzNCdWNrZXQoXG4gICAgICAgIGB0YXAtYXVkaXQtbG9ncy0ke2Vudmlyb25tZW50U3VmZml4fWAsXG4gICAgICAgIHtcbiAgICAgICAgICBidWNrZXROYW1lOiBgdGFwLWF1ZGl0LWxvZ3MtJHtlbnZpcm9ubWVudFN1ZmZpeH1gLFxuICAgICAgICAgIGttc0tleUlkOiBjbG91ZFRyYWlsS21zS2V5LmtleS5hcm4sXG4gICAgICAgICAgYWxsb3dlZElwUmFuZ2VzLFxuICAgICAgICAgIGVuYWJsZUFjY2Vzc0xvZ2dpbmc6IHRydWUsXG4gICAgICAgICAgZW5hYmxlT2JqZWN0TG9jazogdHJ1ZSxcbiAgICAgICAgICBlbmFibGVCdWNrZXRQb2xpY3k6IGZhbHNlLCAvLyBUZW1wb3JhcmlseSBkaXNhYmxlZCB0byByZXNvbHZlIGFjY2VzcyBpc3N1ZXNcbiAgICAgICAgICB0YWdzOiB7XG4gICAgICAgICAgICBQdXJwb3NlOiAnQXVkaXQgYW5kIGNvbXBsaWFuY2UgbG9ncyB3aXRoIGVuaGFuY2VkIHNlY3VyaXR5JyxcbiAgICAgICAgICAgIEVudmlyb25tZW50OiBlbnZpcm9ubWVudFN1ZmZpeCxcbiAgICAgICAgICB9LFxuICAgICAgICB9LFxuICAgICAgICB7IHBhcmVudDogdGhpcywgcHJvdmlkZXIgfVxuICAgICAgKTtcbiAgICB9IGVsc2Uge1xuICAgICAgcHJpbWFyeUJ1Y2tldCA9IG5ldyBTZWN1cmVTM0J1Y2tldChcbiAgICAgICAgYHRhcC1wcmltYXJ5LXN0b3JhZ2UtJHtlbnZpcm9ubWVudFN1ZmZpeH1gLFxuICAgICAgICB7XG4gICAgICAgICAgYnVja2V0TmFtZTogYHRhcC1wcmltYXJ5LXN0b3JhZ2UtJHtlbnZpcm9ubWVudFN1ZmZpeH1gLFxuICAgICAgICAgIGttc0tleUlkOiBzM0ttc0tleS5rZXkua2V5SWQsXG4gICAgICAgICAgZW5hYmxlQnVja2V0UG9saWN5OiBmYWxzZSwgLy8gVGVtcG9yYXJpbHkgZGlzYWJsZWQgdG8gcmVzb2x2ZSBhY2Nlc3MgaXNzdWVzXG4gICAgICAgICAgbGlmZWN5Y2xlUnVsZXM6IFtcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgaWQ6ICd0cmFuc2l0aW9uLXRvLWlhJyxcbiAgICAgICAgICAgICAgc3RhdHVzOiAnRW5hYmxlZCcsXG4gICAgICAgICAgICAgIHRyYW5zaXRpb25zOiBbXG4gICAgICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgICAgZGF5czogMzAsXG4gICAgICAgICAgICAgICAgICBzdG9yYWdlQ2xhc3M6ICdTVEFOREFSRF9JQScsXG4gICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgICBkYXlzOiA5MCxcbiAgICAgICAgICAgICAgICAgIHN0b3JhZ2VDbGFzczogJ0dMQUNJRVInLFxuICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgICAgZGF5czogMzY1LFxuICAgICAgICAgICAgICAgICAgc3RvcmFnZUNsYXNzOiAnREVFUF9BUkNISVZFJyxcbiAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICBdLFxuICAgICAgICAgICAgfSxcbiAgICAgICAgICBdLFxuICAgICAgICAgIHRhZ3M6IHtcbiAgICAgICAgICAgIFB1cnBvc2U6ICdQcmltYXJ5IGRhdGEgc3RvcmFnZScsXG4gICAgICAgICAgICBFbnZpcm9ubWVudDogZW52aXJvbm1lbnRTdWZmaXgsXG4gICAgICAgICAgfSxcbiAgICAgICAgfSxcbiAgICAgICAgeyBwYXJlbnQ6IHRoaXMsIHByb3ZpZGVyIH1cbiAgICAgICk7XG5cbiAgICAgIGF1ZGl0QnVja2V0ID0gbmV3IFNlY3VyZVMzQnVja2V0KFxuICAgICAgICBgdGFwLWF1ZGl0LWxvZ3MtJHtlbnZpcm9ubWVudFN1ZmZpeH1gLFxuICAgICAgICB7XG4gICAgICAgICAgYnVja2V0TmFtZTogYHRhcC1hdWRpdC1sb2dzLSR7ZW52aXJvbm1lbnRTdWZmaXh9YCxcbiAgICAgICAgICBrbXNLZXlJZDogY2xvdWRUcmFpbEttc0tleS5rZXkuYXJuLFxuICAgICAgICAgIGVuYWJsZUJ1Y2tldFBvbGljeTogZmFsc2UsIC8vIFRlbXBvcmFyaWx5IGRpc2FibGVkIHRvIHJlc29sdmUgYWNjZXNzIGlzc3Vlc1xuICAgICAgICAgIHRhZ3M6IHtcbiAgICAgICAgICAgIFB1cnBvc2U6ICdBdWRpdCBhbmQgY29tcGxpYW5jZSBsb2dzJyxcbiAgICAgICAgICAgIEVudmlyb25tZW50OiBlbnZpcm9ubWVudFN1ZmZpeCxcbiAgICAgICAgICB9LFxuICAgICAgICB9LFxuICAgICAgICB7IHBhcmVudDogdGhpcywgcHJvdmlkZXIgfVxuICAgICAgKTtcbiAgICB9XG5cbiAgICAvLyBDcmVhdGUgSUFNIHJvbGVzIHdpdGggZW5oYW5jZWQgbGVhc3QgcHJpdmlsZWdlIGFuZCBNRkEgZW5mb3JjZW1lbnRcbiAgICBjb25zdCBkYXRhQWNjZXNzUm9sZSA9IG5ldyBTZWN1cmVJQU1Sb2xlKFxuICAgICAgYHRhcC1kYXRhLWFjY2Vzcy0ke2Vudmlyb25tZW50U3VmZml4fWAsXG4gICAgICB7XG4gICAgICAgIGFzc3VtZVJvbGVQb2xpY3k6IHB1bHVtaS5hbGwoW2FjY291bnRJZF0pLmFwcGx5KChbYWNjb3VudElkXSkgPT5cbiAgICAgICAgICBKU09OLnN0cmluZ2lmeSh7XG4gICAgICAgICAgICBWZXJzaW9uOiAnMjAxMi0xMC0xNycsXG4gICAgICAgICAgICBTdGF0ZW1lbnQ6IFtcbiAgICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgIEFjdGlvbjogJ3N0czpBc3N1bWVSb2xlJyxcbiAgICAgICAgICAgICAgICBFZmZlY3Q6ICdBbGxvdycsXG4gICAgICAgICAgICAgICAgUHJpbmNpcGFsOiB7XG4gICAgICAgICAgICAgICAgICBBV1M6IGBhcm46YXdzOmlhbTo6JHthY2NvdW50SWR9OnJvb3RgLFxuICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgQ29uZGl0aW9uOiB7XG4gICAgICAgICAgICAgICAgICBCb29sOiB7XG4gICAgICAgICAgICAgICAgICAgICdhd3M6TXVsdGlGYWN0b3JBdXRoUHJlc2VudCc6ICd0cnVlJyxcbiAgICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgICBTdHJpbmdFcXVhbHM6IHtcbiAgICAgICAgICAgICAgICAgICAgJ2F3czpSZXF1ZXN0ZWRSZWdpb24nOiAndXMtZWFzdC0xJyxcbiAgICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgICBJcEFkZHJlc3M6IHtcbiAgICAgICAgICAgICAgICAgICAgJ2F3czpTb3VyY2VJcCc6IGFsbG93ZWRJcFJhbmdlcyxcbiAgICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIF0sXG4gICAgICAgICAgfSlcbiAgICAgICAgKSxcbiAgICAgICAgcm9sZU5hbWU6IGB0YXAtZGF0YS1hY2Nlc3Mtcm9sZS0ke2Vudmlyb25tZW50U3VmZml4fWAsXG4gICAgICAgIHBvbGljaWVzOiBlbmFibGVFbmhhbmNlZFNlY3VyaXR5XG4gICAgICAgICAgPyBbXG4gICAgICAgICAgICAgIGNyZWF0ZVRpbWVCYXNlZFMzQWNjZXNzUG9saWN5KHByaW1hcnlCdWNrZXQuYnVja2V0LmFybiksXG4gICAgICAgICAgICAgIGNyZWF0ZU1GQUVuZm9yY2VkUG9saWN5KCksXG4gICAgICAgICAgICBdXG4gICAgICAgICAgOiBbXG4gICAgICAgICAgICAgIGNyZWF0ZVMzQWNjZXNzUG9saWN5KHByaW1hcnlCdWNrZXQuYnVja2V0LmFybiksXG4gICAgICAgICAgICAgIGNyZWF0ZU1GQUVuZm9yY2VkUG9saWN5KCksXG4gICAgICAgICAgICBdLFxuICAgICAgICBtYW5hZ2VkUG9saWN5QXJuczogW10sXG4gICAgICAgIHJlcXVpcmVNRkE6IHRydWUsXG4gICAgICAgIHRhZ3M6IHtcbiAgICAgICAgICBQdXJwb3NlOlxuICAgICAgICAgICAgJ0RhdGEgYWNjZXNzIHdpdGggZW5oYW5jZWQgTUZBIGVuZm9yY2VtZW50IGFuZCB0aW1lIHJlc3RyaWN0aW9ucycsXG4gICAgICAgICAgRW52aXJvbm1lbnQ6IGVudmlyb25tZW50U3VmZml4LFxuICAgICAgICB9LFxuICAgICAgfSxcbiAgICAgIHsgcGFyZW50OiB0aGlzLCBwcm92aWRlciB9XG4gICAgKTtcblxuICAgIGNvbnN0IGF1ZGl0Um9sZSA9IG5ldyBTZWN1cmVJQU1Sb2xlKFxuICAgICAgYHRhcC1hdWRpdC1hY2Nlc3MtJHtlbnZpcm9ubWVudFN1ZmZpeH1gLFxuICAgICAge1xuICAgICAgICBhc3N1bWVSb2xlUG9saWN5OiBwdWx1bWkuYWxsKFthY2NvdW50SWRdKS5hcHBseSgoW2FjY291bnRJZF0pID0+XG4gICAgICAgICAgSlNPTi5zdHJpbmdpZnkoe1xuICAgICAgICAgICAgVmVyc2lvbjogJzIwMTItMTAtMTcnLFxuICAgICAgICAgICAgU3RhdGVtZW50OiBbXG4gICAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICBBY3Rpb246ICdzdHM6QXNzdW1lUm9sZScsXG4gICAgICAgICAgICAgICAgRWZmZWN0OiAnQWxsb3cnLFxuICAgICAgICAgICAgICAgIFByaW5jaXBhbDoge1xuICAgICAgICAgICAgICAgICAgQVdTOiBgYXJuOmF3czppYW06OiR7YWNjb3VudElkfTpyb290YCxcbiAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgIENvbmRpdGlvbjoge1xuICAgICAgICAgICAgICAgICAgQm9vbDoge1xuICAgICAgICAgICAgICAgICAgICAnYXdzOk11bHRpRmFjdG9yQXV0aFByZXNlbnQnOiAndHJ1ZScsXG4gICAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgICAgU3RyaW5nRXF1YWxzOiB7XG4gICAgICAgICAgICAgICAgICAgICdhd3M6UmVxdWVzdGVkUmVnaW9uJzogJ3VzLWVhc3QtMScsXG4gICAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgICAgSXBBZGRyZXNzOiB7XG4gICAgICAgICAgICAgICAgICAgICdhd3M6U291cmNlSXAnOiBhbGxvd2VkSXBSYW5nZXMsXG4gICAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBdLFxuICAgICAgICAgIH0pXG4gICAgICAgICksXG4gICAgICAgIHJvbGVOYW1lOiBgdGFwLWF1ZGl0LWFjY2Vzcy1yb2xlLSR7ZW52aXJvbm1lbnRTdWZmaXh9YCxcbiAgICAgICAgcG9saWNpZXM6IGVuYWJsZUVuaGFuY2VkU2VjdXJpdHlcbiAgICAgICAgICA/IFtcbiAgICAgICAgICAgICAgY3JlYXRlUmVzdHJpY3RlZEF1ZGl0UG9saWN5KFxuICAgICAgICAgICAgICAgIGF1ZGl0QnVja2V0LmJ1Y2tldC5hcm4sXG4gICAgICAgICAgICAgICAgYWxsb3dlZElwUmFuZ2VzXG4gICAgICAgICAgICAgICksXG4gICAgICAgICAgICBdXG4gICAgICAgICAgOiBbXG4gICAgICAgICAgICAgIHB1bHVtaS5pbnRlcnBvbGF0ZWB7XG4gICAgICAgICAgXCJWZXJzaW9uXCI6IFwiMjAxMi0xMC0xN1wiLFxuICAgICAgICAgIFwiU3RhdGVtZW50XCI6IFtcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgXCJFZmZlY3RcIjogXCJBbGxvd1wiLFxuICAgICAgICAgICAgICBcIkFjdGlvblwiOiBbXG4gICAgICAgICAgICAgICAgXCJzMzpHZXRPYmplY3RcIixcbiAgICAgICAgICAgICAgICBcInMzOkxpc3RCdWNrZXRcIlxuICAgICAgICAgICAgICBdLFxuICAgICAgICAgICAgICBcIlJlc291cmNlXCI6IFtcbiAgICAgICAgICAgICAgICBcIiR7YXVkaXRCdWNrZXQuYnVja2V0LmFybn1cIixcbiAgICAgICAgICAgICAgICBcIiR7YXVkaXRCdWNrZXQuYnVja2V0LmFybn0vKlwiXG4gICAgICAgICAgICAgIF1cbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgIFwiRWZmZWN0XCI6IFwiQWxsb3dcIixcbiAgICAgICAgICAgICAgXCJBY3Rpb25cIjogW1xuICAgICAgICAgICAgICAgIFwiY2xvdWR0cmFpbDpMb29rdXBFdmVudHNcIixcbiAgICAgICAgICAgICAgICBcImNsb3VkdHJhaWw6R2V0VHJhaWxTdGF0dXNcIlxuICAgICAgICAgICAgICBdLFxuICAgICAgICAgICAgICBcIlJlc291cmNlXCI6IFwiKlwiXG4gICAgICAgICAgICB9XG4gICAgICAgICAgXVxuICAgICAgICB9YCxcbiAgICAgICAgICAgIF0sXG4gICAgICAgIG1hbmFnZWRQb2xpY3lBcm5zOiBbJ2Fybjphd3M6aWFtOjphd3M6cG9saWN5L1JlYWRPbmx5QWNjZXNzJ10sXG4gICAgICAgIHJlcXVpcmVNRkE6IHRydWUsXG4gICAgICAgIHRhZ3M6IHtcbiAgICAgICAgICBQdXJwb3NlOiAnQXVkaXQgbG9nIGFjY2VzcyB3aXRoIElQIGFuZCB0aW1lIHJlc3RyaWN0aW9ucycsXG4gICAgICAgICAgRW52aXJvbm1lbnQ6IGVudmlyb25tZW50U3VmZml4LFxuICAgICAgICB9LFxuICAgICAgfSxcbiAgICAgIHsgcGFyZW50OiB0aGlzLCBwcm92aWRlciB9XG4gICAgKTtcblxuICAgIC8vIENyZWF0ZSBDbG91ZFRyYWlsIGZvciBjb21wcmVoZW5zaXZlIGxvZ2dpbmdcbiAgICBsZXQgY2xvdWRUcmFpbDogU2VjdXJlQ2xvdWRUcmFpbCB8IEVuaGFuY2VkQ2xvdWRUcmFpbDtcblxuICAgIGlmIChlbmFibGVFbmhhbmNlZFNlY3VyaXR5KSB7XG4gICAgICBjbG91ZFRyYWlsID0gbmV3IEVuaGFuY2VkQ2xvdWRUcmFpbChcbiAgICAgICAgYHRhcC1zZWN1cml0eS1hdWRpdC0ke2Vudmlyb25tZW50U3VmZml4fWAsXG4gICAgICAgIHtcbiAgICAgICAgICB0cmFpbE5hbWU6IGB0YXAtc2VjdXJpdHktYXVkaXQtdHJhaWwtJHtlbnZpcm9ubWVudFN1ZmZpeH1gLFxuICAgICAgICAgIHMzQnVja2V0TmFtZTogYXVkaXRCdWNrZXQuYnVja2V0LmlkLFxuICAgICAgICAgIGttc0tleUlkOiBjbG91ZFRyYWlsS21zS2V5LmtleS5hcm4sXG4gICAgICAgICAgaW5jbHVkZUdsb2JhbFNlcnZpY2VFdmVudHM6IHRydWUsXG4gICAgICAgICAgaXNNdWx0aVJlZ2lvblRyYWlsOiB0cnVlLFxuICAgICAgICAgIGVuYWJsZUxvZ0ZpbGVWYWxpZGF0aW9uOiB0cnVlLFxuICAgICAgICAgIGVuYWJsZUluc2lnaHRTZWxlY3RvcnM6IHRydWUsXG4gICAgICAgICAgdGFnczoge1xuICAgICAgICAgICAgUHVycG9zZTpcbiAgICAgICAgICAgICAgJ0VuaGFuY2VkIHNlY3VyaXR5IGF1ZGl0IGFuZCBjb21wbGlhbmNlIHdpdGggYW5vbWFseSBkZXRlY3Rpb24nLFxuICAgICAgICAgICAgRW52aXJvbm1lbnQ6IGVudmlyb25tZW50U3VmZml4LFxuICAgICAgICAgIH0sXG4gICAgICAgIH0sXG4gICAgICAgIHsgcGFyZW50OiB0aGlzLCBwcm92aWRlciB9XG4gICAgICApO1xuICAgIH0gZWxzZSB7XG4gICAgICBjbG91ZFRyYWlsID0gbmV3IFNlY3VyZUNsb3VkVHJhaWwoXG4gICAgICAgIGB0YXAtc2VjdXJpdHktYXVkaXQtJHtlbnZpcm9ubWVudFN1ZmZpeH1gLFxuICAgICAgICB7XG4gICAgICAgICAgdHJhaWxOYW1lOiBgdGFwLXNlY3VyaXR5LWF1ZGl0LXRyYWlsLSR7ZW52aXJvbm1lbnRTdWZmaXh9YCxcbiAgICAgICAgICBzM0J1Y2tldE5hbWU6IGF1ZGl0QnVja2V0LmJ1Y2tldC5pZCxcbiAgICAgICAgICBrbXNLZXlJZDogY2xvdWRUcmFpbEttc0tleS5rZXkuYXJuLFxuICAgICAgICAgIGluY2x1ZGVHbG9iYWxTZXJ2aWNlRXZlbnRzOiB0cnVlLFxuICAgICAgICAgIGlzTXVsdGlSZWdpb25UcmFpbDogdHJ1ZSxcbiAgICAgICAgICBlbmFibGVMb2dGaWxlVmFsaWRhdGlvbjogdHJ1ZSxcbiAgICAgICAgICB0YWdzOiB7XG4gICAgICAgICAgICBQdXJwb3NlOiAnU2VjdXJpdHkgYXVkaXQgYW5kIGNvbXBsaWFuY2UnLFxuICAgICAgICAgICAgRW52aXJvbm1lbnQ6IGVudmlyb25tZW50U3VmZml4LFxuICAgICAgICAgIH0sXG4gICAgICAgIH0sXG4gICAgICAgIHsgcGFyZW50OiB0aGlzLCBwcm92aWRlciB9XG4gICAgICApO1xuICAgIH1cblxuICAgIC8vIENyZWF0ZSBhZGRpdGlvbmFsIHNlY3VyaXR5IHBvbGljaWVzIHdpdGggZW5oYW5jZWQgY29udHJvbHNcbiAgICBjb25zdCBzZWN1cml0eVBvbGljeSA9IG5ldyBhd3MuaWFtLlBvbGljeShcbiAgICAgIGB0YXAtc2VjdXJpdHktYmFzZWxpbmUtJHtlbnZpcm9ubWVudFN1ZmZpeH1gLFxuICAgICAge1xuICAgICAgICBuYW1lOiBgU2VjdXJpdHlCYXNlbGluZS0ke2Vudmlyb25tZW50U3VmZml4fWAsXG4gICAgICAgIGRlc2NyaXB0aW9uOlxuICAgICAgICAgICdFbmhhbmNlZCBiYXNlbGluZSBzZWN1cml0eSBwb2xpY3kgd2l0aCBjb21wcmVoZW5zaXZlIE1GQSByZXF1aXJlbWVudHMnLFxuICAgICAgICBwb2xpY3k6IEpTT04uc3RyaW5naWZ5KHtcbiAgICAgICAgICBWZXJzaW9uOiAnMjAxMi0xMC0xNycsXG4gICAgICAgICAgU3RhdGVtZW50OiBbXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgIFNpZDogJ1JlcXVpcmVNRkFGb3JBbGxTZW5zaXRpdmVBY3Rpb25zJyxcbiAgICAgICAgICAgICAgRWZmZWN0OiAnRGVueScsXG4gICAgICAgICAgICAgIEFjdGlvbjogW1xuICAgICAgICAgICAgICAgICdpYW06Q3JlYXRlUm9sZScsXG4gICAgICAgICAgICAgICAgJ2lhbTpEZWxldGVSb2xlJyxcbiAgICAgICAgICAgICAgICAnaWFtOkF0dGFjaFJvbGVQb2xpY3knLFxuICAgICAgICAgICAgICAgICdpYW06RGV0YWNoUm9sZVBvbGljeScsXG4gICAgICAgICAgICAgICAgJ2lhbTpQdXRSb2xlUG9saWN5JyxcbiAgICAgICAgICAgICAgICAnaWFtOkRlbGV0ZVJvbGVQb2xpY3knLFxuICAgICAgICAgICAgICAgICdzMzpEZWxldGVCdWNrZXQnLFxuICAgICAgICAgICAgICAgICdzMzpQdXRCdWNrZXRQb2xpY3knLFxuICAgICAgICAgICAgICAgICdrbXM6U2NoZWR1bGVLZXlEZWxldGlvbicsXG4gICAgICAgICAgICAgICAgJ2ttczpEaXNhYmxlS2V5JyxcbiAgICAgICAgICAgICAgICAnY2xvdWR0cmFpbDpEZWxldGVUcmFpbCcsXG4gICAgICAgICAgICAgICAgJ2Nsb3VkdHJhaWw6U3RvcExvZ2dpbmcnLFxuICAgICAgICAgICAgICBdLFxuICAgICAgICAgICAgICBSZXNvdXJjZTogJyonLFxuICAgICAgICAgICAgICBDb25kaXRpb246IHtcbiAgICAgICAgICAgICAgICBCb29sSWZFeGlzdHM6IHtcbiAgICAgICAgICAgICAgICAgICdhd3M6TXVsdGlGYWN0b3JBdXRoUHJlc2VudCc6ICdmYWxzZScsXG4gICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgIFNpZDogJ1Jlc3RyaWN0VG9VU0Vhc3QxT25seScsXG4gICAgICAgICAgICAgIEVmZmVjdDogJ0RlbnknLFxuICAgICAgICAgICAgICBBY3Rpb246ICcqJyxcbiAgICAgICAgICAgICAgUmVzb3VyY2U6ICcqJyxcbiAgICAgICAgICAgICAgQ29uZGl0aW9uOiB7XG4gICAgICAgICAgICAgICAgU3RyaW5nTm90RXF1YWxzOiB7XG4gICAgICAgICAgICAgICAgICAnYXdzOlJlcXVlc3RlZFJlZ2lvbic6ICd1cy1lYXN0LTEnLFxuICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAge1xuICAgICAgICAgICAgICBTaWQ6ICdSZXF1aXJlRW5jcnlwdGVkU3RvcmFnZScsXG4gICAgICAgICAgICAgIEVmZmVjdDogJ0RlbnknLFxuICAgICAgICAgICAgICBBY3Rpb246IFtcbiAgICAgICAgICAgICAgICAnczM6UHV0T2JqZWN0JyxcbiAgICAgICAgICAgICAgICAnZWJzOkNyZWF0ZVZvbHVtZScsXG4gICAgICAgICAgICAgICAgJ3JkczpDcmVhdGVEQkluc3RhbmNlJyxcbiAgICAgICAgICAgICAgXSxcbiAgICAgICAgICAgICAgUmVzb3VyY2U6ICcqJyxcbiAgICAgICAgICAgICAgQ29uZGl0aW9uOiB7XG4gICAgICAgICAgICAgICAgQm9vbDoge1xuICAgICAgICAgICAgICAgICAgJ2F3czpTZWN1cmVUcmFuc3BvcnQnOiAnZmFsc2UnLFxuICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICB9LFxuICAgICAgICAgIF0sXG4gICAgICAgIH0pLFxuICAgICAgICB0YWdzOiB7IC4uLmNvbW1vblRhZ3MsIC4uLnRhZ3MgfSxcbiAgICAgIH0sXG4gICAgICB7IHBhcmVudDogdGhpcywgcHJvdmlkZXIgfVxuICAgICk7XG5cbiAgICAvLyBBc3NpZ24gb3V0cHV0c1xuICAgIHRoaXMucHJpbWFyeUJ1Y2tldE5hbWUgPSBwcmltYXJ5QnVja2V0LmJ1Y2tldC5pZDtcbiAgICB0aGlzLnByaW1hcnlCdWNrZXRBcm4gPSBwcmltYXJ5QnVja2V0LmJ1Y2tldC5hcm47XG4gICAgdGhpcy5hdWRpdEJ1Y2tldE5hbWUgPSBhdWRpdEJ1Y2tldC5idWNrZXQuaWQ7XG4gICAgdGhpcy5hdWRpdEJ1Y2tldEFybiA9IGF1ZGl0QnVja2V0LmJ1Y2tldC5hcm47XG4gICAgdGhpcy5zM0ttc0tleUlkID0gczNLbXNLZXkua2V5LmtleUlkO1xuICAgIHRoaXMuczNLbXNLZXlBcm4gPSBzM0ttc0tleS5rZXkuYXJuO1xuICAgIHRoaXMuY2xvdWRUcmFpbEttc0tleUlkID0gY2xvdWRUcmFpbEttc0tleS5rZXkua2V5SWQ7XG4gICAgdGhpcy5jbG91ZFRyYWlsS21zS2V5QXJuID0gY2xvdWRUcmFpbEttc0tleS5rZXkuYXJuO1xuICAgIHRoaXMuZGF0YUFjY2Vzc1JvbGVBcm4gPSBkYXRhQWNjZXNzUm9sZS5yb2xlLmFybjtcbiAgICB0aGlzLmF1ZGl0Um9sZUFybiA9IGF1ZGl0Um9sZS5yb2xlLmFybjtcbiAgICB0aGlzLmNsb3VkVHJhaWxBcm4gPSBjbG91ZFRyYWlsLnRyYWlsLmFybjtcbiAgICB0aGlzLmNsb3VkVHJhaWxMb2dHcm91cEFybiA9IGNsb3VkVHJhaWwubG9nR3JvdXAuYXJuO1xuICAgIHRoaXMuc2VjdXJpdHlQb2xpY3lBcm4gPSBzZWN1cml0eVBvbGljeS5hcm47XG4gICAgdGhpcy5tZmFFbmZvcmNlbWVudFBvbGljeUFybiA9IHNlY3VyaXR5UG9saWNpZXMubWZhRW5mb3JjZW1lbnRQb2xpY3kuYXJuO1xuICAgIHRoaXMuczNTZWN1cml0eVBvbGljeUFybiA9IHNlY3VyaXR5UG9saWNpZXMuczNEZW55SW5zZWN1cmVQb2xpY3kuYXJuO1xuICAgIHRoaXMuY2xvdWRUcmFpbFByb3RlY3Rpb25Qb2xpY3lBcm4gPVxuICAgICAgc2VjdXJpdHlQb2xpY2llcy5jbG91ZFRyYWlsUHJvdGVjdGlvblBvbGljeS5hcm47XG4gICAgdGhpcy5rbXNQcm90ZWN0aW9uUG9saWN5QXJuID0gc2VjdXJpdHlQb2xpY2llcy5rbXNLZXlQcm90ZWN0aW9uUG9saWN5LmFybjtcbiAgICB0aGlzLnJlZ2lvbiA9ICd1cy1lYXN0LTEnO1xuXG4gICAgLy8gUmVnaXN0ZXIgdGhlIG91dHB1dHMgb2YgdGhpcyBjb21wb25lbnRcbiAgICB0aGlzLnJlZ2lzdGVyT3V0cHV0cyh7XG4gICAgICBwcmltYXJ5QnVja2V0TmFtZTogdGhpcy5wcmltYXJ5QnVja2V0TmFtZSxcbiAgICAgIHByaW1hcnlCdWNrZXRBcm46IHRoaXMucHJpbWFyeUJ1Y2tldEFybixcbiAgICAgIGF1ZGl0QnVja2V0TmFtZTogdGhpcy5hdWRpdEJ1Y2tldE5hbWUsXG4gICAgICBhdWRpdEJ1Y2tldEFybjogdGhpcy5hdWRpdEJ1Y2tldEFybixcbiAgICAgIHMzS21zS2V5SWQ6IHRoaXMuczNLbXNLZXlJZCxcbiAgICAgIHMzS21zS2V5QXJuOiB0aGlzLnMzS21zS2V5QXJuLFxuICAgICAgY2xvdWRUcmFpbEttc0tleUlkOiB0aGlzLmNsb3VkVHJhaWxLbXNLZXlJZCxcbiAgICAgIGNsb3VkVHJhaWxLbXNLZXlBcm46IHRoaXMuY2xvdWRUcmFpbEttc0tleUFybixcbiAgICAgIGRhdGFBY2Nlc3NSb2xlQXJuOiB0aGlzLmRhdGFBY2Nlc3NSb2xlQXJuLFxuICAgICAgYXVkaXRSb2xlQXJuOiB0aGlzLmF1ZGl0Um9sZUFybixcbiAgICAgIGNsb3VkVHJhaWxBcm46IHRoaXMuY2xvdWRUcmFpbEFybixcbiAgICAgIGNsb3VkVHJhaWxMb2dHcm91cEFybjogdGhpcy5jbG91ZFRyYWlsTG9nR3JvdXBBcm4sXG4gICAgICBzZWN1cml0eVBvbGljeUFybjogdGhpcy5zZWN1cml0eVBvbGljeUFybixcbiAgICAgIG1mYUVuZm9yY2VtZW50UG9saWN5QXJuOiB0aGlzLm1mYUVuZm9yY2VtZW50UG9saWN5QXJuLFxuICAgICAgczNTZWN1cml0eVBvbGljeUFybjogdGhpcy5zM1NlY3VyaXR5UG9saWN5QXJuLFxuICAgICAgY2xvdWRUcmFpbFByb3RlY3Rpb25Qb2xpY3lBcm46IHRoaXMuY2xvdWRUcmFpbFByb3RlY3Rpb25Qb2xpY3lBcm4sXG4gICAgICBrbXNQcm90ZWN0aW9uUG9saWN5QXJuOiB0aGlzLmttc1Byb3RlY3Rpb25Qb2xpY3lBcm4sXG4gICAgICByZWdpb246IHRoaXMucmVnaW9uLFxuICAgIH0pO1xuICB9XG59XG4iXX0=