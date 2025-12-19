Create a TypeScript CDK (v2) program to deploy a monitoring & alerting stack for a payment processing platform in us-east-1.

Goal: Deliver a fully functional CDK application that builds CloudWatch-based observability: dashboards, alarms, automated notifications, log processing, custom business metrics, and long-term log retention so operations can quickly detect and respond to payment processing issues.

CORE services (mandatory — choose both):

Amazon CloudWatch (metrics, dashboards, alarms, Logs, Contributor Insights)

Amazon SNS (topics and multi-channel notifications)

OPTIONAL (0–1):

AWS Lambda (for processing logs and emitting custom metrics) — include only if required by the implementer.

MANDATORY deliverables (implement 3–5 of the following — recommended 5):

CloudWatch Dashboards showing payment transaction metrics, API latency (p50/p95/p99), and error rates across payment methods; dashboard auto-refresh = 60s, default window = last 3 hours.

CloudWatch Alarms for: payment failure rate > 1%, API response time > 500ms, and DB connection pool exhaustion.

SNS Topics with email + SMS subscriptions for critical alerts; separate topics for operational and security incidents.

Lambda functions (ARM64) that process application logs and emit custom business KPIs (e.g., payment success rate by merchant) using CloudWatch Embedded Metric Format (EMF).

CloudWatch Logs metric filters to extract error patterns and security events.

OPTIONAL / enhancement items (implement if time permits):

Composite alarms that fire only when multiple conditions hold (e.g., high error rate AND high latency).

Automated CloudWatch Logs exports to S3 for long-term retention/compliance (archive).

CloudWatch Contributor Insights rules to surface top API callers and error-producing endpoints.

Use metric math to calculate derived metrics (error rates, ratios).

Use CloudWatch Logs Insights queries for ad-hoc analysis.

Environment & assumptions:

Deploy to us-east-1.

Monitors: ECS Fargate services, RDS Aurora PostgreSQL, and API Gateway endpoints.

CDK 2.x, TypeScript, Node.js 18+, AWS CLI configured.

CloudWatch Logs groups retain 30 days by default; exports to S3 for longer retention if requested.

Non-functional constraints & implementation notes:

Use CloudWatch Embedded Metric Format (EMF) for custom business metrics.

Lambda functions must use ARM64 architecture.

All alarms must notify via SNS (email + SMS subscriptions).

Dashboard auto-refresh: 60 seconds; default time range: last 3 hours.

Use metric math for p99 and error-rate calculations.

Prefer managed/least-privilege IAM roles for Lambdas and CDK resources.

Expected output: A CDK TypeScript project (stacks + constructs) that: creates dashboards, alarms, SNS topics/subscriptions, Lambda(s) for custom metrics (if included), Logs metric filters, Contributor Insights rules (optional), and automated log exports (optional). Include README with deployment steps and a brief verification checklist for operators.