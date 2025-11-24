# Create a Terraform configuration to deploy a serverless fraud detection system.\n\nMANDATORY REQUIREMENTS (Must complete):\n1. Deploy Lambda function using container image for webhook processing with 3GB memory (CORE: Lambda)\n2. Create DynamoDB table 'fraud_patterns' with partition key 'pattern_id' and sort key 'timestamp' (CORE: DynamoDB)\n3. Configure S3 bucket for audit trail storage with versioning and encryption enabled (CORE: S3)\n4. Set up API Gateway REST API with /webhook POST endpoint integrated with Lambda\n5. Create CloudWatch Logs group with KMS encryption for Lambda logs\n6. Implement least-privilege IAM roles with explicit deny for out-of-scope resources\n7. Configure Lambda dead letter queue using SQS for failed processing\n8. Set up EventBridge rule to trigger Lambda every 5 minutes for batch processing\n9. Create ECR repository for Lambda container images with lifecycle policy\n10. Configure all resources with consistent tagging: Environment=Production, Service=FraudDetection\n\nOPTIONAL ENHANCEMENTS (If time permits):\nÂ Add Step Functions state machine for complex fraud workflows (OPTIONAL: Step Functions) - enables orchestration of multi-step analysis\nÂ Implement SNS topic for high-severity alerts (OPTIONAL: SNS) - provides real-time notifications to security team\nÂ Add X-Ray tracing across all Lambda functions (OPTIONAL: X-Ray) - improves debugging and performance analysis\n\nExpected output: Complete Terraform configuration that deploys a production-ready serverless fraud detection system with all mandatory security controls, audit logging, and high availability features properly configured.

> **⚠️ CRITICAL REQUIREMENT: This task MUST be implemented using terraform with hcl**
> 
> Platform: **terraform**  
> Language: **hcl**  
> Region: **us-east-1**
>
> **Do not substitute or change the platform or language.** All infrastructure code must be written using the specified platform and language combination.

---

Create a Terraform configuration to deploy a serverless fraud detection system.

MANDATORY REQUIREMENTS (Must complete):
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

OPTIONAL ENHANCEMENTS (If time permits):
Â Add Step Functions state machine for complex fraud workflows (OPTIONAL: Step Functions) - enables orchestration of multi-step analysis
Â Implement SNS topic for high-severity alerts (OPTIONAL: SNS) - provides real-time notifications to security team
Â Add X-Ray tracing across all Lambda functions (OPTIONAL: X-Ray) - improves debugging and performance analysis

Expected output: Complete Terraform configuration that deploys a production-ready serverless fraud detection system with all mandatory security controls, audit logging, and high availability features properly configured.

---

## Additional Context

### Background
A financial services startup needs a serverless event processing system to handle real-time fraud detection alerts from multiple payment processors. The system must process webhook events, analyze patterns, and trigger automated responses while maintaining strict compliance and audit requirements.

