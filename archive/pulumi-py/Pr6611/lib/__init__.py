"""
Pulumi infrastructure library for secure AWS foundation.

This package contains modular components for:
- Networking: VPC, subnets, NAT instances
- Security: KMS, Parameter Store, IAM
- Monitoring: VPC Flow Logs, CloudWatch
- Automation: Lambda functions, EventBridge
"""

from .tap_stack import TapStack, TapStackArgs
from .networking_stack import NetworkingStack, NetworkingStackArgs
from .security_stack import SecurityStack, SecurityStackArgs
from .monitoring_stack import MonitoringStack, MonitoringStackArgs
from .automation_stack import AutomationStack, AutomationStackArgs

__all__ = [
    "TapStack",
    "TapStackArgs",
    "NetworkingStack",
    "NetworkingStackArgs",
    "SecurityStack",
    "SecurityStackArgs",
    "MonitoringStack",
    "MonitoringStackArgs",
    "AutomationStack",
    "AutomationStackArgs"
]
