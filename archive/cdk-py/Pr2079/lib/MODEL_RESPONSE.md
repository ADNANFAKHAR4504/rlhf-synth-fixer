# Comprehensive Secure AWS Infrastructure with CDK Python

I'll help you create a comprehensive secure AWS environment using AWS CDK with Python. Let me organize this into multiple files for better maintainability and include all the security components you requested.

## File: lib/security_constructs.py

```python
from aws_cdk import (
    aws_s3 as s3,
    aws_s3_deployment as s3deploy,
    aws_kms as kms,
    aws_iam as iam,
    aws_ec2 as ec2,
    aws_lambda as _lambda,
    aws_logs as logs,
    aws_cloudtrail as cloudtrail,
    aws_config as config,
    aws_rds as rds,
    aws_elasticloadbalancingv2 as elbv2,
    aws_certificatemanager as acm,
    aws_apigateway as apigateway,
    aws_cloudfront as cloudfront,
    aws_wafv2 as wafv2,
    aws_securityhub as securityhub,
    aws_shield as shield,
    RemovalPolicy,
    Duration,
)
from constructs import Construct

class SecurityFoundationConstruct(Construct):
    def __init__(self, scope: Construct, id: str, **kwargs):
        super().__init__(scope, id, **kwargs)
        
        # KMS Key for encryption
        self.kms_key = kms.Key(
            self, "SecurityKey",
            description="KMS Key for security infrastructure encryption",
            enable_key_rotation=True,
            removal_policy=RemovalPolicy.DESTROY
        )
        
        # S3 Bucket with encryption and versioning
        self.secure_bucket = s3.Bucket(
            self, "SecureBucket",
            versioned=True,
            encryption=s3.BucketEncryption.KMS,
            encryption_key=self.kms_key,
            block_public_access=s3.BlockPublicAccess.BLOCK_ALL,
            enforce_ssl=True,
            server_access_logs_prefix="access-logs/",
            removal_policy=RemovalPolicy.DESTROY,
            auto_delete_objects=True
        )
        
        # CloudTrail logging bucket
        self.cloudtrail_bucket = s3.Bucket(
            self, "CloudTrailBucket",
            versioned=True,
            encryption=s3.BucketEncryption.KMS,
            encryption_key=self.kms_key,
            block_public_access=s3.BlockPublicAccess.BLOCK_ALL,
            enforce_ssl=True,
            removal_policy=RemovalPolicy.DESTROY,
            auto_delete_objects=True
        )
        
        # Bucket policy for CloudTrail
        self.cloudtrail_bucket.add_to_resource_policy(
            iam.PolicyStatement(
                effect=iam.Effect.ALLOW,
                principals=[iam.ServicePrincipal("cloudtrail.amazonaws.com")],
                actions=["s3:PutObject", "s3:GetBucketAcl"],
                resources=[
                    self.cloudtrail_bucket.bucket_arn,
                    f"{self.cloudtrail_bucket.bucket_arn}/*"
                ],
                conditions={
                    "StringEquals": {
                        "s3:x-amz-acl": "bucket-owner-full-control"
                    }
                }
            )
        )

class NetworkSecurityConstruct(Construct):
    def __init__(self, scope: Construct, id: str, **kwargs):
        super().__init__(scope, id, **kwargs)
        
        # VPC with public and private subnets
        self.vpc = ec2.Vpc(
            self, "SecureVpc",
            ip_addresses=ec2.IpAddresses.cidr("10.0.0.0/16"),
            max_azs=2,
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
        
        # Security Groups
        self.bastion_sg = ec2.SecurityGroup(
            self, "BastionSecurityGroup",
            vpc=self.vpc,
            description="Security group for bastion host",
            allow_all_outbound=True
        )
        
        self.bastion_sg.add_ingress_rule(
            peer=ec2.Peer.ipv4("203.0.113.0/24"),  # Replace with your office IP range
            connection=ec2.Port.tcp(22),
            description="SSH access from office network"
        )
        
        self.app_sg = ec2.SecurityGroup(
            self, "AppSecurityGroup",
            vpc=self.vpc,
            description="Security group for application servers",
            allow_all_outbound=True
        )
        
        self.app_sg.add_ingress_rule(
            peer=self.bastion_sg,
            connection=ec2.Port.tcp(22),
            description="SSH access from bastion"
        )
        
        self.db_sg = ec2.SecurityGroup(
            self, "DatabaseSecurityGroup",
            vpc=self.vpc,
            description="Security group for database",
            allow_all_outbound=False
        )
        
        self.db_sg.add_ingress_rule(
            peer=self.app_sg,
            connection=ec2.Port.tcp(5432),
            description="PostgreSQL access from application"
        )
        
        self.alb_sg = ec2.SecurityGroup(
            self, "ALBSecurityGroup",
            vpc=self.vpc,
            description="Security group for Application Load Balancer",
            allow_all_outbound=True
        )
        
        self.alb_sg.add_ingress_rule(
            peer=ec2.Peer.any_ipv4(),
            connection=ec2.Port.tcp(443),
            description="HTTPS access"
        )
        
        self.alb_sg.add_ingress_rule(
            peer=ec2.Peer.any_ipv4(),
            connection=ec2.Port.tcp(80),
            description="HTTP access (redirect to HTTPS)"
        )

class ComputeSecurityConstruct(Construct):
    def __init__(self, scope: Construct, id: str, vpc: ec2.Vpc, bastion_sg: ec2.SecurityGroup, app_sg: ec2.SecurityGroup, **kwargs):
        super().__init__(scope, id, **kwargs)
        
        # IAM Role for EC2 instances
        self.ec2_role = iam.Role(
            self, "EC2Role",
            assumed_by=iam.ServicePrincipal("ec2.amazonaws.com"),
            managed_policies=[
                iam.ManagedPolicy.from_aws_managed_policy_name("AmazonSSMManagedInstanceCore"),
                iam.ManagedPolicy.from_aws_managed_policy_name("CloudWatchAgentServerPolicy")
            ]
        )
        
        # Instance Profile
        self.instance_profile = iam.CfnInstanceProfile(
            self, "EC2InstanceProfile",
            roles=[self.ec2_role.role_name]
        )
        
        # Launch Template with encrypted EBS
        self.launch_template = ec2.LaunchTemplate(
            self, "AppLaunchTemplate",
            instance_type=ec2.InstanceType.of(ec2.InstanceClass.T3, ec2.InstanceSize.MICRO),
            machine_image=ec2.MachineImage.latest_amazon_linux2(),
            security_group=app_sg,
            role=self.ec2_role,
            block_devices=[
                ec2.BlockDevice(
                    device_name="/dev/xvda",
                    volume=ec2.BlockDeviceVolume.ebs(
                        volume_size=20,
                        encrypted=True,
                        volume_type=ec2.EbsDeviceVolumeType.GP3
                    )
                )
            ],
            user_data=ec2.UserData.for_linux()
        )
        
        # Bastion Host
        self.bastion_host = ec2.Instance(
            self, "BastionHost",
            instance_type=ec2.InstanceType.of(ec2.InstanceClass.T3, ec2.InstanceSize.MICRO),
            machine_image=ec2.MachineImage.latest_amazon_linux2(),
            vpc=vpc,
            vpc_subnets=ec2.SubnetSelection(subnet_type=ec2.SubnetType.PUBLIC),
            security_group=bastion_sg,
            role=self.ec2_role,
            block_devices=[
                ec2.BlockDevice(
                    device_name="/dev/xvda",
                    volume=ec2.BlockDeviceVolume.ebs(
                        volume_size=10,
                        encrypted=True,
                        volume_type=ec2.EbsDeviceVolumeType.GP3
                    )
                )
            ]
        )

class DatabaseSecurityConstruct(Construct):
    def __init__(self, scope: Construct, id: str, vpc: ec2.Vpc, db_sg: ec2.SecurityGroup, kms_key: kms.Key, **kwargs):
        super().__init__(scope, id, **kwargs)
        
        # RDS Subnet Group
        self.subnet_group = rds.SubnetGroup(
            self, "DatabaseSubnetGroup",
            description="Subnet group for RDS database",
            vpc=vpc,
            vpc_subnets=ec2.SubnetSelection(subnet_type=ec2.SubnetType.PRIVATE_ISOLATED)
        )
        
        # RDS Instance with encryption
        self.database = rds.DatabaseInstance(
            self, "PostgreSQLDatabase",
            engine=rds.DatabaseInstanceEngine.postgres(
                version=rds.PostgresEngineVersion.VER_15_4
            ),
            instance_type=ec2.InstanceType.of(ec2.InstanceClass.T3, ec2.InstanceSize.MICRO),
            vpc=vpc,
            subnet_group=self.subnet_group,
            security_groups=[db_sg],
            storage_encrypted=True,
            storage_encryption_key=kms_key,
            backup_retention=Duration.days(7),
            delete_automated_backups=False,
            deletion_protection=False,  # Set to True for production
            publicly_accessible=False,
            multi_az=False,  # Set to True for production
            monitoring_interval=Duration.seconds(60),
            performance_insights_enabled=True,
            allocated_storage=20,
            storage_type=rds.StorageType.GP3,
            removal_policy=RemovalPolicy.DESTROY,
            credentials=rds.Credentials.from_generated_secret(
                "dbadmin",
                secret_name="rds-credentials"
            )
        )

class ApplicationSecurityConstruct(Construct):
    def __init__(self, scope: Construct, id: str, vpc: ec2.Vpc, **kwargs):
        super().__init__(scope, id, **kwargs)
        
        # Lambda execution role
        self.lambda_role = iam.Role(
            self, "LambdaExecutionRole",
            assumed_by=iam.ServicePrincipal("lambda.amazonaws.com"),
            managed_policies=[
                iam.ManagedPolicy.from_aws_managed_policy_name("service-role/AWSLambdaVPCAccessExecutionRole")
            ]
        )
        
        # Lambda function
        self.lambda_function = _lambda.Function(
            self, "SecureFunction",
            runtime=_lambda.Runtime.PYTHON_3_11,
            handler="index.handler",
            code=_lambda.Code.from_inline("""
import json
import os

def handler(event, context):
    # Access environment variables securely
    db_secret = os.environ.get('DB_SECRET_ARN', 'not-set')
    
    return {
        'statusCode': 200,
        'headers': {
            'Content-Type': 'application/json',
            'X-Content-Type-Options': 'nosniff',
            'X-Frame-Options': 'DENY',
            'X-XSS-Protection': '1; mode=block'
        },
        'body': json.dumps({'message': 'Secure function executed'})
    }
"""),
            role=self.lambda_role,
            vpc=vpc,
            vpc_subnets=ec2.SubnetSelection(subnet_type=ec2.SubnetType.PRIVATE_WITH_EGRESS),
            environment={
                "DB_SECRET_ARN": "arn:aws:secretsmanager:us-east-1:123456789012:secret:rds-credentials"
            },
            tracing=_lambda.Tracing.ACTIVE,
            log_retention=logs.RetentionDays.ONE_WEEK
        )
        
        # API Gateway with logging
        self.log_group = logs.LogGroup(
            self, "ApiGatewayLogGroup",
            log_group_name="/aws/apigateway/secure-api",
            retention=logs.RetentionDays.ONE_WEEK,
            removal_policy=RemovalPolicy.DESTROY
        )
        
        self.api = apigateway.LambdaRestApi(
            self, "SecureApi",
            handler=self.lambda_function,
            deploy_options=apigateway.StageOptions(
                stage_name="prod",
                logging_level=apigateway.MethodLoggingLevel.INFO,
                access_log_destination=apigateway.LogGroupLogDestination(self.log_group),
                access_log_format=apigateway.AccessLogFormat.json_with_standard_fields()
            )
        )

class LoadBalancerSecurityConstruct(Construct):
    def __init__(self, scope: Construct, id: str, vpc: ec2.Vpc, alb_sg: ec2.SecurityGroup, **kwargs):
        super().__init__(scope, id, **kwargs)
        
        # ACM Certificate
        self.certificate = acm.Certificate(
            self, "SSLCertificate",
            domain_name="example.com",  # Replace with your domain
            subject_alternative_names=["*.example.com"],  # Replace with your domain
            validation=acm.CertificateValidation.from_dns()
        )
        
        # Application Load Balancer
        self.alb = elbv2.ApplicationLoadBalancer(
            self, "ApplicationLoadBalancer",
            vpc=vpc,
            internet_facing=True,
            security_group=alb_sg,
            vpc_subnets=ec2.SubnetSelection(subnet_type=ec2.SubnetType.PUBLIC)
        )
        
        # Target Group
        self.target_group = elbv2.ApplicationTargetGroup(
            self, "AppTargetGroup",
            vpc=vpc,
            port=80,
            protocol=elbv2.ApplicationProtocol.HTTP,
            health_check=elbv2.HealthCheck(
                enabled=True,
                healthy_http_codes="200",
                path="/health"
            )
        )
        
        # HTTPS Listener
        self.https_listener = self.alb.add_listener(
            "HTTPSListener",
            port=443,
            protocol=elbv2.ApplicationProtocol.HTTPS,
            certificates=[self.certificate],
            default_target_groups=[self.target_group]
        )
        
        # HTTP Listener (redirect to HTTPS)
        self.alb.add_listener(
            "HTTPListener",
            port=80,
            protocol=elbv2.ApplicationProtocol.HTTP,
            default_action=elbv2.ListenerAction.redirect(
                protocol="HTTPS",
                port="443",
                permanent=True
            )
        )

class MonitoringSecurityConstruct(Construct):
    def __init__(self, scope: Construct, id: str, cloudtrail_bucket: s3.Bucket, **kwargs):
        super().__init__(scope, id, **kwargs)
        
        # CloudTrail
        self.cloudtrail = cloudtrail.Trail(
            self, "SecurityAuditTrail",
            bucket=cloudtrail_bucket,
            include_global_service_events=True,
            is_multi_region_trail=True,
            enable_file_validation=True,
            event_rules=[
                cloudtrail.ReadWriteType.ALL
            ]
        )
        
        # AWS Config Configuration Recorder
        self.config_role = iam.Role(
            self, "ConfigRole",
            assumed_by=iam.ServicePrincipal("config.amazonaws.com"),
            managed_policies=[
                iam.ManagedPolicy.from_aws_managed_policy_name("service-role/ConfigRole")
            ]
        )
        
        # AWS Config Delivery Channel
        self.config_bucket = s3.Bucket(
            self, "ConfigBucket",
            versioned=True,
            encryption=s3.BucketEncryption.S3_MANAGED,
            block_public_access=s3.BlockPublicAccess.BLOCK_ALL,
            removal_policy=RemovalPolicy.DESTROY,
            auto_delete_objects=True
        )
        
        # AWS Config
        self.config_recorder = config.CfnConfigurationRecorder(
            self, "ConfigRecorder",
            role_arn=self.config_role.role_arn,
            recording_group=config.CfnConfigurationRecorder.RecordingGroupProperty(
                all_supported=True,
                include_global_resource_types=True,
                recording_mode=config.CfnConfigurationRecorder.RecordingModeProperty(
                    recording_frequency="DAILY"
                )
            )
        )
        
        self.config_delivery_channel = config.CfnDeliveryChannel(
            self, "ConfigDeliveryChannel",
            s3_bucket_name=self.config_bucket.bucket_name
        )

class WAFSecurityConstruct(Construct):
    def __init__(self, scope: Construct, id: str, **kwargs):
        super().__init__(scope, id, **kwargs)
        
        # WAF Web ACL for CloudFront
        self.web_acl = wafv2.CfnWebACL(
            self, "CloudFrontWebACL",
            scope="CLOUDFRONT",
            default_action=wafv2.CfnWebACL.DefaultActionProperty(allow={}),
            rules=[
                wafv2.CfnWebACL.RuleProperty(
                    name="AWSManagedRulesCommonRuleSet",
                    priority=1,
                    override_action=wafv2.CfnWebACL.OverrideActionProperty(none={}),
                    statement=wafv2.CfnWebACL.StatementProperty(
                        managed_rule_group_statement=wafv2.CfnWebACL.ManagedRuleGroupStatementProperty(
                            vendor_name="AWS",
                            name="AWSManagedRulesCommonRuleSet"
                        )
                    ),
                    visibility_config=wafv2.CfnWebACL.VisibilityConfigProperty(
                        cloud_watch_metrics_enabled=True,
                        metric_name="CommonRuleSetMetric",
                        sampled_requests_enabled=True
                    )
                ),
                wafv2.CfnWebACL.RuleProperty(
                    name="AWSManagedRulesKnownBadInputsRuleSet",
                    priority=2,
                    override_action=wafv2.CfnWebACL.OverrideActionProperty(none={}),
                    statement=wafv2.CfnWebACL.StatementProperty(
                        managed_rule_group_statement=wafv2.CfnWebACL.ManagedRuleGroupStatementProperty(
                            vendor_name="AWS",
                            name="AWSManagedRulesKnownBadInputsRuleSet"
                        )
                    ),
                    visibility_config=wafv2.CfnWebACL.VisibilityConfigProperty(
                        cloud_watch_metrics_enabled=True,
                        metric_name="KnownBadInputsRuleSetMetric",
                        sampled_requests_enabled=True
                    )
                )
            ],
            visibility_config=wafv2.CfnWebACL.VisibilityConfigProperty(
                cloud_watch_metrics_enabled=True,
                metric_name="WebACLMetric",
                sampled_requests_enabled=True
            )
        )

class CloudFrontSecurityConstruct(Construct):
    def __init__(self, scope: Construct, id: str, bucket: s3.Bucket, web_acl: wafv2.CfnWebACL, **kwargs):
        super().__init__(scope, id, **kwargs)
        
        # Origin Access Control
        self.oac = cloudfront.CfnOriginAccessControl(
            self, "OriginAccessControl",
            origin_access_control_config=cloudfront.CfnOriginAccessControl.OriginAccessControlConfigProperty(
                name="S3OAC",
                origin_access_control_origin_type="s3",
                signing_behavior="always",
                signing_protocol="sigv4"
            )
        )
        
        # CloudFront Distribution
        self.distribution = cloudfront.Distribution(
            self, "SecureDistribution",
            default_behavior=cloudfront.BehaviorOptions(
                origin=cloudfront.S3Origin(
                    bucket=bucket,
                    origin_access_identity=None  # Using OAC instead
                ),
                viewer_protocol_policy=cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
                response_headers_policy=cloudfront.ResponseHeadersPolicy.SECURITY_HEADERS,
                cache_policy=cloudfront.CachePolicy.CACHING_OPTIMIZED
            ),
            price_class=cloudfront.PriceClass.PRICE_CLASS_100,
            web_acl_id=web_acl.attr_arn,
            enable_logging=True,
            log_bucket=bucket,
            log_file_prefix="cloudfront-access-logs/"
        )

class SecurityHubConstruct(Construct):
    def __init__(self, scope: Construct, id: str, **kwargs):
        super().__init__(scope, id, **kwargs)
        
        # Enable Security Hub
        self.security_hub = securityhub.CfnHub(
            self, "SecurityHub",
            enable_default_standards=True,
            control_finding_generator="SECURITY_CONTROL",
            auto_enable_controls=True
        )
```

