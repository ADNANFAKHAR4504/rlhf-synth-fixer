# Application Deployment

> **CRITICAL REQUIREMENT: This task MUST be implemented using cdktf with py**
> 
> Platform: **cdktf**  
> Language: **py**  
> Region: **us-east-1**
>
> **Do not substitute or change the platform or language.** All infrastructure code must be written using the specified platform and language combination.

---

Create a CDKTF Python program to deploy a serverless webhook processing system. The configuration must: 1. Create an API Gateway REST API with /webhook endpoint accepting POST requests. 2. Deploy a Lambda function using container image with 1024MB memory to validate incoming webhooks. 3. Set up DynamoDB table 'transactions' with partition key 'transaction_id' and sort key 'timestamp'. 4. Create Step Functions EXPRESS workflow with parallel states for fraud detection and notification processing. 5. Configure EventBridge custom event bus 'payment-events' with rules routing to different targets based on transaction amount. 6. Deploy Lambda function for fraud detection using machine learning inference (mock implementation). 7. Set up SNS topic 'transaction-alerts' with email and SMS subscriptions. 8. Create S3 bucket with lifecycle policies for storing transaction audit logs. 9. Implement Lambda function to archive processed transactions to S3 after 24 hours. 10. Configure CloudWatch dashboard displaying transaction metrics and Lambda performance. Expected output: CDKTF Python application that synthesizes CloudFormation templates for a complete serverless webhook processing pipeline with monitoring and audit capabilities.

---

## Additional Context

### Background
A fintech startup needs a serverless event processing system to handle real-time transaction notifications from multiple payment providers. The system must process webhook events, validate transaction data, and trigger downstream workflows based on transaction types while maintaining audit trails for compliance.

### Constraints and Requirements
- [Lambda functions must use ARM-based Graviton2 processors for cost optimization, DynamoDB tables must use point-in-time recovery with 35-day retention, All Lambda functions must have tracing enabled with custom segments, Step Functions state machines must use EXPRESS workflows for high-throughput processing, EventBridge rules must include dead-letter queues for failed invocations, Lambda functions must use container images stored in private ECR repositories]

### Environment Setup
Serverless infrastructure deployed in us-east-1 using Lambda functions with container runtime, DynamoDB for transaction storage, Step Functions EXPRESS workflows for orchestration, and EventBridge for event routing. Requires Python 3.9+, CDKTF 0.19+, Docker for building container images, and AWS CLI configured with appropriate permissions. Architecture includes API Gateway REST endpoints, SNS topics for notifications, and S3 buckets for audit logs. All components deployed within a single AWS account with CloudWatch Logs retention set to 30 days.

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
  - CORRECT: `arn:aws:iam::aws:policy/service-role/AWS_ConfigRole`
  - WRONG: `arn:aws:iam::aws:policy/service-role/ConfigRole`
  - WRONG: `arn:aws:iam::aws:policy/AWS_ConfigRole`
- **Alternative**: Use service-linked role `AWSServiceRoleForConfig` (auto-created)

#### Lambda Functions
- **Node.js 18.x+**: Do NOT use `require('aws-sdk')` - AWS SDK v2 not available
  - Use AWS SDK v3: `import { S3Client } from '@aws-sdk/client-s3'`
  - Or extract data from event object directly
- **Reserved Concurrency**: Avoid setting `reservedConcurrentExecutions` unless required
  - If required, use low values (1-5) to avoid account limit issues

#### CloudWatch Synthetics
- **CRITICAL**: Use current runtime version
  - CORRECT: `synthetics.Runtime.SYNTHETICS_NODEJS_PUPPETEER_7_0`
  - WRONG: `SYNTHETICS_NODEJS_PUPPETEER_5_1` (deprecated)

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
  bucketName: `data-bucket-${environmentSuffix}`,  // CORRECT
  // ...
});

// WRONG:
// bucketName: 'data-bucket-prod'  // Hardcoded, will fail
```

### Correct Removal Policy (CDK TypeScript)
```typescript
const bucket = new s3.Bucket(this, 'DataBucket', {
  removalPolicy: RemovalPolicy.DESTROY,  // CORRECT
  // ...
});

// WRONG:
// removalPolicy: RemovalPolicy.RETAIN  // Will block cleanup
```

### Correct AWS Config IAM Role (CDK TypeScript)
```typescript
const configRole = new iam.Role(this, 'ConfigRole', {
  assumedBy: new iam.ServicePrincipal('config.amazonaws.com'),
  managedPolicies: [
    iam.ManagedPolicy.fromAwsManagedPolicyName(
      'service-role/AWS_ConfigRole'  // CORRECT
    )
  ]
});

// WRONG:
// 'service-role/ConfigRole'  // Policy doesn't exist
// 'AWS_ConfigRole'  // Missing service-role/ prefix
```

## Target Region
All resources should be deployed to: **us-east-1**
