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
    ec2LifecyclePolicy;
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
                            // EC2 sensitive actions - conditional restrictions
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
        // Conditional EC2 instance lifecycle policy
        this.ec2LifecyclePolicy = new aws.iam.Policy(`${name}-ec2-lifecycle`, {
            name: `EC2LifecyclePolicy-${environmentSuffix}`,
            description: 'Conditional restrictions for EC2 instance lifecycle operations',
            policy: JSON.stringify({
                Version: '2012-10-17',
                Statement: [
                    {
                        Sid: 'RequireMFAForProductionInstanceTermination',
                        Effect: 'Deny',
                        Action: ['ec2:TerminateInstances'],
                        Resource: '*',
                        Condition: {
                            StringLike: {
                                'ec2:ResourceTag/Environment': 'prod*'
                            },
                            Bool: {
                                'aws:MultiFactorAuthPresent': 'false'
                            }
                        }
                    },
                    {
                        Sid: 'RequireBusinessHoursForCriticalOperations',
                        Effect: 'Deny',
                        Action: ['ec2:TerminateInstances'],
                        Resource: '*',
                        Condition: {
                            StringEquals: {
                                'ec2:ResourceTag/CriticalSystem': 'true'
                            },
                            DateNotBetween: {
                                'aws:CurrentTime': ['08:00Z', '18:00Z']
                            }
                        }
                    },
                    {
                        Sid: 'AllowStopInstancesWithConditions',
                        Effect: 'Allow',
                        Action: ['ec2:StopInstances'],
                        Resource: '*',
                        Condition: {
                            StringNotLike: {
                                'ec2:ResourceTag/Environment': 'prod*'
                            },
                            StringEquals: {
                                'aws:RequestedRegion': 'us-east-1'
                            }
                        }
                    }
                ]
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
            ec2LifecyclePolicyArn: this.ec2LifecyclePolicy.arn,
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJpbmRleC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFnV0Esc0VBd0VDO0FBR0Qsa0VBcURDO0FBaGVELGlEQUFtQztBQUNuQyx1REFBeUM7QUFDekMsNENBQStDO0FBTy9DLE1BQWEsZ0JBQWlCLFNBQVEsTUFBTSxDQUFDLGlCQUFpQjtJQUM1QyxvQkFBb0IsQ0FBaUI7SUFDckMsa0JBQWtCLENBQWlCO0lBQ25DLG9CQUFvQixDQUFpQjtJQUNyQywwQkFBMEIsQ0FBaUI7SUFDM0Msc0JBQXNCLENBQWlCO0lBRXZELFlBQ0UsSUFBWSxFQUNaLElBQTJCLEVBQzNCLElBQXNDO1FBRXRDLEtBQUssQ0FBQyxrQ0FBa0MsRUFBRSxJQUFJLEVBQUUsSUFBSSxFQUFFLElBQUksQ0FBQyxDQUFDO1FBRTVELE1BQU0saUJBQWlCLEdBQUcsSUFBSSxFQUFFLGlCQUFpQixJQUFJLEtBQUssQ0FBQztRQUMzRCxNQUFNLElBQUksR0FBRyxFQUFFLEdBQUcsaUJBQVUsRUFBRSxHQUFHLElBQUksRUFBRSxJQUFJLEVBQUUsQ0FBQztRQUU5Qyw0REFBNEQ7UUFDNUQsSUFBSSxDQUFDLG9CQUFvQixHQUFHLElBQUksR0FBRyxDQUFDLEdBQUcsQ0FBQyxNQUFNLENBQzVDLEdBQUcsSUFBSSxrQkFBa0IsRUFDekI7WUFDRSxJQUFJLEVBQUUsd0JBQXdCLGlCQUFpQixFQUFFO1lBQ2pELFdBQVcsRUFBRSwrQ0FBK0M7WUFDNUQsTUFBTSxFQUFFLElBQUksQ0FBQyxTQUFTLENBQUM7Z0JBQ3JCLE9BQU8sRUFBRSxZQUFZO2dCQUNyQixTQUFTLEVBQUU7b0JBQ1Q7d0JBQ0UsR0FBRyxFQUFFLG1DQUFtQzt3QkFDeEMsTUFBTSxFQUFFLE1BQU07d0JBQ2QsTUFBTSxFQUFFOzRCQUNOLHdCQUF3Qjs0QkFDeEIsZ0JBQWdCOzRCQUNoQixnQkFBZ0I7NEJB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QTs7Ozs7Ozs7OzthQVVkLGNBQWM7YUFDZCxjQUFjOzs7OzhCQUlHLElBQUksQ0FBQyxTQUFTLENBQUMsZUFBZSxDQUFDOzs7Ozs7Ozs7Ozs7Ozs7OEJBZS9CLElBQUksQ0FBQyxTQUFTLENBQUMsZUFBZSxDQUFDOzs7Ozs7Ozs7Ozs7Ozs7Ozs7SUFrQnpELENBQUM7QUFDTCxDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0ICogYXMgYXdzIGZyb20gJ0BwdWx1bWkvYXdzJztcbmltcG9ydCAqIGFzIHB1bHVtaSBmcm9tICdAcHVsdW1pL3B1bHVtaSc7XG5pbXBvcnQgeyBjb21tb25UYWdzIH0gZnJvbSAnLi4vLi4vY29uZmlnL3RhZ3MnO1xuXG5leHBvcnQgaW50ZXJmYWNlIFNlY3VyaXR5UG9saWNpZXNBcmdzIHtcbiAgZW52aXJvbm1lbnRTdWZmaXg/OiBzdHJpbmc7XG4gIHRhZ3M/OiBSZWNvcmQ8c3RyaW5nLCBzdHJpbmc+O1xufVxuXG5leHBvcnQgY2xhc3MgU2VjdXJpdHlQb2xpY2llcyBleHRlbmRzIHB1bHVtaS5Db21wb25lbnRSZXNvdXJjZSB7XG4gIHB1YmxpYyByZWFkb25seSBtZmFFbmZvcmNlbWVudFBvbGljeTogYXdzLmlhbS5Qb2xpY3k7XG4gIHB1YmxpYyByZWFkb25seSBlYzJMaWZlY3ljbGVQb2xpY3k6IGF3cy5pYW0uUG9saWN5O1xuICBwdWJsaWMgcmVhZG9ubHkgczNEZW55SW5zZWN1cmVQb2xpY3k6IGF3cy5pYW0uUG9saWN5O1xuICBwdWJsaWMgcmVhZG9ubHkgY2xvdWRUcmFpbFByb3RlY3Rpb25Qb2xpY3k6IGF3cy5pYW0uUG9saWN5O1xuICBwdWJsaWMgcmVhZG9ubHkga21zS2V5UHJvdGVjdGlvblBvbGljeTogYXdzLmlhbS5Qb2xpY3k7XG5cbiAgY29uc3RydWN0b3IoXG4gICAgbmFtZTogc3RyaW5nLFxuICAgIGFyZ3M/OiBTZWN1cml0eVBvbGljaWVzQXJncyxcbiAgICBvcHRzPzogcHVsdW1pLkNvbXBvbmVudFJlc291cmNlT3B0aW9uc1xuICApIHtcbiAgICBzdXBlcignY3VzdG9tOnNlY3VyaXR5OlNlY3VyaXR5UG9saWNpZXMnLCBuYW1lLCBhcmdzLCBvcHRzKTtcblxuICAgIGNvbnN0IGVudmlyb25tZW50U3VmZml4ID0gYXJncz8uZW52aXJvbm1lbnRTdWZmaXggfHwgJ2Rldic7XG4gICAgY29uc3QgdGFncyA9IHsgLi4uY29tbW9uVGFncywgLi4uYXJncz8udGFncyB9O1xuXG4gICAgLy8gRW5oYW5jZWQgTUZBIGVuZm9yY2VtZW50IHBvbGljeSBmb3IgQUxMIHNlbnNpdGl2ZSBhY3Rpb25zXG4gICAgdGhpcy5tZmFFbmZvcmNlbWVudFBvbGljeSA9IG5ldyBhd3MuaWFtLlBvbGljeShcbiAgICAgIGAke25hbWV9LW1mYS1lbmZvcmNlbWVudGAsXG4gICAgICB7XG4gICAgICAgIG5hbWU6IGBNRkFFbmZvcmNlbWVudFBvbGljeS0ke2Vudmlyb25tZW50U3VmZml4fWAsXG4gICAgICAgIGRlc2NyaXB0aW9uOiAnRW5mb3JjZXMgTUZBIGZvciBhbGwgc2Vuc2l0aXZlIEFXUyBvcGVyYXRpb25zJyxcbiAgICAgICAgcG9saWN5OiBKU09OLnN0cmluZ2lmeSh7XG4gICAgICAgICAgVmVyc2lvbjogJzIwMTItMTAtMTcnLFxuICAgICAgICAgIFN0YXRlbWVudDogW1xuICAgICAgICAgICAge1xuICAgICAgICAgICAgICBTaWQ6ICdEZW55QWxsU2Vuc2l0aXZlQWN0aW9uc1dpdGhvdXRNRkEnLFxuICAgICAgICAgICAgICBFZmZlY3Q6ICdEZW55JyxcbiAgICAgICAgICAgICAgQWN0aW9uOiBbXG4gICAgICAgICAgICAgICAgLy8gSUFNIHNlbnNpdGl2ZSBhY3Rpb25zXG4gICAgICAgICAgICAgICAgJ2lhbTpDcmVhdGVSb2xlJyxcbiAgICAgICAgICAgICAgICAnaWFtOkRlbGV0ZVJvbGUnLFxuICAgICAgICAgICAgICAgICdpYW06QXR0YWNoUm9sZVBvbGljeScsXG4gICAgICAgICAgICAgICAgJ2lhbTpEZXRhY2hSb2xlUG9saWN5JyxcbiAgICAgICAgICAgICAgICAnaWFtOlB1dFJvbGVQb2xpY3knLFxuICAgICAgICAgICAgICAgICdpYW06RGVsZXRlUm9sZVBvbGljeScsXG4gICAgICAgICAgICAgICAgJ2lhbTpDcmVhdGVVc2VyJyxcbiAgICAgICAgICAgICAgICAnaWFtOkRlbGV0ZVVzZXInLFxuICAgICAgICAgICAgICAgICdpYW06Q3JlYXRlQWNjZXNzS2V5JyxcbiAgICAgICAgICAgICAgICAnaWFtOkRlbGV0ZUFjY2Vzc0tleScsXG4gICAgICAgICAgICAgICAgJ2lhbTpVcGRhdGVBY2Nlc3NLZXknLFxuICAgICAgICAgICAgICAgICdpYW06Q3JlYXRlUG9saWN5JyxcbiAgICAgICAgICAgICAgICAnaWFtOkRlbGV0ZVBvbGljeScsXG4gICAgICAgICAgICAgICAgJ2lhbTpDcmVhdGVQb2xpY3lWZXJzaW9uJyxcbiAgICAgICAgICAgICAgICAnaWFtOkRlbGV0ZVBvbGljeVZlcnNpb24nLFxuICAgICAgICAgICAgICAgIC8vIFMzIHNlbnNpdGl2ZSBhY3Rpb25zXG4gICAgICAgICAgICAgICAgJ3MzOkRlbGV0ZUJ1Y2tldCcsXG4gICAgICAgICAgICAgICAgJ3MzOlB1dEJ1Y2tldFBvbGljeScsXG4gICAgICAgICAgICAgICAgJ3MzOkRlbGV0ZUJ1Y2tldFBvbGljeScsXG4gICAgICAgICAgICAgICAgJ3MzOlB1dEJ1Y2tldEFjbCcsXG4gICAgICAgICAgICAgICAgJ3MzOlB1dEJ1Y2tldFB1YmxpY0FjY2Vzc0Jsb2NrJyxcbiAgICAgICAgICAgICAgICAnczM6RGVsZXRlQnVja2V0UHVibGljQWNjZXNzQmxvY2snLFxuICAgICAgICAgICAgICAgICdzMzpQdXRCdWNrZXRWZXJzaW9uaW5nJyxcbiAgICAgICAgICAgICAgICAnczM6UHV0QnVja2V0RW5jcnlwdGlvbicsXG4gICAgICAgICAgICAgICAgJ3MzOkRlbGV0ZUJ1Y2tldEVuY3J5cHRpb24nLFxuICAgICAgICAgICAgICAgIC8vIEtNUyBzZW5zaXRpdmUgYWN0aW9uc1xuICAgICAgICAgICAgICAgICdrbXM6U2NoZWR1bGVLZXlEZWxldGlvbicsXG4gICAgICAgICAgICAgICAgJ2ttczpEaXNhYmxlS2V5JyxcbiAgICAgICAgICAgICAgICAna21zOkNhbmNlbEtleURlbGV0aW9uJyxcbiAgICAgICAgICAgICAgICAna21zOlB1dEtleVBvbGljeScsXG4gICAgICAgICAgICAgICAgJ2ttczpDcmVhdGVLZXknLFxuICAgICAgICAgICAgICAgICdrbXM6Q3JlYXRlQWxpYXMnLFxuICAgICAgICAgICAgICAgICdrbXM6RGVsZXRlQWxpYXMnLFxuICAgICAgICAgICAgICAgIC8vIENsb3VkVHJhaWwgc2Vuc2l0aXZlIGFjdGlvbnNcbiAgICAgICAgICAgICAgICAnY2xvdWR0cmFpbDpEZWxldGVUcmFpbCcsXG4gICAgICAgICAgICAgICAgJ2Nsb3VkdHJhaWw6U3RvcExvZ2dpbmcnLFxuICAgICAgICAgICAgICAgICdjbG91ZHRyYWlsOlB1dEV2ZW50U2VsZWN0b3JzJyxcbiAgICAgICAgICAgICAgICAnY2xvdWR0cmFpbDpVcGRhdGVUcmFpbCcsXG4gICAgICAgICAgICAgICAgLy8gRUMyIHNlbnNpdGl2ZSBhY3Rpb25zIC0gY29uZGl0aW9uYWwgcmVzdHJpY3Rpb25zXG4gICAgICAgICAgICAgICAgJ2VjMjpNb2RpZnlJbnN0YW5jZUF0dHJpYnV0ZScsXG4gICAgICAgICAgICAgICAgJ2VjMjpDcmVhdGVTZWN1cml0eUdyb3VwJyxcbiAgICAgICAgICAgICAgICAnZWMyOkRlbGV0ZVNlY3VyaXR5R3JvdXAnLFxuICAgICAgICAgICAgICAgICdlYzI6QXV0aG9yaXplU2VjdXJpdHlHcm91cEluZ3Jlc3MnLFxuICAgICAgICAgICAgICAgICdlYzI6QXV0aG9yaXplU2VjdXJpdHlHcm91cEVncmVzcycsXG4gICAgICAgICAgICAgICAgJ2VjMjpSZXZva2VTZWN1cml0eUdyb3VwSW5ncmVzcycsXG4gICAgICAgICAgICAgICAgJ2VjMjpSZXZva2VTZWN1cml0eUdyb3VwRWdyZXNzJyxcbiAgICAgICAgICAgICAgXSxcbiAgICAgICAgICAgICAgUmVzb3VyY2U6ICcqJyxcbiAgICAgICAgICAgICAgQ29uZGl0aW9uOiB7XG4gICAgICAgICAgICAgICAgQm9vbElmRXhpc3RzOiB7XG4gICAgICAgICAgICAgICAgICAnYXdzOk11bHRpRmFjdG9yQXV0aFByZXNlbnQnOiAnZmFsc2UnLFxuICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAge1xuICAgICAgICAgICAgICBTaWQ6ICdEZW55Um9vdEFjY291bnRVc2FnZScsXG4gICAgICAgICAgICAgIEVmZmVjdDogJ0RlbnknLFxuICAgICAgICAgICAgICBBY3Rpb246ICcqJyxcbiAgICAgICAgICAgICAgUmVzb3VyY2U6ICcqJyxcbiAgICAgICAgICAgICAgQ29uZGl0aW9uOiB7XG4gICAgICAgICAgICAgICAgU3RyaW5nRXF1YWxzOiB7XG4gICAgICAgICAgICAgICAgICAnYXdzOnVzZXJpZCc6ICdyb290JyxcbiAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgfSxcbiAgICAgICAgICBdLFxuICAgICAgICB9KSxcbiAgICAgICAgdGFncyxcbiAgICAgIH0sXG4gICAgICB7IHBhcmVudDogdGhpcyB9XG4gICAgKTtcblxuICAgIC8vIENvbmRpdGlvbmFsIEVDMiBpbnN0YW5jZSBsaWZlY3ljbGUgcG9saWN5XG4gICAgdGhpcy5lYzJMaWZlY3ljbGVQb2xpY3kgPSBuZXcgYXdzLmlhbS5Qb2xpY3koXG4gICAgICBgJHtuYW1lfS1lYzItbGlmZWN5Y2xlYCxcbiAgICAgIHtcbiAgICAgICAgbmFtZTogYEVDMkxpZmVjeWNsZVBvbGljeS0ke2Vudmlyb25tZW50U3VmZml4fWAsXG4gICAgICAgIGRlc2NyaXB0aW9uOlxuICAgICAgICAgICdDb25kaXRpb25hbCByZXN0cmljdGlvbnMgZm9yIEVDMiBpbnN0YW5jZSBsaWZlY3ljbGUgb3BlcmF0aW9ucycsXG4gICAgICAgIHBvbGljeTogSlNPTi5zdHJpbmdpZnkoe1xuICAgICAgICAgIFZlcnNpb246ICcyMDEyLTEwLTE3JyxcbiAgICAgICAgICBTdGF0ZW1lbnQ6IFtcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgU2lkOiAnUmVxdWlyZU1GQUZvclByb2R1Y3Rpb25JbnN0YW5jZVRlcm1pbmF0aW9uJyxcbiAgICAgICAgICAgICAgRWZmZWN0OiAnRGVueScsXG4gICAgICAgICAgICAgIEFjdGlvbjogWydlYzI6VGVybWluYXRlSW5zdGFuY2VzJ10sXG4gICAgICAgICAgICAgIFJlc291cmNlOiAnKicsXG4gICAgICAgICAgICAgIENvbmRpdGlvbjoge1xuICAgICAgICAgICAgICAgIFN0cmluZ0xpa2U6IHtcbiAgICAgICAgICAgICAgICAgICdlYzI6UmVzb3VyY2VUYWcvRW52aXJvbm1lbnQnOiAncHJvZConXG4gICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICBCb29sOiB7XG4gICAgICAgICAgICAgICAgICAnYXdzOk11bHRpRmFjdG9yQXV0aFByZXNlbnQnOiAnZmFsc2UnXG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAge1xuICAgICAgICAgICAgICBTaWQ6ICdSZXF1aXJlQnVzaW5lc3NIb3Vyc0ZvckNyaXRpY2FsT3BlcmF0aW9ucycsXG4gICAgICAgICAgICAgIEVmZmVjdDogJ0RlbnknLFxuICAgICAgICAgICAgICBBY3Rpb246IFsnZWMyOlRlcm1pbmF0ZUluc3RhbmNlcyddLFxuICAgICAgICAgICAgICBSZXNvdXJjZTogJyonLFxuICAgICAgICAgICAgICBDb25kaXRpb246IHtcbiAgICAgICAgICAgICAgICBTdHJpbmdFcXVhbHM6IHtcbiAgICAgICAgICAgICAgICAgICdlYzI6UmVzb3VyY2VUYWcvQ3JpdGljYWxTeXN0ZW0nOiAndHJ1ZSdcbiAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgIERhdGVOb3RCZXR3ZWVuOiB7XG4gICAgICAgICAgICAgICAgICAnYXdzOkN1cnJlbnRUaW1lJzogWycwODowMFonLCAnMTg6MDBaJ11cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgIFNpZDogJ0FsbG93U3RvcEluc3RhbmNlc1dpdGhDb25kaXRpb25zJyxcbiAgICAgICAgICAgICAgRWZmZWN0OiAnQWxsb3cnLFxuICAgICAgICAgICAgICBBY3Rpb246IFsnZWMyOlN0b3BJbnN0YW5jZXMnXSxcbiAgICAgICAgICAgICAgUmVzb3VyY2U6ICcqJyxcbiAgICAgICAgICAgICAgQ29uZGl0aW9uOiB7XG4gICAgICAgICAgICAgICAgU3RyaW5nTm90TGlrZToge1xuICAgICAgICAgICAgICAgICAgJ2VjMjpSZXNvdXJjZVRhZy9FbnZpcm9ubWVudCc6ICdwcm9kKidcbiAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgIFN0cmluZ0VxdWFsczoge1xuICAgICAgICAgICAgICAgICAgJ2F3czpSZXF1ZXN0ZWRSZWdpb24nOiAndXMtZWFzdC0xJ1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgIF1cbiAgICAgICAgfSksXG4gICAgICAgIHRhZ3MsXG4gICAgICB9LFxuICAgICAgeyBwYXJlbnQ6IHRoaXMgfVxuICAgICk7XG5cbiAgICAvLyBTMyBzZWN1cml0eSBlbmZvcmNlbWVudCBwb2xpY3lcbiAgICB0aGlzLnMzRGVueUluc2VjdXJlUG9saWN5ID0gbmV3IGF3cy5pYW0uUG9saWN5KFxuICAgICAgYCR7bmFtZX0tczMtc2VjdXJpdHlgLFxuICAgICAge1xuICAgICAgICBuYW1lOiBgUzNTZWN1cml0eVBvbGljeS0ke2Vudmlyb25tZW50U3VmZml4fWAsXG4gICAgICAgIGRlc2NyaXB0aW9uOiAnRW5mb3JjZXMgc2VjdXJlIFMzIG9wZXJhdGlvbnMgb25seScsXG4gICAgICAgIHBvbGljeTogSlNPTi5zdHJpbmdpZnkoe1xuICAgICAgICAgIFZlcnNpb246ICcyMDEyLTEwLTE3JyxcbiAgICAgICAgICBTdGF0ZW1lbnQ6IFtcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgU2lkOiAnRGVueUluc2VjdXJlUzNPcGVyYXRpb25zJyxcbiAgICAgICAgICAgICAgRWZmZWN0OiAnRGVueScsXG4gICAgICAgICAgICAgIEFjdGlvbjogWydzMzpQdXRPYmplY3QnXSxcbiAgICAgICAgICAgICAgUmVzb3VyY2U6ICdhcm46YXdzOnMzOjo6Ki8qJyxcbiAgICAgICAgICAgICAgQ29uZGl0aW9uOiB7XG4gICAgICAgICAgICAgICAgU3RyaW5nTm90RXF1YWxzOiB7XG4gICAgICAgICAgICAgICAgICAnczM6eC1hbXotc2VydmVyLXNpZGUtZW5jcnlwdGlvbic6IFsnYXdzOmttcycsICdBRVMyNTYnXSxcbiAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgU2lkOiAnRGVueVVuZW5jcnlwdGVkUzNVcGxvYWRzJyxcbiAgICAgICAgICAgICAgRWZmZWN0OiAnRGVueScsXG4gICAgICAgICAgICAgIEFjdGlvbjogWydzMzpQdXRPYmplY3QnXSxcbiAgICAgICAgICAgICAgUmVzb3VyY2U6ICdhcm46YXdzOnMzOjo6Ki8qJyxcbiAgICAgICAgICAgICAgQ29uZGl0aW9uOiB7XG4gICAgICAgICAgICAgICAgTnVsbDoge1xuICAgICAgICAgICAgICAgICAgJ3MzOngtYW16LXNlcnZlci1zaWRlLWVuY3J5cHRpb24nOiAndHJ1ZScsXG4gICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgIFNpZDogJ0RlbnlJbnNlY3VyZVMzQ29ubmVjdGlvbnMnLFxuICAgICAgICAgICAgICBFZmZlY3Q6ICdEZW55JyxcbiAgICAgICAgICAgICAgQWN0aW9uOiAnczM6KicsXG4gICAgICAgICAgICAgIFJlc291cmNlOiBbJ2Fybjphd3M6czM6OjoqJywgJ2Fybjphd3M6czM6OjoqLyonXSxcbiAgICAgICAgICAgICAgQ29uZGl0aW9uOiB7XG4gICAgICAgICAgICAgICAgQm9vbDoge1xuICAgICAgICAgICAgICAgICAgJ2F3czpTZWN1cmVUcmFuc3BvcnQnOiAnZmFsc2UnLFxuICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAge1xuICAgICAgICAgICAgICBTaWQ6ICdEZW55UHVibGljUzNBY2Nlc3MnLFxuICAgICAgICAgICAgICBFZmZlY3Q6ICdEZW55JyxcbiAgICAgICAgICAgICAgQWN0aW9uOiBbXG4gICAgICAgICAgICAgICAgJ3MzOlB1dEJ1Y2tldEFjbCcsXG4gICAgICAgICAgICAgICAgJ3MzOlB1dE9iamVjdEFjbCcsXG4gICAgICAgICAgICAgICAgJ3MzOlB1dEJ1Y2tldFBvbGljeScsXG4gICAgICAgICAgICAgIF0sXG4gICAgICAgICAgICAgIFJlc291cmNlOiBbJ2Fybjphd3M6czM6OjoqJywgJ2Fybjphd3M6czM6OjoqLyonXSxcbiAgICAgICAgICAgICAgQ29uZGl0aW9uOiB7XG4gICAgICAgICAgICAgICAgU3RyaW5nRXF1YWxzOiB7XG4gICAgICAgICAgICAgICAgICAnczM6eC1hbXotYWNsJzogW1xuICAgICAgICAgICAgICAgICAgICAncHVibGljLXJlYWQnLFxuICAgICAgICAgICAgICAgICAgICAncHVibGljLXJlYWQtd3JpdGUnLFxuICAgICAgICAgICAgICAgICAgICAnYXV0aGVudGljYXRlZC1yZWFkJyxcbiAgICAgICAgICAgICAgICAgIF0sXG4gICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgXSxcbiAgICAgICAgfSksXG4gICAgICAgIHRhZ3MsXG4gICAgICB9LFxuICAgICAgeyBwYXJlbnQ6IHRoaXMgfVxuICAgICk7XG5cbiAgICAvLyBDbG91ZFRyYWlsIHByb3RlY3Rpb24gcG9saWN5XG4gICAgdGhpcy5jbG91ZFRyYWlsUHJvdGVjdGlvblBvbGljeSA9IG5ldyBhd3MuaWFtLlBvbGljeShcbiAgICAgIGAke25hbWV9LWNsb3VkdHJhaWwtcHJvdGVjdGlvbmAsXG4gICAgICB7XG4gICAgICAgIG5hbWU6IGBDbG91ZFRyYWlsUHJvdGVjdGlvblBvbGljeS0ke2Vudmlyb25tZW50U3VmZml4fWAsXG4gICAgICAgIGRlc2NyaXB0aW9uOiAnUHJvdGVjdHMgQ2xvdWRUcmFpbCBmcm9tIHVuYXV0aG9yaXplZCBtb2RpZmljYXRpb25zJyxcbiAgICAgICAgcG9saWN5OiBKU09OLnN0cmluZ2lmeSh7XG4gICAgICAgICAgVmVyc2lvbjogJzIwMTItMTAtMTcnLFxuICAgICAgICAgIFN0YXRlbWVudDogW1xuICAgICAgICAgICAge1xuICAgICAgICAgICAgICBTaWQ6ICdEZW55Q2xvdWRUcmFpbERpc2FibGluZycsXG4gICAgICAgICAgICAgIEVmZmVjdDogJ0RlbnknLFxuICAgICAgICAgICAgICBBY3Rpb246IFtcbiAgICAgICAgICAgICAgICAnY2xvdWR0cmFpbDpTdG9wTG9nZ2luZycsXG4gICAgICAgICAgICAgICAgJ2Nsb3VkdHJhaWw6RGVsZXRlVHJhaWwnLFxuICAgICAgICAgICAgICAgICdjbG91ZHRyYWlsOlB1dEV2ZW50U2VsZWN0b3JzJyxcbiAgICAgICAgICAgICAgXSxcbiAgICAgICAgICAgICAgUmVzb3VyY2U6ICcqJyxcbiAgICAgICAgICAgICAgQ29uZGl0aW9uOiB7XG4gICAgICAgICAgICAgICAgU3RyaW5nTm90RXF1YWxzOiB7XG4gICAgICAgICAgICAgICAgICAnYXdzOnVzZXJpZCc6IFtcbiAgICAgICAgICAgICAgICAgICAgLy8gQWRkIHNwZWNpZmljIGFkbWluIHVzZXIgSURzIGhlcmVcbiAgICAgICAgICAgICAgICAgICAgJ0FJREFDS0NFVlNRNkMyRVhBTVBMRScsXG4gICAgICAgICAgICAgICAgICBdLFxuICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAge1xuICAgICAgICAgICAgICBTaWQ6ICdEZW55Q2xvdWRUcmFpbFMzQnVja2V0TW9kaWZpY2F0aW9uJyxcbiAgICAgICAgICAgICAgRWZmZWN0OiAnRGVueScsXG4gICAgICAgICAgICAgIEFjdGlvbjogW1xuICAgICAgICAgICAgICAgICdzMzpEZWxldGVPYmplY3QnLFxuICAgICAgICAgICAgICAgICdzMzpEZWxldGVPYmplY3RWZXJzaW9uJyxcbiAgICAgICAgICAgICAgICAnczM6UHV0QnVja2V0UG9saWN5JyxcbiAgICAgICAgICAgICAgICAnczM6RGVsZXRlQnVja2V0UG9saWN5JyxcbiAgICAgICAgICAgICAgXSxcbiAgICAgICAgICAgICAgUmVzb3VyY2U6IFtcbiAgICAgICAgICAgICAgICAnYXJuOmF3czpzMzo6OipjbG91ZHRyYWlsKicsXG4gICAgICAgICAgICAgICAgJ2Fybjphd3M6czM6OjoqY2xvdWR0cmFpbCovKicsXG4gICAgICAgICAgICAgICAgJ2Fybjphd3M6czM6OjoqYXVkaXQqJyxcbiAgICAgICAgICAgICAgICAnYXJuOmF3czpzMzo6OiphdWRpdCovKicsXG4gICAgICAgICAgICAgIF0sXG4gICAgICAgICAgICAgIENvbmRpdGlvbjoge1xuICAgICAgICAgICAgICAgIFN0cmluZ05vdEVxdWFsczoge1xuICAgICAgICAgICAgICAgICAgJ2F3czp1c2VyaWQnOiBbXG4gICAgICAgICAgICAgICAgICAgIC8vIEFkZCBzcGVjaWZpYyBhZG1pbiB1c2VyIElEcyBoZXJlXG4gICAgICAgICAgICAgICAgICAgICdBSURBQ0tDRVZTUTZDMkVYQU1QTEUnLFxuICAgICAgICAgICAgICAgICAgXSxcbiAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgfSxcbiAgICAgICAgICBdLFxuICAgICAgICB9KSxcbiAgICAgICAgdGFncyxcbiAgICAgIH0sXG4gICAgICB7IHBhcmVudDogdGhpcyB9XG4gICAgKTtcblxuICAgIC8vIEtNUyBrZXkgcHJvdGVjdGlvbiBwb2xpY3lcbiAgICB0aGlzLmttc0tleVByb3RlY3Rpb25Qb2xpY3kgPSBuZXcgYXdzLmlhbS5Qb2xpY3koXG4gICAgICBgJHtuYW1lfS1rbXMtcHJvdGVjdGlvbmAsXG4gICAgICB7XG4gICAgICAgIG5hbWU6IGBLTVNLZXlQcm90ZWN0aW9uUG9saWN5LSR7ZW52aXJvbm1lbnRTdWZmaXh9YCxcbiAgICAgICAgZGVzY3JpcHRpb246ICdQcm90ZWN0cyBLTVMga2V5cyBmcm9tIHVuYXV0aG9yaXplZCBhY2Nlc3MgYW5kIGRlbGV0aW9uJyxcbiAgICAgICAgcG9saWN5OiBKU09OLnN0cmluZ2lmeSh7XG4gICAgICAgICAgVmVyc2lvbjogJzIwMTItMTAtMTcnLFxuICAgICAgICAgIFN0YXRlbWVudDogW1xuICAgICAgICAgICAge1xuICAgICAgICAgICAgICBTaWQ6ICdEZW55S01TS2V5RGVsZXRpb24nLFxuICAgICAgICAgICAgICBFZmZlY3Q6ICdEZW55JyxcbiAgICAgICAgICAgICAgQWN0aW9uOiBbJ2ttczpTY2hlZHVsZUtleURlbGV0aW9uJywgJ2ttczpEaXNhYmxlS2V5J10sXG4gICAgICAgICAgICAgIFJlc291cmNlOiAnKicsXG4gICAgICAgICAgICAgIENvbmRpdGlvbjoge1xuICAgICAgICAgICAgICAgIFN0cmluZ05vdEVxdWFsczoge1xuICAgICAgICAgICAgICAgICAgJ2F3czp1c2VyaWQnOiBbXG4gICAgICAgICAgICAgICAgICAgIC8vIEFkZCBzcGVjaWZpYyBhZG1pbiB1c2VyIElEcyBoZXJlXG4gICAgICAgICAgICAgICAgICAgICdBSURBQ0tDRVZTUTZDMkVYQU1QTEUnLFxuICAgICAgICAgICAgICAgICAgXSxcbiAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgU2lkOiAnRGVueUtNU0tleVBvbGljeUNoYW5nZXMnLFxuICAgICAgICAgICAgICBFZmZlY3Q6ICdEZW55JyxcbiAgICAgICAgICAgICAgQWN0aW9uOiBbJ2ttczpQdXRLZXlQb2xpY3knXSxcbiAgICAgICAgICAgICAgUmVzb3VyY2U6ICcqJyxcbiAgICAgICAgICAgICAgQ29uZGl0aW9uOiB7XG4gICAgICAgICAgICAgICAgU3RyaW5nTm90RXF1YWxzOiB7XG4gICAgICAgICAgICAgICAgICAnYXdzOnVzZXJpZCc6IFtcbiAgICAgICAgICAgICAgICAgICAgLy8gQWRkIHNwZWNpZmljIGFkbWluIHVzZXIgSURzIGhlcmVcbiAgICAgICAgICAgICAgICAgICAgJ0FJREFDS0NFVlNRNkMyRVhBTVBMRScsXG4gICAgICAgICAgICAgICAgICBdLFxuICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICB9LFxuICAgICAgICAgIF0sXG4gICAgICAgIH0pLFxuICAgICAgICB0YWdzLFxuICAgICAgfSxcbiAgICAgIHsgcGFyZW50OiB0aGlzIH1cbiAgICApO1xuXG4gICAgdGhpcy5yZWdpc3Rlck91dHB1dHMoe1xuICAgICAgbWZhRW5mb3JjZW1lbnRQb2xpY3lBcm46IHRoaXMubWZhRW5mb3JjZW1lbnRQb2xpY3kuYXJuLFxuICAgICAgZWMyTGlmZWN5Y2xlUG9saWN5QXJuOiB0aGlzLmVjMkxpZmVjeWNsZVBvbGljeS5hcm4sXG4gICAgICBzM0RlbnlJbnNlY3VyZVBvbGljeUFybjogdGhpcy5zM0RlbnlJbnNlY3VyZVBvbGljeS5hcm4sXG4gICAgICBjbG91ZFRyYWlsUHJvdGVjdGlvblBvbGljeUFybjogdGhpcy5jbG91ZFRyYWlsUHJvdGVjdGlvblBvbGljeS5hcm4sXG4gICAgICBrbXNLZXlQcm90ZWN0aW9uUG9saWN5QXJuOiB0aGlzLmttc0tleVByb3RlY3Rpb25Qb2xpY3kuYXJuLFxuICAgIH0pO1xuICB9XG59XG5cbi8vIEVuaGFuY2VkIGxlYXN0IHByaXZpbGVnZSBTMyBwb2xpY3kgd2l0aCB0aW1lLWJhc2VkIGFjY2Vzc1xuZXhwb3J0IGZ1bmN0aW9uIGNyZWF0ZVRpbWVCYXNlZFMzQWNjZXNzUG9saWN5KFxuICBidWNrZXRBcm46IHB1bHVtaS5JbnB1dDxzdHJpbmc+LFxuICBhbGxvd2VkSG91cnM6IHN0cmluZ1tdID0gW1xuICAgICcwOScsXG4gICAgJzEwJyxcbiAgICAnMTEnLFxuICAgICcxMicsXG4gICAgJzEzJyxcbiAgICAnMTQnLFxuICAgICcxNScsXG4gICAgJzE2JyxcbiAgICAnMTcnLFxuICBdXG4pOiBwdWx1bWkuT3V0cHV0PHN0cmluZz4ge1xuICByZXR1cm4gcHVsdW1pLmludGVycG9sYXRlYHtcbiAgICBcIlZlcnNpb25cIjogXCIyMDEyLTEwLTE3XCIsXG4gICAgXCJTdGF0ZW1lbnRcIjogW1xuICAgICAge1xuICAgICAgICBcIkVmZmVjdFwiOiBcIkFsbG93XCIsXG4gICAgICAgIFwiQWN0aW9uXCI6IFtcbiAgICAgICAgICBcInMzOkdldE9iamVjdFwiXG4gICAgICAgIF0sXG4gICAgICAgIFwiUmVzb3VyY2VcIjogXCIke2J1Y2tldEFybn0vKlwiLFxuICAgICAgICBcIkNvbmRpdGlvblwiOiB7XG4gICAgICAgICAgXCJEYXRlR3JlYXRlclRoYW5cIjoge1xuICAgICAgICAgICAgXCJhd3M6VG9rZW5Jc3N1ZVRpbWVcIjogXCIyMDI0LTAxLTAxVDAwOjAwOjAwWlwiXG4gICAgICAgICAgfSxcbiAgICAgICAgICBcIlN0cmluZ0xpa2VcIjoge1xuICAgICAgICAgICAgXCJhd3M6UmVxdWVzdGVkUmVnaW9uXCI6IFwidXMtZWFzdC0xXCJcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH0sXG4gICAgICB7XG4gICAgICAgIFwiRWZmZWN0XCI6IFwiQWxsb3dcIixcbiAgICAgICAgXCJBY3Rpb25cIjogW1xuICAgICAgICAgIFwiczM6UHV0T2JqZWN0XCJcbiAgICAgICAgXSxcbiAgICAgICAgXCJSZXNvdXJjZVwiOiBcIiR7YnVja2V0QXJufS8qXCIsXG4gICAgICAgIFwiQ29uZGl0aW9uXCI6IHtcbiAgICAgICAgICBcIlN0cmluZ0VxdWFsc1wiOiB7XG4gICAgICAgICAgICBcInMzOngtYW16LXNlcnZlci1zaWRlLWVuY3J5cHRpb25cIjogXCJhd3M6a21zXCJcbiAgICAgICAgICB9LFxuICAgICAgICAgIFwiU3RyaW5nTGlrZVwiOiB7XG4gICAgICAgICAgICBcImF3czpSZXF1ZXN0ZWRSZWdpb25cIjogXCJ1cy1lYXN0LTFcIlxuICAgICAgICAgIH0sXG4gICAgICAgICAgXCJGb3JBbGxWYWx1ZXM6U3RyaW5nRXF1YWxzXCI6IHtcbiAgICAgICAgICAgIFwiYXdzOlJlcXVlc3RlZEhvdXJcIjogJHtKU09OLnN0cmluZ2lmeShhbGxvd2VkSG91cnMpfVxuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfSxcbiAgICAgIHtcbiAgICAgICAgXCJFZmZlY3RcIjogXCJBbGxvd1wiLFxuICAgICAgICBcIkFjdGlvblwiOiBbXG4gICAgICAgICAgXCJzMzpMaXN0QnVja2V0XCJcbiAgICAgICAgXSxcbiAgICAgICAgXCJSZXNvdXJjZVwiOiBcIiR7YnVja2V0QXJufVwiLFxuICAgICAgICBcIkNvbmRpdGlvblwiOiB7XG4gICAgICAgICAgXCJTdHJpbmdMaWtlXCI6IHtcbiAgICAgICAgICAgIFwiYXdzOlJlcXVlc3RlZFJlZ2lvblwiOiBcInVzLWVhc3QtMVwiXG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9LFxuICAgICAge1xuICAgICAgICBcIkVmZmVjdFwiOiBcIkRlbnlcIixcbiAgICAgICAgXCJBY3Rpb25cIjogW1xuICAgICAgICAgIFwiczM6RGVsZXRlT2JqZWN0XCIsXG4gICAgICAgICAgXCJzMzpEZWxldGVPYmplY3RWZXJzaW9uXCJcbiAgICAgICAgXSxcbiAgICAgICAgXCJSZXNvdXJjZVwiOiBcIiR7YnVja2V0QXJufS8qXCJcbiAgICAgIH1cbiAgICBdXG4gIH1gO1xufVxuXG4vLyBSZWFkLW9ubHkgYXVkaXQgYWNjZXNzIHBvbGljeSB3aXRoIElQIHJlc3RyaWN0aW9uc1xuZXhwb3J0IGZ1bmN0aW9uIGNyZWF0ZVJlc3RyaWN0ZWRBdWRpdFBvbGljeShcbiAgYXVkaXRCdWNrZXRBcm46IHB1bHVtaS5JbnB1dDxzdHJpbmc+LFxuICBhbGxvd2VkSXBSYW5nZXM6IHN0cmluZ1tdID0gWycyMDMuMC4xMTMuMC8yNCddXG4pOiBwdWx1bWkuT3V0cHV0PHN0cmluZz4ge1xuICByZXR1cm4gcHVsdW1pLmludGVycG9sYXRlYHtcbiAgICBcIlZlcnNpb25cIjogXCIyMDEyLTEwLTE3XCIsXG4gICAgXCJTdGF0ZW1lbnRcIjogW1xuICAgICAge1xuICAgICAgICBcIkVmZmVjdFwiOiBcIkFsbG93XCIsXG4gICAgICAgIFwiQWN0aW9uXCI6IFtcbiAgICAgICAgICBcInMzOkdldE9iamVjdFwiLFxuICAgICAgICAgIFwiczM6TGlzdEJ1Y2tldFwiXG4gICAgICAgIF0sXG4gICAgICAgIFwiUmVzb3VyY2VcIjogW1xuICAgICAgICAgIFwiJHthdWRpdEJ1Y2tldEFybn1cIixcbiAgICAgICAgICBcIiR7YXVkaXRCdWNrZXRBcm59LypcIlxuICAgICAgICBdLFxuICAgICAgICBcIkNvbmRpdGlvblwiOiB7XG4gICAgICAgICAgXCJJcEFkZHJlc3NcIjoge1xuICAgICAgICAgICAgXCJhd3M6U291cmNlSXBcIjogJHtKU09OLnN0cmluZ2lmeShhbGxvd2VkSXBSYW5nZXMpfVxuICAgICAgICAgIH0sXG4gICAgICAgICAgXCJTdHJpbmdMaWtlXCI6IHtcbiAgICAgICAgICAgIFwiYXdzOlJlcXVlc3RlZFJlZ2lvblwiOiBcInVzLWVhc3QtMVwiXG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9LFxuICAgICAge1xuICAgICAgICBcIkVmZmVjdFwiOiBcIkFsbG93XCIsXG4gICAgICAgIFwiQWN0aW9uXCI6IFtcbiAgICAgICAgICBcImNsb3VkdHJhaWw6TG9va3VwRXZlbnRzXCJcbiAgICAgICAgXSxcbiAgICAgICAgXCJSZXNvdXJjZVwiOiBcIipcIixcbiAgICAgICAgXCJDb25kaXRpb25cIjoge1xuICAgICAgICAgIFwiSXBBZGRyZXNzXCI6IHtcbiAgICAgICAgICAgIFwiYXdzOlNvdXJjZUlwXCI6ICR7SlNPTi5zdHJpbmdpZnkoYWxsb3dlZElwUmFuZ2VzKX1cbiAgICAgICAgICB9LFxuICAgICAgICAgIFwiU3RyaW5nTGlrZVwiOiB7XG4gICAgICAgICAgICBcImF3czpSZXF1ZXN0ZWRSZWdpb25cIjogXCJ1cy1lYXN0LTFcIlxuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfSxcbiAgICAgIHtcbiAgICAgICAgXCJFZmZlY3RcIjogXCJEZW55XCIsXG4gICAgICAgIFwiTm90QWN0aW9uXCI6IFtcbiAgICAgICAgICBcInMzOkdldE9iamVjdFwiLFxuICAgICAgICAgIFwiczM6TGlzdEJ1Y2tldFwiLFxuICAgICAgICAgIFwiY2xvdWR0cmFpbDpMb29rdXBFdmVudHNcIixcbiAgICAgICAgICBcImNsb3VkdHJhaWw6R2V0VHJhaWxTdGF0dXNcIlxuICAgICAgICBdLFxuICAgICAgICBcIlJlc291cmNlXCI6IFwiKlwiXG4gICAgICB9XG4gICAgXVxuICB9YDtcbn1cbiJdfQ==