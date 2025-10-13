Design a CloudFormation YAML template that provisions a multi-AZ real-time data analytics pipeline for a financial technology company processing payment transactions with up to 1000 transactions per second. The pipeline requires high availability, fault tolerance, and scalability, deployed in a single AWS region using multiple Availability Zones.

**Core requirements:**

- **VPC Setup:**
  - Create a VPC with private subnets distributed across at least two Availability Zones.
  - Include necessary route tables and network ACLs.
  - Set up VPC endpoints for Kinesis Data Streams, S3, DynamoDB, and Lambda (if needed) to allow private network communication with these services.

- **Data Streaming:**
  - Provision an Amazon Kinesis Data Stream with an appropriate shard count to handle the expected throughput of 1000 transactions per second.
  - Configure stream retention and encryption settings.

- **Data Processing:**
  - Create an AWS Lambda function connected to the VPC private subnets (using VpcConfig) with security groups allowing necessary access.
  - Set Lambda’s IAM role with permissions to read from Kinesis, write to DynamoDB, and write to S3.
  - Implement error handling configurations for Lambda.

- **Storage:**
  - An Amazon S3 bucket with server-side encryption enabled (SSE-KMS or SSE-S3).
  - Lifecycle policies to manage data retention and transition to cheaper storage classes for compliance.
  - A DynamoDB table for storing processed transaction metadata.
    - Use a well-designed partition key considering high cardinality and access patterns.
    - Configure throughput capacity or autoscaling.

- **Monitoring and Alarming:**
  - CloudWatch alarms to monitor Kinesis stream metrics (e.g., Read/Write throughput, Iterator age).
  - CloudWatch alarms for Lambda errors or throttling.
  - Alarms monitoring DynamoDB consumed capacity and errors.

**Additional constraints:**

- The entire architecture must be highly available with components deployed across multiple AZs.
- Provide necessary IAM roles and policies scoped securely.
- Use parameters and mappings where applicable for environment customization.
- Follow best practices for resource naming, tagging, and security.
- Output is a single yaml file with no inline comments.
