# Migration Connector Infrastructure Requirements

## Overview
Hey, I need you to build a production-ready migration connector that processes metadata JSON files. The system should handle the full pipeline - from initial upload through graph database population, fast lookups, ETL processing, search indexing, and media delivery. Think event-driven architecture with proper separation of concerns.

## Technology Stack
- **IaC Framework**: Pulumi with Java SDK
- **Cloud Provider**: AWS
- **Region**: us-east-2 (US East - Ohio)

## Architecture Requirements

### 1. Event Source - Storage Buckets
- **Metadata Input S3 Bucket** for incoming metadata JSON files:
  - Bucket name: `{stackName}-metadata-input` (auto-generated)
  - Versioning: Enabled (track file changes)
  - Public access: Fully blocked (all 4 settings enabled)
  - S3 Event Notifications: Configured to trigger Lambda on ObjectCreated:Put events for `.json` files
  - Lambda permission granted for s3.amazonaws.com to invoke function
- **Media Output S3 Bucket** for processed media files:
  - Bucket name: `{stackName}-media-output` (auto-generated)
  - Intelligent-Tiering: Enabled with automatic archiving
    - Archive Access tier: 90 days
    - Deep Archive Access tier: 180 days
  - Public access: Fully blocked (all 4 settings enabled)
  - Bucket policy: Grants CloudFront service access via OAC
- Both buckets tagged with Environment, Project, ManagedBy

### 2. Metadata Processing Pipeline
- **Lambda Function** triggered by S3 PUT events on `.json` files
- Configuration:
  - Memory: 512 MB
  - Architecture: ARM64 (better cost/performance)
  - Runtime: Java 17
  - Handler: `com.migration.MetadataProcessor::handleRequest`
  - Timeout: 5 minutes (300 seconds)
  - X-Ray tracing: Active mode
  - Dead letter queue: SQS for failed invocations
- Parse complex nested JSON structures from uploaded metadata files
- Extract asset information and relationships
- Write parsed metadata to DynamoDB
- Populate Neptune graph with asset relationships
- Trigger Glue ETL job for data transformation
- CloudWatch log group with 7-day retention
- IAM permissions for S3 read, DynamoDB write, Neptune access, Glue job execution
- S3 Lambda permission configured for bucket event notifications

### 3. Graph Database Integration
- **Neptune Cluster** configuration:
  - Cluster name: `{stackName}-neptune-cluster`
  - Engine: neptune
  - Instance class: db.t3.medium
  - Instance count: 1 (single instance for cost efficiency)
  - Subnet group: Uses both private subnets (us-east-2a, us-east-2b)
  - Security group: Allows TCP 8182 from Lambda security group only
  - IAM database authentication enabled
  - Backup retention: 7 days
  - Preferred backup window: 03:00-04:00 UTC
  - Final snapshot on deletion: Yes (identifier: `{stackName}-neptune-final-snapshot`)
  - Skip final snapshot: False (data protection)
- Lambda invokes Neptune bulk loader endpoint to populate graph data
- Stores asset relationships and dependencies for graph queries

### 4. Fast Lookup Storage
- **DynamoDB Table** configuration:
  - Table name: `{stackName}-metadata-table`
  - Billing mode: PAY_PER_REQUEST (on-demand, no capacity planning needed)
  - Partition key (hash key): `assetId` (String type)
  - Sort key (range key): `timestamp` (Number type)
  - Additional attributes: `type` (String) for GSI
  - Global Secondary Index:
    - Index name: `type-index`
    - Hash key: `type`
    - Projection type: ALL (include all attributes)
  - Point-in-time recovery: Disabled (cost optimization, backups handled at application level)
  - Tags: Environment, Project, ManagedBy
- Lambda writes parsed metadata for sub-10ms latency lookups
- Supports queries by asset ID with timestamp sorting and type-based categorical queries

### 5. ETL and SQL Analytics
- **AWS Glue Job** triggered by metadata processor Lambda:
  - Job name: `{stackName}-etl-job`
  - Glue version: 4.0
  - Worker type: G.1X
  - Number of workers: 2
  - Max concurrent runs: 1
  - Max retries: 3
  - Timeout: 2 hours (120 minutes)
  - Script location: `s3://placeholder/etl-script.py` (Python 3)
  - Job arguments: Aurora endpoint, SNS topic ARN
  - IAM role with S3 read, Aurora access, SNS publish permissions
- Transform and normalize metadata structures
- **Aurora Serverless v2 PostgreSQL** cluster:
  - Engine version: 15.3
  - Engine mode: provisioned (Serverless v2)
  - Database name: `migration`
  - Master username: `admin`
  - Managed master password (no manual password management)
  - Scaling: 0.5 - 1.0 ACU
  - Instance class: db.serverless
  - IAM database authentication enabled
  - Backup retention: 7 days
  - Preferred backup window: 03:00-04:00 UTC
  - Deployed in private subnets (us-east-2a, us-east-2b)
  - Final snapshot created on deletion
