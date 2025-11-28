# Security Configuration as Code - AWS Config Multi-Region Compliance

Create a comprehensive AWS security compliance infrastructure using CDKTF (Python) that implements automated security checks across multiple AWS regions using AWS Config, Lambda functions, and CloudWatch monitoring.

## Requirements

### 1. AWS Config Setup (Multi-Region)
- Deploy AWS Config in two regions: us-east-1 (primary) and us-west-2 (secondary)
- Create Config Recorders to monitor resource configurations
- Set up Config Delivery Channels to send configuration snapshots to S3
- Create an S3 bucket per region for storing Config snapshots
- Enable encryption on all S3 buckets
- Create Config Aggregator in primary region to consolidate findings

### 2. Security Compliance Rules
Implement three custom AWS Config rules with Lambda evaluations:

a) EC2 Instance Tagging Compliance
- Verify all EC2 instances have required tags: Environment, Owner, CostCenter
- Trigger on EC2 configuration changes
- Mark as NON_COMPLIANT if any required tag is missing

b) RDS Encryption Compliance
- Verify all RDS instances have encryption enabled
- Check storage_encrypted attribute
- Mark as NON_COMPLIANT if encryption is disabled

c) S3 Bucket Policy Compliance
- Verify S3 buckets have proper bucket policies
- Check for public access blocks enabled
- Mark as NON_COMPLIANT if bucket allows public access

### 3. Lambda Functions for Compliance Checks
Create three Lambda functions (one per rule):
- Use Python 3.11 runtime
- Each function should evaluate resources and return AWS Config compliance response
- Deploy Lambda code as ZIP files (not inline)
- Include proper IAM roles with permissions for AWS Config, EC2, RDS, S3
- Add CloudWatch Logs for each Lambda

### 4. Notification System
- Create SNS topic per region for compliance notifications
- Configure SNS topic policies to allow EventBridge to publish
- Create EventBridge rules to trigger on Config compliance changes
- Send notifications when resources become NON_COMPLIANT

### 5. Automation & Remediation
- Create SSM Automation documents for auto-remediation:
  - Document to add missing tags to EC2 instances
  - Document to enable encryption on RDS instances
- Link SSM documents to Config rules for automatic remediation

### 6. Monitoring Dashboard
- Create CloudWatch Dashboard showing:
  - Number of compliant vs non-compliant resources
  - Compliance status by rule
  - Recent compliance changes
  - Lambda function execution metrics

### 7. Outputs
Export the following outputs to cfn-outputs/flat-outputs.json:
- S3 bucket names (both regions)
- Config recorder names (both regions)
- Config aggregator name and ARN
- Lambda function ARNs (all 3 functions)
- SNS topic ARNs (both regions)
- EventBridge rule ARNs
- CloudWatch Dashboard name
- SSM document names

## Technical Constraints
- Use CDKTF native constructs (not escape hatches unless necessary)
- Lambda functions must use physical ZIP files in lib/lambda/ directory
- All resources must be properly tagged
- Follow AWS security best practices (encryption, least privilege IAM)
- Ensure resources work across multi-region setup
- Use local state (no S3 backend) for testing

## Expected Infrastructure
- 2 S3 buckets (config snapshots)
- 2 Config recorders
- 2 Config delivery channels
- 3 Lambda functions (compliance checks)
- 3 IAM roles (for Lambda)
- 3 CloudWatch log groups
- 3 Config rules
- 2 SNS topics
- 2 SNS topic policies
- 2 EventBridge rules
- 2 SSM automation documents
- 1 Config aggregator
- 1 CloudWatch dashboard

Total: ~25 resources across 2 regions
