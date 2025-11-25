# Healthcare Multi-Region Disaster Recovery Infrastructure

This Pulumi TypeScript implementation provides a comprehensive multi-region disaster recovery infrastructure for a healthcare SaaS platform spanning US-East-1 (primary) and US-West-2 (DR) regions with automatic failover capabilities.

## Architecture Overview

### Global Components
- **Aurora Global Database**: PostgreSQL 14.6 with automated replication
- **Route53 Hosted Zone**: Failover routing with health checks
- **VPC Peering**: Cross-region connectivity between us-east-1 and us-west-2

### Regional Components (per region)
- **VPC**: Isolated network with 3 AZs, public/private subnets, NAT Gateways
- **Aurora Cluster**: 1 instance per region (cost-optimized)
- **Lambda Functions**: Application endpoints with /health checks
- **Application Load Balancer**: HTTP listener on port 80
- **S3 Bucket**: Cross-region replication enabled
- **EventBridge**: Cross-region event forwarding
- **CloudWatch Alarms**: Comprehensive monitoring

## Prerequisites

- AWS Account with appropriate permissions
- Pulumi CLI (v3.x or later)
- Node.js 16+ and npm/yarn
- AWS CLI configured with credentials

## Deployment

### 1. Install Dependencies
