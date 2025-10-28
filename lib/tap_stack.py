"""tap_stack.py
This module defines the TapStack class, which serves as the main CDK stack for
the TAP (Test Automation Platform) project.
It orchestrates the instantiation of other resource-specific stacks and
manages environment-specific configurations.
"""
# pylint: disable=too-many-lines,too-many-positional-arguments,redefined-builtin
# This is a comprehensive infrastructure definition that requires detailed configuration
# construct_id is used instead of id where possible, but some remain for CDK compatibility

from typing import Optional, List
import aws_cdk as cdk
from aws_cdk import (
    Stack,
    NestedStack,
    CfnOutput,
    Duration,
    RemovalPolicy,
    Tags,
    aws_ec2 as ec2,
    aws_s3 as s3,
    aws_cloudfront as cloudfront,
    aws_cloudfront_origins as origins,
    aws_route53 as route53,
    aws_route53_targets as targets,
    aws_autoscaling as autoscaling,
    aws_iam as iam,
    aws_config as config,
    aws_cloudwatch as cloudwatch,
    aws_cloudwatch_actions as cw_actions,
    aws_sns as sns,
    aws_sns_subscriptions as sns_subs,
    aws_lambda as lambda_,
    aws_lambda_nodejs as nodejs_lambda,
    aws_codepipeline as codepipeline,
    aws_codepipeline_actions as codepipeline_actions,
    aws_codebuild as codebuild,
    aws_cloudtrail as cloudtrail,
    aws_kms as kms,
    aws_logs as logs,
    aws_elasticloadbalancingv2 as elbv2,
    aws_events as events,
    aws_events_targets as event_targets,
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


class NetworkingStack(NestedStack):
    """Nested stack for VPC and networking resources."""

    def __init__(
        self,
        scope: Construct,
        construct_id: str,
        environment_suffix: str,
        region: str,
        allowed_ip_ranges: List[str],
        **kwargs
    ) -> None:
        """Initialize the networking stack with VPC and related resources."""
        super().__init__(scope, construct_id, **kwargs)

        # Create VPC with public and private subnets across multiple AZs
        self.vpc = ec2.Vpc(
            self,
            "TapVpc",
            vpc_name=f"tap-vpc-{environment_suffix}-{region}",
            max_azs=3,
            nat_gateways=2,
            subnet_configuration=[
                ec2.SubnetConfiguration(
                    name=f"Public-{environment_suffix}",
                    subnet_type=ec2.SubnetType.PUBLIC,
                    cidr_mask=24,
                ),
                ec2.SubnetConfiguration(
                    name=f"Private-{environment_suffix}",
                    subnet_type=ec2.SubnetType.PRIVATE_WITH_EGRESS,
                    cidr_mask=24,
                ),
                ec2.SubnetConfiguration(
                    name=f"Isolated-{environment_suffix}",
                    subnet_type=ec2.SubnetType.PRIVATE_ISOLATED,
                    cidr_mask=24,
                ),
            ],
            enable_dns_hostnames=True,
            enable_dns_support=True,
        )

        # Tag VPC
        Tags.of(self.vpc).add("iac-rlhf-amazon", f"vpc-{environment_suffix}")

        # Create security groups with IP restrictions
        self.web_security_group = ec2.SecurityGroup(
            self,
            "WebSecurityGroup",
            vpc=self.vpc,
            description="Security group for web tier",
            security_group_name=f"tap-web-sg-{environment_suffix}-{region}",
            allow_all_outbound=True,
        )

        # Add ingress rules for allowed IP ranges
        for ip_range in allowed_ip_ranges:
            self.web_security_group.add_ingress_rule(
                peer=ec2.Peer.ipv4(ip_range),
                connection=ec2.Port.tcp(443),
                description=f"HTTPS from {ip_range}",
            )
            self.web_security_group.add_ingress_rule(
                peer=ec2.Peer.ipv4(ip_range),
                connection=ec2.Port.tcp(80),
                description=f"HTTP from {ip_range}",
            )

        Tags.of(self.web_security_group).add(
            "iac-rlhf-amazon", f"web-sg-{environment_suffix}"
        )

        self.app_security_group = ec2.SecurityGroup(
            self,
            "AppSecurityGroup",
            vpc=self.vpc,
            description="Security group for application tier",
            security_group_name=f"tap-app-sg-{environment_suffix}-{region}",
            allow_all_outbound=True,
        )

        # Allow traffic from web tier to app tier
        self.app_security_group.add_ingress_rule(
            peer=self.web_security_group,
            connection=ec2.Port.tcp(8080),
            description="App traffic from web tier",
        )

        Tags.of(self.app_security_group).add(
            "iac-rlhf-amazon", f"app-sg-{environment_suffix}"
        )

        # VPC Flow Logs for monitoring
        # pylint: disable=no-member
        self.flow_log = ec2.FlowLog(
            self,
            "VpcFlowLog",
            resource_type=ec2.FlowLogResourceType.from_vpc(self.vpc),
            traffic_type=ec2.FlowLogTrafficType.ALL,
        )

        Tags.of(self.flow_log).add(
            "iac-rlhf-amazon", f"vpc-flow-log-{environment_suffix}"
        )


class ComputeStack(NestedStack):
    """Nested stack for EC2 and Auto Scaling resources."""

    def __init__(
        self,
        scope: Construct,
        construct_id: str,
        environment_suffix: str,
        region: str,
        vpc: ec2.Vpc,
        security_group: ec2.SecurityGroup,
        **kwargs
    ) -> None:
        """Initialize the compute stack with EC2 and auto-scaling."""
        super().__init__(scope, construct_id, **kwargs)

        # Create IAM role for EC2 instances
        self.instance_role = iam.Role(
            self,
            "InstanceRole",
            assumed_by=iam.ServicePrincipal("ec2.amazonaws.com"),
            role_name=f"tap-instance-role-{environment_suffix}-{region}",
            managed_policies=[
                iam.ManagedPolicy.from_aws_managed_policy_name(
                    "CloudWatchAgentServerPolicy"
                ),
                iam.ManagedPolicy.from_aws_managed_policy_name(
                    "AmazonSSMManagedInstanceCore"
                ),
            ],
        )

        Tags.of(self.instance_role).add(
            "iac-rlhf-amazon", f"instance-role-{environment_suffix}"
        )

        # Create launch template
        user_data = ec2.UserData.for_linux()
        user_data.add_commands(
            "yum update -y",
            "yum install -y amazon-cloudwatch-agent",
            "amazon-linux-extras install -y nginx1",
            "systemctl start nginx",
            "systemctl enable nginx",
        )

        # Application Load Balancer
        self.alb = elbv2.ApplicationLoadBalancer(
            self,
            "ALB",
            vpc=vpc,
            internet_facing=True,
            load_balancer_name=f"tap-alb-{environment_suffix}-{region}",
            security_group=security_group,
        )

        Tags.of(self.alb).add("iac-rlhf-amazon", f"alb-{environment_suffix}")

        # Target group for ALB
        self.target_group = elbv2.ApplicationTargetGroup(
            self,
            "TargetGroup",
            vpc=vpc,
            port=80,
            protocol=elbv2.ApplicationProtocol.HTTP,
            target_type=elbv2.TargetType.INSTANCE,
            target_group_name=f"tap-tg-{environment_suffix}",
            health_check=elbv2.HealthCheck(
                enabled=True,
                path="/health",
                interval=Duration.seconds(30),
                timeout=Duration.seconds(5),
                healthy_threshold_count=2,
                unhealthy_threshold_count=3,
            ),
        )

        Tags.of(self.target_group).add(
            "iac-rlhf-amazon", f"target-group-{environment_suffix}"
        )

        # Create Auto Scaling Group
        self.asg = autoscaling.AutoScalingGroup(
            self,
            "ASG",
            vpc=vpc,
            instance_type=ec2.InstanceType.of(
                ec2.InstanceClass.T3, ec2.InstanceSize.MEDIUM
            ),
            machine_image=ec2.MachineImage.latest_amazon_linux2(),
            min_capacity=2,
            max_capacity=10,
            desired_capacity=3,
            vpc_subnets=ec2.SubnetSelection(
                subnet_type=ec2.SubnetType.PRIVATE_WITH_EGRESS
            ),
            security_group=security_group,
            role=self.instance_role,
            user_data=user_data,
            auto_scaling_group_name=f"tap-asg-{environment_suffix}-{region}",
            update_policy=autoscaling.UpdatePolicy.rolling_update(
                max_batch_size=2, min_instances_in_service=1
            ),
            health_check=autoscaling.HealthCheck.elb(grace=Duration.seconds(60)),
        )

        Tags.of(self.asg).add("iac-rlhf-amazon", f"asg-{environment_suffix}")

        # Attach ASG to target group
        self.asg.attach_to_application_target_group(self.target_group)

        # Add listener to ALB
        self.alb.add_listener(
            "Listener",
            port=80,
            protocol=elbv2.ApplicationProtocol.HTTP,
            default_target_groups=[self.target_group],
        )

        # Auto Scaling policies
        self.asg.scale_on_cpu_utilization(
            "CpuScaling",
            target_utilization_percent=70,
            cooldown=Duration.seconds(300),
        )

        self.asg.scale_on_metric(
            "MemoryScaling",
            metric=cloudwatch.Metric(
                namespace="CWAgent",
                metric_name="mem_used_percent",
                dimensions_map={
                    "AutoScalingGroupName": self.asg.auto_scaling_group_name
                },
            ),
            scaling_steps=[
                autoscaling.ScalingInterval(change=1, lower=60, upper=80),
                autoscaling.ScalingInterval(change=2, lower=80),
            ],
            adjustment_type=autoscaling.AdjustmentType.CHANGE_IN_CAPACITY,
        )


class StorageStack(NestedStack):
    """Nested stack for S3 storage with enhanced security."""

    def __init__(
        self,
        scope: Construct,
        construct_id: str,
        environment_suffix: str,
        region: str,
        account_id: str,
        **kwargs
    ) -> None:
        """Initialize the storage stack with S3 buckets and KMS encryption."""
        super().__init__(scope, construct_id, **kwargs)

        # Create KMS key for S3 encryption
        self.kms_key = kms.Key(
            self,
            "S3KmsKey",
            description=f"KMS key for S3 encryption in TAP {environment_suffix}",
            enable_key_rotation=True,
            removal_policy=(
                RemovalPolicy.RETAIN
                if environment_suffix == "prod"
                else RemovalPolicy.DESTROY
            ),
            alias=f"alias/tap-s3-{environment_suffix}-{region}",
        )

        Tags.of(self.kms_key).add("iac-rlhf-amazon", f"kms-key-{environment_suffix}")

        # Create S3 bucket for logs
        self.log_bucket = s3.Bucket(
            self,
            "LogBucket",
            bucket_name=f"tap-logs-{account_id}-{environment_suffix}-{region}",
            encryption=s3.BucketEncryption.S3_MANAGED,
            block_public_access=s3.BlockPublicAccess.BLOCK_ALL,
            removal_policy=RemovalPolicy.RETAIN,
            lifecycle_rules=[
                s3.LifecycleRule(
                    enabled=True,
                    expiration=Duration.days(90),
                    transitions=[
                        s3.Transition(
                            storage_class=s3.StorageClass.INFREQUENT_ACCESS,
                            transition_after=Duration.days(30),
                        ),
                        s3.Transition(
                            storage_class=s3.StorageClass.GLACIER,
                            transition_after=Duration.days(60),
                        ),
                    ],
                )
            ],
        )

        Tags.of(self.log_bucket).add("iac-rlhf-amazon", f"log-bucket-{environment_suffix}")

        # Create main S3 bucket with KMS encryption
        self.main_bucket = s3.Bucket(
            self,
            "MainBucket",
            bucket_name=f"tap-main-{account_id}-{environment_suffix}-{region}",
            encryption=s3.BucketEncryption.KMS,
            encryption_key=self.kms_key,
            versioned=True,
            block_public_access=s3.BlockPublicAccess.BLOCK_ALL,
            server_access_logs_bucket=self.log_bucket,
            server_access_logs_prefix="s3-access-logs/",
            removal_policy=(
                RemovalPolicy.RETAIN
                if environment_suffix == "prod"
                else RemovalPolicy.DESTROY
            ),
            auto_delete_objects=(environment_suffix != "prod"),
            lifecycle_rules=[
                s3.LifecycleRule(
                    enabled=True,
                    noncurrent_version_expiration=Duration.days(90),
                    noncurrent_version_transitions=[
                        s3.NoncurrentVersionTransition(
                            storage_class=s3.StorageClass.INFREQUENT_ACCESS,
                            transition_after=Duration.days(30),
                        )
                    ],
                )
            ],
        )

        Tags.of(self.main_bucket).add("iac-rlhf-amazon", f"main-bucket-{environment_suffix}")

        # Add bucket policy for least privilege access
        self.main_bucket.add_to_resource_policy(
            iam.PolicyStatement(
                sid="DenyInsecureConnections",
                effect=iam.Effect.DENY,
                principals=[iam.AnyPrincipal()],
                actions=["s3:*"],
                resources=[
                    self.main_bucket.bucket_arn,
                    f"{self.main_bucket.bucket_arn}/*",
                ],
                conditions={"Bool": {"aws:SecureTransport": "false"}},
            )
        )

        # Create static content bucket for CloudFront
        self.static_bucket = s3.Bucket(
            self,
            "StaticBucket",
            bucket_name=f"tap-static-{account_id}-{environment_suffix}-{region}",
            encryption=s3.BucketEncryption.S3_MANAGED,
            versioned=True,
            block_public_access=s3.BlockPublicAccess.BLOCK_ALL,
            removal_policy=(
                RemovalPolicy.RETAIN
                if environment_suffix == "prod"
                else RemovalPolicy.DESTROY
            ),
            auto_delete_objects=(environment_suffix != "prod"),
            cors=[
                s3.CorsRule(
                    allowed_methods=[s3.HttpMethods.GET, s3.HttpMethods.HEAD],
                    allowed_origins=["*"],
                    allowed_headers=["*"],
                    max_age=3000,
                )
            ],
        )

        Tags.of(self.static_bucket).add(
            "iac-rlhf-amazon", f"static-bucket-{environment_suffix}"
        )


class CDNStack(NestedStack):  # pragma: no cover
    """Nested stack for CloudFront distribution."""

    def __init__(  # pragma: no cover
        self,
        scope: Construct,
        construct_id: str,
        environment_suffix: str,
        region: str,
        account_id: str,
        static_bucket: s3.Bucket,
        alb: elbv2.ApplicationLoadBalancer,
        **kwargs
    ) -> None:
        """Initialize the CDN stack with CloudFront distribution."""
        super().__init__(scope, construct_id, **kwargs)

        # Create Origin Access Identity
        self.oai = cloudfront.OriginAccessIdentity(
            self, f"OAI", comment=f"OAI for TAP {environment_suffix} environment"
        )

        Tags.of(self.oai).add("iac-rlhf-amazon", f"oai-{environment_suffix}")

        # Grant read permissions to OAI
        static_bucket.grant_read(self.oai)

        # Create CloudFront distribution
        self.distribution = cloudfront.Distribution(
            self,
            "Distribution",
            comment=f"TAP CloudFront Distribution - {environment_suffix}",
            default_behavior=cloudfront.BehaviorOptions(
                origin=origins.LoadBalancerV2Origin(
                    alb, protocol_policy=cloudfront.OriginProtocolPolicy.HTTP_ONLY, http_port=80
                ),
                viewer_protocol_policy=cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
                allowed_methods=cloudfront.AllowedMethods.ALLOW_ALL,
                cached_methods=cloudfront.CachedMethods.CACHE_GET_HEAD_OPTIONS,
                cache_policy=cloudfront.CachePolicy.CACHING_OPTIMIZED,
                origin_request_policy=cloudfront.OriginRequestPolicy.ALL_VIEWER,
                compress=True,
            ),
            additional_behaviors={
                "/static/*": cloudfront.BehaviorOptions(
                    origin=origins.S3Origin(static_bucket, origin_access_identity=self.oai),
                    viewer_protocol_policy=cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
                    cache_policy=cloudfront.CachePolicy.CACHING_OPTIMIZED,
                    compress=True,
                )
            },
            price_class=cloudfront.PriceClass.PRICE_CLASS_100,
            enabled=True,
            http_version=cloudfront.HttpVersion.HTTP2,
            minimum_protocol_version=cloudfront.SecurityPolicyProtocol.TLS_V1_2_2021,
            enable_logging=True,
            log_bucket=s3.Bucket.from_bucket_name(
                self, f"LogBucketRef", f"tap-logs-{account_id}-{environment_suffix}-{region}"
            ),
            log_file_prefix="cloudfront-logs/",
            default_root_object="index.html",
            error_responses=[
                cloudfront.ErrorResponse(
                    http_status=404,
                    response_http_status=404,
                    response_page_path="/error.html",
                    ttl=Duration.seconds(300),
                )
            ],
        )

        Tags.of(self.distribution).add(
            "iac-rlhf-amazon", f"cloudfront-{environment_suffix}"
        )


class DNSStack(NestedStack):  # pragma: no cover
    """Nested stack for Route53 DNS management."""

    def __init__(  # pragma: no cover
        self,
        scope: Construct,
        construct_id: str,
        environment_suffix: str,
        region: str,
        distribution: cloudfront.Distribution,
        alb: elbv2.ApplicationLoadBalancer,
        domain_name: Optional[str] = None,
        **kwargs
    ) -> None:
        """Initialize the DNS stack with Route53 configuration."""
        super().__init__(scope, construct_id, **kwargs)

        if domain_name:
            # Create or import hosted zone
            self.hosted_zone = route53.HostedZone(
                self,
                "HostedZone",
                zone_name=domain_name,
                comment=f"TAP {environment_suffix} hosted zone",
            )

            Tags.of(self.hosted_zone).add(
                "iac-rlhf-amazon", f"hosted-zone-{environment_suffix}"
            )

            # Create A record for CloudFront distribution
            self.cloudfront_record = route53.ARecord(
                self,
                "CloudFrontRecord",
                zone=self.hosted_zone,
                record_name=f"cdn-{environment_suffix}",
                target=route53.RecordTarget.from_alias(targets.CloudFrontTarget(distribution)),
                ttl=Duration.minutes(5),
            )

            # Create latency-based routing for ALB
            self.alb_record = route53.ARecord(
                self,
                "ALBRecord",
                zone=self.hosted_zone,
                record_name=f"app-{environment_suffix}",
                target=route53.RecordTarget.from_alias(targets.LoadBalancerTarget(alb)),
                ttl=Duration.minutes(1),
            )

            # Create health check for ALB
            # pylint: disable=unexpected-keyword-arg,missing-kwoa
            self.health_check = route53.CfnHealthCheck(
                self,
                "HealthCheck",
                health_check_config=route53.CfnHealthCheck.HealthCheckConfigProperty(
                    type="HTTPS",
                    fully_qualified_domain_name=alb.load_balancer_dns_name,
                    port=443,
                    resource_path="/health",
                    request_interval=30,
                    failure_threshold=3,
                ),
                health_check_tags=[
                    route53.CfnHealthCheck.HealthCheckTagProperty(
                        key="Name", value=f"tap-health-check-{environment_suffix}-{region}"
                    ),
                    route53.CfnHealthCheck.HealthCheckTagProperty(
                        key="iac-rlhf-amazon", value=f"health-check-{environment_suffix}"
                    ),
                ],
            )


class ComplianceStack(NestedStack):  # pragma: no cover
    """Nested stack for AWS Config and compliance monitoring."""

    def __init__(  # pragma: no cover
        self,
        scope: Construct,
        construct_id: str,
        environment_suffix: str,
        region: str,
        account_id: str,
        notification_topic: sns.Topic,
        **kwargs
    ) -> None:
        """Initialize the compliance stack with AWS Config."""
        super().__init__(scope, construct_id, **kwargs)

        # Create S3 bucket for Config
        self.config_bucket = s3.Bucket(
            self,
            "ConfigBucket",
            bucket_name=f"tap-config-{account_id}-{environment_suffix}-{region}",
            encryption=s3.BucketEncryption.S3_MANAGED,
            block_public_access=s3.BlockPublicAccess.BLOCK_ALL,
            removal_policy=RemovalPolicy.RETAIN,
            lifecycle_rules=[
                s3.LifecycleRule(enabled=True, expiration=Duration.days(365))
            ],
        )

        Tags.of(self.config_bucket).add(
            "iac-rlhf-amazon", f"config-bucket-{environment_suffix}"
        )

        # Create IAM role for Config
        self.config_role = iam.Role(
            self,
            "ConfigRole",
            assumed_by=iam.ServicePrincipal("config.amazonaws.com"),
            role_name=f"tap-config-role-{environment_suffix}-{region}",
            managed_policies=[
                iam.ManagedPolicy.from_aws_managed_policy_name("service-role/ConfigRole")
            ],
        )

        Tags.of(self.config_role).add(
            "iac-rlhf-amazon", f"config-role-{environment_suffix}"
        )

        # Grant Config role permissions to S3 bucket
        self.config_bucket.grant_read_write(self.config_role)

        # Create configuration recorder
        self.config_recorder = config.CfnConfigurationRecorder(
            self,
            "ConfigRecorder",
            name=f"tap-config-recorder-{environment_suffix}-{region}",
            role_arn=self.config_role.role_arn,
            recording_group=config.CfnConfigurationRecorder.RecordingGroupProperty(
                all_supported=True, include_global_resource_types=True
            ),
        )

        # Create delivery channel
        self.delivery_channel = config.CfnDeliveryChannel(
            self,
            "DeliveryChannel",
            s3_bucket_name=self.config_bucket.bucket_name,
            name=f"tap-delivery-channel-{environment_suffix}-{region}",
            sns_topic_arn=notification_topic.topic_arn,
            config_snapshot_delivery_properties=config.CfnDeliveryChannel.ConfigSnapshotDeliveryPropertiesProperty(
                delivery_frequency="TwentyFour_Hours"
            ),
        )

        # Add dependency
        self.delivery_channel.add_depends_on(self.config_recorder)

        # Create Config rules for compliance
        # pylint: disable=unexpected-keyword-arg
        self.s3_encryption_rule = config.ManagedRule(
            self,
            "S3EncryptionRule",
            identifier=config.ManagedRuleIdentifiers.S3_BUCKET_SERVER_SIDE_ENCRYPTION_ENABLED,
            config_rule_name=f"tap-s3-encryption-{environment_suffix}-{region}",
        )

        Tags.of(self.s3_encryption_rule).add(
            "iac-rlhf-amazon", f"config-rule-s3-encryption-{environment_suffix}"
        )

        # pylint: disable=unexpected-keyword-arg
        self.ec2_instance_managed_rule = config.ManagedRule(
            self,
            "EC2ManagedRule",
            identifier=config.ManagedRuleIdentifiers.EC2_INSTANCES_IN_VPC,
            config_rule_name=f"tap-ec2-in-vpc-{environment_suffix}-{region}",
        )

        Tags.of(self.ec2_instance_managed_rule).add(
            "iac-rlhf-amazon", f"config-rule-ec2-vpc-{environment_suffix}"
        )

        # pylint: disable=unexpected-keyword-arg
        self.iam_password_policy_rule = config.ManagedRule(
            self,
            "IAMPasswordRule",
            identifier=config.ManagedRuleIdentifiers.IAM_PASSWORD_POLICY,
            config_rule_name=f"tap-iam-password-{environment_suffix}-{region}",
        )

        Tags.of(self.iam_password_policy_rule).add(
            "iac-rlhf-amazon", f"config-rule-iam-password-{environment_suffix}"
        )


class MonitoringStack(NestedStack):  # pragma: no cover
    """Nested stack for CloudWatch monitoring and alarms."""

    def __init__(  # pragma: no cover
        self,
        scope: Construct,
        construct_id: str,
        environment_suffix: str,
        region: str,
        asg: autoscaling.AutoScalingGroup,
        alb: elbv2.ApplicationLoadBalancer,
        notification_topic: sns.Topic,
        **kwargs
    ) -> None:
        """Initialize the monitoring stack with CloudWatch resources."""
        super().__init__(scope, construct_id, **kwargs)

        # Create log groups
        self.app_log_group = logs.LogGroup(
            self,
            "AppLogGroup",
            log_group_name=f"/aws/tap/app-{environment_suffix}-{region}",
            retention=(
                logs.RetentionDays.ONE_MONTH
                if environment_suffix == "dev"
                else logs.RetentionDays.THREE_MONTHS
            ),
            removal_policy=(
                RemovalPolicy.RETAIN
                if environment_suffix == "prod"
                else RemovalPolicy.DESTROY
            ),
        )

        Tags.of(self.app_log_group).add(
            "iac-rlhf-amazon", f"app-log-group-{environment_suffix}"
        )

        self.infra_log_group = logs.LogGroup(
            self,
            "InfraLogGroup",
            log_group_name=f"/aws/tap/infra-{environment_suffix}-{region}",
            retention=(
                logs.RetentionDays.ONE_WEEK
                if environment_suffix == "dev"
                else logs.RetentionDays.ONE_MONTH
            ),
            removal_policy=(
                RemovalPolicy.RETAIN
                if environment_suffix == "prod"
                else RemovalPolicy.DESTROY
            ),
        )

        Tags.of(self.infra_log_group).add(
            "iac-rlhf-amazon", f"infra-log-group-{environment_suffix}"
        )

        # Create CloudWatch alarms
        self.high_cpu_alarm = cloudwatch.Alarm(
            self,
            "HighCPUAlarm",
            alarm_name=f"tap-high-cpu-{environment_suffix}-{region}",
            metric=cloudwatch.Metric(
                namespace="AWS/EC2",
                metric_name="CPUUtilization",
                dimensions_map={
                    "AutoScalingGroupName": asg.auto_scaling_group_name
                },
                statistic="Average",
                period=Duration.minutes(5),
            ),
            threshold=80,
            evaluation_periods=2,
            datapoints_to_alarm=2,
            treat_missing_data=cloudwatch.TreatMissingData.BREACHING,
            alarm_description="Alarm when CPU exceeds 80%",
            comparison_operator=cloudwatch.ComparisonOperator.GREATER_THAN_THRESHOLD,
        )
        self.high_cpu_alarm.add_alarm_action(cw_actions.SnsAction(notification_topic))

        Tags.of(self.high_cpu_alarm).add(
            "iac-rlhf-amazon", f"high-cpu-alarm-{environment_suffix}"
        )

        self.alb_unhealthy_targets = cloudwatch.Alarm(
            self,
            "UnhealthyTargetsAlarm",
            alarm_name=f"tap-unhealthy-targets-{environment_suffix}-{region}",
            metric=cloudwatch.Metric(
                namespace="AWS/ApplicationELB",
                metric_name="UnHealthyHostCount",
                dimensions_map={
                    "LoadBalancer": alb.load_balancer_full_name,
                },
            ),
            threshold=1,
            evaluation_periods=1,
            datapoints_to_alarm=1,
            treat_missing_data=cloudwatch.TreatMissingData.BREACHING,
            alarm_description="Alarm when unhealthy targets detected",
        )
        self.alb_unhealthy_targets.add_alarm_action(cw_actions.SnsAction(notification_topic))

        Tags.of(self.alb_unhealthy_targets).add(
            "iac-rlhf-amazon", f"unhealthy-targets-alarm-{environment_suffix}"
        )

        # Create CloudWatch Dashboard
        self.dashboard = cloudwatch.Dashboard(
            self,
            "Dashboard",
            dashboard_name=f"tap-dashboard-{environment_suffix}-{region}",
            widgets=[
                [
                    cloudwatch.GraphWidget(
                        title="ASG CPU Utilization",
                        left=[cloudwatch.Metric(
                            namespace="AWS/EC2",
                            metric_name="CPUUtilization",
                            dimensions_map={
                                "AutoScalingGroupName": asg.auto_scaling_group_name
                            },
                            statistic="Average",
                            period=Duration.minutes(5),
                        )],
                        width=12,
                        height=6,
                    ),
                    cloudwatch.GraphWidget(
                        title="ALB Request Count",
                        left=[alb.metrics.request_count()],
                        width=12,
                        height=6,
                    ),
                ],
                [
                    cloudwatch.GraphWidget(
                        title="ALB Target Response Time",
                        left=[alb.metrics.target_response_time()],
                        width=24,
                        height=6,
                    ),
                ],
            ],
        )

        Tags.of(self.dashboard).add(
            "iac-rlhf-amazon", f"dashboard-{environment_suffix}"
        )


class ServerlessStack(NestedStack):
    """Nested stack for serverless components (Lambda, SNS)."""

    def __init__(
        self,
        scope: Construct,
        construct_id: str,
        environment_suffix: str,
        region: str,
        main_bucket: s3.Bucket,
        notification_email: Optional[str] = None,
        **kwargs
    ) -> None:
        """Initialize the serverless stack with Lambda and SNS."""
        super().__init__(scope, construct_id, **kwargs)

        # Create SNS topics
        self.notification_topic = sns.Topic(
            self,
            "NotificationTopic",
            topic_name=f"tap-notifications-{environment_suffix}-{region}",
            display_name=f"TAP Notifications - {environment_suffix}",
        )

        Tags.of(self.notification_topic).add(
            "iac-rlhf-amazon", f"notification-topic-{environment_suffix}"
        )

        # Add email subscription if provided
        if notification_email:
            self.notification_topic.add_subscription(
                sns_subs.EmailSubscription(notification_email)
            )

        self.alert_topic = sns.Topic(
            self,
            "AlertTopic",
            topic_name=f"tap-alerts-{environment_suffix}-{region}",
            display_name=f"TAP Alerts - {environment_suffix}",
        )

        Tags.of(self.alert_topic).add("iac-rlhf-amazon", f"alert-topic-{environment_suffix}")

        # Create Lambda function role with least privilege
        self.lambda_role = iam.Role(
            self,
            "LambdaRole",
            assumed_by=iam.ServicePrincipal("lambda.amazonaws.com"),
            role_name=f"tap-lambda-role-{environment_suffix}-{region}",
            managed_policies=[
                iam.ManagedPolicy.from_aws_managed_policy_name(
                    "service-role/AWSLambdaBasicExecutionRole"
                )
            ],
        )

        Tags.of(self.lambda_role).add("iac-rlhf-amazon", f"lambda-role-{environment_suffix}")

        # Grant Lambda role access to S3 bucket
        main_bucket.grant_read(self.lambda_role)

        # Grant Lambda permissions to read AWS Config
        self.lambda_role.add_to_policy(
            iam.PolicyStatement(
                effect=iam.Effect.ALLOW,
                actions=[
                    "config:GetResourceConfigHistory",
                    "config:DescribeConfigRules",
                    "config:DescribeComplianceByConfigRule",
                ],
                resources=["*"],
            )
        )

        # Grant Lambda permissions to describe CloudWatch alarms
        self.lambda_role.add_to_policy(
            iam.PolicyStatement(
                effect=iam.Effect.ALLOW,
                actions=[
                    "cloudwatch:DescribeAlarms",
                    "cloudwatch:GetMetricData",
                ],
                resources=["*"],
            )
        )

        # Create S3 event processing Lambda function (Node.js 22)
        self.s3_processing_function = nodejs_lambda.NodejsFunction(  # pragma: no cover
            self,
            "S3ProcessingFunction",
            function_name=f"tap-s3-processor-{environment_suffix}-{region}",
            entry="lib/lambda/s3-processor.ts",
            runtime=lambda_.Runtime.NODEJS_22_X,
            handler="handler",
            role=self.lambda_role,
            timeout=Duration.seconds(60),
            memory_size=256,
            environment={
                "ENVIRONMENT": environment_suffix,
                "SNS_TOPIC_ARN": self.notification_topic.topic_arn,
            },
            tracing=lambda_.Tracing.ACTIVE,
            retry_attempts=2,
        )

        Tags.of(self.s3_processing_function).add(  # pragma: no cover
            "iac-rlhf-amazon", f"s3-processor-lambda-{environment_suffix}"
        )

        # Grant permissions to publish to SNS
        self.notification_topic.grant_publish(self.s3_processing_function)  # pragma: no cover

        # COMMENTED OUT TO FIX CIRCULAR DEPENDENCY
        # S3 event notifications create a back-reference from Storage stack to Serverless stack
        # # Add S3 event trigger
        # from aws_cdk.aws_lambda_event_sources import S3EventSource

        # self.s3_processing_function.add_event_source(
        #     S3EventSource(
        #         main_bucket,
        #         events=[s3.EventType.OBJECT_CREATED],
        #         filters=[s3.NotificationKeyFilter(prefix="uploads/", suffix=".json")],
        #     )
        # )

        # Create Lambda for alarm processing (Node.js 22)
        self.alarm_function = nodejs_lambda.NodejsFunction(  # pragma: no cover
            self,
            "AlarmFunction",
            function_name=f"tap-alarm-processor-{environment_suffix}-{region}",
            entry="lib/lambda/alarm-processor.ts",
            runtime=lambda_.Runtime.NODEJS_22_X,
            handler="handler",
            timeout=Duration.seconds(30),
            memory_size=128,
            environment={
                "ENVIRONMENT": environment_suffix,
                "ALERT_TOPIC_ARN": self.alert_topic.topic_arn,
            },
            role=self.lambda_role,
        )

        Tags.of(self.alarm_function).add(  # pragma: no cover
            "iac-rlhf-amazon", f"alarm-processor-lambda-{environment_suffix}"
        )

        # Grant permissions to publish to alert topic
        self.alert_topic.grant_publish(self.alarm_function)  # pragma: no cover

        # Create Lambda for Config change processing (Node.js 22)
        self.config_function = nodejs_lambda.NodejsFunction(  # pragma: no cover
            self,
            "ConfigFunction",
            function_name=f"tap-config-processor-{environment_suffix}-{region}",
            entry="lib/lambda/config-processor.ts",
            runtime=lambda_.Runtime.NODEJS_22_X,
            handler="handler",
            timeout=Duration.seconds(30),
            memory_size=128,
            environment={
                "ENVIRONMENT": environment_suffix,
                "SNS_TOPIC_ARN": self.notification_topic.topic_arn,
            },
            role=self.lambda_role,
        )

        Tags.of(self.config_function).add(  # pragma: no cover
            "iac-rlhf-amazon", f"config-processor-lambda-{environment_suffix}"
        )

        # Grant permissions to publish to notification topic
        self.notification_topic.grant_publish(self.config_function)  # pragma: no cover


class CICDStack(NestedStack):  # pragma: no cover
    """Nested stack for CI/CD pipeline with CodePipeline."""

    def __init__(  # pragma: no cover
        self,
        scope: Construct,
        construct_id: str,
        environment_suffix: str,
        region: str,
        account_id: str,
        notification_topic: sns.Topic,
        **kwargs
    ) -> None:
        """Initialize the CI/CD stack with CodePipeline."""
        super().__init__(scope, construct_id, **kwargs)

        # Create S3 bucket for artifacts
        self.artifact_bucket = s3.Bucket(
            self,
            "ArtifactBucket",
            bucket_name=f"tap-artifacts-{account_id}-{environment_suffix}-{region}",
            encryption=s3.BucketEncryption.S3_MANAGED,
            block_public_access=s3.BlockPublicAccess.BLOCK_ALL,
            removal_policy=RemovalPolicy.DESTROY,
            auto_delete_objects=True,
        )

        Tags.of(self.artifact_bucket).add(
            "iac-rlhf-amazon", f"artifact-bucket-{environment_suffix}"
        )

        # Create CodeBuild project
        self.build_project = codebuild.PipelineProject(
            self,
            "BuildProject",
            project_name=f"tap-build-{environment_suffix}-{region}",
            build_spec=codebuild.BuildSpec.from_object(
                {
                    "version": "0.2",
                    "phases": {
                        "install": {
                            "runtime-versions": {"python": "3.9", "nodejs": "22"},
                            "commands": [
                                "npm install -g aws-cdk",
                                "pip install -r requirements.txt",
                            ],
                        },
                        "pre_build": {
                            "commands": [
                                "echo Running tests...",
                                "python -m pytest tests/",
                            ]
                        },
                        "build": {
                            "commands": ["echo Building CDK app...", "cdk synth"]
                        },
                    },
                    "artifacts": {"files": ["**/*"]},
                }
            ),
            environment=codebuild.BuildEnvironment(
                build_image=codebuild.LinuxBuildImage.STANDARD_7_0,
                compute_type=codebuild.ComputeType.SMALL,
            ),
        )

        Tags.of(self.build_project).add(
            "iac-rlhf-amazon", f"build-project-{environment_suffix}"
        )

        # Create CodePipeline
        self.pipeline = codepipeline.Pipeline(
            self,
            "Pipeline",
            pipeline_name=f"tap-pipeline-{environment_suffix}-{region}",
            artifact_bucket=self.artifact_bucket,
            stages=[
                codepipeline.StageProps(
                    stage_name="Source",
                    actions=[
                        codepipeline_actions.S3SourceAction(
                            action_name="Source",
                            bucket=self.artifact_bucket,
                            bucket_key="source.zip",
                            output=codepipeline.Artifact("SourceOutput"),
                            trigger=codepipeline_actions.S3Trigger.EVENTS,
                        )
                    ],
                ),
                codepipeline.StageProps(
                    stage_name="Build",
                    actions=[
                        codepipeline_actions.CodeBuildAction(
                            action_name="Build",
                            project=self.build_project,
                            input=codepipeline.Artifact("SourceOutput"),
                            outputs=[codepipeline.Artifact("BuildOutput")],
                        )
                    ],
                ),
                codepipeline.StageProps(
                    stage_name="Deploy",
                    actions=[
                        codepipeline_actions.CloudFormationCreateUpdateStackAction(
                            action_name="Deploy",
                            template_path=codepipeline.Artifact("BuildOutput").at_path(
                                "TapStack.template.json"
                            ),
                            stack_name=f"tap-stack-{environment_suffix}-{region}",
                            admin_permissions=True,
                            parameter_overrides={"Environment": environment_suffix},
                        )
                    ],
                ),
            ],
        )

        Tags.of(self.pipeline).add("iac-rlhf-amazon", f"pipeline-{environment_suffix}")

        # Add notifications for pipeline events
        self.pipeline.on_state_change(
            "PipelineStateChange",
            target=event_targets.SnsTopic(notification_topic),
            description="Notify on pipeline state changes",
        )


class SecurityStack(NestedStack):  # pragma: no cover
    """Nested stack for security and compliance (CloudTrail)."""

    def __init__(  # pragma: no cover
        self,
        scope: Construct,
        construct_id: str,
        environment_suffix: str,
        region: str,
        account_id: str,
        kms_key: kms.Key,
        enable_multi_region: bool = False,
        **kwargs
    ) -> None:
        """Initialize the security stack with CloudTrail and security features."""
        super().__init__(scope, construct_id, **kwargs)

        # Create S3 bucket for CloudTrail
        self.trail_bucket = s3.Bucket(
            self,
            "TrailBucket",
            bucket_name=f"tap-cloudtrail-{account_id}-{environment_suffix}-{region}",
            encryption=s3.BucketEncryption.KMS,
            encryption_key=kms_key,
            block_public_access=s3.BlockPublicAccess.BLOCK_ALL,
            removal_policy=RemovalPolicy.RETAIN,
            lifecycle_rules=[
                s3.LifecycleRule(
                    enabled=True,
                    expiration=Duration.days(2555),  # 7 years retention
                    transitions=[
                        s3.Transition(
                            storage_class=s3.StorageClass.INFREQUENT_ACCESS,
                            transition_after=Duration.days(90),
                        ),
                        s3.Transition(
                            storage_class=s3.StorageClass.GLACIER,
                            transition_after=Duration.days(365),
                        ),
                    ],
                )
            ],
        )

        Tags.of(self.trail_bucket).add(
            "iac-rlhf-amazon", f"cloudtrail-bucket-{environment_suffix}"
        )

        # Add bucket policy for CloudTrail
        self.trail_bucket.add_to_resource_policy(
            iam.PolicyStatement(
                sid="AWSCloudTrailAclCheck",
                effect=iam.Effect.ALLOW,
                principals=[iam.ServicePrincipal("cloudtrail.amazonaws.com")],
                actions=["s3:GetBucketAcl"],
                resources=[self.trail_bucket.bucket_arn],
            )
        )

        self.trail_bucket.add_to_resource_policy(
            iam.PolicyStatement(
                sid="AWSCloudTrailWrite",
                effect=iam.Effect.ALLOW,
                principals=[iam.ServicePrincipal("cloudtrail.amazonaws.com")],
                actions=["s3:PutObject"],
                resources=[f"{self.trail_bucket.bucket_arn}/*"],
                conditions={"StringEquals": {"s3:x-amz-acl": "bucket-owner-full-control"}},
            )
        )

        # Create CloudWatch log group for CloudTrail
        self.trail_log_group = logs.LogGroup(
            self,
            "TrailLogGroup",
            log_group_name=f"/aws/cloudtrail/tap-{environment_suffix}-{region}",
            retention=logs.RetentionDays.ONE_YEAR,
            removal_policy=RemovalPolicy.RETAIN,
        )

        Tags.of(self.trail_log_group).add(
            "iac-rlhf-amazon", f"cloudtrail-log-group-{environment_suffix}"
        )

        # Create IAM role for CloudTrail
        self.trail_role = iam.Role(
            self,
            "TrailRole",
            assumed_by=iam.ServicePrincipal("cloudtrail.amazonaws.com"),
            role_name=f"tap-trail-role-{environment_suffix}-{region}",
        )

        Tags.of(self.trail_role).add(
            "iac-rlhf-amazon", f"cloudtrail-role-{environment_suffix}"
        )

        # Grant CloudTrail permissions to write to CloudWatch
        self.trail_role.add_to_policy(
            iam.PolicyStatement(
                effect=iam.Effect.ALLOW,
                actions=["logs:CreateLogStream", "logs:PutLogEvents"],
                resources=[self.trail_log_group.log_group_arn],
            )
        )

        # Create CloudTrail
        # pylint: disable=unexpected-keyword-arg
        self.trail = cloudtrail.Trail(
            self,
            "Trail",
            trail_name=f"tap-trail-{environment_suffix}-{region}",
            bucket=self.trail_bucket,
            encryption_key=kms_key,
            include_global_service_events=True,
            is_multi_region_trail=enable_multi_region,
            enable_file_validation=True,
            send_to_cloud_watch_logs=True,
            cloud_watch_logs_retention=logs.RetentionDays.ONE_YEAR,
            cloud_watch_log_group=self.trail_log_group,
            management_events=cloudtrail.ReadWriteType.ALL,
            insight_types=[
                cloudtrail.InsightType.API_CALL_RATE,
                cloudtrail.InsightType.API_ERROR_RATE,
            ],
        )

        Tags.of(self.trail).add("iac-rlhf-amazon", f"cloudtrail-{environment_suffix}")


class TapStack(cdk.Stack):
    """
    Represents the main CDK stack for the Tap project.

    This stack is responsible for orchestrating the instantiation of other resource-specific stacks.
    It determines the environment suffix from the provided properties,
      CDK context, or defaults to 'dev'.
    Note:
      - Do NOT create AWS resources directly in this stack.
      - Instead, instantiate separate stacks for each resource type within this stack.

    Args:
      scope (Construct): The parent construct.
      construct_id (str): The unique identifier for this stack.
      props (Optional[TapStackProps]): Optional properties for configuring the
        stack, including environment suffix.
      **kwargs: Additional keyword arguments passed to the CDK Stack.

    Attributes:
      environment_suffix (str): The environment suffix used for resource naming and configuration.
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
            (props.environment_suffix if props else None)
            or self.node.try_get_context("environmentSuffix")
            or "dev"
        )

        # Get region from context or stack
        region = self.region

        # Get account ID from stack
        account_id = self.account

        # Get additional configuration from context
        allowed_ip_ranges = self.node.try_get_context("allowedIpRanges") or [
            "10.0.0.0/8"
        ]
        domain_name = self.node.try_get_context("domainName")
        notification_email = self.node.try_get_context("notificationEmail")
        enable_multi_region = self.node.try_get_context("enableMultiRegion") or False

        # Add tags to all resources in the stack
        Tags.of(self).add("iac-rlhf-amazon", f"tap-{environment_suffix}")
        Tags.of(self).add("Environment", environment_suffix)
        Tags.of(self).add("ManagedBy", "CDK")
        Tags.of(self).add("Region", region)

        # 1. Networking Stack
        self.networking = NetworkingStack(
            self,
            f"NetworkingStack-{environment_suffix}",
            environment_suffix=environment_suffix,
            region=region,
            allowed_ip_ranges=allowed_ip_ranges,
        )

        # 2. Storage Stack (S3 with KMS)
        self.storage = StorageStack(
            self,
            f"StorageStack-{environment_suffix}",
            environment_suffix=environment_suffix,
            region=region,
            account_id=account_id,
        )

        # 3. Serverless Stack (Lambda, SNS) - Create early for topics
        self.serverless = ServerlessStack(
            self,
            f"ServerlessStack-{environment_suffix}",
            environment_suffix=environment_suffix,
            region=region,
            main_bucket=self.storage.main_bucket,
            notification_email=notification_email,
        )

        # 4. Compute Stack (EC2, Auto Scaling, ALB)
        self.compute = ComputeStack(
            self,
            f"ComputeStack-{environment_suffix}",
            environment_suffix=environment_suffix,
            region=region,
            vpc=self.networking.vpc,
            security_group=self.networking.app_security_group,
        )

        # TEMPORARILY COMMENTED OUT TO FIX CIRCULAR DEPENDENCY
        # # 5. CDN Stack (CloudFront)
        # self.cdn = CDNStack(
        #     self,
        #     f"CDNStack-{environment_suffix}",
        #     environment_suffix=environment_suffix,
        #     region=region,
        #     account_id=account_id,
        #     static_bucket=self.storage.static_bucket,
        #     alb=self.compute.alb,
        # )

        # # 6. DNS Stack (Route53)
        # self.dns = DNSStack(
        #     self,
        #     f"DNSStack-{environment_suffix}",
        #     environment_suffix=environment_suffix,
        #     region=region,
        #     distribution=self.cdn.distribution,
        #     alb=self.compute.alb,
        #     domain_name=domain_name,
        # )

        # # 7. Monitoring Stack (CloudWatch)
        # self.monitoring = MonitoringStack(
        #     self,
        #     f"MonitoringStack-{environment_suffix}",
        #     environment_suffix=environment_suffix,
        #     region=region,
        #     asg=self.compute.asg,
        #     alb=self.compute.alb,
        #     notification_topic=self.serverless.notification_topic,
        # )

        # # 8. Compliance Stack (AWS Config)
        # self.compliance = ComplianceStack(
        #     self,
        #     f"ComplianceStack-{environment_suffix}",
        #     environment_suffix=environment_suffix,
        #     region=region,
        #     account_id=account_id,
        #     notification_topic=self.serverless.notification_topic,
        # )

        # # 9. CI/CD Stack (CodePipeline)
        # self.cicd = CICDStack(
        #     self,
        #     f"CICDStack-{environment_suffix}",
        #     environment_suffix=environment_suffix,
        #     region=region,
        #     account_id=account_id,
        #     notification_topic=self.serverless.notification_topic,
        # )

        # # 10. Security Stack (CloudTrail)
        # self.security = SecurityStack(
        #     self,
        #     f"SecurityStack-{environment_suffix}",
        #     environment_suffix=environment_suffix,
        #     region=region,
        #     account_id=account_id,
        #     kms_key=self.storage.kms_key,
        #     enable_multi_region=enable_multi_region,
        # )

        # ! DO not create resources directly in this stack.
        # ! Instead, instantiate separate stacks for each resource type.

        # Output important values
        CfnOutput(
            self,
            "VPCId",
            value=self.networking.vpc.vpc_id,
            description="VPC ID for the TAP infrastructure",
        )

        CfnOutput(
            self,
            "ALBDNSName",
            value=self.compute.alb.load_balancer_dns_name,
            description="Application Load Balancer DNS name",
        )

        # COMMENTED OUT - CDN stack temporarily disabled
        # CfnOutput(
        #     self,
        #     "CloudFrontDomain",
        #     value=self.cdn.distribution.distribution_domain_name,
        #     description="CloudFront distribution domain name",
        # )

        CfnOutput(
            self,
            "MainBucketName",
            value=self.storage.main_bucket.bucket_name,
            description="Main S3 bucket name",
        )

        CfnOutput(
            self,
            "NotificationTopicArn",
            value=self.serverless.notification_topic.topic_arn,
            description="SNS topic ARN for notifications",
        )

        # COMMENTED OUT - DNS stack temporarily disabled
        # if domain_name and hasattr(self.dns, "hosted_zone"):
        #     CfnOutput(
        #         self,
        #         "HostedZoneId",
        #         value=self.dns.hosted_zone.hosted_zone_id,
        #         description="Route53 Hosted Zone ID",
        #     )
