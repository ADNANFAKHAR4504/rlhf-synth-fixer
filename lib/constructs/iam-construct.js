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
exports.IamConstruct = void 0;
const iam = __importStar(require("aws-cdk-lib/aws-iam"));
const constructs_1 = require("constructs");
class IamConstruct extends constructs_1.Construct {
    s3ReplicationRole;
    // public readonly eksClusterRole: iam.Role;
    // public readonly eksNodeGroupRole: iam.Role;
    loggingRole;
    constructor(scope, id, props) {
        super(scope, id);
        // S3 Cross-Region Replication Role
        this.s3ReplicationRole = new iam.Role(this, 'S3ReplicationRole', {
            roleName: `s3-replication-role-${props.environmentSuffix}`,
            assumedBy: new iam.ServicePrincipal('s3.amazonaws.com'),
            inlinePolicies: {
                ReplicationPolicy: new iam.PolicyDocument({
                    statements: [
                        new iam.PolicyStatement({
                            effect: iam.Effect.ALLOW,
                            actions: ['s3:GetReplicationConfiguration', 's3:ListBucket'],
                            resources: ['*'],
                        }),
                        new iam.PolicyStatement({
                            effect: iam.Effect.ALLOW,
                            actions: [
                                's3:GetObjectVersionForReplication',
                                's3:GetObjectVersionAcl',
                                's3:GetObjectVersionTagging',
                            ],
                            resources: ['*'],
                        }),
                        new iam.PolicyStatement({
                            effect: iam.Effect.ALLOW,
                            actions: [
                                's3:ReplicateObject',
                                's3:ReplicateDelete',
                                's3:ReplicateTags',
                            ],
                            resources: ['*'],
                        }),
                    ],
                }),
            },
        });
        // EKS Cluster Service Role (Commented out for simplified deployment)
        // this.eksClusterRole = new iam.Role(this, 'EksClusterRole', {
        //   roleName: `eks-cluster-role-${props.environmentSuffix}`,
        //   assumedBy: new iam.ServicePrincipal('eks.amazonaws.com'),
        //   managedPolicies: [
        //     iam.ManagedPolicy.fromAwsManagedPolicyName('AmazonEKSClusterPolicy'),
        //   ],
        // });
        // // EKS Node Group Role (Commented out for simplified deployment)
        // this.eksNodeGroupRole = new iam.Role(this, 'EksNodeGroupRole', {
        //   roleName: `eks-node-group-role-${props.environmentSuffix}`,
        //   assumedBy: new iam.ServicePrincipal('ec2.amazonaws.com'),
        //   managedPolicies: [
        //     iam.ManagedPolicy.fromAwsManagedPolicyName('AmazonEKSWorkerNodePolicy'),
        //     iam.ManagedPolicy.fromAwsManagedPolicyName('AmazonEKS_CNI_Policy'),
        //     iam.ManagedPolicy.fromAwsManagedPolicyName(
        //       'AmazonEC2ContainerRegistryReadOnly'
        //     ),
        //   ],
        // });
        // CloudWatch Logging Role (if logging enabled)
        if (props.enableLogging) {
            this.loggingRole = new iam.Role(this, 'CloudWatchLoggingRole', {
                roleName: `cloudwatch-logging-role-${props.environmentSuffix}`,
                assumedBy: new iam.ServicePrincipal('logs.amazonaws.com'),
                inlinePolicies: {
                    LoggingPolicy: new iam.PolicyDocument({
                        statements: [
                            new iam.PolicyStatement({
                                effect: iam.Effect.ALLOW,
                                actions: [
                                    'logs:CreateLogGroup',
                                    'logs:CreateLogStream',
                                    'logs:PutLogEvents',
                                    'logs:DescribeLogStreams',
                                    'logs:DescribeLogGroups',
                                ],
                                resources: ['*'],
                            }),
                        ],
                    }),
                },
            });
        }
        // Add common tags
        const allRoles = [this.s3ReplicationRole];
        // if (this.eksClusterRole) allRoles.push(this.eksClusterRole);
        // if (this.eksNodeGroupRole) allRoles.push(this.eksNodeGroupRole);
        if (this.loggingRole)
            allRoles.push(this.loggingRole);
        allRoles.forEach(role => {
            role.node.addMetadata('Environment', props.environmentSuffix);
            role.node.addMetadata('Component', 'IAM');
        });
    }
}
exports.IamConstruct = IamConstruct;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaWFtLWNvbnN0cnVjdC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbImlhbS1jb25zdHJ1Y3QudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBQUEseURBQTJDO0FBQzNDLDJDQUF1QztBQU92QyxNQUFhLFlBQWEsU0FBUSxzQkFBUztJQUN6QixpQkFBaUIsQ0FBVztJQUM1Qyw0Q0FBNEM7SUFDNUMsOENBQThDO0lBQzlCLFdBQVcsQ0FBWTtJQUV2QyxZQUFZLEtBQWdCLEVBQUUsRUFBVSxFQUFFLEtBQXdCO1FBQ2hFLEtBQUssQ0FBQyxLQUFLLEVBQUUsRUFBRSxDQUFDLENBQUM7UUFFakIsbUNBQW1DO1FBQ25DLElBQUksQ0FBQyxpQkFBaUIsR0FBRyxJQUFJLEdBQUcsQ0FBQyxJQUFJLENBQUMsSUFBSSxFQUFFLG1CQUFtQixFQUFFO1lBQy9ELFFBQVEsRUFBRSx1QkFBdUIsS0FBSyxDQUFDLGlCQUFpQixFQUFFO1lBQzFELFNBQVMsRUFBRSxJQUFJLEdBQUcsQ0FBQyxnQkFBZ0IsQ0FBQyxrQkFBa0IsQ0FBQztZQUN2RCxjQUFjLEVBQUU7Z0JBQ2QsaUJBQWlCLEVBQUUsSUFBSSxHQUFHLENBQUMsY0FBYyxDQUFDO29CQUN4QyxVQUFVLEVBQUU7d0JBQ1YsSUFBSSxHQUFHLENBQUMsZUFBZSxDQUFDOzRCQUN0QixNQUFNLEVBQUUsR0FBRyxDQUFDLE1BQU0sQ0FBQyxLQUFLOzRCQUN4QixPQUFPLEVBQUUsQ0FBQyxnQ0FBZ0MsRUFBRSxlQUFlLENBQUM7NEJBQzVELFNBQVMsRUFBRSxDQUFDLEdBQUcsQ0FBQzt5QkFDakIsQ0FBQzt3QkFDRixJQUFJLEdBQUcsQ0FBQyxlQUFlLENBQUM7NEJBQ3RCLE1BQU0sRUFBRSxHQUFHLENBQUMsTUFBTSxDQUFDLEtBQUs7NEJBQ3hCLE9BQU8sRUFBRTtnQ0FDUCxtQ0FBbUM7Z0NBQ25DLHdCQUF3QjtnQ0FDeEIsNEJBQTRCOzZCQUM3Qjs0QkFDRCxTQUFTLEVBQUUsQ0FBQyxHQUFHLENBQUM7eUJBQ2pCLENBQUM7d0JBQ0YsSUFBSSxHQUFHLENBQUMsZUFBZSxDQUFDOzRCQUN0QixNQUFNLEVBQUUsR0FBRyxDQUFDLE1BQU0sQ0FBQyxLQUFLOzRCQUN4QixPQUFPLEVBQUU7Z0NBQ1Asb0JBQW9CO2dDQUNwQixvQkFBb0I7Z0NBQ3BCLGtCQUFrQjs2QkFDbkI7NEJBQ0QsU0FBUyxFQUFFLENBQUMsR0FBRyxDQUFDO3lCQUNqQixDQUFDO3FCQUNIO2lCQUNGLENBQUM7YUFDSDtTQUNGLENBQUMsQ0FBQztRQUVILHFFQUFxRTtRQUNyRSwrREFBK0Q7UUFDL0QsNkRBQTZEO1FBQzdELDhEQUE4RDtRQUM5RCx1QkFBdUI7UUFDdkIsNEVBQTRFO1FBQzVFLE9BQU87UUFDUCxNQUFNO1FBRU4sbUVBQW1FO1FBQ25FLG1FQUFtRTtRQUNuRSxnRUFBZ0U7UUFDaEUsOERBQThEO1FBQzlELHVCQUF1QjtRQUN2QiwrRUFBK0U7UUFDL0UsMEVBQTBFO1FBQzFFLGtEQUFrRDtRQUNsRCw2Q0FBNkM7UUFDN0MsU0FBUztRQUNULE9BQU87UUFDUCxNQUFNO1FBRU4sK0NBQStDO1FBQy9DLElBQUksS0FBSyxDQUFDLGFBQWEsRUFBRSxDQUFDO1lBQ3hCLElBQUksQ0FBQyxXQUFXLEdBQUcsSUFBSSxHQUFHLENBQUMsSUFBSSxDQUFDLElBQUksRUFBRSx1QkFBdUIsRUFBRTtnQkFDN0QsUUFBUSxFQUFFLDJCQUEyQixLQUFLLENBQUMsaUJBQWlCLEVBQUU7Z0JBQzlELFNBQVMsRUFBRSxJQUFJLEdBQUcsQ0FBQyxnQkFBZ0IsQ0FBQyxvQkFBb0IsQ0FBQztnQkFDekQsY0FBYyxFQUFFO29CQUNkLGFBQWEsRUFBRSxJQUFJLEdBQUcsQ0FBQyxjQUFjLENBQUM7d0JBQ3BDLFVBQVUsRUFBRTs0QkFDVixJQUFJLEdBQUcsQ0FBQyxlQUFlLENBQUM7Z0NBQ3RCLE1BQU0sRUFBRSxHQUFHLENBQUMsTUFBTSxDQUFDLEtBQUs7Z0NBQ3hCLE9BQU8sRUFBRTtvQ0FDUCxxQkFBcUI7b0NBQ3JCLHNCQUFzQjtvQ0FDdEIsbUJBQW1CO29DQUNuQix5QkFBeUI7b0NBQ3pCLHdCQUF3QjtpQ0FDekI7Z0NBQ0QsU0FBUyxFQUFFLENBQUMsR0FBRyxDQUFDOzZCQUNqQixDQUFDO3lCQUNIO3FCQUNGLENBQUM7aUJBQ0g7YUFDRixDQUFDLENBQUM7UUFDTCxDQUFDO1FBRUQsa0JBQWtCO1FBQ2xCLE1BQU0sUUFBUSxHQUFHLENBQUMsSUFBSSxDQUFDLGlCQUFpQixDQUFDLENBQUM7UUFDMUMsK0RBQStEO1FBQy9ELG1FQUFtRTtRQUNuRSxJQUFJLElBQUksQ0FBQyxXQUFXO1lBQUUsUUFBUSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsV0FBVyxDQUFDLENBQUM7UUFFdEQsUUFBUSxDQUFDLE9BQU8sQ0FBQyxJQUFJLENBQUMsRUFBRTtZQUN0QixJQUFJLENBQUMsSUFBSSxDQUFDLFdBQVcsQ0FBQyxhQUFhLEVBQUUsS0FBSyxDQUFDLGlCQUFpQixDQUFDLENBQUM7WUFDOUQsSUFBSSxDQUFDLElBQUksQ0FBQyxXQUFXLENBQUMsV0FBVyxFQUFFLEtBQUssQ0FBQyxDQUFDO1FBQzVDLENBQUMsQ0FBQyxDQUFDO0lBQ0wsQ0FBQztDQUNGO0FBdEdELG9DQXNHQyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCAqIGFzIGlhbSBmcm9tICdhd3MtY2RrLWxpYi9hd3MtaWFtJztcbmltcG9ydCB7IENvbnN0cnVjdCB9IGZyb20gJ2NvbnN0cnVjdHMnO1xuXG5leHBvcnQgaW50ZXJmYWNlIElhbUNvbnN0cnVjdFByb3BzIHtcbiAgZW52aXJvbm1lbnRTdWZmaXg6IHN0cmluZztcbiAgZW5hYmxlTG9nZ2luZzogYm9vbGVhbjtcbn1cblxuZXhwb3J0IGNsYXNzIElhbUNvbnN0cnVjdCBleHRlbmRzIENvbnN0cnVjdCB7XG4gIHB1YmxpYyByZWFkb25seSBzM1JlcGxpY2F0aW9uUm9sZTogaWFtLlJvbGU7XG4gIC8vIHB1YmxpYyByZWFkb25seSBla3NDbHVzdGVyUm9sZTogaWFtLlJvbGU7XG4gIC8vIHB1YmxpYyByZWFkb25seSBla3NOb2RlR3JvdXBSb2xlOiBpYW0uUm9sZTtcbiAgcHVibGljIHJlYWRvbmx5IGxvZ2dpbmdSb2xlPzogaWFtLlJvbGU7XG5cbiAgY29uc3RydWN0b3Ioc2NvcGU6IENvbnN0cnVjdCwgaWQ6IHN0cmluZywgcHJvcHM6IElhbUNvbnN0cnVjdFByb3BzKSB7XG4gICAgc3VwZXIoc2NvcGUsIGlkKTtcblxuICAgIC8vIFMzIENyb3NzLVJlZ2lvbiBSZXBsaWNhdGlvbiBSb2xlXG4gICAgdGhpcy5zM1JlcGxpY2F0aW9uUm9sZSA9IG5ldyBpYW0uUm9sZSh0aGlzLCAnUzNSZXBsaWNhdGlvblJvbGUnLCB7XG4gICAgICByb2xlTmFtZTogYHMzLXJlcGxpY2F0aW9uLXJvbGUtJHtwcm9wcy5lbnZpcm9ubWVudFN1ZmZpeH1gLFxuICAgICAgYXNzdW1lZEJ5OiBuZXcgaWFtLlNlcnZpY2VQcmluY2lwYWwoJ3MzLmFtYXpvbmF3cy5jb20nKSxcbiAgICAgIGlubGluZVBvbGljaWVzOiB7XG4gICAgICAgIFJlcGxpY2F0aW9uUG9saWN5OiBuZXcgaWFtLlBvbGljeURvY3VtZW50KHtcbiAgICAgICAgICBzdGF0ZW1lbnRzOiBbXG4gICAgICAgICAgICBuZXcgaWFtLlBvbGljeVN0YXRlbWVudCh7XG4gICAgICAgICAgICAgIGVmZmVjdDogaWFtLkVmZmVjdC5BTExPVyxcbiAgICAgICAgICAgICAgYWN0aW9uczogWydzMzpHZXRSZXBsaWNhdGlvbkNvbmZpZ3VyYXRpb24nLCAnczM6TGlzdEJ1Y2tldCddLFxuICAgICAgICAgICAgICByZXNvdXJjZXM6IFsnKiddLFxuICAgICAgICAgICAgfSksXG4gICAgICAgICAgICBuZXcgaWFtLlBvbGljeVN0YXRlbWVudCh7XG4gICAgICAgICAgICAgIGVmZmVjdDogaWFtLkVmZmVjdC5BTExPVyxcbiAgICAgICAgICAgICAgYWN0aW9uczogW1xuICAgICAgICAgICAgICAgICdzMzpHZXRPYmplY3RWZXJzaW9uRm9yUmVwbGljYXRpb24nLFxuICAgICAgICAgICAgICAgICdzMzpHZXRPYmplY3RWZXJzaW9uQWNsJyxcbiAgICAgICAgICAgICAgICAnczM6R2V0T2JqZWN0VmVyc2lvblRhZ2dpbmcnLFxuICAgICAgICAgICAgICBdLFxuICAgICAgICAgICAgICByZXNvdXJjZXM6IFsnKiddLFxuICAgICAgICAgICAgfSksXG4gICAgICAgICAgICBuZXcgaWFtLlBvbGljeVN0YXRlbWVudCh7XG4gICAgICAgICAgICAgIGVmZmVjdDogaWFtLkVmZmVjdC5BTExPVyxcbiAgICAgICAgICAgICAgYWN0aW9uczogW1xuICAgICAgICAgICAgICAgICdzMzpSZXBsaWNhdGVPYmplY3QnLFxuICAgICAgICAgICAgICAgICdzMzpSZXBsaWNhdGVEZWxldGUnLFxuICAgICAgICAgICAgICAgICdzMzpSZXBsaWNhdGVUYWdzJyxcbiAgICAgICAgICAgICAgXSxcbiAgICAgICAgICAgICAgcmVzb3VyY2VzOiBbJyonXSxcbiAgICAgICAgICAgIH0pLFxuICAgICAgICAgIF0sXG4gICAgICAgIH0pLFxuICAgICAgfSxcbiAgICB9KTtcblxuICAgIC8vIEVLUyBDbHVzdGVyIFNlcnZpY2UgUm9sZSAoQ29tbWVudGVkIG91dCBmb3Igc2ltcGxpZmllZCBkZXBsb3ltZW50KVxuICAgIC8vIHRoaXMuZWtzQ2x1c3RlclJvbGUgPSBuZXcgaWFtLlJvbGUodGhpcywgJ0Vrc0NsdXN0ZXJSb2xlJywge1xuICAgIC8vICAgcm9sZU5hbWU6IGBla3MtY2x1c3Rlci1yb2xlLSR7cHJvcHMuZW52aXJvbm1lbnRTdWZmaXh9YCxcbiAgICAvLyAgIGFzc3VtZWRCeTogbmV3IGlhbS5TZXJ2aWNlUHJpbmNpcGFsKCdla3MuYW1hem9uYXdzLmNvbScpLFxuICAgIC8vICAgbWFuYWdlZFBvbGljaWVzOiBbXG4gICAgLy8gICAgIGlhbS5NYW5hZ2VkUG9saWN5LmZyb21Bd3NNYW5hZ2VkUG9saWN5TmFtZSgnQW1hem9uRUtTQ2x1c3RlclBvbGljeScpLFxuICAgIC8vICAgXSxcbiAgICAvLyB9KTtcblxuICAgIC8vIC8vIEVLUyBOb2RlIEdyb3VwIFJvbGUgKENvbW1lbnRlZCBvdXQgZm9yIHNpbXBsaWZpZWQgZGVwbG95bWVudClcbiAgICAvLyB0aGlzLmVrc05vZGVHcm91cFJvbGUgPSBuZXcgaWFtLlJvbGUodGhpcywgJ0Vrc05vZGVHcm91cFJvbGUnLCB7XG4gICAgLy8gICByb2xlTmFtZTogYGVrcy1ub2RlLWdyb3VwLXJvbGUtJHtwcm9wcy5lbnZpcm9ubWVudFN1ZmZpeH1gLFxuICAgIC8vICAgYXNzdW1lZEJ5OiBuZXcgaWFtLlNlcnZpY2VQcmluY2lwYWwoJ2VjMi5hbWF6b25hd3MuY29tJyksXG4gICAgLy8gICBtYW5hZ2VkUG9saWNpZXM6IFtcbiAgICAvLyAgICAgaWFtLk1hbmFnZWRQb2xpY3kuZnJvbUF3c01hbmFnZWRQb2xpY3lOYW1lKCdBbWF6b25FS1NXb3JrZXJOb2RlUG9saWN5JyksXG4gICAgLy8gICAgIGlhbS5NYW5hZ2VkUG9saWN5LmZyb21Bd3NNYW5hZ2VkUG9saWN5TmFtZSgnQW1hem9uRUtTX0NOSV9Qb2xpY3knKSxcbiAgICAvLyAgICAgaWFtLk1hbmFnZWRQb2xpY3kuZnJvbUF3c01hbmFnZWRQb2xpY3lOYW1lKFxuICAgIC8vICAgICAgICdBbWF6b25FQzJDb250YWluZXJSZWdpc3RyeVJlYWRPbmx5J1xuICAgIC8vICAgICApLFxuICAgIC8vICAgXSxcbiAgICAvLyB9KTtcblxuICAgIC8vIENsb3VkV2F0Y2ggTG9nZ2luZyBSb2xlIChpZiBsb2dnaW5nIGVuYWJsZWQpXG4gICAgaWYgKHByb3BzLmVuYWJsZUxvZ2dpbmcpIHtcbiAgICAgIHRoaXMubG9nZ2luZ1JvbGUgPSBuZXcgaWFtLlJvbGUodGhpcywgJ0Nsb3VkV2F0Y2hMb2dnaW5nUm9sZScsIHtcbiAgICAgICAgcm9sZU5hbWU6IGBjbG91ZHdhdGNoLWxvZ2dpbmctcm9sZS0ke3Byb3BzLmVudmlyb25tZW50U3VmZml4fWAsXG4gICAgICAgIGFzc3VtZWRCeTogbmV3IGlhbS5TZXJ2aWNlUHJpbmNpcGFsKCdsb2dzLmFtYXpvbmF3cy5jb20nKSxcbiAgICAgICAgaW5saW5lUG9saWNpZXM6IHtcbiAgICAgICAgICBMb2dnaW5nUG9saWN5OiBuZXcgaWFtLlBvbGljeURvY3VtZW50KHtcbiAgICAgICAgICAgIHN0YXRlbWVudHM6IFtcbiAgICAgICAgICAgICAgbmV3IGlhbS5Qb2xpY3lTdGF0ZW1lbnQoe1xuICAgICAgICAgICAgICAgIGVmZmVjdDogaWFtLkVmZmVjdC5BTExPVyxcbiAgICAgICAgICAgICAgICBhY3Rpb25zOiBbXG4gICAgICAgICAgICAgICAgICAnbG9nczpDcmVhdGVMb2dHcm91cCcsXG4gICAgICAgICAgICAgICAgICAnbG9nczpDcmVhdGVMb2dTdHJlYW0nLFxuICAgICAgICAgICAgICAgICAgJ2xvZ3M6UHV0TG9nRXZlbnRzJyxcbiAgICAgICAgICAgICAgICAgICdsb2dzOkRlc2NyaWJlTG9nU3RyZWFtcycsXG4gICAgICAgICAgICAgICAgICAnbG9nczpEZXNjcmliZUxvZ0dyb3VwcycsXG4gICAgICAgICAgICAgICAgXSxcbiAgICAgICAgICAgICAgICByZXNvdXJjZXM6IFsnKiddLFxuICAgICAgICAgICAgICB9KSxcbiAgICAgICAgICAgIF0sXG4gICAgICAgICAgfSksXG4gICAgICAgIH0sXG4gICAgICB9KTtcbiAgICB9XG5cbiAgICAvLyBBZGQgY29tbW9uIHRhZ3NcbiAgICBjb25zdCBhbGxSb2xlcyA9IFt0aGlzLnMzUmVwbGljYXRpb25Sb2xlXTtcbiAgICAvLyBpZiAodGhpcy5la3NDbHVzdGVyUm9sZSkgYWxsUm9sZXMucHVzaCh0aGlzLmVrc0NsdXN0ZXJSb2xlKTtcbiAgICAvLyBpZiAodGhpcy5la3NOb2RlR3JvdXBSb2xlKSBhbGxSb2xlcy5wdXNoKHRoaXMuZWtzTm9kZUdyb3VwUm9sZSk7XG4gICAgaWYgKHRoaXMubG9nZ2luZ1JvbGUpIGFsbFJvbGVzLnB1c2godGhpcy5sb2dnaW5nUm9sZSk7XG5cbiAgICBhbGxSb2xlcy5mb3JFYWNoKHJvbGUgPT4ge1xuICAgICAgcm9sZS5ub2RlLmFkZE1ldGFkYXRhKCdFbnZpcm9ubWVudCcsIHByb3BzLmVudmlyb25tZW50U3VmZml4KTtcbiAgICAgIHJvbGUubm9kZS5hZGRNZXRhZGF0YSgnQ29tcG9uZW50JywgJ0lBTScpO1xuICAgIH0pO1xuICB9XG59XG4iXX0=