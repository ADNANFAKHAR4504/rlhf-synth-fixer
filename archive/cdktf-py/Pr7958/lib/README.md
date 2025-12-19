# Multi-Region Failover Infrastructure for Trading Platform

This CDKTF Python implementation provides automated regional failover for a high-availability trading platform.

## Architecture Overview

The infrastructure spans two AWS regions (us-east-1 and us-east-2) with the following components:

### Networking
- VPCs in both regions (10.0.0.0/16 and 10.1.0.0/16)
- Public and private subnets across multiple availability zones
- VPC peering between regions for cross-region communication
- Security groups for ALB, application servers, databases, and Lambda functions

### Database
- Aurora MySQL Global Database with clusters in both regions
- Automated backups and point-in-time recovery
- Cross-region replication with low latency
- 2 instances per cluster for high availability

### Compute
- Application Load Balancers in both regions
- Auto Scaling groups with EC2 instances
- Automatic scaling based on demand
- Health checks and automatic instance replacement

### Session State
- DynamoDB global tables for session management
- Automatic replication between regions
- PAY_PER_REQUEST billing for cost efficiency

### Storage
- S3 buckets with cross-region replication
- Versioning enabled for data protection
- Automated replication of all objects

### Failover Orchestration
- Lambda functions for automated failover
- Health check validation every minute
- Automatic failover trigger on primary region failure
- Manual failover capability via Lambda invocation

### Monitoring
- CloudWatch alarms for critical metrics
- SNS notifications for alerts
- Monitoring for ALB health, ASG capacity, database performance
- Replication lag monitoring

### Traffic Management
- Route 53 with failover routing policy
- Health checks every 30 seconds
- Automatic DNS failover on primary region failure
- Latency-based routing for optimal performance

## Deployment

### Prerequisites
- Python 3.11 or later
- Node.js 18 or later (for CDKTF)
- AWS CLI configured with appropriate credentials
- Terraform installed

### Installation

1. Install dependencies:
