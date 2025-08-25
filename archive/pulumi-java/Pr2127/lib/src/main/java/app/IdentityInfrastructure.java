package app;

import com.pulumi.aws.iam.*;
import com.pulumi.resources.ComponentResource;
import com.pulumi.resources.ComponentResourceOptions;
import com.pulumi.resources.CustomResourceOptions;
import com.pulumi.core.Output;

import java.util.List;
import java.util.Map;

/**
 * Identity and Access Management Infrastructure Component
 * Handles IAM roles, policies, and instance profiles for AWS Elastic Beanstalk
 */
public class IdentityInfrastructure extends ComponentResource {

    public static class IdentityInfrastructureArgs {
        private Map<String, String> tags;
        private String stackName;

        public IdentityInfrastructureArgs() {}

        public Map<String, String> getTags() { return tags; }
        public IdentityInfrastructureArgs setTags(Map<String, String> tags) {
            this.tags = tags;
            return this;
        }

        public String getStackName() { return stackName; }
        public IdentityInfrastructureArgs setStackName(String stackName) {
            this.stackName = stackName;
            return this;
        }
    }

    private final Map<String, String> tags;
    private final String stack;

    // IAM Resources
    private final Role ebServiceRole;
    private final Role ebInstanceRole;
    private final RolePolicy ebInstancePolicy;
    private final InstanceProfile ebInstanceProfile;
    private final Role autoscalingRole;
    private final RolePolicy autoscalingPolicy;

    public IdentityInfrastructure(String name, IdentityInfrastructureArgs args,
                                ComponentResourceOptions opts) {
        super("nova:infrastructure:Identity", name, opts);

        this.tags = args.getTags();
        this.stack = args.getStackName() != null ? args.getStackName() : "default";

        this.ebServiceRole = this.createEbServiceRole();
        this.ebInstanceRole = this.createEbInstanceRole();
        this.ebInstancePolicy = this.createEbInstancePolicy();
        this.ebInstanceProfile = this.createEbInstanceProfile();
        this.autoscalingRole = this.createAutoscalingRole();
        this.autoscalingPolicy = this.createAutoscalingPolicy();

        this.registerOutputs(Map.of(
            "ebServiceRoleArn", this.ebServiceRole.arn(),
            "ebInstanceRoleArn", this.ebInstanceRole.arn(),
            "ebInstanceProfileName", this.ebInstanceProfile.name(),
            "autoscalingRoleArn", this.autoscalingRole.arn()
        ));
    }

    /**
     * Create Elastic Beanstalk service role
     */
    private Role createEbServiceRole() {
        return new Role("eb-service-role", RoleArgs.builder()
            .name(String.format("nova-eb-service-role-%s", this.stack))
            .description("Service role for Elastic Beanstalk")
            .assumeRolePolicy("""
                {
                    "Version": "2012-10-17",
                    "Statement": [
                        {
                            "Effect": "Allow",
                            "Principal": { "Service": "elasticbeanstalk.amazonaws.com" },
                            "Action": "sts:AssumeRole",
                            "Condition": {
                                "StringEquals": {
                                    "sts:ExternalId": "elasticbeanstalk"
                                }
                            }
                        }
                    ]
                }
                """)
            .managedPolicyArns(List.of(
                "arn:aws:iam::aws:policy/service-role/AWSElasticBeanstalkEnhancedHealth",
                "arn:aws:iam::aws:policy/AWSElasticBeanstalkManagedUpdatesCustomerRolePolicy",
                "arn:aws:iam::aws:policy/service-role/AWSElasticBeanstalkService"
            ))
            .tags(this.tags)
            .build(),
            CustomResourceOptions.builder()
                .parent(this)
                .build()
        );
    }

    /**
     * Create EC2 instance role for Elastic Beanstalk instances
     */
    private Role createEbInstanceRole() {
        return new Role("eb-instance-role", RoleArgs.builder()
            .name(String.format("nova-eb-instance-role-%s", this.stack))
            .description("Instance role for Elastic Beanstalk EC2 instances")
            .assumeRolePolicy("""
                {
                    "Version": "2012-10-17",
                    "Statement": [
                        {
                            "Effect": "Allow",
                            "Principal": { "Service": "ec2.amazonaws.com" },
                            "Action": "sts:AssumeRole"
                        }
                    ]
                }
                """)
            .managedPolicyArns(List.of(
                "arn:aws:iam::aws:policy/AWSElasticBeanstalkWebTier",
                "arn:aws:iam::aws:policy/AWSElasticBeanstalkMulticontainerDocker",
                "arn:aws:iam::aws:policy/AWSElasticBeanstalkWorkerTier"
            ))
            .tags(this.tags)
            .build(),
            CustomResourceOptions.builder()
                .parent(this)
                .build()
        );
    }

