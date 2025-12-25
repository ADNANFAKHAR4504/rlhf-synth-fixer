# Security, Compliance, and Governance

> CRITICAL REQUIREMENT: This task MUST be implemented using cfn with json
>
> Platform: cfn
> Language: json
> Region: us-east-1
>
> Do not substitute or change the platform or language. All infrastructure code must be written using the specified platform and language combination.

---

## Background
A financial services company has discovered configuration drift in their production environment after a security audit. They need to implement automated infrastructure compliance scanning to ensure their CloudFormation stacks remain compliant with corporate security policies and AWS best practices.

## Problem Statement
Create a CloudFormation template to deploy an automated infrastructure compliance analysis system that monitors CloudFormation stacks for drift and security violations. AWS Config will continuously scan stack configurations and send compliance events through EventBridge to trigger Lambda validation functions. Non-compliant resources will generate SNS notifications to the security team, with detailed reports stored in S3. The configuration must: 

1. Set up AWS Config with custom rules connected to CloudFormation stacks for monitoring drift and compliance violations, with Config sending findings to S3 for storage.
2. Deploy Lambda functions that receive EventBridge events from AWS Config and validate resource configurations against security policies stored in Parameter Store using Python 3.9 runtime with 256MB memory.
3. Create S3 bucket that receives compliance reports from AWS Config and Lambda functions, with versioning enabled and lifecycle rules to transition reports to Glacier after 30 days for cost optimization.
4. Configure EventBridge rules that listen for AWS Config compliance change events and route them to Lambda functions for validation.
5. Implement SNS topic that receives alerts from Lambda functions and distributes email notifications to security team for non-compliant resources.
6. Create CloudWatch dashboard that displays compliance metrics from AWS Config and drift detection results from Lambda functions.
7. Set up Parameter Store entries that store approved AMI IDs and security group rules, accessible by Lambda validation functions.
8. Implement Lambda-based tagging compliance checks that scan CloudFormation resources and verify required tags like Environment, Owner, and CostCenter are present.
9. Configure AWS Config aggregator that collects compliance data from multiple AWS accounts and centralizes reporting into single compliance dashboard.
10. Create IAM roles with specific resource permissions that grant Config access to read CloudFormation stacks, Lambda permission to read Parameter Store, and SNS permission to publish to topics.

Expected output: A CloudFormation template that deploys a complete infrastructure compliance monitoring system capable of detecting configuration drift, validating security policies, and alerting on non-compliant resources across CloudFormation stacks.

## Constraints and Requirements
- Use AWS Config rules to monitor CloudFormation stack compliance
- Implement custom Lambda functions for policy validation
- Store compliance reports in S3 with lifecycle policies
- Use EventBridge for real-time drift detection
- Implement SNS notifications for non-compliant resources
- Create IAM roles with least privilege access
- Enable CloudWatch Logs for all Lambda functions
- Use Parameter Store for configuration values
- Implement resource tagging standards validation

## Environment Setup
Infrastructure compliance monitoring system deployed in us-east-1 region. Uses AWS Config for continuous monitoring of CloudFormation stacks, Lambda functions for custom compliance checks, S3 for report storage with 90-day retention. EventBridge rules trigger on configuration changes. SNS topics distribute alerts to security team. Requires AWS CLI 2.x configured, Python 3.9+ for Lambda runtime. VPC not required as all services are managed. Parameter Store holds compliance thresholds and approved AMI lists. CloudWatch Logs aggregates Lambda execution logs with 30-day retention.

---

## Implementation Guidelines

### Platform Requirements
- Use cfn as the IaC framework
- All code must be written in json
- Follow cfn best practices for resource organization
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
- **MANDATORY**: All named resources MUST include environmentSuffix in their names
- Pattern: resource-name concatenated with environmentSuffix variable
- Examples:
  - S3 Bucket: my-bucket with environmentSuffix appended
  - Lambda Function: my-function with environmentSuffix appended
  - DynamoDB Table: my-table with environmentSuffix appended
- **Validation**: Every resource with name, bucketName, functionName, tableName, roleName, queueName, topicName, streamName, clusterName, or dbInstanceIdentifier property MUST include environmentSuffix

### Resource Lifecycle
- **MANDATORY**: All resources MUST be destroyable after testing
- **FORBIDDEN**:
  - RemovalPolicy.RETAIN in CDK/CDKTF - Use RemovalPolicy.DESTROY instead
  - DeletionPolicy Retain in CloudFormation - Remove or use Delete
  - deletionProtection true for RDS/DynamoDB - Use deletionProtection false
  - skip_final_snapshot false for RDS - Use skip_final_snapshot true
- **Rationale**: CI/CD needs to clean up resources after testing

### AWS Service-Specific Requirements

#### GuardDuty
- **CRITICAL**: Do NOT create GuardDuty detectors in code
- GuardDuty allows only ONE detector per AWS account/region
- If task requires GuardDuty, add comment: "GuardDuty should be enabled manually at account level"

#### AWS Config
- **CRITICAL**: If creating AWS Config roles, use correct managed policy:
  - CORRECT: arn:aws:iam::aws:policy/service-role/AWS_ConfigRole
  - WRONG: arn:aws:iam::aws:policy/service-role/ConfigRole
  - WRONG: arn:aws:iam::aws:policy/AWS_ConfigRole
- **Alternative**: Use service-linked role AWSServiceRoleForConfig that is auto-created

#### Lambda Functions
- **Node.js 18.x+**: Do NOT use require for aws-sdk - AWS SDK v2 not available
  - Use AWS SDK v3 with imports
  - Or extract data from event object directly
- **Reserved Concurrency**: Avoid setting reservedConcurrentExecutions unless required
  - If required, use low values to avoid account limit issues

#### CloudWatch Synthetics
- **CRITICAL**: Use current runtime version
  - CORRECT: synthetics.Runtime.SYNTHETICS_NODEJS_PUPPETEER_7_0
  - WRONG: SYNTHETICS_NODEJS_PUPPETEER_5_1 - deprecated version

#### RDS Databases
- **Prefer**: Aurora Serverless v2 for faster provisioning and auto-scaling
- **If Multi-AZ required**: Set backup_retention_period to 1 minimum and skip_final_snapshot to true
- **Note**: Multi-AZ RDS takes 20-30 minutes to provision

#### NAT Gateways
- **Cost Warning**: NAT Gateways cost approximately 32 dollars per month each
- **Prefer**: VPC Endpoints for S3 and DynamoDB which are free
- **If NAT required**: Create only 1 NAT Gateway, not per AZ for synthetic tasks

### Hardcoded Values
- **DO NOT** hardcode environment names like prod, dev, stage, production, development, or staging
- **DO NOT** hardcode account IDs like 123456789012 or specific ARNs
- **DO NOT** hardcode regions like us-east-1 or us-west-2 in resource names
- **USE**: Environment variables, context values, or parameters instead

### Cross-Resource References
- Ensure all resource references use proper ARNs or resource objects
- Verify dependencies are explicit using DependsOn in CloudFormation or dependsOn in CDK
- Test that referenced resources exist before use

## Target Region
All infrastructure should be deployed to us-east-1 region

## Success Criteria
- Infrastructure deploys successfully
- All security and compliance constraints are met
- Tests pass successfully
- Resources are properly tagged and named with environmentSuffix
- Infrastructure can be cleanly destroyed
