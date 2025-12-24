Hey team,

We need to build an automated drift detection system for our Terraform infrastructure. The DevOps team has been struggling with configuration drift across multiple AWS accounts and workspaces, and management wants an automated solution that can detect, analyze, and report on infrastructure drift to maintain compliance and prevent security vulnerabilities.

The problem we're facing is real: our team manages Terraform workspaces across dev, staging, and prod environments spanning us-east-1, us-west-2, and eu-central-1 regions. Resources keep drifting from their expected configurations, and we're finding out about it too late. We need a system that continuously monitors our infrastructure, detects when actual state diverges from expected state, and alerts us immediately so we can take action.

The business requirements are clear: track every configuration change on EC2, RDS, and S3 resources, run automated drift detection every 6 hours, generate detailed JSON reports with remediation suggestions, and send alerts when critical drift is detected. The system needs to work across multiple AWS accounts with centralized monitoring and reporting.

## What we need to build

Create an infrastructure drift detection and analysis system using Terraform with HCL that monitors Terraform-managed resources across multiple AWS accounts and workspaces.

### Core Requirements

1. State Management Infrastructure
   - S3 bucket with versioning enabled to store drift analysis reports from multiple workspaces
   - Lifecycle policies on the S3 bucket to manage report retention
   - DynamoDB tables for Terraform state locking with point-in-time recovery enabled
   - Support for remote state access across multiple regions

2. Configuration Tracking
   - AWS Config rules to track configuration changes for EC2, RDS, and S3 resources
   - AWS Config recorder to capture resource configuration changes
   - AWS Config delivery channel to store configuration snapshots in S3

3. Drift Detection System
   - Lambda functions that execute terraform plan operations and parse output for drift analysis
   - Lambda code to analyze terraform plan exit codes and generate structured drift reports
   - JSON report generation with resource drift details, timestamps, and severity levels

4. Automation and Scheduling
   - EventBridge rules to trigger drift detection Lambda functions every 6 hours
   - EventBridge targets connecting rules to Lambda functions

5. Notification System
   - SNS topics for critical drift notifications
   - Email subscriptions for alerting on detected drift

6. Access Control
   - IAM roles for Lambda execution with permissions limited to specific S3 buckets, DynamoDB tables, and CloudWatch log groups
   - IAM policies allowing cross-account state file access for centralized analysis with specific resource ARNs
   - Least privilege IAM policies for all resources with exact action lists and resource specifications

7. Monitoring and Visibility
   - CloudWatch dashboards displaying drift metrics and trends across environments
   - CloudWatch log groups for Lambda function execution logs
   - CloudWatch metrics for tracking drift detection frequency and results

### Technical Requirements

- All infrastructure defined using Terraform with HCL
- Use S3 for drift report storage with versioning enabled
- Use DynamoDB for state locking tables
- Use AWS Config for tracking EC2, RDS, and S3 configuration changes
- Use Lambda with Python 3.11 runtime for drift detection logic
- Use EventBridge for scheduling drift detection runs
- Use SNS for notification delivery
- Use IAM for access control and cross-account permissions with specific resource ARNs
- Use CloudWatch for monitoring, logging, and dashboards
- Resource names must include environmentSuffix for uniqueness
- Follow naming convention: drift-detection-resource-type with var.environment_suffix variable
- Deploy to us-east-1 region
- All resources must be destroyable with no Retain policies or deletion protection

### Deployment Requirements - CRITICAL

- All resources must include environmentSuffix in names for parallel deployments
- Resource naming pattern: drift-detection-component with var.environment_suffix variable
- No RemovalPolicy RETAIN or DeletionProtection flags
- All resources must be fully destroyable after testing
- Lambda functions must not use Node.js 18+ but use Python 3.11 instead to avoid AWS SDK v3 issues
- AWS Config IAM role must use managed policy arn:aws:iam::aws:policy/service-role/AWS_ConfigRole
- Do not create AWS Config resources if AWS Config is already enabled in the account

### Constraints

- Implement custom null_resource triggers for scheduled drift checks if needed
- Store drift analysis results in S3 with versioning enabled
- Generate JSON-formatted drift reports with timestamp and severity levels
- Use terraform_remote_state data sources to analyze cross-workspace dependencies if needed
- Configure remote state locking with DynamoDB to prevent concurrent modifications
- Implement lifecycle rules to prevent automatic remediation of critical resources
- All Lambda functions require proper error handling and logging to CloudWatch
- CloudWatch log retention set to 7 days minimum
- S3 lifecycle rules to transition old reports to cheaper storage after 30 days

## Success Criteria

- Functionality: Drift detection runs automatically every 6 hours and generates reports
- Performance: Lambda functions complete drift analysis within 5 minutes
- Reliability: System handles failures gracefully with retry logic and error notifications
- Security: Least privilege IAM policies with specific resource ARNs, encrypted S3 buckets, secure cross-account access
- Resource Naming: All resources include environmentSuffix for unique identification
- Monitoring: CloudWatch dashboards show drift metrics, Lambda logs capture execution details
- Code Quality: Clean HCL code, well-organized modules, comprehensive comments

## What to deliver

- Complete Terraform HCL implementation with all required resources
- S3 bucket for drift report storage with versioning and lifecycle policies
- DynamoDB table for state locking with point-in-time recovery
- AWS Config setup with rules for EC2, RDS, and S3 tracking
- Lambda function code in Python for drift detection and analysis
- EventBridge rule for 6-hour scheduling
- SNS topic with email subscription for notifications
- IAM roles and policies with least privilege access using specific resource ARNs
- CloudWatch dashboard for drift monitoring
- CloudWatch log groups for Lambda execution logs
- All infrastructure code organized in main.tf, variables.tf, outputs.tf
- Lambda code in lib/lambda/ directory
