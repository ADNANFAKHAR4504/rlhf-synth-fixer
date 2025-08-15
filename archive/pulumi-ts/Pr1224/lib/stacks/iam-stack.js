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
exports.IamStack = void 0;
/**
 * iam-stack.ts
 *
 * This module defines the IAM stack for creating roles and policies
 * following the principle of least privilege.
 */
const aws = __importStar(require("@pulumi/aws"));
const pulumi = __importStar(require("@pulumi/pulumi"));
class IamStack extends pulumi.ComponentResource {
    ec2RoleArn;
    ec2RoleName;
    ec2InstanceProfileName;
    constructor(name, args, opts) {
        super('tap:iam:IamStack', name, args, opts);
        const environmentSuffix = args.environmentSuffix || 'dev';
        const tags = args.tags || {};
        // EC2 IAM Role
        const ec2Role = new aws.iam.Role(`tap-ec2-role-${environmentSuffix}`, {
            name: `tap-ec2-role-${environmentSuffix}`,
            assumeRolePolicy: JSON.stringify({
                Version: '2012-10-17',
                Statement: [
                    {
                        Effect: 'Allow',
                        Principal: {
                            Service: 'ec2.amazonaws.com',
                        },
                        Action: 'sts:AssumeRole',
                    },
                ],
            }),
            tags: {
                Name: `tap-ec2-role-${environmentSuffix}`,
                Purpose: 'EC2InstanceExecution',
                ...tags,
            },
        }, { parent: this });
        // Get current AWS account ID and region for more specific IAM policies
        const currentRegion = aws.getRegion();
        const currentIdentity = aws.getCallerIdentity();
        // EC2 logging policy - FIXED: Restricted to specific log groups with account and region
        new aws.iam.RolePolicy(`tap-ec2-logging-policy-${environmentSuffix}`, {
            role: ec2Role.id,
            policy: pulumi
                .all([currentRegion, currentIdentity])
                .apply(([region, identity]) => JSON.stringify({
                Version: '2012-10-17',
                Statement: [
                    {
                        Effect: 'Allow',
                        Action: [
                            'logs:CreateLogGroup',
                            'logs:CreateLogStream',
                            'logs:PutLogEvents',
                            'logs:DescribeLogStreams',
                        ],
                        Resource: `arn:aws:logs:${region.name}:${identity.accountId}:log-group:/aws/ec2/tap/*`,
                    },
                ],
            })),
        }, { parent: this });
        // Attach CloudWatch agent policy
        new aws.iam.RolePolicyAttachment(`tap-ec2-cloudwatch-policy-${environmentSuffix}`, {
            role: ec2Role.name,
            policyArn: 'arn:aws:iam::aws:policy/CloudWatchAgentServerPolicy',
        }, { parent: this });
        // Create instance profile
        const instanceProfile = new aws.iam.InstanceProfile(`tap-ec2-profile-${environmentSuffix}`, {
            name: `tap-ec2-profile-${environmentSuffix}`,
            role: ec2Role.name,
            tags: {
                Name: `tap-ec2-profile-${environmentSuffix}`,
                ...tags,
            },
        }, { parent: this });
        this.ec2RoleArn = ec2Role.arn;
        this.ec2RoleName = ec2Role.name;
        this.ec2InstanceProfileName = instanceProfile.name;
        this.registerOutputs({
            ec2RoleArn: this.ec2RoleArn,
            ec2RoleName: this.ec2RoleName,
            ec2InstanceProfileName: this.ec2InstanceProfileName,
        });
    }
}
exports.IamStack = IamStack;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaWFtLXN0YWNrLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiaWFtLXN0YWNrLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQUFBOzs7OztHQUtHO0FBQ0gsaURBQW1DO0FBQ25DLHVEQUF5QztBQVF6QyxNQUFhLFFBQVMsU0FBUSxNQUFNLENBQUMsaUJBQWlCO0lBQ3BDLFVBQVUsQ0FBd0I7SUFDbEMsV0FBVyxDQUF3QjtJQUNuQyxzQkFBc0IsQ0FBd0I7SUFFOUQsWUFBWSxJQUFZLEVBQUUsSUFBa0IsRUFBRSxJQUFzQjtRQUNsRSxLQUFLLENBQUMsa0JBQWtCLEVBQUUsSUFBSSxFQUFFLElBQUksRUFBRSxJQUFJLENBQUMsQ0FBQztRQUU1QyxNQUFNLGlCQUFpQixHQUFHLElBQUksQ0FBQyxpQkFBaUIsSUFBSSxLQUFLLENBQUM7UUFDMUQsTUFBTSxJQUFJLEdBQUcsSUFBSSxDQUFDLElBQUksSUFBSSxFQUFFLENBQUM7UUFFN0IsZUFBZTtRQUNmLE1BQU0sT0FBTyxHQUFHLElBQUksR0FBRyxDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQzlCLGdCQUFnQixpQkFBaUIsRUFBRSxFQUNuQztZQUNFLElBQUksRUFBRSxnQkFBZ0IsaUJBQWlCLEVBQUU7WUFDekMsZ0JBQWdCLEVBQUUsSUFBSSxDQUFDLFNBQVMsQ0FBQztnQkFDL0IsT0FBTyxFQUFFLFlBQVk7Z0JBQ3JCLFNBQVMsRUFBRTtvQkFDVDt3QkFDRSxNQUFNLEVBQUUsT0FBTzt3QkFDZixTQUFTLEVBQUU7NEJBQ1QsT0FBTyxFQUFFLG1CQUFtQjt5QkFDN0I7d0JBQ0QsTUFBTSxFQUFFLGdCQUFnQjtxQkFDekI7aUJBQ0Y7YUFDRixDQUFDO1lBQ0YsSUFBSSxFQUFFO2dCQUNKLElBQUksRUFBRSxnQkFBZ0IsaUJBQWlCLEVBQUU7Z0JBQ3pDLE9BQU8sRUFBRSxzQkFBc0I7Z0JBQy9CLEdBQUcsSUFBSTthQUNSO1NBQ0YsRUFDRCxFQUFFLE1BQU0sRUFBRSxJQUFJLEVBQUUsQ0FDakIsQ0FBQztRQUVGLHVFQUF1RTtRQUN2RSxNQUFNLGFBQWEsR0FBRyxHQUFHLENBQUMsU0FBUyxFQUFFLENBQUM7UUFDdEMsTUFBTSxlQUFlLEdBQUcsR0FBRyxDQUFDLGlCQUFpQixFQUFFLENBQUM7UUFFaEQsd0ZBQXdGO1FBQ3hGLElBQUksR0FBRyxDQUFDLEdBQUcsQ0FBQyxVQUFVLENBQ3BCLDBCQUEwQixpQkFBaUIsRUFBRSxFQUM3QztZQUNFLElBQUksRUFBRSxPQUFPLENBQUMsRUFBRTtZQUNoQixNQUFNLEVBQUUsTUFBTTtpQkFDWCxHQUFHLENBQUMsQ0FBQyxhQUFhLEVBQUUsZUFBZSxDQUFDLENBQUM7aUJBQ3JDLEtBQUssQ0FBQyxDQUFDLENBQUMsTUFBTSxFQUFFLFFBQVEsQ0FBQyxFQUFFLEVBQUUsQ0FDNUIsSUFBSSxDQUFDLFNBQVMsQ0FBQztnQkFDYixPQUFPLEVBQUUsWUFBWTtnQkFDckIsU0FBUyxFQUFFO29CQUNUO3dCQUNFLE1BQU0sRUFBRSxPQUFPO3dCQUNmLE1BQU0sRUFBRTs0QkFDTixxQkFBcUI7NEJBQ3JCLHNCQUFzQjs0QkFDdEIsbUJBQW1COzRCQUNuQix5QkFBeUI7eUJBQzFCO3dCQUNELFFBQVEsRUFBRSxnQkFBZ0IsTUFBTSxDQUFDLElBQUksSUFBSSxRQUFRLENBQUMsU0FBUywyQkFBMkI7cUJBQ3ZGO2lCQUNGO2FBQ0YsQ0FBQyxDQUNIO1NBQ0osRUFDRCxFQUFFLE1BQU0sRUFBRSxJQUFJLEVBQUUsQ0FDakIsQ0FBQztRQUVGLGlDQUFpQztRQUNqQyxJQUFJLEdBQUcsQ0FBQyxHQUFHLENBQUMsb0JBQW9CLENBQzlCLDZCQUE2QixpQkFBaUIsRUFBRSxFQUNoRDtZQUNFLElBQUksRUFBRSxPQUFPLENBQUMsSUFBSTtZQUNsQixTQUFTLEVBQUUscURBQXFEO1NBQ2pFLEVBQ0QsRUFBRSxNQUFNLEVBQUUsSUFBSSxFQUFFLENBQ2pCLENBQUM7UUFFRiwwQkFBMEI7UUFDMUIsTUFBTSxlQUFlLEdBQUcsSUFBSSxHQUFHLENBQUMsR0FBRyxDQUFDLGVBQWUsQ0FDakQsbUJBQW1CLGlCQUFpQixFQUFFLEVBQ3RDO1lBQ0UsSUFBSSxFQUFFLG1CQUFtQixpQkFBaUIsRUFBRTtZQUM1QyxJQUFJLEVBQUUsT0FBTyxDQUFDLElBQUk7WUFDbEIsSUFBSSxFQUFFO2dCQUNKLElBQUksRUFBRSxtQkFBbUIsaUJBQWlCLEVBQUU7Z0JBQzVDLEdBQUcsSUFBSTthQUNSO1NBQ0YsRUFDRCxFQUFFLE1BQU0sRUFBRSxJQUFJLEVBQUUsQ0FDakIsQ0FBQztRQUVGLElBQUksQ0FBQyxVQUFVLEdBQUcsT0FBTyxDQUFDLEdBQUcsQ0FBQztRQUM5QixJQUFJLENBQUMsV0FBVyxHQUFHLE9BQU8sQ0FBQyxJQUFJLENBQUM7UUFDaEMsSUFBSSxDQUFDLHNCQUFzQixHQUFHLGVBQWUsQ0FBQyxJQUFJLENBQUM7UUFFbkQsSUFBSSxDQUFDLGVBQWUsQ0FBQztZQUNuQixVQUFVLEVBQUUsSUFBSSxDQUFDLFVBQVU7WUFDM0IsV0FBVyxFQUFFLElBQUksQ0FBQyxXQUFXO1lBQzdCLHNCQUFzQixFQUFFLElBQUksQ0FBQyxzQkFBc0I7U0FDcEQsQ0FBQyxDQUFDO0lBQ0wsQ0FBQztDQUNGO0FBdkdELDRCQXVHQyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogaWFtLXN0YWNrLnRzXG4gKlxuICogVGhpcyBtb2R1bGUgZGVmaW5lcyB0aGUgSUFNIHN0YWNrIGZvciBjcmVhdGluZyByb2xlcyBhbmQgcG9saWNpZXNcbiAqIGZvbGxvd2luZyB0aGUgcHJpbmNpcGxlIG9mIGxlYXN0IHByaXZpbGVnZS5cbiAqL1xuaW1wb3J0ICogYXMgYXdzIGZyb20gJ0BwdWx1bWkvYXdzJztcbmltcG9ydCAqIGFzIHB1bHVtaSBmcm9tICdAcHVsdW1pL3B1bHVtaSc7XG5pbXBvcnQgeyBSZXNvdXJjZU9wdGlvbnMgfSBmcm9tICdAcHVsdW1pL3B1bHVtaSc7XG5cbmV4cG9ydCBpbnRlcmZhY2UgSWFtU3RhY2tBcmdzIHtcbiAgZW52aXJvbm1lbnRTdWZmaXg/OiBzdHJpbmc7XG4gIHRhZ3M/OiBwdWx1bWkuSW5wdXQ8eyBba2V5OiBzdHJpbmddOiBzdHJpbmcgfT47XG59XG5cbmV4cG9ydCBjbGFzcyBJYW1TdGFjayBleHRlbmRzIHB1bHVtaS5Db21wb25lbnRSZXNvdXJjZSB7XG4gIHB1YmxpYyByZWFkb25seSBlYzJSb2xlQXJuOiBwdWx1bWkuT3V0cHV0PHN0cmluZz47XG4gIHB1YmxpYyByZWFkb25seSBlYzJSb2xlTmFtZTogcHVsdW1pLk91dHB1dDxzdHJpbmc+O1xuICBwdWJsaWMgcmVhZG9ubHkgZWMySW5zdGFuY2VQcm9maWxlTmFtZTogcHVsdW1pLk91dHB1dDxzdHJpbmc+O1xuXG4gIGNvbnN0cnVjdG9yKG5hbWU6IHN0cmluZywgYXJnczogSWFtU3RhY2tBcmdzLCBvcHRzPzogUmVzb3VyY2VPcHRpb25zKSB7XG4gICAgc3VwZXIoJ3RhcDppYW06SWFtU3RhY2snLCBuYW1lLCBhcmdzLCBvcHRzKTtcblxuICAgIGNvbnN0IGVudmlyb25tZW50U3VmZml4ID0gYXJncy5lbnZpcm9ubWVudFN1ZmZpeCB8fCAnZGV2JztcbiAgICBjb25zdCB0YWdzID0gYXJncy50YWdzIHx8IHt9O1xuXG4gICAgLy8gRUMyIElBTSBSb2xlXG4gICAgY29uc3QgZWMyUm9sZSA9IG5ldyBhd3MuaWFtLlJvbGUoXG4gICAgICBgdGFwLWVjMi1yb2xlLSR7ZW52aXJvbm1lbnRTdWZmaXh9YCxcbiAgICAgIHtcbiAgICAgICAgbmFtZTogYHRhcC1lYzItcm9sZS0ke2Vudmlyb25tZW50U3VmZml4fWAsXG4gICAgICAgIGFzc3VtZVJvbGVQb2xpY3k6IEpTT04uc3RyaW5naWZ5KHtcbiAgICAgICAgICBWZXJzaW9uOiAnMjAxMi0xMC0xNycsXG4gICAgICAgICAgU3RhdGVtZW50OiBbXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgIEVmZmVjdDogJ0FsbG93JyxcbiAgICAgICAgICAgICAgUHJpbmNpcGFsOiB7XG4gICAgICAgICAgICAgICAgU2VydmljZTogJ2VjMi5hbWF6b25hd3MuY29tJyxcbiAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgQWN0aW9uOiAnc3RzOkFzc3VtZVJvbGUnLFxuICAgICAgICAgICAgfSxcbiAgICAgICAgICBdLFxuICAgICAgICB9KSxcbiAgICAgICAgdGFnczoge1xuICAgICAgICAgIE5hbWU6IGB0YXAtZWMyLXJvbGUtJHtlbnZpcm9ubWVudFN1ZmZpeH1gLFxuICAgICAgICAgIFB1cnBvc2U6ICdFQzJJbnN0YW5jZUV4ZWN1dGlvbicsXG4gICAgICAgICAgLi4udGFncyxcbiAgICAgICAgfSxcbiAgICAgIH0sXG4gICAgICB7IHBhcmVudDogdGhpcyB9XG4gICAgKTtcblxuICAgIC8vIEdldCBjdXJyZW50IEFXUyBhY2NvdW50IElEIGFuZCByZWdpb24gZm9yIG1vcmUgc3BlY2lmaWMgSUFNIHBvbGljaWVzXG4gICAgY29uc3QgY3VycmVudFJlZ2lvbiA9IGF3cy5nZXRSZWdpb24oKTtcbiAgICBjb25zdCBjdXJyZW50SWRlbnRpdHkgPSBhd3MuZ2V0Q2FsbGVySWRlbnRpdHkoKTtcblxuICAgIC8vIEVDMiBsb2dnaW5nIHBvbGljeSAtIEZJWEVEOiBSZXN0cmljdGVkIHRvIHNwZWNpZmljIGxvZyBncm91cHMgd2l0aCBhY2NvdW50IGFuZCByZWdpb25cbiAgICBuZXcgYXdzLmlhbS5Sb2xlUG9saWN5KFxuICAgICAgYHRhcC1lYzItbG9nZ2luZy1wb2xpY3ktJHtlbnZpcm9ubWVudFN1ZmZpeH1gLFxuICAgICAge1xuICAgICAgICByb2xlOiBlYzJSb2xlLmlkLFxuICAgICAgICBwb2xpY3k6IHB1bHVtaVxuICAgICAgICAgIC5hbGwoW2N1cnJlbnRSZWdpb24sIGN1cnJlbnRJZGVudGl0eV0pXG4gICAgICAgICAgLmFwcGx5KChbcmVnaW9uLCBpZGVudGl0eV0pID0+XG4gICAgICAgICAgICBKU09OLnN0cmluZ2lmeSh7XG4gICAgICAgICAgICAgIFZlcnNpb246ICcyMDEyLTEwLTE3JyxcbiAgICAgICAgICAgICAgU3RhdGVtZW50OiBbXG4gICAgICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgICAgRWZmZWN0OiAnQWxsb3cnLFxuICAgICAgICAgICAgICAgICAgQWN0aW9uOiBbXG4gICAgICAgICAgICAgICAgICAgICdsb2dzOkNyZWF0ZUxvZ0dyb3VwJyxcbiAgICAgICAgICAgICAgICAgICAgJ2xvZ3M6Q3JlYXRlTG9nU3RyZWFtJyxcbiAgICAgICAgICAgICAgICAgICAgJ2xvZ3M6UHV0TG9nRXZlbnRzJyxcbiAgICAgICAgICAgICAgICAgICAgJ2xvZ3M6RGVzY3JpYmVMb2dTdHJlYW1zJyxcbiAgICAgICAgICAgICAgICAgIF0sXG4gICAgICAgICAgICAgICAgICBSZXNvdXJjZTogYGFybjphd3M6bG9nczoke3JlZ2lvbi5uYW1lfToke2lkZW50aXR5LmFjY291bnRJZH06bG9nLWdyb3VwOi9hd3MvZWMyL3RhcC8qYCxcbiAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICBdLFxuICAgICAgICAgICAgfSlcbiAgICAgICAgICApLFxuICAgICAgfSxcbiAgICAgIHsgcGFyZW50OiB0aGlzIH1cbiAgICApO1xuXG4gICAgLy8gQXR0YWNoIENsb3VkV2F0Y2ggYWdlbnQgcG9saWN5XG4gICAgbmV3IGF3cy5pYW0uUm9sZVBvbGljeUF0dGFjaG1lbnQoXG4gICAgICBgdGFwLWVjMi1jbG91ZHdhdGNoLXBvbGljeS0ke2Vudmlyb25tZW50U3VmZml4fWAsXG4gICAgICB7XG4gICAgICAgIHJvbGU6IGVjMlJvbGUubmFtZSxcbiAgICAgICAgcG9saWN5QXJuOiAnYXJuOmF3czppYW06OmF3czpwb2xpY3kvQ2xvdWRXYXRjaEFnZW50U2VydmVyUG9saWN5JyxcbiAgICAgIH0sXG4gICAgICB7IHBhcmVudDogdGhpcyB9XG4gICAgKTtcblxuICAgIC8vIENyZWF0ZSBpbnN0YW5jZSBwcm9maWxlXG4gICAgY29uc3QgaW5zdGFuY2VQcm9maWxlID0gbmV3IGF3cy5pYW0uSW5zdGFuY2VQcm9maWxlKFxuICAgICAgYHRhcC1lYzItcHJvZmlsZS0ke2Vudmlyb25tZW50U3VmZml4fWAsXG4gICAgICB7XG4gICAgICAgIG5hbWU6IGB0YXAtZWMyLXByb2ZpbGUtJHtlbnZpcm9ubWVudFN1ZmZpeH1gLFxuICAgICAgICByb2xlOiBlYzJSb2xlLm5hbWUsXG4gICAgICAgIHRhZ3M6IHtcbiAgICAgICAgICBOYW1lOiBgdGFwLWVjMi1wcm9maWxlLSR7ZW52aXJvbm1lbnRTdWZmaXh9YCxcbiAgICAgICAgICAuLi50YWdzLFxuICAgICAgICB9LFxuICAgICAgfSxcbiAgICAgIHsgcGFyZW50OiB0aGlzIH1cbiAgICApO1xuXG4gICAgdGhpcy5lYzJSb2xlQXJuID0gZWMyUm9sZS5hcm47XG4gICAgdGhpcy5lYzJSb2xlTmFtZSA9IGVjMlJvbGUubmFtZTtcbiAgICB0aGlzLmVjMkluc3RhbmNlUHJvZmlsZU5hbWUgPSBpbnN0YW5jZVByb2ZpbGUubmFtZTtcblxuICAgIHRoaXMucmVnaXN0ZXJPdXRwdXRzKHtcbiAgICAgIGVjMlJvbGVBcm46IHRoaXMuZWMyUm9sZUFybixcbiAgICAgIGVjMlJvbGVOYW1lOiB0aGlzLmVjMlJvbGVOYW1lLFxuICAgICAgZWMySW5zdGFuY2VQcm9maWxlTmFtZTogdGhpcy5lYzJJbnN0YW5jZVByb2ZpbGVOYW1lLFxuICAgIH0pO1xuICB9XG59XG4iXX0=