    /**
     * Create additional policy for EB instance role
     */
    private RolePolicy createEbInstancePolicy() {
        return new RolePolicy("eb-instance-additional-policy", RolePolicyArgs.builder()
            .role(this.ebInstanceRole.id())
            .name(String.format("NovaEBInstanceAdditionalPolicy-%s", this.stack))
            .policy("""
                {
                    "Version": "2012-10-17",
                    "Statement": [
                        {
                            "Effect": "Allow",
                            "Action": [
                                "cloudwatch:PutMetricData",
                                "cloudwatch:GetMetricStatistics",
                                "cloudwatch:ListMetrics",
                                "ec2:DescribeInstanceStatus",
                                "ec2:DescribeInstances",
                                "logs:CreateLogGroup",
                                "logs:CreateLogStream",
                                "logs:PutLogEvents",
                                "logs:DescribeLogStreams",
                                "logs:DescribeLogGroups"
                            ],
                            "Resource": "*"
                        },
                        {
                            "Effect": "Allow",
                            "Action": [
                                "s3:GetObject",
                                "s3:PutObject",
                                "s3:DeleteObject"
                            ],
                            "Resource": "arn:aws:s3:::elasticbeanstalk-*/*"
                        },
                        {
                            "Effect": "Allow",
                            "Action": [
                                "s3:ListBucket"
                            ],
                            "Resource": "arn:aws:s3:::elasticbeanstalk-*"
                        }
                    ]
                }
                """)
            .build(),
            CustomResourceOptions.builder()
                .parent(this)
                .build()
        );
    }

    /**
     * Create instance profile for Elastic Beanstalk instances
     */
    private InstanceProfile createEbInstanceProfile() {
        return new InstanceProfile("eb-instance-profile", InstanceProfileArgs.builder()
            .name(String.format("nova-eb-instance-profile-%s", this.stack))
            .role(this.ebInstanceRole.name())
            .build(),
            CustomResourceOptions.builder()
                .parent(this)
                .build()
        );
    }

    /**
     * Create Auto Scaling service role
     */
    private Role createAutoscalingRole() {
        return new Role("autoscaling-role", RoleArgs.builder()
            .name(String.format("nova-autoscaling-role-%s", this.stack))
            .description("Service role for Auto Scaling")
            .assumeRolePolicy("""
                {
                    "Version": "2012-10-17",
                    "Statement": [
                        {
                            "Effect": "Allow",
                            "Principal": { "Service": "autoscaling.amazonaws.com" },
                            "Action": "sts:AssumeRole"
                        }
                    ]
                }
                """)
            .managedPolicyArns(List.of(
                "arn:aws:iam::aws:policy/service-role/AutoScalingNotificationAccessRole"
            ))
            .tags(this.tags)
            .build(),
            CustomResourceOptions.builder()
                .parent(this)
                .build()
        );
    }

    /**
     * Create additional policy for Auto Scaling role
     */
    private RolePolicy createAutoscalingPolicy() {
        return new RolePolicy("autoscaling-additional-policy", RolePolicyArgs.builder()
            .role(this.autoscalingRole.id())
            .name(String.format("NovaAutoScalingAdditionalPolicy-%s", this.stack))
            .policy("""
                {
                    "Version": "2012-10-17",
                    "Statement": [
                        {
                            "Effect": "Allow",
                            "Action": [
                                "ec2:DescribeInstances",
                                "ec2:DescribeInstanceAttribute",
                                "ec2:DescribeKeyPairs",
                                "ec2:DescribeSecurityGroups",
                                "ec2:DescribeSpotInstanceRequests",
                                "ec2:DescribeSpotPriceHistory",
                                "ec2:DescribeVpcClassicLink",
                                "ec2:DescribeVpcs",
                                "ec2:CreateTags",
                                "elasticloadbalancing:DescribeLoadBalancers",
                                "elasticloadbalancing:DescribeInstanceHealth",
                                "elasticloadbalancing:RegisterInstancesWithLoadBalancer",
                                "elasticloadbalancing:DeregisterInstancesFromLoadBalancer",
                                "elasticloadbalancing:DescribeTargetGroups",
                                "elasticloadbalancing:DescribeTargetHealth",
                                "elasticloadbalancing:RegisterTargets",
                                "elasticloadbalancing:DeregisterTargets"
                            ],
                            "Resource": "*"
                        }
                    ]
                }
                """)
            .build(),
            CustomResourceOptions.builder()
                .parent(this)
                .build()
        );
    }

    // Output property getters
    public Output<String> getEbServiceRoleArn() { return this.ebServiceRole.arn(); }
    public Output<String> getEbInstanceRoleArn() { return this.ebInstanceRole.arn(); }
    public Output<String> getEbInstanceProfileName() { return this.ebInstanceProfile.name(); }
    public Output<String> getAutoscalingRoleArn() { return this.autoscalingRole.arn(); }

    // Additional getters for direct access
    public Role getEbServiceRole() { return this.ebServiceRole; }
    public Role getEbInstanceRole() { return this.ebInstanceRole; }
    public RolePolicy getEbInstancePolicy() { return this.ebInstancePolicy; }
    public InstanceProfile getEbInstanceProfile() { return this.ebInstanceProfile; }
    public Role getAutoscalingRole() { return this.autoscalingRole; }
    public RolePolicy getAutoscalingPolicy() { return this.autoscalingPolicy; }
}