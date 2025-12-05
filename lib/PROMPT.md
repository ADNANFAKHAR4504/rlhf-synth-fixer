# Infrastructure QA and Management

> **CRITICAL REQUIREMENT: This task MUST be implemented using tf with hcl**
>
> Platform: **tf**
> Language: **hcl**
> Region: **us-east-1**
>
> **Do not substitute or change the platform or language.** All infrastructure code must be written using the specified platform and language combination.

---

## Background
A fintech startup needs centralized monitoring for their payment processing infrastructure. They require real-time alerts, custom metrics tracking, and dashboard visualization to ensure transaction reliability and performance SLA compliance.

## Problem Statement
Create a Terraform configuration to implement monitoring infrastructure for payment processing services. The configuration must: 1. Create CloudWatch Log Groups for 'payment-api', 'transaction-processor', and 'fraud-detector' services with KMS encryption. 2. Define metric filters to extract error rates, response times, and transaction amounts from JSON logs. 3. Set up CloudWatch alarms for API error rate > 1%, response time > 500ms, and failed transactions > 5 per minute. 4. Create a composite alarm that triggers when 2 or more service alarms are in ALARM state. 5. Configure an SNS topic with email subscription for alert notifications. 6. Build a CloudWatch dashboard with widgets showing service health, transaction volume trends, and error distribution. 7. Implement custom metrics for business KPIs like 'successful_payments_per_minute' and 'average_transaction_value'. 8. Add alarm actions to automatically increase Auto Scaling group capacity when high load is detected. 9. Create a Lambda function metric filter to track cold starts and duration metrics. 10. Set up cross-service log insights queries as saved searches for incident investigation. Expected output: A complete Terraform configuration that creates all monitoring resources with proper dependencies, uses data sources for existing resources like KMS keys, and outputs dashboard URL and SNS topic ARN for integration with external systems.

## Constraints and Requirements
- All CloudWatch alarms must use SNS topics for notification routing
- Custom metrics must use specific namespaces following pattern 'FinTech/Service/Environment'
- Dashboard widgets must be arranged in a 3-column layout with specific ordering
- Log groups must have 7-day retention and use KMS encryption
- Metric filters must extract numerical values from JSON-formatted logs
- Composite alarms must combine at least 3 individual alarm states
- All resources must use consistent tagging with Cost Center and Environment tags
- Alarm actions must include both OK and ALARM state transitions
- Dashboard must use metric math expressions for calculated values

## Environment Setup
Production monitoring infrastructure deployed in us-east-1 for a payment processing system using EC2, RDS PostgreSQL, and Lambda functions. Requires Terraform 1.5+ with AWS provider 5.x. VPC spans 3 availability zones with application load balancers. CloudWatch Logs aggregates from 15+ microservices. SNS topics route to PagerDuty and Slack. KMS key for log encryption already exists with alias 'alias/cloudwatch-logs'.

---

## Implementation Guidelines

### Platform Requirements
- Use tf as the IaC framework
- All code must be written in hcl
- Follow tf best practices for resource organization
- Ensure all resources use the `environmentSuffix` variable for naming

### Security and Compliance
- Implement encryption at rest for all data stores using AWS KMS
- Enable encryption in transit using TLS/SSL
- Follow the principle of least privilege for IAM roles and policies
- Enable logging and monitoring using CloudWatch
- Tag all resources appropriately

### Testing
- Write unit tests with good coverage
- Integration tests must validate end-to-end workflows using deployed resources
- Load test outputs from `cfn-outputs/flat-outputs.json`

### Resource Management
- Infrastructure should be fully destroyable for CI/CD workflows
- **Important**: Secrets should be fetched from existing Secrets Manager entries, not created
- Avoid DeletionPolicy: Retain unless required

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

## Target Region
Deploy all resources to: **us-east-1**

## Success Criteria
- Infrastructure deploys successfully
- All security and compliance constraints are met
- Tests pass successfully
- Resources are properly tagged and named with environmentSuffix
- Infrastructure can be cleanly destroyed
