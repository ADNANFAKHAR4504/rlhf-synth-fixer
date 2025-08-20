# Multi-Environment CDK Python Infrastructure Response

Based on the requirements in PROMPT.md, I have implemented a comprehensive multi-environment infrastructure solution using AWS CDK Python. The solution creates three isolated environments (Development, Staging, Production) with the following components:

## Architecture Overview

The implementation uses nested stacks to organize resources and manage dependencies properly. Each environment includes:

- Isolated VPC with public and private subnets
- S3 buckets with versioning and server-side encryption
- IAM roles and policies for environment-specific access
- Application Load Balancer with health checks
- RDS MySQL instances with automated backups
- All resources deployed in us-east-1 region

## File Structure

### lib/multi_env_infrastructure.py

```python
"""
Multi-environment infrastructure module for CDK Python.

This module implements a comprehensive multi-environment AWS infrastructure
supporting Development, Staging, and Production environments. Each environment
is isolated with separate VPCs and includes S3 buckets, load balancers,
and RDS instances with proper security configurations.
"""

from typing import Optional
import aws_cdk as cdk
from aws_cdk import (
    NestedStack,
    CfnOutput,
    RemovalPolicy,
    Duration
)
from aws_cdk import aws_ec2 as ec2
from aws_cdk import aws_s3 as s3
from aws_cdk import aws_iam as iam
from aws_cdk import aws_elasticloadbalancingv2 as elbv2
from aws_cdk import aws_rds as rds
from constructs import Construct


class NetworkStackProps(cdk.NestedStackProps):
    """Properties for the Network nested stack."""

    def __init__(self, environment_name: str, **kwargs):
        super().__init__(**kwargs)
        self.environment_name = environment_name


class NetworkStack(NestedStack):
    """Nested stack for VPC and networking resources."""

    def __init__(self, scope: Construct, construct_id: str, props: NetworkStackProps, **kwargs):
        super().__init__(scope, construct_id, **kwargs)

        # Create VPC with public and private subnets
        self.vpc = ec2.Vpc(
            self,
            f"VPC{props.environment_name}",
            vpc_name=f"vpc-{props.environment_name.lower()}",
            ip_addresses=ec2.IpAddresses.cidr("10.0.0.0/16"),
            max_azs=2,
            subnet_configuration=[
                ec2.SubnetConfiguration(
                    name=f"Public{props.environment_name}",
                    subnet_type=ec2.SubnetType.PUBLIC,
                    cidr_mask=24
                ),
                ec2.SubnetConfiguration(
                    name=f"Private{props.environment_name}",
                    subnet_type=ec2.SubnetType.PRIVATE_WITH_EGRESS,
                    cidr_mask=24
                )
            ]
        )

        # Security group for ALB
        self.alb_security_group = ec2.SecurityGroup(
            self,
            f"ALBSecurityGroup{props.environment_name}",
            vpc=self.vpc,
            description=f"Security group for ALB in {props.environment_name}",
            allow_all_outbound=True
        )

        # Allow HTTP traffic to ALB
        self.alb_security_group.add_ingress_rule(
            peer=ec2.Peer.any_ipv4(),
            connection=ec2.Port.tcp(80),
            description="Allow HTTP traffic"
        )

        # Security group for RDS
        self.rds_security_group = ec2.SecurityGroup(
            self,
            f"RDSSecurityGroup{props.environment_name}",
            vpc=self.vpc,
            description=f"Security group for RDS in {props.environment_name}",
            allow_all_outbound=False
        )

        # Allow MySQL traffic from ALB security group
        self.rds_security_group.add_ingress_rule(
            peer=self.alb_security_group,
            connection=ec2.Port.tcp(3306),
            description="Allow MySQL traffic from ALB"
        )


class StorageStackProps(cdk.NestedStackProps):
    """Properties for the Storage nested stack."""

    def __init__(self, environment_name: str, environment_suffix: str, **kwargs):
        super().__init__(**kwargs)
        self.environment_name = environment_name
        self.environment_suffix = environment_suffix


class StorageStack(NestedStack):
    """Nested stack for S3 storage resources."""

    def __init__(self, scope: Construct, construct_id: str, props: StorageStackProps, **kwargs):
        super().__init__(scope, construct_id, **kwargs)

        # Determine removal policy based on environment
        removal_policy = RemovalPolicy.RETAIN if props.environment_name == "Production" else RemovalPolicy.DESTROY

        # Create S3 bucket with versioning and encryption
        self.bucket = s3.Bucket(
            self,
            f"Bucket{props.environment_name}",
            bucket_name=f"multi-env-bucket-{props.environment_name.lower()}-{props.environment_suffix}",
            versioned=True,
            encryption=s3.BucketEncryption.S3_MANAGED,
            block_public_access=s3.BlockPublicAccess.BLOCK_ALL,
            removal_policy=removal_policy,
            auto_delete_objects=removal_policy == RemovalPolicy.DESTROY
        )


class IAMStackProps(cdk.NestedStackProps):
    """Properties for the IAM nested stack."""

    def __init__(self, environment_name: str, bucket_arn: str, **kwargs):
        super().__init__(**kwargs)
        self.environment_name = environment_name
        self.bucket_arn = bucket_arn


class IAMStack(NestedStack):
    """Nested stack for IAM roles and policies."""

    def __init__(self, scope: Construct, construct_id: str, props: IAMStackProps, **kwargs):
        super().__init__(scope, construct_id, **kwargs)

        # Create environment-specific IAM role
        self.environment_role = iam.Role(
            self,
            f"EnvironmentRole{props.environment_name}",
            role_name=f"MultiEnvRole{props.environment_name}",
            assumed_by=iam.ServicePrincipal("ec2.amazonaws.com"),
            description=f"IAM role for {props.environment_name} environment"
        )

        # Create policy for S3 access specific to this environment
        s3_policy = iam.PolicyStatement(
            effect=iam.Effect.ALLOW,
            actions=[
                "s3:GetObject",
                "s3:PutObject",
                "s3:DeleteObject",
                "s3:ListBucket"
            ],
            resources=[
                props.bucket_arn,
                f"{props.bucket_arn}/*"
            ]
        )

        # Attach policy to role
        self.environment_role.add_to_policy(s3_policy)

        # Create instance profile for EC2
        self.instance_profile = iam.CfnInstanceProfile(
            self,
            f"InstanceProfile{props.environment_name}",
            instance_profile_name=f"MultiEnvInstanceProfile{props.environment_name}",
            roles=[self.environment_role.role_name]
        )


class LoadBalancerStackProps(cdk.NestedStackProps):
    """Properties for the Load Balancer nested stack."""

    def __init__(self, environment_name: str, vpc: ec2.Vpc, security_group: ec2.SecurityGroup, **kwargs):
        super().__init__(**kwargs)
        self.environment_name = environment_name
        self.vpc = vpc
        self.security_group = security_group


class LoadBalancerStack(NestedStack):
    """Nested stack for Application Load Balancer resources."""

    def __init__(self, scope: Construct, construct_id: str, props: LoadBalancerStackProps, **kwargs):
        super().__init__(scope, construct_id, **kwargs)

        # Create Application Load Balancer
        self.alb = elbv2.ApplicationLoadBalancer(
            self,
            f"ALB{props.environment_name}",
            load_balancer_name=f"alb-{props.environment_name.lower()}",
            vpc=props.vpc,
            internet_facing=True,
            security_group=props.security_group
        )

        # Create target group with health checks
        self.target_group = elbv2.ApplicationTargetGroup(
            self,
            f"TargetGroup{props.environment_name}",
            target_group_name=f"tg-{props.environment_name.lower()}",
            port=80,
            protocol=elbv2.ApplicationProtocol.HTTP,
            vpc=props.vpc,
            health_check=elbv2.HealthCheck(
                enabled=True,
                healthy_threshold_count=2,
                unhealthy_threshold_count=3,
                timeout=Duration.seconds(10),
                interval=Duration.seconds(30),
                path="/health",
                protocol=elbv2.Protocol.HTTP
            )
        )

        # Create listener
        self.listener = self.alb.add_listener(
            f"Listener{props.environment_name}",
            port=80,
            protocol=elbv2.ApplicationProtocol.HTTP,
            default_target_groups=[self.target_group]
        )


class DatabaseStackProps(cdk.NestedStackProps):
    """Properties for the Database nested stack."""

    def __init__(self, environment_name: str, vpc: ec2.Vpc, security_group: ec2.SecurityGroup, **kwargs):
        super().__init__(**kwargs)
        self.environment_name = environment_name
        self.vpc = vpc
        self.security_group = security_group


class DatabaseStack(NestedStack):
    """Nested stack for RDS database resources."""

    def __init__(self, scope: Construct, construct_id: str, props: DatabaseStackProps, **kwargs):
        super().__init__(scope, construct_id, **kwargs)

        # Create subnet group for RDS
        subnet_group = rds.SubnetGroup(
            self,
            f"SubnetGroup{props.environment_name}",
            description=f"Subnet group for RDS in {props.environment_name}",
            vpc=props.vpc,
            vpc_subnets=ec2.SubnetSelection(subnet_type=ec2.SubnetType.PRIVATE_WITH_EGRESS)
        )

        # Determine deletion protection based on environment
        deletion_protection = props.environment_name == "Production"

        # Create RDS instance
        self.database = rds.DatabaseInstance(
            self,
            f"Database{props.environment_name}",
            identifier=f"db-{props.environment_name.lower()}",
            engine=rds.DatabaseInstanceEngine.mysql(
                version=rds.MysqlEngineVersion.VER_8_0_39
            ),
            instance_type=ec2.InstanceType.of(
                instance_class=ec2.InstanceClass.BURSTABLE3,
                instance_size=ec2.InstanceSize.MICRO
            ),
            vpc=props.vpc,
            security_groups=[props.security_group],
            subnet_group=subnet_group,
            database_name="multienvdb",
            credentials=rds.Credentials.from_generated_secret("admin"),
            allocated_storage=20,
            storage_encrypted=True,
            backup_retention=Duration.days(7 if props.environment_name == "Production" else 1),
            deletion_protection=deletion_protection,
            delete_automated_backups=not deletion_protection,
            removal_policy=RemovalPolicy.RETAIN if deletion_protection else RemovalPolicy.DESTROY
        )


class MultiEnvInfrastructureProps(cdk.StackProps):
    """Properties for the MultiEnvInfrastructure stack."""

    def __init__(self, environment_suffix: Optional[str] = None, **kwargs):
        super().__init__(**kwargs)
        self.environment_suffix = environment_suffix or "dev"


class MultiEnvInfrastructure(cdk.Stack):
    """
    Main stack that orchestrates multi-environment infrastructure deployment.

    This stack creates three isolated environments (Development, Staging, Production)
    each with their own VPC, S3 buckets, IAM roles, load balancers, and RDS instances.
    """

    def __init__(self, scope: Construct, construct_id: str, props: Optional[MultiEnvInfrastructureProps] = None, **kwargs):
        super().__init__(scope, construct_id, **kwargs)

        if props is None:
            props = MultiEnvInfrastructureProps()

        # Define environments to deploy
        environments = ["Development", "Staging", "Production"]

        # Store references for outputs
        self.vpc_outputs = {}
        self.bucket_outputs = {}
        self.alb_outputs = {}
        self.database_outputs = {}

        # Create infrastructure for each environment
        for env_name in environments:
            # Create network stack (VPC, security groups)
            network_stack = NetworkStack(
                self,
                f"NetworkStack{env_name}",
                props=NetworkStackProps(environment_name=env_name)
            )

            # Create storage stack (S3)
            storage_stack = StorageStack(
                self,
                f"StorageStack{env_name}",
                props=StorageStackProps(
                    environment_name=env_name,
                    environment_suffix=props.environment_suffix
                )
            )

            # Create IAM stack
            iam_stack = IAMStack(
                self,
                f"IAMStack{env_name}",
                props=IAMStackProps(
                    environment_name=env_name,
                    bucket_arn=storage_stack.bucket.bucket_arn
                )
            )

            # Create load balancer stack
            lb_stack = LoadBalancerStack(
                self,
                f"LoadBalancerStack{env_name}",
                props=LoadBalancerStackProps(
                    environment_name=env_name,
                    vpc=network_stack.vpc,
                    security_group=network_stack.alb_security_group
                )
            )

            # Create database stack
            db_stack = DatabaseStack(
                self,
                f"DatabaseStack{env_name}",
                props=DatabaseStackProps(
                    environment_name=env_name,
                    vpc=network_stack.vpc,
                    security_group=network_stack.rds_security_group
                )
            )

            # Create outputs for integration testing
            self.vpc_outputs[env_name] = CfnOutput(
                self,
                f"VPCId{env_name}",
                value=network_stack.vpc.vpc_id,
                description=f"VPC ID for {env_name} environment"
            )

            self.bucket_outputs[env_name] = CfnOutput(
                self,
                f"BucketName{env_name}",
                value=storage_stack.bucket.bucket_name,
                description=f"S3 bucket name for {env_name} environment"
            )

            self.alb_outputs[env_name] = CfnOutput(
                self,
                f"ALBDNSName{env_name}",
                value=lb_stack.alb.load_balancer_dns_name,
                description=f"ALB DNS name for {env_name} environment"
            )

            self.database_outputs[env_name] = CfnOutput(
                self,
                f"DatabaseEndpoint{env_name}",
                value=db_stack.database.instance_endpoint.hostname,
                description=f"RDS endpoint for {env_name} environment"
            )
```

