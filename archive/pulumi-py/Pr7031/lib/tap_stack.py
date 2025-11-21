"""
TapStack - Main orchestration component
"""

from typing import Dict, Optional

import pulumi
from pulumi import ResourceOptions

from .alb_stack import AlbStack, AlbStackArgs
from .database_stack import DatabaseStack, DatabaseStackArgs
from .ecs_stack import EcsStack, EcsStackArgs
from .iam_stack import IamStack, IamStackArgs
from .monitoring_stack import MonitoringStack, MonitoringStackArgs
from .networking_stack import NetworkingStack, NetworkingStackArgs
from .storage_stack import StorageStack, StorageStackArgs


class TapStackArgs:
    """
    TapStackArgs defines the input arguments for the TapStack Pulumi component.

    Args:
        environment_suffix (Optional[str]): An optional suffix for identifying the deployment environment.
        tags (Optional[dict]): Optional default tags to apply to resources.
    """

    def __init__(self, environment_suffix: Optional[str] = None, tags: Optional[Dict[str, str]] = None):
        self.environment_suffix = environment_suffix or 'dev'
        self.tags = tags or {
            "Environment": environment_suffix or "dev",
            "CostCenter": "FinTech",
            "ComplianceLevel": "PCI-DSS"
        }


class TapStack(pulumi.ComponentResource):
    """
    Main Pulumi component for loan processing infrastructure.
    Orchestrates all sub-components in the correct dependency order.
    """

    def __init__(
        self,
        name: str,
        args: TapStackArgs,
        opts: Optional[ResourceOptions] = None
    ):
        super().__init__('tap:stack:TapStack', name, None, opts)

        self.environment_suffix = args.environment_suffix
        self.tags = args.tags

        # 1. Storage Stack (KMS key and S3 bucket)
        storage_stack = StorageStack(
            f"storage-{self.environment_suffix}",
            StorageStackArgs(
                environment_suffix=self.environment_suffix,
                tags=self.tags
            ),
            ResourceOptions(parent=self)
        )

        # 2. Monitoring Stack (CloudWatch log groups)
        monitoring_stack = MonitoringStack(
            f"monitoring-{self.environment_suffix}",
            MonitoringStackArgs(
                environment_suffix=self.environment_suffix,
                tags=self.tags
            ),
            ResourceOptions(parent=self)
        )

        # 3. Networking Stack (VPC, Subnets, Security Groups)
        networking_stack = NetworkingStack(
            f"networking-{self.environment_suffix}",
            NetworkingStackArgs(
                environment_suffix=self.environment_suffix,
                vpc_cidr="10.0.0.0/16",
                azs=["eu-west-2a", "eu-west-2b", "eu-west-2c"],
                tags=self.tags
            ),
            ResourceOptions(parent=self)
        )

        # 4. Database Stack (RDS Aurora Serverless v2)
        database_stack = DatabaseStack(
            f"database-{self.environment_suffix}",
            DatabaseStackArgs(
                environment_suffix=self.environment_suffix,
                vpc_id=networking_stack.vpc.id,
                database_subnet_ids=[s.id for s in networking_stack.database_subnets],
                rds_sg_id=networking_stack.rds_sg.id,
                kms_key_id=storage_stack.kms_key.arn,
                tags=self.tags
            ),
            ResourceOptions(parent=self, depends_on=[networking_stack, storage_stack])
        )

        # 5. IAM Stack (Roles and Policies)
        iam_stack = IamStack(
            f"iam-{self.environment_suffix}",
            IamStackArgs(
                environment_suffix=self.environment_suffix,
                db_cluster_arn=database_stack.cluster.arn,
                kms_key_arn=storage_stack.kms_key.arn,
                tags=self.tags
            ),
            ResourceOptions(parent=self, depends_on=[database_stack, storage_stack])
        )

        # 6. ALB Stack (Application Load Balancer)
        alb_stack = AlbStack(
            f"alb-{self.environment_suffix}",
            AlbStackArgs(
                environment_suffix=self.environment_suffix,
                vpc_id=networking_stack.vpc.id,
                public_subnet_ids=[s.id for s in networking_stack.public_subnets],
                alb_sg_id=networking_stack.alb_sg.id,
                log_bucket_name=storage_stack.log_bucket.bucket,
                tags=self.tags
            ),
            ResourceOptions(parent=self, depends_on=[networking_stack, storage_stack])
        )

        # 7. ECS Stack (Fargate Cluster and Service)
        ecs_stack = EcsStack(
            f"ecs-{self.environment_suffix}",
            EcsStackArgs(
                environment_suffix=self.environment_suffix,
                vpc_id=networking_stack.vpc.id,
                private_subnet_ids=[s.id for s in networking_stack.private_subnets],
                ecs_sg_id=networking_stack.ecs_sg.id,
                target_group_arn=alb_stack.target_group.arn,
                task_role_arn=iam_stack.task_role.arn,
                execution_role_arn=iam_stack.execution_role.arn,
                log_group_name=monitoring_stack.ecs_log_group.name,
                db_endpoint=database_stack.cluster.endpoint,
                tags=self.tags
            ),
            ResourceOptions(parent=self, depends_on=[
                networking_stack,
                alb_stack,
                iam_stack,
                monitoring_stack,
                database_stack
            ])
        )

        # Register outputs
        self.register_outputs({
            "vpc_id": networking_stack.vpc.id,
            "alb_dns_name": alb_stack.alb.dns_name,
            "ecs_cluster_name": ecs_stack.cluster.name,
            "db_endpoint": database_stack.cluster.endpoint,
            "log_bucket_name": storage_stack.log_bucket.bucket
        })
