# Multi-Region Disaster Recovery Solution for Trading Platform

## Platform and Language

Create infrastructure using **AWS CDK with TypeScript**.

## Business Context

A financial services company operates a critical trading platform that must maintain 99.99% uptime. After experiencing a regional outage that cost millions in lost trades, they need to implement a multi-region disaster recovery solution that can automatically failover within 60 seconds.

## Infrastructure Requirements

Implement a multi-region disaster recovery solution spanning us-east-1 (primary) and us-east-2 (secondary) with the following components:

### 1. DNS and Traffic Management
- Set up Route 53 hosted zone with health checks monitoring endpoints in us-east-1 and us-east-2
- Implement failover routing policy for automatic DNS failover
- Configure health checks with appropriate thresholds for rapid failover detection

### 2. Database Layer
- Deploy Aurora PostgreSQL global database with writer in us-east-1 and read replica in us-east-2
- Implement cross-region RDS Aurora Global Database with automated promotion
- Configure DynamoDB global tables for user session data with point-in-time recovery enabled
- Ensure session state replication across regions

### 3. Compute and Application Layer
- Create Lambda functions in both regions processing trade orders from SQS queues
- Deploy Lambda functions in both regions using identical deployment packages
- Deploy API Gateway REST APIs in both regions with custom domain names
- Ensure all IAM roles support cross-region assume role capabilities

### 4. Storage and Replication
- Implement S3 buckets with cross-region replication for application configurations and audit logs
- Use S3 cross-region replication for static assets and configuration files
- Configure appropriate lifecycle policies and encryption

### 5. Monitoring and Alerting
- Set up CloudWatch alarms monitoring RDS lag, Lambda errors, and API Gateway latency
- Implement CloudWatch cross-region alarms and SNS notifications
- Configure EventBridge rules forwarding critical events between regions

### 6. Automated Failover
- Create Step Functions state machine orchestrating failover process including RDS promotion and Route 53 updates
- Implement automated failback procedures using Step Functions
- Implement automated testing Lambda that validates failover readiness every hour

### 7. Configuration Management
- Use Systems Manager Parameter Store with region-specific configurations
- Ensure configuration synchronization across regions

## Technical Constraints

### AWS Services Required
- Route 53 (DNS and health checks)
- Aurora PostgreSQL Global Database
- DynamoDB Global Tables
- Lambda
- SQS
- API Gateway
- S3 with Cross-Region Replication
- CloudWatch
- Step Functions
- EventBridge
- Systems Manager Parameter Store

### Architecture Requirements
- CDK 2.x with TypeScript
- AWS CLI configured with multi-region access
- VPCs in both regions with private subnets
- VPC peering for cross-region communication
- CloudWatch cross-region monitoring with automated failover triggers via Step Functions

### Compliance and Best Practices
- All resources must include environmentSuffix for naming
- Implement least privilege IAM policies
- Enable encryption at rest and in transit
- Configure appropriate backup and retention policies
- Ensure all resources are tagged appropriately

## Expected Output

CDK application structure:
- Separate stacks for primary region (us-east-1) and secondary region (us-east-2)
- Shared constructs for cross-region resources (Route 53, global databases)
- Deployment scripts that validate both regions are synchronized before completing
- Health check and monitoring configurations
- Automated failover orchestration via Step Functions

## Success Criteria

1. Infrastructure deploys successfully in both regions
2. Health checks correctly monitor endpoints in both regions
3. Aurora Global Database replication is functional
4. DynamoDB global tables replicate session data
5. S3 cross-region replication is active
6. CloudWatch alarms are properly configured and alerting
7. Step Functions can orchestrate failover process
8. API Gateway endpoints are accessible in both regions
9. Automated testing Lambda validates failover readiness
10. All resources follow naming conventions with environmentSuffix
