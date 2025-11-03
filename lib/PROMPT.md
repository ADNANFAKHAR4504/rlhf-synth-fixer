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
- Deploy AWS Inspector for automated security assessments of EC2 and ECR
- Set up AWS Audit Manager for automated compliance evidence collection
- Implement AWS Detective for security investigation and root cause analysis

### 8. Operational Intelligence
- Configure Amazon DevOps Guru for ML-powered operational insights
- Deploy AWS Compute Optimizer recommendations engine with automated reporting
- Set up AWS Health Dashboard API integration for proactive incident management

### 9. Architecture Review
- Implement AWS Well-Architected Tool integration for architecture review automation

## Technical Constraints

### Disaster Recovery and High Availability
- All resources must support disaster recovery with RTO < 1 hour and RPO < 15 minutes
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
- Primary region: ap-southeast-2
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
- Well-Architected Tool for architecture reviews
- Multi-region deployment with automated DR capabilities
