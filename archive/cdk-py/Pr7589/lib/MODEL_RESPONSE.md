# E-Commerce Product Catalog Data Pipeline - MODEL RESPONSE

This implementation provides a data pipeline for processing real-time inventory updates with intentional issues for training purposes.

## File: lib/tap_stack.py

```python
from aws_cdk import (
    Stack,
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

class TapStack(Stack):
    def __init__(self, scope: Construct, construct_id: str, environment_suffix: str, **kwargs) -> None:
        super().__init__(scope, construct_id, **kwargs)

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
            bucket_name=f"product-inventory-archive",
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
```

## File: lib/lambda/inventory_processor.py

```python
import json
import boto3
import psycopg2
import redis

# ISSUE: No error handling
# ISSUE: Hardcoded connection logic
# ISSUE: Missing environment variable validation

def handler(event, context):
    s3_client = boto3.client('s3')
    secrets_client = boto3.client('secretsmanager')

    for record in event['Records']:
        data = json.loads(record['kinesis']['data'])

        # Archive to S3 (ISSUE: No error handling)
        s3_client.put_object(
            Bucket='product-inventory-archive',
            Key=f'inventory/{data["product_id"]}.json',
            Body=json.dumps(data)
        )

        # Update database (ISSUE: Connection not managed properly)
        db_conn = psycopg2.connect(
            host='localhost',
            database='productcatalog',
            user='postgres',
            password='password123'
        )

        cursor = db_conn.cursor()
        cursor.execute("UPDATE products SET inventory = %s WHERE id = %s",
                      (data['inventory'], data['product_id']))
        db_conn.commit()

        # Update Redis cache (ISSUE: No error handling)
        cache = redis.Redis(host='localhost', port=6379)
        cache.delete(f"product:{data['product_id']}")

    return {'statusCode': 200}
```

## File: lib/README.md

```markdown
# Product Catalog Data Pipeline

Infrastructure for processing inventory updates.

## Deployment

```bash
cdk deploy
```

## Architecture

- Kinesis for streaming
- RDS for storage
- Redis for caching
- Lambda for processing

## Issues Present (Training Material)

This implementation contains intentional issues:
1. Missing environmentSuffix in resource names
2. RETAIN policies on stateful resources
3. Deletion protection enabled on RDS
4. Snapshot retention on ElastiCache
5. Inline Lambda code with no error handling
6. Missing IAM permissions
7. No proper secret management in Lambda
8. Hardcoded values
9. No VPC endpoint configuration
10. Missing CloudWatch alarms
```
