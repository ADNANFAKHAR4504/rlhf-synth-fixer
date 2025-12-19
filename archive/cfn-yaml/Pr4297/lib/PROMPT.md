# HIPAA-Compliant Patient Records API Infrastructure

You are an expert AWS Infrastructure Engineer. Create infrastructure using **CloudFormation with YAML**.

## Task Overview

Design and implement a HIPAA-compliant patient records API infrastructure. The system must securely store patient records in RDS with proper encryption, access controls, and audit logging capabilities.

## Architecture Requirements

### Core Components

1. **API Gateway REST API**
   - HTTPS only (TLS 1.2+)
   - IAM authorization for API access
   - CloudWatch logging enabled for audit trails
   - Request/response logging for compliance

2. **Lambda Function**
   - Runtime: Python 3.11
   - Handles CRUD operations for patient records
   - Retrieves database credentials from Secrets Manager
   - Error handling and input validation
   - VPC integration to access RDS in private subnet

3. **RDS PostgreSQL Database**
   - Encryption at rest using AWS KMS
   - Deployed in private subnets (no public access)
   - Automated backups enabled
   - Single instance (sufficient for this use case)
   - Deletion protection disabled for testing
   - Database name: patientdb
   - Master username: dbadmin

4. **VPC and Network Configuration**
   - VPC with CIDR 10.0.0.0/16
   - Two private subnets in different AZs for RDS
   - Two public subnets for NAT Gateway (if needed)
   - Security groups with least privilege access
   - Lambda security group can connect to RDS on port 5432
   - RDS security group accepts connections only from Lambda

5. **AWS Secrets Manager**
   - Store RDS master password
   - Automatic rotation capability configured
   - Access restricted to Lambda execution role

6. **KMS Encryption**
   - Customer managed KMS key for RDS encryption
   - Key policy allows RDS service to use the key
   - Enable key rotation

7. **CloudWatch Logs**
   - API Gateway execution and access logs
   - Lambda function logs
   - RDS error and slow query logs
   - Log retention: 7 days
   - Encryption at rest for log groups

## HIPAA Compliance Requirements

### Encryption
- All data encrypted in transit (HTTPS/TLS only)
- All data encrypted at rest (RDS with KMS, CloudWatch Logs encrypted)
- Use customer managed KMS keys where possible

### Access Controls
- IAM roles with least privilege principle
- No public access to database
- API Gateway with IAM authorization
- Security groups with minimal port exposure

### Audit Logging
- API Gateway request/response logging
- Lambda invocation and error logs
- Database connection and query logs
- CloudTrail integration (assumed to be enabled at account level)

### Network Isolation
- Database in private subnets only
- No direct internet access to database
- VPC security groups for network segmentation

## Technical Specifications

### CloudFormation Template Structure

Create a single CloudFormation template (cfn-template.yaml) with the following:

1. **Parameters**
   - EnvironmentSuffix: String parameter for resource naming uniqueness

2. **Resources**
   - VPC with DNS support enabled
   - 2 Private Subnets (for RDS)
   - 2 Public Subnets (for NAT if needed, or VPC endpoints)
   - Internet Gateway
   - Route Tables
   - KMS Key for RDS encryption
   - KMS Key for CloudWatch Logs encryption
   - Secrets Manager Secret for database password
   - RDS Subnet Group
   - RDS Security Group
   - RDS DB Instance
   - Lambda Security Group
   - Lambda Execution Role with policies for:
     - CloudWatch Logs write
     - Secrets Manager read
     - VPC ENI management
   - Lambda Function with VPC configuration
   - API Gateway REST API
   - API Gateway Resource and Method
   - API Gateway Deployment
   - API Gateway Stage with logging
   - Lambda Permission for API Gateway

3. **Outputs**
   - API Gateway endpoint URL
   - RDS endpoint address
   - Lambda function ARN
   - Security group IDs

### Lambda Function Code

The Lambda function should:
- Accept HTTP methods: GET, POST, PUT, DELETE
- Retrieve database credentials from Secrets Manager
- Connect to RDS PostgreSQL using psycopg2 (or pg8000 for AWS Lambda)
- Execute SQL queries based on HTTP method
- Return appropriate HTTP status codes
- Handle errors gracefully
- Log all operations for audit

### Resource Naming Convention

All resources must include the EnvironmentSuffix parameter:
- Format: `resource-name-${EnvironmentSuffix}`
- Example: `PatientAPI-${EnvironmentSuffix}`

### Optimization and Best Practices

1. Use VPC endpoints for Secrets Manager to avoid NAT Gateway costs
2. Keep RDS instance size small (db.t3.micro or db.t4g.micro)
3. Use Aurora Serverless v2 is NOT required - standard RDS PostgreSQL is acceptable
4. Set short backup retention (1 day minimum for HIPAA)
5. Ensure all resources are deletable (no retention policies that prevent cleanup)

## Deliverables

Provide complete CloudFormation YAML template with:
- Comprehensive inline comments explaining HIPAA compliance features
- All resources properly configured with encryption
- Security groups with least privilege
- Proper IAM roles and policies
- Lambda function code inline or reference to separate file
- Working API Gateway integration

## Validation Criteria

The infrastructure must:
1. Deploy successfully in us-east-1
2. Create all resources with EnvironmentSuffix in names
3. Enable encryption for all data at rest and in transit
4. Restrict database access to private subnets only
5. Log all API requests and Lambda executions
6. Use IAM authorization for API access
7. Store sensitive credentials in Secrets Manager
8. Be fully deletable without manual intervention
