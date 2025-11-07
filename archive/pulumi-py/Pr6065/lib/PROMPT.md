Hey there! We’d like you to build a robust observability infrastructure using Pulumi with Python for a payment processing system IN MIND.

Please implement:

- CloudWatch Log Groups with 90-day retention for PROCESSING tasks, Lambda functions, and API Gateway access logs.
- Custom CloudWatch metrics for transaction volume, processing time, and error rates, each with 1-minute resolution.
- CloudWatch Alarms for key thresholds: error rates above 1%, API latency above 500ms, and database connection failures.
- A CloudWatch Dashboard with real-time widgets displaying transaction metrics, system health, and API performance, refreshing every 60 seconds.
- SNS topics for alert routing, sending notifications to both email and Slack webhook endpoints.
- CloudWatch Logs Insights query definitions for common troubleshooting scenarios.
- Metric filters on log groups to extract key business metrics from structured application logs.
- Composite alarms that activate only when multiple related conditions are met, reducing false positives.
- X-Ray tracing enabled for distributed transaction flow visibility.
- EventBridge rules capturing all AWS API calls for compliance auditing.
- Organized Pulumi stacks separating metrics, alarms, and dashboards for maintainability and cost efficiency.

Expected output:

- A Pulumi Python solution that provisions all observability and monitoring components, and adheres to compliance requirements with at least 90-day metric retention.
- A modular and well architected solution that follows best practices.
