"""Security Infrastructure Stack for SecureApp"""

from typing import Optional
import aws_cdk as cdk
from aws_cdk import (
    Stack,
    aws_ec2 as ec2,
    aws_rds as rds,
    aws_s3 as s3,
    aws_iam as iam,
    aws_autoscaling as autoscaling,
    aws_cloudwatch as cloudwatch,
    aws_cloudwatch_actions as cloudwatch_actions,
    aws_sns as sns,
    aws_s3_notifications as s3n,
    Duration,
    RemovalPolicy,
    CfnOutput
)
from constructs import Construct


class SecurityStack(Stack):
    def __init__(self, scope: Construct, construct_id: str, environment_suffix: str = 'dev', **kwargs) -> None:
        super().__init__(scope, construct_id, **kwargs)
        
        # Store environment suffix for resource naming
        self.environment_suffix = environment_suffix

        # Create VPC with public subnets
        vpc = ec2.Vpc(
            self, "SecureApp-VPC",
            vpc_name=f"SecureApp-VPC-{self.environment_suffix}",
            max_azs=2,
            nat_gateways=0,  # Using public subnets only for cost optimization
            subnet_configuration=[
                ec2.SubnetConfiguration(
                    subnet_type=ec2.SubnetType.PUBLIC,
                    name="SecureApp-PublicSubnet",
                    cidr_mask=24
                )
            ],
            enable_dns_hostnames=True,
            enable_dns_support=True
        )

        # Create SNS topic for CloudWatch alarms
        alarm_topic = sns.Topic(
            self, "SecureApp-AlarmTopic",
            topic_name=f"SecureApp-CPUAlarms-{self.environment_suffix}",
            display_name="SecureApp CPU Utilization Alerts"
        )

        # Create S3 bucket with encryption and integrity protections
        s3_bucket = s3.Bucket(
            self, "SecureApp-S3Bucket",
            bucket_name=None,  # Auto-generated name
            encryption=s3.BucketEncryption.S3_MANAGED,
            enforce_ssl=True,
            versioned=True,
            block_public_access=s3.BlockPublicAccess.BLOCK_ALL,
            removal_policy=RemovalPolicy.DESTROY,  # For development
            object_ownership=s3.ObjectOwnership.BUCKET_OWNER_PREFERRED,
            event_bridge_enabled=True
        )

        # Add bucket notification for integrity monitoring
        s3_notification_topic = sns.Topic(
            self, "SecureApp-S3Notifications",
            topic_name=f"SecureApp-S3Notifications-{self.environment_suffix}"
        )
        s3_bucket.add_event_notification(
            s3.EventType.OBJECT_CREATED,
            s3n.SnsDestination(s3_notification_topic)
        )

        # Create security group for RDS
        rds_security_group = ec2.SecurityGroup(
            self, "SecureApp-RDSSecurityGroup",
            vpc=vpc,
            security_group_name=f"SecureApp-RDSSecurityGroup-{self.environment_suffix}",
            description="Security group for SecureApp RDS MySQL instance",
            allow_all_outbound=False
        )

        # Create security group for EC2 instances
        ec2_security_group = ec2.SecurityGroup(
            self, "SecureApp-EC2SecurityGroup",
            vpc=vpc,
            security_group_name=f"SecureApp-EC2SecurityGroup-{self.environment_suffix}",
            description="Security group for SecureApp EC2 instances",
            allow_all_outbound=True
        )

        # Allow EC2 instances to connect to RDS
        rds_security_group.add_ingress_rule(
            peer=ec2_security_group,
            connection=ec2.Port.tcp(3306),
            description="Allow EC2 instances to connect to MySQL"
        )

        # Allow administrative access to RDS (adjust CIDR as needed)
        rds_security_group.add_ingress_rule(
            peer=ec2.Peer.any_ipv4(),  # In production, restrict to admin IP ranges
            connection=ec2.Port.tcp(3306),
            description="Allow administrative access to MySQL"
        )

        # Create IAM role for EC2 instances
        ec2_role = iam.Role(
            self, "SecureApp-EC2Role",
            role_name=f"SecureApp-EC2Role-{self.environment_suffix}",
            assumed_by=iam.ServicePrincipal("ec2.amazonaws.com"),
            managed_policies=[
                iam.ManagedPolicy.from_aws_managed_policy_name("AmazonSSMManagedInstanceCore"),
                iam.ManagedPolicy.from_aws_managed_policy_name("CloudWatchAgentServerPolicy")
            ]
        )

        # Grant S3 access to EC2 instances
        s3_bucket.grant_read_write(ec2_role)

        # Add custom policy for RDS access
        ec2_role.add_to_policy(
            iam.PolicyStatement(
                effect=iam.Effect.ALLOW,
                actions=[
                    "rds:DescribeDBInstances",
                    "rds:DescribeDBClusters",
                    "rds-db:connect"
                ],
                resources=["*"]
            )
        )

        # Create DB subnet group
        db_subnet_group = rds.SubnetGroup(
            self, "SecureApp-DBSubnetGroup",
            subnet_group_name=f"secureapp-db-subnet-group-{self.environment_suffix}",
            description="Subnet group for SecureApp RDS instance",
            vpc=vpc,
            vpc_subnets=ec2.SubnetSelection(subnet_type=ec2.SubnetType.PUBLIC)
        )

        # Create RDS MySQL instance
        rds_instance = rds.DatabaseInstance(
            self, "SecureApp-RDSInstance",
            instance_identifier=f"secureapp-mysql-{self.environment_suffix}",
            engine=rds.DatabaseInstanceEngine.mysql(
                version=rds.MysqlEngineVersion.VER_8_0_39
            ),
            instance_type=ec2.InstanceType.of(
                ec2.InstanceClass.BURSTABLE3,
                ec2.InstanceSize.MICRO
            ),
            vpc=vpc,
            subnet_group=db_subnet_group,
            security_groups=[rds_security_group],
            credentials=rds.Credentials.from_generated_secret(
                "admin",
                secret_name=f"SecureApp-RDSCredentials-{self.environment_suffix}"
            ),
            allocated_storage=20,
            storage_type=rds.StorageType.GP2,
            backup_retention=Duration.days(7),
            deletion_protection=False,  # For development
            delete_automated_backups=True,
            publicly_accessible=True,  # Required for administrative access
            multi_az=False,  # Single AZ for cost optimization
            auto_minor_version_upgrade=True,
            storage_encrypted=True,
            removal_policy=RemovalPolicy.DESTROY
        )

        # Create launch template for EC2 instances
        launch_template = ec2.LaunchTemplate(
            self, "SecureApp-LaunchTemplate",
            launch_template_name=f"SecureApp-LaunchTemplate-{self.environment_suffix}",
            instance_type=ec2.InstanceType.of(
                ec2.InstanceClass.BURSTABLE3,
                ec2.InstanceSize.MICRO
            ),
            machine_image=ec2.AmazonLinuxImage(
                generation=ec2.AmazonLinuxGeneration.AMAZON_LINUX_2023
            ),
            security_group=ec2_security_group,
            role=ec2_role,
            user_data=ec2.UserData.for_linux(),
            detailed_monitoring=True
        )

        # Add user data for CloudWatch agent
        launch_template.user_data.add_commands(
            "yum update -y",
            "yum install -y amazon-cloudwatch-agent",
            "amazon-cloudwatch-agent-ctl -a fetch-config -m ec2 -c default"
        )

        # Create Auto Scaling Group
        auto_scaling_group = autoscaling.AutoScalingGroup(
            self, "SecureApp-AutoScalingGroup",
            auto_scaling_group_name=f"SecureApp-AutoScalingGroup-{self.environment_suffix}",
            vpc=vpc,
            launch_template=launch_template,
            min_capacity=2,
            max_capacity=5,
            desired_capacity=2,
            vpc_subnets=ec2.SubnetSelection(subnet_type=ec2.SubnetType.PUBLIC),
            health_check=autoscaling.HealthCheck.ec2(
                grace=Duration.minutes(5)
            ),
            update_policy=autoscaling.UpdatePolicy.rolling_update()
        )

        # Create CloudWatch alarm for CPU utilization
        cpu_metric = cloudwatch.Metric(
            namespace="AWS/EC2",
            metric_name="CPUUtilization",
            dimensions_map={
                "AutoScalingGroupName": auto_scaling_group.auto_scaling_group_name
            },
            period=Duration.minutes(5),
            statistic="Average"
        )
        
        cpu_alarm = cloudwatch.Alarm(
            self, "SecureApp-CPUAlarm",
            alarm_name=f"SecureApp-HighCPUUtilization-{self.environment_suffix}",
            alarm_description="Alert when EC2 CPU utilization exceeds 75%",
            metric=cpu_metric,
            threshold=75,
            evaluation_periods=2,
            datapoints_to_alarm=2,
            comparison_operator=cloudwatch.ComparisonOperator.GREATER_THAN_THRESHOLD
        )

        # Add SNS notification to alarm
        cpu_alarm.add_alarm_action(
            cloudwatch_actions.SnsAction(alarm_topic)
        )

        # Note: Inspector requires additional setup and permissions
        # For production, configure Amazon Inspector v2 through AWS Console or separate automation

        # Output important resource information
        CfnOutput(
            self, "VPCId",
            value=vpc.vpc_id,
            description="VPC ID for SecureApp"
        )

        CfnOutput(
            self, "S3BucketName",
            value=s3_bucket.bucket_name,
            description="S3 bucket name for SecureApp data storage"
        )

        CfnOutput(
            self, "RDSEndpoint",
            value=rds_instance.instance_endpoint.hostname,
            description="RDS MySQL instance endpoint"
        )

        CfnOutput(
            self, "AutoScalingGroupName",
            value=auto_scaling_group.auto_scaling_group_name,
            description="Auto Scaling Group name for EC2 instances"
        )

        CfnOutput(
            self, "SNSTopicArn",
            value=alarm_topic.topic_arn,
            description="SNS topic ARN for CloudWatch alarms"
        )