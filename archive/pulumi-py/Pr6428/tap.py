"""
Optimized Streaming Data Pipeline Infrastructure
Demonstrates advanced Pulumi patterns for deployment optimization:
- Custom ComponentResource for resource encapsulation
- Batched resource creation with apply()
- Explicit dependency management
- Provider-level optimization
- Resource tagging with loops
"""

import json
from typing import Dict, List

import pulumi
import pulumi_aws as aws

from lib.lambda_functions import LambdaFunctionsComponent
from lib.streaming_pipeline_component import StreamingPipelineComponent
from lib.vpc_infrastructure import VpcInfrastructure

# Get configuration
config = pulumi.Config()
environment_suffix = config.get("environmentSuffix") or pulumi.get_stack()
aws_region = config.get("region") or "us-east-1"

# Configure AWS provider with optimization settings
aws_provider = aws.Provider(
    "optimized-provider",
    region=aws_region,
    # Provider-level optimizations
    skip_credentials_validation=False,
    skip_metadata_api_check=False,
    skip_requesting_account_id=False,
    max_retries=10,
    # Custom retry configuration
    opts=pulumi.ResourceOptions(
        custom_timeouts=pulumi.CustomTimeouts(
            create="30m",
            update="30m",
            delete="30m"
        )
    )
)

# Common tags applied to all resources
common_tags = {
    "Environment": environment_suffix,
    "Project": "StreamingPipeline",
    "ManagedBy": "Pulumi",
    "CostCenter": "DataEngineering"
}

# Step 1: Create VPC infrastructure with VPC endpoints
# This must be created first to support Lambda and other services
vpc_infra = VpcInfrastructure(
    "vpc-infrastructure",
    environment_suffix=environment_suffix,
    common_tags=common_tags,
    opts=pulumi.ResourceOptions(provider=aws_provider)
)

# Step 2: Create S3 bucket for data archival (Pulumi AWS v7+ compatible)
# Independent resource - can be created in parallel

# Ensure environment suffix is lowercase (S3 bucket names must be lowercase)
safe_suffix = environment_suffix.lower()
bucket_name = f"streaming-archive-{safe_suffix}"

archive_bucket = aws.s3.BucketV2(
    f"archive-bucket-{safe_suffix}",
    bucket=bucket_name,
    tags={**common_tags, "Name": f"archive-bucket-{safe_suffix}"},
    opts=pulumi.ResourceOptions(provider=aws_provider)
)

# Apply versioning (new resource type)
archive_bucket_versioning = aws.s3.BucketVersioningV2(
    f"archive-bucket-versioning-{safe_suffix}",
    bucket=archive_bucket.id,
    versioning_configuration=aws.s3.BucketVersioningV2VersioningConfigurationArgs(
        status="Enabled"
    ),
    opts=pulumi.ResourceOptions(provider=aws_provider)
)

# Apply server-side encryption (new resource type)
archive_bucket_encryption = aws.s3.BucketServerSideEncryptionConfigurationV2(
    f"archive-bucket-encryption-{safe_suffix}",
    bucket=archive_bucket.id,
    rules=[
        aws.s3.BucketServerSideEncryptionConfigurationV2RuleArgs(
            apply_server_side_encryption_by_default=aws.s3.BucketServerSideEncryptionConfigurationV2RuleApplyServerSideEncryptionByDefaultArgs(
                sse_algorithm="AES256"
            )
        )
    ],
    opts=pulumi.ResourceOptions(provider=aws_provider)
)

# Apply lifecycle configuration (new resource type)
archive_bucket_lifecycle = aws.s3.BucketLifecycleConfigurationV2(
    f"archive-bucket-lifecycle-{safe_suffix}",
    bucket=archive_bucket.id,
    rules=[
        aws.s3.BucketLifecycleConfigurationV2RuleArgs(
            id="transition-to-ia",
            status="Enabled",
            transitions=[
                aws.s3.BucketLifecycleConfigurationV2RuleTransitionArgs(
                    days=30,
                    storage_class="STANDARD_IA"
                ),
                aws.s3.BucketLifecycleConfigurationV2RuleTransitionArgs(
                    days=90,
                    storage_class="GLACIER"
                )
            ]
        )
    ],
    opts=pulumi.ResourceOptions(provider=aws_provider)
)

# Block public access to archive bucket
archive_bucket_public_access_block = aws.s3.BucketPublicAccessBlock(
    f"archive-bucket-public-access-block-{safe_suffix}",
    bucket=archive_bucket.id,
    block_public_acls=True,
    block_public_policy=True,
    ignore_public_acls=True,
    restrict_public_buckets=True,
    opts=pulumi.ResourceOptions(
        provider=aws_provider,
        depends_on=[archive_bucket]
    )
)

# Step 3: Create Kinesis Data Stream
# Independent resource - can be created in parallel
kinesis_stream = aws.kinesis.Stream(
    f"data-stream-{environment_suffix}",
    name=f"streaming-data-{environment_suffix}",
    shard_count=10,
    retention_period=24,
    shard_level_metrics=[
        "IncomingBytes",
        "IncomingRecords",
        "OutgoingBytes",
        "OutgoingRecords",
        "WriteProvisionedThroughputExceeded",
        "ReadProvisionedThroughputExceeded"
    ],
    encryption_type="KMS",
    kms_key_id="alias/aws/kinesis",
    tags={**common_tags, "Name": f"data-stream-{environment_suffix}"},
    opts=pulumi.ResourceOptions(
        provider=aws_provider,
        custom_timeouts=pulumi.CustomTimeouts(
            create="10m",
            update="10m",
            delete="10m"
        )
    )
)

# Step 4: Create DynamoDB table with GSI
# Independent resource - can be created in parallel
dynamodb_table = aws.dynamodb.Table(
    f"state-table-{environment_suffix}",
    name=f"pipeline-state-{environment_suffix}",
    billing_mode="PROVISIONED",
    read_capacity=5000,
    write_capacity=5000,
    hash_key="PipelineId",
    range_key="Timestamp",
    attributes=[
        aws.dynamodb.TableAttributeArgs(
            name="PipelineId",
            type="S"
        ),
        aws.dynamodb.TableAttributeArgs(
            name="Timestamp",
            type="N"
        ),
        aws.dynamodb.TableAttributeArgs(
            name="Status",
            type="S"
        )
    ],
    global_secondary_indexes=[
        aws.dynamodb.TableGlobalSecondaryIndexArgs(
            name="StatusIndex",
            hash_key="Status",
            range_key="Timestamp",
            projection_type="ALL",
            read_capacity=2500,
            write_capacity=2500
        )
    ],
    ttl=aws.dynamodb.TableTtlArgs(
        attribute_name="ExpirationTime",
        enabled=True
    ),
    server_side_encryption=aws.dynamodb.TableServerSideEncryptionArgs(
        enabled=True
    ),
    point_in_time_recovery=aws.dynamodb.TablePointInTimeRecoveryArgs(
        enabled=True
    ),
    tags={**common_tags, "Name": f"state-table-{environment_suffix}"},
    opts=pulumi.ResourceOptions(
        provider=aws_provider,
        custom_timeouts=pulumi.CustomTimeouts(
            create="15m",
            update="15m",
            delete="15m"
        )
    )
)

# Step 5: Create Lambda functions component
# Depends on VPC infrastructure
lambda_functions = LambdaFunctionsComponent(
    "lambda-functions",
    environment_suffix=environment_suffix,
    vpc_id=vpc_infra.vpc_id,
    private_subnet_ids=vpc_infra.private_subnet_ids,
    vpc_security_group_id=vpc_infra.lambda_security_group_id,
    kinesis_stream_arn=kinesis_stream.arn,
    dynamodb_table_name=dynamodb_table.name,
    dynamodb_table_arn=dynamodb_table.arn,
    archive_bucket_name=archive_bucket.id,
    archive_bucket_arn=archive_bucket.arn,
    common_tags=common_tags,
    opts=pulumi.ResourceOptions(
        provider=aws_provider,
        depends_on=[vpc_infra, kinesis_stream, dynamodb_table, archive_bucket]
    )
)

# Step 6: Create streaming pipeline component (encapsulates related resources)
streaming_pipeline = StreamingPipelineComponent(
    "streaming-pipeline",
    environment_suffix=environment_suffix,
    kinesis_stream_arn=kinesis_stream.arn,
    lambda_function_arns=lambda_functions.function_arns,
    dynamodb_table_name=dynamodb_table.name,
    common_tags=common_tags,
    opts=pulumi.ResourceOptions(
        provider=aws_provider,
        depends_on=[kinesis_stream, lambda_functions, dynamodb_table]
    )
)

# Step 7: Create CloudWatch Dashboard (optional enhancement)
dashboard_body = pulumi.Output.all(
    kinesis_stream.name,
    dynamodb_table.name,
    lambda_functions.function_names
).apply(lambda args: json.dumps({
    "widgets": [
        {
            "type": "metric",
            "properties": {
                "metrics": [
                    ["AWS/Kinesis", "IncomingRecords", {"stat": "Sum", "label": "Incoming Records"}],
                    [".", "IncomingBytes", {"stat": "Sum", "label": "Incoming Bytes"}],
                    [".", "GetRecords.Success", {"stat": "Sum", "label": "Successful Gets"}]
                ],
                "period": 300,
                "stat": "Average",
                "region": aws_region,
                "title": "Kinesis Stream Metrics",
                "yAxis": {"left": {"label": "Count"}}
            }
        },
        {
            "type": "metric",
            "properties": {
                "metrics": [
                    ["AWS/DynamoDB", "ConsumedReadCapacityUnits", {"stat": "Sum"}],
                    [".", "ConsumedWriteCapacityUnits", {"stat": "Sum"}],
                    [".", "UserErrors", {"stat": "Sum"}]
                ],
                "period": 300,
                "stat": "Average",
                "region": aws_region,
                "title": "DynamoDB Table Metrics",
                "yAxis": {"left": {"label": "Units"}}
            }
        },
        {
            "type": "metric",
            "properties": {
                "metrics": [[{"expression": f"SEARCH('{{AWS/Lambda,FunctionName}} MetricName=\"Duration\" ', 'Average', 300)", "id": "e1"}]],
                "period": 300,
                "stat": "Average",
                "region": aws_region,
                "title": "Lambda Function Duration",
                "yAxis": {"left": {"label": "Milliseconds"}}
            }
        }
    ]
}))

cloudwatch_dashboard = aws.cloudwatch.Dashboard(
    f"pipeline-dashboard-{environment_suffix}",
    dashboard_name=f"streaming-pipeline-{environment_suffix}",
    dashboard_body=dashboard_body,
    opts=pulumi.ResourceOptions(
        provider=aws_provider,
        depends_on=[kinesis_stream, dynamodb_table, lambda_functions]
    )
)

# Export outputs for cross-stack references
pulumi.export("vpc_id", vpc_infra.vpc_id)
pulumi.export("private_subnet_ids", vpc_infra.private_subnet_ids)
pulumi.export("kinesis_stream_name", kinesis_stream.name)
pulumi.export("kinesis_stream_arn", kinesis_stream.arn)
pulumi.export("dynamodb_table_name", dynamodb_table.name)
pulumi.export("dynamodb_table_arn", dynamodb_table.arn)
pulumi.export("archive_bucket_name", archive_bucket.id)
pulumi.export("archive_bucket_arn", archive_bucket.arn)
pulumi.export("lambda_function_arns", lambda_functions.function_arns)
pulumi.export("lambda_function_names", lambda_functions.function_names)
pulumi.export("cloudwatch_dashboard_name", cloudwatch_dashboard.dashboard_name)
pulumi.export("environment_suffix", environment_suffix)
pulumi.export("region", aws_region)
