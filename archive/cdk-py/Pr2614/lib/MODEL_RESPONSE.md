``````python
# config/config.py
from typing import Dict, List

class InfraConfig:
    # Network Configuration
    VPC_CIDR = "10.0.0.0/16"
    BACKUP_VPC_CIDR = "192.168.0.0/16"
    
    # Availability Zones
    AVAILABILITY_ZONES = ["us-east-1a", "us-east-1b"]
    
    # Subnet Configuration
    PUBLIC_SUBNET_CIDRS = ["10.0.1.0/24", "10.0.2.0/24"]
    PRIVATE_SUBNET_CIDRS = ["10.0.3.0/24", "10.0.4.0/24"]
    
    # Security Configuration
    ALLOWED_SSH_IPS = ["203.0.113.0/32"]  # Replace with your IP
    
    # Application Configuration
    DOMAINS = ["example.com", "api.example.com", "admin.example.com"]
    
    # Database Configuration
    DB_NAME = "production_db"
    DB_USERNAME = "admin"
    
    # Tags
    COMMON_TAGS = {
        "Environment": "Production",
        "Project": "Migration"
    }
    
    # Region
    REGION = "us-east-1"

# app.py
#!/usr/bin/env python3
import aws_cdk as cdk
from stacks.network_stack import NetworkStack
from stacks.security_stack import SecurityStack
from stacks.compute_stack import ComputeStack
from stacks.database_stack import DatabaseStack
from stacks.storage_stack import StorageStack
from stacks.serverless_stack import ServerlessStack
from stacks.monitoring_stack import MonitoringStack
from config.config import InfraConfig

app = cdk.App()

# Environment configuration
env = cdk.Environment(region=InfraConfig.REGION)

# Network Foundation
network_stack = NetworkStack(
    app, "NetworkStack",
    env=env,
    tags=InfraConfig.COMMON_TAGS
)

# Security Layer
security_stack = SecurityStack(
    app, "SecurityStack",
    vpc=network_stack.vpc,
    env=env,
    tags=InfraConfig.COMMON_TAGS
)

# Database Layer
database_stack = DatabaseStack(
    app, "DatabaseStack",
    vpc=network_stack.vpc,
    security_groups=security_stack.security_groups,
    kms_key=security_stack.kms_key,
    env=env,
    tags=InfraConfig.COMMON_TAGS
)

# Storage Layer
storage_stack = StorageStack(
    app, "StorageStack",
    kms_key=security_stack.kms_key,
    env=env,
    tags=InfraConfig.COMMON_TAGS
)

# Compute Layer
compute_stack = ComputeStack(
    app, "ComputeStack",
    vpc=network_stack.vpc,
    security_groups=security_stack.security_groups,
    s3_bucket=storage_stack.assets_bucket,
    env=env,
    tags=InfraConfig.COMMON_TAGS
)

# Serverless Layer
serverless_stack = ServerlessStack(
    app, "ServerlessStack",
    vpc=network_stack.vpc,
    s3_bucket=storage_stack.assets_bucket,
    dynamodb_table=database_stack.dynamodb_table,
    security_groups=security_stack.security_groups,
    env=env,
    tags=InfraConfig.COMMON_TAGS
)

# Monitoring Layer
monitoring_stack = MonitoringStack(
    app, "MonitoringStack",
    vpc=network_stack.vpc,
    alb=compute_stack.alb,
    asg=compute_stack.asg,
    rds_instance=database_stack.rds_instance,
    dynamodb_table=database_stack.dynamodb_table,
    lambda_functions=serverless_stack.lambda_functions,
    env=env,
    tags=InfraConfig.COMMON_TAGS
)

app.synth()

# stacks/network_stack.py
from aws_cdk import (
    Stack,
    aws_ec2 as ec2,
    aws_logs as logs,
    CfnOutput
)
from constructs import Construct
from config.config import InfraConfig

