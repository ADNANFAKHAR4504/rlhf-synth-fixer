Generate tap_stack.tf for Multi-Environment Consistency (Terraform)

You are an expert Terraform engineer. Produce production-ready Terraform that enforces multi-environment (dev, staging, prod) topology parity for a social media interaction processing pipeline. Follow all constraints exactly.

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
- API Gateway WebSocket API receives real-time interaction events (like/comment/share), Lambda function validates and writes to Kinesis Data Stream with partition key user_id for ordered processing per user
- Lambda Kinesis consumer processes interactions, updates DynamoDB interactions table with composite key (content_id, timestamp), increments counters in DynamoDB content_metrics table (likes_count, comments_count, shares_count) using atomic updates, writes to DynamoDB streams-enabled table
- DynamoDB streams trigger Lambda notification generator that queries DynamoDB user_preferences table for notification settings, filters based on user preferences (stored in ElastiCache Redis for low latency), publishes notifications to SNS user-notifications topic with MessageAttributes for user_id and notification_type
- SNS fans out to multiple SQS queues based on notification type (push, email, sms) using message filtering, Lambda consumers on each queue send notifications via external services (mock API calls via API Gateway HTTP endpoint)
- Content moderation workflow: Lambda moderation function subscribed to Kinesis stream checks for inappropriate content using keywords from DynamoDB moderation_rules table, publishes flagged content to SNS moderation-queue topic which triggers Lambda that invokes SageMaker endpoint (data source) for ML-based content classification
- If content violates policies (confidence > threshold), Lambda updates DynamoDB interactions table with moderated=true flag, publishes to SNS content-removed topic which triggers Lambda to delete content references from ElastiCache and update Aurora PostgreSQL content_violations table for audit trail
- EventBridge scheduled rule triggers Step Functions hourly for trending analysis: Lambda queries DynamoDB content_metrics for top interactions, Lambda calculates trending scores considering recency and velocity, updates DynamoDB trending_content table with TTL (6 hours), populates Redis sorted set for fast trending feed API
- Lambda webhook processor triggered by S3 PUT events (user-uploaded content like images stored in S3) validates file size and type, updates DynamoDB content_catalog table with S3 keys, publishes to SNS new-content topic for downstream processing
- CloudWatch alarms for WebSocket API connection count, Kinesis iterator age, Lambda moderation function duration, DynamoDB throttled writes (high interaction volume), Redis memory usage, Aurora write latency, SQS notification queue depth, Step Functions execution errors
- VPC Lambda functions for Aurora and Redis access

Variables:
- env, aws_region, project_name, owner, cost_center, common_tags
- VPC: vpc_cidr, public_subnet_cidrs, private_subnet_cidrs, num_azs
- API Gateway: websocket_api_name, stage_name, route_selection_expression
- Kinesis: interactions_stream_name, stream_mode, shard_count, retention_hours
- DynamoDB: interactions_table, metrics_table, preferences_table, rules_table, violations_table, trending_table, catalog_table, billing_mode, rcu, wcu, ttl_attribute
- Lambda: validator_memory, processor_memory, notifier_memory, moderator_memory, classifier_memory, trending_memory, webhook_memory, timeout_s, runtime
- Redis: node_type, num_cache_nodes, engine_version, auth_token_enabled, transit_encryption_enabled
- Aurora: database_name, master_username, instance_class, min_capacity, max_capacity, backup_retention_days
- SageMaker: moderation_endpoint_name (data source)
- SNS: notifications_topic, moderation_topic, removed_topic, new_content_topic
- SQS: push_queue, email_queue, sms_queue, visibility_timeout_seconds, message_retention_seconds
- EventBridge: trending_schedule_expression
- S3: content_bucket_name, lifecycle_transition_days, cors_allowed_origins
- CloudWatch: log_retention_days, alarm_threshold_messages

Implementation Details:
- API Gateway WebSocket API with $connect, $disconnect, and custom routes, Lambda integrations with IAM authorization
- Lambda functions via archive_file with Python 3.12 for event validation, interaction processing with DynamoDB atomic counters, notification generation with filtering logic, content moderation with keyword matching, ML classification orchestration, trending score calculation, webhook handling
- IAM roles: WebSocket API invoke Lambda, Lambda to Kinesis read/write, DynamoDB read/write with streams and atomic updates, Redis via VPC, Aurora via Secrets Manager, SageMaker InvokeEndpoint, SNS publish with attributes, SQS receive/delete/changeVisibility, S3 read/write with presigned URL generation
- Event source mapping for Kinesis with parallelization factor, batch window
- DynamoDB streams event source mappings with bisect batch on function error
- ElastiCache Redis cluster with TLS, auth token from Secrets Manager, client output buffer limits tuned for pub/sub
- SNS topics with KMS encryption, SQS subscriptions with FilterPolicy for message routing based on MessageAttributes
- SQS with DLQ for failed notifications, FIFO queues for email to preserve order
- Step Functions state machine using templatefile with Map state for parallel trending calculation across content types
- S3 bucket with CORS configuration for direct uploads, event notifications with prefix filtering for content types
- VPC endpoints for DynamoDB, Kinesis, S3, SNS, SQS, SageMaker Runtime
- CloudWatch Logs Insights for debugging interaction patterns, metric filters for tracking moderation rates
- Secrets Manager for Aurora credentials and Redis auth token with rotation

Outputs:
- WebSocket API invoke URL, Kinesis stream ARN, DynamoDB table names, SNS topic ARNs, SQS queue URLs, Aurora endpoints, Redis endpoint, Step Functions ARN, Lambda ARNs, S3 bucket name, VPC/subnet/SG IDs

Parity & Allowed Diffs:
- Same resource graph across envs
- Allowed to differ: WebSocket concurrent connections limit, Kinesis shards, Lambda memory/concurrency, DynamoDB capacity, Redis nodes, Aurora capacity, SQS retention, trending TTL, alarm thresholds
- Disallowed: different API routes, notification types, or moderation logic

Code Quality:
- Terraform >= 1.5, AWS provider ~> 5.0
- Use for_each to create SQS queues with SNS subscriptions and filter policies
- Detailed comments on atomic counter pattern and notification filtering