# Infrastructure as Code Task

## Platform and Language
**MANDATORY**: Use **Terraform with HCL**

## Background
A financial services company needs centralized monitoring for their distributed microservices architecture. The monitoring system must detect anomalies in real-time, trigger automated responses, and maintain compliance with audit requirements for metric retention.

## Problem Statement
Create a Terraform configuration to deploy an advanced observability platform using CloudWatch. MANDATORY REQUIREMENTS (Must complete): 1. Set up CloudWatch composite alarms that monitor at least 3 different metrics with AND/OR logic conditions (CORE: CloudWatch). 2. Deploy Lambda functions for custom metric processing with environment-specific configurations (CORE: Lambda). 3. Configure CloudWatch Metric Streams to send data to an S3 bucket with lifecycle policies. 4. Implement anomaly detectors for critical metrics with customized threshold bands. 5. Create custom CloudWatch dashboards with at least 5 widget types including annotations. 6. Set up metric filters on CloudWatch Logs with extracted values feeding custom metrics. 7. Configure SNS topics with subscription filters based on alarm severity levels. 8. Implement CloudWatch Synthetics canaries for endpoint monitoring with custom runtime versions. 9. Enable CloudWatch Container Insights for ECS task-level metrics. 10. Create cross-account metric sharing using CloudWatch cross-account observability. OPTIONAL ENHANCEMENTS (If time permits):  Add AWS X-Ray integration for distributed tracing (OPTIONAL: X-Ray) - provides end-to-end request visibility.  Implement EventBridge rules for metric-driven automation (OPTIONAL: EventBridge) - enables automated remediation.  Deploy Kinesis Data Firehose for metric archival (OPTIONAL: Kinesis Data Firehose) - improves long-term analysis. Expected output: A modular Terraform configuration that creates a production-ready observability platform with real-time anomaly detection, automated alerting, and comprehensive metric collection across multiple AWS services.

## Environment
"AWS multi-account setup deployed in us-east-1 with cross-region metric aggregation. Core services include CloudWatch (Metrics, Logs, Alarms, Synthetics, Container Insights), Lambda for custom processors, SNS for notifications. Requires Terraform 1.5+, AWS CLI v2 configured with appropriate IAM permissions. VPC endpoints for CloudWatch APIs to reduce data transfer costs. Deployment spans across 3 AWS accounts with CloudWatch cross-account observability enabled. S3 buckets in each region for metric archival with cross-region replication."

## Constraints
- All Lambda functions must use ARM-based Graviton2 processors for cost optimization
- CloudWatch alarm actions must implement a retry mechanism with exponential backoff
- Metric data retention must be 15 months for compliance with configurable storage classes
- Custom metrics must use metric math expressions to reduce the number of custom metrics created
- All resources must be tagged with CostCenter, Environment, and DataClassification tags
- CloudWatch Synthetics canaries must run from at least 2 different AWS regions
- Implement metric filtering to exclude non-production environments from alerting during maintenance windows

## Additional Requirements
- All named resources MUST include the environmentSuffix parameter for unique naming
- Infrastructure must be fully destroyable (no deletion protection or RETAIN policies)
- Follow AWS best practices for security, monitoring, and cost optimization
- Implement proper IAM least privilege policies
- Enable encryption at rest where applicable
- Configure appropriate CloudWatch logging and monitoring
