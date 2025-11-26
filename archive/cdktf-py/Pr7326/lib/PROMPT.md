Hey team,

We need to build a comprehensive payment processing infrastructure with enterprise-grade security, compliance monitoring, and threat detection capabilities. The business has asked us to implement this using **CDKTF with Python** as our infrastructure-as-code platform. This is a critical production system that needs to handle payment transactions securely while maintaining full compliance visibility and automated threat response.

Our finance team processes thousands of payment transactions daily, and they need a resilient system that can scale automatically, detect security threats in real-time, and maintain detailed audit logs for compliance audits. The security team also requires comprehensive monitoring to meet PCI-DSS requirements and detect any suspicious activity immediately.

The infrastructure needs to be modular, maintainable, and fully automated. We want everything defined in code so we can version control our security policies, compliance rules, and monitoring configurations alongside our application infrastructure.

## What we need to build

Create a production-ready payment processing platform using **CDKTF with Python** that combines database, compute, networking, security, compliance, and observability into a cohesive system.

### Core Infrastructure Requirements

1. **Database Layer**
   - Aurora Serverless v2 PostgreSQL cluster with 1 writer instance and 2 read replicas distributed across availability zones
   - RDS Proxy for connection pooling and automatic failover to Lambda functions
   - Database must be encrypted using customer-managed KMS keys
   - Resource names must include environmentSuffix for uniqueness

2. **Compute Layer**
   - Lambda functions for payment processing logic with reserved concurrency limits
   - EC2 instances in an Auto Scaling Group for batch payment processing jobs
   - Application Load Balancer with cross-zone load balancing enabled
   - X-Ray distributed tracing enabled on all Lambda functions and ALB
   - Lambda functions must use Node.js 18 or later (AWS SDK v3 bundled)

3. **DNS and Traffic Management**
   - Route 53 hosted zone with failover routing policy
   - Health checks for primary and secondary endpoints
   - DNS records for ALB endpoint

4. **Message Queuing and Events**
   - SQS standard queues for payment transaction processing
   - Dead letter queues for failed messages
   - EventBridge custom event bus for payment lifecycle events
   - EventBridge rules to route payment success to SQS analytics queue
   - EventBridge rules to route payment failures and database failover events to SNS
   - Dead letter queue for failed EventBridge event processing

5. **Monitoring and Alerting**
   - CloudWatch alarms for critical metrics (CPU, memory, queue depth, failed payments)
   - SNS topics with email subscriptions for operational alerts
   - VPC Flow Logs sent to CloudWatch Logs with 30-day retention
   - CloudWatch Log Insights queries for security analysis

### Security and Threat Detection Requirements

6. **Web Application Firewall (AWS WAF v2)**
   - WAF Web ACL attached to the Application Load Balancer
   - Rate limiting rule: maximum 1000 requests per 5 minutes per IP address
   - SQL injection protection rule
   - Cross-site scripting (XSS) protection rule
   - Geographic blocking rule for specific countries if configured
   - Custom rule to protect payment API endpoints
   - All blocked requests must be logged to S3 bucket

7. **Amazon GuardDuty**
   - Enable GuardDuty detector for the AWS account
   - DO NOT create detector if one already exists (account-level limitation)
   - Configure S3 bucket for exporting GuardDuty findings
   - Export findings every 6 hours
   - CloudWatch Event rule to trigger SNS notifications on HIGH severity findings

8. **Encryption Key Management (AWS KMS)**
   - Customer-managed CMK for Aurora database encryption
   - Customer-managed CMK for all S3 buckets
   - Customer-managed CMK for Systems Manager Parameter Store
   - Customer-managed CMK for EventBridge encryption
   - Enable automatic key rotation on all keys
   - Key policies must follow least privilege principle with proper service principal access

### Compliance and Governance Requirements

9. **AWS Config**
   - Enable AWS Config recorder in the region
   - S3 bucket for configuration snapshots with versioning enabled
   - Config delivery channel using service-role/AWS_ConfigRole IAM policy
   - Managed Config rules: encrypted-volumes, rds-encryption-enabled, vpc-flow-logs-enabled
   - SNS topic for compliance violation notifications
   - Remediation Lambda function triggered on rule violations

10. **Streaming Analytics**
    - Kinesis Data Firehose delivery stream for payment transaction logs
    - Stream data to S3 bucket with GZIP compression
    - Lambda function for data transformation before S3 delivery
    - Backup configuration for failed records
    - Firehose must have proper IAM permissions for S3 and Lambda access

