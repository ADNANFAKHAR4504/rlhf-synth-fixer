# Task: Observability Stack for Payment Processing

## Overview

A financial services company needs to implement comprehensive observability for their payment processing system to meet compliance requirements. The system must capture detailed metrics, logs, and traces while maintaining data residency in specific regions for regulatory purposes.

## Requirements

Create a CloudFormation JSON template to deploy an observability stack for payment processing infrastructure. The configuration must:

1. Create encrypted CloudWatch Log Groups with 30-day retention and KMS encryption
2. Deploy CloudWatch Dashboard with widgets for API Gateway latency, Lambda errors, and custom metrics
3. Configure X-Ray service map and sampling rules at 10% for production traffic
4. Set up composite CloudWatch Alarms combining multiple metrics including API 5XX errors and Lambda timeouts
5. Create SNS topics with email subscriptions for critical alerts
6. Store dashboard JSON configuration in Parameter Store for version control
7. Implement CloudWatch Logs Insights queries as saved queries for common troubleshooting
8. Configure metric filters on log groups to extract custom metrics from application logs
9. Set up cross-region metric streams to replicate metrics between regions
10. Create IAM roles with least privilege for CloudWatch agent on EC2 instances

## Compliance Constraints

- All CloudWatch Logs must use KMS encryption with customer-managed keys
- Metrics data retention must be exactly 90 days for compliance
- Log groups must have resource policies limiting access to specific IAM roles
- CloudWatch Dashboards must be deployed in at least 2 regions
- Alarms must use composite alarms for reducing false positives
- All resources must use consistent tagging with Environment, Owner, and CostCenter tags
- Parameter Store must be used for storing dashboard configurations

## Infrastructure Context

Multi-region deployment across us-east-1 as the primary region and eu-west-1 as the secondary region for financial services compliance. The system connects existing Lambda functions and API Gateway to CloudWatch for metrics collection and log aggregation. Lambda functions send traces to X-Ray for distributed tracing. CloudWatch metric streams forward metrics between regions for cross-region visibility. SNS topics connect to CloudWatch Alarms to deliver notifications when thresholds are breached. Parameter Store integrates with CloudWatch Dashboards to version control dashboard configurations. VPC endpoints connect CloudWatch and X-Ray services to keep traffic private within the VPC. All resources authenticate through IAM roles that integrate with KMS for encryption operations. CloudFormation StackSets coordinate deployment across both regions for consistency.

## Expected Output

A CloudFormation JSON template that creates a complete observability solution with encrypted logging, multi-region dashboards, intelligent alerting, and distributed tracing capabilities suitable for financial compliance requirements.

## Platform and Language

**MANDATORY CONSTRAINTS:**
- Platform: CloudFormation
- Language: JSON
- All code MUST be CloudFormation JSON templates
- Use CloudFormation-native resources and syntax
