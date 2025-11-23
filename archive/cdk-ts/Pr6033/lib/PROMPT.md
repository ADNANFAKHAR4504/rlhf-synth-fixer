Context
A financial services platform in us-east-1 runs 12 ECS Fargate services behind an ALB across three AZs. Tasks are over-provisioned outside trading hours, driving up spend. The objective is to keep latency SLOs during market hours while cutting costs off-hours using time-based and metrics-based scaling, Fargate Spot, and tighter cooldowns—without changing service names, task family names, images, or ALB health checks.

Requirements
Implement a CDK Python stack that:

Schedules capacity: scale to 10 tasks from 09:00–17:00 EST (peak) and down to 2 tasks from 18:00–08:00 EST (off-peak) using cron expressions.

Adds target tracking on CPU and Memory: scale-out at 60%, scale-in at 20%.

Adds step scaling with three steps for sudden spikes.

Uses capacity providers (FARGATE, FARGATE_SPOT) with strategy bias toward Spot when safe.

Preserves existing ECS service names, task family names, container images, and ALB health check configuration.

Applies a 60-second target deregistration delay for graceful shutdown.

Sets cooldowns: 300 seconds (scale-in) and 60 seconds (scale-out).

Configures CloudWatch Cost Anomaly Detection with SNS alerts.

Builds a CloudWatch dashboard showing task count, CPU/Memory, request rate, 5xx errors, and cost signals.

Applies cost allocation tags (Service, Environment) and least-privilege IAM for scaling, metrics, and notifications.

Demonstrates at least 40% cost reduction off-hours while maintaining performance during 09:00–17:00 EST.

Actions
Create a CDK Python application that attaches to the existing ECS cluster and services in us-east-1 and adds:

Capacity provider strategy (FARGATE + FARGATE_SPOT) per service.

Application Auto Scaling policies: target tracking (CPU, Memory), step scaling (three steps), and scheduled scaling for peak/off-peak in EST.

ALB target group attribute for 60-second deregistration delay only.

CloudWatch alarms (e.g., HTTP 5xx > 1%, p90 latency breach) tied to SNS and used for rollback signals.

CloudWatch dashboard with per-service widgets and cost indicators.

IAM roles/policies limited to describe, scale, publish metrics, and SNS publish to the topic.

Global tags: Service and Environment on all new resources.

No changes to images, names, or existing health checks.

Format
Return only code, no explanation. Provide these files:

app.py — CDK app entry targeting us-east-1.

lib/cost_optimized_ecs_stack.py — full implementation of the scaling, alarms, dashboard, capacity providers, IAM, and tags.

cdk.json — standard CDK config pointing to app.py.

Tone
Direct and implementation-focused. Concise, human, and ready to hand to an engineer.