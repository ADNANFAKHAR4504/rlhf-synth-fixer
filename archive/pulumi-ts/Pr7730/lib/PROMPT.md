# Infrastructure Compliance Analysis System

Hey team,

We need to build an infrastructure compliance validation system that can analyze our deployed AWS resources and verify they meet our security and governance policies. I've been asked to create this in TypeScript using Pulumi. The goal is to have an automated way to audit our existing infrastructure without manually checking hundreds of resources across different accounts.

The business is concerned about potential security gaps in our current deployments. We've had instances where EC2 instances were launched without proper tagging, S3 buckets were created without encryption, and security groups were left too permissive. Rather than building yet another monitoring dashboard, they want an infrastructure-as-code solution that can programmatically validate compliance rules and generate actionable reports.

This needs to run regularly as part of our governance process, checking for violations across multiple dimensions: tagging compliance, encryption standards, AMI approval lists, network security, and IAM least-privilege principles. When violations are found, we need both CloudWatch metrics for trending and SNS notifications for critical issues.

## What we need to build

Create an infrastructure compliance analysis system using **Pulumi with TypeScript** that programmatically queries deployed AWS resources and validates them against security policies.

### Core Requirements

1. **EC2 Instance Tag Validation**
   - Query all EC2 instances in the AWS account
   - Verify each instance has required tags: Environment, Owner, CostCenter
   - Report instances missing any required tags

2. **S3 Bucket Security Compliance**
   - Check all S3 buckets for encryption configuration
   - Verify versioning is enabled on all buckets
   - Flag any bucket that lacks encryption or versioning

3. **AMI Compliance Verification**
   - Validate EC2 instances are using approved AMIs only
   - Use a predefined list of approved AMI IDs
   - Report any instances running unapproved AMIs

4. **Security Group Network Rules**
   - Scan all security groups for overly permissive rules
   - Flag rules allowing inbound traffic from 0.0.0.0/0 on port 22 (SSH)
   - Flag rules allowing inbound traffic from 0.0.0.0/0 on port 3389 (RDP)
   - Report security groups with these dangerous configurations

5. **IAM Least-Privilege Validation**
   - Examine IAM roles attached to EC2 instances
   - Check for wildcard permissions in attached policies
   - Identify roles with overly broad permissions

6. **CloudWatch Metrics Generation**
   - Create custom CloudWatch metrics for non-compliant resource counts
   - Track metrics by violation type for trending over time
   - Enable alerting based on metric thresholds

7. **Violation Reporting**
   - Export a JSON report listing all violations
   - Include resource IDs, violation types, and details for each finding
   - Make report accessible for integration with other tools

8. **Critical Alert Notifications**
   - Create SNS topic for compliance notifications
   - Send alerts for critical violations: unencrypted S3 buckets, open SSH/RDP ports
   - Include violation details and affected resource IDs in notifications

### Technical Requirements

- All infrastructure defined using **Pulumi with TypeScript**
- Use **@pulumi/aws** package to query existing AWS resources
- Use AWS SDK for resource queries and compliance checks
- Resource names must include **environmentSuffix** for uniqueness
- Follow naming convention: `{resource-type}-environmentSuffix`
- Deploy to **us-east-1** region
- Use Pulumi stack outputs to expose compliance report

### Constraints

- Query existing resources, do not create EC2 instances or S3 buckets being analyzed
- All analysis must run within Pulumi program execution
- Handle cases where resources may not exist gracefully
- Approved AMI list should be configurable via Pulumi config
- Security group rules must check both IPv4 (0.0.0.0/0) and IPv6 (::/0) CIDR blocks
- IAM policy analysis should check inline policies and managed policy attachments
- All created resources (SNS topics, CloudWatch metrics) must be destroyable
- No deletion protection or Retain policies on any resources
- Include proper error handling for AWS API calls

### Deployment Requirements (CRITICAL)

- All resource names MUST include **environmentSuffix** parameter for uniqueness
- Resource naming format: `{resource-type}-{environmentSuffix}`
- Example: `compliance-sns-topic-dev123` where `dev123` is the environmentSuffix
- NO resources should have RemovalPolicy.RETAIN or DeletionPolicy: Retain
- All resources must be fully destroyable for testing
- SNS topics: No deletion protection enabled
- CloudWatch metrics: Use custom namespace for easy cleanup

## Success Criteria

- **Functionality**: System successfully queries all specified AWS resource types
- **Validation**: All eight compliance checks execute without errors
- **Reporting**: JSON report generated with complete violation details
- **Metrics**: CloudWatch custom metrics created for each violation type
- **Alerting**: SNS notifications sent for critical violations
- **Resource Naming**: All created resources include environmentSuffix
- **Code Quality**: TypeScript code, well-structured, properly typed, documented

## What to deliver

- Complete Pulumi TypeScript implementation
- EC2 instance querying and tag validation
- S3 bucket encryption and versioning checks
- AMI compliance verification against approved list
- Security group rule analysis for open SSH/RDP
- IAM role policy validation for wildcards
- CloudWatch custom metrics for violation counts
- SNS topic for critical violation alerts
- JSON report output with all findings
- Pulumi stack outputs exposing compliance data
- Unit tests for compliance validation logic
- Documentation explaining how to run the compliance checks