- Glue loads transformed data to Aurora for complex SQL queries and analytics

### 6. Search Indexing
- **SNS Topic** (`{stackName}-etl-completion-topic`) receives completion events after ETL job finishes
- **Lambda Function** subscribes to SNS topic for search indexing:
  - Function name: `{stackName}-search-indexer`
  - Memory: 512 MB
  - Architecture: ARM64
  - Runtime: Java 17
  - Handler: `com.migration.SearchIndexer::handleRequest`
  - Timeout: 1 minute (60 seconds)
  - X-Ray tracing: Active mode
  - Dead letter queue: SQS for failed invocations
  - CloudWatch log group with 7-day retention
  - IAM permissions for OpenSearch write access
  - SNS Lambda permission and topic subscription configured
- **OpenSearch Service** domain configuration:
  - Engine version: OpenSearch 2.9
  - Instance type: t3.small.search
  - Instance count: 1 (single node)
  - No dedicated master (cost savings)
  - No zone awareness (single AZ)
  - EBS storage: 10 GB gp3 volume
  - Encryption at rest: Enabled (AWS managed keys)
  - Node-to-node encryption: Enabled
  - No VPC deployment (public access with IAM authentication)
- Lambda updates OpenSearch indices for full-text search capabilities

### 7. Media Processing and Delivery
- Store media outputs in dedicated **S3 Bucket** with Intelligent-Tiering (90-day archive, 180-day deep archive)
- **CloudFront Distribution** for global content delivery:
  - Origin: Media output S3 bucket (regional domain name)
  - Origin Access Control (OAC) for secure S3 access
  - Price class: PriceClass_100 (US, Canada, Europe only for cost savings)
  - Viewer protocol: Redirect to HTTPS
  - Allowed methods: GET, HEAD, OPTIONS
  - Caching: Min TTL 0, default 3600s (1 hour), max 86400s (24 hours)
  - Compression enabled
  - No geographic restrictions
  - CloudFront default certificate (no custom SSL to save costs)
- S3 bucket policy grants CloudFront service access to media objects
- **IAM role** for MediaConvert (configured but service deployment optional):
  - S3 read access from metadata input bucket
  - S3 write access to media output bucket

### 8. Data Validation Orchestration
- **Step Functions State Machine** (Standard workflow) for data validation
- Workflow validates data across all storage layers sequentially:
  1. **ValidateNeptune** - Verify Neptune cluster status (DescribeDBClusters API)
  2. **ValidateAurora** - Check Aurora cluster health (DescribeDBClusters API)
  3. **ValidateOpenSearch** - Confirm OpenSearch domain status (DescribeElasticsearchDomain API)
  4. **NotifySuccess** - Publish completion message to SNS topic
- Each validation step has retry logic:
  - Error handling: Retry on all errors (States.ALL)
  - Retry attempts: 3 max
  - Retry interval: 2 seconds
  - Backoff rate: 2.0 (exponential)
- SNS topic ARN injected into state machine definition dynamically
- CloudWatch alarm triggers on any execution failures

## Pulumi Implementation Requirements

### Project Structure
```
lib/src/main/java/app/
└── Main.java (entry point with nested stack pattern)
```

### Main Class Structure
- **Class Name**: `Main`
- Implement using Pulumi **nested stack** pattern with component resources
- Create these stacks for logical grouping:
  - `NetworkingStack` (VPC, subnets, security groups, VPC endpoints)
  - `StorageStack` (S3 buckets, DynamoDB table)
  - `MessagingStack` (SNS topics, SQS queues)
  - `DatabaseStack` (Neptune cluster, Aurora Serverless cluster)
  - `SearchStack` (OpenSearch domain)
  - `ComputeStack` (Lambda functions, Glue ETL job)
  - `MediaStack` (CloudFront distribution for content delivery)
  - `OrchestrationStack` (Step Functions state machine)

### Resource Configuration Principles
- All resources deployed to **us-east-2** region
- Use minimal instance sizes and resource constraints
- Enable deletion protection on stateful resources (databases, S3)
- Tag all resources with: `Environment`, `Project`, `ManagedBy`
- Use AWS managed encryption keys (no custom KMS keys for cost savings)

### Networking
- **VPC** with CIDR block 10.0.0.0/16, DNS hostnames and support enabled
- 2 private subnets across 2 AZs:
  - Private subnet 1: 10.0.1.0/24 in us-east-2a
  - Private subnet 2: 10.0.2.0/24 in us-east-2b
- No NAT Gateways (cost optimization) - use VPC Gateway Endpoints instead:
  - S3 Gateway Endpoint
  - DynamoDB Gateway Endpoint
