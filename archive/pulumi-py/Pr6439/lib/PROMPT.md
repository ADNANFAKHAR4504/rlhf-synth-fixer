# Disaster Recovery Infrastructure with Pulumi (Python)

## Objective
Create a comprehensive disaster recovery infrastructure using Pulumi with Python, implementing best practices for high availability, automated failover, and data replication.

## Requirements

### Platform & Language
- **Platform**: Pulumi
- **Language**: Python
- **Complexity**: Expert
- **Region**: us-east-1 (simplified single-region with DR capabilities)

### Core Infrastructure Components

#### 1. Database Layer - Amazon Aurora Serverless v2
- Aurora Serverless v2 cluster with automatic scaling
- Automated backups with point-in-time recovery
- Encryption at rest and in transit
- Multi-AZ deployment for high availability
- Backup retention: 7 days minimum

#### 2. NoSQL Database - DynamoDB
- DynamoDB tables with point-in-time recovery enabled
- On-demand billing mode for cost optimization
- Encryption using AWS managed keys
- Stream enabled for change data capture

#### 3. Storage - Amazon S3
- S3 bucket with versioning enabled
- Lifecycle policies for cost optimization
- Encryption at rest (SSE-S3)
- Bucket policies for secure access

#### 4. Compute - AWS Lambda
- Lambda functions for business logic
- Environment variables for configuration
- IAM roles with least privilege
- Integration with other services

#### 5. API Layer - API Gateway
- REST API Gateway for Lambda functions
- CORS enabled
- Usage plans and API keys for rate limiting
- CloudWatch logging enabled

#### 6. Event Processing - EventBridge
- Event rules for automated workflows
- Integration with Lambda targets
- Event patterns for filtering

#### 7. Monitoring & Alerting
- CloudWatch alarms for key metrics
- SNS topics for notifications
- CloudWatch Logs for centralized logging
- Metrics for database, Lambda, and API Gateway

### Architecture Simplifications
The following simplifications are applied to keep the infrastructure cost-effective while demonstrating DR patterns:
- Single primary region (us-east-1) instead of multi-region
- Aurora Serverless v2 instead of Global Database
- No AWS Global Accelerator
- No Route 53 failover routing (simple hosted zone if needed)
- No custom domains or ACM certificates
- S3 versioning instead of cross-region replication
- DynamoDB with point-in-time recovery instead of Global Tables

### Technical Requirements

#### Naming Convention
- All resources must include `{environment_suffix}` in their names
- Example: `dr-{environment_suffix}-aurora-cluster`

#### Security
- All data must be encrypted at rest
- All data must be encrypted in transit where applicable
- IAM roles must follow least privilege principle
- Security groups with minimal required access

#### High Availability
- Multi-AZ deployment where supported
- Automated backups for stateful services
- Health checks and monitoring

#### Cost Optimization
- Use serverless services where possible (Aurora Serverless v2, Lambda)
- Implement lifecycle policies for S3
- Use on-demand billing for DynamoDB
- Automatic scaling based on load

#### Testing Requirements
- 100% unit test coverage required
- Integration tests using actual deployed resources
- Tests must use stack outputs (no hardcoded values)
- No mocking in integration tests

### Deliverables
1. Pulumi stack with all infrastructure components
2. Proper stack outputs for all key resources
3. Unit tests with 100% coverage
4. Integration tests validating end-to-end functionality
5. Documentation of architecture and components

### Success Criteria
- Infrastructure deploys successfully
- All tests pass with 100% coverage
- Resources are properly named with environment suffix
- Security best practices are implemented
- Cost is within budget ($200/month maximum)
