# E-Commerce Product Catalog Data Pipeline - IDEAL RESPONSE

This is the correct implementation with all best practices applied.

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
    CfnOutput,
)
from constructs import Construct
import os

class TapStack(Stack):
    def __init__(self, scope: Construct, construct_id: str, environment_suffix: str, **kwargs) -> None:
        super().__init__(scope, construct_id, **kwargs)

        # VPC for RDS and ElastiCache
        vpc = ec2.Vpc(self, f"ProductCatalogVPC-{environment_suffix}",
            max_azs=2,
            nat_gateways=1,
            subnet_configuration=[
                ec2.SubnetConfiguration(
                    name=f"Public-{environment_suffix}",
                    subnet_type=ec2.SubnetType.PUBLIC,
                    cidr_mask=24
                ),
                ec2.SubnetConfiguration(
                    name=f"Private-{environment_suffix}",
                    subnet_type=ec2.SubnetType.PRIVATE_WITH_EGRESS,
                    cidr_mask=24
                )
            ]
        )

        # Kinesis Data Stream for inventory updates
        inventory_stream = kinesis.Stream(self, f"InventoryStream-{environment_suffix}",
            stream_name=f"inventory-updates-{environment_suffix}",
            shard_count=2,
            retention_period=Duration.days(1),
            encryption=kinesis.StreamEncryption.MANAGED
        )

        # S3 bucket for archival with proper lifecycle
        archive_bucket = s3.Bucket(self, f"ArchiveBucket-{environment_suffix}",
            bucket_name=f"product-inventory-archive-{environment_suffix}",
            removal_policy=RemovalPolicy.DESTROY,
            auto_delete_objects=True,
            encryption=s3.BucketEncryption.S3_MANAGED,
            versioned=False,
            lifecycle_rules=[
                s3.LifecycleRule(
                    enabled=True,
                    transitions=[
                        s3.Transition(
                            storage_class=s3.StorageClass.INTELLIGENT_TIERING,
                            transition_after=Duration.days(30)
                        ),
                        s3.Transition(
                            storage_class=s3.StorageClass.GLACIER,
                            transition_after=Duration.days(90)
                        )
                    ],
                    expiration=Duration.days(1095)  # 3 years for compliance
                )
            ]
        )

        # Database credentials
        db_secret = secretsmanager.Secret(self, f"DBSecret-{environment_suffix}",
            secret_name=f"product-catalog-db-credentials-{environment_suffix}",
            generate_secret_string=secretsmanager.SecretStringGenerator(
                secret_string_template='{"username":"postgres"}',
                generate_string_key="password",
                exclude_punctuation=True,
                password_length=32
            ),
            removal_policy=RemovalPolicy.DESTROY
        )

        # Security group for database
        db_security_group = ec2.SecurityGroup(self, f"DBSecurityGroup-{environment_suffix}",
            vpc=vpc,
            description=f"Security group for product catalog database {environment_suffix}",
            allow_all_outbound=True
        )

        # Security group for Lambda
        lambda_security_group = ec2.SecurityGroup(self, f"LambdaSecurityGroup-{environment_suffix}",
            vpc=vpc,
            description=f"Security group for Lambda processor {environment_suffix}",
            allow_all_outbound=True
        )

        # Allow Lambda to access database
        db_security_group.add_ingress_rule(
            peer=lambda_security_group,
            connection=ec2.Port.tcp(5432),
            description="Allow Lambda to access PostgreSQL"
        )

        # RDS PostgreSQL with proper configuration
        database = rds.DatabaseInstance(self, f"ProductCatalogDB-{environment_suffix}",
            engine=rds.DatabaseInstanceEngine.postgres(
                version=rds.PostgresEngineVersion.VER_14
            ),
            instance_type=ec2.InstanceType.of(
                ec2.InstanceClass.BURSTABLE3,
                ec2.InstanceSize.SMALL
            ),
            vpc=vpc,
            vpc_subnets=ec2.SubnetSelection(subnet_type=ec2.SubnetType.PRIVATE_WITH_EGRESS),
            security_groups=[db_security_group],
            credentials=rds.Credentials.from_secret(db_secret),
            database_name="productcatalog",
            allocated_storage=20,
            max_allocated_storage=100,
            backup_retention=Duration.days(0),
            deletion_protection=False,
            removal_policy=RemovalPolicy.DESTROY,
            storage_encrypted=True,
            multi_az=False,
            publicly_accessible=False
        )

        # ElastiCache security group
        cache_security_group = ec2.SecurityGroup(self, f"CacheSecurityGroup-{environment_suffix}",
            vpc=vpc,
            description=f"Security group for Redis cache {environment_suffix}"
        )

        # Allow Lambda to access Redis
        cache_security_group.add_ingress_rule(
            peer=lambda_security_group,
            connection=ec2.Port.tcp(6379),
            description="Allow Lambda to access Redis"
        )

        # ElastiCache subnet group
        cache_subnet_group = elasticache.CfnSubnetGroup(self, f"CacheSubnetGroup-{environment_suffix}",
            description=f"Subnet group for Redis cache {environment_suffix}",
            subnet_ids=vpc.select_subnets(subnet_type=ec2.SubnetType.PRIVATE_WITH_EGRESS).subnet_ids,
            cache_subnet_group_name=f"redis-subnet-group-{environment_suffix}"
        )

        # ElastiCache Redis Cluster
        redis_cluster = elasticache.CfnCacheCluster(self, f"RedisCluster-{environment_suffix}",
            cache_node_type="cache.t3.micro",
            engine="redis",
            num_cache_nodes=1,
            vpc_security_group_ids=[cache_security_group.security_group_id],
            cache_subnet_group_name=cache_subnet_group.ref,
            cluster_name=f"product-cache-{environment_suffix}",
            snapshot_retention_limit=0,
            auto_minor_version_upgrade=True
        )

        # Lambda execution role with proper permissions
        lambda_role = iam.Role(self, f"LambdaExecutionRole-{environment_suffix}",
            assumed_by=iam.ServicePrincipal("lambda.amazonaws.com"),
            role_name=f"inventory-processor-role-{environment_suffix}",
            managed_policies=[
                iam.ManagedPolicy.from_aws_managed_policy_name("service-role/AWSLambdaBasicExecutionRole"),
                iam.ManagedPolicy.from_aws_managed_policy_name("service-role/AWSLambdaVPCAccessExecutionRole")
            ]
        )

        # Grant necessary permissions
        archive_bucket.grant_read_write(lambda_role)
        db_secret.grant_read(lambda_role)
        inventory_stream.grant_read(lambda_role)

        # Additional permissions for Secrets Manager and CloudWatch
        lambda_role.add_to_policy(iam.PolicyStatement(
            effect=iam.Effect.ALLOW,
            actions=[
                "secretsmanager:GetSecretValue",
                "logs:CreateLogGroup",
                "logs:CreateLogStream",
                "logs:PutLogEvents"
            ],
            resources=["*"]
        ))

        # Lambda Layer for dependencies
        lambda_layer = lambda_.LayerVersion(self, f"DependenciesLayer-{environment_suffix}",
            code=lambda_.Code.from_asset("lib/lambda/layer"),
            compatible_runtimes=[lambda_.Runtime.PYTHON_3_9],
            description="PostgreSQL and Redis client libraries",
            layer_version_name=f"inventory-processor-deps-{environment_suffix}"
        )

        # Lambda function for stream processing
        processor_function = lambda_.Function(self, f"InventoryProcessor-{environment_suffix}",
            runtime=lambda_.Runtime.PYTHON_3_9,
            handler="inventory_processor.handler",
            code=lambda_.Code.from_asset("lib/lambda"),
            role=lambda_role,
            function_name=f"inventory-processor-{environment_suffix}",
            environment={
                "DB_SECRET_ARN": db_secret.secret_arn,
                "DB_NAME": "productcatalog",
                "REDIS_ENDPOINT": redis_cluster.attr_redis_endpoint_address,
                "REDIS_PORT": redis_cluster.attr_redis_endpoint_port,
                "ARCHIVE_BUCKET": archive_bucket.bucket_name,
                "ENVIRONMENT_SUFFIX": environment_suffix
            },
            timeout=Duration.seconds(60),
            memory_size=512,
            vpc=vpc,
            vpc_subnets=ec2.SubnetSelection(subnet_type=ec2.SubnetType.PRIVATE_WITH_EGRESS),
            security_groups=[lambda_security_group],
            layers=[lambda_layer],
            reserved_concurrent_executions=10
        )

        # CloudWatch Log Group for Lambda
        log_group = logs.LogGroup(self, f"ProcessorLogs-{environment_suffix}",
            log_group_name=f"/aws/lambda/{processor_function.function_name}",
            removal_policy=RemovalPolicy.DESTROY,
            retention=logs.RetentionDays.ONE_WEEK
        )

        # Lambda event source mapping with proper error handling
        event_source = lambda_.EventSourceMapping(self, f"KinesisEventSource-{environment_suffix}",
            target=processor_function,
            event_source_arn=inventory_stream.stream_arn,
            starting_position=lambda_.StartingPosition.LATEST,
            batch_size=100,
            max_batching_window=Duration.seconds(5),
            retry_attempts=3,
            max_record_age=Duration.hours(24),
            parallelization_factor=1,
            bisect_batch_on_error=True,
            on_failure=lambda_.DestinationConfig(
                on_failure=lambda_.SqsDestination(
                    queue=self._create_dlq(environment_suffix)
                )
            )
        )

        # Outputs
        CfnOutput(self, "KinesisStreamName",
            value=inventory_stream.stream_name,
            description="Kinesis stream name for inventory updates"
        )

        CfnOutput(self, "DatabaseEndpoint",
            value=database.db_instance_endpoint_address,
            description="RDS database endpoint"
        )

        CfnOutput(self, "RedisEndpoint",
            value=redis_cluster.attr_redis_endpoint_address,
            description="Redis cache endpoint"
        )

        CfnOutput(self, "ArchiveBucket",
            value=archive_bucket.bucket_name,
            description="S3 bucket for archival"
        )

    def _create_dlq(self, environment_suffix: str):
        """Create DLQ for failed Lambda processing"""
        from aws_cdk import aws_sqs as sqs

        dlq = sqs.Queue(self, f"ProcessorDLQ-{environment_suffix}",
            queue_name=f"inventory-processor-dlq-{environment_suffix}",
            retention_period=Duration.days(14),
            removal_policy=RemovalPolicy.DESTROY
        )
        return dlq
