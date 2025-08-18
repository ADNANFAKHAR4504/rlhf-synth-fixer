# Serverless Data Processing Pipeline with Multi-Region Support

You are an expert AWS Solutions Architect specializing in serverless architectures and Infrastructure as Code (IaC). Your task is to design and implement a complete, event-driven serverless infrastructure using **AWS CDK + TypeScript** that demonstrates best practices for security, scalability, and multi-region deployment.

## Problem Statement

Deploy a serverless data processing pipeline that integrates **AWS S3**, **AWS Lambda**, and **Amazon DynamoDB** with comprehensive multi-region capabilities. The system must process data files uploaded to S3, transform and validate the data through Lambda functions, and store results in DynamoDB while maintaining high availability and security across multiple AWS regions.

## Global Requirements

- **Framework**: AWS CDK + TypeScript
- **Primary Region**: `us-east-1`
- **Secondary Region**: `us-west-2` (for multi-region deployment)
- **Architecture Pattern**: Event-driven serverless processing
- **Security**: IAM roles with least privilege access principles
- **Naming Convention**: All resources must follow the pattern `serverless-<resource>-<environment>` (use "prod" for environment)

## Detailed Infrastructure Requirements

### 1. **Data Ingestion Layer (S3)**

**S3 Bucket Configuration:**

- Create a primary S3 bucket in `us-east-1` named `serverless-data-ingestion-prod`
- Enable versioning for data integrity and recovery
- Configure server-side encryption using SSE-S3
- Block all public access for security
- Set up S3 Event Notifications to trigger Lambda function on object creation
- **Note**: Cross-Region Replication (CRR) has been removed to avoid deployment issues

**Multi-Region Support:**

- Create a secondary S3 bucket in `us-west-2` for disaster recovery

### 2. **Data Processing Layer (Lambda)**

**Primary Lambda Function:**

- Runtime: Node.js 18.x
- Function name: `serverless-data-processor-prod`
- Deploy in `us-east-1` region
- Configure environment variables for DynamoDB table name and region
- Implement error handling and retry logic
- Set up dead letter queue (SQS) for failed processing

**Lambda Function Requirements:**

- **Data Validation**: Validate incoming JSON payload structure and data types
- **Data Transformation**: Convert raw data to standardized format with metadata enrichment
- **DynamoDB Integration**: Store processed records with appropriate error handling
- **Logging**: Comprehensive CloudWatch logging for monitoring and debugging
- **Timeout Configuration**: Set appropriate timeout (5 minutes) for data processing

**Multi-Region Lambda Deployment:**

- Deploy identical Lambda function in `us-west-2` region
- Configure environment variables to point to regional DynamoDB table
- Implement region-aware processing logic

### 3. **Data Storage Layer (DynamoDB)**

**Primary DynamoDB Table:**

- Table name: `serverless-processed-data-prod`
- Deploy in `us-east-1` region
- Partition key: `recordId` (String)
- Sort key: `timestamp` (String)
- Configure Global Secondary Index (GSI) for querying by processing status
- Enable point-in-time recovery (PITR)
- Configure DynamoDB Streams for change data capture

**Multi-Region DynamoDB:**

- Set up DynamoDB Global Tables for automatic multi-region replication
- Configure Global Tables between `us-east-1` and `us-west-2`
- Ensure eventual consistency across regions
- Implement conflict resolution strategy

### 4. **Security and IAM Configuration**

**Lambda Execution Role (Least Privilege):**

- S3 permissions: `s3:GetObject` on the data ingestion bucket
- DynamoDB permissions: `dynamodb:PutItem`, `dynamodb:UpdateItem`, `dynamodb:GetItem`
- CloudWatch permissions: `logs:CreateLogGroup`, `logs:CreateLogStream`, `logs:PutLogEvents`
- SQS permissions: `sqs:SendMessage` for dead letter queue

**Cross-Region IAM Considerations:**

- Configure IAM roles to work across multiple regions
- Implement resource-based policies for cross-region access
- Set up AssumeRole policies for regional failover scenarios

### 5. **Event-Driven Architecture**

**S3 Event Integration:**

- Configure S3 bucket notifications to trigger Lambda on object creation
- Set up event filtering for specific file types (e.g., `.json`, `.csv`)
- Implement prefix-based routing for different data types

**DynamoDB Streams Integration:**

- Enable DynamoDB Streams on the processed data table
- Create additional Lambda function for stream processing
- Implement downstream processing for audit trails or analytics

### 6. **Multi-Region Deployment Strategy**

**Active-Passive Configuration:**

