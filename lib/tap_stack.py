"""
tap_stack.py
Main CDK stack for the Test Automation Platform (TAP) project.
- All resources are intended to be deployed in us-west-2 (enforced by app.py).
- environment=production tag is applied to every resource via CDK Tags.
- Default least-privilege managed policy is created and attached to roles.
- S3 server access logs + CloudTrail S3 data events to a dedicated logging bucket.
- KMS used for encryption and CloudTrail is allowed to use the key.
- RDS instance is private (no public endpoint).
"""
from typing import Optional, Tuple
import os
import aws_cdk as cdk
from aws_cdk import (
    NestedStack,
    aws_s3 as s3,
    aws_rds as rds,
    aws_ec2 as ec2,
    aws_kms as kms,
    aws_iam as iam,
    aws_logs as logs,
    aws_elasticloadbalancingv2 as elbv2,
    aws_autoscaling as autoscaling,
    aws_cloudfront as cloudfront,
    aws_cloudtrail as cloudtrail,
    RemovalPolicy,
    Duration,
    CfnOutput,
    Tags
)
from constructs import Construct

class TapStackProps(cdk.StackProps):
    """
    Stack props for TapStack.
    """
    def __init__(self, environment_suffix: Optional[str] = None, **kwargs):
        super().__init__(**kwargs)
        self.environment_suffix = environment_suffix