```

## File: lib/lambda/inventory_processor.py

```python
import json
import os
import boto3
import psycopg2
import redis
from datetime import datetime
from typing import Dict, Any
import base64
import logging

# Configure logging
logger = logging.getLogger()
logger.setLevel(logging.INFO)

# Initialize AWS clients
secretsmanager = boto3.client('secretsmanager')
s3 = boto3.client('s3')

# Cache database credentials
db_credentials = None
redis_client = None

def get_db_credentials():
    """Retrieve and cache database credentials"""
    global db_credentials

    if db_credentials is None:
        try:
            secret_arn = os.environ['DB_SECRET_ARN']
            response = secretsmanager.get_secret_value(SecretId=secret_arn)
            db_credentials = json.loads(response['SecretString'])
            logger.info("Successfully retrieved database credentials")
        except Exception as e:
            logger.error(f"Error retrieving database credentials: {str(e)}")
            raise

    return db_credentials

def get_redis_client():
    """Get or create Redis client"""
    global redis_client

    if redis_client is None:
        try:
            redis_endpoint = os.environ['REDIS_ENDPOINT']
            redis_port = int(os.environ.get('REDIS_PORT', '6379'))
            redis_client = redis.Redis(
                host=redis_endpoint,
                port=redis_port,
                decode_responses=True,
                socket_connect_timeout=5,
                socket_timeout=5
            )
            logger.info(f"Connected to Redis at {redis_endpoint}:{redis_port}")
        except Exception as e:
            logger.error(f"Error connecting to Redis: {str(e)}")
            raise

    return redis_client