### Constraints and Requirements
- {\

### Environment Setup
Production fraud detection infrastructure deployed in us-east-1 using Lambda for event processing, DynamoDB for pattern storage, S3 for audit logs, and API Gateway for webhook ingestion. Requires Terraform 1.5+, AWS CLI configured with appropriate credentials. Infrastructure spans three availability zones with VPC endpoints for AWS services to avoid internet egress. Customer-managed KMS keys for encryption at rest. Deployment uses container-based Lambda functions with ECR for image storage.

## Project-Specific Conventions

### Resource Naming
- All resources must use the `environmentSuffix` variable in their names to support multiple PR environments
- Example: `myresource-${environmentSuffix}` or tagging with EnvironmentSuffix

### Testing Integration  
- Integration tests should load stack outputs from `cfn-outputs/flat-outputs.json`
- Tests should validate actual deployed resources

### Resource Management
- Infrastructure should be fully destroyable for CI/CD workflows
- **Exception**: Secrets should be fetched from existing AWS Secrets Manager entries, not created by the stack
- Avoid using DeletionPolicy: Retain unless absolutely necessary

### Security Baseline
- Implement encryption at rest and in transit
- Follow principle of least privilege for IAM roles
- Use AWS Secrets Manager for credential management where applicable
- Enable appropriate logging and monitoring

## Deployment Requirements (CRITICAL)

### Resource Naming
- **MANDATORY**: All named resources MUST include `environmentSuffix` in their names
- Pattern: `{resource-name}-${environmentSuffix}` or `{resource-name}-${props.environmentSuffix}`
- Examples:
  - S3 Bucket: `my-bucket-${environmentSuffix}`
  - Lambda Function: `my-function-${environmentSuffix}`
  - DynamoDB Table: `my-table-${environmentSuffix}`
- **Validation**: Every resource with a `name`, `bucketName`, `functionName`, `tableName`, `roleName`, `queueName`, `topicName`, `streamName`, `clusterName`, or `dbInstanceIdentifier` property MUST include environmentSuffix

### Resource Lifecycle
- **MANDATORY**: All resources MUST be destroyable after testing
- **FORBIDDEN**: 
  - `RemovalPolicy.RETAIN` (CDK/CDKTF) → Use `RemovalPolicy.DESTROY` instead
  - `DeletionPolicy: Retain` (CloudFormation) → Remove or use `Delete`
  - `deletionProtection: true` (RDS, DynamoDB) → Use `deletionProtection: false`
  - `skip_final_snapshot: false` (RDS) → Use `skip_final_snapshot: true`
- **Rationale**: CI/CD needs to clean up resources after testing

### AWS Service-Specific Requirements

#### GuardDuty
- **CRITICAL**: Do NOT create GuardDuty detectors in code
- GuardDuty allows only ONE detector per AWS account/region
- If task requires GuardDuty, add comment: "GuardDuty should be enabled manually at account level"

#### AWS Config
- **CRITICAL**: If creating AWS Config roles, use correct managed policy:
  - ✅ CORRECT: `arn:aws:iam::aws:policy/service-role/AWS_ConfigRole`
  - ❌ WRONG: `arn:aws:iam::aws:policy/service-role/ConfigRole`
  - ❌ WRONG: `arn:aws:iam::aws:policy/AWS_ConfigRole`
- **Alternative**: Use service-linked role `AWSServiceRoleForConfig` (auto-created)

#### Lambda Functions
- **Node.js 18.x+**: Do NOT use `require('aws-sdk')` - AWS SDK v2 not available
  - ✅ Use AWS SDK v3: `import { S3Client } from '@aws-sdk/client-s3'`
  - ✅ Or extract data from event object directly
- **Reserved Concurrency**: Avoid setting `reservedConcurrentExecutions` unless required
  - If required, use low values (1-5) to avoid account limit issues

#### CloudWatch Synthetics
- **CRITICAL**: Use current runtime version
  - ✅ CORRECT: `synthetics.Runtime.SYNTHETICS_NODEJS_PUPPETEER_7_0`
  - ❌ WRONG: `SYNTHETICS_NODEJS_PUPPETEER_5_1` (deprecated)

#### RDS Databases
- **Prefer**: Aurora Serverless v2 (faster provisioning, auto-scaling)
- **If Multi-AZ required**: Set `backup_retention_period = 1` (minimum) and `skip_final_snapshot = true`
- **Note**: Multi-AZ RDS takes 20-30 minutes to provision

#### NAT Gateways
- **Cost Warning**: NAT Gateways cost ~$32/month each
- **Prefer**: VPC Endpoints for S3, DynamoDB (free)
- **If NAT required**: Create only 1 NAT Gateway (not per AZ) for synthetic tasks

### Hardcoded Values (FORBIDDEN)
- **DO NOT** hardcode:
  - Environment names: `prod-`, `dev-`, `stage-`, `production`, `development`, `staging`
  - Account IDs: `123456789012`, `arn:aws:.*:.*:account`
  - Regions: Hardcoded `us-east-1` or `us-west-2` in resource names (use variables)
- **USE**: Environment variables, context values, or parameters instead

### Cross-Resource References
- Ensure all resource references use proper ARNs or resource objects
- Verify dependencies are explicit (use `DependsOn` in CloudFormation, `dependsOn` in CDK)
- Test that referenced resources exist before use

## Code Examples (Reference)

### Correct Resource Naming (CDK TypeScript)
```typescript
const bucket = new s3.Bucket(this, 'DataBucket', {
  bucketName: `data-bucket-${environmentSuffix}`,  // ✅ CORRECT
  // ...
});

// ❌ WRONG:
// bucketName: 'data-bucket-prod'  // Hardcoded, will fail
```

### Correct Removal Policy (CDK TypeScript)
```typescript
const bucket = new s3.Bucket(this, 'DataBucket', {
  removalPolicy: RemovalPolicy.DESTROY,  // ✅ CORRECT
  // ...
});

// ❌ WRONG:
// removalPolicy: RemovalPolicy.RETAIN  // Will block cleanup
```

### Correct AWS Config IAM Role (CDK TypeScript)
```typescript
const configRole = new iam.Role(this, 'ConfigRole', {
  assumedBy: new iam.ServicePrincipal('config.amazonaws.com'),
  managedPolicies: [
    iam.ManagedPolicy.fromAwsManagedPolicyName(
      'service-role/AWS_ConfigRole'  // ✅ CORRECT
    )
  ]
});

// ❌ WRONG:
// 'service-role/ConfigRole'  // Policy doesn't exist
// 'AWS_ConfigRole'  // Missing service-role/ prefix
```

## Target Region
All resources should be deployed to: **us-east-1**
