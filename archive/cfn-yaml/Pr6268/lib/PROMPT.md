I need your help designing a complete payment processing infrastructure using AWS CloudFormation, deployed entirely within a single AWS region.

The goal is to build a secure, scalable, and fault-tolerant system that can handle up to 50,000 transactions per minute with sub-second latency under peak load — compliant with PCI-DSS standards. Everything must be defined in a single CloudFormation YAML template (no nested stacks), with parameters for environment-specific settings like instance types, email alerts, and KMS keys.

Start by defining a VPC (10.0.0.0/16) spanning three Availability Zones, containing three public and three private subnets.
The public subnets will host an Application Load Balancer (ALB) and NAT Gateways, while the private subnets will run the ECS Fargate services, RDS Aurora PostgreSQL cluster, and Lambda functions.
Include VPC Endpoints for secure S3 and DynamoDB access, and attach an AWS WAF to the API Gateway for extra protection.

The RDS Aurora PostgreSQL cluster should include one writer and two reader instances (db.r5.large), with encryption at rest using a customer-managed KMS key and automatic backups enabled.
The ECS Fargate cluster will host a payment API service with a minimum of six running tasks, fronted by an ALB using path-based routing (/api/\* routes to ECS).

Deploy three Lambda functions — one for fraud detection, another for notification processing, and a third for audit logging — each with reserved concurrency configured for predictable scaling.
Then, set up an API Gateway that integrates with both ECS (for synchronous API calls) and Lambda (for asynchronous workflows).
The API Gateway must have throttling set at 10,000 requests per second and be protected by WAF rules for rate limiting and security filtering.

Create an S3 bucket for storing audit logs, with versioning enabled, KMS encryption, and lifecycle policies to transition data to Glacier after 90 days.
Add CloudWatch Log Groups with 30-day retention, CloudWatch alarms to monitor ECS, RDS, and API Gateway health, and route alerts to an SNS topic with email subscriptions.

Finally, define IAM roles with least-privilege policies for all components — ECS tasks, Lambda, RDS, API Gateway, and CloudWatch — and ensure consistent tagging across all resources (Environment, Project, CostCenter).
All services must communicate privately over the VPC network, with TLS encryption for all in-transit data.

The final CloudFormation template should produce outputs for key resources (e.g., VPC ID, ALB DNS, API Gateway endpoint, RDS endpoint, and SNS topic ARN), ensuring clean dependencies and resource ordering.
