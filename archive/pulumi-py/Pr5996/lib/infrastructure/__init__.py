"""
Infrastructure package for AWS VPC deployment.

This package contains modular infrastructure components:
- config: Centralized configuration
- aws_provider: AWS provider management
- networking: VPC, subnets, NAT gateways, Flow Logs
- security: Security groups
- iam: IAM roles and policies
- compute: EC2 instances
- monitoring: CloudWatch alarms and SNS
"""

from .aws_provider import AWSProviderManager
from .compute import ComputeStack
from .config import InfraConfig
from .iam import IAMStack
from .monitoring import MonitoringStack
from .networking import NetworkingStack
from .security import SecurityStack
from .storage import StorageStack

__all__ = [
    'InfraConfig',
    'AWSProviderManager',
    'NetworkingStack',
    'SecurityStack',
    'IAMStack',
    'StorageStack',
    'ComputeStack',
    'MonitoringStack',
]

