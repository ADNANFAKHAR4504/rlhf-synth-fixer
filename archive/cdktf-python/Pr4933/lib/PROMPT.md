Hi there,

We need to build out infrastructure for our video processing pipeline at StreamFlix. Our team is handling raw video uploads from content creators across Europe, and we need a system that can process these videos efficiently while keeping track of all the metadata for compliance purposes.

The solution needs to be built using CDKTF with Python and deployed to eu-central-1. We're dealing with large video files, so scalability is important, and we need to make sure everything complies with EU media regulations for content tracking.

## What we need

Build a video processing pipeline infrastructure that can:

1. **Video Ingestion**
   - Use Kinesis Data Streams to handle incoming video file metadata and processing requests
   - Stream should be able to handle bursts during peak upload times
   - Configure proper shard capacity for scalability

2. **Metadata Storage**
   - Set up an RDS Aurora Serverless v2 PostgreSQL database for storing video metadata
   - Store information like video title, creator, upload timestamp, processing status, duration, file size
   - Database credentials must be stored in AWS Secrets Manager
   - Enable automated backups and point-in-time recovery

3. **Video Processing Service**
   - Deploy containerized video processing workers using ECS with Fargate
   - Workers should pull processing jobs from Kinesis and update status in RDS
   - Use Fargate Spot for cost optimization where possible
   - Configure auto-scaling based on stream metrics

4. **Security Requirements**
   - All database credentials stored in AWS Secrets Manager
   - Secrets rotation enabled with 30-day rotation period
   - Proper IAM roles for ECS tasks to access Secrets Manager, Kinesis, and RDS
   - VPC with private subnets for RDS and ECS tasks
   - Security groups allowing only necessary traffic

5. **Error Handling**
   - Dead letter queue for failed processing jobs
   - CloudWatch alarms for monitoring error rates
   - Automatic retry logic with exponential backoff
   - SNS notifications for critical failures

6. **Compliance Tracking**
   - CloudWatch Logs for all processing activities with 90-day retention
   - CloudTrail integration for API audit logging
   - All resources properly tagged with content tracking metadata

## Technical Specifications

- Platform: CDKTF with Python
- Target Region: eu-central-1
- Required Services: Kinesis Data Streams, RDS Aurora Serverless v2, ECS Fargate, AWS Secrets Manager
- Resource naming: Use environment_suffix variable throughout (e.g., streamflix-kinesis-{environment_suffix})
- All resources must be fully destroyable (no retention policies that block deletion)

## Deliverables

Create the complete infrastructure code with:
- VPC networking setup (public and private subnets across 2 AZs)
- Kinesis Data Stream configuration
- RDS Aurora Serverless v2 cluster with PostgreSQL
- AWS Secrets Manager secrets for database credentials with rotation
- ECS cluster with Fargate service and task definitions
- IAM roles and security groups
- CloudWatch monitoring and alarms
- All necessary outputs (stream name, database endpoint, ECS cluster name, etc.)

Make sure everything can scale automatically and handle failures gracefully. The system needs to be production-ready for our European operations.