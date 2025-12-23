# Security, Compliance, and Governance

> **️ CRITICAL REQUIREMENT: This task MUST be implemented using cdktf with py**
>
> Platform: **cdktf**
> Language: **py**
> Region: **us-east-1**
>
> **Do not substitute or change the platform or language.** All infrastructure code must be written using the specified platform and language combination.

---

## Background
A fintech company operates payment processing systems across three regions (us-east-1, eu-west-1, ap-southeast-1) with strict data residency requirements. They need infrastructure that maintains consistency across all regions while allowing region-specific configurations for compliance. The system must handle 10,000 transactions per second globally with automatic failover capabilities.

## Problem Statement
Create a CDKTF Python program to deploy identical payment processing infrastructure across three AWS regions with automated cross-region data synchronization. The configuration must:

1. Deploy DynamoDB Global Tables with automatic replication across all three regions
2. Create Lambda functions in each region for transaction processing with 3GB memory and 15-minute timeout
3. Implement Step Functions state machines for payment workflow orchestration with error handling
4. Configure EventBridge rules to route payment events between regions for failover scenarios
5. Set up region-specific KMS keys with policies allowing cross-region access for replication
6. Create SNS topics in each region for alerting with cross-region subscriptions
7. Deploy API Gateway REST APIs with custom domain names using Route 53 latency routing
8. Implement CloudWatch dashboards that aggregate metrics from all regions
9. Configure DynamoDB streams to trigger Lambda functions for change data capture
10. Create S3 buckets with cross-region replication for storing payment receipts
11. Set up CloudWatch alarms for monitoring transaction failures above 0.1% threshold
12. Ensure all IAM roles follow least-privilege principle with no wildcard actions

Expected output: A CDKTF Python application that deploys complete payment infrastructure across three regions with a single synthesis command, maintaining consistency while allowing region-specific overrides through configuration.

## Constraints and Requirements
- All DynamoDB tables must use on-demand billing mode with point-in-time recovery enabled
- Lambda functions must have reserved concurrent executions set to prevent throttling
- Each region must have its own KMS key for encryption with automatic rotation enabled
- Cross-region replication must use AWS-managed connections, not VPC peering
- All resources must be tagged with Environment, Region, and CostCenter tags

## Environment Setup
Multi-region deployment across us-east-1, eu-west-1, and ap-southeast-1 for payment processing infrastructure. Uses DynamoDB Global Tables for data replication, Lambda functions for transaction processing, and Step Functions for workflow orchestration. Each region has isolated VPCs with private subnets. Requires Python 3.9+, CDKTF 0.19+, and AWS CLI configured with appropriate credentials. Infrastructure includes region-specific KMS keys for encryption and EventBridge for cross-region event routing.

---

## Implementation Guidelines

### Platform Requirements
- Use cdktf as the IaC framework
- All code must be written in py
- Follow cdktf best practices for resource organization
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
  -  CORRECT: `arn:aws:iam::aws:policy/service-role/AWS_ConfigRole`
  -  WRONG: `arn:aws:iam::aws:policy/service-role/ConfigRole`
  -  WRONG: `arn:aws:iam::aws:policy/AWS_ConfigRole`
- **Alternative**: Use service-linked role `AWSServiceRoleForConfig` (auto-created)

#### Lambda Functions
- **Node.js 18.x+**: Do NOT use `require('aws-sdk')` - AWS SDK v2 not available
  -  Use AWS SDK v3: `import { S3Client } from '@aws-sdk/client-s3'`
  -  Or extract data from event object directly
- **Reserved Concurrency**: Avoid setting `reservedConcurrentExecutions` unless required
  - If required, use low values (1-5) to avoid account limit issues

#### CloudWatch Synthetics
- **CRITICAL**: Use current runtime version
  -  CORRECT: `synthetics.Runtime.SYNTHETICS_NODEJS_PUPPETEER_7_0`
  -  WRONG: `SYNTHETICS_NODEJS_PUPPETEER_5_1` (deprecated)

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

## Multi-Region Considerations

### DynamoDB Global Tables
- Create replica tables in all three regions (us-east-1, eu-west-1, ap-southeast-1)
- Enable streams on primary table for change data capture
- Use on-demand billing mode for automatic scaling
- Enable point-in-time recovery for compliance

### Lambda Cross-Region Deployment
- Deploy identical Lambda functions in each region
- Use 3GB memory and 15-minute timeout as specified
- Set reserved concurrent executions (use low values like 2-5)
- Package Lambda code as zip files

### KMS Key Cross-Region Access
- Create separate KMS keys in each region
- Configure key policies to allow cross-region access for replication services
- Enable automatic key rotation

### EventBridge Cross-Region Routing
- Create event buses in each region
- Configure rules to route events between regions for failover
- Use event patterns to filter payment events

### S3 Cross-Region Replication
- Create buckets in each region with versioning enabled
- Configure replication rules between regions
- Use KMS encryption with cross-region keys

## Target Region
Primary region: **us-east-1**
Additional regions: **eu-west-1**, **ap-southeast-1**

## Success Criteria
- Infrastructure deploys successfully across all three regions
- All security and compliance constraints are met
- Tests pass successfully
- Resources are properly tagged and named with environmentSuffix
- Infrastructure can be cleanly destroyed
- DynamoDB Global Tables successfully replicate data
- Cross-region Lambda invocations work correctly
- EventBridge routes events between regions
