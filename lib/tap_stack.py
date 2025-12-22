"""tap_stack.py
This module defines the TapStack class, which serves as the main CDK stack for
the TAP (Test Automation Platform) project.
It orchestrates the instantiation of other resource-specific stacks and
manages environment-specific configurations.
"""

import os
from typing import Optional

from aws_cdk import (
    aws_ec2 as ec2,
    aws_rds as rds,
    aws_s3 as s3,
    aws_iam as iam,
    aws_cloudfront as cloudfront,
    aws_cloudfront_origins as origins,
    RemovalPolicy,
    Duration,
    CfnOutput
)
from constructs import Construct
import aws_cdk as cdk

# Detect LocalStack environment
IS_LOCALSTACK = "localhost" in os.environ.get("AWS_ENDPOINT_URL", "") or "4566" in os.environ.get("AWS_ENDPOINT_URL", "")

class TapStackProps(cdk.StackProps):
    def __init__(self, environment_suffix: Optional[str] = None, **kwargs):
    super().__init__(**kwargs)
    self.environment_suffix = environment_suffix

class TapStack(cdk.Stack):
    def __init__(
            self,
            scope: Construct,
            construct_id: str, props: Optional[TapStackProps] = None, **kwargs):
    super().__init__(scope, construct_id, **kwargs)

    environment_suffix = (
        props.environment_suffix if props else None
    ) or self.node.try_get_context('environmentSuffix') or 'dev'
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

    # Use OAI for LocalStack (legacy), OAC for AWS (modern)
    if IS_LOCALSTACK:
        self.oai = cloudfront.CfnCloudFrontOriginAccessIdentity(
        self, "EcommerceOAI",
        cloud_front_origin_access_identity_config=cloudfront.CfnCloudFrontOriginAccessIdentity.CloudFrontOriginAccessIdentityConfigProperty(
            comment="OAI for e-commerce S3 bucket (LocalStack compatible)"
        )
        )
        self.oac = None
    else:
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
        self.oai = None

    self.s3_bucket = self._create_s3_bucket()
    self.rds_instance = self._create_rds_instance()
    self.rds_access_role = self._create_rds_access_role()
    self.s3_access_role = self._create_s3_access_role()
    self.cloudfront_distribution = self._create_cloudfront_distribution()
    self._update_s3_bucket_policy()
    self._create_stack_outputs()

  def _create_s3_bucket(self) -> s3.Bucket:
    bucket = s3.Bucket(
        self, "EcommerceBucket",
        bucket_name=f"ecommerce-assets-testing-buc-{self.account}-{self.region}",
        versioned=True,
        encryption=s3.BucketEncryption.S3_MANAGED,
        block_public_access=s3.BlockPublicAccess.BLOCK_ALL,
        removal_policy=RemovalPolicy.DESTROY if IS_LOCALSTACK else RemovalPolicy.RETAIN,
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
    db_subnet_group = rds.SubnetGroup(
        self, "EcommerceDbSubnetGroup",
        description="Subnet group for e-commerce database",
        vpc=self.vpc,
        vpc_subnets=ec2.SubnetSelection(
        subnet_type=ec2.SubnetType.PRIVATE_WITH_EGRESS
        )
    )

    db_security_group = ec2.SecurityGroup(
        self, "EcommerceDbSecurityGroup",
        vpc=self.vpc,
        description="Security group for e-commerce database",
        allow_all_outbound=False
    )

    app_security_group = ec2.SecurityGroup(
        self, "EcommerceAppSecurityGroup",
        vpc=self.vpc,
        description="Security group for application services"
    )

    db_security_group.add_ingress_rule(
        peer=app_security_group,
        connection=ec2.Port.tcp(5432),
        description="Allow PostgreSQL access from application services"
    )

    self.app_security_group = app_security_group

    rds_instance = rds.DatabaseInstance(
        self, "EcommerceDatabase",
        engine=rds.DatabaseInstanceEngine.postgres(
        version=rds.PostgresEngineVersion.VER_15_12
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
        multi_az=False if IS_LOCALSTACK else True,
        storage_encrypted=True,
        deletion_protection=False if IS_LOCALSTACK else True,
        delete_automated_backups=False,
        removal_policy=RemovalPolicy.DESTROY if IS_LOCALSTACK else RemovalPolicy.RETAIN,
        parameter_group=rds.ParameterGroup.from_parameter_group_name(
        self, "EcommerceDbParameterGroup",
        "default.postgres15"
        )
    )
    return rds_instance

    def _create_rds_access_role(self) -> iam.Role:
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

    rds_policy = iam.Policy(
        self, "EcommerceRdsAccessPolicy",
        statements=[
        iam.PolicyStatement(
            effect=iam.Effect.ALLOW,
            actions=["rds-db:connect"],
            resources=[
            f"arn:aws:rds-db:{self.region}:{self.account}:dbuser:{self.rds_instance.instance_resource_id}/ecommerce_app"
            ]
        ),
        iam.PolicyStatement(
            effect=iam.Effect.ALLOW,
            actions=[
            "secretsmanager:GetSecretValue",
            "secretsmanager:DescribeSecret"
            ],
            resources=[self.rds_instance.secret.secret_arn]
        )
        ]
    )

    role.attach_inline_policy(rds_policy)
    return role

    def _create_s3_access_role(self) -> iam.Role:
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

    s3_policy = iam.Policy(
        self, "EcommerceS3AccessPolicy",
        statements=[
        iam.PolicyStatement(
            effect=iam.Effect.ALLOW,
            actions=["s3:GetObject", "s3:PutObject", "s3:DeleteObject"],
            resources=[f"{self.s3_bucket.bucket_arn}/*"]
        ),
        iam.PolicyStatement(
            effect=iam.Effect.ALLOW,
            actions=["s3:ListBucket"],
            resources=[self.s3_bucket.bucket_arn]
        )
        ]
    )

    role.attach_inline_policy(s3_policy)
    return role

    def _create_cloudfront_distribution(self) -> cloudfront.CfnDistribution:
    origin_id = "S3Origin"

    if IS_LOCALSTACK:
        # Use OAI for LocalStack (legacy approach)
        origin_property = cloudfront.CfnDistribution.OriginProperty(
        id=origin_id,
        domain_name=self.s3_bucket.bucket_regional_domain_name,
        s3_origin_config=cloudfront.CfnDistribution.S3OriginConfigProperty(
            origin_access_identity=f"origin-access-identity/cloudfront/{self.oai.ref}"
        )
        )
    else:
        # Use OAC for AWS (modern approach)
        origin_property = cloudfront.CfnDistribution.OriginProperty(
        id=origin_id,
        domain_name=self.s3_bucket.bucket_regional_domain_name,
        s3_origin_config=cloudfront.CfnDistribution.S3OriginConfigProperty(),
        origin_access_control_id=self.oac.attr_id
        )

    distribution = cloudfront.CfnDistribution(
        self, "EcommerceDistribution",
        distribution_config=cloudfront.CfnDistribution.DistributionConfigProperty(
        enabled=True,
        default_root_object="index.html",
        price_class="PriceClass_100",
        origins=[origin_property],
        default_cache_behavior=cloudfront.CfnDistribution.DefaultCacheBehaviorProperty(
            target_origin_id=origin_id,
            viewer_protocol_policy="redirect-to-https",
            allowed_methods=["GET", "HEAD", "OPTIONS"],
            cached_methods=["GET", "HEAD", "OPTIONS"],
            compress=True,
            cache_policy_id="658327ea-f89d-4fab-a63d-7e88639e58f6"  # CACHING_OPTIMIZED managed policy
        )
        )
    )

    return distribution

  def _update_s3_bucket_policy(self):
    statements = []

    if IS_LOCALSTACK:
        # OAI approach for LocalStack
        statements.append(
        iam.PolicyStatement(
            sid="AllowCloudFrontOAI",
            effect=iam.Effect.ALLOW,
            principals=[iam.CanonicalUserPrincipal(
            self.oai.attr_s3_canonical_user_id
            )],
            actions=["s3:GetObject"],
            resources=[f"{self.s3_bucket.bucket_arn}/*"]
        )
        )
    else:
        # OAC approach for AWS
        statements.append(
        iam.PolicyStatement(
            sid="AllowCloudFrontServicePrincipal",
            effect=iam.Effect.ALLOW,
            principals=[iam.ServicePrincipal("cloudfront.amazonaws.com")],
            actions=["s3:GetObject"],
            resources=[f"{self.s3_bucket.bucket_arn}/*"],
            conditions={
            "StringEquals": {
                "AWS:SourceArn": f"arn:aws:cloudfront::{self.account}:distribution/{self.cloudfront_distribution.attr_id}"
            }
            }
        )
        )

    # Deny insecure transport (common to both)
    statements.append(
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
    )

    bucket_policy = iam.PolicyDocument(statements=statements)

    s3.CfnBucketPolicy(
        self, "EcommerceBucketPolicy",
        bucket=self.s3_bucket.bucket_name,
        policy_document=bucket_policy.to_json()
    )
  
    def _create_stack_outputs(self):
    """Creates CloudFormation outputs for key resources."""
    CfnOutput(
        self, "S3BucketNameOutput",
        value=self.s3_bucket.bucket_name,
        description="Name of the e-commerce S3 assets bucket"
    )
    CfnOutput(
        self, "CloudFrontDomainOutput",
        # Use .attr_domain_name for CfnDistribution
        value=self.cloudfront_distribution.attr_domain_name,
        description="Domain name of the CloudFront distribution"
    )
    CfnOutput(
        self, "RdsEndpointOutput",
        value=self.rds_instance.db_instance_endpoint_address,
        description="Endpoint address of the RDS database instance"
    )
    CfnOutput(
        self, "RdsSecretArnOutput",
        value=self.rds_instance.secret.secret_arn,
        description="ARN of the Secrets Manager secret for RDS credentials"
    )
