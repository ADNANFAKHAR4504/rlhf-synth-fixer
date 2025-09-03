from typing import Optional

import aws_cdk as cdk
from aws_cdk import (
    Stack,
    Duration,
    RemovalPolicy,
    CfnOutput,
    aws_ec2 as ec2,
    aws_iam as iam,
    aws_kms as kms,
    aws_wafv2 as waf,
    aws_rds as rds,
    aws_dynamodb as dynamodb,
    aws_s3 as s3,
    aws_cloudfront as cloudfront,
    aws_cloudfront_origins as origins,
    aws_elasticloadbalancingv2 as elbv2,
    aws_autoscaling as autoscaling,
    aws_lambda as _lambda,
    aws_logs as logs,
    aws_cloudwatch as cloudwatch,
    aws_sns as sns,
)
from constructs import Construct


class InfraConfig:
    """Configuration class for infrastructure settings"""
    # Network Configuration
    VPC_CIDR = "10.0.0.0/16"
    
    # Security Configuration
    ALLOWED_SSH_IPS = ["203.0.113.0/32"]  # Replace with your IP
    
    # Application Configuration
    DOMAINS = ["example.com", "api.example.com", "admin.example.com"]
    
    # Database Configuration
    DB_NAME = "production_db"
    DB_USERNAME = "admin"


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
    
    This is a simplified, monolithic stack that creates all resources directly
    to avoid circular dependency issues with nested stacks.
    """

    def __init__(
            self,
            scope: Construct,
            construct_id: str, 
            props: Optional[TapStackProps] = None, 
            **kwargs):
        # Pass the env from props to super().__init__
        if props:
            super().__init__(scope, construct_id, env=props.env, **kwargs)
        else:
            super().__init__(scope, construct_id, **kwargs)

        # Get environment suffix from props, context, or use 'dev' as default
        environment_suffix = (
            props.environment_suffix if props else None
        ) or self.node.try_get_context('environmentSuffix') or 'dev'

        # Apply common tags
        cdk.Tags.of(self).add("Environment", environment_suffix.capitalize())
        cdk.Tags.of(self).add("Project", "TAP")
        cdk.Tags.of(self).add("ManagedBy", "CDK")

        # ==========================================
        # NETWORK RESOURCES
        # ==========================================
        
        # Create VPC
        vpc = ec2.Vpc(
            self, f"vpc-{environment_suffix}-main",
            ip_addresses=ec2.IpAddresses.cidr(InfraConfig.VPC_CIDR),
            max_azs=2,
            nat_gateways=2,
            subnet_configuration=[
                ec2.SubnetConfiguration(
                    name="public-subnet",
                    subnet_type=ec2.SubnetType.PUBLIC,
                    cidr_mask=24
                ),
                ec2.SubnetConfiguration(
                    name="private-subnet",
                    subnet_type=ec2.SubnetType.PRIVATE_WITH_EGRESS,
                    cidr_mask=24
                )
            ],
            enable_dns_hostnames=True,
            enable_dns_support=True
        )
        
        # VPC Flow Logs
        flow_logs_group = logs.LogGroup(
            self, f"vpc-flow-logs-{environment_suffix}",
            retention=logs.RetentionDays.ONE_MONTH
        )
        
        ec2.FlowLog(
            self, f"VpcFlowLog-{environment_suffix}",
            resource_type=ec2.FlowLogResourceType.from_vpc(vpc),
            destination=ec2.FlowLogDestination.to_cloud_watch_logs(flow_logs_group)
        )

        # ==========================================
        # SECURITY RESOURCES
        # ==========================================
        
        # KMS Key for encryption
        kms_key = kms.Key(
            self, f"kms-{environment_suffix}-main",
            description=f"{environment_suffix.capitalize()} KMS key for encryption",
            enable_key_rotation=True
        )
        
        # Security Groups
        web_sg = ec2.SecurityGroup(
            self, f"sg-{environment_suffix}-web",
            vpc=vpc,
            description="Security group for web servers",
            allow_all_outbound=True
        )
        
        web_sg.add_ingress_rule(
            ec2.Peer.any_ipv4(),
            ec2.Port.tcp(80),
            "Allow HTTP traffic"
        )
        
        web_sg.add_ingress_rule(
            ec2.Peer.any_ipv4(),
            ec2.Port.tcp(443),
            "Allow HTTPS traffic"
        )
        
        db_sg = ec2.SecurityGroup(
            self, f"sg-{environment_suffix}-db",
            vpc=vpc,
            description="Security group for databases",
            allow_all_outbound=False
        )
        
        db_sg.add_ingress_rule(
            web_sg,
            ec2.Port.tcp(3306),
            "Allow MySQL from web servers"
        )
        
        lambda_sg = ec2.SecurityGroup(
            self, f"sg-{environment_suffix}-lambda",
            vpc=vpc,
            description="Security group for Lambda functions",
            allow_all_outbound=True
        )

        # ==========================================
        # DATABASE RESOURCES
        # ==========================================
        
        # RDS Instance
        rds_instance = rds.DatabaseInstance(
            self, f"rds-{environment_suffix}-main",
            engine=rds.DatabaseInstanceEngine.mysql(
                version=rds.MysqlEngineVersion.VER_8_0
            ),
            instance_type=ec2.InstanceType.of(
                ec2.InstanceClass.BURSTABLE3,
                ec2.InstanceSize.MEDIUM
            ),
            vpc=vpc,
            vpc_subnets=ec2.SubnetSelection(
                subnet_type=ec2.SubnetType.PRIVATE_WITH_EGRESS
            ),
            security_groups=[db_sg],
            database_name=InfraConfig.DB_NAME,
            credentials=rds.Credentials.from_generated_secret(
                InfraConfig.DB_USERNAME,
                secret_name=f"rds-{environment_suffix}-credentials"
            ),
            multi_az=True,
            storage_encrypted=True,
            storage_encryption_key=kms_key,
            backup_retention=Duration.days(7),
            deletion_protection=True if environment_suffix == "prod" else False,
            delete_automated_backups=False,
            monitoring_interval=Duration.seconds(60),
            enable_performance_insights=True,
            performance_insight_retention=rds.PerformanceInsightRetention.DEFAULT,
            cloudwatch_logs_exports=["error", "general", "slowquery"]
        )
        
        # DynamoDB Table
        dynamodb_table = dynamodb.Table(
            self, f"dynamodb-{environment_suffix}-main",
            table_name=f"{environment_suffix}-application-data",
            partition_key=dynamodb.Attribute(
                name="id",
                type=dynamodb.AttributeType.STRING
            ),
            sort_key=dynamodb.Attribute(
                name="timestamp",
                type=dynamodb.AttributeType.NUMBER
            ),
            billing_mode=dynamodb.BillingMode.PAY_PER_REQUEST,
            encryption=dynamodb.TableEncryption.CUSTOMER_MANAGED,
            encryption_key=kms_key,
            point_in_time_recovery=True,
            stream=dynamodb.StreamViewType.NEW_AND_OLD_IMAGES,
            removal_policy=RemovalPolicy.RETAIN if environment_suffix == "prod" else RemovalPolicy.DESTROY
        )
        
        # Global Secondary Index
        dynamodb_table.add_global_secondary_index(
            index_name="GSI1",
            partition_key=dynamodb.Attribute(
                name="type",
                type=dynamodb.AttributeType.STRING
            ),
            sort_key=dynamodb.Attribute(
                name="created_at",
                type=dynamodb.AttributeType.NUMBER
            )
        )

        # ==========================================
        # STORAGE RESOURCES
        # ==========================================
        
        # S3 Bucket for static assets
        assets_bucket = s3.Bucket(
            self, f"bucket-{environment_suffix}-assets",
            bucket_name=f"tap-{environment_suffix}-assets-{self.account}",
            versioned=True,
            encryption=s3.BucketEncryption.KMS,
            encryption_key=kms_key,
            block_public_access=s3.BlockPublicAccess.BLOCK_ALL,
            removal_policy=RemovalPolicy.RETAIN if environment_suffix == "prod" else RemovalPolicy.DESTROY,
            lifecycle_rules=[
                s3.LifecycleRule(
                    id="DeleteIncompleteMultipartUploads",
                    abort_incomplete_multipart_upload_after=Duration.days(7)
                ),
                s3.LifecycleRule(
                    id="TransitionToIA",
                    transitions=[
                        s3.Transition(
                            storage_class=s3.StorageClass.INFREQUENT_ACCESS,
                            transition_after=Duration.days(30)
                        )
                    ]
                )
            ]
        )
        
        # S3 Bucket for application logs
        logs_bucket = s3.Bucket(
            self, f"bucket-{environment_suffix}-logs",
            bucket_name=f"tap-{environment_suffix}-logs-{self.account}",
            encryption=s3.BucketEncryption.KMS,
            encryption_key=kms_key,
            block_public_access=s3.BlockPublicAccess.BLOCK_ALL,
            removal_policy=RemovalPolicy.RETAIN if environment_suffix == "prod" else RemovalPolicy.DESTROY
        )
        
        # CloudFront Distribution
        oai = cloudfront.OriginAccessIdentity(
            self, f"cloudfront-oai-{environment_suffix}",
            comment=f"OAI for {environment_suffix} assets"
        )
        
        assets_bucket.grant_read(oai)
        
        distribution = cloudfront.Distribution(
            self, f"cloudfront-{environment_suffix}-main",
            default_behavior=cloudfront.BehaviorOptions(
                origin=origins.S3Origin(
                    assets_bucket,
                    origin_access_identity=oai
                ),
                viewer_protocol_policy=cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
                cache_policy=cloudfront.CachePolicy.CACHING_OPTIMIZED,
                compress=True
            ),
            price_class=cloudfront.PriceClass.PRICE_CLASS_100,
            enabled=True,
            comment=f"{environment_suffix.capitalize()} CloudFront Distribution"
        )

        # ==========================================
        # COMPUTE RESOURCES
        # ==========================================
        
        # Application Load Balancer
        alb = elbv2.ApplicationLoadBalancer(
            self, f"alb-{environment_suffix}-main",
            vpc=vpc,
            internet_facing=True,
            security_group=web_sg
        )
        
        # Target Group
        target_group = elbv2.ApplicationTargetGroup(
            self, f"tg-{environment_suffix}-web",
            vpc=vpc,
            port=80,
            protocol=elbv2.ApplicationProtocol.HTTP,
            target_type=elbv2.TargetType.INSTANCE,
            health_check=elbv2.HealthCheck(
                path="/health",
                healthy_http_codes="200",
                interval=Duration.seconds(30)
            )
        )
        
        # ALB Listener
        listener = alb.add_listener(
            f"alb-listener-80-{environment_suffix}",
            port=80,
            protocol=elbv2.ApplicationProtocol.HTTP,
            default_action=elbv2.ListenerAction.forward([target_group])
        )
        
        # Launch Template
        user_data = ec2.UserData.for_linux()
        user_data.add_commands(
            "yum update -y",
            "yum install -y amazon-cloudwatch-agent",
            "yum install -y httpd",
            "systemctl start httpd",
            "systemctl enable httpd",
            f"echo '<h1>{environment_suffix.capitalize()} Web Server</h1>' > /var/www/html/index.html",
            "echo 'OK' > /var/www/html/health"
        )
        
        launch_template = ec2.LaunchTemplate(
            self, f"lt-{environment_suffix}-web",
            instance_type=ec2.InstanceType.of(
                ec2.InstanceClass.T3,
                ec2.InstanceSize.MEDIUM
            ),
            machine_image=ec2.MachineImage.latest_amazon_linux2(),
            security_group=web_sg,
            user_data=user_data,
            role=iam.Role(
                self, f"ec2-instance-role-{environment_suffix}",
                assumed_by=iam.ServicePrincipal("ec2.amazonaws.com"),
                managed_policies=[
                    iam.ManagedPolicy.from_aws_managed_policy_name("CloudWatchAgentServerPolicy"),
                    iam.ManagedPolicy.from_aws_managed_policy_name("AmazonSSMManagedInstanceCore")
                ]
            )
        )
        
        # Auto Scaling Group
        asg = autoscaling.AutoScalingGroup(
            self, f"asg-{environment_suffix}-web",
            vpc=vpc,
            vpc_subnets=ec2.SubnetSelection(
                subnet_type=ec2.SubnetType.PRIVATE_WITH_EGRESS
            ),
            launch_template=launch_template,
            min_capacity=2 if environment_suffix == "prod" else 1,
            max_capacity=10 if environment_suffix == "prod" else 5,
            desired_capacity=2 if environment_suffix == "prod" else 1,
            health_check=autoscaling.HealthCheck.elb(
                grace=Duration.minutes(5)
            )
        )
        
        # Attach ASG to Target Group
        asg.attach_to_application_target_group(target_group)
        
        # Auto Scaling Policies
        asg.scale_on_cpu_utilization(
            "cpu-scaling",
            target_utilization_percent=70
        )

        # ==========================================
        # SERVERLESS RESOURCES
        # ==========================================
        
        # Simple Lambda Function
        api_lambda = _lambda.Function(
            self, f"lambda-{environment_suffix}-api",
            runtime=_lambda.Runtime.PYTHON_3_11,
            handler="index.handler",
            code=_lambda.Code.from_inline("""
