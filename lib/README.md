# Financial Services Web Portal Infrastructure

This Terraform configuration deploys a production-ready, highly available infrastructure for a financial services web portal on AWS.

## Architecture Overview

The infrastructure includes:

- **VPC**: Multi-AZ VPC with public, private, and database subnets
- **ECS Fargate**: Container orchestration with auto-scaling (Spot + On-Demand)
- **Aurora Serverless v2**: PostgreSQL database with read replicas
- **Application Load Balancer**: SSL termination and path-based routing
- **CloudFront**: CDN with geo-blocking capabilities
- **WAF**: SQL injection and XSS protection
- **Route53**: Health checks with failover routing
- **CloudWatch**: Comprehensive monitoring and alerting
- **KMS**: Customer-managed encryption keys

## Prerequisites

- Terraform >= 1.0
- AWS CLI configured with appropriate credentials
- AWS account with necessary permissions
- Domain name for SSL certificate (or use AWS-generated for testing)

## Quick Start

1. **Clone the repository and navigate to the lib directory**

```bash
cd lib

3. **Copy and customize the variables file**

```bash
cp terraform.tfvars.example terraform.tfvars
# Edit terraform.tfvars with your values

5. **Deploy the infrastructure**

```bash
terraform apply -var-file=terraform.tfvars

Key metrics monitored:
- ECS CPU and memory utilization
- ALB request count and response times
- RDS connections and latency
- CloudFront requests and errors
- WAF allowed/blocked requests

## Outputs

After deployment, retrieve important information:

```bash
# ALB DNS name
terraform output alb_dns_name

# CloudFront distribution domain
terraform output cloudfront_distribution_domain

# RDS endpoints
terraform output rds_cluster_endpoint
terraform output rds_cluster_reader_endpoint

# Database password (if auto-generated)
terraform output -raw db_password

**Warning**: This will permanently delete all resources including databases and logs.

## Support

For issues or questions:
1. Check CloudWatch logs for application errors
2. Review VPC flow logs for network issues
3. Monitor WAF logs for blocked requests
4. Check ECS service events for task failures

## License

Copyright (c) 2025. All rights reserved.
