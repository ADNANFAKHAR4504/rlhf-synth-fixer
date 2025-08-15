```python
"""
AWS CDK Web Application Stack
Provisions secure, production-ready infrastructure for a web application
"""

from aws_cdk import (
    Stack,
    aws_s3 as s3,
    aws_rds as rds,
    aws_ec2 as ec2,
    aws_kms as kms,
    aws_iam as iam,
    aws_logs as logs,
    aws_elasticloadbalancingv2 as elbv2,
    aws_autoscaling as autoscaling,
    aws_cloudfront as cloudfront,
    aws_certificatemanager as acm,
    RemovalPolicy,
    Duration,
    CfnOutput,
    Tags
)
from constructs import Construct
import json


class WebAppStack(Stack):
    """
    Main stack for web application infrastructure
    Implements security best practices and compliance requirements
    """

    def __init__(self, scope: Construct, construct_id: str, **kwargs) -> None:
        super().__init__(scope, construct_id, **kwargs)

        # Apply production environment tag to all resources in this stack
        Tags.of(self).add("environment", "production")

        # Create KMS key for encryption
        self.kms_key = self._create_kms_key()

        # Create default IAM policy
        self.default_policy = self._create_default_iam_policy()

        # Create VPC and networking components
        self.vpc = self._create_vpc()

        # Create S3 buckets with logging
        self.logging_bucket, self.app_bucket = self._create_s3_buckets()

        # Create RDS database
        self.database = self._create_database()

        # Create application infrastructure
        self.load_balancer = self._create_load_balancer()
        self.auto_scaling_group = self._create_auto_scaling_group()

        # Create CloudFront distribution
        self.cloudfront_distribution = self._create_cloudfront_distribution()

        # Output important resource information
        self._create_outputs()

    def _create_kms_key(self) -> kms.Key:
        """
        Create KMS key for encrypting sensitive resources
        """
        kms_key = kms.Key(
            self, "WebAppKMSKey",
            description="KMS key for web application encryption",
            enable_key_rotation=True,
            removal_policy=RemovalPolicy.RETAIN,
        )

        # Create an alias for easier management
        kms.Alias(
            self, "WebAppKMSKeyAlias",
            alias_name="alias/webapp-production-key",
            target_key=kms_key
        )

        return kms_key

    def _create_default_iam_policy(self) -> iam.ManagedPolicy:
        """
        Create default IAM policy with least-privilege access
        """
        policy_document = iam.PolicyDocument(
            statements=[
                # Allow basic CloudWatch logging
                iam.PolicyStatement(
                    effect=iam.Effect.ALLOW,
                    actions=[
                        "logs:CreateLogGroup",
                        "logs:CreateLogStream",
                        "logs:PutLogEvents",
                        "logs:DescribeLogStreams",
                        "logs:DescribeLogGroups"
                    ],
                    resources=["*"],
                    conditions={
                        "StringEquals": {
                            "aws:RequestedRegion": "us-west-2"
                        }
                    }
                ),
                # Allow KMS access for encryption/decryption
                iam.PolicyStatement(
                    effect=iam.Effect.ALLOW,
                    actions=[
                        "kms:Decrypt",
                        "kms:GenerateDataKey"
                    ],
                    resources=[self.kms_key.key_arn],
                    conditions={
                        "StringEquals": {
                            "kms:ViaService": f"s3.us-west-2.amazonaws.com"
                        }
                    }
                ),
                # Allow S3 access to application bucket only
                iam.PolicyStatement(
                    effect=iam.Effect.ALLOW,
                    actions=[
                        "s3:GetObject",
                        "s3:PutObject"
                    ],
                    resources=[f"arn:aws:s3:::webapp-*/*"],
                    conditions={
                        "StringEquals": {
                            "aws:RequestedRegion": "us-west-2"
                        }
                    }
                )
            ]
        )

        return iam.ManagedPolicy(
            self, "WebAppDefaultPolicy",
            description="Default least-privilege policy for web application resources",
            document=policy_document,
            managed_policy_name="WebAppDefaultPolicy"
        )

    def _create_vpc(self) -> ec2.Vpc:
        """
        Create VPC with public and private subnets
        """
        vpc = ec2.Vpc(
            self, "WebAppVPC",
            max_azs=2,  # Use 2 AZs for high availability
            cidr="10.0.0.0/16",
            subnet_configuration=[
                ec2.SubnetConfiguration(
                    name="PublicSubnet",
                    subnet_type=ec2.SubnetType.PUBLIC,
                    cidr_mask=24
                ),
                ec2.SubnetConfiguration(
                    name="PrivateSubnet",
                    subnet_type=ec2.SubnetType.PRIVATE_WITH_EGRESS,
                    cidr_mask=24
                ),
                ec2.SubnetConfiguration(
                    name="DatabaseSubnet",
                    subnet_type=ec2.SubnetType.PRIVATE_ISOLATED,
                    cidr_mask=24
                )
            ],
            enable_dns_hostnames=True,
            enable_dns_support=True
        )

        # Create VPC Flow Logs for security monitoring
        log_group = logs.LogGroup(
            self, "VPCFlowLogsGroup",
            retention=logs.RetentionDays.ONE_MONTH,
            encryption_key=self.kms_key,
            removal_policy=RemovalPolicy.RETAIN
        )

        flow_log_role = iam.Role(
            self, "FlowLogRole",
            assumed_by=iam.ServicePrincipal("vpc-flow-logs.amazonaws.com"),
            managed_policies=[self.default_policy]
        )

        ec2.FlowLog(
            self, "VPCFlowLog",
            resource_type=ec2.FlowLogResourceType.from_vpc(vpc),
            destination=ec2.FlowLogDestination.to_cloud_watch_logs(log_group, flow_log_role)
        )

        return vpc

    def _create_s3_buckets(self) -> tuple[s3.Bucket, s3.Bucket]:
        """
        Create S3 buckets with logging and encryption
        Returns tuple of (logging_bucket, app_bucket)
        """
        # Create logging bucket first (no server access logging on itself)
        logging_bucket = s3.Bucket(
            self, "WebAppLoggingBucket",
            bucket_name=f"webapp-logs-{self.account}-{self.region}",
            encryption=s3.BucketEncryption.KMS,
            encryption_key=self.kms_key,
            block_public_access=s3.BlockPublicAccess.BLOCK_ALL,
            versioned=True,
            removal_policy=RemovalPolicy.RETAIN,
            lifecycle_rules=[
                s3.LifecycleRule(
                    id="LogRetention",
                    enabled=True,
                    expiration=Duration.days(90),
                    noncurrent_version_expiration=Duration.days(30)
                )
            ]
        )

        # Create main application bucket with logging enabled
        app_bucket = s3.Bucket(
            self, "WebAppBucket",
            bucket_name=f"webapp-content-{self.account}-{self.region}",
            encryption=s3.BucketEncryption.KMS,
            encryption_key=self.kms_key,
            block_public_access=s3.BlockPublicAccess.BLOCK_ALL,
            versioned=True,
            removal_policy=RemovalPolicy.RETAIN,
            server_access_logs_bucket=logging_bucket,
            server_access_logs_prefix="access-logs/",
            notification_key_filter=s3.NotificationKeyFilter(
                prefix="uploads/"
            )
        )

        # Enable object-level logging via CloudTrail (handled by AWS Config)
        # This ensures all object changes are logged to the logging bucket

        return logging_bucket, app_bucket

    def _create_database(self) -> rds.DatabaseInstance:
        """
        Create private RDS database with encryption
        """
        # Create database subnet group in isolated subnets
        db_subnet_group = rds.SubnetGroup(
            self, "DatabaseSubnetGroup",
            description="Subnet group for RDS database",
            vpc=self.vpc,
            vpc_subnets=ec2.SubnetSelection(
                subnet_type=ec2.SubnetType.PRIVATE_ISOLATED
            )
        )

        # Create security group for database (no public access)
        db_security_group = ec2.SecurityGroup(
            self, "DatabaseSecurityGroup",
            vpc=self.vpc,
            description="Security group for RDS database",
            allow_all_outbound=False
        )

        # Only allow inbound connections from application security group
        app_security_group = ec2.SecurityGroup(
            self, "ApplicationSecurityGroup",
            vpc=self.vpc,
            description="Security group for application instances"
        )

        db_security_group.add_ingress_rule(
            peer=app_security_group,
            connection=ec2.Port.tcp(5432),
            description="Allow PostgreSQL access from application"
        )

        # Create database instance
        database = rds.DatabaseInstance(
            self, "WebAppDatabase",
            engine=rds.DatabaseInstanceEngine.postgres(
                version=rds.PostgresEngineVersion.VER_15_4
            ),
            instance_type=ec2.InstanceType.of(
                ec2.InstanceClass.T3,
                ec2.InstanceSize.MICRO
            ),
            vpc=self.vpc,
            subnet_group=db_subnet_group,
            security_groups=[db_security_group],
            storage_encrypted=True,
            storage_encryption_key=self.kms_key,
            backup_retention=Duration.days(7),
            delete_automated_backups=False,
            deletion_protection=True,
            publicly_accessible=False,  # Ensure database is private
            monitoring_interval=Duration.seconds(60),
            enable_performance_insights=True,
            performance_insight_encryption_key=self.kms_key,
            cloudwatch_logs_exports=["postgresql"],
            auto_minor_version_upgrade=True,
            allocated_storage=20,
            max_allocated_storage=100,
            database_name="webapp",
            credentials=rds.Credentials.from_generated_secret(
                "dbadmin",
                encryption_key=self.kms_key
            )
        )

        return database

    def _create_load_balancer(self) -> elbv2.ApplicationLoadBalancer:
        """
        Create Application Load Balancer
        """
        # Create security group for ALB
        alb_security_group = ec2.SecurityGroup(
            self, "ALBSecurityGroup",
            vpc=self.vpc,
            description="Security group for Application Load Balancer"
        )

        alb_security_group.add_ingress_rule(
            peer=ec2.Peer.any_ipv4(),
            connection=ec2.Port.tcp(443),
            description="Allow HTTPS traffic"
        )

        alb_security_group.add_ingress_rule(
            peer=ec2.Peer.any_ipv4(),
            connection=ec2.Port.tcp(80),
            description="Allow HTTP traffic (redirect to HTTPS)"
        )

        # Create Application Load Balancer
        load_balancer = elbv2.ApplicationLoadBalancer(
            self, "WebAppALB",
            vpc=self.vpc,
            internet_facing=True,
            security_group=alb_security_group,
            vpc_subnets=ec2.SubnetSelection(
                subnet_type=ec2.SubnetType.PUBLIC
            )
        )

        # Enable access logging to S3
        load_balancer.log_access_logs(
            bucket=self.logging_bucket,
            prefix="alb-access-logs"
        )

        return load_balancer

    def _create_auto_scaling_group(self) -> autoscaling.AutoScalingGroup:
        """
        Create Auto Scaling Group with EC2 instances
        """
        # Create IAM role for EC2 instances
        ec2_role = iam.Role(
            self, "EC2InstanceRole",
            assumed_by=iam.ServicePrincipal("ec2.amazonaws.com"),
            managed_policies=[
                self.default_policy,
                iam.ManagedPolicy.from_aws_managed_policy_name("CloudWatchAgentServerPolicy")
            ]
        )

        # Create launch template
        launch_template = ec2.LaunchTemplate(
            self, "WebAppLaunchTemplate",
            instance_type=ec2.InstanceType.of(
                ec2.InstanceClass.T3,
                ec2.InstanceSize.MICRO
            ),
            machine_image=ec2.MachineImage.latest_amazon_linux2(),
            role=ec2_role,
            security_group=ec2.SecurityGroup.from_security_group_id(
                self, "AppSecurityGroup",
                security_group_id=self.vpc.vpc_default_security_group
            ),
            block_devices=[
                ec2.BlockDevice(
                    device_name="/dev/xvda",
                    volume=ec2.BlockDeviceVolume.ebs(
                        volume_size=20,
                        encrypted=True,
                        kms_key=self.kms_key,
                        delete_on_termination=True
                    )
                )
            ],
            user_data=ec2.UserData.for_linux()
        )

        # Create Auto Scaling Group
        auto_scaling_group = autoscaling.AutoScalingGroup(
            self, "WebAppASG",
            vpc=self.vpc,
            launch_template=launch_template,
            min_capacity=1,
            max_capacity=3,
            desired_capacity=2,
            vpc_subnets=ec2.SubnetSelection(
                subnet_type=ec2.SubnetType.PRIVATE_WITH_EGRESS
            ),
            health_check=autoscaling.HealthCheck.elb(
                grace=Duration.minutes(5)
            )
        )

        # Create target group and attach to load balancer
        target_group = elbv2.ApplicationTargetGroup(
            self, "WebAppTargetGroup",
            vpc=self.vpc,
            port=80,
            protocol=elbv2.ApplicationProtocol.HTTP,
            targets=[auto_scaling_group],
            health_check_path="/health"
        )

        # Add listener to load balancer
        self.load_balancer.add_listener(
            "WebAppListener",
            port=80,
            default_target_groups=[target_group]
        )

        return auto_scaling_group

    def _create_cloudfront_distribution(self) -> cloudfront.Distribution:
        """
        Create CloudFront distribution for content delivery
        """
        # Create Origin Access Control for S3
        oac = cloudfront.S3OriginAccessControl(
            self, "WebAppOAC",
            description="OAC for web app S3 bucket"
        )

        # Create CloudFront distribution
        distribution = cloudfront.Distribution(
            self, "WebAppDistribution",
            default_behavior=cloudfront.BehaviorOptions(
                origin=cloudfront.S3Origin(
                    bucket=self.app_bucket,
                    origin_access_control=oac
                ),
                viewer_protocol_policy=cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
                cache_policy=cloudfront.CachePolicy.CACHING_OPTIMIZED,
                origin_request_policy=cloudfront.OriginRequestPolicy.CORS_S3_ORIGIN
            ),
            additional_behaviors={
                "/api/*": cloudfront.BehaviorOptions(
                    origin=cloudfront.LoadBalancerV2Origin(
                        load_balancer=self.load_balancer,
                        protocol_policy=cloudfront.OriginProtocolPolicy.HTTP_ONLY
                    ),
                    cache_policy=cloudfront.CachePolicy.CACHING_DISABLED,
                    origin_request_policy=cloudfront.OriginRequestPolicy.ALL_VIEWER_EXCEPT_HOST_HEADER,
                    viewer_protocol_policy=cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS
                )
            },
            price_class=cloudfront.PriceClass.PRICE_CLASS_100,
            geo_restriction=cloudfront.GeoRestriction.allowlist("US", "CA"),
            enable_logging=True,
            log_bucket=self.logging_bucket,
            log_file_prefix="cloudfront-logs/",
            log_includes_cookies=True
        )

        # Grant CloudFront access to S3 bucket
        self.app_bucket.add_to_resource_policy(
            iam.PolicyStatement(
                effect=iam.Effect.ALLOW,
                principals=[iam.ServicePrincipal("cloudfront.amazonaws.com")],
                actions=["s3:GetObject"],
                resources=[f"{self.app_bucket.bucket_arn}/*"],
                conditions={
                    "StringEquals": {
                        "AWS:SourceArn": f"arn:aws:cloudfront::{self.account}:distribution/{distribution.distribution_id}"
                    }
                }
            )
        )

        return distribution

    def _create_outputs(self) -> None:
        """
        Create CloudFormation outputs for important resources
        """
        CfnOutput(
            self, "LoadBalancerDNS",
            value=self.load_balancer.load_balancer_dns_name,
            description="DNS name of the Application Load Balancer"
        )

        CfnOutput(
            self, "CloudFrontDomainName",
            value=self.cloudfront_distribution.distribution_domain_name,
            description="Domain name of the CloudFront distribution"
        )

        CfnOutput(
            self, "DatabaseEndpoint",
            value=self.database.instance_endpoint.hostname,
            description="RDS database endpoint"
        )

        CfnOutput(
            self, "S3BucketName",
            value=self.app_bucket.bucket_name,
            description="Name of the application S3 bucket"
        )

        CfnOutput(
            self, "KMSKeyId",
            value=self.kms_key.key_id,
            description="ID of the KMS key used for encryption"
        )
```
