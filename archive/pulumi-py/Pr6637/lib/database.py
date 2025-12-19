"""
Database infrastructure module.
Creates RDS MySQL instance.
"""
from typing import Any, Dict, List

import pulumi
import pulumi_aws as aws
from pulumi import Output, ResourceOptions


class DatabaseStack:
    """Creates RDS MySQL database."""

    def __init__(self,
                 name: str,
                 vpc_id: Output[str],
                 private_subnet_ids: List[Output[str]],
                 security_group_id: Output[str],
                 db_name: str,
                 db_username: str,
                 db_password: str,
                 instance_class: str,
                 allocated_storage: int,
                 environment_suffix: str,
                 tags: Dict[str, str],
                 opts: ResourceOptions = None):
        """
        Initialize database infrastructure.

        Args:
            name: Resource name prefix
            vpc_id: VPC ID
            private_subnet_ids: List of private subnet IDs
            security_group_id: RDS security group ID
            db_name: Database name
            db_username: Database username
            db_password: Database password
            instance_class: RDS instance class
            allocated_storage: Allocated storage in GB
            environment_suffix: Environment suffix
            tags: Common tags
            opts: Pulumi resource options
        """
        self.environment_suffix = environment_suffix
        self.tags = tags

        # DB Subnet Group
        self.subnet_group = aws.rds.SubnetGroup(
            f"db-subnet-group-{pulumi.get_stack().lower()}",
            subnet_ids=private_subnet_ids,
            tags={**tags, "Name": f"db-subnet-group-{pulumi.get_stack().lower()}"},
            opts=opts
        )

        # RDS Instance
        self.db_instance = aws.rds.Instance(
            f"db-{pulumi.get_stack()}",
            identifier=f"financial-db-{pulumi.get_stack().lower()}",
            engine="mysql",
            engine_version="8.0",
            instance_class=instance_class,
            allocated_storage=allocated_storage,
            storage_type="gp3",
            storage_encrypted=True,
            db_name=db_name,
            username=db_username,
            password=db_password,
            db_subnet_group_name=self.subnet_group.name,
            vpc_security_group_ids=[security_group_id],
            skip_final_snapshot=True,
            backup_retention_period=7,
            multi_az=False,
            publicly_accessible=False,
            tags={**tags, "Name": f"db-{pulumi.get_stack().lower()}"},
            opts=ResourceOptions(parent=self.subnet_group)
        )
