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
                 environment_suffix: str, **kwargs) -> None:
        super().__init__(scope, construct_id, **kwargs)

        # Database credentials
        db_credentials = rds.Credentials.from_generated_secret(
            username="paymentadmin",
            secret_name=f"payment-db-{environment_suffix}"
        )

        # Aurora PostgreSQL cluster with Multi-AZ deployment
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
            readers=[
                rds.ClusterInstance.provisioned(
                    "reader",
                    instance_type=ec2.InstanceType.of(
                        ec2.InstanceClass.T3,
                        ec2.InstanceSize.MEDIUM
                    )
                )
            ],
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

        self.db_cluster = db_cluster

        # DynamoDB Table for session management
        table = dynamodb.TableV2(
            self, f"SessionTable-{environment_suffix}",
            table_name=f"SessionTable-{environment_suffix}",
            partition_key=dynamodb.Attribute(
                name="sessionId",
                type=dynamodb.AttributeType.STRING
            ),
            billing=dynamodb.Billing.on_demand(),
            point_in_time_recovery=True,
            removal_policy=RemovalPolicy.DESTROY
        )

        self.session_table = table

        CfnOutput(
            self, "DynamoDBTableName",
            value=table.table_name,
            export_name=f"dynamodb-table-name-{environment_suffix}"
        )

        CfnOutput(
            self, "DBClusterEndpoint",
            value=db_cluster.cluster_endpoint.hostname,
            export_name=f"db-endpoint-{environment_suffix}"
        )
