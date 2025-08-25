from aws_cdk import (
    Stack,
    Duration,
    aws_ecs as ecs,
    aws_ec2 as ec2,
    aws_logs as logs,
    aws_iam as iam,
    aws_elasticloadbalancingv2 as elbv2,
    aws_applicationautoscaling as appscaling,
    aws_cloudwatch as cloudwatch,
    aws_ssm as ssm,
    CfnOutput,
)
from constructs import Construct
import aws_cdk as cdk

class EcsStack(Stack):
    def __init__(self, scope: Construct, construct_id: str, 
                 vpc_stack, environment_suffix: str, **kwargs) -> None:
        super().__init__(scope, construct_id, **kwargs)

        # Create ECS Cluster
        self.cluster = ecs.Cluster(
            self, f"webapp-cluster-{environment_suffix}",
            vpc=vpc_stack.vpc,
            cluster_name=f"webapp-cluster-{environment_suffix.lower()}",
            container_insights=True  # Enable CloudWatch Container Insights
        )

        # Create CloudWatch Log Group
        log_group = logs.LogGroup(
            self, f"WebAppLogGroup{environment_suffix}",
            log_group_name=f"/ecs/webapp-{environment_suffix.lower()}",
            retention=logs.RetentionDays.ONE_WEEK,
            removal_policy=cdk.RemovalPolicy.DESTROY
        )

        # Task Execution Role
        task_execution_role = iam.Role(
            self, f"WebAppTaskExecutionRole{environment_suffix}",
            assumed_by=iam.ServicePrincipal("ecs-tasks.amazonaws.com"),
            managed_policies=[
                iam.ManagedPolicy.from_aws_managed_policy_name(
                    "service-role/AmazonECSTaskExecutionRolePolicy"
                )
            ]
        )

        # Add permission to read from Parameter Store
        task_execution_role.add_to_policy(
            iam.PolicyStatement(
                effect=iam.Effect.ALLOW,
                actions=[
                    "ssm:GetParameters",
                    "ssm:GetParameter",
                    "ssm:GetParametersByPath"
                ],
                resources=[
                    f"arn:aws:ssm:{self.region}:{self.account}:parameter/webapp/{environment_suffix.lower()}/*"
                ]
            )
        )

        # Task Role for application permissions
        task_role = iam.Role(
            self, f"WebAppTaskRole{environment_suffix}",
            assumed_by=iam.ServicePrincipal("ecs-tasks.amazonaws.com")
        )

        # Add CloudWatch permissions to task role
        task_role.add_to_policy(
            iam.PolicyStatement(
                effect=iam.Effect.ALLOW,
                actions=[
                    "cloudwatch:PutMetricData",
                    "logs:CreateLogGroup",
                    "logs:CreateLogStream",
                    "logs:PutLogEvents"
                ],
                resources=["*"]
            )
        )

        # Create Task Definition with latest features
        task_definition = ecs.FargateTaskDefinition(
            self, f"WebAppTaskDefinition{environment_suffix}",
            memory_limit_mib=2048,
            cpu=1024,
            execution_role=task_execution_role,
            task_role=task_role,
            runtime_platform=ecs.RuntimePlatform(
                cpu_architecture=ecs.CpuArchitecture.X86_64,
                operating_system_family=ecs.OperatingSystemFamily.LINUX
            )
        )

        # Add EBS volume support (new Fargate feature)
        # Note: This requires Fargate platform version 1.4.0 or later
        # Commented out for now as it requires specific configuration
        # task_definition.add_volume(
        #     name="ebs-volume",
        #     efs_volume_configuration=None  # Placeholder for EBS configuration when needed
        # )

        # Container definition with environment variables from Parameter Store
        task_definition.add_container(
            f"WebAppContainer{environment_suffix}",
            image=ecs.ContainerImage.from_registry("public.ecr.aws/nginx/nginx:stable-alpine"),  # Use public image
            memory_limit_mib=1024,
            logging=ecs.LogDriver.aws_logs(
                stream_prefix="webapp",
                log_group=log_group
            ),
            environment={
                "ENVIRONMENT": environment_suffix.lower(),
                "AWS_DEFAULT_REGION": self.region
            },
            secrets={
                "API_KEY": ecs.Secret.from_ssm_parameter(
                    ssm.StringParameter.from_string_parameter_name(
                        self, f"ApiKeyParam{environment_suffix}",
                        string_parameter_name=f"/webapp/{environment_suffix.lower()}/api-key-primary-1"
                    )
                ),
                "DB_PASSWORD": ecs.Secret.from_ssm_parameter(
                    ssm.StringParameter.from_string_parameter_name(
                        self, f"DbPasswordParam{environment_suffix}",
                        string_parameter_name=f"/webapp/{environment_suffix.lower()}/db-password-primary-1"
                    )
                )
            },
            port_mappings=[
                ecs.PortMapping(
                    container_port=80,
                    protocol=ecs.Protocol.TCP
                )
            ],
            health_check=ecs.HealthCheck(
                command=["CMD-SHELL", "wget --no-verbose --tries=1 --spider http://localhost:80 || exit 1"],
                interval=Duration.seconds(30),
                timeout=Duration.seconds(5),
                retries=3,
                start_period=Duration.seconds(60)
            )
        )

        # Application Load Balancer
        self.alb = elbv2.ApplicationLoadBalancer(
            self, f"WebAppALB{environment_suffix}",
            vpc=vpc_stack.vpc,
            internet_facing=True,
            security_group=vpc_stack.alb_security_group,
            load_balancer_name=f"webapp-alb-{environment_suffix.lower()}"
        )

        # Target Group
        target_group = elbv2.ApplicationTargetGroup(
            self, f"WebAppTargetGroup{environment_suffix}",
            vpc=vpc_stack.vpc,
            port=80,
            protocol=elbv2.ApplicationProtocol.HTTP,
            target_type=elbv2.TargetType.IP,
            health_check=elbv2.HealthCheck(
                path="/",
                healthy_http_codes="200",
                interval=Duration.seconds(30),
                timeout=Duration.seconds(5),
                healthy_threshold_count=2,
                unhealthy_threshold_count=3
            ),
            deregistration_delay=Duration.seconds(30)
        )

        # ALB Listener
        self.alb.add_listener(
            f"WebAppListener{environment_suffix}",
            port=80,
            protocol=elbv2.ApplicationProtocol.HTTP,
            default_target_groups=[target_group]
        )

        # Fargate Service with latest platform version
        self.service = ecs.FargateService(
            self, f"WebAppService{environment_suffix}",
            cluster=self.cluster,
            task_definition=task_definition,
            desired_count=2,
            assign_public_ip=False,
            security_groups=[vpc_stack.fargate_security_group],
            vpc_subnets=ec2.SubnetSelection(
                subnet_type=ec2.SubnetType.PRIVATE_WITH_EGRESS
            ),
            platform_version=ecs.FargatePlatformVersion.VERSION1_4,  # Latest with EBS support
            circuit_breaker=ecs.DeploymentCircuitBreaker(
                rollback=True
            )
        )

        # Attach service to target group
        self.service.attach_to_application_target_group(target_group)

        # Auto Scaling Configuration
        scalable_target = self.service.auto_scale_task_count(
            min_capacity=2,
            max_capacity=20
        )

        # CPU-based scaling
        scalable_target.scale_on_cpu_utilization(
            f"CpuScaling{environment_suffix}",
            target_utilization_percent=70,
            scale_in_cooldown=Duration.seconds(300),
            scale_out_cooldown=Duration.seconds(300)
        )

        # Memory-based scaling
        scalable_target.scale_on_memory_utilization(
            f"MemoryScaling{environment_suffix}",
            target_utilization_percent=80,
            scale_in_cooldown=Duration.seconds(300),
            scale_out_cooldown=Duration.seconds(300)
        )

        # Custom metric scaling (ALB request count)
        scalable_target.scale_on_metric(
            f"RequestCountScaling{environment_suffix}",
            metric=cloudwatch.Metric(
                namespace="AWS/ApplicationELB",
                metric_name="RequestCountPerTarget",
                dimensions_map={
                    "TargetGroup": target_group.target_group_full_name,
                    "LoadBalancer": self.alb.load_balancer_full_name
                },
                statistic="Sum"
            ),
            scaling_steps=[
                appscaling.ScalingInterval(upper=100, change=0),
                appscaling.ScalingInterval(lower=100, upper=500, change=+1),
                appscaling.ScalingInterval(lower=500, change=+2)
            ],
            adjustment_type=appscaling.AdjustmentType.CHANGE_IN_CAPACITY,
            cooldown=Duration.seconds(300)
        )

        # Output ALB DNS name
        CfnOutput(
            self, f"LoadBalancerDns{environment_suffix}",
            value=self.alb.load_balancer_dns_name,
            export_name=f"LoadBalancerDns{environment_suffix}"
        )

        # Output ECS Cluster name
        CfnOutput(
            self, f"ClusterName{environment_suffix}",
            value=self.cluster.cluster_name,
            export_name=f"ClusterName{environment_suffix}"
        )