def get_db_connection():
    """Create database connection"""
    try:
        credentials = get_db_credentials()
        db_name = os.environ['DB_NAME']

        # Get RDS endpoint from environment or derive from credentials
        db_host = os.environ.get('DB_HOST', credentials.get('host'))

        conn = psycopg2.connect(
            host=db_host,
            database=db_name,
            user=credentials['username'],
            password=credentials['password'],
            connect_timeout=10
        )
        logger.info("Successfully connected to database")
        return conn
    except Exception as e:
        logger.error(f"Error connecting to database: {str(e)}")
        raise

def archive_to_s3(data: Dict[str, Any], product_id: str) -> bool:
    """Archive inventory update to S3"""
    try:
        bucket_name = os.environ['ARCHIVE_BUCKET']
        timestamp = datetime.utcnow().isoformat()
        key = f"inventory/{datetime.utcnow().year}/{datetime.utcnow().month:02d}/{datetime.utcnow().day:02d}/{product_id}_{timestamp}.json"

        s3.put_object(
            Bucket=bucket_name,
            Key=key,
            Body=json.dumps(data),
            ContentType='application/json',
            ServerSideEncryption='AES256'
        )

        logger.info(f"Archived inventory update to s3://{bucket_name}/{key}")
        return True
    except Exception as e:
        logger.error(f"Error archiving to S3: {str(e)}")
        return False

