"""CDKTF stacks for multi-region disaster recovery"""

from .network_stack import NetworkStack
from .compute_stack import ComputeStack
from .api_stack import ApiStack
from .database_stack import DatabaseStack
from .storage_stack import StorageStack
from .routing_stack import RoutingStack
from .events_stack import EventsStack
from .backup_stack import BackupStack
from .monitoring_stack import MonitoringStack

__all__ = [
    "NetworkStack",
    "ComputeStack",
    "ApiStack",
    "DatabaseStack",
    "StorageStack",
    "RoutingStack",
    "EventsStack",
    "BackupStack",
    "MonitoringStack",
]