### lib/tap_stack.py

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

# Import the multi-environment infrastructure
from .multi_env_infrastructure import MultiEnvInfrastructure, MultiEnvInfrastructureProps


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
    multi_env_infrastructure (MultiEnvInfrastructure): The multi-environment infrastructure stack.
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

    # Create the multi-environment infrastructure as a nested stack
    class NestedMultiEnvInfrastructureStack(NestedStack):
      def __init__(self, scope, id, props=None, **kwargs):
        super().__init__(scope, id, **kwargs)

        # Create the multi-environment infrastructure
        self.multi_env_infrastructure = MultiEnvInfrastructure(
            self,
            "MultiEnvResource",
            props=props
        )

        # Expose outputs for easy access
        self.vpc_outputs = self.multi_env_infrastructure.vpc_outputs
        self.bucket_outputs = self.multi_env_infrastructure.bucket_outputs
        self.alb_outputs = self.multi_env_infrastructure.alb_outputs
        self.database_outputs = self.multi_env_infrastructure.database_outputs

    # Create properties for the multi-environment infrastructure
    multi_env_props = MultiEnvInfrastructureProps(
        environment_suffix=environment_suffix
    )

    # Instantiate the nested multi-environment infrastructure stack
    self.multi_env_stack = NestedMultiEnvInfrastructureStack(
        self,
        f"MultiEnvInfrastructureStack{environment_suffix}",
        props=multi_env_props
    )

    # Make the infrastructure components available as properties of this stack
    self.vpc_outputs = self.multi_env_stack.vpc_outputs
    self.bucket_outputs = self.multi_env_stack.bucket_outputs
    self.alb_outputs = self.multi_env_stack.alb_outputs
    self.database_outputs = self.multi_env_stack.database_outputs
