# CI/CD Pipeline with AWS Fargate using CDK Python

## Architecture Overview

This solution provides a production-ready CI/CD pipeline for deploying containerized web applications to AWS Fargate using CDK with Python, implementing auto-scaling, monitoring, and security best practices.

## Implementation

### 1. VPC and Networking Stack (vpc_stack.py)

```python
from aws_cdk import (
    Stack,
    aws_ec2 as ec2,
    CfnOutput,
)
from constructs import Construct

class VpcStack(Stack):
    def __init__(self, scope: Construct, construct_id: str, environment_suffix: str, **kwargs) -> None:
        super().__init__(scope, construct_id, **kwargs)

        # Create VPC with public and private subnets across 2 AZs
        self.vpc = ec2.Vpc(
            self, f"WebAppVpc{environment_suffix}",
            max_azs=2,
            nat_gateways=2,
            subnet_configuration=[
                ec2.SubnetConfiguration(
                    name="Public",
                    subnet_type=ec2.SubnetType.PUBLIC,
                    cidr_mask=24
                ),
                ec2.SubnetConfiguration(
                    name="Private", 
                    subnet_type=ec2.SubnetType.PRIVATE_WITH_EGRESS,
                    cidr_mask=24
                )
            ],
            enable_dns_hostnames=True,
            enable_dns_support=True
        )

        # Security Group for ALB
        self.alb_security_group = ec2.SecurityGroup(
            self, f"AlbSecurityGroup{environment_suffix}",
            vpc=self.vpc,
            description="Security group for Application Load Balancer",
            allow_all_outbound=False
        )

        # Allow HTTP and HTTPS traffic to ALB
        self.alb_security_group.add_ingress_rule(
            peer=ec2.Peer.any_ipv4(),
            connection=ec2.Port.tcp(80),
            description="Allow HTTP traffic"
        )

        self.alb_security_group.add_ingress_rule(
            peer=ec2.Peer.any_ipv4(),
            connection=ec2.Port.tcp(443),
            description="Allow HTTPS traffic"
        )

        # Security Group for Fargate tasks
        self.fargate_security_group = ec2.SecurityGroup(
            self, f"FargateSecurityGroup{environment_suffix}",
            vpc=self.vpc,
            description="Security group for Fargate tasks",
            allow_all_outbound=True
        )

        # Allow traffic from ALB to Fargate on port 80
        self.fargate_security_group.add_ingress_rule(
            peer=self.alb_security_group,
            connection=ec2.Port.tcp(80),
            description="Allow traffic from ALB"
        )

        # Output VPC ID for reference
        CfnOutput(
            self, f"VpcId{environment_suffix}",
            value=self.vpc.vpc_id,
            export_name=f"VpcId{environment_suffix}"
        )
```

### 2. ECS Fargate Stack (ecs_stack.py)

```python
from aws_cdk import (
    Stack,
    Duration,
    aws_ecs as ecs,
    aws_logs as logs,
    aws_iam as iam,
    aws_elasticloadbalancingv2 as elbv2,
    aws_applicationautoscaling as appscaling,
    aws_cloudwatch as cloudwatch,
    aws_ssm as ssm,
    aws_ec2 as ec2,
    CfnOutput,
)
from constructs import Construct
import aws_cdk as cdk

class EcsStack(Stack):
    def __init__(self, scope: Construct, construct_id: str, 
                 vpc_stack, environment_suffix: str, **kwargs) -> None:
        super().__init__(scope, construct_id, **kwargs)

        # Create ECS Cluster with Container Insights enabled
        self.cluster = ecs.Cluster(
            self, f"WebAppCluster{environment_suffix}",
            vpc=vpc_stack.vpc,
            cluster_name=f"webapp-cluster-{environment_suffix.lower()}",
            container_insights=True
        )

        # Create CloudWatch Log Group
        log_group = logs.LogGroup(
            self, f"WebAppLogGroup{environment_suffix}",
            log_group_name=f"/ecs/webapp-{environment_suffix.lower()}",
            retention=logs.RetentionDays.ONE_WEEK,
            removal_policy=cdk.RemovalPolicy.DESTROY
        )

        # Task Execution Role with SSM permissions
        task_execution_role = iam.Role(
            self, f"WebAppTaskExecutionRole{environment_suffix}",
            assumed_by=iam.ServicePrincipal("ecs-tasks.amazonaws.com"),
            managed_policies=[
                iam.ManagedPolicy.from_aws_managed_policy_name(
                    "service-role/AmazonECSTaskExecutionRolePolicy"
                )
            ]
        )

        # Add SSM parameter read permissions
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

        # Add CloudWatch permissions
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

        # Create Task Definition
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

        # Container definition
        task_definition.add_container(
            f"WebAppContainer{environment_suffix}",
            image=ecs.ContainerImage.from_registry("public.ecr.aws/nginx/nginx:stable-alpine"),
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
                        string_parameter_name=f"/webapp/{environment_suffix.lower()}/api-key"
                    )
                ),
                "DB_PASSWORD": ecs.Secret.from_ssm_parameter(
                    ssm.StringParameter.from_string_parameter_name(
                        self, f"DbPasswordParam{environment_suffix}",
                        string_parameter_name=f"/webapp/{environment_suffix.lower()}/db-password"
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

        # Fargate Service
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
            platform_version=ecs.FargatePlatformVersion.VERSION1_4,
            circuit_breaker=ecs.DeploymentCircuitBreaker(
                rollback=True
            ),
            deployment_configuration=ecs.DeploymentConfiguration(
                maximum_percent=200,
                minimum_healthy_percent=50
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

        # Request count scaling
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

        # Outputs
        CfnOutput(
            self, f"LoadBalancerDns{environment_suffix}",
            value=self.alb.load_balancer_dns_name,
            export_name=f"LoadBalancerDns{environment_suffix}"
        )

        CfnOutput(
            self, f"ClusterName{environment_suffix}",
            value=self.cluster.cluster_name,
            export_name=f"ClusterName{environment_suffix}"
        )
```

