"""prod_stack.py

Production environment stack for payment processing infrastructure.
"""

from typing import Dict, Any
from aws_cdk import aws_ec2 as ec2
from constructs import Construct
from lib.payment_stacks.base_payment_stack import BasePaymentStack


class ProdPaymentStack(BasePaymentStack):
    """Production environment payment processing stack."""

    def __init__(
        self,
        scope: Construct,
        construct_id: str,
        environment_suffix: str,
        **kwargs
    ):
        super().__init__(
            scope,
            construct_id,
            environment_suffix=environment_suffix,
            **kwargs
        )

    def get_environment_name(self) -> str:
        return "prod"

    def get_vpc_cidr(self) -> str:
        return "10.2.0.0/16"

    def get_db_instance_type(self) -> ec2.InstanceType:
        return ec2.InstanceType.of(
            ec2.InstanceClass.MEMORY6_GRAVITON,
            ec2.InstanceSize.LARGE
        )

    def get_min_capacity(self) -> int:
        return 2

    def get_max_capacity(self) -> int:
        return 10

    def get_alarm_thresholds(self) -> Dict[str, Any]:
        return {
            "cpu_threshold": 70,
            "memory_threshold": 70,
            "response_time_threshold": 2000,
            "error_rate_threshold": 1
        }