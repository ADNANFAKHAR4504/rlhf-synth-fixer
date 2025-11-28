# Payment Dashboard Infrastructure Request

I need help building out a payment processing infrastructure for our fintech application. We're handling sensitive financial data, so everything needs to be PCI-DSS compliant and locked down tight.

## What We're Building

The core requirement is a secure, highly available payment dashboard that runs on ECS Fargate. The application needs to sit behind an Application Load Balancer with WAF protection, connect to an Aurora MySQL database, and serve static assets through CloudFront. We also need comprehensive monitoring, auto-scaling, and X-Ray tracing throughout the stack.

## Technical Requirements

**Networking:**
- VPC with three tiers: public subnets for the load balancer, private subnets for ECS tasks, and isolated subnets for the database
- Deploy across 3 availability zones for high availability
- Enable VPC Flow Logs to CloudWatch for security auditing
- Optionally add VPC endpoints for S3, Secrets Manager, and Systems Manager to keep traffic off the internet

**Compute:**
- ECS Fargate cluster running the payment dashboard container
- Each task should have 4 vCPU and 8GB memory (though we can scale this down for dev/test)
- Tasks should run in private subnets with no public IPs
- Auto-scaling configured: minimum 3 tasks, maximum 12, scaling on CPU (70%) and memory (80%)

**Load Balancing & Security:**
- Application Load Balancer in public subnets with HTTPS listeners
- ACM certificate for SSL/TLS termination
- AWS WAF with rules for SQL injection and XSS protection
- HTTP to HTTPS redirect

**Database:**
- Aurora MySQL cluster in isolated subnets
- Multi-AZ deployment (at least 2 instances)
- Encryption at rest using KMS
- 35-day backup retention (can be reduced for dev/test)
- Database credentials managed through Secrets Manager with 30-day rotation

**Content Delivery:**
- S3 bucket for static assets with KMS encryption
- CloudFront distribution with Origin Access Identity
- HTTPS-only access
- API routes proxied to the ALB

**Observability:**
- AWS X-Ray tracing enabled across the entire request flow
- CloudWatch dashboards showing transaction latency (p50/p90/p99), error rates, ECS metrics, and database metrics
- CloudWatch alarms for unhealthy hosts, high 5xx rates, high latency, CPU, and memory
- SNS topic for critical alerts with email subscriptions

**Configuration Management:**
- SSM Parameter Store for application configuration (API endpoints, feature flags)
- Secrets Manager for database credentials

**Security & Compliance:**
- Least-privilege IAM policies (no wildcards)
- Separate IAM roles for ECS tasks, execution, and any other services
- GuardDuty and Security Hub enabled (though these may already be enabled at account level)

## Deployment Strategy

We want blue/green deployments using CodeDeploy with automatic rollback on CloudWatch alarms. The deployment should use weighted target groups behind the ALB.

## Deliverables

I need two TypeScript files:
1. `main.ts` - CDK app entrypoint with environment configuration and tagging
2. `tapstack.ts` - Complete infrastructure stack with all the components wired together

The stack should be flexible enough to work with different environment suffixes (dev, staging, prod) and should output the ALB DNS name, CloudFront URL, Aurora endpoint, and other key identifiers.

Use AWS CDK v2 with TypeScript, and make sure all resources are properly tagged for cost allocation and compliance tracking.
