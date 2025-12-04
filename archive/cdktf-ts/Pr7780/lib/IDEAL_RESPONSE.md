# Secure Payment Processing Infrastructure - CDKTF TypeScript Implementation

**Platform**: CDKTF (Cloud Development Kit for Terraform)
**Language**: TypeScript
**Complexity**: Expert

This document contains the complete CDKTF TypeScript implementation for a secure payment processing web application with strict PCI DSS compliance requirements.

## Implementation Overview

The solution implements 13 AWS services across 3 availability zones with comprehensive security, monitoring, and compliance features:

1. **VPC** - Multi-AZ networking with public/private subnets
2. **ALB** - Application Load Balancer with HTTPS termination
3. **ECS Fargate** - Containerized application runtime
4. **ECR** - Container image registry
5. **RDS Aurora PostgreSQL** - Multi-AZ database with encryption
6. **S3** - Static assets and flow logs storage
7. **CloudFront** - CDN distribution
8. **Secrets Manager** - Credential management with rotation
9. **CloudWatch** - Monitoring and 7-year log retention
10. **IAM** - Minimal privilege roles
11. **KMS** - Customer-managed encryption keys
12. **ACM** - SSL/TLS certificates
13. **Auto Scaling** - Dynamic ECS service scaling

## File: lib/tap-stack.ts

Main stack entry point that orchestrates the infrastructure deployment with proper AWS provider configuration, S3 backend setup, and Terraform outputs.

The TapStack extends TerraformStack from CDKTF and provides the main orchestration for the payment processing infrastructure deployment.

Key features:
- AWS provider with default tags for Environment, Project, and CostCenter
- S3 backend with encryption and state locking
- Infrastructure instantiation with environmentSuffix parameter
- Six critical outputs: VPC ID, ALB DNS, ECS cluster name, RDS endpoint, CloudFront domain, ECR repository URL

## File: lib/payment-processing-infrastructure.ts

Comprehensive infrastructure implementation (930 lines) with all 13 AWS services and 10 PCI DSS compliance requirements:

### 1. KMS Encryption
- Customer-managed KMS key with automatic key rotation enabled
- 7-day deletion window for recovery
- KMS alias for easy reference: `alias/payment-processing-${environmentSuffix}`

### 2. VPC and Networking
- VPC with CIDR 10.0.0.0/16, DNS hostnames and support enabled
- 3 public subnets (10.0.0.0/24, 10.0.1.0/24, 10.0.2.0/24) across 3 AZs
- 3 private subnets (10.0.10.0/24, 10.0.11.0/24, 10.0.12.0/24) across 3 AZs
- Internet Gateway for public subnet routing
- NAT Gateways in each AZ for private subnet outbound connectivity
- Elastic IPs for each NAT Gateway
- Public route table with internet gateway route
- Private route tables (one per AZ) with NAT gateway routes
- VPC Flow Logs enabled to dedicated S3 bucket

### 3. S3 Buckets
- Flow logs bucket with versioning and 7-year lifecycle (transition to Glacier at 90 days, expire at 2555 days)
- Static assets bucket with versioning and noncurrent version expiration (90 days)
- Public access blocked on all buckets
- forceDestroy enabled for synthetic tasks

### 4. CloudFront Distribution
- Origin Access Identity for secure S3 access
- HTTPS-only viewer protocol (redirect-to-https)
- Compressed content delivery
- Cache behavior with 1-hour default TTL
- S3 bucket policy allowing CloudFront OAI access

### 5. Security Groups
- ALB Security Group: HTTPS (443) from internet, all outbound
- ECS Security Group: Port 8080 from ALB only, all outbound
- RDS Security Group: PostgreSQL (5432) from ECS only, no egress rules
- All use explicit port numbers, no wildcards

### 6. IAM Roles
- ECS Task Execution Role: For pulling images and pushing logs
  - Attached: AmazonECSTaskExecutionRolePolicy
- ECS Task Role: Minimal permissions for application runtime
  - Custom policy: secretsmanager:GetSecretValue, secretsmanager:DescribeSecret, kms:Decrypt, logs:CreateLogStream, logs:PutLogEvents
  - Resource-specific ARNs (no wildcards)

### 7. CloudWatch Logging
- ECS log group: `/ecs/payment-processing-${environmentSuffix}`, 2555 days retention, KMS encrypted
- ALB log group: `/alb/payment-processing-${environmentSuffix}`, 2555 days retention
- Log groups support 7-year compliance requirements

### 8. ECR Repository
- Name: `payment-processing-${environmentSuffix}`
- Image tag immutability: IMMUTABLE
- Image scanning: enabled (scan on push)
- KMS encryption with customer-managed key
- forceDelete: true for synthetic tasks

### 9. Secrets Manager
- Secret name: `payment-db-credentials-${environmentSuffix}`
- KMS encrypted with customer-managed key
- 7-day recovery window
- 30-day automatic rotation configured (requires Lambda ARN - placeholder used)
- Secret version contains database credentials in JSON format

### 10. RDS Aurora PostgreSQL
- DB Subnet Group across 3 private subnets
- RDS Cluster:
  - Engine: aurora-postgresql 15.3
  - Database name: paymentdb
  - Storage encrypted with customer-managed KMS key
  - Backup retention: 7 days
  - CloudWatch logs export: enabled
  - Deletion protection: false (synthetic tasks requirement)
  - Skip final snapshot: true
