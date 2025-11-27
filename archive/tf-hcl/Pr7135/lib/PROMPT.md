# Infrastructure as Code Task

## Platform and Language
**CRITICAL CONSTRAINT**: This infrastructure MUST be implemented using **Terraform with HCL** (from metadata.json). This is a non-negotiable requirement.

## Task Description

A financial services startup needs a serverless event processing system to handle real-time fraud detection alerts from multiple payment processors. The system must process webhook events, analyze patterns, and trigger automated responses while maintaining strict compliance and audit requirements.

## Requirements

### MANDATORY REQUIREMENTS (Must complete):

1. Deploy Lambda function using container image for webhook processing with 3GB memory (CORE: Lambda)
2. Create DynamoDB table 'fraud_patterns' with partition key 'pattern_id' and sort key 'timestamp' (CORE: DynamoDB)
3. Configure S3 bucket for audit trail storage with versioning and encryption enabled (CORE: S3)
4. Set up API Gateway REST API with /webhook POST endpoint integrated with Lambda
5. Create CloudWatch Logs group with KMS encryption for Lambda logs
6. Implement least-privilege IAM roles with explicit deny for out-of-scope resources
7. Configure Lambda dead letter queue using SQS for failed processing
8. Set up EventBridge rule to trigger Lambda every 5 minutes for batch processing
9. Create ECR repository for Lambda container images with lifecycle policy
10. Configure all resources with consistent tagging: Environment=Production, Service=FraudDetection

### OPTIONAL ENHANCEMENTS (If time permits):

- Add Step Functions state machine for complex fraud workflows (OPTIONAL: Step Functions) - enables orchestration of multi-step analysis
- Implement SNS topic for high-severity alerts (OPTIONAL: SNS) - provides real-time notifications to security team
- Add X-Ray tracing across all Lambda functions (OPTIONAL: X-Ray) - improves debugging and performance analysis

## Technical Constraints

- **Platform**: Terraform
- **Language**: HCL
- **Complexity**: expert
- **Region**: us-east-1 (default)
- **Environment Suffix**: All resource names MUST include `var.environment_suffix` to prevent conflicts across parallel deployments

## Expected Output

Complete Terraform configuration that deploys a production-ready serverless fraud detection system with all mandatory security controls, audit logging, and high availability features properly configured.

## Critical Implementation Notes

1. **Resource Naming**: ALL named resources must include `${var.environment_suffix}` suffix
2. **Destroyability**: No retention policies that prevent stack deletion
3. **Security**:
   - S3 buckets must have SSE-S3 or SSE-KMS encryption
   - DynamoDB tables must have encryption at rest
   - CloudWatch Logs must use KMS encryption
   - IAM roles must follow least-privilege principle
4. **Compliance**:
   - All resources must be tagged consistently
   - Audit trail must be maintained in S3
   - Point-in-time recovery for DynamoDB
5. **Lambda Configuration**:
   - Use container images (ECR)
   - 3GB memory allocation
   - Proper dead letter queue (SQS)
   - Environment variables for configuration
6. **API Gateway**:
   - REST API (not HTTP API)
   - POST /webhook endpoint
   - Lambda proxy integration
7. **EventBridge**:
   - Schedule expression for 5-minute intervals
   - Target Lambda function for batch processing

## Deployment Region

Default region: us-east-1 (can be overridden via `lib/AWS_REGION` file or terraform variables)
