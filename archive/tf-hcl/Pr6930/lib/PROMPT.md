Hey team,

We've got a serious infrastructure compliance issue across our multi-account AWS environment. Our DevOps team has been managing multiple Terraform workspaces across different AWS accounts in us-east-1, us-west-2, and eu-central-1 regions, and management just discovered significant configuration drift between what's deployed and what's in our state files. This is creating security vulnerabilities and compliance headaches.

We need to build an automated drift detection and analysis system using **Terraform with HCL**. The business wants this system to continuously monitor our infrastructure, detect when resources have drifted from their defined configurations, and alert us immediately when critical drift occurs. Right now, we're flying blind - we have no idea what's changed until something breaks or fails an audit.

The challenge is that we need this to work across multiple AWS accounts and regions, with centralized reporting and analysis. We need to leverage AWS Config for tracking configuration changes, Lambda functions to run terraform plan checks, and EventBridge to trigger these checks automatically every 6 hours. All drift reports need to be stored in S3 with versioning, and we need SNS notifications when critical drift is detected.

## What we need to build

Create an infrastructure drift detection and analysis system using **Terraform with HCL** that monitors configuration drift across multiple AWS environments.

### Core Requirements

1. **Drift Report Storage**
   - Create S3 bucket with versioning enabled for storing drift analysis reports from multiple workspaces
   - Implement lifecycle policies for transitioning old reports to cost-effective storage tiers
   - Enable encryption at rest for compliance
   - Resource name must include environment_suffix for uniqueness

2. **State Locking Infrastructure**
   - Configure DynamoDB tables for Terraform state locking
   - Enable point-in-time recovery for disaster recovery scenarios
   - Set up proper IAM permissions for state access
   - Resource name must include environment_suffix

3. **Configuration Change Tracking**
   - Implement AWS Config rules to track configuration changes for EC2, RDS, and S3 resources
   - Use Terraform to define these Config rules (not manual setup)
   - Create Config recorder and delivery channel pointing to S3 bucket
   - Use correct IAM managed policy: service-role/AWS_ConfigRole

4. **Drift Detection Lambda Functions**
   - Create Lambda functions that execute terraform plan -detailed-exitcode
   - Parse terraform plan output to identify drift
   - Generate structured JSON reports with drift details
   - Include proper error handling and logging
   - Lambda code should be in lib/lambda/ directory
   - Use Node.js 18+ compatible runtime (avoid deprecated aws-sdk v2)

5. **Scheduled Drift Checks**
   - Set up EventBridge rules to trigger drift detection Lambda functions every 6 hours
   - Configure proper IAM permissions for EventBridge to invoke Lambda
   - Include retry logic for failed executions

6. **Critical Drift Notifications**
   - Configure SNS topics for drift notifications
   - Set up email subscriptions for critical drift alerts
   - Include severity levels in notifications (critical, warning, info)
   - Resource name must include environment_suffix

7. **Cross-Account Access**
   - Implement IAM roles and policies for cross-account state file access
   - Enable centralized drift analysis across multiple AWS accounts
   - Follow least-privilege principle for IAM permissions

8. **Drift Metrics and Dashboards**
   - Create CloudWatch dashboards displaying drift metrics and trends
   - Track drift frequency, affected resources, and remediation status
   - Set up CloudWatch alarms for drift thresholds

9. **Terraform Data Sources for Validation**
   - Use Terraform data sources to validate current resource states
   - Compare actual vs expected configurations using data source queries
   - Implement checks for resource existence and configuration compliance

10. **Structured Drift Reports**
    - Generate JSON-formatted drift reports with timestamps
    - Include resource drift details, severity levels, and remediation suggestions
    - Store reports in S3 with consistent naming convention
    - Enable report versioning for historical analysis

### Technical Requirements

- All infrastructure defined using **Terraform with HCL**
- Use AWS Config for configuration change tracking
- Use Lambda for drift detection logic
- Use EventBridge for scheduling
- Use S3 for report storage with versioning
- Use DynamoDB for state locking
- Use SNS for notifications
- Use CloudWatch for dashboards and metrics
- Use IAM for cross-account access
- Resource names must include environment_suffix for uniqueness
- Follow naming convention: resource-type-environment-suffix
- Deploy to us-east-1, us-west-2, and eu-central-1 regions
- All resources must be destroyable (no Retain policies, no deletion_protection)

### Special Constraints

- Use Terraform's native drift detection capabilities without external tools
- Implement custom null_resource triggers for scheduled drift checks
- Store drift analysis results in S3 with versioning enabled
- Generate JSON-formatted drift reports with timestamp and severity levels
- Use data sources to compare actual vs expected resource configurations
- Implement lifecycle rules to prevent automatic remediation of critical resources
- Configure remote state locking with DynamoDB to prevent concurrent modifications
- Use terraform_remote_state data sources to analyze cross-workspace dependencies
- Implement AWS Config rules through Terraform to track configuration changes
- Do not create AWS GuardDuty detector (account-level resource, one per account)

### Deployment Requirements (CRITICAL)

- All resources must include environment_suffix in their names
- No RemovalPolicy: RETAIN or deletion_protection: true allowed
- All resources must be fully destroyable for cleanup
- AWS Config must use IAM managed policy: service-role/AWS_ConfigRole
- Lambda functions must be compatible with Node.js 18+ (use SDK v3 or avoid SDK)
- S3 buckets should have force_destroy enabled for testing environments

## Success Criteria

- Functionality: Drift detection system runs automatically every 6 hours across all regions
- Performance: Drift detection completes within 10 minutes per workspace
- Reliability: System handles Lambda failures with retry logic and error notifications
- Security: IAM follows least-privilege, cross-account access properly configured
- Monitoring: CloudWatch dashboards show drift trends and metrics
- Reporting: JSON reports are structured, versioned, and stored in S3
- Notifications: SNS alerts sent for critical drift with severity levels
- Resource Naming: All resources include environment_suffix for deployment isolation
- Code Quality: HCL well-structured, modular, properly documented
- Destroyability: All infrastructure can be torn down without manual intervention

## What to deliver

- Complete Terraform HCL implementation with all 10 mandatory requirements
- S3 bucket with versioning and lifecycle policies
- DynamoDB tables for state locking with PITR
- AWS Config rules for EC2, RDS, and S3 tracking
- Lambda functions for terraform plan execution and drift analysis
- EventBridge rules for 6-hour scheduled triggers
- SNS topics with email subscription configuration
- IAM roles for cross-account state access
- CloudWatch dashboards for drift metrics
- Terraform data sources for resource validation
- Structured JSON drift report generation logic
- Unit tests for Terraform configuration
- Documentation with deployment and usage instructions
