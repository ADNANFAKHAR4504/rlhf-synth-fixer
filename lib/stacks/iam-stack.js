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
        // EC2 logging policy - FIXED: Restricted to specific log groups
        new aws.iam.RolePolicy(`tap-ec2-logging-policy-${environmentSuffix}`, {
            role: ec2Role.id,
            policy: JSON.stringify({
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
                        Resource: 'arn:aws:logs:*:*:log-group:/aws/ec2/tap/*',
                    },
                ],
            }),
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
        this.ec2InstanceProfileName = instanceProfile.name;
        this.registerOutputs({
            ec2RoleArn: this.ec2RoleArn,
            ec2InstanceProfileName: this.ec2InstanceProfileName,
        });
    }
}
exports.IamStack = IamStack;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaWFtLXN0YWNrLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiaWFtLXN0YWNrLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQUFBOzs7OztHQUtHO0FBQ0gsaURBQW1DO0FBQ25DLHVEQUF5QztBQVF6QyxNQUFhLFFBQVMsU0FBUSxNQUFNLENBQUMsaUJBQWlCO0lBQ3BDLFVBQVUsQ0FBd0I7SUFDbEMsc0JBQXNCLENBQXdCO0lBRTlELFlBQVksSUFBWSxFQUFFLElBQWtCLEVBQUUsSUFBc0I7UUFDbEUsS0FBSyxDQUFDLGtCQUFrQixFQUFFLElBQUksRUFBRSxJQUFJLEVBQUUsSUFBSSxDQUFDLENBQUM7UUFFNUMsTUFBTSxpQkFBaUIsR0FBRyxJQUFJLENBQUMsaUJBQWlCLElBQUksS0FBSyxDQUFDO1FBQzFELE1BQU0sSUFBSSxHQUFHLElBQUksQ0FBQyxJQUFJLElBQUksRUFBRSxDQUFDO1FBRTdCLGVBQWU7UUFDZixNQUFNLE9BQU8sR0FBRyxJQUFJLEdBQUcsQ0FBQyxHQUFHLENBQUMsSUFBSSxDQUM5QixnQkFBZ0IsaUJBQWlCLEVBQUUsRUFDbkM7WUFDRSxJQUFJLEVBQUUsZ0JBQWdCLGlCQUFpQixFQUFFO1lBQ3pDLGdCQUFnQixFQUFFLElBQUksQ0FBQyxTQUFTLENBQUM7Z0JBQy9CLE9BQU8sRUFBRSxZQUFZO2dCQUNyQixTQUFTLEVBQUU7b0JBQ1Q7d0JBQ0UsTUFBTSxFQUFFLE9BQU87d0JBQ2YsU0FBUyxFQUFFOzRCQUNULE9BQU8sRUFBRSxtQkFBbUI7eUJBQzdCO3dCQUNELE1BQU0sRUFBRSxnQkFBZ0I7cUJBQ3pCO2lCQUNGO2FBQ0YsQ0FBQztZQUNGLElBQUksRUFBRTtnQkFDSixJQUFJLEVBQUUsZ0JBQWdCLGlCQUFpQixFQUFFO2dCQUN6QyxPQUFPLEVBQUUsc0JBQXNCO2dCQUMvQixHQUFHLElBQUk7YUFDUjtTQUNGLEVBQ0QsRUFBRSxNQUFNLEVBQUUsSUFBSSxFQUFFLENBQ2pCLENBQUM7UUFFRixnRUFBZ0U7UUFDaEUsSUFBSSxHQUFHLENBQUMsR0FBRyxDQUFDLFVBQVUsQ0FDcEIsMEJBQTBCLGlCQUFpQixFQUFFLEVBQzdDO1lBQ0UsSUFBSSxFQUFFLE9BQU8sQ0FBQyxFQUFFO1lBQ2hCLE1BQU0sRUFBRSxJQUFJLENBQUMsU0FBUyxDQUFDO2dCQUNyQixPQUFPLEVBQUUsWUFBWTtnQkFDckIsU0FBUyxFQUFFO29CQUNUO3dCQUNFLE1BQU0sRUFBRSxPQUFPO3dCQUNmLE1BQU0sRUFBRTs0QkFDTixxQkFBcUI7NEJBQ3JCLHNCQUFzQjs0QkFDdEIsbUJBQW1COzRCQUNuQix5QkFBeUI7eUJBQzFCO3dCQUNELFFBQVEsRUFBRSwyQ0FBMkM7cUJBQ3REO2lCQUNGO2FBQ0YsQ0FBQztTQUNILEVBQ0QsRUFBRSxNQUFNLEVBQUUsSUFBSSxFQUFFLENBQ2pCLENBQUM7UUFFRixpQ0FBaUM7UUFDakMsSUFBSSxHQUFHLENBQUMsR0FBRyxDQUFDLG9CQUFvQixDQUM5Qiw2QkFBNkIsaUJBQWlCLEVBQUUsRUFDaEQ7WUFDRSxJQUFJLEVBQUUsT0FBTyxDQUFDLElBQUk7WUFDbEIsU0FBUyxFQUFFLHFEQUFxRDtTQUNqRSxFQUNELEVBQUUsTUFBTSxFQUFFLElBQUksRUFBRSxDQUNqQixDQUFDO1FBRUYsMEJBQTBCO1FBQzFCLE1BQU0sZUFBZSxHQUFHLElBQUksR0FBRyxDQUFDLEdBQUcsQ0FBQyxlQUFlLENBQ2pELG1CQUFtQixpQkFBaUIsRUFBRSxFQUN0QztZQUNFLElBQUksRUFBRSxtQkFBbUIsaUJBQWlCLEVBQUU7WUFDNUMsSUFBSSxFQUFFLE9BQU8sQ0FBQyxJQUFJO1lBQ2xCLElBQUksRUFBRTtnQkFDSixJQUFJLEVBQUUsbUJBQW1CLGlCQUFpQixFQUFFO2dCQUM1QyxHQUFHLElBQUk7YUFDUjtTQUNGLEVBQ0QsRUFBRSxNQUFNLEVBQUUsSUFBSSxFQUFFLENBQ2pCLENBQUM7UUFFRixJQUFJLENBQUMsVUFBVSxHQUFHLE9BQU8sQ0FBQyxHQUFHLENBQUM7UUFDOUIsSUFBSSxDQUFDLHNCQUFzQixHQUFHLGVBQWUsQ0FBQyxJQUFJLENBQUM7UUFFbkQsSUFBSSxDQUFDLGVBQWUsQ0FBQztZQUNuQixVQUFVLEVBQUUsSUFBSSxDQUFDLFVBQVU7WUFDM0Isc0JBQXNCLEVBQUUsSUFBSSxDQUFDLHNCQUFzQjtTQUNwRCxDQUFDLENBQUM7SUFDTCxDQUFDO0NBQ0Y7QUE1RkQsNEJBNEZDIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBpYW0tc3RhY2sudHNcbiAqXG4gKiBUaGlzIG1vZHVsZSBkZWZpbmVzIHRoZSBJQU0gc3RhY2sgZm9yIGNyZWF0aW5nIHJvbGVzIGFuZCBwb2xpY2llc1xuICogZm9sbG93aW5nIHRoZSBwcmluY2lwbGUgb2YgbGVhc3QgcHJpdmlsZWdlLlxuICovXG5pbXBvcnQgKiBhcyBhd3MgZnJvbSAnQHB1bHVtaS9hd3MnO1xuaW1wb3J0ICogYXMgcHVsdW1pIGZyb20gJ0BwdWx1bWkvcHVsdW1pJztcbmltcG9ydCB7IFJlc291cmNlT3B0aW9ucyB9IGZyb20gJ0BwdWx1bWkvcHVsdW1pJztcblxuZXhwb3J0IGludGVyZmFjZSBJYW1TdGFja0FyZ3Mge1xuICBlbnZpcm9ubWVudFN1ZmZpeD86IHN0cmluZztcbiAgdGFncz86IHB1bHVtaS5JbnB1dDx7IFtrZXk6IHN0cmluZ106IHN0cmluZyB9Pjtcbn1cblxuZXhwb3J0IGNsYXNzIElhbVN0YWNrIGV4dGVuZHMgcHVsdW1pLkNvbXBvbmVudFJlc291cmNlIHtcbiAgcHVibGljIHJlYWRvbmx5IGVjMlJvbGVBcm46IHB1bHVtaS5PdXRwdXQ8c3RyaW5nPjtcbiAgcHVibGljIHJlYWRvbmx5IGVjMkluc3RhbmNlUHJvZmlsZU5hbWU6IHB1bHVtaS5PdXRwdXQ8c3RyaW5nPjtcblxuICBjb25zdHJ1Y3RvcihuYW1lOiBzdHJpbmcsIGFyZ3M6IElhbVN0YWNrQXJncywgb3B0cz86IFJlc291cmNlT3B0aW9ucykge1xuICAgIHN1cGVyKCd0YXA6aWFtOklhbVN0YWNrJywgbmFtZSwgYXJncywgb3B0cyk7XG5cbiAgICBjb25zdCBlbnZpcm9ubWVudFN1ZmZpeCA9IGFyZ3MuZW52aXJvbm1lbnRTdWZmaXggfHwgJ2Rldic7XG4gICAgY29uc3QgdGFncyA9IGFyZ3MudGFncyB8fCB7fTtcblxuICAgIC8vIEVDMiBJQU0gUm9sZVxuICAgIGNvbnN0IGVjMlJvbGUgPSBuZXcgYXdzLmlhbS5Sb2xlKFxuICAgICAgYHRhcC1lYzItcm9sZS0ke2Vudmlyb25tZW50U3VmZml4fWAsXG4gICAgICB7XG4gICAgICAgIG5hbWU6IGB0YXAtZWMyLXJvbGUtJHtlbnZpcm9ubWVudFN1ZmZpeH1gLFxuICAgICAgICBhc3N1bWVSb2xlUG9saWN5OiBKU09OLnN0cmluZ2lmeSh7XG4gICAgICAgICAgVmVyc2lvbjogJzIwMTItMTAtMTcnLFxuICAgICAgICAgIFN0YXRlbWVudDogW1xuICAgICAgICAgICAge1xuICAgICAgICAgICAgICBFZmZlY3Q6ICdBbGxvdycsXG4gICAgICAgICAgICAgIFByaW5jaXBhbDoge1xuICAgICAgICAgICAgICAgIFNlcnZpY2U6ICdlYzIuYW1hem9uYXdzLmNvbScsXG4gICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgIEFjdGlvbjogJ3N0czpBc3N1bWVSb2xlJyxcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgXSxcbiAgICAgICAgfSksXG4gICAgICAgIHRhZ3M6IHtcbiAgICAgICAgICBOYW1lOiBgdGFwLWVjMi1yb2xlLSR7ZW52aXJvbm1lbnRTdWZmaXh9YCxcbiAgICAgICAgICBQdXJwb3NlOiAnRUMySW5zdGFuY2VFeGVjdXRpb24nLFxuICAgICAgICAgIC4uLnRhZ3MsXG4gICAgICAgIH0sXG4gICAgICB9LFxuICAgICAgeyBwYXJlbnQ6IHRoaXMgfVxuICAgICk7XG5cbiAgICAvLyBFQzIgbG9nZ2luZyBwb2xpY3kgLSBGSVhFRDogUmVzdHJpY3RlZCB0byBzcGVjaWZpYyBsb2cgZ3JvdXBzXG4gICAgbmV3IGF3cy5pYW0uUm9sZVBvbGljeShcbiAgICAgIGB0YXAtZWMyLWxvZ2dpbmctcG9saWN5LSR7ZW52aXJvbm1lbnRTdWZmaXh9YCxcbiAgICAgIHtcbiAgICAgICAgcm9sZTogZWMyUm9sZS5pZCxcbiAgICAgICAgcG9saWN5OiBKU09OLnN0cmluZ2lmeSh7XG4gICAgICAgICAgVmVyc2lvbjogJzIwMTItMTAtMTcnLFxuICAgICAgICAgIFN0YXRlbWVudDogW1xuICAgICAgICAgICAge1xuICAgICAgICAgICAgICBFZmZlY3Q6ICdBbGxvdycsXG4gICAgICAgICAgICAgIEFjdGlvbjogW1xuICAgICAgICAgICAgICAgICdsb2dzOkNyZWF0ZUxvZ0dyb3VwJyxcbiAgICAgICAgICAgICAgICAnbG9nczpDcmVhdGVMb2dTdHJlYW0nLFxuICAgICAgICAgICAgICAgICdsb2dzOlB1dExvZ0V2ZW50cycsXG4gICAgICAgICAgICAgICAgJ2xvZ3M6RGVzY3JpYmVMb2dTdHJlYW1zJyxcbiAgICAgICAgICAgICAgXSxcbiAgICAgICAgICAgICAgUmVzb3VyY2U6ICdhcm46YXdzOmxvZ3M6KjoqOmxvZy1ncm91cDovYXdzL2VjMi90YXAvKicsXG4gICAgICAgICAgICB9LFxuICAgICAgICAgIF0sXG4gICAgICAgIH0pLFxuICAgICAgfSxcbiAgICAgIHsgcGFyZW50OiB0aGlzIH1cbiAgICApO1xuXG4gICAgLy8gQXR0YWNoIENsb3VkV2F0Y2ggYWdlbnQgcG9saWN5XG4gICAgbmV3IGF3cy5pYW0uUm9sZVBvbGljeUF0dGFjaG1lbnQoXG4gICAgICBgdGFwLWVjMi1jbG91ZHdhdGNoLXBvbGljeS0ke2Vudmlyb25tZW50U3VmZml4fWAsXG4gICAgICB7XG4gICAgICAgIHJvbGU6IGVjMlJvbGUubmFtZSxcbiAgICAgICAgcG9saWN5QXJuOiAnYXJuOmF3czppYW06OmF3czpwb2xpY3kvQ2xvdWRXYXRjaEFnZW50U2VydmVyUG9saWN5JyxcbiAgICAgIH0sXG4gICAgICB7IHBhcmVudDogdGhpcyB9XG4gICAgKTtcblxuICAgIC8vIENyZWF0ZSBpbnN0YW5jZSBwcm9maWxlXG4gICAgY29uc3QgaW5zdGFuY2VQcm9maWxlID0gbmV3IGF3cy5pYW0uSW5zdGFuY2VQcm9maWxlKFxuICAgICAgYHRhcC1lYzItcHJvZmlsZS0ke2Vudmlyb25tZW50U3VmZml4fWAsXG4gICAgICB7XG4gICAgICAgIG5hbWU6IGB0YXAtZWMyLXByb2ZpbGUtJHtlbnZpcm9ubWVudFN1ZmZpeH1gLFxuICAgICAgICByb2xlOiBlYzJSb2xlLm5hbWUsXG4gICAgICAgIHRhZ3M6IHtcbiAgICAgICAgICBOYW1lOiBgdGFwLWVjMi1wcm9maWxlLSR7ZW52aXJvbm1lbnRTdWZmaXh9YCxcbiAgICAgICAgICAuLi50YWdzLFxuICAgICAgICB9LFxuICAgICAgfSxcbiAgICAgIHsgcGFyZW50OiB0aGlzIH1cbiAgICApO1xuXG4gICAgdGhpcy5lYzJSb2xlQXJuID0gZWMyUm9sZS5hcm47XG4gICAgdGhpcy5lYzJJbnN0YW5jZVByb2ZpbGVOYW1lID0gaW5zdGFuY2VQcm9maWxlLm5hbWU7XG5cbiAgICB0aGlzLnJlZ2lzdGVyT3V0cHV0cyh7XG4gICAgICBlYzJSb2xlQXJuOiB0aGlzLmVjMlJvbGVBcm4sXG4gICAgICBlYzJJbnN0YW5jZVByb2ZpbGVOYW1lOiB0aGlzLmVjMkluc3RhbmNlUHJvZmlsZU5hbWUsXG4gICAgfSk7XG4gIH1cbn1cbiJdfQ==