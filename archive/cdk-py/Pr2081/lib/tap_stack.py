"""tap_stack.py
Enhanced TapStack class orchestrating all infrastructure components
for a production-ready AWS environment.
"""

from typing import Optional
import aws_cdk as cdk
from constructs import Construct

from .networking_stack import NetworkingStack
from .database_stack import DatabaseStack
from .compute_stack import ComputeStack
from .storage_stack import StorageStack
from .monitoring_stack import MonitoringStack
from .apprunner_stack import AppRunnerStack
from .lattice_stack import LatticeStack


class TapStackProps(cdk.StackProps):
    """Properties for the TapStack CDK stack."""

    def __init__(self, environment_suffix: Optional[str] = None, **kwargs):
        super().__init__(**kwargs)
        self.environment_suffix = environment_suffix


class TapStack(cdk.Stack):
    """
    Main CDK stack orchestrating all infrastructure components
    for a production-ready AWS environment.
    """

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

        # 1. Networking Layer - VPC, Subnets, Security Groups
        self.networking = NetworkingStack(
            self, f"prod-networking-{environment_suffix}",
            environment_suffix=environment_suffix
        )

        # 2. Storage Layer - S3 buckets with logging
        self.storage = StorageStack(
            self, f"prod-storage-{environment_suffix}",
            environment_suffix=environment_suffix
        )

        # 3. Database Layer - RDS with proper security
        self.database = DatabaseStack(
            self, f"prod-database-{environment_suffix}",
            vpc=self.networking.vpc,
            database_security_group=self.networking.database_sg,
            environment_suffix=environment_suffix
        )

        # 4. Compute Layer - ALB, ASG, EC2
        self.compute = ComputeStack(
            self, f"prod-compute-{environment_suffix}",
            vpc=self.networking.vpc,
            alb_security_group=self.networking.alb_sg,
            web_security_group=self.networking.web_sg,
            environment_suffix=environment_suffix
        )

        # 5. Modern AWS Services
        self.apprunner = AppRunnerStack(
            self, f"prod-apprunner-{environment_suffix}",
            vpc=self.networking.vpc,
            environment_suffix=environment_suffix
        )

        self.lattice = LatticeStack(
            self, f"prod-lattice-{environment_suffix}",
            vpc=self.networking.vpc,
            environment_suffix=environment_suffix
        )

        # 6. Monitoring Layer - CloudWatch alarms
        self.monitoring = MonitoringStack(
            self, f"prod-monitoring-{environment_suffix}",
            load_balancer=self.compute.load_balancer,
            auto_scaling_group=self.compute.auto_scaling_group,
            environment_suffix=environment_suffix
        )

        # Outputs
        cdk.CfnOutput(
            self, "VPCId",
            value=self.networking.vpc.vpc_id,
            description="VPC ID for the production environment"
        )

        cdk.CfnOutput(
            self, "LoadBalancerDNS",
            value=self.compute.load_balancer.load_balancer_dns_name,
            description="Application Load Balancer DNS name"
        )

        cdk.CfnOutput(
            self, "DatabaseEndpoint",
            value=self.database.database.instance_endpoint.hostname,
            description="RDS database endpoint"
        )
