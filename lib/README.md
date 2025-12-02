# Multi-Environment Payment Processing Infrastructure

This Pulumi Python program deploys a complete multi-environment API infrastructure for payment processing across development, staging, and production environments.

## Architecture

The infrastructure consists of:

- **VPC**: Private subnets with NAT Gateway and VPC endpoints for DynamoDB and S3
- **DynamoDB**: Tables for transactions and sessions with environment-specific capacity
- **S3**: Buckets for API logs with lifecycle policies
- **Lambda**: Payment processor and session manager functions
- **API Gateway**: REST API with Lambda integrations and throttling
- **Route53**: DNS management with environment-specific domains
- **ACM**: SSL/TLS certificates for HTTPS
- **CloudFront**: CDN distributions for global content delivery

## Environment Configuration

### Development (dev)
- DynamoDB: 5 read/5 write capacity units
- Lambda: 512MB memory, 30s timeout
- S3 log retention: 7 days
- API throttling: 250 req/s, 500 burst
- Domain: dev.api.example.com

### Staging (staging)
- DynamoDB: 25 read/25 write capacity units (with PITR)
- Lambda: 1024MB memory, 60s timeout
- S3 log retention: 30 days
- API throttling: 1000 req/s, 2000 burst
- Domain: staging.api.example.com

### Production (prod)
- DynamoDB: 100 read/100 write capacity units (with PITR)
- Lambda: 3008MB memory, 120s timeout
- S3 log retention: 90 days
- API throttling: 2500 req/s, 5000 burst
- Domain: api.example.com

## Prerequisites

- Pulumi CLI 3.x
- Python 3.8+
- AWS CLI configured with appropriate credentials
- Three AWS accounts (or separate AWS profiles) for dev, staging, and prod

## Installation

1. Install dependencies: