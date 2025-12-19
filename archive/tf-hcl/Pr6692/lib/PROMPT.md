# Automated Infrastructure Compliance Scanning System

Hey team,

We need to build an automated compliance scanning system for our infrastructure. The financial services company we're working with has been doing manual compliance reviews that take days and often miss critical security misconfigurations. They need something that can automatically scan their Terraform state files, identify non-compliant resources, and generate actionable reports to meet regulatory requirements.

I've been asked to create this using **Terraform with HCL**. The system needs to scan infrastructure continuously, evaluate resources against AWS Config rules, and alert on critical issues before they become audit problems.

The solution should leverage AWS Config for rule evaluation, process Terraform state files to understand the actual infrastructure deployment, store compliance results for trending analysis, and generate PDF reports with lifecycle management. We need to support multiple AWS accounts through cross-account IAM roles.

## What we need to build

Create an automated infrastructure compliance scanning system using **Terraform with HCL** for a financial services company requiring continuous compliance monitoring and automated reporting.

### Core Requirements

1. **AWS Config Rule Deployment**
   - Create custom AWS Config rules to evaluate EC2 instance types
   - Implement rules for S3 bucket encryption validation
   - Add rules for RDS backup retention compliance
   - Configure Config recorder and delivery channel

2. **Terraform State File Processing**
   - Deploy Lambda function to read Terraform state files from S3
   - Parse JSON state files up to 50MB in size
   - Extract resource configurations from state data
   - Compare resources against AWS Config rules
   - Implement compliance evaluation logic

3. **Compliance Results Storage**
   - Create DynamoDB table for compliance scan results
   - Store resource ID, compliance status, rule name, and timestamp
   - Use PAY_PER_REQUEST billing mode
   - Support querying by resource ID and timestamp

4. **Scheduled Compliance Scans**
   - Configure EventBridge rule to trigger scans every 6 hours exactly
   - Integrate EventBridge with Lambda function
   - Ensure reliable scheduled execution

5. **PDF Report Generation**
   - Generate PDF compliance reports with scan results
   - Store reports in S3 bucket
   - Implement S3 lifecycle policy for 90-day retention
   - Include compliance trends and critical findings

6. **Critical Alert Notifications**
   - Create SNS topic for compliance notifications
   - Send alerts when compliance severity exceeds 8
   - Include display_name attribute for topic identification
   - Configure email subscriptions

7. **IAM Security Configuration**
   - Create IAM roles with precise permissions for each service
   - Lambda execution role with state file read access
   - Config service role for rule evaluation
   - Support cross-account IAM roles for multi-account scanning

8. **Resource Tagging Strategy**
   - Tag all resources with Environment tag
   - Add Purpose tag to identify compliance components
   - Include CostCenter tag for billing allocation

9. **CloudWatch Monitoring Dashboard**
   - Create dashboard showing compliance trends over time
   - Display compliance scan metrics
   - Show critical non-compliance counts
   - Include Lambda execution metrics

10. **Infrastructure Outputs**
    - Output AWS Config rule ARNs
    - Export Lambda function name
    - Provide S3 report bucket name

### Technical Requirements

- All infrastructure defined using **Terraform with HCL**
- Use **AWS Config** for compliance rule evaluation
- Use **Lambda** with 3GB memory allocation for state file processing
- Use **DynamoDB** with PAY_PER_REQUEST billing mode
- Use **S3** for state files and PDF report storage with SSE-S3 encryption
- Use **EventBridge** for scheduled scans every 6 hours
- Use **SNS** for critical compliance notifications
- Use **IAM** for service permissions and cross-account access
- Use **CloudWatch** for dashboards and monitoring
- Deploy to **us-east-2** region
- Lambda timeout must be 15 minutes maximum
- Resource names must include **environmentSuffix** for uniqueness
- Follow naming convention: resource-type-environment-suffix

### Constraints

- Lambda functions must have 3GB memory allocation for large state file processing
- All S3 buckets must use SSE-S3 encryption only, not KMS
- EventBridge rules must trigger scans exactly every 6 hours
- DynamoDB tables must use PAY_PER_REQUEST billing mode
- Lambda timeout must be set to 15 minutes maximum
- SNS topics must have display_name attributes
- All resources must be destroyable with no Retain policies
- Include proper error handling and logging
- Support cross-account IAM role assumption

## Success Criteria

- **Functionality**: System automatically scans Terraform state files, evaluates compliance against AWS Config rules, and stores results in DynamoDB
- **Reporting**: PDF reports generated with compliance data and stored in S3 with 90-day lifecycle policy
- **Alerting**: SNS notifications sent for critical non-compliance (severity greater than 8)
- **Monitoring**: CloudWatch dashboard displays compliance trends and scan metrics
- **Security**: IAM roles have least-privilege permissions for each service component
- **Resource Naming**: All resources include environmentSuffix parameter
- **Multi-Account**: Cross-account IAM roles support multiple AWS accounts
- **Code Quality**: Clean HCL code, well-documented, properly structured

## What to deliver

- Complete Terraform HCL implementation
- AWS Config with custom compliance rules
- Lambda function for Terraform state file processing
- DynamoDB table for compliance results storage
- S3 buckets for state files and PDF reports with lifecycle policies
- EventBridge scheduled rule for automatic scans
- SNS topic for critical compliance alerts
- IAM roles with precise service permissions
- CloudWatch dashboard for compliance monitoring
- Proper resource tagging (Environment, Purpose, CostCenter)
- Infrastructure outputs (Config rule ARNs, Lambda function name, S3 bucket name)
- All resources configured for us-east-2 region
