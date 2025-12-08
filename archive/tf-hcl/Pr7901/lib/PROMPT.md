"Generate tap_stack.tf for Multi-Environment Consistency (Terraform)

You are an expert Terraform engineer. Produce production-ready Terraform that enforces multi-environment (dev, staging, prod) topology parity for a telemedicine appointment and prescription workflow pipeline. Follow all constraints exactly.

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
- API Gateway REST API with /appointments and /prescriptions endpoints, Lambda request handler validates patient authentication using Cognito User Pool (reference as data source), writes appointment requests to DynamoDB appointments table with status='requested' and streams enabled
- DynamoDB streams trigger Lambda scheduling engine that queries ElastiCache Redis for provider availability (calendar stored as time-slot bitmaps), checks insurance eligibility from DynamoDB insurance_policies table, assigns appointment to available provider updating appointments table with status='scheduled', publishes to SNS appointment-scheduled topic
- SNS fans out to SQS queues: patient_notifications queue, provider_notifications queue, billing_queue; Lambda notification consumers send emails/SMS via SNS to external service, Lambda billing consumer creates billing record in Aurora PostgreSQL billing_records table
- During appointment: Lambda triggered by API Gateway /session/start endpoint creates video session metadata in DynamoDB active_sessions table with TTL (2 hours), writes HIPAA audit log to Aurora audit_trail table, publishes session start event to SNS session-events topic
- Post-appointment prescription flow: Lambda triggered by API Gateway /prescriptions endpoint validates provider credentials, writes prescription to DynamoDB prescriptions table with status='pending' and encrypted PHI using KMS, triggers Step Functions prescription approval workflow
- Step Functions orchestrates: Lambda checks prescription against patient allergies from DynamoDB patient_profiles table and drug interactions from Aurora drug_interactions table, if checks pass Lambda updates status to 'approved' and publishes to SNS prescription-approved topic, if issues found Lambda publishes to SNS prescription-review topic for pharmacist review via SQS pharmacist_review queue
- SNS prescription-approved fans out to SQS queues: pharmacy_queue for fulfillment, patient_queue for notification; Lambda pharmacy consumer calls external pharmacy API via API Gateway HTTP proxy, Lambda patient consumer sends prescription ready notification
- Compliance and audit: EventBridge scheduled rule triggers Lambda nightly that queries Aurora audit_trail for all PHI access events, aggregates by user_id and resource_type, checks for suspicious patterns (excessive access, off-hours access) using business rules from DynamoDB compliance_rules table, publishes violations to SNS compliance-alerts topic, archives audit summary to S3 hipaa_audit_logs bucket with timestamp partitioning
- Appointment reminders: EventBridge scheduled rule runs hourly Lambda that queries DynamoDB appointments for appointments within next 24 hours, publishes reminder events to SNS appointment-reminders topic which triggers Lambda to send notifications via external service
- Provider analytics: Lambda subscribed to DynamoDB appointments streams with filter for status='completed' aggregates metrics (wait times, appointment duration, patient satisfaction from post-appointment survey in DynamoDB), writes to Aurora provider_statistics table, updates ElastiCache Redis with real-time provider ratings for scheduling prioritization
- S3 bucket stores consultation notes and medical documents uploaded during appointments, Lambda triggered by S3 PUT events validates document format, runs PHI detection (mock implementation checking for patterns), updates DynamoDB documents_catalog table with metadata including S3 key and PHI classification
- CloudWatch alarms for API Gateway authentication failures, Lambda scheduling function errors, DynamoDB appointments table throttled writes, Redis evictions, Aurora deadlocks, SQS message age for critical queues (pharmacy, patient notifications), Step Functions failed workflows, S3 document upload errors
- VPC Lambda functions for Aurora and Redis

