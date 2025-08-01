"""tap_stack.py
This module defines the TapStack class, which serves as the main CDK stack for 
the TAP (Test Automation Platform) project.
It orchestrates the instantiation of other resource-specific stacks and 
manages environment-specific configurations.
"""

from typing import Optional

from aws_cdk import (
    aws_ec2 as ec2,
    aws_rds as rds,
    aws_s3 as s3,
    aws_iam as iam,
    aws_cloudfront as cloudfront,
    aws_cloudfront_origins as origins,
    RemovalPolicy,
    Duration
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
    # Note: environment_suffix preserved for compatibility but not used in current implementation
    environment_suffix = (
        props.environment_suffix if props else None
    ) or self.node.try_get_context('environmentSuffix') or 'dev'
    # Store for potential future use
    self.environment_suffix = environment_suffix

    self.vpc = ec2.Vpc(
      self, "EcommerceVpc",
      max_azs=2,
      nat_gateways=1,
      subnet_configuration=[
        ec2.SubnetConfiguration(
          name="public",
          subnet_type=ec2.SubnetType.PUBLIC,
          cidr_mask=24
        ),
        ec2.SubnetConfiguration(
          name="private",
          subnet_type=ec2.SubnetType.PRIVATE_WITH_EGRESS,
          cidr_mask=24
        )
      ]
  )
        
    # Create CloudFront Origin Access Control using L1 construct
    self.oac = cloudfront.CfnOriginAccessControl(
      self, "EcommerceOAC",
      origin_access_control_config=cloudfront.CfnOriginAccessControl.OriginAccessControlConfigProperty(
        description="OAC for e-commerce S3 bucket",
        name="EcommerceS3OAC",
        origin_access_control_origin_type="s3",
        signing_behavior="always",
        signing_protocol="sigv4"
      )
    )
        
    # Create S3 bucket with security configurations
    self.s3_bucket = self._create_s3_bucket()
    
    # Create RDS instance
    self.rds_instance = self._create_rds_instance()
    
    # Create IAM roles
    self.rds_access_role = self._create_rds_access_role()
    self.s3_access_role = self._create_s3_access_role()
    
    # Create CloudFront distribution
    self.cloudfront_distribution = self._create_cloudfront_distribution()
    
    # Update S3 bucket policy after CloudFront creation
    self._update_s3_bucket_policy()
    
  def _create_s3_bucket(self) -> s3.Bucket:
    """Create S3 bucket with security best practices"""
    bucket = s3.Bucket(
      self, "EcommerceBucket",
      bucket_name=f"ecommerce-assets-{self.account}-{self.region}",
      versioned=True,
      encryption=s3.BucketEncryption.S3_MANAGED,
      block_public_access=s3.BlockPublicAccess.BLOCK_ALL,
      removal_policy=RemovalPolicy.RETAIN,
      enforce_ssl=True,
      server_access_logs_prefix="access-logs/",
      lifecycle_rules=[
        s3.LifecycleRule(
          id="DeleteIncompleteMultipartUploads",
          abort_incomplete_multipart_upload_after=Duration.days(7)
        )
      ]
    )
      
    return bucket
  
  def _create_rds_instance(self) -> rds.DatabaseInstance:
    """Create RDS PostgreSQL instance with security configurations"""
    # Create DB subnet group in private subnets only
    db_subnet_group = rds.SubnetGroup(
      self, "EcommerceDbSubnetGroup",
      description="Subnet group for e-commerce database",
      vpc=self.vpc,
      vpc_subnets=ec2.SubnetSelection(
        subnet_type=ec2.SubnetType.PRIVATE_WITH_EGRESS
      )
    )
      
      # Create security group for RDS
    db_security_group = ec2.SecurityGroup(
      self, "EcommerceDbSecurityGroup",
      vpc=self.vpc,
      description="Security group for e-commerce database",
      allow_all_outbound=False
    )
    
    # Create application security group (for services that need DB access)
    app_security_group = ec2.SecurityGroup(
      self, "EcommerceAppSecurityGroup",
      vpc=self.vpc,
      description="Security group for application services"
    )
      
      # Allow DB access only from application security group
    db_security_group.add_ingress_rule(
      peer=app_security_group,
      connection=ec2.Port.tcp(5432),
      description="Allow PostgreSQL access from application services"
    )
    
    # Store app security group for potential use by other services
    self.app_security_group = app_security_group
      
    # Create RDS instance
    rds_instance = rds.DatabaseInstance(
      self, "EcommerceDatabase",
      engine=rds.DatabaseInstanceEngine.postgres(
        version=rds.PostgresEngineVersion.VER_15_4
      ),
      instance_type=ec2.InstanceType.of(
        ec2.InstanceClass.T3, 
        ec2.InstanceSize.MICRO
      ),
      vpc=self.vpc,
      subnet_group=db_subnet_group,
      security_groups=[db_security_group],
      database_name="ecommerce",
      credentials=rds.Credentials.from_generated_secret(
        "ecommerce_admin",
        secret_name="ecommerce/db/credentials"
      ),
      backup_retention=Duration.days(7),
      multi_az=True,
      storage_encrypted=True,
      deletion_protection=True,
      delete_automated_backups=False,
      removal_policy=RemovalPolicy.RETAIN,
      parameter_group=rds.ParameterGroup.from_parameter_group_name(
        self, "EcommerceDbParameterGroup",
        "default.postgres15"
      )
    )
      
    return rds_instance
  
  def _create_rds_access_role(self) -> iam.Role:
    """Create IAM role for RDS access with least privilege"""
    role = iam.Role(
      self, "EcommerceRdsAccessRole",
      assumed_by=iam.ServicePrincipal("lambda.amazonaws.com"),
      description="Role for accessing e-commerce RDS instance",
      managed_policies=[
        iam.ManagedPolicy.from_aws_managed_policy_name(
          "service-role/AWSLambdaVPCAccessExecutionRole"
        )
      ]
    )
      
      # Add policy for RDS connect (for RDS Proxy if used)
    rds_policy = iam.Policy(
      self, "EcommerceRdsAccessPolicy",
      statements=[
        iam.PolicyStatement(
          effect=iam.Effect.ALLOW,
          actions=[
            "rds-db:connect"
          ],
          resources=[
            f"arn:aws:rds-db:{self.region}:{self.account}:dbuser:"
            f"{self.rds_instance.instance_resource_id}/ecommerce_app"
          ]
        ),
        iam.PolicyStatement(
          effect=iam.Effect.ALLOW,
          actions=[
            "secretsmanager:GetSecretValue",
            "secretsmanager:DescribeSecret"
          ],
          resources=[
            self.rds_instance.secret.secret_arn
          ]
        )
      ]
    )
    
    role.attach_inline_policy(rds_policy)
    return role
  
  def _create_s3_access_role(self) -> iam.Role:
    """Create IAM role for S3 access with least privilege"""
    role = iam.Role(
      self, "EcommerceS3AccessRole",
      assumed_by=iam.ServicePrincipal("lambda.amazonaws.com"),
      description="Role for accessing e-commerce S3 bucket",
      managed_policies=[
        iam.ManagedPolicy.from_aws_managed_policy_name(
          "service-role/AWSLambdaBasicExecutionRole"
        )
      ]
    )
      
    # Add policy for specific S3 bucket access
    s3_policy = iam.Policy(
      self, "EcommerceS3AccessPolicy",
      statements=[
        iam.PolicyStatement(
          effect=iam.Effect.ALLOW,
          actions=[
            "s3:GetObject",
            "s3:PutObject",
            "s3:DeleteObject"
          ],
          resources=[
            f"{self.s3_bucket.bucket_arn}/*"
          ]
        ),
        iam.PolicyStatement(
          effect=iam.Effect.ALLOW,
          actions=[
            "s3:ListBucket"
          ],
          resources=[
            self.s3_bucket.bucket_arn
          ]
        )
      ]
    )
    
    role.attach_inline_policy(s3_policy)
    return role
  
  def _create_cloudfront_distribution(self) -> cloudfront.Distribution:
    """Create CloudFront distribution for S3 bucket"""
    distribution = cloudfront.Distribution(
      self, "EcommerceDistribution",
      default_behavior=cloudfront.BehaviorOptions(
        origin=origins.S3Origin(
          bucket=self.s3_bucket
        ),
        viewer_protocol_policy=cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
        cache_policy=cloudfront.CachePolicy.CACHING_OPTIMIZED,
        allowed_methods=cloudfront.AllowedMethods.ALLOW_GET_HEAD_OPTIONS,
        compress=True
      ),
      price_class=cloudfront.PriceClass.PRICE_CLASS_100,
      enabled=True
    )
    
    # Configure the distribution to use the OAC
    cfn_distribution = distribution.node.default_child
    cfn_distribution.add_property_override(
      "DistributionConfig.Origins.0.OriginAccessControlId", 
      self.oac.attr_id
    )
    
    return distribution
  
  def _update_s3_bucket_policy(self):
    """Update S3 bucket policy to allow access only from CloudFront OAC"""
    bucket_policy = iam.PolicyDocument(
      statements=[
        iam.PolicyStatement(
          sid="AllowCloudFrontServicePrincipal",
          effect=iam.Effect.ALLOW,
          principals=[iam.ServicePrincipal("cloudfront.amazonaws.com")],
          actions=["s3:GetObject"],
          resources=[f"{self.s3_bucket.bucket_arn}/*"],
          conditions={
            "StringEquals": {
              "AWS:SourceArn": f"arn:aws:cloudfront::{self.account}:distribution/"
                               f"{self.cloudfront_distribution.distribution_id}"
            }
          }
        ),
        iam.PolicyStatement(
          sid="DenyPublicAccess",
          effect=iam.Effect.DENY,
          principals=[iam.AnyPrincipal()],
          actions=["s3:*"],
          resources=[
            self.s3_bucket.bucket_arn,
            f"{self.s3_bucket.bucket_arn}/*"
          ],
          conditions={
            "Bool": {
              "aws:SecureTransport": "false"
            }
          }
        )
      ]
    )
      
    # Apply the policy to the bucket
    s3.CfnBucketPolicy(
      self, "EcommerceBucketPolicy",
      bucket=self.s3_bucket.bucket_name,
      policy_document=bucket_policy.to_json()
    )
   
