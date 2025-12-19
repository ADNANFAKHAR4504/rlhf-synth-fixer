from dataclasses import dataclass
from typing import Optional
from aws_cdk import (
    Stack,
    Environment,
    aws_kinesis as kinesis,
    aws_rds as rds,
    aws_elasticache as elasticache,
    aws_lambda as lambda_,
    aws_s3 as s3,
    aws_secretsmanager as secretsmanager,
    aws_ec2 as ec2,
    aws_iam as iam,
    aws_logs as logs,
    RemovalPolicy,
    Duration,
)
from constructs import Construct

@dataclass
class TapStackProps:
    """Properties for TapStack"""
    environment_suffix: str = "dev"
    env: Optional[Environment] = None

class TapStack(Stack):
    def __init__(self, scope: Construct, construct_id: str, props: Optional[TapStackProps] = None, **kwargs) -> None:
        # Extract env from props if provided
        if props and props.env:
            kwargs['env'] = props.env

        super().__init__(scope, construct_id, **kwargs)

        # Use environment_suffix from props, or default to 'dev'
        environment_suffix = props.environment_suffix if props else "dev"

        # VPC for RDS and ElastiCache (ISSUE: Missing environmentSuffix in resource names)
        vpc = ec2.Vpc(self, "ProductCatalogVPC",
            max_azs=2,
            nat_gateways=1
        )

        # Kinesis Data Stream for inventory updates (ISSUE: No environmentSuffix)
        inventory_stream = kinesis.Stream(self, "InventoryStream",
            stream_name="inventory-updates-stream",
            shard_count=2
        )

        # S3 bucket for archival (ISSUE: Has RETAIN policy instead of DESTROY)
        archive_bucket = s3.Bucket(self, "ArchiveBucket",
            bucket_name="product-inventory-archive",
            removal_policy=RemovalPolicy.RETAIN,
            lifecycle_rules=[
                s3.LifecycleRule(
                    transitions=[
                        s3.Transition(
                            storage_class=s3.StorageClass.GLACIER,
                            transition_after=Duration.days(90)
                        )
                    ]
                )
            ]
        )

        # Database credentials (ISSUE: Missing environmentSuffix)
        db_secret = secretsmanager.Secret(self, "DBSecret",
            secret_name="product-catalog-db-credentials",
            generate_secret_string=secretsmanager.SecretStringGenerator(
                secret_string_template='{"username":"postgres"}',
                generate_string_key="password",
                exclude_punctuation=True
            )
        )

        # Security group for database (ISSUE: No environmentSuffix)
        db_security_group = ec2.SecurityGroup(self, "DBSecurityGroup",
            vpc=vpc,
            description="Security group for product catalog database",
            allow_all_outbound=True
        )

        # RDS PostgreSQL (ISSUE: Has deletion_protection=True and backup retention)
        database = rds.DatabaseInstance(self, "ProductCatalogDB",
            engine=rds.DatabaseInstanceEngine.postgres(
                version=rds.PostgresEngineVersion.VER_14
            ),
            instance_type=ec2.InstanceType.of(
                ec2.InstanceClass.BURSTABLE3,
                ec2.InstanceSize.MEDIUM
            ),
            vpc=vpc,
            vpc_subnets=ec2.SubnetSelection(subnet_type=ec2.SubnetType.PRIVATE_WITH_EGRESS),
            security_groups=[db_security_group],
            credentials=rds.Credentials.from_secret(db_secret),
            database_name="productcatalog",
            allocated_storage=20,
            backup_retention=Duration.days(7),
            deletion_protection=True,
            removal_policy=RemovalPolicy.SNAPSHOT
        )

        # ElastiCache security group (ISSUE: No environmentSuffix)
        cache_security_group = ec2.SecurityGroup(self, "CacheSecurityGroup",
            vpc=vpc,
            description="Security group for Redis cache"
        )

        # ElastiCache subnet group (ISSUE: No environmentSuffix)
        cache_subnet_group = elasticache.CfnSubnetGroup(self, "CacheSubnetGroup",
            description="Subnet group for Redis cache",
            subnet_ids=vpc.select_subnets(subnet_type=ec2.SubnetType.PRIVATE_WITH_EGRESS).subnet_ids
        )

        # ElastiCache Redis Cluster (ISSUE: Has snapshot retention enabled)
        redis_cluster = elasticache.CfnCacheCluster(self, "RedisCluster",
            cache_node_type="cache.t3.micro",
            engine="redis",
            num_cache_nodes=1,
            vpc_security_group_ids=[cache_security_group.security_group_id],
            cache_subnet_group_name=cache_subnet_group.ref,
            snapshot_retention_limit=5
        )

        # Lambda execution role (ISSUE: Missing proper permissions for Kinesis)
        lambda_role = iam.Role(self, "LambdaExecutionRole",
            assumed_by=iam.ServicePrincipal("lambda.amazonaws.com"),
            managed_policies=[
                iam.ManagedPolicy.from_aws_managed_policy_name("service-role/AWSLambdaBasicExecutionRole")
            ]
        )

        # Grant minimal permissions (ISSUE: Missing many required permissions)
        archive_bucket.grant_write(lambda_role)

        # Lambda function for stream processing (ISSUE: Inline code, no error handling)
        processor_function = lambda_.Function(self, "InventoryProcessor",
            runtime=lambda_.Runtime.PYTHON_3_9,
            handler="index.handler",
            code=lambda_.Code.from_inline("""
import json

def handler(event, context):
    for record in event['Records']:
        payload = json.loads(record['kinesis']['data'])
        print(payload)
    return {'statusCode': 200}
"""),
            role=lambda_role,
            environment={
                "DB_SECRET_ARN": db_secret.secret_arn,
                "REDIS_ENDPOINT": redis_cluster.attr_redis_endpoint_address,
                "ARCHIVE_BUCKET": archive_bucket.bucket_name
            },
            timeout=Duration.seconds(60)
        )

        # Lambda event source mapping (ISSUE: No error handling configuration)
        lambda_.EventSourceMapping(self, "KinesisEventSource",
            target=processor_function,
            event_source_arn=inventory_stream.stream_arn,
            starting_position=lambda_.StartingPosition.LATEST,
            batch_size=100
        )

        # CloudWatch Log Group (ISSUE: Has RETAIN policy)
        logs.LogGroup(self, "ProcessorLogs",
            log_group_name=f"/aws/lambda/{processor_function.function_name}",
            removal_policy=RemovalPolicy.RETAIN
        )
