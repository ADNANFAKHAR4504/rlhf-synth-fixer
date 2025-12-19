**Project:** CDK (TypeScript) – CloudWatch dashboards for multi-service monitoring

## High-level architecture

Help write an AWS CDK application in TypeScript that deploys a centralized monitoring and alerting system for a startup managing roughly 10,000 daily API and database interactions. The solution should leverage **Amazon CloudWatch Dashboards** for unified visibility across **API Gateway**, **Lambda**, and **RDS**, with alarms, alerting, and log persistence.

Use **CloudWatch Dashboards** to visualize metrics for latency, error rates, invocations, and database performance. Configure **CloudWatch Alarms** for high latency or increased error counts, and route alerts through **Amazon SNS** topics for email or messaging notifications. Store alert logs and related metadata in **DynamoDB** to provide historical visibility and tracking.

Integrate **EventBridge** to automate scheduled reporting or periodic dashboard updates. Implement **IAM roles and policies** following least-privilege principles to secure metric collection, alert publishing, and dashboard updates.

## Functional requirements

1. A CloudWatch Dashboard aggregating metrics from API Gateway, Lambda, and RDS with latency, error, and throughput graphs.
2. CloudWatch Alarms that trigger when latency exceeds defined thresholds or when 5xx error rates increase.
3. SNS Topics and subscriptions to notify relevant stakeholders on alarm states.
4. DynamoDB table to log alerts, timestamps, and affected components for audit purposes.
5. EventBridge rules to schedule daily health checks or summary event notifications.
6. IAM configuration granting CDK-managed roles scoped access to CloudWatch, SNS, and DynamoDB resources.
7. Modular, easily extendable CDK design allowing additional services to be integrated into dashboards later.

## Acceptance criteria

- CDK synth and deploy complete successfully without errors.
- Dashboard displays real-time metrics for API Gateway, Lambda, and RDS.
- CloudWatch Alarms trigger under simulated latency/error conditions.
- SNS notifications are delivered correctly when alarms are triggered.
- DynamoDB stores alert log entries with timestamps and event details.
- IAM policies validated for least privilege; no excessive permissions granted.
- EventBridge rules successfully trigger scheduled monitoring events.