## File: lib/security_stack.py

```python
from aws_cdk import (
    Stack,
    aws_ec2 as ec2,
    CfnOutput,
)
from constructs import Construct
from .security_constructs import (
    SecurityFoundationConstruct,
    NetworkSecurityConstruct,
    ComputeSecurityConstruct,
    DatabaseSecurityConstruct,
    ApplicationSecurityConstruct,
    LoadBalancerSecurityConstruct,
    MonitoringSecurityConstruct,
    WAFSecurityConstruct,
    CloudFrontSecurityConstruct,
    SecurityHubConstruct
)

class SecurityStack(Stack):
    def __init__(self, scope: Construct, construct_id: str, **kwargs) -> None:
        super().__init__(scope, construct_id, **kwargs)
        
        # Enable EBS encryption by default
        ec2.CfnEBSEncryptionByDefault(
            self, "EBSEncryptionByDefault",
            ebs_encryption_by_default=True
        )
        
        # Security Foundation (KMS, S3)
        security_foundation = SecurityFoundationConstruct(
            self, "SecurityFoundation"
        )
        
        # Network Security (VPC, Security Groups)
        network_security = NetworkSecurityConstruct(
            self, "NetworkSecurity"
        )
        
        # Compute Security (EC2, Bastion)
        compute_security = ComputeSecurityConstruct(
            self, "ComputeSecurity",
            vpc=network_security.vpc,
            bastion_sg=network_security.bastion_sg,
            app_sg=network_security.app_sg
        )
        
        # Database Security (RDS)
        database_security = DatabaseSecurityConstruct(
            self, "DatabaseSecurity",
            vpc=network_security.vpc,
            db_sg=network_security.db_sg,
            kms_key=security_foundation.kms_key
        )
        
        # Application Security (Lambda, API Gateway)
        application_security = ApplicationSecurityConstruct(
            self, "ApplicationSecurity",
            vpc=network_security.vpc
        )
        
        # Load Balancer Security (ALB, ACM)
        load_balancer_security = LoadBalancerSecurityConstruct(
            self, "LoadBalancerSecurity",
            vpc=network_security.vpc,
            alb_sg=network_security.alb_sg
        )
        
        # Monitoring Security (CloudTrail, Config)
        monitoring_security = MonitoringSecurityConstruct(
            self, "MonitoringSecurity",
            cloudtrail_bucket=security_foundation.cloudtrail_bucket
        )
        
        # WAF Security
        waf_security = WAFSecurityConstruct(
            self, "WAFSecurity"
        )
        
        # CloudFront Security
        cloudfront_security = CloudFrontSecurityConstruct(
            self, "CloudFrontSecurity",
            bucket=security_foundation.secure_bucket,
            web_acl=waf_security.web_acl
        )
        
        # Security Hub
        security_hub = SecurityHubConstruct(
            self, "SecurityHub"
        )
        
        # Outputs
        CfnOutput(
            self, "VPCId",
            value=network_security.vpc.vpc_id,
            description="VPC ID"
        )
        
        CfnOutput(
            self, "BastionHostId",
            value=compute_security.bastion_host.instance_id,
            description="Bastion Host Instance ID"
        )
        
        CfnOutput(
            self, "DatabaseEndpoint",
            value=database_security.database.instance_endpoint.hostname,
            description="RDS Database Endpoint"
        )
        
        CfnOutput(
            self, "APIGatewayURL",
            value=application_security.api.url,
            description="API Gateway URL"
        )
        
        CfnOutput(
            self, "LoadBalancerDNS",
            value=load_balancer_security.alb.load_balancer_dns_name,
            description="Application Load Balancer DNS Name"
        )
        
        CfnOutput(
            self, "CloudFrontDomain",
            value=cloudfront_security.distribution.distribution_domain_name,
            description="CloudFront Distribution Domain Name"
        )
        
        CfnOutput(
            self, "SecureBucketName",
            value=security_foundation.secure_bucket.bucket_name,
            description="Secure S3 Bucket Name"
        )
```

