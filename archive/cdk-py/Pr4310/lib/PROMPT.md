# IoT Data Processing Infrastructure for Medical Device Manufacturing

You are an expert AWS Infrastructure Engineer. Create infrastructure using **AWS CDK with Python**.

## Background

SmartFactory Inc. operates medical device manufacturing facilities that generate sensitive IoT sensor data. They need compliant infrastructure to collect, process, and store this data while maintaining audit trails for regulatory compliance.

## Requirements

Build a CDK infrastructure in Python that processes IoT sensor data while maintaining HIPAA and ISO 27001 compliance requirements.

### Required AWS Services

Implement ALL of the following services:

1. **ECS Cluster** - For data processing applications
2. **RDS Instance** - For storing processed data with encryption at rest
3. **ElastiCache Redis** - For temporary data caching
4. **Secrets Manager** - For managing database credentials (fetch existing secrets, do not create new ones)
5. **Kinesis Data Streams** - For real-time data ingestion

### Security and Compliance Constraints

- All data must be encrypted at rest using AWS KMS keys
- All data must be encrypted in transit using TLS/SSL
- Database backups must be retained for at least 30 days
- Infrastructure must be deployed in private subnets with controlled access
- Use NAT Gateway for outbound connectivity from private subnets
- Follow principle of least privilege for IAM roles
- Enable CloudWatch logging and monitoring
- All resources must be tagged appropriately

### Technical Requirements

- Region: ap-southeast-1
- Use Aurora Serverless v2 for RDS to reduce deployment time and costs
- All resource names must include the `environment_suffix` variable
- Infrastructure must be fully destroyable (no DeletionPolicy: Retain)
- Enable S3 bucket auto-deletion if any buckets are created
- Use removal_policy=RemovalPolicy.DESTROY for all resources
- Database credentials should be fetched from an existing Secrets Manager secret (do not create the secret)

### Infrastructure Architecture

The solution should include:

1. VPC with public and private subnets across 2 availability zones
2. NAT Gateway for private subnet internet access
3. Security groups with least privilege access
4. KMS keys for encryption
5. ECS cluster with Fargate launch type
6. Aurora Serverless v2 PostgreSQL cluster in private subnets
7. ElastiCache Redis cluster in private subnets
8. Kinesis data stream for IoT data ingestion
9. IAM roles and policies following least privilege
10. CloudWatch log groups for monitoring

## Deliverables

Provide complete, production-ready CDK Python code in separate files:

1. **lib/tap_stack.py** - Main stack implementation with all resources
2. **lib/__init__.py** - Empty init file for Python package

The code should:
- Be well-commented and follow Python best practices
- Use proper typing hints
- Handle the environment_suffix parameter correctly
- Create all resources with appropriate dependencies
- Include proper error handling
- Follow CDK best practices

Each file should be provided in a separate code block with the filename as the header.