```

## Key Features Implemented

### 1. Multi-Environment Support

- Three isolated environments: Development, Staging, Production
- Environment-specific resource naming using environment suffix
- Different retention policies for Production vs non-Production

### 2. Network Isolation

- Each environment has its own VPC with 10.0.0.0/16 CIDR
- Public and private subnets across 2 AZs
- Security groups with minimal required access

### 3. Storage Components

- S3 buckets with versioning enabled
- Server-side encryption (S3-managed)
- Block public access enabled
- Environment-specific bucket names with suffix

### 4. IAM Security

- Environment-specific IAM roles
- Principle of least privilege
- S3 access limited to environment-specific buckets
- EC2 instance profiles for service access

### 5. Load Balancing

- Application Load Balancer per environment
- Internet-facing with proper security groups
- Target groups with health checks configured
- Health check path: /health

### 6. Database Resources

- RDS MySQL 8.0.39 instances
- Automated backups enabled (7 days for Production, 1 day for others)
- Storage encryption enabled
- Subnet groups for proper placement
- Generated secrets for credentials

### 7. Regional Deployment

- All resources deployed in us-east-1 region
- Region specified in CDK environment configuration

### 8. Resource Management

- Production resources have RETAIN policy for safety
- Non-production resources use DESTROY policy for easy cleanup
- Deletion protection enabled for Production database
- Auto-delete objects for non-production S3 buckets

### 9. Integration Testing Support

- CfnOutputs for VPC IDs, bucket names, ALB DNS names, and database endpoints
- Outputs organized by environment for easy access
- All outputs accessible through TapStack properties

The implementation successfully meets all requirements from the PROMPT.md file and provides a robust, scalable multi-environment infrastructure that can be easily deployed and managed through AWS CDK.
