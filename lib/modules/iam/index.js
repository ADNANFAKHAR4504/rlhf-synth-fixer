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
exports.SecureIAMRole = void 0;
exports.createMFAEnforcedPolicy = createMFAEnforcedPolicy;
exports.createS3AccessPolicy = createS3AccessPolicy;
const aws = __importStar(require("@pulumi/aws"));
const pulumi = __importStar(require("@pulumi/pulumi"));
const tags_1 = require("../../config/tags");
class SecureIAMRole extends pulumi.ComponentResource {
    role;
    policies;
    constructor(name, args, opts) {
        super('custom:security:SecureIAMRole', name, {}, opts);
        // Create IAM role
        this.role = new aws.iam.Role(`${name}-role`, {
            name: args.roleName,
            assumeRolePolicy: args.assumeRolePolicy,
            tags: { ...tags_1.commonTags, ...args.tags },
        }, { parent: this });
        // Attach managed policies
        if (args.managedPolicyArns) {
            args.managedPolicyArns.forEach((policyArn, index) => {
                new aws.iam.RolePolicyAttachment(`${name}-managed-policy-${index}`, {
                    role: this.role.name,
                    policyArn: policyArn,
                }, { parent: this });
            });
        }
        // Attach inline policies
        this.policies = [];
        if (args.policies) {
            args.policies.forEach((policy, index) => {
                const rolePolicy = new aws.iam.RolePolicy(`${name}-policy-${index}`, {
                    role: this.role.id,
                    policy: policy,
                }, { parent: this });
                this.policies.push(rolePolicy);
            });
        }
        this.registerOutputs({
            roleArn: this.role.arn,
            roleName: this.role.name,
        });
    }
}
exports.SecureIAMRole = SecureIAMRole;
// MFA-enforced policy for sensitive operations
function createMFAEnforcedPolicy() {
    return JSON.stringify({
        Version: '2012-10-17',
        Statement: [
            {
                Sid: 'AllowViewAccountInfo',
                Effect: 'Allow',
                Action: [
                    'iam:GetAccountPasswordPolicy',
                    'iam:ListVirtualMFADevices',
                    'iam:GetAccountSummary',
                ],
                Resource: '*',
            },
            {
                Sid: 'AllowManageOwnPasswords',
                Effect: 'Allow',
                Action: ['iam:ChangePassword', 'iam:GetUser'],
                Resource: 'arn:aws:iam::*:user/${aws:username}',
            },
            {
                Sid: 'AllowManageOwnMFA',
                Effect: 'Allow',
                Action: [
                    'iam:CreateVirtualMFADevice',
                    'iam:DeleteVirtualMFADevice',
                    'iam:EnableMFADevice',
                    'iam:ListMFADevices',
                    'iam:ResyncMFADevice',
                ],
                Resource: [
                    'arn:aws:iam::*:mfa/${aws:username}',
                    'arn:aws:iam::*:user/${aws:username}',
                ],
            },
            {
                Sid: 'DenyAllExceptListedIfNoMFA',
                Effect: 'Deny',
                NotAction: [
                    'iam:CreateVirtualMFADevice',
                    'iam:EnableMFADevice',
                    'iam:GetUser',
                    'iam:ListMFADevices',
                    'iam:ListVirtualMFADevices',
                    'iam:ResyncMFADevice',
                    'sts:GetSessionToken',
                ],
                Resource: '*',
                Condition: {
                    BoolIfExists: {
                        'aws:MultiFactorAuthPresent': 'false',
                    },
                },
            },
        ],
    });
}
// S3 access policy with least privilege
function createS3AccessPolicy(bucketArn) {
    return pulumi.interpolate `{
    "Version": "2012-10-17",
    "Statement": [
      {
        "Effect": "Allow",
        "Action": [
          "s3:GetObject",
          "s3:PutObject",
          "s3:DeleteObject"
        ],
        "Resource": "${bucketArn}/*"
      },
      {
        "Effect": "Allow",
        "Action": [
          "s3:ListBucket"
        ],
        "Resource": "${bucketArn}"
      }
    ]
  }`;
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJpbmRleC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUF5RUEsMERBd0RDO0FBR0Qsb0RBd0JDO0FBNUpELGlEQUFtQztBQUNuQyx1REFBeUM7QUFDekMsNENBQStDO0FBVy9DLE1BQWEsYUFBYyxTQUFRLE1BQU0sQ0FBQyxpQkFBaUI7SUFDekMsSUFBSSxDQUFlO0lBQ25CLFFBQVEsQ0FBdUI7SUFFL0MsWUFDRSxJQUFZLEVBQ1osSUFBdUIsRUFDdkIsSUFBc0M7UUFFdEMsS0FBSyxDQUFDLCtCQUErQixFQUFFLElBQUksRUFBRSxFQUFFLEVBQUUsSUFBSSxDQUFDLENBQUM7UUFFdkQsa0JBQWtCO1FBQ2xCLElBQUksQ0FBQyxJQUFJLEdBQUcsSUFBSSxHQUFHLENBQUMsR0FBRyxDQUFDLElBQUksQ0FDMUIsR0FBRyxJQUFJLE9BQU8sRUFDZDtZQUNFLElBQUksRUFBRSxJQUFJLENBQUMsUUFBUTtZQUNuQixnQkFBZ0IsRUFBRSxJQUFJLENBQUMsZ0JBQWdCO1lBQ3ZDLElBQUksRUFBRSxFQUFFLEdBQUcsaUJBQVUsRUFBRSxHQUFHLElBQUksQ0FBQyxJQUFJLEVBQUU7U0FDdEMsRUFDRCxFQUFFLE1BQU0sRUFBRSxJQUFJLEVBQUUsQ0FDakIsQ0FBQztRQUVGLDBCQUEwQjtRQUMxQixJQUFJLElBQUksQ0FBQyxpQkFBaUIsRUFBRSxDQUFDO1lBQzNCLElBQUksQ0FBQyxpQkFBaUIsQ0FBQyxPQUFPLENBQUMsQ0FBQyxTQUFTLEVBQUUsS0FBSyxFQUFFLEVBQUU7Z0JBQ2xELElBQUksR0FBRyxDQUFDLEdBQUcsQ0FBQyxvQkFBb0IsQ0FDOUIsR0FBRyxJQUFJLG1CQUFtQixLQUFLLEVBQUUsRUFDakM7b0JBQ0UsSUFBSSxFQUFFLElBQUksQ0FBQyxJQUFJLENBQUMsSUFBSTtvQkFDcEIsU0FBUyxFQUFFLFNBQVM7aUJBQ3JCLEVBQ0QsRUFBRSxNQUFNLEVBQUUsSUFBSSxFQUFFLENBQ2pCLENBQUM7WUFDSixDQUFDLENBQUMsQ0FBQztRQUNMLENBQUM7UUFFRCx5QkFBeUI7UUFDekIsSUFBSSxDQUFDLFFBQVEsR0FBRyxFQUFFLENBQUM7UUFDbkIsSUFBSSxJQUFJLENBQUMsUUFBUSxFQUFFLENBQUM7WUFDbEIsSUFBSSxDQUFDLFFBQVEsQ0FBQyxPQUFPLENBQUMsQ0FBQyxNQUFNLEVBQUUsS0FBSyxFQUFFLEVBQUU7Z0JBQ3RDLE1BQU0sVUFBVSxHQUFHLElBQUksR0FBRyxDQUFDLEdBQUcsQ0FBQyxVQUFVLENBQ3ZDLEdBQUcsSUFBSSxXQUFXLEtBQUssRUFBRSxFQUN6QjtvQkFDRSxJQUFJLEVBQUUsSUFBSSxDQUFDLElBQUksQ0FBQyxFQUFFO29CQUNsQixNQUFNLEVBQUUsTUFBTTtpQkFDZixFQUNELEVBQUUsTUFBTSxFQUFFLElBQUksRUFBRSxDQUNqQixDQUFDO2dCQUNGLElBQUksQ0FBQyxRQUFRLENBQUMsSUFBSSxDQUFDLFVBQVUsQ0FBQyxDQUFDO1lBQ2pDLENBQUMsQ0FBQyxDQUFDO1FBQ0wsQ0FBQztRQUVELElBQUksQ0FBQyxlQUFlLENBQUM7WUFDbkIsT0FBTyxFQUFFLElBQUksQ0FBQyxJQUFJLENBQUMsR0FBRztZQUN0QixRQUFRLEVBQUUsSUFBSSxDQUFDLElBQUksQ0FBQyxJQUFJO1NBQ3pCLENBQUMsQ0FBQztJQUNMLENBQUM7Q0FDRjtBQXpERCxzQ0F5REM7QUFFRCwrQ0FBK0M7QUFDL0MsU0FBZ0IsdUJBQXVCO0lBQ3JDLE9BQU8sSUFBSSxDQUFDLFNBQVMsQ0FBQztRQUNwQixPQUFPLEVBQUUsWUFBWTtRQUNyQixTQUFTLEVBQUU7WUFDVDtnQkFDRSxHQUFHLEVBQUUsc0JBQXNCO2dCQUMzQixNQUFNLEVBQUUsT0FBTztnQkFDZixNQUFNLEVBQUU7b0JBQ04sOEJBQThCO29CQUM5QiwyQkFBMkI7b0JBQzNCLHVCQUF1QjtpQkFDeEI7Z0JBQ0QsUUFBUSxFQUFFLEdBQUc7YUFDZDtZQUNEO2dCQUNFLEdBQUcsRUFBRSx5QkFBeUI7Z0JBQzlCLE1BQU0sRUFBRSxPQUFPO2dCQUNmLE1BQU0sRUFBRSxDQUFDLG9CQUFvQixFQUFFLGFBQWEsQ0FBQztnQkFDN0MsUUFBUSxFQUFFLHFDQUFxQzthQUNoRDtZQUNEO2dCQUNFLEdBQUcsRUFBRSxtQkFBbUI7Z0JBQ3hCLE1BQU0sRUFBRSxPQUFPO2dCQUNmLE1BQU0sRUFBRTtvQkFDTiw0QkFBNEI7b0JBQzVCLDRCQUE0QjtvQkFDNUIscUJBQXFCO29CQUNyQixvQkFBb0I7b0JBQ3BCLHFCQUFxQjtpQkFDdEI7Z0JBQ0QsUUFBUSxFQUFFO29CQUNSLG9DQUFvQztvQkFDcEMscUNBQXFDO2lCQUN0QzthQUNGO1lBQ0Q7Z0JBQ0UsR0FBRyxFQUFFLDRCQUE0QjtnQkFDakMsTUFBTSxFQUFFLE1BQU07Z0JBQ2QsU0FBUyxFQUFFO29CQUNULDRCQUE0QjtvQkFDNUIscUJBQXFCO29CQUNyQixhQUFhO29CQUNiLG9CQUFvQjtvQkFDcEIsMkJBQTJCO29CQUMzQixxQkFBcUI7b0JBQ3JCLHFCQUFxQjtpQkFDdEI7Z0JBQ0QsUUFBUSxFQUFFLEdBQUc7Z0JBQ2IsU0FBUyxFQUFFO29CQUNULFlBQVksRUFBRTt3QkFDWiw0QkFBNEIsRUFBRSxPQUFPO3FCQUN0QztpQkFDRjthQUNGO1NBQ0Y7S0FDRixDQUFDLENBQUM7QUFDTCxDQUFDO0FBRUQsd0NBQXdDO0FBQ3hDLFNBQWdCLG9CQUFvQixDQUNsQyxTQUErQjtJQUUvQixPQUFPLE1BQU0sQ0FBQyxXQUFXLENBQUE7Ozs7Ozs7Ozs7dUJBVUosU0FBUzs7Ozs7Ozt1QkFPVCxTQUFTOzs7SUFHNUIsQ0FBQztBQUNMLENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgKiBhcyBhd3MgZnJvbSAnQHB1bHVtaS9hd3MnO1xuaW1wb3J0ICogYXMgcHVsdW1pIGZyb20gJ0BwdWx1bWkvcHVsdW1pJztcbmltcG9ydCB7IGNvbW1vblRhZ3MgfSBmcm9tICcuLi8uLi9jb25maWcvdGFncyc7XG5cbmV4cG9ydCBpbnRlcmZhY2UgU2VjdXJlSUFNUm9sZUFyZ3Mge1xuICByb2xlTmFtZT86IHN0cmluZztcbiAgYXNzdW1lUm9sZVBvbGljeTogcHVsdW1pLklucHV0PHN0cmluZz47XG4gIHBvbGljaWVzPzogcHVsdW1pLklucHV0PHN0cmluZz5bXTtcbiAgbWFuYWdlZFBvbGljeUFybnM/OiBzdHJpbmdbXTtcbiAgcmVxdWlyZU1GQT86IGJvb2xlYW47XG4gIHRhZ3M/OiBSZWNvcmQ8c3RyaW5nLCBzdHJpbmc+O1xufVxuXG5leHBvcnQgY2xhc3MgU2VjdXJlSUFNUm9sZSBleHRlbmRzIHB1bHVtaS5Db21wb25lbnRSZXNvdXJjZSB7XG4gIHB1YmxpYyByZWFkb25seSByb2xlOiBhd3MuaWFtLlJvbGU7XG4gIHB1YmxpYyByZWFkb25seSBwb2xpY2llczogYXdzLmlhbS5Sb2xlUG9saWN5W107XG5cbiAgY29uc3RydWN0b3IoXG4gICAgbmFtZTogc3RyaW5nLFxuICAgIGFyZ3M6IFNlY3VyZUlBTVJvbGVBcmdzLFxuICAgIG9wdHM/OiBwdWx1bWkuQ29tcG9uZW50UmVzb3VyY2VPcHRpb25zXG4gICkge1xuICAgIHN1cGVyKCdjdXN0b206c2VjdXJpdHk6U2VjdXJlSUFNUm9sZScsIG5hbWUsIHt9LCBvcHRzKTtcblxuICAgIC8vIENyZWF0ZSBJQU0gcm9sZVxuICAgIHRoaXMucm9sZSA9IG5ldyBhd3MuaWFtLlJvbGUoXG4gICAgICBgJHtuYW1lfS1yb2xlYCxcbiAgICAgIHtcbiAgICAgICAgbmFtZTogYXJncy5yb2xlTmFtZSxcbiAgICAgICAgYXNzdW1lUm9sZVBvbGljeTogYXJncy5hc3N1bWVSb2xlUG9saWN5LFxuICAgICAgICB0YWdzOiB7IC4uLmNvbW1vblRhZ3MsIC4uLmFyZ3MudGFncyB9LFxuICAgICAgfSxcbiAgICAgIHsgcGFyZW50OiB0aGlzIH1cbiAgICApO1xuXG4gICAgLy8gQXR0YWNoIG1hbmFnZWQgcG9saWNpZXNcbiAgICBpZiAoYXJncy5tYW5hZ2VkUG9saWN5QXJucykge1xuICAgICAgYXJncy5tYW5hZ2VkUG9saWN5QXJucy5mb3JFYWNoKChwb2xpY3lBcm4sIGluZGV4KSA9PiB7XG4gICAgICAgIG5ldyBhd3MuaWFtLlJvbGVQb2xpY3lBdHRhY2htZW50KFxuICAgICAgICAgIGAke25hbWV9LW1hbmFnZWQtcG9saWN5LSR7aW5kZXh9YCxcbiAgICAgICAgICB7XG4gICAgICAgICAgICByb2xlOiB0aGlzLnJvbGUubmFtZSxcbiAgICAgICAgICAgIHBvbGljeUFybjogcG9saWN5QXJuLFxuICAgICAgICAgIH0sXG4gICAgICAgICAgeyBwYXJlbnQ6IHRoaXMgfVxuICAgICAgICApO1xuICAgICAgfSk7XG4gICAgfVxuXG4gICAgLy8gQXR0YWNoIGlubGluZSBwb2xpY2llc1xuICAgIHRoaXMucG9saWNpZXMgPSBbXTtcbiAgICBpZiAoYXJncy5wb2xpY2llcykge1xuICAgICAgYXJncy5wb2xpY2llcy5mb3JFYWNoKChwb2xpY3ksIGluZGV4KSA9PiB7XG4gICAgICAgIGNvbnN0IHJvbGVQb2xpY3kgPSBuZXcgYXdzLmlhbS5Sb2xlUG9saWN5KFxuICAgICAgICAgIGAke25hbWV9LXBvbGljeS0ke2luZGV4fWAsXG4gICAgICAgICAge1xuICAgICAgICAgICAgcm9sZTogdGhpcy5yb2xlLmlkLFxuICAgICAgICAgICAgcG9saWN5OiBwb2xpY3ksXG4gICAgICAgICAgfSxcbiAgICAgICAgICB7IHBhcmVudDogdGhpcyB9XG4gICAgICAgICk7XG4gICAgICAgIHRoaXMucG9saWNpZXMucHVzaChyb2xlUG9saWN5KTtcbiAgICAgIH0pO1xuICAgIH1cblxuICAgIHRoaXMucmVnaXN0ZXJPdXRwdXRzKHtcbiAgICAgIHJvbGVBcm46IHRoaXMucm9sZS5hcm4sXG4gICAgICByb2xlTmFtZTogdGhpcy5yb2xlLm5hbWUsXG4gICAgfSk7XG4gIH1cbn1cblxuLy8gTUZBLWVuZm9yY2VkIHBvbGljeSBmb3Igc2Vuc2l0aXZlIG9wZXJhdGlvbnNcbmV4cG9ydCBmdW5jdGlvbiBjcmVhdGVNRkFFbmZvcmNlZFBvbGljeSgpOiBzdHJpbmcge1xuICByZXR1cm4gSlNPTi5zdHJpbmdpZnkoe1xuICAgIFZlcnNpb246ICcyMDEyLTEwLTE3JyxcbiAgICBTdGF0ZW1lbnQ6IFtcbiAgICAgIHtcbiAgICAgICAgU2lkOiAnQWxsb3dWaWV3QWNjb3VudEluZm8nLFxuICAgICAgICBFZmZlY3Q6ICdBbGxvdycsXG4gICAgICAgIEFjdGlvbjogW1xuICAgICAgICAgICdpYW06R2V0QWNjb3VudFBhc3N3b3JkUG9saWN5JyxcbiAgICAgICAgICAnaWFtOkxpc3RWaXJ0dWFsTUZBRGV2aWNlcycsXG4gICAgICAgICAgJ2lhbTpHZXRBY2NvdW50U3VtbWFyeScsXG4gICAgICAgIF0sXG4gICAgICAgIFJlc291cmNlOiAnKicsXG4gICAgICB9LFxuICAgICAge1xuICAgICAgICBTaWQ6ICdBbGxvd01hbmFnZU93blBhc3N3b3JkcycsXG4gICAgICAgIEVmZmVjdDogJ0FsbG93JyxcbiAgICAgICAgQWN0aW9uOiBbJ2lhbTpDaGFuZ2VQYXNzd29yZCcsICdpYW06R2V0VXNlciddLFxuICAgICAgICBSZXNvdXJjZTogJ2Fybjphd3M6aWFtOjoqOnVzZXIvJHthd3M6dXNlcm5hbWV9JyxcbiAgICAgIH0sXG4gICAgICB7XG4gICAgICAgIFNpZDogJ0FsbG93TWFuYWdlT3duTUZBJyxcbiAgICAgICAgRWZmZWN0OiAnQWxsb3cnLFxuICAgICAgICBBY3Rpb246IFtcbiAgICAgICAgICAnaWFtOkNyZWF0ZVZpcnR1YWxNRkFEZXZpY2UnLFxuICAgICAgICAgICdpYW06RGVsZXRlVmlydHVhbE1GQURldmljZScsXG4gICAgICAgICAgJ2lhbTpFbmFibGVNRkFEZXZpY2UnLFxuICAgICAgICAgICdpYW06TGlzdE1GQURldmljZXMnLFxuICAgICAgICAgICdpYW06UmVzeW5jTUZBRGV2aWNlJyxcbiAgICAgICAgXSxcbiAgICAgICAgUmVzb3VyY2U6IFtcbiAgICAgICAgICAnYXJuOmF3czppYW06Oio6bWZhLyR7YXdzOnVzZXJuYW1lfScsXG4gICAgICAgICAgJ2Fybjphd3M6aWFtOjoqOnVzZXIvJHthd3M6dXNlcm5hbWV9JyxcbiAgICAgICAgXSxcbiAgICAgIH0sXG4gICAgICB7XG4gICAgICAgIFNpZDogJ0RlbnlBbGxFeGNlcHRMaXN0ZWRJZk5vTUZBJyxcbiAgICAgICAgRWZmZWN0OiAnRGVueScsXG4gICAgICAgIE5vdEFjdGlvbjogW1xuICAgICAgICAgICdpYW06Q3JlYXRlVmlydHVhbE1GQURldmljZScsXG4gICAgICAgICAgJ2lhbTpFbmFibGVNRkFEZXZpY2UnLFxuICAgICAgICAgICdpYW06R2V0VXNlcicsXG4gICAgICAgICAgJ2lhbTpMaXN0TUZBRGV2aWNlcycsXG4gICAgICAgICAgJ2lhbTpMaXN0VmlydHVhbE1GQURldmljZXMnLFxuICAgICAgICAgICdpYW06UmVzeW5jTUZBRGV2aWNlJyxcbiAgICAgICAgICAnc3RzOkdldFNlc3Npb25Ub2tlbicsXG4gICAgICAgIF0sXG4gICAgICAgIFJlc291cmNlOiAnKicsXG4gICAgICAgIENvbmRpdGlvbjoge1xuICAgICAgICAgIEJvb2xJZkV4aXN0czoge1xuICAgICAgICAgICAgJ2F3czpNdWx0aUZhY3RvckF1dGhQcmVzZW50JzogJ2ZhbHNlJyxcbiAgICAgICAgICB9LFxuICAgICAgICB9LFxuICAgICAgfSxcbiAgICBdLFxuICB9KTtcbn1cblxuLy8gUzMgYWNjZXNzIHBvbGljeSB3aXRoIGxlYXN0IHByaXZpbGVnZVxuZXhwb3J0IGZ1bmN0aW9uIGNyZWF0ZVMzQWNjZXNzUG9saWN5KFxuICBidWNrZXRBcm46IHB1bHVtaS5JbnB1dDxzdHJpbmc+XG4pOiBwdWx1bWkuT3V0cHV0PHN0cmluZz4ge1xuICByZXR1cm4gcHVsdW1pLmludGVycG9sYXRlYHtcbiAgICBcIlZlcnNpb25cIjogXCIyMDEyLTEwLTE3XCIsXG4gICAgXCJTdGF0ZW1lbnRcIjogW1xuICAgICAge1xuICAgICAgICBcIkVmZmVjdFwiOiBcIkFsbG93XCIsXG4gICAgICAgIFwiQWN0aW9uXCI6IFtcbiAgICAgICAgICBcInMzOkdldE9iamVjdFwiLFxuICAgICAgICAgIFwiczM6UHV0T2JqZWN0XCIsXG4gICAgICAgICAgXCJzMzpEZWxldGVPYmplY3RcIlxuICAgICAgICBdLFxuICAgICAgICBcIlJlc291cmNlXCI6IFwiJHtidWNrZXRBcm59LypcIlxuICAgICAgfSxcbiAgICAgIHtcbiAgICAgICAgXCJFZmZlY3RcIjogXCJBbGxvd1wiLFxuICAgICAgICBcIkFjdGlvblwiOiBbXG4gICAgICAgICAgXCJzMzpMaXN0QnVja2V0XCJcbiAgICAgICAgXSxcbiAgICAgICAgXCJSZXNvdXJjZVwiOiBcIiR7YnVja2V0QXJufVwiXG4gICAgICB9XG4gICAgXVxuICB9YDtcbn1cbiJdfQ==