def update_database(data: Dict[str, Any]) -> bool:
    """Update product inventory in database"""
    conn = None
    cursor = None

    try:
        conn = get_db_connection()
        cursor = conn.cursor()

        # Update or insert product inventory
        query = """
            INSERT INTO products (product_id, inventory, price, last_updated)
            VALUES (%(product_id)s, %(inventory)s, %(price)s, %(last_updated)s)
            ON CONFLICT (product_id)
            DO UPDATE SET
                inventory = EXCLUDED.inventory,
                price = EXCLUDED.price,
                last_updated = EXCLUDED.last_updated
        """

        cursor.execute(query, {
            'product_id': data['product_id'],
            'inventory': data.get('inventory', 0),
            'price': data.get('price'),
            'last_updated': datetime.utcnow()
        })

        conn.commit()
        logger.info(f"Updated database for product {data['product_id']}")
        return True

    except Exception as e:
        logger.error(f"Error updating database: {str(e)}")
        if conn:
            conn.rollback()
        return False
    finally:
        if cursor:
            cursor.close()
        if conn:
            conn.close()

def invalidate_cache(product_id: str) -> bool:
    """Invalidate Redis cache for product"""
    try:
        cache = get_redis_client()
        cache_key = f"product:{product_id}"

        result = cache.delete(cache_key)
        logger.info(f"Invalidated cache for product {product_id}: {result}")
        return True
    except Exception as e:
        logger.error(f"Error invalidating cache: {str(e)}")
        return False

def process_record(record: Dict[str, Any]) -> Dict[str, Any]:
    """Process a single Kinesis record"""
    try:
        # Decode Kinesis data
        payload = base64.b64decode(record['kinesis']['data'])
        data = json.loads(payload)

        logger.info(f"Processing inventory update for product {data.get('product_id')}")

        # Validate required fields
        if 'product_id' not in data:
            raise ValueError("Missing required field: product_id")

        product_id = data['product_id']

        # Archive to S3 (compliance requirement)
        archive_success = archive_to_s3(data, product_id)

        # Update database
        db_success = update_database(data)

        # Invalidate cache
        cache_success = invalidate_cache(product_id)

        return {
            'product_id': product_id,
            'status': 'success',
            'archive': archive_success,
            'database': db_success,
            'cache': cache_success
        }

    except Exception as e:
        logger.error(f"Error processing record: {str(e)}")
        return {
            'status': 'error',
            'error': str(e)
        }

