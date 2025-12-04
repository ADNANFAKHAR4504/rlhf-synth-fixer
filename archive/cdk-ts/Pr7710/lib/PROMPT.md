Task: Production-Ready E-Commerce Infrastructure Using CDK (Single TapStack)

Create a single, self-contained CDK TypeScript stack (TapStack) that deploys a production-ready e-commerce web application infrastructure using AWS managed services.

Requirements Core Infrastructure

VPC:

2 Public Subnets (10.0.1.0/24, 10.0.2.0/24)

2 Private Subnets (10.0.3.0/24, 10.0.4.0/24)

Spanning us-east-1a and us-east-1b AZs

Proper routing for ECS tasks, RDS, and ALB

Compute & Networking

Application Load Balancer (ALB):

Deployed in public subnets

Path-based routing:

/api/* → ECS Target Group

/health → Fixed 200 OK response

Integrated security groups and listener rules

ECS Fargate Service:

Runs Node.js container (ECR image)

Task size: 1 vCPU, 2 GB memory

Auto-scaling based on CPU utilization:

Scale-out: ≥70%

Scale-in: ≤30%

Connected to RDS via private subnets

Data Layer

RDS Aurora Serverless v2 (PostgreSQL 15):

Private subnets only

Auto-pause enabled

Capacity range: 0.5–1 ACU

Encrypted with AWS-managed KMS key

Secrets Manager:

Stores RDS credentials

Lambda rotation function enabled

Grants read access to ECS task role

Storage & Content Delivery

S3 Bucket:

Hosts static frontend assets

Versioning enabled

Lifecycle rule: transition to IA after 30 days

CloudFront Distribution:

Uses Origin Access Identity (OAI) to access S3

Cache behavior for .js and .css (TTL: 86400s)

Default behavior for all other assets

API Management

API Gateway REST API:

Proxy integration with ALB

Throttling and usage plans with API key requirement

Rate limit example: 1000 RPS burst

Monitoring & Notifications

CloudWatch Dashboard:

Displays:

ECS service CPU/memory metrics

RDS connections

ALB request count

API Gateway 4XX/5XX errors

CloudWatch Alarms + SNS Notifications:

SNS Topic with email subscription

Triggers on high CPU, DB connections, and error rates

Security & Access

IAM Roles and Policies:

Least privilege for ECS tasks, Lambda, and API Gateway

KMS:

Encrypts all sensitive resources (S3, RDS, Secrets, Logs)

Tags & Configurations

Environment tagging for cost allocation

Environment context variables for flexible configuration

All resources synthesized and deployed from a single CDK stack

Expected Output

A single CDK TypeScript application (TapStack) that:

Synthesizes all AWS resources in one deployable stack

Produces a functional, production-ready web infrastructure

Supports deployment with cdk deploy

Uses best practices for security, networking, and observability