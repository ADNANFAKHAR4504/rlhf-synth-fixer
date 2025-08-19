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
exports.EksConstruct = void 0;
const eks = __importStar(require("aws-cdk-lib/aws-eks"));
const ec2 = __importStar(require("aws-cdk-lib/aws-ec2"));
const iam = __importStar(require("aws-cdk-lib/aws-iam"));
const cdk = __importStar(require("aws-cdk-lib"));
const constructs_1 = require("constructs");
const lambda_layer_kubectl_v29_1 = require("@aws-cdk/lambda-layer-kubectl-v29");
class EksConstruct extends constructs_1.Construct {
    cluster;
    nodeGroup;
    constructor(scope, id, props) {
        super(scope, id);
        // Create EKS cluster
        this.cluster = new eks.Cluster(this, 'EksCluster', {
            clusterName: `tap-cluster-${props.environmentSuffix}`,
            version: eks.KubernetesVersion.V1_29,
            role: props.clusterRole,
            vpc: props.vpc,
            vpcSubnets: [
                {
                    subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
                },
            ],
            endpointAccess: eks.EndpointAccess.PUBLIC_AND_PRIVATE,
            defaultCapacity: 0, // We'll use managed node groups
            outputClusterName: true,
            outputConfigCommand: true,
            kubectlLayer: new lambda_layer_kubectl_v29_1.KubectlV29Layer(this, 'KubectlLayer'),
        });
        // Create managed node group
        this.nodeGroup = new eks.Nodegroup(this, 'NodeGroup', {
            cluster: this.cluster,
            nodegroupName: `tap-nodes-${props.environmentSuffix}`,
            nodeRole: props.nodeGroupRole,
            instanceTypes: [
                props.environmentSuffix === 'prod'
                    ? ec2.InstanceType.of(ec2.InstanceClass.M5, ec2.InstanceSize.LARGE)
                    : ec2.InstanceType.of(ec2.InstanceClass.T3, ec2.InstanceSize.MEDIUM),
            ],
            minSize: props.environmentSuffix === 'prod' ? 2 : 1,
            maxSize: props.environmentSuffix === 'prod' ? 10 : 3,
            desiredSize: props.environmentSuffix === 'prod' ? 3 : 2,
            capacityType: props.environmentSuffix === 'prod'
                ? eks.CapacityType.ON_DEMAND
                : eks.CapacityType.SPOT,
            subnets: {
                subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
            },
            tags: {
                Environment: props.environmentSuffix,
                'kubernetes.io/cluster-autoscaler/enabled': 'true',
                [`kubernetes.io/cluster-autoscaler/tap-cluster-${props.environmentSuffix}`]: 'owned',
            },
        });
        // Enable EKS Dashboard integration if requested
        if (props.enableDashboard) {
            // Add necessary IAM permissions for EKS Dashboard
            const dashboardPolicy = new iam.Policy(this, 'EksDashboardPolicy', {
                policyName: `eks-dashboard-policy-${props.environmentSuffix}`,
                statements: [
                    new iam.PolicyStatement({
                        effect: iam.Effect.ALLOW,
                        actions: [
                            'eks:DescribeCluster',
                            'eks:ListClusters',
                            'eks:DescribeNodegroup',
                            'eks:ListNodegroups',
                            'eks:DescribeAddon',
                            'eks:ListAddons',
                            'organizations:ListAccounts',
                            'organizations:DescribeOrganization',
                        ],
                        resources: ['*'],
                    }),
                ],
            });
            props.clusterRole.attachInlinePolicy(dashboardPolicy);
        }
        // Install AWS Load Balancer Controller
        this.cluster.addHelmChart('AwsLoadBalancerController', {
            chart: 'aws-load-balancer-controller',
            repository: 'https://aws.github.io/eks-charts',
            namespace: 'kube-system',
            release: 'aws-load-balancer-controller',
            version: '1.8.1',
            values: {
                clusterName: this.cluster.clusterName,
                serviceAccount: {
                    create: false,
                    name: 'aws-load-balancer-controller',
                },
                region: cdk.Stack.of(this).region,
                vpcId: props.vpc.vpcId,
            },
        });
        // Create service account for AWS Load Balancer Controller
        const lbControllerServiceAccount = this.cluster.addServiceAccount('AwsLoadBalancerControllerServiceAccount', {
            name: 'aws-load-balancer-controller',
            namespace: 'kube-system',
        });
        lbControllerServiceAccount.role.addManagedPolicy(iam.ManagedPolicy.fromAwsManagedPolicyName('ElasticLoadBalancingFullAccess'));
        // Add tags
        this.cluster.node.addMetadata('Environment', props.environmentSuffix);
        this.cluster.node.addMetadata('Component', 'EKS');
        this.nodeGroup.node.addMetadata('Environment', props.environmentSuffix);
        this.nodeGroup.node.addMetadata('Component', 'EKS-NodeGroup');
    }
}
exports.EksConstruct = EksConstruct;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZWtzLWNvbnN0cnVjdC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbImVrcy1jb25zdHJ1Y3QudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBQUEseURBQTJDO0FBQzNDLHlEQUEyQztBQUMzQyx5REFBMkM7QUFDM0MsaURBQW1DO0FBQ25DLDJDQUF1QztBQUN2QyxnRkFBb0U7QUFVcEUsTUFBYSxZQUFhLFNBQVEsc0JBQVM7SUFDekIsT0FBTyxDQUFjO0lBQ3JCLFNBQVMsQ0FBZ0I7SUFFekMsWUFBWSxLQUFnQixFQUFFLEVBQVUsRUFBRSxLQUF3QjtRQUNoRSxLQUFLLENBQUMsS0FBSyxFQUFFLEVBQUUsQ0FBQyxDQUFDO1FBRWpCLHFCQUFxQjtRQUNyQixJQUFJLENBQUMsT0FBTyxHQUFHLElBQUksR0FBRyxDQUFDLE9BQU8sQ0FBQyxJQUFJLEVBQUUsWUFBWSxFQUFFO1lBQ2pELFdBQVcsRUFBRSxlQUFlLEtBQUssQ0FBQyxpQkFBaUIsRUFBRTtZQUNyRCxPQUFPLEVBQUUsR0FBRyxDQUFDLGlCQUFpQixDQUFDLEtBQUs7WUFDcEMsSUFBSSxFQUFFLEtBQUssQ0FBQyxXQUFXO1lBQ3ZCLEdBQUcsRUFBRSxLQUFLLENBQUMsR0FBRztZQUNkLFVBQVUsRUFBRTtnQkFDVjtvQkFDRSxVQUFVLEVBQUUsR0FBRyxDQUFDLFVBQVUsQ0FBQyxtQkFBbUI7aUJBQy9DO2FBQ0Y7WUFDRCxjQUFjLEVBQUUsR0FBRyxDQUFDLGNBQWMsQ0FBQyxrQkFBa0I7WUFDckQsZUFBZSxFQUFFLENBQUMsRUFBRSxnQ0FBZ0M7WUFDcEQsaUJBQWlCLEVBQUUsSUFBSTtZQUN2QixtQkFBbUIsRUFBRSxJQUFJO1lBQ3pCLFlBQVksRUFBRSxJQUFJLDBDQUFlLENBQUMsSUFBSSxFQUFFLGNBQWMsQ0FBQztTQUN4RCxDQUFDLENBQUM7UUFFSCw0QkFBNEI7UUFDNUIsSUFBSSxDQUFDLFNBQVMsR0FBRyxJQUFJ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Q2IsSUFBSSxFQUFFLDhCQUE4QjtpQkFDckM7Z0JBQ0QsTUFBTSxFQUFFLEdBQUcsQ0FBQyxLQUFLLENBQUMsRUFBRSxDQUFDLElBQUksQ0FBQyxDQUFDLE1BQU07Z0JBQ2pDLEtBQUssRUFBRSxLQUFLLENBQUMsR0FBRyxDQUFDLEtBQUs7YUFDdkI7U0FDRixDQUFDLENBQUM7UUFFSCwwREFBMEQ7UUFDMUQsTUFBTSwwQkFBMEIsR0FBRyxJQUFJLENBQUMsT0FBTyxDQUFDLGlCQUFpQixDQUMvRCx5Q0FBeUMsRUFDekM7WUFDRSxJQUFJLEVBQUUsOEJBQThCO1lBQ3BDLFNBQVMsRUFBRSxhQUFhO1NBQ3pCLENBQ0YsQ0FBQztRQUVGLDBCQUEwQixDQUFDLElBQUksQ0FBQyxnQkFBZ0IsQ0FDOUMsR0FBRyxDQUFDLGFBQWEsQ0FBQyx3QkFBd0IsQ0FDeEMsZ0NBQWdDLENBQ2pDLENBQ0YsQ0FBQztRQUVGLFdBQVc7UUFDWCxJQUFJLENBQUMsT0FBTyxDQUFDLElBQUksQ0FBQyxXQUFXLENBQUMsYUFBYSxFQUFFLEtBQUssQ0FBQyxpQkFBaUIsQ0FBQyxDQUFDO1FBQ3RFLElBQUksQ0FBQyxPQUFPLENBQUMsSUFBSSxDQUFDLFdBQVcsQ0FBQyxXQUFXLEVBQUUsS0FBSyxDQUFDLENBQUM7UUFDbEQsSUFBSSxDQUFDLFNBQVMsQ0FBQyxJQUFJLENBQUMsV0FBVyxDQUFDLGFBQWEsRUFBRSxLQUFLLENBQUMsaUJBQWlCLENBQUMsQ0FBQztRQUN4RSxJQUFJLENBQUMsU0FBUyxDQUFDLElBQUksQ0FBQyxXQUFXLENBQUMsV0FBVyxFQUFFLGVBQWUsQ0FBQyxDQUFDO0lBQ2hFLENBQUM7Q0FDRjtBQXRIRCxvQ0FzSEMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgKiBhcyBla3MgZnJvbSAnYXdzLWNkay1saWIvYXdzLWVrcyc7XG5pbXBvcnQgKiBhcyBlYzIgZnJvbSAnYXdzLWNkay1saWIvYXdzLWVjMic7XG5pbXBvcnQgKiBhcyBpYW0gZnJvbSAnYXdzLWNkay1saWIvYXdzLWlhbSc7XG5pbXBvcnQgKiBhcyBjZGsgZnJvbSAnYXdzLWNkay1saWInO1xuaW1wb3J0IHsgQ29uc3RydWN0IH0gZnJvbSAnY29uc3RydWN0cyc7XG5pbXBvcnQgeyBLdWJlY3RsVjI5TGF5ZXIgfSBmcm9tICdAYXdzLWNkay9sYW1iZGEtbGF5ZXIta3ViZWN0bC12MjknO1xuXG5leHBvcnQgaW50ZXJmYWNlIEVrc0NvbnN0cnVjdFByb3BzIHtcbiAgZW52aXJvbm1lbnRTdWZmaXg6IHN0cmluZztcbiAgdnBjOiBlYzIuVnBjO1xuICBjbHVzdGVyUm9sZTogaWFtLlJvbGU7XG4gIG5vZGVHcm91cFJvbGU6IGlhbS5Sb2xlO1xuICBlbmFibGVEYXNoYm9hcmQ6IGJvb2xlYW47XG59XG5cbmV4cG9ydCBjbGFzcyBFa3NDb25zdHJ1Y3QgZXh0ZW5kcyBDb25zdHJ1Y3Qge1xuICBwdWJsaWMgcmVhZG9ubHkgY2x1c3RlcjogZWtzLkNsdXN0ZXI7XG4gIHB1YmxpYyByZWFkb25seSBub2RlR3JvdXA6IGVrcy5Ob2RlZ3JvdXA7XG5cbiAgY29uc3RydWN0b3Ioc2NvcGU6IENvbnN0cnVjdCwgaWQ6IHN0cmluZywgcHJvcHM6IEVrc0NvbnN0cnVjdFByb3BzKSB7XG4gICAgc3VwZXIoc2NvcGUsIGlkKTtcblxuICAgIC8vIENyZWF0ZSBFS1MgY2x1c3RlclxuICAgIHRoaXMuY2x1c3RlciA9IG5ldyBla3MuQ2x1c3Rlcih0aGlzLCAnRWtzQ2x1c3RlcicsIHtcbiAgICAgIGNsdXN0ZXJOYW1lOiBgdGFwLWNsdXN0ZXItJHtwcm9wcy5lbnZpcm9ubWVudFN1ZmZpeH1gLFxuICAgICAgdmVyc2lvbjogZWtzLkt1YmVybmV0ZXNWZXJzaW9uLlYxXzI5LFxuICAgICAgcm9sZTogcHJvcHMuY2x1c3RlclJvbGUsXG4gICAgICB2cGM6IHByb3BzLnZwYyxcbiAgICAgIHZwY1N1Ym5ldHM6IFtcbiAgICAgICAge1xuICAgICAgICAgIHN1Ym5ldFR5cGU6IGVjMi5TdWJuZXRUeXBlLlBSSVZBVEVfV0lUSF9FR1JFU1MsXG4gICAgICAgIH0sXG4gICAgICBdLFxuICAgICAgZW5kcG9pbnRBY2Nlc3M6IGVrcy5FbmRwb2ludEFjY2Vzcy5QVUJMSUNfQU5EX1BSSVZBVEUsXG4gICAgICBkZWZhdWx0Q2FwYWNpdHk6IDAsIC8vIFdlJ2xsIHVzZSBtYW5hZ2VkIG5vZGUgZ3JvdXBzXG4gICAgICBvdXRwdXRDbHVzdGVyTmFtZTogdHJ1ZSxcbiAgICAgIG91dHB1dENvbmZpZ0NvbW1hbmQ6IHRydWUsXG4gICAgICBrdWJlY3RsTGF5ZXI6IG5ldyBLdWJlY3RsVjI5TGF5ZXIodGhpcywgJ0t1YmVjdGxMYXllcicpLFxuICAgIH0pO1xuXG4gICAgLy8gQ3JlYXRlIG1hbmFnZWQgbm9kZSBncm91cFxuICAgIHRoaXMubm9kZUdyb3VwID0gbmV3IGVrcy5Ob2RlZ3JvdXAodGhpcywgJ05vZGVHcm91cCcsIHtcbiAgICAgIGNsdXN0ZXI6IHRoaXMuY2x1c3RlcixcbiAgICAgIG5vZGVncm91cE5hbWU6IGB0YXAtbm9kZXMtJHtwcm9wcy5lbnZpcm9ubWVudFN1ZmZpeH1gLFxuICAgICAgbm9kZVJvbGU6IHByb3BzLm5vZGVHcm91cFJvbGUsXG4gICAgICBpbnN0YW5jZVR5cGVzOiBbXG4gICAgICAgIHByb3BzLmVudmlyb25tZW50U3VmZml4ID09PSAncHJvZCdcbiAgICAgICAgICA/IGVjMi5JbnN0YW5jZVR5cGUub2YoZWMyLkluc3RhbmNlQ2xhc3MuTTUsIGVjMi5JbnN0YW5jZVNpemUuTEFSR0UpXG4gICAgICAgICAgOiBlYzIuSW5zdGFuY2VUeXBlLm9mKGVjMi5JbnN0YW5jZUNsYXNzLlQzLCBlYzIuSW5zdGFuY2VTaXplLk1FRElVTSksXG4gICAgICBdLFxuICAgICAgbWluU2l6ZTogcHJvcHMuZW52aXJvbm1lbnRTdWZmaXggPT09ICdwcm9kJyA/IDIgOiAxLFxuICAgICAgbWF4U2l6ZTogcHJvcHMuZW52aXJvbm1lbnRTdWZmaXggPT09ICdwcm9kJyA/IDEwIDogMyxcbiAgICAgIGRlc2lyZWRTaXplOiBwcm9wcy5lbnZpcm9ubWVudFN1ZmZpeCA9PT0gJ3Byb2QnID8gMyA6IDIsXG4gICAgICBjYXBhY2l0eVR5cGU6XG4gICAgICAgIHByb3BzLmVudmlyb25tZW50U3VmZml4ID09PSAncHJvZCdcbiAgICAgICAgICA/IGVrcy5DYXBhY2l0eVR5cGUuT05fREVNQU5EXG4gICAgICAgICAgOiBla3MuQ2FwYWNpdHlUeXBlLlNQT1QsXG4gICAgICBzdWJuZXRzOiB7XG4gICAgICAgIHN1Ym5ldFR5cGU6IGVjMi5TdWJuZXRUeXBlLlBSSVZBVEVfV0lUSF9FR1JFU1MsXG4gICAgICB9LFxuICAgICAgdGFnczoge1xuICAgICAgICBFbnZpcm9ubWVudDogcHJvcHMuZW52aXJvbm1lbnRTdWZmaXgsXG4gICAgICAgICdrdWJlcm5ldGVzLmlvL2NsdXN0ZXItYXV0b3NjYWxlci9lbmFibGVkJzogJ3RydWUnLFxuICAgICAgICBbYGt1YmVybmV0ZXMuaW8vY2x1c3Rlci1hdXRvc2NhbGVyL3RhcC1jbHVzdGVyLSR7cHJvcHMuZW52aXJvbm1lbnRTdWZmaXh9YF06XG4gICAgICAgICAgJ293bmVkJyxcbiAgICAgIH0sXG4gICAgfSk7XG5cbiAgICAvLyBFbmFibGUgRUtTIERhc2hib2FyZCBpbnRlZ3JhdGlvbiBpZiByZXF1ZXN0ZWRcbiAgICBpZiAocHJvcHMuZW5hYmxlRGFzaGJvYXJkKSB7XG4gICAgICAvLyBBZGQgbmVjZXNzYXJ5IElBTSBwZXJtaXNzaW9ucyBmb3IgRUtTIERhc2hib2FyZFxuICAgICAgY29uc3QgZGFzaGJvYXJkUG9saWN5ID0gbmV3IGlhbS5Qb2xpY3kodGhpcywgJ0Vrc0Rhc2hib2FyZFBvbGljeScsIHtcbiAgICAgICAgcG9saWN5TmFtZTogYGVrcy1kYXNoYm9hcmQtcG9saWN5LSR7cHJvcHMuZW52aXJvbm1lbnRTdWZmaXh9YCxcbiAgICAgICAgc3RhdGVtZW50czogW1xuICAgICAgICAgIG5ldyBpYW0uUG9saWN5U3RhdGVtZW50KHtcbiAgICAgICAgICAgIGVmZmVjdDogaWFtLkVmZmVjdC5BTExPVyxcbiAgICAgICAgICAgIGFjdGlvbnM6IFtcbiAgICAgICAgICAgICAgJ2VrczpEZXNjcmliZUNsdXN0ZXInLFxuICAgICAgICAgICAgICAnZWtzOkxpc3RDbHVzdGVycycsXG4gICAgICAgICAgICAgICdla3M6RGVzY3JpYmVOb2RlZ3JvdXAnLFxuICAgICAgICAgICAgICAnZWtzOkxpc3ROb2RlZ3JvdXBzJyxcbiAgICAgICAgICAgICAgJ2VrczpEZXNjcmliZUFkZG9uJyxcbiAgICAgICAgICAgICAgJ2VrczpMaXN0QWRkb25zJyxcbiAgICAgICAgICAgICAgJ29yZ2FuaXphdGlvbnM6TGlzdEFjY291bnRzJyxcbiAgICAgICAgICAgICAgJ29yZ2FuaXphdGlvbnM6RGVzY3JpYmVPcmdhbml6YXRpb24nLFxuICAgICAgICAgICAgXSxcbiAgICAgICAgICAgIHJlc291cmNlczogWycqJ10sXG4gICAgICAgICAgfSksXG4gICAgICAgIF0sXG4gICAgICB9KTtcblxuICAgICAgcHJvcHMuY2x1c3RlclJvbGUuYXR0YWNoSW5saW5lUG9saWN5KGRhc2hib2FyZFBvbGljeSk7XG4gICAgfVxuXG4gICAgLy8gSW5zdGFsbCBBV1MgTG9hZCBCYWxhbmNlciBDb250cm9sbGVyXG4gICAgdGhpcy5jbHVzdGVyLmFkZEhlbG1DaGFydCgnQXdzTG9hZEJhbGFuY2VyQ29udHJvbGxlcicsIHtcbiAgICAgIGNoYXJ0OiAnYXdzLWxvYWQtYmFsYW5jZXItY29udHJvbGxlcicsXG4gICAgICByZXBvc2l0b3J5OiAnaHR0cHM6Ly9hd3MuZ2l0aHViLmlvL2Vrcy1jaGFydHMnLFxuICAgICAgbmFtZXNwYWNlOiAna3ViZS1zeXN0ZW0nLFxuICAgICAgcmVsZWFzZTogJ2F3cy1sb2FkLWJhbGFuY2VyLWNvbnRyb2xsZXInLFxuICAgICAgdmVyc2lvbjogJzEuOC4xJyxcbiAgICAgIHZhbHVlczoge1xuICAgICAgICBjbHVzdGVyTmFtZTogdGhpcy5jbHVzdGVyLmNsdXN0ZXJOYW1lLFxuICAgICAgICBzZXJ2aWNlQWNjb3VudDoge1xuICAgICAgICAgIGNyZWF0ZTogZmFsc2UsXG4gICAgICAgICAgbmFtZTogJ2F3cy1sb2FkLWJhbGFuY2VyLWNvbnRyb2xsZXInLFxuICAgICAgICB9LFxuICAgICAgICByZWdpb246IGNkay5TdGFjay5vZih0aGlzKS5yZWdpb24sXG4gICAgICAgIHZwY0lkOiBwcm9wcy52cGMudnBjSWQsXG4gICAgICB9LFxuICAgIH0pO1xuXG4gICAgLy8gQ3JlYXRlIHNlcnZpY2UgYWNjb3VudCBmb3IgQVdTIExvYWQgQmFsYW5jZXIgQ29udHJvbGxlclxuICAgIGNvbnN0IGxiQ29udHJvbGxlclNlcnZpY2VBY2NvdW50ID0gdGhpcy5jbHVzdGVyLmFkZFNlcnZpY2VBY2NvdW50KFxuICAgICAgJ0F3c0xvYWRCYWxhbmNlckNvbnRyb2xsZXJTZXJ2aWNlQWNjb3VudCcsXG4gICAgICB7XG4gICAgICAgIG5hbWU6ICdhd3MtbG9hZC1iYWxhbmNlci1jb250cm9sbGVyJyxcbiAgICAgICAgbmFtZXNwYWNlOiAna3ViZS1zeXN0ZW0nLFxuICAgICAgfVxuICAgICk7XG5cbiAgICBsYkNvbnRyb2xsZXJTZXJ2aWNlQWNjb3VudC5yb2xlLmFkZE1hbmFnZWRQb2xpY3koXG4gICAgICBpYW0uTWFuYWdlZFBvbGljeS5mcm9tQXdzTWFuYWdlZFBvbGljeU5hbWUoXG4gICAgICAgICdFbGFzdGljTG9hZEJhbGFuY2luZ0Z1bGxBY2Nlc3MnXG4gICAgICApXG4gICAgKTtcblxuICAgIC8vIEFkZCB0YWdzXG4gICAgdGhpcy5jbHVzdGVyLm5vZGUuYWRkTWV0YWRhdGEoJ0Vudmlyb25tZW50JywgcHJvcHMuZW52aXJvbm1lbnRTdWZmaXgpO1xuICAgIHRoaXMuY2x1c3Rlci5ub2RlLmFkZE1ldGFkYXRhKCdDb21wb25lbnQnLCAnRUtTJyk7XG4gICAgdGhpcy5ub2RlR3JvdXAubm9kZS5hZGRNZXRhZGF0YSgnRW52aXJvbm1lbnQnLCBwcm9wcy5lbnZpcm9ubWVudFN1ZmZpeCk7XG4gICAgdGhpcy5ub2RlR3JvdXAubm9kZS5hZGRNZXRhZGF0YSgnQ29tcG9uZW50JywgJ0VLUy1Ob2RlR3JvdXAnKTtcbiAgfVxufVxuIl19