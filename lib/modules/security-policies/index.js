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
                        Sid: 'DenySensitiveActionsWithoutMFA',
                        Effect: 'Deny',
                        Action: [
                            'iam:DeleteRole',
                            'iam:DeleteUser',
                            's3:DeleteBucket',
                            'kms:ScheduleKeyDeletion'
                        ],
                        Resource: '*',
                        Condition: {
                            Bool: {
                                'aws:MultiFactorAuthPresent': 'false'
                            }
                        }
                    },
                    {
                        Sid: 'DenyRootAccountUsage',
                        Effect: 'Deny',
                        Action: '*',
                        Resource: '*',
                        Condition: {
                            StringEquals: {
                                'aws:userid': 'root'
                            }
                        }
                    }
                ]
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
                        Sid: 'DenyProductionInstanceTermination',
                        Effect: 'Deny',
                        Action: 'ec2:TerminateInstances',
                        Resource: '*',
                        Condition: {
                            StringLike: {
                                'ec2:ResourceTag/Environment': 'prod*'
                            }
                        }
                    },
                    {
                        Sid: 'AllowNonProductionOperations',
                        Effect: 'Allow',
                        Action: [
                            'ec2:StopInstances',
                            'ec2:StartInstances'
                        ],
                        Resource: '*'
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
                        Sid: 'DenyInsecureTransport',
                        Effect: 'Deny',
                        Action: 's3:*',
                        Resource: ['arn:aws:s3:::*', 'arn:aws:s3:::*/*'],
                        Condition: {
                            Bool: {
                                'aws:SecureTransport': 'false'
                            }
                        }
                    },
                    {
                        Sid: 'DenyUnencryptedUploads',
                        Effect: 'Deny',
                        Action: 's3:PutObject',
                        Resource: 'arn:aws:s3:::*/*',
                        Condition: {
                            StringNotEquals: {
                                's3:x-amz-server-side-encryption': 'aws:kms'
                            }
                        }
                    }
                ]
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
                            'cloudtrail:DeleteTrail'
                        ],
                        Resource: '*'
                    }
                ]
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
                        Action: [
                            'kms:ScheduleKeyDeletion',
                            'kms:DisableKey'
                        ],
                        Resource: '*'
                    }
                ]
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJpbmRleC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUE2TUEsc0VBd0VDO0FBR0Qsa0VBcURDO0FBN1VELGlEQUFtQztBQUNuQyx1REFBeUM7QUFDekMsNENBQStDO0FBTy9DLE1BQWEsZ0JBQWlCLFNBQVEsTUFBTSxDQUFDLGlCQUFpQjtJQUM1QyxvQkFBb0IsQ0FBaUI7SUFDckMsa0JBQWtCLENBQWlCO0lBQ25DLG9CQUFvQixDQUFpQjtJQUNyQywwQkFBMEIsQ0FBaUI7SUFDM0Msc0JBQXNCLENBQWlCO0lBRXZELFlBQ0UsSUFBWSxFQUNaLElBQTJCLEVBQzNCLElBQXNDO1FBRXRDLEtBQUssQ0FBQyxrQ0FBa0MsRUFBRSxJQUFJLEVBQUUsSUFBSSxFQUFFLElBQUksQ0FBQyxDQUFDO1FBRTVELE1BQU0saUJBQWlCLEdBQUcsSUFBSSxFQUFFLGlCQUFpQixJQUFJLEtBQUssQ0FBQztRQUMzRCxNQUFNLElBQUksR0FBRyxFQUFFLEdBQUcsaUJBQVUsRUFBRSxHQUFHLElBQUksRUFBRSxJQUFJLEVBQUUsQ0FBQztRQUU5Qyw0REFBNEQ7UUFDNUQsSUFBSSxDQUFDLG9CQUFvQixHQUFHLElBQUksR0FBRyxDQUFDLEdBQUcsQ0FBQyxNQUFNLENBQzVDLEdBQUcsSUFBSSxrQkFBa0IsRUFDekI7WUFDRSxJQUFJLEVBQUUsd0JBQXdCLGlCQUFpQixFQUFFO1lBQ2pELFdBQVcsRUFBRSwrQ0FBK0M7WUFDNUQsTUFBTSxFQUFFLElBQUksQ0FBQyxTQUFTLENBQUM7Z0JBQ3JCLE9BQU8sRUFBRSxZQUFZO2dCQUNyQixTQUFTLEVBQUU7b0JBQ1Q7d0JBQ0UsR0FBRyxFQUFFLGdDQUFnQzt3QkFDckMsTUFBTSxFQUFFLE1BQU07d0JBQ2QsTUFBTSxFQUFFOzRCQUNOLGdCQUFnQjs0QkFDaEIsZ0JBQWdCOzRCQUNoQixpQkFBaUI7NEJBQ2pCLHlCQUF5Qjt5QkFDMUI7d0JBQ0QsUUFBUSxFQUFFLEdBQUc7d0JBQ2IsU0FBUyxFQUFFOzRCQUNULElBQUksRUFBRTtnQ0FDSiw0QkFBNEIsRUFBRSxPQUFPOzZCQUN0Qzt5QkFDRjtxQkFDRjtvQkFDRDt3QkFDRSxHQUFHLEVBQUUsc0JBQXNCO3dCQUMzQixNQUFNLEVBQUUsTUFBTTt3QkFDZCxNQUFNLEVBQUUsR0FBRzt3QkFDWCxRQUFRLEVBQUUsR0FBRzt3QkFDYixTQUFTLEVBQUU7NEJBQ1QsWUFBWSxFQUFFO2dDQUNaLFlBQVksRUFBRSxNQUFNOzZCQUNyQjt5QkFDRjtxQkFDRjtpQkFDRjthQUNGLENBQUM7WUFDRixJQUFJO1NBQ0wsRUFDRCxFQUFFLE1BQU0sRUFBRSxJQUFJLEVBQUUsQ0FDakIsQ0FBQztRQUVGLDRDQUE0QztRQUM1QyxJQUFJLENBQUMsa0JBQWtCLEdBQUcsSUFBSSxHQUFHLENBQUMsR0FBRyxDQUFDLE1BQU0sQ0FDMUMsR0FBRyxJQUFJLGdCQUFnQixFQUN2QjtZQUNFLElBQUksRUFBRSxzQkFBc0IsaUJBQWlCLEVBQUU7WUFDL0MsV0FBVyxFQUNULGdFQUFnRTtZQUNsRSxNQUFNLEVBQUUsSUFBSSxDQUFDLFNBQVMsQ0FBQztnQkFDckIsT0FBTyxFQUFFLFlBQVk7Z0JBQ3JCLFNBQVMsRUFBRTtvQkFDVDt3QkFDRSxHQUFHLEVBQUUsbUNBQW1DO3dCQUN4QyxNQUFNLEVBQUUsTUFBTTt3QkFDZCxNQUFNLEVBQUUsd0JBQXdCO3dCQUNoQyxRQUFRLEVBQUUsR0FBRzt3QkFDYixTQUFTLEVBQUU7NEJBQ1QsVUFBVSxFQUFFO2dDQUNWLDZCQUE2QixFQUFFLE9BQU87NkJBQ3ZDO3lCQUNGO3FCQUNGO29CQUNEO3dCQUNFLEdBQUcsRUFBRSw4QkFBOEI7d0JBQ25DLE1BQU0sRUFBRSxPQUFPO3dCQUNmLE1BQU0sRUFBRTs0QkFDTixtQkFBbUI7NEJBQ25CLG9CQUFvQjt5QkFDckI7d0JBQ0QsUUFBUSxFQUFFLEdBQUc7cUJBQ2Q7aUJBQ0Y7YUFDRixDQUFDO1lBQ0YsSUFBSTtTQUNMLEVBQ0QsRUFBRSxNQUFNLEVBQUUsSUFBSSxFQUFFLENBQ2pCLENBQUM7UUFFRixpQ0FBaUM7UUFDakMsSUFBSSxDQUFDLG9CQUFvQixHQUFHLElBQUksR0FBRyxDQUFDLEdBQUcsQ0FBQyxNQUFNLENBQzVDLEdBQUcsSUFBSSxjQUFjLEVBQ3JCO1lBQ0UsSUFBSSxFQUFFLG9CQUFvQixpQkFBaUIsRUFBRTtZQUM3QyxXQUFXLEVBQUUsb0NBQW9DO1lBQ2pELE1BQU0sRUFBRSxJQUFJLENBQUMsU0FBUyxDQUFDO2dCQUNyQixPQUFPLEVBQUUsWUFBWTtnQkFDckIsU0FBUyxFQUFFO29CQUNUO3dCQUNFLEdBQUcsRUFBRSx1QkFBdUI7d0JBQzVCLE1BQU0sRUFBRSxNQUFNO3dCQUNkLE1BQU0sRUFBRSxNQUFNO3dCQUNkLFFBQVEsRUFBRSxDQUFDLGdCQUFnQixFQUFFLGtCQUFrQixDQUFDO3dCQUNoRCxTQUFTLEVBQUU7NEJBQ1QsSUFBSSxFQUFFO2dDQUNKLHFCQUFxQixFQUFFLE9BQU87NkJBQy9CO3lCQUNGO3FCQUNGO29CQUNEO3dCQUNFLEdBQUcsRUFBRSx3QkFBd0I7d0JBQzdCLE1BQU0sRUFBRSxNQUFNO3dCQUNkLE1BQU0sRUFBRSxjQUFjO3dCQUN0QixRQUFRLEVBQUUsa0JBQWtCO3dCQUM1QixTQUFTLEVBQUU7NEJBQ1QsZUFBZSxFQUFFO2dDQUNmLGlDQUFpQyxFQUFFLFNBQVM7NkJBQzdDO3lCQUNGO3FCQUNGO2lCQUNGO2FBQ0YsQ0FBQztZQUNGLElBQUk7U0FDTCxFQUNELEVBQUUsTUFBTSxFQUFFLElBQUksRUFBRSxDQUNqQixDQUFDO1FBRUYsK0JBQStCO1FBQy9CLElBQUksQ0FBQywwQkFBMEIsR0FBRyxJQUFJLEdBQUcsQ0FBQyxHQUFHLENBQUMsTUFBTSxDQUNsRCxHQUFHLElBQUksd0JBQXdCLEVBQy9CO1lBQ0UsSUFBSSxFQUFFLDhCQUE4QixpQkFBaUIsRUFBRTtZQUN2RCxXQUFXLEVBQUUscURBQXFEO1lBQ2xFLE1BQU0sRUFBRSxJQUFJLENBQUMsU0FBUyxDQUFDO2dCQUNyQixPQUFPLEVBQUUsWUFBWTtnQkFDckIsU0FBUyxFQUFFO29CQUNUO3dCQUNFLEdBQUcsRUFBRSx5QkFBeUI7d0JBQzlCLE1BQU0sRUFBRSxNQUFNO3dCQUNkLE1BQU0sRUFBRTs0QkFDTix3QkFBd0I7NEJBQ3hCLHdCQUF3Qjt5QkFDekI7d0JBQ0QsUUFBUSxFQUFFLEdBQUc7cUJBQ2Q7aUJBQ0Y7YUFDRixDQUFDO1lBQ0YsSUFBSTtTQUNMLEVBQ0QsRUFBRSxNQUFNLEVBQUUsSUFBSSxFQUFFLENBQ2pCLENBQUM7UUFFRiw0QkFBNEI7UUFDNUIsSUFBSSxDQUFDLHNCQUFzQixHQUFHLElBQUksR0FBRyxDQUFDLEdBQUcsQ0FBQyxNQUFNLENBQzlDLEdBQUcsSUFBSSxpQkFBaUIsRUFDeEI7WUFDRSxJQUFJLEVBQUUsMEJBQTBCLGlCQUFpQixFQUFFO1lBQ25ELFdBQVcsRUFBRSx5REFBeUQ7WUFDdEUsTUFBTSxFQUFFLElBQUksQ0FBQyxTQUFTLENBQUM7Z0JBQ3JCLE9BQU8sRUFBRSxZQUFZO2dCQUNyQixTQUFTLEVBQUU7b0JBQ1Q7d0JBQ0UsR0FBRyxFQUFFLG9CQUFvQjt3QkFDekIsTUFBTSxFQUFFLE1BQU07d0JBQ2QsTUFBTSxFQUFFOzRCQUNOLHlCQUF5Qjs0QkFDekIsZ0JBQWdCO3lCQUNqQjt3QkFDRCxRQUFRLEVBQUUsR0FBRztxQkFDZDtpQkFDRjthQUNGLENBQUM7WUFDRixJQUFJO1NBQ0wsRUFDRCxFQUFFLE1BQU0sRUFBRSxJQUFJLEVBQUUsQ0FDakIsQ0FBQztRQUVGLElBQUksQ0FBQyxlQUFlLENBQUM7WUFDbkIsdUJBQXVCLEVBQUUsSUFBSSxDQUFDLG9CQUFvQixDQUFDLEdBQUc7WUFDdEQscUJBQXFCLEVBQUUsSUFBSSxDQUFDLGtCQUFrQixDQUFDLEdBQUc7WUFDbEQsdUJBQXVCLEVBQUUsSUFBSSxDQUFDLG9CQUFvQixDQUFDLEdBQUc7WUFDdEQsNkJBQTZCLEVBQUUsSUFBSSxDQUFDLDBCQUEwQixDQUFDLEdBQUc7WUFDbEUseUJBQXlCLEVBQUUsSUFBSSxDQUFDLHNCQUFzQixDQUFDLEdBQUc7U0FDM0QsQ0FBQyxDQUFDO0lBQ0wsQ0FBQztDQUNGO0FBak1ELDRDQWlNQztBQUVELDREQUE0RDtBQUM1RCxTQUFnQiw2QkFBNkIsQ0FDM0MsU0FBK0IsRUFDL0IsZUFBeUI7SUFDdkIsSUFBSTtJQUNKLElBQUk7SUFDSixJQUFJO0lBQ0osSUFBSTtJQUNKLElBQUk7SUFDSixJQUFJO0lBQ0osSUFBSTtJQUNKLElBQUk7SUFDSixJQUFJO0NBQ0w7SUFFRCxPQUFPLE1BQU0sQ0FBQyxXQUFXLENBQUE7Ozs7Ozs7O3VCQVFKLFNBQVM7Ozs7Ozs7Ozs7Ozs7Ozt1QkFlVCxTQUFTOzs7Ozs7Ozs7bUNBU0csSUFBSSxDQUFDLFNBQVMsQ0FBQyxZQUFZLENBQUM7Ozs7Ozs7Ozt1QkFTeEMsU0FBUzs7Ozs7Ozs7Ozs7Ozt1QkFhVCxTQUFTOzs7SUFHNUIsQ0FBQztBQUNMLENBQUM7QUFFRCxxREFBcUQ7QUFDckQsU0FBZ0IsMkJBQTJCLENBQ3pDLGNBQW9DLEVBQ3BDLGtCQUE0QixDQUFDLGdCQUFnQixDQUFDO0lBRTlDLE9BQU8sTUFBTSxDQUFDLFdBQVcsQ0FBQTs7Ozs7Ozs7OzthQVVkLGNBQWM7YUFDZCxjQUFjOzs7OzhCQUlHLElBQUksQ0FBQyxTQUFTLENBQUMsZUFBZSxDQUFDOzs7Ozs7Ozs7Ozs7Ozs7OEJBZS9CLElBQUksQ0FBQyxTQUFTLENBQUMsZUFBZSxDQUFDOzs7Ozs7Ozs7Ozs7Ozs7Ozs7SUFrQnpELENBQUM7QUFDTCxDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0ICogYXMgYXdzIGZyb20gJ0BwdWx1bWkvYXdzJztcbmltcG9ydCAqIGFzIHB1bHVtaSBmcm9tICdAcHVsdW1pL3B1bHVtaSc7XG5pbXBvcnQgeyBjb21tb25UYWdzIH0gZnJvbSAnLi4vLi4vY29uZmlnL3RhZ3MnO1xuXG5leHBvcnQgaW50ZXJmYWNlIFNlY3VyaXR5UG9saWNpZXNBcmdzIHtcbiAgZW52aXJvbm1lbnRTdWZmaXg/OiBzdHJpbmc7XG4gIHRhZ3M/OiBSZWNvcmQ8c3RyaW5nLCBzdHJpbmc+O1xufVxuXG5leHBvcnQgY2xhc3MgU2VjdXJpdHlQb2xpY2llcyBleHRlbmRzIHB1bHVtaS5Db21wb25lbnRSZXNvdXJjZSB7XG4gIHB1YmxpYyByZWFkb25seSBtZmFFbmZvcmNlbWVudFBvbGljeTogYXdzLmlhbS5Qb2xpY3k7XG4gIHB1YmxpYyByZWFkb25seSBlYzJMaWZlY3ljbGVQb2xpY3k6IGF3cy5pYW0uUG9saWN5O1xuICBwdWJsaWMgcmVhZG9ubHkgczNEZW55SW5zZWN1cmVQb2xpY3k6IGF3cy5pYW0uUG9saWN5O1xuICBwdWJsaWMgcmVhZG9ubHkgY2xvdWRUcmFpbFByb3RlY3Rpb25Qb2xpY3k6IGF3cy5pYW0uUG9saWN5O1xuICBwdWJsaWMgcmVhZG9ubHkga21zS2V5UHJvdGVjdGlvblBvbGljeTogYXdzLmlhbS5Qb2xpY3k7XG5cbiAgY29uc3RydWN0b3IoXG4gICAgbmFtZTogc3RyaW5nLFxuICAgIGFyZ3M/OiBTZWN1cml0eVBvbGljaWVzQXJncyxcbiAgICBvcHRzPzogcHVsdW1pLkNvbXBvbmVudFJlc291cmNlT3B0aW9uc1xuICApIHtcbiAgICBzdXBlcignY3VzdG9tOnNlY3VyaXR5OlNlY3VyaXR5UG9saWNpZXMnLCBuYW1lLCBhcmdzLCBvcHRzKTtcblxuICAgIGNvbnN0IGVudmlyb25tZW50U3VmZml4ID0gYXJncz8uZW52aXJvbm1lbnRTdWZmaXggfHwgJ2Rldic7XG4gICAgY29uc3QgdGFncyA9IHsgLi4uY29tbW9uVGFncywgLi4uYXJncz8udGFncyB9O1xuXG4gICAgLy8gRW5oYW5jZWQgTUZBIGVuZm9yY2VtZW50IHBvbGljeSBmb3IgQUxMIHNlbnNpdGl2ZSBhY3Rpb25zXG4gICAgdGhpcy5tZmFFbmZvcmNlbWVudFBvbGljeSA9IG5ldyBhd3MuaWFtLlBvbGljeShcbiAgICAgIGAke25hbWV9LW1mYS1lbmZvcmNlbWVudGAsXG4gICAgICB7XG4gICAgICAgIG5hbWU6IGBNRkFFbmZvcmNlbWVudFBvbGljeS0ke2Vudmlyb25tZW50U3VmZml4fWAsXG4gICAgICAgIGRlc2NyaXB0aW9uOiAnRW5mb3JjZXMgTUZBIGZvciBhbGwgc2Vuc2l0aXZlIEFXUyBvcGVyYXRpb25zJyxcbiAgICAgICAgcG9saWN5OiBKU09OLnN0cmluZ2lmeSh7XG4gICAgICAgICAgVmVyc2lvbjogJzIwMTItMTAtMTcnLFxuICAgICAgICAgIFN0YXRlbWVudDogW1xuICAgICAgICAgICAge1xuICAgICAgICAgICAgICBTaWQ6ICdEZW55U2Vuc2l0aXZlQWN0aW9uc1dpdGhvdXRNRkEnLFxuICAgICAgICAgICAgICBFZmZlY3Q6ICdEZW55JyxcbiAgICAgICAgICAgICAgQWN0aW9uOiBbXG4gICAgICAgICAgICAgICAgJ2lhbTpEZWxldGVSb2xlJyxcbiAgICAgICAgICAgICAgICAnaWFtOkRlbGV0ZVVzZXInLFxuICAgICAgICAgICAgICAgICdzMzpEZWxldGVCdWNrZXQnLFxuICAgICAgICAgICAgICAgICdrbXM6U2NoZWR1bGVLZXlEZWxldGlvbidcbiAgICAgICAgICAgICAgXSxcbiAgICAgICAgICAgICAgUmVzb3VyY2U6ICcqJyxcbiAgICAgICAgICAgICAgQ29uZGl0aW9uOiB7XG4gICAgICAgICAgICAgICAgQm9vbDoge1xuICAgICAgICAgICAgICAgICAgJ2F3czpNdWx0aUZhY3RvckF1dGhQcmVzZW50JzogJ2ZhbHNlJ1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgU2lkOiAnRGVueVJvb3RBY2NvdW50VXNhZ2UnLFxuICAgICAgICAgICAgICBFZmZlY3Q6ICdEZW55JyxcbiAgICAgICAgICAgICAgQWN0aW9uOiAnKicsXG4gICAgICAgICAgICAgIFJlc291cmNlOiAnKicsXG4gICAgICAgICAgICAgIENvbmRpdGlvbjoge1xuICAgICAgICAgICAgICAgIFN0cmluZ0VxdWFsczoge1xuICAgICAgICAgICAgICAgICAgJ2F3czp1c2VyaWQnOiAncm9vdCdcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICBdXG4gICAgICAgIH0pLFxuICAgICAgICB0YWdzLFxuICAgICAgfSxcbiAgICAgIHsgcGFyZW50OiB0aGlzIH1cbiAgICApO1xuXG4gICAgLy8gQ29uZGl0aW9uYWwgRUMyIGluc3RhbmNlIGxpZmVjeWNsZSBwb2xpY3lcbiAgICB0aGlzLmVjMkxpZmVjeWNsZVBvbGljeSA9IG5ldyBhd3MuaWFtLlBvbGljeShcbiAgICAgIGAke25hbWV9LWVjMi1saWZlY3ljbGVgLFxuICAgICAge1xuICAgICAgICBuYW1lOiBgRUMyTGlmZWN5Y2xlUG9saWN5LSR7ZW52aXJvbm1lbnRTdWZmaXh9YCxcbiAgICAgICAgZGVzY3JpcHRpb246XG4gICAgICAgICAgJ0NvbmRpdGlvbmFsIHJlc3RyaWN0aW9ucyBmb3IgRUMyIGluc3RhbmNlIGxpZmVjeWNsZSBvcGVyYXRpb25zJyxcbiAgICAgICAgcG9saWN5OiBKU09OLnN0cmluZ2lmeSh7XG4gICAgICAgICAgVmVyc2lvbjogJzIwMTItMTAtMTcnLFxuICAgICAgICAgIFN0YXRlbWVudDogW1xuICAgICAgICAgICAge1xuICAgICAgICAgICAgICBTaWQ6ICdEZW55UHJvZHVjdGlvbkluc3RhbmNlVGVybWluYXRpb24nLFxuICAgICAgICAgICAgICBFZmZlY3Q6ICdEZW55JyxcbiAgICAgICAgICAgICAgQWN0aW9uOiAnZWMyOlRlcm1pbmF0ZUluc3RhbmNlcycsXG4gICAgICAgICAgICAgIFJlc291cmNlOiAnKicsXG4gICAgICAgICAgICAgIENvbmRpdGlvbjoge1xuICAgICAgICAgICAgICAgIFN0cmluZ0xpa2U6IHtcbiAgICAgICAgICAgICAgICAgICdlYzI6UmVzb3VyY2VUYWcvRW52aXJvbm1lbnQnOiAncHJvZConXG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAge1xuICAgICAgICAgICAgICBTaWQ6ICdBbGxvd05vblByb2R1Y3Rpb25PcGVyYXRpb25zJyxcbiAgICAgICAgICAgICAgRWZmZWN0OiAnQWxsb3cnLFxuICAgICAgICAgICAgICBBY3Rpb246IFtcbiAgICAgICAgICAgICAgICAnZWMyOlN0b3BJbnN0YW5jZXMnLFxuICAgICAgICAgICAgICAgICdlYzI6U3RhcnRJbnN0YW5jZXMnXG4gICAgICAgICAgICAgIF0sXG4gICAgICAgICAgICAgIFJlc291cmNlOiAnKidcbiAgICAgICAgICAgIH1cbiAgICAgICAgICBdXG4gICAgICAgIH0pLFxuICAgICAgICB0YWdzLFxuICAgICAgfSxcbiAgICAgIHsgcGFyZW50OiB0aGlzIH1cbiAgICApO1xuXG4gICAgLy8gUzMgc2VjdXJpdHkgZW5mb3JjZW1lbnQgcG9saWN5XG4gICAgdGhpcy5zM0RlbnlJbnNlY3VyZVBvbGljeSA9IG5ldyBhd3MuaWFtLlBvbGljeShcbiAgICAgIGAke25hbWV9LXMzLXNlY3VyaXR5YCxcbiAgICAgIHtcbiAgICAgICAgbmFtZTogYFMzU2VjdXJpdHlQb2xpY3ktJHtlbnZpcm9ubWVudFN1ZmZpeH1gLFxuICAgICAgICBkZXNjcmlwdGlvbjogJ0VuZm9yY2VzIHNlY3VyZSBTMyBvcGVyYXRpb25zIG9ubHknLFxuICAgICAgICBwb2xpY3k6IEpTT04uc3RyaW5naWZ5KHtcbiAgICAgICAgICBWZXJzaW9uOiAnMjAxMi0xMC0xNycsXG4gICAgICAgICAgU3RhdGVtZW50OiBbXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgIFNpZDogJ0RlbnlJbnNlY3VyZVRyYW5zcG9ydCcsXG4gICAgICAgICAgICAgIEVmZmVjdDogJ0RlbnknLFxuICAgICAgICAgICAgICBBY3Rpb246ICdzMzoqJyxcbiAgICAgICAgICAgICAgUmVzb3VyY2U6IFsnYXJuOmF3czpzMzo6OionLCAnYXJuOmF3czpzMzo6OiovKiddLFxuICAgICAgICAgICAgICBDb25kaXRpb246IHtcbiAgICAgICAgICAgICAgICBCb29sOiB7XG4gICAgICAgICAgICAgICAgICAnYXdzOlNlY3VyZVRyYW5zcG9ydCc6ICdmYWxzZSdcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgIFNpZDogJ0RlbnlVbmVuY3J5cHRlZFVwbG9hZHMnLFxuICAgICAgICAgICAgICBFZmZlY3Q6ICdEZW55JyxcbiAgICAgICAgICAgICAgQWN0aW9uOiAnczM6UHV0T2JqZWN0JyxcbiAgICAgICAgICAgICAgUmVzb3VyY2U6ICdhcm46YXdzOnMzOjo6Ki8qJyxcbiAgICAgICAgICAgICAgQ29uZGl0aW9uOiB7XG4gICAgICAgICAgICAgICAgU3RyaW5nTm90RXF1YWxzOiB7XG4gICAgICAgICAgICAgICAgICAnczM6eC1hbXotc2VydmVyLXNpZGUtZW5jcnlwdGlvbic6ICdhd3M6a21zJ1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgIF1cbiAgICAgICAgfSksXG4gICAgICAgIHRhZ3MsXG4gICAgICB9LFxuICAgICAgeyBwYXJlbnQ6IHRoaXMgfVxuICAgICk7XG5cbiAgICAvLyBDbG91ZFRyYWlsIHByb3RlY3Rpb24gcG9saWN5XG4gICAgdGhpcy5jbG91ZFRyYWlsUHJvdGVjdGlvblBvbGljeSA9IG5ldyBhd3MuaWFtLlBvbGljeShcbiAgICAgIGAke25hbWV9LWNsb3VkdHJhaWwtcHJvdGVjdGlvbmAsXG4gICAgICB7XG4gICAgICAgIG5hbWU6IGBDbG91ZFRyYWlsUHJvdGVjdGlvblBvbGljeS0ke2Vudmlyb25tZW50U3VmZml4fWAsXG4gICAgICAgIGRlc2NyaXB0aW9uOiAnUHJvdGVjdHMgQ2xvdWRUcmFpbCBmcm9tIHVuYXV0aG9yaXplZCBtb2RpZmljYXRpb25zJyxcbiAgICAgICAgcG9saWN5OiBKU09OLnN0cmluZ2lmeSh7XG4gICAgICAgICAgVmVyc2lvbjogJzIwMTItMTAtMTcnLFxuICAgICAgICAgIFN0YXRlbWVudDogW1xuICAgICAgICAgICAge1xuICAgICAgICAgICAgICBTaWQ6ICdEZW55Q2xvdWRUcmFpbERpc2FibGluZycsXG4gICAgICAgICAgICAgIEVmZmVjdDogJ0RlbnknLFxuICAgICAgICAgICAgICBBY3Rpb246IFtcbiAgICAgICAgICAgICAgICAnY2xvdWR0cmFpbDpTdG9wTG9nZ2luZycsXG4gICAgICAgICAgICAgICAgJ2Nsb3VkdHJhaWw6RGVsZXRlVHJhaWwnXG4gICAgICAgICAgICAgIF0sXG4gICAgICAgICAgICAgIFJlc291cmNlOiAnKidcbiAgICAgICAgICAgIH1cbiAgICAgICAgICBdXG4gICAgICAgIH0pLFxuICAgICAgICB0YWdzLFxuICAgICAgfSxcbiAgICAgIHsgcGFyZW50OiB0aGlzIH1cbiAgICApO1xuXG4gICAgLy8gS01TIGtleSBwcm90ZWN0aW9uIHBvbGljeVxuICAgIHRoaXMua21zS2V5UHJvdGVjdGlvblBvbGljeSA9IG5ldyBhd3MuaWFtLlBvbGljeShcbiAgICAgIGAke25hbWV9LWttcy1wcm90ZWN0aW9uYCxcbiAgICAgIHtcbiAgICAgICAgbmFtZTogYEtNU0tleVByb3RlY3Rpb25Qb2xpY3ktJHtlbnZpcm9ubWVudFN1ZmZpeH1gLFxuICAgICAgICBkZXNjcmlwdGlvbjogJ1Byb3RlY3RzIEtNUyBrZXlzIGZyb20gdW5hdXRob3JpemVkIGFjY2VzcyBhbmQgZGVsZXRpb24nLFxuICAgICAgICBwb2xpY3k6IEpTT04uc3RyaW5naWZ5KHtcbiAgICAgICAgICBWZXJzaW9uOiAnMjAxMi0xMC0xNycsXG4gICAgICAgICAgU3RhdGVtZW50OiBbXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgIFNpZDogJ0RlbnlLTVNLZXlEZWxldGlvbicsXG4gICAgICAgICAgICAgIEVmZmVjdDogJ0RlbnknLFxuICAgICAgICAgICAgICBBY3Rpb246IFtcbiAgICAgICAgICAgICAgICAna21zOlNjaGVkdWxlS2V5RGVsZXRpb24nLFxuICAgICAgICAgICAgICAgICdrbXM6RGlzYWJsZUtleSdcbiAgICAgICAgICAgICAgXSxcbiAgICAgICAgICAgICAgUmVzb3VyY2U6ICcqJ1xuICAgICAgICAgICAgfVxuICAgICAgICAgIF1cbiAgICAgICAgfSksXG4gICAgICAgIHRhZ3MsXG4gICAgICB9LFxuICAgICAgeyBwYXJlbnQ6IHRoaXMgfVxuICAgICk7XG5cbiAgICB0aGlzLnJlZ2lzdGVyT3V0cHV0cyh7XG4gICAgICBtZmFFbmZvcmNlbWVudFBvbGljeUFybjogdGhpcy5tZmFFbmZvcmNlbWVudFBvbGljeS5hcm4sXG4gICAgICBlYzJMaWZlY3ljbGVQb2xpY3lBcm46IHRoaXMuZWMyTGlmZWN5Y2xlUG9saWN5LmFybixcbiAgICAgIHMzRGVueUluc2VjdXJlUG9saWN5QXJuOiB0aGlzLnMzRGVueUluc2VjdXJlUG9saWN5LmFybixcbiAgICAgIGNsb3VkVHJhaWxQcm90ZWN0aW9uUG9saWN5QXJuOiB0aGlzLmNsb3VkVHJhaWxQcm90ZWN0aW9uUG9saWN5LmFybixcbiAgICAgIGttc0tleVByb3RlY3Rpb25Qb2xpY3lBcm46IHRoaXMua21zS2V5UHJvdGVjdGlvblBvbGljeS5hcm4sXG4gICAgfSk7XG4gIH1cbn1cblxuLy8gRW5oYW5jZWQgbGVhc3QgcHJpdmlsZWdlIFMzIHBvbGljeSB3aXRoIHRpbWUtYmFzZWQgYWNjZXNzXG5leHBvcnQgZnVuY3Rpb24gY3JlYXRlVGltZUJhc2VkUzNBY2Nlc3NQb2xpY3koXG4gIGJ1Y2tldEFybjogcHVsdW1pLklucHV0PHN0cmluZz4sXG4gIGFsbG93ZWRIb3Vyczogc3RyaW5nW10gPSBbXG4gICAgJzA5JyxcbiAgICAnMTAnLFxuICAgICcxMScsXG4gICAgJzEyJyxcbiAgICAnMTMnLFxuICAgICcxNCcsXG4gICAgJzE1JyxcbiAgICAnMTYnLFxuICAgICcxNycsXG4gIF1cbik6IHB1bHVtaS5PdXRwdXQ8c3RyaW5nPiB7XG4gIHJldHVybiBwdWx1bWkuaW50ZXJwb2xhdGVge1xuICAgIFwiVmVyc2lvblwiOiBcIjIwMTItMTAtMTdcIixcbiAgICBcIlN0YXRlbWVudFwiOiBbXG4gICAgICB7XG4gICAgICAgIFwiRWZmZWN0XCI6IFwiQWxsb3dcIixcbiAgICAgICAgXCJBY3Rpb25cIjogW1xuICAgICAgICAgIFwiczM6R2V0T2JqZWN0XCJcbiAgICAgICAgXSxcbiAgICAgICAgXCJSZXNvdXJjZVwiOiBcIiR7YnVja2V0QXJufS8qXCIsXG4gICAgICAgIFwiQ29uZGl0aW9uXCI6IHtcbiAgICAgICAgICBcIkRhdGVHcmVhdGVyVGhhblwiOiB7XG4gICAgICAgICAgICBcImF3czpUb2tlbklzc3VlVGltZVwiOiBcIjIwMjQtMDEtMDFUMDA6MDA6MDBaXCJcbiAgICAgICAgICB9LFxuICAgICAgICAgIFwiU3RyaW5nTGlrZVwiOiB7XG4gICAgICAgICAgICBcImF3czpSZXF1ZXN0ZWRSZWdpb25cIjogXCJ1cy1lYXN0LTFcIlxuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfSxcbiAgICAgIHtcbiAgICAgICAgXCJFZmZlY3RcIjogXCJBbGxvd1wiLFxuICAgICAgICBcIkFjdGlvblwiOiBbXG4gICAgICAgICAgXCJzMzpQdXRPYmplY3RcIlxuICAgICAgICBdLFxuICAgICAgICBcIlJlc291cmNlXCI6IFwiJHtidWNrZXRBcm59LypcIixcbiAgICAgICAgXCJDb25kaXRpb25cIjoge1xuICAgICAgICAgIFwiU3RyaW5nRXF1YWxzXCI6IHtcbiAgICAgICAgICAgIFwiczM6eC1hbXotc2VydmVyLXNpZGUtZW5jcnlwdGlvblwiOiBcImF3czprbXNcIlxuICAgICAgICAgIH0sXG4gICAgICAgICAgXCJTdHJpbmdMaWtlXCI6IHtcbiAgICAgICAgICAgIFwiYXdzOlJlcXVlc3RlZFJlZ2lvblwiOiBcInVzLWVhc3QtMVwiXG4gICAgICAgICAgfSxcbiAgICAgICAgICBcIkZvckFsbFZhbHVlczpTdHJpbmdFcXVhbHNcIjoge1xuICAgICAgICAgICAgXCJhd3M6UmVxdWVzdGVkSG91clwiOiAke0pTT04uc3RyaW5naWZ5KGFsbG93ZWRIb3Vycyl9XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9LFxuICAgICAge1xuICAgICAgICBcIkVmZmVjdFwiOiBcIkFsbG93XCIsXG4gICAgICAgIFwiQWN0aW9uXCI6IFtcbiAgICAgICAgICBcInMzOkxpc3RCdWNrZXRcIlxuICAgICAgICBdLFxuICAgICAgICBcIlJlc291cmNlXCI6IFwiJHtidWNrZXRBcm59XCIsXG4gICAgICAgIFwiQ29uZGl0aW9uXCI6IHtcbiAgICAgICAgICBcIlN0cmluZ0xpa2VcIjoge1xuICAgICAgICAgICAgXCJhd3M6UmVxdWVzdGVkUmVnaW9uXCI6IFwidXMtZWFzdC0xXCJcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH0sXG4gICAgICB7XG4gICAgICAgIFwiRWZmZWN0XCI6IFwiRGVueVwiLFxuICAgICAgICBcIkFjdGlvblwiOiBbXG4gICAgICAgICAgXCJzMzpEZWxldGVPYmplY3RcIixcbiAgICAgICAgICBcInMzOkRlbGV0ZU9iamVjdFZlcnNpb25cIlxuICAgICAgICBdLFxuICAgICAgICBcIlJlc291cmNlXCI6IFwiJHtidWNrZXRBcm59LypcIlxuICAgICAgfVxuICAgIF1cbiAgfWA7XG59XG5cbi8vIFJlYWQtb25seSBhdWRpdCBhY2Nlc3MgcG9saWN5IHdpdGggSVAgcmVzdHJpY3Rpb25zXG5leHBvcnQgZnVuY3Rpb24gY3JlYXRlUmVzdHJpY3RlZEF1ZGl0UG9saWN5KFxuICBhdWRpdEJ1Y2tldEFybjogcHVsdW1pLklucHV0PHN0cmluZz4sXG4gIGFsbG93ZWRJcFJhbmdlczogc3RyaW5nW10gPSBbJzIwMy4wLjExMy4wLzI0J11cbik6IHB1bHVtaS5PdXRwdXQ8c3RyaW5nPiB7XG4gIHJldHVybiBwdWx1bWkuaW50ZXJwb2xhdGVge1xuICAgIFwiVmVyc2lvblwiOiBcIjIwMTItMTAtMTdcIixcbiAgICBcIlN0YXRlbWVudFwiOiBbXG4gICAgICB7XG4gICAgICAgIFwiRWZmZWN0XCI6IFwiQWxsb3dcIixcbiAgICAgICAgXCJBY3Rpb25cIjogW1xuICAgICAgICAgIFwiczM6R2V0T2JqZWN0XCIsXG4gICAgICAgICAgXCJzMzpMaXN0QnVja2V0XCJcbiAgICAgICAgXSxcbiAgICAgICAgXCJSZXNvdXJjZVwiOiBbXG4gICAgICAgICAgXCIke2F1ZGl0QnVja2V0QXJufVwiLFxuICAgICAgICAgIFwiJHthdWRpdEJ1Y2tldEFybn0vKlwiXG4gICAgICAgIF0sXG4gICAgICAgIFwiQ29uZGl0aW9uXCI6IHtcbiAgICAgICAgICBcIklwQWRkcmVzc1wiOiB7XG4gICAgICAgICAgICBcImF3czpTb3VyY2VJcFwiOiAke0pTT04uc3RyaW5naWZ5KGFsbG93ZWRJcFJhbmdlcyl9XG4gICAgICAgICAgfSxcbiAgICAgICAgICBcIlN0cmluZ0xpa2VcIjoge1xuICAgICAgICAgICAgXCJhd3M6UmVxdWVzdGVkUmVnaW9uXCI6IFwidXMtZWFzdC0xXCJcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH0sXG4gICAgICB7XG4gICAgICAgIFwiRWZmZWN0XCI6IFwiQWxsb3dcIixcbiAgICAgICAgXCJBY3Rpb25cIjogW1xuICAgICAgICAgIFwiY2xvdWR0cmFpbDpMb29rdXBFdmVudHNcIlxuICAgICAgICBdLFxuICAgICAgICBcIlJlc291cmNlXCI6IFwiKlwiLFxuICAgICAgICBcIkNvbmRpdGlvblwiOiB7XG4gICAgICAgICAgXCJJcEFkZHJlc3NcIjoge1xuICAgICAgICAgICAgXCJhd3M6U291cmNlSXBcIjogJHtKU09OLnN0cmluZ2lmeShhbGxvd2VkSXBSYW5nZXMpfVxuICAgICAgICAgIH0sXG4gICAgICAgICAgXCJTdHJpbmdMaWtlXCI6IHtcbiAgICAgICAgICAgIFwiYXdzOlJlcXVlc3RlZFJlZ2lvblwiOiBcInVzLWVhc3QtMVwiXG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9LFxuICAgICAge1xuICAgICAgICBcIkVmZmVjdFwiOiBcIkRlbnlcIixcbiAgICAgICAgXCJOb3RBY3Rpb25cIjogW1xuICAgICAgICAgIFwiczM6R2V0T2JqZWN0XCIsXG4gICAgICAgICAgXCJzMzpMaXN0QnVja2V0XCIsXG4gICAgICAgICAgXCJjbG91ZHRyYWlsOkxvb2t1cEV2ZW50c1wiLFxuICAgICAgICAgIFwiY2xvdWR0cmFpbDpHZXRUcmFpbFN0YXR1c1wiXG4gICAgICAgIF0sXG4gICAgICAgIFwiUmVzb3VyY2VcIjogXCIqXCJcbiAgICAgIH1cbiAgICBdXG4gIH1gO1xufVxuIl19