We need to design a single Terraform file (tap_stack.tf) that defines a complete, production-grade multi-environment infrastructure (dev, staging, prod) for a healthcare data processing system. The goal is to guarantee environmental parity across all tiers — every environment should deploy an identical topology with the same resource graph, allowing only configuration-level variations like shard counts, memory, and instance sizes through individual tfvars files.

The system should process real-time patient vitals coming from IoT Core MQTT bridges into a Kinesis Data Stream, which triggers a series of Lambda functions responsible for HIPAA validation. These Lambda validators write into a DynamoDB table (with streams and point-in-time recovery enabled), and downstream DynamoDB Streams invoke additional Lambda processors that transform and publish data into an SNS topic. The SNS fanout must distribute messages to multiple SQS queues (one per hospital region), each with a dead-letter queue, where separate Lambda consumers process the queue messages and update an Aurora PostgreSQL Serverless v2 cluster maintaining patient records.

An EventBridge scheduled rule should regularly trigger a Step Functions state machine that performs data quality checks by invoking Lambdas querying Aurora read replicas and publishing analytics findings to SNS. Meanwhile, an ElastiCache Redis cluster should serve as the real-time patient status cache, continuously updated by Lambda functions reacting to DynamoDB stream changes. Another Lambda validator should perform PHI exposure detection, querying S3 audit logs through Athena, storing query results in a dedicated S3 bucket for Athena outputs, and publishing violations to an SNS topic that triggers a remediation Lambda workflow.

All components must be securely VPC-enabled, with VPC, public/private subnets, NAT Gateways, and security groups configured to provide controlled connectivity. Lambda functions should have VPC access allowing Aurora and Redis communication, while no resources should have public exposure. The stack should use VPC endpoints for services like DynamoDB, Kinesis, SNS, SQS, and Secrets Manager to ensure private communication. Secrets such as database credentials must be stored in AWS Secrets Manager, while runtime configurations should use SSM Parameter Store. Every data service — including DynamoDB, Kinesis, SNS/SQS, Aurora, Redis, and S3 — must be encrypted at rest and in transit using KMS keys (customer-managed keys preferred).

All Lambda deployment packages should be created using the archive_file data source with inline Python 3.12 handlers, and each Lambda should have least-privilege IAM roles tailored for its specific purpose (e.g., Kinesis consumers with read permissions, SNS publishers, DynamoDB readers/writers, Aurora access via Secrets Manager, Redis operations within the VPC, and Athena query execution roles). Use event source mappings for stream and queue triggers with explicit batch sizes and failure handling configurations.

The infrastructure must include CloudWatch alarms monitoring all critical metrics such as Kinesis iterator age, Lambda errors and throttles, DynamoDB stream lag, Aurora connection utilization, Redis memory usage, and Step Functions execution failures. Each alarm should publish to an SNS topic dedicated to operational alerts. CloudWatch log groups must use KMS encryption and respect log retention policies defined by variables.

Networking and resource organization should follow consistent deterministic naming conventions and tagging. Use locals for tags such as Environment, Project, Owner, and CostCenter. Define a comprehensive set of Terraform variables for components such as environment name, region, VPC CIDRs, Kinesis shard configuration, DynamoDB capacity, Lambda runtime settings, SQS queue configurations, Aurora capacity limits, Redis settings, EventBridge schedule expressions, S3 bucket names, and CloudWatch retention periods.

The tap_stack.tf file should include:

A terraform block specifying required Terraform and AWS provider versions.

All variable declarations with descriptive metadata and reasonable defaults.

Resource and data source definitions implementing the entire topology directly (no nested or module-based files).

Locals for naming and tagging conventions.

Outputs for key resource identifiers (stream ARNs, DynamoDB table names, topic ARNs, queue URLs, Aurora endpoints, Redis primary endpoint, Step Functions ARN, Lambda ARNs, and VPC/subnet/security group IDs).

Example environment variable files for dev.tfvars, staging.tfvars, and prod.tfvars, showing capacity differences while maintaining identical topology.

Follow all AWS best practices including encryption, least privilege, idempotency, fault tolerance, and logical dependencies. Use Terraform >= 1.5 with AWS provider ~> 5.0 and ensure resource definitions are production-ready with complete attribute coverage—no placeholders or pseudo-code.

Please generate a single Terraform file (tap_stack.tf) implementing the described multi-environment healthcare data processing pipeline, ensuring strict topology parity across dev, staging, and prod, secure networking and IAM isolation, full encryption, proper monitoring coverage, and realistic resource definitions ready for deployment.
