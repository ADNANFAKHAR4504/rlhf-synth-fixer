# Infrastructure Compliance Auditing System

Hey team,

We need to build an automated infrastructure compliance auditing system for a financial services company. Their current manual compliance reviews are time-consuming and error-prone, and they need a programmatic solution that can continuously validate infrastructure configurations against security policies while generating comprehensive audit reports for regulatory requirements.

The business wants this system to scan infrastructure within a single AWS account, evaluate configurations against compliance rules, generate detailed reports, and alert on violations with some automatic remediation capabilities. This is critical for meeting their regulatory obligations and reducing the operational burden of manual audits.

We've been asked to build this using **AWS CDK with Python**. The system needs to leverage Lambda for custom compliance evaluations, and EventBridge for scheduled scans. All audit reports should be stored in S3 with proper lifecycle management, and critical violations should trigger SNS notifications.

## What we need to build

Create a comprehensive compliance auditing system using **AWS CDK with Python** that monitors infrastructure configurations within a single AWS account, evaluates compliance rules, generates audit reports, and provides alerting and remediation capabilities.

### Core Requirements

1. **Infrastructure Scanning**
   - Create a Lambda function (Python 3.9, 1GB memory) that performs infrastructure scanning in the current account
   - Scan resources including S3 buckets, VPCs, and Lambda functions
   - Evaluate compliance against defined security policies (S3 encryption, VPC flow logs, Lambda settings)
   - Enable X-Ray tracing for all Lambda functions for debugging

2. **Scheduled Compliance Checks**
   - Configure EventBridge rules to trigger compliance scans every 6 hours
   - Configure EventBridge rules to support on-demand scans via custom events
   - Ensure scheduled execution is reliable and properly integrated with scanning Lambda

3. **Audit Report Storage**
   - Set up an S3 bucket with versioning enabled
   - Configure lifecycle rules to retain audit reports for 90 days
   - Use separate KMS keys for S3 encryption (not AWS managed keys)
   - Ensure bucket follows naming conventions with environmentSuffix

4. **Report Generation**
   - Implement Lambda functions to generate compliance reports in JSON format
   - Implement Lambda functions to generate compliance reports in CSV format
   - Store generated reports in the versioned S3 bucket
   - Include timestamps and compliance status in all reports

5. **Alerting System**
   - Create SNS topics for critical non-compliance alerts
   - Configure email subscriptions for compliance notifications
   - Ensure alerts include sufficient detail for triage

6. **Compliance Metrics and Monitoring**
   - Deploy CloudWatch dashboards showing compliance metrics
   - Display trend analysis for compliance over time
   - Track key metrics like compliance score and violation counts

7. **Automatic Remediation**
   - Implement automatic remediation Lambda for enabling S3 bucket encryption
   - Design remediation to be safe and auditable
   - Log all remediation actions for compliance tracking

8. **VPC and Network Requirements**
   - Deploy VPC with private subnets for Lambda execution
   - Enable VPC flow logs with specific naming: 'audit-flowlogs-{region}-{date}'
   - Configure VPC endpoints for AWS service access

### Technical Requirements

- All infrastructure defined using **AWS CDK with Python**
- Use **Lambda** (Python 3.9+) for scanning, report generation, and remediation
- Use **EventBridge** for scheduling periodic compliance checks
- Use **S3** with versioning and lifecycle policies for audit storage
- Use **SNS** for critical compliance alerts
- Use **CloudWatch** for dashboards and metrics
- Use **VPC** with flow logs and private subnets
- Use **IAM** roles with appropriate permissions for resource scanning
- Use **KMS** for S3 bucket encryption (separate keys per bucket)
- Deploy to **us-east-1** region
- All Lambda functions must have reserved concurrent executions to prevent resource exhaustion
- All Lambda execution roles must use managed policies only (no inline policies)
- Resource names must include **environmentSuffix** parameter for uniqueness
- Follow naming convention: resource-type-environment-suffix
- All resources must include mandatory tags: Environment, Owner, CostCenter, ComplianceLevel

### Deployment Requirements (CRITICAL)

- All resources must be fully destroyable (no Retain deletion policies)
- Include proper error handling and logging in all Lambda functions
- Ensure X-Ray tracing is enabled on all Lambda functions
- VPC flow logs must follow naming pattern: audit-flowlogs-us-east-1-{date}

### Constraints

- Lambda execution roles must not contain inline policies
- S3 buckets must use separate KMS keys, not default AWS managed keys
- VPC flow logs must be enabled and follow strict naming conventions
- All resources must have mandatory tags: Environment, Owner, CostCenter, ComplianceLevel
- Lambda functions must have reserved concurrent executions configured
- All resources must support clean teardown without retention

## Success Criteria

- **Functionality**: Complete compliance auditing system that scans the current AWS account
- **Performance**: Scans complete within 6-hour intervals, reports generated promptly
- **Reliability**: EventBridge scheduling is consistent, Lambda executions are reliable
- **Security**: Appropriate IAM permissions, all data encrypted with KMS
- **Compliance**: All mandatory tags present, VPC flow logs properly configured
- **Resource Naming**: All resources include environmentSuffix parameter
- **Observability**: CloudWatch dashboards show key metrics, X-Ray tracing enabled
- **Remediation**: Automatic S3 encryption remediation works safely
- **Code Quality**: Clean Python code, well-tested, properly documented

## What to deliver

- Complete AWS CDK Python implementation
- Lambda functions for infrastructure scanning (with built-in compliance checks), JSON report generation, CSV report generation, and automatic remediation
- EventBridge rules for 6-hour scheduled scans and on-demand triggers
- S3 bucket with versioning, lifecycle policies (90-day retention), and KMS encryption
- SNS topics with email subscriptions for compliance alerts
- CloudWatch dashboards for compliance metrics and trend analysis
- VPC with private subnets, flow logs, and VPC endpoints
- IAM roles with appropriate permissions and managed policies only
- Unit tests for all Lambda functions and infrastructure components
- Documentation including deployment instructions and architecture overview
