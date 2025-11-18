# Payment Processing Web Application - Infrastructure Solution

## Overview

This solution provides a complete, production-ready infrastructure for a secure payment processing web application deployed on AWS using Pulumi TypeScript. The infrastructure is designed to meet PCI DSS compliance requirements while ensuring high availability, scalability, and security.

## Architecture Summary

The solution deploys a multi-tier, highly available architecture across 3 availability zones with the following components:

- **Networking Layer**: Custom VPC with public and private subnets
- **Application Layer**: ECS Fargate cluster with auto-scaling
- **Data Layer**: RDS Aurora PostgreSQL with Multi-AZ deployment
- **Content Delivery**: CloudFront distribution with S3 static assets
- **Security Layer**: KMS encryption, Secrets Manager, Security Groups
- **Monitoring Layer**: CloudWatch Logs, Metrics, and Alarms
- **Compliance Layer**: VPC Flow Logs, 7-year log retention

## Components Implemented

### 1. VPC and Networking

**Resources Created:**
- 1 VPC (10.0.0.0/16 CIDR)
- 3 Public subnets across 3 AZs (10.0.0.0/24, 10.0.1.0/24, 10.0.2.0/24)
- 3 Private subnets across 3 AZs (10.0.10.0/24, 10.0.11.0/24, 10.0.12.0/24)
- 1 Internet Gateway
- 3 NAT Gateways (one per AZ) with Elastic IPs
- Route tables and associations for public/private traffic

**Design Decisions:**
- Multi-AZ deployment ensures high availability
- NAT Gateways in each AZ prevent single point of failure
- Private subnets for ECS and RDS ensure no direct internet exposure

### 2. Application Load Balancer

**Resources Created:**
- Application Load Balancer in public subnets
- Target group for ECS tasks (port 8080)
- HTTP listener (port 80) with redirect to HTTPS
- HTTPS listener (port 443) with SSL/TLS termination
- ACM certificate for domain validation

**Design Decisions:**
- SSL/TLS termination at ALB level
- HTTP to HTTPS redirect for security
- Health checks configured for /health endpoint
- Security policy: ELBSecurityPolicy-TLS13-1-2-2021-06

### 3. ECS Fargate Cluster

**Resources Created:**
- ECS cluster with Container Insights enabled
- Task definition (512 CPU, 1024 MB memory)
- ECS service with 2 initial tasks
- Task execution role with Secrets Manager access
- Task role with S3 access permissions

**Design Decisions:**
- Fargate eliminates server management overhead
- Tasks run in private subnets with no public IPs
- Specific image tag (v1.0.0) instead of 'latest' for compliance
- Health checks at both container and target group levels
- Container Insights for advanced monitoring

### 4. RDS Aurora PostgreSQL

**Resources Created:**
- Aurora PostgreSQL cluster (version 15.4)
- 2 Aurora Serverless v2 instances (Multi-AZ)
- DB subnet group in private subnets
- Cluster parameter group with logging configuration
- Customer-managed KMS key for encryption

**Design Decisions:**
- Serverless v2 for faster provisioning (0.5-2 ACU scaling)
- Multi-AZ deployment for high availability
- Storage encrypted with customer-managed KMS key
- CloudWatch Logs export for PostgreSQL logs
- 7-day backup retention
- skipFinalSnapshot: true for destroyability

### 5. S3 Buckets and CloudFront

**Resources Created:**
- S3 bucket for static assets with versioning
- S3 bucket for VPC Flow Logs with versioning
- CloudFront distribution with Origin Access Identity
- S3 bucket policies for CloudFront access
- Lifecycle policies for cost optimization

**Design Decisions:**
- CloudFront for global content delivery
- S3 versioning for data protection
- Public access blocked on all buckets
- Server-side encryption (AES256)
- Lifecycle transitions to GLACIER for flow logs

### 6. Secrets Manager

**Resources Created:**
- Secret for database credentials
- Secret version with initial credentials
- IAM role for secret rotation (prepared for Lambda)

**Design Decisions:**
- Centralized credential management
- Ready for 30-day automatic rotation
- Secrets accessible only to ECS execution role
- JSON format for structured credential storage

### 7. CloudWatch Logs and Monitoring

**Resources Created:**
- Log group for ECS tasks (7-year retention)
- Log group for application logs (7-year retention)
- 3 CloudWatch alarms (CPU, memory, unhealthy targets)

**Design Decisions:**
- 2555 days (7 years) retention for PCI DSS compliance
- Structured logging with awslogs driver
- Alarms for proactive monitoring
- Container Insights for detailed ECS metrics

### 8. VPC Flow Logs

**Resources Created:**
- VPC Flow Logs capturing ALL traffic
- Dedicated S3 bucket for flow logs
- IAM role for Flow Logs service
- Lifecycle policy for 7-year retention

**Design Decisions:**
- All traffic captured (ACCEPT, REJECT, ALL)
- S3 destination for long-term storage
- Automatic archival to GLACIER after 90 days
- 7-year retention for compliance audit trails

### 9. IAM Roles and Policies

