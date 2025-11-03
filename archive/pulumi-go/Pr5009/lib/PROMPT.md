# PCI-DSS Compliant Real-Time Transaction Processing System

I need help designing infrastructure for a Brazilian fintech company that processes credit card transactions in real-time. The system must handle peak loads of 10,000 transactions per second while maintaining PCI-DSS compliance.

## Requirements

We need to build this using Pulumi with Go for the eu-central-2 region. The infrastructure should handle credit card transaction data with proper encryption both in transit and at rest, and provide scalable processing with high availability.

### Core Services Needed

1. Amazon Kinesis Data Streams for real-time transaction ingestion - needs to handle the 10k TPS load with enhanced fan-out for multiple consumers
2. Amazon ECS Fargate for running containerized transaction processing applications
3. Amazon RDS with Multi-AZ deployment for storing transaction records with encryption enabled
4. Amazon ElastiCache Redis cluster for temporary data caching to reduce database load
5. AWS Secrets Manager to securely store database credentials and API keys
6. API Gateway to provide secure transaction endpoints with throttling
7. Amazon EFS for shared storage that multiple ECS tasks can access

### Infrastructure Requirements

The network should be properly segmented with public and private subnets across multiple availability zones. All data at rest needs to be encrypted using KMS keys. Communications must use TLS 1.2 or higher.

For high availability, we need resources deployed across at least two availability zones with automatic failover capabilities. The system should include proper IAM roles following least privilege principles.

Monitoring and audit trails are important for compliance, so include CloudWatch logs and metrics. Load balancers should distribute traffic to the ECS tasks.

All resource names should include an environment suffix for isolation between deployments.

### Security and Compliance

The solution must meet PCI-DSS requirements including network segmentation between public and private resources, encryption of cardholder data, restricted access controls, and comprehensive logging for audit purposes.

Please provide the complete Pulumi Go code to implement this infrastructure with proper security configurations and high availability setup.