class TapStack(cdk.Stack):
    """
    Main TAP stack (web app infra) with helper methods.
    """
    def __init__(
        self,
        scope: Construct,
        construct_id: str,
        props: Optional[TapStackProps] = None,
        **kwargs
    ) -> None:
        super().__init__(scope, construct_id, **kwargs)
        
        # Check if we're in testing mode
        self.is_testing = os.getenv('CDK_TESTING', 'false').lower() == 'true'
        
        # Determine environment suffix (kept for naming, but tag is fixed to 'production')
        self.environment_suffix = (
            props.environment_suffix if props else None
        ) or self.node.try_get_context("environmentSuffix") or "production"
        
        # Requirement: tag everything with environment=production
        Tags.of(self).add("environment", "production")
        
        # Create KMS key first (used by S3 and RDS) - skip in testing mode
        if not self.is_testing:
            self.kms_key = self._create_kms_key()
        else:
            # Create a minimal KMS key for testing
            self.kms_key = kms.Key(
                self, "TestKMSKey",
                description="Test KMS key",
                removal_policy=RemovalPolicy.DESTROY
            )
        
        # Create the default least-privilege managed policy
        self.default_policy = self._create_default_iam_policy()
        
        # Networking
        self.vpc = self._create_vpc()
        
        # S3 buckets: dedicated logging bucket + application bucket
        self.logging_bucket, self.app_bucket = self._create_s3_buckets()
        
        # RDS Database (private)
        self.database = self._create_database()
        
        # ALB and ASG
        self.load_balancer = self._create_load_balancer()
        self.auto_scaling_group = self._create_auto_scaling_group()
        
        # CloudFront distribution
        self.cloudfront_distribution = self._create_cloudfront_distribution()
        
        # CloudTrail for S3 data events (object-level logging) -> logging_bucket
        self._create_cloudtrail_for_s3()
        
        # Outputs
        self._create_outputs()

    # ---------------------------
    # Helper resource factories
    # ---------------------------
    
    def _create_kms_key(self) -> kms.Key:
        kms_key = kms.Key(
            self, "KMSKey",
            description="KMS key for TAP web application encryption",
            enable_key_rotation=True,
            removal_policy=RemovalPolicy.RETAIN
        )
        
        kms.Alias(
            self, "KMSAlias",
            alias_name=f"alias/tap-{self.environment_suffix}-key",
            target_key=kms_key
        )
        
        return kms_key

    def _create_default_iam_policy(self) -> iam.ManagedPolicy:
        """
        Creates a default least-privilege ManagedPolicy that we attach to roles we create.
        Note: resource-based policies (S3 bucket policies, KMS key policies) are used
        for resources that don't accept IAM role attachments.
        """
        statements = [
            iam.PolicyStatement(
                effect=iam.Effect.ALLOW,
                actions=[
                    "logs:CreateLogGroup", "logs:CreateLogStream",
                    "logs:PutLogEvents", "logs:DescribeLogStreams",
                    "logs:DescribeLogGroups"
                ],
                resources=["*"]
            ),
            iam.PolicyStatement(
                effect=iam.Effect.ALLOW,
                actions=[
                    "kms:Decrypt", "kms:GenerateDataKey"
                ],
                resources=[self.kms_key.key_arn]
            ),
            iam.PolicyStatement(
                effect=iam.Effect.ALLOW,
                actions=[
                    "s3:GetObject", "s3:PutObject", "s3:ListBucket"
                ],
                resources=[
                    f"arn:aws:s3:::tap-content-{self.account}-{self.region}",
                    f"arn:aws:s3:::tap-content-{self.account}-{self.region}/*"
                ]
            )
        ]
        
        policy_doc = iam.PolicyDocument(statements=statements)
        return iam.ManagedPolicy(
            self, "DefaultManagedPolicy",
            description="Default least-privilege policy for TAP resources",
            document=policy_doc
        )

    def _create_vpc(self) -> ec2.Vpc:
        vpc = ec2.Vpc(
            self, "VPC",
            max_azs=2,
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
                    name="DBSubnet", 
                    subnet_type=ec2.SubnetType.PRIVATE_ISOLATED, 
                    cidr_mask=24
                )
            ],
            enable_dns_hostnames=True,
            enable_dns_support=True
        )
        
        # Flow logs -> CloudWatch LogGroup encrypted with KMS key
        log_group = logs.LogGroup(
            self, "VPCFlowLogsGroup",
            encryption_key=self.kms_key if not self.is_testing else None,
            retention=logs.RetentionDays.ONE_MONTH,
            removal_policy=RemovalPolicy.RETAIN
        )
        
        flow_log_role = iam.Role(
            self, "FlowLogRole",
            assumed_by=iam.ServicePrincipal("vpc-flow-logs.amazonaws.com"),
            description="Role for VPC Flow Logs to push to CloudWatch"
        )
        
        # attach default policy to this role
        flow_log_role.add_managed_policy(self.default_policy)
        
        ec2.FlowLog(
            self, "VPCFlowLog",
            resource_type=ec2.FlowLogResourceType.from_vpc(vpc),
            destination=ec2.FlowLogDestination.to_cloud_watch_logs(log_group, flow_log_role)
        )
        
        return vpc

    def _create_s3_buckets(self) -> Tuple[s3.Bucket, s3.Bucket]:
        """
        Create a dedicated logging bucket and the application bucket.
        Both encrypted with the KMS key. Logging bucket will host
        server access logs and CloudTrail logs.
        """
        # Determine encryption settings based on testing mode
        if self.is_testing:
            encryption = s3.BucketEncryption.S3_MANAGED
            encryption_key = None
        else:
            encryption = s3.BucketEncryption.KMS
            encryption_key = self.kms_key
        
        # Logging bucket (dedicated)
        logging_bucket = s3.Bucket(
            self, "LoggingBucket",
            bucket_name=f"tap-logs-{self.account}-{self.region}",
            encryption=encryption,
            encryption_key=encryption_key,
            block_public_access=s3.BlockPublicAccess.BLOCK_ALL,
            versioned=True,
            enforce_ssl=True,
            removal_policy=RemovalPolicy.RETAIN,
            lifecycle_rules=[
                s3.LifecycleRule(
                    id="LogRetention",
                    enabled=True,
                    expiration=Duration.days(365)
                )
            ]
        )
        
        # Application bucket (server access logs -> logging_bucket)
        app_bucket = s3.Bucket(
            self, "AppBucket",
            bucket_name=f"tap-content-{self.account}-{self.region}",
            encryption=encryption,
            encryption_key=encryption_key,
            block_public_access=s3.BlockPublicAccess.BLOCK_ALL,
            versioned=True,
            enforce_ssl=True,
            removal_policy=RemovalPolicy.RETAIN,
            server_access_logs_bucket=logging_bucket,
            server_access_logs_prefix="access-logs/"
        )
        
        # Deny requests without secure transport
        app_bucket.add_to_resource_policy(
            iam.PolicyStatement(
                sid="EnforceTLSOnly",
                effect=iam.Effect.DENY,
                principals=[iam.AnyPrincipal()],
                actions=["s3:*"],
                resources=[app_bucket.bucket_arn, f"{app_bucket.bucket_arn}/*"],
                conditions={"Bool": {"aws:SecureTransport": "false"}}
            )
        )
        
        # Ensure CloudTrail can write to logging bucket if encrypted (skip in testing)
        if not self.is_testing:
            self.kms_key.add_to_resource_policy(
                iam.PolicyStatement(
                    principals=[iam.ServicePrincipal("cloudtrail.amazonaws.com")],
                    actions=["kms:Encrypt", "kms:GenerateDataKey", "kms:Decrypt"],
                    resources=["*"],
                    conditions={"StringEquals": {"kms:GrantIsForAWSResource": "true"}}
                )
            )
        
        return logging_bucket, app_bucket

    def _create_database(self) -> rds.DatabaseInstance:
        db_subnet_group = rds.SubnetGroup(
            self, "DBSubnetGroup",
            description="Subnet group for TAP RDS",
            vpc=self.vpc,
            vpc_subnets=ec2.SubnetSelection(
                subnet_type=ec2.SubnetType.PRIVATE_ISOLATED
            )
        )
        
        db_sg = ec2.SecurityGroup(
            self, "DBSecurityGroup",
            vpc=self.vpc,
            description="Security group for RDS (private only)",
            allow_all_outbound=False
        )
        
        app_sg = ec2.SecurityGroup(
            self, "AppSG",
            vpc=self.vpc,
            description="Security group for application hosts"
        )
        
        # Only allow PostgreSQL from application SG
        db_sg.add_ingress_rule(
            peer=app_sg,
            connection=ec2.Port.tcp(5432),
            description="Allow PostgreSQL from app SG"
        )
        
        database = rds.DatabaseInstance(
            self, "Database",
            engine=rds.DatabaseInstanceEngine.postgres(
                version=rds.PostgresEngineVersion.VER_15_4
            ),
            instance_type=ec2.InstanceType.of(
                ec2.InstanceClass.T3, ec2.InstanceSize.MICRO
            ),
            vpc=self.vpc,
            subnet_group=db_subnet_group,
            security_groups=[db_sg],
            storage_encrypted=True,
            storage_encryption_key=self.kms_key if not self.is_testing else None,
            backup_retention=Duration.days(7),
            deletion_protection=True,
            publicly_accessible=False,  # ensures no public endpoint
            database_name="tapdb",
            credentials=rds.Credentials.from_generated_secret(
                "dbadmin", 
                encryption_key=self.kms_key if not self.is_testing else None
            )
        )
        
        return database

    def _create_load_balancer(self) -> elbv2.ApplicationLoadBalancer:
        alb_sg = ec2.SecurityGroup(
            self, "ALBSG",
            vpc=self.vpc,
            description="ALB security group"
        )
        
        # allow HTTPS and HTTP
        alb_sg.add_ingress_rule(ec2.Peer.any_ipv4(), ec2.Port.tcp(443), "Allow HTTPS")
        alb_sg.add_ingress_rule(ec2.Peer.any_ipv4(), ec2.Port.tcp(80), "Allow HTTP")
        
        alb = elbv2.ApplicationLoadBalancer(
            self, "ALB",
            vpc=self.vpc,
            internet_facing=True,
            security_group=alb_sg,
            vpc_subnets=ec2.SubnetSelection(subnet_type=ec2.SubnetType.PUBLIC)
        )
        
        # Access logging - ALB logs to the logging bucket
        alb.log_access_logs(self.logging_bucket, prefix="alb-logs")
        
        return alb

    def _create_auto_scaling_group(self) -> autoscaling.AutoScalingGroup:
        # EC2 Instance Role
        ec2_role = iam.Role(
            self, "EC2Role",
            assumed_by=iam.ServicePrincipal("ec2.amazonaws.com"),
            description="Role for EC2 instances in ASG"
        )
        
        # Attach default managed policy to role
        ec2_role.add_managed_policy(self.default_policy)
        ec2_role.add_managed_policy(
            iam.ManagedPolicy.from_aws_managed_policy_name("CloudWatchAgentServerPolicy")
        )
        
        # Launch template with Amazon Linux 2 AMI
        lt = ec2.LaunchTemplate(
            self, "LaunchTemplate",
            instance_type=ec2.InstanceType.of(ec2.InstanceClass.T3, ec2.InstanceSize.MICRO),
            machine_image=ec2.MachineImage.latest_amazon_linux2(),
            role=ec2_role
        )
        
        asg = autoscaling.AutoScalingGroup(
            self, "ASG",
            vpc=self.vpc,
            launch_template=lt,
            min_capacity=1,
            max_capacity=3,
            desired_capacity=2,
            vpc_subnets=ec2.SubnetSelection(subnet_type=ec2.SubnetType.PRIVATE_WITH_EGRESS),
            health_check=autoscaling.HealthCheck.elb(grace=Duration.minutes(5))
        )
        
        # Target group and listener
        target_group = elbv2.ApplicationTargetGroup(
            self, "TargetGroup",
            vpc=self.vpc,
            port=80,
            protocol=elbv2.ApplicationProtocol.HTTP,
            targets=[asg],
            health_check=elbv2.HealthCheck(path="/health")
        )
        
        self.load_balancer.add_listener(
            "Listener",
            port=80,
            default_target_groups=[target_group]
        )
        
        return asg

    def _create_cloudfront_distribution(self) -> cloudfront.Distribution:
        # Create OAC for CloudFront to access S3 origin
        oac = cloudfront.S3OriginAccessControl(
            self, "OAC",
            description="OAC for tap app bucket"
        )
        
        distribution = cloudfront.Distribution(
            self, "Distribution",
            default_behavior=cloudfront.BehaviorOptions(
                origin=cloudfront.S3Origin(bucket=self.app_bucket, origin_access_control=oac),
                viewer_protocol_policy=cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
                cache_policy=cloudfront.CachePolicy.CACHING_OPTIMIZED
            ),
            additional_behaviors={
                "/api/*": cloudfront.BehaviorOptions(
                    origin=cloudfront.LoadBalancerV2Origin(load_balancer=self.load_balancer),
                    viewer_protocol_policy=cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
                    cache_policy=cloudfront.CachePolicy.CACHING_DISABLED,
                    origin_request_policy=cloudfront.OriginRequestPolicy.ALL_VIEWER_EXCEPT_HOST_HEADER
                )
            },
            price_class=cloudfront.PriceClass.PRICE_CLASS_100,
            enable_logging=True,
            log_bucket=self.logging_bucket,
            log_file_prefix="cloudfront-logs/"
        )
        
        self.app_bucket.add_to_resource_policy(
            iam.PolicyStatement(
                effect=iam.Effect.ALLOW,
                principals=[iam.ServicePrincipal("cloudfront.amazonaws.com")],
                actions=["s3:GetObject"],
                resources=[f"{self.app_bucket.bucket_arn}/*"],
                conditions={
                    "StringEquals": {
                        "AWS:SourceArn": 
                        f"arn:aws:cloudfront::{self.account}:distribution/{distribution.distribution_id}"
                    }
                }
            )
        )
        
        return distribution

    def _create_cloudtrail_for_s3(self) -> None:
        """
        Create a CloudTrail trail (single-region) that writes to logging bucket and
        that logs S3 data events (object-level) for the application bucket.
        """
        trail = cloudtrail.Trail(
            self, "S3DataTrail",
            bucket=self.logging_bucket,
            is_multi_region_trail=False,
            enable_file_validation=True,
            include_global_service_events=False
        )
        
        # Add S3 event selector to capture object-level data events for the app bucket
        trail.add_s3_event_selector(
            [cloudtrail.S3EventSelector(bucket=self.app_bucket, object_prefix="")],
            read_write_type=cloudtrail.ReadWriteType.ALL
        )
        
        # Ensure KMS key policy allows CloudTrail to use the key (skip in testing)
        if not self.is_testing:
            self.kms_key.add_to_resource_policy(
                iam.PolicyStatement(
                    principals=[iam.ServicePrincipal("cloudtrail.amazonaws.com")],
                    actions=["kms:Encrypt", "kms:GenerateDataKey", "kms:Decrypt"],
                    resources=["*"]
                )
            )

    def _create_outputs(self) -> None:
        CfnOutput(
            self, "ALBDNS", 
            value=self.load_balancer.load_balancer_dns_name, 
            description="ALB DNS name"
        )
        CfnOutput(
            self, "CloudFrontDomain", 
            value=self.cloudfront_distribution.distribution_domain_name, 
            description="CloudFront domain"
        )
        CfnOutput(
            self, "DatabaseEndpoint", 
            value=self.database.instance_endpoint.hostname, 
            description="RDS endpoint"
        )
        CfnOutput(
            self, "AppBucketName", 
            value=self.app_bucket.bucket_name, 
            description="Application S3 bucket name"
        )
        CfnOutput(
            self, "LoggingBucketName", 
            value=self.logging_bucket.bucket_name, 
            description="Logging S3 bucket name"
        )
        CfnOutput(
            self, "KMSKeyId", 
            value=self.kms_key.key_id, 
            description="KMS Key ID"
        )