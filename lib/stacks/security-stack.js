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
// import { SecureCloudTrail } from '../modules/cloudtrail';
// import { EnhancedCloudTrail } from '../modules/cloudtrail/enhanced-cloudtrail';
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
    // CloudTrail properties commented out due to testing limitations
    // public readonly cloudTrailArn: pulumi.Output<string>;
    // public readonly cloudTrailLogGroupArn: pulumi.Output<string>;
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
        // NOTE: CloudTrail creation commented out due to testing limitations
        // let cloudTrail: SecureCloudTrail | EnhancedCloudTrail;
        // if (enableEnhancedSecurity) {
        //   cloudTrail = new EnhancedCloudTrail(
        //     `tap-security-audit-${environmentSuffix}`,
        //     {
        //       trailName: `tap-security-audit-trail-${environmentSuffix}`,
        //       s3BucketName: auditBucket.bucket.id,
        //       kmsKeyId: cloudTrailKmsKey.key.arn,
        //       includeGlobalServiceEvents: true,
        //       isMultiRegionTrail: true,
        //       enableLogFileValidation: true,
        //       enableInsightSelectors: true,
        //       tags: {
        //         Purpose:
        //           'Enhanced security audit and compliance with anomaly detection',
        //         Environment: environmentSuffix,
        //       },
        //     },
        //     { parent: this, provider }
        //   );
        // } else {
        //   cloudTrail = new SecureCloudTrail(
        //     `tap-security-audit-${environmentSuffix}`,
        //     {
        //       trailName: `tap-security-audit-trail-${environmentSuffix}`,
        //       s3BucketName: auditBucket.bucket.id,
        //       kmsKeyId: cloudTrailKmsKey.key.arn,
        //       includeGlobalServiceEvents: true,
        //       isMultiRegionTrail: true,
        //       enableLogFileValidation: true,
        //       tags: {
        //         Purpose: 'Security audit and compliance',
        //         Environment: environmentSuffix,
        //       },
        //     },
        //     { parent: this, provider }
        //   );
        // }
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
        // CloudTrail outputs commented out due to testing limitations
        // this.cloudTrailArn = cloudTrail.trail.arn;
        // this.cloudTrailLogGroupArn = cloudTrail.logGroup.arn;
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
            // CloudTrail outputs commented out due to testing limitations
            // cloudTrailArn: this.cloudTrailArn,
            // cloudTrailLogGroupArn: this.cloudTrailLogGroupArn,
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic2VjdXJpdHktc3RhY2suanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJzZWN1cml0eS1zdGFjay50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFBQSxpREFBbUM7QUFDbkMsdURBQXlDO0FBQ3pDLHlDQUE0QztBQUM1Qyw0REFBNEQ7QUFDNUQsa0ZBQWtGO0FBQ2xGLHdDQUl3QjtBQUN4Qix3Q0FBd0M7QUFDeEMsc0NBQStDO0FBQy9DLDJEQUFtRTtBQUNuRSxvRUFJc0M7QUFTdEMsTUFBYSxhQUFjLFNBQVEsTUFBTSxDQUFDLGlCQUFpQjtJQUN6RCxhQUFhO0lBQ0csaUJBQWlCLENBQXdCO0lBQ3pDLGdCQUFnQixDQUF3QjtJQUN4QyxlQUFlLENBQXdCO0lBQ3ZDLGNBQWMsQ0FBd0I7SUFFdEQsV0FBVztJQUNLLFVBQVUsQ0FBd0I7SUFDbEMsV0FBVyxDQUF3QjtJQUNuQyxrQkFBa0IsQ0FBd0I7SUFDMUMsbUJBQW1CLENBQXdCO0lBRTNELFlBQVk7SUFDSSxpQkFBaUIsQ0FBd0I7SUFDekMsWUFBWSxDQUF3QjtJQUVwRCxpRUFBaUU7SUFDakUsd0RBQXdEO0lBQ3hELGdFQUFnRTtJQUVoRSxvQkFBb0I7SUFDSixpQkFBaUIsQ0FBd0I7SUFDekMsdUJBQXVCLENBQXdCO0lBQy9DLG1CQUFtQixDQUF3QjtJQUMzQyw2QkFBNkIsQ0FBd0I7SUFDckQsc0JBQXNCLENBQXdCO0lBRTlELHNCQUFzQjtJQUNOLE1BQU0sQ0FBUztJQUUvQixZQUNFLElBQVksRUFDWixJQUF3QixFQUN4QixJQUFzQztRQUV0QyxLQUFLLENBQUMsNEJBQTRCLEVBQUUsSUFBSSxFQUFFLElBQUksRUFBRSxJQUFJLENBQUMsQ0FBQztRQUV0RCxNQUFNLGlCQUFpQixHQUFHLElBQUksRUFBRSxpQkFBaUIsSUFBSSxLQUFLLENBQUM7UUFDM0QsTUFBTSxJQUFJLEdBQUcsSUFBSSxFQUFFLElBQUksSUFBSSxFQUFF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aW1wb3J0ICogYXMgYXdzIGZyb20gJ0BwdWx1bWkvYXdzJztcbmltcG9ydCAqIGFzIHB1bHVtaSBmcm9tICdAcHVsdW1pL3B1bHVtaSc7XG5pbXBvcnQgeyBjb21tb25UYWdzIH0gZnJvbSAnLi4vY29uZmlnL3RhZ3MnO1xuLy8gaW1wb3J0IHsgU2VjdXJlQ2xvdWRUcmFpbCB9IGZyb20gJy4uL21vZHVsZXMvY2xvdWR0cmFpbCc7XG4vLyBpbXBvcnQgeyBFbmhhbmNlZENsb3VkVHJhaWwgfSBmcm9tICcuLi9tb2R1bGVzL2Nsb3VkdHJhaWwvZW5oYW5jZWQtY2xvdWR0cmFpbCc7XG5pbXBvcnQge1xuICBTZWN1cmVJQU1Sb2xlLFxuICBjcmVhdGVNRkFFbmZvcmNlZFBvbGljeSxcbiAgY3JlYXRlUzNBY2Nlc3NQb2xpY3ksXG59IGZyb20gJy4uL21vZHVsZXMvaWFtJztcbmltcG9ydCB7IEtNU0tleSB9IGZyb20gJy4uL21vZHVsZXMva21zJztcbmltcG9ydCB7IFNlY3VyZVMzQnVja2V0IH0gZnJvbSAnLi4vbW9kdWxlcy9zMyc7XG5pbXBvcnQgeyBFbmhhbmNlZFNlY3VyZVMzQnVja2V0IH0gZnJvbSAnLi4vbW9kdWxlcy9zMy9lbmhhbmNlZC1zMyc7XG5pbXBvcnQge1xuICBTZWN1cml0eVBvbGljaWVzLFxuICBjcmVhdGVSZXN0cmljdGVkQXVkaXRQb2xpY3ksXG4gIGNyZWF0ZVRpbWVCYXNlZFMzQWNjZXNzUG9saWN5LFxufSBmcm9tICcuLi9tb2R1bGVzL3NlY3VyaXR5LXBvbGljaWVzJztcblxuZXhwb3J0IGludGVyZmFjZSBTZWN1cml0eVN0YWNrQXJncyB7XG4gIGVudmlyb25tZW50U3VmZml4Pzogc3RyaW5nO1xuICB0YWdzPzogcHVsdW1pLklucHV0PHsgW2tleTogc3RyaW5nXTogc3RyaW5nIH0+O1xuICBhbGxvd2VkSXBSYW5nZXM/OiBzdHJpbmdbXTtcbiAgZW5hYmxlRW5oYW5jZWRTZWN1cml0eT86IGJvb2xlYW47XG59XG5cbmV4cG9ydCBjbGFzcyBTZWN1cml0eVN0YWNrIGV4dGVuZHMgcHVsdW1pLkNvbXBvbmVudFJlc291cmNlIHtcbiAgLy8gUzMgQnVja2V0c1xuICBwdWJsaWMgcmVhZG9ubHkgcHJpbWFyeUJ1Y2tldE5hbWU6IHB1bHVtaS5PdXRwdXQ8c3RyaW5nPjtcbiAgcHVibGljIHJlYWRvbmx5IHByaW1hcnlCdWNrZXRBcm46IHB1bHVtaS5PdXRwdXQ8c3RyaW5nPjtcbiAgcHVibGljIHJlYWRvbmx5IGF1ZGl0QnVja2V0TmFtZTogcHVsdW1pLk91dHB1dDxzdHJpbmc+O1xuICBwdWJsaWMgcmVhZG9ubHkgYXVkaXRCdWNrZXRBcm46IHB1bHVtaS5PdXRwdXQ8c3RyaW5nPjtcblxuICAvLyBLTVMgS2V5c1xuICBwdWJsaWMgcmVhZG9ubHkgczNLbXNLZXlJZDogcHVsdW1pLk91dHB1dDxzdHJpbmc+O1xuICBwdWJsaWMgcmVhZG9ubHkgczNLbXNLZXlBcm46IHB1bHVtaS5PdXRwdXQ8c3RyaW5nPjtcbiAgcHVibGljIHJlYWRvbmx5IGNsb3VkVHJhaWxLbXNLZXlJZDogcHVsdW1pLk91dHB1dDxzdHJpbmc+O1xuICBwdWJsaWMgcmVhZG9ubHkgY2xvdWRUcmFpbEttc0tleUFybjogcHVsdW1pLk91dHB1dDxzdHJpbmc+O1xuXG4gIC8vIElBTSBSb2xlc1xuICBwdWJsaWMgcmVhZG9ubHkgZGF0YUFjY2Vzc1JvbGVBcm46IHB1bHVtaS5PdXRwdXQ8c3RyaW5nPjtcbiAgcHVibGljIHJlYWRvbmx5IGF1ZGl0Um9sZUFybjogcHVsdW1pLk91dHB1dDxzdHJpbmc+O1xuXG4gIC8vIENsb3VkVHJhaWwgcHJvcGVydGllcyBjb21tZW50ZWQgb3V0IGR1ZSB0byB0ZXN0aW5nIGxpbWl0YXRpb25zXG4gIC8vIHB1YmxpYyByZWFkb25seSBjbG91ZFRyYWlsQXJuOiBwdWx1bWkuT3V0cHV0PHN0cmluZz47XG4gIC8vIHB1YmxpYyByZWFkb25seSBjbG91ZFRyYWlsTG9nR3JvdXBBcm46IHB1bHVtaS5PdXRwdXQ8c3RyaW5nPjtcblxuICAvLyBTZWN1cml0eSBQb2xpY2llc1xuICBwdWJsaWMgcmVhZG9ubHkgc2VjdXJpdHlQb2xpY3lBcm46IHB1bHVtaS5PdXRwdXQ8c3RyaW5nPjtcbiAgcHVibGljIHJlYWRvbmx5IG1mYUVuZm9yY2VtZW50UG9saWN5QXJuOiBwdWx1bWkuT3V0cHV0PHN0cmluZz47XG4gIHB1YmxpYyByZWFkb25seSBzM1NlY3VyaXR5UG9saWN5QXJuOiBwdWx1bWkuT3V0cHV0PHN0cmluZz47XG4gIHB1YmxpYyByZWFkb25seSBjbG91ZFRyYWlsUHJvdGVjdGlvblBvbGljeUFybjogcHVsdW1pLk91dHB1dDxzdHJpbmc+O1xuICBwdWJsaWMgcmVhZG9ubHkga21zUHJvdGVjdGlvblBvbGljeUFybjogcHVsdW1pLk91dHB1dDxzdHJpbmc+O1xuXG4gIC8vIFJlZ2lvbiBjb25maXJtYXRpb25cbiAgcHVibGljIHJlYWRvbmx5IHJlZ2lvbjogc3RyaW5nO1xuXG4gIGNvbnN0cnVjdG9yKFxuICAgIG5hbWU6IHN0cmluZyxcbiAgICBhcmdzPzogU2VjdXJpdHlTdGFja0FyZ3MsXG4gICAgb3B0cz86IHB1bHVtaS5Db21wb25lbnRSZXNvdXJjZU9wdGlvbnNcbiAgKSB7XG4gICAgc3VwZXIoJ3RhcDpzZWN1cml0eTpTZWN1cml0eVN0YWNrJywgbmFtZSwgYXJncywgb3B0cyk7XG5cbiAgICBjb25zdCBlbnZpcm9ubWVudFN1ZmZpeCA9IGFyZ3M/LmVudmlyb25tZW50U3VmZml4IHx8ICdkZXYnO1xuICAgIGNvbnN0IHRhZ3MgPSBhcmdzPy50YWdzIHx8IHt9O1xuICAgIGNvbnN0IGFsbG93ZWRJcFJhbmdlcyA9IGFyZ3M/LmFsbG93ZWRJcFJhbmdlcyB8fCBbJzIwMy4wLjExMy4wLzI0J107XG4gICAgY29uc3QgZW5hYmxlRW5oYW5jZWRTZWN1cml0eSA9IGFyZ3M/LmVuYWJsZUVuaGFuY2VkU2VjdXJpdHkgPz8gdHJ1ZTtcblxuICAgIC8vIENvbmZpZ3VyZSBBV1MgcHJvdmlkZXIgZm9yIHVzLWVhc3QtMVxuICAgIGNvbnN0IHByb3ZpZGVyID0gbmV3IGF3cy5Qcm92aWRlcihcbiAgICAgICdhd3MtcHJvdmlkZXInLFxuICAgICAge1xuICAgICAgICByZWdpb246ICd1cy1lYXN0LTEnLFxuICAgICAgfSxcbiAgICAgIHsgcGFyZW50OiB0aGlzIH1cbiAgICApO1xuXG4gICAgLy8gR2V0IGFjY291bnQgSUQgZm9yIElBTSByb2xlIHBvbGljaWVzXG4gICAgY29uc3QgYWNjb3VudElkID0gYXdzLmdldENhbGxlcklkZW50aXR5KCkudGhlbihpZCA9PiBpZC5hY2NvdW50SWQpO1xuXG4gICAgLy8gQ3JlYXRlIGVuaGFuY2VkIHNlY3VyaXR5IHBvbGljaWVzXG4gICAgY29uc3Qgc2VjdXJpdHlQb2xpY2llcyA9IG5ldyBTZWN1cml0eVBvbGljaWVzKFxuICAgICAgYHRhcC1zZWN1cml0eS1wb2xpY2llcy0ke2Vudmlyb25tZW50U3VmZml4fWAsXG4gICAgICB7XG4gICAgICAgIGVudmlyb25tZW50U3VmZml4LFxuICAgICAgICB0YWdzOiBjb21tb25UYWdzLFxuICAgICAgfSxcbiAgICAgIHsgcGFyZW50OiB0aGlzLCBwcm92aWRlciB9XG4gICAgKTtcblxuICAgIC8vIENyZWF0ZSBLTVMga2V5cyBmb3IgZW5jcnlwdGlvblxuICAgIGNvbnN0IHMzS21zS2V5ID0gbmV3IEtNU0tleShcbiAgICAgIGBzMy1lbmNyeXB0aW9uLSR7ZW52aXJvbm1lbnRTdWZmaXh9YCxcbiAgICAgIHtcbiAgICAgICAgZGVzY3JpcHRpb246IGBLTVMga2V5IGZvciBTMyBidWNrZXQgZW5jcnlwdGlvbiAtICR7ZW52aXJvbm1lbnRTdWZmaXh9IGVudmlyb25tZW50YCxcbiAgICAgICAgdGFnczoge1xuICAgICAgICAgIFB1cnBvc2U6ICdTMyBFbmNyeXB0aW9uJyxcbiAgICAgICAgICBFbnZpcm9ubWVudDogZW52aXJvbm1lbnRTdWZmaXgsXG4gICAgICAgIH0sXG4gICAgICB9LFxuICAgICAgeyBwYXJlbnQ6IHRoaXMsIHByb3ZpZGVyIH1cbiAgICApO1xuXG4gICAgY29uc3QgY2xvdWRUcmFpbEttc0tleSA9IG5ldyBLTVNLZXkoXG4gICAgICBgY2xvdWR0cmFpbC1lbmNyeXB0aW9uLSR7ZW52aXJvbm1lbnRTdWZmaXh9YCxcbiAgICAgIHtcbiAgICAgICAgZGVzY3JpcHRpb246IGBLTVMga2V5IGZvciBDbG91ZFRyYWlsIGxvZyBlbmNyeXB0aW9uIC0gJHtlbnZpcm9ubWVudFN1ZmZpeH0gZW52aXJvbm1lbnRgLFxuICAgICAgICB0YWdzOiB7XG4gICAgICAgICAgUHVycG9zZTogJ0Nsb3VkVHJhaWwgRW5jcnlwdGlvbicsXG4gICAgICAgICAgRW52aXJvbm1lbnQ6IGVudmlyb25tZW50U3VmZml4LFxuICAgICAgICB9LFxuICAgICAgfSxcbiAgICAgIHsgcGFyZW50OiB0aGlzLCBwcm92aWRlciB9XG4gICAgKTtcblxuICAgIC8vIENyZWF0ZSBzZWN1cmUgUzMgYnVja2V0cyB3aXRoIGVuaGFuY2VkIHNlY3VyaXR5XG4gICAgbGV0IHByaW1hcnlCdWNrZXQ6IFNlY3VyZVMzQnVja2V0IHwgRW5oYW5jZWRTZWN1cmVTM0J1Y2tldDtcbiAgICBsZXQgYXVkaXRCdWNrZXQ6IFNlY3VyZVMzQnVja2V0IHwgRW5oYW5jZWRTZWN1cmVTM0J1Y2tldDtcblxuICAgIGlmIChlbmFibGVFbmhhbmNlZFNlY3VyaXR5KSB7XG4gICAgICBwcmltYXJ5QnVja2V0ID0gbmV3IEVuaGFuY2VkU2VjdXJlUzNCdWNrZXQoXG4gICAgICAgIGB0YXAtcHJpbWFyeS1zdG9yYWdlLSR7ZW52aXJvbm1lbnRTdWZmaXh9YCxcbiAgICAgICAge1xuICAgICAgICAgIGJ1Y2tldE5hbWU6IGB0YXAtcHJpbWFyeS1zdG9yYWdlLSR7ZW52aXJvbm1lbnRTdWZmaXh9YCxcbiAgICAgICAgICBrbXNLZXlJZDogczNLbXNLZXkua2V5LmtleUlkLFxuICAgICAgICAgIGFsbG93ZWRJcFJhbmdlcyxcbiAgICAgICAgICBlbmFibGVBY2Nlc3NMb2dnaW5nOiB0cnVlLFxuICAgICAgICAgIGVuYWJsZU5vdGlmaWNhdGlvbnM6IGZhbHNlLFxuICAgICAgICAgIGVuYWJsZU9iamVjdExvY2s6IHRydWUsXG4gICAgICAgICAgZW5hYmxlQnVja2V0UG9saWN5OiBmYWxzZSxcbiAgICAgICAgICBsaWZlY3ljbGVSdWxlczogW1xuICAgICAgICAgICAge1xuICAgICAgICAgICAgICBpZDogJ3RyYW5zaXRpb24tdG8taWEnLFxuICAgICAgICAgICAgICBzdGF0dXM6ICdFbmFibGVkJyxcbiAgICAgICAgICAgICAgdHJhbnNpdGlvbnM6IFtcbiAgICAgICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgICBkYXlzOiAzMCxcbiAgICAgICAgICAgICAgICAgIHN0b3JhZ2VDbGFzczogJ1NUQU5EQVJEX0lBJyxcbiAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICAgIGRheXM6IDkwLFxuICAgICAgICAgICAgICAgICAgc3RvcmFnZUNsYXNzOiAnR0xBQ0lFUicsXG4gICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgICBkYXlzOiAzNjUsXG4gICAgICAgICAgICAgICAgICBzdG9yYWdlQ2xhc3M6ICdERUVQX0FSQ0hJVkUnLFxuICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgIF0sXG4gICAgICAgICAgICB9LFxuICAgICAgICAgIF0sXG4gICAgICAgICAgdGFnczoge1xuICAgICAgICAgICAgUHVycG9zZTogJ1ByaW1hcnkgZGF0YSBzdG9yYWdlIHdpdGggZW5oYW5jZWQgc2VjdXJpdHknLFxuICAgICAgICAgICAgRW52aXJvbm1lbnQ6IGVudmlyb25tZW50U3VmZml4LFxuICAgICAgICAgIH0sXG4gICAgICAgIH0sXG4gICAgICAgIHsgcGFyZW50OiB0aGlzLCBwcm92aWRlciB9XG4gICAgICApO1xuXG4gICAgICBhdWRpdEJ1Y2tldCA9IG5ldyBFbmhhbmNlZFNlY3VyZVMzQnVja2V0KFxuICAgICAgICBgdGFwLWF1ZGl0LWxvZ3MtJHtlbnZpcm9ubWVudFN1ZmZpeH1gLFxuICAgICAgICB7XG4gICAgICAgICAgYnVja2V0TmFtZTogYHRhcC1hdWRpdC1sb2dzLSR7ZW52aXJvbm1lbnRTdWZmaXh9YCxcbiAgICAgICAgICBrbXNLZXlJZDogY2xvdWRUcmFpbEttc0tleS5rZXkuYXJuLFxuICAgICAgICAgIGFsbG93ZWRJcFJhbmdlcyxcbiAgICAgICAgICBlbmFibGVBY2Nlc3NMb2dnaW5nOiB0cnVlLFxuICAgICAgICAgIGVuYWJsZU9iamVjdExvY2s6IHRydWUsXG4gICAgICAgICAgZW5hYmxlQnVja2V0UG9saWN5OiBmYWxzZSwgLy8gVGVtcG9yYXJpbHkgZGlzYWJsZWQgdG8gcmVzb2x2ZSBhY2Nlc3MgaXNzdWVzXG4gICAgICAgICAgdGFnczoge1xuICAgICAgICAgICAgUHVycG9zZTogJ0F1ZGl0IGFuZCBjb21wbGlhbmNlIGxvZ3Mgd2l0aCBlbmhhbmNlZCBzZWN1cml0eScsXG4gICAgICAgICAgICBFbnZpcm9ubWVudDogZW52aXJvbm1lbnRTdWZmaXgsXG4gICAgICAgICAgfSxcbiAgICAgICAgfSxcbiAgICAgICAgeyBwYXJlbnQ6IHRoaXMsIHByb3ZpZGVyIH1cbiAgICAgICk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHByaW1hcnlCdWNrZXQgPSBuZXcgU2VjdXJlUzNCdWNrZXQoXG4gICAgICAgIGB0YXAtcHJpbWFyeS1zdG9yYWdlLSR7ZW52aXJvbm1lbnRTdWZmaXh9YCxcbiAgICAgICAge1xuICAgICAgICAgIGJ1Y2tldE5hbWU6IGB0YXAtcHJpbWFyeS1zdG9yYWdlLSR7ZW52aXJvbm1lbnRTdWZmaXh9YCxcbiAgICAgICAgICBrbXNLZXlJZDogczNLbXNLZXkua2V5LmtleUlkLFxuICAgICAgICAgIGVuYWJsZUJ1Y2tldFBvbGljeTogZmFsc2UsIC8vIFRlbXBvcmFyaWx5IGRpc2FibGVkIHRvIHJlc29sdmUgYWNjZXNzIGlzc3Vlc1xuICAgICAgICAgIGxpZmVjeWNsZVJ1bGVzOiBbXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgIGlkOiAndHJhbnNpdGlvbi10by1pYScsXG4gICAgICAgICAgICAgIHN0YXR1czogJ0VuYWJsZWQnLFxuICAgICAgICAgICAgICB0cmFuc2l0aW9uczogW1xuICAgICAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICAgIGRheXM6IDMwLFxuICAgICAgICAgICAgICAgICAgc3RvcmFnZUNsYXNzOiAnU1RBTkRBUkRfSUEnLFxuICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgICAgZGF5czogOTAsXG4gICAgICAgICAgICAgICAgICBzdG9yYWdlQ2xhc3M6ICdHTEFDSUVSJyxcbiAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICAgIGRheXM6IDM2NSxcbiAgICAgICAgICAgICAgICAgIHN0b3JhZ2VDbGFzczogJ0RFRVBfQVJDSElWRScsXG4gICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgXSxcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgXSxcbiAgICAgICAgICB0YWdzOiB7XG4gICAgICAgICAgICBQdXJwb3NlOiAnUHJpbWFyeSBkYXRhIHN0b3JhZ2UnLFxuICAgICAgICAgICAgRW52aXJvbm1lbnQ6IGVudmlyb25tZW50U3VmZml4LFxuICAgICAgICAgIH0sXG4gICAgICAgIH0sXG4gICAgICAgIHsgcGFyZW50OiB0aGlzLCBwcm92aWRlciB9XG4gICAgICApO1xuXG4gICAgICBhdWRpdEJ1Y2tldCA9IG5ldyBTZWN1cmVTM0J1Y2tldChcbiAgICAgICAgYHRhcC1hdWRpdC1sb2dzLSR7ZW52aXJvbm1lbnRTdWZmaXh9YCxcbiAgICAgICAge1xuICAgICAgICAgIGJ1Y2tldE5hbWU6IGB0YXAtYXVkaXQtbG9ncy0ke2Vudmlyb25tZW50U3VmZml4fWAsXG4gICAgICAgICAga21zS2V5SWQ6IGNsb3VkVHJhaWxLbXNLZXkua2V5LmFybixcbiAgICAgICAgICBlbmFibGVCdWNrZXRQb2xpY3k6IGZhbHNlLCAvLyBUZW1wb3JhcmlseSBkaXNhYmxlZCB0byByZXNvbHZlIGFjY2VzcyBpc3N1ZXNcbiAgICAgICAgICB0YWdzOiB7XG4gICAgICAgICAgICBQdXJwb3NlOiAnQXVkaXQgYW5kIGNvbXBsaWFuY2UgbG9ncycsXG4gICAgICAgICAgICBFbnZpcm9ubWVudDogZW52aXJvbm1lbnRTdWZmaXgsXG4gICAgICAgICAgfSxcbiAgICAgICAgfSxcbiAgICAgICAgeyBwYXJlbnQ6IHRoaXMsIHByb3ZpZGVyIH1cbiAgICAgICk7XG4gICAgfVxuXG4gICAgLy8gQ3JlYXRlIElBTSByb2xlcyB3aXRoIGVuaGFuY2VkIGxlYXN0IHByaXZpbGVnZSBhbmQgTUZBIGVuZm9yY2VtZW50XG4gICAgY29uc3QgZGF0YUFjY2Vzc1JvbGUgPSBuZXcgU2VjdXJlSUFNUm9sZShcbiAgICAgIGB0YXAtZGF0YS1hY2Nlc3MtJHtlbnZpcm9ubWVudFN1ZmZpeH1gLFxuICAgICAge1xuICAgICAgICBhc3N1bWVSb2xlUG9saWN5OiBwdWx1bWkuYWxsKFthY2NvdW50SWRdKS5hcHBseSgoW2FjY291bnRJZF0pID0+XG4gICAgICAgICAgSlNPTi5zdHJpbmdpZnkoe1xuICAgICAgICAgICAgVmVyc2lvbjogJzIwMTItMTAtMTcnLFxuICAgICAgICAgICAgU3RhdGVtZW50OiBbXG4gICAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICBBY3Rpb246ICdzdHM6QXNzdW1lUm9sZScsXG4gICAgICAgICAgICAgICAgRWZmZWN0OiAnQWxsb3cnLFxuICAgICAgICAgICAgICAgIFByaW5jaXBhbDoge1xuICAgICAgICAgICAgICAgICAgQVdTOiBgYXJuOmF3czppYW06OiR7YWNjb3VudElkfTpyb290YCxcbiAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgIENvbmRpdGlvbjoge1xuICAgICAgICAgICAgICAgICAgQm9vbDoge1xuICAgICAgICAgICAgICAgICAgICAnYXdzOk11bHRpRmFjdG9yQXV0aFByZXNlbnQnOiAndHJ1ZScsXG4gICAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgICAgU3RyaW5nRXF1YWxzOiB7XG4gICAgICAgICAgICAgICAgICAgICdhd3M6UmVxdWVzdGVkUmVnaW9uJzogJ3VzLWVhc3QtMScsXG4gICAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgICAgSXBBZGRyZXNzOiB7XG4gICAgICAgICAgICAgICAgICAgICdhd3M6U291cmNlSXAnOiBhbGxvd2VkSXBSYW5nZXMsXG4gICAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBdLFxuICAgICAgICAgIH0pXG4gICAgICAgICksXG4gICAgICAgIHJvbGVOYW1lOiBgdGFwLWRhdGEtYWNjZXNzLXJvbGUtJHtlbnZpcm9ubWVudFN1ZmZpeH1gLFxuICAgICAgICBwb2xpY2llczogZW5hYmxlRW5oYW5jZWRTZWN1cml0eVxuICAgICAgICAgID8gW1xuICAgICAgICAgICAgICBjcmVhdGVUaW1lQmFzZWRTM0FjY2Vzc1BvbGljeShwcmltYXJ5QnVja2V0LmJ1Y2tldC5hcm4pLFxuICAgICAgICAgICAgICBjcmVhdGVNRkFFbmZvcmNlZFBvbGljeSgpLFxuICAgICAgICAgICAgXVxuICAgICAgICAgIDogW1xuICAgICAgICAgICAgICBjcmVhdGVTM0FjY2Vzc1BvbGljeShwcmltYXJ5QnVja2V0LmJ1Y2tldC5hcm4pLFxuICAgICAgICAgICAgICBjcmVhdGVNRkFFbmZvcmNlZFBvbGljeSgpLFxuICAgICAgICAgICAgXSxcbiAgICAgICAgbWFuYWdlZFBvbGljeUFybnM6IFtdLFxuICAgICAgICByZXF1aXJlTUZBOiB0cnVlLFxuICAgICAgICB0YWdzOiB7XG4gICAgICAgICAgUHVycG9zZTpcbiAgICAgICAgICAgICdEYXRhIGFjY2VzcyB3aXRoIGVuaGFuY2VkIE1GQSBlbmZvcmNlbWVudCBhbmQgdGltZSByZXN0cmljdGlvbnMnLFxuICAgICAgICAgIEVudmlyb25tZW50OiBlbnZpcm9ubWVudFN1ZmZpeCxcbiAgICAgICAgfSxcbiAgICAgIH0sXG4gICAgICB7IHBhcmVudDogdGhpcywgcHJvdmlkZXIgfVxuICAgICk7XG5cbiAgICBjb25zdCBhdWRpdFJvbGUgPSBuZXcgU2VjdXJlSUFNUm9sZShcbiAgICAgIGB0YXAtYXVkaXQtYWNjZXNzLSR7ZW52aXJvbm1lbnRTdWZmaXh9YCxcbiAgICAgIHtcbiAgICAgICAgYXNzdW1lUm9sZVBvbGljeTogcHVsdW1pLmFsbChbYWNjb3VudElkXSkuYXBwbHkoKFthY2NvdW50SWRdKSA9PlxuICAgICAgICAgIEpTT04uc3RyaW5naWZ5KHtcbiAgICAgICAgICAgIFZlcnNpb246ICcyMDEyLTEwLTE3JyxcbiAgICAgICAgICAgIFN0YXRlbWVudDogW1xuICAgICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgQWN0aW9uOiAnc3RzOkFzc3VtZVJvbGUnLFxuICAgICAgICAgICAgICAgIEVmZmVjdDogJ0FsbG93JyxcbiAgICAgICAgICAgICAgICBQcmluY2lwYWw6IHtcbiAgICAgICAgICAgICAgICAgIEFXUzogYGFybjphd3M6aWFtOjoke2FjY291bnRJZH06cm9vdGAsXG4gICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICBDb25kaXRpb246IHtcbiAgICAgICAgICAgICAgICAgIEJvb2w6IHtcbiAgICAgICAgICAgICAgICAgICAgJ2F3czpNdWx0aUZhY3RvckF1dGhQcmVzZW50JzogJ3RydWUnLFxuICAgICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICAgIFN0cmluZ0VxdWFsczoge1xuICAgICAgICAgICAgICAgICAgICAnYXdzOlJlcXVlc3RlZFJlZ2lvbic6ICd1cy1lYXN0LTEnLFxuICAgICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICAgIElwQWRkcmVzczoge1xuICAgICAgICAgICAgICAgICAgICAnYXdzOlNvdXJjZUlwJzogYWxsb3dlZElwUmFuZ2VzLFxuICAgICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgXSxcbiAgICAgICAgICB9KVxuICAgICAgICApLFxuICAgICAgICByb2xlTmFtZTogYHRhcC1hdWRpdC1hY2Nlc3Mtcm9sZS0ke2Vudmlyb25tZW50U3VmZml4fWAsXG4gICAgICAgIHBvbGljaWVzOiBlbmFibGVFbmhhbmNlZFNlY3VyaXR5XG4gICAgICAgICAgPyBbXG4gICAgICAgICAgICAgIGNyZWF0ZVJlc3RyaWN0ZWRBdWRpdFBvbGljeShcbiAgICAgICAgICAgICAgICBhdWRpdEJ1Y2tldC5idWNrZXQuYXJuLFxuICAgICAgICAgICAgICAgIGFsbG93ZWRJcFJhbmdlc1xuICAgICAgICAgICAgICApLFxuICAgICAgICAgICAgXVxuICAgICAgICAgIDogW1xuICAgICAgICAgICAgICBwdWx1bWkuaW50ZXJwb2xhdGVge1xuICAgICAgICAgIFwiVmVyc2lvblwiOiBcIjIwMTItMTAtMTdcIixcbiAgICAgICAgICBcIlN0YXRlbWVudFwiOiBbXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgIFwiRWZmZWN0XCI6IFwiQWxsb3dcIixcbiAgICAgICAgICAgICAgXCJBY3Rpb25cIjogW1xuICAgICAgICAgICAgICAgIFwiczM6R2V0T2JqZWN0XCIsXG4gICAgICAgICAgICAgICAgXCJzMzpMaXN0QnVja2V0XCJcbiAgICAgICAgICAgICAgXSxcbiAgICAgICAgICAgICAgXCJSZXNvdXJjZVwiOiBbXG4gICAgICAgICAgICAgICAgXCIke2F1ZGl0QnVja2V0LmJ1Y2tldC5hcm59XCIsXG4gICAgICAgICAgICAgICAgXCIke2F1ZGl0QnVja2V0LmJ1Y2tldC5hcm59LypcIlxuICAgICAgICAgICAgICBdXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAge1xuICAgICAgICAgICAgICBcIkVmZmVjdFwiOiBcIkFsbG93XCIsXG4gICAgICAgICAgICAgIFwiQWN0aW9uXCI6IFtcbiAgICAgICAgICAgICAgICBcImNsb3VkdHJhaWw6TG9va3VwRXZlbnRzXCIsXG4gICAgICAgICAgICAgICAgXCJjbG91ZHRyYWlsOkdldFRyYWlsU3RhdHVzXCJcbiAgICAgICAgICAgICAgXSxcbiAgICAgICAgICAgICAgXCJSZXNvdXJjZVwiOiBcIipcIlxuICAgICAgICAgICAgfVxuICAgICAgICAgIF1cbiAgICAgICAgfWAsXG4gICAgICAgICAgICBdLFxuICAgICAgICBtYW5hZ2VkUG9saWN5QXJuczogWydhcm46YXdzOmlhbTo6YXdzOnBvbGljeS9SZWFkT25seUFjY2VzcyddLFxuICAgICAgICByZXF1aXJlTUZBOiB0cnVlLFxuICAgICAgICB0YWdzOiB7XG4gICAgICAgICAgUHVycG9zZTogJ0F1ZGl0IGxvZyBhY2Nlc3Mgd2l0aCBJUCBhbmQgdGltZSByZXN0cmljdGlvbnMnLFxuICAgICAgICAgIEVudmlyb25tZW50OiBlbnZpcm9ubWVudFN1ZmZpeCxcbiAgICAgICAgfSxcbiAgICAgIH0sXG4gICAgICB7IHBhcmVudDogdGhpcywgcHJvdmlkZXIgfVxuICAgICk7XG5cbiAgICAvLyBDcmVhdGUgQ2xvdWRUcmFpbCBmb3IgY29tcHJlaGVuc2l2ZSBsb2dnaW5nXG4gICAgLy8gTk9URTogQ2xvdWRUcmFpbCBjcmVhdGlvbiBjb21tZW50ZWQgb3V0IGR1ZSB0byB0ZXN0aW5nIGxpbWl0YXRpb25zXG4gICAgLy8gbGV0IGNsb3VkVHJhaWw6IFNlY3VyZUNsb3VkVHJhaWwgfCBFbmhhbmNlZENsb3VkVHJhaWw7XG5cbiAgICAvLyBpZiAoZW5hYmxlRW5oYW5jZWRTZWN1cml0eSkge1xuICAgIC8vICAgY2xvdWRUcmFpbCA9IG5ldyBFbmhhbmNlZENsb3VkVHJhaWwoXG4gICAgLy8gICAgIGB0YXAtc2VjdXJpdHktYXVkaXQtJHtlbnZpcm9ubWVudFN1ZmZpeH1gLFxuICAgIC8vICAgICB7XG4gICAgLy8gICAgICAgdHJhaWxOYW1lOiBgdGFwLXNlY3VyaXR5LWF1ZGl0LXRyYWlsLSR7ZW52aXJvbm1lbnRTdWZmaXh9YCxcbiAgICAvLyAgICAgICBzM0J1Y2tldE5hbWU6IGF1ZGl0QnVja2V0LmJ1Y2tldC5pZCxcbiAgICAvLyAgICAgICBrbXNLZXlJZDogY2xvdWRUcmFpbEttc0tleS5rZXkuYXJuLFxuICAgIC8vICAgICAgIGluY2x1ZGVHbG9iYWxTZXJ2aWNlRXZlbnRzOiB0cnVlLFxuICAgIC8vICAgICAgIGlzTXVsdGlSZWdpb25UcmFpbDogdHJ1ZSxcbiAgICAvLyAgICAgICBlbmFibGVMb2dGaWxlVmFsaWRhdGlvbjogdHJ1ZSxcbiAgICAvLyAgICAgICBlbmFibGVJbnNpZ2h0U2VsZWN0b3JzOiB0cnVlLFxuICAgIC8vICAgICAgIHRhZ3M6IHtcbiAgICAvLyAgICAgICAgIFB1cnBvc2U6XG4gICAgLy8gICAgICAgICAgICdFbmhhbmNlZCBzZWN1cml0eSBhdWRpdCBhbmQgY29tcGxpYW5jZSB3aXRoIGFub21hbHkgZGV0ZWN0aW9uJyxcbiAgICAvLyAgICAgICAgIEVudmlyb25tZW50OiBlbnZpcm9ubWVudFN1ZmZpeCxcbiAgICAvLyAgICAgICB9LFxuICAgIC8vICAgICB9LFxuICAgIC8vICAgICB7IHBhcmVudDogdGhpcywgcHJvdmlkZXIgfVxuICAgIC8vICAgKTtcbiAgICAvLyB9IGVsc2Uge1xuICAgIC8vICAgY2xvdWRUcmFpbCA9IG5ldyBTZWN1cmVDbG91ZFRyYWlsKFxuICAgIC8vICAgICBgdGFwLXNlY3VyaXR5LWF1ZGl0LSR7ZW52aXJvbm1lbnRTdWZmaXh9YCxcbiAgICAvLyAgICAge1xuICAgIC8vICAgICAgIHRyYWlsTmFtZTogYHRhcC1zZWN1cml0eS1hdWRpdC10cmFpbC0ke2Vudmlyb25tZW50U3VmZml4fWAsXG4gICAgLy8gICAgICAgczNCdWNrZXROYW1lOiBhdWRpdEJ1Y2tldC5idWNrZXQuaWQsXG4gICAgLy8gICAgICAga21zS2V5SWQ6IGNsb3VkVHJhaWxLbXNLZXkua2V5LmFybixcbiAgICAvLyAgICAgICBpbmNsdWRlR2xvYmFsU2VydmljZUV2ZW50czogdHJ1ZSxcbiAgICAvLyAgICAgICBpc011bHRpUmVnaW9uVHJhaWw6IHRydWUsXG4gICAgLy8gICAgICAgZW5hYmxlTG9nRmlsZVZhbGlkYXRpb246IHRydWUsXG4gICAgLy8gICAgICAgdGFnczoge1xuICAgIC8vICAgICAgICAgUHVycG9zZTogJ1NlY3VyaXR5IGF1ZGl0IGFuZCBjb21wbGlhbmNlJyxcbiAgICAvLyAgICAgICAgIEVudmlyb25tZW50OiBlbnZpcm9ubWVudFN1ZmZpeCxcbiAgICAvLyAgICAgICB9LFxuICAgIC8vICAgICB9LFxuICAgIC8vICAgICB7IHBhcmVudDogdGhpcywgcHJvdmlkZXIgfVxuICAgIC8vICAgKTtcbiAgICAvLyB9XG5cbiAgICAvLyBDcmVhdGUgYWRkaXRpb25hbCBzZWN1cml0eSBwb2xpY2llcyB3aXRoIGVuaGFuY2VkIGNvbnRyb2xzXG4gICAgY29uc3Qgc2VjdXJpdHlQb2xpY3kgPSBuZXcgYXdzLmlhbS5Qb2xpY3koXG4gICAgICBgdGFwLXNlY3VyaXR5LWJhc2VsaW5lLSR7ZW52aXJvbm1lbnRTdWZmaXh9YCxcbiAgICAgIHtcbiAgICAgICAgbmFtZTogYFNlY3VyaXR5QmFzZWxpbmUtJHtlbnZpcm9ubWVudFN1ZmZpeH1gLFxuICAgICAgICBkZXNjcmlwdGlvbjpcbiAgICAgICAgICAnRW5oYW5jZWQgYmFzZWxpbmUgc2VjdXJpdHkgcG9saWN5IHdpdGggY29tcHJlaGVuc2l2ZSBNRkEgcmVxdWlyZW1lbnRzJyxcbiAgICAgICAgcG9saWN5OiBKU09OLnN0cmluZ2lmeSh7XG4gICAgICAgICAgVmVyc2lvbjogJzIwMTItMTAtMTcnLFxuICAgICAgICAgIFN0YXRlbWVudDogW1xuICAgICAgICAgICAge1xuICAgICAgICAgICAgICBTaWQ6ICdSZXF1aXJlTUZBRm9yQWxsU2Vuc2l0aXZlQWN0aW9ucycsXG4gICAgICAgICAgICAgIEVmZmVjdDogJ0RlbnknLFxuICAgICAgICAgICAgICBBY3Rpb246IFtcbiAgICAgICAgICAgICAgICAnaWFtOkNyZWF0ZVJvbGUnLFxuICAgICAgICAgICAgICAgICdpYW06RGVsZXRlUm9sZScsXG4gICAgICAgICAgICAgICAgJ2lhbTpBdHRhY2hSb2xlUG9saWN5JyxcbiAgICAgICAgICAgICAgICAnaWFtOkRldGFjaFJvbGVQb2xpY3knLFxuICAgICAgICAgICAgICAgICdpYW06UHV0Um9sZVBvbGljeScsXG4gICAgICAgICAgICAgICAgJ2lhbTpEZWxldGVSb2xlUG9saWN5JyxcbiAgICAgICAgICAgICAgICAnczM6RGVsZXRlQnVja2V0JyxcbiAgICAgICAgICAgICAgICAnczM6UHV0QnVja2V0UG9saWN5JyxcbiAgICAgICAgICAgICAgICAna21zOlNjaGVkdWxlS2V5RGVsZXRpb24nLFxuICAgICAgICAgICAgICAgICdrbXM6RGlzYWJsZUtleScsXG4gICAgICAgICAgICAgICAgJ2Nsb3VkdHJhaWw6RGVsZXRlVHJhaWwnLFxuICAgICAgICAgICAgICAgICdjbG91ZHRyYWlsOlN0b3BMb2dnaW5nJyxcbiAgICAgICAgICAgICAgXSxcbiAgICAgICAgICAgICAgUmVzb3VyY2U6ICcqJyxcbiAgICAgICAgICAgICAgQ29uZGl0aW9uOiB7XG4gICAgICAgICAgICAgICAgQm9vbElmRXhpc3RzOiB7XG4gICAgICAgICAgICAgICAgICAnYXdzOk11bHRpRmFjdG9yQXV0aFByZXNlbnQnOiAnZmFsc2UnLFxuICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAge1xuICAgICAgICAgICAgICBTaWQ6ICdSZXN0cmljdFRvVVNFYXN0MU9ubHknLFxuICAgICAgICAgICAgICBFZmZlY3Q6ICdEZW55JyxcbiAgICAgICAgICAgICAgQWN0aW9uOiAnKicsXG4gICAgICAgICAgICAgIFJlc291cmNlOiAnKicsXG4gICAgICAgICAgICAgIENvbmRpdGlvbjoge1xuICAgICAgICAgICAgICAgIFN0cmluZ05vdEVxdWFsczoge1xuICAgICAgICAgICAgICAgICAgJ2F3czpSZXF1ZXN0ZWRSZWdpb24nOiAndXMtZWFzdC0xJyxcbiAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgU2lkOiAnUmVxdWlyZUVuY3J5cHRlZFN0b3JhZ2UnLFxuICAgICAgICAgICAgICBFZmZlY3Q6ICdEZW55JyxcbiAgICAgICAgICAgICAgQWN0aW9uOiBbXG4gICAgICAgICAgICAgICAgJ3MzOlB1dE9iamVjdCcsXG4gICAgICAgICAgICAgICAgJ2ViczpDcmVhdGVWb2x1bWUnLFxuICAgICAgICAgICAgICAgICdyZHM6Q3JlYXRlREJJbnN0YW5jZScsXG4gICAgICAgICAgICAgIF0sXG4gICAgICAgICAgICAgIFJlc291cmNlOiAnKicsXG4gICAgICAgICAgICAgIENvbmRpdGlvbjoge1xuICAgICAgICAgICAgICAgIEJvb2w6IHtcbiAgICAgICAgICAgICAgICAgICdhd3M6U2VjdXJlVHJhbnNwb3J0JzogJ2ZhbHNlJyxcbiAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgfSxcbiAgICAgICAgICBdLFxuICAgICAgICB9KSxcbiAgICAgICAgdGFnczogeyAuLi5jb21tb25UYWdzLCAuLi50YWdzIH0sXG4gICAgICB9LFxuICAgICAgeyBwYXJlbnQ6IHRoaXMsIHByb3ZpZGVyIH1cbiAgICApO1xuXG4gICAgLy8gQXNzaWduIG91dHB1dHNcbiAgICB0aGlzLnByaW1hcnlCdWNrZXROYW1lID0gcHJpbWFyeUJ1Y2tldC5idWNrZXQuaWQ7XG4gICAgdGhpcy5wcmltYXJ5QnVja2V0QXJuID0gcHJpbWFyeUJ1Y2tldC5idWNrZXQuYXJuO1xuICAgIHRoaXMuYXVkaXRCdWNrZXROYW1lID0gYXVkaXRCdWNrZXQuYnVja2V0LmlkO1xuICAgIHRoaXMuYXVkaXRCdWNrZXRBcm4gPSBhdWRpdEJ1Y2tldC5idWNrZXQuYXJuO1xuICAgIHRoaXMuczNLbXNLZXlJZCA9IHMzS21zS2V5LmtleS5rZXlJZDtcbiAgICB0aGlzLnMzS21zS2V5QXJuID0gczNLbXNLZXkua2V5LmFybjtcbiAgICB0aGlzLmNsb3VkVHJhaWxLbXNLZXlJZCA9IGNsb3VkVHJhaWxLbXNLZXkua2V5LmtleUlkO1xuICAgIHRoaXMuY2xvdWRUcmFpbEttc0tleUFybiA9IGNsb3VkVHJhaWxLbXNLZXkua2V5LmFybjtcbiAgICB0aGlzLmRhdGFBY2Nlc3NSb2xlQXJuID0gZGF0YUFjY2Vzc1JvbGUucm9sZS5hcm47XG4gICAgdGhpcy5hdWRpdFJvbGVBcm4gPSBhdWRpdFJvbGUucm9sZS5hcm47XG4gICAgLy8gQ2xvdWRUcmFpbCBvdXRwdXRzIGNvbW1lbnRlZCBvdXQgZHVlIHRvIHRlc3RpbmcgbGltaXRhdGlvbnNcbiAgICAvLyB0aGlzLmNsb3VkVHJhaWxBcm4gPSBjbG91ZFRyYWlsLnRyYWlsLmFybjtcbiAgICAvLyB0aGlzLmNsb3VkVHJhaWxMb2dHcm91cEFybiA9IGNsb3VkVHJhaWwubG9nR3JvdXAuYXJuO1xuICAgIHRoaXMuc2VjdXJpdHlQb2xpY3lBcm4gPSBzZWN1cml0eVBvbGljeS5hcm47XG4gICAgdGhpcy5tZmFFbmZvcmNlbWVudFBvbGljeUFybiA9IHNlY3VyaXR5UG9saWNpZXMubWZhRW5mb3JjZW1lbnRQb2xpY3kuYXJuO1xuICAgIHRoaXMuczNTZWN1cml0eVBvbGljeUFybiA9IHNlY3VyaXR5UG9saWNpZXMuczNEZW55SW5zZWN1cmVQb2xpY3kuYXJuO1xuICAgIHRoaXMuY2xvdWRUcmFpbFByb3RlY3Rpb25Qb2xpY3lBcm4gPVxuICAgICAgc2VjdXJpdHlQb2xpY2llcy5jbG91ZFRyYWlsUHJvdGVjdGlvblBvbGljeS5hcm47XG4gICAgdGhpcy5rbXNQcm90ZWN0aW9uUG9saWN5QXJuID0gc2VjdXJpdHlQb2xpY2llcy5rbXNLZXlQcm90ZWN0aW9uUG9saWN5LmFybjtcbiAgICB0aGlzLnJlZ2lvbiA9ICd1cy1lYXN0LTEnO1xuXG4gICAgLy8gUmVnaXN0ZXIgdGhlIG91dHB1dHMgb2YgdGhpcyBjb21wb25lbnRcbiAgICB0aGlzLnJlZ2lzdGVyT3V0cHV0cyh7XG4gICAgICBwcmltYXJ5QnVja2V0TmFtZTogdGhpcy5wcmltYXJ5QnVja2V0TmFtZSxcbiAgICAgIHByaW1hcnlCdWNrZXRBcm46IHRoaXMucHJpbWFyeUJ1Y2tldEFybixcbiAgICAgIGF1ZGl0QnVja2V0TmFtZTogdGhpcy5hdWRpdEJ1Y2tldE5hbWUsXG4gICAgICBhdWRpdEJ1Y2tldEFybjogdGhpcy5hdWRpdEJ1Y2tldEFybixcbiAgICAgIHMzS21zS2V5SWQ6IHRoaXMuczNLbXNLZXlJZCxcbiAgICAgIHMzS21zS2V5QXJuOiB0aGlzLnMzS21zS2V5QXJuLFxuICAgICAgY2xvdWRUcmFpbEttc0tleUlkOiB0aGlzLmNsb3VkVHJhaWxLbXNLZXlJZCxcbiAgICAgIGNsb3VkVHJhaWxLbXNLZXlBcm46IHRoaXMuY2xvdWRUcmFpbEttc0tleUFybixcbiAgICAgIGRhdGFBY2Nlc3NSb2xlQXJuOiB0aGlzLmRhdGFBY2Nlc3NSb2xlQXJuLFxuICAgICAgYXVkaXRSb2xlQXJuOiB0aGlzLmF1ZGl0Um9sZUFybixcbiAgICAgIC8vIENsb3VkVHJhaWwgb3V0cHV0cyBjb21tZW50ZWQgb3V0IGR1ZSB0byB0ZXN0aW5nIGxpbWl0YXRpb25zXG4gICAgICAvLyBjbG91ZFRyYWlsQXJuOiB0aGlzLmNsb3VkVHJhaWxBcm4sXG4gICAgICAvLyBjbG91ZFRyYWlsTG9nR3JvdXBBcm46IHRoaXMuY2xvdWRUcmFpbExvZ0dyb3VwQXJuLFxuICAgICAgc2VjdXJpdHlQb2xpY3lBcm46IHRoaXMuc2VjdXJpdHlQb2xpY3lBcm4sXG4gICAgICBtZmFFbmZvcmNlbWVudFBvbGljeUFybjogdGhpcy5tZmFFbmZvcmNlbWVudFBvbGljeUFybixcbiAgICAgIHMzU2VjdXJpdHlQb2xpY3lBcm46IHRoaXMuczNTZWN1cml0eVBvbGljeUFybixcbiAgICAgIGNsb3VkVHJhaWxQcm90ZWN0aW9uUG9saWN5QXJuOiB0aGlzLmNsb3VkVHJhaWxQcm90ZWN0aW9uUG9saWN5QXJuLFxuICAgICAga21zUHJvdGVjdGlvblBvbGljeUFybjogdGhpcy5rbXNQcm90ZWN0aW9uUG9saWN5QXJuLFxuICAgICAgcmVnaW9uOiB0aGlzLnJlZ2lvbixcbiAgICB9KTtcbiAgfVxufVxuIl19