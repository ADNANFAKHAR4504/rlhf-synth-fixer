import pulumi
import pulumi_aws as aws
from pulumi import ComponentResource, ResourceOptions, Output


class RdsComponent(ComponentResource):
    """
    RDS Aurora PostgreSQL component with read replicas and encryption
    """

    def __init__(
        self,
        name: str,
        environment_suffix: str,
        vpc_id: Output[str],
        private_subnet_ids: list,
        read_replica_count: int,
        backup_retention_days: int,
        tags: dict,
        opts: ResourceOptions = None,
    ):
        super().__init__("custom:database:RdsComponent", name, None, opts)

        # Create RDS security group
        self.rds_sg = aws.ec2.SecurityGroup(
            f"rds-sg-{environment_suffix}",
            vpc_id=vpc_id,
            description="Security group for RDS Aurora PostgreSQL",
            ingress=[
                aws.ec2.SecurityGroupIngressArgs(
                    protocol="tcp",
                    from_port=5432,
                    to_port=5432,
                    cidr_blocks=["10.0.0.0/16"],
                    description="Allow PostgreSQL from VPC",
                ),
            ],
            egress=[
                aws.ec2.SecurityGroupEgressArgs(
                    protocol="-1",
                    from_port=0,
                    to_port=0,
                    cidr_blocks=["0.0.0.0/0"],
                    description="Allow all outbound traffic",
                ),
            ],
            tags={**tags, "Name": f"rds-sg-{environment_suffix}"},
            opts=ResourceOptions(parent=self),
        )

        # Create DB subnet group
        self.db_subnet_group = aws.rds.SubnetGroup(
            f"db-subnet-group-{environment_suffix}",
            subnet_ids=private_subnet_ids,
            tags={**tags, "Name": f"db-subnet-group-{environment_suffix}"},
            opts=ResourceOptions(parent=self),
        )

        # Create secret for DB password
        self.db_secret = aws.secretsmanager.Secret(
            f"db-secret-{environment_suffix}",
            description=f"Database password for {environment_suffix}",
            tags={**tags, "Name": f"db-secret-{environment_suffix}"},
            opts=ResourceOptions(parent=self),
        )

        # Generate random password
        import json

        db_password = pulumi.Output.secret(
            ''.join([chr(__import__("random").randint(65, 90)) for _ in range(16)])
        )

        self.db_secret_version = aws.secretsmanager.SecretVersion(
            f"db-secret-version-{environment_suffix}",
            secret_id=self.db_secret.id,
            secret_string=db_password.apply(
                lambda pwd: json.dumps({"password": pwd})
            ),
            opts=ResourceOptions(parent=self),
        )

        # Create RDS Aurora Cluster (Serverless v2 with auto-pause for cost optimization)
        self.cluster = aws.rds.Cluster(
            f"aurora-cluster-{environment_suffix}",
            cluster_identifier=f"aurora-cluster-{environment_suffix}",
            engine="aurora-postgresql",
            engine_mode="provisioned",
            database_name="appdb",
            master_username="dbadmin",
            master_password=db_password,
            db_subnet_group_name=self.db_subnet_group.name,
            vpc_security_group_ids=[self.rds_sg.id],
            backup_retention_period=backup_retention_days,
            preferred_backup_window="03:00-04:00",
            preferred_maintenance_window="mon:04:00-mon:05:00",
            storage_encrypted=True,
            skip_final_snapshot=True,
            deletion_protection=False,
            serverlessv2_scaling_configuration=aws.rds.ClusterServerlessv2ScalingConfigurationArgs(
                max_capacity=1.0,
                min_capacity=0.5,
            ),
            tags={**tags, "Name": f"aurora-cluster-{environment_suffix}"},
            opts=ResourceOptions(parent=self),
        )

        # Create primary instance (serverless v2 for cost optimization)
        self.primary_instance = aws.rds.ClusterInstance(
            f"aurora-instance-primary-{environment_suffix}",
            cluster_identifier=self.cluster.id,
            identifier=f"aurora-instance-primary-{environment_suffix}",
            instance_class="db.serverless",
            engine=self.cluster.engine,
            publicly_accessible=False,
            tags={**tags, "Name": f"aurora-instance-primary-{environment_suffix}"},
            opts=ResourceOptions(parent=self),
        )

        # Create read replicas (serverless v2 for cost optimization)
        self.read_replicas = []
        for i in range(read_replica_count):
            replica = aws.rds.ClusterInstance(
                f"aurora-instance-replica-{i}-{environment_suffix}",
                cluster_identifier=self.cluster.id,
                identifier=f"aurora-instance-replica-{i}-{environment_suffix}",
                instance_class="db.serverless",
                engine=self.cluster.engine,
                publicly_accessible=False,
                tags={**tags, "Name": f"aurora-instance-replica-{i}-{environment_suffix}"},
                opts=ResourceOptions(parent=self, depends_on=[self.primary_instance]),
            )
            self.read_replicas.append(replica)

        # Create CloudWatch alarm for database connections
        self.db_connections_alarm = aws.cloudwatch.MetricAlarm(
            f"db-connections-alarm-{environment_suffix}",
            comparison_operator="GreaterThanThreshold",
            evaluation_periods=2,
            metric_name="DatabaseConnections",
            namespace="AWS/RDS",
            period=300,
            statistic="Average",
            threshold=80,
            alarm_description="Trigger when DB connections exceed 80",
            dimensions={"DBClusterIdentifier": self.cluster.id},
            tags={**tags, "Name": f"db-connections-alarm-{environment_suffix}"},
            opts=ResourceOptions(parent=self),
        )

        # Export properties
        self.cluster_endpoint = self.cluster.endpoint
        self.reader_endpoint = self.cluster.reader_endpoint
        self.cluster_id = self.cluster.id
        self.db_secret_arn = self.db_secret.arn

        self.register_outputs(
            {
                "cluster_endpoint": self.cluster_endpoint,
                "reader_endpoint": self.reader_endpoint,
                "cluster_id": self.cluster_id,
                "db_secret_arn": self.db_secret_arn,
            }
        )
