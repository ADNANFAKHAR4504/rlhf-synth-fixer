# nested_region_stack.py
from aws_cdk import NestedStack
from constructs import Construct
from dataclasses import dataclass
from aws_cdk import Environment
from .route53_stack import Route53Stack
from .kms_stack import KmsStack
from .vpc_stack import VpcStack
from .alb_stack import AlbStack
from .database_stack import DatabaseStack 
from .monitoring_stack import MonitoringStack
@dataclass
class RegionStackProps:
    environment_suffix: str
    env: Environment

class NestedRegionStack(NestedStack):
    def __init__(self, scope: Construct, id: str, *, props: RegionStackProps, **kwargs):
        super().__init__(scope, id, **kwargs)

        # KMS
        self.kms_stack = KmsStack(self, f"KmsStack-{props.environment_suffix}", env=props.env)

        # VPC
        self.vpc_stack = VpcStack(self, f"VpcStack-{props.environment_suffix}", env=props.env)

        # Database
        self.database_stack = DatabaseStack(
            self, f"DatabaseStack-{props.environment_suffix}",
            vpc=self.vpc_stack.vpc,
            kms_key=self.kms_stack.key,
            env=props.env
        )

        # ALB
        self.alb_stack = AlbStack(
            self, f"AlbStack-{props.environment_suffix}",
            vpc=self.vpc_stack.vpc,
            env=props.env
        )

        # Monitoring
        self.monitoring_stack = MonitoringStack(
            self, f"MonitoringStack-{props.environment_suffix}",
            env=props.env
        )

        # Optional: expose resources
        self.vpc = self.vpc_stack.vpc
        self.kms_key = self.kms_stack.key