## Updated File: lib/tap_stack.py

```python
"""tap_stack.py
This module defines the TapStack class, which serves as the main CDK stack for 
the TAP (Test Automation Platform) project.
It orchestrates the instantiation of other resource-specific stacks and 
manages environment-specific configurations.
"""

from typing import Optional

import aws_cdk as cdk
from aws_cdk import NestedStack
from constructs import Construct
from .security_stack import SecurityStack

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
          construct_id: str, props: Optional[TapStackProps] = None, **kwargs):
    super().__init__(scope, construct_id, **kwargs)

    # Get environment suffix from props, context, or use 'dev' as default
    environment_suffix = (
        props.environment_suffix if props else None
    ) or self.node.try_get_context('environmentSuffix') or 'dev'

    # Create the comprehensive security stack as a nested stack
    class NestedSecurityStack(NestedStack):
      def __init__(self, scope, id, **kwargs):
        super().__init__(scope, id, **kwargs)
        # Use the SecurityStack logic here
        self.security_stack = SecurityStack(self, "Resources")

    # Create the security infrastructure
    security_stack = NestedSecurityStack(
        self,
        f"SecurityStack{environment_suffix}"
    )
```

This comprehensive solution provides:

1. **S3 buckets** with KMS encryption, versioning, and secure policies
2. **Lambda functions** with VPC integration and secure environment variables
3. **IAM roles** following least privilege principles
4. **VPC with proper subnet isolation** for EC2 instances
5. **API Gateway** with CloudWatch logging
6. **CloudTrail** logging to encrypted S3 bucket
7. **AWS Config** for monitoring configuration changes
8. **RDS database** with encryption at rest and private access only
9. **Security groups** with restrictive rules
10. **S3 bucket policies** preventing unauthorized access
11. **Application Load Balancer** with SSL termination
12. **EBS encryption** enabled by default
13. **Bastion host** for secure SSH access
14. **CloudFront** with security headers and WAF integration

The code also incorporates latest AWS security features like Security Hub for centralized security findings management. All resources are properly encrypted, follow security best practices, and include comprehensive logging and monitoring.