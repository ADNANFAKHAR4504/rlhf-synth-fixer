# Multi-Region Disaster Recovery Architecture

This Terraform configuration implements a production-ready multi-region disaster recovery solution for a transaction processing application with RPO < 1 hour and RTO < 4 hours.

## Architecture Overview

### Components

- **Primary Region**: us-east-1 (Active)
- **Secondary Region**: us-west-2 (Standby/DR)

### Infrastructure

1. **Database**: Aurora PostgreSQL Global Database
   - Writer in us-east-1
   - Read replicas in both regions
   - Automated backups with 7-day retention
   - Point-in-time recovery enabled

2. **Compute**: EC2 Auto Scaling Groups
   - Minimum 2 instances per region
   - Target tracking scaling based on CPU
   - Launch templates with CloudWatch agent

3. **Load Balancing**: Application Load Balancers
   - ALB in each region
   - Health checks on /health endpoint
   - HTTP/HTTPS listeners

4. **DNS Failover**: Route 53
   - Hosted zone with failover routing
   - Health checks for both ALBs
   - Automatic failover on primary failure

5. **Storage**: S3 with Cross-Region Replication
   - Replication Time Control (RTC) enabled
   - 15-minute RTC SLA
   - Versioning enabled

6. **Networking**: Multi-VPC with Peering
   - 3 AZs per region
   - VPC peering for cross-region communication
   - Public, private, and database subnets

7. **Monitoring**: CloudWatch
   - Cross-region dashboards
   - Alarms for database lag, instance health, replication status
   - SNS notifications

8. **Backup**: AWS Backup
   - Daily backups in both regions
   - 7-day retention
   - Cross-region backup copies

## Prerequisites

- Terraform >= 1.5.0
- AWS CLI configured with appropriate credentials
- IAM permissions for multi-region resource creation
- Valid domain name for Route 53

## Deployment

### 1. Initialize Terraform

