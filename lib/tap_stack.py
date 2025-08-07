"""tap_stack.py
This module defines the TapStack class, which serves as the main CDK stack for
the TAP (Test Automation Platform) project.
It orchestrates the instantiation of other resource-specific stacks and
manages environment-specific configurations.
"""

from typing import Optional, Tuple

from aws_cdk import (
    aws_ec2 as ec2,
    aws_elasticloadbalancingv2 as elbv2,
    aws_autoscaling as autoscaling,
    aws_s3 as s3,
    aws_kms as kms,
    aws_iam as iam,
    aws_apigateway as apigateway,
    aws_rds as rds,
    aws_logs as logs,
    aws_ssm as ssm,
    aws_certificatemanager as acm,
    aws_cloudwatch as cloudwatch,
    Duration,
    RemovalPolicy,
    CfnOutput
)
from constructs import Construct
import aws_cdk as cdk

# Import your stacks here
# from .ddb_stack import DynamoDBStack, DynamoDBStackProps


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
    # pylint: disable=unused-variable
    environment_suffix = (
        props.environment_suffix if props else None
    ) or self.node.try_get_context('environmentSuffix') or 'dev'

    # Create KMS key for encryption
    self.kms_key = self._create_kms_key()

    # Create VPC with proper networking
    self.vpc = self._create_vpc()

    # Create S3 bucket with encryption
    self.s3_bucket = self._create_s3_bucket()

    # Create IAM roles
    self.ec2_role = self._create_ec2_role()
    self.api_gateway_role = self._create_api_gateway_role()

    # Create RDS database
    self.database = self._create_database()

    # Create security groups
    self.alb_security_group = self._create_alb_security_group()
    self.ec2_security_group = self._create_ec2_security_group()
    self.rds_security_group = self._create_rds_security_group()

    # AI NOTE: ACM certificate creation has been disabled due to lack of domain ownership
    self.certificate = None

    # Create Application Load Balancer and target group
    self.alb, self.target_group = self._create_application_load_balancer()

    # Create Auto Scaling Group
    self.asg = self._create_auto_scaling_group()

    # Create API Gateway
    self.api_gateway = self._create_api_gateway()

    # Create CloudWatch resources
    self._create_cloudwatch_resources()

    # Create SSM parameters
    self._create_ssm_parameters()

    # Create outputs
    self._create_outputs()

  def _create_kms_key(self) -> kms.Key:
    """Create customer-managed KMS key for encryption"""
    key = kms.Key(
        self, "TapKMSKey",
        description="KMS key for Nova Model Breaking application encryption",
        enable_key_rotation=True,
        removal_policy=RemovalPolicy.DESTROY
    )

    # Add key policy for S3 and other services
    key.add_to_resource_policy(
        iam.PolicyStatement(
            sid="Enable S3 Service",
            effect=iam.Effect.ALLOW,
            principals=[iam.ServicePrincipal("s3.amazonaws.com")],
            actions=[
                "kms:Decrypt",
                "kms:GenerateDataKey"
            ],
            resources=["*"]
        )
    )

    return key

  def _create_vpc(self) -> ec2.Vpc:
    """Create VPC with public and private subnets across multiple AZs"""
    vpc = ec2.Vpc(
        self, "TapVPC",
        ip_addresses=ec2.IpAddresses.cidr("10.0.0.0/16"),
        max_azs=2,  # Use 2 AZs for high availability
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
        nat_gateways=2  # One NAT gateway per AZ for high availability
    )

    # Add VPC Flow Logs for security monitoring
    vpc.add_flow_log(
        "TapVPCFlowLog",
        destination=ec2.FlowLogDestination.to_cloud_watch_logs(
            logs.LogGroup(
                self, "VPCFlowLogGroup",
                retention=logs.RetentionDays.ONE_WEEK,
                removal_policy=RemovalPolicy.DESTROY
            )
        )
    )

    return vpc

  def _create_s3_bucket(self) -> s3.Bucket:
    """Create S3 bucket with KMS encryption and security settings"""
    bucket = s3.Bucket(
        self, "TapS3Bucket",
        bucket_name=f"nova-model-breaking-{self.account}-{self.region}",
        encryption=s3.BucketEncryption.KMS,
        encryption_key=self.kms_key,
        versioned=True,
        block_public_access=s3.BlockPublicAccess.BLOCK_ALL,
        enforce_ssl=True,
        removal_policy=RemovalPolicy.DESTROY,
        auto_delete_objects=True,
        lifecycle_rules=[
            s3.LifecycleRule(
                id="DeleteIncompleteMultipartUploads",
                abort_incomplete_multipart_upload_after=Duration.days(7)
            )
        ]
    )

    return bucket

  def _create_ec2_role(self) -> iam.Role:
    """Create IAM role for EC2 instances with least privilege"""
    role = iam.Role(
        self, "TapEC2Role",
        assumed_by=iam.ServicePrincipal("ec2.amazonaws.com"),
        managed_policies=[
            iam.ManagedPolicy.from_aws_managed_policy_name("CloudWatchAgentServerPolicy")
        ]
    )

    # Add custom policy for S3 access
    role.add_to_policy(
        iam.PolicyStatement(
            effect=iam.Effect.ALLOW,
            actions=[
                "s3:GetObject",
                "s3:PutObject",
                "s3:DeleteObject"
            ],
            resources=[f"{self.s3_bucket.bucket_arn}/*"]
        )
    )

    # Add SSM parameter access
    role.add_to_policy(
        iam.PolicyStatement(
            effect=iam.Effect.ALLOW,
            actions=[
                "ssm:GetParameter",
                "ssm:GetParameters",
                "ssm:GetParametersByPath"
            ],
            resources=[
                f"arn:aws:ssm:{self.region}:{self.account}:parameter/nova-model-breaking/*"
            ]
        )
    )

    return role

  def _create_api_gateway_role(self) -> iam.Role:
    """Create IAM role for API Gateway"""
    role = iam.Role(
        self, "TapAPIGatewayRole",
        assumed_by=iam.ServicePrincipal("apigateway.amazonaws.com"),
        managed_policies=[
            iam.ManagedPolicy.from_aws_managed_policy_name(
                "service-role/AmazonAPIGatewayPushToCloudWatchLogs"
            )
        ]
    )

    return role

  def _create_database(self) -> rds.DatabaseInstance:
    """Create RDS database with encryption and automated backups"""
    db_subnet_group = rds.SubnetGroup(
        self,
        "TapDBSubnetGroup",
        description="Subnet group for Nova Model Breaking database",
        vpc=self.vpc,
        vpc_subnets=ec2.SubnetSelection(
            subnet_type=ec2.SubnetType.PRIVATE_ISOLATED))

    database = rds.DatabaseInstance(
        self, "TapDatabase",
        engine=rds.DatabaseInstanceEngine.postgres(
            version=rds.PostgresEngineVersion.VER_15_8
        ),
        instance_type=ec2.InstanceType.of(
            ec2.InstanceClass.T3,
            ec2.InstanceSize.MICRO
        ),
        vpc=self.vpc,
        subnet_group=db_subnet_group,
        multi_az=True,
        storage_encrypted=True,
        storage_encryption_key=self.kms_key,
        backup_retention=Duration.days(7),
        delete_automated_backups=False,
        deletion_protection=False,  # Set to True in production
        removal_policy=RemovalPolicy.DESTROY,
        enable_performance_insights=True,
        monitoring_interval=Duration.seconds(60)
    )

    return database

  def _create_alb_security_group(self) -> ec2.SecurityGroup:
    """Create security group for Application Load Balancer"""
    security_group = ec2.SecurityGroup(
        self, "TapALBSecurityGroup",
        vpc=self.vpc,
        description="Security group for Nova Model Breaking ALB",
        allow_all_outbound=False
    )

    # Allow HTTPS traffic from specific IP ranges (replace with your actual
    # IPs)
    security_group.add_ingress_rule(
        peer=ec2.Peer.ipv4("0.0.0.0/0"),
        # Replace with specific IP ranges in production
        connection=ec2.Port.tcp(443),
        description="HTTPS traffic"
    )

    # Allow HTTP traffic (for redirect to HTTPS)
    security_group.add_ingress_rule(
        peer=ec2.Peer.ipv4("0.0.0.0/0"),
        # Replace with specific IP ranges in production
        connection=ec2.Port.tcp(80),
        description="HTTP traffic for redirect"
    )

    return security_group

  def _create_ec2_security_group(self) -> ec2.SecurityGroup:
    """Create security group for EC2 instances"""
    security_group = ec2.SecurityGroup(
        self, "TapEC2SecurityGroup",
        vpc=self.vpc,
        description="Security group for Nova Model Breaking EC2 instances",
        allow_all_outbound=True
    )

    # Allow traffic from ALB
    security_group.add_ingress_rule(
        peer=ec2.Peer.security_group_id(
            self.alb_security_group.security_group_id),
        connection=ec2.Port.tcp(80),
        description="HTTP from ALB")

    return security_group

  def _create_rds_security_group(self) -> ec2.SecurityGroup:
    """Create security group for RDS database"""
    security_group = ec2.SecurityGroup(
        self, "TapRDSSecurityGroup",
        vpc=self.vpc,
        description="Security group for Nova Model Breaking RDS",
        allow_all_outbound=False
    )

    # Allow PostgreSQL traffic from EC2 instances
    security_group.add_ingress_rule(
        peer=ec2.Peer.security_group_id(
            self.ec2_security_group.security_group_id),
        connection=ec2.Port.tcp(5432),
        description="PostgreSQL from EC2")

    return security_group

  def _create_ssl_certificate(self) -> acm.Certificate:
   """AI NOTE: SSL Certificate creation has been disabled due to lack of domain ownership."""
    # certificate = acm.Certificate(
    #     self, "TapSSLCertificate",
    #     domain_name="nova-model-breaking.example.com",
    #     validation=acm.CertificateValidation.from_dns()
    # )

  def _create_application_load_balancer(
          self) -> Tuple[elbv2.ApplicationLoadBalancer, elbv2.ApplicationTargetGroup]:
    """Create Application Load Balancer with HTTPS listener"""
    alb = elbv2.ApplicationLoadBalancer(
        self, "TapALB",
        vpc=self.vpc,
        internet_facing=True,
        security_group=self.alb_security_group,
        vpc_subnets=ec2.SubnetSelection(subnet_type=ec2.SubnetType.PUBLIC)
    )

    # Create target group
    target_group = elbv2.ApplicationTargetGroup(
        self, "TapTargetGroup",
        port=80,
        protocol=elbv2.ApplicationProtocol.HTTP,
        target_type=elbv2.TargetType.INSTANCE,
        vpc=self.vpc,
        health_check=elbv2.HealthCheck(
            enabled=True,
            healthy_threshold_count=2,
            interval=Duration.seconds(30),
            path="/health",
            protocol=elbv2.Protocol.HTTP,
            timeout=Duration.seconds(5),
            unhealthy_threshold_count=3
        )
    )

    # AI NOTE: HTTPS listener is commented out due to no valid ACM certificate
    # alb.add_listener(
    #     "TapHTTPSListener",
    #     port=443,
    #     protocol=elbv2.ApplicationProtocol.HTTPS,
    #     certificates=[self.certificate],
    #     ssl_policy=elbv2.SslPolicy.TLS12_EXT,
    #     default_target_groups=[target_group]
    # )
    # Add HTTP listener for redirect to HTTPS
    
    alb.add_listener(
        "TapHTTPListener",
        port=80,
        protocol=elbv2.ApplicationProtocol.HTTP,
        default_action=elbv2.ListenerAction.redirect(
            protocol="HTTPS",
            port="443",
            permanent=True
        )
    )

    return alb, target_group

  def _create_auto_scaling_group(self) -> autoscaling.AutoScalingGroup:
    """Create Auto Scaling Group with EC2 instances"""
    # Create launch template
    user_data = ec2.UserData.for_linux()
    user_data.add_commands(
        "yum update -y",
        "yum install -y amazon-cloudwatch-agent",
        "amazon-linux-extras install -y docker",
        "service docker start",
        "usermod -a -G docker ec2-user",
        # Add your application startup commands here
    )

    launch_template = ec2.LaunchTemplate(
        self, "TapLaunchTemplate",
        instance_type=ec2.InstanceType.of(
            ec2.InstanceClass.T3,
            ec2.InstanceSize.MICRO
        ),
        machine_image=ec2.AmazonLinuxImage(
            generation=ec2.AmazonLinuxGeneration.AMAZON_LINUX_2
        ),
        security_group=self.ec2_security_group,
        role=self.ec2_role,
        user_data=user_data,
        detailed_monitoring=True
    )

    # Create Auto Scaling Group
    asg = autoscaling.AutoScalingGroup(
        self,
        "TapASG",
        vpc=self.vpc,
        launch_template=launch_template,
        min_capacity=2,
        max_capacity=10,
        # Remove desired_capacity to avoid reset on every deployment
        vpc_subnets=ec2.SubnetSelection(
            subnet_type=ec2.SubnetType.PRIVATE_WITH_EGRESS),
        health_checks=autoscaling.HealthChecks.ec2().with_additional_checks(
            additional_types=[autoscaling.AdditionalHealthCheckType.ELB],
            grace_period=Duration.minutes(5)
        ))

    # Attach to target group
    asg.attach_to_application_target_group(self.target_group)

    return asg

  def _create_api_gateway(self) -> apigateway.RestApi:
    """Create API Gateway with IAM authentication"""
    api = apigateway.RestApi(
        self, "TapAPIGateway",
        rest_api_name="Nova Model Breaking API",
        description="Secure API for Nova Model Breaking application",
        default_cors_preflight_options=apigateway.CorsOptions(
            allow_origins=apigateway.Cors.ALL_ORIGINS,
            allow_methods=apigateway.Cors.ALL_METHODS,
            allow_headers=["Content-Type", "Authorization"]
        ),
        endpoint_configuration=apigateway.EndpointConfiguration(
            types=[apigateway.EndpointType.REGIONAL]
        )
    )

    # Create IAM authorizer (commented out as it requires a Lambda function)
    # authorizer = apigateway.RequestAuthorizer(
    #     self, "TapAPIAuthorizer",
    #     handler=lambda_function,  # Lambda function needed for custom auth
    #     identity_sources=[apigateway.IdentitySource.header("Authorization")]
    # )

    # Create API resources with IAM authentication
    api_resource = api.root.add_resource("api")
    api_resource.add_method(
        "GET",
        apigateway.MockIntegration(
            integration_responses=[
                apigateway.IntegrationResponse(status_code="200")
            ],
            passthrough_behavior=apigateway.PassthroughBehavior.NEVER,
            request_templates={"application/json": '{"statusCode": 200}'}
        ),
        method_responses=[
            apigateway.MethodResponse(status_code="200")
        ],
        authorization_type=apigateway.AuthorizationType.IAM
    )

    return api

  def _create_cloudwatch_resources(self):
    """Create CloudWatch log groups and alarms"""
    # Application log group
    # pylint: disable=unused-variable
    app_log_group = logs.LogGroup(
        self, "TapAppLogGroup",
        log_group_name="/aws/ec2/nova-model-breaking/application",
        retention=logs.RetentionDays.ONE_WEEK,
        removal_policy=RemovalPolicy.DESTROY
    )

    # Infrastructure deployment log group
    # pylint: disable=unused-variable
    infra_log_group = logs.LogGroup(
        self, "TapInfraLogGroup",
        log_group_name="/aws/codebuild/nova-model-breaking/infrastructure",
        retention=logs.RetentionDays.ONE_WEEK,
        removal_policy=RemovalPolicy.DESTROY
    )

    # Create CloudWatch alarms
    cloudwatch.Alarm(
        self, "TapHighCPUAlarm",
        metric=cloudwatch.Metric(
            namespace="AWS/EC2",
            metric_name="CPUUtilization",
            dimensions_map={"AutoScalingGroupName": self.asg.auto_scaling_group_name}
        ),
        threshold=80,
        evaluation_periods=2,
        datapoints_to_alarm=2
    )

  def _create_ssm_parameters(self):
    """Create SSM parameters for application configuration"""
    ssm.StringParameter(
        self, "TapDBEndpointParam",
        parameter_name="/nova-model-breaking/database/endpoint",
        string_value=self.database.instance_endpoint.hostname,
        description="Database endpoint for Nova Model Breaking"
    )

    ssm.StringParameter(
        self, "TapS3BucketParam",
        parameter_name="/nova-model-breaking/s3/bucket-name",
        string_value=self.s3_bucket.bucket_name,
        description="S3 bucket name for Nova Model Breaking"
    )

  def _create_outputs(self):
    """Create CloudFormation outputs"""
    CfnOutput(
        self, "ALBDNSName",
        value=self.alb.load_balancer_dns_name,
        description="DNS name of the Application Load Balancer"
    )

    CfnOutput(
        self, "APIGatewayURL",
        value=self.api_gateway.url,
        description="URL of the API Gateway"
    )

    CfnOutput(
        self, "S3BucketName",
        value=self.s3_bucket.bucket_name,
        description="Name of the S3 bucket"
    )
