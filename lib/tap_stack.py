"""
tap_stack.py

RDS MySQL Optimization Infrastructure

This module creates a baseline RDS MySQL instance with higher resource allocations
that will be optimized by the lib/optimize.py script to reduce costs while maintaining
performance.
"""

import os
from typing import Optional

import pulumi
import pulumi_aws as aws
from pulumi import Config, Output, ResourceOptions


class TapStackArgs:
    """
    TapStackArgs defines the input arguments for the TapStack Pulumi component.

    Args:
        environment_suffix (Optional[str]): An optional suffix for identifying the
                                           deployment environment (e.g., 'dev', 'prod').
        tags (Optional[dict]): Optional default tags to apply to resources.
    """

    def __init__(
        self, environment_suffix: Optional[str] = None, tags: Optional[dict] = None
    ):
        self.environment_suffix = environment_suffix or "dev"
        config = Config()
        subnet_ids_config = config.get('subnet_ids')
        self.subnet_ids = []
        if subnet_ids_config:
            if isinstance(subnet_ids_config, list):
                self.subnet_ids = subnet_ids_config
            else:
                self.subnet_ids = subnet_ids_config.split(',')
        self.tags = tags


class TapStack(pulumi.ComponentResource):
    """
    Creates an optimized RDS MySQL 8.0 infrastructure with proper monitoring.

    This is an IaC Optimization task - the baseline infrastructure intentionally
    uses higher resource allocations (db.t4g.xlarge instead of db.t4g.large) that
    will be optimized by lib/optimize.py to reduce costs.

    Resources created:
    - RDS DB Parameter Group with performance optimization settings
    - RDS DB Subnet Group (or uses existing one)
    - RDS MySQL 8.0 instance with GP3 storage (BASELINE: higher allocations)
    - CloudWatch alarms for CPU and storage monitoring
    """

    def __init__(
        self, name: str, args: TapStackArgs, opts: Optional[ResourceOptions] = None
    ):
        super().__init__("tap:stack:TapStack", name, None, opts)

        if not args.subnet_ids:
            return

        config = Config()

        # Get is_production parameter (defaults to False for dev)
        is_production = config.get_bool("is_production") or False

        # Resource tags
        environment_name = "production" if is_production else "development"
        resource_tags = {
            "Environment": environment_name,
            "CostCenter": "payments",
            "OptimizedBy": "pulumi",
        }

        # Create DB Subnet Group
        subnet_group = aws.rds.SubnetGroup(
            f"db-subnet-group-{args.environment_suffix}",
            name=f"db-subnet-group-{args.environment_suffix}",
            subnet_ids=args.subnet_ids,
            description="DB subnet group for RDS instance",
            tags=resource_tags,
            opts=ResourceOptions(parent=self),
        )

        # Create DB Parameter Group with performance optimization
        param_group = aws.rds.ParameterGroup(
            f"mysql-params-{args.environment_suffix}",
            family="mysql8.0",
            description="MySQL 8.0 parameter group with performance optimization",
            parameters=[
                aws.rds.ParameterGroupParameterArgs(
                    name="performance_schema",
                    value="ON",
                    apply_method="pending-reboot",
                ),
                aws.rds.ParameterGroupParameterArgs(
                    name="slow_query_log",
                    value="ON",
                    apply_method="immediate",
                ),
            ],
            tags=resource_tags,
            opts=ResourceOptions(parent=self),
        )

        # BASELINE: Use db.t4g.xlarge (higher than required db.t4g.large)
        # This will be optimized down by lib/optimize.py
        instance_class = "db.t4g.xlarge"

        # BASELINE: Use 150GB storage (higher than required 100GB)
        # This will be optimized down by lib/optimize.py
        allocated_storage = 150

        # Create RDS MySQL instance with BASELINE (non-optimized) settings
        db_instance = aws.rds.Instance(
            f"mysql-optimized-{args.environment_suffix}",
            identifier=f"mysql-optimized-{args.environment_suffix}",
            engine="mysql",
            engine_version="8.0.39",
            instance_class=instance_class,
            allocated_storage=allocated_storage,
            storage_type="gp3",
            iops=3000,
            storage_throughput=125,
            db_name="paymentsdb",
            username="admin",
            password=config.require_secret("db_password"),
            db_subnet_group_name=subnet_group.name,
            parameter_group_name=param_group.name,
            backup_retention_period=7,
            backup_window="03:00-04:00",
            multi_az=is_production,
            deletion_protection=is_production,
            skip_final_snapshot=True,
            publicly_accessible=False,
            tags=resource_tags,
            opts=ResourceOptions(parent=self),
        )

        # Create CloudWatch alarm for CPU utilization
        cpu_alarm = aws.cloudwatch.MetricAlarm(
            f"rds-cpu-alarm-{args.environment_suffix}",
            comparison_operator="GreaterThanThreshold",
            evaluation_periods=2,
            metric_name="CPUUtilization",
            namespace="AWS/RDS",
            period=300,
            statistic="Average",
            threshold=80.0,
            alarm_description="Alert when CPU exceeds 80%",
            alarm_actions=[
                config.get("sns_topic_arn") or f"arn:aws:sns:{aws.get_region().name}:{aws.get_caller_identity().account_id}:db-alerts-{args.environment_suffix}"
            ],
            dimensions={
                "DBInstanceIdentifier": db_instance.identifier,
            },
            tags=resource_tags,
            opts=ResourceOptions(parent=self),
        )

        # Create CloudWatch alarm for free storage space
        storage_alarm = aws.cloudwatch.MetricAlarm(
            f"rds-storage-alarm-{args.environment_suffix}",
            comparison_operator="LessThanThreshold",
            evaluation_periods=1,
            metric_name="FreeStorageSpace",
            namespace="AWS/RDS",
            period=300,
            statistic="Average",
            threshold=10 * 1024 * 1024 * 1024,  # 10GB in bytes
            alarm_description="Alert when free storage is less than 10GB",
            alarm_actions=[
                config.get("sns_topic_arn") or f"arn:aws:sns:{aws.get_region().name}:{aws.get_caller_identity().account_id}:db-alerts-{args.environment_suffix}"
            ],
            dimensions={
                "DBInstanceIdentifier": db_instance.identifier,
            },
            tags=resource_tags,
            opts=ResourceOptions(parent=self),
        )

        # Export database configuration
        self.db_endpoint = db_instance.endpoint
        self.db_port = db_instance.port
        self.db_resource_id = db_instance.resource_id
        self.db_instance_identifier = db_instance.identifier

        # Register outputs
        self.register_outputs(
            {
                "db_endpoint": db_instance.endpoint,
                "db_port": db_instance.port,
                "db_resource_id": db_instance.resource_id,
                "db_instance_identifier": db_instance.identifier,
                "db_instance_class": instance_class,
                "allocated_storage": allocated_storage,
            }
        )