import json
import logging

logger = logging.getLogger()
logger.setLevel(logging.INFO)

def handler(event, context):
    logger.info('Processing API request')
    return {
        'statusCode': 200,
        'headers': {
            'Content-Type': 'application/json'
        },
        'body': json.dumps({
            'message': 'API request processed successfully'
        })
    }
            """),
            timeout=Duration.seconds(30),
            memory_size=1024,
            vpc=vpc,
            vpc_subnets=ec2.SubnetSelection(
                subnet_type=ec2.SubnetType.PRIVATE_WITH_EGRESS
            ),
            security_groups=[lambda_sg],
            log_retention=logs.RetentionDays.ONE_WEEK
        )

        # ==========================================
        # MONITORING RESOURCES
        # ==========================================
        
        # SNS Topic for alerts
        alert_topic = sns.Topic(
            self, f"sns-{environment_suffix}-alerts",
            topic_name=f"{environment_suffix}-infrastructure-alerts",
            display_name=f"{environment_suffix.capitalize()} Infrastructure Alerts"
        )
        
        # CloudWatch Dashboard
        dashboard = cloudwatch.Dashboard(
            self, f"dashboard-{environment_suffix}-main",
            dashboard_name=f"{environment_suffix.capitalize()}-Infrastructure-Dashboard"
        )
        
        # Simple ALB metrics widget
        dashboard.add_widgets(
            cloudwatch.GraphWidget(
                title="ALB Request Count",
                left=[
                    cloudwatch.Metric(
                        namespace="AWS/ELB",
                        metric_name="RequestCount",
                        dimensions_map={
                            "LoadBalancer": alb.load_balancer_full_name
                        }
                    )
                ],
                width=12,
                height=6
            )
        )
        
        # Simple RDS CPU metric widget
        dashboard.add_widgets(
            cloudwatch.GraphWidget(
                title="RDS CPU Utilization",
                left=[
                    cloudwatch.Metric(
                        namespace="AWS/RDS",
                        metric_name="CPUUtilization",
                        dimensions_map={
                            "DBInstanceIdentifier": rds_instance.instance_identifier
                        }
                    )
                ],
                width=12,
                height=6
            )
        )

        # ==========================================
        # OUTPUTS
        # ==========================================
        
        CfnOutput(
            self, 
            "EnvironmentSuffix",
            value=environment_suffix,
            description="Environment suffix used for this deployment"
        )
        
        CfnOutput(
            self, 
            "VpcId",
            value=vpc.vpc_id,
            description="VPC ID"
        )
        
        CfnOutput(
            self, 
            "ALBDnsName",
            value=alb.load_balancer_dns_name,
            description="Application Load Balancer DNS Name"
        )
        
        CfnOutput(
            self, 
            "CloudFrontDomainName",
            value=distribution.distribution_domain_name,
            description="CloudFront Distribution Domain Name"
        )
        
        CfnOutput(
            self, 
            "RDSEndpoint",
            value=rds_instance.instance_endpoint.hostname,
            description="RDS Instance Endpoint"
        )
        
        CfnOutput(
            self, 
            "DynamoDBTableName",
            value=dynamodb_table.table_name,
            description="DynamoDB Table Name"
        )
        
        CfnOutput(
            self, 
            "AssetsBucketName",
            value=assets_bucket.bucket_name,
            description="S3 Assets Bucket Name"
        )