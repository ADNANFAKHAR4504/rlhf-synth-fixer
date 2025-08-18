"use strict";
/**
 * Identity and Access Management Infrastructure Component
 * Handles IAM roles, policies, and instance profiles for AWS Elastic Beanstalk
 */
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
exports.IdentityInfrastructure = void 0;
const pulumi = __importStar(require("@pulumi/pulumi"));
const aws = __importStar(require("@pulumi/aws"));
const pulumi_1 = require("@pulumi/pulumi");
class IdentityInfrastructure extends pulumi_1.ComponentResource {
    tags;
    stack;
    ebServiceRole;
    ebInstanceRole;
    ebInstancePolicy;
    ebInstanceProfile;
    autoscalingRole;
    autoscalingPolicy;
    constructor(name, args, opts) {
        super('nova:infrastructure:Identity', name, {}, opts);
        this.tags = args.tags;
        this.stack = pulumi.getStack();
        this.ebServiceRole = this.createEbServiceRole();
        this.ebInstanceRole = this.createEbInstanceRole();
        this.ebInstancePolicy = this.createEbInstancePolicy();
        this.ebInstanceProfile = this.createEbInstanceProfile();
        this.autoscalingRole = this.createAutoscalingRole();
        this.autoscalingPolicy = this.createAutoscalingPolicy();
        this.registerOutputs({
            ebServiceRoleArn: this.ebServiceRole.arn,
            ebInstanceRoleArn: this.ebInstanceRole.arn,
            ebInstanceProfileName: this.ebInstanceProfile.name,
            autoscalingRoleArn: this.autoscalingRole.arn,
        });
    }
    /**
     * Create Elastic Beanstalk service role
     */
    createEbServiceRole() {
        return new aws.iam.Role('eb-service-role', {
            name: `nova-eb-service-role-${this.stack}`,
            description: 'Service role for Elastic Beanstalk',
            assumeRolePolicy: JSON.stringify({
                Version: '2012-10-17',
                Statement: [
                    {
                        Effect: 'Allow',
                        Principal: { Service: 'elasticbeanstalk.amazonaws.com' },
                        Action: 'sts:AssumeRole',
                        Condition: {
                            StringEquals: {
                                'sts:ExternalId': 'elasticbeanstalk',
                            },
                        },
                    },
                ],
            }),
            managedPolicyArns: [
                'arn:aws:iam::aws:policy/service-role/AWSElasticBeanstalkEnhancedHealth',
                'arn:aws:iam::aws:policy/AWSElasticBeanstalkManagedUpdatesCustomerRolePolicy',
                'arn:aws:iam::aws:policy/service-role/AWSElasticBeanstalkService',
            ],
            tags: this.tags,
        }, { parent: this });
    }
    /**
     * Create EC2 instance role for Elastic Beanstalk instances
     */
    createEbInstanceRole() {
        return new aws.iam.Role('eb-instance-role', {
            name: `nova-eb-instance-role-${this.stack}`,
            description: 'Instance role for Elastic Beanstalk EC2 instances',
            assumeRolePolicy: JSON.stringify({
                Version: '2012-10-17',
                Statement: [
                    {
                        Effect: 'Allow',
                        Principal: { Service: 'ec2.amazonaws.com' },
                        Action: 'sts:AssumeRole',
                    },
                ],
            }),
            managedPolicyArns: [
                'arn:aws:iam::aws:policy/AWSElasticBeanstalkWebTier',
                'arn:aws:iam::aws:policy/AWSElasticBeanstalkMulticontainerDocker',
                'arn:aws:iam::aws:policy/AWSElasticBeanstalkWorkerTier',
            ],
            tags: this.tags,
        }, { parent: this });
    }
    /**
     * Create additional policy for EB instance role
     */
    createEbInstancePolicy() {
        return new aws.iam.RolePolicy('eb-instance-additional-policy', {
            role: this.ebInstanceRole.id,
            name: `NovaEBInstanceAdditionalPolicy-${this.stack}`,
            policy: JSON.stringify({
                Version: '2012-10-17',
                Statement: [
                    {
                        Effect: 'Allow',
                        Action: [
                            'cloudwatch:PutMetricData',
                            'cloudwatch:GetMetricStatistics',
                            'cloudwatch:ListMetrics',
                            'ec2:DescribeInstanceStatus',
                            'ec2:DescribeInstances',
                            'logs:CreateLogGroup',
                            'logs:CreateLogStream',
                            'logs:PutLogEvents',
                            'logs:DescribeLogStreams',
                            'logs:DescribeLogGroups',
                        ],
                        Resource: '*',
                    },
                    {
                        Effect: 'Allow',
                        Action: ['s3:GetObject', 's3:PutObject', 's3:DeleteObject'],
                        Resource: 'arn:aws:s3:::elasticbeanstalk-*/*',
                    },
                    {
                        Effect: 'Allow',
                        Action: ['s3:ListBucket'],
                        Resource: 'arn:aws:s3:::elasticbeanstalk-*',
                    },
                ],
            }),
        }, { parent: this });
    }
    /**
     * Create instance profile for Elastic Beanstalk instances
     */
    createEbInstanceProfile() {
        return new aws.iam.InstanceProfile('eb-instance-profile', {
            name: `nova-eb-instance-profile-${this.stack}`,
            role: this.ebInstanceRole.name,
        }, { parent: this });
    }
    /**
     * Create Auto Scaling service role
     */
    createAutoscalingRole() {
        return new aws.iam.Role('autoscaling-role', {
            name: `nova-autoscaling-role-${this.stack}`,
            description: 'Service role for Auto Scaling',
            assumeRolePolicy: JSON.stringify({
                Version: '2012-10-17',
                Statement: [
                    {
                        Effect: 'Allow',
                        Principal: { Service: 'autoscaling.amazonaws.com' },
                        Action: 'sts:AssumeRole',
                    },
                ],
            }),
            managedPolicyArns: [
                'arn:aws:iam::aws:policy/service-role/AutoScalingNotificationAccessRole',
            ],
            tags: this.tags,
        }, { parent: this });
    }
    /**
     * Create additional policy for Auto Scaling role
     */
    createAutoscalingPolicy() {
        return new aws.iam.RolePolicy('autoscaling-additional-policy', {
            role: this.autoscalingRole.id,
            name: `NovaAutoScalingAdditionalPolicy-${this.stack}`,
            policy: JSON.stringify({
                Version: '2012-10-17',
                Statement: [
                    {
                        Effect: 'Allow',
                        Action: [
                            'ec2:DescribeInstances',
                            'ec2:DescribeInstanceAttribute',
                            'ec2:DescribeKeyPairs',
                            'ec2:DescribeSecurityGroups',
                            'ec2:DescribeSpotInstanceRequests',
                            'ec2:DescribeSpotPriceHistory',
                            'ec2:DescribeVpcClassicLink',
                            'ec2:DescribeVpcs',
                            'ec2:CreateTags',
                            'elasticloadbalancing:DescribeLoadBalancers',
                            'elasticloadbalancing:DescribeInstanceHealth',
                            'elasticloadbalancing:RegisterInstancesWithLoadBalancer',
                            'elasticloadbalancing:DeregisterInstancesFromLoadBalancer',
                            'elasticloadbalancing:DescribeTargetGroups',
                            'elasticloadbalancing:DescribeTargetHealth',
                            'elasticloadbalancing:RegisterTargets',
                            'elasticloadbalancing:DeregisterTargets',
                        ],
                        Resource: '*',
                    },
                ],
            }),
        }, { parent: this });
    }
    // Property getters for accessing the resources
    get ebServiceRoleArn() {
        return this.ebServiceRole.arn;
    }
    get ebInstanceRoleArn() {
        return this.ebInstanceRole.arn;
    }
    get ebInstanceProfileName() {
        return this.ebInstanceProfile.name;
    }
    get autoscalingRoleArn() {
        return this.autoscalingRole.arn;
    }
}
exports.IdentityInfrastructure = IdentityInfrastructure;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaWRlbnRpdHkuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJpZGVudGl0eS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiO0FBQUE7OztHQUdHOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFFSCx1REFBeUM7QUFDekMsaURBQW1DO0FBQ25DLDJDQUE2RTtBQU03RSxNQUFhLHNCQUF1QixTQUFRLDBCQUFpQjtJQUMxQyxJQUFJLENBQXlCO0lBQzdCLEtBQUssQ0FBUztJQUVmLGFBQWEsQ0FBZTtJQUM1QixjQUFjLENBQWU7SUFDN0IsZ0JBQWdCLENBQXFCO0lBQ3JDLGlCQUFpQixDQUEwQjtJQUMzQyxlQUFlLENBQWU7SUFDOUIsaUJBQWlCLENBQXFCO0lBRXRELFlBQ0UsSUFBWSxFQUNaLElBQWdDLEVBQ2hDLElBQStCO1FBRS9CLEtBQUssQ0FBQyw4QkFBOEIsRUFBRSxJQUFJLEVBQUUsRUFBRSxFQUFFLElBQUksQ0FBQyxDQUFDO1FBRXRELElBQUksQ0FBQyxJQUFJLEdBQUcsSUFBSSxDQUFDLElBQUksQ0FBQztRQUN0QixJQUFJLENBQUMsS0FBSyxHQUFHLE1BQU0sQ0FBQyxRQUFRLEVBQUUsQ0FBQztRQUUvQixJQUFJLENBQUMsYUFBYSxHQUFHLElBQUksQ0FBQyxtQkFBbUIsRUFBRSxDQUFDO1FBQ2hELElBQUksQ0FBQyxjQUFjLEdBQUcsSUFBSSxDQUFDLG9CQUFvQixFQUFFLENBQUM7UUFDbEQsSUFBSSxDQUFDLGdCQUFnQixHQUFHLElBQUksQ0FBQyxzQkFBc0IsRUFBRSxDQUFDO1FBQ3RELElBQUksQ0FBQyxpQkFBaUIsR0FBRyxJQUFJLENBQUMsdUJBQXVCLEVBQUUsQ0FBQztRQUN4RCxJQUFJLENBQUMsZUFBZSxHQUFHLElBQUksQ0FBQyxxQkFBcUIsRUFBRSxDQUFDO1FBQ3BELElBQUksQ0FBQyxpQkFBaUIsR0FBRyxJQUFJLENBQUMsdUJBQXVCLEVBQUUsQ0FBQztRQUV4RCxJQUFJLENBQUMsZUFBZSxDQUFDO1lBQ25CLGdCQUFnQixFQUFFLElBQUksQ0FBQyxhQUFhLENBQUMsR0FBRztZQUN4QyxpQkFBaUIsRUFBRSxJQUFJLENBQUMsY0FBYyxDQUFDLEdBQUc7WUFDMUMscUJBQXFCLEVBQUUsSUFBSSxDQUFDLGlCQUFpQixDQUFDLElBQUk7WUFDbEQsa0JBQWtCLEVBQUUsSUFBSSxDQUFDLGVBQWUsQ0FBQyxHQUFHO1NBQzdDLENBQUMsQ0FBQztJQUNMLENBQUM7SUFFRDs7T0FFRztJQUNLLG1CQUFtQjtRQUN6QixPQUFPLElBQUksR0FBRyxDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQ3JCLGlCQUFpQixFQUNqQjtZQUNFLElBQUksRUFBRSx3QkFBd0IsSUFBSSxDQUFDLEtBQUssRUFBRTtZQUMxQyxXQUFXLEVBQUUsb0NBQW9DO1lBQ2pELGdCQUFnQixFQUFFLElBQUksQ0FBQyxTQUFTLENBQUM7Z0JBQy9CLE9BQU8sRUFBRSxZQUFZO2dCQUNyQixTQUFTLEVBQUU7b0JBQ1Q7d0JBQ0UsTUFBTSxFQUFFLE9BQU87d0JBQ2YsU0FBUyxFQUFFLEVBQUUsT0FBTyxFQUFFLGdDQUFnQyxFQUFFO3dCQUN4RCxNQUFNLEVBQUUsZ0JBQWdCO3dCQUN4QixTQUFTLEVBQUU7NEJBQ1QsWUFBWSxFQUFFO2dDQUNaLGdCQUFnQixFQUFFLGtCQUFrQjs2QkFDckM7eUJBQ0Y7cUJBQ0Y7aUJBQ0Y7YUFDRixDQUFDO1lBQ0YsaUJBQWlCLEVBQUU7Z0JBQ2pCLHdFQUF3RTtnQkFDeEUsNkVBQTZFO2dCQUM3RSxpRUFBaUU7YUFDbEU7WUFDRCxJQUFJLEVBQUUsSUFBSSxDQUFDLElBQUk7U0FDaEIsRUFDRCxFQUFFLE1BQU0sRUFBRSxJQUFJLEVBQUUsQ0FDakIsQ0FBQztJQUNKLENBQUM7SUFFRDs7T0FFRztJQUNLLG9CQUFvQjtRQUMxQixPQUFPLElBQUksR0FBRyxDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQ3JCLGtCQUFrQixFQUNsQjtZQUNFLElBQUksRUFBRSx5QkFBeUIsSUFBSSxDQUFDLEtBQUssRUFBRTtZQUMzQyxXQUFXLEVBQUUsbURBQW1EO1lBQ2hFLGdCQUFnQixFQUFFLElBQUksQ0FBQyxTQUFTLENBQUM7Z0JBQy9CLE9BQU8sRUFBRSxZQUFZO2dCQUNyQixTQUFTLEVBQUU7b0JBQ1Q7d0JBQ0UsTUFBTSxFQUFFLE9BQU87d0JBQ2YsU0FBUyxFQUFFLEVBQUUsT0FBTyxFQUFFLG1CQUFtQixFQUFFO3dCQUMzQyxNQUFNLEVBQUUsZ0JBQWdCO3FCQUN6QjtpQkFDRjthQUNGLENBQUM7WUFDRixpQkFBaUIsRUFBRTtnQkFDakIsb0RBQW9EO2dCQUNwRCxpRUFBaUU7Z0JBQ2pFLHVEQUF1RDthQUN4RDtZQUNELElBQUksRUFBRSxJQUFJLENBQUMsSUFBSTtTQUNoQixFQUNELEVBQUUsTUFBTSxFQUFFLElBQUksRUFBRSxDQUNqQixDQUFDO0lBQ0osQ0FBQztJQUVEOztPQUVHO0lBQ0ssc0JBQXNCO1FBQzVCLE9BQU8sSUFBSSxHQUFHLENBQUMsR0FBRyxDQUFDLFVBQVUsQ0FDM0IsK0JBQStCLEVBQy9CO1lBQ0UsSUFBSSxFQUFFLElBQUksQ0FBQyxjQUFjLENBQUMsRUFBRTtZQUM1QixJQUFJLEVBQUUsa0NBQWtDLElBQUksQ0FBQyxLQUFLLEVBQUU7WUFDcEQsTUFBTSxFQUFFLElBQUksQ0FBQyxTQUFTLENBQUM7Z0JBQ3JCLE9BQU8sRUFBRSxZQUFZO2dCQUNyQixTQUFTLEVBQUU7b0JBQ1Q7d0JBQ0UsTUFBTSxFQUFFLE9BQU87d0JBQ2YsTUFBTSxFQUFFOzRCQUNOLDBCQUEwQjs0QkFDMUIsZ0NBQWdDOzRCQUNoQyx3QkFBd0I7NEJBQ3hCLDRCQUE0Qjs0QkFDNUIsdUJBQXVCOzRCQUN2QixxQkFBcUI7NEJBQ3JCLHNCQUFzQjs0QkFDdEIsbUJBQW1COzRCQUNuQix5QkFBeUI7NEJBQ3pCLHdCQUF3Qjt5QkFDekI7d0JBQ0QsUUFBUSxFQUFFLEdBQUc7cUJBQ2Q7b0JBQ0Q7d0JBQ0UsTUFBTSxFQUFFLE9BQU87d0JBQ2YsTUFBTSxFQUFFLENBQUMsY0FBYyxFQUFFLGNBQWMsRUFBRSxpQkFBaUIsQ0FBQzt3QkFDM0QsUUFBUSxFQUFFLG1DQUFtQztxQkFDOUM7b0JBQ0Q7d0JBQ0UsTUFBTSxFQUFFLE9BQU87d0JBQ2YsTUFBTSxFQUFFLENBQUMsZUFBZSxDQUFDO3dCQUN6QixRQUFRLEVBQUUsaUNBQWlDO3FCQUM1QztpQkFDRjthQUNGLENBQUM7U0FDSCxFQUNELEVBQUUsTUFBTSxFQUFFLElBQUksRUFBRSxDQUNqQixDQUFDO0lBQ0osQ0FBQztJQUVEOztPQUVHO0lBQ0ssdUJBQXVCO1FBQzdCLE9BQU8sSUFBSSxHQUFHLENBQUMsR0FBRyxDQUFDLGVBQWUsQ0FDaEMscUJBQXFCLEVBQ3JCO1lBQ0UsSUFBSSxFQUFFLDRCQUE0QixJQUFJLENBQUMsS0FBSyxFQUFFO1lBQzlDLElBQUksRUFBRSxJQUFJLENBQUMsY0FBYyxDQUFDLElBQUk7U0FDL0IsRUFDRCxFQUFFLE1BQU0sRUFBRSxJQUFJLEVBQUUsQ0FDakIsQ0FBQztJQUNKLENBQUM7SUFFRDs7T0FFRztJQUNLLHFCQUFxQjtRQUMzQixPQUFPLElBQUksR0FBRyxDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQ3JCLGtCQUFrQixFQUNsQjtZQUNFLElBQUksRUFBRSx5QkFBeUIsSUFBSSxDQUFDLEtBQUssRUFBRTtZQUMzQyxXQUFXLEVBQUUsK0JBQStCO1lBQzVDLGdCQUFnQixFQUFFLElBQUksQ0FBQyxTQUFTLENBQUM7Z0JBQy9CLE9BQU8sRUFBRSxZQUFZO2dCQUNyQixTQUFTLEVBQUU7b0JBQ1Q7d0JBQ0UsTUFBTSxFQUFFLE9BQU87d0JBQ2YsU0FBUyxFQUFFLEVBQUUsT0FBTyxFQUFFLDJCQUEyQixFQUFFO3dCQUNuRCxNQUFNLEVBQUUsZ0JBQWdCO3FCQUN6QjtpQkFDRjthQUNGLENBQUM7WUFDRixpQkFBaUIsRUFBRTtnQkFDakIsd0VBQXdFO2FBQ3pFO1lBQ0QsSUFBSSxFQUFFLElBQUksQ0FBQyxJQUFJO1NBQ2hCLEVBQ0QsRUFBRSxNQUFNLEVBQUUsSUFBSSxFQUFFLENBQ2pCLENBQUM7SUFDSixDQUFDO0lBRUQ7O09BRUc7SUFDSyx1QkFBdUI7UUFDN0IsT0FBTyxJQUFJLEdBQUcsQ0FBQyxHQUFHLENBQUMsVUFBVSxDQUMzQiwrQkFBK0IsRUFDL0I7WUFDRSxJQUFJLEVBQUUsSUFBSSxDQUFDLGVBQWUsQ0FBQyxFQUFFO1lBQzdCLElBQUksRUFBRSxtQ0FBbUMsSUFBSSxDQUFDLEtBQUssRUFBRTtZQUNyRCxNQUFNLEVBQUUsSUFBSSxDQUFDLFNBQVMsQ0FBQztnQkFDckIsT0FBTyxFQUFFLFlBQVk7Z0JBQ3JCLFNBQVMsRUFBRTtvQkFDVDt3QkFDRSxNQUFNLEVBQUUsT0FBTzt3QkFDZixNQUFNLEVBQUU7NEJBQ04sdUJBQXVCOzRCQUN2QiwrQkFBK0I7NEJBQy9CLHNCQUFzQjs0QkFDdEIsNEJBQTRCOzRCQUM1QixrQ0FBa0M7NEJBQ2xDLDhCQUE4Qjs0QkFDOUIsNEJBQTRCOzRCQUM1QixrQkFBa0I7NEJBQ2xCLGdCQUFnQjs0QkFDaEIsNENBQTRDOzRCQUM1Qyw2Q0FBNkM7NEJBQzdDLHdEQUF3RDs0QkFDeEQsMERBQTBEOzRCQUMxRCwyQ0FBMkM7NEJBQzNDLDJDQUEyQzs0QkFDM0Msc0NBQXNDOzRCQUN0Qyx3Q0FBd0M7eUJBQ3pDO3dCQUNELFFBQVEsRUFBRSxHQUFHO3FCQUNkO2lCQUNGO2FBQ0YsQ0FBQztTQUNILEVBQ0QsRUFBRSxNQUFNLEVBQUUsSUFBSSxFQUFFLENBQ2pCLENBQUM7SUFDSixDQUFDO0lBRUQsK0NBQStDO0lBQy9DLElBQVcsZ0JBQWdCO1FBQ3pCLE9BQU8sSUFBSSxDQUFDLGFBQWEsQ0FBQyxHQUFHLENBQUM7SUFDaEMsQ0FBQztJQUVELElBQVcsaUJBQWlCO1FBQzFCLE9BQU8sSUFBSSxDQUFDLGNBQWMsQ0FBQyxHQUFHLENBQUM7SUFDakMsQ0FBQztJQUVELElBQVcscUJBQXFCO1FBQzlCLE9BQU8sSUFBSSxDQUFDLGlCQUFpQixDQUFDLElBQUksQ0FBQztJQUNyQyxDQUFDO0lBRUQsSUFBVyxrQkFBa0I7UUFDM0IsT0FBTyxJQUFJLENBQUMsZUFBZSxDQUFDLEdBQUcsQ0FBQztJQUNsQyxDQUFDO0NBQ0Y7QUF0UEQsd0RBc1BDIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBJZGVudGl0eSBhbmQgQWNjZXNzIE1hbmFnZW1lbnQgSW5mcmFzdHJ1Y3R1cmUgQ29tcG9uZW50XG4gKiBIYW5kbGVzIElBTSByb2xlcywgcG9saWNpZXMsIGFuZCBpbnN0YW5jZSBwcm9maWxlcyBmb3IgQVdTIEVsYXN0aWMgQmVhbnN0YWxrXG4gKi9cblxuaW1wb3J0ICogYXMgcHVsdW1pIGZyb20gJ0BwdWx1bWkvcHVsdW1pJztcbmltcG9ydCAqIGFzIGF3cyBmcm9tICdAcHVsdW1pL2F3cyc7XG5pbXBvcnQgeyBDb21wb25lbnRSZXNvdXJjZSwgQ29tcG9uZW50UmVzb3VyY2VPcHRpb25zIH0gZnJvbSAnQHB1bHVtaS9wdWx1bWknO1xuXG5pbnRlcmZhY2UgSWRlbnRpdHlJbmZyYXN0cnVjdHVyZUFyZ3Mge1xuICB0YWdzOiBSZWNvcmQ8c3RyaW5nLCBzdHJpbmc+O1xufVxuXG5leHBvcnQgY2xhc3MgSWRlbnRpdHlJbmZyYXN0cnVjdHVyZSBleHRlbmRzIENvbXBvbmVudFJlc291cmNlIHtcbiAgcHJpdmF0ZSByZWFkb25seSB0YWdzOiBSZWNvcmQ8c3RyaW5nLCBzdHJpbmc+O1xuICBwcml2YXRlIHJlYWRvbmx5IHN0YWNrOiBzdHJpbmc7XG5cbiAgcHVibGljIHJlYWRvbmx5IGViU2VydmljZVJvbGU6IGF3cy5pYW0uUm9sZTtcbiAgcHVibGljIHJlYWRvbmx5IGViSW5zdGFuY2VSb2xlOiBhd3MuaWFtLlJvbGU7XG4gIHB1YmxpYyByZWFkb25seSBlYkluc3RhbmNlUG9saWN5OiBhd3MuaWFtLlJvbGVQb2xpY3k7XG4gIHB1YmxpYyByZWFkb25seSBlYkluc3RhbmNlUHJvZmlsZTogYXdzLmlhbS5JbnN0YW5jZVByb2ZpbGU7XG4gIHB1YmxpYyByZWFkb25seSBhdXRvc2NhbGluZ1JvbGU6IGF3cy5pYW0uUm9sZTtcbiAgcHVibGljIHJlYWRvbmx5IGF1dG9zY2FsaW5nUG9saWN5OiBhd3MuaWFtLlJvbGVQb2xpY3k7XG5cbiAgY29uc3RydWN0b3IoXG4gICAgbmFtZTogc3RyaW5nLFxuICAgIGFyZ3M6IElkZW50aXR5SW5mcmFzdHJ1Y3R1cmVBcmdzLFxuICAgIG9wdHM/OiBDb21wb25lbnRSZXNvdXJjZU9wdGlvbnNcbiAgKSB7XG4gICAgc3VwZXIoJ25vdmE6aW5mcmFzdHJ1Y3R1cmU6SWRlbnRpdHknLCBuYW1lLCB7fSwgb3B0cyk7XG5cbiAgICB0aGlzLnRhZ3MgPSBhcmdzLnRhZ3M7XG4gICAgdGhpcy5zdGFjayA9IHB1bHVtaS5nZXRTdGFjaygpO1xuXG4gICAgdGhpcy5lYlNlcnZpY2VSb2xlID0gdGhpcy5jcmVhdGVFYlNlcnZpY2VSb2xlKCk7XG4gICAgdGhpcy5lYkluc3RhbmNlUm9sZSA9IHRoaXMuY3JlYXRlRWJJbnN0YW5jZVJvbGUoKTtcbiAgICB0aGlzLmViSW5zdGFuY2VQb2xpY3kgPSB0aGlzLmNyZWF0ZUViSW5zdGFuY2VQb2xpY3koKTtcbiAgICB0aGlzLmViSW5zdGFuY2VQcm9maWxlID0gdGhpcy5jcmVhdGVFYkluc3RhbmNlUHJvZmlsZSgpO1xuICAgIHRoaXMuYXV0b3NjYWxpbmdSb2xlID0gdGhpcy5jcmVhdGVBdXRvc2NhbGluZ1JvbGUoKTtcbiAgICB0aGlzLmF1dG9zY2FsaW5nUG9saWN5ID0gdGhpcy5jcmVhdGVBdXRvc2NhbGluZ1BvbGljeSgpO1xuXG4gICAgdGhpcy5yZWdpc3Rlck91dHB1dHMoe1xuICAgICAgZWJTZXJ2aWNlUm9sZUFybjogdGhpcy5lYlNlcnZpY2VSb2xlLmFybixcbiAgICAgIGViSW5zdGFuY2VSb2xlQXJuOiB0aGlzLmViSW5zdGFuY2VSb2xlLmFybixcbiAgICAgIGViSW5zdGFuY2VQcm9maWxlTmFtZTogdGhpcy5lYkluc3RhbmNlUHJvZmlsZS5uYW1lLFxuICAgICAgYXV0b3NjYWxpbmdSb2xlQXJuOiB0aGlzLmF1dG9zY2FsaW5nUm9sZS5hcm4sXG4gICAgfSk7XG4gIH1cblxuICAvKipcbiAgICogQ3JlYXRlIEVsYXN0aWMgQmVhbnN0YWxrIHNlcnZpY2Ugcm9sZVxuICAgKi9cbiAgcHJpdmF0ZSBjcmVhdGVFYlNlcnZpY2VSb2xlKCk6IGF3cy5pYW0uUm9sZSB7XG4gICAgcmV0dXJuIG5ldyBhd3MuaWFtLlJvbGUoXG4gICAgICAnZWItc2VydmljZS1yb2xlJyxcbiAgICAgIHtcbiAgICAgICAgbmFtZTogYG5vdmEtZWItc2VydmljZS1yb2xlLSR7dGhpcy5zdGFja31gLFxuICAgICAgICBkZXNjcmlwdGlvbjogJ1NlcnZpY2Ugcm9sZSBmb3IgRWxhc3RpYyBCZWFuc3RhbGsnLFxuICAgICAgICBhc3N1bWVSb2xlUG9saWN5OiBKU09OLnN0cmluZ2lmeSh7XG4gICAgICAgICAgVmVyc2lvbjogJzIwMTItMTAtMTcnLFxuICAgICAgICAgIFN0YXRlbWVudDogW1xuICAgICAgICAgICAge1xuICAgICAgICAgICAgICBFZmZlY3Q6ICdBbGxvdycsXG4gICAgICAgICAgICAgIFByaW5jaXBhbDogeyBTZXJ2aWNlOiAnZWxhc3RpY2JlYW5zdGFsay5hbWF6b25hd3MuY29tJyB9LFxuICAgICAgICAgICAgICBBY3Rpb246ICdzdHM6QXNzdW1lUm9sZScsXG4gICAgICAgICAgICAgIENvbmRpdGlvbjoge1xuICAgICAgICAgICAgICAgIFN0cmluZ0VxdWFsczoge1xuICAgICAgICAgICAgICAgICAgJ3N0czpFeHRlcm5hbElkJzogJ2VsYXN0aWNiZWFuc3RhbGsnLFxuICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICB9LFxuICAgICAgICAgIF0sXG4gICAgICAgIH0pLFxuICAgICAgICBtYW5hZ2VkUG9saWN5QXJuczogW1xuICAgICAgICAgICdhcm46YXdzOmlhbTo6YXdzOnBvbGljeS9zZXJ2aWNlLXJvbGUvQVdTRWxhc3RpY0JlYW5zdGFsa0VuaGFuY2VkSGVhbHRoJyxcbiAgICAgICAgICAnYXJuOmF3czppYW06OmF3czpwb2xpY3kvQVdTRWxhc3RpY0JlYW5zdGFsa01hbmFnZWRVcGRhdGVzQ3VzdG9tZXJSb2xlUG9saWN5JyxcbiAgICAgICAgICAnYXJuOmF3czppYW06OmF3czpwb2xpY3kvc2VydmljZS1yb2xlL0FXU0VsYXN0aWNCZWFuc3RhbGtTZXJ2aWNlJyxcbiAgICAgICAgXSxcbiAgICAgICAgdGFnczogdGhpcy50YWdzLFxuICAgICAgfSxcbiAgICAgIHsgcGFyZW50OiB0aGlzIH1cbiAgICApO1xuICB9XG5cbiAgLyoqXG4gICAqIENyZWF0ZSBFQzIgaW5zdGFuY2Ugcm9sZSBmb3IgRWxhc3RpYyBCZWFuc3RhbGsgaW5zdGFuY2VzXG4gICAqL1xuICBwcml2YXRlIGNyZWF0ZUViSW5zdGFuY2VSb2xlKCk6IGF3cy5pYW0uUm9sZSB7XG4gICAgcmV0dXJuIG5ldyBhd3MuaWFtLlJvbGUoXG4gICAgICAnZWItaW5zdGFuY2Utcm9sZScsXG4gICAgICB7XG4gICAgICAgIG5hbWU6IGBub3ZhLWViLWluc3RhbmNlLXJvbGUtJHt0aGlzLnN0YWNrfWAsXG4gICAgICAgIGRlc2NyaXB0aW9uOiAnSW5zdGFuY2Ugcm9sZSBmb3IgRWxhc3RpYyBCZWFuc3RhbGsgRUMyIGluc3RhbmNlcycsXG4gICAgICAgIGFzc3VtZVJvbGVQb2xpY3k6IEpTT04uc3RyaW5naWZ5KHtcbiAgICAgICAgICBWZXJzaW9uOiAnMjAxMi0xMC0xNycsXG4gICAgICAgICAgU3RhdGVtZW50OiBbXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgIEVmZmVjdDogJ0FsbG93JyxcbiAgICAgICAgICAgICAgUHJpbmNpcGFsOiB7IFNlcnZpY2U6ICdlYzIuYW1hem9uYXdzLmNvbScgfSxcbiAgICAgICAgICAgICAgQWN0aW9uOiAnc3RzOkFzc3VtZVJvbGUnLFxuICAgICAgICAgICAgfSxcbiAgICAgICAgICBdLFxuICAgICAgICB9KSxcbiAgICAgICAgbWFuYWdlZFBvbGljeUFybnM6IFtcbiAgICAgICAgICAnYXJuOmF3czppYW06OmF3czpwb2xpY3kvQVdTRWxhc3RpY0JlYW5zdGFsa1dlYlRpZXInLFxuICAgICAgICAgICdhcm46YXdzOmlhbTo6YXdzOnBvbGljeS9BV1NFbGFzdGljQmVhbnN0YWxrTXVsdGljb250YWluZXJEb2NrZXInLFxuICAgICAgICAgICdhcm46YXdzOmlhbTo6YXdzOnBvbGljeS9BV1NFbGFzdGljQmVhbnN0YWxrV29ya2VyVGllcicsXG4gICAgICAgIF0sXG4gICAgICAgIHRhZ3M6IHRoaXMudGFncyxcbiAgICAgIH0sXG4gICAgICB7IHBhcmVudDogdGhpcyB9XG4gICAgKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBDcmVhdGUgYWRkaXRpb25hbCBwb2xpY3kgZm9yIEVCIGluc3RhbmNlIHJvbGVcbiAgICovXG4gIHByaXZhdGUgY3JlYXRlRWJJbnN0YW5jZVBvbGljeSgpOiBhd3MuaWFtLlJvbGVQb2xpY3kge1xuICAgIHJldHVybiBuZXcgYXdzLmlhbS5Sb2xlUG9saWN5KFxuICAgICAgJ2ViLWluc3RhbmNlLWFkZGl0aW9uYWwtcG9saWN5JyxcbiAgICAgIHtcbiAgICAgICAgcm9sZTogdGhpcy5lYkluc3RhbmNlUm9sZS5pZCxcbiAgICAgICAgbmFtZTogYE5vdmFFQkluc3RhbmNlQWRkaXRpb25hbFBvbGljeS0ke3RoaXMuc3RhY2t9YCxcbiAgICAgICAgcG9saWN5OiBKU09OLnN0cmluZ2lmeSh7XG4gICAgICAgICAgVmVyc2lvbjogJzIwMTItMTAtMTcnLFxuICAgICAgICAgIFN0YXRlbWVudDogW1xuICAgICAgICAgICAge1xuICAgICAgICAgICAgICBFZmZlY3Q6ICdBbGxvdycsXG4gICAgICAgICAgICAgIEFjdGlvbjogW1xuICAgICAgICAgICAgICAgICdjbG91ZHdhdGNoOlB1dE1ldHJpY0RhdGEnLFxuICAgICAgICAgICAgICAgICdjbG91ZHdhdGNoOkdldE1ldHJpY1N0YXRpc3RpY3MnLFxuICAgICAgICAgICAgICAgICdjbG91ZHdhdGNoOkxpc3RNZXRyaWNzJyxcbiAgICAgICAgICAgICAgICAnZWMyOkRlc2NyaWJlSW5zdGFuY2VTdGF0dXMnLFxuICAgICAgICAgICAgICAgICdlYzI6RGVzY3JpYmVJbnN0YW5jZXMnLFxuICAgICAgICAgICAgICAgICdsb2dzOkNyZWF0ZUxvZ0dyb3VwJyxcbiAgICAgICAgICAgICAgICAnbG9nczpDcmVhdGVMb2dTdHJlYW0nLFxuICAgICAgICAgICAgICAgICdsb2dzOlB1dExvZ0V2ZW50cycsXG4gICAgICAgICAgICAgICAgJ2xvZ3M6RGVzY3JpYmVMb2dTdHJlYW1zJyxcbiAgICAgICAgICAgICAgICAnbG9nczpEZXNjcmliZUxvZ0dyb3VwcycsXG4gICAgICAgICAgICAgIF0sXG4gICAgICAgICAgICAgIFJlc291cmNlOiAnKicsXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAge1xuICAgICAgICAgICAgICBFZmZlY3Q6ICdBbGxvdycsXG4gICAgICAgICAgICAgIEFjdGlvbjogWydzMzpHZXRPYmplY3QnLCAnczM6UHV0T2JqZWN0JywgJ3MzOkRlbGV0ZU9iamVjdCddLFxuICAgICAgICAgICAgICBSZXNvdXJjZTogJ2Fybjphd3M6czM6OjplbGFzdGljYmVhbnN0YWxrLSovKicsXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAge1xuICAgICAgICAgICAgICBFZmZlY3Q6ICdBbGxvdycsXG4gICAgICAgICAgICAgIEFjdGlvbjogWydzMzpMaXN0QnVja2V0J10sXG4gICAgICAgICAgICAgIFJlc291cmNlOiAnYXJuOmF3czpzMzo6OmVsYXN0aWNiZWFuc3RhbGstKicsXG4gICAgICAgICAgICB9LFxuICAgICAgICAgIF0sXG4gICAgICAgIH0pLFxuICAgICAgfSxcbiAgICAgIHsgcGFyZW50OiB0aGlzIH1cbiAgICApO1xuICB9XG5cbiAgLyoqXG4gICAqIENyZWF0ZSBpbnN0YW5jZSBwcm9maWxlIGZvciBFbGFzdGljIEJlYW5zdGFsayBpbnN0YW5jZXNcbiAgICovXG4gIHByaXZhdGUgY3JlYXRlRWJJbnN0YW5jZVByb2ZpbGUoKTogYXdzLmlhbS5JbnN0YW5jZVByb2ZpbGUge1xuICAgIHJldHVybiBuZXcgYXdzLmlhbS5JbnN0YW5jZVByb2ZpbGUoXG4gICAgICAnZWItaW5zdGFuY2UtcHJvZmlsZScsXG4gICAgICB7XG4gICAgICAgIG5hbWU6IGBub3ZhLWViLWluc3RhbmNlLXByb2ZpbGUtJHt0aGlzLnN0YWNrfWAsXG4gICAgICAgIHJvbGU6IHRoaXMuZWJJbnN0YW5jZVJvbGUubmFtZSxcbiAgICAgIH0sXG4gICAgICB7IHBhcmVudDogdGhpcyB9XG4gICAgKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBDcmVhdGUgQXV0byBTY2FsaW5nIHNlcnZpY2Ugcm9sZVxuICAgKi9cbiAgcHJpdmF0ZSBjcmVhdGVBdXRvc2NhbGluZ1JvbGUoKTogYXdzLmlhbS5Sb2xlIHtcbiAgICByZXR1cm4gbmV3IGF3cy5pYW0uUm9sZShcbiAgICAgICdhdXRvc2NhbGluZy1yb2xlJyxcbiAgICAgIHtcbiAgICAgICAgbmFtZTogYG5vdmEtYXV0b3NjYWxpbmctcm9sZS0ke3RoaXMuc3RhY2t9YCxcbiAgICAgICAgZGVzY3JpcHRpb246ICdTZXJ2aWNlIHJvbGUgZm9yIEF1dG8gU2NhbGluZycsXG4gICAgICAgIGFzc3VtZVJvbGVQb2xpY3k6IEpTT04uc3RyaW5naWZ5KHtcbiAgICAgICAgICBWZXJzaW9uOiAnMjAxMi0xMC0xNycsXG4gICAgICAgICAgU3RhdGVtZW50OiBbXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgIEVmZmVjdDogJ0FsbG93JyxcbiAgICAgICAgICAgICAgUHJpbmNpcGFsOiB7IFNlcnZpY2U6ICdhdXRvc2NhbGluZy5hbWF6b25hd3MuY29tJyB9LFxuICAgICAgICAgICAgICBBY3Rpb246ICdzdHM6QXNzdW1lUm9sZScsXG4gICAgICAgICAgICB9LFxuICAgICAgICAgIF0sXG4gICAgICAgIH0pLFxuICAgICAgICBtYW5hZ2VkUG9saWN5QXJuczogW1xuICAgICAgICAgICdhcm46YXdzOmlhbTo6YXdzOnBvbGljeS9zZXJ2aWNlLXJvbGUvQXV0b1NjYWxpbmdOb3RpZmljYXRpb25BY2Nlc3NSb2xlJyxcbiAgICAgICAgXSxcbiAgICAgICAgdGFnczogdGhpcy50YWdzLFxuICAgICAgfSxcbiAgICAgIHsgcGFyZW50OiB0aGlzIH1cbiAgICApO1xuICB9XG5cbiAgLyoqXG4gICAqIENyZWF0ZSBhZGRpdGlvbmFsIHBvbGljeSBmb3IgQXV0byBTY2FsaW5nIHJvbGVcbiAgICovXG4gIHByaXZhdGUgY3JlYXRlQXV0b3NjYWxpbmdQb2xpY3koKTogYXdzLmlhbS5Sb2xlUG9saWN5IHtcbiAgICByZXR1cm4gbmV3IGF3cy5pYW0uUm9sZVBvbGljeShcbiAgICAgICdhdXRvc2NhbGluZy1hZGRpdGlvbmFsLXBvbGljeScsXG4gICAgICB7XG4gICAgICAgIHJvbGU6IHRoaXMuYXV0b3NjYWxpbmdSb2xlLmlkLFxuICAgICAgICBuYW1lOiBgTm92YUF1dG9TY2FsaW5nQWRkaXRpb25hbFBvbGljeS0ke3RoaXMuc3RhY2t9YCxcbiAgICAgICAgcG9saWN5OiBKU09OLnN0cmluZ2lmeSh7XG4gICAgICAgICAgVmVyc2lvbjogJzIwMTItMTAtMTcnLFxuICAgICAgICAgIFN0YXRlbWVudDogW1xuICAgICAgICAgICAge1xuICAgICAgICAgICAgICBFZmZlY3Q6ICdBbGxvdycsXG4gICAgICAgICAgICAgIEFjdGlvbjogW1xuICAgICAgICAgICAgICAgICdlYzI6RGVzY3JpYmVJbnN0YW5jZXMnLFxuICAgICAgICAgICAgICAgICdlYzI6RGVzY3JpYmVJbnN0YW5jZUF0dHJpYnV0ZScsXG4gICAgICAgICAgICAgICAgJ2VjMjpEZXNjcmliZUtleVBhaXJzJyxcbiAgICAgICAgICAgICAgICAnZWMyOkRlc2NyaWJlU2VjdXJpdHlHcm91cHMnLFxuICAgICAgICAgICAgICAgICdlYzI6RGVzY3JpYmVTcG90SW5zdGFuY2VSZXF1ZXN0cycsXG4gICAgICAgICAgICAgICAgJ2VjMjpEZXNjcmliZVNwb3RQcmljZUhpc3RvcnknLFxuICAgICAgICAgICAgICAgICdlYzI6RGVzY3JpYmVWcGNDbGFzc2ljTGluaycsXG4gICAgICAgICAgICAgICAgJ2VjMjpEZXNjcmliZVZwY3MnLFxuICAgICAgICAgICAgICAgICdlYzI6Q3JlYXRlVGFncycsXG4gICAgICAgICAgICAgICAgJ2VsYXN0aWNsb2FkYmFsYW5jaW5nOkRlc2NyaWJlTG9hZEJhbGFuY2VycycsXG4gICAgICAgICAgICAgICAgJ2VsYXN0aWNsb2FkYmFsYW5jaW5nOkRlc2NyaWJlSW5zdGFuY2VIZWFsdGgnLFxuICAgICAgICAgICAgICAgICdlbGFzdGljbG9hZGJhbGFuY2luZzpSZWdpc3Rlckluc3RhbmNlc1dpdGhMb2FkQmFsYW5jZXInLFxuICAgICAgICAgICAgICAgICdlbGFzdGljbG9hZGJhbGFuY2luZzpEZXJlZ2lzdGVySW5zdGFuY2VzRnJvbUxvYWRCYWxhbmNlcicsXG4gICAgICAgICAgICAgICAgJ2VsYXN0aWNsb2FkYmFsYW5jaW5nOkRlc2NyaWJlVGFyZ2V0R3JvdXBzJyxcbiAgICAgICAgICAgICAgICAnZWxhc3RpY2xvYWRiYWxhbmNpbmc6RGVzY3JpYmVUYXJnZXRIZWFsdGgnLFxuICAgICAgICAgICAgICAgICdlbGFzdGljbG9hZGJhbGFuY2luZzpSZWdpc3RlclRhcmdldHMnLFxuICAgICAgICAgICAgICAgICdlbGFzdGljbG9hZGJhbGFuY2luZzpEZXJlZ2lzdGVyVGFyZ2V0cycsXG4gICAgICAgICAgICAgIF0sXG4gICAgICAgICAgICAgIFJlc291cmNlOiAnKicsXG4gICAgICAgICAgICB9LFxuICAgICAgICAgIF0sXG4gICAgICAgIH0pLFxuICAgICAgfSxcbiAgICAgIHsgcGFyZW50OiB0aGlzIH1cbiAgICApO1xuICB9XG5cbiAgLy8gUHJvcGVydHkgZ2V0dGVycyBmb3IgYWNjZXNzaW5nIHRoZSByZXNvdXJjZXNcbiAgcHVibGljIGdldCBlYlNlcnZpY2VSb2xlQXJuKCk6IHB1bHVtaS5PdXRwdXQ8c3RyaW5nPiB7XG4gICAgcmV0dXJuIHRoaXMuZWJTZXJ2aWNlUm9sZS5hcm47XG4gIH1cblxuICBwdWJsaWMgZ2V0IGViSW5zdGFuY2VSb2xlQXJuKCk6IHB1bHVtaS5PdXRwdXQ8c3RyaW5nPiB7XG4gICAgcmV0dXJuIHRoaXMuZWJJbnN0YW5jZVJvbGUuYXJuO1xuICB9XG5cbiAgcHVibGljIGdldCBlYkluc3RhbmNlUHJvZmlsZU5hbWUoKTogcHVsdW1pLk91dHB1dDxzdHJpbmc+IHtcbiAgICByZXR1cm4gdGhpcy5lYkluc3RhbmNlUHJvZmlsZS5uYW1lO1xuICB9XG5cbiAgcHVibGljIGdldCBhdXRvc2NhbGluZ1JvbGVBcm4oKTogcHVsdW1pLk91dHB1dDxzdHJpbmc+IHtcbiAgICByZXR1cm4gdGhpcy5hdXRvc2NhbGluZ1JvbGUuYXJuO1xuICB9XG59XG4iXX0=