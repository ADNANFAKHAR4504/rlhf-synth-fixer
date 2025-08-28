```python

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
    Duration,
    RemovalPolicy,
    aws_ec2 as ec2,
    aws_rds as rds,
    aws_s3 as s3,
    aws_elasticloadbalancingv2 as elbv2,
    aws_autoscaling as autoscaling,
    aws_cloudwatch as cloudwatch,
    aws_lambda as lambda_,
    aws_iam as iam,
    aws_kms as kms,
    aws_logs as logs,
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
        **kwargs,
    ):
        super().__init__(scope, construct_id, **kwargs)

        # Get environment suffix from props, context, or use 'dev' as default
        environment_suffix = (
            props.environment_suffix if props else None
        ) or self.node.try_get_context("environmentSuffix") or "dev"

        # 1. Create VPC
        vpc = ec2.Vpc(
            self,
            "TapVpc",
            max_azs=2,
            nat_gateways=1,
            subnet_configuration=[
                ec2.SubnetConfiguration(
                    name="Public", subnet_type=ec2.SubnetType.PUBLIC, cidr_mask=24
                ),
                ec2.SubnetConfiguration(
                    name="Private", subnet_type=ec2.SubnetType.PRIVATE_WITH_EGRESS, cidr_mask=24
                ),
                ec2.SubnetConfiguration(
                    name="Database", subnet_type=ec2.SubnetType.PRIVATE_ISOLATED, cidr_mask=24
                ),
            ],
        )

        # 2. Create Security Groups
        alb_sg = ec2.SecurityGroup(
            self, "ALBSecurityGroup", vpc=vpc, description="Security group for ALB"
        )
        alb_sg.add_ingress_rule(ec2.Peer.any_ipv4(), ec2.Port.tcp(80), "Allow HTTP")
        alb_sg.add_ingress_rule(ec2.Peer.any_ipv4(), ec2.Port.tcp(443), "Allow HTTPS")

        ec2_sg = ec2.SecurityGroup(
            self, "EC2SecurityGroup", vpc=vpc, description="Security group for EC2"
        )
        ec2_sg.add_ingress_rule(alb_sg, ec2.Port.tcp(80), "Allow HTTP from ALB")

        db_sg = ec2.SecurityGroup(
            self, "DBSecurityGroup", vpc=vpc, description="Security group for RDS"
        )
        db_sg.add_ingress_rule(ec2_sg, ec2.Port.tcp(3306), "Allow MySQL from EC2")

        # 3. Create Application Load Balancer
        alb = elbv2.ApplicationLoadBalancer(
            self,
            "TapALB",
            vpc=vpc,
            internet_facing=True,
            security_group=alb_sg,
        )
        alb.add_listener(
            "HTTPListener",
            port=80,
            default_action=elbv2.ListenerAction.redirect(protocol="HTTPS", port="443"),
        )

        # 4. Create Auto Scaling Group
        user_data = ec2.UserData.for_linux()
        user_data.add_commands(
            "yum update -y",
            "yum install -y httpd",
            "systemctl start httpd",
            "systemctl enable httpd",
        )

        launch_template = ec2.LaunchTemplate(
            self,
            "LaunchTemplate",
            instance_type=ec2.InstanceType.of(ec2.InstanceClass.T3, ec2.InstanceSize.MICRO),
            machine_image=ec2.AmazonLinuxImage(),
            user_data=user_data,
            security_group=ec2_sg,
        )

        asg = autoscaling.AutoScalingGroup(
            self,
            "TapASG",
            vpc=vpc,
            launch_template=launch_template,
            min_capacity=1,
            max_capacity=5,
        )

        # 5. Create RDS Database Cluster
        db_cluster = rds.DatabaseCluster(
            self,
            "TapRDS",
            engine=rds.DatabaseClusterEngine.aurora_mysql(version=rds.AuroraMysqlEngineVersion.VER_3_04_0),
            writer=rds.ClusterInstance.provisioned(
                "WriterInstance",
                instance_type=ec2.InstanceType.of(ec2.InstanceClass.T3, ec2.InstanceSize.MEDIUM),
            ),
            readers=[
                rds.ClusterInstance.provisioned(
                    "ReaderInstance",
                    instance_type=ec2.InstanceType.of(ec2.InstanceClass.T3, ec2.InstanceSize.MEDIUM),
                )
            ],
            vpc=vpc,
            vpc_subnets=ec2.SubnetSelection(subnet_type=ec2.SubnetType.PRIVATE_ISOLATED),
            security_groups=[db_sg],
            credentials=rds.Credentials.from_generated_secret("admin"),
            default_database_name="tapdb",
        )

        # 6. Create S3 Buckets
        primary_bucket = s3.Bucket(
            self,
            "PrimaryBucket",
            versioned=True,
            encryption=s3.BucketEncryption.S3_MANAGED,
            removal_policy=RemovalPolicy.RETAIN,
        )

        backup_bucket = s3.Bucket(
            self,
            "BackupBucket",
            versioned=True,
            encryption=s3.BucketEncryption.S3_MANAGED,
            removal_policy=RemovalPolicy.RETAIN,
        )

        # 7. Create CloudWatch Alarms
        cpu_metric = cloudwatch.Metric(
            namespace="AWS/EC2",
            metric_name="CPUUtilization",
            dimensions_map={"AutoScalingGroupName": asg.auto_scaling_group_name},
            statistic="Average",
            period=Duration.minutes(5),
        )

        cloudwatch.Alarm(
            self,
            "CPUAlarm",
            metric=cpu_metric,
            threshold=80,
            evaluation_periods=2,
            alarm_description="Alarm if CPU exceeds 80%",
        )

        # 8. Create Lambda Function
        lambda_function = lambda_.Function(
            self,
            "AutoRecoveryFunction",
            runtime=lambda_.Runtime.PYTHON_3_9,
            handler="index.handler",
            code=lambda_.Code.from_inline(
                """
        def handler(event, context):
            print("Auto recovery triggered")
        """
            ),
        )

        # 9. Create KMS Key
        kms_key = kms.Key(
            self,
            "TapKMSKey",
            enable_key_rotation=True,
            description="KMS key for encrypting sensitive data",
        )

        # Outputs
        cdk.CfnOutput(self, "ALB DNS", value=alb.load_balancer_dns_name)
        cdk.CfnOutput(self, "Primary Bucket", value=primary_bucket.bucket_name)
        cdk.CfnOutput(self, "Backup Bucket", value=backup_bucket.bucket_name)

        # VPC Outputs
        cdk.CfnOutput(self, "VPC ID", value=vpc.vpc_id)
        cdk.CfnOutput(self, "VPC CIDR", value=vpc.vpc_cidr_block)

        # Subnet Outputs
        cdk.CfnOutput(
            self,
            "Public Subnet IDs",
            value=",".join([subnet.subnet_id for subnet in vpc.public_subnets])
        )
        cdk.CfnOutput(
            self,
            "Private Subnet IDs",
            value=",".join([subnet.subnet_id for subnet in vpc.private_subnets])
        )
        cdk.CfnOutput(
            self,
            "Isolated Subnet IDs",
            value=",".join([subnet.subnet_id for subnet in vpc.isolated_subnets])
        )

        # Security Group Outputs
        cdk.CfnOutput(self, "ALB Security Group ID", value=alb_sg.security_group_id)
        cdk.CfnOutput(self, "EC2 Security Group ID", value=ec2_sg.security_group_id)
        cdk.CfnOutput(self, "DB Security Group ID", value=db_sg.security_group_id)

        # ALB Outputs
        cdk.CfnOutput(self, "ALB ARN", value=alb.load_balancer_arn)
        cdk.CfnOutput(self, "ALB Hosted Zone ID", value=alb.load_balancer_canonical_hosted_zone_id)

        # Auto Scaling Group Outputs
        cdk.CfnOutput(self, "Auto Scaling Group Name", value=asg.auto_scaling_group_name)
        cdk.CfnOutput(self, "Auto Scaling Group ARN", value=asg.auto_scaling_group_arn)
        cdk.CfnOutput(self, "Launch Template ID", value=launch_template.launch_template_id)

        # RDS Outputs
        cdk.CfnOutput(self, "RDS Cluster Identifier", value=db_cluster.cluster_identifier)
        cdk.CfnOutput(self, "RDS Cluster Endpoint", value=db_cluster.cluster_endpoint.hostname)
        cdk.CfnOutput(self, "RDS Cluster Reader Endpoint", value=db_cluster.cluster_read_endpoint.hostname)
        cdk.CfnOutput(self, "RDS Cluster ARN", value=db_cluster.cluster_arn)
        cdk.CfnOutput(self, "RDS Secret ARN", value=db_cluster.secret.secret_arn)

        # S3 Bucket Additional Outputs
        cdk.CfnOutput(self, "Primary Bucket ARN", value=primary_bucket.bucket_arn)
        cdk.CfnOutput(self, "Primary Bucket Domain Name", value=primary_bucket.bucket_domain_name)
        cdk.CfnOutput(self, "Backup Bucket ARN", value=backup_bucket.bucket_arn)
        cdk.CfnOutput(self, "Backup Bucket Domain Name", value=backup_bucket.bucket_domain_name)

        # Lambda Outputs
        cdk.CfnOutput(self, "Lambda Function Name", value=lambda_function.function_name)
        cdk.CfnOutput(self, "Lambda Function ARN", value=lambda_function.function_arn)
        cdk.CfnOutput(self, "Lambda Function Role ARN", value=lambda_function.role.role_arn)

        # KMS Outputs
        cdk.CfnOutput(self, "KMS Key ID", value=kms_key.key_id)
        cdk.CfnOutput(self, "KMS Key ARN", value=kms_key.key_arn)

        # Environment Output
        cdk.CfnOutput(self, "Environment Suffix", value=environment_suffix)


```