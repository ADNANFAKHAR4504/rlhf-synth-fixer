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
exports.SecurityPolicies = void 0;
exports.createTimeBasedS3AccessPolicy = createTimeBasedS3AccessPolicy;
exports.createRestrictedAuditPolicy = createRestrictedAuditPolicy;
const aws = __importStar(require("@pulumi/aws"));
const pulumi = __importStar(require("@pulumi/pulumi"));
const tags_1 = require("../../config/tags");
class SecurityPolicies extends pulumi.ComponentResource {
    mfaEnforcementPolicy;
    s3DenyInsecurePolicy;
    cloudTrailProtectionPolicy;
    kmsKeyProtectionPolicy;
    constructor(name, args, opts) {
        super('custom:security:SecurityPolicies', name, args, opts);
        const environmentSuffix = args?.environmentSuffix || 'dev';
        const tags = { ...tags_1.commonTags, ...args?.tags };
        // Enhanced MFA enforcement policy for ALL sensitive actions
        this.mfaEnforcementPolicy = new aws.iam.Policy(`${name}-mfa-enforcement`, {
            name: `MFAEnforcementPolicy-${environmentSuffix}`,
            description: 'Enforces MFA for all sensitive AWS operations',
            policy: JSON.stringify({
                Version: '2012-10-17',
                Statement: [
                    {
                        Sid: 'DenyAllSensitiveActionsWithoutMFA',
                        Effect: 'Deny',
                        Action: [
                            // IAM sensitive actions
                            'iam:CreateRole',
                            'iam:DeleteRole',
                            'iam:AttachRolePolicy',
                            'iam:DetachRolePolicy',
                            'iam:PutRolePolicy',
                            'iam:DeleteRolePolicy',
                            'iam:CreateUser',
                            'iam:DeleteUser',
                            'iam:CreateAccessKey',
                            'iam:DeleteAccessKey',
                            'iam:UpdateAccessKey',
                            'iam:CreatePolicy',
                            'iam:DeletePolicy',
                            'iam:CreatePolicyVersion',
                            'iam:DeletePolicyVersion',
                            // S3 sensitive actions
                            's3:DeleteBucket',
                            's3:PutBucketPolicy',
                            's3:DeleteBucketPolicy',
                            's3:PutBucketAcl',
                            's3:PutBucketPublicAccessBlock',
                            's3:DeleteBucketPublicAccessBlock',
                            's3:PutBucketVersioning',
                            's3:PutBucketEncryption',
                            's3:DeleteBucketEncryption',
                            // KMS sensitive actions
                            'kms:ScheduleKeyDeletion',
                            'kms:DisableKey',
                            'kms:CancelKeyDeletion',
                            'kms:PutKeyPolicy',
                            'kms:CreateKey',
                            'kms:CreateAlias',
                            'kms:DeleteAlias',
                            // CloudTrail sensitive actions
                            'cloudtrail:DeleteTrail',
                            'cloudtrail:StopLogging',
                            'cloudtrail:PutEventSelectors',
                            'cloudtrail:UpdateTrail',
                            // EC2 sensitive actions
                            'ec2:TerminateInstances',
                            'ec2:StopInstances',
                            'ec2:ModifyInstanceAttribute',
                            'ec2:CreateSecurityGroup',
                            'ec2:DeleteSecurityGroup',
                            'ec2:AuthorizeSecurityGroupIngress',
                            'ec2:AuthorizeSecurityGroupEgress',
                            'ec2:RevokeSecurityGroupIngress',
                            'ec2:RevokeSecurityGroupEgress',
                        ],
                        Resource: '*',
                        Condition: {
                            BoolIfExists: {
                                'aws:MultiFactorAuthPresent': 'false',
                            },
                        },
                    },
                    {
                        Sid: 'DenyRootAccountUsage',
                        Effect: 'Deny',
                        Action: '*',
                        Resource: '*',
                        Condition: {
                            StringEquals: {
                                'aws:userid': 'root',
                            },
                        },
                    },
                ],
            }),
            tags,
        }, { parent: this });
        // S3 security enforcement policy
        this.s3DenyInsecurePolicy = new aws.iam.Policy(`${name}-s3-security`, {
            name: `S3SecurityPolicy-${environmentSuffix}`,
            description: 'Enforces secure S3 operations only',
            policy: JSON.stringify({
                Version: '2012-10-17',
                Statement: [
                    {
                        Sid: 'DenyInsecureS3Operations',
                        Effect: 'Deny',
                        Action: ['s3:PutObject'],
                        Resource: 'arn:aws:s3:::*/*',
                        Condition: {
                            StringNotEquals: {
                                's3:x-amz-server-side-encryption': ['aws:kms', 'AES256'],
                            },
                        },
                    },
                    {
                        Sid: 'DenyUnencryptedS3Uploads',
                        Effect: 'Deny',
                        Action: ['s3:PutObject'],
                        Resource: 'arn:aws:s3:::*/*',
                        Condition: {
                            Null: {
                                's3:x-amz-server-side-encryption': 'true',
                            },
                        },
                    },
                    {
                        Sid: 'DenyInsecureS3Connections',
                        Effect: 'Deny',
                        Action: 's3:*',
                        Resource: ['arn:aws:s3:::*', 'arn:aws:s3:::*/*'],
                        Condition: {
                            Bool: {
                                'aws:SecureTransport': 'false',
                            },
                        },
                    },
                    {
                        Sid: 'DenyPublicS3Access',
                        Effect: 'Deny',
                        Action: [
                            's3:PutBucketAcl',
                            's3:PutObjectAcl',
                            's3:PutBucketPolicy',
                        ],
                        Resource: ['arn:aws:s3:::*', 'arn:aws:s3:::*/*'],
                        Condition: {
                            StringEquals: {
                                's3:x-amz-acl': [
                                    'public-read',
                                    'public-read-write',
                                    'authenticated-read',
                                ],
                            },
                        },
                    },
                ],
            }),
            tags,
        }, { parent: this });
        // CloudTrail protection policy
        this.cloudTrailProtectionPolicy = new aws.iam.Policy(`${name}-cloudtrail-protection`, {
            name: `CloudTrailProtectionPolicy-${environmentSuffix}`,
            description: 'Protects CloudTrail from unauthorized modifications',
            policy: JSON.stringify({
                Version: '2012-10-17',
                Statement: [
                    {
                        Sid: 'DenyCloudTrailDisabling',
                        Effect: 'Deny',
                        Action: [
                            'cloudtrail:StopLogging',
                            'cloudtrail:DeleteTrail',
                            'cloudtrail:PutEventSelectors',
                        ],
                        Resource: '*',
                        Condition: {
                            StringNotEquals: {
                                'aws:userid': [
                                    // Add specific admin user IDs here
                                    'AIDACKCEVSQ6C2EXAMPLE',
                                ],
                            },
                        },
                    },
                    {
                        Sid: 'DenyCloudTrailS3BucketModification',
                        Effect: 'Deny',
                        Action: [
                            's3:DeleteObject',
                            's3:DeleteObjectVersion',
                            's3:PutBucketPolicy',
                            's3:DeleteBucketPolicy',
                        ],
                        Resource: [
                            'arn:aws:s3:::*cloudtrail*',
                            'arn:aws:s3:::*cloudtrail*/*',
                            'arn:aws:s3:::*audit*',
                            'arn:aws:s3:::*audit*/*',
                        ],
                        Condition: {
                            StringNotEquals: {
                                'aws:userid': [
                                    // Add specific admin user IDs here
                                    'AIDACKCEVSQ6C2EXAMPLE',
                                ],
                            },
                        },
                    },
                ],
            }),
            tags,
        }, { parent: this });
        // KMS key protection policy
        this.kmsKeyProtectionPolicy = new aws.iam.Policy(`${name}-kms-protection`, {
            name: `KMSKeyProtectionPolicy-${environmentSuffix}`,
            description: 'Protects KMS keys from unauthorized access and deletion',
            policy: JSON.stringify({
                Version: '2012-10-17',
                Statement: [
                    {
                        Sid: 'DenyKMSKeyDeletion',
                        Effect: 'Deny',
                        Action: ['kms:ScheduleKeyDeletion', 'kms:DisableKey'],
                        Resource: '*',
                        Condition: {
                            StringNotEquals: {
                                'aws:userid': [
                                    // Add specific admin user IDs here
                                    'AIDACKCEVSQ6C2EXAMPLE',
                                ],
                            },
                        },
                    },
                    {
                        Sid: 'DenyKMSKeyPolicyChanges',
                        Effect: 'Deny',
                        Action: ['kms:PutKeyPolicy'],
                        Resource: '*',
                        Condition: {
                            StringNotEquals: {
                                'aws:userid': [
                                    // Add specific admin user IDs here
                                    'AIDACKCEVSQ6C2EXAMPLE',
                                ],
                            },
                        },
                    },
                ],
            }),
            tags,
        }, { parent: this });
        this.registerOutputs({
            mfaEnforcementPolicyArn: this.mfaEnforcementPolicy.arn,
            s3DenyInsecurePolicyArn: this.s3DenyInsecurePolicy.arn,
            cloudTrailProtectionPolicyArn: this.cloudTrailProtectionPolicy.arn,
            kmsKeyProtectionPolicyArn: this.kmsKeyProtectionPolicy.arn,
        });
    }
}
exports.SecurityPolicies = SecurityPolicies;
// Enhanced least privilege S3 policy with time-based access
function createTimeBasedS3AccessPolicy(bucketArn, allowedHours = [
    '09',
    '10',
    '11',
    '12',
    '13',
    '14',
    '15',
    '16',
    '17',
]) {
    return pulumi.interpolate `{
    "Version": "2012-10-17",
    "Statement": [
      {
        "Effect": "Allow",
        "Action": [
          "s3:GetObject"
        ],
        "Resource": "${bucketArn}/*",
        "Condition": {
          "DateGreaterThan": {
            "aws:TokenIssueTime": "2024-01-01T00:00:00Z"
          },
          "StringLike": {
            "aws:RequestedRegion": "us-east-1"
          }
        }
      },
      {
        "Effect": "Allow",
        "Action": [
          "s3:PutObject"
        ],
        "Resource": "${bucketArn}/*",
        "Condition": {
          "StringEquals": {
            "s3:x-amz-server-side-encryption": "aws:kms"
          },
          "StringLike": {
            "aws:RequestedRegion": "us-east-1"
          },
          "ForAllValues:StringEquals": {
            "aws:RequestedHour": ${JSON.stringify(allowedHours)}
          }
        }
      },
      {
        "Effect": "Allow",
        "Action": [
          "s3:ListBucket"
        ],
        "Resource": "${bucketArn}",
        "Condition": {
          "StringLike": {
            "aws:RequestedRegion": "us-east-1"
          }
        }
      },
      {
        "Effect": "Deny",
        "Action": [
          "s3:DeleteObject",
          "s3:DeleteObjectVersion"
        ],
        "Resource": "${bucketArn}/*"
      }
    ]
  }`;
}
// Read-only audit access policy with IP restrictions
function createRestrictedAuditPolicy(auditBucketArn, allowedIpRanges = ['203.0.113.0/24']) {
    return pulumi.interpolate `{
    "Version": "2012-10-17",
    "Statement": [
      {
        "Effect": "Allow",
        "Action": [
          "s3:GetObject",
          "s3:ListBucket"
        ],
        "Resource": [
          "${auditBucketArn}",
          "${auditBucketArn}/*"
        ],
        "Condition": {
          "IpAddress": {
            "aws:SourceIp": ${JSON.stringify(allowedIpRanges)}
          },
          "StringLike": {
            "aws:RequestedRegion": "us-east-1"
          }
        }
      },
      {
        "Effect": "Allow",
        "Action": [
          "cloudtrail:LookupEvents"
        ],
        "Resource": "*",
        "Condition": {
          "IpAddress": {
            "aws:SourceIp": ${JSON.stringify(allowedIpRanges)}
          },
          "StringLike": {
            "aws:RequestedRegion": "us-east-1"
          }
        }
      },
      {
        "Effect": "Deny",
        "NotAction": [
          "s3:GetObject",
          "s3:ListBucket",
          "cloudtrail:LookupEvents",
          "cloudtrail:GetTrailStatus"
        ],
        "Resource": "*"
      }
    ]
  }`;
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJpbmRleC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFxU0Esc0VBd0VDO0FBR0Qsa0VBcURDO0FBcmFELGlEQUFtQztBQUNuQyx1REFBeUM7QUFDekMsNENBQStDO0FBTy9DLE1BQWEsZ0JBQWlCLFNBQVEsTUFBTSxDQUFDLGlCQUFpQjtJQUM1QyxvQkFBb0IsQ0FBaUI7SUFDckMsb0JBQW9CLENBQWlCO0lBQ3JDLDBCQUEwQixDQUFpQjtJQUMzQyxzQkFBc0IsQ0FBaUI7SUFFdkQsWUFDRSxJQUFZLEVBQ1osSUFBMkIsRUFDM0IsSUFBc0M7UUFFdEMsS0FBSyxDQUFDLGtDQUFrQyxFQUFFLElBQUksRUFBRSxJQUFJLEVBQUUsSUFBSSxDQUFDLENBQUM7UUFFNUQsTUFBTSxpQkFBaUIsR0FBRyxJQUFJLEVBQUUsaUJBQWlCLElBQUksS0FBSyxDQUFDO1FBQzNELE1BQU0sSUFBSSxHQUFHLEVBQUUsR0FBRyxpQkFBVSxFQUFFLEdBQUcsSUFBSSxFQUFFLElBQUksRUFBRSxDQUFDO1FBRTlDLDREQUE0RDtRQUM1RCxJQUFJLENBQUMsb0JBQW9CLEdBQUcsSUFBSSxHQUFHLENBQUMsR0FBRyxDQUFDLE1BQU0sQ0FDNUMsR0FBRyxJQUFJLGtCQUFrQixFQUN6QjtZQUNFLElBQUksRUFBRSx3QkFBd0IsaUJBQWlCLEVBQUU7WUFDakQsV0FBVyxFQUFFLCtDQUErQztZQUM1RCxNQUFNLEVBQUUsSUFBSSxDQUFDLFNBQVMsQ0FBQztnQkFDckIsT0FBTyxFQUFFLFlBQVk7Z0JBQ3JCLFNBQVMsRUFBRTtvQkFDVDt3QkFDRSxHQUFHLEVBQUUsbUNBQW1DO3dCQUN4QyxNQUFNLEVBQUUsTUFBTTt3QkFDZCxNQUFNLEVBQUU7NEJBQ04sd0JBQXdCOzRCQUN4QixnQkFBZ0I7NEJBQ2hCLGdCQUFnQjs0QkFDaEIsc0JBQXNCOzRCQUN0Qixz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O0lBa0J6RCxDQUFDO0FBQ0wsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCAqIGFzIGF3cyBmcm9tICdAcHVsdW1pL2F3cyc7XG5pbXBvcnQgKiBhcyBwdWx1bWkgZnJvbSAnQHB1bHVtaS9wdWx1bWknO1xuaW1wb3J0IHsgY29tbW9uVGFncyB9IGZyb20gJy4uLy4uL2NvbmZpZy90YWdzJztcblxuZXhwb3J0IGludGVyZmFjZSBTZWN1cml0eVBvbGljaWVzQXJncyB7XG4gIGVudmlyb25tZW50U3VmZml4Pzogc3RyaW5nO1xuICB0YWdzPzogUmVjb3JkPHN0cmluZywgc3RyaW5nPjtcbn1cblxuZXhwb3J0IGNsYXNzIFNlY3VyaXR5UG9saWNpZXMgZXh0ZW5kcyBwdWx1bWkuQ29tcG9uZW50UmVzb3VyY2Uge1xuICBwdWJsaWMgcmVhZG9ubHkgbWZhRW5mb3JjZW1lbnRQb2xpY3k6IGF3cy5pYW0uUG9saWN5O1xuICBwdWJsaWMgcmVhZG9ubHkgczNEZW55SW5zZWN1cmVQb2xpY3k6IGF3cy5pYW0uUG9saWN5O1xuICBwdWJsaWMgcmVhZG9ubHkgY2xvdWRUcmFpbFByb3RlY3Rpb25Qb2xpY3k6IGF3cy5pYW0uUG9saWN5O1xuICBwdWJsaWMgcmVhZG9ubHkga21zS2V5UHJvdGVjdGlvblBvbGljeTogYXdzLmlhbS5Qb2xpY3k7XG5cbiAgY29uc3RydWN0b3IoXG4gICAgbmFtZTogc3RyaW5nLFxuICAgIGFyZ3M/OiBTZWN1cml0eVBvbGljaWVzQXJncyxcbiAgICBvcHRzPzogcHVsdW1pLkNvbXBvbmVudFJlc291cmNlT3B0aW9uc1xuICApIHtcbiAgICBzdXBlcignY3VzdG9tOnNlY3VyaXR5OlNlY3VyaXR5UG9saWNpZXMnLCBuYW1lLCBhcmdzLCBvcHRzKTtcblxuICAgIGNvbnN0IGVudmlyb25tZW50U3VmZml4ID0gYXJncz8uZW52aXJvbm1lbnRTdWZmaXggfHwgJ2Rldic7XG4gICAgY29uc3QgdGFncyA9IHsgLi4uY29tbW9uVGFncywgLi4uYXJncz8udGFncyB9O1xuXG4gICAgLy8gRW5oYW5jZWQgTUZBIGVuZm9yY2VtZW50IHBvbGljeSBmb3IgQUxMIHNlbnNpdGl2ZSBhY3Rpb25zXG4gICAgdGhpcy5tZmFFbmZvcmNlbWVudFBvbGljeSA9IG5ldyBhd3MuaWFtLlBvbGljeShcbiAgICAgIGAke25hbWV9LW1mYS1lbmZvcmNlbWVudGAsXG4gICAgICB7XG4gICAgICAgIG5hbWU6IGBNRkFFbmZvcmNlbWVudFBvbGljeS0ke2Vudmlyb25tZW50U3VmZml4fWAsXG4gICAgICAgIGRlc2NyaXB0aW9uOiAnRW5mb3JjZXMgTUZBIGZvciBhbGwgc2Vuc2l0aXZlIEFXUyBvcGVyYXRpb25zJyxcbiAgICAgICAgcG9saWN5OiBKU09OLnN0cmluZ2lmeSh7XG4gICAgICAgICAgVmVyc2lvbjogJzIwMTItMTAtMTcnLFxuICAgICAgICAgIFN0YXRlbWVudDogW1xuICAgICAgICAgICAge1xuICAgICAgICAgICAgICBTaWQ6ICdEZW55QWxsU2Vuc2l0aXZlQWN0aW9uc1dpdGhvdXRNRkEnLFxuICAgICAgICAgICAgICBFZmZlY3Q6ICdEZW55JyxcbiAgICAgICAgICAgICAgQWN0aW9uOiBbXG4gICAgICAgICAgICAgICAgLy8gSUFNIHNlbnNpdGl2ZSBhY3Rpb25zXG4gICAgICAgICAgICAgICAgJ2lhbTpDcmVhdGVSb2xlJyxcbiAgICAgICAgICAgICAgICAnaWFtOkRlbGV0ZVJvbGUnLFxuICAgICAgICAgICAgICAgICdpYW06QXR0YWNoUm9sZVBvbGljeScsXG4gICAgICAgICAgICAgICAgJ2lhbTpEZXRhY2hSb2xlUG9saWN5JyxcbiAgICAgICAgICAgICAgICAnaWFtOlB1dFJvbGVQb2xpY3knLFxuICAgICAgICAgICAgICAgICdpYW06RGVsZXRlUm9sZVBvbGljeScsXG4gICAgICAgICAgICAgICAgJ2lhbTpDcmVhdGVVc2VyJyxcbiAgICAgICAgICAgICAgICAnaWFtOkRlbGV0ZVVzZXInLFxuICAgICAgICAgICAgICAgICdpYW06Q3JlYXRlQWNjZXNzS2V5JyxcbiAgICAgICAgICAgICAgICAnaWFtOkRlbGV0ZUFjY2Vzc0tleScsXG4gICAgICAgICAgICAgICAgJ2lhbTpVcGRhdGVBY2Nlc3NLZXknLFxuICAgICAgICAgICAgICAgICdpYW06Q3JlYXRlUG9saWN5JyxcbiAgICAgICAgICAgICAgICAnaWFtOkRlbGV0ZVBvbGljeScsXG4gICAgICAgICAgICAgICAgJ2lhbTpDcmVhdGVQb2xpY3lWZXJzaW9uJyxcbiAgICAgICAgICAgICAgICAnaWFtOkRlbGV0ZVBvbGljeVZlcnNpb24nLFxuICAgICAgICAgICAgICAgIC8vIFMzIHNlbnNpdGl2ZSBhY3Rpb25zXG4gICAgICAgICAgICAgICAgJ3MzOkRlbGV0ZUJ1Y2tldCcsXG4gICAgICAgICAgICAgICAgJ3MzOlB1dEJ1Y2tldFBvbGljeScsXG4gICAgICAgICAgICAgICAgJ3MzOkRlbGV0ZUJ1Y2tldFBvbGljeScsXG4gICAgICAgICAgICAgICAgJ3MzOlB1dEJ1Y2tldEFjbCcsXG4gICAgICAgICAgICAgICAgJ3MzOlB1dEJ1Y2tldFB1YmxpY0FjY2Vzc0Jsb2NrJyxcbiAgICAgICAgICAgICAgICAnczM6RGVsZXRlQnVja2V0UHVibGljQWNjZXNzQmxvY2snLFxuICAgICAgICAgICAgICAgICdzMzpQdXRCdWNrZXRWZXJzaW9uaW5nJyxcbiAgICAgICAgICAgICAgICAnczM6UHV0QnVja2V0RW5jcnlwdGlvbicsXG4gICAgICAgICAgICAgICAgJ3MzOkRlbGV0ZUJ1Y2tldEVuY3J5cHRpb24nLFxuICAgICAgICAgICAgICAgIC8vIEtNUyBzZW5zaXRpdmUgYWN0aW9uc1xuICAgICAgICAgICAgICAgICdrbXM6U2NoZWR1bGVLZXlEZWxldGlvbicsXG4gICAgICAgICAgICAgICAgJ2ttczpEaXNhYmxlS2V5JyxcbiAgICAgICAgICAgICAgICAna21zOkNhbmNlbEtleURlbGV0aW9uJyxcbiAgICAgICAgICAgICAgICAna21zOlB1dEtleVBvbGljeScsXG4gICAgICAgICAgICAgICAgJ2ttczpDcmVhdGVLZXknLFxuICAgICAgICAgICAgICAgICdrbXM6Q3JlYXRlQWxpYXMnLFxuICAgICAgICAgICAgICAgICdrbXM6RGVsZXRlQWxpYXMnLFxuICAgICAgICAgICAgICAgIC8vIENsb3VkVHJhaWwgc2Vuc2l0aXZlIGFjdGlvbnNcbiAgICAgICAgICAgICAgICAnY2xvdWR0cmFpbDpEZWxldGVUcmFpbCcsXG4gICAgICAgICAgICAgICAgJ2Nsb3VkdHJhaWw6U3RvcExvZ2dpbmcnLFxuICAgICAgICAgICAgICAgICdjbG91ZHRyYWlsOlB1dEV2ZW50U2VsZWN0b3JzJyxcbiAgICAgICAgICAgICAgICAnY2xvdWR0cmFpbDpVcGRhdGVUcmFpbCcsXG4gICAgICAgICAgICAgICAgLy8gRUMyIHNlbnNpdGl2ZSBhY3Rpb25zXG4gICAgICAgICAgICAgICAgJ2VjMjpUZXJtaW5hdGVJbnN0YW5jZXMnLFxuICAgICAgICAgICAgICAgICdlYzI6U3RvcEluc3RhbmNlcycsXG4gICAgICAgICAgICAgICAgJ2VjMjpNb2RpZnlJbnN0YW5jZUF0dHJpYnV0ZScsXG4gICAgICAgICAgICAgICAgJ2VjMjpDcmVhdGVTZWN1cml0eUdyb3VwJyxcbiAgICAgICAgICAgICAgICAnZWMyOkRlbGV0ZVNlY3VyaXR5R3JvdXAnLFxuICAgICAgICAgICAgICAgICdlYzI6QXV0aG9yaXplU2VjdXJpdHlHcm91cEluZ3Jlc3MnLFxuICAgICAgICAgICAgICAgICdlYzI6QXV0aG9yaXplU2VjdXJpdHlHcm91cEVncmVzcycsXG4gICAgICAgICAgICAgICAgJ2VjMjpSZXZva2VTZWN1cml0eUdyb3VwSW5ncmVzcycsXG4gICAgICAgICAgICAgICAgJ2VjMjpSZXZva2VTZWN1cml0eUdyb3VwRWdyZXNzJyxcbiAgICAgICAgICAgICAgXSxcbiAgICAgICAgICAgICAgUmVzb3VyY2U6ICcqJyxcbiAgICAgICAgICAgICAgQ29uZGl0aW9uOiB7XG4gICAgICAgICAgICAgICAgQm9vbElmRXhpc3RzOiB7XG4gICAgICAgICAgICAgICAgICAnYXdzOk11bHRpRmFjdG9yQXV0aFByZXNlbnQnOiAnZmFsc2UnLFxuICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAge1xuICAgICAgICAgICAgICBTaWQ6ICdEZW55Um9vdEFjY291bnRVc2FnZScsXG4gICAgICAgICAgICAgIEVmZmVjdDogJ0RlbnknLFxuICAgICAgICAgICAgICBBY3Rpb246ICcqJyxcbiAgICAgICAgICAgICAgUmVzb3VyY2U6ICcqJyxcbiAgICAgICAgICAgICAgQ29uZGl0aW9uOiB7XG4gICAgICAgICAgICAgICAgU3RyaW5nRXF1YWxzOiB7XG4gICAgICAgICAgICAgICAgICAnYXdzOnVzZXJpZCc6ICdyb290JyxcbiAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgfSxcbiAgICAgICAgICBdLFxuICAgICAgICB9KSxcbiAgICAgICAgdGFncyxcbiAgICAgIH0sXG4gICAgICB7IHBhcmVudDogdGhpcyB9XG4gICAgKTtcblxuICAgIC8vIFMzIHNlY3VyaXR5IGVuZm9yY2VtZW50IHBvbGljeVxuICAgIHRoaXMuczNEZW55SW5zZWN1cmVQb2xpY3kgPSBuZXcgYXdzLmlhbS5Qb2xpY3koXG4gICAgICBgJHtuYW1lfS1zMy1zZWN1cml0eWAsXG4gICAgICB7XG4gICAgICAgIG5hbWU6IGBTM1NlY3VyaXR5UG9saWN5LSR7ZW52aXJvbm1lbnRTdWZmaXh9YCxcbiAgICAgICAgZGVzY3JpcHRpb246ICdFbmZvcmNlcyBzZWN1cmUgUzMgb3BlcmF0aW9ucyBvbmx5JyxcbiAgICAgICAgcG9saWN5OiBKU09OLnN0cmluZ2lmeSh7XG4gICAgICAgICAgVmVyc2lvbjogJzIwMTItMTAtMTcnLFxuICAgICAgICAgIFN0YXRlbWVudDogW1xuICAgICAgICAgICAge1xuICAgICAgICAgICAgICBTaWQ6ICdEZW55SW5zZWN1cmVTM09wZXJhdGlvbnMnLFxuICAgICAgICAgICAgICBFZmZlY3Q6ICdEZW55JyxcbiAgICAgICAgICAgICAgQWN0aW9uOiBbJ3MzOlB1dE9iamVjdCddLFxuICAgICAgICAgICAgICBSZXNvdXJjZTogJ2Fybjphd3M6czM6OjoqLyonLFxuICAgICAgICAgICAgICBDb25kaXRpb246IHtcbiAgICAgICAgICAgICAgICBTdHJpbmdOb3RFcXVhbHM6IHtcbiAgICAgICAgICAgICAgICAgICdzMzp4LWFtei1zZXJ2ZXItc2lkZS1lbmNyeXB0aW9uJzogWydhd3M6a21zJywgJ0FFUzI1NiddLFxuICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAge1xuICAgICAgICAgICAgICBTaWQ6ICdEZW55VW5lbmNyeXB0ZWRTM1VwbG9hZHMnLFxuICAgICAgICAgICAgICBFZmZlY3Q6ICdEZW55JyxcbiAgICAgICAgICAgICAgQWN0aW9uOiBbJ3MzOlB1dE9iamVjdCddLFxuICAgICAgICAgICAgICBSZXNvdXJjZTogJ2Fybjphd3M6czM6OjoqLyonLFxuICAgICAgICAgICAgICBDb25kaXRpb246IHtcbiAgICAgICAgICAgICAgICBOdWxsOiB7XG4gICAgICAgICAgICAgICAgICAnczM6eC1hbXotc2VydmVyLXNpZGUtZW5jcnlwdGlvbic6ICd0cnVlJyxcbiAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgU2lkOiAnRGVueUluc2VjdXJlUzNDb25uZWN0aW9ucycsXG4gICAgICAgICAgICAgIEVmZmVjdDogJ0RlbnknLFxuICAgICAgICAgICAgICBBY3Rpb246ICdzMzoqJyxcbiAgICAgICAgICAgICAgUmVzb3VyY2U6IFsnYXJuOmF3czpzMzo6OionLCAnYXJuOmF3czpzMzo6OiovKiddLFxuICAgICAgICAgICAgICBDb25kaXRpb246IHtcbiAgICAgICAgICAgICAgICBCb29sOiB7XG4gICAgICAgICAgICAgICAgICAnYXdzOlNlY3VyZVRyYW5zcG9ydCc6ICdmYWxzZScsXG4gICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgIFNpZDogJ0RlbnlQdWJsaWNTM0FjY2VzcycsXG4gICAgICAgICAgICAgIEVmZmVjdDogJ0RlbnknLFxuICAgICAgICAgICAgICBBY3Rpb246IFtcbiAgICAgICAgICAgICAgICAnczM6UHV0QnVja2V0QWNsJyxcbiAgICAgICAgICAgICAgICAnczM6UHV0T2JqZWN0QWNsJyxcbiAgICAgICAgICAgICAgICAnczM6UHV0QnVja2V0UG9saWN5JyxcbiAgICAgICAgICAgICAgXSxcbiAgICAgICAgICAgICAgUmVzb3VyY2U6IFsnYXJuOmF3czpzMzo6OionLCAnYXJuOmF3czpzMzo6OiovKiddLFxuICAgICAgICAgICAgICBDb25kaXRpb246IHtcbiAgICAgICAgICAgICAgICBTdHJpbmdFcXVhbHM6IHtcbiAgICAgICAgICAgICAgICAgICdzMzp4LWFtei1hY2wnOiBbXG4gICAgICAgICAgICAgICAgICAgICdwdWJsaWMtcmVhZCcsXG4gICAgICAgICAgICAgICAgICAgICdwdWJsaWMtcmVhZC13cml0ZScsXG4gICAgICAgICAgICAgICAgICAgICdhdXRoZW50aWNhdGVkLXJlYWQnLFxuICAgICAgICAgICAgICAgICAgXSxcbiAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgfSxcbiAgICAgICAgICBdLFxuICAgICAgICB9KSxcbiAgICAgICAgdGFncyxcbiAgICAgIH0sXG4gICAgICB7IHBhcmVudDogdGhpcyB9XG4gICAgKTtcblxuICAgIC8vIENsb3VkVHJhaWwgcHJvdGVjdGlvbiBwb2xpY3lcbiAgICB0aGlzLmNsb3VkVHJhaWxQcm90ZWN0aW9uUG9saWN5ID0gbmV3IGF3cy5pYW0uUG9saWN5KFxuICAgICAgYCR7bmFtZX0tY2xvdWR0cmFpbC1wcm90ZWN0aW9uYCxcbiAgICAgIHtcbiAgICAgICAgbmFtZTogYENsb3VkVHJhaWxQcm90ZWN0aW9uUG9saWN5LSR7ZW52aXJvbm1lbnRTdWZmaXh9YCxcbiAgICAgICAgZGVzY3JpcHRpb246ICdQcm90ZWN0cyBDbG91ZFRyYWlsIGZyb20gdW5hdXRob3JpemVkIG1vZGlmaWNhdGlvbnMnLFxuICAgICAgICBwb2xpY3k6IEpTT04uc3RyaW5naWZ5KHtcbiAgICAgICAgICBWZXJzaW9uOiAnMjAxMi0xMC0xNycsXG4gICAgICAgICAgU3RhdGVtZW50OiBbXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgIFNpZDogJ0RlbnlDbG91ZFRyYWlsRGlzYWJsaW5nJyxcbiAgICAgICAgICAgICAgRWZmZWN0OiAnRGVueScsXG4gICAgICAgICAgICAgIEFjdGlvbjogW1xuICAgICAgICAgICAgICAgICdjbG91ZHRyYWlsOlN0b3BMb2dnaW5nJyxcbiAgICAgICAgICAgICAgICAnY2xvdWR0cmFpbDpEZWxldGVUcmFpbCcsXG4gICAgICAgICAgICAgICAgJ2Nsb3VkdHJhaWw6UHV0RXZlbnRTZWxlY3RvcnMnLFxuICAgICAgICAgICAgICBdLFxuICAgICAgICAgICAgICBSZXNvdXJjZTogJyonLFxuICAgICAgICAgICAgICBDb25kaXRpb246IHtcbiAgICAgICAgICAgICAgICBTdHJpbmdOb3RFcXVhbHM6IHtcbiAgICAgICAgICAgICAgICAgICdhd3M6dXNlcmlkJzogW1xuICAgICAgICAgICAgICAgICAgICAvLyBBZGQgc3BlY2lmaWMgYWRtaW4gdXNlciBJRHMgaGVyZVxuICAgICAgICAgICAgICAgICAgICAnQUlEQUNLQ0VWU1E2QzJFWEFNUExFJyxcbiAgICAgICAgICAgICAgICAgIF0sXG4gICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgIFNpZDogJ0RlbnlDbG91ZFRyYWlsUzNCdWNrZXRNb2RpZmljYXRpb24nLFxuICAgICAgICAgICAgICBFZmZlY3Q6ICdEZW55JyxcbiAgICAgICAgICAgICAgQWN0aW9uOiBbXG4gICAgICAgICAgICAgICAgJ3MzOkRlbGV0ZU9iamVjdCcsXG4gICAgICAgICAgICAgICAgJ3MzOkRlbGV0ZU9iamVjdFZlcnNpb24nLFxuICAgICAgICAgICAgICAgICdzMzpQdXRCdWNrZXRQb2xpY3knLFxuICAgICAgICAgICAgICAgICdzMzpEZWxldGVCdWNrZXRQb2xpY3knLFxuICAgICAgICAgICAgICBdLFxuICAgICAgICAgICAgICBSZXNvdXJjZTogW1xuICAgICAgICAgICAgICAgICdhcm46YXdzOnMzOjo6KmNsb3VkdHJhaWwqJyxcbiAgICAgICAgICAgICAgICAnYXJuOmF3czpzMzo6OipjbG91ZHRyYWlsKi8qJyxcbiAgICAgICAgICAgICAgICAnYXJuOmF3czpzMzo6OiphdWRpdConLFxuICAgICAgICAgICAgICAgICdhcm46YXdzOnMzOjo6KmF1ZGl0Ki8qJyxcbiAgICAgICAgICAgICAgXSxcbiAgICAgICAgICAgICAgQ29uZGl0aW9uOiB7XG4gICAgICAgICAgICAgICAgU3RyaW5nTm90RXF1YWxzOiB7XG4gICAgICAgICAgICAgICAgICAnYXdzOnVzZXJpZCc6IFtcbiAgICAgICAgICAgICAgICAgICAgLy8gQWRkIHNwZWNpZmljIGFkbWluIHVzZXIgSURzIGhlcmVcbiAgICAgICAgICAgICAgICAgICAgJ0FJREFDS0NFVlNRNkMyRVhBTVBMRScsXG4gICAgICAgICAgICAgICAgICBdLFxuICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICB9LFxuICAgICAgICAgIF0sXG4gICAgICAgIH0pLFxuICAgICAgICB0YWdzLFxuICAgICAgfSxcbiAgICAgIHsgcGFyZW50OiB0aGlzIH1cbiAgICApO1xuXG4gICAgLy8gS01TIGtleSBwcm90ZWN0aW9uIHBvbGljeVxuICAgIHRoaXMua21zS2V5UHJvdGVjdGlvblBvbGljeSA9IG5ldyBhd3MuaWFtLlBvbGljeShcbiAgICAgIGAke25hbWV9LWttcy1wcm90ZWN0aW9uYCxcbiAgICAgIHtcbiAgICAgICAgbmFtZTogYEtNU0tleVByb3RlY3Rpb25Qb2xpY3ktJHtlbnZpcm9ubWVudFN1ZmZpeH1gLFxuICAgICAgICBkZXNjcmlwdGlvbjogJ1Byb3RlY3RzIEtNUyBrZXlzIGZyb20gdW5hdXRob3JpemVkIGFjY2VzcyBhbmQgZGVsZXRpb24nLFxuICAgICAgICBwb2xpY3k6IEpTT04uc3RyaW5naWZ5KHtcbiAgICAgICAgICBWZXJzaW9uOiAnMjAxMi0xMC0xNycsXG4gICAgICAgICAgU3RhdGVtZW50OiBbXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgIFNpZDogJ0RlbnlLTVNLZXlEZWxldGlvbicsXG4gICAgICAgICAgICAgIEVmZmVjdDogJ0RlbnknLFxuICAgICAgICAgICAgICBBY3Rpb246IFsna21zOlNjaGVkdWxlS2V5RGVsZXRpb24nLCAna21zOkRpc2FibGVLZXknXSxcbiAgICAgICAgICAgICAgUmVzb3VyY2U6ICcqJyxcbiAgICAgICAgICAgICAgQ29uZGl0aW9uOiB7XG4gICAgICAgICAgICAgICAgU3RyaW5nTm90RXF1YWxzOiB7XG4gICAgICAgICAgICAgICAgICAnYXdzOnVzZXJpZCc6IFtcbiAgICAgICAgICAgICAgICAgICAgLy8gQWRkIHNwZWNpZmljIGFkbWluIHVzZXIgSURzIGhlcmVcbiAgICAgICAgICAgICAgICAgICAgJ0FJREFDS0NFVlNRNkMyRVhBTVBMRScsXG4gICAgICAgICAgICAgICAgICBdLFxuICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAge1xuICAgICAgICAgICAgICBTaWQ6ICdEZW55S01TS2V5UG9saWN5Q2hhbmdlcycsXG4gICAgICAgICAgICAgIEVmZmVjdDogJ0RlbnknLFxuICAgICAgICAgICAgICBBY3Rpb246IFsna21zOlB1dEtleVBvbGljeSddLFxuICAgICAgICAgICAgICBSZXNvdXJjZTogJyonLFxuICAgICAgICAgICAgICBDb25kaXRpb246IHtcbiAgICAgICAgICAgICAgICBTdHJpbmdOb3RFcXVhbHM6IHtcbiAgICAgICAgICAgICAgICAgICdhd3M6dXNlcmlkJzogW1xuICAgICAgICAgICAgICAgICAgICAvLyBBZGQgc3BlY2lmaWMgYWRtaW4gdXNlciBJRHMgaGVyZVxuICAgICAgICAgICAgICAgICAgICAnQUlEQUNLQ0VWU1E2QzJFWEFNUExFJyxcbiAgICAgICAgICAgICAgICAgIF0sXG4gICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgXSxcbiAgICAgICAgfSksXG4gICAgICAgIHRhZ3MsXG4gICAgICB9LFxuICAgICAgeyBwYXJlbnQ6IHRoaXMgfVxuICAgICk7XG5cbiAgICB0aGlzLnJlZ2lzdGVyT3V0cHV0cyh7XG4gICAgICBtZmFFbmZvcmNlbWVudFBvbGljeUFybjogdGhpcy5tZmFFbmZvcmNlbWVudFBvbGljeS5hcm4sXG4gICAgICBzM0RlbnlJbnNlY3VyZVBvbGljeUFybjogdGhpcy5zM0RlbnlJbnNlY3VyZVBvbGljeS5hcm4sXG4gICAgICBjbG91ZFRyYWlsUHJvdGVjdGlvblBvbGljeUFybjogdGhpcy5jbG91ZFRyYWlsUHJvdGVjdGlvblBvbGljeS5hcm4sXG4gICAgICBrbXNLZXlQcm90ZWN0aW9uUG9saWN5QXJuOiB0aGlzLmttc0tleVByb3RlY3Rpb25Qb2xpY3kuYXJuLFxuICAgIH0pO1xuICB9XG59XG5cbi8vIEVuaGFuY2VkIGxlYXN0IHByaXZpbGVnZSBTMyBwb2xpY3kgd2l0aCB0aW1lLWJhc2VkIGFjY2Vzc1xuZXhwb3J0IGZ1bmN0aW9uIGNyZWF0ZVRpbWVCYXNlZFMzQWNjZXNzUG9saWN5KFxuICBidWNrZXRBcm46IHB1bHVtaS5JbnB1dDxzdHJpbmc+LFxuICBhbGxvd2VkSG91cnM6IHN0cmluZ1tdID0gW1xuICAgICcwOScsXG4gICAgJzEwJyxcbiAgICAnMTEnLFxuICAgICcxMicsXG4gICAgJzEzJyxcbiAgICAnMTQnLFxuICAgICcxNScsXG4gICAgJzE2JyxcbiAgICAnMTcnLFxuICBdXG4pOiBwdWx1bWkuT3V0cHV0PHN0cmluZz4ge1xuICByZXR1cm4gcHVsdW1pLmludGVycG9sYXRlYHtcbiAgICBcIlZlcnNpb25cIjogXCIyMDEyLTEwLTE3XCIsXG4gICAgXCJTdGF0ZW1lbnRcIjogW1xuICAgICAge1xuICAgICAgICBcIkVmZmVjdFwiOiBcIkFsbG93XCIsXG4gICAgICAgIFwiQWN0aW9uXCI6IFtcbiAgICAgICAgICBcInMzOkdldE9iamVjdFwiXG4gICAgICAgIF0sXG4gICAgICAgIFwiUmVzb3VyY2VcIjogXCIke2J1Y2tldEFybn0vKlwiLFxuICAgICAgICBcIkNvbmRpdGlvblwiOiB7XG4gICAgICAgICAgXCJEYXRlR3JlYXRlclRoYW5cIjoge1xuICAgICAgICAgICAgXCJhd3M6VG9rZW5Jc3N1ZVRpbWVcIjogXCIyMDI0LTAxLTAxVDAwOjAwOjAwWlwiXG4gICAgICAgICAgfSxcbiAgICAgICAgICBcIlN0cmluZ0xpa2VcIjoge1xuICAgICAgICAgICAgXCJhd3M6UmVxdWVzdGVkUmVnaW9uXCI6IFwidXMtZWFzdC0xXCJcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH0sXG4gICAgICB7XG4gICAgICAgIFwiRWZmZWN0XCI6IFwiQWxsb3dcIixcbiAgICAgICAgXCJBY3Rpb25cIjogW1xuICAgICAgICAgIFwiczM6UHV0T2JqZWN0XCJcbiAgICAgICAgXSxcbiAgICAgICAgXCJSZXNvdXJjZVwiOiBcIiR7YnVja2V0QXJufS8qXCIsXG4gICAgICAgIFwiQ29uZGl0aW9uXCI6IHtcbiAgICAgICAgICBcIlN0cmluZ0VxdWFsc1wiOiB7XG4gICAgICAgICAgICBcInMzOngtYW16LXNlcnZlci1zaWRlLWVuY3J5cHRpb25cIjogXCJhd3M6a21zXCJcbiAgICAgICAgICB9LFxuICAgICAgICAgIFwiU3RyaW5nTGlrZVwiOiB7XG4gICAgICAgICAgICBcImF3czpSZXF1ZXN0ZWRSZWdpb25cIjogXCJ1cy1lYXN0LTFcIlxuICAgICAgICAgIH0sXG4gICAgICAgICAgXCJGb3JBbGxWYWx1ZXM6U3RyaW5nRXF1YWxzXCI6IHtcbiAgICAgICAgICAgIFwiYXdzOlJlcXVlc3RlZEhvdXJcIjogJHtKU09OLnN0cmluZ2lmeShhbGxvd2VkSG91cnMpfVxuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfSxcbiAgICAgIHtcbiAgICAgICAgXCJFZmZlY3RcIjogXCJBbGxvd1wiLFxuICAgICAgICBcIkFjdGlvblwiOiBbXG4gICAgICAgICAgXCJzMzpMaXN0QnVja2V0XCJcbiAgICAgICAgXSxcbiAgICAgICAgXCJSZXNvdXJjZVwiOiBcIiR7YnVja2V0QXJufVwiLFxuICAgICAgICBcIkNvbmRpdGlvblwiOiB7XG4gICAgICAgICAgXCJTdHJpbmdMaWtlXCI6IHtcbiAgICAgICAgICAgIFwiYXdzOlJlcXVlc3RlZFJlZ2lvblwiOiBcInVzLWVhc3QtMVwiXG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9LFxuICAgICAge1xuICAgICAgICBcIkVmZmVjdFwiOiBcIkRlbnlcIixcbiAgICAgICAgXCJBY3Rpb25cIjogW1xuICAgICAgICAgIFwiczM6RGVsZXRlT2JqZWN0XCIsXG4gICAgICAgICAgXCJzMzpEZWxldGVPYmplY3RWZXJzaW9uXCJcbiAgICAgICAgXSxcbiAgICAgICAgXCJSZXNvdXJjZVwiOiBcIiR7YnVja2V0QXJufS8qXCJcbiAgICAgIH1cbiAgICBdXG4gIH1gO1xufVxuXG4vLyBSZWFkLW9ubHkgYXVkaXQgYWNjZXNzIHBvbGljeSB3aXRoIElQIHJlc3RyaWN0aW9uc1xuZXhwb3J0IGZ1bmN0aW9uIGNyZWF0ZVJlc3RyaWN0ZWRBdWRpdFBvbGljeShcbiAgYXVkaXRCdWNrZXRBcm46IHB1bHVtaS5JbnB1dDxzdHJpbmc+LFxuICBhbGxvd2VkSXBSYW5nZXM6IHN0cmluZ1tdID0gWycyMDMuMC4xMTMuMC8yNCddXG4pOiBwdWx1bWkuT3V0cHV0PHN0cmluZz4ge1xuICByZXR1cm4gcHVsdW1pLmludGVycG9sYXRlYHtcbiAgICBcIlZlcnNpb25cIjogXCIyMDEyLTEwLTE3XCIsXG4gICAgXCJTdGF0ZW1lbnRcIjogW1xuICAgICAge1xuICAgICAgICBcIkVmZmVjdFwiOiBcIkFsbG93XCIsXG4gICAgICAgIFwiQWN0aW9uXCI6IFtcbiAgICAgICAgICBcInMzOkdldE9iamVjdFwiLFxuICAgICAgICAgIFwiczM6TGlzdEJ1Y2tldFwiXG4gICAgICAgIF0sXG4gICAgICAgIFwiUmVzb3VyY2VcIjogW1xuICAgICAgICAgIFwiJHthdWRpdEJ1Y2tldEFybn1cIixcbiAgICAgICAgICBcIiR7YXVkaXRCdWNrZXRBcm59LypcIlxuICAgICAgICBdLFxuICAgICAgICBcIkNvbmRpdGlvblwiOiB7XG4gICAgICAgICAgXCJJcEFkZHJlc3NcIjoge1xuICAgICAgICAgICAgXCJhd3M6U291cmNlSXBcIjogJHtKU09OLnN0cmluZ2lmeShhbGxvd2VkSXBSYW5nZXMpfVxuICAgICAgICAgIH0sXG4gICAgICAgICAgXCJTdHJpbmdMaWtlXCI6IHtcbiAgICAgICAgICAgIFwiYXdzOlJlcXVlc3RlZFJlZ2lvblwiOiBcInVzLWVhc3QtMVwiXG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9LFxuICAgICAge1xuICAgICAgICBcIkVmZmVjdFwiOiBcIkFsbG93XCIsXG4gICAgICAgIFwiQWN0aW9uXCI6IFtcbiAgICAgICAgICBcImNsb3VkdHJhaWw6TG9va3VwRXZlbnRzXCJcbiAgICAgICAgXSxcbiAgICAgICAgXCJSZXNvdXJjZVwiOiBcIipcIixcbiAgICAgICAgXCJDb25kaXRpb25cIjoge1xuICAgICAgICAgIFwiSXBBZGRyZXNzXCI6IHtcbiAgICAgICAgICAgIFwiYXdzOlNvdXJjZUlwXCI6ICR7SlNPTi5zdHJpbmdpZnkoYWxsb3dlZElwUmFuZ2VzKX1cbiAgICAgICAgICB9LFxuICAgICAgICAgIFwiU3RyaW5nTGlrZVwiOiB7XG4gICAgICAgICAgICBcImF3czpSZXF1ZXN0ZWRSZWdpb25cIjogXCJ1cy1lYXN0LTFcIlxuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfSxcbiAgICAgIHtcbiAgICAgICAgXCJFZmZlY3RcIjogXCJEZW55XCIsXG4gICAgICAgIFwiTm90QWN0aW9uXCI6IFtcbiAgICAgICAgICBcInMzOkdldE9iamVjdFwiLFxuICAgICAgICAgIFwiczM6TGlzdEJ1Y2tldFwiLFxuICAgICAgICAgIFwiY2xvdWR0cmFpbDpMb29rdXBFdmVudHNcIixcbiAgICAgICAgICBcImNsb3VkdHJhaWw6R2V0VHJhaWxTdGF0dXNcIlxuICAgICAgICBdLFxuICAgICAgICBcIlJlc291cmNlXCI6IFwiKlwiXG4gICAgICB9XG4gICAgXVxuICB9YDtcbn1cbiJdfQ==