"""tap_stack.py
This module defines the TapStack class for the financial transaction processing web application.
"""

import os
from typing import Optional
import aws_cdk as cdk
from aws_cdk import (
    Stack,
    Tags,
    aws_ec2 as ec2,
    aws_ecs as ecs,
    aws_rds as rds,
    aws_dynamodb as dynamodb,
    aws_lambda as lambda_,
    aws_s3 as s3,
    aws_cloudfront as cloudfront,
    aws_cloudfront_origins as origins,
    aws_elasticloadbalancingv2 as elbv2,
    aws_sns as sns,
    aws_sns_subscriptions as sns_subs,
    aws_cloudwatch as cloudwatch,
    aws_cloudwatch_actions as cloudwatch_actions,
    aws_iam as iam,
    aws_kms as kms,
    aws_logs as logs,
    RemovalPolicy,
)
from constructs import Construct


class TapStackProps(cdk.StackProps):
    """Properties for TapStack"""

    def __init__(self, environment_suffix: Optional[str] = None, **kwargs):
        super().__init__(**kwargs)
        self.environment_suffix = environment_suffix


class TapStack(Stack):
    """Main stack for financial transaction processing application"""

    def __init__(
        self,
        scope: Construct,
        construct_id: str,
        props: Optional[TapStackProps] = None,
        **kwargs
    ):
        super().__init__(scope, construct_id, **kwargs)

        # Get environment suffix
        environment_suffix = (
            props.environment_suffix if props else None
        ) or self.node.try_get_context('environmentSuffix') or 'dev'

        # Add resource tags for compliance
        Tags.of(self).add("Environment", environment_suffix)
        Tags.of(self).add("Team", "platform-engineering")
        Tags.of(self).add("CostCenter", "engineering")
        Tags.of(self).add("Application", "transaction-processing")

        # Create VPC with 3 AZs
        vpc = ec2.Vpc(
            self, f"WebAppVpc{environment_suffix}",
            max_azs=3,
            nat_gateways=3,
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
            ]
        )

        # Create KMS key for RDS encryption
        rds_kms_key = kms.Key(
            self, f"RdsKmsKey{environment_suffix}",
            description=f"KMS key for RDS encryption - {environment_suffix}",
            enable_key_rotation=True,
            removal_policy=RemovalPolicy.DESTROY
        )

        # Create Security Groups
        # ALB Security Group
        alb_sg = ec2.SecurityGroup(
            self, f"AlbSecurityGroup{environment_suffix}",
            vpc=vpc,
            description="Security group for Application Load Balancer",
            allow_all_outbound=True
        )
        alb_sg.add_ingress_rule(
            ec2.Peer.any_ipv4(),
            ec2.Port.tcp(80),
            "Allow HTTP from internet"
        )

        # ECS Security Group
        ecs_sg = ec2.SecurityGroup(
            self, f"EcsSecurityGroup{environment_suffix}",
            vpc=vpc,
            description="Security group for ECS tasks",
            allow_all_outbound=True
        )

        # RDS Security Group
        rds_sg = ec2.SecurityGroup(
            self, f"RdsSecurityGroup{environment_suffix}",
            vpc=vpc,
            description="Security group for RDS Aurora cluster",
            allow_all_outbound=False
        )

        # Lambda Security Group
        lambda_sg = ec2.SecurityGroup(
            self, f"LambdaSecurityGroup{environment_suffix}",
            vpc=vpc,
            description="Security group for Lambda functions",
            allow_all_outbound=True
        )

        # Create Aurora PostgreSQL cluster
        db_cluster = rds.DatabaseCluster(
            self, f"AuroraCluster{environment_suffix}",
            engine=rds.DatabaseClusterEngine.aurora_postgres(
                version=rds.AuroraPostgresEngineVersion.VER_15_8
            ),
            writer=rds.ClusterInstance.provisioned("writer",
                instance_type=ec2.InstanceType.of(
                    ec2.InstanceClass.T3,
                    ec2.InstanceSize.MEDIUM
                )
            ),
            readers=[
                rds.ClusterInstance.provisioned("reader",
                    instance_type=ec2.InstanceType.of(
                        ec2.InstanceClass.T3,
                        ec2.InstanceSize.MEDIUM
                    )
                )
            ],
            vpc=vpc,
            vpc_subnets=ec2.SubnetSelection(subnet_type=ec2.SubnetType.PRIVATE_WITH_EGRESS),
            security_groups=[rds_sg],
            storage_encrypted=True,
            storage_encryption_key=rds_kms_key,
            backup=rds.BackupProps(
                retention=cdk.Duration.days(7)
            ),
            removal_policy=RemovalPolicy.DESTROY
        )

        # Configure security group rules for RDS
        rds_sg.add_ingress_rule(
            ecs_sg,
            ec2.Port.tcp(5432),
            "Allow ECS tasks to access RDS"
        )
        rds_sg.add_ingress_rule(
            lambda_sg,
            ec2.Port.tcp(5432),
            "Allow Lambda to access RDS"
        )

        # Create DynamoDB table for session storage
        sessions_table = dynamodb.Table(
            self, f"SessionsTable{environment_suffix}",
            partition_key=dynamodb.Attribute(
                name="sessionId",
                type=dynamodb.AttributeType.STRING
            ),
            billing_mode=dynamodb.BillingMode.PAY_PER_REQUEST,
            point_in_time_recovery=True,
            removal_policy=RemovalPolicy.DESTROY
        )

        # Create S3 bucket for static assets
        assets_bucket = s3.Bucket(
            self, f"AssetsBucket{environment_suffix}",
            versioned=True,
            removal_policy=RemovalPolicy.DESTROY,
            auto_delete_objects=True,
            encryption=s3.BucketEncryption.S3_MANAGED,
            block_public_access=s3.BlockPublicAccess.BLOCK_ALL,
            lifecycle_rules=[
                s3.LifecycleRule(
                    noncurrent_version_expiration=cdk.Duration.days(30)
                )
            ]
        )

        # Create CloudFront distribution
        origin_access_identity = cloudfront.OriginAccessIdentity(
            self, f"OAI{environment_suffix}"
        )

        assets_bucket.grant_read(origin_access_identity)

        distribution = cloudfront.Distribution(
            self, f"CdnDistribution{environment_suffix}",
            default_behavior=cloudfront.BehaviorOptions(
                origin=origins.S3Origin(
                    assets_bucket,
                    origin_access_identity=origin_access_identity
                ),
                viewer_protocol_policy=cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS
            )
        )

        # Create ECS cluster
        cluster = ecs.Cluster(
            self, f"WebAppCluster{environment_suffix}",
            vpc=vpc,
            cluster_name=f"web-app-cluster-{environment_suffix}"
        )

        # Create task definition
        task_definition = ecs.FargateTaskDefinition(
            self, f"TaskDef{environment_suffix}",
            memory_limit_mib=1024,
            cpu=512
        )

        # Add container to task definition
        container = task_definition.add_container(
            "WebApp",
            image=ecs.ContainerImage.from_registry("amazon/amazon-ecs-sample"),
            logging=ecs.LogDrivers.aws_logs(
                stream_prefix="web-app",
                log_retention=logs.RetentionDays.ONE_WEEK
            ),
            environment={
                "DB_HOST": db_cluster.cluster_endpoint.hostname,
                "DYNAMODB_TABLE": sessions_table.table_name,
                "S3_BUCKET": assets_bucket.bucket_name
            }
        )

        container.add_port_mappings(
            ecs.PortMapping(container_port=80)
        )

        # Grant permissions to task
        db_cluster.secret.grant_read(task_definition.task_role)
        sessions_table.grant_read_write_data(task_definition.task_role)
        assets_bucket.grant_read(task_definition.task_role)

        # Create Application Load Balancer
        alb = elbv2.ApplicationLoadBalancer(
            self, f"WebAppAlb{environment_suffix}",
            vpc=vpc,
            internet_facing=True,
            load_balancer_name=f"web-app-alb-{environment_suffix}",
            security_group=alb_sg
        )

        # Create target group
        target_group = elbv2.ApplicationTargetGroup(
            self, f"TargetGroup{environment_suffix}",
            vpc=vpc,
            port=80,
            protocol=elbv2.ApplicationProtocol.HTTP,
            target_type=elbv2.TargetType.IP,
            health_check=elbv2.HealthCheck(
                path="/",
                interval=cdk.Duration.seconds(30),
                timeout=cdk.Duration.seconds(5),
                healthy_threshold_count=2,
                unhealthy_threshold_count=3
            )
        )

        # Add HTTP listener (forward traffic to target group)
        listener = alb.add_listener(
            "Listener",
            port=80,
            default_target_groups=[target_group]
        )

        # Create Fargate service
        fargate_service = ecs.FargateService(
            self, f"WebAppService{environment_suffix}",
            cluster=cluster,
            task_definition=task_definition,
            desired_count=2,
            vpc_subnets=ec2.SubnetSelection(subnet_type=ec2.SubnetType.PRIVATE_WITH_EGRESS),
            security_groups=[ecs_sg],
            capacity_provider_strategies=[
                ecs.CapacityProviderStrategy(
                    capacity_provider="FARGATE",
                    weight=1,
                    base=1
                ),
                ecs.CapacityProviderStrategy(
                    capacity_provider="FARGATE_SPOT",
                    weight=1
                )
            ],
            circuit_breaker=ecs.DeploymentCircuitBreaker(rollback=True),
            health_check_grace_period=cdk.Duration.seconds(60)
        )

        # Configure security group rules for ECS
        ecs_sg.add_ingress_rule(
            alb_sg,
            ec2.Port.tcp(80),
            "Allow ALB to reach ECS tasks"
        )

        # Attach service to target group
        fargate_service.attach_to_application_target_group(target_group)

        # Configure auto-scaling
        scaling = fargate_service.auto_scale_task_count(
            min_capacity=2,
            max_capacity=10
        )

        scaling.scale_on_cpu_utilization(
            "CpuScaling",
            target_utilization_percent=70
        )

        scaling.scale_on_memory_utilization(
            "MemoryScaling",
            target_utilization_percent=70
        )

        # Create IAM role for Lambda with least privilege
        lambda_role = iam.Role(
            self, f"LambdaExecutionRole{environment_suffix}",
            assumed_by=iam.ServicePrincipal("lambda.amazonaws.com"),
            description="Execution role for transaction validation Lambda",
            managed_policies=[
                iam.ManagedPolicy.from_aws_managed_policy_name("service-role/AWSLambdaVPCAccessExecutionRole")
            ]
        )

        # Create Lambda function for transaction validation
        validation_lambda = lambda_.Function(
            self, f"ValidationLambda{environment_suffix}",
            runtime=lambda_.Runtime.PYTHON_3_11,
            handler="index.handler",
            code=lambda_.Code.from_inline("""
def handler(event, context):
    # Transaction validation logic
    transaction = event.get('transaction', {})

    # Basic validation
    if not transaction.get('amount') or not transaction.get('account'):
        return {'valid': False, 'reason': 'Missing required fields'}

    # Amount validation
    if transaction['amount'] <= 0:
        return {'valid': False, 'reason': 'Invalid amount'}

    return {'valid': True}
"""),
            environment={
                "DYNAMODB_TABLE": sessions_table.table_name,
                "DB_HOST": db_cluster.cluster_endpoint.hostname
            },
            reserved_concurrent_executions=10,
            timeout=cdk.Duration.seconds(30),
            vpc=vpc,
            vpc_subnets=ec2.SubnetSelection(subnet_type=ec2.SubnetType.PRIVATE_WITH_EGRESS),
            security_groups=[lambda_sg],
            role=lambda_role
        )

        sessions_table.grant_read_write_data(validation_lambda)
        db_cluster.secret.grant_read(validation_lambda)

        # Create SNS topic for alerts
        alerts_topic = sns.Topic(
            self, f"AlertsTopic{environment_suffix}",
            display_name=f"Critical Alerts - {environment_suffix}"
        )

        # Add email subscription (from environment variable)
        alert_email = os.environ.get('ALERT_EMAIL', 'ops-team@example.com')
        alerts_topic.add_subscription(
            sns_subs.EmailSubscription(alert_email)
        )

        # Create CloudWatch dashboard
        dashboard = cloudwatch.Dashboard(
            self, f"AppDashboard{environment_suffix}",
            dashboard_name=f"web-app-dashboard-{environment_suffix}"
        )

        # Add widgets to dashboard
        dashboard.add_widgets(
            cloudwatch.GraphWidget(
                title="ECS Service CPU",
                left=[fargate_service.metric_cpu_utilization()]
            ),
            cloudwatch.GraphWidget(
                title="ECS Service Memory",
                left=[fargate_service.metric_memory_utilization()]
            ),
            cloudwatch.GraphWidget(
                title="ALB Request Count",
                left=[alb.metric_request_count()]
            ),
            cloudwatch.GraphWidget(
                title="DynamoDB Operations",
                left=[
                    sessions_table.metric_consumed_read_capacity_units(),
                    sessions_table.metric_consumed_write_capacity_units()
                ]
            )
        )

        # Create comprehensive alarms
        # ECS CPU Alarm
        cpu_alarm = cloudwatch.Alarm(
            self, f"HighCpuAlarm{environment_suffix}",
            metric=fargate_service.metric_cpu_utilization(),
            threshold=80,
            evaluation_periods=2,
            alarm_description="High CPU utilization on ECS tasks"
        )
        cpu_alarm.add_alarm_action(cloudwatch_actions.SnsAction(alerts_topic))

        # ECS Memory Alarm
        memory_alarm = cloudwatch.Alarm(
            self, f"HighMemoryAlarm{environment_suffix}",
            metric=fargate_service.metric_memory_utilization(),
            threshold=80,
            evaluation_periods=2,
            alarm_description="High memory utilization on ECS tasks"
        )
        memory_alarm.add_alarm_action(cloudwatch_actions.SnsAction(alerts_topic))

        # ALB Target Response Time Alarm
        alb_latency_alarm = cloudwatch.Alarm(
            self, f"AlbHighLatencyAlarm{environment_suffix}",
            metric=alb.metric_target_response_time(),
            threshold=1.0,
            evaluation_periods=2,
            alarm_description="ALB high response time"
        )
        alb_latency_alarm.add_alarm_action(cloudwatch_actions.SnsAction(alerts_topic))

        # ALB 5XX Errors Alarm
        alb_5xx_alarm = cloudwatch.Alarm(
            self, f"Alb5xxErrorAlarm{environment_suffix}",
            metric=alb.metric_http_code_target(
                code=elbv2.HttpCodeTarget.TARGET_5XX_COUNT
            ),
            threshold=10,
            evaluation_periods=1,
            alarm_description="High 5XX error rate on ALB"
        )
        alb_5xx_alarm.add_alarm_action(cloudwatch_actions.SnsAction(alerts_topic))

        # RDS CPU Alarm
        rds_cpu_alarm = cloudwatch.Alarm(
            self, f"RdsHighCpuAlarm{environment_suffix}",
            metric=db_cluster.metric_cpu_utilization(),
            threshold=80,
            evaluation_periods=2,
            alarm_description="High CPU utilization on RDS cluster"
        )
        rds_cpu_alarm.add_alarm_action(cloudwatch_actions.SnsAction(alerts_topic))

        # RDS Database Connections Alarm
        rds_connections_alarm = cloudwatch.Alarm(
            self, f"RdsHighConnectionsAlarm{environment_suffix}",
            metric=db_cluster.metric_database_connections(),
            threshold=80,
            evaluation_periods=2,
            alarm_description="High number of database connections"
        )
        rds_connections_alarm.add_alarm_action(cloudwatch_actions.SnsAction(alerts_topic))

        # Lambda Errors Alarm
        lambda_error_alarm = cloudwatch.Alarm(
            self, f"LambdaErrorAlarm{environment_suffix}",
            metric=validation_lambda.metric_errors(),
            threshold=5,
            evaluation_periods=1,
            alarm_description="High error rate on Lambda function"
        )
        lambda_error_alarm.add_alarm_action(cloudwatch_actions.SnsAction(alerts_topic))

        # Lambda Throttles Alarm
        lambda_throttle_alarm = cloudwatch.Alarm(
            self, f"LambdaThrottleAlarm{environment_suffix}",
            metric=validation_lambda.metric_throttles(),
            threshold=1,
            evaluation_periods=1,
            alarm_description="Lambda function throttling"
        )
        lambda_throttle_alarm.add_alarm_action(cloudwatch_actions.SnsAction(alerts_topic))

        # DynamoDB Throttles Alarm
        dynamodb_read_throttle_alarm = cloudwatch.Alarm(
            self, f"DynamoDbReadThrottleAlarm{environment_suffix}",
            metric=sessions_table.metric_user_errors(),
            threshold=5,
            evaluation_periods=1,
            alarm_description="DynamoDB read throttling"
        )
        dynamodb_read_throttle_alarm.add_alarm_action(cloudwatch_actions.SnsAction(alerts_topic))

        # Output important values
        cdk.CfnOutput(
            self, "LoadBalancerDNS",
            value=alb.load_balancer_dns_name,
            description="Application Load Balancer DNS"
        )

        cdk.CfnOutput(
            self, "CloudFrontURL",
            value=distribution.distribution_domain_name,
            description="CloudFront distribution URL"
        )

        cdk.CfnOutput(
            self, "DatabaseEndpoint",
            value=db_cluster.cluster_endpoint.hostname,
            description="Aurora cluster endpoint"
        )
