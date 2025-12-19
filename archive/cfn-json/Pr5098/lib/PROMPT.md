Build a single-stack JSON (prod, us-east-1) regulatory reporting platform that generates ~2,000 reports/day across jurisdictions. Use only essential services:
Step Functions to orchestrate: generate -> validate -> deliver -> confirm
Lambda to render reports & apply rules per jurisdiction
Aurora Serverless v2 as the central reporting DB
S3 for storing reports (versioned, 10-year retention)
SES for delivering reports or regulator notifications
CloudWatch for success/failure metrics + alarms
CloudTrail for audit trail
EventBridge for daily scheduling

Goals
Generate ~2k reports daily
Validate before delivery (simple rules, not full engine)
Deliver with success logging and confirmation capture
Store all reports & confirmations with auditability
Monthly summary export instead of real-time dashboards

Deliverable
One JSON IaC stack wiring Step Functions, Lambda, Aurora, S3, SES, EventBridge, CloudWatch, CloudTrail, and KMS - plus simple sample Lambdas for generation, validation, and delivery.
