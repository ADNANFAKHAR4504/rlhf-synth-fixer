# Infrastructure Compliance Analysis System

## Platform and Language
**MANDATORY**: Use **Pulumi with TypeScript**

## Overview
Create a Pulumi TypeScript program to build an automated infrastructure compliance analysis system for a financial services company that needs automated infrastructure compliance checking for their AWS environments. They require real-time analysis of resource configurations against company policies and immediate notifications for any violations.

## Core Requirements

### 1. Lambda Compliance Scanner
- Deploy a Lambda function that scans EC2 instances for required tags:
  - Environment
  - Owner
  - CostCenter
- Lambda must use Node.js 18.x runtime
- Lambda function must complete execution within 5 minutes
- Lambda function must handle pagination for large EC2 instance counts
- Set up Lambda environment variables for configurable tag requirements

### 2. Automated Scheduling
- Set up CloudWatch Events to trigger the Lambda every 6 hours
- CloudWatch Events rule must use cron expression syntax

### 3. Report Storage
- Create an S3 bucket to store compliance reports with versioning enabled
- S3 bucket must use AES256 server-side encryption
- Generate JSON reports with instance IDs and missing tags
- S3 lifecycle policy must archive reports older than 90 days to Glacier

### 4. Alerting System
- Implement SNS topic for alerting on non-compliant resources
- Send email notifications via SNS when violations are found
- SNS topic must only send to verified email addresses

### 5. Compliance Dashboard
- Create CloudWatch dashboard showing compliance metrics
- CloudWatch dashboard provides real-time compliance metrics and trends over time

### 6. IAM Security
- Implement proper IAM roles with least privilege access
- All resources must be tagged with Project and Environment tags

### 7. Advanced Security and Compliance Services
- Integrate AWS Security Hub with automated remediation through Lambda functions
  - Note: Security Hub standards subscriptions may require manual enablement via AWS Console/CLI due to ARN format requirements
- Deploy AWS Inspector for automated security assessments of EC2 and ECR
- Set up AWS Audit Manager for automated compliance evidence collection
  - Note: Audit Manager Framework creation requires pre-existing control UUIDs that must be created separately via AWS Console/CLI
- Implement AWS Detective for security investigation and root cause analysis

### 8. Operational Intelligence
- Configure Amazon DevOps Guru for ML-powered operational insights
- Deploy AWS Compute Optimizer recommendations engine with automated reporting
- Set up AWS Health Dashboard API integration for proactive incident management

### 9. Architecture Review
- Implement AWS Well-Architected Tool integration for architecture review automation
  - Note: Well-Architected Tool workload resources are not available in Pulumi AWS provider. Document the intended architecture and provide placeholder outputs for manual setup via AWS Console/CLI

## Technical Constraints

### Platform and Provider Limitations
- Some AWS services may have limited or no support in Pulumi AWS provider (e.g., Well-Architected Tool workloads)
- When platform limitations exist, document the intended architecture with clear comments and provide placeholder outputs
- For services requiring manual setup (e.g., Audit Manager controls, Security Hub standards), include clear documentation on how to complete setup via AWS Console/CLI
- Always validate resource availability in the target Pulumi AWS provider version before implementation

### Disaster Recovery and High Availability
- All resources must support disaster recovery with RTO < 1 hour and RPO < 15 minutes
  - Note: S3 Replication Time Control (RTC) for <15 minute RPO requires special entitlement and may not be available via standard Pulumi AWS provider. Standard S3 replication provides RPO within hours, which should be documented as a trade-off.
- Deploy resources across multiple regions for high availability and disaster recovery

### Security and Compliance
- Implement automated security scanning in CI/CD pipeline before deployment
- All secrets and credentials must use automatic rotation with zero-downtime updates
- Must implement infrastructure drift detection with automated remediation

### Documentation and Cost Management
- Implement cost allocation tags and AWS Cost Explorer integration for budget tracking
- Must include comprehensive documentation with architecture diagrams exported as code

### Testing
- Must implement infrastructure as code testing using Pulumi's testing framework

## Deployment Configuration

### Region
- Primary region: us-east-1
- Multi-region deployment for HA/DR as specified in constraints

### Technology Stack
- Pulumi CLI 3.x with TypeScript
- Node.js 18+
- AWS CLI configured

## Expected Output
A fully automated compliance checking system that:
- Continuously monitors EC2 instances for required tags
- Generates detailed reports in S3
- Sends alerts for violations
- Provides a dashboard for compliance visibility
- Integrates advanced AWS security and operational services
- Supports multi-region deployment for resilience

## Architecture Summary
- Lambda for compliance checking logic
- S3 for report storage
- CloudWatch Events for scheduling
- SNS for notifications
- CloudWatch Dashboard for metrics
- AWS Security Hub, Inspector, Audit Manager, Detective for security
- DevOps Guru, Compute Optimizer, Health Dashboard for operations
- Well-Architected Tool for architecture reviews (documented, manual setup required)
- Multi-region deployment with automated DR capabilities

## Implementation Notes

### Platform Limitations
The following services have platform limitations that should be handled gracefully:
1. **AWS Well-Architected Tool**: Workload resources not available in Pulumi AWS provider. Document intended architecture and provide placeholder outputs.
2. **AWS Audit Manager**: Framework creation requires pre-existing control UUIDs. Document the requirement and provide example code in comments.
3. **Security Hub Standards**: Standard subscriptions may require manual enablement. Enable Security Hub and document how to enable standards via Console/CLI.
4. **S3 Replication Time Control**: Advanced RTC features may not be available. Use standard replication and document RPO trade-offs.

### Best Practices
- Always validate resource availability in Pulumi AWS provider before implementation
- Use `toLowerCase()` for S3 bucket names to ensure compliance with AWS naming rules
- Include account ID in bucket names for uniqueness across accounts
- Suppress unused variable warnings with eslint-disable comments for resources created for side effects
- Document all platform limitations clearly with actionable alternatives
