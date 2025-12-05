# Infrastructure Analysis and Monitoring System

Create a Pulumi TypeScript program to deploy an automated infrastructure analysis system. The configuration must:

1. Create CloudWatch dashboards that monitor CPU, memory, and network metrics across EC2 instances in multiple regions.

2. Deploy Lambda functions that analyze CloudWatch metrics every hour and identify resources exceeding 80% utilization.

3. Set up CloudWatch alarms for critical thresholds on database connections, API Gateway latency, and Lambda error rates.

4. Configure SNS topics to send analysis reports to different teams based on severity levels.

5. Implement IAM roles with least-privilege access for Lambda functions to read CloudWatch metrics.

6. Create CloudWatch Logs Insights queries to detect error patterns in application logs.

7. Deploy a Lambda function that generates weekly infrastructure health reports in JSON format.

8. Configure metric filters to track custom application metrics and API usage patterns.

## Requirements

- Platform: Pulumi
- Language: TypeScript
- Complexity: Hard
- Subtask: Infrastructure QA and Management
- Subject Labels: Infrastructure Analysis/Monitoring

## AWS Services Expected

This task will likely involve:
- CloudWatch (dashboards, metrics, alarms, logs)
- Lambda (analysis functions)
- SNS (notifications)
- IAM (roles and policies)
- EC2 (monitoring targets)
- API Gateway (monitoring targets)