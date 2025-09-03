"""tap_stack.py
This module defines the TapStack class, which serves as the main CDK stack for 
the TAP (Test Automation Platform) project.
It orchestrates the instantiation of AWS resources for a scalable web application.
"""

from typing import Optional

import aws_cdk as cdk
from aws_cdk import (
    Stack,
    aws_ec2 as ec2,
    aws_s3 as s3,
    aws_dynamodb as dynamodb,
    aws_cloudfront as cloudfront,
    aws_cloudfront_origins as origins,
    aws_iam as iam,
    aws_autoscaling as autoscaling,
    aws_elasticloadbalancing as elb,
    aws_logs as logs,
    aws_cloudwatch as cloudwatch,
    Duration,
    RemovalPolicy,
    CfnOutput,
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
    Represents the main CDK stack for the TAP project.

    This stack creates a comprehensive web application infrastructure including:
    - VPC with public subnets
    - Auto Scaling Group with EC2 instances  
    - Classic Load Balancer
    - DynamoDB table for session management
    - S3 bucket for static content
    - CloudFront distribution
    - Route 53 DNS management
    - IAM roles and CloudWatch monitoring

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

        # Create VPC
        self.vpc = ec2.Vpc(
            self, f"TapVPC-{self.environment_suffix}",
            ip_addresses=ec2.IpAddresses.cidr("10.0.0.0/16"),
            max_azs=2,
            subnet_configuration=[
                ec2.SubnetConfiguration(
                    name="PublicSubnet",
                    subnet_type=ec2.SubnetType.PUBLIC,
                    cidr_mask=24
                )
            ],
            enable_dns_hostnames=True,
            enable_dns_support=True
        )

        # Create Security Group
        self.security_group = ec2.SecurityGroup(
            self, f"TapSecurityGroup-{self.environment_suffix}",
            vpc=self.vpc,
            description="Allow HTTP and HTTPS traffic",
            allow_all_outbound=True
        )
        self.security_group.add_ingress_rule(
            ec2.Peer.any_ipv4(),
            ec2.Port.tcp(80),
            "Allow HTTP traffic"
        )
        self.security_group.add_ingress_rule(
            ec2.Peer.any_ipv4(),
            ec2.Port.tcp(443),
            "Allow HTTPS traffic"
        )

        # Create DynamoDB Table
        self.dynamodb_table = dynamodb.Table(
            self, f"TapDynamoDBTable-{self.environment_suffix}",
            table_name=f"TapSessions-{self.environment_suffix}",
            partition_key=dynamodb.Attribute(
                name="SessionId",
                type=dynamodb.AttributeType.STRING
            ),
            billing_mode=dynamodb.BillingMode.PROVISIONED,
            read_capacity=5,
            write_capacity=5,
            removal_policy=RemovalPolicy.DESTROY
        )

        # Create S3 Bucket
        self.s3_bucket = s3.Bucket(
            self, f"TapS3Bucket-{self.environment_suffix}",
            bucket_name=f"tap-static-content-{self.environment_suffix}-{self.account}",
            versioned=True,
            public_read_access=True,
            block_public_access=s3.BlockPublicAccess(
                block_public_acls=False,
                block_public_policy=False,
                ignore_public_acls=False,
                restrict_public_buckets=False
            ),
            removal_policy=RemovalPolicy.DESTROY,
            auto_delete_objects=True,
            lifecycle_rules=[
                s3.LifecycleRule(
                    id="RetainVersions",
                    noncurrent_version_expiration=Duration.days(90),
                    enabled=True
                )
            ]
        )

        # Create IAM Role for EC2
        self.ec2_role = iam.Role(
            self, f"TapEC2Role-{self.environment_suffix}",
            role_name=f"TapEC2Role-{self.environment_suffix}",
            assumed_by=iam.ServicePrincipal("ec2.amazonaws.com"),
            inline_policies={
                "S3Access": iam.PolicyDocument(
                    statements=[
                        iam.PolicyStatement(
                            effect=iam.Effect.ALLOW,
                            actions=[
                                "s3:GetObject",
                                "s3:PutObject",
                                "s3:DeleteObject"
                            ],
                            resources=[
                                self.s3_bucket.bucket_arn,
                                f"{self.s3_bucket.bucket_arn}/*"
                            ]
                        )
                    ]
                ),
                "DynamoDBAccess": iam.PolicyDocument(
                    statements=[
                        iam.PolicyStatement(
                            effect=iam.Effect.ALLOW,
                            actions=[
                                "dynamodb:GetItem",
                                "dynamodb:PutItem",
                                "dynamodb:UpdateItem",
                                "dynamodb:DeleteItem",
                                "dynamodb:Query",
                                "dynamodb:Scan"
                            ],
                            resources=[self.dynamodb_table.table_arn]
                        )
                    ]
                )
            }
        )

        # Create Instance Profile for EC2 Role
        self.ec2_instance_profile = iam.InstanceProfile(
            self, f"TapEC2InstanceProfile-{self.environment_suffix}",
            role=self.ec2_role
        )

        # Create Launch Template for Auto Scaling Group
        self.launch_template = ec2.LaunchTemplate(
            self, f"TapLaunchTemplate-{self.environment_suffix}",
            instance_type=ec2.InstanceType.of(
                ec2.InstanceClass.BURSTABLE3,
                ec2.InstanceSize.MICRO
            ),
            machine_image=ec2.AmazonLinuxImage(
                generation=ec2.AmazonLinuxGeneration.AMAZON_LINUX_2
            ),
            security_group=self.security_group,
            role=self.ec2_role,
            user_data=ec2.UserData.for_linux()
        )

        # Add user data to install web server
        self.launch_template.user_data.add_commands(
            "yum update -y",
            "yum install -y httpd",
            "systemctl start httpd",
            "systemctl enable httpd",
            "echo '<h1>TAP Web Application</h1>' > /var/www/html/index.html",
            f"echo '<p>Environment: {self.environment_suffix}</p>' >> /var/www/html/index.html"
        )

        # Create Auto Scaling Group
        self.auto_scaling_group = autoscaling.AutoScalingGroup(
            self, f"TapAutoScalingGroup-{self.environment_suffix}",
            vpc=self.vpc,
            launch_template=self.launch_template,
            min_capacity=2,
            max_capacity=5,
            desired_capacity=2,
            vpc_subnets=ec2.SubnetSelection(
                subnet_type=ec2.SubnetType.PUBLIC
            )
        )

        # Create Classic Load Balancer
        self.load_balancer = elb.LoadBalancer(
            self, f"TapLoadBalancer-{self.environment_suffix}",
            vpc=self.vpc,
            internet_facing=True,
            listeners=[
                elb.LoadBalancerListener(
                    external_port=80,
                    internal_port=80,
                    external_protocol=elb.LoadBalancingProtocol.HTTP,
                    internal_protocol=elb.LoadBalancingProtocol.HTTP
                )
            ],
            health_check=elb.HealthCheck(
                port=80,
                protocol=elb.LoadBalancingProtocol.HTTP,
                path="/",
                healthy_threshold=2,
                unhealthy_threshold=5,
                interval=Duration.seconds(30),
                timeout=Duration.seconds(5)
            ),
            targets=[self.auto_scaling_group]
        )

        # Create CloudFront Distribution
        self.cloudfront_distribution = cloudfront.Distribution(
            self, f"TapCloudFrontDistribution-{self.environment_suffix}",
            default_behavior=cloudfront.BehaviorOptions(
                origin=origins.S3BucketOrigin(self.s3_bucket),
                viewer_protocol_policy=cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS
            ),
            price_class=cloudfront.PriceClass.PRICE_CLASS_100
        )

        # Create CloudWatch Log Group
        self.log_group = logs.LogGroup(
            self, f"TapLogGroup-{self.environment_suffix}",
            log_group_name=f"/aws/tap-stack-{self.environment_suffix}",
            retention=logs.RetentionDays.ONE_MONTH,
            removal_policy=RemovalPolicy.DESTROY
        )

        # Create CloudWatch Alarm
        self.cpu_alarm = cloudwatch.Alarm(
            self, f"TapCPUAlarm-{self.environment_suffix}",
            metric=cloudwatch.Metric(
                namespace="AWS/EC2",
                metric_name="CPUUtilization",
                dimensions_map={
                    "AutoScalingGroupName": self.auto_scaling_group.auto_scaling_group_name
                },
                statistic="Average",
                period=Duration.minutes(5)
            ),
            threshold=80,
            evaluation_periods=2,
            datapoints_to_alarm=2,
            treat_missing_data=cloudwatch.TreatMissingData.NOT_BREACHING
        )

        # Create Outputs
        CfnOutput(
            self, "VPCId", 
            value=self.vpc.vpc_id,
            description="VPC ID for the TAP application",
            export_name=f"TapVPCId-{self.environment_suffix}"
        )
        
        CfnOutput(
            self, "S3BucketName", 
            value=self.s3_bucket.bucket_name,
            description="S3 bucket name for static content",
            export_name=f"TapS3BucketName-{self.environment_suffix}"
        )
        
        CfnOutput(
            self, "DynamoDBTableName", 
            value=self.dynamodb_table.table_name,
            description="DynamoDB table name for session management",
            export_name=f"TapDynamoDBTableName-{self.environment_suffix}"
        )
        
        CfnOutput(
            self, "CloudFrontDistributionDomain", 
            value=self.cloudfront_distribution.distribution_domain_name,
            description="CloudFront distribution domain name",
            export_name=f"TapCloudFrontDomain-{self.environment_suffix}"
        )
        
        CfnOutput(
            self, "LoadBalancerDNS", 
            value=self.load_balancer.load_balancer_dns_name,
            description="Load Balancer DNS name",
            export_name=f"TapLoadBalancerDNS-{self.environment_suffix}"
        )
