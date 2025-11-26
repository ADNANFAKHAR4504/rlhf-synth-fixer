# Task: Payment Processing Web Application Infrastructure

## Platform and Language (MANDATORY)
Create infrastructure using **Terraform with HCL**.

## Background
A fintech startup needs to deploy their payment processing web application with strict compliance requirements for PCI DSS. The application handles sensitive credit card data and requires end-to-end encryption, audit logging, and automated failover capabilities.

## Problem Statement
Create a Terraform configuration to deploy a highly available payment processing web application. The configuration must:

1. Create a VPC with public and private subnets across 3 availability zones.
2. Deploy ECS Fargate service running containerized web application with auto-scaling (min: 3, max: 10 tasks).
3. Configure Application Load Balancer with HTTPS listener using ACM certificate.
4. Provision Aurora MySQL cluster with Multi-AZ deployment and encryption.
5. Implement CloudWatch Logs for ECS tasks with custom metric filters for error monitoring.
6. Configure auto-scaling policies based on CPU and memory utilization.
7. Create S3 bucket for static assets with CloudFront distribution.
8. Set up VPC endpoints for S3 and ECR to avoid internet traffic.
9. Implement AWS WAF rules on ALB for SQL injection and XSS protection.
10. Configure Route 53 health checks with failover routing policy.

Expected output: Complete Terraform configuration files that deploy production-ready infrastructure meeting all PCI compliance requirements with automated scaling and high availability across multiple AZs.

## Constraints

1. All data must be encrypted at rest using AWS KMS customer-managed keys
2. Database connections must use SSL/TLS with certificate validation
3. Application logs cannot contain any PII or credit card information
4. All resources must be deployed in private subnets with no direct internet access
5. Auto-scaling must maintain minimum 3 instances across availability zones
6. Database must have automated backups with point-in-time recovery enabled
7. Load balancer must terminate SSL with ACM certificates only
8. Security groups must follow least-privilege with no 0.0.0.0/0 inbound rules
9. All IAM roles must use external ID for cross-account access
10. Resources must be tagged with Environment, CostCenter, and Compliance tags

## Environment
Production infrastructure deployed in us-east-1 region using ECS Fargate for containerized web application, Application Load Balancer for HTTPS termination, and RDS Aurora MySQL for transaction storage. VPC spans 3 availability zones with private subnets for compute and database tiers, public subnets for ALB only. NAT Gateways provide outbound internet access for private resources. Requires Terraform 1.5+, AWS provider 5.x, and pre-configured AWS credentials with AdministratorAccess. KMS keys for encryption at rest, ACM for SSL certificates.

## Critical Requirements for Infrastructure Code

### Resource Naming
- ALL named resources MUST include `${var.environment_suffix}` or `var.environment_suffix` in their names
- Pattern: `resource-name-${var.environment_suffix}`
- This is MANDATORY to prevent naming conflicts across parallel deployments

### Destroyability
- NO resources with deletion protection enabled
- NO retention policies that prevent destruction
- All resources must be cleanly destroyable for CI/CD cleanup

### Infrastructure Best Practices from lessons_learnt.md

#### GuardDuty
- DO NOT create GuardDuty detectors (account-level resource, one per account)
- Document manual setup requirement if needed

#### AWS Config
- If using AWS Config, use correct managed policy: `arn:aws:iam::aws:policy/service-role/AWS_ConfigRole`
- Alternative: Use service-linked role `AWSServiceRoleForConfig`

#### Lambda Functions
- For Node.js 18.x+: Avoid AWS SDK v2 dependency (not included by default)
- Use AWS SDK v3 or extract data from event object

#### Cost Optimization
- Prefer Aurora Serverless v2 over provisioned Multi-AZ for faster provisioning
- Minimize NAT Gateways (prefer VPC endpoints for S3, DynamoDB, ECR)
- Use appropriate retention periods for CloudWatch Logs (7-14 days for synthetic tasks)

#### Security
- Implement IAM least privilege
- Enable encryption at rest with KMS
- Use SSL/TLS for database connections
- Follow PCI DSS compliance requirements

## Deployment Validation Checklist
Before deployment:
- [ ] All resource names include environment_suffix
- [ ] No deletion protection enabled
- [ ] No RETAIN policies configured
- [ ] Security groups follow least-privilege
- [ ] Encryption enabled for data at rest
- [ ] SSL/TLS configured for database connections
- [ ] All required tags applied (Environment, CostCenter, Compliance)
