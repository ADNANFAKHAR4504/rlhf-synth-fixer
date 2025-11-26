# Task: Advanced Observability Platform for Microservices

## Problem Statement
Create a CDKTF Python program to deploy an advanced observability platform for microservices monitoring.

## Context
A fintech startup needs centralized monitoring for their distributed microservices architecture. They require real-time alerting for API performance degradation, custom metrics tracking for business KPIs, and automated incident response workflows to maintain their 99.95% uptime SLA.

## MANDATORY REQUIREMENTS (Must complete)

1. Create CloudWatch dashboard with multi-widget layout showing API latency P50/P90/P99, error rates, and request counts (CORE: CloudWatch)
2. Configure service map with custom segments for database queries, external API calls, and business logic (CORE: X-Ray)
3. Deploy Lambda function that processes CloudWatch alarms and automatically scales EC2 tasks based on metrics (CORE: Lambda)
4. Set up composite alarms that combine multiple metrics (CPU > 80% AND memory > 85% for 5 minutes)
5. Implement CloudWatch Logs metric filters to extract custom business metrics from application logs
6. Create SNS topic with email and Lambda subscriptions for multi-channel alerting
7. Configure CloudWatch Synthetics canary for endpoint monitoring with 5-minute intervals
8. Enable Container Insights for EC2 Auto Scaling groups with enhanced monitoring
9. Set up cross-account monitoring role for centralized observability
10. Implement anomaly detector for automatic baseline creation

## OPTIONAL ENHANCEMENTS (If time permits)

- Add EventBridge rules for alarm state changes (OPTIONAL: EventBridge) - enables workflow automation
- Implement Systems Manager OpsCenter integration (OPTIONAL: Systems Manager) - centralizes incident management
- Create Kinesis Data Firehose for log archival to S3 (OPTIONAL: Kinesis) - enables long-term analysis

## Infrastructure Details
Production monitoring infrastructure deployed in us-east-1 with CloudWatch for metrics and logs, X-Ray for distributed tracing, SNS for alerting, and Lambda for automated remediation. Requires Python 3.9+, CDKTF 0.20+, AWS CLI configured with appropriate permissions. Monitors Lambda functions across 3 availability zones with ALB health checks. VPC flow logs enabled for network monitoring. CloudWatch Logs Insights used for log analysis with 30-day retention.

## Constraints
- All Lambda functions must have tracing enabled with custom segments
- CloudWatch dashboards must auto-update when new services are deployed
- SNS topics must use FIFO queues for ordered alert processing
- Custom metrics must use EMF (Embedded Metric Format) for cost optimization
- Alarm actions must trigger both notifications and automated remediation
- Log groups must implement metric filters for error rate calculation
- All monitoring resources must be tagged with cost-center and environment

## Expected Output
CDKTF Python application that deploys a complete observability solution with real-time dashboards, intelligent alerting, distributed tracing, and automated remediation capabilities. The solution should provide full visibility into application performance, business metrics, and infrastructure health.
