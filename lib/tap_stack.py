from aws_cdk import (
    Stack,
    aws_ec2 as ec2,
    aws_rds as rds,
    aws_s3 as s3,
    aws_iam as iam,
    aws_elasticloadbalancingv2 as elbv2,
    aws_logs as logs,
    aws_cloudwatch as cloudwatch,
    aws_kms as kms,
    Duration,
    RemovalPolicy,
    CfnOutput
)
from constructs import Construct
import json


class TapStack(Stack):
    def __init__(self, scope: Construct, construct_id: str, **kwargs) -> None:
        super().__init__(scope, construct_id, **kwargs)

        # Create KMS keys for encryption
        self._create_kms_keys()
        
        # Create VPC and networking components
        self._create_vpc_and_networking()
        
        # Create security groups
        self._create_security_groups()
        
        # Create IAM roles
        self._create_iam_roles()
        
        # Create RDS database
        self._create_rds_database()
        
        # Create S3 bucket
        self._create_s3_bucket()
        
        # Create EC2 instances
        self._create_ec2_instances()
        
        # Create Application Load Balancer
        self._create_application_load_balancer()
        
        # Create CloudWatch monitoring and alarms
        self._create_monitoring_and_alarms()
        
        # Create outputs
        self._create_outputs()

    def _create_kms_keys(self):
        """Create KMS keys for encryption"""
        # KMS key for general encryption
        self.kms_key = kms.Key(
            self, "tap_encryption_key",
            description="KMS key for TAP infrastructure encryption",
            enable_key_rotation=True,
            removal_policy=RemovalPolicy.DESTROY
        )
        
        # KMS key alias
        kms.Alias(
            self, "tap_encryption_key_alias",
            alias_name="alias/tap-infrastructure-key",
            target_key=self.kms_key
        )

    def _create_vpc_and_networking(self):
        """Create VPC with public and private subnets across multiple AZs"""
        # Create VPC
        self.vpc = ec2.Vpc(
            self, "tap_vpc",
            ip_addresses=ec2.IpAddresses.cidr("10.0.0.0/16"),
            max_azs=2,
            subnet_configuration=[
                ec2.SubnetConfiguration(
                    name="tap_public_subnet",
                    subnet_type=ec2.SubnetType.PUBLIC,
                    cidr_mask=24
                ),
                ec2.SubnetConfiguration(
                    name="tap_private_subnet",
                    subnet_type=ec2.SubnetType.PRIVATE_WITH_EGRESS,
                    cidr_mask=24
                ),
                ec2.SubnetConfiguration(
                    name="tap_database_subnet",
                    subnet_type=ec2.SubnetType.PRIVATE_ISOLATED,
                    cidr_mask=24
                )
            ],
            nat_gateways=2,  # One NAT gateway per AZ for high availability
            enable_dns_hostnames=True,
            enable_dns_support=True
        )

        # Create VPC Flow Logs
        self.vpc_flow_logs_role = iam.Role(
            self, "tap_vpc_flow_logs_role",
            assumed_by=iam.ServicePrincipal("vpc-flow-logs.amazonaws.com"),
            managed_policies=[
                iam.ManagedPolicy.from_aws_managed_policy_name("service-role/VPCFlowLogsDeliveryRolePolicy")
            ]
        )

        self.vpc_flow_logs = ec2.FlowLog(
            self, "tap_vpc_flow_logs",
            resource_type=ec2.FlowLogResourceType.from_vpc(self.vpc),
            destination=ec2.FlowLogDestination.to_cloud_watch_logs(
                logs.LogGroup(
                    self, "tap_vpc_flow_logs_group",
                    log_group_name="/aws/vpc/flowlogs",
                    retention=logs.RetentionDays.ONE_WEEK,
                    removal_policy=RemovalPolicy.DESTROY
                ),
                self.vpc_flow_logs_role
            )
        )

    def _create_security_groups(self):
        """Create security groups for different components"""
        # ALB Security Group
        self.alb_security_group = ec2.SecurityGroup(
            self, "tap_alb_security_group",
            vpc=self.vpc,
            description="Security group for Application Load Balancer",
            allow_all_outbound=True
        )
        
        self.alb_security_group.add_ingress_rule(
            ec2.Peer.any_ipv4(),
            ec2.Port.tcp(80),
            "Allow HTTP traffic from internet"
        )
        
        self.alb_security_group.add_ingress_rule(
            ec2.Peer.any_ipv4(),
            ec2.Port.tcp(443),
            "Allow HTTPS traffic from internet"
        )

        # EC2 Security Group
        self.ec2_security_group = ec2.SecurityGroup(
            self, "tap_ec2_security_group",
            vpc=self.vpc,
            description="Security group for EC2 instances",
            allow_all_outbound=True
        )
        
        self.ec2_security_group.add_ingress_rule(
            self.alb_security_group,
            ec2.Port.tcp(80),
            "Allow HTTP traffic from ALB"
        )
        
        self.ec2_security_group.add_ingress_rule(
            self.alb_security_group,
            ec2.Port.tcp(443),
            "Allow HTTPS traffic from ALB"
        )

        # RDS Security Group
        self.rds_security_group = ec2.SecurityGroup(
            self, "tap_rds_security_group",
            vpc=self.vpc,
            description="Security group for RDS database",
            allow_all_outbound=False
        )
        
        self.rds_security_group.add_ingress_rule(
            self.ec2_security_group,
            ec2.Port.tcp(5432),
            "Allow PostgreSQL traffic from EC2 instances"
        )

    def _create_iam_roles(self):
        """Create IAM roles with least privilege principle"""
        # EC2 Instance Role
        self.ec2_role = iam.Role(
            self, "tap_ec2_role",
            assumed_by=iam.ServicePrincipal("ec2.amazonaws.com"),
            managed_policies=[
                iam.ManagedPolicy.from_aws_managed_policy_name("CloudWatchAgentServerPolicy")
            ]
        )

        # Custom policy for S3 access (least privilege)
        s3_policy = iam.PolicyStatement(
            effect=iam.Effect.ALLOW,
            actions=[
                "s3:GetObject",
                "s3:PutObject",
                "s3:DeleteObject"
            ],
            resources=[f"arn:aws:s3:::tap-secure-bucket-{self.account}/*"]
        )

        # Custom policy for KMS access
        kms_policy = iam.PolicyStatement(
            effect=iam.Effect.ALLOW,
            actions=[
                "kms:Decrypt",
                "kms:DescribeKey"
            ],
            resources=[self.kms_key.key_arn]
        )

        self.ec2_role.add_to_policy(s3_policy)
        self.ec2_role.add_to_policy(kms_policy)

        # Instance Profile
        self.ec2_instance_profile = iam.InstanceProfile(
            self, "tap_ec2_instance_profile",
            role=self.ec2_role
        )

    def _create_rds_database(self):
        """Create RDS PostgreSQL database with multi-AZ and encryption"""
        # Create DB subnet group
        self.db_subnet_group = rds.SubnetGroup(
            self, "tap_db_subnet_group",
            description="Subnet group for TAP RDS database",
            vpc=self.vpc,
            vpc_subnets=ec2.SubnetSelection(
                subnet_type=ec2.SubnetType.PRIVATE_ISOLATED
            )
        )

        # Create RDS instance
        self.database = rds.DatabaseInstance(
            self, "tap_database",
            engine=rds.DatabaseInstanceEngine.postgres(
                version=rds.PostgresEngineVersion.VER_15_4
            ),
            instance_type=ec2.InstanceType.of(
                ec2.InstanceClass.BURSTABLE3,
                ec2.InstanceSize.MICRO
            ),
            vpc=self.vpc,
            subnet_group=self.db_subnet_group,
            security_groups=[self.rds_security_group],
            multi_az=True,
            storage_encrypted=True,
            storage_encryption_key=self.kms_key,
            backup_retention=Duration.days(7),
            delete_automated_backups=True,
            deletion_protection=False,  # Set to True for production
            database_name="tapdb",
            credentials=rds.Credentials.from_generated_secret(
                "tapdbadmin",
                secret_name="tap-db-credentials"
            ),
            allocated_storage=20,
            storage_type=rds.StorageType.GP2,
            cloudwatch_logs_exports=["postgresql"],
            monitoring_interval=Duration.seconds(60),
            enable_performance_insights=True,
            removal_policy=RemovalPolicy.DESTROY
        )

    def _create_s3_bucket(self):
        """Create S3 bucket with versioning and encryption"""
        self.s3_bucket = s3.Bucket(
            self, "tap_secure_bucket",
            bucket_name=f"tap-secure-bucket-{self.account}",
            versioned=True,
            encryption=s3.BucketEncryption.KMS,
            encryption_key=self.kms_key,
            block_public_access=s3.BlockPublicAccess.BLOCK_ALL,
            removal_policy=RemovalPolicy.DESTROY,
            auto_delete_objects=True,  # Only for demo purposes
            lifecycle_rules=[
                s3.LifecycleRule(
                    id="tap_lifecycle_rule",
                    enabled=True,
                    noncurrent_version_expiration=Duration.days(30)
                )
            ]
        )

        # Add bucket policy for least privilege access
        bucket_policy = iam.PolicyStatement(
            effect=iam.Effect.ALLOW,
            principals=[iam.ArnPrincipal(self.ec2_role.role_arn)],
            actions=[
                "s3:GetObject",
                "s3:PutObject",
                "s3:DeleteObject"
            ],
            resources=[f"{self.s3_bucket.bucket_arn}/*"]
        )

        self.s3_bucket.add_to_resource_policy(bucket_policy)

    def _create_ec2_instances(self):
        """Create EC2 instances in private subnets across different AZs"""
        # User data script for EC2 instances
        user_data = ec2.UserData.for_linux()
        user_data.add_commands(
            "yum update -y",
            "yum install -y httpd",
            "systemctl start httpd",
            "systemctl enable httpd",
            "echo '<h1>TAP Infrastructure - Instance in AZ: $(curl -s http://169.254.169.254/latest/meta-data/placement/availability-zone)</h1>' > /var/www/html/index.html",
            # Install CloudWatch agent
            "wget https://s3.amazonaws.com/amazoncloudwatch-agent/amazon_linux/amd64/latest/amazon-cloudwatch-agent.rpm",
            "rpm -U ./amazon-cloudwatch-agent.rpm"
        )

        # Get private subnets
        private_subnets = self.vpc.select_subnets(
            subnet_type=ec2.SubnetType.PRIVATE_WITH_EGRESS
        ).subnets

        self.ec2_instances = []

        # Create EC2 instances in different AZs
        for i, subnet in enumerate(private_subnets[:2]):  # Limit to 2 instances
            instance = ec2.Instance(
                self, f"tap_ec2_instance_{i+1}",
                instance_type=ec2.InstanceType.of(
                    ec2.InstanceClass.BURSTABLE3,
                    ec2.InstanceSize.MICRO
                ),
                machine_image=ec2.AmazonLinuxImage(
                    generation=ec2.AmazonLinuxGeneration.AMAZON_LINUX_2
                ),
                vpc=self.vpc,
                vpc_subnets=ec2.SubnetSelection(subnets=[subnet]),
                security_group=self.ec2_security_group,
                role=self.ec2_role,
                user_data=user_data,
                detailed_monitoring=True,
                block_devices=[
                    ec2.BlockDevice(
                        device_name="/dev/xvda",
                        volume=ec2.BlockDeviceVolume.ebs(
                            volume_size=8,
                            encrypted=True,
                            kms_key=self.kms_key,
                            delete_on_termination=True
                        )
                    )
                ]
            )
            self.ec2_instances.append(instance)

    def _create_application_load_balancer(self):
        """Create Application Load Balancer with target group"""
        # Create ALB
        self.alb = elbv2.ApplicationLoadBalancer(
            self, "tap_application_load_balancer",
            vpc=self.vpc,
            internet_facing=True,
            vpc_subnets=ec2.SubnetSelection(
                subnet_type=ec2.SubnetType.PUBLIC
            ),
            security_group=self.alb_security_group
        )

        # Create target group
        self.target_group = elbv2.ApplicationTargetGroup(
            self, "tap_target_group",
            port=80,
            protocol=elbv2.ApplicationProtocol.HTTP,
            vpc=self.vpc,
            target_type=elbv2.TargetType.INSTANCE,
            health_check=elbv2.HealthCheck(
                enabled=True,
                healthy_http_codes="200",
                interval=Duration.seconds(30),
                path="/",
                protocol=elbv2.Protocol.HTTP,
                timeout=Duration.seconds(5),
                unhealthy_threshold_count=2,
                healthy_threshold_count=5
            )
        )

        # Add EC2 instances to target group
        for instance in self.ec2_instances:
            self.target_group.add_target(
                elbv2.InstanceTarget(instance.instance_id, 80)
            )

        # Create listener
        self.alb_listener = self.alb.add_listener(
            "tap_alb_listener",
            port=80,
            protocol=elbv2.ApplicationProtocol.HTTP,
            default_target_groups=[self.target_group]
        )

    def _create_monitoring_and_alarms(self):
        """Create CloudWatch monitoring and alarms"""
        # EC2 CPU Utilization Alarms
        for i, instance in enumerate(self.ec2_instances):
            cloudwatch.Alarm(
                self, f"tap_ec2_cpu_alarm_{i+1}",
                alarm_name=f"TAP-EC2-HighCPU-Instance-{i+1}",
                alarm_description=f"High CPU utilization for EC2 instance {i+1}",
                metric=cloudwatch.Metric(
                    namespace="AWS/EC2",
                    metric_name="CPUUtilization",
                    dimensions_map={
                        "InstanceId": instance.instance_id
                    },
                    statistic="Average",
                    period=Duration.minutes(5)
                ),
                threshold=80,
                evaluation_periods=2,
                comparison_operator=cloudwatch.ComparisonOperator.GREATER_THAN_THRESHOLD
            )

        # RDS CPU Utilization Alarm
        cloudwatch.Alarm(
            self, "tap_rds_cpu_alarm",
            alarm_name="TAP-RDS-HighCPU",
            alarm_description="High CPU utilization for RDS database",
            metric=cloudwatch.Metric(
                namespace="AWS/RDS",
                metric_name="CPUUtilization",
                dimensions_map={
                    "DBInstanceIdentifier": self.database.instance_identifier
                },
                statistic="Average",
                period=Duration.minutes(5)
            ),
            threshold=80,
            evaluation_periods=2,
            comparison_operator=cloudwatch.ComparisonOperator.GREATER_THAN_THRESHOLD
        )

        # RDS Free Storage Space Alarm
        cloudwatch.Alarm(
            self, "tap_rds_storage_alarm",
            alarm_name="TAP-RDS-LowStorage",
            alarm_description="Low free storage space for RDS database",
            metric=cloudwatch.Metric(
                namespace="AWS/RDS",
                metric_name="FreeStorageSpace",
                dimensions_map={
                    "DBInstanceIdentifier": self.database.instance_identifier
                },
                statistic="Average",
                period=Duration.minutes(5)
            ),
            threshold=2000000000,  # 2GB in bytes
            evaluation_periods=1,
            comparison_operator=cloudwatch.ComparisonOperator.LESS_THAN_THRESHOLD
        )

        # ALB Target Response Time Alarm
        cloudwatch.Alarm(
            self, "tap_alb_response_time_alarm",
            alarm_name="TAP-ALB-HighResponseTime",
            alarm_description="High response time for ALB targets",
            metric=cloudwatch.Metric(
                namespace="AWS/ApplicationELB",
                metric_name="TargetResponseTime",
                dimensions_map={
                    "LoadBalancer": self.alb.load_balancer_full_name
                },
                statistic="Average",
                period=Duration.minutes(5)
            ),
            threshold=1,  # 1 second
            evaluation_periods=2,
            comparison_operator=cloudwatch.ComparisonOperator.GREATER_THAN_THRESHOLD
        )

    def _create_outputs(self):
        """Create CloudFormation outputs"""
        CfnOutput(
            self, "tap_vpc_id",
            value=self.vpc.vpc_id,
            description="VPC ID"
        )

        CfnOutput(
            self, "tap_alb_dns_name",
            value=self.alb.load_balancer_dns_name,
            description="Application Load Balancer DNS Name"
        )

        CfnOutput(
            self, "tap_s3_bucket_name",
            value=self.s3_bucket.bucket_name,
            description="S3 Bucket Name"
        )

        CfnOutput(
            self, "tap_rds_endpoint",
            value=self.database.instance_endpoint.hostname,
            description="RDS Database Endpoint"
        )

        CfnOutput(
            self, "tap_kms_key_id",
            value=self.kms_key.key_id,
            description="KMS Key ID"
        )