**Resources Created:**
- ECS Task Execution Role (pull images, read secrets)
- ECS Task Role (application permissions)
- VPC Flow Logs Role (write to S3)
- Secrets Manager Rotation Role (prepared)

**Design Decisions:**
- Least-privilege principle applied throughout
- Separate roles for execution vs. application concerns
- Managed policies used where appropriate
- Custom policies for specific S3/Secrets access

### 10. Security Groups

**Resources Created:**
- ALB Security Group (ports 80, 443 from internet)
- ECS Security Group (port 8080 from ALB only)
- RDS Security Group (port 5432 from ECS only)

**Design Decisions:**
- Explicit allow rules only
- No direct internet access to ECS or RDS
- Security group chaining (ALB → ECS → RDS)
- Descriptive rule descriptions for audit

### 11. Auto Scaling

**Resources Created:**
- Application Auto Scaling target (2-10 tasks)
- CPU-based scaling policy (target: 70%)
- Memory-based scaling policy (target: 80%)

**Design Decisions:**
- Target tracking policies for automatic scaling
- Conservative cooldown periods (300s scale-in, 60s scale-out)
- Separate policies for CPU and memory metrics
- Minimum 2 tasks for high availability

### 12. CloudWatch Alarms

**Resources Created:**
- High CPU alarm (threshold: 80%)
- High memory alarm (threshold: 85%)
- Unhealthy target alarm (threshold: > 1)

**Design Decisions:**
- 2 evaluation periods to avoid false positives
- Thresholds set conservatively
- Alarms support incident response and auto-scaling

## PCI DSS Compliance Features

1. **Encryption at Rest**: RDS uses customer-managed KMS keys
2. **Encryption in Transit**: ALB terminates SSL/TLS with strong cipher policy
3. **Network Segmentation**: Private subnets isolate sensitive workloads
4. **Access Controls**: Security groups enforce least-privilege network access
5. **Audit Logging**: VPC Flow Logs and CloudWatch Logs with 7-year retention
6. **Secrets Management**: Database credentials in Secrets Manager with rotation
7. **Monitoring**: CloudWatch alarms for security and performance events
8. **Versioning**: S3 versioning protects against accidental deletion
9. **Tagging**: All resources tagged for tracking and compliance

## Resource Naming Convention

All resources follow the pattern: `{component}-{resource-type}-{environmentSuffix}`

Examples:
- VPC: `payment-vpc-dev`
- ALB: `payment-alb-dev`
- ECS Cluster: `payment-cluster-dev`
- RDS Cluster: `payment-db-cluster-dev`
- S3 Buckets: `payment-static-assets-dev`, `payment-flow-logs-dev`

This ensures:
- Unique names across environments
- Easy identification of resources
- No naming conflicts during parallel deployments

## Deployment Instructions

### Prerequisites

1. Pulumi CLI version 3.x or later
2. Node.js version 18 or later
3. AWS CLI configured with appropriate credentials
4. AWS IAM permissions for all required services

### Steps

```bash
# Install dependencies
npm install

# Configure environment
export ENVIRONMENT_SUFFIX=dev

# Deploy infrastructure
pulumi up --yes

# Verify outputs
pulumi stack output
```

## Outputs

The stack exports the following outputs:

- `vpcId`: VPC identifier
- `albDnsName`: Application Load Balancer DNS name
- `albUrl`: Full HTTPS URL for ALB
- `ecsClusterArn`: ECS cluster ARN
- `ecsClusterName`: ECS cluster name
- `ecsServiceName`: ECS service name
- `rdsEndpoint`: RDS cluster endpoint
- `rdsClusterIdentifier`: RDS cluster identifier
- `cloudfrontDomainName`: CloudFront distribution domain
- `cloudfrontUrl`: Full HTTPS URL for CloudFront
- `ecrRepositoryUrl`: ECR repository URL for container images
- `secretArn`: Secrets Manager secret ARN
- `staticAssetsBucket`: S3 bucket name for static assets
- `flowLogsBucket`: S3 bucket name for VPC flow logs
- `kmsKeyId`: KMS key ID for encryption

## Security Best Practices

1. **Network Security**: ECS tasks in private subnets with no public IPs
2. **Data Security**: RDS encryption with customer-managed KMS keys
3. **Access Control**: IAM roles with least-privilege permissions
4. **Monitoring**: VPC Flow Logs and CloudWatch Logs with 7-year retention
5. **Operational Security**: Specific image tags, image scanning in ECR

## Cost Optimization

1. Aurora Serverless v2 scales from 0.5 to 2 ACU based on demand
2. S3 Lifecycle Policies transition to GLACIER after 90 days
3. CloudFront reduces ALB bandwidth costs
4. Auto Scaling scales down during low-traffic periods

## Destroyability

All resources are configured for easy cleanup:
- No deletion protection on ALB
- RDS `skipFinalSnapshot: true`
- No RETAIN policies on any resources
- KMS key deletion window: 7 days (minimum)

To destroy:
```bash
pulumi destroy --yes
```