- Security groups configured for each service:
  - Lambda security group (egress to all)
  - Neptune security group (ingress from Lambda on port 8182)
  - Aurora security group (ingress from Lambda on port 5432)
  - OpenSearch security group (ingress from Lambda on port 443)
- Neptune and Aurora deployed in private subnets only for security

### IAM and Security
- Separate IAM roles for each service with scoped permissions:
  - Metadata processor Lambda: S3 read, DynamoDB write, Neptune access, SQS (DLQ), Glue job trigger
  - Search indexer Lambda: OpenSearch write access, SQS (DLQ)
  - Glue ETL job: S3 read, Aurora access, SNS publish
  - Step Functions: Neptune, Aurora, OpenSearch read access, SNS publish, Lambda invoke
  - MediaConvert: S3 read/write between input and output buckets
- Neptune and Aurora: IAM database authentication enabled
- S3 buckets: Block all public access (configured on both metadata and media buckets)
- Aurora Serverless v2: Managed master password (no Secrets Manager needed, saving costs)

### Monitoring and Observability
- CloudWatch Log Groups with 7-day retention for:
  - Metadata processor Lambda
  - Search indexer Lambda
- CloudWatch Alarms configured:
  - Metadata Lambda error alarm (threshold: 5 errors per 5-minute period)
  - Step Functions execution failure alarm (threshold: 1 failure)
- X-Ray tracing enabled on both Lambda functions (mode: Active)

### Cost Optimization Applied
- **Lambda**: ARM64 architecture (better price/performance), 512 MB memory, 5-minute timeout for metadata processor, 1-minute for search indexer
- **Neptune**: db.t3.medium single instance, 7-day backup retention, final snapshot on deletion
- **Aurora Serverless v2**: PostgreSQL 15.3, 0.5-1.0 ACU scaling range, single db.serverless instance, 7-day backups
- **OpenSearch**: t3.small.search single node, 10GB gp3 EBS, no dedicated master, encryption at rest and in transit
- **DynamoDB**: On-demand billing (pay-per-request), no point-in-time recovery
- **S3**: Intelligent-Tiering on media output bucket (automatic cost optimization with 90-day archive, 180-day deep archive), versioning on metadata input bucket
- **CloudFront**: Price Class 100 (US, Canada, Europe only)
- **Glue**: G.1X workers, 2 workers, max 1 concurrent run, 3 retries, 2-hour timeout
- **SQS Dead Letter Queue**: 14-day retention for failed Lambda messages
- Single-AZ deployments where possible (Neptune, OpenSearch)

### Error Handling and Resilience
- Lambda dead-letter queues (SQS) configured for both Lambda functions
- Step Functions retry policies: 3 attempts with 2-second intervals and 2.0 backoff rate on all validation tasks
- S3 bucket notifications trigger Lambda with automatic retry on failures
- Lambda tracing enabled for debugging (X-Ray Active mode)

### Stack Outputs
The following outputs are exported for reference and integration:
- `metadataInputBucketName` - S3 bucket ID for incoming metadata JSON files
- `mediaOutputBucketName` - S3 bucket ID for processed media outputs
- `dynamodbTableName` - DynamoDB table name for fast lookups
- `neptuneClusterEndpoint` - Neptune graph database cluster endpoint
- `auroraClusterEndpoint` - Aurora PostgreSQL Serverless cluster endpoint
- `openSearchDomainEndpoint` - OpenSearch domain endpoint for search queries
- `cloudFrontDistributionDomain` - CloudFront domain name for content delivery
- `stepFunctionsStateMachineArn` - Step Functions ARN for validation workflow
- `snsTopicArn` - SNS topic ARN for ETL completion notifications
- `vpcId` - VPC identifier
- `privateSubnetIds` - List of private subnet IDs (for Lambda deployments)

## Deployment Instructions
1. Configure AWS credentials for us-east-2 region
2. Install Pulumi CLI and Java 17 SDK
3. Execute `pulumi up` from project root
4. Review preview and confirm resource creation
5. Validate outputs and test event flow with sample JSON file

## Testing Requirements
- Unit tests for Lambda function parsing logic
- Integration tests for end-to-end pipeline flow
- Load testing with concurrent S3 uploads
- Validate Neptune graph relationships
- Verify OpenSearch index updates
- Test Step Functions validation logic
- Confirm CloudFront content delivery

## Production Readiness Checklist
- [ ] All resources deployed to us-east-2
- [ ] Nested stack structure implemented in Main.java
- [ ] Minimal resource constraints applied
- [ ] VPC endpoints configured (no NAT Gateways)
- [ ] IAM roles follow least-privilege principle
- [ ] CloudWatch monitoring and alarms configured
- [ ] Error handling and DLQs implemented
- [ ] Cost optimization measures applied
- [ ] Deletion protection enabled on stateful resources
- [ ] Documentation complete with architecture diagrams
- [ ] Disaster recovery procedures documented
- [ ] Scaling policies configured where applicable