class NetworkStack(Stack):
    def __init__(self, scope: Construct, construct_id: str, **kwargs) -> None:
        super().__init__(scope, construct_id, **kwargs)
        
        # Create VPC
        self.vpc = ec2.Vpc(
            self, "vpc-prod-main",
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
        flow_log_role = ec2.FlowLogResourceType.from_network_interface_id(
            self.vpc.vpc_id
        )
        
        log_group = logs.LogGroup(
            self, "vpc-flow-logs",
            log_group_name="/aws/vpc/flowlogs",
            retention=logs.RetentionDays.ONE_MONTH
        )
        
        ec2.FlowLog(
            self, "VpcFlowLog",
            resource_type=ec2.FlowLogResourceType.from_vpc(self.vpc),
            destination=ec2.FlowLogDestination.to_cloud_watch_logs(log_group)
        )
        
        # Outputs
        CfnOutput(
            self, "VpcId",
            value=self.vpc.vpc_id,
            description="VPC ID"
        )
        
        CfnOutput(
            self, "PublicSubnetIds",
            value=",".join([subnet.subnet_id for subnet in self.vpc.public_subnets]),
            description="Public Subnet IDs"
        )
        
        CfnOutput(
            self, "PrivateSubnetIds",
            value=",".join([subnet.subnet_id for subnet in self.vpc.private_subnets]),
            description="Private Subnet IDs"
        )

# stacks/security_stack.py
from aws_cdk import (
    Stack,
    aws_ec2 as ec2,
    aws_iam as iam,
    aws_kms as kms,
    aws_wafv2 as waf,
    CfnOutput
)
from constructs import Construct
from config.config import InfraConfig

class SecurityStack(Stack):
    def __init__(self, scope: Construct, construct_id: str, vpc: ec2.Vpc, **kwargs) -> None:
        super().__init__(scope, construct_id, **kwargs)
        
        self.vpc = vpc
        
        # KMS Key for encryption
        self.kms_key = kms.Key(
            self, "kms-prod-main",
            description="Production KMS key for encryption",
            enable_key_rotation=True
        )
        
        # Security Groups
        self.security_groups = self._create_security_groups()
        
        # WAF Web ACL
        self.web_acl = self._create_waf()
        
        # IAM Roles
        self.iam_roles = self._create_iam_roles()
        
    def _create_security_groups(self):
        # Web Security Group
        web_sg = ec2.SecurityGroup(
            self, "sg-prod-web",
            vpc=self.vpc,
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
        
        # SSH Security Group
        ssh_sg = ec2.SecurityGroup(
            self, "sg-prod-ssh",
            vpc=self.vpc,
            description="Security group for SSH access",
            allow_all_outbound=False
        )
        
        for ip in InfraConfig.ALLOWED_SSH_IPS:
            ssh_sg.add_ingress_rule(
                ec2.Peer.ipv4(ip),
                ec2.Port.tcp(22),
                f"Allow SSH from {ip}"
            )
        
        # Database Security Group
        db_sg = ec2.SecurityGroup(
            self, "sg-prod-db",
            vpc=self.vpc,
            description="Security group for databases",
            allow_all_outbound=False
        )
        
        db_sg.add_ingress_rule(
            web_sg,
            ec2.Port.tcp(3306),
            "Allow MySQL from web servers"
        )
        
        # Lambda Security Group
        lambda_sg = ec2.SecurityGroup(
            self, "sg-prod-lambda",
            vpc=self.vpc,
            description="Security group for Lambda functions",
            allow_all_outbound=True
        )
        
        return {
            "web": web_sg,
            "ssh": ssh_sg,
            "database": db_sg,
            "lambda": lambda_sg
        }
    
    def _create_waf(self):
        return waf.CfnWebACL(
            self, "waf-prod-main",
            scope="CLOUDFRONT",
            default_action=waf.CfnWebACL.DefaultActionProperty(allow={}),
            rules=[
                waf.CfnWebACL.RuleProperty(
                    name="AWSManagedRulesCommonRuleSet",
                    priority=1,
                    override_action=waf.CfnWebACL.OverrideActionProperty(none={}),
                    statement=waf.CfnWebACL.StatementProperty(
                        managed_rule_group_statement=waf.CfnWebACL.ManagedRuleGroupStatementProperty(
                            vendor_name="AWS",
                            name="AWSManagedRulesCommonRuleSet"
                        )
                    ),
                    visibility_config=waf.CfnWebACL.VisibilityConfigProperty(
                        cloud_watch_metrics_enabled=True,
                        metric_name="CommonRuleSetMetric",
                        sampled_requests_enabled=True
                    )
                )
            ],
            visibility_config=waf.CfnWebACL.VisibilityConfigProperty(
                cloud_watch_metrics_enabled=True,
                metric_name="webACL",
                sampled_requests_enabled=True
            )
        )
    
    def _create_iam_roles(self):
        # EC2 Instance Role
        ec2_role = iam.Role(
            self, "role-prod-ec2",
            assumed_by=iam.ServicePrincipal("ec2.amazonaws.com"),
            managed_policies=[
                iam.ManagedPolicy.from_aws_managed_policy_name("CloudWatchAgentServerPolicy"),
                iam.ManagedPolicy.from_aws_managed_policy_name("AmazonSSMManagedInstanceCore")
            ]
        )
        
        # Lambda Execution Role
        lambda_role = iam.Role(
            self, "role-prod-lambda",
            assumed_by=iam.ServicePrincipal("lambda.amazonaws.com"),
            managed_policies=[
                iam.ManagedPolicy.from_aws_managed_policy_name("service-role/AWSLambdaVPCAccessExecutionRole")
            ]
        )
        
        return {
            "ec2": ec2_role,
            "lambda": lambda_role
        }
        
        # Outputs
        CfnOutput(
            self, "KmsKeyId",
            value=self.kms_key.key_id,
            description="KMS Key ID"
        )

# stacks/database_stack.py
from aws_cdk import (
    Stack,
    aws_rds as rds,
    aws_dynamodb as dynamodb,
    aws_ec2 as ec2,
    aws_kms as kms,
    Duration,
    CfnOutput
)
from constructs import Construct
from config.config import InfraConfig

class DatabaseStack(Stack):
    def __init__(self, scope: Construct, construct_id: str, vpc: ec2.Vpc, 
                 security_groups: dict, kms_key: kms.Key, **kwargs) -> None:
        super().__init__(scope, construct_id, **kwargs)
        
        # RDS Instance
        self.rds_instance = rds.DatabaseInstance(
            self, "rds-prod-main",
            engine=rds.DatabaseInstanceEngine.mysql(
                version=rds.MysqlEngineVersion.VER_8_0_35
            ),
            instance_type=ec2.InstanceType.of(
                ec2.InstanceClass.BURSTABLE3,
                ec2.InstanceSize.MEDIUM
            ),
            vpc=vpc,
            vpc_subnets=ec2.SubnetSelection(
                subnet_type=ec2.SubnetType.PRIVATE_WITH_EGRESS
            ),
            security_groups=[security_groups["database"]],
            database_name=InfraConfig.DB_NAME,
            credentials=rds.Credentials.from_generated_secret(
                InfraConfig.DB_USERNAME,
                secret_name="rds-prod-credentials"
            ),
            multi_az=True,
            storage_encrypted=True,
            storage_encryption_key=kms_key,
            backup_retention=Duration.days(7),
            deletion_protection=True,
            delete_automated_backups=False,
            monitoring_interval=Duration.seconds(60),
            enable_performance_insights=True,
            performance_insight_retention=rds.PerformanceInsightRetention.DEFAULT,
            cloudwatch_logs_exports=["error", "general", "slow-query"]
        )
        
        # DynamoDB Table
        self.dynamodb_table = dynamodb.Table(
            self, "dynamodb-prod-main",
            table_name="prod-application-data",
            partition_key=dynamodb.Attribute(
                name="id",
                type=dynamodb.AttributeType.STRING
            ),
            sort_key=dynamodb.Attribute(
                name="timestamp",
                type=dynamodb.AttributeType.NUMBER
            ),
            billing_mode=dynamodb.BillingMode.ON_DEMAND,
            encryption=dynamodb.TableEncryption.CUSTOMER_MANAGED,
            encryption_key=kms_key,
            point_in_time_recovery=True,
            stream=dynamodb.StreamViewType.NEW_AND_OLD_IMAGES,
            removal_policy=cdk.RemovalPolicy.RETAIN
        )
        
        # Global Secondary Index
        self.dynamodb_table.add_global_secondary_index(
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
        
        # Outputs
        CfnOutput(
            self, "RdsEndpoint",
            value=self.rds_instance.instance_endpoint.hostname,
            description="RDS Instance Endpoint"
        )
        
        CfnOutput(
            self, "DynamoDbTableName",
            value=self.dynamodb_table.table_name,
            description="DynamoDB Table Name"
        )

# stacks/storage_stack.py
from aws_cdk import (
    Stack,
    aws_s3 as s3,
    aws_cloudfront as cloudfront,
    aws_cloudfront_origins as origins,
    aws_kms as kms,
    RemovalPolicy,
    CfnOutput
)
from constructs import Construct

class StorageStack(Stack):
    def __init__(self, scope: Construct, construct_id: str, kms_key: kms.Key, **kwargs) -> None:
        super().__init__(scope, construct_id, **kwargs)
        
        # S3 Bucket for static assets
        self.assets_bucket = s3.Bucket(
            self, "bucket-prod-assets",
            bucket_name=f"bucket-prod-assets-{self.account}-{self.region}",
            versioned=True,
            encryption=s3.BucketEncryption.KMS,
            encryption_key=kms_key,
            block_public_access=s3.BlockPublicAccess.BLOCK_ALL,
            removal_policy=RemovalPolicy.RETAIN,
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
                        ),
                        s3.Transition(
                            storage_class=s3.StorageClass.GLACIER,
                            transition_after=Duration.days(90)
                        )
                    ]
                )
            ]
        )
        
        # S3 Bucket for application logs
        self.logs_bucket = s3.Bucket(
            self, "bucket-prod-logs",
            bucket_name=f"bucket-prod-logs-{self.account}-{self.region}",
            encryption=s3.BucketEncryption.KMS,
            encryption_key=kms_key,
            block_public_access=s3.BlockPublicAccess.BLOCK_ALL,
            removal_policy=RemovalPolicy.RETAIN
        )
        
        # Origin Access Identity for CloudFront
        oai = cloudfront.OriginAccessIdentity(
            self, "cloudfront-oai",
            comment="OAI for production assets"
        )
        
        # Grant CloudFront access to S3 bucket
        self.assets_bucket.grant_read(oai)
        
        # CloudFront Distribution
        self.distribution = cloudfront.Distribution(
            self, "cloudfront-prod-main",
            default_behavior=cloudfront.BehaviorOptions(
                origin=origins.S3Origin(
                    self.assets_bucket,
                    origin_access_identity=oai
                ),
                viewer_protocol_policy=cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
                cache_policy=cloudfront.CachePolicy.CACHING_OPTIMIZED,
                compress=True
            ),
            additional_behaviors={
                "/api/*": cloudfront.BehaviorOptions(
                    origin=origins.HttpOrigin("api.example.com"),
                    cache_policy=cloudfront.CachePolicy.CACHING_DISABLED,
                    viewer_protocol_policy=cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS
                )
            },
            price_class=cloudfront.PriceClass.PRICE_CLASS_100,
            enabled=True,
            comment="Production CloudFront Distribution"
        )
        
        # Outputs
        CfnOutput(
            self, "AssetsBucketName",
            value=self.assets_bucket.bucket_name,
            description="S3 Assets Bucket Name"
        )
        
        CfnOutput(
            self, "CloudFrontDomainName",
            value=self.distribution.distribution_domain_name,
            description="CloudFront Distribution Domain Name"
        )

