# Payment Processing Infrastructure

This Pulumi TypeScript project deploys a PCI-compliant payment processing infrastructure on AWS.

## Architecture

The infrastructure consists of:

1. **Network Stack**: VPC with 3 public and 3 private subnets across 3 availability zones, NAT gateways, and VPC endpoints for S3, ECR, and CloudWatch Logs
2. **Security Stack**: KMS keys with automatic rotation for RDS, S3, and CloudWatch Logs encryption, plus IAM roles for ECS tasks
3. **Storage Stack**: S3 buckets with versioning, lifecycle policies, and KMS encryption for static assets and audit logs
4. **Database Stack**: Aurora PostgreSQL Multi-AZ cluster with 2 reader instances, automated backups, and encrypted storage
5. **Monitoring Stack**: CloudWatch Log Groups with 365-day retention for ECS tasks, RDS slow queries, and audit logs
6. **Compute Stack**: ECS Fargate service with Application Load Balancer and AWS WAF rules blocking SQL injection and XSS
7. **Backup Stack**: AWS Backup plans with 30-day retention and cross-region copies to us-west-2

## Prerequisites

- Pulumi CLI 3.x or later
- Node.js 18 or later
- AWS CLI configured with appropriate credentials
- AWS account with permissions to create VPC, ECS, RDS, S3, KMS, WAF, and Backup resources

## Deployment

### Environment Variables

Set the `ENVIRONMENT_SUFFIX` environment variable to distinguish between environments:
