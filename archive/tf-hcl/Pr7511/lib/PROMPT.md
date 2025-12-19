Generate a single Terraform file named tap_stack.tf that builds a fraud-detection pipeline with full multi-environment consistency (dev, staging, prod). Follow these instructions exactly and include every detail below without adding anything beyond them.

Requirements:

File structure

A single file: tap_stack.tf

Include:

terraform block with required_version and required_providers (no provider blocks)

All variable declarations with correct types, descriptions, and sane defaults where appropriate

All locals for naming, tagging, and per-environment capacity maps

All AWS resources and data sources defined directly in this file

Outputs for all required endpoints, ARNs, and IDs

At the end of the file, include three example tfvars files: dev.tfvars, staging.tfvars, and prod.tfvars

General constraints

Provider configuration already exists in provider.tf, using variable aws_region

Declare variable aws_region here, but do not include any provider blocks

Enforce strict topology parity across dev/staging/prod (same services, same resource count)

Only performance/capacity values may differ by environment through variables

Use deterministic naming, least-privilege IAM, encryption everywhere, and idempotent patterns

No Kubernetes/ECS/containers

No hardcoded AWS region

No placeholders or pseudo-code—must be full real Terraform

Networking

VPC with CIDR, 2+ public subnets, 2+ private subnets

NAT gateway

Security groups

All Lambda functions in VPC so they can access Redis and Aurora

No public internet access except via NAT

Add VPC endpoints for DynamoDB, Kinesis, SageMaker Runtime, SNS, and SQS

Fraud-detection topology (must be identical in all environments)

Kinesis Data Stream for ingesting transactions (mode, shards, retention configurable)

Lambda fraud scorer consumes Kinesis, scores events, writes to DynamoDB table with streams enabled

DynamoDB stream triggers analyzer Lambda

Analyzer queries ElastiCache Redis

Analyzer invokes SageMaker endpoint (via data "aws_sagemaker_endpoint" using the variable)

High-risk results published to SNS topic → triggers Lambda that updates Aurora PostgreSQL (freeze accounts)

Separate SNS alerts topic → fans out to SQS queue for compliance notifications

EventBridge rule monitors CloudWatch metrics and triggers Step Functions workflow if fraud rate exceeds threshold

Step Functions workflow:

Lambda queries Aurora for history

Lambda queries S3 using Athena

Lambda writes evidence report to S3

Reconciliation Lambda consumes SQS and updates DynamoDB with investigation results

Storage & ML

DynamoDB table with billing mode, capacity vars, stream_view_type

S3 buckets for evidence and Athena output

Versioning

Server-side encryption

Intelligent tiering

Lifecycle expiration

SageMaker endpoint through data source lookup

Other infrastructure

Redis (ElastiCache) cluster: node type, num nodes, engine version, failover options

Aurora PostgreSQL (serverless v2 or variable-driven capacities)

Secrets Manager secret for Aurora credentials with rotation

IAM roles with least privilege covering:

Kinesis GetRecords

DynamoDB Streams read

SageMaker InvokeEndpoint

Redis access

Aurora access (via Secrets Manager)

S3 read/write

Athena queries

SNS publish

SQS receive/delete

Lambda deployment with archive_file, runtime Python 3.12, memory and timeout from variables

Event source mappings:

Kinesis → fraud scorer Lambda

DynamoDB Stream → analyzer Lambda

Step Functions state machine using templatefile

CloudWatch alarms for:

Kinesis GetRecords throttling

Lambda error rates

DynamoDB write throttling

SageMaker endpoint latency

Aurora active connections

CloudWatch log metric filters for fraud detection rates

Variables (must declare all)

env, aws_region, project_name, owner, cost_center, common_tags

VPC cidrs, subnets, AZs

Kinesis: name, mode, shard_count, retention_hours

DynamoDB: table name, billing mode, rcu, wcu, stream_view_type

Lambda: memory/timeout for fraud scorer & analyzer, runtime

SageMaker: fraud_model_endpoint_name

Redis: node_type, num_cache_clusters, engine_version, automatic_failover_enabled

Aurora: engine, engine_version, master_username, instance_class, min_capacity, max_capacity

SNS/SQS: alert_topic_name, compliance_queue_name, message_retention_seconds

EventBridge: fraud_rate_threshold, evaluation_period_minutes

S3: evidence_bucket_name, athena_results_bucket_name, lifecycle_expiration_days

CloudWatch: log_retention_days

Outputs

Kinesis stream ARN

DynamoDB table name

SNS topic ARNs

SQS queue URL

Aurora endpoints

Redis endpoint

All Lambda ARNs

Step Functions ARN

S3 bucket names

VPC ID and subnet IDs