# stacks/compute_stack.py
from aws_cdk import (
    Stack,
    aws_ec2 as ec2,
    aws_elasticloadbalancingv2 as elbv2,
    aws_autoscaling as autoscaling,
    aws_elasticbeanstalk as elasticbeanstalk,
    aws_iam as iam,
    aws_s3 as s3,
    CfnOutput
)
from constructs import Construct
from config.config import InfraConfig

class ComputeStack(Stack):
    def __init__(self, scope: Construct, construct_id: str, vpc: ec2.Vpc, 
                 security_groups: dict, s3_bucket: s3.Bucket, **kwargs) -> None:
        super().__init__(scope, construct_id, **kwargs)
        
        # Application Load Balancer
        self.alb = elbv2.ApplicationLoadBalancer(
            self, "alb-prod-main",
            vpc=vpc,
            internet_facing=True,
            security_group=security_groups["web"]
        )
        
        # Target Group
        target_group = elbv2.ApplicationTargetGroup(
            self, "tg-prod-web",
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
        
        # ALB Listener with host-based routing
        listener = self.alb.add_listener(
            "alb-listener-443",
            port=443,
            protocol=elbv2.ApplicationProtocol.HTTPS,
            certificates=[
                # Add your SSL certificate here
                # elbv2.ListenerCertificate.from_arn("certificate-arn")
            ],
            default_action=elbv2.ListenerAction.fixed_response(
                status_code=404,
                content_type="text/plain",
                message_body="Not Found"
            )
        )
        
        # Host-based routing rules
        for domain in InfraConfig.DOMAINS:
            listener.add_action(
                f"action-{domain.replace('.', '-')}",
                conditions=[
                    elbv2.ListenerCondition.host_headers([domain])
                ],
                action=elbv2.ListenerAction.forward([target_group])
            )
        
        # Launch Template
        launch_template = ec2.LaunchTemplate(
            self, "lt-prod-web",
            instance_type=ec2.InstanceType.of(
                ec2.InstanceClass.T3,
                ec2.InstanceSize.MEDIUM
            ),
            machine_image=ec2.MachineImage.latest_amazon_linux2(),
            security_group=security_groups["web"],
            user_data=ec2.UserData.for_linux(),
            role=iam.Role(
                self, "ec2-instance-role",
                assumed_by=iam.ServicePrincipal("ec2.amazonaws.com"),
                managed_policies=[
                    iam.ManagedPolicy.from_aws_managed_policy_name("CloudWatchAgentServerPolicy"),
                    iam.ManagedPolicy.from_aws_managed_policy_name("AmazonSSMManagedInstanceCore")
                ]
            )
        )
        
        # Add user data script
        launch_template.add_user_data(
            "#!/bin/bash",
            "yum update -y",
            "yum install -y amazon-cloudwatch-agent",
            "yum install -y httpd",
            "systemctl start httpd",
            "systemctl enable httpd",
            "echo '<h1>Production Web Server</h1>' > /var/www/html/index.html",
            "echo 'OK' > /var/www/html/health"
        )
        
        # Auto Scaling Group
        self.asg = autoscaling.AutoScalingGroup(
            self, "asg-prod-web",
            vpc=vpc,
            vpc_subnets=ec2.SubnetSelection(
                subnet_type=ec2.SubnetType.PRIVATE_WITH_EGRESS
            ),
            launch_template=launch_template,
            min_capacity=2,
            max_capacity=10,
            desired_capacity=2,
            health_check=autoscaling.HealthCheck.elb(
                grace=Duration.minutes(5)
            )
        )
        
        # Attach ASG to Target Group
        self.asg.attach_to_application_target_group(target_group)
        
        # Auto Scaling Policies
        self.asg.scale_on_cpu_utilization(
            "cpu-scaling",
            target_utilization_percent=70,
            scale_in_cooldown=Duration.minutes(5),
            scale_out_cooldown=Duration.minutes(5)
        )
        
        # Elastic Beanstalk Application
        eb_app = elasticbeanstalk.CfnApplication(
            self, "eb-prod-app",
            application_name="prod-web-application"
        )
        
        # Elastic Beanstalk Environment
        eb_env = elasticbeanstalk.CfnEnvironment(
            self, "eb-prod-env",
            application_name=eb_app.application_name,
            environment_name="production",
            solution_stack_name="64bit Amazon Linux 2 v5.8.0 running Node.js 18",
            option_settings=[
                elasticbeanstalk.CfnEnvironment.OptionSettingProperty(
                    namespace="aws:autoscaling:launchconfiguration",
                    option_name="InstanceType",
                    value="t3.medium"
                ),
                elasticbeanstalk.CfnEnvironment.OptionSettingProperty(
                    namespace="aws:ec2:vpc",
                    option_name="VPCId",
                    value=vpc.vpc_id
                ),
                elasticbeanstalk.CfnEnvironment.OptionSettingProperty(
                    namespace="aws:ec2:vpc",
                    option_name="Subnets",
                    value=",".join([subnet.subnet_id for subnet in vpc.private_subnets])
                )
            ]
        )
        
        # Outputs
        CfnOutput(
            self, "LoadBalancerDNS",
            value=self.alb.load_balancer_dns_name,
            description="Application Load Balancer DNS Name"
        )
        
        CfnOutput(
            self, "AutoScalingGroupName",
            value=self.asg.auto_scaling_group_name,
            description="Auto Scaling Group Name"
        )

# stacks/serverless_stack.py
from aws_cdk import (
    Stack,
    aws_lambda as _lambda,
    aws_lambda_event_sources as lambda_event_sources,
    aws_s3 as s3,
    aws_dynamodb as dynamodb,
    aws_ec2 as ec2,
    aws_logs as logs,
    Duration,
    CfnOutput
)
from constructs import Construct

class ServerlessStack(Stack):
    def __init__(self, scope: Construct, construct_id: str, vpc: ec2.Vpc,
                 s3_bucket: s3.Bucket, dynamodb_table: dynamodb.Table,
                 security_groups: dict, **kwargs) -> None:
        super().__init__(scope, construct_id, **kwargs)
        
        self.lambda_functions = {}
        
        # S3 Event Processing Lambda
        self.lambda_functions['s3_processor'] = _lambda.Function(
            self, "lambda-prod-s3-processor",
            runtime=_lambda.Runtime.PYTHON_3_11,
            handler="index.handler",
            code=_lambda.Code.from_inline("""
import json
import boto3
import logging

logger = logging.getLogger()
logger.setLevel(logging.INFO)

def handler(event, context):
    try:
        for record in event['Records']:
            bucket = record['s3']['bucket']['name']
            key = record['s3']['object']['key']
            
            logger.info(f'Processing file: {key} from bucket: {bucket}')
            
            # Add your file processing logic here
            
        return {
            'statusCode': 200,
            'body': json.dumps('Files processed successfully')
        }
    except Exception as e:
        logger.error(f'Error processing files: {str(e)}')
        raise e
            """),
            timeout=Duration.minutes(5),
            memory_size=512,
            vpc=vpc,
            vpc_subnets=ec2.SubnetSelection(
                subnet_type=ec2.SubnetType.PRIVATE_WITH_EGRESS
            ),
            security_groups=[security_groups["lambda"]],
            log_retention=logs.RetentionDays.ONE_WEEK
        )
        
        # Grant S3 permissions
        s3_bucket.grant_read_write(self.lambda_functions['s3_processor'])
        
        # S3 Event Source
        self.lambda_functions['s3_processor'].add_event_source(
            lambda_event_sources.S3EventSource(
                s3_bucket,
                events=[s3.EventType.OBJECT_CREATED],
                filters=[s3.NotificationKeyFilter(prefix="uploads/")]
            )
        )
        
        # DynamoDB Stream Processing Lambda
        self.lambda_functions['dynamodb_processor'] = _lambda.Function(
            self, "lambda-prod-dynamodb-processor",
            runtime=_lambda.Runtime.PYTHON_3_11,
            handler="index.handler",
            code=_lambda.Code.from_inline("""
import json
import logging

logger = logging.getLogger()
logger.setLevel(logging.INFO)

def handler(event, context):
    try:
        for record in event['Records']:
            event_name = record['eventName']
            
            if event_name in ['INSERT', 'MODIFY', 'REMOVE']:
                logger.info(f'Processing DynamoDB {event_name} event')
                
                # Add your stream processing logic here
                
        return {
            'statusCode': 200,
            'body': json.dumps('Stream records processed successfully')
        }
    except Exception as e:
        logger.error(f'Error processing stream records: {str(e)}')
        raise e
            """),
            timeout=Duration.minutes(5),
            memory_size=256,
            vpc=vpc,
            vpc_subnets=ec2.SubnetSelection(
                subnet_type=ec2.SubnetType.

