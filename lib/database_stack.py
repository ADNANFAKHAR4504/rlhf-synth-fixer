"""
database_stack.py

Multi-region database infrastructure with Aurora and DynamoDB Global Tables.
"""

import pulumi
import pulumi_aws as aws
from pulumi import Output, ResourceOptions


class DatabaseStack(pulumi.ComponentResource):
    """
    Creates multi-region database infrastructure with replication.
    """

    def __init__(
        self,
        name: str,
        environment_suffix: str,
        primary_region: str,
        secondary_region: str,
        primary_vpc_id: Output,
        secondary_vpc_id: Output,
        primary_subnet_ids: list,
        secondary_subnet_ids: list,
        tags: dict,
        opts: ResourceOptions = None
    ):
        super().__init__('tap:database:DatabaseStack', name, None, opts)

        secondary_provider = aws.Provider(
            f"db-secondary-provider-{environment_suffix}",
            region=secondary_region,
            opts=ResourceOptions(parent=self)
        )

        # Security group for RDS in primary region
        self.primary_db_sg = aws.ec2.SecurityGroup(
            f"primary-db-sg-{environment_suffix}",
            vpc_id=primary_vpc_id,
            description="Security group for primary RDS Aurora cluster",
            ingress=[
                aws.ec2.SecurityGroupIngressArgs(
                    protocol="tcp",
                    from_port=3306,
                    to_port=3306,
                    cidr_blocks=["10.0.0.0/16"],
                )
            ],
            egress=[
                aws.ec2.SecurityGroupEgressArgs(
                    protocol="-1",
                    from_port=0,
                    to_port=0,
                    cidr_blocks=["0.0.0.0/0"],
                )
            ],
            tags={**tags, 'Name': f'primary-db-sg-{environment_suffix}'},
            opts=ResourceOptions(parent=self)
        )

        # Security group for RDS in secondary region
        self.secondary_db_sg = aws.ec2.SecurityGroup(
            f"secondary-db-sg-{environment_suffix}",
            vpc_id=secondary_vpc_id,
            description="Security group for secondary RDS Aurora cluster",
            ingress=[
                aws.ec2.SecurityGroupIngressArgs(
                    protocol="tcp",
                    from_port=3306,
                    to_port=3306,
                    cidr_blocks=["10.1.0.0/16"],
                )
            ],
            egress=[
                aws.ec2.SecurityGroupEgressArgs(
                    protocol="-1",
                    from_port=0,
                    to_port=0,
                    cidr_blocks=["0.0.0.0/0"],
                )
            ],
            tags={**tags, 'Name': f'secondary-db-sg-{environment_suffix}'},
            opts=ResourceOptions(parent=self, provider=secondary_provider)
        )

        # DB subnet group in primary region
        self.primary_subnet_group = aws.rds.SubnetGroup(
            f"primary-db-subnet-group-{environment_suffix}",
            subnet_ids=primary_subnet_ids,
            tags={**tags, 'Name': f'primary-db-subnet-group-{environment_suffix}'},
            opts=ResourceOptions(parent=self)
        )

        # DB subnet group in secondary region
        self.secondary_subnet_group = aws.rds.SubnetGroup(
            f"secondary-db-subnet-group-{environment_suffix}",
            subnet_ids=secondary_subnet_ids,
            tags={**tags, 'Name': f'secondary-db-subnet-group-{environment_suffix}'},
            opts=ResourceOptions(parent=self, provider=secondary_provider)
        )

        # Aurora Serverless v2 cluster in primary region
        self.primary_cluster = aws.rds.Cluster(
            f"primary-aurora-cluster-{environment_suffix}",
            cluster_identifier=f"primary-aurora-{environment_suffix}",
            engine="aurora-mysql",
            engine_mode="provisioned",
            engine_version="8.0.mysql_aurora.3.08.2",
            database_name="ecommerce",
            master_username="admin",
            master_password="ChangeMe123!",
            db_subnet_group_name=self.primary_subnet_group.name,
            vpc_security_group_ids=[self.primary_db_sg.id],
            serverlessv2_scaling_configuration=aws.rds.ClusterServerlessv2ScalingConfigurationArgs(
                max_capacity=2.0,
                min_capacity=0.5,
            ),
            backup_retention_period=1,
            skip_final_snapshot=True,
            storage_encrypted=True,
            tags={**tags, 'Name': f'primary-aurora-{environment_suffix}'},
            opts=ResourceOptions(parent=self)
        )

        # Aurora Serverless v2 instance in primary region
        self.primary_instance = aws.rds.ClusterInstance(
            f"primary-aurora-instance-{environment_suffix}",
            identifier=f"primary-aurora-instance-{environment_suffix}",
            cluster_identifier=self.primary_cluster.id,
            instance_class="db.serverless",
            engine=self.primary_cluster.engine,
            engine_version=self.primary_cluster.engine_version,
            tags={**tags, 'Name': f'primary-aurora-instance-{environment_suffix}'},
            opts=ResourceOptions(parent=self, depends_on=[self.primary_cluster])
        )

        # Aurora Serverless v2 cluster in secondary region (standalone for DR)
        # Note: This is a standalone cluster, not Aurora Global Database
        # For true active-passive, would need Global Database or read replicas
        self.secondary_cluster = aws.rds.Cluster(
            f"secondary-aurora-cluster-{environment_suffix}",
            cluster_identifier=f"secondary-aurora-{environment_suffix}",
            engine="aurora-mysql",
            engine_mode="provisioned",
            engine_version="8.0.mysql_aurora.3.08.2",
            database_name="ecommerce",
            master_username="admin",
            master_password="ChangeMe123!",
            db_subnet_group_name=self.secondary_subnet_group.name,
            vpc_security_group_ids=[self.secondary_db_sg.id],
            serverlessv2_scaling_configuration=aws.rds.ClusterServerlessv2ScalingConfigurationArgs(
                max_capacity=2.0,
                min_capacity=0.5,
            ),
            backup_retention_period=1,
            skip_final_snapshot=True,
            storage_encrypted=True,
            tags={**tags, 'Name': f'secondary-aurora-{environment_suffix}'},
            opts=ResourceOptions(parent=self, provider=secondary_provider)
        )

        # Aurora Serverless v2 instance in secondary region
        self.secondary_instance = aws.rds.ClusterInstance(
            f"secondary-aurora-instance-{environment_suffix}",
            identifier=f"secondary-aurora-instance-{environment_suffix}",
            cluster_identifier=self.secondary_cluster.id,
            instance_class="db.serverless",
            engine=self.secondary_cluster.engine,
            engine_version=self.secondary_cluster.engine_version,
            tags={**tags, 'Name': f'secondary-aurora-instance-{environment_suffix}'},
            opts=ResourceOptions(
                parent=self,
                provider=secondary_provider,
                depends_on=[self.secondary_cluster]
            )
        )

        # DynamoDB table with global replication
        self.dynamodb_table = aws.dynamodb.Table(
            f"ecommerce-sessions-{environment_suffix}",
            name=f"ecommerce-sessions-{environment_suffix}",
            billing_mode="PAY_PER_REQUEST",
            hash_key="session_id",
            attributes=[
                aws.dynamodb.TableAttributeArgs(
                    name="session_id",
                    type="S",
                )
            ],
            stream_enabled=True,
            stream_view_type="NEW_AND_OLD_IMAGES",
            replicas=[
                aws.dynamodb.TableReplicaArgs(
                    region_name=secondary_region,
                )
            ],
            point_in_time_recovery=aws.dynamodb.TablePointInTimeRecoveryArgs(
                enabled=True,
            ),
            server_side_encryption=aws.dynamodb.TableServerSideEncryptionArgs(
                enabled=True,
            ),
            tags={**tags, 'Name': f'ecommerce-sessions-{environment_suffix}'},
            opts=ResourceOptions(parent=self)
        )

        # Expose outputs
        self.primary_endpoint = self.primary_cluster.endpoint
        self.secondary_endpoint = self.secondary_cluster.endpoint
        self.primary_cluster_id = self.primary_cluster.id
        self.dynamodb_table_name = self.dynamodb_table.name

        self.register_outputs({})