### 3. Parameter Store Stack (parameter_stack.py)

```python
from aws_cdk import (
    Stack,
    aws_ssm as ssm,
)
from constructs import Construct

class ParameterStack(Stack):
    def __init__(self, scope: Construct, construct_id: str, 
                 environment_suffix: str, **kwargs) -> None:
        super().__init__(scope, construct_id, **kwargs)

        # API Key parameter
        ssm.StringParameter(
            self, f"ApiKeyParameter{environment_suffix}",
            parameter_name=f"/webapp/{environment_suffix.lower()}/api-key",
            string_value="your-api-key-here",
            description=f"API Key for web application - {environment_suffix}"
        )

        # Database password parameter
        ssm.StringParameter(
            self, f"DbPasswordParameter{environment_suffix}",
            parameter_name=f"/webapp/{environment_suffix.lower()}/db-password",
            string_value="your-db-password-here",
            description=f"Database password for web application - {environment_suffix}"
        )

        # Application configuration
        ssm.StringParameter(
            self, f"AppConfigParameter{environment_suffix}",
            parameter_name=f"/webapp/{environment_suffix.lower()}/app-config",
            string_value='{"debug": false, "log_level": "info"}',
            description=f"Application configuration - {environment_suffix}"
        )
```

### 4. Monitoring Stack (monitoring_stack.py)

