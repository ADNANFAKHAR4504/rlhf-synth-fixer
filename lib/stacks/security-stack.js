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
        // Create enhanced security policies
        const securityPolicies = new security_policies_1.SecurityPolicies('security-policies', {
            environmentSuffix,
            tags: tags_1.commonTags,
        }, { parent: this, provider });
        // Create KMS keys for encryption
        const s3KmsKey = new kms_1.KMSKey('s3-encryption', {
            description: 'KMS key for S3 bucket encryption with enhanced security',
            tags: { Purpose: 'S3 Encryption' },
        }, { parent: this, provider });
        const cloudTrailKmsKey = new kms_1.KMSKey('cloudtrail-encryption', {
            description: 'KMS key for CloudTrail log encryption with enhanced security',
            tags: { Purpose: 'CloudTrail Encryption' },
        }, { parent: this, provider });
        // Create secure S3 buckets with enhanced security
        let primaryBucket;
        let auditBucket;
        if (enableEnhancedSecurity) {
            primaryBucket = new enhanced_s3_1.EnhancedSecureS3Bucket('primary-storage', {
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
                },
            }, { parent: this, provider });
            auditBucket = new enhanced_s3_1.EnhancedSecureS3Bucket('audit-logs', {
                kmsKeyId: cloudTrailKmsKey.key.keyId,
                allowedIpRanges,
                enableAccessLogging: true,
                enableObjectLock: true,
                tags: {
                    Purpose: 'Audit and compliance logs with enhanced security',
                },
            }, { parent: this, provider });
        }
        else {
            primaryBucket = new s3_1.SecureS3Bucket('primary-storage', {
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
                },
            }, { parent: this, provider });
            auditBucket = new s3_1.SecureS3Bucket('audit-logs', {
                kmsKeyId: cloudTrailKmsKey.key.keyId,
                tags: {
                    Purpose: 'Audit and compliance logs',
                },
            }, { parent: this, provider });
        }
        // Create IAM roles with enhanced least privilege and MFA enforcement
        const dataAccessRole = new iam_1.SecureIAMRole('data-access', {
            assumeRolePolicy: JSON.stringify({
                Version: '2012-10-17',
                Statement: [
                    {
                        Action: 'sts:AssumeRole',
                        Effect: 'Allow',
                        Principal: {
                            AWS: pulumi.interpolate `arn:aws:iam::${aws.getCallerIdentity().then(id => id.accountId)}:root`,
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
            }),
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
            },
        }, { parent: this, provider });
        const auditRole = new iam_1.SecureIAMRole('audit-access', {
            assumeRolePolicy: JSON.stringify({
                Version: '2012-10-17',
                Statement: [
                    {
                        Action: 'sts:AssumeRole',
                        Effect: 'Allow',
                        Principal: {
                            AWS: pulumi.interpolate `arn:aws:iam::${aws.getCallerIdentity().then(id => id.accountId)}:root`,
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
            }),
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
            },
        }, { parent: this, provider });
        // Create CloudTrail for comprehensive logging
        let cloudTrail;
        if (enableEnhancedSecurity) {
            cloudTrail = new enhanced_cloudtrail_1.EnhancedCloudTrail('security-audit', {
                s3BucketName: auditBucket.bucket.id,
                kmsKeyId: cloudTrailKmsKey.key.keyId,
                includeGlobalServiceEvents: true,
                isMultiRegionTrail: true,
                enableLogFileValidation: true,
                enableInsightSelectors: true,
                tags: {
                    Purpose: 'Enhanced security audit and compliance with anomaly detection',
                },
            }, { parent: this, provider });
        }
        else {
            cloudTrail = new cloudtrail_1.SecureCloudTrail('security-audit', {
                s3BucketName: auditBucket.bucket.id,
                kmsKeyId: cloudTrailKmsKey.key.keyId,
                includeGlobalServiceEvents: true,
                isMultiRegionTrail: true,
                enableLogFileValidation: true,
                tags: {
                    Purpose: 'Security audit and compliance',
                },
            }, { parent: this, provider });
        }
        // Create additional security policies with enhanced controls
        const securityPolicy = new aws.iam.Policy('security-baseline', {
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic2VjdXJpdHktc3RhY2suanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJzZWN1cml0eS1zdGFjay50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFBQSxpREFBbUM7QUFDbkMsdURBQXlDO0FBQ3pDLHdDQUF3QztBQUN4QyxzQ0FBK0M7QUFDL0MsMkRBQW1FO0FBQ25FLHdDQUl3QjtBQUN4QixzREFBeUQ7QUFDekQsbUZBQStFO0FBQy9FLG9FQUlzQztBQUN0Qyx5Q0FBNEM7QUFTNUMsTUFBYSxhQUFjLFNBQVEsTUFBTSxDQUFDLGlCQUFpQjtJQUN6RCxhQUFhO0lBQ0csaUJBQWlCLENBQXdCO0lBQ3pDLGdCQUFnQixDQUF3QjtJQUN4QyxlQUFlLENBQXdCO0lBQ3ZDLGNBQWMsQ0FBd0I7SUFFdEQsV0FBVztJQUNLLFVBQVUsQ0FBd0I7SUFDbEMsV0FBVyxDQUF3QjtJQUNuQyxrQkFBa0IsQ0FBd0I7SUFDMUMsbUJBQW1CLENBQXdCO0lBRTNELFlBQVk7SUFDSSxpQkFBaUIsQ0FBd0I7SUFDekMsWUFBWSxDQUF3QjtJQUVwRCxhQUFhO0lBQ0csYUFBYSxDQUF3QjtJQUNyQyxxQkFBcUIsQ0FBd0I7SUFFN0Qsb0JBQW9CO0lBQ0osaUJBQWlCLENBQXdCO0lBQ3pDLHVCQUF1QixDQUF3QjtJQUMvQyxtQkFBbUIsQ0FBd0I7SUFDM0MsNkJBQTZCLENBQXdCO0lBQ3JELHNCQUFzQixDQUF3QjtJQUU5RCxzQkFBc0I7SUFDTixNQUFNLENBQVM7SUFFL0IsWUFDRSxJQUFZLEVBQ1osSUFBd0IsRUFDeEIsSUFBc0M7UUFFdEMsS0FBSyxDQUFDLDRCQUE0QixFQUFFLElBQUksRUFBRSxJQUFJLEVBQUUsSUFBSSxDQUFDLENBQUM7UUFFdEQsTUFBTSxpQkFBaUIsR0FBRyxJQUFJLEVBQUUsaUJBQWlCLElBQUksS0FBSyxDQUFDO1FBQzNELE1BQU0sSUFBSSxHQUFHLElBQUksRUFBRSxJQUFJLElB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bUIsRUFBRSxJQUFJLENBQUMsbUJBQW1CO1lBQzdDLGlCQUFpQixFQUFFLElBQUksQ0FBQyxpQkFBaUI7WUFDekMsWUFBWSxFQUFFLElBQUksQ0FBQyxZQUFZO1lBQy9CLGFBQWEsRUFBRSxJQUFJLENBQUMsYUFBYTtZQUNqQyxxQkFBcUIsRUFBRSxJQUFJLENBQUMscUJBQXFCO1lBQ2pELGlCQUFpQixFQUFFLElBQUksQ0FBQyxpQkFBaUI7WUFDekMsdUJBQXVCLEVBQUUsSUFBSSxDQUFDLHVCQUF1QjtZQUNyRCxtQkFBbUIsRUFBRSxJQUFJLENBQUMsbUJBQW1CO1lBQzdDLDZCQUE2QixFQUFFLElBQUksQ0FBQyw2QkFBNkI7WUFDakUsc0JBQXNCLEVBQUUsSUFBSSxDQUFDLHNCQUFzQjtZQUNuRCxNQUFNLEVBQUUsSUFBSSxDQUFDLE1BQU07U0FDcEIsQ0FBQyxDQUFDO0lBQ0wsQ0FBQztDQUNGO0FBeGJELHNDQXdiQyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCAqIGFzIGF3cyBmcm9tICdAcHVsdW1pL2F3cyc7XG5pbXBvcnQgKiBhcyBwdWx1bWkgZnJvbSAnQHB1bHVtaS9wdWx1bWknO1xuaW1wb3J0IHsgS01TS2V5IH0gZnJvbSAnLi4vbW9kdWxlcy9rbXMnO1xuaW1wb3J0IHsgU2VjdXJlUzNCdWNrZXQgfSBmcm9tICcuLi9tb2R1bGVzL3MzJztcbmltcG9ydCB7IEVuaGFuY2VkU2VjdXJlUzNCdWNrZXQgfSBmcm9tICcuLi9tb2R1bGVzL3MzL2VuaGFuY2VkLXMzJztcbmltcG9ydCB7XG4gIFNlY3VyZUlBTVJvbGUsXG4gIGNyZWF0ZU1GQUVuZm9yY2VkUG9saWN5LFxuICBjcmVhdGVTM0FjY2Vzc1BvbGljeSxcbn0gZnJvbSAnLi4vbW9kdWxlcy9pYW0nO1xuaW1wb3J0IHsgU2VjdXJlQ2xvdWRUcmFpbCB9IGZyb20gJy4uL21vZHVsZXMvY2xvdWR0cmFpbCc7XG5pbXBvcnQgeyBFbmhhbmNlZENsb3VkVHJhaWwgfSBmcm9tICcuLi9tb2R1bGVzL2Nsb3VkdHJhaWwvZW5oYW5jZWQtY2xvdWR0cmFpbCc7XG5pbXBvcnQge1xuICBTZWN1cml0eVBvbGljaWVzLFxuICBjcmVhdGVUaW1lQmFzZWRTM0FjY2Vzc1BvbGljeSxcbiAgY3JlYXRlUmVzdHJpY3RlZEF1ZGl0UG9saWN5LFxufSBmcm9tICcuLi9tb2R1bGVzL3NlY3VyaXR5LXBvbGljaWVzJztcbmltcG9ydCB7IGNvbW1vblRhZ3MgfSBmcm9tICcuLi9jb25maWcvdGFncyc7XG5cbmV4cG9ydCBpbnRlcmZhY2UgU2VjdXJpdHlTdGFja0FyZ3Mge1xuICBlbnZpcm9ubWVudFN1ZmZpeD86IHN0cmluZztcbiAgdGFncz86IHB1bHVtaS5JbnB1dDx7IFtrZXk6IHN0cmluZ106IHN0cmluZyB9PjtcbiAgYWxsb3dlZElwUmFuZ2VzPzogc3RyaW5nW107XG4gIGVuYWJsZUVuaGFuY2VkU2VjdXJpdHk/OiBib29sZWFuO1xufVxuXG5leHBvcnQgY2xhc3MgU2VjdXJpdHlTdGFjayBleHRlbmRzIHB1bHVtaS5Db21wb25lbnRSZXNvdXJjZSB7XG4gIC8vIFMzIEJ1Y2tldHNcbiAgcHVibGljIHJlYWRvbmx5IHByaW1hcnlCdWNrZXROYW1lOiBwdWx1bWkuT3V0cHV0PHN0cmluZz47XG4gIHB1YmxpYyByZWFkb25seSBwcmltYXJ5QnVja2V0QXJuOiBwdWx1bWkuT3V0cHV0PHN0cmluZz47XG4gIHB1YmxpYyByZWFkb25seSBhdWRpdEJ1Y2tldE5hbWU6IHB1bHVtaS5PdXRwdXQ8c3RyaW5nPjtcbiAgcHVibGljIHJlYWRvbmx5IGF1ZGl0QnVja2V0QXJuOiBwdWx1bWkuT3V0cHV0PHN0cmluZz47XG5cbiAgLy8gS01TIEtleXNcbiAgcHVibGljIHJlYWRvbmx5IHMzS21zS2V5SWQ6IHB1bHVtaS5PdXRwdXQ8c3RyaW5nPjtcbiAgcHVibGljIHJlYWRvbmx5IHMzS21zS2V5QXJuOiBwdWx1bWkuT3V0cHV0PHN0cmluZz47XG4gIHB1YmxpYyByZWFkb25seSBjbG91ZFRyYWlsS21zS2V5SWQ6IHB1bHVtaS5PdXRwdXQ8c3RyaW5nPjtcbiAgcHVibGljIHJlYWRvbmx5IGNsb3VkVHJhaWxLbXNLZXlBcm46IHB1bHVtaS5PdXRwdXQ8c3RyaW5nPjtcblxuICAvLyBJQU0gUm9sZXNcbiAgcHVibGljIHJlYWRvbmx5IGRhdGFBY2Nlc3NSb2xlQXJuOiBwdWx1bWkuT3V0cHV0PHN0cmluZz47XG4gIHB1YmxpYyByZWFkb25seSBhdWRpdFJvbGVBcm46IHB1bHVtaS5PdXRwdXQ8c3RyaW5nPjtcblxuICAvLyBDbG91ZFRyYWlsXG4gIHB1YmxpYyByZWFkb25seSBjbG91ZFRyYWlsQXJuOiBwdWx1bWkuT3V0cHV0PHN0cmluZz47XG4gIHB1YmxpYyByZWFkb25seSBjbG91ZFRyYWlsTG9nR3JvdXBBcm46IHB1bHVtaS5PdXRwdXQ8c3RyaW5nPjtcblxuICAvLyBTZWN1cml0eSBQb2xpY2llc1xuICBwdWJsaWMgcmVhZG9ubHkgc2VjdXJpdHlQb2xpY3lBcm46IHB1bHVtaS5PdXRwdXQ8c3RyaW5nPjtcbiAgcHVibGljIHJlYWRvbmx5IG1mYUVuZm9yY2VtZW50UG9saWN5QXJuOiBwdWx1bWkuT3V0cHV0PHN0cmluZz47XG4gIHB1YmxpYyByZWFkb25seSBzM1NlY3VyaXR5UG9saWN5QXJuOiBwdWx1bWkuT3V0cHV0PHN0cmluZz47XG4gIHB1YmxpYyByZWFkb25seSBjbG91ZFRyYWlsUHJvdGVjdGlvblBvbGljeUFybjogcHVsdW1pLk91dHB1dDxzdHJpbmc+O1xuICBwdWJsaWMgcmVhZG9ubHkga21zUHJvdGVjdGlvblBvbGljeUFybjogcHVsdW1pLk91dHB1dDxzdHJpbmc+O1xuXG4gIC8vIFJlZ2lvbiBjb25maXJtYXRpb25cbiAgcHVibGljIHJlYWRvbmx5IHJlZ2lvbjogc3RyaW5nO1xuXG4gIGNvbnN0cnVjdG9yKFxuICAgIG5hbWU6IHN0cmluZyxcbiAgICBhcmdzPzogU2VjdXJpdHlTdGFja0FyZ3MsXG4gICAgb3B0cz86IHB1bHVtaS5Db21wb25lbnRSZXNvdXJjZU9wdGlvbnNcbiAgKSB7XG4gICAgc3VwZXIoJ3RhcDpzZWN1cml0eTpTZWN1cml0eVN0YWNrJywgbmFtZSwgYXJncywgb3B0cyk7XG5cbiAgICBjb25zdCBlbnZpcm9ubWVudFN1ZmZpeCA9IGFyZ3M/LmVudmlyb25tZW50U3VmZml4IHx8ICdkZXYnO1xuICAgIGNvbnN0IHRhZ3MgPSBhcmdzPy50YWdzIHx8IHt9O1xuICAgIGNvbnN0IGFsbG93ZWRJcFJhbmdlcyA9IGFyZ3M/LmFsbG93ZWRJcFJhbmdlcyB8fCBbJzIwMy4wLjExMy4wLzI0J107XG4gICAgY29uc3QgZW5hYmxlRW5oYW5jZWRTZWN1cml0eSA9IGFyZ3M/LmVuYWJsZUVuaGFuY2VkU2VjdXJpdHkgPz8gdHJ1ZTtcblxuICAgIC8vIENvbmZpZ3VyZSBBV1MgcHJvdmlkZXIgZm9yIHVzLWVhc3QtMVxuICAgIGNvbnN0IHByb3ZpZGVyID0gbmV3IGF3cy5Qcm92aWRlcihcbiAgICAgICdhd3MtcHJvdmlkZXInLFxuICAgICAge1xuICAgICAgICByZWdpb246ICd1cy1lYXN0LTEnLFxuICAgICAgfSxcbiAgICAgIHsgcGFyZW50OiB0aGlzIH1cbiAgICApO1xuXG4gICAgLy8gQ3JlYXRlIGVuaGFuY2VkIHNlY3VyaXR5IHBvbGljaWVzXG4gICAgY29uc3Qgc2VjdXJpdHlQb2xpY2llcyA9IG5ldyBTZWN1cml0eVBvbGljaWVzKFxuICAgICAgJ3NlY3VyaXR5LXBvbGljaWVzJyxcbiAgICAgIHtcbiAgICAgICAgZW52aXJvbm1lbnRTdWZmaXgsXG4gICAgICAgIHRhZ3M6IGNvbW1vblRhZ3MsXG4gICAgICB9LFxuICAgICAgeyBwYXJlbnQ6IHRoaXMsIHByb3ZpZGVyIH1cbiAgICApO1xuXG4gICAgLy8gQ3JlYXRlIEtNUyBrZXlzIGZvciBlbmNyeXB0aW9uXG4gICAgY29uc3QgczNLbXNLZXkgPSBuZXcgS01TS2V5KFxuICAgICAgJ3MzLWVuY3J5cHRpb24nLFxuICAgICAge1xuICAgICAgICBkZXNjcmlwdGlvbjogJ0tNUyBrZXkgZm9yIFMzIGJ1Y2tldCBlbmNyeXB0aW9uIHdpdGggZW5oYW5jZWQgc2VjdXJpdHknLFxuICAgICAgICB0YWdzOiB7IFB1cnBvc2U6ICdTMyBFbmNyeXB0aW9uJyB9LFxuICAgICAgfSxcbiAgICAgIHsgcGFyZW50OiB0aGlzLCBwcm92aWRlciB9XG4gICAgKTtcblxuICAgIGNvbnN0IGNsb3VkVHJhaWxLbXNLZXkgPSBuZXcgS01TS2V5KFxuICAgICAgJ2Nsb3VkdHJhaWwtZW5jcnlwdGlvbicsXG4gICAgICB7XG4gICAgICAgIGRlc2NyaXB0aW9uOlxuICAgICAgICAgICdLTVMga2V5IGZvciBDbG91ZFRyYWlsIGxvZyBlbmNyeXB0aW9uIHdpdGggZW5oYW5jZWQgc2VjdXJpdHknLFxuICAgICAgICB0YWdzOiB7IFB1cnBvc2U6ICdDbG91ZFRyYWlsIEVuY3J5cHRpb24nIH0sXG4gICAgICB9LFxuICAgICAgeyBwYXJlbnQ6IHRoaXMsIHByb3ZpZGVyIH1cbiAgICApO1xuXG4gICAgLy8gQ3JlYXRlIHNlY3VyZSBTMyBidWNrZXRzIHdpdGggZW5oYW5jZWQgc2VjdXJpdHlcbiAgICBsZXQgcHJpbWFyeUJ1Y2tldDogU2VjdXJlUzNCdWNrZXQgfCBFbmhhbmNlZFNlY3VyZVMzQnVja2V0O1xuICAgIGxldCBhdWRpdEJ1Y2tldDogU2VjdXJlUzNCdWNrZXQgfCBFbmhhbmNlZFNlY3VyZVMzQnVja2V0O1xuXG4gICAgaWYgKGVuYWJsZUVuaGFuY2VkU2VjdXJpdHkpIHtcbiAgICAgIHByaW1hcnlCdWNrZXQgPSBuZXcgRW5oYW5jZWRTZWN1cmVTM0J1Y2tldChcbiAgICAgICAgJ3ByaW1hcnktc3RvcmFnZScsXG4gICAgICAgIHtcbiAgICAgICAgICBrbXNLZXlJZDogczNLbXNLZXkua2V5LmtleUlkLFxuICAgICAgICAgIGFsbG93ZWRJcFJhbmdlcyxcbiAgICAgICAgICBlbmFibGVBY2Nlc3NMb2dnaW5nOiB0cnVlLFxuICAgICAgICAgIGVuYWJsZU5vdGlmaWNhdGlvbnM6IHRydWUsXG4gICAgICAgICAgZW5hYmxlT2JqZWN0TG9jazogdHJ1ZSxcbiAgICAgICAgICBsaWZlY3ljbGVSdWxlczogW1xuICAgICAgICAgICAge1xuICAgICAgICAgICAgICBpZDogJ3RyYW5zaXRpb24tdG8taWEnLFxuICAgICAgICAgICAgICBzdGF0dXM6ICdFbmFibGVkJyxcbiAgICAgICAgICAgICAgdHJhbnNpdGlvbnM6IFtcbiAgICAgICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgICBkYXlzOiAzMCxcbiAgICAgICAgICAgICAgICAgIHN0b3JhZ2VDbGFzczogJ1NUQU5EQVJEX0lBJyxcbiAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICAgIGRheXM6IDkwLFxuICAgICAgICAgICAgICAgICAgc3RvcmFnZUNsYXNzOiAnR0xBQ0lFUicsXG4gICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgICBkYXlzOiAzNjUsXG4gICAgICAgICAgICAgICAgICBzdG9yYWdlQ2xhc3M6ICdERUVQX0FSQ0hJVkUnLFxuICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgIF0sXG4gICAgICAgICAgICB9LFxuICAgICAgICAgIF0sXG4gICAgICAgICAgdGFnczoge1xuICAgICAgICAgICAgUHVycG9zZTogJ1ByaW1hcnkgZGF0YSBzdG9yYWdlIHdpdGggZW5oYW5jZWQgc2VjdXJpdHknLFxuICAgICAgICAgIH0sXG4gICAgICAgIH0sXG4gICAgICAgIHsgcGFyZW50OiB0aGlzLCBwcm92aWRlciB9XG4gICAgICApO1xuXG4gICAgICBhdWRpdEJ1Y2tldCA9IG5ldyBFbmhhbmNlZFNlY3VyZVMzQnVja2V0KFxuICAgICAgICAnYXVkaXQtbG9ncycsXG4gICAgICAgIHtcbiAgICAgICAgICBrbXNLZXlJZDogY2xvdWRUcmFpbEttc0tleS5rZXkua2V5SWQsXG4gICAgICAgICAgYWxsb3dlZElwUmFuZ2VzLFxuICAgICAgICAgIGVuYWJsZUFjY2Vzc0xvZ2dpbmc6IHRydWUsXG4gICAgICAgICAgZW5hYmxlT2JqZWN0TG9jazogdHJ1ZSxcbiAgICAgICAgICB0YWdzOiB7XG4gICAgICAgICAgICBQdXJwb3NlOiAnQXVkaXQgYW5kIGNvbXBsaWFuY2UgbG9ncyB3aXRoIGVuaGFuY2VkIHNlY3VyaXR5JyxcbiAgICAgICAgICB9LFxuICAgICAgICB9LFxuICAgICAgICB7IHBhcmVudDogdGhpcywgcHJvdmlkZXIgfVxuICAgICAgKTtcbiAgICB9IGVsc2Uge1xuICAgICAgcHJpbWFyeUJ1Y2tldCA9IG5ldyBTZWN1cmVTM0J1Y2tldChcbiAgICAgICAgJ3ByaW1hcnktc3RvcmFnZScsXG4gICAgICAgIHtcbiAgICAgICAgICBrbXNLZXlJZDogczNLbXNLZXkua2V5LmtleUlkLFxuICAgICAgICAgIGxpZmVjeWNsZVJ1bGVzOiBbXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgIGlkOiAndHJhbnNpdGlvbi10by1pYScsXG4gICAgICAgICAgICAgIHN0YXR1czogJ0VuYWJsZWQnLFxuICAgICAgICAgICAgICB0cmFuc2l0aW9uczogW1xuICAgICAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICAgIGRheXM6IDMwLFxuICAgICAgICAgICAgICAgICAgc3RvcmFnZUNsYXNzOiAnU1RBTkRBUkRfSUEnLFxuICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgICAgZGF5czogOTAsXG4gICAgICAgICAgICAgICAgICBzdG9yYWdlQ2xhc3M6ICdHTEFDSUVSJyxcbiAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICAgIGRheXM6IDM2NSxcbiAgICAgICAgICAgICAgICAgIHN0b3JhZ2VDbGFzczogJ0RFRVBfQVJDSElWRScsXG4gICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgXSxcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgXSxcbiAgICAgICAgICB0YWdzOiB7XG4gICAgICAgICAgICBQdXJwb3NlOiAnUHJpbWFyeSBkYXRhIHN0b3JhZ2UnLFxuICAgICAgICAgIH0sXG4gICAgICAgIH0sXG4gICAgICAgIHsgcGFyZW50OiB0aGlzLCBwcm92aWRlciB9XG4gICAgICApO1xuXG4gICAgICBhdWRpdEJ1Y2tldCA9IG5ldyBTZWN1cmVTM0J1Y2tldChcbiAgICAgICAgJ2F1ZGl0LWxvZ3MnLFxuICAgICAgICB7XG4gICAgICAgICAga21zS2V5SWQ6IGNsb3VkVHJhaWxLbXNLZXkua2V5LmtleUlkLFxuICAgICAgICAgIHRhZ3M6IHtcbiAgICAgICAgICAgIFB1cnBvc2U6ICdBdWRpdCBhbmQgY29tcGxpYW5jZSBsb2dzJyxcbiAgICAgICAgICB9LFxuICAgICAgICB9LFxuICAgICAgICB7IHBhcmVudDogdGhpcywgcHJvdmlkZXIgfVxuICAgICAgKTtcbiAgICB9XG5cbiAgICAvLyBDcmVhdGUgSUFNIHJvbGVzIHdpdGggZW5oYW5jZWQgbGVhc3QgcHJpdmlsZWdlIGFuZCBNRkEgZW5mb3JjZW1lbnRcbiAgICBjb25zdCBkYXRhQWNjZXNzUm9sZSA9IG5ldyBTZWN1cmVJQU1Sb2xlKFxuICAgICAgJ2RhdGEtYWNjZXNzJyxcbiAgICAgIHtcbiAgICAgICAgYXNzdW1lUm9sZVBvbGljeTogSlNPTi5zdHJpbmdpZnkoe1xuICAgICAgICAgIFZlcnNpb246ICcyMDEyLTEwLTE3JyxcbiAgICAgICAgICBTdGF0ZW1lbnQ6IFtcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgQWN0aW9uOiAnc3RzOkFzc3VtZVJvbGUnLFxuICAgICAgICAgICAgICBFZmZlY3Q6ICdBbGxvdycsXG4gICAgICAgICAgICAgIFByaW5jaXBhbDoge1xuICAgICAgICAgICAgICAgIEFXUzogcHVsdW1pLmludGVycG9sYXRlYGFybjphd3M6aWFtOjoke2F3cy5nZXRDYWxsZXJJZGVudGl0eSgpLnRoZW4oaWQgPT4gaWQuYWNjb3VudElkKX06cm9vdGAsXG4gICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgIENvbmRpdGlvbjoge1xuICAgICAgICAgICAgICAgIEJvb2w6IHtcbiAgICAgICAgICAgICAgICAgICdhd3M6TXVsdGlGYWN0b3JBdXRoUHJlc2VudCc6ICd0cnVlJyxcbiAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgIFN0cmluZ0VxdWFsczoge1xuICAgICAgICAgICAgICAgICAgJ2F3czpSZXF1ZXN0ZWRSZWdpb24nOiAndXMtZWFzdC0xJyxcbiAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgIElwQWRkcmVzczoge1xuICAgICAgICAgICAgICAgICAgJ2F3czpTb3VyY2VJcCc6IGFsbG93ZWRJcFJhbmdlcyxcbiAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgfSxcbiAgICAgICAgICBdLFxuICAgICAgICB9KSxcbiAgICAgICAgcG9saWNpZXM6IGVuYWJsZUVuaGFuY2VkU2VjdXJpdHlcbiAgICAgICAgICA/IFtcbiAgICAgICAgICAgICAgY3JlYXRlVGltZUJhc2VkUzNBY2Nlc3NQb2xpY3kocHJpbWFyeUJ1Y2tldC5idWNrZXQuYXJuKSxcbiAgICAgICAgICAgICAgY3JlYXRlTUZBRW5mb3JjZWRQb2xpY3koKSxcbiAgICAgICAgICAgIF1cbiAgICAgICAgICA6IFtcbiAgICAgICAgICAgICAgY3JlYXRlUzNBY2Nlc3NQb2xpY3kocHJpbWFyeUJ1Y2tldC5idWNrZXQuYXJuKSxcbiAgICAgICAgICAgICAgY3JlYXRlTUZBRW5mb3JjZWRQb2xpY3koKSxcbiAgICAgICAgICAgIF0sXG4gICAgICAgIG1hbmFnZWRQb2xpY3lBcm5zOiBbXSxcbiAgICAgICAgcmVxdWlyZU1GQTogdHJ1ZSxcbiAgICAgICAgdGFnczoge1xuICAgICAgICAgIFB1cnBvc2U6XG4gICAgICAgICAgICAnRGF0YSBhY2Nlc3Mgd2l0aCBlbmhhbmNlZCBNRkEgZW5mb3JjZW1lbnQgYW5kIHRpbWUgcmVzdHJpY3Rpb25zJyxcbiAgICAgICAgfSxcbiAgICAgIH0sXG4gICAgICB7IHBhcmVudDogdGhpcywgcHJvdmlkZXIgfVxuICAgICk7XG5cbiAgICBjb25zdCBhdWRpdFJvbGUgPSBuZXcgU2VjdXJlSUFNUm9sZShcbiAgICAgICdhdWRpdC1hY2Nlc3MnLFxuICAgICAge1xuICAgICAgICBhc3N1bWVSb2xlUG9saWN5OiBKU09OLnN0cmluZ2lmeSh7XG4gICAgICAgICAgVmVyc2lvbjogJzIwMTItMTAtMTcnLFxuICAgICAgICAgIFN0YXRlbWVudDogW1xuICAgICAgICAgICAge1xuICAgICAgICAgICAgICBBY3Rpb246ICdzdHM6QXNzdW1lUm9sZScsXG4gICAgICAgICAgICAgIEVmZmVjdDogJ0FsbG93JyxcbiAgICAgICAgICAgICAgUHJpbmNpcGFsOiB7XG4gICAgICAgICAgICAgICAgQVdTOiBwdWx1bWkuaW50ZXJwb2xhdGVgYXJuOmF3czppYW06OiR7YXdzLmdldENhbGxlcklkZW50aXR5KCkudGhlbihpZCA9PiBpZC5hY2NvdW50SWQpfTpyb290YCxcbiAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgQ29uZGl0aW9uOiB7XG4gICAgICAgICAgICAgICAgQm9vbDoge1xuICAgICAgICAgICAgICAgICAgJ2F3czpNdWx0aUZhY3RvckF1dGhQcmVzZW50JzogJ3RydWUnLFxuICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgU3RyaW5nRXF1YWxzOiB7XG4gICAgICAgICAgICAgICAgICAnYXdzOlJlcXVlc3RlZFJlZ2lvbic6ICd1cy1lYXN0LTEnLFxuICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgSXBBZGRyZXNzOiB7XG4gICAgICAgICAgICAgICAgICAnYXdzOlNvdXJjZUlwJzogYWxsb3dlZElwUmFuZ2VzLFxuICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICB9LFxuICAgICAgICAgIF0sXG4gICAgICAgIH0pLFxuICAgICAgICBwb2xpY2llczogZW5hYmxlRW5oYW5jZWRTZWN1cml0eVxuICAgICAgICAgID8gW1xuICAgICAgICAgICAgICBjcmVhdGVSZXN0cmljdGVkQXVkaXRQb2xpY3koXG4gICAgICAgICAgICAgICAgYXVkaXRCdWNrZXQuYnVja2V0LmFybixcbiAgICAgICAgICAgICAgICBhbGxvd2VkSXBSYW5nZXNcbiAgICAgICAgICAgICAgKSxcbiAgICAgICAgICAgIF1cbiAgICAgICAgICA6IFtcbiAgICAgICAgICAgICAgcHVsdW1pLmludGVycG9sYXRlYHtcbiAgICAgICAgICBcIlZlcnNpb25cIjogXCIyMDEyLTEwLTE3XCIsXG4gICAgICAgICAgXCJTdGF0ZW1lbnRcIjogW1xuICAgICAgICAgICAge1xuICAgICAgICAgICAgICBcIkVmZmVjdFwiOiBcIkFsbG93XCIsXG4gICAgICAgICAgICAgIFwiQWN0aW9uXCI6IFtcbiAgICAgICAgICAgICAgICBcInMzOkdldE9iamVjdFwiLFxuICAgICAgICAgICAgICAgIFwiczM6TGlzdEJ1Y2tldFwiXG4gICAgICAgICAgICAgIF0sXG4gICAgICAgICAgICAgIFwiUmVzb3VyY2VcIjogW1xuICAgICAgICAgICAgICAgIFwiJHthdWRpdEJ1Y2tldC5idWNrZXQuYXJufVwiLFxuICAgICAgICAgICAgICAgIFwiJHthdWRpdEJ1Y2tldC5idWNrZXQuYXJufS8qXCJcbiAgICAgICAgICAgICAgXVxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgXCJFZmZlY3RcIjogXCJBbGxvd1wiLFxuICAgICAgICAgICAgICBcIkFjdGlvblwiOiBbXG4gICAgICAgICAgICAgICAgXCJjbG91ZHRyYWlsOkxvb2t1cEV2ZW50c1wiLFxuICAgICAgICAgICAgICAgIFwiY2xvdWR0cmFpbDpHZXRUcmFpbFN0YXR1c1wiXG4gICAgICAgICAgICAgIF0sXG4gICAgICAgICAgICAgIFwiUmVzb3VyY2VcIjogXCIqXCJcbiAgICAgICAgICAgIH1cbiAgICAgICAgICBdXG4gICAgICAgIH1gLFxuICAgICAgICAgICAgXSxcbiAgICAgICAgbWFuYWdlZFBvbGljeUFybnM6IFsnYXJuOmF3czppYW06OmF3czpwb2xpY3kvUmVhZE9ubHlBY2Nlc3MnXSxcbiAgICAgICAgcmVxdWlyZU1GQTogdHJ1ZSxcbiAgICAgICAgdGFnczoge1xuICAgICAgICAgIFB1cnBvc2U6ICdBdWRpdCBsb2cgYWNjZXNzIHdpdGggSVAgYW5kIHRpbWUgcmVzdHJpY3Rpb25zJyxcbiAgICAgICAgfSxcbiAgICAgIH0sXG4gICAgICB7IHBhcmVudDogdGhpcywgcHJvdmlkZXIgfVxuICAgICk7XG5cbiAgICAvLyBDcmVhdGUgQ2xvdWRUcmFpbCBmb3IgY29tcHJlaGVuc2l2ZSBsb2dnaW5nXG4gICAgbGV0IGNsb3VkVHJhaWw6IFNlY3VyZUNsb3VkVHJhaWwgfCBFbmhhbmNlZENsb3VkVHJhaWw7XG5cbiAgICBpZiAoZW5hYmxlRW5oYW5jZWRTZWN1cml0eSkge1xuICAgICAgY2xvdWRUcmFpbCA9IG5ldyBFbmhhbmNlZENsb3VkVHJhaWwoXG4gICAgICAgICdzZWN1cml0eS1hdWRpdCcsXG4gICAgICAgIHtcbiAgICAgICAgICBzM0J1Y2tldE5hbWU6IGF1ZGl0QnVja2V0LmJ1Y2tldC5pZCxcbiAgICAgICAgICBrbXNLZXlJZDogY2xvdWRUcmFpbEttc0tleS5rZXkua2V5SWQsXG4gICAgICAgICAgaW5jbHVkZUdsb2JhbFNlcnZpY2VFdmVudHM6IHRydWUsXG4gICAgICAgICAgaXNNdWx0aVJlZ2lvblRyYWlsOiB0cnVlLFxuICAgICAgICAgIGVuYWJsZUxvZ0ZpbGVWYWxpZGF0aW9uOiB0cnVlLFxuICAgICAgICAgIGVuYWJsZUluc2lnaHRTZWxlY3RvcnM6IHRydWUsXG4gICAgICAgICAgdGFnczoge1xuICAgICAgICAgICAgUHVycG9zZTpcbiAgICAgICAgICAgICAgJ0VuaGFuY2VkIHNlY3VyaXR5IGF1ZGl0IGFuZCBjb21wbGlhbmNlIHdpdGggYW5vbWFseSBkZXRlY3Rpb24nLFxuICAgICAgICAgIH0sXG4gICAgICAgIH0sXG4gICAgICAgIHsgcGFyZW50OiB0aGlzLCBwcm92aWRlciB9XG4gICAgICApO1xuICAgIH0gZWxzZSB7XG4gICAgICBjbG91ZFRyYWlsID0gbmV3IFNlY3VyZUNsb3VkVHJhaWwoXG4gICAgICAgICdzZWN1cml0eS1hdWRpdCcsXG4gICAgICAgIHtcbiAgICAgICAgICBzM0J1Y2tldE5hbWU6IGF1ZGl0QnVja2V0LmJ1Y2tldC5pZCxcbiAgICAgICAgICBrbXNLZXlJZDogY2xvdWRUcmFpbEttc0tleS5rZXkua2V5SWQsXG4gICAgICAgICAgaW5jbHVkZUdsb2JhbFNlcnZpY2VFdmVudHM6IHRydWUsXG4gICAgICAgICAgaXNNdWx0aVJlZ2lvblRyYWlsOiB0cnVlLFxuICAgICAgICAgIGVuYWJsZUxvZ0ZpbGVWYWxpZGF0aW9uOiB0cnVlLFxuICAgICAgICAgIHRhZ3M6IHtcbiAgICAgICAgICAgIFB1cnBvc2U6ICdTZWN1cml0eSBhdWRpdCBhbmQgY29tcGxpYW5jZScsXG4gICAgICAgICAgfSxcbiAgICAgICAgfSxcbiAgICAgICAgeyBwYXJlbnQ6IHRoaXMsIHByb3ZpZGVyIH1cbiAgICAgICk7XG4gICAgfVxuXG4gICAgLy8gQ3JlYXRlIGFkZGl0aW9uYWwgc2VjdXJpdHkgcG9saWNpZXMgd2l0aCBlbmhhbmNlZCBjb250cm9sc1xuICAgIGNvbnN0IHNlY3VyaXR5UG9saWN5ID0gbmV3IGF3cy5pYW0uUG9saWN5KFxuICAgICAgJ3NlY3VyaXR5LWJhc2VsaW5lJyxcbiAgICAgIHtcbiAgICAgICAgbmFtZTogYFNlY3VyaXR5QmFzZWxpbmUtJHtlbnZpcm9ubWVudFN1ZmZpeH1gLFxuICAgICAgICBkZXNjcmlwdGlvbjpcbiAgICAgICAgICAnRW5oYW5jZWQgYmFzZWxpbmUgc2VjdXJpdHkgcG9saWN5IHdpdGggY29tcHJlaGVuc2l2ZSBNRkEgcmVxdWlyZW1lbnRzJyxcbiAgICAgICAgcG9saWN5OiBKU09OLnN0cmluZ2lmeSh7XG4gICAgICAgICAgVmVyc2lvbjogJzIwMTItMTAtMTcnLFxuICAgICAgICAgIFN0YXRlbWVudDogW1xuICAgICAgICAgICAge1xuICAgICAgICAgICAgICBTaWQ6ICdSZXF1aXJlTUZBRm9yQWxsU2Vuc2l0aXZlQWN0aW9ucycsXG4gICAgICAgICAgICAgIEVmZmVjdDogJ0RlbnknLFxuICAgICAgICAgICAgICBBY3Rpb246IFtcbiAgICAgICAgICAgICAgICAnaWFtOkNyZWF0ZVJvbGUnLFxuICAgICAgICAgICAgICAgICdpYW06RGVsZXRlUm9sZScsXG4gICAgICAgICAgICAgICAgJ2lhbTpBdHRhY2hSb2xlUG9saWN5JyxcbiAgICAgICAgICAgICAgICAnaWFtOkRldGFjaFJvbGVQb2xpY3knLFxuICAgICAgICAgICAgICAgICdpYW06UHV0Um9sZVBvbGljeScsXG4gICAgICAgICAgICAgICAgJ2lhbTpEZWxldGVSb2xlUG9saWN5JyxcbiAgICAgICAgICAgICAgICAnczM6RGVsZXRlQnVja2V0JyxcbiAgICAgICAgICAgICAgICAnczM6UHV0QnVja2V0UG9saWN5JyxcbiAgICAgICAgICAgICAgICAna21zOlNjaGVkdWxlS2V5RGVsZXRpb24nLFxuICAgICAgICAgICAgICAgICdrbXM6RGlzYWJsZUtleScsXG4gICAgICAgICAgICAgICAgJ2Nsb3VkdHJhaWw6RGVsZXRlVHJhaWwnLFxuICAgICAgICAgICAgICAgICdjbG91ZHRyYWlsOlN0b3BMb2dnaW5nJyxcbiAgICAgICAgICAgICAgXSxcbiAgICAgICAgICAgICAgUmVzb3VyY2U6ICcqJyxcbiAgICAgICAgICAgICAgQ29uZGl0aW9uOiB7XG4gICAgICAgICAgICAgICAgQm9vbElmRXhpc3RzOiB7XG4gICAgICAgICAgICAgICAgICAnYXdzOk11bHRpRmFjdG9yQXV0aFByZXNlbnQnOiAnZmFsc2UnLFxuICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAge1xuICAgICAgICAgICAgICBTaWQ6ICdSZXN0cmljdFRvVVNFYXN0MU9ubHknLFxuICAgICAgICAgICAgICBFZmZlY3Q6ICdEZW55JyxcbiAgICAgICAgICAgICAgQWN0aW9uOiAnKicsXG4gICAgICAgICAgICAgIFJlc291cmNlOiAnKicsXG4gICAgICAgICAgICAgIENvbmRpdGlvbjoge1xuICAgICAgICAgICAgICAgIFN0cmluZ05vdEVxdWFsczoge1xuICAgICAgICAgICAgICAgICAgJ2F3czpSZXF1ZXN0ZWRSZWdpb24nOiAndXMtZWFzdC0xJyxcbiAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgU2lkOiAnUmVxdWlyZUVuY3J5cHRlZFN0b3JhZ2UnLFxuICAgICAgICAgICAgICBFZmZlY3Q6ICdEZW55JyxcbiAgICAgICAgICAgICAgQWN0aW9uOiBbXG4gICAgICAgICAgICAgICAgJ3MzOlB1dE9iamVjdCcsXG4gICAgICAgICAgICAgICAgJ2ViczpDcmVhdGVWb2x1bWUnLFxuICAgICAgICAgICAgICAgICdyZHM6Q3JlYXRlREJJbnN0YW5jZScsXG4gICAgICAgICAgICAgIF0sXG4gICAgICAgICAgICAgIFJlc291cmNlOiAnKicsXG4gICAgICAgICAgICAgIENvbmRpdGlvbjoge1xuICAgICAgICAgICAgICAgIEJvb2w6IHtcbiAgICAgICAgICAgICAgICAgICdhd3M6U2VjdXJlVHJhbnNwb3J0JzogJ2ZhbHNlJyxcbiAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgfSxcbiAgICAgICAgICBdLFxuICAgICAgICB9KSxcbiAgICAgICAgdGFnczogeyAuLi5jb21tb25UYWdzLCAuLi50YWdzIH0sXG4gICAgICB9LFxuICAgICAgeyBwYXJlbnQ6IHRoaXMsIHByb3ZpZGVyIH1cbiAgICApO1xuXG4gICAgLy8gQXNzaWduIG91dHB1dHNcbiAgICB0aGlzLnByaW1hcnlCdWNrZXROYW1lID0gcHJpbWFyeUJ1Y2tldC5idWNrZXQuaWQ7XG4gICAgdGhpcy5wcmltYXJ5QnVja2V0QXJuID0gcHJpbWFyeUJ1Y2tldC5idWNrZXQuYXJuO1xuICAgIHRoaXMuYXVkaXRCdWNrZXROYW1lID0gYXVkaXRCdWNrZXQuYnVja2V0LmlkO1xuICAgIHRoaXMuYXVkaXRCdWNrZXRBcm4gPSBhdWRpdEJ1Y2tldC5idWNrZXQuYXJuO1xuICAgIHRoaXMuczNLbXNLZXlJZCA9IHMzS21zS2V5LmtleS5rZXlJZDtcbiAgICB0aGlzLnMzS21zS2V5QXJuID0gczNLbXNLZXkua2V5LmFybjtcbiAgICB0aGlzLmNsb3VkVHJhaWxLbXNLZXlJZCA9IGNsb3VkVHJhaWxLbXNLZXkua2V5LmtleUlkO1xuICAgIHRoaXMuY2xvdWRUcmFpbEttc0tleUFybiA9IGNsb3VkVHJhaWxLbXNLZXkua2V5LmFybjtcbiAgICB0aGlzLmRhdGFBY2Nlc3NSb2xlQXJuID0gZGF0YUFjY2Vzc1JvbGUucm9sZS5hcm47XG4gICAgdGhpcy5hdWRpdFJvbGVBcm4gPSBhdWRpdFJvbGUucm9sZS5hcm47XG4gICAgdGhpcy5jbG91ZFRyYWlsQXJuID0gY2xvdWRUcmFpbC50cmFpbC5hcm47XG4gICAgdGhpcy5jbG91ZFRyYWlsTG9nR3JvdXBBcm4gPSBjbG91ZFRyYWlsLmxvZ0dyb3VwLmFybjtcbiAgICB0aGlzLnNlY3VyaXR5UG9saWN5QXJuID0gc2VjdXJpdHlQb2xpY3kuYXJuO1xuICAgIHRoaXMubWZhRW5mb3JjZW1lbnRQb2xpY3lBcm4gPSBzZWN1cml0eVBvbGljaWVzLm1mYUVuZm9yY2VtZW50UG9saWN5LmFybjtcbiAgICB0aGlzLnMzU2VjdXJpdHlQb2xpY3lBcm4gPSBzZWN1cml0eVBvbGljaWVzLnMzRGVueUluc2VjdXJlUG9saWN5LmFybjtcbiAgICB0aGlzLmNsb3VkVHJhaWxQcm90ZWN0aW9uUG9saWN5QXJuID1cbiAgICAgIHNlY3VyaXR5UG9saWNpZXMuY2xvdWRUcmFpbFByb3RlY3Rpb25Qb2xpY3kuYXJuO1xuICAgIHRoaXMua21zUHJvdGVjdGlvblBvbGljeUFybiA9IHNlY3VyaXR5UG9saWNpZXMua21zS2V5UHJvdGVjdGlvblBvbGljeS5hcm47XG4gICAgdGhpcy5yZWdpb24gPSAndXMtZWFzdC0xJztcblxuICAgIC8vIFJlZ2lzdGVyIHRoZSBvdXRwdXRzIG9mIHRoaXMgY29tcG9uZW50XG4gICAgdGhpcy5yZWdpc3Rlck91dHB1dHMoe1xuICAgICAgcHJpbWFyeUJ1Y2tldE5hbWU6IHRoaXMucHJpbWFyeUJ1Y2tldE5hbWUsXG4gICAgICBwcmltYXJ5QnVja2V0QXJuOiB0aGlzLnByaW1hcnlCdWNrZXRBcm4sXG4gICAgICBhdWRpdEJ1Y2tldE5hbWU6IHRoaXMuYXVkaXRCdWNrZXROYW1lLFxuICAgICAgYXVkaXRCdWNrZXRBcm46IHRoaXMuYXVkaXRCdWNrZXRBcm4sXG4gICAgICBzM0ttc0tleUlkOiB0aGlzLnMzS21zS2V5SWQsXG4gICAgICBzM0ttc0tleUFybjogdGhpcy5zM0ttc0tleUFybixcbiAgICAgIGNsb3VkVHJhaWxLbXNLZXlJZDogdGhpcy5jbG91ZFRyYWlsS21zS2V5SWQsXG4gICAgICBjbG91ZFRyYWlsS21zS2V5QXJuOiB0aGlzLmNsb3VkVHJhaWxLbXNLZXlBcm4sXG4gICAgICBkYXRhQWNjZXNzUm9sZUFybjogdGhpcy5kYXRhQWNjZXNzUm9sZUFybixcbiAgICAgIGF1ZGl0Um9sZUFybjogdGhpcy5hdWRpdFJvbGVBcm4sXG4gICAgICBjbG91ZFRyYWlsQXJuOiB0aGlzLmNsb3VkVHJhaWxBcm4sXG4gICAgICBjbG91ZFRyYWlsTG9nR3JvdXBBcm46IHRoaXMuY2xvdWRUcmFpbExvZ0dyb3VwQXJuLFxuICAgICAgc2VjdXJpdHlQb2xpY3lBcm46IHRoaXMuc2VjdXJpdHlQb2xpY3lBcm4sXG4gICAgICBtZmFFbmZvcmNlbWVudFBvbGljeUFybjogdGhpcy5tZmFFbmZvcmNlbWVudFBvbGljeUFybixcbiAgICAgIHMzU2VjdXJpdHlQb2xpY3lBcm46IHRoaXMuczNTZWN1cml0eVBvbGljeUFybixcbiAgICAgIGNsb3VkVHJhaWxQcm90ZWN0aW9uUG9saWN5QXJuOiB0aGlzLmNsb3VkVHJhaWxQcm90ZWN0aW9uUG9saWN5QXJuLFxuICAgICAga21zUHJvdGVjdGlvblBvbGljeUFybjogdGhpcy5rbXNQcm90ZWN0aW9uUG9saWN5QXJuLFxuICAgICAgcmVnaW9uOiB0aGlzLnJlZ2lvbixcbiAgICB9KTtcbiAgfVxufVxuIl19