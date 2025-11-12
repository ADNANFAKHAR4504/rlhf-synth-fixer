from aws_cdk import (
    Stack,
    aws_rds as rds,
    aws_ec2 as ec2,
    aws_dynamodb as dynamodb,
    aws_secretsmanager as secretsmanager,
    Duration,
    RemovalPolicy,
    Tags,
    CfnOutput
)
from constructs import Construct

class DatabaseStack(Stack):
    def __init__(self, scope: Construct, construct_id: str, vpc: ec2.Vpc,
                 environment_suffix: str, dr_role: str, is_primary: bool = True,
                 global_cluster_id: str = None, **kwargs) -> None:
        super().__init__(scope, construct_id, **kwargs)

        # Database credentials
        db_credentials = rds.Credentials.from_generated_secret(
            username="paymentadmin",
            secret_name=f"payment-db-{dr_role}-{environment_suffix}"
        )

        if is_primary and not global_cluster_id:
            # Create Global Cluster (PRIMARY ONLY)
            global_cluster = rds.CfnGlobalCluster(
                self, f"PaymentGlobalDB-{environment_suffix}",
                global_cluster_identifier=f"payment-global-{environment_suffix}",
                engine="aurora-postgresql",
                engine_version="14.6",
                deletion_protection=False,
                storage_encrypted=True
            )

            # Primary Aurora cluster
            db_cluster = rds.DatabaseCluster(
                self, f"PaymentDB-{environment_suffix}",
                engine=rds.DatabaseClusterEngine.aurora_postgres(
                    version=rds.AuroraPostgresEngineVersion.VER_14_6
                ),
                writer=rds.ClusterInstance.provisioned(
                    "writer",
                    instance_type=ec2.InstanceType.of(
                        ec2.InstanceClass.T3,
                        ec2.InstanceSize.MEDIUM
                    )
                ),
                credentials=db_credentials,
                vpc=vpc,
                vpc_subnets=ec2.SubnetSelection(
                    subnet_type=ec2.SubnetType.PRIVATE_ISOLATED
                ),
                backup=rds.BackupProps(
                    retention=Duration.days(7),
                    preferred_window="03:00-04:00"
                ),
                removal_policy=RemovalPolicy.DESTROY,
                storage_encrypted=True
            )

            db_cluster.node.add_dependency(global_cluster)

            # Add cluster to global cluster
            cfn_cluster = db_cluster.node.default_child
            cfn_cluster.global_cluster_identifier = global_cluster.ref

            self.global_cluster_id = global_cluster.ref

            CfnOutput(
                self, "GlobalClusterIdentifier",
                value=self.global_cluster_id,
                export_name=f"global-cluster-id-{environment_suffix}"
            )

        else:
            # Secondary Aurora cluster (reads from global cluster)
            db_cluster = rds.DatabaseCluster(
                self, f"PaymentDB-{environment_suffix}",
                engine=rds.DatabaseClusterEngine.aurora_postgres(
                    version=rds.AuroraPostgresEngineVersion.VER_14_6
                ),
                writer=rds.ClusterInstance.provisioned(
                    "writer",
                    instance_type=ec2.InstanceType.of(
                        ec2.InstanceClass.T3,
                        ec2.InstanceSize.MEDIUM
                    )
                ),
                vpc=vpc,
                vpc_subnets=ec2.SubnetSelection(
                    subnet_type=ec2.SubnetType.PRIVATE_ISOLATED
                ),
                removal_policy=RemovalPolicy.DESTROY,
                storage_encrypted=True
            )

            if global_cluster_id:
                cfn_cluster = db_cluster.node.default_child
                cfn_cluster.global_cluster_identifier = global_cluster_id

        self.db_cluster = db_cluster
        Tags.of(db_cluster).add("DR-Role", dr_role)

        # DynamoDB Global Table (only create in PRIMARY)
        if is_primary:
            table = dynamodb.TableV2(
                self, f"SessionTable-{environment_suffix}",
                table_name=f"SessionTable-{environment_suffix}",
                partition_key=dynamodb.Attribute(
                    name="sessionId",
                    type=dynamodb.AttributeType.STRING
                ),
                billing=dynamodb.Billing.on_demand(),
                point_in_time_recovery=True,
                removal_policy=RemovalPolicy.DESTROY,
                replicas=[
                    dynamodb.ReplicaTableProps(
                        region="us-east-2"
                    )
                ]
            )

            self.session_table = table
            Tags.of(table).add("DR-Role", "global")

            CfnOutput(
                self, "DynamoDBTableName",
                value=table.table_name,
                export_name=f"dynamodb-table-name-{environment_suffix}"
            )

        CfnOutput(
            self, "DBClusterEndpoint",
            value=db_cluster.cluster_endpoint.hostname,
            export_name=f"{dr_role}-db-endpoint-{environment_suffix}"
        )
