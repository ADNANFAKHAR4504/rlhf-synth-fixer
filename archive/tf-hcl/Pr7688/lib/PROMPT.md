Generate tap_stack.tf for Multi-Environment Consistency (Terraform)

You are an expert Terraform engineer. Produce production-ready Terraform that enforces multi-environment (dev, staging, prod) topology parity for a weather data ingestion and alerting pipeline. Follow all constraints exactly.

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
- Kinesis Data Stream receives weather observations from stations (temp, pressure, humidity, wind), Lambda validator checks data quality and writes to DynamoDB observations table with composite key (station_id, timestamp) and streams enabled
- DynamoDB streams trigger Lambda analyzer that computes rolling statistics (hourly averages, max/min), updates ElastiCache Redis with current conditions per region (geohash-based keys), checks for anomalies using historical data from Aurora PostgreSQL climate_normals table
- Lambda alert evaluator queries Redis for current conditions and DynamoDB thresholds table with alert rules per region (temperature, wind speed, pressure drop rate), publishes severe weather alerts to SNS severe-weather topic when thresholds breached
- SNS fans out to SQS queues for different alert types (tornado, hurricane, flood, heat), Lambda consumers on each queue update DynamoDB active_alerts table, send notifications to external emergency management systems via SNS to HTTP endpoint subscriptions
- Separate Kinesis Data Stream for radar imagery data, Kinesis Data Firehose delivers raw data to S3 data lake partitioned by region/date, triggers Lambda for image processing that extracts precipitation intensity and updates DynamoDB radar_data table
- EventBridge scheduled rule triggers Step Functions every 6 hours for model training: Lambda fetches historical observations from Aurora, Lambda preprocesses data and uploads to S3 training bucket, Lambda invokes SageMaker training job (using aws_sagemaker_model data source for existing model), Step Functions waits for completion and updates DynamoDB model_versions table
- Lambda forecast generator triggered by EventBridge every hour queries latest model from SageMaker endpoint (data source), generates 48-hour forecasts for all regions, writes to DynamoDB forecasts table with TTL (72 hours), updates Redis cache for API access
- S3 bucket for historical archive with lifecycle to Glacier Deep Archive after 90 days, Glue Crawler catalogs partitioned data, Athena queries for analytics
- CloudWatch alarms for Kinesis incoming record rate anomalies, Lambda analyzer duration, DynamoDB throttled reads (high query volume), Redis cache hit rate, Aurora connection pool exhaustion, SQS message age for alert delivery, Step Functions training failures, Firehose delivery errors
- VPC Lambda functions for Aurora and Redis

Variables:
- env, aws_region, project_name, owner, cost_center, common_tags
- VPC: vpc_cidr, public_subnet_cidrs, private_subnet_cidrs, enable_dns_hostnames
- Kinesis: observations_stream_name, radar_stream_name, stream_mode, obs_shard_count, radar_shard_count, retention_hours
- DynamoDB: observations_table, thresholds_table, alerts_table, radar_table, forecasts_table, model_versions_table, billing_mode, rcu, wcu, ttl_enabled, ttl_attribute_name
- Lambda: validator_memory, analyzer_memory, alert_memory, image_processor_memory, training_memory, forecast_memory, timeout_s, runtime
- Redis: node_type, num_cache_nodes, engine_version, snapshot_retention_limit, snapshot_window
- Aurora: cluster_id, master_username, instance_class, min_capacity, max_capacity, backup_retention_days, database_name
- SageMaker: training_job_name_prefix, model_name (data source), endpoint_name (data source)
- SNS: severe_weather_topic, http_endpoint_urls (list)
- SQS: tornado_queue, hurricane_queue, flood_queue, heat_queue, visibility_timeout, retention_period
- EventBridge: training_schedule_expression, forecast_schedule_expression
- S3: data_lake_bucket, training_bucket, archive_bucket, lifecycle_glacier_days
- Firehose: radar_delivery_stream_name, buffer_interval_s, buffer_size_mb
- Glue: crawler_name, database_name, crawler_schedule
- Athena: workgroup_name, results_bucket
- CloudWatch: log_retention_days

Implementation Details:
- Lambda functions via archive_file with Python 3.12 for observation validation, statistical analysis, alert evaluation, radar image processing, model training orchestration, forecast generation
- IAM roles: Kinesis GetRecords/PutRecords, DynamoDB read/write with streams and GSI queries, Redis via VPC, Aurora via Secrets Manager, SageMaker CreateTrainingJob and InvokeEndpoint, SNS publish, SQS receive/delete, S3 read/write with partitioned access, Glue crawler start, Athena query execution
- Event source mappings for Kinesis observations stream and DynamoDB streams with parallelization, tumbling windows for aggregation
- Kinesis Data Firehose to S3 with prefix for partitioning, transformation Lambda for data formatting, error output to separate S3 prefix
- ElastiCache Redis with geospatial capabilities for regional weather data (GEOADD/GEORADIUS)
- Step Functions state machine using templatefile with parallel preprocessing tasks, SageMaker training job integration via service integration, wait state for training completion, error handling and retries
- SNS topics with KMS encryption, HTTP/HTTPS subscriptions for external systems, SQS subscriptions with message filtering based on alert severity
- SQS with DLQ, message retention matching emergency response SLA
- Glue Crawler with S3 target for data lake, schedule for nightly updates, schema change detection
- S3 buckets with server-side encryption, versioning for training data, lifecycle policies for archival
- Athena workgroup with query result encryption, tags for cost allocation
- VPC endpoints for DynamoDB, Kinesis, S3, SNS, SQS, SageMaker Runtime
- CloudWatch metric filters on Lambda logs for tracking alert generation rates
- Secrets Manager for Aurora credentials and Redis password

Outputs:
- Kinesis stream ARNs, DynamoDB table names, SNS topic ARNs, SQS queue URLs, Aurora endpoints, Redis endpoint, SageMaker endpoint name, Step Functions ARN, Lambda ARNs, S3 buckets, Firehose ARN, Glue crawler/database, Athena workgroup, VPC/subnet/SG IDs

Parity & Allowed Diffs:
- Same resource graph across envs
- Allowed to differ: Kinesis shards, Lambda memory, DynamoDB capacity, Redis nodes, Aurora capacity, Firehose buffer settings, training schedule frequency, forecast TTL duration
- Disallowed: different streams, alert types, or model training logic

Code Quality:
- Terraform >= 1.5, AWS provider ~> 5.0
- Use for_each to create multiple SQS queues from list variable
- Clear comments explaining weather alerting thresholds and model training flow