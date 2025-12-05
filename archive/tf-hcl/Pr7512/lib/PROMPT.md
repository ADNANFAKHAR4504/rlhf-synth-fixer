"Generate tap_stack.tf for Multi-Environment Consistency (Terraform)

You are an expert Terraform engineer. Produce production-ready Terraform that enforces multi-environment (dev, staging, prod) topology parity for a vehicle tracking and logistics pipeline. Follow all constraints exactly.

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
- Kinesis Data Stream receives GPS coordinates from vehicles, Lambda function processes location updates and writes to DynamoDB table (vehicle_positions) with streams and GSI on geohash for spatial queries
- DynamoDB streams trigger Lambda geofence checker that queries ElastiCache Redis for active geofence boundaries (stored as sorted sets with geohash), publishes geofence violations to SNS topic
- SNS topic fans out to two SQS queues: one for warehouse notifications, one for customer delivery alerts
- Lambda consumers on both SQS queues: warehouse Lambda updates Aurora PostgreSQL inventory tables, customer Lambda sends notifications via SNS to external systems
- EventBridge scheduled rule triggers Step Functions every 5 minutes for route optimization: Lambda queries current vehicle positions from DynamoDB, Lambda queries Aurora for pending deliveries, Lambda publishes optimization results to Kinesis stream for vehicle updates
- Separate DynamoDB table (delivery_status) tracks package status, updated by Lambda functions with TTL enabled for automatic cleanup
- Lambda function triggered by S3 PUT events (vehicle telemetry logs uploaded to S3) runs Athena queries for analytics and stores aggregated results in separate S3 bucket
- CloudWatch alarms for Kinesis data latency, Lambda concurrent executions, DynamoDB throttling, Aurora replication lag, Redis evictions, SQS queue depth
- VPC Lambda functions for Aurora and Redis access
- All tables and streams encrypted with KMS

Variables:
- env, aws_region, project_name, owner, cost_center, common_tags
- VPC: vpc_cidr, public_subnet_cidrs, private_subnet_cidrs, enable_nat
- Kinesis: gps_stream_name, stream_mode, shard_count, data_retention_hours
- DynamoDB: positions_table_name, delivery_table_name, billing_mode, rcu, wcu, ttl_attribute, gsi_geohash_key
- Lambda: location_processor_memory, geofence_checker_memory, warehouse_updater_memory, timeout_seconds, runtime
- Redis: cache_node_type, num_cache_nodes, engine_version, parameter_group_family
- Aurora: db_name, master_username, instance_class, serverless_min_capacity, serverless_max_capacity, backup_retention
- SQS: warehouse_queue_name, customer_queue_name, visibility_timeout, retention_period
- EventBridge: optimization_schedule_expression
- S3: telemetry_bucket_name, analytics_bucket_name, lifecycle_days
- Athena: workgroup_name, query_results_bucket
- CloudWatch: log_retention_days

Implementation Details:
- Lambda functions use archive_file with Python 3.12 for GPS processing, geofence logic, warehouse updates
- IAM roles: Kinesis read, DynamoDB CRUD with streams, Redis via VPC security groups, Aurora via Secrets Manager, SNS publish, SQS poll/delete, S3 read/write, Athena StartQueryExecution
- DynamoDB GSI on geohash attribute for efficient spatial queries
- Event source mappings for Kinesis and DynamoDB streams with parallelization
- SQS queues with DLQ for failed messages, redrive policy with maxReceiveCount
- Step Functions state machine using templatefile for parallel route optimization tasks
- S3 event notifications triggering Lambda for telemetry analysis
- VPC endpoints for DynamoDB, Kinesis, S3, SNS, SQS
- Athena workgroup with encryption and output location
- CloudWatch log groups for all Lambda functions with KMS encryption
- Secrets Manager for Aurora with rotation

Outputs:
- Kinesis stream ARN, DynamoDB table names/ARNs, SNS topics, SQS URLs, Aurora endpoints, Redis endpoint, Lambda ARNs, Step Functions ARN, S3 buckets, VPC/subnet/SG IDs, Athena workgroup name

Parity & Allowed Diffs:
- Same resource graph across envs
- Allowed to differ: stream shards, Lambda memory, DynamoDB capacity, Redis nodes, Aurora capacity, retention/lifecycle days
- Disallowed: different topology or event flows

Code Quality:
- Terraform >= 1.5, AWS provider ~> 5.0
- Clear naming, detailed comments, no magic numbers
- Proper use of locals for repeated values"