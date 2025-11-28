# Task: Deploy Loan Processing Web Application Infrastructure

## Problem Statement
Create a Terraform configuration to deploy a loan processing web application infrastructure. The configuration must: 1. Create a VPC with 3 public and 3 private subnets across 3 availability zones. 2. Deploy an ECS cluster with Fargate launch type running the loan processing API (CORE: ECS). 3. Configure Aurora PostgreSQL Serverless v2 with 0.5-1 ACU scaling and point-in-time recovery (CORE: Aurora). 4. Set up an Application Load Balancer with path-based routing to different ECS services. 5. Implement Auto Scaling for ECS services based on CPU and memory metrics. 6. Configure CloudWatch Container Insights for ECS cluster monitoring. 7. Create S3 buckets for application logs and loan documents with lifecycle policies. 8. Set up CloudFront distribution for static assets with S3 origin. 9. Implement AWS WAF rules on ALB for SQL injection and XSS protection. 10. Configure EventBridge scheduled rules for nightly batch processing tasks.


## Background
A financial services company requires infrastructure for a loan processing web application with high availability, security, and compliance requirements.

## Environment
Production deployment in us-east-1 region. Infrastructure will support a containerized loan processing application using ECS Fargate, with Aurora PostgreSQL for data persistence and comprehensive security controls.

## Security & Compliance Requirements
- All data must be encrypted at rest using customer-managed KMS keys with automatic rotation enabled
- RDS instances must use IAM database authentication instead of password-based authentication
- ALB must terminate TLS with AWS Certificate Manager certificates and enforce TLS 1.2 minimum
- Auto Scaling Groups must use mixed instance types with at least 20% spot instances for cost optimization
- All compute resources must be deployed in private subnets with no direct internet access

## Expected Deliverables
1. Complete Terraform configuration files (main.tf, variables.tf, outputs.tf)
2. All core services properly configured (ECS, Aurora, ALB, VPC)
3. Security controls implemented (KMS, IAM, WAF, private subnets)
4. Auto-scaling and monitoring configured
5. Infrastructure that passes all compliance and security checks

## Validation Criteria
- VPC with proper subnet configuration across 3 AZs
- ECS Fargate cluster with Container Insights enabled
- Aurora PostgreSQL Serverless v2 with encryption and IAM auth
- ALB with TLS termination and WAF protection
- All resources in private subnets with proper security groups
- CloudFront distribution for static assets
- EventBridge scheduled rules for batch processing
- S3 buckets with lifecycle policies and encryption
- All resources following infrastructure as code best practices
