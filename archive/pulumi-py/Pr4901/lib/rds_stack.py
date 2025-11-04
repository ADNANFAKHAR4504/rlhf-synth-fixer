"""
rds_stack.py

RDS Aurora PostgreSQL Serverless v2 cluster with automatic failover and read replicas.
"""

import json
import pulumi
import pulumi_aws as aws
from pulumi import Output, ResourceOptions
from typing import Optional, List


class RdsStack(pulumi.ComponentResource):
    """
    Creates Aurora PostgreSQL Serverless v2 cluster with HA configuration.
    """

    def __init__(
        self,
        name: str,
        vpc_id: Output[str],
        private_subnet_ids: List[Output[str]],
        secret_arn: Output[str],
        tags: Optional[dict] = None,
        opts: Optional[ResourceOptions] = None
    ):
        super().__init__('custom:rds:RdsStack', name, None, opts)

        self.tags = tags or {}
        child_opts = ResourceOptions(parent=self)

        # Create security group for RDS
        self.security_group = aws.ec2.SecurityGroup(
            f'{name}-rds-sg',
            vpc_id=vpc_id,
            description='Security group for Aurora PostgreSQL cluster',
            ingress=[aws.ec2.SecurityGroupIngressArgs(
                from_port=5432,
                to_port=5432,
                protocol='tcp',
                cidr_blocks=['10.0.0.0/16']
            )],
            egress=[aws.ec2.SecurityGroupEgressArgs(
                from_port=0,
                to_port=0,
                protocol='-1',
                cidr_blocks=['0.0.0.0/0']
            )],
            tags={**self.tags, 'Name': f'{name}-rds-sg'},
            opts=child_opts
        )

        # Create DB subnet group
        self.subnet_group = aws.rds.SubnetGroup(
            f'{name}-db-subnet-group',
            subnet_ids=private_subnet_ids,
            description='Subnet group for Aurora cluster',
            tags=self.tags,
            opts=child_opts
        )

        # Create DB cluster parameter group
        self.cluster_parameter_group = aws.rds.ClusterParameterGroup(
            f'{name}-cluster-params',
            family='aurora-postgresql15',
            description='Custom parameter group for Aurora PostgreSQL 15',
            parameters=[
                aws.rds.ClusterParameterGroupParameterArgs(
                    name='log_statement',
                    value='all'
                ),
                aws.rds.ClusterParameterGroupParameterArgs(
                    name='log_min_duration_statement',
                    value='1000'
                )
            ],
            tags=self.tags,
            opts=child_opts
        )

        # Create Aurora Serverless v2 cluster
        self.cluster = aws.rds.Cluster(
            f'{name}-aurora-cluster',
            engine=aws.rds.EngineType.AURORA_POSTGRESQL,
            engine_version='15.4',
            engine_mode='provisioned',
            database_name='globecart',
            master_username='globecart_admin',
            manage_master_user_password=True,
            db_subnet_group_name=self.subnet_group.name,
            db_cluster_parameter_group_name=self.cluster_parameter_group.name,
            vpc_security_group_ids=[self.security_group.id],
            serverlessv2_scaling_configuration=aws.rds.ClusterServerlessv2ScalingConfigurationArgs(
                min_capacity=0.5,
                max_capacity=2.0
            ),
            backup_retention_period=7,
            preferred_backup_window='03:00-04:00',
            preferred_maintenance_window='mon:04:00-mon:05:00',
            storage_encrypted=True,
            enabled_cloudwatch_logs_exports=['postgresql'],
            skip_final_snapshot=True,
            apply_immediately=True,
            tags=self.tags,
            opts=child_opts
        )

        # Create cluster instances (writer + reader)
        self.writer_instance = aws.rds.ClusterInstance(
            f'{name}-writer-instance',
            cluster_identifier=self.cluster.id,
            instance_class='db.serverless',
            engine=aws.rds.EngineType.AURORA_POSTGRESQL,
            engine_version='15.4',
            publicly_accessible=False,
            db_subnet_group_name=self.subnet_group.name,
            performance_insights_enabled=True,
            performance_insights_retention_period=7,
            tags={**self.tags, 'Role': 'Writer'},
            opts=child_opts
        )

        self.reader_instance = aws.rds.ClusterInstance(
            f'{name}-reader-instance',
            cluster_identifier=self.cluster.id,
            instance_class='db.serverless',
            engine=aws.rds.EngineType.AURORA_POSTGRESQL,
            engine_version='15.4',
            publicly_accessible=False,
            db_subnet_group_name=self.subnet_group.name,
            performance_insights_enabled=True,
            performance_insights_retention_period=7,
            tags={**self.tags, 'Role': 'Reader'},
            opts=child_opts
        )

        # Store outputs
        self.cluster_id = self.cluster.id
        self.cluster_arn = self.cluster.arn
        self.cluster_endpoint = self.cluster.endpoint
        self.reader_endpoint = self.cluster.reader_endpoint
        self.security_group_id = self.security_group.id

        self.register_outputs({
            'cluster_id': self.cluster_id,
            'cluster_arn': self.cluster_arn,
            'cluster_endpoint': self.cluster_endpoint,
            'reader_endpoint': self.reader_endpoint,
            'security_group_id': self.security_group_id,
        })