- Primary region (`us-east-1`) handles all incoming requests
- Secondary region (`us-west-2`) serves as disaster recovery
- **Note**: S3 Cross-Region Replication has been disabled to prevent deployment issues
- Implement Route 53 health checks for automatic failover

**Regional Failover Logic:**

- Configure Lambda functions to detect region availability
- Implement cross-region data synchronization mechanisms
- Set up monitoring and alerting for region-specific failures

### 7. **Monitoring and Observability**

**CloudWatch Configuration:**

- Create CloudWatch alarms for Lambda function errors and duration
- Set up CloudWatch dashboards for real-time monitoring
- Configure SNS notifications for critical alerts

**Multi-Region Monitoring:**

- Deploy monitoring infrastructure in both regions
- Implement cross-region health checks
- Set up aggregated metrics across regions

## Technical Implementation Details

### **Data Flow Architecture:**

1. **Data Upload**: Files uploaded to S3 bucket in primary region
2. **Event Trigger**: S3 event notification triggers Lambda function
3. **Data Processing**: Lambda validates, transforms, and enriches data
4. **Data Storage**: Processed data stored in DynamoDB with Global Tables replication
5. **Cross-Region Sync**: Data automatically replicated to secondary region via DynamoDB Global Tables
6. **Monitoring**: CloudWatch captures metrics and logs across regions

### **Error Handling and Resilience:**

- **Dead Letter Queue**: SQS queue for failed Lambda executions
- **Retry Logic**: Exponential backoff for transient failures
- **Circuit Breaker**: Implement circuit breaker pattern for external dependencies
- **Data Validation**: Comprehensive input validation with detailed error messages
- **Graceful Degradation**: Fallback mechanisms for service unavailability

### **Security Best Practices:**

- **Encryption**: End-to-end encryption for data in transit and at rest
- **VPC Endpoints**: Use VPC endpoints for AWS service communication
- **Secrets Management**: AWS Secrets Manager for sensitive configuration
- **Audit Logging**: CloudTrail integration for API call auditing
- **Resource Tags**: Consistent tagging strategy for cost allocation and governance

## Expected Deliverables

**Complete AWS CDK + TypeScript Implementation:**

1. **Main Stack File**: `tap-stack.ts` with all AWS resources defined using CDK constructs
2. **Lambda Function Code**: Complete TypeScript handler with data processing logic
3. **IAM Policies**: Comprehensive IAM roles and policies with least privilege using CDK IAM constructs
4. **Multi-Region Configuration**: CDK app with multiple stacks for different regions
5. **Resource Outputs**: Export critical resource ARNs and identifiers using CDK outputs
6. **Error Handling**: Robust exception handling and logging mechanisms

**Multi-Region Components:**

- Primary and secondary S3 buckets (without cross-region replication)
- DynamoDB Global Tables configuration using CDK DynamoDB constructs
- Regional Lambda function deployments using CDK Lambda constructs
- Cross-region monitoring and alerting using CDK CloudWatch constructs
- Route 53 health checks and failover routing using CDK Route53 constructs

## Success Criteria

The solution must demonstrate:

1. ✅ Complete AWS CDK + TypeScript implementation with proper imports and stack definition
2. ✅ S3 bucket with event notifications using CDK S3 constructs (cross-region replication removed)
3. ✅ Lambda function with comprehensive data processing capabilities using CDK Lambda constructs
4. ✅ DynamoDB table with Global Tables for multi-region support using CDK DynamoDB constructs
5. ✅ IAM roles and policies following least privilege principles using CDK IAM constructs
6. ✅ Event-driven architecture with S3 to Lambda to DynamoDB flow using CDK event constructs
7. ✅ Multi-region deployment with failover capabilities using CDK multi-stack approach
8. ✅ Comprehensive error handling and dead letter queue implementation using CDK SQS constructs
9. ✅ CloudWatch monitoring and alerting across regions using CDK CloudWatch constructs
10. ✅ Security best practices including encryption and network isolation using CDK security constructs
11. ✅ Consistent naming convention across all resources
12. ✅ Deployable infrastructure with `cdk deploy` command

## Additional Considerations

**Performance Optimization:**

- Configure appropriate Lambda memory and timeout settings
- Implement DynamoDB auto-scaling for variable workloads
- Use S3 Transfer Acceleration for global data uploads

**Cost Optimization:**

- Implement S3 lifecycle policies for data archival
- Configure DynamoDB on-demand billing for unpredictable workloads
- Set up CloudWatch cost anomaly detection

**Compliance and Governance:**

- Implement resource tagging for cost allocation
- Configure AWS CloudTrail for audit logging

## Important Notes