```python
from aws_cdk import (
    Stack,
    Duration,
    aws_cloudwatch as cloudwatch,
    aws_cloudwatch_actions as cw_actions,
    aws_sns as sns,
    aws_sns_subscriptions as subscriptions,
)
from constructs import Construct

class MonitoringStack(Stack):
    def __init__(self, scope: Construct, construct_id: str,
                 ecs_stack, environment_suffix: str, **kwargs) -> None:
        super().__init__(scope, construct_id, **kwargs)

        # SNS Topic for alerts
        alert_topic = sns.Topic(
            self, f"WebAppAlerts{environment_suffix}",
            display_name=f"WebApp Alerts - {environment_suffix}"
        )

        # Email subscription
        alert_topic.add_subscription(
            subscriptions.EmailSubscription("admin@example.com")
        )

        # CloudWatch Dashboard
        dashboard = cloudwatch.Dashboard(
            self, f"WebAppDashboard{environment_suffix}",
            dashboard_name=f"webapp-{environment_suffix.lower()}-dashboard"
        )

        # Service metrics
        service_cpu_metric = cloudwatch.Metric(
            namespace="AWS/ECS",
            metric_name="CPUUtilization",
            dimensions_map={
                "ServiceName": ecs_stack.service.service_name,
                "ClusterName": ecs_stack.cluster.cluster_name
            },
            statistic="Average",
            period=Duration.minutes(1)
        )

        service_memory_metric = cloudwatch.Metric(
            namespace="AWS/ECS",
            metric_name="MemoryUtilization",
            dimensions_map={
                "ServiceName": ecs_stack.service.service_name,
                "ClusterName": ecs_stack.cluster.cluster_name
            },
            statistic="Average",
            period=Duration.minutes(1)
        )

        # ALB metrics
        alb_request_count_metric = cloudwatch.Metric(
            namespace="AWS/ApplicationELB",
            metric_name="RequestCount",
            dimensions_map={
                "LoadBalancer": ecs_stack.alb.load_balancer_full_name
            },
            statistic="Sum",
            period=Duration.minutes(1)
        )

        alb_response_time_metric = cloudwatch.Metric(
            namespace="AWS/ApplicationELB",
            metric_name="TargetResponseTime",
            dimensions_map={
                "LoadBalancer": ecs_stack.alb.load_balancer_full_name
            },
            statistic="Average",
            period=Duration.minutes(1)
        )

        # Dashboard widgets
        dashboard.add_widgets(
            cloudwatch.GraphWidget(
                title="ECS Service CPU and Memory Utilization",
                left=[service_cpu_metric],
                right=[service_memory_metric],
                width=12,
                height=6
            ),
            cloudwatch.GraphWidget(
                title="ALB Request Count and Response Time",
                left=[alb_request_count_metric],
                right=[alb_response_time_metric],
                width=12,
                height=6
            )
        )

        # CloudWatch Alarms
        high_cpu_alarm = cloudwatch.Alarm(
            self, f"HighCpuAlarm{environment_suffix}",
            alarm_name=f"webapp-{environment_suffix.lower()}-high-cpu",
            metric=service_cpu_metric,
            threshold=85,
            evaluation_periods=2,
            comparison_operator=cloudwatch.ComparisonOperator.GREATER_THAN_THRESHOLD,
            alarm_description="High CPU utilization detected"
        )

        high_cpu_alarm.add_alarm_action(
            cw_actions.SnsAction(alert_topic)
        )

        high_memory_alarm = cloudwatch.Alarm(
            self, f"HighMemoryAlarm{environment_suffix}",
            alarm_name=f"webapp-{environment_suffix.lower()}-high-memory",
            metric=service_memory_metric,
            threshold=90,
            evaluation_periods=2,
            comparison_operator=cloudwatch.ComparisonOperator.GREATER_THAN_THRESHOLD,
            alarm_description="High memory utilization detected"
        )

        high_memory_alarm.add_alarm_action(
            cw_actions.SnsAction(alert_topic)
        )

        # Error rate alarm
        error_rate_alarm = cloudwatch.Alarm(
            self, f"HighErrorRateAlarm{environment_suffix}",
            alarm_name=f"webapp-{environment_suffix.lower()}-high-error-rate",
            metric=cloudwatch.Metric(
                namespace="AWS/ApplicationELB",
                metric_name="HTTPCode_Target_5XX_Count",
                dimensions_map={
                    "LoadBalancer": ecs_stack.alb.load_balancer_full_name
                },
                statistic="Sum",
                period=Duration.minutes(5)
            ),
            threshold=10,
            evaluation_periods=1,
            comparison_operator=cloudwatch.ComparisonOperator.GREATER_THAN_THRESHOLD,
            alarm_description="High 5xx error rate detected"
        )

        error_rate_alarm.add_alarm_action(
            cw_actions.SnsAction(alert_topic)
        )
```

### 5. Main Stack Orchestration (tap_stack.py)

```python
"""tap_stack.py
Main CDK stack that orchestrates the deployment of all infrastructure components
"""

from typing import Optional
import aws_cdk as cdk
from constructs import Construct

from .vpc_stack import VpcStack
from .ecs_stack import EcsStack
from .monitoring_stack import MonitoringStack
from .parameter_stack import ParameterStack

class TapStackProps(cdk.StackProps):
    """Properties for the TapStack CDK stack"""
    def __init__(self, environment_suffix: Optional[str] = None, **kwargs):
        super().__init__(**kwargs)
        self.environment_suffix = environment_suffix

class TapStack(cdk.Stack):
    """Main CDK stack for CI/CD infrastructure deployment"""

    def __init__(self, scope: Construct, construct_id: str, 
                 props: Optional[TapStackProps] = None, **kwargs):
        super().__init__(scope, construct_id, **kwargs)

        # Get environment suffix
        environment_suffix = (
            props.environment_suffix if props else None
        ) or self.node.try_get_context('environmentSuffix') or 'dev'

        # Create Parameter Store stack
        parameter_stack = ParameterStack(
            self, f"ParameterStack{environment_suffix}",
            environment_suffix=environment_suffix
        )

        # Create VPC stack
        vpc_stack = VpcStack(
            self, f"VpcStack{environment_suffix}",
            environment_suffix=environment_suffix
        )

        # Create ECS stack with dependencies
        ecs_stack = EcsStack(
            self, f"EcsStack{environment_suffix}",
            vpc_stack=vpc_stack,
            environment_suffix=environment_suffix
        )
        ecs_stack.add_dependency(vpc_stack)
        ecs_stack.add_dependency(parameter_stack)

        # Create Monitoring stack
        monitoring_stack = MonitoringStack(
            self, f"MonitoringStack{environment_suffix}",
            ecs_stack=ecs_stack,
            environment_suffix=environment_suffix
        )
        monitoring_stack.add_dependency(ecs_stack)

        # Store references
        self.vpc_stack = vpc_stack
        self.ecs_stack = ecs_stack
        self.monitoring_stack = monitoring_stack
        self.parameter_stack = parameter_stack
```

This production-ready implementation provides a robust foundation for deploying containerized applications with CI/CD, monitoring, and auto-scaling capabilities on AWS Fargate using CDK Python.