"""Main CDK stack orchestrating all infrastructure components."""

from typing import Optional
import aws_cdk as cdk
from constructs import Construct
from .vpc_stack import VpcStack
from .security_stack import SecurityStack
from .compute_stack import ComputeStack
from .database_stack import DatabaseStack
from .storage_stack import StorageStack
from .monitoring_stack import MonitoringStack


class TapStackProps(cdk.StackProps):
    """Properties for the TapStack CDK stack."""

    def __init__(self, environment_suffix: Optional[str] = None, **kwargs):
        super().__init__(**kwargs)
        self.environment_suffix = environment_suffix


class TapStack(cdk.Stack):
    """Main CDK stack for highly available web application infrastructure."""

    def __init__(
        self,
        scope: Construct,
        construct_id: str,
        props: Optional[TapStackProps] = None,
        **kwargs
    ):
        super().__init__(scope, construct_id, **kwargs)

        # Get environment suffix
        environment_suffix = (
            props.environment_suffix if props else None
        ) or self.node.try_get_context('environmentSuffix') or 'dev'

        # Create VPC infrastructure
        vpc_stack = VpcStack(
            self,
            f"VpcStack{environment_suffix}",
            environment_suffix=environment_suffix,
        )

        # Create security resources
        security_stack = SecurityStack(
            self,
            f"SecurityStack{environment_suffix}",
            vpc=vpc_stack.vpc,
            environment_suffix=environment_suffix,
        )

        # Create storage resources
        storage_stack = StorageStack(
            self,
            f"StorageStack{environment_suffix}",
            environment_suffix=environment_suffix,
        )

        # Create compute resources
        compute_stack = ComputeStack(
            self,
            f"ComputeStack{environment_suffix}",
            vpc=vpc_stack.vpc,
            web_security_group=security_stack.web_security_group,
            alb_security_group=security_stack.alb_security_group,
            instance_profile=security_stack.instance_profile,
            environment_suffix=environment_suffix,
        )

        # Create database resources
        database_stack = DatabaseStack(
            self,
            f"DatabaseStack{environment_suffix}",
            vpc=vpc_stack.vpc,
            db_security_group=security_stack.db_security_group,
            environment_suffix=environment_suffix,
        )

        # Create monitoring resources
        monitoring_stack = MonitoringStack(
            self,
            f"MonitoringStack{environment_suffix}",
            asg=compute_stack.asg,
            database=database_stack.database,
            alb=compute_stack.alb,
            target_group=compute_stack.target_group,
            environment_suffix=environment_suffix,
        )

        # Add stack-level outputs
        cdk.CfnOutput(
            self,
            "ApplicationUrl",
            value=f"http://{compute_stack.alb.load_balancer_dns_name}",
            description="Application Load Balancer URL",
        )

        cdk.CfnOutput(
            self,
            "DatabaseEndpoint",
            value=database_stack.database.instance_endpoint.hostname,
            description="RDS Database endpoint",
        )

        cdk.CfnOutput(
            self,
            "StaticAssetsUrl",
            value=storage_stack.static_assets_bucket.bucket_website_url,
            description="Static assets S3 website URL",
        )

        # Add tags to all resources
        cdk.Tags.of(self).add("Environment", "production")
        cdk.Tags.of(self).add("Application", "WebApp")
        cdk.Tags.of(self).add("ManagedBy", "CDK")
