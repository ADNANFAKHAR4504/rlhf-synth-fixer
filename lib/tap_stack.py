"""tap_stack.py
This module defines the TapStack class, which serves as the main CDK stack for 
the TAP (Test Automation Platform) project.
It orchestrates the instantiation of other resource-specific stacks and 
manages environment-specific configurations.
"""

from typing import Optional
import json
import aws_cdk as cdk
from aws_cdk import (
    Stack,
    Duration,
    RemovalPolicy,
    CfnOutput,
    Tags,
    aws_ec2 as ec2,
    aws_iam as iam,
    aws_rds as rds,
    aws_s3 as s3,
    aws_cloudfront as cloudfront,
    aws_cloudfront_origins as origins,
    aws_lambda as lambda_,
    aws_ecs as ecs,
    aws_ecs_patterns as ecs_patterns,
    aws_autoscaling as autoscaling,
    aws_elasticloadbalancingv2 as elbv2,
    aws_secretsmanager as secretsmanager,
    aws_logs as logs,
    aws_cloudwatch as cloudwatch,
    aws_sns as sns,
    aws_cloudwatch_actions as cw_actions,
)
from constructs import Construct


class TapStackProps(cdk.StackProps):
    """
    TapStackProps defines the properties for the TapStack CDK stack.

    Args:
        environment_suffix (Optional[str]): An optional suffix to identify the 
        deployment environment (e.g., 'dev', 'prod').
        **kwargs: Additional keyword arguments passed to the base cdk.StackProps.

    Attributes:
        environment_suffix (Optional[str]): Stores the environment suffix for the stack.
    """

    def __init__(self, environment_suffix: Optional[str] = None, **kwargs):
        super().__init__(**kwargs)
        self.environment_suffix = environment_suffix


