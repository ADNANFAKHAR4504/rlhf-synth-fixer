# Serverless Fraud Detection Pipeline

Hey team,

We've been asked to build out a real-time fraud detection system for one of our financial services clients. They're processing payment transactions from multiple sources and need to identify suspicious activities within seconds to protect their customers. The business wants this built as a serverless architecture to keep operational costs predictable and scaling automatic.

I've been tasked with creating this infrastructure using **CloudFormation with JSON** for the deployment. The system needs to handle transaction processing, risk scoring, and alerting all in real-time. The compliance team has some specific requirements around auditing and data retention that we need to bake into the infrastructure from the start.

The architecture they're looking for is pretty comprehensive. We need Lambda functions for the actual fraud detection logic, Step Functions to orchestrate the workflow, DynamoDB for fast transaction lookups, S3 for long-term archival, EventBridge for event routing, and SNS to alert the compliance team when high-risk transactions are detected. Everything needs to be connected properly with the right IAM permissions and monitoring in place.

## What we need to build

Create a serverless fraud detection pipeline using **CloudFormation with JSON** that processes financial transactions in real-time and identifies fraudulent activities.

### Core Requirements

1. **Transaction Processing Lambda**
   - Deploy Lambda function with Python 3.11 runtime
   - Configure 1GB memory allocation
   - Implement transaction processing and risk score calculation
   - Use reserved concurrency of exactly 100 to prevent cost overruns
   - Enable X-Ray tracing for compliance auditing

2. **Transaction Data Store**
   - Create DynamoDB table with partition key 'transactionId' and sort key 'timestamp'
   - Enable point-in-time recovery for data protection
   - Configure encryption at rest using AWS managed keys
   - Store transaction records with fast lookup capability

3. **Workflow Orchestration**
   - Implement Step Functions state machine for fraud detection workflow
   - Configure parallel processing branches for efficiency
   - Implement exponential backoff retry logic with maximum 3 retries
   - Orchestrate the complete transaction processing pipeline

4. **Transaction Archive Storage**
   - Configure S3 bucket for archiving processed transactions
   - Enable versioning for audit trail
   - Implement intelligent tiering for cost optimization
   - Add lifecycle policy to transition objects to Glacier after 90 days

5. **Event Routing**
   - Set up EventBridge rules to trigger Step Functions execution
   - Configure content-based filtering to route only high-risk transactions
   - Enable automatic workflow initiation when new transactions arrive

6. **Compliance Alerting**
   - Create SNS topic for compliance team notifications
   - Configure alerts for high-risk transactions
   - Enable immediate notification of suspicious activities

7. **Post-Processing Function**
   - Deploy second Lambda function for transaction archival
   - Implement logic to move completed transactions to S3
   - Use reserved concurrency of exactly 100
   - Enable X-Ray tracing for auditing

8. **Security and Access Control**
   - Implement IAM roles with least-privilege policies for all services
   - Grant Lambda functions only necessary permissions
   - Configure Step Functions with appropriate execution role
   - Ensure EventBridge has permissions to invoke Step Functions
   - Set up proper cross-service access

9. **Logging and Monitoring**
   - Configure CloudWatch Logs for all Lambda functions
   - Set retention period to 30 days for cost optimization
   - Enable comprehensive logging for troubleshooting

10. **Stack Outputs**
    - Export Step Functions state machine ARN
    - Export S3 bucket name for external integrations
    - Export SNS topic ARN for subscription management

### Technical Requirements

- All infrastructure defined using **CloudFormation with JSON**
- Use **Lambda** for transaction processing and post-processing functions
- Use **DynamoDB** for fast transaction data storage and retrieval
- Use **Step Functions** for workflow orchestration with retry logic
- Use **S3** for long-term transaction archival with lifecycle policies
- Use **EventBridge** for event-driven architecture and workflow triggers
- Use **SNS** for compliance team alerting
- Use **CloudWatch Logs** for Lambda function logging
- Use **IAM** for security and access control
- Resource names must include **EnvironmentSuffix** parameter for uniqueness
- Follow naming convention: resourceType-environment-suffix
- Deploy to **us-east-1** region

### Deployment Requirements (CRITICAL)

- All resources must include EnvironmentSuffix parameter in their names for multi-environment deployments
- All resources must be fully destroyable - no RemovalPolicy Retain policies allowed
- No DeletionProtection on any resources
- Stack must support complete tear-down for testing environments
- Lambda functions must have reserved concurrency set to exactly 100
- DynamoDB must have point-in-time recovery enabled
- All Lambda functions must have X-Ray tracing enabled
- S3 buckets must have versioning and lifecycle policies configured
- EventBridge rules must use content-based filtering
- Step Functions must implement exponential backoff with max 3 retries

### Constraints

- Lambda functions must use Python 3.11 runtime with 1GB memory
- Lambda reserved concurrency must be exactly 100 to prevent cost overruns
- DynamoDB tables must use point-in-time recovery and AWS managed encryption
- All Lambda functions must have tracing enabled for compliance auditing
- Step Functions must implement exponential backoff with maximum 3 retries
- EventBridge rules must use content-based filtering for high-risk transactions only
- S3 buckets must have versioning enabled and lifecycle policies for Glacier transition after 90 days
- CloudWatch Logs retention must be set to 30 days for all Lambda functions
- All IAM policies must follow least-privilege principle
- All resources must be destroyable for testing environments

## Success Criteria

- Functionality: Complete fraud detection pipeline that processes transactions, calculates risk scores, orchestrates workflows, and alerts compliance team
- Performance: Lambda functions with appropriate memory and concurrency settings, parallel processing in Step Functions
- Reliability: Point-in-time recovery for DynamoDB, versioning for S3, retry logic in Step Functions with exponential backoff
- Security: Least-privilege IAM roles, encryption at rest for DynamoDB, proper access controls across all services
- Compliance: X-Ray tracing enabled, 30-day log retention, content-based filtering for high-risk transactions
- Resource Naming: All resources include EnvironmentSuffix parameter for multi-environment support
- Code Quality: Valid CloudFormation JSON template, well-structured, properly documented

## What to deliver

- Complete CloudFormation JSON template implementation
- Lambda function for transaction processing with Python 3.11 runtime
- Lambda function for post-processing and S3 archival
- DynamoDB table with proper keys and configuration
- Step Functions state machine with parallel branches and retry logic
- S3 bucket with versioning and lifecycle policies
- EventBridge rules with content-based filtering
- SNS topic for compliance alerting
- IAM roles and policies with least-privilege access
- CloudWatch Logs configuration with 30-day retention
- Stack outputs for Step Functions ARN, S3 bucket name, and SNS topic ARN
- Documentation for deployment and usage
