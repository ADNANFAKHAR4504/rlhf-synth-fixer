# Monitoring and Observability Infrastructure

## Background

A fintech startup is experiencing intermittent performance issues with their payment processing microservices. They need a comprehensive monitoring solution to track application metrics, set up intelligent alerting, and visualize system health across their distributed architecture.

## Problem Statement

Create a Pulumi TypeScript program to deploy a monitoring and observability stack for a payment processing system. The configuration must:

1. Set up CloudWatch Log Groups for three microservices (payment-api, fraud-detector, notification-service) with 30-day retention and KMS encryption.
2. Configure X-Ray tracing for all services with sampling rules that capture 100% of error traces and 10% of successful traces.
3. Create custom CloudWatch metrics from log data using metric filters to track payment success rates, fraud detection rates, and notification delivery rates.
4. Deploy Lambda functions (ARM-based) to aggregate metrics across services every 5 minutes.
5. Set up CloudWatch dashboards with widgets for service health, payment volume trends, and cross-service latency percentiles.
6. Configure SNS FIFO topics for critical alerts (payment failures, fraud spike, service degradation).
7. Create composite CloudWatch alarms that trigger only when multiple conditions are met to reduce alert fatigue.
8. Implement metric math expressions to calculate derived metrics like payment conversion rates.
9. Set up CloudWatch Insights queries as saved queries for common troubleshooting scenarios.
10. Configure CloudWatch Events rules to trigger Lambda functions for automated remediation of known issues.

Expected output: A complete Pulumi program that creates all monitoring infrastructure with proper resource dependencies, exports key resource ARNs and dashboard URLs, and implements all security and tagging requirements.

## Environment

Production monitoring infrastructure deployed in us-east-1 for a payment processing system. Uses CloudWatch for metrics and logs, X-Ray for distributed tracing, SNS for alerting, and Lambda for custom metric processing. Requires Pulumi 3.x with TypeScript, Node.js 18+, and AWS CLI configured. Infrastructure spans multiple microservices deployed on ECS Fargate in a VPC with private subnets. KMS encryption required for all log data.

## AWS Services Required

- CloudWatch Logs
- CloudWatch Metrics
- CloudWatch Dashboards
- CloudWatch Alarms
- CloudWatch Metric Filters
- X-Ray Sampling Rules
- SNS FIFO Topics
- KMS
- Lambda (ARM-based Graviton2)
- EventBridge
- IAM

## Mandatory Constraints

1. All resources must be tagged with Environment, Service, and Owner tags
2. SNS topics must use FIFO queues for alert ordering guarantees
3. Lambda functions for metric aggregation must use ARM-based Graviton2 processors

## Optional Constraints

1. Alarms must implement composite alarms for reducing false positives
2. All metrics must be exported to CloudWatch with custom namespaces per service
3. Metric filters must extract custom business metrics from application logs
4. CloudWatch Logs must retain logs for exactly 30 days with automatic expiration
5. Log groups must use KMS encryption with customer-managed keys
6. CloudWatch dashboards must be organized by service domain with cross-service views
7. Use AWS X-Ray for distributed tracing across all microservices

## Expected Deliverables

1. Complete Pulumi TypeScript infrastructure code
2. Proper resource dependencies and relationships
3. Exported outputs for key resource ARNs and dashboard URLs
4. Implementation of all security requirements (KMS encryption, IAM policies)
5. All mandatory tagging requirements applied
6. ARM-based Lambda functions for metric aggregation
7. FIFO SNS topics for ordered alerting
8. Composite alarms to reduce false positives
9. Custom CloudWatch dashboards with service-specific and cross-service views
10. X-Ray tracing configuration for distributed service monitoring