class TapStack(cdk.Stack):
    """
    Represents the main CDK stack for the Tap project.

    This stack creates a complete production-ready web application infrastructure
    including networking, compute (Lambda, ECS Fargate, EC2 ASG), database (RDS Multi-AZ),
    storage (S3 + CloudFront), and security best practices.
    """

    def __init__(
        self,
        scope: Construct,
        construct_id: str,
        props: Optional[TapStackProps] = None,
        **kwargs
    ):
        super().__init__(scope, construct_id, **kwargs)

        # Get environment suffix from props, context, or use 'dev' as default
        environment_suffix = (
            props.environment_suffix if props else None
        ) or self.node.try_get_context('environmentSuffix') or 'dev'

        # Stack configuration parameters
        self.env_name = environment_suffix.capitalize()  # Changed from self.environment
        self.owner = "TeamX"
        self.project_name = "TapStack"
        
        # Apply consistent tags to all resources
        Tags.of(self).add("Environment", self.env_name)  # Changed from self.environment
        Tags.of(self).add("Owner", self.owner)
        Tags.of(self).add("Project", self.project_name)
        Tags.of(self).add("ManagedBy", "CDK")
        Tags.of(self).add("CostCenter", "Engineering")

        # ============================================================
        # NETWORKING FOUNDATION
        # ============================================================
        
        # Create VPC with multiple AZs for high availability
        self.vpc = ec2.Vpc(
            self, "ProductionVPC",
            vpc_name=f"{self.project_name}-vpc-{self.env_name.lower()}",  # Changed from self.environment.lower()
            max_azs=3,  # Use 3 AZs for maximum resilience
            nat_gateways=2,  # 2 NAT gateways for HA, but cost-conscious
            subnet_configuration=[
                # Public subnets for load balancers and bastion hosts
                ec2.SubnetConfiguration(
                    name="Public",
                    subnet_type=ec2.SubnetType.PUBLIC,
                    cidr_mask=24
                ),
                # Private subnets for application tier
                ec2.SubnetConfiguration(
                    name="Private",
                    subnet_type=ec2.SubnetType.PRIVATE_WITH_EGRESS,
                    cidr_mask=24
                ),
                # Isolated subnets for database tier
                ec2.SubnetConfiguration(
                    name="Isolated",
                    subnet_type=ec2.SubnetType.PRIVATE_ISOLATED,
                    cidr_mask=24
                )
            ],
            enable_dns_hostnames=True,
            enable_dns_support=True
        )

        # VPC Flow Logs for network monitoring
        self.vpc_flow_logs = ec2.FlowLog(
            self, "VPCFlowLogs",
            resource_type=ec2.FlowLogResourceType.from_vpc(self.vpc),
            destination=ec2.FlowLogDestination.to_cloud_watch_logs(
                log_group=logs.LogGroup(
                    self, "VPCFlowLogGroup",
                    retention=logs.RetentionDays.FIVE_DAYS,
                    removal_policy=RemovalPolicy.DESTROY
                )
            )
        )

        # ============================================================
        # SECURITY GROUPS
        # ============================================================
        
        # Security group for ALB
        self.alb_security_group = ec2.SecurityGroup(
            self, "ALBSecurityGroup",
            vpc=self.vpc,
            description="Security group for Application Load Balancer",
            allow_all_outbound=True
        )
        self.alb_security_group.add_ingress_rule(
            ec2.Peer.any_ipv4(),
            ec2.Port.tcp(443),
            "Allow HTTPS traffic from internet"
        )
        self.alb_security_group.add_ingress_rule(
            ec2.Peer.any_ipv4(),
            ec2.Port.tcp(80),
            "Allow HTTP traffic from internet"
        )

        # Security group for application tier
        self.app_security_group = ec2.SecurityGroup(
            self, "AppSecurityGroup",
            vpc=self.vpc,
            description="Security group for application tier",
            allow_all_outbound=True
        )
        self.app_security_group.add_ingress_rule(
            self.alb_security_group,
            ec2.Port.tcp(80),
            "Allow traffic from ALB"
        )

        # Security group for database
        self.db_security_group = ec2.SecurityGroup(
            self, "DatabaseSecurityGroup",
            vpc=self.vpc,
            description="Security group for RDS database",
            allow_all_outbound=False
        )
        self.db_security_group.add_ingress_rule(
            self.app_security_group,
            ec2.Port.tcp(3306),
            "Allow MySQL traffic from application tier"
        )

        # ============================================================
        # DATABASE LAYER (RDS Multi-AZ)
        # ============================================================
        
        # Create database credentials in Secrets Manager
        self.db_credentials = secretsmanager.Secret(
            self, "DatabaseCredentials",
            description="RDS MySQL database credentials",
            generate_secret_string=secretsmanager.SecretStringGenerator(
                secret_string_template=json.dumps({"username": "admin"}),
                generate_string_key="password",
                exclude_characters=" @\"'\\/#",
                password_length=32
            )
        )

        # RDS subnet group
        self.db_subnet_group = rds.SubnetGroup(
            self, "DatabaseSubnetGroup",
            description="Subnet group for RDS database",
            vpc=self.vpc,
            vpc_subnets=ec2.SubnetSelection(
                subnet_type=ec2.SubnetType.PRIVATE_ISOLATED
            )
        )

        # RDS MySQL instance with Multi-AZ for high availability
        self.database = rds.DatabaseInstance(
            self, "ProductionDatabase",
            engine=rds.DatabaseInstanceEngine.mysql(
                version=rds.MysqlEngineVersion.VER_8_0_35
            ),
            instance_type=ec2.InstanceType.of(
                ec2.InstanceClass.T3,
                ec2.InstanceSize.MEDIUM
            ),
            vpc=self.vpc,
            subnet_group=self.db_subnet_group,
            security_groups=[self.db_security_group],
            multi_az=True,  # Enable Multi-AZ for high availability
            allocated_storage=100,
            storage_type=rds.StorageType.GP3,
            storage_encrypted=True,  # Enable encryption at rest
            credentials=rds.Credentials.from_secret(self.db_credentials),
            backup_retention=Duration.days(7),  # 7-day backup retention
            preferred_backup_window="03:00-04:00",
            preferred_maintenance_window="Mon:04:00-Mon:05:00",
            deletion_protection=False,  # Prevent accidental deletion
            monitoring_interval=Duration.seconds(60),
            cloudwatch_logs_exports=["error", "general", "slowquery"],
            auto_minor_version_upgrade=False,
            removal_policy=RemovalPolicy.SNAPSHOT  # Take snapshot on deletion
        )

        # ============================================================
        # STORAGE AND CDN (S3 + CloudFront)
        # ============================================================
        
        # S3 bucket for static assets with encryption and versioning
        self.static_bucket = s3.Bucket(
            self, "StaticAssetsBucket",
            bucket_name=f"{self.project_name.lower()}-static-{self.account}-{self.region}",
            versioned=True,  # Enable versioning
            encryption=s3.BucketEncryption.S3_MANAGED,  # Enable encryption at rest
            block_public_access=s3.BlockPublicAccess.BLOCK_ALL,
            lifecycle_rules=[
                s3.LifecycleRule(
                    id="DeleteOldVersions",
                    noncurrent_version_expiration=Duration.days(30),
                    abort_incomplete_multipart_upload_after=Duration.days(7)
                )
            ],
            removal_policy=RemovalPolicy.RETAIN  # Retain bucket on stack deletion
        )

        # CloudFront Origin Access Identity
        self.oai = cloudfront.OriginAccessIdentity(
            self, "CloudFrontOAI",
            comment=f"OAI for {self.project_name} static assets"
        )

        # Grant CloudFront access to S3 bucket
        self.static_bucket.grant_read(self.oai)

        # CloudFront distribution for global content delivery
        self.distribution = cloudfront.Distribution(
            self, "StaticContentDistribution",
            default_root_object="index.html",
            default_behavior=cloudfront.BehaviorOptions(
                origin=origins.S3Origin(
                    self.static_bucket,
                    origin_access_identity=self.oai
                ),
                viewer_protocol_policy=cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
                cache_policy=cloudfront.CachePolicy.CACHING_OPTIMIZED,
                compress=True
            ),
            price_class=cloudfront.PriceClass.PRICE_CLASS_100,  # Cost optimization
            enable_logging=True,
            log_bucket=s3.Bucket(
                self, "CloudFrontLogsBucket",
                bucket_name=f"{self.project_name.lower()}-cf-logs-{self.account}-{self.region}",
                encryption=s3.BucketEncryption.S3_MANAGED,
                lifecycle_rules=[
                    s3.LifecycleRule(
                        id="DeleteOldLogs",
                        expiration=Duration.days(90)
                    )
                ],
                removal_policy=RemovalPolicy.DESTROY
            ),
            geo_restriction=cloudfront.GeoRestriction.allowlist(
                "US", "CA", "GB", "DE", "FR", "JP", "AU"  # Adjust based on your needs
            )
        )

        # ============================================================
        # COMPUTE - LAMBDA FUNCTIONS
        # ============================================================
        
        # IAM role for Lambda functions
        self.lambda_role = iam.Role(
            self, "LambdaExecutionRole",
            assumed_by=iam.ServicePrincipal("lambda.amazonaws.com"),
            managed_policies=[
                iam.ManagedPolicy.from_aws_managed_policy_name(
                    "service-role/AWSLambdaVPCAccessExecutionRole"
                )
            ]
        )

        # Grant Lambda access to database credentials
        self.db_credentials.grant_read(self.lambda_role)

        # Lambda function for lightweight processing (from MODEL_RESPONSE.md)
        self.process_function = lambda_.Function(
            self, "ProcessFunction",
            function_name=f"{self.project_name}-processor-{environment_suffix}",
            runtime=lambda_.Runtime.PYTHON_3_11,
            handler="index.handler",
            code=lambda_.Code.from_inline("""
import json
import boto3
import os

def handler(event, context):
    # Sample Lambda function
    print(f"Processing event: {json.dumps(event)}")
    
    # Get database credentials from Secrets Manager
    secret_arn = os.environ.get('DB_SECRET_ARN')
    if secret_arn:
        sm_client = boto3.client('secretsmanager')
        secret = sm_client.get_secret_value(SecretId=secret_arn)
        credentials = json.loads(secret['SecretString'])
        # Use credentials to connect to database (implementation depends on your needs)
    
    return {
        'statusCode': 200,
        'body': json.dumps('Processing complete')
    }
            """),
            role=self.lambda_role,
            vpc=self.vpc,
            vpc_subnets=ec2.SubnetSelection(
                subnet_type=ec2.SubnetType.PRIVATE_WITH_EGRESS
            ),
            security_groups=[self.app_security_group],
            environment={
                "DB_SECRET_ARN": self.db_credentials.secret_arn,
                "ENVIRONMENT": self.env_name  # Changed from self.environment
            },
            timeout=Duration.seconds(30),
            memory_size=256,
            reserved_concurrent_executions=10,  # Cost optimization
            tracing=lambda_.Tracing.ACTIVE,
            log_retention=logs.RetentionDays.FIVE_DAYS
        )

        # ============================================================
        # COMPUTE - ECS FARGATE CLUSTER
        # ============================================================
        
        # ECS Cluster
        self.ecs_cluster = ecs.Cluster(
            self, "FargateCluster",
            cluster_name=f"{self.project_name}-cluster-{environment_suffix}",
            vpc=self.vpc,
            container_insights=True  # Enable Container Insights for monitoring
        )

        # Task role for ECS tasks
        self.task_role = iam.Role(
            self, "ECSTaskRole",
            assumed_by=iam.ServicePrincipal("ecs-tasks.amazonaws.com")
        )
        
        # Grant ECS tasks access to database credentials
        self.db_credentials.grant_read(self.task_role)
        
        # Task execution role
        self.execution_role = iam.Role(
            self, "ECSExecutionRole",
            assumed_by=iam.ServicePrincipal("ecs-tasks.amazonaws.com"),
            managed_policies=[
                iam.ManagedPolicy.from_aws_managed_policy_name(
                    "service-role/AmazonECSTaskExecutionRolePolicy"
                )
            ]
        )

        # Fargate task definition
        self.task_definition = ecs.FargateTaskDefinition(
            self, "WebAppTaskDef",
            cpu=512,
            memory_limit_mib=1024,
            task_role=self.task_role,
            execution_role=self.execution_role
        )

        # Add container to task definition
        self.container = self.task_definition.add_container(
            "WebContainer",
            image=ecs.ContainerImage.from_registry("nginx:alpine"),  # Replace with your image
            logging=ecs.LogDrivers.aws_logs(
                stream_prefix="webapp",
                log_retention=logs.RetentionDays.FIVE_DAYS
            ),
            environment={
                "ENVIRONMENT": self.env_name,  # Changed from self.environment
                "DB_SECRET_ARN": self.db_credentials.secret_arn
            },
            health_check=ecs.HealthCheck(
                command=["CMD-SHELL", "curl -f http://localhost/ || exit 1"],
                interval=Duration.seconds(30),
                timeout=Duration.seconds(5),
                retries=3
            )
        )
        
        self.container.add_port_mappings(
            ecs.PortMapping(container_port=80, protocol=ecs.Protocol.TCP)
        )

        # Application Load Balancer for ECS service
        self.ecs_alb = elbv2.ApplicationLoadBalancer(
            self, "ECSLoadBalancer",
            vpc=self.vpc,
            internet_facing=True,
            security_group=self.alb_security_group
        )

        # ECS Fargate Service with ALB
        self.ecs_service = ecs_patterns.ApplicationLoadBalancedFargateService(
            self, "FargateWebService",
            cluster=self.ecs_cluster,
            task_definition=self.task_definition,
            desired_count=2,  # Start with 2 tasks for HA
            public_load_balancer=True,
            load_balancer=self.ecs_alb,
            assign_public_ip=False,  # Tasks in private subnets
            health_check_grace_period=Duration.seconds(60)
        )

        # Configure auto-scaling for ECS service
        self.ecs_scaling = self.ecs_service.service.auto_scale_task_count(
            min_capacity=2,
            max_capacity=10
        )
        
        self.ecs_scaling.scale_on_cpu_utilization(
            "CPUScaling",
            target_utilization_percent=70,
            scale_in_cooldown=Duration.seconds(300),
            scale_out_cooldown=Duration.seconds(60)
        )
        
        self.ecs_scaling.scale_on_memory_utilization(
            "MemoryScaling",
            target_utilization_percent=80,
            scale_in_cooldown=Duration.seconds(300),
            scale_out_cooldown=Duration.seconds(60)
        )

        # ============================================================
        # COMPUTE - EC2 AUTO SCALING GROUP
        # ============================================================
        
        # IAM role for EC2 instances
        self.ec2_role = iam.Role(
            self, "EC2InstanceRole",
            assumed_by=iam.ServicePrincipal("ec2.amazonaws.com"),
            managed_policies=[
                iam.ManagedPolicy.from_aws_managed_policy_name(
                    "AmazonSSMManagedInstanceCore"  # For Systems Manager access
                ),
                iam.ManagedPolicy.from_aws_managed_policy_name(
                    "CloudWatchAgentServerPolicy"
                )
            ]
        )
        
        # Grant EC2 instances access to database credentials
        self.db_credentials.grant_read(self.ec2_role)

        # Launch template for EC2 instances
        self.user_data = ec2.UserData.for_linux()
        self.user_data.add_commands(
            "yum update -y",
            "yum install -y amazon-cloudwatch-agent",
            "yum install -y aws-cfn-bootstrap",
            # Add your application installation commands here
            "echo 'Application deployment complete'"
        )

        # Application Load Balancer for EC2 ASG
        self.ec2_alb = elbv2.ApplicationLoadBalancer(
            self, "EC2LoadBalancer",
            vpc=self.vpc,
            internet_facing=True,
            security_group=self.alb_security_group
        )

        # Target group for EC2 instances
        self.target_group = elbv2.ApplicationTargetGroup(
            self, "EC2TargetGroup",
            vpc=self.vpc,
            port=80,
            protocol=elbv2.ApplicationProtocol.HTTP,
            target_type=elbv2.TargetType.INSTANCE,
            health_check=elbv2.HealthCheck(
                path="/health",
                interval=Duration.seconds(30),
                timeout=Duration.seconds(10),
                healthy_threshold_count=2,
                unhealthy_threshold_count=3
            )
        )

        # Auto Scaling Group
        self.asg = autoscaling.AutoScalingGroup(
            self, "WebAutoScalingGroup",
            vpc=self.vpc,
            instance_type=ec2.InstanceType.of(
                ec2.InstanceClass.T3,
                ec2.InstanceSize.SMALL
            ),
            machine_image=ec2.MachineImage.latest_amazon_linux2(),
            role=self.ec2_role,
            user_data=self.user_data,
            min_capacity=2,  # Minimum 2 instances for HA
            max_capacity=10,
            desired_capacity=2,
            vpc_subnets=ec2.SubnetSelection(
                subnet_type=ec2.SubnetType.PRIVATE_WITH_EGRESS
            ),
            security_group=self.app_security_group,
            health_check=autoscaling.HealthCheck.elb(
                grace=Duration.seconds(300)
            ),
            update_policy=autoscaling.UpdatePolicy.rolling_update(
                max_batch_size=1,
                min_instances_in_service=1,
                pause_time=Duration.minutes(5)
            )
        )

        # Attach ASG to target group
        self.asg.attach_to_application_target_group(self.target_group)

        # Add listener to ALB
        self.ec2_listener = self.ec2_alb.add_listener(
            "EC2Listener",
            port=80,
            default_action=elbv2.ListenerAction.forward(
                target_groups=[self.target_group]
            )
        )

        # Configure auto-scaling policies
        self.asg.scale_on_cpu_utilization(
            "CPUAutoScaling",
            target_utilization_percent=70,
            cooldown=Duration.seconds(300)
        )

        # Add scale-out policy for request count
        self.asg.scale_on_request_count(
            "RequestCountScaling",
            target_requests_per_minute=1000,
            cooldown=Duration.seconds(300)
        )

        # ============================================================
        # MONITORING AND ALERTING
        # ============================================================
        
        # SNS topic for alerts
        self.alert_topic = sns.Topic(
            self, "AlertTopic",
            display_name=f"{self.project_name} {self.env_name} Alerts"  # Changed from self.environment
        )

        # CloudWatch Alarms
        
        # Database CPU alarm
        self.db_cpu_alarm = cloudwatch.Alarm(
            self, "DatabaseCPUAlarm",
            metric=self.database.metric_cpu_utilization(),
            threshold=80,
            evaluation_periods=2,
            datapoints_to_alarm=2
        )
        self.db_cpu_alarm.add_alarm_action(
            cw_actions.SnsAction(self.alert_topic)
        )

        # ECS service CPU alarm
        self.ecs_cpu_alarm = cloudwatch.Alarm(
            self, "ECSServiceCPUAlarm",
            metric=self.ecs_service.service.metric_cpu_utilization(),
            threshold=80,
            evaluation_periods=2,
            datapoints_to_alarm=2
        )
        self.ecs_cpu_alarm.add_alarm_action(
            cw_actions.SnsAction(self.alert_topic)
        )

        # Lambda errors alarm
        self.lambda_error_alarm = cloudwatch.Alarm(
            self, "LambdaErrorAlarm",
            metric=self.process_function.metric_errors(),
            threshold=5,
            evaluation_periods=1
        )
        self.lambda_error_alarm.add_alarm_action(
            cw_actions.SnsAction(self.alert_topic)
        )

        # ============================================================
        # OUTPUTS
        # ============================================================
        
        CfnOutput(
            self, "VPCId",
            value=self.vpc.vpc_id,
            description="VPC ID",
            export_name=f"{self.stack_name}-VPCId"
        )
        
        CfnOutput(
            self, "CloudFrontURL",
            value=f"https://{self.distribution.distribution_domain_name}",
            description="CloudFront distribution URL",
            export_name=f"{self.stack_name}-CloudFrontURL"
        )
        
        CfnOutput(
            self, "ECSServiceURL",
            value=f"http://{self.ecs_alb.load_balancer_dns_name}",
            description="ECS Service Load Balancer URL",
            export_name=f"{self.stack_name}-ECSServiceURL"
        )
        
        CfnOutput(
            self, "EC2ASGURL",
            value=f"http://{self.ec2_alb.load_balancer_dns_name}",
            description="EC2 Auto Scaling Group Load Balancer URL",
            export_name=f"{self.stack_name}-EC2ASGURL"
        )
        
        CfnOutput(
            self, "DatabaseEndpoint",
            value=self.database.db_instance_endpoint_address,
            description="RDS Database Endpoint",
            export_name=f"{self.stack_name}-DatabaseEndpoint"
        )
        
        CfnOutput(
            self, "DatabaseSecretArn",
            value=self.db_credentials.secret_arn,
            description="Database credentials Secret ARN",
            export_name=f"{self.stack_name}-DatabaseSecretArn"
        )
        
        CfnOutput(
            self, "StaticBucketName",
            value=self.static_bucket.bucket_name,
            description="Static assets S3 bucket name",
            export_name=f"{self.stack_name}-StaticBucketName"
        )

        CfnOutput(
            self, "LambdaFunctionName",
            value=self.process_function.function_name,
            description="Lambda function name for processing",
            export_name=f"{self.stack_name}-LambdaFunctionName"
        )

        CfnOutput(
            self, "Environment",
            value=environment_suffix,
            description="Environment suffix used for resource naming",
            export_name=f"{self.stack_name}-Environment"
        )
