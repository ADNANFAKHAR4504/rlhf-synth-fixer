Generate tap_stack.tf for Multi-Environment Consistency (Terraform)

You are an expert Terraform engineer. Produce production-ready Terraform that enforces multi-environment (dev, staging, prod) topology parity for a video streaming user activity pipeline. Follow all constraints exactly.

Deliverables:
A single file named tap_stack.tf containing:
- terraform block with required_version and required_providers (no provider config here)
- All variable declarations (with types, descriptions, sane defaults where appropriate)
- All resources and data sources (see Required Topology)
- Locals for naming, tagging, and per-env capacity maps
- Outputs for key endpoints/ARNs/IDs
- Include three example var files at the end: dev.tfvars, staging.tfvars, prod.tfvars

Important Constraints:
- Provider config is already in provider.tf and uses variable aws_region
- In tap_stack.tf, declare variable ""aws_region"" (type string, no provider blocks)
- Single-file implementation: all resources defined directly in tap_stack.tf
- Topology parity: dev/staging/prod must have identical resource types and counts
- Best practices: encryption, least-privilege IAM, deterministic naming, idempotency
- Networking: VPC with public/private subnets, NAT, security groups, place VPC resources accordingly
- No placeholders or pseudo-code: write actual aws_* resources
- AWS services only, no Kubernetes/ECS/container orchestration

Required Topology (same in every env; only capacities differ):
- API Gateway REST API with /watch, /pause, /complete endpoints triggers Lambda functions that write viewing events to Kinesis Data Stream
- Lambda Kinesis consumer processes events, updates DynamoDB user_activity table (partition key: user_id, sort key: timestamp) with streams enabled, increments watch progress and last_viewed fields
- DynamoDB streams trigger Lambda recommendations engine that queries user_activity for viewing patterns, queries ElastiCache Redis for content metadata and collaborative filtering data (cached from Aurora), invokes SageMaker endpoint (data source) for ML recommendations, writes top 10 recommendations to DynamoDB user_recommendations table with TTL (24 hours)
- Separate Lambda function subscribed to Kinesis stream detects 'complete' events, publishes completion to SNS watched-complete topic which fans out to two SQS queues: analytics_queue and achievements_queue
- Lambda analytics consumer aggregates completions per content_id and updates Aurora PostgreSQL content_stats table with view counts and completion rates
- Lambda achievements consumer checks user_activity for milestones (10th video, 100th hour), writes badges to DynamoDB user_achievements table, publishes notification to SNS user-notifications topic
- EventBridge scheduled rule triggers Step Functions nightly for content expiration: Lambda queries Aurora for content with license_expiry_date < today, Lambda updates DynamoDB content_catalog table with expired=true flag, Lambda removes expired content IDs from ElastiCache recommendations cache, Lambda archives viewing data to S3 via Athena CTAS query
- S3 bucket stores archived viewing data with partitioning by year/month, second S3 bucket for video thumbnails referenced in DynamoDB, Lambda triggered by thumbnail uploads validates image and updates content_catalog
- CloudWatch alarms for API Gateway latency, Lambda recommendation engine duration (p95), DynamoDB hot partitions (user_activity table), Kinesis GetRecords throttling, Redis memory fragmentation, Aurora active transactions, SQS age of oldest message, Step Functions executions failed
- VPC Lambda functions for Aurora and Redis access

Variables:
- env, aws_region, project_name, owner, cost_center, common_tags
- VPC: vpc_cidr, public_subnet_cidrs, private_subnet_cidrs, num_availability_zones
- API Gateway: api_name, stage_name, throttle_rate_limit, throttle_burst_limit
- Kinesis: activity_stream_name, stream_mode, shard_count, retention_hours
- DynamoDB: activity_table, recommendations_table, achievements_table, catalog_table, billing_mode, rcu, wcu, ttl_attribute
- Lambda: event_processor_memory, recommendations_memory, analytics_memory, achievements_memory, expiration_memory, timeout_s, runtime
- Redis: node_type, num_cache_clusters, engine_version, auth_token_enabled
- Aurora: db_name, master_username, instance_class, min_capacity, max_capacity, backup_retention_days, preferred_maintenance_window
- SageMaker: recommendations_endpoint_name (data source)
- SNS: complete_topic, notifications_topic
- SQS: analytics_queue_name, achievements_queue_name, visibility_timeout_seconds, message_retention_seconds
- EventBridge: expiration_schedule_expression
- S3: archive_bucket_name, thumbnails_bucket_name, lifecycle_glacier_days
- Athena: workgroup_name, output_bucket
- CloudWatch: log_retention_days, alarm_latency_threshold

Implementation Details:
- API Gateway with request validators, method request/response models, Lambda proxy integration, CloudWatch access logs, X-Ray tracing
- Lambda functions via archive_file with Python 3.12 for event processing, ML recommendations orchestration, analytics aggregation, achievements logic, content expiration
- IAM roles: API Gateway invoke Lambda, Lambda to Kinesis read/write, DynamoDB read/write with streams and batch operations, Redis via VPC, Aurora via Secrets Manager, SageMaker InvokeEndpoint, SNS publish, SQS receive/delete, S3 read/write, Athena StartQueryExecution, Step Functions execution
- Event source mapping for Kinesis with parallelization factor and tumbling windows for aggregation
- DynamoDB streams event source mappings with batch size and bisect on error
- ElastiCache Redis cluster with auth token from Secrets Manager, transit encryption enabled
- Step Functions state machine using templatefile with parallel expiration tasks and error retry logic
- SNS topics with KMS encryption, SQS subscriptions with filter policies
- SQS with DLQ, long polling, content-based deduplication for achievements queue
- S3 buckets with versioning, intelligent tiering, event notifications for thumbnail processing
- Athena workgroup with encryption at rest and query result location
- VPC endpoints for DynamoDB, Kinesis, S3, SNS, SQS, SageMaker Runtime, Step Functions
- CloudWatch Logs Insights queries for debugging viewing patterns
- Secrets Manager for Aurora credentials and Redis auth token

Outputs:
- API Gateway invoke URL, Kinesis stream ARN, DynamoDB table names/ARNs, SNS topic ARNs, SQS queue URLs, Aurora endpoints, Redis endpoint, Step Functions ARN, Lambda ARNs, S3 buckets, Athena workgroup, VPC/subnet/SG IDs

Parity & Allowed Diffs:
- Same resource graph across envs
- Allowed to differ: API throttle limits, Kinesis shards, Lambda memory/timeout, DynamoDB capacity, Redis nodes, Aurora capacity, TTL duration, schedule frequency, alarm thresholds
- Disallowed: different API endpoints, recommendation logic, or event flows

Code Quality:
- Terraform >= 1.5, AWS provider ~> 5.0
- Use locals for API stage variables, common Lambda environment variables
- Comprehensive comments on recommendation algorithm flow