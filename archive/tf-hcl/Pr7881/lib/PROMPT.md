"Generate tap_stack.tf for Multi-Environment Consistency (Terraform)

You are an expert Terraform engineer. Produce production-ready Terraform that enforces multi-environment (dev, staging, prod) topology parity for a food delivery order processing pipeline. Follow all constraints exactly.

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
- API Gateway WebSocket API for real-time order tracking, Lambda connection handler stores connection_id mappings in DynamoDB connections table, Lambda disconnect handler removes entries
- API Gateway REST API /orders endpoint receives order placement requests, Lambda order validator writes to Kinesis Data Stream partitioned by restaurant_id for locality
- Lambda Kinesis consumer processes orders, queries ElastiCache Redis for restaurant availability and preparation time estimates (cached from Aurora restaurant_profiles table), queries DynamoDB driver_locations table with geohash GSI for available drivers within delivery radius
- Lambda matching algorithm calculates optimal driver assignment considering distance, current workload from DynamoDB driver_orders table, and dynamic pricing multipliers from Redis sorted sets (surge pricing by region), writes matched order to DynamoDB orders table with status='assigned' and streams enabled
- DynamoDB orders streams trigger Lambda that publishes order details to SNS order-events topic with MessageAttributes for order_stage (placed/assigned/picked_up/delivered), SNS fans out to multiple SQS queues for different consumers: restaurant_orders queue, driver_assignments queue, customer_notifications queue
- Lambda restaurant consumer sends order details to restaurant POS systems via API Gateway HTTP proxy integration (external endpoint), updates order status in DynamoDB when restaurant accepts
- Lambda driver consumer sends assignment to driver mobile app via WebSocket API (PostToConnection using connection_id from connections table), updates driver_orders table incrementing active_order_count
- Lambda customer consumer sends notifications via SNS to external notification service (email/SMS/push) using HTTP endpoint subscription
- Driver location tracking: Kinesis Data Stream receives GPS updates from driver app, Lambda processes location events updating driver_locations table with TTL (5 minutes), updates ElastiCache Redis geospatial index (GEOADD) for fast proximity queries, publishes location to WebSocket connections for customers tracking delivery
- Earnings calculation: EventBridge scheduled rule triggers Step Functions nightly for driver settlements: Lambda queries completed orders from DynamoDB filtering by delivery_date and driver_id, Lambda calculates earnings based on distance, time, surge multipliers, tips from Aurora pricing_rules table, Lambda writes to Aurora driver_earnings table and updates DynamoDB driver_profiles with balance
- Order analytics: Lambda subscribed to DynamoDB orders streams with filter for status='delivered' writes completed order metrics to Aurora analytics_orders table, updates ElastiCache Redis with real-time restaurant ratings and delivery time averages
- S3 bucket stores order receipts and delivery photos uploaded by drivers, Lambda triggered by S3 PUT events validates image, extracts metadata using Rekognition via API call, updates DynamoDB orders table with proof_of_delivery S3 key
- CloudWatch alarms for WebSocket connection failures, Kinesis GetRecords latency, Lambda matching function duration (p99), DynamoDB hot partitions on orders table, Redis memory fragmentation, Aurora connection pool saturation, SQS queue backlog, Step Functions earnings calculation failures
- VPC Lambda functions for Aurora and Redis