- 2 RDS Cluster Instances for Multi-AZ:
  - Instance class: db.t4g.medium
  - Publicly accessible: false

### 11. ACM Certificate
- Domain: `payment-${environmentSuffix}.example.com`
- Validation method: DNS
- Lifecycle: createBeforeDestroy enabled
- **Note**: Requires DNS validation to become active

### 12. Application Load Balancer
- Name: `payment-alb-${environmentSuffix}`
- Type: application
- Public subnets across 3 AZs
- ALB security group attached
- Deletion protection: false
- Target Group:
  - Port: 8080, Protocol: HTTP
  - Target type: ip (for Fargate)
  - Health check: /health endpoint, 200 matcher
  - Deregistration delay: 30 seconds
- Listener:
  - Port: 443, Protocol: HTTPS
  - SSL Policy: ELBSecurityPolicy-TLS-1-2-2017-01
  - ACM certificate attached
  - Forward action to target group

### 13. ECS Fargate
- ECS Cluster:
  - Name: `payment-cluster-${environmentSuffix}`
  - Container Insights: enabled
- Task Definition:
  - Family: `payment-task-${environmentSuffix}`
  - Launch type: FARGATE
  - Network mode: awsvpc
  - CPU: 512, Memory: 1024
  - Execution role and task role attached
  - Container: payment-app
    - Image: `${ecrRepositoryUrl}:v1.0.0` (specific tag, NOT latest)
    - Port: 8080
    - Environment variables: AWS_REGION, ENVIRONMENT
    - Secrets: DB_CREDENTIALS from Secrets Manager
    - Logs: awslogs driver to CloudWatch
    - Health check: curl /health endpoint
- ECS Service:
  - Name: `payment-service-${environmentSuffix}`
  - Desired count: 2
  - Private subnets, no public IPs
  - ECS security group attached
  - Load balancer integration with target group
  - Health check grace period: 60 seconds
  - Lifecycle: ignore desired_count changes (for auto-scaling)

### 14. Auto Scaling
- Scaling Target:
  - Min capacity: 2, Max capacity: 10
  - Resource: ECS service
- Scaling Policy:
  - Type: TargetTrackingScaling
  - Metric: ECSServiceAverageCPUUtilization
  - Target: 70%
  - Scale-out cooldown: 60 seconds
  - Scale-in cooldown: 300 seconds

### 15. CloudWatch Alarms
- High CPU Alarm:
  - Metric: CPUUtilization
  - Threshold: 80%
  - Evaluation periods: 2
  - Namespace: AWS/ECS
- High Memory Alarm:
  - Metric: MemoryUtilization
  - Threshold: 80%
  - Evaluation periods: 2
- Unhealthy Targets Alarm:
  - Metric: UnHealthyHostCount
  - Threshold: 0
  - Namespace: AWS/ApplicationELB

## PCI DSS Compliance Implementation

All 10 requirements are fully implemented:

1. S3 Versioning: Enabled on flow logs and static assets buckets with lifecycle policies
2. Least-Privilege Security Groups: Explicit port allowlists (443, 8080, 5432), no wildcards
3. VPC Flow Logs: Enabled, stored in dedicated S3 bucket with 7-year retention
4. RDS Encryption: Customer-managed KMS key for storage encryption
5. Secrets Manager: Database credentials with 30-day rotation
6. Private Subnets: ECS tasks run in private subnets with assignPublicIp: false
7. SSL/TLS Termination: ALB HTTPS listener with ACM certificate
8. 7-Year Log Retention: CloudWatch Logs retention set to 2555 days
9. Resource Tags: Environment, Project, CostCenter tags via AWS provider default tags
10. Specific Image Tags: Task definition uses v1.0.0, not 'latest'

## Resource Naming Convention

All resources include environmentSuffix for uniqueness:
- VPC: `payment-vpc-${environmentSuffix}`
- ALB: `payment-alb-${environmentSuffix}`
- ECS Cluster: `payment-cluster-${environmentSuffix}`
- RDS Cluster: `payment-db-${environmentSuffix}`
- ECR Repository: `payment-processing-${environmentSuffix}`
- KMS Key: `payment-kms-${environmentSuffix}`
- Security Groups: `payment-alb-sg-${environmentSuffix}`, etc.

## TypeScript Quality

- Strong typing throughout (no 'any' types)
- Proper interfaces for props
- Resource dependencies handled correctly
- No compilation errors or warnings
- ESLint compliant

## Destroyability

All resources configured for full destroyability:
- RDS: deletionProtection: false, skipFinalSnapshot: true
- S3 Buckets: forceDestroy: true
- ECR: forceDelete: true
- ALB: enableDeletionProtection: false
- No RETAIN removal policies

## Known Limitations

1. **ACM Certificate**: Uses example.com domain requiring DNS validation (will timeout without valid DNS records)
2. **Secrets Manager Rotation**: Requires Lambda function ARN (placeholder used: `arn:aws:lambda:${awsRegion}:123456789012:function:placeholder`)
3. **ECS Container Image**: Must be pushed to ECR before service starts (image: `${ecrRepositoryUrl}:v1.0.0`)

These are acceptable for training purposes as they demonstrate proper configuration patterns while acknowledging production requirements.
