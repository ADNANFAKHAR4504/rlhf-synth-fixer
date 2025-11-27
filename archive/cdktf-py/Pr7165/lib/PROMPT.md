# Task: Security, Compliance, and Governance

## Task Description (Problem)
Create a CDKTF Python program to deploy an observability stack for payment processing infrastructure. MANDATORY REQUIREMENTS (Must complete): 1. Configure CloudWatch Logs with KMS encryption for API Gateway, Lambda, and RDS logs (CORE: CloudWatch) 2. Create service map with custom segments tracking payment flow stages (CORE: ) 3. Deploy CloudWatch Synthetics canary checking /health endpoint every 5 minutes 4. Build custom dashboard with widgets for API latency, Lambda errors, and DB connections 5. Implement metric filters extracting latency percentiles (p50, p95, p99) from logs 6. Create composite alarms combining API errors > 5% OR Lambda errors > 10% 7. Configure SNS topic with email subscriptions for alarm notifications 8. Set 90-day retention on all log groups with lifecycle policies 9. Add custom metrics from Lambda using boto3 cloudwatch.put_metric_data 10. Apply consistent tags: Environment=production, CostCenter=payments OPTIONAL ENHANCEMENTS (If time permits): • Add EventBridge rules for alarm state changes (OPTIONAL: EventBridge) - enables automated responses • Implement CloudWatch Contributor Insights for API caller analysis (OPTIONAL: Contributor Insights) - identifies top API users • Create CloudWatch Anomaly Detector for payment volume (OPTIONAL: Anomaly Detector) - detects unusual patterns Expected output: CDKTF Python code that deploys a complete observability solution with encrypted logging, distributed tracing, synthetic monitoring, and intelligent alerting for the payment infrastructure.

## Background
A financial technology company needs to implement comprehensive monitoring for their payment processing infrastructure. The system must track API performance, database queries, and Lambda function executions while maintaining compliance with financial audit requirements.

## Environment
"Production monitoring infrastructure deployed in us-east-1 for a payment processing system. Monitors API Gateway REST APIs, Lambda functions processing transactions, and RDS Aurora PostgreSQL database. Requires Python 3.9+, CDKTF 0.20+, AWS CLI configured with appropriate permissions. Infrastructure includes CloudWatch dashboards, alarms, synthetics canaries, and service map. KMS keys for encryption at rest. SNS topics for multi-channel alerting including email and SMS. VPC endpoints for private CloudWatch access."

## Constraints
["All CloudWatch alarms must use SNS topics with at least two email subscriptions", "Lambda functions must have tracing enabled with custom segments", "CloudWatch Logs must use KMS encryption with customer-managed keys", "Metric filters must extract latency, error rate, and request count from API Gateway logs", "Dashboard must auto-refresh every 60 seconds with 5-minute granularity", "All log groups must have 90-day retention for compliance", "Alarms must implement composite alarms for critical path monitoring", "Use CloudWatch Synthetics for endpoint health checks every 5 minutes", "Implement custom CloudWatch metrics using PutMetricData from Lambda", "All resources must use consistent tagging with Environment and CostCenter tags"]

## Platform Requirements
- Platform: CDKTF
- Language: Python
- Complexity: expert
- Subject Labels: []