Variables:
- env, aws_region, project_name, owner, cost_center, common_tags
- VPC: vpc_cidr, public_subnet_cidrs, private_subnet_cidrs, num_availability_zones
- Cognito: user_pool_id (data source reference)
- API Gateway: api_name, stage_name, throttle_settings, cors_configuration
- DynamoDB: appointments_table, sessions_table, prescriptions_table, policies_table, profiles_table, compliance_table, documents_table, billing_mode, rcu, wcu, ttl_enabled, ttl_attribute
- Lambda: request_handler_memory, scheduler_memory, notifier_memory, billing_memory, session_memory, prescription_memory, approval_memory, pharmacy_memory, compliance_memory, reminder_memory, analytics_memory, document_memory, timeout_s, runtime
- Redis: node_type, num_cache_nodes, engine_version, auth_token_enabled, transit_encryption_enabled
- Aurora: cluster_identifier, database_name, master_username, instance_class, min_capacity, max_capacity, backup_retention_days, deletion_protection
- SNS: scheduled_topic, session_topic, prescription_approved_topic, prescription_review_topic, compliance_topic, reminders_topic
- SQS: patient_notifications_queue, provider_notifications_queue, billing_queue, pharmacist_queue, pharmacy_queue, patient_prescriptions_queue, visibility_timeout, retention_period
- EventBridge: compliance_schedule_expression, reminders_schedule_expression
- S3: audit_logs_bucket, documents_bucket, lifecycle_archive_days
- Step Functions: prescription_workflow_name, timeout_seconds
- KMS: phi_encryption_key_alias
- CloudWatch: log_retention_days

Implementation Details:
- API Gateway with Cognito User Pool authorizer, request validation, CORS configuration, Lambda proxy integration, CloudWatch access logs
- Lambda functions via archive_file with Python 3.12 for request handling with Cognito token validation, intelligent scheduling with calendar bitmap queries, notification delivery, billing record creation, session lifecycle management with audit logging, prescription validation with allergy/interaction checking, pharmacy integration, compliance analysis with pattern detection, reminder processing, provider analytics aggregation, document PHI detection
- IAM roles: API Gateway invoke Lambda with Cognito authorization, Lambda to DynamoDB read/write with streams and condition expressions for optimistic locking, Redis via VPC, Aurora via Secrets Manager with IAM database authentication, SNS publish, SQS receive/delete, S3 read/write with KMS encryption, Step Functions execution, KMS Decrypt/Encrypt for PHI
- DynamoDB streams event source mappings with batch size and filter patterns
- ElastiCache Redis with TLS, auth token from Secrets Manager, data-tiering for cost optimization
- Step Functions state machine using templatefile with Choice state for approval decision, parallel branches for allergy and interaction checks, error handling with retries
- SNS topics with KMS encryption (separate key for PHI topics), SQS subscriptions with filter policies, HTTP subscriptions for external services
- SQS with DLQ, visibility timeout matching Lambda processing time, FIFO for pharmacy orders
- EventBridge rules with cron schedules, IAM role for Lambda invocation
- S3 buckets with SSE-KMS (phi_encryption_key), versioning, lifecycle policies, event notifications for document processing, bucket policies restricting access
- KMS key with key policy allowing Lambda, S3, DynamoDB, SNS service principals, key rotation enabled
- VPC endpoints for DynamoDB, S3, SNS, SQS, Secrets Manager, Step Functions
- CloudWatch Logs with KMS encryption, metric filters for tracking PHI access patterns, HIPAA compliance dashboard
- Secrets Manager for Aurora credentials and Redis auth token with auto-rotation

Outputs:
- API Gateway invoke URL, DynamoDB table names/ARNs, SNS topic ARNs, SQS queue URLs, Aurora endpoints, Redis endpoint, Step Functions ARN, Lambda function ARNs, S3 bucket names, KMS key ARN, VPC/subnet/SG IDs

Parity & Allowed Diffs:
- Same resource graph across envs
- Allowed to differ: API throttle limits, DynamoDB capacity, Lambda memory/concurrency, Redis nodes, Aurora capacity, SQS retention, schedule frequencies, alarm thresholds
- Disallowed: different API endpoints, scheduling logic, prescription workflow, or compliance rules

Code Quality:
- Terraform >= 1.5, AWS provider ~> 5.0
- Use locals for KMS key policies, Lambda IAM policies, common environment variables
- Detailed comments on HIPAA compliance requirements and PHI encryption flow"