def handler(event, context):
    """Lambda handler for Kinesis stream processing"""
    logger.info(f"Processing batch of {len(event['Records'])} records")

    results = {
        'batchItemFailures': []
    }

    for record in event['Records']:
        try:
            result = process_record(record)

            if result['status'] == 'error':
                # Add to batch item failures for retry
                results['batchItemFailures'].append({
                    'itemIdentifier': record['kinesis']['sequenceNumber']
                })
                logger.error(f"Failed to process record: {result.get('error')}")
            else:
                logger.info(f"Successfully processed product {result['product_id']}")

        except Exception as e:
            logger.error(f"Unexpected error processing record: {str(e)}")
            results['batchItemFailures'].append({
                'itemIdentifier': record['kinesis']['sequenceNumber']
            })

    logger.info(f"Batch processing complete. Failures: {len(results['batchItemFailures'])}")
    return results
```

## File: lib/lambda/layer/python/requirements.txt

```txt
psycopg2-binary==2.9.9
redis==5.0.1
```

## File: lib/README.md

```markdown
# Product Catalog Data Pipeline

AWS CDK infrastructure for processing real-time inventory updates for an e-commerce platform.

## Architecture

- **Amazon Kinesis Data Streams**: Ingests real-time inventory updates from suppliers
- **AWS Lambda**: Processes stream data, validates, and routes to storage
- **Amazon RDS PostgreSQL**: Stores product catalog with transactional consistency
- **Amazon ElastiCache Redis**: Caches frequently accessed product data
- **Amazon S3**: Archives all inventory updates for 3-year compliance retention
- **AWS Secrets Manager**: Securely manages database credentials

## Prerequisites

- AWS CLI configured
- AWS CDK CLI installed (`npm install -g aws-cdk`)
- Python 3.8 or higher
- CDK environment bootstrapped in us-east-1

## Setup

1. Install Python dependencies:
```bash
pip install -r requirements.txt
```

2. Install Lambda layer dependencies:
```bash
mkdir -p lib/lambda/layer/python
pip install -r lib/lambda/layer/python/requirements.txt -t lib/lambda/layer/python/
```

3. Synthesize CloudFormation template:
```bash
cdk synth
```

4. Deploy the stack:
```bash
cdk deploy --parameters environmentSuffix=dev
```

## Configuration

The stack accepts an `environment_suffix` parameter for unique resource naming:

```python
app = App()
TapStack(app, "ProductCatalogStack", environment_suffix="dev")
```

## Database Schema

The Lambda function expects this PostgreSQL schema:

```sql
CREATE TABLE products (
    product_id VARCHAR(255) PRIMARY KEY,
    inventory INTEGER NOT NULL,
    price DECIMAL(10, 2),
    last_updated TIMESTAMP NOT NULL
);
```

## Testing

Send test inventory update to Kinesis:

```bash
aws kinesis put-record \
    --stream-name inventory-updates-dev \
    --partition-key product123 \
    --data '{"product_id": "product123", "inventory": 100, "price": 29.99}'
```

## Monitoring

CloudWatch Logs are available at:
- `/aws/lambda/inventory-processor-{environmentSuffix}`

Key metrics to monitor:
- Kinesis stream iterator age
- Lambda error rate and duration
- Database connection pool utilization
- Redis cache hit rate

## Compliance

All inventory updates are archived to S3 with:
- 3-year retention (1095 days)
- Automatic lifecycle transitions to Glacier after 90 days
- Encryption at rest

## Cleanup

```bash
cdk destroy
```

All resources are configured with `RemovalPolicy.DESTROY` for complete cleanup.
```
