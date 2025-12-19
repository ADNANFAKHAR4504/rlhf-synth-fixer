Hey team,

We need to build a real-time student performance monitoring system for an educational institution. The challenge they're facing is tracking and analyzing academic performance data as it happens - test scores, assignment submissions, attendance records, and other academic metrics need to be captured in real-time so educators can respond quickly to students who need help.

I've been tasked with creating the infrastructure for this system in **AWS CDK with Python**. The business wants a solution that can handle continuous streams of student performance data, store it reliably, and ensure the system stays available even when things go wrong. They're particularly concerned about high availability and having solid failure recovery mechanisms in place.

The data flow will work like this: academic events get pushed into a streaming pipeline as they occur (a student completes a quiz, submits homework, etc.), and downstream consumers process this data for analytics, alerting, and reporting. We also need persistent storage for the processed data with multi-region backup capabilities.

## What we need to build

Create a student performance monitoring infrastructure using **AWS CDK with Python** that handles real-time academic data capture and processing with high availability.

### Core Requirements

1. **Real-time Data Streaming**
   - Amazon Kinesis Data Stream for capturing student performance events
   - Stream should handle continuous flow of academic data (test scores, assignments, attendance)
   - Configure appropriate shard count for expected throughput
   - Enable encryption for data in transit

2. **Persistent Database Storage**
   - Amazon RDS database for storing processed academic data
   - Multi-AZ deployment for high availability (REQUIRED)
   - Automated backups with appropriate retention period
   - Encryption at rest for sensitive student data
   - PostgreSQL or MySQL engine (your choice based on best fit)

3. **Failure Recovery Mechanisms**
   - Automated failover for RDS (Multi-AZ handles this)
   - Kinesis stream with adequate retention period for replay capability
   - Backup and restore procedures for database
   - CloudWatch alarms for monitoring critical metrics

4. **Processing Pipeline**
   - Lambda function to process Kinesis stream data
   - Write processed records to RDS database
   - Error handling and dead letter queue for failed processing
   - Appropriate IAM permissions for Lambda to access both services

### Technical Requirements

- All infrastructure defined using **AWS CDK with Python**
- Use **Amazon Kinesis Data Streams** for real-time event capture
- Use **Amazon RDS** with Multi-AZ deployment for database storage
- Deploy to **us-east-1** region
- Resource names must include a **string suffix** for uniqueness (environmentSuffix)
- Follow naming convention: `{resource-type}-{environment-suffix}`
- VPC configuration for RDS with appropriate security groups
- Secrets Manager for database credentials (no hardcoded passwords)
- Enable encryption at rest for RDS
- Enable server-side encryption for Kinesis stream
- CloudWatch Logs with appropriate retention periods (7-14 days)
- All resources must be destroyable (no Retain deletion policies)

### Constraints

- Must support high availability with minimal downtime
- Multi-AZ RDS deployment is mandatory (not optional)
- Data must be encrypted both in transit and at rest
- No hardcoded credentials or sensitive data in code
- Implement least privilege IAM policies
- All resources must include environmentSuffix for parallel deployment safety
- Follow AWS Well-Architected Framework principles for reliability

### Security Requirements

- KMS encryption keys for RDS and Kinesis
- Secrets Manager for database password management
- Security groups with minimal required access
- IAM roles with least privilege permissions
- VPC with private subnets for RDS
- No public internet access to database

## Success Criteria

- **Functionality**: Kinesis stream successfully captures events and Lambda processes them into RDS
- **High Availability**: RDS Multi-AZ configured with automatic failover capability
- **Failure Recovery**: System can recover from AZ failures and replay missed events from Kinesis
- **Security**: All data encrypted, credentials managed securely, least privilege access
- **Monitoring**: CloudWatch alarms configured for critical metrics (database CPU, replication lag, stream errors)
- **Resource Naming**: All resources include string suffix for uniqueness (environmentSuffix)
- **Code Quality**: Production-ready Python code, well-structured, properly documented
- **Destroyability**: All resources can be cleanly destroyed without manual intervention

## What to deliver

- Complete AWS CDK Python implementation in lib/tap_stack.py
- Kinesis Data Stream with encryption and appropriate retention
- RDS PostgreSQL/MySQL instance with Multi-AZ, encryption, and Secrets Manager integration
- Lambda function for processing stream data and writing to database
- VPC, subnets, and security groups for network isolation
- IAM roles and policies with least privilege
- CloudWatch alarms for monitoring
- Unit tests for infrastructure validation
- Integration tests verifying end-to-end data flow
- Documentation of architecture and deployment instructions
