# Serverless Fraud Detection Pipeline

Hey team,

We've got an urgent request from our financial services client who needs a real-time fraud detection system built out. They're currently processing payment transactions from multiple sources manually, and it's costing them both time and money in missed fraud cases. The compliance team is overwhelmed with false positives and they need a smarter system that can catch suspicious activities within seconds.

I've been asked to build this using **CloudFormation with JSON** to keep everything standardized with their existing infrastructure. The business wants a fully serverless architecture that can scale automatically during peak transaction periods without breaking the bank. They've had issues with over-provisioning in the past, so we need to be really careful about cost controls.

The current manual process is a nightmare. Transactions come in from multiple payment gateways, someone manually reviews them against a checklist, then they escalate anything suspicious to the compliance team. It can take hours, and by then fraudulent transactions have already cleared. They want machine learning-based risk scoring, automated workflows, and instant alerts to their compliance officers. The CTO specifically mentioned they want this to be event-driven and fully automated.

## What we need to build

Create a serverless fraud detection pipeline using **CloudFormation with JSON** for a financial services company. The system must process payment transactions in real-time, apply ML-based risk scoring, and alert compliance teams about suspicious activities.

### Core Requirements

1. **Transaction Processing Functions**
   - Deploy a Lambda function with Python 3.11 runtime and 1GB memory allocation
   - Function must process incoming transactions and calculate risk scores
   - Deploy a second Lambda function for post-processing completed transactions
   - Move completed transactions to S3 archival storage

2. **Data Storage Layer**
   - Create a DynamoDB table with partition key 'transactionId' and sort key 'timestamp'
   - Table must store transaction records with point-in-time recovery
   - Enable encryption at rest using AWS managed keys
   - Configure an S3 bucket for archiving processed transactions
   - Enable intelligent tiering for cost optimization

3. **Workflow Orchestration**
   - Implement a Step Functions state machine for fraud detection workflow
   - Must include parallel processing branches for efficiency
   - Configure exponential backoff with maximum of 3 retries
   - State machine orchestrates the complete detection pipeline

4. **Event-Driven Architecture**
   - Set up EventBridge rules to trigger Step Functions execution
   - Rules must use content-based filtering to route only high-risk transactions
   - Trigger workflow when new transactions arrive from payment gateways

5. **Alerting and Notifications**
   - Create an SNS topic for alerting compliance teams
   - Send notifications for high-risk transactions requiring review
   - Integrate with existing compliance team communication channels

6. **Observability and Logging**
   - Configure CloudWatch Logs retention to 30 days for all Lambda functions
   - Enable X-Ray tracing on all Lambda functions for compliance auditing
   - Implement proper monitoring and troubleshooting capabilities

7. **Security and IAM**
   - Implement proper IAM roles with least-privilege policies for all services
   - Lambda execution roles with minimal permissions required
   - Step Functions role for service integrations
   - EventBridge role for triggering executions

8. **Stack Outputs**
   - Output the Step Functions ARN for integration testing
   - Output the S3 bucket name for archival access
   - Output the SNS topic ARN for subscription management

### Technical Requirements

- All infrastructure defined using **CloudFormation with JSON**
- Use **AWS Lambda** for transaction and post-processing functions
- Use **DynamoDB** for transaction storage with point-in-time recovery
- Use **Step Functions** for workflow orchestration
- Use **S3** for long-term archival with versioning and lifecycle policies
- Use **EventBridge** for event routing with content filtering
- Use **SNS** for compliance team alerting
- Use **IAM** for security roles and policies
- Use **CloudWatch Logs** for logging with 30-day retention
- Resource names must include **environmentSuffix** parameter for uniqueness
- Follow naming convention: resourceType-${EnvironmentSuffix}
- Deploy to **us-east-1** region

### Deployment Requirements (CRITICAL)

- Lambda functions must use reserved concurrency of exactly 100 to prevent cost overruns
- All Lambda functions must have X-Ray tracing enabled for compliance auditing
- DynamoDB tables must use point-in-time recovery and encryption at rest
- Step Functions state machines must implement exponential backoff with maximum 3 retries
- EventBridge rules must use content-based filtering for high-risk transaction routing
- S3 buckets must have versioning enabled and lifecycle policies for Glacier transition after 90 days
- All resources must be destroyable with no Retain policies (RemovalPolicy: Delete or DeletionPolicy: Delete)
- CloudWatch Logs retention must be set to 30 days exactly
- Stack must support blue-green deployments with minimal downtime
- Production deployment for default VPC using AWS managed services only

### Constraints

- Lambda reserved concurrency must be exactly 100 per function
- DynamoDB encryption must use AWS managed keys (not customer managed)
- X-Ray tracing is mandatory on all Lambda functions for audit compliance
- Step Functions retry logic must use exponential backoff pattern
- EventBridge content-based filtering is required for routing logic
- S3 lifecycle policy must transition to Glacier after exactly 90 days
- CloudWatch Logs retention must be 30 days (not more, not less)
- All resources must use least-privilege IAM policies
- No hardcoded credentials or secrets in template
- Template must be valid JSON with proper CloudFormation syntax

## Success Criteria

- Functionality: Complete fraud detection pipeline processing transactions end-to-end
- Performance: Sub-second transaction processing with parallel workflow branches
- Reliability: Automatic retries with exponential backoff for transient failures
- Security: Least-privilege IAM roles with no over-permissioned policies
- Cost Control: Reserved concurrency prevents runaway costs during traffic spikes
- Compliance: X-Ray tracing enabled for full audit trail of transaction processing
- Archival: Automated lifecycle management transitions old data to cost-effective storage
- Resource Naming: All resources include environmentSuffix for multi-environment deployments
- Code Quality: Valid CloudFormation JSON, well-structured, properly documented
- Deployability: Stack can be deployed and destroyed cleanly without manual intervention

## What to deliver

- Complete CloudFormation JSON template implementing all requirements
- Lambda function for transaction processing (Python 3.11 runtime)
- Lambda function for post-processing and S3 archival
- DynamoDB table with proper keys and configuration
- Step Functions state machine with parallel branches and retry logic
- S3 bucket with versioning, intelligent tiering, and lifecycle policies
- EventBridge rules with content-based filtering
- SNS topic for compliance team alerts
- IAM roles with least-privilege policies for all services
- CloudWatch Logs configuration with 30-day retention
- Stack outputs for Step Functions ARN, S3 bucket name, and SNS topic ARN
- EnvironmentSuffix parameter for resource naming
- Proper template documentation and parameter descriptions