11. **Parameter Store and Secrets**
    - Systems Manager Parameter Store for application configuration
    - Store database connection strings as encrypted SecureString parameters
    - Store API keys and application secrets with KMS encryption
    - Parameters must use customer-managed KMS key

### Storage and Data Management Requirements

12. **S3 Buckets with Lifecycle Policies**
    - AWS Config snapshots bucket: versioning enabled, KMS encryption, lifecycle policy for old versions
    - GuardDuty findings bucket: KMS encryption, lifecycle policy to delete findings after 90 days
    - Kinesis Firehose destination bucket: intelligent tiering storage class, KMS encryption
    - ALB access logs bucket: KMS encryption, lifecycle policy to delete logs after 90 days
    - WAF logs bucket: KMS encryption, lifecycle policy for compliance retention
    - All buckets must block public access
    - All buckets must use customer-managed KMS keys for encryption
    - Proper bucket policies for service delivery (Config, GuardDuty, ALB, WAF)

### Technical Requirements

- All infrastructure defined using **CDKTF with Python**
- Deploy to **us-east-1** region
- Code must be modular with separate files for networking, database, compute, security, storage, monitoring, queuing, DNS, streaming, and parameters
- Main orchestrator file (tap_stack.py) must be under 400 lines
- Resource naming convention: {resource-type}-{environmentSuffix}
- All resources must include environmentSuffix parameter for uniqueness
- Lambda functions in lib/lambda/ directory
- Follow Python best practices with type hints and docstrings

### Deployment Requirements (CRITICAL)

- All resources MUST be destroyable without manual intervention
- Use RemovalPolicy.DESTROY for all databases and storage
- FORBIDDEN: RemovalPolicy.RETAIN or DeletionPolicy: Retain
- No Retain policies allowed anywhere in the code
- Infrastructure must deploy and destroy cleanly in automated CI/CD
- GuardDuty: Check if detector exists before creating (one per account)
- AWS Config: Use correct IAM service role policy for delivery channel
- Lambda Runtime: Node.js 18+ has AWS SDK v3 built-in, no need to bundle
- X-Ray: Ensure proper sampling rules for 100% payment transaction tracing

### Constraints

- All data at rest must be encrypted using customer-managed KMS keys
- All data in transit must use TLS 1.2 or higher
- Network traffic must be logged via VPC Flow Logs
- Compliance rules must trigger automated remediation
- WAF must block malicious traffic before it reaches ALB
- GuardDuty findings must generate immediate alerts for high-severity threats
- X-Ray traces must be encrypted at rest
- EventBridge events must be encrypted with customer-managed KMS
- No sensitive data in CloudWatch Logs (use encryption)
- All Lambda functions must have reserved concurrency to prevent runaway costs

## Success Criteria

- **Functionality**: Payment processing pipeline operational with secure database access via RDS Proxy
- **Security**: WAF blocking malicious requests, GuardDuty detecting threats, all encryption with CMKs
- **Compliance**: Config rules monitoring 100% of resources, violations triggering remediation
- **Observability**: X-Ray tracing 100% of payment transactions, CloudWatch alarms for all critical metrics
- **Event Processing**: EventBridge routing payment events to correct targets with DLQ for failures
- **Data Management**: All logs and findings stored in S3 with proper lifecycle policies
- **Infrastructure Quality**: Clean deployment and destruction, 100% test coverage, modular code
- **Resource Naming**: All resources include environmentSuffix for uniqueness
- **Code Quality**: Python with type hints, well-tested, documented

## What to deliver

- Complete CDKTF Python implementation across multiple modular files
- lib/tap_stack.py: Main stack orchestrator (under 400 lines)
- lib/networking.py: VPC, subnets, NAT gateways, VPC Flow Logs
- lib/database.py: Aurora Serverless v2 cluster, RDS Proxy, encryption
- lib/compute.py: Lambda functions, EC2 Auto Scaling Group, ALB, X-Ray configuration
- lib/security.py: WAF Web ACL with rules, GuardDuty detector, KMS keys with rotation
- lib/monitoring.py: CloudWatch alarms, SNS topics, AWS Config rules and recorder
- lib/queuing.py: SQS queues with DLQs, EventBridge custom bus and rules
- lib/dns.py: Route 53 hosted zone, health checks, DNS records
- lib/storage.py: S3 buckets with encryption, versioning, lifecycle policies, and proper bucket policies
- lib/streaming.py: Kinesis Firehose with transformation Lambda and IAM roles
- lib/parameters.py: Systems Manager Parameter Store with encrypted parameters
- Lambda function code in lib/lambda/ directory
- Unit tests with 100% coverage for all infrastructure modules
- Documentation with deployment and testing instructions