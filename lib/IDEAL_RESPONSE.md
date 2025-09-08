```Python
"""tap_stack.py
This module defines the TapStack class, which serves as the main CDK stack for 
the TAP (Test Automation Platform) project.
It orchestrates the instantiation of other resource-specific stacks and 
manages environment-specific configurations.
"""

from typing import Optional

import aws_cdk as cdk
from aws_cdk import (
    Stack,
    NestedStack,
    Duration,
    Tags,
    aws_ec2 as ec2,
    aws_rds as rds,
    aws_iam as iam,
    aws_autoscaling as autoscaling,
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

    This stack creates a secure AWS infrastructure with VPC, EC2 Auto Scaling Group,
    RDS database, and monitoring capabilities following AWS security best practices.

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
            **kwargs):
        super().__init__(scope, construct_id, **kwargs)

        # Get environment suffix from props, context, or use 'dev' as default
        self.environment_suffix = (
            props.environment_suffix if props else None
        ) or self.node.try_get_context('environmentSuffix') or 'dev'

        # Add Production environment tag to all resources
        Tags.of(self).add("Environment", "Production")

        # Create VPC and networking infrastructure
        self._create_vpc()
        
        # Create security groups
        self._create_security_groups()
        
        # Create IAM roles and policies
        self._create_iam_resources()
        
        # Create RDS database in private subnet
        self._create_rds_database()
        
        # Create EC2 Auto Scaling Group
        self._create_auto_scaling_group()
        
        # Create CloudWatch monitoring and alarms
        self._create_monitoring()

    def _create_vpc(self):
        """Create VPC with public and private subnets"""
        self.vpc = ec2.Vpc(
            self,
            f"TapVpc{self.environment_suffix}",
            ip_addresses=ec2.IpAddresses.cidr("10.0.0.0/16"),
            max_azs=2,
            subnet_configuration=[
                ec2.SubnetConfiguration(
                    cidr_mask=24,
                    name="PublicSubnet",
                    subnet_type=ec2.SubnetType.PUBLIC,
                ),
                ec2.SubnetConfiguration(
                    cidr_mask=24,
                    name="PrivateSubnet", 
                    subnet_type=ec2.SubnetType.PRIVATE_WITH_EGRESS,
                ),
            ],
            nat_gateways=1,
        )

        # Add tags to VPC
        Tags.of(self.vpc).add("Name", f"tap-vpc-{self.environment_suffix}")

    def _create_security_groups(self):
        """Create security groups for EC2 and RDS"""
        # EC2 Security Group - SSH access restricted to specific IP range
        self.ec2_security_group = ec2.SecurityGroup(
            self,
            f"EC2SecurityGroup{self.environment_suffix}",
            vpc=self.vpc,
            description="Security group for EC2 instances",
            allow_all_outbound=True,
        )

        # Allow SSH from specific IP range (replace with actual IP range)
        self.ec2_security_group.add_ingress_rule(
            peer=ec2.Peer.ipv4("203.0.113.0/24"),  # Replace with actual IP range
            connection=ec2.Port.tcp(22),
            description="SSH access from specific IP range",
        )

        # Allow HTTP traffic for web applications
        self.ec2_security_group.add_ingress_rule(
            peer=ec2.Peer.any_ipv4(),
            connection=ec2.Port.tcp(80),
            description="HTTP access",
        )

        # RDS Security Group - Only allow access from EC2 instances
        self.rds_security_group = ec2.SecurityGroup(
            self,
            f"RDSSecurityGroup{self.environment_suffix}",
            vpc=self.vpc,
            description="Security group for RDS database",
            allow_all_outbound=False,
        )

        # Allow MySQL access from EC2 security group
        self.rds_security_group.add_ingress_rule(
            peer=self.ec2_security_group,
            connection=ec2.Port.tcp(3306),
            description="MySQL access from EC2 instances",
        )

    def _create_iam_resources(self):
        """Create IAM roles and policies for EC2 instances"""
        # Create IAM role for EC2 instances
        self.ec2_role = iam.Role(
            self,
            f"EC2Role{self.environment_suffix}",
            assumed_by=iam.ServicePrincipal("ec2.amazonaws.com"),
            description="IAM role for EC2 instances with S3 and DynamoDB access",
        )

        # Create custom policy for S3 and DynamoDB access
        s3_dynamodb_policy = iam.PolicyStatement(
            effect=iam.Effect.ALLOW,
            actions=[
                # S3 permissions
                "s3:GetObject",
                "s3:PutObject",
                "s3:DeleteObject",
                "s3:ListBucket",
                # DynamoDB permissions
                "dynamodb:PutItem",
                "dynamodb:GetItem",
                "dynamodb:UpdateItem",
                "dynamodb:DeleteItem",
                "dynamodb:Query",
                "dynamodb:Scan",
            ],
            resources=[
                "arn:aws:s3:::*",
                "arn:aws:dynamodb:*:*:table/*",
            ],
        )

        # Attach custom policy to role
        self.ec2_role.add_to_policy(s3_dynamodb_policy)

        # Attach AWS managed policy for SSM (optional for management)
        self.ec2_role.add_managed_policy(
            iam.ManagedPolicy.from_aws_managed_policy_name("AmazonSSMManagedInstanceCore")
        )

        # Create instance profile
        self.instance_profile = iam.InstanceProfile(
            self,
            f"EC2InstanceProfile{self.environment_suffix}",
            role=self.ec2_role,
        )

    def _create_rds_database(self):
        """Create RDS MySQL database in private subnet"""
        # Create RDS subnet group
        self.db_subnet_group = rds.SubnetGroup(
            self,
            f"DBSubnetGroup{self.environment_suffix}",
            description="Subnet group for RDS database",
            vpc=self.vpc,
            vpc_subnets=ec2.SubnetSelection(subnet_type=ec2.SubnetType.PRIVATE_WITH_EGRESS),
        )

        # Create RDS MySQL instance
        self.database = rds.DatabaseInstance(
            self,
            f"TapDatabase{self.environment_suffix}",
            engine=rds.DatabaseInstanceEngine.mysql(
                version=rds.MysqlEngineVersion.VER_8_0
            ),
            instance_type=ec2.InstanceType.of(
                ec2.InstanceClass.BURSTABLE3,
                ec2.InstanceSize.MICRO,
            ),
            vpc=self.vpc,
            subnet_group=self.db_subnet_group,
            security_groups=[self.rds_security_group],
            multi_az=False,  # For cost optimization in non-prod
            allocated_storage=20,
            storage_encrypted=True,
            backup_retention=Duration.days(7),
            deletion_protection=False,  # For easier cleanup in dev/test
            database_name="tapdb",
            credentials=rds.Credentials.from_generated_secret(
                "admin",
                secret_name=f"tap-db-credentials-{self.environment_suffix}",
            ),
        )

    def _create_auto_scaling_group(self):
        """Create Auto Scaling Group with EC2 instances"""
        # Get latest Amazon Linux 2 AMI
        amzn_linux = ec2.MachineImage.latest_amazon_linux2(
            edition=ec2.AmazonLinuxEdition.STANDARD,
            virtualization=ec2.AmazonLinuxVirt.HVM,
            storage=ec2.AmazonLinuxStorage.GENERAL_PURPOSE,
        )

        # Create launch template
        self.launch_template = ec2.LaunchTemplate(
            self,
            f"LaunchTemplate{self.environment_suffix}",
            machine_image=amzn_linux,
            instance_type=ec2.InstanceType.of(
                ec2.InstanceClass.BURSTABLE3,
                ec2.InstanceSize.MICRO,
            ),
            security_group=self.ec2_security_group,
            role=self.ec2_role,
            user_data=ec2.UserData.for_linux(),
        )

        # Add basic user data script
        self.launch_template.user_data.add_commands(
            "yum update -y",
            "yum install -y httpd",
            "systemctl start httpd",
            "systemctl enable httpd",
            "echo '<h1>TAP Application Server</h1>' > /var/www/html/index.html",
        )

        # Create Auto Scaling Group
        self.auto_scaling_group = autoscaling.AutoScalingGroup(
            self,
            f"AutoScalingGroup{self.environment_suffix}",
            vpc=self.vpc,
            launch_template=self.launch_template,
            min_capacity=2,
            max_capacity=5,
            desired_capacity=2,
            vpc_subnets=ec2.SubnetSelection(subnet_type=ec2.SubnetType.PUBLIC), 
            health_checks=autoscaling.HealthChecks.ec2(grace_period=Duration.minutes(5)),
        )

        # Create scaling policy based on CPU utilization
        self.scaling_policy = self.auto_scaling_group.scale_on_cpu_utilization(
            f"CpuScalingPolicy{self.environment_suffix}",
            target_utilization_percent=70,
        )

    def _create_monitoring(self):
        """Create CloudWatch monitoring and alarms"""
        # Create SNS topic for notifications
        self.alarm_topic = sns.Topic(
            self,
            f"AlarmTopic{self.environment_suffix}",
            display_name="TAP CPU Alarm Notifications",
        )

        # Create CloudWatch alarm for high CPU usage
        self.cpu_alarm = cloudwatch.Alarm(
            self,
            f"HighCpuAlarm{self.environment_suffix}",
            metric=cloudwatch.Metric(
                namespace="AWS/AutoScaling",
                metric_name="CPUUtilization",
                dimensions_map={
                    "AutoScalingGroupName": self.auto_scaling_group.auto_scaling_group_name
                },
                statistic="Average",
                period=Duration.minutes(5),
            ),
            threshold=70,
            evaluation_periods=2,
            datapoints_to_alarm=2,
            comparison_operator=cloudwatch.ComparisonOperator.GREATER_THAN_THRESHOLD,
            alarm_description="Alarm when CPU exceeds 70%",
        )

        # Add SNS action to alarm
        self.cpu_alarm.add_alarm_action(
            cw_actions.SnsAction(self.alarm_topic)
        )

        # Create alarm for database connections (optional)
        if hasattr(self, 'database'):
            self.db_connections_alarm = cloudwatch.Alarm(
                self,
                f"DatabaseConnectionsAlarm{self.environment_suffix}",
                metric=self.database.metric_database_connections(
                    period=Duration.minutes(5),
                    statistic=cloudwatch.Stats.AVERAGE,
                ),
                threshold=10,
                evaluation_periods=2,
                comparison_operator=cloudwatch.ComparisonOperator.GREATER_THAN_THRESHOLD,
                alarm_description="Alarm when database connections exceed 10",
            )

        # Output important information
        cdk.CfnOutput(
            self,
            f"VpcId{self.environment_suffix}",
            value=self.vpc.vpc_id,
            description="VPC ID",
        )

        cdk.CfnOutput(
            self,
            f"DatabaseEndpoint{self.environment_suffix}",
            value=self.database.instance_endpoint.hostname,
            description="RDS Database Endpoint",
        )

        cdk.CfnOutput(
            self,
            f"AutoScalingGroupName{self.environment_suffix}",
            value=self.auto_scaling_group.auto_scaling_group_name,
            description="Auto Scaling Group Name",
        )

        cdk.CfnOutput(
            self,
            f"SNSTopicArn{self.environment_suffix}",
            value=self.alarm_topic.topic_arn,
            description="SNS Topic ARN for Alarms",
        )

```