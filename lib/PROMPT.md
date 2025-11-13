# Trading Platform Infrastructure

## Platform and Language

Create infrastructure using **AWS CDK with TypeScript**.

## Business Context

A financial services company operates a trading platform that requires reliable infrastructure for processing trade orders. The platform needs robust architecture with proper monitoring, event handling, and data persistence in the us-east-1 region.

## Infrastructure Requirements

Implement a single-region trading platform infrastructure in us-east-1 with the following components:

### 1. Database Layer
- Deploy Aurora PostgreSQL Serverless v2 cluster for trade data storage
- Configure DynamoDB table for user session data with point-in-time recovery enabled
- Enable encryption at rest and automated backups

### 2. Compute and Application Layer
- Create Lambda functions processing trade orders from SQS queues
- Deploy API Gateway REST API with endpoints for trade submission and health checks
- Implement proper IAM roles and permissions following least privilege

### 3. Storage
- Implement S3 bucket for application configurations and audit logs
- Configure versioning and lifecycle policies
- Enable encryption for data at rest

### 4. Messaging and Events
- Set up SQS queues for asynchronous trade order processing
- Configure EventBridge for platform event handling
- Implement dead letter queues for failed messages

### 5. Monitoring and Alerting
- Set up CloudWatch alarms monitoring RDS capacity, Lambda errors, and API Gateway latency
- Implement SNS topics for alert notifications
- Enable CloudWatch Logs for all Lambda functions

### 6. Network Infrastructure
- Deploy VPC with public and private subnets across multiple AZs
- Configure security groups for Aurora access
- Implement isolated subnets for database resources

### 7. Configuration Management
- Use Systems Manager Parameter Store for application configurations
- Store region-specific settings and resource references

## Technical Constraints

### AWS Services Required
- Aurora PostgreSQL Serverless v2
- DynamoDB
- Lambda
- SQS
- API Gateway
- S3
- CloudWatch
- EventBridge
- Systems Manager Parameter Store
- VPC

### Architecture Requirements
- CDK 2.x with TypeScript
- Single region deployment (us-east-1)
- VPC with public and private subnets
- Proper security group configuration
- CloudWatch monitoring and alarms

### Compliance and Best Practices
- All resources must include environmentSuffix for naming
- Implement least privilege IAM policies
- Enable encryption at rest and in transit
- Configure appropriate backup and retention policies
- Ensure all resources are tagged appropriately
- Use removal policies for easy cleanup

## Expected Output

CDK application structure:
- Single stack for us-east-1 region
- Lambda functions for API handling, trade processing, and event handling
- API Gateway with health check and trade endpoints
- Monitoring and alerting via CloudWatch and SNS
- Event-driven architecture using EventBridge

## Success Criteria

1. Infrastructure deploys successfully in us-east-1
2. Aurora PostgreSQL cluster is accessible and functional
3. DynamoDB table stores session data correctly
4. Lambda functions process trade orders from SQS
5. API Gateway endpoints are accessible and functional
6. S3 bucket stores configurations
7. CloudWatch alarms are properly configured and alerting
8. EventBridge handles platform events correctly
9. All resources follow naming conventions with environmentSuffix
10. Health check endpoint returns proper status
