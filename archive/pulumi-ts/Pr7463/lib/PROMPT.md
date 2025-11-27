# Application Deployment - Advanced Observability Stack

> **CRITICAL REQUIREMENT: This task MUST be implemented using Pulumi with TypeScript**
>
> Platform: **Pulumi**
> Language: **TypeScript**
> Region: **us-east-1**

---

## Background
A financial services company needs centralized monitoring for their distributed microservices architecture. They require real-time alerting on custom business metrics and automated incident response workflows to meet strict SLA requirements.

## Problem Statement
Create a Pulumi TypeScript program to deploy an advanced observability stack with custom metric aggregation and intelligent alerting. MANDATORY REQUIREMENTS (Must complete): 1. Deploy CloudWatch custom namespace 'FinanceMetrics' with composite alarms for P99 latency > 500ms AND error rate > 5% (CORE: CloudWatch) 2. Create Lambda function that aggregates metrics from 10+ microservices every 60 seconds, calculates rolling averages, and publishes to CloudWatch (CORE: Lambda) 3. Configure SNS topic with email and SMS subscriptions for critical alerts (CORE: SNS) 4. Implement CloudWatch anomaly detector on transaction volume metrics with 2-week training period 5. Set up metric math expressions to calculate business KPIs (conversion rate = successful_transactions / total_requests) 6. Create CloudWatch dashboard with 15-minute refresh showing real-time metrics across 3 regions 7. Configure Lambda dead letter queue for failed metric processing 8. Implement metric filters on Lambda logs to extract custom error patterns 9. Set up cross-account metric sharing with IAM roles for central monitoring account 10. Configure all resources with cost allocation tags: Environment, Team, CostCenter 11. Enable CloudWatch Container Insights for EC2 Auto Scaling groups 12. Create custom CloudWatch Logs Insights queries stored as saved searches OPTIONAL ENHANCEMENTS (If time permits): • Add X-Ray tracing integration for distributed request tracking (OPTIONAL: X-Ray) - provides end-to-end visibility • Implement EventBridge rules for automated remediation workflows (OPTIONAL: EventBridge) - enables self-healing • Add Systems Manager OpsCenter integration for incident management (OPTIONAL: Systems Manager) - centralizes operations Expected output: Pulumi TypeScript program that creates a production-ready observability platform with intelligent alerting, custom metrics aggregation, and multi-region visibility. The stack should enable proactive monitoring of business KPIs and automated incident detection.

## Constraints and Requirements
- Lambda functions must use arm64 architecture for cost optimization
- All CloudWatch alarms must have treat_missing_data set to 'breaching' for safety
- SNS topics must use server-side encryption with AWS managed keys
- Dashboard widgets must use metric math to show week-over-week comparisons
- Cross-account IAM roles must explicitly deny resource deletion permissions

## Environment Setup
Multi-region AWS deployment across us-east-1, eu-west-1, and ap-southeast-1 for global observability coverage. Core services include CloudWatch for metrics and logs, Lambda for custom metric processing, SNS for multi-channel alerting, and CloudWatch Anomaly Detector for ML-based monitoring. Requires Pulumi 3.x with TypeScript, Node.js 18+, and AWS CLI configured with cross-account permissions. Infrastructure spans multiple VPCs with VPC peering for centralized monitoring. Each region maintains local metric storage with cross-region replication to central monitoring account in us-east-1.

---

## Implementation Guidelines

### Platform Requirements
- Use Pulumi as the IaC framework
- All code must be written in TypeScript
- Follow Pulumi best practices for resource organization
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

## Target Region
All resources should be deployed to: **us-east-1**

## Success Criteria
- Infrastructure deploys successfully
- All security and compliance constraints are met
- Tests pass successfully
- Resources are properly tagged and named with environmentSuffix
- Infrastructure can be cleanly destroyed
