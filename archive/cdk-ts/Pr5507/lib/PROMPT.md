# Multi-Environment Payment Processing Infrastructure

We need to set up a payment processing system that runs across dev, staging, and production environments. The tricky part is that while the architecture should be consistent, we need different configurations for each environment - things like instance sizes, backup retention, and monitoring thresholds.

Our current setup uses AWS CDK v2 with TypeScript. We're deploying to multiple AWS regions - prod in us-east-1, staging in us-west-2, and dev in us-east-2.

## What We're Building

The core requirement is a single CDK application that can deploy the same infrastructure stack to any environment, but with environment-specific tweaks. Think of it like having one blueprint, but with different material sizes depending on whether you're building the prototype or the real thing.

Here's what each environment needs:

### Environments
- **Dev**: Small instances (t3.micro), minimal backups (1 day), shorter log retention (7 days), higher CPU thresholds (80%)
- **Staging**: Medium instances (t3.medium), weekly backups (7 days), monthly logs (30 days), moderate CPU thresholds (70%)
- **Prod**: Larger instances (t3.large), long-term backups (30 days), year-long logs (365 days), strict CPU thresholds (60%)

## Infrastructure Components

**Networking**
- VPC per environment using CIDR blocks 10.1.0.0/16 (dev), 10.2.0.0/16 (staging), 10.3.0.0/16 (prod)
- Three subnet tiers: public for NAT gateways, private for EC2 instances, and isolated for RDS databases
- Need VPC peering between environments to support cross-environment RDS read replicas

**Compute**
- EC2 instances behind an Application Load Balancer
- Auto Scaling Groups to handle traffic spikes
- Instances need SSM access for management, no public IPs

**Database**
- RDS PostgreSQL instances with environment-specific backup retention
- Cross-environment read replicas: staging reads from prod, dev reads from staging
- Database credentials stored in Secrets Manager

**Storage**
- S3 buckets with versioning enabled
- Lifecycle policies vary by environment: dev expires objects after 30 days, staging after 90 days, prod never expires
- All buckets encrypted with SSE-S3

**DNS**
- Route53 hosted zones for each environment
- Dev: dev.payment.company.com
- Staging: staging.payment.company.com  
- Prod: payment.company.com (no prefix)

**Monitoring**
- CloudWatch alarms for CPU utilization with environment-specific thresholds
- Log groups with retention periods matching each environment's needs
- SNS topics for alarm notifications

**Security & Configuration**
- IAM roles with permissions boundaries to enforce least privilege
- SSM Parameter Store for environment-specific configuration values
- Consistent resource naming: `{company}-{service}-{environment}-{resource-type}`
- Standard tags: Environment, Team (PaymentProcessing), CostCenter (Engineering)

## Technical Constraints

The CDK app needs to be driven by context variables - we can't have separate code paths for each environment. Everything should be parameterized.

We also need to ensure that when we deploy, the stack name includes the environment suffix so multiple stacks can coexist. The entry point should read the environment from CDK context and pass it through to the stack.

## Output Requirements

We need two files:
1. `bin/tap.ts` - Entry point that reads environment from context and instantiates the stack
2. `lib/tap-stack.ts` - The actual stack definition with all the resources

The stack class should be named `TapStack` and should accept an `environmentSuffix` prop. If not provided, it should fall back to reading from context, and finally default to 'dev'.

Make sure to use clear inline comments to separate the major sections - VPC setup, security groups, IAM roles, storage, database, compute, load balancer, DNS, monitoring, and configuration.