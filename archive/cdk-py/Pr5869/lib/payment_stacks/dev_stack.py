"""dev_stack.py

Development environment stack for payment processing infrastructure.
"""

from typing import Dict, Any
from aws_cdk import aws_ec2 as ec2
from constructs import Construct
from lib.payment_stacks.base_payment_stack import BasePaymentStack


class DevPaymentStack(BasePaymentStack):
    """Development environment payment processing stack."""

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
        return "dev"

    def get_vpc_cidr(self) -> str:
        return "10.0.0.0/16"

    def get_db_instance_type(self) -> ec2.InstanceType:
        return ec2.InstanceType.of(
            ec2.InstanceClass.BURSTABLE3,
            ec2.InstanceSize.MEDIUM
        )

    def get_min_capacity(self) -> int:
        return 1

    def get_max_capacity(self) -> int:
        return 5

    def get_alarm_thresholds(self) -> Dict[str, Any]:
        return {
            "cpu_threshold": 80,
            "memory_threshold": 80,
            "response_time_threshold": 5000,
            "error_rate_threshold": 10
        }