Variables:
- env, aws_region, project_name, owner, cost_center, common_tags
- VPC: vpc_cidr, public_subnet_cidrs, private_subnet_cidrs, availability_zones, enable_dns_hostnames
- API Gateway: websocket_api_name, rest_api_name, stage_name, throttle_burst_limit, throttle_rate_limit
- Kinesis: orders_stream_name, locations_stream_name, stream_mode, orders_shard_count, locations_shard_count, retention_hours
- DynamoDB: connections_table, orders_table, drivers_locations_table, driver_orders_table, driver_profiles_table, billing_mode, rcu, wcu, ttl_enabled, ttl_attribute_name
- Lambda: connection_handler_memory, validator_memory, consumer_memory, matcher_memory, restaurant_memory, driver_memory, customer_memory, location_memory, earnings_memory, analytics_memory, image_memory, timeout_s, runtime, reserved_concurrent_executions
- Redis: node_type, num_cache_clusters, engine_version, automatic_failover_enabled, multi_az_enabled
- Aurora: cluster_identifier, database_name, master_username, instance_class, min_capacity, max_capacity, backup_retention_days, preferred_backup_window
- SNS: order_events_topic, external_notifications_topic
- SQS: restaurant_queue_name, driver_queue_name, customer_queue_name, visibility_timeout_seconds, message_retention_seconds
- EventBridge: earnings_schedule_expression
- S3: receipts_bucket_name, delivery_photos_bucket_name, lifecycle_expiration_days
- Step Functions: earnings_workflow_name, max_concurrency
- CloudWatch: log_retention_days, alarm_p99_threshold_ms

Implementation Details:
- API Gateway WebSocket API with $connect, $disconnect, and sendmessage routes, Lambda integrations with response selection expressions
- API Gateway REST API with CORS, request validators, Lambda proxy integration for order placement
- Lambda functions via archive_file with Python 3.12 for connection management, order validation, stream processing with geospatial queries, intelligent matching algorithm with multi-criteria optimization, consumer notification logic, location tracking with Redis geo commands, earnings calculation with complex business rules, analytics aggregation, image validation
- IAM roles: WebSocket API execute-api:ManageConnections, Lambda to Kinesis GetRecords/PutRecords, DynamoDB read/write with streams and GSI queries, Redis GEOADD/GEORADIUS via VPC, Aurora via Secrets Manager, SNS publish with MessageAttributes, SQS receive/delete, S3 read/write with GetObject, Rekognition DetectLabels, Step Functions execution
- Event source mappings: Kinesis streams with parallelization and batch windows, DynamoDB streams with filter patterns for specific order statuses
- DynamoDB GSI on geohash for spatial queries of driver locations, TTL for automatic connection_id cleanup
- ElastiCache Redis cluster mode for horizontal scaling, geospatial commands for driver-customer distance calculations, sorted sets for surge pricing zones
- Step Functions state machine using templatefile with Map state for parallel driver earnings calculation, aggregate results
- SNS topics with KMS encryption, SQS subscriptions with FilterPolicy routing based on order_stage, HTTP subscriptions for external services
- SQS with DLQ, long polling for efficient consumption, visibility timeout matching Lambda processing time
- EventBridge rule with cron schedule for nightly batch jobs
- S3 buckets with server-side encryption, CORS for driver app uploads, event notifications for image processing
- VPC endpoints for DynamoDB, Kinesis, S3, SNS, SQS, Rekognition, Step Functions
- CloudWatch Logs metric filters for order fulfillment metrics, dashboards for operational monitoring
- Secrets Manager for Aurora master password and Redis auth token

Outputs:
- WebSocket API invoke URL, REST API invoke URL, Kinesis stream ARNs, DynamoDB table names/ARNs, SNS topic ARNs, SQS queue URLs, Aurora endpoints, Redis configuration endpoint, Step Functions ARN, Lambda function ARNs, S3 bucket names, VPC/subnet/SG IDs

Parity & Allowed Diffs:
- Same resource graph across envs
- Allowed to differ: WebSocket concurrent connections, API throttle limits, Kinesis shard counts, DynamoDB capacity, Lambda memory/concurrency, Redis cluster nodes, Aurora capacity, SQS retention, TTL duration, schedule frequency, alarm thresholds
- Disallowed: different WebSocket routes, matching algorithm, or earnings calculation logic

Code Quality:
- Terraform >= 1.5, AWS provider ~> 5.0
- Use locals for repeated patterns like Lambda environment variables, SNS-SQS subscription configurations
- Comprehensive comments explaining matching algorithm criteria and surge pricing calculation"